import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { ip: string; count: number }[]
}

function TopAttackersChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
        No attacker data yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis
          dataKey="ip"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={{ stroke: '#1e2a3a' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={{ stroke: '#1e2a3a' }}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#1c2540',
            border: '1px solid #2a3558',
            borderRadius: 6,
            color: '#c9d1d9',
            fontSize: 13,
          }}
          labelStyle={{ color: '#ffffff', fontWeight: 600 }}
        />
        <Bar dataKey="count" fill="#7b8cde" radius={[4, 4, 0, 0]} name="Sessions" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default TopAttackersChart
