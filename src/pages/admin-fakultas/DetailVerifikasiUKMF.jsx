import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const DUMMY_DETAIL = {
  1: {
    id: 1,
    kegiatan: 'Lomba Hackathon',
    jenis: 'Kompetisi',
    skala: 'Nasional',
    tanggal: '12 – 13 Feb 2026',
    penyelenggara: 'Hima FTI Unand',
    lokasi: 'Seminar PKM',
    kuota: 100,
    deskripsi: 'Hackathon merupakan kompetisi di bidang teknologi yang mempertemukan peserta untuk merancang dan mengembangkan sebuah solusi digital, seperti aplikasi, website, atau sistem informasi, dalam kurun waktu tertentu. Kegiatan ini bertujuan mengasah kemampuan pemrograman, desain, analisis masalah, kolaborasi tim, serta kemampuan presentasi di hadapan dewan juri.',
    capaian: ['Fondasi', 'Penguatan'],
    subCapaian: [
      { label: 'Public Speaking', pct: 30 },
      { label: 'Leadership', pct: 40 },
    ],
    status: 'Pending',
  },
  2: {
    id: 2,
    kegiatan: 'Lomba AI & Teknologi',
    jenis: 'Kompetisi',
    skala: 'Nasional',
    tanggal: '12 Feb – 14 Feb 2026',
    penyelenggara: 'Hima FTI Unand',
    lokasi: 'ITB, Bandung',
    kuota: 50,
    deskripsi: 'Lomba kecerdasan buatan dan teknologi tingkat nasional.',
    capaian: ['Kemahasiswaan'],
    subCapaian: [
      { label: 'Inovasi', pct: 50 },
      { label: 'Kerja Tim', pct: 50 },
    ],
    status: 'Pending',
  },
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-4 py-2">
      <dt className="w-40 shrink-0 text-sm text-[#888]">{label}</dt>
      <dd className="flex-1 text-sm text-[#222]">{value}</dd>
    </div>
  )
}

function ActionModal({ isOpen, type, onConfirm, onClose }) {
  const [catatan, setCatatan] = useState('')
  if (!isOpen) return null

  const cfg = {
    setuju: {
      title: 'Setujui Pengajuan',
      msg: 'Apakah kamu yakin ingin menyetujui dan meneruskan pengajuan ini ke Pimpinan Fakultas?',
      btnClass: 'bg-gradient-to-r from-brand-dark to-brand-light',
      btnLabel: 'Setujui & Teruskan',
      withNotes: false,
    },
    tolak: {
      title: 'Tolak Pengajuan',
      msg: 'Apakah kamu yakin ingin menolak pengajuan ini?',
      btnClass: 'bg-red-600',
      btnLabel: 'Tolak',
      withNotes: true,
    },
    revisi: {
      title: 'Minta Revisi',
      msg: 'Tambahkan catatan untuk UKMF terkait revisi yang diperlukan.',
      btnClass: 'bg-orange-500',
      btnLabel: 'Kirim Revisi',
      withNotes: true,
    },
  }
  const c = cfg[type] ?? cfg.setuju

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#222]">{c.title}</h4>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#333]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-3 text-sm text-[#555]">{c.msg}</p>
        {c.withNotes && (
          <textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan (opsional)..."
            rows={3}
            className="w-full resize-none rounded-lg border border-[#d1d5db] px-3 py-2 text-sm outline-none focus:border-brand-dark"
          />
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#444] hover:bg-[#f5f5f5]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => onConfirm(catatan)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 ${c.btnClass}`}
          >
            {c.btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailVerifikasiUKMF() {
  const { id } = useParams()
  const navigate = useNavigate()
  const detail = DUMMY_DETAIL[id] ?? DUMMY_DETAIL[1]
  const [status, setStatus] = useState(detail.status)
  const [modal, setModal] = useState(null)

  function handleConfirm(catatan) {
    if (modal === 'setuju') {
      setStatus('Disetujui')
      toast.success('Pengajuan disetujui dan diteruskan ke Pimpinan Fakultas!')
    } else if (modal === 'tolak') {
      setStatus('Ditolak')
      toast.error(`Pengajuan ditolak.${catatan ? ` Catatan: ${catatan}` : ''}`)
    } else if (modal === 'revisi') {
      setStatus('Revisi')
      toast.info(`Revisi diminta.${catatan ? ` Catatan: ${catatan}` : ''}`)
    }
    setModal(null)
  }

  return (
    <DashboardLayout role="admin-fakultas" userName="Nouval Rafiif Irwan" userRole="Operator Admin Fakultas">
      <ActionModal isOpen={modal !== null} type={modal} onConfirm={handleConfirm} onClose={() => setModal(null)} />

      <div className="space-y-5">
        <button
          type="button"
          onClick={() => navigate('/admin-fakultas/verifikasi-pengajuan-ukmf')}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl">Detail</h2>

        {/* Main card */}
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
          {/* Kegiatan */}
          <h3 className="mb-3 text-base font-bold text-[#222]">Kegiatan</h3>
          <dl className="mb-6">
            <InfoRow label="Nama Kegiatan" value={detail.kegiatan} />
            <InfoRow label="Jenis Kegiatan" value={detail.jenis} />
            <InfoRow label="Skala" value={detail.skala} />
            <InfoRow label="Tanggal" value={detail.tanggal} />
            <InfoRow label="Penyelenggara" value={detail.penyelenggara} />
            <InfoRow label="Lokasi" value={detail.lokasi} />
            <InfoRow label="Kuota Peserta" value={detail.kuota} />
            <InfoRow label="Deskripsi Kegiatan" value={
              <span className="leading-relaxed">{detail.deskripsi}</span>
            } />
          </dl>

          {/* Capaian */}
          <h3 className="mb-2 text-base font-bold text-[#222]">Capaian</h3>
          <div className="mb-6 flex flex-wrap gap-2">
            {detail.capaian.map((c) => (
              <span key={c} className="text-sm text-[#444]">{c}</span>
            ))}
          </div>

          {/* Sub Capaian */}
          <h3 className="mb-3 text-base font-bold text-[#222]">Sub Capaian</h3>
          <dl>
            {detail.subCapaian.map((s) => (
              <div key={s.label} className="flex gap-4 py-2">
                <dt className="w-40 shrink-0 text-sm text-[#888]">{s.label}</dt>
                <dd className="text-sm text-[#222]">{s.pct}%</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Action buttons */}
        {status === 'Pending' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setModal('setuju')}
              className="rounded-xl bg-gradient-to-r from-brand-dark to-brand-light py-3.5 text-sm font-bold text-white transition hover:opacity-90"
            >
              SETUJU
            </button>
            <button
              type="button"
              onClick={() => setModal('revisi')}
              className="rounded-xl bg-orange-400 py-3.5 text-sm font-bold text-white transition hover:bg-orange-500"
            >
              REVISI
            </button>
            <button
              type="button"
              onClick={() => setModal('tolak')}
              className="rounded-xl bg-red-700 py-3.5 text-sm font-bold text-white transition hover:bg-red-800"
            >
              TOLAK
            </button>
          </div>
        ) : (
          <div className={`rounded-xl border p-5 ${
            status === 'Disetujui' ? 'border-green-200 bg-green-50' :
            status === 'Ditolak'   ? 'border-red-200 bg-red-50' :
            'border-orange-200 bg-orange-50'
          }`}>
            <p className={`text-sm font-semibold ${
              status === 'Disetujui' ? 'text-green-700' :
              status === 'Ditolak'   ? 'text-red-600' :
              'text-orange-600'
            }`}>
              {status === 'Disetujui' ? 'Pengajuan ini telah disetujui dan diteruskan ke Pimpinan Fakultas.' :
               status === 'Ditolak'   ? 'Pengajuan ini telah ditolak.' :
               'Revisi telah diminta dari UKMF.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiUKMF
