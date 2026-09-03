# FE Integration Notes — Super Admin (Pimpinan Ditmawa) & Dashboard

This document explains how the frontend integrates with backend endpoints for Super Admin and dashboard features.

1) Environment

- Set `VITE_API_BASE` in `.env` (example `VITE_API_BASE=https://api.example.com/api`)

2) Auth

- JWT is stored via `src/services/auth.js` using `saveAuthToken()` and `getAuthToken()`.
- Ensure login flow stores token: `saveAuthToken(token)`.

3) API helper

- `src/services/api.js` provides `get`, `post`, `put`, `del`, and `upload(path, FormData)`.
- All calls include `Authorization: Bearer <token>` when token is present.

4) Key pages & components

- `src/pages/PimpinanDashboard.jsx` — main dashboard page that calls `/api/umum/dashboard/pimpinan-ditmawa`.
- `src/components/ParticipantsImport.jsx` — upload `.xlsx`/`.csv` and POST to `/api/kegiatan/:id/peserta/import`.
- `src/components/ReportsDownload.jsx` — preview and download report endpoints at `/api/pimpinan/laporan/preview`, `/api/pimpinan/laporan/excel`, `/api/pimpinan/laporan/pdf`.

5) Sidebar

- Menu items for `pimpinan_ditmawa` updated in `src/config/menuItems.jsx` to include `Validasi Klaim`, `Approval Kegiatan`, `Manajemen Organisasi`, `Manajemen Peserta`, and `Audit Log`.

6) Notes & Assumptions

- Backend expects Authorization header for all protected endpoints.
- File import endpoint accepts `multipart/form-data` field `file`.
- Report download endpoints return binary blobs for `excel` and `pdf`.
- Adjust UI and error handling to match your design system.

7) Next steps

- Wire routes to router (e.g., add route `/pimpinan_ditmawa/dashboard` to router config).
- Implement confirmation modals for destructive actions (approve/reject).

