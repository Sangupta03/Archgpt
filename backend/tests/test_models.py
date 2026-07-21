"""
Unit tests for Pydantic request model validation.
No server, no mocking needed — just pure model validation.
"""
import pytest
from pydantic import ValidationError

# patch env before importing main
import os
os.environ.setdefault("GEMINI_API_KEY", "test")
os.environ.setdefault("DATABASE_URL", "postgresql://test")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test")

from unittest.mock import patch, MagicMock
with patch("database._pool"), patch("database.create_tables"), \
     patch("retriever.collection"), patch("retriever.gemini"), patch("main.gemini"):
    from main import ChatRequest, QuizRequest, FlashcardRequest, FeedbackRequest, Message


# ── ChatRequest ───────────────────────────────────────────

def test_chat_request_valid():
    r = ChatRequest(messages=[Message(role="user", content="hi")])
    assert r.model == "gemini-2.5-flash-lite"

def test_chat_request_empty_messages():
    with pytest.raises(ValidationError):
        ChatRequest(messages=[])

def test_chat_request_bad_model():
    with pytest.raises(ValidationError):
        ChatRequest(
            messages=[Message(role="user", content="hi")],
            model="gpt-4o"
        )

def test_chat_request_allowed_models():
    for model in ["gemini-2.5-flash-lite", "gemini-2.5-flash"]:
        r = ChatRequest(messages=[Message(role="user", content="hi")], model=model)
        assert r.model == model


# ── QuizRequest ───────────────────────────────────────────

def test_quiz_valid():
    r = QuizRequest(topic="Kafka")
    assert r.num_questions == 5

def test_quiz_whitespace_topic():
    with pytest.raises(ValidationError):
        QuizRequest(topic="   ")

def test_quiz_topic_gets_stripped():
    r = QuizRequest(topic="  Kafka  ")
    assert r.topic == "Kafka"

def test_quiz_num_questions_too_high():
    with pytest.raises(ValidationError):
        QuizRequest(topic="Kafka", num_questions=11)

def test_quiz_num_questions_zero():
    with pytest.raises(ValidationError):
        QuizRequest(topic="Kafka", num_questions=0)

def test_quiz_num_questions_boundary():
    assert QuizRequest(topic="Kafka", num_questions=1).num_questions == 1
    assert QuizRequest(topic="Kafka", num_questions=10).num_questions == 10


# ── FlashcardRequest ──────────────────────────────────────

def test_flashcard_valid():
    r = FlashcardRequest(topic="Redis")
    assert r.num_cards == 8

def test_flashcard_empty_topic():
    with pytest.raises(ValidationError):
        FlashcardRequest(topic="")

def test_flashcard_too_many_cards():
    with pytest.raises(ValidationError):
        FlashcardRequest(topic="Redis", num_cards=21)


# ── FeedbackRequest ───────────────────────────────────────

def test_feedback_valid_up():
    r = FeedbackRequest(message_index=0, rating=1)
    assert r.session_id is None

def test_feedback_valid_down():
    r = FeedbackRequest(message_index=2, rating=-1, session_id=5)
    assert r.session_id == 5
