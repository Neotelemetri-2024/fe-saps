import prisma from './src/lib/prisma';

async function main() {
  console.log('🌟 Menyiapkan SEMUA data dummy untuk testing seluruh fitur Pimpinan Ditmawa...');

  // ==========================================
  // 1. DATA MASTER (Pimpinan & Mahasiswa & UKM)
  // ==========================================
  const pimpinan = await prisma.user.findFirst({
    where: { email: 'pimpinan.ditmawa@unand.ac.id' }
  });
  if (!pimpinan) throw new Error("Akun Pimpinan tidak ditemukan, jalankan seed-ditmawa.ts dulu");

  const mahasiswa = await prisma.mahasiswa.findFirst({ include: { user: true } });
  if (!mahasiswa) throw new Error("Mahasiswa tidak ditemukan di DB");

  const ukm = await prisma.organisasi.findFirst({ where: { tipe: 'UKM' } });
  if (!ukm) throw new Error("UKM tidak ditemukan");

  // ==========================================
  // 2. KURIKULUM (Aktif & Draft) & CAPAIAN
  // ==========================================
  console.log('📌 1/5 Memproses Kurikulum & Capaian...');
  let kurikulumAktif = await prisma.kurikulum.findFirst({ where: { status: 'aktif' } });
  if (!kurikulumAktif) {
    kurikulumAktif = await prisma.kurikulum.create({
      data: {
        nama: 'Kurikulum Merdeka Belajar (Dummy Aktif)',
        tahunAkademik: '2025/2026',
        versi: 1,
        status: 'aktif',
        dibuatOleh: pimpinan.id,
      }
    });
  }

  // Buat 1 Draft Kurikulum untuk dites "Aktivasi"
  const kurikulumDraft = await prisma.kurikulum.create({
    data: {
      nama: 'Kurikulum Baru 2027 (Dummy Draft)',
      tahunAkademik: '2026/2027',
      versi: 1,
      status: 'draft',
      dibuatOleh: pimpinan.id,
    }
  });

  // Tambahkan Capaian & Sub Capaian
  const capaian = await prisma.capaian.create({
    data: {
      kurikulumId: kurikulumDraft.id,
      nama: 'Karakter Andalasian',
      jumlahPoin: 100,
      urutan: 1,
      subCapaian: {
        create: [
          { nama: 'Spiritual', bobotPersen: 50 },
          { nama: 'Intelektual', bobotPersen: 50 }
        ]
      }
    }
  });

  // ==========================================
  // 3. MATRIKS POIN & KOMPONENNYA
  // ==========================================
  console.log('📌 2/5 Memproses Matriks Poin & Komponen (Kategori, Skala, Peran)...');
  
  // Pastikan ada Kategori
  let kategori = await prisma.mpKategori.findFirst({ where: { nama: 'Kompetisi Akademik' } });
  if (!kategori) kategori = await prisma.mpKategori.create({ data: { nama: 'Kompetisi Akademik' } });

  // Pastikan ada Skala
  let skala = await prisma.mpSkala.findFirst({ where: { nama: 'Nasional' } });
  if (!skala) skala = await prisma.mpSkala.create({ data: { nama: 'Nasional', urutan: 3, kategoriId: kategori.id } });

  // Pastikan ada Peran
  let peran = await prisma.mpPeran.findFirst({ where: { nama: 'Juara 1', kategoriId: kategori.id } });
  if (!peran) peran = await prisma.mpPeran.create({ data: { nama: 'Juara 1', kategoriId: kategori.id, urutan: 1 } });

  // Buat Matriks Poin
  let matriks = await prisma.matriksPoin.findFirst({
    where: {
      kurikulumId: kurikulumAktif.id,
      kategoriId: kategori.id,
      skalaId: skala.id,
      peranId: peran.id,
    }
  });

  if (!matriks) {
    matriks = await prisma.matriksPoin.create({
      data: {
        kurikulumId: kurikulumAktif.id,
        kategoriId: kategori.id,
        skalaId: skala.id,
        peranId: peran.id,
        poin: 150
      }
    });

    // Buat Histori untuk Matriks ini
    await prisma.matriksPoinHistori.create({
      data: {
        matriksPoinId: matriks.id,
        poinBaru: 150,
        diubahOleh: pimpinan.id,
      }
    });
  }

  // ==========================================
  // 4. KEGIATAN UKM (Untuk dites Approval)
  // ==========================================
  console.log('📌 3/5 Memproses Kegiatan UKM (Status: Terverifikasi)...');
  const kegiatanUkm = await prisma.kegiatan.create({
    data: {
      nama: 'Dummy Seminar Nasional Tech 2026',
      deskripsi: 'Seminar nasional untuk mahasiswa IT',
      asal: 'kurikuler_ukm',
      kategoriId: kategori.id,
      skalaId: skala.id,
      organisasiId: ukm.id,
      kurikulumId: kurikulumAktif.id,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(),
      status: 'terverifikasi', // Siap di-approve pimpinan
      dibuatOleh: mahasiswa.userId 
    }
  });

  // ==========================================
  // 5. KLAIM EKSTERNAL (Untuk dites Verifikasi Klaim)
  // ==========================================
  console.log('📌 4/5 Memproses Klaim Poin Eksternal (Status: Menunggu Validasi)...');
  const kegiatanEksternal = await prisma.kegiatan.create({
    data: {
      nama: 'Hackathon Nasional 2026',
      deskripsi: 'Kompetisi pembuatan aplikasi',
      asal: 'eksternal',
      penyelenggaraExt: 'Kementerian Pendidikan',
      kategoriId: kategori.id,
      skalaId: skala.id,
      kurikulumId: kurikulumAktif.id,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(),
      status: 'disetujui', 
      dibuatOleh: mahasiswa.userId
    }
  });

  const partisipasi = await prisma.partisipasi.create({
    data: {
      mahasiswaId: mahasiswa.userId,
      kegiatanId: kegiatanEksternal.id
    }
  });

  const klaim = await prisma.klaimPoin.create({
    data: {
      partisipasiId: partisipasi.id,
      peranUsulanId: peran.id,
      status: 'menunggu_validasi',
    }
  });

  console.log('\n=================================================');
  console.log('✅ SEMUA DATA DUMMY BERHASIL DIBUAT!');
  console.log('Berikut ID untuk Anda tes di Swagger:');
  console.log('-------------------------------------------------');
  console.log(`[Kurikulum]`);
  console.log(`- GET /api/kurikulum/${kurikulumDraft.id} (Draft)`);
  console.log(`- POST /api/kurikulum/${kurikulumDraft.id}/capaian`);
  console.log(`- PUT /api/kurikulum/${kurikulumDraft.id}/aktivasi`);
  console.log(`- POST /api/kurikulum/capaian/${capaian.id}/sub-capaian`);
  console.log('');
  console.log(`[Matriks]`);
  console.log(`- GET /api/matriks/histori/${matriks.id}`);
  console.log('');
  console.log(`[Kegiatan & Klaim]`);
  console.log(`- PUT /api/kegiatan/${kegiatanUkm.id}/approval`);
  console.log(`- PUT /api/klaim/${klaim.id}/validasi`);
  console.log('=================================================');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
