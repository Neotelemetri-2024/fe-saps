// src/config/menuItems.jsx
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  Bell,
  Settings,
  BookOpen,
  BarChart3,
  FileText,
  History,
  UserCircle,
  LayoutGrid, 
  UserCheck,  
  PlusCircle,
  CheckSquare,
  Award,
} from 'lucide-react'

/* ── MAHASISWA ── */
export const mahasiswaMenu = [
  { path: '/mahasiswa/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/mahasiswa/persetujuan-dosen', label: 'Persetujuan Dosen', icon: <UserCheck className="h-4 w-4" /> },
  { path: '/mahasiswa/klaim-poin', label: 'Klaim Poin Eksternal', icon: <CheckSquare className="h-4 w-4" /> },
  { path: '/mahasiswa/kegiatan-eksternal', label: 'Ajukan Kegiatan Eksternal', icon: <PlusCircle className="h-4 w-4" /> },
  { path: '/mahasiswa/riwayat-poin', label: 'Riwayat Poin', icon: <Award className="h-4 w-4" /> },
  { path: '/mahasiswa/generate-cv', label: 'Generate CV', icon: <FileText className="h-4 w-4" /> },
  { path: '/mahasiswa/notifikasi', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '/mahasiswa/pengaturan', label: 'Akun dan Pengaturan', icon: <Settings className="h-4 w-4" /> },
]

/* ── DOSEN PA ── */
export const dosenPAMenu = [
  { path: '/dosen-pa/dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-4 w-4" />, end: true },
  { path: '/dosen-pa/mahasiswa-bimbingan', label: 'Mahasiswa Bimbingan', icon: <Users className="h-4 w-4" />, end: false },
  { path: '/dosen-pa/permintaan-persetujuan', label: 'Persetujuan Mahasiswa', icon: <UserCheck className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun dan Pengaturan', icon: <Settings className="h-4 w-4" /> },
]

/* ── PIMPINAN DITMAWA ── */
export const pimpinanDitmawaMenu = [
  { path: '/pimpinan-ditmawa/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '#', label: 'Manajemen Kurikulum', icon: <BookOpen className="h-4 w-4" /> },
  { path: '#', label: 'Bobot Poin', icon: <BarChart3 className="h-4 w-4" /> },
  {
    path: '#',
    label: 'Verifikasi',
    icon: <CheckCircle className="h-4 w-4" />,
    children: [
      { path: '#', label: 'Verifikasi Pengajuan UKM' },
      { path: '#', label: 'Verifikasi Klaim Poin Eksternal' },
    ],
  },
  {
    path: '#',
    label: 'Event Global',
    icon: <FileText className="h-4 w-4" />,
    children: [
      { path: '#', label: 'Buat Event' },
      { path: '#', label: 'Verifikasi kegiatan' },
    ],
  },
  { path: '#', label: 'Manajemen akun UKM', icon: <Users className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun dan Pengaturan', icon: <Settings className="h-4 w-4" /> },
]

/* ── PIMPINAN FAKULTAS ── */
export const pimpinanFakultasMenu = [
  { path: '/pimpinan-fakultas/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/pimpinan-fakultas/verifikasi-pengajuan-ukmf', label: 'Verifikasi Pengajuan UKMF', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun dan Pengaturan', icon: <Settings className="h-4 w-4" /> },
]

/* ── PIMPINAN UTAMA ── */
export const pimpinanUtamaMenu = [
  { path: '/pimpinan-utama/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/pimpinan-utama/detail-fakultas', label: 'Detail Fakultas', icon: <BarChart3 className="h-4 w-4" /> },
  { path: '#', label: 'Laporan', icon: <FileText className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <Settings className="h-4 w-4" /> },
]

/* ── ADMIN DITMAWA ── */
export const adminDitmawaMenu = [
  { path: '/admin-ditmawa/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  {
    path: '#',
    label: 'Verifikasi',
    icon: <CheckCircle className="h-4 w-4" />,
    children: [
      { path: '/admin-ditmawa/verifikasi-klaim', label: 'Verifikasi Klaim Poin' },
      { path: '#', label: 'Verifikasi Pengajuan Eksternal' },
      { path: '#', label: 'Verifikasi Pengajuan UKM' },
    ],
  },
  { path: '#', label: 'Manajemen event Global', icon: <FileText className="h-4 w-4" /> },
  { path: '#', label: 'Manajemen akun UKM', icon: <Users className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun dan Pengaturan', icon: <Settings className="h-4 w-4" /> },
]

/* ── ADMIN FAKULTAS ── */
export const adminFakultasMenu = [
  { path: '/admin-fakultas/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '#', label: 'Verifikasi', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <Settings className="h-4 w-4" /> },
]

/* ── UKM ── */
export const ukmMenu = [
  { path: '/ukm/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/ukm/daftar-kegiatan', label: 'Daftar Kegiatan', icon: <FileText className="h-4 w-4" /> },
  { path: '#', label: 'Buat Kegiatan', icon: <PlusCircle className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun dan Pengaturan', icon: <Settings className="h-4 w-4" /> },
]

/* ── UKMF ── */
export const ukmfMenu = [
  { path: '/ukmf/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/ukmf/daftar-kegiatan', label: 'Daftar Kegiatan', icon: <CheckSquare className="h-4 w-4" /> },
  { path: '/ukmf/buat-kegiatan', label: 'Buat Kegiatan', icon: <PlusCircle className="h-4 w-4" /> },
  { path: '/ukmf/notifikasi', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '/ukmf/pengaturan', label: 'Akun dan Pengaturan', icon: <Settings className="h-4 w-4" /> },
]

// ── OBJEK PEMETAAN UTAMA UNTUK SIDEBAR DINAMIS ──
// Objek ini berfungsi memetakan string role dari backend ke menu yang sesuai
export const roleMenus = {
  mahasiswa: mahasiswaMenu,
  'dosen-pa': dosenPAMenu,
  'pimpinan-ditmawa': pimpinanDitmawaMenu,
  'pimpinan-fakultas': pimpinanFakultasMenu,
  'pimpinan-utama': pimpinanUtamaMenu,
  'admin-ditmawa': adminDitmawaMenu,
  'admin-fakultas': adminFakultasMenu,
  ukm: ukmMenu,
  ukmf: ukmfMenu,
}