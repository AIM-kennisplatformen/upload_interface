from pathlib import Path

BASE_DIR = Path(__file__).parent.parent.parent

PDFS_DIR = BASE_DIR / "uploads" / "pdfs"

PDFS_DIR.mkdir(parents=True, exist_ok=True)
