import React, { useState, useEffect } from "react";
import { Search, Filter, Pencil } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import StatusBadge from "../../components/dashboard/StatusBadge";
import Modal from "../../components/ui/Modal";
import {
  getPersetujuanDosen,
  setujuiTolak,
  subscribeDataUpdate,
} from "../../services/pengajuanService";

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
    jenis: formatLabel(item.jenis),
    peran: formatLabel(item.peran),
    mahasiswa: item.namaMahasiswa || "Mahasiswa",
  }));
}


const columns = (openModal) => [
  { key: "no", label: "NO" },
  { key: "mahasiswa", label: "MAHASISWA" },
  { key: "kegiatan", label: "KEGIATAN" },
  { key: "jenis", label: "JENIS" },
  { key: "peran", label: "PERAN" },
  { key: "penyelenggara", label: "PENYELENGGARA" },
  { key: "tanggal", label: "TANGGAL" },
  {
    key: "status",
    label: "STATUS",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    key: "aksi",
    label: "AKSI",
    render: (row) =>
      row.status === "pending" ? (
        <button
          onClick={() => openModal(row)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-dark"
          style={{ color: "#1c4122" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "white")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#1c4122")}
        >
          <Pencil className="h-3.5 w-3.5" />
          Verifikasi
        </button>
      ) : (
        <span className="text-xs font-medium text-[#888]">—</span>
      ),
  },
];

function PermintaanPersetujuan() {
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [alasan, setAlasan] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const res = await getPersetujuanDosen();
    setData(mapRows(res));
  };

  const openModal = (row) => {
    setSelectedRow(row);
    setActionType(null);
    setAlasan("");
    setModalOpen(true);
  };

  const handleAction = async (type) => {
    if (type === "setuju") {
      setLoading(true);
      try {
        await setujuiTolak(selectedRow.id, "disetujui", "");
        toast.success("Disetujui!", {
          description: `Kegiatan "${selectedRow.kegiatan}" dari ${selectedRow.mahasiswa} berhasil disetujui.`,
        });
        setModalOpen(false);
        await loadData();
      } catch (err) {
        toast.error("Gagal", { description: err.message });
      } finally {
        setLoading(false);
      }
      return;
    }
    setActionType(type);
    setAlasan("");
  };

  const handleKirimAlasan = async () => {
    if (alasan.trim() === "") {
      toast.error("Gagal!", {
        description: "Alasan tidak boleh kosong.",
      });
      return;
    }
    setLoading(true);
    try {
      const statusKey = actionType === "revisi" ? "revisi" : "ditolak";
      await setujuiTolak(selectedRow.id, statusKey, alasan.trim());
      toast.success("Berhasil!", {
        description: `Kegiatan "${selectedRow.kegiatan}" berhasil di${actionType}`,
      });
      setAlasan("");
      setModalOpen(false);
      await loadData();
    } catch (err) {
      toast.error("Gagal", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = data;

  useEffect(() => {
    loadData().catch((err) =>
      toast.error("Gagal memuat data", { description: err.message }),
    );
    return subscribeDataUpdate(() => {
      loadData().catch(() => {});
    });
  }, []);

  return (
    <DashboardLayout
      role="dosen-pa"
      userName="Dr. Efa Yonnedi, SE, MPPM, Akt, CA, CRGP"
      userRole="Dosen Pembimbing"
    >
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        {selectedRow && (
          <div className="mb-4 rounded-lg bg-[#f9fafb] p-3 text-sm text-[#333]">
            <p>
              <span className="font-semibold">Mahasiswa:</span>{" "}
              {selectedRow.mahasiswa}
            </p>
            <p>
              <span className="font-semibold">Kegiatan:</span>{" "}
              {selectedRow.kegiatan}
            </p>
            <p>
              <span className="font-semibold">Penyelenggara:</span>{" "}
              {selectedRow.penyelenggara}
            </p>
          </div>
        )}
        {!actionType ? (
          <div className="flex justify-center gap-4">
            <button
              onClick={() => handleAction("setuju")}
              disabled={loading}
              className="flex-1 rounded-xl bg-green-700 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Memproses..." : "SETUJU"}
            </button>
            <button
              onClick={() => handleAction("revisi")}
              className="flex-1 rounded-xl bg-orange-500 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              REVISI
            </button>
            <button
              onClick={() => handleAction("tolak")}
              className="flex-1 rounded-xl bg-red-700 px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90"
            >
              TOLAK
            </button>
          </div>
        ) : (
          <div>
            <p className="mb-2 text-sm font-medium text-black">
              Alasan {actionType === "revisi" ? "Revisi" : "Tolak"}
              <span className="text-red-500">*</span>
            </p>
            <textarea
              className="w-full rounded-md border border-[#e9ebf8] p-3 text-sm text-[#333] shadow-sm focus:border-brand-dark focus:ring-brand-dark"
              rows="4"
              placeholder={
                actionType === "revisi"
                  ? "Alasan revisi..."
                  : "Tidak sesuai dengan kriteria yang ada"
              }
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              maxLength={500}
            ></textarea>
            <p className="text-right text-xs text-[#616161] mt-1">
              {alasan.length}/500
            </p>
            <div className="flex justify-end gap-4 mt-6">
              <button
                onClick={handleKirimAlasan}
                disabled={loading}
                className={`rounded-xl px-6 py-3 text-white font-semibold shadow-md transition hover:opacity-90 disabled:opacity-60 ${actionType === "revisi" ? "bg-orange-500" : "bg-red-700"}`}
              >
                {loading ? "Mengirim..." : "KIRIM ALASAN"}
              </button>
              <button
                onClick={() => {
                  setActionType(null);
                  setAlasan("");
                }}
                className="rounded-xl border border-gray-400 px-6 py-3 text-gray-700 font-semibold shadow-md transition hover:bg-gray-100"
              >
                BATAL
              </button>
            </div>
          </div>
        )}
      </Modal>

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
              placeholder="Cari mahasiswa atau kegiatan..."
              className="flex-1 text-sm outline-none"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            <Filter className="h-4 w-4" />
            Filter
          </button>

          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Kategori</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Peran</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Status</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Skala</option>
          </select>
          <select className="rounded-lg border border-[#e9ebf8] px-4 py-2 text-sm text-[#333] outline-none">
            <option>Tahun</option>
          </select>
          <button className="text-sm font-medium text-[#616161] hover:underline">
            Reset Filter
          </button>
        </div>

        <div className="rounded-xl border border-[#e9ebf8] bg-white p-3 sm:p-6 shadow-sm">
          <h3 className="mb-4 text-base font-bold text-brand-dark sm:text-lg">
            Permintaan Persetujuan
          </h3>
          <DataTable columns={columns(openModal)} data={filteredData} />
          {filteredData.length === 0 && (
            <p className="mt-3 text-center text-xs text-[#969696]">
              Tidak ada permintaan persetujuan.
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PermintaanPersetujuan;
