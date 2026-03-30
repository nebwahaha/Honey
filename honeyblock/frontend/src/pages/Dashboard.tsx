import { useState, useEffect } from 'react'
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

  const fetchData = async () => {
    try {
      const [statsRes, attackersRes, activeRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/attackers'),
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
  }, [])

  const cardStyle: React.CSSProperties = {
    background: theme.cardBg,
    border: `2px solid ${theme.cardBorder}`,
    borderRadius: 10,
    padding: 20,
  }

  const h3Style: React.CSSProperties = {
    color: theme.heading,
    fontSize: 15,
    fontWeight: 700,
    marginBottom: 16,
  }

  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    color: theme.textTertiary,
    fontSize: 13,
    fontWeight: 600,
  }

  const tdStyle: React.CSSProperties = {
    padding: '8px 12px',
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
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: theme.textSecondary, fontSize: 13 }}>Last updated: {lastUpdated}</span>
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
          <NotificationBell />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
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
            const res = await fetch(`/api/unique-ips?page=${page}&limit=50`)
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

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={h3Style}>Top 5 Attacker IPs</h3>
          <TopAttackersChart data={stats?.top_ips?.slice(0, 5) ?? []} />
        </div>

        <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
          <h3 style={h3Style}>General Location of Attacks</h3>
          <AttackMap attackers={attackers} />
        </div>
      </div>

      {/* Top usernames, passwords & country pie chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
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

        <div style={cardStyle}>
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

        <div style={cardStyle}>
          <h3 style={h3Style}>Countries</h3>
          <CountryPieChart attackers={attackers} />
        </div>
      </div>

      {/* Protocol breakdown & events histogram */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={cardStyle}>
          <h3 style={h3Style}>Attack Protocols</h3>
          <ProtocolChart data={stats?.protocol_counts ?? []} />
        </div>

        <div style={{ ...cardStyle, gridColumn: 'span 2' }}>
          <h3 style={h3Style}>Honeypot Events Histogram</h3>
          <EventsHistogram data={stats?.hourly_histogram ?? []} />
        </div>
      </div>

      {/* Live feed - raw Cowrie logs */}
      <div style={cardStyle}>
        <h3 style={h3Style}>Live Feed for Logs</h3>
        <LiveFeed />
      </div>
    </div>
  )
}

export default Dashboard
