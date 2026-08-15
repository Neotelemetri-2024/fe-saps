-- AlterTable
ALTER TABLE `mahasiswa` ADD COLUMN `linkedin_member_id` VARCHAR(100) NULL,
    ADD COLUMN `linkedin_access_token` TEXT NULL,
    ADD COLUMN `linkedin_token_expires_at` DATETIME(3) NULL;
