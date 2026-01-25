import json
import time
import os
import threading
import asyncio
import smtplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from imap_tools import MailBox, AND
from database import get_db
from services.ticket_service import create_ticket_logic
from mongodb import get_sync_db
from services.customer_service import get_or_create_customer
from services.email_threading_service import get_threading_service

# Credentials
EMAIL = os.getenv("EMAIL_USER", "aglo.intellidesk.ai@gmail.com")
APP_PASSWORD = os.getenv("EMAIL_PASSWORD", "vswn gtvy jeoi ypah")
IMAP_SERVER = os.getenv("IMAP_SERVER", "imap.gmail.com")
JSON_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "emails.json")
CHECK_INTERVAL = 5

class EmailIngestionService:
    def __init__(self):
        self.running = False
        self.thread = None
        self.db = get_sync_db()
        os.makedirs(os.path.dirname(JSON_FILE), exist_ok=True)
        
    def start(self):
        if self.running: return
        print("Starting Email Ingestion Service...")
        self.running = True
        self.thread = threading.Thread(target=self._poll_emails, daemon=True)
        self.thread.start()

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
            
    def _poll_emails(self):
        print(f"Listening for new emails from {EMAIL}...")
        while self.running:
            try:
                # 1. MongoDB Collection
                collection = self.db['Email-Store']

                # 2. Load JSON Store
                try:
                    with open(JSON_FILE, "r") as f:
                        saved_emails = json.load(f)
                except (FileNotFoundError, json.JSONDecodeError):
                    saved_emails = []
                
                saved_uids_json = {mail.get("uid") for mail in saved_emails if mail.get("uid")}

                new_emails = False
                with MailBox(IMAP_SERVER).login(EMAIL, APP_PASSWORD) as mailbox:
                    # Fetch last 20 messages, newest first
                    for msg in mailbox.fetch(limit=20, reverse=True):
                        body = msg.text or msg.html or ""
                        clean_from = self._extract_email_address(msg.from_)
                        
                        # Data Object
                        email_data = {
                            "uid": msg.uid,
                            "from": msg.from_ or "",
                            "clean_from": clean_from,
                            "subject": msg.subject or "",
                            "date": msg.date.isoformat() if msg.date else None,
                            "body": body[:500] + "..." if len(body) > 500 else body
                        }

                        # --- Store in MongoDB ---
                        if not collection.find_one({"uid": msg.uid}):
                            try:
                                collection.insert_one(email_data.copy())
                                print(f"Stored in MongoDB: {msg.subject}")
                            except Exception as e:
                                print(f"Mongo Insert Error: {e}")

                        # --- Store in JSON & Process Threading ---
                        if msg.uid not in saved_uids_json:
                            saved_emails.append(email_data)
                            saved_uids_json.add(msg.uid)
                            new_emails = True
                            
                            print("-" * 40)
                            print("New Email Ingested (JSON):")
                            print("From:", email_data["from"])
                            print("Subject:", email_data["subject"])
                            
                            # --- Threading & Ticket Logic ---
                            try:
                                # 1. Identify/Create Customer
                                customer = get_or_create_customer(email=clean_from, name=clean_from.split("@")[0])
                                
                                # 2. Resolve Thread
                                threading_service = get_threading_service()
                                
                                email_event = {
                                    "message_id": msg.uid,
                                    "in_reply_to": msg.headers.get("in-reply-to", [])[0] if msg.headers.get("in-reply-to") else None,
                                    "references": msg.headers.get("references", []),
                                    "from_email": clean_from,
                                    "subject": msg.subject or "",
                                    "body": body
                                }
                                
                                resolution = threading_service.resolve_ticket(email_event)
                                
                                # Use Action field (Preferred) or fallback to ticket_id check
                                action = resolution.get("action")
                                ticket_id = resolution.get("ticket_id")
                                
                                if action == "update" and ticket_id:
                                    print(f"Matched to Existing Ticket #{ticket_id} ({resolution['matched_by']}) - Confidence: {resolution['confidence']}")
                                    threading_service.save_email_to_ticket(ticket_id, email_event)
                                else:
                                    print(f"No match found ({resolution.get('matched_by', 'new')}). Creating New Ticket...")
                                    with get_db() as conn:
                                        ticket = create_ticket_logic(
                                            conn,
                                            title=msg.subject,
                                            description=body,
                                            customer_email=customer.email # Use identified customer email
                                        )
                                        ticket_id = ticket['id']
                                        print(f"Ticket Created: ID {ticket_id} - {ticket['title']}")
                                        
                                        # Save first email to thread
                                        threading_service.save_email_to_ticket(ticket_id, email_event)
                            
                            except Exception as ticket_error:
                                print(f"Failed to process email/ticket: {ticket_error}")
                                import traceback
                                traceback.print_exc()

                            print("-" * 40)

                if new_emails:
                    with open(JSON_FILE, "w") as f:
                        json.dump(saved_emails, f, indent=4)
                        
            except Exception as e:
                print(f"Email Polling Error: {e}")
            
            for _ in range(CHECK_INTERVAL):
                if not self.running: break
                time.sleep(1)

    def _extract_email_address(self, raw_from: str) -> str:
        if not raw_from: return ""
        match = re.search(r'<(.+?)>', raw_from)
        if match: return match.group(1)
        emails = re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', raw_from)
        if emails: return emails[0]
        return raw_from.strip()

    def send_email(self, to_email: str, subject: str, body: str):
        if not to_email: return False
        try:
            msg = MIMEMultipart()
            msg['From'] = EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'plain'))

            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(EMAIL, APP_PASSWORD)
            server.sendmail(EMAIL, to_email, msg.as_string())
            server.quit()
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

_email_service = None
def get_email_service():
    global _email_service
    if _email_service is None:
        _email_service = EmailIngestionService()
    return _email_service
