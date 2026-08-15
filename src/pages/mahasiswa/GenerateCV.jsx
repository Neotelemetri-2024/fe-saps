import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getPortofolio } from '../../services/dashboardService'
import { getCv, generateCvPublicLink } from '../../services/cvService'

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.56V9h3.554v11.452z" />
    </svg>
  )
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
  const [linkedInShareUrl, setLinkedInShareUrl] = useState(null)
  const [sharingLinkedIn, setSharingLinkedIn] = useState(false)

  useEffect(() => {
    getCv()
      .then((data) => {
        if (data?.linkedInShareUrl) setLinkedInShareUrl(data.linkedInShareUrl)
      })
      .catch(() => {})
  }, [])

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
          name: nama,
          nim: mhs.nim || '-',
          prodi: mhs.prodi || '-',
          universitas: 'Universitas Andalas',
          email: mhs.email || user?.email || '-',
          phone: mhs.phone || mhs.nomorTelepon || '-',
          address: mhs.fakultas ? `${mhs.fakultas}, Padang, Sumatera Barat` : 'Padang, Sumatera Barat',
        })

        setPendidikanData([
          {
            jenjang: mhs.prodi ? `S1 ${mhs.prodi}` : 'S1',
            institusi: `Universitas Andalas, Padang`,
            tahunMulai: mhs.angkatan ? String(mhs.angkatan) : '',
            tahunSelesai: 'Sekarang',
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
          name: user?.nama || 'Mahasiswa',
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
    name: user?.nama || 'Mahasiswa',
    nim: '-',
    prodi: '-',
    universitas: 'Universitas Andalas',
    email: user?.email || '-',
    phone: '-',
    address: 'Padang, Sumatera Barat',
  }

  const handleDownloadPdf = () => {
    window.print()
  }

  const handleShareLinkedIn = async () => {
    if (linkedInShareUrl) {
      window.open(linkedInShareUrl, '_blank', 'width=600,height=600')
      return
    }
    setSharingLinkedIn(true)
    try {
      const data = await generateCvPublicLink()
      if (data?.linkedInShareUrl) {
        setLinkedInShareUrl(data.linkedInShareUrl)
        window.open(data.linkedInShareUrl, '_blank', 'width=600,height=600')
      } else {
        toast.error('Gagal membuat link publik CV')
      }
    } catch (err) {
      toast.error('Gagal membuat link publik CV', { description: err.message })
    } finally {
      setSharingLinkedIn(false)
    }
  }

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
       

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
            <div className="flex flex-wrap justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
              <button
                type="button"
                onClick={handleShareLinkedIn}
                disabled={sharingLinkedIn}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#004182] disabled:opacity-60"
              >
                <LinkedInIcon /> {sharingLinkedIn ? 'Memproses…' : 'Share ke LinkedIn'}
              </button>
            </div>

            {/* Dokumen CV — layout ATS-friendly: satu kolom, hierarki jelas, tanpa elemen dekoratif */}
            <div
              id="cv-print-area"
              className="mx-auto w-full max-w-[210mm] bg-white p-8 shadow-lg ring-1 ring-[#e5e7eb] sm:p-12"
              style={{ fontFamily: "'Times New Roman', Times, serif" }}
            >
              {/* Header CV */}
              <div className="mb-6 border-b-2 border-[#1a1a1a] pb-4 text-center">
                <h1 className="text-[26px] font-bold uppercase tracking-wide text-[#1a1a1a]">
                  {displayUser.name}
                </h1>
                <p className="mt-1 text-[14px] text-[#333]">
                  {displayUser.prodi} — {displayUser.universitas}
                </p>
                <p className="mt-2 text-[12.5px] text-[#333]">
                  {displayUser.nim} &nbsp;|&nbsp; {displayUser.email} &nbsp;|&nbsp; {displayUser.phone} &nbsp;|&nbsp; {displayUser.address}
                </p>
              </div>

              {/* Pendidikan */}
              <section className="mb-5">
                <h2 className="mb-2 border-b border-[#1a1a1a] pb-1 text-[13px] font-bold uppercase tracking-wider text-[#1a1a1a]">
                  Pendidikan
                </h2>
                {pendidikanData.length === 0 ? (
                  <p className="text-[12.5px] text-[#666]">Belum ada data pendidikan.</p>
                ) : (
                  <div className="space-y-2">
                    {pendidikanData.map((item, i) => (
                      <div key={i} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                        <div>
                          <p className="text-[13.5px] font-bold text-[#1a1a1a]">{item.jenjang}</p>
                          <p className="text-[12.5px] text-[#333]">{item.institusi}</p>
                        </div>
                        <div className="shrink-0 text-left text-[12.5px] text-[#333] sm:ml-4 sm:text-right">
                          <p>{item.tahunMulai} – {item.tahunSelesai}</p>
                          {item.ipk && <p>IPK: {item.ipk}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Pengalaman Organisasi */}
              <section className="mb-5">
                <h2 className="mb-2 border-b border-[#1a1a1a] pb-1 text-[13px] font-bold uppercase tracking-wider text-[#1a1a1a]">
                  Pengalaman Organisasi
                </h2>
                {organisasiData.length === 0 ? (
                  <p className="text-[12.5px] text-[#666]">Belum ada pengalaman organisasi.</p>
                ) : (
                  <div className="space-y-2.5">
                    {organisasiData.map((item, i) => (
                      <div key={i} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                        <div>
                          <p className="text-[13.5px] font-bold text-[#1a1a1a]">{item.jabatan}</p>
                          <p className="text-[12.5px] text-[#333]">{item.organisasi}</p>
                        </div>
                        <div className="shrink-0 text-left text-[12.5px] text-[#333] sm:ml-4 sm:text-right">
                          {item.tahunMulai && item.tahunSelesai
                            ? `${item.tahunMulai} – ${item.tahunSelesai}`
                            : item.tahunSelesai}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Sertifikasi & Pelatihan */}
              <section className="mb-5">
                <h2 className="mb-2 border-b border-[#1a1a1a] pb-1 text-[13px] font-bold uppercase tracking-wider text-[#1a1a1a]">
                  Sertifikasi &amp; Pelatihan
                </h2>
                {sertifikasiData.length === 0 ? (
                  <p className="text-[12.5px] text-[#666]">Belum ada sertifikasi/pelatihan.</p>
                ) : (
                  <ul className="space-y-1 pl-5">
                    {sertifikasiData.map((item, i) => (
                      <li key={i} className="list-disc text-[12.5px] text-[#1a1a1a] marker:text-[#1a1a1a]">
                        <span className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                          <span>{item.nama}</span>
                          <span className="shrink-0 text-[#333] sm:ml-4">{item.tahun}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* Prestasi & Penghargaan */}
              <section className="mb-5">
                <h2 className="mb-2 border-b border-[#1a1a1a] pb-1 text-[13px] font-bold uppercase tracking-wider text-[#1a1a1a]">
                  Prestasi &amp; Penghargaan
                </h2>
                {prestasiData.length === 0 ? (
                  <p className="text-[12.5px] text-[#666]">Belum ada prestasi.</p>
                ) : (
                  <div className="space-y-2">
                    {prestasiData.map((item, i) => (
                      <div key={i} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between">
                        <div>
                          <p className="text-[13.5px] font-bold text-[#1a1a1a]">{item.nama}</p>
                          <p className="text-[12.5px] text-[#333]">{item.pemberi}</p>
                        </div>
                        <span className="shrink-0 text-[12.5px] text-[#333] sm:ml-4">{item.tahun}</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Footer CV */}
              <hr className="mb-3 border-[#ccc]" />
              <p className="text-center text-[10.5px] text-[#888]">
                Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas —{' '}
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
