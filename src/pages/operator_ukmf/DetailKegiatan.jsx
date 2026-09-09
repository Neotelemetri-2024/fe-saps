import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanById } from '../../services/kegiatanService'
import {
  InfoRow,
  SectionCard,
  CurriculumAchievementCard,
  formatTanggal,
  mapUiStatus,
  DetailBackButton,
  DetailHeader,
  EmptyDetail,
} from '../../components/ui/DetailComponents'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'

function normalizeDetail(raw) {
  if (!raw) return null
  const capaianMap = new Map()
  const subCapaianList = []
  const kurikulumList = (raw.kegiatanCapaian || []).map((kc) => kc.subCapaian?.capaian?.kurikulum?.nama).filter(Boolean)
  const kurikulumNama = raw.kurikulumNama || raw.kurikulum?.nama || kurikulumList[0] || (typeof raw.kurikulum === 'string' ? raw.kurikulum : '-')
  ;(raw.kegiatanCapaian || []).forEach((kc) => {
    const kurNama = kc.subCapaian?.capaian?.kurikulum?.nama || kurikulumNama
    const capNama = kc.subCapaian?.capaian?.nama
    if (capNama) {
      const capKey = `${kurNama}___${capNama}`
      if (!capaianMap.has(capKey)) {
        capaianMap.set(capKey, { label: capNama, kurikulum: kurNama })
      }
    }
    if (kc.subCapaian?.nama) {
      subCapaianList.push({
        label: kc.subCapaian.nama,
        capaian: capNama || '',
        kurikulum: kurNama,
        persen: `${kc.alokasiPersen ?? 0}%`,
      })
    }
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
    capaian: Array.from(capaianMap.values()),
    subCapaian: subCapaianList,
    kurikulum: kurikulumNama,
    kegiatanCapaian: raw.kegiatanCapaian || [],
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
      <DetailSkeleton />
    </DashboardLayout>
  )

  if (!item) return (
    <DashboardLayout role={role} userName={user?.nama || userRole} userRole={userRole}>
      <EmptyDetail onBack={backToList} />
    </DashboardLayout>
  )

  return (
    <DashboardLayout role={role} userName={user?.nama || userRole} userRole={userRole}>
      <div className="space-y-5">
        <DetailBackButton onClick={backToList} />
        <DetailHeader
          title="Detail kegiatan"
          description={`Informasi lengkap kegiatan ${userRole}.`}
          status={item.status}
        />

        <SectionCard title="Detail Kegiatan">
          <InfoRow label="Nama Kegiatan" value={item.nama} />
          <InfoRow label={role === 'operator_ukm' ? 'Nama UKM' : 'Nama UKMF'} value={item.organisasi} />
          <InfoRow label="Jenis Kegiatan" value={item.kategori} />
          <InfoRow label="Skala" value={item.skala} />
          <InfoRow label="Lokasi" value={item.lokasi} />
          <InfoRow label="Kuota" value={item.kuota} />
          {item.deskripsi && item.deskripsi !== '-' && <InfoRow label="Deskripsi" value={item.deskripsi} multiline />}
        </SectionCard>

        <CurriculumAchievementCard
          kurikulum={item.kurikulum}
          capaian={item.capaian}
          subCapaian={item.subCapaian}
          kegiatanCapaian={item.kegiatanCapaian}
        />
      </div>
    </DashboardLayout>
  )
}

export default DetailKegiatan
