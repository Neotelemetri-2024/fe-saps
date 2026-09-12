import 'dotenv/config';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';

// Akun yang TIDAK BOLEH dihapus (Staff & Admin)
const PROTECTED_EMAILS = new Set([
  'pimpinan.ditmawa@unand.ac.id',
  'admin.ditmawa@unand.ac.id',
  'admin.fti@unand.ac.id',
  'pimpinan.fti@unand.ac.id',
  'pimpinan.utama@unand.ac.id',
]);

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log('====================================================');
  console.log(`🧹 PEMBERSIHAN DATA MAHASISWA & DOSEN HASIL SYNC SIA`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (Simulasi saja)' : 'EKSEKUSI PENGHAPUSAN'}`);
  console.log('====================================================\n');

  // 1. Cek jumlah data saat ini
  const totalUserAwal = await prisma.user.count();
  const totalMhsAwal = await prisma.mahasiswa.count();
  const totalDsnAwal = await prisma.dosen.count();
  console.log(`Data Database Saat Ini:`);
  console.log(`- Total Akun User : ${totalUserAwal}`);
  console.log(`- Data Mahasiswa  : ${totalMhsAwal}`);
  console.log(`- Data Dosen      : ${totalDsnAwal}\n`);

  // Cari semua user dengan peran mahasiswa atau dosen yang bukan protected
  const usersToDelete = await prisma.user.findMany({
    where: {
      peran: { in: ['mahasiswa', 'dosen'] },
      email: { notIn: Array.from(PROTECTED_EMAILS) },
    },
    select: { id: true, email: true, peran: true },
  });

  const userIdsToDelete = usersToDelete.map((u) => u.id);
  const countMhsUsers = usersToDelete.filter((u) => u.peran === 'mahasiswa').length;
  const countDsnUsers = usersToDelete.filter((u) => u.peran === 'dosen').length;

  console.log(`Target Pembersihan:`);
  console.log(`- Akun User Mahasiswa SIA : ${countMhsUsers}`);
  console.log(`- Akun User Dosen SIA     : ${countDsnUsers}`);
  console.log(`- Total User akan dihapus : ${userIdsToDelete.length}\n`);

  if (isDryRun) {
    console.log('ℹ️  Mode --dry-run selesai. Tidak ada data yang diubah di database.');
    return;
  }

  if (userIdsToDelete.length === 0) {
    console.log('✅ Tidak ada data SIA yang perlu dibersihkan.');
    return;
  }

  console.log('⏳ Menghapus relasi & data terkait...');

  // A. Set dosenPaId = null
  await prisma.mahasiswa.updateMany({
    data: { dosenPaId: null },
  });

  // B. Hapus tabel relasi mahasiswa jika ada
  await prisma.partisipasi.deleteMany({ where: { mahasiswaId: { in: userIdsToDelete } } });
  await prisma.perolehanPoin.deleteMany({ where: { mahasiswaId: { in: userIdsToDelete } } });
  await prisma.saranPA.deleteMany({
    where: {
      OR: [
        { mahasiswaId: { in: userIdsToDelete } },
        { dosenPaId: { in: userIdsToDelete } },
      ],
    },
  });
  await prisma.izinPA.deleteMany({ where: { dosenPaId: { in: userIdsToDelete } } });
  await prisma.cvGenerated.deleteMany({ where: { mahasiswaId: { in: userIdsToDelete } } });
  await prisma.notifikasi.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  await prisma.auditLog.deleteMany({ where: { aktorId: { in: userIdsToDelete } } });

  // C. Hapus data profil mahasiswa & dosen
  const delMhs = await prisma.mahasiswa.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(`✅ Terhapus: ${delMhs.count} data pada tabel mahasiswa.`);

  const delDsn = await prisma.dosen.deleteMany({ where: { userId: { in: userIdsToDelete } } });
  console.log(`✅ Terhapus: ${delDsn.count} data pada tabel dosen.`);

  // D. Hapus akun user dalam batch (chunk 500)
  const CHUNK_SIZE = 500;
  let totalUserDeleted = 0;
  for (let i = 0; i < userIdsToDelete.length; i += CHUNK_SIZE) {
    const chunk = userIdsToDelete.slice(i, i + CHUNK_SIZE);
    const res = await prisma.user.deleteMany({ where: { id: { in: chunk } } });
    totalUserDeleted += res.count;
  }
  console.log(`✅ Terhapus: ${totalUserDeleted} akun User dari database.`);

  // E. Buat akun demo mahasiswa & dosen jika belum ada
  console.log('\n⏳ Menyiapkan akun demo untuk testing lokal...');
  const salt = await bcrypt.genSalt(10);
  const defaultHash = await bcrypt.hash('password123', salt);

  const fti = await prisma.fakultas.findFirst({ where: { nama: { contains: 'Teknologi Informasi' } } });
  const prodiSI = await prisma.programStudi.findFirst({ where: { nama: { contains: 'Sistem Informasi' } } });
  const kurikulum = await prisma.kurikulum.findFirst({ where: { deletedAt: null } });

  // 1 Demo Dosen
  const demoDosenUser = await prisma.user.upsert({
    where: { email: 'ahmad.rivai@unand.ac.id' },
    update: {},
    create: {
      nama: 'Dr. Ahmad Rivai, M.Kom',
      email: 'ahmad.rivai@unand.ac.id',
      passwordHash: defaultHash,
      peran: 'dosen',
    },
  });

  await prisma.dosen.upsert({
    where: { userId: demoDosenUser.id },
    update: {},
    create: {
      userId: demoDosenUser.id,
      nidn: '198501012020011001',
      fakultasId: fti?.id ?? null,
    },
  });

  // 1 Demo Mahasiswa
  const demoMhsUser = await prisma.user.upsert({
    where: { email: 'budi.santoso@student.unand.ac.id' },
    update: {},
    create: {
      nama: 'Budi Santoso',
      email: 'budi.santoso@student.unand.ac.id',
      passwordHash: defaultHash,
      peran: 'mahasiswa',
    },
  });

  if (prodiSI) {
    await prisma.mahasiswa.upsert({
      where: { userId: demoMhsUser.id },
      update: {},
      create: {
        userId: demoMhsUser.id,
        nim: '2311521001',
        prodiId: prodiSI.id,
        dosenPaId: demoDosenUser.id,
        angkatan: 2023,
        kurikulumId: kurikulum?.id ?? null,
      },
    });
  }

  console.log('✅ Akun demo siap:');
  console.log('   - Mahasiswa: budi.santoso@student.unand.ac.id (password: password123)');
  console.log('   - Dosen PA : ahmad.rivai@unand.ac.id (password: password123)');

  // Verifikasi akhir
  const finalUser = await prisma.user.count();
  const finalMhs = await prisma.mahasiswa.count();
  const finalDsn = await prisma.dosen.count();

  console.log('\n====================================================');
  console.log('🎉 PEMBERSIHAN SELESAI!');
  console.log(`Status Database Lokal Saat Ini:`);
  console.log(`- Total User : ${finalUser} (Staff/Pimpinan/Admin + Demo)`);
  console.log(`- Mahasiswa  : ${finalMhs} (Demo Testing)`);
  console.log(`- Dosen      : ${finalDsn} (Demo Testing)`);
  console.log('====================================================');
}

main()
  .catch((e) => {
    console.error('❌ Error saat pembersihan:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
