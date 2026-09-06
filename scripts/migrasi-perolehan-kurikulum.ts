/**
 * Audit/backfill assignment kurikulum berdasarkan angkatan mulai.
 *
 * Default adalah dry-run. Tambahkan --apply untuk mengisi:
 * - Mahasiswa.kurikulumId yang masih null
 * - PerolehanPoin.kurikulumId yang masih null dan dapat dipastikan
 *
 * Script ini TIDAK memindahkan PerolehanDetail lintas kurikulum. Konflik histori
 * dilaporkan untuk ditinjau manual agar makna capaian lama tidak berubah diam-diam.
 */
import 'dotenv/config';
import prisma from '../src/lib/prisma';

const APPLY = process.argv.includes('--apply');

type Assignment = { mahasiswaId: bigint; kurikulumId: number };
type Snapshot = { perolehanId: bigint; kurikulumId: number };

async function main() {
  const kurikulum = await prisma.kurikulum.findMany({
    where: { status: 'aktif', angkatanMulai: { not: null } },
    orderBy: [{ angkatanMulai: 'desc' }, { id: 'desc' }],
    select: { id: true, nama: true, angkatanMulai: true },
  });
  if (kurikulum.length === 0) throw new Error('Tidak ada kurikulum aktif dengan angkatanMulai');

  console.log('Urutan kurikulum aktif:');
  kurikulum.forEach((k) => console.log(`- ${k.id} ${k.nama}: mulai angkatan ${k.angkatanMulai}`));

  const mahasiswa = await prisma.mahasiswa.findMany({
    include: {
      perolehanPoin: {
        include: { detail: { include: { subCapaian: { include: { capaian: true } } } } },
      },
    },
  });

  const assignments: Assignment[] = [];
  const snapshots: Snapshot[] = [];
  const conflicts: string[] = [];

  for (const m of mahasiswa) {
    const inferred = m.angkatan == null
      ? null
      : kurikulum.find((k) => k.angkatanMulai != null && k.angkatanMulai <= m.angkatan) ?? null;
    const assignedId = m.kurikulumId ?? inferred?.id ?? null;

    if (assignedId == null) {
      conflicts.push(`Mahasiswa ${m.nim}: angkatan kosong/lebih lama dari kurikulum pertama`);
      continue;
    }
    if (m.kurikulumId == null) assignments.push({ mahasiswaId: m.userId, kurikulumId: assignedId });

    for (const p of m.perolehanPoin) {
      const detailCurricula = [...new Set(p.detail.map((d) => d.subCapaian.capaian.kurikulumId))];
      if (detailCurricula.length > 1 || (detailCurricula.length === 1 && detailCurricula[0] !== assignedId)) {
        conflicts.push(
          `Perolehan ${p.id} mahasiswa ${m.nim}: assignment=${assignedId}, detail=[${detailCurricula.join(', ')}]`,
        );
        continue;
      }
      const snapshotId = detailCurricula[0] ?? assignedId;
      if (p.kurikulumId == null) snapshots.push({ perolehanId: p.id, kurikulumId: snapshotId });
      else if (p.kurikulumId !== snapshotId) {
        conflicts.push(`Perolehan ${p.id}: snapshot=${p.kurikulumId}, detail/assignment=${snapshotId}`);
      }
    }
  }

  console.log(`\nAssignment mahasiswa yang dapat diisi: ${assignments.length}`);
  console.log(`Snapshot perolehan yang dapat diisi: ${snapshots.length}`);
  console.log(`Konflik yang memerlukan tinjauan: ${conflicts.length}`);
  conflicts.forEach((item) => console.log(`  KONFLIK ${item}`));

  if (!APPLY) {
    console.log('\n[PRATINJAU] Tidak ada perubahan ditulis. Tambahkan --apply setelah meninjau konflik.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const item of assignments) {
      await tx.mahasiswa.updateMany({
        where: { userId: item.mahasiswaId, kurikulumId: null },
        data: { kurikulumId: item.kurikulumId },
      });
    }
    for (const item of snapshots) {
      await tx.perolehanPoin.updateMany({
        where: { id: item.perolehanId, kurikulumId: null },
        data: { kurikulumId: item.kurikulumId },
      });
    }
  });

  console.log('\n[SELESAI] Assignment dan snapshot aman telah diisi; detail historis tidak diubah.');
}

main().finally(() => prisma.$disconnect());
