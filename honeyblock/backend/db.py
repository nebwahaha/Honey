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
            CREATE TABLE IF NOT EXISTS attacker_session (
                session_id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip VARCHAR(20) NOT NULL,
                session_duration TEXT NOT NULL,
                event_type VARCHAR(255) NOT NULL,
                username_attempt VARCHAR(255),
                password_attempt VARCHAR(255),
                command_used VARCHAR(255),
                timestamp TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS attacker (
                ip VARCHAR(20) PRIMARY KEY,
                initial_detection TEXT NOT NULL,
                last_detected TEXT NOT NULL,
                country VARCHAR(255),
                is_blocked VARCHAR(10)
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS blocklist (
                block_id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip VARCHAR(20) NOT NULL,
                block_date TEXT NOT NULL,
                blocked_by VARCHAR(10),
                expiration_date TEXT,
                is_active VARCHAR(10),
                FOREIGN KEY (ip) REFERENCES attacker(ip)
            )
        """)
        conn.execute("CREATE INDEX IF NOT EXISTS idx_session_ip ON attacker_session(ip)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_session_timestamp ON attacker_session(timestamp)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_blocklist_ip ON blocklist(ip)")


def insert_session(data: dict):
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO attacker_session (ip, session_duration, event_type, username_attempt, password_attempt, command_used, timestamp)
               VALUES (:ip, :session_duration, :event_type, :username_attempt, :password_attempt, :command_used, :timestamp)""",
            {
                "ip": data["ip"],
                "session_duration": data.get("session_duration", datetime.now(timezone.utc).isoformat()),
                "event_type": data.get("event_type", ""),
                "username_attempt": data.get("username_attempt"),
                "password_attempt": data.get("password_attempt"),
                "command_used": data.get("command_used"),
                "timestamp": data.get("timestamp", datetime.now(timezone.utc).isoformat()),
            },
        )


def get_sessions(limit: int = 50, offset: int = 0) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM attacker_session ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        return [dict(row) for row in rows]


def get_stats() -> dict:
    with get_connection() as conn:
        total = conn.execute("SELECT COUNT(*) FROM attacker_session").fetchone()[0]
        unique_ips = conn.execute("SELECT COUNT(DISTINCT ip) FROM attacker_session").fetchone()[0]
        blocked = conn.execute("SELECT COUNT(*) FROM attacker WHERE is_blocked = 'Blocked'").fetchone()[0]

        top_ips = conn.execute(
            "SELECT ip, COUNT(*) as count FROM attacker_session GROUP BY ip ORDER BY count DESC LIMIT 10"
        ).fetchall()

        top_usernames = conn.execute(
            "SELECT username_attempt, COUNT(*) as count FROM attacker_session WHERE username_attempt IS NOT NULL "
            "GROUP BY username_attempt ORDER BY count DESC LIMIT 10"
        ).fetchall()

        return {
            "total_attempts": total,
            "unique_ips": unique_ips,
            "blocked_ips": blocked,
            "top_ips": [dict(r) for r in top_ips],
            "top_usernames": [dict(r) for r in top_usernames],
        }


# ---------------------------------------------------------------------------
# Attacker table
# ---------------------------------------------------------------------------
def upsert_attacker(ip: str, country: str = None):
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        existing = conn.execute("SELECT * FROM attacker WHERE ip = ?", (ip,)).fetchone()
        if existing:
            conn.execute(
                "UPDATE attacker SET last_detected = ? WHERE ip = ?",
                (now, ip),
            )
        else:
            conn.execute(
                "INSERT INTO attacker (ip, initial_detection, last_detected, country, is_blocked) VALUES (?, ?, ?, ?, ?)",
                (ip, now, now, country, "not blocked"),
            )


def get_attackers() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM attacker ORDER BY last_detected DESC"
        ).fetchall()
        return [dict(row) for row in rows]


def get_attacker(ip: str) -> dict | None:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM attacker WHERE ip = ?", (ip,)).fetchone()
        return dict(row) if row else None


# ---------------------------------------------------------------------------
# BlockList table
# ---------------------------------------------------------------------------
def add_block(ip: str, blocked_by: str = None, expiration_date: str = None) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO blocklist (ip, block_date, blocked_by, expiration_date, is_active) VALUES (?, ?, ?, ?, ?)",
            (ip, now, blocked_by, expiration_date, "Block_active"),
        )
        conn.execute(
            "UPDATE attacker SET is_blocked = ? WHERE ip = ?",
            ("Blocked", ip),
        )
        row = conn.execute(
            "SELECT * FROM blocklist WHERE ip = ? ORDER BY block_id DESC LIMIT 1", (ip,)
        ).fetchone()
        return dict(row)


def remove_block(ip: str):
    with get_connection() as conn:
        conn.execute(
            "UPDATE blocklist SET is_active = ? WHERE ip = ? AND is_active = ?",
            ("Inactive", ip, "Block_active"),
        )
        conn.execute(
            "UPDATE attacker SET is_blocked = ? WHERE ip = ?",
            ("not blocked", ip),
        )


def get_blocklist() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM blocklist ORDER BY block_date DESC"
        ).fetchall()
        return [dict(row) for row in rows]


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
