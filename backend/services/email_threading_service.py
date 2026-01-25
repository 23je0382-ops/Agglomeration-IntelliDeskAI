import re
import datetime
from typing import Optional, Dict, Any, List
from database import get_db
from models import Ticket, TicketEmail
from services.rag_service import get_rag_service
from fuzzywuzzy import fuzz  # Requires: pip install fuzzywuzzy python-Levenshtein

class EmailThreadingService:
    def __init__(self):
        self.rag_service = get_rag_service()
        
    def normalize_subject(self, subject: str) -> str:
        """
        Normalize subject line:
        - Remove Re:, Fwd:, etc.
        - Remove ticket tags [Ticket #123]
        - Lowercase and trim
        """
        if not subject:
            return ""
            
        # 1. Remove prefixes
        subject = re.sub(r'^(re|fwd|fw|aw|sv):\s*', '', subject, flags=re.IGNORECASE)
        
        # 2. Remove bracket tags like [Ticket #123] or [Issue 456] or just [123]
        subject = re.sub(r'\[.*?\]', '', subject)
        
        # 3. Remove trailing timestamps or weird chars (heuristic)
        
        # 4. Lowercase and trim
        return subject.strip().lower()

    def extract_ticket_refs(self, text: str) -> List[str]:
        """Extract explicit ticket references like #123, Ticket-123, INC123"""
        if not text:
            return []
            
        patterns = [
            r'#(\d+)',
            r'Ticket[-\s]?(\d+)',
            r'INC(\d+)'
        ]
        
        refs = []
        for pattern in patterns:
            matches = re.findall(pattern, text, flags=re.IGNORECASE)
            refs.extend(matches)
            
        return list(set(refs)) # Dedupe

    def resolve_ticket(self, email_event: Dict[str, Any]) -> Dict[str, Any]:
        """
        Advanced CRM Deduplication Engine
        Layers:
        1. Headers (In-Reply-To, References)
        2. Explicit Ticket IDs
        3. Semantic/Fuzzy Match (Sender + 72h + Cosine>=0.85)
        4. Topic Grouping (Sender + 48h)
        
        Returns JSON-like dict:
        {
            "action": "update" | "create",
            "thread_id": str | None,
            "ticket_id": int | None,
            "matched_by": str, 
            "confidence": float
        }
        """
        message_id = email_event.get("message_id")
        in_reply_to = email_event.get("in_reply_to")
        references = email_event.get("references") or []
        from_email = email_event.get("from_email")
        subject = email_event.get("subject") or ""
        body = email_event.get("body") or ""
        
        normalized_subject = self.normalize_subject(subject)
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            # --- LAYER 1: Headers (Hard Thread Linking) ---
            if in_reply_to or references:
                potential_msg_ids = [in_reply_to] + (list(references) if isinstance(references, (list, tuple)) else [references])
                placeholders = ','.join(['?'] * len(potential_msg_ids))
                
                query = f"SELECT ticket_id FROM ticket_emails WHERE message_id IN ({placeholders}) LIMIT 1"
                cursor.execute(query, [mid for mid in potential_msg_ids if mid])
                row = cursor.fetchone()
                
                if row:
                    return {
                        "action": "update",
                        "thread_id": in_reply_to, # Parent Message ID
                        "ticket_id": row["ticket_id"],
                        "matched_by": "headers_in_reply_to",
                        "confidence": 1.0
                    }

            # --- LAYER 2: Explicit ID Detection ---
            explicit_refs = self.extract_ticket_refs(subject) + self.extract_ticket_refs(body)
            for ref_id in explicit_refs:
                cursor.execute("SELECT id FROM tickets WHERE id = ?", (ref_id,))
                row = cursor.fetchone()
                if row:
                     return {
                        "action": "update",
                        "thread_id": None,
                        "ticket_id": row["id"],
                        "matched_by": "explicit_id_ref",
                        "confidence": 1.0
                    }

            # --- LAYER 3: Semantic/Fuzzy Match (Sender + 72h) ---
            # Fetch tickets from SAME SENDER, active in last 72 hours
            cursor.execute("""
                SELECT * FROM tickets 
                WHERE customer_email = ? 
                AND status != 'closed'
                ORDER BY updated_at DESC LIMIT 10
            """, (from_email,))
            recent_tickets = [Ticket.from_row(r) for r in cursor.fetchall()]
            
            now = datetime.datetime.now()
            
            for ticket in recent_tickets:
                # Time Check (72h)
                last_active_str = ticket.updated_at or ticket.created_at
                try:
                    last_active = datetime.datetime.fromisoformat(last_active_str)
                    hours_diff = (now - last_active).total_seconds() / 3600
                except:
                    continue
                
                if hours_diff > 72:
                    continue

                # Fuzzy Subject
                ticket_norm = self.normalize_subject(ticket.title)
                fuzz_score = fuzz.ratio(normalized_subject, ticket_norm)
                
                if fuzz_score >= 85:
                    return {
                        "action": "update",
                        "thread_id": None,
                        "ticket_id": ticket.id,
                        "matched_by": f"fuzzy_subject_match_{fuzz_score}",
                        "confidence": fuzz_score / 100.0
                    }
                    
                # Semantic (RAG) Check
                # Compare current Email Body vs Ticket Description/Last Email
                score = self.rag_service.compute_similarity(f"{normalized_subject} {body[:500]}", f"{ticket.title} {ticket.description}")
                if score >= 0.85:
                    return {
                        "action": "update",
                        "thread_id": None,
                        "ticket_id": ticket.id,
                        "matched_by": f"semantic_similarity_{score:.2f}",
                        "confidence": score
                    }

            # --- LAYER 4: Time/Topic Grouping (Sender + 48h) ---
            # Group rapid follow-ups even if headers/subjects don't match exactly.
            # Uses Semantic Similarity with a slightly lower threshold for grouping.
            
            for ticket in recent_tickets:
                 # Time Check (48h)
                last_active_str = ticket.updated_at or ticket.created_at
                try:
                    last_active = datetime.datetime.fromisoformat(last_active_str)
                    hours_diff = (now - last_active).total_seconds() / 3600
                except:
                    continue
                
                if hours_diff <= 48:
                    # Semantic Grouping Check
                    # "My login isn't working" vs "I forgot my password" -> semantically close
                    target_text = f"{ticket.title} {ticket.description[:300]}"
                    current_text = f"{normalized_subject} {body[:300]}"
                    
                    group_score = self.rag_service.compute_similarity(current_text, target_text)
                    
                    if group_score >= 0.75: # Slightly lower threshold for grouping
                         return {
                            "action": "update",
                            "thread_id": None,
                            "ticket_id": ticket.id,
                            "matched_by": f"temporal_semantic_grouping_{group_score:.2f}",
                            "confidence": group_score
                        }

            # If No Match Found
            return {
                "action": "create",
                "thread_id": None,
                "ticket_id": None,
                "matched_by": "none",
                "confidence": 0.0
            }

    def save_email_to_ticket(self, ticket_id: int, email_data: Dict[str, Any]):
        """Save the email to ticket_emails table"""
        message_id = email_data.get("message_id")
        
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Deduplication Check
            if message_id:
                cursor.execute("SELECT id FROM ticket_emails WHERE message_id = ?", (message_id,))
                if cursor.fetchone():
                    print(f"Skipping duplicate email message_id: {message_id}")
                    return

            cursor.execute("""
                INSERT INTO ticket_emails (ticket_id, message_id, sender, subject, body, received_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                ticket_id,
                message_id,
                email_data.get("from_email"),
                email_data.get("subject"),
                email_data.get("body"),
                datetime.datetime.now().isoformat()
            ))
            
            # Also update ticket's updated_at
            cursor.execute("UPDATE tickets SET updated_at = ? WHERE id = ?", 
                          (datetime.datetime.now().isoformat(), ticket_id))

# Singleton
_threading_service = None
def get_threading_service():
    global _threading_service
    if _threading_service is None:
        _threading_service = EmailThreadingService()
    return _threading_service
