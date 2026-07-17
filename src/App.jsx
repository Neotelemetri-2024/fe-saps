import { Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import MahasiswaDashboard from './pages/mahasiswa/Dashboard'
import DosenPADashboard from './pages/dosen-pa/Dashboard'
import DosenPAMahasiswaBimbingan from './pages/dosen-pa/MahasiswaBimbingan'
import DosenPADetail from './pages/dosen-pa/Detail'
import PimpinanDitmawaDashboard from './pages/pimpinan/DitmawaDashboard'
import PimpinanFakultasDashboard from './pages/pimpinan/FakultasDashboard'
import PimpinanFakultasPersetujuan from './pages/pimpinan/FakultasPersetujuan'
import PimpinanUtamaDashboard from './pages/pimpinan/UtamaDashboard'
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
      </Route>

      {/* Dosen PA */}
      <Route path="dosen-pa">
        <Route path="dashboard" element={<DosenPADashboard />} />
        <Route path="mahasiswa-bimbingan" element={<DosenPAMahasiswaBimbingan />} />
        <Route path="lihat-detail/:nim" element={<DosenPADetail />} />
      </Route>

      {/* Pimpinan Ditmawa */}
      <Route path="pimpinan-ditmawa/dashboard" element={<PimpinanDitmawaDashboard />} />

      {/* Pimpinan Fakultas */}
      <Route path="pimpinan-fakultas">
        <Route path="dashboard" element={<PimpinanFakultasDashboard />} />
        <Route path="persetujuan" element={<PimpinanFakultasPersetujuan />} />
      </Route>

      {/* Pimpinan Utama */}
      <Route path="pimpinan-utama/dashboard" element={<PimpinanUtamaDashboard />} />

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
