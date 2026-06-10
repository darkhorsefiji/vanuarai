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
      { k: '--nav-c1', l: 'Gradient start', t: 'color', d: '#0c4651' },
      { k: '--nav-c2', l: 'Gradient middle', t: 'color', d: '#0c7b86' },
      { k: '--nav-c3', l: 'Gradient end', t: 'color', d: '#10a0ad' },
      { k: '--nav-mid', l: 'Transition point', t: 'range', d: '42', min: 0, max: 100, unit: '%' },
      { k: '--nav-text', l: 'Link text', t: 'color', d: '#eafaf9' },
    ],
  },
  {
    group: 'Sidebar', items: [
      { k: '--side-c1', l: 'Gradient start', t: 'color', d: '#0e5560' },
      { k: '--side-c2', l: 'Gradient end', t: 'color', d: '#0a363d' },
      { k: '--side-angle', l: 'Direction', t: 'range', d: '180', min: 0, max: 360, unit: 'deg' },
      { k: '--side-text', l: 'Text', t: 'color', d: '#e7f3f1' },
      { k: '--side-active', l: 'Active item', t: 'color', d: '#0e98a5' },
    ],
  },
  {
    group: 'Welcome banner', items: [
      { k: '--hero-c1', l: 'Gradient start', t: 'color', d: '#0c4651' },
      { k: '--hero-c2', l: 'Gradient middle', t: 'color', d: '#0e98a5' },
      { k: '--hero-c3', l: 'Gradient end', t: 'color', d: '#2bb6a6' },
      { k: '--hero-mid', l: 'Middle stop', t: 'range', d: '52', min: 0, max: 100, unit: '%' },
      { k: '--hero-angle', l: 'Direction', t: 'range', d: '120', min: 0, max: 360, unit: 'deg' },
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
      { k: '--head-spacing', l: 'Heading letter-spacing', t: 'range', d: '0', min: -2, max: 8, step: 0.5, unit: 'px' },
      { k: '--body-spacing', l: 'Body letter-spacing', t: 'range', d: '0', min: -1, max: 6, step: 0.5, unit: 'px' },
      { k: '--body-leading', l: 'Body line spacing', t: 'range', d: '1.5', min: 1, max: 2.2, step: 0.05 },
      { k: '--head-color', l: 'Heading colour', t: 'color', d: '#0c4651' },
      { k: '--ink', l: 'Body text colour', t: 'color', d: '#21464c' },
    ],
  },
  {
    group: 'Surfaces & accents', items: [
      { k: '--body-bg', l: 'Page background', t: 'color', d: '#edf6f3' },
      { k: '--ocean', l: 'Primary (lagoon teal)', t: 'color', d: '#0e98a5' },
      { k: '--clay', l: 'Accent (hibiscus coral)', t: 'color', d: '#ef6f56' },
    ],
  },
  {
    group: 'Progress bars', items: [
      { k: '--bar-prog', l: 'Progress bar fill', t: 'color', d: '#46a877' },
      { k: '--bar-fin', l: 'Spent bar fill', t: 'color', d: '#0e98a5' },
      { k: '--bar-track', l: 'Track (empty)', t: 'color', d: '#e9f1ef' },
      { k: '--bar-height', l: 'Bar thickness', t: 'range', d: '9', min: 4, max: 20, step: 1, unit: 'px' },
    ],
  },
  {
    group: 'Status pills', items: [
      { k: '--pill-active-bg', l: 'Active background', t: 'color', d: '#daeee4' },
      { k: '--pill-active-text', l: 'Active text', t: 'color', d: '#2f7a52' },
      { k: '--pill-expired-bg', l: 'Expired background', t: 'color', d: '#e9e9e6' },
      { k: '--pill-expired-text', l: 'Expired text', t: 'color', d: '#8a8f8d' },
      { k: '--pill-radius', l: 'Corner radius', t: 'range', d: '30', min: 0, max: 30, step: 1, unit: 'px' },
      { k: '--pill-font-size', l: 'Font size', t: 'range', d: '11', min: 9, max: 14, step: 0.5, unit: 'px' },
    ],
  },
  {
    group: 'Cards', items: [
      { k: '--card', l: 'Background', t: 'color', d: '#ffffff' },
      { k: '--line', l: 'Border', t: 'color', d: '#e6eeec' },
      { k: '--card-radius', l: 'Corner radius', t: 'range', d: '16', min: 0, max: 28, step: 1, unit: 'px' },
      { k: '--card-pad', l: 'Padding', t: 'range', d: '18', min: 8, max: 32, step: 1, unit: 'px' },
      { k: '--card-accent1', l: 'Accent bar start', t: 'color', d: '#0e98a5' },
      { k: '--card-accent2', l: 'Accent bar end', t: 'color', d: '#f4a72c' },
    ],
  },
  {
    group: 'Buttons', items: [
      { k: '--btn-secondary-bg', l: 'Secondary (Explore) colour', t: 'color', d: '#0e98a5' },
      { k: '--btn-primary-bg', l: 'Primary colour', t: 'color', d: '#ef6f56' },
      { k: '--btn-text', l: 'Text colour', t: 'color', d: '#ffffff' },
      { k: '--btn-radius', l: 'Corner radius', t: 'range', d: '30', min: 0, max: 30, step: 1, unit: 'px' },
      { k: '--btn-pad-y', l: 'Padding (vertical)', t: 'range', d: '10', min: 4, max: 20, step: 1, unit: 'px' },
      { k: '--btn-pad-x', l: 'Padding (horizontal)', t: 'range', d: '18', min: 6, max: 40, step: 1, unit: 'px' },
      { k: '--btn-font-size', l: 'Font size', t: 'range', d: '14', min: 11, max: 20, step: 1, unit: 'px' },
      { k: '--btn-weight', l: 'Font weight', t: 'range', d: '600', min: 100, max: 900, step: 100 },
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
