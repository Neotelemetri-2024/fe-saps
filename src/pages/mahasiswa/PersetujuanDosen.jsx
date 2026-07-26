import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getPersetujuanMahasiswa, subscribeDataUpdate } from '../../services/pengajuanService'
import { getCurrentUser } from '../../services/authService'

function formatTanggal(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch {
    return String(value)
  }
}

/**
 * Normalise data dari /api/mahasiswa/izin-pa
 * BE response format:
 * {
 *   id, statusIzin, alasanDitolak, tanggalDiajukan,
 *   kegiatan: { id, nama, kategori, penyelenggara, tanggalMulai },
 *   peran: string
 * }
 */
function normalizeIzinPA(item, i = 0) {
  const kegiatan = typeof item.kegiatan === 'object' && item.kegiatan ? item.kegiatan : {}
  const statusRaw = (item.statusIzin || item.status || 'diajukan').toLowerCase()
  // Map status BE ke label UI
  let statusUI = statusRaw
  if (statusRaw === 'diajukan') statusUI = 'pending'
  else if (statusRaw === 'disetujui') statusUI = 'disetujui'
  else if (statusRaw === 'ditolak') statusUI = 'ditolak'
  else if (statusRaw === 'revisi') statusUI = 'revisi'

  return {
    id: item.id ?? i,
    kegiatan: kegiatan.nama || item.namaKegiatan || item.kegiatan || '-',
    jenis: kegiatan.kategori || item.jenis || '-',
    peran: item.peran || '-',
    penyelenggara: kegiatan.penyelenggara || item.penyelenggara || '-',
    tanggal: formatTanggal(kegiatan.tanggalMulai || item.tanggalDiajukan || item.tanggal),
    status: statusUI,
    alasan: item.alasanDitolak || item.alasan || null,
  }
}

function PersetujuanDosen() {
  const user = getCurrentUser()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const load = () => {
    setLoading(true)
    getPersetujuanMahasiswa()
      .then((res) => {
        const items = Array.isArray(res) ? res : []
        setData(items.map(normalizeIzinPA))
      })
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    return subscribeDataUpdate((detail) => {
      if (!detail?.type || detail.type === 'persetujuan') load()
    })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((row) => {
      if (filterStatus && row.status !== filterStatus) return false
      if (!q) return true
      return (
        row.kegiatan.toLowerCase().includes(q) ||
        row.penyelenggara.toLowerCase().includes(q) ||
        row.jenis.toLowerCase().includes(q)
      )
    })
  }, [data, search, filterStatus])

  const statusOptions = [
    { value: 'pending', label: 'Menunggu' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'revisi', label: 'Revisi' },
  ]

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">Persetujuan Dosen PA</h2>
          <p className="mt-1 text-sm text-[#616161]">
            Daftar permintaan izin kegiatan yang sudah dikirim ke Dosen Pembimbing Akademik.
          </p>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 sm:p-6 shadow-sm">
          <h3 className="text-base font-bold text-brand-dark sm:text-lg">
            Kegiatan yang telah diajukan ke Dosen PA
          </h3>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
              <Search className="h-4 w-4 text-[#616161]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kegiatan..."
                className="flex-1 text-sm outline-none"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-[#e9ebf8] px-3 py-2 text-sm text-[#333] outline-none"
            >
              <option value="">Semua Status</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {(search || filterStatus) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setFilterStatus('') }}
                className="text-xs font-medium text-[#616161] hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            {loading ? (
              <p className="py-8 text-center text-sm text-[#9aa0a6]">Memuat data…</p>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-[#9aa0a6]">
                  {data.length === 0
                    ? 'Belum ada permintaan izin ke Dosen PA.'
                    : 'Tidak ada data yang sesuai filter.'}
                </p>
                {data.length === 0 && (
                  <p className="mt-1 text-xs text-[#c0c0c0]">
                    Centang kegiatan yang sudah disetujui di halaman Daftar Pengajuan, lalu klik "Minta Persetujuan Dosen PA".
                  </p>
                )}
              </div>
            ) : (
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-3">NO</th>
                    <th className="px-4 py-3">KEGIATAN</th>
                    <th className="px-4 py-3">JENIS</th>
                    <th className="px-4 py-3">PERAN</th>
                    <th className="px-4 py-3">PENYELENGGARA</th>
                    <th className="px-4 py-3">TANGGAL</th>
                    <th className="px-4 py-3">STATUS</th>
                    <th className="px-4 py-3">KETERANGAN</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr
                      key={row.id}
                      className={`border-b border-[#e9ebf8] last:border-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'}`}
                    >
                      <td className="px-4 py-3 text-[#616161]">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-[#333]">{row.kegiatan}</td>
                      <td className="px-4 py-3 text-[#616161]">{row.jenis}</td>
                      <td className="px-4 py-3 text-[#616161]">{row.peran}</td>
                      <td className="px-4 py-3 text-[#616161]">{row.penyelenggara}</td>
                      <td className="px-4 py-3 text-[#616161]">{row.tanggal}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        {row.status === 'ditolak' || row.status === 'revisi' ? (
                          <button
                            type="button"
                            onClick={() =>
                              toast.info(
                                row.status === 'revisi' ? 'Catatan Revisi' : 'Alasan Penolakan',
                                { description: row.alasan || 'Tidak ada keterangan.' }
                              )
                            }
                            className="text-sm font-medium text-red-600 underline hover:text-red-800"
                          >
                            Lihat Catatan
                          </button>
                        ) : row.status === 'disetujui' ? (
                          <span className="text-sm font-medium text-green-600">Disetujui Dosen PA ✓</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Menunggu</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PersetujuanDosen
