import sqlite3
import os
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone

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
                protocol VARCHAR(20),
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

        # Migration: add protocol column if missing
        cols = [row[1] for row in conn.execute("PRAGMA table_info(attacker_session)").fetchall()]
        if "protocol" not in cols:
            conn.execute("ALTER TABLE attacker_session ADD COLUMN protocol VARCHAR(20)")


def insert_session(data: dict):
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO attacker_session (ip, session_duration, event_type, username_attempt, password_attempt, command_used, protocol, timestamp)
               VALUES (:ip, :session_duration, :event_type, :username_attempt, :password_attempt, :command_used, :protocol, :timestamp)""",
            {
                "ip": data["ip"],
                "session_duration": data.get("session_duration", datetime.now(timezone.utc).isoformat()),
                "event_type": data.get("event_type", ""),
                "username_attempt": data.get("username_attempt"),
                "password_attempt": data.get("password_attempt"),
                "command_used": data.get("command_used"),
                "protocol": data.get("protocol"),
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


def _range_cutoff(time_range: str | None) -> str | None:
    """Return an ISO timestamp cutoff for the given range, or None for 'all'."""
    if not time_range or time_range == "all":
        return None
    now = datetime.now(timezone.utc)
    if time_range == "today":
        cutoff = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == "week":
        cutoff = now - timedelta(days=7)
    elif time_range == "month":
        cutoff = now - timedelta(days=30)
    elif time_range == "year":
        cutoff = now - timedelta(days=365)
    else:
        return None
    return cutoff.isoformat()


def get_stats(time_range: str | None = None) -> dict:
    cutoff = _range_cutoff(time_range)
    time_filter = "AND timestamp >= ?" if cutoff else ""
    time_params: tuple = (cutoff,) if cutoff else ()

    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM attacker_session WHERE 1=1 {time_filter}", time_params
        ).fetchone()[0]
        unique_ips = conn.execute(
            f"SELECT COUNT(DISTINCT ip) FROM attacker_session WHERE 1=1 {time_filter}", time_params
        ).fetchone()[0]
        blocked = conn.execute("SELECT COUNT(*) FROM attacker WHERE is_blocked = 'Blocked'").fetchone()[0]

        top_ips = conn.execute(
            f"SELECT ip, COUNT(*) as count FROM attacker_session WHERE 1=1 {time_filter} GROUP BY ip ORDER BY count DESC LIMIT 10",
            time_params,
        ).fetchall()

        top_usernames = conn.execute(
            f"SELECT username_attempt, COUNT(*) as count FROM attacker_session WHERE username_attempt IS NOT NULL {time_filter} "
            "GROUP BY username_attempt ORDER BY count DESC LIMIT 10",
            time_params,
        ).fetchall()

        top_passwords = conn.execute(
            f"SELECT password_attempt, COUNT(*) as count FROM attacker_session WHERE password_attempt IS NOT NULL {time_filter} "
            "GROUP BY password_attempt ORDER BY count DESC LIMIT 10",
            time_params,
        ).fetchall()

        protocol_counts = conn.execute(
            f"SELECT protocol, COUNT(*) as count FROM attacker_session WHERE protocol IS NOT NULL {time_filter} "
            "GROUP BY protocol ORDER BY count DESC",
            time_params,
        ).fetchall()

        # Histogram: hourly if <= 48 buckets, daily otherwise
        hour_count = conn.execute(
            f"SELECT COUNT(DISTINCT strftime('%Y-%m-%dT%H', timestamp)) "
            f"FROM attacker_session WHERE timestamp IS NOT NULL {time_filter}",
            time_params,
        ).fetchone()[0]

        if hour_count <= 48:
            bucket_fmt = '%Y-%m-%dT%H:00:00'
        else:
            bucket_fmt = '%Y-%m-%dT00:00:00'

        hourly_rows = conn.execute(
            f"SELECT strftime('{bucket_fmt}', timestamp) as hour, "
            f"COUNT(*) as events, COUNT(DISTINCT ip) as unique_ips "
            f"FROM attacker_session WHERE timestamp IS NOT NULL {time_filter} "
            "GROUP BY hour ORDER BY hour",
            time_params,
        ).fetchall()

        return {
            "total_attempts": total,
            "unique_ips": unique_ips,
            "blocked_ips": blocked,
            "top_ips": [dict(r) for r in top_ips],
            "top_usernames": [dict(r) for r in top_usernames],
            "top_passwords": [dict(r) for r in top_passwords],
            "protocol_counts": [dict(r) for r in protocol_counts],
            "hourly_histogram": [dict(r) for r in hourly_rows],
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


def get_attackers(time_range: str | None = None) -> list[dict]:
    cutoff = _range_cutoff(time_range)
    with get_connection() as conn:
        if cutoff:
            # Only return attackers that have sessions within the time range
            rows = conn.execute(
                "SELECT DISTINCT a.* FROM attacker a "
                "INNER JOIN attacker_session s ON a.ip = s.ip "
                "WHERE s.timestamp >= ? "
                "ORDER BY a.last_detected DESC",
                (cutoff,),
            ).fetchall()
        else:
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
        # Reactivate existing entry if one exists, otherwise insert new
        existing = conn.execute(
            "SELECT block_id FROM blocklist WHERE ip = ?", (ip,)
        ).fetchone()
        if existing:
            conn.execute(
                "UPDATE blocklist SET block_date = ?, blocked_by = ?, expiration_date = ?, is_active = ? WHERE ip = ?",
                (now, blocked_by, expiration_date, "Block_active", ip),
            )
        else:
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
    # Save baseline so they get fresh chances
    save_baseline(ip)


def get_blocklist() -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM blocklist ORDER BY block_date DESC"
        ).fetchall()
        return [dict(row) for row in rows]


# ---------------------------------------------------------------------------
# Auto-block settings (file-based, no extra DB table)
# ---------------------------------------------------------------------------
import json as _json

AUTOBLOCK_CONFIG = os.path.join(os.path.dirname(DB_PATH), "autoblock.json")

_AUTOBLOCK_DEFAULTS: dict = {"enabled": False, "threshold": 20, "block_duration": "never", "baselines": {}}


def _read_autoblock_file() -> dict:
    try:
        with open(AUTOBLOCK_CONFIG, "r") as f:
            return _json.load(f)
    except (FileNotFoundError, ValueError, KeyError):
        return dict(_AUTOBLOCK_DEFAULTS)


def _write_autoblock_file(data: dict):
    os.makedirs(os.path.dirname(AUTOBLOCK_CONFIG), exist_ok=True)
    with open(AUTOBLOCK_CONFIG, "w") as f:
        _json.dump(data, f)


VALID_DURATIONS = {"never", "1d", "1w", "1m"}


def get_autoblock_config() -> dict:
    data = _read_autoblock_file()
    return {
        "enabled": bool(data.get("enabled", False)),
        "threshold": int(data.get("threshold", 20)),
        "block_duration": data.get("block_duration", "never"),
    }


def set_autoblock_config(*, enabled: bool | None = None, threshold: int | None = None, block_duration: str | None = None) -> dict:
    data = _read_autoblock_file()
    if enabled is not None:
        data["enabled"] = enabled
    if threshold is not None:
        data["threshold"] = max(1, threshold)
    if block_duration is not None and block_duration in VALID_DURATIONS:
        data["block_duration"] = block_duration
    _write_autoblock_file(data)
    return {
        "enabled": data["enabled"],
        "threshold": data["threshold"],
        "block_duration": data.get("block_duration", "never"),
    }


def compute_expiration(block_duration: str) -> str | None:
    """Return an ISO expiration timestamp for the given duration, or None for 'never'."""
    if block_duration == "never":
        return None
    now = datetime.now(timezone.utc)
    if block_duration == "1d":
        exp = now + timedelta(days=1)
    elif block_duration == "1w":
        exp = now + timedelta(weeks=1)
    elif block_duration == "1m":
        exp = now + timedelta(days=30)
    else:
        return None
    return exp.isoformat()


def get_session_count(ip: str) -> int:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) FROM attacker_session WHERE ip = ?", (ip,)
        ).fetchone()
        return row[0]


def get_sessions_since_baseline(ip: str) -> int:
    """Sessions since last unblock (or all sessions if never unblocked)."""
    data = _read_autoblock_file()
    baseline = data.get("baselines", {}).get(ip, 0)
    return max(0, get_session_count(ip) - baseline)


def save_baseline(ip: str):
    """Save current session count as baseline so the IP gets fresh chances."""
    data = _read_autoblock_file()
    if "baselines" not in data:
        data["baselines"] = {}
    data["baselines"][ip] = get_session_count(ip)
    _write_autoblock_file(data)


def get_chances_left(ip: str) -> int:
    """How many sessions remain before auto-block triggers."""
    cfg = get_autoblock_config()
    since = get_sessions_since_baseline(ip)
    return max(0, cfg["threshold"] - since)


def get_unique_ips_paginated(limit: int = 50, offset: int = 0, time_range: str | None = None) -> dict:
    cutoff = _range_cutoff(time_range)
    time_filter = "WHERE timestamp >= ?" if cutoff else ""
    time_params: tuple = (cutoff,) if cutoff else ()
    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(DISTINCT ip) FROM attacker_session {time_filter}", time_params
        ).fetchone()[0]
        rows = conn.execute(
            f"SELECT ip, COUNT(*) as attack_count, MAX(timestamp) as last_seen "
            f"FROM attacker_session {time_filter} GROUP BY ip ORDER BY attack_count DESC LIMIT ? OFFSET ?",
            (*time_params, limit, offset),
        ).fetchall()
        return {"total": total, "data": [dict(r) for r in rows]}


def get_active_sessions(minutes: int = 30) -> list[dict]:
    """Return IPs with an open session: most recent connect is newer than most recent close."""
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT c.ip, c.last_connect AS last_seen
            FROM (
                SELECT ip, MAX(timestamp) AS last_connect
                FROM attacker_session
                WHERE event_type = 'cowrie.session.connect'
                  AND timestamp >= ?
                GROUP BY ip
            ) c
            LEFT JOIN (
                SELECT ip, MAX(timestamp) AS last_close
                FROM attacker_session
                WHERE event_type = 'cowrie.session.closed'
                GROUP BY ip
            ) cl ON c.ip = cl.ip
            WHERE cl.last_close IS NULL OR c.last_connect > cl.last_close
            ORDER BY c.last_connect DESC
            """,
            (cutoff,),
        ).fetchall()
        return [dict(r) for r in rows]


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at {DB_PATH}")
