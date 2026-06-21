# ── Imports ──────────────────────────────────────────────
from fastapi import FastAPI                          # the framework
from fastapi.responses import StreamingResponse      # for token-by-token streaming
from fastapi.middleware.cors import CORSMiddleware   # allows React (port 5173) to talk to FastAPI (port 8000)
from pydantic import BaseModel                       # validates request body shape
import google.generativeai as genai                  # Gemini SDK
from dotenv import load_dotenv                       # reads .env file
import os, json                                      # built-in Python modules

# ── Load API key from .env ────────────────────────────────
load_dotenv()                                        # reads .env file into environment
genai.configure(api_key=os.getenv("GEMINI_API_KEY")) # gives Gemini SDK your key

# ── Create FastAPI app ────────────────────────────────────
app = FastAPI()

# ── CORS — critical for React + FastAPI to work together ─
# React runs on localhost:5173, FastAPI on localhost:8000
# Browsers block cross-origin requests by default — CORS allows it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # only allow your React app
    allow_methods=["*"],                      # allow GET, POST, etc.
    allow_headers=["*"],                      # allow all headers
)

# ── System Prompt — the personality of your AI ───────────
# This is sent with EVERY request. It forces Gemini to always
# respond in a structured format and generate Mermaid diagrams.
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
- NO parentheses or special chars inside node labels like brackets
- Only use --> arrows
- Keep node labels short, under 4 words

Use Indian startup examples when relevant. Keep explanations clear for beginners but deep enough for interviews."""

# ── Request shape — Pydantic validates this automatically ─
class Message(BaseModel):
    role: str       # "user" or "assistant"
    content: str    # the actual text

class ChatRequest(BaseModel):
    messages: list[Message]   # full conversation history

# ── The one endpoint your app has ────────────────────────
@app.post("/chat")
async def chat(request: ChatRequest):

    # Convert messages to Gemini's expected format
    # Gemini uses "user" and "model" (not "assistant")
    history = []
    for msg in request.messages[:-1]:   # all messages except the last one
        history.append({
            "role": "user" if msg.role == "user" else "model",
            "parts": [msg.content]
        })

    # The latest message is the current user input
    latest = request.messages[-1].content

    # Start a Gemini chat session with full history
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",    # free, fast, capable model
        system_instruction=SYSTEM_PROMPT   # always inject our personality
    )
    chat_session = model.start_chat(history=history)

    # ── Streaming generator ───────────────────────────────
    # Instead of waiting for the full response, we yield each
    # chunk the moment Gemini generates it — this is the
    # ChatGPT typing effect
    def stream():
        response = chat_session.send_message(latest, stream=True)
        for chunk in response:
            if chunk.text:
                # SSE format: every message must start with "data: "
                # and end with double newline \n\n
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
        yield "data: [DONE]\n\n"   # signal to browser that stream is finished

    return StreamingResponse(stream(), media_type="text/event-stream")

# ── Health check — useful for deployment later ────────────
@app.get("/health")
def health():
    return {"status": "ok"}