(() => {
  const C = window.Curio, $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const ROUNDS = 5;
  const NAMED = window.CM_NAMED;

  const MODES = {
    classic: { label: 'Classic', desc: 'A random colour appears. Memorise it, then rebuild it with the picker.' },
    daily: { label: 'Daily', desc: 'Five colours of the day, the same for everyone. Compare scores with friends.' },
    palette: { label: 'Palette', desc: 'A whole palette flashes up. Then pick each original out of a line-up of near-identical impostors.' },
    name: { label: 'Name it', desc: 'No peeking: we give you the name of a CSS colour like "Steel Blue". Build it from imagination.' }
  };
  const VIEWS = { 5000: '5 s', 3000: '3 s', 1500: 'Glimpse' };

  const settings = FX.load('settings', 1, { mode: 'classic', view: 5000 });
  if (!MODES[settings.mode]) settings.mode = 'classic';
  if (!VIEWS[settings.view]) settings.view = 5000;
  const saveSettings = () => FX.save('settings', 1, settings);
  const stats = FX.load('stats', 1, { games: 0, best: {}, rounds: [], tend: { dh: 0, ds: 0, db: 0, n: 0 }, recent: [], daily: {}, perfect: 0, bestRound: 0 });
  const saveStats = () => FX.save('stats', 1, stats);

  const BADGES = FX.badges([
    { id: 'first', emoji: '🎨', tier: 'bronze', name: 'First stroke', desc: 'Finish a game' },
    { id: 'nine', emoji: '👁️', tier: 'silver', name: 'Sharp eye', desc: 'Score 9+ on a single colour' },
    { id: 'perfect', emoji: '🦅', tier: 'gold', name: 'Telepathic', desc: 'Score 9.8+ on a single colour' },
    { id: 'c40', emoji: '🖌️', tier: 'silver', name: 'Painter', desc: '40+ in Classic' },
    { id: 'c45', emoji: '🏆', tier: 'gold', name: 'Colourist', desc: '45+ in Classic' },
    { id: 'steady', emoji: '🎯', tier: 'gold', name: 'Steady hand', desc: 'Every round 8+ in one game' },
    { id: 'glimpse', emoji: '⚡', tier: 'gold', name: 'Glimpse', desc: '8+ on a colour seen for 1.5 s' },
    { id: 'daily', emoji: '📅', tier: 'bronze', name: 'Colour of the day', desc: 'Finish a daily game' },
    { id: 'pal', emoji: '🧑‍🎨', tier: 'silver', name: 'Palette pro', desc: 'Get every swatch right in a palette round' },
    { id: 'pal50', emoji: '💎', tier: 'diamond', name: 'Perfect palette', desc: 'Score 50 in Palette', secret: true },
    { id: 'name', emoji: '📛', tier: 'silver', name: 'Name dropper', desc: '35+ in Name it' },
    { id: 'games', emoji: '🌈', tier: 'silver', name: 'Rainbow regular', desc: 'Play 20 games' }
  ]);

  function hsb2rgb(h, s, v) {
    s /= 100; v /= 100;
    const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
    return [f(5), f(3), f(1)].map((x) => Math.round(x * 255));
  }
  function rgb2hsb([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0;
    if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    return [Math.round(h) % 360, Math.round(mx ? (d / mx) * 100 : 0), Math.round(mx * 100)];
  }
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const css = (hsb) => { const [r, g, b] = hsb2rgb(...hsb); return `rgb(${r}, ${g}, ${b})`; };
  const hex = (hsb) => '#' + hsb2rgb(...hsb).map((x) => x.toString(16).padStart(2, '0')).join('');
  function rgb2lab([r, g, b]) {
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const R = lin(r), G = lin(g), B = lin(b);
    const X = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
    const Y = (R * 0.2126729 + G * 0.7151522 + B * 0.0721750);
    const Z = (R * 0.0193339 + G * 0.1191920 + B * 0.9503041) / 1.08883;
    const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
    const fx = f(X), fy = f(Y), fz = f(Z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }
  function deltaE2000([L1, a1, b1], [L2, a2, b2]) {
    const rad = Math.PI / 180, deg = 180 / Math.PI;
    const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2;
    const G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
    const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
    const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const hp = (b, a) => { if (a === 0 && b === 0) return 0; const h = Math.atan2(b, a) * deg; return h < 0 ? h + 360 : h; };
    const h1p = hp(b1, a1p), h2p = hp(b2, a2p);
    const dLp = L2 - L1, dCp = C2p - C1p;
    let dhp = 0;
    if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2 * rad);
    const Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
    let hbp = h1p + h2p;
    if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
    const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.20 * Math.cos((4 * hbp - 63) * rad);
    const dTheta = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
    const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
    const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
    const Sc = 1 + 0.045 * Cbp, Sh = 1 + 0.015 * Cbp * T;
    const Rt = -Math.sin(2 * dTheta * rad) * Rc;
    return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
  }
  const labOf = (hsb) => rgb2lab(hsb2rgb(...hsb));
  const dE = (a, b) => deltaE2000(labOf(a), labOf(b));
  const scoreFor = (d) => Math.round(100 * Math.exp(-((d / 22) ** 1.6))) / 10;
  const isLight = (hsb) => labOf(hsb)[0] > 65;
  const NAMED_HSB = NAMED.map(([n, h]) => ({ n, hsb: rgb2hsb(hexRgb(h)), lab: rgb2lab(hexRgb(h)) }));
  function nearestName(hsb) {
    const l = labOf(hsb); let best = null, bd = 1e9;
    for (const x of NAMED_HSB) { const d = deltaE2000(l, x.lab); if (d < bd) { bd = d; best = x; } }
    return best.n;
  }
  window.__cm = { deltaE2000, rgb2lab, hsb2rgb, scoreFor, nearestName };

  let mode = settings.mode, round = 0, total = 0, results = [], raf = 0, rand = Math.random, targets = [], usedNames = new Set(), state = 'idle';
  const randomColour = () => [Math.floor(rand() * 360), 25 + Math.floor(rand() * 76), 30 + Math.floor(rand() * 71)];
  const view = (html) => { stage.innerHTML = `<div class="cm-inner">${html}</div>`; };
  const ambient = (a, b, c) => { if (a) stage.style.setProperty('--c1', a); if (b) stage.style.setProperty('--c2', b); if (c) stage.style.setProperty('--c3', c); };
  const neutral = (on) => stage.classList.toggle('is-neutral', on);
  const dots = () => `<div class="cm-dots">${Array.from({ length: ROUNDS }, (_, i) => `<i class="${i < round - 1 ? 'done' : i === round - 1 ? 'on' : ''}"></i>`).join('')}</div>`;
  const bestKey = () => (mode === 'classic' || mode === 'palette' ? `${mode}:${settings.view}` : mode);
  const paintBest = () => { const b = stats.best[bestKey()]; $('best').textContent = b == null ? '-' : C.fmt(b, 1); };
  const lock = (on) => $('bar').classList.toggle('is-locked', on);
  const chipNo = () => 'No. ' + String(1000 + Math.floor(Math.random() * 8999));

  const heroSvg = `<svg viewBox="0 0 300 170" aria-hidden="true">
    <path d="M150 12 C230 10 292 52 288 102 C285 140 250 152 226 140 C204 129 196 146 204 160 C150 172 40 166 16 116 C-6 70 60 14 150 12Z" fill="#f3e3c7" stroke="#d8c09a" stroke-width="3"/>
    <ellipse cx="226" cy="120" rx="14" ry="11" fill="var(--surface)"/>
    <circle cx="70" cy="72" r="20" fill="#ff5a36"><animate attributeName="r" values="20;22;20" dur="2.4s" repeatCount="indefinite"/></circle>
    <circle cx="118" cy="46" r="18" fill="#ffc233"><animate attributeName="r" values="18;20;18" dur="2.1s" repeatCount="indefinite"/></circle>
    <circle cx="170" cy="44" r="18" fill="#2ecc71"><animate attributeName="r" values="18;20;18" dur="2.7s" repeatCount="indefinite"/></circle>
    <circle cx="220" cy="62" r="17" fill="#3498db"><animate attributeName="r" values="17;19;17" dur="2.3s" repeatCount="indefinite"/></circle>
    <circle cx="66" cy="124" r="17" fill="#9b59b6"/><circle cx="118" cy="132" r="15" fill="#ff6fb5"/>
    <g transform="rotate(-28 200 120)"><rect x="120" y="112" width="120" height="10" rx="5" fill="#8b5a2b"/><rect x="236" y="110" width="20" height="14" rx="3" fill="#c0c7cf"/><path d="M256 110 Q280 117 256 124 Z" fill="#ff5a36"/></g>
  </svg>`;

  function intro() {
    cancelAnimationFrame(raf); state = 'idle'; lock(false); neutral(false);
    mode = settings.mode; round = 0; total = 0; results = [];
    $('round').textContent = '-'; $('total').textContent = '0'; paintBest();
    $('viewOpt').hidden = mode === 'name' || mode === 'daily';
    ambient('#ff9a8b', '#8ec5ff', '#b8f0a6');
    const today = stats.daily[FX.dayKey()];
    view(`<div class="cm-hero">${heroSvg}<h2>${mode === 'daily' ? `Daily colours #${FX.dayNumber()}` : MODES[mode].label}</h2>
      <p>${MODES[mode].desc}${mode === 'daily' && today != null ? ` You scored ${C.fmt(today, 1)} today already. Replays count toward your best.` : ''}</p>
      <button class="c-btn" id="go" type="button">Start</button>
      <p class="cm-hint">Scored with CIEDE2000, the colour-difference formula used in print and paint matching.</p></div>`);
    $('go').addEventListener('click', start);
  }

  function start() {
    mode = settings.mode; round = 0; total = 0; results = []; usedNames = new Set(); lock(true);
    rand = mode === 'daily' ? FX.rng(FX.daySeed('c')) : Math.random;
    targets = mode === 'daily' ? Array.from({ length: ROUNDS }, randomColour) : [];
    FX.sfx.whoosh();
    nextRound();
  }

  function nextRound() {
    round++;
    $('round').textContent = `${round}/${ROUNDS}`;
    if (mode === 'palette') return paletteRound();
    if (mode === 'name') {
      const pool = NAMED_HSB.filter((x) => !usedNames.has(x.n) && x.hsb[2] > 8);
      const pick = pool[Math.floor(Math.random() * pool.length)];
      usedNames.add(pick.n);
      return recreate(pick.hsb, pick.n);
    }
    const target = mode === 'daily' ? targets[round - 1] : randomColour();
    memorise(target);
  }

  function countdown(ms, light, onDone, onTick) {
    let remaining = ms, last = performance.now(), shown = 0;
    const ring = stage.querySelector('.cm-ring');
    const fg = ring?.querySelector('.fg'), txt = ring?.querySelector('text');
    cancelAnimationFrame(raf);
    const tick = (now) => {
      if (!document.hidden) remaining -= Math.min(100, now - last);
      last = now;
      if (fg) fg.style.strokeDashoffset = String(239 * (1 - Math.max(0, remaining) / ms));
      const s = Math.ceil(remaining / 1000);
      if (txt && s !== shown && s > 0) { shown = s; txt.textContent = s; FX.sfx.tone(520, 0.05, { vol: 0.05 }); }
      onTick?.(remaining);
      if (remaining <= 0) return onDone();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  const ringSvg = (light) => `<svg class="cm-ring${light ? ' dark' : ''}" viewBox="0 0 86 86"><circle class="bg" cx="43" cy="43" r="38"/><circle class="fg" cx="43" cy="43" r="38"/><text x="43" y="54" text-anchor="middle"></text></svg>`;

  function memorise(target) {
    state = 'look'; neutral(false);
    ambient(css(target), css(target), css(target));
    const ms = mode === 'daily' ? 5000 : settings.view;
    view(`${dots()}<p class="cm-label">Memorise this colour</p>
      <div class="cm-chip" style="--c:${css(target)}"><div class="cm-chip-color" role="img" aria-label="Target colour">${ringSvg(isLight(target))}</div><div class="cm-chip-label"><b>Curio Paints</b><span>${chipNo()} · ???</span></div></div>`);
    countdown(ms, isLight(target), () => recreate(target));
  }

  let dragCleanup = null;
  function makePicker(host, init, onChange) {
    dragCleanup?.(); dragCleanup = null;
    let [h, s, b] = init;
    host.innerHTML = `<div class="cm-field" id="field" tabindex="0" role="slider" aria-label="Saturation and brightness. Arrow keys adjust."><canvas width="320" height="180"></canvas><i class="cm-knob" id="knob"></i></div>
      <input type="range" class="cm-hue" id="hue" min="0" max="359" step="1" aria-label="Hue">`;
    const field = host.querySelector('#field'), cv = field.querySelector('canvas'), g = cv.getContext('2d'), knob = host.querySelector('#knob'), hue = host.querySelector('#hue');
    hue.value = h;
    function drawField() {
      g.fillStyle = `hsl(${h}, 100%, 50%)`; g.fillRect(0, 0, 320, 180);
      const wx = g.createLinearGradient(0, 0, 320, 0); wx.addColorStop(0, '#fff'); wx.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = wx; g.fillRect(0, 0, 320, 180);
      const by = g.createLinearGradient(0, 0, 0, 180); by.addColorStop(0, 'rgba(0,0,0,0)'); by.addColorStop(1, '#000');
      g.fillStyle = by; g.fillRect(0, 0, 320, 180);
    }
    function paint() {
      knob.style.left = s + '%'; knob.style.top = (100 - b) + '%'; knob.style.background = css([h, s, b]);
      hue.style.setProperty('--thumb', css([h, 100, 100]));
      field.setAttribute('aria-valuetext', `Saturation ${s}, brightness ${b}`);
      onChange([h, s, b]);
    }
    function fromPoint(e) {
      const r = field.getBoundingClientRect();
      s = Math.round(FX.clamp((e.clientX - r.left) / r.width, 0, 1) * 100);
      b = Math.round(100 - FX.clamp((e.clientY - r.top) / r.height, 0, 1) * 100);
      paint();
    }
    if (C.drag) {
      let on = false;
      const stop = C.drag(field, { start: (p) => { on = true; fromPoint(p); }, move: (p) => { if (on) fromPoint(p); }, end: () => { on = false; } });
      dragCleanup = stop;
    } else {
      let dragging = false;
      field.addEventListener('pointerdown', (e) => { dragging = true; field.setPointerCapture(e.pointerId); fromPoint(e); });
      field.addEventListener('pointermove', (e) => { if (dragging) fromPoint(e); });
      field.addEventListener('pointerup', () => { dragging = false; });
    }
    field.addEventListener('keydown', (e) => {
      const st = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') s = Math.max(0, s - st); else if (e.key === 'ArrowRight') s = Math.min(100, s + st);
      else if (e.key === 'ArrowUp') b = Math.min(100, b + st); else if (e.key === 'ArrowDown') b = Math.max(0, b - st);
      else if (e.key === '[' || e.key === ']') { h = (h + (e.key === ']' ? st * 2 : -st * 2) + 360) % 360; hue.value = h; drawField(); }
      else return;
      e.preventDefault(); paint();
    });
    hue.addEventListener('input', () => { h = +hue.value; drawField(); paint(); });
    drawField(); paint();
    return { get value() { return [h, s, b]; } };
  }

  function recreate(target, name) {
    state = 'make'; neutral(true);
    FX.sfx.tone(780, 0.08, { type: 'triangle', vol: 0.1 });
    const start = [Math.floor(Math.random() * 360), 50, 60];
    view(`${dots()}<p class="cm-label">${name ? 'Build this colour' : 'Now recreate it'}</p>
      ${name ? `<div class="cm-chip named blank"><div class="cm-chip-color">${name}</div><div class="cm-chip-label"><b>CSS named colour</b><span>#??????</span></div></div>` : ''}
      <div class="cm-work"><div class="cm-live"><div class="sw" id="live"><span id="hexv"></span><span id="hsbv"></span></div></div><div id="pick"></div>
      <button class="c-btn" id="submit" type="button">Lock it in</button>
      <p class="cm-hint">Drag or click in the square for saturation and brightness, the bar for hue. Arrows nudge it, <span class="c-kbd">[</span> <span class="c-kbd">]</span> shift the hue, <span class="c-kbd">Enter</span> locks it in.</p></div>`);
    if (!C.touchpad && !C.store.get('color-match:tiphint', false) && matchMedia('(pointer: fine)').matches) { C.store.set('color-match:tiphint', true); setTimeout(() => C.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 3200), 600); }
    const live = $('live');
    const p = makePicker($('pick'), start, (v) => {
      live.style.background = css(v); live.style.color = isLight(v) ? '#111' : '#fff';
      $('hexv').textContent = hex(v); $('hsbv').textContent = `H${v[0]} S${v[1]} B${v[2]}`;
    });
    $('submit').addEventListener('click', () => reveal(target, p.value, name));
  }

  function reveal(target, guess, name) {
    state = 'reveal'; neutral(false);
    const d = dE(target, guess), pts = scoreFor(d);
    total = Math.round((total + pts) * 10) / 10;
    results.push({ target, guess, d, pts });
    stats.tend.dh += ((guess[0] - target[0] + 540) % 360) - 180; stats.tend.ds += guess[1] - target[1]; stats.tend.db += guess[2] - target[2]; stats.tend.n++;
    stats.bestRound = Math.max(stats.bestRound, pts);
    $('total').textContent = C.fmt(total, 1); FX.bump($('total'));
    ambient(css(target), css(guess), css(target));
    if (pts >= 9) BADGES.unlock('nine');
    if (pts >= 9.8) BADGES.unlock('perfect');
    if (pts >= 8 && mode === 'classic' && settings.view === 1500) BADGES.unlock('glimpse');
    const verdict = pts >= 9.5 ? 'Basically telepathic.' : pts >= 8.5 ? 'Superb eye!' : pts >= 7 ? 'Close. Very close.' : pts >= 5 ? 'Same neighbourhood, different house.' : pts >= 2.5 ? 'Hmm, a distant cousin.' : 'That is... a different colour.';
    if (pts >= 9) { FX.sfx.win(); setTimeout(() => FX.burstAt(stage.querySelector('.cm-pair'), { colors: [css(target), css(guess), '#ffffff'], count: 30 }), 300); }
    else if (pts >= 5) FX.sfx.good();
    else { FX.sfx.bad(); }
    const label = (hsb) => `<small>${hex(hsb)}</small>`;
    const tc = isLight(target) ? '#111' : '#fff', gc = isLight(guess) ? '#111' : '#fff';
    const tName = name || nearestName(target);
    view(`${dots()}<div class="cm-pair" role="img" aria-label="Original colour and your colour, split diagonally">
        <div class="a" style="background:${css(target)};color:${tc}">${name ? name : 'Original'} ${label(target)}</div>
        <div class="b" style="background:${css(guess)};color:${gc}">Yours ${label(guess)}</div>
      </div>
      <div class="cm-score"><span id="pts">0.0</span><small>/10</small></div>
      <p class="cm-verdict">${verdict}</p>
      <p class="cm-meta">ΔE2000 ${d.toFixed(1)} · ${name ? 'target' : 'closest named colour'}: ${tName}${hintFor(target, guess)}</p>
      <button class="c-btn" id="next" type="button">${round < ROUNDS ? 'Next colour' : 'See results'}</button>`);
    FX.countUp($('pts'), pts, 700, (v) => v.toFixed(1));
    const n = $('next'); n.focus({ preventScroll: true });
    n.addEventListener('click', () => (round < ROUNDS ? nextRound() : finish()));
  }
  function hintFor(t, g) {
    const dh = ((g[0] - t[0] + 540) % 360) - 180, ds = g[1] - t[1], db = g[2] - t[2];
    const parts = [];
    if (Math.abs(db) >= 10) parts.push(db > 0 ? 'too bright' : 'too dark');
    if (Math.abs(ds) >= 12) parts.push(ds > 0 ? 'too vivid' : 'too dull');
    if (Math.abs(dh) >= 12 && t[1] > 15) parts.push(`hue off by ${Math.abs(dh)}°`);
    return parts.length ? ` · yours was ${parts.join(', ')}` : '';
  }

  function variants(base, n, lo, hi) {
    const out = [base], tries = 400;
    for (let t = 0; t < tries && out.length < n + 1; t++) {
      const c = [(base[0] + Math.round((Math.random() * 2 - 1) * 30) + 360) % 360, FX.clamp(base[1] + Math.round((Math.random() * 2 - 1) * 22), 8, 100), FX.clamp(base[2] + Math.round((Math.random() * 2 - 1) * 22), 15, 100)];
      const d = dE(base, c);
      if (d < lo || d > hi) continue;
      if (out.some((o) => dE(o, c) < Math.max(4, lo * 0.6))) continue;
      out.push(c);
    }
    while (out.length < n + 1) out.push([(base[0] + 40 * out.length) % 360, base[1], base[2]]);
    return C.shuffle(out);
  }

  function paletteRound() {
    state = 'look'; neutral(false);
    const size = [3, 3, 4, 4, 5][round - 1];
    const pal = [];
    while (pal.length < size) { const c = randomColour(); if (pal.every((p) => dE(p, c) > 25)) pal.push(c); }
    ambient(css(pal[0]), css(pal[1]), css(pal[2]));
    const ms = settings.view + size * 700;
    view(`${dots()}<p class="cm-label">Memorise the palette (${size} colours)</p>
      <div class="cm-pal">${pal.map((c, i) => `<div class="s" style="--c:${css(c)};animation-delay:${i * 70}ms"></div>`).join('')}</div>
      <div style="display:grid;place-items:center;margin-top:8px">${ringSvg(false).replace('cm-ring', 'cm-ring plain')}</div>`);
    countdown(ms, true, () => paletteAsk(pal, 0, 0));
  }

  function paletteAsk(pal, k, correct) {
    state = 'make'; neutral(true);
    const range = [[14, 26], [12, 22], [10, 18], [8, 15], [7, 12]][round - 1];
    const opts = variants(pal[k], 5, range[0], range[1]);
    view(`${dots()}<p class="cm-label">Which was colour ${k + 1}?</p>
      <div class="cm-pal">${pal.map((c, i) => `<div class="s ${i < k ? '' : 'q'}${i === k ? ' cur' : ''}" style="--c:${css(c)}">${i < k ? '' : i === k ? '?' : ''}</div>`).join('')}</div>
      <div class="cm-opts">${opts.map((c, i) => `<button type="button" data-i="${i}" style="--c:${css(c)}" aria-label="Option ${i + 1}"></button>`).join('')}</div>
      <p class="cm-hint">Keys <span class="c-kbd">1</span> to <span class="c-kbd">6</span> pick an option.</p>`);
    const btns = [...stage.querySelectorAll('.cm-opts button')];
    btns.forEach((b, i) => b.addEventListener('click', () => {
      if (state !== 'make') return;
      state = 'wait';
      const ok = opts[i] === pal[k];
      const right = btns[opts.indexOf(pal[k])];
      right.classList.add('right');
      if (ok) { FX.sfx.good(); FX.burstAt(b, { colors: [css(pal[k]), '#fff'], count: 16 }); } else { b.classList.add('wrong'); FX.sfx.bad(); FX.buzz(40); }
      const c2 = correct + (ok ? 1 : 0);
      stage.querySelectorAll('.cm-pal .s')[k].classList.add(ok ? 'right' : 'wrong');
      setTimeout(() => {
        if (k + 1 < pal.length) paletteAsk(pal, k + 1, c2);
        else paletteDone(pal, c2);
      }, ok ? 650 : 1100);
    }));
  }

  function paletteDone(pal, correct) {
    state = 'reveal'; neutral(false);
    const pts = Math.round((10 * correct / pal.length) * 10) / 10;
    total = Math.round((total + pts) * 10) / 10;
    results.push({ target: pal[0], guess: pal[pal.length - 1], pts, pal, correct });
    $('total').textContent = C.fmt(total, 1); FX.bump($('total'));
    if (correct === pal.length) { BADGES.unlock('pal'); FX.sfx.win(); }
    view(`${dots()}<p class="cm-label">Round ${round}</p><div class="cm-pal">${pal.map((c) => `<div class="s" style="--c:${css(c)}"></div>`).join('')}</div>
      <div class="cm-score"><span id="pts">0.0</span><small>/10</small></div>
      <p class="cm-verdict">${correct} of ${pal.length} right. ${correct === pal.length ? 'Flawless!' : correct >= pal.length - 1 ? 'So close.' : 'Those impostors were sneaky.'}</p>
      <button class="c-btn" id="next" type="button">${round < ROUNDS ? 'Next palette' : 'See results'}</button>`);
    FX.countUp($('pts'), pts, 600, (v) => v.toFixed(1));
    const n = $('next'); n.focus({ preventScroll: true });
    n.addEventListener('click', () => (round < ROUNDS ? nextRound() : finish()));
  }

  function finish() {
    state = 'done'; lock(false);
    const k = bestKey(), prev = stats.best[k];
    const isNew = prev != null && total > prev;
    if (prev == null || total > prev) stats.best[k] = total;
    if (mode === 'classic' && settings.view === 5000) C.best('total', total);
    stats.games++;
    stats.rounds.push(...results.map((r) => r.pts)); if (stats.rounds.length > 500) stats.rounds.splice(0, stats.rounds.length - 500);
    stats.recent.unshift({ m: mode, v: total, d: Date.now(), sw: results.map((r) => hex(r.target)) }); stats.recent.length = Math.min(10, stats.recent.length);
    if (mode === 'daily') { const dk = FX.dayKey(); stats.daily[dk] = Math.max(stats.daily[dk] || 0, total); BADGES.unlock('daily'); }
    saveStats();
    BADGES.unlock('first');
    if (mode === 'classic' && total >= 40) BADGES.unlock('c40');
    if (mode === 'classic' && total >= 45) BADGES.unlock('c45');
    if (mode !== 'palette' && results.every((r) => r.pts >= 8)) BADGES.unlock('steady');
    if (mode === 'palette' && total >= 50) BADGES.unlock('pal50');
    if (mode === 'name' && total >= 35) BADGES.unlock('name');
    if (stats.games >= 20) BADGES.unlock('games');
    paintBest(); tabsApi.refresh();
    if (isNew || total >= 45) { C.confetti(); FX.sfx.fanfare(); } else FX.sfx.win();
    const rank = total >= 45 ? ['🦅', 'Eagle-eyed colourist'] : total >= 38 ? ['🎨', 'Painter material'] : total >= 30 ? ['🖍️', 'Solid crayon wielder'] : total >= 20 ? ['🌈', 'Enthusiastic, if approximate'] : ['🙈', 'Colour is hard. No judgement'];
    const sum = mode === 'palette'
      ? results.map((r, i) => `<div class="p" style="animation-delay:${i * 80}ms"><div class="sw" style="grid-template-rows:repeat(${r.pal.length},1fr)">${r.pal.map((c) => `<span style="background:${css(c)}"></span>`).join('')}</div><b>${r.pts.toFixed(1)}</b></div>`).join('')
      : results.map((r, i) => `<div class="p" style="animation-delay:${i * 80}ms"><div class="sw"><span style="background:${css(r.target)}"></span><span style="background:${css(r.guess)}"></span></div><b>${r.pts.toFixed(1)}</b></div>`).join('');
    ambient(css(results[0].target), css(results[2]?.target || results[0].target), css(results[4]?.target || results[0].target));
    view(`${isNew ? '<span class="cm-tag">New personal best!</span>' : ''}<div style="font-size:52px;line-height:1.1">${rank[0]}</div>
      <h2 style="margin:4px 0">${rank[1]}</h2>
      <div class="cm-score"><span id="fin">0.0</span><small>/50</small></div>
      <p class="c-muted">${MODES[mode].label}${mode === 'daily' ? ` #${FX.dayNumber()}` : ''} · Personal best: ${C.fmt(stats.best[k], 1)}</p>
      <div class="cm-sum">${sum}</div>
      ${mode === 'palette' ? '' : '<p class="c-muted" style="font-size:13px;margin-top:-6px">Top: original · bottom: yours</p>'}
      <div class="c-row"><button class="c-btn" id="again" type="button">Play again</button><button class="c-btn c-btn--ghost" id="share" type="button">Share</button><button class="c-btn c-btn--ghost" id="modes" type="button">Modes</button></div>`);
    FX.countUp($('fin'), total, 900, (v) => C.fmt(v, 1));
    $('round').textContent = '-';
    const a = $('again'); a.focus({ preventScroll: true });
    a.addEventListener('click', start);
    $('modes').addEventListener('click', intro);
    $('share').addEventListener('click', () => {
      const sq = results.map((r) => (r.pts >= 8 ? '🟩' : r.pts >= 5 ? '🟨' : '🟥')).join('');
      FX.copy(`Color Match ${mode === 'daily' ? `daily #${FX.dayNumber()}` : `(${MODES[mode].label})`} 🎨\n${C.fmt(total, 1)}/50\n${sq}`);
    });
  }

  FX.seg($('oMode'), Object.entries(MODES).map(([v, m]) => ({ v, label: m.label })), settings.mode, (v) => { settings.mode = v; saveSettings(); intro(); }, 'Mode');
  FX.seg($('oView'), Object.entries(VIEWS).map(([v, l]) => ({ v, label: l })), settings.view, (v) => { settings.view = +v; saveSettings(); intro(); }, 'Look time');

  FX.onKey((e) => {
    if (e.repeat) return;
    if (state === 'make' && mode === 'palette' && /^[1-6]$/.test(e.key)) { stage.querySelectorAll('.cm-opts button')[+e.key - 1]?.click(); return; }
    if (e.key === 'Enter') {
      const b = $('submit') || (state === 'reveal' || state === 'done' || state === 'idle' ? stage.querySelector('.c-btn') : null);
      if (b && document.activeElement !== b && !(document.activeElement?.tagName === 'BUTTON')) { e.preventDefault(); b.click(); }
    }
    if (e.key === 'Escape' && state !== 'idle') intro();
  });

  const tabsApi = FX.tabs($('tabs'), [
    { id: 'how', label: 'How to play', render(p) {
      p.innerHTML = `<ul class="fx-howto">
        <li><i>👀</i><div><b>Look</b><p>A paint chip appears for a few seconds. Try naming it in your head: "dusty teal", "angry tomato".</p></div></li>
        <li><i>🎛️</i><div><b>Rebuild</b><p>Pick the hue on the rainbow bar, then drag in the square: left to right is saturation, bottom to top is brightness.</p></div></li>
        <li><i>📏</i><div><b>Scoring</b><p>Points come from ΔE2000, a standard measure of how different two colours look to people. Around 1 is barely noticeable; above 10 most people see a clearly different colour.</p></div></li>
        <li><i>🧠</i><div><b>Why is this hard?</b><p>Colour memory drifts toward the "typical" version of a colour, and surrounding light changes how we see it. Giving a colour a specific name in your head can help you hold on to it.</p></div></li>
      </ul><div class="fx-keys"><span><span class="c-kbd">Enter</span> lock in / next</span><span>Arrows nudge the picker, <span class="c-kbd">[</span> <span class="c-kbd">]</span> hue</span><span><span class="c-kbd">1</span> to <span class="c-kbd">6</span> palette picks</span></div>`;
    } },
    { id: 'stats', label: 'Stats', render(p) {
      const r = stats.rounds, avg = r.length ? (r.reduce((a, b) => a + b, 0) / r.length).toFixed(1) : '-';
      const t = stats.tend, n = t.n || 1;
      const lean = [];
      if (t.n >= 3) {
        if (Math.abs(t.db / n) >= 4) lean.push(`you go ${t.db > 0 ? 'brighter' : 'darker'} than the real colour (${Math.abs(t.db / n).toFixed(0)} points on average)`);
        if (Math.abs(t.ds / n) >= 4) lean.push(`you make colours ${t.ds > 0 ? 'more vivid' : 'duller'} than they are`);
      }
      const b = []; for (let v = 0; v < 10; v++) b.push({ label: `${v}`, n: r.filter((x) => Math.floor(Math.min(9.99, x)) === v).length });
      p.innerHTML = `${FX.statGrid([[stats.games, 'Games'], [avg, 'Avg round'], [stats.bestRound ? stats.bestRound.toFixed(1) : '-', 'Best round'], [stats.best['classic:5000'] != null ? C.fmt(stats.best['classic:5000'], 1) : '-', 'Best classic']])}
        <h4>Your tendency</h4><p class="c-muted" style="margin:0">${t.n < 3 ? 'Play a few rounds and we will tell you how your colour memory drifts.' : lean.length ? 'Interesting: ' + lean.join(' and ') + '.' : 'No strong bias. Your eyes are honest.'}</p>
        <h4>Round scores</h4>${r.length ? FX.histogram(b, { label: 'Round scores' }) : '<p class="c-muted">Nothing yet.</p>'}
        <h4>Best by mode</h4>${FX.statGrid(Object.entries(stats.best).map(([k, v]) => [C.fmt(v, 1), k.replace(':5000', ' 5s').replace(':3000', ' 3s').replace(':1500', ' glimpse')]))}
        <h4>Recent games</h4><div class="fx-hist-list">${stats.recent.length ? stats.recent.map((x) => `<div><span class="cm-swrow">${(x.sw || []).map((h) => `<i style="background:${h}"></i>`).join('')}</span><b>${C.fmt(x.v, 1)}</b></div>`).join('') : '<p class="c-muted">Nothing yet.</p>'}</div>`;
    } },
    { id: 'badges', label: 'Badges', render(p) { BADGES.render(p); } }
  ]);

  intro();
  window.__cmGame = { get state() { return state; }, get mode() { return mode; } };
})();
