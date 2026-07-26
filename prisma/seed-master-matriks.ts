import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

type KatDef = {
  nama: string
  skala: string[]
  peran: string[]
  poin: number[][]
}

const FAKULTAS_LIST = [
  'Fakultas Teknologi Informasi',
  'Fakultas Teknik',
  'Fakultas Ekonomi dan Bisnis',
  'Fakultas Hukum',
  'Fakultas Kedokteran',
  'Fakultas MIPA',
  'Fakultas Pertanian',
  'Fakultas Peternakan',
  'Fakultas Ilmu Budaya',
  'Fakultas Ilmu Sosial dan Ilmu Politik',
  'Fakultas Keperawatan',
  'Fakultas Kesehatan Masyarakat',
  'Fakultas Farmasi',
  'Fakultas Teknologi Pertanian',
  'Fakultas Kedokteran Gigi',
]

const KATEGORI_DEFS: KatDef[] = [
  {
    nama: 'Prestasi/Kompetisi',
    skala: [
      'Internasional',
      'Nasional (Puspresnas/ DIKTISAINTEK)',
      'Regional/ provinsi',
      'Internal UNAND (universitas/ fakultas)',
    ],
    peran: [
      'JUARA 1/ EMAS',
      'JUARA 2/ PERAK',
      'JUARA 3/ PERUNGGU',
      'PENGHARGAAN/ FINALIS/PESERTA',
    ],
    poin: [
      [100, 80, 50, 30],
      [90, 70, 45, 25],
      [80, 60, 40, 20],
      [50, 40, 25, 10],
    ],
  },
  {
    nama: 'Organisasi/Volunteer',
    skala: [
      'SKALA UNIVERSITAS',
      'SKALA FAKULTAS/ KEDEPUTIAN',
      'SKALA DEPARTEMEN',
    ],
    peran: [
      'Ketua Umum/ Presiden',
      'Pengurus Inti (Sekretaris, Bendahara/ Kabid)',
      'Anggota Aktif/ Staff',
      'Ketua Panitia/ Pelaksana Event',
      'Mahasiswa/ Anggota Baru',
    ],
    poin: [
      [100, 80, 50, 40, 20],
      [90, 70, 45, 35, 15],
      [80, 60, 40, 30, 10],
    ],
  },
  {
    nama: 'Pelatihan/Seminar',
    skala: [
      'SKALA INTERNATIONAL',
      'SKALA NASIONAL',
      'SKALA LOKAL/ UNAND',
    ],
    peran: [
      'Pembicara/ Narasumber/ Fasilitator',
      'Moderator/ Panitia Eksekutif',
      'Peserta Pelatihan Terstruktur',
      'Peserta Pelatihan Umum/ Kuliah Umum/ Webinar',
    ],
    poin: [
      [60, 35, 30, 15],
      [50, 25, 25, 10],
      [50, 25, 20, 10],
    ],
  },
]

async function ensureKategoriWithMatriks(kurikulumId: number, def: KatDef) {
  let kategori = await prisma.mpKategori.findUnique({
    where: { nama: def.nama },
    include: { skala: true, peran: true },
  })

  if (!kategori) {
    kategori = await prisma.mpKategori.create({
      data: {
        nama: def.nama,
        skala: {
          create: def.skala.map((nama, i) => ({ nama, urutan: i + 1 })),
        },
        peran: {
          create: def.peran.map((nama, i) => ({ nama, urutan: i + 1 })),
        },
      },
      include: { skala: true, peran: true },
    })
    console.log(`   + kategori baru: ${def.nama}`)
  } else {
    // Lengkapi skala/peran yang belum ada
    for (let i = 0; i < def.skala.length; i++) {
      const nama = def.skala[i]
      const exists = kategori.skala.find((s) => s.nama === nama)
      if (!exists) {
        await prisma.mpSkala.create({
          data: { kategoriId: kategori.id, nama, urutan: i + 1 },
        })
      }
    }
    for (let i = 0; i < def.peran.length; i++) {
      const nama = def.peran[i]
      const exists = kategori.peran.find((p) => p.nama === nama)
      if (!exists) {
        await prisma.mpPeran.create({
          data: { kategoriId: kategori.id, nama, urutan: i + 1 },
        })
      }
    }
    kategori = await prisma.mpKategori.findUniqueOrThrow({
      where: { id: kategori.id },
      include: { skala: true, peran: true },
    })
    console.log(`   = kategori sudah ada: ${def.nama}`)
  }

  const skala = [...kategori.skala].sort((a, b) => a.urutan - b.urutan)
  const peran = [...kategori.peran].sort((a, b) => a.urutan - b.urutan)

  for (let r = 0; r < Math.min(skala.length, def.poin.length); r++) {
    for (let c = 0; c < Math.min(peran.length, def.poin[r].length); c++) {
      await prisma.matriksPoin.upsert({
        where: {
          kurikulumId_kategoriId_skalaId_peranId: {
            kurikulumId,
            kategoriId: kategori.id,
            skalaId: skala[r].id,
            peranId: peran[c].id,
          },
        },
        update: { poin: def.poin[r][c] },
        create: {
          kurikulumId,
          kategoriId: kategori.id,
          skalaId: skala[r].id,
          peranId: peran[c].id,
          poin: def.poin[r][c],
        },
      })
    }
  }
}

export async function main() {
  console.log('🌟 [1/6] Fakultas & Program Studi...')
  for (const nama of FAKULTAS_LIST) {
    await prisma.fakultas.upsert({
      where: { nama },
      update: {},
      create: { nama },
    })
  }
  const fti = await prisma.fakultas.findUniqueOrThrow({
    where: { nama: 'Fakultas Teknologi Informasi' },
  })
  const ftek = await prisma.fakultas.findUniqueOrThrow({
    where: { nama: 'Fakultas Teknik' },
  })

  const prodiData = [
    { fakultasId: fti.id, nama: 'Sistem Informasi' },
    { fakultasId: fti.id, nama: 'Teknik Informatika' },
    { fakultasId: ftek.id, nama: 'Teknik Sipil' },
    { fakultasId: ftek.id, nama: 'Teknik Elektro' },
    { fakultasId: ftek.id, nama: 'Teknik Mesin' },
  ]
  for (const prodi of prodiData) {
    await prisma.programStudi.upsert({
      where: { fakultasId_nama: { fakultasId: prodi.fakultasId, nama: prodi.nama } },
      update: {},
      create: prodi,
    })
  }
  const prodiSI = await prisma.programStudi.findFirstOrThrow({
    where: { nama: 'Sistem Informasi', fakultasId: fti.id },
  })
  console.log(`✅ ${FAKULTAS_LIST.length} fakultas, ${prodiData.length} prodi`)

  console.log('🌟 [2/6] Akun dasar (password: password123)...')
  const passwordHash = await bcrypt.hash('password123', 10)

  async function ensureUser(opts: {
    email: string
    nama: string
    peran: 'mahasiswa' | 'dosen' | 'staff' | 'operator_org'
    staff?: { jabatan: string; fakultasId?: number | null }
    dosen?: { nidn: string; fakultasId: number }
    mahasiswa?: { nim: string; prodiId: number; dosenPaId?: bigint; angkatan?: number }
  }) {
    let user = await prisma.user.findUnique({ where: { email: opts.email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          nama: opts.nama,
          email: opts.email,
          passwordHash,
          peran: opts.peran,
        },
      })
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, nama: opts.nama, aktif: true },
      })
    }

    if (opts.staff) {
      const existing = await prisma.staff.findUnique({ where: { userId: user.id } })
      if (!existing) {
        await prisma.staff.create({
          data: {
            userId: user.id,
            jabatan: opts.staff.jabatan as any,
            fakultasId: opts.staff.fakultasId ?? null,
          },
        })
      }
    }
    if (opts.dosen) {
      const existing = await prisma.dosen.findUnique({ where: { userId: user.id } })
      if (!existing) {
        await prisma.dosen.create({
          data: {
            userId: user.id,
            nidn: opts.dosen.nidn,
            fakultasId: opts.dosen.fakultasId,
          },
        })
      }
    }
    if (opts.mahasiswa) {
      const existing = await prisma.mahasiswa.findUnique({ where: { userId: user.id } })
      if (!existing) {
        await prisma.mahasiswa.create({
          data: {
            userId: user.id,
            nim: opts.mahasiswa.nim,
            prodiId: opts.mahasiswa.prodiId,
            dosenPaId: opts.mahasiswa.dosenPaId,
            angkatan: opts.mahasiswa.angkatan,
          },
        })
      }
    }
    return user
  }

  const pimpinan = await ensureUser({
    email: 'pimpinan.ditmawa@unand.ac.id',
    nama: 'Pimpinan Ditmawa',
    peran: 'staff',
    staff: { jabatan: 'pimpinan_ditmawa' },
  })
  await ensureUser({
    email: 'admin.ditmawa@unand.ac.id',
    nama: 'Admin Ditmawa',
    peran: 'staff',
    staff: { jabatan: 'admin_ditmawa' },
  })
  await ensureUser({
    email: 'admin.fti@unand.ac.id',
    nama: 'Admin Fakultas FTI',
    peran: 'staff',
    staff: { jabatan: 'admin_fakultas', fakultasId: fti.id },
  })
  await ensureUser({
    email: 'pimpinan.fti@unand.ac.id',
    nama: 'Pimpinan Fakultas FTI',
    peran: 'staff',
    staff: { jabatan: 'pimpinan_fakultas', fakultasId: fti.id },
  })
  const dosen = await ensureUser({
    email: 'ahmad.rivai@unand.ac.id',
    nama: 'Dr. Ahmad Rivai, M.Kom',
    peran: 'dosen',
    dosen: { nidn: '198501012020011001', fakultasId: fti.id },
  })

  await ensureUser({
    email: 'budi.mahasiswa@unand.ac.id',
    nama: 'Budi Mahasiswa',
    peran: 'mahasiswa',
    mahasiswa: {
      nim: '2111522001',
      prodiId: prodiSI.id,
      dosenPaId: dosen.id,
      angkatan: 2021,
    },
  })

  console.log('🌟 [3/6] Organisasi UKM / UKMF + operator...')
  async function ensureOrg(nama: string, tipe: 'UKM' | 'UKMF', fakultasId: number | null) {
    let org = await prisma.organisasi.findFirst({ where: { nama, tipe } })
    if (!org) {
      org = await prisma.organisasi.create({
        data: { nama, tipe, fakultasId },
      })
    }
    return org
  }

  const ukmDebat = await ensureOrg('UKM Debat', 'UKM', null)
  await ensureOrg('UKM Robotika', 'UKM', null)
  await ensureOrg('UKM Paduan Suara', 'UKM', null)
  await ensureOrg('UKMF IT Community', 'UKMF', fti.id)
  await ensureOrg('UKMF Teknik Sipil Club', 'UKMF', ftek.id)

  const operatorUkm = await ensureUser({
    email: 'operator.debat@unand.ac.id',
    nama: 'Andi Pratama (Operator UKM Debat)',
    peran: 'operator_org',
  })
  const existingOp = await prisma.organisasiOperator.findUnique({
    where: { userId: operatorUkm.id },
  })
  if (!existingOp) {
    await prisma.organisasiOperator.create({
      data: { userId: operatorUkm.id, organisasiId: ukmDebat.id },
    })
  } else if (existingOp.organisasiId !== ukmDebat.id) {
    await prisma.organisasiOperator.update({
      where: { userId: operatorUkm.id },
      data: { organisasiId: ukmDebat.id },
    })
  }

  const operatorUkmf = await ensureUser({
    email: 'operator.ukmf@unand.ac.id',
    nama: 'Sari Operator UKMF',
    peran: 'operator_org',
  })
  const ukmf = await prisma.organisasi.findFirstOrThrow({
    where: { nama: 'UKMF IT Community' },
  })
  const existingOpUkmf = await prisma.organisasiOperator.findUnique({
    where: { userId: operatorUkmf.id },
  })
  if (!existingOpUkmf) {
    await prisma.organisasiOperator.create({
      data: { userId: operatorUkmf.id, organisasiId: ukmf.id },
    })
  }

  console.log('🌟 [4/6] Kurikulum aktif...')
  let kurikulum = await prisma.kurikulum.findFirst({
    where: { nama: 'Kurikulum Merdeka 2024' },
  })
  if (!kurikulum) {
    kurikulum = await prisma.kurikulum.create({
      data: {
        nama: 'Kurikulum Merdeka 2024',
        tahunAkademik: '2024/2025',
        versi: 1,
        status: 'aktif',
        dibuatOleh: pimpinan.id,
        activatedAt: new Date(),
        capaian: {
          create: [
            {
              nama: 'Pondasi',
              jumlahPoin: 20,
              urutan: 1,
              subCapaian: {
                create: [
                  { nama: 'Growth Mindset & Resiliensi', bobotPersen: 25 },
                  { nama: 'Religion Character Development', bobotPersen: 25 },
                  { nama: 'Digital Literacy (Literasi Digital)', bobotPersen: 25 },
                  { nama: 'Public Speaking & Habit Mastery (Bakti)', bobotPersen: 25 },
                ],
              },
            },
            {
              nama: 'Penguatan',
              jumlahPoin: 40,
              urutan: 2,
              subCapaian: {
                create: [
                  { nama: 'Agile Teamwork & Empathy', bobotPersen: 30 },
                  { nama: 'Creativity, Ideation & Innovation', bobotPersen: 35 },
                  { nama: 'Academic Writing & Presentation Skills', bobotPersen: 35 },
                ],
              },
            },
            {
              nama: 'Pemantapan',
              jumlahPoin: 60,
              urutan: 3,
              subCapaian: {
                create: [
                  { nama: 'Global Exposure & Research Planning', bobotPersen: 40 },
                  { nama: 'Adaptive Leadership & Strategic Management', bobotPersen: 30 },
                  { nama: 'Entrepreneurship Skills (P2MW / KBMK)', bobotPersen: 30 },
                ],
              },
            },
            {
              nama: 'Aktualisasi',
              jumlahPoin: 80,
              urutan: 4,
              subCapaian: {
                create: [
                  { nama: 'Networking Skills & Cultural Intelligence', bobotPersen: 50 },
                  { nama: 'Pembekalan Pasca Kampus & English Skills', bobotPersen: 50 },
                ],
              },
            },
          ],
        },
      },
    })
    console.log('   + kurikulum baru dibuat')
  } else if (kurikulum.status !== 'aktif') {
    await prisma.kurikulum.updateMany({ where: { status: 'aktif' }, data: { status: 'arsip' } })
    kurikulum = await prisma.kurikulum.update({
      where: { id: kurikulum.id },
      data: { status: 'aktif', activatedAt: new Date() },
    })
    console.log('   = kurikulum diaktifkan kembali')
  } else {
    console.log('   = kurikulum aktif sudah ada')
  }

  console.log('🌟 [5/6] Master matriks (kategori / skala / peran / poin)...')
  for (const def of KATEGORI_DEFS) {
    await ensureKategoriWithMatriks(kurikulum.id, def)
  }

  console.log('✅ [6/6] Seed master selesai.')
  console.log('   Endpoint FE: GET /api/matriks/kategori|skala|peran, /api/umum/fakultas|prodi|organisasi, /api/kurikulum/aktif')
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isDirectRun) {
  main()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
