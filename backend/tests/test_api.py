"""
API tests — run with: pytest tests/
Uses FastAPI's TestClient so no real server needed.
Mocks Gemini and ChromaDB so tests run offline without API keys.
"""
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# ── Patch external services before importing app ──────────
# We mock at module level so the app never tries to connect to real services

@pytest.fixture(autouse=True)
def mock_env(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("DATABASE_URL", "postgresql://test")
    monkeypatch.setenv("GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setenv("GOOGLE_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:5173")


@pytest.fixture
def client():
    with patch("database._pool") as mock_pool, \
         patch("database.create_tables"), \
         patch("retriever.collection") as mock_col, \
         patch("retriever.gemini") as mock_gem_retriever, \
         patch("main.gemini") as mock_gem_main:

        # ChromaDB: return 1 fake doc
        mock_col.count.return_value = 1
        mock_col.query.return_value = {
            "documents": [["Kafka uses a log-based architecture."]],
            "metadatas": [[{"source": "kafka.txt"}]]
        }
        mock_gem_retriever.models.embed_content.return_value = MagicMock(
            embeddings=[MagicMock(values=[0.1] * 3072)]
        )

        # Gemini chat: stream a fake response
        fake_chunk = MagicMock()
        fake_chunk.text = "Kafka is a distributed message queue."
        mock_chat = MagicMock()
        mock_chat.send_message_stream.return_value = [fake_chunk]
        mock_gem_main.chats.create.return_value = mock_chat

        # Gemini generate (for quiz/flashcards)
        mock_gem_main.models.generate_content.return_value = MagicMock(
            text=json.dumps({
                "questions": [{
                    "question": "What is Kafka?",
                    "options": ["A) A DB", "B) A queue", "C) A cache", "D) A CDN"],
                    "answer": "B",
                    "explanation": "Kafka is a distributed message queue."
                }]
            })
        )

        from main import app
        yield TestClient(app)


# ── /health ───────────────────────────────────────────────

def test_health_ok(client):
    with patch("main.check_db_connection", return_value=True):
        res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["db"] is True

def test_health_db_down(client):
    with patch("main.check_db_connection", return_value=False):
        res = client.get("/health")
    assert res.status_code == 503
    assert res.json()["status"] == "degraded"


# ── /chat ─────────────────────────────────────────────────

def test_chat_streams_response(client):
    res = client.post("/chat", json={
        "messages": [{"role": "user", "content": "Design YouTube"}],
        "model": "gemini-2.5-flash-lite"
    })
    assert res.status_code == 200
    assert "text/event-stream" in res.headers["content-type"]

def test_chat_empty_messages_rejected(client):
    res = client.post("/chat", json={
        "messages": [],
        "model": "gemini-2.5-flash-lite"
    })
    assert res.status_code == 422

def test_chat_invalid_model_rejected(client):
    res = client.post("/chat", json={
        "messages": [{"role": "user", "content": "hello"}],
        "model": "gpt-4"
    })
    assert res.status_code == 422

def test_chat_missing_messages_rejected(client):
    res = client.post("/chat", json={"model": "gemini-2.5-flash-lite"})
    assert res.status_code == 422


# ── /quiz ─────────────────────────────────────────────────

def test_quiz_returns_questions(client):
    res = client.post("/quiz", json={"topic": "Kafka", "num_questions": 1})
    assert res.status_code == 200
    assert "questions" in res.json()
    assert len(res.json()["questions"]) == 1

def test_quiz_empty_topic_rejected(client):
    res = client.post("/quiz", json={"topic": "   ", "num_questions": 5})
    assert res.status_code == 422

def test_quiz_too_many_questions_rejected(client):
    res = client.post("/quiz", json={"topic": "Kafka", "num_questions": 50})
    assert res.status_code == 422

def test_quiz_zero_questions_rejected(client):
    res = client.post("/quiz", json={"topic": "Kafka", "num_questions": 0})
    assert res.status_code == 422


# ── /flashcards ───────────────────────────────────────────

def test_flashcards_empty_topic_rejected(client):
    res = client.post("/flashcards", json={"topic": "", "num_cards": 5})
    assert res.status_code == 422

def test_flashcards_too_many_cards_rejected(client):
    res = client.post("/flashcards", json={"topic": "Kafka", "num_cards": 100})
    assert res.status_code == 422

def test_flashcards_valid_request(client):
    with patch("main.gemini") as mock_gem:
        mock_gem.models.generate_content.return_value = MagicMock(
            text=json.dumps({
                "cards": [{"front": "What is Kafka?", "back": "A queue.", "category": "concept"}]
            })
        )
        res = client.post("/flashcards", json={"topic": "Kafka", "num_cards": 1})
    assert res.status_code == 200


# ── /feedback ─────────────────────────────────────────────

def test_feedback_invalid_rating_rejected(client):
    with patch("main.save_feedback"):
        res = client.post("/feedback", json={
            "message_index": 0,
            "rating": 5
        })
    assert res.status_code == 400

def test_feedback_valid_thumbs_up(client):
    with patch("main.save_feedback", return_value=1):
        res = client.post("/feedback", json={
            "message_index": 0,
            "rating": 1
        })
    assert res.status_code == 200

def test_feedback_valid_thumbs_down(client):
    with patch("main.save_feedback", return_value=2):
        res = client.post("/feedback", json={
            "message_index": 1,
            "rating": -1
        })
    assert res.status_code == 200
