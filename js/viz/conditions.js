// Decision flowchart: the branch that lights up is computed by actually evaluating the conditions in order.
import { h, frame, parseLiteral, fmt, ic, reducedMotion, clamp } from './kit.js';
import { highlight } from '../editor.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...kids); return e; };
const CX = 95, YS = [62, 142, 222], BOX = { x: 215, w: 150, h: 36 };
const OUT = ['"Please log in"', '"Welcome back"', '"Teen mode"', '"Kids mode"'];
const SRC = ['if (!loggedIn) {', '} else if (age >= 18) {', '} else if (age >= 13) {', '} else {'];
const LINES = [
  ['if (!loggedIn) {', '  msg = "Please log in";'],
  ['} else if (age >= 18) {', '  msg = "Welcome back";'],
  ['} else if (age >= 13) {', '  msg = "Teen mode";'],
  ['} else {', '  msg = "Kids mode";', '}']];

export function mount(el, { compact } = {}) {
  const st = { age: 20, loggedIn: true };
  const f = frame(el, { id: 'conditions', title: 'Decision Flowchart', compact,
    notice: 'Only one branch ever runs, and the checks go top to bottom. Once a condition is true, every later else if is skipped without being tested.',
    tries: [
      { label: 'Log out', run: () => set({ loggedIn: false }) },
      { label: 'Exactly 18', run: () => set({ age: 18, loggedIn: true }) },
      { label: 'Empty age gives NaN', run: () => set({ age: NaN, loggedIn: true }) },
      { label: '5 === "5" vs 5 == "5"', run: () => { A.value = '5'; B.value = '"5"'; eq(); } }
    ] });
  const age = h('input.input.mono', { type: 'number', 'aria-label': 'age', min: 0, max: 120, step: 1 }); age.value = st.age;
  const range = h('input', { type: 'range', min: 0, max: 100, step: 1, 'aria-label': 'age slider' }); range.value = st.age;
  const lg = h('input', { type: 'checkbox', id: 'viz-cd-lg', checked: true });
  const svg = s('svg', { viewBox: '0 0 380 330', class: 'viz-fc', role: 'img', 'aria-label': 'Flowchart of the if / else if / else statement' });
  const nodes = {}, edges = {};
  const edge = (id, d, label, lx, ly) => { const p = s('path', { d, class: 'viz-edge', 'marker-end': 'url(#viz-arr)' }); edges[id] = p; svg.append(p); if (label) svg.append(s('text', { x: lx, y: ly, class: 'viz-edge-l' }, label)); };
  svg.append(s('defs', {}, s('marker', { id: 'viz-arr', viewBox: '0 0 8 8', refX: 6, refY: 4, markerWidth: 6, markerHeight: 6, orient: 'auto' }, s('path', { d: 'M0 0L8 4L0 8z', class: 'viz-arrow' }))));
  edge('start', `M${CX} 16V${YS[0] - 30}`);
  YS.forEach((y, i) => {
    edge('t' + i, `M${CX + 80} ${y}H${BOX.x - 2}`, 'true', CX + 84, y - 6);
    edge('f' + i, `M${CX} ${y + 30}V${i < 2 ? YS[i + 1] - 31 : 276}`, 'false', CX + 8, y + 46);
  });
  svg.append(s('circle', { cx: CX, cy: 10, r: 5, class: 'viz-start' }));
  const labels = ['!loggedIn', 'age >= 18', 'age >= 13'];
  YS.forEach((y, i) => {
    const g = s('g', { class: 'viz-n dia' }, s('polygon', { points: `${CX},${y - 30} ${CX + 80},${y} ${CX},${y + 30} ${CX - 80},${y}` }), s('text', { x: CX, y: y + 4, 'text-anchor': 'middle' }, labels[i]));
    nodes['c' + i] = g; svg.append(g);
    const b = s('g', { class: 'viz-n box' }, s('rect', { x: BOX.x, y: y - 18, width: BOX.w, height: BOX.h, rx: 9 }), s('text', { x: BOX.x + BOX.w / 2, y: y + 4, 'text-anchor': 'middle' }, OUT[i]));
    nodes['o' + i] = b; svg.append(b);
  });
  const eb = s('g', { class: 'viz-n box' }, s('rect', { x: CX - 75, y: 277, width: 150, height: 36, rx: 9 }), s('text', { x: CX, y: 299, 'text-anchor': 'middle' }, OUT[3]));
  nodes.o3 = eb; svg.append(eb, s('text', { x: CX + 82, y: 299, class: 'viz-edge-l' }, 'else'));
  const pulse = s('circle', { r: 7, class: 'viz-pulse', cx: CX, cy: 10, opacity: 0 }); svg.append(pulse);

  const codeBox = h('div.viz-codelines');
  const res = h('div.viz-res.mono', { 'aria-live': 'polite' });
  const lineEls = LINES.map(ls => h('div.viz-cl', { html: ls.map(l => `<div>${highlight(l)}</div>`).join('') }));
  codeBox.append(h('div.viz-cl', { html: `<div>${highlight('let msg;')}</div>` }), ...lineEls);

  const tern = h('div.viz-tern.mono'), A = h('input.input.mono', { 'aria-label': 'left value' }), B = h('input.input.mono', { 'aria-label': 'right value' });
  A.value = '5'; B.value = '"5"';
  const eqOut = h('div.viz-eqs.mono'), eqMsg = h('p.viz-msg', { 'aria-live': 'polite' });
  f.stage.append(h('div.viz-cols.fc',
    null,
    h('div.viz-box', null, h('div.viz-lbl', { text: 'Inputs' }),
      h('div.viz-ctl', null, h('label.mono', { for: 'viz-cd-age', text: 'age' }), age, range),
      h('label.viz-switch', { for: 'viz-cd-lg' }, lg, h('span.track'), h('span.mono', { text: 'loggedIn' }), h('b.mono', { id: 'viz-cd-lgv' })),
      codeBox, res),
    h('div.viz-box.chart', null, svg)),
    h('div.viz-cols', null,
      h('div.viz-box', null, h('div.viz-lbl', { text: 'The ternary: an if/else in one expression' }), tern),
      h('div.viz-box', null, h('div.viz-lbl', { text: '=== (strict) vs == (loose)' }), h('div.viz-ctl', null, A, h('span.viz-eq', { text: 'and' }), B), eqOut, eqMsg)));
  age.id = 'viz-cd-age';

  let token = 0;
  const conds = [() => !st.loggedIn, () => st.age >= 18, () => st.age >= 13];
  function decide() { const tested = []; for (let i = 0; i < 3; i++) { const r = conds[i](); tested.push(r); if (r) return { branch: i, tested }; } return { branch: 3, tested }; }

  function points(d) {
    const p = [[CX, 10, null], [CX, YS[0] - 30, 'c0']];
    for (let i = 0; i < 3; i++) {
      if (i === d.branch) { p.push([CX + 80, YS[i], 'res:' + i], [BOX.x, YS[i], 'o' + i]); return p; }
      p.push([CX, YS[i] + 30, 'res:' + i], [CX, i < 2 ? YS[i + 1] - 30 : 277, i < 2 ? 'c' + (i + 1) : 'o3']);
    }
    return p;
  }
  async function animate(d) {
    const my = ++token;
    Object.values(nodes).forEach(n => n.setAttribute('class', n.getAttribute('class').replace(/ (on|t|f|look)\b/g, '')));
    Object.values(edges).forEach(e => e.classList.remove('on'));
    const pts = points(d);
    const mark = (tag) => {
      if (!tag) return;
      if (tag.startsWith('res:')) { const i = +tag.slice(4); nodes['c' + i].classList.add(d.tested[i] ? 't' : 'f'); edges[(d.tested[i] ? 't' : 'f') + i].classList.add('on'); }
      else if (tag.startsWith('o')) nodes[tag].classList.add('on');
    };
    if (reducedMotion()) { pts.forEach(p => mark(p[2])); return; }
    pulse.setAttribute('opacity', 1);
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], len = Math.hypot(x1 - x0, y1 - y0), dur = Math.max(120, len * 2.6);
      await new Promise(res => { const t0 = performance.now(); const tick = now => { if (my !== token) return res(); const u = clamp((now - t0) / dur, 0, 1); pulse.setAttribute('cx', x0 + (x1 - x0) * u); pulse.setAttribute('cy', y0 + (y1 - y0) * u); u < 1 ? requestAnimationFrame(tick) : res(); }; requestAnimationFrame(tick); });
      if (my !== token) return;
      mark(pts[k][2]);
      if (pts[k][2]?.startsWith('c')) nodes[pts[k][2]].classList.add('look');
    }
    await new Promise(r => setTimeout(r, 250));
    if (my === token) pulse.setAttribute('opacity', 0);
  }
  function update(touch = true) {
    const d = decide();
    lineEls.forEach((l, i) => l.classList.toggle('hit', i === d.branch));
    document.getElementById('viz-cd-lgv').textContent = '= ' + st.loggedIn;
    res.textContent = `age = ${st.age}, loggedIn = ${st.loggedIn}  ->  msg = ${OUT[d.branch]}${Number.isNaN(st.age) && d.branch === 3 ? '   (NaN >= 18 and NaN >= 13 are both false)' : ''}`;
    tern.textContent = `const label = age >= 18 ? "adult" : "minor";  // ${st.age >= 18 ? '"adult"' : '"minor"'}`;
    animate(d); if (touch) f.touch();
    f.say(`${OUT[d.branch]} runs. Conditions tested: ${d.tested.map((t, i) => labels[i] + ' is ' + t).join(', ')}.`);
  }
  function set(p) { Object.assign(st, p); age.value = Number.isNaN(st.age) ? '' : st.age; range.value = Number.isNaN(st.age) ? 0 : st.age; lg.checked = st.loggedIn; update(); }
  age.addEventListener('input', () => { st.age = age.value === '' ? NaN : age.valueAsNumber; range.value = clamp(st.age || 0, 0, 100); update(); });
  range.addEventListener('input', () => { st.age = +range.value; age.value = st.age; update(); });
  lg.addEventListener('change', () => { st.loggedIn = lg.checked; update(); });
  function eq(quiet) {
    const a = parseLiteral(A.value), b = parseLiteral(B.value);
    if (!a.ok || !b.ok) { eqMsg.className = 'viz-msg err'; eqMsg.textContent = !a.ok ? a.error : b.error; return; }
    eqMsg.className = 'viz-msg'; eqMsg.textContent = '';
    const strict = a.value === b.value, loose = a.value == b.value;      // eslint-disable-line eqeqeq
    eqOut.replaceChildren(h('div.viz-eqr' + (strict ? '.t' : '.f'), { text: `${fmt(a.value)} === ${fmt(b.value)}  ->  ${strict}` }), h('div.viz-eqr' + (loose ? '.t' : '.f'), { text: `${fmt(a.value)} == ${fmt(b.value)}  ->  ${loose}` }),
      strict !== loose ? h('small', { text: '== converts types before comparing. === never does. Prefer ===.' }) : null);
    if (!quiet) f.touch();
  }
  A.addEventListener('input', () => eq()); B.addEventListener('input', () => eq());
  update(false); eq(true);
}
