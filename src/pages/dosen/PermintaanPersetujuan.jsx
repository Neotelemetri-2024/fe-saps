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
import { statusOptionsFromRows } from "../../utils/statusFilter";
import { batalBtnClass } from '../../components/ui/buttonStyles'

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

  const statusOptions = useMemo(
    () => statusOptionsFromRows(data, "status"),
    [data],
  );

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
    { key: "no", label: "No" },
    { key: "mahasiswa", label: "Mahasiswa" },
    { key: "kegiatan", label: "Kegiatan", render: (row) => <KegiatanCell nama={row.kegiatan} tanggal={row.diajukanPada} /> },
    { key: "peran", label: "Peran" },
    { key: "skala", label: "Skala" },
    { key: "jenis", label: "Jenis" },
    { key: "penyelenggara", label: "Penyelenggara" },
    { key: "tanggal", label: "Tanggal" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge
          status={row.isUlang && (row.status === 'pending' || row.status === 'diajukan')
            ? 'diajukan_ulang'
            : row.status}
        />
      ),
    },
    {
      key: "aksi",
      label: "Aksi",
      stopPropagation: true,
      render: (row) => pilihanMode ? null : (
        <ActionMenu
          items={[
            {
              label: "Detail",
              icon: <Eye className="h-4 w-4" />,
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
        confirmText={bulkLoading ? 'Memproses...' : 'Setujui'}
        cancelText="Batal"
        onConfirm={handleBulkConfirm}
        onCancel={() => setShowBulkConfirm(false)}
      />

      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-extrabold text-base-content">
            Permintaan persetujuan
          </h2>
          <p className="mt-1 text-sm text-base-content/60">
            Pengajuan dari mahasiswa bimbingan
          </p>
        </div>

        <TableCard title="Daftar permintaan">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <label className="input input-sm flex-1">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari mahasiswa atau kegiatan"
              />
            </label>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="select select-sm sm:w-44"
            >
              <option value="">Semua status</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            <select
              value={filterSkala}
              onChange={(e) => setFilterSkala(e.target.value)}
              className="select select-sm sm:w-44"
            >
              <option value="">Semua skala</option>
              {skalaOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {(search || filterStatus || filterSkala) ? (
              <button
                type="button"
                onClick={() => { setSearch(""); setFilterStatus(""); setFilterSkala("") }}
                className="btn btn-ghost btn-sm"
              >
                Reset
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => { setPilihanMode((v) => !v); setSelected(new Set()) }}
              className={`btn btn-sm ${pilihanMode ? 'btn-primary' : 'btn-outline btn-primary'}`}
            >
              Pilih beberapa
            </button>
          </div>

          {pilihanMode ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-base-content/60">{selected.size} dipilih</span>
              <button
                type="button"
                onClick={() => { setPilihanMode(false); setSelected(new Set()) }} className={batalBtnClass}>
                Batal
              </button>
              <button
                type="button"
                onClick={() => { if (selected.size === 0) { toast.error('Pilih minimal satu.'); return }; setShowBulkConfirm(true) }}
                className="btn btn-primary btn-sm"
              >
                Setujui terpilih
              </button>
            </div>
          ) : null}

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
