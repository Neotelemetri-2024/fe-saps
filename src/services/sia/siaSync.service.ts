/**
 * SIA Sync Service
 * ----------------
 * Sinkronisasi data dari API SIA ke database SAPS menggunakan logika UPSERT.
 * Data dummy tetap aman — hanya ditambah/diperbarui, tidak dihapus.
 *
 * Endpoint SIA yang digunakan:
 *   1. /saps/list-fakultas
 *   2. /saps/list-prodi
 *   3. /saps/list-mahasiswa (Saps: 03)
 *   4. /saps/detail-mahasiswa (Saps: 04, opsional/on-demand)
 *   5. /saps/list-dosen-pa (Saps: 05)
 *   6. /saps/detail-dosen-pa (Saps: 06, opsional/on-demand)
 *   7. /saps/list-kelas-mbkm (Saps: 07, IKU 3 semester berjalan)
 */
import prisma from '../../lib/prisma';
import { siaFetch } from './siaClient.service';
import bcrypt from 'bcryptjs';

// ─── Tipe Response dari API SIA ──────────────────────────────────────────────
interface SiaResponse<T> {
  status: string;
  message: string;
  data: T[];
}

interface SiaFakultas {
  fakId: string;
  fakNama: string;
}

interface SiaProdi {
  prodiKodeDikti?: string;
  prodiNamaDikti?: string;
  prodiJenjangDikti?: string;
  prodiKode?: string;
  prodiNamaResmi?: string;
  prodiNamaJenjang?: string;
  prodiFakKode?: string;
  fakId: string;
  // Fallbacks
  prodiId?: string;
  prodiNama?: string;
  fakNama?: string;
}

interface SiaDosenPA {
  dsnPegNip?: string;
  dosenNip?: string; // fallback
  dsnNidn?: string;
  pegNama?: string;
  dosenNama?: string; // fallback
  pegGelarDepan?: string;
  pegGelarBelakang?: string;
  dsnProdiKode?: string;
  prodiNamaResmi?: string;
  fakKode?: string;
  fakNamaResmi?: string;
  status_pa?: string;
  fakId: string;
  dosenId?: string; // fallback
}

interface SiaMahasiswa {
  mhsNiu?: string; // NIM di SIA (Saps: 03/04)
  mhsNim?: string; // fallback
  mhsNama: string;
  prodiKode?: string;
  prodiNamaResmi?: string;
  prodiNama?: string; // fallback
  fakKode?: string;
  fakNamaResmi?: string;
  mhsAngkatan?: string;
  mhsIpkTranskrip?: string;
  dsnpaPegNip?: string | null; // NIP Dosen PA di SIA
  dsnpaNama?: string | null;
  dosenPaNip?: string | null; // fallback
  fakId: string;
  mhsStatus?: string; // "Aktif", "BSS" (Berhenti Sementara Studi / Cuti), dll.
}

export interface SiaKelasMbkm {
  klsId: string;
  kelas: string;
  mataKuliah: string;
  sks: string;
  nim: string;
  nama: string;
  prodiKode?: string;
  prodiNamaResmi?: string;
  prodiKodeDikti?: string;
  prodi?: string;
  fakKode?: string;
  fakultas?: string;
  fakId?: string;
  fakNamaSumber?: string;
}

// Status mahasiswa yang disinkronisasi ke SAPS (Aktif + BSS/Cuti)
const ALLOWED_MHS_STATUS = ['aktif', 'bss'];

// ─── Tipe Hasil Sinkronisasi ─────────────────────────────────────────────────
export interface SyncResult {
  entity: string;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export interface SyncKelasMbkmResult {
  entity: string;
  semester: string;
  totalKelas: number;
  totalPeserta: number;
  totalSks: number;
  mahasiswaTerdaftarSaps: number;
  mahasiswaBelumAdaSaps: number;
  errors: string[];
}

// ─── Helper: hash password ──────────────────────────────────────────────────
async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

// ─── In-memory Cache Mapping ────────────────────────────────────────────────
const siaFakIdToSapsId = new Map<string, number>();
const siaProdiKodeToSapsId = new Map<string, number>();
const siaDosenNipToSapsUserId = new Map<string, bigint>();

// =============================================================================
// 1. SYNC FAKULTAS (Saps: 01)
// =============================================================================
export async function syncFakultas(): Promise<SyncResult> {
  const result: SyncResult = { entity: 'Fakultas', created: 0, updated: 0, skipped: 0, errors: [] };

  try {
    const response = await siaFetch<SiaResponse<SiaFakultas>>('/saps/list-fakultas');

    if (response.status !== 'success' || !Array.isArray(response.data)) {
      result.errors.push(`Response tidak valid: ${response.message || 'Data bukan array'}`);
      return result;
    }

    for (const fak of response.data) {
      try {
        const nama = (fak.fakNama || '').trim();
        if (!nama) continue;

        const existing = await prisma.fakultas.findFirst({
          where: { nama: { equals: nama } },
        });

        if (existing) {
          siaFakIdToSapsId.set(fak.fakId, existing.id);
          result.skipped++;
        } else {
          const created = await prisma.fakultas.create({
            data: { nama },
          });
          siaFakIdToSapsId.set(fak.fakId, created.id);
          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Fakultas "${fak.fakNama}": ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Fetch error: ${err.message}`);
  }

  console.log(`[SIA Sync] Fakultas — created: ${result.created}, skipped: ${result.skipped}, errors: ${result.errors.length}`);
  return result;
}

// =============================================================================
// 2. SYNC PRODI (Saps: 02)
// =============================================================================
export async function syncProdi(): Promise<SyncResult> {
  const result: SyncResult = { entity: 'ProgramStudi', created: 0, updated: 0, skipped: 0, errors: [] };

  try {
    const response = await siaFetch<SiaResponse<SiaProdi>>('/saps/list-prodi');

    if (response.status !== 'success' || !Array.isArray(response.data)) {
      result.errors.push(`Response tidak valid: ${response.message || 'Data bukan array'}`);
      return result;
    }

    // Pastikan mapping fakultas terisi
    if (siaFakIdToSapsId.size === 0) {
      await syncFakultas();
    }

    for (const prodi of response.data) {
      try {
        const prodiNama = (prodi.prodiNamaResmi || prodi.prodiNamaDikti || prodi.prodiNama || '').trim();
        const prodiKode = (prodi.prodiKode || prodi.prodiKodeDikti || prodi.prodiId || '').trim();

        if (!prodiNama) continue;

        let fakultasId = siaFakIdToSapsId.get(prodi.fakId);
        if (!fakultasId) {
          // Cari fakultas di database
          const fakNama = (prodi.fakNama || '').trim();
          const fak = fakNama ? await prisma.fakultas.findFirst({ where: { nama: fakNama } }) : null;
          if (!fak) {
            result.errors.push(`Prodi "${prodiNama}": Fakultas ID "${prodi.fakId}" tidak ditemukan`);
            continue;
          }
          fakultasId = fak.id;
          siaFakIdToSapsId.set(prodi.fakId, fak.id);
        }

        // Cek apakah sudah ada di DB (unique: fakultasId + nama)
        const existing = await prisma.programStudi.findFirst({
          where: { fakultasId, nama: prodiNama },
        });

        if (existing) {
          if (prodiKode) siaProdiKodeToSapsId.set(prodiKode, existing.id);
          result.skipped++;
        } else {
          const created = await prisma.programStudi.create({
            data: { nama: prodiNama, fakultasId },
          });
          if (prodiKode) siaProdiKodeToSapsId.set(prodiKode, created.id);
          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Prodi "${prodi.prodiNamaResmi || prodi.prodiNama}": ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Fetch error: ${err.message}`);
  }

  console.log(`[SIA Sync] ProgramStudi — created: ${result.created}, skipped: ${result.skipped}, errors: ${result.errors.length}`);
  return result;
}

// =============================================================================
// 3. SYNC DOSEN PA (Saps: 05)
// =============================================================================
export async function syncDosenPA(): Promise<SyncResult> {
  const result: SyncResult = { entity: 'Dosen PA', created: 0, updated: 0, skipped: 0, errors: [] };

  try {
    const response = await siaFetch<SiaResponse<SiaDosenPA>>('/saps/list-dosen-pa');

    if (response.status !== 'success' || !Array.isArray(response.data)) {
      result.errors.push(`Response tidak valid: ${response.message || 'Data bukan array'}`);
      return result;
    }

    // Deduplikasi berdasarkan NIP
    const deduped = new Map<string, SiaDosenPA>();
    for (const d of response.data) {
      const nip = (d.dsnPegNip || d.dosenNip || '').trim();
      if (nip && !deduped.has(nip)) {
        deduped.set(nip, d);
      }
    }

    if (siaFakIdToSapsId.size === 0) {
      await syncFakultas();
    }

    for (const [nip, dosen] of deduped) {
      try {
        const email = `${nip}@dosen.unand.ac.id`;
        const nidn = (dosen.dsnNidn || nip).trim();

        // Susun nama lengkap dengan gelar depan dan belakang jika tersedia
        const gelarDepan = (dosen.pegGelarDepan || '').trim();
        const gelarBelakang = (dosen.pegGelarBelakang || '').trim();
        const namaUtama = (dosen.pegNama || dosen.dosenNama || '').trim();

        let namaLengkap = namaUtama;
        if (gelarDepan) namaLengkap = `${gelarDepan} ${namaLengkap}`;
        if (gelarBelakang) namaLengkap = `${namaLengkap}, ${gelarBelakang}`;

        let fakultasId = siaFakIdToSapsId.get(dosen.fakId) || null;
        if (!fakultasId && dosen.fakNamaResmi) {
          const fak = await prisma.fakultas.findFirst({
            where: { nama: { contains: dosen.fakNamaResmi } },
          });
          if (fak) fakultasId = fak.id;
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
          if (existingUser.nama !== namaLengkap) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { nama: namaLengkap },
            });
            result.updated++;
          } else {
            result.skipped++;
          }

          const existingDosen = await prisma.dosen.findUnique({ where: { userId: existingUser.id } });
          if (!existingDosen) {
            await prisma.dosen.create({
              data: { userId: existingUser.id, nidn, fakultasId },
            });
          } else if (existingDosen.fakultasId !== fakultasId || existingDosen.nidn !== nidn) {
            await prisma.dosen.update({
              where: { userId: existingUser.id },
              data: { fakultasId, nidn },
            });
          }

          siaDosenNipToSapsUserId.set(nip, existingUser.id);
        } else {
          const passwordHash = await hashPassword(`Unand#${nip}`);
          const newUser = await prisma.user.create({
            data: {
              nama: namaLengkap,
              email,
              passwordHash,
              peran: 'dosen',
            },
          });

          await prisma.dosen.create({
            data: { userId: newUser.id, nidn, fakultasId },
          });

          siaDosenNipToSapsUserId.set(nip, newUser.id);
          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Dosen NIP ${nip}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Fetch error: ${err.message}`);
  }

  console.log(`[SIA Sync] Dosen PA — created: ${result.created}, updated: ${result.updated}, skipped: ${result.skipped}, errors: ${result.errors.length}`);
  return result;
}

// =============================================================================
// 4. SYNC MAHASISWA (Saps: 03) — Filter Status Aktif & BSS
// =============================================================================
export async function syncMahasiswa(): Promise<SyncResult> {
  const result: SyncResult = { entity: 'Mahasiswa', created: 0, updated: 0, skipped: 0, errors: [] };

  try {
    const response = await siaFetch<SiaResponse<SiaMahasiswa>>('/saps/list-mahasiswa');

    if (response.status !== 'success' || !Array.isArray(response.data)) {
      result.errors.push(`Response tidak valid: ${response.message || 'Data bukan array'}`);
      return result;
    }

    // Filter status mahasiswa: jika mhsStatus disediakan, hanya terima "aktif" dan "bss"
    const filtered = response.data.filter(m => {
      if (!m.mhsStatus) return true; // Jika dari SIA belum ada kolom status pada data testing, jangan buang
      return ALLOWED_MHS_STATUS.includes(m.mhsStatus.trim().toLowerCase());
    });

    console.log(`[SIA Sync] Mahasiswa: ${response.data.length} total → ${filtered.length} setelah filter (Aktif + BSS)`);

    // Deduplikasi berdasarkan NIM (mhsNiu di SIA atau mhsNim)
    const deduped = new Map<string, SiaMahasiswa>();
    for (const m of filtered) {
      const nim = (m.mhsNiu || m.mhsNim || '').trim();
      if (nim && !deduped.has(nim)) {
        deduped.set(nim, m);
      }
    }

    if (siaProdiKodeToSapsId.size === 0) {
      await syncProdi();
    }

    for (const [nim, mhs] of deduped) {
      try {
        const prodiKode = (mhs.prodiKode || '').trim();
        const prodiNama = (mhs.prodiNamaResmi || mhs.prodiNama || '').trim();

        let prodiId = siaProdiKodeToSapsId.get(prodiKode);
        if (!prodiId && prodiNama) {
          const prodi = await prisma.programStudi.findFirst({
            where: { nama: { contains: prodiNama } },
          });
          if (prodi) prodiId = prodi.id;
        }

        if (!prodiId) {
          result.errors.push(`Mahasiswa "${mhs.mhsNama}" (NIM: ${nim}): Prodi "${prodiNama || prodiKode}" tidak ditemukan`);
          continue;
        }

        const email = `${nim}@student.unand.ac.id`;
        const angkatan = parseInt(mhs.mhsAngkatan || '', 10) || null;

        // Cari Dosen PA jika ada NIP dosen PA
        const dosenPaNip = (mhs.dsnpaPegNip || mhs.dosenPaNip || '').trim();
        let dosenPaId: bigint | null = null;

        if (dosenPaNip) {
          if (siaDosenNipToSapsUserId.has(dosenPaNip)) {
            dosenPaId = siaDosenNipToSapsUserId.get(dosenPaNip)!;
          } else {
            const dosenUser = await prisma.user.findUnique({
              where: { email: `${dosenPaNip}@dosen.unand.ac.id` },
            });
            if (dosenUser) {
              dosenPaId = dosenUser.id;
              siaDosenNipToSapsUserId.set(dosenPaNip, dosenUser.id);
            }
          }
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });

        if (existingUser) {
          if (existingUser.nama !== mhs.mhsNama) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { nama: mhs.mhsNama },
            });
          }

          const existingMhs = await prisma.mahasiswa.findUnique({ where: { userId: existingUser.id } });
          if (!existingMhs) {
            await prisma.mahasiswa.create({
              data: { userId: existingUser.id, nim, prodiId, angkatan, dosenPaId },
            });
          } else {
            await prisma.mahasiswa.update({
              where: { userId: existingUser.id },
              data: { prodiId, angkatan, dosenPaId },
            });
          }

          result.updated++;
        } else {
          const passwordHash = await hashPassword(`Unand#${nim}`);
          const newUser = await prisma.user.create({
            data: {
              nama: mhs.mhsNama,
              email,
              passwordHash,
              peran: 'mahasiswa',
            },
          });

          await prisma.mahasiswa.create({
            data: { userId: newUser.id, nim, prodiId, angkatan, dosenPaId },
          });

          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Mahasiswa "${mhs.mhsNama}" (NIM: ${nim}): ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Fetch error: ${err.message}`);
  }

  console.log(`[SIA Sync] Mahasiswa — created: ${result.created}, updated: ${result.updated}, skipped: ${result.skipped}, errors: ${result.errors.length}`);
  return result;
}

// =============================================================================
// 5. SYNC KELAS MBKM (Saps: 07) — Mengambil Data Kelas MBKM per Semester
// =============================================================================
export async function syncKelasMbkm(klsSemId?: string): Promise<SyncKelasMbkmResult> {
  const currentSemester = klsSemId || `${new Date().getFullYear()}${new Date().getMonth() >= 6 ? '1' : '2'}`;
  const result: SyncKelasMbkmResult = {
    entity: 'Kelas MBKM',
    semester: currentSemester,
    totalKelas: 0,
    totalPeserta: 0,
    totalSks: 0,
    mahasiswaTerdaftarSaps: 0,
    mahasiswaBelumAdaSaps: 0,
    errors: [],
  };

  try {
    console.log(`[SIA Sync] Menarik daftar kelas MBKM untuk semester ${currentSemester}...`);
    const response = await siaFetch<SiaResponse<SiaKelasMbkm>>('/saps/list-kelas-mbkm', {
      klsSemId: currentSemester,
    });

    if (response.status !== 'success' || !Array.isArray(response.data)) {
      result.errors.push(`Response tidak valid: ${response.message || 'Data bukan array'}`);
      return result;
    }

    result.totalPeserta = response.data.length;

    const uniqueClasses = new Set<string>();
    const uniqueStudents = new Set<string>();
    let sumSks = 0;

    for (const item of response.data) {
      if (item.klsId) uniqueClasses.add(item.klsId);
      if (item.nim) uniqueStudents.add(item.nim.trim());
      const sks = parseInt(item.sks || '0', 10);
      if (!isNaN(sks)) sumSks += sks;
    }

    result.totalKelas = uniqueClasses.size;
    result.totalSks = sumSks;

    // Cek berapa mahasiswa yang sudah ada di database SAPS
    if (uniqueStudents.size > 0) {
      const studentNims = Array.from(uniqueStudents);
      const matchedMhs = await prisma.mahasiswa.findMany({
        where: { nim: { in: studentNims } },
        select: { nim: true },
      });

      result.mahasiswaTerdaftarSaps = matchedMhs.length;
      result.mahasiswaBelumAdaSaps = uniqueStudents.size - matchedMhs.length;
    }

    console.log(
      `[SIA Sync] Kelas MBKM Semester ${currentSemester}: ${result.totalKelas} kelas, ${result.totalPeserta} peserta (${result.mahasiswaTerdaftarSaps} terdaftar di SAPS).`,
    );
  } catch (err: any) {
    result.errors.push(`Fetch error: ${err.message}`);
  }

  return result;
}

// =============================================================================
// 6. SYNC ALL (Berurutan: Fakultas → Prodi → Dosen → Mahasiswa → Kelas MBKM)
// =============================================================================
export async function syncAll(klsSemId?: string): Promise<(SyncResult | SyncKelasMbkmResult)[]> {
  console.log('[SIA Sync] ═══════════════════════════════════════════════════');
  console.log('[SIA Sync] Memulai sinkronisasi penuh dari API SIA...');
  console.log('[SIA Sync] ═══════════════════════════════════════════════════');

  const results: (SyncResult | SyncKelasMbkmResult)[] = [];

  results.push(await syncFakultas());
  results.push(await syncProdi());
  results.push(await syncDosenPA());
  results.push(await syncMahasiswa());
  results.push(await syncKelasMbkm(klsSemId));

  console.log('[SIA Sync] ═══════════════════════════════════════════════════');
  console.log('[SIA Sync] Sinkronisasi selesai!');
  console.log('[SIA Sync] ═══════════════════════════════════════════════════');

  return results;
}

// =============================================================================
// 7. CLEANUP DUMMY DATA (Hapus data dummy, kecuali akun Pimpinan Ditmawa)
// =============================================================================
export async function cleanupDummyData(): Promise<{
  deleted: Record<string, number>;
  preserved: string[];
}> {
  console.log('[SIA Cleanup] Memulai pembersihan data dummy...');

  // Cari semua staff pimpinan_ditmawa & pimpinan_utama → user IDs yang DIPERTAHANKAN
  const preservedStaff = await prisma.staff.findMany({
    where: { jabatan: { in: ['pimpinan_ditmawa', 'pimpinan_utama'] } },
    select: { userId: true, jabatan: true, user: { select: { nama: true, email: true } } },
  });
  const preservedUserIds = preservedStaff.map(s => s.userId);
  const preservedNames = preservedStaff.map(s => `${s.user.nama} (${s.jabatan})`);

  console.log(`[SIA Cleanup] Mempertahankan ${preservedUserIds.length} akun: ${preservedNames.join(', ')}`);

  const deleted: Record<string, number> = {};

  // Hapus data transaksional terlebih dahulu (child tables)
  const tablesToTruncate = [
    'auditLog',
    'notifikasi',
    'saranPA',
    'cvGenerated',
  ] as const;

  for (const table of tablesToTruncate) {
    const count = await (prisma[table] as any).deleteMany({});
    deleted[table] = count.count;
  }

  // Hapus perolehan detail → perolehan poin (berurutan karena FK)
  deleted['perolehanDetail'] = (await prisma.perolehanDetail.deleteMany({})).count;
  deleted['perolehanPoin'] = (await prisma.perolehanPoin.deleteMany({})).count;

  // Hapus klaim & bukti
  deleted['bukti'] = (await prisma.bukti.deleteMany({})).count;
  deleted['klaimPoin'] = (await prisma.klaimPoin.deleteMany({})).count;

  // Hapus izin PA
  deleted['izinPA'] = (await prisma.izinPA.deleteMany({})).count;

  // Hapus partisipasi
  deleted['partisipasi'] = (await prisma.partisipasi.deleteMany({})).count;

  // Hapus kegiatan approval → kegiatan
  deleted['kegiatanApproval'] = (await prisma.kegiatanApproval.deleteMany({})).count;
  deleted['kegiatan'] = (await prisma.kegiatan.deleteMany({})).count;

  // Hapus operator organisasi
  deleted['organisasiOperator'] = (await prisma.organisasiOperator.deleteMany({})).count;

  // Hapus profil mahasiswa
  deleted['mahasiswa'] = (await prisma.mahasiswa.deleteMany({})).count;

  // Hapus profil dosen
  deleted['dosen'] = (await prisma.dosen.deleteMany({})).count;

  // Hapus profil staff KECUALI yang dipertahankan
  deleted['staff'] = (await prisma.staff.deleteMany({
    where: { userId: { notIn: preservedUserIds } },
  })).count;

  // Hapus user KECUALI yang dipertahankan
  deleted['users'] = (await prisma.user.deleteMany({
    where: { id: { notIn: preservedUserIds } },
  })).count;

  console.log('[SIA Cleanup] Pembersihan selesai!');
  for (const [table, count] of Object.entries(deleted)) {
    if (count > 0) console.log(`  ${table}: ${count} record dihapus`);
  }

  return { deleted, preserved: preservedNames };
}
