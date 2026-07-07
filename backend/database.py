#  all database logic in one place
# Handles: connection, table creation, user queries, session queries

import psycopg2
import psycopg2.extras  # for dict cursor (rows as dicts, not tuples)
import os
import json
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def get_connection():
    """
    Create a new database connection.
    We create a new connection per request — for a small app this is fine.
    At scale you'd use a connection pool (psycopg2.pool or asyncpg).
    """
    return psycopg2.connect(DATABASE_URL)

def create_tables():
    """
    Create tables if they don't exist.
    Called once when the app starts.
    IF NOT EXISTS means safe to call multiple times.
    """
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         SERIAL PRIMARY KEY,
            email      TEXT UNIQUE NOT NULL,
            name       TEXT,
            picture    TEXT,
            google_id  TEXT UNIQUE,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id         SERIAL PRIMARY KEY,
            user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title      TEXT,
            messages   JSONB NOT NULL DEFAULT '[]',
            diagram    TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)

    # thumbs up / down ratings on AI messages
    cur.execute("""
        CREATE TABLE IF NOT EXISTS feedback (
            id            SERIAL PRIMARY KEY,
            session_id    INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
            message_index INTEGER NOT NULL,
            rating        SMALLINT NOT NULL,  -- 1 = thumbs up, -1 = thumbs down
            created_at    TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database tables ready")

# ── User queries ──────────────────────────────────────────

def get_user_by_google_id(google_id: str):
    """Find a user by their Google ID. Returns dict or None."""
    conn = get_connection()
    # RealDictCursor returns rows as dicts: {"id": 1, "email": "..."}
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return dict(user) if user else None

def create_user(email: str, name: str, picture: str, google_id: str):
    """Insert a new user. Returns the created user as dict."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        INSERT INTO users (email, name, picture, google_id)
        VALUES (%s, %s, %s, %s)
        RETURNING *
    """, (email, name, picture, google_id))
    # RETURNING * gives us back the created row including id and created_at
    user = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return dict(user)

def get_user_by_id(user_id: int):
    """Find a user by their internal ID (from JWT payload)."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    return dict(user) if user else None

# ── Session queries ───────────────────────────────────────

def save_session(user_id: int, title: str, messages: list, diagrams: list = []):
    """Create a new chat session. Returns session id."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        INSERT INTO sessions (user_id, title, messages, diagram)
        VALUES (%s, %s, %s, %s)
        RETURNING id
    """, (user_id, title, json.dumps(messages), json.dumps(diagrams)))
    # json.dumps converts Python list to JSON string for JSONB column
    session_id = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return session_id

def get_user_sessions(user_id: int):
    """Get all sessions for a user, newest first."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT id, title, created_at
        FROM sessions
        WHERE user_id = %s
        ORDER BY created_at DESC
        LIMIT 50
    """, (user_id,))
    # Only fetch title + date for the list — not full messages (saves bandwidth)
    sessions = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(s) for s in sessions]

def get_session(session_id: int, user_id: int):
    """Get a single session. Checks user_id for authorization."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT * FROM sessions
        WHERE id = %s AND user_id = %s
    """, (session_id, user_id))
    # user_id check = authorization: you can only load YOUR sessions
    session = cur.fetchone()
    cur.close()
    conn.close()
    return dict(session) if session else None

def delete_session(session_id: int, user_id: int):
    """Delete a session. user_id ensures you can only delete your own."""
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        DELETE FROM sessions WHERE id = %s AND user_id = %s
    """, (session_id, user_id))
    conn.commit()
    cur.close()
    conn.close()

# ── Feedback ──────────────────────────────────────────────

def save_feedback(session_id, message_index: int, rating: int):
    """Store a thumbs up (1) or down (-1) for an AI message."""
    conn = get_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        INSERT INTO feedback (session_id, message_index, rating)
        VALUES (%s, %s, %s)
        RETURNING id
    """, (session_id, message_index, rating))
    fid = cur.fetchone()["id"]
    conn.commit()
    cur.close()
    conn.close()
    return fid