// Resources: curated, link-checked references grouped by purpose, plus every lesson's reading list. Filterable.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { GROUPS } from '../data/resources.js';
import { LESSONS } from '../data/lessons.js';
mountLayout('resources.html');

const item = r => `<a class="res-item" href="${r.u}" target="_blank" rel="noopener noreferrer"><span class="src">${r.s}</span><span class="ri"><b>${r.t}</b>${r.d ? `<small>${r.d}</small>` : ''}</span>${ic('external')}</a>`;
document.getElementById('main').innerHTML = `
<div class="pagehead"><span class="eyebrow">Resources</span><h1>Learn from <em class="hl">the best sources.</em></h1>
<p class="lead">Official docs, free courses and debugging tools, checked and grouped by what you are trying to do. Links open in a new tab.</p>
<div class="row" style="margin-top:18px;max-width:440px"><label class="sr-only" for="q">Filter resources</label><input id="q" class="input" type="search" placeholder="Filter by topic, source or title…" autocomplete="off"></div></div>
<div class="page rs">
  ${GROUPS.map(g => `<section class="rgroup rv"><h2>${g.title}</h2><p class="mute">${g.blurb}</p><div class="rgrid">${g.items.map(item).join('')}</div></section>`).join('')}
  <section class="rgroup rv"><h2>By lesson</h2><p class="mute">Every reading link used in the lessons, in one place.</p>
    ${LESSONS.map(l => `<h3 class="rl"><a href="lessons.html#${l.id}">${l.title}</a></h3><div class="rgrid">${l.resources.map(r => item({ ...r, d: '' })).join('')}</div>`).join('')}</section>
  <p id="none" class="mute" hidden>Nothing matches that filter. Try a different word.</p>
</div>`;
const q = document.getElementById('q');
q.oninput = () => {
  const t = q.value.trim().toLowerCase(); let shown = 0;
  document.querySelectorAll('.res-item').forEach(a => { const ok = !t || a.textContent.toLowerCase().includes(t); a.hidden = !ok; if (ok) shown++; });
  document.querySelectorAll('.rgrid').forEach(g => { g.hidden = ![...g.children].some(c => !c.hidden); const h = g.previousElementSibling; if (h && h.matches('h3.rl')) h.hidden = g.hidden; });
  document.querySelectorAll('.rgroup').forEach(s => s.hidden = ![...s.querySelectorAll('.res-item')].some(c => !c.hidden));
  document.getElementById('none').hidden = shown > 0;
};
