import prisma from '../../lib/prisma';
import { hitungProgresKurikulumMahasiswa } from '../../controllers/mahasiswa/dashboard.controller';
import {
  getKurikulumByFilter,
  perolehanUntukKurikulum,
  resolveKurikulumMahasiswaMap,
  targetPoinKurikulum,
} from '../kurikulumResolver.service';

export interface FilterLaporan {
  role: string;
  userId: bigint;
  fakultasId?: number;
  prodiId?: number;
  angkatan?: number;
  tahunAkademik?: string;
  kurikulumId?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface LaporanDataResult {
  scope: 'universitas' | 'ditmawa' | 'fakultas';
  scopeNama: string;
  role: string;
  filter: {
    fakultasId?: number;
    fakultasNama?: string;
    prodiId?: number;
    prodiNama?: string;
    angkatan?: number;
    tahunAkademik?: string;
    kurikulumId?: number;
  };
  kurikulum: {
    id: number;
    nama: string;
    targetPoin: number;
    capaianList: { id: number; nama: string; tahun: number; targetPoin: number }[];
  };
  kpi: {
    totalMahasiswa: number;
    rataRataPoin: number;
    rataRataPersentase: number;
    totalPoinSah: number;
    totalPrestasi: number;
    totalKegiatan: number;
    totalOrmawa: number;
    persentaseLulusTarget: number;
  };
  komparasi: {
    unit: 'fakultas' | 'prodi';
    items: {
      id: number;
      nama: string;
      totalMahasiswa: number;
      totalPoin: number;
      rataRataPoin: number;
      rataRataPersentase: number;
      ranking: number;
      kategoriPoin: Record<string, number>;
    }[];
  };
  capaianKurikulumStats: {
    nama: string;
    tahun: number;
    targetPoin: number;
    rataRataTerkumpul: number;
    persentaseCapaian: number;
    kurikulumNama?: string;
  }[];
  mahasiswaList: {
    nim: string;
    nama: string;
    fakultas: string;
    prodi: string;
    angkatan: number | null;
    poinTahun1: number;
    poinTahun2: number;
    poinTahun3: number;
    poinTahun4: number;
    totalPoin: number;
    targetPoin: number;
    persentase: number;
    statusTarget: 'Tercapai' | 'Belum Tercapai';
  }[];
  prestasiList: {
    nim: string;
    namaMahasiswa: string;
    fakultas: string;
    prodi: string;
    namaKegiatan: string;
    kategori: string;
    skala: string;
    peran: string;
    penyelenggara: string;
    tanggal: string;
    poin: number;
  }[];
  ormawaList: {
    nama: string;
    tipe: string;
    fakultas: string;
    totalKegiatan: number;
    totalPeserta: number;
    totalPoinDidistribusikan: number;
  }[];
}

/**
 * Service untuk mengumpulkan dan mengagregasi data laporan pimpinan
 * dengan isolasi hak akses scope Universitas vs Fakultas
 */
export async function getLaporanData(filter: FilterLaporan): Promise<LaporanDataResult> {
  const { role, userId } = filter;

  // 1. Tentukan Scope & Batasan Fakultas
  let effectiveFakultasId = filter.fakultasId;
  let scope: 'universitas' | 'ditmawa' | 'fakultas' = 'universitas';
  let scopeNama = 'Universitas Andalas (Seluruh Fakultas)';

  if (role === 'pimpinan_fakultas' || role === 'admin_fakultas') {
    scope = 'fakultas';
    const staff = await prisma.staff.findUnique({
      where: { userId },
      include: { fakultas: true },
    });
    if (!staff || !staff.fakultasId) {
      throw new Error('Akun Anda tidak terikat dengan fakultas manapun.');
    }
    effectiveFakultasId = staff.fakultasId;
    scopeNama = staff.fakultas?.nama || 'Fakultas Terkait';
  } else if (role === 'pimpinan_ditmawa' || role === 'admin_ditmawa') {
    scope = 'ditmawa';
    scopeNama = 'Direktorat Kemahasiswaan (Ditmawa) - Universitas Andalas';
    if (effectiveFakultasId) {
      const fak = await prisma.fakultas.findUnique({ where: { id: effectiveFakultasId } });
      if (fak) scopeNama += ` (Filter: ${fak.nama})`;
    }
  } else if (role === 'pimpinan_utama') {
    scope = 'universitas';
    scopeNama = 'Pimpinan Utama (Rektorat) - Universitas Andalas';
    if (effectiveFakultasId) {
      const fak = await prisma.fakultas.findUnique({ where: { id: effectiveFakultasId } });
      if (fak) scopeNama += ` (Filter: ${fak.nama})`;
    }
  } else if (effectiveFakultasId) {
    const fak = await prisma.fakultas.findUnique({ where: { id: effectiveFakultasId } });
    if (fak) scopeNama = `${fak.nama} - Universitas Andalas`;
  }

  // 2. Ambil kurikulum filter atau biarkan per-mahasiswa
  const kurikulumFilter = filter.kurikulumId
    ? await getKurikulumByFilter(filter.kurikulumId)
    : null;
  if (filter.kurikulumId && !kurikulumFilter) {
    throw new Error('Kurikulum filter tidak ditemukan');
  }

  // Jika filter kurikulumId tidak dipilih, ambil SEMUA kurikulum aktif
  const semuaKurikulumAktif: any[] = [];
  if (!kurikulumFilter) {
    const aktifList = await prisma.kurikulum.findMany({
      where: { status: 'aktif' },
      orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
      include: {
        capaian: {
          orderBy: { urutan: 'asc' },
          include: { subCapaian: { orderBy: { id: 'asc' } } },
        },
      },
    });
    if (aktifList.length > 0) {
      semuaKurikulumAktif.push(...aktifList);
    } else {
      // Fallback: ambil kurikulum terakhir jika tidak ada yang aktif
      const fallback = await prisma.kurikulum.findFirst({
        orderBy: { id: 'desc' },
        include: {
          capaian: {
            orderBy: { urutan: 'asc' },
            include: { subCapaian: { orderBy: { id: 'asc' } } },
          },
        },
      });
      if (fallback) semuaKurikulumAktif.push(fallback);
    }
  }

  const kurikulumAcuan = kurikulumFilter || semuaKurikulumAktif[0] || null;

  const kurikulumMeta = kurikulumFilter || {
    id: kurikulumAcuan?.id || 0,
    nama: semuaKurikulumAktif.length > 1
      ? 'Campuran (semua kurikulum aktif)'
      : (kurikulumAcuan ? kurikulumAcuan.nama : 'Campuran (per mahasiswa)'),
    capaian: kurikulumAcuan?.capaian || [],
  };

  const targetPoinTotalDefault = targetPoinKurikulum(kurikulumAcuan) || 200;
  const rawCapaian = kurikulumAcuan?.capaian || [];
  const capaianList = rawCapaian.length > 0
    ? rawCapaian.map((c: any, i: number) => ({
        id: c.id,
        nama: c.nama || `Tahun ${c.urutan || (i + 1)}`,
        tahun: c.urutan || (i + 1),
        targetPoin: c.jumlahPoin,
      }))
    : [
        { id: 1, nama: 'Tahun 1', tahun: 1, targetPoin: Math.round(targetPoinTotalDefault / 4) },
        { id: 2, nama: 'Tahun 2', tahun: 2, targetPoin: Math.round(targetPoinTotalDefault / 4) },
        { id: 3, nama: 'Tahun 3', tahun: 3, targetPoin: Math.round(targetPoinTotalDefault / 4) },
        { id: 4, nama: 'Tahun 4', tahun: 4, targetPoin: Math.round(targetPoinTotalDefault / 4) },
      ];

  // Mapping subCapaian ID ke tahun capaian (untuk SEMUA kurikulum aktif)
  const subCapaianTahunMap = new Map<number, number>();
  const kurikulumSources = kurikulumFilter ? [kurikulumFilter] : semuaKurikulumAktif;
  kurikulumSources.forEach((k: any) => {
    k.capaian?.forEach((c: any, idx: number) => {
      const th = c.urutan || (idx + 1);
      c.subCapaian?.forEach((sc: any) => subCapaianTahunMap.set(sc.id, th));
    });
  });

  // Per-kurikulum stats tracking untuk grafik capaian multi-kurikulum
  const perKurikulumPoin = new Map<number, { sumPerTahun: number[]; count: number }>();
  kurikulumSources.forEach((k: any) => {
    perKurikulumPoin.set(k.id, { sumPerTahun: [0, 0, 0, 0, 0], count: 0 });
  });

  // 3. Query Mahasiswa sesuai Scope & Filter
  const mhsWhere: any = {};
  if (effectiveFakultasId) {
    mhsWhere.prodi = { fakultasId: effectiveFakultasId };
  }
  if (filter.prodiId) {
    mhsWhere.prodiId = filter.prodiId;
  }
  if (filter.angkatan) {
    mhsWhere.angkatan = filter.angkatan;
  }

  const mahasiswaRawAll = await prisma.mahasiswa.findMany({
    where: mhsWhere,
    include: {
      user: { select: { nama: true, email: true } },
      prodi: {
        include: {
          fakultas: { select: { id: true, nama: true } },
        },
      },
      perolehanPoin: {
        where: { status: 'sah' },
        include: {
          detail: {
            include: {
              subCapaian: { include: { capaian: true } },
            },
          },
          kegiatan: {
            include: {
              kategori: true,
              skala: true,
            },
          },
        },
      },
    },
    orderBy: [{ angkatan: 'desc' }, { nim: 'asc' }],
  });

  // 4. Proses Data Capaian Tiap Mahasiswa & Pemetaan Kurikulum
  const kurikulumMap = await resolveKurikulumMahasiswaMap(
    mahasiswaRawAll.map((m) => ({
      userId: m.userId,
      angkatan: m.angkatan,
      kurikulumId: (m as any).kurikulumId,
    })),
  );

  // Filter mahasiswa berdasarkan kurikulum jika kurikulumId dipilih
  const mahasiswaRaw = filter.kurikulumId
    ? mahasiswaRawAll.filter((m) => {
        // 1. Jika ada assignment eksplisit di database
        if (m.kurikulumId != null) {
          return Number(m.kurikulumId) === Number(filter.kurikulumId);
        }
        // 2. Jika kurikulum ter-resolve dari angkatan
        const resolved = kurikulumMap.get(String(m.userId));
        if (resolved) {
          return Number(resolved.id) === Number(filter.kurikulumId);
        }
        // 3. Fallback jika kurikulumAcuan cocok dengan filter
        return kurikulumAcuan ? Number(kurikulumAcuan.id) === Number(filter.kurikulumId) : false;
      })
    : mahasiswaRawAll;

  let totalPoinSahGlobal = 0;
  let totalMahasiswaLulusTarget = 0;
  const sumPoinPerTahun = [0, 0, 0, 0, 0]; // index 1..4

  const mahasiswaList = mahasiswaRaw.map((m) => {
    const kurikulumMhs = kurikulumFilter || kurikulumMap.get(String(m.userId)) || kurikulumAcuan || null;
    const targetPoinTotal = targetPoinKurikulum(kurikulumMhs) || targetPoinTotalDefault;
    const localSubMap = new Map<number, number>();
    if (kurikulumMhs?.capaian) {
      kurikulumMhs.capaian.forEach((c: any, idx: number) => {
        const th = c.urutan || (idx + 1);
        c.subCapaian?.forEach((sc: any) => localSubMap.set(sc.id, th));
      });
    }

    // Sama dengan dashboard mahasiswa: filter perolehan + capping per capaian
    const perolehanFiltered = kurikulumMhs
      ? perolehanUntukKurikulum(m.perolehanPoin, kurikulumMhs.id)
      : m.perolehanPoin;

    const progres = kurikulumMhs?.capaian?.length
      ? hitungProgresKurikulumMahasiswa(kurikulumMhs, perolehanFiltered)
      : null;

    const poinPerTahun = [0, 0, 0, 0, 0];
    perolehanFiltered.forEach((pp: any) => {
      if (pp.detail && pp.detail.length > 0) {
        pp.detail.forEach((d: any) => {
          const th = localSubMap.get(d.subCapaianId) || subCapaianTahunMap.get(d.subCapaianId) || 1;
          if (th >= 1 && th <= 4) {
            poinPerTahun[th] += d.poin;
          } else {
            poinPerTahun[1] += d.poin;
          }
        });
      } else {
        poinPerTahun[1] += pp.totalPoin;
      }
    });

    for (let th = 1; th <= 4; th++) {
      sumPoinPerTahun[th] += poinPerTahun[th];
    }

    // Accumulate per-kurikulum stats untuk grafik multi-kurikulum
    const kurikulumMhsId = kurikulumMhs?.id;
    if (kurikulumMhsId && perKurikulumPoin.has(kurikulumMhsId)) {
      const pkStats = perKurikulumPoin.get(kurikulumMhsId)!;
      pkStats.count++;
      for (let th = 1; th <= 4; th++) {
        pkStats.sumPerTahun[th] += poinPerTahun[th];
      }
    }

    const mhsTotalPoin = progres?.totalPoin ?? perolehanFiltered.reduce((s: number, p: any) => s + (p.totalPoin || 0), 0);
    const isTercapai = Boolean(progres?.isLulus);
    const persentase = progres?.persentaseTotal ?? (
      targetPoinTotal > 0
        ? Math.min(Math.round((mhsTotalPoin / targetPoinTotal) * 100), 100)
        : 0
    );

    totalPoinSahGlobal += mhsTotalPoin;
    if (isTercapai) {
      totalMahasiswaLulusTarget++;
    }

    return {
      nim: m.nim,
      nama: m.user?.nama || '-',
      fakultas: m.prodi?.fakultas?.nama || '-',
      prodi: m.prodi?.nama || '-',
      angkatan: m.angkatan,
      kurikulumId: kurikulumMhs?.id ?? null,
      kurikulumNama: kurikulumMhs?.nama ?? null,
      poinTahun1: poinPerTahun[1],
      poinTahun2: poinPerTahun[2],
      poinTahun3: poinPerTahun[3],
      poinTahun4: poinPerTahun[4],
      totalPoin: mhsTotalPoin,
      totalPoinProgres: progres?.totalPoinProgres ?? mhsTotalPoin,
      targetPoin: progres?.totalTarget ?? targetPoinTotal,
      persentase,
      statusTarget: (isTercapai ? 'Tercapai' : 'Belum Tercapai') as 'Tercapai' | 'Belum Tercapai',
    };
  });

  const totalMahasiswa = mahasiswaRaw.length;
  const rataRataPoin = totalMahasiswa > 0 ? Math.round(totalPoinSahGlobal / totalMahasiswa) : 0;

  // Hitung target rata-rata tertimbang berdasarkan distribusi mahasiswa per kurikulum
  const isMultiKurikulum = !kurikulumFilter && semuaKurikulumAktif.length > 1;
  let effectiveTarget = targetPoinTotalDefault;
  if (isMultiKurikulum && totalMahasiswa > 0) {
    let totalWeightedTarget = 0;
    let totalStudentsWithKurikulum = 0;
    for (const kur of kurikulumSources) {
      const pkStats = perKurikulumPoin.get(kur.id);
      const kurTarget = targetPoinKurikulum(kur) || targetPoinTotalDefault;
      const count = pkStats?.count || 0;
      totalWeightedTarget += kurTarget * count;
      totalStudentsWithKurikulum += count;
    }
    if (totalStudentsWithKurikulum > 0) {
      effectiveTarget = Math.round(totalWeightedTarget / totalStudentsWithKurikulum);
    }
  }

  // Gunakan rata-rata persentase individu (lebih akurat untuk campuran)
  const rataRataPersentase = totalMahasiswa > 0
    ? Math.round(mahasiswaList.reduce((sum, m) => sum + m.persentase, 0) / totalMahasiswa)
    : 0;
  const persentaseLulusTarget = totalMahasiswa > 0 ? Math.round((totalMahasiswaLulusTarget / totalMahasiswa) * 100) : 0;

  // 5. Statistik Capaian per Pilar Kurikulum (multi-kurikulum support)
  const capaianKurikulumStats: {
    nama: string;
    tahun: number;
    targetPoin: number;
    rataRataTerkumpul: number;
    persentaseCapaian: number;
    kurikulumNama?: string;
  }[] = [];

  for (const kur of kurikulumSources) {
    const pkStats = perKurikulumPoin.get(kur.id);
    const kurCapaian = kur.capaian || [];
    const kurTargetTotal = targetPoinKurikulum(kur) || targetPoinTotalDefault;

    const entries = kurCapaian.length > 0
      ? kurCapaian.map((c: any, i: number) => ({
          nama: c.nama || `Tahun ${c.urutan || (i + 1)}`,
          tahun: c.urutan || (i + 1),
          targetPoin: c.jumlahPoin,
        }))
      : [
          { nama: 'Tahun 1', tahun: 1, targetPoin: Math.round(kurTargetTotal / 4) },
          { nama: 'Tahun 2', tahun: 2, targetPoin: Math.round(kurTargetTotal / 4) },
          { nama: 'Tahun 3', tahun: 3, targetPoin: Math.round(kurTargetTotal / 4) },
          { nama: 'Tahun 4', tahun: 4, targetPoin: Math.round(kurTargetTotal / 4) },
        ];

    const mhsCount = pkStats?.count || 0;

    for (const c of entries) {
      const th = (c.tahun >= 1 && c.tahun <= 4) ? c.tahun : 1;
      const poinTahun = pkStats?.sumPerTahun[th] || 0;
      const avgTerkumpul = mhsCount > 0 ? Math.round(poinTahun / mhsCount) : 0;
      const persen = c.targetPoin > 0 ? Math.min(Math.round((avgTerkumpul / c.targetPoin) * 100), 100) : 0;
      capaianKurikulumStats.push({
        nama: isMultiKurikulum ? `${kur.nama} - ${c.nama}` : c.nama,
        tahun: c.tahun,
        targetPoin: c.targetPoin,
        rataRataTerkumpul: avgTerkumpul,
        persentaseCapaian: persen,
        kurikulumNama: isMultiKurikulum ? kur.nama : undefined,
      });
    }
  }

  // 6. Komparasi Unit (Fakultas atau Prodi)
  let komparasiUnit: 'fakultas' | 'prodi' = 'fakultas';
  const komparasiItems: any[] = [];

  if (scope === 'fakultas' || effectiveFakultasId) {
    komparasiUnit = 'prodi';
    const prodiList = await prisma.programStudi.findMany({
      where: effectiveFakultasId ? { fakultasId: effectiveFakultasId } : {},
      select: { id: true, nama: true },
    });

    const prodiMap = new Map<number, { id: number; nama: string; totalMhs: number; totalPoin: number; katMap: Record<string, number> }>();
    prodiList.forEach((p) => prodiMap.set(p.id, { id: p.id, nama: p.nama, totalMhs: 0, totalPoin: 0, katMap: {} }));

    mahasiswaRaw.forEach((m) => {
      const pEntry = prodiMap.get(m.prodiId);
      if (!pEntry) return;
      pEntry.totalMhs++;
      m.perolehanPoin.forEach((pp) => {
        pEntry.totalPoin += pp.totalPoin;
        const kName = pp.kegiatan?.kategori?.nama || 'Lainnya';
        pEntry.katMap[kName] = (pEntry.katMap[kName] || 0) + pp.totalPoin;
      });
    });

    prodiMap.forEach((p) => {
      const avgPoin = p.totalMhs > 0 ? Math.round(p.totalPoin / p.totalMhs) : 0;
      const avgPersen = Math.min(Math.round((avgPoin / (targetPoinTotalDefault || 1)) * 100), 100);
      komparasiItems.push({
        id: p.id,
        nama: p.nama,
        totalMahasiswa: p.totalMhs,
        totalPoin: p.totalPoin,
        rataRataPoin: avgPoin,
        rataRataPersentase: avgPersen,
        kategoriPoin: p.katMap,
      });
    });
  } else {
    // Tingkat Universitas: Ranking Fakultas
    komparasiUnit = 'fakultas';
    const fakultasList = await prisma.fakultas.findMany({ select: { id: true, nama: true } });
    const fakultasMap = new Map<number, { id: number; nama: string; totalMhs: number; totalPoin: number; katMap: Record<string, number> }>();
    fakultasList.forEach((f) => fakultasMap.set(f.id, { id: f.id, nama: f.nama, totalMhs: 0, totalPoin: 0, katMap: {} }));

    mahasiswaRaw.forEach((m) => {
      const fId = m.prodi?.fakultas?.id;
      if (!fId) return;
      const fEntry = fakultasMap.get(fId);
      if (!fEntry) return;

      fEntry.totalMhs++;
      m.perolehanPoin.forEach((pp) => {
        fEntry.totalPoin += pp.totalPoin;
        const kName = pp.kegiatan?.kategori?.nama || 'Lainnya';
        fEntry.katMap[kName] = (fEntry.katMap[kName] || 0) + pp.totalPoin;
      });
    });

    fakultasMap.forEach((f) => {
      const avgPoin = f.totalMhs > 0 ? Math.round(f.totalPoin / f.totalMhs) : 0;
      const avgPersen = Math.min(Math.round((avgPoin / (targetPoinTotalDefault || 1)) * 100), 100);
      komparasiItems.push({
        id: f.id,
        nama: f.nama,
        totalMahasiswa: f.totalMhs,
        totalPoin: f.totalPoin,
        rataRataPoin: avgPoin,
        rataRataPersentase: avgPersen,
        kategoriPoin: f.katMap,
      });
    });
  }

  // Urutkan ranking berdasarkan rata-rata persentase tertinggi
  komparasiItems.sort((a, b) => b.rataRataPersentase - a.rataRataPersentase);
  komparasiItems.forEach((item, idx) => {
    item.ranking = idx + 1;
  });

  // 7. Rekapitulasi Prestasi Mahasiswa (SIMKATMAWA / Prestasi Nasional & Internasional)
  const perolehanPrestasi = await prisma.perolehanPoin.findMany({
    where: {
      status: 'sah',
      ...(effectiveFakultasId ? { mahasiswa: { prodi: { fakultasId: effectiveFakultasId } } } : {}),
      kegiatan: {
        OR: [
          { skala: { nama: { in: ['Nasional', 'Internasional', 'Wilayah / Regional'] } } },
          { kategori: { nama: { contains: 'Kompetisi' } } },
          { kategori: { nama: { contains: 'Prestasi' } } },
          { kategori: { nama: { contains: 'Lomba' } } },
        ],
      },
    },
    include: {
      mahasiswa: {
        include: {
          user: { select: { nama: true } },
          prodi: { include: { fakultas: { select: { nama: true } } } },
        },
      },
      kegiatan: {
        include: {
          kategori: true,
          skala: true,
          organisasi: { select: { nama: true } },
        },
      },
      klaimPoin: {
        include: { peranUsulan: true },
      },
    },
    orderBy: { totalPoin: 'desc' },
    take: 200,
  });

  const allowedUserIds = new Set(mahasiswaRaw.map((m) => m.userId));
  const prestasiList = perolehanPrestasi
    .filter((p) => allowedUserIds.has(p.mahasiswa.userId))
    .map((p) => ({
      nim: p.mahasiswa.nim,
      namaMahasiswa: p.mahasiswa.user?.nama || '-',
      fakultas: p.mahasiswa.prodi?.fakultas?.nama || '-',
      prodi: p.mahasiswa.prodi?.nama || '-',
      namaKegiatan: p.kegiatan.nama,
      kategori: p.kegiatan.kategori?.nama || 'Kompetisi',
      skala: p.kegiatan.skala?.nama || 'Universitas',
      peran: p.klaimPoin?.peranUsulan?.nama || 'Peserta',
      penyelenggara: p.kegiatan.organisasi?.nama || p.kegiatan.penyelenggaraExt || 'Ditmawa UNAND',
      tanggal: p.kegiatan.tanggalMulai ? new Date(p.kegiatan.tanggalMulai).toISOString().split('T')[0] : '-',
      poin: p.totalPoin,
    }));

  // 8. Keaktifan Organisasi / UKM
  const ormawaWhere: any = {};
  if (effectiveFakultasId) {
    ormawaWhere.fakultasId = effectiveFakultasId;
  }

  const ormawaRaw = await prisma.organisasi.findMany({
    where: ormawaWhere,
    include: {
      fakultas: { select: { nama: true } },
      kegiatan: {
        where: { status: { in: ['disetujui', 'terpublikasi'] } },
        include: {
          partisipasi: {
            include: {
              klaimPoin: {
                include: { perolehanPoin: true },
              },
            },
          },
        },
      },
    },
  });

  const ormawaList = ormawaRaw.map((o) => {
    let totalPeserta = 0;
    let totalPoinDistribusi = 0;

    o.kegiatan.forEach((k) => {
      totalPeserta += k.partisipasi.length;
      k.partisipasi.forEach((part) => {
        if (part.klaimPoin?.perolehanPoin?.status === 'sah') {
          totalPoinDistribusi += part.klaimPoin.perolehanPoin.totalPoin;
        }
      });
    });

    return {
      nama: o.nama,
      tipe: o.tipe.toUpperCase(),
      fakultas: o.fakultas?.nama || 'Tingkat Universitas',
      totalKegiatan: o.kegiatan.length,
      totalPeserta,
      totalPoinDidistribusikan: totalPoinDistribusi,
    };
  });

  ormawaList.sort((a, b) => b.totalKegiatan - a.totalKegiatan);

  const totalKegiatanCount = await prisma.kegiatan.count({
    where: {
      status: { in: ['disetujui', 'terpublikasi'] },
      ...(effectiveFakultasId ? { organisasi: { fakultasId: effectiveFakultasId } } : {}),
    },
  });

  return {
    scope,
    scopeNama,
    role,
    filter: {
      fakultasId: effectiveFakultasId,
      fakultasNama: effectiveFakultasId ? (await prisma.fakultas.findUnique({ where: { id: effectiveFakultasId } }))?.nama : undefined,
      prodiId: filter.prodiId,
      prodiNama: filter.prodiId ? (await prisma.programStudi.findUnique({ where: { id: filter.prodiId } }))?.nama : undefined,
      angkatan: filter.angkatan,
      tahunAkademik: filter.tahunAkademik,
      kurikulumId: filter.kurikulumId,
    },
    kurikulum: {
      id: kurikulumMeta.id || 0,
      nama: kurikulumMeta.nama || 'Campuran (per mahasiswa)',
      targetPoin: effectiveTarget,
      capaianList,
    },
    kpi: {
      totalMahasiswa,
      rataRataPoin,
      rataRataPersentase,
      totalPoinSah: totalPoinSahGlobal,
      totalPrestasi: prestasiList.length,
      totalKegiatan: totalKegiatanCount,
      totalOrmawa: ormawaList.length,
      persentaseLulusTarget,
    },
    komparasi: {
      unit: komparasiUnit,
      items: komparasiItems,
    },
    capaianKurikulumStats,
    mahasiswaList,
    prestasiList,
    ormawaList,
  };
}
