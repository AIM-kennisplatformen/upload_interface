from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from .assets import frontend_router
from .auth import auth_router
from .config import config
from .routers import field, pdf

app = FastAPI(
    title="Upload Interface API",
    description="PDF upload/download, metadata field management (backed by scepa-rs), and the frontend itself.",
    version="0.1.0",
)

app.add_middleware(
    SessionMiddleware,
    secret_key=config["session_secret"],
    same_site="lax",  # REQUIRED while developing the frontend with HMR (a separate origin)
    https_only=False,  # Only True if you deploy with HTTPS
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[config["base_url"], config["frontend_url"], "http://localhost:5173/",
        "http://127.0.0.1:5173/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(pdf.router)
app.include_router(field.router)
# Registered last: its catch-all "/{path:path}" route must not shadow the
# more specific routers above.
app.include_router(frontend_router)
