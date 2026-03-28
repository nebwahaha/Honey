import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <ResponsiveContainer width={180} height={110}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="95%"
            startAngle={180}
            endAngle={0}
            outerRadius={90}
            innerRadius={50}
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
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {chartData.map((d) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[d.name] ?? '#6b7280', flexShrink: 0 }} />
            <span style={{ color: '#c9d1d9', fontSize: 13 }}>
              {d.name}: <span style={{ color: '#ffffff', fontWeight: 600 }}>{d.value}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProtocolChart
