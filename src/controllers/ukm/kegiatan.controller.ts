import { Request, Response, NextFunction } from 'express';
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

    const kegiatanId = parseInt(req.params.kegiatanId as string);
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
// Import peserta via JSON (frontend parsing CSV)
export const importPesertaUKM = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const kegiatanId = parseInt(req.params.kegiatanId as string);

    const operator = await getOrganisasiOperator(BigInt(userId));
    if (!operator) {
      return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
    }

    // Validasi kegiatan milik UKM ini
    const kegiatan = await prisma.kegiatan.findFirst({
      where: { id: kegiatanId, organisasiId: operator.organisasiId }
    });
    if (!kegiatan) {
      return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
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

    // Validasi body: array peserta [{ nim, hadir, peranId? }]
    const { peserta } = req.body;
    if (!Array.isArray(peserta) || peserta.length === 0) {
      return res.status(400).json({ success: false, message: 'Data peserta tidak boleh kosong.' });
    }

    // Cari mahasiswa berdasarkan NIM
    const nimList: string[] = peserta.map((p: any) => p.nim);
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
              kehadiran: p.hadir ?? false,
              peranVerifId: p.peranId ?? null,
              status: p.hadir ? 'hadir' : 'tidak_hadir'
            },
            create: {
              kegiatanId,
              mahasiswaId: mahasiswa.userId,
              kehadiran: p.hadir ?? false,
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

    const kegiatanId = parseInt(req.params.kegiatanId as string);

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

    const peranList = await prisma.mpPeran.findMany({
      where: { kategoriId: kegiatan.kategoriId },
      orderBy: { urutan: 'asc' }
    });

    const header = 'NIM,HADIR (true/false),PERAN_ID';
    const komentar1 = `# Template Import Peserta - ${kegiatan.nama}`;
    const komentar2 = `# Daftar PERAN_ID yang tersedia:`;
    const daftarPeran = peranList.map(p => `# ${p.id} = ${p.nama}`).join('\n');
    const contoh = '# Contoh: 2311210001,true,1';
    const csvContent = [komentar1, komentar2, daftarPeran, contoh, '', header, ''].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="template_peserta_kegiatan_${kegiatanId}.csv"`);
    res.send(csvContent);

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

    const kegiatanId = parseInt(req.params.kegiatanId as string);

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
    const kegiatanId = parseInt(req.params.kegiatanId as string);

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
