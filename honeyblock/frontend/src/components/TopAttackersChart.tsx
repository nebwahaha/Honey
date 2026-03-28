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
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: -4, bottom: 8 }} barCategoryGap="3%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis
          dataKey="ip"
          tick={{ fill: '#8b95a5', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: 'rgba(123, 140, 222, 0.08)' }}
          contentStyle={{
            background: '#1c2540',
            border: '1px solid #2a3558',
            borderRadius: 8,
            color: '#c9d1d9',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
          labelStyle={{ color: '#ffffff', fontWeight: 600, fontSize: 12 }}
        />
        <Bar dataKey="count" fill="#7b8cde" radius={[6, 6, 0, 0]} name="Sessions" maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default TopAttackersChart
