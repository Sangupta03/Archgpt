# auth.py — Google OAuth + JWT token logic

import httpx
import os
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import HTTPException, Header
from dotenv import load_dotenv

load_dotenv()

GOOGLE_CLIENT_ID     = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
JWT_SECRET           = os.getenv("JWT_SECRET")
FRONTEND_URL         = os.getenv("FRONTEND_URL", "http://localhost:5173")

ALGORITHM   = "HS256"       # HMAC-SHA256 signing algorithm
TOKEN_EXPIRY = 7            # JWT valid for 7 days

# ── Google OAuth URLs ─────────────────────────────────────
GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USER_URL  = "https://www.googleapis.com/oauth2/v2/userinfo"

def get_google_auth_url(redirect_uri: str) -> str:
    """
    Build the URL we redirect the user to for Google login.
    scope=openid email profile — what info we're requesting access to.
    """
    params = {
        "client_id":     GOOGLE_CLIENT_ID,
        "redirect_uri":  redirect_uri,
        "response_type": "code",
        "scope":         "openid email profile",
        "access_type":   "offline",
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{GOOGLE_AUTH_URL}?{query}"

async def exchange_code_for_user(code: str, redirect_uri: str) -> dict:
    """
    Exchange the authorization code Google gave us for user info.
    Two steps:
    1. POST to Google with the code → get access_token
    2. GET user info using that access_token
    """
    async with httpx.AsyncClient() as client:

        # Step 1: exchange code for tokens
        token_resp = await client.post(GOOGLE_TOKEN_URL, data={
            "client_id":     GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code":          code,
            "redirect_uri":  redirect_uri,
            "grant_type":    "authorization_code",
        })
        tokens = token_resp.json()
        access_token = tokens.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get Google access token")

        # Step 2: use access_token to get user info
        user_resp = await client.get(
            GOOGLE_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"}
        )
        return user_resp.json()
        # Returns: {id, email, name, picture, verified_email}

# ── JWT functions ─────────────────────────────────────────

def create_jwt(user_id: int, email: str) -> str:
    """
    Create a signed JWT token containing user_id and email.
    exp = expiry time — token invalid after this.
    """
    payload = {
        "user_id": user_id,
        "email":   email,
        "exp":     datetime.utcnow() + timedelta(days=TOKEN_EXPIRY)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

def verify_jwt(token: str) -> dict:
    """
    Verify a JWT token and return its payload.
    Raises HTTPException if invalid or expired.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def get_current_user_id(authorization: str = Header(None)) -> int:
    """
    FastAPI dependency — extracts and validates JWT from Authorization header.
    Usage: add `user_id: int = Depends(get_current_user_id)` to any route
    that requires login.

    Authorization header format: "Bearer eyJhbGci..."
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.split(" ")[1]  # extract token after "Bearer "
    payload = verify_jwt(token)
    return payload["user_id"]