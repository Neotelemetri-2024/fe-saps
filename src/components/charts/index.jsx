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
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 11 } },
      },
      tooltip: { mode: 'index', intersect: false },
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
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 11 } },
      },
      tooltip: { mode: 'index', intersect: false },
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
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
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
    plugins: {
      legend: { display: false },
      tooltip: { mode: 'index', intersect: false },
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

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: darkBg ? 'rgba(255,255,255,0.2)' : `${color}33`,
        borderColor: darkBg ? 'rgba(255,255,255,0.9)' : color,
        borderWidth: 2,
        pointBackgroundColor: darkBg ? 'white' : color,
        pointRadius: 4,
        fill: true,
      },
    ],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      r: {
        min: 0,
        max: 100,
        grid: { color: gridColor },
        angleLines: { color: gridColor },
        ticks: {
          display: false,
          stepSize: 25,
        },
        pointLabels: {
          color: pointLabelColor,
          font: { size: 9 },
        },
      },
    },
  }
  return (
    <div style={{ height }}>
      <Radar data={data} options={options} />
    </div>
  )
}
