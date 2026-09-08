import prisma from '../src/lib/prisma';
import { resolveMatriksMahasiswa, filterKegiatanCapaianForKurikulum } from '../src/services/kurikulumResolver.service';

async function main() {
  const parts = await prisma.partisipasi.findMany({
    where: {
      kegiatan: { asal: { in: ['kurikuler_ukm', 'kurikuler_ukmf', 'universitas'] } },
      kehadiran: true,
      peranVerifId: { not: null },
      izinPA: { some: { status: 'disetujui' } },
    },
    include: {
      mahasiswa: { select: { nim: true, angkatan: true, kurikulumId: true, user: { select: { nama: true } } } },
      peranVerif: { select: { id: true, nama: true } },
      izinPA: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
      klaimPoin: { include: { perolehanPoin: { select: { status: true, totalPoin: true, id: true } } } },
      kegiatan: {
        select: {
          id: true,
          nama: true,
          kategoriId: true,
          skalaId: true,
          kurikulumId: true,
          asal: true,
        },
      },
    },
    orderBy: { id: 'desc' },
    take: 50,
  });

  console.log('candidates', parts.length);
  for (const p of parts) {
    const izin = p.izinPA[0]?.status;
    const klaim = p.klaimPoin?.perolehanPoin?.status;
    const siap = izin === 'disetujui' && klaim !== 'sah';
    if (!siap) {
      console.log(JSON.stringify({ partId: p.id.toString(), nim: p.mahasiswa?.nim, kegiatan: p.kegiatan?.nama, izin, klaim, note: 'sudah cair / izin bukan terbaru disetujui' }));
      continue;
    }

    let diagnosis: any = {};
    try {
      const { kurikulum, matriks } = await resolveMatriksMahasiswa(p.mahasiswaId, {
        kategoriId: p.kegiatan.kategoriId,
        skalaId: p.kegiatan.skalaId,
        peranId: p.peranVerifId!,
      });
      diagnosis.kurikulumId = kurikulum?.id;
      diagnosis.kurikulumNama = kurikulum?.nama;
      diagnosis.matriksPoin = matriks?.poin ?? null;
      if (!matriks) {
        diagnosis.blocker = 'matriks_tidak_ada';
      } else {
        try {
          const mappings = await filterKegiatanCapaianForKurikulum(p.kegiatan.id, kurikulum.id);
          const sum = mappings.reduce((s: number, m: any) => s + Number(m.alokasiPersen), 0);
          diagnosis.mappingCount = mappings.length;
          diagnosis.mappingSum = sum;
          diagnosis.blocker = mappings.length === 0 ? 'mapping_kosong' : (sum !== 100 ? `mapping_bukan_100(${sum})` : null);
        } catch (e: any) {
          diagnosis.blocker = 'mapping_error';
          diagnosis.mappingError = e?.message;
        }
      }
    } catch (e: any) {
      diagnosis.blocker = 'resolve_kurikulum_error';
      diagnosis.error = e?.message;
      diagnosis.code = e?.code;
    }

    console.log(JSON.stringify({
      partId: p.id.toString(),
      nim: p.mahasiswa?.nim,
      nama: p.mahasiswa?.user?.nama,
      kegiatan: p.kegiatan?.nama,
      kegiatanId: p.kegiatan.id,
      peran: p.peranVerif?.nama,
      peranId: p.peranVerifId,
      kategoriId: p.kegiatan.kategoriId,
      skalaId: p.kegiatan.skalaId,
      mhsKurikulumId: p.mahasiswa?.kurikulumId,
      angkatan: p.mahasiswa?.angkatan,
      klaimStatus: klaim ?? null,
      hasKlaimRow: !!p.klaimPoin,
      ...diagnosis,
    }));
  }
}
main().catch(console.error);
