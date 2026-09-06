/**
 * KAMUS BOBOT RESMI IKU 3 KEMDIKTISAINTEK BERDAMPAK 2026
 * Berdasarkan: Keputusan Menteri Pendidikan Tinggi, Sains, dan Teknologi No. 358/M/KEP/2025
 * Halaman 53-54: Ketentuan Bobot Prestasi dan Pembelajaran di Luar Kampus
 */

export interface BobotPrestasiRule {
  skala: 'Internasional' | 'Nasional' | 'Provinsi';
  peranPatterns: string[];
  bobot: number;
}

export interface BobotPembelajaranRule {
  sksMin: number;
  sksMax: number | null; // null = tidak terbatas atas
  bobot: number;
}

// 1. DEFAULT RULES PRESTASI RESMI KEPMEN 358/2025
export const DEFAULT_PRESTASI_RULES: BobotPrestasiRule[] = [
  // --- INTERNASIONAL ---
  { skala: 'Internasional', peranPatterns: ['juara 1', 'juara i', 'gold medal', 'first place', 'pemenang 1'], bobot: 1.00 },
  { skala: 'Internasional', peranPatterns: ['juara 2', 'juara ii', 'juara 3', 'juara iii', 'silver medal', 'bronze medal', 'favorit', 'juara favorit'], bobot: 0.50 },
  { skala: 'Internasional', peranPatterns: ['harapan', 'juara harapan', 'honorable mention'], bobot: 0.30 },
  { skala: 'Internasional', peranPatterns: ['finalis', 'finalist', 'top finalist'], bobot: 0.20 },

  // --- NASIONAL ---
  { skala: 'Nasional', peranPatterns: ['juara 1', 'juara i', 'gold medal', 'first place', 'pemenang 1'], bobot: 0.60 },
  { skala: 'Nasional', peranPatterns: ['juara 2', 'juara ii', 'juara 3', 'juara iii', 'silver medal', 'bronze medal', 'favorit', 'juara favorit'], bobot: 0.30 },
  { skala: 'Nasional', peranPatterns: ['harapan', 'juara harapan', 'honorable mention'], bobot: 0.20 },
  { skala: 'Nasional', peranPatterns: ['finalis', 'finalist', 'top finalist'], bobot: 0.10 },

  // --- PROVINSI ---
  { skala: 'Provinsi', peranPatterns: ['juara 1', 'juara i', 'gold medal', 'first place', 'pemenang 1'], bobot: 0.40 },
  { skala: 'Provinsi', peranPatterns: ['juara 2', 'juara ii', 'juara 3', 'juara iii', 'silver medal', 'bronze medal', 'favorit', 'juara favorit'], bobot: 0.20 },
  { skala: 'Provinsi', peranPatterns: ['harapan', 'juara harapan', 'honorable mention'], bobot: 0.10 },
  { skala: 'Provinsi', peranPatterns: ['finalis', 'finalist', 'top finalist'], bobot: 0.05 },
];

// 2. DEFAULT RULES PEMBELAJARAN SKS RESMI KEPMEN 358/2025
export const DEFAULT_PEMBELAJARAN_RULES: BobotPembelajaranRule[] = [
  { sksMin: 0, sksMax: 5, bobot: 0.40 },
  { sksMin: 6, sksMax: 10, bobot: 0.60 },
  { sksMin: 11, sksMax: null, bobot: 1.00 }, // Semester penuh (misal 20 SKS MBKM)
];

// 3. TARGET DEFAULT 2026 (Jika belum dikonfigurasi di database)
export const DEFAULT_TARGET_IKU3_2026 = 50.00; // 50%

// HELPER: Normalize string for comparison
export function normalize(text?: string | null): string {
  return (text || '').toLowerCase().trim();
}

/**
 * Resolusi Bobot Prestasi dengan prioritas Dynamic DB Rules -> Default Constants Fallback
 */
export function resolveBobotPrestasi(
  skalaNama?: string | null,
  peranNama?: string | null,
  dynamicRules?: any[]
): number {
  if (!skalaNama || !peranNama) return 0;
  const s = normalize(skalaNama);
  const p = normalize(peranNama);

  // 1. Coba cocokkan dengan dynamic rules dari DB jika ada
  if (dynamicRules && dynamicRules.length > 0) {
    const matchedDb = dynamicRules.find(r => {
      if (r.jenis !== 'prestasi' || !r.aktif) return false;
      const rSkala = normalize(r.skala);
      const rPeran = normalize(r.peran);
      return s.includes(rSkala) && (p.includes(rPeran) || rPeran.includes(p));
    });
    if (matchedDb) {
      return Number(matchedDb.bobot);
    }
  }

  // 2. Fallback ke default rules resmi
  let skalaKategori: 'Internasional' | 'Nasional' | 'Provinsi' | null = null;
  if (s.includes('internasional') || s.includes('international')) {
    skalaKategori = 'Internasional';
  } else if (s.includes('nasional') || s.includes('national')) {
    skalaKategori = 'Nasional';
  } else if (s.includes('provinsi') || s.includes('daerah')) {
    skalaKategori = 'Provinsi';
  }

  if (!skalaKategori) return 0; // Skala universitas, fakultas, wilayah = 0

  for (const rule of DEFAULT_PRESTASI_RULES) {
    if (rule.skala === skalaKategori) {
      const matchPeran = rule.peranPatterns.some(pattern => p.includes(pattern));
      if (matchPeran) {
        return rule.bobot;
      }
    }
  }

  return 0;
}

/**
 * Resolusi Bobot Pembelajaran Luar Kampus (Magang / MBKM / Riset / Pertukaran)
 */
export function resolveBobotPembelajaran(
  sks: number = 20, // Default MBKM semester biasanya 20 SKS
  dynamicRules?: any[]
): number {
  if (sks <= 0) return 0;

  if (dynamicRules && dynamicRules.length > 0) {
    const matchedDb = dynamicRules.find(r => {
      if (r.jenis !== 'pembelajaran' || !r.aktif) return false;
      const min = r.sksMin ?? 0;
      const max = r.sksMax ?? 999;
      return sks >= min && sks <= max;
    });
    if (matchedDb) return Number(matchedDb.bobot);
  }

  if (sks <= 5) return 0.40;
  if (sks <= 10) return 0.60;
  return 1.00;
}
