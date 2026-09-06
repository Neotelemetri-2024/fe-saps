/** Dua tema resmi DaisyUI: saps terang dan gelap. */
export const AVAILABLE_THEMES = [
  { id: 'saps', name: 'Terang', type: 'light' },
  { id: 'saps-dark', name: 'Gelap', type: 'dark' },
]

export const DEFAULT_THEME = 'saps'
export const DARK_THEME = 'saps-dark'

const LEGACY_THEMES = {
  light: 'saps',
  corporate: 'saps',
  dark: 'saps-dark',
  myunand: 'saps',
  'myunand-dark': 'saps-dark',
}

export const normalizeTheme = (value) => {
  if (value === DARK_THEME || value === DEFAULT_THEME) return value
  return LEGACY_THEMES[value] || DEFAULT_THEME
}

export const isDarkTheme = (id) => normalizeTheme(id) === DARK_THEME

/** Tangga ukuran huruf (px pada html, semua rem ikut membesar). */
export const FONT_SCALES = [
  { id: 'normal', label: 'Normal', px: 18 },
  { id: 'large', label: 'Besar', px: 20 },
  { id: 'xlarge', label: 'Lebih besar', px: 22 },
  { id: 'xxlarge', label: 'Sangat besar', px: 24 },
]

export const DEFAULT_FONT_SCALE = 'normal'

export const getFontScale = (id) =>
  FONT_SCALES.find((item) => item.id === id) || FONT_SCALES[0]
