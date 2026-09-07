"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSaranPA = exports.createSaranPA = exports.putuskanIzinPA = exports.putuskanIzinPABulk = exports.getIzinForDosen = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const zod_1 = require("zod");
const auditLog_1 = require("../../lib/auditLog");
const notifikasi_service_1 = require("../../services/notifikasi.service");
const poin_service_1 = require("../../services/poin.service");
// ==================== VALIDASI ====================
const izinDecisionSchema = zod_1.z.object({
    status: zod_1.z.enum(['disetujui', 'ditolak', 'revisi']),
    alasan: zod_1.z.string().optional(),
});
// ==================== DAFTAR PERMINTAAN IZIN ====================
// GET /api/dosen/persetujuan — Dosen PA melihat daftar izin mahasiswa bimbingannya
const getIzinForDosen = async (req, res, next) => {
    try {
        const dosenPaId = BigInt(req.user.id);
        const data = await prisma_1.default.izinPA.findMany({
            where: { dosenPaId },
            include: {
                partisipasi: {
                    include: {
                        mahasiswa: {
                            include: { user: { select: { nama: true } } },
                        },
                        kegiatan: {
                            include: {
                                kategori: true,
                                skala: true,
                                organisasi: { select: { nama: true } },
                            },
                        },
                        peranVerif: true,
                        klaimPoin: {
                            select: { peranUsulanId: true, peranUsulan: { select: { nama: true } } },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        // Deteksi pengajuan ulang: partisipasiId yang muncul >1x
        const partisipasiCount = {};
        data.forEach(izin => {
            const pid = izin.partisipasiId.toString();
            partisipasiCount[pid] = (partisipasiCount[pid] || 0) + 1;
        });
        const seenPid = new Set();
        // Serialisasi data agar bigint menjadi string
        const serializedData = data.map(izin => {
            const pid = izin.partisipasiId.toString();
            const isUlang = partisipasiCount[pid] > 1 && !seenPid.has(pid);
            seenPid.add(pid);
            const klaim = izin.partisipasi.klaimPoin;
            return {
                ...izin,
                id: izin.id.toString(),
                partisipasiId: pid,
                dosenPaId: izin.dosenPaId.toString(),
                isUlang,
                peran: klaim?.peranUsulan?.nama || izin.partisipasi.peranVerif?.nama || null,
                peranId: klaim?.peranUsulanId?.toString() || null,
                partisipasi: {
                    ...izin.partisipasi,
                    id: izin.partisipasi.id.toString(),
                    mahasiswaId: izin.partisipasi.mahasiswaId.toString(),
                    kegiatanId: izin.partisipasi.kegiatanId,
                    mahasiswa: {
                        ...izin.partisipasi.mahasiswa,
                        userId: izin.partisipasi.mahasiswa.userId.toString(),
                        dosenPaId: izin.partisipasi.mahasiswa.dosenPaId?.toString()
                    }
                }
            };
        });
        res.json({ success: true, data: serializedData });
    }
    catch (error) {
        next(error);
    }
};
exports.getIzinForDosen = getIzinForDosen;
// ==================== KEPUTUSAN IZIN (BULK) ====================
const izinBulkSchema = zod_1.z.object({
    ids: zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.number()])).min(1),
});
// PUT /api/dosen/persetujuan-bulk — Dosen PA menyetujui beberapa izin (status diajukan) sekaligus
const putuskanIzinPABulk = async (req, res, next) => {
    try {
        const dosenPaId = BigInt(req.user.id);
        const body = izinBulkSchema.parse(req.body);
        const ids = body.ids.map((id) => BigInt(id));
        const izinList = await prisma_1.default.izinPA.findMany({
            where: { id: { in: ids } },
            include: { partisipasi: true },
        });
        const invalid = izinList.find((izin) => izin.dosenPaId !== dosenPaId || izin.status !== 'diajukan');
        if (izinList.length !== ids.length || invalid) {
            return res.status(403).json({
                success: false,
                message: 'Beberapa izin tidak valid, bukan milik Anda, atau bukan berstatus Diajukan.',
            });
        }
        await prisma_1.default.$transaction(async (tx) => {
            await tx.izinPA.updateMany({
                where: { id: { in: ids } },
                data: { status: 'disetujui', decidedAt: new Date() },
            });
            await tx.partisipasi.updateMany({
                where: { id: { in: izinList.map((izin) => izin.partisipasiId) } },
                data: { status: 'disetujui_pa' },
            });
            for (const izin of izinList) {
                await tx.notifikasi.create({
                    data: {
                        userId: izin.partisipasi.mahasiswaId,
                        judul: 'Izin Kegiatan disetujui',
                        isi: 'Izin Anda untuk mengikuti kegiatan telah disetujui oleh Dosen PA.',
                        refType: 'izin_pa',
                        refId: izin.id,
                    },
                });
            }
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'izin_pa',
            entitasId: ids[0],
            aksi: 'setujui',
            statusLama: 'diajukan',
            statusBaru: 'disetujui',
            aktorId: dosenPaId,
        });
        // Auto-claim poin internal jika hadir + peran + izin PA sudah lengkap
        for (const izin of izinList) {
            try {
                await (0, poin_service_1.cairkanPoinPartisipasi)(izin.partisipasiId);
            }
            catch (err) {
                console.error(`[putuskanIzinPABulk] Gagal auto-claim partisipasi ${izin.partisipasiId}:`, err);
            }
        }
        res.json({ success: true, message: `${ids.length} izin berhasil disetujui.` });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        next(error);
    }
};
exports.putuskanIzinPABulk = putuskanIzinPABulk;
// ==================== KEPUTUSAN IZIN ====================
// PUT /api/dosen/persetujuan/:id — Dosen PA menyetujui / menolak izin
const putuskanIzinPA = async (req, res, next) => {
    try {
        const dosenPaId = BigInt(req.user.id);
        const { id } = req.params;
        const body = izinDecisionSchema.parse(req.body);
        const izin = await prisma_1.default.izinPA.findUnique({
            where: { id: BigInt(id) },
            include: { partisipasi: true },
        });
        if (!izin) {
            return res.status(404).json({ success: false, message: 'Izin PA tidak ditemukan' });
        }
        if (izin.dosenPaId !== dosenPaId) {
            return res.status(403).json({ success: false, message: 'Izin ini bukan untuk Anda' });
        }
        if ((body.status === 'ditolak' || body.status === 'revisi') && !body.alasan) {
            return res.status(400).json({ success: false, message: 'Alasan penolakan/revisi wajib diisi' });
        }
        const updatedIzin = await prisma_1.default.$transaction(async (tx) => {
            const updated = await tx.izinPA.update({
                where: { id: BigInt(id) },
                data: {
                    status: body.status,
                    alasan: body.alasan,
                    decidedAt: new Date(),
                },
            });
            let statusPartisipasi = 'disetujui_pa';
            if (body.status === 'ditolak')
                statusPartisipasi = 'ditolak_pa';
            if (body.status === 'revisi')
                statusPartisipasi = 'revisi_pa';
            await tx.partisipasi.update({
                where: { id: izin.partisipasiId },
                data: { status: statusPartisipasi },
            });
            return updated;
        });
        // Notifikasi ke mahasiswa
        let statusText = 'disetujui ✅';
        if (body.status === 'ditolak')
            statusText = 'ditolak ❌';
        if (body.status === 'revisi')
            statusText = 'diminta revisi ⚠️';
        await notifikasi_service_1.NotifikasiService.kirim({
            userId: izin.partisipasi.mahasiswaId,
            judul: `Izin Kegiatan ${statusText}`,
            isi: `Izin Anda untuk mengikuti kegiatan telah ${statusText} oleh Dosen PA.${body.alasan ? ` Alasan: ${body.alasan}` : ''}`,
            refType: 'izin_pa',
            refId: BigInt(id),
        });
        await (0, auditLog_1.logAudit)({
            entitas: 'izin_pa',
            entitasId: BigInt(id),
            aksi: body.status === 'disetujui' ? 'setujui' : (body.status === 'revisi' ? 'revisi' : 'tolak'),
            statusLama: 'diajukan',
            statusBaru: body.status,
            aktorId: dosenPaId,
        });
        // Auto-claim poin internal jika status disetujui dan syarat lengkap
        if (body.status === 'disetujui') {
            try {
                await (0, poin_service_1.cairkanPoinPartisipasi)(izin.partisipasiId);
            }
            catch (err) {
                console.error(`[putuskanIzinPA] Gagal auto-claim partisipasi ${izin.partisipasiId}:`, err);
            }
        }
        res.json({ success: true, data: { ...updatedIzin, id: updatedIzin.id.toString(), partisipasiId: updatedIzin.partisipasiId.toString(), dosenPaId: updatedIzin.dosenPaId.toString() } });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validasi gagal', errors: error.issues });
        }
        next(error);
    }
};
exports.putuskanIzinPA = putuskanIzinPA;
// ==================== SARAN PA ====================
// POST /api/dosen/saran — Dosen PA memberikan saran
const createSaranPA = async (req, res, next) => {
    try {
        const dosenPaId = BigInt(req.user.id);
        const mahasiswaId = BigInt(req.body.mahasiswaId);
        const isi = req.body.isi;
        if (!isi || isi.length < 3) {
            return res.status(400).json({ success: false, message: 'Isi saran minimal 3 karakter' });
        }
        // Verifikasi relasi bimbingan
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({ where: { userId: mahasiswaId } });
        if (!mahasiswa || mahasiswa.dosenPaId !== dosenPaId) {
            return res.status(403).json({ success: false, message: 'Bukan mahasiswa bimbingan Anda' });
        }
        const saran = await prisma_1.default.saranPA.create({
            data: { dosenPaId, mahasiswaId, isi },
        });
        await notifikasi_service_1.NotifikasiService.kirim({
            userId: mahasiswaId,
            judul: 'Saran dari Dosen PA',
            isi: `Dosen PA Anda memberikan saran baru.`,
            refType: 'saran_pa',
            refId: saran.id,
        });
        res.status(201).json({ success: true, data: { ...saran, id: saran.id.toString(), dosenPaId: saran.dosenPaId.toString(), mahasiswaId: saran.mahasiswaId.toString() } });
    }
    catch (error) {
        next(error);
    }
};
exports.createSaranPA = createSaranPA;
// GET /api/dosen/saran?mahasiswaId=X — Daftar saran PA
const getSaranPA = async (req, res, next) => {
    try {
        const mahasiswaId = BigInt(req.query.mahasiswaId);
        const data = await prisma_1.default.saranPA.findMany({
            where: { mahasiswaId },
            include: {
                dosenPA: {
                    include: { user: { select: { nama: true } } },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const serializedData = data.map(s => ({
            ...s,
            id: s.id.toString(),
            dosenPaId: s.dosenPaId.toString(),
            mahasiswaId: s.mahasiswaId.toString(),
            dosenPA: {
                ...s.dosenPA,
                userId: s.dosenPA.userId.toString()
            }
        }));
        res.json({ success: true, data: serializedData });
    }
    catch (error) {
        next(error);
    }
};
exports.getSaranPA = getSaranPA;
