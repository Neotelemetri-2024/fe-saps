"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CV_IMAGE_HEIGHT = exports.CV_IMAGE_WIDTH = void 0;
exports.generateCvImage = generateCvImage;
const canvas_1 = require("@napi-rs/canvas");
const path_1 = __importDefault(require("path"));
// Tinos = metrik Times New Roman (Google Croscore), meniru font Times-Roman Civitor.
let fontsRegistered = false;
function ensureFontsRegistered() {
    if (fontsRegistered)
        return;
    const fontsDir = path_1.default.join(require.resolve('@fontsource/tinos/package.json'), '..', 'files');
    canvas_1.GlobalFonts.registerFromPath(path_1.default.join(fontsDir, 'tinos-latin-400-normal.woff2'), 'Times');
    canvas_1.GlobalFonts.registerFromPath(path_1.default.join(fontsDir, 'tinos-latin-700-normal.woff2'), 'Times Bold');
    fontsRegistered = true;
}
// A4 595×842 pt @ 2x supaya tajam di LinkedIn
const WIDTH = 1190;
const HEIGHT = 1684;
const TEXT = '#111827';
const MUTED = '#374151';
const LINE = '#1f2937';
const FOOTER = '#6b7280';
function truncate(text, max) {
    if (!text)
        return '';
    if (text.length <= max)
        return text;
    return `${text.slice(0, max - 1).trimEnd()}…`;
}
function yearFromDate(val) {
    if (!val)
        return '';
    try {
        const d = new Date(val);
        if (Number.isNaN(d.getTime()))
            return '';
        return String(d.getFullYear());
    }
    catch {
        return '';
    }
}
function joinMeta(parts) {
    return parts.filter((p) => Boolean(p && String(p).trim() && p !== '-')).join(' | ');
}
function findKategoriEntries(riwayatPerKategori = {}, keys) {
    const matched = [];
    for (const [kat, items] of Object.entries(riwayatPerKategori)) {
        const lower = kat.toLowerCase();
        if (keys.some((k) => lower.includes(k))) {
            matched.push(...(items || []).map((item) => ({ ...item, kategori: kat })));
        }
    }
    return matched;
}
function drawCentered(ctx, text, y) {
    const w = ctx.measureText(text).width;
    ctx.fillText(text, (WIDTH - w) / 2, y);
}
function drawHLine(ctx, x1, x2, y, width = 1.5) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
}
// Layout meniru Civitor (CvDocument.tsx / CvPreview.tsx): padat, Times, ATS.
async function generateCvImage(data) {
    ensureFontsRegistered();
    const canvas = (0, canvas_1.createCanvas)(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const padX = 88;
    const contentRight = WIDTH - padX;
    let y = 80;
    const footerY = HEIGHT - 52;
    // ---------- Header (Civitor: name, job title, contact lines) ----------
    ctx.fillStyle = TEXT;
    ctx.font = '700 36px "Times Bold"';
    drawCentered(ctx, truncate(data.nama, 42), y);
    y += 38;
    if (data.prodi) {
        ctx.fillStyle = MUTED;
        ctx.font = '700 24px "Times Bold"';
        drawCentered(ctx, truncate(data.prodi, 52), y);
        y += 28;
    }
    ctx.fillStyle = MUTED;
    ctx.font = '400 20px "Times"';
    const primaryContact = joinMeta([
        data.fakultas ? `${data.fakultas}, Padang` : 'Padang',
        data.phone,
        data.email,
    ]);
    if (primaryContact) {
        drawCentered(ctx, truncate(primaryContact, 78), y);
        y += 24;
    }
    const secondaryContact = joinMeta([data.nim ? `NIM: ${data.nim}` : '', 'Universitas Andalas']);
    if (secondaryContact) {
        drawCentered(ctx, truncate(secondaryContact, 78), y);
        y += 24;
    }
    y += 14;
    const drawSectionTitle = (title) => {
        ctx.fillStyle = TEXT;
        ctx.font = '700 17px "Times Bold"';
        ctx.fillText(title.toUpperCase(), padX, y);
        y += 6;
        drawHLine(ctx, padX, contentRight, y, 1.5);
        y += 22;
    };
    // Title bold + optional " | meta" on the left; date pinned on the right.
    const drawEntryHeader = (title, metaText, date) => {
        if (y > footerY - 48)
            return false;
        ctx.font = '700 17px "Times Bold"';
        const titleText = truncate(title, 42);
        const titleW = ctx.measureText(titleText).width;
        ctx.fillStyle = TEXT;
        ctx.fillText(titleText, padX, y);
        let cursorX = padX + titleW;
        if (metaText) {
            ctx.font = '400 17px "Times"';
            const meta = truncate(` | ${metaText}`, 36);
            ctx.fillText(meta, cursorX, y);
        }
        if (date) {
            ctx.fillStyle = TEXT;
            ctx.font = '400 17px "Times"';
            const dw = ctx.measureText(date).width;
            ctx.fillText(date, contentRight - dw, y);
        }
        y += 22;
        return true;
    };
    const drawDashLine = (text) => {
        if (y > footerY - 40)
            return false;
        ctx.fillStyle = TEXT;
        ctx.font = '400 16px "Times"';
        ctx.fillText('-', padX, y);
        ctx.fillText(truncate(text, 78), padX + 16, y);
        y += 20;
        return true;
    };
    const riwayat = data.riwayatPerKategori || {};
    // ---------- Pendidikan ----------
    drawSectionTitle('Pendidikan');
    const degree = data.prodi ? `S1 ${data.prodi}` : 'S1';
    const eduDate = data.angkatan ? `${data.angkatan} - Sekarang` : 'Sekarang';
    drawEntryHeader(`Universitas Andalas - ${degree}`, 'Padang', eduDate);
    y += 8;
    // ---------- Pengalaman Organisasi (Civitor: experience) ----------
    const orgItems = findKategoriEntries(riwayat, ['organisasi', 'ukm', 'kepanitiaan']);
    if (orgItems.length > 0) {
        drawSectionTitle('Pengalaman Organisasi');
        for (const item of orgItems) {
            const title = item.peran && item.kegiatan && item.peran !== item.kegiatan
                ? `${item.peran} - ${item.kegiatan}`
                : (item.peran || item.kegiatan || '-');
            const metaText = item.skala || item.kategori || '';
            const date = yearFromDate(item.tanggal);
            if (!drawEntryHeader(title, metaText, date))
                break;
            y += 6;
        }
        y += 4;
    }
    // ---------- Sertifikasi (Civitor: name | issuer (date)) ----------
    const semItems = findKategoriEntries(riwayat, ['seminar', 'pelatihan', 'workshop', 'sertifikasi']);
    if (semItems.length > 0) {
        drawSectionTitle('Sertifikasi & Pelatihan');
        for (const item of semItems) {
            if (y > footerY - 40)
                break;
            const line = joinMeta([item.kegiatan, item.skala]) + (yearFromDate(item.tanggal) ? ` (${yearFromDate(item.tanggal)})` : '');
            ctx.fillStyle = TEXT;
            ctx.font = '400 17px "Times"';
            ctx.fillText(truncate(line, 88), padX, y);
            y += 20;
        }
        y += 8;
    }
    // ---------- Prestasi ----------
    const prestItems = findKategoriEntries(riwayat, ['prestasi', 'lomba', 'kompetisi', 'penghargaan']);
    if (prestItems.length > 0) {
        drawSectionTitle('Prestasi & Penghargaan');
        for (const item of prestItems) {
            const date = yearFromDate(item.tanggal);
            if (!drawEntryHeader(item.kegiatan || '-', item.skala || item.kategori || '', date))
                break;
            if (item.totalPoin) {
                drawDashLine(`${item.totalPoin} poin`);
            }
            y += 6;
        }
    }
    // ---------- Footer SAPS ----------
    ctx.fillStyle = FOOTER;
    ctx.font = '400 14px "Times"';
    const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    drawCentered(ctx, `Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas — ${tanggal}`, footerY);
    return canvas.toBuffer('image/png');
}
exports.CV_IMAGE_WIDTH = WIDTH;
exports.CV_IMAGE_HEIGHT = HEIGHT;
