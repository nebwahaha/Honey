import { useState, useEffect } from 'react'
import type { Attacker, Stats } from './types'
import StatCard from './components/StatCard'
import AttackerTable from './components/AttackerTable'

function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [attackers, setAttackers] = useState<Attacker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [statsRes, attackersRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/attackers'),
      ])

      if (!statsRes.ok) throw new Error(`Stats: ${statsRes.status} ${statsRes.statusText}`)
      if (!attackersRes.ok) throw new Error(`Attackers: ${attackersRes.status} ${attackersRes.statusText}`)

      const statsData: Stats = await statsRes.json()
      const attackersData: Attacker[] = await attackersRes.json()

      setStats(statsData)
      setAttackers(attackersData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30_000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div style={{ background: '#0f1117', color: '#8b8fa8', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ background: '#0f1117', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Top bar */}
      <div style={{ background: '#1a1d27', padding: '16px 24px' }}>
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 20 }}>
          🍯 HoneyBlock
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {error && (
          <div style={{ color: '#f85149', marginBottom: 16 }}>{error}</div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 16 }}>
          <StatCard label="Total Attempts" value={stats?.total_attempts ?? '--'} />
          <StatCard label="Unique Attackers" value={stats?.unique_ips ?? '--'} />
        </div>

        {/* Attackers section */}
        <h2 style={{ color: '#ffffff', marginTop: 32, marginBottom: 16, fontSize: 18, fontWeight: 600 }}>
          Recent Attackers
        </h2>
        <AttackerTable attackers={attackers} />
      </div>
    </div>
  )
}

export default App
