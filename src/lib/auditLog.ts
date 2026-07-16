import prisma from './prisma';

interface AuditLogInput {
  entitas: string;
  entitasId: bigint | number | string;
  aksi: string;
  statusLama?: string | null;
  statusBaru?: string | null;
  aktorId?: bigint | number | null;
}

/**
 * Helper: Mencatat setiap transisi status ke tabel audit_log [BR-027]
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        entitas: input.entitas,
        entitasId: BigInt(input.entitasId),
        aksi: input.aksi,
        statusLama: input.statusLama ?? null,
        statusBaru: input.statusBaru ?? null,
        aktorId: input.aktorId ? BigInt(input.aktorId) : null,
      },
    });
  } catch (error) {
    console.error('[AuditLog] Gagal mencatat audit log:', error);
    // Jangan throw — audit log failure tidak boleh menggagalkan transaksi utama
  }
}
