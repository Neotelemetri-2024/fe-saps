import { Request, Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import {
  calculateIku3Dashboard,
  calculateIku3Faculties,
  calculateIku3Trend,
  calculateIku3QuarterlyTrend,
  getIku3ActivitiesDetail,
  Iku3Filter,
} from '../../services/iku3/iku3Calculation.service';
import { generateIku3ExcelReport } from '../../services/iku3/iku3Excel.service';

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

// GET /api/iku3/trend/quarterly
export const getQuarterlyTrendIku3 = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { enforcedFakultasId } = await resolveRoleAndScope(req);
    const { tahun, fakultasId, prodiId } = req.query;

    const targetTahun = tahun ? Number(tahun) : new Date().getFullYear();
    const targetFakultasId = enforcedFakultasId ?? (fakultasId ? Number(fakultasId) : undefined);
    const targetProdiId = prodiId ? Number(prodiId) : undefined;

    const data = await calculateIku3QuarterlyTrend(targetTahun, targetFakultasId, targetProdiId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('[getQuarterlyTrendIku3]', error);
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
      data: targets.map((t: any) => ({
        id: t.id,
        tahun: t.tahun,
        targetPersen: Number(t.targetPersen),
        targetTw1: t.targetTw1 != null ? Number(t.targetTw1) : null,
        targetTw2: t.targetTw2 != null ? Number(t.targetTw2) : null,
        targetTw3: t.targetTw3 != null ? Number(t.targetTw3) : null,
        targetTw4: t.targetTw4 != null ? Number(t.targetTw4) : null,
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
    const { tahun, targetPersen, targetTw1, targetTw2, targetTw3, targetTw4, keterangan } = req.body;
    const userId = req.user?.id ? BigInt(req.user.id) : null;

    if (!tahun || targetPersen === undefined) {
      res.status(400).json({
        success: false,
        message: 'Tahun dan targetPersen wajib diisi.',
      });
      return;
    }

    const payload = {
      targetPersen: Number(targetPersen),
      targetTw1: targetTw1 !== undefined && targetTw1 !== null && targetTw1 !== '' ? Number(targetTw1) : null,
      targetTw2: targetTw2 !== undefined && targetTw2 !== null && targetTw2 !== '' ? Number(targetTw2) : null,
      targetTw3: targetTw3 !== undefined && targetTw3 !== null && targetTw3 !== '' ? Number(targetTw3) : null,
      targetTw4: targetTw4 !== undefined && targetTw4 !== null && targetTw4 !== '' ? Number(targetTw4) : null,
      keterangan: keterangan || null,
      diubahOleh: userId,
      deletedAt: null,
    };

    const upserted = await prisma.iku3Target.upsert({
      where: { tahun: Number(tahun) },
      update: payload,
      create: {
        tahun: Number(tahun),
        ...payload,
      },
    });

    res.status(200).json({
      success: true,
      message: `Target IKU 3 tahun ${tahun} berhasil disimpan.`,
      data: {
        tahun: upserted.tahun,
        targetPersen: Number(upserted.targetPersen),
        targetTw1: upserted.targetTw1 != null ? Number(upserted.targetTw1) : null,
        targetTw2: upserted.targetTw2 != null ? Number(upserted.targetTw2) : null,
        targetTw3: upserted.targetTw3 != null ? Number(upserted.targetTw3) : null,
        targetTw4: upserted.targetTw4 != null ? Number(upserted.targetTw4) : null,
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
    const { bobot, sksMin, sksMax, keterangan, aktif } = req.body;
    const userId = req.user?.id ? BigInt(req.user.id) : null;

    if (bobot === undefined) {
      res.status(400).json({ success: false, message: 'Nilai bobot wajib diisi.' });
      return;
    }

    const minVal = sksMin !== undefined ? (sksMin === null || sksMin === '' ? null : Number(sksMin)) : undefined;
    const maxVal = sksMax !== undefined ? (sksMax === null || sksMax === '' ? null : Number(sksMax)) : undefined;

    if (minVal !== undefined && minVal !== null && minVal < 0) {
      res.status(400).json({ success: false, message: 'SKS minimal tidak boleh bernilai negatif.' });
      return;
    }
    if (maxVal !== undefined && maxVal !== null && maxVal < 0) {
      res.status(400).json({ success: false, message: 'SKS maksimal tidak boleh bernilai negatif.' });
      return;
    }
    if (minVal !== undefined && minVal !== null && maxVal !== undefined && maxVal !== null && minVal > maxVal) {
      res.status(400).json({ success: false, message: 'SKS minimal tidak boleh lebih besar dari SKS maksimal.' });
      return;
    }

    const updateData: any = {
      bobot: Number(bobot),
      keterangan: keterangan !== undefined ? keterangan : undefined,
      aktif: aktif !== undefined ? Boolean(aktif) : undefined,
      diubahOleh: userId,
    };
    if (minVal !== undefined) updateData.sksMin = minVal;
    if (maxVal !== undefined) updateData.sksMax = maxVal;

    const updated = await prisma.iku3BobotRule.update({
      where: { id: Number(id) },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Aturan bobot berhasil diperbarui.',
      data: {
        id: updated.id,
        bobot: Number(updated.bobot),
        sksMin: updated.sksMin,
        sksMax: updated.sksMax,
        keterangan: updated.keterangan,
        aktif: updated.aktif,
      },
    });
  } catch (error) {
    console.error('[updateRuleIku3]', error);
    next(error);
  }
};

// GET /api/iku3/export — Download Laporan IKU 3 Format Excel (.xlsx)
export const exportIku3Excel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { tahun, triwulan, fakultasId, prodiId } = req.query;
    const { enforcedFakultasId } = await resolveRoleAndScope(req);

    const filter: Iku3Filter = {
      tahun: tahun ? Number(tahun) : undefined,
      triwulan: triwulan ? Number(triwulan) : undefined,
      fakultasId: enforcedFakultasId ?? (fakultasId ? Number(fakultasId) : undefined),
      prodiId: prodiId ? Number(prodiId) : undefined,
    };

    const buffer = await generateIku3ExcelReport(filter);

    const safeTahun = filter.tahun || new Date().getFullYear();
    const twLabel = filter.triwulan ? `_TW${filter.triwulan}` : '';
    const filename = `Laporan_IKU3_${safeTahun}${twLabel}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('[exportIku3Excel]', error);
    next(error);
  }
};

