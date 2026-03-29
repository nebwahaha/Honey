import { useState, useEffect, useRef } from 'react'
import type { BlockEntry } from '../types'

const SEEN_BLOCKS_KEY = 'hb_notif_seen_blocks'
const SEEN_ACTIVE_KEY = 'hb_notif_seen_active'

type Section = 'active' | 'system' | 'manual'

interface ActiveSession {
  ip: string
  last_seen: string
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5"
      style={{ transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function SectionHeader({
  label, count, badge, expanded, color, onClick,
}: {
  label: string
  count: number
  badge?: number
  expanded: boolean
  color: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 16px', cursor: 'pointer',
        background: hovered ? '#1c2540' : 'transparent',
        borderBottom: '1px solid #1e2a3a',
        transition: 'background 0.15s',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color, flexShrink: 0,
          boxShadow: `0 0 6px ${color}`,
        }} />
        <span style={{ color: '#c9d1d9', fontSize: 13, fontWeight: 600 }}>{label}</span>
        {badge !== undefined && badge > 0 && (
          <span style={{
            background: '#e74c3c', color: '#fff',
            borderRadius: 4, padding: '1px 6px',
            fontSize: 10, fontWeight: 700,
          }}>
            {badge > 99 ? '99+' : badge} new
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#6b7280', fontSize: 12 }}>{count}</span>
        <ChevronIcon expanded={expanded} />
      </div>
    </div>
  )
}

function NotificationBell() {
  const [blocklist, setBlocklist] = useState<BlockEntry[]>([])
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([])
  const [seenBlocks, setSeenBlocks] = useState<number>(() => {
    const stored = localStorage.getItem(SEEN_BLOCKS_KEY)
    return stored ? parseInt(stored, 10) : 0
  })
  const [seenActive, setSeenActive] = useState<number>(() => {
    const stored = localStorage.getItem(SEEN_ACTIVE_KEY)
    return stored ? parseInt(stored, 10) : 0
  })
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<Section | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const fetchData = async () => {
    try {
      const [blockedRes, activeRes] = await Promise.all([
        fetch('/api/blocked'),
        fetch('/api/active-sessions'),
      ])
      if (blockedRes.ok) {
        const data = await blockedRes.json()
        setBlocklist(data.data ?? [])
      }
      if (activeRes.ok) {
        const data = await activeRes.json()
        setActiveSessions(data ?? [])
      }
    } catch {
      // retry on next interval
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const autoBlocked = blocklist.filter(b => b.blocked_by === 'Auto')
  const manualBlocked = blocklist.filter(b => b.blocked_by !== 'Auto' && b.blocked_by !== null)

  const unseenBlocks = Math.max(0, blocklist.length - seenBlocks)
  const unseenActive = Math.max(0, activeSessions.length - seenActive)
  const totalBadge = unseenBlocks + unseenActive

  const handleOpen = () => {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) {
      const nb = blocklist.length
      const na = activeSessions.length
      setSeenBlocks(nb)
      setSeenActive(na)
      localStorage.setItem(SEEN_BLOCKS_KEY, String(nb))
      localStorage.setItem(SEEN_ACTIVE_KEY, String(na))
    }
  }

  const toggleSection = (s: Section) => setExpanded(e => e === s ? null : s)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative', width: 40, height: 40, borderRadius: 8,
          background: open ? '#2a3558' : '#1c2540',
          border: '1px solid #2a3558', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {totalBadge > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#e74c3c', color: '#fff',
            borderRadius: '50%', width: 18, height: 18,
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {totalBadge > 99 ? '99+' : totalBadge}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 380,
          background: '#151a28', border: '1px solid #2a3558',
          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          zIndex: 200, overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a3558' }}>
            <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 700 }}>Notifications</span>
          </div>

          {/* ── Active Connections ── */}
          <SectionHeader
            label="Active Connections"
            count={activeSessions.length}
            badge={unseenActive}
            expanded={expanded === 'active'}
            color="#3fb950"
            onClick={() => toggleSection('active')}
          />
          {expanded === 'active' && (
            <div style={{ maxHeight: 220, overflowY: 'auto', borderBottom: '1px solid #1e2a3a' }}>
              {activeSessions.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 13, padding: '12px 20px' }}>No active connections.</div>
              ) : (
                activeSessions.map((s, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 20px', borderBottom: '1px solid #1e2a3a',
                    background: '#111521',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3fb950', display: 'inline-block', boxShadow: '0 0 5px #3fb950' }} />
                      <span style={{ color: '#c9d1d9', fontSize: 13, fontFamily: "'JetBrains Mono', monospace" }}>{s.ip}</span>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: 11 }}>
                      {new Date(s.last_seen).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Blocked by System ── */}
          <SectionHeader
            label="Blocked by System"
            count={autoBlocked.length}
            expanded={expanded === 'system'}
            color="#e74c3c"
            onClick={() => toggleSection('system')}
          />
          {expanded === 'system' && (
            <div style={{ maxHeight: 220, overflowY: 'auto', borderBottom: '1px solid #1e2a3a' }}>
              {autoBlocked.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 13, padding: '12px 20px' }}>No system blocks yet.</div>
              ) : (
                [...autoBlocked].reverse().map((b) => (
                  <div key={b.block_id} style={{
                    padding: '9px 20px', borderBottom: '1px solid #1e2a3a',
                    background: '#111521',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#c9d1d9', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{b.ip}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                        background: b.is_active === 'Block_active' ? '#2d1b1b' : '#1a1f2e',
                        color: b.is_active === 'Block_active' ? '#f85149' : '#6b7280',
                      }}>
                        {b.is_active === 'Block_active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: 11 }}>{new Date(b.block_date).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Blocked by User ── */}
          <SectionHeader
            label="Blocked by User"
            count={manualBlocked.length}
            expanded={expanded === 'manual'}
            color="#7b8cde"
            onClick={() => toggleSection('manual')}
          />
          {expanded === 'manual' && (
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {manualBlocked.length === 0 ? (
                <div style={{ color: '#6b7280', fontSize: 13, padding: '12px 20px' }}>No manual blocks yet.</div>
              ) : (
                [...manualBlocked].reverse().map((b) => (
                  <div key={b.block_id} style={{
                    padding: '9px 20px', borderBottom: '1px solid #1e2a3a',
                    background: '#111521',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#c9d1d9', fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{b.ip}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                        background: b.is_active === 'Block_active' ? '#2d1b1b' : '#1a1f2e',
                        color: b.is_active === 'Block_active' ? '#f85149' : '#6b7280',
                      }}>
                        {b.is_active === 'Block_active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <span style={{ color: '#6b7280', fontSize: 11 }}>{new Date(b.block_date).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationBell
