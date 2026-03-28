import json
import logging
import os
import signal
import sys
import time
import urllib.request
import urllib.error
from pathlib import Path

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from datetime import datetime, timezone

import db
import firewall

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
COWRIE_LOG = "/home/cowrie/cowrie/var/log/cowrie/cowrie.json"
STATE_FILE = "/opt/honeyblock/watcher.pos"
LOG_DIR = "/opt/honeyblock/logs"
LOG_FILE = os.path.join(LOG_DIR, "watcher.log")

WATCHED_EVENTS = {
    "cowrie.login.failed",
    "cowrie.login.success",
    "cowrie.command.input",
    "cowrie.session.connect",
    "cowrie.session.closed",
}

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
os.makedirs(LOG_DIR, exist_ok=True)

logger = logging.getLogger("honeyblock.watcher")
logger.setLevel(logging.DEBUG)

_file_handler = logging.FileHandler(LOG_FILE)
_file_handler.setFormatter(
    logging.Formatter("%(asctime)s  %(levelname)-8s  %(message)s")
)
logger.addHandler(_file_handler)

_stream_handler = logging.StreamHandler()
_stream_handler.setFormatter(
    logging.Formatter("%(asctime)s  %(levelname)-8s  %(message)s")
)
logger.addHandler(_stream_handler)

# ---------------------------------------------------------------------------
# Geolocation cache  (ip-api.com, free tier: 45 req/min)
# ---------------------------------------------------------------------------
_geo_cache: dict[str, dict] = {}

GEOIP_ENABLED = os.environ.get("HONEYBLOCK_GEOIP", "1") != "0"


def geolocate(ip: str) -> dict:
    if not GEOIP_ENABLED:
        return {"country": None, "city": None}

    if ip in _geo_cache:
        return _geo_cache[ip]

    try:
        url = f"http://ip-api.com/json/{ip}?fields=status,country,city"
        req = urllib.request.Request(url, headers={"User-Agent": "HoneyBlock/1.0"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        if data.get("status") == "success":
            result = {"country": data.get("country"), "city": data.get("city")}
        else:
            result = {"country": None, "city": None}
    except (urllib.error.URLError, OSError, json.JSONDecodeError, KeyError) as exc:
        logger.warning("Geolocation failed for %s: %s", ip, exc)
        result = {"country": None, "city": None}

    _geo_cache[ip] = result
    return result


# ---------------------------------------------------------------------------
# File‑position state (survives restarts)
# ---------------------------------------------------------------------------
def _read_position() -> int:
    try:
        return int(Path(STATE_FILE).read_text().strip())
    except (FileNotFoundError, ValueError):
        return 0


def _write_position(pos: int):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    Path(STATE_FILE).write_text(str(pos))


# ---------------------------------------------------------------------------
# Write auto-block event to Cowrie log so it appears in live feed
# ---------------------------------------------------------------------------
def _write_block_log(ip: str, sessions: int, threshold: int):
    entry = {
        "eventid": "honeyblock.ip.blocked",
        "src_ip": ip,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "message": f"Blocked by system — exceeded {threshold} session limit ({sessions} sessions)",
    }
    try:
        with open(COWRIE_LOG, "a") as fh:
            fh.write(json.dumps(entry) + "\n")
    except OSError as exc:
        logger.warning("Failed to write block log entry: %s", exc)


# ---------------------------------------------------------------------------
# Line parsing
# ---------------------------------------------------------------------------
def _parse_line(raw: str):
    try:
        entry = json.loads(raw)
    except json.JSONDecodeError:
        return

    event_id = entry.get("eventid", "")
    if event_id not in WATCHED_EVENTS:
        return

    ip = entry.get("src_ip")
    if not ip:
        return

    geo = geolocate(ip)

    # Cowrie provides 'duration' (in seconds) on session.closed events
    duration = entry.get("duration")
    if duration is not None:
        try:
            session_duration = str(round(float(duration), 2)) + "s"
        except (ValueError, TypeError):
            session_duration = str(duration)
    else:
        session_duration = entry.get("timestamp", datetime.now(timezone.utc).isoformat())

    # Detect protocol from Cowrie log fields
    proto_field = entry.get("protocol", "").lower()
    system_field = entry.get("system", "").lower()
    combined = proto_field + " " + system_field
    if "telnet" in combined:
        protocol = "Telnet"
    elif "sftp" in combined:
        protocol = "SFTP"
    else:
        protocol = "SSH"

    session = {
        "ip": ip,
        "session_duration": session_duration,
        "event_type": event_id,
        "username_attempt": entry.get("username"),
        "password_attempt": entry.get("password"),
        "command_used": entry.get("input"),
        "protocol": protocol,
        "timestamp": entry.get("timestamp", datetime.now(timezone.utc).isoformat()),
    }

    try:
        db.insert_session(session)
        db.upsert_attacker(ip, country=geo.get("country"))
        logger.info("Recorded %-30s from %s", event_id, ip)
    except Exception:
        logger.exception("Failed to insert attempt for %s", ip)
        return

    # Auto-block check
    try:
        cfg = db.get_autoblock_config()
        if cfg["enabled"]:
            attacker = db.get_attacker(ip)
            if attacker and attacker["is_blocked"] != "Blocked":
                since = db.get_sessions_since_baseline(ip)
                if since >= cfg["threshold"]:
                    fw = firewall.block_ip(ip)
                    if fw["success"]:
                        db.add_block(ip, blocked_by="Auto")
                        logger.info("Auto-blocked %s (sessions since baseline: %d, threshold: %d)", ip, since, cfg["threshold"])
                        _write_block_log(ip, since, cfg["threshold"])
                    else:
                        logger.warning("Auto-block firewall failed for %s: %s", ip, fw["message"])
    except Exception:
        logger.exception("Auto-block check failed for %s", ip)


# ---------------------------------------------------------------------------
# Process new lines since last read position
# ---------------------------------------------------------------------------
def process_new_lines():
    if not os.path.isfile(COWRIE_LOG):
        return

    pos = _read_position()
    file_size = os.path.getsize(COWRIE_LOG)

    # Log was rotated / truncated — start from the beginning
    if file_size < pos:
        logger.info("Log file truncated (size %d < pos %d), resetting", file_size, pos)
        pos = 0

    if file_size == pos:
        return

    with open(COWRIE_LOG, "r") as fh:
        fh.seek(pos)
        for line in fh:
            stripped = line.strip()
            if stripped:
                _parse_line(stripped)
        new_pos = fh.tell()

    _write_position(new_pos)
    logger.debug("Position updated: %d -> %d", pos, new_pos)


# ---------------------------------------------------------------------------
# Watchdog handler
# ---------------------------------------------------------------------------
class CowrieLogHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.is_directory:
            return
        if os.path.abspath(event.src_path) == os.path.abspath(COWRIE_LOG):
            process_new_lines()


# ---------------------------------------------------------------------------
# Daemon loop
# ---------------------------------------------------------------------------
_running = True


def _shutdown(signum, _frame):
    global _running
    logger.info("Received signal %d, shutting down…", signum)
    _running = False


def main():
    global _running

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    db.init_db()
    logger.info("Database initialized")

    # Catch up on any lines written while we were down
    process_new_lines()

    watch_dir = os.path.dirname(COWRIE_LOG)
    if not os.path.isdir(watch_dir):
        logger.error("Watch directory does not exist: %s", watch_dir)
        sys.exit(1)

    observer = Observer()
    observer.schedule(CowrieLogHandler(), path=watch_dir, recursive=False)
    observer.start()
    logger.info("Watching %s", COWRIE_LOG)

    try:
        while _running:
            time.sleep(1)
    finally:
        observer.stop()
        observer.join()
        logger.info("Watcher stopped")


if __name__ == "__main__":
    main()
