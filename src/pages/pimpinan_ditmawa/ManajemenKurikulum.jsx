import { useState, useEffect } from 'react'
import { Pencil, Trash2, AlignJustify, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import ConfirmModal from '../../components/ui/ConfirmModal'
import Modal from '../../components/ui/Modal'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import {
  getKurikulum,
  getKurikulumById,
  createKurikulum,
  aktivasiKurikulum,
  nonaktifkanKurikulum,
  hapusKurikulum,
  tambahCapaian,
  hapusCapaian,
  tambahSubCapaian,
  updateSubCapaian,
  hapusSubCapaian,
} from '../../services/kurikulumService'

function normalizeKurikulum(k) {
  return {
    id: k.id,
    nama: k.nama || k.namaKurikulum || '-',
    tahun: k.tahunAkademik || k.tahun || '-',
    status: k.status || 'draft',
    capaian: (k.capaian || k.capaiapembelajaran || []).map((c) => ({
      id: c.id,
      label: c.nama || c.label || c.namaCapaian || '-',
      jumlahPoin: c.jumlahPoin ?? c.poin ?? 0,
      subCapaian: (c.subCapaian || c.sub_capaian || []).map((sc) => ({
        id: sc.id,
        nama: sc.nama || sc.namaSubCapaian || '-',
        presentasi: Number(sc.bobotPersen ?? sc.bobot ?? sc.presentasi ?? 0),
      })),
    })),
  }
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
  const [kurikulum, setKurikulum] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeKurId, setActiveKurId] = useState(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showNonaktifConfirm, setShowNonaktifConfirm] = useState(false)
  const [nonaktifTarget, setNonaktifTarget] = useState(null)

  const [showTambahKurikulum, setShowTambahKurikulum] = useState(false)
  const [kurForm, setKurForm] = useState({ tahun: '', nama: '' })

  const [showTambahCapaian, setShowTambahCapaian] = useState(false)
  const [capaianForm, setCapaianForm] = useState({ nama: '', jumlahPoin: '' })

  const [showTambahSubCapaian, setShowTambahSubCapaian] = useState(false)
  const [subCapaianForm, setSubCapaianForm] = useState({ capaianId: '', nama: '', presentasi: '', bobot: '' })

  const [editSubCapaian, setEditSubCapaian] = useState(null)

  const [showHapusCapaianConfirm, setShowHapusCapaianConfirm] = useState(false)
  const [hapusCapaianTarget, setHapusCapaianTarget] = useState(null)

  const [showHapusSubCapaianConfirm, setShowHapusSubCapaianConfirm] = useState(false)
  const [hapusSubCapaianTarget, setHapusSubCapaianTarget] = useState(null)

  const [page, setPage] = useState(1)

  const activeKur = kurikulum.find((k) => k.id === activeKurId) || null

  const PAGE_SIZE = 10
  const totalPages = Math.max(1, Math.ceil((activeKur?.capaian?.length || 0) / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pageCapaian = (activeKur?.capaian || []).slice(start, start + PAGE_SIZE)

  const loadList = () => {
    setLoading(true)
    getKurikulum()
      .then((data) => {
        const list = (Array.isArray(data) ? data : []).map(normalizeKurikulum)
        setKurikulum(list)
        if (!activeKurId && list.length) setActiveKurId(list[0].id)
      })
      .catch((err) => toast.error('Gagal memuat kurikulum', { description: err.message }))
      .finally(() => setLoading(false))
  }

  const loadDetail = async (id) => {
    try {
      const detail = await getKurikulumById(id)
      const norm = normalizeKurikulum(detail)
      setKurikulum((prev) => prev.map((k) => k.id === id ? norm : k))
    } catch {
      // ignore, list sudah cukup
    }
  }

  useEffect(() => { loadList() }, [])

  useEffect(() => {
    setPage(1)
    if (activeKurId) loadDetail(activeKurId)
  }, [activeKurId])

  const handleToggleStatus = (id) => {
    const kur = kurikulum.find((k) => k.id === id)
    if (kur?.status === 'aktif') {
      // Menonaktifkan kurikulum wajib konfirmasi terlebih dahulu
      setNonaktifTarget(kur)
      setShowNonaktifConfirm(true)
    } else {
      confirmToggleStatus(kur)
    }
  }

  const confirmToggleStatus = async (kur) => {
    try {
      if (kur?.status === 'aktif') {
        await nonaktifkanKurikulum(kur.id)
        toast.success('Kurikulum dinonaktifkan.')
      } else {
        await aktivasiKurikulum(kur.id)
        toast.success('Kurikulum diaktifkan.')
      }
      loadList()
    } catch (err) {
      toast.error('Gagal mengubah status', { description: err.message })
    }
  }

  const confirmNonaktif = async () => {
    if (!nonaktifTarget) return
    setShowNonaktifConfirm(false)
    await confirmToggleStatus(nonaktifTarget)
    setNonaktifTarget(null)
  }

  const handleHapus = (id, nama) => {
    setDeleteTarget({ id, nama })
    setShowDeleteConfirm(true)
  }

  const confirmHapus = async () => {
    try {
      await hapusKurikulum(deleteTarget.id)
      if (activeKurId === deleteTarget.id) setActiveKurId(null)
      toast.success('Kurikulum dihapus.')
      loadList()
    } catch (err) {
      toast.error('Gagal menghapus', { description: err.message })
    }
    setShowDeleteConfirm(false)
    setDeleteTarget(null)
  }

  const handleTambahKurikulum = async () => {
    if (!kurForm.nama.trim()) { toast.error('Nama kurikulum tidak boleh kosong.'); return }
    if (!kurForm.tahun.trim()) { toast.error('Tahun tidak boleh kosong.'); return }
    try {
      const created = await createKurikulum({ nama: kurForm.nama.trim(), tahunAkademik: kurForm.tahun.trim() })
      toast.success('Kurikulum berhasil ditambahkan.')
      setKurForm({ tahun: '', nama: '' })
      setShowTambahKurikulum(false)
      loadList()
      if (created?.id) setActiveKurId(created.id)
    } catch (err) {
      toast.error('Gagal menambahkan kurikulum', { description: err.message })
    }
  }

  const handleTambahCapaian = async () => {
    if (!capaianForm.nama.trim()) { toast.error('Nama capaian tidak boleh kosong.'); return }
    if (!capaianForm.jumlahPoin || Number(capaianForm.jumlahPoin) <= 0) { toast.error('Jumlah poin harus diisi dan lebih dari 0.'); return }
    try {
      await tambahCapaian(activeKurId, {
        nama: capaianForm.nama.trim(),
        jumlahPoin: Number(capaianForm.jumlahPoin),
      })
      toast.success('Capaian ditambahkan.')
      setCapaianForm({ nama: '', jumlahPoin: '' })
      setShowTambahCapaian(false)
      loadDetail(activeKurId)
    } catch (err) {
      toast.error('Gagal menambahkan capaian', { description: err.message })
    }
  }

  const handleTambahSubCapaian = async () => {
    if (!subCapaianForm.capaianId) { toast.error('Pilih capaian terlebih dahulu.'); return }
    if (!subCapaianForm.nama.trim()) { toast.error('Nama sub capaian tidak boleh kosong.'); return }
    if (!subCapaianForm.presentasi || Number(subCapaianForm.presentasi) <= 0) { toast.error('Bobot harus diisi dan lebih dari 0.'); return }
    try {
      await tambahSubCapaian(subCapaianForm.capaianId, {
        nama: subCapaianForm.nama.trim(),
        bobotPersen: Number(subCapaianForm.presentasi),
      })
      toast.success('Sub capaian ditambahkan.')
      setSubCapaianForm({ capaianId: '', nama: '', presentasi: '', bobot: '' })
      setShowTambahSubCapaian(false)
      loadDetail(activeKurId)
    } catch (err) {
      toast.error('Gagal menambahkan sub capaian', { description: err.message })
    }
  }

  const handleEditSubCapaian = async () => {
    if (!editSubCapaian.nama.trim()) { toast.error('Nama sub capaian tidak boleh kosong.'); return }
    try {
      await updateSubCapaian(editSubCapaian.id, {
        nama: editSubCapaian.nama,
        bobotPersen: Number(editSubCapaian.presentasi) || 0,
      })
      toast.success('Sub capaian diperbarui.')
      setEditSubCapaian(null)
      loadDetail(activeKurId)
    } catch (err) {
      toast.error('Gagal memperbarui sub capaian', { description: err.message })
    }
  }

  const handleHapusSubCapaian = (sc) => {
    setHapusSubCapaianTarget(sc)
    setShowHapusSubCapaianConfirm(true)
  }

  const confirmHapusSubCapaian = async () => {
    try {
      await hapusSubCapaian(hapusSubCapaianTarget.id)
      toast.success('Sub capaian dihapus.')
      loadDetail(activeKurId)
    } catch (err) {
      toast.error('Gagal menghapus sub capaian', { description: err.message })
    }
    setShowHapusSubCapaianConfirm(false)
    setHapusSubCapaianTarget(null)
  }

  const handleHapusCapaian = (cap) => {
    setHapusCapaianTarget(cap)
    setShowHapusCapaianConfirm(true)
  }

  const confirmHapusCapaian = async () => {
    try {
      await hapusCapaian(hapusCapaianTarget.id)
      toast.success('Capaian dihapus.')
      loadDetail(activeKurId)
    } catch (err) {
      toast.error('Gagal menghapus capaian', { description: err.message })
    }
    setShowHapusCapaianConfirm(false)
    setHapusCapaianTarget(null)
  }

  return (
    <DashboardLayout role="pimpinan_ditmawa" userName="Dr. Eng. Ir. Dendi Adi Saputra M, S.T, M.T" userRole="Pimpinan">
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
        isOpen={showNonaktifConfirm}
        title="Nonaktifkan Kurikulum?"
        message={`Kurikulum "${nonaktifTarget?.nama}" akan dinonaktifkan. Pastikan sudah ada kurikulum lain yang aktif sebelum melanjutkan, karena kurikulum nonaktif tidak lagi dipakai sebagai acuan pemetaan capaian.`}
        confirmText="NONAKTIFKAN"
        cancelText="BATAL"
        onConfirm={confirmNonaktif}
        onCancel={() => { setShowNonaktifConfirm(false); setNonaktifTarget(null) }}
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
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Nama Capaian <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={capaianForm.nama}
              onChange={(e) => setCapaianForm((p) => ({ ...p, nama: e.target.value }))}
              placeholder="Contoh: Pemantapan"
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Jumlah Poin <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={capaianForm.jumlahPoin}
              onChange={(e) => setCapaianForm((p) => ({ ...p, jumlahPoin: e.target.value }))}
              placeholder="Contoh: 100"
              min="1"
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
        </div>
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
              placeholder="Input nama sub capaian"
              className="w-full rounded-lg border border-[#d9dce7] px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#333]">Bobot Poin (%) <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={subCapaianForm.presentasi}
              onChange={(e) => setSubCapaianForm((p) => ({ ...p, presentasi: e.target.value }))}
              placeholder="Input bobot poin"
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
                placeholder="Input bobot poin"
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
          <h2 className="text-2xl font-extrabold text-[#222] sm:text-3xl">Manajemen Kurikulum</h2>
          <p className="mt-1 text-sm text-[#616161]">Kelola kurikulum dan pemetaan Capaian dan Sub Capaian sesuai BRD.</p>
        </div>

        {/* Tombol tambah */}
        <div>
          <button
            type="button"
            onClick={() => { setKurForm({ tahun: '', nama: '' }); setShowTambahKurikulum(true) }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto sm:justify-start"
          >Tambah Kurikulum
          </button>
        </div>

        {/* Daftar Kurikulum */}
        <div className="rounded-xl border border-[#e9ebf8] bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-[#e9ebf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-bold text-[#333]">Daftar Kurikulum</h3>
            <AlignJustify className="h-4 w-4 text-[#616161]" />
          </div>
          <div className="divide-y divide-[#e9ebf8]">
            {loading ? (
              <p className="px-5 py-6 text-sm text-[#9aa0a6]">Memuat kurikulum...</p>
            ) : kurikulum.length === 0 ? (
              <p className="px-5 py-6 text-sm text-[#9aa0a6]">Belum ada kurikulum.</p>
            ) : null}
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
                        kur.status === 'aktif' ? 'bg-green-100 text-green-700'
                        : kur.status === 'draft' ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>
                        {kur.status === 'aktif' ? 'Aktif' : kur.status === 'draft' ? 'Draft' : 'Arsip'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#616161]">{totalSub} Sub Capaian
                      </span>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-3 pl-4">
                    <ToggleSwitch
                      checked={kur.status === 'aktif'}
                      onChange={() => handleToggleStatus(kur.id)}
                    />
                    <button
                      type="button"
                      onClick={() => handleHapus(kur.id, kur.nama)}
                      title="Hapus kurikulum"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
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
                onClick={() => { setCapaianForm({ nama: '', jumlahPoin: '' }); setShowTambahCapaian(true) }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >Tambah Capaian
              </button>
              <button
                type="button"
                onClick={() => { setSubCapaianForm({ capaianId: '', nama: '', presentasi: '', bobot: '' }); setShowTambahSubCapaian(true) }}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >Tambah Sub Capaian
              </button>
            </div>

            <TableCard title="Manajemen Kurikulum">
              <TableFrame>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className="divide-x divide-white/20 bg-gradient-to-r from-brand-dark to-brand-light text-xs font-semibold uppercase tracking-wide text-white">
                      <th className="px-5 py-3 text-center">Capaian</th>
                      <th className="px-5 py-3 text-center">Poin</th>
                      <th className="px-5 py-3 text-center">Sub Capaian</th>
                      <th className="px-5 py-3 text-center">Presentasi Bobot</th>
                      <th className="px-5 py-3 text-center">Aksi</th>
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
                      pageCapaian.map((cap) =>
                        cap.subCapaian.length === 0 ? (
                          <tr key={cap.id} className="divide-x divide-[#e9ebf8] border-b border-[#e9ebf8]">
                            <td className="px-5 py-3 align-top">
                              <div className="flex items-center gap-1.5">
                                <span className="rounded border border-[#d9dce7] px-2 py-0.5 text-xs font-semibold text-[#333]">
                                  {cap.label}
                                </span>
                                <button type="button" onClick={() => handleHapusCapaian(cap)}
                                  title="Hapus capaian"
                                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-[#616161]">{cap.jumlahPoin ?? '-'}</td>
                            <td className="px-5 py-3 text-[#9aa0a6] italic">Belum ada sub capaian</td>
                            <td className="px-5 py-3">-</td>
                            <td className="px-5 py-3">-</td>
                          </tr>
                        ) : (
                          cap.subCapaian.map((sc, idx) => (
                            <tr key={sc.id} className="divide-x divide-[#e9ebf8] border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                              {idx === 0 && (
                                <>
                                  <td rowSpan={cap.subCapaian.length} className="border-r border-[#e9ebf8] px-5 py-3 align-top">
                                    <div className="flex items-center gap-1.5">
                                      <span className="rounded border border-[#d9dce7] px-2 py-0.5 text-xs font-semibold text-[#333]">
                                        {cap.label}
                                      </span>
                                      <button type="button" onClick={() => handleHapusCapaian(cap)}
                                        title="Hapus capaian"
                                        className="flex h-6 w-6 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white">
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                  <td rowSpan={cap.subCapaian.length} className="border-r border-[#e9ebf8] px-5 py-3 align-top text-[#616161]">
                                    {cap.jumlahPoin ?? '-'}
                                  </td>
                                </>
                              )}
                              <td className="px-5 py-3 text-[#333]">{sc.nama || '-'}</td>
                              <td className="px-5 py-3 text-center text-[#616161]">{sc.presentasi != null ? `${sc.presentasi} %` : '-'}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditSubCapaian({ ...sc })}
                                    title="Edit sub capaian"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-brand-dark bg-[#eaf5ec] text-brand-dark transition hover:bg-brand-dark hover:text-white"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleHapusSubCapaian(sc)}
                                    title="Hapus sub capaian"
                                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-400 bg-red-50 text-red-500 transition hover:bg-red-500 hover:text-white"
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
              {totalPages > 1 && (
                <div className="flex items-center justify-end gap-1 border-t border-[#e9ebf8] px-5 py-3">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e9ebf8] text-[#616161] transition hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="px-2 text-xs text-[#9aa0a6]">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e9ebf8] text-[#616161] transition hover:bg-[#f0f2ff] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              </TableFrame>
            </TableCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ManajemenKurikulum
