import { useState } from 'react'
import { Search, Plus, Pencil, Trash2, Eye, X } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'

const DUMMY_UKMF = [
  { id: 1, nama: 'Hima FT UNAND', ketua: 'Nouval Rafiif Irwan', email: 'himaft@unand.ac.id', telepon: '081234567890', anggota: 45, status: 'Aktif', tanggalBerdiri: '2019-03-15' },
  { id: 2, nama: 'KSR PMI UNAND', ketua: 'Siti Aisyah', email: 'ksr@unand.ac.id', telepon: '082345678901', anggota: 30, status: 'Aktif', tanggalBerdiri: '2018-08-20' },
  { id: 3, nama: 'Mapala UNAND', ketua: 'Budi Santoso', email: 'mapala@unand.ac.id', telepon: '083456789012', anggota: 25, status: 'Aktif', tanggalBerdiri: '2017-05-10' },
  { id: 4, nama: 'UKM Musik FT', ketua: 'Rina Kusuma', email: 'musik.ft@unand.ac.id', telepon: '084567890123', anggota: 60, status: 'Tidak Aktif', tanggalBerdiri: '2020-01-05' },
  { id: 5, nama: 'UKM Olahraga FT', ketua: 'Doni Prasetyo', email: 'olahraga.ft@unand.ac.id', telepon: '085678901234', anggota: 80, status: 'Aktif', tanggalBerdiri: '2016-09-12' },
]

const statusStyle = {
  Aktif: 'bg-green-100 text-green-700 border border-green-300',
  'Tidak Aktif': 'bg-red-100 text-red-600 border border-red-300',
}

function ConfirmModal({ isOpen, message, onConfirm, onClose }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#222]">Konfirmasi Hapus</h4>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#333]"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-5 text-sm text-[#555]">{message}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#444] hover:bg-[#f5f5f5]">Batal</button>
          <button type="button" onClick={onConfirm} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Hapus</button>
        </div>
      </div>
    </div>
  )
}

const FORM_EMPTY = { nama: '', ketua: '', email: '', telepon: '', status: 'Aktif' }

function UKMFFormModal({ isOpen, onClose, onSimpan, initialData = null }) {
  const [form, setForm] = useState(initialData ?? FORM_EMPTY)

  if (!isOpen) return null

  function handleSimpan() {
    if (!form.nama || !form.ketua || !form.email) { toast.error('Lengkapi semua field wajib.'); return }
    onSimpan(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h4 className="text-base font-bold text-[#222]">{initialData ? 'Edit UKMF' : 'Tambah UKMF'}</h4>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#333]"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4">
          {[
            { label: 'Nama UKMF', key: 'nama', placeholder: 'Nama UKMF...', required: true },
            { label: 'Ketua', key: 'ketua', placeholder: 'Nama ketua...', required: true },
            { label: 'Email', key: 'email', placeholder: 'email@unand.ac.id', required: true },
            { label: 'Telepon', key: 'telepon', placeholder: '08xxxxxxxxxx', required: false },
          ].map(({ label, key, placeholder, required }) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-semibold text-[#333]">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                value={form[key]}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
              />
            </div>
          ))}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#333]">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full rounded-lg border border-[#d1d5db] px-3 py-2.5 text-sm outline-none focus:border-brand-dark focus:ring-1 focus:ring-brand-dark"
            >
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#444] hover:bg-[#f5f5f5]">Batal</button>
          <button type="button" onClick={handleSimpan} className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Simpan</button>
        </div>
      </div>
    </div>
  )
}

function DetailUKMFModal({ isOpen, data, onClose }) {
  if (!isOpen || !data) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h4 className="text-base font-bold text-[#222]">Detail UKMF</h4>
          <button type="button" onClick={onClose} className="text-[#999] hover:text-[#333]"><X className="h-4 w-4" /></button>
        </div>
        <dl className="space-y-0">
          {[
            ['Nama UKMF', data.nama],
            ['Ketua', data.ketua],
            ['Email', data.email],
            ['Telepon', data.telepon],
            ['Jumlah Anggota', `${data.anggota} orang`],
            ['Status', data.status],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-2 gap-2 border-b border-[#f0f0f0] py-2.5 last:border-0">
              <dt className="text-sm font-semibold text-[#666]">{label}</dt>
              <dd className="text-sm text-[#333]">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#d1d5db] px-4 py-2 text-sm font-medium text-[#444] hover:bg-[#f5f5f5]">Tutup</button>
        </div>
      </div>
    </div>
  )
}

function ManajemenAkunUKMF() {
  const [search, setSearch] = useState('')
  const [ukmfList, setUkmfList] = useState(DUMMY_UKMF)
  const [showTambah, setShowTambah] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [detailTarget, setDetailTarget] = useState(null)

  const filtered = ukmfList.filter((u) =>
    u.nama.toLowerCase().includes(search.toLowerCase()) ||
    u.ketua.toLowerCase().includes(search.toLowerCase())
  )

  function handleTambah(data) {
    setUkmfList((prev) => [...prev, { id: Date.now(), ...data, anggota: 0, tanggalBerdiri: new Date().toISOString().slice(0, 10) }])
    toast.success('UKMF berhasil ditambahkan!')
  }

  function handleEdit(data) {
    setUkmfList((prev) => prev.map((u) => u.id === editTarget.id ? { ...u, ...data } : u))
    setEditTarget(null)
    toast.success('Data UKMF berhasil diperbarui!')
  }

  function handleHapus() {
    setUkmfList((prev) => prev.filter((u) => u.id !== deleteTarget))
    setDeleteTarget(null)
    toast.success('UKMF berhasil dihapus.')
  }

  return (
    <DashboardLayout role="admin-fakultas" userName="Nouval Rafiif Irwan" userRole="Operator UKM">
      <ConfirmModal
        isOpen={deleteTarget !== null}
        message="Apakah kamu yakin ingin menghapus UKMF ini? Tindakan ini tidak bisa dibatalkan."
        onConfirm={handleHapus}
        onClose={() => setDeleteTarget(null)}
      />
      <UKMFFormModal
        isOpen={showTambah}
        onClose={() => setShowTambah(false)}
        onSimpan={handleTambah}
      />
      <UKMFFormModal
        isOpen={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSimpan={handleEdit}
        initialData={editTarget}
      />
      <DetailUKMFModal
        isOpen={detailTarget !== null}
        data={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Manajemen Akun UKMF</h2>
            <p className="mt-1 text-sm text-[#616161]">Kelola daftar UKMF di fakultas.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTambah(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Tambah UKMF
          </button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari UKMF atau ketua..."
            className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NO</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NAMA UKMF</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">KETUA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">EMAIL</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">ANGGOTA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">STATUS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filtered.map((u, i) => (
                  <tr key={u.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3.5 text-[#616161]">{i + 1}.</td>
                    <td className="px-4 py-3.5 font-medium text-[#222]">{u.nama}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{u.ketua}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{u.email}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{u.anggota} orang</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[u.status]}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setDetailTarget(u)}
                          className="inline-flex items-center gap-1 rounded border border-[#9aa0a6] px-2 py-1 text-xs font-semibold text-[#555] hover:bg-[#f5f5f5]"
                        >
                          <Eye className="h-3 w-3" /> Lihat
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTarget(u)}
                          className="inline-flex items-center gap-1 rounded border border-brand-dark px-2 py-1 text-xs font-semibold text-brand-dark hover:bg-brand-dark hover:text-white"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u.id)}
                          className="inline-flex items-center gap-1 rounded border border-red-400 px-2 py-1 text-xs font-semibold text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="h-3 w-3" /> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#9aa0a6]">Tidak ada UKMF ditemukan.</div>
          )}
          <div className="flex items-center justify-between border-t border-[#f0f0f0] px-6 py-3 text-xs text-[#888]">
            <span>Total: {ukmfList.length} UKMF</span>
            <span>{filtered.length} ditampilkan</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenAkunUKMF
