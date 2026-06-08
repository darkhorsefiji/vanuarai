// Pasifika monotone icon set for the sidebar.
// Single-colour line icons drawn on a 24×24 grid; they paint with `currentColor`
// so they inherit the sidebar link colour (and the active-item colour) for free.
// Each motif is chosen from Pacific / Fijian material culture.

const PATHS = {
  // Profile — frangipani / tiare flower (village identity)
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
  // Vanua — honu (sea turtle): kinship, longevity, lineage
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
  // Government — bure (meeting house) with a rounded thatch roof
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
  // Lands — island hill with a palm, over water
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
  // Agreements — tabua (whale's tooth) on a magimagi cord: seals a covenant
  agreements: (
    <>
      <path d="M8.5 7 Q6 10 8 13.5 Q9.6 16.3 11.6 16.9 Q13 17.3 13.4 16 Q13.9 14 12.6 11.4 Q10.8 7.8 8.5 7 Z" />
      <path d="M7.4 6.6 Q12 4 16.6 6.6" />
      <circle cx="7" cy="6.7" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="17" cy="6.7" r="0.7" fill="currentColor" stroke="none" />
    </>
  ),
  // Projects — outrigger canoe (vaka) under construction / in use
  projects: (
    <>
      <path d="M3.5 13.4 Q12 18.4 20.5 13.4" />
      <path d="M3.5 13.4 L20.5 13.4" />
      <path d="M6 18 L18 18" />
      <path d="M8.2 14.2 L9.4 18" />
      <path d="M15.8 14.2 L14.6 18" />
    </>
  ),
  // Trade — sailing drua with a crab-claw sail: exchange by sea
  trade: (
    <>
      <path d="M4.5 18 L19.5 18" />
      <path d="M6.5 18 Q12 16.2 17.5 18" />
      <path d="M12 16.4 L12 5" />
      <path d="M12 5 Q6.5 7 8.2 13.6 Q11 11.8 12 14.8" />
    </>
  ),
  // Fundraising — cowrie shell (buli): shell-value, communal giving
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
  // Financials — woven basket (kete) holding the village's resources
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
  // Minutes — document with a tapa zig-zag motif
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
  // Emergencies — davui (conch shell) being sounded: the traditional alarm
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

export function Icon({ name, size = 22 }) {
  const body = PATHS[name]
  if (!body) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {body}
    </svg>
  )
}

export const ICON_NAMES = Object.keys(PATHS)
