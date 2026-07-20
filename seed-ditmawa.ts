import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Memperbarui data Ditmawa yang lama...');
  
  // Cari semua staff ditmawa
  const adminStaff = await prisma.staff.findFirst({
    where: { jabatan: 'admin_ditmawa' }
  });

  const pimpinanStaff = await prisma.staff.findFirst({
    where: { jabatan: 'pimpinan_ditmawa' }
  });

  const passwordHash = await bcrypt.hash('password123', 10);

  if (adminStaff) {
    await prisma.user.update({
      where: { id: adminStaff.userId },
      data: {
        nama: 'Admin Ditmawa',
        email: 'admin.ditmawa@unand.ac.id',
        passwordHash,
        peran: 'staff'
      }
    });
    console.log('✅ Admin Ditmawa berhasil di-update:');
  } else {
    // Jika tidak ada, buat baru
    await prisma.user.create({
      data: {
        nama: 'Admin Ditmawa',
        email: 'admin.ditmawa@unand.ac.id',
        passwordHash,
        peran: 'staff',
        staff: {
          create: {
            jabatan: 'admin_ditmawa'
          }
        }
      }
    });
    console.log('✅ Admin Ditmawa berhasil dibuat:');
  }
  console.log(`   Email: admin.ditmawa@unand.ac.id`);
  console.log(`   Pass : password123`);


  if (pimpinanStaff) {
    await prisma.user.update({
      where: { id: pimpinanStaff.userId },
      data: {
        nama: 'Pimpinan Ditmawa',
        email: 'pimpinan.ditmawa@unand.ac.id',
        passwordHash,
        peran: 'staff'
      }
    });
    console.log('✅ Pimpinan Ditmawa berhasil di-update:');
  } else {
    // Jika tidak ada, buat baru
    await prisma.user.create({
      data: {
        nama: 'Pimpinan Ditmawa',
        email: 'pimpinan.ditmawa@unand.ac.id',
        passwordHash,
        peran: 'staff',
        staff: {
          create: {
            jabatan: 'pimpinan_ditmawa'
          }
        }
      }
    });
    console.log('✅ Pimpinan Ditmawa berhasil dibuat:');
  }
  console.log(`   Email: pimpinan.ditmawa@unand.ac.id`);
  console.log(`   Pass : password123`);

  console.log('Selesai!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
