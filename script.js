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

    const TRAIL_PX = 90;
    const pts = [];
    let w = 0, h = 0, raf = 0, lastMove = 0;

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

    const trim = () => {
      let len = 0;
      for (let i = pts.length - 1; i > 0; i--) {
        len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
        if (len > TRAIL_PX) {
          pts.splice(0, i);
          break;
        }
      }
    };

    const palette = () => {
      // monochrome portfolio; same glow recipe as onzero (soft neon + hot core)
      if (root.dataset.theme === 'light') {
        return { r: 20, g: 20, b: 28, coreA: 'rgba(20,20,28,0)', coreB: 'rgba(20,20,28,0.45)', coreC: 'rgba(20,20,28,0.9)' };
      }
      return { r: 244, g: 244, b: 245, coreA: 'rgba(255,255,255,0)', coreB: 'rgba(255,255,255,0.55)', coreC: 'rgba(255,255,255,0.95)' };
    };

    const draw = () => {
      raf = 0;
      ctx.clearRect(0, 0, w, h);
      if (pts.length < 2) return;

      const tip = pts[pts.length - 1];
      const tail = pts[0];
      const c = palette();

      const strokePath = () => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      };

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // soft neon glow — gradient fades along the length, tail → head
      const gGlow = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y);
      gGlow.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0)`);
      gGlow.addColorStop(0.55, `rgba(${c.r},${c.g},${c.b},0.22)`);
      gGlow.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0.65)`);
      ctx.strokeStyle = gGlow;
      ctx.shadowColor = `rgb(${c.r},${c.g},${c.b})`;
      ctx.shadowBlur = 10;
      ctx.lineWidth = 2.6;
      strokePath();

      // bright hot core
      const gCore = ctx.createLinearGradient(tail.x, tail.y, tip.x, tip.y);
      gCore.addColorStop(0, c.coreA);
      gCore.addColorStop(0.6, c.coreB);
      gCore.addColorStop(1, c.coreC);
      ctx.strokeStyle = gCore;
      ctx.shadowBlur = 3;
      ctx.lineWidth = 1.1;
      strokePath();

      ctx.shadowBlur = 0;

      // fade out when idle
      if (performance.now() - lastMove > 40) {
        pts.shift();
        if (pts.length > 1) raf = requestAnimationFrame(draw);
        else ctx.clearRect(0, 0, w, h);
      }
    };

    const kick = () => { if (!raf) raf = requestAnimationFrame(draw); };

    addEventListener('pointermove', (e) => {
      const last = pts[pts.length - 1];
      if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 1.5) return;
      pts.push({ x: e.clientX, y: e.clientY });
      trim();
      lastMove = performance.now();
      kick();
    }, { passive: true });

    document.documentElement.addEventListener('mouseleave', () => {
      pts.length = 0;
      ctx.clearRect(0, 0, w, h);
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
  if (portrait) {
    addEventListener('scroll', () => {
      const y = Math.min(scrollY, 700);
      portrait.style.translate = `0 ${y * 0.06}px`;
    }, { passive: true });
  }
})();
