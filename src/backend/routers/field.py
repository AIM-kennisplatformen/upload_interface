from typing import Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from ..auth import get_current_user
from ..config import config

router = APIRouter(prefix="/field", tags=["field"], dependencies=[Depends(get_current_user)])

FIELD_KEYS = [
    "title", "abstract", "authors", "doi", "year", "journal", "volume",
    "issue", "issn", "isbn", "publisher", "keywords", "affiliations",
    "acknowledgements", "funding_statements", "literature_type",
]


async def _scepa_request(method: str, sha256: str, **kwargs) -> httpx.Response:
    """
    Relays a request to scepa-rs's metadata server, authenticating with the
    static bearer key configured for this backend -- the browser never
    sees or needs this key, only an Authentik session.
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            return await client.request(
                method,
                f"{config['scepa_metadata_url']}/metadata/{sha256}",
                headers={"Authorization": f"Bearer {config['scepa_metadata_api_key']}"},
                **kwargs,
            )
        except httpx.RequestError as error:
            raise HTTPException(
                status.HTTP_502_BAD_GATEWAY,
                detail=f"scepa-rs metadata server unreachable: {error}",
            ) from error


# Registered before /{sha256} to avoid route shadowing.
@router.put("/grobid/{sha256}")
async def extract_fields(sha256: str, file: UploadFile) -> dict[str, Any]:
    """
    Runs Grobid extraction on the uploaded PDF via scepa-rs. Transient on
    scepa-rs's side (not persisted there either) -- the PDF itself isn't
    stored anywhere yet, since nothing persists until the user saves.
    """
    content = await file.read()
    response = await _scepa_request(
        "PUT", sha256, files={"file": (file.filename or f"{sha256}.pdf", content, "application/pdf")}
    )
    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=f"scepa-rs metadata server error: {response.text}")

    doc = response.json()
    return {k: doc.get(k) for k in FIELD_KEYS}


@router.get("/{sha256}")
async def get_fields(sha256: str) -> dict[str, Any]:
    """Retrieves a previously-*saved* result (404 if never saved)."""
    response = await _scepa_request("GET", sha256)
    if response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"No saved fields for '{sha256}'")
    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=f"scepa-rs metadata server error: {response.text}")
    return response.json()


@router.patch("/{sha256}")
async def save_fields(sha256: str, body: dict[str, Any]) -> dict[str, Any]:
    """Persists the user's edited fields -- the only thing that writes to disk."""
    response = await _scepa_request("PATCH", sha256, json=body)
    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=f"scepa-rs metadata server error: {response.text}")
    return response.json()
