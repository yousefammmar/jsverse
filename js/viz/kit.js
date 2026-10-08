// Shared helpers for the visualizer exhibits: element builder, exhibit frame, safe literal parser, value formatting.
import { award } from '../xp.js';
import { reducedMotion } from '../settings.js';
import { ic as icRaw } from '../icons.js';
export { reducedMotion };
/** Icon as a DOM node (safe to pass as an h() child). */
export const ic = (n, c) => { const t = document.createElement('template'); t.innerHTML = icRaw(n, c); return t.content.firstChild; };

/** h('div.cls#id', {attr, on:{click}, text}, ...children). Text always goes through textContent. */
export function h(tag, props, ...kids) {
  const m = /^([a-z0-9]+)((?:[.#][\w-]+)*)$/i.exec(tag) || [, 'div', ''];
  const e = document.createElement(m[1]);
  (m[2].match(/[.#][\w-]+/g) || []).forEach(s => s[0] === '.' ? e.classList.add(s.slice(1)) : (e.id = s.slice(1)));
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'text') e.textContent = v;
    else if (k === 'html') e.innerHTML = v;            // only ever used with trusted static strings / icons
    else if (k === 'on') for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn);
    else if (k === 'style') e.style.cssText = v;
    else if (k in e && k !== 'list' && typeof v !== 'string') e[k] = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => c != null && c !== false && e.append(c));
  return e;
}
export const wait = ms => new Promise(r => setTimeout(r, reducedMotion() ? 0 : ms));
export const sleep = ms => new Promise(r => setTimeout(r, ms));
export const live = el => el.isConnected;

/** Exhibit frame: stage + "What to notice" + "Try this" chips + live region. Returns { stage, say, touch }. */
export function frame(el, { id, title, notice, tries = [], compact = false }) {
  el.replaceChildren();
  const stage = h('div.viz-stage');
  const status = h('div.sr-only', { 'aria-live': 'polite', role: 'status' });
  const touch = () => { if (award('viz:' + id, 10, `Explored the ${title} visualizer`)) dispatchEvent(new CustomEvent('viz:visited', { detail: id })); };
  const say = m => { status.textContent = ''; setTimeout(() => status.textContent = m, 30); };
  const chips = tries.map(t => h('button.viz-try', { type: 'button', on: { click: async () => { chips.forEach(c => c.disabled = true); try { await t.run(); touch(); } finally { chips.forEach(c => c.disabled = false); } } } }, ic('sparkles'), t.label));
  el.append(h('div.viz-frame' + (compact ? '.compact' : ''), null, stage,
    h('div.viz-foot', null,
      h('p.viz-notice', null, h('b', { text: 'What to notice' }), notice),
      tries.length ? h('div.viz-tries', null, h('span.viz-tries-l', { text: 'Try this' }), chips) : null),
    status));
  return { stage, say, touch };
}

/** Tiny literal parser. Never evals. Returns {ok, value} or {ok:false, error}. */
export function parseLiteral(src) {
  const s = String(src).trim();
  if (!s) return { ok: false, error: 'Type a value first.' };
  const words = { undefined: undefined, null: null, true: true, false: false, NaN: NaN, Infinity: Infinity, '-Infinity': -Infinity };
  if (s in words) return { ok: true, value: words[s] };
  if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return { ok: true, value: Number(s) };
  if (/^-?\d+n$/.test(s)) return { ok: true, value: BigInt(s.slice(0, -1)) };
  if (/^0x[0-9a-f]+$/i.test(s)) return { ok: true, value: Number(s) };
  const q = s[0];
  if ((q === '"' || q === "'" || q === '`') && s.length > 1 && s.at(-1) === q) {
    if (q === '`' && s.includes('${')) return { ok: false, error: 'Template placeholders need real code; try a plain string.' };
    const inner = s.slice(1, -1);
    try {
      if (q === '"') return { ok: true, value: JSON.parse(s) };
      const esc = inner.replace(/\\(['`])/g, '$1').replace(/(^|[^\\])"/g, '$1\\"').replace(/\n/g, '\\n');
      return { ok: true, value: JSON.parse('"' + esc + '"') };
    } catch { return { ok: false, error: 'That string has a stray quote or backslash.' }; }
  }
  if (q === '[' || q === '{') {
    for (const t of [s, s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":').replace(/'([^'"]*)'/g, '"$1"')]) {
      try { return { ok: true, value: JSON.parse(t) }; } catch {}
    }
    return { ok: false, error: 'Not valid array/object syntax (try {"a": 1} or [1, 2]).' };
  }
  return { ok: false, error: 'Not a literal. Try 42, "text", true, null, [1,2] or {"a":1}.' };
}

/** Human display of any value, the way a console would show it. */
export function fmt(v) {
  const t = typeof v;
  if (t === 'string') return JSON.stringify(v);
  if (t === 'bigint') return v + 'n';
  if (t === 'function') return 'ƒ ' + (v.name || 'anonymous') + '()';
  if (t === 'symbol') return v.toString();
  if (Object.is(v, -0)) return '-0';
  if (v instanceof Date) return isNaN(v) ? 'Invalid Date' : `Date(${v.toISOString()})`;
  if (v && t === 'object') { try { return JSON.stringify(v); } catch { return String(v); } }
  return String(v);
}
export const typeName = v => v === null ? 'null' : Array.isArray(v) ? 'array' : v instanceof Date ? 'date' : typeof v;
export const typeChip = v => h('span.viz-ty', { 'data-t': typeName(v), text: typeName(v) });
export const isIdent = k => /^[A-Za-z_$][\w$]*$/.test(k);
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
/** Syntax-highlighted code line as an element (uses the site highlighter, which escapes). */
import { highlight } from '../editor.js';
export const code = (src, cls = '') => h('pre.viz-code' + (cls ? '.' + cls : ''), { html: `<code>${highlight(src)}</code>` });
export const setCode = (pre, src) => { pre.innerHTML = `<code>${highlight(src)}</code>`; };
