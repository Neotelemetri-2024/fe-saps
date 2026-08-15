import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import logoUnand from '../assets/logo_unand.png'
import { getPublicCv } from '../services/cvService'

function CvPublic() {
  const { token } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    setNotFound(false)
    getPublicCv(token)
      .then((res) => setData(res))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f6f8]">
        <p className="text-sm text-[#9aa0a6]">Memuat CV…</p>
      </div>
    )
  }

  if (notFound || !data?.mahasiswa) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f5f6f8] px-4 text-center">
        <img src={logoUnand} alt="Unand" className="h-12 w-12" />
        <p className="text-base font-semibold text-[#616161]">CV tidak ditemukan atau tautan sudah tidak berlaku.</p>
      </div>
    )
  }

  const { mahasiswa, ringkasan, capaianProgress = [], riwayatPerKategori = {} } = data

  return (
    <div className="min-h-screen bg-[#f5f6f8] px-4 py-10 sm:px-6">
      <div
        className="mx-auto w-full max-w-[210mm] bg-white p-8 shadow-lg ring-1 ring-[#e5e7eb] sm:p-12"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        {/* Header */}
        <div className="mb-6 flex flex-col items-center gap-2 border-b-2 border-[#1a1a1a] pb-4 text-center">
          <img src={logoUnand} alt="Unand" className="h-10 w-10" />
          <h1 className="text-[26px] font-bold uppercase tracking-wide text-[#1a1a1a]">
            {mahasiswa.nama}
          </h1>
          <p className="text-[14px] text-[#333]">
            {mahasiswa.prodi} — Universitas Andalas
          </p>
          <p className="text-[12.5px] text-[#333]">
            {mahasiswa.nim} &nbsp;|&nbsp; {mahasiswa.email} &nbsp;|&nbsp; {mahasiswa.fakultas}
          </p>
        </div>

        {/* Ringkasan Poin */}
        <section className="mb-5">
          <h2 className="mb-2 border-b border-[#1a1a1a] pb-1 text-[13px] font-bold uppercase tracking-wider text-[#1a1a1a]">
            Ringkasan Capaian
          </h2>
          <p className="text-[12.5px] text-[#333]">
            Total Poin: <span className="font-bold">{ringkasan?.totalPoin ?? 0}</span>
            &nbsp;|&nbsp; Total Kegiatan: <span className="font-bold">{ringkasan?.totalKegiatan ?? 0}</span>
          </p>
        </section>

        {/* Progress Capaian */}
        {capaianProgress.length > 0 && (
          <section className="mb-5">
            <h2 className="mb-2 border-b border-[#1a1a1a] pb-1 text-[13px] font-bold uppercase tracking-wider text-[#1a1a1a]">
              Progres Capaian Kurikulum
            </h2>
            <div className="space-y-2">
              {capaianProgress.map((c) => (
                <div key={c.capaianId} className="flex items-center justify-between gap-3 text-[12.5px] text-[#333]">
                  <span>{c.nama}</span>
                  <span className="shrink-0 font-semibold text-[#1a1a1a]">
                    {c.diperoleh}/{c.target} ({c.persentase}%)
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Riwayat per Kategori */}
        {Object.entries(riwayatPerKategori).map(([kategori, items]) => (
          <section className="mb-5" key={kategori}>
            <h2 className="mb-2 border-b border-[#1a1a1a] pb-1 text-[13px] font-bold uppercase tracking-wider text-[#1a1a1a]">
              {kategori}
            </h2>
            <ul className="space-y-1 pl-5">
              {(items || []).map((item, i) => (
                <li key={i} className="list-disc text-[12.5px] text-[#1a1a1a] marker:text-[#1a1a1a]">
                  <span className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                    <span>{item.kegiatan}</span>
                    <span className="shrink-0 text-[#333] sm:ml-4">{item.skala} — {item.totalPoin} poin</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        <hr className="mb-3 border-[#ccc]" />
        <p className="text-center text-[10.5px] text-[#888]">
          Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas — Sistem SAPS
        </p>
      </div>
    </div>
  )
}

export default CvPublic
