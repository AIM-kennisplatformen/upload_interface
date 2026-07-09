from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .auth import auth_router
from .config import config
from .routers import field, pdf

app = FastAPI(
    title="Upload Interface API",
    description="PDF upload/download and metadata field management, backed by scepa-rs.",
    version="0.1.0",
)

app.add_middleware(
    SessionMiddleware,
    secret_key=config["session_secret"],
    same_site="lax",  # REQUIRED for cross-site requests (SPA on another origin)
    https_only=False,  # Only True if you deploy with HTTPS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config["base_url"], config["frontend_url"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(pdf.router)
app.include_router(field.router)
