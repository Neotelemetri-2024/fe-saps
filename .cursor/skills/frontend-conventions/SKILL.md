---
name: frontend-conventions
description: Aturan wajib frontend SAPS (React + Vite, Tailwind 4, DaisyUI 5, DM Sans). Gunakan SETIAP kali membuat, mengedit, atau meninjau kode frontend — layout dashboard, halaman, tabel, form, modal, badge, tombol, atau komponen UI.
---

# Frontend Conventions — SAPS

Prinsip: **modular & atomic**. Jangan tumpuk markup/style acak di halaman. Chrome hanya di layout. Halaman compose komponen yang sudah ada.

## Stack yang dipakai

- Tailwind 4 + DaisyUI 5 (`@plugin "daisyui"` di `src/index.css`)
- Tema: `saps` (default) dan `saps-dark` via tombol Kemudahan di navbar
- Font: **DM Sans** (`font-sans`); skala huruf lewat Kemudahan (`--app-font-size`)
- Icon: `lucide-react` saja
- Toast: Sonner
- Chart: **ApexCharts** lewat `src/components/charts` — jangan Chart.js / SVG chart baru
- Data: `src/services/*` — jangan `fetch` langsung di komponen baru

Jangan wajibkan React Query, Zustand, CASL, atau Zod di fase ini.

## Styling — DaisyUI 5

Pakai token: `btn`, `input`, `select`, `table`, `badge`, `card`, `navbar`, `menu`, `modal`, `dropdown`, `tabs tabs-box`, `progress`, `join`, `indicator`.

Kelas DaisyUI 4 yang dilarang: `form-control`, `label-text`, `input-bordered`, `select-bordered`, `tabs-boxed`.

Warna lewat token (`primary`, `base-100/200/300`, `base-content`, `success`, `warning`, `error`, `info`). Jangan hex acak di chrome/komponen baru.

Alias lama `brand-dark` / `brand-light` tetap ada supaya halaman lama tidak pecah. Kode baru pakai `primary`.

### Anti-slop

- Jangan bold merata
- Radius max `md`/`lg` (`rounded-md` / `rounded-lg`). Jangan `rounded-xl`+ di chrome baru
- Jangan hover di setiap card
- Jangan border warna-warni atau icon dengan background pelangi
- Jangan gradient tombol baru (`from-brand-dark to-brand-light`). Pakai `btn btn-primary` / `btn-ghost` / `btn-outline`

## Chrome

Hanya [`DashboardLayout`](src/components/dashboard/DashboardLayout.jsx) + [`Sidebar`](src/components/dashboard/Sidebar.jsx). Menu dari [`src/config/menuItems.jsx`](src/config/menuItems.jsx).

Navbar berisi search (`/` shortcut), Kemudahan (tema + ukuran huruf), notifikasi, dan profil.

`pimpinan_ditmawa` sudah dibungkus [`PimpinanDitmawaLayout`](src/layouts/PimpinanDitmawaLayout.jsx). `DashboardLayout` menelan wrapper bertingkat (navbar tidak dobel), tetapi halaman di dalamnya tetap **jangan** menambah chrome sendiri.

Item sidebar aktif: `bg-primary text-primary-content`. Tidak aktif: `text-base-content/80 hover:bg-base-200`.

## Komponen bersama — jangan pecah props

Pakai komponen yang ada. Skin boleh berubah; kontrak props **tetap** sampai halaman dimigrasi.

| Komponen | Pakai untuk |
|---|---|
| `StatCard` | KPI (`loading` atau `value="…"` = skeleton) |
| `DataTable` | list + pagination (`loading` = baris skeleton) |
| `Skeleton` + variannya | placeholder loading (`ChartSkeleton`, `RankListSkeleton`, `FormSkeleton`, `NotifListSkeleton`, `DetailSkeleton`) |
| `TableCard` / `TableFrame` | kartu + bingkai tabel |
| `StatusBadge` | status |
| `ProgressBar` | progress |
| `Modal` / `ConfirmModal` | overlay (`<dialog>` + `showModal()`) |
| `ActionMenu` | aksi baris tabel |

Halaman list: `TableCard` → toolbar → `TableFrame` → `DataTable`. Jangan tulis `<table>` manual untuk daftar yang perlu cari/page.

## Overlay

Modal/konfirmasi: `<dialog className="modal">` + `showModal()` / `close()`. Jangan pola checkbox DaisyUI lama. Hapus/aksi berbahaya: `ConfirmModal`.

## Halaman

- Judul: `text-2xl font-extrabold text-base-content`
- Subtitle: `text-sm text-base-content/60`
- Jarak: `space-y-5`
- Tombol baru: `btn btn-primary btn-sm` (atau `btn-ghost` / `btn-outline`)
- Input/select baru: `input` / `select` tanpa `*-bordered`

## Checklist

- [ ] Token DaisyUI 5, bukan hex/gradient baru
- [ ] DM Sans via `font-sans`
- [ ] Icon lucide-react, toast Sonner
- [ ] Chart lewat `src/components/charts` (ApexCharts)
- [ ] Data lewat `src/services/`
- [ ] Tidak membungkus `DashboardLayout` di dalam layout yang sudah ada
- [ ] Loading pakai skeleton DaisyUI, bukan teks “Memuat…”
- [ ] Props `StatCard` / `DataTable` / `ConfirmModal` tidak dipecah
