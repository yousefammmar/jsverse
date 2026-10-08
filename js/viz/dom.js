// DOM Inspector. The preview IS a real DOM subtree; the tree, selectors and edits all use real DOM APIs (textContent only).
import { h, frame, fmt, code, ic } from './kit.js';

const SNIPPET = '<article id="post" class="post"><h2 class="title">Hello DOM</h2><p>Edit <em>me</em> or add a child.</p><ul id="list"><li>one</li><li class="hot">two</li></ul><button class="cta">Click me</button></article>';
const HL = 'viz-hl';
const tagOf = n => n.nodeType === 1 ? n.tagName.toLowerCase() : '#text';

export function mount(el, { compact } = {}) {
  const root = new DOMParser().parseFromString(SNIPPET, 'text/html').body.firstElementChild;   // trusted constant
  let sel = root; const closed = new WeakSet();
  const f = frame(el, { id: 'dom', title: 'DOM Inspector', compact,
    notice: 'The tree and the preview are the same objects. Selecting one highlights the other, and every selector shown is checked against the real DOM.',
    tries: [
      { label: 'Select by id', run: () => select(root) },
      { label: 'Select by class', run: () => select(root.querySelector('.hot') || root.querySelector('li')) },
      { label: 'Add a list item', run: () => { select(root.querySelector('#list') || root); add('li'); } }
    ] });
  const tree = h('div.viz-tree.dom', { role: 'tree', 'aria-label': 'DOM tree' }), pv = h('div.viz-dompv', { 'aria-label': 'Live preview' }, root), info = h('div.viz-detail');
  f.stage.append(h('div.viz-cols', null,
    h('div.viz-box', null, h('div.viz-lbl', { text: 'Tree' }), tree, h('div.viz-lbl', { text: 'Live preview (click anything)' }), pv),
    h('div.viz-box', null, h('div.viz-lbl', { text: 'Selected node' }), info)));
  tree.addEventListener('keydown', e => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const all = [...tree.querySelectorAll('.viz-tn')], i = all.indexOf(document.activeElement); if (i < 0) return; e.preventDefault();
    all[Math.min(all.length - 1, Math.max(0, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
  });
  pv.addEventListener('click', e => { const t = e.target.closest('*'); if (t && root.contains(t)) { e.preventDefault(); select(t); } });

  const kids = n => [...n.childNodes].filter(c => c.nodeType === 1 || (c.nodeType === 3 && c.data.trim()));
  const cl = n => [...n.classList].filter(c => c !== HL);
  function selector(n) {
    if (n.id) return `#${CSS.escape(n.id)}`;
    const t = tagOf(n) + cl(n).map(c => '.' + CSS.escape(c)).join('');
    const hit = root.querySelectorAll(t);
    if ((hit.length === 1 && hit[0] === n) || (n === root && root.matches(t))) return t;
    const par = n.parentElement; if (!par || n === root) return t;
    return `${selector(par)} > ${tagOf(n)}:nth-child(${[...par.children].indexOf(n) + 1})`;
  }
  function row(n, depth) {
    const isEl = n.nodeType === 1, ch = isEl ? kids(n) : [], open = !closed.has(n), c = isEl ? cl(n) : [];
    const b = h('button.viz-tn' + (n === sel ? '.sel' : ''), { type: 'button', role: 'treeitem', 'aria-selected': n === sel, 'aria-level': depth + 1, 'aria-expanded': ch.length ? open : null, style: `--d:${depth}`, on: { click: () => select(n) } },
      ch.length ? h('span.viz-caret' + (open ? '.open' : ''), { on: { click: e => { e.stopPropagation(); open ? closed.add(n) : closed.delete(n); draw(); } } }, ic('down')) : h('span.viz-caret.none'),
      isEl ? [h('span.k.mono', { text: '<' + tagOf(n) }), n.id ? h('span.v.mono', { 'data-t': 'string', text: ` #${n.id}` }) : null, c.length ? h('span.v.mono', { 'data-t': 'number', text: ' .' + c.join('.') }) : null, h('span.k.mono', { text: '>' })]
        : [h('span.v.mono', { 'data-t': 'string', text: JSON.stringify(n.data.trim().slice(0, 28)) })]);
    return [b, ...(isEl && open ? ch.flatMap(k => row(k, depth + 1)) : [])];
  }
  function draw() {
    [root, ...root.querySelectorAll('.' + HL)].forEach(x => x.classList.remove(HL));
    (sel.nodeType === 1 ? sel : sel.parentElement)?.classList.add(HL);
    const focused = tree.contains(document.activeElement);
    tree.replaceChildren(...row(root, 0));
    if (focused) tree.querySelector('.sel')?.focus();
    info.replaceChildren(...details());
  }
  function select(n) { if (!n || !root.contains(n)) return; sel = n; draw(); f.touch(); f.say(`Selected ${tagOf(n)}${n.id ? ' with id ' + n.id : ''}`); }
  function details() {
    const n = sel, out = [];
    if (n.nodeType !== 1) {
      const inp = h('input.input.mono', { 'aria-label': 'Text node content' }); inp.value = n.data;
      return [h('div.viz-row', null, h('span.viz-ty', { 'data-t': 'string', text: '#text' }), h('span.viz-dim', { text: 'nodeType 3 (a text node)' })), inp,
        h('button.btn.sm.p', { type: 'button', on: { click: () => { n.data = inp.value; draw(); f.touch(); } } }, 'Set node data'), code('textNode.data = "..."')];
    }
    const s = selector(n), many = root.querySelectorAll(s).length + (root.matches(s) ? 1 : 0);
    const attrs = [...n.attributes].map(a => [a.name, a.name === 'class' ? cl(n).join(' ') : a.value]).filter(([k, v]) => !(k === 'class' && !v));
    out.push(h('div.viz-row', null, h('span.viz-ty', { 'data-t': 'object', text: `<${tagOf(n)}>` }), h('span.viz-dim.mono', { text: `${n.children.length} child element${n.children.length === 1 ? '' : 's'}` })),
      h('div.viz-lbl', { text: 'How to select it' }), code(`document.querySelector("${s}")`),
      h('small.viz-dim', { text: n.id ? `An id is unique on the page, so #${n.id} is the most direct selector.` : s.includes(':nth-child') ? 'No unique id or class, so a position in the tree is used.' : cl(n).length ? `Class selector. It matches ${many} element${many === 1 ? '' : 's'} in this snippet.` : `Tag selector. It matches ${many} element${many === 1 ? '' : 's'} in this snippet.` }),
      h('div.viz-lbl', { text: 'textContent' }), h('div.viz-prop.mono', { text: fmt(n.textContent) }),
      h('div.viz-lbl', { text: 'Attributes' }),
      attrs.length ? h('dl.viz-attrs', null, ...attrs.flatMap(([k, v]) => [h('dt.mono', { text: k }), h('dd.mono', { text: fmt(v) })])) : h('small.viz-dim', { text: 'none' }));
    const txt = h('input.input.mono', { 'aria-label': 'New textContent' }); txt.value = n.textContent;
    out.push(h('div.viz-lbl', { text: 'Edit' }), h('div.viz-ctl', null, txt, h('button.btn.sm', { type: 'button', on: { click: () => { n.textContent = txt.value; draw(); f.touch(); f.say('textContent updated'); } } }, 'Set textContent')),
      n.children.length ? h('small.viz-dim', { text: 'Setting textContent replaces all children of this node with one text node.' }) : null,
      h('div.viz-lbl', { text: 'Add a child' }), h('div.viz-ctl', null, ...['li', 'p', 'span', 'button'].map(t => h('button.btn.sm', { type: 'button', on: { click: () => add(t) } }, ic('plus'), h('span.mono', { text: t })))));
    if (n !== root) out.push(h('button.btn.sm.ghost', { type: 'button', on: { click: () => { const p = n.parentElement; n.remove(); sel = p; draw(); f.touch(); f.say('Node removed'); } } }, ic('trash'), 'Remove this node'));
    return out;
  }
  function add(tag) {
    const n = sel.nodeType === 1 ? sel : sel.parentElement, c = document.createElement(tag);
    c.textContent = `new ${tag}`; n.appendChild(c); closed.delete(n); sel = c; draw(); f.touch(); f.say(`Added a ${tag} inside ${tagOf(n)}`);
  }
  draw();
}
