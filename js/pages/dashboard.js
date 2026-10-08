// Dashboard: every number comes from the learner's real saved progress. No placeholder statistics.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { store } from '../store.js';
import { state, weekActivity, activity, quoteOfDay } from '../xp.js';
import { GREETINGS } from '../data/gamification.js';
import { LESSONS, REGIONS } from '../data/lessons.js';
import { CHALLENGES, LEVELS } from '../data/challenges.js';
import { ACHIEVEMENTS, badgeSvg } from '../data/achievements.js';
import { skillScores } from '../skills.js';
import { bitSvg } from '../bit.js';
import { countUp, observeReveal } from '../motion.js';
mountLayout('dashboard.html');

const s = state(), done = new Set(store.get('done', [])), solved = new Set(store.get('katas', []));
const next = LESSONS.find(l => !done.has(l.id)), week = weekActivity(), skills = skillScores(), act = activity().slice(-8).reverse();
const nextCh = CHALLENGES.filter(c => !solved.has(c.id)).sort((a, b) => LEVELS[a.level].xp - LEVELS[b.level].xp)[0];
const regionsDone = REGIONS.filter(r => LESSONS.filter(l => l.phase === r.id).every(l => done.has(l.id))).length;
const greeting = GREETINGS[Math.floor(Date.now() / 864e5) % GREETINGS.length];
const earned = ACHIEVEMENTS.filter(a => s.ach[a.id]);

const rel = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const ICON = { xp: 'bolt', ach: 'trophy', run: 'terminal' };

// ---- weekly activity: XP per day (real) ----
const maxXp = Math.max(...week.map(d => d.xp), 1), anyXp = week.some(d => d.xp > 0 || d.count > 0);
const bars = week.map((d, i) => { const h = Math.max(d.xp ? 8 : 3, d.xp / maxXp * 100); const today = i === week.length - 1;
  return `<div class="wk-col${today ? ' today' : ''}"><span class="wk-v mono">${d.xp || ''}</span><div class="wk-bar" style="--h:${h}%" title="${d.label}: ${d.xp} XP, ${d.count} action${d.count === 1 ? '' : 's'}"><i></i></div><span class="wk-l">${d.label}</span></div>`; }).join('');

// ---- skill radar (real) ----
const R = 118, C = 150, n = skills.length;
const pt = (i, v) => { const a = -Math.PI / 2 + i / n * 2 * Math.PI; return [C + Math.cos(a) * R * v / 100, C + Math.sin(a) * R * v / 100]; };
const ring = k => skills.map((_, i) => pt(i, k).join(',')).join(' ');
const poly = skills.map((k, i) => pt(i, k.value).join(',')).join(' ');
const radar = `<svg class="radar" viewBox="0 0 300 300" role="img" aria-label="Skill radar. ${skills.map(k => `${k.label} ${k.value} percent`).join(', ')}">
  ${[25, 50, 75, 100].map(k => `<polygon points="${ring(k)}" fill="none" stroke="var(--line)" stroke-width="1"/>`).join('')}
  ${skills.map((_, i) => { const [x, y] = pt(i, 100); return `<line x1="${C}" y1="${C}" x2="${x}" y2="${y}" stroke="var(--line)" stroke-width="1"/>`; }).join('')}
  <polygon class="radar-fill" points="${poly}" fill="color-mix(in srgb,var(--mint) 28%,transparent)" stroke="var(--mint)" stroke-width="2" stroke-linejoin="round"/>
  ${skills.map((k, i) => { const [x, y] = pt(i, k.value); return `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--mint)"/>`; }).join('')}
  ${skills.map((k, i) => { const [x, y] = pt(i, 122); return `<text x="${x}" y="${y}" text-anchor="${x < C - 8 ? 'end' : x > C + 8 ? 'start' : 'middle'}" dominant-baseline="middle" fill="var(--mute)" font-size="10.5" font-family="var(--font-u)">${k.label}</text>`; }).join('')}
</svg>`;

document.getElementById('main').innerHTML = `
<section class="page db">
  <div class="db-hello rv">
    <div class="db-bit">${bitSvg(s.xp ? 'happy' : 'idle')}</div>
    <div><span class="eyebrow">Your dashboard</span><h1>${greeting}</h1><p class="lead">“${quoteOfDay()}”</p></div>
    ${next ? `<a class="btn p lg db-cta" href="lessons.html#${next.id}">${ic('play')} Continue: ${next.title}</a>` : `<a class="btn p lg db-cta" href="arena.html">${ic('trophy')} Take on a challenge</a>`}
  </div>

  <div class="db-stats">
    <div class="stat rv" style="--c:var(--violet)"><span class="mono tiny">LEVEL</span><b data-n="${s.level}">0</b><div class="meter xp"><i style="width:${s.into}%"></i></div><small>${100 - s.into} XP to level ${s.level + 1}</small></div>
    <div class="stat rv" style="--d:.05s"><span class="mono tiny">TOTAL XP</span><b data-n="${s.xp}">0</b><small>earned from real actions only</small></div>
    <div class="stat rv" style="--d:.1s"><span class="mono tiny">DAILY STREAK</span><b data-n="${s.streak}">0</b><small>${s.streak === 1 ? 'day' : 'days'} in a row</small></div>
    <div class="stat rv" style="--d:.15s"><span class="mono tiny">LESSONS</span><b data-n="${done.size}">0</b><small>of ${LESSONS.length} completed</small></div>
    <div class="stat rv" style="--d:.2s"><span class="mono tiny">CHALLENGES</span><b data-n="${solved.size}">0</b><small>of ${CHALLENGES.length} solved</small></div>
    <div class="stat rv" style="--d:.25s"><span class="mono tiny">MODULES</span><b data-n="${regionsDone}">0</b><small>of ${REGIONS.length} regions finished</small></div>
  </div>

  <div class="db-grid">
    <section class="panel db-card rv" aria-labelledby="h-week"><h2 id="h-week">${ic('chart')} This week</h2><p class="mute tiny">XP earned per day</p>
      ${anyXp ? `<div class="wk">${bars}</div>` : `<div class="db-empty"><div class="wk wk-empty">${bars}</div><p>No activity yet this week. Finish a lesson or solve a challenge and this chart wakes up.</p></div>`}</section>
    <section class="panel db-card rv" style="--d:.06s" aria-labelledby="h-skill"><h2 id="h-skill">${ic('target')} Skill radar</h2><p class="mute tiny">Lessons completed plus challenges solved, per topic</p>${radar}
      <table class="sr-only"><caption>Skill scores</caption>${skills.map(k => `<tr><th>${k.label}</th><td>${k.value}%</td></tr>`).join('')}</table></section>

    <section class="panel db-card db-wide rv" aria-labelledby="h-next"><h2 id="h-next">${ic('flag')} Up next</h2>
      <div class="g2">
        <div class="db-next">${next ? `<span class="tag mint">Lesson</span><h3>${next.title}</h3><p>${next.question}</p><a class="btn sm p" href="lessons.html#${next.id}">Resume ${ic('right')}</a>` : `<span class="tag mint">All lessons done</span><h3>Legendary.</h3><p>Every lesson is complete. Keep sharpening with challenges.</p>`}</div>
        <div class="db-next">${nextCh ? `<span class="tag ${LEVELS[nextCh.level].color}">${LEVELS[nextCh.level].label} challenge</span><h3>${nextCh.title}</h3><p>${nextCh.desc.replace(/<[^>]+>/g, '')}</p><a class="btn sm" href="arena.html#${nextCh.id}">Try it ${ic('right')}</a>` : `<span class="tag mint">All challenges solved</span><h3>Arena cleared.</h3><p>You solved every challenge available. More arrive as the site grows.</p>`}</div>
      </div></section>

    <section class="panel db-card db-wide rv" aria-labelledby="h-ach"><h2 id="h-ach">${ic('trophy')} Achievements <span class="tag violet">${earned.length} / ${ACHIEVEMENTS.length}</span></h2>
      <div class="ach-grid">${ACHIEVEMENTS.map(a => { const on = !!s.ach[a.id]; return `<div class="ach ${on ? '' : 'locked'}" title="${on || !a.secret ? a.desc : 'Secret achievement'}">${badgeSvg(a.id, { locked: !on })}<b>${on || !a.secret ? a.name : 'Secret'}</b><span>${on || !a.secret ? a.desc : 'Keep exploring…'}</span></div>`; }).join('')}</div></section>

    <section class="panel db-card db-wide rv" aria-labelledby="h-act"><h2 id="h-act">${ic('clock')} Recent coding activity</h2>
      ${act.length ? `<ol class="db-act">${act.map(e => `<li><span class="ai">${ic(ICON[e.type] || 'sparkles')}</span><span class="al"></span><span class="mono tiny">${rel(e.t)}</span>${e.xp ? `<span class="tag violet">+${e.xp} XP</span>` : ''}</li>`).join('')}</ol>` : '<p class="mute">Nothing yet. Run some code in the Playground or finish a lesson and it will show up here.</p>'}</section>
  </div>
  <div class="row" style="margin-top:28px"><button class="btn sm ghost" id="reset">${ic('reset')} Reset my progress</button><span class="tiny mute">Clears XP, lessons, challenges and achievements in this browser. Saved snippets stay.</span></div>
</section>`;

document.querySelectorAll('.db-act .al').forEach((el, i) => el.textContent = act[i].label);
document.querySelectorAll('.stat b').forEach(b => countUp(b, +b.dataset.n, { ms: 900 }));
document.getElementById('reset').onclick = () => { if (confirm('Erase all progress in this browser? Saved snippets are kept.')) { ['xp', 'awarded', 'done', 'katas', 'best', 'streak', 'lab', 'ach', 'ach-init', 'activity', 'lab-challenges', 'onboarded', 'lastRunLog'].forEach(k => store.set(k, null)); location.reload(); } };
observeReveal();
