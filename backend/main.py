# ── Imports ──────────────────────────────────────────────

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse, RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from auth import get_google_auth_url, exchange_code_for_user, create_jwt, get_current_user_id
from database import create_tables, get_user_by_google_id, create_user, get_user_by_id, save_session, get_user_sessions, get_session, delete_session, save_feedback, check_db_connection
from pydantic import BaseModel, field_validator
from google import genai
from google.genai import types
from dotenv import load_dotenv
from retriever import retrieve, retrieve_with_sources
from typing import Optional
import os, json, re, logging, time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# ── Load env ──────────────────────────────────────────────
load_dotenv()

# Fail fast on startup if required env vars are missing
_required_env = ["GEMINI_API_KEY", "DATABASE_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]
for _var in _required_env:
    if not os.getenv(_var):
        raise RuntimeError(f"Missing required environment variable: {_var}")

gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://localhost:8000/auth/callback")

# ── App setup ─────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create DB tables on startup
create_tables()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── System Prompt ─────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert system design architect with 15+ years at Google, Meta, Amazon.

When asked to design any system, ALWAYS respond in this exact structure:

## Overview
2-3 sentences on what this system does and its scale.

## Core Components
List the key building blocks with one line explanation each.

## Architecture Decisions
Database choice (SQL vs NoSQL and why), caching strategy, message queues if needed.

## Scalability
How it handles 1M → 10M → 100M users. Be specific.

## Trade-offs
What you're optimizing for. What you're sacrificing.

## Architecture Diagram
After your explanation, output a Mermaid diagram showing a clean layered architecture. Use exactly this format:

```mermaid
graph TD
    A[Client] --> B[Load Balancer]
    B --> C[API Server]
    C --> D[Database]
    C --> E[Cache Redis]
```

Rules — follow ALL of them, no exceptions:
- Maximum 10 nodes total
- NO subgraph blocks
- NO parentheses or special characters in node labels
- Only --> arrows
- Node labels: 2-3 words MAX (e.g. "Order Service", "Redis Cache", "Kafka Queue")
- ONLY architecture components as nodes — services, databases, caches, queues, load balancers, CDN
- ABSOLUTELY NO text annotations, trade-off notes, sentences, explanations, or any prose as nodes
- Never add nodes like "Sacrificing: ...", "Note: ...", or any descriptive text — those belong in your written response, not the diagram
- Show LAYERS top to bottom: Client → Load Balancer → API Gateway → 3-4 key Services → their primary Data Stores
- Each service connects to AT MOST 1-2 data stores (its own primary ones only)
- Result must be a clean readable tree with no crossing lines

Use Indian startup examples when relevant."""

# ── Request models ────────────────────────────────────────
ALLOWED_MODELS = {"gemini-2.5-flash-lite", "gemini-2.5-flash"}

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]
    model: str = "gemini-2.5-flash-lite"

    @field_validator("messages")
    @classmethod
    def messages_not_empty(cls, v):
        if not v:
            raise ValueError("messages list cannot be empty")
        return v

    @field_validator("model")
    @classmethod
    def model_must_be_allowed(cls, v):
        if v not in ALLOWED_MODELS:
            raise ValueError(f"model must be one of {ALLOWED_MODELS}")
        return v

# ── Single /chat endpoint — RAG + Gemini + streaming ──────
@app.post("/chat")
@limiter.limit("20/minute")
async def chat(request: Request, body: ChatRequest):

    history = []
    for msg in body.messages[:-1]:
        history.append(
            types.Content(
                role="user" if msg.role == "user" else "model",
                parts=[types.Part(text=msg.content)]
            )
        )

    latest = body.messages[-1].content

    lower = latest.lower()
    is_compare = any(w in lower for w in ["compare", "vs", "versus", "difference between"])
    is_quiz    = any(w in lower for w in ["quiz", "test me", "question", "flashcard"])
    is_concept = any(w in lower for w in ["what is", "explain", "why does", "how does", "what are"])

    logger.info(f"chat | intent=compare:{is_compare} quiz:{is_quiz} concept:{is_concept} | model={body.model}")
    t0 = time.time()
    context, sources = retrieve_with_sources(latest)
    logger.info(f"retrieval done in {time.time()-t0:.2f}s | sources={sources}")

    if is_compare:
        augmented_prompt = f"""The user wants to COMPARE two systems.
Provide a structured comparison with:
1. Side-by-side table of key differences
2. When to use each
3. Trade-offs
4. A diagram for EACH system (two separate mermaid blocks)

DIAGRAM RULES — follow all of them:
- Label each diagram using ONLY the system name as the heading, like this:
  ## Instagram Diagram
  [mermaid block]
  ## YouTube Diagram
  [mermaid block]
- Do NOT use "Architecture Diagram" as a heading — use the actual system name
- Diagram nodes must ONLY be architecture components: services, databases, caches, queues, CDN
- ABSOLUTELY NO text annotations, trade-off notes, or prose sentences inside the mermaid blocks
- Node labels: 2-3 words max, no parentheses, no special characters
- Max 10 nodes per diagram, clean top-down tree

Reference material:
{context}

User question: {latest}"""

    elif is_quiz:
        augmented_prompt = f"""The user wants to be quizzed.
Generate 5 multiple choice questions on the topic they mentioned.
Format each as:
Q: [question]
A) option B) option C) option D) option
Answer: [letter] — [explanation]

Reference material:
{context}

User question: {latest}"""

    elif is_concept:
        augmented_prompt = f"""The user wants a conceptual explanation.
Explain clearly with:
- Simple analogy first
- Technical detail second
- Real-world example (Indian startup preferred)
- No diagram needed unless it really helps

Reference material:
{context}

User question: {latest}"""

    else:
        # Default: full system design with diagram
        augmented_prompt = f"""Use the following reference material to inform your answer.
Do NOT cite sources inline — sources are shown separately in the UI.

REFERENCE MATERIAL:
{context}

USER QUESTION:
{latest}"""

    chat_session = gemini.chats.create(
        model=body.model,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT
        ),
        history=history,
    )

    def stream():
        response = chat_session.send_message_stream(augmented_prompt)
        for chunk in response:
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
        # send which docs were retrieved so frontend can show citations
        if sources:
            yield f"data: {json.dumps({'sources': sources})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

# ── Quiz endpoint — generates MCQs from a system topic ───
class QuizRequest(BaseModel):
    topic: str
    num_questions: int = 5

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v):
        if not v.strip():
            raise ValueError("topic cannot be empty")
        return v.strip()

    @field_validator("num_questions")
    @classmethod
    def questions_in_range(cls, v):
        if not (1 <= v <= 10):
            raise ValueError("num_questions must be between 1 and 10")
        return v

@app.post("/quiz")
@limiter.limit("10/minute")
async def generate_quiz(request: Request, body: QuizRequest):
    context = retrieve(body.topic)

    prompt = f"""Generate exactly {body.num_questions} multiple choice questions
to test understanding of {body.topic} system design.

Use this reference material:
{context}

Return ONLY valid JSON in this exact format, nothing else:
{{
  "questions": [
    {{
      "question": "What does a load balancer do?",
      "options": ["A) Stores data", "B) Distributes traffic", "C) Caches responses", "D) Encrypts requests"],
      "answer": "B",
      "explanation": "A load balancer distributes incoming traffic across multiple servers to prevent overload."
    }}
  ]
}}"""

    response = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    try:
        text = response.text.strip()
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        quiz_data = json.loads(text)
        logger.info(f"quiz generated | topic={body.topic} | questions={len(quiz_data.get('questions', []))}")
        return quiz_data
    except Exception:
        logger.error(f"quiz parse failed | topic={body.topic}")
        return {"error": "Failed to parse quiz response"}


# ── Flashcard endpoint — concept cards with front/back ────
class FlashcardRequest(BaseModel):
    topic: str
    num_cards: int = 8

    @field_validator("topic")
    @classmethod
    def topic_not_empty(cls, v):
        if not v.strip():
            raise ValueError("topic cannot be empty")
        return v.strip()

    @field_validator("num_cards")
    @classmethod
    def cards_in_range(cls, v):
        if not (1 <= v <= 20):
            raise ValueError("num_cards must be between 1 and 20")
        return v

@app.post("/flashcards")
@limiter.limit("10/minute")
async def generate_flashcards(request: Request, body: FlashcardRequest):
    context = retrieve(body.topic)

    prompt = f"""Generate exactly {body.num_cards} flashcards to help a student learn key concepts about {body.topic} system design.

Use this reference material:
{context}

Mix different card types: definitions, trade-offs, real-world examples, "why" questions.
Each front should be a short question. Each back should be a clear, concise answer (2-3 sentences max).

Return ONLY valid JSON, nothing else:
{{
  "cards": [
    {{
      "front": "What is consistent hashing?",
      "back": "Servers and keys are placed on a ring. Adding/removing a server only moves a small fraction of keys — avoids full resharding.",
      "category": "concept"
    }}
  ]
}}

Categories: concept, trade-off, example, why"""

    response = gemini.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    try:
        text = response.text.strip()
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        data = json.loads(text)
        logger.info(f"flashcards generated | topic={body.topic} | cards={len(data.get('cards', []))}")
        return data
    except Exception:
        logger.error(f"flashcard parse failed | topic={body.topic}")
        return {"error": "Failed to parse flashcards response"}


# ── Feedback endpoint — thumbs up / down on AI responses ──
class FeedbackRequest(BaseModel):
    message_index: int
    rating: int                  # 1 = helpful, -1 = not helpful
    session_id: Optional[int] = None

@app.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    if req.rating not in (1, -1):
        raise HTTPException(status_code=400, detail="rating must be 1 or -1")
    save_feedback(req.session_id, req.message_index, req.rating)
    return {"message": "thanks for the feedback!"}


#to save routes
class SaveSessionRequest(BaseModel):
    title: str
    messages: list[dict]
    diagrams: list[dict] = []


# ── Auth routes ───────────────────────────────────────────

# REDIRECT_URI is set at top of file from env var

@app.get("/auth/login")
def login():
    """Step 1: Redirect user to Google login page."""
    url = get_google_auth_url(REDIRECT_URI)
    return RedirectResponse(url)

@app.get("/auth/callback")
async def auth_callback(code: str):
    """
    Step 2: Google redirects here with a code.
    Exchange code → get user info → find/create user → issue JWT.
    Then redirect to frontend with the JWT.
    """
    # Exchange code for Google user info
    google_user = await exchange_code_for_user(code, REDIRECT_URI)

    google_id = google_user.get("id")
    email     = google_user.get("email")
    name      = google_user.get("name")
    picture   = google_user.get("picture")

    # Find existing user or create new one
    user = get_user_by_google_id(google_id)
    if not user:
        user = create_user(email, name, picture, google_id)

    # Issue JWT
    token = create_jwt(user["id"], user["email"])

    return RedirectResponse(f"{FRONTEND_URL}/auth/success?token={token}")

@app.get("/auth/me")
def get_me(user_id: int = Depends(get_current_user_id)):
    """
    Returns current user info.
    Depends(get_current_user_id) automatically validates JWT.
    If no valid JWT → 401 Unauthorized automatically.
    """
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id":      user["id"],
        "email":   user["email"],
        "name":    user["name"],
        "picture": user["picture"]
    }

# ── Session routes ────────────────────────────────────────

@app.post("/sessions")
def create_session(
    req: SaveSessionRequest,
    user_id: int = Depends(get_current_user_id)  # requires login
):
    """Save a chat session to the database."""
    session_id = save_session(user_id, req.title, req.messages, req.diagrams)
    return {"session_id": session_id, "message": "Session saved"}

@app.get("/sessions")
def list_sessions(user_id: int = Depends(get_current_user_id)):
    """Get all sessions for the logged-in user."""
    sessions = get_user_sessions(user_id)
    # Convert datetime to string for JSON serialization
    for s in sessions:
        s["created_at"] = str(s["created_at"])
    return sessions

@app.get("/sessions/{session_id}")
def load_session(
    session_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """Load a specific session. Authorization built in — only your sessions."""
    session = get_session(session_id, user_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session["created_at"] = str(session["created_at"])
    session["updated_at"] = str(session["updated_at"])
    # Parse diagrams from JSON string if stored as text
    raw = session.get("diagram", "[]") or "[]"
    try:
        session["diagrams"] = json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        session["diagrams"] = []
    return session

@app.delete("/sessions/{session_id}")
def remove_session(
    session_id: int,
    user_id: int = Depends(get_current_user_id)
):
    """Delete a session."""
    delete_session(session_id, user_id)
    return {"message": "Deleted"}

# ── Health check ──────────────────────────────────────────
@app.get("/health")
def health():
    db_ok = check_db_connection()
    status = "ok" if db_ok else "degraded"
    # 503 if DB is down so load balancers / Railway can detect it
    code = 200 if db_ok else 503
    return JSONResponse(
        status_code=code,
        content={"status": status, "db": db_ok}
    )