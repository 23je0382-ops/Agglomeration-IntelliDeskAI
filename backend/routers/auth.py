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

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    role: Optional[str] = None
    password: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: str = "member"
    created_at: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Security Dependencies
from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = AuthService.decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_email = payload.get("sub")
    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user = await mongo_db.db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

async def check_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Additional administrative privileges required"
        )
    return user

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
    print(f"DEBUG: Login Attempt for {user_credentials.email}")
    print(f"DEBUG: Input Password Length: {len(user_credentials.password)}")
    print(f"DEBUG: Stored Hash: {user['hashed_password']}")
    print(f"DEBUG: Stored Hash Length: {len(user['hashed_password'])}")
    
    if not AuthService.verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=AuthService.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user["email"], "id": str(user["_id"]), "role": user.get("role", "member")},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", "member"),
            "created_at": user.get("created_at")
        }
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "email": current_user["email"],
        "name": current_user.get("name"),
        "role": current_user.get("role", "member"),
        "created_at": current_user.get("created_at")
    }

@router.patch("/me", response_model=UserResponse)
async def update_own_profile(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    
    # Prepare update data
    update_data = user_update.dict(exclude_unset=True)
    
    # Security: Regular users cannot change their own role or other's roles via this endpoint
    if "role" in update_data:
        del update_data["role"]
        
    # Handle password hashing
    if "password" in update_data:
        password = update_data.pop("password")
        update_data["hashed_password"] = AuthService.get_password_hash(password)
    
    # Check if email is being updated and if it's already taken
    if "email" in update_data and update_data["email"] != current_user["email"]:
        existing_user = await mongo_db.db.users.find_one({"email": update_data["email"]})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    if update_data:
        await mongo_db.db.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_data}
        )
    
    # Fetch updated user
    updated_user = await mongo_db.db.users.find_one({"_id": current_user["_id"]})
    
    return {
        "id": str(updated_user["_id"]),
        "email": updated_user["email"],
        "name": updated_user.get("name"),
        "role": updated_user.get("role", "member"),
        "created_at": updated_user.get("created_at")
    }

@router.post("/add-user", response_model=UserResponse)
async def add_user(new_user: UserCreate, admin: dict = Depends(check_admin)):
    # Check if user already exists
    existing_user = await mongo_db.db.users.find_one({"email": new_user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Hash password
    hashed_password = AuthService.get_password_hash(new_user.password)
    
    # Save to DB
    user_dict = {
        "email": new_user.email,
        "hashed_password": hashed_password,
        "name": new_user.name,
        "role": "member", # Default for new users added this way
        "created_at": datetime.utcnow().isoformat()
    }
    
    result = await mongo_db.db.users.insert_one(user_dict)
    
    return {
        "id": str(result.inserted_id),
        "email": user_dict["email"],
        "name": user_dict["name"],
        "role": user_dict["role"],
        "created_at": user_dict["created_at"]
    }

@router.get("/users", response_model=list[UserResponse])
async def list_users(admin: dict = Depends(check_admin)):
    users = []
    async for user in mongo_db.db.users.find():
        users.append({
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user.get("name"),
            "role": user.get("role", "member"),
            "created_at": user.get("created_at")
        })
    return users

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: UserUpdate, admin: dict = Depends(check_admin)):
    from bson import ObjectId
    
    # Check if user exists
    user = await mongo_db.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prepare update data
    update_data = user_update.dict(exclude_unset=True)
    
    # Handle password hashing
    if "password" in update_data:
        password = update_data.pop("password")
        update_data["hashed_password"] = AuthService.get_password_hash(password)
    
    # Check if email is already taken
    if "email" in update_data and update_data["email"] != user["email"]:
        existing_user = await mongo_db.db.users.find_one({"email": update_data["email"]})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already in use")
    
    if update_data:
        await mongo_db.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
    
    return {
        "id": str(updated_user["_id"]),
        "email": updated_user["email"],
        "name": updated_user.get("name"),
        "role": updated_user.get("role", "member"),
        "created_at": updated_user.get("created_at")
    }

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, admin: dict = Depends(check_admin)):
    from bson import ObjectId
    
    # Check if user exists
    user = await mongo_db.db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from deleting themselves (optional but recommended)
    if str(user["_id"]) == admin["id"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrative account")
    
    await mongo_db.db.users.delete_one({"_id": ObjectId(user_id)})
    return None
