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
      <div
        className="flex
justify-between
items-center
mb-1"
      >
        <span
          className="text-[11px]
font-bold
text-muted-foreground
tracking-wider"
        >
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
          className="w-full
bg-secondary
border
focus:border-primary
text-foreground
rounded-md
px-2
py-1.5
text-xs
leading-6
resize-y
transition-colors
duration-150
focus:outline-none"
          value={strVal}
          onChange={(e) => onValueChange(key, e.target.value)}
        />
      )}
    </div>
  );
}
