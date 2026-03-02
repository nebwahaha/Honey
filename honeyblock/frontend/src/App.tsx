import { useState, useEffect } from 'react'
import type { Attacker, Stats } from './types'
import StatCard from './components/StatCard'
import AttackerTable from './components/AttackerTable'

function App() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [attackers, setAttackers] = useState<Attacker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cowrieRunning, setCowrieRunning] = useState<boolean | null>(null)
  const [toggling, setToggling] = useState(false)
  const [autoStart, setAutoStart] = useState<boolean | null>(null)
  const [togglingAuto, setTogglingAuto] = useState(false)

  const fetchData = async () => {
    try {
      const [statsRes, attackersRes, cowrieRes, autoRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/attackers'),
        fetch('/api/cowrie/status'),
        fetch('/api/autostart/status'),
      ])

      if (!statsRes.ok) throw new Error(`Stats: ${statsRes.status} ${statsRes.statusText}`)
      if (!attackersRes.ok) throw new Error(`Attackers: ${attackersRes.status} ${attackersRes.statusText}`)

      const statsData: Stats = await statsRes.json()
      const attackersData: Attacker[] = await attackersRes.json()

      setStats(statsData)
      setAttackers(attackersData)
      setError(null)

      if (cowrieRes.ok) {
        const cowrieData = await cowrieRes.json()
        setCowrieRunning(cowrieData.running)
      }
      if (autoRes.ok) {
        const autoData = await autoRes.json()
        setAutoStart(autoData.enabled)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const toggleCowrie = async () => {
    setToggling(true)
    try {
      const res = await fetch('/api/cowrie/toggle', { method: 'POST' })
      const data = await res.json()
      setCowrieRunning(data.running)
      if (!res.ok) setError(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle Cowrie')
    } finally {
      setToggling(false)
    }
  }

  const toggleAutoStart = async () => {
    setTogglingAuto(true)
    try {
      const res = await fetch('/api/autostart/toggle', { method: 'POST' })
      const data = await res.json()
      setAutoStart(data.enabled)
      if (!res.ok) setError(data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle auto-start')
    } finally {
      setTogglingAuto(false)
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
      <div style={{ background: '#1a1d27', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 20 }}>
          🍯 HoneyBlock
        </span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={toggleAutoStart}
            disabled={togglingAuto || autoStart === null}
            style={{
              padding: '8px 16px',
              border: autoStart ? '2px solid #f59e0b' : '2px solid #555',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: togglingAuto ? 'wait' : 'pointer',
              color: autoStart ? '#f59e0b' : '#888',
              background: 'transparent',
            }}
          >
            {togglingAuto ? '...' : autoStart ? 'Auto-Start: ON' : 'Auto-Start: OFF'}
          </button>
          <button
            onClick={toggleCowrie}
            disabled={toggling || cowrieRunning === null}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 14,
              cursor: toggling ? 'wait' : 'pointer',
              color: '#ffffff',
              background: toggling
                ? '#555'
                : cowrieRunning
                  ? '#d32f2f'
                  : '#2e7d32',
            }}
          >
            {toggling ? '...' : cowrieRunning ? 'Stop Cowrie' : 'Start Cowrie'}
          </button>
        </div>
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
