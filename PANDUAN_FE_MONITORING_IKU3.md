# 📘 PANDUAN INTEGRASI FRONTEND (FE): MODUL MONITORING IKU 3
### Sistem Informasi Aktivitas & Prestasi Mahasiswa (SAPS / Student Connect)
**Universitas Andalas**

Dokumen ini ditujukan bagi rekan **Frontend (FE)** sebagai panduan integrasi modul **Monitoring IKU 3** (*Mahasiswa Berkegiatan / Meraih Prestasi di Luar Program Studi*) berbasis regulasi resmi **Kepmen Kemdiktisaintek No. 358/M/KEP/2025**.

---

## 🧭 1. Letak Navigasi & Menu Sidebar

| Role Pengguna | Nama Menu Sidebar | Ikon Rekomendasi | Tipe Akses |
|---|---|:---:|---|
| **Pimpinan Ditmawa (Super Admin)** | `Monitoring IKU 3` | 🎯 / 📊 *(Target / TrendingUp)* | Full Access (se-Unand + Atur Target + Kelola Bobot) |
| **Pimpinan Utama (Rektorat)** | `Monitoring IKU 3` | 📊 *(BarChart3)* | Executive Overview (se-Unand, Read-Only) |
| **Admin Ditmawa** | `Monitoring IKU 3` | 📁 *(FolderCheck)* | Manajemen & Verifikasi Data se-Unand |
| **Pimpinan Fakultas (Dekan/WD)** | `Monitoring IKU 3 Fakultas` | 🏛️ *(Building2)* | Terisolasi di Fakultasnya Saja |
| **Admin Fakultas** | `Monitoring IKU 3 Fakultas` | 🏛️ *(Building2)* | Terisolasi di Fakultasnya Saja |
| **Mahasiswa** | *Tampil di Riwayat Klaim & CV* | 🌟 *(Award / Sparkles)* | Badge "Diakui IKU 3" & Preview Bobot |

> **Tambahan untuk Dashboard Beranda Pimpinan Ditmawa:**  
> Pada endpoint `GET /api/umum/dashboard/pimpinan-ditmawa`, sekarang sudah ada field baru `data.iku3Widget` yang bisa langsung ditampilkan sebagai kartu ringkasan cepat di beranda.

---

## 🖥️ 2. Komponen & Layout Halaman Monitoring IKU 3

Halaman dirancang sebagai **Single Page Dashboard** dengan urutan komponen dari atas ke bawah:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 📌 HEADER & FILTER BAR                                                                 │
│ Judul: Monitoring IKU 3 Kemdiktisaintek Berdampak 2026                                 │
│ [Dropdown Tahun: 2026 ▼] [Dropdown Triwulan: Semua ▼] [Fakultas: Semua ▼] [⚙️ Atur Target]│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 📊 4 KARTU KPI UTAMA + 1 KARTU GAP ANALYSIS                                            │
│ [ Capaian IKU 3: 47.32% ] [ Target: 50.00% ] [ Total Mhs: 10,250 ] [ Kontributor: 4,850]│
│ [ ⚠️ Gap Target: Butuh +184 mahasiswa lagi untuk mencapai target tahun ini ]           │
├────────────────────────────────────────┬───────────────────────────────────────────────┤
│ 📈 TREN CAPAIAN TAHUNAN (Line Chart)   │ 📊 PERINGKAT PER FAKULTAS (Bar Chart)        │
│    (Tahun vs Capaian % vs Target %)    │    (Ranking & persentase capaian 15 fakultas) │
├────────────────────────────────────────┴───────────────────────────────────────────────┤
│ 🍩 DEKOMPOSISI RUMPUN KONTRIBUTOR                                                      │
│ • Prestasi Kompetisi (Lomba Min. Provinsi) : 62%                                       │
│ • Pembelajaran Luar Kampus (Magang / MBKM / Riset / Exchange) : 38%                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 📋 TABEL DETAIL MAHASISWA KONTRIBUTOR (DATA AUDIT)               [🔍 Cari Mahasiswa...]│
│ NIM | Nama Mahasiswa | Fakultas | Kegiatan/Lomba | Skala | Peringkat/SKS | Bobot | Bukti│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📡 3. Daftar Endpoint API & Contoh Kontrak JSON

Semua request wajib menyertakan header:  
`Authorization: Bearer <JWT_TOKEN>`

### A. Ringkasan Dashboard KPI & Gap Analysis
* **Endpoint:** `GET /api/iku3/dashboard`
* **Query Parameters:**
  - `tahun` (opsional, default: tahun berjalan, misal `2026`)
  - `triwulan` (opsional: `1`, `2`, `3`, `4` atau kosongkan untuk 1 tahun penuh)
  - `fakultasId` (opsional untuk Ditmawa/Rektorat; *otomatis terkunci untuk role fakultas*)
  - `prodiId` (opsional)
* **Contoh Response JSON (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "kpi": {
      "tahun": 2026,
      "triwulan": "Semua Triwulan (1 Tahun)",
      "capaian": 47.32,
      "target": 50.0,
      "selisih": -2.68,
      "statusTarget": "belum_tercapai",
      "totalMahasiswa": 10250,
      "totalKontributor": 4850,
      "totalBobotEfektif": 4850.3,
      "gapMahasiswa": 184
    },
    "rumpunDistribusi": {
      "prestasi": {
        "count": 3120,
        "totalBobot": 2980.5,
        "persentase": 62
      },
      "pembelajaran": {
        "count": 1910,
        "totalBobot": 1869.8,
        "persentase": 38
      }
    },
    "cakupan": {
      "fakultas": "Seluruh Universitas Andalas",
      "prodi": null
    }
  }
}
```

---

### B. Grafik Tren Capaian Tahunan (Line Chart)
* **Endpoint:** `GET /api/iku3/trend`
* **Query Parameters:** `fakultasId` (opsional)
* **Contoh Response JSON (`200 OK`):**
```json
{
  "success": true,
  "data": [
    { "tahun": 2024, "capaian": 38.5, "target": 40.0, "totalMahasiswa": 9800, "totalKontributor": 3773 },
    { "tahun": 2025, "capaian": 44.2, "target": 45.0, "totalMahasiswa": 10050, "totalKontributor": 4442 },
    { "tahun": 2026, "capaian": 47.32, "target": 50.0, "totalMahasiswa": 10250, "totalKontributor": 4850 }
  ]
}
```

---

### C. Grafik Peringkat Komparasi Fakultas (Bar Chart)
* **Endpoint:** `GET /api/iku3/faculties`
* **Query Parameters:** `tahun` (opsional), `triwulan` (opsional)
* **Contoh Response JSON (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "fakultasId": 1,
      "namaFakultas": "Fakultas Teknologi Informasi",
      "totalMahasiswa": 1200,
      "totalKontributor": 818,
      "totalBobot": 818.4,
      "capaianPersen": 68.2,
      "ranking": 1
    },
    {
      "fakultasId": 2,
      "namaFakultas": "Fakultas Teknik",
      "totalMahasiswa": 2100,
      "totalKontributor": 1136,
      "totalBobot": 1136.1,
      "capaianPersen": 54.1,
      "ranking": 2
    }
  ]
}
```

---

### D. Tabel Detail Mahasiswa Kontributor (Data Audit)
* **Endpoint:** `GET /api/iku3/activities`
* **Query Parameters:** `tahun`, `triwulan`, `fakultasId`, `search` (nama/nim/kegiatan), `page`, `limit` (default: 15)
* **Contoh Response JSON (`200 OK`):**
```json
{
  "success": true,
  "total": 4850,
  "page": 1,
  "totalPages": 324,
  "data": [
    {
      "id": "105",
      "mahasiswaId": "23",
      "nim": "2211521001",
      "namaMahasiswa": "Fauzan Ramadhan",
      "fakultas": "Fakultas Teknologi Informasi",
      "prodi": "Sistem Informasi",
      "namaKegiatan": "Gemastik XVII Divisi Pemrograman",
      "kategori": "Kompetisi Mahasiswa",
      "jenisRumpun": "prestasi",
      "skala": "Nasional",
      "peran": "Juara 1",
      "bobot": 0.60,
      "tanggal": "2026-05-14",
      "buktiUrl": "https://saps.unand.ac.id/uploads/bukti/sertifikat_gemastik.pdf",
      "status": "Sah"
    }
  ]
}
```

---

### E. Kelola Target IKU 3 Tahunan (Khusus Super Admin Ditmawa)
* **Ambil Target:** `GET /api/iku3/targets`
* **Simpan / Ubah Target:** `POST /api/iku3/targets`
  - **Body (JSON):**
    ```json
    {
      "tahun": 2026,
      "targetPersen": 50.0,
      "keterangan": "Target IKU 3 Kepmen 358/2025"
    }
    ```

---

### F. Aturan Bobot Dinamis (*Dynamic Rule Engine*)
* **Ambil Aturan:** `GET /api/iku3/rules`
* **Ubah Bobot:** `PUT /api/iku3/rules/:id`
  - **Body (JSON):**
    ```json
    {
      "bobot": 0.60,
      "keterangan": "Penyesuaian bobot Kepmen terbaru"
    }
    ```

---

## 🌟 4. Fitur di Sisi Mahasiswa (Student Experience)

Pada endpoint riwayat klaim mahasiswa (`GET /api/mahasiswa/klaim-eksternal/riwayat`), backend sekarang sudah otomatis menyertakan 3 field baru:

```json
{
  "id": "42",
  "namaKegiatan": "Lomba Karya Ilmiah Nasional",
  "status": "Disetujui",
  "poin": 50,
  "isIku3": true,
  "estimasiBobotIku3": 0.60,
  "badgeIku3": "Diakui IKU 3 (Bobot: 0.6)"
}
```

**Rekomendasi Tampilan di FE:**
1. Di kartu riwayat klaim, jika `isIku3 === true`, tampilkan chip / badge warna hijau/emas:  
   `[🌟 Diakui IKU 3]`.
2. Di form pengajuan klaim saat mahasiswa memilih Juara 1 Nasional, buat *info banner* kecil:  
   *"Keren! Prestasi ini berpotensi menyumbang bobot 0.60 untuk IKU 3 Universitas Andalas 🇮🇩"*.
3. Di halaman CV Publik mahasiswa, sertakan badge ini di samping nama prestasi.

---

## 🔒 5. Catatan Logika & Role Security untuk Rekan FE

1. **Pimpinan / Admin Fakultas:**
   - Dropdown pilihan fakultas di filter bar **wajib di-disable atau di-lock** pada fakultas staf yang bersangkutan.
   - Backend sudah memiliki proteksi berlapis: jika ada yang mencoba memanipulasi query param `fakultasId=lain`, backend otomatis mengabaikannya dan tetap mengunci query ke `fakultasId` staf yang login.
2. **Super Admin (Pimpinan Ditmawa):**
   - Dropdown fakultas terbuka bebas (bisa pilih "Semua Fakultas", atau pilih salah satu dari 15 fakultas).
   - Tombol **`[⚙️ Atur Target]`** dan **`[⚖️ Kelola Bobot]`** hanya ditampilkan untuk role `pimpinan_ditmawa` dan `admin_ditmawa`.
