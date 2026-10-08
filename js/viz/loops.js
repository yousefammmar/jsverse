// Loop stepper. The generators below are the loops, written out phase by phase, so every state shown is really produced.
import { h, frame, code, ic, clamp, fmt } from './kit.js';
import { highlight } from '../editor.js';

const MAX = 12;
function* forLoop(n) {
  let i = 0;
  yield { ph: 'init', i };
  while (true) {
    const ok = i < n;
    yield { ph: 'test', i, ok, expr: `${i} < ${n}` };
    if (!ok) return;
    yield { ph: 'body', i, log: String(i) };
    i++;
    yield { ph: 'step', i };
  }
}
function* forOf(arr) {
  let idx = 0;
  yield { ph: 'init', idx: -1 };
  for (const v of arr) { yield { ph: 'next', v, idx }; yield { ph: 'body', v, idx, log: v }; idx++; }
  yield { ph: 'done', idx };
}
const COLORS = ['red', 'green', 'blue', 'gold'];

export function mount(el, { compact } = {}) {
  let mode = 'for', n = 4, g, ev = null, blocks = [], logs = [], timer = null, finished = false, started = false;
  const f = frame(el, { id: 'loops', title: 'Loop Stepper', compact,
    notice: 'The test runs before every pass, including the last one. When it turns false the body is skipped and the loop ends, so a loop with n = 0 runs its body zero times.',
    tries: [
      { label: 'Zero passes', run: () => { setMode('for'); setN(0); step(); step(); } },
      { label: 'Auto-play to 5', run: () => { setMode('for'); setN(5); play(); } },
      { label: 'for...of colours', run: () => { setMode('of'); play(); } }
    ] });
  const tabs = h('div.tabs', { role: 'tablist', 'aria-label': 'Loop kind' },
    ...[['for', 'for loop'], ['of', 'for...of']].map(([k, l]) => h('button', { role: 'tab', type: 'button', 'data-k': k, on: { click: () => setMode(k) } }, l)));
  const nIn = h('input.input.mono', { type: 'number', min: 0, max: MAX, 'aria-label': `n, the loop limit (max ${MAX})` }); nIn.value = n;
  const nBox = h('label.viz-ctl', null, h('span.mono', { text: 'n =' }), nIn, h('small.viz-dim', { text: `capped at ${MAX} here` }));
  const src = h('pre.viz-code.viz-loopcode'), iBig = h('div.viz-ibig'), phase = h('div.viz-phase', { 'aria-live': 'polite' });
  const track = h('div.viz-track.loop', { 'aria-label': 'Iterations so far' }), cons = h('div.viz-cons.mono', { 'aria-label': 'console output' });
  const bPlay = h('button.btn.p.sm', { type: 'button', on: { click: () => timer ? pause() : play() } });
  f.stage.append(
    h('div.viz-ctl.between', null, tabs, nBox), src,
    h('div.viz-cols.loop', null,
      h('div.viz-box', null, iBig, phase),
      h('div.viz-box', null, h('div.viz-lbl', { text: 'Iterations' }), track, h('div.viz-lbl', { text: 'console' }), cons)),
    h('div.viz-ctl', null, h('button.btn.sm', { type: 'button', on: { click: () => { pause(); step(); } } }, ic('step'), 'Step'), bPlay,
      h('button.btn.sm.ghost', { type: 'button', on: { click: () => { pause(); reset(); } } }, ic('reset'), 'Reset')));

  function setN(v) { n = clamp(Math.trunc(v) || 0, 0, MAX); nIn.value = n; reset(); }
  function setMode(k) { mode = k; nBox.hidden = k !== 'for'; tabs.querySelectorAll('[role=tab]').forEach(t => t.setAttribute('aria-selected', t.dataset.k === k)); reset(); }
  nIn.addEventListener('input', () => { if (nIn.value === '') return; const raw = +nIn.value; setN(raw); if (raw > MAX) f.say(`Capped at ${MAX} for this demo.`); });
  function reset() {
    pause(); g = mode === 'for' ? forLoop(n) : forOf(COLORS); blocks = []; logs = []; ev = null; finished = false; started = false;
    draw(); phase.textContent = 'Press Step to run the first phase.';
  }
  function srcHtml() {
    const hl = (key, txt) => `<span class="viz-seg${ev && ev.ph === key ? ' on' : ''}" data-s="${key}">${highlight(txt)}</span>`;
    if (mode === 'for') return `<code>${highlight('for (')}${hl('init', 'let i = 0')}${highlight('; ')}${hl('test', `i < ${n}`)}${highlight('; ')}${hl('step', 'i++')}${highlight(') {')}\n${'  '}<span class="viz-seg${ev && ev.ph === 'body' ? ' on' : ''}">${highlight('console.log(i);')}</span>\n${highlight('}')}</code>`;
    return `<code>${highlight('const colors = ' + fmt(COLORS) + ';')}\n${highlight('for (')}${hl('next', 'const c of colors')}${highlight(') {')}\n  <span class="viz-seg${ev && ev.ph === 'body' ? ' on' : ''}">${highlight('console.log(c);')}</span>\n${highlight('}')}</code>`;
  }
  function draw() {
    src.innerHTML = srcHtml();
    const iv = mode === 'for' ? (ev ? (ev.i ?? 0) : '-') : (ev?.v ?? '-');
    iBig.replaceChildren(h('span.mono.viz-dim', { text: mode === 'for' ? 'i' : 'c' }), h('b.mono', { text: mode === 'for' ? (started ? String(ev.i ?? 0) : '?') : (ev && ev.v !== undefined ? ev.v : '?') }));
    if (mode === 'for' && !started) iBig.querySelector('b').classList.add('unset');
    track.replaceChildren(...blocks.map((b, k) => h('span.viz-blk.static.mono' + (k === blocks.length - 1 && ev?.ph === 'body' ? '.in' : ''), null, h('span.v', { text: b }), h('span.ix', { text: mode === 'for' ? `i=${b}` : `[${k}]` }))));
    if (!blocks.length) track.append(h('span.viz-dim.small', { text: 'nothing yet' }));
    cons.replaceChildren(...logs.map(l => h('div', { text: '> ' + l })));
    if (!logs.length) cons.append(h('span.viz-dim', { text: '(empty)' }));
    bPlay.replaceChildren(...(timer ? [ic('pause'), 'Pause'] : [ic('play'), finished ? 'Replay' : 'Auto-play']));
  }
  const MSG = {
    init: e => 'Start: let i = 0 runs once, before anything else.',
    test: e => e.ok ? `Test: ${e.expr} is true, so the body runs.` : `Test: ${e.expr} is false, so the loop ends. The body does not run again.`,
    body: e => mode === 'for' ? `Body: console.log(${e.i}) prints ${e.i}.` : `Body: console.log("${e.v}") prints ${e.v}.`,
    step: e => `Step: i++ makes i equal ${e.i}. Back to the test.`,
    next: e => `for...of takes the next item: colors[${e.idx}] is "${e.v}".`,
    done: () => 'No items left, so the loop ends.'
  };
  function step() {
    if (finished) { reset(); }
    const r = g.next();
    if (r.done) { finished = true; draw(); return false; }
    ev = r.value; started = true;
    if (ev.ph === 'body') { blocks.push(ev.log); logs.push(ev.log); }
    if ((ev.ph === 'test' && !ev.ok) || ev.ph === 'done') finished = true;
    phase.textContent = MSG[ev.ph](ev);
    draw(); f.touch(); f.say(phase.textContent);
    return !finished;
  }
  function play() {
    if (timer) return; if (finished) reset();
    const go = () => { if (!el.isConnected) return pause(); if (!step()) { pause(); } };
    timer = setInterval(go, 650); go(); draw();
  }
  function pause() { if (timer) { clearInterval(timer); timer = null; draw(); } }
  setMode('for');
}
