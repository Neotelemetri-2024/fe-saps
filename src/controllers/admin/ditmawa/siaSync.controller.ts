/**
 * SIA Sync Controller
 * -------------------
 * Endpoint untuk admin/pimpinan Ditmawa memicu sinkronisasi data dari API SIA.
 */
import { Request, Response } from 'express';
import {
  syncFakultas,
  syncProdi,
  syncDosenPA,
  syncMahasiswa,
  syncKelasMbkm,
  syncAll,
  cleanupDummyData,
} from '../../../services/sia/siaSync.service';

/**
 * POST /api/umum/sia/sync
 * Menjalankan sinkronisasi penuh (Fakultas → Prodi → Dosen → Mahasiswa → Kelas MBKM).
 */
export const siaSyncAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { klsSemId } = req.body || {};
    const results = await syncAll(klsSemId);

    res.json({
      success: true,
      message: 'Sinkronisasi data master dari SIA selesai.',
      data: results,
    });
  } catch (err: any) {
    console.error('[SIA Sync Controller]', err);
    res.status(500).json({
      success: false,
      message: `Gagal sinkronisasi: ${err.message}`,
    });
  }
};

/**
 * POST /api/umum/sia/sync/fakultas
 * Sinkronisasi Fakultas saja.
 */
export const siaSyncFakultas = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await syncFakultas();
    res.json({ success: true, message: 'Sinkronisasi Fakultas selesai.', data: result });
  } catch (err: any) {
    console.error('[SIA Sync Controller]', err);
    res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
  }
};

/**
 * POST /api/umum/sia/sync/prodi
 * Sinkronisasi Program Studi saja.
 */
export const siaSyncProdi = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await syncProdi();
    res.json({ success: true, message: 'Sinkronisasi Program Studi selesai.', data: result });
  } catch (err: any) {
    console.error('[SIA Sync Controller]', err);
    res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
  }
};

/**
 * POST /api/umum/sia/sync/dosen
 * Sinkronisasi Dosen PA saja.
 */
export const siaSyncDosenPA = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await syncDosenPA();
    res.json({ success: true, message: 'Sinkronisasi Dosen PA selesai.', data: result });
  } catch (err: any) {
    console.error('[SIA Sync Controller]', err);
    res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
  }
};

/**
 * POST /api/umum/sia/sync/mahasiswa
 * Sinkronisasi Mahasiswa saja.
 */
export const siaSyncMahasiswa = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await syncMahasiswa();
    res.json({ success: true, message: 'Sinkronisasi Mahasiswa selesai.', data: result });
  } catch (err: any) {
    console.error('[SIA Sync Controller]', err);
    res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
  }
};

/**
 * POST /api/umum/sia/sync/kelas-mbkm
 * Sinkronisasi Kelas MBKM berdasarkan semester (klsSemId).
 */
export const siaSyncKelasMbkm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { klsSemId } = req.body || {};
    const result = await syncKelasMbkm(klsSemId);
    res.json({
      success: true,
      message: `Sinkronisasi Kelas MBKM selesai (Semester ${result.semester}).`,
      data: result,
    });
  } catch (err: any) {
    console.error('[SIA Sync Controller]', err);
    res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
  }
};

/**
 * POST /api/umum/sia/cleanup
 * Menghapus data dummy, mempertahankan akun Pimpinan Ditmawa & Pimpinan Utama.
 */
export const siaCleanup = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await cleanupDummyData();
    res.json({
      success: true,
      message: `Pembersihan selesai. Akun yang dipertahankan: ${result.preserved.join(', ')}`,
      data: result,
    });
  } catch (err: any) {
    console.error('[SIA Cleanup Controller]', err);
    res.status(500).json({ success: false, message: `Gagal: ${err.message}` });
  }
};
