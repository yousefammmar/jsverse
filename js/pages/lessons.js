// Lessons: a three-zone interactive coding school.  LEFT roadmap | CENTER explanation, visual, practice, quiz | RIGHT editable code + console.
// Flow per lesson: question -> concept -> visual demo -> working code -> experiments -> practice challenge -> quiz -> reward.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { store } from '../store.js';
import { award, state, toast, log } from '../xp.js';
import { XP } from '../data/gamification.js';
import { LESSONS, REGIONS, lessonById } from '../data/lessons.js';
import { challengeById } from '../data/challenges.js';
import { createWorkbench } from '../workbench.js';
import { bitSay, bitSvg, bitLine, mascotOn } from '../bit.js';
import { confetti } from '../motion.js';
mountLayout('lessons.html');

const $ = (s, r = document) => r.querySelector(s);
const done = () => new Set(store.get('done', []));
const main = document.getElementById('main');
main.innerHTML = `
<div class="lz page" data-view="learn" id="lz">
  <div class="lz-tabs tabs" role="tablist" aria-label="Lesson view">
    <button role="tab" data-v="nav" aria-selected="false">${ic('map')} Lessons</button>
    <button role="tab" data-v="learn" aria-selected="true">${ic('book')} Learn</button>
    <button role="tab" data-v="code" aria-selected="false">${ic('code')} Code</button>
  </div>
  <div class="lz-grid">
    <aside class="lz-nav panel" id="lznav" aria-label="Lessons"></aside>
    <article class="lz-doc" id="doc" tabindex="-1" aria-live="polite"></article>
    <div class="lz-rz" id="rz" role="separator" aria-orientation="vertical" aria-label="Resize the code panel" tabindex="0"></div>
    <section class="lz-code" id="code" aria-label="Code workspace"></section>
  </div>
</div>`;
const lz = $('#lz');
lz.querySelectorAll('.lz-tabs [data-v]').forEach(b => b.onclick = () => setView(b.dataset.v));
function setView(v) { lz.dataset.view = v; lz.querySelectorAll('.lz-tabs [data-v]').forEach(b => b.setAttribute('aria-selected', b.dataset.v === v)); }

// resizable code zone (desktop)
{ const rz = $('#rz'), grid = $('.lz-grid'); let w = store.get('lz-w', 470);
  const set = v => { w = Math.max(340, Math.min(760, v)); grid.style.setProperty('--rz', w + 'px'); rz.setAttribute('aria-valuenow', w); };
  set(w);
  rz.addEventListener('pointerdown', e => { rz.setPointerCapture(e.pointerId); const r = grid.getBoundingClientRect(); const mv = ev => set(r.right - ev.clientX); const up = () => { rz.removeEventListener('pointermove', mv); rz.removeEventListener('pointerup', up); store.set('lz-w', w); }; rz.addEventListener('pointermove', mv); rz.addEventListener('pointerup', up); });
  rz.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') { set(w + 24); store.set('lz-w', w); } if (e.key === 'ArrowRight') { set(w - 24); store.set('lz-w', w); } }); }

function renderNav(cur) {
  const d = done(), pct = Math.round(d.size / LESSONS.length * 100);
  $('#lznav').innerHTML = `<div class="lz-prog"><div class="row"><b>Your journey</b><span class="sp"></span><span class="mono tiny">${d.size}/${LESSONS.length}</span></div><div class="meter"><i style="width:${pct}%"></i></div></div>` +
    REGIONS.map(r => { const ls = LESSONS.filter(l => l.phase === r.id), n = ls.filter(l => d.has(l.id)).length;
      return `<div class="lz-reg" style="--c:var(--${r.color})"><h4><span class="dot"></span>${r.title}<span class="mono tiny">${n}/${ls.length}</span></h4>` +
        ls.map(l => `<a href="#${l.id}" class="${l.id === cur ? 'on' : ''} ${d.has(l.id) ? 'done' : ''}" ${l.id === cur ? 'aria-current="page"' : ''}><span class="lz-dot">${d.has(l.id) ? ic('check') : ''}</span>${l.title}</a>`).join('') + '</div>'; }).join('');
}

let wb = null, current = null;
function show() {
  const l = lessonById(location.hash.slice(1)) || LESSONS.find(x => !done().has(x.id)) || LESSONS[0];
  current = l;
  const i = LESSONS.indexOf(l), prev = LESSONS[i - 1], nextL = LESSONS[i + 1], isDone = done().has(l.id), region = REGIONS[l.phase - 1], ch = challengeById(l.challenge);
  document.title = `${l.title} · Lessons · JSVERSE`;
  renderNav(l.id);
  $('#doc').innerHTML = `
    <div class="lz-head" style="--c:var(--${region.color})">
      <div class="row"><span class="tag" style="color:var(--ci,var(--c));border-color:color-mix(in srgb,var(--c) 45%,var(--line))">${ic(region.glyph)} ${region.title}</span><span class="tag">${ic('clock')} ${l.min} min</span><span class="tag">Lesson ${i + 1} of ${LESSONS.length}</span></div>
      <h1>${l.title}</h1>
      <blockquote class="lz-q">${l.question}</blockquote>
    </div>
    <p class="lead">${l.summary}</p>
    <div class="goals panel"><h2>${ic('target')} What you will learn</h2><ul>${l.learn.map(x => `<li>${x}</li>`).join('')}</ul></div>
    <section class="lz-sec"><h2><span class="n">1</span>The idea</h2><div class="lz-body">${l.body}</div></section>
    ${l.viz ? `<section class="lz-sec"><h2><span class="n">2</span>See it move</h2><div class="lz-viz panel" id="viz"><p class="mute" style="padding:18px">Loading the interactive visualizer…</p></div></section>` : ''}
    <section class="lz-sec"><h2><span class="n">${l.viz ? 3 : 2}</span>Try it yourself</h2>
      <p>The code is on the ${matchMedia('(max-width:900px)').matches ? '<b>Code</b> tab' : 'right'}. <b>Predict the output first</b>, then run it. Then experiment:</p>
      <ul class="lz-exp"><li>${ic('bolt')}<span>Change one value and predict the new result.</span></li><li>${ic('bug')}<span>Break it on purpose. Reading the error is a skill.</span></li><li>${ic('sparkles')}<span>Add one line of your own and run it again.</span></li></ul>
      <button class="btn sm lz-go" id="go-code">${ic('code')} Open the code</button>
    </section>
    <section class="lz-sec"><h2><span class="n">${l.viz ? 4 : 3}</span>Common mistakes</h2><ul class="lz-mist">${l.mistakes.map(x => `<li>${ic('warn')}<span>${x}</span></li>`).join('')}</ul></section>
    ${ch ? `<section class="lz-sec"><h2><span class="n">${l.viz ? 5 : 4}</span>Practice challenge</h2><a class="card hov lz-ch" href="arena.html#${ch.id}"><span class="ico">${ic('target')}</span><div><h3>${ch.title}</h3><p>${ch.desc.replace(/<[^>]+>/g, '')}</p></div><span class="tag violet">${ic('bolt')} ${ch.xp} XP</span>${ic('right')}</a></section>` : ''}
    <section class="lz-sec"><h2><span class="n">${(l.viz ? 5 : 4) + (ch ? 1 : 0)}</span>Quick check</h2><div id="quiz"></div></section>
    <section class="lz-sec"><h3>Further reading</h3><ul class="res">${l.resources.map(r => `<li><a href="${r.u}" target="_blank" rel="noopener noreferrer"><span class="src">${r.s}</span><span class="rt">${r.t}</span>${ic('external')}</a></li>`).join('')}</ul></section>
    <div class="lz-finish panel" id="finish"></div>
    <div class="lz-pager">${prev ? `<a class="btn" href="#${prev.id}">${ic('left')} ${prev.title}</a>` : '<span></span>'}${nextL ? `<a class="btn" href="#${nextL.id}">${nextL.title} ${ic('right')}</a>` : `<a class="btn" href="arena.html">Challenges ${ic('right')}</a>`}</div>`;
  $('#go-code').onclick = () => { setView('code'); $('#code').scrollIntoView({ block: 'start' }); wb && wb.editor.focus(); };
  renderFinish(l, isDone);
  renderQuiz(l);
  renderCode(l);
  if (l.viz) import('../viz/index.js').then(m => m.mountViz(l.viz, $('#viz'), { compact: true })).catch(() => { const v = $('#viz'); if (v) v.closest('section').remove(); });
  const doc = $('#doc'); doc.focus({ preventScroll: true });
}

function renderCode(l) {
  const host = $('#code'); host.innerHTML = `<div class="lz-codehead"><h3>${ic('terminal')} ${l.title}: code</h3><span class="mono tiny">${l.html ? 'HTML + JavaScript' : 'JavaScript'}</span></div><div id="wb"></div>`;
  wb = createWorkbench($('#wb'), { files: l.html ? { html: l.html, js: l.code } : { js: l.code }, filename: l.id + (l.html ? '' : '.js'), layout: 'stack', height: 430, autorun: !!l.html });
}

function renderQuiz(l) {
  const host = $('#quiz'); let score = 0, answered = 0;
  host.innerHTML = l.quiz.map(([q, opts, a, why], qi) => `<div class="qz panel" data-q="${qi}"><p class="qz-q"><b>${qi + 1}.</b> ${q}</p><div class="qz-opts" role="group" aria-label="Question ${qi + 1}">${opts.map((o, oi) => `<button class="qz-o" data-o="${oi}">${o}</button>`).join('')}</div><p class="qz-why" role="status" hidden></p></div>`).join('') + '<div class="qz-sum" id="qsum" role="status"></div>';
  host.querySelectorAll('.qz').forEach(box => {
    const [, opts, a, why] = l.quiz[+box.dataset.q];
    box.querySelectorAll('.qz-o').forEach(btn => btn.onclick = () => {
      const pick = +btn.dataset.o, ok = pick === a; answered++; if (ok) score++;
      box.querySelectorAll('.qz-o').forEach((b, j) => { b.disabled = true; if (j === a) b.classList.add('ok'); else if (j === pick) b.classList.add('no'); });
      const w = box.querySelector('.qz-why'); w.hidden = false; w.innerHTML = `<b>${ok ? 'Correct.' : 'Not quite.'}</b> ${why}`; w.className = 'qz-why ' + (ok ? 'ok' : 'no');
      if (mascotOn()) bitSay(ok ? 'quizRight' : 'quizWrong', { mood: ok ? 'happy' : 'think' });
      if (answered === l.quiz.length) {
        const sum = $('#qsum'), all = score === l.quiz.length;
        sum.innerHTML = `${all ? 'Checkpoint cleared.' : `You got ${score} of ${l.quiz.length}.`} ${all ? '' : '<button class="btn sm" id="retry">Try again</button>'}`;
        if (all) award('lq:' + l.id, 10, `Checkpoint cleared: ${l.title}`);
        const r = $('#retry'); if (r) r.onclick = () => renderQuiz(l);
      }
    });
  });
}

function renderFinish(l, isDone) {
  const f = $('#finish'), region = REGIONS[l.phase - 1];
  if (isDone) { f.innerHTML = `<div class="fin-row"><span class="fin-ok">${ic('check')}</span><div><b>Lesson complete.</b><p class="mute">${l.reward}</p></div><button class="btn sm ghost" id="undo">Mark as not done</button></div>`; $('#undo').onclick = () => { const d = done(); d.delete(l.id); store.set('done', [...d]); show(); }; return; }
  f.innerHTML = `<div class="fin-row"><div>${mascotOn() ? bitSvg('idle') : ''}</div><div><b>Finished this lesson?</b><p class="mute">Run the code, answer the quick check, then claim your reward. +${XP.lesson} XP, once.</p></div><button class="btn p" id="complete">${ic('check')} Complete lesson</button></div>`;
  $('#complete').onclick = () => {
    const d = done(); d.add(l.id); store.set('done', [...d]);
    award('lesson:' + l.id, XP.lesson, `Lesson complete: ${l.title}`);
    const regionLeft = LESSONS.filter(x => x.phase === l.phase && !d.has(x.id)).length;
    if (!regionLeft) { confetti(90); toast({ title: `Region complete: ${region.title}`, sub: 'Chapter finished. Take a bow.', kind: 'xp', big: true }); bitSay('moduleDone', { mood: 'party', force: true }); }
    else if (l.id === 'functions') bitSay('functions', { mood: 'party', force: true });
    else bitSay(l.reward, { mood: 'party', force: true });
    show();
  };
}

addEventListener('hashchange', () => { show(); scrollTo({ top: 0 }); });
show();
