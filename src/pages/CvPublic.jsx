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

  const yearFrom = (val) => {
    if (!val) return ''
    try {
      return String(new Date(val).getFullYear())
    } catch {
      return ''
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8] px-4 py-10 sm:px-6">
      <div
        className="mx-auto w-full max-w-[210mm] bg-white px-11 py-8 shadow-lg ring-1 ring-[#e5e7eb]"
        style={{ fontFamily: "'Times New Roman', Times, serif", color: '#111827' }}
      >
        <div className="mb-2 text-center">
          <h1 className="text-[26px] font-bold tracking-wide">{mahasiswa.nama}</h1>
          {mahasiswa.prodi && (
            <p className="mt-1 text-[16px] font-bold text-[#374151]">{mahasiswa.prodi}</p>
          )}
          <p className="mt-1 text-[14px] text-[#374151]">
            {[mahasiswa.fakultas ? `${mahasiswa.fakultas}, Padang` : 'Padang', mahasiswa.email].filter(Boolean).join(' | ')}
          </p>
          <p className="mt-0.5 text-[14px] text-[#374151]">
            {[mahasiswa.nim ? `NIM: ${mahasiswa.nim}` : '', 'Universitas Andalas'].filter(Boolean).join(' | ')}
          </p>
        </div>

        <section className="mt-[14px]">
          <h2 className="mb-[6px] border-b border-[#1f2937] pb-[2px] text-[13px] font-bold uppercase tracking-wide">
            Pendidikan
          </h2>
          <div className="flex items-baseline justify-between gap-2 text-[13px] leading-[1.35]">
            <p className="min-w-0 flex-1">
              <span className="font-bold">Universitas Andalas{mahasiswa.prodi ? ` - S1 ${mahasiswa.prodi}` : ''}</span>
              <span> | Padang</span>
            </p>
            <p className="shrink-0 whitespace-nowrap">
              {mahasiswa.angkatan ? `${mahasiswa.angkatan} - Sekarang` : 'Sekarang'}
            </p>
          </div>
        </section>

        {ringkasan && (
          <section className="mt-[14px]">
            <h2 className="mb-[6px] border-b border-[#1f2937] pb-[2px] text-[13px] font-bold uppercase tracking-wide">
              Ringkasan Capaian
            </h2>
            <p className="text-[13px] leading-[1.35]">
              Total Poin: <span className="font-bold">{ringkasan.totalPoin ?? 0}</span>
              {' | '}
              Total Kegiatan: <span className="font-bold">{ringkasan.totalKegiatan ?? 0}</span>
            </p>
          </section>
        )}

        {capaianProgress.length > 0 && (
          <section className="mt-[14px]">
            <h2 className="mb-[6px] border-b border-[#1f2937] pb-[2px] text-[13px] font-bold uppercase tracking-wide">
              Progres Capaian Kurikulum
            </h2>
            <div className="space-y-[4px] text-[13px] leading-[1.35]">
              {capaianProgress.map((c) => (
                <p key={c.capaianId}>
                  <span className="font-bold">{c.nama}: </span>
                  {c.diperoleh}/{c.target} ({c.persentase}%)
                </p>
              ))}
            </div>
          </section>
        )}

        {Object.entries(riwayatPerKategori).map(([kategori, items]) => (
          <section className="mt-[14px]" key={kategori}>
            <h2 className="mb-[6px] border-b border-[#1f2937] pb-[2px] text-[13px] font-bold uppercase tracking-wide">
              {kategori}
            </h2>
            <div className="space-y-[10px]">
              {(items || []).map((item, i) => (
                <div key={i} className="flex items-baseline justify-between gap-2 text-[13px] leading-[1.35]">
                  <p className="min-w-0 flex-1">
                    <span className="font-bold">{item.kegiatan}</span>
                    {item.skala && <span> | {item.skala}</span>}
                  </p>
                  <span className="shrink-0 whitespace-nowrap">
                    {[yearFrom(item.tanggal), item.totalPoin != null ? `${item.totalPoin} poin` : ''].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}

        <p className="mt-8 text-center text-[10px] text-[#6b7280]">
          Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas — Sistem SAPS
        </p>
      </div>
    </div>
  )
}

export default CvPublic
