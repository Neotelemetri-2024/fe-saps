import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import StatusBadge from "../../components/dashboard/StatusBadge";
import DataTable from "../../components/dashboard/DataTable";
import PanduanCard from "../../components/dashboard/PanduanCard";
import { getCurrentUser } from "../../services/authService";
import { getDashboardAdminDitmawa } from "../../services/dashboardService";
import KegiatanCell from "../../components/dashboard/KegiatanCell";

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
    return `${a} - ${b}`;
  } catch {
    return String(start);
  }
}

function AdminDitmawaDashboard() {
  const user = getCurrentUser();
  const [stats, setStats] = useState([
    {
      label: "DISETUJUI",
      value: 0,
      border: "border-brand-dark",
      valueColor: "text-brand-dark",
    },
    {
      label: "PENDING",
      value: 0,
      border: "border-yellow-400",
      valueColor: "text-yellow-500",
    },
    {
      label: "DITOLAK",
      value: 0,
      border: "border-red-500",
      valueColor: "text-red-600",
    },
    {
      label: "EVENT GLOBAL AKTIF",
      value: 0,
      border: "border-brand-dark",
      valueColor: "text-brand-dark",
    },
  ]);
  const [kegiatanTerbaru, setKegiatanTerbaru] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDashboardAdminDitmawa()
      .then((data) => {
        const s = data?.statistik || {};
        setStats([
          {
            label: "DISETUJUI",
            value: s.disetujui ?? 0,
            border: "border-brand-dark",
            valueColor: "text-brand-dark",
          },
          {
            label: "PENDING",
            value: s.pending ?? 0,
            border: "border-yellow-400",
            valueColor: "text-yellow-500",
          },
          {
            label: "DITOLAK",
            value: s.ditolak ?? 0,
            border: "border-red-500",
            valueColor: "text-red-600",
          },
          {
            label: "EVENT GLOBAL AKTIF",
            value: s.eventGlobalAktif ?? 0,
            border: "border-brand-dark",
            valueColor: "text-brand-dark",
          },
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
            peserta: k.peserta ?? 0,
            poin: k.poin ?? 50,
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
        render: (row) => <span className="text-[#616161]">{row.no}</span>,
      },
      {
        key: "nama",
        label: "Nama Kegiatan",
        render: (row) => (
          <div>
            <p className="text-[#333]">{row.nama}</p>
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
        render: (row) => <span className="text-[#616161]">{row.kategori}</span>,
      },
      {
        key: "skala",
        label: "Skala",
        render: (row) => <span className="text-[#616161]">{row.skala}</span>,
      },
      {
        key: "tanggal",
        label: "Tanggal",
        render: (row) => <span className="text-[#616161]">{row.tanggal}</span>,
      },
      {
        key: "peserta",
        label: "Peserta",
        render: (row) => <span className="text-[#616161]">{row.peserta}</span>,
      },
      {
        key: "poin",
        label: "Poin",
        render: (row) => <span className="text-[#616161]">{row.poin}</span>,
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
            <div
              key={stat.label}
              className="rounded-xl bg-white p-4 shadow-sm sm:p-5 lg:p-6"
            >
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#616161]">
                {stat.label}
              </p>
              <p className={`mt-2 text-3xl font-extrabold ${stat.valueColor}`}>
                {loading ? "…" : stat.value}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-xl border border-[#e9ebf8] bg-white p-3 shadow-sm sm:p-6">
          <h3 className="mb-4 text-lg font-bold text-brand-dark">
            Kegiatan terbaru
          </h3>

          <div className="overflow-hidden rounded-xl border border-[#e9ebf8]">
            <DataTable
              columns={kegiatanColumns}
              data={kegiatanTerbaru}
              loading={loading}
              emptyText="Belum ada kegiatan."
            />
          </div>
        </section>

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
