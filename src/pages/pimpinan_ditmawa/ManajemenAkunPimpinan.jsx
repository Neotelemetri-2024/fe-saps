import StaffAccountManager from '../../components/staff/StaffAccountManager'

const PIMPINAN_ROLES = ['pimpinan_utama', 'pimpinan_fakultas']

export default function ManajemenAkunPimpinan() {
  return (
    <StaffAccountManager
      title="Manajemen Akun Pimpinan"
      description="Kelola akun Pimpinan Utama dan Pimpinan Fakultas."
      tableTitle="Daftar Akun Pimpinan"
      allowedRoles={PIMPINAN_ROLES}
      showFaculty
    />
  )
}
