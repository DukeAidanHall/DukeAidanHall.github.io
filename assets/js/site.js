// Aidan Hall, personal site. Vanilla JS, no dependencies, no build step.
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const darkQuery = matchMedia('(prefers-color-scheme: dark)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
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

    const x = origin ? origin.x : innerWidth / 2;
    const y = origin ? origin.y : innerHeight / 2;
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

  $$('[data-theme-toggle]').forEach((btn) => btn.addEventListener('click', (e) => {
    const b = btn.getBoundingClientRect();
    toggleTheme({ x: e.clientX || b.left + b.width / 2, y: e.clientY || b.top + b.height / 2 });
  }));

  /* ---------- Small details ---------- */
  $$('[data-mod-key]').forEach((k) => { k.textContent = isMac ? '⌘K' : 'Ctrl K'; });
  $$('[data-year]').forEach((y) => { y.textContent = new Date().getFullYear(); });

  /* ---------- Page glow and lit dots follow the cursor (Brittany Chiang style) ---------- */
  if (finePointer.matches && !reduceMotion.matches) {
    let px = 0, py = 0, queued = false;
    addEventListener('pointermove', (e) => {
      px = e.clientX; py = e.clientY;
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        root.style.setProperty('--mx', `${px}px`);
        root.style.setProperty('--my', `${py}px`);
        queued = false;
      });
    }, { passive: true });
  }

  /* ---------- Card spotlight ---------- */
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest?.('.spot');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--cx', `${e.clientX - r.left}px`);
    card.style.setProperty('--cy', `${e.clientY - r.top}px`);
  }, { passive: true });

  /* ---------- Top bar border (mobile) and active section in the side nav ---------- */
  const topbar = $('#topbar');
  const onScroll = () => topbar?.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const sections = $$('main section[id]');
  const navLinks = new Map($$('.side__nav a').map((a) => [a.getAttribute('href').slice(1), a]));
  const setActive = (id) => navLinks.forEach((a, key) => {
    const on = key === id;
    a.classList.toggle('is-active', on);
    on ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current');
  });
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-35% 0px -60% 0px' });
  sections.forEach((s) => sectionObserver.observe(s));
  setActive('about');

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealObserver.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

  $$('.side .reveal').forEach((el, i) => el.style.setProperty('--d', `${i * 60}ms`));
  $$('#about .reveal').forEach((el, i) => el.style.setProperty('--d', `${120 + i * 60}ms`));
  $$('.highlights .reveal').forEach((el, i) => el.style.setProperty('--d', `${(i % 2) * 70}ms`));
  $$('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------- Role line with a text scramble (Hamish Williams style) ---------- */
  function scramble() {
    const el = $('[data-scramble]');
    if (!el) return;
    const words = el.dataset.scramble.split('|');
    if (reduceMotion.matches || words.length < 2) return;
    const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789<>/+*#';
    let i = 0;
    let timer = 0;

    function to(target) {
      const from = el.textContent;
      const len = Math.max(from.length, target.length);
      const plan = [...Array(len)].map((_, k) => ({
        from: from[k] || '',
        to: target[k] || '',
        start: Math.floor(Math.random() * 14),
        end: 14 + Math.floor(Math.random() * 18),
      }));
      let frame = 0;
      const step = () => {
        let out = '';
        let done = 0;
        for (const p of plan) {
          if (frame >= p.end) { out += p.to; done++; }
          else if (frame >= p.start) out += p.to === ' ' ? ' ' : glyphs[(Math.random() * glyphs.length) | 0];
          else out += p.from;
        }
        el.textContent = out;
        frame++;
        if (done < plan.length) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    const tick = () => {
      if (!document.hidden) { i = (i + 1) % words.length; to(words[i]); }
      timer = setTimeout(tick, 3200);
    };
    timer = setTimeout(tick, 2600);
    reduceMotion.addEventListener?.('change', () => { clearTimeout(timer); el.textContent = words[0]; });
  }
  scramble();

  /* ---------- Bio: short or long (Lee Robinson style) ---------- */
  const tabs = $$('.bio__tabs [role="tab"]');
  const selectTab = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      if (on) {
        panel.removeAttribute('data-hidden');
        panel.classList.remove('is-entering');
        void panel.offsetWidth;
        panel.classList.add('is-entering');
      } else {
        panel.setAttribute('data-hidden', '');
      }
    });
    if (focus) tab.focus();
    store.set('bio', tab.id);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      selectTab(tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length], true);
    });
  });
  const savedBio = store.get('bio');
  if (savedBio && document.getElementById(savedBio) && savedBio !== 'bio-tab-short') selectTab(document.getElementById(savedBio));

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
      if (data.app || data.py) {
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
        const dash = 14;
        pulse.style.strokeDasharray = `${dash} ${len + dash}`;
        if (reduceMotion.matches) { pulse.style.opacity = '0'; return; }
        pulse.style.strokeDashoffset = `${dash}`;
        const anim = pulse.animate(
          [{ strokeDashoffset: dash }, { strokeDashoffset: -len }],
          { duration: 1400 + len * 5, delay: i * 240, iterations: Infinity, easing: 'cubic-bezier(.45,0,.25,1)' }
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

  /* ---------- Jumping around ---------- */
  const flash = (target) => {
    target.classList.remove('is-flash');
    void target.offsetWidth;
    target.classList.add('is-flash');
  };
  const goTo = (target) => {
    if (!target) return;
    if (target.hidden) $('[data-filter="all"]')?.click();
    const isSection = target.matches('section');
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: isSection ? 'start' : 'center' });
    if (!isSection) setTimeout(() => flash(target), 350);
  };
  const sectionKeys = $$('.side__nav a[data-key]').map((a) => ({ key: a.dataset.key, id: a.getAttribute('href').slice(1) }));

  /* ---------- Command palette ---------- */
  const dialog = $('#cmdk');
  const input = $('.cmdk__input', dialog);
  const list = $('#cmdk-list');

  const commands = [
    { group: 'Sections', label: 'About', hint: '1', icon: 'hash', run: () => goTo($('#about')) },
    { group: 'Sections', label: 'Marrow Health', hint: '2', icon: 'hash', run: () => goTo($('#marrow')) },
    { group: 'Sections', label: 'Experience', hint: '3', icon: 'hash', run: () => goTo($('#experience')) },
    { group: 'Sections', label: 'Projects', hint: '4', icon: 'hash', run: () => goTo($('#projects')) },
    { group: 'Sections', label: 'Education, honors and skills', hint: '5', icon: 'hash', run: () => goTo($('#education')) },
    { group: 'Sections', label: 'Contact', hint: '6', icon: 'hash', run: () => goTo($('#contact')) },
    ...$$('[data-cmdk]').map((el) => ({
      group: el.dataset.cmdkGroup,
      label: el.dataset.cmdk,
      icon: el.matches('.project') ? 'box' : el.matches('.quote') ? 'spark' : 'brief',
      run: () => goTo(el),
    })),
    { group: 'Links', label: 'Resume (PDF)', icon: 'file', href: 'Aidan_Hall_Resume.pdf' },
    { group: 'Links', label: 'GitHub', hint: 'DukeAidanHall', icon: 'github', href: 'https://github.com/DukeAidanHall' },
    { group: 'Links', label: 'LinkedIn', hint: 'hallaidan', icon: 'linkedin', href: 'https://www.linkedin.com/in/hallaidan' },
    { group: 'Links', label: 'Marrow on the App Store', icon: 'arrow', href: 'https://apps.apple.com/us/app/marrow-health-calorie-counter/id6800819435' },
    { group: 'Links', label: 'marrowhealthapp.com', icon: 'arrow', href: 'https://marrowhealthapp.com/' },
    { group: 'Links', label: 'marrow-mcp source code', icon: 'github', href: 'https://github.com/MarrowHealth/marrow-mcp' },
    { group: 'Links', label: 'ClassPulse on Devpost', icon: 'arrow', href: 'https://devpost.com/software/classpulse-tj0s2p' },
    { group: 'Actions', label: 'Toggle light and dark theme', hint: 't', icon: 'sun', run: () => toggleTheme() },
    { group: 'Actions', label: 'Show the long bio', icon: 'file', run: () => { selectTab($('#bio-tab-long')); goTo($('#about')); } },
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
    return { score: 40 - (hits[hits.length - 1] - hits[0]), hits };
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

  /* ---------- Keyboard: ⌘K, /, t, and 1 to 6 for sections (onur.dev style) ---------- */
  document.addEventListener('keydown', (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      dialog?.open ? closePalette() : openPalette();
      return;
    }
    if (typing || e.metaKey || e.ctrlKey || e.altKey || dialog?.open) return;
    if (e.key === '/') { e.preventDefault(); openPalette(); }
    else if (e.key === 't') toggleTheme();
    else {
      const hit = sectionKeys.find((s) => s.key === e.key);
      if (hit) { e.preventDefault(); goTo(document.getElementById(hit.id)); }
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
