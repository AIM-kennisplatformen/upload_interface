import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export interface PdfViewerHandle {
  changePage: (delta: number) => void;
}

interface Props {
  url: string | null;
  page: number;
  onPageChange: (page: number) => void;
  onUploadClick: () => void;
  uploading: boolean;
}

const PdfViewer = forwardRef<PdfViewerHandle, Props>(
  ({ url, page, onPageChange, onUploadClick, uploading }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(
      null
    );
    const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null);
    const scale = 1.5;

    const changePage = (delta: number) => {
      if (!pdfDoc) return;
      const next = page + delta;
      if (next >= 1 && next <= pdfDoc.numPages) onPageChange(next);
    };

    useImperativeHandle(ref, () => ({ changePage }), [
      pdfDoc,
      page,
      onPageChange,
    ]);

    useEffect(() => {
      if (!url) {
        setPdfDoc(null);
        return;
      }
      let cancelled = false;
      (async () => {
        // withCredentials is required for the /document/{name} case (session
        // cookie); it's simply ignored for blob: URLs (not-yet-saved PDFs).
        const doc = await pdfjsLib.getDocument({ url, withCredentials: true })
          .promise;
        if (cancelled) return;
        setPdfDoc(doc);
        onPageChange(1);
      })();
      return () => {
        cancelled = true;
      };
    }, [url]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!pdfDoc || !canvas || page < 1) return;
      let cancelled = false;
      (async () => {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }
        const pdfPage = await pdfDoc.getPage(page);
        if (cancelled) return;
        const viewport = pdfPage.getViewport({ scale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const task = pdfPage.render({ canvas, viewport });
        renderTaskRef.current = task;
        try {
          await task.promise;
        } catch {
          /* cancelled */
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [pdfDoc, page]);

    if (!url) {
      return (
        <div className="bg-secondary flex min-h-0 flex-col justify-center">
          <div className="text-muted-foreground m-auto flex flex-col items-center text-center text-[13px]">
            <strong>No PDF loaded</strong>
            <button
              className="bg-primary text-primary-foreground rounded-lg px-7 py-2.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-85 disabled:cursor-default disabled:opacity-40"
              onClick={onUploadClick}
              disabled={uploading}>
              {uploading ? "Uploading…" : "Upload PDF"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-secondary flex min-h-0 flex-col">
        <div className="flex min-h-0 flex-1 flex-col items-center overflow-auto">
          <div className="mx-auto my-5 shadow-[0_4px_32px_rgba(0,0,0,0.53)]">
            <canvas ref={canvasRef} />
          </div>
        </div>
        {pdfDoc && (
          <div className="bg-card border-border flex shrink-0 items-center justify-center gap-3 border-t p-2">
            <button
              className="btn"
              onClick={() => changePage(-1)}
              disabled={page <= 1}>
              ◀
            </button>
            <span className="text-muted-foreground min-w-16 text-center text-xs">
              {page} / {pdfDoc.numPages}
            </span>
            <button
              className="btn"
              onClick={() => changePage(1)}
              disabled={page >= pdfDoc.numPages}>
              ▶
            </button>
          </div>
        )}
      </div>
    );
  }
);

PdfViewer.displayName = "PdfViewer";
export default PdfViewer;
