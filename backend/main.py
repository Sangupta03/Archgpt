# ── Imports ──────────────────────────────────────────────
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv
from retriever import retrieve
import os, json

# ── Load API key ──────────────────────────────────────────
load_dotenv()
gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# ── App setup ─────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
After your explanation, output a Mermaid diagram. Keep it SIMPLE — max 12 nodes, no subgraphs, no special characters in node labels. Use this format exactly:

```mermaid
graph TD
    A[Client] --> B[Load Balancer]
    B --> C[API Server]
    C --> D[Database]
    C --> E[Cache Redis]
```

Rules for the diagram:
- Maximum 12 nodes
- NO subgraph blocks
- NO parentheses inside node labels
- Only use --> arrows
- Keep node labels short, under 4 words

Use Indian startup examples when relevant."""

# ── Request models ────────────────────────────────────────
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: list[Message]

# ── Single /chat endpoint — RAG + Gemini + streaming ──────
@app.post("/chat")
async def chat(request: ChatRequest):

    history = []
    for msg in request.messages[:-1]:
        history.append(
            types.Content(
                role="user" if msg.role == "user" else "model",
                parts=[types.Part(text=msg.content)]
            )
        )

    latest = request.messages[-1].content

    # ── Agent: detect intent, pick the right tool ─────────
    # Instead of always doing RAG, we detect what the user wants
    # and build the prompt accordingly

    lower = latest.lower()

    # Intent 1: Compare two systems
    is_compare = any(w in lower for w in ["compare", "vs", "versus", "difference between"])

    # Intent 2: Quiz request
    is_quiz = any(w in lower for w in ["quiz", "test me", "question", "flashcard"])

    # Intent 3: Pure concept question (no diagram needed)
    is_concept = any(w in lower for w in ["what is", "explain", "why does", "how does", "what are"])

    # Always retrieve relevant docs
    context = retrieve(latest)

    if is_compare:
        augmented_prompt = f"""The user wants to COMPARE two systems.
Provide a structured comparison with:
1. Side-by-side table of key differences
2. When to use each
3. Trade-offs
4. Generate a diagram for EACH system (two separate mermaid blocks)

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
Cite the source when you use information from it.

REFERENCE MATERIAL:
{context}

USER QUESTION:
{latest}"""

    chat_session = gemini.chats.create(
        model="gemini-2.5-flash-lite",
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
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

# ── Quiz endpoint — generates MCQs from a system topic ───
class QuizRequest(BaseModel):
    topic: str        # e.g. "YouTube", "URL shortener"
    num_questions: int = 5

@app.post("/quiz")
async def generate_quiz(request: QuizRequest):
    # Retrieve relevant docs for this topic
    context = retrieve(request.topic)

    prompt = f"""Generate exactly {request.num_questions} multiple choice questions
to test understanding of {request.topic} system design.

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
        import re
        # Strip markdown code fences if present
        text = response.text.strip()
        text = re.sub(r'^```json\s*', '', text)
        text = re.sub(r'\s*```$', '', text)
        quiz_data = json.loads(text)
        return quiz_data
    except Exception as e:
        return {"error": "Failed to parse quiz", "raw": response.text}

# ── Health check ──────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}