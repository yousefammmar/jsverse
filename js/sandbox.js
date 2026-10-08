// Isolated execution of learner code.
//  - Pure JavaScript runs in a Web Worker: no DOM, no access to the app, and terminate() stops infinite loops.
//  - Code that needs the DOM (document, window events...) or an HTML/CSS preview runs in a sandboxed iframe
//    (sandbox="allow-scripts", opaque origin, no access to the parent page, localStorage or cookies).
// Both talk to the host through structured postMessage events. Learner code never runs in the app's own context.

/* ---------- bootstrap that runs INSIDE the worker / iframe ---------- */
function __boot(mode, id, parentRef) {
  const root = self;
  const emit = mode === 'worker' ? m => postMessage(m) : m => parent.postMessage(Object.assign({ __jsv: id }, m), '*');

  // --- Node-style value formatting ---
  const kind = v => v === null ? 'null' : Array.isArray(v) ? 'object' : typeof v;
  function inspect(v, d, seen) {
    switch (typeof v) {
      case 'string': return d ? JSON.stringify(v).replace(/^"|"$/g, "'") : v;
      case 'number': return Object.is(v, -0) ? '-0' : String(v);
      case 'bigint': return v + 'n';
      case 'symbol': return v.toString();
      case 'function': return `[Function: ${v.name || 'anonymous'}]`;
      case 'undefined': case 'boolean': return String(v);
    }
    if (v === null) return 'null';
    if (seen.has(v)) return '[Circular]';
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    if (v instanceof Date) return isNaN(v) ? 'Invalid Date' : v.toISOString();
    if (v instanceof RegExp) return String(v);
    if (d > 3) return Array.isArray(v) ? '[Array]' : '[Object]';
    seen.add(v);
    let items, open, close;
    if (Array.isArray(v)) { items = v.map(x => inspect(x, d + 1, seen)); open = '['; close = ']'; if (v.length > 100) items = items.slice(0, 100).concat(`... ${v.length - 100} more items`); }
    else if (v instanceof Map) { items = [...v].map(([k, x]) => `${inspect(k, d + 1, seen)} => ${inspect(x, d + 1, seen)}`); open = `Map(${v.size}) {`; close = '}'; }
    else if (v instanceof Set) { items = [...v].map(x => inspect(x, d + 1, seen)); open = `Set(${v.size}) {`; close = '}'; }
    else {
      let keys = []; try { keys = Object.keys(v); } catch (e) {}
      items = keys.map(k => { let val; try { val = v[k]; } catch (e) { val = '[Getter error]'; } return `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : "'" + k + "'"}: ${inspect(val, d + 1, seen)}`; });
      const ctor = v.constructor && v.constructor.name; open = ctor && ctor !== 'Object' ? ctor + ' {' : '{'; close = '}';
    }
    seen.delete(v);
    if (!items.length) return open + close;
    const one = `${open} ${items.join(', ')} ${close}`;
    if (one.length <= 72 && !one.includes('\n')) return one;
    const pad = '  '.repeat(d + 1);
    return `${open}\n${items.map(i => pad + i.replace(/\n/g, '\n')).join(',\n')}\n${'  '.repeat(d)}${close}`;
  }
  const fmt = args => args.map(a => ({ k: typeof a === 'string' ? 'str' : kind(a), v: inspect(a, 0, new Set()) }));
  const clone = x => { try { return JSON.parse(JSON.stringify(x)); } catch (e) { return String(x); } };

  // --- console ---
  const con = {};
  ['log', 'info', 'debug'].forEach(k => con[k] = (...a) => emit({ t: 'log', level: 'log', args: fmt(a) }));
  con.warn = (...a) => emit({ t: 'log', level: 'warn', args: fmt(a) });
  con.error = (...a) => emit({ t: 'log', level: 'error', args: fmt(a) });
  con.table = x => emit({ t: 'log', level: 'log', args: fmt([x]) });
  con.clear = () => emit({ t: 'clear' });
  con.assert = (c, ...a) => { if (!c) con.error('Assertion failed:', ...a); };
  root.console = con;

  // --- errors ---
  function report(e) {
    e = e && typeof e === 'object' ? e : { name: 'Error', message: String(e) };
    const m = String(e.stack || '').match(/learner\.js:(\d+):(\d+)/);
    emit({ t: 'error', name: e.name || 'Error', message: String(e.message), line: m ? +m[1] : (e.line || null), col: m ? +m[2] : null });
  }
  root.addEventListener('error', ev => { ev.preventDefault && ev.preventDefault(); if (ev.error) report(ev.error); else emit({ t: 'error', name: 'Error', message: String(ev.message).replace(/^Uncaught /, ''), line: ev.lineno && ev.filename && /learner/.test(ev.filename) ? ev.lineno : null }); });
  root.addEventListener('unhandledrejection', ev => { ev.preventDefault(); report(ev.reason instanceof Error ? ev.reason : { name: 'UnhandledPromiseRejection', message: String(ev.reason) }); });

  // --- simulated dataLayer: pushes are reported to the host, never to a real tag manager ---
  let dl;
  const wrap = arr => {
    Object.defineProperty(arr, 'push', { enumerable: false, configurable: true, writable: true, value: function (...a) { a.forEach(x => emit({ t: 'dl', payload: clone(x) })); return Array.prototype.push.apply(this, a); } });
    return arr;
  };
  dl = wrap([]);
  Object.defineProperty(root, 'dataLayer', {
    configurable: true, enumerable: true, get: () => dl,
    set: v => { emit({ t: 'log', level: 'warn', args: [{ k: 'str', v: 'window.dataLayer was reassigned. GTM stops seeing pushes made to the old array, so push to it instead.' }] }); emit({ t: 'dl-reassigned' }); dl = wrap(Array.isArray(v) ? v : []); }
  });
  root.window = root.window || root;

  // --- idle detection: timers and fetches keep the run alive ---
  let pending = 0, ticking = false;
  const check = () => { if (ticking) return; ticking = true; const ot = root.__st || root.setTimeout; ot(() => { ticking = false; if (pending === 0) emit({ t: 'idle' }); }, 25); };
  const origST = root.setTimeout.bind(root), origCT = root.clearTimeout.bind(root), origSI = root.setInterval.bind(root), origCI = root.clearInterval.bind(root);
  root.__st = origST;
  const live = new Map();
  root.setTimeout = (fn, ms, ...a) => {
    pending++; let id; let done = false;
    id = origST(() => { if (done) return; done = true; live.delete(id); pending--; try { typeof fn === 'function' ? fn(...a) : 0; } catch (e) { report(e); } check(); }, ms);
    live.set(id, () => { if (!done) { done = true; pending--; } }); return id;
  };
  root.clearTimeout = id => { const f = live.get(id); if (f) { f(); live.delete(id); } origCT(id); check(); };
  root.setInterval = (fn, ms, ...a) => { pending++; const id = origSI(() => { try { fn(...a); } catch (e) { report(e); } }, ms); live.set(id, () => { pending--; }); return id; };
  root.clearInterval = id => { const f = live.get(id); if (f) { f(); live.delete(id); } origCI(id); check(); };
  if (root.fetch) { const of = root.fetch.bind(root); root.fetch = (...a) => { pending++; return of(...a).finally(() => { pending--; check(); }); }; }

  // --- deep equality for tests ---
  const deepEq = (a, b) => {
    if (Object.is(a, b)) return true;
    if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const ka = Object.keys(a), kb = Object.keys(b);
    return ka.length === kb.length && ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && deepEq(a[k], b[k]));
  };

  const ev = (0, eval);
  // Browsers give no line for syntax errors, so find the first prefix that fails for a reason other than "still incomplete".
  const openers = code => {                     // crude bracket scan that skips strings and comments
    const st = []; let line = 1, i = 0; const s = code;
    while (i < s.length) {
      const c = s[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === '/' && s[i + 1] === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
      if (c === '/' && s[i + 1] === '*') { i += 2; while (i < s.length && !(s[i] === '*' && s[i + 1] === '/')) { if (s[i] === '\n') line++; i++; } i += 2; continue; }
      if (c === '"' || c === "'" || c === '`') { i++; while (i < s.length && s[i] !== c) { if (s[i] === '\\') i++; else if (s[i] === '\n') { line++; if (c !== '`') break; } i++; } i++; continue; }
      if ('([{'.includes(c)) st.push(line); else if (')]}'.includes(c)) st.pop();
      i++;
    }
    return st;
  };
  const synLine = code => {
    const lines = code.split('\n');
    for (let n = 1; n <= lines.length; n++) {
      const prefix = lines.slice(0, n).join('\n');
      try { new Function(prefix); } catch (e) {
        const incomplete = /end of input|unterminated|missing \)|unexpected end/i.test(e.message) || (/Unexpected token '[)}\]]'/.test(e.message) && openers(prefix).length > 0);
        if (!incomplete) return n;
      }
    }
    const open = openers(code);
    return open.length ? open[open.length - 1] : lines.length;
  };
  const runCode = code => { try { ev(code + '\n//# sourceURL=learner.js'); } catch (e) { if (e && e.name === 'SyntaxError') e.line = synLine(code); report(e); } };
  const getFn = name => { try { return ev(`typeof ${name} === "function" ? ${name} : null`); } catch (e) { return null; } };

  async function handle(m) {
    if (m.cmd === 'run') { runCode(m.code); check(); return; }
    if (m.cmd === 'tests') {
      runCode(m.code);
      const fn = m.fn ? getFn(m.fn) : null;
      const results = [];
      if (m.fn && !fn) { emit({ t: 'tests', missing: m.fn, results: [] }); emit({ t: 'idle' }); return; }
      for (const t of m.tests) {
        const r = { name: t.name || null };
        try {
          if (t.expr) { r.got = inspect(ev(t.expr), 1, new Set()); r.pass = !!ev(t.expr); r.expected = 'a truthy result'; }
          else { const got = await fn(...(t.args || [])); r.pass = deepEq(got, t.expect); r.got = inspect(got, 1, new Set()); r.expected = inspect(t.expect, 1, new Set()); r.args = (t.args || []).map(a => inspect(a, 1, new Set())); }
        } catch (e) { r.pass = false; r.threw = `${e.name}: ${e.message}`; r.args = (t.args || []).map(a => inspect(a, 1, new Set())); }
        results.push(r);
      }
      emit({ t: 'tests', results });
      check(); return;
    }
    if (m.cmd === 'checks') {                       // DOM checks: boolean expressions evaluated after the code ran
      runCode(m.code);
      setTimeout(() => {
        const results = m.checks.map(c => { try { return { name: c.name, pass: !!ev(c.expr) }; } catch (e) { return { name: c.name, pass: false, threw: String(e.message) }; } });
        emit({ t: 'checks', results }); check();
      }, m.wait || 30);
    }
  }
  if (mode === 'worker') root.onmessage = e => handle(e.data);
  else root.addEventListener('message', e => { if (e.source === parent && e.data && e.data.__jsv_cmd) handle(e.data); });
  emit({ t: 'ready' });
}
const BOOT_SRC = `(${__boot.toString()})`;

/* ---------- host side ---------- */
const DOM_RE = /\b(document|localStorage|sessionStorage|location|navigator|alert|prompt|confirm|HTMLElement|CustomEvent|MouseEvent|KeyboardEvent|DOMParser|getComputedStyle|requestAnimationFrame|addEventListener)\b|\bwindow\.(?!dataLayer\b)/;
export const needsDom = code => DOM_RE.test(code);
const LOOP_RE = /\bwhile\s*\(\s*(true|1)\s*\)|\bfor\s*\(\s*;\s*;\s*\)/;
const LOOP_MSG = 'This code looks like it never stops (an endless loop), so it was not run. Add a way for the loop to end.';

const newRes = () => ({ logs: [], error: null, dataLayer: [], timedOut: false, ms: 0, reassigned: false, tests: null, checks: null });
function absorb(res, m) {
  switch (m.t) {
    case 'log': res.logs.push({ level: m.level, args: m.args }); break;
    case 'clear': res.logs.length = 0; break;
    case 'error': if (!res.error) res.error = { name: m.name, message: m.message, line: m.line, col: m.col }; break;
    case 'dl': res.dataLayer.push(m.payload); break;
    case 'dl-reassigned': res.reassigned = true; break;
    case 'tests': res.tests = m; break;
    case 'checks': res.checks = m.results; break;
  }
}

function workerSession(cmd, { timeout = 4000, onEvent } = {}) {
  return new Promise(resolve => {
    const t0 = performance.now(), res = newRes();
    const url = URL.createObjectURL(new Blob([`${BOOT_SRC}('worker');`], { type: 'text/javascript' }));
    const w = new Worker(url);
    let done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); w.terminate(); URL.revokeObjectURL(url); res.ms = Math.round(performance.now() - t0); resolve(res); };
    w.onmessage = e => { const m = e.data; if (m.t === 'ready') { w.postMessage(cmd); return; } absorb(res, m); onEvent && onEvent(m); if (m.t === 'idle') finish(); };
    w.onerror = e => { e.preventDefault(); if (!res.error) res.error = { name: 'Error', message: e.message || 'Script error', line: e.lineno || null }; finish(); };
    const timer = setTimeout(() => { res.timedOut = true; if (!res.error) res.error = { name: 'TimeoutError', message: `Your code ran for more than ${timeout / 1000} seconds and was stopped. Is there a loop that never ends?` }; finish(); }, timeout);
  });
}

function frameSession(cmd, { timeout = 4000, onEvent, html = '', css = '', mount = null, keep = false } = {}) {
  return new Promise(resolve => {
    const t0 = performance.now(), res = newRes(), id = 'f' + Math.random().toString(36).slice(2);
    const f = document.createElement('iframe');
    f.setAttribute('sandbox', 'allow-scripts');
    f.setAttribute('title', 'Code preview'); f.setAttribute('aria-label', 'Code preview');
    if (!mount) f.style.cssText = 'position:fixed;left:-9999px;top:0;width:640px;height:480px;border:0;visibility:hidden';
    else f.style.cssText = 'width:100%;height:100%;border:0;background:#fff;display:block';
    f.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}<script>${BOOT_SRC}('frame',${JSON.stringify(id)});<\/script></body></html>`;
    let done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(timer); removeEventListener('message', onMsg); if (!keep) f.remove(); res.ms = Math.round(performance.now() - t0); res.frame = f; resolve(res); };
    const onMsg = e => {
      const m = e.data; if (e.source !== f.contentWindow || !m || m.__jsv !== id) return;
      if (m.t === 'ready') { f.contentWindow.postMessage(Object.assign({ __jsv_cmd: 1 }, cmd), '*'); return; }
      absorb(res, m); onEvent && onEvent(m); if (m.t === 'idle') finish();
    };
    addEventListener('message', onMsg);
    (mount || document.body).append(f);
    const timer = setTimeout(() => { res.timedOut = true; if (!res.error) res.error = { name: 'TimeoutError', message: `Your code ran for more than ${timeout / 1000} seconds and was stopped.` }; finish(); }, timeout);
  });
}

const guard = code => LOOP_RE.test(code) && needsDom(code) ? Object.assign(newRes(), { error: { name: 'LoopGuard', message: LOOP_MSG } }) : null;

/** Run JavaScript. Resolves {logs, error, dataLayer, timedOut, ms, reassigned}. */
export function runJS(code, opts = {}) {
  if (needsDom(code)) return guard(code) || frameSession({ cmd: 'run', code }, opts);
  return workerSession({ cmd: 'run', code }, opts);
}
/** Function tests. tests: [{args, expect, name?} | {expr, name?}]. Resolves run result + .tests {missing?, results[]}. */
export function runTests({ code, fn, tests }, opts = {}) {
  if (needsDom(code)) return guard(code) || frameSession({ cmd: 'tests', code, fn, tests }, opts);
  return workerSession({ cmd: 'tests', code, fn, tests }, opts);
}
/** DOM checks: runs code against `html`/`css`, then evaluates each boolean expression. Resolves run result + .checks. */
export function runDomChecks({ code, html = '', css = '', checks }, opts = {}) {
  return guard(code) || frameSession({ cmd: 'checks', code, checks }, Object.assign({}, opts, { html, css }));
}
/** Live preview page for the Playground: mounts a sandboxed iframe into `mount`; resolves when the script settles. */
export function runPage({ html = '', css = '', js = '' }, mount, opts = {}) {
  mount.replaceChildren();
  const g = guard(js); if (g) return Promise.resolve(g);
  return frameSession({ cmd: 'run', code: js }, Object.assign({ timeout: 6000 }, opts, { html, css, mount, keep: true }));
}
