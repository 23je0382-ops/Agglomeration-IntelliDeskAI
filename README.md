# IntelliDesk AI - Agglomeration 2.0

IntelliDesk AI is a next-generation B2B SaaS helpdesk system powered by Agentic AI. It automates ticket classification, provides AI-driven suggested responses using RAG (Retrieval-Augmented Generation), and manages customer relationships with advanced threading and deduplication logic.

## 🚀 Key Features

- **Agentic AI Ticketing**: Automatically classifies type, priority, and urgency of incoming requests via Groq AI.
- **AI Suggested Replies**: Drafts professional responses using context from your uploaded Knowledge Base (PDFs/Docs).
- **Intelligent Email Ingestion**: Real-time polling from Gmail with robust thread linking and UID-based deduplication.
- **Hybrid Data Architecture**: 
  - **SQLite**: Lightning-fast operational data (Tickets, Customers, CRM).
  - **MongoDB**: Scalable archiving for long-term email storage.
- **Knowledge Base (RAG)**: Upload documents to power the AI's "brain" with specific company knowledge.
- **CRM Integration**: Manage accounts, organizations, and lead scoring in a unified interface.

## 🛠 Technology Stack

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **AI Engine**: Groq (Llama 3.1)
- **Primary DB**: SQLite (Relational structure)
- **Archive DB**: MongoDB
- **Vector Search**: FAISS / Sentence-Transformers (for RAG)

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Vanilla CSS with modern UI/UX principles (Glassmorphism, Neon aesthetics)
- **Icons**: Lucide-React

## 📦 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js & npm
- MongoDB instance (Local or Atlas)
- Groq API Key

### Backend Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your credentials:
   ```env
   GROQ_API_KEY=your_key_here
   EMAIL_USER=your_support_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   MONGO_URI=mongodb://localhost:27017
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure
```text
├── backend/
│   ├── routers/       # API Endpoints
│   ├── services/      # Business Logic (AI, Email, RAG)
│   ├── models.py      # Data schemas
│   └── database.py    # SQLite configuration
├── frontend/
│   ├── src/
│   │   ├── pages/     # React views (Tickets, Inbox, KB)
│   │   └── components/# Reusable UI items
└── data/              # Local storage & SQLite DB
```

## 🛡 License
Internal Use Only (Agglomeration 2.0)
