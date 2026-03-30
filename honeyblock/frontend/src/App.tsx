import { Routes, Route } from 'react-router-dom'
import { useTheme } from './theme'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Blocking from './pages/Blocking'
import Configurations from './pages/Configurations'

function App() {
  const { theme } = useTheme()
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: theme.pageBg }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/blocking" element={<Blocking />} />
          <Route path="/configurations" element={<Configurations />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
