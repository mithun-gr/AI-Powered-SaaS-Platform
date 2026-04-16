from supabase import create_client, Client
from config.settings import SUPABASE_URL, SUPABASE_KEY
from qdrant_client import AsyncQdrantClient
from config.settings import QDRANT_URL, QDRANT_API_KEY
import sqlite3
import os

_supabase_client = None
_qdrant_client = None

# SQLite DB path — stored right inside the ai-backend folder
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "morchantra_chat.db")

def _init_sqlite():
    """Auto-create the chat_messages table if it doesn't exist."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS chat_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            sender TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()

# Auto-initialize on import
_init_sqlite()

def get_supabase_client() -> Client:
    global _supabase_client
    if _supabase_client is None:
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
            except Exception as e:
                print(f"Warning: Could not connect to Supabase: {e}")
    return _supabase_client

def get_qdrant_client():
    global _qdrant_client
    if _qdrant_client is None:
        if QDRANT_API_KEY:
            _qdrant_client = AsyncQdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY)
        else:
            _qdrant_client = AsyncQdrantClient(url=QDRANT_URL)
    return _qdrant_client

async def save_chat_message(user_id: str, sender: str, message: str):
    """Save a chat message into the local SQLite database."""
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute(
            "INSERT INTO chat_messages (user_id, sender, content) VALUES (?, ?, ?)",
            (user_id, sender, str(message))
        )
        conn.commit()
        conn.close()
        print(f"💾 Saved [{sender}] message for user {user_id}")
    except Exception as e:
        print(f"Warning: Could not save chat message: {e}")
