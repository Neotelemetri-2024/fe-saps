/**
 * Migrasi data satu kali:
 *  1. Memetakan PerolehanDetail yang masih menunjuk sub-capaian kurikulum lama
 *     ke sub-capaian setara di kurikulum aktif.
 *  2. Mengisi rincian untuk PerolehanPoin yang sama sekali belum punya
 *     PerolehanDetail, dibagi menurut bobot sub-capaian kurikulum aktif.
 *
 * Jalankan tanpa argumen untuk pratinjau, tambahkan --apply untuk menulis.
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';
import { bagiPoin } from '../src/lib/distribusiPoin';

const APPLY = process.argv.includes('--apply');

const norm = (s: string) => s.trim().toLowerCase();

async function main() {
  const aktif = await prisma.kurikulum.findFirst({
    where: { status: 'aktif' },
    include: {
      capaian: { include: { subCapaian: { orderBy: { id: 'asc' } } }, orderBy: { urutan: 'asc' } },
    },
  });
  if (!aktif) throw new Error('Tidak ada kurikulum aktif');

  console.log(`Kurikulum aktif: ${aktif.id} "${aktif.nama}"\n`);

  const subAktif = aktif.capaian.flatMap((c) => c.subCapaian);
  if (subAktif.length === 0) throw new Error('Kurikulum aktif belum punya sub capaian');

  // Indeks sub-capaian aktif: "nama capaian::nama sub capaian" dan "nama capaian::urutan"
  const byNama = new Map<string, number>();
  const byPosisi = new Map<string, number>();
  for (const c of aktif.capaian) {
    c.subCapaian.forEach((sc, i) => {
      byNama.set(`${norm(c.nama)}::${norm(sc.nama)}`, sc.id);
      byPosisi.set(`${norm(c.nama)}::${i}`, sc.id);
    });
  }

  // ---------- Bagian 1: remap detail dari kurikulum lama ----------
  const detailLama = await prisma.perolehanDetail.findMany({
    where: { subCapaian: { capaian: { kurikulumId: { not: aktif.id } } } },
    include: { subCapaian: { include: { capaian: { include: { subCapaian: { orderBy: { id: 'asc' } } } } } } },
  });

  console.log(`Detail menunjuk kurikulum lama: ${detailLama.length}`);
  const remap: { id: bigint; dari: number; ke: number; ket: string }[] = [];
  const gagalRemap: string[] = [];

  for (const d of detailLama) {
    const capaianLama = d.subCapaian.capaian;
    const kunciNama = `${norm(capaianLama.nama)}::${norm(d.subCapaian.nama)}`;
    let target = byNama.get(kunciNama);
    let cara = 'nama';

    if (!target) {
      const posisi = capaianLama.subCapaian.findIndex((sc) => sc.id === d.subCapaianId);
      target = byPosisi.get(`${norm(capaianLama.nama)}::${posisi}`);
      cara = `posisi #${posisi}`;
    }

    if (!target) {
      gagalRemap.push(`detail ${d.id}: "${capaianLama.nama} / ${d.subCapaian.nama}" tidak punya padanan`);
      continue;
    }
    remap.push({ id: d.id, dari: d.subCapaianId, ke: target, ket: `${capaianLama.nama} / ${d.subCapaian.nama} (${cara})` });
  }

  for (const r of remap) console.log(`  remap detail ${r.id}: sub ${r.dari} -> ${r.ke}  [${r.ket}]`);
  for (const g of gagalRemap) console.log(`  GAGAL ${g}`);

  // ---------- Bagian 2: backfill perolehan tanpa detail ----------
  const tanpaDetail = await prisma.perolehanPoin.findMany({
    where: { detail: { none: {} } },
    include: { kegiatan: { select: { nama: true } } },
  });

  console.log(`\nPerolehan tanpa detail: ${tanpaDetail.length}`);

  const backfill: { perolehanPoinId: bigint; subCapaianId: number; poin: number }[] = [];
  for (const p of tanpaDetail) {
    const baris = bagiPoin(
      p.totalPoin,
      subAktif.map((sc) => ({ ref: sc.id, bobot: Number(sc.bobotPersen) })),
    ).map((b) => ({ perolehanPoinId: p.id, subCapaianId: b.ref, poin: b.poin }));
    console.log(
      `  perolehan ${p.id} "${p.kegiatan?.nama ?? '?'}" poin=${p.totalPoin} -> ${baris.length} baris, jumlah=${baris.reduce((s, b) => s + b.poin, 0)}`,
    );
    backfill.push(...baris);
  }

  if (!APPLY) {
    console.log('\n[PRATINJAU] Tidak ada perubahan ditulis. Tambahkan --apply untuk menerapkan.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const r of remap) {
      await tx.perolehanDetail.update({ where: { id: r.id }, data: { subCapaianId: r.ke } });
    }
    if (backfill.length > 0) {
      await tx.perolehanDetail.createMany({ data: backfill });
    }
  });

  console.log(`\n[SELESAI] ${remap.length} detail dipetakan ulang, ${backfill.length} detail baru dibuat.`);
  if (gagalRemap.length > 0) console.log(`${gagalRemap.length} detail gagal dipetakan, periksa manual.`);
}

main().finally(() => prisma.$disconnect());
