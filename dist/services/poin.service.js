"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cairkanPoinPartisipasi = cairkanPoinPartisipasi;
const prisma_1 = __importDefault(require("../lib/prisma"));
const notifikasi_service_1 = require("./notifikasi.service");
const kurikulumResolver_service_1 = require("./kurikulumResolver.service");
/**
 * Mencairkan poin otomatis untuk partisipasi kegiatan internal
 *
 * 3 Syarat Wajib:
 * 1. Partisipasi hadir (kehadiran === true)
 * 2. Peran terverifikasi sudah ada (peranVerifId != null)
 * 3. Izin Dosen PA sudah disetujui (izinPA.status === 'disetujui')
 */
async function cairkanPoinPartisipasi(partisipasiId, txPrisma) {
    const db = txPrisma || prisma_1.default;
    const partisipasi = await db.partisipasi.findUnique({
        where: { id: partisipasiId },
        include: {
            kegiatan: {
                include: {
                    kategori: true,
                    skala: true,
                    kegiatanCapaian: true,
                },
            },
            peranVerif: true,
            izinPA: {
                orderBy: { createdAt: 'desc' },
                take: 1,
            },
            klaimPoin: {
                include: {
                    perolehanPoin: true,
                },
            },
            mahasiswa: {
                include: {
                    user: { select: { id: true, nama: true } },
                },
            },
        },
    });
    if (!partisipasi) {
        return { claimed: false, reason: 'Partisipasi tidak ditemukan' };
    }
    // Cek apakah sudah pernah sah
    if (partisipasi.klaimPoin?.perolehanPoin && partisipasi.klaimPoin.perolehanPoin.status === 'sah') {
        return {
            claimed: false,
            reason: 'Poin sudah pernah dicairkan sebelumnya',
            poin: partisipasi.klaimPoin.perolehanPoin.totalPoin
        };
    }
    // 1. Cek Kehadiran
    if (partisipasi.kehadiran !== true) {
        return { claimed: false, reason: 'Peserta belum diverifikasi hadir' };
    }
    // 2. Cek Peran Terverifikasi
    if (!partisipasi.peranVerifId) {
        return { claimed: false, reason: 'Peran peserta belum ditentukan' };
    }
    // 3. Cek Izin Dosen PA
    const izinTerbaru = partisipasi.izinPA[0];
    if (!izinTerbaru || izinTerbaru.status !== 'disetujui') {
        return { claimed: false, reason: 'Izin Dosen PA belum disetujui' };
    }
    const kegiatan = partisipasi.kegiatan;
    const { kurikulum, matriks } = await (0, kurikulumResolver_service_1.resolveMatriksMahasiswa)(partisipasi.mahasiswaId, {
        kategoriId: kegiatan.kategoriId,
        skalaId: kegiatan.skalaId,
        peranId: partisipasi.peranVerifId,
    }, db);
    if (!matriks) {
        return {
            claimed: false,
            reason: `Matriks poin tidak ditemukan pada kurikulum mahasiswa untuk kombinasi: kategori=${kegiatan.kategoriId}, skala=${kegiatan.skalaId}, peran=${partisipasi.peranVerifId}`,
        };
    }
    const detailData = await (0, kurikulumResolver_service_1.buildSettlementDetails)(kegiatan.id, kurikulum.id, matriks.poin, db);
    // Buat / Update KlaimPoin
    let klaimId;
    if (partisipasi.klaimPoin) {
        klaimId = partisipasi.klaimPoin.id;
        await db.klaimPoin.update({
            where: { id: klaimId },
            data: {
                status: 'disetujui',
                peranUsulanId: partisipasi.peranVerifId,
                alasan: 'Pencairan poin otomatis (kehadiran, peran & izin PA lengkap)',
            },
        });
    }
    else {
        const newKlaim = await db.klaimPoin.create({
            data: {
                partisipasiId: partisipasi.id,
                peranUsulanId: partisipasi.peranVerifId,
                status: 'disetujui',
                alasan: 'Pencairan poin otomatis (kehadiran, peran & izin PA lengkap)',
            },
        });
        klaimId = newKlaim.id;
    }
    // Hapus perolehan lama jika ada
    await db.perolehanPoin.deleteMany({
        where: { klaimPoinId: klaimId },
    });
    const perolehan = await db.perolehanPoin.create({
        data: {
            klaimPoinId: klaimId,
            mahasiswaId: partisipasi.mahasiswaId,
            kegiatanId: kegiatan.id,
            kurikulumId: kurikulum.id,
            totalPoin: matriks.poin,
            status: 'sah',
            detail: { create: detailData },
        },
    });
    // Update status partisipasi menjadi hadir
    await db.partisipasi.update({
        where: { id: partisipasi.id },
        data: { status: 'hadir' },
    });
    // Kirim notifikasi ke mahasiswa
    try {
        await notifikasi_service_1.NotifikasiService.kirim({
            userId: partisipasi.mahasiswaId,
            judul: 'Poin Otomatis Diperoleh! 🎉',
            isi: `Poin kegiatan internal "${kegiatan.nama}" sebesar ${matriks.poin} poin telah otomatis cair dan ditambahkan ke profil Anda.`,
            refType: 'perolehan_poin',
            refId: perolehan.id,
        });
    }
    catch (err) {
        console.error('[cairkanPoinPartisipasi] Notifikasi gagal:', err);
    }
    return { claimed: true, poin: matriks.poin };
}
