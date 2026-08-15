import { GlobalFonts, createCanvas } from '@napi-rs/canvas';
import path from 'path';

// Tinos = metrik Times New Roman (Google Croscore), meniru font Times-Roman Civitor.
let fontsRegistered = false;
function ensureFontsRegistered() {
  if (fontsRegistered) return;
  const fontsDir = path.join(require.resolve('@fontsource/tinos/package.json'), '..', 'files');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'tinos-latin-400-normal.woff2'), 'Times');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'tinos-latin-700-normal.woff2'), 'Times Bold');
  fontsRegistered = true;
}

// A4 595×842 pt @ 2x supaya tajam di LinkedIn
const WIDTH = 1190;
const HEIGHT = 1684;

const TEXT = '#111827';
const MUTED = '#374151';
const LINE = '#1f2937';
const FOOTER = '#6b7280';

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

function joinMeta(parts: Array<string | undefined | null | false>): string {
  return parts.filter((p): p is string => Boolean(p && String(p).trim() && p !== '-')).join(' | ');
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

function drawHLine(ctx: CanvasCtx, x1: number, x2: number, y: number, width = 1.5) {
  ctx.strokeStyle = LINE;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

// Layout meniru Civitor (CvDocument.tsx / CvPreview.tsx): padat, Times, ATS.
export async function generateCvImage(data: CvImageData): Promise<Buffer> {
  ensureFontsRegistered();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const padX = 88;
  const contentRight = WIDTH - padX;
  let y = 72;
  const footerY = HEIGHT - 52;

  // ---------- Header (Civitor: name, job title, contact lines) ----------
  ctx.fillStyle = TEXT;
  ctx.font = '700 22px "Times Bold"';
  drawCentered(ctx, truncate(data.nama, 48), y);
  y += 22;

  if (data.prodi) {
    ctx.fillStyle = MUTED;
    ctx.font = '700 17px "Times Bold"';
    drawCentered(ctx, truncate(data.prodi, 60), y);
    y += 18;
  }

  ctx.fillStyle = MUTED;
  ctx.font = '400 16px "Times"';
  const primaryContact = joinMeta([
    data.fakultas ? `${data.fakultas}, Padang` : 'Padang',
    data.phone,
    data.email,
  ]);
  if (primaryContact) {
    drawCentered(ctx, truncate(primaryContact, 92), y);
    y += 16;
  }
  const secondaryContact = joinMeta([data.nim ? `NIM: ${data.nim}` : '', 'Universitas Andalas']);
  if (secondaryContact) {
    drawCentered(ctx, truncate(secondaryContact, 92), y);
    y += 16;
  }

  y += 10;

  const drawSectionTitle = (title: string) => {
    ctx.fillStyle = TEXT;
    ctx.font = '700 17px "Times Bold"';
    ctx.fillText(title.toUpperCase(), padX, y);
    y += 6;
    drawHLine(ctx, padX, contentRight, y, 1.5);
    y += 22;
  };

  // Title bold + optional " | meta" on the left; date pinned on the right.
  const drawEntryHeader = (title: string, metaText: string, date: string) => {
    if (y > footerY - 48) return false;
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

  const drawDashLine = (text: string) => {
    if (y > footerY - 40) return false;
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
      if (!drawEntryHeader(title, metaText, date)) break;
      y += 6;
    }
    y += 4;
  }

  // ---------- Sertifikasi (Civitor: name | issuer (date)) ----------
  const semItems = findKategoriEntries(riwayat, ['seminar', 'pelatihan', 'workshop', 'sertifikasi']);
  if (semItems.length > 0) {
    drawSectionTitle('Sertifikasi & Pelatihan');
    for (const item of semItems) {
      if (y > footerY - 40) break;
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
      if (!drawEntryHeader(item.kegiatan || '-', item.skala || item.kategori || '', date)) break;
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

export const CV_IMAGE_WIDTH = WIDTH;
export const CV_IMAGE_HEIGHT = HEIGHT;
