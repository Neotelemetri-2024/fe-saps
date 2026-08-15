function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} belum di-set di environment`);
  }
  return value;
}

function linkedInApiVersion(): string {
  return process.env.LINKEDIN_API_VERSION || '202607';
}

function restHeaders(accessToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${accessToken}`,
    'LinkedIn-Version': linkedInApiVersion(),
    'X-Restli-Protocol-Version': '2.0.0',
    'Content-Type': 'application/json',
  };
}

export function buildAuthorizeUrl(state: string): string {
  const clientId = requiredEnv('LINKEDIN_CLIENT_ID');
  const redirectUri = requiredEnv('LINKEDIN_REDIRECT_URI');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: 'openid profile w_member_social',
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{ accessToken: string; expiresIn: number }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: requiredEnv('LINKEDIN_CLIENT_ID'),
    client_secret: requiredEnv('LINKEDIN_CLIENT_SECRET'),
    redirect_uri: requiredEnv('LINKEDIN_REDIRECT_URI'),
  });

  const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const json = await res.json().catch(() => ({})) as { access_token?: string; expires_in?: number; error_description?: string; error?: string };
  if (!res.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || `Gagal menukar kode OAuth LinkedIn (HTTP ${res.status})`);
  }

  return { accessToken: json.access_token, expiresIn: json.expires_in ?? 5184000 };
}

export async function fetchMemberId(accessToken: string): Promise<string> {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json().catch(() => ({})) as { sub?: string; id?: string; message?: string };
  if (!res.ok || (!json.sub && !json.id)) {
    throw new Error(json.message || `Gagal mengambil profil LinkedIn (HTTP ${res.status})`);
  }
  return json.sub || json.id!;
}

async function initializeImageUpload(accessToken: string, memberId: string): Promise<{ uploadUrl: string; imageUrn: string }> {
  const res = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: restHeaders(accessToken),
    body: JSON.stringify({
      initializeUploadRequest: {
        owner: `urn:li:person:${memberId}`,
      },
    }),
  });

  const json = await res.json().catch(() => ({})) as {
    value?: { uploadUrl?: string; image?: string };
    message?: string;
  };
  const uploadUrl = json.value?.uploadUrl;
  const imageUrn = json.value?.image;
  if (!res.ok || !uploadUrl || !imageUrn) {
    throw new Error(json.message || `Gagal inisialisasi unggah gambar LinkedIn (HTTP ${res.status})`);
  }
  return { uploadUrl, imageUrn };
}

async function uploadImageBytes(uploadUrl: string, imageBuffer: Buffer): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: new Uint8Array(imageBuffer),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Gagal mengunggah gambar ke LinkedIn (HTTP ${res.status})`);
  }
}

// Posts API memakai "little text": | { } @ [ ] ( ) < > # \ * _ ~ harus di-escape.
// Tanpa ini LinkedIn diam-diam memotong caption di karakter pertama (mis. '('),
// sehingga yang tampil hanya "…tercatat di SAPS" dan sisa teks kustom hilang.
function escapeLinkedInCommentary(text: string): string {
  return text.replace(/[\\|{}\[\]()<>#*_~@]/g, '\\$&');
}

async function createImagePost(params: {
  accessToken: string;
  memberId: string;
  commentary: string;
  imageUrn: string;
}): Promise<string> {
  const res = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: restHeaders(params.accessToken),
    body: JSON.stringify({
      author: `urn:li:person:${params.memberId}`,
      commentary: escapeLinkedInCommentary(params.commentary),
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        media: {
          id: params.imageUrn,
          altText: 'CV & portofolio kegiatan kemahasiswaan SAPS Universitas Andalas',
        },
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(json.message || `Gagal membuat postingan LinkedIn (HTTP ${res.status})`);
  }

  return res.headers.get('x-restli-id') || params.imageUrn;
}

export async function uploadImageAndPost(params: {
  accessToken: string;
  memberId: string;
  commentary: string;
  imageBuffer: Buffer;
}): Promise<string> {
  const { uploadUrl, imageUrn } = await initializeImageUpload(params.accessToken, params.memberId);
  await uploadImageBytes(uploadUrl, params.imageBuffer);
  return createImagePost({
    accessToken: params.accessToken,
    memberId: params.memberId,
    commentary: params.commentary,
    imageUrn,
  });
}
