// dataLayer stream: clicks in a mini shop become pushes into DataLayerSim; every card shows the real validator's verdict. Simulation only.
import { h, frame, fmt, ic, reducedMotion } from './kit.js';
import { DataLayerSim, fmtTime, payloadSummary } from '../datalayer.js';

const ITEM = { item_id: 'SKU_TR1', item_name: 'Trail Runner', price: 89, quantity: 1 };
const STATUS = { valid: 'Valid', warnings: 'Warnings', invalid: 'Invalid' };

export function mount(el, { compact } = {}) {
  const dl = new DataLayerSim();
  let tx = 1000, busy = false;
  const f = frame(el, { id: 'datalayer', title: 'dataLayer Stream', compact,
    notice: 'Pushing to the dataLayer only stores an object. Nothing is sent anywhere until a GTM trigger fires a tag, and the validator judges each push by GA4 rules.',
    tries: [
      { label: 'Skip the ecommerce clear', run: async () => { clearFirst.checked = false; await act('add_to_cart'); } },
      { label: 'Forget the currency', run: async () => { currency.checked = false; clearFirst.checked = true; await act('purchase'); } },
      { label: 'Run the full funnel', run: async () => { clearFirst.checked = true; currency.checked = true; for (const e of ['view_item', 'add_to_cart', 'begin_checkout', 'purchase']) await act(e); } }
    ] });
  const clearFirst = h('input', { type: 'checkbox', id: 'viz-dl-c', checked: true }), currency = h('input', { type: 'checkbox', id: 'viz-dl-cur', checked: true });
  const sw = (inp, label) => h('label.viz-switch', { for: inp.id }, inp, h('span.track'), h('span', { text: label }));
  const btns = [['view_item', 'View product', 'eye'], ['add_to_cart', 'Add to cart', 'cart'], ['begin_checkout', 'Begin checkout', 'right'], ['purchase', 'Purchase', 'check']]
    .map(([ev, label, ico]) => h('button.btn.sm' + (ev === 'purchase' ? '.p' : ''), { type: 'button', 'data-ev': ev, on: { click: () => act(ev) } }, ic(ico), label));
  const stream = h('ol.viz-stream', { 'aria-label': 'dataLayer entries, newest first' }), counter = h('b.mono', { text: '0' });
  const head = h('div.viz-lbl', null, 'dataLayer', h('span.mono.viz-dim', null, ' length: ', counter));
  const flow = h('div.viz-dl');
  const page = h('div.viz-shop', null, h('div.viz-lbl', { text: 'Your website (mini shop)' }),
    h('div.viz-prod', null, h('div.viz-prod-img', null, ic('box')), h('div', null, h('b', { text: 'Trail Runner' }), h('div.mono.viz-dim', { text: 'SKU_TR1 · $89.00' }))),
    h('div.viz-btns', null, btns), sw(clearFirst, 'push { ecommerce: null } first'), sw(currency, 'include currency'));
  flow.append(h('div.viz-cols.dl', null, page, h('div.viz-streambox', null, head, stream, h('p.viz-empty', { id: 'viz-dl-empty', text: 'No pushes yet. Click a button on the left.' }))));
  f.stage.append(h('div.viz-sim', null, ic('info'), h('span', null, h('b', { text: 'Simulation. ' }), 'No analytics are sent from here. In real life: ', h('span.mono', { text: 'dataLayer.push()' }), ' stores data, then a GTM trigger + a GA4 tag send it.')),
    h('div.viz-pipe', { 'aria-label': 'Pipeline: page, dataLayer, GTM, GA4' }, ...['Page', 'dataLayer', 'GTM trigger + tag', 'GA4'].map((t, i) => h('span.viz-pipe-s' + (i > 1 ? '.off' : ''), { text: t }))), flow);

  dl.subscribe(entry => {
    if (!entry) { stream.replaceChildren(); counter.textContent = '0'; return; }
    counter.textContent = dl.raw.length;
    const issues = entry.issues.map(i => h('li.' + i.level, null, h('b', { text: i.level === 'error' ? 'Required: ' : i.level === 'warn' ? 'Recommended: ' : 'Tip: ' }), i.msg, h('small', { text: i.why })));
    stream.prepend(h('li.viz-ecard.s-' + entry.status + (entry.kind === 'clear' ? '.clear' : ''), null,
      h('div.viz-ec-top', null, h('b.mono', { text: entry.name }), h('span.viz-st.' + entry.status, null, ic(entry.status === 'valid' ? 'check' : 'warn'), STATUS[entry.status]), h('span.sp'), h('time.mono.viz-dim', { text: fmtTime(entry.ts) })),
      h('div.viz-dim.small', { text: payloadSummary(entry) }),
      issues.length ? h('ul.viz-issues', null, issues) : null,
      h('details', null, h('summary', { text: 'payload' }), h('pre.code-block', { text: JSON.stringify(entry.payload, null, 2) }))));
    document.getElementById('viz-dl-empty')?.setAttribute('hidden', '');
  });

  const payload = ev => {
    const items = [{ ...ITEM }], ecommerce = { items };
    if (currency.checked) ecommerce.currency = 'USD';
    ecommerce.value = 89;
    if (ev === 'purchase') ecommerce.transaction_id = 'T-' + (++tx);
    return { event: ev, ecommerce };
  };
  async function fly(from) {
    if (reducedMotion()) return;
    const host = flow.getBoundingClientRect(), a = from.getBoundingClientRect(), b = stream.getBoundingClientRect();
    const pk = h('span.viz-packet.mono', { text: '{ }' });
    pk.style.cssText = `left:${a.left - host.left + a.width / 2}px;top:${a.top - host.top + a.height / 2}px`;
    flow.append(pk);
    const narrow = b.left - a.left < 40;       // stacked layout: fly downwards
    const dx = narrow ? 0 : b.left - a.left + 28 - a.width / 2, dy = narrow ? b.top - a.top + 30 : b.top - a.top + 30 - a.height / 2;
    await pk.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { opacity: 1, offset: .15 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }).finished.catch(() => {});
    pk.remove();
  }
  async function act(ev) {
    if (busy) return; busy = true;
    const btn = btns.find(b => b.dataset.ev === ev);
    btn.classList.add('fired'); setTimeout(() => btn.classList.remove('fired'), 500);
    await fly(btn);
    if (!el.isConnected) { busy = false; return; }
    if (clearFirst.checked) dl.push({ ecommerce: null });
    dl.push(payload(ev));
    const last = dl.entries.at(-1);
    f.touch(); f.say(`${ev} pushed: ${STATUS[last.status]}${last.issues.length ? ', ' + last.issues.map(i => i.msg).join('; ') : ''}`);
    busy = false;
  }
}
