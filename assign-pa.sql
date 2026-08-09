-- Mengaitkan semua mahasiswa yang belum punya Dosen PA ke Dr. Ahmad Rivai
UPDATE mahasiswa 
SET dosen_pa_id = (SELECT id FROM users WHERE email = 'ahmad.rivai@unand.ac.id' LIMIT 1)
WHERE dosen_pa_id IS NULL;
