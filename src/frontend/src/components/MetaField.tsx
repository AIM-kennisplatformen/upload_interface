import type { FieldConfig } from "../types";
import TagInput from "./TagInput";

interface Props {
  config: FieldConfig;
  value: string | string[] | null | undefined;
  onValueChange: (key: string, value: string | string[]) => void;
}

export default function MetaField({ config, value, onValueChange }: Props) {
  const { key, label, type } = config;

  const strVal =
    value == null
      ? ""
      : Array.isArray(value)
        ? value.join(", ")
        : String(value);
  const arrVal: string[] = Array.isArray(value) ? value : [];

  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-muted-foreground text-[11px] font-bold tracking-wider">
          {label}
        </span>
      </div>

      {type === "array" ? (
        <TagInput values={arrVal} onChange={(v) => onValueChange(key, v)} />
      ) : type === "textarea" ? (
        <textarea
          className="min-h-18"
          value={strVal}
          onChange={(e) => onValueChange(key, e.target.value)}
          rows={key === "abstract" ? 6 : 3}
        />
      ) : (
        <input
          className="bg-secondary focus:border-primary text-foreground w-full resize-y rounded-md border px-2 py-1.5 text-xs leading-6 transition-colors duration-150 focus:outline-none"
          value={strVal}
          onChange={(e) => onValueChange(key, e.target.value)}
        />
      )}
    </div>
  );
}
