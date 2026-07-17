const fs = require('fs');

const yaml = `openapi: 3.0.0
info:
  title: SAPS API (Sistem Akumulasi Poin SKPI)
  description: Dokumentasi API lengkap untuk Sistem Akumulasi Poin SKPI. Mengakomodasi semua role (Mahasiswa, Dosen PA, Admin, Pimpinan).
  version: 2.0.0

servers:
  - url: http://localhost:3000
    description: Local Development Server

tags:
  - name: 1. Kegiatan (Mahasiswa & UKM)
  - name: 2. Partisipasi & Izin (Mahasiswa & Dosen PA)
  - name: 3. Klaim Poin (Mahasiswa & Validator)
  - name: 4. Kurikulum & Matriks (Pimpinan Ditmawa)
  - name: 5. Dashboard (Semua Role)

paths:
  # ==================== KEGIATAN ====================
  /api/kegiatan:
    get:
      summary: Dapatkan Semua Kegiatan (Katalog)
      tags: [1. Kegiatan (Mahasiswa & UKM)]
      parameters:
        - name: status
          in: query
          schema: { type: string }
        - name: asal
          in: query
          schema: { type: string }
      responses:
        '200': { description: Berhasil }
    post:
      summary: Buat Kegiatan Baru (Draft)
      tags: [1. Kegiatan (Mahasiswa & UKM)]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                dibuatOleh: { type: integer, example: 6 }
                nama: { type: string, example: "Lomba Web Design" }
                kategoriId: { type: integer, example: 1 }
                skalaId: { type: integer, example: 1 }
                asal: { type: string, example: "eksternal" }
                tanggalMulai: { type: string, example: "2024-01-01" }
                tanggalSelesai: { type: string, example: "2024-01-02" }
                alokasi:
                  type: array
                  items:
                    type: object
                    properties:
                      subCapaianId: { type: integer, example: 1 }
                      alokasiPersen: { type: number, example: 100 }
      responses:
        '201': { description: Berhasil }

  /api/kegiatan/verifikasi:
    get:
      summary: Daftar Kegiatan Menunggu Verifikasi (Admin Ditmawa)
      tags: [1. Kegiatan (Mahasiswa & UKM)]
      responses:
        '200': { description: Berhasil }

  /api/kegiatan/{id}/verifikasi:
    put:
      summary: Admin Setuju/Tolak/Revisi Kegiatan
      tags: [1. Kegiatan (Mahasiswa & UKM)]
      parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                aktorId: { type: integer, example: 2 }
                keputusan: { type: string, enum: [setuju, revisi, tolak], example: "setuju" }
                alasan: { type: string }
      responses:
        '200': { description: Berhasil }

  /api/kegiatan/{id}/publikasi:
    put:
      summary: Publikasikan Kegiatan (Bisa dilihat mahasiswa)
      tags: [1. Kegiatan (Mahasiswa & UKM)]
      parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                aktorId: { type: integer }
      responses:
        '200': { description: Berhasil }

  # ==================== PARTISIPASI & IZIN PA ====================
  /api/partisipasi:
    post:
      summary: Mahasiswa Mendaftar Kegiatan
      tags: [2. Partisipasi & Izin (Mahasiswa & Dosen PA)]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                mahasiswaId: { type: integer, example: 6 }
                kegiatanId: { type: integer, example: 1 }
      responses:
        '201': { description: Berhasil }

  /api/partisipasi/saya:
    get:
      summary: Histori Kegiatan Mahasiswa
      tags: [2. Partisipasi & Izin (Mahasiswa & Dosen PA)]
      parameters: [{ name: mahasiswaId, in: query, required: true, schema: { type: integer } }]
      responses:
        '200': { description: Berhasil }

  /api/partisipasi/{id}/minta-izin:
    post:
      summary: Mahasiswa Meminta Izin PA
      tags: [2. Partisipasi & Izin (Mahasiswa & Dosen PA)]
      parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
      responses:
        '201': { description: Berhasil }

  /api/partisipasi/izin-pa:
    get:
      summary: Daftar Mahasiswa Minta Izin (Dosen PA)
      tags: [2. Partisipasi & Izin (Mahasiswa & Dosen PA)]
      parameters: [{ name: dosenPaId, in: query, required: true, schema: { type: integer } }]
      responses:
        '200': { description: Berhasil }

  /api/partisipasi/izin-pa/{id}:
    put:
      summary: Dosen PA Menyetujui/Menolak Izin
      tags: [2. Partisipasi & Izin (Mahasiswa & Dosen PA)]
      parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                dosenPaId: { type: integer, example: 5 }
                status: { type: string, enum: [disetujui, ditolak] }
                alasan: { type: string }
      responses:
        '200': { description: Berhasil }

  /api/partisipasi/saran-pa:
    post:
      summary: Dosen PA Memberi Saran
      tags: [2. Partisipasi & Izin (Mahasiswa & Dosen PA)]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                dosenPaId: { type: integer }
                mahasiswaId: { type: integer }
                isi: { type: string }
      responses:
        '201': { description: Berhasil }

  # ==================== KLAIM POIN ====================
  /api/klaim:
    post:
      summary: Mahasiswa Mengajukan Klaim Poin
      tags: [3. Klaim Poin (Mahasiswa & Validator)]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                mahasiswaId: { type: integer, example: 6 }
                partisipasiId: { type: integer, example: 1 }
                peranUsulanId: { type: integer, example: 1 }
                bukti:
                  type: array
                  items:
                    type: object
                    properties:
                      tipe: { type: string, enum: [link, pdf], example: "link" }
                      url: { type: string, example: "http://drive.google.com/sertifikat" }
      responses:
        '201': { description: Berhasil }

  /api/klaim/saya:
    get:
      summary: Histori Klaim Poin Mahasiswa
      tags: [3. Klaim Poin (Mahasiswa & Validator)]
      parameters: [{ name: mahasiswaId, in: query, required: true, schema: { type: integer } }]
      responses:
        '200': { description: Berhasil }

  /api/klaim/validasi:
    get:
      summary: Daftar Klaim Menunggu Validasi (Penyelenggara/Admin)
      tags: [3. Klaim Poin (Mahasiswa & Validator)]
      parameters: [{ name: validatorId, in: query, schema: { type: integer } }]
      responses:
        '200': { description: Berhasil }

  /api/klaim/{id}/validasi:
    put:
      summary: Validasi Klaim & Hitung Poin (1-Stage Validation)
      tags: [3. Klaim Poin (Mahasiswa & Validator)]
      parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                aktorId: { type: integer, example: 2 }
                keputusan: { type: string, enum: [disetujui, perlu_revisi, ditolak], example: "disetujui" }
                alasan: { type: string }
                peranVerifId: { type: integer }
      responses:
        '200': { description: Berhasil }

  # ==================== KURIKULUM & MATRIKS ====================
  /api/kurikulum:
    get:
      summary: Daftar Kurikulum
      tags: [4. Kurikulum & Matriks (Pimpinan Ditmawa)]
      responses:
        '200': { description: Berhasil }
    post:
      summary: Tambah Kurikulum Baru (Pimpinan)
      tags: [4. Kurikulum & Matriks (Pimpinan Ditmawa)]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                dibuatOleh: { type: integer, example: 1 }
                nama: { type: string, example: "Kurikulum Merdeka 2024" }
                tahunAkademik: { type: string, example: "2024/2025" }
      responses:
        '201': { description: Berhasil }

  /api/kurikulum/aktif:
    get:
      summary: Dapatkan Kurikulum Aktif
      tags: [4. Kurikulum & Matriks (Pimpinan Ditmawa)]
      responses:
        '200': { description: Berhasil }

  /api/kurikulum/{id}/aktivasi:
    put:
      summary: Aktifkan Kurikulum
      tags: [4. Kurikulum & Matriks (Pimpinan Ditmawa)]
      parameters: [{ name: id, in: path, required: true, schema: { type: integer } }]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                aktorId: { type: integer, example: 1 }
      responses:
        '200': { description: Berhasil }

  /api/matriks:
    get:
      summary: Lihat Tabel Matriks Poin
      tags: [4. Kurikulum & Matriks (Pimpinan Ditmawa)]
      parameters: [{ name: kurikulumId, in: query, schema: { type: integer } }]
      responses:
        '200': { description: Berhasil }
    post:
      summary: Edit/Set Bobot Matriks Poin
      tags: [4. Kurikulum & Matriks (Pimpinan Ditmawa)]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                aktorId: { type: integer, example: 1 }
                kurikulumId: { type: integer, example: 1 }
                kategoriId: { type: integer, example: 1 }
                skalaId: { type: integer, example: 1 }
                peranId: { type: integer, example: 1 }
                poin: { type: integer, example: 150 }
      responses:
        '200': { description: Berhasil }

  # ==================== DASHBOARD ====================
  /api/umum/dashboard/mahasiswa:
    get:
      summary: Dashboard Mahasiswa
      tags: [5. Dashboard (Semua Role)]
      parameters: [{ name: mahasiswaId, in: query, required: true, schema: { type: integer } }]
      responses:
        '200': { description: Berhasil }

  /api/umum/dashboard/dosen-pa:
    get:
      summary: Dashboard Dosen PA
      tags: [5. Dashboard (Semua Role)]
      parameters: [{ name: dosenPaId, in: query, required: true, schema: { type: integer } }]
      responses:
        '200': { description: Berhasil }

  /api/umum/dashboard/pimpinan-ditmawa:
    get:
      summary: Dashboard Pimpinan Ditmawa
      tags: [5. Dashboard (Semua Role)]
      responses:
        '200': { description: Berhasil }

  /api/umum/dashboard/admin-ditmawa:
    get:
      summary: Dashboard Admin Ditmawa
      tags: [5. Dashboard (Semua Role)]
      responses:
        '200': { description: Berhasil }
\`;

fs.writeFileSync('e:\\\\shevaProgramming\\\\PROJECT SAPS\\\\backend\\\\src\\\\swagger.yaml', yaml);
console.log('✅ Berhasil memperbarui swagger.yaml dengan seluruh endpoint!');
