// Type Inspector. Literals are parsed locally (no eval). Anything else is evaluated in the sandbox worker.
import { h, frame, parseLiteral, ic } from './kit.js';
import { runJS } from '../sandbox.js';

/** Runs both here (for parsed literals) and inside the worker (via toString). Must stay self-contained. */
function describe(v) {
  const t = typeof v;
  const show = x => { try {
    if (typeof x === 'string') return JSON.stringify(x);
    if (typeof x === 'bigint') return x + 'n';
    if (typeof x === 'symbol') return x.toString();
    if (typeof x === 'function') return 'function ' + (x.name || '(anonymous)');
    if (Object.is(x, -0)) return '-0';
    if (x && typeof x === 'object') return JSON.stringify(x);
    return String(x);
  } catch (e) { return '[' + e.name + ']'; } };
  const conv = f => { try { return show(f(v)); } catch (e) { return e.name + ': ' + e.message; } };
  return { value: show(v), type: v === null ? 'null' : t, typeof: JSON.stringify(t), array: Array.isArray(v),
    number: conv(Number), string: conv(String), boolean: conv(Boolean), truthy: (() => { try { return !!v; } catch { return false; } })() };
}
const GOTCHAS = [
  { label: 'typeof null', input: 'null', note: 'null is a primitive, yet typeof null is "object". A 1995 bug that can never be fixed without breaking the web.' },
  { label: '0.1 + 0.2', input: '0.1 + 0.2', note: 'Numbers are binary floating point, so 0.1 + 0.2 is 0.30000000000000004. Compare with a tolerance, not ===.' },
  { label: '"5" + 3', input: '"5" + 3', note: 'With a string on either side, + concatenates: "53". But "5" - 3 is 2, because - only works on numbers.' },
  { label: '"5" - 3', input: '"5" - 3', note: 'The minus operator converts both sides to numbers first, so the string "5" becomes 5 and the result is 2.' },
  { label: 'NaN === NaN', input: 'NaN === NaN', note: 'NaN is the only value not equal to itself. Use Number.isNaN(x) to test for it.' },
  { label: '[] + {}', input: '[] + {}', note: 'Both sides become strings ("" and "[object Object]") and get glued together.' },
  { label: '0 is falsy', input: '0', note: 'Falsy values: false, 0, -0, 0n, "", null, undefined, NaN. Everything else is truthy, including "0" and [].' }
];

export function mount(el, { compact } = {}) {
  const f = frame(el, { id: 'datatypes', title: 'Type Inspector', compact,
    notice: 'typeof only gives eight answers, yet the same value converts to very different numbers, strings and booleans.',
    tries: [{ label: 'The null bug', run: () => load(GOTCHAS[0]) }, { label: 'Floating point', run: () => load(GOTCHAS[1]) }, { label: 'String vs number math', run: async () => { await load(GOTCHAS[2]); } }] });
  const input = h('input.input.mono', { 'aria-label': 'Value or expression', placeholder: 'try 42, "hi", [1,2], {"a":1} or 3 > 2', spellcheck: false, autocomplete: 'off' });
  input.value = '"42"';
  const res = h('div.viz-grid');
  const note = h('p.viz-callout', { hidden: true });
  const err = h('p.viz-msg', { 'aria-live': 'polite' });
  const chips = GOTCHAS.map(g => h('button.viz-try.alt', { type: 'button', on: { click: () => load(g) } }, g.label));
  f.stage.append(
    h('label.viz-lbl', { for: 'viz-dt-in', text: 'Value or expression' }),
    h('form.viz-ctl', { on: { submit: e => { e.preventDefault(); inspect(); } } }, input, h('button.btn.p.sm', { type: 'submit' }, ic('search'), 'Inspect')),
    h('div.viz-tries.inline', null, h('span.viz-tries-l', { text: 'Famous gotchas' }), chips), err, res, note);
  input.id = 'viz-dt-in';
  let seq = 0;
  async function load(g) { input.value = g.input; await inspect(g.note, g.label); }

  async function inspect(n, label, quiet) {
    const my = ++seq, src = input.value;
    err.textContent = ''; err.className = 'viz-msg';
    let d, how = 'literal';
    const p = parseLiteral(src);
    if (p.ok) d = describe(p.value);
    else {
      how = 'sandbox';
      const r = await runJS(`const describe=${describe.toString()};try{const __v=(\n${src}\n);console.log(JSON.stringify(describe(__v)))}catch(e){console.log(JSON.stringify({thrown:e.name+': '+e.message}))}`, { timeout: 2500 });
      if (my !== seq) return;
      if (r.error) { return fail(r.error.name + ': ' + r.error.message); }
      try { d = JSON.parse(r.logs[0].args[0].v); } catch { return fail('Could not read the result.'); }
      if (d.thrown) return fail(d.thrown);
    }
    if (!quiet) f.touch();
    note.hidden = !n; note.textContent = n || '';
    const rows = [
      ['value', d.value, `${how === 'literal' ? 'parsed as a literal' : 'evaluated in an isolated sandbox'}`],
      ['typeof', d.typeof.replace(/"/g, ''), d.array ? 'Array.isArray(value) is true, but typeof says "object"' : d.type === 'null' ? 'the famous quirk' : ''],
      ['Number(value)', d.number, ''], ['String(value)', d.string, ''], ['Boolean(value)', d.boolean, d.truthy ? 'truthy' : 'falsy']];
    res.replaceChildren(h('div.viz-bigval', null, h('span.viz-ty', { 'data-t': d.array ? 'array' : d.type, text: d.array ? 'array' : d.type }), h('code.mono', { text: d.value })),
      h('div.viz-tf' + (d.truthy ? '.t' : '.f'), { text: d.truthy ? 'truthy' : 'falsy' }),
      ...rows.slice(1).map(([k, v, s]) => h('div.viz-cell', null, h('span.viz-k.mono', { text: k }), h('b.mono', { text: v }), s && k !== 'Boolean(value)' ? h('small', { text: s }) : null)));
    f.say(`${label || src}: typeof ${d.typeof.replace(/"/g, '')}, ${d.truthy ? 'truthy' : 'falsy'}.`);
  }
  function fail(m) { err.className = 'viz-msg err'; err.textContent = m; res.replaceChildren(); note.hidden = true; f.say(m); }
  inspect(0, 0, true);
}
