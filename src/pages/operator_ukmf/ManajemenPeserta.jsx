import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { Search, Filter, Download, Upload, ArrowLeft, Info } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import ConfirmModal from '../../components/ui/ConfirmModal'
import {
  getPesertaByKegiatanId,
  updateKehadiran,
  updatePeran,
  submitKlaimPoin,
} from '../../services/pesertaService'
import { getKegiatanById, downloadTemplatePeserta } from '../../services/kegiatanService'
import { getPeranKegiatan } from '../../services/matriksService'

function mapPesertaRow(p, i) {
  const peranId = p.peran?.id ?? p.peranVerifId ?? p.peranId ?? ''
  const hadir = p.kehadiran === true || p.kehadiran === 'Hadir' || p.hadir === true
  return {
    ...p,
    no: i + 1,
    id: p.partisipasiId ?? p.id,
    partisipasiId: p.partisipasiId ?? p.id,
    nama: p.namaMahasiswa || p.nama || '-',
    prodi: p.programStudi || p.prodi || '-',
    fakultas: p.fakultas || '-',
    hadir,
    kehadiran: hadir ? 'Hadir' : 'Tidak Hadir',
    peranVerifId: peranId !== '' && peranId != null ? String(peranId) : '',
  }
}

function ManajemenPeserta() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [pesertaData, setPesertaData] = useState([])
  const [peranOptions, setPeranOptions] = useState([])
  const [kegiatan, setKegiatan] = useState({ nama: 'Kegiatan', tanggal: '', tempat: '' })
  const [loading, setLoading] = useState(true)

  const loadData = () => {
    setLoading(true)
    getKegiatanById(id)
      .then(async (keg) => {
        if (keg) {
          setKegiatan({
            nama: keg.nama || keg.kegiatan || 'Kegiatan',
            tanggal: keg.tgl || keg.tanggal || keg.tanggalMulai || '',
            tempat: keg.lokasi || '',
          })
          const kategoriId = keg.kategoriId || keg.kategori?.id
          if (kategoriId) {
            try {
              const peran = await getPeranKegiatan(kategoriId)
              setPeranOptions(Array.isArray(peran) ? peran : [])
            } catch {
              setPeranOptions([])
            }
          }
        }
        const peserta = await getPesertaByKegiatanId(id)
        setPesertaData((Array.isArray(peserta) ? peserta : []).map(mapPesertaRow))
      })
      .catch((err) => toast.error('Gagal memuat data', { description: err.message }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  const handleKehadiranChange = async (peserta, checked) => {
    try {
      await updateKehadiran(id, peserta.partisipasiId || peserta.id, checked, peserta.peranVerifId)
      setPesertaData((prev) =>
        prev.map((p) =>
          p.id === peserta.id
            ? { ...p, hadir: checked, kehadiran: checked ? 'Hadir' : 'Tidak Hadir' }
            : p,
        ),
      )
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    }
  }

  const handlePeranChange = async (peserta, value) => {
    try {
      await updatePeran(id, peserta.partisipasiId || peserta.id, value, peserta.hadir)
      setPesertaData((prev) =>
        prev.map((p) => (p.id === peserta.id ? { ...p, peranVerifId: value } : p)),
      )
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    }
  }

  const handleSubmitKlaim = async () => {
    setShowSubmitModal(false)
    try {
      await submitKlaimPoin(id)
      toast.success('Berhasil!', {
        description: 'Data peserta berhasil dikirim untuk klaim poin.',
      })
    } catch (err) {
      toast.error('Gagal', { description: err.message })
    }
  }

  const total = pesertaData.length
  const hadir = pesertaData.filter((p) => p.hadir).length
  const tidakHadir = total - hadir

  return (
    <DashboardLayout role="operator_ukmf" userName="Operator UKMF" userRole="Operator UKMF">
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Manajemen Dan Verifikasi Kegiatan</h2>
          <p className="mt-1 text-sm text-[#616161]">{kegiatan.nama} - {kegiatan.tanggal} - {kegiatan.tempat}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Terdaftar" value={total} color="green" />
          <StatCard label="Hadir" value={hadir} color="green" />
          <StatCard label="Tidak Hadir" value={tidakHadir} color="green" />
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
          <Info className="h-5 w-5" />
          UKMF hanya dapat mengelola daftar peserta dan kehadiran. Bobot poin ditentukan oleh Admin Fakultas dan Pimpinan Fakultas.
        </div>

        <ConfirmModal
          isOpen={showSubmitModal}
          message="Apakah kamu yakin ingin mengirim data kehadiran dan peran peserta untuk diklaim poin?"
          confirmText="Ya, Kirim"
          cancelText="Batal"
          onConfirm={handleSubmitKlaim}
          onCancel={() => setShowSubmitModal(false)}
        />

        <div>
          <div className="flex flex-col gap-2 mb-1 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-brand-dark">Daftar Peserta ({pesertaData.length})</h3>
            <div className="flex items-center space-x-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-3 py-2 text-sm font-semibold text-white">
                <Filter className="h-4 w-4" /> Filter
              </button>
            </div>
          </div>
          <p className="mb-4 text-sm text-[#616161]">Cari dan kelola kehadiran peserta pada kegiatan ini</p>

          <div className="flex flex-col gap-3 lg:flex-row mb-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input type="text" placeholder="Cari mahasiswa atau kegiatan..." className="w-full text-sm outline-none" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => downloadTemplatePeserta(id).catch((err) => toast.error('Gagal download template', { description: err.message }))}
                className="inline-flex items-center gap-2 rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161]"
              >
                <Download className="h-4 w-4" /> Unduh Template
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161]">
                <Upload className="h-4 w-4" /> Import File
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">NIM</th>
                    <th className="px-4 py-3">Nama Mahasiswa</th>
                    <th className="px-4 py-3">Fakultas</th>
                    <th className="px-4 py-3">Program Studi</th>
                    <th className="px-4 py-3 text-center">Kehadiran</th>
                    <th className="px-4 py-3">Peran</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-[#9aa0a6]">Memuat data…</td></tr>
                  ) : pesertaData.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-[#9aa0a6]">Tidak ada peserta.</td></tr>
                  ) : pesertaData.map((peserta) => (
                    <tr key={peserta.id} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 text-[#616161]">{peserta.no}</td>
                      <td className="px-4 py-3 font-medium text-[#333]">{peserta.nim}</td>
                      <td className="px-4 py-3 text-[#616161]">{peserta.nama}</td>
                      <td className="px-4 py-3 text-[#616161]">{peserta.fakultas}</td>
                      <td className="px-4 py-3 text-[#616161]">{peserta.prodi}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={!!peserta.hadir}
                          onChange={(e) => handleKehadiranChange(peserta, e.target.checked)}
                          className="h-4 w-4 cursor-pointer accent-brand-dark"
                        />
                      </td>
                      <td className="px-4 py-3 text-[#616161]">
                        <select
                          value={peserta.peranVerifId || ''}
                          onChange={(e) => handlePeranChange(peserta, e.target.value)}
                          className="rounded-md border border-[#e9ebf8] p-1.5 text-xs text-[#333] outline-none focus:border-brand-dark"
                        >
                          <option value="">Pilih Peran</option>
                          {peranOptions.map((opt) => (
                            <option key={opt.id} value={String(opt.id)}>{opt.nama}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
            >
              Submit untuk Klaim Poin Peserta
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenPeserta
