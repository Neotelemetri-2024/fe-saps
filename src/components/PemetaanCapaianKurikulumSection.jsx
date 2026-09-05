import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * PemetaanCapaianKurikulumSection
 * Menampilkan kolom capaian dan sub capaian untuk setiap kurikulum yang sedang aktif.
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

  // Tutup dropdown capaian saat klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target)) {
        setOpenCapaianKurId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const activeKurikulums = kurikulumList

  const toggleCapaian = (cid, kur) => {
    const next = selectedCapaianIds.includes(cid)
      ? selectedCapaianIds.filter((x) => x !== cid)
      : [...selectedCapaianIds, cid]

    setSelectedCapaianIds(next)

    // Bersihkan alokasi sub capaian dari capaian yang dicopot
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

  if (activeKurikulums.length === 0) {
    return <p className="text-sm text-error">Tidak ada kurikulum aktif.</p>
  }

  return (
    <div
      ref={columnsRef}
      className={`grid grid-cols-1 ${
        activeKurikulums.length > 1 ? 'lg:grid-cols-2' : ''
      } gap-6`}
    >
      {activeKurikulums.map((kur) => {
        const kurCapaian = kur.capaian || []
        const selectedCapaianForKur = kurCapaian.filter((c) =>
          selectedCapaianIds.includes(c.id)
        )
        const visibleSubsForKur = selectedCapaianForKur.flatMap((c) =>
          (c.subCapaian || []).map((sc) => ({ ...sc, namaCapaian: c.nama }))
        )
        const allSubsForKur = kurCapaian.flatMap((c) =>
          (c.subCapaian || []).map((sc) => ({ ...sc, namaCapaian: c.nama }))
        )
        const kurSubIds = allSubsForKur.map((s) => s.id)
        const alokasiForKur = alokasi.filter((a) =>
          kurSubIds.includes(a.subCapaianId)
        )
        const totalBobotKur = alokasiForKur.reduce(
          (sum, a) => sum + (a.alokasiPersen || 0),
          0
        )

        return (
          <div
            key={kur.id}
            className="card bg-base-200/50 space-y-4 p-5"
          >
            <div className="flex items-center justify-between border-b border-base-300 pb-3">
              <div>
                <h4 className="text-sm font-semibold text-base-content">{kur.nama}</h4>
                {kur.tahunMulai && (
                  <p className="text-[11px] text-base-content/50">
                    Tahun: {kur.tahunMulai}/{kur.tahunMulai + 1}
                  </p>
                )}
              </div>
              <span className="badge badge-success badge-sm">Aktif</span>
            </div>

            {/* Dropdown Capaian */}
            <div>
              <label className="mb-1 block text-sm font-medium text-base-content">
                Capaian <span className="text-error">*</span>{' '}
                <span className="font-normal text-base-content/50">(pilih satu atau lebih)</span>
              </label>
              <div className="relative mt-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCapaianKurId((prev) => (prev === kur.id ? null : kur.id))
                  }
                  className="btn btn-outline w-full justify-between font-normal"
                >
                  <span
                    className={`truncate text-left ${
                      selectedCapaianForKur.length === 0 ? 'text-base-content/50' : 'text-base-content'
                    }`}
                  >
                    {selectedCapaianForKur.length === 0
                      ? 'Pilih capaian'
                      : selectedCapaianForKur.map((c) => c.nama).join(', ')}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
                </button>

                {openCapaianKurId === kur.id && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-base-300 bg-base-100 shadow-md">
                    {kurCapaian.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-base-200"
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-primary"
                          checked={selectedCapaianIds.includes(c.id)}
                          onChange={() => toggleCapaian(c.id, kur)}
                        />
                        {c.nama}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sub Capaian */}
            {visibleSubsForKur.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-base-content">
                  Sub Capaian <span className="text-error">*</span>{' '}
                  <span className="font-normal text-base-content/50">(pilih satu atau lebih)</span>
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {visibleSubsForKur.map((sc) => {
                    const checked = !!alokasi.find(
                      (a) => a.subCapaianId === sc.id
                    )
                    return (
                      <label
                        key={sc.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm ${
                          checked
                            ? 'border-primary bg-primary/5 font-medium text-primary'
                            : 'border-base-300 bg-base-100 text-base-content/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm checkbox-primary shrink-0"
                          checked={checked}
                          onChange={() => toggleSub(sc.id)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate">{sc.nama}</span>
                          <span className="block truncate text-[11px] font-normal text-base-content/50">
                            {sc.namaCapaian}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bobot Persentase Sub Capaian */}
            {alokasiForKur.length > 0 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-base-content">
                  Bobot Persentase Sub Capaian <span className="text-error">*</span>
                </label>
                <div className="mt-2 space-y-2">
                  {alokasiForKur.map((alok) => {
                    const sc = allSubsForKur.find(
                      (s) => s.id === alok.subCapaianId
                    )
                    if (!sc) return null
                    return (
                      <div
                        key={alok.subCapaianId}
                        className="flex items-center gap-3"
                      >
                        <span className="flex-1 text-sm text-base-content/80">
                          <span className="block truncate">{sc.nama}</span>
                          <span className="block truncate text-[11px] font-normal text-base-content/50">
                            {sc.namaCapaian}
                          </span>
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          step={1}
                          value={alok.alokasiPersen}
                          onChange={(e) =>
                            setAlokasiPersen(alok.subCapaianId, e.target.value)
                          }
                          className="input input-sm w-20 text-center"
                        />
                        <span className="text-sm text-base-content/60">%</span>
                      </div>
                    )
                  })}
                </div>

                <p
                  className={`mt-2 text-xs font-medium ${
                    totalBobotKur === 100
                      ? 'text-success'
                      : 'text-error'
                  }`}
                >
                  Total bobot: {totalBobotKur}%
                  {totalBobotKur < 100 && (
                    <span className="ml-1">(kurang dari 100%)</span>
                  )}
                  {totalBobotKur > 100 && (
                    <span className="ml-1">(lebih dari 100%)</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
