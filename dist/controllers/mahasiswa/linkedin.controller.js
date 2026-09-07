"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareCvToLinkedIn = exports.linkedinCallback = exports.connectLinkedIn = exports.disconnectLinkedIn = exports.getLinkedInStatus = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../../lib/prisma"));
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const cvImage_1 = require("../../lib/cvImage");
const linkedin_1 = require("../../lib/linkedin");
const cv_controller_1 = require("./cv.controller");
const OAUTH_PURPOSE = 'linkedin_oauth';
const TOKEN_SKEW_MS = 60 * 1000;
function normalizeReturnTo(value) {
    return value === 'pengaturan' ? 'pengaturan' : 'generate-cv';
}
function frontendReturnUrl(returnTo, query) {
    const base = process.env.FRONTEND_URL || 'http://localhost:5173';
    const path = returnTo === 'pengaturan' ? '/mahasiswa/pengaturan' : '/mahasiswa/generate-cv';
    return `${base}${path}${query}`;
}
function backendConnectUrl(returnTo = 'generate-cv') {
    const base = process.env.BACKEND_URL || 'http://localhost:3000';
    const url = `${base}/api/mahasiswa/linkedin/connect`;
    return returnTo === 'pengaturan' ? `${url}?returnTo=pengaturan` : url;
}
function signOauthState(userId, returnTo) {
    return jsonwebtoken_1.default.sign({ userId, purpose: OAUTH_PURPOSE, returnTo }, auth_middleware_1.JWT_SECRET, { expiresIn: '10m' });
}
function verifyOauthState(state) {
    const decoded = jsonwebtoken_1.default.verify(state, auth_middleware_1.JWT_SECRET);
    if (decoded.purpose !== OAUTH_PURPOSE || !decoded.userId) {
        throw new Error('State OAuth tidak valid');
    }
    return {
        userId: decoded.userId,
        returnTo: normalizeReturnTo(decoded.returnTo),
    };
}
function isTokenValid(expiresAt) {
    if (!expiresAt)
        return false;
    return expiresAt.getTime() - TOKEN_SKEW_MS > Date.now();
}
function maskMemberId(memberId) {
    if (!memberId)
        return null;
    if (memberId.length <= 4)
        return `****${memberId}`;
    return `****${memberId.slice(-4)}`;
}
// GET /api/mahasiswa/linkedin/status
const getLinkedInStatus = async (req, res) => {
    try {
        const userId = BigInt(req.user.id);
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
            where: { userId },
            select: {
                linkedinMemberId: true,
                linkedinAccessToken: true,
                linkedinTokenExpiresAt: true,
            },
        });
        if (!mahasiswa) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        const hasToken = Boolean(mahasiswa.linkedinAccessToken && mahasiswa.linkedinMemberId);
        const connected = hasToken && isTokenValid(mahasiswa.linkedinTokenExpiresAt);
        res.json({
            success: true,
            data: {
                connected,
                expiresAt: mahasiswa.linkedinTokenExpiresAt
                    ? mahasiswa.linkedinTokenExpiresAt.toISOString()
                    : null,
                memberIdMasked: maskMemberId(mahasiswa.linkedinMemberId),
            },
        });
    }
    catch (error) {
        console.error('[getLinkedInStatus]', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil status LinkedIn' });
    }
};
exports.getLinkedInStatus = getLinkedInStatus;
// DELETE /api/mahasiswa/linkedin/disconnect
const disconnectLinkedIn = async (req, res) => {
    try {
        const userId = BigInt(req.user.id);
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({ where: { userId } });
        if (!mahasiswa) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        await prisma_1.default.mahasiswa.update({
            where: { userId },
            data: {
                linkedinMemberId: null,
                linkedinAccessToken: null,
                linkedinTokenExpiresAt: null,
            },
        });
        res.json({ success: true, message: 'Koneksi LinkedIn diputuskan' });
    }
    catch (error) {
        console.error('[disconnectLinkedIn]', error);
        res.status(500).json({ success: false, message: 'Gagal memutuskan koneksi LinkedIn' });
    }
};
exports.disconnectLinkedIn = disconnectLinkedIn;
// GET /api/mahasiswa/linkedin/connect
const connectLinkedIn = async (req, res) => {
    const returnTo = normalizeReturnTo(req.query.returnTo);
    try {
        const userId = req.user.id;
        const authorizeUrl = (0, linkedin_1.buildAuthorizeUrl)(signOauthState(userId, returnTo));
        res.redirect(302, authorizeUrl);
    }
    catch (error) {
        console.error(error);
        res.redirect(302, frontendReturnUrl(returnTo, '?linkedin=error'));
    }
};
exports.connectLinkedIn = connectLinkedIn;
// GET /api/mahasiswa/linkedin/callback — publik, dipanggil LinkedIn setelah consent
const linkedinCallback = async (req, res) => {
    let returnTo = 'generate-cv';
    try {
        const errorParam = typeof req.query.error === 'string' ? req.query.error : null;
        const state = typeof req.query.state === 'string' ? req.query.state : '';
        if (state) {
            try {
                returnTo = verifyOauthState(state).returnTo;
            }
            catch {
                /* keep default */
            }
        }
        if (errorParam) {
            res.redirect(302, frontendReturnUrl(returnTo, '?linkedin=denied'));
            return;
        }
        const code = typeof req.query.code === 'string' ? req.query.code : '';
        if (!code || !state) {
            res.redirect(302, frontendReturnUrl(returnTo, '?linkedin=error'));
            return;
        }
        const verified = verifyOauthState(state);
        returnTo = verified.returnTo;
        const { accessToken, expiresIn } = await (0, linkedin_1.exchangeCodeForToken)(code);
        const memberId = await (0, linkedin_1.fetchMemberId)(accessToken);
        await prisma_1.default.mahasiswa.update({
            where: { userId: BigInt(verified.userId) },
            data: {
                linkedinMemberId: memberId,
                linkedinAccessToken: accessToken,
                linkedinTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
            },
        });
        res.redirect(302, frontendReturnUrl(returnTo, '?linkedin=connected'));
    }
    catch (error) {
        console.error('[linkedinCallback]', error);
        res.redirect(302, frontendReturnUrl(returnTo, '?linkedin=error'));
    }
};
exports.linkedinCallback = linkedinCallback;
// POST /api/mahasiswa/linkedin/share
const shareCvToLinkedIn = async (req, res) => {
    try {
        const userId = BigInt(req.user.id);
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
            where: { userId },
        });
        if (!mahasiswa) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        if (!mahasiswa.linkedinAccessToken || !mahasiswa.linkedinMemberId || !isTokenValid(mahasiswa.linkedinTokenExpiresAt)) {
            res.status(428).json({
                success: false,
                needsConnect: true,
                connectUrl: backendConnectUrl('generate-cv'),
                message: 'Hubungkan akun LinkedIn terlebih dahulu',
            });
            return;
        }
        const cvData = await (0, cv_controller_1.fetchPortofolioData)(userId);
        if (!cvData) {
            res.status(404).json({ success: false, message: 'Data portofolio tidak ditemukan' });
            return;
        }
        const rawCaption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : '';
        const commentary = (rawCaption || (0, cv_controller_1.buildDefaultShareMessage)(cvData.mahasiswa.nama)).slice(0, 3000);
        console.log('[shareCvToLinkedIn] caption custom:', Boolean(rawCaption), 'panjang:', commentary.length);
        const imageBuffer = await (0, cvImage_1.generateCvImage)({
            nama: cvData.mahasiswa.nama,
            nim: cvData.mahasiswa.nim,
            prodi: cvData.mahasiswa.prodi,
            fakultas: cvData.mahasiswa.fakultas,
            email: cvData.mahasiswa.email,
            phone: cvData.mahasiswa.phone,
            angkatan: cvData.mahasiswa.angkatan,
            totalPoin: cvData.ringkasan.totalPoin,
            totalKegiatan: cvData.ringkasan.totalKegiatan,
            riwayatPerKategori: cvData.riwayatPerKategori,
        });
        const postUrn = await (0, linkedin_1.uploadImageAndPost)({
            accessToken: mahasiswa.linkedinAccessToken,
            memberId: mahasiswa.linkedinMemberId,
            commentary,
            imageBuffer,
        });
        res.json({ success: true, data: { postUrn, commentary } });
    }
    catch (error) {
        console.error('[shareCvToLinkedIn]', error);
        const message = error instanceof Error ? error.message : 'Gagal membagikan CV ke LinkedIn';
        res.status(500).json({ success: false, message });
    }
};
exports.shareCvToLinkedIn = shareCvToLinkedIn;
