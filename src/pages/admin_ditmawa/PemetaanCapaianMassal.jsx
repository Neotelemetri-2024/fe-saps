import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getKegiatanById, verifikasiBulk } from '../../services/kegiatanService'
import { getKurikulumAktif } from '../../services/kurikulumService'
import PemetaanCapaianKurikulumSection from '../../components/PemetaanCapaianKurikulumSection'
import {
  DetailBackButton,
  DetailHeader,
  SectionCard,
  InfoRow,
} from '../../components/ui/DetailComponents'
import { batalBtnClass } from '../../components/ui/buttonStyles'

function formatTanggal(tanggal) {
  if (!tanggal) return '-'
  try {
    const d = new Date(tanggal)
    if (Number.isNaN(d.getTime())) return '-'
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch {
    return '-'
  }
}

function normalizeKegiatan(k) {
  const pembuat = k.pembuat || {}
  const mhs = pembuat.mahasiswa || {}
  const mhsKur = k.mahasiswaKurikulum || null
  const kurikulumNama = mhsKur?.nama || mhs.kurikulum?.nama || k.kurikulumNama || k.kurikulum?.nama || '-'
  const kurikulumId = mhsKur?.id || mhs.kurikulum?.id || k.kurikulum?.id || null
  const existingCapaianIds = [
    ...new Set(
      (k.kegiatanCapaian || [])
        .map((kc) => kc.subCapaian?.capaianId || kc.subCapaian?.capaian?.id)
        .filter(Boolean)
    ),
  ]
  const existingKurIds = [
    ...new Set(
      (k.kegiatanCapaian || [])
        .map((kc) => kc.subCapaian?.capaian?.kurikulumId)
        .filter(Boolean)
    ),
  ]
  return {
    id: k.id,
    nama: k.nama || '-',
    mahasiswa: pembuat.nama || '-',
    nim: mhs.nim || '-',
    prodi: mhs.prodi?.nama || '-',
    fakultas: mhs.prodi?.fakultas?.nama || '-',
    kategori: k.kategori?.nama || '-',
    skala: k.skala?.nama || '-',
    penyelenggara: k.penyelenggaraExt || '-',
    deskripsi: k.deskripsi || '',
    tanggal: formatTanggal(k.tanggalMulai),
    kurikulumNama,
    kurikulumId,
    mahasiswaKurikulum: mhsKur,
    existing: (k.kegiatanCapaian || []).map((kc) => ({
      subCapaianId: kc.subCapaianId,
      alokasiPersen: Number(kc.alokasiPersen ?? 0),
    })),
    existingCapaianIds,
    existingKurIds,
  }
}

function buildForm(kegiatan, kurList = []) {
  const kurIds = kurList.map((k) => k.id)
  return {
    kurikulumIds: kurIds,
    capaianIds: kegiatan.existingCapaianIds || [],
    alokasi: (kegiatan.existing || []).map((e) => ({
      subCapaianId: e.subCapaianId,
      alokasiPersen: e.alokasiPersen || 100,
    })),
  }
}

function PemetaanCapaianMassal() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()

  const kegiatanIds = useMemo(() => {
    const ids = location.state?.kegiatanIds || []
    return Array.isArray(ids) ? ids.map(Number).filter(Boolean) : []
  }, [location.state])

  const [kegiatans, setKegiatans] = useState([])
  const [kurikulumList, setKurikulumList] = useState([])
  const [loading, setLoading] = useState(kegiatanIds.length > 0)
  const [loadingKur, setLoadingKur] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getKurikulumAktif()
      .then((kur) => {
        const list = Array.isArray(kur) ? kur : (kur ? [kur] : [])
        setKurikulumList(list)
      })
      .catch(() => toast.error('Gagal memuat kurikulum'))
      .finally(() => setLoadingKur(false))
  }, [])

  useEffect(() => {
    if (kegiatanIds.length === 0) return
    let isMounted = true
    Promise.all(kegiatanIds.map((id) => getKegiatanById(id).catch(() => null)))
      .then((results) => {
        if (!isMounted) return
        const valid = results.filter(Boolean).map((k) => {
          const normalized = normalizeKegiatan(k)
          return { ...normalized, ...buildForm(normalized, kurikulumList) }
        })
        if (valid.length === 0) {
          toast.error('Data kegiatan tidak ditemukan.')
          navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal', { replace: true })
          return
        }
        setKegiatans(valid)
        setActiveIndex(0)
      })
      .catch(() => {
        if (isMounted) toast.error('Gagal memuat data kegiatan')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [kegiatanIds, kurikulumList, navigate])

  const backToList = () => navigate('/admin_ditmawa/verifikasi-pengajuan-eksternal')

  const active = kegiatans[activeIndex] || null

  const isLengkap = (kegiatan) => {
    if (!kegiatan || kurikulumList.length === 0) return false
    for (const kur of kurikulumList) {
      const kurSubIds = (kur.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      const kurAlokasi = (kegiatan.alokasi || []).filter((a) => kurSubIds.includes(a.subCapaianId))
      if (kurAlokasi.length === 0) return false
      const sum = kurAlokasi.reduce((s, a) => s + (Number(a.alokasiPersen) || 0), 0)
      if (Math.abs(sum - 100) > 0.01) return false
    }
    return true
  }

  const getKurikulumStatus = (kegiatan) => {
    if (!kegiatan || kurikulumList.length === 0) return { complete: 0, total: 0 }
    let complete = 0
    for (const kur of kurikulumList) {
      const kurSubIds = (kur.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      const kurAlokasi = (kegiatan.alokasi || []).filter((a) => kurSubIds.includes(a.subCapaianId))
      if (kurAlokasi.length > 0) {
        const sum = kurAlokasi.reduce((s, a) => s + (Number(a.alokasiPersen) || 0), 0)
        if (Math.abs(sum - 100) < 0.01) complete += 1
      }
    }
    return { complete, total: kurikulumList.length }
  }

  const allLengkap = kegiatans.length > 0 && kegiatans.every(isLengkap)
  const jumlahLengkap = kegiatans.filter(isLengkap).length

  const updateActive = (fn) => {
    setKegiatans((prev) =>
      prev.map((k, i) => (i === activeIndex ? fn(k) : k))
    )
  }

  const handleBagiRata = () => {
    if (!active || !active.alokasi || active.alokasi.length === 0) return
    const newAlokasi = [...active.alokasi]

    for (const kur of kurikulumList) {
      const kurSubIds = (kur.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))
      const indices = []
      newAlokasi.forEach((a, idx) => {
        if (kurSubIds.includes(a.subCapaianId)) {
          indices.push(idx)
        }
      })
      if (indices.length > 0) {
        const count = indices.length
        const base = Math.floor(100 / count)
        const remainder = 100 - base * count
        indices.forEach((idx, i) => {
          newAlokasi[idx] = {
            ...newAlokasi[idx],
            alokasiPersen: i === 0 ? base + remainder : base,
          }
        })
      }
    }

    updateActive((k) => ({
      ...k,
      alokasi: newAlokasi,
    }))
  }

  const handleSubmit = async () => {
    const belumLengkap = kegiatans.filter((k) => !isLengkap(k))
    if (belumLengkap.length > 0) {
      toast.error(`Ada ${belumLengkap.length} kegiatan yang belum lengkap. Total bobot setiap kurikulum aktif harus tepat 100%.`)
      return
    }
    setSubmitting(true)
    try {
      const alokasiBulk = kegiatans.map((k) => ({
        kegiatanId: Number(k.id),
        alokasi: (k.alokasi || []).map((a) => ({
          subCapaianId: Number(a.subCapaianId),
          alokasiPersen: Number(a.alokasiPersen),
        })),
      }))
      await verifikasiBulk(kegiatans.map((k) => k.id), 'setuju', undefined, alokasiBulk)
      toast.success(`${kegiatans.length} pengajuan berhasil diteruskan ke Pimpinan Ditmawa.`)
      backToList()
    } catch (err) {
      toast.error('Gagal meneruskan', { description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
        <div className="py-24 text-center text-sm text-base-content/50">Memuat data kegiatan…</div>
      </DashboardLayout>
    )
  }

  if (!loading && kegiatans.length === 0) {
    return (
      <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
        <div className="space-y-5">
          <DetailBackButton onClick={backToList} />
          <div className="card border border-base-300 bg-base-100 p-8 text-center">
            <p className="text-base font-semibold text-base-content">Tidak Ada Kegiatan yang Dipilih</p>
            <p className="mt-1 text-sm text-base-content/60">
              Pilih satu atau beberapa kegiatan di halaman Verifikasi Pengajuan Eksternal terlebih dahulu untuk melakukan pemetaan capaian secara massal.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={backToList}
                className="btn btn-primary btn-sm"
              >
                Menuju ke Verifikasi Pengajuan Eksternal
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="admin_ditmawa" userName={user?.nama || 'Admin Ditmawa'} userRole="Admin Ditmawa">
      <div className="space-y-5">
        <DetailBackButton onClick={backToList} children="Kembali ke Verifikasi Pengajuan" />

        <DetailHeader
          title="Pemetaan Capaian Massal"
          description={`Isi pemetaan capaian kurikulum untuk ${kegiatans.length} kegiatan eksternal mahasiswa sebelum diteruskan ke Pimpinan.`}
        />

        {loadingKur ? (
          <div className="card border border-base-300 bg-base-100 p-6 text-sm text-base-content/50">
            Memuat kurikulum…
          </div>
        ) : kurikulumList.length === 0 ? (
          <div className="alert alert-error text-sm">
            Kurikulum aktif tidak ditemukan. Hubungi Super Admin untuk mengaktifkan kurikulum terlebih dahulu.
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
            {/* Sidebar Daftar Kegiatan */}
            <div className="card border border-base-300 bg-base-100 overflow-hidden self-start">
              <div className="flex items-center justify-between border-b border-base-300 bg-base-200/50 px-4 py-3">
                <h3 className="text-sm font-semibold text-base-content">
                  Daftar Kegiatan ({kegiatans.length})
                </h3>
                <span className="text-xs font-medium text-base-content/60">
                  {jumlahLengkap}/{kegiatans.length} Lengkap
                </span>
              </div>

              <div className="divide-y divide-base-300">
                {kegiatans.map((k, idx) => {
                  const lengkap = isLengkap(k)
                  const isActive = idx === activeIndex
                  const kStatus = getKurikulumStatus(k)

                  return (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition cursor-pointer ${
                        isActive
                          ? 'border-l-2 border-primary bg-primary/5'
                          : 'border-l-2 border-transparent hover:bg-base-200/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm font-medium ${
                          isActive ? 'text-primary' : 'text-base-content'
                        }`}>
                          {idx + 1}. {k.nama}
                        </span>
                        {lengkap ? (
                          <span className="shrink-0 text-xs font-medium text-success">✓ Lengkap</span>
                        ) : (
                          <span className="shrink-0 text-xs text-base-content/40">
                            {kStatus.complete > 0 ? `${kStatus.complete}/${kStatus.total}` : 'Belum'}
                          </span>
                        )}
                      </div>

                      <p className="truncate text-xs text-base-content/60">
                        {k.mahasiswa} · {k.nim}
                      </p>

                      <p className="truncate text-xs text-base-content/40">
                        {k.prodi}{k.skala && k.skala !== '-' ? ` · ${k.skala}` : ''}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Panel Kanan: Detail Kegiatan & Form Pemetaan */}
            {active && (
              <div className="space-y-5 min-w-0">
                {/* 1. Informasi Mahasiswa & Kegiatan */}
                <SectionCard title={`Informasi Kegiatan #${activeIndex + 1} — ${active.nama}`}>
                  <InfoRow label="Mahasiswa" value={`${active.mahasiswa} (${active.nim})`} />
                  <InfoRow label="Program Studi" value={`${active.prodi} — ${active.fakultas}`} />
                  <InfoRow label="Kurikulum Mahasiswa" value={active.kurikulumNama} />
                  <InfoRow label="Nama Kegiatan" value={active.nama} />
                  <InfoRow label="Kategori & Skala" value={`${active.kategori} · Skala ${active.skala}`} />
                  <InfoRow label="Pelaksanaan" value={`${active.tanggal} · Penyelenggara: ${active.penyelenggara}`} />
                  {active.deskripsi ? <InfoRow label="Deskripsi" value={active.deskripsi} multiline /> : null}
                </SectionCard>

                {/* 2. Pemetaan Capaian Kurikulum */}
                <div className="card border border-base-300 bg-base-100 p-5 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-base-300 pb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-base-content">
                        Pemetaan Capaian Kurikulum
                      </h3>
                      <p className="mt-0.5 text-xs text-base-content/60">
                        Pilih capaian dan tentukan alokasi bobot sub-capaian untuk seluruh kurikulum yang sedang aktif.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(active.alokasi || []).length > 1 && (
                        <button
                          type="button"
                          onClick={handleBagiRata}
                          className="btn btn-ghost btn-xs text-primary hover:bg-base-200"
                        >
                          Bagi Rata (100% per Kurikulum)
                        </button>
                      )}
                      {isLengkap(active) ? (
                        <span className="badge badge-success badge-sm">
                          Semua Kurikulum 100% (Lengkap)
                        </span>
                      ) : (
                        <span className="badge badge-warning badge-sm badge-outline">
                          {(() => {
                            const st = getKurikulumStatus(active)
                            return st.complete > 0 ? `${st.complete}/${st.total} Kurikulum Lengkap` : 'Belum Lengkap'
                          })()}
                        </span>
                      )}
                    </div>
                  </div>

                  <PemetaanCapaianKurikulumSection
                    kurikulumList={kurikulumList}
                    selectedKurikulumIds={active.kurikulumIds || kurikulumList.map((k) => k.id)}
                    setSelectedKurikulumIds={(ids) =>
                      updateActive((k) => ({
                        ...k,
                        kurikulumIds: typeof ids === 'function' ? ids(k.kurikulumIds || []) : ids,
                      }))
                    }
                    selectedCapaianIds={active.capaianIds || []}
                    setSelectedCapaianIds={(cids) =>
                      updateActive((k) => ({
                        ...k,
                        capaianIds: typeof cids === 'function' ? cids(k.capaianIds || []) : cids,
                      }))
                    }
                    alokasi={active.alokasi || []}
                    setAlokasi={(aloks) =>
                      updateActive((k) => ({
                        ...k,
                        alokasi: typeof aloks === 'function' ? aloks(k.alokasi || []) : aloks,
                      }))
                    }
                    compact={true}
                  />

                  {/* Navigasi Antar Kegiatan */}
                  <div className="flex items-center justify-between border-t border-base-300 pt-3 text-xs">
                    <button
                      type="button"
                      disabled={activeIndex === 0}
                      onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                      className="btn btn-ghost btn-xs text-base-content disabled:opacity-40"
                    >
                      ← Kegiatan Sebelumnya
                    </button>
                    <span className="text-base-content/50">
                      Kegiatan {activeIndex + 1} dari {kegiatans.length}
                    </span>
                    <button
                      type="button"
                      disabled={activeIndex === kegiatans.length - 1}
                      onClick={() => setActiveIndex((prev) => Math.min(kegiatans.length - 1, prev + 1))}
                      className="btn btn-ghost btn-xs text-base-content disabled:opacity-40"
                    >
                      Kegiatan Selanjutnya →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Aksi */}
        <div className="card border border-base-300 bg-base-100 p-4 sm:p-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-base-content/70">
            {allLengkap
              ? 'Semua kegiatan telah lengkap dipetakan (100%). Siap diteruskan ke Pimpinan Ditmawa.'
              : `${kegiatans.length - jumlahLengkap} dari ${kegiatans.length} kegiatan belum lengkap (total bobot tiap kegiatan harus tepat 100%).`}
          </p>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={backToList}
              className={batalBtnClass}
            >
              Batal
            </button>
            <button
              type="button"
              disabled={submitting || !allLengkap}
              onClick={handleSubmit}
              className="btn btn-primary btn-sm"
            >
              {submitting ? 'Memproses…' : `Teruskan ke Pimpinan (${kegiatans.length})`}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PemetaanCapaianMassal
