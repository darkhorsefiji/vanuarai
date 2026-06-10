import { useEffect, useState } from 'react'
import { NavLink, Routes, Route } from 'react-router-dom'
import Internet from './pages/Internet'
import Profile from './pages/Profile'
import Kacikacivaki from './pages/Kacikacivaki'
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
import { loadNavOrder, onNavOrderChange, orderedNav } from './nav'
import { LevelsProvider } from './levels'
import { AuthProvider, useAuth } from './auth'
import { CopyProvider, DevEditButton } from './copy'
import DevStyler from './styler'
import AuthArea from './AuthArea'

const TOP_NAV = [['/', 'Internet']]

// Admin/Dev are reached via the avatar menu and require the official role.
function RequireOfficial({ children }) {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (!user || !(user.isAppAdmin || user.role === 'official')) {
    return (
      <div className="card" style={{ marginTop: 20, maxWidth: 460 }}>
        <h3>Officials only</h3>
        <p className="sub">Sign in with a village-official account to access this page.</p>
      </div>
    )
  }
  return children
}

export default function App() {
  const [logoOk, setLogoOk] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const [navOrder, setNavOrder] = useState(loadNavOrder)
  useEffect(() => onNavOrderChange(() => setNavOrder(loadNavOrder())), [])
  const sideNav = orderedNav(navOrder)
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
              {sideNav.map(([to, label, icon]) => (
                <NavLink key={to} to={to} title={label}>
                  <span className="ico"><Icon name={icon} /></span><span className="lbl">{label}</span>
                </NavLink>
              ))}
            </aside>

            <main>
              <Routes>
                <Route path="/" element={<Internet />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/kacikacivaki" element={<Kacikacivaki />} />
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
                <Route path="/admin" element={<RequireOfficial><Admin /></RequireOfficial>} />
                <Route path="/dev" element={<RequireOfficial><Dev /></RequireOfficial>} />
              </Routes>
            </main>
          </div>
        </div>
        <DevEditButton />
        <DevStyler />
        </IconSetProvider>
        </CopyProvider>
      </LevelsProvider>
    </AuthProvider>
  )
}
