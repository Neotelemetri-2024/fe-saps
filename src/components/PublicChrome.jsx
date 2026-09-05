import AccessibilityMenu from './dashboard/AccessibilityMenu'
import logoUnand from '../assets/logo_unand.png'

export default function PublicChrome({ children }) {
  return (
    <div className="relative min-h-screen bg-base-200 font-sans">
      <div className="absolute right-3 top-3 z-20 sm:right-5 sm:top-5">
        <AccessibilityMenu />
      </div>
      {children}
    </div>
  )
}

export function PublicStatus({ code, title, description, actions }) {
  return (
    <PublicChrome>
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <img src={logoUnand} alt="Universitas Andalas" className="h-12 w-12 object-contain" />
        {code ? <p className="mt-6 text-sm font-semibold text-primary">{code}</p> : null}
        <h1 className="mt-2 text-2xl font-extrabold text-base-content">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-relaxed text-base-content/60">{description}</p> : null}
        {actions ? <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div> : null}
      </div>
    </PublicChrome>
  )
}

export function PublicLoading() {
  return (
    <PublicChrome>
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <span className="loading loading-spinner loading-md text-primary" />
      </div>
    </PublicChrome>
  )
}
