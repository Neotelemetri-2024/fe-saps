-- ==============================================================================
-- DUMMY DATA: 10 AKUN MAHASISWA & 10 AKUN DOSEN PA (10 FAKULTAS & JURUSAN BERBEDA)
-- Password untuk SEMUA akun: password123
-- Hash Bcrypt: $2b$10$3euPcmQFCiblsZeEu5s7p.9ovhk8fvDFd8e6nLhR.p5L1rD4zU0U6
-- ==============================================================================

-- 1. Set variabel password hash
SET @PASSWORD_HASH = '$2b$10$3euPcmQFCiblsZeEu5s7p.9ovhk8fvDFd8e6nLhR.p5L1rD4zU0U6';

-- ------------------------------------------------------------------------------
-- 2. Pastikan 10 Fakultas & Program Studi Tersedia
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO `fakultas` (`nama`) VALUES
('Fakultas Teknologi Informasi'),
('Fakultas Teknik'),
('Fakultas Ekonomi dan Bisnis'),
('Fakultas Kedokteran'),
('Fakultas Hukum'),
('Fakultas MIPA'),
('Fakultas Pertanian'),
('Fakultas Farmasi'),
('Fakultas Ilmu Budaya'),
('Fakultas Ilmu Sosial dan Ilmu Politik');

-- Insert Program Studi untuk masing-masing Fakultas
INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Sistem Informasi' FROM `fakultas` WHERE nama = 'Fakultas Teknologi Informasi' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Teknik Elektro' FROM `fakultas` WHERE nama = 'Fakultas Teknik' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Manajemen' FROM `fakultas` WHERE nama = 'Fakultas Ekonomi dan Bisnis' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Kedokteran' FROM `fakultas` WHERE nama = 'Fakultas Kedokteran' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Ilmu Hukum' FROM `fakultas` WHERE nama = 'Fakultas Hukum' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Matematika' FROM `fakultas` WHERE nama = 'Fakultas MIPA' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Agroteknologi' FROM `fakultas` WHERE nama = 'Fakultas Pertanian' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Farmasi' FROM `fakultas` WHERE nama = 'Fakultas Farmasi' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Sastra Inggris' FROM `fakultas` WHERE nama = 'Fakultas Ilmu Budaya' LIMIT 1;

INSERT IGNORE INTO `program_studi` (`fakultas_id`, `nama`)
SELECT id, 'Ilmu Komunikasi' FROM `fakultas` WHERE nama = 'Fakultas Ilmu Sosial dan Ilmu Politik' LIMIT 1;


-- ------------------------------------------------------------------------------
-- 3. Insert 10 Akun User Dosen PA
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`nama`, `email`, `password_hash`, `peran`, `aktif`, `nomor_telepon`, `alamat`)
VALUES
('Dr. Eng. Rahmat Hidayat, M.T.', 'dosen.fti@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010001', 'Padang, Sumbar'),
('Dr. Ir. Budi Santoso, M.Sc.', 'dosen.ft@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010002', 'Padang, Sumbar'),
('Dr. Nurhasanah, S.E., M.Si.', 'dosen.feb@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010003', 'Padang, Sumbar'),
('dr. Hendri Wijaya, Sp.PD', 'dosen.fk@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010004', 'Padang, Sumbar'),
('Dr. Fajri Tanjung, S.H., M.H.', 'dosen.fh@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010005', 'Padang, Sumbar'),
('Dr. Yulia Citra, S.Si., M.Si.', 'dosen.fmipa@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010006', 'Padang, Sumbar'),
('Dr. Ir. Zulkifli, M.P.', 'dosen.faperta@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010007', 'Padang, Sumbar'),
('Dr. apt. Fitriani, M.Farm.', 'dosen.ffarmasi@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010008', 'Padang, Sumbar'),
('Dr. Rina Marlina, M.Hum.', 'dosen.fib@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010009', 'Padang, Sumbar'),
('Dr. Ari Wibowo, S.Sos., M.I.Kom.', 'dosen.fisip@unand.ac.id', @PASSWORD_HASH, 'dosen', 1, '081267010010', 'Padang, Sumbar')
ON DUPLICATE KEY UPDATE `nama` = VALUES(`nama`);

-- Insert profil Dosen PA
INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0011018501', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Teknologi Informasi' WHERE u.email = 'dosen.fti@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0012028202', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Teknik' WHERE u.email = 'dosen.ft@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0013038303', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Ekonomi dan Bisnis' WHERE u.email = 'dosen.feb@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0014048404', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Kedokteran' WHERE u.email = 'dosen.fk@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0015058505', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Hukum' WHERE u.email = 'dosen.fh@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0016068606', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas MIPA' WHERE u.email = 'dosen.fmipa@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0017078707', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Pertanian' WHERE u.email = 'dosen.faperta@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0018088808', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Farmasi' WHERE u.email = 'dosen.ffarmasi@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0019098909', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Ilmu Budaya' WHERE u.email = 'dosen.fib@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);

INSERT INTO `dosen` (`user_id`, `nidn`, `fakultas_id`)
SELECT u.id, '0020109010', f.id FROM `users` u JOIN `fakultas` f ON f.nama = 'Fakultas Ilmu Sosial dan Ilmu Politik' WHERE u.email = 'dosen.fisip@unand.ac.id'
ON DUPLICATE KEY UPDATE `nidn` = VALUES(`nidn`);


-- ------------------------------------------------------------------------------
-- 4. Insert 10 Akun User Mahasiswa
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`nama`, `email`, `password_hash`, `peran`, `aktif`, `nomor_telepon`, `alamat`)
VALUES
('Fathur Rahman', 'fathur.si@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010001', 'Padang'),
('Dimas Arya Pratama', 'dimas.elektro@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010002', 'Padang'),
('Annisa Salsabila', 'annisa.manajemen@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010003', 'Padang'),
('Kevin Adrian', 'kevin.kedokteran@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010004', 'Padang'),
('Zahra Putri Utami', 'zahra.hukum@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010005', 'Padang'),
('Farhan Maulana', 'farhan.matematika@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010006', 'Padang'),
('Tiara Larasati', 'tiara.agrotek@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010007', 'Padang'),
('Rizky Ananda', 'rizky.farmasi@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010008', 'Padang'),
('Nadia Syifa', 'nadia.sastra@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010009', 'Padang'),
('Ilham Saputra', 'ilham.ilkom@student.unand.ac.id', @PASSWORD_HASH, 'mahasiswa', 1, '082170010010', 'Padang')
ON DUPLICATE KEY UPDATE `nama` = VALUES(`nama`);

-- Insert profil Mahasiswa (Terhubung ke Prodi & Dosen PA masing-masing)
-- 1. FTI - Sistem Informasi
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2211521001', 
  (SELECT id FROM `program_studi` WHERE nama = 'Sistem Informasi' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.fti@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'fathur.si@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 2. FT - Teknik Elektro
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2210952002', 
  (SELECT id FROM `program_studi` WHERE nama = 'Teknik Elektro' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.ft@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'dimas.elektro@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 3. FEB - Manajemen
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2210531003', 
  (SELECT id FROM `program_studi` WHERE nama = 'Manajemen' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.feb@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'annisa.manajemen@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 4. FK - Kedokteran
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2210312004', 
  (SELECT id FROM `program_studi` WHERE nama = 'Kedokteran' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.fk@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'kevin.kedokteran@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 5. FH - Ilmu Hukum
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2210113005', 
  (SELECT id FROM `program_studi` WHERE nama = 'Ilmu Hukum' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.fh@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'zahra.hukum@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 6. FMIPA - Matematika
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2210411006', 
  (SELECT id FROM `program_studi` WHERE nama = 'Matematika' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.fmipa@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'farhan.matematika@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 7. Faperta - Agroteknologi
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2210212007', 
  (SELECT id FROM `program_studi` WHERE nama = 'Agroteknologi' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.faperta@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'tiara.agrotek@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 8. Farmasi - Farmasi
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2211013008', 
  (SELECT id FROM `program_studi` WHERE nama = 'Farmasi' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.ffarmasi@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'rizky.farmasi@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 9. FIB - Sastra Inggris
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2210711009', 
  (SELECT id FROM `program_studi` WHERE nama = 'Sastra Inggris' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.fib@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'nadia.sastra@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);

-- 10. FISIP - Ilmu Komunikasi
INSERT INTO `mahasiswa` (`user_id`, `nim`, `prodi_id`, `dosen_pa_id`, `angkatan`)
SELECT 
  u.id, 
  '2210812010', 
  (SELECT id FROM `program_studi` WHERE nama = 'Ilmu Komunikasi' LIMIT 1),
  (SELECT id FROM `users` WHERE email = 'dosen.fisip@unand.ac.id' LIMIT 1),
  2022
FROM `users` u WHERE u.email = 'ilham.ilkom@student.unand.ac.id'
ON DUPLICATE KEY UPDATE `dosen_pa_id` = VALUES(`dosen_pa_id`);
