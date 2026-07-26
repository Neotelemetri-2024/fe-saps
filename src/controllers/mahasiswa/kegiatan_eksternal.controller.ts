import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

// ─── helpers ─────────────────────────────────────────────────────────────────

function mapStatus(status: string): string {
  if (status === 'draft') return 'Draft';
  if (status === 'diajukan') return 'Pending';
  if (status === 'terverifikasi') return 'Diteruskan';
  if (status === 'disetujui' || status === 'terpublikasi') return 'Disetujui';
  if (status === 'ditolak') return 'Ditolak';
  if (status === 'perlu_revisi') return 'Revisi';
  return 'Pending';
}

async function requireMahasiswaUser(req: Request, res: Response): Promise<BigInt | null> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }
  return BigInt(userId);
}

async function requireKurikulumAktif(res: Response): Promise<{ id: number } | null> {
  const kur = await prisma.kurikulum.findFirst({ where: { status: 'aktif' } });
  if (!kur) {
    res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif' });
    return null;
  }
  return kur;
}

// ─── 1. Simpan sebagai Draft ──────────────────────────────────────────────────
export const simpanDraftKegiatanEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdBig = await requireMahasiswaUser(req, res);
    if (!userIdBig) return;

    const { kategoriId, namaKegiatan, penyelenggara, skalaId, tanggalPelaksanaan, deskripsi, linkWebsite, emailPenyelenggara } = req.body;

    const kur = await requireKurikulumAktif(res);
    if (!kur) return;

    const kegiatan = await prisma.kegiatan.create({
      data: {
        nama: namaKegiatan || '(draft)',
        kategoriId: kategoriId ? parseInt(kategoriId) : undefined,
        skalaId: skalaId ? parseInt(skalaId) : undefined,
        asal: 'eksternal',
        tanggalMulai: tanggalPelaksanaan ? new Date(tanggalPelaksanaan) : new Date(),
        tanggalSelesai: tanggalPelaksanaan ? new Date(tanggalPelaksanaan) : new Date(),
        penyelenggaraExt: penyelenggara || null,
        deskripsi: deskripsi || null,
        linkPenyelenggara: linkWebsite || null,
        emailPenyelenggara: emailPenyelenggara || null,
        kurikulumId: kur.id,
        dibuatOleh: userIdBig,
        status: 'draft',
      },
      include: {
        kategori: { select: { nama: true } },
        skala: { select: { nama: true } },
      }
    });

    res.status(201).json({
      success: true,
      message: 'Draft tersimpan',
      data: {
        id: kegiatan.id.toString(),
        namaKegiatan: kegiatan.nama,
        jenisKegiatan: kegiatan.kategori?.nama || null,
        penyelenggara: kegiatan.penyelenggaraExt,
        tanggalPelaksanaan: kegiatan.tanggalMulai,
        skala: kegiatan.skala?.nama || null,
        status: 'Draft',
        kategoriId: kegiatan.kategoriId,
        skalaId: kegiatan.skalaId,
        deskripsi: kegiatan.deskripsi,
        linkWebsite: kegiatan.linkPenyelenggara,
        emailPenyelenggara: kegiatan.emailPenyelenggara,
      }
    });
  } catch (error: any) {
    next(error);
  }
};

// ─── 2. Edit Draft ───────────────────────────────────────────────────────────
export const editDraftKegiatanEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdBig = await requireMahasiswaUser(req, res);
    if (!userIdBig) return;

    const { id } = req.params;
    const { kategoriId, namaKegiatan, penyelenggara, skalaId, tanggalPelaksanaan, deskripsi, linkWebsite, emailPenyelenggara } = req.body;

    const existing = await prisma.kegiatan.findFirst({
      where: { id: parseInt(id), dibuatOleh: userIdBig, asal: 'eksternal' }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
    }
    if (existing.status !== 'draft' && existing.status !== 'perlu_revisi') {
      return res.status(400).json({ success: false, message: 'Hanya draft atau kegiatan yang perlu revisi yang dapat diedit' });
    }

    const updated = await prisma.kegiatan.update({
      where: { id: parseInt(id) },
      data: {
        nama: namaKegiatan ?? existing.nama,
        kategoriId: kategoriId ? parseInt(kategoriId) : existing.kategoriId,
        skalaId: skalaId ? parseInt(skalaId) : existing.skalaId,
        tanggalMulai: tanggalPelaksanaan ? new Date(tanggalPelaksanaan) : existing.tanggalMulai,
        tanggalSelesai: tanggalPelaksanaan ? new Date(tanggalPelaksanaan) : existing.tanggalSelesai,
        penyelenggaraExt: penyelenggara ?? existing.penyelenggaraExt,
        deskripsi: deskripsi ?? existing.deskripsi,
        linkPenyelenggara: linkWebsite ?? existing.linkPenyelenggara,
        emailPenyelenggara: emailPenyelenggara ?? existing.emailPenyelenggara,
      },
      include: {
        kategori: { select: { nama: true } },
        skala: { select: { nama: true } },
      }
    });

    res.json({
      success: true,
      message: 'Draft diperbarui',
      data: {
        id: updated.id.toString(),
        namaKegiatan: updated.nama,
        jenisKegiatan: updated.kategori?.nama || null,
        penyelenggara: updated.penyelenggaraExt,
        tanggalPelaksanaan: updated.tanggalMulai,
        skala: updated.skala?.nama || null,
        status: 'Draft',
        kategoriId: updated.kategoriId,
        skalaId: updated.skalaId,
        deskripsi: updated.deskripsi,
        linkWebsite: updated.linkPenyelenggara,
        emailPenyelenggara: updated.emailPenyelenggara,
      }
    });
  } catch (error: any) {
    next(error);
  }
};

// ─── 3. Hapus Draft ──────────────────────────────────────────────────────────
export const hapusDraftKegiatanEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdBig = await requireMahasiswaUser(req, res);
    if (!userIdBig) return;

    const { id } = req.params;

    const existing = await prisma.kegiatan.findFirst({
      where: { id: parseInt(id), dibuatOleh: userIdBig, asal: 'eksternal' }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
    }
    if (existing.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Hanya draft yang dapat dihapus' });
    }

    await prisma.kegiatan.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: 'Draft dihapus' });
  } catch (error: any) {
    next(error);
  }
};

// ─── 4. Ajukan Draft (draft → diajukan) ─────────────────────────────────────
export const ajukanDraftKegiatanEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdBig = await requireMahasiswaUser(req, res);
    if (!userIdBig) return;

    const { id } = req.params;

    const existing = await prisma.kegiatan.findFirst({
      where: { id: parseInt(id), dibuatOleh: userIdBig, asal: 'eksternal' }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
    }
    if (existing.status !== 'draft' && existing.status !== 'perlu_revisi') {
      return res.status(400).json({ success: false, message: 'Hanya draft atau kegiatan yang perlu revisi yang dapat diajukan' });
    }
    if (!existing.kategoriId || !existing.skalaId || !existing.nama || existing.nama === '(draft)') {
      return res.status(400).json({ success: false, message: 'Lengkapi data kegiatan sebelum mengajukan' });
    }

    const updated = await prisma.kegiatan.update({
      where: { id: parseInt(id) },
      data: { status: 'diajukan' }
    });

    res.json({
      success: true,
      message: 'Kegiatan berhasil diajukan',
      data: { id: updated.id.toString(), status: 'Pending' }
    });
  } catch (error: any) {
    next(error);
  }
};

// ─── 5. Ajukan Kegiatan Baru (langsung kirim) ────────────────────────────────
export const ajukanKegiatanEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdBig = await requireMahasiswaUser(req, res);
    if (!userIdBig) return;

    const { kategoriId, namaKegiatan, penyelenggara, skalaId, tanggalPelaksanaan, deskripsi, linkWebsite, emailPenyelenggara } = req.body;

    if (!kategoriId || !namaKegiatan || !penyelenggara || !tanggalPelaksanaan || !skalaId) {
      return res.status(400).json({ success: false, message: 'Harap isi semua kolom wajib' });
    }

    const kur = await requireKurikulumAktif(res);
    if (!kur) return;

    const kegiatan = await prisma.kegiatan.create({
      data: {
        nama: namaKegiatan,
        kategoriId: parseInt(kategoriId),
        skalaId: parseInt(skalaId),
        asal: 'eksternal',
        tanggalMulai: new Date(tanggalPelaksanaan),
        tanggalSelesai: new Date(tanggalPelaksanaan),
        penyelenggaraExt: penyelenggara,
        deskripsi: deskripsi,
        linkPenyelenggara: linkWebsite,
        emailPenyelenggara: emailPenyelenggara,
        kurikulumId: kur.id,
        dibuatOleh: userIdBig,
        status: 'diajukan',
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pengajuan kegiatan berhasil dikirim',
      data: { kegiatanId: kegiatan.id.toString() }
    });
  } catch (error: any) {
    next(error);
  }
};

// ─── 6. Riwayat Pengajuan (termasuk draft) ───────────────────────────────────
export const getRiwayatPengajuan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdBig = await requireMahasiswaUser(req, res);
    if (!userIdBig) return;

    const data = await prisma.kegiatan.findMany({
      where: { dibuatOleh: userIdBig, asal: 'eksternal' },
      include: {
        kategori: { select: { id: true, nama: true } },
        skala: { select: { id: true, nama: true } },
        kegiatanApproval: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = data.map((k) => {
      const lastApproval = k.kegiatanApproval[0];
      return {
        id: k.id.toString(),
        namaKegiatan: k.nama,
        jenisKegiatan: k.kategori?.nama || null,
        penyelenggara: k.penyelenggaraExt || null,
        tanggalPelaksanaan: k.tanggalMulai,
        skala: k.skala?.nama || null,
        status: mapStatus(k.status),
        // field asli untuk keperluan edit draft
        isDraft: k.status === 'draft',
        kategoriId: k.kategori?.id || null,
        skalaId: k.skala?.id || null,
        deskripsi: k.deskripsi || null,
        linkWebsite: k.linkPenyelenggara || null,
        emailPenyelenggara: k.emailPenyelenggara || null,
        alasan: lastApproval?.alasan || null,
        tanggalPengajuan: k.createdAt
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    next(error);
  }
};
