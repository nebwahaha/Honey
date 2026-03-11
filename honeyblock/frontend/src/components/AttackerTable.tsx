import type { CSSProperties } from 'react'
import type { Attacker } from '../types'

interface AttackerTableProps {
  attackers: Attacker[]
}

const thStyle: CSSProperties = {
  background: '#1a1d27',
  color: '#8b8fa8',
  textAlign: 'left',
  padding: 12,
}

function AttackerTable({ attackers }: AttackerTableProps) {
  if (attackers.length === 0) {
    return (
      <div style={{ color: '#8b8fa8', textAlign: 'center', padding: 40 }}>
        No attackers detected yet.
      </div>
    )
  }

  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        color: '#e0e0e0',
        fontSize: 14,
      }}
    >
      <thead>
        <tr>
          <th style={thStyle}>IP Address</th>
          <th style={thStyle}>Country</th>
          <th style={thStyle}>Status</th>
          <th style={thStyle}>First Detected</th>
          <th style={thStyle}>Last Detected</th>
        </tr>
      </thead>
      <tbody>
        {attackers.map((a, i) => (
          <tr
            key={a.ip}
            style={{
              background: i % 2 === 0 ? '#13151f' : '#0f1117',
              borderBottom: '1px solid #2a2d3a',
            }}
          >
            <td style={{ padding: 12 }}>{a.ip}</td>
            <td style={{ padding: 12 }}>{a.country ?? '--'}</td>
            <td style={{ padding: 12, color: a.is_blocked === 'Blocked' ? '#f85149' : '#3fb950' }}>
              {a.is_blocked ?? 'not blocked'}
            </td>
            <td style={{ padding: 12 }}>{a.initial_detection}</td>
            <td style={{ padding: 12 }}>{a.last_detected}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default AttackerTable
