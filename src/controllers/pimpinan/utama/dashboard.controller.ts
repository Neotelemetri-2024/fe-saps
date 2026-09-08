import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { buildPimpinanDashboard } from '../fakultas/dashboard.controller';
import {
  getKurikulumByFilter,
  perolehanUntukKurikulum,
  resolveKurikulumMahasiswaMap,
  targetPoinKurikulum,
} from '../../../services/kurikulumResolver.service';

// ==================== DASHBOARD PIMPINAN UTAMA ====================
// Pimpinan Utama: hanya bisa melihat laporan & statistik universitas (read-only)

// GET /api/umum/dashboard/pimpinan-utama?kurikulumId=
export const getDashboardPimpinanUtama = async (req: Request, res: Response): Promise<void> => {
  try {
    const kurikulumIdFilter = req.query.kurikulumId ? Number(req.query.kurikulumId) : undefined;
    if (kurikulumIdFilter != null && Number.isNaN(kurikulumIdFilter)) {
      res.status(400).json({ success: false, message: 'kurikulumId tidak valid' });
      return;
    }

    const kurikulumFilter = kurikulumIdFilter
      ? await getKurikulumByFilter(kurikulumIdFilter)
      : null;
    if (kurikulumIdFilter && !kurikulumFilter) {
      res.status(400).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }

    const semuaKurikulumAktif = !kurikulumFilter
      ? await prisma.kurikulum.findMany({
          where: { status: 'aktif' },
          include: { capaian: true },
          orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
        })
      : [];

    const totalFakultas = await prisma.fakultas.count();

    const fakultasList = await prisma.fakultas.findMany({
      include: {
        programStudi: {
          include: {
            mahasiswa: {
              select: {
                userId: true,
                angkatan: true,
                kurikulumId: true,
                perolehanPoin: {
                  where: { status: 'sah' },
                  include: {
                    kegiatan: { include: { kategori: true } },
                    detail: {
                      include: {
                        subCapaian: {
                          include: { capaian: { select: { kurikulumId: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const allMhs = fakultasList.flatMap((f) => f.programStudi.flatMap((p) => p.mahasiswa));
    const kurikulumMap = await resolveKurikulumMahasiswaMap(
      allMhs.map((m) => ({
        userId: m.userId,
        angkatan: m.angkatan,
        kurikulumId: m.kurikulumId,
      })),
    );

    const matchesKurikulum = (m: (typeof allMhs)[number]) => {
      if (!kurikulumIdFilter) return true;
      if (m.kurikulumId != null) return Number(m.kurikulumId) === kurikulumIdFilter;
      const resolved = kurikulumMap.get(String(m.userId));
      return resolved ? Number(resolved.id) === kurikulumIdFilter : false;
    };

    let sumPersentaseMhsGlobal = 0;
    let totalMahasiswaFiltered = 0;

    const fakultasStats = fakultasList.map((fakultas) => {
      let totalPoinFakultas = 0;
      let mhsCountFakultas = 0;
      let sumPersentaseMhsFakultas = 0;
      const kategoriMap: Record<string, number> = {};

      fakultas.programStudi.forEach((prodi) => {
        prodi.mahasiswa.filter(matchesKurikulum).forEach((mhs) => {
          mhsCountFakultas += 1;
          totalMahasiswaFiltered += 1;

          const kurikulumMhs =
            kurikulumFilter
            || kurikulumMap.get(String(mhs.userId))
            || semuaKurikulumAktif[0]
            || null;
          const target = targetPoinKurikulum(kurikulumMhs) || 1;
          const poinList = kurikulumMhs
            ? perolehanUntukKurikulum(mhs.perolehanPoin, kurikulumMhs.id)
            : mhs.perolehanPoin;

          let poinMhs = 0;
          poinList.forEach((pp: any) => {
            poinMhs += Number(pp.totalPoin) || 0;
            totalPoinFakultas += Number(pp.totalPoin) || 0;

            const kategoriName = pp.kegiatan?.kategori?.nama?.toLowerCase() || 'lainnya';
            if (!kategoriMap[kategoriName]) kategoriMap[kategoriName] = 0;
            kategoriMap[kategoriName] += Number(pp.totalPoin) || 0;
          });

          const persentaseMhs = Math.min((poinMhs / target) * 100, 100);
          sumPersentaseMhsFakultas += persentaseMhs;
          sumPersentaseMhsGlobal += persentaseMhs;
        });
      });

      const avgFakultas = mhsCountFakultas > 0
        ? Math.round(sumPersentaseMhsFakultas / mhsCountFakultas)
        : 0;

      return {
        fakultasId: fakultas.id,
        fakultas: fakultas.nama,
        rataRataCapaian: avgFakultas,
        totalPoin: totalPoinFakultas,
        kategoriPoin: kategoriMap,
      };
    });

    fakultasStats.sort((a, b) => b.rataRataCapaian - a.rataRataCapaian);

    const peringkatFakultas = fakultasStats.map((f, index) => ({
      ...f,
      ranking: index + 1,
    }));

    const rataRataCapaianGlobal = totalMahasiswaFiltered > 0
      ? Math.round(sumPersentaseMhsGlobal / totalMahasiswaFiltered)
      : 0;

    const kurikulumAktifLabel = kurikulumFilter
      ? kurikulumFilter.nama
      : semuaKurikulumAktif.length > 1
        ? 'Campuran (semua kurikulum aktif)'
        : (semuaKurikulumAktif[0]?.nama || '-');

    res.json({
      success: true,
      data: {
        statistik: {
          totalMahasiswa: totalMahasiswaFiltered,
          rataRataCapaian: rataRataCapaianGlobal,
          totalFakultas,
          kurikulumAktif: kurikulumAktifLabel,
        },
        peringkatFakultas,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/umum/dashboard/pimpinan-utama/fakultas/:id
export const getDetailFakultasPimpinanUtama = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      res.status(400).json({ success: false, message: 'ID Fakultas tidak valid' });
      return;
    }

    const data = await buildPimpinanDashboard(Number(id));
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
