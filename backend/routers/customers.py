from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from database import get_db
from models import Customer, Account
from schemas import CustomerResponse, AccountResponse
import sqlite3

router = APIRouter()

@router.get("/customers", response_model=List[CustomerResponse])
def get_customers(
    skip: int = 0, 
    limit: int = 100, 
    search: Optional[str] = None,
    account_id: Optional[int] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT * FROM customers WHERE 1=1"
        params = []
        
        if account_id:
            query += " AND account_id = ?"
            params.append(account_id)
            
        if search:
            query += " AND (email LIKE ? OR name LIKE ?)"
            params.extend([f"%{search}%", f"%{search}%"])
            
        query += " LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        customers = []
        for row in rows:
            customer = Customer.from_row(row)
            # Fetch account details if linked
            if customer.account_id:
                cursor.execute("SELECT * FROM accounts WHERE id = ?", (customer.account_id,))
                account_row = cursor.fetchone()
                if account_row:
                    customer.account = Account.from_row(account_row)
            customers.append(customer)
            
        return customers

@router.get("/accounts", response_model=List[AccountResponse])
def get_accounts(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT a.*, COUNT(c.id) as user_count
            FROM accounts a
            LEFT JOIN customers c ON a.id = c.account_id
            WHERE 1=1
        """
        params = []
        
        if status:
            query += " AND a.status = ?"
            params.append(status)
            
        query += " GROUP BY a.id LIMIT ? OFFSET ?"
        params.extend([limit, skip])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        accounts = []
        for row in rows:
            # Manually construct to handle the extra user_count column which isn't in the Model
            # Or assume the Model.from_row handles extra fields gracefully if using **kwargs, 
            # but our from_row is specific.
            # Best to instantiate Account and then attach user_count
            
            # Since row is a dictionary-like object in sqlite3 if using Row factory, 
            # but we need to check how from_row is implemented.
            # It uses row["key"].
            
            # Let's use Account.from_row but we need to pass a dict that has user_count?
            # No, Account model doesn't have user_count.
            # We are returning AccountResponse which HAS user_count.
            
            account_data = Account.from_row(row)
            response_item = AccountResponse(
                id=account_data.id,
                name=account_data.name,
                domain=account_data.domain,
                tier=account_data.tier,
                industry=account_data.industry,
                status=account_data.status,
                last_activity_at=account_data.last_activity_at,
                lead_score=account_data.lead_score,
                created_at=account_data.created_at,
                user_count=row["user_count"]
            )
            accounts.append(response_item)
            
        return accounts

@router.get("/accounts/{account_id}", response_model=AccountResponse)
def get_account_detail(account_id: int):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.*, COUNT(c.id) as user_count
            FROM accounts a
            LEFT JOIN customers c ON a.id = c.account_id
            WHERE a.id = ?
            GROUP BY a.id
        """, (account_id,))
        row = cursor.fetchone()
        
        if not row:
            raise HTTPException(status_code=404, detail="Account not found")
            
        account_data = Account.from_row(row)
        return AccountResponse(
            id=account_data.id,
            name=account_data.name,
            domain=account_data.domain,
            tier=account_data.tier,
            industry=account_data.industry,
            status=account_data.status,
            last_activity_at=account_data.last_activity_at,
            lead_score=account_data.lead_score,
            created_at=account_data.created_at,
            user_count=row["user_count"]
        )
