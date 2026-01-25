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
    
    # AUTO-SEND LOGIC
    final_status = TicketStatus.OPEN.value
    final_response = None
    resolved_at = None
    
    if suggested_response and customer_email:
        # Check Confidence Threshold > 0.8 (User Request)
        confidence = classification.get("confidence", 0)
        
        if confidence > 0.8:
            try:
                from services.email_service import get_email_service
                email_service = get_email_service()
                subject = f"Re: {title}"
                body = f"Hello,\n\n{suggested_response}\n\nBest regards,\nIntelliDesk AI"
                
                # Send Email
                email_service.send_email(customer_email, subject, body)
                print(f"Auto-sent response to {customer_email} (Confidence: {confidence:.2f})")
                
                # Learning Loop: Add to RAG
                try:
                    rag_service.add_knowledge_pair(
                        question=f"{title}\n{description}",
                        answer=suggested_response,
                        source_id=f"ticket_{ticket_id if 'ticket_id' in locals() else 'new'}"
                    )
                except Exception as rag_err:
                    print(f"Learning Loop Error: {rag_err}")

                # Update State to Resolved
                final_status = TicketStatus.RESOLVED.value
                final_response = suggested_response
                resolved_at = datetime.utcnow().isoformat()
                
            except Exception as e:
                print(f"Failed to auto-send response: {e}")
        else:
             print(f"Confidence {confidence:.2f} <= 0.8. Holding for manual approval.")

    cursor.execute("""
        INSERT INTO tickets (title, description, customer_email, type, priority, status, suggested_response, confidence_score, final_response, resolved_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        title,
        description,
        customer_email,
        classification["type"],
        classification["priority"],
        final_status,
        suggested_response,  # Generated response
        classification["confidence"],
        final_response,
        resolved_at,
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
        "status": final_status,
        "suggested_response": suggested_response,
        "confidence_score": classification["confidence"],
        "final_response": final_response,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": None,
        "resolved_at": resolved_at
    }
