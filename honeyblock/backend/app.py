import json
import os
import subprocess
from collections import deque
from datetime import datetime, timedelta, timezone

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

import db
import firewall

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="/static")
CORS(app)


# ---------------------------------------------------------------------------
# Initialise database on startup
# ---------------------------------------------------------------------------
db.init_db()


# ---------------------------------------------------------------------------
# Frontend
# ---------------------------------------------------------------------------
@app.route("/")
@app.route("/blocking")
@app.route("/configurations")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


# ---------------------------------------------------------------------------
# Attempts
# ---------------------------------------------------------------------------
@app.route("/api/attempts")
def attempts():
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 50, type=int)

    page = max(1, page)
    limit = max(1, min(limit, 200))
    offset = (page - 1) * limit

    rows = db.get_sessions(limit=limit, offset=offset)
    return jsonify({"page": page, "limit": limit, "data": rows})


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
@app.route("/api/stats")
def stats():
    info = db.get_stats()

    cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    with db.get_connection() as conn:
        last_24h = conn.execute(
            "SELECT COUNT(*) FROM attacker_session WHERE timestamp >= ?", (cutoff,)
        ).fetchone()[0]

    info["attempts_last_24h"] = last_24h
    return jsonify(info)


# ---------------------------------------------------------------------------
# Attackers (grouped summary)
# ---------------------------------------------------------------------------
@app.route("/api/attackers")
def attackers():
    rows = db.get_attackers()
    cfg = db.get_autoblock_config()
    for row in rows:
        if cfg["enabled"]:
            row["chances_left"] = db.get_chances_left(row["ip"])
        else:
            row["chances_left"] = None
    return jsonify(rows)


# ---------------------------------------------------------------------------
# Blocked IPs
# ---------------------------------------------------------------------------
@app.route("/api/blocked")
def blocked():
    rows = db.get_blocklist()
    return jsonify({"data": rows})


@app.route("/api/block", methods=["POST"])
def block():
    body = request.get_json(silent=True)
    if not body or "ip" not in body:
        return jsonify({"success": False, "message": "Missing 'ip' in request body"}), 400

    ip = body["ip"]

    fw_result = firewall.block_ip(ip)
    if not fw_result["success"]:
        return jsonify(fw_result), 500

    db_record = db.add_block(ip)
    return jsonify({"success": True, "message": fw_result["message"], "blocked": db_record})


@app.route("/api/unblock", methods=["POST"])
def unblock():
    body = request.get_json(silent=True)
    if not body or "ip" not in body:
        return jsonify({"success": False, "message": "Missing 'ip' in request body"}), 400

    ip = body["ip"]

    fw_result = firewall.unblock_ip(ip)
    if not fw_result["success"]:
        return jsonify(fw_result), 500

    db.remove_block(ip)
    return jsonify({"success": True, "message": fw_result["message"]})


# ---------------------------------------------------------------------------
# Auto-blocking
# ---------------------------------------------------------------------------
@app.route("/api/autoblock/status")
def autoblock_status():
    cfg = db.get_autoblock_config()
    return jsonify(cfg)


@app.route("/api/autoblock/toggle", methods=["POST"])
def autoblock_toggle():
    cfg = db.get_autoblock_config()
    new_cfg = db.set_autoblock_config(enabled=not cfg["enabled"])
    return jsonify(new_cfg)


@app.route("/api/autoblock/threshold", methods=["POST"])
def autoblock_threshold():
    body = request.get_json(silent=True)
    if not body or "threshold" not in body:
        return jsonify({"success": False, "message": "Missing 'threshold' in request body"}), 400
    try:
        threshold = int(body["threshold"])
    except (ValueError, TypeError):
        return jsonify({"success": False, "message": "Threshold must be an integer"}), 400
    if threshold < 1:
        return jsonify({"success": False, "message": "Threshold must be at least 1"}), 400
    new_cfg = db.set_autoblock_config(threshold=threshold)
    return jsonify(new_cfg)


# ---------------------------------------------------------------------------
# Raw Cowrie logs
# ---------------------------------------------------------------------------
COWRIE_LOG = "/home/cowrie/cowrie/var/log/cowrie/cowrie.json"


@app.route("/api/logs")
def cowrie_logs():
    limit = request.args.get("limit", 100, type=int)
    limit = max(1, min(limit, 500))

    if not os.path.isfile(COWRIE_LOG):
        return jsonify({"data": []})

    # Read the last N lines efficiently
    lines: deque[dict] = deque(maxlen=limit)
    try:
        with open(COWRIE_LOG, "r") as fh:
            for raw in fh:
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    entry = json.loads(raw)
                    lines.append(entry)
                except json.JSONDecodeError:
                    continue
    except OSError:
        return jsonify({"data": []})

    # Enrich with country from attacker table
    result = list(reversed(lines))
    ip_countries: dict[str, str | None] = {}
    for entry in result:
        ip = entry.get("src_ip")
        if ip and ip not in ip_countries:
            attacker = db.get_attacker(ip)
            ip_countries[ip] = attacker["country"] if attacker else None
        if ip:
            entry["country"] = ip_countries.get(ip)

    return jsonify({"data": result})


# ---------------------------------------------------------------------------
# Cowrie service control
# ---------------------------------------------------------------------------
def _cowrie_is_active() -> bool:
    result = subprocess.run(
        ["systemctl", "is-active", "cowrie"],
        capture_output=True, text=True, timeout=10
    )
    return result.stdout.strip() == "active"


@app.route("/api/cowrie/status")
def cowrie_status():
    try:
        running = _cowrie_is_active()
        return jsonify({"running": running})
    except Exception as exc:
        return jsonify({"running": False, "error": str(exc)}), 500


@app.route("/api/cowrie/toggle", methods=["POST"])
def cowrie_toggle():
    try:
        running = _cowrie_is_active()
        action = "stop" if running else "start"
        result = subprocess.run(
            ["systemctl", action, "cowrie"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode != 0:
            return jsonify({
                "running": running,
                "message": f"Failed to {action} cowrie: {result.stderr.strip()}"
            }), 500

        new_state = _cowrie_is_active()
        return jsonify({
            "running": new_state,
            "message": f"Cowrie {'started' if new_state else 'stopped'} successfully"
        })
    except Exception as exc:
        return jsonify({"running": False, "message": str(exc)}), 500


# ---------------------------------------------------------------------------
# Auto-start on boot
# ---------------------------------------------------------------------------
AUTOSTART_SERVICES = ["cowrie", "honeyblock", "honeyblock-watcher"]


def _autostart_enabled() -> bool:
    result = subprocess.run(
        ["systemctl", "is-enabled", "honeyblock"],
        capture_output=True, text=True, timeout=10
    )
    return result.stdout.strip() == "enabled"


@app.route("/api/autostart/status")
def autostart_status():
    try:
        return jsonify({"enabled": _autostart_enabled()})
    except Exception as exc:
        return jsonify({"enabled": False, "error": str(exc)}), 500


@app.route("/api/autostart/toggle", methods=["POST"])
def autostart_toggle():
    try:
        enabled = _autostart_enabled()
        action = "disable" if enabled else "enable"
        for svc in AUTOSTART_SERVICES:
            result = subprocess.run(
                ["systemctl", action, svc],
                capture_output=True, text=True, timeout=10
            )
            if result.returncode != 0:
                return jsonify({
                    "enabled": enabled,
                    "message": f"Failed to {action} {svc}: {result.stderr.strip()}"
                }), 500

        new_state = _autostart_enabled()
        return jsonify({
            "enabled": new_state,
            "message": f"Auto-start {'enabled' if new_state else 'disabled'}"
        })
    except Exception as exc:
        return jsonify({"enabled": False, "message": str(exc)}), 500


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
