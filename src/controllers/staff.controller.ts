import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { logAudit } from '../lib/auditLog';

const jabatanSchema = z.enum(['admin_ditmawa', 'pimpinan_ditmawa', 'admin_fakultas', 'pimpinan_fakultas', 'pimpinan_utama']);
const baseSchema = z.object({
  nama: z.string().trim().min(3, 'Nama minimal 3 karakter'),
  nip: z.string().trim().max(50, 'NIP maksimal 50 karakter').optional().nullable().transform((value) => value || null),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  jabatan: jabatanSchema,
  fakultasId: z.coerce.number().int().positive().optional().nullable(),
  aktif: z.boolean().default(true),
});
const createSchema = baseSchema.extend({ password: z.string().min(8, 'Password minimal 8 karakter') });
const updateSchema = baseSchema.extend({ password: z.string().min(8, 'Password minimal 8 karakter').optional().or(z.literal('')) });
const ditmawaTargets = ['pimpinan_utama', 'pimpinan_fakultas', 'admin_ditmawa'];

async function actorStaff(req: Request) {
  if (req.user?.peran !== 'staff' || !req.user.id) return null;
  return prisma.staff.findFirst({ where: { userId: BigInt(req.user.id), deletedAt: null } });
}

async function resolveScope(actor: NonNullable<Awaited<ReturnType<typeof actorStaff>>>, jabatan: string, submitted?: number | null) {
  if (actor.jabatan === 'pimpinan_ditmawa') {
    if (!ditmawaTargets.includes(jabatan)) throw Object.assign(new Error('Pimpinan Ditmawa hanya dapat mengelola akun Pimpinan Utama, Pimpinan Fakultas, atau Admin Ditmawa'), { status: 403 });
    if (jabatan !== 'pimpinan_fakultas') return null;
    if (!submitted) throw Object.assign(new Error('Fakultas wajib dipilih untuk Pimpinan Fakultas'), { status: 400 });
    return submitted;
  }
  if (actor.jabatan === 'pimpinan_fakultas') {
    if (jabatan !== 'admin_fakultas') throw Object.assign(new Error('Pimpinan Fakultas hanya dapat mengelola akun Admin Fakultas'), { status: 403 });
    if (!actor.fakultasId) throw Object.assign(new Error('Akun Anda belum terhubung ke fakultas'), { status: 400 });
    return actor.fakultasId;
  }
  throw Object.assign(new Error('Akses ditolak. Hanya Pimpinan yang dapat mengelola akun'), { status: 403 });
}

async function validateFaculty(fakultasId: number | null) {
  if (!fakultasId) return;
  const fakultas = await prisma.fakultas.findFirst({ where: { id: fakultasId, deletedAt: null } });
  if (!fakultas) throw Object.assign(new Error('Fakultas tidak ditemukan atau tidak aktif'), { status: 400 });
}

function handleError(error: any, res: Response) {
  if (error instanceof z.ZodError) return res.status(400).json({ success: false, message: error.issues.map((issue) => issue.message).join(', '), errors: error.issues });
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = String(error.meta?.target || '');
    return res.status(409).json({ success: false, message: target.includes('nip') ? 'NIP sudah digunakan' : 'Email sudah digunakan' });
  }
  return res.status(error?.status || 500).json({ success: false, message: error?.status ? error.message : 'Terjadi kesalahan server' });
}

export const createStaff = async (req: Request, res: Response) => {
  try {
    const actor = await actorStaff(req);
    if (!actor) return res.status(403).json({ success: false, message: 'Akses ditolak' });
    const body = createSchema.parse(req.body);
    const fakultasId = await resolveScope(actor, body.jabatan, body.fakultasId);
    await validateFaculty(fakultasId);
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email sudah digunakan' });
    const passwordHash = await bcrypt.hash(body.password, 10);
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { nama: body.nama, email: body.email, passwordHash, peran: 'staff', aktif: body.aktif } });
      const staff = await tx.staff.create({ data: { userId: user.id, jabatan: body.jabatan, nip: body.nip, fakultasId }, include: { fakultas: { select: { nama: true } } } });
      return { user, staff };
    });
    await logAudit({ entitas: 'user', entitasId: created.user.id, aksi: 'CREATE', statusBaru: body.aktif ? 'aktif' : 'nonaktif', aktorId: actor.userId });
    return res.status(201).json({ success: true, message: 'Akun berhasil dibuat', data: { id: created.user.id.toString(), nama: created.user.nama, email: created.user.email, nip: created.staff.nip, jabatan: created.staff.jabatan, fakultasId: created.staff.fakultasId, fakultasNama: created.staff.fakultas?.nama, aktif: created.user.aktif, createdAt: created.user.createdAt } });
  } catch (error) { return handleError(error, res); }
};

export const getStaff = async (req: Request, res: Response) => {
  try {
    const actor = await actorStaff(req);
    if (!actor) return res.status(403).json({ success: false, message: 'Akses ditolak' });
    const where = actor.jabatan === 'pimpinan_ditmawa'
      ? { jabatan: { in: ditmawaTargets as any[] }, deletedAt: null, user: { deletedAt: null } }
      : actor.jabatan === 'pimpinan_fakultas'
        ? { jabatan: 'admin_fakultas' as const, fakultasId: actor.fakultasId, deletedAt: null, user: { deletedAt: null } }
        : null;
    if (!where) return res.status(403).json({ success: false, message: 'Akses ditolak' });
    const staffs = await prisma.staff.findMany({ where, include: { user: { select: { nama: true, email: true, aktif: true, createdAt: true } }, fakultas: { select: { nama: true } } }, orderBy: { createdAt: 'desc' } });
    return res.json({ success: true, data: staffs.map((staff) => ({ id: staff.userId.toString(), nama: staff.user.nama, email: staff.user.email, jabatan: staff.jabatan, nip: staff.nip, fakultasId: staff.fakultasId, fakultasNama: staff.fakultas?.nama, aktif: staff.user.aktif, createdAt: staff.user.createdAt })) });
  } catch (error) { return handleError(error, res); }
};

export const updateStaff = async (req: Request, res: Response) => {
  try {
    const actor = await actorStaff(req);
    if (!actor) return res.status(403).json({ success: false, message: 'Akses ditolak' });
    const targetUserId = BigInt(req.params.id as string);
    const target = await prisma.staff.findFirst({ where: { userId: targetUserId, deletedAt: null, user: { deletedAt: null } } });
    if (!target) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
    if (actor.jabatan === 'pimpinan_fakultas' && (target.jabatan !== 'admin_fakultas' || target.fakultasId !== actor.fakultasId)) return res.status(403).json({ success: false, message: 'Akun berada di luar fakultas Anda' });
    if (actor.jabatan === 'pimpinan_ditmawa' && !ditmawaTargets.includes(target.jabatan)) return res.status(403).json({ success: false, message: 'Akun berada di luar kewenangan Anda' });
    const body = updateSchema.parse(req.body);
    const fakultasId = await resolveScope(actor, body.jabatan, body.fakultasId);
    await validateFaculty(fakultasId);
    const existing = await prisma.user.findFirst({ where: { email: body.email, id: { not: targetUserId } } });
    if (existing) return res.status(409).json({ success: false, message: 'Email sudah digunakan oleh akun lain' });
    const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;
    await prisma.$transaction([
      prisma.user.update({ where: { id: targetUserId }, data: { nama: body.nama, email: body.email, aktif: body.aktif, ...(passwordHash ? { passwordHash } : {}) } }),
      prisma.staff.update({ where: { userId: targetUserId }, data: { jabatan: body.jabatan, nip: body.nip, fakultasId } }),
    ]);
    await logAudit({ entitas: 'user', entitasId: targetUserId, aksi: 'UPDATE', aktorId: actor.userId });
    return res.json({ success: true, message: 'Akun berhasil diperbarui' });
  } catch (error) { return handleError(error, res); }
};
