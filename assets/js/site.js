// Aidan Hall, personal site. Vanilla JS, no dependencies, no build step.
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } },
  };

  /* ---------- Theme ---------- */
  const currentTheme = () => root.dataset.theme || (darkQuery.matches ? 'dark' : 'light');

  function setTheme(next, origin) {
    const apply = () => {
      root.dataset.theme = next;
      store.set('theme', next);
      document.dispatchEvent(new CustomEvent('themechange'));
    };
    if (!document.startViewTransition || reduceMotion.matches) return apply();

    const x = origin ? origin.x : innerWidth - 40;
    const y = origin ? origin.y : 32;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('vt-theme');
    const t = document.startViewTransition(apply);
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
    t.finished.finally(() => root.classList.remove('vt-theme'));
  }

  function toggleTheme(origin) {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark', origin);
  }

  const themeBtn = $('#theme-toggle');
  themeBtn?.addEventListener('click', (e) => {
    const b = themeBtn.getBoundingClientRect();
    toggleTheme({ x: e.clientX || b.left + b.width / 2, y: e.clientY || b.top + b.height / 2 });
  });
  darkQuery.addEventListener?.('change', () => document.dispatchEvent(new CustomEvent('themechange')));

  /* ---------- Small details ---------- */
  $$('[data-mod-key]').forEach((k) => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  $$('[data-year]').forEach((y) => { y.textContent = new Date().getFullYear(); });

  /* ---------- Nav: border on scroll, active section ---------- */
  const nav = $('#nav');
  const onScroll = () => nav?.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = new Map($$('.nav__links a').map((a) => [a.getAttribute('href').slice(1), a]));
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.remove('is-active'));
      navLinks.get(e.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => sectionObserver.observe(s));

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealObserver.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  // Stagger siblings that enter together.
  $$('.hero .reveal').forEach((el, i) => el.style.setProperty('--d', `${i * 70}ms`));
  $$('.projects .reveal, .highlights .reveal').forEach((el, i) => el.style.setProperty('--d', `${(i % 3) * 70}ms`));
  $$('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------- Card spotlight ---------- */
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.spot');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  /* ---------- Count-up metrics ---------- */
  function countUp(el) {
    const node = [...el.childNodes].find((n) => n.nodeType === 3 && /\d/.test(n.textContent));
    if (!node) return;
    const original = node.textContent;
    const m = original.match(/[\d,]*\.?\d+/);
    if (!m) return;
    const raw = m[0];
    const target = parseFloat(raw.replace(/,/g, ''));
    const decimals = (raw.split('.')[1] || '').length;
    const commas = raw.includes(',');
    const fmt = (v) => {
      const s = v.toFixed(decimals);
      return commas ? Number(s).toLocaleString('en-US', { minimumFractionDigits: decimals }) : s;
    };
    const start = performance.now();
    const dur = 1100;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = original.replace(raw, fmt(target * eased));
      if (p < 1) requestAnimationFrame(tick);
      else node.textContent = original;
    };
    requestAnimationFrame(tick);
  }
  if (!reduceMotion.matches) {
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countUp(e.target);
        countObserver.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach((el) => countObserver.observe(el));
  }

  /* ---------- Hero dot field ---------- */
  function heroField() {
    const canvas = $('.hero__field');
    if (!canvas) return;
    const hero = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const GAP = 22;
    const LEVELS = 10;
    let w = 0, h = 0, dpr = 1, dotRGB = '17,17,19', accentRGB = '31,95,209';
    let running = false, visible = true, raf = 0;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999 };
    const t0 = performance.now();

    const readColors = () => {
      const cs = getComputedStyle(root);
      dotRGB = cs.getPropertyValue('--dot-rgb').trim() || dotRGB;
      accentRGB = cs.getPropertyValue('--accent-rgb').trim() || accentRGB;
    };

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = hero.clientWidth;
      h = hero.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
    };

    function draw(now) {
      const t = (now - t0) / 1000;
      mouse.x += (mouse.tx - mouse.x) * 0.14;
      mouse.y += (mouse.ty - mouse.y) * 0.14;
      ctx.clearRect(0, 0, w, h);

      const buckets = Array.from({ length: LEVELS }, () => []);
      const hot = [];
      const cols = Math.ceil(w / GAP) + 1;
      const rows = Math.ceil(h / GAP) + 1;
      const ox = (w % GAP) / 2;
      const R2 = 130 * 130;

      for (let i = 0; i < cols; i++) {
        const x = ox + i * GAP;
        for (let j = 0; j < rows; j++) {
          const y = j * GAP;
          const wave = Math.sin(x * 0.011 + t * 0.7) * Math.cos(y * 0.015 - t * 0.5) * 0.5 + 0.5;
          const dx = x - mouse.x, dy = y - mouse.y;
          const d2 = dx * dx + dy * dy;
          const near = d2 < R2 * 4 ? Math.exp(-d2 / (2 * R2 * 0.35)) : 0;
          if (near > 0.08) hot.push(x, y, near);
          const level = Math.min(LEVELS - 1, Math.floor(wave * LEVELS));
          buckets[level].push(x, y);
        }
      }

      ctx.fillStyle = `rgb(${dotRGB})`;
      for (let l = 0; l < LEVELS; l++) {
        const pts = buckets[l];
        if (!pts.length) continue;
        ctx.globalAlpha = 0.07 + (l / LEVELS) * 0.17;
        const r = 0.8 + (l / LEVELS) * 0.55;
        ctx.beginPath();
        for (let k = 0; k < pts.length; k += 2) {
          ctx.moveTo(pts[k] + r, pts[k + 1]);
          ctx.arc(pts[k], pts[k + 1], r, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      if (hot.length) {
        ctx.fillStyle = `rgb(${accentRGB})`;
        for (let k = 0; k < hot.length; k += 3) {
          const n = hot[k + 2];
          ctx.globalAlpha = Math.min(0.9, n * 0.95);
          ctx.beginPath();
          ctx.arc(hot[k], hot[k + 1], 1 + n * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    const loop = (now) => {
      draw(now);
      raf = running ? requestAnimationFrame(loop) : 0;
    };
    const start = () => {
      if (running || reduceMotion.matches || !visible || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = hero.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
      if (mouse.x < -1000) { mouse.x = mouse.tx; mouse.y = mouse.ty; }
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.tx = mouse.ty = -9999; });

    new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    document.addEventListener('themechange', () => { readColors(); draw(performance.now()); });
    reduceMotion.addEventListener?.('change', () => (reduceMotion.matches ? stop() : start()));
    new ResizeObserver(resize).observe(hero);

    readColors();
    resize();
    start();
  }
  heroField();

  /* ---------- Live status: App Store and PyPI ---------- */
  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  function ago(iso) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 30) return `${days} days ago`;
    return fmtDate(iso);
  }

  async function liveStatus() {
    const KEY = 'live-status-v1';
    const setAll = (name, value) => $$(`[data-live="${name}"]`).forEach((el) => { el.textContent = value; });
    const state = $('[data-live-state]');

    const apply = (data, fromCache) => {
      if (data.app) {
        setAll('app-version', `v${data.app.v}`);
        setAll('app-date', ago(data.app.d));
      }
      if (data.py) {
        setAll('py-version', `v${data.py.v}`);
        setAll('py-date', ago(data.py.d));
      }
      const ok = data.app || data.py;
      if (ok) {
        const time = new Date(data.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        setAll('foot', `read live from App Store and PyPI, ${time}${fromCache ? ' (cached)' : ''}`);
      } else {
        state?.classList.add('is-cached');
        if (state) state.lastChild.textContent = 'cached';
        setAll('foot', 'showing last known versions');
      }
    };

    let cached = null;
    try { cached = JSON.parse(sessionStorage.getItem(KEY)); } catch { /* ignore */ }
    if (cached && Date.now() - cached.at < 20 * 60 * 1000) return apply(cached, true);

    const timeout = () => (AbortSignal.timeout ? { signal: AbortSignal.timeout(7000) } : {});
    const getJSON = (url) => fetch(url, timeout()).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });

    const [app, py] = await Promise.allSettled([
      getJSON('https://itunes.apple.com/lookup?id=6800819435&country=us'),
      getJSON('https://pypi.org/pypi/marrow-mcp/json'),
    ]);

    const data = { at: Date.now() };
    const a = app.status === 'fulfilled' && app.value.results && app.value.results[0];
    if (a && a.version) data.app = { v: a.version, d: a.currentVersionReleaseDate || a.releaseDate };
    const p = py.status === 'fulfilled' && py.value.info;
    if (p && p.version) {
      const files = py.value.urls || [];
      data.py = { v: p.version, d: (files[0] && files[0].upload_time_iso_8601) || new Date().toISOString() };
    }
    try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
    apply(data, false);
  }
  liveStatus().catch(() => {});

  /* ---------- Screenshot gallery ---------- */
  const track = $('.gallery__track');
  if (track) {
    const [prev, next] = $$('[data-gallery]');
    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max;
      track.classList.toggle('at-end', track.scrollLeft >= max);
    };
    $$('[data-gallery]').forEach((b) => b.addEventListener('click', () => {
      track.scrollBy({ left: Number(b.dataset.gallery) * track.clientWidth * 0.8, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }));
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update, { passive: true });
    update();
  }

  /* ---------- Architecture diagram wires ---------- */
  function archWires() {
    const grid = $('#arch');
    if (!grid) return;
    const svg = $('.arch__wires', grid);
    const NS = 'http://www.w3.org/2000/svg';
    const edges = [
      ['phone', 'core'], ['watch', 'core'], ['widgets', 'core'],
      ['core', 'mcp'], ['core', 'connect'], ['core', 'vision'], ['core', 'menus'],
      ['mcp', 'agents'], ['connect', 'agents'],
    ];
    let anims = [];
    let onScreen = true;

    const el = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      return n;
    };

    function draw() {
      anims.forEach((a) => a.cancel());
      anims = [];
      svg.replaceChildren();
      if (getComputedStyle(svg).display === 'none') return;
      const g = grid.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);

      edges.forEach(([a, b], i) => {
        const A = $(`[data-node="${a}"]`, grid).getBoundingClientRect();
        const B = $(`[data-node="${b}"]`, grid).getBoundingClientRect();
        const x1 = A.right - g.left, y1 = A.top + A.height / 2 - g.top;
        const x2 = B.left - g.left, y2 = B.top + B.height / 2 - g.top;
        const c = (x2 - x1) * 0.55;
        const d = `M${x1},${y1} C${x1 + c},${y1} ${x2 - c},${y2} ${x2},${y2}`;
        const base = el('path', { d, class: 'wire', 'data-a': a, 'data-b': b });
        const pulse = el('path', { d, class: 'wire wire--pulse', 'data-a': a, 'data-b': b });
        svg.append(base, pulse, el('circle', { cx: x2, cy: y2, r: 2.5, class: 'wire-end' }));

        const len = pulse.getTotalLength();
        const dash = 16;
        pulse.style.strokeDasharray = `${dash} ${len + dash}`;
        if (reduceMotion.matches) { pulse.style.opacity = '0'; return; }
        pulse.style.strokeDashoffset = `${dash}`;
        const anim = pulse.animate(
          [{ strokeDashoffset: dash }, { strokeDashoffset: -len }],
          { duration: 1500 + len * 4, delay: i * 220, iterations: Infinity, easing: 'cubic-bezier(.45,0,.25,1)' }
        );
        if (!onScreen) anim.pause();
        anims.push(anim);
      });
    }

    const trace = (id) => {
      grid.classList.toggle('is-tracing', !!id);
      $$('.node', grid).forEach((n) => n.classList.remove('is-hot'));
      $$('.wire', svg).forEach((w) => {
        const hit = id && (w.dataset.a === id || w.dataset.b === id);
        w.classList.toggle('is-hot', !!hit);
        if (hit) {
          $(`[data-node="${w.dataset.a}"]`, grid).classList.add('is-hot');
          $(`[data-node="${w.dataset.b}"]`, grid).classList.add('is-hot');
        }
      });
    };
    grid.addEventListener('pointerover', (e) => trace(e.target.closest('.node')?.dataset.node));
    grid.addEventListener('pointerleave', () => trace(null));
    grid.addEventListener('focusin', (e) => trace(e.target.closest('.node')?.dataset.node));
    grid.addEventListener('focusout', () => trace(null));

    new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      anims.forEach((a) => (onScreen ? a.play() : a.pause()));
    }).observe(grid);

    let pending = 0;
    new ResizeObserver(() => {
      cancelAnimationFrame(pending);
      pending = requestAnimationFrame(draw);
    }).observe(grid);
    document.fonts?.ready.then(draw);
  }
  archWires();

  /* ---------- Project filters ---------- */
  const chips = $$('[data-filter]');
  const projects = $$('.project');
  chips.forEach((chip) => {
    const f = chip.dataset.filter;
    const n = f === 'all' ? projects.length : projects.filter((p) => p.dataset.tags.split(' ').includes(f)).length;
    const badge = document.createElement('span');
    badge.className = 'chip__n';
    badge.textContent = n;
    chip.append(badge);

    chip.addEventListener('click', () => {
      if (chip.getAttribute('aria-pressed') === 'true') return;
      const apply = () => {
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        projects.forEach((p) => {
          p.hidden = f !== 'all' && !p.dataset.tags.split(' ').includes(f);
          p.classList.add('in');
        });
      };
      if (!document.startViewTransition || reduceMotion.matches) return apply();
      projects.forEach((p, i) => { p.style.viewTransitionName = `project-${i}`; });
      const t = document.startViewTransition(apply);
      t.finished.finally(() => projects.forEach((p) => { p.style.viewTransitionName = ''; }));
    });
  });

  /* ---------- Command palette ---------- */
  const dialog = $('#cmdk');
  const input = $('.cmdk__input', dialog);
  const list = $('#cmdk-list');

  const flash = (target) => {
    target.classList.remove('is-flash');
    void target.offsetWidth;
    target.classList.add('is-flash');
  };
  const goTo = (target) => {
    if (!target) return;
    if (target.hidden) $('[data-filter="all"]')?.click();
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: target.matches('section') ? 'start' : 'center' });
    if (!target.matches('section')) setTimeout(() => flash(target), 350);
  };

  const commands = [
    { group: 'Sections', label: 'Marrow Health', hint: '01', icon: 'hash', run: () => goTo($('#marrow')) },
    { group: 'Sections', label: 'Experience', hint: '02', icon: 'hash', run: () => goTo($('#experience')) },
    { group: 'Sections', label: 'Projects', hint: '03', icon: 'hash', run: () => goTo($('#projects')) },
    { group: 'Sections', label: 'About, education and skills', hint: '04', icon: 'hash', run: () => goTo($('#about')) },
    { group: 'Sections', label: 'Contact', hint: '05', icon: 'hash', run: () => goTo($('#contact')) },
    ...$$('[data-cmdk]').map((el) => ({
      group: el.dataset.cmdkGroup, label: el.dataset.cmdk, icon: el.matches('.project') ? 'box' : 'brief', run: () => goTo(el),
    })),
    { group: 'Links', label: 'Resume (PDF)', icon: 'file', href: 'Aidan_Hall_Resume.pdf' },
    { group: 'Links', label: 'GitHub', hint: 'DukeAidanHall', icon: 'github', href: 'https://github.com/DukeAidanHall' },
    { group: 'Links', label: 'LinkedIn', hint: 'hallaidan', icon: 'linkedin', href: 'https://www.linkedin.com/in/hallaidan' },
    { group: 'Links', label: 'Marrow on the App Store', icon: 'arrow', href: 'https://apps.apple.com/us/app/marrow-health-calorie-counter/id6800819435' },
    { group: 'Links', label: 'marrowhealthapp.com', icon: 'arrow', href: 'https://marrowhealthapp.com/' },
    { group: 'Links', label: 'marrow-mcp source code', icon: 'github', href: 'https://github.com/skeletonarmytech/marrow-mcp' },
    { group: 'Links', label: 'ClassPulse on Devpost', icon: 'arrow', href: 'https://devpost.com/software/classpulse-tj0s2p' },
    { group: 'Actions', label: 'Toggle light and dark theme', hint: 't', icon: 'sun', run: () => toggleTheme() },
    { group: 'Actions', label: 'Copy link to this site', icon: 'link', run: () => navigator.clipboard?.writeText('https://dukeaidanhall.github.io/') },
    { group: 'Actions', label: 'View the source of this site', icon: 'github', href: 'https://github.com/DukeAidanHall/DukeAidanHall.github.io' },
  ];

  let results = [];
  let active = 0;

  // Subsequence fuzzy match. Returns a score (higher is better) and matched indexes.
  function match(query, text) {
    if (!query) return { score: 0, hits: [] };
    const q = query.toLowerCase(), t = text.toLowerCase();
    const direct = t.indexOf(q);
    if (direct >= 0) {
      const wordStart = direct === 0 || /\W/.test(t[direct - 1]);
      return { score: 100 - direct + (wordStart ? 40 : 0), hits: [...Array(q.length)].map((_, i) => direct + i) };
    }
    const hits = [];
    let ti = 0;
    for (const ch of q) {
      ti = t.indexOf(ch, ti);
      if (ti < 0) return null;
      hits.push(ti++);
    }
    const spread = hits[hits.length - 1] - hits[0];
    return { score: 40 - spread, hits };
  }

  const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const highlight = (text, hits) => {
    const set = new Set(hits);
    return [...text].map((ch, i) => (set.has(i) ? `<mark>${escapeHTML(ch)}</mark>` : escapeHTML(ch))).join('');
  };

  function render() {
    const q = input.value.trim();
    results = commands
      .map((c) => ({ c, m: match(q, `${c.label} ${c.hint || ''}`) }))
      .filter((r) => r.m)
      .sort((a, b) => (q ? b.m.score - a.m.score : 0));
    active = Math.min(active, Math.max(0, results.length - 1));

    list.replaceChildren();
    if (!results.length) {
      const li = document.createElement('li');
      li.className = 'cmdk__empty';
      li.textContent = 'Nothing matches. Try "marrow", "resume" or "github".';
      list.append(li);
      input.removeAttribute('aria-activedescendant');
      return;
    }
    let lastGroup = null;
    results.forEach(({ c, m }, i) => {
      if (!q && c.group !== lastGroup) {
        const g = document.createElement('li');
        g.className = 'cmdk__group';
        g.setAttribute('role', 'presentation');
        g.textContent = c.group;
        list.append(g);
        lastGroup = c.group;
      }
      const li = document.createElement('li');
      li.className = 'cmdk__item';
      li.id = `cmdk-opt-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === active));
      const hits = m.hits.filter((h) => h < c.label.length);
      const hint = q ? c.group : (c.hint || (c.href && c.href.startsWith('http') ? new URL(c.href).hostname.replace('www.', '') : ''));
      li.innerHTML = `<svg class="ico" aria-hidden="true"><use href="#i-${c.icon}"/></svg><span>${highlight(c.label, hits)}</span><span class="hint">${escapeHTML(hint || '')}</span>`;
      li.addEventListener('pointermove', () => { if (active !== i) { active = i; paint(); } });
      li.addEventListener('click', () => execute(i));
      list.append(li);
    });
    paint();
  }

  function paint() {
    $$('.cmdk__item', list).forEach((li, i) => li.setAttribute('aria-selected', String(i === active)));
    const cur = $(`#cmdk-opt-${active}`);
    if (cur) {
      input.setAttribute('aria-activedescendant', cur.id);
      cur.scrollIntoView({ block: 'nearest' });
    }
  }

  function execute(i) {
    const r = results[i];
    if (!r) return;
    closePalette();
    const { c } = r;
    if (c.href) {
      if (c.href.startsWith('http') || c.href.endsWith('.pdf')) window.open(c.href, '_blank', 'noopener');
      else location.href = c.href;
    } else {
      setTimeout(() => c.run(), 60);
    }
  }

  let lastFocus = null;
  function openPalette() {
    if (!dialog || dialog.open) return;
    lastFocus = document.activeElement;
    input.value = '';
    active = 0;
    render();
    dialog.showModal();
    input.focus();
  }
  function closePalette() {
    if (dialog?.open) dialog.close();
  }
  dialog?.addEventListener('close', () => lastFocus?.focus?.({ preventScroll: true }));
  dialog?.addEventListener('click', (e) => { if (e.target === dialog) closePalette(); });
  input?.addEventListener('input', () => { active = 0; render(); });
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % Math.max(1, results.length); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + results.length) % Math.max(1, results.length); paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); execute(active); }
  });
  $$('[data-cmdk-open]').forEach((b) => b.addEventListener('click', openPalette));

  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog?.open ? closePalette() : openPalette();
    } else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.key === '/') { e.preventDefault(); openPalette(); }
      else if (e.key === 't' && !dialog?.open) toggleTheme();
    }
  });

  /* ---------- Contact form (EmailJS, loaded on first use) ---------- */
  const form = $('#contact-form');
  if (form) {
    const status = $('.form__status', form);
    const EMAILJS = { publicKey: 'WrKF1vTCKTatSA0dL', service: 'service_b65aei9', template: 'template_hizd0pa' };
    let sdk = null;
    const loadSDK = () => sdk || (sdk = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = () => { window.emailjs.init({ publicKey: EMAILJS.publicKey }); resolve(window.emailjs); };
      s.onerror = () => { sdk = null; reject(new Error('EmailJS failed to load')); };
      document.head.append(s);
    }));
    form.addEventListener('focusin', () => loadSDK().catch(() => {}), { once: true });

    const say = (msg, kind) => {
      status.textContent = msg;
      status.className = `form__status${kind ? ` is-${kind}` : ''}`;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();

      const fields = { 'cf-name': !!name, 'cf-email': /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'cf-message': !!message };
      Object.entries(fields).forEach(([id, ok]) => $(`#${id}`).setAttribute('aria-invalid', String(!ok)));
      const firstBad = Object.keys(fields).find((id) => !fields[id]);
      if (firstBad) { say('Please fill in every field with a valid email.', 'err'); $(`#${firstBad}`).focus(); return; }

      if (data.get('company')) { say('Thanks, message sent.', 'ok'); form.reset(); return; }

      const btn = $('button[type="submit"]', form);
      btn.disabled = true;
      say('Sending…');
      try {
        const emailjs = await loadSDK();
        await emailjs.send(EMAILJS.service, EMAILJS.template, { from_name: name, from_email: email, reply_to: email, message, to_name: 'Aidan Hall' });
        say('Thanks, message sent. I will get back to you soon.', 'ok');
        form.reset();
      } catch {
        say('That did not go through. Please reach me on LinkedIn instead.', 'err');
      } finally {
        btn.disabled = false;
      }
    });
  }

  /* ---------- Footer: real load timing ---------- */
  addEventListener('load', () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType?.('navigation')[0];
      const el = $('[data-perf]');
      if (!nav || !el || !nav.domContentLoadedEventEnd) return;
      el.textContent = `ready in ${Math.round(nav.domContentLoadedEventEnd)} ms`;
    }, 0);
  });

  console.log(
    '%cHi there.%c This site is hand-written HTML, CSS and JS. Source: https://github.com/DukeAidanHall/DukeAidanHall.github.io',
    'font-weight:600', 'font-weight:400'
  );
})();
