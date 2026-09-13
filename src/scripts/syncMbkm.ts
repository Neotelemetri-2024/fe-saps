/**
 * CLI Script: Sinkronisasi Khusus Kelas MBKM (IKU 3) dari API SIA UNAND
 * --------------------------------------------------------------------
 * Jalankan langsung via terminal:
 *   npm run sync:mbkm
 */
import { syncKelasMbkm } from '../services/sia/siaSync.service';

async function main() {
  console.log('🚀 Memulai sinkronisasi Kelas MBKM dari API SIA UNAND...\n');
  const startTime = Date.now();

  try {
    const result = await syncKelasMbkm();

    console.log('\n📊 HASIL SINKRONISASI KELAS MBKM:');
    console.log('----------------------------------------------------');
    console.log(`• Semester             : ${result.semester}`);
    console.log(`• Total Kelas MBKM     : ${result.totalKelas}`);
    console.log(`• Total Peserta        : ${result.totalPeserta}`);
    console.log(`• Terdaftar di SAPS    : ${result.mahasiswaTerdaftarSaps}`);
    console.log(`• Belum Terdaftar SAPS : ${result.mahasiswaBelumAdaSaps}`);
    if (result.errors.length > 0) {
      console.log(`⚠️ Errors: ${result.errors.length}`);
      console.log(`  Sample error: ${result.errors.slice(0, 3).join(', ')}`);
    }
    console.log('----------------------------------------------------');
    console.log(`✅ Selesai dalam ${((Date.now() - startTime) / 1000).toFixed(2)} detik!\n`);
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Terjadi kesalahan saat sinkronisasi Kelas MBKM:', error.message || error);
    process.exit(1);
  }
}

main();
