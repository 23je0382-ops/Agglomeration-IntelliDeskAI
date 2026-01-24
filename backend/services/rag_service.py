import os
from typing import List, Tuple, Optional
# from sentence_transformers import SentenceTransformer
# import faiss
# import numpy as np  # DISABLED

class RAGService:
    """
    DUMMY RAG pipeline.
    RAG functionality is currently DISABLED to improve server startup time.
    """
    
    def __init__(self):
        # DISABLED: Model loading
        # self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.embedding_dim = 384
        
        # DISABLED: FAISS index
        # self.index = faiss.IndexFlatL2(self.embedding_dim)
        
        # Store chunks and their metadata
        self.chunks: List[str] = []
        self.chunk_metadata: List[dict] = []  # document_id, filename
        
        # Index file path (unused in dummy mode)
        self.index_dir = os.path.join(os.path.dirname(__file__), "..", "faiss_index")
        os.makedirs(self.index_dir, exist_ok=True)

    def add_document(self, document_id: int, filename: str, chunks: List[str]) -> int:
        """Mock add document"""
        if not chunks:
            return 0
            
        # In dummy mode, we just store the text without embeddings or indexing
        for chunk in chunks:
            self.chunks.append(chunk)
            self.chunk_metadata.append({
                "document_id": document_id,
                "filename": filename
            })
        
        return len(chunks)

    def search(self, query: str, top_k: int = 5) -> List[Tuple[str, float, dict]]:
        """Mock search - returns empty results"""
        return []

    def get_context_for_query(self, query: str, max_chunks: int = 3) -> Optional[str]:
        """Mock context retrieval - returns None"""
        return None

    def remove_document(self, document_id: int) -> int:
        """Mock remove document"""
        indices_to_keep = [
            i for i, meta in enumerate(self.chunk_metadata)
            if meta["document_id"] != document_id
        ]
        
        removed_count = len(self.chunks) - len(indices_to_keep)
        
        self.chunks = [self.chunks[i] for i in indices_to_keep]
        self.chunk_metadata = [self.chunk_metadata[i] for i in indices_to_keep]
        
        return removed_count

    def get_stats(self) -> dict:
        """Get statistics about the index"""
        return {
            "total_chunks": len(self.chunks),
            "total_documents": len(set(m["document_id"] for m in self.chunk_metadata)),
            "status": "RAG_DISABLED"
        }


# Singleton instance
_rag_service = None

def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
