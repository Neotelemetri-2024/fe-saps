-- AlterTable: Add nip to staff table
ALTER TABLE `staff` ADD COLUMN `nip` VARCHAR(50) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `staff_nip_key` ON `staff`(`nip`);
