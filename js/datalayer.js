// Simulated dataLayer + GA4 ecommerce validation. Nothing here talks to a real tag manager or sends analytics:
// a push only appends an object to a simulated array. Real GTM must also have a tag + trigger to send data.
//
// Every issue says whether the rule is REQUIRED by GA4 (level 'error') or an educational convention / recommendation
// (level 'warn' or 'tip'), so learners know what is mandatory and what is just good practice.

export const ECOM_EVENTS = ['view_item_list', 'view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase'];
const NEEDS_VALUE = new Set(['view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout', 'purchase']);
export const isEcom = name => ECOM_EVENTS.includes(name);

const issue = (level, rule, msg, why) => ({ level, rule, msg, why, required: level === 'error' });

/** Validate one push. ctx = { cleared: boolean, seenTx: Set } (mutates seenTx for purchases). Returns issue[]. */
export function validateEvent(o, ctx = { cleared: true, seenTx: new Set() }) {
  const out = [];
  if (!o || typeof o !== 'object' || !o.event) return out;
  if (!/^[a-z][a-z0-9_]*$/.test(o.event)) out.push(issue('tip', 'event-name', `Event name "${o.event}" is not snake_case`, 'Convention: GA4 event names are lowercase snake_case (add_to_cart). Names are case-sensitive, so "Add_To_Cart" would be a different event.'));
  if (!isEcom(o.event)) return out;
  const e = o.ecommerce;
  if (!ctx.cleared) out.push(issue('warn', 'clear-first', 'Push { ecommerce: null } before this event', 'Recommended by Google for GTM: the data layer merges objects, so clearing first stops old items leaking into this event. GA4 does not reject the event without it.'));
  if (!e || typeof e !== 'object') { out.push(issue('error', 'ecommerce-object', 'Missing ecommerce object', 'Required: ecommerce events carry their data in an ecommerce object.')); return out; }
  const items = e.items;
  if (!Array.isArray(items) || !items.length) out.push(issue('error', 'items', 'items must be a non-empty array', 'Required: GA4 ecommerce events need an items array describing the products.'));
  else items.forEach((it, i) => {
    if (!it || (!it.item_id && !it.item_name)) out.push(issue('error', 'item-id', `items[${i}] needs item_id or item_name`, 'Required: every item must have at least item_id or item_name.'));
    if (o.event !== 'view_item_list') {
      if (typeof it.price !== 'number') out.push(issue('warn', 'item-price', `items[${i}].price should be a number`, 'Recommended: without a price, GA4 cannot compute item revenue.'));
      if (it.quantity !== undefined && !(it.quantity > 0)) out.push(issue('warn', 'item-qty', `items[${i}].quantity should be above 0`, 'Recommended: quantity defaults to 1 when left out, but 0 or negative values make no sense.'));
    }
  });
  if (NEEDS_VALUE.has(o.event)) {
    if (e.value !== undefined && !e.currency) out.push(issue('error', 'currency', 'currency is required when you send a value', 'Required: GA4 needs currency (for example "USD") alongside value, or revenue is not reported.'));
    if (o.event !== 'view_item' && e.value === undefined) out.push(issue('warn', 'value', 'value is missing', 'Recommended: add the total value so revenue and funnels can be reported.'));
    if (e.value !== undefined && typeof e.value !== 'number') out.push(issue('error', 'value-type', 'value must be a number', 'Required: value is numeric, not a string like "19.00".'));
    else if (typeof e.value === 'number' && Array.isArray(items) && items.length && items.every(i => i && typeof i.price === 'number')) {
      const sum = items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0);
      if (Math.abs(sum - e.value) > 0.01) out.push(issue('warn', 'value-sum', `value ${e.value} does not match the items total (${+sum.toFixed(2)})`, 'Convention from Google\'s docs: value is the sum of price × quantity. GA4 accepts any number, but mismatches make reports confusing.'));
    }
  }
  if (o.event === 'purchase') {
    if (!e.transaction_id) out.push(issue('error', 'transaction-id', 'transaction_id is required for purchase', 'Required: GA4 uses transaction_id to identify an order.'));
    else if (ctx.seenTx.has(e.transaction_id)) out.push(issue('warn', 'duplicate-tx', `transaction_id "${e.transaction_id}" was already used`, 'GA4 treats purchases with the same transaction_id as duplicates, so this order would likely not be counted twice.'));
    else ctx.seenTx.add(e.transaction_id);
  }
  return out;
}
export const statusOf = issues => issues.some(i => i.level === 'error') ? 'invalid' : issues.some(i => i.level === 'warn') ? 'warnings' : 'valid';

/** Simulated dataLayer. Subscribe to receive each recorded entry as it happens. */
export class DataLayerSim {
  constructor() { this.entries = []; this.raw = []; this.subs = new Set(); this._cleared = false; this._tx = new Set(); this._n = 0; }
  subscribe(fn) { this.subs.add(fn); return () => this.subs.delete(fn); }
  push(...objs) { objs.forEach(o => this._rec(o)); return this.raw.length; }
  _rec(o) {
    let payload; try { payload = JSON.parse(JSON.stringify(o)); } catch { payload = { value: String(o) }; }
    this.raw.push(payload);
    const base = { id: ++this._n, ts: Date.now(), payload };
    let entry;
    if (payload && payload.ecommerce === null && !payload.event) { this._cleared = true; entry = { ...base, kind: 'clear', name: 'ecommerce: null', issues: [], status: 'valid' }; }
    else {
      const issues = validateEvent(payload, { cleared: this._cleared, seenTx: this._tx });
      if (payload && payload.event) this._cleared = false;
      entry = { ...base, kind: payload && payload.event ? 'event' : 'variables', name: payload && payload.event ? payload.event : '(variables)', issues, status: statusOf(issues) };
    }
    this.entries.push(entry); this.subs.forEach(f => f(entry)); return entry;
  }
  reset() { this.entries = []; this.raw = []; this._cleared = false; this._tx = new Set(); this._n = 0; this.subs.forEach(f => f(null)); }
}
export const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour12: false });
export const payloadSummary = e => {
  const p = e.payload || {}, ec = p.ecommerce;
  if (e.kind === 'clear') return 'resets the ecommerce object';
  if (ec && ec.items) return `${ec.items.length} item${ec.items.length === 1 ? '' : 's'}${typeof ec.value === 'number' ? ` · ${ec.currency || '?'} ${ec.value}` : ''}${ec.transaction_id ? ` · ${ec.transaction_id}` : ''}`;
  const keys = Object.keys(p).filter(k => k !== 'event'); return keys.length ? keys.slice(0, 3).join(', ') : 'no extra data';
};

// Appended for the Tracking Laboratory: start a fresh "page load" so a re-run of the same code is not flagged as a duplicate order.
DataLayerSim.prototype.newRun = function () { this._tx = new Set(); this._cleared = false; };
