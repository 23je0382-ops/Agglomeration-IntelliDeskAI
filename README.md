# CSE Society Agglomeration 2.0: IntelliDesk AI
### "The Perfect Response, Every Time" 🚀

**Domain:** Natural Language Processing (NLP) & Generative AI, Intelligent Process Automation (IPA) / Workflow Automation, Information Retrieval & Knowledge Management

---

## 📖 Business Context
IntelliDesk AI addresses the critical inefficiencies in B2B SaaS support:
- **Problem:** Manual handling of 200–500 daily emails led to 30-45m response times, buried urgent issues, and a low CSAT of 6.5/10.
- **Solution:** An Agentic AI-powered helpdesk that automates classification, detects urgency, deduplicates threads, and drafts context-aware responses instantly.

---

## 🏗 System Architecture & Core Features

### 1. Email Context Classification (✅ Implemented)
- **AI Engine:** Powered by Groq (Llama 3.1) for high-speed, low-latency classification.
- **Logic:**
  - **Confidence > 80%:** Auto-tags category (Technical, Billing, Access, etc.) and Priority (P1-P4).
  - **Confidence < 80%:** Flags for manual human review.
- **Capabilities:** Handles mixed languages (English/Hindi) and filters spam.

### 2. Thread Detection & Deduplication (✅ Implemented)
- **Smart Grouping:** Uses `In-Reply-To`, `References`, and `Message-ID` headers to group emails into threads.
- **Ticket Mapping:** Regex parsing detects existing ticket numbers (e.g., `#12345`) to update tickets instead of creating duplicates.
- **Semantic Matching (Planned for Future):** Fuzzy matching on subjects for non-standard replies.

### 3. Urgency & Severity Classification (✅ Implemented)
- **Dynamic Signals:** Detects tone (e.g., "ALL CAPS", "urgent", "lawyer") to auto-escalate P1/P2 tickets.
- **SLA Tracking:** P1 (1hr) to P4 (72hr) deadlines are auto-assigned based on severity.

### 4. Intelligent Auto-Response & RAG (✅ Implemented)
- **Retrieval Augmented Generation (RAG):**
  - **Vector DB:** Pinecone (Serverless) stores embeddings of resolved tickets and uploadable knowledge base documents (PDFs).
  - **AI Model:** Sentenced-Transformers via **Hugging Face Router API** (optimized for speed).
- **Auto-Reply Logic:**
  - **Confidence > 80%:** Automatically emails the customer with the AI-generated solution.
  - **Learning Loop:** Resolved tickets are automatically fed back into the vector database to improve future responses.

### 5. Customer Identification (✅ Implemented)
- **Domain Mapping:** Auto-extracts domains (`@tatasteel.com`) to link users to Company Accounts.
- **Lead Detection:** Identifies new domains as potential sales leads.

---

## 🛠 Technology Stack

### Backend
- **Framework:** FastAPI (Python 3.13)
- **Database:**
  - **Operational:** MongoDB Atlas (Aggregations, Threading)
  - **Vector:** Pinecone (Semantic Search)
- **AI Services:**
  - **LLM:** Groq API (Llama 3.1 70B)
  - **Embeddings:** Hugging Face Router API (`all-MiniLM-L6-v2`)
- **Authentication:** JWT (OAuth2 Password Bearer) with `bcrypt` encryption.

### Frontend
- **Framework:** React.js + Vite
- **Styling:** TailwindCSS + Custom "Neon" Aesthetics
- **State:** React Context API (Auth, Tickets)
- **Deployment:** Render (Auto-Deploy from GitHub)

---

## � Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js & npm
- MongoDB Atlas Account (IP Whitelisted to `0.0.0.0/0`)
- API Keys: Groq, Pinecone, Hugging Face

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
```

**Create `.env` file:**
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
GROQ_API_KEY=gsk_...
PINECONE_API_KEY=pc_...
HF_TOKEN=hf_...
EMAIL_USER=support@company.com
EMAIL_PASSWORD=app_password
IMAP_SERVER=imap.gmail.com
```

**Run Server:**
```bash
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
```

**Create `.env` file:**
```env
VITE_API_URL=http://127.0.0.1:8000/api
# For production: VITE_API_URL=https://your-app.onrender.com/api
```

**Run Client:**
```bash
npm run dev
```

---

## 🧪 Success Criteria & Metrics
- **Classification Accuracy:** Consistently >85% across 8 categories.
- **Response Speed:** Auto-responses generated in <5 seconds.
- **Zero Duplicates:** 100% success in threading replies to existing tickets.
- **Deployment:** Fully CI/CD integrated with Render.

---

**© 2024 IntelliDesk AI | CSE Society Agglomeration 2.0**
