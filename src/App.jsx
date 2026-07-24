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
import PimpinanDitmawaVerifikasiPengajuanEksternal from './pages/pimpinan/VerifikasiPengajuanEksternal'
import PimpinanDitmawaDashboardNew from './pages/pimpinan-ditmawa/Dashboard'
import PimpinanDitmawaManajemenKurikulum from './pages/pimpinan-ditmawa/ManajemenKurikulum'
import PimpinanDitmawaTambahMatriks from './pages/pimpinan-ditmawa/TambahMatriks'
import PimpinanDitmawaBobotPoin from './pages/pimpinan-ditmawa/BobotPoin'
import PimpinanDitmawaEditPoin from './pages/pimpinan-ditmawa/EditPoin'
import PimpinanDitmawaVerifikasiEksternal from './pages/pimpinan-ditmawa/VerifikasiPengajuanEksternal'
import PimpinanDitmawaDetailVerifikasiEksternal from './pages/pimpinan-ditmawa/DetailVerifikasiPengajuanEksternal'
import PimpinanDitmawaVerifikasiUKM from './pages/pimpinan-ditmawa/VerifikasiPengajuanUKM'
import PimpinanDitmawaDetailVerifikasiUKM from './pages/pimpinan-ditmawa/DetailVerifikasiPengajuanUKM'
import PimpinanDitmawaVerifikasiInternal from './pages/pimpinan-ditmawa/VerifikasiPengajuanInternal'
import PimpinanDitmawaDetailVerifikasiInternal from './pages/pimpinan-ditmawa/DetailVerifikasiPengajuanInternal'
import PimpinanFakultasDashboard from './pages/pimpinan-fakultas/FakultasDashboard'
import PimpinanFakultasPersetujuan from './pages/pimpinan-fakultas/FakultasPersetujuan'
import PimpinanFakultasVerifikasiUKMF from './pages/pimpinan-fakultas/VerifikasiPengajuanUKMF'
import DetailVerifikasiUKMF from './pages/pimpinan-fakultas/DetailVerifikasiUKMF'
import PimpinanUtamaDashboard from './pages/pimpinan-utama/UtamaDashboard'
import DetailFakultas from './pages/pimpinan-utama/DetailFakultas'
import DetailFakultasProdi from './pages/pimpinan-utama/DetailFakultasProdi'
import AdminDitmawaDashboard from './pages/admin-ditmawa/Dashboard'
import AdminDitmawaVerifikasiKlaim from './pages/admin-ditmawa/VerifikasiKlaimPoin'
import AdminDitmawaVerifikasiPengajuanEksternal from './pages/admin-ditmawa/VerifikasiPengajuanEksternal'
import AdminDitmawaDetailVerifikasiPengajuanEksternal from './pages/admin-ditmawa/DetailVerifikasiPengajuanEksternal'
import AdminDitmawaBuatEvent from './pages/admin-ditmawa/BuatEvent'
import AdminDitmawaManajemenAkunUKM from './pages/admin-ditmawa/ManajemenAkunUKM'
import AdminDitmawaManajemenEvent from './pages/admin-ditmawa/ManajemenEvent'
import AdminDitmawaVerifikasiKegiatan from './pages/admin-ditmawa/VerifikasiKegiatan'
import AdminDitmawaVerifikasiPengajuanUKM from './pages/admin-ditmawa/VerifikasiPengajuanUKM'
import AdminDitmawaDetailVerifikasiPengajuanUKM from './pages/admin-ditmawa/DetailVerifikasiPengajuanUKM'
import AdminDitmawaManajemenPesertaEvent from './pages/admin-ditmawa/ManajemenPesertaEvent'
import AdminDitmawaDetailVerifikasiKlaimPoin from './pages/admin-ditmawa/DetailVerifikasiKlaimPoin'
import AdminDitmawaVerifikasiPengajuanInternal from './pages/admin-ditmawa/VerifikasiPengajuanInternal'
import AdminDitmawaAkunPengaturan from './pages/admin-ditmawa/AkunPengaturan'
import AdminDitmawaNotifikasi from './pages/admin-ditmawa/Notifikasi'
import AdminFakultasDashboard from './pages/admin/FakultasDashboard'
import AdminFakultasDashboardNew from './pages/admin-fakultas/Dashboard'
import AdminFakultasManajemenEvent from './pages/admin-fakultas/ManajemenEvent'
import AdminFakultasBuatEvent from './pages/admin-fakultas/BuatEvent'
import AdminFakultasVerifikasiKegiatan from './pages/admin-fakultas/VerifikasiKegiatan'
import AdminFakultasManajemenPesertaEvent from './pages/admin-fakultas/ManajemenPesertaEvent'
import AdminFakultasManajemenAkunUKMF from './pages/admin-fakultas/ManajemenAkunUKMF'
import AdminFakultasVerifikasiPengajuanUKMF from './pages/admin-fakultas/VerifikasiPengajuanUKMF'
import AdminFakultasDetailVerifikasiUKMF from './pages/admin-fakultas/DetailVerifikasiUKMF'
import UKMDashboard from './pages/ukm/Dashboard'
import UKMDaftarKegiatan from './pages/ukm/DaftarKegiatan'
import UKMBuatKegiatan from './pages/ukm/BuatKegiatan'
import UKMManajemenPeserta from './pages/ukm/ManajemenPeserta'
import UKMFDashboard from './pages/ukmf/Dashboard'
import UKMFDaftarKegiatan from './pages/ukmf/DaftarKegiatan'
import UKMFBuatKegiatan from './pages/ukmf/BuatKegiatan'
import UKMFManajemenPeserta from './pages/ukmf/ManajemenPeserta'
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
          <Route path="dashboard" element={<PimpinanDitmawaDashboardNew />} />
          <Route path="manajemen-kurikulum" element={<PimpinanDitmawaManajemenKurikulum />} />
          <Route path="tambah-matriks" element={<PimpinanDitmawaTambahMatriks />} />
          <Route path="bobot-poin" element={<PimpinanDitmawaBobotPoin />} />
          <Route path="edit-poin/:id" element={<PimpinanDitmawaEditPoin />} />
          <Route path="verifikasi-pengajuan-eksternal" element={<PimpinanDitmawaVerifikasiEksternal />} />
          <Route path="verifikasi-pengajuan-eksternal/:id" element={<PimpinanDitmawaDetailVerifikasiEksternal />} />
          <Route path="verifikasi-pengajuan-ukm" element={<PimpinanDitmawaVerifikasiUKM />} />
          <Route path="verifikasi-pengajuan-ukm/:id" element={<PimpinanDitmawaDetailVerifikasiUKM />} />
          <Route path="verifikasi-pengajuan-internal" element={<PimpinanDitmawaVerifikasiInternal />} />
          <Route path="verifikasi-pengajuan-internal/:id" element={<PimpinanDitmawaDetailVerifikasiInternal />} />
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
          <Route path="verifikasi-pengajuan-eksternal" element={<AdminDitmawaVerifikasiPengajuanEksternal />} />
          <Route path="verifikasi-pengajuan-eksternal/:id" element={<AdminDitmawaDetailVerifikasiPengajuanEksternal />} />
          <Route path="verifikasi-klaim" element={<AdminDitmawaVerifikasiKlaim />} />
          <Route path="verifikasi-klaim/:id" element={<AdminDitmawaDetailVerifikasiKlaimPoin />} />
          <Route path="verifikasi-pengajuan-internal" element={<AdminDitmawaVerifikasiPengajuanInternal />} />
          <Route path="buat-event" element={<AdminDitmawaBuatEvent />} />
          <Route path="manajemen-akun-ukm" element={<AdminDitmawaManajemenAkunUKM />} />
          <Route path="manajemen-event" element={<AdminDitmawaManajemenEvent />} />
          <Route path="verifikasi-kegiatan" element={<AdminDitmawaVerifikasiKegiatan />} />
          <Route path="verifikasi-pengajuan-ukm" element={<AdminDitmawaVerifikasiPengajuanUKM />} />
          <Route path="verifikasi-pengajuan-ukm/:id" element={<AdminDitmawaDetailVerifikasiPengajuanUKM />} />
          <Route path="manajemen-peserta-event" element={<AdminDitmawaManajemenPesertaEvent />} />
          <Route path="manajemen-peserta-event/:id" element={<AdminDitmawaManajemenPesertaEvent />} />
          <Route path="pengaturan" element={<AdminDitmawaAkunPengaturan />} />
          <Route path="notifikasi" element={<AdminDitmawaNotifikasi />} />
        </Route>

        {/* Admin Fakultas */}
        <Route path="admin-fakultas" element={<AuthGuard><RoleGuard allowedRoles={['admin-fakultas']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<AdminFakultasDashboardNew />} />
          <Route path="manajemen-event" element={<AdminFakultasManajemenEvent />} />
          <Route path="buat-event" element={<AdminFakultasBuatEvent />} />
          <Route path="verifikasi-kegiatan" element={<AdminFakultasVerifikasiKegiatan />} />
          <Route path="verifikasi-kegiatan/:id/peserta" element={<AdminFakultasManajemenPesertaEvent />} />
          <Route path="manajemen-event/:id/peserta" element={<AdminFakultasManajemenPesertaEvent />} />
          <Route path="manajemen-akun-ukmf" element={<AdminFakultasManajemenAkunUKMF />} />
          <Route path="verifikasi-pengajuan-ukmf" element={<AdminFakultasVerifikasiPengajuanUKMF />} />
          <Route path="verifikasi-pengajuan-ukmf/:id" element={<AdminFakultasDetailVerifikasiUKMF />} />
        </Route>

        {/* UKM */}
        <Route path="ukm" element={<AuthGuard><RoleGuard allowedRoles={['ukm']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<UKMDashboard />} />
          <Route path="daftar-kegiatan" element={<UKMDaftarKegiatan />} />
          <Route path="buat-kegiatan" element={<UKMBuatKegiatan />} />
          <Route path="daftar-kegiatan/:id/manajemen-peserta" element={<UKMManajemenPeserta />} />
        </Route>

        {/* UKMF */}
        <Route path="ukmf" element={<AuthGuard><RoleGuard allowedRoles={['ukmf']}><Outlet /></RoleGuard></AuthGuard>}>
          <Route path="dashboard" element={<UKMFDashboard />} />
          <Route path="daftar-kegiatan" element={<UKMFDaftarKegiatan />} />
          <Route path="daftar-kegiatan/:id/manajemen-peserta" element={<UKMFManajemenPeserta />} />
          <Route path="buat-kegiatan" element={<UKMFBuatKegiatan />} />
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
