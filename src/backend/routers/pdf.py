import shutil
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from ..auth import get_current_user
from ..config import PDFS_DIR

router = APIRouter(prefix="/document", tags=["document"], dependencies=[Depends(get_current_user)])


def _pdf_path(name: str) -> Path:
    return PDFS_DIR / f"{name}.pdf"


@router.post("/{pdf_name}", status_code=status.HTTP_201_CREATED)
async def upload_pdf(pdf_name: str, file: UploadFile):
    path = _pdf_path(pdf_name)
    if path.exists():
        raise HTTPException(status.HTTP_409_CONFLICT, detail=f"'{pdf_name}' already exists")
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF files are accepted")
    with path.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"pdf_name": pdf_name, "filename": file.filename}


@router.get("/{pdf_name}")
def get_pdf(pdf_name: str):
    path = _pdf_path(pdf_name)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"'{pdf_name}' not found")
    return FileResponse(path, media_type="application/pdf", filename=f"{pdf_name}.pdf")


@router.put("/{pdf_name}")
async def replace_pdf(pdf_name: str, file: UploadFile):
    path = _pdf_path(pdf_name)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"'{pdf_name}' not found")
    if file.content_type not in ("application/pdf", "application/octet-stream"):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Only PDF files are accepted")
    with path.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"pdf_name": pdf_name, "filename": file.filename}


@router.delete("/{pdf_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pdf(pdf_name: str):
    path = _pdf_path(pdf_name)
    if not path.exists():
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=f"'{pdf_name}' not found")
    path.unlink()
