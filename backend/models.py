"""
Models module - defines data structures as simple classes.
No SQLAlchemy dependency.
"""
import enum
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

@dataclass
class TicketType:
    # Kept for compatibility if imported, but effectively unused by Logic now
    pass

class TicketPriority(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

@dataclass
class Ticket:
    id: int
    title: Optional[str]
    description: str
    customer_email: Optional[str] = None
    type: str = "General Inquiry"
    priority: str = "medium"
    status: str = "open"
    suggested_response: Optional[str] = None
    confidence_score: Optional[float] = None
    final_response: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    resolved_at: Optional[str] = None

    @classmethod
    def from_row(cls, row):
        """Create a Ticket from a sqlite3 Row"""
        return cls(
            id=row["id"],
            title=row["title"],
            description=row["description"],
            customer_email=row["customer_email"],
            type=row["type"],
            priority=row["priority"],
            status=row["status"],
            suggested_response=row["suggested_response"],
            confidence_score=row["confidence_score"],
            final_response=row["final_response"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            resolved_at=row["resolved_at"]
        )

@dataclass
class KnowledgeDocument:
    id: int
    filename: str
    original_filename: str
    content: str
    file_type: str
    chunk_count: int = 0
    uploaded_at: Optional[str] = None

    @classmethod
    def from_row(cls, row):
        """Create a KnowledgeDocument from a sqlite3 Row"""
        return cls(
            id=row["id"],
            filename=row["filename"],
            original_filename=row["original_filename"],
            content=row["content"],
            file_type=row["file_type"],
            chunk_count=row["chunk_count"],
            uploaded_at=row["uploaded_at"]
        )

@dataclass
class DocumentChunk:
    id: int
    document_id: int
    chunk_index: int
    content: str
    created_at: Optional[str] = None

    @classmethod
    def from_row(cls, row):
        """Create a DocumentChunk from a sqlite3 Row"""
        return cls(
            id=row["id"],
            document_id=row["document_id"],
            chunk_index=row["chunk_index"],
            content=row["content"],
            created_at=row["created_at"]
        )
