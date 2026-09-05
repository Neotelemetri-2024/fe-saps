import { useSyncExternalStore } from 'react'
import {
  DEFAULT_FONT_SCALE,
  DEFAULT_THEME,
  DARK_THEME,
  FONT_SCALES,
  getFontScale,
  normalizeTheme,
} from '../constants/theme'

const THEME_STORAGE_KEY = 'saps_theme'
const FONT_STORAGE_KEY = 'saps_font_scale'

const listeners = new Set()

function readTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored) return normalizeTheme(stored)
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return DARK_THEME
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME
}

function readFontScale() {
  try {
    const stored = localStorage.getItem(FONT_STORAGE_KEY)
    if (FONT_SCALES.some((item) => item.id === stored)) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_FONT_SCALE
}

function applyAppearance(theme, fontScaleId) {
  const scale = getFontScale(fontScaleId)
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.style.setProperty('--app-font-size', `${scale.px}px`)
}

let state = {
  theme: DEFAULT_THEME,
  fontScale: DEFAULT_FONT_SCALE,
}

function emit() {
  listeners.forEach((fn) => fn())
}

export function initAppearance() {
  const theme = readTheme()
  const fontScale = readFontScale()
  state = { theme, fontScale }
  applyAppearance(theme, fontScale)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
}

export function getAppearanceSnapshot() {
  return state
}

export function subscribeAppearance(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setTheme(newTheme) {
  const theme = normalizeTheme(newTheme)
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    /* ignore */
  }
  applyAppearance(theme, state.fontScale)
  state = { ...state, theme }
  emit()
}

export function toggleTheme() {
  setTheme(state.theme === DARK_THEME ? DEFAULT_THEME : DARK_THEME)
}

export function setFontScale(id) {
  const fontScale = getFontScale(id).id
  try {
    localStorage.setItem(FONT_STORAGE_KEY, fontScale)
  } catch {
    /* ignore */
  }
  applyAppearance(state.theme, fontScale)
  state = { ...state, fontScale }
  emit()
}

export function stepFontScale(direction) {
  const index = FONT_SCALES.findIndex((item) => item.id === state.fontScale)
  const next = FONT_SCALES[index + direction]
  if (next) setFontScale(next.id)
}

export function useAppearance() {
  const snap = useSyncExternalStore(subscribeAppearance, getAppearanceSnapshot, getAppearanceSnapshot)
  return {
    ...snap,
    setTheme,
    toggleTheme,
    setFontScale,
    stepFontScale,
  }
}
