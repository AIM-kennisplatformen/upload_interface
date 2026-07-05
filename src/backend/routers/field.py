import json
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, status

from ..config import FIELDS_DIR, METADATA_DIR

router = APIRouter(prefix="/field", tags=["field"])


def _field_path(name: str) -> Path:
    return FIELDS_DIR / f"{name}.json"


def _load_field(name: str) -> dict:
    path = _field_path(name)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Fields for '{name}' not found")
    return json.loads(path.read_text())


def _save_field(name: str, data: dict) -> None:
    _field_path(name).write_text(json.dumps(data, indent=2, ensure_ascii=False))


FIELD_KEYS = [
    "title", "abstract", "authors", "doi", "year", "journal", "volume",
    "issue", "issn", "isbn", "publisher", "keywords", "affiliations",
    "acknowledgements", "funding_statements", "literature_type",
]

# Registered before /{pdf_name} to avoid route shadowing.
@router.get("/grobid/{pdf_name}")
def get_grobid(pdf_name: str) -> dict[str, Any]:
    """Return pre-extracted grobid metadata for a PDF (case-insensitive name match)."""
    for json_file in METADATA_DIR.glob("*.json"):
        if json_file.stem.lower() == pdf_name.lower():
            try:
                doc = json.loads(json_file.read_text())
            except (json.JSONDecodeError, OSError):
                break
            return {k: doc.get(k) for k in FIELD_KEYS}
    raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"No grobid data for '{pdf_name}'")


# ----- CRUD -----

@router.get("/{pdf_name}")
def get_fields(pdf_name: str) -> dict[str, Any]:
    return _load_field(pdf_name)


@router.post("/{pdf_name}", status_code=status.HTTP_201_CREATED)
def create_fields(pdf_name: str, body: dict[str, Any]) -> dict[str, Any]:
    if _field_path(pdf_name).exists():
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f"Fields for '{pdf_name}' already exist")
    _save_field(pdf_name, body)
    return body


@router.put("/{pdf_name}")
def replace_fields(pdf_name: str, body: dict[str, Any]) -> dict[str, Any]:
    if not _field_path(pdf_name).exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Fields for '{pdf_name}' not found")
    _save_field(pdf_name, body)
    return body


@router.patch("/{pdf_name}")
def update_fields(pdf_name: str, body: dict[str, Any]) -> dict[str, Any]:
    existing = _load_field(pdf_name)
    existing.update(body)
    _save_field(pdf_name, existing)
    return existing


@router.delete("/{pdf_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fields(pdf_name: str):
    path = _field_path(pdf_name)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"Fields for '{pdf_name}' not found")
    path.unlink()
