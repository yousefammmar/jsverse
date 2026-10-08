// Tracking Laboratory: "Event Intelligence Studio".
// Shop (left) pushes GA4-shaped events into a DataLayerSim, the Timeline (centre) shows them live, the Inspector (right) explains them.
// Learner code always runs in the sandbox via createWorkbench; its pushes are mirrored into the same simulation.
// Nothing here talks to Google Tag Manager or GA4: a dataLayer push only stores data.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { createWorkbench } from '../workbench.js';
import { runJS, runDomChecks } from '../sandbox.js';
import { award, unlock, toast } from '../xp.js';
import { XP } from '../data/gamification.js';
import { store } from '../store.js';
import { bitSay } from '../bit.js';
import { DataLayerSim, fmtTime, payloadSummary, isEcom } from '../datalayer.js';
import { reducedMotion } from '../settings.js';
mountLayout('lab.html');

/* ------------------------------------------------------------------ helpers */
const h = (t, a = {}, ...c) => {
  const e = document.createElement(t);
  for (const [k, v] of Object.entries(a)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v === true ? '' : v);
  }
  c.flat().forEach(x => x != null && e.append(x));
  return e;
};
const r2 = n => Math.round(n * 100) / 100;
const money = n => '$' + r2(n).toFixed(2);
const copyText = async (text, title) => {
  try { await navigator.clipboard.writeText(text); toast({ title, sub: 'Copied to your clipboard.' }); }
  catch { toast({ title: 'Copy failed', sub: 'Your browser blocked clipboard access.' }); }
};
const sim = new DataLayerSim();

/* ------------------------------------------------------------------ products and art */
const BODY = '<ellipse cx="80" cy="108" rx="46" ry="6" fill="#073D3A" opacity=".13"/>';
const PRODUCTS = [
  { item_id: 'SKU1', item_name: 'Notebook', price: 9.5, tint: '#ffe3dd', blurb: 'A5, 120 pages, dotted. Lies flat.',
    art: BODY + '<rect x="48" y="14" width="64" height="88" rx="6" fill="#FF8B7B"/><rect x="48" y="14" width="13" height="88" rx="5" fill="#e9705f"/><rect x="68" y="30" width="34" height="6" rx="3" fill="#fff" opacity=".9"/><rect x="68" y="42" width="24" height="4" rx="2" fill="#fff" opacity=".6"/><g fill="#073D3A">' + [24, 38, 52, 66, 80, 94].map(y => `<circle cx="53" cy="${y}" r="3.2"/>`).join('') + '</g>' },
  { item_id: 'SKU2', item_name: 'Pen set', price: 4.25, tint: '#d9f4ee', blurb: 'Three fine liners that never skip.',
    art: BODY + '<rect x="26" y="78" width="108" height="22" rx="7" fill="#073D3A"/><g transform="rotate(-26 80 90)"><rect x="34" y="40" width="86" height="9" rx="4.5" fill="#0f9d86"/><path d="M120 40l12 4.5-12 4.5z" fill="#073D3A"/><rect x="34" y="54" width="86" height="9" rx="4.5" fill="#F7DF1E"/><path d="M120 54l12 4.5-12 4.5z" fill="#073D3A"/><rect x="34" y="68" width="86" height="9" rx="4.5" fill="#8d6cf0"/><path d="M120 68l12 4.5-12 4.5z" fill="#073D3A"/></g>' },
  { item_id: 'SKU3', item_name: 'Backpack', price: 39, tint: '#e6dfff', blurb: '22 litres, laptop sleeve, quiet zips.',
    art: BODY + '<path d="M64 32a16 14 0 0 1 32 0" fill="none" stroke="#5a3fb0" stroke-width="6" stroke-linecap="round"/><rect x="38" y="30" width="84" height="78" rx="24" fill="#8d6cf0"/><rect x="50" y="64" width="60" height="32" rx="11" fill="#6f4fd0"/><rect x="62" y="74" width="36" height="5" rx="2.5" fill="#F7DF1E"/><rect x="56" y="42" width="48" height="6" rx="3" fill="#fff" opacity=".35"/>' },
  { item_id: 'SKU4', item_name: 'Headphones', price: 59, tint: '#fff3b8', blurb: 'Closed-back, 30 hour battery.',
    art: BODY + '<path d="M42 72V62a38 38 0 0 1 76 0v10" fill="none" stroke="#073D3A" stroke-width="8" stroke-linecap="round"/><rect x="28" y="62" width="24" height="38" rx="11" fill="#0f9d86"/><rect x="108" y="62" width="24" height="38" rx="11" fill="#0f9d86"/><rect x="28" y="72" width="8" height="18" rx="4" fill="#073D3A" opacity=".55"/><rect x="124" y="72" width="8" height="18" rx="4" fill="#073D3A" opacity=".55"/>' },
  { item_id: 'SKU5', item_name: 'Water bottle', price: 18, tint: '#d4f6f3', blurb: 'Steel, keeps cold for a full day.',
    art: BODY + '<rect x="68" y="10" width="24" height="12" rx="4" fill="#073D3A"/><rect x="62" y="20" width="36" height="84" rx="14" fill="#36DCCB"/><rect x="62" y="56" width="36" height="16" fill="#F7DF1E"/><rect x="68" y="30" width="5" height="20" rx="2.5" fill="#fff" opacity=".5"/>' },
  { item_id: 'SKU6', item_name: 'Mug', price: 12.5, tint: '#fff0c2', blurb: 'Stoneware, 350 ml, dishwasher safe.',
    art: BODY + '<path d="M58 30c-6-6 6-8 0-16M74 30c-6-6 6-8 0-16M90 30c-6-6 6-8 0-16" fill="none" stroke="#073D3A" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/><path d="M104 54h8a12 12 0 0 1 0 28h-8" fill="none" stroke="#d9bf00" stroke-width="7"/><rect x="42" y="38" width="64" height="64" rx="11" fill="#F7DF1E"/><circle cx="74" cy="70" r="11" fill="#fff" opacity=".6"/>' }
];
const art = p => `<svg viewBox="0 0 160 116" role="img" aria-label="${p.item_name} illustration">${p.art}</svg>`;
const lineOf = (p, quantity) => ({ item_id: p.item_id, item_name: p.item_name, price: p.price, quantity });

/* ------------------------------------------------------------------ page skeleton */
const TABS = [['shop', 'Shop', 'store'], ['tl', 'Timeline', 'timeline'], ['insp', 'Inspector', 'inspect'], ['code', 'Code', 'code']];
document.getElementById('main').innerHTML = `
<div class="pagehead"><span class="eyebrow">Event Intelligence Studio</span><h1>Tracking <em>Laboratory</em></h1>
<p class="lead">Use the shop, write your own pushes, and watch every <code>dataLayer</code> event arrive, get validated against GA4 ecommerce rules, and open up in the inspector.</p></div>
<div class="lab" data-v="shop">
  <div class="lab-tabs tabs" role="tablist" aria-label="Studio panels">${TABS.map(([id, t, i], n) => `<button class="lab-tab" role="tab" id="labtab-${id}" data-t="${id}" aria-controls="labp-${id}" aria-selected="${n === 0}" tabindex="${n === 0 ? 0 : -1}">${ic(i)} ${t}</button>`).join('')}</div>
  <div class="lab-grid">
    <section class="lab-p lab-p-shop" id="labp-shop" role="tabpanel" aria-labelledby="labtab-shop">
      <header class="lab-ph"><h2>${ic('store')} Simulated shop</h2><span class="lab-hint">Every click is real tracking</span></header>
      <div class="lab-scroll">
        <div class="lab-browser">
          <div class="lab-bar"><span class="lab-dots" aria-hidden="true"><i></i><i></i><i></i></span>
            <div class="lab-url" aria-label="Address bar">${ic('lock')}<span>shop.example.test</span><b id="lab-path">/</b></div>
            <button class="lab-cartbtn" id="lab-cartbtn" type="button" aria-label="Open cart">${ic('cart')}<b id="lab-cartn">0</b></button></div>
          <div class="lab-site" id="lab-site"></div>
        </div>
        <div class="lab-break"><div class="lab-break-h">${ic('bug')} Break it on purpose <span>push deliberately wrong events and watch the validator react</span></div>
          <div class="lab-break-b" id="lab-break"></div></div>
      </div>
    </section>
    <section class="lab-p lab-p-tl" id="labp-tl" role="tabpanel" aria-labelledby="labtab-tl">
      <header class="lab-ph"><h2>${ic('timeline')} Event timeline</h2>
        <span class="sp"></span>
        <button class="lab-btn" id="lab-follow" type="button" aria-pressed="true" title="Scroll to new events and show them in the inspector">${ic('down')} Auto-scroll</button>
        <button class="lab-btn" id="lab-export" type="button" title="Copy all events as JSON">${ic('download')} Export JSON</button>
        <button class="lab-btn" id="lab-clear" type="button" title="Clears only this simulated timeline">${ic('trash')} Clear</button></header>
      <div class="lab-stats" id="lab-stats"></div>
      <div class="lab-filters" role="group" aria-label="Filter events"></div>
      <div class="lab-scroll" id="lab-tlscroll">
        <div class="lab-empty" id="lab-tlempty">${ic('radar')}<b>Waiting for events</b><span>Use the shop or run code. Each push lands here, in order, with its validation result.</span></div>
        <ol class="lab-tl" id="lab-tl" aria-label="Recorded events"></ol>
      </div>
      <div class="sr-only" id="lab-live" role="status" aria-live="polite"></div>
    </section>
    <section class="lab-p lab-p-insp" id="labp-insp" role="tabpanel" aria-labelledby="labtab-insp">
      <header class="lab-ph"><h2>${ic('inspect')} Event inspector</h2></header>
      <div class="lab-scroll" id="lab-insp"></div>
      <div class="lab-simnote" role="note">${ic('info')}<p><b>This is a simulation.</b> A dataLayer push only stores data. Google Tag Manager still needs a tag and a trigger to send anything to GA4.</p></div>
    </section>
    <section class="lab-p lab-p-code" id="labp-code" role="tabpanel" aria-labelledby="labtab-code">
      <header class="lab-ph"><h2>${ic('code')} Code lab</h2><span class="sp"></span>
        <div class="lab-sub" role="tablist" aria-label="Code lab sections">
          <button role="tab" data-s="free" aria-selected="true" id="labsub-free" aria-controls="labsp-free">Your code</button>
          <button role="tab" data-s="ch" aria-selected="false" id="labsub-ch" aria-controls="labsp-ch">Challenges <span class="lab-cnt" id="lab-chcount"></span></button></div></header>
      <div class="lab-codebody">
        <div id="labsp-free" role="tabpanel" aria-labelledby="labsub-free">
          <p class="lab-help">Code runs in an isolated sandbox. Every <code>window.dataLayer.push()</code> you make is mirrored into the timeline and validated. Press <kbd>Ctrl/Cmd</kbd> <kbd>Enter</kbd> to run.</p>
          <div id="lab-wb"></div>
        </div>
        <div id="labsp-ch" role="tabpanel" aria-labelledby="labsub-ch" hidden></div>
      </div>
    </section>
  </div>
</div>`;
const $ = id => document.getElementById(id);
const lab = document.querySelector('.lab');

/* ------------------------------------------------------------------ studio tabs (tablet / mobile) */
function setView(v, focus) {
  lab.dataset.v = v;
  document.querySelectorAll('.lab-tab').forEach(b => { const on = b.dataset.t === v; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
}
document.querySelector('.lab-tabs').addEventListener('click', e => { const b = e.target.closest('[data-t]'); if (b) setView(b.dataset.t); });
document.querySelector('.lab-tabs').addEventListener('keydown', e => {
  const ids = TABS.map(t => t[0]), i = ids.indexOf(lab.dataset.v);
  const n = e.key === 'ArrowRight' ? (i + 1) % 4 : e.key === 'ArrowLeft' ? (i + 3) % 4 : e.key === 'Home' ? 0 : e.key === 'End' ? 3 : -1;
  if (n >= 0) { e.preventDefault(); setView(ids[n], true); }
});

/* ------------------------------------------------------------------ gamification on every recorded entry */
let silent = false;   // the automatic page-load event must never earn rewards: only real learner actions do
function gamify(en) {
  if (silent || en.kind !== 'event') return;
  if (!en.issues.length) { store.set('lab', true); award('lab', XP.lab, 'First clean dataLayer event'); }
  if (en.name === 'purchase' && en.status === 'valid') unlock('tracking');
}

/* ------------------------------------------------------------------ JSON tree (role=tree, keyboard operable) */
function jsonTree(value, marks = new Map()) {
  const root = h('ul', { class: 'lab-tree', role: 'tree', 'aria-label': 'Event payload' });
  const build = (key, val, path, level, inArr) => {
    const isObj = val !== null && typeof val === 'object', arr = Array.isArray(val);
    const li = h('li', { role: 'treeitem', 'aria-level': level, tabindex: '-1', 'data-path': path });
    const row = h('div', { class: 'lab-tn' });
    if (marks.has(path)) { li.classList.add('has-' + marks.get(path)); row.append(h('span', { class: 'lab-flag', html: ic(marks.get(path) === 'err' ? 'x' : 'warn') })); }
    row.append(h('span', { class: 'lab-caret', html: isObj ? ic('chev') : '' }));
    if (key !== null) row.append(h('span', { class: 'lab-k', text: inArr ? String(key) : JSON.stringify(String(key)) }), h('span', { class: 'lab-pu', text: ': ' }));
    if (isObj) {
      const keys = Object.keys(val);
      row.append(h('span', { class: 'lab-brace', text: arr ? `[ ${keys.length} ]` : `{ ${keys.length} }` }));
      li.setAttribute('aria-expanded', 'true');
      const ul = h('ul', { role: 'group' });
      keys.forEach(k => ul.append(build(k, val[k], path ? `${path}.${k}` : k, level + 1, arr)));
      li.append(row, ul);
    } else {
      const t = val === null ? 'null' : typeof val;
      row.append(h('span', { class: 'lab-v lab-t-' + t, text: t === 'string' ? JSON.stringify(val) : String(val) }), h('span', { class: 'lab-ty', text: t }));
      li.append(row);
    }
    return li;
  };
  if (value !== null && typeof value === 'object') root.append(build('payload', value, '', 1));
  else root.append(build('payload', value, '', 1));
  const items = () => [...root.querySelectorAll('[role=treeitem]')].filter(li => !li.parentElement.closest('[aria-expanded=false]'));
  const focusItem = li => { if (!li) return; root.querySelectorAll('[role=treeitem]').forEach(x => x.tabIndex = -1); li.tabIndex = 0; li.focus(); };
  const setOpen = (li, open) => li.hasAttribute('aria-expanded') && li.setAttribute('aria-expanded', open);
  root.querySelector('[role=treeitem]').tabIndex = 0;
  root.addEventListener('click', e => {
    const li = e.target.closest('[role=treeitem]'); if (!li || !root.contains(li)) return;
    focusItem(li); if (li.hasAttribute('aria-expanded') && e.target.closest('.lab-tn')) setOpen(li, li.getAttribute('aria-expanded') !== 'true');
  });
  root.addEventListener('keydown', e => {
    const cur = e.target.closest('[role=treeitem]'); if (!cur) return;
    const vis = items(), i = vis.indexOf(cur), exp = cur.getAttribute('aria-expanded');
    switch (e.key) {
      case 'ArrowDown': focusItem(vis[i + 1]); break;
      case 'ArrowUp': focusItem(vis[i - 1]); break;
      case 'Home': focusItem(vis[0]); break;
      case 'End': focusItem(vis[vis.length - 1]); break;
      case 'ArrowRight': if (exp === 'false') setOpen(cur, true); else if (exp === 'true') focusItem(cur.querySelector('[role=treeitem]')); break;
      case 'ArrowLeft': if (exp === 'true') setOpen(cur, false); else focusItem(cur.parentElement.closest('[role=treeitem]')); break;
      case 'Enter': case ' ': if (exp) setOpen(cur, exp !== 'true'); break;
      default: return;
    }
    e.preventDefault(); e.stopPropagation();
  });
  root.setAll = open => { root.querySelectorAll('[aria-expanded]').forEach(li => li.setAttribute('aria-expanded', open)); focusItem(root.querySelector('[role=treeitem]')); };
  return root;
}

/* ------------------------------------------------------------------ inspector */
const BADGE = { valid: ['ok', 'check', 'valid'], warnings: ['warn', 'warn', 'warnings'], invalid: ['err', 'x', 'invalid'] };
const badge = status => h('span', { class: 'lab-badge ' + BADGE[status][0], html: `${ic(BADGE[status][1])}<span>${BADGE[status][2]}</span>` });
// where in the payload an issue points (so the tree can flag it)
function issuePath(is, payload) {
  const i = (is.msg.match(/items\[(\d+)\]/) || [])[1];
  const p = { 'ecommerce-object': 'ecommerce', items: 'ecommerce.items', 'item-id': `ecommerce.items.${i}`, 'item-price': `ecommerce.items.${i}.price`, 'item-qty': `ecommerce.items.${i}.quantity`,
    currency: 'ecommerce.currency', value: 'ecommerce.value', 'value-type': 'ecommerce.value', 'value-sum': 'ecommerce.value', 'transaction-id': 'ecommerce.transaction_id', 'duplicate-tx': 'ecommerce.transaction_id', 'clear-first': 'event', 'event-name': 'event' }[is.rule] || '';
  const parts = p.split('.'); let cur = payload, out = [];
  for (const k of parts) { if (cur && typeof cur === 'object' && k in cur) { out.push(k); cur = cur[k]; } else break; }
  return out.join('.');
}
const levelLabel = is => is.required ? 'Required by GA4' : is.level === 'tip' ? 'Educational convention' : 'Recommendation';
let selId = null;
function renderInspector() {
  const host = $('lab-insp'), en = sim.entries.find(e => e.id === selId);
  host.replaceChildren();
  if (!en) { host.append(h('div', { class: 'lab-empty', html: `${ic('inspect')}<b>No event selected</b><span>Pick an event on the timeline to see its payload as a tree, plus every validation result and why it matters.</span>` })); return; }
  const marks = new Map();
  en.issues.forEach(is => { const p = issuePath(is, en.payload); if (marks.get(p) !== 'err') marks.set(p, is.level === 'error' ? 'err' : 'warn'); });
  const tree = jsonTree(en.payload, marks);
  const head = h('div', { class: 'lab-ih' },
    h('div', {}, h('div', { class: 'lab-iname', text: en.kind === 'clear' ? '{ ecommerce: null }' : en.name }), h('div', { class: 'lab-imeta', text: `#${en.id} · ${fmtTime(en.ts)} · ${en.kind === 'clear' ? 'clear step' : isEcom(en.name) ? 'GA4 ecommerce event' : en.kind === 'variables' ? 'variables push' : 'custom event'}` })),
    h('span', { class: 'sp' }), en.kind === 'clear' ? null : badge(en.status),
    h('button', { class: 'lab-btn', type: 'button', html: `${ic('copy')} Copy event`, onclick: () => copyText(JSON.stringify(en.payload, null, 2), 'Event copied') }));
  const tools = h('div', { class: 'lab-itools' }, h('h3', { text: 'Payload' }), h('span', { class: 'sp' }),
    h('button', { class: 'lab-btn sm', type: 'button', text: 'Expand all', onclick: () => tree.setAll(true) }),
    h('button', { class: 'lab-btn sm', type: 'button', text: 'Collapse all', onclick: () => tree.setAll(false) }));
  const hintTree = h('p', { class: 'lab-help', html: 'Arrow keys move, <kbd>Right</kbd>/<kbd>Left</kbd> open and close, <kbd>Enter</kbd> toggles.' });
  const sec = h('div', { class: 'lab-val' });
  const errs = en.issues.filter(i => i.required).length, rec = en.issues.length - errs;
  sec.append(h('h3', { text: 'Validation' }));
  if (en.kind === 'clear') sec.append(h('p', { class: 'lab-ok', html: `${ic('check')}<span>This is the step Google recommends before every ecommerce push in GTM. It resets the ecommerce object so old items cannot leak into the next event. It is a recommendation, not a GA4 requirement.</span>` }));
  else if (!en.issues.length) sec.append(h('p', { class: 'lab-ok', html: `${ic('check')}<span>${en.kind === 'event' && !isEcom(en.name) ? 'No rules apply: this simulator only checks GA4 ecommerce events and event-name style, so this custom event passes by default.' : 'Every rule this simulator knows about passed. Nothing was sent anywhere: this only means the shape looks right.'}</span>` }));
  else {
    sec.append(h('p', { class: 'lab-sum', text: `${en.issues.length} issue${en.issues.length === 1 ? '' : 's'}: ${errs} required by GA4, ${rec} recommendation${rec === 1 ? '' : 's'}.` }));
    const ul = h('ul', { class: 'lab-issues' });
    [...en.issues].sort((a, b) => b.required - a.required).forEach(is => ul.append(h('li', { class: is.required ? 'err' : 'warn' },
      h('span', { class: 'lab-ii', html: ic(is.required ? 'x' : 'warn') }),
      h('div', {}, h('div', { class: 'lab-imsg' }, h('b', { text: is.msg }), h('span', { class: 'lab-req ' + (is.required ? 'req' : 'rec'), text: levelLabel(is) })), h('p', { text: is.why })))));
    sec.append(ul);
  }
  host.append(head, tools, hintTree, tree, sec);
}
function select(id, scroll) {
  selId = id;
  $('lab-tl').querySelectorAll('.lab-evb').forEach(b => b.setAttribute('aria-pressed', b.closest('li').dataset.id == id));
  renderInspector();
  if (scroll) { const li = $('lab-tl').querySelector(`[data-id="${id}"]`); li && li.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' }); }
}

/* ------------------------------------------------------------------ timeline */
let filter = 'all', follow = true;
const FILTERS = [['all', 'All', () => true], ['ecom', 'Ecommerce', e => e.kind === 'clear' || isEcom(e.name)], ['issues', 'Issues', e => e.kind !== 'clear' && e.status !== 'valid']];
const inFilter = e => FILTERS.find(f => f[0] === filter)[2](e);
function evNode(en, fresh) {
  const li = h('li', { class: `lab-ev st-${en.status}${en.kind === 'clear' ? ' is-clear' : ''}${fresh && !reducedMotion() ? ' is-new' : ''}`, 'data-id': en.id });
  li.append(h('span', { class: 'lab-dot', 'aria-hidden': 'true' }));
  const btn = h('button', { class: 'lab-evb', type: 'button', 'aria-pressed': en.id === selId, onclick: () => select(en.id) });
  if (en.kind === 'clear') btn.append(h('code', { text: '{ ecommerce: null }' }), h('span', { class: 'lab-evt', text: 'clear step' }), h('time', { text: fmtTime(en.ts) }));
  else {
    btn.append(h('span', { class: 'lab-evtop' }, h('b', { class: 'lab-evname', text: en.name }), badge(en.status), h('time', { text: fmtTime(en.ts) })),
      h('span', { class: 'lab-evsum', text: payloadSummary(en) }));
    if (en.issues.length) btn.append(h('span', { class: 'lab-evis', text: en.issues.map(i => i.msg).slice(0, 2).join(' · ') + (en.issues.length > 2 ? ` · +${en.issues.length - 2} more` : '') }));
  }
  li.append(btn); return li;
}
function renderCounts() {
  const bar = document.querySelector('.lab-filters');
  bar.replaceChildren(...FILTERS.map(([id, t, fn]) => h('button', { class: 'lab-fchip', type: 'button', 'aria-pressed': filter === id, onclick: () => { filter = id; renderTimeline(); } },
    t, h('span', { class: 'lab-cnt', text: sim.entries.filter(fn).length }))));
  $('lab-tlempty').hidden = sim.entries.length > 0;
}
function renderTimeline() {
  const ol = $('lab-tl'); ol.replaceChildren(...sim.entries.filter(inFilter).map(e => evNode(e, false)));
  renderCounts(); renderStats();
}
const STAGES = [['view_item_list', 'List'], ['view_item', 'View'], ['add_to_cart', 'Add'], ['begin_checkout', 'Checkout'], ['purchase', 'Buy']];
function renderStats() {
  const evs = sim.entries.filter(e => e.kind === 'event'), counts = STAGES.map(([n]) => evs.filter(e => e.name === n).length), max = Math.max(1, ...counts);
  const rev = evs.filter(e => e.name === 'purchase' && e.status === 'valid').reduce((s, e) => s + (typeof e.payload.ecommerce.value === 'number' ? e.payload.ecommerce.value : 0), 0);
  const validPct = evs.length ? Math.round(evs.filter(e => e.status === 'valid').length / evs.length * 100) : 0;
  $('lab-stats').innerHTML = `
    <div class="lab-funnel" role="img" aria-label="Funnel: ${STAGES.map(([n, l], i) => `${l} ${counts[i]}`).join(', ')}">${STAGES.map(([n, l], i) => `<div class="lab-fcol"><div class="lab-fbar"><i style="--h:${Math.round(counts[i] / max * 100)}%"></i></div><b>${counts[i]}</b><span>${l}</span></div>`).join('')}</div>
    <div class="lab-kpis"><div><span>Valid events</span><b>${validPct}%</b></div><div><span>Revenue (valid purchases)</span><b>${money(rev)}</b></div>
    <div class="lab-pulse" aria-hidden="true">${evs.slice(-36).map(e => `<i class="st-${e.status}" title="${e.name}"></i>`).join('')}</div></div>`;
}
function onEntry(en) {
  if (!en) { selId = null; renderTimeline(); renderInspector(); return; }
  gamify(en);
  renderCounts(); renderStats();
  if (inFilter(en)) { $('lab-tl').append(evNode(en, true)); }
  $('lab-live').textContent = en.kind === 'clear' ? 'ecommerce cleared' : `${en.name} recorded, ${BADGE[en.status][2]}`;
  if (follow) {
    if (en.kind !== 'clear') select(en.id);
    const sc = $('lab-tlscroll'); requestAnimationFrame(() => sc.scrollTo({ top: sc.scrollHeight, behavior: reducedMotion() ? 'auto' : 'smooth' }));
  }
}
sim.subscribe(onEntry);
$('lab-follow').onclick = e => { follow = !follow; e.currentTarget.setAttribute('aria-pressed', follow); };
$('lab-clear').onclick = () => { sim.reset(); toast({ title: 'Timeline cleared', sub: 'Only the simulation was emptied.' }); };
$('lab-export').onclick = () => sim.entries.length ? copyText(JSON.stringify(sim.entries.map(({ id, ts, name, status, issues, payload }) => ({ id, time: new Date(ts).toISOString(), name, status, issues: issues.map(i => ({ level: i.level, required_by_ga4: i.required, message: i.msg })), payload })), null, 2), 'Timeline exported') : toast({ title: 'Nothing to export', sub: 'Record some events first.' });

/* ------------------------------------------------------------------ shop */
const S = { view: 'list', cart: [], q: {}, detail: null, tx: null, pay: 'card', n: 0 };
const cartCount = () => S.cart.reduce((s, i) => s + i.quantity, 0);
const cartTotal = () => r2(S.cart.reduce((s, i) => s + i.price * i.quantity, 0));
const send = (event, ecommerce) => { sim.push({ ecommerce: null }); sim.push({ event, ecommerce }); };   // Google's GTM pattern: clear, then push
const newTx = () => 'T-' + Date.now().toString(36).toUpperCase() + (++S.n).toString(36).toUpperCase();
const snap = () => ({ currency: 'USD', value: cartTotal(), items: S.cart.map(i => ({ ...i })) });
const listEvent = () => send('view_item_list', { item_list_id: 'all_products', item_list_name: 'All products', items: PRODUCTS.map((p, index) => ({ item_id: p.item_id, item_name: p.item_name, price: p.price, index })) });
function go(view, detail) {
  S.view = view; S.detail = detail ?? null;
  $('lab-path').textContent = { list: '/', product: '/products/' + (detail || '').toLowerCase(), cart: '/cart', pay: '/checkout', done: '/thanks' }[view];
  renderSite();
}
function addToCart(p, n) {
  const it = S.cart.find(i => i.item_id === p.item_id); if (it) it.quantity += n; else S.cart.push(lineOf(p, n));
  send('add_to_cart', { currency: 'USD', value: r2(p.price * n), items: [lineOf(p, n)] });
  toast({ title: `${p.item_name} added`, sub: `${n} × ${money(p.price)}` }); renderSite();
}
function removeFromCart(p, n) {
  const it = S.cart.find(i => i.item_id === p.item_id); if (!it) return;
  n = Math.min(n, it.quantity); it.quantity -= n; if (!it.quantity) S.cart = S.cart.filter(i => i !== it);
  send('remove_from_cart', { currency: 'USD', value: r2(p.price * n), items: [lineOf(p, n)] }); renderSite();
}
function stepper(p, key) {
  const q = S.q[p.item_id] || 1;
  return h('div', { class: 'lab-qty', role: 'group', 'aria-label': `Quantity for ${p.item_name}` },
    h('button', { type: 'button', 'data-k': key + 'm', 'aria-label': 'Decrease quantity', html: ic('minus'), disabled: q <= 1, onclick: () => { S.q[p.item_id] = q - 1; renderSite(); } }),
    h('output', { text: q, 'aria-live': 'polite' }),
    h('button', { type: 'button', 'data-k': key + 'p', 'aria-label': 'Increase quantity', html: ic('plus'), disabled: q >= 9, onclick: () => { S.q[p.item_id] = q + 1; renderSite(); } }));
}
function renderSite() {
  const site = $('lab-site'), ak = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.k : null;
  site.replaceChildren();
  $('lab-cartn').textContent = cartCount();
  const nav = h('nav', { class: 'lab-snav', 'aria-label': 'Shop' }, h('b', { class: 'lab-brand', text: 'Parcel & Co.' }), h('span', { class: 'sp' }),
    h('button', { type: 'button', class: S.view === 'list' ? 'on' : '', text: 'All products', 'data-k': 'nav', onclick: () => { go('list'); listEvent(); } }),
    h('button', { type: 'button', class: S.view === 'cart' ? 'on' : '', text: `Cart (${cartCount()})`, 'data-k': 'navc', onclick: () => go('cart') }));
  site.append(nav);
  const body = h('div', { class: 'lab-sbody' }); site.append(body);
  if (S.view === 'list') {
    body.append(h('div', { class: 'lab-shead' }, h('h3', { text: 'The desk collection' }), h('p', { text: 'Six small things that make a workday better.' })));
    const g = h('div', { class: 'lab-pgrid' });
    PRODUCTS.forEach(p => g.append(h('article', { class: 'lab-card', style: `--tint:${p.tint}` },
      h('button', { type: 'button', class: 'lab-art', html: art(p), 'aria-label': `View ${p.item_name}`, 'data-k': 'v' + p.item_id, onclick: () => { go('product', p.item_id); send('view_item', { currency: 'USD', value: p.price, items: [lineOf(p, 1)] }); } }),
      h('div', { class: 'lab-cbody' }, h('div', { class: 'lab-cname' }, h('b', { text: p.item_name }), h('span', { text: money(p.price) })),
        h('div', { class: 'lab-cact' }, stepper(p, 'q' + p.item_id), h('button', { type: 'button', class: 'lab-add', 'data-k': 'a' + p.item_id, html: `${ic('plus')} Add`, onclick: () => addToCart(p, S.q[p.item_id] || 1) }))))));
    body.append(g);
  } else if (S.view === 'product') {
    const p = PRODUCTS.find(x => x.item_id === S.detail);
    body.append(h('button', { type: 'button', class: 'lab-link', html: `${ic('left')} All products`, onclick: () => { go('list'); listEvent(); } }),
      h('div', { class: 'lab-pdp' }, h('div', { class: 'lab-art big', style: `--tint:${p.tint}`, html: art(p) }),
        h('div', {}, h('h3', { text: p.item_name }), h('p', { class: 'lab-price', text: money(p.price) }), h('p', { class: 'lab-blurb', text: p.blurb }),
          h('div', { class: 'lab-cact' }, stepper(p, 'dq'), h('button', { type: 'button', class: 'lab-add', 'data-k': 'da', html: `${ic('cart')} Add to cart`, onclick: () => addToCart(p, S.q[p.item_id] || 1) })))));
  } else if (S.view === 'cart' || S.view === 'pay') {
    const pay = S.view === 'pay';
    body.append(h('div', { class: 'lab-shead' }, h('h3', { text: pay ? 'Payment' : 'Your cart' })));
    if (!S.cart.length) body.append(h('div', { class: 'lab-sempty' }, h('p', { text: 'Your cart is empty.' }), h('button', { type: 'button', class: 'lab-add', text: 'Browse products', onclick: () => { go('list'); listEvent(); } })));
    else {
      const ul = h('ul', { class: 'lab-lines' });
      S.cart.forEach(i => { const p = PRODUCTS.find(x => x.item_id === i.item_id);
        ul.append(h('li', {}, h('span', { class: 'lab-lart', style: `--tint:${p.tint}`, html: art(p) }), h('div', { class: 'lab-lname' }, h('b', { text: i.item_name }), h('span', { text: `${money(i.price)} each` })),
          pay ? h('span', { class: 'lab-lq', text: `× ${i.quantity}` }) : h('div', { class: 'lab-qty' },
            h('button', { type: 'button', 'aria-label': `Remove one ${i.item_name}`, 'data-k': 'rm' + i.item_id, html: ic('minus'), onclick: () => removeFromCart(p, 1) }), h('output', { text: i.quantity }),
            h('button', { type: 'button', 'aria-label': `Add one ${i.item_name}`, 'data-k': 'ad' + i.item_id, html: ic('plus'), onclick: () => addToCart(p, 1) })),
          h('b', { class: 'lab-lsum', text: money(i.price * i.quantity) }),
          pay ? null : h('button', { type: 'button', class: 'lab-x', 'aria-label': `Remove ${i.item_name} from cart`, html: ic('trash'), onclick: () => removeFromCart(p, i.quantity) }))); });
      body.append(ul, h('div', { class: 'lab-total' }, h('span', { text: 'Total' }), h('b', { text: money(cartTotal()) })));
      if (!pay) body.append(h('div', { class: 'lab-sact' }, h('button', { type: 'button', class: 'lab-link', text: 'Keep shopping', onclick: () => { go('list'); listEvent(); } }),
        h('button', { type: 'button', class: 'lab-add', 'data-k': 'co', html: `Begin checkout ${ic('right')}`, onclick: () => { send('begin_checkout', snap()); go('pay'); } })));
      else {
        const pm = h('fieldset', { class: 'lab-pm' }, h('legend', { text: 'Payment method' }));
        [['card', 'Test card', '4242 4242 4242 4242 (simulated)'], ['invoice', 'Pay by invoice', 'Pay within 14 days (simulated)']].forEach(([id, t, d]) =>
          pm.append(h('label', {}, h('input', { type: 'radio', name: 'pm', value: id, checked: S.pay === id, onchange: () => { S.pay = id; } }), h('span', {}, h('b', { text: t }), h('em', { text: d })))));
        body.append(pm, h('p', { class: 'lab-fine', text: 'Nothing is charged. This whole shop is a simulation.' }), h('div', { class: 'lab-sact' },
          h('button', { type: 'button', class: 'lab-link', text: 'Back to cart', onclick: () => go('cart') }),
          h('button', { type: 'button', class: 'lab-add', 'data-k': 'pay', html: `${ic('card')} Pay ${money(cartTotal())}`, onclick: () => {
            const tx = newTx(); S.tx = tx; const ec = { transaction_id: tx, ...snap() }; send('purchase', ec); S.cart = []; go('done'); } })));
      }
    }
  } else if (S.view === 'done') {
    body.append(h('div', { class: 'lab-done' }, h('span', { class: 'lab-donei', html: ic('check') }), h('h3', { text: 'Order placed' }),
      h('p', {}, 'Your simulated transaction id is ', h('code', { text: S.tx }), '. Open the purchase in the inspector to see it in the payload.'),
      h('button', { type: 'button', class: 'lab-add', text: 'Continue shopping', 'data-k': 'cs', onclick: () => { go('list'); listEvent(); } })));
  }
  if (ak) { const el = site.querySelector(`[data-k="${ak}"]`); if (el && !el.disabled) el.focus(); }
}
$('lab-cartbtn').onclick = () => go('cart');

const GOOD = [lineOf(PRODUCTS[0], 2)];   // Notebook x2 = 19.00
const BREAKS = [
  ['Broken purchase', 'No clear step, no transaction_id, wrong value', () => sim.push({ event: 'purchase', ecommerce: { currency: 'USD', value: 5, items: [{ item_name: 'Notebook', price: 9.5, quantity: 2 }] } })],
  ['Missing currency', 'value without currency', () => send('purchase', { transaction_id: newTx(), value: 19, items: GOOD })],
  ['Wrong value', 'value 12 but the items add up to 19', () => send('purchase', { transaction_id: newTx(), currency: 'USD', value: 12, items: GOOD })],
  ['String value', '"19.00" instead of 19', () => send('purchase', { transaction_id: newTx(), currency: 'USD', value: '19.00', items: GOOD })],
  ['Duplicate transaction_id', 'same order sent twice', () => { const tx = newTx(), ec = { transaction_id: tx, currency: 'USD', value: 19, items: GOOD }; send('purchase', ec); send('purchase', ec); }]
];
BREAKS.forEach(([t, d, fn]) => $('lab-break').append(h('button', { type: 'button', class: 'lab-bk', title: d, onclick: fn }, h('b', { text: t }), h('span', { text: d }))));
renderSite();
setTimeout(() => { silent = true; listEvent(); silent = false; }, 350);   // like a real page load: the product list was viewed (no rewards)

/* ------------------------------------------------------------------ code lab */
const wire = wb => { const run = wb.run; wb.run = () => { sim.newRun(); return run(); }; return wb; };   // a run is a fresh page load for the simulator
const onCodeEvent = m => { if (m.t === 'dl') sim.push(m.payload); };
wire(createWorkbench($('lab-wb'), {
  files: { js: `// Your sandbox. Every push below appears in the Event Timeline.
// Remember: a push only stores data. GTM still needs a tag and a trigger to send it to GA4.

// 1. Clear the previous ecommerce object (Google's recommendation for GTM).
window.dataLayer.push({ ecommerce: null });

// 2. Push a GA4-shaped event. value = price x quantity of all items.
window.dataLayer.push({
  event: "add_to_cart",
  ecommerce: {
    currency: "USD",
    value: 19,
    items: [{ item_id: "SKU1", item_name: "Notebook", price: 9.5, quantity: 2 }]
  }
});

// Try it: delete the currency, make value a string, or drop the clear step, then run again.
// Do not write window.dataLayer = []; that replaces the array and breaks GTM.
` }, filename: 'my-tracking.js', height: 360, autorun: false, onEvent: onCodeEvent
}));

/* ---- challenges ---- */
const analyse = payloads => { const s = new DataLayerSim(); payloads.forEach(p => s.push(p)); return s.entries; };
const evs = (en, name) => en.filter(e => e.kind === 'event' && e.name === name);
const ids = e => (e.payload.ecommerce?.items || []).map(i => i.item_id);
const KNOWN = new Set(['event', 'ecommerce', 'currency', 'value', 'items', 'item_id', 'item_name', 'price', 'quantity', 'transaction_id']);
const keysOf = (o, out = []) => { if (o && typeof o === 'object') for (const k of Object.keys(o)) { if (!/^\d+$/.test(k)) out.push(k); keysOf(o[k], out); } return out; };
const jsCheck = fn => async files => {
  const r = await runJS(files.js || '');
  const checks = [{ name: 'Code runs without errors', pass: !r.error, detail: r.error && `${r.error.name}: ${r.error.message}` }];
  if (!r.error) checks.push(...fn(analyse(r.dataLayer), r));
  return checks;
};
const ok = (name, pass, detail) => ({ name, pass: !!pass, detail: pass ? '' : detail });

const CHALLENGES = [
  { id: 'two-adds', title: 'Add two products to the cart', diff: 'Easy', files: { js: `// A shopper adds a Notebook, then a Backpack. Track both.
// The Notebook is already done. Track the Backpack (SKU3, $39, quantity 1) the same way.
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: "add_to_cart",
  ecommerce: {
    currency: "USD",
    value: 9.5,
    items: [{ item_id: "SKU1", item_name: "Notebook", price: 9.5, quantity: 1 }]
  }
});

// TODO: second add_to_cart for the Backpack
` },
    brief: 'Two products, two add_to_cart events. Each event needs its own clear step first, a currency, and a value equal to price times quantity.',
    hints: ['Copy the first event and change what the shopper added.', 'Push { ecommerce: null } again before the second add_to_cart, otherwise the Notebook can leak into the Backpack event.', 'The Backpack event: item_id "SKU3", item_name "Backpack", price 39, quantity 1, and value 39.'],
    solution: { js: `window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({ event: "add_to_cart", ecommerce: { currency: "USD", value: 9.5, items: [{ item_id: "SKU1", item_name: "Notebook", price: 9.5, quantity: 1 }] } });
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({ event: "add_to_cart", ecommerce: { currency: "USD", value: 39, items: [{ item_id: "SKU3", item_name: "Backpack", price: 39, quantity: 1 }] } });
` },
    verify: jsCheck(en => { const a = evs(en, 'add_to_cart'); return [
      ok('At least two add_to_cart events are pushed', a.length >= 2, `Found ${a.length}.`),
      ok('Every add_to_cart is valid (clear step, currency, numeric value)', a.length && a.every(e => e.status === 'valid'), a.map(e => e.issues.map(i => i.msg)).flat().join('; ') || 'No add_to_cart events.'),
      ok('The events add two different products', new Set(a.flatMap(ids)).size >= 2, 'Both events use the same item_id.')]; }) },
  { id: 'fix-purchase', title: 'Fix the purchase with no transaction ID', diff: 'Easy', files: { js: `// This purchase never reaches a clean state. Find out why and repair it.
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: "purchase",
  ecommerce: {
    currency: "USD",
    value: 48.5,
    items: [
      { item_id: "SKU3", item_name: "Backpack", price: 39, quantity: 1 },
      { item_id: "SKU1", item_name: "Notebook", price: 9.5, quantity: 1 }
    ]
  }
});
` },
    brief: 'Push the purchase until the timeline shows it as valid. GA4 identifies an order by its transaction ID.',
    hints: ['Run it and open the event in the inspector: the issue marked "Required by GA4" is the one to fix.', 'A purchase needs ecommerce.transaction_id, a non-empty string.', 'Add transaction_id: "T-1001" inside ecommerce, next to currency and value.'],
    solution: { js: `window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({ event: "purchase", ecommerce: { transaction_id: "T-1001", currency: "USD", value: 48.5, items: [
  { item_id: "SKU3", item_name: "Backpack", price: 39, quantity: 1 },
  { item_id: "SKU1", item_name: "Notebook", price: 9.5, quantity: 1 } ] } });
` },
    verify: jsCheck(en => { const p = evs(en, 'purchase'), l = p[p.length - 1]; return [
      ok('A purchase event is pushed', p.length, 'No purchase found.'),
      ok('It has a transaction_id', l && l.payload.ecommerce && l.payload.ecommerce.transaction_id, 'ecommerce.transaction_id is missing.'),
      ok('The purchase validates as valid', l && l.status === 'valid', l ? l.issues.map(i => i.msg).join('; ') : 'No purchase.')]; }) },
  { id: 'wrong-property', title: 'Find the misspelt properties', diff: 'Medium', files: { js: `// GA4 silently ignores property names it does not know, so typos hide well.
// Two property names below are misspelt. Find and fix them.
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: "add_to_cart",
  ecommerce: {
    curency: "USD",
    value: 8.5,
    items: [{ item_id: "SKU2", item_nam: "Pen set", price: 4.25, quantity: 2 }]
  }
});
` },
    brief: 'The event looks fine at a glance, but two property names are wrong. Fix them so the event is valid and every key is a real GA4 name.',
    hints: ['Read each key aloud, slowly. One sits on ecommerce, one inside the item.', 'The inspector flags the missing currency as required, but nothing flags the other typo. You have to spot it yourself.', 'curency should be currency, and item_nam should be item_name.'],
    solution: { js: `window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({ event: "add_to_cart", ecommerce: { currency: "USD", value: 8.5, items: [{ item_id: "SKU2", item_name: "Pen set", price: 4.25, quantity: 2 }] } });
` },
    verify: jsCheck(en => { const a = evs(en, 'add_to_cart'), l = a[a.length - 1], bad = [...new Set(en.flatMap(e => keysOf(e.payload)).filter(k => !KNOWN.has(k)))]; return [
      ok('An add_to_cart event is pushed', a.length, 'Nothing was pushed.'),
      ok('The event validates as valid', l && l.status === 'valid', l ? l.issues.map(i => i.msg).join('; ') : ''),
      ok('Every property name is a real GA4 name', !bad.length, `Unknown: ${bad.join(', ')}`),
      ok('The item has an item_name', l && (l.payload.ecommerce?.items || []).every(i => typeof i.item_name === 'string'), 'An item has no item_name.')]; }) },
  { id: 'cta-click', title: 'Track a "Start free trial" click', diff: 'Medium', dom: true, files: { html: `<main style="font-family:system-ui;padding:24px">
  <h2>Pricing</h2>
  <button class="cta" data-cta="hero" data-label="Start free trial">Start free trial</button>
</main>`, js: `// Goal: when anything with a data-cta attribute is clicked, push
//   { event: "cta_click", label: <that element's data-label> }
// Use ONE listener on document (event delegation), not one per button.
// Then buttons added later work too.
document.addEventListener("click", event => {
  // TODO: find the nearest [data-cta] element from event.target
  // TODO: if there is none, do nothing
  // TODO: push the event
});
` },
    brief: 'Use event delegation and data-* attributes. The checker clicks your button and then a button that did not exist when your code ran.',
    hints: ['event.target.closest("[data-cta]") finds the nearest ancestor (or itself) with that attribute.', 'Return early when closest() gives null, so clicks elsewhere push nothing.', 'The label lives in el.dataset.label. Push { event: "cta_click", label: el.dataset.label }.'],
    solution: { html: null, js: `document.addEventListener("click", event => {
  const el = event.target.closest("[data-cta]");
  if (!el) return;
  window.dataLayer.push({ event: "cta_click", label: el.dataset.label });
});
` },
    async verify(files) {
      const r = await runDomChecks({ code: files.js || '', html: files.html || '', checks: [
        { name: 'first', expr: "(document.querySelector('[data-cta]').click(), true)" },
        { name: 'late', expr: "(()=>{const b=document.createElement('button');b.dataset.cta='x';b.dataset.label='Late button';document.body.append(b);b.click();return true})()" },
        { name: 'other', expr: "(document.body.click(), true)" }] });
      const p = (r.dataLayer || []).filter(x => x && x.event === 'cta_click');
      return [ok('Code runs without errors', !r.error, r.error && `${r.error.name}: ${r.error.message}`),
        ok('Clicking the button pushes cta_click with its data-label', p[0] && p[0].label === 'Start free trial', p[0] ? `label was ${JSON.stringify(p[0].label)}` : 'No cta_click was pushed.'),
        ok('A button added later also works (delegation)', p.some(x => x.label === 'Late button'), 'Add one listener on document and use closest().'),
        ok('One push per click, none for other clicks', p.length === 2, `Expected 2 pushes, got ${p.length}.`)];
    } },
  { id: 'checkout-total', title: 'Send begin_checkout with the right total', diff: 'Medium', files: { js: `// The cart has 3 products. begin_checkout must carry the real total.
const cart = [
  { item_id: "SKU1", item_name: "Notebook", price: 9.5, quantity: 2 },
  { item_id: "SKU3", item_name: "Backpack", price: 39, quantity: 1 },
  { item_id: "SKU2", item_name: "Pen set", price: 4.25, quantity: 4 }
];

// Bug: this adds up prices and forgets the quantities.
const total = cart.reduce((sum, item) => sum + item.price, 0);

window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: "begin_checkout",
  ecommerce: { currency: "USD", value: total, items: cart }
});
` },
    brief: 'value is the sum of price times quantity across every item. Fix the calculation so the event is valid and the total is correct.',
    hints: ['Check the value in the inspector: the validator compares it with the items.', 'Each line is worth price * quantity, not just price.', 'sum + item.price * item.quantity. The total should be 75.'],
    solution: { js: `const cart = [
  { item_id: "SKU1", item_name: "Notebook", price: 9.5, quantity: 2 },
  { item_id: "SKU3", item_name: "Backpack", price: 39, quantity: 1 },
  { item_id: "SKU2", item_name: "Pen set", price: 4.25, quantity: 4 }
];
const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({ event: "begin_checkout", ecommerce: { currency: "USD", value: total, items: cart } });
` },
    verify: jsCheck(en => { const b = evs(en, 'begin_checkout'), l = b[b.length - 1], it = l && l.payload.ecommerce?.items || [];
      return [ok('A begin_checkout event is pushed', b.length, 'Nothing found.'),
        ok('It contains all 3 items with their quantities', it.length === 3 && it.map(i => i.item_id + 'x' + i.quantity).sort().join() === 'SKU1x2,SKU2x4,SKU3x1', 'Keep the 3 cart items and their quantities.'),
        ok('value is 75 (the sum of price x quantity)', l && Math.abs(l.payload.ecommerce?.value - 75) < 0.01, l ? `value was ${JSON.stringify(l.payload.ecommerce?.value)}` : ''),
        ok('The event validates as valid', l && l.status === 'valid', l ? l.issues.map(i => i.msg).join('; ') : '')]; }) },
  { id: 'no-overwrite', title: 'Stop overwriting the dataLayer', diff: 'Hard', files: { js: `// Two events need to reach the dataLayer, but the first line wrecks it.
window.dataLayer = [];

window.dataLayer.push({ event: "page_view", page_title: "Pricing" });
window.dataLayer.push({ event: "plan_selected", plan: "pro" });
` },
    brief: 'Assigning a new array to window.dataLayer replaces the one GTM is watching, so GTM stops seeing everything pushed before it. Keep the pushes and remove the overwrite.',
    hints: ['Look at the console: the sandbox warns about the reassignment.', 'In GTM setups the array already exists before your code runs. You only need to push.', 'Delete the window.dataLayer = [] line. (Even dataLayer = dataLayer || [] counts as an assignment here.)'],
    solution: { js: `window.dataLayer.push({ event: "page_view", page_title: "Pricing" });
window.dataLayer.push({ event: "plan_selected", plan: "pro" });
` },
    verify: jsCheck((en, r) => [
      ok('window.dataLayer is never reassigned', !r.reassigned, 'You assigned window.dataLayer. Push to the existing array instead.'),
      ok('page_view and plan_selected are both pushed', ['page_view', 'plan_selected'].every(n => evs(en, n).length), 'One of the two events is missing.')]) }
];
const done = () => store.get('lab-challenges', []);
let cur = null, chWb = null, hintN = 0;
const chHost = $('labsp-ch');
function renderChList() {
  const d = done(); $('lab-chcount').textContent = `${d.length}/${CHALLENGES.length}`;
  const list = chHost.querySelector('.lab-chlist'); if (!list) return;
  list.replaceChildren(...CHALLENGES.map((c, i) => h('button', { type: 'button', class: 'lab-chi', 'aria-current': cur && cur.id === c.id ? 'true' : null, onclick: () => openChallenge(c.id) },
    h('span', { class: 'lab-chn' + (d.includes(c.id) ? ' is-done' : ''), html: d.includes(c.id) ? ic('check') : String(i + 1) }),
    h('span', { class: 'lab-cht' }, h('b', { text: c.title }), h('span', {}, c.diff, ' · ', h('em', { text: '40 XP' }), d.includes(c.id) ? ' · complete' : ''))))); }
function openChallenge(id) {
  cur = CHALLENGES.find(c => c.id === id); hintN = 0;
  const pane = chHost.querySelector('.lab-chmain'); pane.replaceChildren();
  const wbHost = h('div', { class: 'lab-chwb' }), res = h('ul', { class: 'lab-res', 'aria-live': 'polite' }), hints = h('ol', { class: 'lab-hints' });
  const status = h('span', { class: 'lab-status', role: 'status' });
  const hintBtn = h('button', { type: 'button', class: 'lab-btn', html: `${ic('bulb')} Hint 1 of 3`, onclick: () => {
    if (hintN < 3) { hints.append(h('li', { text: cur.hints[hintN] })); bitSay(cur.hints[hintN], { mood: 'think', force: true }); hintN++; }
    else { chWb.setFiles(Object.fromEntries(Object.entries(cur.solution).filter(([, v]) => v != null))); status.textContent = 'Solution loaded into the editor. Run it and press Check.'; }
    hintBtn.innerHTML = hintN < 3 ? `${ic('bulb')} Hint ${hintN + 1} of 3` : `${ic('eye')} Show solution`; } });
  const check = h('button', { type: 'button', class: 'lab-btn p', html: `${ic('check')} Check solution`, onclick: async () => {
    check.disabled = true; status.textContent = 'Checking...'; res.replaceChildren();
    await chWb.run();
    let checks; try { checks = await cur.verify(chWb.getFiles()); } catch (e) { checks = [ok('Checker ran', false, String(e.message || e))]; }
    checks.forEach(c => res.append(h('li', { class: c.pass ? 'pass' : 'fail' }, h('span', { html: ic(c.pass ? 'check' : 'x') }), h('div', {}, h('b', { text: c.name }), c.pass || !c.detail ? null : h('span', { text: c.detail })))));
    const pass = checks.every(c => c.pass); check.disabled = false;
    if (pass) {
      const first = !done().includes(cur.id);
      if (first) { store.set('lab-challenges', [...done(), cur.id]); award('labch:' + cur.id, 40, `${cur.title} complete`); renderChList(); }
      status.textContent = first ? 'Challenge complete. +40 XP.' : 'Passed again. XP is only awarded once per challenge.';
      bitSay(first ? 'Challenge solved. Your events are cleaner than most production dataLayers.' : 'Still passing. Consistency is a feature.', { mood: 'happy', force: true });
    } else { status.textContent = `${checks.filter(c => !c.pass).length} check${checks.filter(c => !c.pass).length === 1 ? '' : 's'} failing. Read the details and try again.`; bitSay('Not yet. Open the failing check and compare it with the inspector.', { mood: 'think', force: true }); }
  } });
  pane.append(h('div', { class: 'lab-chhead' }, h('h3', { text: cur.title }), h('span', { class: 'lab-tag ' + cur.diff.toLowerCase(), text: cur.diff }), h('span', { class: 'lab-tag xp', text: '40 XP' }), done().includes(cur.id) ? h('span', { class: 'lab-tag ok', text: 'Complete' }) : null),
    h('p', { class: 'lab-brief', text: cur.brief }), wbHost,
    h('div', { class: 'lab-chbar' }, check, hintBtn, status), hints, res);
  chWb = wire(createWorkbench(wbHost, { files: cur.files, filename: cur.dom ? 'challenge (html + js)' : 'challenge.js', height: 300, autorun: false, save: false, onEvent: onCodeEvent }));
  renderChList();
}
function buildChallenges() {
  chHost.append(h('p', { class: 'lab-help', text: 'Each challenge runs your code in the sandbox and checks the events it actually pushed. Completion is saved and XP is awarded once.' }),
    h('div', { class: 'lab-ch' }, h('div', { class: 'lab-chlist' }), h('div', { class: 'lab-chmain' })));
  const d = done(); openChallenge((CHALLENGES.find(c => !d.includes(c.id)) || CHALLENGES[0]).id);
}
document.querySelector('.lab-sub').addEventListener('click', e => {
  const b = e.target.closest('[data-s]'); if (!b) return;
  document.querySelectorAll('.lab-sub [data-s]').forEach(x => x.setAttribute('aria-selected', x === b));
  $('labsp-free').hidden = b.dataset.s !== 'free'; chHost.hidden = b.dataset.s !== 'ch';
  if (b.dataset.s === 'ch' && !chWb) buildChallenges();
});
$('lab-chcount').textContent = `${done().length}/${CHALLENGES.length}`;
renderCounts(); renderStats(); renderInspector();
