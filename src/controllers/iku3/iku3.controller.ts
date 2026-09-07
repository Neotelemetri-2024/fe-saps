import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import {
  calculateIku3Dashboard,
  calculateIku3Faculties,
  calculateIku3Trend,
  getIku3ActivitiesDetail,
  Iku3Filter,
} from '../../services/iku3/iku3Calculation.service';

/**
 * Helper: Ambil role efektif dan enforce isolasi fakultas
 */
async function resolveRoleAndScope(req: Request): Promise<{ effectiveRole: string; enforcedFakultasId?: number }> {
  const user = req.user;
  const effectiveRole = user?.peran === 'staff' && user?.jabatan ? user.jabatan : user?.peran || '';

  let enforcedFakultasId: number | undefined = undefined;
  if (effectiveRole === 'pimpinan_fakultas' || effectiveRole === 'admin_fakultas') {
    if (user?.id) {
      const staff = await prisma.staff.findUnique({
        where: { userId: BigInt(user.id) },
        select: { fakultasId: true },
      });
      enforcedFakultasId = staff?.fakultasId ?? undefined;
    }
  }

  return { effectiveRole, enforcedFakultasId };
}

// GET /api/iku3/dashboard
export const getDashboardIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { effectiveRole, enforcedFakultasId } = await resolveRoleAndScope(req);
    const { tahun, triwulan, fakultasId, prodiId } = req.query;

    const filter: Iku3Filter = {
      tahun: tahun ? Number(tahun) : undefined,
      triwulan: triwulan ? Number(triwulan) : undefined,
      fakultasId: enforcedFakultasId ?? (fakultasId ? Number(fakultasId) : undefined),
      prodiId: prodiId ? Number(prodiId) : undefined,
    };

    const data = await calculateIku3Dashboard(filter);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[getDashboardIku3]', error);
    next(error);
  }
};

// GET /api/iku3/trend
export const getTrendIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { enforcedFakultasId } = await resolveRoleAndScope(req);
    const { fakultasId } = req.query;

    const targetFakultasId = enforcedFakultasId ?? (fakultasId ? Number(fakultasId) : undefined);
    const data = await calculateIku3Trend(targetFakultasId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[getTrendIku3]', error);
    next(error);
  }
};

// GET /api/iku3/faculties
export const getFacultiesIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tahun, triwulan } = req.query;
    const targetTahun = tahun ? Number(tahun) : new Date().getFullYear();
    const targetTriwulan = triwulan ? Number(triwulan) : undefined;

    const data = await calculateIku3Faculties(targetTahun, targetTriwulan);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[getFacultiesIku3]', error);
    next(error);
  }
};

// GET /api/iku3/activities
export const getActivitiesIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { enforcedFakultasId } = await resolveRoleAndScope(req);
    const { tahun, triwulan, fakultasId, prodiId, search, page, limit } = req.query;

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host');
    const baseUrl = process.env.BACKEND_URL || (host ? `${protocol}://${host}` : '');

    const result = await getIku3ActivitiesDetail({
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
  } catch (error) {
    console.error('[getActivitiesIku3]', error);
    next(error);
  }
};

// GET /api/iku3/targets — Ambil Daftar Target Tahunan
export const getTargetsIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targets = await prisma.iku3Target.findMany({
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
  } catch (error) {
    console.error('[getTargetsIku3]', error);
    next(error);
  }
};

// POST /api/iku3/targets — Tetapkan / Ubah Target Tahunan (Khusus Ditmawa)
export const upsertTargetIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const upserted = await prisma.iku3Target.upsert({
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
  } catch (error) {
    console.error('[upsertTargetIku3]', error);
    next(error);
  }
};

// GET /api/iku3/rules — Ambil Aturan Bobot Dinamis
export const getRulesIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jenis } = req.query;
    const whereClause: any = { aktif: true, deletedAt: null };
    if (jenis) whereClause.jenis = String(jenis);

    const rules = await prisma.iku3BobotRule.findMany({
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
  } catch (error) {
    console.error('[getRulesIku3]', error);
    next(error);
  }
};

// PUT /api/iku3/rules/:id — Ubah Bobot Aturan Dinamis (Super Admin)
export const updateRuleIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { bobot, keterangan, aktif } = req.body;
    const userId = req.user?.id ? BigInt(req.user.id) : null;

    if (bobot === undefined) {
      res.status(400).json({ success: false, message: 'Nilai bobot wajib diisi.' });
      return;
    }

    const updated = await prisma.iku3BobotRule.update({
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
  } catch (error) {
    console.error('[updateRuleIku3]', error);
    next(error);
  }
};
