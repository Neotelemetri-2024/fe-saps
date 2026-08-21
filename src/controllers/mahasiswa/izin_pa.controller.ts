import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

const ASAL_INTERNAL = ['kurikuler_ukm', 'kurikuler_ukmf', 'universitas'] as const;

function isAsalInternal(asal: string | null | undefined) {
  return !!asal && (ASAL_INTERNAL as readonly string[]).includes(asal);
}

// 1. Mengajukan Izin PA
export const ajukanIzinPA = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { kegiatanId, peranId, kategoriId, penyelenggara, tanggalPelaksanaan } = req.body;

    if (!kegiatanId) {
      return res.status(400).json({ success: false, message: 'Harap pilih kegiatan' });
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
      const existingKegiatan = await tx.kegiatan.findUnique({ where: { id: usedKegiatanId } });
      if (!existingKegiatan) {
        throw new Error('Kegiatan yang dipilih tidak ditemukan');
      }

      const internal = isAsalInternal(existingKegiatan.asal);

      if (!internal) {
        if (existingKegiatan.status !== 'disetujui' && existingKegiatan.status !== 'terpublikasi') {
          throw new Error('Hanya kegiatan yang telah disetujui yang dapat diajukan izin PA');
        }
        if (!peranId) {
          throw new Error('Harap pilih peran');
        }
      }

      let partisipasi = await tx.partisipasi.findUnique({
        where: { kegiatanId_mahasiswaId: { kegiatanId: usedKegiatanId, mahasiswaId: BigInt(userId) } }
      });

      let usedPeranId: number;

      if (internal) {
        if (!partisipasi) {
          throw new Error('Anda belum terdaftar sebagai peserta kegiatan ini');
        }
        if (partisipasi.kehadiran !== true) {
          throw new Error('Kehadiran Anda belum tercatat. Hubungi penyelenggara kegiatan.');
        }
        if (!partisipasi.peranVerifId) {
          throw new Error('Peran Anda belum ditetapkan oleh penyelenggara kegiatan.');
        }

        const izinDisetujui = await tx.izinPA.findFirst({
          where: { partisipasiId: partisipasi.id, status: 'disetujui' },
          orderBy: { createdAt: 'desc' },
        });
        if (izinDisetujui) {
          throw new Error('Izin PA untuk kegiatan ini sudah disetujui');
        }

        const izinDiajukan = await tx.izinPA.findFirst({
          where: { partisipasiId: partisipasi.id, status: 'diajukan' },
          orderBy: { createdAt: 'desc' },
        });
        if (izinDiajukan) {
          throw new Error('Izin PA untuk kegiatan ini sudah diajukan dan sedang menunggu keputusan Dosen PA');
        }

        usedPeranId = partisipasi.peranVerifId;
        partisipasi = await tx.partisipasi.update({
          where: { id: partisipasi.id },
          data: { status: 'menunggu_izin_pa' }
        });
      } else {
        usedPeranId = parseInt(peranId);

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
      }

      // Simpan atau Update Peran di Klaim Poin (Draft)
      let klaim = await tx.klaimPoin.findFirst({
        where: { partisipasiId: partisipasi.id }
      });

      if (!klaim) {
        await tx.klaimPoin.create({
          data: {
            partisipasiId: partisipasi.id,
            peranUsulanId: usedPeranId,
            status: 'draft'
          }
        });
      } else {
        await tx.klaimPoin.update({
          where: { id: klaim.id },
          data: {
            peranUsulanId: usedPeranId,
            // Jaga draft sampai gate berikutnya (PA / klaim admin) kecuali sudah final
            ...(klaim.status === 'disetujui' ? {} : { status: 'draft' as const }),
          }
        });
      }

      // Buat atau Update Izin PA (mencegah duplikasi aktif)
      let izin = await tx.izinPA.findFirst({
        where: { partisipasiId: partisipasi.id },
        orderBy: { createdAt: 'desc' },
      });

      if (izin && izin.status !== 'disetujui') {
        izin = await tx.izinPA.update({
          where: { id: izin.id },
          data: {
            status: 'diajukan',
            dosenPaId: mahasiswa.dosenPaId,
            alasan: null,
            decidedAt: null,
          }
        });
      } else if (!izin || izin.status === 'disetujui') {
        // Belum ada, atau yang lama sudah disetujui → buat baru (pengajuan ulang tidak relevan jika sudah disetujui)
        if (izin?.status === 'disetujui') {
          throw new Error('Izin PA untuk kegiatan ini sudah disetujui');
        }
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
    const known = [
      'Kegiatan yang dipilih tidak ditemukan',
      'Hanya kegiatan yang telah disetujui yang dapat diajukan izin PA',
      'Harap pilih peran',
      'Anda belum terdaftar sebagai peserta kegiatan ini',
      'Kehadiran Anda belum tercatat. Hubungi penyelenggara kegiatan.',
      'Peran Anda belum ditetapkan oleh penyelenggara kegiatan.',
      'Izin PA untuk kegiatan ini sudah disetujui',
      'Izin PA untuk kegiatan ini sudah diajukan dan sedang menunggu keputusan Dosen PA',
    ];
    if (known.includes(error.message)) {
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
            asal: kg.asal,
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
