import os
import json
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from mongodb import get_database

router = APIRouter(prefix="/emails", tags=["emails"])

class EmailItem(BaseModel):
    uid: str
    from_: str = "" # Pydantic alias handling might be needed if field is 'from'
    subject: str
    date: str = None
    body: str

    class Config:
        fields = {'from_': 'from'}

JSON_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "emails.json")

# Endpoint 1: Default (JSON)
@router.get("/", response_model=List[dict])
def get_emails_json():
    """Get emails from JSON file (Fallback)"""
    try:
        print(f"DEBUG Check Path: {JSON_FILE}")
        print(f"DEBUG Exists? {os.path.exists(JSON_FILE)}")
        
        if not os.path.exists(JSON_FILE):
            print("DEBUG: JSON File not found")
            return []
            
        with open(JSON_FILE, "r") as f:
            emails = json.load(f)
            print(f"DEBUG: Found {len(emails)} emails")
            # Reverse sort
            return emails[::-1]
    except Exception as e:
        print(f"Error reading JSON emails: {e}")
        return []

# Endpoint 2: MongoDB
@router.get("/mongo", response_model=List[dict])
async def get_emails_mongo():
    """Get emails from MongoDB"""
    try:
        db = get_database()
        with open("mongo_debug.txt", "w") as log:
             log.write(f"DB Object: {db}\n")
             # Removed boolean check which causes error with Motor
             log.write(f"Collection: {db['Email-Store']}\n")
        
        cursor = db['Email-Store'].find({}, {'_id': 0}).sort("date", -1).limit(100)
        emails = await cursor.to_list(length=100)
        
        with open("mongo_debug.txt", "a") as log:
             log.write(f"Emails Found: {len(emails)}\n")
             
        return emails
    except Exception as e:
        with open("mongo_debug.txt", "a") as log:
             log.write(f"Error: {e}\n")
        print(f"Error reading MongoDB emails: {e}")
        return []

@router.delete("/{uid}")
async def delete_email(uid: str):
    """Delete an email by UID from BOTH stores"""
    msg = []
    # Delete from Mongo
    try:
        db = get_database()
        res = await db['Email-Store'].delete_one({"uid": uid})
        if res.deleted_count > 0:
            msg.append("Deleted from MongoDB")
    except Exception as e:
        msg.append(f"Mongo Error: {str(e)}")
        
    # Delete from JSON
    try:
        if os.path.exists(JSON_FILE):
            with open(JSON_FILE, "r") as f:
                emails = json.load(f)
            updated_emails = [e for e in emails if str(e.get("uid")) != uid]
            if len(updated_emails) < len(emails):
                with open(JSON_FILE, "w") as f:
                    json.dump(updated_emails, f, indent=4)
                msg.append("Deleted from JSON")
    except Exception as e:
        msg.append(f"JSON Error: {str(e)}")
        
    if not msg:
        return {"message": "Email not found in stores"}
        
    return {"message": "; ".join(msg)}
