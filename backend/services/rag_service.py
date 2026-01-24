import os
import time
from typing import List, Tuple, Optional
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class RAGService:
    """
    RAG Service using Pinecone and SentenceTransformers.
    """
    
    def __init__(self):
        # Initialize Pinecone
        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            print("WARNING: PINECONE_API_KEY not found. RAG will be disabled.")
            self.pc = None
            return

        self.pc = Pinecone(api_key=api_key)
        self.index_name = "intellidesk"
        self.embedding_dim = 384  # Dimension for all-MiniLM-L6-v2
        
        # Check if index exists, create if not
        self._ensure_index_exists()
        
        self.index = self.pc.Index(self.index_name)
        
        # Load embedding model (careful with memory)
        print("Loading embedding model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Embedding model loaded.")
        
        # Seed knowledge base if empty
        self.seed_knowledge_base()

    def _ensure_index_exists(self):
        """Create Pinecone index if it doesn't exist"""
        existing_indexes = [i.name for i in self.pc.list_indexes()]
        
        if self.index_name not in existing_indexes:
            print(f"Creating Pinecone index '{self.index_name}'...")
            try:
                self.pc.create_index(
                    name=self.index_name,
                    dimension=self.embedding_dim,
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1"
                    )
                )
                # Wait for index to be ready
                while not self.pc.describe_index(self.index_name).status['ready']:
                    time.sleep(1)
                print("Index created successfully.")
            except Exception as e:
                print(f"Error creating index: {e}")

    def seed_knowledge_base(self):
        """Seed the knowledge base with sample data if empty"""
        if not self.pc:
            return

        stats = self.index.describe_index_stats()
        if stats.total_vector_count > 0:
            print("Knowledge base already populated. Skipping seed.")
            return

        print("Seeding knowledge base with sample data...")
        
        # Sample Q&A Pairs
        sample_data = [
            {
                "id": "seed_1",
                "text": "How do I reset my password? To reset your password, go to the login page and click on 'Forgot Password'. Follow the email instructions to create a new password.",
                "metadata": {"type": "faq", "topic": "account"}
            },
            {
                "id": "seed_2",
                "text": "What are the billing cycles? We offer monthly and annual billing cycles. You can switch between them in your account settings under the 'Billing' tab.",
                "metadata": {"type": "faq", "topic": "billing"}
            },
            {
                "id": "seed_3",
                "text": "How do I contact support? You can contact support by creating a ticket in this portal or emailing support@intellidesk.com. Our hours are 9am-5pm EST.",
                "metadata": {"type": "faq", "topic": "support"}
            },
            {
                "id": "seed_4",
                "text": "Where can I find API documentation? API documentation is available at https://api.intellidesk.com/docs. You needs an API key from your dashboard settings.",
                "metadata": {"type": "faq", "topic": "technical"}
            },
            {
                "id": "seed_5",
                "text": "My server is down. If your server is down, please check the status page at status.intellidesk.com. If the status is green, restart your local agent.",
                "metadata": {"type": "faq", "topic": "troubleshooting"}
            }
        ]
        
        vectors = []
        for item in sample_data:
            embedding = self.model.encode(item["text"]).tolist()
            vectors.append({
                "id": item["id"],
                "values": embedding,
                "metadata": {**item["metadata"], "text": item["text"]}
            })
            
        self.index.upsert(vectors=vectors)
        print(f"Seeded {len(vectors)} documents.")

    def add_document(self, document_id: int, filename: str, chunks: List[str]) -> int:
        """Embed and upsert document chunks to Pinecone"""
        if not self.pc or not chunks:
            return 0
            
        print(f"Indexing document {filename} with {len(chunks)} chunks...")
        
        embeddings = self.model.encode(chunks).tolist()
        
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vector_id = f"doc_{document_id}_chunk_{i}"
            vectors.append({
                "id": vector_id,
                "values": embedding,
                "metadata": {
                    "document_id": document_id,
                    "filename": filename,
                    "text": chunk,
                    "chunk_index": i
                }
            })
        
        # Batch upsert (Pinecone allows max 100 vectors per request usually, or size based)
        batch_size = 100
        for i in range(0, len(vectors), batch_size):
            batch = vectors[i:i+batch_size]
            self.index.upsert(vectors=batch)
            
        print(f"Indexed {len(vectors)} chunks.")
        return len(vectors)

    def search(self, query: str, top_k: int = 3) -> List[Tuple[str, float, dict]]:
        """Search the knowledge base for relevant chunks"""
        if not self.pc:
            return []
            
        query_embedding = self.model.encode(query).tolist()
        
        try:
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            
            output = []
            for match in results.matches:
                text = match.metadata.get("text", "")
                score = match.score
                metadata = match.metadata
                output.append((text, score, metadata))
                
            return output
            
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def remove_document(self, document_id: int) -> int:
        """Remove all chunks for a specific document"""
        if not self.pc:
            return 0
            
        # Delete by metadata filter
        try:
            self.index.delete(
                filter={"document_id": {"$eq": document_id}}
            )
            return 1 # Cannot easily count deleted items in Pinecone delete-by-filter
        except Exception as e:
            print(f"Delete error: {e}")
            return 0

    def compute_similarity(self, text1: str, text2: str) -> float:
        """Compute cosine similarity between two texts"""
        if not self.pc or not self.model:
            return 0.0
            
        try:
            embeddings = self.model.encode([text1, text2])
            from sklearn.metrics.pairwise import cosine_similarity
            score = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return float(score)
        except Exception as e:
            # Fallback for when sklearn is not installed or error
            # Simple dot product if normalized? SentenceTransformer usually returns normalized matching
            print(f"Similarity computation error: {e}")
            return 0.0

    def get_stats(self) -> dict:
        """Get index statistics"""
        if not self.pc:
            return {"status": "RAG_DISABLED"}
            
        stats = self.index.describe_index_stats()
        return {
            "total_vectors": stats.total_vector_count,
            "namespaces": stats.namespaces,
            "status": "ready"
        }

# Singleton instance
_rag_service = None

def get_rag_service() -> RAGService:
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
