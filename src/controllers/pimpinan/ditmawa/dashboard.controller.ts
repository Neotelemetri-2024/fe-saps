import { Request, Response } from 'express';
import prisma from '../../../lib/prisma';

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

    // 1. Kurikulum Aktif & Capaian Kurikulum
    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' },
      include: {
        capaian: {
          orderBy: { urutan: 'asc' },
          include: { subCapaian: true },
        },
      },
    });

    const targetKurikulum = kurikulumAktif?.capaian.reduce((sum, c) => sum + c.jumlahPoin, 0) || 200;

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
      // Antrean Proposal Kegiatan (status 'diajukan' atau 'terverifikasi')
      prisma.kegiatan.count({ where: { status: { in: ['diajukan', 'terverifikasi'] } } }),
      // Antrean Klaim Poin (status 'menunggu_validasi' atau 'menunggu_pimpinan')
      prisma.klaimPoin.count({ where: { status: { in: ['menunggu_validasi', 'menunggu_pimpinan'] } } }),
      // Total Akumulasi Poin Sah
      prisma.perolehanPoin.aggregate({
        where: { status: 'sah' },
        _sum: { totalPoin: true },
      }),
      // Mahasiswa dengan Perolehan Poin untuk menghitung persentase kelulusan target
      prisma.mahasiswa.findMany({
        select: {
          id: true,
          perolehanPoin: {
            where: { status: 'sah' },
            select: {
              totalPoin: true,
              detail: { select: { subCapaianId: true, poin: true } },
            },
          },
        },
      }),
      // 5 Proposal Kegiatan Terbaru yang Menunggu Persetujuan (Quick Action)
      prisma.kegiatan.findMany({
        where: { status: { in: ['diajukan', 'terverifikasi'] } },
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
    let lulusTargetCount = 0;
    const subCapaianTahunMap = new Map<number, number>();
    kurikulumAktif?.capaian.forEach((c, idx) => {
      const th = c.urutan || (idx + 1);
      c.subCapaian.forEach((sc) => subCapaianTahunMap.set(sc.id, th));
    });

    const capaianTahunPoinMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    const totalMahasiswaTerhitung = mahasiswaDenganPoin.length || 1;

    mahasiswaDenganPoin.forEach((m) => {
      let mhsTotalPoin = 0;
      m.perolehanPoin.forEach((pp) => {
        mhsTotalPoin += pp.totalPoin;
        pp.detail.forEach((d) => {
          const th = subCapaianTahunMap.get(d.subCapaianId);
          if (th && capaianTahunPoinMap[th] !== undefined) {
            capaianTahunPoinMap[th] += d.poin;
          }
        });
      });
      if (mhsTotalPoin >= targetKurikulum) {
        lulusTargetCount++;
      }
    });

    const persentaseLulusTarget = Math.min(
      Math.round((lulusTargetCount / totalMahasiswaTerhitung) * 100),
      100
    );

    // Sebaran Capaian 4 Pilar Kurikulum SAPS
    const capaianKurikulum = (kurikulumAktif?.capaian || []).map((c, i) => {
      const tahunNum = c.urutan || (i + 1);
      const totalPoinPilar = capaianTahunPoinMap[tahunNum] || 0;
      const rataRataPoin = Math.round(totalPoinPilar / totalMahasiswaTerhitung);
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
      nim: kp.partisipasi.mahasiswa.nim,
      namaMahasiswa: kp.partisipasi.mahasiswa.user.nama,
      prodi: kp.partisipasi.mahasiswa.prodi.nama,
      namaKegiatan: kp.partisipasi.kegiatan.nama,
      kategori: kp.partisipasi.kegiatan.kategori?.nama || '-',
      skala: kp.partisipasi.kegiatan.skala?.nama || '-',
      peran: kp.peranUsulan?.nama || '-',
      status: kp.status,
      diajukanPada: kp.createdAt,
    }));

    // 7. Konstruksi Data Respon Lengkap Dashboard Super Admin
    const data = {
      statistik: {
        mahasiswaAktif: mahasiswaAktifCount,
        totalFakultas: totalFakultasCount,
        totalOrmawaAktif: totalOrmawaCount,
        kurikulumAktif: kurikulumAktif?.nama || 'Kurikulum SAPS 2024',
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
