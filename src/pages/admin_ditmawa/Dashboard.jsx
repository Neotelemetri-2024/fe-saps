import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import StatCard from "../../components/dashboard/StatCard";
import StatusBadge from "../../components/dashboard/StatusBadge";
import DataTable from "../../components/dashboard/DataTable";
import { TableCard, TableFrame } from "../../components/dashboard/TableFrame";
import PanduanCard from "../../components/dashboard/PanduanCard";
import { getCurrentUser } from "../../services/authService";
import { getDashboardAdminDitmawa } from "../../services/dashboardService";
import KegiatanCell from "../../components/dashboard/KegiatanCell";

function formatTanggal(start, end) {
  if (!start) return "-";
  try {
    const ds = new Date(start);
    if (Number.isNaN(ds.getTime())) return "-";
    const a = ds.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    if (!end) return a;
    const de = new Date(end);
    if (Number.isNaN(de.getTime())) return a;
    const b = de.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${a} - ${b}`;
  } catch {
    return String(start);
  }
}

function AdminDitmawaDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [stats, setStats] = useState([
    { label: "DISETUJUI", value: 0 },
    { label: "PENDING", value: 0 },
    { label: "DITOLAK", value: 0 },
    { label: "EVENT GLOBAL AKTIF", value: 0 },
  ]);
  const [kegiatanTerbaru, setKegiatanTerbaru] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDashboardAdminDitmawa()
      .then((data) => {
        const s = data?.statistik || {};
        setStats([
          { label: "DISETUJUI", value: s.disetujui ?? 0 },
          { label: "PENDING", value: s.pending ?? 0 },
          { label: "DITOLAK", value: s.ditolak ?? 0 },
          { label: "EVENT GLOBAL AKTIF", value: s.eventGlobalAktif ?? 0 },
        ]);
        const list = data?.kegiatanTerbaru || [];
        setKegiatanTerbaru(
          list.map((k, i) => ({
            no: i + 1,
            id: k.id,
            nama: k.namaKegiatan || k.nama || "-",
            diajukanPada: formatTanggal(k.diajukanPada),
            kategori: k.kategori || "-",
            skala: k.skala || "-",
            tanggal: formatTanggal(k.tanggalMulai, k.tanggalSelesai),
            status: String(k.status || "pending").toLowerCase(),
          })),
        );
      })
      .catch((err) =>
        toast.error("Gagal memuat dashboard", { description: err.message }),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const kegiatanColumns = useMemo(
    () => [
      {
        key: "no",
        label: "No",
        render: (row) => <span className="text-black">{row.no}</span>,
      },
      {
        key: "nama",
        label: "Nama Kegiatan",
        render: (row) => (
          <div>
            <p className="text-black">{row.nama}</p>
            {row.diajukanPada && row.diajukanPada !== "-" && (
              <p className="text-xs text-[#616161]">
                Diajukan: {row.diajukanPada}
              </p>
            )}
          </div>
        ),
      },
      {
        key: "kategori",
        label: "Kategori",
        render: (row) => <span className="text-black">{row.kategori}</span>,
      },
      {
        key: "skala",
        label: "Skala",
        render: (row) => <span className="text-black">{row.skala}</span>,
      },
      {
        key: "tanggal",
        label: "Tanggal",
        render: (row) => <span className="text-black">{row.tanggal}</span>,
      },
      {
        key: "status",
        label: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
    ],
    [],
  );

  return (
    <DashboardLayout
      role="admin_ditmawa"
      userName={user?.nama || "Admin Ditmawa"}
      userRole="Admin Ditmawa"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-black sm:text-3xl">
            Dashboard Admin Ditmawa
          </h2>
          <p className="mt-1 text-sm text-[#616161]">
            Kelola verifikasi kegiatan nasional/internasional dan event global.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={loading ? "…" : stat.value}
            />
          ))}
        </div>

        <TableCard
          title="Kegiatan terbaru"
          headerRight={
            <button
              type="button"
              onClick={() => navigate("/admin_ditmawa/verifikasi-pengajuan-internal")}
              className="rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f5f7f5]"
            >
              Lihat selengkapnya →
            </button>
          }
        >
          <TableFrame>
            <DataTable
              columns={kegiatanColumns}
              data={kegiatanTerbaru}
              loading={loading}
              emptyText="Belum ada kegiatan."
            />
          </TableFrame>
        </TableCard>

        <PanduanCard
          className="max-w-lg"
          title="Manual Book User Admin Ditmawa"
          description="Panduan Penggunaan Website SAPS 2026 untuk Admin Ditmawa"
        />
      </div>
    </DashboardLayout>
  );
}

export default AdminDitmawaDashboard;
