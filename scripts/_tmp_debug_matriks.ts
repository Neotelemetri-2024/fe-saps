import prisma from '../src/lib/prisma';

const j = (v: any) => JSON.stringify(v, (_, x) => typeof x === 'bigint' ? x.toString() : x, 2);

async function main() {
  const matriks = await prisma.matriksPoin.findMany({
    where: { kategoriId: 1, skalaId: 4, peranId: 4 },
    select: { id: true, kurikulumId: true, poin: true, kurikulum: { select: { nama: true } } },
  });
  console.log('matriks matching dims', j(matriks));

  const keg = await prisma.kegiatan.findUnique({
    where: { id: 49 },
    select: {
      id: true, nama: true, kurikulumId: true,
      kegiatanCapaian: {
        select: { alokasiPersen: true, subCapaian: { select: { id: true, nama: true, capaian: { select: { kurikulumId: true, nama: true } } } } },
      },
    },
  });
  console.log('kegiatan', j(keg));

  const klaim = await prisma.klaimPoin.findFirst({
    where: { partisipasiId: 35n },
    include: { perolehanPoin: true },
  });
  console.log('klaim', j(klaim));

  const m3 = await prisma.matriksPoin.count({ where: { kurikulumId: 3 } });
  const m2 = await prisma.matriksPoin.count({ where: { kurikulumId: 2 } });
  const m1 = await prisma.matriksPoin.count({ where: { kurikulumId: 1 } });
  console.log(j({ matriksKurikulum: { 1: m1, 2: m2, 3: m3 } }));
}
main().catch(console.error);
