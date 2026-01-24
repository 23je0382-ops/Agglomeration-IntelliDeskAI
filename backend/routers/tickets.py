from fastapi import APIRouter, HTTPException
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Ticket, TicketStatus as TicketStatusModel
from schemas import (
    TicketCreate, TicketResponse, TicketUpdate, 
    TicketApproveResponse, TicketClassification
)
from services.groq_service import get_groq_service
from services.rag_service import get_rag_service

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/", response_model=TicketResponse)
def create_ticket(ticket: TicketCreate):
    """Create a new ticket with AI classification (response generated on-demand)"""
    groq_service = get_groq_service()
    
    # Classify the ticket
    classification = groq_service.classify_ticket(ticket.title, ticket.description)

    # Perform RAG search to get context
    rag_service = get_rag_service()
    search_results = rag_service.search(ticket.description, top_k=3)
    
    context_text = ""
    if search_results:
        context_text = "\n".join([f"- {text}" for text, score, meta in search_results])
        print(f"Retrieved {len(search_results)} chunks for context.")
    
    # Generate response
    suggested_response, response_confidence = groq_service.generate_response(
        ticket.title, 
        ticket.description, 
        classification["type"], 
        context=context_text
    )
    
    # Create ticket in database
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO tickets (title, description, customer_email, type, priority, status, suggested_response, confidence_score, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket.title,
            ticket.description,
            ticket.customer_email,
            classification["type"],
            classification["priority"],
            TicketStatusModel.OPEN.value,
            suggested_response,  # Generated response
            classification["confidence"],  # Use classification confidence for the ticket badge
                                         # (Note: we could also mix in response_confidence if needed)
            datetime.utcnow().isoformat()
        ))
        ticket_id = cursor.lastrowid
        
        # Fetch the created ticket
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        return Ticket.from_row(row)

@router.get("/", response_model=List[TicketResponse])
def get_tickets(
    status: Optional[str] = None,
    ticket_type: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get all tickets with optional filters"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        query = "SELECT * FROM tickets WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = ?"
            params.append(status)
        if ticket_type:
            query += " AND type = ?"
            params.append(ticket_type)
        if priority:
            query += " AND priority = ?"
            params.append(priority)
        
        query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [Ticket.from_row(row) for row in rows]

@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int):
    """Get a specific ticket by ID"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ticket not found")
        return Ticket.from_row(row)

@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: int, ticket_update: TicketUpdate):
    """Update ticket status or response"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        updates = []
        params = []
        
        if ticket_update.status:
            updates.append("status = ?")
            params.append(ticket_update.status.value)
            if ticket_update.status == TicketStatusModel.RESOLVED:
                updates.append("resolved_at = ?")
                params.append(datetime.utcnow().isoformat())
        
        if ticket_update.final_response:
            updates.append("final_response = ?")
            params.append(ticket_update.final_response)
        
        updates.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        
        if updates:
            params.append(ticket_id)
            cursor.execute(f"UPDATE tickets SET {', '.join(updates)} WHERE id = ?", params)
        
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        return Ticket.from_row(row)

@router.post("/{ticket_id}/approve", response_model=TicketResponse)
def approve_response(ticket_id: int, approval: TicketApproveResponse):
    """Approve and send the response (optionally edited)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        cursor.execute("""
            UPDATE tickets 
            SET final_response = ?, status = ?, resolved_at = ?, updated_at = ?
            WHERE id = ?
        """, (
            approval.final_response,
            TicketStatusModel.RESOLVED.value,
            datetime.utcnow().isoformat(),
            datetime.utcnow().isoformat(),
            ticket_id
        ))
        
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        return Ticket.from_row(row)

@router.post("/{ticket_id}/regenerate", response_model=TicketResponse)
def regenerate_response(ticket_id: int):
    """Regenerate AI response for a ticket"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        ticket = Ticket.from_row(row)
        
        groq_service = get_groq_service()
        rag_service = get_rag_service()
        
        knowledge_context = rag_service.get_context_for_query(
            f"{ticket.title} {ticket.description}"
        )
        
        suggested_response, confidence = groq_service.generate_response(
            ticket.title,
            ticket.description,
            ticket.type,
            knowledge_context
        )
        
        cursor.execute("""
            UPDATE tickets 
            SET suggested_response = ?, confidence_score = ?, updated_at = ?
            WHERE id = ?
        """, (suggested_response, confidence, datetime.utcnow().isoformat(), ticket_id))
        
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        return Ticket.from_row(row)

@router.delete("/{ticket_id}")
def delete_ticket(ticket_id: int):
    """Delete a ticket"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        cursor.execute("DELETE FROM tickets WHERE id = ?", (ticket_id,))
        return {"message": "Ticket deleted successfully"}
