import type { FieldData } from './types';

export async function uploadPdf(pdfName: string, file: File): Promise<void> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/document/${pdfName}`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? 'Upload failed');
  }
}

export async function getFields(pdfName: string): Promise<FieldData | null> {
  const res = await fetch(`/field/${pdfName}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch fields');
  return res.json();
}

export async function getGrobidFields(pdfName: string): Promise<FieldData | null> {
  const res = await fetch(`/field/grobid/${pdfName}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function createFields(pdfName: string, data: FieldData): Promise<FieldData> {
  const res = await fetch(`/field/${pdfName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create fields');
  return res.json();
}

export async function patchFields(pdfName: string, data: FieldData): Promise<FieldData> {
  const res = await fetch(`/field/${pdfName}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to save fields');
  return res.json();
}
