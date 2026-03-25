import { useState, useEffect } from 'react'

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

// Format ISO timestamp to readable: [1/15/2024, 12:15:15 AM]
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

// Determine protocol label from event
function getProtocol(entry: CowrieLog): string {
  if (entry.protocol) return entry.protocol.toUpperCase()
  const port = entry.dst_port
  if (port === 23) return 'TELNET'
  return 'SSH'
}

// Build the full formatted log line
function formatEntry(entry: CowrieLog): {
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
  let actionColor = '#c9d1d9'
  let details = ''

  if (eventid.includes('session.connect')) {
    action = `New connection: ${ipPort}`
    actionColor = '#58a6ff'
  } else if (eventid.includes('login.success')) {
    const user = entry.username ?? ''
    const pass = entry.password ?? ''
    action = 'login attempt'
    actionColor = '#3fb950'
    details = `[${user}/${pass}] succeeded [${user}/${pass}]`
  } else if (eventid.includes('login.failed')) {
    const user = entry.username ?? ''
    const pass = entry.password ?? ''
    action = 'login attempt'
    actionColor = '#f85149'
    details = `[${user}/${pass}] failed [${user}/${pass}]`
  } else if (eventid.includes('command.input') || eventid.includes('command.failed')) {
    action = 'CMD:'
    actionColor = '#f5a623'
    details = entry.input ?? '(empty)'
  } else if (eventid.includes('honeyblock.ip.blocked')) {
    action = 'BLOCKED'
    actionColor = '#f85149'
    details = entry.message ?? 'Automatically blocked by system'
  } else if (eventid.includes('session.closed')) {
    action = 'connection lost'
    actionColor = '#8b949e'
  } else if (eventid.includes('direct-tcpip')) {
    action = 'TCP tunnel request'
    actionColor = '#d2a8ff'
    details = entry.message ?? ''
  } else if (eventid.includes('download')) {
    action = 'file download'
    actionColor = '#ff7b72'
    details = entry.message ?? String((entry as Record<string, unknown>).url ?? '')
  } else {
    action = eventid.replace('cowrie.', '')
    details = entry.message ?? ''
  }

  // Append country if available
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
      <div style={{ color: '#6b7280', textAlign: 'center', padding: 30 }}>
        No Cowrie logs yet. Start Cowrie and wait for connections.
      </div>
    )
  }

  return (
    <div
      style={{
        background: '#0d1117',
        border: '1px solid #1e2a3a',
        borderRadius: 6,
        maxHeight: 400,
        overflowY: 'auto',
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        fontSize: 13,
      }}
    >
      {logs.map((entry, i) => {
        const f = formatEntry(entry)

        return (
          <div
            key={i}
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #1a2030',
              display: 'flex',
              alignItems: 'baseline',
              gap: 0,
              flexWrap: 'wrap',
            }}
          >
            {/* Timestamp */}
            <span style={{ color: '#6b7280', marginRight: 8 }}>
              {f.timestamp}
            </span>

            {/* IP:Port */}
            <span style={{ color: '#c9d1d9', marginRight: 8 }}>
              {f.ipPort}
            </span>

            {/* Arrow + Protocol */}
            <span style={{ color: '#484f58', marginRight: 8 }}>&rarr;</span>
            <span style={{ color: '#7b8cde', fontWeight: 700, marginRight: 8 }}>
              {f.protocol}
            </span>

            {/* Action */}
            <span style={{ color: f.actionColor, marginRight: 6 }}>
              {f.action}
            </span>

            {/* Details with bold credentials */}
            {f.details && (
              <span style={{ color: '#c9d1d9' }}>
                {renderDetails(f.details, f.actionColor)}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Render details with bold brackets for credentials like [user/pass]
function renderDetails(details: string, color: string): React.ReactNode {
  const parts = details.split(/(\[[^\]]*\])/)
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']') && !part.startsWith('(')) {
      return (
        <span key={i} style={{ fontWeight: 700, color }}>{part}</span>
      )
    }
    // Color country in parentheses
    if (part.match(/^\s*\(.*\)$/)) {
      return (
        <span key={i} style={{ color: '#6b7280' }}>{part}</span>
      )
    }
    return <span key={i}>{part}</span>
  })
}

export default LiveFeed
