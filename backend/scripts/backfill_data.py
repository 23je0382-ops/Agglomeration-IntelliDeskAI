import sys
import os
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from services.customer_service import get_or_create_customer
from database import init_db

def backfill():
    print("Initializing Database...")
    init_db()
    
    json_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'emails.json')
    if not os.path.exists(json_path):
        print("No emails.json found.")
        return

    print(f"Reading {json_path}...")
    with open(json_path, "r") as f:
        emails = json.load(f)

    print(f"Found {len(emails)} emails. Processing...")
    
    count = 0
    for email in emails:
        clean_from = email.get("clean_from") or email.get("from")
        # Extract email if raw format
        if "<" in clean_from:
            clean_from = clean_from.split("<")[1].split(">")[0]
            
        if clean_from:
            try:
                # This will create Customer and Account (Organization)
                customer = get_or_create_customer(clean_from, name=clean_from.split("@")[0])
                print(f"Processed: {clean_from} -> Customer ID {customer.id}, Account ID {customer.account_id}")
                count += 1
            except Exception as e:
                print(f"Error processing {clean_from}: {e}")

    print(f"Backfill Complete. Processed {count} emails.")

if __name__ == "__main__":
    backfill()
