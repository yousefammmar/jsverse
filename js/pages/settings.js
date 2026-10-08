// Settings: themes (live previews), BIT mascot, motion, and your data (export / import / reset).
import { mountLayout } from '../layout.js';
import { ic } from '../icons.js';
import { THEMES, getTheme, setTheme, getSettings, setSetting, reducedMotion } from '../settings.js';
import { bitSvg } from '../bit.js';
import { store } from '../store.js';
import { toast } from '../xp.js';
mountLayout('settings.html');

const KEYS = ['xp', 'awarded', 'streak', 'done', 'katas', 'best', 'lab', 'ach', 'ach-init', 'activity', 'lab-challenges', 'snippets', 'settings', 'theme', 'onboarded'];
const sys = matchMedia('(prefers-reduced-motion:reduce)').matches;
const main = document.getElementById('main');

function render() {
  const cur = getTheme(), st = getSettings();
  main.innerHTML = `
  <div class="pagehead"><span class="eyebrow">Settings</span><h1>Make it <em class="hl">yours.</em></h1><p class="lead">Pick a theme, decide how chatty BIT is, tone down the motion. Everything is saved in this browser.</p></div>
  <div class="page st">
    <section class="panel st-card"><h2>${ic('palette')} Theme</h2><p class="mute">Three complete looks. Every page, visualizer and tool follows your choice.</p>
      <div class="theme-grid" role="radiogroup" aria-label="Theme">${THEMES.map(([id, name, d]) => `
        <button class="theme-opt" role="radio" aria-checked="${id === cur}" data-t="${id}">
          <span class="tprev" data-theme="${id}"><i class="tp-bar"></i><i class="tp-h"></i><i class="tp-l"></i><i class="tp-l s"></i><span class="tp-code"><b></b><b></b></span><span class="tp-btn"></span></span>
          <b>${name}</b><span>${d}</span>${id === cur ? `<span class="tag mint sel-tag">${ic('check')} Active</span>` : ''}</button>`).join('')}</div></section>

    <section class="panel st-card"><h2>${ic('sparkles')} BIT, the mascot</h2>
      <div class="st-row"><div class="st-bit">${bitSvg(st.mascot ? 'happy' : 'sleepy')}</div>
        <div><p>BIT drops short, optional comments on errors, quizzes and achievements. Turn it off and BIT goes to sleep: no bubbles, no notes in the console.</p></div>
        <label class="switch"><input type="checkbox" id="mascot" ${st.mascot ? 'checked' : ''}><span class="knob"></span><span class="sr-only">BIT comments</span></label></div></section>

    <section class="panel st-card"><h2>${ic('bolt')} Motion</h2>
      <div class="st-row"><div><p>Animations, floating symbols and confetti. ${sys ? '<b>Your system already asks for reduced motion, so animations stay off regardless.</b>' : 'When off, the site uses instant transitions.'}</p></div>
        <label class="switch"><input type="checkbox" id="motion" ${st.motion ? 'checked' : ''} ${sys ? 'disabled' : ''}><span class="knob"></span><span class="sr-only">Animations</span></label></div></section>

    <section class="panel st-card"><h2>${ic('database')} Your data</h2>
      <p class="mute">Everything lives in this browser. Export a backup, move it to another device, or start fresh.</p>
      <div class="row"><button class="btn" id="exp">${ic('save')} Export progress</button><label class="btn" for="imp" style="cursor:pointer">${ic('external')} Import<input id="imp" type="file" accept="application/json" hidden></label><button class="btn ghost" id="rst" style="margin-left:auto;color:var(--err)">${ic('trash')} Reset everything</button></div></section>

    <section class="panel st-card"><h2>${ic('keyboard')} Keyboard shortcuts</h2>
      <ul class="kbd-list"><li><span>Run code</span><span><kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd></span></li><li><span>Save a snippet</span><span><kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>S</kbd></span></li><li><span>Toggle comment</span><span><kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>/</kbd></span></li><li><span>Leave the editor</span><span><kbd>Esc</kbd> then <kbd>Tab</kbd></span></li></ul></section>
  </div>`;
  main.querySelectorAll('.theme-opt').forEach(b => b.onclick = () => { setTheme(b.dataset.t); render(); });
  document.getElementById('mascot').onchange = e => { setSetting('mascot', e.target.checked); render(); };
  const m = document.getElementById('motion'); if (m) m.onchange = e => { setSetting('motion', e.target.checked); render(); };
  document.getElementById('exp').onclick = () => {
    const data = {}; KEYS.forEach(k => { const v = store.get(k, undefined); if (v !== undefined) data[k] = v; });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([JSON.stringify({ app: 'jsverse', v: 2, data }, null, 2)], { type: 'application/json' })), download: 'jsverse-progress.json' });
    a.click(); URL.revokeObjectURL(a.href); toast({ title: 'Progress exported', sub: 'Keep the file somewhere safe.' });
  };
  document.getElementById('imp').onchange = async e => {
    try { const j = JSON.parse(await e.target.files[0].text()); if (j.app !== 'jsverse') throw 0; Object.entries(j.data).forEach(([k, v]) => KEYS.includes(k) && store.set(k, v)); toast({ title: 'Progress imported', sub: 'Reloading…' }); setTimeout(() => location.reload(), 700); }
    catch { toast({ title: 'That file did not work', sub: 'Choose a JSVERSE export (.json).' }); }
  };
  document.getElementById('rst').onclick = () => { if (confirm('Erase ALL JSVERSE data in this browser, including saved snippets and settings?')) { KEYS.forEach(k => store.set(k, null)); location.reload(); } };
}
render();
