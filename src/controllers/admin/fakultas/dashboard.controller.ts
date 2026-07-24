import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';

// GET /api/dashboard/admin-fakultas — Dashboard Admin Fakultas
export const getDashboardFakultas = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Ambil data admin fakultas
    const staff = await prisma.staff.findUnique({
      where: { userId: BigInt(userId) },
      include: { fakultas: true }
    });

    if (!staff || !staff.fakultasId) {
      res.status(403).json({ success: false, message: 'Akses Ditolak: Anda bukan Admin Fakultas' });
      return;
    }

    const fakultasId = staff.fakultasId;
    const namaFakultas = staff.fakultas?.nama || 'Fakultas';

    // 1. Ambil 4 Metrik Kartu (Berdasarkan kegiatan dari UKMF di fakultas ini)
    const [pendingCount, disetujuiCount, menungguPimpinanCount, ditolakCount] = await Promise.all([
      // PENDING: diajukan
      prisma.kegiatan.count({
        where: {
          status: 'diajukan',
          organisasi: {
            tipe: 'UKMF',
            fakultasId: fakultasId
          }
        }
      }),
      // DISETUJUI: disetujui
      prisma.kegiatan.count({
        where: {
          status: 'disetujui',
          organisasi: {
            tipe: 'UKMF',
            fakultasId: fakultasId
          }
        }
      }),
      // MENUNGGU PIMPINAN: terverifikasi
      prisma.kegiatan.count({
        where: {
          status: 'terverifikasi',
          organisasi: {
            tipe: 'UKMF',
            fakultasId: fakultasId
          }
        }
      }),
      // DITOLAK: ditolak
      prisma.kegiatan.count({
        where: {
          status: 'ditolak',
          organisasi: {
            tipe: 'UKMF',
            fakultasId: fakultasId
          }
        }
      })
    ]);

    // 2. Riwayat Terbaru Pengajuan Kegiatan dari UKMF (limit 10)
    const riwayatTerbaru = await prisma.kegiatan.findMany({
      where: {
        organisasi: {
          tipe: 'UKMF',
          fakultasId: fakultasId
        }
      },
      include: {
        kategori: { select: { nama: true } },
        skala: { select: { nama: true } },
        organisasi: { select: { nama: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const tabelRiwayat = riwayatTerbaru.map((k) => {
      let statusStr = 'Pending';
      if (k.status === 'disetujui' || k.status === 'terpublikasi') statusStr = 'Aktif';
      else if (k.status === 'ditolak') statusStr = 'Ditolak';
      else if (k.status === 'perlu_revisi') statusStr = 'Revisi';
      else if (k.status === 'draft') statusStr = 'Draft';
      else if (k.status === 'terverifikasi') statusStr = 'Verifikasi Admin';

      return {
        id: k.id,
        ukm: k.organisasi?.nama || '-',
        namaKegiatan: k.nama,
        kategori: k.kategori?.nama || '-',
        skala: k.skala?.nama || '-',
        tanggalMulai: k.tanggalMulai,
        tanggalSelesai: k.tanggalSelesai,
        status: statusStr
      };
    });

    // 3. Data Grafik Rata-rata Capaian per Prodi
    // Mengambil rata-rata perolehan poin per kategori (Organisasi, Seminar, Prestasi) untuk tiap Prodi di fakultas ini
    
    // a. Ambil daftar prodi di fakultas ini
    const prodis = await prisma.programStudi.findMany({
      where: { fakultasId: fakultasId },
      select: { id: true, nama: true }
    });

    const grafikData = await Promise.all(
      prodis.map(async (prodi) => {
        let sumOrganisasi = 0, sumSeminar = 0, sumPrestasi = 0;
        let mhsCountOrganisasi = new Set(), mhsCountSeminar = new Set(), mhsCountPrestasi = new Set();

        const perolehans = await prisma.perolehanPoin.findMany({
          where: {
            mahasiswa: { prodiId: prodi.id },
            status: 'sah' // pastikan poin sah
          },
          include: {
            kegiatan: {
              include: {
                kategori: true
              }
            }
          }
        });

        for (const p of perolehans) {
          const catName = p.kegiatan?.kategori?.nama?.toLowerCase() || '';
          if (catName.includes('organisasi')) {
            sumOrganisasi += p.totalPoin;
            mhsCountOrganisasi.add(p.mahasiswaId.toString());
          } else if (catName.includes('seminar') || catName.includes('ilmiah')) {
            sumSeminar += p.totalPoin;
            mhsCountSeminar.add(p.mahasiswaId.toString());
          } else if (catName.includes('prestasi') || catName.includes('kompetisi') || catName.includes('lomba')) {
            sumPrestasi += p.totalPoin;
            mhsCountPrestasi.add(p.mahasiswaId.toString());
          }
        }

        return {
          prodi: prodi.nama,
          organisasi: mhsCountOrganisasi.size > 0 ? Math.round(sumOrganisasi / mhsCountOrganisasi.size) : 0,
          seminar: mhsCountSeminar.size > 0 ? Math.round(sumSeminar / mhsCountSeminar.size) : 0,
          prestasi: mhsCountPrestasi.size > 0 ? Math.round(sumPrestasi / mhsCountPrestasi.size) : 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        namaFakultas: namaFakultas,
        statistik: {
          pending: pendingCount,
          disetujui: disetujuiCount,
          menungguPimpinan: menungguPimpinanCount,
          ditolak: ditolakCount
        },
        riwayatTerbaru: tabelRiwayat,
        grafikCapaianPerProdi: grafikData
      }
    });

  } catch (error) {
    console.error('Error di Dashboard Fakultas:', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
