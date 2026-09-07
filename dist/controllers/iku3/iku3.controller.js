"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRuleIku3 = exports.getRulesIku3 = exports.upsertTargetIku3 = exports.getTargetsIku3 = exports.getActivitiesIku3 = exports.getFacultiesIku3 = exports.getTrendIku3 = exports.getDashboardIku3 = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const iku3Calculation_service_1 = require("../../services/iku3/iku3Calculation.service");
/**
 * Helper: Ambil role efektif dan enforce isolasi fakultas
 */
async function resolveRoleAndScope(req) {
    const user = req.user;
    const effectiveRole = user?.peran === 'staff' && user?.jabatan ? user.jabatan : user?.peran || '';
    let enforcedFakultasId = undefined;
    if (effectiveRole === 'pimpinan_fakultas' || effectiveRole === 'admin_fakultas') {
        if (user?.id) {
            const staff = await prisma_1.default.staff.findUnique({
                where: { userId: BigInt(user.id) },
                select: { fakultasId: true },
            });
            enforcedFakultasId = staff?.fakultasId ?? undefined;
        }
    }
    return { effectiveRole, enforcedFakultasId };
}
// GET /api/iku3/dashboard
const getDashboardIku3 = async (req, res, next) => {
    try {
        const { effectiveRole, enforcedFakultasId } = await resolveRoleAndScope(req);
        const { tahun, triwulan, fakultasId, prodiId } = req.query;
        const filter = {
            tahun: tahun ? Number(tahun) : undefined,
            triwulan: triwulan ? Number(triwulan) : undefined,
            fakultasId: enforcedFakultasId ?? (fakultasId ? Number(fakultasId) : undefined),
            prodiId: prodiId ? Number(prodiId) : undefined,
        };
        const data = await (0, iku3Calculation_service_1.calculateIku3Dashboard)(filter);
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error('[getDashboardIku3]', error);
        next(error);
    }
};
exports.getDashboardIku3 = getDashboardIku3;
// GET /api/iku3/trend
const getTrendIku3 = async (req, res, next) => {
    try {
        const { enforcedFakultasId } = await resolveRoleAndScope(req);
        const { fakultasId } = req.query;
        const targetFakultasId = enforcedFakultasId ?? (fakultasId ? Number(fakultasId) : undefined);
        const data = await (0, iku3Calculation_service_1.calculateIku3Trend)(targetFakultasId);
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error('[getTrendIku3]', error);
        next(error);
    }
};
exports.getTrendIku3 = getTrendIku3;
// GET /api/iku3/faculties
const getFacultiesIku3 = async (req, res, next) => {
    try {
        const { tahun, triwulan } = req.query;
        const targetTahun = tahun ? Number(tahun) : new Date().getFullYear();
        const targetTriwulan = triwulan ? Number(triwulan) : undefined;
        const data = await (0, iku3Calculation_service_1.calculateIku3Faculties)(targetTahun, targetTriwulan);
        res.status(200).json({
            success: true,
            data,
        });
    }
    catch (error) {
        console.error('[getFacultiesIku3]', error);
        next(error);
    }
};
exports.getFacultiesIku3 = getFacultiesIku3;
// GET /api/iku3/activities
const getActivitiesIku3 = async (req, res, next) => {
    try {
        const { enforcedFakultasId } = await resolveRoleAndScope(req);
        const { tahun, triwulan, fakultasId, prodiId, search, page, limit } = req.query;
        const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
        const host = req.get('host');
        const baseUrl = process.env.BACKEND_URL || (host ? `${protocol}://${host}` : '');
        const result = await (0, iku3Calculation_service_1.getIku3ActivitiesDetail)({
            tahun: tahun ? Number(tahun) : undefined,
            triwulan: triwulan ? Number(triwulan) : undefined,
            fakultasId: enforcedFakultasId ?? (fakultasId ? Number(fakultasId) : undefined),
            prodiId: prodiId ? Number(prodiId) : undefined,
            search: search ? String(search) : undefined,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 15,
            baseUrl,
        });
        res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        console.error('[getActivitiesIku3]', error);
        next(error);
    }
};
exports.getActivitiesIku3 = getActivitiesIku3;
// GET /api/iku3/targets — Ambil Daftar Target Tahunan
const getTargetsIku3 = async (req, res, next) => {
    try {
        const targets = await prisma_1.default.iku3Target.findMany({
            where: { deletedAt: null },
            orderBy: { tahun: 'desc' },
            include: {
                pengubah: { select: { id: true, nama: true } },
            },
        });
        res.status(200).json({
            success: true,
            data: targets.map(t => ({
                id: t.id,
                tahun: t.tahun,
                targetPersen: Number(t.targetPersen),
                keterangan: t.keterangan,
                diubahOleh: t.pengubah?.nama || 'Sistem',
                updatedAt: t.updatedAt,
            })),
        });
    }
    catch (error) {
        console.error('[getTargetsIku3]', error);
        next(error);
    }
};
exports.getTargetsIku3 = getTargetsIku3;
// POST /api/iku3/targets — Tetapkan / Ubah Target Tahunan (Khusus Ditmawa)
const upsertTargetIku3 = async (req, res, next) => {
    try {
        const { tahun, targetPersen, keterangan } = req.body;
        const userId = req.user?.id ? BigInt(req.user.id) : null;
        if (!tahun || targetPersen === undefined) {
            res.status(400).json({
                success: false,
                message: 'Tahun dan targetPersen wajib diisi.',
            });
            return;
        }
        const upserted = await prisma_1.default.iku3Target.upsert({
            where: { tahun: Number(tahun) },
            update: {
                targetPersen: Number(targetPersen),
                keterangan: keterangan || null,
                diubahOleh: userId,
                deletedAt: null,
            },
            create: {
                tahun: Number(tahun),
                targetPersen: Number(targetPersen),
                keterangan: keterangan || null,
                diubahOleh: userId,
            },
        });
        res.status(200).json({
            success: true,
            message: `Target IKU 3 tahun ${tahun} berhasil disimpan sebesar ${targetPersen}%.`,
            data: {
                tahun: upserted.tahun,
                targetPersen: Number(upserted.targetPersen),
                keterangan: upserted.keterangan,
            },
        });
    }
    catch (error) {
        console.error('[upsertTargetIku3]', error);
        next(error);
    }
};
exports.upsertTargetIku3 = upsertTargetIku3;
// GET /api/iku3/rules — Ambil Aturan Bobot Dinamis
const getRulesIku3 = async (req, res, next) => {
    try {
        const { jenis } = req.query;
        const whereClause = { aktif: true, deletedAt: null };
        if (jenis)
            whereClause.jenis = String(jenis);
        const rules = await prisma_1.default.iku3BobotRule.findMany({
            where: whereClause,
            orderBy: [{ tahunMulai: 'desc' }, { jenis: 'asc' }, { id: 'asc' }],
        });
        res.status(200).json({
            success: true,
            data: rules.map(r => ({
                id: r.id,
                tahunMulai: r.tahunMulai,
                jenis: r.jenis,
                skala: r.skala,
                peran: r.peran,
                sksMin: r.sksMin,
                sksMax: r.sksMax,
                bobot: Number(r.bobot),
                keterangan: r.keterangan,
            })),
        });
    }
    catch (error) {
        console.error('[getRulesIku3]', error);
        next(error);
    }
};
exports.getRulesIku3 = getRulesIku3;
// PUT /api/iku3/rules/:id — Ubah Bobot Aturan Dinamis (Super Admin)
const updateRuleIku3 = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { bobot, keterangan, aktif } = req.body;
        const userId = req.user?.id ? BigInt(req.user.id) : null;
        if (bobot === undefined) {
            res.status(400).json({ success: false, message: 'Nilai bobot wajib diisi.' });
            return;
        }
        const updated = await prisma_1.default.iku3BobotRule.update({
            where: { id: Number(id) },
            data: {
                bobot: Number(bobot),
                keterangan: keterangan !== undefined ? keterangan : undefined,
                aktif: aktif !== undefined ? Boolean(aktif) : undefined,
                diubahOleh: userId,
            },
        });
        res.status(200).json({
            success: true,
            message: 'Aturan bobot berhasil diperbarui.',
            data: {
                id: updated.id,
                bobot: Number(updated.bobot),
                keterangan: updated.keterangan,
                aktif: updated.aktif,
            },
        });
    }
    catch (error) {
        console.error('[updateRuleIku3]', error);
        next(error);
    }
};
exports.updateRuleIku3 = updateRuleIku3;
