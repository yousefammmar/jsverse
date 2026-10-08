// Small motion toolkit: reveal-on-scroll, count-up numbers, confetti. All of it respects reduced-motion and the Settings toggle.
import { reducedMotion } from './settings.js';

let io;
/** Reveal elements with class .rv as they enter the viewport. */
export function observeReveal(root = document) {
  const els = [...root.querySelectorAll('.rv:not(.in)')];
  if (!els.length) return;
  if (reducedMotion() || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  io = io || new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  els.forEach(e => io.observe(e));
}
/** Animate an element's number from its current value to `to`. */
export function countUp(el, to, { ms = 900, from, fmt = v => Math.round(v).toLocaleString() } = {}) {
  const start = from ?? (parseFloat((el.dataset.v ?? el.textContent).replace(/[^\d.-]/g, '')) || 0);
  el.dataset.v = to;
  if (reducedMotion() || start === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = t => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(start + (to - start) * e); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
export function confetti(n = 46) {
  if (reducedMotion()) return;
  const cols = ['var(--mint)', 'var(--js)', 'var(--coral)', 'var(--violet)', 'var(--aqua)'];
  for (let i = 0; i < n; i++) {
    const c = document.createElement('i'); c.className = 'conf';
    c.style.cssText = `left:${Math.random() * 100}vw;background:${cols[i % cols.length]};animation-delay:${Math.random() * .35}s;--dx:${Math.random() * 240 - 120}px;--rot:${Math.random() * 720 - 360}deg`;
    document.body.append(c); setTimeout(() => c.remove(), 2700);
  }
}
/** Float little syntax symbols in a container (cheap CSS-only particles). */
export function floatSymbols(host, symbols = ['{}', '[]', '=>', '()', ';', '</>', '&&', '...'], n = 14) {
  host.querySelectorAll('.sym').forEach(e => e.remove());
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span'); s.className = 'sym'; s.setAttribute('aria-hidden', 'true'); s.textContent = symbols[i % symbols.length];
    s.style.cssText = `left:${Math.random() * 96}%;top:${Math.random() * 90}%;font-size:${14 + Math.random() * 26}px;--dur:${9 + Math.random() * 10}s;--del:${-Math.random() * 12}s;--c:${['var(--mint)', 'var(--js)', 'var(--violet)', 'var(--coral)'][i % 4]}`;
    host.append(s);
  }
}
