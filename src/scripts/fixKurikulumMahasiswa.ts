/**
 * Fix Kurikulum Mahasiswa
 * -----------------------
 * Script untuk mengisi kurikulum_id pada tabel mahasiswa yang masih NULL.
 * Logika: mahasiswa angkatan X → pakai kurikulum dengan angkatan_mulai ≤ X
 *         yang paling besar (terdekat). Jika tidak ada, fallback ke kurikulum aktif.
 *
 * Jalankan: npx tsx src/scripts/fixKurikulumMahasiswa.ts
 */
import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
  console.log('🔧 Memperbaiki kurikulum_id mahasiswa yang NULL...\n');

  // 1. Load semua kurikulum (non-deleted), urutkan dari angkatan_mulai terbesar
  const semuaKurikulum = await prisma.kurikulum.findMany({
    where: { deletedAt: null },
    orderBy: { angkatanMulai: 'desc' },
  });

  console.log('📚 Kurikulum tersedia:');
  for (const k of semuaKurikulum) {
    console.log(`   • [${k.id}] ${k.nama} — angkatan_mulai: ${k.angkatanMulai ?? 'NULL'} — status: ${k.status}`);
  }

  if (semuaKurikulum.length === 0) {
    console.log('\n❌ Tidak ada kurikulum di database. Buat kurikulum terlebih dahulu.');
    return;
  }

  // 2. Helper: cari kurikulum berdasarkan angkatan
  function cariKurikulumId(angkatan: number | null): number | null {
    if (!angkatan || semuaKurikulum.length === 0) {
      const aktif = semuaKurikulum.find(k => k.status === 'aktif');
      return aktif?.id ?? semuaKurikulum[0]?.id ?? null;
    }
    for (const k of semuaKurikulum) {
      if (k.angkatanMulai !== null && k.angkatanMulai <= angkatan) {
        return k.id;
      }
    }
    const aktif = semuaKurikulum.find(k => k.status === 'aktif');
    return aktif?.id ?? semuaKurikulum[0]?.id ?? null;
  }

  // 3. Ambil semua mahasiswa yang kurikulumId-nya NULL
  const mahasiswaTanpaKurikulum = await prisma.mahasiswa.findMany({
    where: { kurikulumId: null },
    select: { userId: true, nim: true, angkatan: true },
  });

  console.log(`\n📊 Mahasiswa dengan kurikulum_id NULL: ${mahasiswaTanpaKurikulum.length}`);

  if (mahasiswaTanpaKurikulum.length === 0) {
    console.log('✅ Semua mahasiswa sudah memiliki kurikulum_id!');
    return;
  }

  // 4. Update satu per satu
  let updated = 0;
  let skipped = 0;
  const perKurikulum: Record<string, number> = {};

  for (const mhs of mahasiswaTanpaKurikulum) {
    const kurikulumId = cariKurikulumId(mhs.angkatan);
    if (!kurikulumId) {
      skipped++;
      continue;
    }

    await prisma.mahasiswa.update({
      where: { userId: mhs.userId },
      data: { kurikulumId },
    });

    const key = `kurikulum_${kurikulumId}`;
    perKurikulum[key] = (perKurikulum[key] || 0) + 1;
    updated++;
  }

  // 5. Ringkasan
  console.log(`\n✅ Selesai!`);
  console.log(`   • Updated: ${updated} mahasiswa`);
  console.log(`   • Skipped: ${skipped} mahasiswa`);
  console.log('\n📋 Distribusi per kurikulum:');
  for (const [key, count] of Object.entries(perKurikulum)) {
    const kId = parseInt(key.replace('kurikulum_', ''));
    const kNama = semuaKurikulum.find(k => k.id === kId)?.nama ?? '?';
    console.log(`   • ${kNama}: ${count} mahasiswa`);
  }

  // 6. Verifikasi akhir
  const sisaNull = await prisma.mahasiswa.count({ where: { kurikulumId: null } });
  const totalMhs = await prisma.mahasiswa.count();
  console.log(`\n📊 Verifikasi: ${totalMhs} total mahasiswa, ${sisaNull} masih NULL kurikulum_id`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
