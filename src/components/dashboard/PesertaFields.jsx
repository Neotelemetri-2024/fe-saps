import { pesertaFieldClass } from './pesertaToolbarStyles'

export function KehadiranSelect({ value, onChange, disabled }) {
  const current = value === true ? 'true' : value === false ? 'false' : ''
  return (
    <select
      value={current}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={pesertaFieldClass}
    >
      <option value="">Belum</option>
      <option value="true">Hadir</option>
      <option value="false">Tidak Hadir</option>
    </select>
  )
}

export function PeranSelect({ value, onChange, disabled, options = [] }) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={pesertaFieldClass}
    >
      <option value="">Pilih peran</option>
      {options.map((opt) => (
        <option key={opt.id} value={String(opt.id)}>{opt.nama}</option>
      ))}
    </select>
  )
}
