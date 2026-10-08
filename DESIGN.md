# JSVERSE design system and build contract

JSVERSE is a plain HTML + CSS + ES-module site (no build step, no framework). Serve the folder over HTTP
(`python3 -m http.server 8745`). Every page is a tiny shell (`<name>.html`) that loads `js/pages/<name>.js`,
which calls `mountLayout('<name>.html')` and renders into `<main id="main">`.

## Rules that apply to everything
* **SVG icons only. No emoji anywhere** (UI text, data files, toasts, console output). Icons come from `js/icons.js` (`ic('name')`).
  Add a new icon path there if you need one.
* **Never run learner code in the app's own context.** Use `js/sandbox.js` (Worker / sandboxed iframe) or `createWorkbench`.
  Never `eval`, `new Function` or `innerHTML` with learner/user text. Use `textContent`.
* All colours/spacing come from the CSS variables in `css/base.css`; three themes (`midnight`, `studio`, `arcade`) must all look right.
  Use `--*-ink` variants (`--mint-ink`, `--js-ink`, `--coral-ink`, `--violet-ink`, `--accent-ink`) for TEXT; the plain `--mint` etc. are fills.
  Code surfaces (`--code`, `--code-ink`, ...) stay dark in every theme.
* Accessibility: semantic HTML, every control keyboard-operable with a visible focus ring, `aria-live` for status messages,
  labels on inputs, 4.5:1 text contrast, nothing essential behind hover. Respect reduced motion: CSS animations are auto-disabled by
  `base.css`; for JS animation check `reducedMotion()` from `js/settings.js`.
* Mobile first: layouts must work at 375px wide. Complex tools use tabs on small screens (see `createWorkbench`).
* Existing localStorage keys (prefix `jsverse:`, via `js/store.js`) must keep working: `xp, awarded[], streak{n,d}, done[], katas[], best, lab, theme`.
  New keys: `ach{}, ach-init, activity[], settings{mascot,motion}, snippets[], onboarded, lastRunLog, lab-challenges[]`.
  XP is awarded once per key: `award(key, n, message)`. Reuse the legacy keys: lesson `lesson:<id>`, challenge `kata:<id>`, quiz `quiz`, lab `lab`.
* Do not add third-party libraries. Keep pages light.
* Copy tone: smart, witty, occasional. Never childish, never noisy.

## Files
```
css/base.css        tokens, three themes, reset, typography           css/layout.css   header, footer, .page/.section/.g2-.g4
css/components.css  buttons, tags, cards, tabs, toasts, workbench, editor, console, BIT, badges
css/pages.css       landing/lessons/dashboard/roadmap/playground/settings   css/viz.css  visualizers   css/arena.css   css/lab.css
js/layout.js        mountLayout(page)            js/settings.js  themes + settings          js/xp.js      XP / achievements / activity
js/sandbox.js       runJS runTests runDomChecks runPage needsDom       js/editor.js  createEditor, highlight, codeBlock
js/workbench.js     createWorkbench, createConsole, saveSnippet        js/datalayer.js  DataLayerSim + GA4 validation
js/bit.js           mascot: bitSvg bitSay bitForError                  js/motion.js  reveal, countUp, confetti, floatSymbols
js/icons.js         ic(name)                      js/skills.js    skillScores()              js/store.js   store.get/set
js/data/            lessons.js challenges.js quiz.js achievements.js gamification.js resources.js
js/pages/           one module per page          js/viz/  one module per visualizer
```

## Tokens (see css/base.css)
Surfaces `--bg --bg2 --panel --panel2 --line --line2`, text `--ink --mute --dim`, fills `--mint --aqua --js --coral --violet`,
text-safe `--mint-ink --js-ink --coral-ink --violet-ink --accent-ink`, status `--ok --warn --err --xp`, code `--code --code2 --code-ink --code-mute --code-line`,
shape `--r --r-lg --r-sm`, motion `--ease --spring`, fonts `--font-d` (Space Grotesk headings), `--font-u` (DM Sans UI), `--font-m` (JetBrains Mono code).

## Component classes (css/components.css, css/layout.css)
`.page` (centred container) `.section` `.pagehead` `.eyebrow` `.lead` `.g2/.g3/.g4` (grids) `.row` `.sp` (flex spacer) `.stack`
`.btn` (+ `.p` primary mint, `.js` yellow, `.ghost`, `.sm`, `.lg`) `.tag` (+ `.mint .js .coral .violet`) `.chip` `kbd` `.card` (`a.card` lifts on hover; `.ico` icon tile
coloured with `style="--c:var(--violet)"`) `.panel` `.input` `.tabs > [role=tab][aria-selected]` `.meter > i` (progress, set width %) `.rv` (reveal on scroll; add `observeReveal()`)
`.toast` via `toast({title, sub, kind})` `.ach` (achievement tile) `.code-block` (static code, use `codeBlock(code,'js')`).

## JavaScript APIs
```js
import { mountLayout } from '../layout.js';           // mountLayout('arena.html')
import { ic } from '../icons.js';                      // ic('play')
import { createWorkbench } from '../workbench.js';     // mini IDE
const wb = createWorkbench(el, { files:{ js:'...' } , filename:'main.js', height:340, layout:'split'|'stack',
                                 onRun(result, files), onChange(files), onEvent(m), bit:true, save:true, copy:true, reset:true, autorun:false });
//   files with html/css keys => HTML/CSS/JS tabs + live Preview. wb.run() wb.reset() wb.getCode() wb.setCode(s) wb.getFiles() wb.setFiles(f) wb.clear()
import { runJS, runTests, runDomChecks, runPage, needsDom } from '../sandbox.js';
//   runJS(code,{timeout,onEvent}) -> {logs:[{level,args:[{k,v}]}], error:{name,message,line}|null, dataLayer:[payload], timedOut, ms}
//   runTests({code, fn, tests:[{args,expect,name}|{expr,name}]}) -> result.tests = {missing?:fnName, results:[{pass,got,expected,args,threw,name}]}
//   runDomChecks({code, html, css, checks:[{name, expr}]}) -> result.checks = [{name, pass, threw?}]   (expr is a JS boolean expression run after the code)
import { award, unlock, toast, state, log, hasAch } from '../xp.js';   // XP + achievements
import { bitSay, bitSvg, bitForError } from '../bit.js';               // mascot (respects the user's setting)
import { DataLayerSim, validateEvent, statusOf, isEcom } from '../datalayer.js';
import { reducedMotion } from '../settings.js';
import { observeReveal, countUp, confetti } from '../motion.js';
import { createEditor, highlight, codeBlock } from '../editor.js';
```
Achievement ids you may `unlock()`: `hello bracket array object function dom event json tracking slayer legend secret wizard puzzle` (see `js/data/achievements.js`).

## Visualizer contract (`js/viz/index.js`)
`export const VIZ = [{ id, title, blurb, icon, color, load: () => import('./<id>.js') }]` and
`export async function mountViz(id, el, { compact = false } = {})` which loads the module and calls its `mount(el, { compact })`.
Each viz module: `export function mount(el, { compact }) { ... }`. Keys: `variables datatypes arrays objects conditions loops functions dom events json datalayer`.
A viz must run REAL JavaScript behaviour (do not fake it), be operable with keyboard and touch, announce changes via an `aria-live` region and be full-width on mobile.

## Challenge contract (`js/data/challenges.js`) - see the header comment in that file.
Lessons link to challenges by id. These ids MUST exist: swap typename grade count-to evens merge-user sum dom-heading dom-button click-counter read-form wait-value event-object parse-safe dl-push dl-click dl-add-to-cart fix-sum.
Existing ids `sum reverse evens` keep their ids and 75 XP.

## Testing
A static server is already running on http://localhost:8745 (do not start another one on that port). The browser caches ES modules hard:
after editing JS/CSS run `await Promise.all(files.map(f => fetch(f, {cache:'reload'})))` in the page, then reload. Open pages with `?theme=midnight|studio|arcade`.
Check: no console errors, all three themes, a 375px wide viewport, keyboard-only use, and real behaviour (clicking, running code, tests passing/failing).
