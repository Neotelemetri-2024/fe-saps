import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import { TableCard, TableFrame } from "../../components/dashboard/TableFrame";
import KegiatanCell from "../../components/dashboard/KegiatanCell";
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
    diajukanPada: formatTanggal(item.createdAt),
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

  const columns = useMemo(() => [
    {
      key: 'no',
      label: 'NO',
      render: (_, i) => <span className="text-[#616161]">{i + 1}</span>,
    },
    {
      key: 'kegiatan',
      label: 'KEGIATAN',
      render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} />,
    },
    { key: 'namaUKMF', label: 'NAMA UKMF' },
    { key: 'jenis', label: 'JENIS' },
    { key: 'skala', label: 'SKALA' },
    { key: 'tanggal', label: 'TANGGAL' },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyle[row.status] || statusStyle.Pending}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'aksi',
      label: 'AKSI',
      stopPropagation: true,
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/admin_fakultas/verifikasi-pengajuan-ukmf/${row.id}`, { state: { item: row } })}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white"
          title="Detail dan Verifikasi"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ], [navigate]);

  return (
    <DashboardLayout
      role="admin_fakultas"
      userName={user?.nama || "Admin Fakultas"}
      userRole="Admin Fakultas"
    >
      <div className="space-y-6">
        {/* Header Halaman */}
        <div>
          <h2 className="text-xl font-extrabold text-[#222] sm:text-2xl lg:text-3xl">
            Verifikasi Pengajuan UKMF
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Verifikasi pengajuan kegiatan dari UKMF ke Pimpinan Fakultas.
          </p>
        </div>
  
        {/* Card */}
        <TableCard title="Daftar Pengajuan UKMF">
          {/* Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
  <div className="relative flex w-full sm:flex-1">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Cari kegiatan atau UKMF..."
      className="w-full rounded-lg border border-[#d9dce7] py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-dark"
    />
  </div>

  <div className="flex flex-wrap items-center gap-2">
    <select
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
      className="rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none"
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
      className="rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none"
    >
      <option value="">Semua Jenis</option>
      {[...new Set(items.map((p) => p.jenis))].map((j) => (
        <option key={j} value={j}>
          {j}
        </option>
      ))}
    </select>

    <select
      value={filterSkala}
      onChange={(e) => setFilterSkala(e.target.value)}
      className="rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none"
    >
      <option value="">Semua Skala</option>
      {[...new Set(items.map((p) => p.skala))].map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>

    {(search || filterStatus || filterJenis || filterSkala) && (
      <button
        onClick={resetFilter}
        className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]"
      >
        Reset Filter
      </button>
    )}
  </div>
</div>
  
          {/* Tabel */}
          <TableFrame>
            <DataTable
              columns={columns}
              data={filtered}
              loading={loading}
              emptyText="Tidak ada pengajuan ditemukan."
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  );
}

export default VerifikasiPengajuanUKMF;
