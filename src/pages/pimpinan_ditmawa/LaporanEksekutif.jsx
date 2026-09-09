import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Download, FileSpreadsheet, FileText, Eye, Filter, X } from 'lucide-react'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { getCurrentUser } from '../../services/authService'
import { getPreviewLaporan, downloadExcelLaporan, downloadPdfLaporan, getFakultasList } from '../../services/laporanService'

function LaporanEksekutif() {
  const user = getCurrentUser()
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [fakultasList, setFakultasList] = useState([])
  const [filter, setFilter] = useState({ fakultasId: '', prodiId: '', angkatan: '' })

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
    setFilter({ fakultasId: '', prodiId: '', angkatan: '' })
    setTimeout(loadPreview, 100)
  }

  return (
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content sm:text-3xl">Laporan Eksekutif</h2>
          <p className="mt-1 text-sm text-base-content/60">Preview dan unduh laporan evaluasi sistem SAPS.</p>
        </div>

        {/* Filter & Download */}
        <div className="card bg-base-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-base-content/60" />
            <h3 className="text-sm font-bold text-base-content">Filter Laporan</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select value={filter.fakultasId} onChange={(e) => setFilter((f) => ({ ...f, fakultasId: e.target.value }))}
              className="select">
              <option value="">Semua Fakultas</option>
              {fakultasList.map((f) => <option key={f.id} value={f.id}>{f.nama}</option>)}
            </select>
            <input type="text" value={filter.angkatan} onChange={(e) => setFilter((f) => ({ ...f, angkatan: e.target.value }))}
              placeholder="Angkatan (mis: 2022)"
              className="select" />
            {/* Removed tahunAkademik input */}
            <div className="flex gap-2">
              <button type="button" onClick={loadPreview}
                className="btn btn-primary flex-1 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
                <Eye className="mr-1 inline h-4 w-4" /> Preview
              </button>
              {(filter.fakultasId || filter.angkatan) && (
                <button type="button" onClick={resetFilter}
                  className="rounded-lg border border-brand-dark bg-base-100 px-3 py-2.5 text-sm font-medium text-brand-dark hover:bg-base-200">
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
              <div key={label} className="card bg-base-100 p-4">
                <p className="text-xs font-medium text-base-content/50">{label}</p>
                <p className="mt-1 text-xl font-bold text-base-content">{value}</p>
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
                  <tr className="bg-primary text-primary-content">
                    <th className="px-4 py-3 text-left font-semibold">No</th>
                    <th className="px-4 py-3 text-left font-semibold">Fakultas</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Poin</th>
                    <th className="px-4 py-3 text-right font-semibold">Rata-rata</th>
                    <th className="px-4 py-3 text-right font-semibold">% Lulus</th>
                  </tr>
                </thead>
                <tbody>
                  {komparasi.slice(0, 10).map((item, i) => (
                    <tr key={item.id || i} className="border-b border-base-300 hover:bg-base-200">
                      <td className="px-4 py-3 text-base-content">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-base-content">{item.nama || item.fakultas || '-'}</td>
                      <td className="px-4 py-3 text-right text-base-content">{(item.totalPoin ?? 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-base-content">{(item.rataRataPoin ?? 0).toLocaleString('id-ID')}</td>
                      <td className="px-4 py-3 text-right text-base-content">{item.persentaseLulus != null ? `${item.persentaseLulus}%` : '-'}</td>
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
                  <tr className="bg-primary text-primary-content">
                    <th className="px-4 py-3 text-left font-semibold">Pilar</th>
                    <th className="px-4 py-3 text-right font-semibold">Target Poin</th>
                    <th className="px-4 py-3 text-right font-semibold">Rata-rata Poin</th>
                    <th className="px-4 py-3 text-right font-semibold">Pencapaian</th>
                  </tr>
                </thead>
                <tbody>
                  {capaian.map((c, i) => (
                    <tr key={c.id || i} className="border-b border-base-300 hover:bg-base-200">
                      <td className="px-4 py-3 font-medium text-base-content">{c.pilar || c.nama || '-'}</td>
                      <td className="px-4 py-3 text-right text-base-content">{c.targetPoin ?? '-'}</td>
                      <td className="px-4 py-3 text-right text-base-content">{c.rataRataPoin ?? '-'}</td>
                      <td className="px-4 py-3 text-right text-base-content">{c.persenCapaian != null ? `${c.persenCapaian}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableFrame>
          </TableCard>
        )}

        {loading && (
          <div className="py-12 text-center text-sm text-base-content/50">Memuat data laporan...</div>
        )}
      </div>
  )
}

export default LaporanEksekutif
