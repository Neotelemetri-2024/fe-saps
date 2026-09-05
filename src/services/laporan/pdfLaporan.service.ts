import fs from 'fs'
import path from 'path'
import PDFDocument from 'pdfkit'
import { LaporanDataResult } from './dataLaporan.service'

const FONT = {
  regular: 'Times-Roman',
  bold: 'Times-Bold',
}

const TNR_REGULAR = [
  '/System/Library/Fonts/Supplemental/Times New Roman.ttf',
  '/Library/Fonts/Times New Roman.ttf',
  '/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman.ttf',
]

const TNR_BOLD = [
  '/System/Library/Fonts/Supplemental/Times New Roman Bold.ttf',
  '/Library/Fonts/Times New Roman Bold.ttf',
  '/usr/share/fonts/truetype/msttcorefonts/Times_New_Roman_Bold.ttf',
]

const MARGIN = 48
const ROW_H = 16
const GAP = 8

function firstExisting(paths: string[]) {
  return paths.find((p) => fs.existsSync(p))
}

function logoFile() {
  return firstExisting([
    path.join(process.cwd(), 'src/assets/logo_unand.png'),
    path.join(process.cwd(), 'assets/logo_unand.png'),
  ])
}

function registerTimes(doc: PDFKit.PDFDocument) {
  const regular = firstExisting(TNR_REGULAR)
  const bold = firstExisting(TNR_BOLD)
  if (regular) {
    doc.registerFont('TNR', regular)
    FONT.regular = 'TNR'
  }
  if (bold) {
    doc.registerFont('TNR-Bold', bold)
    FONT.bold = 'TNR-Bold'
  }
}

function formatNumber(value: number) {
  return Number(value || 0).toLocaleString('id-ID')
}

function formatTanggal(value?: Date | string) {
  const d = value ? new Date(value) : new Date()
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

type Align = 'left' | 'center' | 'right'

interface TableColumn {
  label: string
  width: number
  align?: Align
}

function clean(text: string) {
  return String(text || '-').replace(/\s+/g, ' ').trim()
}

function put(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  opts: { align?: Align; bold?: boolean; size?: number; wrap?: boolean; height?: number } = {},
) {
  doc.font(opts.bold ? FONT.bold : FONT.regular)
    .fontSize(opts.size ?? 9)
    .fillColor('#000000')
    .text(clean(text), x, y, {
      width,
      align: opts.align ?? 'left',
      lineBreak: Boolean(opts.wrap),
      ellipsis: !opts.wrap,
      height: opts.height,
      lineGap: 1,
    })
}

function measureRowHeight(doc: PDFKit.PDFDocument, columns: TableColumn[], row: string[]) {
  doc.font(FONT.regular).fontSize(9)
  let height = ROW_H
  columns.forEach((col, i) => {
    const h = doc.heightOfString(clean(row[i] ?? '-'), {
      width: col.width - 8,
      lineGap: 1,
    })
    height = Math.max(height, h + 6)
  })
  return Math.min(height, 56)
}

function generatePdf(doc: PDFKit.PDFDocument, data: LaporanDataResult) {
  const pageW = 595.28
  const pageH = 841.89
  const contentW = pageW - MARGIN * 2
  const bottom = pageH - MARGIN
  let y = MARGIN

  const stroke = (x1: number, y1: number, x2: number, y2: number) => {
    doc.moveTo(x1, y1).lineTo(x2, y2).lineWidth(0.6).strokeColor('#000000').stroke()
  }

  const newPage = () => {
    doc.addPage({ size: 'A4', margin: 0 })
    y = MARGIN
  }

  const need = (height: number) => {
    if (y + height > bottom) newPage()
  }

  const logo = logoFile()
  const logoH = 72
  if (logo) doc.image(logo, MARGIN, y, { height: logoH })

  put(doc, 'KEMENTERIAN PENDIDIKAN DAN KEBUDAYAAN', MARGIN, y + 2, contentW, {
    align: 'center',
    size: 9,
  })
  put(doc, 'UNIVERSITAS ANDALAS', MARGIN, y + 14, contentW, { align: 'center', bold: true, size: 14 })
  put(doc, 'Alamat : Gedung PKM, Limau Manis Padang Kode Pos 25163', MARGIN, y + 32, contentW, {
    align: 'center',
    size: 8,
  })
  put(doc, 'Telepon : 0751-71181, 71175, 71086, 71087, 71699   Faksimile : 0751-71085', MARGIN, y + 44, contentW, {
    align: 'center',
    size: 8,
  })
  put(doc, 'Laman : https://saps.unand.ac.id   e-mail : saps@unand.ac.id', MARGIN, y + 56, contentW, {
    align: 'center',
    size: 8,
  })

  y += logoH + 4
  doc.moveTo(MARGIN, y).lineTo(MARGIN + contentW, y).lineWidth(1.8).strokeColor('#000000').stroke()
  y += 8

  put(doc, 'Laporan Evaluasi Kemahasiswaan', MARGIN, y, contentW, {
    align: 'center',
    bold: true,
    size: 11,
  })
  y += 18
  put(doc, data.scopeNama, MARGIN, y, contentW, { align: 'center', size: 9 })
  y += 16
  put(
    doc,
    `${data.kurikulum.nama}  |  Target ${data.kurikulum.targetPoin} poin  |  ${formatTanggal()}`,
    MARGIN,
    y,
    contentW,
    { align: 'center', size: 8 },
  )
  y += 18

  const drawTable = (title: string, columns: TableColumn[], rows: string[][]) => {
    const left = MARGIN
    const tableW = columns.reduce((sum, col) => sum + col.width, 0)
    const xs = [left]
    columns.forEach((col) => xs.push(xs[xs.length - 1] + col.width))
    const body = rows.length
      ? rows
      : [columns.map((_, i) => (i === (columns[0]?.label === 'No' ? 1 : 0) ? 'Tidak ada data' : ''))]

    need(ROW_H * 2 + 14)
    put(doc, title, MARGIN, y, contentW, { bold: true, size: 11 })
    y += 12

    let blockTop = y

    const vLines = (from: number, to: number) => {
      xs.forEach((x) => stroke(x, from, x, to))
    }

    const paintHeader = () => {
      blockTop = y
      stroke(left, y, left + tableW, y)
      let x = left
      columns.forEach((col) => {
        put(doc, col.label, x + 4, y + 3, col.width - 8, {
          align: col.align || 'left',
          bold: true,
          size: 9,
        })
        x += col.width
      })
      y += ROW_H
      stroke(left, y, left + tableW, y)
    }

    paintHeader()

    body.forEach((row) => {
      const rh = measureRowHeight(doc, columns, row)
      if (y + rh > bottom) {
        vLines(blockTop, y)
        newPage()
        paintHeader()
      }
      let x = left
      columns.forEach((col, i) => {
        put(doc, row[i] ?? '-', x + 4, y + 3, col.width - 8, {
          align: col.align || 'left',
          size: 9,
          wrap: true,
          height: rh - 4,
        })
        x += col.width
      })
      y += rh
      stroke(left, y, left + tableW, y)
    })

    vLines(blockTop, y)
    y += GAP
  }

  const unitLabel = data.komparasi.unit === 'fakultas' ? 'Fakultas' : 'Program Studi'

  drawTable(
    'A. Ringkasan',
    [
      { label: 'No', width: 28, align: 'center' },
      { label: 'Uraian', width: 150 },
      { label: 'Nilai', width: 90, align: 'right' },
    ],
    [
      ['1', 'Mahasiswa', formatNumber(data.kpi.totalMahasiswa)],
      ['2', 'Rata-rata poin', `${data.kpi.rataRataPoin} / ${data.kurikulum.targetPoin}`],
      ['3', 'Capaian', `${data.kpi.rataRataPersentase}%`],
      ['4', 'Lulus target', `${data.kpi.persentaseLulusTarget}%`],
      ['5', 'Poin sah', formatNumber(data.kpi.totalPoinSah)],
      ['6', 'Prestasi', formatNumber(data.kpi.totalPrestasi)],
    ],
  )

  drawTable(
    'B. Kurikulum',
    [
      { label: 'No', width: 28, align: 'center' },
      { label: 'Tahapan', width: 100 },
      { label: 'Tahun', width: 48 },
      { label: 'Target', width: 52, align: 'right' },
      { label: 'Rata-rata', width: 62, align: 'right' },
      { label: 'Capaian', width: 58, align: 'right' },
    ],
    data.capaianKurikulumStats.map((c, i) => [
      String(i + 1),
      c.nama || '-',
      String(c.tahun),
      String(c.targetPoin),
      String(c.rataRataTerkumpul),
      `${c.persentaseCapaian}%`,
    ]),
  )

  drawTable(
    `C. Peringkat ${unitLabel}`,
    [
      { label: 'No', width: 28, align: 'center' },
      { label: unitLabel, width: 170 },
      { label: 'Mahasiswa', width: 62, align: 'right' },
      { label: 'Rata-rata', width: 58, align: 'right' },
      { label: 'Capaian', width: 54, align: 'right' },
    ],
    data.komparasi.items.map((item) => [
      String(item.ranking),
      item.nama || '-',
      formatNumber(item.totalMahasiswa),
      formatNumber(item.rataRataPoin),
      `${item.rataRataPersentase ?? 0}%`,
    ]),
  )

  drawTable(
    'D. Prestasi',
    [
      { label: 'No', width: 28, align: 'center' },
      { label: 'Mahasiswa', width: 100 },
      { label: 'Kegiatan', width: 130 },
      { label: 'Skala', width: 92 },
      { label: 'Peringkat', width: 88 },
      { label: 'Poin', width: 42, align: 'right' },
    ],
    data.prestasiList.map((p, i) => [
      String(i + 1),
      p.namaMahasiswa || '-',
      p.namaKegiatan || '-',
      p.skala || '-',
      p.peran || '-',
      String(p.poin ?? 0),
    ]),
  )

  need(86)
  y += 6
  const sigW = 200
  const sigX = MARGIN + contentW - sigW
  put(doc, `Padang, ${formatTanggal()}`, sigX, y, sigW, {
    align: 'center',
    size: 9,
  })
  y += 14
  put(doc, 'Mengetahui,', sigX, y, sigW, { align: 'center', size: 9 })
  y += 48
  put(doc, '( .................................... )', sigX, y, sigW, { align: 'center', size: 9 })
  y += 14
  put(doc, 'NIP. ................................', sigX, y, sigW, { align: 'center', size: 9 })

  const range = doc.bufferedPageRange()
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i)
    put(doc, String(i + 1), MARGIN, pageH - 32, contentW, { align: 'right', size: 8 })
  }
}

export async function generatePdfLaporan(data: LaporanDataResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        bufferPages: true,
        autoFirstPage: true,
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', (err) => reject(err))

      registerTimes(doc)
      generatePdf(doc, data)
      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}
