import 'dotenv/config';
import prisma from './src/lib/prisma';

async function main() {
  // 1. Cek NIM 2311210001 (sample dari template)
  const sample = await prisma.mahasiswa.findUnique({
    where: { nim: '2311210001' },
    include: { user: { select: { id: true, nama: true, email: true } } }
  });
  
  console.log('\n=== CEK NIM 2311210001 (Baris Contoh Template) ===');
  if (sample) {
    console.log('Mahasiswa DITEMUKAN:');
    console.log('  userId:', sample.userId.toString());
    console.log('  nim:', sample.nim);
    console.log('  user:', sample.user ? `${sample.user.nama} (${sample.user.email})` : '❌ NULL / ORPHAN!');
  } else {
    console.log('NIM 2311210001 TIDAK ADA di database (aman, hanya contoh template)');
  }

  // 2. Cek semua mahasiswa dan lihat mana yang user-nya null
  const allMahasiswa = await prisma.mahasiswa.findMany({
    include: { user: { select: { id: true, nama: true } } },
    orderBy: { nim: 'asc' }
  });

  const orphans = allMahasiswa.filter(m => !m.user);

  console.log('\n=== CEK MAHASISWA ORPHAN (tanpa relasi User) ===');
  if (orphans.length === 0) {
    console.log('✅ Tidak ada mahasiswa orphan. Semua data bersih!');
  } else {
    console.log(`⚠️ Ditemukan ${orphans.length} mahasiswa ORPHAN:`);
    orphans.forEach(o => console.log(`  - userId: ${o.userId}, nim: ${o.nim}`));
  }

  // 3. Statistik
  const totalMhs = allMahasiswa.length;
  const totalUsers = await prisma.user.count({ where: { peran: 'mahasiswa' } });
  console.log(`\n=== STATISTIK ===`);
  console.log(`Total record Mahasiswa: ${totalMhs}`);
  console.log(`Total record User (peran=mahasiswa): ${totalUsers}`);
  console.log(`Daftar semua mahasiswa:`);
  allMahasiswa.forEach(m => {
    const status = m.user ? '✅' : '❌';
    console.log(`  ${status} NIM: ${m.nim} | userId: ${m.userId} | nama: ${m.user?.nama || 'N/A'}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
