import type { FieldData } from "../types";
import { FIELD_CONFIGS } from "../types";
import MetaField from "./MetaField";

interface Props {
  pdfName: string | null;
  fields: FieldData;
  saveStatus: string;
  onValueChange: (key: string, value: string | string[]) => void;
  onSave: () => void;
}

export default function MetaPanel({
  pdfName,
  fields,
  saveStatus,
  onValueChange,
  onSave,
}: Props) {
  return (
    <div className="bg-card border-border flex min-h-0 flex-col overflow-hidden border-l">
      {pdfName && (
        <div className="border-border text-muted-foreground flex flex-wrap gap-3.5 border-b px-3 py-1.75 font-mono text-[10px]">
          <span>
            pdf: <span className="text-text">{pdfName}</span>
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2.5">
        {!pdfName ? (
          <p
            style={{
              color: "var(--muted)",
              fontSize: 12,
              padding: "20px 0",
              textAlign: "center",
            }}>
            Upload a PDF to edit its metadata.
          </p>
        ) : (
          FIELD_CONFIGS.map((cfg) => (
            <MetaField
              key={cfg.key}
              config={cfg}
              value={fields[cfg.key] as string | string[] | null | undefined}
              onValueChange={onValueChange}
            />
          ))
        )}
      </div>

      <div className="border-border flex items-center gap-2 border-t p-2.5">
        <button
          className="bg-primary text-primary-foreground flex-1 rounded-md p-2.25 text-[13px] font-semibold transition-opacity duration-150 hover:opacity-85 disabled:cursor-default disabled:opacity-40"
          disabled={!pdfName}
          onClick={onSave}>
          Save document
        </button>
        {saveStatus && (
          <span className="text-muted-foreground text-xs whitespace-nowrap">
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  );
}
