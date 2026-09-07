"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadPdfLaporan = exports.downloadExcelLaporan = exports.getPreviewLaporan = void 0;
const dataLaporan_service_1 = require("../../services/laporan/dataLaporan.service");
const excelLaporan_service_1 = require("../../services/laporan/excelLaporan.service");
const pdfLaporan_service_1 = require("../../services/laporan/pdfLaporan.service");
/**
 * GET /api/pimpinan/laporan/preview
 * Mengambil ringkasan data laporan dalam format JSON untuk ditampilkan di UI dashboard pimpinan
 */
const getPreviewLaporan = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const effectiveRole = user.peran === 'staff' && user.jabatan ? user.jabatan : user.peran;
        const { fakultasId, prodiId, angkatan, tahunAkademik, kurikulumId } = req.query;
        const data = await (0, dataLaporan_service_1.getLaporanData)({
            role: effectiveRole,
            userId: BigInt(user.id),
            fakultasId: fakultasId ? Number(fakultasId) : undefined,
            prodiId: prodiId ? Number(prodiId) : undefined,
            angkatan: angkatan ? Number(angkatan) : undefined,
            tahunAkademik: tahunAkademik ? String(tahunAkademik) : undefined,
            kurikulumId: kurikulumId ? Number(kurikulumId) : undefined,
        });
        res.status(200).json({
            success: true,
            message: 'Data preview laporan berhasil dimuat',
            data,
        });
    }
    catch (error) {
        console.error('[getPreviewLaporan]', error);
        next(error);
    }
};
exports.getPreviewLaporan = getPreviewLaporan;
/**
 * GET /api/pimpinan/laporan/excel
 * Download laporan evaluasi & riset pimpinan dalam format Excel (.xlsx)
 */
const downloadExcelLaporan = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const effectiveRole = user.peran === 'staff' && user.jabatan ? user.jabatan : user.peran;
        const { fakultasId, prodiId, angkatan, tahunAkademik, kurikulumId } = req.query;
        const data = await (0, dataLaporan_service_1.getLaporanData)({
            role: effectiveRole,
            userId: BigInt(user.id),
            fakultasId: fakultasId ? Number(fakultasId) : undefined,
            prodiId: prodiId ? Number(prodiId) : undefined,
            angkatan: angkatan ? Number(angkatan) : undefined,
            tahunAkademik: tahunAkademik ? String(tahunAkademik) : undefined,
            kurikulumId: kurikulumId ? Number(kurikulumId) : undefined,
        });
        const csvBuffer = await (0, excelLaporan_service_1.generateExcelLaporan)(data);
        const safeScope = data.scopeNama.replace(/[^a-zA-Z0-9_-]/g, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `Laporan_SAPS_${safeScope}_${dateStr}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', csvBuffer.length);
        res.status(200).send(csvBuffer);
    }
    catch (error) {
        console.error('[downloadExcelLaporan]', error);
        next(error);
    }
};
exports.downloadExcelLaporan = downloadExcelLaporan;
/**
 * GET /api/pimpinan/laporan/pdf
 * Download laporan resmi evaluasi pimpinan dalam format PDF (.pdf)
 */
const downloadPdfLaporan = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const effectiveRole = user.peran === 'staff' && user.jabatan ? user.jabatan : user.peran;
        const { fakultasId, prodiId, angkatan, tahunAkademik, kurikulumId } = req.query;
        const data = await (0, dataLaporan_service_1.getLaporanData)({
            role: effectiveRole,
            userId: BigInt(user.id),
            fakultasId: fakultasId ? Number(fakultasId) : undefined,
            prodiId: prodiId ? Number(prodiId) : undefined,
            angkatan: angkatan ? Number(angkatan) : undefined,
            tahunAkademik: tahunAkademik ? String(tahunAkademik) : undefined,
            kurikulumId: kurikulumId ? Number(kurikulumId) : undefined,
        });
        const pdfBuffer = await (0, pdfLaporan_service_1.generatePdfLaporan)(data);
        const safeScope = data.scopeNama.replace(/[^a-zA-Z0-9_-]/g, '_');
        const dateStr = new Date().toISOString().split('T')[0];
        const filename = `Laporan_SAPS_${safeScope}_${dateStr}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.status(200).send(pdfBuffer);
    }
    catch (error) {
        console.error('[downloadPdfLaporan]', error);
        next(error);
    }
};
exports.downloadPdfLaporan = downloadPdfLaporan;
