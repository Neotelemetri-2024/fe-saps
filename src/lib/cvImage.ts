import { GlobalFonts, createCanvas } from '@napi-rs/canvas';
import path from 'path';

// Tinos = metrik Times New Roman (Google Croscore). Di-bundle via npm supaya
// rendering konsisten di server Linux yang tidak punya Times New Roman.
let fontsRegistered = false;
function ensureFontsRegistered() {
  if (fontsRegistered) return;
  const fontsDir = path.join(require.resolve('@fontsource/tinos/package.json'), '..', 'files');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'tinos-latin-400-normal.woff2'), 'Times');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'tinos-latin-700-normal.woff2'), 'Times Bold');
  fontsRegistered = true;
}

// Rasio kira-kira A4 (210×297 mm)
const WIDTH = 1200;
const HEIGHT = 1700;

const INK = '#1a1a1a';
const SUB = '#333333';
const MUTED = '#666666';
const FOOTER = '#888888';
const RULE = '#1a1a1a';
const RULE_LIGHT = '#cccccc';

function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function yearFromDate(val: unknown): string {
  if (!val) return '';
  try {
    const d = new Date(val as string | Date);
    if (Number.isNaN(d.getTime())) return '';
    return String(d.getFullYear());
  } catch {
    return '';
  }
}

export interface CvImageRiwayatItem {
  kegiatan: string;
  skala?: string;
  totalPoin?: number;
  tanggal?: string | Date | null;
  peran?: string;
  organisasi?: string;
  kategori?: string;
}

export interface CvImageData {
  nama: string;
  nim: string;
  prodi: string;
  fakultas: string;
  email?: string;
  phone?: string;
  angkatan?: number | null;
  totalPoin?: number;
  totalKegiatan?: number;
  riwayatPerKategori?: Record<string, CvImageRiwayatItem[]>;
}

function findKategoriEntries(
  riwayatPerKategori: Record<string, CvImageRiwayatItem[]> = {},
  keys: string[],
): CvImageRiwayatItem[] {
  const matched: CvImageRiwayatItem[] = [];
  for (const [kat, items] of Object.entries(riwayatPerKategori)) {
    const lower = kat.toLowerCase();
    if (keys.some((k) => lower.includes(k))) {
      matched.push(...(items || []).map((item) => ({ ...item, kategori: kat })));
    }
  }
  return matched;
}

type CanvasCtx = ReturnType<ReturnType<typeof createCanvas>['getContext']>;

function drawCentered(ctx: CanvasCtx, text: string, y: number) {
  const w = ctx.measureText(text).width;
  ctx.fillText(text, (WIDTH - w) / 2, y);
}

function drawHLine(ctx: CanvasCtx, x1: number, x2: number, y: number, color: string, width = 2) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

// Render dokumen CV ATS-friendly — meniru #cv-print-area di GenerateCV.jsx
export async function generateCvImage(data: CvImageData): Promise<Buffer> {
  ensureFontsRegistered();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const padX = 90;
  const contentRight = WIDTH - padX;
  let y = 88;
  const footerY = HEIGHT - 56;

  // ---------- Header ----------
  ctx.fillStyle = INK;
  ctx.font = '700 42px "Times Bold"';
  drawCentered(ctx, truncate(data.nama.toUpperCase(), 36), y);
  y += 36;

  ctx.fillStyle = SUB;
  ctx.font = '400 22px "Times"';
  drawCentered(ctx, truncate(`${data.prodi} — Universitas Andalas`, 60), y);
  y += 32;

  const contactParts = [data.nim, data.email, data.phone, data.fakultas].filter((p) => p && p !== '-');
  ctx.font = '400 18px "Times"';
  drawCentered(ctx, truncate(contactParts.join('  |  '), 92), y);
  y += 22;

  drawHLine(ctx, padX, contentRight, y, RULE, 3);
  y += 48;

  const drawSectionTitle = (title: string) => {
    ctx.fillStyle = INK;
    ctx.font = '700 20px "Times Bold"';
    ctx.fillText(title.toUpperCase(), padX, y);
    y += 10;
    drawHLine(ctx, padX, contentRight, y, RULE, 1.5);
    y += 32;
  };

  const drawEmpty = (text: string) => {
    ctx.fillStyle = MUTED;
    ctx.font = '400 19px "Times"';
    ctx.fillText(text, padX, y);
    y += 36;
  };

  const drawTwoLineItem = (title: string, subtitle: string, right: string) => {
    if (y > footerY - 70) return false;
    ctx.fillStyle = INK;
    ctx.font = '700 21px "Times Bold"';
    ctx.fillText(truncate(title, 48), padX, y);
    if (right) {
      ctx.fillStyle = SUB;
      ctx.font = '400 19px "Times"';
      const rw = ctx.measureText(right).width;
      ctx.fillText(right, contentRight - rw, y);
    }
    y += 26;
    if (subtitle) {
      ctx.fillStyle = SUB;
      ctx.font = '400 19px "Times"';
      ctx.fillText(truncate(subtitle, 62), padX, y);
      y += 28;
    } else {
      y += 8;
    }
    return true;
  };

  const drawBulletRow = (left: string, right: string) => {
    if (y > footerY - 50) return false;
    ctx.fillStyle = INK;
    ctx.font = '400 19px "Times"';
    ctx.fillText(`•  ${truncate(left, 52)}`, padX, y);
    if (right) {
      ctx.fillStyle = SUB;
      const rw = ctx.measureText(right).width;
      ctx.fillText(right, contentRight - rw, y);
    }
    y += 28;
    return true;
  };

  const riwayat = data.riwayatPerKategori || {};

  // ---------- Pendidikan ----------
  drawSectionTitle('Pendidikan');
  const jenjang = data.prodi ? `S1 ${data.prodi}` : 'S1';
  const tahunPendidikan = data.angkatan ? `${data.angkatan} – Sekarang` : 'Sekarang';
  drawTwoLineItem(jenjang, 'Universitas Andalas, Padang', tahunPendidikan);
  y += 12;

  // ---------- Pengalaman Organisasi ----------
  drawSectionTitle('Pengalaman Organisasi');
  const orgItems = findKategoriEntries(riwayat, ['organisasi', 'ukm', 'kepanitiaan']);
  if (orgItems.length === 0) {
    drawEmpty('Belum ada pengalaman organisasi.');
  } else {
    for (const item of orgItems) {
      const jabatan = item.peran || item.kegiatan || '-';
      const organisasi = item.kegiatan && item.kegiatan !== jabatan
        ? item.kegiatan
        : (item.skala || item.kategori || '');
      const tahun = yearFromDate(item.tanggal) || '-';
      if (!drawTwoLineItem(jabatan, organisasi, tahun)) break;
    }
  }
  y += 12;

  // ---------- Sertifikasi & Pelatihan ----------
  drawSectionTitle('Sertifikasi & Pelatihan');
  const semItems = findKategoriEntries(riwayat, ['seminar', 'pelatihan', 'workshop', 'sertifikasi']);
  if (semItems.length === 0) {
    drawEmpty('Belum ada sertifikasi/pelatihan.');
  } else {
    for (const item of semItems) {
      if (!drawBulletRow(item.kegiatan || '-', yearFromDate(item.tanggal) || '-')) break;
    }
  }
  y += 12;

  // ---------- Prestasi & Penghargaan ----------
  drawSectionTitle('Prestasi & Penghargaan');
  const prestItems = findKategoriEntries(riwayat, ['prestasi', 'lomba', 'kompetisi', 'penghargaan']);
  if (prestItems.length === 0) {
    drawEmpty('Belum ada prestasi.');
  } else {
    for (const item of prestItems) {
      const pemberi = item.skala || item.kategori || '-';
      const tahun = yearFromDate(item.tanggal) || '-';
      if (!drawTwoLineItem(item.kegiatan || '-', pemberi, tahun)) break;
    }
  }

  // ---------- Footer ----------
  drawHLine(ctx, padX, contentRight, footerY - 28, RULE_LIGHT, 1);
  ctx.fillStyle = FOOTER;
  ctx.font = '400 16px "Times"';
  const tanggal = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const footer = `Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas — ${tanggal}`;
  drawCentered(ctx, footer, footerY);

  return canvas.toBuffer('image/png');
}

export const CV_IMAGE_WIDTH = WIDTH;
export const CV_IMAGE_HEIGHT = HEIGHT;
