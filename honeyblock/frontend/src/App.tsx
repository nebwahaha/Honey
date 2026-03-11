import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Blocking from './pages/Blocking'
import Configurations from './pages/Configurations'

function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
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
