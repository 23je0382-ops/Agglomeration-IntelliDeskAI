import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def promote_user(email):
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["IntelliuDeskAI"]
    
    # Update user role
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    
    if result.matched_count > 0:
        print(f"Successfully promoted {email} to admin.")
    else:
        print(f"User with email {email} not found.")
    
    client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
    else:
        asyncio.run(promote_user(sys.argv[1]))
