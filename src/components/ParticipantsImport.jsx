import React, { useState } from 'react';
import { api } from '../services/api';

export default function ParticipantsImport({ kegiatanId }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const onFileChange = (e) => setFile(e.target.files?.[0] || null);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus('Pilih file .xlsx atau .csv terlebih dahulu.');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    setLoading(true);
    setStatus('Mengunggah...');
    try {
      const res = await api.upload(`/kegiatan/${kegiatanId}/peserta/import`, form);
      setStatus(res?.message || 'Import peserta selesai.');
    } catch (err) {
      setStatus((err?.body?.message || err?.message || 'Gagal mengimpor file') + '');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: '1px solid #eee', padding: 12, borderRadius: 6 }}>
      <h3>Import Peserta</h3>
      <form onSubmit={handleUpload}>
        <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, .xlsx" onChange={onFileChange} />
        <div style={{ marginTop: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Mengunggah...' : 'Upload & Import'}
          </button>
        </div>
      </form>
      {status && <div style={{ marginTop: 8 }}>{status}</div>}
    </div>
  );
}
