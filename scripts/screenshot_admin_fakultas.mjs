import { chromium } from 'playwright-core'

const BASE = 'http://localhost:5173'
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjMiLCJwZXJhbiI6InN0YWZmIiwibmFtYSI6IkFkbWluIEZha3VsdGFzIEZUSSIsImphYmF0YW4iOiJhZG1pbl9mYWt1bHRhcyIsImlhdCI6MTc4NTU3MzE0MiwiZXhwIjoxNzg1NjU5NTQyfQ.lQmVEv6aBqALWWAr4B5qD9LRidkaSvl4qSPGWNGMl8A'
const EXECUTABLE = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const user = {
  id: '3',
  nama: 'Admin Fakultas FTI',
  email: 'admin.fti@unand.ac.id',
  peran: 'staff',
  role: 'admin_fakultas',
  jabatan: 'admin_fakultas',
}

const pages = [
  { name: 'verifikasi-pengajuan-ukmf', path: '/admin_fakultas/verifikasi-pengajuan-ukmf' },
  { name: 'manajemen-event', path: '/admin_fakultas/manajemen-event' },
  { name: 'manajemen-akun-ukmf', path: '/admin_fakultas/manajemen-akun-ukmf' },
  { name: 'dashboard', path: '/admin_fakultas/dashboard' },
]

const browser = await chromium.launch({ executablePath: EXECUTABLE })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

for (const p of pages) {
  const page = await context.newPage()
  await page.addInitScript(
    ([token, usr]) => {
      localStorage.setItem('saps_current_user', JSON.stringify({ token, ...usr }))
    },
    [TOKEN, user],
  )
  await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `scripts/shots/${p.name}-desktop.png`, fullPage: true })
  console.log('OK desktop:', p.name)
  await page.close()
}

// Mobile viewport untuk 2 halaman utama
const mobileCtx = await browser.newContext({ viewport: { width: 390, height: 844 } })
for (const p of pages.slice(0, 3)) {
  const page = await mobileCtx.newPage()
  await page.addInitScript(
    ([token, usr]) => {
      localStorage.setItem('saps_current_user', JSON.stringify({ token, ...usr }))
    },
    [TOKEN, user],
  )
  await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `scripts/shots/${p.name}-mobile.png`, fullPage: true })
  console.log('OK mobile:', p.name)
  await page.close()
}

await mobileCtx.close()
await browser.close()
