/* Itamar Tuby — portfolio interactions. Deliberately small: theme, nav, reveal, menu. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  root.classList.remove('no-js');

  /* ---------- theme (the initial value is set inline in <head> to avoid a flash) ---------- */
  document.getElementById('themetoggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem('it-theme', next); } catch {}
    };
    if (document.startViewTransition && !reduced) document.startViewTransition(apply);
    else apply();
  });

  /* ---------- nav hairline once the page moves ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => nav.classList.toggle('is-stuck', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- mobile side menu ---------- */
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  const scrim  = document.getElementById('scrim');
  if (!burger || !drawer || !scrim) return;

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
      setTimeout(() => { if (!open) scrim.hidden = true; }, 300);
      lastFocus?.focus?.({ preventScroll: true });
    }
  };
  burger.addEventListener('click', () => setOpen(!open));
  scrim.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) setOpen(false); });
  matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
})();
