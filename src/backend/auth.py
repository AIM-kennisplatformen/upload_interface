from authlib.integrations.starlette_client import OAuth
from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse

from .config import config

# -------------------------------------------------------
# OAuth Client Setup
# -------------------------------------------------------

oauth = OAuth()
oauth.register(
    name="authentik",
    server_metadata_url=config["discovery_url"],
    client_id=config["client_id"],
    client_secret=config["client_secret"],
    client_kwargs={"scope": "openid email profile"},
)

auth_router = APIRouter()


# -------------------------------------------------------
# Helpers
# -------------------------------------------------------

def get_current_user(request: Request) -> dict:
    """
    Load the authenticated user from the session, for JSON API endpoints
    (/document, /field). These are called via fetch() from the SPA's own
    JS runtime, which can't usefully act on a redirect response, so this
    raises a plain 401 and lets the frontend decide how to react (e.g.
    navigating the whole page to /auth/login itself).
    """
    user = request.session.get("user")
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return user


def require_user_page(request: Request) -> dict:
    """
    Load the authenticated user from the session, for the served frontend
    itself (assets.py) -- a real page load, so a redirect straight to
    Authentik (mirroring studio's own get_current_user) is the right
    response, not a JSON 401 that a browser navigation couldn't act on.
    """
    user = request.session.get("user")
    if not user:
        raise HTTPException(status.HTTP_303_SEE_OTHER, headers={"Location": "/auth/login"})
    return user


# -------------------------------------------------------
# HTTP Authentication Flow
# -------------------------------------------------------

@auth_router.get("/auth/login")
async def login(request: Request):
    """Redirect the user to Authentik for authentication."""
    redirect_uri = config["base_url"] + "/auth/callback"
    return await oauth.authentik.authorize_redirect(request, redirect_uri)


@auth_router.get("/auth/callback")
async def callback(request: Request):
    """
    OAuth callback endpoint: retrieves tokens, stores userinfo in session,
    and redirects to this app's own served root (relative, so it resolves
    against wherever the callback itself is actually reachable -- always
    BACKEND_BASE_URL, since that's the fixed OAuth redirect_uri).
    """
    token = await oauth.authentik.authorize_access_token(request)
    request.session["user"] = dict(token["userinfo"])
    return RedirectResponse("/")


@auth_router.get("/auth/logout")
async def logout(request: Request):
    """Clear the user's session and log them out."""
    request.session.clear()
    return RedirectResponse(config["logout_url"])


@auth_router.get("/me")
async def me(request: Request):
    """Return authenticated user metadata, or 401 if not logged in."""
    user = get_current_user(request)
    return {"authenticated": True, "user": user}
