// Live theme editor: a registry of editable CSS variables + localStorage persistence.
import { GOOGLE_FONTS } from './googleFonts'
const AVENIR = 'Avenir,"Avenir Next","Nunito Sans","Segoe UI",sans-serif'

export const FONT_OPTIONS = [
  ['Avenir / Nunito Sans', AVENIR],
  ['Nunito Sans', '"Nunito Sans",sans-serif'],
  ['Montserrat', 'Montserrat,sans-serif'],
  ['Poppins', 'Poppins,sans-serif'],
  ['Inter', 'Inter,sans-serif'],
  ['System (Segoe UI)', '"Segoe UI",system-ui,Arial,sans-serif'],
  ['Georgia (serif)', 'Georgia,"Times New Roman",serif'],
]

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
      { k: '--side-c1', l: 'Gradient start', t: 'color', d: '#235059' },
      { k: '--side-c2', l: 'Gradient end', t: 'color', d: '#16363d' },
      { k: '--side-angle', l: 'Direction', t: 'range', d: '180', min: 0, max: 360, unit: 'deg' },
      { k: '--side-text', l: 'Text', t: 'color', d: '#e7f1f1' },
      { k: '--side-active', l: 'Active item', t: 'color', d: '#3a8f9c' },
    ],
  },
  {
    group: 'Typography', items: [
      { k: '--head-font', l: 'Heading font', t: 'font', d: AVENIR },
      { k: '--head-weight', l: 'Heading weight', t: 'range', d: '700', min: 100, max: 900, step: 100 },
      { k: '--head-style', l: 'Heading italic', t: 'toggle', d: 'normal', on: 'italic' },
      { k: '--font', l: 'Body font', t: 'font', d: AVENIR },
      { k: '--body-weight', l: 'Body weight', t: 'range', d: '400', min: 100, max: 900, step: 100 },
      { k: '--body-style', l: 'Body italic', t: 'toggle', d: 'normal', on: 'italic' },
      { k: '--head-color', l: 'Heading colour', t: 'color', d: '#27545c' },
      { k: '--ink', l: 'Body text colour', t: 'color', d: '#2f4a51' },
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

// ---- Google Fonts: dynamic loading + helpers ----
const GF_SET = new Set(GOOGLE_FONTS)
const _loaded = new Set()
export function ensureFont(family) {
  if (!family || !GF_SET.has(family) || _loaded.has(family)) return
  _loaded.add(family)
  const l = document.createElement('link')
  l.rel = 'stylesheet'
  // Request the family without forcing weights it may not have (avoids css2 400s).
  l.href = 'https://fonts.googleapis.com/css2?family=' + family.replace(/ /g, '+') + '&display=swap'
  document.head.appendChild(l)
}
export const fontStack = family => `"${family}", sans-serif`
export function familyFromStack(stack) {
  const m = String(stack || '').match(/^\s*"?([^",]+)"?/)
  return m ? m[1].trim() : ''
}
