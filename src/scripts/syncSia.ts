/**
 * CLI Script: Sinkronisasi Data SIA UNAND ke Database SAPS
 * --------------------------------------------------------
 * Jalankan langsung via terminal:
 *   npm run sync:sia
 */
import { syncAll } from '../services/sia/siaSync.service';

async function main() {
  console.log('🚀 Memulai proses sinkronisasi data dari API SIA UNAND...\n');
  const startTime = Date.now();

  try {
    const results = await syncAll();

    console.log('\n📊 HASIL REKAPITULASI SINKRONISASI:');
    console.log('----------------------------------------------------');
    for (const r of results) {
      if ('created' in r) {
        console.log(
          `• ${r.entity.padEnd(15)} : +${r.created} baru | ~${r.updated} update | =${r.skipped} tetap | ⚠️ ${r.errors.length} error`
        );
        if (r.errors.length > 0) {
          console.log(`  Sample error: ${r.errors.slice(0, 3).join(', ')}`);
        }
      } else if ('totalKelas' in r) {
        console.log(
          `• ${r.entity.padEnd(15)} : ${r.totalKelas} kelas | ${r.totalPeserta} peserta (${r.mahasiswaTerdaftarSaps} terdaftar di SAPS)`
        );
      }
    }
    console.log('----------------------------------------------------');
    console.log(`✅ Selesai dalam ${((Date.now() - startTime) / 1000).toFixed(2)} detik!\n`);
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Terjadi kesalahan saat sinkronisasi SIA:', error.message || error);
    process.exit(1);
  }
}

main();
