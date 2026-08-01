// src/config/menuItems.jsx
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  BookOpen,
  BarChart3,
  FileText,
  LayoutGrid,
  UserCheck,
  PlusCircle,
  CheckSquare,
  Award,
  Search,
  UserCog,
  History,
} from 'lucide-react'

/* ── MAHASISWA ── */
export const mahasiswaMenu = [
  { path: '/mahasiswa/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/mahasiswa/kegiatan-eksternal', label: 'Ajukan Kegiatan Eksternal', icon: <PlusCircle className="h-4 w-4" /> },
  { path: '/mahasiswa/persetujuan-dosen', label: 'Persetujuan Dosen', icon: <UserCheck className="h-4 w-4" /> },
  { path: '/mahasiswa/klaim-poin', label: 'Klaim Poin Eksternal', icon: <CheckSquare className="h-4 w-4" /> },
  { path: '/mahasiswa/riwayat-kegiatan-internal', label: 'Riwayat Kegiatan Internal', icon: <History className="h-4 w-4" /> },
  { path: '/mahasiswa/riwayat-poin', label: 'Riwayat Poin', icon: <Award className="h-4 w-4" /> },
  { path: '/mahasiswa/generate-cv', label: 'Generate CV', icon: <FileText className="h-4 w-4" /> },
]

/* ── DOSEN PA ── */
export const dosenPAMenu = [
  { path: '/dosen/dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-4 w-4" />, end: true },
  { path: '/dosen/mahasiswa-bimbingan', label: 'Mahasiswa Bimbingan', icon: <Users className="h-4 w-4" />, end: false },
  { path: '/dosen/permintaan-persetujuan', label: 'Persetujuan Mahasiswa', icon: <UserCheck className="h-4 w-4" /> },
]
export const pimpinanDitmawaMenu = [
  { path: '/pimpinan_ditmawa/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/pimpinan_ditmawa/manajemen-kurikulum', label: 'Manajemen Kurikulum', icon: <BookOpen className="h-4 w-4" /> },
  { path: '/pimpinan_ditmawa/bobot-poin', label: 'Bobot Poin', icon: <BarChart3 className="h-4 w-4" /> },
  {
    path: '#',
    label: 'Verifikasi',
    icon: <CheckCircle className="h-4 w-4" />,
    children: [
      { path: '/pimpinan_ditmawa/verifikasi-pengajuan-internal', label: 'Verifikasi Pengajuan Internal' },
      { path: '/pimpinan_ditmawa/verifikasi-pengajuan-eksternal', label: 'Verifikasi Pengajuan Eksternal' },
    ],
  },
]
export const pimpinanFakultasMenu = [
  { path: '/pimpinan_fakultas/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  {
    path: '#',
    label: 'Verifikasi',
    icon: <CheckCircle className="h-4 w-4" />,
    children: [
      { path: '/pimpinan_fakultas/verifikasi-pengajuan-ukmf', label: 'Verifikasi Pengajuan UKMF' },
      { path: '/pimpinan_fakultas/verifikasi-kegiatan-internal', label: 'Verifikasi Kegiatan Internal' },
    ],
  },
]
export const pimpinanUtamaMenu = [
  { path: '/pimpinan_utama/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/pimpinan_utama/detail-fakultas', label: 'Detail Fakultas', icon: <BarChart3 className="h-4 w-4" /> },
]

/* ── ADMIN DITMAWA ── */
export const adminDitmawaMenu = [
  { path: '/admin_ditmawa/dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-4 w-4" />, end: true },
  {
    path: '#',
    label: 'Verifikasi',
    icon: <FileText className="h-4 w-4" />,
    children: [
      { path: '/admin_ditmawa/verifikasi-pengajuan-eksternal', label: 'Verifikasi Pengajuan Eksternal' },
      { path: '/admin_ditmawa/verifikasi-pengajuan-internal', label: 'Verifikasi Pengajuan Internal' },
      { path: '/admin_ditmawa/verifikasi-klaim', label: 'Verifikasi Klaim Poin Eksternal' },
    ],
  },
  { path: '/admin_ditmawa/manajemen-event', label: 'Event Global', icon: <Search className="h-4 w-4" /> },
  { path: '/admin_ditmawa/manajemen-akun-ukm', label: 'Manajemen akun UKM', icon: <UserCog className="h-4 w-4" /> },
]

/* ── ADMIN FAKULTAS ── */
export const adminFakultasMenu = [
  { path: '/admin_fakultas/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/admin_fakultas/verifikasi-pengajuan-ukmf', label: 'Verifikasi Pengajuan UKMF', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '/admin_fakultas/manajemen-event', label: 'Event Fakultas', icon: <Search className="h-4 w-4" /> },
  { path: '/admin_fakultas/manajemen-akun-ukmf', label: 'Manajemen akun UKMF', icon: <UserCog className="h-4 w-4" /> },
]
export const ukmMenu = [
  { path: '/operator_ukm/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/operator_ukm/daftar-kegiatan', label: 'Daftar Kegiatan', icon: <FileText className="h-4 w-4" /> },
]
export const ukmfMenu = [
  { path: '/operator_ukmf/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/operator_ukmf/daftar-kegiatan', label: 'Daftar Kegiatan', icon: <FileText className="h-4 w-4" /> },
  { path: '/operator_ukmf/buat-kegiatan', label: 'Buat Kegiatan', icon: <PlusCircle className="h-4 w-4" /> },
]
// Objek ini berfungsi memetakan string role dari backend ke menu yang sesuai
export const roleMenus = {
  mahasiswa: mahasiswaMenu,
  dosen: dosenPAMenu,
  dosen_pa: dosenPAMenu,
  pimpinan_ditmawa: pimpinanDitmawaMenu,
  pimpinan_fakultas: pimpinanFakultasMenu,
  pimpinan_utama: pimpinanUtamaMenu,
  admin_ditmawa: adminDitmawaMenu,
  admin_fakultas: adminFakultasMenu,
  operator_ukm: ukmMenu,
  operator_ukmf: ukmfMenu,
}
