import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "../../components/dashboard/DashboardLayout";
import DataTable from "../../components/dashboard/DataTable";
import StatusBadge from "../../components/dashboard/StatusBadge";
import {
  getPersetujuanDosen,
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


const columns = (navigate) => [
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
    render: (row) => (
      <button
        onClick={() => navigate(`/dosen/permintaan-persetujuan/${row.id}`, { state: { row } })}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-brand-dark px-3 py-1.5 text-xs font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white"
      >
        <Eye className="h-3.5 w-3.5" />
        Detail & Verifikasi
      </button>
    ),
  },
];

function PermintaanPersetujuan() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const user = getCurrentUser();

  const loadData = async () => {
    const res = await getPersetujuanDosen();
    setData(mapRows(res));
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
      role="dosen"
      userName={user?.nama || 'Dosen PA'}
      userRole="Dosen Pembimbing"
    >

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
          <DataTable columns={columns(navigate)} data={filteredData} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default PermintaanPersetujuan;
