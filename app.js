// ALFO · página pública. Sin librerías: los enlaces y el texto funcionan aunque este archivo no cargue.

// ---- Visitas: avisa a ALFO Connect igual que la página anterior (visit, whatsapp, video) ----
const EVENT_URL = 'https://alfo-connect-production.up.railway.app/api/web/evento';
function sessionId() {
  try {
    let id = sessionStorage.getItem('alfo-sid');
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('alfo-sid', id); }
    return id;
  } catch { return 'sin-sesion-' + Date.now().toString(36); }
}
function track(type, label) {
  try {
    const q = new URLSearchParams(location.search);
    const utm = q.get('utm_source') || (q.has('fbclid') ? 'facebook' : q.has('gclid') ? 'google' : '');
    const body = JSON.stringify({ type, label, sessionId: sessionId(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone, lang: navigator.language, ref: document.referrer, utm, path: location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon(EVENT_URL, new Blob([body], { type: 'text/plain' }));
    else fetch(EVENT_URL, { method: 'POST', body, keepalive: true, mode: 'no-cors' });
  } catch { /* nunca molestar al visitante */ }
}
track('visit');
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-track]');
  if (a) track('whatsapp', a.dataset.track);
});

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// ---- Portada: entrada escalonada (transitions.dev · texts reveal) ----
requestAnimationFrame(() => document.querySelector('.hero .t-stagger')?.classList.add('is-shown'));

// ---- Videos: uno a la vez; el primero arranca en silencio al aparecer ----
(() => {
  const clips = [...document.querySelectorAll('#fila-videos .clip')];
  if (!clips.length) return;
  const videos = clips.map((c) => c.querySelector('video'));
  clips.forEach((c, k) => {
    let told = false;
    videos[k].addEventListener('play', () => {
      videos.forEach((v, j) => { if (j !== k && !v.paused) v.pause(); });
      if (!told) { told = true; track('video', c.dataset.label); }
    });
  });
  if (!reduced.matches && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e], io) => {
      if (e.isIntersecting) { videos[0].play().catch(() => {}); io.disconnect(); }
    }, { threshold: 0.6 }).observe(videos[0]);
  }
})();

// ---- Videos: se inclinan hacia el puntero (transitions.dev · card hover tilt), solo con mouse ----
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const MAX = 8;
  document.querySelectorAll('.t-tilt').forEach((tilt) => {
    const card = tilt.querySelector('.t-tilt-card');
    function reset() {
      tilt.classList.remove('is-hover');
      card.classList.remove('is-tilting');
      card.style.setProperty('--tilt-rx', '0deg');
      card.style.setProperty('--tilt-ry', '0deg');
    }
    function follow(e) {
      if (reduced.matches) return;
      const r = tilt.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      tilt.classList.add('is-hover');
      card.classList.add('is-tilting');
      card.style.setProperty('--tilt-ry', ((px - 0.5) * MAX).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-rx', ((0.5 - py) * MAX).toFixed(2) + 'deg');
      card.style.setProperty('--tilt-gx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--tilt-gy', (py * 100).toFixed(1) + '%');
    }
    tilt.addEventListener('pointermove', follow);
    tilt.addEventListener('pointerleave', reset);
  });
})();

// ---- Preguntas (transitions.dev · accordion): una abierta a la vez ----
(() => {
  const items = [...document.querySelectorAll('.t-acc')];
  items.forEach((acc) => {
    const head = acc.querySelector('.t-acc-head');
    head.addEventListener('click', () => {
      const open = acc.getAttribute('data-open') === 'true';
      items.forEach((other) => { other.setAttribute('data-open', 'false'); other.querySelector('.t-acc-head').setAttribute('aria-expanded', 'false'); });
      acc.setAttribute('data-open', String(!open));
      head.setAttribute('aria-expanded', String(!open));
    });
  });
})();

// ---- Menú del teléfono (transitions.dev · menu dropdown) ----
(() => {
  const btn = document.querySelector('.menu__btn');
  const list = document.getElementById('menu-lista');
  if (!btn || !list) return;
  const closeMs = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dropdown-close-dur')) || 150;
  const isOpen = () => list.classList.contains('is-open');
  function open() { list.classList.remove('is-closing'); list.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
  function close() {
    if (!isOpen()) return;
    list.classList.remove('is-open'); list.classList.add('is-closing'); btn.setAttribute('aria-expanded', 'false');
    setTimeout(() => list.classList.remove('is-closing'), closeMs);
  }
  btn.addEventListener('click', () => (isOpen() ? close() : open()));
  list.querySelectorAll('a').forEach((a) => a.addEventListener('click', close));
  document.addEventListener('click', (e) => { if (!e.target.closest('.menu')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
})();

// ---- El botón flotante se aparta cuando la portada, el contacto o el pie ya muestran su propio botón ----
(() => {
  const btn = document.querySelector('.wa-float');
  const zones = [document.querySelector('.hero__actions'), document.querySelector('.contact'), document.querySelector('.foot')].filter(Boolean);
  if (!btn || !('IntersectionObserver' in window)) return;
  const seen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
    btn.classList.toggle('is-hidden', seen.size > 0);
  }, { threshold: 0.15 });
  zones.forEach((z) => io.observe(z));
})();
