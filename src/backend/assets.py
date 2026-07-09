import os

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from .auth import require_user_page
from .config import FRONTEND_DIST_DIR

frontend_router = APIRouter(dependencies=[Depends(require_user_page)])


def _index_html() -> str:
    index_path = FRONTEND_DIST_DIR / "index.html"
    if not index_path.is_file():
        raise HTTPException(
            500,
            f"Frontend build missing -- run `npm run build` in src/frontend "
            f"(expected {index_path}).",
        )
    return str(index_path)


# Registered last (see main.py) so it only ever catches paths /document,
# /field, /auth, and /me didn't already claim.
@frontend_router.get("/{path:path}")
async def serve_frontend(path: str):
    if path:
        requested = os.path.normpath(os.path.join(FRONTEND_DIST_DIR, path))
        # Guards against a "../../etc/passwd"-style path escaping FRONTEND_DIST_DIR.
        if requested.startswith(str(FRONTEND_DIST_DIR)) and os.path.isfile(requested):
            return FileResponse(requested)

    # "/", an unbuilt asset path, or a client-side route (e.g. reloading
    # mid-SPA-navigation) all fall back to the app shell.
    return FileResponse(_index_html())
