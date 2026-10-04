'use strict';
function Arcade(o) {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const slug = Curio.slug || 'arcade';
  const stage = $('.arc-stage'), canvas = $('#arc-canvas'), ctx = canvas.getContext('2d');
  const ov = {};
  $$('.arc-ov').forEach((el) => { ov[el.id.replace('ov-', '')] = el; });
  const STEP = 1 / 120;
  const A = {
    state: 'menu', score: 0, W: o.width || 400, H: o.height || 400, ctx, canvas, stage,
    keys: new Set(), time: 0, bestKey: 'score', STEP, dpr: 1, scale: 1, colors: {}, run: { ach: [] }
  };
  const VER = 2;
  A.load = (k, fb) => {
    const v = Curio.store.get(`${slug}:${k}`, null);
    if (!v || typeof v !== 'object' || v.v !== VER || v.d == null) return fb;
    if (fb != null && typeof v.d !== typeof fb) return fb;
    if (fb && typeof fb === 'object' && !Array.isArray(fb) && (typeof v.d !== 'object' || Array.isArray(v.d))) return fb;
    if (Array.isArray(fb) && !Array.isArray(v.d)) return fb;
    return v.d;
  };
  A.save = (k, d) => Curio.store.set(`${slug}:${k}`, { v: VER, d });

  const hud = {};
  $$('[data-hud]').forEach((el) => (hud[el.dataset.hud] ||= []).push(el));
  A.hud = (name, v) => {
    const s = String(v);
    for (const el of hud[name] || []) if (el.textContent !== s) {
      el.textContent = s;
      if (el.closest('.arc-hud')) { el.classList.remove('arc-bump'); void el.offsetWidth; el.classList.add('arc-bump'); }
    }
  };
  A.tableKey = () => (Curio.simple ? 'simple' : A.bestKey);
  A.showBest = () => {
    const b = Curio.getBest(A.tableKey()) ?? 0;
    A.hud('best', Curio.fmt(Math.max(b, A.state === 'play' || A.state === 'paused' ? A.score : 0)));
  };
  A.setScore = (n) => { A.score = Math.max(0, Math.round(n)); A.hud('score', Curio.fmt(A.score)); A.showBest(); };
  A.addScore = (n) => A.setScore(A.score + n);

  function readColors(first) {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['bg', 'surface', 'surface-2', 'ink', 'ink-2', 'ink-3', 'line', 'accent', 'good', 'bad', 'warn']) {
      A.colors[k.replace('-2', '2').replace('-3', '3')] = cs.getPropertyValue('--' + k).trim();
    }
    A.dark = Curio.isDark();
    if (first !== true) o.theme?.();
  }
  readColors(true);
  addEventListener('curio:theme', () => requestAnimationFrame(readColors));
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => requestAnimationFrame(readColors));

  A.opts = Object.assign({}, o.defaults || {}, Curio.simple ? (o.simple || {}) : A.load('opts', {}));
  function paintOpts() {
    $$('[data-opt]').forEach((el) => {
      const k = el.dataset.opt;
      if (el.type === 'checkbox') el.checked = !!A.opts[k];
      else el.setAttribute('aria-pressed', String(String(A.opts[k]) === el.dataset.val));
    });
    o.optsChanged?.(A.opts);
  }
  A.setOpt = (k, v) => { A.opts[k] = v; if (!Curio.simple) A.save('opts', A.opts); paintOpts(); };
  A.paintOpts = paintOpts;
  $$('[data-opt]').forEach((el) => {
    const k = el.dataset.opt;
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'click', () => {
      if (el.type === 'checkbox') A.setOpt(k, el.checked);
      else { if (el.disabled || el.classList.contains('is-locked')) { o.lockedOpt?.(k, el.dataset.val); return; } A.setOpt(k, el.dataset.val); }
      A.click();
    });
  });

  const ACH = o.achievements || [];
  let got = A.load('ach', {});
  A.has = (id) => !!got[id];
  A.achCount = () => ACH.filter((a) => got[a.id]).length;
  const badgeQ = [];
  let badgeOn = false;
  const badgeEl = document.createElement('div');
  badgeEl.className = 'arc-badge';
  badgeEl.setAttribute('role', 'status');
  stage.append(badgeEl);
  function nextBadge() {
    if (badgeOn || !badgeQ.length) return;
    const a = badgeQ.shift();
    badgeOn = true;
    badgeEl.innerHTML = '<i></i><div><small>Badge unlocked</small><b></b></div>';
    badgeEl.querySelector('i').textContent = a.icon || '★';
    badgeEl.querySelector('b').textContent = a.name;
    badgeEl.classList.add('is-on');
    A.chord([784, 988, 1319], 0.07, 'triangle', 0.07);
    A.buzz([20, 40, 20]);
    setTimeout(() => { badgeEl.classList.remove('is-on'); setTimeout(() => { badgeOn = false; nextBadge(); }, 350); }, 2300);
  }
  A.unlock = (id) => {
    const a = ACH.find((x) => x.id === id);
    if (!a || got[id]) return false;
    got[id] = Date.now();
    A.save('ach', got);
    A.run.ach.push(id);
    badgeQ.push(a);
    nextBadge();
    o.unlocked?.(id);
    return true;
  };

  let stats = A.load('stats', {});
  A.stats = () => stats;
  A.stat = (k, n = 1) => { stats[k] = (stats[k] || 0) + n; return stats[k]; };
  A.statMax = (k, v) => { if (v > (stats[k] || 0)) stats[k] = v; return stats[k]; };
  A.saveStats = () => A.save('stats', stats);
  let hist = A.load('hist', []);
  A.history = () => hist;

  function renderPanel(tab) {
    const p = ov.panel;
    if (!p) return;
    $$('[data-tab]', p).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
    $$('[data-tabbody]', p).forEach((b) => { b.hidden = b.dataset.tabbody !== tab; });
    if (tab === 'ach') {
      const box = $('[data-tabbody="ach"]', p);
      box.innerHTML = '';
      const head = document.createElement('p');
      head.className = 'arc-small';
      head.textContent = `${A.achCount()} of ${ACH.length} badges earned`;
      box.append(head);
      const list = document.createElement('div');
      list.className = 'arc-achs';
      for (const a of ACH) {
        const el = document.createElement('div');
        el.className = 'arc-ach' + (got[a.id] ? ' is-got' : '');
        el.innerHTML = '<i></i><div><b></b><span></span></div>';
        el.querySelector('i').textContent = got[a.id] ? (a.icon || '★') : '?';
        el.querySelector('b').textContent = a.name;
        el.querySelector('span').textContent = a.desc;
        list.append(el);
      }
      box.append(list);
    }
    if (tab === 'stats') {
      const box = $('[data-tabbody="stats"]', p);
      box.innerHTML = '';
      const grid = document.createElement('div');
      grid.className = 'arc-statgrid';
      for (const [k, label, f] of o.statsList || []) {
        const el = document.createElement('div');
        el.innerHTML = '<b></b><span></span>';
        const v = typeof k === 'function' ? k(stats) : stats[k] || 0;
        el.querySelector('b').textContent = f ? f(v) : Curio.fmt(v);
        el.querySelector('span').textContent = label;
        grid.append(el);
      }
      box.append(grid);
      if (hist.length) {
        const h = document.createElement('div');
        h.className = 'arc-hist';
        h.innerHTML = '<div class="arc-label">Recent runs</div>';
        for (const r of hist.slice(0, 8)) {
          const row = document.createElement('div');
          row.innerHTML = '<span></span><b></b>';
          row.querySelector('span').textContent = `${r.d} · ${r.m}`;
          row.querySelector('b').textContent = r.t || Curio.fmt(r.s);
          h.append(row);
        }
        box.append(h);
      }
    }
    o.panel?.(tab, $(`[data-tabbody="${tab}"]`, p));
  }
  let panelFrom = 'menu';
  A.openPanel = (tab = 'help') => {
    panelFrom = A.state === 'paused' ? 'pause' : A.state === 'over' ? 'over' : 'menu';
    renderPanel(tab);
    show('panel');
  };
  if (ov.panel) $$('[data-tab]', ov.panel).forEach((b) => b.addEventListener('click', () => { renderPanel(b.dataset.tab); A.click(); }));

  function fit() {
    const r = stage.getBoundingClientRect();
    const aw = Math.max(120, r.width), ah = Math.max(120, r.height);
    if (o.size) { const s = o.size(aw, ah); A.W = s.w; A.H = s.h; }
    const sc = Math.min(aw / A.W, ah / A.H);
    const cw = Math.max(1, Math.floor(A.W * sc)), ch = Math.max(1, Math.floor(A.H * sc));
    A.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    A.scale = sc;
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    canvas.width = Math.round(cw * A.dpr);
    canvas.height = Math.round(ch * A.dpr);
    o.resized?.();
    render(0);
  }
  function render(alpha) {
    ctx.setTransform(canvas.width / A.W, 0, 0, canvas.height / A.H, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    o.draw(ctx, alpha);
  }

  A.pops = [];
  A.pop = (text, x, y, { color = '#fff', size = 18, life = 0.9, vy = -55, stroke = 'rgba(0,0,0,.55)', tag = '' } = {}) => {
    if (tag) for (let i = A.pops.length - 1; i >= 0; i--) if (A.pops[i].tag === tag) A.pops.splice(i, 1);
    A.pops.push({ text: String(text), x, y, color, size, life, max: life, vy, stroke, tag });
    if (A.pops.length > 40) A.pops.shift();
  };
  A.drawPops = (g) => {
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    for (const p of A.pops) {
      const age = p.max - p.life;
      const s = age < 0.12 ? 0.5 + age / 0.12 * 0.7 : age < 0.22 ? 1.2 - (age - 0.12) / 0.1 * 0.2 : 1;
      g.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 2.2));
      g.font = `900 ${Math.round(p.size * s)}px ${FONT}`;
      g.lineWidth = Math.max(3, p.size / 4);
      g.strokeStyle = p.stroke;
      g.lineJoin = 'round';
      g.strokeText(p.text, p.x, p.y);
      g.fillStyle = p.color;
      g.fillText(p.text, p.x, p.y);
    }
    g.globalAlpha = 1;
    g.textBaseline = 'alphabetic';
  };
  A.shk = 0;
  A.shake = (a) => { if (A.opts.shake === false || A.opts.shake === 'off') return; A.shk = Math.min(1.2, Math.max(A.shk, a)); };
  A.applyShake = (g, k = 18) => { if (A.shk > 0) g.translate((Math.random() - 0.5) * A.shk * k, (Math.random() - 0.5) * A.shk * k); };
  A.flashT = 0;
  A.flashC = '#fff';
  A.flash = (c = '#fff', t = 0.15) => { A.flashC = c; A.flashT = t; A.flashMax = t; };
  A.drawFlash = (g) => {
    if (A.flashT <= 0) return;
    g.globalAlpha = A.flashT / A.flashMax * 0.55;
    g.fillStyle = A.flashC;
    g.fillRect(-20, -20, A.W + 40, A.H + 40);
    g.globalAlpha = 1;
  };
  A.buzz = (p) => { try { if (navigator.vibrate && A.opts.haptics !== false) navigator.vibrate(p); } catch {} };

  let last = 0, acc = 0, raf = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    let dt = last ? (t - last) / 1000 : 0;
    last = t;
    if (dt > 0.1) dt = 0.1;
    A.time += dt;
    A.shk = Math.max(0, A.shk - dt * 2.2);
    A.flashT = Math.max(0, A.flashT - dt);
    for (let i = A.pops.length - 1; i >= 0; i--) {
      const p = A.pops[i];
      p.life -= dt;
      p.y += p.vy * dt;
      p.vy *= Math.exp(-2 * dt);
      if (p.life <= 0) A.pops.splice(i, 1);
    }
    if (A.state === 'play') {
      acc += dt * (A.timeScale || 1);
      let n = 0;
      while (acc >= STEP && n++ < 16) {
        o.update(STEP);
        acc -= STEP;
        if (A.state !== 'play') { acc = 0; break; }
      }
    } else {
      acc = 0;
      A.fx.update(dt);
      o.idle?.(dt);
    }
    render(acc / STEP);
  }

  let overAt = 0;
  function show(name) {
    for (const k in ov) if (ov[k]) ov[k].hidden = k !== name;
    if (name && ov[name]) {
      const f = ov[name].querySelector('[data-autofocus]') || ov[name].querySelector('.c-btn');
      f?.focus({ preventScroll: true });
      ov[name].scrollTop = 0;
    }
    stage.classList.toggle('is-ov', !!name);
  }
  A.show = show;
  function releaseAll() { for (const k of [...A.keys]) { A.keys.delete(k); o.key?.(k, false, false); } }
  A.start = (extra) => {
    releaseAll();
    A.score = 0;
    A.run = { ach: [], t0: performance.now() };
    A.state = 'play';
    A.pops.length = 0;
    A.fx.clear();
    o.reset(extra);
    A.setScore(A.score);
    show(null);
    last = 0; acc = 0;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    A.chord([392, 523, 659], 0.06, 'triangle', 0.07);
    o.start?.();
  };
  A.pause = () => {
    if (A.state !== 'play') return;
    releaseAll();
    A.state = 'paused';
    A.saveStats();
    show('pause');
    Curio.beep(392, 0.06, 'triangle', 0.08);
  };
  A.resume = () => {
    if (A.state !== 'paused') return;
    A.state = 'play';
    show(null);
    last = 0; acc = 0;
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
  };
  A.hold = (name) => { releaseAll(); A.state = 'hold'; show(name); };
  A.unhold = () => { A.state = 'play'; show(null); last = 0; acc = 0; if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur(); };
  A.menu = () => { releaseAll(); A.state = 'menu'; o.menu?.(); paintOpts(); show('menu'); A.showBest(); window.Cab?.menu(); };

  const MEDAL = (col, col2, glyph) => `<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="mg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="${col}"/><stop offset="1" stop-color="${col2}"/></radialGradient></defs><path d="M40 6h16l10 30H50zM80 6H64L54 36h16z" fill="#e84a5f"/><path d="M47 6h7l10 30h-7zM73 6h-7L56 36h7z" fill="#fff" opacity=".35"/><circle cx="60" cy="72" r="40" fill="${col2}"/><circle cx="60" cy="70" r="38" fill="url(#mg)"/><circle cx="60" cy="70" r="29" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-dasharray="4 5"/><text x="60" y="82" text-anchor="middle" font-size="34" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">${glyph}</text></svg>`;
  A.over = ({ title = 'Game over', msg = '', rows = [], share = '', medal = null } = {}) => {
    if (A.state === 'over') return;
    releaseAll();
    A.state = 'over';
    const r = Curio.best(A.tableKey(), A.score);
    const isNew = r.isNew && A.score > 0;
    A.stat('runs');
    A.saveStats();
    hist.unshift({ s: A.score, m: o.modeName?.() || 'Run', d: A.today().slice(5), t: o.histText?.() });
    hist = hist.slice(0, 20);
    A.save('hist', hist);
    const box = ov.over;
    const set = (n, v) => { const el = box.querySelector(`[data-o="${n}"]`); if (el) el.textContent = v; };
    const m = medal || (isNew ? ['#ffd34d', '#e0a100', '★'] : A.score > 0 ? ['#dfe6ee', '#9aa7b6', '✓'] : ['#e6b38a', '#b06f3c', '•']);
    box.querySelector('[data-o="art"]').innerHTML = MEDAL(...m);
    set('title', title);
    set('score', Curio.fmt(A.score));
    set('best', Curio.fmt(r.best));
    set('msg', msg);
    box.querySelector('[data-o="new"]').hidden = !isNew;
    const rowsEl = box.querySelector('[data-o="rows"]');
    rowsEl.innerHTML = '';
    for (const [l, v] of rows) {
      const d = document.createElement('div');
      d.innerHTML = '<b></b><span></span>';
      d.querySelector('b').textContent = v;
      d.querySelector('span').textContent = l;
      rowsEl.append(d);
    }
    const achEl = box.querySelector('[data-o="ach"]');
    achEl.innerHTML = '';
    for (const id of A.run.ach) {
      const a = ACH.find((x) => x.id === id);
      const s = document.createElement('span');
      s.textContent = `${a.icon || '★'} ${a.name}`;
      achEl.append(s);
    }
    achEl.hidden = !A.run.ach.length;
    shareText = share;
    box.querySelector('[data-act="share"]').hidden = !share;
    if (isNew) {
      Curio.confetti();
      A.chord([523, 659, 784, 1047], 0.09, 'triangle', 0.12);
    } else A.chord([392, 330, 262], 0.12, 'triangle', 0.08);
    overAt = performance.now();
    show('over');
    A.showBest();
    window.Cab?.over(A.score, { key: A.tableKey() });
  };
  let shareText = '';
  A.share = (text) => {
    const done = () => Curio.toast('Result copied, paste it anywhere');
    const fallback = () => {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.append(t); t.select();
      try { document.execCommand('copy'); done(); } catch { Curio.toast('Could not copy'); }
      t.remove();
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch { fallback(); }
  };

  $$('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const a = b.dataset.act;
    if (a === 'start' || a === 'restart') { if (performance.now() - overAt > 450) A.start(); }
    else if (a === 'resume') A.resume();
    else if (a === 'menu') A.menu();
    else if (a === 'pause') { if (A.state === 'play') A.pause(); else if (A.state === 'paused') A.resume(); }
    else if (a === 'panel') A.openPanel(b.dataset.tab || 'help');
    else if (a === 'back') { show(panelFrom); A.click(); }
    else if (a === 'share') A.share(shareText);
    else o.action?.(a, b);
  }));

  const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
  const norm = (k) => (k.length === 1 ? k.toLowerCase() : k === 'Spacebar' ? ' ' : k);
  function press(k, down, repeat) {
    if (down) A.keys.add(k); else A.keys.delete(k);
    o.key?.(k, down, repeat);
  }
  A.press = press;
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, select, textarea')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = norm(e.key);
    const onBtn = e.target.closest?.('button, a');
    if (k === 'p' || k === 'Escape') {
      if (A.state === 'play') { A.pause(); e.preventDefault(); }
      else if (A.state === 'paused') { A.resume(); e.preventDefault(); }
      else if (k === 'Escape' && !ov.panel?.hidden) { show(panelFrom); e.preventDefault(); }
      return;
    }
    if (A.state !== 'play') {
      if (A.state === 'hold') { o.holdKey?.(k, e); return; }
      if ((k === ' ' || k === 'Enter') && !onBtn && !e.repeat) {
        e.preventDefault();
        if (A.state === 'paused') A.resume();
        else if (A.state === 'menu' || A.state === 'over') { if (performance.now() - overAt > 450) A.start(); }
      }
      return;
    }
    if (PREVENT.has(k) || (o.capture || []).includes(k)) e.preventDefault();
    if (e.repeat) { o.key?.(k, true, true); return; }
    press(k, true, false);
  });
  addEventListener('keyup', (e) => { const k = norm(e.key); if (A.keys.has(k)) press(k, false, false); });
  addEventListener('blur', () => { releaseAll(); A.pause(); });
  addEventListener('pagehide', () => A.saveStats());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { A.pause(); A.saveStats(); cancelAnimationFrame(raf); raf = 0; }
    else if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
  });
  $$('.arc-pad [data-key]').forEach((btn) => {
    const k = btn.dataset.key;
    let on = false;
    const down = (e) => {
      e.preventDefault();
      document.body.classList.add('arc-touch');
      if (on) return;
      on = true;
      btn.classList.add('is-down');
      try { btn.setPointerCapture(e.pointerId); } catch {}
      if (A.state === 'play') press(k, true, false);
    };
    const up = () => {
      if (!on) return;
      on = false;
      btn.classList.remove('is-down');
      if (A.keys.has(k)) press(k, false, false);
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  });
  const toLogical = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * A.W, y: (e.clientY - r.top) / r.height * A.H };
  };
  A.toLogical = toLogical;
  let ptr = null;
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.arc-ov, .arc-badge')) return;
    if (e.pointerType === 'touch') document.body.classList.add('arc-touch');
    if (A.state !== 'play' || e.button > 0) return;
    e.preventDefault();
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false };
    try { stage.setPointerCapture(e.pointerId); } catch {}
    o.pointer?.('down', toLogical(e), e);
  });
  addEventListener('pointermove', (e) => {
    if (A.state !== 'play') return;
    o.pointer?.('move', toLogical(e), e);
    if (!ptr || e.pointerId !== ptr.id) return;
    const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
    if (Math.hypot(dx, dy) >= (o.swipeDist || 26)) {
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      ptr.x = e.clientX; ptr.y = e.clientY; ptr.moved = true;
      o.swipe?.(dir);
    }
  });
  const endPtr = (e) => {
    if (!ptr || e.pointerId !== ptr.id) return;
    const p = toLogical(e);
    if (A.state === 'play') {
      if (!ptr.moved && performance.now() - ptr.t < 320 && Math.hypot(e.clientX - ptr.x0, e.clientY - ptr.y0) < 14) o.tap?.(p);
      o.pointer?.('up', p, e);
    }
    ptr = null;
  };
  stage.addEventListener('pointerup', endPtr);
  stage.addEventListener('pointercancel', endPtr);
  stage.addEventListener('contextmenu', (e) => e.preventDefault());

  A.beep = (f, d, type, vol) => Curio.beep(f, d, type, vol);
  A.click = () => Curio.beep(660, 0.03, 'triangle', 0.05);
  A.chord = (fs, gap = 0.08, type = 'triangle', vol = 0.09) => fs.forEach((f, i) => setTimeout(() => Curio.beep(f, 0.13, type, vol), i * gap * 1000));
  A.sweep = (f1, f2, d = 0.15, type = 'square', vol = 0.07) => {
    if (Curio.muted) return;
    const ac = Curio.audioContext();
    if (!ac) return;
    const t = ac.currentTime, osc = ac.createOscillator(), g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    osc.connect(g).connect(ac.destination);
    osc.start(t);
    osc.stop(t + d + 0.02);
  };
  let noiseBuf = null;
  A.noise = (d = 0.3, vol = 0.18, freq = 1200, type = 'lowpass') => {
    if (Curio.muted) return;
    const ac = Curio.audioContext();
    if (!ac) return;
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime, src = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    src.buffer = noiseBuf;
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (type === 'lowpass') f.frequency.exponentialRampToValueAtTime(80, t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f).connect(g).connect(ac.destination);
    src.start(t);
    src.stop(t + d + 0.02);
  };

  A.fx = {
    list: [],
    clear() { this.list.length = 0; },
    burst(x, y, n, colors, { speed = 160, life = 0.6, size = 3, gravity = 300, spread = Math.PI * 2, angle = 0, drag = 1.5, shape = 'sq', glow = false } = {}) {
      for (let i = 0; i < n; i++) {
        if (this.list.length > 900) this.list.shift();
        const a = angle + (Math.random() - 0.5) * spread, s = speed * (0.35 + Math.random() * 0.65);
        this.list.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), max: life,
          size: size * (0.6 + Math.random() * 0.7), c: Array.isArray(colors) ? colors[(Math.random() * colors.length) | 0] : colors,
          g: gravity, drag, shape, glow, r: Math.random() * 6, vr: (Math.random() - 0.5) * 10
        });
      }
    },
    ring(x, y, r, color, life = 0.45, width = 3) { this.list.push({ x, y, vx: 0, vy: 0, life, max: life, size: r, c: color, g: 0, drag: 0, shape: 'ring', glow: true, w: width }); },
    update(dt) {
      const L = this.list;
      for (let i = L.length - 1; i >= 0; i--) {
        const p = L[i];
        p.life -= dt;
        if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
        const k = Math.exp(-p.drag * dt);
        p.vx *= k;
        p.vy = p.vy * k + p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.r += p.vr * dt;
      }
    },
    draw(g) {
      for (const pass of [false, true]) {
        if (pass) g.globalCompositeOperation = 'lighter';
        for (const p of this.list) {
          if (!!p.glow !== pass) continue;
          const f = Math.max(0, Math.min(1, p.life / p.max));
          g.globalAlpha = Math.min(1, f * 1.5);
          if (p.shape === 'ring') {
            g.strokeStyle = p.c;
            g.lineWidth = p.w * f;
            g.beginPath();
            g.arc(p.x, p.y, p.size * (1.15 - f * 0.9) + 2, 0, 7);
            g.stroke();
            continue;
          }
          g.fillStyle = p.c;
          if (p.shape === 'dot') { g.beginPath(); g.arc(p.x, p.y, p.size * (0.4 + f * 0.6), 0, 7); g.fill(); }
          else if (p.shape === 'spark') {
            g.strokeStyle = p.c;
            g.lineWidth = p.size * 0.5;
            g.beginPath();
            g.moveTo(p.x, p.y);
            g.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
            g.stroke();
          } else {
            g.save();
            g.translate(p.x, p.y);
            g.rotate(p.r);
            g.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
            g.restore();
          }
        }
      }
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = 1;
    }
  };

  A.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  A.today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  A.seedOf = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  window.__arcade = A;
  A.boot = () => {
    new ResizeObserver(fit).observe(stage);
    addEventListener('resize', fit);
    fit();
    A.menu();
    raf = requestAnimationFrame(frame);
    if (o.tip && !Curio.store.get(`${slug}:tip-touchpad`, false)) {
      Curio.store.set(`${slug}:tip-touchpad`, true);
      setTimeout(() => Curio.toast(o.tip, 4200), 900);
    }
  };
  return A;
}
function rrect(g, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r);
  gg = Math.round((t - gg) * p + gg);
  b = Math.round((t - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
}
function mix(a, b, t) {
  const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
  const c = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
}
function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
