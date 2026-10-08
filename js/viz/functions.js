// Function Machine. The machines are real functions; arguments come from the safe literal parser; results are real return values.
import { h, frame, parseLiteral, fmt, typeChip, ic, wait, reducedMotion } from './kit.js';
import { highlight } from '../editor.js';

const MACHINES = {
  add: { src: 'function add(a, b) {\n  return a + b;\n}', params: ['a', 'b'], args: ['2', '3'], fn: (log, a, b) => a + b },
  greet: { src: 'function greet(name) {\n  const msg = "Hello, " + name;\n  console.log(msg);\n}', params: ['name'], args: ['"Ada"'], fn: (log, name) => { const msg = 'Hello, ' + name; log(msg); } },
  greetR: { name: 'greet', src: 'function greet(name) {\n  const msg = "Hello, " + name;\n  console.log(msg);\n  return msg;\n}', params: ['name'], args: ['"Ada"'], fn: (log, name) => { const msg = 'Hello, ' + name; log(msg); return msg; } },
  shout: { src: 'function shout(text) {\n  return text.toUpperCase();\n}', params: ['text'], args: ['"hey"'], fn: (log, text) => text.toUpperCase() }
};
const LABELS = { add: 'add(a, b)', greet: 'greet(name) with no return', greetR: 'greet(name) with return', shout: 'shout(text)' };

export function mount(el, { compact } = {}) {
  let cur = 'add', busy = false;
  const f = frame(el, { id: 'functions', title: 'Function Machine', compact,
    notice: 'A function without return still finishes, but the call evaluates to undefined. Closures keep their own private variable alive between calls.',
    tries: [
      { label: 'Forget the return', run: async () => { pick('greet'); await run(); } },
      { label: 'Wrong kind of input', run: async () => { pick('shout'); ins[0].value = '42'; await run(); } },
      { label: 'Two separate counters', run: async () => { await cl('mk'); await cl('mk'); cl('call', 0); cl('call', 0); cl('call', 1); } }
    ] });
  const pickEl = h('select.input', { 'aria-label': 'Choose a function', on: { change: () => pick(pickEl.value) } }, ...Object.entries(LABELS).map(([k, l]) => h('option', { value: k, text: l })));
  const ins = [], inBox = h('div.viz-slots'), srcEl = h('pre.viz-code.viz-mach-src'), outEl = h('div.viz-outslot'), callEl = h('div.viz-callline.mono'), logEl = h('div.viz-cons.mono');
  const machine = h('div.viz-machine', null, h('div.viz-m-top', null, ic('cpu'), h('span', { text: 'function body' })), srcEl);
  const go = h('button.btn.p', { type: 'button', on: { click: () => run() } }, ic('play'), 'Run the call');
  const flow = h('div.viz-flow', null,
    h('div.viz-col', null, h('div.viz-lbl', { text: 'Arguments in' }), inBox), h('div.viz-belt.a', { 'aria-hidden': 'true' }), machine,
    h('div.viz-belt.b', { 'aria-hidden': 'true' }), h('div.viz-col', null, h('div.viz-lbl', { text: 'Return value out' }), outEl));
  const ctrs = h('div.viz-ctrs'), ctrMsg = h('div.viz-code.mono.viz-ctrcode');
  f.stage.append(h('div.viz-ctl', null, h('label.viz-lbl', { for: 'viz-fn-pick', text: 'Function' }), pickEl), flow, callEl, h('div.viz-ctl', null, go), h('div.viz-lbl', { text: 'console' }), logEl,
    h('div.viz-box.closure', null, h('div.viz-lbl', { text: 'Closure mini demo' }),
      h('pre.viz-code', { html: `<code>${highlight('function makeCounter() {\n  let count = 0;          // private\n  return () => ++count;   // remembers count\n}')}</code>` }),
      h('div.viz-ctl', null, h('button.btn.sm', { type: 'button', on: { click: () => cl('mk') } }, ic('plus'), 'makeCounter()')), ctrs));
  pickEl.id = 'viz-fn-pick';

  function pick(k) {
    cur = k; pickEl.value = k; const m = MACHINES[k]; ins.length = 0;
    inBox.replaceChildren(...m.params.map((p, i) => { const inp = h('input.input.mono', { 'aria-label': `Argument for ${p}` }); inp.value = m.args[i]; inp.addEventListener('input', callLine); ins.push(inp); return h('div.viz-slot', null, h('span.mono', { text: p }), inp); }));
    srcEl.innerHTML = `<code>${highlight(m.src)}</code>`; outEl.replaceChildren(h('span.viz-dim', { text: 'waiting for a call' })); logEl.replaceChildren(h('span.viz-dim', { text: '(empty)' })); callLine();
  }
  const callLine = () => callEl.textContent = `${MACHINES[cur].name || cur}(${ins.map(i => i.value.trim() || '').join(', ')})`;
  async function fly(from, to, text, cls = '') {
    if (reducedMotion()) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), host = flow.getBoundingClientRect();
    const t = h('span.viz-token.mono' + cls, { text }); t.style.cssText = `left:${a.left - host.left + a.width / 2}px;top:${a.top - host.top + a.height / 2}px`;
    flow.append(t);
    const dx = b.left - a.left + b.width / 2 - a.width / 2, dy = b.top - a.top + b.height / 2 - a.height / 2;
    await t.animate([{ transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.9)`, opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }).finished.catch(() => {});
    t.remove();
  }
  async function run() {
    if (busy) return;
    const m = MACHINES[cur], args = [];
    for (let i = 0; i < m.params.length; i++) { const p = parseLiteral(ins[i].value); if (!p.ok) { ins[i].focus(); f.say(p.error); outEl.replaceChildren(h('span.viz-msg.err', { text: `${m.params[i]}: ${p.error}` })); return; } args.push(p.value); }
    busy = true; go.disabled = true; f.touch(); callLine();
    const logs = []; let result, error = null;
    try { result = m.fn(x => logs.push(String(x)), ...args); } catch (e) { error = e; }
    outEl.replaceChildren(h('span.viz-dim', { text: '...' }));
    await Promise.all(ins.map((i, k) => fly(i, machine, fmt(args[k]), '.in')));
    machine.classList.add('run'); await wait(420); machine.classList.remove('run');
    logEl.replaceChildren(...(logs.length ? logs.map(l => h('div', { text: '> ' + l })) : [h('span.viz-dim', { text: '(nothing printed)' })]));
    if (error) {
      outEl.replaceChildren(h('div.viz-out.err', null, h('b.mono', { text: error.name }), h('small', { text: error.message })));
      f.say(`${error.name}: ${error.message}`);
    } else {
      outEl.replaceChildren(h('div.viz-out' + (result === undefined ? '.undef' : ''), null, typeChip(result), h('b.mono', { text: fmt(result) }),
        result === undefined ? h('small', { text: 'No return statement, so the call gives back undefined.' }) : null));
      f.say(`Returned ${fmt(result)}`);
    }
    busy = false; go.disabled = false;
  }
  /* closures: real makeCounter */
  const counters = [];
  function makeCounter() { let count = 0; return () => ++count; }
  async function cl(what, i) {
    if (what === 'mk') { if (counters.length >= 4) return; counters.push({ call: makeCounter(), last: null, calls: 0 }); }
    else { const c = counters[i]; if (!c) return; c.last = c.call(); c.calls++; }
    f.touch(); drawC();
  }
  function drawC() {
    ctrs.replaceChildren(...counters.map((c, i) => h('div.viz-ctr', null,
      h('div.mono', null, h('b', { text: `counter${'ABCD'[i]}` }), ' = makeCounter()'),
      h('button.btn.sm', { type: 'button', on: { click: () => cl('call', i) } }, `counter${'ABCD'[i]}()`),
      h('div.viz-out', null, h('small', { text: 'returned' }), h('b.mono', { text: c.last ?? '-' })),
      h('div.viz-priv', null, ic('lock'), h('span.mono', { text: `count = ${c.last ?? 0}` }), h('small', { text: 'lives inside this closure' })))));
    if (!counters.length) ctrs.append(h('p.viz-empty', { text: 'No counters yet. Each makeCounter() call creates a new private count.' }));
  }
  pick('add'); drawC();
}
