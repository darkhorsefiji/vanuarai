// Pasifika monotone icon sets for the sidebar.
// Single-colour line icons on a 24×24 grid; they paint with `currentColor`,
// so they inherit the sidebar link colour (and the active-item colour) for free.
// Two interchangeable sets — pick one live on the Dev page.
import { createContext, useContext, useState, useCallback } from 'react'

// ── Set A — "Artefacts": literal Pacific / Fijian objects, fine line ──────────
const ARTEFACTS = {
  // Frangipani / tiare flower — village identity
  profile: (
    <>
      <circle cx="12" cy="6.6" r="2.5" />
      <circle cx="16.9" cy="10.2" r="2.5" />
      <circle cx="15" cy="16" r="2.5" />
      <circle cx="9" cy="16" r="2.5" />
      <circle cx="7.1" cy="10.2" r="2.5" />
      <circle cx="12" cy="11.6" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  // Honu (sea turtle) — kinship, longevity, lineage
  vanua: (
    <>
      <ellipse cx="12" cy="12.4" rx="4.8" ry="4.1" />
      <circle cx="12" cy="6" r="1.6" />
      <path d="M7.2 9.4 L5.3 7.7" />
      <path d="M16.8 9.4 L18.7 7.7" />
      <path d="M8.2 15.6 L6.8 17.6" />
      <path d="M15.8 15.6 L17.2 17.6" />
      <path d="M12 8.4 L12 16.4" />
      <path d="M7.4 12.4 L16.6 12.4" />
    </>
  ),
  // Bure (meeting house) with a rounded thatch roof
  government: (
    <>
      <path d="M4 11 Q12 4 20 11" />
      <path d="M6 10.7 L6 18" />
      <path d="M18 10.7 L18 18" />
      <path d="M4.5 18 L19.5 18" />
      <path d="M9.5 18 L9.5 13.5 L14.5 13.5 L14.5 18" />
      <path d="M12 6.3 L12 4.4" />
    </>
  ),
  // Island hill with a palm, over water
  lands: (
    <>
      <path d="M7.5 16 Q9.5 9.5 12 9.5 Q14.5 9.5 16.5 16 Z" />
      <path d="M12 9.5 L12 6" />
      <path d="M12 6 Q9.2 4.8 7.6 6.4" />
      <path d="M12 6 Q14.8 4.8 16.4 6.4" />
      <path d="M12 6 Q11.4 4 12.4 3" />
      <path d="M3 18.6 Q6 16.9 9 18.6 T15 18.6 T21 18.6" />
    </>
  ),
  // Tabua (whale's tooth) on a magimagi cord — seals a covenant
  agreements: (
    <>
      <path d="M8.5 7 Q6 10 8 13.5 Q9.6 16.3 11.6 16.9 Q13 17.3 13.4 16 Q13.9 14 12.6 11.4 Q10.8 7.8 8.5 7 Z" />
      <path d="M7.4 6.6 Q12 4 16.6 6.6" />
      <circle cx="7" cy="6.7" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="17" cy="6.7" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  // Outrigger canoe (vaka)
  projects: (
    <>
      <path d="M3.5 13.4 Q12 18.4 20.5 13.4" />
      <path d="M3.5 13.4 L20.5 13.4" />
      <path d="M6 18 L18 18" />
      <path d="M8.2 14.2 L9.4 18" />
      <path d="M15.8 14.2 L14.6 18" />
    </>
  ),
  // Sailing drua with a crab-claw sail — exchange by sea
  trade: (
    <>
      <path d="M4.5 18 L19.5 18" />
      <path d="M6.5 18 Q12 16.2 17.5 18" />
      <path d="M12 16.4 L12 5" />
      <path d="M12 5 Q6.5 7 8.2 13.6 Q11 11.8 12 14.8" />
    </>
  ),
  // Cowrie shell (buli) — shell-value, communal giving
  fundraising: (
    <>
      <ellipse cx="12" cy="12" rx="4.3" ry="5.8" />
      <path d="M12 6.5 L12 17.5" />
      <path d="M9.8 9 L12 9.5" />
      <path d="M9.5 11 L12 11.2" />
      <path d="M9.5 13 L12 13" />
      <path d="M9.8 15 L12 14.7" />
      <path d="M14.2 9 L12 9.5" />
      <path d="M14.5 11 L12 11.2" />
      <path d="M14.5 13 L12 13" />
      <path d="M14.2 15 L12 14.7" />
    </>
  ),
  // Woven basket (kete) holding the village's resources
  financials: (
    <>
      <path d="M5.5 9.5 L18.5 9.5 L17 18 L7 18 Z" />
      <path d="M5.5 9.5 Q12 5.8 18.5 9.5" />
      <path d="M9 9.5 L9.7 18" />
      <path d="M12 9.5 L12 18" />
      <path d="M15 9.5 L14.3 18" />
      <path d="M6.2 13 L17.8 13" />
      <path d="M6.8 16 L17.2 16" />
    </>
  ),
  // Document with a tapa zig-zag motif
  minutes: (
    <>
      <path d="M6.5 4 L14 4 L17.5 7.5 L17.5 20 L6.5 20 Z" />
      <path d="M14 4 L14 7.5 L17.5 7.5" />
      <path d="M9 8.4 L10.2 9.8 L11.4 8.4 L12.6 9.8 L13.8 8.4" />
      <path d="M9 12 L15 12" />
      <path d="M9 14.5 L15 14.5" />
      <path d="M9 17 L13 17" />
    </>
  ),
  // Davui (conch shell) being sounded — the traditional alarm
  emergencies: (
    <>
      <path d="M16 7 C19 9 18.5 13.5 15.5 15.8 C13 17.7 9 17.6 7 15.5" />
      <path d="M7 15.5 C5.5 14 5.7 11.4 7.6 10.3 C9.2 9.4 11.2 9.9 12 11.6" />
      <path d="M16 7 C13.5 6.7 11.7 7.8 11.3 10 C11 11.6 11.9 12.9 13.6 13" />
      <path d="M7 15.5 L5.4 17.4" />
      <path d="M17.8 6 Q19.4 6.7 19.2 8.4" />
      <path d="M19 4.7 Q21.4 5.9 20.8 9" />
    </>
  ),
}

// ── Set B — "Symbols": bolder, geometric / conceptual motifs ──────────────────
const SYMBOLS = {
  // Person / community member — identity
  profile: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.6 18.6 C5.6 14.6 8.6 12.6 12 12.6 C15.4 12.6 18.4 14.6 18.4 18.6" />
    </>
  ),
  // Tanoa (kava bowl) on legs — the heart of the vanua ceremony
  vanua: (
    <>
      <path d="M4.5 10.5 L19.5 10.5 C19 14.7 15.9 16.8 12 16.8 C8.1 16.8 5 14.7 4.5 10.5 Z" />
      <path d="M7 16.2 L6 19" />
      <path d="M17 16.2 L18 19" />
      <path d="M12 16.8 L12 19" />
    </>
  ),
  // Peaked council house — chiefly authority (sharp roof)
  government: (
    <>
      <path d="M4 11 L12 4 L20 11 Z" />
      <path d="M6 11 L6 18" />
      <path d="M18 11 L18 18" />
      <path d="M4.5 18 L19.5 18" />
      <path d="M12 4 L12 2.4" />
      <path d="M10 18 L10 14 L14 14 L14 18" />
    </>
  ),
  // Mountain range + sun — the land
  lands: (
    <>
      <circle cx="17" cy="7" r="2.2" />
      <path d="M3 18 L9 9 L12.5 14 L15.5 10.5 L21 18 Z" />
    </>
  ),
  // Interlocking rings — a binding union / agreement
  agreements: (
    <>
      <circle cx="9" cy="12" r="4.3" />
      <circle cx="15" cy="12" r="4.3" />
    </>
  ),
  // Taro shoot — growth & development
  projects: (
    <>
      <path d="M12 19 L12 11" />
      <path d="M12 11 C9 11 6.6 9.2 6.6 6.6 C9.6 6.6 12 8.4 12 11 Z" />
      <path d="M12 11 C15 11 17.4 9.2 17.4 6.6 C14.4 6.6 12 8.4 12 11 Z" />
      <path d="M8 19 L16 19" />
    </>
  ),
  // Exchange arrows — trade
  trade: (
    <>
      <path d="M5 9 L17 9" />
      <path d="M14 6 L17 9 L14 12" />
      <path d="M19 15 L7 15" />
      <path d="M10 12 L7 15 L10 18" />
    </>
  ),
  // Cupped hands offering a gift — giving / fundraising
  fundraising: (
    <>
      <circle cx="12" cy="8.4" r="2.4" />
      <path d="M5.8 12.8 C5.8 16 8.6 18.2 12 18.2 C15.4 18.2 18.2 16 18.2 12.8" />
      <path d="M5.8 12.8 L4.4 10.8" />
      <path d="M18.2 12.8 L19.6 10.8" />
    </>
  ),
  // Coin stack — the village's funds
  financials: (
    <>
      <ellipse cx="12" cy="8" rx="6" ry="2.3" />
      <path d="M6 8 L6 11 C6 12.3 8.7 13.3 12 13.3 C15.3 13.3 18 12.3 18 11 L18 8" />
      <path d="M6 11.6 L6 14.6 C6 15.9 8.7 16.9 12 16.9 C15.3 16.9 18 15.9 18 14.6 L18 11.6" />
    </>
  ),
  // Talanoa speech bubble — dialogue recorded as minutes
  minutes: (
    <>
      <rect x="4" y="6" width="13" height="8" rx="2.5" />
      <path d="M8 14 L7 17 L11 14" />
      <path d="M7 9 L14 9" />
      <path d="M7 11.4 L12 11.4" />
    </>
  ),
  // Cyclone swirl — the Pacific's signature emergency
  emergencies: (
    <>
      <path d="M12 4 C16.4 4 20 7.6 20 12 C20 15.3 17.3 18 14 18 C11.8 18 10 16.2 10 14 C10 12.3 11.3 11 13 11 C14.1 11 15 11.9 15 13" />
      <path d="M12 20 C7.6 20 4 16.4 4 12 C4 8.7 6.7 6 10 6 C12.2 6 14 7.8 14 10 C14 11.7 12.7 13 11 13 C9.9 13 9 12.1 9 11" />
    </>
  ),
}

export const ICON_SETS = {
  artefacts: { label: 'Set A — Artefacts', hint: 'Literal cultural objects, fine line', stroke: 1.6, paths: ARTEFACTS },
  symbols: { label: 'Set B — Symbols', hint: 'Bolder, geometric / conceptual', stroke: 1.9, paths: SYMBOLS },
}
const DEFAULT_SET = 'artefacts'

// Sidebar order + display labels (used by the Dev comparison grid)
export const ICON_ITEMS = [
  ['profile', 'Profile'], ['vanua', 'Vanua'], ['government', 'Government'],
  ['lands', 'Lands'], ['agreements', 'Agreements'], ['projects', 'Projects'],
  ['trade', 'Trade'], ['fundraising', 'Fundraising'], ['financials', 'Financials'],
  ['minutes', 'Minutes'], ['emergencies', 'Emergencies'],
]

// ── Selection state (live-switchable, persisted) ──────────────────────────────
const SET_KEY = 'vr_iconset'
const IconSetCtx = createContext(null)
export const useIconSet = () => useContext(IconSetCtx)

export function IconSetProvider({ children }) {
  const [setId, setSetId] = useState(() => localStorage.getItem(SET_KEY) || DEFAULT_SET)
  const choose = useCallback(id => {
    if (!ICON_SETS[id]) return
    localStorage.setItem(SET_KEY, id)
    setSetId(id)
  }, [])
  return <IconSetCtx.Provider value={{ setId, choose }}>{children}</IconSetCtx.Provider>
}

export function Icon({ name, size = 22, set }) {
  const ctx = useIconSet()
  const id = set || (ctx ? ctx.setId : DEFAULT_SET)
  const def = ICON_SETS[id] || ICON_SETS[DEFAULT_SET]
  const body = def.paths[name]
  if (!body) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={def.stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {body}
    </svg>
  )
}
