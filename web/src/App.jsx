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
import Lands from './pages/Lands'
import Agreements from './pages/Agreements'
import Trade from './pages/Trade'
import Emergencies from './pages/Emergencies'
import Admin from './pages/Admin'
import Dev from './pages/Dev'
import { Icon, IconSetProvider } from './icons'
import { LevelsProvider } from './levels'
import { AuthProvider } from './auth'
import { CopyProvider, DevEditButton } from './copy'
import AuthArea from './AuthArea'

const TOP_NAV = [['/', 'Internet'], ['/admin', 'Admin'], ['/dev', 'Dev']]
const SIDE_NAV = [
  ['/profile', 'Profile', 'profile'],
  ['/vanua', 'Vanua', 'vanua'],
  ['/government', 'Government', 'government'],
  ['/lands', 'Lands', 'lands'],
  ['/agreements', 'Agreements', 'agreements'],
  ['/projects', 'Projects', 'projects'],
  ['/trade', 'Trade', 'trade'],
  ['/fundraising', 'Fundraising', 'fundraising'],
  ['/financials', 'Financials', 'financials'],
  ['/minutes', 'Minutes', 'minutes'],
  ['/emergencies', 'Emergencies', 'emergencies'],
]

export default function App() {
  const [logoOk, setLogoOk] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  return (
    <AuthProvider>
      <LevelsProvider>
        <CopyProvider>
        <IconSetProvider>
        <div className="app">
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
            <aside className={'sidebar' + (collapsed ? ' collapsed' : '')}>
              <button className="sbtoggle" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
                {collapsed ? '»' : '«'}
              </button>
              {SIDE_NAV.map(([to, label, icon]) => (
                <NavLink key={to} to={to} title={label}>
                  <span className="ico"><Icon name={icon} /></span><span className="lbl">{label}</span>
                </NavLink>
              ))}
            </aside>

            <main>
              <Routes>
                <Route path="/" element={<Internet />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/vanua" element={<Hierarchy />} />
                <Route path="/government" element={<Government />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/fundraising" element={<Fundraising />} />
                <Route path="/financials" element={<Financials />} />
                <Route path="/minutes" element={<Minutes />} />
                <Route path="/lands" element={<Lands />} />
                <Route path="/agreements" element={<Agreements />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/emergencies" element={<Emergencies />} />
                <Route path="/admin" element={<Admin />} />
              <Route path="/dev" element={<Dev />} />
              </Routes>
            </main>
          </div>
        </div>
        <DevEditButton />
        </IconSetProvider>
        </CopyProvider>
      </LevelsProvider>
    </AuthProvider>
  )
}
