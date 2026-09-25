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

  /* ---------- "design it," - liquid colour: blobs wander freely, palettes drift from pair to pair ---------- */
  const liq = document.querySelector('.hero__title .lt');
  if (liq && !reduced) {
    const PAIRS = [
      ['#7B5CFF', '#2ED3F2'], // violet · cyan
      ['#FF5FA2', '#FF9F43'], // pink · amber
      ['#3B82F6', '#2DD4BF'], // blue · teal
      ['#D946EF', '#6366F1'], // magenta · indigo
      ['#FB7185', '#A78BFA'], // coral · lavender
      ['#22D3EE', '#818CF8'], // aqua · periwinkle
    ];
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const css = ([r, g, b]) => `rgb(${r},${g},${b})`;
    const ease = (t) => t * t * (3 - 2 * t);
    const rnd = (a, b) => a + Math.random() * (b - a);

    // each blob sums two slow sines with random frequencies and phases: it never repeats a path
    const blobs = [1, 2, 3].map(() => ({
      fx: [rnd(.32, .62), rnd(.11, .26)], fy: [rnd(.36, .7), rnd(.13, .3)],
      px: [rnd(0, 7), rnd(0, 7)], py: [rnd(0, 7), rnd(0, 7)],
    }));
    let from = Math.floor(Math.random() * PAIRS.length), to = (from + 1 + Math.floor(Math.random() * (PAIRS.length - 1))) % PAIRS.length;
    const HOLD = 5200, BLEND = 2600; // ms on a pair, ms to melt into the next
    let t0 = performance.now(), running = true, raf = 0;

    const frame = (now) => {
      raf = 0;
      if (!running) return;
      const s = now / 1000;
      blobs.forEach((b, i) => {
        const x = 50 + 30 * Math.sin(s * b.fx[0] + b.px[0]) + 22 * Math.sin(s * b.fx[1] + b.px[1]);
        const y = 50 + 34 * Math.sin(s * b.fy[0] + b.py[0]) + 24 * Math.sin(s * b.fy[1] + b.py[1]);
        liq.style.setProperty(`--lx${i + 1}`, x.toFixed(2) + '%');
        liq.style.setProperty(`--ly${i + 1}`, y.toFixed(2) + '%');
      });
      let e = now - t0;
      if (e > HOLD + BLEND) {
        from = to;
        do { to = Math.floor(Math.random() * PAIRS.length); } while (to === from);
        t0 = now; e = 0;
      }
      const k = e < HOLD ? 0 : ease((e - HOLD) / BLEND);
      const A = PAIRS[from], B = PAIRS[to];
      liq.style.setProperty('--pa', css(mix(hex(A[0]), hex(B[0]), k)));
      liq.style.setProperty('--pb', css(mix(hex(A[1]), hex(B[1]), k)));
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf && running) raf = requestAnimationFrame(frame); };
    // only animate while the headline is on screen and the tab is visible
    new IntersectionObserver(([e]) => { running = e.isIntersecting && !document.hidden; start(); }).observe(liq);
    document.addEventListener('visibilitychange', () => { running = !document.hidden; start(); });
    start();
  }

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
