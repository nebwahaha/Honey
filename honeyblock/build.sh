#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DIST_DIR="$ROOT_DIR/honeyblock-dist"
OUTPUT="$ROOT_DIR/honeyblock-installer.run"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[*]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[x]${NC} $1"; exit 1; }

# ── Check / install makeself ────────────────────────────────────────────────
if ! command -v makeself &>/dev/null; then
  warn "makeself not found — installing..."
  sudo apt-get update -qq && sudo apt-get install -y -qq makeself
fi

# ── Build frontend ──────────────────────────────────────────────────────────
info "Building React frontend..."

cd "$ROOT_DIR/frontend"

if [[ ! -d node_modules ]]; then
  info "Running npm install..."
  npm install
fi

npm run build
info "Frontend built to backend/static/"

cd "$ROOT_DIR"

# ── Clean previous build ───────────────────────────────────────────────────
rm -rf "$DIST_DIR" "$OUTPUT"
mkdir -p "$DIST_DIR"

# ── Copy project files into staging directory ───────────────────────────────
info "Staging files..."
cp -r "$ROOT_DIR/installer" "$DIST_DIR/installer"

# Backend — exclude the .venv directory
rsync -a --exclude '.venv' "$ROOT_DIR/backend/" "$DIST_DIR/backend/"

# Frontend — exclude node_modules (not needed at runtime)
rsync -a --exclude 'node_modules' "$ROOT_DIR/frontend/" "$DIST_DIR/frontend/"

# Cowrie config — create the directory even if empty
mkdir -p "$DIST_DIR/cowrie-config"
if [[ -d "$ROOT_DIR/cowrie-config" ]] && ls "$ROOT_DIR/cowrie-config"/* &>/dev/null; then
  cp -r "$ROOT_DIR/cowrie-config/"* "$DIST_DIR/cowrie-config/"
else
  warn "cowrie-config/ is empty — installer will use Cowrie defaults"
fi

# ── Create setup entry point ────────────────────────────────────────────────
cat > "$DIST_DIR/setup.sh" << 'EOF'
#!/usr/bin/env bash
bash installer/install.sh
EOF
chmod +x "$DIST_DIR/setup.sh"

# ── Package with makeself ───────────────────────────────────────────────────
info "Packaging with makeself..."
makeself "$DIST_DIR" "$OUTPUT" "HoneyBlock Installer" ./setup.sh

# ── Summary ─────────────────────────────────────────────────────────────────
SIZE=$(du -h "$OUTPUT" | cut -f1)
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Build complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  Output:  ${YELLOW}$OUTPUT${NC}"
echo -e "  Size:    ${YELLOW}$SIZE${NC}"
echo ""
echo -e "  To install:  ${YELLOW}sudo bash honeyblock-installer.run${NC}"
echo ""
echo -e "  To upload as a GitHub release asset:"
echo -e "    gh release create v2.0.1 $OUTPUT --title \"HoneyBlock v2.0.1\""
echo ""

# ── Cleanup staging directory ───────────────────────────────────────────────
rm -rf "$DIST_DIR"
info "Staging directory cleaned up."
