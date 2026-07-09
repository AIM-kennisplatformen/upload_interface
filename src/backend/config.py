import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent

PDFS_DIR = BASE_DIR / "uploads" / "pdfs"
FIELDS_DIR = BASE_DIR / "uploads" / "fields"

PDFS_DIR.mkdir(parents=True, exist_ok=True)
FIELDS_DIR.mkdir(parents=True, exist_ok=True)

# scepa-rs metadata server (PUT/GET /metadata/{sha256}): extracts Grobid
# metadata live from an uploaded PDF instead of a pre-computed dataset.
SCEPA_METADATA_URL = os.environ.get("SCEPA_METADATA_URL", "http://localhost:8081")
SCEPA_METADATA_API_KEY = os.environ.get("SCEPA_METADATA_API_KEY", "")
