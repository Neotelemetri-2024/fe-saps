import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import DashboardLayout from '../../components/dashboard/DashboardLayout'
import { getCurrentUser } from '../../services/authService'
import { getPortofolio } from '../../services/dashboardService'
import logoUnand from '../../assets/logo_unand.png'

function GenerateSertifikat() {
  const user = getCurrentUser()
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mahasiswa, setMahasiswa] = useState({
    nama: user?.nama || 'Mahasiswa',
    nim: '-',
    prodi: '-',
    fakultas: '-',
    totalPoin: 0,
    totalKegiatan: 0,
  })

  useEffect(() => {
    const userId = user?.id
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    getPortofolio(userId)
      .then((data) => {
        const mhs = data?.mahasiswa || {}
        const ringkasan = data?.ringkasan || {}
        setMahasiswa({
          nama: mhs.nama || user?.nama || 'Mahasiswa',
          nim: mhs.nim || '-',
          prodi: mhs.prodi || '-',
          fakultas: mhs.fakultas || '-',
          totalPoin: ringkasan.totalPoin ?? 0,
          totalKegiatan: ringkasan.totalKegiatan ?? 0,
        })
      })
      .catch((err) => {
        toast.error('Gagal memuat data mahasiswa', { description: err.message })
      })
      .finally(() => setLoading(false))
  }, [user?.id, user?.nama])

  const handleDownloadPdf = () => {
    window.print()
  }

  const tanggalCetak = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <DashboardLayout role="mahasiswa" userName={user?.nama || 'Mahasiswa'} userRole="Mahasiswa">
      <div className="space-y-6">
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setGenerated(true)}
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Memuat data…' : 'Generate Sertifikat'}
          </button>
          <p className="text-sm text-[#616161]">
            Buat sertifikat capaian kegiatan kemahasiswaan Anda berdasarkan data yang tercatat di SAPS.
          </p>
        </div>

        {generated && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>

            <div
              id="sertifikat-print-area"
              className="mx-auto w-full max-w-[210mm] border-[10px] border-double border-brand-dark bg-white px-10 py-12 shadow-lg"
              style={{ fontFamily: "'Times New Roman', Times, serif", color: '#111827' }}
            >
              <div className="flex flex-col items-center text-center">
                <img src={logoUnand} alt="Universitas Andalas" className="mb-4 h-16 w-auto object-contain" />
                <p className="text-sm font-semibold tracking-[0.2em] text-brand-dark uppercase">
                  Universitas Andalas
                </p>
                <p className="mt-1 text-xs text-[#616161]">Direktorat Kemahasiswaan</p>

                <h1 className="mt-8 text-3xl font-bold tracking-wide text-brand-dark uppercase">
                  Sertifikat
                </h1>
                <p className="mt-2 text-sm text-[#616161]">
                  Diberikan kepada
                </p>

                <p className="mt-4 text-2xl font-bold text-[#111827]">{mahasiswa.nama}</p>
                <p className="mt-1 text-sm text-[#374151]">NIM: {mahasiswa.nim}</p>
                <p className="mt-0.5 text-sm text-[#374151]">
                  {[mahasiswa.prodi, mahasiswa.fakultas].filter((v) => v && v !== '-').join(' — ')}
                </p>

                <p className="mt-8 max-w-xl text-sm leading-relaxed text-[#374151]">
                  Telah menyelesaikan dan mencatatkan kegiatan kemahasiswaan melalui Sistem Akademik Poin Sistem (SAPS)
                  Universitas Andalas dengan rekapitulasi sebagai berikut.
                </p>

                <div className="mt-6 grid w-full max-w-md grid-cols-2 gap-4 text-sm">
                  <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-[#9aa0a6]">Total Poin</p>
                    <p className="mt-1 text-xl font-bold text-brand-dark">{mahasiswa.totalPoin}</p>
                  </div>
                  <div className="rounded-lg border border-[#e5e7eb] px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-[#9aa0a6]">Total Kegiatan</p>
                    <p className="mt-1 text-xl font-bold text-brand-dark">{mahasiswa.totalKegiatan}</p>
                  </div>
                </div>

                <p className="mt-10 text-sm text-[#616161]">
                  Padang, {tanggalCetak}
                </p>
                <p className="mt-8 text-xs text-[#9aa0a6]">
                  Diverifikasi oleh Direktorat Kemahasiswaan Universitas Andalas
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default GenerateSertifikat
