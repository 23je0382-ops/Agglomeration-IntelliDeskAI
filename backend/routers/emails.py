import os
import json
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/emails", tags=["emails"])

JSON_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "emails.json")

class EmailItem(BaseModel):
    uid: str
    from_: str = "" # Pydantic alias handling might be needed if field is 'from'
    subject: str
    date: str = None
    body: str

    class Config:
        fields = {'from_': 'from'}

@router.get("/", response_model=List[dict])
def get_emails():
    """Get all ingested emails"""
    try:
        if not os.path.exists(JSON_FILE):
            return []
            
        with open(JSON_FILE, "r") as f:
            emails = json.load(f)
            # Reverse sort by date if possible, or just list
            return emails[::-1] # Newest first assumes append order
    except Exception as e:
        print(f"Error reading emails: {e}")
        return []
@router.delete("/{uid}")
def delete_email(uid: str):
    """Delete an email by UID"""
    try:
        if not os.path.exists(JSON_FILE):
            return {"message": "Email not found"}
            
        with open(JSON_FILE, "r") as f:
            emails = json.load(f)
        
        # Filter out the email
        updated_emails = [e for e in emails if str(e.get("uid")) != uid]
        
        if len(updated_emails) == len(emails):
            return {"message": "Email not found"}

        with open(JSON_FILE, "w") as f:
            json.dump(updated_emails, f, indent=4)
            
        return {"message": "Email deleted successfully"}
    except Exception as e:
        print(f"Error deleting email: {e}")
        return {"error": str(e)}
