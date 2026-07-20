import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { Search, Filter, Download, Upload, MoreVertical, ArrowLeft, Info } from 'lucide-react'
import StatCard from '../../components/dashboard/StatCard'
import ConfirmModal from '../../components/ui/ConfirmModal'

function ManajemenPeserta() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  // Mock data untuk contoh
  const kegiatan = {
    id: id,
    nama: "Seminar AI",
    tanggal: "25 Jun 2026",
    tempat: "Gedung Teknik UNAND",
    totalTerdaftar: 8,
    hadir: 5,
    tidakHadir: 3,
  }

  const pesertaData = [
    { no: 1, nim: '2111521001', nama: 'Mahasiswa A', fakultas: 'Teknik', prodi: 'Informatika', kehadiran: 'Hadir', peran: 'Peserta' },
    { no: 2, nim: '2111521002', nama: 'Mahasiswa B', fakultas: 'Teknik', prodi: 'Sistem Informasi', kehadiran: 'Tidak Hadir', peran: 'Peserta' },
    { no: 3, nim: '2111521003', nama: 'Mahasiswa C', fakultas: 'MIPA', prodi: 'Matematika', kehadiran: 'Hadir', peran: 'Peserta' },
    { no: 4, nim: '2111521004', nama: 'Mahasiswa D', fakultas: 'Teknik', prodi: 'Informatika', kehadiran: 'Hadir', peran: 'Panitia' },
    { no: 5, nim: '2111521005', nama: 'Mahasiswa E', fakultas: 'Teknik', prodi: 'Informatika', kehadiran: 'Tidak Hadir', peran: 'Peserta' },
  ]

  return (
    <DashboardLayout role="ukm" userName="Operator UKM" userRole="Operator UKM">
      <div className="space-y-6">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>

        <div>
          <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">Manajemen Dan Verifikasi Kegiatan</h2>
          <p className="mt-1 text-sm text-[#616161]">{kegiatan.nama} - {kegiatan.tanggal} - {kegiatan.tempat}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Terdaftar" label="Total Terdaftar" value={kegiatan.totalTerdaftar} color="green" />
          <StatCard title="Hadir" label="Hadir" value={kegiatan.hadir} color="green" />
          <StatCard title="Tidak Hadir" label="Tidak Hadir" value={kegiatan.tidakHadir} color="green" />
        </div>

        {/* Info Banner */}
        <div className="flex items-center gap-2 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-700">
          <Info className="h-5 w-5" />
          UKM hanya dapat mengelola daftar peserta dan kehadiran. Bobot poin ditentukan oleh Admin Fakultas dan Pimpinan Fakultas.
        </div>

        {/* Confirm Submit Modal */}
        <ConfirmModal
          isOpen={showSubmitModal}
          title="Klaim Poin Peserta"
          message="Apakah kamu yakin ingin mengirim data kehadiran dan peran peserta untuk diklaim poin?"
          confirmText="Ya, Kirim"
          cancelText="Batal"
          onConfirm={() => {
            setShowSubmitModal(false)
            toast.success('Berhasil!', {
              description: 'Data peserta berhasil dikirim untuk klaim poin.',
            })
          }}
          onCancel={() => setShowSubmitModal(false)}
        />

        {/* Daftar Peserta Section */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-bold text-brand-dark">Daftar Peserta ({pesertaData.length})</h3>
            <div className="flex items-center space-x-2">
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#e9ebf8] px-3 py-2 text-sm font-semibold text-[#616161]">
                <Filter className="h-4 w-4" /> Filter
              </button>
            </div>
          </div>
          <p className="mb-4 text-sm text-[#616161]">Cari dan kelola kehadiran peserta pada kegiatan ini</p>

          {/* Search and Action Buttons */}
          <div className="flex flex-col gap-3 lg:flex-row mb-4">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-[#cfd6df] bg-white px-4 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-[#9aa0a6]" />
              <input type="text" placeholder="Cari mahasiswa atau kegiatan..." className="w-full text-sm outline-none" />
            </div>
            <div className="flex gap-2">
              <button className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">Semua</button>
              <button className="rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161]">Hadir</button>
              <button className="rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161]">Tidak Hadir</button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161]">
                <Download className="h-4 w-4" /> Unduh Template
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161]">
                <Upload className="h-4 w-4" /> Import File
              </button>
              <button className="rounded-lg bg-[#e9ebf8] px-4 py-2.5 text-sm font-semibold text-[#616161]">Reset filter</button>
            </div>
          </div>

          {/* Table */}
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
                    <th className="px-4 py-3">Kehadiran</th>
                    <th className="px-4 py-3">Peran</th>
                  </tr>
                </thead>
                <tbody>
                  {pesertaData.map((peserta) => (
                    <tr key={peserta.no} className="border-b border-[#e9ebf8] last:border-0 hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 text-[#616161]">{peserta.no}</td>
                      <td className="px-4 py-3 font-medium text-[#333]">{peserta.nim}</td>
                      <td className="px-4 py-3 text-[#616161]">{peserta.nama}</td>
                      <td className="px-4 py-3 text-[#616161]">{peserta.fakultas}</td>
                      <td className="px-4 py-3 text-[#616161]">{peserta.prodi}</td>
                      <td className="px-4 py-3 text-[#616161]">{peserta.kehadiran}</td>
                      <td className="px-4 py-3 text-[#616161]">{peserta.peran}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-xs text-[#616161]">
              <span>Showing 1-10 From Total 20</span>
              <span>Page 1 of 2</span>
            </div>
          </div>

          {/* Submit Klaim Poin */}
          <div className="mt-4 flex justify-end">
            <button onClick={() => setShowSubmitModal(true)} className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90">
              Submit untuk Klaim Poin Peserta
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ManajemenPeserta