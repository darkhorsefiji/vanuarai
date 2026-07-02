// Sidebar menu registry + DEV-rearrangeable order (persisted per browser).
export const SIDE_NAV = [
  ["/profile", "Profile", "profile"],
  ["/kacikacivaki", "Kacikacivaki", "kacikacivaki"],
  ["/vanua", "Vanua", "vanua"],
  ["/government", "Government", "government"],
  ["/vscorecard", "Strategy", "vscorecard"],
  ["/outcomes", "Scorecard", "vscorecard"],
  ["/lands", "Lands", "lands"],
  ["/agreements", "Agreements", "agreements"],
  ["/projects", "Projects", "projects"],
  ["/trade", "Trade", "trade"],
  ["/fundraising", "Fundraising", "fundraising"],
  ["/financials", "Financials", "financials"],
  ["/minutes", "Minutes", "minutes"],
  ["/emergencies", "Emergencies", "emergencies"],
];

const KEY = "vr_nav_order";
const EVT = "vr:nav-order";

export function loadNavOrder() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}
export function saveNavOrder(paths) {
  localStorage.setItem(KEY, JSON.stringify(paths));
  window.dispatchEvent(new Event(EVT));
}
export function resetNavOrder() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}
export function onNavOrderChange(handler) {
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}
// Saved order first (ignoring unknown paths), then any items not yet in the saved list.
export function orderedNav(order) {
  if (!order) return SIDE_NAV;
  const byPath = Object.fromEntries(SIDE_NAV.map((it) => [it[0], it]));
  const seen = new Set();
  const out = [];
  order.forEach((p) => {
    if (byPath[p] && !seen.has(p)) {
      out.push(byPath[p]);
      seen.add(p);
    }
  });
  SIDE_NAV.forEach((it) => {
    if (!seen.has(it[0])) out.push(it);
  });
  return out;
}
