import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma';
import { bagiPoin } from '../../lib/distribusiPoin';

// Helper: dapatkan organisasiId operator yang sedang login
async function getOrganisasiOperator(userId: bigint) {
  const operator = await prisma.organisasiOperator.findFirst({
    where: { userId },
    include: { organisasi: true }
  });
  return operator;
}

// ==================== DAFTAR KEGIATAN UKM ====================

// GET /api/ukm/kegiatan
// Daftar kegiatan milik UKM + statistik cards + filter/search
export const getDaftarKegiatanUKM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const operator = await getOrganisasiOperator(BigInt(userId));
    if (!operator) {
      return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
    }

    const organisasiId = operator.organisasiId;
    const { search, skalaId, kategoriId, status, page = '1', limit = '10' } = req.query;

    // Build where clause
    const where: any = { organisasiId };

    if (search) {
      where.nama = { contains: search as string };
    }
    if (skalaId) {
      where.skalaId = parseInt(skalaId as string);
    }
    if (kategoriId) {
      where.kategoriId = parseInt(kategoriId as string);
    }
    if (status) {
      where.status = status as string;
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;
    const total = await prisma.kegiatan.count({ where });

    const kegiatan = await prisma.kegiatan.findMany({
      where,
      include: {
        kategori: { select: { nama: true } },
        skala: { select: { nama: true } },
        kegiatanApproval: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { aktor: { select: { nama: true } } }
        },
        _count: { select: { partisipasi: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    });

    // Statistik cards
    const currentDate = new Date();

    const [pendingCount, disetujuiCount, statusCount, eventAktifCount] = await Promise.all([
      prisma.kegiatan.count({
        where: { organisasiId, status: { in: ['diajukan', 'terverifikasi', 'perlu_revisi'] } }
      }),
      prisma.kegiatan.count({
        where: { organisasiId, status: { in: ['disetujui', 'terpublikasi'] } }
      }),
      prisma.kegiatan.count({ where: { organisasiId } }),
      prisma.kegiatan.count({
        where: {
          organisasiId,
          status: { in: ['disetujui', 'terpublikasi'] },
          tanggalSelesai: { gte: currentDate }
        }
      })
    ]);

    // Cek apakah ada kegiatan yang perlu submit peserta (sudah disetujui tapi belum ada klaim)
    const kegiatanPerluSubmit = await prisma.kegiatan.findMany({
      where: {
        organisasiId,
        status: { in: ['disetujui', 'terpublikasi'] },
        tanggalSelesai: { lt: currentDate }
      },
      select: { id: true, nama: true }
    });

    const kegiatanBelumTercatat: number[] = [];
    for (const k of kegiatanPerluSubmit) {
      const klaimCount = await prisma.klaimPoin.count({
        where: { partisipasi: { kegiatanId: k.id }, status: 'disetujui' }
      });
      if (klaimCount === 0) {
        kegiatanBelumTercatat.push(k.id);
      }
    }

    const tabelKegiatan = kegiatan.map(k => {
      let statusStr = k.status;
      const jumlahPeserta = k._count.partisipasi;
      const sudahTercatat = !kegiatanBelumTercatat.includes(k.id);

      return {
        id: k.id,
        namaKegiatan: k.nama,
        jenisKegiatan: k.kategori?.nama || '-',
        skala: k.skala?.nama || '-',
        tanggalMulai: k.tanggalMulai,
        tanggalSelesai: k.tanggalSelesai,
        diajukanPada: k.createdAt,
        status: statusStr,
        jumlahPeserta,
        statusPeserta: sudahTercatat ? 'sudah_tercatat' : 'belum_tercatat'
      };
    });

    res.status(200).json({
      success: true,
      data: {
        organisasi: {
          id: organisasiId,
          nama: operator.organisasi.nama
        },
        statistik: {
          pending: pendingCount,
          disetujui: disetujuiCount,
          total: statusCount,
          eventAktif: eventAktifCount
        },
        notifikasi: kegiatanBelumTercatat.length > 0
          ? `Ada ${kegiatanBelumTercatat.length} kegiatan yang selesai namun pesertanya belum tercatat. Segera verifikasi klaim poin peserta!`
          : null,
        kegiatan: tabelKegiatan,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error: any) {
    next(error);
  }
};

// ==================== MANAJEMEN PESERTA KEGIATAN ====================

// GET /api/ukm/kegiatan/:kegiatanId/peserta
// Menampilkan daftar peserta + statistik (total terdaftar, hadir, tidak hadir)
export const getManajemenPeserta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const kegiatanId = parseInt((req.params.kegiatanId || req.params.id) as string);
    const { search, filter, page = '1', limit = '10' } = req.query;

    // Admin Ditmawa/Fakultas boleh mengelola peserta event miliknya (tanpa organisasi)
    const isAdmin = req.user?.jabatan === 'admin_ditmawa' || req.user?.jabatan === 'admin_fakultas';

    let kegiatan: any;
    if (isAdmin) {
      kegiatan = await prisma.kegiatan.findUnique({
        where: { id: kegiatanId },
        include: {
          kategori: { select: { nama: true } },
          skala: { select: { nama: true } },
          organisasi: { select: { nama: true } }
        }
      });
    } else {
      // Validasi: kegiatan harus milik UKM ini
      const operator = await getOrganisasiOperator(BigInt(userId));
      if (!operator) {
        return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
      }
      kegiatan = await prisma.kegiatan.findFirst({
        where: { id: kegiatanId, organisasiId: operator.organisasiId },
        include: {
          kategori: { select: { nama: true } },
          skala: { select: { nama: true } },
          organisasi: { select: { nama: true } }
        }
      });
    }

    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
    }

    // Manajemen peserta oleh Admin hanya setelah kegiatan disetujui pimpinan
    if (isAdmin) {
      const allowedStatuses = ['disetujui', 'terpublikasi'];
      if (!allowedStatuses.includes(kegiatan.status)) {
        return res.status(400).json({
          success: false,
          message: `Kegiatan masih berstatus '${kegiatan.status}'. Manajemen peserta hanya bisa dilakukan setelah kegiatan disetujui.`
        });
      }
    }

    // Cek status submit
    const sudahSubmit = await prisma.klaimPoin.count({
      where: { partisipasi: { kegiatanId }, status: 'disetujui' }
    });

    // Build where untuk partisipasi
    const wherePartisipasi: any = { kegiatanId };
    if (filter === 'hadir') wherePartisipasi.kehadiran = true;
    else if (filter === 'tidak_hadir') wherePartisipasi.kehadiran = false;

    if (search) {
      wherePartisipasi.OR = [
        { mahasiswa: { nim: { contains: search as string } } },
        { mahasiswa: { user: { nama: { contains: search as string } } } }
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(50, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [totalPartisipasi, totalHadir, totalTidakHadir] = await Promise.all([
      prisma.partisipasi.count({ where: { kegiatanId } }),
      prisma.partisipasi.count({ where: { kegiatanId, kehadiran: true } }),
      prisma.partisipasi.count({ where: { kegiatanId, kehadiran: false } })
    ]);

    const total = await prisma.partisipasi.count({ where: wherePartisipasi });

    const peserta = await prisma.partisipasi.findMany({
      where: wherePartisipasi,
      include: {
        mahasiswa: {
          include: {
            user: { select: { nama: true } },
            prodi: {
              include: { fakultas: { select: { nama: true } } }
            }
          }
        },
        peranVerif: { select: { id: true, nama: true } }
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limitNum
    });

    // Daftar peran yang tersedia untuk kategori kegiatan ini
    const peranTersedia = await prisma.mpPeran.findMany({
      where: { kategoriId: kegiatan.kategoriId },
      orderBy: { urutan: 'asc' }
    });

    const tabelPeserta = peserta.map((p, i) => ({
      no: skip + i + 1,
      partisipasiId: p.id.toString(),
      nim: p.mahasiswa.nim,
      namaMahasiswa: p.mahasiswa.user.nama,
      fakultas: p.mahasiswa.prodi.fakultas?.nama || '-',
      programStudi: p.mahasiswa.prodi.nama,
      kehadiran: p.kehadiran,
      peran: p.peranVerif ? { id: p.peranVerif.id, nama: p.peranVerif.nama } : null
    }));

    res.status(200).json({
      success: true,
      data: {
        kegiatan: {
          id: kegiatan.id,
          nama: kegiatan.nama,
          tanggalMulai: kegiatan.tanggalMulai,
          lokasi: kegiatan.lokasi,
          organisasi: kegiatan.organisasi?.nama || null
        },
        statistik: {
          totalTerdaftar: totalPartisipasi,
          totalHadir: totalHadir,
          totalTidakHadir: totalTidakHadir
        },
        statusSubmit: sudahSubmit > 0 ? 'sudah_submit' : 'belum_submit',
        peranTersedia,
        peserta: tabelPeserta,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error: any) {
    next(error);
  }
};

// ==================== IMPORT PESERTA ====================

// POST /api/ukm/kegiatan/:kegiatanId/peserta/import
// Import peserta via file CSV
export const importPesertaUKM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const kegiatanId = parseInt((req.params.kegiatanId || req.params.id) as string);

    // Validasi file
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File CSV wajib diupload.' });
    }

    // Cek kegiatan — untuk admin, tidak perlu cek operator
    let kegiatan: any;
    if (req.user?.jabatan === 'admin_ditmawa' || req.user?.jabatan === 'admin_fakultas') {
      kegiatan = await prisma.kegiatan.findUnique({ where: { id: kegiatanId } });
      if (!kegiatan) {
        return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
      }
    } else {
      const operator = await getOrganisasiOperator(BigInt(userId));
      if (!operator) {
        return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
      }
      kegiatan = await prisma.kegiatan.findFirst({
        where: { id: kegiatanId, organisasiId: operator.organisasiId }
      });
      if (!kegiatan) {
        return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
      }
    }

    // Status harus disetujui/terpublikasi
    const allowedStatuses = ['disetujui', 'terpublikasi'];
    if (!allowedStatuses.includes(kegiatan.status)) {
      return res.status(400).json({
        success: false,
        message: `Kegiatan masih berstatus '${kegiatan.status}'. Import peserta hanya bisa dilakukan setelah kegiatan disetujui.`
      });
    }

    // Cek belum submit
    const sudahSubmit = await prisma.klaimPoin.count({
      where: { partisipasi: { kegiatanId }, status: 'disetujui' }
    });
    if (sudahSubmit > 0) {
      return res.status(400).json({
        success: false,
        message: 'Peserta sudah di-submit untuk klaim poin. Gunakan tombol Edit jika ingin mengubah.'
      });
    }

    // Ambil daftar peran untuk kategori kegiatan ini
    const peranList = await prisma.mpPeran.findMany({
      where: kegiatan.kategoriId ? { kategoriId: kegiatan.kategoriId } : {},
      orderBy: { urutan: 'asc' }
    });

    const findPeranId = (peranInput: any): number | null => {
      if (peranInput === undefined || peranInput === null) return null;
      const inputStr = String(peranInput).trim();
      if (!inputStr) return null;

      // 1. Jika berupa ID Angka (misal: 21, 22)
      if (!isNaN(Number(inputStr))) {
        const numId = Number(inputStr);
        const matchById = peranList.find(p => p.id === numId);
        if (matchById) return matchById.id;
      }

      // 2. Jika berupa Nama Peran (misal: "JUARA 1/ EMAS", "PESERTA") - Exact Match
      const lower = inputStr.toLowerCase();
      const exactMatch = peranList.find(p => p.nama.toLowerCase() === lower);
      if (exactMatch) return exactMatch.id;

      // 3. Partial Match (misal: "JUARA 1" mencocokkan "JUARA 1/ EMAS")
      const partialMatch = peranList.find(p => 
        p.nama.toLowerCase().includes(lower) || lower.includes(p.nama.toLowerCase())
      );
      if (partialMatch) return partialMatch.id;

      return null;
    };

    const peserta: { nim: string; nama: string; hadir: boolean; peranId: number | null }[] = [];
    let isExcelParsed = false;

    // Coba parse sebagai file Excel (.xlsx)
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer as any);
      const worksheet = workbook.getWorksheet('Data Peserta') || workbook.worksheets[0];

      if (worksheet) {
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header

          const cellNim = row.getCell(1);
          const cellNama = row.getCell(2);
          const cellHadir = row.getCell(3);
          const cellPeran = row.getCell(4);

          let nim = String(cellNim.text || cellNim.value || '').trim();

          // Penanganan Scientific Notation e.g. 2.31E+09 jika di-copy-paste di Excel
          if (nim.toLowerCase().includes('e+')) {
            nim = Number(nim).toLocaleString('fullwide', { useGrouping: false });
          }
          nim = nim.replace(/\s+/g, '');

          if (!nim || nim.startsWith('#') || nim.toLowerCase() === 'nim') return;

          const nama = String(cellNama.text || cellNama.value || '').trim();
          const hadirStr = String(cellHadir.text || cellHadir.value || '').trim().toLowerCase();
          const hadir = hadirStr === 'true' || hadirStr === '1' || hadirStr === 'ya' || hadirStr === 'yes' || hadirStr === 'hadir';

          const peranVal = cellPeran.text || cellPeran.value;
          const peranId = findPeranId(peranVal);

          peserta.push({ nim, nama, hadir, peranId });
        });
        isExcelParsed = peserta.length > 0;
      }
    } catch (err) {
      // Jika bukan file XLSX valid, fallback ke parsing CSV
    }

    // Fallback: Parsing CSV Teks
    if (!isExcelParsed) {
      const csvText = req.file.buffer.toString('utf-8');
      const lines = csvText.split(/\r?\n/).filter(line => {
        const t = line.trim();
        return t !== '' && !t.startsWith('#');
      });

      for (let i = 1; i < lines.length; i++) {
        const separator = lines[i].includes(';') ? ';' : ',';
        const cols = lines[i].split(separator);

        let nim = (cols[0] ?? '').trim().replace(/^"/, '').replace(/"$/, '');
        if (nim.toLowerCase().includes('e+')) {
          nim = Number(nim).toLocaleString('fullwide', { useGrouping: false });
        }
        nim = nim.replace(/\s+/g, '');
        if (!nim || nim.toLowerCase() === 'nim') continue;

        const nama = (cols[1] ?? '').trim().replace(/^"/, '').replace(/"$/, '');
        const hadirStr = (cols[2] ?? '').trim().toLowerCase().replace(/^"/, '').replace(/"$/, '');
        const hadir = hadirStr === 'true' || hadirStr === '1' || hadirStr === 'ya' || hadirStr === 'yes' || hadirStr === 'hadir';

        const peranRaw = (cols[3] ?? '').trim().replace(/^"/, '').replace(/"$/, '');
        const peranId = findPeranId(peranRaw);

        peserta.push({ nim, nama, hadir, peranId });
      }
    }

    if (peserta.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data peserta yang valid di file Excel/CSV.' });
    }

    // Cari mahasiswa berdasarkan NIM
    const nimList = peserta.map(p => p.nim);
    const mahasiswaList = await prisma.mahasiswa.findMany({
      where: { nim: { in: nimList } },
      include: {
        user: { select: { nama: true } },
        prodi: { include: { fakultas: { select: { nama: true } } } }
      }
    });

    const nimToMahasiswa = new Map(mahasiswaList.map(m => [m.nim, m]));
    const imported: any[] = [];
    const errors: any[] = [];

    const autoCreated: any[] = [];

    await prisma.$transaction(async (tx) => {
      for (const p of peserta) {
        let mahasiswa = nimToMahasiswa.get(p.nim);

        // Jika NIM belum terdaftar, tolak dan beri pesan error
        if (!mahasiswa) {
          errors.push({ nim: p.nim, error: 'Belum terdaftar di sistem SAPS. Mahasiswa harus login/register terlebih dahulu sebelum bisa di-import.' });
          continue;
        }

        // Jika relasi user tidak lengkap (orphan record)
        if (!(mahasiswa as any).user) {
          errors.push({ nim: p.nim, error: 'Data akun mahasiswa tidak lengkap (user tidak ditemukan). Hubungi admin.' });
          continue;
        }

        try {
          await tx.partisipasi.upsert({
            where: {
              kegiatanId_mahasiswaId: {
                kegiatanId,
                mahasiswaId: mahasiswa!.userId
              }
            },
            update: {
              kehadiran: p.hadir,
              peranVerifId: p.peranId ?? null,
              status: p.hadir ? 'hadir' : 'tidak_hadir'
            },
            create: {
              kegiatanId,
              mahasiswaId: mahasiswa!.userId,
              kehadiran: p.hadir,
              peranVerifId: p.peranId ?? null,
              status: p.hadir ? 'hadir' : 'tidak_hadir'
            }
          });

          imported.push({
            nim: p.nim,
            nama: (mahasiswa as any)?.user?.nama || p.nama || '-',
            status: p.hadir ? 'hadir' : 'tidak_hadir'
          });
        } catch (err: any) {
          errors.push({ nim: p.nim, error: `Gagal menyimpan: ${err.message}` });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Berhasil mengimport ${imported.length} dari ${peserta.length} peserta.${autoCreated.length > 0 ? ` (${autoCreated.length} akun baru dibuat otomatis)` : ''}`,
      data: {
        imported,
        autoCreated: autoCreated.length > 0 ? autoCreated : undefined,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    next(error);
  }
};

// ==================== DOWNLOAD TEMPLATE ====================

// GET /api/ukm/kegiatan/:kegiatanId/peserta/template
export const downloadTemplatePesertaUKM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const kegiatanId = parseInt((req.params.kegiatanId || req.params.id) as string);

    // Untuk route admin (peserta.routes.ts), tidak perlu cek operator
    let namaKegiatan = 'Kegiatan';
    let kategoriId: number | null = null;

    if (req.user?.jabatan === 'admin_ditmawa' || req.user?.jabatan === 'admin_fakultas') {
      const kegiatan = await prisma.kegiatan.findUnique({
        where: { id: kegiatanId },
        select: { nama: true, kategoriId: true }
      });
      if (!kegiatan) {
        return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
      }
      namaKegiatan = kegiatan.nama;
      kategoriId = kegiatan.kategoriId;
    } else {
      const operator = await getOrganisasiOperator(BigInt(userId));
      if (!operator) {
        return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
      }
      const kegiatan = await prisma.kegiatan.findFirst({
        where: { id: kegiatanId, organisasiId: operator.organisasiId },
        select: { nama: true, kategoriId: true }
      });
      if (!kegiatan) {
        return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
      }
      namaKegiatan = kegiatan.nama;
      kategoriId = kegiatan.kategoriId;
    }

    const peranList = await prisma.mpPeran.findMany({
      where: kategoriId ? { kategoriId } : {},
      orderBy: { urutan: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SAPS UNAND';
    workbook.created = new Date();

    // Sheet 1: Data Peserta
    const sheetData = workbook.addWorksheet('Data Peserta');
    sheetData.columns = [
      { header: 'NIM', key: 'nim', width: 22 },
      { header: 'NAMA MAHASISWA', key: 'nama', width: 32 },
      { header: 'STATUS KEHADIRAN', key: 'hadir', width: 20 },
      { header: 'PERAN / PRESTASI', key: 'peran', width: 35 }
    ];

    // Style Header (Row 1)
    const headerRow = sheetData.getRow(1);
    headerRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E7E34' } // SAPS UNAND Green
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Sheet 2: Petunjuk & Referensi
    const sheetRef = workbook.addWorksheet('Petunjuk & Referensi');
    sheetRef.columns = [
      { header: 'PERAN_ID', key: 'id', width: 12 },
      { header: 'NAMA PERAN / PRESTASI', key: 'nama', width: 45 }
    ];

    const refHeaderRow = sheetRef.getRow(1);
    refHeaderRow.font = { name: 'Arial', bold: true, color: { argb: 'FFFFFF' } };
    refHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '0D6EFD' }
    };
    refHeaderRow.alignment = { vertical: 'middle', horizontal: 'center' };

    peranList.forEach((p) => {
      sheetRef.addRow({ id: p.id, nama: p.nama });
    });

    sheetRef.addRow({});
    sheetRef.addRow({ id: 'PETUNJUK PENGISIAN TEMPLATE:' });
    sheetRef.addRow({ id: '1. Kolom NIM diisi angka NIM Mahasiswa (contoh: 2311210001).' });
    sheetRef.addRow({ id: '2. Kolom NAMA MAHASISWA opsional (bisa diisi untuk mempermudah pengecekan).' });
    sheetRef.addRow({ id: '3. Kolom STATUS KEHADIRAN diisi: HADIR atau TIDAK HADIR.' });
    const samplePeran = peranList[0]?.nama || 'PESERTA';
    sheetRef.addRow({ id: `4. Kolom PERAN / PRESTASI pilih/ketik nama peran sesuai daftar (Contoh: ${samplePeran}).` });

    // Format NIM column as Text '@' and set Dropdown Validations for C & D columns
    const lastRefRow = peranList.length + 1;
    for (let i = 2; i <= 500; i++) {
      sheetData.getCell(`A${i}`).numFmt = '@';
      sheetData.getCell(`C${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"HADIR, TIDAK HADIR"'],
        showErrorMessage: true,
        errorTitle: 'Pilihan Tidak Valid',
        error: 'Silakan pilih HADIR atau TIDAK HADIR dari daftar.'
      };
      if (peranList.length > 0) {
        sheetData.getCell(`D${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`'Petunjuk & Referensi'!$B$2:$B$${lastRefRow}`],
          showErrorMessage: true,
          errorTitle: 'Peran Tidak Valid',
          error: 'Silakan pilih Nama Peran / Prestasi dari daftar yang tersedia.'
        };
      }
    }

    // Add sample row to Sheet 1
    const sampleRow = sheetData.addRow({
      nim: '2311210001',
      nama: 'Budi Santoso',
      hadir: 'HADIR',
      peran: samplePeran
    });
    sampleRow.getCell(1).numFmt = '@';
    sampleRow.getCell(1).value = '2311210001';

    const buffer = await workbook.xlsx.writeBuffer();
    const safeNama = namaKegiatan.replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Template_Peserta_${safeNama}.xlsx"`);
    res.send(Buffer.from(buffer));

  } catch (error: any) {
    next(error);
  }
};

// ==================== UPDATE PESERTA (EDIT) ====================

// PUT /api/ukm/kegiatan/:kegiatanId/peserta
// Update kehadiran & peran peserta setelah submit (mode Edit)
export const updatePesertaUKM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const kegiatanId = parseInt((req.params.kegiatanId || req.params.id) as string);

    const isAdmin = req.user?.jabatan === 'admin_ditmawa' || req.user?.jabatan === 'admin_fakultas';

    let kegiatan: any;
    if (isAdmin) {
      kegiatan = await prisma.kegiatan.findUnique({
        where: { id: kegiatanId }
      });
    } else {
      const operator = await getOrganisasiOperator(BigInt(userId));
      if (!operator) {
        return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
      }
      kegiatan = await prisma.kegiatan.findFirst({
        where: { id: kegiatanId, organisasiId: operator.organisasiId }
      });
    }

    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
    }

    // Manajemen peserta oleh Admin hanya setelah kegiatan disetujui pimpinan
    if (isAdmin) {
      const allowedStatuses = ['disetujui', 'terpublikasi'];
      if (!allowedStatuses.includes(kegiatan.status)) {
        return res.status(400).json({
          success: false,
          message: `Kegiatan masih berstatus '${kegiatan.status}'. Manajemen peserta hanya bisa dilakukan setelah kegiatan disetujui.`
        });
      }
    }

    const { peserta } = req.body; // [{ partisipasiId, hadir, peranId }]
    if (!Array.isArray(peserta) || peserta.length === 0) {
      return res.status(400).json({ success: false, message: 'Data peserta tidak boleh kosong.' });
    }

    await prisma.$transaction(async (tx) => {
      for (const p of peserta) {
        await tx.partisipasi.update({
          where: { id: BigInt(p.partisipasiId) },
          data: {
            kehadiran: p.hadir,
            peranVerifId: p.peranId ?? null,
            status: p.hadir ? 'hadir' : 'tidak_hadir'
          }
        });
      }
    });

    res.status(200).json({
      success: true,
      message: `Berhasil mengupdate ${peserta.length} peserta.`
    });

  } catch (error: any) {
    next(error);
  }
};

// ==================== SUBMIT POIN PESERTA ====================

// POST /api/ukm/kegiatan/:kegiatanId/peserta/submit
// Submit & auto-generate poin untuk semua peserta yang hadir + punya peran
export const submitPoinPesertaUKM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const aktorId = BigInt(userId);
    const kegiatanId = parseInt((req.params.kegiatanId || req.params.id) as string);

    const isAdmin = req.user?.jabatan === 'admin_ditmawa' || req.user?.jabatan === 'admin_fakultas';

    let kegiatan: any;
    if (isAdmin) {
      kegiatan = await prisma.kegiatan.findUnique({
        where: { id: kegiatanId },
        include: { kegiatanCapaian: true, organisasi: { select: { nama: true } } }
      });
    } else {
      const operator = await getOrganisasiOperator(aktorId);
      if (!operator) {
        return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
      }
      kegiatan = await prisma.kegiatan.findFirst({
        where: { id: kegiatanId, organisasiId: operator.organisasiId },
        include: { kegiatanCapaian: true, organisasi: { select: { nama: true } } }
      });
    }

    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
    }

    const penyelenggaraNama = kegiatan.organisasi?.nama || kegiatan.nama;

    // Klaim poin oleh Admin hanya setelah kegiatan disetujui pimpinan
    if (isAdmin) {
      const allowedStatuses = ['disetujui', 'terpublikasi'];
      if (!allowedStatuses.includes(kegiatan.status)) {
        return res.status(400).json({
          success: false,
          message: `Kegiatan masih berstatus '${kegiatan.status}'. Klaim poin hanya bisa dilakukan setelah kegiatan disetujui.`
        });
      }
    }

    // Pastikan kegiatanCapaian sudah terisi (UKM wajib set alokasi capaian dulu)
    if (kegiatan.kegiatanCapaian.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Alokasi capaian kegiatan belum diatur. Hubungi Admin Ditmawa.'
      });
    }

    // Ambil semua peserta yang hadir + punya peran
    const pesertaHadir = await prisma.partisipasi.findMany({
      where: {
        kegiatanId,
        kehadiran: true,
        peranVerifId: { not: null }
      },
      include: {
        mahasiswa: { include: { user: { select: { nama: true } } } }
      }
    });

    if (pesertaHadir.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada peserta yang hadir dan memiliki peran. Pastikan kehadiran dan peran sudah diisi.'
      });
    }

    const errors: string[] = [];
    let dibuat = 0;
    let diperbarui = 0;
    let tetap = 0;
    let dibatalkan = 0;

    const detailUntuk = (totalPoin: number): { subCapaianId: number; poin: number }[] =>
      bagiPoin<number>(
        totalPoin,
        kegiatan.kegiatanCapaian.map((kc: any) => ({ ref: kc.subCapaianId as number, bobot: Number(kc.alokasiPersen) }))
      ).map(b => ({ subCapaianId: b.ref, poin: b.poin }));

    await prisma.$transaction(async (tx) => {
      for (const partisipasi of pesertaHadir) {
        const peranId = partisipasi.peranVerifId!;

        // Lookup matriks poin
        const matriks = await tx.matriksPoin.findFirst({
          where: {
            kurikulumId: kegiatan.kurikulumId,
            kategoriId: kegiatan.kategoriId,
            skalaId: kegiatan.skalaId,
            peranId
          }
        });

        if (!matriks) {
          errors.push(`${partisipasi.mahasiswa.user.nama} (peran ID ${peranId}): Matriks poin tidak ditemukan`);
          continue;
        }

        const existingKlaim = await tx.klaimPoin.findUnique({
          where: { partisipasiId: partisipasi.id },
          include: { perolehanPoin: true }
        });

        // Submit ulang bersifat idempoten: peserta yang datanya tidak berubah
        // dilewati agar poinnya tidak tercatat dua kali.
        if (existingKlaim) {
          const perolehan = existingKlaim.perolehanPoin;
          const samaPeran = existingKlaim.peranUsulanId === peranId;
          const samaPoin = perolehan?.totalPoin === matriks.poin;
          const masihSah = perolehan?.status === 'sah';

          if (samaPeran && samaPoin && masihSah) {
            tetap++;
            continue;
          }

          await tx.klaimPoin.update({
            where: { id: existingKlaim.id },
            data: {
              peranUsulanId: peranId,
              status: 'disetujui',
              validatorId: aktorId,
              alasan: 'Diperbarui oleh penyelenggara kegiatan setelah perubahan peran/bobot'
            }
          });

          let perolehanId: bigint;
          if (perolehan) {
            await tx.perolehanPoin.update({
              where: { id: perolehan.id },
              data: { totalPoin: matriks.poin, status: 'sah' }
            });
            await tx.perolehanDetail.deleteMany({ where: { perolehanPoinId: perolehan.id } });
            perolehanId = perolehan.id;
          } else {
            const dibuatBaru = await tx.perolehanPoin.create({
              data: {
                klaimPoinId: existingKlaim.id,
                mahasiswaId: partisipasi.mahasiswaId,
                kegiatanId,
                totalPoin: matriks.poin,
                status: 'sah'
              }
            });
            perolehanId = dibuatBaru.id;
          }

          await tx.perolehanDetail.createMany({
            data: detailUntuk(matriks.poin).map(d => ({ ...d, perolehanPoinId: perolehanId }))
          });

          await tx.notifikasi.create({
            data: {
              userId: partisipasi.mahasiswaId,
              judul: 'Poin Kegiatan Diperbarui',
              isi: `Poin Anda untuk kegiatan "${kegiatan.nama}" diperbarui menjadi ${matriks.poin} poin oleh ${penyelenggaraNama}.`,
              refType: 'perolehan_poin',
              refId: perolehanId
            }
          });

          diperbarui++;
          continue;
        }

        // 1. Buat KlaimPoin (langsung disetujui - auto internal)
        const klaim = await tx.klaimPoin.create({
          data: {
            partisipasiId: partisipasi.id,
            peranUsulanId: peranId,
            status: 'disetujui',
            validatorId: aktorId,
            alasan: 'Auto-generated: Poin diberikan oleh penyelenggara kegiatan UKM'
          }
        });

        // 2. Buat PerolehanPoin + Detail per sub capaian
        const perolehan = await tx.perolehanPoin.create({
          data: {
            klaimPoinId: klaim.id,
            mahasiswaId: partisipasi.mahasiswaId,
            kegiatanId,
            totalPoin: matriks.poin,
            status: 'sah',
            detail: { create: detailUntuk(matriks.poin) }
          }
        });

        // 3. Notifikasi ke mahasiswa
        await tx.notifikasi.create({
          data: {
            userId: partisipasi.mahasiswaId,
            judul: 'Poin Kegiatan Diperoleh! 🎉',
            isi: `Selamat! Anda mendapatkan ${matriks.poin} poin dari kegiatan "${kegiatan.nama}" yang diselenggarakan oleh ${penyelenggaraNama}.`,
            refType: 'perolehan_poin',
            refId: perolehan.id
          }
        });

        dibuat++;
      }

      // Peserta yang kehadiran/perannya dicabut tidak boleh menyisakan poin aktif
      const idPesertaAktif = pesertaHadir.map(p => p.id);
      const klaimTidakAktif = await tx.klaimPoin.findMany({
        where: {
          partisipasi: { kegiatanId },
          partisipasiId: { notIn: idPesertaAktif },
          perolehanPoin: { status: { not: 'dibatalkan' } }
        },
        include: { perolehanPoin: true }
      });
      for (const klaim of klaimTidakAktif) {
        if (!klaim.perolehanPoin) continue;
        await tx.perolehanPoin.update({
          where: { id: klaim.perolehanPoin.id },
          data: { status: 'dibatalkan' }
        });
        dibatalkan++;
      }

      if (dibuat + diperbarui + tetap === 0) {
        throw new Error('Tidak ada peserta yang berhasil diproses. ' + errors.join(' | '));
      }
    });

    const ringkasan = [
      dibuat > 0 ? `${dibuat} peserta baru dicetak` : null,
      diperbarui > 0 ? `${diperbarui} peserta diperbarui` : null,
      tetap > 0 ? `${tetap} peserta tanpa perubahan` : null,
      dibatalkan > 0 ? `${dibatalkan} poin dibatalkan` : null,
      errors.length > 0 ? `${errors.length} gagal` : null
    ].filter(Boolean).join(', ');

    res.status(200).json({
      success: true,
      message: `Submit poin selesai: ${ringkasan}.`,
      data: {
        totalDibuat: dibuat,
        totalDiperbarui: diperbarui,
        totalTanpaPerubahan: tetap,
        totalDibatalkan: dibatalkan,
        totalGagal: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    console.error('[submitPoinPesertaUKM]', error?.stack || error?.message || error);
    next(error);
  }
};

// ==================== CARI MAHASISWA UNTUK PESERTA ====================

// GET /api/kegiatan/:kegiatanId/peserta/search?q=...
// Cari mahasiswa (NIM/nama) yang belum terdaftar sebagai peserta kegiatan ini.
export const cariMahasiswaPeserta = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const kegiatanId = parseInt((req.params.kegiatanId || req.params.id) as string);
    const q = String(req.query.q || '').trim();

    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const isAdmin = req.user?.jabatan === 'admin_ditmawa' || req.user?.jabatan === 'admin_fakultas';

    let kegiatan: any;
    if (isAdmin) {
      kegiatan = await prisma.kegiatan.findUnique({ where: { id: kegiatanId } });
    } else {
      const operator = await getOrganisasiOperator(BigInt(userId));
      if (!operator) {
        return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
      }
      kegiatan = await prisma.kegiatan.findFirst({
        where: { id: kegiatanId, organisasiId: operator.organisasiId }
      });
    }

    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
    }

    const terdaftar = await prisma.partisipasi.findMany({
      where: { kegiatanId },
      select: { mahasiswaId: true }
    });
    const terdaftarIds = terdaftar.map((p) => p.mahasiswaId);

    const mahasiswa = await prisma.mahasiswa.findMany({
      where: {
        userId: terdaftarIds.length > 0 ? { notIn: terdaftarIds } : undefined,
        OR: [
          { nim: { contains: q } },
          { user: { nama: { contains: q } } }
        ]
      },
      include: {
        user: { select: { nama: true } },
        prodi: { include: { fakultas: { select: { nama: true } } } }
      },
      take: 20
    });

    const data = mahasiswa.map((m) => ({
      userId: m.userId.toString(),
      nim: m.nim,
      nama: m.user.nama,
      fakultas: m.prodi.fakultas?.nama || '-',
      prodi: m.prodi.nama
    }));

    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('[cariMahasiswaPeserta]', error?.stack || error?.message || error);
    next(error);
  }
};

// ==================== TAMBAH PESERTA MANUAL ====================

// POST /api/kegiatan/:kegiatanId/peserta  body { mahasiswaId }
// Tambah mahasiswa menjadi peserta kegiatan secara manual (upsert partisipasi).
export const tambahPesertaManual = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const kegiatanId = parseInt((req.params.kegiatanId || req.params.id) as string);
    const mahasiswaIdRaw = (req.body as any)?.mahasiswaId;
    const mahasiswaId = BigInt(String(mahasiswaIdRaw).trim());

    if (!mahasiswaIdRaw || Number.isNaN(Number(mahasiswaIdRaw))) {
      return res.status(400).json({ success: false, message: 'ID mahasiswa tidak valid.' });
    }

    const isAdmin = req.user?.jabatan === 'admin_ditmawa' || req.user?.jabatan === 'admin_fakultas';

    let kegiatan: any;
    if (isAdmin) {
      kegiatan = await prisma.kegiatan.findUnique({ where: { id: kegiatanId } });
    } else {
      const operator = await getOrganisasiOperator(BigInt(userId));
      if (!operator) {
        return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
      }
      kegiatan = await prisma.kegiatan.findFirst({
        where: { id: kegiatanId, organisasiId: operator.organisasiId }
      });
    }

    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
    }

    if (isAdmin) {
      const allowedStatuses = ['disetujui', 'terpublikasi'];
      if (!allowedStatuses.includes(kegiatan.status)) {
        return res.status(400).json({
          success: false,
          message: `Kegiatan masih berstatus '${kegiatan.status}'. Manajemen peserta hanya bisa dilakukan setelah kegiatan disetujui.`
        });
      }
    }

    const mahasiswa = await prisma.mahasiswa.findUnique({
      where: { userId: mahasiswaId },
      include: {
        user: { select: { nama: true } },
        prodi: { include: { fakultas: { select: { nama: true } } } }
      }
    });

    if (!mahasiswa) {
      return res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan di sistem SAPS.' });
    }

    await prisma.partisipasi.upsert({
      where: { kegiatanId_mahasiswaId: { kegiatanId, mahasiswaId } },
      update: {},
      create: {
        kegiatanId,
        mahasiswaId,
        kehadiran: true,
        status: 'hadir'
      }
    });

    res.status(201).json({
      success: true,
      message: `${mahasiswa.user.nama} berhasil ditambahkan sebagai peserta.`,
      data: {
        userId: mahasiswa.userId.toString(),
        nim: mahasiswa.nim,
        nama: mahasiswa.user.nama,
        fakultas: mahasiswa.prodi.fakultas?.nama || '-',
        prodi: mahasiswa.prodi.nama
      }
    });
  } catch (error: any) {
    console.error('[tambahPesertaManual]', error?.stack || error?.message || error);
    next(error);
  }
};


