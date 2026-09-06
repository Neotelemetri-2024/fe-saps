-- Multi-kurikulum berdasarkan angkatan mulai.
-- Kolom assignment/snapshot dibuat nullable agar rollout dan audit data lama aman.

ALTER TABLE `kurikulum`
  ADD COLUMN `angkatan_mulai` SMALLINT NULL;

CREATE UNIQUE INDEX `kurikulum_angkatan_mulai_key`
  ON `kurikulum`(`angkatan_mulai`);
CREATE INDEX `kurikulum_status_angkatan_mulai_idx`
  ON `kurikulum`(`status`, `angkatan_mulai`);

ALTER TABLE `mahasiswa`
  ADD COLUMN `kurikulum_id` INTEGER NULL;
CREATE INDEX `mahasiswa_angkatan_idx` ON `mahasiswa`(`angkatan`);
CREATE INDEX `mahasiswa_kurikulum_id_idx` ON `mahasiswa`(`kurikulum_id`);
ALTER TABLE `mahasiswa`
  ADD CONSTRAINT `mahasiswa_kurikulum_id_fkey`
  FOREIGN KEY (`kurikulum_id`) REFERENCES `kurikulum`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `kegiatan`
  MODIFY COLUMN `kurikulum_id` INTEGER NULL;

ALTER TABLE `perolehan_poin`
  ADD COLUMN `kurikulum_id` INTEGER NULL;
CREATE INDEX `perolehan_poin_kurikulum_id_idx`
  ON `perolehan_poin`(`kurikulum_id`);
ALTER TABLE `perolehan_poin`
  ADD CONSTRAINT `perolehan_poin_kurikulum_id_fkey`
  FOREIGN KEY (`kurikulum_id`) REFERENCES `kurikulum`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Kandidat tahun mulai dari komponen pertama tahun akademik. Nilai duplikat
-- sengaja tidak diisi otomatis agar UNIQUE tidak memilih kurikulum secara diam-diam.
UPDATE `kurikulum` k
JOIN (
  SELECT MIN(`id`) AS `id`, CAST(SUBSTRING_INDEX(`tahun_akademik`, '/', 1) AS UNSIGNED) AS `tahun`
  FROM `kurikulum`
  WHERE `tahun_akademik` REGEXP '^[0-9]{4}(/[0-9]{4})?$'
  GROUP BY CAST(SUBSTRING_INDEX(`tahun_akademik`, '/', 1) AS UNSIGNED)
  HAVING COUNT(*) = 1
) kandidat ON kandidat.id = k.id
SET k.angkatan_mulai = kandidat.tahun;
