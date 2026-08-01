-- AlterTable
ALTER TABLE `mahasiswa` ADD COLUMN `public_cv_token` VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `alamat` VARCHAR(255) NULL,
    ADD COLUMN `nomor_telepon` VARCHAR(30) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `mahasiswa_public_cv_token_key` ON `mahasiswa`(`public_cv_token`);
