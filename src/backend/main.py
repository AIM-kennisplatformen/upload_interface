from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import field, pdf

app = FastAPI(
    title="Upload Interface API",
    description="PDF upload/download and metadata field management with autocomplete.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf.router)
app.include_router(field.router)
