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

  /* ---------- neon cursor trail (onzero HeroNeonTrails stroke style) ---------- */
  if (matchMedia('(pointer: fine)').matches) {
    const canvas = document.createElement('canvas');
    canvas.className = 'cursor-trail';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // a fixed-length window sliding along the path the pointer draws: the head sits on the
    // cursor, the tail always advances, so a still pointer lets the trail drain into it
    const TRAIL_PX = 120;
    const DRAIN = 0.55; // px per ms
    const path = [];    // { x, y, d } — d is cumulative distance from the path start
    let w = 0, h = 0, raf = 0, head = 0, tail = 0, last = 0;

    const resize = () => {
      w = innerWidth; h = innerHeight;
      const dpr = Math.min(devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    addEventListener('resize', resize, { passive: true });

    const palette = () => root.dataset.theme === 'light'
      ? { r: 112, g: 52, b: 214, core: '108,40,220' }
      : { r: 150, g: 100, b: 255, core: '226,214,255' };

    /** Point at a given distance along the recorded path. */
    const pointAt = (d) => {
      for (let i = 1; i < path.length; i++) {
        if (d <= path[i].d) {
          const a = path[i - 1], b = path[i];
          const span = b.d - a.d || 1;
          const u = (d - a.d) / span;
          return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
        }
      }
      const end = path[path.length - 1];
      return { x: end.x, y: end.y };
    };

    const reset = () => {
      path.length = 0;
      head = tail = 0;
      ctx.clearRect(0, 0, w, h);
    };

    const draw = (now) => {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      if (path.length < 2) return;

      // the tail never waits: while the pointer moves it is pinned TRAIL_PX behind the head,
      // and the moment it stops it keeps closing the gap until the trail has drained away
      const dt = Math.min(now - last, 64);
      last = now;
      tail = Math.max(tail + DRAIN * dt, head - TRAIL_PX);
      if (tail >= head) { reset(); return; }

      // emit both ends plus every recorded corner in between, so a turn lands on its point
      const pts = [pointAt(tail)];
      for (const p of path) if (p.d > tail && p.d < head) pts.push(p);
      pts.push(pointAt(head));

      const from = pts[0], to = pts[pts.length - 1];
      const c = palette();

      const strokePath = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      };

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = Math.min(1, (head - tail) / TRAIL_PX);

      // soft neon glow — gradient fades along the length, tail (transparent) → head
      const gGlow = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gGlow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0)`);
      gGlow.addColorStop(0.55, `rgba(${c.r},${c.g},${c.b},0.28)`);
      gGlow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0.7)`);
      ctx.strokeStyle = gGlow;
      ctx.shadowColor = `rgb(${c.r},${c.g},${c.b})`;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;
      strokePath();

      // bright hot core
      const gCore = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gCore.addColorStop(0, `rgba(${c.core},0)`);
      gCore.addColorStop(0.6, `rgba(${c.core},0.5)`);
      gCore.addColorStop(1, `rgba(${c.core},0.95)`);
      ctx.strokeStyle = gCore;
      ctx.shadowBlur = 4;
      ctx.lineWidth = 1.2;
      strokePath();

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    const kick = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(draw);
    };

    addEventListener('pointermove', (e) => {
      const prev = path[path.length - 1];
      const step = prev ? Math.hypot(e.clientX - prev.x, e.clientY - prev.y) : 0;
      if (prev && step < 1.5) return;
      head += step;
      path.push({ x: e.clientX, y: e.clientY, d: head });
      // drop everything the tail has already passed
      while (path.length > 2 && path[1].d < tail) path.shift();
      kick();
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', reset);
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
  if (portrait) {
    addEventListener('scroll', () => {
      const y = Math.min(scrollY, 700);
      portrait.style.translate = `0 ${y * 0.06}px`;
    }, { passive: true });
  }
})();
