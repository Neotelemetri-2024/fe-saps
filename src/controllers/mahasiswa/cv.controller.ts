import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import crypto from 'crypto';

// POST /api/mahasiswa/cv/generate-link
export const generatePublicCvToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = BigInt(req.user!.id);
    const token = crypto.randomUUID();

    const mahasiswa = await prisma.mahasiswa.update({
      where: { userId },
      data: { publicCvToken: token }
    });

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const publicCvUrl = `${baseUrl}/cv/public/${token}`;
    const linkedInShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicCvUrl)}`;

    res.json({
      success: true,
      data: {
        publicCvToken: mahasiswa.publicCvToken,
        publicCvUrl,
        linkedInShareUrl,
        message: 'Link publik berhasil dibuat'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Gagal membuat link publik' });
  }
};

// GET /api/mahasiswa/cv
export const getPrivateCv = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = BigInt(req.user!.id);
    const portofolioData = await fetchPortofolioData(userId);
    
    if (!portofolioData) {
      res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
      return;
    }

    res.json({ success: true, data: portofolioData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// GET /api/umum/cv/public/:token
export const getPublicCv = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.params.token as string;

    if (!token) {
      res.status(400).json({ success: false, message: 'Token tidak valid' });
      return;
    }

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { publicCvToken: token }
    });

    if (!mahasiswa) {
      res.status(404).json({ success: false, message: 'Portofolio publik tidak ditemukan atau token tidak valid' });
      return;
    }

    const portofolioData = await fetchPortofolioData(mahasiswa.userId);
    
    // Hapus data sensitif jika perlu, tapi portofolioData pada dasarnya hanya prestasi
    if (portofolioData) {
      // Hapus NIM jika tidak ingin diekspos ke publik
      // delete portofolioData.mahasiswa.nim; 
      res.json({ success: true, data: portofolioData });
    } else {
      res.status(404).json({ success: false, message: 'Data portofolio tidak ditemukan' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// Helper function untuk mengambil data (Logika sama dengan Portofolio API)
const fetchPortofolioData = async (mahasiswaId: bigint) => {
  const mahasiswa = await prisma.mahasiswa.findUnique({
    where: { userId: mahasiswaId },
    include: {
      user: { select: { nama: true, email: true } },
      prodi: { include: { fakultas: true } },
    },
  });

  if (!mahasiswa) return null;

  const perolehan = await prisma.perolehanPoin.findMany({
    where: { mahasiswaId, status: 'sah' },
    include: {
      kegiatan: { include: { kategori: true, skala: true } },
      detail: { include: { subCapaian: { include: { capaian: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalPoin = perolehan.reduce((s, p) => s + p.totalPoin, 0);

  const capaianMap = new Map<number, { nama: string; target: number; diperoleh: number }>();
  for (const p of perolehan) {
    for (const d of p.detail) {
      const capId = d.subCapaian.capaianId;
      if (!capaianMap.has(capId)) {
        capaianMap.set(capId, { nama: d.subCapaian.capaian.nama, target: d.subCapaian.capaian.jumlahPoin, diperoleh: 0 });
      }
      capaianMap.get(capId)!.diperoleh += d.poin;
    }
  }

  const riwayatPerKategori: Record<string, any[]> = {};
  for (const p of perolehan) {
    const kat = p.kegiatan.kategori.nama;
    if (!riwayatPerKategori[kat]) riwayatPerKategori[kat] = [];
    riwayatPerKategori[kat].push({
      kegiatan: p.kegiatan.nama,
      skala: p.kegiatan.skala.nama,
      totalPoin: p.totalPoin,
      tanggal: p.kegiatan.tanggalMulai,
    });
  }

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const token = mahasiswa.publicCvToken;
  const publicCvUrl = token ? `${baseUrl}/cv/public/${token}` : null;
  const linkedInShareUrl = publicCvUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicCvUrl)}`
    : null;

  return {
    generatedAt: new Date().toISOString(),
    publicCvToken: mahasiswa.publicCvToken,
    publicCvUrl,
    linkedInShareUrl,
    mahasiswa: {
      nim: mahasiswa.nim,
      nama: mahasiswa.user.nama,
      email: mahasiswa.user.email,
      prodi: mahasiswa.prodi.nama,
      fakultas: mahasiswa.prodi.fakultas.nama,
      angkatan: mahasiswa.angkatan,
    },
    ringkasan: { totalPoin, totalKegiatan: perolehan.length },
    capaianProgress: Array.from(capaianMap.entries()).map(([id, c]) => ({
      capaianId: id,
      nama: c.nama,
      target: c.target,
      diperoleh: c.diperoleh,
      persentase: Math.round((c.diperoleh / c.target) * 100),
    })),
    riwayatPerKategori,
  };
};
