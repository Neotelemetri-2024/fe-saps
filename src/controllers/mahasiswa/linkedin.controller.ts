import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { JWT_SECRET } from '../../middlewares/auth.middleware';
import { generateCvImage } from '../../lib/cvImage';
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchMemberId,
  uploadImageAndPost,
} from '../../lib/linkedin';
import {
  buildDefaultShareMessage,
  fetchPortofolioData,
} from './cv.controller';

const OAUTH_PURPOSE = 'linkedin_oauth';
const TOKEN_SKEW_MS = 60 * 1000;

type ReturnTo = 'pengaturan' | 'generate-cv';

function normalizeReturnTo(value: unknown): ReturnTo {
  return value === 'pengaturan' ? 'pengaturan' : 'generate-cv';
}

function frontendReturnUrl(returnTo: ReturnTo, query: string): string {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  const path = returnTo === 'pengaturan' ? '/mahasiswa/pengaturan' : '/mahasiswa/generate-cv';
  return `${base}${path}${query}`;
}

function backendConnectUrl(returnTo: ReturnTo = 'generate-cv'): string {
  const base = process.env.BACKEND_URL || 'http://localhost:3000';
  const url = `${base}/api/mahasiswa/linkedin/connect`;
  return returnTo === 'pengaturan' ? `${url}?returnTo=pengaturan` : url;
}

function signOauthState(userId: string, returnTo: ReturnTo): string {
  return jwt.sign({ userId, purpose: OAUTH_PURPOSE, returnTo }, JWT_SECRET, { expiresIn: '10m' });
}

function verifyOauthState(state: string): { userId: string; returnTo: ReturnTo } {
  const decoded = jwt.verify(state, JWT_SECRET) as {
    userId?: string;
    purpose?: string;
    returnTo?: string;
  };
  if (decoded.purpose !== OAUTH_PURPOSE || !decoded.userId) {
    throw new Error('State OAuth tidak valid');
  }
  return {
    userId: decoded.userId,
    returnTo: normalizeReturnTo(decoded.returnTo),
  };
}

function isTokenValid(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() - TOKEN_SKEW_MS > Date.now();
}

function maskMemberId(memberId: string | null | undefined): string | null {
  if (!memberId) return null;
  if (memberId.length <= 4) return `****${memberId}`;
  return `****${memberId.slice(-4)}`;
}

// GET /api/mahasiswa/linkedin/status
export const getLinkedInStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = BigInt(req.user!.id);
    const mahasiswa = await prisma.mahasiswa.findUnique({
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
  } catch (error) {
    console.error('[getLinkedInStatus]', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil status LinkedIn' });
  }
};

// DELETE /api/mahasiswa/linkedin/disconnect
export const disconnectLinkedIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = BigInt(req.user!.id);
    const mahasiswa = await prisma.mahasiswa.findUnique({ where: { userId } });
    if (!mahasiswa) {
      res.status(404).json({ success: false, message: 'Data mahasiswa tidak ditemukan' });
      return;
    }

    await prisma.mahasiswa.update({
      where: { userId },
      data: {
        linkedinMemberId: null,
        linkedinAccessToken: null,
        linkedinTokenExpiresAt: null,
      },
    });

    res.json({ success: true, message: 'Koneksi LinkedIn diputuskan' });
  } catch (error) {
    console.error('[disconnectLinkedIn]', error);
    res.status(500).json({ success: false, message: 'Gagal memutuskan koneksi LinkedIn' });
  }
};

// GET /api/mahasiswa/linkedin/connect
export const connectLinkedIn = async (req: Request, res: Response): Promise<void> => {
  const returnTo = normalizeReturnTo(req.query.returnTo);
  try {
    const userId = req.user!.id;
    const authorizeUrl = buildAuthorizeUrl(signOauthState(userId, returnTo));
    res.redirect(302, authorizeUrl);
  } catch (error) {
    console.error(error);
    res.redirect(302, frontendReturnUrl(returnTo, '?linkedin=error'));
  }
};

// GET /api/mahasiswa/linkedin/callback — publik, dipanggil LinkedIn setelah consent
export const linkedinCallback = async (req: Request, res: Response): Promise<void> => {
  let returnTo: ReturnTo = 'generate-cv';
  try {
    const errorParam = typeof req.query.error === 'string' ? req.query.error : null;
    const state = typeof req.query.state === 'string' ? req.query.state : '';

    if (state) {
      try {
        returnTo = verifyOauthState(state).returnTo;
      } catch {
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
    const { accessToken, expiresIn } = await exchangeCodeForToken(code);
    const memberId = await fetchMemberId(accessToken);

    await prisma.mahasiswa.update({
      where: { userId: BigInt(verified.userId) },
      data: {
        linkedinMemberId: memberId,
        linkedinAccessToken: accessToken,
        linkedinTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    res.redirect(302, frontendReturnUrl(returnTo, '?linkedin=connected'));
  } catch (error) {
    console.error('[linkedinCallback]', error);
    res.redirect(302, frontendReturnUrl(returnTo, '?linkedin=error'));
  }
};

// POST /api/mahasiswa/linkedin/share
export const shareCvToLinkedIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = BigInt(req.user!.id);
    const mahasiswa = await prisma.mahasiswa.findUnique({
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

    const cvData = await fetchPortofolioData(userId);
    if (!cvData) {
      res.status(404).json({ success: false, message: 'Data portofolio tidak ditemukan' });
      return;
    }

    const rawCaption = typeof req.body?.caption === 'string' ? req.body.caption.trim() : '';
    const commentary = (rawCaption || buildDefaultShareMessage(cvData.mahasiswa.nama)).slice(0, 3000);
    console.log('[shareCvToLinkedIn] caption custom:', Boolean(rawCaption), 'panjang:', commentary.length);

    const imageBuffer = await generateCvImage({
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

    const postUrn = await uploadImageAndPost({
      accessToken: mahasiswa.linkedinAccessToken,
      memberId: mahasiswa.linkedinMemberId,
      commentary,
      imageBuffer,
    });

    res.json({ success: true, data: { postUrn, commentary } });
  } catch (error) {
    console.error('[shareCvToLinkedIn]', error);
    const message = error instanceof Error ? error.message : 'Gagal membagikan CV ke LinkedIn';
    res.status(500).json({ success: false, message });
  }
};
