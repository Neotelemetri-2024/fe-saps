/**
 * KegiatanCell — sel kolom "Kegiatan" yang menampilkan nama kegiatan
 * dan tanggal pengajuan ("Diajukan: …") di bawahnya.
 *
 * Props:
 *   nama     string — nama kegiatan (fallback '-')
 *   tanggal  string — tanggal diajukan, SUDAH dalam format tampilan
 *                     (bukan ISO mentah). Jika tidak ada, baris tanggal disembunyikan.
 */
function KegiatanCell({ nama, tanggal }) {
  const showTanggal = tanggal && tanggal !== '-'
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-black">{nama || '-'}</p>
      {showTanggal && <p className="text-xs text-[#616161]">Diajukan: {tanggal}</p>}
    </div>
  )
}

export default KegiatanCell
