// XP, streak, level, achievements and activity log. All state lives in localStorage via store.
// Existing keys are preserved: xp, awarded[], streak{n,d}, done[], katas[], best, lab.  New keys: ach{}, activity[], ach-init.
import { ic } from './icons.js';
import { store } from './store.js';
import { QUOTES, BADGES, XP } from './data/gamification.js';
import { ACHIEVEMENTS, ACH_BY_ID, badgeSvg } from './data/achievements.js';
import { confetti, countUp } from './motion.js';
import { LESSONS } from './data/lessons.js';
export { BADGES, XP };
export const quoteOfDay = () => QUOTES[Math.floor(Date.now() / 864e5) % QUOTES.length];

const day = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const level = xp => Math.floor(xp / 100) + 1;

export function state() {
  const xp = store.get('xp', 0), done = store.get('done', []);
  return { xp, level: level(xp), into: xp % 100, streak: store.get('streak', { n: 0 }).n,
    lessons: done.length, lessonTotal: LESSONS.length, doneSet: new Set(done), katas: store.get('katas', []).length, kataIds: new Set(store.get('katas', [])), lab: store.get('lab', false),
    ach: store.get('ach', {}) };
}

/** Counts a visit towards the daily streak (once per day). */
export function touchStreak() {
  const s = store.get('streak', { n: 0, d: '' }), t = day();
  if (s.d === t) return;
  store.set('streak', { n: s.d === day(Date.now() - 864e5) ? s.n + 1 : 1, d: t });
}

/* ---------- activity log (real data for the dashboard) ---------- */
export function log(type, label, xp = 0) {
  const a = store.get('activity', []); a.push({ t: Date.now(), type, label, xp }); store.set('activity', a.slice(-300));
}
export const activity = () => store.get('activity', []);
/** Last 7 days (oldest first): {key, label, xp, count}. */
export function weekActivity() {
  const a = activity(), out = [];
  for (let i = 6; i >= 0; i--) { const t = Date.now() - i * 864e5, k = day(t); out.push({ key: k, label: new Date(t).toLocaleDateString([], { weekday: 'short' }), xp: 0, count: 0 }); }
  a.forEach(e => { const d = out.find(x => x.key === day(e.t)); if (d) { d.count++; d.xp += e.xp || 0; } });
  return out;
}

/* ---------- XP ---------- */
/** Award XP once per key (so re-clicking never farms points). Returns true when newly awarded. */
export function award(key, n, msg, opts = {}) {
  const got = store.get('awarded', []);
  if (got.includes(key)) return false;
  const before = level(store.get('xp', 0));
  store.set('awarded', [...got, key]); store.set('xp', store.get('xp', 0) + n);
  const after = level(store.get('xp', 0)), up = after > before;
  log('xp', msg, n);
  toast({ title: up ? `Level ${after}!` : `+${n} XP`, sub: up ? `${msg} · +${n} XP` : msg, kind: 'xp', big: up, badge: opts.badge });
  if (up) { levelUp(after); }
  paint(true);
  evaluate();
  return true;
}
function levelUp(lv) { confetti(60); dispatchEvent(new CustomEvent('jsv:levelup', { detail: lv })); }

/** Show a toast. Accepts {title, sub, kind, big, badge} or a plain string (legacy). */
export function toast(o, big) {
  if (typeof o === 'string') o = { title: o, big };
  let host = document.querySelector('.toasts');
  if (!host) { host = document.createElement('div'); host.className = 'toasts'; host.setAttribute('aria-live', 'polite'); host.setAttribute('role', 'status'); document.body.append(host); }
  const d = document.createElement('div'); d.className = `toast ${o.kind || ''} ${o.big ? 'big' : ''}`;
  d.innerHTML = `${o.badge ? `<div class="tbadge">${badgeSvg(o.badge)}</div>` : ''}<div><b></b><span></span></div>`;
  d.querySelector('b').textContent = o.title; d.querySelector('span').textContent = o.sub || '';
  host.append(d); if (o.big) confetti();
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 400); }, 3800);
}

/* ---------- achievements ---------- */
/** Unlock an achievement once. Returns true when newly unlocked. */
export function unlock(id) {
  const a = ACH_BY_ID[id]; if (!a) return false;
  const got = store.get('ach', {}); if (got[id]) return false;
  got[id] = Date.now(); store.set('ach', got);
  log('ach', a.name);
  if (a.xp) award('ach:' + id, a.xp, `Achievement unlocked: ${a.name}`, { badge: id });
  else toast({ title: 'Achievement unlocked', sub: a.name, kind: 'xp', badge: id });
  confetti(24);
  dispatchEvent(new CustomEvent('jsv:ach', { detail: id }));
  return true;
}
export const hasAch = id => !!store.get('ach', {})[id];
/** Unlock derived achievements. The first time ever it records existing progress silently so nobody gets a toast avalanche. */
export function evaluate() {
  const s = state();
  if (!store.get('ach-init', false)) {
    const got = store.get('ach', {}); ACHIEVEMENTS.forEach(a => { if (a.check && a.check(s)) got[a.id] = got[a.id] || Date.now(); });
    store.set('ach', got); store.set('ach-init', true); return;
  }
  ACHIEVEMENTS.forEach(a => { if (a.check && !s.ach[a.id] && a.check(s)) unlock(a.id); });
}

/* ---------- header chips ---------- */
export function paint(animate) {
  const s = state(), x = document.getElementById('xp-val'), l = document.getElementById('xp-lvl'), st = document.getElementById('streak-val');
  if (x) animate ? countUp(x, s.xp, { ms: 700 }) : (x.textContent = s.xp.toLocaleString(), x.dataset.v = s.xp);
  if (l) l.textContent = `Lvl ${s.level}`;
  if (st) st.textContent = `${s.streak} day${s.streak === 1 ? '' : 's'}`;
  const chip = document.getElementById('xp-chip'); if (chip) chip.title = `${s.into}/100 XP to level ${s.level + 1}`;
}
