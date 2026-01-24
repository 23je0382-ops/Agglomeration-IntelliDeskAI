from datetime import datetime
from services.groq_service import get_groq_service
from services.rag_service import get_rag_service
from models import TicketStatus
import sqlite3

def create_ticket_logic(db_conn: sqlite3.Connection, title: str | None, description: str, customer_email: str | None):
    """
    Core logic for creating a ticket:
    1. Classify
    2. RAG Search
    3. Generate Response
    4. Save to DB
    """
    groq_service = get_groq_service()
    
    # Auto-generate title if missing
    if not title or not title.strip():
        # Use first 50 chars of description or generic
        title = (description[:50] + "...") if description else "New Ticket"
        
    # Classify the ticket
    classification = groq_service.classify_ticket(title, description)

    # Perform RAG search to get context
    rag_service = get_rag_service()
    search_results = rag_service.search(description, top_k=3)
    
    context_text = ""
    if search_results:
        context_text = "\n".join([f"- {text}" for text, score, meta in search_results])
    
    # Generate response
    suggested_response, response_confidence = groq_service.generate_response(
        title, 
        description, 
        classification["type"], 
        context=context_text
    )
    
    # Create ticket in database
    cursor = db_conn.cursor()
    cursor.execute("""
        INSERT INTO tickets (title, description, customer_email, type, priority, status, suggested_response, confidence_score, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title,
        description,
        customer_email,
        classification["type"],
        classification["priority"],
        TicketStatus.OPEN.value,
        suggested_response,  # Generated response
        classification["confidence"],
        datetime.utcnow().isoformat()
    ))
    ticket_id = cursor.lastrowid
    db_conn.commit()
    
    # Return constructed object (similar to what was done in router)
    return {
        "id": ticket_id,
        "title": title,
        "description": description,
        "customer_email": customer_email,
        "type": classification["type"],
        "priority": classification["priority"],
        "status": TicketStatus.OPEN.value,
        "suggested_response": suggested_response,
        "confidence_score": classification["confidence"],
        "final_response": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": None,
        "resolved_at": None
    }
