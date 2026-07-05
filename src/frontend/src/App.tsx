import { useCallback, useRef, useState } from 'react';
import type { FieldData } from './types';
import { normalizePdfName } from './types';
import { createFields, getFields, getGrobidFields, patchFields, uploadPdf } from './api';
import PdfViewer, { type PdfViewerHandle } from './components/PdfViewer';
import MetaPanel from './components/MetaPanel';

export default function App() {
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [fields, setFields] = useState<FieldData>({});
  const [saveStatus, setSaveStatus] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<PdfViewerHandle>(null);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const name = normalizePdfName(file.name);
    setUploading(true);
    setSaveStatus('Uploading…');
    try {
      await uploadPdf(name, file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('already exists')) {
        setSaveStatus(`Error: ${msg}`);
        setUploading(false);
        return;
      }
    }

    let existing = await getFields(name);
    if (!existing) {
      const grobid = await getGrobidFields(name);
      existing = await createFields(name, grobid ?? {});
    }

    setPdfName(name);
    setPdfUrl(`/document/${name}`);
    setFields(existing);
    setSaveStatus('');
    setUploading(false);
  }, []);

  const handleValueChange = useCallback((key: string, value: string | string[]) => {
    setFields(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!pdfName) return;
    setSaveStatus('Saving…');
    try {
      await patchFields(pdfName, fields);
      setSaveStatus('Document saved successfully!');
      setTimeout(() => {
        setPdfName(null);
        setPdfUrl(null);
        setFields({});
        setPage(1);
        setSaveStatus('');
      }, 1500);
    } catch (err: unknown) {
      setSaveStatus(`Error: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }, [pdfName, fields]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === 'ArrowLeft')  viewerRef.current?.changePage(-1);
    if (e.key === 'ArrowRight') viewerRef.current?.changePage(1);
  }, []);

  return (
    <div className="app" tabIndex={-1} onKeyDown={handleKeyDown}>
      <header className="topbar">
        <h1>Upload Interface</h1>
        {pdfName && <span className="topbar-pdf-name">{pdfName}</span>}
      </header>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <PdfViewer
        ref={viewerRef}
        url={pdfUrl}
        page={page}
        onPageChange={setPage}
        onUploadClick={() => fileInputRef.current?.click()}
        uploading={uploading}
      />

      <MetaPanel
        pdfName={pdfName}
        fields={fields}
        saveStatus={saveStatus}
        onValueChange={handleValueChange}
        onSave={handleSave}
      />
    </div>
  );
}
