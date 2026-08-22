export function kehadiranFilterBtnClass(active) {
  return [
    'rounded-lg px-3 py-2 text-sm font-semibold transition',
    active
      ? 'bg-gradient-to-r from-brand-dark to-brand-light text-white hover:opacity-90'
      : 'border border-[#d9dce7] bg-white text-[#444] hover:bg-[#f5f5f5]',
  ].join(' ')
}

export const pesertaResetFilterBtnClass =
  'rounded-lg border border-brand-dark bg-white px-3 py-2 text-sm font-medium text-brand-dark transition hover:bg-[#f5f5f5]'

export const pesertaDownloadBtnClass =
  'flex items-center gap-1.5 rounded-lg border border-[#d9dce7] bg-white px-3 py-2 text-sm font-semibold text-[#444] transition hover:bg-[#f5f5f5]'

export const pesertaImportBtnClass =
  'flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'

export const pesertaTambahBtnClass =
  'flex items-center gap-1.5 rounded-lg border border-brand-dark bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-[#f0faf0]'

export const pesertaEditBtnClass =
  'rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90'

export const pesertaBatalBtnClass =
  'rounded-lg border border-[#d9dce7] px-4 py-2 text-sm font-semibold text-[#444] transition hover:bg-[#f5f5f5] disabled:opacity-60'

export const pesertaSubmitBtnClass =
  'rounded-lg bg-gradient-to-r from-brand-dark to-brand-light px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
