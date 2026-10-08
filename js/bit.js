// BIT, the JSVERSE companion. A small creature built from coding symbols: braces for arms, a semicolon antenna.
// Comments are short, optional and can be switched off in Settings (mascot toggle).
import { store } from './store.js';
import { getSettings } from './settings.js';

const S = (c, extra = '') => `style="${c}${extra}"`;
/** BIT as inline SVG. mood: idle|happy|oops|think|party|sleepy. */
export function bitSvg(mood = 'idle', { cls = '', label = 'BIT, the JSVERSE mascot' } = {}) {
  const dark = 'var(--bit-dark,#06222a)';
  const eyes = {
    idle: `<g class="eye"><ellipse cx="24" cy="31" rx="4.4" ry="5.4" ${S(`fill:${dark}`)}/><ellipse cx="40" cy="31" rx="4.4" ry="5.4" ${S(`fill:${dark}`)}/></g><circle cx="25.6" cy="29" r="1.6" fill="#fff"/><circle cx="41.6" cy="29" r="1.6" fill="#fff"/>`,
    happy: `<path d="M19.5 33a4.6 4.6 0 0 1 9 0M35.5 33a4.6 4.6 0 0 1 9 0" fill="none" ${S(`stroke:${dark}`, ';stroke-width:3;stroke-linecap:round')}/>`,
    oops: `<g class="eye"><ellipse cx="24" cy="31" rx="5" ry="6.2" ${S(`fill:${dark}`)}/><ellipse cx="40" cy="31" rx="5" ry="6.2" ${S(`fill:${dark}`)}/></g><circle cx="25.8" cy="28.5" r="1.9" fill="#fff"/><circle cx="41.8" cy="28.5" r="1.9" fill="#fff"/>`,
    think: `<g class="eye"><ellipse cx="24" cy="31" rx="4.4" ry="5.4" ${S(`fill:${dark}`)}/><ellipse cx="40" cy="31" rx="4.4" ry="5.4" ${S(`fill:${dark}`)}/></g><circle cx="26.2" cy="28" r="1.7" fill="#fff"/><circle cx="42.2" cy="28" r="1.7" fill="#fff"/><path d="M36 22.5l9-2.2" ${S(`stroke:${dark}`, ';stroke-width:2.4;stroke-linecap:round')}/>`,
    sleepy: `<path d="M19.5 32q4.5 3.6 9 0M35.5 32q4.5 3.6 9 0" fill="none" ${S(`stroke:${dark}`, ';stroke-width:3;stroke-linecap:round')}/>`
  };
  eyes.party = eyes.happy;
  const mouth = {
    idle: `<path d="M28 40.5q4 3.2 8 0" fill="none" ${S(`stroke:${dark}`, ';stroke-width:2.2;stroke-linecap:round')}/>`,
    happy: `<path d="M26.5 39.5q5.5 7 11 0z" ${S(`fill:${dark}`)}/>`,
    oops: `<ellipse cx="32" cy="42" rx="2.6" ry="3" ${S(`fill:${dark}`)}/>`,
    think: `<path d="M28.5 41.5h7" fill="none" ${S(`stroke:${dark}`, ';stroke-width:2.2;stroke-linecap:round')}/>`,
    sleepy: `<path d="M29 41.5q3 2 6 0" fill="none" ${S(`stroke:${dark}`, ';stroke-width:2;stroke-linecap:round')}/>`
  };
  mouth.party = mouth.happy;
  const cheeks = mood === 'happy' || mood === 'party' ? `<ellipse cx="19" cy="40" rx="3" ry="2" ${S('fill:var(--coral)', ';opacity:.7')}/><ellipse cx="45" cy="40" rx="3" ry="2" ${S('fill:var(--coral)', ';opacity:.7')}/>` : '';
  const top = mood === 'party'
    ? `<path d="M26 15l6-14 6 14z" ${S('fill:var(--js)')}/><circle cx="32" cy="2" r="2.2" ${S('fill:var(--coral)')}/><path d="M28 11h8" ${S('stroke:var(--coral)', ';stroke-width:1.6')}/>`
    : `<path d="M32 14V7" fill="none" ${S('stroke:var(--mint)', ';stroke-width:2.6;stroke-linecap:round')}/><circle cx="32" cy="4.6" r="3" ${S('fill:var(--js)')}/>`;
  const zz = mood === 'sleepy' ? `<text x="46" y="14" font-size="9" font-weight="700" ${S('fill:var(--mint)')} font-family="monospace">z</text><text x="51" y="8" font-size="6" font-weight="700" ${S('fill:var(--mint)')} font-family="monospace">z</text>` : '';
  return `<svg class="bit-svg ${cls}" viewBox="0 0 64 64" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 24c-3.4 0-4.6 1.5-4.6 4.4v1.600c0 1.800-1.200 3-3 3.600 1.800.6 3 1.800 3 3.600v1.600c0 2.900 1.200 4.400 4.600 4.400" fill="none" ${S('stroke:var(--teal-rich,#095B56)', ';stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round')}/>
    <path d="M53 24c3.400 0 4.600 1.500 4.600 4.400v1.600c0 1.800 1.200 3 3 3.600-1.800.6-3 1.800-3 3.600v1.600c0 2.900-1.200 4.400-4.600 4.400" fill="none" ${S('stroke:var(--teal-rich,#095B56)', ';stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round')}/>
    <rect x="22" y="50" width="8" height="6" rx="3" ${S('fill:var(--teal-rich,#095B56)')}/><rect x="34" y="50" width="8" height="6" rx="3" ${S('fill:var(--teal-rich,#095B56)')}/>
    ${top}
    <rect x="12" y="14" width="40" height="38" rx="16" ${S('fill:var(--mint)')}/>
    <path d="M17 24c1-5 5-8 10-8" fill="none" stroke="#fff" stroke-width="2.600" stroke-linecap="round" opacity=".45"/>
    ${eyes[mood] || eyes.idle}${cheeks}${mouth[mood] || mouth.idle}${zz}
  </svg>`;
}

/* ---------- messages ---------- */
export const SAY = {
  welcome: ["Hi, I'm BIT. I live in your browser and I'm very into brackets.", 'Break things. Fix them. That is literally the whole job.'],
  success: ['Look at you. Giving computers instructions.', 'It runs. It actually runs.', 'Clean run. Zero tantrums.', 'Output achieved. Dramatic pause.'],
  moduleDone: ['Achievement unlocked: fewer mysterious errors.', 'Module complete. Your future self sends thanks.'],
  broke: ['Excellent. You are officially programming.', 'Broken code is just code that is learning.'],
  functions: ['You just taught code to do your work. Iconic.'],
  quizRight: ['Correct. Smug mode: enabled.', 'Yes. That is exactly right.'],
  quizWrong: ['Not quite, but wrong answers are how brains upload knowledge.', 'Close. Read the explanation and try the next one.'],
  hint: ['Stuck? A hint is not cheating, it is a shortcut with manners.'],
  idle: ['Did you know a semicolon is basically a very small full stop?', 'Pro tip: console.log is the original debugger.', 'Fun fact: JavaScript was created in 10 days in 1995.'],
  secret: ["console.log('You found the secret!')"]
};
let lastKey = '';
const pick = (arr, k) => { const a = arr.filter(x => x !== lastKey); const v = a[Math.floor(Math.random() * a.length)] || arr[0]; lastKey = v; return v; };
export const bitLine = key => pick(SAY[key] || [key], key);

/** Map a runtime error to a short, helpful BIT note. */
export function bitForError(err) {
  if (!err) return null;
  const m = err.message || '', n = err.name || '';
  if (n === 'TimeoutError' || n === 'LoopGuard') return { mood: 'oops', text: 'That loop never ends, and I am getting dizzy. Make sure something changes so it can stop.' };
  if (/end of input|missing \)|Unexpected token '[)}\]]'|Unterminated|Unexpected token '[(\[{]'/i.test(m)) return { mood: 'oops', text: 'One tiny bracket. One very dramatic error. Check that every ( [ { has a partner.' };
  if (n === 'SyntaxError') return { mood: 'think', text: 'JavaScript understood none of that. Want a hint? Look at the line marked in red.' };
  if (n === 'ReferenceError') { const v = m.match(/^(\S+) is not defined/); return { mood: 'think', text: v ? `"${v[1]}" is not defined. A typo, or did you forget const / let?` : 'Something is not defined. Check the spelling and where it was declared.' }; }
  if (/Assignment to constant/.test(m)) return { mood: 'think', text: 'const means constant. Use let when a value has to change.' };
  if (n === 'TypeError' && /is not a function/.test(m)) return { mood: 'think', text: 'That is not a function. Check the spelling and the parentheses.' };
  if (n === 'TypeError' && /undefined|null/.test(m)) return { mood: 'think', text: 'Something is undefined here. Print it with console.log to see what you really have.' };
  return { mood: 'think', text: `${n || 'Error'}. Read the message and the marked line, the answer is usually right there.` };
}
export const bitOk = () => ({ mood: 'happy', text: bitLine('success') });
export const mascotOn = () => getSettings().mascot;

/** Inline note for a workbench console. Returns HTML ('' when the mascot is off). */
export function bitNoteHtml(note, bad) {
  if (!mascotOn() || !note) return '';
  return `<div class="bitnote ${bad ? 'bad' : ''}" role="status">${bitSvg(note.mood)}<span>${note.text}</span></div>`;
}

/* ---------- floating bubble ---------- */
let fab, bubbleTimer, lastAt = 0;
function ensureFab() {
  if (fab) return fab;
  fab = document.createElement('div'); fab.className = 'bit-fab'; fab.setAttribute('aria-live', 'polite');
  document.body.append(fab); return fab;
}
export function bitSay(textOrKey, { mood = 'happy', ms = 6500, force = false } = {}) {
  if (!mascotOn()) return;
  const now = Date.now(); if (!force && now - lastAt < 2500) return; lastAt = now;
  const text = SAY[textOrKey] ? bitLine(textOrKey) : textOrKey;
  const f = ensureFab(); f.innerHTML = '';
  const av = document.createElement('div'); av.innerHTML = bitSvg(mood); const svg = av.firstElementChild; svg.classList.add('bit-float'); f.append(svg);
  const b = document.createElement('div'); b.className = 'bit-bubble'; b.textContent = text;
  const x = document.createElement('button'); x.setAttribute('aria-label', 'Dismiss'); x.textContent = '×'; x.onclick = () => bitHide(); b.append(x); f.append(b);
  clearTimeout(bubbleTimer); bubbleTimer = setTimeout(bitHide, ms);
}
export function bitHide() { clearTimeout(bubbleTimer); if (fab) fab.innerHTML = ''; mountIdle(); }
function mountIdle() {
  if (!mascotOn()) { fab && (fab.innerHTML = ''); return; }
  const f = ensureFab(); if (f.childElementCount) return;
  const av = document.createElement('div'); av.innerHTML = bitSvg('idle'); const svg = av.firstElementChild;
  svg.setAttribute('tabindex', '0'); svg.setAttribute('role', 'button'); svg.setAttribute('aria-label', 'BIT, click for a tip');
  const go = () => bitSay(pick(SAY.idle, 'idle'), { mood: 'happy', force: true });
  svg.onclick = go; svg.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  f.append(svg);
}
/** Mount BIT on every page (called by layout). Re-checks the mascot setting when it changes. */
export function mountBit() {
  mountIdle();
  addEventListener('jsv:settings', () => { if (fab) fab.innerHTML = ''; mountIdle(); });
}
/** First-visit introduction, shown once. */
export function bitOnboard() {
  if (store.get('onboarded', false) || !mascotOn()) return;
  store.set('onboarded', true);
  setTimeout(() => bitSay(SAY.welcome[0], { mood: 'happy', ms: 7000, force: true }), 1400);
  setTimeout(() => bitSay(SAY.welcome[1], { mood: 'party', ms: 6000, force: true }), 9000);
}
