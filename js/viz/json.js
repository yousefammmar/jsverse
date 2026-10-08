// JSON Explorer: key/value rows build a real JS object; JSON.stringify and JSON.parse do the rest, and the diff is measured, not guessed.
import { h, frame, parseLiteral, fmt, typeChip, typeName, code, ic } from './kit.js';
import { highlight } from '../editor.js';

const TYPES = ['string', 'number', 'boolean', 'null', 'undefined', 'NaN', 'Date', 'function', 'array/object'];
const mk = (key, type, val) => ({ key, type, val });
const START = () => [mk('name', 'string', 'Ada'), mk('age', 'number', '36'), mk('admin', 'boolean', 'true'), mk('nickname', 'undefined', ''), mk('greet', 'function', ''),
  mk('joined', 'Date', '2024-05-01T09:30:00Z'), mk('score', 'NaN', ''), mk('tags', 'array/object', '["js","json"]')];

function build(rows) {                      // rows -> real object (null on bad input, with an error)
  const o = {}, errs = [];
  rows.forEach((r, i) => {
    if (!r.key) return;
    let v;
    switch (r.type) {
      case 'string': v = r.val; break;
      case 'number': v = Number(r.val); if (r.val.trim() === '' || Number.isNaN(v)) { errs.push(`"${r.key}" is not a number`); v = NaN; } break;
      case 'boolean': v = r.val.trim() === 'true'; break;
      case 'null': v = null; break; case 'undefined': v = undefined; break; case 'NaN': v = NaN; break;
      case 'Date': v = new Date(r.val); if (isNaN(v)) errs.push(`"${r.key}" is not a valid date`); break;
      case 'function': v = function () {}; break;
      default: { const p = parseLiteral(r.val); if (p.ok && p.value !== null && typeof p.value === 'object') v = p.value; else { errs.push(`"${r.key}" needs an array or object like [1,2] or {"a":1}`); v = []; } }
    }
    o[r.key] = v;
  });
  return { o, errs };
}
const typeOfParsed = v => v === null ? 'null' : Array.isArray(v) ? 'array/object' : typeof v === 'object' ? 'array/object' : typeof v;
function rowsFrom(o) { return Object.entries(o).map(([k, v]) => mk(k, typeOfParsed(v), typeof v === 'string' ? v : v !== null && typeof v === 'object' ? JSON.stringify(v) : v === null ? '' : String(v))); }

export function mount(el, { compact } = {}) {
  let rows = START(), dir = 'o2j', text = '', lastGood = null;
  const f = frame(el, { id: 'json', title: 'JSON Explorer', compact,
    notice: 'JSON is only text. Stringifying silently drops undefined and functions, turns NaN into null and Dates into strings, and parsing never brings the Date back.',
    tries: [
      { label: 'See what gets lost', run: () => { setDir('o2j'); rows = START(); draw(); } },
      { label: 'Break the JSON', run: () => { setDir('j2o'); ta.value = '{"name": "Ada", "age": 36,}'; onText(); } },
      { label: 'Round trip a Date', run: () => { setDir('j2o'); rows = START(); text = JSON.stringify(build(rows).o, null, 2); ta.value = text; onText(); } }
    ] });
  const tabs = h('div.tabs', { role: 'tablist', 'aria-label': 'Direction' }, ...[['o2j', 'Object to JSON'], ['j2o', 'JSON to object']].map(([k, l]) => h('button', { role: 'tab', type: 'button', 'data-k': k, on: { click: () => setDir(k) } }, l)));
  const left = h('div.viz-box'), right = h('div.viz-box'), msg = h('p.viz-msg', { 'aria-live': 'polite' });
  const ta = h('textarea.input.mono.viz-ta', { spellcheck: false, rows: 10, 'aria-label': 'JSON text' });
  f.stage.append(tabs, h('div.viz-cols', null, left, right), msg);

  function setDir(k) {
    if (k === dir && left.childNodes.length) return;
    if (k === 'j2o') { text = JSON.stringify(build(rows).o, null, 2); ta.value = text; lastGood = JSON.parse(text); }
    else if (lastGood && typeof lastGood === 'object' && !Array.isArray(lastGood)) rows = rowsFrom(lastGood);
    dir = k; draw();
  }
  function onText() {
    text = ta.value;
    try { lastGood = JSON.parse(text); msg.className = 'viz-msg ok'; msg.textContent = 'JSON.parse succeeded.'; f.touch(); }
    catch (e) { msg.className = 'viz-msg err'; msg.textContent = `${e.name}: ${e.message}`; f.say(msg.textContent); }
    drawParsed();
  }
  ta.addEventListener('input', onText);

  function draw() {
    tabs.querySelectorAll('[role=tab]').forEach(t => t.setAttribute('aria-selected', t.dataset.k === dir));
    msg.textContent = ''; msg.className = 'viz-msg';
    if (dir === 'o2j') drawO2J(); else drawJ2O();
  }
  const fateOf = (r, o, back) => !r.key ? null : !(r.key in back) ? ['drop', 'dropped'] : (typeName(o[r.key]) !== typeName(back[r.key]) || (typeof o[r.key] === 'number' && !Object.is(o[r.key], back[r.key]))) ? ['chg', `${typeName(o[r.key])} becomes ${typeName(back[r.key])}`] : ['ok', 'kept'];
  function drawO2J() {
    const list = h('div.viz-rows');
    rows.forEach((r, i) => {
      const key = h('input.input.mono', { 'aria-label': `Key ${i + 1}` }); key.value = r.key;
      const type = h('select.input', { 'aria-label': `Type of ${r.key || 'value ' + (i + 1)}` }, ...TYPES.map(t => h('option', { text: t }))); type.value = r.type;
      const val = h('input.input.mono', { 'aria-label': `Value of ${r.key || 'value ' + (i + 1)}`, disabled: ['null', 'undefined', 'NaN', 'function'].includes(r.type), placeholder: r.type === 'function' ? '() => {}' : r.type === 'Date' ? '2024-05-01T09:30:00Z' : '' }); val.value = r.val;
      const sync = () => { rows[i] = mk(key.value.trim(), type.value, val.value); f.touch(); refresh(); };
      key.addEventListener('input', sync); val.addEventListener('input', sync);
      type.addEventListener('change', () => { sync(); drawO2J(); });
      list.append(h('div.viz-kv', null, key, type, val, h('span.viz-fate'),
        h('button.icon-btn.viz-x', { type: 'button', 'aria-label': `Remove ${r.key || 'row'}`, on: { click: () => { rows.splice(i, 1); drawO2J(); } } }, ic('x'))));
    });
    left.replaceChildren(h('div.viz-lbl', { text: 'JavaScript object (real values)' }), list,
      h('button.btn.sm', { type: 'button', on: { click: () => { rows.push(mk('key' + (rows.length + 1), 'string', 'value')); drawO2J(); } } }, ic('plus'), 'Add a property'));
    right.replaceChildren(h('div.viz-lbl', null, h('span.mono', { text: 'JSON.stringify(obj, null, 2)' })), h('pre.code-block.viz-json'), h('p.viz-msg.err'),
      h('div.viz-lbl', { text: 'After JSON.parse(json): what survived' }), h('div.viz-parsed'));
    refresh();
  }
  function refresh() {
    const { o, errs } = build(rows), json = JSON.stringify(o, null, 2), back = JSON.parse(json);
    const [pre, err, , parsed] = [...right.children].slice(1);
    pre.innerHTML = `<code>${highlight(json)}</code>`;
    err.textContent = errs.length ? errs.join('. ') + '.' : ''; err.hidden = !errs.length;
    parsed.replaceChildren(...Object.entries(back).map(([k, v]) => h('div', null, h('span.mono', { text: k }), typeChip(v), h('span.mono.viz-dim', { text: fmt(v) }))));
    [...left.querySelectorAll('.viz-kv')].forEach((row, i) => { const fate = fateOf(rows[i], o, back), s = row.querySelector('.viz-fate'); s.className = 'viz-fate ' + (fate ? fate[0] : ''); s.textContent = fate ? fate[1] : ''; });
    f.say(`JSON keeps ${Object.keys(back).length} of ${Object.keys(o).length} properties.`);
  }
  function drawJ2O() {
    left.replaceChildren(h('div.viz-lbl', { text: 'The real object JSON.parse gives you' }), h('div.viz-parsed', { id: 'viz-js-parsed' }));
    right.replaceChildren(h('label.viz-lbl', { for: 'viz-js-ta' }, h('span.mono', { text: 'JSON text (edit me)' })), ta);
    ta.id = 'viz-js-ta'; drawParsed();
  }
  function drawParsed() {
    const box = left.querySelector('#viz-js-parsed'); if (!box) return;
    const v = lastGood;
    if (v === null && !text.trim().startsWith('null')) { box.replaceChildren(h('p.viz-dim', { text: 'Waiting for valid JSON...' })); }
    else if (typeof v !== 'object' || v === null) box.replaceChildren(h('div', null, typeChip(v), h('span.mono', { text: fmt(v) })));
    else box.replaceChildren(...Object.entries(v).map(([k, x]) => h('div', null, h('span.mono', { text: k }), typeChip(x), h('span.mono.viz-dim', { text: fmt(x) }))));
    if (v && typeof v === 'object' && 'joined' in v && typeof v.joined === 'string') box.append(h('small.viz-dim', { text: 'joined is a string. JSON has no Date type, so new Date(v.joined) is up to you.' }));
  }
  draw();
}
