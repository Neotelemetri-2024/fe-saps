-- ============================================================
-- SYNC poin/kegiatan INTERNAL local -> server (db_saps)
-- Target: budi.mahasiswa@unand.ac.id (mahasiswa_id/user_id = 4)
-- Aman: INSERT saja, tidak DELETE/UPDATE data lama
-- ============================================================
START TRANSACTION;

-- 1) Organisasi pendukung
INSERT INTO `organisasi` (`id`,`nama`,`tipe`,`fakultas_id`) VALUES (17,'UKM Debat (sync local)','UKM',NULL);
INSERT INTO `organisasi` (`id`,`nama`,`tipe`,`fakultas_id`) VALUES (18,'UKMF IT Community (sync local)','UKMF',NULL);

-- 2) Kegiatan + partisipasi + klaim + perolehan (kurikulum aktif=3)

-- Lomba Debatt (kurikuler_ukm)
INSERT INTO `kegiatan` (`id`,`nama`,`kategori_id`,`skala_id`,`asal`,`deskripsi`,`tanggal_mulai`,`tanggal_selesai`,`lokasi`,`kuota`,`organisasi_id`,`penyelenggara_ext`,`kurikulum_id`,`dibuat_oleh`,`status`,`created_at`,`email_penyelenggara`,`link_penyelenggara`) VALUES (25,'Lomba Debatt',7,26,'kurikuler_ukm','adad','2026-07-12','2026-07-14','adad',100,17,NULL,3,1,'terpublikasi',NOW(3),NULL,NULL);
INSERT INTO `partisipasi` (`id`,`kegiatan_id`,`mahasiswa_id`,`status`,`kehadiran`,`peran_verif_id`,`created_at`) VALUES (24,25,4,'hadir',1,21,NOW(3));
INSERT INTO `klaim_poin` (`id`,`partisipasi_id`,`peran_usulan_id`,`status`,`validator_id`,`alasan`,`created_at`) VALUES (7,24,21,'disetujui',1,'Sync dari local: poin internal',NOW(3));
INSERT INTO `perolehan_poin` (`id`,`klaim_poin_id`,`mahasiswa_id`,`kegiatan_id`,`total_poin`,`status`,`created_at`) VALUES (6,7,4,25,40,'sah',NOW(3));
INSERT INTO `perolehan_detail` (`id`,`perolehan_poin_id`,`sub_capaian_id`,`poin`) VALUES (7,6,1,40);

-- aadad (kurikuler_ukmf)
INSERT INTO `kegiatan` (`id`,`nama`,`kategori_id`,`skala_id`,`asal`,`deskripsi`,`tanggal_mulai`,`tanggal_selesai`,`lokasi`,`kuota`,`organisasi_id`,`penyelenggara_ext`,`kurikulum_id`,`dibuat_oleh`,`status`,`created_at`,`email_penyelenggara`,`link_penyelenggara`) VALUES (26,'aadad',9,35,'kurikuler_ukmf','ada','2026-06-27','2026-06-30','adsad',1,18,NULL,3,1,'disetujui',NOW(3),NULL,NULL);
INSERT INTO `partisipasi` (`id`,`kegiatan_id`,`mahasiswa_id`,`status`,`kehadiran`,`peran_verif_id`,`created_at`) VALUES (25,26,4,'hadir',1,28,NOW(3));
INSERT INTO `klaim_poin` (`id`,`partisipasi_id`,`peran_usulan_id`,`status`,`validator_id`,`alasan`,`created_at`) VALUES (8,25,28,'disetujui',1,'Sync dari local: poin internal',NOW(3));
INSERT INTO `perolehan_poin` (`id`,`klaim_poin_id`,`mahasiswa_id`,`kegiatan_id`,`total_poin`,`status`,`created_at`) VALUES (7,8,4,26,30,'sah',NOW(3));
INSERT INTO `perolehan_detail` (`id`,`perolehan_poin_id`,`sub_capaian_id`,`poin`) VALUES (8,7,5,30);

-- udaiyoiw (universitas)
INSERT INTO `kegiatan` (`id`,`nama`,`kategori_id`,`skala_id`,`asal`,`deskripsi`,`tanggal_mulai`,`tanggal_selesai`,`lokasi`,`kuota`,`organisasi_id`,`penyelenggara_ext`,`kurikulum_id`,`dibuat_oleh`,`status`,`created_at`,`email_penyelenggara`,`link_penyelenggara`) VALUES (27,'udaiyoiw',7,25,'universitas','asade','2026-07-30','2026-07-31','qqeqe',1,NULL,'Direktorat Kemahasiswaan UNAND',3,1,'disetujui',NOW(3),NULL,NULL);
INSERT INTO `partisipasi` (`id`,`kegiatan_id`,`mahasiswa_id`,`status`,`kehadiran`,`peran_verif_id`,`created_at`) VALUES (26,27,4,'hadir',1,24,NOW(3));
INSERT INTO `klaim_poin` (`id`,`partisipasi_id`,`peran_usulan_id`,`status`,`validator_id`,`alasan`,`created_at`) VALUES (9,26,24,'disetujui',1,'Sync dari local: poin internal',NOW(3));
INSERT INTO `perolehan_poin` (`id`,`klaim_poin_id`,`mahasiswa_id`,`kegiatan_id`,`total_poin`,`status`,`created_at`) VALUES (8,9,4,27,50,'sah',NOW(3));
INSERT INTO `perolehan_detail` (`id`,`perolehan_poin_id`,`sub_capaian_id`,`poin`) VALUES (9,8,8,50);

-- Lomba IT Nasional lagi (kurikuler_ukmf)
INSERT INTO `kegiatan` (`id`,`nama`,`kategori_id`,`skala_id`,`asal`,`deskripsi`,`tanggal_mulai`,`tanggal_selesai`,`lokasi`,`kuota`,`organisasi_id`,`penyelenggara_ext`,`kurikulum_id`,`dibuat_oleh`,`status`,`created_at`,`email_penyelenggara`,`link_penyelenggara`) VALUES (28,'Lomba IT Nasional lagi',7,27,'kurikuler_ukmf','Kegiatan kompetisi di bidang teknologi informasi yang mencakup pengembangan perangkat lunak, analisis data, dan keamanan siber untuk mengasah kemampuan teknis mahasiswa.','2023-10-01','2023-10-03','Universitas Andalas',100,NULL,NULL,3,1,'disetujui',NOW(3),NULL,NULL);
INSERT INTO `partisipasi` (`id`,`kegiatan_id`,`mahasiswa_id`,`status`,`kehadiran`,`peran_verif_id`,`created_at`) VALUES (27,28,4,'hadir',1,23,NOW(3));
INSERT INTO `klaim_poin` (`id`,`partisipasi_id`,`peran_usulan_id`,`status`,`validator_id`,`alasan`,`created_at`) VALUES (10,27,23,'disetujui',1,'Sync dari local: poin internal',NOW(3));
INSERT INTO `perolehan_poin` (`id`,`klaim_poin_id`,`mahasiswa_id`,`kegiatan_id`,`total_poin`,`status`,`created_at`) VALUES (9,10,4,28,30,'sah',NOW(3));
INSERT INTO `perolehan_detail` (`id`,`perolehan_poin_id`,`sub_capaian_id`,`poin`) VALUES (10,9,11,30);

ALTER TABLE `organisasi` AUTO_INCREMENT = 19;
ALTER TABLE `kegiatan` AUTO_INCREMENT = 29;
ALTER TABLE `partisipasi` AUTO_INCREMENT = 28;
ALTER TABLE `klaim_poin` AUTO_INCREMENT = 11;
ALTER TABLE `perolehan_poin` AUTO_INCREMENT = 10;
ALTER TABLE `perolehan_detail` AUTO_INCREMENT = 11;

COMMIT;

-- Cek hasil:
-- SELECT k.id,k.nama,k.asal,p.kehadiran,kp.status,pp.total_poin FROM partisipasi p JOIN kegiatan k ON k.id=p.kegiatan_id LEFT JOIN klaim_poin kp ON kp.partisipasi_id=p.id LEFT JOIN perolehan_poin pp ON pp.klaim_poin_id=kp.id WHERE p.mahasiswa_id=4 AND k.asal IN ('kurikuler_ukm','kurikuler_ukmf','universitas') ORDER BY k.id;
