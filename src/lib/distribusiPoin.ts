/**
 * Membagi total poin ke beberapa sub capaian sesuai bobot.
 *
 * Memakai metode sisa terbesar (largest remainder) agar jumlah seluruh
 * pecahan selalu sama persis dengan totalPoin. Pembulatan per baris memakai
 * Math.round bisa membuat jumlahnya meleset dari total, sehingga progres
 * kurikulum mahasiswa tidak cocok dengan poin yang tercatat.
 */
export function bagiPoin<T>(
  totalPoin: number,
  bagian: { ref: T; bobot: number }[],
): { ref: T; poin: number }[] {
  if (bagian.length === 0) return [];

  const totalBobot = bagian.reduce((s, b) => s + b.bobot, 0);
  if (totalBobot <= 0) {
    // Tanpa bobot yang valid, bagi rata.
    const dasar = Math.floor(totalPoin / bagian.length);
    let sisa = totalPoin - dasar * bagian.length;
    return bagian.map((b) => ({ ref: b.ref, poin: dasar + (sisa-- > 0 ? 1 : 0) }));
  }

  const mentah = bagian.map((b) => (totalPoin * b.bobot) / totalBobot);
  const hasil = mentah.map((v, i) => ({ ref: bagian[i].ref, poin: Math.floor(v), sisa: v - Math.floor(v), i }));

  let kurang = totalPoin - hasil.reduce((s, h) => s + h.poin, 0);
  const urutSisa = [...hasil].sort((a, b) => b.sisa - a.sisa || a.i - b.i);
  for (const h of urutSisa) {
    if (kurang <= 0) break;
    h.poin += 1;
    kurang--;
  }

  return hasil.map((h) => ({ ref: h.ref, poin: h.poin }));
}
