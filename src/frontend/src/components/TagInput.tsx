import { useRef, useState } from 'react';

interface Props {
  values: string[];
  onChange: (values: string[]) => void;
}

export default function TagInput({ values, onChange }: Props) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(raw: string) {
    const v = raw.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput('');
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit(input); }
    if (e.key === 'Backspace' && !input && values.length) onChange(values.slice(0, -1));
  }

  return (
    <div className="tags-wrap" onClick={() => inputRef.current?.focus()}>
      {values.map((v, i) => (
        <span key={i} className="tag-chip">
          <span title={v}>{v}</span>
          <span className="tag-remove" onClick={e => { e.stopPropagation(); onChange(values.filter((_, j) => j !== i)); }}>×</span>
        </span>
      ))}
      <input
        ref={inputRef}
        className="tag-input-el"
        value={input}
        placeholder={values.length ? '' : 'Add item…'}
        onChange={e => setInput(e.target.value)}
        onKeyDown={onKeyDown}
      />
    </div>
  );
}
