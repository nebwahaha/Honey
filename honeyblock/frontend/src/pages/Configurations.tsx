import { useState, useEffect } from 'react'
import { useTheme, themes } from '../theme'
import NotificationBell from '../components/NotificationBell'

function Configurations() {
  const { theme, themeName, setThemeName } = useTheme()
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

  const cardStyle: React.CSSProperties = {
    background: theme.cardBg,
    border: `2px solid ${theme.cardBorder}`,
    borderRadius: 10,
    padding: 24,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }

  const themeLabels: Record<string, string> = {
    dark: 'Dark',
    'soft-light': 'Soft Light',
    forest: 'Forest',
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 24 }}>
        <NotificationBell />
      </div>

      {message && (
        <div
          style={{
            padding: '10px 16px',
            marginBottom: 16,
            borderRadius: 6,
            background: message.error ? theme.messageBgError : theme.messageBgSuccess,
            color: message.error ? theme.error : theme.success,
            fontSize: 13,
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Cowrie toggle */}
        <div style={cardStyle}>
          <div>
            <h3 style={{ color: theme.heading, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Cowrie Honeypot
            </h3>
            <p style={{ color: theme.textSecondary, fontSize: 13, margin: 0 }}>
              Start or stop the Cowrie SSH/Telnet honeypot service.
            </p>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Status:{' '}
              <span style={{ color: cowrieRunning ? theme.success : theme.error, fontWeight: 600 }}>
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
              background: toggling ? theme.toggleDisabledBg : cowrieRunning ? theme.blockBtn : theme.unblockBtn,
              minWidth: 130,
            }}
          >
            {toggling ? 'Please wait...' : cowrieRunning ? 'Stop Cowrie' : 'Start Cowrie'}
          </button>
        </div>

        {/* Auto-start toggle */}
        <div style={cardStyle}>
          <div>
            <h3 style={{ color: theme.heading, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Auto-Start on Boot
            </h3>
            <p style={{ color: theme.textSecondary, fontSize: 13, margin: 0 }}>
              Automatically start all HoneyBlock services when the system boots up.
            </p>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Status:{' '}
              <span style={{ color: autoStart ? theme.success : theme.textSecondary, fontWeight: 600 }}>
                {autoStart === null ? 'Checking...' : autoStart ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleAutoStart}
            disabled={togglingAuto || autoStart === null}
            style={{
              padding: '10px 28px',
              border: `2px solid ${autoStart ? theme.toggleActiveBorder : theme.toggleInactiveBorder}`,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: togglingAuto ? 'wait' : 'pointer',
              color: autoStart ? theme.toggleActiveText : theme.toggleInactiveText,
              background: 'transparent',
              minWidth: 130,
            }}
          >
            {togglingAuto ? 'Please wait...' : autoStart ? 'Disable' : 'Enable'}
          </button>
        </div>

        {/* Auto-block toggle */}
        <div style={cardStyle}>
          <div>
            <h3 style={{ color: theme.heading, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
              Automatic Blocking
            </h3>
            <p style={{ color: theme.textSecondary, fontSize: 13, margin: 0 }}>
              Automatically block attackers when their session count exceeds the configured threshold.
              Set the session limit on the Blocking page.
            </p>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Status:{' '}
              <span style={{ color: autoBlock ? theme.success : theme.textSecondary, fontWeight: 600 }}>
                {autoBlock === null ? 'Checking...' : autoBlock ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleAutoBlock}
            disabled={togglingAutoBlock || autoBlock === null}
            style={{
              padding: '10px 28px',
              border: `2px solid ${autoBlock ? theme.toggleActiveBorder : theme.toggleInactiveBorder}`,
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: togglingAutoBlock ? 'wait' : 'pointer',
              color: autoBlock ? theme.toggleActiveText : theme.toggleInactiveText,
              background: 'transparent',
              minWidth: 130,
            }}
          >
            {togglingAutoBlock ? 'Please wait...' : autoBlock ? 'Disable' : 'Enable'}
          </button>
        </div>

        {/* Theme selector */}
        <div
          style={{
            background: theme.cardBg,
            border: `2px solid ${theme.cardBorder}`,
            borderRadius: 10,
            padding: 24,
          }}
        >
          <h3 style={{ color: theme.heading, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            Theme
          </h3>
          <p style={{ color: theme.textSecondary, fontSize: 13, margin: 0, marginBottom: 16 }}>
            Choose a visual theme for the dashboard.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {Object.keys(themes).map((key) => {
              const t = themes[key]
              const isActive = key === themeName
              return (
                <button
                  key={key}
                  onClick={() => setThemeName(key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 20px',
                    borderRadius: 8,
                    border: `2px solid ${isActive ? theme.brand : theme.cardBorder}`,
                    background: isActive ? theme.navActiveBg : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Color preview dots */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.pageBg, border: `1px solid ${theme.cardBorder}` }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.cardBg, border: `1px solid ${theme.cardBorder}` }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.brand }} />
                  </div>
                  <span style={{
                    color: isActive ? theme.heading : theme.textSecondary,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                  }}>
                    {themeLabels[key] ?? key}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Configurations
