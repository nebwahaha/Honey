import { useState, useEffect } from 'react'
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

  return (
    <div>
      <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        IP Blocking
      </h1>

      {message && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            borderRadius: 6,
            background: message.error ? '#2d1b1b' : '#1b2d1b',
            color: message.error ? '#f85149' : '#3fb950',
            fontSize: 13,
          }}
        >
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            min={1}
            value={thresholdInput}
            onChange={(e) => setThresholdInput(e.target.value)}
            style={{
              width: 80,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #1e2a3a',
              background: '#111521',
              color: '#ffffff',
              fontSize: 14,
              textAlign: 'center',
            }}
          />
          <button
            onClick={saveThreshold}
            disabled={savingThreshold || parseInt(thresholdInput, 10) === threshold}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: savingThreshold ? 'wait' : 'pointer',
              color: '#ffffff',
              background: savingThreshold || parseInt(thresholdInput, 10) === threshold ? '#333' : '#2563eb',
            }}
          >
            {savingThreshold ? '...' : 'Save'}
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
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
        )}
      </div>
    </div>
  )
}

export default Blocking
