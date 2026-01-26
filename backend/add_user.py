import asyncio
import sys
import os
from datetime import datetime

# Add the current directory to sys.path so we can import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from mongodb import db as mongo_db
from services.auth_service import AuthService

async def add_user(email, password, name=None):
    # Connect to MongoDB
    mongo_db.connect()
    
    # Check if user already exists
    existing_user = await mongo_db.db.users.find_one({"email": email})
    if existing_user:
        print(f"Error: User with email '{email}' already exists.")
        mongo_db.close()
        return

    # Hash password
    hashed_password = AuthService.get_password_hash(password)
    
    # Create user document
    new_user = {
        "email": email,
        "hashed_password": hashed_password,
        "name": name or email.split("@")[0],
        "created_at": str(datetime.now())
    }
    
    # Insert into DB
    result = await mongo_db.db.users.insert_one(new_user)
    print(f"Successfully added user: {email}")
    print(f"User ID: {result.inserted_id}")
    
    mongo_db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python add_user.py <email> <password> [name]")
        print("Example: python add_user.py employee@company.com my-secret-pass 'John Doe'")
    else:
        email = sys.argv[1]
        password = sys.argv[2]
        name = sys.argv[3] if len(sys.argv) > 3 else None
        
        asyncio.run(add_user(email, password, name))
