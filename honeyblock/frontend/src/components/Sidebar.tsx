import { NavLink } from 'react-router-dom'
import { useTheme } from '../theme'

function Sidebar() {
  const { theme } = useTheme()

  const linkBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 18px',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    color: theme.navText,
    transition: 'background 0.15s, color 0.15s',
  }

  return (
    <aside
      style={{
        width: 220,
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: theme.sidebarBg,
        borderRight: `1px solid ${theme.sidebarBorder}`,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 12px',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 6px 28px', borderBottom: `1px solid ${theme.sidebarBorder}`, marginBottom: 20 }}>
        <div style={{ color: theme.brand, fontFamily: "'Bungee', cursive", fontSize: 22, letterSpacing: '0.5px', lineHeight: 1.2 }}>HoneyBlock</div>
      </div>

      {/* Nav links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            ...linkBase,
            background: isActive ? theme.navActiveBg : 'transparent',
            color: isActive ? theme.navActiveText : theme.navText,
          })}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
          </svg>
          Dashboard
        </NavLink>

        <NavLink
          to="/blocking"
          style={({ isActive }) => ({
            ...linkBase,
            background: isActive ? theme.navActiveBg : 'transparent',
            color: isActive ? theme.navActiveText : theme.navText,
          })}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
          Blocking
        </NavLink>

        <NavLink
          to="/configurations"
          style={({ isActive }) => ({
            ...linkBase,
            background: isActive ? theme.navActiveBg : 'transparent',
            color: isActive ? theme.navActiveText : theme.navText,
          })}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Configurations
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar
