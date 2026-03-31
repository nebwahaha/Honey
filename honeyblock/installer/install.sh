#!/usr/bin/env bash
set -euo pipefail

# ── Colours & symbols ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${CYAN}→${NC}"

# ── Single persistent progress bar ────────────────────────────────────────
TOTAL_STEPS=12
CURRENT_STEP=0
OUTPUT_LINES=0  # lines printed below the bar

draw_progress() {
  local width=50
  local filled=$(( CURRENT_STEP * width / TOTAL_STEPS ))
  local empty=$(( width - filled ))
  local pct=$(( CURRENT_STEP * 100 / TOTAL_STEPS ))

  local bar=""
  for ((i=0; i<filled; i++)); do bar+="█"; done
  for ((i=0; i<empty; i++)); do bar+="░"; done

  if [[ $OUTPUT_LINES -gt 0 ]]; then
    # Move up past all output lines to reach the bar
    printf '\033[%dA' "$OUTPUT_LINES"
  fi
  # Clear the bar line, redraw, move back down
  printf '\r\033[2K'
  printf "  ${DIM}[${NC}${GREEN}%s${NC}${DIM}]${NC} ${BOLD}%3d%%${NC}" "$bar" "$pct"
  if [[ $OUTPUT_LINES -gt 0 ]]; then
    printf '\033[%dB' "$OUTPUT_LINES"
  fi
  printf '\r'
}

# Wrappers that track how many lines appear below the bar
out() {
  echo -e "$1"
  OUTPUT_LINES=$((OUTPUT_LINES + 1))
}

step() {
  CURRENT_STEP=$((CURRENT_STEP + 1))
  draw_progress
  out "  ${ARROW} ${BOLD}$1${NC}"
}

info()    { out "    ${CHECK} $1"; }
warn()    { out "    ${YELLOW}!${NC} $1"; }
fail()    { echo -e "    ${CROSS} $1"; exit 1; }
detail()  { out "    ${DIM}$1${NC}"; }

# ── Banner ──────────────────────────────────────────────────────────────────
clear 2>/dev/null || true
echo ""
echo -e "  ${CYAN}${BOLD}▐█  █▌ █▀▀█ █▄ █ █▀▀ █▄█ █▀▀▄ █   █▀▀█ █▀▀ █▄▀${NC}"
echo -e "  ${CYAN}${BOLD}▐████▌ █  █ █ ▀█ █▀▀  █  █▀▀▄ █   █  █ █   █ █${NC}"
echo -e "  ${CYAN}${BOLD}▐█  █▌ █▄▄█ █  █ █▄▄  █  █▄▄▀ █▄▄ █▄▄█ █▄▄ █  █${NC}"
echo ""
echo -e "  ${DIM}SSH Honeypot & Firewall Manager — Installer v2.0${NC}"
echo -e "  ${DIM}──────────────────────────────────────────────────${NC}"
echo ""

# ── Root check ──────────────────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  fail "This installer must be run as root. Use: ${YELLOW}sudo bash install.sh${NC}"
fi

# ── Print the initial bar (0%) — this line stays fixed ────────────────────
draw_progress
echo ""

# ── Step 1: OS check ───────────────────────────────────────────────────────
step "Checking system requirements"

if [[ ! -f /etc/os-release ]]; then
  fail "Cannot determine OS — /etc/os-release not found"
fi

source /etc/os-release

if [[ "$ID" != "ubuntu" ]]; then
  fail "Unsupported OS: ${BOLD}$ID${NC}. This installer requires Ubuntu."
fi

MAJOR_VERSION="${VERSION_ID%%.*}"
if [[ "$MAJOR_VERSION" -lt 20 ]]; then
  fail "Ubuntu $VERSION_ID is too old. Version 20.04 or later is required."
fi

info "Ubuntu ${VERSION_ID} detected"

# ── Resolve source directory ───────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# ── Step 2: Install system packages ───────────────────────────────────────
step "Installing system packages"
detail "python3, git, iptables, authbind, libssl-dev, libffi-dev"

apt-get update -qq > /dev/null 2>&1
apt-get install -y -qq \
  python3 python3-pip python3-venv \
  git iptables authbind libssl-dev libffi-dev > /dev/null 2>&1

info "System packages installed"

# ── Step 3: Create cowrie user ─────────────────────────────────────────────
step "Setting up Cowrie user"

if id cowrie &>/dev/null; then
  info "User 'cowrie' already exists"
else
  adduser --system --group --home /home/cowrie --shell /bin/bash cowrie > /dev/null 2>&1
  info "Created system user 'cowrie'"
fi

# ── Step 4: Clone & set up Cowrie ──────────────────────────────────────────
step "Installing Cowrie honeypot"
COWRIE_DIR="/home/cowrie/cowrie"

if [[ -d "$COWRIE_DIR" ]]; then
  detail "Cowrie directory exists — pulling latest"
  git -C "$COWRIE_DIR" pull --ff-only > /dev/null 2>&1 || true
  info "Cowrie updated"
else
  detail "Cloning from github.com/cowrie/cowrie"
  git clone --quiet https://github.com/cowrie/cowrie.git "$COWRIE_DIR" > /dev/null 2>&1
  info "Cowrie cloned"
fi

# ── Step 5: Cowrie Python environment ──────────────────────────────────────
step "Setting up Cowrie environment"
detail "Creating virtual environment and installing dependencies"

python3 -m venv "$COWRIE_DIR/cowrie-env"
"$COWRIE_DIR/cowrie-env/bin/pip" install --upgrade pip -q > /dev/null 2>&1
"$COWRIE_DIR/cowrie-env/bin/pip" install -e "$COWRIE_DIR" -q > /dev/null 2>&1

info "Cowrie environment ready"

# ── Step 6: Copy Cowrie config ─────────────────────────────────────────────
step "Configuring Cowrie"

if [[ -f "$REPO_DIR/cowrie-config/cowrie.cfg" ]]; then
  mkdir -p "$COWRIE_DIR/etc"
  cp "$REPO_DIR/cowrie-config/cowrie.cfg" "$COWRIE_DIR/etc/cowrie.cfg"
  info "Custom cowrie.cfg applied"
else
  warn "No cowrie.cfg found — using Cowrie defaults"
fi

chown -R cowrie:cowrie /home/cowrie

# ── Step 7: Install HoneyBlock backend ─────────────────────────────────────
step "Installing HoneyBlock"
INSTALL_DIR="/opt/honeyblock"

detail "Deploying to ${INSTALL_DIR}"

mkdir -p "$INSTALL_DIR"
rm -rf "$INSTALL_DIR/backend" "$INSTALL_DIR/frontend"
cp -r "$REPO_DIR/backend"  "$INSTALL_DIR/backend"
cp -r "$REPO_DIR/frontend" "$INSTALL_DIR/frontend"

info "Application files deployed"

# ── Step 8: HoneyBlock Python environment ──────────────────────────────────
step "Setting up HoneyBlock environment"
detail "Creating virtual environment and installing dependencies"

python3 -m venv "$INSTALL_DIR/venv"
"$INSTALL_DIR/venv/bin/pip" install --upgrade pip -q > /dev/null 2>&1
"$INSTALL_DIR/venv/bin/pip" install -r "$INSTALL_DIR/backend/requirements.txt" -q > /dev/null 2>&1

mkdir -p "$INSTALL_DIR/logs"

info "HoneyBlock environment ready"

# ── Step 9: Systemd services ──────────────────────────────────────────────
step "Creating systemd services"

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

info "cowrie.service"
info "honeyblock.service"
info "honeyblock-watcher.service"

# ── Step 10: Control script ───────────────────────────────────────────────
step "Creating control script"

cat > "$INSTALL_DIR/honeyblock-ctl.sh" << 'CTL'
#!/usr/bin/env bash
# HoneyBlock control script — toggles all services on/off

SERVICES="cowrie honeyblock honeyblock-watcher"

is_running() {
  systemctl is-active --quiet honeyblock
}

notify() {
  # Try desktop notification, fall back silently
  if command -v notify-send &>/dev/null && [ -n "${SUDO_USER:-}" ]; then
    sudo -u "$SUDO_USER" DISPLAY=:0 notify-send "HoneyBlock" "$1" 2>/dev/null || true
  fi
  echo "$1"
}

if is_running; then
  echo "Stopping HoneyBlock..."
  systemctl stop $SERVICES
  notify "HoneyBlock stopped."
else
  echo "Starting HoneyBlock..."
  systemctl start $SERVICES
  notify "HoneyBlock started. Dashboard: http://localhost:5000"
fi
CTL

chmod +x "$INSTALL_DIR/honeyblock-ctl.sh"

info "honeyblock-ctl.sh created"

# ── Step 11: Polkit & desktop shortcut ────────────────────────────────────
step "Setting up desktop integration"

cat > /usr/share/polkit-1/actions/com.honeyblock.ctl.policy << 'POLKIT'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE policyconfig PUBLIC
 "-//freedesktop//DTD PolicyKit Policy Configuration 1.0//EN"
 "http://www.freedesktop.org/standards/PolicyKit/1/policyconfig.dtd">
<policyconfig>
  <action id="com.honeyblock.ctl">
    <message>Authentication is required to start/stop HoneyBlock</message>
    <defaults>
      <allow_any>auth_admin</allow_any>
      <allow_inactive>auth_admin</allow_inactive>
      <allow_active>auth_admin</allow_active>
    </defaults>
    <annotate key="org.freedesktop.policykit.exec.path">/opt/honeyblock/honeyblock-ctl.sh</annotate>
    <annotate key="org.freedesktop.policykit.exec.allow_gui">true</annotate>
  </action>
</policyconfig>
POLKIT

info "Polkit policy installed"

REAL_USER="${SUDO_USER:-$USER}"
REAL_HOME=$(eval echo "~$REAL_USER")
DESKTOP_DIR="$REAL_HOME/Desktop"

if [[ -d "$DESKTOP_DIR" ]]; then
  cat > "$DESKTOP_DIR/HoneyBlock.desktop" << DESK
[Desktop Entry]
Version=1.0
Type=Application
Name=HoneyBlock
Comment=Start or Stop HoneyBlock honeypot
Exec=bash -c 'sudo /opt/honeyblock/honeyblock-ctl.sh; echo; echo "Press Enter to close..."; read'
Icon=security-high
Terminal=true
Categories=Network;Security;
DESK

  chown "$REAL_USER:$REAL_USER" "$DESKTOP_DIR/HoneyBlock.desktop"
  chmod +x "$DESKTOP_DIR/HoneyBlock.desktop"

  if command -v gio &>/dev/null; then
    sudo -u "$REAL_USER" gio set "$DESKTOP_DIR/HoneyBlock.desktop" metadata::trusted true 2>/dev/null || true
  fi

  info "Desktop shortcut created"
else
  warn "Desktop directory not found — shortcut skipped"
fi

# ── Step 12: Start services ──────────────────────────────────────────────
step "Starting services"

systemctl daemon-reload
detail "Starting cowrie..."
systemctl start cowrie.service
detail "Starting honeyblock..."
systemctl start honeyblock.service
detail "Starting honeyblock-watcher..."
systemctl start honeyblock-watcher.service

info "All services running"

# ── Final bar at 100% ────────────────────────────────────────────────────
draw_progress

# ── Success banner ──────────────────────────────────────────────────────────
echo ""
echo ""
echo -e "  ${GREEN}${BOLD}┌──────────────────────────────────────────────────┐${NC}"
echo -e "  ${GREEN}${BOLD}│  ✓  H O N E Y B L O C K   I N S T A L L E D     │${NC}"
echo -e "  ${GREEN}${BOLD}└──────────────────────────────────────────────────┘${NC}"
echo ""

# Grab local IP for convenience
LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
DASHBOARD_URL="http://localhost:5000"
NETWORK_URL=""
if [[ -n "$LOCAL_IP" ]]; then
  NETWORK_URL="http://${LOCAL_IP}:5000"
fi

echo -e "  ${BOLD}${CYAN}DASHBOARD${NC}"
echo -e "  ${DIM}├${NC} Local     ${ARROW} ${YELLOW}${BOLD}${DASHBOARD_URL}${NC}"
if [[ -n "$NETWORK_URL" ]]; then
echo -e "  ${DIM}└${NC} Network   ${ARROW} ${YELLOW}${BOLD}${NETWORK_URL}${NC}"
fi
echo ""
echo -e "  ${BOLD}${CYAN}SERVICES${NC}"
echo -e "  ${DIM}├${NC} cowrie              ${CHECK} running"
echo -e "  ${DIM}├${NC} honeyblock          ${CHECK} running"
echo -e "  ${DIM}└${NC} honeyblock-watcher  ${CHECK} running"
echo ""
echo -e "  ${BOLD}${CYAN}QUICK REFERENCE${NC}"
echo -e "  ${DIM}├${NC} Toggle on/off   ${ARROW} ${YELLOW}sudo /opt/honeyblock/honeyblock-ctl.sh${NC}"
echo -e "  ${DIM}├${NC} Watcher logs    ${ARROW} ${DIM}tail -f /opt/honeyblock/logs/watcher.log${NC}"
echo -e "  ${DIM}├${NC} API logs        ${ARROW} ${DIM}journalctl -u honeyblock -f${NC}"
echo -e "  ${DIM}└${NC} Cowrie logs     ${ARROW} ${DIM}journalctl -u cowrie -f${NC}"
echo ""
echo -e "  ${DIM}──────────────────────────────────────────────────${NC}"
echo -e "  ${DIM}Services do NOT auto-start on boot.${NC}"
echo -e "  ${DIM}Use the desktop shortcut or the control script above.${NC}"
echo ""
