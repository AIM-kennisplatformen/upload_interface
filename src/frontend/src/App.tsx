import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldData } from "./types";
import { normalizePdfName } from "./types";
import {
  extractMetadata,
  getMetadata,
  pdfExists,
  saveMetadata,
  sha256Hex,
  uploadPdf,
} from "./api";
import PdfViewer, { type PdfViewerHandle } from "./components/PdfViewer";
import MetaPanel from "./components/MetaPanel";

export default function App() {
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [sha256, setSha256] = useState<string | null>(null);
  // Held only for a not-yet-saved document: the PDF stays in browser memory
  // (never sent to /document) until the save button actually uploads it,
  // mirroring the same "nothing persists until save" rule already applied
  // to field metadata.
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [fields, setFields] = useState<FieldData>({});
  const [saveStatus, setSaveStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<PdfViewerHandle>(null);

  // Revoke the previous blob: URL whenever it's replaced or the app unmounts.
  useEffect(() => {
    return () => {
      if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      const name = normalizePdfName(file.name);
      const hash = await sha256Hex(file);
      setUploading(true);
      setSaveStatus("Analyzing…");

      try {
        // Field metadata is content-addressed (by hash) on scepa-rs, so
        // re-picking identical bytes under a different filename reuses
        // whatever was already extracted/saved. PDF storage is name-addressed
        // locally, though, so that's a separate check -- the two aren't
        // guaranteed to agree (e.g. the same content saved once under a
        // different name).
        const [existingFields, alreadyStored] = await Promise.all([
          getMetadata(hash),
          // new Promise((resolve) => {
          //   setTimeout(() => {
          //     resolve(null);
          //   }, 100);
          // }),
          pdfExists(name),
        ]);

        const fieldsResult =
          existingFields ?? (await extractMetadata(file, hash));

        if (alreadyStored) {
          setPendingFile(null);
          setPdfUrl(`/document/${name}`);
        } else {
          setPendingFile(file);
          setPdfUrl(URL.createObjectURL(file));
        }

        setPdfName(name);
        setSha256(hash);
        setFields(fieldsResult);
        setSaveStatus("");
      } catch (err: unknown) {
        setSaveStatus(
          `Error: ${err instanceof Error ? err.message : "unknown"}`
        );
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const handleValueChange = useCallback(
    (key: string, value: string | string[]) => {
      setFields((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!sha256 || !pdfName) return;
    setSaveStatus("Saving…");
    try {
      if (pendingFile) {
        try {
          await uploadPdf(pdfName, pendingFile);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!msg.includes("already exists")) throw err;
        }
      }
      await saveMetadata(sha256, fields);
      setSaveStatus("Document saved successfully!");
      setTimeout(() => {
        setPdfName(null);
        setSha256(null);
        setPendingFile(null);
        setPdfUrl(null);
        setFields({});
        setPage(1);
        setSaveStatus("");
      }, 1500);
    } catch (err: unknown) {
      setSaveStatus(`Error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }, [sha256, pdfName, pendingFile, fields]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    )
      return;
    if (e.key === "ArrowLeft") viewerRef.current?.changePage(-1);
    if (e.key === "ArrowRight") viewerRef.current?.changePage(1);
  }, []);

  return (
    <div
      className="grid h-screen grid-cols-[1fr_380px] grid-rows-[50px_1fr] overflow-hidden"
      tabIndex={-1}
      onKeyDown={handleKeyDown}>
      <header className="bg-primary border-border col-span-full flex items-center gap-3 border-b px-4">
        <h1 className="text-[15px] font-semibold whitespace-nowrap">
          Upload Interface
        </h1>
        {pdfName && (
          <span className="text-muted-foreground max-w-70 overflow-hidden font-mono text-xs text-ellipsis whitespace-nowrap">
            {pdfName}
          </span>
        )}
      </header>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        style={{ display: "none" }}
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
