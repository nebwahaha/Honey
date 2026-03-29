import { useState, useEffect, useRef } from 'react'
import type { Attacker, BlockEntry } from '../types'

function Blocking() {
  const [attackers, setAttackers] = useState<Attacker[]>([])
  const [blocklist, setBlocklist] = useState<BlockEntry[]>([])
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [autoBlockEnabled, setAutoBlockEnabled] = useState(false)
  const [threshold, setThreshold] = useState(20)
  const [thresholdInput, setThresholdInput] = useState('20')
  const [savingThreshold, setSavingThreshold] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [seenCount, setSeenCount] = useState(0)
  const notifRef = useRef<HTMLDivElement>(null)

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchData = async () => {
    try {
      const [attackersRes, blockedRes, autoBlockRes] = await Promise.all([
        fetch('/api/attackers'),
        fetch('/api/blocked'),
        fetch('/api/autoblock/status'),
      ])
      if (attackersRes.ok) setAttackers(await attackersRes.json())
      if (blockedRes.ok) {
        const data = await blockedRes.json()
        setBlocklist(data.data ?? [])
      }
      if (autoBlockRes.ok) {
        const data = await autoBlockRes.json()
        setAutoBlockEnabled(data.enabled)
        setThreshold(data.threshold)
        setThresholdInput(String(data.threshold))
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

  const blockIp = async (ip: string) => {
    setActionInProgress(ip)
    setMessage(null)
    try {
      const res = await fetch('/api/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: `Blocked ${ip}`, error: false })
        await fetchData()
      } else {
        setMessage({ text: data.message ?? 'Failed to block', error: true })
      }
    } catch {
      setMessage({ text: 'Network error', error: true })
    } finally {
      setActionInProgress(null)
    }
  }

  const unblockIp = async (ip: string) => {
    setActionInProgress(ip)
    setMessage(null)
    try {
      const res = await fetch('/api/unblock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ text: `Unblocked ${ip}`, error: false })
        await fetchData()
      } else {
        setMessage({ text: data.message ?? 'Failed to unblock', error: true })
      }
    } catch {
      setMessage({ text: 'Network error', error: true })
    } finally {
      setActionInProgress(null)
    }
  }

  const saveThreshold = async () => {
    const val = parseInt(thresholdInput, 10)
    if (isNaN(val) || val < 1) {
      setMessage({ text: 'Threshold must be a number greater than 0', error: true })
      return
    }
    setSavingThreshold(true)
    setMessage(null)
    try {
      const res = await fetch('/api/autoblock/threshold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: val }),
      })
      const data = await res.json()
      if (res.ok) {
        setThreshold(data.threshold)
        setThresholdInput(String(data.threshold))
        setMessage({ text: `Session limit updated to ${data.threshold}`, error: false })
      } else {
        setMessage({ text: data.message ?? 'Failed to update threshold', error: true })
      }
    } catch {
      setMessage({ text: 'Network error', error: true })
    } finally {
      setSavingThreshold(false)
    }
  }

  const thStyle: React.CSSProperties = {
    background: '#111521',
    color: '#6b7280',
    textAlign: 'left',
    padding: 12,
    fontSize: 13,
    fontWeight: 600,
  }

  const tdStyle: React.CSSProperties = {
    padding: 12,
    fontSize: 13,
  }

  const unseenCount = Math.max(0, blocklist.length - seenCount)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>IP Blocking</h1>

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen(o => !o); setSeenCount(blocklist.length) }}
            style={{
              position: 'relative', width: 40, height: 40, borderRadius: 8,
              background: notifOpen ? '#2a3558' : '#1c2540',
              border: '1px solid #2a3558', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unseenCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: '#e74c3c', color: '#fff',
                borderRadius: '50%', width: 18, height: 18,
                fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unseenCount > 99 ? '99+' : unseenCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 360, maxHeight: 420,
              background: '#151a28', border: '1px solid #2a3558',
              borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              zIndex: 200, display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e2a3a' }}>
                <span style={{ color: '#ffffff', fontSize: 14, fontWeight: 600 }}>Block History</span>
              </div>
              <div style={{ overflowY: 'auto', flex: 1 }}>
                {blocklist.length === 0 ? (
                  <div style={{ color: '#6b7280', fontSize: 13, padding: 20, textAlign: 'center' }}>No blocks yet.</div>
                ) : (
                  [...blocklist].reverse().map((b) => (
                    <div key={b.block_id} style={{
                      padding: '10px 16px', borderBottom: '1px solid #1e2a3a',
                      display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#c9d1d9', fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{b.ip}</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                          background: b.is_active === 'Block_active' ? '#2d1b1b' : '#1a1f2e',
                          color: b.is_active === 'Block_active' ? '#f85149' : '#6b7280',
                        }}>
                          {b.is_active === 'Block_active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 11 }}>
                        {b.blocked_by === 'system' ? 'Auto-blocked by system' : 'Manually blocked'}
                        {' · '}{new Date(b.block_date).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {message && message.error && (
        <div style={{
          padding: '10px 16px', marginBottom: 16, borderRadius: 6,
          background: '#2d1b1b', color: '#f85149', fontSize: 13,
        }}>
          {message.text}
        </div>
      )}

      {/* Auto-block session limit */}
      <div
        style={{
          background: '#151a28',
          border: '1px solid #1e2a3a',
          borderRadius: 10,
          padding: 20,
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            Automatic Blocking — Session Limit
          </h3>
          <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
            Attackers are automatically blocked after reaching this number of sessions.
            {' '}
            <span style={{ color: autoBlockEnabled ? '#3fb950' : '#f85149', fontWeight: 600 }}>
              {autoBlockEnabled ? 'Auto-blocking is ON' : 'Auto-blocking is OFF'}
            </span>
            {!autoBlockEnabled && (
              <span style={{ color: '#6b7280' }}> — enable it in Configurations.</span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Stepper */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: '#111521', border: '1px solid #2a3558',
            borderRadius: 8, overflow: 'hidden',
          }}>
            <button
              onClick={() => setThresholdInput(v => String(Math.max(1, parseInt(v, 10) - 1)))}
              style={{
                width: 36, height: 36, background: 'transparent',
                border: 'none', color: '#9ca3af', fontSize: 18,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <span style={{
              minWidth: 40, textAlign: 'center',
              color: '#ffffff', fontSize: 15, fontWeight: 700,
              borderLeft: '1px solid #2a3558', borderRight: '1px solid #2a3558',
              padding: '0 8px', lineHeight: '36px',
            }}>
              {thresholdInput}
            </span>
            <button
              onClick={() => setThresholdInput(v => String(parseInt(v, 10) + 1))}
              style={{
                width: 36, height: 36, background: 'transparent',
                border: 'none', color: '#9ca3af', fontSize: 18,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
          </div>
          <button
            onClick={saveThreshold}
            disabled={savingThreshold || parseInt(thresholdInput, 10) === threshold}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 13,
              cursor: savingThreshold || parseInt(thresholdInput, 10) === threshold ? 'default' : 'pointer',
              color: '#ffffff',
              background: savingThreshold || parseInt(thresholdInput, 10) === threshold ? '#1e2a3a' : '#2563eb',
              transition: 'background 0.15s',
            }}
          >
            {savingThreshold ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Attacker list with block/unblock buttons */}
      <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20, marginBottom: 24 }}>
        <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          Detected Attackers
        </h3>

        {attackers.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 30 }}>
            No attackers detected yet.
          </div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: 400, borderRadius: 6, border: '1px solid #1e2a3a' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>IP Address</th>
                  <th style={thStyle}>Country</th>
                  <th style={thStyle}>First Detected</th>
                  <th style={thStyle}>Last Detected</th>
                  {autoBlockEnabled && <th style={thStyle}>Chances Left</th>}
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>
              <tbody>
                {attackers.map((a, i) => {
                  const isBlocked = a.is_blocked === 'Blocked'
                  return (
                    <tr
                      key={a.ip}
                      style={{
                        background: i % 2 === 0 ? '#131824' : '#111521',
                        borderBottom: '1px solid #1e2a3a',
                      }}
                    >
                      <td style={tdStyle}>{a.ip}</td>
                      <td style={tdStyle}>{a.country ?? '--'}</td>
                      <td style={tdStyle}>{a.initial_detection}</td>
                      <td style={tdStyle}>{a.last_detected}</td>
                      {autoBlockEnabled && (
                        <td style={{
                          ...tdStyle,
                          color: isBlocked ? '#6b7280' : a.chances_left != null && a.chances_left <= 3 ? '#f85149' : '#f59e0b',
                          fontWeight: 600,
                        }}>
                          {isBlocked ? '--' : a.chances_left ?? '--'}
                        </td>
                      )}
                      <td style={{ ...tdStyle, color: isBlocked ? '#f85149' : '#3fb950' }}>
                        {isBlocked ? 'Blocked' : 'Not blocked'}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => isBlocked ? unblockIp(a.ip) : blockIp(a.ip)}
                          disabled={actionInProgress === a.ip}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 5,
                            border: 'none',
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: actionInProgress === a.ip ? 'wait' : 'pointer',
                            color: '#ffffff',
                            background: isBlocked ? '#2e7d32' : '#d32f2f',
                          }}
                        >
                          {actionInProgress === a.ip ? '...' : isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Blocklist history */}
      <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20 }}>
        <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          Block History
        </h3>

        {blocklist.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: 30 }}>
            No blocks recorded yet.
          </div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: 400, borderRadius: 6, border: '1px solid #1e2a3a' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>IP Address</th>
                  <th style={thStyle}>Block Date</th>
                  <th style={thStyle}>Blocked By</th>
                  <th style={thStyle}>Expiration</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {blocklist.map((b, i) => (
                  <tr
                    key={b.block_id}
                    style={{
                      background: i % 2 === 0 ? '#131824' : '#111521',
                      borderBottom: '1px solid #1e2a3a',
                    }}
                  >
                    <td style={tdStyle}>{b.block_id}</td>
                    <td style={tdStyle}>{b.ip}</td>
                    <td style={tdStyle}>{b.block_date}</td>
                    <td style={tdStyle}>{b.blocked_by ?? '--'}</td>
                    <td style={tdStyle}>{b.expiration_date ?? 'Never'}</td>
                    <td style={{ ...tdStyle, color: b.is_active === 'Block_active' ? '#f85149' : '#6b7280' }}>
                      {b.is_active === 'Block_active' ? 'Active' : 'Inactive'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Blocking
