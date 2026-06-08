import { useState } from 'react'
import { NavLink, Routes, Route } from 'react-router-dom'
import Internet from './pages/Internet'
import Profile from './pages/Profile'
import Hierarchy from './pages/Hierarchy'
import Government from './pages/Government'
import Projects from './pages/Projects'
import Fundraising from './pages/Fundraising'
import Financials from './pages/Financials'
import Minutes from './pages/Minutes'
import Admin from './pages/Admin'
import { LevelsProvider } from './levels'
import { AuthProvider } from './auth'
import AuthArea from './AuthArea'

const TOP_NAV = [['/', 'Internet'], ['/admin', 'Admin']]
const SIDE_NAV = [
  ['/profile', 'Profile'], ['/hierarchy', 'Hierarchy'], ['/government', 'Government'],
  ['/projects', 'Projects'], ['/fundraising', 'Fundraising'],
  ['/financials', 'Financials'], ['/minutes', 'Minutes'],
]

export default function App() {
  const [logoOk, setLogoOk] = useState(true)
  return (
    <AuthProvider>
      <LevelsProvider>
        <header className="top">
          {logoOk
            ? <img className="brandlogo" src="/logo.png" alt="VanuaRai — Digital Village WiFi" onError={() => setLogoOk(false)} />
            : <span className="brand">🌺 VanuaRai</span>}
          <span className="badge">Village: Bagasau</span>
          <nav>
            {TOP_NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
            ))}
          </nav>
          <AuthArea />
        </header>

        <div className="layout">
          <aside className="sidebar">
            {SIDE_NAV.map(([to, label]) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
          </aside>

          <main>
            <Routes>
              <Route path="/" element={<Internet />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/hierarchy" element={<Hierarchy />} />
              <Route path="/government" element={<Government />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/fundraising" element={<Fundraising />} />
              <Route path="/financials" element={<Financials />} />
              <Route path="/minutes" element={<Minutes />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </LevelsProvider>
    </AuthProvider>
  )
}
