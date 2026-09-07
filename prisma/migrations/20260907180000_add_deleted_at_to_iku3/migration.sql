-- AlterTable: Menambahkan kolom deleted_at untuk soft delete pada iku3_target dan iku3_bobot_rule
ALTER TABLE `iku3_target` ADD COLUMN `deleted_at` DATETIME(3) NULL;
ALTER TABLE `iku3_bobot_rule` ADD COLUMN `deleted_at` DATETIME(3) NULL;
