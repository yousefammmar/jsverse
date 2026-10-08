// Achievements: one-time rewards for real actions. `check(state)` ones are derived from saved progress;
// the rest are unlocked by calling unlock(id) from the page where the action happens.
import { iconPaths } from '../icons.js';

export const SKILLS = [
  ['variables', 'Variables'], ['datatypes', 'Data Types'], ['arrays', 'Arrays'], ['objects', 'Objects'], ['conditions', 'Conditions'],
  ['functions', 'Functions'], ['dom', 'DOM'], ['events', 'Events'], ['json', 'JSON'], ['tracking', 'Tracking'], ['debugging', 'Debugging']
];
const lesson = id => s => s.doneSet.has(id);
export const ACHIEVEMENTS = [
  { id: 'hello', name: 'Hello World Hero', desc: 'Run your first piece of code.', glyph: 'terminal', color: 'mint', frame: 'hex', xp: 25 },
  { id: 'bracket', name: 'Bracket Survivor', desc: 'Fix a syntax error and run the code again.', glyph: 'braces', color: 'coral', frame: 'shield', xp: 25 },
  { id: 'array', name: 'Array Adventurer', desc: 'Complete the Arrays lesson.', glyph: 'list', color: 'mint', frame: 'circle', xp: 25, check: lesson('arrays') },
  { id: 'object', name: 'Object Architect', desc: 'Complete the Objects lesson.', glyph: 'cube', color: 'violet', frame: 'diamond', xp: 25, check: lesson('objects') },
  { id: 'function', name: 'Function Wizard', desc: 'Complete the Functions lesson.', glyph: 'func', color: 'violet', frame: 'hex', xp: 25, check: lesson('functions') },
  { id: 'dom', name: 'DOM Detective', desc: 'Complete the DOM lesson.', glyph: 'eye', color: 'aqua', frame: 'octagon', xp: 25, check: lesson('dom') },
  { id: 'event', name: 'Event Hunter', desc: 'Complete the Events lesson.', glyph: 'pointer', color: 'js', frame: 'shield', xp: 25, check: lesson('events') },
  { id: 'json', name: 'JSON Ninja', desc: 'Complete the JSON lesson.', glyph: 'database', color: 'violet', frame: 'circle', xp: 25, check: lesson('json') },
  { id: 'tracking', name: 'Tracking Engineer', desc: 'Send a clean purchase event in the Tracking Lab.', glyph: 'radar', color: 'mint', frame: 'octagon', xp: 40 },
  { id: 'slayer', name: 'Bug Slayer', desc: 'Solve a Debugging challenge.', glyph: 'bug', color: 'coral', frame: 'diamond', xp: 40 },
  { id: 'legend', name: 'JavaScript Legend', desc: 'Complete every lesson.', glyph: 'trophy', color: 'js', frame: 'hex', xp: 100, check: s => s.lessons >= s.lessonTotal && s.lessonTotal > 0 },
  /* earlier badges, kept */
  { id: 'first', name: 'First Steps', desc: 'Earn your first XP.', glyph: 'sparkles', color: 'mint', frame: 'circle', xp: 0, check: s => s.xp > 0 },
  { id: 'l3', name: 'Level 3', desc: 'Reach level 3.', glyph: 'star', color: 'violet', frame: 'shield', xp: 0, check: s => s.level >= 3 },
  { id: 'streak3', name: 'On Fire', desc: 'Keep a 3-day streak.', glyph: 'flame', color: 'js', frame: 'hex', xp: 0, check: s => s.streak >= 3 },
  { id: 'lessons5', name: 'Bookworm', desc: 'Complete 5 lessons.', glyph: 'book', color: 'aqua', frame: 'octagon', xp: 0, check: s => s.lessons >= 5 },
  { id: 'katas', name: 'Kata Master', desc: 'Solve 3 challenges.', glyph: 'target', color: 'coral', frame: 'diamond', xp: 0, check: s => s.katas >= 3 },
  { id: 'tracker', name: 'Telemetry Pro', desc: 'Fire a clean lab event.', glyph: 'timeline', color: 'mint', frame: 'shield', xp: 0, check: s => s.lab },
  /* secrets: hidden until found */
  { id: 'secret', name: 'Secret Finder', desc: 'Found the hidden console.log on the home page.', glyph: 'gift', color: 'js', frame: 'circle', xp: 15, secret: true },
  { id: 'wizard', name: 'Console Wizard', desc: 'Ran the famous 0.1 + 0.2 example.', glyph: 'sparkles', color: 'violet', frame: 'hex', xp: 15, secret: true },
  { id: 'puzzle', name: 'Missing Bracket', desc: 'Solved BIT\'s bracket puzzle.', glyph: 'puzzle', color: 'coral', frame: 'octagon', xp: 15, secret: true }
];
export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, a]));

const FRAMES = {
  hex: 'M48 5L85 26.500V69.500L48 91L11 69.500V26.500Z',
  shield: 'M48 5L84 17V47C84 69 67 83 48 91C29 83 12 69 12 47V17Z',
  circle: 'M48 8a40 40 0 1 0 .01 0Z',
  diamond: 'M48 4L90 48L48 92L6 48Z',
  octagon: 'M31 7h34l24 24v34L65 89H31L7 65V31Z'
};
/** Illustrated badge. Every achievement gets its own frame shape, colour and glyph. */
export function badgeSvg(id, { locked = false } = {}) {
  const a = ACH_BY_ID[id]; if (!a) return '';
  const c = `var(--${a.color})`, glyph = locked && a.secret ? 'lock' : a.glyph;
  return `<svg class="badge-svg" viewBox="0 0 96 96" role="img" aria-label="${locked && a.secret ? 'Secret achievement' : a.name}${locked ? ' (locked)' : ''}">
    <path d="${FRAMES[a.frame]}" style="fill:color-mix(in srgb,${c} 24%,#06222a);stroke:${c};stroke-width:3;stroke-linejoin:round"/>
    <path d="${FRAMES[a.frame]}" style="fill:none;stroke:rgba(255,255,255,.28);stroke-width:1.2;transform:scale(.82);transform-origin:48px 48px"/>
    <circle cx="48" cy="48" r="23" style="fill:${c}"/>
    <g transform="translate(26 26) scale(1.83)" fill="none" style="stroke:#06222a;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round">${iconPaths(glyph)}</g>
    <path d="M16 20l2 4 4 2-4 2-2 4-2-4-4-2 4-2z" style="fill:rgba(255,255,255,.55)"/>
  </svg>`;
}
