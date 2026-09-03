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
    return <p className="text-sm text-red-500">Tidak ada kurikulum aktif.</p>
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
            className="rounded-xl border border-[#e9ebf8] bg-[#fafbfc]/50 p-5 space-y-4 shadow-sm"
          >
            {/* Header Kolom Kurikulum Aktif */}
            <div className="flex items-center justify-between border-b border-[#e9ebf8] pb-3">
              <div>
                <h4 className="text-sm font-bold text-[#222]">{kur.nama}</h4>
                {kur.tahunMulai && (
                  <p className="text-[11px] text-[#9aa0a6]">
                    Tahun: {kur.tahunMulai}/{kur.tahunMulai + 1}
                  </p>
                )}
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                Aktif
              </span>
            </div>

            {/* Dropdown Capaian */}
            <div>
              <label className="block text-sm font-medium text-black">
                Capaian <span className="text-red-500">*</span>{' '}
                <span className="font-normal text-[#9aa0a6]">(pilih satu atau lebih)</span>
              </label>
              <div className="relative mt-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCapaianKurId((prev) => (prev === kur.id ? null : kur.id))
                  }
                  className="flex w-full items-center justify-between rounded-md border border-[#e9ebf8] p-2.5 text-sm text-[#333] shadow-sm outline-none focus:border-brand-dark bg-white"
                >
                  <span
                    className={`truncate text-left ${
                      selectedCapaianForKur.length === 0 ? 'text-[#9aa0a6]' : 'text-[#333]'
                    }`}
                  >
                    {selectedCapaianForKur.length === 0
                      ? 'Pilih capaian'
                      : selectedCapaianForKur.map((c) => c.nama).join(', ')}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#8e98a8] ml-2" />
                </button>

                {openCapaianKurId === kur.id && (
                  <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-[#e9ebf8] bg-white shadow-md">
                    {kurCapaian.map((c) => (
                      <label
                        key={c.id}
                        className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-[#f5f5f5]"
                      >
                        <input
                          type="checkbox"
                          className="accent-brand-dark"
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
                <label className="block text-sm font-medium text-black">
                  Sub Capaian <span className="text-red-500">*</span>{' '}
                  <span className="font-normal text-[#9aa0a6]">(pilih satu atau lebih)</span>
                </label>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {visibleSubsForKur.map((sc) => {
                    const checked = !!alokasi.find(
                      (a) => a.subCapaianId === sc.id
                    )
                    return (
                      <label
                        key={sc.id}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition ${
                          checked
                            ? 'border-brand-dark bg-brand-dark/5 font-medium text-brand-dark'
                            : 'border-[#e9ebf8] text-[#444] hover:border-brand-dark/40 bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="accent-brand-dark shrink-0"
                          checked={checked}
                          onChange={() => toggleSub(sc.id)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate">{sc.nama}</span>
                          <span className="block truncate text-[11px] font-normal text-[#9aa0a6]">
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
                <label className="block text-sm font-medium text-black">
                  Bobot Persentase Sub Capaian <span className="text-red-500">*</span>
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
                        <span className="flex-1 text-sm text-[#444]">
                          <span className="block truncate">{sc.nama}</span>
                          <span className="block truncate text-[11px] font-normal text-[#9aa0a6]">
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
                          className="w-20 rounded-md border border-[#e9ebf8] p-2 text-center text-sm outline-none focus:border-brand-dark bg-white"
                        />
                        <span className="text-sm text-[#616161]">%</span>
                      </div>
                    )
                  })}
                </div>

                <p
                  className={`mt-2 text-xs font-medium ${
                    totalBobotKur === 100
                      ? 'text-emerald-600'
                      : 'text-red-500'
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
