import prisma from '../../lib/prisma';
import {
  DEFAULT_TARGET_IKU3_2026,
  resolveBobotPrestasi,
  resolveBobotPembelajaran,
  normalize,
} from './iku3Bobot.constants';

export interface Iku3Filter {
  tahun?: number;
  triwulan?: number; // 1, 2, 3, 4
  fakultasId?: number;
  prodiId?: number;
}

export interface Iku3DashboardData {
  kpi: {
    tahun: number;
    triwulan: string;
    capaian: number;
    target: number;
    selisih: number;
    statusTarget: 'tercapai' | 'belum_tercapai';
    totalMahasiswa: number;
    totalKontributor: number;
    totalBobotEfektif: number;
    gapMahasiswa: number;
  };
  rumpunDistribusi: {
    prestasi: { count: number; totalBobot: number; persentase: number };
    pembelajaran: { count: number; totalBobot: number; persentase: number };
  };
  cakupan: {
    fakultas: string;
    prodi?: string;
  };
}

export interface Iku3FacultyComparisonItem {
  fakultasId: number;
  namaFakultas: string;
  totalMahasiswa: number;
  totalKontributor: number;
  totalBobot: number;
  capaianPersen: number;
  ranking: number;
}

export interface Iku3TrendItem {
  tahun: number;
  capaian: number;
  target: number;
  totalMahasiswa: number;
  totalKontributor: number;
}

export interface Iku3QuarterlyTrendItem {
  triwulan: number;
  label: string;
  capaian: number;
  target: number;
  totalMahasiswa: number;
  totalKontributor: number;
}

export interface Iku3ActivityDetailItem {
  id: string;
  mahasiswaId: string;
  nim: string;
  namaMahasiswa: string;
  fakultas: string;
  prodi: string;
  namaKegiatan: string;
  kategori: string;
  jenisRumpun: 'prestasi' | 'pembelajaran';
  skala: string;
  peran: string;
  bobot: number;
  tanggal: string;
  buktiUrl: string | null;
  status: string;
}

// Helper: Penentuan rentang tanggal Tahun Kalender & Triwulan (Akumulasi Kumulatif Tahunan - Hal. 96 & 142 Kepmen 358/2025)
function getDateRange(tahun: number, triwulan?: number): { startDate: Date; endDate: Date; labelTriwulan: string } {
  const startMonth = 0; // Januari (Akumulasi selalu dimulai dari awal tahun kalender)
  let endMonth = 11; // Desember
  let endDay = 31;
  let labelTriwulan = 'Semua Triwulan (1 Tahun)';

  if (triwulan === 1) {
    endMonth = 2; // Mar
    endDay = 31;
    labelTriwulan = 'Triwulan I (Akumulasi Jan - Mar)';
  } else if (triwulan === 2) {
    endMonth = 5; // Jun
    endDay = 30;
    labelTriwulan = 'Triwulan II (Akumulasi Jan - Jun)';
  } else if (triwulan === 3) {
    endMonth = 8; // Sep
    endDay = 30;
    labelTriwulan = 'Triwulan III (Akumulasi Jan - Sep)';
  } else if (triwulan === 4) {
    endMonth = 11; // Des
    endDay = 31;
    labelTriwulan = 'Triwulan IV (Akumulasi Jan - Des)';
  }

  const startDate = new Date(Date.UTC(tahun, startMonth, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(tahun, endMonth, endDay, 23, 59, 59, 999));

  return { startDate, endDate, labelTriwulan };
}

/**
 * Service Utama: Menghitung Capaian IKU 3 Lengkap
 */
export async function calculateIku3Dashboard(filter: Iku3Filter): Promise<Iku3DashboardData> {
  const tahun = filter.tahun || new Date().getFullYear();
  const { startDate, endDate, labelTriwulan } = getDateRange(tahun, filter.triwulan);

  // 1. Ambil Target Tahunan & Triwulan dari Database (atau fallback default)
  const targetDb: any = await prisma.iku3Target.findFirst({
    where: { tahun, deletedAt: null },
  });
  let targetVal = targetDb ? Number(targetDb.targetPersen) : DEFAULT_TARGET_IKU3_2026;
  if (filter.triwulan) {
    const tw = Number(filter.triwulan);
    if (tw === 1 && targetDb?.targetTw1 != null) targetVal = Number(targetDb.targetTw1);
    else if (tw === 2 && targetDb?.targetTw2 != null) targetVal = Number(targetDb.targetTw2);
    else if (tw === 3 && targetDb?.targetTw3 != null) targetVal = Number(targetDb.targetTw3);
    else if (tw === 4 && targetDb?.targetTw4 != null) targetVal = Number(targetDb.targetTw4);
  }

  // 2. Ambil Dynamic Rules dari Database
  const dynamicRules = await prisma.iku3BobotRule.findMany({
    where: { aktif: true, deletedAt: null },
  });

  // 3. Filter Scope Fakultas & Prodi
  const whereMahasiswa: any = {
    user: { aktif: true },
  };

  if (filter.prodiId) {
    whereMahasiswa.prodiId = Number(filter.prodiId);
  } else if (filter.fakultasId) {
    whereMahasiswa.prodi = { fakultasId: Number(filter.fakultasId) };
  }

  // Ambil semua mahasiswa aktif (hanya jenjang Sarjana & Diploma)
  const allMahasiswa = await prisma.mahasiswa.findMany({
    where: whereMahasiswa,
    select: {
      userId: true,
      nim: true,
      prodiId: true,
      prodi: {
        select: {
          id: true,
          nama: true,
          fakultasId: true,
          fakultas: { select: { id: true, nama: true } },
        },
      },
    },
  });

  // Filter Denominator t: Kecualikan Pascasarjana (S2/S3/Doktor/Magister)
  const validDenominatorMahasiswa = allMahasiswa.filter(m => {
    const pNama = normalize(m.prodi?.nama);
    return !pNama.includes('s2') && !pNama.includes('s3') && !pNama.includes('magister') && !pNama.includes('doktor');
  });

  const totalMahasiswa = validDenominatorMahasiswa.length;
  const validUserIds = new Set(validDenominatorMahasiswa.map(m => m.userId.toString()));

  // 4. Ambil Perolehan Poin yang SAH dalam rentang periode
  const perolehanList = await prisma.perolehanPoin.findMany({
    where: {
      status: 'sah',
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      mahasiswa: whereMahasiswa,
    },
    include: {
      mahasiswa: {
        include: {
          user: { select: { nama: true } },
          prodi: { include: { fakultas: true } },
        },
      },
      kegiatan: {
        include: {
          kategori: true,
          skala: true,
        },
      },
      klaimPoin: {
        include: {
          peranUsulan: true,
          bukti: { take: 1 },
        },
      },
    },
  });

  // 5. Kalkulasi Bobot per Mahasiswa (Deduplikasi & Capping Maksimal 1.00)
  // Map per mahasiswaId -> Array of activities & total bobot
  const studentContributions = new Map<string, {
    totalRawBobot: number;
    effectiveBobot: number;
    prestasiBobot: number;
    pembelajaranBobot: number;
    activities: any[];
  }>();

  let countPrestasi = 0;
  let sumBobotPrestasi = 0;
  let countPembelajaran = 0;
  let sumBobotPembelajaran = 0;

  for (const item of perolehanList) {
    const mhsId = item.mahasiswaId.toString();
    // Pastikan mahasiswa masuk dalam denominator Sarjana/Diploma
    if (!validUserIds.has(mhsId)) continue;

    const prodiNama = normalize(item.mahasiswa?.prodi?.nama);
    const kategoriNama = normalize(item.kegiatan?.kategori?.nama);
    const skalaNama = item.kegiatan?.skala?.nama || '';
    const peranNama = item.klaimPoin?.peranUsulan?.nama || '';

    // Pengecualian Vokasi: Magang wajib kurikuler D3 dikecualikan
    const isVokasiD3 = prodiNama.includes('d3') || prodiNama.includes('diploma tiga');
    const isMagangWajib = kategoriNama.includes('wajib') || kategoriNama.includes('pkl');
    if (isVokasiD3 && isMagangWajib) {
      continue; // Dikecualikan sesuai Kepmen 358/2025 Hal. 53 Poin b
    }

    // Tentukan Rumpun: Prestasi vs Pembelajaran Luar Kampus
    let jenisRumpun: 'prestasi' | 'pembelajaran' = 'prestasi';
    let bobot = 0;

    const kegiatanNama = normalize(item.kegiatan?.nama);

    const isLomba = kategoriNama.includes('kompetisi') || kategoriNama.includes('lomba') || 
                    normalize(peranNama).includes('juara') || normalize(peranNama).includes('finalis');

    // Deteksi eksplisit Pembelajaran Luar Kampus (MBKM / Magang / Exchange / Riset luar kampus)
    const PEMBELAJARAN_KEYWORDS = [
      'magang', 'internship', 'msib', 'mbkm', 'kampus mengajar',
      'pertukaran pelajar', 'pertukaran mahasiswa', 'exchange', 'iisma',
      'studi independen', 'riset luar', 'proyek kemanusiaan',
      'kkn tematik', 'kkn internasional',
      'pembelajaran luar kampus', 'belajar luar kampus',
    ];
    const isPembelajaranLuarKampus = PEMBELAJARAN_KEYWORDS.some(kw =>
      kategoriNama.includes(kw) || kegiatanNama.includes(kw)
    );

    if (isLomba) {
      jenisRumpun = 'prestasi';
      bobot = resolveBobotPrestasi(skalaNama, peranNama, dynamicRules);
    } else if (isPembelajaranLuarKampus) {
      jenisRumpun = 'pembelajaran';
      // Estimasi SKS ekuivalensi MBKM (default 20 SKS = bobot 1.00)
      bobot = resolveBobotPembelajaran(20, dynamicRules);
    } else {
      // Kegiatan non-lomba & non-MBKM (organisasi, seminar, workshop, dll.)
      // BUKAN bagian dari IKU 3 → skip
      continue;
    }

    // Jika bobot > 0 (memenuhi syarat IKU 3)
    if (bobot > 0) {
      if (jenisRumpun === 'prestasi') {
        countPrestasi++;
        sumBobotPrestasi += bobot;
      } else {
        countPembelajaran++;
        sumBobotPembelajaran += bobot;
      }

      const existing = studentContributions.get(mhsId) || {
        totalRawBobot: 0,
        effectiveBobot: 0,
        prestasiBobot: 0,
        pembelajaranBobot: 0,
        activities: [],
      };

      existing.totalRawBobot += bobot;
      if (jenisRumpun === 'prestasi') existing.prestasiBobot += bobot;
      else existing.pembelajaranBobot += bobot;

      // Capping 1.00 per mahasiswa (Hal. 53 Ketentuan a)
      existing.effectiveBobot = Math.min(1.00, existing.totalRawBobot);
      existing.activities.push({
        id: item.id.toString(),
        kegiatanNama: item.kegiatan?.nama || '-',
        bobot,
        jenisRumpun,
      });

      studentContributions.set(mhsId, existing);
    }
  }

  // 6. Hitung Total Akumulasi Nasional IKU 3
  let totalBobotEfektif = 0;
  for (const [, cont] of studentContributions.entries()) {
    totalBobotEfektif += cont.effectiveBobot;
  }

  // Formula: Capaian = (Total Bobot Efektif / Total Mahasiswa) * 100%
  const capaianPersen = totalMahasiswa > 0
    ? Math.min(100, Number(((totalBobotEfektif / totalMahasiswa) * 100).toFixed(2)))
    : 0;

  const selisih = Number((capaianPersen - targetVal).toFixed(2));
  const statusTarget: 'tercapai' | 'belum_tercapai' = capaianPersen >= targetVal ? 'tercapai' : 'belum_tercapai';

  // Gap Analysis: Berapa mahasiswa lagi (bobot 1.0) untuk mencapai target?
  const targetBobotNeeded = (targetVal * totalMahasiswa) / 100;
  const gapMahasiswa = Math.max(0, Math.ceil(targetBobotNeeded - totalBobotEfektif));

  // Dekomposisi 2 Rumpun
  const totalRumpunCount = countPrestasi + countPembelajaran;
  const persentasePrestasi = totalRumpunCount > 0 ? Math.round((countPrestasi / totalRumpunCount) * 100) : 0;
  const persentasePembelajaran = totalRumpunCount > 0 ? 100 - persentasePrestasi : 0;

  let cakupanFakultas = 'Seluruh Universitas Andalas';
  if (filter.fakultasId) {
    const f = await prisma.fakultas.findUnique({ where: { id: Number(filter.fakultasId) } });
    if (f) cakupanFakultas = f.nama;
  }

  let cakupanProdi: string | undefined = undefined;
  if (filter.prodiId) {
    const p = await prisma.programStudi.findUnique({ where: { id: Number(filter.prodiId) } });
    if (p) cakupanProdi = p.nama;
  }

  return {
    kpi: {
      tahun,
      triwulan: labelTriwulan,
      capaian: capaianPersen,
      target: targetVal,
      selisih,
      statusTarget,
      totalMahasiswa,
      totalKontributor: studentContributions.size,
      totalBobotEfektif: Number(totalBobotEfektif.toFixed(2)),
      gapMahasiswa,
    },
    rumpunDistribusi: {
      prestasi: {
        count: countPrestasi,
        totalBobot: Number(sumBobotPrestasi.toFixed(2)),
        persentase: persentasePrestasi,
      },
      pembelajaran: {
        count: countPembelajaran,
        totalBobot: Number(sumBobotPembelajaran.toFixed(2)),
        persentase: persentasePembelajaran,
      },
    },
    cakupan: {
      fakultas: cakupanFakultas,
      prodi: cakupanProdi,
    },
  };
}

/**
 * Service: Komparasi Peringkat Seluruh Fakultas
 */
export async function calculateIku3Faculties(tahun: number, triwulan?: number): Promise<Iku3FacultyComparisonItem[]> {
  const allFakultas = await prisma.fakultas.findMany({
    select: { id: true, nama: true },
    orderBy: { nama: 'asc' },
  });

  const results: Iku3FacultyComparisonItem[] = [];

  for (const f of allFakultas) {
    const data = await calculateIku3Dashboard({
      tahun,
      triwulan,
      fakultasId: f.id,
    });

    results.push({
      fakultasId: f.id,
      namaFakultas: f.nama,
      totalMahasiswa: data.kpi.totalMahasiswa,
      totalKontributor: data.kpi.totalKontributor,
      totalBobot: data.kpi.totalBobotEfektif,
      capaianPersen: data.kpi.capaian,
      ranking: 0,
    });
  }

  // Urutkan berdasarkan capaian tertinggi
  results.sort((a, b) => b.capaianPersen - a.capaianPersen);
  results.forEach((item, idx) => {
    item.ranking = idx + 1;
  });

  return results;
}

/**
 * Service: Tren Capaian Tahunan (Misal 3 Tahun Terakhir)
 */
export async function calculateIku3Trend(fakultasId?: number): Promise<Iku3TrendItem[]> {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 2, currentYear - 1, currentYear];

  const trendData: Iku3TrendItem[] = [];

  for (const y of years) {
    const data = await calculateIku3Dashboard({
      tahun: y,
      fakultasId,
    });

    trendData.push({
      tahun: y,
      capaian: data.kpi.capaian,
      target: data.kpi.target,
      totalMahasiswa: data.kpi.totalMahasiswa,
      totalKontributor: data.kpi.totalKontributor,
    });
  }

  return trendData;
}

/**
 * Service: Tren Capaian per Triwulan (TW 1 - TW 4) untuk Tahun Terpilih
 */
export async function calculateIku3QuarterlyTrend(
  tahun: number,
  fakultasId?: number,
  prodiId?: number
): Promise<Iku3QuarterlyTrendItem[]> {
  const results: Iku3QuarterlyTrendItem[] = [];

  for (let tw = 1; tw <= 4; tw++) {
    const data = await calculateIku3Dashboard({
      tahun,
      triwulan: tw,
      fakultasId,
      prodiId,
    });

    results.push({
      triwulan: tw,
      label: `TW ${tw}`,
      capaian: data.kpi.capaian,
      target: data.kpi.target,
      totalMahasiswa: data.kpi.totalMahasiswa,
      totalKontributor: data.kpi.totalKontributor,
    });
  }

  return results;
}

/**
 * Service: Daftar Detail Mahasiswa Kontributor (Data Auditability)
 */
export async function getIku3ActivitiesDetail(
  filter: Iku3Filter & { search?: string; page?: number; limit?: number; baseUrl?: string }
): Promise<{ total: number; page: number; totalPages: number; data: Iku3ActivityDetailItem[] }> {
  const tahun = filter.tahun || new Date().getFullYear();
  const { startDate, endDate } = getDateRange(tahun, filter.triwulan);
  const page = Math.max(1, Number(filter.page || 1));
  const limit = Math.max(1, Math.min(100, Number(filter.limit || 15)));
  const skip = (page - 1) * limit;

  const dynamicRules = await prisma.iku3BobotRule.findMany({ where: { aktif: true, deletedAt: null } });

  const whereCondition: any = {
    status: 'sah',
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (filter.fakultasId) {
    whereCondition.mahasiswa = {
      prodi: { fakultasId: Number(filter.fakultasId) },
    };
  }

  if (filter.search) {
    const search = filter.search.trim();
    whereCondition.OR = [
      { mahasiswa: { nim: { contains: search } } },
      { mahasiswa: { user: { nama: { contains: search } } } },
      { kegiatan: { nama: { contains: search } } },
    ];
  }

  const [total, perolehan] = await Promise.all([
    prisma.perolehanPoin.count({ where: whereCondition }),
    prisma.perolehanPoin.findMany({
      where: whereCondition,
      include: {
        mahasiswa: {
          include: {
            user: { select: { nama: true } },
            prodi: { include: { fakultas: true } },
          },
        },
        kegiatan: {
          include: { kategori: true, skala: true },
        },
        klaimPoin: {
          include: { peranUsulan: true, bukti: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  const items: Iku3ActivityDetailItem[] = perolehan.map(p => {
    const kategoriNama = normalize(p.kegiatan?.kategori?.nama);
    const skalaNama = p.kegiatan?.skala?.nama || '-';
    const peranNama = p.klaimPoin?.peranUsulan?.nama || '-';

    const isLomba = kategoriNama.includes('kompetisi') || kategoriNama.includes('lomba') || 
                    normalize(peranNama).includes('juara') || normalize(peranNama).includes('finalis');

    const kegiatanNamaAct = normalize(p.kegiatan?.nama);
    const PEMBELAJARAN_KEYWORDS = [
      'magang', 'internship', 'msib', 'mbkm', 'kampus mengajar',
      'pertukaran pelajar', 'pertukaran mahasiswa', 'exchange', 'iisma',
      'studi independen', 'riset luar', 'proyek kemanusiaan',
      'kkn tematik', 'kkn internasional',
      'pembelajaran luar kampus', 'belajar luar kampus',
    ];
    const isPembelajaranLuarKampus = PEMBELAJARAN_KEYWORDS.some(kw =>
      kategoriNama.includes(kw) || kegiatanNamaAct.includes(kw)
    );

    let jenisRumpun: 'prestasi' | 'pembelajaran' = 'prestasi';
    let bobot = 0;

    if (isLomba) {
      jenisRumpun = 'prestasi';
      bobot = resolveBobotPrestasi(skalaNama, peranNama, dynamicRules);
    } else if (isPembelajaranLuarKampus) {
      jenisRumpun = 'pembelajaran';
      bobot = resolveBobotPembelajaran(20, dynamicRules);
    } else {
      // Kegiatan non-lomba & non-MBKM → bukan IKU 3, tampilkan bobot 0
      jenisRumpun = 'pembelajaran';
      bobot = 0;
    }

    return {
      id: p.id.toString(),
      mahasiswaId: p.mahasiswaId.toString(),
      nim: p.mahasiswa?.nim || '-',
      namaMahasiswa: p.mahasiswa?.user?.nama || '-',
      fakultas: p.mahasiswa?.prodi?.fakultas?.nama || '-',
      prodi: p.mahasiswa?.prodi?.nama || '-',
      namaKegiatan: p.kegiatan?.nama || '-',
      kategori: p.kegiatan?.kategori?.nama || 'Aktivitas Eksternal',
      jenisRumpun,
      skala: skalaNama,
      peran: peranNama,
      bobot,
      tanggal: p.createdAt.toISOString().split('T')[0],
      buktiUrl: (() => {
        const raw = p.klaimPoin?.bukti[0]?.url || null;
        if (!raw) return null;
        if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
        const base = (filter.baseUrl || process.env.BACKEND_URL || '').replace(/\/$/, '');
        return base ? `${base}${raw.startsWith('/') ? '' : '/'}${raw}` : raw;
      })(),
      status: 'Sah',
    };
  });

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: items,
  };
}
