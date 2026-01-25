import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import init_db
from routers import tickets, knowledge, analytics, emails, customers
from services.email_service import get_email_service
from services.rag_service import get_rag_service

# Load environment variables
load_dotenv()

# Initialize database tables
init_db()

# Initialize FastAPI app
app = FastAPI(
    title="IntelliDesk AI",
    description="Intelligent Helpdesk System with NLP and AI Automation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from mongodb import db as mongo_db

@app.on_event("startup")
async def startup_event():
    # Connect to MongoDB
    mongo_db.connect()
    
    # Initialize RAG (Dataset Seeding)
    get_rag_service()
    
    # Start Email Ingestion
    email_service = get_email_service()
    email_service.start()

@app.on_event("shutdown")
async def shutdown_event():
    get_email_service().stop()
    mongo_db.close()

# Include routers
app.include_router(tickets.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(emails.router, prefix="/api")
app.include_router(customers.router, prefix="/api")

@app.get("/")
def root():
    return {
        "name": "IntelliDesk AI",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
