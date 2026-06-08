import { NavLink, Routes, Route } from 'react-router-dom'
import Internet from './pages/Internet'
import Profile from './pages/Profile'
import Hierarchy from './pages/Hierarchy'
import Projects from './pages/Projects'
import Fundraising from './pages/Fundraising'
import Financials from './pages/Financials'
import Minutes from './pages/Minutes'

const nav = [
  ['/', 'Internet'], ['/profile', 'Profile'], ['/hierarchy', 'Hierarchy'],
  ['/projects', 'Projects'], ['/fundraising', 'Fundraising'],
  ['/financials', 'Financials'], ['/minutes', 'Minutes'],
]

export default function App() {
  return (
    <>
      <header className="top">
        <span className="brand">🌺 VanuaRai</span>
        <span className="badge">Village: Bagasau</span>
        <nav>
          {nav.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Internet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/hierarchy" element={<Hierarchy />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/fundraising" element={<Fundraising />} />
          <Route path="/financials" element={<Financials />} />
          <Route path="/minutes" element={<Minutes />} />
        </Routes>
      </main>
    </>
  )
}
