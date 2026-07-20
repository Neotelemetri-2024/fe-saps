import prisma from './src/lib/prisma';

async function main() {
  console.log('Menyiapkan data dummy untuk testing fitur Pimpinan Ditmawa...');

  // 1. Ambil Kurikulum Aktif
  const kurikulum = await prisma.kurikulum.findFirst({ where: { status: 'aktif' } });
  if (!kurikulum) throw new Error("Tidak ada kurikulum aktif");

  // 2. Ambil Kategori & Skala
  const kategori = await prisma.mpKategori.findFirst();
  const skala = await prisma.mpSkala.findFirst();
  if (!kategori || !skala) throw new Error("Kategori atau Skala tidak ditemukan");

  // 3. Ambil Mahasiswa
  const mahasiswa = await prisma.mahasiswa.findFirst({ include: { user: true } });
  if (!mahasiswa) throw new Error("Mahasiswa tidak ditemukan di DB");

  // 4. Ambil Organisasi UKM
  const ukm = await prisma.organisasi.findFirst({ where: { tipe: 'UKM' } });
  if (!ukm) throw new Error("UKM tidak ditemukan");

  // 5. Ambil Peran
  const peran = await prisma.mpPeran.findFirst();
  if (!peran) throw new Error("Peran tidak ditemukan");

  // ==========================================
  // SKENARIO 1: Kegiatan UKM Menunggu Approval Pimpinan
  // ==========================================
  console.log('1. Membuat Kegiatan UKM berstatus "terverifikasi"...');
  const kegiatanUkm = await prisma.kegiatan.create({
    data: {
      nama: 'Dummy Lomba Debat Nasional 2026',
      deskripsi: 'Kegiatan lomba debat untuk testing approval',
      asal: 'kurikuler_ukm',
      kategoriId: kategori.id,
      skalaId: skala.id,
      organisasiId: ukm.id,
      kurikulumId: kurikulum.id,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(),
      status: 'terverifikasi', // Sudah lolos admin, siap di-approve pimpinan
      dibuatOleh: mahasiswa.userId // Anggap pembuat dari UKM
    }
  });
  console.log(`   -> Berhasil! ID Kegiatan UKM: ${kegiatanUkm.id}`);

  // ==========================================
  // SKENARIO 2: Klaim Kegiatan Eksternal
  // ==========================================
  console.log('\n2. Membuat Kegiatan Eksternal & Klaim Poin berstatus "menunggu_validasi"...');
  const kegiatanEksternal = await prisma.kegiatan.create({
    data: {
      nama: 'Juara 1 Web Design Nasional',
      deskripsi: 'Kompetisi oleh Kementerian',
      asal: 'eksternal',
      penyelenggaraExt: 'Kementerian Kominfo',
      kategoriId: kategori.id,
      skalaId: skala.id,
      kurikulumId: kurikulum.id,
      tanggalMulai: new Date(),
      tanggalSelesai: new Date(),
      status: 'disetujui', // Kegiatan eksternal biasanya auto disetujui (sebagai wadah), klaimnya yang divalidasi
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
  console.log(`   -> Berhasil! ID Klaim Eksternal: ${klaim.id}`);

  console.log('\n=================================================');
  console.log('✅ SELESAI!');
  console.log('Sekarang Anda bisa ngetes di Swagger:');
  console.log(`1. GET /api/kegiatan/approval -> akan muncul kegiatan ID: ${kegiatanUkm.id}`);
  console.log(`2. PUT /api/kegiatan/${kegiatanUkm.id}/approval -> (coba setuju/revisi/tolak)`);
  console.log(`3. GET /api/klaim/verifikasi-eksternal -> akan muncul klaim ID: ${klaim.id}`);
  console.log(`4. PUT /api/klaim/${klaim.id}/validasi -> (coba disetujui/perlu_revisi)`);
  console.log('=================================================');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
