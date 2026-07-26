import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import { getCurrentUser } from "../../services/authService";
import { getKegiatanVerifikasi } from "../../services/kegiatanService";

const statusStyle = {
  Pending: "bg-yellow-100 text-yellow-600 border border-yellow-300",
  Disetujui: "bg-green-100 text-green-700 border border-green-300",
  Ditolak: "bg-red-100 text-red-600 border border-red-300",
  Revisi: "bg-orange-100 text-orange-600 border border-orange-300",
  Diteruskan: "bg-blue-100 text-blue-700 border border-blue-300",
};

function mapStatusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (["diajukan"].includes(s)) return "Pending";
  if (["terverifikasi"].includes(s)) return "Diteruskan";
  if (["disetujui", "terpublikasi"].includes(s)) return "Disetujui";
  if (s === "ditolak") return "Ditolak";
  if (["perlu_revisi", "revisi"].includes(s)) return "Revisi";
  return status || "Pending";
}

function formatTanggal(start, end) {
  if (!start) return "-";
  try {
    const a = new Date(start).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!end) return a;
    const b = new Date(end).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${a} – ${b}`;
  } catch {
    return String(start);
  }
}

function normalizeItem(item) {
  return {
    id: item.id,
    kegiatan: item.nama || "-",
    subKegiatan: item.pembuat?.nama || "",
    namaUKMF: item.organisasi?.nama || "-",
    jenis: item.kategori?.nama || "-",
    skala: item.skala?.nama || "-",
    tanggal: formatTanggal(item.tanggalMulai, item.tanggalSelesai),
    status: mapStatusLabel(item.status),
  };
}

function VerifikasiPengajuanUKMF() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterSkala, setFilterSkala] = useState("");

  useEffect(() => {
    getKegiatanVerifikasi({ limit: 50 })
      .then((data) => setItems(Array.isArray(data) ? data.map(normalizeItem) : []))
      .catch((err) => {
        setItems([]);
        toast.error("Gagal memuat pengajuan", { description: err.message });
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = items.filter((p) => {
    const q = search.trim().toLowerCase();
    if (q && !p.kegiatan.toLowerCase().includes(q) && !p.namaUKMF.toLowerCase().includes(q)) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterJenis && p.jenis !== filterJenis) return false;
    if (filterSkala && p.skala !== filterSkala) return false;
    return true;
  });

  const resetFilter = () => {
    setSearch("");
    setFilterStatus("");
    setFilterJenis("");
    setFilterSkala("");
  };

  return (
    <DashboardLayout
      role="admin_fakultas"
      userName={user?.nama || "Admin Fakultas"}
      userRole="Admin Fakultas"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark sm:text-2xl lg:text-3xl">
            Verifikasi Pengajuan UKMF
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Verifikasi pengajuan kegiatan dari UKMF ke Pimpinan Fakultas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kegiatan atau UKMF..."
              className="w-full rounded-lg border border-[#d1d5db] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
            />
          </div>

          <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            <Filter className="h-4 w-4" /> Filter
          </button>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none focus:border-brand-dark"
          >
            <option value="">Semua Status</option>
            <option value="Pending">Pending</option>
            <option value="Diteruskan">Diteruskan</option>
            <option value="Disetujui">Disetujui</option>
            <option value="Ditolak">Ditolak</option>
            <option value="Revisi">Revisi</option>
          </select>

          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none focus:border-brand-dark"
          >
            <option value="">Semua Jenis</option>
            {[...new Set(items.map((p) => p.jenis))].map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>

          <select
            value={filterSkala}
            onChange={(e) => setFilterSkala(e.target.value)}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#444] outline-none focus:border-brand-dark"
          >
            <option value="">Semua Skala</option>
            {[...new Set(items.map((p) => p.skala))].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button
            onClick={resetFilter}
            className="rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm text-[#616161] transition hover:bg-[#f5f5f5]"
          >
            Reset Filter
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-brand-dark to-brand-light text-white">
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NO</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">KEGIATAN</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">NAMA UKMF</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">JENIS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">SKALA</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">TANGGAL</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">STATUS</th>
                  <th className="px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wide">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-[#9aa0a6]">Memuat data…</td>
                  </tr>
                ) : filtered.map((p, i) => (
                  <tr key={p.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3.5 text-[#616161]">{i + 1}.</td>
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-[#222]">{p.kegiatan}</p>
                      {p.subKegiatan && (
                        <p className="text-xs text-[#9aa0a6]">{p.subKegiatan}</p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.namaUKMF}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.jenis}</td>
                    <td className="px-4 py-3.5 text-[#616161]">{p.skala}</td>
                    <td className="px-4 py-3.5 text-[#616161] whitespace-nowrap">{p.tanggal}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[p.status] || statusStyle.Pending}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(`/admin_fakultas/verifikasi-pengajuan-ukmf/${p.id}`, { state: { item: p } })
                        }
                        className="group inline-flex items-center justify-center rounded-lg border border-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-dark transition-all duration-200 hover:bg-brand-dark hover:!text-white"
                      >
                        Detail dan Verifikasi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-[#9aa0a6]">
              Tidak ada pengajuan ditemukan.
            </div>
          )}
          <div className="flex flex-col gap-3 border-t border-[#f0f0f0] px-6 py-3 text-xs text-[#888] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing 1 – {filtered.length} from Total {items.length}</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default VerifikasiPengajuanUKMF;
