import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const staff = await prisma.staff.findFirst({
    where: { jabatan: 'pimpinan_ditmawa' },
    include: { user: true }
  });

  if (staff && staff.user) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await prisma.user.update({
      where: { id: staff.user.id },
      data: { passwordHash: hashedPassword }
    });
    console.log(`Password untuk email ${staff.user.email} berhasil direset menjadi: password123`);
  } else {
    console.log('User tidak ditemukan!');
  }
}

main().finally(() => prisma.$disconnect());
