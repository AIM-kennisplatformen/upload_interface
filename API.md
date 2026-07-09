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

## Field metadata — served directly by scepa-rs, not this backend

This backend no longer stores or serves field metadata at all: this
frontend calls [scepa-rs](../scepa-rs)'s metadata server
(`VITE_SCEPA_METADATA_URL`, default `http://localhost:8081`) directly,
credentialed cookie included, for extraction, retrieval, and saving.
Content-addressed by the uploaded PDF's own sha256 (computed client-side via
`crypto.subtle.digest`), not by document name, so re-uploading identical
bytes under a different filename reuses whatever was already
extracted/saved.

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

### `PUT {VITE_SCEPA_METADATA_URL}/metadata/{sha256}`
Runs Grobid extraction on the uploaded PDF and caches the result under its
own content hash.

- **Body:** `multipart/form-data` with field `file` containing the PDF
- **Returns `200`:** JSON object (field schema)

### `GET {VITE_SCEPA_METADATA_URL}/metadata/{sha256}`
Retrieves a previously-extracted/saved result without rerunning Grobid.

- **Returns `200`:** JSON object
- **Returns `404`:** nothing extracted yet under that hash

### `PATCH {VITE_SCEPA_METADATA_URL}/metadata/{sha256}`
Persists the user's edited fields (the save button).

- **Body:** JSON object (full field-schema object)
- **Returns `200`:** the saved JSON object
- **Returns `404`:** nothing extracted yet under that hash

All three require either an authenticated browser session (an Authentik
login via that server's own `/auth/login`, see its README) or, for machine
clients, `Authorization: Bearer <key>`. A `401` from any of these redirects
the whole page to `{VITE_SCEPA_METADATA_URL}/auth/login`; the in-progress
upload is lost and must be retried after logging in.

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

The frontend dev server runs on `http://localhost:5173` and proxies
`/document` to this backend; field metadata requests go straight to
scepa-rs's metadata server (`VITE_SCEPA_METADATA_URL`) instead, a true
cross-origin request relying on that server's CORS + session cookie.
