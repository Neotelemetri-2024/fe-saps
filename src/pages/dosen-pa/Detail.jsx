import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ProgressBar from '../../components/dashboard/ProgressBar'

const subCapaian = [
  { kategori: 'Religius', items: [{ label: 'Kegiatan Keagamaan', poin: 50, max: 60 }, { label: 'Aktivitas Rohani', poin: 40, max: 50 }, { label: 'Sosial Keagamaan', poin: 30, max: 40 }] },
  { kategori: 'Bakti', items: [{ label: 'Bakti Sosial', poin: 45, max: 60 }, { label: 'Pengabdian Masyarakat', poin: 35, max: 50 }, { label: 'Volunteer', poin: 20, max: 40 }] },
  { kategori: 'Literasi Digital', items: [{ label: 'Kompetensi IT', poin: 60, max: 60 }, { label: 'Media Digital', poin: 45, max: 50 }, { label: 'Inovasi Teknologi', poin: 35, max: 40 }] },
  { kategori: 'Growth Mindset', items: [{ label: 'Seminar', poin: 40, max: 50 }, { label: 'Workshop', poin: 35, max: 50 }, { label: 'Kompetisi', poin: 35, max: 50 }] },
]

const distribusiTahun = [
  { tahun: 'Fondasi', pct: 40, items: [{ label: 'Seminar', pct: 40 }, { label: 'Organisasi', pct: 35 }, { label: 'Prestasi', pct: 25 }] },
  { tahun: 'Penguatan', pct: 35, items: [{ label: 'Seminar', pct: 30 }, { label: 'Organisasi', pct: 40 }, { label: 'Prestasi', pct: 30 }] },
  { tahun: 'Pemantapan', pct: 20, items: [{ label: 'Seminar', pct: 25 }, { label: 'Organisasi', pct: 35 }, { label: 'Prestasi', pct: 40 }] },
  { tahun: 'Aktualisasi', pct: 5, items: [{ label: 'Seminar', pct: 20 }, { label: 'Organisasi', pct: 30 }, { label: 'Prestasi', pct: 50 }] },
]

function DosenPADetail() {
  return (
    <DashboardLayout role="dosen-pa" userName="Dr. Ahmad Rizal" userRole="Dosen PA">
      <div className="space-y-6">
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="flex items-start gap-6">
            <div className="flex h-[168px] w-[168px] items-center justify-center rounded-full border-2 border-brand-dark bg-[#f0f4f0] text-5xl font-bold text-brand-dark">SS</div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-brand-dark">Shafa Salsabilla</h2>
                  <p className="text-[#616161]">NIM: 2311121063</p>
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div><p className="text-[#616161]">Prodi</p><p className="font-medium text-[#333]">Teknik Mesin</p></div>
                    <div><p className="text-[#616161]">Angkatan</p><p className="font-medium text-[#333]">23</p></div>
                    <div><p className="text-[#616161]">IPK</p><p className="font-medium text-[#333]">3.80</p></div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-brand-dark">470</p>
                  <ProgressBar value={470} max={550} height={8} color="bg-brand-light" />
                  <p className="mt-1 text-xs text-[#616161]">85% Syarat Yudisium</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {subCapaian.map((k) => (
            <div key={k.kategori} className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold text-brand-dark">{k.kategori}</p>
              <div className="space-y-2">
                {k.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-[#333]">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24"><ProgressBar value={item.poin} max={item.max} height={5} /></div>
                      <span className="text-xs text-[#616161]">{item.poin}/{item.max}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Distribusi Poin per Tahun</h3>
          <div className="space-y-4">
            {distribusiTahun.map((t) => (
              <div key={t.tahun}>
                <p className="mb-1 text-sm font-medium text-[#333]">{t.tahun}</p>
                <div className="flex h-6 w-full overflow-hidden rounded-full bg-[#e9ebf8]">
                  {t.items.map((item) => (
                    <div key={item.label} className={`h-full transition-all ${item.label === 'Seminar' ? 'bg-blue-500' : item.label === 'Organisasi' ? 'bg-brand-light' : 'bg-yellow-500'}`} style={{ width: `${item.pct}%` }} />
                  ))}
                </div>
                <div className="mt-1 flex gap-4 text-xs text-[#616161]">
                  {t.items.map((item) => (
                    <span key={item.label} className="flex items-center gap-1">
                      <span className={`inline-block h-2 w-2 rounded-full ${item.label === 'Seminar' ? 'bg-blue-500' : item.label === 'Organisasi' ? 'bg-brand-light' : 'bg-yellow-500'}`} />
                      {item.label}: {item.pct}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Aktivitas Terbaru</h3>
          <div className="space-y-4">
            {[
              { kegiatan: 'PKM 2026 - Pendanaan', status: 'Disetujui Universitas', tgl: '12 Jul 2026', color: 'text-green-700 bg-green-50' },
              { kegiatan: 'Seminar Nasional AI', status: 'Disetujui Fakultas', tgl: '10 Jul 2026', color: 'text-blue-700 bg-blue-50' },
              { kegiatan: 'Lomba Debat Nasional', status: 'Pending', tgl: '8 Jul 2026', color: 'text-yellow-700 bg-yellow-50' },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-[#e9ebf8] p-4">
                <div><p className="text-sm font-medium text-[#333]">{a.kegiatan}</p><p className="text-xs text-[#616161]">{a.tgl}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${a.color}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Catatan untuk Mahasiswa</h3>
          <textarea className="w-full rounded-lg border border-[#e9ebf8] p-4 text-sm text-[#333] outline-none" rows={4} placeholder="Tuliskan saran bimbingan akademik dan konseling di sini..." />
          <div className="mt-4 space-y-3">
            {[
              { dari: 'Dr. Ahmad Rizal', pesan: 'Tingkatkan partisipasi di kegiatan kemahasiswaan', tgl: '10 Jul 2026' },
              { dari: 'Dr. Ahmad Rizal', pesan: 'Pertahankan IPK dan capaian poin', tgl: '5 Jun 2026' },
            ].map((c, i) => (
              <div key={i} className="rounded-lg bg-[#f9fafb] p-3">
                <p className="text-sm text-[#333]">{c.pesan}</p>
                <p className="mt-1 text-xs text-[#616161]">{c.dari} - {c.tgl}</p>
              </div>
            ))}
          </div>
          <button className="mt-4 rounded-lg bg-brand-dark px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-90">Simpan Catatan</button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DosenPADetail
