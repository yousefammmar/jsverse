// Memory cards: declare / reassign let and const. Errors come from the real engine via the sandbox.
import { h, frame, parseLiteral, fmt, typeChip, isIdent, code, setCode, ic, wait } from './kit.js';
import { runJS } from '../sandbox.js';

export function mount(el, { compact } = {}) {
  const f = frame(el, { id: 'variables', title: 'Memory Cards', compact,
    notice: 'A const card refuses a new value, and the message you see comes from the real JavaScript engine. A let card can even change type.',
    tries: [
      { label: 'Reassign a const', run: async () => { reset(); await declare('score', '10', 'const'); await reassign('score', '11'); } },
      { label: 'let can change type', run: async () => { reset(); await declare('mood', '"calm"', 'let'); await wait(500); await reassign('mood', '42'); } },
      { label: 'Declare the same name twice', run: async () => { reset(); await declare('x', '1', 'let'); await declare('x', '2', 'let'); } }
    ] });
  const vars = new Map();           // name -> { kind, value }  (the real source of truth)
  const name = h('input.input.mono', { 'aria-label': 'Variable name', placeholder: 'name', value: '' }); name.value = 'age';
  const val = h('input.input.mono', { 'aria-label': 'Value', placeholder: 'value' }); val.value = '25';
  const kind = h('select.input', { 'aria-label': 'Keyword' }, h('option', { text: 'let' }), h('option', { text: 'const' }));
  const board = h('div.viz-mem', { 'aria-label': 'Variables in memory' });
  const msg = h('div.viz-msg', { 'aria-live': 'polite' });
  const line = code('let age = 25;');
  const upd = () => setCode(line, `${kind.value} ${name.value.trim() || 'name'} = ${val.value.trim() || '...'};`);
  [name, val, kind].forEach(x => x.addEventListener('input', upd));
  const form = h('form.viz-ctl', { on: { submit: e => { e.preventDefault(); declare(name.value, val.value, kind.value); } } },
    kind, name, h('span.viz-eq', { text: '=' }), val, h('button.btn.p.sm', { type: 'submit' }, ic('plus'), 'Declare'));
  f.stage.append(h('div.viz-box', null, h('div.viz-lbl', { text: 'Write a declaration' }), form, line), msg,
    h('div.viz-lbl', { text: 'Memory' }), board, h('div.viz-empty', { text: 'Memory is empty. Declare something above.' }));
  const empty = f.stage.lastChild;

  function say(text, kindc = '') { msg.className = 'viz-msg ' + kindc; msg.textContent = text; f.say(text); }
  function reset() { vars.clear(); render(); msg.textContent = ''; msg.className = 'viz-msg'; }
  async function engine(src) { try { const r = await runJS(src, { timeout: 2500 }); return r.error; } catch { return null; } }

  async function declare(n, raw, k, quiet) {
    n = n.trim();
    if (!isIdent(n)) return say(`"${n}" is not a valid variable name. Use letters, digits, _ or $ and do not start with a digit.`, 'err');
    const p = parseLiteral(raw);
    if (!p.ok) return say(p.error, 'err');
    if (!quiet) f.touch();
    if (vars.has(n)) {
      const e = await engine(`${vars.get(n).kind} ${n} = 1; ${k} ${n} = 2;`);
      shake(n);
      return say(`${e ? e.name + ': ' + e.message : "Identifier '" + n + "' has already been declared"}. To change the value, assign without a keyword: ${n} = ...`, 'err');
    }
    vars.set(n, { kind: k, value: p.value });
    render(n); say(`${k} ${n} stored in memory as ${fmt(p.value)}.`, 'ok');
  }
  async function reassign(n, raw) {
    const v = vars.get(n); if (!v) return;
    const p = parseLiteral(raw); if (!p.ok) return say(p.error, 'err');
    f.touch();
    if (v.kind === 'const') {
      const e = await engine(`const ${n} = ${JSON.stringify(1)}; ${n} = ${JSON.stringify(2)};`);
      shake(n);
      return say(`${n} = ${fmt(p.value)}  ->  ${e ? e.name + ': ' + e.message : 'TypeError: Assignment to constant variable.'}`, 'err');
    }
    const was = typeof v.value; v.value = p.value; render(n, true);
    say(`${n} now holds ${fmt(p.value)}${was !== typeof p.value ? ` (type changed from ${was} to ${typeof p.value})` : ''}.`, 'ok');
  }
  function shake(n) { const c = board.querySelector(`[data-n="${CSS.escape(n)}"]`); if (c) { c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); } }

  function render(hot, swap) {
    empty.hidden = vars.size > 0;
    board.replaceChildren(...[...vars].map(([n, v]) => {
      const input = h('input.input.mono', { 'aria-label': `New value for ${n}`, placeholder: 'new value' });
      const go = () => { reassign(n, input.value); };
      input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
      return h('div.viz-card' + (n === hot ? '.pop' : ''), { 'data-n': n, 'data-k': v.kind },
        h('div.viz-card-top', null, h('span.viz-kw', null, v.kind === 'const' ? ic('lock') : null, v.kind), h('b.mono', { text: n }), h('span.sp'), typeChip(v.value),
          h('button.icon-btn.viz-x', { type: 'button', 'aria-label': `Remove ${n} from this demo`, on: { click: () => { vars.delete(n); render(); } } }, ic('x'))),
        h('div.viz-card-val.mono' + (swap && n === hot ? '.flip' : ''), { text: fmt(v.value) }),
        h('div.viz-card-act', null, input, h('button.btn.sm', { type: 'button', on: { click: go } }, `${n} =`)));
    }));
  }
  vars.set('age', { kind: 'let', value: 25 }); vars.set('PI', { kind: 'const', value: 3.14 }); render();
}
