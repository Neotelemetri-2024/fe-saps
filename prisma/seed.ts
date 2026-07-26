import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('=== SEED DIMULAI ===\n')

  // ────────────────────────────────────────
  // 1. MASTER MATRIKS (akun, kurikulum, kategori, skala, matriks)
  // ────────────────────────────────────────
  console.log('📌 [1/4] seed-master-matriks...')
  const { main: masterMatriks } = await import('./seed-master-matriks')
  await masterMatriks()

  // ────────────────────────────────────────
  // 2. AKUN DITMAWA (admin & pimpinan ditmawa)
  // ────────────────────────────────────────
  console.log('\n📌 [2/4] seed-ditmawa...')
  const { main: ditmawa } = await import('./seed-ditmawa')
  await ditmawa()

  // ────────────────────────────────────────
  // 3. DUMMY PIMPINAN (kegiatan & klaim untuk testing)
  // ────────────────────────────────────────
  console.log('\n📌 [3/4] seed-dummy-pimpinan...')
  const { main: dummyPimpinan } = await import('./seed-dummy-pimpinan')
  await dummyPimpinan()

  // ────────────────────────────────────────
  // 4. ALL PIMPINAN (data lengkap)
  // ────────────────────────────────────────
  console.log('\n📌 [4/4] seed-all-pimpinan...')
  const { main: allPimpinan } = await import('./seed-all-pimpinan')
  await allPimpinan()

  console.log('\n=== SEED SELESAI ===')
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
