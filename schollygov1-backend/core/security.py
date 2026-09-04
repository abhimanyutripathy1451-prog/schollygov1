import os
import bcrypt
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional

# Configuration - Using environment variables for security
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-please-change-this") 
ALGORITHM = "HS256"
# Standard FastAPI robust token extractor
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def get_passkey_hash(passkey: str) -> str:
    """Hashes a plain text passkey using direct bcrypt."""
    password_bytes = str(passkey).encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_passkey(plain_passkey: str, hashed_passkey: str) -> bool:
    """Verifies a plain text passkey against a stored hash."""
    print(f"DEBUG: Verifying passkey format...")
        
    password_bytes = str(plain_passkey).encode('utf-8')
    hashed_bytes = hashed_passkey.encode('utf-8')
    try:
        is_valid = bcrypt.checkpw(password_bytes, hashed_bytes)
        return is_valid
    except ValueError as e:
        print(f"DEBUG: bcrypt check error: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[str]:
    """
    Dependency to extract user_id (UUID string) from the Bearer token.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        # Extracts user_id as a string to match the VARCHAR(36) UUID Database schema
        user_id: str = payload.get("sub") 
        if not user_id:
            raise ValueError
        return str(user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
