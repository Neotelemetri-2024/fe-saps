import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function PimpinanDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get('/umum/dashboard/pimpinan-ditmawa')
      .then(res => { if (mounted) setData(res.data); })
      .catch(err => { if (mounted) setError(err); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Memuat dashboard...</div>;
  if (error) return <div>Gagal memuat dashboard: {error.status || 'Error'}</div>;

  const s = data.statistik;

  return (
    <div>
      <h1>Dashboard Pimpinan Ditmawa</h1>
      <section>
        <h2>Statistik</h2>
        <ul>
          <li>Mahasiswa Aktif: {s.mahasiswaAktif}</li>
          <li>Total Fakultas: {s.totalFakultas}</li>
          <li>Ormawa Aktif: {s.totalOrmawaAktif}</li>
          <li>Kurikulum Aktif: {s.kurikulumAktif}</li>
          <li>Target Poin Kurikulum: {s.targetPoinKurikulum}</li>
          <li>Antrean Proposal Kegiatan: {s.antreanProposalKegiatan}</li>
          <li>Antrean Klaim: {s.antreanKlaim}</li>
        </ul>
      </section>

      <section>
        <h2>Capaian Kurikulum</h2>
        <div style={{ display: 'flex', gap: 12 }}>
          {data.capaianKurikulum.map(c => (
            <div key={c.id} style={{border: '1px solid #ddd', padding: 12}}>
              <strong>{c.pilar}</strong>
              <div>Tahun: {c.tahun}</div>
              <div>Target: {c.targetPoin}</div>
              <div>Rata-rata: {c.rataRataPoin}</div>
              <div>% Capaian: {c.persenCapaian}%</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Klaim Menunggu Validasi</h2>
        {data.klaimMenungguValidasi.map(k => (
          <div key={k.id} style={{borderBottom: '1px solid #eee', padding: 8}}>
            <div>{k.namaMahasiswa} ({k.nim}) — {k.peran} — {k.status}</div>
            <div>{k.namaKegiatan} — {k.prodi}</div>
          </div>
        ))}
      </section>
    </div>
  );
}
