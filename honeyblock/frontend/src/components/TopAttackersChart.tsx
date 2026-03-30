import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useTheme } from '../theme'

interface Props {
  data: { ip: string; count: number }[]
}

function TopAttackersChart({ data }: Props) {
  const { theme } = useTheme()

  if (data.length === 0) {
    return (
      <div style={{ color: theme.textSecondary, textAlign: 'center', padding: 40 }}>
        No attacker data yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 10, right: 16, left: -4, bottom: 8 }} barCategoryGap="3%">
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={theme.cardBorder} />
        <XAxis
          dataKey="ip"
          tick={{ fill: theme.axisTick, fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={50}
        />
        <YAxis
          tick={{ fill: theme.textSecondary, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          cursor={{ fill: theme.barCursor }}
          contentStyle={{
            background: theme.tooltipBg,
            border: `1px solid ${theme.tooltipBorder}`,
            borderRadius: 8,
            color: theme.textPrimary,
            fontSize: 12,
            boxShadow: `0 4px 12px ${theme.shadow}`,
          }}
          labelStyle={{ color: theme.heading, fontWeight: 600, fontSize: 12 }}
        />
        <Bar dataKey="count" fill={theme.iconAccent} radius={[6, 6, 0, 0]} name="Sessions" maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default TopAttackersChart
