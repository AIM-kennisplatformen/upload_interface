import type { FieldData } from './types';

const SCEPA_METADATA_URL: string = import.meta.env.VITE_SCEPA_METADATA_URL ?? 'http://localhost:8081';

export async function uploadPdf(pdfName: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/document/${pdfName}`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Upload failed');
  }
}

/** Content hash used to key field metadata in scepa-rs's metadata server. */
export async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Redirects to scepa-rs's Authentik login so the browser picks up a
 * session cookie, then this server's /auth/callback bounces back here.
 */
function redirectToLogin(): never {
  window.location.href = `${SCEPA_METADATA_URL}/auth/login`;
  throw new Error('Not authenticated; redirecting to login');
}

async function scepaFetch(sha256: string, init: RequestInit): Promise<Response> {
  const res = await fetch(`${SCEPA_METADATA_URL}/metadata/${sha256}`, {
    ...init,
    credentials: 'include',
  });
  if (res.status === 401) return redirectToLogin();
  return res;
}

/** Retrieves a previously-extracted/saved result, without running Grobid. */
export async function getMetadata(sha256: string): Promise<FieldData | null> {
  const res = await scepaFetch(sha256, { method: 'GET' });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch metadata');
  return res.json();
}

/** Runs Grobid extraction on `file` and caches the result under `sha256`. */
export async function extractMetadata(file: File, sha256: string): Promise<FieldData> {
  const form = new FormData();
  form.append('file', file);
  const res = await scepaFetch(sha256, { method: 'PUT', body: form });
  if (!res.ok) throw new Error('Failed to extract metadata');
  return res.json();
}

/** Persists the user's edited fields over a previously-extracted result. */
export async function saveMetadata(sha256: string, data: FieldData): Promise<FieldData> {
  const res = await scepaFetch(sha256, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save metadata');
  return res.json();
}
