import { useState, useEffect } from 'react'

function Configurations() {
  const [cowrieRunning, setCowrieRunning] = useState<boolean | null>(null)
  const [autoStart, setAutoStart] = useState<boolean | null>(null)
  const [autoBlock, setAutoBlock] = useState<boolean | null>(null)
  const [toggling, setToggling] = useState(false)
  const [togglingAuto, setTogglingAuto] = useState(false)
  const [togglingAutoBlock, setTogglingAutoBlock] = useState(false)
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)

  const fetchStatus = async () => {
    try {
      const [cowrieRes, autoRes, autoBlockRes] = await Promise.all([
        fetch('/api/cowrie/status'),
        fetch('/api/autostart/status'),
        fetch('/api/autoblock/status'),
      ])
      if (cowrieRes.ok) {
        const data = await cowrieRes.json()
        setCowrieRunning(data.running)
      }
      if (autoRes.ok) {
        const data = await autoRes.json()
        setAutoStart(data.enabled)
      }
      if (autoBlockRes.ok) {
        const data = await autoBlockRes.json()
        setAutoBlock(data.enabled)
      }
    } catch {
      // retry next interval
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10_000)
    return () => clearInterval(interval)
  }, [])

  const toggleCowrie = async () => {
    setToggling(true)
    setMessage(null)
    try {
      const res = await fetch('/api/cowrie/toggle', { method: 'POST' })
      const data = await res.json()
      setCowrieRunning(data.running)
      setMessage({
        text: data.message ?? (data.running ? 'Cowrie started' : 'Cowrie stopped'),
        error: !res.ok,
      })
    } catch {
      setMessage({ text: 'Failed to toggle Cowrie', error: true })
    } finally {
      setToggling(false)
    }
  }

  const toggleAutoBlock = async () => {
    setTogglingAutoBlock(true)
    setMessage(null)
    try {
      const res = await fetch('/api/autoblock/toggle', { method: 'POST' })
      const data = await res.json()
      setAutoBlock(data.enabled)
      setMessage({
        text: data.enabled ? 'Automatic blocking enabled' : 'Automatic blocking disabled',
        error: !res.ok,
      })
    } catch {
      setMessage({ text: 'Failed to toggle automatic blocking', error: true })
    } finally {
      setTogglingAutoBlock(false)
    }
  }

  const toggleAutoStart = async () => {
    setTogglingAuto(true)
    setMessage(null)
    try {
      const res = await fetch('/api/autostart/toggle', { method: 'POST' })
      const data = await res.json()
      setAutoStart(data.enabled)
      setMessage({
        text: data.message ?? (data.enabled ? 'Auto-start enabled' : 'Auto-start disabled'),
        error: !res.ok,
      })
    } catch {
      setMessage({ text: 'Failed to toggle auto-start', error: true })
    } finally {
      setTogglingAuto(false)
    }
  }

  return (
    <div>
      <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
        Configurations
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Cowrie toggle */}
        <div
          style={{
            background: '#151a28',
            border: '1px solid #1e2a3a',
            borderRadius: 10,
            padding: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ color: '#ffffff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Cowrie Honeypot
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              Start or stop the Cowrie SSH/Telnet honeypot service.
            </p>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Status:{' '}
              <span style={{ color: cowrieRunning ? '#3fb950' : '#f85149', fontWeight: 600 }}>
                {cowrieRunning === null ? 'Checking...' : cowrieRunning ? 'Running' : 'Stopped'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleCowrie}
            disabled={toggling || cowrieRunning === null}
            style={{
              padding: '10px 28px',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: toggling ? 'wait' : 'pointer',
              color: '#ffffff',
              background: toggling ? '#555' : cowrieRunning ? '#d32f2f' : '#2e7d32',
              minWidth: 130,
            }}
          >
            {toggling ? 'Please wait...' : cowrieRunning ? 'Stop Cowrie' : 'Start Cowrie'}
          </button>
        </div>

        {/* Auto-start toggle */}
        <div
          style={{
            background: '#151a28',
            border: '1px solid #1e2a3a',
            borderRadius: 10,
            padding: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ color: '#ffffff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Auto-Start on Boot
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              Automatically start all HoneyBlock services when the system boots up.
            </p>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Status:{' '}
              <span style={{ color: autoStart ? '#3fb950' : '#6b7280', fontWeight: 600 }}>
                {autoStart === null ? 'Checking...' : autoStart ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleAutoStart}
            disabled={togglingAuto || autoStart === null}
            style={{
              padding: '10px 28px',
              border: autoStart ? '2px solid #f59e0b' : '2px solid #444',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: togglingAuto ? 'wait' : 'pointer',
              color: autoStart ? '#f59e0b' : '#888',
              background: 'transparent',
              minWidth: 130,
            }}
          >
            {togglingAuto ? 'Please wait...' : autoStart ? 'Disable' : 'Enable'}
          </button>
        </div>

        {/* Auto-block toggle */}
        <div
          style={{
            background: '#151a28',
            border: '1px solid #1e2a3a',
            borderRadius: 10,
            padding: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ color: '#ffffff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Automatic Blocking
            </h3>
            <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
              Automatically block attackers when their session count exceeds the configured threshold.
              Set the session limit on the Blocking page.
            </p>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Status:{' '}
              <span style={{ color: autoBlock ? '#3fb950' : '#6b7280', fontWeight: 600 }}>
                {autoBlock === null ? 'Checking...' : autoBlock ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleAutoBlock}
            disabled={togglingAutoBlock || autoBlock === null}
            style={{
              padding: '10px 28px',
              border: autoBlock ? '2px solid #f59e0b' : '2px solid #444',
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: togglingAutoBlock ? 'wait' : 'pointer',
              color: autoBlock ? '#f59e0b' : '#888',
              background: 'transparent',
              minWidth: 130,
            }}
          >
            {togglingAutoBlock ? 'Please wait...' : autoBlock ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Configurations
