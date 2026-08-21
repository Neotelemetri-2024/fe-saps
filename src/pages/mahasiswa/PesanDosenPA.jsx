import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { get } from '../../services/apiClient'

function formatTanggalJam(value) {
  if (!value) return null
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return null
    const tanggal = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    const jam = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })
    return `${tanggal}, ${jam}`
  } catch {
    return null
  }
}

function PesanDosenPA() {
  const user = getCurrentUser()
  const [saranPa, setSaranPa] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    get('/api/mahasiswa/saran-pa')
      .then((res) => {
        const list = res?.data || res || []
        setSaranPa(Array.isArray(list) ? list : [])
      })
      .catch(() => setSaranPa([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-black sm:text-3xl">Pesan dari Dosen PA</h2>
          <p className="mt-1 text-sm text-[#616161]">Semua catatan dan saran dari Dosen PA Anda.</p>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm">
          {loading ? (
            <p className="py-6 text-center text-sm text-[#9aa0a6]">Memuat pesan…</p>
          ) : saranPa.length === 0 ? (
            <p className="py-6 text-center text-sm text-[#9aa0a6]">Belum ada pesan dari Dosen PA.</p>
          ) : (
            <div className="space-y-4">
              {saranPa.map((s) => {
                const waktu = formatTanggalJam(s.createdAt || s.tanggal)
                return (
                  <div key={s.id} className="rounded-lg border border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
                    <p className="text-sm leading-relaxed text-[#333]">{s.isi}</p>
                    <p className="mt-1 text-xs text-[#888]">
                      {waktu ? `${waktu} · ` : ''}Dosen PA
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PesanDosenPA
