import { useEffect, useState } from 'react'
import { Download, Printer, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getPortofolio } from '../../services/dashboardService'
import logoUnand from '../../assets/logo_unand.png'

// Component for Baroque Gold Certificate Corner Flourishes & Frame
function CertificateBorder() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="goldFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#b3822a" />
          <stop offset="20%" stopColor="#e8c973" />
          <stop offset="40%" stopColor="#c89633" />
          <stop offset="65%" stopColor="#fdf0be" />
          <stop offset="85%" stopColor="#c18e2d" />
          <stop offset="100%" stopColor="#8d6216" />
        </linearGradient>

        <linearGradient id="goldLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#a77723" />
          <stop offset="30%" stopColor="#e8ca77" />
          <stop offset="50%" stopColor="#fff3c9" />
          <stop offset="70%" stopColor="#e8ca77" />
          <stop offset="100%" stopColor="#a77723" />
        </linearGradient>

        {/* Ornate corner flourish group (Top-Left base, 90x90) */}
        <g id="baroqueCorner">
          {/* Outer Corner Scrolls */}
          <path
            d="M 6 85 C 6 42 42 6 85 6 C 68 12 55 24 50 38 C 45 52 35 62 21 67 C 13 70 8 76 6 85 Z"
            fill="url(#goldFrameGrad)"
            opacity="0.9"
          />
          {/* Main Leaf Loop */}
          <path
            d="M 12 76 C 16 52 36 32 60 28 C 48 34 40 44 38 56 C 36 68 28 74 12 76 Z"
            fill="url(#goldFrameGrad)"
            opacity="0.8"
          />
          {/* Corner Flourish Acanthus */}
          <path
            d="M 4 35 C 10 18 20 10 38 4 C 32 8 28 14 28 22 C 28 32 20 38 4 35 Z"
            fill="url(#goldFrameGrad)"
          />
          <path
            d="M 35 4 C 18 10 10 20 4 38 C 8 32 14 28 22 28 C 32 28 38 20 35 4 Z"
            fill="url(#goldFrameGrad)"
          />
          {/* Delicate tendril swirl */}
          <path
            d="M 18 18 Q 30 8 45 12 Q 32 20 28 34 Q 20 24 18 18 Z"
            fill="url(#goldFrameGrad)"
            opacity="0.95"
          />
          <path
            d="M 8 45 Q 16 32 30 38 Q 22 46 24 60 Q 14 52 8 45 Z"
            fill="url(#goldFrameGrad)"
            opacity="0.9"
          />
          {/* Inner Accent Ringlet */}
          <circle cx="28" cy="28" r="4.5" fill="url(#goldFrameGrad)" />
          <circle cx="28" cy="28" r="2.5" fill="#fcfbf7" />
          <circle cx="48" cy="18" r="2.5" fill="url(#goldFrameGrad)" />
          <circle cx="18" cy="48" r="2.5" fill="url(#goldFrameGrad)" />
          <circle cx="68" cy="10" r="2" fill="url(#goldFrameGrad)" />
          <circle cx="10" cy="68" r="2" fill="url(#goldFrameGrad)" />
        </g>
      </defs>

      {/* Outer Golden Border Rectangle */}
      <rect
        x="12"
        y="12"
        width="calc(100% - 24px)"
        height="calc(100% - 24px)"
        fill="none"
        stroke="url(#goldFrameGrad)"
        strokeWidth="3.5"
        rx="2"
      />

      {/* Middle Delicate Thin Line */}
      <rect
        x="17"
        y="17"
        width="calc(100% - 34px)"
        height="calc(100% - 34px)"
        fill="none"
        stroke="url(#goldLineGrad)"
        strokeWidth="0.8"
        strokeDasharray="4 2"
        rx="2"
      />

      {/* Inner Solid Line */}
      <rect
        x="21"
        y="21"
        width="calc(100% - 42px)"
        height="calc(100% - 42px)"
        fill="none"
        stroke="url(#goldFrameGrad)"
        strokeWidth="1.5"
        rx="2"
      />

      {/* 4 Corner Ornaments */}
      {/* Top-Left */}
      <use href="#baroqueCorner" x="0" y="0" />

      {/* Top-Right */}
      <g transform="translate(100, 0) scale(-1, 1)">
        {/* We use percentage or relative position by using SVG nested or g transform */}
      </g>
    </svg>
  )
}

// Separate SVG overlay with four absolute positioned responsive corners
function CertificateOrnateCorners() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Outer double gold borders */}
      <div className="absolute inset-[9px] rounded-xs border-[3px] border-[#c0923e]" />
      <div className="absolute inset-[14px] rounded-xs border-[1px] border-dashed border-[#d9af56]" />
      <div className="absolute inset-[18px] rounded-xs border-[1.5px] border-[#b0812d]" />

      {/* Corner Top-Left */}
      <svg className="absolute left-[7px] top-[7px] h-24 w-24" viewBox="0 0 90 90" fill="none">
        <defs>
          <linearGradient id="cornerGoldTL" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b3822a" />
            <stop offset="30%" stopColor="#f3db91" />
            <stop offset="70%" stopColor="#c89633" />
            <stop offset="100%" stopColor="#8d6216" />
          </linearGradient>
        </defs>
        <path d="M 6 85 C 6 42 42 6 85 6 C 68 12 55 24 50 38 C 45 52 35 62 21 67 C 13 70 8 76 6 85 Z" fill="url(#cornerGoldTL)" />
        <path d="M 12 76 C 16 52 36 32 60 28 C 48 34 40 44 38 56 C 36 68 28 74 12 76 Z" fill="url(#cornerGoldTL)" opacity="0.8" />
        <path d="M 4 35 C 10 18 20 10 38 4 C 32 8 28 14 28 22 C 28 32 20 38 4 35 Z" fill="url(#cornerGoldTL)" />
        <path d="M 35 4 C 18 10 10 20 4 38 C 8 32 14 28 22 28 C 32 28 38 20 35 4 Z" fill="url(#cornerGoldTL)" />
        <circle cx="28" cy="28" r="4.5" fill="url(#cornerGoldTL)" />
        <circle cx="28" cy="28" r="2.5" fill="#fffdf9" />
        <circle cx="50" cy="18" r="2.5" fill="url(#cornerGoldTL)" />
        <circle cx="18" cy="50" r="2.5" fill="url(#cornerGoldTL)" />
      </svg>

      {/* Corner Top-Right */}
      <svg className="absolute right-[7px] top-[7px] h-24 w-24 -scale-x-100" viewBox="0 0 90 90" fill="none">
        <path d="M 6 85 C 6 42 42 6 85 6 C 68 12 55 24 50 38 C 45 52 35 62 21 67 C 13 70 8 76 6 85 Z" fill="url(#cornerGoldTL)" />
        <path d="M 12 76 C 16 52 36 32 60 28 C 48 34 40 44 38 56 C 36 68 28 74 12 76 Z" fill="url(#cornerGoldTL)" opacity="0.8" />
        <path d="M 4 35 C 10 18 20 10 38 4 C 32 8 28 14 28 22 C 28 32 20 38 4 35 Z" fill="url(#cornerGoldTL)" />
        <path d="M 35 4 C 18 10 10 20 4 38 C 8 32 14 28 22 28 C 32 28 38 20 35 4 Z" fill="url(#cornerGoldTL)" />
        <circle cx="28" cy="28" r="4.5" fill="url(#cornerGoldTL)" />
        <circle cx="28" cy="28" r="2.5" fill="#fffdf9" />
        <circle cx="50" cy="18" r="2.5" fill="url(#cornerGoldTL)" />
        <circle cx="18" cy="50" r="2.5" fill="url(#cornerGoldTL)" />
      </svg>

      {/* Corner Bottom-Left */}
      <svg className="absolute bottom-[7px] left-[7px] h-24 w-24 -scale-y-100" viewBox="0 0 90 90" fill="none">
        <path d="M 6 85 C 6 42 42 6 85 6 C 68 12 55 24 50 38 C 45 52 35 62 21 67 C 13 70 8 76 6 85 Z" fill="url(#cornerGoldTL)" />
        <path d="M 12 76 C 16 52 36 32 60 28 C 48 34 40 44 38 56 C 36 68 28 74 12 76 Z" fill="url(#cornerGoldTL)" opacity="0.8" />
        <path d="M 4 35 C 10 18 20 10 38 4 C 32 8 28 14 28 22 C 28 32 20 38 4 35 Z" fill="url(#cornerGoldTL)" />
        <path d="M 35 4 C 18 10 10 20 4 38 C 8 32 14 28 22 28 C 32 28 38 20 35 4 Z" fill="url(#cornerGoldTL)" />
        <circle cx="28" cy="28" r="4.5" fill="url(#cornerGoldTL)" />
        <circle cx="28" cy="28" r="2.5" fill="#fffdf9" />
        <circle cx="50" cy="18" r="2.5" fill="url(#cornerGoldTL)" />
        <circle cx="18" cy="50" r="2.5" fill="url(#cornerGoldTL)" />
      </svg>

      {/* Corner Bottom-Right */}
      <svg className="absolute bottom-[7px] right-[7px] h-24 w-24 -scale-x-100 -scale-y-100" viewBox="0 0 90 90" fill="none">
        <path d="M 6 85 C 6 42 42 6 85 6 C 68 12 55 24 50 38 C 45 52 35 62 21 67 C 13 70 8 76 6 85 Z" fill="url(#cornerGoldTL)" />
        <path d="M 12 76 C 16 52 36 32 60 28 C 48 34 40 44 38 56 C 36 68 28 74 12 76 Z" fill="url(#cornerGoldTL)" opacity="0.8" />
        <path d="M 4 35 C 10 18 20 10 38 4 C 32 8 28 14 28 22 C 28 32 20 38 4 35 Z" fill="url(#cornerGoldTL)" />
        <path d="M 35 4 C 18 10 10 20 4 38 C 8 32 14 28 22 28 C 32 28 38 20 35 4 Z" fill="url(#cornerGoldTL)" />
        <circle cx="28" cy="28" r="4.5" fill="url(#cornerGoldTL)" />
        <circle cx="28" cy="28" r="2.5" fill="#fffdf9" />
        <circle cx="50" cy="18" r="2.5" fill="url(#cornerGoldTL)" />
        <circle cx="18" cy="50" r="2.5" fill="url(#cornerGoldTL)" />
      </svg>
    </div>
  )
}

// Official Universitas Andalas Seal Stamp
function OfficialStamp() {
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-12 opacity-85" style={{ color: '#4b389e' }}>
      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2.2" strokeDasharray="90 2 20 2" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1" />
      <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1.2" />

      {/* Circular text simulation */}
      <path id="stampTextPathTop" d="M 20 50 A 30 30 0 0 1 80 50" fill="none" />
      <path id="stampTextPathBottom" d="M 80 50 A 30 30 0 0 1 20 50" fill="none" />

      <text fontSize="5.5" fill="currentColor" fontWeight="bold" letterSpacing="0.8">
        <textPath href="#stampTextPathTop" startOffset="50%" textAnchor="middle">
          UNIVERSITAS ANDALAS
        </textPath>
      </text>

      <text fontSize="4.8" fill="currentColor" fontWeight="bold" letterSpacing="0.6">
        <textPath href="#stampTextPathBottom" startOffset="50%" textAnchor="middle">
          ★ DITMAWA ★
        </textPath>
      </text>

      {/* Center Shield / Seal Emblem */}
      <g transform="translate(38, 38) scale(0.24)">
        <path
          d="M50 0 L95 25 L95 65 C95 85 50 100 50 100 C50 100 5 85 5 65 L5 25 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
        />
        <path d="M50 20 L50 75 M30 40 L70 40 M35 60 L65 60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      </g>
    </svg>
  )
}

// Handwritten Ink Signature Component
function OfficialSignature() {
  return (
    <svg viewBox="0 0 140 60" className="h-16 w-36" style={{ color: '#16234d' }}>
      <path
        d="M 12 42 C 22 20 30 12 36 26 C 42 38 48 46 54 22 C 60 10 65 32 72 38 C 80 44 92 18 102 24 C 112 30 118 42 130 36 M 34 32 Q 62 18 110 28 M 20 48 Q 50 52 95 44"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Sample categories matching the reference image exactly
const SAMPLE_REKAP_KATEGORI = [
  { no: 1, nama: 'Penalaran dan Keilmuan / Reasoning & Knowledge', kredit: 419 },
  { no: 2, nama: 'Minat dan Bakat / Interests & Talents', kredit: 110 },
  { no: 3, nama: 'Kewirausahaan / Entrepreneurship', kredit: 60 },
  { no: 4, nama: 'Kesejahteraan / Student Welfare', kredit: 40 },
  { no: 5, nama: 'Pengabdian Kemahasiswaan / Community Service', kredit: 50 },
  { no: 6, nama: 'Organisasi / Student Organization', kredit: 90 },
  { no: 7, nama: 'Internasionalisasi / Internationalization', kredit: 30 },
]

// Sample breakdown achievements matching reference image
const SAMPLE_BREAKDOWN_LEFT = [
  {
    kategori: '1. Penalaran Talenta & Nalar',
    items: [
      { nama: 'Sub-CP: Juara 1 Lomba Tari Nasional', poin: 40 },
      { nama: 'Sub-CP: Peserta Lomba Menyanyi Wirayati', poin: 15 },
      { nama: 'CP Sub-CP: Pengurus Inti UKM Paduan Suara', poin: 30 },
      { nama: 'Sub-CP: Penggalian Tingkat Nasional', poin: 20 },
    ],
  },
  {
    kategori: '2. Kewirausahaan / Entrepreneurship',
    items: [
      { nama: 'CP: Bib-CP: Ketua Tim PKM Didanai', poin: 25 },
      { nama: 'Sub-CP: Peserta PIMNAS', poin: 50 },
      { nama: 'Sub-CP: Peserta PIMNAS', poin: 50 },
      { nama: 'Sub-CP: Ketua Tim Keahliannya', poin: 15 },
      { nama: 'Sub-CP: Peserta Nasional Nasyanyil', poin: 25 },
    ],
  },
  {
    kategori: '3. Kesejahteraan / Student Welfare',
    items: [
      { nama: 'Sub-CP: Juara Tari Nasional', poin: 40 },
      { nama: 'Sub-CP: Peserta SDM Seni', poin: 40 },
    ],
  },
  {
    kategori: '4. Pengabdian Masyarakat / Community Service',
    items: [
      { nama: 'Sub-CP: Juara 1 Lomba Tari Nasional', poin: 50 },
      { nama: 'Sub-CP: Peserta Lomba Menyanyi Wilayah', poin: 25 },
      { nama: 'CP: Organisasi Kemahasiswaan / Community Service', poin: 40 },
      { nama: 'Sub-CP: Peserta Wilayah UKM Tingkat Nasional', poin: 30 },
      { nama: 'CP: Internasionalisasi - Pelatih Tari Nasional', poin: 25 },
    ],
  },
]

const SAMPLE_BREAKDOWN_RIGHT = [
  {
    kategori: '5. Pengabdian Masyarakat / Community Service',
    items: [
      { nama: 'Sub-CP: Fest Festor Toskordinat', poin: 40 },
      { nama: 'Sub-CP: Perputaran Kektan', poin: 20 },
    ],
  },
  {
    kategori: '6. Organisasi Kemahasiswaan / Student Organization',
    items: [
      { nama: 'CP: Organisasi Kemahasiswaan - Pengurus Nasional', poin: 20 },
      { nama: 'CP: Organisasi Kemahasiswaan - Pemasaran Akreditasi', poin: 15 },
      { nama: 'Sub-CP: Best Presenter Nasional', poin: 25 },
    ],
  },
  {
    kategori: '7. Internasionalisasi / Internationalization',
    items: [
      { nama: 'Sub-CP: Juara 1 Lomba Karya Tulis Wilayah', poin: 15 },
      { nama: 'Sub-CP: Peserta Lomba Karya Tulis Nasional', poin: 15 },
      { nama: 'CP: Internasionalisasi - Juara 1 Karya Tulisan', poin: 30 },
      { nama: 'Sub-CP: Peserta Lomba Karya Tulis Nasional', poin: 15 },
      { nama: 'Sub-CP: Juara 1 Lomba Karya Wilayah', poin: 15 },
      { nama: 'Sub-CP: Peserta Lomba Karya Tulisan', poin: 20 },
      { nama: 'Sub-CP: Peserta Lomba Karya Tulis Nasional', poin: 10 },
    ],
  },
]

function GenerateSertifikat() {
  const user = getCurrentUser()
  const [loading, setLoading] = useState(true)
  const [useSampleData, setUseSampleData] = useState(false)
  const [portofolioData, setPortofolioData] = useState(null)

  const [mahasiswa, setMahasiswa] = useState({
    nama: 'Kevin Rahmat Illahi',
    nim: '2211513000',
    prodi: 'S1-SISTEM INFORMASI / BACHELOR - INFORMATION SYSTEMS',
    fakultas: 'FAKULTAS TEKNOLOGI INFORMASI / FACULTY OF INFORMATION TECHNOLOGY',
    tempatLahir: 'Padang',
    tanggalLahir: '3 Oktober 2004',
    totalPoin: 799,
  })

  const loadData = () => {
    const userId = user?.id
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    getPortofolio(userId)
      .then((data) => {
        setPortofolioData(data)
        const mhs = data?.mahasiswa || {}
        const ringkasan = data?.ringkasan || {}

        setMahasiswa({
          nama: mhs.nama || user?.nama || 'Kevin Rahmat Illahi',
          nim: mhs.nim || '2211513000',
          prodi: mhs.prodi
            ? `${mhs.prodi.toUpperCase()} / BACHELOR DEGREE`
            : 'S1-SISTEM INFORMASI / BACHELOR - INFORMATION SYSTEMS',
          fakultas: mhs.fakultas
            ? `${mhs.fakultas.toUpperCase()}`
            : 'FAKULTAS TEKNOLOGI INFORMASI / FACULTY OF INFORMATION TECHNOLOGY',
          tempatLahir: mhs.tempatLahir || 'Padang',
          tanggalLahir: mhs.tanggalLahir || '3 Oktober 2004',
          totalPoin: ringkasan.totalPoin || 799,
        })
      })
      .catch((err) => {
        toast.error('Gagal memuat data portofolio mahasiswa', { description: err.message })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  const handlePrint = () => {
    window.print()
  }

  // Calculate categories & points
  const categoriesToDisplay = SAMPLE_REKAP_KATEGORI
  const totalKredit = categoriesToDisplay.reduce((sum, c) => sum + c.kredit, 0)
  const kategoriStatus = totalKredit >= 500 ? 'SANGAT AKTIF / VERY ACTIVE' : totalKredit >= 250 ? 'AKTIF / ACTIVE' : 'CUKUP AKTIF / FAIRLY ACTIVE'

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      {/* Print Specific CSS for Landscape Certificate */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 6mm 6mm 6mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="print-hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-base-300 bg-base-100 p-4 sm:p-5 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-base-content">
                Sertifikat SAPS Mahasiswa
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Resmi Terakreditasi
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-base-content/60">
              Pratinjau sertifikat resmi <i>Student Activities Performance System</i> (SAPS) Universitas Andalas format A4 Landscape.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="btn btn-outline btn-sm gap-1.5"
              title="Perbarui data dari server"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Muat Ulang
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="btn btn-primary btn-sm gap-2 text-white shadow-sm hover:opacity-90"
            >
              <Printer className="h-4 w-4" />
              Cetak / Download PDF
            </button>
          </div>
        </div>

        {/* Certificate Display Area (Desktop Landscape Canvas & Responsive Container) */}
        <div className="overflow-x-auto rounded-xl border border-base-300 bg-slate-100/80 p-3 sm:p-6 lg:p-10 dark:bg-slate-900/40">
          <div className="mx-auto min-w-[960px] max-w-[1050px]">
            {/* The A4 Landscape Certificate Sheet */}
            <div
              id="sertifikat-print-area"
              className="relative w-full aspect-[1.414/1] bg-[#fffdf9] p-8 text-black shadow-2xl transition-all"
              style={{
                fontFamily: "'Times New Roman', Times, 'Tinos', Georgia, serif",
                color: '#000000',
              }}
            >
              {/* Ornate Golden Baroque Border & Corners */}
              <CertificateOrnateCorners />

              {/* Faint Watermark Universitas Andalas behind content */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06] select-none">
                <div className="flex flex-col items-center">
                  <img src={logoUnand} alt="" className="h-72 w-72 object-contain" />
                  <p className="mt-2 text-2xl font-bold tracking-[0.3em] uppercase text-[#14532d]">
                    UNIVERSITAS ANDALAS
                  </p>
                </div>
              </div>

              {/* Inner Certificate Content */}
              <div className="relative z-10 flex h-full flex-col justify-between px-6 py-4">
                {/* 1. Header (Kop Surat) */}
                <div>
                  <div className="flex items-center justify-center gap-4">
                    <img
                      src={logoUnand}
                      alt="Logo Universitas Andalas"
                      className="h-14 w-14 object-contain shrink-0"
                    />
                    <div className="text-center">
                      <h2 className="text-[13px] sm:text-[14px] font-bold tracking-wider uppercase text-black">
                        UNIVERSITAS ANDALAS / ANDALAS UNIVERSITY
                      </h2>
                      <h3 className="text-[11.5px] sm:text-[12.5px] font-bold tracking-wide uppercase text-black mt-0.5">
                        {mahasiswa.fakultas}
                      </h3>
                      <h4 className="text-[10.5px] sm:text-[11.5px] font-bold tracking-wide uppercase text-black mt-0.5">
                        {mahasiswa.prodi}
                      </h4>
                      <p className="text-[9px] text-gray-800 mt-0.5">
                        Keputusan Rektor No. (Sample Number: 0123/UN16.3/KM/SAPS/2026)
                      </p>
                    </div>
                  </div>

                  {/* Double Line Divider */}
                  <div className="mt-2.5 border-b-[2.5px] border-black" />
                  <div className="mt-[2px] border-b-[1px] border-black" />
                </div>

                {/* 2. Certificate Title */}
                <div className="my-1.5 text-center">
                  <h1 className="text-[15px] sm:text-[16.5px] font-black tracking-wide uppercase text-black">
                    SERTIFIKAT STUDENT ACTIVITIES PERFORMANCE SYSTEM (SAPS)
                  </h1>
                  <p className="text-[9.5px] font-medium text-gray-800 mt-0.5">
                    Nomor Dokumen: (e.g.. 0123/UN16.3/KM/SAPS/2026)
                  </p>
                </div>

                {/* 3. Main Body - 2 Columns (Bagian I & II vs Bagian III & Pengesahan) */}
                <div className="grid grid-cols-12 gap-5 leading-tight">
                  {/* LEFT COLUMN: Bagian I & Bagian II */}
                  <div className="col-span-5 flex flex-col justify-between space-y-2.5">
                    {/* Bagian I : Identitas */}
                    <div>
                      <h5 className="text-[9px] font-extrabold uppercase tracking-tight text-black">
                        BAGIAN I : IDENTITAS PEMEGANG SERTIFIKAT /
                        <span className="block font-bold text-gray-800">
                          INFORMATION IDENTIFYING THE HOLDER OF THE SAPS CERTIFICATE
                        </span>
                      </h5>

                      <div className="mt-1.5 space-y-0.5 text-[9px]">
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 text-gray-800">Nama / First Name / Surname</span>
                          <span className="col-span-7 font-bold">: {mahasiswa.nama}</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 text-gray-800">Tempat, Tanggal Lahir / Place, Date of Birth</span>
                          <span className="col-span-7 font-bold">: {mahasiswa.tempatLahir}, {mahasiswa.tanggalLahir}</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 text-gray-800">Nomor Induk Mahasiswa / Student ID Number</span>
                          <span className="col-span-7 font-bold">: {mahasiswa.nim}</span>
                        </div>
                        <div className="grid grid-cols-12 gap-1">
                          <span className="col-span-5 text-gray-800">Fakultas / Faculty</span>
                          <span className="col-span-7 font-bold">: {mahasiswa.fakultas.split('/')[0].trim()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bagian II : Rekapitulasi Poin SAPS Table */}
                    <div>
                      <h5 className="text-[9px] font-extrabold uppercase tracking-tight text-black">
                        BAGIAN II: REKAPITULASI POIN SAPS (KUALIFIKASI KEAKTIFAN) /
                        <span className="block font-bold text-gray-800">
                          SAPS POINT SUMMARY (ACTIVITY QUALIFICATION)
                        </span>
                      </h5>

                      <div className="mt-1 overflow-hidden border border-black">
                        <table className="w-full border-collapse text-[8.5px]">
                          <thead>
                            <tr className="bg-[#f2ece1] font-bold text-black">
                              <th className="w-6 border-r border-b border-black py-0.5 text-center">No</th>
                              <th className="border-r border-b border-black px-1.5 py-0.5 text-left">
                                Bidang Capaian / Achievement Domain (Bahasa Indonesia &amp; English)
                              </th>
                              <th className="w-18 border-b border-black px-1 py-0.5 text-center">
                                Kredit / Credit
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoriesToDisplay.map((row) => (
                              <tr key={row.no} className="border-b border-black">
                                <td className="border-r border-black py-0.5 text-center font-medium">{row.no}</td>
                                <td className="border-r border-black px-1.5 py-0.5">{row.nama}</td>
                                <td className="px-1 py-0.5 text-center font-semibold">{row.kredit}</td>
                              </tr>
                            ))}
                            <tr className="bg-[#fbf9f5] font-bold">
                              <td colSpan={2} className="border-r border-black px-2 py-0.5 text-center uppercase tracking-tight">
                                Total Kredit (1+2+3+4+5+6+7)
                              </td>
                              <td className="px-1 py-0.5 text-center font-bold text-[9.5px]">
                                {totalKredit}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <p className="mt-1.5 text-[9.5px] font-extrabold tracking-wide uppercase text-black">
                        KATEGORI: {kategoriStatus}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Bagian III & Bagian Pengesahan */}
                  <div className="col-span-7 flex flex-col justify-between">
                    {/* Bagian III : Rincian Rekapitulasi */}
                    <div>
                      <h5 className="text-[9px] font-extrabold uppercase tracking-tight text-black">
                        BAGIAN III: RINCIAN REKAPITULASI /{' '}
                        <span className="font-bold text-gray-800">
                          DETAILED BREAKDOWN OF ACHIEVEMENTS
                        </span>
                      </h5>

                      {/* 2 Sub-Columns for Category Breakdown */}
                      <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[8px] leading-[1.25]">
                        {/* Sub-Column 1 (Left): Categories 1-4 */}
                        <div className="space-y-1.5">
                          {SAMPLE_BREAKDOWN_LEFT.map((sec, idx) => (
                            <div key={idx}>
                              <p className="font-bold text-black">{sec.kategori}</p>
                              <ul className="mt-0.5 space-y-0.5 pl-1.5 text-gray-900">
                                {sec.items.map((it, iIdx) => (
                                  <li key={iIdx} className="flex justify-between items-baseline gap-1">
                                    <span className="truncate">{it.nama}</span>
                                    <span className="font-semibold shrink-0 text-black">{it.poin}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>

                        {/* Sub-Column 2 (Right): Categories 5-7 */}
                        <div className="space-y-1.5">
                          {SAMPLE_BREAKDOWN_RIGHT.map((sec, idx) => (
                            <div key={idx}>
                              <p className="font-bold text-black">{sec.kategori}</p>
                              <ul className="mt-0.5 space-y-0.5 pl-1.5 text-gray-900">
                                {sec.items.map((it, iIdx) => (
                                  <li key={iIdx} className="flex justify-between items-baseline gap-1">
                                    <span className="truncate">{it.nama}</span>
                                    <span className="font-semibold shrink-0 text-black">{it.poin}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bagian Pengesahan (Signatures) */}
                    <div className="mt-2 flex justify-end">
                      <div className="w-56 text-left">
                        <h6 className="text-[9px] font-extrabold uppercase text-black">
                          BAGIAN PENGESAHAN (SIGNATURES)
                        </h6>
                        <p className="text-[8.5px] text-gray-800 leading-tight">
                          Tempat dan Tanggal Diterbitkan: Padang,
                        </p>
                        <p className="text-[8.5px] font-bold text-black leading-tight">
                          {tanggalCetak}
                        </p>

                        <div className="mt-1 text-[8.5px] leading-tight">
                          <p className="text-gray-900">a.n. Wakil Rektor I,</p>
                          <p className="font-bold text-black">Direktur Kemahasiswaan</p>
                        </div>

                        {/* Official Stamp & Signature Overlay Container */}
                        <div className="relative my-0.5 flex h-14 w-44 items-center">
                          {/* Round Purple Stamp */}
                          <div className="absolute left-0 -top-2">
                            <OfficialStamp />
                          </div>

                          {/* Pen Ink Signature */}
                          <div className="absolute left-10 -top-1 z-10">
                            <OfficialSignature />
                          </div>
                        </div>

                        {/* Signatory Officer Name & NIP */}
                        <div className="text-[8.5px] leading-tight">
                          <p className="font-bold underline text-black">
                            Dr. Eng. Ir. Dendi Adi Saputra M, S.T., M. T.
                          </p>
                          <p className="font-medium text-gray-800">
                            NIP 198712012012121004
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default GenerateSertifikat
