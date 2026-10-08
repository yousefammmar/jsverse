// Playground: a CodePen-style HTML/CSS/JS environment with live preview, console, saved snippets and share links.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { createWorkbench, snippets, saveSnippet } from '../workbench.js';
import { store } from '../store.js';
import { toast } from '../xp.js';
mountLayout('playground.html');

const STARTERS = [
  { id: 'hello', name: 'Hello DOM', note: 'Select and change an element', files: {
    html: '<h1 id="title">Hello, JSVERSE</h1>\n<p>Edit the JavaScript to change this page.</p>',
    css: 'body { font-family: system-ui, sans-serif; padding: 24px; }\nh1 { color: #0f9d86; }',
    js: 'const title = document.getElementById("title");\ntitle.textContent = "Hello from JavaScript";\nconsole.log("The title is now:", title.textContent);' } },
  { id: 'counter', name: 'Click counter', note: 'State and events', files: {
    html: '<button id="btn">Clicked 0 times</button>',
    css: 'body { font-family: system-ui, sans-serif; padding: 24px; }\nbutton { font-size: 1.1rem; padding: 12px 20px; border-radius: 12px; border: 0; background: #34c9a6; cursor: pointer; }\nbutton:active { transform: scale(.96); }',
    js: 'let count = 0;\nconst btn = document.getElementById("btn");\nbtn.addEventListener("click", () => {\n  count++;\n  btn.textContent = `Clicked ${count} time${count === 1 ? "" : "s"}`;\n  console.log("count:", count);\n});' } },
  { id: 'todo', name: 'Todo list', note: 'Arrays, loops and the DOM', files: {
    html: '<input id="item" placeholder="Add a task"> <button id="add">Add</button>\n<ul id="list"></ul>',
    css: 'body { font-family: system-ui, sans-serif; padding: 24px; }\nli { margin: 6px 0; }',
    js: 'const tasks = ["Learn arrays", "Break something"];\nconst list = document.getElementById("list");\nfunction render() {\n  list.replaceChildren(...tasks.map(t => Object.assign(document.createElement("li"), { textContent: t })));\n}\ndocument.getElementById("add").addEventListener("click", () => {\n  const input = document.getElementById("item");\n  if (input.value.trim()) tasks.push(input.value.trim());\n  input.value = "";\n  render();\n  console.log(tasks);\n});\nrender();' } },
  { id: 'colors', name: 'Color mixer', note: 'Inputs and live updates', files: {
    html: '<label>Hue <input id="hue" type="range" min="0" max="360" value="170"></label>\n<div id="swatch"></div>\n<code id="out"></code>',
    css: 'body { font-family: system-ui, sans-serif; padding: 24px; }\n#swatch { width: 140px; height: 140px; border-radius: 24px; margin: 16px 0; }',
    js: 'const hue = document.getElementById("hue");\nconst swatch = document.getElementById("swatch");\nconst out = document.getElementById("out");\nfunction paint() {\n  const color = `hsl(${hue.value} 80% 55%)`;\n  swatch.style.background = color;\n  out.textContent = color;\n}\nhue.addEventListener("input", paint);\npaint();\nconsole.log("Drag the slider!");' } },
  { id: 'datalayer', name: 'dataLayer click tracking', note: 'Delegated tracking, simulated', files: {
    html: '<button data-track="cta_click" data-label="Start free">Start free</button>\n<button data-track="nav_click" data-label="Pricing">Pricing</button>',
    css: 'body { font-family: system-ui, sans-serif; padding: 24px; }\nbutton { margin-right: 8px; padding: 10px 16px; border-radius: 10px; border: 1px solid #999; }',
    js: 'window.dataLayer = window.dataLayer || [];\ndocument.addEventListener("click", event => {\n  const el = event.target.closest("[data-track]");\n  if (!el) return;\n  window.dataLayer.push({ event: el.dataset.track, label: el.dataset.label });\n  console.log("tracked", el.dataset.track);\n});\n// click a button in the preview, then open the dataLayer tab' } },
  { id: 'blank', name: 'Blank canvas', note: 'Start from nothing', files: { html: '', css: '', js: '// Your idea goes here\nconsole.log("Hello");' } }
];

const main = document.getElementById('main');
main.innerHTML = `
<div class="pagehead"><span class="eyebrow">Playground</span><h1>Write it. Run it. <em class="hl">Save it.</em></h1>
<p class="lead">A mini IDE with HTML, CSS and JavaScript, a live preview and a real console. Everything runs in an isolated sandbox, so you cannot break the site (but you are encouraged to break your code).</p></div>
<div class="page pg">
  <aside class="pg-side" aria-label="Starters and snippets">
    <div class="panel pg-box"><h3>${ic('sparkles')} Starters</h3><div id="starters" class="pg-list"></div></div>
    <div class="panel pg-box"><h3>${ic('save')} Saved snippets <span class="tag" id="sn-count">0</span></h3><div id="snips" class="pg-list"></div>
      <div class="row" style="margin-top:10px"><button class="btn sm" id="share">${ic('external')} Copy share link</button></div></div>
  </aside>
  <section class="pg-main"><div id="wb"></div><p class="pg-hint"><b>${ic('info')} Safe by design.</b> Your code runs inside a sandboxed frame with no access to this site, your progress or your storage. Infinite loops are stopped automatically.</p></section>
</div>`;

let cur = STARTERS[0], wb;
const params = () => new URLSearchParams(location.hash.slice(1));
function fromHash() {
  const c = params().get('c');
  if (c) { try { return { name: 'Shared code', files: JSON.parse(decodeURIComponent(escape(atob(c)))) }; } catch { /* ignore bad links */ } }
  const s = params().get('s'); if (s) { const st = STARTERS.find(x => x.id === s); if (st) return st; }
  return null;
}
function open(item) {
  cur = item;
  const f = { html: '', css: '', js: '', ...item.files };
  if (!wb) wb = createWorkbench(document.getElementById('wb'), { files: f, filename: 'playground', height: 520, autorun: true, onSave: renderSnips });
  else { wb.setFiles(f); wb.run(); }
  document.querySelectorAll('#starters button').forEach(b => b.classList.toggle('on', b.dataset.id === item.id));
}
document.getElementById('starters').innerHTML = STARTERS.map(s => `<button class="pg-item" data-id="${s.id}"><b>${s.name}</b><span>${s.note}</span></button>`).join('');
document.getElementById('starters').onclick = e => { const b = e.target.closest('[data-id]'); if (b) open(STARTERS.find(s => s.id === b.dataset.id)); };

function renderSnips() {
  const list = snippets(); document.getElementById('sn-count').textContent = list.length;
  const host = document.getElementById('snips');
  host.innerHTML = list.length ? list.map(s => `<div class="pg-snip"><button class="pg-item" data-sid="${s.id}"><b></b><span>${new Date(s.t).toLocaleDateString()}</span></button><button class="icon-btn" data-del="${s.id}" aria-label="Delete snippet">${ic('trash')}</button></div>`).join('') : '<p class="mute tiny">Nothing saved yet. Press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>S</kbd> in the editor.</p>';
  host.querySelectorAll('[data-sid] b').forEach((b, i) => b.textContent = list[i].name);
}
document.getElementById('snips').onclick = e => {
  const del = e.target.closest('[data-del]'), sel = e.target.closest('[data-sid]');
  if (del) { store.set('snippets', snippets().filter(s => s.id !== del.dataset.del)); renderSnips(); }
  else if (sel) { const s = snippets().find(x => x.id === sel.dataset.sid); if (s) open({ id: 'saved', name: s.name, files: s.files }); }
};
document.getElementById('share').onclick = async () => {
  const f = wb.getFiles(); const link = location.origin + location.pathname + '#c=' + btoa(unescape(encodeURIComponent(JSON.stringify(f))));
  try { await navigator.clipboard.writeText(link); toast({ title: 'Link copied', sub: 'Anyone with it can open your code. It runs sandboxed.' }); } catch { prompt('Copy this link', link); }
};
renderSnips();
open(fromHash() || STARTERS[0]);
