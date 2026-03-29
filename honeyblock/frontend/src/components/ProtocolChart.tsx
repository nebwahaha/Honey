import { PieChart, Pie, Cell, Tooltip } from 'recharts'

const COLORS: Record<string, string> = {
  SSH: '#3498db',
  Telnet: '#2ecc71',
  SFTP: '#e67e22',
}

interface Props {
  data: { protocol: string; count: number }[]
}

function ProtocolChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
        No protocol data yet.
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.count, 0)
  const chartData = data.map(d => ({ name: d.protocol, value: d.count }))

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      {/* Half-pie: arc on left, opening to the right */}
      <PieChart width={140} height={260}>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx={130}
          cy="50%"
          startAngle={90}
          endAngle={270}
          outerRadius={120}
          innerRadius={68}
          stroke="#151a28"
          strokeWidth={2}
          paddingAngle={2}
        >
          {chartData.map((d) => (
            <Cell key={d.name} fill={COLORS[d.name] ?? '#6b7280'} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#1c2540',
            border: '1px solid #2a3558',
            borderRadius: 6,
            color: '#c9d1d9',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
          formatter={(value, name) => [`${value} (${((Number(value) / total) * 100).toFixed(1)}%)`, name]}
        />
      </PieChart>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {chartData.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 11, height: 11, borderRadius: '50%',
              background: COLORS[d.name] ?? '#6b7280',
              flexShrink: 0,
              boxShadow: `0 0 6px ${COLORS[d.name] ?? '#6b7280'}`,
            }} />
            <span style={{ color: '#9ca3af', fontSize: 13 }}>
              {d.name}:&nbsp;<span style={{ color: '#ffffff', fontWeight: 700 }}>{d.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProtocolChart
