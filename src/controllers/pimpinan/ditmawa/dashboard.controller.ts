import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';
import { calculateIku3Dashboard } from '../../../services/iku3/iku3Calculation.service';
import {
  perolehanUntukKurikulum,
  resolveKurikulumMahasiswaMap,
  targetPoinKurikulum,
} from '../../../services/kurikulumResolver.service';

// GET /api/umum/dashboard/pimpinan-ditmawa — Dashboard Monitoring & Command Center Super Admin
export const dashboardPimpinanDitmawa = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const effectiveRole = user.peran === 'staff' && user.jabatan ? user.jabatan : user.peran;
    if (effectiveRole !== 'pimpinan_ditmawa' && effectiveRole !== 'pimpinan_utama') {
      res.status(403).json({ success: false, message: 'Akses ditolak' });
      return;
    }

    // 1. Kurikulum (filter opsional ?kurikulumId=) & Capaian Kurikulum
    const kurikulumIdFilter = req.query.kurikulumId ? Number(req.query.kurikulumId) : undefined;
    if (kurikulumIdFilter != null && Number.isNaN(kurikulumIdFilter)) {
      res.status(400).json({ success: false, message: 'kurikulumId tidak valid' });
      return;
    }

    const kurikulumInclude = {
      capaian: {
        orderBy: { urutan: 'asc' as const },
        include: { subCapaian: true },
      },
    };

    const kurikulumAktif = kurikulumIdFilter
      ? await prisma.kurikulum.findUnique({
          where: { id: kurikulumIdFilter },
          include: kurikulumInclude,
        })
      : await prisma.kurikulum.findFirst({
          where: { status: 'aktif' },
          orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
          include: kurikulumInclude,
        });

    if (kurikulumIdFilter && !kurikulumAktif) {
      res.status(400).json({ success: false, message: 'Kurikulum tidak ditemukan' });
      return;
    }

    const targetKurikulum = targetPoinKurikulum(kurikulumAktif) || 200;

    // 2. Query Paralel Kartu Metrik Utama
    const [
      mahasiswaAktifCount,
      totalFakultasCount,
      totalOrmawaCount,
      antreanProposalKegiatanCount,
      antreanKlaimCount,
      poinSahAggregate,
      mahasiswaDenganPoin,
      kegiatanPendingList,
      klaimPendingList,
      ukmList,
      fakultasList,
    ] = await Promise.all([
      // Total Mahasiswa Aktif
      prisma.mahasiswa.count({ where: { user: { aktif: true } } }),
      // Total Fakultas
      prisma.fakultas.count(),
      // Total Ormawa / UKM
      prisma.organisasi.count(),
      // Antrean Proposal Kegiatan (status 'terverifikasi')
      prisma.kegiatan.count({ where: { status: { in: ['terverifikasi'] } } }),
      // Antrean Klaim Poin (status 'menunggu_validasi' atau 'menunggu_pimpinan')
      prisma.klaimPoin.count({ where: { status: { in: ['menunggu_validasi', 'menunggu_pimpinan'] } } }),
      // Total Akumulasi Poin Sah
      prisma.perolehanPoin.aggregate({
        where: { status: 'sah' },
        _sum: { totalPoin: true },
      }),
      // Semua mahasiswa + poin sah (kurikulum di-resolve di memori — banyak mhs belum punya kurikulumId eksplisit)
      prisma.mahasiswa.findMany({
        select: {
          userId: true,
          angkatan: true,
          kurikulumId: true,
          perolehanPoin: {
            where: { status: 'sah' },
            select: {
              totalPoin: true,
              kurikulumId: true,
              detail: {
                select: {
                  subCapaianId: true,
                  poin: true,
                  subCapaian: {
                    select: { capaian: { select: { kurikulumId: true } } },
                  },
                },
              },
            },
          },
        },
      }),
      // 5 Proposal Kegiatan Terbaru yang Menunggu Persetujuan (Quick Action)
      prisma.kegiatan.findMany({
        where: { status: { in: ['terverifikasi'] } },
        include: {
          organisasi: { select: { nama: true, tipe: true } },
          kategori: { select: { nama: true } },
          skala: { select: { nama: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // 5 Klaim Poin Mahasiswa Terbaru yang Menunggu Validasi (Quick Action)
      prisma.klaimPoin.findMany({
        where: { status: { in: ['menunggu_validasi', 'menunggu_pimpinan'] } },
        include: {
          partisipasi: {
            include: {
              mahasiswa: {
                include: {
                  user: { select: { nama: true } },
                  prodi: { select: { nama: true } },
                },
              },
              kegiatan: {
                include: { kategori: true, skala: true },
              },
            },
          },
          peranUsulan: { select: { nama: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      // Daftar UKM untuk grafik distribusi poin
      prisma.organisasi.findMany({
        where: { tipe: 'UKM' },
        select: { id: true, nama: true },
      }),
      // Daftar Fakultas untuk Top 5 Fakultas Teraktif
      prisma.fakultas.findMany({
        include: {
          programStudi: {
            include: {
              mahasiswa: {
                include: {
                  perolehanPoin: {
                    where: { status: 'sah' },
                    select: { totalPoin: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    // 3. Kalkulasi Persentase Kelulusan Target & Evaluasi 4 Pilar Kurikulum
    const kurikulumMap = await resolveKurikulumMahasiswaMap(
      mahasiswaDenganPoin.map((m) => ({
        userId: m.userId,
        angkatan: m.angkatan,
        kurikulumId: m.kurikulumId,
      })),
    );

    const mahasiswaFiltered = kurikulumAktif
      ? mahasiswaDenganPoin.filter((m) => {
          if (m.kurikulumId != null) return Number(m.kurikulumId) === kurikulumAktif.id;
          const resolved = kurikulumMap.get(String(m.userId));
          return resolved ? Number(resolved.id) === kurikulumAktif.id : false;
        })
      : mahasiswaDenganPoin;

    let lulusTargetCount = 0;
    const subCapaianTahunMap = new Map<number, number>();
    kurikulumAktif?.capaian.forEach((c, idx) => {
      const th = c.urutan || (idx + 1);
      c.subCapaian.forEach((sc) => subCapaianTahunMap.set(sc.id, th));
    });

    const capaianTahunPoinMap: Record<number, number> = {};
    kurikulumAktif?.capaian.forEach((c, idx) => {
      const th = c.urutan || (idx + 1);
      capaianTahunPoinMap[th] = 0;
    });

    const totalMahasiswaTerhitung = mahasiswaFiltered.length;

    mahasiswaFiltered.forEach((m) => {
      const poinList = kurikulumAktif
        ? perolehanUntukKurikulum(m.perolehanPoin, kurikulumAktif.id)
        : m.perolehanPoin;

      let mhsTotalPoin = 0;
      poinList.forEach((pp) => {
        mhsTotalPoin += Number(pp.totalPoin) || 0;
        (pp.detail || []).forEach((d: { subCapaianId: number; poin: number }) => {
          const th = subCapaianTahunMap.get(d.subCapaianId);
          if (th != null && capaianTahunPoinMap[th] !== undefined) {
            capaianTahunPoinMap[th] += Number(d.poin) || 0;
          }
        });
      });
      if (mhsTotalPoin >= targetKurikulum) {
        lulusTargetCount++;
      }
    });

    const denom = totalMahasiswaTerhitung || 1;
    const persentaseLulusTarget = totalMahasiswaTerhitung > 0
      ? Math.min(Math.round((lulusTargetCount / denom) * 100), 100)
      : 0;

    // Sebaran Capaian Kurikulum SAPS (per pilar/capaian)
    const capaianKurikulum = (kurikulumAktif?.capaian || []).map((c, i) => {
      const tahunNum = c.urutan || (i + 1);
      const totalPoinPilar = capaianTahunPoinMap[tahunNum] || 0;
      const rataRataPoin = totalMahasiswaTerhitung > 0
        ? Math.round(totalPoinPilar / totalMahasiswaTerhitung)
        : 0;
      const targetPilar = c.jumlahPoin || 50;
      const persen = Math.min(Math.round((rataRataPoin / targetPilar) * 100), 100);

      return {
        id: c.id,
        pilar: c.nama,
        tahun: tahunNum,
        targetPoin: targetPilar,
        rataRataPoin,
        persenCapaian: persen,
      };
    });

    // 4. Kalkulasi Top 5 Fakultas Teraktif
    const topFakultas = fakultasList
      .map((f) => {
        let totalPoinFak = 0;
        let totalMhsFak = 0;

        f.programStudi.forEach((p) => {
          totalMhsFak += p.mahasiswa.length;
          p.mahasiswa.forEach((m) => {
            m.perolehanPoin.forEach((pp) => {
              totalPoinFak += pp.totalPoin;
            });
          });
        });

        const rataRataPoin = totalMhsFak > 0 ? Math.round(totalPoinFak / totalMhsFak) : 0;
        const rataRataPersen = Math.min(Math.round((rataRataPoin / targetKurikulum) * 100), 100);

        return {
          id: f.id,
          fakultas: f.nama,
          singkatan: f.nama.replace(/^Fakultas\s+/i, ''),
          totalMahasiswa: totalMhsFak,
          totalPoin: totalPoinFak,
          rataRataPoin,
          rataRataPersentase: rataRataPersen,
        };
      })
      .sort((a, b) => b.rataRataPoin - a.rataRataPoin)
      .slice(0, 5);

    // 5. Grafik Poin per UKM
    const grafikPoinUkm = await Promise.all(
      ukmList.map(async (ukm) => {
        const perolehans = await prisma.perolehanPoin.aggregate({
          where: {
            status: 'sah',
            kegiatan: { organisasiId: ukm.id },
          },
          _sum: { totalPoin: true },
        });

        return {
          ukm: ukm.nama,
          totalPoin: perolehans._sum.totalPoin || 0,
        };
      })
    );
    grafikPoinUkm.sort((a, b) => b.totalPoin - a.totalPoin);

    // 6. Formatting Tabel Aksi Cepat (Quick Actions)
    const formattedKegiatanPending = kegiatanPendingList.map((k) => ({
      id: k.id,
      namaKegiatan: k.nama,
      organisasi: k.organisasi?.nama || k.penyelenggaraExt || 'Ditmawa',
      tipePenyelenggara: k.organisasi?.tipe || 'Universitas',
      kategori: k.kategori?.nama || '-',
      skala: k.skala?.nama || '-',
      status: k.status,
      tanggalMulai: k.tanggalMulai,
      diajukanPada: k.createdAt,
    }));

    const formattedKlaimPending = klaimPendingList.map((kp) => ({
      id: kp.id.toString(),
      nim: kp.partisipasi?.mahasiswa?.nim || '-',
      namaMahasiswa: kp.partisipasi?.mahasiswa?.user?.nama || '-',
      prodi: kp.partisipasi?.mahasiswa?.prodi?.nama || '-',
      namaKegiatan: kp.partisipasi?.kegiatan?.nama || '-',
      kategori: kp.partisipasi?.kegiatan?.kategori?.nama || '-',
      skala: kp.partisipasi?.kegiatan?.skala?.nama || '-',
      peran: kp.peranUsulan?.nama || '-',
      status: kp.status,
      diajukanPada: kp.createdAt,
    }));

    // 6.5 Ringkasan Cepat IKU 3 (Quick Widget Super Admin)
    let iku3Widget = null;
    try {
      const iku3Data = await calculateIku3Dashboard({ tahun: new Date().getFullYear() });
      iku3Widget = {
        tahun: iku3Data.kpi.tahun,
        capaian: iku3Data.kpi.capaian,
        target: iku3Data.kpi.target,
        statusTarget: iku3Data.kpi.statusTarget,
        gapMahasiswa: iku3Data.kpi.gapMahasiswa,
        totalKontributor: iku3Data.kpi.totalKontributor,
      };
    } catch (e) {
      console.error('[iku3Widget]', e);
    }

    // 7. Konstruksi Data Respon Lengkap Dashboard Super Admin
    const data = {
      statistik: {
        mahasiswaAktif: mahasiswaAktifCount,
        totalFakultas: totalFakultasCount,
        totalOrmawaAktif: totalOrmawaCount,
        kurikulumAktif: kurikulumAktif?.nama || 'Kurikulum MY UNAND STUDENT CONNECT',
        targetPoinKurikulum: targetKurikulum,
        antreanProposalKegiatan: antreanProposalKegiatanCount,
        antreanKlaim: antreanKlaimCount,
        totalPoinSah: poinSahAggregate._sum.totalPoin || 0,
        persentaseLulusTarget,
      },
      capaianKurikulum,
      topFakultas,
      grafikPoinUkm: grafikPoinUkm.slice(0, 10),
      kegiatanMenungguApproval: formattedKegiatanPending,
      klaimMenungguValidasi: formattedKlaimPending,
      iku3Widget,
    };

    res.json({
      success: true,
      message: 'Dashboard Pimpinan Ditmawa (Super Admin) berhasil dimuat',
      data,
    });
  } catch (error) {
    console.error('[dashboardPimpinanDitmawa]', error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
