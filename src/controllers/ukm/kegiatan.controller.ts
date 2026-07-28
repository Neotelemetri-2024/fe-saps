import { Request, Response, NextFunction } from 'express';
import ExcelJS from 'exceljs';
import prisma from '../../lib/prisma';

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

    // Validasi: kegiatan harus milik UKM ini
    const operator = await getOrganisasiOperator(BigInt(userId));
    if (!operator) {
      return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
    }

    const kegiatan = await prisma.kegiatan.findFirst({
      where: { id: kegiatanId, organisasiId: operator.organisasiId },
      include: {
        kategori: { select: { nama: true } },
        skala: { select: { nama: true } }
      }
    });

    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
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
          organisasi: operator.organisasi.nama
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
// Import peserta via file Excel (.xlsx)
export const importPesertaUKM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const kegiatanId = parseInt((req.params.kegiatanId || req.params.id) as string);

    // Validasi file
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File Excel (.xlsx) wajib diupload.' });
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

    // Parse Excel
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    if (!sheet) {
      return res.status(400).json({ success: false, message: 'File Excel tidak memiliki sheet.' });
    }

    const peserta: { nim: string; hadir: boolean; peranId: number | null }[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      const nimCell = row.getCell(1).value;
      const hadirCell = row.getCell(2).value;
      const peranCell = row.getCell(3).value;

      const nim = nimCell != null ? String(nimCell).trim() : '';
      if (!nim) return; // skip baris kosong

      const hadirStr = String(hadirCell ?? '').trim().toLowerCase();
      const hadir = hadirStr === 'true' || hadirStr === '1' || hadirStr === 'ya' || hadirStr === 'yes';

      const peranIdRaw = peranCell != null ? String(peranCell).trim() : '';
      const peranId = peranIdRaw && !isNaN(Number(peranIdRaw)) ? Number(peranIdRaw) : null;

      peserta.push({ nim, hadir, peranId });
    });

    if (peserta.length === 0) {
      return res.status(400).json({ success: false, message: 'Tidak ada data peserta di file Excel.' });
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

    await prisma.$transaction(async (tx) => {
      for (const p of peserta) {
        const mahasiswa = nimToMahasiswa.get(p.nim);
        if (!mahasiswa) {
          errors.push({ nim: p.nim, error: 'NIM tidak ditemukan di database' });
          continue;
        }

        try {
          await tx.partisipasi.upsert({
            where: {
              kegiatanId_mahasiswaId: {
                kegiatanId,
                mahasiswaId: mahasiswa.userId
              }
            },
            update: {
              kehadiran: p.hadir,
              peranVerifId: p.peranId ?? null,
              status: p.hadir ? 'hadir' : 'tidak_hadir'
            },
            create: {
              kegiatanId,
              mahasiswaId: mahasiswa.userId,
              kehadiran: p.hadir,
              peranVerifId: p.peranId ?? null,
              status: p.hadir ? 'hadir' : 'tidak_hadir'
            }
          });

          imported.push({
            nim: p.nim,
            nama: mahasiswa.user.nama,
            status: p.hadir ? 'hadir' : 'tidak_hadir'
          });
        } catch (err: any) {
          errors.push({ nim: p.nim, error: `Gagal menyimpan: ${err.message}` });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: `Berhasil mengimport ${imported.length} dari ${peserta.length} peserta.`,
      data: { imported, errors: errors.length > 0 ? errors : undefined }
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
    workbook.creator = 'SAPS';
    workbook.created = new Date();

    // Sheet 1: Data import
    const sheet = workbook.addWorksheet('Data Peserta');

    sheet.columns = [
      { header: 'NIM', key: 'nim', width: 20 },
      { header: 'HADIR (true/false)', key: 'hadir', width: 20 },
      { header: 'PERAN_ID', key: 'peranId', width: 15 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 20;

    // Contoh baris
    sheet.addRow({ nim: '2311210001', hadir: 'true', peranId: peranList[0]?.id ?? 1 });
    const exampleRow = sheet.getRow(2);
    exampleRow.font = { italic: true, color: { argb: 'FF888888' } };

    // Freeze header
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Sheet 2: Referensi peran
    const refSheet = workbook.addWorksheet('Referensi Peran');
    refSheet.columns = [
      { header: 'PERAN_ID', key: 'id', width: 15 },
      { header: 'NAMA PERAN', key: 'nama', width: 35 },
    ];
    const refHeader = refSheet.getRow(1);
    refHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    refHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B4332' } };
    refHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    refHeader.height = 20;

    peranList.forEach(p => refSheet.addRow({ id: p.id, nama: p.nama }));

    // Tulis ke response
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="template_peserta_kegiatan_${kegiatanId}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();

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

    const operator = await getOrganisasiOperator(BigInt(userId));
    if (!operator) {
      return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
    }

    const kegiatan = await prisma.kegiatan.findFirst({
      where: { id: kegiatanId, organisasiId: operator.organisasiId }
    });
    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
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

    const operator = await getOrganisasiOperator(aktorId);
    if (!operator) {
      return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
    }

    const kegiatan = await prisma.kegiatan.findFirst({
      where: { id: kegiatanId, organisasiId: operator.organisasiId },
      include: { kegiatanCapaian: true }
    });
    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
    }

    // Cek belum submit sebelumnya
    const sudahSubmit = await prisma.klaimPoin.count({
      where: { partisipasi: { kegiatanId }, status: 'disetujui' }
    });
    if (sudahSubmit > 0) {
      return res.status(400).json({
        success: false,
        message: 'Poin peserta sudah pernah di-submit. Status: Telah Tercatat.'
      });
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

    const processed: string[] = [];
    const errors: string[] = [];

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

        // Cek klaim sudah ada
        const existingKlaim = await tx.klaimPoin.findUnique({
          where: { partisipasiId: partisipasi.id }
        });
        if (existingKlaim) {
          errors.push(`${partisipasi.mahasiswa.user.nama}: Klaim sudah ada`);
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
            detail: {
              create: kegiatan.kegiatanCapaian.map(kc => ({
                subCapaianId: kc.subCapaianId,
                poin: Math.round((matriks.poin * Number(kc.alokasiPersen)) / 100)
              }))
            }
          }
        });

        // 3. Notifikasi ke mahasiswa
        await tx.notifikasi.create({
          data: {
            userId: partisipasi.mahasiswaId,
            judul: 'Poin Kegiatan Diperoleh! 🎉',
            isi: `Selamat! Anda mendapatkan ${matriks.poin} poin dari kegiatan "${kegiatan.nama}" yang diselenggarakan oleh ${operator.organisasi.nama}.`,
            refType: 'perolehan_poin',
            refId: perolehan.id
          }
        });

        processed.push(partisipasi.mahasiswaId.toString());
      }

      if (processed.length === 0) {
        throw new Error('Tidak ada peserta yang berhasil diproses. ' + errors.join(' | '));
      }
    });

    res.status(200).json({
      success: true,
      message: `Berhasil mencetak poin untuk ${processed.length} dari ${pesertaHadir.length} peserta yang hadir.`,
      data: {
        totalDiproses: processed.length,
        totalGagal: errors.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error: any) {
    next(error);
  }
};
