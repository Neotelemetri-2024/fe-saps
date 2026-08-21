-- ============================================================
-- BACKFILL poin kegiatan INTERNAL yang sudah Hadir tapi POIN = "-"
-- Database: db_saps (server / production)
-- Aman: hanya isi klaim + perolehan yang belum ada
-- ============================================================
START TRANSACTION;

-- 0) wqeag / partisipasi Budi (id=22) belum punya peran → samakan dengan peserta lain
UPDATE `partisipasi`
SET `peran_verif_id` = 25
WHERE `id` = 22
  AND `mahasiswa_id` = 4
  AND `peran_verif_id` IS NULL;

-- 1) Buat klaim_poin untuk partisipasi internal (hadir + punya peran) yang belum punya klaim
INSERT INTO `klaim_poin` (`partisipasi_id`, `peran_usulan_id`, `status`, `validator_id`, `alasan`, `created_at`)
SELECT
  p.`id`,
  p.`peran_verif_id`,
  'disetujui',
  1,
  'Backfill: poin internal (kehadiran sudah tercatat)',
  NOW(3)
FROM `partisipasi` p
JOIN `kegiatan` k ON k.`id` = p.`kegiatan_id`
LEFT JOIN `klaim_poin` kp ON kp.`partisipasi_id` = p.`id`
WHERE k.`asal` IN ('kurikuler_ukm', 'kurikuler_ukmf', 'universitas')
  AND p.`kehadiran` = 1
  AND p.`peran_verif_id` IS NOT NULL
  AND kp.`id` IS NULL;

-- 2) Buat perolehan_poin dari matriks (kurikulum + kategori + skala + peran)
INSERT INTO `perolehan_poin` (`klaim_poin_id`, `mahasiswa_id`, `kegiatan_id`, `total_poin`, `status`, `created_at`)
SELECT
  kp.`id`,
  p.`mahasiswa_id`,
  k.`id`,
  mp.`poin`,
  'sah',
  NOW(3)
FROM `klaim_poin` kp
JOIN `partisipasi` p ON p.`id` = kp.`partisipasi_id`
JOIN `kegiatan` k ON k.`id` = p.`kegiatan_id`
JOIN `matriks_poin` mp
  ON mp.`kurikulum_id` = k.`kurikulum_id`
 AND mp.`kategori_id` = k.`kategori_id`
 AND mp.`skala_id` = k.`skala_id`
 AND mp.`peran_id` = COALESCE(kp.`peran_usulan_id`, p.`peran_verif_id`)
LEFT JOIN `perolehan_poin` pp ON pp.`klaim_poin_id` = kp.`id`
WHERE k.`asal` IN ('kurikuler_ukm', 'kurikuler_ukmf', 'universitas')
  AND pp.`id` IS NULL
  AND kp.`status` IN ('disetujui', 'valid');

-- 3) Pecah poin ke sub-capaian sesuai alokasi kegiatan_capaian
INSERT INTO `perolehan_detail` (`perolehan_poin_id`, `sub_capaian_id`, `poin`)
SELECT
  pp.`id`,
  kc.`sub_capaian_id`,
  ROUND(pp.`total_poin` * (kc.`alokasi_persen` / 100))
FROM `perolehan_poin` pp
JOIN `kegiatan_capaian` kc ON kc.`kegiatan_id` = pp.`kegiatan_id`
LEFT JOIN `perolehan_detail` pd
  ON pd.`perolehan_poin_id` = pp.`id`
 AND pd.`sub_capaian_id` = kc.`sub_capaian_id`
WHERE pd.`id` IS NULL;

-- 4) Jika kegiatan belum punya alokasi capaian, pakai 1 sub-capaian kurikulum aktif (100%)
INSERT INTO `perolehan_detail` (`perolehan_poin_id`, `sub_capaian_id`, `poin`)
SELECT
  pp.`id`,
  (
    SELECT sc.`id`
    FROM `sub_capaian` sc
    JOIN `capaian` c ON c.`id` = sc.`capaian_id`
    JOIN `kurikulum` ku ON ku.`id` = c.`kurikulum_id`
    WHERE ku.`status` = 'aktif'
    ORDER BY sc.`id`
    LIMIT 1
  ) AS sub_id,
  pp.`total_poin`
FROM `perolehan_poin` pp
LEFT JOIN `perolehan_detail` pd ON pd.`perolehan_poin_id` = pp.`id`
LEFT JOIN `kegiatan_capaian` kc ON kc.`kegiatan_id` = pp.`kegiatan_id`
WHERE pd.`id` IS NULL
  AND kc.`id` IS NULL
HAVING sub_id IS NOT NULL;

COMMIT;

-- Verifikasi untuk Budi (user_id=4):
-- SELECT k.nama, p.peran_verif_id, kp.status, pp.total_poin
-- FROM partisipasi p
-- JOIN kegiatan k ON k.id=p.kegiatan_id
-- LEFT JOIN klaim_poin kp ON kp.partisipasi_id=p.id
-- LEFT JOIN perolehan_poin pp ON pp.klaim_poin_id=kp.id
-- WHERE p.mahasiswa_id=4 AND k.asal IN ('kurikuler_ukm','kurikuler_ukmf','universitas');
