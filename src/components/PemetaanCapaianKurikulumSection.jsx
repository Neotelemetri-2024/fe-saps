import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

/**
 * PemetaanCapaianKurikulumSection
 * Menampilkan kolom capaian dan sub capaian untuk setiap kurikulum yang relevan.
 */
export default function PemetaanCapaianKurikulumSection({
  kurikulumList = [],
  selectedCapaianIds = [],
  setSelectedCapaianIds,
  alokasi = [],
  setAlokasi,
}) {
  const [openCapaianKurId, setOpenCapaianKurId] = useState(null)
  const columnsRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target)) {
        setOpenCapaianKurId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleCapaian = (cid, kur) => {
    const next = selectedCapaianIds.includes(cid)
      ? selectedCapaianIds.filter((x) => x !== cid)
      : [...selectedCapaianIds, cid]

    setSelectedCapaianIds(next)

    const allKurCapaian = kur.capaian || []
    const validSubIds = allKurCapaian
      .filter((c) => next.includes(c.id))
      .flatMap((c) => (c.subCapaian || []).map((sc) => sc.id))

    const allOtherSubIds = kurikulumList
      .filter((k) => k.id !== kur.id)
      .flatMap((k) => (k.capaian || []).flatMap((c) => (c.subCapaian || []).map((sc) => sc.id)))

    setAlokasi((prev) =>
      prev.filter((a) => validSubIds.includes(a.subCapaianId) || allOtherSubIds.includes(a.subCapaianId))
    )
  }

  const toggleSub = (scId) => {
    setAlokasi((prev) => {
      const exists = prev.find((a) => a.subCapaianId === scId)
      if (exists) return prev.filter((a) => a.subCapaianId !== scId)
      return [...prev, { subCapaianId: scId, alokasiPersen: 100 }]
    })
  }

  const setAlokasiPersen = (scId, val) => {
    const num = Math.min(100, Math.max(0, parseInt(val, 10) || 0))
    setAlokasi((prev) =>
      prev.map((a) => (a.subCapaianId === scId ? { ...a, alokasiPersen: num } : a))
    )
  }

  if (kurikulumList.length === 0) {
    return <p className="text-sm text-error">Tidak ada kurikulum aktif.</p>
  }

  return (
    <div ref={columnsRef} className="divide-y divide-base-300 rounded-md border border-base-300 bg-base-100">
      {kurikulumList.map((kur) => {
        const kurCapaian = kur.capaian || []
        const selectedCapaianForKur = kurCapaian.filter((c) => selectedCapaianIds.includes(c.id))
        const visibleSubsForKur = selectedCapaianForKur.flatMap((c) =>
          (c.subCapaian || []).map((sc) => ({ ...sc, namaCapaian: c.nama }))
        )
        const allSubsForKur = kurCapaian.flatMap((c) =>
          (c.subCapaian || []).map((sc) => ({ ...sc, namaCapaian: c.nama }))
        )
        const kurSubIds = allSubsForKur.map((s) => s.id)
        const alokasiForKur = alokasi.filter((a) => kurSubIds.includes(a.subCapaianId))
        const totalBobotKur = alokasiForKur.reduce((sum, a) => sum + (a.alokasiPersen || 0), 0)
        const isOpen = openCapaianKurId === kur.id

        return (
          <section key={kur.id} className="space-y-4 p-4 sm:p-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <h3 className="text-sm font-semibold text-base-content">{kur.nama}</h3>
                {kur.tahunMulai ? (
                  <p className="mt-0.5 text-xs text-base-content/60">Berlaku mulai tahun akademik {kur.tahunMulai}/{kur.tahunMulai + 1}</p>
                ) : null}
              </div>
              {alokasiForKur.length > 0 ? (
                <p className={`shrink-0 text-xs font-medium tabular-nums ${Math.abs(totalBobotKur - 100) < 0.01 ? 'text-success' : 'text-warning'}`}>
                  Total bobot {totalBobotKur}%
                </p>
              ) : (
                <p className="shrink-0 text-xs text-base-content/50">Belum ada alokasi</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-base-content">
                Capaian <span className="text-error">*</span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenCapaianKurId((prev) => (prev === kur.id ? null : kur.id))}
                  className="select min-h-11 w-full cursor-pointer rounded-md text-left text-sm focus:outline-none"
                >
                  <span className={`truncate ${selectedCapaianForKur.length === 0 ? 'text-base-content/40' : 'text-base-content'}`}>
                    {selectedCapaianForKur.length === 0
                      ? 'Pilih capaian'
                      : selectedCapaianForKur.map((c) => c.nama).join(', ')}
                  </span>
                  <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-base-content/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-base-300 bg-base-100 shadow-md">
                    <div className="max-h-56 overflow-y-auto">
                      {kurCapaian.map((c) => {
                        const checked = selectedCapaianIds.includes(c.id)
                        return (
                          <label
                            key={c.id}
                            className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-base-200"
                          >
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-primary bg-primary' : 'border-base-300'}`}>
                              {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                            </span>
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={checked}
                              onChange={() => toggleCapaian(c.id, kur)}
                            />
                            <span>{c.nama}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pilih Sub Capaian */}
            {visibleSubsForKur.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-base-content">
                  Sub Capaian <span className="text-error">*</span>
                </label>
                <div className="space-y-1.5">
                  {visibleSubsForKur.map((sc) => {
                    const checked = !!alokasi.find((a) => a.subCapaianId === sc.id)
                    return (
                      <label
                        key={sc.id}
                        className={`flex min-h-11 cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-sm transition-colors ${
                          checked ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-100 hover:bg-base-200'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-primary bg-primary' : 'border-base-300'}`}>
                          {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                        </span>
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleSub(sc.id)} />
                        <span className="min-w-0">
                          <span className="block leading-snug text-base-content">
                            {sc.nama}
                          </span>
                          <span className="mt-0.5 block text-xs text-base-content/45">{sc.namaCapaian}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bobot sub capaian */}
            {alokasiForKur.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-base-content">
                    Bobot <span className="text-error">*</span>
                  </label>
                  <span className={`text-xs font-medium tabular-nums ${totalBobotKur === 100 ? 'text-success' : 'text-error'}`}>
                    {totalBobotKur}% / 100%
                  </span>
                </div>
                <div className="divide-y divide-base-300 overflow-hidden rounded-md border border-base-300">
                  {alokasiForKur.map((alok) => {
                    const sc = allSubsForKur.find((s) => s.id === alok.subCapaianId)
                    if (!sc) return null
                    return (
                      <div key={alok.subCapaianId} className="flex items-center gap-3 bg-base-100 px-3 py-2">
                        <span className="min-w-0 flex-1 text-sm text-base-content truncate">{sc.nama}</span>
                        <div className="flex shrink-0 items-center gap-1">
                          <input
                            type="number"
                            min={1}
                            max={100}
                            step={1}
                            value={alok.alokasiPersen}
                            onChange={(e) => setAlokasiPersen(alok.subCapaianId, e.target.value)}
                            className="input input-sm w-16 rounded-md text-center text-sm tabular-nums"
                          />
                          <span className="text-sm text-base-content/50">%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
