interface StatCardProps {
  label: string
  value: string | number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div
      style={{
        background: '#1a1d27',
        borderRadius: 10,
        padding: 24,
        minWidth: 160,
      }}
    >
      <div style={{ color: '#8b8fa8', fontSize: 13, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ color: '#ffffff', fontSize: 32, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  )
}

export default StatCard
