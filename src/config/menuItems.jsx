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
  LayoutGrid, // Add LayoutGrid
  UserCheck,  // Add UserCheck
} from 'lucide-react'

/* ── MAHASISWA ── */
export const mahasiswaMenu = [
  { path: '/mahasiswa/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '#', label: 'Ajukan Kegiatan', icon: <FileText className="h-4 w-4" /> },
  { path: '#', label: 'Riwayat Poin', icon: <History className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <UserCircle className="h-4 w-4" /> },
]

/* ── DOSEN PA ── */
export const dosenPAMenu = [
  { path: '/dosen-pa/dashboard', label: 'Dashboard', icon: <LayoutGrid className="h-4 w-4" />, end: true },
  { path: '/dosen-pa/mahasiswa-bimbingan', label: 'Mahasiswa Bimbingan', icon: <Users className="h-4 w-4" />, end: false },
  { path: '#', label: 'Persetujuan Mahasiswa', icon: <UserCheck className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun dan Pengaturan', icon: <Settings className="h-4 w-4" /> },
]

/* ── PIMPINAN DITMAWA ── */
export const pimpinanDitmawaMenu = [
  { path: '/pimpinan-ditmawa/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '#', label: 'Manajemen Kurikulum', icon: <BookOpen className="h-4 w-4" /> },
  { path: '#', label: 'Bobot Poin', icon: <BarChart3 className="h-4 w-4" /> },
  { path: '#', label: 'Verifikasi', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Verifikasi Pengajuan UKM', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Verifikasi Pengajuan Eksternal', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <Settings className="h-4 w-4" /> },
]

/* ── PIMPINAN FAKULTAS ── */
export const pimpinanFakultasMenu = [
  { path: '/pimpinan-fakultas/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '/pimpinan-fakultas/persetujuan', label: 'Persetujuan Kegiatan', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <Settings className="h-4 w-4" /> },
]

/* ── PIMPINAN UTAMA ── */
export const pimpinanUtamaMenu = [
  { path: '/pimpinan-utama/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '#', label: 'Laporan', icon: <BarChart3 className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <Settings className="h-4 w-4" /> },
]

/* ── ADMIN DITMAWA ── */
export const adminDitmawaMenu = [
  { path: '/admin-ditmawa/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '#', label: 'Verifikasi', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Verifikasi Klaim Poin', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Verifikasi Pengajuan', icon: <CheckCircle className="h-4 w-4" /> },
  { path: '#', label: 'Manajemen Event Global', icon: <FileText className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <Settings className="h-4 w-4" /> },
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
  { path: '#', label: 'Ajukan Kegiatan', icon: <FileText className="h-4 w-4" /> },
  { path: '#', label: 'Riwayat', icon: <History className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <Settings className="h-4 w-4" /> },
]

/* ── UKMF ── */
export const ukmfMenu = [
  { path: '/ukmf/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, end: true },
  { path: '#', label: 'Ajukan Kegiatan', icon: <FileText className="h-4 w-4" /> },
  { path: '#', label: 'Riwayat', icon: <History className="h-4 w-4" /> },
  { path: '#', label: 'Notifikasi', icon: <Bell className="h-4 w-4" /> },
  { path: '#', label: 'Akun', icon: <Settings className="h-4 w-4" /> },
]
