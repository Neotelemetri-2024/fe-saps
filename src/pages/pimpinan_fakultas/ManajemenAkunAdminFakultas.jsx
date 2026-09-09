import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StaffAccountManager from '../../components/staff/StaffAccountManager'

const ADMIN_ROLES = ['admin_fakultas']

export default function ManajemenAkunAdminFakultas() {
  return (
    <DashboardLayout>
      <StaffAccountManager
        title="Manajemen Akun Admin Fakultas"
        description="Kelola akun administrator untuk fakultas Anda."
        tableTitle="Daftar Akun Admin Fakultas"
        allowedRoles={ADMIN_ROLES}
      />
    </DashboardLayout>
  )
}
