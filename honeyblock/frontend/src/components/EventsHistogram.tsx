import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  data: { hour: string; events: number; unique_ips: number }[]
}

function EventsHistogram({ data }: Props) {
  if (data.length === 0) {
    return (
      <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>
        No event data yet.
      </div>
    )
  }

  const isDaily = data.length > 1 &&
    data[0].hour.endsWith('T00:00:00') && data[1].hour.endsWith('T00:00:00')

  const formatted = data.map(d => ({
    ...d,
    label: isDaily
      ? new Date(d.hour).toLocaleDateString([], { month: 'short', day: 'numeric' })
      : new Date(d.hour).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#1e2a3a" />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={60}
        />
        <YAxis
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: '#1c2540',
            border: '1px solid #2a3558',
            borderRadius: 6,
            color: '#c9d1d9',
            fontSize: 12,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
        />
        <Line
          type="monotone"
          dataKey="events"
          name="Events"
          stroke="#2ecc71"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#2ecc71' }}
        />
        <Line
          type="monotone"
          dataKey="unique_ips"
          name="Unique Source IPs"
          stroke="#3498db"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#3498db' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default EventsHistogram
