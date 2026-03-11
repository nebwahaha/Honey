interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div
      style={{
        background: '#151a28',
        border: '1px solid #1e2a3a',
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
          background: '#1c2540',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#7b8cde',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </div>
        <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  )
}

export default StatCard
