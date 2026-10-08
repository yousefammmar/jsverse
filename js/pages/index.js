// Landing page: editorial hero with a REAL playground, journey, featured lessons, puzzle, visuals, challenge + lab previews.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { createWorkbench } from '../workbench.js';
import { store } from '../store.js';
import { state, unlock, hasAch, toast } from '../xp.js';
import { bitSvg, bitSay, bitOnboard } from '../bit.js';
import { floatSymbols, observeReveal, confetti, countUp } from '../motion.js';
import { LESSONS, REGIONS, lessonById } from '../data/lessons.js';
import { CHALLENGES, CATEGORIES, LEVELS } from '../data/challenges.js';
import { ACHIEVEMENTS, badgeSvg } from '../data/achievements.js';
import { DataLayerSim, fmtTime, payloadSummary } from '../datalayer.js';
import { highlight } from '../editor.js';
mountLayout('index.html');

const HERO_CODE = `const futureDeveloper = {
  name: "You",
  curiosity: Infinity,
  bugsFixed: 0
};

function startJourney() {
  return "Let's build something!";
}

console.log(startJourney());`;

const PUZZLE = `// BIT broke this snippet. One tiny bracket is missing.
const planets = ["Mercury", "Venus", "Earth"];
console.log("Planets:", planets.length;
console.log("Home sweet", planets[2]);`;

const s = state(), done = new Set(store.get('done', []));
const catColor = Object.fromEntries(CATEGORIES.map(c => [c[0], c[3]]));
const catIcon = Object.fromEntries(CATEGORIES.map(c => [c[0], c[2]]));
const next = LESSONS.find(l => !done.has(l.id)) || LESSONS[0];
const featured = ['variables', 'functions', 'events', 'ecommerce'].map(lessonById);
const regionDone = r => LESSONS.filter(l => l.phase === r.id && done.has(l.id)).length, regionTotal = r => LESSONS.filter(l => l.phase === r.id).length;
const sampleChallenges = ['grade', 'merge-user', 'dl-add-to-cart'].map(id => CHALLENGES.find(c => c.id === id) || CHALLENGES[0]);

document.getElementById('main').innerHTML = `
<!-- HERO -->
<section class="hero page">
  <div class="hero-bg" aria-hidden="true"><div class="hero-orb"></div><svg class="hero-ring" viewBox="0 0 200 200"><circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="3 9"/><circle cx="100" cy="100" r="66" fill="none" stroke="currentColor" stroke-width="1"/></svg><div class="sym-layer" id="sym"></div></div>
  <div class="hero-grid">
    <div class="hero-l">
      <span class="eyebrow rv">Interactive JavaScript, DOM &amp; dataLayer playground</span>
      <h1 class="rv" style="--d:.05s">JavaScript is a <em class="hl">Superpower.</em><span class="h1b">Let’s Unlock Yours.</span></h1>
      <p class="lead rv" style="--d:.12s"><b>Write your first line. Break a few things. Fix some bugs.</b> Build something awesome. Every lesson runs real code, right here in your browser.</p>
      <div class="row rv" style="--d:.18s;gap:12px;margin-top:6px">
        <a class="btn p lg" href="${done.size ? 'lessons.html#' + next.id : 'lessons.html#variables'}">${ic('sparkles')} Start Your Adventure</a>
        <a class="btn lg" href="playground.html">${ic('terminal')} Enter the Playground</a>
      </div>
      <p class="micro rv" style="--d:.24s">No boring tutorials were harmed in the making of this website.</p>
      <div class="hero-stats rv" style="--d:.3s">
        <div><b data-n="${LESSONS.length}">0</b><span>lessons</span></div>
        <div><b data-n="${CHALLENGES.length}">0</b><span>challenges</span></div>
        <div><b data-n="11">0</b><span>visualizers</span></div>
        <div><b data-n="${ACHIEVEMENTS.filter(a => !a.secret).length}">0</b><span>achievements</span></div>
      </div>
    </div>
    <div class="hero-r rv" style="--d:.15s">
      <button class="secret" id="secret" aria-label="A small golden semicolon is floating here. Click it."><span aria-hidden="true">;</span></button>
      <div id="hero-wb"></div>
      <p class="hint">Edit the code and press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd>. It is real JavaScript, running in an isolated sandbox.</p>
    </div>
  </div>
</section>

<!-- JOURNEY -->
<section class="section page" id="journey">
  <div class="sec-head"><span class="eyebrow rv">The journey</span><h2 class="rv">Four regions. <em class="hl">One superpower.</em></h2>
  <p class="lead rv">Each concept is a new ability unlocked. Explore in any order, nothing is locked behind a paywall or a boss fight.</p></div>
  <div class="journey">
    ${REGIONS.map((r, i) => `<a class="region r${r.id} rv" style="--c:var(--${r.color});--d:${i * .08}s" href="roadmap.html#region-${r.id}">
      <span class="region-n mono">0${r.id}</span><span class="ico">${ic(r.glyph)}</span>
      <h3>${r.title}</h3><p>${r.tagline}</p>
      <div class="meter"><i style="width:${Math.round(regionDone(r) / regionTotal(r) * 100)}%"></i></div>
      <span class="mono tiny">${regionDone(r)} / ${regionTotal(r)} lessons</span></a>`).join('')}
  </div>
</section>

<!-- FEATURED LESSONS (asymmetric) -->
<section class="section page tight">
  <div class="sec-head"><span class="eyebrow rv">Featured lessons</span><h2 class="rv">Start with a question, <em class="hl">finish with code.</em></h2></div>
  <div class="feat-grid">
    ${featured.map((l, i) => `<a class="feat card hov rv f${i}" style="--c:var(--${REGIONS[l.phase - 1].color});--d:${i * .07}s" href="lessons.html#${l.id}">
      <span class="tag" style="color:var(--ci,var(--c))">${REGIONS[l.phase - 1].title} · ${l.min} min</span>
      <h3>${l.title}</h3>
      <p class="q">“${l.question}”</p>
      ${i === 0 ? `<pre class="code-block mini">${highlight(l.code.split('\n').slice(0, 5).join('\n'))}</pre>` : ''}
      <span class="more">Open lesson ${ic('right')}</span></a>`).join('')}
  </div>
</section>

<!-- LIVE PLAYGROUND / BRACKET PUZZLE -->
<section class="section page" id="puzzle">
  <div class="split">
    <div class="stack" style="--s:14px">
      <span class="eyebrow rv">Live code playground</span>
      <h2 class="rv">Change it. Break it. <em class="hl">Fix it.</em></h2>
      <p class="lead rv">Errors are not failures, they are clues. This snippet has exactly one missing bracket and BIT has opinions about it. Run it, read the red line, then fix it.</p>
      <div class="row rv"><span class="tag coral">Bug hunt</span><span class="tag">1 bracket</span><span class="tag mint">+15 XP secret reward</span></div>
      <a class="btn" href="playground.html">Open the full Playground ${ic('right')}</a>
    </div>
    <div id="puzzle-wb" class="rv"></div>
  </div>
</section>

<!-- VISUAL LEARNING -->
<section class="section page tight" id="visual">
  <div class="split rev">
    <div class="viz-prev rv" aria-label="Array visualizer preview">
      <div class="vp-bar"><span class="mono">arrays.js</span><span class="tag mint">live</span></div>
      <div class="vp-blocks" id="vp-blocks" aria-live="polite"></div>
      <div class="vp-code mono" id="vp-code">const fruits = ["apple", "kiwi"];</div>
      <div class="row" style="padding:0 16px 16px"><button class="btn sm" data-op="push">push()</button><button class="btn sm" data-op="pop">pop()</button><button class="btn sm" data-op="shift">shift()</button><button class="btn sm" data-op="unshift">unshift()</button></div>
    </div>
    <div class="stack" style="--s:14px">
      <span class="eyebrow rv">Visual learning</span>
      <h2 class="rv">See what the code <em class="hl">actually does.</em></h2>
      <p class="lead rv">Eleven interactive exhibits: arrays that move, functions that behave like machines, events that bubble up through the page, and a dataLayer you can watch fill.</p>
      <a class="btn p rv" href="visualizers.html">Explore the exhibits ${ic('right')}</a>
    </div>
  </div>
</section>

<!-- ARENA PREVIEW -->
<section class="section page tight">
  <div class="sec-head"><span class="eyebrow rv">Coding challenges</span><h2 class="rv">Real tests. <em class="hl">Real rewards.</em></h2>
  <p class="lead rv">Your code is checked by real tests, not by guessing what it printed. Solve challenges across eleven topics to earn XP and trophies.</p></div>
  <div class="g3">
    ${sampleChallenges.map((c, i) => `<a class="card hov ch-card rv" style="--c:var(--${catColor[c.cat] || 'mint'});--d:${i * .08}s" href="arena.html#${c.id}">
      <div class="row"><span class="ico">${ic(catIcon[c.cat] || 'code')}</span><span class="sp"></span><span class="tag ${LEVELS[c.level].color}">${LEVELS[c.level].label}</span></div>
      <h3>${c.title}</h3><p>${c.desc.replace(/<[^>]+>/g, '')}</p>
      <div class="row"><span class="tag violet">${ic('bolt')} ${c.xp} XP</span>${store.get('katas', []).includes(c.id) ? `<span class="tag mint">${ic('check')} Solved</span>` : ''}</div></a>`).join('')}
  </div>
  <p style="margin-top:22px" class="rv"><a class="btn" href="arena.html">See all ${CHALLENGES.length} challenges ${ic('right')}</a></p>
</section>

<!-- TRACKING LAB PREVIEW -->
<section class="section page" id="lab-prev">
  <div class="split">
    <div class="stack" style="--s:14px">
      <span class="eyebrow rv">Tracking laboratory</span>
      <h2 class="rv">Watch events <em class="hl">enter the stream.</em></h2>
      <p class="lead rv">Click around a simulated shop and see GA4-shaped events appear, validated live. Every check says whether GA4 <b>requires</b> it or it is just good practice.</p>
      <a class="btn p rv" href="lab.html">Open the Tracking Lab ${ic('right')}</a>
    </div>
    <div class="lab-prev rv" aria-label="Live event timeline preview">
      <div class="lp-bar"><span class="mono">dataLayer timeline</span><span class="tag mint">simulation</span></div>
      <ol class="lp-list" id="lp-list" aria-live="polite"></ol>
    </div>
  </div>
</section>

<!-- XP & ACHIEVEMENTS -->
<section class="section page tight">
  <div class="sec-head"><span class="eyebrow rv">XP &amp; achievements</span><h2 class="rv">Progress you can <em class="hl">actually feel.</em></h2></div>
  <div class="xp-band rv">
    <div class="xp-l"><div class="mono tiny">LEVEL</div><div class="lvl-n" id="lvl-n">${s.level}</div>
      <div class="meter xp"><i style="width:${s.into}%"></i></div>
      <p class="mute" style="margin-top:8px"><b id="xp-n">${s.xp}</b> XP · ${100 - s.into} to level ${s.level + 1}. Rewards are tied to real actions, so repeating a click never farms points.</p></div>
    <div class="ach-row">${ACHIEVEMENTS.filter(a => !a.secret).slice(0, 8).map(a => `<div class="ach ${s.ach[a.id] ? '' : 'locked'}">${badgeSvg(a.id, { locked: !s.ach[a.id] })}<b>${a.name}</b></div>`).join('')}</div>
  </div>
</section>

<!-- FINAL CTA -->
<section class="section page tight">
  <div class="cta-final rv">
    <div class="bit-big">${bitSvg('party')}</div>
    <h2>Ready to give the computer instructions?</h2>
    <p class="lead" style="margin-inline:auto">It takes about ten minutes to start. Your progress is saved in this browser.</p>
    <div class="row" style="justify-content:center;margin-top:8px"><a class="btn p lg" href="lessons.html#${next.id}">${ic('sparkles')} Start Your Adventure</a><a class="btn lg" href="roadmap.html">See the roadmap</a></div>
  </div>
</section>`;

// ---- hero: real workbench, particles, counters, secret ----
floatSymbols(document.getElementById('sym'));
createWorkbench(document.getElementById('hero-wb'), { files: { js: HERO_CODE }, filename: 'future.js', height: 330, autorun: true, save: false });
document.querySelectorAll('.hero-stats b').forEach(b => countUp(b, +b.dataset.n, { ms: 1100 }));
document.getElementById('secret').onclick = e => {
  const b = e.currentTarget; b.classList.add('found');
  const first = unlock('secret'); confetti(30);
  toast({ title: "console.log('You found the secret!')", sub: first ? 'Secret Finder unlocked' : 'You already found it. Still a good log.', kind: 'xp' });
  bitSay("console.log('You found the secret!')", { mood: 'party', force: true });
};

// ---- bracket puzzle: real run; success unlocks the achievement ----
createWorkbench(document.getElementById('puzzle-wb'), {
  files: { js: PUZZLE }, filename: 'planets.js', height: 250, layout: 'stack',
  onRun(r) { if (!r.error && r.logs.length >= 2) { if (unlock('puzzle')) bitSay('You fixed it. One tiny bracket, zero drama.', { mood: 'party', force: true }); } }
});

// ---- array preview (real array drives the blocks) ----
(() => {
  const arr = ['apple', 'kiwi', 'mango'], blocks = document.getElementById('vp-blocks'), code = document.getElementById('vp-code'); let n = 0;
  const names = ['plum', 'lime', 'fig', 'pear', 'date', 'kaki'];
  const draw = (call, ret) => {
    blocks.replaceChildren(...arr.map((v, i) => { const d = document.createElement('div'); d.className = 'vp-b'; d.innerHTML = `<i>${i}</i><span></span>`; d.lastChild.textContent = v; return d; }));
    code.textContent = `${call ? call + '  // returns ' + JSON.stringify(ret) : 'const fruits = ' + JSON.stringify(arr) + ';'}\nfruits.length  // ${arr.length}`;
  };
  document.querySelector('.viz-prev').addEventListener('click', e => {
    const op = e.target.closest('[data-op]')?.dataset.op; if (!op) return;
    let call, ret;
    if (op === 'push' || op === 'unshift') { const v = names[n++ % names.length]; ret = arr[op](v); call = `fruits.${op}("${v}")`; }
    else { ret = arr[op](); call = `fruits.${op}()`; }
    draw(call, ret);
    const last = op === 'pop' || op === 'push' ? arr.length - 1 : 0; blocks.children[Math.min(last, blocks.children.length - 1)]?.classList.add('pop');
  });
  draw();
})();

// ---- lab preview: real DataLayerSim + real validator cycling through a shopper's session ----
(() => {
  const sim = new DataLayerSim(), list = document.getElementById('lp-list'), item = { item_id: 'SKU1', item_name: 'Notebook', price: 9.5, quantity: 2 };
  const script = [
    () => { sim.push({ ecommerce: null }); sim.push({ event: 'view_item_list', ecommerce: { item_list_name: 'All products', items: [{ item_id: 'SKU1', item_name: 'Notebook', price: 9.5 }] } }); },
    () => { sim.push({ ecommerce: null }); sim.push({ event: 'add_to_cart', ecommerce: { currency: 'USD', value: 19, items: [item] } }); },
    () => { sim.push({ ecommerce: null }); sim.push({ event: 'begin_checkout', ecommerce: { currency: 'USD', value: 19, items: [item] } }); },
    () => { sim.push({ event: 'purchase', ecommerce: { currency: 'USD', value: 19, items: [item] } }); }   // deliberately missing transaction_id and clear step
  ];
  const STATUS = { valid: ['ok', 'valid'], warnings: ['warn', 'warnings'], invalid: ['bad', 'invalid'] };
  sim.subscribe(e => {
    if (!e || e.kind === 'clear') return;
    const li = document.createElement('li'); li.className = 'lp-item ' + STATUS[e.status][0];
    li.innerHTML = `<span class="lp-t mono"></span><b class="mono"></b><span class="lp-s"></span><span class="tag ${e.status === 'valid' ? 'mint' : e.status === 'warnings' ? 'js' : 'coral'}">${STATUS[e.status][1]}</span>`;
    li.children[0].textContent = fmtTime(e.ts); li.children[1].textContent = e.name; li.children[2].textContent = payloadSummary(e);
    if (e.issues.length) { const p = document.createElement('p'); p.className = 'lp-why'; p.textContent = (e.issues[0].required ? 'Required by GA4: ' : 'Recommended: ') + e.issues[0].msg; li.append(p); }
    list.prepend(li); while (list.children.length > 4) list.lastChild.remove();
  });
  let i = 0, started = false;
  const step = () => { if (document.hidden) return; script[i % script.length](); i++; if (i % script.length === 0) setTimeout(() => { list.replaceChildren(); sim.reset(); }, 1400); };
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting && !started) { started = true; step(); setInterval(step, 2400); } }); io.observe(document.getElementById('lab-prev'));
})();

bitOnboard();
observeReveal();
