import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent.parent.parent

PDFS_DIR = BASE_DIR / "uploads" / "pdfs"
PDFS_DIR.mkdir(parents=True, exist_ok=True)

# The frontend's production build (npm run build), served by this backend
# itself at "/" (see assets.py) -- no separate frontend host needed.
FRONTEND_DIST_DIR = BASE_DIR / "src" / "frontend" / "dist"


def require_env(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


config: dict = {
    # This backend's own base URL, used to build the OAuth redirect_uri
    # (must match what's registered in Authentik) -- mirrors studio's
    # BACKEND_BASE_URL. Not 8000: a docker-compose service in this project
    # family (kp-typedb) permanently publishes TypeDB's own HTTP API on
    # that port too.
    "base_url": require_env("BACKEND_BASE_URL", "http://localhost:8001"),
    "discovery_url": require_env("OAUTH_DISCOVERY_URL", ""),
    "logout_url": require_env("OAUTH_LOGOUT_URL", ""),
    "client_id": require_env("OAUTH_CLIENT_ID", ""),
    # Unlike studio, no real secret ever ships as a fallback default here --
    # an empty value just means login is misconfigured, not silently insecure.
    "client_secret": require_env("OAUTH_CLIENT_SECRET", ""),
    "session_secret": require_env("SESSION_SECRET", secrets.token_urlsafe(32)),
    # The Vite dev server's origin, needed in CORS's allow-list only while
    # developing the frontend with HMR (`pixi run frontend`) instead of
    # visiting this backend's own served build directly.
    "frontend_url": require_env("FRONTEND_URL", "http://localhost:5173"),
    # scepa-rs metadata server (PUT/GET/PATCH /metadata/{sha256}): this
    # backend is the only thing that calls it, authenticating with a
    # static bearer key -- the browser never sees or needs one.
    "scepa_metadata_url": require_env("SCEPA_METADATA_URL", "http://localhost:8081"),
    "scepa_metadata_api_key": os.getenv("SCEPA_METADATA_API_KEY", ""),
}
