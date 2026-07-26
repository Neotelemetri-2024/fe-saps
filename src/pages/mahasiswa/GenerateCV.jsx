import { useEffect, useState } from 'react'
import { Download, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getPortofolio } from '../../services/dashboardService'

function initialsFromName(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AR'
}

function yearFromDate(val) {
  if (!val) return ''
  try {
    return String(new Date(val).getFullYear())
  } catch {
    return ''
  }
}

function findKategoriEntries(riwayatPerKategori = {}, keys) {
  const entries = Object.entries(riwayatPerKategori)
  const matched = []
  for (const [kat, items] of entries) {
    const lower = kat.toLowerCase()
    if (keys.some((k) => lower.includes(k))) {
      matched.push(...(items || []).map((item) => ({ ...item, kategori: kat })))
    }
  }
  return matched
}

function GenerateCV() {
  const user = getCurrentUser()
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState(null)
  const [pendidikanData, setPendidikanData] = useState([])
  const [organisasiData, setOrganisasiData] = useState([])
  const [sertifikasiData, setSertifikasiData] = useState([])
  const [prestasiData, setPrestasiData] = useState([])

  useEffect(() => {
    const userId = user?.id
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    getPortofolio(userId)
      .then((data) => {
        const mhs = data?.mahasiswa || {}
        const nama = mhs.nama || user?.nama || 'Mahasiswa'
        setUserData({
          name: nama.toUpperCase(),
          initials: initialsFromName(nama),
          nim: mhs.nim || '-',
          prodi: mhs.prodi || '-',
          universitas: 'Universitas Andalas',
          email: mhs.email || user?.email || '-',
          phone: mhs.phone || mhs.nomorTelepon || '-',
          address: mhs.fakultas ? `${mhs.fakultas}, Padang` : 'Padang, Sumatera Barat',
        })

        setPendidikanData([
          {
            jenjang: mhs.prodi ? `S1 ${mhs.prodi}` : 'S1',
            institusi: `Universitas Andalas, Padang`,
            tahunMulai: mhs.angkatan ? String(mhs.angkatan) : '',
            tahunSelesai: 'sekarang',
            ipk: mhs.ipk || null,
          },
        ])

        const riwayat = data?.riwayatPerKategori || {}
        const orgItems = findKategoriEntries(riwayat, ['organisasi', 'ukm', 'kepanitiaan'])
        setOrganisasiData(
          orgItems.length
            ? orgItems.map((item) => ({
                jabatan: item.peran || item.kegiatan || '-',
                organisasi: item.kegiatan || item.organisasi || item.kategori || '-',
                tahunMulai: '',
                tahunSelesai: yearFromDate(item.tanggal) || '-',
              }))
            : [],
        )

        const semItems = findKategoriEntries(riwayat, ['seminar', 'pelatihan', 'workshop', 'sertifikasi'])
        setSertifikasiData(
          semItems.map((item) => ({
            nama: item.kegiatan || '-',
            tahun: yearFromDate(item.tanggal) || '-',
          })),
        )

        const prestItems = findKategoriEntries(riwayat, ['prestasi', 'lomba', 'kompetisi', 'penghargaan'])
        setPrestasiData(
          prestItems.map((item) => ({
            nama: item.kegiatan || '-',
            pemberi: item.skala || item.kategori || '-',
            tahun: yearFromDate(item.tanggal) || '-',
          })),
        )
      })
      .catch((err) => {
        toast.error('Gagal memuat portofolio', { description: err.message })
        setUserData({
          name: (user?.nama || 'Mahasiswa').toUpperCase(),
          initials: initialsFromName(user?.nama),
          nim: '-',
          prodi: '-',
          universitas: 'Universitas Andalas',
          email: user?.email || '-',
          phone: '-',
          address: 'Padang, Sumatera Barat',
        })
      })
      .finally(() => setLoading(false))
  }, [user?.id, user?.nama, user?.email])

  const displayUser = userData || {
    name: (user?.nama || 'Mahasiswa').toUpperCase(),
    initials: initialsFromName(user?.nama),
    nim: '-',
    prodi: '-',
    universitas: 'Universitas Andalas',
    email: user?.email || '-',
    phone: '-',
    address: 'Padang, Sumatera Barat',
  }

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="text-xs text-[#9aa0a6]">
          <span>Activities</span>
          <span className="mx-1.5">›</span>
          <span className="font-medium text-[#444]">Generate CV</span>
        </div>

        {/* Tombol Generate CV + deskripsi */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setGenerated(true)}
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Memuat data…' : 'Generate CV'}
          </button>
          <p className="text-sm text-[#616161]">Buat CV profesional dari data aktivitas Anda secara otomatis.</p>
        </div>

        {/* CV + tombol aksi — tampil setelah generate */}
        {generated && (
          <div className="space-y-4">
            {/* Tombol Download & Bagikan */}
            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#d1d5db] bg-white px-4 py-2 text-sm font-semibold text-[#444] shadow-sm transition hover:bg-[#f5f5f5]"
              >
                <Share2 className="h-4 w-4" /> Bagikan
              </button>
            </div>

            {/* Dokumen CV */}
            <div className="mx-auto w-full max-w-2xl rounded-xl bg-white p-5 shadow-lg ring-1 ring-[#e9ebf8] sm:p-10">
              {/* Header CV */}
              <div className="mb-7 flex flex-col items-start gap-4 sm:flex-row sm:items-start sm:gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border-2 border-[#333] text-xl font-extrabold text-[#333]">
                  {displayUser.initials}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-wide text-[#111]">{displayUser.name}</h2>
                  <p className="text-sm text-[#444]">
                    {displayUser.nim} | {displayUser.prodi} — {displayUser.universitas}
                  </p>
                  <div className="mt-1 space-y-0.5 text-xs text-[#555]">
                    <p>✉ {displayUser.email} &nbsp; ✆ {displayUser.phone}</p>
                    <p>⊙ {displayUser.address}</p>
                  </div>
                </div>
              </div>

              <hr className="mb-5 border-[#333]" />

              {/* Pendidikan */}
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#333]">Pendidikan</h3>
                {pendidikanData.length === 0 ? (
                  <p className="text-xs text-[#888]">Belum ada data pendidikan.</p>
                ) : (
                  pendidikanData.map((item, i) => (
                    <div key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#111]">{item.jenjang}</p>
                        <p className="text-xs text-[#555]">{item.institusi}</p>
                      </div>
                      <div className="text-left text-xs text-[#555] shrink-0 sm:text-right sm:ml-4">
                        <p>{item.tahunMulai} — {item.tahunSelesai}</p>
                        {item.ipk && <p>IPK: {item.ipk}</p>}
                      </div>
                    </div>
                  ))
                )}
              </section>

              {/* Pengalaman Organisasi */}
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#333]">Pengalaman Organisasi</h3>
                {organisasiData.length === 0 ? (
                  <p className="text-xs text-[#888]">Belum ada pengalaman organisasi.</p>
                ) : (
                  <div className="space-y-3">
                    {organisasiData.map((item, i) => (
                      <div key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-[#111]">{item.jabatan}</p>
                          <p className="text-xs text-[#555]">{item.organisasi}</p>
                        </div>
                        <div className="text-left text-xs text-[#555] shrink-0 sm:text-right sm:ml-4">
                          {item.tahunMulai && item.tahunSelesai
                            ? `${item.tahunMulai} — ${item.tahunSelesai}`
                            : item.tahunSelesai}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Sertifikasi & Pelatihan */}
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#333]">Sertifikasi &amp; Pelatihan</h3>
                {sertifikasiData.length === 0 ? (
                  <p className="text-xs text-[#888]">Belum ada sertifikasi/pelatihan.</p>
                ) : (
                  <ul className="space-y-1">
                    {sertifikasiData.map((item, i) => (
                      <li key={i} className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between text-sm">
                        <span className="text-[#333]">• {item.nama}</span>
                        <span className="shrink-0 text-xs text-[#555] sm:ml-4">{item.tahun}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Prestasi & Penghargaan */}
              <section className="mb-6">
                <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#333]">Prestasi &amp; Penghargaan</h3>
                {prestasiData.length === 0 ? (
                  <p className="text-xs text-[#888]">Belum ada prestasi.</p>
                ) : (
                  <div className="space-y-3">
                    {prestasiData.map((item, i) => (
                      <div key={i} className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="flex items-center gap-1.5 text-sm font-bold text-[#111]">
                            <span className="text-brand-dark">⊙</span> {item.nama}
                          </p>
                          <p className="ml-5 text-xs text-[#555]">{item.pemberi}</p>
                        </div>
                        <span className="shrink-0 text-xs text-[#555] sm:ml-4">{item.tahun}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Footer CV */}
              <hr className="mb-4 border-[#e0e0e0]" />
              <p className="text-center text-[10px] text-[#9aa0a6]">
                Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas •{' '}
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default GenerateCV
