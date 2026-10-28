// 作品集交互：开场、滚动进场与揭幕、数字滚动、首屏图纸网格、翻牌字、移动端菜单
// 图纸网格移植自 react-bits CursorGrid，翻牌字移植自 react-bits SplitFlapText，都是零依赖原生实现
// react-bits: Copyright (c) 2026 David Haz，MIT + Commons Clause，许可证全文见 THIRD_PARTY_NOTICES.md
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- 开场：字体到位后标题从遮罩里升起，照片位揭幕，成就卡浮出 ----
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([fontsReady, new Promise(r => setTimeout(r, 1500))]).then(() => requestAnimationFrame(() => {
    root.classList.add('loaded');
    document.querySelector('.hero-media')?.classList.add('is-in');
  }));

  // ---- 数字滚动：HTML 里写的是终值（没有 JS 也对），进场时从 data-from（默认 0）滚到终值 ----
  const counters = [...document.querySelectorAll('[data-count]')];
  const fmt = el => v => v.toFixed(+(el.dataset.dec || 0));
  if (!reduced) counters.forEach(el => { el.textContent = fmt(el)(+(el.dataset.from || 0)); });
  const countUp = el => {
    const to = +el.dataset.count, from = +(el.dataset.from || 0), f = fmt(el);
    if (reduced) { el.textContent = f(to); return; }
    const t0 = performance.now(), d = 1500;
    const step = t => {
      const k = Math.min(1, (t - t0) / d);
      el.textContent = f(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // ---- 滚动进场：同组元素错开 80ms；图纸框和照片框同时揭掉纸面遮罩 ----
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const sibs = [...el.parentElement.children].filter(x => x.hasAttribute('data-reveal'));
    if (!reduced) {
      el.style.transitionDelay = `${Math.min(sibs.indexOf(el), 4) * 0.08}s`;
      // 进场完就清掉延迟，免得悬停动效也跟着慢半拍
      setTimeout(() => { el.style.transitionDelay = ''; }, 1400);
    }
    el.classList.add('in', 'is-in');
    el.querySelectorAll('[data-count]').forEach(countUp);
    io.unobserve(el);
  }), { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));

  // ---- 首屏图纸网格：40px 发丝线方格，鼠标经过的格子像被荧光笔涂过，点击荡开一圈 ----
  function cursorGrid(container, listenEl, o) {
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const ease = { linear: t => t, smooth: t => t * t * (3 - 2 * t), sharp: t => t * t * t }[o.falloff] || (t => t);
    const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
    const [sr, sg, sb] = rgb(o.color), [fr, fg, fb] = rgb(o.fillColor);
    let cols = 0, rows = 0, offX = 0, offY = 0, w = 0, h = 0;
    let alphas = new Float32Array(0), touched = new Float64Array(0);
    const pulses = [];
    let running = false, last = 0;

    const rebuild = () => {
      w = container.offsetWidth; h = container.offsetHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / o.cellSize) + 1;
      rows = Math.ceil(h / o.cellSize) + 1;
      offX = (w - cols * o.cellSize) / 2;            // 方格居中，两侧裁得一样多
      offY = (h - rows * o.cellSize) / 2;
      alphas = new Float32Array(cols * rows);
      touched = new Float64Array(cols * rows);
    };
    const center = i => [offX + (i % cols) * o.cellSize + o.cellSize / 2, offY + Math.floor(i / cols) * o.cellSize + o.cellSize / 2];

    // 半径内的格子按距离衰减点亮
    const energize = (x, y) => {
      const r = o.radius, now = performance.now();
      const c0 = Math.max(0, Math.floor((x - r - offX) / o.cellSize)), c1 = Math.min(cols - 1, Math.floor((x + r - offX) / o.cellSize));
      const r0 = Math.max(0, Math.floor((y - r - offY) / o.cellSize)), r1 = Math.min(rows - 1, Math.floor((y + r - offY) / o.cellSize));
      for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) {
        const i = rr * cols + cc, [cx, cy] = center(i), dist = Math.hypot(cx - x, cy - y);
        if (dist > r) continue;
        const level = ease(1 - dist / r) * o.maxOpacity;
        if (level > alphas[i]) { alphas[i] = level; touched[i] = now; } else if (level > 0) touched[i] = now;
      }
    };

    const draw = now => {
      const dt = Math.min(now - last, 50); last = now;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(${sr},${sg},${sb},${o.gridOpacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let c = 0; c <= cols; c++) { const x = Math.round(offX + c * o.cellSize) + 0.5; ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let r = 0; r <= rows; r++) { const y = Math.round(offY + r * o.cellSize) + 0.5; ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // 点击荡开的环：环经过的格子拉满
      for (let pi = pulses.length - 1; pi >= 0; pi--) {
        const p = pulses[pi], ringR = (now - p.t0) / 1000 * o.pulseSpeed, band = o.cellSize;
        if (ringR > Math.hypot(w, h)) { pulses.splice(pi, 1); continue; }
        const c0 = Math.max(0, Math.floor((p.x - ringR - band - offX) / o.cellSize)), c1 = Math.min(cols - 1, Math.floor((p.x + ringR + band - offX) / o.cellSize));
        const r0 = Math.max(0, Math.floor((p.y - ringR - band - offY) / o.cellSize)), r1 = Math.min(rows - 1, Math.floor((p.y + ringR + band - offY) / o.cellSize));
        for (let rr = r0; rr <= r1; rr++) for (let cc = c0; cc <= c1; cc++) {
          const i = rr * cols + cc, [cx, cy] = center(i);
          if (Math.abs(Math.hypot(cx - p.x, cy - p.y) - ringR) < band / 2 && o.maxOpacity > alphas[i]) { alphas[i] = o.maxOpacity; touched[i] = now; }
        }
      }

      let any = pulses.length > 0;
      const fade = dt / Math.max(o.fadeDuration, 16), half = o.cellSize / 2;
      for (let i = 0; i < alphas.length; i++) {
        let a = alphas[i];
        if (a <= 0) continue;
        if (now - touched[i] > o.holdTime) { a = Math.max(0, a - fade); alphas[i] = a; if (a <= 0) continue; }
        any = true;
        const [cx, cy] = center(i);
        const x = cx - half + 0.5, y = cy - half + 0.5, s = o.cellSize - 1;
        ctx.fillStyle = `rgba(${fr},${fg},${fb},${a * o.fillOpacity})`;
        ctx.fillRect(x, y, s, s);
        const g = ctx.createRadialGradient(cx, cy, half * 0.1, cx, cy, o.cellSize);
        g.addColorStop(0, `rgba(${sr},${sg},${sb},${a * o.strokeOpacity})`);
        g.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = o.lineWidth;
        ctx.strokeRect(x, y, s, s);
      }
      // 没有亮着的格子就停帧，静态方格留在画布上
      if (any) requestAnimationFrame(draw); else running = false;
    };
    const wake = () => { if (running) return; running = true; last = performance.now(); requestAnimationFrame(draw); };
    const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };

    new ResizeObserver(() => { rebuild(); wake(); }).observe(container);
    rebuild(); wake();
    if (reduced) return;
    listenEl.addEventListener('pointermove', e => { const [x, y] = local(e); energize(x, y); wake(); });
    listenEl.addEventListener('pointerdown', e => { const [x, y] = local(e); pulses.push({ x, y, t0: performance.now() }); wake(); });
  }

  const hero = document.querySelector('.hero');
  cursorGrid(hero.querySelector('.hero-grid'), hero, {
    cellSize: 40, radius: 130, falloff: 'smooth', holdTime: 380, fadeDuration: 900,
    color: '#2b2b2b', fillColor: '#fff388', gridOpacity: 0.075, maxOpacity: 1,
    fillOpacity: 0.78, strokeOpacity: 0.55, lineWidth: 1, pulseSpeed: 600,
  });

  // ---- 翻牌字：状态栏里轮换团队承接的项目方向，机械翻牌，呼应图纸风格 ----
  function splitFlap(el, o) {
    const words = el.dataset.words.split('|');
    const width = Math.max(...words.map(w => [...w].length));
    const phrases = words.map(w => { const a = [...w]; while (a.length < width) a.push(' '); return a; });
    const pool = [...new Set(words.join('').replace(/\s/g, ''))].join('') + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const sample = () => pool[Math.floor(Math.random() * pool.length)];
    const show = c => (c === ' ' ? ' ' : c);

    // 读屏只读完整的三句，翻牌本身不读
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = words.join('、');
    el.textContent = '';
    el.after(sr);
    el.setAttribute('aria-hidden', 'true');

    const tiles = phrases[0].map(ch => {
      const t = document.createElement('span');
      t.className = 'flap-tile';
      t.innerHTML = '<span class="flap-half flap-half--top"><span class="flap-char"></span></span><span class="flap-half flap-half--bottom"><span class="flap-char"></span></span>';
      const [top, bot] = t.querySelectorAll('.flap-char');
      top.textContent = bot.textContent = show(ch);
      el.appendChild(t);
      return { t, top, bot, cur: ch };
    });

    const leaf = (cls, ch) => {
      const n = document.createElement('span');
      n.className = `flap-leaf ${cls}`;
      n.innerHTML = '<span class="flap-char"></span>';
      n.firstChild.textContent = show(ch);
      return n;
    };
    // 一次翻页：上半张先露出新字，旧字的上半片向下翻，新字的下半片翻上来盖住旧字
    const flip = (tile, b) => {
      const a = tile.cur;
      tile.t.querySelectorAll('.flap-leaf').forEach(n => n.remove());
      tile.top.textContent = show(b);
      tile.bot.textContent = show(a);
      const front = leaf('flap-leaf--front', a), back = leaf('flap-leaf--back', b);
      tile.t.append(front, back);
      tile.cur = b;
      back.addEventListener('animationend', () => { tile.bot.textContent = show(b); front.remove(); back.remove(); }, { once: true });
    };

    let current = phrases[0], idx = 0;
    const animateTo = target => {
      if (reduced) {
        target.forEach((c, i) => { tiles[i].top.textContent = tiles[i].bot.textContent = show(c); tiles[i].cur = c; });
        current = target;
        return 0;
      }
      const plans = target
        .map((c, i) => (current[i] === c ? null : { i, seq: Array.from({ length: o.flips }, sample).concat(c), start: i * o.stagger, step: -1 }))
        .filter(Boolean);
      const total = plans.reduce((m, p) => Math.max(m, p.start + p.seq.length * o.flipMs), 0);
      const t0 = performance.now();
      const tick = now => {
        let more = false;
        for (const p of plans) {
          const raw = Math.floor((now - t0 - p.start) / o.flipMs);
          if (raw < 0) { more = true; continue; }
          const s = Math.min(raw, p.seq.length - 1);
          if (raw < p.seq.length) more = true;
          if (s !== p.step) { p.step = s; flip(tiles[p.i], p.seq[s]); }
        }
        if (more) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      current = target;
      return total;
    };
    const next = delay => setTimeout(() => {
      idx = (idx + 1) % phrases.length;
      next(o.cycleDelay + animateTo(phrases[idx]));
    }, delay);
    el.style.setProperty('--flip', `${o.flipMs / 1000}s`);
    // 减少动态效果时停在第一组词，不再轮换（规格：DISABLE LOOPS）
    if (!reduced) next(o.cycleDelay);
  }

  const flapEl = document.querySelector('.flap');
  if (flapEl) splitFlap(flapEl, { flips: 6, flipMs: 120, stagger: 50, cycleDelay: 2600 });

  // ---- 移动端菜单 ----
  const burger = document.querySelector('.burger');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
  };
  burger.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
})();
