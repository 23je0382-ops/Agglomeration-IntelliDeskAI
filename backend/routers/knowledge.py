import os
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List

from database import get_db
from models import KnowledgeDocument, DocumentChunk
from schemas import KnowledgeDocumentResponse, KnowledgeSearchResponse, KnowledgeSearchResult
from services.document_processor import get_document_processor
from services.rag_service import get_rag_service

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

ALLOWED_EXTENSIONS = {"pdf", "txt"}

def get_file_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

@router.post("/upload", response_model=KnowledgeDocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a document to the knowledge base"""
    # Validate file type
    file_ext = get_file_extension(file.filename)
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    document_processor = get_document_processor()
    rag_service = get_rag_service()
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = document_processor.get_upload_path(unique_filename)
    
    # Save file
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Extract text content
    text_content = document_processor.process_file(file_path, file_ext)
    if not text_content:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail="Could not extract text from file")
    
    # Chunk the document
    chunks = document_processor.chunk_text(text_content)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Create document record
        cursor.execute("""
            INSERT INTO knowledge_documents (filename, original_filename, content, file_type, chunk_count)
            VALUES (?, ?, ?, ?, ?)
        """, (unique_filename, file.filename, text_content, file_ext, len(chunks)))
        document_id = cursor.lastrowid
        
        # Store chunks in database
        for i, chunk_content in enumerate(chunks):
            cursor.execute("""
                INSERT INTO document_chunks (document_id, chunk_index, content)
                VALUES (?, ?, ?)
            """, (document_id, i, chunk_content))
        
        # Add to RAG index
        rag_service.add_document(document_id, file.filename, chunks)
        
        # Fetch the created document
        cursor.execute("SELECT * FROM knowledge_documents WHERE id = ?", (document_id,))
        row = cursor.fetchone()
        return KnowledgeDocument.from_row(row)

@router.get("/", response_model=List[KnowledgeDocumentResponse])
def get_documents():
    """Get all knowledge base documents"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM knowledge_documents ORDER BY uploaded_at DESC")
        rows = cursor.fetchall()
        return [KnowledgeDocument.from_row(row) for row in rows]

@router.get("/{document_id}", response_model=KnowledgeDocumentResponse)
def get_document(document_id: int):
    """Get a specific document"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM knowledge_documents WHERE id = ?", (document_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        return KnowledgeDocument.from_row(row)

@router.get("/{document_id}/content")
def get_document_content(document_id: int):
    """Get the full content of a document"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM knowledge_documents WHERE id = ?", (document_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        doc = KnowledgeDocument.from_row(row)
        return {
            "id": doc.id,
            "filename": doc.original_filename,
            "content": doc.content
        }

@router.delete("/{document_id}")
def delete_document(document_id: int):
    """Delete a document from the knowledge base"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM knowledge_documents WHERE id = ?", (document_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = KnowledgeDocument.from_row(row)
        document_processor = get_document_processor()
        rag_service = get_rag_service()
        
        # Remove from RAG index
        rag_service.remove_document(document_id)
        
        # Delete file
        file_path = document_processor.get_upload_path(doc.filename)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete chunks
        cursor.execute("DELETE FROM document_chunks WHERE document_id = ?", (document_id,))
        
        # Delete document record
        cursor.execute("DELETE FROM knowledge_documents WHERE id = ?", (document_id,))
        
        return {"message": "Document deleted successfully"}

@router.post("/search", response_model=KnowledgeSearchResponse)
def search_knowledge_base(query: str):
    """Search the knowledge base"""
    rag_service = get_rag_service()
    
    results = rag_service.search(query, top_k=10)
    
    search_results = []
    for content, score, metadata in results:
        search_results.append(KnowledgeSearchResult(
            document_id=metadata["document_id"],
            filename=metadata["filename"],
            content=content,
            relevance_score=score
        ))
    
    return KnowledgeSearchResponse(query=query, results=search_results)

@router.get("/stats/index")
def get_index_stats():
    """Get RAG index statistics"""
    rag_service = get_rag_service()
    return rag_service.get_stats()
