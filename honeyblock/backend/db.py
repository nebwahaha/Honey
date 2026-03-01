import sqlite3
import os
from contextlib import contextmanager
from datetime import datetime, timezone

DB_PATH = "/opt/honeyblock/honeyblock.db"


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip TEXT NOT NULL,
                username TEXT,
                password TEXT,
                timestamp TEXT NOT NULL,
                event_type TEXT,
                country TEXT,
                city TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS blocked_ips (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip TEXT NOT NULL UNIQUE,
                blocked_at TEXT NOT NULL,
                rule_id TEXT
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_attempts_ip ON attempts(ip)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_attempts_timestamp ON attempts(timestamp)")


def insert_attempt(data: dict):
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO attempts (ip, username, password, timestamp, event_type, country, city)
               VALUES (:ip, :username, :password, :timestamp, :event_type, :country, :city)""",
            {
                "ip": data["ip"],
                "username": data.get("username"),
                "password": data.get("password"),
                "timestamp": data.get("timestamp", datetime.now(timezone.utc).isoformat()),
                "event_type": data.get("event_type"),
                "country": data.get("country"),
                "city": data.get("city"),
            },
        )


def get_attempts(limit: int = 50, offset: int = 0) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM attempts ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(row) for row in rows]


def get_stats() -> dict:
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM attempts").fetchone()[0]
        unique_ips = conn.execute("SELECT COUNT(DISTINCT ip) FROM attempts").fetchone()[0]
        blocked = conn.execute("SELECT COUNT(*) FROM blocked_ips").fetchone()[0]

        top_ips = conn.execute(
            "SELECT ip, COUNT(*) as count FROM attempts GROUP BY ip ORDER BY count DESC LIMIT 10"
        ).fetchall()

        top_usernames = conn.execute(
            "SELECT username, COUNT(*) as count FROM attempts WHERE username IS NOT NULL "
            "GROUP BY username ORDER BY count DESC LIMIT 10"
        ).fetchall()

        return {
            "total_attempts": total,
            "unique_ips": unique_ips,
            "blocked_ips": blocked,
            "top_ips": [dict(r) for r in top_ips],
            "top_usernames": [dict(r) for r in top_usernames],
        }


def add_blocked_ip(ip: str) -> dict:
    with get_connection() as conn:
        blocked_at = datetime.now(timezone.utc).isoformat()
        conn.execute(
            "INSERT OR IGNORE INTO blocked_ips (ip, blocked_at) VALUES (?, ?)",
            (ip, blocked_at),
        )
        row = conn.execute("SELECT * FROM blocked_ips WHERE ip = ?", (ip,)).fetchone()
        return dict(row)


def remove_blocked_ip(ip: str):
    with get_connection() as conn:
        conn.execute("DELETE FROM blocked_ips WHERE ip = ?", (ip,))


def get_blocked_ips() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM blocked_ips ORDER BY blocked_at DESC"
        ).fetchall()
        return [dict(row) for row in rows]


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
