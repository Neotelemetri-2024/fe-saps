import prisma from '../../lib/prisma';
import { getKurikulumByFilter, resolveKurikulumMahasiswa, resolveKurikulumMahasiswaMap, targetPoinKurikulum } from '../kurikulumResolver.service';

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

  // Jika filter kurikulumId tidak dipilih, ambil kurikulum aktif sebagai acuan capaian pilar
  const kurikulumAktif = !kurikulumFilter
    ? (await prisma.kurikulum.findFirst({
        where: { status: 'aktif' },
        orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
        include: {
          capaian: {
            orderBy: { urutan: 'asc' },
            include: { subCapaian: { orderBy: { id: 'asc' } } },
          },
        },
      })) ||
      (await prisma.kurikulum.findFirst({
        orderBy: { id: 'desc' },
        include: {
          capaian: {
            orderBy: { urutan: 'asc' },
            include: { subCapaian: { orderBy: { id: 'asc' } } },
          },
        },
      }))
    : null;

  const kurikulumAcuan = kurikulumFilter || kurikulumAktif;

  const kurikulumMeta = kurikulumFilter || {
    id: kurikulumAktif?.id || 0,
    nama: kurikulumAktif ? kurikulumAktif.nama : 'Campuran (per mahasiswa)',
    capaian: kurikulumAktif?.capaian || [],
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

  // Mapping subCapaian ID ke tahun capaian (untuk kurikulum acuan)
  const subCapaianTahunMap = new Map<number, number>();
  kurikulumAcuan?.capaian?.forEach((c: any, idx: number) => {
    const th = c.urutan || (idx + 1);
    c.subCapaian?.forEach((sc: any) => subCapaianTahunMap.set(sc.id, th));
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
  if (filter.kurikulumId) {
    mhsWhere.kurikulumId = filter.kurikulumId;
  }

  const mahasiswaRaw = await prisma.mahasiswa.findMany({
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
          detail: true,
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

  // 4. Proses Data Capaian Tiap Mahasiswa
  let totalPoinSahGlobal = 0;
  let totalMahasiswaLulusTarget = 0;
  const sumPoinPerTahun = [0, 0, 0, 0, 0]; // index 1..4
  const kurikulumMap = filter.kurikulumId
    ? null
    : await resolveKurikulumMahasiswaMap(
        mahasiswaRaw.map((m) => ({
          userId: m.userId,
          angkatan: m.angkatan,
          kurikulumId: (m as any).kurikulumId,
        })),
      );

  const mahasiswaList = mahasiswaRaw.map((m) => {
    const kurikulumMhs = kurikulumFilter || kurikulumMap?.get(String(m.userId)) || kurikulumAcuan || null;
    const targetPoinTotal = targetPoinKurikulum(kurikulumMhs) || targetPoinTotalDefault;
    const localSubMap = new Map<number, number>();
    if (kurikulumMhs?.capaian) {
      kurikulumMhs.capaian.forEach((c: any, idx: number) => {
        const th = c.urutan || (idx + 1);
        c.subCapaian?.forEach((sc: any) => localSubMap.set(sc.id, th));
      });
    }

    let mhsTotalPoin = 0;
    const poinPerTahun = [0, 0, 0, 0, 0];
    const perolehanFiltered = kurikulumMhs
      ? m.perolehanPoin.filter((pp: any) =>
          pp.kurikulumId != null
            ? Number(pp.kurikulumId) === Number(kurikulumMhs.id)
            : true,
        )
      : m.perolehanPoin;

    perolehanFiltered.forEach((pp: any) => {
      mhsTotalPoin += pp.totalPoin;

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

    totalPoinSahGlobal += mhsTotalPoin;
    if (mhsTotalPoin >= targetPoinTotal) {
      totalMahasiswaLulusTarget++;
    }

    const persentase = targetPoinTotal > 0
      ? Math.min(Math.round((mhsTotalPoin / targetPoinTotal) * 100), 100)
      : 0;

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
      targetPoin: targetPoinTotal,
      persentase,
      statusTarget: (mhsTotalPoin >= targetPoinTotal ? 'Tercapai' : 'Belum Tercapai') as 'Tercapai' | 'Belum Tercapai',
    };
  });

  const totalMahasiswa = mahasiswaRaw.length;
  const rataRataPoin = totalMahasiswa > 0 ? Math.round(totalPoinSahGlobal / totalMahasiswa) : 0;
  const rataRataPersentase = totalMahasiswa > 0
    ? Math.min(Math.round((rataRataPoin / (targetPoinTotalDefault || 1)) * 100), 100)
    : 0;
  const persentaseLulusTarget = totalMahasiswa > 0 ? Math.round((totalMahasiswaLulusTarget / totalMahasiswa) * 100) : 0;

  // 5. Statistik Capaian per Pilar Kurikulum
  const capaianKurikulumStats = capaianList.map((c: { id: number; nama: string; tahun: number; targetPoin: number }) => {
    const th = (c.tahun >= 1 && c.tahun <= 4) ? c.tahun : 1;
    const poinTahun = sumPoinPerTahun[th] || 0;
    const avgTerkumpul = totalMahasiswa > 0 ? Math.round(poinTahun / totalMahasiswa) : 0;
    const persen = c.targetPoin > 0 ? Math.min(Math.round((avgTerkumpul / c.targetPoin) * 100), 100) : 0;
    return {
      nama: c.nama,
      tahun: c.tahun,
      targetPoin: c.targetPoin,
      rataRataTerkumpul: avgTerkumpul,
      persentaseCapaian: persen,
    };
  });

  // 6. Komparasi Unit (Fakultas atau Prodi)
  let komparasiUnit: 'fakultas' | 'prodi' = 'fakultas';
  const komparasiItems: any[] = [];

  if (scope === 'fakultas' || effectiveFakultasId) {
    komparasiUnit = 'prodi';
    const prodiList = await prisma.programStudi.findMany({
      where: effectiveFakultasId ? { fakultasId: effectiveFakultasId } : {},
      include: {
        mahasiswa: {
          include: {
            perolehanPoin: {
              where: { status: 'sah' },
              include: { kegiatan: { include: { kategori: true } } },
            },
          },
        },
      },
    });

    prodiList.forEach((p) => {
      let totalPoinProdi = 0;
      const mhsCount = p.mahasiswa.length;
      const katMap: Record<string, number> = {};

      p.mahasiswa.forEach((m) => {
        m.perolehanPoin.forEach((pp) => {
          totalPoinProdi += pp.totalPoin;
          const kName = pp.kegiatan?.kategori?.nama || 'Lainnya';
          katMap[kName] = (katMap[kName] || 0) + pp.totalPoin;
        });
      });

      const avgPoin = mhsCount > 0 ? Math.round(totalPoinProdi / mhsCount) : 0;
      const avgPersen = Math.min(Math.round((avgPoin / (targetPoinTotalDefault || 1)) * 100), 100);

      komparasiItems.push({
        id: p.id,
        nama: p.nama,
        totalMahasiswa: mhsCount,
        totalPoin: totalPoinProdi,
        rataRataPoin: avgPoin,
        rataRataPersentase: avgPersen,
        kategoriPoin: katMap,
      });
    });
  } else {
    // Tingkat Universitas: Ranking 15 Fakultas
    komparasiUnit = 'fakultas';
    const fakultasList = await prisma.fakultas.findMany({
      include: {
        programStudi: {
          include: {
            mahasiswa: {
              include: {
                perolehanPoin: {
                  where: { status: 'sah' },
                  include: { kegiatan: { include: { kategori: true } } },
                },
              },
            },
          },
        },
      },
    });

    fakultasList.forEach((f) => {
      let totalPoinFak = 0;
      let mhsCount = 0;
      const katMap: Record<string, number> = {};

      f.programStudi.forEach((p) => {
        mhsCount += p.mahasiswa.length;
        p.mahasiswa.forEach((m) => {
          m.perolehanPoin.forEach((pp) => {
            totalPoinFak += pp.totalPoin;
            const kName = pp.kegiatan?.kategori?.nama || 'Lainnya';
            katMap[kName] = (katMap[kName] || 0) + pp.totalPoin;
          });
        });
      });

      const avgPoin = mhsCount > 0 ? Math.round(totalPoinFak / mhsCount) : 0;
      const avgPersen = Math.min(Math.round((avgPoin / (targetPoinTotalDefault || 1)) * 100), 100);

      komparasiItems.push({
        id: f.id,
        nama: f.nama,
        totalMahasiswa: mhsCount,
        totalPoin: totalPoinFak,
        rataRataPoin: avgPoin,
        rataRataPersentase: avgPersen,
        kategoriPoin: katMap,
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

  const prestasiList = perolehanPrestasi.map((p) => ({
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
      targetPoin: targetPoinTotalDefault,
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
