// The Bug Museum: common JavaScript errors, each one REALLY triggered in the sandbox so the message is the genuine one.
// Includes The Semicolon Debate. An Easter egg, linked from the footer and the 404 page.
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { runJS } from '../sandbox.js';
import { highlight } from '../editor.js';
import { award, toast, unlock } from '../xp.js';
import { store } from '../store.js';
mountLayout('bugs.html');

const EXHIBITS = [
  { n: 'ReferenceError', t: 'The Ghost Variable', joke: 'Summoned a variable that was never born.', code: 'console.log(score);\nlet score = 10;', fix: 'Declare the variable before you use it (let and const are not usable above their line).' },
  { n: 'TypeError', t: 'The Undefined Handshake', joke: 'Tried to shake the hand of something that is not there.', code: 'const user = {};\nconsole.log(user.address.city);', fix: 'Check the middle step exists first, or use optional chaining: user.address?.city.' },
  { n: 'TypeError', t: 'The Immovable Constant', joke: 'const means constant. It is not a suggestion.', code: 'const lives = 3;\nlives = lives - 1;', fix: 'Use let for values that change.' },
  { n: 'SyntaxError', t: 'The Missing Bracket', joke: 'One tiny bracket. One very dramatic error.', code: 'console.log("hello";', fix: 'Every ( [ { needs a partner. Read the line the error marks.' },
  { n: 'RangeError', t: 'The Infinite Mirror', joke: 'A function that calls itself forever, until the stack runs out of room.', code: 'function loop() { return loop(); }\nloop();', fix: 'Recursion needs a base case: a condition where the function stops calling itself.' },
  { n: 'Logic', t: 'The Polite Liar: NaN', joke: 'Not a number, but proud of its type.', code: 'console.log(Number("twelve") + 1);\nconsole.log(typeof NaN, NaN === NaN);', fix: 'Validate input with Number.isNaN() before doing maths.' },
  { n: 'Logic', t: 'The Off-By-One Crab', joke: 'Always one step too far.', code: 'const items = ["a", "b", "c"];\nfor (let i = 0; i <= items.length; i++) console.log(items[i]);', fix: 'Arrays start at 0, so the last index is length - 1. Use i < items.length.' },
  { n: 'Logic', t: 'The Loose Equals Trap', joke: '== will agree with almost anything.', code: 'console.log(0 == "", null == undefined, [] == false);\nconsole.log(0 === "", null === undefined);', fix: 'Use === so types are never silently converted.' },
  { n: 'Logic', t: 'Floating Point Fairy Tale', joke: 'Computers count in binary. Cents do not.', code: 'console.log(0.1 + 0.2);\nconsole.log((0.1 + 0.2).toFixed(2));', fix: 'Round for display with toFixed(), and store money as whole cents.' },
  { n: 'Semicolons', t: 'The Semicolon Debate', joke: 'Developers have fought over this since 1995. Here is the one case that actually matters.', code: 'function getNumber() {\n  return\n  42\n}\nconsole.log(getNumber());', fix: 'JavaScript inserts a semicolon right after a bare return, so the function returns undefined. Keep the value on the same line as return. Whether you write semicolons elsewhere is a style choice: pick one and stay consistent.' }
];
const ran = new Set(store.get('bugs-ran', []));
document.getElementById('main').innerHTML = `
<div class="pagehead"><span class="eyebrow">Easter egg</span><h1>The <em class="hl">Bug Museum</em></h1>
<p class="lead">A collection of famous JavaScript mistakes. Every exhibit is genuinely run in a sandbox, so the error messages are the real ones. Please do touch the exhibits.</p></div>
<div class="page bm">${EXHIBITS.map((e, i) => `
  <article class="bm-ex card rv" style="--d:${(i % 2) * .06}s">
    <header><span class="tag ${e.n === 'Logic' ? 'js' : e.n === 'Semicolons' ? 'violet' : 'coral'}">${e.n}</span><h2>${e.t}</h2><p class="mute">${e.joke}</p></header>
    <pre class="code-block" aria-label="Exhibit code">${highlight(e.code)}</pre>
    <div class="row"><button class="btn sm p" data-i="${i}">${ic('play')} Run it</button><span class="mono tiny" aria-hidden="true">sandboxed</span></div>
    <pre class="bm-out mono" id="o${i}" role="status" aria-live="polite" hidden></pre>
    <p class="bm-fix" id="f${i}" hidden>${ic('bulb')} <span>${e.fix}</span></p>
  </article>`).join('')}</div>`;
document.querySelector('.bm').addEventListener('click', async ev => {
  const b = ev.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i, e = EXHIBITS[i], out = document.getElementById('o' + i);
  b.disabled = true; out.hidden = false; out.textContent = 'Running…';
  const r = await runJS(e.code, { timeout: 2500 });
  out.className = 'bm-out mono ' + (r.error ? 'bad' : ''); 
  const lines = r.logs.map(l => l.args.map(a => a.v).join(' '));
  if (r.error) lines.push(`${r.error.name}: ${r.error.message}${r.error.line ? ` (line ${r.error.line})` : ''}`);
  out.textContent = lines.join('\n') || '(no output)';
  document.getElementById('f' + i).hidden = false; b.disabled = false;
  ran.add(i); store.set('bugs-ran', [...ran]);
  if (r.logs.some(l => l.args.some(a => /0\.30000000000000004/.test(a.v)))) unlock('wizard');
  if (ran.size >= 5) award('bugmuseum', 10, 'Toured the Bug Museum');
});
