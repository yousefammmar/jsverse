import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { store } from '../store.js';
import { VIZ, mountViz } from '../viz/index.js';
mountLayout('visualizers.html');

const main = document.getElementById('main');
const visited = () => new Set(store.get('awarded', []));
const idx = id => VIZ.findIndex(v => v.id === id);
const hashId = () => decodeURIComponent(location.hash.slice(1));
const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
let token = 0;

main.innerHTML = `
<header class="pagehead">
  <span class="eyebrow">Discovery museum</span>
  <h1>Interactive <em>Visualizers</em></h1>
  <p class="lead">Eleven exhibits, one for every big idea in JavaScript. Change a value, press a button, and watch the real behaviour happen. <b>Nothing here is faked.</b></p>
  <div class="viz-prog" id="viz-prog" aria-live="polite"></div>
</header>
<div class="page viz-page" id="viz-root"></div>`;
const root = document.getElementById('viz-root');

function progress() {
  const seen = visited(), n = VIZ.filter(v => seen.has('viz:' + v.id)).length;
  document.getElementById('viz-prog').innerHTML = `<span class="meter" aria-hidden="true"><i style="width:${Math.round(n / VIZ.length * 100)}%"></i></span><span class="mono">${n} of ${VIZ.length} exhibits visited</span>`;
}
function status(v, seen) { return seen.has('viz:' + v.id) ? ['Visited', 'mint'] : ['New', 'js']; }

function gallery() {
  const seen = visited();
  root.replaceChildren(el(`<nav class="viz-gal" aria-label="Exhibits">${VIZ.map((v, i) => {
    const [s, c] = status(v, seen);
    return `<a class="viz-ex card" href="#${v.id}" style="--c:${v.color}" data-i="${i}"><span class="ico">${ic(v.icon)}</span><span class="num mono">${String(i + 1).padStart(2, '0')}</span><h2>${v.title}</h2><p>${v.blurb}</p><span class="tag ${c}">${s === 'Visited' ? ic('check') : ''}${s}</span></a>`;
  }).join('')}</nav>`));
  document.title = 'Visualizers – JSVERSE';
  root.querySelector('.viz-gal').addEventListener('keydown', arrows);
}
function arrows(e) {
  const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  if (!(e.key in keys) && e.key !== 'Home' && e.key !== 'End') return;
  const all = [...e.currentTarget.querySelectorAll('a')], i = all.indexOf(document.activeElement); if (i < 0) return;
  e.preventDefault();
  const cols = getComputedStyle(e.currentTarget).gridTemplateColumns.split(' ').length;
  let n = e.key === 'Home' ? 0 : e.key === 'End' ? all.length - 1 : i + (e.key === 'ArrowUp' || e.key === 'ArrowDown' ? keys[e.key] * cols : keys[e.key]);
  all[Math.max(0, Math.min(all.length - 1, n))].focus();
}

async function exhibit(id) {
  const i = idx(id), v = VIZ[i], my = ++token, seen = visited();
  const prev = VIZ[(i + VIZ.length - 1) % VIZ.length], next = VIZ[(i + 1) % VIZ.length];
  root.replaceChildren(el(`<div class="viz-exwrap">
    <nav class="viz-rail" aria-label="Exhibits">
      <a class="viz-back" href="#"><span aria-hidden="true">${ic('layers')}</span>All exhibits</a>
      ${VIZ.map((x, k) => `<a class="viz-pill${k === i ? ' on' : ''}" href="#${x.id}" style="--c:${x.color}" ${k === i ? 'aria-current="page"' : ''} title="${x.title}"><span class="ico">${ic(x.icon)}</span><span class="t">${x.title}</span>${seen.has('viz:' + x.id) ? `<span class="dot" aria-label="visited"></span>` : ''}</a>`).join('')}
    </nav>
    <section class="viz-room" aria-labelledby="viz-h" style="--c:${v.color}">
      <header class="viz-roomhead">
        <span class="ico" aria-hidden="true">${ic(v.icon)}</span>
        <div class="viz-rt"><span class="eyebrow">Exhibit ${String(i + 1).padStart(2, '0')} of ${VIZ.length}</span><h2 id="viz-h" tabindex="-1">${v.title}</h2><p>${v.blurb}</p></div>
        <div class="viz-nav">
          <a class="btn sm ghost" href="#${prev.id}" aria-label="Previous exhibit: ${prev.title}">${ic('left')}<span>Previous</span></a>
          <a class="btn sm ghost" href="#${next.id}" aria-label="Next exhibit: ${next.title}"><span>Next</span>${ic('right')}</a>
          <a class="btn sm" href="lessons.html#${v.id}">${ic('book')}Open the lesson</a>
        </div>
      </header>
      <div id="viz-mount" class="viz-mount" aria-busy="true"><p class="viz-loading">Loading exhibit...</p></div>
    </section>
  </div>`));
  document.title = `${v.title} – Visualizers – JSVERSE`;
  root.querySelector('.viz-pill.on')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  const host = document.getElementById('viz-mount');
  try { await mountViz(id, host, {}); host.removeAttribute('aria-busy'); }
  catch (e) { if (my === token) host.innerHTML = `<p class="viz-msg err">This exhibit failed to load: ${String(e.message).replace(/[<>&]/g, '')}. Try reloading the page.</p>`; console.error(e); }
}

function route(first) {
  const id = hashId();
  if (idx(id) >= 0) { exhibit(id).then(() => { if (!first) { scrollTo({ top: 0 }); document.getElementById('viz-h')?.focus({ preventScroll: true }); } }); }
  else { ++token; gallery(); if (!first) scrollTo({ top: 0 }); }
  progress();
}
addEventListener('hashchange', () => route(false));
addEventListener('viz:visited', () => { progress(); const id = hashId(); const pill = root.querySelector(`.viz-pill[href="#${id}"]`); if (pill && !pill.querySelector('.dot')) pill.insertAdjacentHTML('beforeend', '<span class="dot" aria-label="visited"></span>'); });
route(true);
