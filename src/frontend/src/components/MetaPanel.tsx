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
    <div
      className="bg-card
border-l
border-border
flex
flex-col
overflow-hidden
min-h-0"
    >
      {pdfName && (
        <div
          className="px-3
py-1.75
border-b
border-border
text-[10px]
text-muted-foreground
font-mono
flex
gap-3.5
flex-wrap"
        >
          <span>
            pdf: <span className="text-text">{pdfName}</span>
          </span>
        </div>
      )}

      <div
        className="flex-1
overflow-y-auto
p-2.5"
      >
        {!pdfName ? (
          <p
            style={{
              color: "var(--muted)",
              fontSize: 12,
              padding: "20px 0",
              textAlign: "center",
            }}
          >
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

      <div
        className="p-2.5
border-t
border-border
flex
gap-2
items-center"
      >
        <button
          className="flex-1
p-2.25
bg-primary
rounded-md
text-primary-foreground
text-[13px]
font-semibold
transition-opacity
duration-150
hover:opacity-85
disabled:opacity-40
disabled:cursor-default"
          disabled={!pdfName}
          onClick={onSave}
        >
          Save document
        </button>
        {saveStatus && (
          <span
            className="text-xs
text-muted-foreground
whitespace-nowrap"
          >
            {saveStatus}
          </span>
        )}
      </div>
    </div>
  );
}
