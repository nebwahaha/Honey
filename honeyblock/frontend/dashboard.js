// ---------------------------------------------------------------------------
// HoneyBlock Dashboard
// ---------------------------------------------------------------------------

const API = "";
const REFRESH_INTERVAL = 30_000;

// ── DOM refs ────────────────────────────────────────────────────────────────
const $statTotal   = document.getElementById("stat-total");
const $statUnique  = document.getElementById("stat-unique");
const $statBlocked = document.getElementById("stat-blocked");
const $stat24h     = document.getElementById("stat-24h");

const $attemptsBody  = document.getElementById("attempts-body");
const $attemptsCount = document.getElementById("attempts-count");

const $blockedBody  = document.getElementById("blocked-body");
const $blockedCount = document.getElementById("blocked-count");

const $cowrieStatus  = document.getElementById("cowrie-status");
const $toastContainer = document.getElementById("toast-container");

// ── Helpers ─────────────────────────────────────────────────────────────────

function showToast(message, type = "success") {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  $toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function escapeHtml(str) {
  if (str == null) return "--";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

function formatTimestamp(ts) {
  if (!ts) return "--";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return escapeHtml(ts);
  return d.toLocaleString();
}

function eventLabel(eventType) {
  if (!eventType) return "--";
  const short = eventType.replace("cowrie.", "");
  let cls = "event-connect";
  if (eventType.includes("failed"))  cls = "event-failed";
  if (eventType.includes("success")) cls = "event-success";
  if (eventType.includes("command")) cls = "event-command";
  return `<span class="event-label ${cls}">${escapeHtml(short)}</span>`;
}

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || `${res.status} ${res.statusText}`);
  }
  return data;
}

// ── Data fetchers ───────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const s = await apiFetch("/api/stats");
    $statTotal.textContent   = s.total_attempts.toLocaleString();
    $statUnique.textContent  = s.unique_ips.toLocaleString();
    $statBlocked.textContent = s.blocked_ips.toLocaleString();
    $stat24h.textContent     = s.attempts_last_24h.toLocaleString();
  } catch (err) {
    console.error("Failed to load stats:", err);
  }
}

async function loadAttempts() {
  try {
    const res = await apiFetch("/api/attempts?limit=50");
    const rows = res.data;
    $attemptsCount.textContent = rows.length;

    if (rows.length === 0) {
      $attemptsBody.innerHTML = '<tr><td colspan="7" class="empty-state">No attempts recorded yet.</td></tr>';
      return;
    }

    $attemptsBody.innerHTML = rows.map((r) => `
      <tr>
        <td>${formatTimestamp(r.timestamp)}</td>
        <td>${escapeHtml(r.ip)}</td>
        <td>${escapeHtml(r.country)}</td>
        <td>${escapeHtml(r.username)}</td>
        <td>${escapeHtml(r.password)}</td>
        <td>${eventLabel(r.event_type)}</td>
        <td><button class="btn btn-block" onclick="blockIP('${escapeHtml(r.ip)}')">Block</button></td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load attempts:", err);
    $attemptsBody.innerHTML = `<tr><td colspan="7" class="empty-state">Error loading data: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadBlocked() {
  try {
    const res = await apiFetch("/api/blocked");
    const rows = res.data;
    $blockedCount.textContent = rows.length;

    if (rows.length === 0) {
      $blockedBody.innerHTML = '<tr><td colspan="3" class="empty-state">No IPs currently blocked.</td></tr>';
      return;
    }

    $blockedBody.innerHTML = rows.map((r) => `
      <tr>
        <td>${escapeHtml(r.ip)}</td>
        <td>${formatTimestamp(r.blocked_at)}</td>
        <td><button class="btn btn-unblock" onclick="unblockIP('${escapeHtml(r.ip)}')">Unblock</button></td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("Failed to load blocked IPs:", err);
    $blockedBody.innerHTML = `<tr><td colspan="3" class="empty-state">Error loading data: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function checkCowrieStatus() {
  try {
    const res = await apiFetch("/api/health");
    if (res.status === "ok") {
      $cowrieStatus.textContent = "Cowrie Online";
      $cowrieStatus.className = "status-badge status-online";
    }
  } catch {
    $cowrieStatus.textContent = "Cowrie Offline";
    $cowrieStatus.className = "status-badge status-offline";
  }
}

// ── Actions ─────────────────────────────────────────────────────────────────

async function blockIP(ip) {
  try {
    const data = await apiPost("/api/block", { ip });
    showToast(data.message || `Blocked ${ip}`);
    refreshAll();
  } catch (err) {
    showToast(err.message || "Failed to block IP", "error");
  }
}

async function unblockIP(ip) {
  try {
    const data = await apiPost("/api/unblock", { ip });
    showToast(data.message || `Unblocked ${ip}`);
    refreshAll();
  } catch (err) {
    showToast(err.message || "Failed to unblock IP", "error");
  }
}

// Expose to inline onclick handlers
window.blockIP = blockIP;
window.unblockIP = unblockIP;

// ── Refresh loop ────────────────────────────────────────────────────────────

function refreshAll() {
  loadStats();
  loadAttempts();
  loadBlocked();
  checkCowrieStatus();
}

// Initial load
refreshAll();

// Auto-refresh
setInterval(refreshAll, REFRESH_INTERVAL);
