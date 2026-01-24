from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum



class TicketPriority(str, Enum):
    CRITICAL = "critical"
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
    title: Optional[str] = None
    description: str
    customer_email: Optional[str] = None

class TicketClassification(BaseModel):
    type: str
    priority: TicketPriority
    confidence: float

class TicketEmailResponse(BaseModel):
    id: int
    sender: str
    subject: Optional[str]
    body: Optional[str]
    received_at: datetime

    class Config:
        from_attributes = True

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
    emails: List[TicketEmailResponse] = []

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

# Account & Customer Schemas

class AccountCreate(BaseModel):
    name: str
    domain: str
    tier: Optional[str] = "potential"
    industry: Optional[str] = None
    status: Optional[str] = "active"

class AccountResponse(BaseModel):
    id: int
    name: str
    domain: str
    tier: str
    industry: Optional[str]
    status: str
    last_activity_at: Optional[str]
    lead_score: float
    user_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    metadata: Optional[str] = None

class CustomerResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    account_id: Optional[int]
    role: Optional[str]
    department: Optional[str]
    last_login_at: Optional[str]
    metadata: Optional[str]
    created_at: datetime
    # We might want to include the account details here often
    account: Optional[AccountResponse] = None

    class Config:
        from_attributes = True
