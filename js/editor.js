// Lightweight code editor: a transparent <textarea> over a highlighted <pre>, with a line-number gutter.
// No dependencies (~8 KB). Features: syntax highlighting (js/html/css), line numbers, auto-indent, auto-closing
// pairs, bracket matching, comment toggle, multi-line indent, error-line marking and an Escape-then-Tab keyboard exit.

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- tokenizers: return [{t: class|'', s: text}] ---------- */
const KW = new Set('const let var function return if else for while do break continue switch case default new this class extends super import export from async await try catch finally throw typeof instanceof in of delete void yield static get set'.split(' '));
const LIT = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);
const BI = new Set('console window document Math JSON Object Array String Number Boolean Promise Date Map Set RegExp Error parseInt parseFloat setTimeout setInterval clearTimeout clearInterval fetch localStorage Symbol globalThis dataLayer'.split(' '));
const JS_RE = /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|(`(?:\\[\s\S]|[^`\\])*(?:`|$)|"(?:\\.|[^"\\\n])*(?:"|$)|'(?:\\.|[^'\\\n])*(?:'|$))|(0x[\da-f]+|\d[\d_]*\.?\d*(?:e[+-]?\d+)?n?)|([A-Za-z_$][\w$]*)|([{}()\[\];,.:?=<>!&|+\-*\/%^~])|(\s+)|([\s\S])/gi;
function tokJS(src) {
  const out = []; let m; JS_RE.lastIndex = 0;
  while ((m = JS_RE.exec(src))) {
    if (m[1]) out.push({ t: 't-com', s: m[1] });
    else if (m[2]) out.push({ t: 't-str', s: m[2] });
    else if (m[3]) out.push({ t: 't-num', s: m[3] });
    else if (m[4]) { const w = m[4]; const next = src.slice(JS_RE.lastIndex).match(/^\s*\(/); out.push({ t: KW.has(w) ? 't-kw' : LIT.has(w) ? 't-num' : BI.has(w) ? 't-bi' : next ? 't-fn' : '', s: w }); }
    else if (m[5]) out.push({ t: 't-p', s: m[5], br: true });
    else out.push({ t: '', s: m[0] });
  }
  return out;
}
function tokHTML(src) {
  const re = /(<!--[\s\S]*?(?:-->|$))|(<\/?)([A-Za-z][\w-]*)|("[^"]*"?|'[^']*'?)|([\w:-]+)(?=\s*=)|(\/?>)|([\s\S])/g; const out = []; let m, inTag = false;
  while ((m = re.exec(src))) {
    if (m[1]) out.push({ t: 't-com', s: m[1] });
    else if (m[3]) { inTag = true; out.push({ t: 't-p', s: m[2] }, { t: 't-tag', s: m[3] }); }
    else if (m[4] && inTag) out.push({ t: 't-str', s: m[4] });
    else if (m[5] && inTag) out.push({ t: 't-attr', s: m[5] });
    else if (m[6]) { inTag = false; out.push({ t: 't-p', s: m[6] }); }
    else out.push({ t: '', s: m[0] });
  }
  return out;
}
function tokCSS(src) {
  const re = /(\/\*[\s\S]*?(?:\*\/|$))|("[^"]*"?|'[^']*'?)|(@[\w-]+)|(#[\da-f]{3,8}\b|\d*\.?\d+(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?)|([\w-]+)(?=\s*:)|([{}:;,()])|([\s\S])/gi; const out = []; let m, depth = 0, selStart = true;
  while ((m = re.exec(src))) {
    if (m[1]) out.push({ t: 't-com', s: m[1] });
    else if (m[2]) out.push({ t: 't-str', s: m[2] });
    else if (m[3]) out.push({ t: 't-kw', s: m[3] });
    else if (m[4] && depth > 0) out.push({ t: 't-num', s: m[4] });
    else if (m[5] && depth > 0) out.push({ t: 't-prop', s: m[5] });
    else if (m[6]) { if (m[6] === '{') depth++; if (m[6] === '}') depth = Math.max(0, depth - 1); out.push({ t: 't-p', s: m[6], br: '{}()'.includes(m[6]) }); }
    else out.push({ t: depth === 0 && /\S/.test(m[0]) ? 't-sel' : '', s: m[0] });
  }
  return out;
}
const TOK = { js: tokJS, html: tokHTML, css: tokCSS };
const PAIRS = { '(': ')', '[': ']', '{': '}' }, CLOSE = new Set([')', ']', '}']);

function matchMap(tokens) {                       // index -> index of matching bracket
  const map = new Map(), st = []; let i = 0;
  for (const t of tokens) {
    if (t.br && t.s.length === 1) { if (PAIRS[t.s]) st.push([t.s, i]); else if (CLOSE.has(t.s) && st.length && PAIRS[st[st.length - 1][0]] === t.s) { const [, j] = st.pop(); map.set(i, j); map.set(j, i); } }
    i += t.s.length;
  }
  return map;
}
function render(tokens, marks) {
  let i = 0, html = '';
  for (const t of tokens) {
    const hit = t.s.length === 1 && marks && marks.includes(i);
    const s = esc(t.s);
    html += hit ? `<span class="t-br">${s}</span>` : t.t ? `<span class="${t.t}">${s}</span>` : s;
    i += t.s.length;
  }
  return html;
}
/** Highlight a string to HTML (for static code blocks). */
export const highlight = (code, lang = 'js') => render((TOK[lang] || TOK.js)(code), null);
export const codeBlock = (code, lang = 'js') => `<pre class="code-block"><code>${highlight(code, lang)}</code></pre>`;

const LH = 23, PAD = 14;                         // line height / padding, must match .cm in components.css

export function createEditor(host, { value = '', lang = 'js', label = 'Code editor', onRun, onSave, onChange, readOnly = false } = {}) {
  host.innerHTML = `<div class="cm"><div class="cm-gutter" aria-hidden="true"></div><div class="cm-body"><div class="cm-err" aria-hidden="true" hidden></div><pre class="cm-hl" aria-hidden="true"></pre><textarea class="cm-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" aria-label="${esc(label)}. Press Escape then Tab to leave the editor."></textarea></div></div>`;
  const gutter = host.querySelector('.cm-gutter'), hl = host.querySelector('.cm-hl'), ta = host.querySelector('.cm-ta'), errBar = host.querySelector('.cm-err');
  ta.value = value; ta.readOnly = readOnly;
  let tokens = [], map = new Map(), errLine = null, raf = 0, curLine = 1, api;

  const lineCount = () => ta.value.split('\n').length;
  function paint() {
    tokens = (TOK[lang] || TOK.js)(ta.value); map = matchMap(tokens);
    const p = ta.selectionStart, marks = [];
    if (ta.selectionStart === ta.selectionEnd) {
      [p - 1, p].forEach(k => { if (map.has(k) && ta.value[k] && (PAIRS[ta.value[k]] || CLOSE.has(ta.value[k]))) marks.push(k, map.get(k)); });
    }
    hl.innerHTML = render(tokens, marks) + '\n';
    const n = lineCount(); curLine = ta.value.slice(0, p).split('\n').length;
    if (gutter.childElementCount !== n) gutter.innerHTML = Array.from({ length: n }, (_, i) => `<span>${i + 1}</span>`).join('');
    [...gutter.children].forEach((s, i) => { s.classList.toggle('cur', i + 1 === curLine && document.activeElement === ta); s.classList.toggle('err', i + 1 === errLine); });
    if (errLine) { errBar.hidden = false; errBar.style.top = PAD + (errLine - 1) * LH + 'px'; } else errBar.hidden = true;
    sync();
  }
  const sync = () => { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; gutter.scrollTop = ta.scrollTop; errBar.style.transform = `translateY(${-ta.scrollTop}px)`; };
  const soon = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); };

  // insert text keeping the native undo stack
  const insert = text => { ta.focus(); if (!document.execCommand('insertText', false, text)) ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end'); };
  const lineStart = p => ta.value.lastIndexOf('\n', p - 1) + 1;
  const indentOf = p => ta.value.slice(lineStart(p)).match(/^[ \t]*/)[0];

  ta.addEventListener('input', () => { errLine = null; paint(); onChange && onChange(ta.value); });
  ta.addEventListener('scroll', sync, { passive: true });
  ['keyup', 'click', 'focus', 'blur'].forEach(ev => ta.addEventListener(ev, soon));
  ta.addEventListener('blur', () => { delete ta.dataset.free; });

  ta.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey, v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
    if (mod && e.key === 'Enter') { e.preventDefault(); onRun && onRun(); return; }
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); onSave && onSave(); return; }
    if (readOnly) return;
    if (e.key === 'Escape') { ta.dataset.free = '1'; return; }
    if (mod && e.key === '/') {                    // toggle line comment
      e.preventDefault(); const a = lineStart(s), b = en; const block = v.slice(a, v.indexOf('\n', b) < 0 ? v.length : v.indexOf('\n', b));
      const marker = lang === 'js' ? '// ' : null; if (!marker) return;
      const all = block.split('\n'), on = all.every(l => !l.trim() || l.trimStart().startsWith('//'));
      const out = all.map(l => !l.trim() ? l : on ? l.replace(/^(\s*)\/\/ ?/, '$1') : l.replace(/^(\s*)/, '$1' + marker)).join('\n');
      ta.setSelectionRange(a, a + block.length); insert(out); ta.setSelectionRange(a, a + out.length); return;
    }
    if (e.key === 'Tab') {
      if (ta.dataset.free) return;                 // Escape was pressed: let focus leave
      e.preventDefault();
      if (s !== en && v.slice(s, en).includes('\n') || e.shiftKey) {
        const a = lineStart(s), b = v.indexOf('\n', en) < 0 ? v.length : v.indexOf('\n', en), lines = v.slice(a, b).split('\n');
        const out = lines.map(l => e.shiftKey ? l.replace(/^ {1,2}/, '') : '  ' + l).join('\n');
        ta.setSelectionRange(a, b); insert(out); ta.setSelectionRange(a, a + out.length);
      } else insert('  ');
      return;
    }
    if (e.key === 'Enter' && !mod) {
      e.preventDefault(); const ind = indentOf(s), before = v[s - 1], after = v[en];
      if (before && PAIRS[before] && after === PAIRS[before]) { insert('\n' + ind + '  \n' + ind); const back = 1 + ind.length; ta.setSelectionRange(ta.selectionStart - back, ta.selectionStart - back); }
      else insert('\n' + ind + (before && PAIRS[before] ? '  ' : ''));
      return;
    }
    if (e.key === 'Backspace' && s === en && s > 0 && PAIRS[v[s - 1]] === v[s] || e.key === 'Backspace' && s === en && s > 0 && "\"'`".includes(v[s - 1]) && v[s] === v[s - 1]) {
      e.preventDefault(); ta.setSelectionRange(s - 1, s + 1); document.execCommand('delete'); return;
    }
    if (e.key.length === 1 && !mod && !e.altKey) {
      const k = e.key, next = v[en];
      if ((CLOSE.has(k) || "\"'`".includes(k)) && s === en && next === k) { e.preventDefault(); ta.setSelectionRange(s + 1, s + 1); soon(); return; }  // type over closer
      if (PAIRS[k] || "\"'`".includes(k)) {
        const prev = v[s - 1], closer = PAIRS[k] || k, sel = v.slice(s, en);
        if (sel) { e.preventDefault(); insert(k + sel + closer); ta.setSelectionRange(s + 1, s + 1 + sel.length); return; }
        const wordBefore = prev && /[\w$]/.test(prev), okNext = !next || /[\s)\]};,.]/.test(next);
        if (okNext && !(("\"'`".includes(k)) && wordBefore)) { e.preventDefault(); insert(k + closer); ta.setSelectionRange(s + 1, s + 1); return; }
      }
    }
  });

  paint();
  api = {
    el: host, ta,
    getValue: () => ta.value,
    setValue: (v, silent) => { ta.value = v; errLine = null; paint(); if (!silent) onChange && onChange(v); },
    setLang: l => { lang = l; paint(); },
    setErrorLine: n => { errLine = n || null; paint(); if (n) { const y = PAD + (n - 1) * LH; if (y < ta.scrollTop || y > ta.scrollTop + ta.clientHeight - LH) ta.scrollTop = Math.max(0, y - ta.clientHeight / 3); sync(); } },
    focus: () => ta.focus(),
    refresh: paint
  };
  return api;
}
