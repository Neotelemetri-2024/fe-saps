import { useEffect, useMemo, useState } from 'react'
import { Search, Settings2, Scale } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import StatCard from '../../components/dashboard/StatCard'
import DataTable from '../../components/dashboard/DataTable'
import StatusBadge from '../../components/dashboard/StatusBadge'
import { TableCard, TableFrame } from '../../components/dashboard/TableFrame'
import { ChartSkeleton } from '../../components/dashboard/Skeleton'
import { LineChart, HorizontalBarChart, DoughnutChart } from '../../components/charts'
import Modal from '../../components/ui/Modal'
import { getCurrentUser } from '../../services/authService'
import { getFakultasList, getProdiList } from '../../services/laporanService'
import {
  getIku3Dashboard,
  getIku3Trend,
  getIku3Faculties,
  getIku3Activities,
  getIku3Targets,
  saveIku3Target,
  getIku3Rules,
  updateIku3Rule,
} from '../../services/iku3Service'

const ROLE_LABEL = {
  pimpinan_utama: 'Pimpinan Utama',
  pimpinan_ditmawa: 'Pimpinan Ditmawa',
  pimpinan_fakultas: 'Pimpinan Fakultas',
  admin_ditmawa: 'Admin Ditmawa',
  admin_fakultas: 'Admin Fakultas',
}

const GLOBAL_ROLES = new Set(['pimpinan_utama', 'pimpinan_ditmawa', 'admin_ditmawa'])
const TARGET_ROLES = new Set(['pimpinan_ditmawa', 'admin_ditmawa'])
const RULE_ROLES = new Set(['pimpinan_ditmawa'])
const PAGE_SIZE = 15

function currentYear() {
  return new Date().getFullYear()
}

function yearOptions(targetYears = []) {
  const now = currentYear()
  const years = new Set([now - 2, now - 1, now, now + 1, ...targetYears])
  return [...years].filter((y) => Number.isFinite(y)).sort((a, b) => b - a)
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString('id-ID')
}

function formatPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '0%'
  return `${n.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}%`
}

function formatBobot(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ToolbarSelect({ label, value, onChange, children, disabled = false }) {
  return (
    <label className="flex min-w-36 flex-1 flex-col gap-1">
      <span className="text-xs text-base-content/60">{label}</span>
      <select value={value} onChange={onChange} disabled={disabled} className="select select-sm w-full">
        {children}
      </select>
    </label>
  )
}

function TargetModal({ isOpen, onClose, tahun, onSaved }) {
  const [targetPersen, setTargetPersen] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setTargetPersen('')
    setKeterangan('')
    getIku3Targets()
      .then((list) => {
        const current = list.find((t) => Number(t.tahun) === Number(tahun))
        if (current) {
          setTargetPersen(String(current.targetPersen ?? ''))
          setKeterangan(current.keterangan || '')
        }
      })
      .catch(() => {})
  }, [isOpen, tahun])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = Number(targetPersen)
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      toast.error('Target harus angka 0–100')
      return
    }
    setSaving(true)
    try {
      const res = await saveIku3Target({
        tahun: Number(tahun),
        targetPersen: value,
        keterangan: keterangan.trim() || undefined,
      })
      toast.success(res?.message || `Target tahun ${tahun} disimpan.`)
      onSaved()
      onClose()
    } catch (err) {
      toast.error('Gagal menyimpan target', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Atur target IKU 3" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-base-content/60">Tahun</span>
          <input type="text" value={tahun} disabled className="input input-sm w-full" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-base-content/60">Target (%)</span>
          <input
            type="number"
            min="0"
            max="100"
            step="0.01"
            required
            value={targetPersen}
            onChange={(e) => setTargetPersen(e.target.value)}
            className="input input-sm w-full"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-base-content/60">Keterangan</span>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            placeholder="Opsional"
            className="input input-sm w-full"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm" disabled={saving}>
            Batal
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function RulesModal({ isOpen, onClose, onSaved }) {
  const [rules, setRules] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setLoading(true)
    getIku3Rules()
      .then((list) => {
        setRules(list)
        setDrafts(Object.fromEntries(list.map((r) => [r.id, String(r.bobot)])))
      })
      .catch((err) => {
        toast.error('Gagal memuat aturan bobot', { description: err.message })
        setRules([])
      })
      .finally(() => setLoading(false))
  }, [isOpen])

  const handleSave = async (rule) => {
    const bobot = Number(drafts[rule.id])
    if (!Number.isFinite(bobot) || bobot < 0) {
      toast.error('Bobot harus angka 0 atau lebih')
      return
    }
    setSavingId(rule.id)
    try {
      await updateIku3Rule(rule.id, { bobot, keterangan: rule.keterangan || undefined })
      toast.success('Aturan bobot diperbarui.')
      onSaved()
    } catch (err) {
      toast.error('Gagal mengubah bobot', { description: err.message })
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kelola bobot IKU 3" size="4xl">
      <TableFrame>
        <DataTable
          columns={[
            { key: 'jenis', label: 'Jenis' },
            { key: 'skala', label: 'Skala', render: (r) => r.skala || '—' },
            { key: 'peran', label: 'Peran', render: (r) => r.peran || '—' },
            {
              key: 'sks',
              label: 'SKS',
              render: (r) => (r.sksMin != null || r.sksMax != null ? `${r.sksMin ?? '—'}–${r.sksMax ?? '—'}` : '—'),
            },
            {
              key: 'bobot',
              label: 'Bobot',
              render: (r) => (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={drafts[r.id] ?? ''}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                  className="input input-xs w-24"
                />
              ),
            },
            {
              key: 'aksi',
              label: 'Aksi',
              render: (r) => (
                <button
                  type="button"
                  className="btn btn-primary btn-xs"
                  disabled={savingId === r.id}
                  onClick={() => handleSave(r)}
                >
                  {savingId === r.id ? 'Menyimpan…' : 'Simpan'}
                </button>
              ),
            },
          ]}
          data={rules}
          loading={loading}
          emptyText="Belum ada aturan bobot."
          pageSize={20}
        />
      </TableFrame>
    </Modal>
  )
}

function MonitoringIku3({ defaultRole, embedded = false }) {
  const user = getCurrentUser()
  const resolvedRole = defaultRole || user?.role || 'pimpinan_ditmawa'
  const isGlobalScope = GLOBAL_ROLES.has(resolvedRole)
  const canSetTarget = TARGET_ROLES.has(resolvedRole)
  const canEditRules = RULE_ROLES.has(resolvedRole)

  const [tahun, setTahun] = useState(currentYear())
  const [triwulan, setTriwulan] = useState('')
  const [fakultasId, setFakultasId] = useState('')
  const [prodiId, setProdiId] = useState('')
  const [fakultasOptions, setFakultasOptions] = useState([])
  const [prodiOptions, setProdiOptions] = useState([])
  const [targetYears, setTargetYears] = useState([])

  const [dashboard, setDashboard] = useState(null)
  const [trend, setTrend] = useState([])
  const [faculties, setFaculties] = useState([])
  const [activities, setActivities] = useState([])
  const [activityTotal, setActivityTotal] = useState(0)
  const [activityPages, setActivityPages] = useState(1)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')

  const [loadingKpi, setLoadingKpi] = useState(true)
  const [loadingCharts, setLoadingCharts] = useState(true)
  const [loadingTable, setLoadingTable] = useState(true)

  const [showTargetModal, setShowTargetModal] = useState(false)
  const [showRulesModal, setShowRulesModal] = useState(false)

  const filterParams = useMemo(() => ({
    tahun: Number(tahun) || currentYear(),
    triwulan: triwulan ? Number(triwulan) : undefined,
    fakultasId: isGlobalScope && fakultasId ? Number(fakultasId) : undefined,
    prodiId: isGlobalScope && prodiId ? Number(prodiId) : undefined,
  }), [tahun, triwulan, fakultasId, prodiId, isGlobalScope])

  useEffect(() => {
    getFakultasList().then(setFakultasOptions).catch(() => setFakultasOptions([]))
    getIku3Targets()
      .then((list) => setTargetYears(list.map((t) => Number(t.tahun)).filter(Boolean)))
      .catch(() => setTargetYears([]))
  }, [])

  useEffect(() => {
    if (!isGlobalScope || !fakultasId) {
      setProdiOptions([])
      setProdiId('')
      return
    }
    getProdiList(fakultasId).then(setProdiOptions).catch(() => setProdiOptions([]))
    setProdiId('')
  }, [fakultasId, isGlobalScope])

  useEffect(() => {
    const timer = setTimeout(() => setSearchApplied(search.trim()), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [tahun, triwulan, fakultasId, prodiId, searchApplied])

  useEffect(() => {
    let cancelled = false
    setLoadingKpi(true)
    getIku3Dashboard(filterParams)
      .then((data) => {
        if (!cancelled) setDashboard(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setDashboard(null)
          toast.error('Gagal memuat ringkasan IKU 3', { description: err.message })
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingKpi(false)
      })
    return () => { cancelled = true }
  }, [filterParams])

  useEffect(() => {
    let cancelled = false
    setLoadingCharts(true)
    Promise.all([
      getIku3Trend({ fakultasId: filterParams.fakultasId }),
      getIku3Faculties({ tahun: filterParams.tahun, triwulan: filterParams.triwulan }),
    ])
      .then(([trendData, facultyData]) => {
        if (cancelled) return
        setTrend(trendData)
        setFaculties(facultyData)
      })
      .catch((err) => {
        if (cancelled) return
        setTrend([])
        setFaculties([])
        toast.error('Gagal memuat grafik IKU 3', { description: err.message })
      })
      .finally(() => {
        if (!cancelled) setLoadingCharts(false)
      })
    return () => { cancelled = true }
  }, [filterParams.tahun, filterParams.triwulan, filterParams.fakultasId])

  useEffect(() => {
    let cancelled = false
    setLoadingTable(true)
    getIku3Activities({
      ...filterParams,
      search: searchApplied || undefined,
      page,
      limit: PAGE_SIZE,
    })
      .then((res) => {
        if (cancelled) return
        setActivities(res.data || [])
        setActivityTotal(res.total)
        setActivityPages(Math.max(1, res.totalPages || 1))
      })
      .catch((err) => {
        if (cancelled) return
        setActivities([])
        setActivityTotal(0)
        setActivityPages(1)
        toast.error('Gagal memuat daftar kontributor', { description: err.message })
      })
      .finally(() => {
        if (!cancelled) setLoadingTable(false)
      })
    return () => { cancelled = true }
  }, [filterParams, searchApplied, page])

  const kpi = dashboard?.kpi || {}
  const rumpun = dashboard?.rumpunDistribusi || {}
  const cakupan = dashboard?.cakupan || {}
  const tercapai = kpi.statusTarget === 'tercapai'
  const years = yearOptions(targetYears)

  const refetchAfterWrite = () => {
    getIku3Dashboard(filterParams).then(setDashboard).catch(() => {})
    getIku3Trend({ fakultasId: filterParams.fakultasId }).then(setTrend).catch(() => {})
    getIku3Faculties({ tahun: filterParams.tahun, triwulan: filterParams.triwulan }).then(setFaculties).catch(() => {})
    getIku3Activities({
      ...filterParams,
      search: searchApplied || undefined,
      page,
      limit: PAGE_SIZE,
    }).then((res) => {
      setActivities(res.data || [])
      setActivityTotal(res.total)
      setActivityPages(Math.max(1, res.totalPages || 1))
    }).catch(() => {})
  }

  const content = (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">Monitoring IKU 3</h2>
          <p className="mt-1 text-sm text-base-content/60">
            Kemdiktisaintek Berdampak 2026 · {cakupan.fakultas || 'Universitas Andalas'}
            {cakupan.prodi ? ` · ${cakupan.prodi}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canSetTarget ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowTargetModal(true)}>
              <Settings2 className="h-4 w-4" /> Atur target
            </button>
          ) : null}
          {canEditRules ? (
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowRulesModal(true)}>
              <Scale className="h-4 w-4" /> Kelola bobot
            </button>
          ) : null}
        </div>
      </div>

      <div className="card bg-base-100 p-4">
        <div className="flex flex-wrap items-end gap-2">
          <ToolbarSelect label="Tahun" value={tahun} onChange={(e) => setTahun(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </ToolbarSelect>
          <ToolbarSelect label="Triwulan" value={triwulan} onChange={(e) => setTriwulan(e.target.value)}>
            <option value="">Semua</option>
            <option value="1">Triwulan 1</option>
            <option value="2">Triwulan 2</option>
            <option value="3">Triwulan 3</option>
            <option value="4">Triwulan 4</option>
          </ToolbarSelect>
          {isGlobalScope ? (
            <ToolbarSelect
              label="Fakultas"
              value={fakultasId}
              onChange={(e) => setFakultasId(e.target.value)}
            >
              <option value="">Semua</option>
              {fakultasOptions.map((f) => (
                <option key={f.id} value={f.id}>{f.nama}</option>
              ))}
            </ToolbarSelect>
          ) : (
            <label className="flex min-w-36 flex-1 flex-col gap-1">
              <span className="text-xs text-base-content/60">Fakultas</span>
              <input
                type="text"
                disabled
                value={cakupan.fakultas || 'Fakultas Anda'}
                className="input input-sm w-full"
              />
            </label>
          )}
          {isGlobalScope && fakultasId ? (
            <ToolbarSelect label="Program studi" value={prodiId} onChange={(e) => setProdiId(e.target.value)}>
              <option value="">Semua</option>
              {prodiOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </ToolbarSelect>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Capaian IKU 3" value={formatPercent(kpi.capaian)} loading={loadingKpi} />
        <StatCard label="Target" value={formatPercent(kpi.target)} loading={loadingKpi} />
        <StatCard label="Total mahasiswa" value={formatNumber(kpi.totalMahasiswa)} loading={loadingKpi} />
        <StatCard label="Kontributor" value={formatNumber(kpi.totalKontributor)} loading={loadingKpi} />
      </div>

      {!loadingKpi && kpi.statusTarget ? (
        <div className={`alert ${tercapai ? 'alert-success' : 'alert-warning'}`}>
          <StatusBadge status={kpi.statusTarget} />
          <span className="text-sm">
            {tercapai
              ? `Target tahun ${kpi.tahun} sudah tercapai.`
              : `Butuh +${formatNumber(kpi.gapMahasiswa)} mahasiswa lagi untuk mencapai target tahun ${kpi.tahun}.`}
          </span>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card bg-base-100 p-5">
          <h3 className="text-sm font-semibold text-base-content">Tren capaian tahunan</h3>
          <p className="mt-1 text-xs text-base-content/60">Capaian dibanding target per tahun kalender</p>
          {loadingCharts ? (
            <ChartSkeleton height={280} />
          ) : trend.length === 0 ? (
            <p className="py-10 text-center text-sm text-base-content/50">Belum ada data tren.</p>
          ) : (
            <LineChart
              labels={trend.map((t) => String(t.tahun))}
              datasets={[
                { label: 'Capaian %', data: trend.map((t) => Number(t.capaian) || 0) },
                { label: 'Target %', data: trend.map((t) => Number(t.target) || 0) },
              ]}
              height={280}
            />
          )}
        </div>

        <div className="card bg-base-100 p-5">
          <h3 className="text-sm font-semibold text-base-content">Peringkat per fakultas</h3>
          <p className="mt-1 text-xs text-base-content/60">Persentase capaian IKU 3</p>
          {loadingCharts ? (
            <ChartSkeleton height={280} />
          ) : faculties.length === 0 ? (
            <p className="py-10 text-center text-sm text-base-content/50">Belum ada data fakultas.</p>
          ) : (
            <HorizontalBarChart
              labels={faculties.map((f) => f.namaFakultas)}
              values={faculties.map((f) => Number(f.capaianPersen) || 0)}
              max={100}
            />
          )}
        </div>
      </div>

      <div className="card bg-base-100 p-5">
        <h3 className="text-sm font-semibold text-base-content">Dekomposisi rumpun kontributor</h3>
        <p className="mt-1 text-xs text-base-content/60">Prestasi kompetisi dan pembelajaran luar kampus</p>
        {loadingKpi ? (
          <ChartSkeleton height={240} variant="donut" />
        ) : !(Number(rumpun.prestasi?.count) || Number(rumpun.pembelajaran?.count)) ? (
          <p className="py-10 text-center text-sm text-base-content/50">Belum ada sebaran rumpun.</p>
        ) : (
          <div className="grid items-center gap-4 md:grid-cols-[16rem_1fr]">
            <DoughnutChart
              labels={['Prestasi kompetisi', 'Pembelajaran luar kampus']}
              values={[
                Number(rumpun.prestasi?.count) || 0,
                Number(rumpun.pembelajaran?.count) || 0,
              ]}
              centerLabel="Kontributor"
              centerValue={formatNumber(
                (Number(rumpun.prestasi?.count) || 0) + (Number(rumpun.pembelajaran?.count) || 0),
              )}
              height={240}
            />
            <div className="space-y-2 text-sm">
              <p>
                Prestasi kompetisi: {formatNumber(rumpun.prestasi?.count)} kegiatan
                {' '}({formatPercent(rumpun.prestasi?.persentase)})
              </p>
              <p>
                Pembelajaran luar kampus: {formatNumber(rumpun.pembelajaran?.count)} kegiatan
                {' '}({formatPercent(rumpun.pembelajaran?.persentase)})
              </p>
            </div>
          </div>
        )}
      </div>

      <TableCard title="Mahasiswa kontributor">
        <label className="input input-sm w-full max-w-md">
          <Search className="h-4 w-4 shrink-0 opacity-50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari NIM, nama, atau kegiatan"
          />
        </label>
        <TableFrame>
          <DataTable
            columns={[
              { key: '_no', label: 'No' },
              { key: 'nim', label: 'NIM' },
              { key: 'namaMahasiswa', label: 'Nama' },
              { key: 'fakultas', label: 'Fakultas' },
              { key: 'namaKegiatan', label: 'Kegiatan' },
              { key: 'skala', label: 'Skala' },
              { key: 'peran', label: 'Peran' },
              {
                key: 'bobot',
                label: 'Bobot',
                center: true,
                render: (row) => formatBobot(row.bobot),
              },
            ]}
            data={activities.map((row, i) => ({
              ...row,
              _no: (page - 1) * PAGE_SIZE + i + 1,
            }))}
            loading={loadingTable}
            emptyText="Tidak ada kontributor pada filter ini."
            page={page}
            totalPages={activityPages}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            totalItems={activityTotal}
          />
        </TableFrame>
      </TableCard>

      {canSetTarget ? (
        <TargetModal
          isOpen={showTargetModal}
          onClose={() => setShowTargetModal(false)}
          tahun={tahun}
          onSaved={refetchAfterWrite}
        />
      ) : null}
      {canEditRules ? (
        <RulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
          onSaved={refetchAfterWrite}
        />
      ) : null}
    </div>
  )

  if (embedded) return content

  return (
    <DashboardLayout
      role={resolvedRole}
      userName={user?.nama || ROLE_LABEL[resolvedRole] || 'Pengguna'}
      userRole={ROLE_LABEL[resolvedRole] || 'Pengguna'}
    >
      {content}
    </DashboardLayout>
  )
}

export default MonitoringIku3
