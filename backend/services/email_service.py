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

# Credentials (as provided)
EMAIL = "aglo.intellidesk.ai@gmail.com"
APP_PASSWORD = "vswn gtvy jeoi ypah"
IMAP_SERVER = "imap.gmail.com"
JSON_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "emails.json")
CHECK_INTERVAL = 30  # Polling interval

class EmailIngestionService:
    def __init__(self):
        self.running = False
        self.thread = None
        
        # Ensure data directory exists
        os.makedirs(os.path.dirname(JSON_FILE), exist_ok=True)
        
    def start(self):
        """Start the email polling in a separate thread"""
        if self.running:
            return
            
        print("Starting Email Ingestion Service...")
        self.running = True
        self.thread = threading.Thread(target=self._poll_emails, daemon=True)
        self.thread.start()

    def stop(self):
        """Stop polling"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
            
    def _poll_emails(self):
        """Background loop to fetch emails"""
        print(f"Listening for new emails from {EMAIL}...")
        
        while self.running:
            try:
                # Load existing to check duplicates
                try:
                    with open(JSON_FILE, "r") as f:
                        saved_emails = json.load(f)
                except (FileNotFoundError, json.JSONDecodeError):
                    saved_emails = []

                saved_uids = {mail.get("uid") for mail in saved_emails if mail.get("uid")}

                # Fetch Loop
                new_emails = False
                with MailBox(IMAP_SERVER).login(EMAIL, APP_PASSWORD) as mailbox:
                    for msg in mailbox.fetch(AND(seen=False)):
                        if msg.uid in saved_uids:
                            continue

                        body = msg.text or msg.html or ""
                        
                        # Extract clean email
                        clean_from = self._extract_email_address(msg.from_)
                        
                        # Storage Data
                        email_data = {
                            "uid": msg.uid,
                            "from": msg.from_ or "",
                            "clean_from": clean_from,
                            "subject": msg.subject or "",
                            "date": msg.date.isoformat() if msg.date else None,
                            "body": body[:500] + "..." if len(body) > 500 else body # Truncate for preview
                        }

                        saved_emails.append(email_data)
                        saved_uids.add(msg.uid)
                        new_emails = True

                        print("-" * 40)
                        print("New Email Ingested:")
                        print("From:", email_data["from"])
                        print("Subject:", email_data["subject"])
                        
                        # --- Auto-Create Ticket ---
                        try:
                            print("Auto-Creating Ticket from Email...")
                            with get_db() as conn:
                                ticket = create_ticket_logic(
                                    conn,
                                    title=msg.subject,         # Use Subject as Title
                                    description=body,          # Use Body as Description
                                    customer_email=clean_from  # Use Clean Email
                                )
                                print(f"Ticket Created: ID {ticket['id']} - {ticket['title']}")
                        except Exception as ticket_error:
                            print(f"Failed to auto-create ticket: {ticket_error}")
                        # ---------------------------

                        print("-" * 40)
                
                # Save if changes
                if new_emails:
                    with open(JSON_FILE, "w") as f:
                        json.dump(saved_emails, f, indent=4)
                        
            except Exception as e:
                print(f"Email Polling Error: {e}")
            
            # Sleep in small chunks to allow stopping
            for _ in range(CHECK_INTERVAL):
                if not self.running:
                    break
                time.sleep(1)

    def _extract_email_address(self, raw_from: str) -> str:
        """Extract email from 'Name <email@domain.com>' or just 'email@domain.com'"""
        if not raw_from:
            return ""
        # Regex to find email inside < >
        match = re.search(r'<(.+?)>', raw_from)
        if match:
            return match.group(1)
        # If no brackets, assume the whole thing might be an email or just take the first part
        # Simple fallback: look for something with @
        emails = re.findall(r'[\w.+-]+@[\w-]+\.[\w.-]+', raw_from)
        if emails:
            return emails[0]
        return raw_from.strip()

    def send_email(self, to_email: str, subject: str, body: str):
        """Send an email response to the customer"""
        if not to_email:
            print("Cannot send email: No recipient address")
            return False
            
        try:
            print(f"Sending email to {to_email}...")
            
            msg = MIMEMultipart()
            msg['From'] = EMAIL
            msg['To'] = to_email
            msg['Subject'] = subject

            msg.attach(MIMEText(body, 'plain'))

            # SMTP Connection
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(EMAIL, APP_PASSWORD)
            text = msg.as_string()
            server.sendmail(EMAIL, to_email, text)
            server.quit()
            
            print("Email sent successfully!")
            return True
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False

# Singleton
_email_service = None

def get_email_service():
    global _email_service
    if _email_service is None:
        _email_service = EmailIngestionService()
    return _email_service
