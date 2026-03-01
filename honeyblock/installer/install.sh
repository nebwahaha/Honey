#!/usr/bin/env bash
set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[*]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
fail()  { echo -e "${RED}[x]${NC} $1"; exit 1; }

# ── Root check ───────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  fail "This script must be run as root.  Use: sudo bash install.sh"
fi

# ── OS check (Ubuntu 20.04+) ────────────────────────────────────────────────
if [[ ! -f /etc/os-release ]]; then
  fail "/etc/os-release not found — cannot determine OS."
fi

source /etc/os-release

if [[ "$ID" != "ubuntu" ]]; then
  fail "Unsupported OS: $ID. This installer requires Ubuntu."
fi

MAJOR_VERSION="${VERSION_ID%%.*}"
if [[ "$MAJOR_VERSION" -lt 20 ]]; then
  fail "Ubuntu $VERSION_ID is too old. Version 20.04 or later is required."
fi

info "Detected Ubuntu $VERSION_ID — OK"

# ── Resolve source directory (where the honeyblock repo lives) ───────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Install system packages ─────────────────────────────────────────────────
info "Installing system packages..."
apt-get update -qq
apt-get install -y -qq \
  python3 python3-pip python3-venv \
  git iptables authbind libssl-dev libffi-dev

# ── Create cowrie user ───────────────────────────────────────────────────────
if id cowrie &>/dev/null; then
  info "User 'cowrie' already exists — skipping"
else
  info "Creating system user 'cowrie'..."
  adduser --system --group --home /home/cowrie --shell /bin/bash cowrie
fi

# ── Clone & set up Cowrie ────────────────────────────────────────────────────
COWRIE_DIR="/home/cowrie/cowrie"

if [[ -d "$COWRIE_DIR" ]]; then
  warn "Cowrie directory already exists at $COWRIE_DIR — pulling latest..."
  git -C "$COWRIE_DIR" pull --ff-only || true
else
  info "Cloning Cowrie honeypot..."
  git clone https://github.com/cowrie/cowrie.git "$COWRIE_DIR"
fi

info "Setting up Cowrie virtual environment..."
python3 -m venv "$COWRIE_DIR/cowrie-env"
"$COWRIE_DIR/cowrie-env/bin/pip" install --upgrade pip -q
"$COWRIE_DIR/cowrie-env/bin/pip" install -e "$COWRIE_DIR" -q

# ── Copy Cowrie config ───────────────────────────────────────────────────────
if [[ -f "$REPO_DIR/cowrie-config/cowrie.cfg" ]]; then
  info "Copying cowrie.cfg..."
  mkdir -p "$COWRIE_DIR/etc"
  cp "$REPO_DIR/cowrie-config/cowrie.cfg" "$COWRIE_DIR/etc/cowrie.cfg"
else
  warn "No cowrie.cfg found in cowrie-config/ — using Cowrie defaults"
fi

chown -R cowrie:cowrie /home/cowrie

# ── Set up HoneyBlock backend ───────────────────────────────────────────────
INSTALL_DIR="/opt/honeyblock"

info "Installing HoneyBlock to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"

cp -r "$REPO_DIR/backend"  "$INSTALL_DIR/backend"
cp -r "$REPO_DIR/frontend" "$INSTALL_DIR/frontend"

info "Creating Python virtual environment for HoneyBlock..."
python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip -q
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/backend/requirements.txt" -q

mkdir -p "$INSTALL_DIR/logs"

# ── Systemd: Cowrie service ─────────────────────────────────────────────────
info "Writing systemd service files..."

cat > /etc/systemd/system/cowrie.service << 'UNIT'
[Unit]
Description=Cowrie SSH/Telnet Honeypot
After=network.target

[Service]
Type=simple
User=cowrie
Group=cowrie
WorkingDirectory=/home/cowrie/cowrie
Environment=VIRTUAL_ENV=/home/cowrie/cowrie/cowrie-env
Environment=PATH=/home/cowrie/cowrie/cowrie-env/bin:/usr/local/bin:/usr/bin:/bin
Environment=COWRIE_STDOUT=yes
ExecStart=/home/cowrie/cowrie/cowrie-env/bin/cowrie start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

# ── Systemd: HoneyBlock service ─────────────────────────────────────────────
cat > /etc/systemd/system/honeyblock.service << 'UNIT'
[Unit]
Description=HoneyBlock Dashboard & Firewall API
After=network.target cowrie.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/honeyblock/backend
ExecStart=/opt/honeyblock/venv/bin/python3 /opt/honeyblock/backend/app.py
Restart=on-failure
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
UNIT

# ── Systemd: HoneyBlock Log Watcher service ─────────────────────────────────
cat > /etc/systemd/system/honeyblock-watcher.service << 'UNIT'
[Unit]
Description=HoneyBlock Cowrie Log Watcher
After=network.target cowrie.service
Requires=cowrie.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/honeyblock/backend
ExecStart=/opt/honeyblock/venv/bin/python3 /opt/honeyblock/backend/log_watcher.py
Restart=on-failure
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
UNIT

# ── Enable & start services ─────────────────────────────────────────────────
info "Enabling and starting services..."
systemctl daemon-reload
systemctl enable cowrie.service honeyblock.service honeyblock-watcher.service
systemctl start cowrie.service
systemctl start honeyblock.service
systemctl start honeyblock-watcher.service

# ── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  HoneyBlock installed successfully!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Dashboard:  ${YELLOW}http://localhost:5000${NC}"
echo ""
echo -e "  Services:"
echo -e "    cowrie              → systemctl status cowrie"
echo -e "    honeyblock          → systemctl status honeyblock"
echo -e "    honeyblock-watcher  → systemctl status honeyblock-watcher"
echo ""
echo -e "  Logs:"
echo -e "    Watcher  → tail -f /opt/honeyblock/logs/watcher.log"
echo -e "    API      → journalctl -u honeyblock -f"
echo -e "    Cowrie   → journalctl -u cowrie -f"
echo ""
