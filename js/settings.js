// Theme + user preferences. Theme lives under the existing 'theme' storage key (legacy values are migrated).
import { store } from './store.js';

export const THEMES = [
  ['midnight', 'Midnight Developer', 'Deep navy, mint and JavaScript yellow'],
  ['studio', 'Soft Studio', 'Warm ivory, sage and forest green'],
  ['arcade', 'Neon Arcade', 'Deep purple, electric mint and yellow']
];
const LEGACY = { dark: 'midnight', light: 'studio' };
const DEFAULTS = { mascot: true, motion: true };

export function getTheme() {
  const q = new URLSearchParams(location.search).get('theme');
  let t = q || store.get('theme', null);
  t = LEGACY[t] || t;
  if (!THEMES.some(x => x[0] === t)) t = matchMedia('(prefers-color-scheme: light)').matches ? 'studio' : 'midnight';
  return t;
}
export function setTheme(t) {
  document.documentElement.dataset.theme = t; store.set('theme', t);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#08171F');
  dispatchEvent(new CustomEvent('jsv:theme', { detail: t }));
}
export const getSettings = () => ({ ...DEFAULTS, ...store.get('settings', {}) });
export function setSetting(k, v) { store.set('settings', { ...getSettings(), [k]: v }); applySettings(); dispatchEvent(new CustomEvent('jsv:settings')); }
export function applySettings() { document.documentElement.dataset.motion = getSettings().motion ? 'on' : 'off'; }
export const reducedMotion = () => !getSettings().motion || matchMedia('(prefers-reduced-motion:reduce)').matches;
/** Apply theme + settings as early as possible (call from layout before first paint where possible). */
export function initTheme() { document.documentElement.dataset.theme = getTheme(); applySettings(); }
