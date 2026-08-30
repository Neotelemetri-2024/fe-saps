import ExcelJS from 'exceljs';
import { LaporanDataResult } from './dataLaporan.service';

/**
 * Service untuk men-generate file Excel (.xlsx) komprehensif
 * multi-sheet untuk evaluasi dan riset pimpinan.
 */
export async function generateExcelLaporan(data: LaporanDataResult): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SAPS - Universitas Andalas';
  workbook.created = new Date();

  const primaryColor = '1E7E34'; // Hijau Unand
  const accentColor = '0D6EFD';  // Biru Aksen
  const headerFont = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 10 };

  // =========================================================================
  // SHEET 1: RINGKASAN EKSEKUTIF & STATISTIK
  // =========================================================================
  const sheetSummary = workbook.addWorksheet('Ringkasan Eksekutif');
  sheetSummary.views = [{ showGridLines: true }];

  // Header Judul Laporan
  sheetSummary.mergeCells('A1:G1');
  const titleCell = sheetSummary.getCell('A1');
  titleCell.value = 'LAPORAN EKSEKUTIF CAPAIAN & AKTIVITAS KEMAHASISWAAN (SAPS)';
  titleCell.font = { name: 'Arial', bold: true, size: 14, color: { argb: '1E7E34' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetSummary.getRow(1).height = 30;

  sheetSummary.mergeCells('A2:G2');
  const subTitleCell = sheetSummary.getCell('A2');
  subTitleCell.value = `${data.scopeNama} — Universitas Andalas`;
  subTitleCell.font = { name: 'Arial', bold: true, size: 11, color: { argb: '495057' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheetSummary.getRow(2).height = 20;

  // Metadata Filter
  sheetSummary.addRow([]);
  sheetSummary.addRow(['Tanggal Ekspor', `: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}`]);
  sheetSummary.addRow(['Kurikulum Aktif', `: ${data.kurikulum.nama} (Target: ${data.kurikulum.targetPoin} Poin)`]);
  if (data.filter.angkatan) sheetSummary.addRow(['Filter Angkatan', `: ${data.filter.angkatan}`]);
  if (data.filter.prodiNama) sheetSummary.addRow(['Filter Program Studi', `: ${data.filter.prodiNama}`]);

  sheetSummary.addRow([]);

  // KPI Highlights (Section Header)
  sheetSummary.addRow(['INDIKATOR KINERJA UTAMA (KPI) KEMAHASISWAAN']);
  const kpiSectionRow = sheetSummary.lastRow;
  kpiSectionRow!.font = { name: 'Arial', bold: true, color: { argb: '1E7E34' }, size: 11 };

  sheetSummary.addRow(['Indikator', 'Nilai Capaian', 'Keterangan']);
  const kpiHeaderRow = sheetSummary.lastRow!;
  kpiHeaderRow.font = headerFont;
  kpiHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  kpiHeaderRow.alignment = { vertical: 'middle' };

  sheetSummary.addRow(['Total Mahasiswa Terdaftar', data.kpi.totalMahasiswa, 'Orang']);
  sheetSummary.addRow(['Rata-rata Poin Per Mahasiswa', `${data.kpi.rataRataPoin} Poin`, `Target Kurikulum: ${data.kurikulum.targetPoin} Poin`]);
  sheetSummary.addRow(['Rata-rata Persentase Capaian', `${data.kpi.rataRataPersentase}%`, 'Dari total target kurikulum aktif']);
  sheetSummary.addRow(['Mahasiswa Memenuhi Target Kelulusan', `${data.kpi.persentaseLulusTarget}%`, 'Memiliki poin >= target kurikulum']);
  sheetSummary.addRow(['Total Poin Sah Terkumpul', `${data.kpi.totalPoinSah.toLocaleString('id-ID')} Poin`, 'Akumulasi seluruh poin sah']);
  sheetSummary.addRow(['Total Prestasi / Rekap Kompetisi', `${data.kpi.totalPrestasi} Prestasi`, 'Skala Wilayah, Nasional, Internasional']);
  sheetSummary.addRow(['Total Kegiatan Terlaksana', `${data.kpi.totalKegiatan} Kegiatan`, 'Kegiatan internal & eksternal disetujui']);

  sheetSummary.addRow([]);

  // Evaluasi 4 Pilar Kurikulum
  sheetSummary.addRow(['EVALUASI CAPAIAN PER PILAR KURIKULUM']);
  const kurSectionRow = sheetSummary.lastRow!;
  kurSectionRow.font = { name: 'Arial', bold: true, color: { argb: '1E7E34' }, size: 11 };

  sheetSummary.addRow(['Pilar Capaian', 'Tahun', 'Target Poin', 'Rata-rata Terkumpul', 'Capaian (%)']);
  const kurHeaderRow = sheetSummary.lastRow!;
  kurHeaderRow.font = headerFont;
  kurHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentColor } };
  kurHeaderRow.alignment = { vertical: 'middle' };

  data.capaianKurikulumStats.forEach((c) => {
    sheetSummary.addRow([c.nama, `Tahun ${c.tahun}`, c.targetPoin, c.rataRataTerkumpul, `${c.persentaseCapaian}%`]);
  });

  sheetSummary.addRow([]);

  // Tabel Komparasi (Ranking Fakultas atau Ranking Prodi)
  const unitLabel = data.komparasi.unit === 'fakultas' ? 'Fakultas' : 'Program Studi';
  sheetSummary.addRow([`PERINGKAT CAPAIAN POIN ANTAR-${unitLabel.toUpperCase()}`]);
  const komparasiSectionRow = sheetSummary.lastRow!;
  komparasiSectionRow.font = { name: 'Arial', bold: true, color: { argb: '1E7E34' }, size: 11 };

  sheetSummary.addRow(['Peringkat', `Nama ${unitLabel}`, 'Jumlah Mahasiswa', 'Total Poin', 'Rata-rata Poin', 'Rata-rata Capaian (%)']);
  const komparasiHeaderRow = sheetSummary.lastRow!;
  komparasiHeaderRow.font = headerFont;
  komparasiHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  komparasiHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  data.komparasi.items.forEach((item) => {
    sheetSummary.addRow([
      `#${item.ranking}`,
      item.nama,
      item.totalMahasiswa,
      item.totalPoin,
      item.rataRataPoin,
      `${item.rataRataPersentase}%`,
    ]);
  });

  sheetSummary.columns = [
    { width: 32 },
    { width: 35 },
    { width: 22 },
    { width: 22 },
    { width: 22 },
    { width: 25 },
    { width: 25 },
  ];

  // =========================================================================
  // SHEET 2: DATA CAPAIAN MAHASISWA (RAW DATA)
  // =========================================================================
  const sheetMhs = workbook.addWorksheet('Data Capaian Mahasiswa');
  sheetMhs.views = [{ showGridLines: true }];

  sheetMhs.columns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'NIM', key: 'nim', width: 18 },
    { header: 'NAMA MAHASISWA', key: 'nama', width: 32 },
    { header: 'FAKULTAS', key: 'fakultas', width: 26 },
    { header: 'PROGRAM STUDI', key: 'prodi', width: 28 },
    { header: 'ANGKATAN', key: 'angkatan', width: 12 },
    { header: 'TH 1 (PONDASI)', key: 'th1', width: 16 },
    { header: 'TH 2 (PENGUATAN)', key: 'th2', width: 18 },
    { header: 'TH 3 (PEMANTAPAN)', key: 'th3', width: 18 },
    { header: 'TH 4 (AKTUALISASI)', key: 'th4', width: 18 },
    { header: 'TOTAL POIN', key: 'totalPoin', width: 15 },
    { header: 'TARGET POIN', key: 'targetPoin', width: 15 },
    { header: 'CAPAIAN (%)', key: 'persen', width: 14 },
    { header: 'STATUS KELULUSAN', key: 'status', width: 18 },
  ];

  const mhsHeaderRow = sheetMhs.getRow(1);
  mhsHeaderRow.font = headerFont;
  mhsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  mhsHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  mhsHeaderRow.height = 25;

  data.mahasiswaList.forEach((m, idx) => {
    const row = sheetMhs.addRow({
      no: idx + 1,
      nim: m.nim,
      nama: m.nama,
      fakultas: m.fakultas,
      prodi: m.prodi,
      angkatan: m.angkatan,
      th1: m.poinTahun1,
      th2: m.poinTahun2,
      th3: m.poinTahun3,
      th4: m.poinTahun4,
      totalPoin: m.totalPoin,
      targetPoin: m.targetPoin,
      persen: `${m.persentase}%`,
      status: m.statusTarget,
    });
    row.getCell(2).numFmt = '@'; // NIM as text
  });

  // =========================================================================
  // SHEET 3: REKAP PRESTASI MAHASISWA
  // =========================================================================
  const sheetPrestasi = workbook.addWorksheet('Rekap Prestasi');
  sheetPrestasi.views = [{ showGridLines: true }];

  sheetPrestasi.columns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'NIM', key: 'nim', width: 18 },
    { header: 'NAMA MAHASISWA', key: 'nama', width: 30 },
    { header: 'FAKULTAS', key: 'fakultas', width: 25 },
    { header: 'PROGRAM STUDI', key: 'prodi', width: 25 },
    { header: 'NAMA KEGIATAN / PRESTASI', key: 'kegiatan', width: 38 },
    { header: 'KATEGORI', key: 'kategori', width: 20 },
    { header: 'SKALA', key: 'skala', width: 18 },
    { header: 'PERAN / JUARA', key: 'peran', width: 25 },
    { header: 'PENYELENGGARA', key: 'penyelenggara', width: 30 },
    { header: 'TANGGAL', key: 'tanggal', width: 14 },
    { header: 'POIN SAH', key: 'poin', width: 12 },
  ];

  const presHeaderRow = sheetPrestasi.getRow(1);
  presHeaderRow.font = headerFont;
  presHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: accentColor } };
  presHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  presHeaderRow.height = 25;

  data.prestasiList.forEach((p, idx) => {
    const row = sheetPrestasi.addRow({
      no: idx + 1,
      nim: p.nim,
      nama: p.namaMahasiswa,
      fakultas: p.fakultas,
      prodi: p.prodi,
      kegiatan: p.namaKegiatan,
      kategori: p.kategori,
      skala: p.skala,
      peran: p.peran,
      penyelenggara: p.penyelenggara,
      tanggal: p.tanggal,
      poin: p.poin,
    });
    row.getCell(2).numFmt = '@';
  });

  // =========================================================================
  // SHEET 4: KEAKTIFAN ORMAWA
  // =========================================================================
  const sheetOrmawa = workbook.addWorksheet('Keaktifan Ormawa');
  sheetOrmawa.views = [{ showGridLines: true }];

  sheetOrmawa.columns = [
    { header: 'NO', key: 'no', width: 6 },
    { header: 'NAMA ORGANISASI / UKM', key: 'nama', width: 35 },
    { header: 'TIPE', key: 'tipe', width: 15 },
    { header: 'LINGKUP / FAKULTAS', key: 'fakultas', width: 28 },
    { header: 'TOTAL KEGIATAN', key: 'kegiatan', width: 18 },
    { header: 'TOTAL PARTISIPASI MAHASISWA', key: 'peserta', width: 28 },
    { header: 'TOTAL POIN DIDISTRIBUSIKAN', key: 'poin', width: 28 },
  ];

  const ormHeaderRow = sheetOrmawa.getRow(1);
  ormHeaderRow.font = headerFont;
  ormHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: primaryColor } };
  ormHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };
  ormHeaderRow.height = 25;

  data.ormawaList.forEach((o, idx) => {
    sheetOrmawa.addRow({
      no: idx + 1,
      nama: o.nama,
      tipe: o.tipe,
      fakultas: o.fakultas,
      kegiatan: o.totalKegiatan,
      peserta: o.totalPeserta,
      poin: o.totalPoinDidistribusikan,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
