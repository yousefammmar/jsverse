// Skill radar data, computed from real progress: lessons completed + challenges solved per skill.
import { store } from './store.js';
import { LESSONS } from './data/lessons.js';
import { CHALLENGES } from './data/challenges.js';
import { SKILLS } from './data/achievements.js';

/** Returns [{id, label, value 0..100, lessons:[done,total], challenges:[solved,total]}] */
export function skillScores() {
  const done = new Set(store.get('done', [])), solved = new Set(store.get('katas', []));
  return SKILLS.map(([id, label]) => {
    const ls = LESSONS.filter(l => l.skill === id), cs = CHALLENGES.filter(c => c.cat === id);
    const ld = ls.filter(l => done.has(l.id)).length, cd = cs.filter(c => solved.has(c.id)).length;
    const lp = ls.length ? ld / ls.length : null, cp = cs.length ? cd / cs.length : null;
    const value = lp !== null && cp !== null ? (lp + cp) * 50 : lp !== null ? lp * 100 : cp !== null ? cp * 100 : 0;
    return { id, label, value: Math.round(value), lessons: [ld, ls.length], challenges: [cd, cs.length] };
  });
}
