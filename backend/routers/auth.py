from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta, datetime

# Import the shared database instance (same as main.py)
from mongodb import db as mongo_db
from services.auth_service import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    created_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Routes
@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    # Registration is disabled for company policy
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Public registration is disabled. Please contact your administrator."
    )

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    # Find user
    user = await mongo_db.db.users.find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not AuthService.verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=AuthService.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user["email"], "id": str(user["_id"])},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "created_at": user.get("created_at")
        }
    }

from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

@router.get("/me", response_model=UserResponse)
async def read_users_me(token: str = Depends(oauth2_scheme)):
    # Simple token validation endpoint
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    user_email = payload.get("sub")
    if user_email is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
    user = await mongo_db.db.users.find_one({"email": user_email})
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name"),
        "created_at": user.get("created_at")
    }
