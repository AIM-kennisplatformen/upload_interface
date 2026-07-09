from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import pdf

app = FastAPI(
    title="Upload Interface API",
    description="PDF upload/download; field metadata is served directly by scepa-rs's metadata server.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf.router)
