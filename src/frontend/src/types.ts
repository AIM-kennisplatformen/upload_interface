export interface FieldData {
  title?: string | null;
  abstract?: string | null;
  authors?: string[];
  doi?: string | null;
  year?: string | null;
  journal?: string | null;
  volume?: string | null;
  issue?: string | null;
  issn?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  keywords?: string[];
  affiliations?: string[];
  acknowledgements?: string | null;
  funding_statements?: string[];
  literature_type?: string | null;
  [key: string]: unknown;
}

export type FieldStatus = 'correct' | 'incorrect' | '';

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'array';
}

export const FIELD_CONFIGS: FieldConfig[] = [
  { key: 'title',              label: 'TITLE',               type: 'textarea' },
  { key: 'abstract',           label: 'ABSTRACT',            type: 'textarea' },
  { key: 'authors',            label: 'AUTHORS',             type: 'array'    },
  { key: 'doi',                label: 'DOI',                 type: 'text'     },
  { key: 'year',               label: 'YEAR',                type: 'text'     },
  { key: 'journal',            label: 'JOURNAL',             type: 'text'     },
  { key: 'volume',             label: 'VOLUME',              type: 'text'     },
  { key: 'issue',              label: 'ISSUE',               type: 'text'     },
  { key: 'issn',               label: 'ISSN',                type: 'text'     },
  { key: 'isbn',               label: 'ISBN',                type: 'text'     },
  { key: 'publisher',          label: 'PUBLISHER',           type: 'text'     },
  { key: 'keywords',           label: 'KEYWORDS',            type: 'array'    },
  { key: 'affiliations',       label: 'AFFILIATIONS',        type: 'array'    },
  { key: 'acknowledgements',   label: 'ACKNOWLEDGEMENTS',    type: 'textarea' },
  { key: 'funding_statements', label: 'FUNDING STATEMENTS',  type: 'array'    },
  { key: 'literature_type',    label: 'LITERATURE TYPE',     type: 'text'     },
];

export function normalizePdfName(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
