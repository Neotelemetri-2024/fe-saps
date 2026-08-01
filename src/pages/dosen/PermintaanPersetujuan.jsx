import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import KegiatanCell from "../../components/dashboard/KegiatanCell";
import StatusBadge from "../../components/dashboard/StatusBadge";
import ConfirmModal from "../../components/ui/ConfirmModal";
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
    if (!q) return data;
    return data.filter(
      (row) =>
        (row.mahasiswa || "").toLowerCase().includes(q) ||
        (row.kegiatan || "").toLowerCase().includes(q)
    );
  }, [data, search]);

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
        <button
          title="Detail & Verifikasi"
          onClick={() => navigate(`/dosen/permintaan-persetujuan/${row.id}`, { state: { row } })}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-600 transition hover:bg-blue-500 hover:text-white"
        >
          <Eye className="h-4 w-4" />
        </button>
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
          <h2 className="text-xl font-bold text-brand-dark sm:text-2xl">
            Permintaan Persetujuan
          </h2>
          <p className="text-sm text-[#616161]">
            Pengajuan dari mahasiswa bimbingan Anda akan muncul di sini.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[180px] flex-1 items-center gap-3 rounded-lg border border-[#e9ebf8] px-4 py-2">
            <Search className="h-4 w-4 text-[#616161]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari mahasiswa atau kegiatan..."
              className="flex-1 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => { setPilihanMode((v) => !v); setSelected(new Set()) }}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
              pilihanMode
                ? 'border-brand-dark bg-brand-dark text-white'
                : 'border-brand-dark bg-gradient-to-r from-brand-dark to-brand-light text-white hover:opacity-90'
            }`}>
            Pilih Beberapa
          </button>
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

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 sm:p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-brand-dark sm:text-lg">
            Permintaan Persetujuan
          </h3>
          <DataTable
            columns={columns}
            data={filteredData}
            selectable={pilihanMode}
            selected={selected}
            onSelect={toggleSelect}
            onSelectAll={centangSemua}
            isSelectable={isSelectable}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PermintaanPersetujuan;
