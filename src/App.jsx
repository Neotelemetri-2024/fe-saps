import { Toaster } from 'sonner'
import { Route, Routes, Outlet } from 'react-router-dom'
import AuthGuard, { RoleGuard } from './components/AuthGuard'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import MahasiswaDashboard from './pages/mahasiswa/Dashboard'
import AjukanKegiatanEksternal from './pages/mahasiswa/AjukanKegiatanEksternal'
import AjukanKegiatanForm from './pages/mahasiswa/AjukanKegiatanForm'
import GenerateCV from './pages/mahasiswa/GenerateCV'
import PersetujuanDosen from './pages/mahasiswa/PersetujuanDosen'
import KlaimPoinCapaian from './pages/mahasiswa/KlaimPoinCapaian'
import RiwayatPoin from './pages/mahasiswa/RiwayatPoin'
import AkunPengaturan from './pages/mahasiswa/AkunPengaturan'
import Notifikasi from './pages/mahasiswa/Notifikasi'
import DosenPADashboard from './pages/dosen-pa/Dashboard'
import DosenPAMahasiswaBimbingan from './pages/dosen-pa/MahasiswaBimbingan'
import DosenPADetail from './pages/dosen-pa/Detail'
import PermintaanPersetujuan from './pages/dosen-pa/PermintaanPersetujuan'
import MahasiswaPerluPerhatian from './pages/dosen-pa/MahasiswaPerluPerhatian'
import PimpinanDitmawaDashboard from './pages/pimpinan/DitmawaDashboard'
import PimpinanFakultasDashboard from './pages/pimpinan-fakultas/FakultasDashboard'
import PimpinanFakultasPersetujuan from './pages/pimpinan-fakultas/FakultasPersetujuan'
import PimpinanFakultasVerifikasiUKMF from './pages/pimpinan-fakultas/VerifikasiPengajuanUKMF'
import DetailVerifikasiUKMF from './pages/pimpinan-fakultas/DetailVerifikasiUKMF'
import PimpinanUtamaDashboard from './pages/pimpinan-utama/UtamaDashboard'
import DetailFakultas from './pages/pimpinan-utama/DetailFakultas'
import DetailFakultasProdi from './pages/pimpinan-utama/DetailFakultasProdi'
import AdminDitmawaDashboard from './pages/admin-ditmawa/Dashboard'
import AdminDitmawaVerifikasiKlaim from './pages/admin-ditmawa/VerifikasiKlaimPoin'
import AdminFakultasDashboard from './pages/admin/FakultasDashboard'
import UKMDashboard from './pages/ukm/Dashboard'
import UKMDaftarKegiatan from './pages/ukm/DaftarKegiatan'
import UKMManajemenPeserta from './pages/ukm/ManajemenPeserta'
import UKMFDashboard from './pages/ukmf/Dashboard'
import UKMFDaftarKegiatan from './pages/ukmf/DaftarKegiatan'
import UKMFBuatKegiatan from './pages/ukmf/BuatKegiatan'
import UKMFFormBuatKegiatan from './pages/ukmf/FormBuatKegiatan'
import UKMFAkunDanPengaturan from './pages/ukmf/AkunDanPengaturan'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Mahasiswa */}
        <Route path="mahasiswa" element={<AuthGuard><RoleGuard allowedRoles={['mahasiswa']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<MahasiswaDashboard />} />
          <Route path="kegiatan-eksternal" element={<AjukanKegiatanEksternal />} />
          <Route path="kegiatan-eksternal/ajukan" element={<AjukanKegiatanForm />} />
          <Route path="generate-cv" element={<GenerateCV />} />
          <Route path="persetujuan-dosen" element={<PersetujuanDosen />} />
          <Route path="klaim-poin" element={<KlaimPoinCapaian />} />
          <Route path="riwayat-poin" element={<RiwayatPoin />} />
          <Route path="pengaturan" element={<AkunPengaturan />} />
          <Route path="notifikasi" element={<Notifikasi />} />
        </Route>

        {/* Dosen PA */}
        <Route path="dosen-pa" element={<AuthGuard><RoleGuard allowedRoles={['dosen-pa']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<DosenPADashboard />} />
          <Route path="mahasiswa-bimbingan" element={<DosenPAMahasiswaBimbingan />} />
          <Route path="lihat-detail/:nim" element={<DosenPADetail />} />
          <Route path="permintaan-persetujuan" element={<PermintaanPersetujuan />} />
          <Route path="mahasiswa-perlu-perhatian" element={<MahasiswaPerluPerhatian />} />
        </Route>

        {/* Pimpinan Ditmawa */}
        <Route path="pimpinan-ditmawa" element={<AuthGuard><RoleGuard allowedRoles={['pimpinan-ditmawa']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<PimpinanDitmawaDashboard />} />
        </Route>

        {/* Pimpinan Fakultas */}
        <Route path="pimpinan-fakultas" element={<AuthGuard><RoleGuard allowedRoles={['pimpinan-fakultas']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<PimpinanFakultasDashboard />} />
          <Route path="persetujuan" element={<PimpinanFakultasPersetujuan />} />
          <Route path="verifikasi-pengajuan-ukmf" element={<PimpinanFakultasVerifikasiUKMF />} />
          <Route path="verifikasi-pengajuan-ukmf/:id" element={<DetailVerifikasiUKMF />} />
        </Route>

        {/* Pimpinan Utama */}
        <Route path="pimpinan-utama" element={<AuthGuard><RoleGuard allowedRoles={['pimpinan-utama']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<PimpinanUtamaDashboard />} />
          <Route path="detail-fakultas" element={<DetailFakultas />} />
          <Route path="detail-fakultas/:fakultas" element={<DetailFakultasProdi />} />
        </Route>

        {/* Admin Ditmawa */}
        <Route path="admin-ditmawa" element={<AuthGuard><RoleGuard allowedRoles={['admin-ditmawa']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<AdminDitmawaDashboard />} />
          <Route path="verifikasi-klaim" element={<AdminDitmawaVerifikasiKlaim />} />
        </Route>

        {/* Admin Fakultas */}
        <Route path="admin-fakultas" element={<AuthGuard><RoleGuard allowedRoles={['admin-fakultas']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<AdminFakultasDashboard />} />
        </Route>

        {/* UKM */}
        <Route path="ukm" element={<AuthGuard><RoleGuard allowedRoles={['ukm']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<UKMDashboard />} />
          <Route path="daftar-kegiatan" element={<UKMDaftarKegiatan />} />
          <Route path="daftar-kegiatan/:id/manajemen-peserta" element={<UKMManajemenPeserta />} />
        </Route>

        {/* UKMF */}
        <Route path="ukmf" element={<AuthGuard><RoleGuard allowedRoles={['ukmf']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<UKMFDashboard />} />
          <Route path="daftar-kegiatan" element={<UKMFDaftarKegiatan />} />
          <Route path="buat-kegiatan" element={<UKMFBuatKegiatan />} />
          <Route path="buat-kegiatan/form" element={<UKMFFormBuatKegiatan />} />
          <Route path="pengaturan" element={<UKMFAkunDanPengaturan />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster position="top-right" richColors closeButton />
    </>
  )
}

export default App
