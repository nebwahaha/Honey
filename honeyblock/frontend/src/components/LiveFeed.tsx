import { useState, useEffect } from 'react'
import { useTheme, type Theme } from '../theme'

interface CowrieLog {
  eventid?: string
  src_ip?: string
  src_port?: number
  dst_port?: number
  timestamp?: string
  session?: string
  username?: string
  password?: string
  input?: string
  message?: string
  duration?: number | string
  protocol?: string
  [key: string]: unknown
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts)
    const date = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })
    return `[${date}, ${time}]`
  } catch {
    return `[${ts}]`
  }
}

function getProtocol(entry: CowrieLog): string {
  if (entry.protocol) return entry.protocol.toUpperCase()
  const port = entry.dst_port
  if (port === 23) return 'TELNET'
  return 'SSH'
}

function formatEntry(entry: CowrieLog, theme: Theme): {
  timestamp: string
  ipPort: string
  protocol: string
  action: string
  actionColor: string
  details: string
} {
  const eventid = entry.eventid ?? ''
  const ip = entry.src_ip ?? ''
  const port = entry.src_port ?? ''
  const ipPort = port ? `${ip}:${port}` : ip
  const protocol = getProtocol(entry)
  const country = (entry as Record<string, unknown>).country as string | undefined

  let action = ''
  let actionColor = theme.textPrimary
  let details = ''

  if (eventid.includes('session.connect')) {
    action = `New connection: ${ipPort}`
    actionColor = theme.blueLink
  } else if (eventid.includes('login.success')) {
    const user = entry.username ?? ''
    const pass = entry.password ?? ''
    action = 'login attempt'
    actionColor = theme.success
    details = `[${user}/${pass}] succeeded [${user}/${pass}]`
  } else if (eventid.includes('login.failed')) {
    const user = entry.username ?? ''
    const pass = entry.password ?? ''
    action = 'login attempt'
    actionColor = theme.error
    details = `[${user}/${pass}] failed [${user}/${pass}]`
  } else if (eventid.includes('command.input') || eventid.includes('command.failed')) {
    action = 'CMD:'
    actionColor = theme.orange
    details = entry.input ?? '(empty)'
  } else if (eventid.includes('honeyblock.ip.blocked')) {
    action = 'BLOCKED'
    actionColor = theme.error
    details = entry.message ?? 'Automatically blocked by system'
  } else if (eventid.includes('session.closed')) {
    action = 'connection lost'
    actionColor = theme.sessionClosed
  } else if (eventid.includes('direct-tcpip')) {
    action = 'TCP tunnel request'
    actionColor = theme.tcpTunnel
    details = entry.message ?? ''
  } else if (eventid.includes('download')) {
    action = 'file download'
    actionColor = theme.fileDownload
    details = entry.message ?? String((entry as Record<string, unknown>).url ?? '')
  } else {
    action = eventid.replace('cowrie.', '')
    details = entry.message ?? ''
  }

  const countryStr = country ? ` (${country})` : ''

  return {
    timestamp: formatTimestamp(entry.timestamp ?? ''),
    ipPort,
    protocol,
    action,
    actionColor,
    details: details + countryStr,
  }
}

function LiveFeed() {
  const { theme } = useTheme()
  const [logs, setLogs] = useState<CowrieLog[]>([])

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs?limit=100')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.data ?? [])
      }
    } catch {
      // retry next interval
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 10_000)
    return () => clearInterval(interval)
  }, [])

  if (logs.length === 0) {
    return (
      <div style={{ color: theme.textSecondary, textAlign: 'center', padding: 30 }}>
        No Cowrie logs yet. Start Cowrie and wait for connections.
      </div>
    )
  }

  return (
    <div
      style={{
        background: theme.feedBg,
        border: `2px solid ${theme.cardBorder}`,
        borderRadius: 6,
        maxHeight: 400,
        overflowY: 'auto',
        fontFamily: "'JetBrains Mono', 'Consolas', monospace",
        fontSize: 13,
      }}
    >
      {logs.map((entry, i) => {
        const f = formatEntry(entry, theme)

        return (
          <div
            key={i}
            style={{
              padding: '10px 16px',
              borderBottom: `1px solid ${theme.feedBorder}`,
              display: 'flex',
              alignItems: 'baseline',
              gap: 0,
              flexWrap: 'wrap',
            }}
          >
            <span style={{ color: theme.textSecondary, marginRight: 8 }}>
              {f.timestamp}
            </span>
            <span style={{ color: theme.textPrimary, marginRight: 8 }}>
              {f.ipPort}
            </span>
            <span style={{ color: theme.arrow, marginRight: 8 }}>&rarr;</span>
            <span style={{ color: theme.iconAccent, fontWeight: 700, marginRight: 8 }}>
              {f.protocol}
            </span>
            <span style={{ color: f.actionColor, marginRight: 6 }}>
              {f.action}
            </span>
            {f.details && (
              <span style={{ color: theme.textPrimary }}>
                {renderDetails(f.details, f.actionColor, theme)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function renderDetails(details: string, color: string, theme: Theme): React.ReactNode {
  const parts = details.split(/(\[[^\]]*\])/)
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']') && !part.startsWith('(')) {
      return (
        <span key={i} style={{ fontWeight: 700, color }}>{part}</span>
      )
    }
    if (part.match(/^\s*\(.*\)$/)) {
      return (
        <span key={i} style={{ color: theme.textSecondary }}>{part}</span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default LiveFeed
