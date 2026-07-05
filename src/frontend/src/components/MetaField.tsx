import type { FieldConfig } from '../types';
import TagInput from './TagInput';

interface Props {
  config: FieldConfig;
  value: string | string[] | null | undefined;
  onValueChange: (key: string, value: string | string[]) => void;
}

export default function MetaField({ config, value, onValueChange }: Props) {
  const { key, label, type } = config;

  const strVal = value == null ? '' : Array.isArray(value) ? value.join(', ') : String(value);
  const arrVal: string[] = Array.isArray(value) ? value : [];

  return (
    <div className="meta-field">
      <div className="meta-field-header">
        <span className="field-name">{label}</span>
      </div>

      {type === 'array' ? (
        <TagInput
          values={arrVal}
          onChange={v => onValueChange(key, v)}
        />
      ) : type === 'textarea' ? (
        <textarea
          className="field-textarea"
          value={strVal}
          onChange={e => onValueChange(key, e.target.value)}
          rows={key === 'abstract' ? 6 : 3}
        />
      ) : (
        <input
          className="field-input"
          value={strVal}
          onChange={e => onValueChange(key, e.target.value)}
        />
      )}
    </div>
  );
}
