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

  /* ---------- glowing cursor trail ---------- */
  if (matchMedia('(pointer: fine)').matches) {
    const canvas = document.createElement('canvas');
    canvas.className = 'cursor-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const N = 16;
    const dots = Array.from({ length: N }, () => ({ x: -100, y: -100 }));
    let mx = -100, my = -100, visible = false, raf = 0;

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize, { passive: true });

    const palette = () => {
      const light = root.dataset.theme === 'light';
      return light
        ? { core: 'rgba(20,20,28,.55)', glow: 'rgba(40,40,48,.16)', soft: 'rgba(20,20,28,.12)' }
        : { core: 'rgba(255,255,255,.9)', glow: 'rgba(255,255,255,.22)', soft: 'rgba(255,255,255,.08)' };
    };

    const draw = () => {
      raf = 0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (!visible) return;

      // snappy head, soft chain behind
      dots[0].x += (mx - dots[0].x) * 0.42;
      dots[0].y += (my - dots[0].y) * 0.42;
      for (let i = 1; i < N; i++) {
        const ease = 0.32 - i * 0.008;
        dots[i].x += (dots[i - 1].x - dots[i].x) * ease;
        dots[i].y += (dots[i - 1].y - dots[i].y) * ease;
      }

      const c = palette();
      for (let i = N - 1; i >= 0; i--) {
        const t = 1 - i / N;
        const r = 2.2 + t * 9;
        const d = dots[i];

        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, r * 3.2);
        g.addColorStop(0, c.glow);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r * 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = i === 0 ? c.core : c.soft;
        ctx.globalAlpha = 0.25 + t * 0.75;
        ctx.arc(d.x, d.y, r * (i === 0 ? 0.55 : 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      const stillMoving =
        Math.hypot(mx - dots[0].x, my - dots[0].y) > 0.4 ||
        Math.hypot(dots[0].x - dots[N - 1].x, dots[0].y - dots[N - 1].y) > 1.5;
      if (stillMoving) raf = requestAnimationFrame(draw);
    };

    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!visible) {
        visible = true;
        for (const d of dots) { d.x = mx; d.y = my; }
      }
      kick();
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
      visible = false;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    });
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
