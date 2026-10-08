// Event propagation playground: real nested elements, real addEventListener calls, steps recorded from the live Event objects.
import { h, frame, code, setCode, ic, sleep, reducedMotion } from './kit.js';

const NAMES = ['outer', 'middle', 'inner', 'button'];
const PH = { 1: 'capture', 2: 'target', 3: 'bubble' };

export function mount(el, { compact } = {}) {
  let mode = 'bubble', stopAt = 'none', steps = [], pending = false, run = 0;
  const f = frame(el, { id: 'events', title: 'Event Propagation', compact,
    notice: 'event.target never changes (the thing you clicked) while event.currentTarget changes at every stop. Capture goes down the tree first, then bubbling comes back up.',
    tries: [
      { label: 'Click and bubble up', run: async () => { setMode('bubble'); setStop('none'); await fire(); } },
      { label: 'Capture runs first', run: async () => { setMode('both'); setStop('none'); await fire(); } },
      { label: 'Stop it at middle', run: async () => { setMode('bubble'); setStop('middle'); await fire(); } }
    ] });
  const els = {};
  const mkBox = (name, child) => {
    const box = h('div.viz-eb.' + name, { 'data-n': name, tabindex: name === 'button' ? null : 0, role: name === 'button' ? null : 'button', 'aria-label': name === 'button' ? null : `${name} box, press Enter to click it` },
      h('span.viz-eb-l.mono', null, `${name}`, h('i.viz-badges')), child);
    return box;
  };
  const btn = h('button.viz-eb.button', { type: 'button', 'data-n': 'button' }, h('span.mono', { text: 'button' }), h('i.viz-badges'));
  els.button = btn; els.inner = mkBox('inner', btn); els.middle = mkBox('middle', els.inner); els.outer = mkBox('outer', els.middle);
  NAMES.slice(0, 3).forEach(n => els[n].addEventListener('keydown', e => { if (e.key === 'Enter' && e.target === els[n]) { e.preventDefault(); els[n].click(); } }));

  const log = h('ol.viz-evlog', { 'aria-label': 'Event log' }), codeEl = code(''), hint = h('p.viz-msg', { 'aria-live': 'polite' });
  const modeTabs = h('div.tabs', { role: 'radiogroup', 'aria-label': 'Listener phase' }, ...[['bubble', 'Bubble'], ['capture', 'Capture'], ['both', 'Both']].map(([k, l]) => h('button', { type: 'button', role: 'radio', 'data-k': k, on: { click: () => setMode(k) } }, l)));
  const stopSel = h('select.input', { 'aria-label': 'Where to call stopPropagation', on: { change: () => setStop(stopSel.value) } }, h('option', { value: 'none', text: 'nowhere' }), ...NAMES.map(n => h('option', { value: n, text: n })));
  const clear = h('button.btn.sm.ghost', { type: 'button', on: { click: () => reset() } }, ic('reset'), 'Clear log');
  f.stage.append(h('div.viz-cols.ev', null,
    h('div.viz-box', null, h('div.viz-lbl', { text: 'Click the button (or any box)' }), h('div.viz-evarena', null, els.outer)),
    h('div.viz-box', null, h('div.viz-lbl', { text: 'Listener phase' }), modeTabs, h('label.viz-lbl', { for: 'viz-ev-stop', text: 'event.stopPropagation() in' }), stopSel, codeEl, h('div.viz-lbl', { text: 'Event log' }), log, hint, clear)));
  stopSel.id = 'viz-ev-stop';

  const handler = capture => function (e) {
    const name = this.dataset.n;
    steps.push({ at: name, target: e.target.dataset.n, phase: PH[e.eventPhase], capture });
    if (stopAt === name) { e.stopPropagation(); steps.push({ stop: name }); }
    if (!pending) { pending = true; setTimeout(flush, 0); }
  };
  const hb = handler(false), hc = handler(true);
  function register() {
    NAMES.forEach(n => { els[n].removeEventListener('click', hb); els[n].removeEventListener('click', hc, true);
      if (mode !== 'capture') els[n].addEventListener('click', hb);
      if (mode !== 'bubble') els[n].addEventListener('click', hc, true); });
    setCode(codeEl, NAMES.map(n => mode === 'both' ? `${n === 'button' ? 'btn' : n}.addEventListener("click", fn, true);  // + false` : `${n === 'button' ? 'btn' : n}.addEventListener("click", fn${mode === 'capture' ? ', true' : ''});`).slice(0, 2).join('\n') + '\n// ...same for inner and button\n' + (stopAt !== 'none' ? `// inside the ${stopAt} listener:\nevent.stopPropagation();` : ''));
  }
  function setMode(k) { mode = k; modeTabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-checked', b.dataset.k === k)); reset(); register(); }
  function setStop(k) { stopAt = k; stopSel.value = k; reset(); register(); }
  const bd = {}; NAMES.forEach(n => bd[n] = els[n].querySelector('.viz-badges'));
  function clearUI() { log.replaceChildren(); hint.textContent = ''; NAMES.forEach(n => { bd[n].replaceChildren(); els[n].classList.remove('hit'); }); }
  function reset() { run++; steps = []; pending = false; clearUI(); }
  const fire = async () => { reset(); els.button.click(); await sleep(60); await playing; };
  let playing = Promise.resolve();
  function flush() {
    pending = false; const mine = ++run, list = steps; steps = []; clearUI();
    playing = (async () => {
      f.touch();
      let n = 0;
      for (const s of list) {
        if (mine !== run) return;
        if (s.stop) { log.append(h('li.stop', { text: `stopPropagation() was called on ${s.stop}. The journey ends here.` })); continue; }
        n++;
        const node = els[s.at];
        bd[s.at].append(h('b', { text: n }));
        node.classList.add('hit'); setTimeout(() => node.classList.remove('hit'), reducedMotion() ? 0 : 450);
        log.append(h('li' + (s.target !== s.at ? '.diff' : ''), null, h('b.viz-n', { text: n }), h('span.tag.' + (s.phase === 'capture' ? 'violet' : s.phase === 'target' ? 'mint' : 'js'), { text: s.phase }),
          h('span.mono', null, 'currentTarget ', h('b', { text: s.at }), ' · target ', h('b', { text: s.target }))));
        await sleep(reducedMotion() ? 0 : 420);
      }
      if (mine === run) { const msg = `${n} listener${n === 1 ? '' : 's'} fired for one click.`; hint.textContent = msg; f.say(msg); }
    })();
  }
  setMode('bubble');
}
