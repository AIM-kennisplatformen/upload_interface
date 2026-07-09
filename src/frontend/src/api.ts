import type { FieldData } from './types';

/** Content hash used to key field metadata on scepa-rs (independent of /document's name-based keying). */
export async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Redirects the whole page to this backend's own login route -- a fetch()
 * can't usefully follow the Authentik redirect chain itself, so a 401 here
 * means the browser needs to navigate there directly.
 */
function redirectToLogin(): never {
  window.location.href = '/auth/login';
  throw new Error('Not authenticated; redirecting to login');
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, { ...init, credentials: 'include' });
  if (res.status === 401) return redirectToLogin();
  return res;
}

/** Whether a PDF is already stored locally under this exact name. */
export async function pdfExists(pdfName: string): Promise<boolean> {
  const res = await apiFetch(`/document/${pdfName}`, { method: 'HEAD' });
  return res.ok;
}

export async function uploadPdf(pdfName: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch(`/document/${pdfName}`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Upload failed');
  }
}

/** Retrieves a previously-saved result, without running Grobid. */
export async function getMetadata(sha256: string): Promise<FieldData | null> {
  const res = await apiFetch(`/field/${sha256}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch metadata');
  return res.json();
}

/** Runs Grobid extraction on `file` for `sha256`. Transient: not persisted. */
export async function extractMetadata(file: File, sha256: string): Promise<FieldData> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFetch(`/field/grobid/${sha256}`, { method: 'PUT', body: form });
  if (!res.ok) throw new Error('Failed to extract metadata');
  return res.json();
}

/** Persists the user's edited fields -- the only thing that writes to disk. */
export async function saveMetadata(sha256: string, data: FieldData): Promise<FieldData> {
  const res = await apiFetch(`/field/${sha256}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save metadata');
  return res.json();
}
