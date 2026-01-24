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
        Main logic to resolve which ticket an email belongs to.
        Returns: {
            "ticket_id": int | None,
            "match_type": "header" | "explicit_ref" | "semantic" | "fuzzy" | "new",
            "confidence": float,
            "reason": str
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
            
            # --- 1. Hard Thread Linking ---
            # Check in_reply_to or references against stored ticket_emails
            if in_reply_to or references:
                potential_msg_ids = [in_reply_to] + (list(references) if isinstance(references, (list, tuple)) else [references])
                placeholders = ','.join(['?'] * len(potential_msg_ids))
                
                # We need to find which ticket these message_ids belong to
                query = f"SELECT ticket_id FROM ticket_emails WHERE message_id IN ({placeholders}) LIMIT 1"
                cursor.execute(query, [mid for mid in potential_msg_ids if mid])
                row = cursor.fetchone()
                
                if row:
                    return {
                        "ticket_id": row["ticket_id"],
                        "match_type": "header",
                        "confidence": 1.0,
                        "reason": f"Matched via Message-ID in Reply-To/References"
                    }

            # Check Explicit References in Subject/Body
            explicit_refs = self.extract_ticket_refs(subject) + self.extract_ticket_refs(body)
            for ref_id in explicit_refs:
                # Verify ticket exists
                cursor.execute("SELECT id FROM tickets WHERE id = ?", (ref_id,))
                row = cursor.fetchone()
                if row:
                     return {
                        "ticket_id": row["id"],
                        "match_type": "explicit_ref",
                        "confidence": 1.0,
                        "reason": f"Explicit reference #{ref_id} found"
                    }

            # --- 2. Sender + Time Window Constraint ---
            # Find OPEN tickets from same sender updated in last 48 hours
            cursor.execute("""
                SELECT * FROM tickets 
                WHERE customer_email = ? 
                AND status != 'closed'
                ORDER BY updated_at DESC LIMIT 5
            """, (from_email,))
            recent_tickets = [Ticket.from_row(r) for r in cursor.fetchall()]
            
            candidates = []
            now = datetime.datetime.now()
            
            for ticket in recent_tickets:
                # Parse updated_at or created_at
                last_active_str = ticket.updated_at or ticket.created_at
                # Handle potentially None or format issues? Assuming ISO format from DB
                try:
                    last_active = datetime.datetime.fromisoformat(last_active_str)
                except:
                    continue # Skip if date parsing fails
                
                hours_diff = (now - last_active).total_seconds() / 3600
                
                if hours_diff <= 48:
                    candidates.append(ticket)

            if not candidates:
                 return {
                    "ticket_id": None,
                    "match_type": "new",
                    "confidence": 0.0,
                    "reason": "No recent tickets from sender"
                }

            # --- 3. Semantic Similarity ---
            # Compare current subject/body with candidate ticket's last email or initial description
            # For simplicity, we compare against ticket description + title
            
            best_match = None
            highest_score = 0.0
            
            for ticket in candidates:
                # We could fetch the last email for this ticket to compare against
                cursor.execute("SELECT subject, body FROM ticket_emails WHERE ticket_id = ? ORDER BY id DESC LIMIT 1", (ticket.id,))
                last_email = cursor.fetchone()
                
                target_text = ""
                if last_email:
                    target_text = f"{last_email['subject']} {last_email['body'][:200]}"
                else:
                    target_text = f"{ticket.title} {ticket.description[:200]}"

                current_text = f"{normalized_subject} {body[:200]}"
                
                # Compute Similarity
                score = self.rag_service.compute_similarity(current_text, target_text)
                
                if score > highest_score:
                    highest_score = score
                    best_match = ticket

            # Semantic Threshold
            if best_match and highest_score >= 0.85:
                 return {
                    "ticket_id": best_match.id,
                    "match_type": "semantic",
                    "confidence": highest_score,
                    "reason": f"Semantic similarity {highest_score:.2f}"
                }

            # --- 4. Fuzzy Subject Matching (Fallback) ---
            # Only if semantic failed but we have candidates (implied by reaching here)
            
            for ticket in candidates:
                # Normalize ticket title
                ticket_norm_title = self.normalize_subject(ticket.title)
                
                # Ratio
                ratio = fuzz.ratio(normalized_subject, ticket_norm_title)
                
                if ratio >= 90:
                    return {
                        "ticket_id": ticket.id,
                        "match_type": "fuzzy",
                        "confidence": ratio / 100.0,
                        "reason": f"Fuzzy subject match {ratio}%"
                    }

            # If classification is inconclusive
            return {
                "ticket_id": None,
                "match_type": "new",
                "confidence": 0.0,
                "reason": "No match found above thresholds"
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
