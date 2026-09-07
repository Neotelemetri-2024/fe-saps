"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validasiKlaimBulk = exports.validasiKlaim = exports.getKlaimEksternalForVerifikasi = exports.getKlaimForValidasi = exports.getKlaimById = exports.getMyKlaim = exports.createKlaim = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const zod_1 = require("zod");
const auditLog_1 = require("../../lib/auditLog");
// ==================== VALIDASI ====================
const createKlaimSchema = zod_1.z.object({
    peranUsulanId: zod_1.z.number().int().positive(),
    bukti: zod_1.z
        .array(zod_1.z.object({
        tipe: zod_1.z.enum(["pdf", "link"]),
        url: zod_1.z.string().min(3),
    }))
        .optional(),
});
const validasiKlaimSchema = zod_1.z.object({
    keputusan: zod_1.z.enum(["disetujui", "perlu_revisi", "ditolak"]),
    alasan: zod_1.z.string().optional(),
    peranVerifId: zod_1.z.number().int().positive().optional(), // crosscheck peran
});
const validasiKlaimBulkSchema = zod_1.z.object({
    klaimIds: zod_1.z.array(zod_1.z.number().or(zod_1.z.string().transform(v => Number(v)))).min(1),
    keputusan: zod_1.z.enum(["disetujui", "perlu_revisi", "ditolak"]),
    alasan: zod_1.z.string().optional(),
});
// ==================== KLAIM POIN ====================
// POST /api/klaim — Mahasiswa ajukan klaim poin atas partisipasi
const createKlaim = async (req, res) => {
    try {
        const mahasiswaId = BigInt(req.user.id);
        const partisipasiId = BigInt(req.body.partisipasiId);
        const body = createKlaimSchema.parse(req.body);
        // Cek partisipasi valid + izin PA sudah disetujui [BR-019]
        const partisipasi = await prisma_1.default.partisipasi.findUnique({
            where: { id: partisipasiId },
            include: {
                kegiatan: true,
                izinPA: { where: { status: "disetujui" }, take: 1 },
            },
        });
        if (!partisipasi) {
            res
                .status(404)
                .json({ success: false, message: "Partisipasi tidak ditemukan" });
            return;
        }
        if (partisipasi.mahasiswaId !== mahasiswaId) {
            res
                .status(403)
                .json({ success: false, message: "Bukan partisipasi Anda" });
            return;
        }
        // Gate: izin PA harus sudah disetujui [BR-019]
        // Untuk kegiatan eksternal, izin bisa di titik klaim [BR-015]
        if (partisipasi.kegiatan.asal !== "eksternal" &&
            partisipasi.izinPA.length === 0) {
            res.status(400).json({
                success: false,
                message: "Izin PA belum disetujui. Klaim tidak bisa dilakukan [BR-019]",
            });
            return;
        }
        // Tentukan validator berdasarkan asal kegiatan [BR-018]
        let validatorId = null;
        if (partisipasi.kegiatan.organisasiId) {
            // Kegiatan internal (UKM/UKMF) — validator = operator organisasi
            const operator = await prisma_1.default.organisasiOperator.findFirst({
                where: { organisasiId: partisipasi.kegiatan.organisasiId },
            });
            validatorId = operator?.userId ?? null;
        }
        // Jika tidak ada organisasi (universitas/eksternal) → validator = Admin Ditmawa (diisi saat validasi)
        // Buat klaim + bukti [BR-020 lapis 2: UNIQUE partisipasiId]
        const klaim = await prisma_1.default.klaimPoin.create({
            data: {
                partisipasiId,
                peranUsulanId: body.peranUsulanId,
                status: "menunggu_validasi",
                validatorId,
                bukti: body.bukti
                    ? {
                        create: body.bukti.map((b) => ({ tipe: b.tipe, url: b.url })),
                    }
                    : undefined,
            },
            include: { bukti: true },
        });
        await (0, auditLog_1.logAudit)({
            entitas: "klaim_poin",
            entitasId: klaim.id,
            aksi: "create",
            statusBaru: "menunggu_validasi",
            aktorId: mahasiswaId,
        });
        res.status(201).json({ success: true, data: klaim });
    }
    catch (error) {
        if (error?.code === "P2002") {
            res.status(409).json({
                success: false,
                message: "Klaim sudah pernah diajukan untuk partisipasi ini [BR-020]",
            });
        }
        else if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validasi gagal",
                errors: error.issues,
            });
        }
        else {
            console.error(error);
            res
                .status(500)
                .json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    }
};
exports.createKlaim = createKlaim;
// GET /api/klaim/saya?mahasiswaId=X — Daftar klaim milik mahasiswa
const getMyKlaim = async (req, res) => {
    try {
        const mahasiswaId = BigInt(req.query.mahasiswaId);
        const data = await prisma_1.default.klaimPoin.findMany({
            where: { partisipasi: { mahasiswaId } },
            include: {
                partisipasi: {
                    include: {
                        kegiatan: { include: { kategori: true, skala: true } },
                    },
                },
                peranUsulan: true,
                bukti: true,
                perolehanPoin: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};
exports.getMyKlaim = getMyKlaim;
// GET /api/klaim/:id — Detail klaim untuk halaman Detail
const getKlaimById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await prisma_1.default.klaimPoin.findUnique({
            where: { id: BigInt(id) },
            include: {
                partisipasi: {
                    include: {
                        kegiatan: {
                            include: {
                                kategori: true,
                                skala: true,
                                kegiatanCapaian: {
                                    include: {
                                        subCapaian: {
                                            include: {
                                                capaian: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        mahasiswa: {
                            include: {
                                user: { select: { nama: true, email: true } },
                                prodi: { select: { nama: true } },
                            },
                        },
                        peranVerif: true,
                    },
                },
                peranUsulan: true,
                bukti: true,
                perolehanPoin: true,
                validator: { select: { nama: true } },
            },
        });
        if (!data) {
            res
                .status(404)
                .json({ success: false, message: "Klaim tidak ditemukan" });
            return;
        }
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};
exports.getKlaimById = getKlaimById;
// GET /api/klaim/validasi — Daftar klaim menunggu validasi (Operator UKM / Admin) dengan filter & pagination
const getKlaimForValidasi = async (req, res) => {
    try {
        const { search, status, asal, kategoriId, page = '1', limit = '10' } = req.query;
        const where = {};
        if (status && status !== 'semua') {
            where.status = status;
        }
        else {
            where.status = 'menunggu_validasi';
        }
        if (asal) {
            where.partisipasi = { kegiatan: { asal: asal } };
        }
        if (kategoriId) {
            where.partisipasi = {
                ...where.partisipasi,
                kegiatan: { ...where.partisipasi?.kegiatan, kategoriId: Number(kategoriId) },
            };
        }
        if (search) {
            where.OR = [
                { partisipasi: { kegiatan: { nama: { contains: search } } } },
                { partisipasi: { mahasiswa: { user: { nama: { contains: search } } } } },
            ];
        }
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const total = await prisma_1.default.klaimPoin.count({ where });
        const data = await prisma_1.default.klaimPoin.findMany({
            where,
            include: {
                partisipasi: {
                    include: {
                        kegiatan: { include: { kategori: true, skala: true } },
                        mahasiswa: {
                            include: {
                                user: { select: { nama: true, email: true } },
                                prodi: { select: { nama: true } },
                            },
                        },
                        peranVerif: true,
                    },
                },
                peranUsulan: true,
                bukti: true,
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        });
        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getKlaimForValidasi = getKlaimForValidasi;
// GET /api/klaim/verifikasi-eksternal — Daftar klaim poin kegiatan EKSTERNAL untuk Pimpinan Ditmawa
// Kolom: MAHASISWA (nama, NIM, prodi), KEGIATAN, KATEGORI, PERAN, TANGGAL, INFO PENYELENGGARA, STATUS
const getKlaimEksternalForVerifikasi = async (req, res) => {
    try {
        const { search, kategoriId, skalaId, status, tahun, page = '1', limit = '10' } = req.query;
        const where = {
            partisipasi: {
                kegiatan: {
                    asal: 'eksternal',
                },
            },
        };
        // Filter status
        if (status && status !== 'semua') {
            where.status = status;
        }
        else {
            where.status = { in: ['menunggu_pimpinan', 'disetujui', 'ditolak'] };
        }
        // Filter kategori
        if (kategoriId) {
            where.partisipasi.kegiatan.kategoriId = Number(kategoriId);
        }
        // Filter skala
        if (skalaId) {
            where.partisipasi.kegiatan.skalaId = Number(skalaId);
        }
        // Filter tahun
        if (tahun) {
            const year = Number(tahun);
            where.partisipasi.kegiatan.tanggalMulai = {
                gte: new Date(`${year}-01-01`),
                lt: new Date(`${year + 1}-01-01`),
            };
        }
        // Pencarian berdasarkan nama kegiatan atau nama mahasiswa
        if (search) {
            where.OR = [
                { partisipasi: { kegiatan: { nama: { contains: search } } } },
                { partisipasi: { mahasiswa: { user: { nama: { contains: search } } } } },
                { partisipasi: { kegiatan: { penyelenggaraExt: { contains: search } } } },
            ];
        }
        // Pagination
        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;
        const total = await prisma_1.default.klaimPoin.count({ where });
        const data = await prisma_1.default.klaimPoin.findMany({
            where,
            include: {
                partisipasi: {
                    include: {
                        kegiatan: {
                            include: {
                                kategori: true,
                                skala: true,
                                kegiatanCapaian: {
                                    include: { subCapaian: { include: { capaian: true } } },
                                },
                            },
                        },
                        mahasiswa: {
                            include: {
                                user: { select: { id: true, nama: true, email: true } },
                                prodi: { select: { nama: true } },
                            },
                        },
                        peranVerif: true,
                    },
                },
                peranUsulan: true,
                bukti: true,
                validator: { select: { id: true, nama: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limitNum,
        });
        res.json({
            success: true,
            data,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getKlaimEksternalForVerifikasi = getKlaimEksternalForVerifikasi;
// PUT /api/klaim/:id/validasi — Validator (penyelenggara) crosscheck klaim & proses poin [BR-030]
const validasiKlaim = async (req, res) => {
    try {
        const id = req.params.id;
        const aktorId = BigInt(req.user.id);
        const body = validasiKlaimSchema.parse(req.body);
        const klaim = await prisma_1.default.klaimPoin.findUnique({
            where: { id: BigInt(id) },
            include: {
                partisipasi: {
                    include: {
                        kegiatan: {
                            include: {
                                kegiatanCapaian: true,
                            },
                        },
                        mahasiswa: true,
                    },
                },
            },
        });
        if (!klaim) {
            res
                .status(404)
                .json({ success: false, message: "Klaim tidak ditemukan" });
            return;
        }
        if (klaim.status !== "menunggu_validasi") {
            res
                .status(400)
                .json({ success: false, message: "Klaim sudah diproses sebelumnya" });
            return;
        }
        if ((body.keputusan === "perlu_revisi" || body.keputusan === "ditolak") &&
            !body.alasan) {
            res.status(400).json({ success: false, message: "Alasan wajib diisi" });
            return;
        }
        if (body.keputusan === "disetujui") {
            const kegiatan = klaim.partisipasi.kegiatan;
            const peranFinalId = body.peranVerifId || klaim.peranUsulanId;
            // Update peran verif di partisipasi jika diubah validator
            if (body.peranVerifId) {
                await prisma_1.default.partisipasi.update({
                    where: { id: klaim.partisipasiId },
                    data: { peranVerifId: body.peranVerifId },
                });
            }
            if (!peranFinalId) {
                res
                    .status(400)
                    .json({ success: false, message: "Peran tidak ditemukan" });
                return;
            }
            // Khusus Kegiatan Eksternal: Lapis 1 (Admin Ditmawa) -> menunggu_pimpinan
            if (kegiatan.asal === "eksternal") {
                await prisma_1.default.klaimPoin.update({
                    where: { id: BigInt(id) },
                    data: {
                        status: "menunggu_pimpinan",
                        validatorId: aktorId, // Admin Ditmawa
                        alasan: body.alasan,
                    },
                });
                await (0, auditLog_1.logAudit)({
                    entitas: "klaim_poin",
                    entitasId: BigInt(id),
                    aksi: "validasi.diteruskan",
                    statusLama: "menunggu_validasi",
                    statusBaru: "menunggu_pimpinan",
                    aktorId,
                });
                res.json({
                    success: true,
                    message: "Klaim disetujui dan telah diteruskan ke Pimpinan Ditmawa",
                    data: { klaim: { id: klaim.id, status: "menunggu_pimpinan" } },
                });
                return;
            }
            // --- LOGIKA UNTUK KEGIATAN INTERNAL (Tetap 1-Lapis mencetak poin langsung) ---
            // Lookup matriks poin [BR-030]
            const matriks = await prisma_1.default.matriksPoin.findFirst({
                where: {
                    kurikulumId: kegiatan.kurikulumId,
                    kategoriId: kegiatan.kategoriId,
                    skalaId: kegiatan.skalaId,
                    peranId: peranFinalId,
                },
            });
            if (!matriks) {
                res.status(404).json({
                    success: false,
                    message: `Matriks poin tidak ditemukan untuk kombinasi: kategori=${kegiatan.kategoriId}, skala=${kegiatan.skalaId}, peran=${peranFinalId}`,
                });
                return;
            }
            // Buat perolehan_poin + detail [BR-032] [BR-020]
            const perolehan = await prisma_1.default.perolehanPoin.create({
                data: {
                    klaimPoinId: BigInt(id),
                    mahasiswaId: klaim.partisipasi.mahasiswaId,
                    kegiatanId: kegiatan.id,
                    totalPoin: matriks.poin,
                    status: "sah",
                    detail: {
                        create: kegiatan.kegiatanCapaian.map((kc) => ({
                            subCapaianId: kc.subCapaianId,
                            poin: Math.round((matriks.poin * Number(kc.alokasiPersen)) / 100),
                        })),
                    },
                },
                include: { detail: true },
            });
            // Update klaim status ke disetujui
            await prisma_1.default.klaimPoin.update({
                where: { id: BigInt(id) },
                data: {
                    status: "disetujui",
                    validatorId: aktorId,
                    alasan: body.alasan,
                },
            });
            // Notifikasi ke mahasiswa
            await prisma_1.default.notifikasi.create({
                data: {
                    userId: klaim.partisipasi.mahasiswaId,
                    judul: "Poin Diperoleh! 🎉",
                    isi: `Klaim poin Anda disetujui. Anda memperoleh ${matriks.poin} poin dari kegiatan "${kegiatan.nama}".${body.alasan ? ` Catatan: ${body.alasan}` : ""}`,
                    refType: "perolehan_poin",
                    refId: perolehan.id,
                },
            });
            await (0, auditLog_1.logAudit)({
                entitas: "klaim_poin",
                entitasId: BigInt(id),
                aksi: "validasi.disetujui",
                statusLama: "menunggu_validasi",
                statusBaru: "disetujui",
                aktorId,
            });
            res.json({
                success: true,
                data: { klaim: { id: klaim.id, status: "disetujui" }, perolehan },
            });
        }
        else {
            // Perlu Revisi atau Ditolak
            const updated = await prisma_1.default.klaimPoin.update({
                where: { id: BigInt(id) },
                data: {
                    status: body.keputusan,
                    alasan: body.alasan,
                    validatorId: aktorId,
                },
            });
            // Notifikasi ke mahasiswa
            const statusTitle = body.keputusan === "perlu_revisi" ? "Perlu Revisi ⚠️" : "Ditolak ❌";
            await prisma_1.default.notifikasi.create({
                data: {
                    userId: klaim.partisipasi.mahasiswaId,
                    judul: `Klaim Poin ${statusTitle}`,
                    isi: `Klaim poin Anda ${body.keputusan === "perlu_revisi" ? "perlu direvisi" : "ditolak"}. Alasan: ${body.alasan}`,
                    refType: "klaim_poin",
                    refId: BigInt(id),
                },
            });
            await (0, auditLog_1.logAudit)({
                entitas: "klaim_poin",
                entitasId: BigInt(id),
                aksi: `validasi.${body.keputusan}`,
                statusLama: "menunggu_validasi",
                statusBaru: body.keputusan,
                aktorId,
            });
            res.json({ success: true, data: updated });
        }
    }
    catch (error) {
        if (error?.code === "P2002") {
            res.status(409).json({
                success: false,
                message: "Poin sudah pernah diberikan untuk kegiatan ini [BR-020]",
            });
        }
        else if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({
                success: false,
                message: "Validasi gagal",
                errors: error.issues,
            });
        }
        else {
            console.error(error);
            res
                .status(500)
                .json({ success: false, message: "Terjadi kesalahan pada server" });
        }
    }
};
exports.validasiKlaim = validasiKlaim;
// PUT /api/klaim/validasi-bulk — Pimpinan / Admin validasi banyak klaim eksternal sekaligus
const validasiKlaimBulk = async (req, res) => {
    try {
        const aktorId = BigInt(req.user.id);
        const body = validasiKlaimBulkSchema.parse(req.body);
        if ((body.keputusan === "perlu_revisi" || body.keputusan === "ditolak") &&
            !body.alasan) {
            res.status(400).json({ success: false, message: "Alasan wajib diisi untuk revisi/tolak" });
            return;
        }
        const klaimIds = body.klaimIds.map(id => BigInt(id));
        // Validasi klaim-klaim yang dikirim (hanya yang statusnya menunggu_validasi)
        const klaims = await prisma_1.default.klaimPoin.findMany({
            where: {
                id: { in: klaimIds },
                status: "menunggu_pimpinan",
            },
            include: {
                partisipasi: {
                    include: {
                        kegiatan: {
                            include: {
                                kegiatanCapaian: true,
                            },
                        },
                        mahasiswa: true,
                    },
                },
            },
        });
        if (klaims.length === 0) {
            res.status(404).json({ success: false, message: "Tidak ada klaim valid yang bisa diproses (mungkin sudah diproses sebelumnya)" });
            return;
        }
        const processedIds = [];
        const errors = [];
        // Gunakan transaction untuk memastikan integritas
        await prisma_1.default.$transaction(async (tx) => {
            for (const klaim of klaims) {
                if (body.keputusan === "disetujui") {
                    const kegiatan = klaim.partisipasi.kegiatan;
                    const peranFinalId = klaim.peranUsulanId;
                    if (!peranFinalId) {
                        errors.push(`Klaim ID ${klaim.id}: Peran usulan tidak ditemukan.`);
                        continue;
                    }
                    const matriks = await tx.matriksPoin.findFirst({
                        where: {
                            kurikulumId: kegiatan.kurikulumId,
                            kategoriId: kegiatan.kategoriId,
                            skalaId: kegiatan.skalaId,
                            peranId: peranFinalId,
                        },
                    });
                    if (!matriks) {
                        errors.push(`Klaim ID ${klaim.id}: Matriks poin tidak ditemukan.`);
                        continue;
                    }
                    // Periksa jika sudah ada perolehan poin
                    const existingPerolehan = await tx.perolehanPoin.findUnique({
                        where: { klaimPoinId: klaim.id }
                    });
                    if (existingPerolehan) {
                        errors.push(`Klaim ID ${klaim.id}: Poin sudah pernah diberikan.`);
                        continue;
                    }
                    const perolehan = await tx.perolehanPoin.create({
                        data: {
                            klaimPoinId: klaim.id,
                            mahasiswaId: klaim.partisipasi.mahasiswaId,
                            kegiatanId: kegiatan.id,
                            totalPoin: matriks.poin,
                            status: "sah",
                            detail: {
                                create: kegiatan.kegiatanCapaian.map((kc) => ({
                                    subCapaianId: kc.subCapaianId,
                                    poin: Math.round((matriks.poin * Number(kc.alokasiPersen)) / 100),
                                })),
                            },
                        },
                    });
                    await tx.klaimPoin.update({
                        where: { id: klaim.id },
                        data: {
                            status: "disetujui",
                            validatorId: aktorId,
                            alasan: body.alasan,
                        },
                    });
                    await tx.notifikasi.create({
                        data: {
                            userId: klaim.partisipasi.mahasiswaId,
                            judul: "Poin Diperoleh! 🎉",
                            isi: `Klaim poin Anda disetujui secara massal. Anda memperoleh ${matriks.poin} poin dari kegiatan "${kegiatan.nama}".${body.alasan ? ` Catatan: ${body.alasan}` : ""}`,
                            refType: "perolehan_poin",
                            refId: perolehan.id,
                        },
                    });
                    processedIds.push(klaim.id);
                }
                else {
                    // Revisi / Tolak
                    await tx.klaimPoin.update({
                        where: { id: klaim.id },
                        data: {
                            status: body.keputusan,
                            alasan: body.alasan,
                            validatorId: aktorId,
                        },
                    });
                    const statusTitle = body.keputusan === "perlu_revisi" ? "Perlu Revisi ⚠️" : "Ditolak ❌";
                    await tx.notifikasi.create({
                        data: {
                            userId: klaim.partisipasi.mahasiswaId,
                            judul: `Klaim Poin ${statusTitle}`,
                            isi: `Klaim poin Anda (diperiksa massal) ${body.keputusan === "perlu_revisi" ? "perlu direvisi" : "ditolak"}. Alasan: ${body.alasan}`,
                            refType: "klaim_poin",
                            refId: klaim.id,
                        },
                    });
                    processedIds.push(klaim.id);
                }
            }
            if (processedIds.length === 0) {
                throw new Error("Tidak ada klaim yang berhasil diproses. " + errors.join(" | "));
            }
        });
        await Promise.all(processedIds.map(id => (0, auditLog_1.logAudit)({
            entitas: "klaim_poin",
            entitasId: id,
            aksi: `validasi_bulk.${body.keputusan}`,
            statusLama: "menunggu_pimpinan",
            statusBaru: body.keputusan,
            aktorId,
        })));
        res.json({
            success: true,
            message: `Berhasil memproses ${processedIds.length} dari ${klaims.length} klaim.`,
            errors: errors.length > 0 ? errors : undefined
        });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            res.status(400).json({ success: false, message: "Validasi gagal", errors: error.issues });
        }
        else {
            console.error(error);
            res.status(500).json({ success: false, message: error.message || "Terjadi kesalahan pada server" });
        }
    }
};
exports.validasiKlaimBulk = validasiKlaimBulk;
