from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum



class TicketPriority(str, Enum):
    URGENT = "urgent"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

# Ticket Schemas
class TicketCreate(BaseModel):
    title: str
    description: str
    customer_email: Optional[str] = None

class TicketClassification(BaseModel):
    type: str
    priority: TicketPriority
    confidence: float

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    customer_email: Optional[str]
    type: str  # Allow any string for type
    priority: str
    status: str
    suggested_response: Optional[str]
    confidence_score: Optional[float]
    final_response: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True

class TicketUpdate(BaseModel):
    status: Optional[TicketStatus] = None
    final_response: Optional[str] = None

class TicketApproveResponse(BaseModel):
    final_response: str

# Knowledge Base Schemas
class KnowledgeDocumentResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_type: str
    chunk_count: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class KnowledgeSearchResult(BaseModel):
    document_id: int
    filename: str
    content: str
    relevance_score: float

class KnowledgeSearchResponse(BaseModel):
    query: str
    results: List[KnowledgeSearchResult]

# AI Response Schemas
class AIGeneratedResponse(BaseModel):
    suggested_response: str
    confidence_score: float
    knowledge_sources: List[str]

# Analytics Schemas
class CategoryStats(BaseModel):
    category: str
    count: int

class AnalyticsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    resolved_tickets: int
    avg_resolution_time_hours: Optional[float]
    tickets_by_category: List[CategoryStats]
    tickets_by_priority: List[CategoryStats]
    top_issues: List[str]
