import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser, getKurikulumMahasiswa } from '../../services/authService'
import { getKegiatanById, getRiwayatKegiatanInternal } from '../../services/kegiatanService'
import {
  InfoRow,
  SectionCard,
  DetailBackButton,
  DetailHeader,
  DecisionNote,
  EmptyDetail,
  CurriculumAchievementCard,
  formatTanggal,
} from '../../components/ui/DetailComponents'
import { DetailSkeleton } from '../../components/dashboard/Skeleton'

function normalizeCapaianData(kegiatan, userKurikulumId, userKurikulumNama) {
  if (!kegiatan || !Array.isArray(kegiatan.kegiatanCapaian)) {
    return { kurikulum: userKurikulumNama || '-', capaian: [], subCapaian: [], kegiatanCapaian: [] }
  }

  const allList = kegiatan.kegiatanCapaian

  // Filter ke kurikulum mahasiswa jika tersedia
  let list = allList
  if (userKurikulumId || userKurikulumNama) {
    const filtered = allList.filter((kc) => {
      const kurId = kc.subCapaian?.capaian?.kurikulum?.id ?? kc.capaian?.kurikulum?.id ?? kc.kurikulum?.id
      const kurNama = kc.subCapaian?.capaian?.kurikulum?.nama ?? kc.capaian?.kurikulum?.nama ?? kc.kurikulum?.nama
      if (userKurikulumId && kurId != null) return Number(kurId) === Number(userKurikulumId)
      if (userKurikulumNama && kurNama) return kurNama.trim().toLowerCase() === userKurikulumNama.trim().toLowerCase()
      return false
    })
    // Tampilkan HANYA kurikulum mahasiswa yang dipakai (jangan fallback ke kurikulum lain)
    list = filtered
  }

  const capaianMap = new Map()
  const subCapaianList = []
  const kurikulumSet = new Set()

  list.forEach((kc) => {
    const cap = kc.subCapaian?.capaian || kc.capaian
    const kurNama = cap?.kurikulum?.nama || kc.kurikulum?.nama || userKurikulumNama || '-'
    const capNama = cap?.nama || cap?.label
    if (kurNama && kurNama !== '-') kurikulumSet.add(kurNama)
    if (capNama) {
      const capKey = `${kurNama}___${capNama}`
      if (!capaianMap.has(capKey)) {
        capaianMap.set(capKey, { label: capNama, kurikulum: kurNama })
      }
    }
    if (kc.subCapaian?.nama || kc.nama) {
      subCapaianList.push({
        label: kc.subCapaian?.nama || kc.nama,
        capaian: capNama || '',
        kurikulum: kurNama,
        persen: kc.alokasiPersen != null ? `${kc.alokasiPersen}%` : '',
      })
    }
  })

  const kurNameResolved =
    userKurikulumNama ||
    Array.from(kurikulumSet).join(', ') ||
    kegiatan.kurikulum?.nama ||
    '-'

  return {
    kurikulum: kurNameResolved,
    capaian: Array.from(capaianMap.values()),
    subCapaian: subCapaianList,
    kegiatanCapaian: list,
  }
}

function DetailKegiatanInternal() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()

  const [partisipasi, setPartisipasi] = useState(location.state?.row || null)
  const [kegiatan, setKegiatan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userKurikulum, setUserKurikulum] = useState({
    id: location.state?.row?.kurikulumId ?? user?.kurikulumId ?? null,
    nama: location.state?.row?.kurikulumNama ?? user?.kurikulumNama ?? null,
  })

  useEffect(() => {
    let isMounted = true
    setLoading(true)

    const loadData = async () => {
      try {
        let resolvedKurId = location.state?.row?.kurikulumId ?? user?.kurikulumId ?? null
        let resolvedKurNama = location.state?.row?.kurikulumNama ?? user?.kurikulumNama ?? null

        // 1. Coba ambil kurikulum mahasiswa jika belum ada
        if (!resolvedKurId && !resolvedKurNama) {
          try {
            const kurData = await getKurikulumMahasiswa()
            if (kurData?.id || kurData?.nama) {
              resolvedKurId = kurData.id ?? null
              resolvedKurNama = kurData.nama ?? null
            }
          } catch {
            // ignore
          }
        }

        // 2. Selalu fetch riwayat fresh untuk mendapatkan kurikulumId mahasiswa & status partisipasi
        const res = await getRiwayatKegiatanInternal()
        const list = Array.isArray(res.riwayat) ? res.riwayat : []
        const freshRow = list.find((r) => String(r.id) === String(id) || String(r.kegiatanId) === String(id))

        let currentPartisipasi = freshRow || partisipasi
        if (isMounted && freshRow) setPartisipasi(freshRow)

        if (freshRow?.kurikulumId || freshRow?.kurikulumNama) {
          resolvedKurId = freshRow.kurikulumId ?? resolvedKurId
          resolvedKurNama = freshRow.kurikulumNama ?? resolvedKurNama
        }

        // 3. Ambil data kegiatan
        const targetKegiatanId = currentPartisipasi?.kegiatanId || id
        if (targetKegiatanId) {
          const kgData = await getKegiatanById(targetKegiatanId)
          if (isMounted) setKegiatan(kgData)
          if (kgData?.userKurikulum?.id || kgData?.userKurikulum?.nama) {
            resolvedKurId = kgData.userKurikulum.id ?? resolvedKurId
            resolvedKurNama = kgData.userKurikulum.nama ?? resolvedKurNama
          }
        }

        if (isMounted && (resolvedKurId || resolvedKurNama)) {
          setUserKurikulum({
            id: resolvedKurId,
            nama: resolvedKurNama,
          })
        }
      } catch (err) {
        if (isMounted) {
          toast.error('Gagal memuat detail kegiatan internal', { description: err.message })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [id])

  const backToList = () => navigate('/mahasiswa/riwayat-kegiatan-internal')

  if (loading) {
    return (
      <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
        <DetailSkeleton />
      </DashboardLayout>
    )
  }

  if (!partisipasi && !kegiatan) {
    return (
      <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
        <EmptyDetail onBack={backToList} />
      </DashboardLayout>
    )
  }

  const namaKegiatan = partisipasi?.namaKegiatan || kegiatan?.nama || '-'
  const jenisKegiatan = partisipasi?.jenisKegiatan || kegiatan?.kategori?.nama || '-'
  const skala = partisipasi?.skala || kegiatan?.skala?.nama || '-'
  const penyelenggara = partisipasi?.penyelenggara || kegiatan?.organisasi?.nama || 'Ditmawa / Universitas'
  const tanggalPelaksanaan = formatTanggal(
    partisipasi?.tanggalMulai || kegiatan?.tanggalMulai,
    partisipasi?.tanggalSelesai || kegiatan?.tanggalSelesai
  )
  const lokasi = kegiatan?.lokasi || '-'
  const kuota = kegiatan?.kuota != null ? `${kegiatan.kuota} peserta` : '-'
  const deskripsi = kegiatan?.deskripsi || '-'

  const statusPoin = partisipasi?.statusPoin || 'Belum Cair'
  const peran = partisipasi?.peran || '-'
  const kehadiran = partisipasi?.kehadiran || 'Belum Tercatat'
  const statusIzinPA = partisipasi?.statusIzinPA || (partisipasi?.statusPaLabel ?? 'Belum Diajukan')
  const poin = partisipasi?.poin != null && partisipasi?.poin !== '' ? partisipasi.poin : '-'

  const capaianData = normalizeCapaianData(kegiatan, userKurikulum.id, userKurikulum.nama)

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-5">
        <DetailBackButton onClick={backToList} />
        <DetailHeader
          title="Detail Kegiatan Internal"
          description="Informasi lengkap kegiatan internal dan status perolehan poin Anda."
          status={statusPoin}
        />

        {partisipasi?.izinPA?.alasan && (
          <DecisionNote
            status={partisipasi.izinPA.status}
            alasan={partisipasi.izinPA.alasan}
          />
        )}

        <SectionCard title="Informasi Kegiatan">
          <InfoRow label="Nama Kegiatan" value={namaKegiatan} />
          <InfoRow label="Penyelenggara" value={penyelenggara} />
          <InfoRow label="Jenis / Kategori" value={jenisKegiatan} />
          <InfoRow label="Skala" value={skala} />
          <InfoRow label="Tanggal Pelaksanaan" value={tanggalPelaksanaan} />
          <InfoRow label="Lokasi" value={lokasi} />
          <InfoRow label="Kuota" value={kuota} />
          {deskripsi && deskripsi !== '-' && (
            <InfoRow label="Deskripsi" value={deskripsi} multiline />
          )}
        </SectionCard>

        <SectionCard title="Status Partisipasi Anda">
          <InfoRow label="Peran Anda" value={peran} />
          <InfoRow label="Status Kehadiran" value={kehadiran} />
          <InfoRow label="Status Izin Dosen PA" value={statusIzinPA} />
          <InfoRow label="Status Poin" value={statusPoin} />
          <InfoRow label="Poin Diperoleh" value={poin} />
        </SectionCard>

        {(capaianData.capaian.length > 0 || capaianData.subCapaian.length > 0 || (capaianData.kegiatanCapaian && capaianData.kegiatanCapaian.length > 0)) && (
          <CurriculumAchievementCard
            kurikulum={capaianData.kurikulum}
            capaian={capaianData.capaian}
            subCapaian={capaianData.subCapaian}
            kegiatanCapaian={capaianData.kegiatanCapaian}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

export default DetailKegiatanInternal
