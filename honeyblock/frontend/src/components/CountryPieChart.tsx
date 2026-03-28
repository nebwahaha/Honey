import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import type { Attacker } from '../types'

const COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
  '#3498db', '#9b59b6', '#e84393', '#00cec9', '#fd79a8',
  '#6c5ce7', '#00b894', '#fdcb6e', '#fab1a0', '#74b9ff',
]

interface Props {
  attackers: Attacker[]
}

function CountryPieChart({ attackers }: Props) {
  const countryCounts = attackers
    .filter(a => a.country)
    .reduce<Record<string, number>>((acc, a) => {
      acc[a.country!] = (acc[a.country!] || 0) + 1
      return acc
    }, {})

  const data = Object.entries(countryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
        No country data yet.
      </div>
    )
  }

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={60}
            stroke="#151a28"
            strokeWidth={1}
            paddingAngle={1}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
        {data.map((d, i) => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
            <span style={{ color: '#c9d1d9', fontSize: 11 }}>
              {d.name} ({d.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CountryPieChart
