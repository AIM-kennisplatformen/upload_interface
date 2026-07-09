# API Reference

Base URL: `http://localhost:8000`

Interactive docs available at `http://localhost:8000/docs`.

This backend authenticates the browser itself via an Authentik OAuth2/OIDC
login (session cookie, mirroring [studio](../studio)'s own `auth.py`), is
the only thing that talks to [scepa-rs](../scepa-rs)'s metadata server --
authenticating to it with a static bearer key (`SCEPA_METADATA_API_KEY`)
the browser never sees or needs -- and serves the frontend's own
production build itself at `/` (`npm run build`'s `src/frontend/dist`).
Every route below except `/auth/*` requires a valid session: the JSON API
routes (`/document`, `/field`, `/me`) return a `401` (the frontend then
navigates the whole page to `/auth/login`), while `/` and any other page
route redirect straight there (`303`) before the page even loads.

---

## Auth endpoints — `/auth/*`

### `GET /auth/login`
Redirects to Authentik for authentication.

### `GET /auth/callback`
OAuth callback: exchanges the code, stores the user in the session, and
redirects to `/` (this backend's own served frontend).

### `GET /auth/logout`
Clears the session and redirects to `OAUTH_LOGOUT_URL`.

### `GET /me`
Returns the current session's user.

- **Returns `200`:** `{ "authenticated": true, "user": {...} }`
- **Returns `401`:** not logged in

---

## Document endpoints — `/document/{name}`

`{name}` is the normalized document identifier: lowercase, non-alphanumeric characters replaced with `-`, leading/trailing `-` stripped.  
Example: `My Paper (2024).pdf` → `my-paper-2024`

The frontend does not call `POST /document/{name}` at file-pick time. The
picked PDF stays in browser memory (viewed via a local `blob:` URL) while
the user reviews/edits the extracted fields, and is only actually uploaded
here when the save button is clicked -- alongside the field `PATCH` below
-- so nothing is written anywhere until the document is explicitly saved.

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

## Field endpoints — `/field/{sha256}`

Field metadata is content-addressed by the PDF's own sha256 (computed
client-side via `crypto.subtle.digest`), independently of `/document`'s
name-based storage -- so re-picking identical bytes under a different
filename reuses whatever was already extracted/saved for that hash, even
if the PDF itself hasn't been uploaded under this filename yet.

This backend never stores field data itself: every route below is a thin,
session-authenticated relay to scepa-rs's metadata server, which does the
actual Grobid extraction and persistence.

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

### `PUT /field/grobid/{sha256}`
Runs Grobid extraction on the uploaded PDF (relayed to scepa-rs) and
returns the result. Transient -- nothing is persisted, here or on
scepa-rs, until the fields are explicitly saved.

- **Body:** `multipart/form-data` with field `file` containing the PDF
- **Returns `200`:** JSON object (field schema)

### `GET /field/{sha256}`
Retrieves a previously-*saved* result.

- **Returns `200`:** JSON object
- **Returns `404`:** nothing saved yet under that hash

### `PATCH /field/{sha256}`
Persists the user's edited fields -- the only endpoint in this chain that
writes to disk (on scepa-rs).

- **Body:** JSON object (full field-schema object)
- **Returns `200`:** the saved JSON object

---

## Running

```bash
# Backend (from repo root)
pixi run backend

# Frontend (from repo root)
pixi run frontend
```

The frontend dev server runs on `http://localhost:5173` and proxies
`/document`, `/field`, `/auth`, and `/me` to this backend (`http://localhost:8000`
by default) -- see `vite.config.ts` to change the target.
