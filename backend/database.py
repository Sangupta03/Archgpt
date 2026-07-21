import psycopg2
import psycopg2.extras
import psycopg2.pool
import os
import json
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Connection pool — created once at import time, shared across all requests.
# minconn=1: always keep at least 1 connection warm
# maxconn=10: never open more than 10 at once (Neon free tier limit)
_pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)

def get_connection():
    # Borrow a connection from the pool instead of opening a new one
    return _pool.getconn()

def release_connection(conn):
    # Return the connection to the pool so the next request can use it
    _pool.putconn(conn)

def create_tables():
    conn = get_connection()
    try:
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
        cur.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id            SERIAL PRIMARY KEY,
                session_id    INTEGER REFERENCES sessions(id) ON DELETE SET NULL,
                message_index INTEGER NOT NULL,
                rating        SMALLINT NOT NULL,
                created_at    TIMESTAMP DEFAULT NOW()
            )
        """)
        conn.commit()
        cur.close()
        print("✅ Database tables ready")
    finally:
        release_connection(conn)

# ── User queries ──────────────────────────────────────────

def get_user_by_google_id(google_id: str):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM users WHERE google_id = %s", (google_id,))
        user = cur.fetchone()
        cur.close()
        return dict(user) if user else None
    finally:
        release_connection(conn)

def create_user(email: str, name: str, picture: str, google_id: str):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO users (email, name, picture, google_id)
            VALUES (%s, %s, %s, %s)
            RETURNING *
        """, (email, name, picture, google_id))
        user = cur.fetchone()
        conn.commit()
        cur.close()
        return dict(user)
    finally:
        release_connection(conn)

def get_user_by_id(user_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cur.fetchone()
        cur.close()
        return dict(user) if user else None
    finally:
        release_connection(conn)

# ── Session queries ───────────────────────────────────────

def save_session(user_id: int, title: str, messages: list, diagrams: list = []):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO sessions (user_id, title, messages, diagram)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (user_id, title, json.dumps(messages), json.dumps(diagrams)))
        session_id = cur.fetchone()["id"]
        conn.commit()
        cur.close()
        return session_id
    finally:
        release_connection(conn)

def get_user_sessions(user_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT id, title, created_at FROM sessions
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (user_id,))
        sessions = cur.fetchall()
        cur.close()
        return [dict(s) for s in sessions]
    finally:
        release_connection(conn)

def get_session(session_id: int, user_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            SELECT * FROM sessions WHERE id = %s AND user_id = %s
        """, (session_id, user_id))
        session = cur.fetchone()
        cur.close()
        return dict(session) if session else None
    finally:
        release_connection(conn)

def delete_session(session_id: int, user_id: int):
    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute("""
            DELETE FROM sessions WHERE id = %s AND user_id = %s
        """, (session_id, user_id))
        conn.commit()
        cur.close()
    finally:
        release_connection(conn)

# ── Feedback ──────────────────────────────────────────────

def save_feedback(session_id, message_index: int, rating: int):
    conn = get_connection()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("""
            INSERT INTO feedback (session_id, message_index, rating)
            VALUES (%s, %s, %s)
            RETURNING id
        """, (session_id, message_index, rating))
        fid = cur.fetchone()["id"]
        conn.commit()
        cur.close()
        return fid
    finally:
        release_connection(conn)

# ── Health check helper ───────────────────────────────────

def check_db_connection() -> bool:
    """Returns True if DB is reachable, False otherwise."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        release_connection(conn)
        return True
    except Exception:
        return False
