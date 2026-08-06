/**
 * Helper opsi filter status — menurunkan opsi dari status yang benar-benar
 * muncul di data tabel, sehingga isi dropdown selalu sesuai dengan halaman.
 */

const STATUS_LABELS = {
  draft: 'Draft',
  diajukan: 'Diajukan',
  diajukan_ulang: 'Diajukan Ulang',
  terverifikasi: 'Menunggu Persetujuan',
  perlu_revisi: 'Perlu Revisi',
  revisi: 'Revisi',
  disetujui: 'Disetujui',
  'disetujui pimpinan': 'Disetujui Pimpinan',
  ditolak: 'Ditolak',
  terpublikasi: 'Disetujui',
  dipublikasikan: 'Dipublikasikan',
  berlangsung: 'Berlangsung',
  selesai: 'Selesai',
  diarsipkan: 'Diarsipkan',
  dibatalkan: 'Dibatalkan',
  diteruskan: 'Diteruskan',
  pending: 'Pending',
  menunggu: 'Menunggu',
  menunggu_izin_pa: 'Menunggu Izin PA',
  menunggu_validasi: 'Menunggu Verifikasi',
  menunggu_pimpinan: 'Menunggu Pimpinan',
  aktif: 'Aktif',
  'sudah tercatat': 'Sudah Tercatat',
  'belum tercatat': 'Belum Tercatat',
}

const STATUS_ORDER = [
  'draft',
  'pending',
  'menunggu',
  'diajukan',
  'menunggu_izin_pa',
  'menunggu_validasi',
  'menunggu_pimpinan',
  'terverifikasi',
  'diteruskan',
  'disetujui',
  'terpublikasi',
  'dipublikasikan',
  'aktif',
  'berlangsung',
  'selesai',
  'ditolak',
  'perlu_revisi',
  'revisi',
  'diarsipkan',
  'dibatalkan',
  'sudah tercatat',
  'belum tercatat',
]

export function labelStatus(status) {
  const key = String(status ?? '').toLowerCase()
  if (STATUS_LABELS[key]) return STATUS_LABELS[key]
  if (!key || key === 'null' || key === 'undefined') return 'Pending'
  return key.charAt(0).toUpperCase() + key.slice(1)
}

/**
 * Bangun daftar opsi status unik dari rows (dalam urutan prioritas).
 * @param rows   array data tabel
 * @param key    nama field yang memuat status (default 'status')
 */
export function statusOptionsFromRows(rows, key = 'status') {
  const seen = new Set()
  const opts = []
  ;(Array.isArray(rows) ? rows : []).forEach((r) => {
    const raw = r?.[key]
    if (raw == null || raw === '') return
    const value = String(raw)
    if (seen.has(value)) return
    seen.add(value)
    opts.push({ value, label: labelStatus(value) })
  })
  opts.sort((a, b) => {
    const ia = STATUS_ORDER.indexOf(a.value)
    const ib = STATUS_ORDER.indexOf(b.value)
    if (ia === -1 && ib === -1) return a.label.localeCompare(b.label)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
  return opts
}
