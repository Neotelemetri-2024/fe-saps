import prisma from './src/lib/prisma';

async function run() {
  try {
    const dosen = await prisma.user.findFirst({ where: { peran: 'dosen' } });
    if (!dosen) {
      console.log('Dosen tidak ditemukan.');
      return;
    }

    const res = await prisma.mahasiswa.updateMany({
      where: { dosenPaId: null },
      data: { dosenPaId: dosen.id }
    });

    console.log(`Berhasil mengaitkan ${res.count} mahasiswa ke Dosen PA ID ${dosen.id} (${dosen.nama}).`);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
