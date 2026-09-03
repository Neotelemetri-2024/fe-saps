import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, FileText, Eye, Filter, X } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { getCurrentUser } from '../../services/authService'
import { getPreviewLaporan, downloadExcelLaporan, downloadPdfLaporan, getFakultasList } from '../../services/laporanService'

function LaporanEksekutif() {
  const user = getCurrentUser()
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [fakultasList, setFakultasList] = useState([])
  const [filter, setFilter] = useState({ fakultasId: '', prodiId: '', angkatan: '', tahunAkademik: '' })

  useEffect(() => {
    getFakultasList()
      .then((list) => setFakultasList(Array.isArray(list) ? list : []))
      .catch(() => setFakultasList([]))
  }, [])

  const loadPreview = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter.fakultasId) params.fakultasId = filter.fakultasId
      if (filter.prodiId) params.prodiId = filter.prodiId
      if (filter.angkatan) params.angkatan = filter.angkatan
      if (filter.tahunAkademik) params.tahunAkademik = filter.tahunAkademik
      const res = await getPreviewLaporan(params)
      setPreview(res?.data || res)
    } catch (err) {
      toast.error('Gagal memuat preview laporan', { description: err.message })
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadPreview() }, [])

  const handleDownload = async (type) => {
    setDownloading(type)
    try {
      if (type === 'excel') {
        await downloadExcelLaporan(filter)
        toast.success('File Excel berhasil diunduh!')
      } else {
        await downloadPdfLaporan(filter)
        toast.success('File PDF berhasil diunduh!')
      }
    } catch (err) {
      toast.error(`Gagal mengunduh ${type.toUpperCase()}`, { description: err.message })
    } finally {
      setDownloading(null)
    }
  }

  const kpi = preview?.kpi || {}
  const komparasi = preview?.komparasi || []
  const capaian = preview?.capaianKurikulumStats || []

  const resetFilter = () => {
    setFilter({ fakultasId: '', prodiId: '', angkatan: '', tahunAkademik: '' })
    setTimeout(loadPreview, 100)
  }

  return (
    <DashboardLayout role="pimpinan_ditmawa" userName={user?.nama || 'Pimpinan Ditmawa'} userRole="Pimpinan Ditmawa">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">Laporan Eksekutif</h2>
          <p className="mt-1 text-sm text-[#616161]">Preview dan unduh laporan evaluasi sistem SAPS.</p>
        </div>

        {/* Filter & Download */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#616161]" />
            <h3 className="text-sm font-bold text-[#333]">Filter Laporan</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select value={filter.fakultasId} onChange={(e) => setFilter((f) => ({ ...f, fakultasId: e.target.value }))}
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none">
              <option value="">Semua Fakultas</option>
              {fakultasList.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
            </select>
            <input type="text" value={filter.angkatan} onChange={(e) => setFilter((f) => ({ ...f, angkatan: e.target.value }))}
              placeholder="Angkatan (mis: 2022)"
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none" />
            <input type="text" value={filter.tahunAkademik} onChange={(e) => setFilter((f) => ({ ...f, tahunAkademik: e.target.value }))}
              placeholder="Tahun Akademik (mis: 2024/2025)"
              className="rounded-lg border border-[#d9dce7] bg-white px-4 py-2.5 text-sm text-[#616161] outline-none" />
            <div className="flex gap-2">
              <button type="button" onClick={loadPreview}
                className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                <Eye className="mr-1 inline h-4 w-4" /> Preview
              </button>
              {(filter.fakultasId || filter.angkatan || filter.tahunAkademik) && (
                <button type="button" onClick={resetFilter}
                  className="rounded-lg border border-brand-dark bg-white px-3 py-2.5 text-sm font-medium text-brand-dark hover:bg-[#f5f6f8]">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => handleDownload('excel')} disabled={downloading === 'excel'}
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60">
              <FileSpreadsheet className="h-4 w-4" /> {downloading === 'excel' ? 'Mengunduh...' : 'Download Excel'}
            </button>
            <button type="button" onClick={() => handleDownload('pdf')} disabled={downloading === 'pdf'}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60">
              <FileText className="h-4 w-4" /> {downloading === 'pdf' ? 'Mengunduh...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {kpi && Object.keys(kpi).length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Mahasiswa', value: kpi.totalMahasiswa ?? '-' },
              { label: 'Rata-rata Poin', value: kpi.rataRataPoin?.toLocaleString('id-ID') ?? '-' },
              { label: 'Total Kegiatan', value: kpi.totalKegiatan ?? '-' },
              { label: 'Lulus Target', value: kpi.persentaseLulusTarget != null ? `${kpi.persentaseLulusTarget}%` : '-' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-[#e9ebf8] bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-[#9aa0a6]">{label}</p>
                <p className="mt-1 text-xl font-bold text-[#222]">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Komparasi Fakultas */}
        {komparasi.length > 0 && (
          <TableCard title="Komparasi Fakultas">
            <TableFrame>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e9ebf8] bg-gradient-to-r from-brand-dark to-brand-light text-white">
                    <th className="px-4 py-3 text-left font-semibold">No</th>
                    <th className="px-4 py-3 text-left font-semibold">Fakultas</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Poin</th>
                    <th className="px-4 py-3 text-right font-semibold">Rata-rata</th>
                    <th className="px-4 py-3 text-right font-semibold">% Lulus</th>
                  </tr>
                </thead>
                <tbody>
                  {komparasi.slice(0, 10).map((item, i) => (
                    <tr key={item.id || i} className="border-b border-[#f0f1f5] hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 text-black">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-black">{item.nama || item.fakultas || '-'}</td>
                      <td className="px-4 py-3 text-right text-black">{(item.totalPoin ?? 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-black">{(item.rataRataPoin ?? 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-black">{item.persentaseLulus != null ? `${item.persentaseLulus}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableFrame>
          </TableCard>
        )}

        {/* Capaian Kurikulum */}
        {capaian.length > 0 && (
          <TableCard title="Capaian Kurikulum">
            <TableFrame>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e9ebf8] bg-gradient-to-r from-brand-dark to-brand-light text-white">
                    <th className="px-4 py-3 text-left font-semibold">Pilar</th>
                    <th className="px-4 py-3 text-right font-semibold">Target Poin</th>
                    <th className="px-4 py-3 text-right font-semibold">Rata-rata Poin</th>
                    <th className="px-4 py-3 text-right font-semibold">Pencapaian</th>
                  </tr>
                </thead>
                <tbody>
                  {capaian.map((c, i) => (
                    <tr key={c.id || i} className="border-b border-[#f0f1f5] hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 font-medium text-black">{c.pilar || c.nama || '-'}</td>
                      <td className="px-4 py-3 text-right text-black">{c.targetPoin ?? '-'}</td>
                      <td className="px-4 py-3 text-right text-black">{c.rataRataPoin ?? '-'}</td>
                      <td className="px-4 py-3 text-right text-black">{c.persenCapaian != null ? `${c.persenCapaian}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableFrame>
          </TableCard>
        )}

        {loading && (
          <div className="py-12 text-center text-sm text-[#9aa0a6]">Memuat data laporan...</div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default LaporanEksekutif
