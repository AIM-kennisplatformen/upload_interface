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
      null,
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
        <div
          className="bg-secondary
flex
flex-col
min-h-0"
        >
          <div
            className="m-auto
text-muted-foreground
text-[13px]
text-center
leading-8"
          >
            <strong>No PDF loaded</strong>
            <button
              className="px-7
py-2.5
bg-primary
rounded-lg
text-primary-foreground
text-sm
font-semibold
transition-opacity
duration-150
hover:opacity-85
disabled:opacity-40
disabled:cursor-default"
              onClick={onUploadClick}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Upload PDF"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="bg-secondary
flex
flex-col
min-h-0"
      >
        <div
          className="flex-1
overflow-auto
flex
flex-col
items-center
min-h-0"
        >
          <div
            className="my-5
mx-auto
shadow-[0_4px_32px_rgba(0,0,0,0.53)]"
          >
            <canvas ref={canvasRef} />
          </div>
        </div>
        {pdfDoc && (
          <div
            className="flex
items-center
justify-center
gap-3
p-2
bg-card
border-t
border-border
shrink-0"
          >
            <button
              className="btn"
              onClick={() => changePage(-1)}
              disabled={page <= 1}
            >
              ◀
            </button>
            <span
              className="text-xs
text-muted-foreground
min-w-16
text-center"
            >
              {page} / {pdfDoc.numPages}
            </span>
            <button
              className="btn"
              onClick={() => changePage(1)}
              disabled={page >= pdfDoc.numPages}
            >
              ▶
            </button>
          </div>
        )}
      </div>
    );
  },
);

PdfViewer.displayName = "PdfViewer";
export default PdfViewer;
