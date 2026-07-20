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
      className="bg-background
border
rounded-md
px-1.5
py-1.25
flex
flex-wrap
gap-1
items-center
cursor-text
transition-colors
duration-150
focus-within:border-accent"
      onClick={() => inputRef.current?.focus()}
    >
      {values.map((v, i) => (
        <span
          key={i}
          className="flex
items-center
gap-1
bg-card
border
border-border
rounded
px-1.5
py-0.5
text-[11px]
max-w-55"
        >
          <span title={v}>{v}</span>
          <span
            className="text-muted-foreground
cursor-pointer
text-xs
leading-none
shrink-0
hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onChange(values.filter((_, j) => j !== i));
            }}
          >
            ×
          </span>
        </span>
      ))}
      <input
        ref={inputRef}
        className="border-0
bg-transparent
text-foreground
text-xs
outline-none
min-w-20
flex-1"
        value={input}
        placeholder={values.length ? "" : "Add item…"}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
