-- ==============================================================================
-- DUMMY DATA: 1 DOSEN PA & 2 MAHASISWA BIMBINGAN (ANGKATAN 2024)
-- Password untuk SEMUA akun: password123
-- Hash Bcrypt: $2b$10$z9SyfgQKdbrg9pIl0Ks1PeeNmrDBxLOKrlYNas8IJZXYgAqHc3gVq
-- ==============================================================================

-- 1. Siapkan Variabel Bersama
SET @PASSWORD_HASH = '$2b$10$z9SyfgQKdbrg9pIl0Ks1PeeNmrDBxLOKrlYNas8IJZXYgAqHc3gVq';

-- Ambil ID Prodi (Prioritas: Sistem Informasi atau prodi pertama yang ada)
SET @PRODI_ID = (
  SELECT id FROM `program_studi` 
  ORDER BY (nama LIKE '%Sistem Informasi%') DESC, id ASC 
  LIMIT 1
);

-- Ambil ID Fakultas dari Prodi tersebut
SET @FAKULTAS_ID = (SELECT fakultas_id FROM `program_studi` WHERE id = @PRODI_ID LIMIT 1);

-- Ambil ID Kurikulum yang berlaku untuk Angkatan 2024 (angkatan_mulai <= 2024)
SET @KURIKULUM_ID = (
  SELECT id FROM `kurikulum` 
  WHERE deleted_at IS NULL AND (angkatan_mulai IS NULL OR angkatan_mulai <= 2024)
  ORDER BY (status = 'aktif') DESC, angkatan_mulai DESC, id DESC 
  LIMIT 1
);


-- ==============================================================================
-- 2. INSERT AKUN & PROFIL DOSEN PA
-- ==============================================================================
-- 2.1 Akun User Dosen
INSERT INTO `users` (`nama`, `email`, `password_hash`, `peran`, `aktif`, `nomor_telepon`, `alamat`)
VALUES (
  'Dr. Eng. Rahmat Hidayat, M.T.',
  'dosen.rahmat@unand.ac.id',
  @PASSWORD_HASH,
  'dosen',
  1,
  '081267010001',
  'Limau Manis, Padang'
)
ON DUPLICATE KEY UPDATE 
  `nama` = VALUES(`nama`),
  `password_hash` = VALUES(`password_hash`),
  `aktif` = 1;

-- Ambil User ID Dosen
SET @DOSEN_USER_ID = (SELECT id FROM `users` WHERE email = 'dosen.rahmat@unand.ac.id' LIMIT 1);

-- 2.2 Profil Dosen
INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
VALUES (
  @DOSEN_USER_ID,
  '0011018501',
  @FAKULTAS_ID
)
ON DUPLICATE KEY UPDATE 
  `nidn` = VALUES(`nidn`),
  `fakultas_id` = VALUES(`fakultas_id`);


-- ==============================================================================
-- 3. INSERT 2 AKUN USER MAHASISWA (ANGKATAN 2024)
-- ==============================================================================
INSERT INTO `users` (`nama`, `email`, `password_hash`, `peran`, `aktif`, `nomor_telepon`, `alamat`)
VALUES 
  ('Fathur Rahman', '2411521001@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010001', 'Padang'),
  ('Annisa Salsabila', '2411521002@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010002', 'Padang')
ON DUPLICATE KEY UPDATE 
  `nama` = VALUES(`nama`),
  `password_hash` = VALUES(`password_hash`),
  `aktif` = 1;

-- Ambil User ID Masing-Masing Mahasiswa
SET @MHS1_USER_ID = (SELECT id FROM `users` WHERE email = '2411521001@student.unand.ac.id' LIMIT 1);
SET @MHS2_USER_ID = (SELECT id FROM `users` WHERE email = '2411521002@student.unand.ac.id' LIMIT 1);


-- ==============================================================================
-- 4. INSERT PROFIL MAHASISWA (TERHUBUNG KE DOSEN PA DI ATAS)
-- ==============================================================================
-- Mahasiswa 1 (NIM 2411521001 - Angkatan 2024)
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`, `kurikulum_id`)
VALUES (
  @MHS1_USER_ID,
  '2411521001',
  @PRODI_ID,
  @DOSEN_USER_ID,   -- Terhubung ke Dr. Eng. Rahmat Hidayat, M.T.
  2024,
  @KURIKULUM_ID
)
ON DUPLICATE KEY UPDATE 
  `prodi_id` = VALUES(`prodi_id`),
  `dosen_pa_id` = VALUES(`dosen_pa_id`),
  `angkatan` = VALUES(`angkatan`),
  `kurikulum_id` = VALUES(`kurikulum_id`);

-- Mahasiswa 2 (NIM 2411521002 - Angkatan 2024)
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`, `kurikulum_id`)
VALUES (
  @MHS2_USER_ID,
  '2411521002',
  @PRODI_ID,
  @DOSEN_USER_ID,   -- Terhubung ke Dosen PA yang SAMA
  2024,
  @KURIKULUM_ID
)
ON DUPLICATE KEY UPDATE 
  `prodi_id` = VALUES(`prodi_id`),
  `dosen_pa_id` = VALUES(`dosen_pa_id`),
  `angkatan` = VALUES(`angkatan`),
  `kurikulum_id` = VALUES(`kurikulum_id`);


-- ==============================================================================
-- 5. VERIFIKASI HASIL INSERT
-- ==============================================================================
SELECT 
  m.nim,
  u_mhs.nama AS nama_mahasiswa,
  p.nama AS program_studi,
  m.angkatan,
  k.nama AS kurikulum,
  u_dsn.nama AS dosen_pembimbing_akademik
FROM mahasiswa m
JOIN users u_mhs ON u_mhs.id = m.user_id
JOIN program_studi p ON p.id = m.prodi_id
LEFT JOIN kurikulum k ON k.id = m.kurikulum_id
LEFT JOIN users u_dsn ON u_dsn.id = m.dosen_pa_id
WHERE m.nim IN ('2411521001', '2411521002');
