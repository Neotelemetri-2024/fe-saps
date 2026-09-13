import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { resolveKurikulumMahasiswa, CurriculumResolutionError } from '../../services/kurikulumResolver.service';

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

async function requireMahasiswaUser(req: Request, res: Response): Promise<bigint | null> {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return null;
  }
  return BigInt(userId);
}

async function requireKurikulumMahasiswa(userId: bigint, res: Response): Promise<{ id: number } | null> {
  try {
    const kur = await resolveKurikulumMahasiswa(userId, prisma, { includeStructure: false });
    return kur;
  } catch (err) {
    if (err instanceof CurriculumResolutionError) {
      res.status(400).json({ success: false, message: err.message });
      return null;
    }
    throw err;
  }
}

//1. Simpan sebagai Draft
export const simpanDraftKegiatanEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdBig = await requireMahasiswaUser(req, res);
    if (!userIdBig) return;

    const { kategoriId, namaKegiatan, penyelenggara, skalaId, tanggalPelaksanaan, deskripsi, linkWebsite, emailPenyelenggara } = req.body;

    const kur = await requireKurikulumMahasiswa(userIdBig, res);
    if (!kur) return;

    const kegiatan = await prisma.kegiatan.create({
      data: {
        nama: namaKegiatan || '(draft)',
        kategoriId: kategoriId ? parseInt(kategoriId) : (undefined as any),
        skalaId: skalaId ? parseInt(skalaId) : (undefined as any),
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
      where: { id: parseInt(id as string), dibuatOleh: userIdBig, asal: 'eksternal' }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
    }
    if (existing.status !== 'draft' && existing.status !== 'perlu_revisi') {
      return res.status(400).json({ success: false, message: 'Hanya draft atau kegiatan yang perlu revisi yang dapat diedit' });
    }

    const updated = await prisma.kegiatan.update({
      where: { id: parseInt(id as string) },
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

//3. Hapus Draft 
export const hapusDraftKegiatanEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userIdBig = await requireMahasiswaUser(req, res);
    if (!userIdBig) return;

    const { id } = req.params;

    const existing = await prisma.kegiatan.findFirst({
      where: { id: parseInt(id as string), dibuatOleh: userIdBig, asal: 'eksternal', deletedAt: null }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan' });
    }
    if (existing.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Hanya draft yang dapat dihapus' });
    }

    await prisma.kegiatan.update({
      where: { id: parseInt(id as string) },
      data: { deletedAt: new Date(), status: 'dibatalkan' },
    });

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
      where: { id: parseInt(id as string), dibuatOleh: userIdBig, asal: 'eksternal' }
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
      where: { id: parseInt(id as string) },
      data: { status: 'diajukan' }
    });

    // Pastikan partisipasi mahasiswa tercatat
    const partExists = await prisma.partisipasi.findFirst({
      where: { kegiatanId: updated.id, mahasiswaId: userIdBig },
    });
    if (!partExists) {
      await prisma.partisipasi.create({
        data: {
          kegiatanId: updated.id,
          mahasiswaId: userIdBig,
          status: 'terdaftar',
        },
      });
    }

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

    const {
      kategoriId,
      namaKegiatan,
      penyelenggara,
      skalaId,
      tanggalPelaksanaan,
      deskripsi,
      linkWebsite,
      emailPenyelenggara,
      forceNew,
      existingKegiatanId,
    } = req.body;

    // ─── Kasus A: Menggunakan Kegiatan yang Sudah Terdaftar (Join Existing) ───
    if (existingKegiatanId) {
      const existing = await prisma.kegiatan.findUnique({
        where: { id: parseInt(String(existingKegiatanId)) },
        include: {
          partisipasi: { where: { mahasiswaId: userIdBig } },
        },
      });

      if (!existing) {
        return res.status(404).json({ success: false, message: 'Kegiatan terdaftar tidak ditemukan.' });
      }

      if (existing.partisipasi && existing.partisipasi.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Anda sudah terdaftar dalam kegiatan ini. Silakan periksa Riwayat Pengajuan / Izin PA Anda.',
        });
      }

      // Daftarkan mahasiswa ke kegiatan yang sudah ada
      await prisma.partisipasi.create({
        data: {
          kegiatanId: existing.id,
          mahasiswaId: userIdBig,
          status: 'terdaftar',
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Berhasil bergabung dengan kegiatan terdaftar!',
        data: { kegiatanId: existing.id.toString(), reused: true },
      });
    }

    if (!kategoriId || !namaKegiatan || !penyelenggara || !tanggalPelaksanaan || !skalaId) {
      return res.status(400).json({ success: false, message: 'Harap isi semua kolom wajib' });
    }

    const kur = await requireKurikulumMahasiswa(userIdBig, res);
    if (!kur) return;

    const cleanNama = String(namaKegiatan).trim();
    const cleanPenyelenggara = String(penyelenggara).trim();
    const targetDate = new Date(tanggalPelaksanaan);
    const targetYear = targetDate.getFullYear();

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // ─── Kasus B (Hard Block): Mahasiswa yang Sama Mengajukan Ulang di Tahun yang Sama ───
    const ownExisting = await prisma.kegiatan.findFirst({
      where: {
        dibuatOleh: userIdBig,
        asal: 'eksternal',
        deletedAt: null,
        status: { notIn: ['dibatalkan', 'ditolak'] },
        tanggalMulai: {
          gte: startOfYear,
          lte: endOfYear,
        },
        OR: [
          { nama: { equals: cleanNama } },
          { nama: { contains: cleanNama } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (ownExisting) {
      const tglFormatted = ownExisting.tanggalMulai
        ? new Date(ownExisting.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : '-';
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_OWN_SUBMISSION',
        message: `Anda sudah pernah mengajukan kegiatan "${ownExisting.nama}" untuk periode ${targetYear} pada tanggal ${tglFormatted} (Status: ${mapStatus(ownExisting.status)}). Tidak dapat mengajukan kegiatan yang sama berulang kali.`,
      });
    }

    // ─── Kasus C (Soft Warning): Kegiatan Serupa Pernah Diajukan Mahasiswa Lain ───
    if (!forceNew) {
      const similarKegiatan = await prisma.kegiatan.findFirst({
        where: {
          asal: 'eksternal',
          deletedAt: null,
          status: { in: ['diajukan', 'terverifikasi', 'disetujui', 'terpublikasi'] },
          tanggalMulai: {
            gte: startOfYear,
            lte: endOfYear,
          },
          OR: [
            { nama: { equals: cleanNama } },
            { nama: { contains: cleanNama } },
          ],
        },
        include: {
          kategori: { select: { id: true, nama: true } },
          skala: { select: { id: true, nama: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (similarKegiatan) {
        return res.status(409).json({
          success: false,
          code: 'SIMILAR_ACTIVITY_EXISTS',
          message: `Kegiatan serupa sudah pernah diajukan sebelumnya di tahun ${targetYear}: "${similarKegiatan.nama}" (${similarKegiatan.penyelenggaraExt || '-'}).`,
          data: {
            existingKegiatan: {
              id: similarKegiatan.id,
              nama: similarKegiatan.nama,
              penyelenggara: similarKegiatan.penyelenggaraExt,
              skalaId: similarKegiatan.skalaId,
              skalaNama: similarKegiatan.skala?.nama,
              kategoriId: similarKegiatan.kategoriId,
              kategoriNama: similarKegiatan.kategori?.nama,
              tanggalPelaksanaan: similarKegiatan.tanggalMulai,
              tahun: targetYear,
              status: mapStatus(similarKegiatan.status),
            },
          },
        });
      }
    }

    // ─── Kasus D: Buat Kegiatan Baru ───
    const kegiatan = await prisma.kegiatan.create({
      data: {
        nama: cleanNama,
        kategoriId: parseInt(kategoriId),
        skalaId: parseInt(skalaId),
        asal: 'eksternal',
        tanggalMulai: targetDate,
        tanggalSelesai: targetDate,
        penyelenggaraExt: cleanPenyelenggara,
        deskripsi: deskripsi || null,
        linkPenyelenggara: linkWebsite || null,
        emailPenyelenggara: emailPenyelenggara || null,
        kurikulumId: kur.id,
        dibuatOleh: userIdBig,
        status: 'diajukan',
      },
    });

    // Otomatis daftarkan pembuat kegiatan ke tabel partisipasi
    await prisma.partisipasi.create({
      data: {
        kegiatanId: kegiatan.id,
        mahasiswaId: userIdBig,
        status: 'terdaftar',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Pengajuan kegiatan berhasil dikirim',
      data: { kegiatanId: kegiatan.id.toString() },
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
        kegiatanApproval: { orderBy: { createdAt: 'desc' }, take: 1 },
        partisipasi: {
          where: { mahasiswaId: userIdBig },
          include: {
            izinPA: { orderBy: { createdAt: 'desc' }, take: 1 },
            klaimPoin: true,
          },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = data.map((k) => {
      const lastApproval = k.kegiatanApproval[0];
      const partisipasi = (k as any).partisipasi?.[0];
      const lastIzinPA = partisipasi?.izinPA?.[0];
      const klaimPoin = partisipasi?.klaimPoin;

      // sudahAjukanPA: ada IzinPA aktif (bukan ditolak)
      const sudahAjukanPA = lastIzinPA
        ? lastIzinPA.status !== 'ditolak'
        : false;

      // sudahKlaim: ada KlaimPoin yang sudah bukan draft
      const sudahKlaim = klaimPoin
        ? klaimPoin.status !== 'draft'
        : false;

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
        tanggalPengajuan: k.createdAt,
        sudahAjukanPA,
        sudahKlaim,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    next(error);
  }
};


// 7. Mengambil Daftar Kegiatan Eksternal yang Sudah Terdaftar (untuk Autocomplete & Katalog)
export const getKegiatanEksternalTerdaftar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, allStatus } = req.query;
    const allowedStatuses = allStatus === 'true' || allStatus === '1'
      ? ['diajukan', 'terverifikasi', 'disetujui', 'terpublikasi']
      : ['disetujui', 'terpublikasi'];

    const where: any = {
      asal: 'eksternal',
      status: { in: allowedStatuses },
      deletedAt: null,
    };

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { nama: { contains: q } },
        { penyelenggaraExt: { contains: q } },
      ];
    }

    const data = await prisma.kegiatan.findMany({
      where,
      include: {
        kategori: { select: { id: true, nama: true } },
        skala: { select: { id: true, nama: true } },
      },
      orderBy: { tanggalMulai: 'desc' },
      take: 20,
    });

    const result = data.map((k) => {
      const year = k.tanggalMulai
        ? new Date(k.tanggalMulai).getFullYear()
        : (k.createdAt ? new Date(k.createdAt).getFullYear() : '-');
      const skalaNama = k.skala?.nama || '-';
      const penyelenggara = k.penyelenggaraExt || '-';
      return {
        id: k.id,
        nama: k.nama,
        label: `[${year}] ${k.nama} · ${skalaNama} (${penyelenggara})`,
        tahun: year,
        kategoriId: k.kategoriId,
        kategoriNama: k.kategori?.nama || null,
        skalaId: k.skalaId,
        skalaNama: k.skala?.nama || null,
        penyelenggara: k.penyelenggaraExt || null,
        tanggalMulai: k.tanggalMulai,
        tanggalSelesai: k.tanggalSelesai,
        deskripsi: k.deskripsi || null,
        linkWebsite: k.linkPenyelenggara || null,
        emailPenyelenggara: k.emailPenyelenggara || null,
      };
    });

    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    next(error);
  }
};
