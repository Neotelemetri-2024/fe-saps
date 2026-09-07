"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganisasi = exports.getProdi = exports.getFakultas = exports.getPeran = exports.getSkala = exports.getKategori = exports.getMatriksPoin = void 0;
const prisma_1 = __importDefault(require("../../lib/prisma"));
// Re-exports read-only matriks functions
var matriks_controller_1 = require("../pimpinan/ditmawa/matriks.controller");
Object.defineProperty(exports, "getMatriksPoin", { enumerable: true, get: function () { return matriks_controller_1.getMatriksPoin; } });
Object.defineProperty(exports, "getKategori", { enumerable: true, get: function () { return matriks_controller_1.getKategori; } });
Object.defineProperty(exports, "getSkala", { enumerable: true, get: function () { return matriks_controller_1.getSkala; } });
Object.defineProperty(exports, "getPeran", { enumerable: true, get: function () { return matriks_controller_1.getPeran; } });
// GET /api/umum/fakultas
const getFakultas = async (_req, res) => {
    try {
        const data = await prisma_1.default.fakultas.findMany({
            where: { deletedAt: null },
            orderBy: { nama: 'asc' },
            select: { id: true, nama: true },
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getFakultas = getFakultas;
// GET /api/umum/prodi?fakultasId=X
const getProdi = async (req, res) => {
    try {
        const { fakultasId } = req.query;
        const where = { deletedAt: null };
        if (fakultasId)
            where.fakultasId = Number(fakultasId);
        const data = await prisma_1.default.programStudi.findMany({
            where,
            orderBy: { nama: 'asc' },
            select: {
                id: true,
                nama: true,
                fakultasId: true,
                fakultas: { select: { id: true, nama: true } },
            },
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getProdi = getProdi;
// GET /api/umum/organisasi?tipe=UKM|UKMF
const getOrganisasi = async (req, res) => {
    try {
        const { tipe } = req.query;
        const where = { deletedAt: null };
        if (tipe === 'UKM' || tipe === 'UKMF')
            where.tipe = tipe;
        const data = await prisma_1.default.organisasi.findMany({
            where,
            orderBy: { nama: 'asc' },
            select: {
                id: true,
                nama: true,
                tipe: true,
                fakultasId: true,
                fakultas: { select: { id: true, nama: true } },
            },
        });
        res.json({ success: true, data });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getOrganisasi = getOrganisasi;
