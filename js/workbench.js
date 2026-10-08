// Workbench: the reusable mini-IDE (toolbar + editor + console/preview/dataLayer) used across the whole site.
//
//   const wb = createWorkbench(el, { files: { js: 'console.log(1)' } });                       // JavaScript only
//   const wb = createWorkbench(el, { files: { html: '<p id=a>', css: '', js: '...' } });       // HTML/CSS/JS with live preview
//   wb.run() -> Promise<result>   wb.reset()   wb.getFiles()   wb.setFiles({js})   wb.getCode()   wb.setCode(s)
//
// Code is executed through sandbox.js (Web Worker or sandboxed iframe), never in the app's own context.
import { ic } from './icons.js';
import { createEditor } from './editor.js';
import { runJS, runPage, needsDom } from './sandbox.js';
import { bitForError, bitOk, bitNoteHtml, mascotOn } from './bit.js';
import { store } from './store.js';
import { toast, unlock, log, hasAch } from './xp.js';

const LANG = { html: 'html', css: 'css', js: 'js' }, FILE = { html: 'index.html', css: 'style.css', js: 'main.js' };

/** A scrolling console. write({level,args}) / writeText(text, level) / clear(). */
export function createConsole(host) {
  host.classList.add('con'); let n = 0, errs = 0;
  const empty = () => { host.innerHTML = '<div class="con-empty">// Run the code to see output here.</div>'; };
  empty();
  const add = node => { if (host.querySelector('.con-empty')) host.replaceChildren(); host.append(node); host.parentElement && (host.parentElement.scrollTop = host.parentElement.scrollHeight); };
  return {
    write({ level = 'log', args = [] }) {
      const row = document.createElement('div'); row.className = `con-line ${level === 'log' ? '' : level}`;
      const p = document.createElement('span'); p.className = 'pfx'; p.textContent = level === 'error' ? '×' : level === 'warn' ? '!' : '›'; p.setAttribute('aria-hidden', 'true'); row.append(p);
      const body = document.createElement('span');
      args.forEach((a, i) => { const s = document.createElement('span'); s.className = 'k-' + a.k; s.textContent = (i ? ' ' : '') + a.v; body.append(s); });
      row.append(body); add(row); n++; if (level === 'error') errs++;
    },
    writeText(text, level = 'sys') { const row = document.createElement('div'); row.className = `con-line ${level}`; row.textContent = text; add(row); if (level === 'error') errs++; },
    clear() { n = 0; errs = 0; empty(); },
    get count() { return n; }, get errors() { return errs; }
  };
}

const snippets = () => store.get('snippets', []);
export function saveSnippet(name, files) {
  const list = snippets(); const s = { id: Date.now().toString(36), name, files, t: Date.now() };
  store.set('snippets', [s, ...list].slice(0, 40)); return s;
}
export { snippets };

export function createWorkbench(root, opts = {}) {
  const init = { ...(opts.files || { js: '' }) };
  const kinds = ['html', 'css', 'js'].filter(k => k in init);
  const web = kinds.includes('html') || kinds.includes('css');
  const state = { ...init }; let active = kinds.includes('js') ? 'js' : kinds[0];
  let prevSyntax = false, firstOk = true, running = false;

  root.classList.add('wb'); if (opts.layout === 'stack') root.classList.add('stack');
  root.dataset.m = 'code';
  const title = opts.filename || (web ? 'playground' : FILE.js);
  root.innerHTML = `
    <div class="wb-bar">
      <span class="wb-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="wb-file mono">${title}</span>
      <span class="sp"></span>
      ${opts.reset === false ? '' : `<button class="btn sm" data-a="reset" title="Reset to the starting code">${ic('reset')} <span class="lbl">Reset</span></button>`}
      ${opts.copy === false ? '' : `<button class="btn sm" data-a="copy" title="Copy code">${ic('copy')} <span class="lbl">Copy</span></button>`}
      ${opts.save === false ? '' : `<button class="btn sm" data-a="save" title="Save snippet (Ctrl/Cmd+S)">${ic('save')} <span class="lbl">Save</span></button>`}
      <span class="more" style="position:relative"><button class="btn sm" data-a="keys" aria-expanded="false" title="Keyboard shortcuts">${ic('keyboard')}</button></span>
      <button class="btn sm p" data-a="run" title="Run (Ctrl/Cmd+Enter)">${ic('play')} Run</button>
    </div>
    <div class="wb-mtabs tabs" role="tablist" aria-label="Workspace view" hidden>
      <button role="tab" data-m="code" aria-selected="true">Code</button>${web ? '<button role="tab" data-m="preview">Preview</button>' : ''}<button role="tab" data-m="console">Console</button><button role="tab" data-m="events">Events</button>
    </div>
    <div class="wb-main" style="min-height:${opts.height || 340}px">
      <div class="wb-pane wb-code">
        ${kinds.length > 1 ? `<div class="wb-tabs" role="tablist" aria-label="Files">${kinds.map(k => `<button role="tab" data-f="${k}" aria-selected="${k === active}">${FILE[k]}</button>`).join('')}</div>` : ''}
        <div class="wb-body" style="overflow:hidden"><div class="wb-ed" style="height:100%"></div></div>
      </div>
      <div class="wb-pane wb-out">
        <div class="wb-tabs" role="tablist" aria-label="Output">
          ${web ? '<button role="tab" data-o="preview" aria-selected="true">Preview</button>' : ''}
          <button role="tab" data-o="console" aria-selected="${!web}">Console <span class="cnt" data-c="console">0</span></button>
          <button role="tab" data-o="events" aria-selected="false">dataLayer <span class="cnt" data-c="events">0</span></button>
        </div>
        <div class="wb-body">
          ${web ? '<div class="wb-preview" data-p="preview" style="height:100%;min-height:200px;background:#fff"></div>' : ''}
          <div data-p="console" ${web ? 'hidden' : ''}><div class="con-host"></div></div>
          <div data-p="events" hidden><div class="dl-empty con-empty">// dataLayer.push() calls appear here.</div></div>
        </div>
        <div class="wb-note"></div>
        <div class="wb-status"><span data-s="msg">Ready</span><span data-s="meta"></span></div>
      </div>
    </div>`;
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const con = createConsole($('.con-host'));
  const edHost = $('.wb-ed');
  const editor = createEditor(edHost, { value: state[active], lang: LANG[active], label: `${FILE[active]} editor`, onRun: () => api.run(), onSave: () => api.save(), onChange: v => { state[active] = v; opts.onChange && opts.onChange(api.getFiles()); } });

  // splitter between code and output (desktop)
  const main = $('.wb-main');
  const sep = document.createElement('div'); sep.className = 'wb-sep'; sep.setAttribute('role', 'separator'); sep.setAttribute('aria-orientation', 'vertical'); sep.setAttribute('aria-label', 'Resize panels'); sep.tabIndex = 0;
  if (opts.layout !== 'stack') { main.style.position = 'relative'; main.append(sep); }
  let split = 54; const setSplit = v => { split = Math.max(28, Math.min(72, v)); main.style.gridTemplateColumns = `minmax(0,${split}fr) minmax(0,${100 - split}fr)`; sep.style.left = split + '%'; sep.setAttribute('aria-valuenow', Math.round(split)); };
  setSplit(split);
  sep.addEventListener('pointerdown', e => { sep.setPointerCapture(e.pointerId); const r = main.getBoundingClientRect(); const mv = ev => setSplit((ev.clientX - r.left) / r.width * 100); const up = () => { sep.removeEventListener('pointermove', mv); sep.removeEventListener('pointerup', up); }; sep.addEventListener('pointermove', mv); sep.addEventListener('pointerup', up); });
  sep.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') setSplit(split - 3); if (e.key === 'ArrowRight') setSplit(split + 3); });

  // tabs
  const selectOut = o => { $$('.wb-out .wb-tabs [data-o]').forEach(b => b.setAttribute('aria-selected', b.dataset.o === o)); $$('.wb-out [data-p]').forEach(p => p.hidden = p.dataset.p !== o); };
  const selectFile = k => { state[active] = editor.getValue(); active = k; $$('.wb-code [data-f]').forEach(b => b.setAttribute('aria-selected', b.dataset.f === k)); editor.setLang(LANG[k]); editor.setValue(state[k], true); };
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || !root.contains(b)) return;
    if (b.dataset.f) selectFile(b.dataset.f);
    else if (b.dataset.o) selectOut(b.dataset.o);
    else if (b.dataset.m) { root.dataset.m = b.dataset.m === 'code' ? 'code' : 'out'; $$('.wb-mtabs [data-m]').forEach(x => x.setAttribute('aria-selected', x === b)); if (b.dataset.m !== 'code') selectOut(b.dataset.m); }
    else if (b.dataset.a) api[({ run: 'run', reset: 'reset', copy: 'copy', save: 'save', keys: 'keys' })[b.dataset.a]](b);
  });
  const mt = $('.wb-mtabs'); const mq = matchMedia('(max-width:640px)'); const syncM = () => { mt.hidden = !mq.matches; }; mq.addEventListener('change', syncM); syncM();
  if (!web) selectOut('console');

  const setStatus = (msg, meta = '', cls = '') => { const m = $('[data-s=msg]'); m.textContent = msg; m.className = cls; $('[data-s=meta]').textContent = meta; };
  const setCount = (k, n, err) => { const c = $(`[data-c=${k}]`); c.textContent = n; c.classList.toggle('err', !!err); };
  const note = (nt, bad) => { $('.wb-note').innerHTML = opts.bit === false ? '' : bitNoteHtml(nt, bad); };
  const dlHost = $('[data-p=events]');
  let dlN = 0;
  const addDl = payload => { if (!dlN) dlHost.replaceChildren(); dlN++; const d = document.createElement('div'); d.className = 'dl-item'; d.innerHTML = '<b>push</b> '; d.append(document.createTextNode(JSON.stringify(payload, null, 2))); dlHost.append(d); setCount('events', dlN); };

  const api = {
    el: root, editor, console: con,
    getFiles() { state[active] = editor.getValue(); return { ...state }; },
    setFiles(f) { Object.assign(state, f); editor.setValue(state[active] ?? '', true); },
    getCode() { return editor.getValue(); }, setCode(s) { state[active] = s; editor.setValue(s, true); },
    clear() { con.clear(); dlN = 0; dlHost.innerHTML = '<div class="dl-empty con-empty">// dataLayer.push() calls appear here.</div>'; setCount('console', 0); setCount('events', 0); note(null); },
    reset() { Object.assign(state, init); editor.setValue(state[active] ?? '', true); api.clear(); setStatus('Reset'); if (web) $('.wb-preview').replaceChildren(); },
    async copy(btn) { try { await navigator.clipboard.writeText(editor.getValue()); } catch { editor.ta.select(); document.execCommand('copy'); } toast({ title: 'Copied', sub: 'Code is on your clipboard.' }); },
    save() { const f = api.getFiles(); const s = saveSnippet(`${title} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, f); toast({ title: 'Snippet saved', sub: 'Find it in the Playground.' }); opts.onSave && opts.onSave(s); },
    keys(btn) {
      const ex = $('.menu-pop'); if (ex) { ex.remove(); btn.setAttribute('aria-expanded', false); return; }
      const m = document.createElement('div'); m.className = 'menu-pop'; m.style.minWidth = '260px';
      m.innerHTML = `<div style="padding:8px 12px;font-size:.84rem;line-height:2"><kbd>Ctrl/⌘</kbd> <kbd>Enter</kbd> run<br><kbd>Ctrl/⌘</kbd> <kbd>S</kbd> save snippet<br><kbd>Ctrl/⌘</kbd> <kbd>/</kbd> toggle comment<br><kbd>Tab</kbd> / <kbd>Shift</kbd>+<kbd>Tab</kbd> indent<br><kbd>Esc</kbd> then <kbd>Tab</kbd> leave the editor</div>`;
      btn.parentElement.append(m); btn.setAttribute('aria-expanded', true);
      const off = ev => { if (!m.contains(ev.target) && ev.target !== btn) { m.remove(); btn.setAttribute('aria-expanded', false); document.removeEventListener('pointerdown', off); } }; setTimeout(() => document.addEventListener('pointerdown', off), 0);
    },
    async run() {
      if (running) return; running = true;
      const files = api.getFiles(); const runBtn = $('[data-a=run]'); runBtn.disabled = true;
      api.clear(); editor.setErrorLine(null); setStatus('Running…', '', ''); root.classList.remove('shake');
      const live = m => { if (m.t === 'log') { con.write(m); setCount('console', con.count); } else if (m.t === 'clear') con.clear(); else if (m.t === 'dl') addDl(m.payload); opts.onEvent && opts.onEvent(m); };
      let r;
      try {
        r = web ? await runPage({ html: files.html || '', css: files.css || '', js: files.js || '' }, $('.wb-preview'), { onEvent: live })
                : await runJS(files.js || '', { onEvent: live });
      } catch (e) { r = { error: { name: 'Error', message: String(e.message || e) }, logs: [], dataLayer: [], ms: 0 }; }
      runBtn.disabled = false; running = false;
      if (r.reassigned) { /* warning is already in the console */ }
      let nt = null, bad = false;
      if (r.error) {
        const e = r.error; con.writeText(`${e.name}: ${e.message}${e.line ? `  (line ${e.line})` : ''}`, 'error'); setCount('console', con.count, true);
        if (e.line && (!web || active === 'js')) editor.setErrorLine(e.line);
        nt = bitForError(e); bad = true; if (e.name === 'SyntaxError') prevSyntax = true;
        setStatus(r.timedOut ? 'Stopped' : 'Error', `${r.ms} ms`, 'bad'); root.classList.add('shake'); setTimeout(() => root.classList.remove('shake'), 500);
      } else {
        setStatus('Ran successfully', `${r.ms} ms · ${r.logs.length} log${r.logs.length === 1 ? '' : 's'}${r.dataLayer.length ? ` · ${r.dataLayer.length} push${r.dataLayer.length === 1 ? '' : 'es'}` : ''}`, 'ok');
        root.classList.add('pulse-ok'); setTimeout(() => root.classList.remove('pulse-ok'), 800);
        if (mascotOn() && (firstOk || Math.random() < .25)) nt = bitOk(); firstOk = false;
        unlock('hello');
        if (prevSyntax) { unlock('bracket'); prevSyntax = false; }
        if (r.logs.some(l => l.args.some(a => /0\.30000000000000004/.test(a.v)))) unlock('wizard');
        if (r.dataLayer.length && !hasAch('hello')) unlock('hello');
      }
      note(nt, bad);
      const now = Date.now(), last = store.get('lastRunLog', 0); if (now - last > 60000) { log('run', `Ran code in ${title}`); store.set('lastRunLog', now); }
      opts.onRun && opts.onRun(r, files);
      return r;
    },
    destroy() { root.replaceChildren(); }
  };
  if (opts.autorun || web && opts.autorun !== false) api.run();
  return api;
}
