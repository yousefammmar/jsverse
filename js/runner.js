// Runs a learner's own code in their own browser and shows console + dataLayer output.
import { ic } from './icons.js';
const fmt = a => typeof a === 'string' ? a : (() => { try { return JSON.stringify(a, null, 2); } catch { return String(a); } })();

export function run(src, out, statusEl) {
  out.textContent = '';
  const line = (t, c) => { const d = document.createElement('div'); if (c) d.className = c; d.textContent = t; out.append(d); };
  const con = { log: (...a) => line(a.map(fmt).join(' ')), warn: (...a) => line(a.map(fmt).join(' ')), error: (...a) => line(a.map(fmt).join(' '), 'e') };
  window.dataLayer = window.dataLayer || [];          // never reassigned: same rule GTM teaches
  const start = window.dataLayer.length;
  try { new Function('console', src)(con); }
  catch (e) { line('Error: ' + e.name + ': ' + e.message, 'e'); }
  const added = window.dataLayer.slice(start), n = added.length;   // show only what this run pushed
  if (n) { line(`\n// dataLayer (${n} new push${n > 1 ? 'es' : ''}):`, 'c'); added.forEach(x => line(fmt(x))); }
  if (statusEl) statusEl.textContent = n ? `${n} push(es) this run` : 'Idle';
  return n;
}

// Wire an editor/run-button/output trio. Tab inserts spaces, Cmd/Ctrl+Enter runs.
export function wire({ ed, btn, out, status }) {
  const go = () => run(ed.value, out, status);
  btn.onclick = go;
  ed.addEventListener('keydown', e => {
    if (e.key === 'Tab') { e.preventDefault(); ed.setRangeText('  ', ed.selectionStart, ed.selectionEnd, 'end'); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') go();
  });
  return go;
}

// Reusable editor + output markup.
export const editorPair = (id, code, file = 'main.js') => `
<div class="two">
  <div class="win"><div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i>&nbsp;<span class="mono">${file}</span><button class="run" id="${id}-run">${ic('bolt')} Run Code</button></div>
    <textarea class="ed" id="${id}-ed" spellcheck="false" aria-label="Code editor"></textarea></div>
  <div class="win"><div class="bar mono">&gt;_ Live Output</div>
    <div class="out" id="${id}-out" aria-live="polite"><span class="c">// Press Run Code (Cmd/Ctrl+Enter)</span></div>
    <div class="status mono"><span>window.dataLayer</span><b id="${id}-st">Idle</b></div></div>
</div>`;
export const mountEditor = (id, code) => { const ed = document.getElementById(id + '-ed'); ed.value = code;
  return wire({ ed, btn: document.getElementById(id + '-run'), out: document.getElementById(id + '-out'), status: document.getElementById(id + '-st') }); };
