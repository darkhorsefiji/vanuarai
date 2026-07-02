import { useEffect, useState } from 'react'
import { NavLink, Routes, Route } from 'react-router-dom'
import Internet from './pages/Internet'
import Profile from './pages/Profile'
import Kacikacivaki from './pages/Kacikacivaki'
import Hierarchy from './pages/Hierarchy'
import Government from './pages/Government'
import VScorecard from './pages/VScorecard'
import Outcomes from './pages/Outcomes'
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
import { loadNavOrder, onNavOrderChange, orderedNav, saveNavOrder } from './nav'
import { LevelsProvider } from './levels'
import { AuthProvider, useAuth, isDev, isVillageAdmin } from './auth'
import { CopyProvider, DevEditButton } from './copy'
import { StyleModeProvider, DevStyleToggle } from './styler'
import AuthArea from './AuthArea'

const TOP_NAV = [['/', 'Internet']]

// Admin/Dev are reached via the avatar menu; access follows the role tiers
// (member < official < village_admin < app_admin/DEV).
function RequireRole({ check, who, children }) {
  const { user, ready } = useAuth()
  if (!ready) return null
  if (!check(user)) {
    return (
      <div className="card" style={{ marginTop: 20, maxWidth: 460 }}>
        <h3>{who} only</h3>
        <p className="sub">Sign in with a {who.toLowerCase()} account to access this page.</p>
      </div>
    )
  }
  return children
}

// Sidebar with in-line drag-to-reorder for the DEV role only (users.is_app_admin;
// officials don't get it). Plain clicks still navigate; order persists via nav.js.
function Sidebar() {
  const { user } = useAuth()
  const dev = isDev(user)
  const [collapsed, setCollapsed] = useState(false)
  const [navOrder, setNavOrder] = useState(loadNavOrder)
  const [drag, setDrag] = useState(null)
  const [over, setOver] = useState(null)
  useEffect(() => onNavOrderChange(() => setNavOrder(loadNavOrder())), [])
  const sideNav = orderedNav(navOrder)

  function onDrop(targetPath) {
    if (!drag || drag === targetPath) { setDrag(null); setOver(null); return }
    const cur = sideNav.map(it => it[0])
    cur.splice(cur.indexOf(drag), 1)
    cur.splice(cur.indexOf(targetPath), 0, drag)
    saveNavOrder(cur)
    setDrag(null); setOver(null)
  }

  return (
    <aside className={'sidebar' + (collapsed ? ' collapsed' : '')}>
      <button className="sbtoggle" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expand' : 'Collapse'}>
        {collapsed ? '»' : '«'}
      </button>
      {sideNav.map(([to, label, icon]) => (
        <NavLink key={to} to={to} title={dev ? label + ' — drag to re-arrange' : label}
          className={({ isActive }) =>
            (isActive ? 'active' : '') + (drag === to ? ' nav-dragging' : '') + (over === to && drag && drag !== to ? ' nav-over' : '')}
          draggable={dev || undefined}
          onDragStart={dev ? e => { e.dataTransfer.setData('text/plain', to); setDrag(to) } : undefined}
          onDragEnd={dev ? () => { setDrag(null); setOver(null) } : undefined}
          onDragOver={dev ? e => e.preventDefault() : undefined}
          onDragEnter={dev ? () => setOver(to) : undefined}
          onDrop={dev ? e => { e.preventDefault(); onDrop(to) } : undefined}>
          <span className="ico"><Icon name={icon} /></span><span className="lbl">{label}</span>
        </NavLink>
      ))}
    </aside>
  )
}

export default function App() {
  const [logoOk, setLogoOk] = useState(true)
  return (
    <AuthProvider>
      <LevelsProvider>
        <CopyProvider>
        <IconSetProvider>
        <StyleModeProvider>
        <div className="app">
          <header className="top">
            {logoOk
              ? <img className="brandlogo" src="/logo.png" alt="RAIVANUA — Digital Village Enabler" onError={() => setLogoOk(false)} />
              : <span className="brand">🌺 RAIVANUA</span>}
            <span className="badge">Village: Bagasau</span>
            <nav>
              {TOP_NAV.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
              ))}
            </nav>
            <span className="hdrtools"><DevEditButton /><DevStyleToggle /></span>
            <AuthArea />
          </header>

          <div className="layout">
            <Sidebar />

            <main>
              <Routes>
                <Route path="/" element={<Internet />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/kacikacivaki" element={<Kacikacivaki />} />
                <Route path="/vanua" element={<Hierarchy />} />
                <Route path="/government" element={<Government />} />
                <Route path="/vscorecard" element={<VScorecard />} />
                <Route path="/outcomes" element={<Outcomes />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/fundraising" element={<Fundraising />} />
                <Route path="/financials" element={<Financials />} />
                <Route path="/minutes" element={<Minutes />} />
                <Route path="/lands" element={<Lands />} />
                <Route path="/agreements" element={<Agreements />} />
                <Route path="/trade" element={<Trade />} />
                <Route path="/emergencies" element={<Emergencies />} />
                <Route path="/admin" element={<RequireRole check={isVillageAdmin} who="Village Admins"><Admin /></RequireRole>} />
                <Route path="/dev" element={<RequireRole check={isDev} who="App Admins (DEV)"><Dev /></RequireRole>} />
              </Routes>
            </main>
          </div>
        </div>
        </StyleModeProvider>
        </IconSetProvider>
        </CopyProvider>
      </LevelsProvider>
    </AuthProvider>
  )
}
