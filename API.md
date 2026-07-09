# API Reference

Base URL: `http://localhost:8000`

Interactive docs available at `http://localhost:8000/docs`.

---

## Document endpoints — `/document/{name}`

`{name}` is the normalized document identifier: lowercase, non-alphanumeric characters replaced with `-`, leading/trailing `-` stripped.  
Example: `My Paper (2024).pdf` → `my-paper-2024`

### `POST /document/{name}`
Upload a new PDF.

- **Body:** `multipart/form-data` with field `file` containing a PDF binary
- **Content-Type:** `application/pdf` or `application/octet-stream`
- **Returns `201`:** `{ "pdf_name": "...", "filename": "..." }`
- **Returns `409`:** document already exists
- **Returns `415`:** file is not a PDF

### `GET /document/{name}`
Download a PDF.

- **Returns `200`:** PDF binary (`application/pdf`)
- **Returns `404`:** not found

### `PUT /document/{name}`
Replace an existing PDF.

- **Body:** `multipart/form-data` with field `file` (same as POST)
- **Returns `200`:** `{ "pdf_name": "...", "filename": "..." }`
- **Returns `404`:** not found

### `DELETE /document/{name}`
Delete a PDF.

- **Returns `204`:** no content
- **Returns `404`:** not found

---

## Field endpoints — `/field/{name}`

Metadata fields are stored as JSON at `uploads/fields/{name}.json`.

### Field schema

```json
{
  "title":              "string or null",
  "abstract":           "string or null",
  "authors":            ["string", "..."],
  "doi":                "string or null",
  "year":               "string or null",
  "journal":            "string or null",
  "volume":             "string or null",
  "issue":              "string or null",
  "issn":               "string or null",
  "isbn":               "string or null",
  "publisher":          "string or null",
  "keywords":           ["string", "..."],
  "affiliations":       ["string", "..."],
  "acknowledgements":   "string or null",
  "funding_statements": ["string", "..."],
  "literature_type":    "string or null"
}
```

All fields are optional. Array fields default to `[]`, text fields default to `null`.

### `POST /field/{name}`
Create a new field record.

- **Body:** JSON object (field schema above, any subset)
- **Returns `201`:** the saved JSON object
- **Returns `409`:** field record already exists

### `GET /field/{name}`
Retrieve the field record.

- **Returns `200`:** JSON object
- **Returns `404`:** not found

### `PUT /field/{name}`
Replace the entire field record.

- **Body:** JSON object (full replacement)
- **Returns `200`:** the saved JSON object
- **Returns `404`:** not found

### `PATCH /field/{name}`
Partially update the field record. Only keys present in the body are updated; others are preserved.

- **Body:** JSON object (partial update)
- **Returns `200`:** the full updated JSON object
- **Returns `404`:** not found

### `DELETE /field/{name}`
Delete the field record.

- **Returns `204`:** no content
- **Returns `404`:** not found

---

## Grobid autocomplete endpoint — `/field/grobid/{name}`

### `GET /field/grobid/{name}`
Extracts Grobid metadata live for a previously-uploaded PDF: reads the PDF
from `uploads/pdfs/{name}.pdf`, hashes it, and calls `PUT
{SCEPA_METADATA_URL}/metadata/{sha256}` on the
[scepa-rs](../scepa-rs) metadata server (`Authorization: Bearer
SCEPA_METADATA_API_KEY`), which runs Grobid + the domain transform and
returns Field-schema JSON. Returns the subset of fields matching the field
schema above.

- **Returns `200`:** JSON object (field schema)
- **Returns `404`:** the named PDF has not been uploaded
- **Returns `502`:** the scepa-rs metadata server is unreachable or returned an error

Configure via `SCEPA_METADATA_URL` (default `http://localhost:8081`) and
`SCEPA_METADATA_API_KEY`.

---

## Running

```bash
# Backend (from src/)
cd src
python3 -m uvicorn backend.main:app --port 8000 --reload

# Frontend (from src/frontend/)
cd src/frontend
npm run dev
```

The frontend dev server runs on `http://localhost:5173` and proxies `/document` and `/field` requests to the backend.
