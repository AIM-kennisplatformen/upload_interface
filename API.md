# API Reference

This repo is the frontend only (`src/frontend`) -- there is no backend here.
In production it's served behind a reverse proxy (Caddy, see the reference
`Caddyfile`/`docker-compose.yml` at the repo root) that handles real user
authentication (an Authentik forward-auth outpost gates the whole site)
and path-routes to two separate services:

- **PDF storage** — [studio](../studio)'s existing content-addressed
  `/api/pdf/{sha256}` store.
- **Field metadata** — [scepa-rs](../scepa-rs)'s metadata server, at
  `/metadata/{sha256}` (proxied here under `/api/metadata/{sha256}`).

Neither service does its own user-facing login: the reverse proxy is the
only thing that talks to Authentik, and it authorizes itself to the
backends with a static bearer key. From the browser's point of view
everything is same-origin -- no CORS, and cookies (Authentik's session,
set by the outpost) flow automatically.

For local development without Caddy, `vite.config.ts` proxies `/api/metadata`
to a local scepa-rs instance and `/api/pdf` to a local Studio instance
directly (see `npm run dev` below) -- there's no auth gate in that path, so
local dev talks to those services unauthenticated (matching however you've
configured `METADATA_API_KEYS`/Studio's own dev setup).

---

## PDF storage — `/api/pdf/{sha256}` (Studio)

The picked PDF stays in browser memory (viewed via a local `blob:` URL)
while the user reviews/edits the extracted fields, and is only actually
uploaded when the save button is clicked -- alongside the metadata
`PATCH` -- so nothing is written anywhere until the document is explicitly
saved.

- `PUT /api/pdf/{sha256}` (multipart, field `file`): stores the PDF under
  its own content hash. Idempotent -- re-uploading identical bytes is a
  safe no-op.
- `GET /api/pdf/{sha256}`: returns the raw PDF bytes.

See studio's own docs for the exact contract; this repo just calls it.

---

## Field metadata — `/api/metadata/{sha256}` (scepa-rs)

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

### `PUT /api/metadata/{sha256}`
Runs Grobid extraction on the uploaded PDF and returns the result.
Transient -- nothing is persisted here.

- **Body:** `multipart/form-data` with field `file` containing the PDF
- **Returns `200`:** JSON object (field schema)

### `GET /api/metadata/{sha256}`
Retrieves a previously-*saved* result (i.e. the save button has been
clicked for this document at least once before).

- **Returns `200`:** JSON object
- **Returns `404`:** nothing saved yet under that hash

### `PATCH /api/metadata/{sha256}`
Persists the user's edited fields -- the only endpoint that writes to
disk. Creates the record on its first call for a given hash, overwrites it
on every call after.

- **Body:** JSON object (full field-schema object)
- **Returns `200`:** the saved JSON object

---

## Running

```bash
cd src/frontend
npm install
npm run dev
```

The dev server runs on `http://localhost:5173` and proxies `/api/metadata`
to a local scepa-rs instance (`http://localhost:8081` by default) and
`/api/pdf` to a local Studio instance (`http://localhost:10090` by
default) -- see `vite.config.ts` to change either target.

`npm run build` produces the static `dist/` that the reference
`Dockerfile`/Caddy setup serves in a real deployment.
