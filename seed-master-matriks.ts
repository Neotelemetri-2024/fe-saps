import prisma from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌟 [1/5] Menyiapkan Akun dan Kurikulum Dasar...');
  
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Fakultas dan Prodi
  let fakultas = await prisma.fakultas.findFirst();
  if (!fakultas) {
    fakultas = await prisma.fakultas.create({ data: { nama: 'Fakultas Teknologi Informasi' } });
  }

  let prodi = await prisma.programStudi.findFirst();
  if (!prodi) {
    prodi = await prisma.programStudi.create({
      data: { nama: 'Sistem Informasi', fakultasId: fakultas.id }
    });
  }

  let userMhs = await prisma.user.findUnique({ where: { email: 'budi.mahasiswa@unand.ac.id' } });
  if (!userMhs) {
    userMhs = await prisma.user.create({
      data: {
        nama: 'Budi Mahasiswa',
        email: 'budi.mahasiswa@unand.ac.id',
        passwordHash,
        peran: 'mahasiswa',
        mahasiswa: {
          create: {
            nim: '2111522001',
            prodiId: prodi.id,
          }
        }
      }
    });
  }

  // 2. Akun Pimpinan Ditmawa
  let pimpinan = await prisma.user.findUnique({ where: { email: 'pimpinan.ditmawa@unand.ac.id' } });
  if (!pimpinan) {
    pimpinan = await prisma.user.create({
      data: {
        nama: 'Pimpinan Ditmawa',
        email: 'pimpinan.ditmawa@unand.ac.id',
        passwordHash,
        peran: 'staff',
        staff: { create: { jabatan: 'pimpinan_ditmawa' } }
      }
    });
  }

  // 3. Kurikulum Aktif
  let kurikulum = await prisma.kurikulum.findFirst({
    where: { nama: 'Kurikulum Merdeka 2024' }
  });
  if (!kurikulum) {
    kurikulum = await prisma.kurikulum.create({
      data: {
        nama: 'Kurikulum Merdeka 2024',
        tahunAkademik: '2024/2025',
        versi: 1,
        status: 'aktif',
        dibuatOleh: pimpinan.id,
        capaian: {
          create: [
            {
              nama: 'Pondasi',
              jumlahPoin: 20, // Asumsi
              urutan: 1,
              subCapaian: {
                create: [
                  { nama: 'Growth Mindset & Resiliensi', bobotPersen: 25 },
                  { nama: 'Religion Character Development', bobotPersen: 25 },
                  { nama: 'Digital Literacy (Literasi Digital)', bobotPersen: 25 },
                  { nama: 'Public Speaking & Habit Mastery (Bakti)', bobotPersen: 25 }
                ]
              }
            },
            {
              nama: 'Penguatan',
              jumlahPoin: 40, // Asumsi
              urutan: 2,
              subCapaian: {
                create: [
                  { nama: 'Agile Teamwork & Empathy', bobotPersen: 30 },
                  { nama: 'Creativity, Ideation & Innovation', bobotPersen: 35 },
                  { nama: 'Academic Writing & Presentation Skills', bobotPersen: 35 }
                ]
              }
            },
            {
              nama: 'Pemantapan',
              jumlahPoin: 60, // Asumsi
              urutan: 3,
              subCapaian: {
                create: [
                  { nama: 'Global Exposure & Research Planning', bobotPersen: 40 },
                  { nama: 'Adaptive Leadership & Strategic Management', bobotPersen: 30 },
                  { nama: 'Entrepreneurship Skills (P2MW / KBMK)', bobotPersen: 30 }
                ]
              }
            },
            {
              nama: 'Aktualisasi',
              jumlahPoin: 80, // Asumsi
              urutan: 4,
              subCapaian: {
                create: [
                  { nama: 'Networking Skills & Cultural Intelligence', bobotPersen: 50 },
                  { nama: 'Pembekalan Pasca Kampus & English Skills', bobotPersen: 50 }
                ]
              }
            }
          ]
        }
      }
    });
  }

  console.log('📌 [2/5] Menyusun Kategori 1: Prestasi & Kompetisi...');
  const katPrestasi = await prisma.mpKategori.create({
    data: {
      nama: '1. Prestasi & Kompetisi',
      skala: {
        create: [
          { nama: 'Internasional', urutan: 1 },
          { nama: 'Nasional (Puspresnas/ DIKTISAINTEK)', urutan: 2 },
          { nama: 'Regional/ provinsi', urutan: 3 },
          { nama: 'Internal UNAND (universitas/ fakultas)', urutan: 4 }
        ]
      },
      peran: {
        create: [
          { nama: 'JUARA 1/ EMAS', urutan: 1 },
          { nama: 'JUARA 2/ PERAK', urutan: 2 },
          { nama: 'JUARA 3/ PERUNGGU', urutan: 3 },
          { nama: 'PENGHARGAAN/ FINALIS/PESERTA', urutan: 4 }
        ]
      }
    },
    include: { skala: true, peran: true }
  });

  // Bobot Poin Prestasi & Kompetisi (Baris x Kolom)
  const poinPrestasi = [
    [100, 90, 80, 50], // Internasional
    [80, 70, 60, 40],  // Nasional
    [50, 45, 40, 25],  // Regional
    [30, 25, 20, 10],  // Internal
  ];

  // Pastikan array terurut sesuai "urutan" agar bobot poin tidak tertukar
  katPrestasi.skala.sort((a, b) => a.urutan - b.urutan);
  katPrestasi.peran.sort((a, b) => a.urutan - b.urutan);

  for (let r = 0; r < katPrestasi.skala.length; r++) {
    for (let c = 0; c < katPrestasi.peran.length; c++) {
      await prisma.matriksPoin.create({
        data: {
          kurikulumId: kurikulum.id,
          kategoriId: katPrestasi.id,
          skalaId: katPrestasi.skala[r].id,
          peranId: katPrestasi.peran[c].id,
          poin: poinPrestasi[r][c]
        }
      });
    }
  }


  console.log('📌 [3/5] Menyusun Kategori 2: Organisasi...');
  const katOrganisasi = await prisma.mpKategori.create({
    data: {
      nama: '2. Organisasi',
      skala: {
        create: [
          { nama: 'Internasional', urutan: 1 },
          { nama: 'Nasional (Puspresnas/ DIKTISAINTEK)', urutan: 2 },
          { nama: 'Regional/ provinsi', urutan: 3 },
          { nama: 'Internal UNAND (universitas/ fakultas)', urutan: 4 }
        ]
      },
      peran: {
        create: [
          { nama: 'SKALA UNIVERSITAS', urutan: 1 },
          { nama: 'SKALA FAKULTAS/ KEDEPUTIAN', urutan: 2 },
          { nama: 'SKALA DEPARTEMEN', urutan: 3 }
        ]
      }
    },
    include: { skala: true, peran: true }
  });

  // Bobot Poin Organisasi (Baris x Kolom)
  // Perhatian: Di gambar wireframe, untuk kategori "Organisasi", 
  // barisnya tetap sama (Internasional, Nasional, Regional, Internal UNAND), 
  // tapi kolomnya yang berbeda (Universitas, Fakultas, Departemen)
  const poinOrganisasi = [
    [100, 90, 80],
    [80, 70, 60],
    [50, 45, 40],
    [30, 25, 20]
  ];

  katOrganisasi.skala.sort((a, b) => a.urutan - b.urutan);
  katOrganisasi.peran.sort((a, b) => a.urutan - b.urutan);

  for (let r = 0; r < katOrganisasi.skala.length; r++) {
    for (let c = 0; c < katOrganisasi.peran.length; c++) {
      await prisma.matriksPoin.create({
        data: {
          kurikulumId: kurikulum.id,
          kategoriId: katOrganisasi.id,
          skalaId: katOrganisasi.skala[r].id,
          peranId: katOrganisasi.peran[c].id,
          poin: poinOrganisasi[r][c]
        }
      });
    }
  }


  console.log('📌 [4/5] Menyusun Kategori 3: Pelatihan dan Seminar...');
  const katPelatihan = await prisma.mpKategori.create({
    data: {
      nama: '3. Pelatihan dan Seminar',
      skala: {
        create: [
          { nama: 'Pembicara/ Narasumber/ Fasilitator', urutan: 1 },
          { nama: 'Moderator/ Panitia Eksekutif', urutan: 2 },
          { nama: 'Peserta Pelatihan Terstruktur', urutan: 3 },
          { nama: 'Peserta Pelatihan Umum/ Kuliah Umum/ Webinar', urutan: 4 }
        ]
      },
      peran: {
        create: [
          { nama: 'SKALA INTERNATIONAL', urutan: 1 },
          { nama: 'SKALA NASIONAL', urutan: 2 },
          { nama: 'SKALA UNIVERSITAS', urutan: 3 }
        ]
      }
    },
    include: { skala: true, peran: true }
  });

  // Bobot Poin Pelatihan 
  const poinPelatihan = [
    [60, 50, 50],
    [35, 25, 50],
    [30, 25, 50],
    [15, 25, 50]
  ];

  katPelatihan.skala.sort((a, b) => a.urutan - b.urutan);
  katPelatihan.peran.sort((a, b) => a.urutan - b.urutan);

  for (let r = 0; r < katPelatihan.skala.length; r++) {
    for (let c = 0; c < katPelatihan.peran.length; c++) {
      await prisma.matriksPoin.create({
        data: {
          kurikulumId: kurikulum.id,
          kategoriId: katPelatihan.id,
          skalaId: katPelatihan.skala[r].id,
          peranId: katPelatihan.peran[c].id,
          poin: poinPelatihan[r][c]
        }
      });
    }
  }

  console.log('✅ [5/5] SELESAI! Data matriks berhasil di-seeding.');
  console.log('Sekarang Anda bisa cek GET /api/matriks, hasilnya akan persis seperti wireframe!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
