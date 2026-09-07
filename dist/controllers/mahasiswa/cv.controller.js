"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPortofolioData = exports.getPublicCvImage = exports.getPublicCvOgPage = exports.getPublicCv = exports.getPrivateCv = exports.generatePublicCvToken = void 0;
exports.buildPublicCvUrl = buildPublicCvUrl;
exports.buildDefaultShareMessage = buildDefaultShareMessage;
const prisma_1 = __importDefault(require("../../lib/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const cvImage_1 = require("../../lib/cvImage");
// URL publik CV (halaman SPA interaktif, untuk manusia)
function buildPublicCvUrl(token) {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/cv/public/${token}`;
}
// URL "og-page" milik backend (untuk crawler LinkedIn/Facebook/dll — lihat getPublicCvOgPage).
// Domain harus bisa diakses publik oleh crawler, jadi pakai BACKEND_URL, bukan localhost saat produksi.
function buildOgPageUrl(token) {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${baseUrl}/cv/public/${token}`;
}
// URL gambar ringkasan CV yang di-generate di server (jadi og:image / gambar yang tampil di kartu share).
function buildCvImageUrl(token) {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${baseUrl}/cv/public/${token}/image.png`;
}
// Pesan default yang otomatis terisi di composer LinkedIn saat mahasiswa klik "Share ke LinkedIn".
function buildDefaultShareMessage(nama) {
    return `Halo, saya ${nama}! Berikut CV & portofolio kegiatan kemahasiswaan saya yang tercatat di SAPS — Sistem Akademik Poin Sistem, Universitas Andalas.`;
}
// LinkedIn share-offsite lama hanya menerima parameter "url" dan tidak bisa diisi pesan default.
// Feed composer endpoint (tidak resmi didokumentasikan, tapi stabil dipakai luas) menerima "text"
// yang otomatis diisi ke kotak "Start a post", dan LinkedIn tetap generate preview card dari URL
// yang ada di dalam teks tsb (memakai og:title/og:description/og:image halaman itu).
function buildLinkedInShareUrl(ogPageUrl, nama) {
    const text = `${buildDefaultShareMessage(nama)}\n\n${ogPageUrl}`;
    return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(text)}`;
}
// POST /api/mahasiswa/cv/generate-link
const generatePublicCvToken = async (req, res) => {
    try {
        const userId = BigInt(req.user.id);
        const token = crypto_1.default.randomUUID();
        const mahasiswa = await prisma_1.default.mahasiswa.update({
            where: { userId },
            data: { publicCvToken: token },
            include: { user: { select: { nama: true } } }
        });
        const publicCvUrl = buildPublicCvUrl(token);
        const linkedInShareUrl = buildLinkedInShareUrl(buildOgPageUrl(token), mahasiswa.user.nama);
        res.json({
            success: true,
            data: {
                publicCvToken: mahasiswa.publicCvToken,
                publicCvUrl,
                linkedInShareUrl,
                message: 'Link publik berhasil dibuat'
            }
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal membuat link publik' });
    }
};
exports.generatePublicCvToken = generatePublicCvToken;
// GET /api/mahasiswa/cv
const getPrivateCv = async (req, res) => {
    try {
        const userId = BigInt(req.user.id);
        const portofolioData = await (0, exports.fetchPortofolioData)(userId);
        if (!portofolioData) {
            res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
            return;
        }
        res.json({ success: true, data: portofolioData });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getPrivateCv = getPrivateCv;
// GET /api/umum/cv/public/:token
const getPublicCv = async (req, res) => {
    try {
        const token = req.params.token;
        if (!token) {
            res.status(400).json({ success: false, message: 'Token tidak valid' });
            return;
        }
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
            where: { publicCvToken: token }
        });
        if (!mahasiswa) {
            res.status(404).json({ success: false, message: 'Portofolio publik tidak ditemukan atau token tidak valid' });
            return;
        }
        const portofolioData = await (0, exports.fetchPortofolioData)(mahasiswa.userId);
        // Hapus data sensitif jika perlu, tapi portofolioData pada dasarnya hanya prestasi
        if (portofolioData) {
            // Hapus NIM jika tidak ingin diekspos ke publik
            // delete portofolioData.mahasiswa.nim; 
            res.json({ success: true, data: portofolioData });
        }
        else {
            res.status(404).json({ success: false, message: 'Data portofolio tidak ditemukan' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
exports.getPublicCv = getPublicCv;
// User-Agent bot yang perlu dilayani HTML statis dengan meta tag Open Graph,
// karena mereka tidak menjalankan JavaScript (tidak bisa render SPA React).
const CRAWLER_USER_AGENTS = [
    'linkedinbot',
    'facebookexternalhit',
    'twitterbot',
    'whatsapp',
    'telegrambot',
    'slackbot',
    'discordbot',
];
function isCrawlerRequest(userAgent) {
    if (!userAgent)
        return false;
    const ua = userAgent.toLowerCase();
    return CRAWLER_USER_AGENTS.some((bot) => ua.includes(bot));
}
function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
// GET /cv/public/:token (didaftarkan langsung di root app, bukan di bawah /api)
// — Ini URL yang dibagikan ke LinkedIn (linkedInShareUrl). Untuk crawler, balas HTML
// statis dengan meta tag Open Graph. Untuk manusia, redirect ke halaman SPA interaktif.
const getPublicCvOgPage = async (req, res) => {
    try {
        const token = req.params.token;
        const publicCvUrl = buildPublicCvUrl(token);
        if (!isCrawlerRequest(req.headers['user-agent'])) {
            res.redirect(302, publicCvUrl);
            return;
        }
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
            where: { publicCvToken: token },
            include: {
                user: { select: { nama: true } },
                prodi: { include: { fakultas: true } },
            },
        });
        if (!mahasiswa) {
            res.status(404).send('<!doctype html><html><head><title>CV tidak ditemukan</title></head><body>CV tidak ditemukan.</body></html>');
            return;
        }
        const perolehan = await prisma_1.default.perolehanPoin.aggregate({
            where: { mahasiswaId: mahasiswa.userId, status: 'sah' },
            _sum: { totalPoin: true },
            _count: true,
        });
        const nama = escapeHtml(mahasiswa.user.nama);
        const title = escapeHtml(`CV — ${mahasiswa.user.nama}`);
        const description = escapeHtml(buildDefaultShareMessage(mahasiswa.user.nama));
        // Gambar ringkasan CV yang di-generate server (bukan sekadar logo) — inilah yang tampil
        // sebagai thumbnail preview saat dibagikan ke LinkedIn/Facebook/dll.
        const imageUrl = buildCvImageUrl(token);
        res.set('Content-Type', 'text/html; charset=utf-8').send(`<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta property="og:type" content="profile" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="${cvImage_1.CV_IMAGE_WIDTH}" />
  <meta property="og:image:height" content="${cvImage_1.CV_IMAGE_HEIGHT}" />
  <meta property="og:url" content="${escapeHtml(buildOgPageUrl(token))}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta http-equiv="refresh" content="0; url=${escapeHtml(publicCvUrl)}" />
</head>
<body>
  <p>CV ${nama} — <a href="${escapeHtml(publicCvUrl)}">lihat CV lengkap</a></p>
</body>
</html>`);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('<!doctype html><html><head><title>Terjadi kesalahan</title></head><body>Terjadi kesalahan pada server.</body></html>');
    }
};
exports.getPublicCvOgPage = getPublicCvOgPage;
// GET /cv/public/:token/image.png (didaftarkan di root, lihat index.ts)
// "Gambar CV" — kartu ringkasan visual (identitas, stat, progres capaian, riwayat kegiatan)
// yang dipakai sebagai og:image. Di-generate on-the-fly dengan @napi-rs/canvas setiap diakses.
const getPublicCvImage = async (req, res) => {
    try {
        const token = req.params.token;
        const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
            where: { publicCvToken: token },
        });
        if (!mahasiswa) {
            res.status(404).send('Not found');
            return;
        }
        const cvData = await (0, exports.fetchPortofolioData)(mahasiswa.userId);
        if (!cvData) {
            res.status(404).send('Not found');
            return;
        }
        const buffer = await (0, cvImage_1.generateCvImage)({
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
        res.set('Content-Type', 'image/png');
        res.set('Cache-Control', 'public, max-age=3600');
        res.send(buffer);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Terjadi kesalahan pada server');
    }
};
exports.getPublicCvImage = getPublicCvImage;
// Helper function untuk mengambil data (Logika sama dengan Portofolio API)
const fetchPortofolioData = async (mahasiswaId) => {
    const mahasiswa = await prisma_1.default.mahasiswa.findUnique({
        where: { userId: mahasiswaId },
        include: {
            user: { select: { nama: true, email: true, nomorTelepon: true } },
            prodi: { include: { fakultas: true } },
        },
    });
    if (!mahasiswa)
        return null;
    const perolehan = await prisma_1.default.perolehanPoin.findMany({
        where: { mahasiswaId, status: 'sah' },
        include: {
            kegiatan: { include: { kategori: true, skala: true } },
            detail: { include: { subCapaian: { include: { capaian: true } } } },
        },
        orderBy: { createdAt: 'desc' },
    });
    const totalPoin = perolehan.reduce((s, p) => s + p.totalPoin, 0);
    const capaianMap = new Map();
    for (const p of perolehan) {
        for (const d of p.detail) {
            // Sub-capaian/capaian bisa null jika data referensi sudah dihapus — lewati agar tidak crash.
            if (!d.subCapaian?.capaian)
                continue;
            const capId = d.subCapaian.capaianId;
            if (!capaianMap.has(capId)) {
                capaianMap.set(capId, { nama: d.subCapaian.capaian.nama, target: d.subCapaian.capaian.jumlahPoin, diperoleh: 0 });
            }
            capaianMap.get(capId).diperoleh += d.poin;
        }
    }
    const riwayatPerKategori = {};
    for (const p of perolehan) {
        // Kegiatan/kategori/skala bisa null jika kegiatan sumbernya sudah dihapus dari database
        // (record perolehanPoin lama jadi "yatim") — lewati baris ini agar CV tetap bisa dimuat.
        if (!p.kegiatan?.kategori)
            continue;
        const kat = p.kegiatan.kategori.nama;
        if (!riwayatPerKategori[kat])
            riwayatPerKategori[kat] = [];
        riwayatPerKategori[kat].push({
            kegiatan: p.kegiatan.nama,
            skala: p.kegiatan.skala?.nama || '-',
            totalPoin: p.totalPoin,
            tanggal: p.kegiatan.tanggalMulai,
        });
    }
    const token = mahasiswa.publicCvToken;
    const publicCvUrl = token ? buildPublicCvUrl(token) : null;
    const linkedInShareUrl = token ? buildLinkedInShareUrl(buildOgPageUrl(token), mahasiswa.user.nama) : null;
    return {
        generatedAt: new Date().toISOString(),
        publicCvToken: mahasiswa.publicCvToken,
        publicCvUrl,
        linkedInShareUrl,
        mahasiswa: {
            nim: mahasiswa.nim,
            nama: mahasiswa.user.nama,
            email: mahasiswa.user.email,
            phone: mahasiswa.user.nomorTelepon || '-',
            prodi: mahasiswa.prodi.nama,
            fakultas: mahasiswa.prodi.fakultas.nama,
            angkatan: mahasiswa.angkatan,
        },
        ringkasan: { totalPoin, totalKegiatan: perolehan.length },
        capaianProgress: Array.from(capaianMap.entries()).map(([id, c]) => ({
            capaianId: id,
            nama: c.nama,
            target: c.target,
            diperoleh: c.diperoleh,
            persentase: Math.round((c.diperoleh / c.target) * 100),
        })),
        riwayatPerKategori,
    };
};
exports.fetchPortofolioData = fetchPortofolioData;
