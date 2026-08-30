import { Request, Response, NextFunction } from 'express';
import { getLaporanData } from '../../services/laporan/dataLaporan.service';
import { generateExcelLaporan } from '../../services/laporan/excelLaporan.service';
import { generatePdfLaporan } from '../../services/laporan/pdfLaporan.service';

/**
 * GET /api/pimpinan/laporan/preview
 * Mengambil ringkasan data laporan dalam format JSON untuk ditampilkan di UI dashboard pimpinan
 */
export const getPreviewLaporan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { fakultasId, prodiId, angkatan, tahunAkademik } = req.query;

    const data = await getLaporanData({
      role: user.peran,
      userId: BigInt(user.id),
      fakultasId: fakultasId ? Number(fakultasId) : undefined,
      prodiId: prodiId ? Number(prodiId) : undefined,
      angkatan: angkatan ? Number(angkatan) : undefined,
      tahunAkademik: tahunAkademik ? String(tahunAkademik) : undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Data preview laporan berhasil dimuat',
      data,
    });
  } catch (error: any) {
    console.error('[getPreviewLaporan]', error);
    next(error);
  }
};

/**
 * GET /api/pimpinan/laporan/excel
 * Download laporan evaluasi & riset pimpinan dalam format Excel (.xlsx)
 */
export const downloadExcelLaporan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { fakultasId, prodiId, angkatan, tahunAkademik } = req.query;

    const data = await getLaporanData({
      role: user.peran,
      userId: BigInt(user.id),
      fakultasId: fakultasId ? Number(fakultasId) : undefined,
      prodiId: prodiId ? Number(prodiId) : undefined,
      angkatan: angkatan ? Number(angkatan) : undefined,
      tahunAkademik: tahunAkademik ? String(tahunAkademik) : undefined,
    });

    const excelBuffer = await generateExcelLaporan(data);

    const safeScope = data.scopeNama.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Evaluasi_SAPS_${safeScope}_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.status(200).send(excelBuffer);
  } catch (error: any) {
    console.error('[downloadExcelLaporan]', error);
    next(error);
  }
};

/**
 * GET /api/pimpinan/laporan/pdf
 * Download laporan resmi evaluasi pimpinan dalam format PDF (.pdf)
 */
export const downloadPdfLaporan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { fakultasId, prodiId, angkatan, tahunAkademik } = req.query;

    const data = await getLaporanData({
      role: user.peran,
      userId: BigInt(user.id),
      fakultasId: fakultasId ? Number(fakultasId) : undefined,
      prodiId: prodiId ? Number(prodiId) : undefined,
      angkatan: angkatan ? Number(angkatan) : undefined,
      tahunAkademik: tahunAkademik ? String(tahunAkademik) : undefined,
    });

    const pdfBuffer = await generatePdfLaporan(data);

    const safeScope = data.scopeNama.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Laporan_Resmi_SAPS_${safeScope}_${dateStr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    res.status(200).send(pdfBuffer);
  } catch (error: any) {
    console.error('[downloadPdfLaporan]', error);
    next(error);
  }
};
