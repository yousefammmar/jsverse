// Roadmap: an adventure map. Four regions, clickable lesson nodes on winding paths, connectors that light up as you progress.
// Nothing is locked: advanced topics stay open for exploration.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { store } from '../store.js';
import { toast } from '../xp.js';
import { XP } from '../data/gamification.js';
import { LESSONS, REGIONS } from '../data/lessons.js';
import { challengeById } from '../data/challenges.js';
import { confetti, observeReveal } from '../motion.js';
import { bitSay } from '../bit.js';
mountLayout('roadmap.html');

const done = new Set(store.get('done', [])), seen = new Set(store.get('rm-seen', [])), celebrated = new Set(store.get('rm-celebrated', []));
const next = LESSONS.find(l => !done.has(l.id));
const XPOS = [16, 50, 84, 50];            // zigzag column per node (percent)
const STEP = 124, TOP = 70;

const land = r => {
  const ls = LESSONS.filter(l => l.phase === r.id), n = ls.filter(l => done.has(l.id)).length, complete = n === ls.length;
  const pts = ls.map((_, i) => [XPOS[i % XPOS.length] * 10, TOP + i * STEP]), H = TOP + (ls.length - 1) * STEP + TOP;
  const segs = pts.slice(1).map((p, i) => { const a = pts[i], my = (a[1] + p[1]) / 2; const lit = done.has(ls[i].id); return `<path class="seg ${lit ? 'lit' : ''}" d="M${a[0]},${a[1]} C${a[0]},${my} ${p[0]},${my} ${p[0]},${p[1]}"/>`; }).join('');
  return `<section class="land r${r.id} rv" id="region-${r.id}" style="--c:var(--${r.color})" aria-labelledby="rt-${r.id}">
    <div class="land-deco" aria-hidden="true"></div>
    <header class="land-head"><span class="mono land-n">REGION 0${r.id}</span><h2 id="rt-${r.id}">${r.title}</h2><p>${r.tagline}</p>
      <div class="row"><div class="meter"><i style="width:${n / ls.length * 100}%"></i></div><span class="mono tiny">${n}/${ls.length}</span>${complete ? `<span class="tag mint">${ic('check')} Complete</span>` : ''}</div></header>
    <div class="trail" style="height:${H}px">
      <svg viewBox="0 0 1000 ${H}" preserveAspectRatio="none" aria-hidden="true">${segs.replace(/class="seg/g, 'class="seg base').replace(/<path class="seg base lit/g, '<path class="seg base lit')}</svg>
      ${ls.map((l, i) => { const st = done.has(l.id) ? 'done' : l.id === (next && next.id) ? 'current' : 'open', fresh = done.has(l.id) && !seen.has(l.id);
        return `<button class="node ${st} ${fresh ? 'fresh' : ''}" data-l="${l.id}" style="left:${XPOS[i % XPOS.length]}%;top:${TOP + i * STEP}px;--i:${i}" aria-label="${l.title}${st === 'done' ? ', completed' : st === 'current' ? ', up next' : ''}">
          <span class="node-i">${st === 'done' ? ic('check') : ic(r.glyph)}</span><span class="node-t">${l.title}</span><span class="node-xp mono">+${XP.lesson} XP</span></button>`; }).join('')}
    </div></section>`;
};

document.getElementById('main').innerHTML = `
<div class="pagehead"><span class="eyebrow">Roadmap</span><h1>Your <em class="hl">adventure map.</em></h1>
<p class="lead">Four regions, ${LESSONS.length} lessons. Each concept is an ability you unlock. Follow the glowing path, or jump anywhere: nothing is locked.</p>
<div class="row" style="margin-top:16px">${next ? `<a class="btn p" href="lessons.html#${next.id}">${ic('play')} ${done.size ? 'Resume' : 'Start'}: ${next.title}</a>` : `<span class="tag mint">${ic('trophy')} Every lesson complete</span>`}<span class="tag">${done.size} / ${LESSONS.length} lessons</span></div></div>
<div class="page rm"><div class="rm-lands">${REGIONS.map(land).join('')}</div>
  <aside class="rm-prev panel" id="prev" aria-live="polite"><div class="rm-empty"><span class="ico">${ic('map')}</span><h3>Pick a node</h3><p class="mute">Select any lesson on the map to preview it.</p></div></aside></div>`;

const prev = document.getElementById('prev');
function preview(id) {
  const l = LESSONS.find(x => x.id === id), r = REGIONS[l.phase - 1], ch = challengeById(l.challenge), isDone = done.has(l.id);
  prev.style.setProperty('--c', `var(--${r.color})`); prev.classList.add('open');
  prev.innerHTML = `<button class="icon-btn rm-x" aria-label="Close preview">${ic('x')}</button>
    <span class="tag" style="color:var(--ci,var(--c))">${ic(r.glyph)} ${r.title}</span><h3>${l.title}</h3><p class="rm-q">“${l.question}”</p>
    <div class="row"><span class="tag">${ic('clock')} ${l.min} min</span><span class="tag violet">${ic('bolt')} +${XP.lesson} XP</span>${isDone ? `<span class="tag mint">${ic('check')} Done</span>` : ''}</div>
    <p class="mute" style="font-size:.9rem">${l.summary}</p>
    <ul class="rm-learn">${l.learn.map(x => `<li>${ic('check')}<span>${x}</span></li>`).join('')}</ul>
    <a class="btn p" href="lessons.html#${l.id}">${isDone ? 'Review lesson' : l === next ? 'Resume lesson' : 'Start lesson'} ${ic('right')}</a>
    ${ch ? `<a class="btn sm" href="arena.html#${ch.id}">${ic('target')} Practice: ${ch.title}</a>` : ''}
    ${l.viz ? `<a class="btn sm ghost" href="visualizers.html#${l.viz}">${ic('shapes')} Visualizer</a>` : ''}`;
  prev.querySelector('.rm-x').onclick = () => { prev.classList.remove('open'); };
}
document.querySelector('.rm-lands').addEventListener('click', e => { const b = e.target.closest('.node'); if (b) { document.querySelectorAll('.node.sel').forEach(n => n.classList.remove('sel')); b.classList.add('sel'); preview(b.dataset.l); } });
if (next && matchMedia('(min-width:1001px)').matches) { const b = document.querySelector(`.node[data-l="${next.id}"]`); if (b) { b.classList.add('sel'); preview(next.id); } }

// celebrate newly finished lessons and chapters (once)
store.set('rm-seen', [...done]);
const newlyDone = LESSONS.filter(l => done.has(l.id) && !seen.has(l.id));
REGIONS.forEach(r => { const ls = LESSONS.filter(l => l.phase === r.id); if (ls.every(l => done.has(l.id)) && !celebrated.has(r.id) && seen.size) { celebrated.add(r.id); store.set('rm-celebrated', [...celebrated]); confetti(80); toast({ title: `Chapter complete: ${r.title}`, sub: 'The path behind you is lit.', kind: 'xp', big: true }); bitSay('moduleDone', { mood: 'party', force: true }); } else if (ls.every(l => done.has(l.id)) && !celebrated.has(r.id)) { celebrated.add(r.id); store.set('rm-celebrated', [...celebrated]); } });
if (newlyDone.length && seen.size) toast({ title: `${newlyDone.length} new node${newlyDone.length > 1 ? 's' : ''} lit up`, sub: newlyDone.map(l => l.title).join(', '), kind: 'xp' });
observeReveal();
