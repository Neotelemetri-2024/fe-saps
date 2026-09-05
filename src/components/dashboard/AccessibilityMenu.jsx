import { Accessibility, Minus, Moon, Plus, Sun } from 'lucide-react'
import { FONT_SCALES, getFontScale, isDarkTheme } from '../../constants/theme'
import { useAppearance } from '../../lib/appearance'

/**
 * Menu kemudahan: ganti terang/gelap dan perbesar huruf.
 * Ukuran huruf disimpan di html supaya seluruh teks berbasis rem ikut membesar.
 */
export default function AccessibilityMenu() {
  const { theme, toggleTheme, fontScale, setFontScale, stepFontScale } = useAppearance()
  const dark = isDarkTheme(theme)
  const current = getFontScale(fontScale)
  const index = FONT_SCALES.findIndex((item) => item.id === current.id)
  const atMin = index <= 0
  const atMax = index >= FONT_SCALES.length - 1

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        tabIndex={0}
        className="btn btn-ghost btn-square btn-sm"
        aria-label="Kemudahan tampilan"
        title="Kemudahan"
      >
        <Accessibility className="h-5 w-5" />
      </button>
      <div
        tabIndex={0}
        className="dropdown-content z-30 mt-2 w-72 rounded-md border border-base-300 bg-base-100 p-4 shadow-md"
      >
        <p className="text-sm font-semibold text-base-content">Kemudahan tampilan</p>

        <p className="mt-3 text-xs font-medium text-base-content/60">Mode tampilan</p>
        <div className="join mt-1.5 w-full">
          <button
            type="button"
            className={`btn join-item btn-sm flex-1 ${!dark ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => dark && toggleTheme()}
          >
            <Sun className="h-4 w-4" />
            Terang
          </button>
          <button
            type="button"
            className={`btn join-item btn-sm flex-1 ${dark ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => !dark && toggleTheme()}
          >
            <Moon className="h-4 w-4" />
            Gelap
          </button>
        </div>

        <p className="mt-3 text-xs font-medium text-base-content/60">Ukuran huruf</p>
        <p className="text-xs text-base-content/50">Perbesar teks jika tulisan terasa kecil.</p>
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-square btn-xs"
            onClick={() => stepFontScale(-1)}
            disabled={atMin}
            aria-label="Kecilkan huruf"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="flex-1 text-center text-sm font-medium text-base-content">{current.label}</span>
          <button
            type="button"
            className="btn btn-ghost btn-square btn-xs"
            onClick={() => stepFontScale(1)}
            disabled={atMax}
            aria-label="Perbesar huruf"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {FONT_SCALES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`btn btn-xs ${fontScale === item.id ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFontScale(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
