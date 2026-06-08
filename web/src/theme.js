// Live theme editor: a registry of editable CSS variables + localStorage persistence.
export const THEME_GROUPS = [
  {
    group: 'Top navigation', items: [
      { k: '--nav-c1', l: 'Gradient start', t: 'color', d: '#2b2e32' },
      { k: '--nav-c2', l: 'Gradient middle', t: 'color', d: '#3a3e43' },
      { k: '--nav-c3', l: 'Gradient end', t: 'color', d: '#919497' },
      { k: '--nav-mid', l: 'Transition point', t: 'range', d: '35', min: 0, max: 100, unit: '%' },
      { k: '--nav-text', l: 'Link text', t: 'color', d: '#eaf0f3' },
    ],
  },
  {
    group: 'Sidebar', items: [
      { k: '--side-bg', l: 'Background', t: 'color', d: '#1f444b' },
      { k: '--side-text', l: 'Text', t: 'color', d: '#e7f1f1' },
      { k: '--side-active', l: 'Active item', t: 'color', d: '#3a8f9c' },
    ],
  },
  {
    group: 'Typography', items: [
      { k: '--head-color', l: 'Headings', t: 'color', d: '#27545c' },
      { k: '--ink', l: 'Body text', t: 'color', d: '#2f4a51' },
    ],
  },
  {
    group: 'Surfaces & accents', items: [
      { k: '--body-bg', l: 'Page background', t: 'color', d: '#eef5f2' },
      { k: '--card', l: 'Card background', t: 'color', d: '#ffffff' },
      { k: '--line', l: 'Borders', t: 'color', d: '#e8edee' },
      { k: '--ocean', l: 'Primary (teal)', t: 'color', d: '#3a8f9c' },
      { k: '--clay', l: 'Buttons (coral)', t: 'color', d: '#d98a6b' },
    ],
  },
]

const KEY = 'vr_theme'

export function loadOverrides() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} }
}
export function applyOverrides(o) {
  const root = document.documentElement
  Object.entries(o || {}).forEach(([k, v]) => root.style.setProperty(k, v))
}
export function setVar(k, v) {
  document.documentElement.style.setProperty(k, v)
  const o = loadOverrides(); o[k] = v
  localStorage.setItem(KEY, JSON.stringify(o))
}
export function resetVars() {
  const o = loadOverrides()
  const root = document.documentElement
  Object.keys(o).forEach(k => root.style.removeProperty(k))
  localStorage.removeItem(KEY)
}
