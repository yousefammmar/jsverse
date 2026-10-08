# JSVERSE: The Code Arcade

An interactive playground for learning JavaScript, the DOM and `dataLayer` tracking by running real code.
Plain HTML, CSS and ES modules. No framework, no build step, no dependencies.

```bash
cd jsverse
python3 serve.py          # http://localhost:8746  (threaded, no-cache dev server)
```

`python3 -m http.server` also works, but module-heavy pages open dozens of files at once and the stock server can drop connections.

## What is inside

| Page | What it does |
|---|---|
| `index.html` | Landing page with a real, editable, sandboxed playground, a journey map, a bracket puzzle and live previews |
| `lessons.html` | Three-zone lessons: roadmap, explanation + visualizer + quiz, editable code. 18 lessons in 4 regions |
| `visualizers.html` | Eleven interactive exhibits (variables, types, arrays, objects, conditions, loops, functions, DOM, events, JSON, dataLayer) |
| `playground.html` | HTML/CSS/JS editor with live preview, console, saved snippets and share links |
| `arena.html` | Challenge platform: 47 challenges, difficulty levels, hints, real tests, checkpoint quizzes |
| `lab.html` | Tracking Laboratory ("Event Intelligence Studio"): simulated shop, event timeline, JSON inspector, GA4 validation, tracking challenges |
| `roadmap.html` | Adventure map of the four regions with lit-up progress paths |
| `dashboard.html` | Real progress: XP, streak, weekly chart, skill radar, achievements, recent activity |
| `settings.html` | Three themes, mascot and motion toggles, export / import / reset |
| `resources.html`, `bugs.html`, `404.html` | Curated links, the Bug Museum (with the Semicolon Debate) and a custom 404 |

## Design system

Three complete themes, switched with `data-theme` on `<html>`: **Midnight Developer** (default), **Soft Studio**, **Neon Arcade**.
Tokens live in `css/base.css`; component classes in `css/components.css`. Fonts: Space Grotesk (display), DM Sans (UI), JetBrains Mono (code).
Everything is SVG: there are no emoji anywhere. BIT, the mascot, is built from SVG (`js/bit.js`) and can be turned off in Settings.
Motion respects `prefers-reduced-motion` and a Settings toggle.

## Safe code execution

Learner code never runs in the app's own context (`js/sandbox.js`):

* **Pure JavaScript** runs in a Web Worker. It has no DOM and no storage, and `terminate()` stops infinite loops (4 s timeout).
* **DOM / HTML code** runs in an `<iframe sandbox="allow-scripts">` with an opaque origin: no parent access, no cookies, no `localStorage`.
* Both talk to the host with structured `postMessage` events: console output, errors (with line numbers, including syntax errors), a simulated `dataLayer`, and test results.
* The `dataLayer` the learner sees is simulated. A push never sends analytics. Reassigning `window.dataLayer` triggers a warning, exactly the mistake Google's docs warn about.

## Data you can extend

* `js/data/lessons.js` add a lesson (question, body, code, quiz, resources, linked challenge and visualizer).
* `js/data/challenges.js` add a challenge (`fn`, `dom` or `dl` mode, with real tests).
* `js/data/achievements.js`, `js/data/resources.js`, `js/data/quiz.js`.

## Storage (all in `localStorage`, prefix `jsverse:`)

`xp`, `awarded[]`, `streak`, `done[]`, `katas[]`, `best`, `lab`, `theme` (unchanged from the first version) plus
`ach`, `activity`, `settings`, `snippets`, `lab-challenges`, `revealed`, `onboarded`. XP is awarded once per key, so repeating an action never farms points.
Legacy theme values `dark` / `light` migrate to `midnight` / `studio`.

See `DESIGN.md` for the build contract (tokens, component classes, JS APIs).

Designed and built by Yousef Odeh.
