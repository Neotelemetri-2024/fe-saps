import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'saps_db',
  connectionLimit: 10,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Mulai seeding database...\n');

  // ============================================================
  // 1. FAKULTAS
  // ============================================================
  const fakultasList = [
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
  ];

  for (const nama of fakultasList) {
    await prisma.fakultas.upsert({
      where: { nama },
      update: {},
      create: { nama },
    });
  }
  console.log(`✅ ${fakultasList.length} Fakultas`);

  const fti = await prisma.fakultas.findUnique({ where: { nama: 'Fakultas Teknologi Informasi' } });
  const ftek = await prisma.fakultas.findUnique({ where: { nama: 'Fakultas Teknik' } });

  // ============================================================
  // 2. PROGRAM STUDI
  // ============================================================
  const prodiData = [
    { fakultasId: fti!.id, nama: 'Sistem Informasi' },
    { fakultasId: fti!.id, nama: 'Teknik Informatika' },
    { fakultasId: ftek!.id, nama: 'Teknik Sipil' },
    { fakultasId: ftek!.id, nama: 'Teknik Elektro' },
    { fakultasId: ftek!.id, nama: 'Teknik Mesin' },
  ];

  for (const prodi of prodiData) {
    await prisma.programStudi.upsert({
      where: { fakultasId_nama: { fakultasId: prodi.fakultasId, nama: prodi.nama } },
      update: {},
      create: prodi,
    });
  }
  console.log(`✅ ${prodiData.length} Program Studi`);

  const prodiSI = await prisma.programStudi.findFirst({ where: { nama: 'Sistem Informasi' } });

  // ============================================================
  // 3. USERS + PROFIL (Dosen, Mahasiswa, Staff, Operator)
  // ============================================================

  // --- Pimpinan Ditmawa ---
  const pimpinanUser = await prisma.user.upsert({
    where: { email: 'pimpinan.ditmawa@unand.ac.id' },
    update: {},
    create: {
      nama: 'Prof. Dr. Surya Wijaya, M.Sc',
      email: 'pimpinan.ditmawa@unand.ac.id',
      passwordHash: '$2b$10$placeholder_hash_pimpinan',
      peran: 'staff',
    },
  });
  await prisma.staff.upsert({
    where: { userId: pimpinanUser.id },
    update: {},
    create: { userId: pimpinanUser.id, jabatan: 'pimpinan_ditmawa', fakultasId: null },
  });
  console.log(`✅ Staff: Pimpinan Ditmawa (ID: ${pimpinanUser.id})`);

  // --- Admin Ditmawa ---
  const adminDitmawaUser = await prisma.user.upsert({
    where: { email: 'admin.ditmawa@unand.ac.id' },
    update: {},
    create: {
      nama: 'Rina Sari, S.Kom',
      email: 'admin.ditmawa@unand.ac.id',
      passwordHash: '$2b$10$placeholder_hash_admin_ditmawa',
      peran: 'staff',
    },
  });
  await prisma.staff.upsert({
    where: { userId: adminDitmawaUser.id },
    update: {},
    create: { userId: adminDitmawaUser.id, jabatan: 'admin_ditmawa', fakultasId: null },
  });
  console.log(`✅ Staff: Admin Ditmawa (ID: ${adminDitmawaUser.id})`);

  // --- Admin Fakultas (FTI) ---
  const adminFakultasUser = await prisma.user.upsert({
    where: { email: 'admin.fti@unand.ac.id' },
    update: {},
    create: {
      nama: 'Dian Permata, S.Si',
      email: 'admin.fti@unand.ac.id',
      passwordHash: '$2b$10$placeholder_hash_admin_fak',
      peran: 'staff',
    },
  });
  await prisma.staff.upsert({
    where: { userId: adminFakultasUser.id },
    update: {},
    create: { userId: adminFakultasUser.id, jabatan: 'admin_fakultas', fakultasId: fti!.id },
  });
  console.log(`✅ Staff: Admin Fakultas FTI (ID: ${adminFakultasUser.id})`);

  // --- Pimpinan Fakultas (FTI) ---
  const pimpinanFakUser = await prisma.user.upsert({
    where: { email: 'pimpinan.fti@unand.ac.id' },
    update: {},
    create: {
      nama: 'Dr. Hendra Kurniawan, M.T',
      email: 'pimpinan.fti@unand.ac.id',
      passwordHash: '$2b$10$placeholder_hash_pimpinan_fak',
      peran: 'staff',
    },
  });
  await prisma.staff.upsert({
    where: { userId: pimpinanFakUser.id },
    update: {},
    create: { userId: pimpinanFakUser.id, jabatan: 'pimpinan_fakultas', fakultasId: fti!.id },
  });
  console.log(`✅ Staff: Pimpinan Fakultas FTI (ID: ${pimpinanFakUser.id})`);

  // --- Dosen PA ---
  const dosenUser = await prisma.user.upsert({
    where: { email: 'ahmad.rivai@unand.ac.id' },
    update: {},
    create: {
      nama: 'Dr. Ahmad Rivai, M.Kom',
      email: 'ahmad.rivai@unand.ac.id',
      passwordHash: '$2b$10$placeholder_hash_dosen',
      peran: 'dosen',
    },
  });
  await prisma.dosen.upsert({
    where: { userId: dosenUser.id },
    update: {},
    create: { userId: dosenUser.id, nidn: '198501012020011001', fakultasId: fti!.id },
  });
  console.log(`✅ Dosen PA: Dr. Ahmad Rivai (ID: ${dosenUser.id})`);

  // --- Mahasiswa ---
  const mhsUser = await prisma.user.upsert({
    where: { email: 'budi.santoso@student.unand.ac.id' },
    update: {},
    create: {
      nama: 'Budi Santoso',
      email: 'budi.santoso@student.unand.ac.id',
      passwordHash: '$2b$10$placeholder_hash_mhs',
      peran: 'mahasiswa',
    },
  });
  await prisma.mahasiswa.upsert({
    where: { userId: mhsUser.id },
    update: {},
    create: {
      userId: mhsUser.id,
      nim: '2311521001',
      prodiId: prodiSI!.id,
      dosenPaId: dosenUser.id,
      angkatan: 2023,
    },
  });
  console.log(`✅ Mahasiswa: Budi Santoso (ID: ${mhsUser.id})`);

  // --- Mahasiswa kedua ---
  const mhsUser2 = await prisma.user.upsert({
    where: { email: 'siti.rahayu@student.unand.ac.id' },
    update: {},
    create: {
      nama: 'Siti Rahayu',
      email: 'siti.rahayu@student.unand.ac.id',
      passwordHash: '$2b$10$placeholder_hash_mhs2',
      peran: 'mahasiswa',
    },
  });
  await prisma.mahasiswa.upsert({
    where: { userId: mhsUser2.id },
    update: {},
    create: {
      userId: mhsUser2.id,
      nim: '2311521002',
      prodiId: prodiSI!.id,
      dosenPaId: dosenUser.id,
      angkatan: 2023,
    },
  });
  console.log(`✅ Mahasiswa: Siti Rahayu (ID: ${mhsUser2.id})`);

  // ============================================================
  // 4. ORGANISASI (UKM & UKMF)
  // ============================================================
  const ukmData = [
    { nama: 'UKM Debat', tipe: 'UKM' as const, fakultasId: null },
    { nama: 'UKM Robotika', tipe: 'UKM' as const, fakultasId: null },
    { nama: 'UKM Paduan Suara', tipe: 'UKM' as const, fakultasId: null },
  ];
  for (const ukm of ukmData) {
    await prisma.organisasi.create({ data: ukm });
  }

  const ukmfData = [
    { nama: 'UKMF IT Community', tipe: 'UKMF' as const, fakultasId: fti!.id },
    { nama: 'UKMF Teknik Sipil Club', tipe: 'UKMF' as const, fakultasId: ftek!.id },
  ];
  for (const ukmf of ukmfData) {
    await prisma.organisasi.create({ data: ukmf });
  }
  console.log(`✅ ${ukmData.length} UKM + ${ukmfData.length} UKMF`);

  // --- Operator UKM ---
  const operatorUser = await prisma.user.upsert({
    where: { email: 'operator.debat@unand.ac.id' },
    update: {},
    create: {
      nama: 'Andi Pratama (Operator UKM Debat)',
      email: 'operator.debat@unand.ac.id',
      passwordHash: '$2b$10$placeholder_hash_operator',
      peran: 'operator_org',
    },
  });
  const ukmDebat = await prisma.organisasi.findFirst({ where: { nama: 'UKM Debat' } });
  await prisma.organisasiOperator.upsert({
    where: { userId: operatorUser.id },
    update: {},
    create: { userId: operatorUser.id, organisasiId: ukmDebat!.id },
  });
  console.log(`✅ Operator: UKM Debat (ID: ${operatorUser.id})`);

  // ============================================================
  // 5. MASTER MATRIKS POIN (Kategori, Skala, Peran)
  // ============================================================

  // --- mp_kategori ---
  const kategoriList = ['Kompetisi', 'Organisasi', 'Pelatihan/Seminar'];
  for (const nama of kategoriList) {
    await prisma.mpKategori.upsert({ where: { nama }, update: {}, create: { nama } });
  }
  console.log(`✅ ${kategoriList.length} Kategori Matriks`);

  // --- mp_peran ---
  const katKompetisi = await prisma.mpKategori.findUnique({ where: { nama: 'Kompetisi' } });
  const katOrganisasi = await prisma.mpKategori.findUnique({ where: { nama: 'Organisasi' } });
  const katPelatihan = await prisma.mpKategori.findUnique({ where: { nama: 'Pelatihan/Seminar' } });

  // --- mp_skala ---
  const skalaData = [
    { nama: 'Internasional', urutan: 1 },
    { nama: 'Nasional', urutan: 2 },
    { nama: 'Regional', urutan: 3 },
    { nama: 'Internal UNAND', urutan: 4 },
  ];
  for (const s of skalaData) {
    // Assuming we link the scales to katKompetisi as a base example
    await prisma.mpSkala.upsert({ 
      where: { kategoriId_nama: { kategoriId: katKompetisi!.id, nama: s.nama } }, 
      update: {}, 
      create: { ...s, kategoriId: katKompetisi!.id } 
    });
  }
  console.log(`✅ ${skalaData.length} Skala Matriks`);

  const peranData = [
    // Kompetisi
    { kategoriId: katKompetisi!.id, nama: 'Juara 1', urutan: 1 },
    { kategoriId: katKompetisi!.id, nama: 'Juara 2', urutan: 2 },
    { kategoriId: katKompetisi!.id, nama: 'Juara 3', urutan: 3 },
    { kategoriId: katKompetisi!.id, nama: 'Peserta', urutan: 4 },
    // Organisasi
    { kategoriId: katOrganisasi!.id, nama: 'Ketua', urutan: 1 },
    { kategoriId: katOrganisasi!.id, nama: 'Pengurus Inti', urutan: 2 },
    { kategoriId: katOrganisasi!.id, nama: 'Anggota Aktif', urutan: 3 },
    // Pelatihan/Seminar
    { kategoriId: katPelatihan!.id, nama: 'Pemateri/Narasumber', urutan: 1 },
    { kategoriId: katPelatihan!.id, nama: 'Panitia', urutan: 2 },
    { kategoriId: katPelatihan!.id, nama: 'Peserta', urutan: 3 },
  ];
  for (const p of peranData) {
    await prisma.mpPeran.upsert({
      where: { kategoriId_nama: { kategoriId: p.kategoriId, nama: p.nama } },
      update: {},
      create: p,
    });
  }
  console.log(`✅ ${peranData.length} Peran Matriks`);

  // ============================================================
  // 6. KURIKULUM CONTOH + CAPAIAN + SUB CAPAIAN
  // ============================================================
  const kurikulum = await prisma.kurikulum.create({
    data: {
      nama: 'Kurikulum Merdeka 2024',
      tahunAkademik: '2024/2025',
      versi: 1,
      status: 'aktif',
      dibuatOleh: pimpinanUser.id,
      activatedAt: new Date(),
    },
  });
  console.log(`✅ Kurikulum: ${kurikulum.nama} (ID: ${kurikulum.id})`);

  const capaianData = [
    { nama: 'Pondasi', jumlahPoin: 100, urutan: 1 },
    { nama: 'Penguatan', jumlahPoin: 150, urutan: 2 },
    { nama: 'Pemantapan', jumlahPoin: 200, urutan: 3 },
    { nama: 'Aktualisasi', jumlahPoin: 100, urutan: 4 },
  ];

  for (const c of capaianData) {
    const capaian = await prisma.capaian.create({
      data: { kurikulumId: kurikulum.id, ...c },
    });

    // Sub capaian contoh (bobot total = 100% per capaian)
    await prisma.subCapaian.createMany({
      data: [
        { capaianId: capaian.id, nama: `${c.nama} - Public Speaking`, bobotPersen: 30 },
        { capaianId: capaian.id, nama: `${c.nama} - Leadership`, bobotPersen: 30 },
        { capaianId: capaian.id, nama: `${c.nama} - Teamwork`, bobotPersen: 40 },
      ],
    });
  }
  console.log(`✅ ${capaianData.length} Capaian + Sub Capaian`);

  // ============================================================
  // 7. MATRIKS POIN CONTOH (Kurikulum x Kategori x Skala x Peran)
  // ============================================================
  const skalaInternasional = await prisma.mpSkala.findUnique({ where: { kategoriId_nama: { kategoriId: katKompetisi!.id, nama: 'Internasional' } } });
  const skalaNasional = await prisma.mpSkala.findUnique({ where: { kategoriId_nama: { kategoriId: katKompetisi!.id, nama: 'Nasional' } } });
  const skalaRegional = await prisma.mpSkala.findUnique({ where: { kategoriId_nama: { kategoriId: katKompetisi!.id, nama: 'Regional' } } });
  const skalaInternal = await prisma.mpSkala.findUnique({ where: { kategoriId_nama: { kategoriId: katKompetisi!.id, nama: 'Internal UNAND' } } });

  // Contoh matriks untuk Kompetisi
  const peranKompetisi = await prisma.mpPeran.findMany({ where: { kategoriId: katKompetisi!.id }, orderBy: { urutan: 'asc' } });

  // Poin contoh: Kompetisi × semua skala × semua peran
  const matriksContoh = [
    // Internasional
    { skalaId: skalaInternasional!.id, peranId: peranKompetisi[0].id, poin: 100 }, // Juara 1
    { skalaId: skalaInternasional!.id, peranId: peranKompetisi[1].id, poin: 80 },  // Juara 2
    { skalaId: skalaInternasional!.id, peranId: peranKompetisi[2].id, poin: 60 },  // Juara 3
    { skalaId: skalaInternasional!.id, peranId: peranKompetisi[3].id, poin: 30 },  // Peserta
    // Nasional
    { skalaId: skalaNasional!.id, peranId: peranKompetisi[0].id, poin: 80 },
    { skalaId: skalaNasional!.id, peranId: peranKompetisi[1].id, poin: 60 },
    { skalaId: skalaNasional!.id, peranId: peranKompetisi[2].id, poin: 40 },
    { skalaId: skalaNasional!.id, peranId: peranKompetisi[3].id, poin: 20 },
    // Regional
    { skalaId: skalaRegional!.id, peranId: peranKompetisi[0].id, poin: 50 },
    { skalaId: skalaRegional!.id, peranId: peranKompetisi[1].id, poin: 40 },
    { skalaId: skalaRegional!.id, peranId: peranKompetisi[2].id, poin: 30 },
    { skalaId: skalaRegional!.id, peranId: peranKompetisi[3].id, poin: 15 },
    // Internal
    { skalaId: skalaInternal!.id, peranId: peranKompetisi[0].id, poin: 30 },
    { skalaId: skalaInternal!.id, peranId: peranKompetisi[1].id, poin: 20 },
    { skalaId: skalaInternal!.id, peranId: peranKompetisi[2].id, poin: 15 },
    { skalaId: skalaInternal!.id, peranId: peranKompetisi[3].id, poin: 10 },
  ];

  for (const m of matriksContoh) {
    await prisma.matriksPoin.create({
      data: {
        kurikulumId: kurikulum.id,
        kategoriId: katKompetisi!.id,
        ...m,
      },
    });
  }
  console.log(`✅ ${matriksContoh.length} entri Matriks Poin (Kompetisi)`);

  // ============================================================
  console.log('\n🎉 Seeding selesai! Database siap digunakan.');
  console.log('\n📋 Ringkasan akun:');
  console.log(`   Pimpinan Ditmawa  : pimpinan.ditmawa@unand.ac.id (ID: ${pimpinanUser.id})`);
  console.log(`   Admin Ditmawa     : admin.ditmawa@unand.ac.id (ID: ${adminDitmawaUser.id})`);
  console.log(`   Admin Fakultas FTI: admin.fti@unand.ac.id (ID: ${adminFakultasUser.id})`);
  console.log(`   Pimpinan Fak FTI  : pimpinan.fti@unand.ac.id (ID: ${pimpinanFakUser.id})`);
  console.log(`   Dosen PA          : ahmad.rivai@unand.ac.id (ID: ${dosenUser.id})`);
  console.log(`   Mahasiswa 1       : budi.santoso@student.unand.ac.id (ID: ${mhsUser.id})`);
  console.log(`   Mahasiswa 2       : siti.rahayu@student.unand.ac.id (ID: ${mhsUser2.id})`);
  console.log(`   Operator UKM Debat: operator.debat@unand.ac.id (ID: ${operatorUser.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding gagal:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
