-- CreateTable
CREATE TABLE `iku3_target` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tahun` INTEGER NOT NULL,
    `target_persen` DECIMAL(5, 2) NOT NULL,
    `keterangan` VARCHAR(255) NULL,
    `diubah_oleh` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `iku3_target_tahun_key`(`tahun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `iku3_bobot_rule` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tahun_mulai` INTEGER NOT NULL DEFAULT 2026,
    `jenis` VARCHAR(30) NOT NULL,
    `skala` VARCHAR(50) NULL,
    `peran` VARCHAR(50) NULL,
    `sks_min` INTEGER NULL,
    `sks_max` INTEGER NULL,
    `bobot` DECIMAL(4, 2) NOT NULL,
    `aktif` BOOLEAN NOT NULL DEFAULT true,
    `keterangan` VARCHAR(255) NULL,
    `diubah_oleh` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `iku3_target` ADD CONSTRAINT `iku3_target_diubah_oleh_fkey` FOREIGN KEY (`diubah_oleh`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `iku3_bobot_rule` ADD CONSTRAINT `iku3_bobot_rule_diubah_oleh_fkey` FOREIGN KEY (`diubah_oleh`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default target + bobot Kepmen 358/2025
INSERT INTO `iku3_target` (`tahun`, `target_persen`, `keterangan`)
VALUES (2026, 50.00, 'Target Resmi IKU 3 Tahun Anggaran 2026 (Kepmen 358/2025)');

INSERT INTO `iku3_bobot_rule` (`tahun_mulai`, `jenis`, `skala`, `peran`, `sks_min`, `sks_max`, `bobot`, `keterangan`) VALUES
(2026, 'prestasi', 'Internasional', 'Juara 1', NULL, NULL, 1.00, 'Juara 1 Tingkat Internasional'),
(2026, 'prestasi', 'Internasional', 'Juara 2/3/Favorit', NULL, NULL, 0.50, 'Juara 2, 3, atau Favorit Internasional'),
(2026, 'prestasi', 'Internasional', 'Juara Harapan', NULL, NULL, 0.30, 'Juara Harapan Internasional'),
(2026, 'prestasi', 'Internasional', 'Finalis', NULL, NULL, 0.20, 'Finalis Internasional'),
(2026, 'prestasi', 'Nasional', 'Juara 1', NULL, NULL, 0.60, 'Juara 1 Tingkat Nasional'),
(2026, 'prestasi', 'Nasional', 'Juara 2/3/Favorit', NULL, NULL, 0.30, 'Juara 2, 3, atau Favorit Nasional'),
(2026, 'prestasi', 'Nasional', 'Juara Harapan', NULL, NULL, 0.20, 'Juara Harapan Nasional'),
(2026, 'prestasi', 'Nasional', 'Finalis', NULL, NULL, 0.10, 'Finalis Nasional'),
(2026, 'prestasi', 'Provinsi', 'Juara 1', NULL, NULL, 0.40, 'Juara 1 Tingkat Provinsi'),
(2026, 'prestasi', 'Provinsi', 'Juara 2/3/Favorit', NULL, NULL, 0.20, 'Juara 2, 3, atau Favorit Provinsi'),
(2026, 'prestasi', 'Provinsi', 'Juara Harapan', NULL, NULL, 0.10, 'Juara Harapan Provinsi'),
(2026, 'prestasi', 'Provinsi', 'Finalis', NULL, NULL, 0.05, 'Finalis Provinsi'),
(2026, 'pembelajaran', NULL, NULL, 0, 5, 0.40, 'Pembelajaran Luar Kampus <= 5 SKS'),
(2026, 'pembelajaran', NULL, NULL, 6, 10, 0.60, 'Pembelajaran Luar Kampus 6-10 SKS'),
(2026, 'pembelajaran', NULL, NULL, 11, NULL, 1.00, 'Pembelajaran Luar Kampus >= 10 SKS (MBKM Penuh)');
