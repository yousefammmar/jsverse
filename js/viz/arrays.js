// Array blocks: a real array is the source of truth; the DOM mirrors it with animated blocks.
import { h, frame, parseLiteral, fmt, code, setCode, ic, wait } from './kit.js';

const PREVIEWS = [
  ['map', 'arr.map(n => n * 2)', a => a.map(n => n * 2)],
  ['filter', 'arr.filter(n => n > 5)', a => a.filter(n => n > 5)],
  ['reduce', 'arr.reduce((sum, n) => sum + n, 0)', a => a.reduce((s, n) => s + n, 0)]
];
export function mount(el, { compact } = {}) {
  const arr = [4, 8, 15];                   // the real array
  let uid = 0, sel = -1;
  const f = frame(el, { id: 'arrays', title: 'Array Blocks', compact,
    notice: 'push and pop work at the right-hand end and are cheap. shift and unshift work at the left and every other index slides along. map, filter and reduce never change the original.',
    tries: [
      { label: 'Stack: push, push, pop', run: async () => { reset([1, 2, 3]); await wait(300); op('push', 4); await wait(500); op('push', 5); await wait(500); op('pop'); } },
      { label: 'Queue: push then shift', run: async () => { reset([1, 2, 3]); await wait(300); op('push', 4); await wait(500); op('shift'); } },
      { label: 'Reduce the sum', run: async () => { reset([1, 2, 3, 4]); await wait(300); preview(PREVIEWS[2]); } }
    ] });
  const track = h('div.viz-track', { role: 'list', 'aria-label': 'Array contents' });
  const lenEl = h('b.mono'), lit = h('span.mono.viz-lit');
  const val = h('input.input.mono', { 'aria-label': 'Value to add', placeholder: 'value, e.g. 42 or "kiwi"' }); val.value = '16';
  const line = code('const arr = [4, 8, 15];'), ret = h('div.viz-ret.mono');
  const idxIn = h('input.input.mono', { 'aria-label': 'New value for the selected index', placeholder: 'new value' });
  const idxBox = h('form.viz-ctl.viz-idx', { hidden: true, on: { submit: e => { e.preventDefault(); modify(); } } },
    h('span.mono', { id: 'viz-ar-sel' }), idxIn, h('button.btn.sm', { type: 'submit' }, 'Assign'));
  const pv = h('div.viz-pv');
  const mk = (label, fn, ico) => h('button.btn.sm', { type: 'button', on: { click: fn } }, ic(ico), h('span.mono', { text: label }));
  f.stage.append(
    h('div.viz-statrow', null, h('span.viz-lbl', { text: 'arr' }), h('span', null, 'length: ', lenEl), lit),
    h('div.viz-trackwrap', null, track), line, ret,
    h('div.viz-box', null, h('label.viz-lbl', { for: 'viz-ar-v', text: 'Value' }),
      h('div.viz-ctl', null, val, mk('push()', () => op('push'), 'right'), mk('unshift()', () => op('unshift'), 'left'),
        mk('pop()', () => op('pop'), 'minus'), mk('shift()', () => op('shift'), 'minus')), idxBox),
    h('div.viz-tries.inline', null, h('span.viz-tries-l', { text: 'Preview a method' }),
      PREVIEWS.map(p => h('button.viz-try.alt', { type: 'button', on: { click: () => preview(p) } }, p[0] + '()'))), pv);
  val.id = 'viz-ar-v';
  const ids = arr.map(() => ++uid);
  arr.forEach((v, i) => track.append(block(v, ids[i])));

  function block(v, id) {
    const b = h('button.viz-blk.in', { type: 'button', role: 'listitem', 'data-id': id, on: { click: () => select(ids.indexOf(id)) } },
      h('span.v.mono', { text: fmt(v) }), h('span.ix.mono'));
    return b;
  }
  function live() { return [...track.children].filter(c => !c.classList.contains('out')); }
  function relabel() {
    live().forEach((b, i) => { b.querySelector('.ix').textContent = i; b.classList.toggle('sel', i === sel); b.setAttribute('aria-label', `index ${i}, value ${fmt(arr[i])}${i === sel ? ', selected' : ''}`); });
    lenEl.textContent = arr.length; lit.textContent = '= ' + fmt(arr);
    if (sel >= arr.length) sel = -1;
    idxBox.hidden = sel < 0;
    if (sel >= 0) { document.getElementById('viz-ar-sel').textContent = `arr[${sel}] =`; }
  }
  function select(i) { sel = sel === i ? -1 : i; relabel(); if (sel >= 0) { setCode(line, `arr[${sel}]  // ${fmt(arr[sel])}`); ret.textContent = ''; f.touch(); f.say(`Selected index ${sel}, value ${fmt(arr[sel])}`); } }
  function modify() {
    if (sel < 0) return; const p = parseLiteral(idxIn.value); const v = p.ok ? p.value : idxIn.value;
    arr[sel] = v; const b = live()[sel]; b.querySelector('.v').textContent = fmt(v); b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash');
    setCode(line, `arr[${sel}] = ${fmt(v)};`); ret.textContent = `// arr is now ${fmt(arr)}`; relabel(); idxIn.value = ''; f.touch(); f.say(`Index ${sel} set to ${fmt(v)}`);
  }
  function op(m, forced) {
    let r, p, arg;
    if (m === 'push' || m === 'unshift') {
      arg = forced ?? ((p = parseLiteral(val.value)).ok ? p.value : val.value.trim());
      if (forced === undefined && !val.value.trim()) { val.focus(); return f.say('Type a value first.'); }
    }
    const before = fmt(arr);
    const id = ++uid;
    if (m === 'push') { r = arr.push(arg); ids.push(id); track.append(block(arg, id)); }
    else if (m === 'unshift') { r = arr.unshift(arg); ids.unshift(id); track.prepend(block(arg, id)); }
    else {
      r = arr[m]();
      const gone = m === 'pop' ? ids.pop() : ids.shift();
      const node = track.querySelector(`[data-id="${gone}"]`);
      if (node) { node.classList.add('out'); node.disabled = true; node.removeAttribute('role'); setTimeout(() => node.remove(), 360); }
    }
    sel = -1;
    setCode(line, `arr.${m}(${arg !== undefined ? fmt(arg) : ''});`);
    ret.textContent = `// returns ${fmt(r)}   (${before}  ->  ${fmt(arr)})`;
    relabel(); pv.replaceChildren(); f.touch();
    f.say(`${m} returned ${fmt(r)}. Length is now ${arr.length}.`);
  }
  function reset(a) { arr.splice(0, arr.length, ...a); ids.length = 0; a.forEach(() => ids.push(++uid)); track.replaceChildren(...arr.map((v, i) => block(v, ids[i]))); sel = -1; relabel(); setCode(line, `const arr = ${fmt(arr)};`); ret.textContent = ''; pv.replaceChildren(); }
  function preview([name, src, fn]) {
    if (!arr.every(x => typeof x === 'number')) { pv.replaceChildren(h('p.viz-msg.err', { text: 'This preview needs numbers only. Pop or edit the text items and try again.' })); return; }
    const out = fn(arr);
    setCode(line, src + ';');
    ret.textContent = `// returns ${fmt(out)}   (arr is untouched: ${fmt(arr)})`;
    pv.replaceChildren(h('div.viz-trackwrap.mini', null, h('div.viz-track', null,
      ...(Array.isArray(out) ? out : [out]).map(v => h('span.viz-blk.static', null, h('span.v.mono', { text: fmt(v) }))))));
    f.touch(); f.say(`${name} returned ${fmt(out)}`);
  }
  relabel();
}
