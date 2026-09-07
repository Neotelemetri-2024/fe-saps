"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateExcelLaporan = generateExcelLaporan;
function formatTanggal(value) {
    const d = value ? new Date(value) : new Date();
    if (Number.isNaN(d.getTime()))
        return '-';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function csvCell(value) {
    const text = value == null ? '' : String(value);
    if (/[",\n\r]/.test(text))
        return `"${text.replace(/"/g, '""')}"`;
    return text;
}
function csvRow(cells) {
    return cells.map(csvCell).join(',');
}
function section(title, headers, rows) {
    const lines = [title, csvRow(headers)];
    if (rows.length === 0) {
        lines.push(csvRow(headers.map((_, i) => (i === 0 ? 'Tidak ada data' : ''))));
    }
    else {
        rows.forEach((row) => lines.push(csvRow(row)));
    }
    return lines.join('\n');
}
async function generateExcelLaporan(data) {
    const unitLabel = data.komparasi.unit === 'fakultas' ? 'Fakultas' : 'Program Studi';
    const printed = formatTanggal();
    const parts = [
        csvRow(['Laporan SAPS']),
        csvRow([data.scopeNama]),
        csvRow([`${data.kurikulum.nama} | Target ${data.kurikulum.targetPoin} poin | ${printed}`]),
        '',
        section('Ringkasan', ['Uraian', 'Nilai'], [
            ['Mahasiswa', data.kpi.totalMahasiswa],
            ['Rata-rata poin', `${data.kpi.rataRataPoin} / ${data.kurikulum.targetPoin}`],
            ['Capaian', `${data.kpi.rataRataPersentase}%`],
            ['Lulus target', `${data.kpi.persentaseLulusTarget}%`],
            ['Poin sah', data.kpi.totalPoinSah],
            ['Prestasi', data.kpi.totalPrestasi],
            ['Kegiatan', data.kpi.totalKegiatan],
        ]),
        '',
        section('Kurikulum', ['Tahapan', 'Tahun', 'Target', 'Rata-rata', 'Capaian'], data.capaianKurikulumStats.map((c) => [
            c.nama,
            c.tahun,
            c.targetPoin,
            c.rataRataTerkumpul,
            `${c.persentaseCapaian}%`,
        ])),
        '',
        section(`Peringkat ${unitLabel}`, ['No', unitLabel, 'Mahasiswa', 'Rata-rata', 'Capaian'], data.komparasi.items.map((item) => [
            item.ranking,
            item.nama,
            item.totalMahasiswa,
            item.rataRataPoin,
            `${item.rataRataPersentase}%`,
        ])),
        '',
        section('Mahasiswa', ['No', 'NIM', 'Nama', 'Prodi', 'Fakultas', 'Angkatan', 'Poin', 'Target', 'Capaian', 'Status'], data.mahasiswaList.map((m, i) => [
            i + 1,
            m.nim,
            m.nama,
            m.prodi,
            m.fakultas,
            m.angkatan,
            m.totalPoin,
            m.targetPoin,
            `${m.persentase}%`,
            m.statusTarget,
        ])),
        '',
        section('Prestasi', ['No', 'Mahasiswa', 'NIM', 'Kegiatan', 'Skala', 'Peringkat', 'Poin', 'Tanggal'], data.prestasiList.map((p, i) => [
            i + 1,
            p.namaMahasiswa,
            p.nim,
            p.namaKegiatan,
            p.skala,
            p.peran,
            p.poin,
            p.tanggal && p.tanggal !== '-' ? formatTanggal(p.tanggal) : '-',
        ])),
        '',
        section('Ormawa', ['No', 'Organisasi', 'Tipe', 'Fakultas', 'Kegiatan', 'Partisipasi', 'Poin'], data.ormawaList.map((o, i) => [
            i + 1,
            o.nama,
            o.tipe,
            o.fakultas,
            o.totalKegiatan,
            o.totalPeserta,
            o.totalPoinDidistribusikan,
        ])),
    ];
    return Buffer.from(`\uFEFF${parts.join('\n')}`, 'utf8');
}
