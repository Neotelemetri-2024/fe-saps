import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

// 1. Mengajukan Izin PA
export const ajukanIzinPA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { kegiatanId, peranId, kategoriId, penyelenggara, tanggalPelaksanaan } = req.body;

    if (!kegiatanId || !peranId) {
      return res.status(400).json({ success: false, message: 'Harap pilih kegiatan dan peran' });
    }

    // Cek Mahasiswa dan Dosen PA
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: BigInt(userId) },
    });

    if (!mahasiswa || !mahasiswa.dosenPaId) {
      return res.status(400).json({ success: false, message: 'Anda belum memiliki Dosen PA' });
    }

    const usedKegiatanId = parseInt(kegiatanId);

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Cek jika kegiatanId ada dan sudah disetujui
      const existingKegiatan = await tx.kegiatan.findUnique({ where: { id: usedKegiatanId } });
      if (!existingKegiatan) {
        throw new Error('Kegiatan yang dipilih tidak ditemukan');
      }

      if (existingKegiatan.status !== 'disetujui' && existingKegiatan.status !== 'terpublikasi') {
         throw new Error('Hanya kegiatan yang telah disetujui yang dapat diajukan izin PA');
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

      // 4. Buat atau Update Izin PA (mencegah duplikasi)
      let izin = await tx.izinPA.findFirst({
        where: { partisipasiId: partisipasi.id }
      });

      if (izin) {
        izin = await tx.izinPA.update({
          where: { id: izin.id },
          data: {
            status: 'diajukan',
            dosenPaId: mahasiswa.dosenPaId,
            alasan: null // Hapus alasan revisi sebelumnya
          }
        });
      } else {
        izin = await tx.izinPA.create({
          data: {
            partisipasiId: partisipasi.id,
            dosenPaId: mahasiswa.dosenPaId,
            status: 'diajukan'
          }
        });
      }

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
    if (error.message === 'Kegiatan yang dipilih tidak ditemukan' || error.message === 'Hanya kegiatan yang telah disetujui yang dapat diajukan izin PA') {
      return res.status(400).json({ success: false, message: error.message });
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
                kategori: true,
                skala: true,
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
    const formattedData = riwayat
      .filter((item: any) => item.partisipasi && item.partisipasi.kegiatan)
      .map((item: any) => {
        const kg = item.partisipasi.kegiatan;
        const klaim = item.partisipasi.klaimPoin;
        // Sudah diklaim jika KlaimPoin sudah ada bukti (bukan hanya draft)
        const sudahDiklaim = klaim ? (klaim.status !== 'draft') : false;
        return {
          id: item.id.toString(),
          partisipasiId: item.partisipasi.id.toString(),
          statusIzin: item.status,
          alasanDitolak: item.alasan,
          tanggalDiajukan: item.createdAt,
          sudahDiklaim,
          kegiatan: {
            id: kg.id,
            nama: kg.nama,
            kategori: kg.kategori?.nama,
            kategoriId: kg.kategoriId,
            skalaId: kg.skalaId,
            penyelenggara: kg.penyelenggaraExt,
            tanggalMulai: kg.tanggalMulai,
            deskripsi: kg.deskripsi,
            linkPenyelenggara: kg.linkPenyelenggara,
            emailPenyelenggara: kg.emailPenyelenggara,
          },
          peran: klaim ? klaim.peranUsulan?.nama : '-',
          peranId: klaim ? klaim.peranUsulanId?.toString() : null,
        };
      });

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
