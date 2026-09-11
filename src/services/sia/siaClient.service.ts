/**
 * SIA Client Service
 * ------------------
 * HTTP client untuk berkomunikasi dengan API SIA Universitas Andalas.
 * Menangani autentikasi token dan caching otomatis.
 */
import 'dotenv/config';

// ─── Konfigurasi dari .env ────────────────────────────────────────────────────
const SIA_BASE_URL = process.env.SIA_API_BASE_URL || '';
const SIA_USER_ID = process.env.SIA_USER_ID || '';
const SIA_PIN = process.env.SIA_PIN || '';

// ─── Token Cache ──────────────────────────────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0; // Unix timestamp (ms)
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 menit (margin 5 menit dari asumsi 1 jam)

/**
 * Memvalidasi bahwa semua variabel env SIA sudah dikonfigurasi.
 */
function assertConfigured(): void {
  if (!SIA_BASE_URL || !SIA_USER_ID || !SIA_PIN) {
    throw new Error(
      '[SIA] Konfigurasi belum lengkap. Pastikan SIA_API_BASE_URL, SIA_USER_ID, dan SIA_PIN sudah diisi di file .env',
    );
  }
}

/**
 * Mendapatkan token autentikasi dari API SIA.
 * Jika token masih valid di cache, mengembalikan token dari cache.
 * Jika tidak, melakukan request baru ke /auth/get-token.
 */
export async function getSiaToken(): Promise<string> {
  assertConfigured();

  // Gunakan cache jika masih valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  console.log('[SIA] Meminta token baru dari API SIA...');

  const response = await fetch(`${SIA_BASE_URL}/auth/get-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userid: SIA_USER_ID, pin: SIA_PIN }),
  });

  if (!response.ok) {
    throw new Error(`[SIA] Gagal mendapatkan token: HTTP ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as {
    status: string;
    message: string;
    token?: string;
  };

  if (result.status !== 'success' || !result.token) {
    throw new Error(`[SIA] Autentikasi gagal: ${result.message}`);
  }

  // Simpan di cache
  cachedToken = result.token;
  tokenExpiresAt = Date.now() + TOKEN_TTL_MS;

  console.log('[SIA] Token berhasil diperoleh dan di-cache.');
  return cachedToken;
}

/**
 * Fetch data dari endpoint SIA dengan autentikasi Bearer token.
 * Jika token expired, otomatis re-login.
 *
 * @param endpoint - Path relatif dari base URL, contoh: "/saps/list-fakultas"
 * @param body     - Request body opsional (JSON)
 */
export async function siaFetch<T = any>(
  endpoint: string,
  body?: Record<string, any>,
): Promise<T> {
  assertConfigured();

  const token = await getSiaToken();
  const url = `${SIA_BASE_URL}${endpoint}`;

  console.log(`[SIA] Fetching: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : JSON.stringify({}),
  });

  if (!response.ok) {
    // Jika 401/403, kemungkinan token expired — invalidate cache
    if (response.status === 401 || response.status === 403) {
      console.log('[SIA] Token expired, meminta token baru...');
      cachedToken = null;
      tokenExpiresAt = 0;

      // Retry sekali dengan token baru
      const newToken = await getSiaToken();
      const retryResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
        },
        body: body ? JSON.stringify(body) : JSON.stringify({}),
      });

      if (!retryResponse.ok) {
        throw new Error(`[SIA] Retry gagal: HTTP ${retryResponse.status} ${retryResponse.statusText}`);
      }

      return retryResponse.json() as Promise<T>;
    }

    throw new Error(`[SIA] Request gagal: HTTP ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Menghapus cache token (berguna untuk testing atau force re-login).
 */
export function clearSiaTokenCache(): void {
  cachedToken = null;
  tokenExpiresAt = 0;
  console.log('[SIA] Token cache dihapus.');
}
