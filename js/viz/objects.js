// Object Explorer: a real nested object; the tree, dot-path and JSON are all derived from it.
import { h, frame, parseLiteral, fmt, typeChip, isIdent, code, setCode, ic } from './kit.js';
import { highlight } from '../editor.js';

const ROOT = 'user';
const pathStr = p => p.reduce((s, k) => typeof k === 'number' ? `${s}[${k}]` : isIdent(k) ? `${s}.${k}` : `${s}[${JSON.stringify(k)}]`, ROOT);
const get = (o, p) => p.reduce((x, k) => x?.[k], o);
const isBranch = v => v !== null && typeof v === 'object';

export function mount(el, { compact } = {}) {
  let data = { name: 'Ada', age: 36, active: true, address: { city: 'London', zip: 'N1 9GU' }, langs: ['js', 'py'] };
  let sel = ['address', 'city'];
  const closed = new Set();
  const f = frame(el, { id: 'objects', title: 'Object Explorer', compact,
    notice: 'Every value has an address. The dot-path under the tree is exactly the code you would write to reach the selected value.',
    tries: [
      { label: 'Reach address.city', run: () => { data.address = { ...data.address, city: data.address?.city ?? 'London' }; sel = ['address', 'city']; draw(); } },
      { label: 'Add a property', run: () => { data.email = 'ada@example.com'; sel = ['email']; draw(); } },
      { label: 'Go inside an array', run: () => { if (!Array.isArray(data.langs) || data.langs.length < 2) data.langs = ['js', 'py']; sel = ['langs', 1]; draw(); } }
    ] });
  const tree = h('div.viz-tree', { role: 'tree', 'aria-label': 'Object properties' });
  const detail = h('div.viz-detail'), json = h('pre.code-block.viz-json');
  f.stage.append(h('div.viz-cols', null,
    h('div.viz-box', null, h('div.viz-lbl', { text: 'The object' }), tree),
    h('div.viz-box', null, h('div.viz-lbl', { text: 'Selected' }), detail, h('div.viz-lbl', { text: 'Equivalent JSON' }), json)));
  tree.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const all = [...tree.querySelectorAll('.viz-tn')], i = all.indexOf(document.activeElement);
    if (i < 0) return; e.preventDefault(); all[Math.min(all.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
  });

  function row(key, val, path, depth) {
    const sk = path.join('\u0000'), branch = isBranch(val), open = !closed.has(sk);
    const isSel = sk === sel.join('\u0000');
    const label = h('button.viz-tn' + (isSel ? '.sel' : ''), { type: 'button', role: 'treeitem', 'aria-selected': isSel, 'aria-level': depth + 1, 'aria-expanded': branch ? open : null, style: `--d:${depth}`, on: { click: () => { sel = path; draw(); f.touch(); } } },
      branch ? h('span.viz-caret' + (open ? '.open' : ''), { on: { click: e => { e.stopPropagation(); open ? closed.add(sk) : closed.delete(sk); draw(); } } }, ic('down')) : h('span.viz-caret.none'),
      h('span.k.mono', { text: typeof key === 'number' ? `[${key}]` : key }), h('span.c.mono', { text: ':' }),
      branch ? h('span.s.mono', { text: Array.isArray(val) ? `Array(${val.length})` : `{${Object.keys(val).length}}` }) : h('span.v.mono', { 'data-t': typeof val === 'object' ? 'null' : typeof val, text: fmt(val) }));
    const out = [label];
    if (branch && open) for (const [k, v] of Object.entries(val)) out.push(...row(Array.isArray(val) ? +k : k, v, [...path, Array.isArray(val) ? +k : k], depth + 1));
    return out;
  }
  function draw() {
    if (get(data, sel) === undefined && sel.length) sel = [];
    const focus = document.activeElement?.closest?.('.viz-tn') ? sel.join('\u0000') : null;
    tree.replaceChildren(h('div.viz-tn.root.mono', { text: ROOT + ' = ' + (Array.isArray(data) ? '[ ]' : '{ }') }), ...Object.entries(data).flatMap(([k, v]) => row(k, v, [k], 0)));
    json.innerHTML = `<code>${highlight(JSON.stringify(data, null, 2), 'js')}</code>`;
    detail.replaceChildren(...detailView());
    if (focus !== null) tree.querySelector('.viz-tn.sel')?.focus();
  }
  function detailView() {
    const v = sel.length ? get(data, sel) : data, p = pathStr(sel);
    const parentPath = sel.slice(0, -1), parent = get(data, parentPath), key = sel.at(-1);
    const msg = h('div.viz-msg', { 'aria-live': 'polite' });
    const out = [h('div.viz-path', null, h('span.viz-lbl', { text: 'Dot-access path' }), h('code.mono.viz-pathc', { text: p })), h('div.viz-row', null, typeChip(v), h('span.mono.viz-dim', { text: isBranch(v) ? (Array.isArray(v) ? `length ${v.length}` : `${Object.keys(v).length} keys`) : fmt(v) }))];
    if (!isBranch(v) && sel.length) {
      const inp = h('input.input.mono', { 'aria-label': 'New value', placeholder: 'new value' }); inp.value = fmt(v);
      const save = () => { const r = parseLiteral(inp.value); if (!r.ok) { msg.className = 'viz-msg err'; msg.textContent = r.error; return; } parent[key] = r.value; setCode(ln, `${p} = ${fmt(r.value)};`); draw(); f.touch(); f.say(`${p} is now ${fmt(r.value)}`); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(); });
      const ln = code(`${p};  // ${fmt(v)}`);
      out.push(h('div.viz-ctl', null, inp, h('button.btn.sm.p', { type: 'button', on: { click: save } }, 'Set value')), ln);
    } else out.push(code(`${p};  // ${isBranch(v) ? (Array.isArray(v) ? 'an array' : 'an object') : ''}`));
    if (isBranch(v)) {
      const kin = h('input.input.mono', { 'aria-label': 'New property name', placeholder: Array.isArray(v) ? '(array: push)' : 'new key', disabled: Array.isArray(v) });
      const vin = h('input.input.mono', { 'aria-label': 'New property value', placeholder: 'value' }); vin.value = '"hello"';
      const add = () => {
        const r = parseLiteral(vin.value); if (!r.ok) { msg.className = 'viz-msg err'; msg.textContent = r.error; return; }
        let k;
        if (Array.isArray(v)) { v.push(r.value); k = v.length - 1; }
        else { k = kin.value.trim(); if (!k) { msg.className = 'viz-msg err'; msg.textContent = 'Give the new property a name.'; kin.focus(); return; } v[k] = r.value; }
        sel = [...sel, k]; closed.delete(sel.slice(0, -1).join('\u0000')); draw(); f.touch(); f.say(`Added ${pathStr(sel)}`);
      };
      out.push(h('div.viz-lbl', { text: Array.isArray(v) ? 'Push an item' : 'Add a property' }), h('div.viz-ctl', null, kin, vin, h('button.btn.sm', { type: 'button', on: { click: add } }, ic('plus'), 'Add')));
    }
    if (sel.length) out.push(h('button.btn.sm.ghost', { type: 'button', on: { click: () => { if (Array.isArray(parent)) parent.splice(key, 1); else delete parent[key]; f.say(Array.isArray(parent) ? `Removed ${p}` : `delete ${p}`); sel = parentPath; draw(); f.touch(); } } }, ic('trash'), Array.isArray(parent) ? 'Remove item' : 'Delete property'));
    out.push(msg);
    return out;
  }
  draw();
}
