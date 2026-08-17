/* Itamar Tuby — portfolio interactions */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- theme ---------- */
  const root = document.documentElement;
  const saved = localStorage.getItem('it-theme');
  if (saved) root.dataset.theme = saved;
  else if (matchMedia('(prefers-color-scheme: light)').matches) root.dataset.theme = 'light';

  document.getElementById('themetoggle').addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    const apply = () => { root.dataset.theme = next; localStorage.setItem('it-theme', next); };
    // View Transitions where supported; plain swap everywhere else
    if (document.startViewTransition && !reduced) document.startViewTransition(apply);
    else apply();
  });

  /* ---------- sticky nav ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 12);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));


  /* ---------- mobile side menu ---------- */
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  const scrim  = document.getElementById('scrim');

  if (burger && drawer && scrim) {
    let open = false;
    let lastFocus = null;

    const setOpen = (next) => {
      if (next === open) return;
      open = next;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('aria-hidden', String(!open));
      drawer.classList.toggle('is-open', open);
      document.body.classList.toggle('is-locked', open);

      if (open) {
        lastFocus = document.activeElement;
        scrim.hidden = false;
        requestAnimationFrame(() => scrim.classList.add('is-open'));
        drawer.removeAttribute('inert');
        drawer.querySelector('a')?.focus({ preventScroll: true });
      } else {
        scrim.classList.remove('is-open');
        drawer.setAttribute('inert', '');
        setTimeout(() => { if (!open) scrim.hidden = true; }, 350);
        lastFocus?.focus?.({ preventScroll: true });
      }
    };

    burger.addEventListener('click', () => setOpen(!open));
    scrim.addEventListener('click', () => setOpen(false));
    drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
    // a resize past the breakpoint should never leave the page locked
    matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
  }

  if (reduced) return;

  /* ---------- hero spotlight follows the pointer ---------- */
  const hero = document.querySelector('.hero');
  const spot = document.querySelector('.hero__spot');
  let raf = 0, tx = 60, ty = 30, cx = 60, cy = 30;

  hero.addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width) * 100;
    ty = ((e.clientY - r.top) / r.height) * 100;
    if (!raf) raf = requestAnimationFrame(tick);
  });
  hero.addEventListener('pointerleave', () => { tx = 60; ty = 30; if (!raf) raf = requestAnimationFrame(tick); });

  function tick() {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    spot.style.setProperty('--mx', cx + '%');
    spot.style.setProperty('--my', cy + '%');
    raf = (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) ? requestAnimationFrame(tick) : 0;
  }

  /* ---------- magnetic buttons ---------- */
  document.querySelectorAll('.magnetic').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left - r.width / 2;
      const my = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${mx * 0.18}px, ${my * 0.28}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- portrait parallax ---------- */
  const portrait = document.querySelector('.hero__still');
  addEventListener('scroll', () => {
    const y = Math.min(scrollY, 700);
    portrait.style.translate = `0 ${y * 0.06}px`;
  }, { passive: true });
})();
