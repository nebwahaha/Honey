import os
import subprocess
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

    rows = db.get_attempts(limit=limit, offset=offset)
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
            "SELECT COUNT(*) FROM attempts WHERE timestamp >= ?", (cutoff,)
        ).fetchone()[0]

    info["attempts_last_24h"] = last_24h
    return jsonify(info)


# ---------------------------------------------------------------------------
# Attackers (grouped summary)
# ---------------------------------------------------------------------------
@app.route("/api/attackers")
def attackers():
    with db.get_connection() as conn:
        rows = conn.execute(
            """SELECT ip,
                      COUNT(*)        AS attempt_count,
                      country,
                      city,
                      MIN(timestamp)  AS first_seen,
                      MAX(timestamp)  AS last_seen
               FROM attempts
               GROUP BY ip
               ORDER BY attempt_count DESC"""
        ).fetchall()
    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------------------------
# Blocked IPs
# ---------------------------------------------------------------------------
@app.route("/api/blocked")
def blocked():
    rows = db.get_blocked_ips()
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

    db_record = db.add_blocked_ip(ip)
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

    db.remove_blocked_ip(ip)
    return jsonify({"success": True, "message": fw_result["message"]})


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
# Run
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
