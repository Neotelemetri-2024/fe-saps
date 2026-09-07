"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hapusPesertaUKM = exports.hapusPeserta = exports.tambahPesertaManual = exports.cariMahasiswaPeserta = exports.submitPoinPesertaUKM = exports.updatePesertaUKM = exports.downloadTemplatePesertaUKM = exports.importPesertaUKM = exports.getManajemenPeserta = exports.getDaftarKegiatanUKM = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const prisma_1 = __importDefault(require("../../lib/prisma"));
const poin_service_1 = require("../../services/poin.service");
// Helper: dapatkan organisasiId operator yang sedang login
async function getOrganisasiOperator(userId) {
    const operator = await prisma_1.default.organisasiOperator.findFirst({
        where: { userId },
        include: { organisasi: true }
    });
    return operator;
}
function getEffectiveRole(req) {
    if (!req.user)
        return undefined;
    if (req.user.peran === 'staff' && req.user.jabatan) {
        return req.user.jabatan;
    }
    return req.user.jabatan || req.user.peran;
}
// Helper: Cek apakah user memiliki peran Admin (Ditmawa/Fakultas) atau Superadmin (Pimpinan Ditmawa/Utama)
function checkIsAdminOrSuper(req) {
    const role = getEffectiveRole(req);
    return (role === 'admin_ditmawa' ||
        role === 'admin_fakultas' ||
        role === 'pimpinan_ditmawa' ||
        role === 'pimpinan_utama');
}
function checkIsSuperAdmin(req) {
    const role = getEffectiveRole(req);
    return role === 'pimpinan_ditmawa' || role === 'pimpinan_utama';
}
// ==================== DAFTAR KEGIATAN UKM ====================
// GET /api/ukm/kegiatan
// Daftar kegiatan milik UKM + statistik cards + filter/search
const getDaftarKegiatanUKM = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const isAdminOrSuper = checkIsAdminOrSuper(req);
        let operator = null;
        let organisasiId;
        if (!isAdminOrSuper) {
            operator = await getOrganisasiOperator(BigInt(userId));
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            organisasiId = operator.organisasiId;
        }
        else if (req.query.organisasiId) {
            organisasiId = parseInt(req.query.organisasiId);
            operator = await prisma_1.default.organisasi.findUnique({ where: { id: organisasiId } });
        }
        const { search, skalaId, kategoriId, status, page = '1', limit = '10' } = req.query;
        // Build where clause
        const where = {};
        if (organisasiId) {
            where.organisasiId = organisasiId;
        }
        if (search) {
            where.nama = { contains: search };
        }
        if (skalaId) {
            where.skalaId = parseInt(skalaId);
        }
        if (kategoriId) {
            where.kategoriId = parseInt(kategoriId);
        }
        if (status) {
            where.status = status;
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const total = await prisma_1.default.kegiatan.count({ where });
        const kegiatan = await prisma_1.default.kegiatan.findMany({
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
        const whereStats = {};
        if (organisasiId) {
            whereStats.organisasiId = organisasiId;
        }
        const [pendingCount, disetujuiCount, statusCount, eventAktifCount] = await Promise.all([
            prisma_1.default.kegiatan.count({
                where: { ...whereStats, status: { in: ['diajukan', 'terverifikasi', 'perlu_revisi'] } }
            }),
            prisma_1.default.kegiatan.count({
                where: { ...whereStats, status: { in: ['disetujui', 'terpublikasi'] } }
            }),
            prisma_1.default.kegiatan.count({ where: whereStats }),
            prisma_1.default.kegiatan.count({
                where: {
                    ...whereStats,
                    status: { in: ['disetujui', 'terpublikasi'] },
                    tanggalSelesai: { gte: currentDate }
                }
            })
        ]);
        // Cek apakah ada kegiatan yang perlu submit peserta (sudah disetujui tapi belum ada klaim)
        const kegiatanPerluSubmit = await prisma_1.default.kegiatan.findMany({
            where: {
                ...whereStats,
                status: { in: ['disetujui', 'terpublikasi'] },
                tanggalSelesai: { lt: currentDate }
            },
            select: { id: true, nama: true }
        });
        const kegiatanBelumTercatat = [];
        for (const k of kegiatanPerluSubmit) {
            const klaimCount = await prisma_1.default.klaimPoin.count({
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
                    id: organisasiId || null,
                    nama: operator?.organisasi?.nama || operator?.nama || 'Seluruh Ormawa'
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
    }
    catch (error) {
        next(error);
    }
};
exports.getDaftarKegiatanUKM = getDaftarKegiatanUKM;
// ==================== MANAJEMEN PESERTA KEGIATAN ====================
// GET /api/ukm/kegiatan/:kegiatanId/peserta
// Menampilkan daftar peserta + statistik (total terdaftar, hadir, tidak hadir)
const getManajemenPeserta = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const kegiatanId = parseInt((req.params.kegiatanId || req.params.id));
        const { search, filter, page = '1', limit = '10' } = req.query;
        // Admin Ditmawa/Fakultas dan Pimpinan Ditmawa (Superadmin) boleh mengelola peserta
        const isSuperAdmin = checkIsSuperAdmin(req);
        const isAdmin = checkIsAdminOrSuper(req);
        let kegiatan;
        if (isAdmin) {
            kegiatan = await prisma_1.default.kegiatan.findUnique({
                where: { id: kegiatanId },
                include: {
                    kategori: { select: { nama: true } },
                    skala: { select: { nama: true } },
                    organisasi: { select: { nama: true } }
                }
            });
        }
        else {
            // Validasi: kegiatan harus milik UKM ini
            const operator = await getOrganisasiOperator(BigInt(userId));
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            kegiatan = await prisma_1.default.kegiatan.findFirst({
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
        // Manajemen peserta oleh Admin/Pimpinan
        if (isAdmin) {
            const allowedStatuses = isSuperAdmin
                ? ['draft', 'diajukan', 'disetujui', 'terpublikasi', 'berlangsung', 'selesai']
                : ['disetujui', 'terpublikasi', 'berlangsung', 'selesai'];
            if (!allowedStatuses.includes(kegiatan.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Kegiatan masih berstatus '${kegiatan.status}'. Manajemen peserta tidak dapat dilakukan pada status ini.`
                });
            }
        }
        // Cek status submit
        const sudahSubmit = await prisma_1.default.klaimPoin.count({
            where: { partisipasi: { kegiatanId }, status: 'disetujui' }
        });
        // Build where untuk partisipasi
        const wherePartisipasi = { kegiatanId };
        if (filter === 'hadir')
            wherePartisipasi.kehadiran = true;
        else if (filter === 'tidak_hadir')
            wherePartisipasi.kehadiran = false;
        if (search) {
            wherePartisipasi.OR = [
                { mahasiswa: { nim: { contains: search } } },
                { mahasiswa: { user: { nama: { contains: search } } } }
            ];
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const [totalPartisipasi, totalHadir, totalTidakHadir] = await Promise.all([
            prisma_1.default.partisipasi.count({ where: { kegiatanId } }),
            prisma_1.default.partisipasi.count({ where: { kegiatanId, kehadiran: true } }),
            prisma_1.default.partisipasi.count({ where: { kegiatanId, kehadiran: false } })
        ]);
        const total = await prisma_1.default.partisipasi.count({ where: wherePartisipasi });
        const peserta = await prisma_1.default.partisipasi.findMany({
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
        const peranTersedia = await prisma_1.default.mpPeran.findMany({
            where: { kategoriId: kegiatan.kategoriId },
            orderBy: { urutan: 'asc' }
        });
        const tabelPeserta = peserta.map((p, i) => ({
            no: skip + i + 1,
            partisipasiId: p.id.toString(),
            nim: p.mahasiswa?.nim || '-',
            namaMahasiswa: p.mahasiswa?.user?.nama || '-',
            fakultas: p.mahasiswa?.prodi?.fakultas?.nama || '-',
            programStudi: p.mahasiswa?.prodi?.nama || '-',
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
    }
    catch (error) {
        next(error);
    }
};
exports.getManajemenPeserta = getManajemenPeserta;
// ==================== IMPORT PESERTA ====================
// POST /api/ukm/kegiatan/:kegiatanId/peserta/import
// Import peserta via file CSV
const importPesertaUKM = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const kegiatanId = parseInt((req.params.kegiatanId || req.params.id));
        // Validasi file
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File CSV wajib diupload.' });
        }
        // Cek kegiatan — untuk admin/pimpinan, tidak perlu cek operator
        let kegiatan;
        const isSuperAdmin = checkIsSuperAdmin(req);
        const isAdmin = checkIsAdminOrSuper(req);
        if (isAdmin) {
            kegiatan = await prisma_1.default.kegiatan.findUnique({ where: { id: kegiatanId } });
            if (!kegiatan) {
                return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
            }
        }
        else {
            const operator = await getOrganisasiOperator(BigInt(userId));
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            kegiatan = await prisma_1.default.kegiatan.findFirst({
                where: { id: kegiatanId, organisasiId: operator.organisasiId }
            });
            if (!kegiatan) {
                return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
            }
        }
        // Status kegiatan
        const allowedStatuses = isSuperAdmin
            ? ['draft', 'diajukan', 'disetujui', 'terpublikasi', 'berlangsung', 'selesai']
            : ['disetujui', 'terpublikasi', 'berlangsung', 'selesai'];
        if (!allowedStatuses.includes(kegiatan.status)) {
            return res.status(400).json({
                success: false,
                message: `Kegiatan masih berstatus '${kegiatan.status}'. Import peserta tidak dapat dilakukan pada status ini.`
            });
        }
        // Cek belum submit
        const sudahSubmit = await prisma_1.default.klaimPoin.count({
            where: { partisipasi: { kegiatanId }, status: 'disetujui' }
        });
        if (sudahSubmit > 0) {
            return res.status(400).json({
                success: false,
                message: 'Peserta sudah di-submit untuk klaim poin. Gunakan tombol Edit jika ingin mengubah.'
            });
        }
        // Ambil daftar peran untuk kategori kegiatan ini
        const peranList = await prisma_1.default.mpPeran.findMany({
            where: kegiatan.kategoriId ? { kategoriId: kegiatan.kategoriId } : {},
            orderBy: { urutan: 'asc' }
        });
        const findPeranId = (peranInput) => {
            if (peranInput === undefined || peranInput === null)
                return null;
            const inputStr = String(peranInput).trim();
            if (!inputStr)
                return null;
            // 1. Jika berupa ID Angka (misal: 21, 22)
            if (!isNaN(Number(inputStr))) {
                const numId = Number(inputStr);
                const matchById = peranList.find(p => p.id === numId);
                if (matchById)
                    return matchById.id;
            }
            // 2. Jika berupa Nama Peran (misal: "JUARA 1/ EMAS", "PESERTA") - Exact Match
            const lower = inputStr.toLowerCase();
            const exactMatch = peranList.find(p => p.nama.toLowerCase() === lower);
            if (exactMatch)
                return exactMatch.id;
            // 3. Partial Match (misal: "JUARA 1" mencocokkan "JUARA 1/ EMAS")
            const partialMatch = peranList.find(p => p.nama.toLowerCase().includes(lower) || lower.includes(p.nama.toLowerCase()));
            if (partialMatch)
                return partialMatch.id;
            return null;
        };
        const peserta = [];
        let isExcelParsed = false;
        const parseHadir = (raw) => {
            if (raw === undefined || raw === null)
                return null;
            const str = String(raw).trim().toLowerCase();
            if (!str)
                return null;
            if (['true', '1', 'ya', 'yes', 'hadir', 'h'].includes(str))
                return true;
            if (['false', '0', 'tidak', 'no', 'tidak hadir', 'alpa', 'th'].includes(str))
                return false;
            return null;
        };
        // Coba parse sebagai file Excel (.xlsx)
        try {
            const workbook = new exceljs_1.default.Workbook();
            await workbook.xlsx.load(req.file.buffer);
            const worksheet = workbook.getWorksheet('Data Peserta') || workbook.worksheets[0];
            if (worksheet) {
                worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
                    if (rowNumber === 1)
                        return; // Skip header
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
                    if (!nim || nim.startsWith('#') || nim.toLowerCase() === 'nim')
                        return;
                    const nama = String(cellNama.text || cellNama.value || '').trim();
                    const hadir = parseHadir(cellHadir.text || cellHadir.value);
                    const peranVal = cellPeran.text || cellPeran.value;
                    const peranId = findPeranId(peranVal);
                    peserta.push({ nim, nama, hadir, peranId });
                });
                isExcelParsed = peserta.length > 0;
            }
        }
        catch (err) {
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
                if (!nim || nim.toLowerCase() === 'nim')
                    continue;
                const nama = (cols[1] ?? '').trim().replace(/^"/, '').replace(/"$/, '');
                const hadir = parseHadir((cols[2] ?? '').replace(/^"/, '').replace(/"$/, ''));
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
        const mahasiswaList = await prisma_1.default.mahasiswa.findMany({
            where: { nim: { in: nimList } },
            include: {
                user: { select: { nama: true } },
                prodi: { include: { fakultas: { select: { nama: true } } } }
            }
        });
        const nimToMahasiswa = new Map(mahasiswaList.map(m => [m.nim, m]));
        const imported = [];
        const errors = [];
        const autoClaimedIds = [];
        await prisma_1.default.$transaction(async (tx) => {
            for (const p of peserta) {
                let mahasiswa = nimToMahasiswa.get(p.nim);
                // Jika NIM belum terdaftar, tolak dan beri pesan error
                if (!mahasiswa) {
                    errors.push({ nim: p.nim, error: 'Belum terdaftar di sistem SAPS. Mahasiswa harus login/register terlebih dahulu sebelum bisa di-import.' });
                    continue;
                }
                // Jika relasi user tidak lengkap (orphan record)
                if (!mahasiswa.user) {
                    errors.push({ nim: p.nim, error: 'Data akun mahasiswa tidak lengkap (user tidak ditemukan). Hubungi admin.' });
                    continue;
                }
                try {
                    let statusPartisipasi = 'terdaftar';
                    if (p.hadir === true)
                        statusPartisipasi = 'hadir';
                    else if (p.hadir === false)
                        statusPartisipasi = 'tidak_hadir';
                    const part = await tx.partisipasi.upsert({
                        where: {
                            kegiatanId_mahasiswaId: {
                                kegiatanId,
                                mahasiswaId: mahasiswa.userId
                            }
                        },
                        update: {
                            kehadiran: p.hadir,
                            peranVerifId: p.peranId ?? null,
                            status: statusPartisipasi
                        },
                        create: {
                            kegiatanId,
                            mahasiswaId: mahasiswa.userId,
                            kehadiran: p.hadir,
                            peranVerifId: p.peranId ?? null,
                            status: statusPartisipasi
                        }
                    });
                    if (p.hadir === true && p.peranId) {
                        autoClaimedIds.push(part.id);
                    }
                    imported.push({
                        nim: p.nim,
                        nama: mahasiswa?.user?.nama || p.nama || '-',
                        status: p.hadir === true ? 'hadir' : (p.hadir === false ? 'tidak_hadir' : 'terdaftar')
                    });
                }
                catch (err) {
                    errors.push({ nim: p.nim, error: `Gagal menyimpan: ${err.message}` });
                }
            }
        });
        // Auto-claim di luar transaksi jika syarat terpenuhi
        for (const partId of autoClaimedIds) {
            try {
                await (0, poin_service_1.cairkanPoinPartisipasi)(partId);
            }
            catch (err) {
                console.error(`[importPesertaUKM] Auto-claim gagal untuk partisipasi ${partId}:`, err);
            }
        }
        res.status(200).json({
            success: true,
            message: `Berhasil mengimport ${imported.length} dari ${peserta.length} peserta.`,
            data: {
                imported,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.importPesertaUKM = importPesertaUKM;
// ==================== DOWNLOAD TEMPLATE ====================
// GET /api/ukm/kegiatan/:kegiatanId/peserta/template
const downloadTemplatePesertaUKM = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const kegiatanId = parseInt((req.params.kegiatanId || req.params.id));
        // Untuk route admin/pimpinan (peserta.routes.ts), tidak perlu cek operator
        let namaKegiatan = 'Kegiatan';
        let kategoriId = null;
        const isAdmin = checkIsAdminOrSuper(req);
        if (isAdmin) {
            const kegiatan = await prisma_1.default.kegiatan.findUnique({
                where: { id: kegiatanId },
                select: { nama: true, kategoriId: true }
            });
            if (!kegiatan) {
                return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
            }
            namaKegiatan = kegiatan.nama;
            kategoriId = kegiatan.kategoriId;
        }
        else {
            const operator = await getOrganisasiOperator(BigInt(userId));
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            const kegiatan = await prisma_1.default.kegiatan.findFirst({
                where: { id: kegiatanId, organisasiId: operator.organisasiId },
                select: { nama: true, kategoriId: true }
            });
            if (!kegiatan) {
                return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan.' });
            }
            namaKegiatan = kegiatan.nama;
            kategoriId = kegiatan.kategoriId;
        }
        const peranList = await prisma_1.default.mpPeran.findMany({
            where: kategoriId ? { kategoriId } : {},
            orderBy: { urutan: 'asc' }
        });
        const workbook = new exceljs_1.default.Workbook();
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
    }
    catch (error) {
        next(error);
    }
};
exports.downloadTemplatePesertaUKM = downloadTemplatePesertaUKM;
// ==================== UPDATE PESERTA (EDIT) ====================
// PUT /api/ukm/kegiatan/:kegiatanId/peserta
// Update kehadiran & peran peserta setelah submit (mode Edit)
const updatePesertaUKM = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const kegiatanId = parseInt((req.params.kegiatanId || req.params.id));
        const isSuperAdmin = checkIsSuperAdmin(req);
        const isAdmin = checkIsAdminOrSuper(req);
        let kegiatan;
        if (isAdmin) {
            kegiatan = await prisma_1.default.kegiatan.findUnique({
                where: { id: kegiatanId }
            });
        }
        else {
            const operator = await getOrganisasiOperator(BigInt(userId));
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            kegiatan = await prisma_1.default.kegiatan.findFirst({
                where: { id: kegiatanId, organisasiId: operator.organisasiId }
            });
        }
        if (!kegiatan) {
            return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
        }
        // Manajemen peserta oleh Admin/Pimpinan
        if (isAdmin) {
            const allowedStatuses = isSuperAdmin
                ? ['draft', 'diajukan', 'disetujui', 'terpublikasi', 'berlangsung', 'selesai']
                : ['disetujui', 'terpublikasi', 'berlangsung', 'selesai'];
            if (!allowedStatuses.includes(kegiatan.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Kegiatan masih berstatus '${kegiatan.status}'. Manajemen peserta tidak dapat dilakukan pada status ini.`
                });
            }
        }
        const { peserta } = req.body; // [{ partisipasiId, hadir, peranId }]
        if (!Array.isArray(peserta) || peserta.length === 0) {
            return res.status(400).json({ success: false, message: 'Data peserta tidak boleh kosong.' });
        }
        const autoClaimIds = [];
        await prisma_1.default.$transaction(async (tx) => {
            for (const p of peserta) {
                const pid = BigInt(p.partisipasiId);
                let statusPart = 'terdaftar';
                if (p.hadir === true)
                    statusPart = 'hadir';
                else if (p.hadir === false)
                    statusPart = 'tidak_hadir';
                await tx.partisipasi.update({
                    where: { id: pid },
                    data: {
                        kehadiran: p.hadir !== undefined ? p.hadir : null,
                        peranVerifId: p.peranId ? Number(p.peranId) : null,
                        status: statusPart
                    }
                });
                if (p.hadir === true && p.peranId) {
                    autoClaimIds.push(pid);
                }
            }
        });
        // Auto-claim jika syarat terpenuhi
        for (const pid of autoClaimIds) {
            try {
                await (0, poin_service_1.cairkanPoinPartisipasi)(pid);
            }
            catch (err) {
                console.error(`[updatePesertaUKM] Auto-claim gagal untuk ${pid}:`, err);
            }
        }
        res.status(200).json({
            success: true,
            message: `Berhasil mengupdate ${peserta.length} peserta.`
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePesertaUKM = updatePesertaUKM;
// ==================== SUBMIT POIN PESERTA ====================
// POST /api/ukm/kegiatan/:kegiatanId/peserta/submit
// Submit & auto-generate poin untuk semua peserta yang hadir + punya peran
const submitPoinPesertaUKM = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const aktorId = BigInt(userId);
        const kegiatanId = parseInt((req.params.kegiatanId || req.params.id));
        const isSuperAdmin = checkIsSuperAdmin(req);
        const isAdmin = checkIsAdminOrSuper(req);
        let kegiatan;
        if (isAdmin) {
            kegiatan = await prisma_1.default.kegiatan.findUnique({
                where: { id: kegiatanId },
                include: { kegiatanCapaian: true, organisasi: { select: { nama: true } } }
            });
        }
        else {
            const operator = await getOrganisasiOperator(aktorId);
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            kegiatan = await prisma_1.default.kegiatan.findFirst({
                where: { id: kegiatanId, organisasiId: operator.organisasiId },
                include: { kegiatanCapaian: true, organisasi: { select: { nama: true } } }
            });
        }
        if (!kegiatan) {
            return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
        }
        const penyelenggaraNama = kegiatan.organisasi?.nama || kegiatan.nama;
        // Klaim poin oleh Admin/Pimpinan
        if (isAdmin) {
            const allowedStatuses = isSuperAdmin
                ? ['draft', 'diajukan', 'disetujui', 'terpublikasi', 'berlangsung', 'selesai']
                : ['disetujui', 'terpublikasi', 'berlangsung', 'selesai'];
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
        const pesertaHadir = await prisma_1.default.partisipasi.findMany({
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
        const errors = [];
        let dibuat = 0;
        let diperbarui = 0;
        let tetap = 0;
        let dibatalkan = 0;
        // Poin sah hanya setelah Dosen PA menyetujui — di sini hanya siapkan KlaimPoin (draft).
        await prisma_1.default.$transaction(async (tx) => {
            for (const partisipasi of pesertaHadir) {
                const peranId = partisipasi.peranVerifId;
                // Validasi matriks tetap dicek agar mahasiswa tidak minta PA untuk peran tanpa poin
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
                if (existingKlaim) {
                    const samaPeran = existingKlaim.peranUsulanId === peranId;
                    const sudahAdaPoinSah = existingKlaim.perolehanPoin?.status === 'sah';
                    // Sudah siap / sudah pernah disetujui PA dengan peran sama → anggap tanpa perubahan
                    if (samaPeran && (existingKlaim.status === 'draft' || sudahAdaPoinSah)) {
                        tetap++;
                        continue;
                    }
                    await tx.klaimPoin.update({
                        where: { id: existingKlaim.id },
                        data: {
                            peranUsulanId: peranId,
                            // Jangan finalize di sini — tunggu Dosen PA
                            status: sudahAdaPoinSah ? existingKlaim.status : 'draft',
                            validatorId: aktorId,
                            alasan: 'Peran disiapkan oleh penyelenggara; menunggu persetujuan Dosen PA'
                        }
                    });
                    await tx.notifikasi.create({
                        data: {
                            userId: partisipasi.mahasiswaId,
                            judul: 'Siap Minta Persetujuan Dosen PA',
                            isi: `Peran Anda pada kegiatan "${kegiatan.nama}" telah diperbarui oleh ${penyelenggaraNama}. Ajukan persetujuan Dosen PA di Riwayat Kegiatan Internal agar poin dapat dicatat.`,
                            refType: 'klaim_poin',
                            refId: existingKlaim.id
                        }
                    });
                    diperbarui++;
                    continue;
                }
                const klaim = await tx.klaimPoin.create({
                    data: {
                        partisipasiId: partisipasi.id,
                        peranUsulanId: peranId,
                        status: 'draft',
                        validatorId: aktorId,
                        alasan: 'Siap diajukan: menunggu persetujuan Dosen PA'
                    }
                });
                await tx.notifikasi.create({
                    data: {
                        userId: partisipasi.mahasiswaId,
                        judul: 'Siap Minta Persetujuan Dosen PA',
                        isi: `Kehadiran dan peran Anda pada kegiatan "${kegiatan.nama}" telah dicatat oleh ${penyelenggaraNama}. Ajukan persetujuan Dosen PA di Riwayat Kegiatan Internal agar poin dapat dicatat.`,
                        refType: 'klaim_poin',
                        refId: klaim.id
                    }
                });
                dibuat++;
            }
            // Peserta yang kehadiran/perannya dicabut: batalkan perolehan aktif (jika ada dari data lama)
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
                if (!klaim.perolehanPoin)
                    continue;
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
            dibuat > 0 ? `${dibuat} peserta siap minta PA` : null,
            diperbarui > 0 ? `${diperbarui} peserta diperbarui` : null,
            tetap > 0 ? `${tetap} peserta tanpa perubahan` : null,
            dibatalkan > 0 ? `${dibatalkan} poin dibatalkan` : null,
            errors.length > 0 ? `${errors.length} gagal` : null
        ].filter(Boolean).join(', ');
        res.status(200).json({
            success: true,
            message: `Submit selesai: ${ringkasan}. Poin akan tercatat setelah Dosen PA menyetujui.`,
            data: {
                totalDibuat: dibuat,
                totalDiperbarui: diperbarui,
                totalTanpaPerubahan: tetap,
                totalDibatalkan: dibatalkan,
                totalGagal: errors.length,
                errors: errors.length > 0 ? errors : undefined
            }
        });
    }
    catch (error) {
        console.error('[submitPoinPesertaUKM]', error?.stack || error?.message || error);
        next(error);
    }
};
exports.submitPoinPesertaUKM = submitPoinPesertaUKM;
// ==================== CARI MAHASISWA UNTUK PESERTA ====================
// GET /api/kegiatan/:kegiatanId/peserta/search?q=...
// Cari mahasiswa (NIM/nama) yang belum terdaftar sebagai peserta kegiatan ini.
const cariMahasiswaPeserta = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const kegiatanId = parseInt((req.params.kegiatanId || req.params.id));
        const q = String(req.query.q || '').trim();
        if (!q || q.length < 2) {
            return res.status(200).json({ success: true, data: [] });
        }
        const isAdmin = checkIsAdminOrSuper(req);
        let kegiatan;
        if (isAdmin) {
            kegiatan = await prisma_1.default.kegiatan.findUnique({ where: { id: kegiatanId } });
        }
        else {
            const operator = await getOrganisasiOperator(BigInt(userId));
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            kegiatan = await prisma_1.default.kegiatan.findFirst({
                where: { id: kegiatanId, organisasiId: operator.organisasiId }
            });
        }
        if (!kegiatan) {
            return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
        }
        const terdaftar = await prisma_1.default.partisipasi.findMany({
            where: { kegiatanId },
            select: { mahasiswaId: true }
        });
        const terdaftarIds = terdaftar.map((p) => p.mahasiswaId);
        const mahasiswa = await prisma_1.default.mahasiswa.findMany({
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
            nama: m.user?.nama || '-',
            fakultas: m.prodi?.fakultas?.nama || '-',
            prodi: m.prodi?.nama || '-'
        }));
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.error('[cariMahasiswaPeserta]', error?.stack || error?.message || error);
        next(error);
    }
};
exports.cariMahasiswaPeserta = cariMahasiswaPeserta;
// ==================== TAMBAH PESERTA MANUAL ====================
// POST /api/kegiatan/:kegiatanId/peserta  body { mahasiswaId }
// Tambah mahasiswa menjadi peserta kegiatan secara manual (upsert partisipasi).
const tambahPesertaManual = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const kegiatanId = parseInt((req.params.kegiatanId || req.params.id));
        const mahasiswaIdRaw = req.body?.mahasiswaId;
        const mahasiswaId = BigInt(String(mahasiswaIdRaw).trim());
        if (!mahasiswaIdRaw || Number.isNaN(Number(mahasiswaIdRaw))) {
            return res.status(400).json({ success: false, message: 'ID mahasiswa tidak valid.' });
        }
        const isSuperAdmin = checkIsSuperAdmin(req);
        const isAdmin = checkIsAdminOrSuper(req);
        let kegiatan;
        if (isAdmin) {
            kegiatan = await prisma_1.default.kegiatan.findUnique({ where: { id: kegiatanId } });
        }
        else {
            const operator = await getOrganisasiOperator(BigInt(userId));
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            kegiatan = await prisma_1.default.kegiatan.findFirst({
                where: { id: kegiatanId, organisasiId: operator.organisasiId }
            });
        }
        if (!kegiatan) {
            return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
        }
        if (isAdmin) {
            const allowedStatuses = isSuperAdmin
                ? ['draft', 'diajukan', 'disetujui', 'terpublikasi', 'berlangsung', 'selesai']
                : ['disetujui', 'terpublikasi', 'berlangsung', 'selesai'];
            if (!allowedStatuses.includes(kegiatan.status)) {
                return res.status(400).json({
                    success: false,
                    message: `Kegiatan masih berstatus '${kegiatan.status}'. Manajemen peserta hanya bisa dilakukan setelah kegiatan disetujui.`
                });
            }
        }
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
            where: { userId: mahasiswaId },
            include: {
                user: { select: { nama: true } },
                prodi: { include: { fakultas: { select: { nama: true } } } }
            }
        });
        if (!mahasiswa) {
            return res.status(404).json({ success: false, message: 'Mahasiswa tidak ditemukan di sistem SAPS.' });
        }
        const { peranId, hadir, peranVerifId } = req.body;
        let parsedHadir = null;
        if (hadir !== undefined && hadir !== null && hadir !== '') {
            parsedHadir = hadir === true || hadir === 'true' || hadir === 1 || hadir === '1';
        }
        const finalPeranId = peranVerifId ? parseInt(peranVerifId) : (peranId ? parseInt(peranId) : null);
        let statusPartisipasi = 'terdaftar';
        if (parsedHadir === true)
            statusPartisipasi = 'hadir';
        else if (parsedHadir === false)
            statusPartisipasi = 'tidak_hadir';
        const part = await prisma_1.default.partisipasi.upsert({
            where: { kegiatanId_mahasiswaId: { kegiatanId, mahasiswaId } },
            update: {
                ...(parsedHadir !== null ? { kehadiran: parsedHadir, status: statusPartisipasi } : {}),
                ...(finalPeranId !== null ? { peranVerifId: finalPeranId } : {})
            },
            create: {
                kegiatanId,
                mahasiswaId,
                kehadiran: parsedHadir,
                peranVerifId: finalPeranId,
                status: statusPartisipasi
            }
        });
        if (parsedHadir === true && finalPeranId) {
            try {
                await (0, poin_service_1.cairkanPoinPartisipasi)(part.id);
            }
            catch (err) {
                console.error('[tambahPesertaManual] Auto-claim gagal:', err);
            }
        }
        res.status(201).json({
            success: true,
            message: `${mahasiswa.user.nama} berhasil ditambahkan sebagai peserta.`,
            data: {
                userId: mahasiswa.userId.toString(),
                nim: mahasiswa.nim,
                nama: mahasiswa.user?.nama || '-',
                fakultas: mahasiswa.prodi?.fakultas?.nama || '-',
                prodi: mahasiswa.prodi?.nama || '-'
            }
        });
    }
    catch (error) {
        console.error('[tambahPesertaManual]', error?.stack || error?.message || error);
        next(error);
    }
};
exports.tambahPesertaManual = tambahPesertaManual;
// ==================== HAPUS PESERTA ====================
// DELETE /api/kegiatan/:id/peserta/:partisipasiId
// DELETE /api/ukm/kegiatan/:kegiatanId/peserta/:partisipasiId
const hapusPeserta = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        const kegiatanId = parseInt((req.params.kegiatanId || req.params.id));
        const partisipasiIdRaw = req.params.partisipasiId || req.body?.partisipasiId || req.query?.partisipasiId;
        if (!partisipasiIdRaw) {
            return res.status(400).json({ success: false, message: 'ID partisipasi/peserta tidak valid.' });
        }
        const isSuperAdmin = checkIsSuperAdmin(req);
        const isAdmin = checkIsAdminOrSuper(req);
        let kegiatan;
        if (isAdmin) {
            kegiatan = await prisma_1.default.kegiatan.findUnique({ where: { id: kegiatanId } });
        }
        else {
            const operator = await getOrganisasiOperator(BigInt(userId));
            if (!operator) {
                return res.status(403).json({ success: false, message: 'Anda bukan operator organisasi/UKM manapun.' });
            }
            kegiatan = await prisma_1.default.kegiatan.findFirst({
                where: { id: kegiatanId, organisasiId: operator.organisasiId }
            });
        }
        if (!kegiatan) {
            return res.status(404).json({ success: false, message: 'Kegiatan tidak ditemukan atau bukan milik UKM Anda.' });
        }
        // Cari data partisipasi berdasarkan ID partisipasi atau mahasiswaId
        let partisipasi = await prisma_1.default.partisipasi.findFirst({
            where: {
                id: BigInt(String(partisipasiIdRaw)),
                kegiatanId: kegiatanId,
            },
            include: {
                mahasiswa: {
                    include: { user: { select: { nama: true } } }
                }
            }
        });
        if (!partisipasi) {
            partisipasi = await prisma_1.default.partisipasi.findFirst({
                where: {
                    mahasiswaId: BigInt(String(partisipasiIdRaw)),
                    kegiatanId: kegiatanId,
                },
                include: {
                    mahasiswa: {
                        include: { user: { select: { nama: true } } }
                    }
                }
            });
        }
        if (!partisipasi) {
            return res.status(404).json({ success: false, message: 'Peserta tidak ditemukan pada kegiatan ini.' });
        }
        const namaMahasiswa = partisipasi.mahasiswa?.user?.nama || 'Peserta';
        // Hapus relasi klaimPoin, perolehanPoin, bukti, izinPA, lalu partisipasi
        await prisma_1.default.$transaction(async (tx) => {
            const klaim = await tx.klaimPoin.findUnique({
                where: { partisipasiId: partisipasi.id },
                include: { perolehanPoin: true }
            });
            if (klaim) {
                if (klaim.perolehanPoin) {
                    await tx.perolehanDetail.deleteMany({
                        where: { perolehanPoinId: klaim.perolehanPoin.id }
                    });
                    await tx.perolehanPoin.delete({
                        where: { id: klaim.perolehanPoin.id }
                    });
                }
                await tx.bukti.deleteMany({
                    where: { klaimPoinId: klaim.id }
                });
                await tx.klaimPoin.delete({
                    where: { id: klaim.id }
                });
            }
            await tx.izinPA.deleteMany({
                where: { partisipasiId: partisipasi.id }
            });
            await tx.partisipasi.delete({
                where: { id: partisipasi.id }
            });
        });
        res.json({
            success: true,
            message: `${namaMahasiswa} berhasil dihapus dari daftar peserta.`,
        });
    }
    catch (error) {
        console.error('[hapusPeserta]', error?.stack || error?.message || error);
        next(error);
    }
};
exports.hapusPeserta = hapusPeserta;
exports.hapusPesertaUKM = exports.hapusPeserta;
