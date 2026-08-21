import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { NotifikasiService } from '../../services/notifikasi.service';

// 1. Mengajukan Izin PA (dari Riwayat Kegiatan Internal maupun Katalog)
export const ajukanIzinPA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { partisipasiId, kegiatanId, peranId } = req.body;

    if (!partisipasiId && !kegiatanId) {
      return res.status(400).json({ success: false, message: 'Harap sertakan ID partisipasi atau ID kegiatan' });
    }

    // Cek Mahasiswa dan Dosen PA
    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: BigInt(userId) },
      include: {
        user: { select: { nama: true } }
      }
    });

    if (!mahasiswa || !mahasiswa.dosenPaId) {
      return res.status(400).json({ success: false, message: 'Anda belum memiliki Dosen PA' });
    }

    let targetPartisipasi: any = null;
    let targetKegiatan: any = null;

    if (partisipasiId) {
      targetPartisipasi = await prisma.partisipasi.findUnique({
        where: { id: BigInt(partisipasiId) },
        include: { kegiatan: true }
      });
      if (!targetPartisipasi || targetPartisipasi.mahasiswaId !== BigInt(userId)) {
        return res.status(404).json({ success: false, message: 'Partisipasi kegiatan tidak ditemukan.' });
      }
      targetKegiatan = targetPartisipasi.kegiatan;
    } else if (kegiatanId) {
      const usedKegiatanId = parseInt(kegiatanId);
      targetKegiatan = await prisma.kegiatan.findUnique({ where: { id: usedKegiatanId } });
      if (!targetKegiatan) {
        return res.status(404).json({ success: false, message: 'Kegiatan yang dipilih tidak ditemukan.' });
      }
      targetPartisipasi = await prisma.partisipasi.findUnique({
        where: { kegiatanId_mahasiswaId: { kegiatanId: usedKegiatanId, mahasiswaId: BigInt(userId) } }
      });
    }

    if (targetKegiatan.status !== 'disetujui' && targetKegiatan.status !== 'terpublikasi') {
      return res.status(400).json({ success: false, message: 'Hanya kegiatan yang telah disetujui yang dapat diajukan izin PA.' });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Buat atau Update Partisipasi
      let partisipasi = targetPartisipasi;
      if (!partisipasi) {
        partisipasi = await tx.partisipasi.create({
          data: {
            kegiatanId: targetKegiatan.id,
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

      // 2. Simpan atau Update Peran di Klaim Poin jika ada peranId
      const finalPeranId = peranId ? parseInt(peranId) : (partisipasi.peranVerifId || null);
      if (finalPeranId) {
        let klaim = await tx.klaimPoin.findFirst({
          where: { partisipasiId: partisipasi.id }
        });

        if (!klaim) {
          await tx.klaimPoin.create({
            data: {
              partisipasiId: partisipasi.id,
              peranUsulanId: finalPeranId,
              status: 'draft'
            }
          });
        } else {
          await tx.klaimPoin.update({
            where: { id: klaim.id },
            data: { peranUsulanId: finalPeranId }
          });
        }
      }

      // 3. Buat atau Update Izin PA
      let izin = await tx.izinPA.findFirst({
        where: { partisipasiId: partisipasi.id }
      });

      if (izin) {
        izin = await tx.izinPA.update({
          where: { id: izin.id },
          data: {
            status: 'diajukan',
            dosenPaId: mahasiswa.dosenPaId,
            alasan: null
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

    // Kirim notifikasi ke Dosen PA
    try {
      await NotifikasiService.kirim({
        userId: mahasiswa.dosenPaId,
        judul: 'Permohonan Izin Kegiatan Mahasiswa 📋',
        isi: `${mahasiswa.user.nama} mengajukan permohonan izin untuk mengikuti kegiatan "${targetKegiatan.nama}".`,
        refType: 'izin_pa',
        refId: result.id,
      });
    } catch (err) {
      console.error('[ajukanIzinPA] Gagal kirim notifikasi Dosen PA:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Izin berhasil diajukan ke Dosen PA',
      data: {
        izinPaId: result.id.toString(),
        partisipasiId: result.partisipasiId.toString()
      }
    });

  } catch (error: any) {
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
