import { useState, useEffect } from 'react'
import type { Stats, SessionEntry, Attacker } from '../types'
import StatCard from '../components/StatCard'
import TopAttackersChart from '../components/TopAttackersChart'
import AttackMap from '../components/AttackMap'
import LiveFeed from '../components/LiveFeed'
import CountryPieChart from '../components/CountryPieChart'
import ProtocolChart from '../components/ProtocolChart'
import EventsHistogram from '../components/EventsHistogram'

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [attackers, setAttackers] = useState<Attacker[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchData = async () => {
    try {
      const [statsRes, sessionsRes, attackersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/attempts?limit=50'),
        fetch('/api/attackers'),
      ])

      if (statsRes.ok) {
        const data: Stats = await statsRes.json()
        setStats(data)
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setSessions(data.data ?? [])
      }
      if (attackersRes.ok) {
        const data: Attacker[] = await attackersRes.json()
        setAttackers(data)
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

  // Count active sessions (sessions from last 5 min)
  const activeSessions = (() => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const activeIps = new Set(
      sessions
        .filter(s => s.event_type === 'cowrie.session.connect' && s.timestamp >= fiveMinAgo)
        .map(s => s.ip)
    )
    return activeIps.size
  })()

  if (loading) {
    return (
      <div style={{ color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>
          Honeypot Monitoring Dashboard
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#6b7280', fontSize: 13 }}>Last updated: {lastUpdated}</span>
          <button
            onClick={fetchData}
            style={{
              padding: '8px 16px',
              background: '#1c2540',
              border: '1px solid #2a3558',
              borderRadius: 6,
              color: '#c9d1d9',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
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
        <StatCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          }
          label="Unique IPs"
          value={stats?.unique_ips ?? 0}
        />
        <StatCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          }
          label="Blocked IPs"
          value={stats?.blocked_ips ?? 0}
        />
        <StatCard
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          }
          label="Active Sessions"
          value={activeSessions}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20 }}>
          <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Top 5 Attacker IPs
          </h3>
          <TopAttackersChart data={stats?.top_ips?.slice(0, 5) ?? []} />
        </div>

        <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20, gridColumn: 'span 2' }}>
          <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            General Location of Attacks
          </h3>
          <AttackMap attackers={attackers} />
        </div>
      </div>

      {/* Top usernames, passwords & country pie chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20 }}>
          <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Cowrie Top 10 Usernames
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>Usernames</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.top_usernames ?? []).map((entry, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e2a3a' }}>
                  <td style={{ padding: '8px 12px', color: '#c9d1d9', fontSize: 13 }}>{entry.username_attempt}</td>
                  <td style={{ padding: '8px 12px', color: '#c9d1d9', fontSize: 13, textAlign: 'right' }}>{entry.count}</td>
                </tr>
              ))}
              {(stats?.top_usernames ?? []).length === 0 && (
                <tr><td colSpan={2} style={{ padding: '16px 12px', color: '#6b7280', fontSize: 13, textAlign: 'center' }}>No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20 }}>
          <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Cowrie Top 10 Passwords
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2a3a' }}>
                <th style={{ textAlign: 'left', padding: '8px 12px', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>Top 10 Passwords</th>
                <th style={{ textAlign: 'right', padding: '8px 12px', color: '#9ca3af', fontSize: 13, fontWeight: 600 }}>Count</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.top_passwords ?? []).map((entry, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1e2a3a' }}>
                  <td style={{ padding: '8px 12px', color: '#c9d1d9', fontSize: 13 }}>{entry.password_attempt}</td>
                  <td style={{ padding: '8px 12px', color: '#c9d1d9', fontSize: 13, textAlign: 'right' }}>{entry.count}</td>
                </tr>
              ))}
              {(stats?.top_passwords ?? []).length === 0 && (
                <tr><td colSpan={2} style={{ padding: '16px 12px', color: '#6b7280', fontSize: 13, textAlign: 'center' }}>No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20 }}>
          <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Countries
          </h3>
          <CountryPieChart attackers={attackers} />
        </div>
      </div>

      {/* Protocol breakdown & events histogram */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20 }}>
          <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Attack Protocols
          </h3>
          <ProtocolChart data={stats?.protocol_counts ?? []} />
        </div>

        <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20 }}>
          <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
            Honeypot Events Histogram
          </h3>
          <EventsHistogram data={stats?.hourly_histogram ?? []} />
        </div>
      </div>

      {/* Live feed - raw Cowrie logs */}
      <div style={{ background: '#151a28', border: '1px solid #1e2a3a', borderRadius: 10, padding: 20 }}>
        <h3 style={{ color: '#ffffff', fontSize: 15, fontWeight: 600, marginBottom: 16 }}>
          Live Feed for Logs
        </h3>
        <LiveFeed />
      </div>
    </div>
  )
}

export default Dashboard
