import { useEffect, useRef, useState } from 'react';
import { autocomplete } from '../api';

interface Props {
  fieldKey: string;
  query: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export default function AcDropdown({ fieldKey, query, onSelect, onClose }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hi, setHi] = useState(-1);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setTimeout(async () => {
      const results = await autocomplete(fieldKey, query);
      setSuggestions(results);
      setHi(-1);
    }, 280);
    return () => clearTimeout(id);
  }, [fieldKey, query]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  if (!suggestions.length) return null;

  return (
    <div className="ac-dropdown" ref={ref}>
      {suggestions.map((s, i) => (
        <div
          key={s}
          className={`ac-item${i === hi ? ' ac-highlighted' : ''}`}
          onMouseEnter={() => setHi(i)}
          onMouseDown={e => { e.preventDefault(); onSelect(s); }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}
