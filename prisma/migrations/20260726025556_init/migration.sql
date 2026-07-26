-- CreateTable
CREATE TABLE `fakultas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,

    UNIQUE INDEX `fakultas_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `program_studi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fakultas_id` INTEGER NOT NULL,
    `nama` VARCHAR(150) NOT NULL,

    UNIQUE INDEX `program_studi_fakultas_id_nama_key`(`fakultas_id`, `nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `peran` ENUM('mahasiswa', 'dosen', 'staff', 'operator_org') NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dosen` (
    `user_id` BIGINT NOT NULL,
    `nidn` VARCHAR(20) NULL,
    `fakultas_id` INTEGER NULL,

    UNIQUE INDEX `dosen_nidn_key`(`nidn`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mahasiswa` (
    `user_id` BIGINT NOT NULL,
    `nim` VARCHAR(20) NOT NULL,
    `prodi_id` INTEGER NOT NULL,
    `dosen_pa_id` BIGINT NULL,
    `angkatan` SMALLINT NULL,

    UNIQUE INDEX `mahasiswa_nim_key`(`nim`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `staff` (
    `user_id` BIGINT NOT NULL,
    `jabatan` ENUM('admin_ditmawa', 'pimpinan_ditmawa', 'admin_fakultas', 'pimpinan_fakultas') NOT NULL,
    `fakultas_id` INTEGER NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organisasi` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `tipe` ENUM('UKM', 'UKMF') NOT NULL,
    `fakultas_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organisasi_operator` (
    `user_id` BIGINT NOT NULL,
    `organisasi_id` INTEGER NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kurikulum` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(150) NOT NULL,
    `tahun_akademik` VARCHAR(9) NOT NULL,
    `versi` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('draft', 'aktif', 'arsip') NOT NULL DEFAULT 'draft',
    `dibuat_oleh` BIGINT NOT NULL,
    `activated_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `capaian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kurikulum_id` INTEGER NOT NULL,
    `nama` VARCHAR(150) NOT NULL,
    `jumlah_poin` INTEGER NOT NULL,
    `urutan` SMALLINT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_capaian` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `capaian_id` INTEGER NOT NULL,
    `nama` VARCHAR(200) NOT NULL,
    `bobot_persen` DECIMAL(5, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mp_kategori` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(80) NOT NULL,

    UNIQUE INDEX `mp_kategori_nama_key`(`nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mp_skala` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kategori_id` INTEGER NOT NULL,
    `nama` VARCHAR(80) NOT NULL,
    `urutan` SMALLINT NOT NULL,

    UNIQUE INDEX `mp_skala_kategori_id_nama_key`(`kategori_id`, `nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mp_peran` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kategori_id` INTEGER NOT NULL,
    `nama` VARCHAR(80) NOT NULL,
    `urutan` SMALLINT NOT NULL,

    UNIQUE INDEX `mp_peran_kategori_id_nama_key`(`kategori_id`, `nama`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matriks_poin` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kurikulum_id` INTEGER NOT NULL,
    `kategori_id` INTEGER NOT NULL,
    `skala_id` INTEGER NOT NULL,
    `peran_id` INTEGER NOT NULL,
    `poin` INTEGER NOT NULL,

    UNIQUE INDEX `matriks_poin_kurikulum_id_kategori_id_skala_id_peran_id_key`(`kurikulum_id`, `kategori_id`, `skala_id`, `peran_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `matriks_poin_histori` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `matriks_poin_id` BIGINT NOT NULL,
    `poin_lama` INTEGER NULL,
    `poin_baru` INTEGER NOT NULL,
    `diubah_oleh` BIGINT NOT NULL,
    `diubah_pada` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kegiatan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nama` VARCHAR(200) NOT NULL,
    `kategori_id` INTEGER NOT NULL,
    `skala_id` INTEGER NOT NULL,
    `asal` ENUM('kurikuler_ukm', 'kurikuler_ukmf', 'universitas', 'eksternal') NOT NULL,
    `deskripsi` TEXT NULL,
    `tanggal_mulai` DATE NOT NULL,
    `tanggal_selesai` DATE NOT NULL,
    `lokasi` VARCHAR(200) NULL,
    `kuota` INTEGER NULL,
    `organisasi_id` INTEGER NULL,
    `penyelenggara_ext` VARCHAR(200) NULL,
    `link_penyelenggara` VARCHAR(255) NULL,
    `email_penyelenggara` VARCHAR(255) NULL,
    `kurikulum_id` INTEGER NOT NULL,
    `dibuat_oleh` BIGINT NOT NULL,
    `status` ENUM('draft', 'diajukan', 'terverifikasi', 'perlu_revisi', 'disetujui', 'ditolak', 'terpublikasi', 'berlangsung', 'selesai', 'diarsipkan', 'dibatalkan') NOT NULL DEFAULT 'draft',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `kegiatan_status_idx`(`status`),
    INDEX `kegiatan_kurikulum_id_idx`(`kurikulum_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kegiatan_capaian` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kegiatan_id` INTEGER NOT NULL,
    `sub_capaian_id` INTEGER NOT NULL,
    `alokasi_persen` DECIMAL(5, 2) NOT NULL,

    UNIQUE INDEX `kegiatan_capaian_kegiatan_id_sub_capaian_id_key`(`kegiatan_id`, `sub_capaian_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kegiatan_approval` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kegiatan_id` INTEGER NOT NULL,
    `tahap` ENUM('verifikasi', 'approval') NOT NULL,
    `aktor_id` BIGINT NOT NULL,
    `keputusan` ENUM('setuju', 'revisi', 'tolak') NOT NULL,
    `alasan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `partisipasi` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `kegiatan_id` INTEGER NOT NULL,
    `mahasiswa_id` BIGINT NOT NULL,
    `status` ENUM('terdaftar', 'menunggu_izin_pa', 'disetujui_pa', 'ditolak_pa', 'revisi_pa', 'hadir', 'tidak_hadir', 'dibatalkan') NOT NULL DEFAULT 'terdaftar',
    `kehadiran` BOOLEAN NULL,
    `peran_verif_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `partisipasi_mahasiswa_id_idx`(`mahasiswa_id`),
    INDEX `partisipasi_status_idx`(`status`),
    UNIQUE INDEX `partisipasi_kegiatan_id_mahasiswa_id_key`(`kegiatan_id`, `mahasiswa_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `izin_pa` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `partisipasi_id` BIGINT NOT NULL,
    `dosen_pa_id` BIGINT NOT NULL,
    `status` ENUM('diajukan', 'disetujui', 'ditolak', 'revisi') NOT NULL DEFAULT 'diajukan',
    `alasan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decided_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `klaim_poin` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `partisipasi_id` BIGINT NOT NULL,
    `peran_usulan_id` INTEGER NULL,
    `status` ENUM('draft', 'menunggu_validasi', 'menunggu_pimpinan', 'valid', 'perlu_revisi', 'invalid', 'disetujui', 'ditolak') NOT NULL DEFAULT 'draft',
    `validator_id` BIGINT NULL,
    `alasan` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `klaim_poin_partisipasi_id_key`(`partisipasi_id`),
    INDEX `klaim_poin_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bukti` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `klaim_poin_id` BIGINT NOT NULL,
    `tipe` ENUM('pdf', 'link') NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perolehan_poin` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `klaim_poin_id` BIGINT NOT NULL,
    `mahasiswa_id` BIGINT NOT NULL,
    `kegiatan_id` INTEGER NOT NULL,
    `total_poin` INTEGER NOT NULL,
    `status` ENUM('sah', 'dikoreksi', 'dibatalkan') NOT NULL DEFAULT 'sah',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `perolehan_poin_klaim_poin_id_key`(`klaim_poin_id`),
    INDEX `perolehan_poin_mahasiswa_id_idx`(`mahasiswa_id`),
    UNIQUE INDEX `perolehan_poin_mahasiswa_id_kegiatan_id_key`(`mahasiswa_id`, `kegiatan_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `perolehan_detail` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `perolehan_poin_id` BIGINT NOT NULL,
    `sub_capaian_id` INTEGER NOT NULL,
    `poin` INTEGER NOT NULL,

    INDEX `perolehan_detail_sub_capaian_id_idx`(`sub_capaian_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saran_pa` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `dosen_pa_id` BIGINT NOT NULL,
    `mahasiswa_id` BIGINT NOT NULL,
    `isi` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifikasi` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT NOT NULL,
    `judul` VARCHAR(200) NOT NULL,
    `isi` TEXT NULL,
    `ref_type` VARCHAR(40) NULL,
    `ref_id` BIGINT NULL,
    `dibaca` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifikasi_user_id_dibaca_idx`(`user_id`, `dibaca`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `entitas` VARCHAR(40) NOT NULL,
    `entitas_id` BIGINT NOT NULL,
    `aksi` VARCHAR(60) NOT NULL,
    `status_lama` VARCHAR(40) NULL,
    `status_baru` VARCHAR(40) NULL,
    `aktor_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_log_entitas_entitas_id_idx`(`entitas`, `entitas_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cv_generated` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `mahasiswa_id` BIGINT NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `program_studi` ADD CONSTRAINT `program_studi_fakultas_id_fkey` FOREIGN KEY (`fakultas_id`) REFERENCES `fakultas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen` ADD CONSTRAINT `dosen_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dosen` ADD CONSTRAINT `dosen_fakultas_id_fkey` FOREIGN KEY (`fakultas_id`) REFERENCES `fakultas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_prodi_id_fkey` FOREIGN KEY (`prodi_id`) REFERENCES `program_studi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mahasiswa` ADD CONSTRAINT `mahasiswa_dosen_pa_id_fkey` FOREIGN KEY (`dosen_pa_id`) REFERENCES `dosen`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `staff` ADD CONSTRAINT `staff_fakultas_id_fkey` FOREIGN KEY (`fakultas_id`) REFERENCES `fakultas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organisasi` ADD CONSTRAINT `organisasi_fakultas_id_fkey` FOREIGN KEY (`fakultas_id`) REFERENCES `fakultas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organisasi_operator` ADD CONSTRAINT `organisasi_operator_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `organisasi_operator` ADD CONSTRAINT `organisasi_operator_organisasi_id_fkey` FOREIGN KEY (`organisasi_id`) REFERENCES `organisasi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kurikulum` ADD CONSTRAINT `kurikulum_dibuat_oleh_fkey` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `capaian` ADD CONSTRAINT `capaian_kurikulum_id_fkey` FOREIGN KEY (`kurikulum_id`) REFERENCES `kurikulum`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_capaian` ADD CONSTRAINT `sub_capaian_capaian_id_fkey` FOREIGN KEY (`capaian_id`) REFERENCES `capaian`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mp_skala` ADD CONSTRAINT `mp_skala_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `mp_kategori`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mp_peran` ADD CONSTRAINT `mp_peran_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `mp_kategori`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matriks_poin` ADD CONSTRAINT `matriks_poin_kurikulum_id_fkey` FOREIGN KEY (`kurikulum_id`) REFERENCES `kurikulum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matriks_poin` ADD CONSTRAINT `matriks_poin_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `mp_kategori`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matriks_poin` ADD CONSTRAINT `matriks_poin_skala_id_fkey` FOREIGN KEY (`skala_id`) REFERENCES `mp_skala`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matriks_poin` ADD CONSTRAINT `matriks_poin_peran_id_fkey` FOREIGN KEY (`peran_id`) REFERENCES `mp_peran`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matriks_poin_histori` ADD CONSTRAINT `matriks_poin_histori_matriks_poin_id_fkey` FOREIGN KEY (`matriks_poin_id`) REFERENCES `matriks_poin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `matriks_poin_histori` ADD CONSTRAINT `matriks_poin_histori_diubah_oleh_fkey` FOREIGN KEY (`diubah_oleh`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan` ADD CONSTRAINT `kegiatan_kategori_id_fkey` FOREIGN KEY (`kategori_id`) REFERENCES `mp_kategori`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan` ADD CONSTRAINT `kegiatan_skala_id_fkey` FOREIGN KEY (`skala_id`) REFERENCES `mp_skala`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan` ADD CONSTRAINT `kegiatan_organisasi_id_fkey` FOREIGN KEY (`organisasi_id`) REFERENCES `organisasi`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan` ADD CONSTRAINT `kegiatan_kurikulum_id_fkey` FOREIGN KEY (`kurikulum_id`) REFERENCES `kurikulum`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan` ADD CONSTRAINT `kegiatan_dibuat_oleh_fkey` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan_capaian` ADD CONSTRAINT `kegiatan_capaian_kegiatan_id_fkey` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan_capaian` ADD CONSTRAINT `kegiatan_capaian_sub_capaian_id_fkey` FOREIGN KEY (`sub_capaian_id`) REFERENCES `sub_capaian`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan_approval` ADD CONSTRAINT `kegiatan_approval_kegiatan_id_fkey` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kegiatan_approval` ADD CONSTRAINT `kegiatan_approval_aktor_id_fkey` FOREIGN KEY (`aktor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partisipasi` ADD CONSTRAINT `partisipasi_kegiatan_id_fkey` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partisipasi` ADD CONSTRAINT `partisipasi_mahasiswa_id_fkey` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `partisipasi` ADD CONSTRAINT `partisipasi_peran_verif_id_fkey` FOREIGN KEY (`peran_verif_id`) REFERENCES `mp_peran`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_pa` ADD CONSTRAINT `izin_pa_partisipasi_id_fkey` FOREIGN KEY (`partisipasi_id`) REFERENCES `partisipasi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `izin_pa` ADD CONSTRAINT `izin_pa_dosen_pa_id_fkey` FOREIGN KEY (`dosen_pa_id`) REFERENCES `dosen`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `klaim_poin` ADD CONSTRAINT `klaim_poin_partisipasi_id_fkey` FOREIGN KEY (`partisipasi_id`) REFERENCES `partisipasi`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `klaim_poin` ADD CONSTRAINT `klaim_poin_peran_usulan_id_fkey` FOREIGN KEY (`peran_usulan_id`) REFERENCES `mp_peran`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `klaim_poin` ADD CONSTRAINT `klaim_poin_validator_id_fkey` FOREIGN KEY (`validator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bukti` ADD CONSTRAINT `bukti_klaim_poin_id_fkey` FOREIGN KEY (`klaim_poin_id`) REFERENCES `klaim_poin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perolehan_poin` ADD CONSTRAINT `perolehan_poin_klaim_poin_id_fkey` FOREIGN KEY (`klaim_poin_id`) REFERENCES `klaim_poin`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perolehan_poin` ADD CONSTRAINT `perolehan_poin_mahasiswa_id_fkey` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perolehan_poin` ADD CONSTRAINT `perolehan_poin_kegiatan_id_fkey` FOREIGN KEY (`kegiatan_id`) REFERENCES `kegiatan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perolehan_detail` ADD CONSTRAINT `perolehan_detail_perolehan_poin_id_fkey` FOREIGN KEY (`perolehan_poin_id`) REFERENCES `perolehan_poin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `perolehan_detail` ADD CONSTRAINT `perolehan_detail_sub_capaian_id_fkey` FOREIGN KEY (`sub_capaian_id`) REFERENCES `sub_capaian`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saran_pa` ADD CONSTRAINT `saran_pa_dosen_pa_id_fkey` FOREIGN KEY (`dosen_pa_id`) REFERENCES `dosen`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saran_pa` ADD CONSTRAINT `saran_pa_mahasiswa_id_fkey` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifikasi` ADD CONSTRAINT `notifikasi_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_aktor_id_fkey` FOREIGN KEY (`aktor_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cv_generated` ADD CONSTRAINT `cv_generated_mahasiswa_id_fkey` FOREIGN KEY (`mahasiswa_id`) REFERENCES `mahasiswa`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
