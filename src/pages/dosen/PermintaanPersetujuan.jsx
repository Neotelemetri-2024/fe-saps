import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import { TableCard, TableFrame } from "../../components/dashboard/TableFrame";
import KegiatanCell from "../../components/dashboard/KegiatanCell";
import StatusBadge from "../../components/dashboard/StatusBadge";
import ConfirmModal from "../../components/ui/ConfirmModal";
import ActionMenu from "../../components/ui/ActionMenu";
import {
  getPersetujuanDosen,
  setujuiTolakBulk,
  subscribeDataUpdate,
} from "../../services/pengajuanService";
import { getCurrentUser } from "../../services/authService";

const labelMap = {
  prestasi: "Prestasi/Kompetisi",
  organisasi: "Organisasi/Volunteer",
  pelatihan: "Pelatihan/Seminar",
  juara1: "Juara 1",
  juara2: "Juara 2",
  juara3: "Juara 3",
  peserta: "Peserta",
};

function formatLabel(value) {
  return labelMap[value] || value || "-";
}

function mapRows(items) {
  return items.map((item, i) => ({
    ...item,
    no: i + 1,
    id: item.id,
    kegiatan: item.kegiatan || item.namaKegiatan || item.nama || '-',
    jenis: formatLabel(item.jenis || item.jenisKegiatan),
    peran: formatLabel(item.peran || item.peranPencapaian),
    skala: item.skala || '-',
    penyelenggara: item.penyelenggara || '-',
    tanggal: item.tanggal || item.tanggalPelaksanaan || '-',
    mahasiswa: item.mahasiswa || item.namaMahasiswa || item.mahasiswaNama || 'Mahasiswa',
    status: String(item.status || 'pending').toLowerCase(),
  }));
}

const isSelectable = (row) => row.status === 'pending' || row.status === 'diajukan';

function PermintaanPersetujuan() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSkala, setFilterSkala] = useState("");
  const user = getCurrentUser();

  const [pilihanMode, setPilihanMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const loadData = async () => {
    const res = await getPersetujuanDosen();
    setData(mapRows(res));
  };

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((row) => {
      if (filterStatus && row.status !== filterStatus) return false;
      if (filterSkala && row.skala !== filterSkala) return false;
      if (!q) return true;
      return (
        (row.mahasiswa || "").toLowerCase().includes(q) ||
        (row.kegiatan || "").toLowerCase().includes(q)
      );
    });
  }, [data, search, filterStatus, filterSkala]);

  const skalaOptions = useMemo(() => {
    return [...new Set(data.map((r) => r.skala).filter((s) => s && s !== '-'))].sort();
  }, [data]);

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'diajukan', label: 'Diajukan' },
    { value: 'disetujui', label: 'Disetujui' },
    { value: 'ditolak', label: 'Ditolak' },
    { value: 'revisi', label: 'Revisi' },
  ]

  useEffect(() => {
    loadData().catch((err) =>
      toast.error("Gagal memuat data", { description: err.message }),
    );
    return subscribeDataUpdate(() => {
      loadData().catch(() => {});
    });
  }, []);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const row = data.find((d) => d.id === id);
      if (row && !isSelectable(row)) return prev;
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectableRows = filteredData.filter(isSelectable);
  const allSelected = selectableRows.length > 0 && selectableRows.every((r) => selected.has(r.id));

  const centangSemua = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(selectableRows.map((r) => r.id)));
  };

  const handleBulkConfirm = async () => {
    setBulkLoading(true);
    try {
      await setujuiTolakBulk(Array.from(selected));
      toast.success(`${selected.size} permintaan berhasil disetujui.`);
      setSelected(new Set());
      setPilihanMode(false);
      setShowBulkConfirm(false);
      loadData().catch(() => {});
    } catch (err) {
      toast.error("Gagal menyetujui", { description: err.message });
      setShowBulkConfirm(false);
    } finally {
      setBulkLoading(false);
    }
  };

  const columns = [
    { key: "no", label: "NO" },
    { key: "mahasiswa", label: "MAHASISWA" },
    { key: "kegiatan", label: "KEGIATAN", render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
    { key: "peran", label: "PERAN" },
    { key: "skala", label: "SKALA" },
    { key: "jenis", label: "JENIS", render: (row) => <span className="text-[#616161]">{row.jenis}</span> },
    { key: "penyelenggara", label: "PENYELENGGARA" },
    { key: "tanggal", label: "TANGGAL" },
    {
      key: "status",
      label: "STATUS",
      render: (row) =>
        row.isUlang && (row.status === 'pending' || row.status === 'diajukan') ? (
          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            Diajukan Ulang
          </span>
        ) : (
          <StatusBadge status={row.status} />
        ),
    },
    {
      key: "aksi",
      label: "AKSI",
      stopPropagation: true,
      render: (row) => pilihanMode ? null : (
        <ActionMenu
          items={[
            {
              label: "Detail & Verifikasi",
              icon: <Eye className="h-4 w-4" />,
              color: "text-blue-600",
              onClick: () => navigate(`/dosen/permintaan-persetujuan/${row.id}`, { state: { row } }),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <DashboardLayout
      role="dosen"
      userName={user?.nama || 'Dosen PA'}
      userRole="Dosen Pembimbing"
    >
      <ConfirmModal
        isOpen={showBulkConfirm}
        title="Setujui Permintaan Terpilih"
        message={`Apakah Anda yakin ingin menyetujui ${selected.size} permintaan persetujuan ini?`}
        confirmText={bulkLoading ? 'Memproses...' : 'SETUJUI'}
        cancelText="BATAL"
        onConfirm={handleBulkConfirm}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#222] sm:text-2xl">
            Permintaan Persetujuan
          </h2>
          <p className="text-sm text-[#616161]">
            Pengajuan dari mahasiswa bimbingan Anda akan muncul di sini.
          </p>
        </div>

        <TableCard title="Permintaan Persetujuan">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative flex w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9aa0a6]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mahasiswa atau kegiatan..."
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
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <select
                value={filterSkala}
                onChange={(e) => setFilterSkala(e.target.value)}
                className="rounded-lg border border-[#d9dce7] px-3 py-2 text-sm text-[#444] outline-none"
              >
                <option value="">Semua Skala</option>
                {skalaOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {(search || filterStatus || filterSkala) && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setFilterStatus(""); setFilterSkala("") }}
                  className="rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]"
                >
                  Reset Filter
                </button>
              )}

              <button
                type="button"
                onClick={() => { setPilihanMode((v) => !v); setSelected(new Set()) }}
                className={`rounded-lg border border-brand-dark px-4 py-2 text-sm font-semibold transition ${
                  pilihanMode
                    ? 'bg-brand-dark text-white'
                    : 'bg-gradient-to-r from-brand-dark to-brand-light text-white hover:opacity-90'
                }`}>
                Pilih Beberapa
              </button>
            </div>
          </div>

          {pilihanMode && (
            <div className="flex items-center gap-3 rounded-lg border border-[#e9ebf8] bg-[#f9fafb] px-4 py-3">
              <span className="text-sm text-[#616161]">{selected.size} dipilih</span>
              <div className="ml-auto flex gap-2">
                <button type="button" onClick={() => { setPilihanMode(false); setSelected(new Set()) }}
                  className="rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#616161] transition hover:bg-white">
                  Batal Pilih
                </button>
                <button type="button"
                  onClick={() => { if (selected.size === 0) { toast.error('Pilih minimal satu.'); return }; setShowBulkConfirm(true) }}
                  className="rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-6 py-2 text-sm font-bold text-white transition hover:opacity-90">
                  Setujui Terpilih
                </button>
              </div>
            </div>
          )}

          <TableFrame>
            <DataTable
              columns={columns}
              data={filteredData}
              selectable={pilihanMode}
              selected={selected}
              onSelect={toggleSelect}
              onSelectAll={centangSemua}
              isSelectable={isSelectable}
            />
          </TableFrame>
        </TableCard>
      </div>
    </DashboardLayout>
  );
}

export default PermintaanPersetujuan;
