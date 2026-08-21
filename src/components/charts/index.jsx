/**
 * Shared Chart.js wrapper components.
 * All charts auto-destroy on unmount to avoid canvas reuse errors.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
)

const BRAND_DARK = '#1a5c38'
const BRAND_LIGHT = '#48a757'

function tooltipValue(ctx) {
  if (ctx.parsed == null) return ctx.raw
  if (typeof ctx.parsed === 'number') return ctx.parsed
  if (ctx.parsed.r != null) return ctx.parsed.r
  if (ctx.parsed.y != null) return ctx.parsed.y
  if (ctx.parsed.x != null) return ctx.parsed.x
  return ctx.raw
}

/** Tooltip bersama untuk bar chart vertikal / stacked / grouped */
const barTooltip = {
  enabled: true,
  mode: 'nearest',
  intersect: true,
  callbacks: {
    label(ctx) {
      const name = ctx.dataset.label || ctx.label || ''
      const val = tooltipValue(ctx)
      return name ? `${name}: ${val}` : String(val)
    },
  },
}

/** Tooltip untuk bar horizontal (nilai di parsed.x) */
const horizontalBarTooltip = {
  enabled: true,
  mode: 'nearest',
  intersect: true,
  callbacks: {
    label(ctx) {
      const name = ctx.label || ctx.dataset.label || ''
      const val = ctx.parsed?.x ?? ctx.raw
      return name ? `${name}: ${val}` : String(val)
    },
  },
}

// ─── Stacked Bar Chart ──────────────────────────────────────────────────────
/**
 * labels: string[]
 * datasets: { label, data: number[], color }[]
 */
export function StackedBarChart({ labels, datasets, height = 300 }) {
  const data = {
    labels,
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.color,
      borderRadius: 3,
      borderSkipped: false,
      stack: 'stack',
    })),
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
          label(ctx) {
            const name = ctx.dataset.label || ctx.label || ''
            const val = tooltipValue(ctx)
            return name ? `${name}: ${val}` : String(val)
          },
          footer(items) {
            const sum = items.reduce((s, i) => s + (Number(i.parsed?.y) || 0), 0)
            return `Total: ${sum}`
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 35 },
      },
      y: {
        stacked: true,
        grid: { color: '#eef0f7' },
        ticks: { font: { size: 10 } },
      },
    },
  }
  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  )
}

// ─── Grouped Bar Chart ──────────────────────────────────────────────────────
/**
 * labels: string[]
 * datasets: { label, data: number[], color }[]
 */
export function GroupedBarChart({ labels, datasets, height = 280 }) {
  const data = {
    labels,
    datasets: datasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.color,
      borderRadius: 4,
      borderSkipped: false,
    })),
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: true },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        ...barTooltip,
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 10 }, maxRotation: 0 },
      },
      y: {
        grid: { color: '#eef0f7' },
        ticks: { font: { size: 10 } },
        beginAtZero: true,
      },
    },
  }
  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  )
}

// ─── Vertical Bar Chart ─────────────────────────────────────────────────────
/**
 * labels: string[]
 * values: number[]
 * color?: string
 */
export function VerticalBarChart({ labels, values, color = BRAND_LIGHT, colors, height = 240 }) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Nilai',
        data: values,
        backgroundColor: colors ?? color,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: true },
    plugins: {
      legend: { display: false },
      tooltip: {
        ...barTooltip,
        callbacks: {
          title(items) {
            return items[0]?.label || ''
          },
          label(ctx) {
            return String(tooltipValue(ctx))
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { size: 9 }, maxRotation: 45 },
      },
      y: {
        grid: { color: '#eef0f7' },
        ticks: { font: { size: 10 } },
        beginAtZero: true,
      },
    },
  }
  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  )
}

// ─── Horizontal Bar Chart (progress style) ──────────────────────────────────
/**
 * labels: string[]
 * values: number[]
 * max?: number
 * color?: string
 */
export function HorizontalBarChart({ labels, values, max = 100, color = BRAND_LIGHT, height }) {
  const h = height ?? Math.max(200, labels.length * 36)
  const data = {
    labels,
    datasets: [
      {
        label: 'Nilai',
        data: values,
        backgroundColor: color,
        borderRadius: 4,
        borderSkipped: false,
        barThickness: 20,
      },
    ],
  }
  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: true },
    plugins: {
      legend: { display: false },
      tooltip: horizontalBarTooltip,
    },
    scales: {
      x: {
        max,
        grid: { color: '#eef0f7' },
        ticks: { font: { size: 10 } },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { font: { size: 10 } },
      },
    },
  }
  return (
    <div style={{ height: h }}>
      <Bar data={data} options={options} />
    </div>
  )
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────
/**
 * labels: string[]
 * values: number[]
 * color?: string (hex)
 * darkBg?: boolean — if true, use white lines (for dark background sections)
 */
export function RadarChartCJ({ labels, values, color = BRAND_LIGHT, darkBg = false, height = 260 }) {
  const gridColor = darkBg ? 'rgba(255,255,255,0.2)' : '#e9ebf8'
  const tickColor = darkBg ? 'rgba(255,255,255,0.7)' : '#616161'
  const pointLabelColor = darkBg ? 'rgba(255,255,255,0.85)' : '#333'

  // Batasi nilai agar tidak keluar dari area radar, dan sesuaikan skala maks
  // jika ada nilai yang melebihi 100 (mis. poin melebihi target tahunan).
  const rawMax = values.length ? Math.max(...values) : 0
  const needsScale = rawMax > 100
  const scaleMax = needsScale ? Math.ceil((rawMax + 4) / 25) * 25 : 100
  const displayValues = values.map((v) => (needsScale ? Math.min(v, scaleMax) : v))

  const data = {
    labels,
    datasets: [
      {
        label: 'Poin',
        data: displayValues,
        backgroundColor: darkBg ? 'rgba(255,255,255,0.2)' : `${color}33`,
        borderColor: darkBg ? 'rgba(255,255,255,0.9)' : color,
        borderWidth: 2,
        pointBackgroundColor: darkBg ? 'white' : color,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
      },
    ],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 4,
    },
    interaction: { mode: 'nearest', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: darkBg ? 'rgba(0,0,0,0.85)' : 'rgba(33,33,33,0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          title(items) {
            return items[0]?.label || ''
          },
          label(ctx) {
            const asli = values[ctx.dataIndex]
            return String(asli ?? ctx.raw)
          },
        },
      },
    },
    scales: {
      r: {
        min: 0,
        max: scaleMax,
        grid: { color: gridColor },
        angleLines: { color: gridColor },
        ticks: {
          display: false,
          stepSize: scaleMax / 4,
          // warna tick disiapkan jika display diaktifkan nanti
          color: tickColor,
        },
        pointLabels: {
          color: pointLabelColor,
          font: { size: 9 },
          centerPointLabels: true,
        },
      },
    },
  }
  return (
    <div style={{ height, position: 'relative', width: '100%', minWidth: 0 }}>
      <Radar data={data} options={options} />
    </div>
  )
}
