# SAPS Design System Reference

Berdasarkan kode sumber — Figma file: `kByfvgqyz6koKMXroY4lqO` page `Hi-Fi`

---

## 1. Color System

### Brand Colors (Tailwind v4 @theme)
| Token | Hex | Usage |
|-------|-----|-------|
| `brand-dark` | `#1c4122` | Text, buttons, bg, borders |
| `brand-mid` | `#438a41` | Gradients, cards |
| `brand-light` | `#48a757` | Accents, gradients |
| `brand-darker` | `#0e3b1e` | Navbar footer, dark bg |

### Neutral Palette (hardcoded)
| Token | Hex | Usage |
|-------|-----|-------|
| `#e9ebf8` | Light gray | Borders, dividers |
| `#f5f5f5` | Page bg | Dashboard background |
| `#f0f4f0` | Light green tint | Icon bg, hover states |
| `#616161` | Medium gray | Secondary text |
| `#9aa0a6` | Muted gray | Timestamps, metadata |
| `#333` | Dark gray | Body text |
| `#111827` | Near black | Body text |
| `#969696` | Gray | Placeholder, icons |
| `#292727` | Dark | Login heading |
| `#f9fafb` | Off white | Section bg |

### Semantic Colors
| Usage | Token |
|-------|-------|
| Success / Complete | `bg-emerald-50 text-emerald-700` / `bg-emerald-500 dot` |
| Warning / Pending | `bg-amber-50 text-amber-700` / `bg-amber-500 dot` |
| Error / Ditolak | `bg-red-50 text-red-600` / `bg-red-500 dot` |
| Info / Menunggu | `bg-blue-100 text-blue-800` / `bg-blue-500 dot` |
| Inactive / BELUM | `bg-gray-100 text-gray-400` |

### Gradients
| Name | Definition | Usage |
|------|-----------|-------|
| `bg-brand-gradient` | `linear-gradient(124deg, #1c4122 3.4%, #438a41 98%)` | Login left panel |
| `bg-gradient-to-r from-brand-dark to-brand-light` | `linear-gradient(to right, #1c4122, #48a757)` | Button, table header, active nav |
| `bg-gradient-to-br from-brand-dark via-brand-mid to-brand-dark` | Hero section landing |
| `bg-gradient-to-b from-brand-dark to-brand-light` | Radar card dashboard |

### Background Patterns
- **Landing page bg**: `radial-gradient(circle at top, rgba(72,167,87,0.1), transparent 34%), linear-gradient(180deg, #f8faf7 0%, #eef2ee 100%)`
- **Dashboard page bg**: `bg-[#f5f5f5]`
- **Login page bg**: `bg-white`
- **Card bg**: `bg-white`

---

## 2. Typography

### Font Family
**Primary**: `'Poppins', 'Segoe UI', Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

### Font Sizes (Tailwind)
| Class | Size | Usage |
|-------|------|-------|
| `text-[10px]` | 10px | Sub-label, university name |
| `text-[11px]` | 11px | Menu section title |
| `text-xs` | 12px | Body small, table data, badges |
| `text-sm` | 14px | Body, menu items |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Card title, section heading |
| `text-xl` | 20px | Hero description |
| `text-2xl` | 24px | "Selamat Datang" |
| `text-3xl` | 30px | Stat value, section titles |
| `text-4xl` | 36px | "Hallo, Selamat Datang" |
| `text-5xl` | 48px | Hero heading |
| `text-6xl` | 60px | Hero heading |

### Font Weights
| Weight | Usage |
|--------|-------|
| `font-light` (300) | Form label |
| `font-medium` (500) | Body, button text |
| `font-semibold` (600) | Table header, badges |
| `font-bold` (700) | h1, h2, section title, card title |
| `font-extrabold` (800) | "Selamat Datang", stat numbers |

### Text Styles
| Element | Style |
|---------|-------|
| h1 landing | `text-5xl sm:text-6xl lg:text-7xl font-bold text-white` |
| h2 landing / login | `text-4xl font-bold` |
| h2 dashboard | `bg-gradient-to-r from-brand-dark to-brand-light bg-clip-text text-2xl font-extrabold text-transparent sm:text-3xl` |
| Section title | `text-lg font-bold text-brand-dark` |
| Card title | `text-lg font-bold text-brand-dark` |
| Body | `text-sm text-[#616161]` |
| Table header | `bg-gradient-to-r from-brand-dark to-brand-light text-left text-xs font-semibold uppercase tracking-wide text-white` |

---

## 3. Spacing & Sizing

### Page Layout
- **Dashboard**: `ml-[260px]` (sidebar width), `p-8` (content padding)
- **Login**: `pr-[180px] pt-[111px]` (logo), `px-[86px]` (form)
- **Landing**: `px-8`, max container `max-w-[1440px]`

### Card Spacing
| Property | Value |
|----------|-------|
| Card padding | `p-5`, `p-6` |
| Card gap (grid) | `gap-4`, `gap-6` |
| Section vertical | `space-y-6` |
| List spacing | `space-y-1`, `mt-4` |
| Table cell padding | `px-4 py-4`, `px-3 py-2.5` |

### Border Radius
| Radius | Usage |
|--------|-------|
| `rounded-[10px]` | Buttons, nav items |
| `rounded-xl` (12px) | Cards, containers |
| `rounded-2xl` (16px) | Feature cards landing |
| `rounded-[30px]` | Hero card overlay |
| `rounded-full` | Badges, avatars, pagination dots |

### Shadows
| Class | Usage |
|-------|-------|
| `shadow-sm` | Cards, containers |
| `shadow-lg` | CTA buttons, feature cards |
| `shadow-md` | Active nav item |
| `shadow-xl` | Login button hover |

---

## 4. Component Patterns

### Sidebar (`w-[260px]`)
- Fixed left, full height
- Logo: `h-10 w-auto` UNAND logo + "MyUnand Student Connect / Universitas Andalas"
- Nav items: `rounded-[10px] px-3 py-2.5 text-sm text-[#333]`
  - Default: `text-[#333] hover:bg-gradient-to-r hover:from-brand-dark hover:to-brand-light hover:text-white`
  - Active: `bg-gradient-to-r from-brand-dark to-brand-light font-semibold text-white shadow-md`
- Sub-menu items: `pl-8`, `rounded-[10px] px-3 py-2 text-sm`
- Logout: `hover:bg-red-50 hover:text-red-600`

### Dashboard Header
- Sticky top, `h-[86px]`, border-bottom `#e9ebf8`
- Right-aligned: user avatar `h-[50px] w-[50px] rounded-full bg-brand-dark text-white`

### StatCard
```
rounded-xl border border-[#e9ebf8] bg-white p-5 shadow-sm
- Label: text-sm text-[#616161]
- Value: text-3xl font-bold text-brand-dark
- Icon: h-10 w-10 rounded-lg bg-[#f0f4f0] text-brand-dark
```

### DataTable
```
rounded-xl border border-[#e9ebf8] bg-white shadow-sm
- Header: bg-gradient-to-r from-brand-dark to-brand-light
- Row: border-b border-[#e9ebf8] last:border-0
- Cell: px-4 py-4 align-top
```

### StatusBadge
```
inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold
- Dot: h-1.5 w-1.5 rounded-full
- Status variants: emerald (success), amber (pending), red (rejected)
```

### ProgressBar
```
- Track: rounded-full bg-[#e9ebf8]
- Fill: rounded-full bg-brand-light (or brand-dark)
- Height: h-2.5 (default), h-2 (small)
```

### Buttons
| Type | Style |
|------|-------|
| Primary | `rounded-[10px] bg-gradient-to-r from-brand-dark to-brand-light text-white font-semibold shadow-lg hover:opacity-90` |
| Secondary | `rounded-md border border-[#e9ebf8] px-3 py-1 text-[#616161]` |
| CTA landing | `rounded-[10px] bg-white px-8 py-4 font-semibold text-brand-darker shadow-lg hover:bg-white/90` |
| Login | `h-16 w-full rounded-xl bg-gradient-to-r from-brand-dark to-brand-light text-[20px] font-medium text-white shadow-lg hover:shadow-xl` |

### Input Fields
```
rounded-xl border border-brand-dark px-5 h-16
- Label: text-[20px] font-light leading-[30px] text-black
- Input: text-[16px] text-black placeholder:text-[#969696]
```

### DatePicker
- Border: `border-[#e9ebf8]`
- Selected day: `bg-[#1C4122] text-white rounded-full`
- Hover: `bg-[#e8f5e9] rounded-full`
- Header month: `text-[#1C4122] font-bold`

---

## 5. Login Page Layout
```
Left panel (lg): w-1/2, bg-brand-gradient, decorative SVG ellipses
  - "Hallo, Selamat Datang !" (text-4xl/6xl bold white)
  - Description text white

Right panel (lg): w-1/2 bg-white
  - Logo top-right: pr-[180px] pt-[111px]
  - Form centered: px-[86px]
    - "Log in" heading (text-[36px] font-bold)
    - "Silahkan login..." subtitle (text-[20px] text-[#969696])
    - Input: rounded-xl border border-brand-dark h-16 px-5
    - Login button: h-16 rounded-xl bg-gradient
```

---

## 6. Landing Page Sections
| Section | Style |
|---------|-------|
| Navbar | `bg-brand-darker h-[99px] max-w-[1440px]` |
| Hero | `bg-gradient-to-br from-brand-dark via-brand-mid to-brand-dark min-h-[835px]` |
| Fitur | `bg-white py-20` — green cards with white text |
| Alur | `bg-[#f9fafb] py-20` — white circle with ring shadow |
| Pengguna | `py-20` — white cards with border |
| Aturan Bisnis | `bg-[#f9fafb] py-16` |
| CTA | `bg-brand-dark py-20` white text |
| Footer | `bg-brand-darker text-white/60` |

---

## 7. Icons
Library: **lucide-react**
Common icons used: Plus, Clock, ChevronDown, LogOut, LayoutDashboard, Users, CheckCircle, Bell, Settings, BookOpen, BarChart3, FileText, History, UserCircle, LayoutGrid, UserCheck, PlusCircle, CheckSquare, Award, Download, ArrowRight, Medal, GraduationCap, Building2, ShieldCheck, Calendar

Icon size convention: `h-4 w-4` (sidebar), `h-5 w-5` (inline), `h-10 w-10` (feature cards)

---

## 8. Responsive Breakpoints
| Breakpoint | Usage |
|-----------|-------|
| `sm:` (640px) | 2-col grids, horizontal pagination |
| `md:` (768px) | 2-col feature grid |
| `lg:` (1024px) | 4-col grids, sidebar layout, 2-panel login |

---

## 9. Role-based Dashboard Menu
9 roles: mahasiswa, dosen-pa, pimpinan-ditmawa, pimpinan-fakultas, pimpinan-utama, admin-ditmawa, admin-fakultas, ukm, ukmf

Mapping: `DashboardLayout` → `Sidebar` → `roleMenuMap[role]`
