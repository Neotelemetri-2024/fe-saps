import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma';
import { Iku3Filter, calculateIku3Dashboard } from './iku3Calculation.service';
import {
  resolveBobotPrestasi,
  resolveBobotPembelajaran,
  normalize,
} from './iku3Bobot.constants';

/**
 * Menentukan Semester, Tahun Akademik, dan Kode PDDIKTI berdasarkan tanggal kegiatan:
 * - Bulan Jan - Jun (0 - 5): Semester Genap, Tahun Akademik (Y-1)/Y, Kode: (Y-1)2
 * - Bulan Jul - Des (6 - 11): Semester Ganjil, Tahun Akademik Y/(Y+1), Kode: Y1
 */
function getSemesterInfo(dateInput: Date | string) {
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    return { tahun: '-', tahunAkademik: '-', semester: '-', kodeSemester: '-' };
  }
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 = Jan, 11 = Des

  if (month >= 0 && month <= 5) {
    return {
      tahun: year,
      tahunAkademik: `${year - 1}/${year}`,
      semester: 'Genap',
      kodeSemester: `${year - 1}2`,
    };
  } else {
    return {
      tahun: year,
      tahunAkademik: `${year}/${year + 1}`,
      semester: 'Ganjil',
      kodeSemester: `${year}1`,
    };
  }
}

function formatDateIndo(dateInput?: Date | string) {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export async function generateIku3ExcelReport(filter: Iku3Filter): Promise<Buffer> {
  const tahun = filter.tahun || new Date().getFullYear();

  // 1. Dapatkan metadata KPI & Cakupan
  const dashboardData = await calculateIku3Dashboard(filter);
  const { kpi, rumpunDistribusi, cakupan } = dashboardData;

  // 2. Query aturan dinamis
  const dynamicRules = await prisma.iku3BobotRule.findMany({ where: { aktif: true, deletedAt: null } });

  // 3. Rentang tanggal evaluasi (Year-to-Date kumulatif)
  let endMonth = 11;
  let endDay = 31;
  let labelTriwulan = '1 Tahun Penuh (Jan - Des)';

  if (filter.triwulan === 1) {
    endMonth = 2;
    endDay = 31;
    labelTriwulan = 'Triwulan I (Jan - Mar)';
  } else if (filter.triwulan === 2) {
    endMonth = 5;
    endDay = 30;
    labelTriwulan = 'Triwulan II (Akumulasi Jan - Jun)';
  } else if (filter.triwulan === 3) {
    endMonth = 8;
    endDay = 30;
    labelTriwulan = 'Triwulan III (Akumulasi Jan - Sep)';
  } else if (filter.triwulan === 4) {
    endMonth = 11;
    endDay = 31;
    labelTriwulan = 'Triwulan IV (Akumulasi Jan - Des)';
  }

  const startDate = new Date(Date.UTC(tahun, 0, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(tahun, endMonth, endDay, 23, 59, 59, 999));

  // 4. Query perolehan poin yang sah
  const whereCondition: any = {
    status: 'sah',
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (filter.fakultasId) {
    whereCondition.mahasiswa = {
      prodi: { fakultasId: Number(filter.fakultasId) },
    };
  }

  if (filter.prodiId) {
    whereCondition.mahasiswa = {
      ...whereCondition.mahasiswa,
      prodiId: Number(filter.prodiId),
    };
  }

  const perolehanList = await prisma.perolehanPoin.findMany({
    where: whereCondition,
    include: {
      mahasiswa: {
        include: {
          user: { select: { nama: true } },
          prodi: { include: { fakultas: true } },
        },
      },
      kegiatan: {
        include: { kategori: true, skala: true, organisasi: true },
      },
      klaimPoin: {
        include: { peranUsulan: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Pisahkan ke dua kelompok: Pembelajaran di Luar Prodi vs Prestasi
  const dataPembelajaran: any[] = [];
  const dataPrestasi: any[] = [];

  const PEMBELAJARAN_KEYWORDS = [
    'magang', 'internship', 'msib', 'mbkm', 'kampus mengajar',
    'pertukaran pelajar', 'pertukaran mahasiswa', 'exchange', 'iisma',
    'studi independen', 'riset luar', 'proyek kemanusiaan',
    'kkn tematik', 'kkn internasional',
    'pembelajaran luar kampus', 'belajar luar kampus',
  ];

  for (const p of perolehanList) {
    const kategoriNama = normalize(p.kegiatan?.kategori?.nama);
    const kegiatanNama = normalize(p.kegiatan?.nama);
    const peranNama = p.klaimPoin?.peranUsulan?.nama || '-';
    const skalaNama = p.kegiatan?.skala?.nama || '-';

    const isLomba =
      kategoriNama.includes('kompetisi') ||
      kategoriNama.includes('lomba') ||
      normalize(peranNama).includes('juara') ||
      normalize(peranNama).includes('finalis');

    const isPembelajaranLuarKampus = PEMBELAJARAN_KEYWORDS.some(
      (kw) => kategoriNama.includes(kw) || kegiatanNama.includes(kw),
    );

    const tanggalRef = p.kegiatan?.tanggalMulai || p.createdAt;
    const semInfo = getSemesterInfo(tanggalRef);
    const jenjang = (p.mahasiswa?.prodi as any)?.jenjang || 'S1';

    if (isLomba) {
      const bobot = resolveBobotPrestasi(skalaNama, peranNama, dynamicRules);
      dataPrestasi.push({
        nim: p.mahasiswa?.nim || '-',
        namaMahasiswa: p.mahasiswa?.user?.nama || '-',
        fakultas: p.mahasiswa?.prodi?.fakultas?.nama || '-',
        prodi: p.mahasiswa?.prodi?.nama || '-',
        jenjang,
        tanggal: formatDateIndo(tanggalRef),
        tahun: semInfo.tahun,
        semester: semInfo.semester,
        kodeSemester: semInfo.kodeSemester,
        namaKompetisi: p.kegiatan?.nama || '-',
        skala: skalaNama,
        peringkat: peranNama,
        bobot,
        status: 'Sah',
      });
    } else if (isPembelajaranLuarKampus) {
      const bobot = resolveBobotPembelajaran(20, dynamicRules);
      dataPembelajaran.push({
        nim: p.mahasiswa?.nim || '-',
        namaMahasiswa: p.mahasiswa?.user?.nama || '-',
        fakultas: p.mahasiswa?.prodi?.fakultas?.nama || '-',
        prodi: p.mahasiswa?.prodi?.nama || '-',
        jenjang,
        tahun: semInfo.tahun,
        semester: semInfo.semester,
        kodeSemester: semInfo.kodeSemester,
        sks: 20, // Standar konversi MBKM 1 semester penuh
        bobot,
        programMBKM: p.kegiatan?.kategori?.nama || 'MBKM / Pembelajaran Luar Kampus',
        namaKegiatan: p.kegiatan?.nama || '-',
        tempatMitra: p.kegiatan?.lokasi || p.kegiatan?.organisasi?.nama || 'Mitra MBKM',
        status: 'Sah',
      });
    }
  }

  // 5. Buat Workbook dengan ExcelJS
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'MY UNAND STUDENT CONNECT Universitas Andalas';
  workbook.created = new Date();

  const primaryGreen = '1E7E34';
  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'D3D3D3' } },
    left: { style: 'thin', color: { argb: 'D3D3D3' } },
    bottom: { style: 'thin', color: { argb: 'D3D3D3' } },
    right: { style: 'thin', color: { argb: 'D3D3D3' } },
  };

  // ==================== SHEET 1: BELAJAR DILUAR PRODI ====================
  const ws1 = workbook.addWorksheet('Belajar di Luar Prodi');
  ws1.views = [{ showGridLines: true }];

  // Judul & Header Info
  ws1.addRow(['PENGUKURAN IKU 3 : LAPORAN PEMBELAJARAN DI LUAR PROGRAM STUDI']);
  ws1.addRow([
    `Tahun: ${tahun} | Periode: ${labelTriwulan} | Cakupan: ${cakupan.fakultas || 'Universitas Andalas'}${cakupan.prodi ? ` - ${cakupan.prodi}` : ''} | Dicetak: ${formatDateIndo(new Date())}`,
  ]);
  ws1.addRow([]);
  ws1.addRow(['I. Mahasiswa Memperoleh Pengalaman Pembelajaran di Luar Program Studi (MBKM / Magang / Pertukaran Pelajar)']);

  // Format Baris Header Judul
  ws1.getRow(1).font = { name: 'Arial', size: 13, bold: true, color: { argb: '1E7E34' } };
  ws1.getRow(2).font = { name: 'Arial', size: 10, italic: true, color: { argb: '555555' } };
  ws1.getRow(4).font = { name: 'Arial', size: 11, bold: true };

  // Kolom Tabel (Baris 5)
  const headerCols1 = [
    'No',
    'NIM',
    'Nama Mahasiswa',
    'Fakultas',
    'Nama Prodi',
    'Jenjang',
    'Tahun',
    'Semester',
    'Kode Semester',
    'Total SKS',
    'Bobot IKU 3',
    'Bentuk MBKM',
    'Nama Kegiatan / Program',
    'Tempat / Mitra',
    'Status',
  ];

  const tableHeader1 = ws1.addRow(headerCols1);
  tableHeader1.height = 28;
  tableHeader1.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  tableHeader1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: primaryGreen },
  };
  tableHeader1.alignment = { vertical: 'middle', horizontal: 'center' };

  if (dataPembelajaran.length === 0) {
    const emptyRow = ws1.addRow(['Tidak ada data pembelajaran di luar prodi pada periode ini.']);
    ws1.mergeCells(6, 1, 6, headerCols1.length);
    emptyRow.alignment = { horizontal: 'center', vertical: 'middle' };
    emptyRow.font = { italic: true, color: { argb: '888888' } };
  } else {
    dataPembelajaran.forEach((item, idx) => {
      const r = ws1.addRow([
        idx + 1,
        item.nim,
        item.namaMahasiswa,
        item.fakultas,
        item.prodi,
        item.jenjang,
        item.tahun,
        item.semester,
        item.kodeSemester,
        item.sks,
        Number(item.bobot).toFixed(2),
        item.programMBKM,
        item.namaKegiatan,
        item.tempatMitra,
        item.status,
      ]);
      r.height = 20;
      r.font = { name: 'Arial', size: 10 };
      r.alignment = { vertical: 'middle' };
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).numFmt = '@'; // NIM as text
      r.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(15).alignment = { horizontal: 'center', vertical: 'middle' };

      for (let c = 1; c <= headerCols1.length; c++) {
        r.getCell(c).border = borderThin;
      }
    });
  }

  // Atur Lebar Kolom Otomatis
  ws1.columns = [
    { width: 6 },  // No
    { width: 16 }, // NIM
    { width: 28 }, // Nama
    { width: 26 }, // Fakultas
    { width: 22 }, // Prodi
    { width: 10 }, // Jenjang
    { width: 10 }, // Tahun
    { width: 12 }, // Semester
    { width: 15 }, // Kode Semester
    { width: 12 }, // SKS
    { width: 13 }, // Bobot
    { width: 24 }, // Program MBKM
    { width: 34 }, // Nama Kegiatan
    { width: 26 }, // Tempat / Mitra
    { width: 10 }, // Status
  ];

  // ==================== SHEET 2: PRESTASI MAHASISWA ====================
  const ws2 = workbook.addWorksheet('Prestasi Mahasiswa');
  ws2.views = [{ showGridLines: true }];

  ws2.addRow(['PENGUKURAN IKU 3 : LAPORAN PRESTASI MAHASISWA DI LUAR PROGRAM STUDI']);
  ws2.addRow([
    `Tahun: ${tahun} | Periode: ${labelTriwulan} | Cakupan: ${cakupan.fakultas || 'Universitas Andalas'}${cakupan.prodi ? ` - ${cakupan.prodi}` : ''} | Dicetak: ${formatDateIndo(new Date())}`,
  ]);
  ws2.addRow([]);
  ws2.addRow(['II. Mahasiswa Meraih Prestasi dalam Kompetisi/Kejuaraan (Min. Tingkat Provinsi s.d. Internasional)']);

  ws2.getRow(1).font = { name: 'Arial', size: 13, bold: true, color: { argb: '1E7E34' } };
  ws2.getRow(2).font = { name: 'Arial', size: 10, italic: true, color: { argb: '555555' } };
  ws2.getRow(4).font = { name: 'Arial', size: 11, bold: true };

  const headerCols2 = [
    'No',
    'NIM',
    'Nama Mahasiswa',
    'Fakultas',
    'Nama Prodi',
    'Jenjang',
    'Tanggal Prestasi',
    'Tahun',
    'Semester',
    'Kode Semester',
    'Nama Kompetisi / Kegiatan',
    'Tingkat / Skala',
    'Peringkat / Juara',
    'Bobot IKU 3',
    'Status',
  ];

  const tableHeader2 = ws2.addRow(headerCols2);
  tableHeader2.height = 28;
  tableHeader2.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  tableHeader2.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: primaryGreen },
  };
  tableHeader2.alignment = { vertical: 'middle', horizontal: 'center' };

  if (dataPrestasi.length === 0) {
    const emptyRow = ws2.addRow(['Tidak ada data prestasi mahasiswa pada periode ini.']);
    ws2.mergeCells(6, 1, 6, headerCols2.length);
    emptyRow.alignment = { horizontal: 'center', vertical: 'middle' };
    emptyRow.font = { italic: true, color: { argb: '888888' } };
  } else {
    dataPrestasi.forEach((item, idx) => {
      const r = ws2.addRow([
        idx + 1,
        item.nim,
        item.namaMahasiswa,
        item.fakultas,
        item.prodi,
        item.jenjang,
        item.tanggal,
        item.tahun,
        item.semester,
        item.kodeSemester,
        item.namaKompetisi,
        item.skala,
        item.peringkat,
        Number(item.bobot).toFixed(2),
        item.status,
      ]);
      r.height = 20;
      r.font = { name: 'Arial', size: 10 };
      r.alignment = { vertical: 'middle' };
      r.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(2).numFmt = '@';
      r.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(8).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(9).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(12).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(13).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(14).alignment = { horizontal: 'center', vertical: 'middle' };
      r.getCell(15).alignment = { horizontal: 'center', vertical: 'middle' };

      for (let c = 1; c <= headerCols2.length; c++) {
        r.getCell(c).border = borderThin;
      }
    });
  }

  ws2.columns = [
    { width: 6 },  // No
    { width: 16 }, // NIM
    { width: 28 }, // Nama
    { width: 26 }, // Fakultas
    { width: 22 }, // Prodi
    { width: 10 }, // Jenjang
    { width: 16 }, // Tanggal
    { width: 10 }, // Tahun
    { width: 12 }, // Semester
    { width: 15 }, // Kode Semester
    { width: 36 }, // Nama Kompetisi
    { width: 18 }, // Skala
    { width: 20 }, // Peringkat
    { width: 13 }, // Bobot
    { width: 10 }, // Status
  ];

  // ==================== SHEET 3: RINGKASAN CAPAIAN ====================
  const ws3 = workbook.addWorksheet('Ringkasan Capaian');
  ws3.views = [{ showGridLines: true }];

  ws3.addRow(['RINGKASAN EKSEKUTIF CAPAIAN IKU 3']);
  ws3.addRow([
    `Tahun: ${tahun} | Periode: ${labelTriwulan} | Cakupan: ${cakupan.fakultas || 'Universitas Andalas'}${cakupan.prodi ? ` - ${cakupan.prodi}` : ''} | Dicetak: ${formatDateIndo(new Date())}`,
  ]);
  ws3.addRow([]);

  ws3.getRow(1).font = { name: 'Arial', size: 13, bold: true, color: { argb: '1E7E34' } };
  ws3.getRow(2).font = { name: 'Arial', size: 10, italic: true, color: { argb: '555555' } };

  const kpiHeaders = ['Indikator', 'Nilai Capaian', 'Keterangan'];
  const kpiHeaderRow = ws3.addRow(kpiHeaders);
  kpiHeaderRow.height = 26;
  kpiHeaderRow.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  kpiHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: primaryGreen },
  };
  kpiHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

  const summaryData = [
    ['Target Capaian IKU 3 (%)', `${Number(kpi.target || 0).toFixed(2)}%`, 'Target ditetapkan universitas'],
    ['Realisasi Capaian (%)', `${Number(kpi.capaian || 0).toFixed(2)}%`, kpi.statusTarget === 'tercapai' ? 'Tercapai' : 'Belum Tercapai'],
    ['Selisih Capaian (%)', `${Number(kpi.selisih || 0).toFixed(2)}%`, kpi.selisih >= 0 ? 'Surplus' : 'Defisit'],
    ['Total Mahasiswa Kontributor', kpi.totalKontributor || 0, 'Mahasiswa unik berkegiatan sah'],
    ['Total Bobot Efektif', Number(kpi.totalBobotEfektif || 0).toFixed(2), 'Bobot poin sah (capped maks 1.00/mhs)'],
    ['Total Populasi Mahasiswa (S1/D3)', kpi.totalMahasiswa || 0, 'Penyebut capaian IKU 3'],
    ['Kegiatan Rumpun Prestasi Kompetisi', `${rumpunDistribusi.prestasi.count} kegiatan (${Number(rumpunDistribusi.prestasi.persentase || 0).toFixed(1)}%)`, `Total bobot: ${Number(rumpunDistribusi.prestasi.totalBobot || 0).toFixed(2)}`],
    ['Kegiatan Rumpun Pembelajaran Luar Kampus', `${rumpunDistribusi.pembelajaran.count} kegiatan (${Number(rumpunDistribusi.pembelajaran.persentase || 0).toFixed(1)}%)`, `Total bobot: ${Number(rumpunDistribusi.pembelajaran.totalBobot || 0).toFixed(2)}`],
  ];

  summaryData.forEach((row) => {
    const r = ws3.addRow(row);
    r.height = 20;
    r.font = { name: 'Arial', size: 10 };
    r.getCell(1).font = { name: 'Arial', size: 10, bold: true };
    r.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= 3; c++) {
      r.getCell(c).border = borderThin;
    }
  });

  ws3.columns = [
    { width: 42 },
    { width: 24 },
    { width: 36 },
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
