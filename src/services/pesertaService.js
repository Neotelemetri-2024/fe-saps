import { getPesertaKegiatan, updatePesertaKegiatan, submitPoinPeserta } from './kegiatanService'

export async function getPesertaByKegiatanId(kegiatanId) {
  return getPesertaKegiatan(kegiatanId)
}

export async function updateKehadiran(kegiatanId, pesertaId, hadir, peranVerifId) {
  const payload = {
    partisipasiId: pesertaId,
    hadir: hadir === true || hadir === 'Hadir',
  }
  if (peranVerifId != null && peranVerifId !== '') {
    payload.peranVerifId = Number(peranVerifId)
  }
  return updatePesertaKegiatan(kegiatanId, [payload])
}

/** @param {number|string} peranVerifId ID peran dari matriks (bukan nama string) */
export async function updatePeran(kegiatanId, pesertaId, peranVerifId, hadir) {
  return updatePesertaKegiatan(kegiatanId, [{
    partisipasiId: pesertaId,
    hadir: hadir === true || hadir === 'Hadir',
    peranVerifId: Number(peranVerifId),
  }])
}

export async function submitKlaimPoin(kegiatanId) {
  return submitPoinPeserta(kegiatanId)
}
