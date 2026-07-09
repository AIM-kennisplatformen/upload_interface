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
    Load the authenticated user from the session.

    Unlike studio's own get_current_user (which 307s, since its frontend
    is served by this same app), this backend is called by a separately
    hosted SPA via fetch() -- a redirect response isn't actionable there,
    so this raises a plain 401 instead and lets the frontend decide how to
    react (e.g. navigating the whole page to /auth/login itself).
    """
    user = request.session.get("user")
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
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
    """OAuth callback endpoint: retrieves tokens and stores userinfo in session."""
    token = await oauth.authentik.authorize_access_token(request)
    request.session["user"] = dict(token["userinfo"])
    return RedirectResponse(config["frontend_url"])


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
