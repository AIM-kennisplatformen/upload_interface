import hashlib
import json
from pathlib import Path
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status

from ..config import FIELDS_DIR, PDFS_DIR, SCEPA_METADATA_API_KEY, SCEPA_METADATA_URL

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
async def get_grobid(pdf_name: str) -> dict[str, Any]:
    """Extract Grobid metadata live from the uploaded PDF via the scepa-rs metadata server."""
    pdf_path = PDFS_DIR / f"{pdf_name}.pdf"
    if not pdf_path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"'{pdf_name}' not found")

    pdf_bytes = pdf_path.read_bytes()
    sha256 = hashlib.sha256(pdf_bytes).hexdigest()

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.put(
                f"{SCEPA_METADATA_URL}/metadata/{sha256}",
                headers={"Authorization": f"Bearer {SCEPA_METADATA_API_KEY}"},
                files={"file": (f"{pdf_name}.pdf", pdf_bytes, "application/pdf")},
            )
        except httpx.RequestError as error:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                detail=f"scepa-rs metadata server unreachable: {error}",
            ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY,
            detail=f"scepa-rs metadata server error: {response.text}",
        )

    doc = response.json()
    return {k: doc.get(k) for k in FIELD_KEYS}


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
