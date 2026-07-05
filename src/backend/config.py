from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent

PDFS_DIR = BASE_DIR / "uploads" / "pdfs"
FIELDS_DIR = BASE_DIR / "uploads" / "fields"
METADATA_DIR = BASE_DIR / "test_dataset" / "metadata_grobid"

PDFS_DIR.mkdir(parents=True, exist_ok=True)
FIELDS_DIR.mkdir(parents=True, exist_ok=True)
