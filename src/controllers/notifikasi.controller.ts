import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ==================== NOTIFIKASI ====================

// GET /api/notifikasi?userId=X — Daftar notifikasi pengguna
export const getNotifikasi = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.query.userId as string);
    const { dibaca } = req.query;
    const where: any = { userId };
    if (dibaca !== undefined) where.dibaca = dibaca === 'true';

    const data = await prisma.notifikasi.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notifikasi.count({
      where: { userId, dibaca: false },
    });

    res.json({ success: true, data, unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/notifikasi/:id/baca — Tandai notifikasi sebagai sudah dibaca
export const bacaNotifikasi = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.notifikasi.update({
      where: { id: BigInt(id) },
      data: { dibaca: true },
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// PUT /api/notifikasi/baca-semua — Tandai semua notifikasi sebagai dibaca
export const bacaSemuaNotifikasi = async (req: Request, res: Response) => {
  try {
    const userId = BigInt(req.body.userId);
    await prisma.notifikasi.updateMany({
      where: { userId, dibaca: false },
      data: { dibaca: true },
    });
    res.json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};

// ==================== AUDIT LOG ====================

// GET /api/audit-log — Daftar audit log (filter: entitas, aktorId)
export const getAuditLog = async (req: Request, res: Response) => {
  try {
    const { entitas, aktorId, aksi } = req.query;
    const where: any = {};
    if (entitas) where.entitas = entitas as string;
    if (aktorId) where.aktorId = BigInt(aktorId as string);
    if (aksi) where.aksi = { contains: aksi as string };

    const data = await prisma.auditLog.findMany({
      where,
      include: {
        aktor: { select: { id: true, nama: true, peran: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
  }
};
