import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

export async function main() {
  console.log('Menyiapkan akun Pimpinan Utama...');

  const existingStaff = await prisma.staff.findFirst({
    where: { jabatan: 'pimpinan_utama' },
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  if (existingStaff) {
    await prisma.user.update({
      where: { id: existingStaff.userId },
      data: {
        nama: 'Pimpinan Utama',
        email: 'pimpinan.utama@unand.ac.id',
        passwordHash,
        peran: 'staff',
      },
    });
    console.log('✅ Pimpinan Utama berhasil di-update:');
  } else {
    await prisma.user.create({
      data: {
        nama: 'Pimpinan Utama',
        email: 'pimpinan.utama@unand.ac.id',
        passwordHash,
        peran: 'staff',
        staff: {
          create: {
            jabatan: 'pimpinan_utama',
          },
        },
      },
    });
    console.log('✅ Pimpinan Utama berhasil dibuat:');
  }
  console.log('   Email: pimpinan.utama@unand.ac.id');
  console.log('   Pass : password123');
}

import path from 'path';
import { fileURLToPath } from 'url';

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
