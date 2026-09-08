import { Request, Response } from "express";
import prisma from "../../lib/prisma";

function getAuthUserId(req: Request): bigint | null {
  const fromToken = req.user?.id;
  if (fromToken) return BigInt(fromToken);
  const fromQuery = req.query.userId;
  if (fromQuery) return BigInt(String(fromQuery));
  const fromBody = (req.body as { userId?: string | number })?.userId;
  if (fromBody != null) return BigInt(fromBody);
  return null;
}

// GET /api/umum/notifikasi — Daftar notifikasi pengguna login
export const getNotifikasi = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User tidak terautentikasi" });
      return;
    }

    const { dibaca } = req.query;
    const where: { userId: bigint; dibaca?: boolean } = { userId };
    if (dibaca !== undefined) where.dibaca = dibaca === "true";

    const data = await prisma.notifikasi.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const unreadCount = await prisma.notifikasi.count({
      where: { userId, dibaca: false },
    });

    // Kumpulkan refId untuk query status entitas terkait
    const kegiatanIds = data
      .filter((n) => n.refType === "kegiatan" && n.refId != null)
      .map((n) => Number(n.refId));

    const klaimIds = data
      .filter((n) => n.refType === "klaim_poin" && n.refId != null)
      .map((n) => BigInt(n.refId!));

    const izinIds = data
      .filter((n) => n.refType === "izin_pa" && n.refId != null)
      .map((n) => BigInt(n.refId!));

    // Lookup status entitas terkini
    const [kegiatans, klaims, izins] = await Promise.all([
      kegiatanIds.length > 0
        ? prisma.kegiatan.findMany({
            where: { id: { in: kegiatanIds } },
            select: { id: true, status: true },
          })
        : Promise.resolve([]),
      klaimIds.length > 0
        ? prisma.klaimPoin.findMany({
            where: { id: { in: klaimIds } },
            select: { id: true, status: true },
          })
        : Promise.resolve([]),
      izinIds.length > 0
        ? prisma.izinPA.findMany({
            where: { id: { in: izinIds } },
            select: { id: true, status: true },
          })
        : Promise.resolve([]),
    ]);

    const kegiatanStatusMap = new Map(kegiatans.map((k) => [k.id, k.status]));
    const klaimStatusMap = new Map(klaims.map((k) => [k.id.toString(), k.status]));
    const izinStatusMap = new Map(izins.map((i) => [i.id.toString(), i.status]));

    // BigInt → string agar JSON aman, sertakan refStatus
    const normalized = data.map((n) => {
      let refStatus: string | null = null;
      if (n.refType === "kegiatan" && n.refId != null) {
        refStatus = kegiatanStatusMap.get(Number(n.refId)) || null;
      } else if (n.refType === "klaim_poin" && n.refId != null) {
        refStatus = klaimStatusMap.get(n.refId.toString()) || null;
      } else if (n.refType === "izin_pa" && n.refId != null) {
        refStatus = izinStatusMap.get(n.refId.toString()) || null;
      }

      return {
        ...n,
        id: String(n.id),
        userId: String(n.userId),
        refId: n.refId != null ? String(n.refId) : null,
        refStatus,
      };
    });

    res.json({ success: true, data: normalized, unreadCount });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server" });
  }
};

// PUT /api/umum/notifikasi/:id/baca
export const bacaNotifikasi = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User tidak terautentikasi" });
      return;
    }

    const id = BigInt(req.params.id as string);
    const existing = await prisma.notifikasi.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      res
        .status(404)
        .json({ success: false, message: "Notifikasi tidak ditemukan" });
      return;
    }

    const updated = await prisma.notifikasi.update({
      where: { id },
      data: { dibaca: true },
    });

    res.json({
      success: true,
      data: {
        ...updated,
        id: String(updated.id),
        userId: String(updated.userId),
        refId: updated.refId != null ? String(updated.refId) : null,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server" });
  }
};

// PUT /api/umum/notifikasi/baca-semua
export const bacaSemuaNotifikasi = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: "User tidak terautentikasi" });
      return;
    }

    await prisma.notifikasi.updateMany({
      where: { userId, dibaca: false },
      data: { dibaca: true },
    });
    res.json({ success: true, message: "Semua notifikasi ditandai dibaca" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server" });
  }
};

// ==================== AUDIT LOG ====================

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
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan pada server" });
  }
};
