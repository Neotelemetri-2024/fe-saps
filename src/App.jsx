import { Route, Routes } from 'react-router-dom'
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
import PimpinanFakultasDashboard from './pages/pimpinan/FakultasDashboard'
import PimpinanFakultasPersetujuan from './pages/pimpinan/FakultasPersetujuan'
import PimpinanUtamaDashboard from './pages/pimpinan-utama/UtamaDashboard'
import DetailFakultas from './pages/pimpinan-utama/DetailFakultas'
import DetailFakultasProdi from './pages/pimpinan-utama/DetailFakultasProdi'
import AdminDitmawaDashboard from './pages/admin/DitmawaDashboard'
import AdminFakultasDashboard from './pages/admin/FakultasDashboard'
import UKMDashboard from './pages/ukm/Dashboard'
import UKMFDashboard from './pages/ukmf/Dashboard'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Mahasiswa */}
      <Route path="mahasiswa">
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
      <Route path="dosen-pa">
        <Route path="dashboard" element={<DosenPADashboard />} />
        <Route path="mahasiswa-bimbingan" element={<DosenPAMahasiswaBimbingan />} />
        <Route path="lihat-detail/:nim" element={<DosenPADetail />} />
        <Route path="permintaan-persetujuan" element={<PermintaanPersetujuan />} />
        <Route path="mahasiswa-perlu-perhatian" element={<MahasiswaPerluPerhatian />} />
      </Route>

      {/* Pimpinan Ditmawa */}
      <Route path="pimpinan-ditmawa/dashboard" element={<PimpinanDitmawaDashboard />} />

      {/* Pimpinan Fakultas */}
      <Route path="pimpinan-fakultas">
        <Route path="dashboard" element={<PimpinanFakultasDashboard />} />
        <Route path="persetujuan" element={<PimpinanFakultasPersetujuan />} />
      </Route>

      {/* Pimpinan Utama */}
      <Route path="pimpinan-utama">
        <Route path="dashboard" element={<PimpinanUtamaDashboard />} />
        <Route path="detail-fakultas" element={<DetailFakultas />} />
        <Route path="detail-fakultas/:fakultas" element={<DetailFakultasProdi />} />
      </Route>

      {/* Admin Ditmawa */}
      <Route path="admin-ditmawa/dashboard" element={<AdminDitmawaDashboard />} />

      {/* Admin Fakultas */}
      <Route path="admin-fakultas/dashboard" element={<AdminFakultasDashboard />} />

      {/* UKM */}
      <Route path="ukm/dashboard" element={<UKMDashboard />} />

      {/* UKMF */}
      <Route path="ukmf/dashboard" element={<UKMFDashboard />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App
