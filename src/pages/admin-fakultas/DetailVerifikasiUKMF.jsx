import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, X, FileText, Users } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const DUMMY_DETAIL = {
  1: {
    id: 1,
    kegiatan: 'Lomba Hackathon',
    namaUKMF: 'Hima FT UNAND',
    jenis: 'Kompetisi',
    skala: 'Nasional',
    tanggal: '12 Feb – 14 Feb 2026',
    lokasi: 'Universitas Andalas, Padang',
    deskripsi: 'Lomba Hackathon Nasional yang diikuti oleh mahasiswa dari berbagai universitas di Indonesia. Peserta ditantang untuk membuat solusi inovatif berbasis teknologi dalam waktu 48 jam.',
    dokumen: 'proposal_lomba_hackathon.pdf',
    poinDiajukan: 30,
    status: 'Pending',
    peserta: [
      { nim: '2210111001', nama: 'Ahmad Fauzi', prodi: 'Teknik Informatika', jabatan: 'Ketua Tim' },
      { nim: '2210111002', nama: 'Siti Aisyah', prodi: 'Sistem Informasi', jabatan: 'Anggota' },
      { nim: '2210111003', nama: 'Budi Santoso', prodi: 'Teknik Elektro', jabatan: 'Anggota' },
    ],
  },
  2: {
    id: 2,
    kegiatan: 'Lomba AI & Teknologi',
    namaUKMF: 'Hima FT UNAND',
    jenis: 'Kompetisi',
    skala: 'Nasional',
    tanggal: '12 Feb – 14 Feb 2026',
    lokasi: 'ITB, Bandung',
    deskripsi: 'Lomba kecerdasan buatan dan teknologi tingkat nasional.',
    dokumen: 'proposal_ai_teknologi.pdf',
    poinDiajukan: 25,
    status: 'Pending',
    peserta: [
      { nim: '2210111004', nama: 'Rina Kusuma', prodi: 'Teknik Informatika', jabatan: 'Ketua Tim' },
      { nim: '2210111005', nama: 'Doni Prasetyo', prodi: 'Sistem Informasi', jabatan: 'Anggota' },
    ],
  },
}

function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-5 gap-2 border-b border-[#f0f0f0] py-3 last:border-0">
      <dt className="col-span-2 text-sm font-semibold text-[#666]">{label}</dt>
      <dd className="col-span-3 text-sm text-[#333]">{value}</dd>
    </div>
  )
}

function ActionModal({ isOpen, type, onConfirm, onClose }) {
  const [catatan, setCatatan] = useState('')
  if (!isOpen) return null

  const cfg = {
    setuju: { title: 'Setujui Pengajuan', msg: 'Apakah kamu yakin ingin menyetujui dan meneruskan pengajuan ini ke Pimpinan Fakultas?', btnClass: 'bg-gradient-to-r from-brand-dark to-brand-light', btnLabel: 'Setujui & Teruskan', withNotes: false },
    tolak: { title: 'Tolak Pengajuan', msg: 'Apakah kamu yakin ingin menolak pengajuan ini?', btnClass: 'bg-red-500 hover:bg-red-600', btnLabel: 'Tolak', withNotes: true },
    revisi: { title: 'Minta Revisi', msg: 'Tambahkan catatan untuk UKMF terkait revisi yang diperlukan.', btnClass: 'bg-orange-500 hover:bg-orange-600', btnLabel: 'Kirim Revisi', withNotes: true },
  }
  const c = cfg[type] ?? cfg.setuju

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#222]">{c.title}</h4>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#333]"><X className="h-4 w-4" /></button>
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
          <button type="button" onClick={onClose} className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#444] hover:bg-[#f5f5f5]">Batal</button>
          <button
            type="button"
            onClick={() => onConfirm(catatan)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${c.btnClass} hover:opacity-90`}
          >
            {c.btnLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

const statusStyle = {
  Pending: 'bg-yellow-100 text-yellow-600 border border-yellow-300',
  Disetujui: 'bg-green-100 text-green-700 border border-green-300',
  Ditolak: 'bg-red-100 text-red-600 border border-red-300',
  Revisi: 'bg-orange-100 text-orange-600 border border-orange-300',
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
    <DashboardLayout role="admin-fakultas" userName="Nouval Rafiif Irwan" userRole="Operator UKM">
      <ActionModal isOpen={modal !== null} type={modal} onConfirm={handleConfirm} onClose={() => setModal(null)} />

      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate('/admin-fakultas/verifikasi-pengajuan-ukmf')}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Verifikasi
        </button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Detail Pengajuan Kegiatan</h2>
            <p className="mt-1 text-sm text-[#616161]">{detail.namaUKMF}</p>
          </div>
          <span className={`inline-flex items-center gap-1 self-start rounded-full px-3 py-1 text-xs font-bold ${statusStyle[status]}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
          </span>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Info kegiatan */}
          <div className="lg:col-span-2 space-y-5">
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#222]">
                <FileText className="h-4 w-4 text-brand-dark" /> Informasi Kegiatan
              </h3>
              <dl>
                <InfoRow label="Nama Kegiatan" value={detail.kegiatan} />
                <InfoRow label="UKMF Penyelenggara" value={detail.namaUKMF} />
                <InfoRow label="Jenis Kegiatan" value={detail.jenis} />
                <InfoRow label="Skala" value={detail.skala} />
                <InfoRow label="Tanggal Pelaksanaan" value={detail.tanggal} />
                <InfoRow label="Lokasi" value={detail.lokasi} />
                <InfoRow label="Poin Diajukan" value={`${detail.poinDiajukan} poin`} />
                <InfoRow label="Dokumen" value={
                  <a href="#" className="inline-flex items-center gap-1.5 text-brand-dark underline hover:opacity-80">
                    <FileText className="h-3.5 w-3.5" /> {detail.dokumen}
                  </a>
                } />
              </dl>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-[#222]">Deskripsi Kegiatan</h3>
              <p className="text-sm leading-relaxed text-[#555]">{detail.deskripsi}</p>
            </div>

            {/* Daftar peserta */}
            <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b border-[#e5e7eb] px-6 py-4">
                <Users className="h-4 w-4 text-brand-dark" />
                <h3 className="text-sm font-bold text-[#222]">Daftar Peserta ({detail.peserta.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NIM</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NAMA</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">PROGRAM STUDI</th>
                      <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">JABATAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0]">
                    {detail.peserta.map((p) => (
                      <tr key={p.nim} className="hover:bg-[#f9fafb]">
                        <td className="px-4 py-3 text-[#616161]">{p.nim}</td>
                        <td className="px-4 py-3 font-medium text-[#333]">{p.nama}</td>
                        <td className="px-4 py-3 text-[#616161]">{p.prodi}</td>
                        <td className="px-4 py-3 text-[#616161]">{p.jabatan}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Panel aksi */}
          <div className="space-y-4">
            {status === 'Pending' && (
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-[#222]">Tindakan Verifikasi</h3>
                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => setModal('setuju')}
                    className="w-full rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Setujui & Teruskan ke Pimpinan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal('revisi')}
                    className="w-full rounded-lg border border-orange-400 py-2.5 text-sm font-semibold text-orange-500 hover:bg-orange-50"
                  >
                    Minta Revisi
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal('tolak')}
                    className="w-full rounded-lg border border-red-400 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    Tolak
                  </button>
                </div>
              </div>
            )}

            {status !== 'Pending' && (
              <div className={`rounded-xl border p-5 ${
                status === 'Disetujui' ? 'border-green-200 bg-green-50' :
                status === 'Ditolak' ? 'border-red-200 bg-red-50' :
                'border-orange-200 bg-orange-50'
              }`}>
                <p className={`text-sm font-semibold ${
                  status === 'Disetujui' ? 'text-green-700' :
                  status === 'Ditolak' ? 'text-red-600' :
                  'text-orange-600'
                }`}>
                  {status === 'Disetujui' ? 'Pengajuan ini telah disetujui dan diteruskan ke Pimpinan Fakultas.' :
                   status === 'Ditolak' ? 'Pengajuan ini telah ditolak.' :
                   'Revisi telah diminta dari UKMF.'}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold text-[#222]">Ringkasan</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#666]">UKMF</span>
                  <span className="font-semibold text-[#333]">{detail.namaUKMF}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Skala</span>
                  <span className="font-semibold text-[#333]">{detail.skala}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Total Peserta</span>
                  <span className="font-semibold text-[#333]">{detail.peserta.length} orang</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Poin</span>
                  <span className="font-semibold text-brand-dark">{detail.poinDiajukan} poin</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default DetailVerifikasiUKMF
