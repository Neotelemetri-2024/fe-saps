const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms))

const notifMock = {
  mahasiswa: [
    { id: 1, type: 'success', title: 'Kegiatan Disetujui', message: 'Pengajuan Seminar AI telah disetujui.', time: '5 menit lalu' },
    { id: 2, type: 'info', title: 'Event Baru', message: 'BAKTI 2024 — Pengabdian Masyarakat dibuka.', time: '1 jam lalu' },
    { id: 3, type: 'error', title: 'Kegiatan Ditolak', message: 'Lomba KTI ditolak, silakan perbaiki.', time: '3 jam lalu' },
  ],
  'dosen-pa': [
    { id: 1, type: 'info', title: 'Permintaan Persetujuan', message: 'Mahasiswa mengajukan persetujuan kegiatan.', time: '10 menit lalu' },
  ],
  'pimpinan-fakultas': [
    { id: 1, type: 'info', title: 'Pengajuan UKMF', message: 'UKMF mengajukan kegiatan baru.', time: '30 menit lalu' },
  ],
  ukm: [
    { id: 1, type: 'info', title: 'Verifikasi Peserta', message: 'Ada peserta baru perlu diverifikasi.', time: '15 menit lalu' },
  ],
  ukmf: [
    { id: 1, type: 'info', title: 'Status Kegiatan', message: 'Kegiatan Seminar AI telah diverifikasi.', time: '20 menit lalu' },
  ],
  'admin-ditmawa': [
    { id: 1, type: 'info', title: 'Klaim Poin Baru', message: 'Mahasiswa mengajukan klaim poin baru.', time: '5 menit lalu' },
  ],
  'admin-fakultas': [
    { id: 1, type: 'info', title: 'Pengajuan UKM', message: 'UKM mengajukan kegiatan baru.', time: '10 menit lalu' },
  ],
}

export async function getNotifikasi(role) {
  await delay()
  return notifMock[role] || notifMock.mahasiswa
}
