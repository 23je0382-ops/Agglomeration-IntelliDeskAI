import os
import json
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel
from mongodb import get_database

from services.email_service import get_email_service

router = APIRouter(prefix="/emails", tags=["emails"])

class EmailItem(BaseModel):
    uid: str
    subject: str = None
    date: str = None
    body: str = None
    from_: str = None # Alias for "from"

class ReplyModel(BaseModel):
    to_email: str
    subject: str
    body: str

@router.post("/send")
async def send_email_reply(reply: ReplyModel):
    """Send an email using the configured SMTP service"""
    service = get_email_service()
    success = service.send_email(
        to_email=reply.to_email,
        subject=reply.subject,
        body=reply.body
    )
    if success:
        return {"message": "Email sent successfully"}
    return {"message": "Failed to send email"}, 500
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

@router.delete("/all")
async def delete_all_emails():
    """Delete ALL emails from MongoDB and JSON"""
    msg = []
    # Mongo
    try:
        db = get_database()
        res = await db['Email-Store'].delete_many({})
        msg.append(f"Deleted {res.deleted_count} from MongoDB")
    except Exception as e:
        msg.append(f"Mongo Error: {str(e)}")
        
    # JSON
    try:
        if os.path.exists(JSON_FILE):
            os.remove(JSON_FILE)
            msg.append("Deleted JSON file")
            # Recreate empty
            with open(JSON_FILE, "w") as f:
                json.dump([], f)
    except Exception as e:
        msg.append(f"JSON Error: {str(e)}")
        
    return {"message": "; ".join(msg)}

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
