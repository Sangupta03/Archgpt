# ArchGPT — AI System Design Explainer

<div align="center">

![ArchGPT Banner](https://img.shields.io/badge/ArchGPT-AI%20System%20Design-5b4de8?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6TTIgMTdsOCA0IDgtNE0yIDEybDggNCA4LTQiLz48L3N2Zz4=)

**Ask any system design question → Get a structured explanation + live architecture diagram**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?style=flat&logo=google)](https://ai.google.dev)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-RAG-orange?style=flat)](https://www.trychroma.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat)](LICENSE)

[Live Demo](#) · [Report Bug](issues) · [Request Feature](issues)

</div>

---

## 📸 Screenshots

> *Type any system → streaming explanation on the left, auto-generated architecture diagram on the right*

| Feature | Preview |
|---------|---------|
| 🏗️ System Design | Full structured breakdown with RAG-powered answers |
| 📊 Live Diagrams | Mermaid.js architecture diagrams, zoomable + downloadable |
| ⚡ Compare Mode | Side-by-side comparison of any two systems |
| 🧠 Quiz Mode | Auto-generated MCQs from your own knowledge base |

---

## ✨ Features

### 🤖 AI-Powered Explanations
- Ask **"Design YouTube"**, **"How does Swiggy scale?"**, **"Explain consistent hashing"**
- Structured responses: Overview → Core Components → Architecture Decisions → Scalability → Trade-offs
- Answers **stream token by token** — no waiting for the full response

### 📐 Live Architecture Diagrams
- Every system design generates a **Mermaid.js diagram automatically**
- **Zoom in/out** with controls — never miss a component
- **Download as SVG** — use diagrams in your own notes or presentations

### 🔍 RAG — Answers from a Custom Knowledge Base
- Backed by **40+ system design documents** (URL shortener, YouTube, WhatsApp, Swiggy, consistent hashing, load balancers, caching, rate limiters and more)
- Uses **Gemini Embeddings + ChromaDB** for semantic search
- Responses **cite sources** — you know exactly where the answer came from

### 🧠 Intent-Aware AI Agent
- Detects what you're asking and picks the right response style automatically
  - `"Design X"` → full system design + diagram
  - `"Compare X vs Y"` → side-by-side comparison table + two diagrams
  - `"What is X"` → conceptual explanation with analogy
  - `"Quiz me on X"` → 5 MCQs generated from your knowledge base

### 💬 Chat Memory
- Full conversation history maintained across turns
- Ask follow-up questions naturally: *"What database would you use?"* → AI remembers the system context

### 🎨 Clean 2-Panel UI
- **Resizable panels** — drag the divider to give more space to chat or diagram
- Dark theme, smooth streaming, suggestion chips for quick starts

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| 🎨 Frontend | React 18 + Vite | Component-based, fast HMR, industry standard |
| ⚙️ Backend | Python + FastAPI | Async, auto docs, perfect for AI apps |
| 🤖 LLM | Gemini 2.5 Flash | Free tier, fast, excellent reasoning |
| 🔢 Embeddings | Gemini text-embedding-004 | Same SDK, semantic search |
| 🗄️ Vector DB | ChromaDB | Local, free, production-ready |
| 📡 Streaming | Server-Sent Events (SSE) | Real-time token streaming |
| 📊 Diagrams | Mermaid.js | Auto-rendered architecture diagrams |
| 🔐 Env | python-dotenv | Secure API key management |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     ArchGPT                             │
│                                                         │
│  React Frontend (Vite)                                  │
│  ┌──────────────────┐   ┌──────────────────────────┐   │
│  │   ChatPanel      │   │     DiagramPanel         │   │
│  │  - MessageBubble │   │  - Mermaid.js renderer   │   │
│  │  - Streaming UI  │   │  - Zoom controls         │   │
│  │  - Quiz format   │   │  - SVG download          │   │
│  └────────┬─────────┘   └──────────────────────────┘   │
│           │ POST /chat (SSE stream)                     │
│  ─────────┼──────────────────────────────────────────  │
│           ▼                                             │
│  FastAPI Backend (main.py)                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. Detect intent (design/compare/quiz/concept) │   │
│  │  2. RAG: retrieve relevant chunks from ChromaDB │   │
│  │  3. Augment prompt with retrieved context       │   │
│  │  4. Stream Gemini response token by token       │   │
│  └──────┬──────────────────────┬───────────────────┘   │
│         │                      │                        │
│         ▼                      ▼                        │
│  ChromaDB (vector DB)    Gemini 2.5 Flash API           │
│  - 40+ doc chunks        - Streaming generation         │
│  - Gemini embeddings     - System prompt enforced       │
│  - Cosine similarity     - Intent-aware prompts         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

```bash
node --version   # v18+
python --version # 3.10+
git --version    # any
```

Get a **free Gemini API key** → [aistudio.google.com](https://aistudio.google.com) (no credit card needed)

---

### 1️⃣ Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/archgpt.git
cd archgpt
```

### 2️⃣ Set up the backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate

pip install fastapi uvicorn google-genai chromadb python-dotenv
```

Create your `.env` file:

```bash
cp .env.example .env
```

Add your Gemini API key to `.env`:

```
GEMINI_API_KEY=your_key_here
```

### 3️⃣ Build the knowledge base

```bash
# Run once — embeds all docs into ChromaDB
python ingest.py
```

You'll see each document being chunked and stored:
```
📄 youtube.txt: 4 chunks
   ✅ chunk 0 stored
   ✅ chunk 1 stored
...
🎉 Done! 24 chunks stored in ChromaDB.
```

### 4️⃣ Start the backend

```bash
uvicorn main:app --reload
```

Backend runs at → `http://localhost:8000`
Auto-generated API docs → `http://localhost:8000/docs`

### 5️⃣ Set up and start the frontend

```bash
# New terminal
cd frontend
npm install
npm run dev
```

Frontend runs at → `http://localhost:5173`

---

## 📂 Project Structure

```
archgpt/
│
├── 📁 backend/
│   ├── main.py          # FastAPI app — routes, RAG pipeline, streaming
│   ├── retriever.py     # ChromaDB query — semantic search over docs
│   ├── ingest.py        # One-time script — embeds docs into ChromaDB
│   ├── .env             # API keys (never committed)
│   ├── .env.example     # Template for environment variables
│   │
│   ├── 📁 docs/         # System design knowledge base
│   │   ├── youtube.txt
│   │   ├── whatsapp.txt
│   │   ├── swiggy.txt
│   │   ├── url-shortener.txt
│   │   ├── consistent-hashing.txt
│   │   ├── load-balancer.txt
│   │   ├── caching.txt
│   │   └── rate-limiter.txt
│   │
│   └── 📁 chroma_db/    # Auto-generated — vector database (git ignored)
│
└── 📁 frontend/
    ├── index.html       # Mermaid.js CDN loaded here
    └── src/
        ├── App.jsx          # Root — owns all state, panel layout
        ├── ChatPanel.jsx    # Left panel — messages, input, formatting
        ├── DiagramPanel.jsx # Right panel — Mermaid renderer, zoom, download
        ├── main.jsx         # React entry point
        └── index.css        # Global styles
```

---

## 💡 How It Works

### RAG Pipeline

```
User query: "Design a URL shortener"
      │
      ▼
1. EMBED query using Gemini text-embedding-004
      │
      ▼
2. SEARCH ChromaDB for top 3 most similar chunks
   → finds url-shortener.txt chunks (94% similarity)
   → finds caching.txt chunk (78% similarity)
      │
      ▼
3. AUGMENT prompt:
   "Reference material: [chunk1] [chunk2]
    User question: Design a URL shortener"
      │
      ▼
4. GEMINI generates answer using retrieved context
   → cites sources inline: [Source: Url Shortener]
      │
      ▼
5. STREAM tokens to browser one by one
```

### Agent Intent Detection

```python
"Design YouTube"           → full system design + diagram
"Compare YouTube vs Netflix" → comparison table + 2 diagrams
"What is consistent hashing"  → conceptual explanation + analogy
"Quiz me on load balancers"    → 5 MCQs from knowledge base
```

### Key Concepts Implemented

| Concept | Where | What you learn |
|---------|-------|---------------|
| **REST API** | `main.py` — `@app.post("/chat")` | HTTP methods, request/response cycle |
| **Async streaming** | `StreamingResponse` + SSE | Real-time data, event streams |
| **RAG** | `retriever.py` + `ingest.py` | Embeddings, vector search, prompt injection |
| **Vector DB** | ChromaDB | Semantic search, cosine similarity |
| **React state** | `useState` in all components | Component re-renders, state management |
| **React effects** | `useEffect` for scroll + render | Side effects, dependency arrays |
| **Props** | App → ChatPanel → MessageBubble | Unidirectional data flow |
| **Prompt engineering** | `SYSTEM_PROMPT` in `main.py` | Structured AI outputs |

---

## 🤝 Contributing

Contributions are welcome! If you want to add more system design docs to the knowledge base, improve the UI, or add new features:

1. Fork the repo
2. Create a feature branch: `git checkout -b feat/add-netflix-doc`
3. Commit: `git commit -m "feat: add Netflix system design doc"`
4. Push: `git push origin feat/add-netflix-doc`
5. Open a Pull Request

---

## 📄 License

MIT License — feel free to use this for your own learning and portfolio.

---

<div align="center">

Built with ❤️ for placement preparation

⭐ Star this repo if it helped you!

</div>