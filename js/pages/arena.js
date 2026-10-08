// Challenge Arena: catalogue, challenge screen (workbench + real tests) and checkpoint quizzes.
// Routes (hash): '' catalogue, '#<challengeId>' challenge, '#quiz' quiz menu, '#quiz/<core|lessonId>' a quiz run.
import { ic } from '../icons.js';
import { mountLayout } from '../layout.js';
import { createWorkbench } from '../workbench.js';
import { runTests, runDomChecks, runJS } from '../sandbox.js';
import { store } from '../store.js';
import { award, unlock } from '../xp.js';
import { XP } from '../data/gamification.js';
import { QUIZ } from '../data/quiz.js';
import { LESSONS } from '../data/lessons.js';
import { CATEGORIES, LEVELS, CHALLENGES, challengeById } from '../data/challenges.js';
import { bitSay, bitSvg, bitForError, mascotOn } from '../bit.js';
import { confetti, countUp } from '../motion.js';
import { codeBlock } from '../editor.js';

mountLayout('arena.html');
const main = document.getElementById('main');

/* ---------------- helpers ---------------- */
const CAT = Object.fromEntries(CATEGORIES.map(([id, name, icon, color]) => [id, { id, name, icon, color }]));
const LVL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };
const MODE = { fn: 'Function', dom: 'DOM', dl: 'dataLayer', out: 'Console' };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const plain = h => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' ').trim(); };
const short = (s, n) => s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
const show = v => { if (v === undefined) return 'undefined'; try { return JSON.stringify(v); } catch { return String(v); } };
const solvedSet = () => new Set(store.get('katas', []));
const revealedSet = () => new Set(store.get('revealed', []));
const xpEarned = () => { const a = new Set(store.get('awarded', [])); return CHALLENGES.reduce((s, c) => s + (a.has('kata:' + c.id) ? c.xp : 0), 0); };
const totalXp = CHALLENGES.reduce((s, c) => s + c.xp, 0);
const sorted = () => [...CHALLENGES].sort((a, b) => LVL_ORDER[a.level] - LVL_ORDER[b.level] || CHALLENGES.indexOf(a) - CHALLENGES.indexOf(b));
const nextUnsolved = (after) => {
  const s = solvedSet();
  if (after) { const same = CHALLENGES.filter(c => c.cat === after.cat && c.id !== after.id && !s.has(c.id)); if (same.length) return same.sort((a, b) => LVL_ORDER[a.level] - LVL_ORDER[b.level])[0]; }
  return sorted().find(c => c.id !== (after && after.id) && !s.has(c.id)) || null;
};
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const catStyle = c => `--c:var(--${CAT[c].color})`;
const levelTag = l => `<span class="tag ${LEVELS[l].color}">${LEVELS[l].label}</span>`;

/* ---------------- grading (exported so it can be tested) ---------------- */
/** Run a challenge against the learner's files. Resolves {pass, items:[{name,pass,call?,expected?,got?,threw?,note?}], error, timedOut, missing, pushes?}. */
export async function gradeChallenge(ch, files) {
  const code = files.js || '';
  const out = { pass: false, items: [], error: null, timedOut: false, missing: null, pushes: null };
  let r;
  try {
    if (ch.mode === 'fn') {
      r = await runTests({ code, fn: ch.fn, tests: ch.tests });
      if (r.tests && r.tests.missing) out.missing = r.tests.missing;
      else if (r.tests) out.items = r.tests.results.map((t, i) => {
        const spec = ch.tests[i] || {}, isExpr = !!spec.expr;
        const call = isExpr ? null : `${ch.fn}(${(t.args || []).join(', ')})`;
        return { name: t.name || (isExpr ? spec.expr : `${call} returns ${t.expected}`), pass: !!t.pass, call, expected: isExpr ? 'true' : t.expected, got: isExpr ? null : t.got, threw: t.threw || null };
      });
    } else if (ch.mode === 'dom') {
      r = await runDomChecks({ code, html: ch.html, checks: ch.checks });
      if (r.checks) out.items = r.checks.map(c => ({ name: c.name, pass: !!c.pass, threw: c.threw || null }));
    } else if (ch.mode === 'dl') {
      r = ch.html || ch.act ? await runDomChecks({ code, html: ch.html || '', checks: [{ name: 'act', expr: (ch.act || 'true') + '; true' }] }) : await runJS(code);
      out.pushes = r.dataLayer || [];
      if (!r.timedOut) out.items = ch.verify(out.pushes, { reassigned: !!r.reassigned, error: r.error }).map(x => ({ name: x.name, pass: !!x.pass, note: x.note || '' }));
    }
  } catch (e) { r = { error: { name: 'Error', message: String(e && e.message || e) } }; }
  out.error = r.error || null; out.timedOut = !!r.timedOut;
  out.pass = !out.missing && !out.timedOut && out.items.length > 0 && out.items.every(i => i.pass);
  return out;
}

const criteria = ch => ch.mode === 'fn'
  ? ch.tests.map(t => t.name || (t.expr ? t.expr : `${ch.fn}(${t.args.map(show).join(', ')}) returns ${show(t.expect)}`))
  : ch.mode === 'dom' ? ch.checks.map(c => c.name)
  : ch.verify([], { reassigned: false }).map(x => x.name);

/* ---------------- routing ---------------- */
let wb = null, quizKey = null;
function teardown() { if (wb) { try { wb.destroy(); } catch {} wb = null; } quizKey = null; }
function route(first) {
  const h = decodeURIComponent(location.hash.slice(1));
  teardown();
  const ch = challengeById(h);
  if (h === 'quiz' || h.startsWith('quiz/')) renderQuiz(h.split('/')[1]);
  else if (ch) renderChallenge(ch);
  else renderCatalogue();
  if (first !== true) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
}
addEventListener('hashchange', () => route());

const seg = cur => `<nav class="ar-seg" aria-label="Arena sections"><a href="arena.html"${cur === 'c' ? ' aria-current="page"' : ''}>${ic('code')} Challenges</a><a href="#quiz"${cur === 'q' ? ' aria-current="page"' : ''}>${ic('target')} Checkpoint quiz</a></nav>`;

/* ================= CATALOGUE ================= */
const F = { cat: 'all', level: 'all', status: 'all', q: '' };

function cardHtml(c, solved) {
  const cat = CAT[c.cat], done = solved.has(c.id);
  return `<a class="card ar-card${done ? ' solved' : ''}" href="#${c.id}" style="${catStyle(c.cat)}" data-cat="${c.cat}" aria-label="${esc(c.title)}, ${LEVELS[c.level].label}, ${c.xp} XP, ${done ? 'solved' : 'not solved yet'}">
    <span class="ar-mark" aria-hidden="true">${ic(cat.icon)}</span>
    <div class="ar-card-top"><span class="ico">${ic(cat.icon)}</span>
      ${done ? `<span class="ar-state ok">${ic('check')} Solved</span>` : `<span class="ar-state">${esc(cat.name)}</span>`}</div>
    <h3>${esc(c.title)}</h3>
    <p>${esc(short(plain(c.desc), 118))}</p>
    <div class="ar-card-foot">${levelTag(c.level)}${c.debug ? '<span class="tag coral">Fix the bug</span>' : `<span class="tag">${MODE[c.mode]}</span>`}<span class="sp"></span><span class="ar-xp">${ic('bolt')} ${c.xp} XP</span></div>
  </a>`;
}

function renderCatalogue() {
  document.title = 'Challenges – JSVERSE';
  const solved = solvedSet(), total = CHALLENGES.length, n = CHALLENGES.filter(c => solved.has(c.id)).length;
  const next = nextUnsolved(), pct = Math.round(n / total * 100);
  const byLevel = Object.keys(LEVELS).map(l => { const all = CHALLENGES.filter(c => c.level === l); return `<span class="tag ${LEVELS[l].color}">${LEVELS[l].label} ${all.filter(c => solved.has(c.id)).length}/${all.length}</span>`; }).join('');
  const chip = (g, v, label, extra = '') => `<button type="button" class="ar-fchip" data-g="${g}" data-v="${v}" aria-pressed="${F[g] === v}">${label}${extra}</button>`;
  main.innerHTML = `
  <div class="pagehead"><span class="eyebrow">Practice</span><h1>Challenge <em>Arena</em></h1>
    <p class="lead">${total} challenges, checked by real tests. Write the code, submit it, and read exactly what passed and what did not.</p>
    <div class="row" style="margin-top:20px">${seg('c')}</div></div>
  <div class="page ar-wrap">
    <section class="ar-hero" aria-label="Your arena progress">
      <div class="ar-prog panel">
        <div class="ar-prog-n"><b id="ar-n">${n}</b><span>/ ${total} solved</span></div>
        <div class="meter" role="progressbar" aria-label="Challenges solved" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${n}"><i style="width:${pct}%"></i></div>
        <div class="ar-prog-sub"><span>${ic('bolt')} <b>${xpEarned().toLocaleString()}</b> of ${totalXp.toLocaleString()} XP earned</span><span class="sp"></span>${byLevel}</div>
      </div>
      <div class="ar-cont panel" ${next ? `style="${catStyle(next.cat)}"` : ''}>
        ${next ? `<span class="eyebrow">Continue</span>
          <h2>${esc(next.title)}</h2><p>${esc(short(plain(next.desc), 96))}</p>
          <div class="row" style="gap:10px;flex-wrap:wrap"><a class="btn p" href="#${next.id}">${ic('play')} Start challenge</a>${levelTag(next.level)}<span class="ar-xp">${ic('bolt')} ${next.xp} XP</span></div>`
        : `<span class="eyebrow">All clear</span><h2>Every challenge solved</h2><p>The arena is yours. Try the checkpoint quiz, or revisit a favourite.</p><a class="btn p" href="#quiz">${ic('target')} Take the quiz</a>`}
      </div>
    </section>
    <section class="ar-filters" aria-label="Filter challenges">
      <div class="ar-search"><label for="ar-q" class="ar-sr">Search challenges</label>${ic('search')}<input id="ar-q" class="input" type="search" placeholder="Search by name or topic" autocomplete="off" value="${esc(F.q)}"></div>
      <div class="ar-fgroup" role="group" aria-label="Category">${chip('cat', 'all', 'All topics', `<small>${n}/${total}</small>`)}${CATEGORIES.map(([id, name]) => { const all = CHALLENGES.filter(c => c.cat === id); return chip('cat', id, esc(name), `<small>${all.filter(c => solved.has(c.id)).length}/${all.length}</small>`).replace('class="ar-fchip"', `class="ar-fchip" style="${catStyle(id)}"`); }).join('')}</div>
      <div class="ar-frow">
        <div class="ar-fgroup" role="group" aria-label="Difficulty">${chip('level', 'all', 'Any level')}${Object.entries(LEVELS).map(([id, l]) => chip('level', id, l.label)).join('')}</div>
        <div class="ar-fgroup" role="group" aria-label="Status">${[['all', 'All'], ['todo', 'To do'], ['solved', 'Solved']].map(([v, l]) => chip('status', v, l)).join('')}</div>
      </div>
    </section>
    <p class="ar-count" id="ar-count" role="status" aria-live="polite"></p>
    <div class="ar-grid" id="ar-grid"></div>
  </div>`;
  const grid = document.getElementById('ar-grid'), count = document.getElementById('ar-count');
  const paint = () => {
    const s = solvedSet(), q = F.q.trim().toLowerCase();
    const list = CHALLENGES.filter(c => (F.cat === 'all' || c.cat === F.cat) && (F.level === 'all' || c.level === F.level)
      && (F.status === 'all' || (F.status === 'solved') === s.has(c.id))
      && (!q || (c.title + ' ' + plain(c.desc) + ' ' + CAT[c.cat].name + ' ' + c.id).toLowerCase().includes(q)));
    grid.innerHTML = list.length ? list.map(c => cardHtml(c, s)).join('') : `<div class="ar-empty panel">${ic('search')}<h3>Nothing matches</h3><p>Try a different filter or clear the search.</p><button class="btn" type="button" id="ar-clear">Clear filters</button></div>`;
    count.textContent = `Showing ${list.length} of ${total} challenges`;
    main.querySelectorAll('.ar-fchip').forEach(b => b.setAttribute('aria-pressed', F[b.dataset.g] === b.dataset.v));
  };
  main.querySelector('.ar-filters').addEventListener('click', e => { const b = e.target.closest('.ar-fchip'); if (b) { F[b.dataset.g] = b.dataset.v; paint(); } });
  document.getElementById('ar-q').addEventListener('input', e => { F.q = e.target.value; paint(); });
  grid.addEventListener('click', e => { if (e.target.closest('#ar-clear')) { Object.assign(F, { cat: 'all', level: 'all', status: 'all', q: '' }); document.getElementById('ar-q').value = ''; paint(); } });
  paint();
}

/* ================= CHALLENGE SCREEN ================= */
function renderChallenge(ch) {
  document.title = `${ch.title} – JSVERSE Challenges`;
  const cat = CAT[ch.cat], web = ch.mode === 'dom' || (ch.mode === 'dl' && !!ch.html);
  const crit = criteria(ch);
  let attempts = 0, failed = 0, hintN = 0, solutionOpen = false, busy = false;
  const isSolved = () => solvedSet().has(ch.id);
  main.innerHTML = `
  <div class="page ar-wrap ar-cx" style="${catStyle(ch.cat)}">
    <nav class="ar-crumb" aria-label="Breadcrumb">
      <a class="ar-back" href="arena.html">${ic('left')} All challenges</a>
      <ol><li><a href="arena.html">Arena</a></li><li><a href="arena.html" id="ar-catlink">${esc(cat.name)}</a></li><li aria-current="page">${esc(ch.title)}</li></ol>
    </nav>
    <header class="ar-title">
      <span class="ico ar-ico">${ic(cat.icon)}</span>
      <div class="ar-title-t"><h1>${esc(ch.title)}</h1>
        <div class="ar-meta">${levelTag(ch.level)}<span class="tag">${esc(cat.name)}</span><span class="tag">${MODE[ch.mode]}</span><span class="ar-xp">${ic('bolt')} ${ch.xp} XP</span><span id="ar-solved-tag"></span></div></div>
    </header>
    <div class="ar-cols">
      <aside class="ar-side" aria-label="Challenge brief">
        ${ch.debug ? `<div class="ar-bug">${ic('bug')}<div><b>Fix the bug</b><span>This code is broken on purpose. Run it, read what happens, then repair it.</span></div></div>` : ''}
        <section class="ar-block"><h2>${ic('book')} The problem</h2><div class="ar-desc">${ch.desc}</div></section>
        <section class="ar-block"><h2>${ic('flag')} Success criteria</h2>
          <ul class="ar-crit">${crit.map(t => `<li>${ic('target')}<span>${ch.mode === 'fn' && /^[a-z]+\(.*\) returns /i.test(t) ? `<code>${esc(t)}</code>` : esc(t)}</span></li>`).join('')}</ul>
          ${web ? '<p class="ar-note">Checks run against the original HTML shown in the preview.</p>' : ''}</section>
        <section class="ar-block" id="ar-hintbox" hidden><h2>${ic('bulb')} Hints</h2><ol class="ar-hints" id="ar-hints" aria-live="polite"></ol></section>
      </aside>
      <section class="ar-work" aria-label="Workspace">
        <div id="ar-wb"></div>
        <div class="ar-actions" role="group" aria-label="Challenge actions">
          <button class="btn p lg" type="button" id="ar-submit">${ic('check')} Submit</button>
          <button class="btn" type="button" id="ar-hint">${ic('bulb')} Hint <small id="ar-hint-n">0/${ch.hints.length}</small></button>
          <button class="btn" type="button" id="ar-sol" aria-disabled="true">${ic('eye')} Show solution</button>
          <span class="sp"></span><span class="ar-att" id="ar-att" aria-live="off"></span>
        </div>
        <p class="ar-tip" id="ar-tip" role="status"></p>
        <div id="ar-confirm"></div>
        <div id="ar-reward" aria-live="polite"></div>
        <section class="ar-res" id="ar-res" aria-label="Test results" tabindex="-1"><div class="ar-res-idle">${ic('flag')}<span>Run to experiment. <b>Submit</b> to be judged by the real tests.</span></div></section>
        <div id="ar-solution"></div>
      </section>
    </div>
  </div>`;
  const $ = id => document.getElementById(id);
  wb = createWorkbench($('ar-wb'), { files: web ? { html: ch.html || '', js: ch.starter } : { js: ch.starter }, filename: ch.id + '.js', height: 380, layout: 'split', save: true, copy: true, reset: true });
  const tip = t => { $('ar-tip').textContent = t; };
  const refreshState = () => {
    const s = isSolved();
    $('ar-solved-tag').innerHTML = s ? `<span class="ar-state ok">${ic('check')} Solved</span>` : '';
    $('ar-sol').setAttribute('aria-disabled', (s || failed > 0) ? 'false' : 'true');
    $('ar-att').textContent = attempts ? `${attempts} attempt${attempts === 1 ? '' : 's'}` : '';
  };
  refreshState();
  $('ar-catlink').addEventListener('click', e => { e.preventDefault(); Object.assign(F, { cat: ch.cat, level: 'all', status: 'all', q: '' }); history.pushState(null, '', 'arena.html'); route(); });

  /* hints */
  $('ar-hint').addEventListener('click', () => {
    if (hintN >= ch.hints.length) { tip('No more hints. You can do this, or open the solution if you are truly stuck.'); return; }
    const t = ch.hints[hintN++];
    $('ar-hintbox').hidden = false;
    const li = el('li'); li.textContent = t; $('ar-hints').append(li);
    $('ar-hint-n').textContent = `${hintN}/${ch.hints.length}`;
    if (hintN >= ch.hints.length) $('ar-hint').setAttribute('aria-disabled', 'true');
    bitSay(t, { mood: 'think', force: true, ms: 8000 });
    tip('');
  });

  /* solution */
  const showSolution = () => {
    solutionOpen = true;
    const box = $('ar-solution');
    box.innerHTML = `<section class="ar-block ar-sol"><h2>${ic('eye')} Reference solution</h2>${codeBlock(ch.solution, 'js')}<p class="ar-note">${isSolved() ? 'There are many valid solutions. Compare yours with this one.' : 'Read it, then try writing it yourself from memory.'}</p></section>`;
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
  $('ar-sol').addEventListener('click', () => {
    if (solutionOpen) { $('ar-solution').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    if (isSolved()) { showSolution(); return; }
    if (failed === 0) { tip('The solution unlocks after your first failed submit. Give it an honest try first.'); return; }
    const c = $('ar-confirm'); tip('');
    c.innerHTML = `<div class="ar-confirm" role="alertdialog" aria-labelledby="ar-cf-t" aria-describedby="ar-cf-d">${ic('warn')}<div><b id="ar-cf-t">Reveal the solution?</b><p id="ar-cf-d">If you reveal it before solving this challenge, <strong>no XP will be awarded for it</strong>. You can still solve it and mark it as done.</p>
      <div class="row" style="gap:10px"><button class="btn" type="button" id="ar-cf-keep">Keep trying</button><button class="btn coral-btn" type="button" id="ar-cf-go">Reveal, no XP</button></div></div></div>`;
    $('ar-cf-keep').focus();
    $('ar-cf-keep').addEventListener('click', () => { c.replaceChildren(); $('ar-sol').focus(); });
    $('ar-cf-go').addEventListener('click', () => { const r = revealedSet(); r.add(ch.id); store.set('revealed', [...r]); c.replaceChildren(); showSolution(); $('ar-sol').focus(); });
  });

  /* submit */
  $('ar-submit').addEventListener('click', async () => {
    if (busy) return; busy = true; attempts++; tip('');
    const btn = $('ar-submit'); btn.disabled = true; btn.innerHTML = `${ic('clock')} Checking…`;
    const g = await gradeChallenge(ch, wb.getFiles());
    btn.disabled = false; btn.innerHTML = `${ic('check')} Submit`; busy = false;
    paintResults(g, ch, $('ar-res'));
    if (g.pass) onSolved(); else onFail(g);
    refreshState();
  });

  const onFail = g => {
    failed++; refreshState();
    const p = g.items.filter(i => i.pass).length, n = g.items.length;
    const note = g.error ? bitForError(g.error) : null;
    if (g.missing) bitSay(`I cannot find a function called ${g.missing}. Check the name and the spelling.`, { mood: 'think', force: true });
    else if (note) bitSay(note.text, { mood: note.mood, force: true });
    else bitSay(n ? `${p} of ${n} checks pass. Open the failing one: it shows what you got and what was expected.` : 'Nothing to judge yet. Read the message in the results.', { mood: 'think', force: true });
    $('ar-res').focus({ preventScroll: true }); $('ar-res').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  const onSolved = () => {
    const wasSolved = isSolved(), s = solvedSet(); s.add(ch.id); store.set('katas', [...s]);
    const forfeited = revealedSet().has(ch.id);
    let gained = 0;
    if (!forfeited && award('kata:' + ch.id, ch.xp, ch.title + ' solved')) gained = ch.xp;
    if (ch.debug) unlock('slayer');
    if (!wasSolved) confetti(54);
    bitSay(ch.success, { mood: 'happy', force: true, ms: 7000 });
    refreshState();
    const next = nextUnsolved(ch);
    const msg = forfeited && !wasSolved ? 'Solved, but no XP: the solution was revealed first' : 'XP for this challenge was already collected';
    const r = $('ar-reward');
    r.innerHTML = `<div class="ar-reward" role="status">
      <div class="ar-reward-bit">${mascotOn() ? bitSvg('happy') : `<span class="ar-reward-chk">${ic('check')}</span>`}</div>
      <div class="ar-reward-t"><span class="eyebrow">${wasSolved ? 'Solved again' : 'Challenge solved'}</span>
        <h2>${esc(ch.success)}</h2>
        <p class="ar-reward-xp">${ic('bolt')} ${gained ? '+<b id="ar-xp-n">0</b> XP collected' : esc(msg)}</p>
        <div class="row" style="gap:10px;flex-wrap:wrap">${next ? `<a class="btn p" href="#${next.id}">Next: ${esc(next.title)} ${ic('right')}</a>` : `<a class="btn p" href="arena.html">${ic('trophy')} Every challenge solved. Back to the arena</a>`}
          <a class="btn" href="arena.html">All challenges</a><button class="btn" type="button" id="ar-rw-sol">${ic('eye')} See the solution</button></div></div></div>`;
    if (gained) countUp($('ar-xp-n'), gained, { ms: 800 });
    $('ar-rw-sol').addEventListener('click', showSolution);
    r.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
}

function paintResults(g, ch, host) {
  const n = g.items.length, p = g.items.filter(i => i.pass).length;
  host.replaceChildren();
  const head = el('div', 'ar-res-head ' + (g.pass ? 'ok' : 'no'));
  head.setAttribute('role', 'status');
  head.innerHTML = `${ic(g.pass ? 'check' : 'x')}<div><b></b><span></span></div><em class="ar-score"></em>`;
  head.querySelector('b').textContent = g.pass ? 'All checks passed' : g.missing ? 'Function not found' : g.timedOut ? 'Stopped: took too long' : n ? `${p} of ${n} checks passed` : 'Your code could not be judged';
  head.querySelector('span').textContent = g.pass ? 'Your solution behaves exactly as required.' : 'Fix the failing checks below and submit again.';
  if (n) head.querySelector('.ar-score').textContent = `${p}/${n}`;
  host.append(head);
  if (g.missing || g.timedOut || g.error) {
    const e = el('div', 'ar-err');
    let t;
    if (g.timedOut) t = 'Your code ran for more than 4 seconds and was stopped. Is there a loop that never ends?';
    else if (g.missing) t = `I could not find a function named ${g.missing}. Define it with: function ${g.missing}(...) { ... }` + (g.error ? ` (your code also reported ${g.error.name}: ${g.error.message}${g.error.line ? ', line ' + g.error.line : ''})` : '');
    else t = `${g.error.name}: ${g.error.message}${g.error.line ? ' (line ' + g.error.line + ')' : ''}`;
    e.innerHTML = ic('warn') + '<span></span>'; e.querySelector('span').textContent = t; host.append(e);
  }
  if (n) {
    const ol = el('ol', 'ar-tests');
    g.items.forEach(it => {
      const li = el('li', 'ar-t ' + (it.pass ? 'ok' : 'no'));
      li.innerHTML = `<div class="ar-t-h">${ic(it.pass ? 'check' : 'x')}<span class="ar-t-n"></span><span class="ar-t-s">${it.pass ? 'Pass' : 'Fail'}</span></div>`;
      li.querySelector('.ar-t-n').textContent = it.name;
      const rows = [];
      if (!it.pass) {
        if (it.call) rows.push(['Input', it.call]);
        if (it.threw) rows.push(['Error', it.threw]);
        else {
          if (it.expected != null && it.call) rows.push(['Expected', it.expected]);
          if (it.got != null && it.call) rows.push(['Received', it.got]);
        }
        if (!it.call && !it.threw && ch.mode !== 'dl') rows.push(['Result', 'This check returned false.']);
        if (it.note) rows.push(['Note', it.note]);
      }
      if (rows.length) { const dl = el('dl', 'ar-t-d'); rows.forEach(([k, v]) => { const dt = el('dt'); dt.textContent = k; const dd = el('dd'); dd.textContent = v; dl.append(dt, dd); }); li.append(dl); }
      ol.append(li);
    });
    host.append(ol);
  }
  if (ch.mode === 'dl' && g.pushes) {
    const d = el('details', 'ar-push'); const s = el('summary'); s.textContent = `Captured dataLayer pushes (${g.pushes.length})`;
    const pre = el('pre', 'code-block'); pre.append(document.createElement('code')); pre.firstChild.textContent = g.pushes.length ? g.pushes.map(x => JSON.stringify(x, null, 2)).join('\n') : '// nothing was pushed';
    d.append(s, pre); host.append(d);
  }
}

/* ================= QUIZ ================= */
const QSETS = () => [
  { id: 'core', title: 'Checkpoint Quiz', blurb: 'Six questions across the whole language. Earns XP the first time you finish it.', items: QUIZ.map(([q, o, a]) => ({ q, o, a, e: null })), xp: true, icon: 'target', color: 'mint' },
  ...LESSONS.filter(l => Array.isArray(l.quiz) && l.quiz.length).map(l => ({ id: l.id, title: l.title, blurb: `Check what you learned in this lesson. Feedback only, no XP.`, items: l.quiz.map(([q, o, a, e]) => ({ q, o, a, e: e || null })), xp: false, icon: 'book', color: 'aqua' }))
];

function renderQuiz(id) {
  const sets = QSETS(), set = sets.find(s => s.id === id);
  if (!set) return renderQuizMenu(sets);
  document.title = `${set.title} – JSVERSE Quiz`;
  const key = quizKey = {};
  let i = 0, correct = 0, answered = false;
  main.innerHTML = `<div class="page ar-wrap ar-quiz"><nav class="ar-crumb" aria-label="Breadcrumb"><a class="ar-back" href="#quiz">${ic('left')} All quizzes</a><ol><li><a href="arena.html">Arena</a></li><li><a href="#quiz">Quiz</a></li><li aria-current="page">${esc(set.title)}</li></ol></nav>
    <div class="ar-qcard panel" id="ar-q" style="--c:var(--${set.color})"></div></div>`;
  const host = document.getElementById('ar-q');
  const ask = () => {
    answered = false;
    const it = set.items[i], n = set.items.length;
    host.innerHTML = `<div class="ar-qtop"><span class="eyebrow">${esc(set.title)}</span><span class="ar-qn">Question ${i + 1} of ${n}</span></div>
      <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${i}" aria-label="Quiz progress"><i style="width:${i / n * 100}%"></i></div>
      <h2 class="ar-qt" id="ar-qt"></h2>
      <div class="ar-opts" role="group" aria-labelledby="ar-qt"></div>
      <div class="ar-fb" id="ar-fb" role="status" aria-live="polite"></div>
      <div class="ar-qfoot"><span class="ar-hintk">Tip: press ${it.o.map((_, k) => `<kbd>${k + 1}</kbd>`).join(' ')} to answer</span><span class="sp"></span><button class="btn p" type="button" id="ar-next" hidden>${i + 1 === n ? 'See my score' : 'Next question'} ${ic('right')}</button></div>`;
    document.getElementById('ar-qt').textContent = it.q;
    const opts = host.querySelector('.ar-opts');
    it.o.forEach((txt, k) => { const b = el('button', 'ar-opt'); b.type = 'button'; b.innerHTML = `<kbd>${k + 1}</kbd><span></span>`; b.querySelector('span').textContent = txt; b.addEventListener('click', () => pick(k)); opts.append(b); });
    document.getElementById('ar-next').addEventListener('click', () => { i++; i >= set.items.length ? done() : ask(); });
    opts.firstChild.focus({ preventScroll: true });
  };
  const pick = k => {
    if (answered) return; answered = true;
    const it = set.items[i], ok = k === it.a;
    if (ok) correct++;
    [...host.querySelectorAll('.ar-opt')].forEach((b, j) => { b.disabled = true; if (j === it.a) b.classList.add('ok'); else if (j === k) b.classList.add('no'); if (j === it.a) b.insertAdjacentHTML('beforeend', ic('check')); else if (j === k) b.insertAdjacentHTML('beforeend', ic('x')); });
    const fb = document.getElementById('ar-fb'); fb.className = 'ar-fb show ' + (ok ? 'ok' : 'no');
    fb.innerHTML = `${ic(ok ? 'check' : 'info')}<div><b>${ok ? 'Correct' : 'Not quite'}</b><p></p></div>`;
    fb.querySelector('p').textContent = it.e || (ok ? 'Nicely done.' : `The right answer is: ${it.o[it.a]}`);
    bitSay(ok ? 'quizRight' : 'quizWrong', { mood: ok ? 'happy' : 'think', force: true });
    const nx = document.getElementById('ar-next'); nx.hidden = false; nx.focus();
  };
  const done = () => {
    const n = set.items.length; let extra = '';
    if (set.xp) {
      const best = Math.max(correct, store.get('best', 0)); store.set('best', best);
      const got = award('quiz', correct * XP.quizPerAnswer, 'Quiz finished');
      extra = `<p class="ar-qxp">${ic('bolt')} ${got ? `+${correct * XP.quizPerAnswer} XP earned` : 'XP for this quiz was already collected'} &middot; Best score: <b>${best}/${n}</b></p>`;
    }
    const perfect = correct === n;
    if (perfect) confetti(40);
    bitSay(perfect ? 'quizRight' : correct >= n / 2 ? 'Solid. A bit more practice and it is perfect.' : 'quizWrong', { mood: perfect ? 'happy' : 'think', force: true });
    host.innerHTML = `<div class="ar-qdone"><span class="eyebrow">${esc(set.title)}</span><div class="ar-score-big"><b>${correct}</b><span>/ ${n}</span></div>
      <div class="meter"><i style="width:${correct / n * 100}%"></i></div>
      <h2>${perfect ? 'Flawless.' : correct >= n / 2 ? 'Good work.' : 'Room to grow.'}</h2>
      <p class="lead" style="margin:0 auto">${perfect ? 'Every answer right. Smug mode: enabled.' : 'Wrong answers are how brains upload knowledge. Try again and beat your score.'}</p>${extra}
      <div class="row" style="gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px"><button class="btn p" type="button" id="ar-again">${ic('reset')} Try again</button><a class="btn" href="#quiz">All quizzes</a><a class="btn" href="arena.html">Back to challenges</a></div></div>`;
    document.getElementById('ar-again').addEventListener('click', () => { i = 0; correct = 0; ask(); });
    host.querySelector('.ar-qdone').setAttribute('tabindex', '-1'); host.querySelector('.ar-qdone').focus({ preventScroll: true });
  };
  const onKey = e => {
    if (quizKey !== key) { document.removeEventListener('keydown', onKey); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || answered || !/^[1-9]$/.test(e.key)) return;
    const it = set.items[i]; if (it && +e.key <= it.o.length && host.querySelector('.ar-opt')) pick(+e.key - 1);
  };
  document.addEventListener('keydown', onKey);
  ask();
}

function renderQuizMenu(sets) {
  document.title = 'Checkpoint Quiz – JSVERSE';
  const best = store.get('best', 0), core = sets[0], topics = sets.slice(1);
  main.innerHTML = `<div class="pagehead"><span class="eyebrow">Check your understanding</span><h1>Checkpoint <em>Quiz</em></h1>
    <p class="lead">One question at a time, instant feedback and an explanation for every answer.</p><div class="row" style="margin-top:20px">${seg('q')}</div></div>
    <div class="page ar-wrap">
      <a class="card ar-qmain" href="#quiz/core" style="--c:var(--mint)">
        <span class="ico">${ic('target')}</span><div><h3>${esc(core.title)}</h3><p>${esc(core.blurb)}</p></div>
        <div class="ar-qmain-r"><span class="tag mint">${core.items.length} questions</span><span class="ar-xp">${ic('bolt')} ${XP.quizPerAnswer} XP per correct answer</span>${best ? `<span class="tag">Best ${best}/${core.items.length}</span>` : ''}</div></a>
      <h2 class="ar-h2">By topic</h2>
      <div class="ar-grid">${topics.map(t => `<a class="card ar-card" href="#quiz/${t.id}" style="--c:var(--${t.color})"><span class="ar-mark" aria-hidden="true">${ic('book')}</span><div class="ar-card-top"><span class="ico">${ic('book')}</span><span class="ar-state">${t.items.length} questions</span></div><h3>${esc(t.title)}</h3><p>${esc(t.blurb)}</p></a>`).join('')}</div>
    </div>`;
}

route(true);
