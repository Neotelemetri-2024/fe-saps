import React, { useState } from 'react';
import { getAuthToken } from '../services/auth';
import { api } from '../services/api';

export default function ReportsDownload() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const preview = async () => {
    try {
      const res = await api.get('/pimpinan/laporan/preview');
      setMessage('Preview berhasil dimuat.');
      console.log('Preview:', res.data || res);
    } catch (err) {
      setMessage('Gagal memuat preview');
    }
  };

  const download = async (type) => {
    setLoading(true);
    setMessage('Mempersiapkan unduhan...');
    try {
      const token = getAuthToken();
      const resp = await fetch(`/api/pimpinan/laporan/${type}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (!resp.ok) throw new Error(`Server error ${resp.status}`);
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const ext = type === 'excel' ? 'xlsx' : type === 'pdf' ? 'pdf' : 'json';
      a.href = url;
      a.download = `laporan_pimpinan.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Unduhan selesai. Periksa folder unduhan Anda.');
    } catch (err) {
      console.error(err);
      setMessage('Gagal mengunduh laporan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
      <h3>Laporan Pimpinan</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={preview}>Preview (JSON)</button>
        <button onClick={() => download('excel')} disabled={loading}>Download Excel</button>
        <button onClick={() => download('pdf')} disabled={loading}>Download PDF</button>
      </div>
      {message && <div>{message}</div>}
    </div>
  );
}
