import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { buildPimpinanDashboard } from '../fakultas/dashboard.controller';

// ==================== DASHBOARD PIMPINAN UTAMA ====================
// Pimpinan Utama: hanya bisa melihat laporan & statistik universitas (read-only)

// GET /api/pimpinan-utama/dashboard
export const getDashboardPimpinanUtama = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalMahasiswa = await prisma.mahasiswa.count();
    const totalFakultas = await prisma.fakultas.count();
    const kurikulumAktif = await prisma.kurikulum.count({ where: { status: 'aktif' } });
    const kurikulumDoc = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: { capaian: true }
    });
    const totalTargetPoinKurikulum = kurikulumDoc?.capaian.reduce((acc, c) => acc + c.jumlahPoin, 0) || 1;

    // Ambil semua fakultas beserta mahasiswanya dan perolehan poin sah
    const fakultasList = await prisma.fakultas.findMany({
      include: {
        programStudi: {
          include: {
            mahasiswa: {
              include: {
                perolehanPoin: {
                  where: { status: 'sah' },
                  include: { kegiatan: { include: { kategori: true } } }
                }
              }
            }
          }
        }
      }
    });

    let sumPersentaseMhsGlobal = 0;

    const fakultasStats = fakultasList.map(fakultas => {
      let totalPoinFakultas = 0;
      let mhsCountFakultas = 0;
      let sumPersentaseMhsFakultas = 0;
      const kategoriMap: Record<string, number> = {};

      fakultas.programStudi.forEach(prodi => {
        mhsCountFakultas += prodi.mahasiswa.length;
        prodi.mahasiswa.forEach(mhs => {
          let poinMhs = 0;
          mhs.perolehanPoin.forEach(pp => {
            poinMhs += pp.totalPoin;
            totalPoinFakultas += pp.totalPoin;
            
            const kategoriName = pp.kegiatan.kategori?.nama.toLowerCase() || 'lainnya';
            if (!kategoriMap[kategoriName]) kategoriMap[kategoriName] = 0;
            kategoriMap[kategoriName] += pp.totalPoin;
          });
          const persentaseMhs = Math.min((poinMhs / totalTargetPoinKurikulum) * 100, 100);
          sumPersentaseMhsFakultas += persentaseMhs;
          sumPersentaseMhsGlobal += persentaseMhs;
        });
      });

      const avgFakultas = mhsCountFakultas > 0 ? Math.round(sumPersentaseMhsFakultas / mhsCountFakultas) : 0;

      return {
        fakultasId: fakultas.id,
        fakultas: fakultas.nama,
        rataRataCapaian: avgFakultas,
        totalPoin: totalPoinFakultas,
        kategoriPoin: kategoriMap
      };
    });

    // Urutkan berdasarkan persentase
    fakultasStats.sort((a, b) => b.rataRataCapaian - a.rataRataCapaian);

    const peringkatFakultas = fakultasStats.map((f, index) => ({
      ...f,
      ranking: index + 1
    }));

    const rataRataCapaianGlobal = totalMahasiswa > 0 ? Math.round(sumPersentaseMhsGlobal / totalMahasiswa) : 0;

    res.json({
      success: true,
      data: {
        statistik: {
          totalMahasiswa,
          rataRataCapaian: rataRataCapaianGlobal,
          totalFakultas,
          kurikulumAktif
        },
        peringkatFakultas
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/pimpinan-utama/fakultas/:id
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
