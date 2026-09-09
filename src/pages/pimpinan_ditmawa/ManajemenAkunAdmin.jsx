import StaffAccountManager from '../../components/staff/StaffAccountManager'

const ADMIN_ROLES = ['admin_ditmawa']

export default function ManajemenAkunAdmin() {
  return (
    <StaffAccountManager
      title="Manajemen Akun Admin Ditmawa"
      description="Kelola akun administrator tingkat universitas."
      tableTitle="Daftar Akun Admin Ditmawa"
      allowedRoles={ADMIN_ROLES}
    />
  )
}
