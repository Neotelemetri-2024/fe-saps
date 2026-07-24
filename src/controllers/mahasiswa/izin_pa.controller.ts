import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

// 1. Mengajukan Izin PA
export const ajukanIzinPA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { kegiatanId, kategoriId, namaKegiatan, penyelenggara, peranId, tanggalPelaksanaan } = req.body;

    if (!peranId) {
      return res.status(400).json({ success: false, message: 'Peran wajib dipilih' });
    }

    if (!kegiatanId && (!kategoriId || !namaKegiatan || !penyelenggara || !tanggalPelaksanaan)) {
      return res.status(400).json({ success: false, message: 'Jika kegiatan diinput manual, semua kolom wajib diisi' });
    }

    // Cek Mahasiswa dan Dosen PA
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!mahasiswa || !mahasiswa.dosenPaId) {
      return res.status(400).json({ success: false, message: 'Anda belum memiliki Dosen PA' });
    }

    // Ambil Kurikulum Aktif (untuk kegiatan manual)
    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' }
    });

    if (!kegiatanId && !kurikulumAktif) {
      return res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif' });
    }

    // Default Skala (Misal: Regional / Nasional) - UI tidak mengirim ini
    const skala = await prisma.mpSkala.findFirst();

    const result = await prisma.$transaction(async (tx: any) => {
      let usedKegiatanId = kegiatanId ? parseInt(kegiatanId) : null;

      if (!usedKegiatanId) {
        // 1. Buat Kegiatan Eksternal (Mandiri)
        const kegiatan = await tx.kegiatan.create({
          data: {
            nama: namaKegiatan,
            kategoriId: parseInt(kategoriId),
            skalaId: req.body.skalaId ? parseInt(req.body.skalaId) : (skala ? skala.id : 1),
            asal: 'eksternal',
            tanggalMulai: new Date(tanggalPelaksanaan),
            tanggalSelesai: new Date(tanggalPelaksanaan),
            penyelenggaraExt: penyelenggara,
            kurikulumId: kurikulumAktif!.id,
            dibuatOleh: BigInt(userId),
            status: 'draft',
          }
        });
        usedKegiatanId = kegiatan.id;
      } else {
        // Cek jika kegiatanId ada
        const existingKegiatan = await tx.kegiatan.findUnique({ where: { id: usedKegiatanId } });
        if (!existingKegiatan) {
          throw new Error('Kegiatan yang dipilih tidak ditemukan');
        }
      }

      // 2. Buat atau Update Partisipasi
      let partisipasi = await tx.partisipasi.findUnique({
        where: { kegiatanId_mahasiswaId: { kegiatanId: usedKegiatanId, mahasiswaId: BigInt(userId) } }
      });

      if (!partisipasi) {
        partisipasi = await tx.partisipasi.create({
          data: {
            kegiatanId: usedKegiatanId,
            mahasiswaId: BigInt(userId),
            status: 'menunggu_izin_pa'
          }
        });
      } else {
        partisipasi = await tx.partisipasi.update({
          where: { id: partisipasi.id },
          data: { status: 'menunggu_izin_pa' }
        });
      }

      // 3. Simpan atau Update Peran di Klaim Poin (Draft)
      let klaim = await tx.klaimPoin.findFirst({
        where: { partisipasiId: partisipasi.id }
      });

      if (!klaim) {
        await tx.klaimPoin.create({
          data: {
            partisipasiId: partisipasi.id,
            peranUsulanId: parseInt(peranId),
            status: 'draft'
          }
        });
      } else {
        await tx.klaimPoin.update({
          where: { id: klaim.id },
          data: { peranUsulanId: parseInt(peranId) }
        });
      }

      // 4. Buat Izin PA
      const izin = await tx.izinPA.create({
        data: {
          partisipasiId: partisipasi.id,
          dosenPaId: mahasiswa.dosenPaId,
          status: 'diajukan'
        }
      });

      return izin;
    });

    res.status(201).json({
      success: true,
      message: 'Izin berhasil diajukan ke Dosen PA',
      data: {
        izinPaId: result.id.toString(),
        partisipasiId: result.partisipasiId.toString()
      }
    });

  } catch (error: any) {
    if (error.message === 'Kegiatan yang dipilih tidak ditemukan') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// 2. Mengambil Riwayat Izin PA
export const getRiwayatIzin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status } = req.query; // opsi filter: diajukan, disetujui, ditolak

    const whereClause: any = {
      partisipasi: {
        mahasiswaId: BigInt(userId)
      }
    };

    if (status) {
      whereClause.status = status;
    }

    const riwayat = await prisma.izinPA.findMany({
      where: whereClause,
      include: {
        partisipasi: {
          include: {
            kegiatan: {
              include: {
                kategori: true
              }
            },
            klaimPoin: {
              include: {
                peranUsulan: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Formatting response agar mudah dipakai Frontend
    const formattedData = riwayat.map((item: any) => ({
      id: item.id.toString(),
      statusIzin: item.status,
      alasanDitolak: item.alasan,
      tanggalDiajukan: item.createdAt,
      kegiatan: {
        id: item.partisipasi.kegiatan.id,
        nama: item.partisipasi.kegiatan.nama,
        kategori: item.partisipasi.kegiatan.kategori.nama,
        penyelenggara: item.partisipasi.kegiatan.penyelenggaraExt,
        tanggalMulai: item.partisipasi.kegiatan.tanggalMulai,
      },
      peran: item.partisipasi.klaimPoin ? item.partisipasi.klaimPoin.peranUsulan?.nama : '-'
    }));

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil riwayat Izin PA',
      data: formattedData
    });
  } catch (error: any) {
    next(error);
  }
};

// 3. Mengambil Catatan Dosen PA (Saran PA)
export const getCatatanPA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const catatan = await prisma.saranPA.findMany({
      where: {
        mahasiswaId: BigInt(userId)
      },
      orderBy: {
        id: 'desc' // terbaru di atas
      }
    });

    // Convert BigInt to String
    const formattedCatatan = catatan.map((c: any) => ({
      id: c.id.toString(),
      isi: c.isi,
      dosenPaId: c.dosenPaId.toString()
    }));

    res.status(200).json({
      success: true,
      message: 'Berhasil mengambil catatan Dosen PA',
      data: formattedCatatan
    });
  } catch (error: any) {
    next(error);
  }
};
