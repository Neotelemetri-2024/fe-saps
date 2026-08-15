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

const WIDTH = 1200;
const HEIGHT = 627; // Rasio 1.91:1 — ukuran preview link LinkedIn yang direkomendasikan

const BRAND_DARK = '#0e3b1e';
const BRAND = '#2f7a3c';

let logoImagePromise: Promise<Image> | null = null;
function loadLogo(): Promise<Image> {
  if (!logoImagePromise) {
    logoImagePromise = loadImage(path.join(__dirname, '..', '..', 'assets', 'logo_unand.png'));
  }
  return logoImagePromise;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export interface CvImageData {
  nama: string;
  prodi: string;
  fakultas: string;
  totalPoin: number;
  totalKegiatan: number;
}

// Render kartu ringkasan CV sebagai gambar PNG (dipakai sebagai og:image agar
// LinkedIn/Facebook/dll menampilkan pratinjau visual, bukan sekadar logo generik).
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
  ctx.fillStyle = 'rgba(255,255,255,0.97)';
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 24);
  ctx.fill();

  // Logo
  try {
    const logo = await loadLogo();
    const logoSize = 84;
    ctx.drawImage(logo, panelX + 48, panelY + 44, logoSize, logoSize);
  } catch {
    // Jika logo gagal dimuat, lanjutkan tanpa logo agar gambar tetap tergenerasi
  }

  const textX = panelX + 48 + 84 + 28;
  ctx.fillStyle = '#111827';
  ctx.font = '600 22px "Inter SemiBold"';
  ctx.fillText('CURRICULUM VITAE', textX, panelY + 70);
  ctx.fillStyle = BRAND;
  ctx.font = '800 26px "Inter ExtraBold"';
  ctx.fillText('SAPS — Universitas Andalas', textX, panelY + 102);

  // Nama mahasiswa
  ctx.fillStyle = '#111827';
  ctx.font = '800 56px "Inter ExtraBold"';
  ctx.fillText(truncate(data.nama, 28), panelX + 48, panelY + 220);

  // Prodi & fakultas
  ctx.fillStyle = '#374151';
  ctx.font = '600 30px "Inter SemiBold"';
  ctx.fillText(truncate(`${data.prodi} — ${data.fakultas}`, 46), panelX + 48, panelY + 268);

  // Garis pemisah
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(panelX + 48, panelY + 310);
  ctx.lineTo(panelX + panelW - 48, panelY + 310);
  ctx.stroke();

  // Stat: Total Poin
  const statY = panelY + 400;
  ctx.fillStyle = BRAND;
  ctx.font = '800 72px "Inter ExtraBold"';
  ctx.fillText(String(data.totalPoin), panelX + 48, statY);
  ctx.fillStyle = '#6b7280';
  ctx.font = '600 24px "Inter SemiBold"';
  ctx.fillText('Total Poin', panelX + 48, statY + 36);

  // Stat: Total Kegiatan
  const statX2 = panelX + 320;
  ctx.fillStyle = BRAND;
  ctx.font = '800 72px "Inter ExtraBold"';
  ctx.fillText(String(data.totalKegiatan), statX2, statY);
  ctx.fillStyle = '#6b7280';
  ctx.font = '600 24px "Inter SemiBold"';
  ctx.fillText('Total Kegiatan', statX2, statY + 36);

  // Footer badge
  ctx.fillStyle = '#111827';
  ctx.font = '600 20px "Inter SemiBold"';
  ctx.fillText('Sistem Akademik Poin Sistem (SAPS) — lihat CV lengkap →', panelX + 48, panelY + panelH - 32);

  return canvas.toBuffer('image/png');
}
