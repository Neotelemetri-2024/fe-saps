import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';

// 1. Mengajukan Kegiatan Eksternal Baru
export const ajukanKegiatanEksternal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      kategoriId,
      namaKegiatan,
      penyelenggara,
      skalaId,
      tanggalPelaksanaan,
      deskripsi,
      linkWebsite,
      emailPenyelenggara
    } = req.body;

    if (!kategoriId || !namaKegiatan || !penyelenggara || !tanggalPelaksanaan || !skalaId) {
      return res.status(400).json({ success: false, message: 'Harap isi semua kolom wajib' });
    }

    // Ambil Kurikulum Aktif
    const kurikulumAktif = await prisma.kurikulum.findFirst({
      where: { status: 'aktif' }
    });

    if (!kurikulumAktif) {
      return res.status(400).json({ success: false, message: 'Tidak ada kurikulum aktif' });
    }

    // Buat Kegiatan Eksternal (status: menunggu_validasi)
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
        kurikulumId: kurikulumAktif.id,
        dibuatOleh: BigInt(userId),
        status: 'diajukan',
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pengajuan kegiatan berhasil dikirim',
      data: {
        kegiatanId: kegiatan.id.toString()
      }
    });

  } catch (error: any) {
    next(error);
  }
};

// 2. Mengambil Daftar Pengajuan Kegiatan Eksternal Mahasiswa
export const getRiwayatPengajuan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Ambil kegiatan eksternal yang dibuat oleh mahasiswa ini
    const data = await prisma.kegiatan.findMany({
      where: {
        dibuatOleh: BigInt(userId),
        asal: 'eksternal'
      },
      include: {
        kategori: { select: { nama: true } },
        skala: { select: { nama: true } },
        kegiatanApproval: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Mapping response
    const result = data.map((k) => {
      let statusStr = 'Pending';
      if (k.status === 'disetujui' || k.status === 'terpublikasi') statusStr = 'Disetujui';
      else if (k.status === 'ditolak') statusStr = 'Ditolak';

      const lastApproval = k.kegiatanApproval[0];

      return {
        id: k.id.toString(),
        namaKegiatan: k.nama,
        jenisKegiatan: k.kategori?.nama,
        penyelenggara: k.penyelenggaraExt,
        tanggalPelaksanaan: k.tanggalMulai,
        skala: k.skala?.nama,
        status: statusStr,
        alasan: lastApproval?.alasan || null,
        tanggalPengajuan: k.createdAt
      };
    });

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error: any) {
    next(error);
  }
};
