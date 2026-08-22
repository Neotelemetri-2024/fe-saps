/**
 * MahasiswaIdentityCell — sel kolom identitas mahasiswa (nama + NIM + prodi).
 *
 * Style baku:
 *   Nama  — bold, uppercase, hitam
 *   NIM   — hitam biasa, tidak bold
 *   Prodi — hitam biasa, tidak bold
 */
function MahasiswaIdentityCell({ nama, nim, prodi }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="font-bold uppercase text-black">{nama || '-'}</p>
      {nim ? <p className="text-sm font-normal text-black">{nim}</p> : null}
      {prodi ? <p className="text-sm font-normal text-black">{prodi}</p> : null}
    </div>
  )
}

export default MahasiswaIdentityCell
