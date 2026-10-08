// Shared chrome: floating navigation, theme picker, footer, BIT, scroll-reveal. Every page calls mountLayout('<file>.html').
import { ic } from './icons.js';
import { initTheme, getTheme, setTheme, THEMES, applySettings } from './settings.js';
import { touchStreak, paint, evaluate } from './xp.js';
import { mountBit } from './bit.js';
import { observeReveal } from './motion.js';

const NAV = [['lessons.html', 'Learn'], ['visualizers.html', 'Visualizers'], ['playground.html', 'Playground'], ['arena.html', 'Challenges'], ['roadmap.html', 'Roadmap'], ['dashboard.html', 'Dashboard']];
const MORE = [['lab.html', 'Tracking Lab', 'radar', 'Event Intelligence Studio'], ['resources.html', 'Resources', 'book', 'Docs, courses and tools'], ['settings.html', 'Settings', 'settings', 'Themes, mascot and motion']];

export function mountLayout(page) {
  initTheme();
  document.body.insertAdjacentHTML('afterbegin', `
  <a class="skip" href="#main">Skip to content</a>
  <header class="hdr" role="banner">
    <a class="brand" href="index.html" aria-label="JSVERSE home"><img src="assets/logo.svg" alt=""><span>JS<b>VERSE</b></span></a>
    <nav id="nav" aria-label="Main">
      ${NAV.map(([h, t]) => `<a href="${h}"${h === page ? ' aria-current="page"' : ''}>${t}</a>`).join('')}
      <span class="more"><button type="button" id="more-btn" aria-expanded="false" aria-haspopup="true">More ${ic('down')}</button></span>
    </nav>
    <div class="hdr-r">
      <span class="streak-chip" title="Daily streak">${ic('flame')}<span id="streak-val">0 days</span></span>
      <a class="xp-chip" id="xp-chip" href="dashboard.html" aria-label="Your progress">${ic('bolt')}<b id="xp-val">0</b> XP <span class="lvl" id="xp-lvl">Lvl 1</span></a>
      <span class="more" style="position:relative"><button class="icon-btn" id="theme-btn" aria-label="Choose theme" aria-haspopup="true" aria-expanded="false">${ic('palette')}</button></span>
      <button class="icon-btn" id="menu" aria-label="Open menu" aria-expanded="false">${ic('menu')}</button>
    </div>
  </header>`);
  document.body.insertAdjacentHTML('beforeend', `
  <footer class="ftr" role="contentinfo">
    <div>
      <a class="brand" href="index.html"><img src="assets/logo.svg" alt=""><span>JS<b>VERSE</b></span></a>
      <p>The code arcade for learning JavaScript, the DOM and dataLayer tracking by actually doing it.</p>
      <p class="joke">No boring tutorials were harmed in the making of this website.</p>
      <span class="sig">Yousef Odeh<small>designed &amp; built by</small></span>
    </div>
    <div><h2 class="fh">Learn</h2><a href="lessons.html">Lessons</a><a href="visualizers.html">Visualizers</a><a href="roadmap.html">Roadmap</a><a href="resources.html">Resources</a></div>
    <div><h2 class="fh">Build</h2><a href="playground.html">Playground</a><a href="arena.html">Challenges</a><a href="lab.html">Tracking Lab</a><a href="dashboard.html">Dashboard</a><a href="settings.html">Settings</a><a href="bugs.html">Bug Museum</a></div>
  </footer>`);
  const nav = document.getElementById('nav'), menu = document.getElementById('menu');
  menu.onclick = () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o); };
  popover(document.getElementById('more-btn'), pop => { pop.innerHTML = MORE.map(([h, t, i, d]) => `<a href="${h}"${h === page ? ' aria-current="page"' : ''}>${ic(i)}<span>${t}<small>${d}</small></span></a>`).join(''); });
  popover(document.getElementById('theme-btn'), pop => {
    const cur = getTheme();
    pop.setAttribute('role', 'menu');
    pop.innerHTML = THEMES.map(([id, name, d]) => `<button role="menuitemradio" aria-checked="${id === cur}" data-t="${id}">${ic(id === cur ? 'check' : 'palette')}<span>${name}<small>${d}</small></span></button>`).join('');
    pop.onclick = e => { const b = e.target.closest('[data-t]'); if (b) { setTheme(b.dataset.t); pop.remove(); document.getElementById('theme-btn').setAttribute('aria-expanded', false); } };
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { document.querySelectorAll('.hdr .menu-pop').forEach(p => p.remove()); nav.classList.remove('open'); } });
  touchStreak(); paint(); evaluate(); mountBit(); observeReveal();
  // pages render into #main after mountLayout(): re-observe .rv elements whenever content is added
  const mainEl = document.getElementById('main'); let t;
  if (mainEl) new MutationObserver(() => { clearTimeout(t); t = setTimeout(() => observeReveal(), 30); }).observe(mainEl, { childList: true, subtree: true });
  document.documentElement.classList.remove('no-js');
}

// tiny popover helper: builds a .menu-pop under a button, closes on outside click
function popover(btn, build) {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const host = btn.parentElement, ex = host.querySelector('.menu-pop');
    document.querySelectorAll('.hdr .menu-pop').forEach(p => p.remove());
    if (ex) { btn.setAttribute('aria-expanded', false); return; }
    const pop = document.createElement('div'); pop.className = 'menu-pop'; build(pop); host.append(pop); btn.setAttribute('aria-expanded', true);
    const off = ev => { if (!pop.contains(ev.target)) { pop.remove(); btn.setAttribute('aria-expanded', false); document.removeEventListener('pointerdown', off); } };
    setTimeout(() => document.addEventListener('pointerdown', off), 0);
  });
}
