import { useState, useEffect, useRef } from 'react'
import type { Stats, Attacker } from '../types'
import { useTheme } from '../theme'
import StatCard from '../components/StatCard'
import TopAttackersChart from '../components/TopAttackersChart'
import AttackMap from '../components/AttackMap'
import LiveFeed from '../components/LiveFeed'
import CountryPieChart from '../components/CountryPieChart'
import StatCardPopup from '../components/StatCardPopup'
import ProtocolChart from '../components/ProtocolChart'
import EventsHistogram from '../components/EventsHistogram'
import NotificationBell from '../components/NotificationBell'
function Dashboard() {
  const { theme } = useTheme()
  const [stats, setStats] = useState<Stats | null>(null)
  const [attackers, setAttackers] = useState<Attacker[]>([])
  const [activeSessions, setActiveSessions] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [liveFeedOpen, setLiveFeedOpen] = useState(false)
  const [showProtocol, setShowProtocol] = useState(false)
  const [showHistogram, setShowHistogram] = useState(false)
  const [logCount, setLogCount] = useState(0)
  const [seenLogCount, setSeenLogCount] = useState(0)
  const [timeRange, setTimeRange] = useState<string>('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const [drawerHeight, setDrawerHeight] = useState(50) // percentage of vh
  const isDragging = useRef(false)

  const hasNewLogs = logCount > 0 && logCount > seenLogCount

  const handleLogsToggle = () => {
    if (!liveFeedOpen) {
      setSeenLogCount(logCount)
    }
    setLiveFeedOpen(!liveFeedOpen)
  }

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    const startY = e.clientY
    const startHeight = drawerHeight

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current) return
      const delta = startY - ev.clientY
      const newHeight = Math.min(90, Math.max(15, startHeight + (delta / window.innerHeight) * 100))
      setDrawerHeight(newHeight)
    }

    const onMouseUp = () => {
      isDragging.current = false
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Poll log count for badge
  useEffect(() => {
    const checkLogs = async () => {
      try {
        const res = await fetch('/api/logs?limit=1')
        if (res.ok) {
          const data = await res.json()
          const total = data.total ?? (data.data ?? []).length
          setLogCount(total)
        }
      } catch { /* ignore */ }
    }
    checkLogs()
    const interval = setInterval(checkLogs, 10_000)
    return () => clearInterval(interval)
  }, [])

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchData = async () => {
    const rangeParam = timeRange !== 'all' ? `?range=${timeRange}` : ''
    try {
      const [statsRes, attackersRes, activeRes] = await Promise.all([
        fetch(`/api/stats${rangeParam}`),
        fetch(`/api/attackers${rangeParam}`),
        fetch('/api/active-sessions'),
      ])

      if (statsRes.ok) {
        const data: Stats = await statsRes.json()
        setStats(data)
      }
      if (attackersRes.ok) {
        const data: Attacker[] = await attackersRes.json()
        setAttackers(data)
      }
      if (activeRes.ok) {
        const data = await activeRes.json()
        setActiveSessions((data ?? []).length)
      }

      setLastUpdated(new Date().toLocaleTimeString())
    } catch {
      // silently retry on next interval
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15_000)
    return () => clearInterval(interval)
  }, [timeRange])

  const cardStyle: React.CSSProperties = {
    background: theme.cardBg,
    border: `2px solid ${theme.cardBorder}`,
    borderRadius: 10,
    padding: 10,
  }

  const h3Style: React.CSSProperties = {
    color: theme.heading,
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 8,
  }

  const thStyle: React.CSSProperties = {
    padding: '4px 12px',
    color: theme.textTertiary,
    fontSize: 13,
    fontWeight: 600,
  }

  const tdStyle: React.CSSProperties = {
    padding: '4px 12px',
    color: theme.textPrimary,
    fontSize: 13,
  }

  if (loading) {
    return (
      <div style={{ color: theme.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 48px)', maxHeight: 1200 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: theme.textSecondary, fontSize: 13 }}>Last updated: {lastUpdated}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Time range filter */}
          <div ref={filterRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                height: 40,
                borderRadius: 8,
                background: theme.btnBg,
                border: `2px solid ${theme.btnBorder}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '0 12px',
                color: theme.btnText,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {{ all: 'All Time', today: 'Today', week: 'Week', month: 'Month', year: 'Year' }[timeRange]}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {filterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: theme.cardBg,
                  border: `2px solid ${theme.cardBorder}`,
                  borderRadius: 10,
                  padding: 4,
                  zIndex: 999,
                  minWidth: 140,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                }}
              >
                {(['all', 'today', 'week', 'month', 'year'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { setTimeRange(opt); setFilterOpen(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      border: 'none',
                      borderRadius: 6,
                      background: timeRange === opt ? theme.navActiveBg : 'transparent',
                      color: timeRange === opt ? theme.navActiveText : theme.textPrimary,
                      fontSize: 13,
                      fontWeight: timeRange === opt ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {{ all: 'All Time', today: 'Today', week: 'This Week', month: 'This Month', year: 'This Year' }[opt]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={fetchData}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: theme.btnBg,
              border: `2px solid ${theme.btnBorder}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.btnText,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
          {/* Live logs button */}
          <button
            onClick={handleLogsToggle}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: theme.btnBg,
              border: `2px solid ${theme.btnBorder}`,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.btnText,
              position: 'relative',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <line x1="6" y1="8" x2="18" y2="8" />
              <line x1="6" y1="12" x2="18" y2="12" />
              <line x1="6" y1="16" x2="12" y2="16" />
            </svg>
            {hasNewLogs && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: '#e74c3c',
                }}
              />
            )}
          </button>
          <NotificationBell />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 12 }}>
        <StatCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          }
          label="Total Attacks"
          value={stats?.total_attempts ?? 0}
        />
        <StatCardPopup
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          }
          label="Unique IPs"
          value={stats?.unique_ips ?? 0}
          fetchRows={async (page) => {
            const rangeQ = timeRange !== 'all' ? `&range=${timeRange}` : ''
            const res = await fetch(`/api/unique-ips?page=${page}&limit=50${rangeQ}`)
            const json = await res.json()
            return {
              rows: json.data.map((d: { ip: string; attack_count: number }) => ({
                primary: d.ip,
                secondary: `${d.attack_count} attacks`,
              })),
              hasMore: (page * 50) < json.total,
            }
          }}
        />
        <StatCardPopup
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          }
          label="Blocked IPs"
          value={stats?.blocked_ips ?? 0}
          fetchRows={async () => {
            const res = await fetch('/api/blocked')
            const json = await res.json()
            return {
              rows: (json.data ?? [])
                .filter((d: { is_active: string }) => d.is_active === 'Block_active')
                .map((d: { ip: string; block_date: string }) => ({
                  primary: d.ip,
                  secondary: new Date(d.block_date).toLocaleDateString(),
                })),
              hasMore: false,
            }
          }}
        />
        <StatCardPopup
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          }
          label="Active Sessions"
          value={activeSessions}
          fetchRows={async () => {
            const res = await fetch('/api/active-sessions')
            const json = await res.json()
            return {
              rows: (json ?? []).map((d: { ip: string; last_seen: string }) => ({
                primary: d.ip,
                secondary: new Date(d.last_seen).toLocaleTimeString(),
              })),
              hasMore: false,
            }
          }}
        />
      </div>

      {/* Charts row — toggleable */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 12, flex: 1, minHeight: 0 }}>
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ ...h3Style, marginBottom: 0 }}>
              {showProtocol ? 'Attack Protocols' : 'Top 5 Attacker IPs'}
            </h3>
            <button
              onClick={() => setShowProtocol(!showProtocol)}
              style={{
                background: theme.btnBg,
                border: `1px solid ${theme.btnBorder}`,
                borderRadius: 6,
                padding: '4px 10px',
                color: theme.btnText,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showProtocol ? 'Top 5 IPs' : 'Protocols'}
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {showProtocol
              ? <ProtocolChart data={stats?.protocol_counts ?? []} />
              : <TopAttackersChart data={stats?.top_ips?.slice(0, 5) ?? []} />
            }
          </div>
        </div>

        <div style={{ ...cardStyle, gridColumn: 'span 2', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ ...h3Style, marginBottom: 0 }}>
              {showHistogram ? 'Honeypot Events Histogram' : 'General Location of Attacks'}
            </h3>
            <button
              onClick={() => setShowHistogram(!showHistogram)}
              style={{
                background: theme.btnBg,
                border: `1px solid ${theme.btnBorder}`,
                borderRadius: 6,
                padding: '4px 10px',
                color: theme.btnText,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showHistogram ? 'Map' : 'Histogram'}
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            {showHistogram
              ? <EventsHistogram data={stats?.hourly_histogram ?? []} />
              : <AttackMap attackers={attackers} />
            }
          </div>
        </div>
      </div>

      {/* Top usernames, passwords & country pie chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, flex: 1, minHeight: 0 }}>
        <div style={{ ...cardStyle, overflow: 'auto' }}>
          <h3 style={h3Style}>Cowrie Top 10 Usernames</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Usernames</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.top_usernames ?? []).map((entry, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
                  <td style={tdStyle}>{entry.username_attempt}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{entry.count}</td>
                </tr>
              ))}
              {(stats?.top_usernames ?? []).length === 0 && (
                <tr><td colSpan={2} style={{ padding: '16px 12px', color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ ...cardStyle, overflow: 'auto' }}>
          <h3 style={h3Style}>Cowrie Top 10 Passwords</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
                <th style={{ ...thStyle, textAlign: 'left' }}>Top 10 Passwords</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.top_passwords ?? []).map((entry, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${theme.cardBorder}` }}>
                  <td style={tdStyle}>{entry.password_attempt}</td>
                  <td style={{ ...tdStyle, textAlign: 'right' }}>{entry.count}</td>
                </tr>
              ))}
              {(stats?.top_passwords ?? []).length === 0 && (
                <tr><td colSpan={2} style={{ padding: '16px 12px', color: theme.textSecondary, fontSize: 13, textAlign: 'center' }}>No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ ...cardStyle, overflow: 'auto' }}>
          <h3 style={h3Style}>Countries</h3>
          <CountryPieChart attackers={attackers} />
        </div>
      </div>

      {/* Sliding live feed drawer */}
      <div
        ref={drawerRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 200,
          right: 0,
          zIndex: 1000,
          transform: liveFeedOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: isDragging.current ? 'none' : 'transform 0.3s ease',
          height: `${drawerHeight}vh`,
          display: 'flex',
          flexDirection: 'column',
          background: theme.cardBg,
          borderTop: `3px solid ${theme.cardBorder}`,
          borderLeft: `3px solid ${theme.cardBorder}`,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
        }}
      >
        {/* Drag handle */}
        <div
          onMouseDown={handleDragStart}
          style={{
            cursor: 'ns-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 0',
            flexShrink: 0,
          }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 2, background: theme.textTertiary, opacity: 0.5 }} />
        </div>
        <div style={{ padding: '0 20px 0 20px' }}>
          <h3 style={{ ...h3Style, marginBottom: 8 }}>Live Feed for Logs</h3>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px 12px 20px' }}>
          <LiveFeed />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
