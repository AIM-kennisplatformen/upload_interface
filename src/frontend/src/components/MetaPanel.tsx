import type { FieldData } from '../types';
import { FIELD_CONFIGS } from '../types';
import MetaField from './MetaField';

interface Props {
  pdfName: string | null;
  fields: FieldData;
  saveStatus: string;
  onValueChange: (key: string, value: string | string[]) => void;
  onSave: () => void;
}

export default function MetaPanel({ pdfName, fields, saveStatus, onValueChange, onSave }: Props) {
  return (
    <div className="meta-panel">
      {pdfName && (
        <div className="meta-info-bar">
          <span>pdf: <span className="val">{pdfName}</span></span>
        </div>
      )}

      <div className="meta-scroll">
        {!pdfName ? (
          <p style={{ color: 'var(--muted)', fontSize: 12, padding: '20px 0', textAlign: 'center' }}>
            Upload a PDF to edit its metadata.
          </p>
        ) : (
          FIELD_CONFIGS.map(cfg => (
            <MetaField
              key={cfg.key}
              config={cfg}
              value={fields[cfg.key] as string | string[] | null | undefined}
              onValueChange={onValueChange}
            />
          ))
        )}
      </div>

      <div className="save-bar">
        <button className="btn-save" disabled={!pdfName} onClick={onSave}>
          Save document
        </button>
        {saveStatus && <span className="save-status">{saveStatus}</span>}
      </div>
    </div>
  );
}
