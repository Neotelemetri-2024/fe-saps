import { useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import Swal from 'sweetalert2'
import { ArrowLeft } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const ukmfDetailData = {
  no: 1,
  kegiatan: 'Lomba Debat',
  namaUkmf: 'UKMF Debat',
  jenis: 'Lomba',
  skala: 'Nasional',
  tanggal: '8 Feb - 15 Feb 2026',
  penyelenggara: 'Hima Teknologi Informasi Universitas Andalas',
  lokasi: 'Universitas Andalas',
  kuota: 100,
  deskripsi: 'Kegiatan lomba debat tingkat nasional yang diselenggarakan oleh Hima Teknologi Informasi Universitas Andalas.',
  capaian: [
    { label: 'Fondasi', poin: 30 },
    { label: 'Penguatan', poin: 20 },
  ],
  subCapaian: [
    { label: 'Public Speaking', poin: 10 },
    { label: 'Leadership', poin: 10 },
  ],
  totalBobot: 20,
}

function DetailVerifikasiUKMF() {
  const navigate = useNavigate()
  const { id } = useParams()
  const d = ukmfDetailData

  const [statusVerifikasi, setStatusVerifikasi] = useState(null)

  const handleSetujui = () => {
    Swal.fire({
      title: 'Apakah anda yakin menyetujui kegiatan ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'SETUJU',
      confirmButtonColor: '#16a34a',
      cancelButtonText: 'BATAL',
      cancelButtonColor: '#dc2626',
    }).then((result) => {
      if (result.isConfirmed) {
        setStatusVerifikasi('SETUJU')
        Swal.fire({
          icon: 'success',
          title: 'Disetujui!',
          text: `Pengajuan "${d.kegiatan}" telah disetujui.`,
          confirmButtonColor: '#1C4122',
        }).then(() => {
          navigate('/pimpinan-fakultas/verifikasi-pengajuan-ukmf', {
            state: { updatedId: Number(id), newStatus: 'setuju' },
          })
        })
      }
    })
  }

  const handleRevisi = () => {
    Swal.fire({
      title: 'Revisi Pengajuan',
      html: `<textarea id="alasan-revisi" class="swal2-textarea" placeholder="Tuliskan catatan revisi..." rows="4"></textarea>`,
      icon: 'question',
      confirmButtonText: 'Kirim Revisi',
      confirmButtonColor: '#ca8a04',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const alasan = document.getElementById('alasan-revisi').value
        if (!alasan) {
          Swal.showValidationMessage('Harap isi catatan revisi')
        }
        return alasan
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setStatusVerifikasi('REVISI')
        Swal.fire({
          icon: 'info',
          title: 'Revisi Dikirim!',
          text: `Catatan revisi telah dikirim ke UKMF terkait.`,
          confirmButtonColor: '#1C4122',
        }).then(() => {
          navigate('/pimpinan-fakultas/verifikasi-pengajuan-ukmf', {
            state: { updatedId: Number(id), newStatus: 'revisi' },
          })
        })
      }
    })
  }

  const handleTolak = () => {
    Swal.fire({
      title: 'Tolak Pengajuan',
      html: `<textarea id="alasan-tolak" class="swal2-textarea" placeholder="Tuliskan alasan penolakan..." rows="4"></textarea>`,
      icon: 'warning',
      confirmButtonText: 'Tolak Pengajuan',
      confirmButtonColor: '#dc2626',
      showCancelButton: true,
      cancelButtonText: 'Batal',
      preConfirm: () => {
        const alasan = document.getElementById('alasan-tolak').value
        if (!alasan) {
          Swal.showValidationMessage('Harap isi alasan penolakan')
        }
        return alasan
      },
    }).then((result) => {
      if (result.isConfirmed) {
        setStatusVerifikasi('DITOLAK')
        Swal.fire({
          icon: 'error',
          title: 'Ditolak!',
          text: `Pengajuan "${d.kegiatan}" telah ditolak.`,
          confirmButtonColor: '#1C4122',
        }).then(() => {
          navigate('/pimpinan-fakultas/verifikasi-pengajuan-ukmf', {
            state: { updatedId: Number(id), newStatus: 'ditolak' },
          })
        })
      }
    })
  }

  return (
    <DashboardLayout role="pimpinan-fakultas" userName="Dr. Andi Wijaya" userRole="Pimpinan Fakultas">
      <div className="space-y-5">
        {/* Kembali */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail Verifikasi Pengajuan UKMF</h2>

        {/* Detail Kegiatan */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Detail Kegiatan</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Nama Kegiatan</p>
              <p className="mt-1 text-sm font-semibold text-brand-dark">{d.kegiatan}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Jenis</p>
              <p className="mt-1 text-sm text-[#616161]">{d.jenis}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Skala</p>
              <p className="mt-1 text-sm text-[#616161]">{d.skala}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Tanggal</p>
              <p className="mt-1 text-sm text-[#616161]">{d.tanggal}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Penyelenggara</p>
              <p className="mt-1 text-sm text-[#616161]">{d.penyelenggara}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Lokasi</p>
              <p className="mt-1 text-sm text-[#616161]">{d.lokasi}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Kuota</p>
              <p className="mt-1 text-sm text-[#616161]">{d.kuota}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa0a6]">Deskripsi</p>
            <p className="mt-1 text-sm text-[#616161]">{d.deskripsi}</p>
          </div>
        </div>

        {/* Detail Capaian */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Detail Capaian</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {d.capaian.map((c) => (
              <div key={c.label} className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-4 py-3">
                <span className="text-sm font-medium text-[#333]">{c.label}</span>
                <span className="text-sm font-bold text-brand-dark">{c.poin} Poin</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Sub Capaian */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">Detail Sub Capaian</h3>
          <div className="space-y-3">
            {d.subCapaian.map((sc) => (
              <div key={sc.label} className="flex items-center justify-between rounded-lg bg-[#f9fafb] px-4 py-3">
                <span className="text-sm font-medium text-[#333]">{sc.label}</span>
                <span className="text-sm font-bold text-brand-dark">{sc.poin} Poin</span>
              </div>
            ))}
            <div className="flex items-center justify-between rounded-lg border border-brand-dark px-4 py-3">
              <span className="text-sm font-bold text-brand-dark">Total Bobot</span>
              <span className="text-sm font-bold text-brand-dark">{d.totalBobot} Poin</span>
            </div>
          </div>
        </div>

        {/* Status Verifikasi */}
        {statusVerifikasi && (
          <div className="rounded-xl border border-[#e9ebf8] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-brand-dark">Status Verifikasi</h3>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white"
              style={{
                backgroundColor:
                  statusVerifikasi === 'SETUJU' ? '#16a34a' :
                  statusVerifikasi === 'REVISI' ? '#ca8a04' : '#dc2626'
              }}
            >
              {statusVerifikasi === 'SETUJU' && '✓'}
              {statusVerifikasi === 'REVISI' && '↻'}
              {statusVerifikasi === 'DITOLAK' && '✕'}
              {' '}{statusVerifikasi}
            </div>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="flex flex-wrap gap-3">
          <button onClick={handleSetujui} className="rounded-lg bg-green-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700">
            SETUJUI
          </button>
          <button onClick={handleRevisi} className="rounded-lg bg-yellow-500 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-yellow-600">
            REVISI
          </button>
          <button onClick={handleTolak} className="rounded-lg bg-red-600 px-8 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700">
            TOLAK
          </button>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiUKMF