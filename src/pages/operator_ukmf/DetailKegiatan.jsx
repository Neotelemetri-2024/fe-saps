import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ArrowLeft, BookOpen, CalendarDays } from 'lucide-react'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanById } from '../../services/kegiatanService'
import { InfoRow, SectionCard, formatTanggal, mapUiStatus } from '../../components/ui/DetailComponents'

function normalizeDetail(raw) {
  if (!raw) return null
  const capaianList = []
  const subCapaianList = []
  ;(raw.kegiatanCapaian || []).forEach((kc) => {
    const capNama = kc.subCapaian?.capaian?.nama
    if (capNama && !capaianList.includes(capNama)) capaianList.push(capNama)
    if (kc.subCapaian?.nama) subCapaianList.push({ label: kc.subCapaian.nama, capaian: capNama || '', persen: `${kc.alokasiPersen ?? 0}%` })
  })
  return {
    id: raw.id,
    nama: raw.nama || '-',
    organisasi: raw.organisasi?.nama || '-',
    kategori: raw.kategori?.nama || '-',
    skala: raw.skala?.nama || '-',
    tanggal: formatTanggal(raw.tanggalMulai, raw.tanggalSelesai),
    lokasi: raw.lokasi || '-',
    deskripsi: raw.deskripsi || '-',
    capaian: capaianList,
    subCapaian: subCapaianList,
    status: mapUiStatus(raw.status),
    kuota: raw.kuota ?? '-',
    penyelenggaraExt: raw.penyelenggaraExt || '-',
  }
}

function DetailKegiatan({ role, userRole }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getCurrentUser()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getKegiatanById(id)
      .then((data) => setItem(normalizeDetail(data)))
      .catch((err) => {
        setItem(null)
        toast.error('Gagal memuat detail', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [id])

  const backToList = () => navigate(`/${role}/daftar-kegiatan`)

  if (loading) return (
    <DashboardLayout role={role} userName={user?.nama || userRole} userRole={userRole}>
      <div className="py-24 text-center text-sm text-[#9aa0a6]">Memuat detail…</div>
    </DashboardLayout>
  )

  if (!item) return (
    <DashboardLayout role={role} userName={user?.nama || userRole} userRole={userRole}>
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-base font-semibold text-[#616161]">Data tidak ditemukan.</p>
        <button type="button" onClick={backToList} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-dark px-6 py-2 text-sm font-semibold text-white hover:opacity-90">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
      </div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role={role} userName={user?.nama || userRole} userRole={userRole}>
      <div className="space-y-5">
        <button type="button" onClick={backToList}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Kembali ke Daftar
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl">Detail Kegiatan</h2>
            <p className="mt-1 text-sm text-[#616161]">Informasi lengkap kegiatan {userRole}.</p>
          </div>
          <div className="shrink-0"><StatusBadge status={item.status} /></div>
        </div>

        <SectionCard title="Detail Kegiatan" icon={CalendarDays}>
          <InfoRow label="Nama Kegiatan" value={item.nama} />
          <InfoRow label={role === 'operator_ukm' ? 'Nama UKM' : 'Nama UKMF'} value={item.organisasi} />
          <InfoRow label="Jenis Kegiatan" value={item.kategori} />
          <InfoRow label="Skala" value={item.skala} />
          <InfoRow label="Tanggal" value={item.tanggal} />
          <InfoRow label="Lokasi" value={item.lokasi} />
          <InfoRow label="Kuota" value={item.kuota} />
          {item.deskripsi && item.deskripsi !== '-' && <InfoRow label="Deskripsi" value={item.deskripsi} multiline />}
        </SectionCard>

        {item.capaian?.length > 0 && (
          <SectionCard title="Capaian Kurikulum" icon={BookOpen}>
            {item.capaian.map((c, i) => <p key={i} className="text-sm font-medium text-[#111]">{c}</p>)}
          </SectionCard>
        )}

        {item.subCapaian?.length > 0 && (
          <SectionCard title="Sub Capaian & Bobot">
            {item.subCapaian.map((sc, i) => <InfoRow key={i} label={sc.label} sublabel={sc.capaian} value={sc.persen} />)}
          </SectionCard>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailKegiatan
