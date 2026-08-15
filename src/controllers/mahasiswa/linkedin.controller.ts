import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
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
  buildPublicCvUrl,
  fetchPortofolioData,
} from './cv.controller';

const OAUTH_PURPOSE = 'linkedin_oauth';
const TOKEN_SKEW_MS = 60 * 1000;

function frontendGenerateCvUrl(query: string): string {
  const base = process.env.FRONTEND_URL || 'http://localhost:5173';
  return `${base}/mahasiswa/generate-cv${query}`;
}

function backendConnectUrl(): string {
  const base = process.env.BACKEND_URL || 'http://localhost:3000';
  return `${base}/api/mahasiswa/linkedin/connect`;
}

function signOauthState(userId: string): string {
  return jwt.sign({ userId, purpose: OAUTH_PURPOSE }, JWT_SECRET, { expiresIn: '10m' });
}

function verifyOauthState(state: string): string {
  const decoded = jwt.verify(state, JWT_SECRET) as { userId?: string; purpose?: string };
  if (decoded.purpose !== OAUTH_PURPOSE || !decoded.userId) {
    throw new Error('State OAuth tidak valid');
  }
  return decoded.userId;
}

function isTokenValid(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() - TOKEN_SKEW_MS > Date.now();
}

// GET /api/mahasiswa/linkedin/connect
export const connectLinkedIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const authorizeUrl = buildAuthorizeUrl(signOauthState(userId));
    res.redirect(302, authorizeUrl);
  } catch (error) {
    console.error(error);
    res.redirect(302, frontendGenerateCvUrl('?linkedin=error'));
  }
};

// GET /api/mahasiswa/linkedin/callback — publik, dipanggil LinkedIn setelah consent
export const linkedinCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const errorParam = typeof req.query.error === 'string' ? req.query.error : null;
    if (errorParam) {
      res.redirect(302, frontendGenerateCvUrl('?linkedin=denied'));
      return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!code || !state) {
      res.redirect(302, frontendGenerateCvUrl('?linkedin=error'));
      return;
    }

    const userId = verifyOauthState(state);
    const { accessToken, expiresIn } = await exchangeCodeForToken(code);
    const memberId = await fetchMemberId(accessToken);

    await prisma.mahasiswa.update({
      where: { userId: BigInt(userId) },
      data: {
        linkedinMemberId: memberId,
        linkedinAccessToken: accessToken,
        linkedinTokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    res.redirect(302, frontendGenerateCvUrl('?linkedin=connected'));
  } catch (error) {
    console.error('[linkedinCallback]', error);
    res.redirect(302, frontendGenerateCvUrl('?linkedin=error'));
  }
};

async function ensurePublicCvToken(userId: bigint): Promise<string> {
  const existing = await prisma.mahasiswa.findUnique({
    where: { userId },
    select: { publicCvToken: true },
  });
  if (existing?.publicCvToken) return existing.publicCvToken;

  const token = crypto.randomUUID();
  await prisma.mahasiswa.update({
    where: { userId },
    data: { publicCvToken: token },
  });
  return token;
}

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
        connectUrl: backendConnectUrl(),
        message: 'Hubungkan akun LinkedIn terlebih dahulu',
      });
      return;
    }

    const cvData = await fetchPortofolioData(userId);
    if (!cvData) {
      res.status(404).json({ success: false, message: 'Data portofolio tidak ditemukan' });
      return;
    }

    const publicToken = await ensurePublicCvToken(userId);
    const commentary = `${buildDefaultShareMessage(cvData.mahasiswa.nama)}\n\n${buildPublicCvUrl(publicToken)}`;

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

    res.json({ success: true, data: { postUrn } });
  } catch (error) {
    console.error('[shareCvToLinkedIn]', error);
    const message = error instanceof Error ? error.message : 'Gagal membagikan CV ke LinkedIn';
    res.status(500).json({ success: false, message });
  }
};

