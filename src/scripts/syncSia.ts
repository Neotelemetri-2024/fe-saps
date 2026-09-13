/**
 * CLI Script: Sinkronisasi Data SIA UNAND ke Database SAPS
 * --------------------------------------------------------
 * Jalankan langsung via terminal:
 *   npm run sync:sia
 *
 * Opsi tambahan:
 *   npm run sync:sia -- --skip-mahasiswa        (Langsung lompat ke Kelas MBKM)
 *   npm run sync:sia -- --min-angkatan 2024    (Hanya mahasiswa angkatan 2024 ke atas)
 *   npm run sync:sia -- --limit 500            (Batasi 500 mahasiswa untuk uji coba cepat)
 */
import { syncAll, SyncAllOptions } from '../services/sia/siaSync.service';

async function main() {
  const args = process.argv.slice(2);
  const options: SyncAllOptions = {};

  if (args.includes('--skip-mahasiswa')) {
    options.skipMahasiswa = true;
  }
  if (args.includes('--skip-mbkm')) {
    options.skipMbkm = true;
  }

  const minAngkatanIndex = args.indexOf('--min-angkatan');
  if (minAngkatanIndex !== -1 && args[minAngkatanIndex + 1]) {
    options.minAngkatan = parseInt(args[minAngkatanIndex + 1], 10);
  }

  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10);
  }

  console.log('🚀 Memulai proses sinkronisasi data dari API SIA UNAND...\n');
  if (options.skipMahasiswa) console.log('⚡ Mode: Skip Mahasiswa (Langsung ke MBKM)');
  if (options.minAngkatan) console.log(`📌 Filter Angkatan Minimal: ≥ ${options.minAngkatan}`);
  if (options.limit) console.log(`📌 Limit Mahasiswa: Maksimal ${options.limit} orang`);

  const startTime = Date.now();

  try {
    const results = await syncAll(undefined, options);

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
