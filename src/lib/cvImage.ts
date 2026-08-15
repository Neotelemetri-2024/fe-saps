import { GlobalFonts, createCanvas, loadImage, Image } from '@napi-rs/canvas';
import path from 'path';

// Font Inter di-bundle via npm (@openfonts/inter_all) supaya rendering konsisten
// di semua environment (server tidak punya font sistem seperti macOS/Windows).
let fontsRegistered = false;
function ensureFontsRegistered() {
  if (fontsRegistered) return;
  const fontsDir = path.join(require.resolve('@openfonts/inter_all/package.json'), '..', 'files');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'inter-all-800.woff2'), 'Inter ExtraBold');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'inter-all-600.woff2'), 'Inter SemiBold');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'inter-all-400.woff2'), 'Inter Regular');
  fontsRegistered = true;
}

// Kartu preview dibuat lebih tinggi (bukan rasio 1.91:1 standar) supaya muat ringkasan
// progres capaian + riwayat kegiatan, jadi benar-benar terlihat seperti "gambar CV",
// bukan sekadar kartu nama & total poin.
const WIDTH = 1200;
const HEIGHT = 1500;

const BRAND_DARK = '#0e3b1e';
const BRAND = '#2f7a3c';
const INK = '#111827';
const SUBINK = '#374151';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';

let logoImagePromise: Promise<Image | null> | null = null;
function loadLogo(): Promise<Image | null> {
  if (!logoImagePromise) {
    logoImagePromise = loadImage(path.join(__dirname, '..', '..', 'assets', 'logo_unand.png')).catch(() => null);
  }
  return logoImagePromise;
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export interface CvImageCapaianItem {
  nama: string;
  target: number;
  diperoleh: number;
  persentase: number;
}

export interface CvImageRiwayatItem {
  kegiatan: string;
  skala: string;
  totalPoin: number;
}

export interface CvImageData {
  nama: string;
  nim: string;
  prodi: string;
  fakultas: string;
  totalPoin: number;
  totalKegiatan: number;
  capaianProgress?: CvImageCapaianItem[];
  riwayatPerKategori?: Record<string, CvImageRiwayatItem[]>;
}

// Render "gambar CV" — kartu ringkasan visual (identitas, stat, progres capaian, riwayat
// kegiatan per kategori) — dipakai sebagai og:image agar preview LinkedIn/Facebook/dll
// menampilkan gambaran CV, bukan sekadar logo generik atau kartu nama polos.
export async function generateCvImage(data: CvImageData): Promise<Buffer> {
  ensureFontsRegistered();

  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  // Background gradient brand
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  gradient.addColorStop(0, BRAND_DARK);
  gradient.addColorStop(1, BRAND);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Panel putih untuk konten
  const panelX = 60;
  const panelY = 60;
  const panelW = WIDTH - panelX * 2;
  const panelH = HEIGHT - panelY * 2;
  const contentLeft = panelX + 48;
  const contentRight = panelX + panelW - 48;
  const contentWidth = contentRight - contentLeft;
  const maxY = panelY + panelH - 56; // sisakan ruang untuk footer

  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 24);
  ctx.fill();

  // ---------- Header ----------
  const logo = await loadLogo();
  const logoSize = 76;
  if (logo) {
    ctx.drawImage(logo, contentLeft, panelY + 44, logoSize, logoSize);
  }
  const headerTextX = logo ? contentLeft + logoSize + 24 : contentLeft;
  ctx.fillStyle = INK;
  ctx.font = '600 20px "Inter SemiBold"';
  ctx.fillText('CURRICULUM VITAE', headerTextX, panelY + 68);
  ctx.fillStyle = BRAND;
  ctx.font = '800 24px "Inter ExtraBold"';
  ctx.fillText('SAPS — Universitas Andalas', headerTextX, panelY + 98);

  let cursorY = panelY + 44 + logoSize + 56;

  ctx.fillStyle = INK;
  ctx.font = '800 48px "Inter ExtraBold"';
  ctx.fillText(truncate(data.nama, 30), contentLeft, cursorY);
  cursorY += 42;

  ctx.fillStyle = SUBINK;
  ctx.font = '600 24px "Inter SemiBold"';
  ctx.fillText(truncate(`${data.prodi} — ${data.fakultas}`, 52), contentLeft, cursorY);
  cursorY += 32;

  ctx.fillStyle = MUTED;
  ctx.font = '600 20px "Inter SemiBold"';
  ctx.fillText(`NIM ${data.nim}`, contentLeft, cursorY);
  cursorY += 36;

  // ---------- Stat: Total Poin & Total Kegiatan ----------
  const statBoxW = (contentWidth - 24) / 2;
  const statBoxH = 92;
  const drawStatBox = (x: number, value: string, label: string) => {
    ctx.fillStyle = '#f3f7f4';
    ctx.beginPath();
    ctx.roundRect(x, cursorY, statBoxW, statBoxH, 14);
    ctx.fill();
    ctx.fillStyle = BRAND;
    ctx.font = '800 44px "Inter ExtraBold"';
    ctx.fillText(value, x + 24, cursorY + 54);
    ctx.fillStyle = MUTED;
    ctx.font = '600 18px "Inter SemiBold"';
    ctx.fillText(label, x + 24, cursorY + 78);
  };
  drawStatBox(contentLeft, String(data.totalPoin), 'Total Poin');
  drawStatBox(contentLeft + statBoxW + 24, String(data.totalKegiatan), 'Total Kegiatan');
  cursorY += statBoxH + 40;

  const drawDivider = () => {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(contentLeft, cursorY);
    ctx.lineTo(contentRight, cursorY);
    ctx.stroke();
    cursorY += 36;
  };

  const drawSectionTitle = (text: string) => {
    ctx.fillStyle = INK;
    ctx.font = '800 22px "Inter ExtraBold"';
    ctx.fillText(text.toUpperCase(), contentLeft, cursorY);
    cursorY += 30;
  };

  // ---------- Progres Capaian Kurikulum ----------
  const capaianProgress = (data.capaianProgress || []).filter((c) => c && c.nama);
  if (capaianProgress.length > 0 && cursorY < maxY - 60) {
    drawDivider();
    drawSectionTitle('Progres Capaian Kurikulum');

    const barH = 14;
    const rowH = 56;
    const maxItems = Math.max(1, Math.floor((maxY - cursorY) / rowH));
    const shown = capaianProgress.slice(0, Math.min(4, maxItems));

    for (const c of shown) {
      ctx.fillStyle = SUBINK;
      ctx.font = '600 20px "Inter SemiBold"';
      ctx.fillText(truncate(c.nama, 44), contentLeft, cursorY);
      ctx.fillStyle = BRAND;
      ctx.font = '700 20px "Inter SemiBold"';
      const pctText = `${c.diperoleh}/${c.target} (${c.persentase}%)`;
      const pctWidth = ctx.measureText(pctText).width;
      ctx.fillText(pctText, contentRight - pctWidth, cursorY);
      cursorY += 12;

      ctx.fillStyle = LINE;
      ctx.beginPath();
      ctx.roundRect(contentLeft, cursorY, contentWidth, barH, barH / 2);
      ctx.fill();

      const pct = Math.max(0, Math.min(100, c.persentase || 0));
      const fillW = (contentWidth * pct) / 100;
      if (fillW > 0) {
        ctx.fillStyle = BRAND;
        ctx.beginPath();
        ctx.roundRect(contentLeft, cursorY, fillW, barH, barH / 2);
        ctx.fill();
      }
      cursorY += barH + 22;
    }

    if (capaianProgress.length > shown.length) {
      ctx.fillStyle = MUTED;
      ctx.font = '600 18px "Inter SemiBold"';
      ctx.fillText(`+${capaianProgress.length - shown.length} capaian lainnya`, contentLeft, cursorY);
      cursorY += 30;
    }
  }

  // ---------- Riwayat Kegiatan per Kategori ----------
  const kategoriEntries = Object.entries(data.riwayatPerKategori || {}).filter(([, items]) => items && items.length > 0);
  if (kategoriEntries.length > 0 && cursorY < maxY - 60) {
    drawDivider();
    drawSectionTitle('Riwayat Kegiatan');

    outer: for (const [kategori, items] of kategoriEntries) {
      if (cursorY > maxY - 30) break;
      ctx.fillStyle = BRAND_DARK;
      ctx.font = '700 20px "Inter SemiBold"';
      ctx.fillText(`${kategori} (${items.length})`, contentLeft, cursorY);
      cursorY += 28;

      const itemsToShow = items.slice(0, 3);
      for (const item of itemsToShow) {
        if (cursorY > maxY - 12) break outer;
        ctx.fillStyle = SUBINK;
        ctx.font = '600 18px "Inter SemiBold"';
        ctx.fillText('•', contentLeft, cursorY);

        const label = truncate(item.kegiatan, 40);
        ctx.fillText(label, contentLeft + 18, cursorY);

        ctx.fillStyle = MUTED;
        ctx.font = '600 16px "Inter SemiBold"';
        const poinText = `${item.totalPoin} poin`;
        const poinWidth = ctx.measureText(poinText).width;
        ctx.fillText(poinText, contentRight - poinWidth, cursorY);
        cursorY += 26;
      }
      if (items.length > itemsToShow.length && cursorY <= maxY - 12) {
        ctx.fillStyle = MUTED;
        ctx.font = '600 16px "Inter SemiBold"';
        ctx.fillText(`+${items.length - itemsToShow.length} kegiatan lainnya`, contentLeft + 18, cursorY);
        cursorY += 26;
      }
      cursorY += 12;
    }
  }

  // ---------- Footer ----------
  ctx.fillStyle = INK;
  ctx.font = '600 18px "Inter SemiBold"';
  ctx.fillText('Sistem Akademik Poin Sistem (SAPS) — lihat CV lengkap →', contentLeft, panelY + panelH - 32);

  return canvas.toBuffer('image/png');
}

export const CV_IMAGE_WIDTH = WIDTH;
export const CV_IMAGE_HEIGHT = HEIGHT;
