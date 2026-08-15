# E2E tests (Playwright)

This suite tests the app end-to-end through the real browser UI, against the
local dev servers and dev database. It does **not** use a dedicated test
database — iteration 1 keeps things simple and relies on unique, timestamped
data per run so tests stay repeatable without resetting the DB.

## Prerequisites

1. **Backend running** — in `be-saps`:

   ```bash
   npm run dev
   ```

   This must be serving on `http://localhost:3000` (default).

2. **Database seeded** — the suite logs in as the seeded demo accounts
   (password `password123` for all). From `be-saps`, at minimum run:

   ```bash
   npm run seed
   ```

   If the `pimpinan_utama` account is missing (used only by `login.spec.ts`),
   also run:

   ```bash
   npm run seed:pimpinan-utama
   ```

3. **Frontend running** — in `fe-saps`:

   ```bash
   npm run dev
   ```

   This must be serving on `http://localhost:5173` (default Vite port). The
   suite does **not** auto-start the frontend for you — start it manually
   before running tests.

## Running the tests

From `fe-saps`:

```bash
npm run test:e2e        # headless run
npm run test:e2e:ui     # interactive UI mode (recommended while debugging)
```

To point at a different frontend URL:

```bash
E2E_BASE_URL=http://localhost:4173 npm run test:e2e
```

## What's covered (iteration 1)

- `login.spec.ts` — logs in as each of the 9 seeded roles and asserts each
  lands on its expected dashboard route.
- `kegiatan-eksternal-approval-flow.spec.ts` — the core cross-role approval
  flow:
  1. **Mahasiswa** submits "Ajukan Kegiatan Eksternal".
  2. **Admin Ditmawa** verifies it, maps it to a capaian/sub-capaian, and
     forwards it to Pimpinan Ditmawa.
  3. **Pimpinan Ditmawa** gives final approval.

  This test file uses `test.describe.serial` because the 3 steps share a
  single kegiatan (created with a timestamped name to avoid collisions with
  existing rows in the shared dev DB) and must run in order.

## Not covered yet (documented follow-ups)

- Izin PA → klaim poin → validasi klaim → poin muncul di riwayat poin. This
  requires handling file upload (`bukti`) and more setup; planned as a
  follow-up iteration once this harness is proven out.
- CRUD coverage for Manajemen Event / Manajemen Peserta / Kurikulum, etc.
- CI integration (no GitHub Actions workflow exists yet in either repo).

## Notes / limitations

- The app has no `data-testid` or `id` attributes anywhere, so selectors rely
  on placeholder text, `name` attributes, and visible button/role text. If
  UI copy changes, update the corresponding selectors here.
- Tests only ever **create** data — they never reset or delete rows from the
  dev DB, so re-running the suite repeatedly against the same DB is safe but
  will leave behind extra "E2E Test Kegiatan ..." rows over time.
- Tests run serially (`workers: 1` in `playwright.config.ts`) since they
  share the same dev DB/session state and are not isolated from one another.
