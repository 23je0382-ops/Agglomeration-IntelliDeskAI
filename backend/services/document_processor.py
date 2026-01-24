import os
from pypdf import PdfReader
from typing import List

class DocumentProcessor:
    """Process uploaded documents into text chunks for RAG"""
    
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(self.upload_dir, exist_ok=True)

    def extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text content from a PDF file"""
        try:
            reader = PdfReader(file_path)
            text_parts = []
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    text_parts.append(text)
            return "\n".join(text_parts)
        except Exception as e:
            print(f"PDF extraction error: {e}")
            return ""

    def extract_text_from_txt(self, file_path: str) -> str:
        """Extract text content from a text file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            print(f"Text extraction error: {e}")
            return ""

    def process_file(self, file_path: str, file_type: str) -> str:
        """Process a file and extract text based on type"""
        if file_type == "pdf":
            return self.extract_text_from_pdf(file_path)
        elif file_type in ["txt", "text"]:
            return self.extract_text_from_txt(file_path)
        else:
            return ""

    def chunk_text(self, text: str) -> List[str]:
        """Split text into overlapping chunks for embedding"""
        if not text:
            return []
        
        # Clean the text
        text = text.replace('\n', ' ').replace('\r', ' ')
        text = ' '.join(text.split())  # Normalize whitespace
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            # Try to break at a sentence boundary
            if end < len(text):
                # Look for sentence endings near the chunk boundary
                for punct in ['. ', '! ', '? ', '\n']:
                    last_punct = text.rfind(punct, start + self.chunk_size // 2, end)
                    if last_punct != -1:
                        end = last_punct + 1
                        break
            
            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start with overlap
            start = end - self.chunk_overlap if end < len(text) else len(text)
        
        return chunks

    def get_upload_path(self, filename: str) -> str:
        """Get the full path for an uploaded file"""
        return os.path.join(self.upload_dir, filename)


# Singleton instance
_document_processor = None

def get_document_processor() -> DocumentProcessor:
    global _document_processor
    if _document_processor is None:
        _document_processor = DocumentProcessor()
    return _document_processor
