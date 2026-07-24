import { useState, useRef, useEffect } from 'react'
import { Plus, MoreVertical, Pencil, Trash2, BookOpen, AlignJustify } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'

const DUMMY_KURIKULUM = [
  {
    id: 'kur-1',
    nama: 'Kurikulum Merdeka 2026',
    tahun: '2024/2025',
    status: 'aktif',
    capaian: [
      {
        id: 'cap-1',
        label: 'Pondasi',
        subCapaian: [
          { id: 'sc-1', nama: 'Growth Mindset & Resiliensi', presentasi: 25, bobot: '' },
          { id: 'sc-2', nama: 'Religion Character Development', presentasi: 25, bobot: '' },
          { id: 'sc-3', nama: 'Digital Literacy (Literasi Digital)', presentasi: 25, bobot: '' },
          { id: 'sc-4', nama: 'Public Speaking & Habit Mastery (Bakti)', presentasi: 25, bobot: '' },
        ],
      },
      {
        id: 'cap-2',
        label: 'Penguatan',
        subCapaian: [
          { id: 'sc-5', nama: 'Agile Teamwork & Empathy', presentasi: 30, bobot: '' },
          { id: 'sc-6', nama: 'Creativity, Ideation & Innovation', presentasi: 35, bobot: '' },
          { id: 'sc-7', nama: 'Academic Writing & Presentation Skills', presentasi: 35, bobot: '' },
        ],
      },
      {
        id: 'cap-3',
        label: 'Pemantapan',
        subCapaian: [
          { id: 'sc-8', nama: 'Global Exposure & Research Planning', presentasi: 40, bobot: '' },
          { id: 'sc-9', nama: 'Adaptive Leadership & Strategic Management', presentasi: 30, bobot: '' },
          { id: 'sc-10', nama: 'Entrepreneurship Skills (P2MW / KBMK)', presentasi: 30, bobot: '' },
        ],
      },
      {
        id: 'cap-4',
        label: 'Aktualisasi',
        subCapaian: [
          { id: 'sc-11', nama: 'Networking Skills & Cultural Intelligence', presentasi: 50, bobot: '' },
          { id: 'sc-12', nama: 'Pembekalan Pasca Kampus & English Skills', presentasi: 50, bobot: '' },
        ],
      },
    ],
  },
  {
    id: 'kur-2',
    nama: 'Kurikulum Berjenjang 2024',
    tahun: '2022/2023',
    status: 'nonaktif',
    capaian: [],
  },
]

function MenuKurikulum({ onHapus }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="rounded p-1 hover:bg-[#f0f0f0]"
      >
        <MoreVertical className="h-4 w-4 text-[#616161]" />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-20 min-w-[130px] rounded-lg border border-[#e9ebf8] bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); onHapus() }}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  )
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange() }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-brand-dark' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function ManajemenKurikulum() {
  const [kurikulum, setKurikulum] = useState(DUMMY_KURIKULUM)
  const [activeKurId, setActiveKurId] = useState('kur-1')

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [showTambahKurikulum, setShowTambahKurikulum] = useState(false)
  const [kurForm, setKurForm] = useState({ tahun: '', nama: '' })

  const [showTambahCapaian, setShowTambahCapaian] = useState(false)
  const [namaCapaian, setNamaCapaian] = useState('')

  const [showTambahSubCapaian, setShowTambahSubCapaian] = useState(false)
  const [subCapaianForm, setSubCapaianForm] = useState({ capaianId: '', nama: '', presentasi: '', bobot: '' })

  const [editSubCapaian, setEditSubCapaian] = useState(null)

  const [showHapusCapaianConfirm, setShowHapusCapaianConfirm] = useState(false)
  const [hapusCapaianTarget, setHapusCapaianTarget] = useState(null)

  const [showHapusSubCapaianConfirm, setShowHapusSubCapaianConfirm] = useState(false)
  const [hapusSubCapaianTarget, setHapusSubCapaianTarget] = useState(null)

  const activeKur = kurikulum.find((k) => k.id === activeKurId) || null

  const handleNonaktif = (id) => {
    setKurikulum((prev) =>
      prev.map((k) => k.id === id ? { ...k, status: k.status === 'aktif' ? 'nonaktif' : 'aktif' } : k)
    )
    toast.success('Status kurikulum diperbarui.')
  }

  const handleHapus = (id, nama) => {
    setDeleteTarget({ id, nama })
    setShowDeleteConfirm(true)
  }

  const confirmHapus = () => {
    setKurikulum((prev) => prev.filter((k) => k.id !== deleteTarget.id))
    if (activeKurId === deleteTarget.id) setActiveKurId(null)
    setShowDeleteConfirm(false)
    setDeleteTarget(null)
    toast.success('Kurikulum dihapus.')
  }

  const handleTambahKurikulum = () => {
    if (!kurForm.nama.trim()) { toast.error('Nama kurikulum tidak boleh kosong.'); return }
    if (!kurForm.tahun.trim()) { toast.error('Tahun tidak boleh kosong.'); return }
    const id = `kur-${Date.now()}`
    const newKur = { id, nama: kurForm.nama.trim(), tahun: kurForm.tahun.trim(), status: 'aktif', capaian: [] }
    setKurikulum((prev) => [...prev, newKur])
    setActiveKurId(id)
    toast.success('Kurikulum berhasil ditambahkan.')
    setKurForm({ tahun: '', nama: '' })
    setShowTambahKurikulum(false)
  }

  const handleTambahCapaian = () => {
    if (!namaCapaian.trim()) { toast.error('Nama capaian tidak boleh kosong.'); return }
    const id = `cap-${Date.now()}`
    setKurikulum((prev) =>
      prev.map((k) =>
        k.id === activeKurId
          ? { ...k, capaian: [...k.capaian, { id, label: namaCapaian.trim(), subCapaian: [] }] }
          : k
      )
    )
    toast.success('Capaian ditambahkan.')
    setNamaCapaian('')
    setShowTambahCapaian(false)
  }

  const handleTambahSubCapaian = () => {
    if (!subCapaianForm.capaianId) { toast.error('Pilih capaian terlebih dahulu.'); return }
    if (!subCapaianForm.nama.trim()) { toast.error('Nama sub capaian tidak boleh kosong.'); return }
    const id = `sc-${Date.now()}`
    setKurikulum((prev) =>
      prev.map((k) =>
        k.id === activeKurId
          ? {
              ...k,
              capaian: k.capaian.map((c) =>
                c.id === subCapaianForm.capaianId
                  ? {
                      ...c,
                      subCapaian: [...c.subCapaian, {
                        id,
                        nama: subCapaianForm.nama.trim(),
                        presentasi: Number(subCapaianForm.presentasi) || 0,
                        bobot: subCapaianForm.bobot,
                      }],
                    }
                  : c
              ),
            }
          : k
      )
    )
    toast.success('Sub capaian ditambahkan.')
    setSubCapaianForm({ capaianId: '', nama: '', presentasi: '', bobot: '' })
    setShowTambahSubCapaian(false)
  }

  const handleEditSubCapaian = () => {
    if (!editSubCapaian.nama.trim()) { toast.error('Nama sub capaian tidak boleh kosong.'); return }
    setKurikulum((prev) =>
      prev.map((k) =>
        k.id === activeKurId
          ? {
              ...k,
              capaian: k.capaian.map((c) => ({
                ...c,
                subCapaian: c.subCapaian.map((sc) =>
                  sc.id === editSubCapaian.id
                    ? { ...sc, nama: editSubCapaian.nama, presentasi: Number(editSubCapaian.presentasi) || 0, bobot: editSubCapaian.bobot }
                    : sc
                ),
              })),
            }
          : k
      )
    )
    toast.success('Sub capaian diperbarui.')
    setEditSubCapaian(null)
  }

  const handleHapusSubCapaian = (sc) => {
    setHapusSubCapaianTarget(sc)
    setShowHapusSubCapaianConfirm(true)
  }

  const confirmHapusSubCapaian = () => {
    setKurikulum((prev) =>
      prev.map((k) =>
        k.id === activeKurId
          ? { ...k, capaian: k.capaian.map((c) => ({ ...c, subCapaian: c.subCapaian.filter((sc) => sc.id !== hapusSubCapaianTarget.id) })) }
          : k
      )
    )
    toast.success('Sub capaian dihapus.')
    setShowHapusSubCapaianConfirm(false)
    setHapusSubCapaianTarget(null)
  }

  const handleHapusCapaian = (cap) => {
    setHapusCapaianTarget(cap)
    setShowHapusCapaianConfirm(true)
  }

  const confirmHapusCapaian = () => {
    setKurikulum((prev) =>
      prev.map((k) =>
        k.id === activeKurId
          ? { ...k, capaian: k.capaian.filter((c) => c.id !== hapusCapaianTarget.id) }
          : k
      )
    )
    toast.success('Capaian dihapus.')
    setShowHapusCapaianConfirm(false)
    setHapusCapaianTarget(null)
  }

  return (
    <DashboardLayout role="pimpinan-ditmawa" userName="Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T" userRole="Pimpinan">
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={`Hapus "${deleteTarget?.nama}"?`}
        message="Tindakan ini tidak dapat dibatalkan."
        confirmText="HAPUS"
        cancelText="BATAL"
        onConfirm={confirmHapus}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <ConfirmModal
        isOpen={showHapusCapaianConfirm}
       
        message={`Apakah Anda yakin ingin menghapus capaian "${hapusCapaianTarget?.label}"? Semua sub capaian di dalamnya juga akan ikut terhapus.`}
        confirmText="HAPUS"
        cancelText="BATAL"
        onConfirm={confirmHapusCapaian}
        onCancel={() => setShowHapusCapaianConfirm(false)}
      />

      <ConfirmModal
        isOpen={showHapusSubCapaianConfirm}
       
        message={`Apakah Anda yakin ingin menghapus sub capaian "${hapusSubCapaianTarget?.nama}"?`}
        confirmText="HAPUS"
        cancelText="BATAL"
        onConfirm={confirmHapusSubCapaian}
        onCancel={() => setShowHapusSubCapaianConfirm(false)}
      />

      {/* Modal Tambah Kurikulum */}
      <Modal isOpen={showTambahKurikulum} onClose={() => setShowTambahKurikulum(false)}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Tahun</label>
            <input
              type="text"
              value={kurForm.tahun}
              onChange={(e) => setKurForm((p) => ({ ...p, tahun: e.target.value }))}
              placeholder="Contoh: 2025/2026"
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Nama</label>
            <input
              type="text"
              value={kurForm.nama}
              onChange={(e) => setKurForm((p) => ({ ...p, nama: e.target.value }))}
              placeholder="Contoh: Kurikulum Merdeka 2025"
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={handleTambahKurikulum}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2.5 text-sm font-bold text-white hover:opacity-90">
            Simpan
          </button>
          <button type="button" onClick={() => setShowTambahKurikulum(false)}
            className="rounded-lg border border-[#d9dce7] px-6 py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]">
            Batal
          </button>
        </div>
      </Modal>

      {/* Modal Tambah Capaian */}
      <Modal isOpen={showTambahCapaian} onClose={() => setShowTambahCapaian(false)}>
        <label className="mb-1 block text-sm font-medium text-[#333]">Nama Capaian <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={namaCapaian}
          onChange={(e) => setNamaCapaian(e.target.value)}
          placeholder="Contoh: Pemantapan"
          className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
        />
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setShowTambahCapaian(false)}
            className="rounded-lg border border-[#d9dce7] px-5 py-2 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]">
            Batal
          </button>
          <button type="button" onClick={handleTambahCapaian}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-bold text-white hover:opacity-90">
            Simpan
          </button>
        </div>
      </Modal>

      {/* Modal Tambah Sub Capaian */}
      <Modal isOpen={showTambahSubCapaian} onClose={() => setShowTambahSubCapaian(false)}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Capaian Induk <span className="text-red-500">*</span></label>
            <select
              value={subCapaianForm.capaianId}
              onChange={(e) => setSubCapaianForm((p) => ({ ...p, capaianId: e.target.value }))}
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm text-[#9aa0a6] outline-none focus:border-brand-dark"
            >
              <option value="">-- Pilih Capaian --</option>
              {activeKur?.capaian.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Nama Sub Capaian <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={subCapaianForm.nama}
              onChange={(e) => setSubCapaianForm((p) => ({ ...p, nama: e.target.value }))}
              placeholder="input nama sub capaian"
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Bobot Poin (%) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={subCapaianForm.presentasi}
              onChange={(e) => setSubCapaianForm((p) => ({ ...p, presentasi: e.target.value }))}
              placeholder="input bobot poin"
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={handleTambahSubCapaian}
            className="flex-1 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light py-2.5 text-sm font-bold text-white hover:opacity-90">
            Simpan
          </button>
          <button type="button" onClick={() => setShowTambahSubCapaian(false)}
            className="flex-1 rounded-lg border border-[#d9dce7] py-2.5 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]">
            Batal
          </button>
        </div>
      </Modal>

      {/* Modal Edit Sub Capaian */}
      <Modal isOpen={!!editSubCapaian} onClose={() => setEditSubCapaian(null)}>
        {editSubCapaian && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Nama Sub Capaian <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={editSubCapaian.nama}
                onChange={(e) => setEditSubCapaian((p) => ({ ...p, nama: e.target.value }))}
                className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[#333]">Bobot Poin (%)</label>
              <input
                type="number"
                value={editSubCapaian.presentasi}
                onChange={(e) => setEditSubCapaian((p) => ({ ...p, presentasi: e.target.value }))}
                placeholder="input bobot poin"
                className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
              />
            </div>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => setEditSubCapaian(null)}
            className="rounded-lg border border-[#d9dce7] px-5 py-2 text-sm font-semibold text-[#333] hover:bg-[#f5f6f8]">
            Batal
          </button>
          <button type="button" onClick={handleEditSubCapaian}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-bold text-white hover:opacity-90">
            Simpan
          </button>
        </div>
      </Modal>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Manajemen Kurikulum</h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola kurikulum dan pemetaan Capaian dan Sub Capaian sesuai BRD.</p>
        </div>

        {/* Tombol tambah */}
        <div>
          <button
            type="button"
            onClick={() => { setKurForm({ tahun: '', nama: '' }); setShowTambahKurikulum(true) }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto sm:justify-start"
          >
            <Plus className="h-4 w-4" />
            Tambah Kurikulum
          </button>
        </div>

        {/* Daftar Kurikulum */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-[#e9ebf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-bold text-[#333]">Daftar Kurikulum</h3>
            <AlignJustify className="h-4 w-4 text-[#616161]" />
          </div>
          <div className="divide-y divide-[#e9ebf8]">
            {kurikulum.map((kur) => {
              const totalSub = kur.capaian.reduce((a, c) => a + c.subCapaian.length, 0)
              const isActive = activeKurId === kur.id
              return (
                <div
                  key={kur.id}
                  className={`flex w-full items-center justify-between px-5 py-4 transition hover:bg-[#f9fafb] ${isActive ? 'bg-[#f0faf0]' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveKurId(isActive ? null : kur.id)}
                    className="flex flex-1 flex-col gap-1.5 text-left"
                  >
                    <p className={`text-sm font-bold ${isActive ? 'text-brand-dark' : 'text-[#333]'}`}>{kur.nama}</p>
                    <p className="text-xs text-[#9aa0a6]">{kur.tahun}</p>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${
                        kur.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {kur.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#616161]">
                        <BookOpen className="h-3.5 w-3.5" />
                        {totalSub} Sub Capaian
                      </span>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-3 pl-4">
                    <ToggleSwitch
                      checked={kur.status === 'aktif'}
                      onChange={() => handleNonaktif(kur.id)}
                    />
                    <MenuKurikulum onHapus={() => handleHapus(kur.id, kur.nama)} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail kurikulum aktif */}
        {activeKur && (
          <div className="space-y-4">
            <h3 className="text-xl font-extrabold text-[#333]">{activeKur.nama}</h3>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowTambahCapaian(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Tambah Capaian
              </button>
              <button
                type="button"
                onClick={() => { setSubCapaianForm({ capaianId: '', nama: '', presentasi: '', bobot: '' }); setShowTambahSubCapaian(true) }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Tambah Sub Capaian
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                      <th className="px-5 py-3">Capaian</th>
                      <th className="px-5 py-3">Poin</th>
                      <th className="px-5 py-3">Sub Capaian</th>
                      <th className="px-5 py-3">Presentasi Bobot</th>
                      <th className="px-5 py-3">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeKur.capaian.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-[#9aa0a6]">
                          Belum ada capaian. Klik "Tambah Capaian" untuk memulai.
                        </td>
                      </tr>
                    ) : (
                      activeKur.capaian.map((cap) =>
                        cap.subCapaian.length === 0 ? (
                          <tr key={cap.id} className="border-b border-[#e9ebf8]">
                            <td className="px-5 py-3 align-top">
                              <div className="flex items-center gap-1.5">
                                <span className="rounded border border-[#d9dce7] px-2 py-0.5 text-xs font-semibold text-[#333]">
                                  {cap.label}
                                </span>
                                <button type="button" onClick={() => handleHapusCapaian(cap)}
                                  className="rounded p-0.5 text-red-400 hover:text-red-600">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[#616161]">-</td>
                            <td className="px-5 py-3 text-[#9aa0a6] italic">Belum ada sub capaian</td>
                            <td className="px-5 py-3">-</td>
                            <td className="px-5 py-3">-</td>
                          </tr>
                        ) : (
                          cap.subCapaian.map((sc, idx) => (
                            <tr key={sc.id} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                              {idx === 0 && (
                                <td rowSpan={cap.subCapaian.length} className="border-r border-[#e9ebf8] px-5 py-3 align-top">
                                  <div className="flex items-center gap-1.5">
                                    <span className="rounded border border-[#d9dce7] px-2 py-0.5 text-xs font-semibold text-[#333]">
                                      {cap.label}
                                    </span>
                                    <button type="button" onClick={() => handleHapusCapaian(cap)}
                                      className="rounded p-0.5 text-red-400 hover:text-red-600">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}
                              <td className="px-5 py-3 text-[#616161]">{sc.poin ?? '-'}</td>
                              <td className="px-5 py-3 text-[#333]">{sc.nama || '-'}</td>
                              <td className="px-5 py-3 text-[#616161]">{sc.presentasi != null ? `${sc.presentasi} %` : '-'}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditSubCapaian({ ...sc })}
                                    className="rounded p-1 text-brand-dark hover:bg-brand-dark/10"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleHapusSubCapaian(sc)}
                                    className="rounded p-1 text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ManajemenKurikulum
