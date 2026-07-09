import type { FieldData } from './types';

/** Content hash used to key both the PDF store and field metadata. */
export async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Stores the PDF in Studio's content-addressed store. Idempotent: Studio
 * treats re-uploading identical bytes under their own hash as a safe no-op.
 */
export async function uploadPdf(sha256: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/pdf/${sha256}`, { method: 'PUT', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Upload failed');
  }
}

/** Retrieves a previously-saved result, without running Grobid. */
export async function getMetadata(sha256: string): Promise<FieldData | null> {
  const res = await fetch(`/api/metadata/${sha256}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch metadata');
  return res.json();
}

/** Runs Grobid extraction on `file` for `sha256`. Transient: not persisted. */
export async function extractMetadata(file: File, sha256: string): Promise<FieldData> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/metadata/${sha256}`, { method: 'PUT', body: form });
  if (!res.ok) throw new Error('Failed to extract metadata');
  return res.json();
}

/** Persists the user's edited fields -- the only thing that writes to disk. */
export async function saveMetadata(sha256: string, data: FieldData): Promise<FieldData> {
  const res = await fetch(`/api/metadata/${sha256}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save metadata');
  return res.json();
}
