import { useTheme } from '../theme'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
}

function StatCard({ icon, label, value }: StatCardProps) {
  const { theme } = useTheme()
  return (
    <div
      style={{
        background: theme.cardBg,
        border: `2px solid ${theme.cardBorder}`,
        borderRadius: 10,
        padding: '20px 24px',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: theme.iconAccentBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.iconAccent,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ color: theme.heading, fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ color: theme.textSecondary, fontSize: 13, marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

export default StatCard
