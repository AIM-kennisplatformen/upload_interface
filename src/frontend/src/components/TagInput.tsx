import { useRef, useState } from "react";

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
}

export default function TagInput({ values, onChange }: Props) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const v = raw.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(input);
    }
    if (e.key === "Backspace" && !input && values.length)
      onChange(values.slice(0, -1));
  }

  return (
    <div
      className="bg-background focus-within:border-accent flex cursor-text flex-wrap items-center gap-1 rounded-md border px-1.5 py-1.25 transition-colors duration-150"
      onClick={() => inputRef.current?.focus()}>
      {values.map((v, i) => (
        <span
          key={i}
          className="bg-card border-border flex max-w-55 items-center gap-1 rounded border px-1.5 py-0.5 text-[11px]">
          <span title={v}>{v}</span>
          <span
            className="text-muted-foreground hover:text-destructive shrink-0 cursor-pointer text-xs leading-none"
            onClick={(e) => {
              e.stopPropagation();
              onChange(values.filter((_, j) => j !== i));
            }}>
            ×
          </span>
        </span>
      ))}
      <input
        ref={inputRef}
        className="text-foreground min-w-20 flex-1 border-0 bg-transparent text-xs outline-none"
        value={input}
        placeholder={values.length ? "" : "Add item…"}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
