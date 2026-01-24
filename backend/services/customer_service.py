import json
from datetime import datetime
from typing import Optional, Tuple
from database import get_db
from models import Account, Customer

# List of public domains that should NOT be grouped into a single account
PUBLIC_DOMAINS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", 
    "aol.com", "protonmail.com", "zoho.com", "yandex.com", "mail.com"
}

def extract_domain(email: str) -> Optional[str]:
    """Extract domain from email address."""
    if "@" not in email:
        return None
    return email.split("@")[-1].lower()

def get_account_by_domain(domain: str) -> Optional[Account]:
    """Find an account by domain."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM accounts WHERE domain = ?", (domain,))
        row = cursor.fetchone()
        if row:
            return Account.from_row(row)
    return None

def create_account(name: str, domain: str, tier: str = "potential", industry: str = None, status: str = "lead") -> Account:
    """Create a new account."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO accounts (name, domain, tier, industry, status, lead_score, last_activity_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (name, domain, tier, industry, status, 10.0, datetime.now().isoformat())
        )
        account_id = cursor.lastrowid
        
        # Fetch back explicitly to get created_at
        cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
        row = cursor.fetchone()
        return Account.from_row(row)

def update_account_activity(account_id: int):
    """Update last_activity_at for an account."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE accounts SET last_activity_at = ? WHERE id = ?",
            (datetime.now().isoformat(), account_id)
        )

def get_customer_by_email(email: str) -> Optional[Customer]:
    """Find a customer by email."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM customers WHERE email = ?", (email,))
        row = cursor.fetchone()
        if row:
            return Customer.from_row(row)
    return None

def create_customer(
    email: str, 
    name: str = None, 
    account_id: int = None, 
    role: str = None,
    department: str = None,
    metadata: dict = None
) -> Customer:
    """Create a new customer."""
    metadata_json = json.dumps(metadata) if metadata else None
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO customers (email, name, account_id, role, department, metadata) VALUES (?, ?, ?, ?, ?, ?)",
            (email, name, account_id, role, department, metadata_json)
        )
        customer_id = cursor.lastrowid
        
        cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
        row = cursor.fetchone()
        return Customer.from_row(row)

def get_or_create_customer(email: str, name: str = None) -> Customer:
    """
    Main entry point for identifying a customer from an email.
    """
    existing_customer = get_customer_by_email(email)
    if existing_customer:
        return existing_customer
    
    domain = extract_domain(email)
    account_id = None
    role = None
    department = None
    
    # Basic Enrichment Logic (Placeholder / Regex based)
    # Example: "admin@..." -> Role: Admin, Dept: IT
    if "admin" in email.lower() or "support" in email.lower():
        role = "Administrator"
        department = "IT / Operations"
    elif "sales" in email.lower():
        role = "Sales Rep"
        department = "Sales"
    elif "hr" in email.lower():
        department = "Human Resources"
    
    if domain and domain not in PUBLIC_DOMAINS:
        account = get_account_by_domain(domain)
        if not account:
            # Create new account automatically
            # Derive name from domain (e.g. tatasteel.com -> Tatasteel)
            account_name = domain.split(".")[0].capitalize()
            account = create_account(name=account_name, domain=domain, status="lead")
        
        account_id = account.id
        
        # Update activity timestamp
        update_account_activity(account_id)
        
    return create_customer(
        email=email, 
        name=name, 
        account_id=account_id,
        role=role,
        department=department
    )
