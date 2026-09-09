import StaffAccountManager from '../../components/staff/StaffAccountManager'

const STAFF_ROLES = ['pimpinan_utama', 'pimpinan_fakultas', 'admin_ditmawa']

export default function ManajemenAkun() {
  return (
    <StaffAccountManager
      title="Manajemen Akun"
      description="Kelola akun Pimpinan Utama, Pimpinan Fakultas, dan Admin Ditmawa."
      tableTitle="Daftar Akun"
      allowedRoles={STAFF_ROLES}
      showFaculty
    />
  )
}
