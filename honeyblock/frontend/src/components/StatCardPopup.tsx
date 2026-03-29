import { useState, useEffect, useCallback } from 'react'

interface PopupRow {
  primary: string
  secondary?: string
}

interface Props {
  icon: React.ReactNode
  label: string
  value: string | number
  fetchRows: (page: number) => Promise<{ rows: PopupRow[]; hasMore: boolean }>
}

function StatCardPopup({ icon, label, value, fetchRows }: Props) {
  const [hovered, setHovered] = useState(false)
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<PopupRow[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const result = await fetchRows(p)
      setRows(prev => p === 1 ? result.rows : [...prev, ...result.rows])
      setHasMore(result.hasMore)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [fetchRows])

  const handleOpen = () => {
    setRows([])
    setPage(1)
    setHasMore(false)
    setOpen(true)
  }

  useEffect(() => {
    if (open) {
      load(1)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => setOpen(false)

  return (
    <>
      {/* Card */}
      <div
        onClick={handleOpen}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? '#1c2540' : '#151a28',
          border: `1px solid ${hovered ? '#3a4a6a' : '#1e2a3a'}`,
          borderRadius: 10,
          padding: '20px 24px',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 8, background: '#1c2540',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#7b8cde', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{label}</div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#151a28',
              border: '1px solid #2a3558',
              borderRadius: 12,
              width: 420,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #1e2a3a',
            }}>
              <span style={{ color: '#ffffff', fontSize: 15, fontWeight: 600 }}>{label}</span>
              <button
                onClick={handleClose}
                style={{
                  background: 'none', border: 'none', color: '#6b7280',
                  fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {rows.length === 0 && !loading && (
                <div style={{ color: '#6b7280', fontSize: 13, padding: 24, textAlign: 'center' }}>
                  No data.
                </div>
              )}
              {rows.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 20px', borderBottom: '1px solid #1e2a3a',
                }}>
                  <span style={{ color: '#c9d1d9', fontSize: 13, fontFamily: 'monospace' }}>{r.primary}</span>
                  {r.secondary && (
                    <span style={{ color: '#7b8cde', fontSize: 12, fontWeight: 600 }}>{r.secondary}</span>
                  )}
                </div>
              ))}
              {loading && (
                <div style={{ color: '#6b7280', fontSize: 13, padding: 16, textAlign: 'center' }}>
                  Loading...
                </div>
              )}
            </div>

            {/* Footer */}
            {hasMore && !loading && (
              <div style={{ padding: '12px 20px', borderTop: '1px solid #1e2a3a' }}>
                <button
                  onClick={() => load(page + 1)}
                  style={{
                    width: '100%', padding: '8px', background: '#1c2540',
                    border: '1px solid #2a3558', borderRadius: 6,
                    color: '#9ca3af', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Show more
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default StatCardPopup
