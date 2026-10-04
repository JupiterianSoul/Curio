(() => {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const ph = document.getElementById('phase');
  const pctx = ph.getContext('2d');
  const intro = document.getElementById('intro');
  const main = document.getElementById('main');
  const $ = (id) => document.getElementById(id);
  const P = { l1: 1, l2: 1, m1: 1, m2: 1, g: 9.81, b: 0, speed: 1, trail: 1500 };
  const DEFAULTS = { ...P };
  const H_STEP = 1 / 1200, TRAIL_DT = 1 / 240, TRAIL_N = 1500, TAU = Math.PI * 2;
  const CHAOS_COLORS = [[8, 88], [178, 70], [44, 95]];
  const PRESETS = [
    { id: 'classic', name: 'Classic chaos', d: 'High release, wild ride', a: [2.1, 2.9] },
    { id: 'gentle', name: 'Gentle sway', d: 'Small angles look almost tame', a: [0.35, 0.45] },
    { id: 'inphase', name: 'Normal mode 1', d: 'Both arms swing together', a: [0.18, 0.18 * Math.SQRT2] },
    { id: 'antiphase', name: 'Normal mode 2', d: 'Arms swing opposite ways', a: [0.15, -0.15 * Math.SQRT2] },
    { id: 'headstand', name: 'Headstand', d: 'Balanced upside down. For now.', a: [Math.PI - 0.002, Math.PI] },
    { id: 'heavy', name: 'Heavy top', d: '5 kg up top, featherweight below', a: [1.6, 2.6], p: { m1: 5, m2: 0.3 } },
    { id: 'whip', name: 'Bullwhip', d: 'Short arm, long light tail', a: [1.9, 1.2], p: { l1: 0.6, l2: 1.4, m1: 2, m2: 0.3 } },
    { id: 'moon', name: 'On the Moon', d: '1.62 m/s², slow-motion chaos', a: [2.4, 2.4], p: { g: 1.62 } },
    { id: 'jupiter', name: 'On Jupiter', d: '24.79 m/s², frantic', a: [2.4, 2.0], p: { g: 24.79 } },
    { id: 'syrup', name: 'In syrup', d: 'Heavy damping settles it', a: [2.8, 2.2], p: { b: 0.25 } },
    { id: 'fan', name: 'Rainbow fan', d: '40 pendulums, 0.006° apart', a: [2.5, 2.5], swarm: true },
    { id: 'butterfly', name: 'Butterfly', d: 'Three twins, chaos demo', a: [2.2, 2.6], chaos: true }
  ];
  const BADGES = [
    ['flip10', '🤸 Acrobat', '10 flips in a challenge'],
    ['flip25', '🌀 Spin cycle', '25 flips in a challenge'],
    ['flip40', '🚁 Helicopter', '40 flips in a challenge'],
    ['chaos', '🦋 Butterfly effect', 'Watch twins diverge'],
    ['swarm', '🌈 Rainbow fan', 'Release a swarm'],
    ['presets', '🧪 Lab tech', 'Try 6 presets'],
    ['phase', '📈 Phase space', 'Open the phase plot'],
    ['snap', '📸 Long exposure', 'Save a snapshot']
  ];
  let W = 0, H = 0, dpr = 1, scale = 100, ox = 0, oy = 0;
  let pends = [], paused = false, trailOn = true, mode = 'single', simT = 0, trailAcc = 0, hueClock = 0;
  let drag = null, divergedAt = 0, chaosDelta = 0.001, E0 = 0, phaseOn = false;
  let theme = Curio.store.get('dp:theme', 'paper'), tmode = Curio.store.get('dp:tmode', 'rainbow');
  let badges = Curio.store.get('dp:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const tried = new Set(Curio.store.get('dp:tried', []));
  const chal = { on: false, phase: 'aim', t: 0, saved: null };
  const CHAL_T = 20;

  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('dp:badges', badges);
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => Curio.toast(`Badge: ${b[1]}`), 400);
    renderBadges();
  }
  function renderBadges() {
    $('badges').innerHTML = BADGES.map(([id, n, d]) => `<div class="badge${badges.includes(id) ? ' got' : ''}"><b>${badges.includes(id) ? n : `🔒 ${n.split(' ').slice(1).join(' ')}`}</b>${d}</div>`).join('');
  }

  function makePend(a1, a2, hue, sat) {
    return { s: [a1, a2, 0, 0], tr: new Float32Array(TRAIL_N * 2), th: new Float32Array(TRAIL_N), tv: new Float32Array(TRAIL_N), head: 0, n: 0, hue, sat, wraps: Math.round(a2 / TAU), flips: 0 };
  }
  const k1 = [0, 0, 0, 0], k2 = [0, 0, 0, 0], k3 = [0, 0, 0, 0], k4 = [0, 0, 0, 0], tmp = [0, 0, 0, 0];
  function deriv(s, out) {
    const a1 = s[0], a2 = s[1], w1 = s[2], w2 = s[3];
    const { l1, l2, m1, m2, g, b } = P;
    const d = a1 - a2, sd = Math.sin(d), cd = Math.cos(d);
    const den = 2 * m1 + m2 - m2 * Math.cos(2 * d);
    out[0] = w1; out[1] = w2;
    out[2] = (-g * (2 * m1 + m2) * Math.sin(a1) - m2 * g * Math.sin(a1 - 2 * a2) - 2 * sd * m2 * (w2 * w2 * l2 + w1 * w1 * l1 * cd)) / (l1 * den) - b * w1;
    out[3] = (2 * sd * (w1 * w1 * l1 * (m1 + m2) + g * (m1 + m2) * Math.cos(a1) + w2 * w2 * l2 * m2 * cd)) / (l2 * den) - b * w2;
  }
  function rk4(s, h) {
    deriv(s, k1);
    for (let i = 0; i < 4; i++) tmp[i] = s[i] + k1[i] * h / 2;
    deriv(tmp, k2);
    for (let i = 0; i < 4; i++) tmp[i] = s[i] + k2[i] * h / 2;
    deriv(tmp, k3);
    for (let i = 0; i < 4; i++) tmp[i] = s[i] + k3[i] * h;
    deriv(tmp, k4);
    for (let i = 0; i < 4; i++) s[i] += h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
  }
  function energy(p) {
    const [a1, a2, w1, w2] = p.s;
    const { l1, l2, m1, m2, g } = P;
    const ke = 0.5 * m1 * (l1 * w1) ** 2 + 0.5 * m2 * ((l1 * w1) ** 2 + (l2 * w2) ** 2 + 2 * l1 * l2 * w1 * w2 * Math.cos(a1 - a2));
    const pe = -(m1 + m2) * g * l1 * Math.cos(a1) - m2 * g * l2 * Math.cos(a2);
    return ke + pe;
  }
  function tip(p) {
    const x1 = P.l1 * Math.sin(p.s[0]), y1 = P.l1 * Math.cos(p.s[0]);
    return [x1, y1, x1 + P.l2 * Math.sin(p.s[1]), y1 + P.l2 * Math.cos(p.s[1])];
  }
  function pushTrail(p) {
    const t = tip(p);
    p.tr[p.head * 2] = t[2]; p.tr[p.head * 2 + 1] = t[3]; p.th[p.head] = hueClock;
    const vx = P.l1 * p.s[2] * Math.cos(p.s[0]) + P.l2 * p.s[3] * Math.cos(p.s[1]);
    const vy = -P.l1 * p.s[2] * Math.sin(p.s[0]) - P.l2 * p.s[3] * Math.sin(p.s[1]);
    p.tv[p.head] = Math.hypot(vx, vy);
    p.head = (p.head + 1) % TRAIL_N; if (p.n < TRAIL_N) p.n++;
  }
  function countFlips(p, i) {
    const w = Math.round(p.s[1] / TAU);
    if (w !== p.wraps) {
      p.flips += Math.abs(w - p.wraps); p.wraps = w;
      if (i === 0) { flipSound(); const el = $('sFlips'); el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }
    }
  }
  let lastFlipSound = 0;
  function flipSound() {
    const now = performance.now();
    if (now - lastFlipSound < 120) return;
    lastFlipSound = now;
    const ac = !Curio.muted && Curio.audioContext && Curio.audioContext();
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    const f = [523, 587, 659, 784, 880][Math.floor(Math.random() * 5)];
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.55);
    if (chal.on && chal.phase === 'run') try { navigator.vibrate && navigator.vibrate(8); } catch (e) { }
  }

  function setMode(m) {
    mode = m;
    $('bChaos').setAttribute('aria-pressed', String(m === 'chaos'));
    $('bSwarm').setAttribute('aria-pressed', String(m === 'swarm'));
  }
  function setup(a1, a2, m = mode) {
    setMode(m);
    if (m === 'chaos') pends = CHAOS_COLORS.map((c, i) => makePend(a1 + i * chaosDelta, a2, c[0], c[1]));
    else if (m === 'swarm') { const N = 40; pends = Array.from({ length: N }, (_, i) => makePend(a1 + i * 1e-4, a2, i / N * 330, 90)); award('swarm'); }
    else pends = [makePend(a1, a2, 0, 0)];
    resetClock();
  }
  function resetClock() { simT = 0; trailAcc = 0; divergedAt = 0; E0 = pends.length ? energy(pends[0]) : 0; paintChaosNote(); clearPhase(); }

  function step(dt) {
    let remaining = dt * P.speed;
    const sub = pends.length > 10 ? 1 / 600 : H_STEP;
    while (remaining > 1e-9) {
      const h = Math.min(sub, remaining);
      for (const p of pends) rk4(p.s, h);
      remaining -= h; simT += h; trailAcc += h; hueClock += h;
      if (trailAcc >= TRAIL_DT) { trailAcc -= TRAIL_DT; for (const p of pends) pushTrail(p); }
    }
    pends.forEach(countFlips);
    if (mode !== 'single' && !divergedAt && simT > 0.2) {
      const a = tip(pends[0]), c = tip(pends[pends.length - 1]);
      if (Math.hypot(a[2] - c[2], a[3] - c[3]) > 0.35 * (P.l1 + P.l2)) {
        divergedAt = simT;
        paintChaosNote();
        if (mode === 'chaos') {
          Curio.toast(`They split up after ${simT.toFixed(1)} s. A ${(chaosDelta * 2 * 180 / Math.PI).toFixed(2)}° nudge was all it took.`, 3200);
          award('chaos');
        } else Curio.toast(`The fan burst apart after ${simT.toFixed(1)} s.`, 2600);
        Curio.beep(330, 0.25, 'triangle', 0.08); setTimeout(() => Curio.beep(247, 0.35, 'triangle', 0.07), 140);
      }
    }
    if (chal.on && chal.phase === 'run') {
      chal.t += dt * P.speed;
      if (chal.t >= CHAL_T) endChallenge();
    }
  }

  function paintChaosNote() {
    const el = $('chaosNote');
    el.classList.toggle('is-on', mode !== 'single');
    if (mode === 'single') return;
    if (mode === 'swarm') { el.innerHTML = `🌈 40 pendulums, ${(1e-4 * 180 / Math.PI).toFixed(4)}° apart${divergedAt ? ` · burst at ${divergedAt.toFixed(1)} s` : ''}`; return; }
    const dots = CHAOS_COLORS.map((c) => `<i style="background:hsl(${c[0]},${c[1]}%,55%)"></i>`).join('');
    el.innerHTML = `${dots}&nbsp;${(chaosDelta * 180 / Math.PI).toFixed(3)}° apart${divergedAt ? ` · diverged at ${divergedAt.toFixed(1)} s` : ''}`;
  }

  function resize() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const phone = W < 560;
    ox = W / 2; oy = phone ? H * 0.42 : H * 0.47;
    const room = Math.min(W / 2 - 14, oy - (phone ? 70 : 40), H - oy - (phone ? 150 : 70));
    scale = Math.max(40, room / 2.6);
    const pr = ph.getBoundingClientRect();
    ph.width = Math.max(1, Math.round(pr.width * dpr)); ph.height = Math.max(1, Math.round(pr.height * dpr));
    clearPhase();
    draw();
  }

  function colors() {
    const dark = Curio.isDark();
    if (theme === 'neon') return { bg0: '#1a1030', bg1: '#05030a', grid: 'rgba(160,120,255,.08)', rod: '#f0e8ff', rodShadow: 'rgba(0,0,0,0)', pivot: '#c7b8ff', light: 62, dark: true, glow: true, ink: '#7df9ff' };
    if (theme === 'blueprint') return { bg0: '#1d5c94', bg1: '#0e3a66', grid: 'rgba(255,255,255,.12)', rod: '#ffffff', rodShadow: 'rgba(0,20,50,.35)', pivot: '#e8f2ff', light: 72, dark: true, blue: true, ink: '#ffffff' };
    if (theme === 'brass') return { bg0: '#3b2a1c', bg1: '#140c06', grid: 'rgba(255,210,140,.06)', rod: '#e3b860', rodShadow: 'rgba(0,0,0,.5)', pivot: '#e3b860', light: 60, dark: true, brass: true, ink: '#f2c46b' };
    return dark
      ? { bg0: '#14121c', bg1: '#08070c', grid: 'rgba(255,255,255,.035)', rod: '#e9e4ff', rodShadow: 'rgba(0,0,0,.5)', pivot: '#d9d3ee', light: 62, dark, ink: '#ff8a65' }
      : { bg0: '#fffaf2', bg1: '#efe6d8', grid: 'rgba(60,40,20,.05)', rod: '#2a2533', rodShadow: 'rgba(60,40,20,.18)', pivot: '#3a3445', light: 50, dark, ink: '#ff5a36' };
  }
  let C = colors();
  function applyTheme() {
    C = colors();
    main.classList.toggle('dark-scene', C.dark);
    document.querySelectorAll('#themes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === theme)));
    document.querySelectorAll('#tmodes button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === tmode)));
    clearPhase();
    draw();
  }
  addEventListener('curio:theme', applyTheme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

  const sx = (x) => ox + x * scale, sy = (y) => oy + y * scale;
  function bobR(m) { return Math.max(7, (6 + 6 * Math.cbrt(m)) * Math.min(1.25, scale / 110)); }

  function trailStyle(p, idx, a) {
    if (mode !== 'single') return `hsla(${p.hue},${p.sat}%,${C.light}%,${a})`;
    if (tmode === 'speed') { const hue = 230 - Math.min(230, p.tv[idx] * 28); return `hsla(${hue},90%,${C.light}%,${a})`; }
    if (tmode === 'mono') { ctx.globalAlpha = a; return C.ink; }
    return `hsla(${(p.th[idx] * 40) % 360},85%,${C.light}%,${a})`;
  }
  function drawTrail(p, maxN) {
    const n = Math.min(p.n, maxN);
    if (n < 2) return;
    const CH = 10;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = mode === 'swarm' ? 1.4 : mode === 'chaos' ? 1.8 : 2.4;
    const start = (p.head - n + TRAIL_N) % TRAIL_N;
    for (let c = 0; c < n - 1; c += CH) {
      const end = Math.min(n - 1, c + CH);
      ctx.beginPath();
      let idx = (start + c) % TRAIL_N;
      ctx.moveTo(sx(p.tr[idx * 2]), sy(p.tr[idx * 2 + 1]));
      for (let k = c + 1; k <= end; k++) { idx = (start + k) % TRAIL_N; ctx.lineTo(sx(p.tr[idx * 2]), sy(p.tr[idx * 2 + 1])); }
      const age = 1 - (c + CH / 2) / n;
      const a = Math.max(0, Math.pow(1 - age, 1.6)) * 0.95;
      ctx.strokeStyle = trailStyle(p, idx, a);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawPend(p, alpha, thin) {
    const t = tip(p);
    const x0 = ox, y0 = oy, x1 = sx(t[0]), y1 = sy(t[1]), x2 = sx(t[2]), y2 = sy(t[3]);
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    if (thin) {
      ctx.strokeStyle = `hsla(${p.hue},${p.sat}%,${C.light}%,.55)`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = `hsl(${p.hue},${p.sat}%,${C.light + 8}%)`;
      ctx.beginPath(); ctx.arc(x2, y2, 4.5, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
      return;
    }
    const r1 = bobR(P.m1), r2 = bobR(P.m2);
    if (C.rodShadow !== 'rgba(0,0,0,0)') {
      ctx.strokeStyle = C.rodShadow; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.moveTo(x0 + 3, y0 + 5); ctx.lineTo(x1 + 3, y1 + 5); ctx.lineTo(x2 + 3, y2 + 5); ctx.stroke();
    }
    if (C.glow) { ctx.shadowColor = '#b48cff'; ctx.shadowBlur = 14; }
    ctx.strokeStyle = C.rod; ctx.lineWidth = C.brass ? 5 : 4;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.shadowBlur = 0;
    const multi = mode === 'chaos';
    const hue2 = multi ? p.hue : tmode === 'speed' ? 230 - Math.min(230, p.tv[(p.head - 1 + TRAIL_N) % TRAIL_N] * 28) : (hueClock * 40) % 360;
    bob(x1, y1, r1, multi ? p.hue : C.brass ? 40 : C.blue ? 205 : 220, multi ? p.sat : C.brass ? 70 : 25, drag && drag.which === 1);
    bob(x2, y2, r2, C.brass && !multi ? 38 : hue2, multi ? p.sat : C.brass ? 80 : 85, drag && drag.which === 2);
    ctx.globalAlpha = 1;
  }
  function bob(x, y, r, hue, sat, active) {
    if (C.rodShadow !== 'rgba(0,0,0,0)') { ctx.fillStyle = C.rodShadow; ctx.beginPath(); ctx.arc(x + 3, y + 5, r, 0, TAU); ctx.fill(); }
    if (C.glow) { ctx.shadowColor = `hsl(${hue},100%,60%)`; ctx.shadowBlur = 24; }
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, `hsl(${hue},${sat}%,88%)`); g.addColorStop(0.55, `hsl(${hue},${sat}%,${C.dark ? 56 : 52}%)`); g.addColorStop(1, `hsl(${hue},${sat}%,${C.dark ? 36 : 34}%)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.45, r * 0.28, r * 0.16, -0.6, 0, TAU); ctx.fill();
    if (active) { ctx.strokeStyle = 'rgba(255,90,54,.85)'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.arc(x, y, r + 7, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  }

  function drawBackdrop() {
    const bg = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(W, H) * 0.8);
    bg.addColorStop(0, C.bg0); bg.addColorStop(1, C.bg1);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
    if (C.blue) {
      ctx.beginPath();
      const gs = scale / 4;
      for (let x = ox % gs; x < W; x += gs) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = oy % gs; y < H; y += gs) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.25)';
      ctx.setLineDash([6, 6]);
    }
    ctx.beginPath();
    const R = (P.l1 + P.l2) * scale;
    ctx.arc(ox, oy, R, 0, TAU); ctx.moveTo(ox + P.l1 * scale, oy); ctx.arc(ox, oy, P.l1 * scale, 0, TAU);
    ctx.stroke();
    ctx.setLineDash([]);
    if (C.blue) {
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '600 11px ui-monospace, monospace';
      ctx.fillText(`L1 ${P.l1.toFixed(2)} m`, ox + P.l1 * scale * 0.72, oy - P.l1 * scale * 0.72);
      ctx.fillText(`L1+L2 ${(P.l1 + P.l2).toFixed(2)} m`, ox + R * 0.72, oy - R * 0.72);
    }
  }
  function drawMount() {
    if (C.brass || theme === 'paper' || C.blue || C.glow) {
      ctx.fillStyle = C.pivot;
      ctx.beginPath();
      ctx.moveTo(ox - 30, oy - 16); ctx.lineTo(ox + 30, oy - 16); ctx.lineTo(ox + 12, oy - 2); ctx.lineTo(ox - 12, oy - 2); ctx.closePath();
      ctx.globalAlpha = 0.85; ctx.fill(); ctx.globalAlpha = 1;
      ctx.fillStyle = C.bg0;
      ctx.beginPath(); ctx.arc(ox - 20, oy - 12, 2, 0, TAU); ctx.arc(ox + 20, oy - 12, 2, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = C.pivot;
    ctx.beginPath(); ctx.arc(ox, oy, 7, 0, TAU); ctx.fill();
    ctx.fillStyle = C.bg0; ctx.beginPath(); ctx.arc(ox, oy, 2.6, 0, TAU); ctx.fill();
  }

  function clearPhase() {
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, ph.width, ph.height);
    pctx.strokeStyle = C.grid.replace(/[\d.]+\)$/, '.25)'); pctx.lineWidth = 1;
    pctx.beginPath(); pctx.moveTo(ph.width / 2, 0); pctx.lineTo(ph.width / 2, ph.height); pctx.moveTo(0, ph.height / 2); pctx.lineTo(ph.width, ph.height / 2); pctx.stroke();
    pctx.fillStyle = C.dark ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.45)';
    pctx.font = `${10 * dpr}px ui-monospace, monospace`;
    pctx.fillText('θ1 →', 4 * dpr, ph.height - 4 * dpr);
    pctx.fillText('θ2 ↑', 4 * dpr, 12 * dpr);
  }
  const wrap = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  function drawPhase() {
    if (!phaseOn) return;
    const w = ph.width, h = ph.height;
    const list = mode === 'swarm' ? pends.filter((_, i) => i % 8 === 0) : pends;
    for (const p of list) {
      const x = (wrap(p.s[0]) / Math.PI * 0.5 + 0.5) * w, y = (0.5 - wrap(p.s[1]) / Math.PI * 0.5) * h;
      pctx.fillStyle = mode === 'single' ? `hsl(${(hueClock * 40) % 360},85%,${C.light}%)` : `hsl(${p.hue},${p.sat}%,${C.light}%)`;
      pctx.fillRect(x - dpr * 0.8, y - dpr * 0.8, dpr * 1.6, dpr * 1.6);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackdrop();
    const maxN = mode === 'swarm' ? Math.min(P.trail, 140) : P.trail;
    if (trailOn) {
      if (C.glow) ctx.globalCompositeOperation = 'lighter';
      for (const p of pends) drawTrail(p, maxN);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (mode === 'swarm') { if (C.glow) ctx.globalCompositeOperation = 'lighter'; for (let i = pends.length - 1; i >= 0; i--) drawPend(pends[i], 1, true); ctx.globalCompositeOperation = 'source-over'; }
    else for (let i = pends.length - 1; i >= 0; i--) drawPend(pends[i], mode === 'chaos' ? 0.92 : 1);
    drawMount();
    drawPhase();
    $('sTime').textContent = (chal.on && chal.phase !== 'aim' ? chal.t : simT).toFixed(1);
    $('sFlips').textContent = pends.reduce((a, p) => Math.max(a, p.flips), 0);
    if (pends.length) {
      const sc = (P.m1 + P.m2) * Math.max(P.g, 0.1) * P.l1 + P.m2 * Math.max(P.g, 0.1) * P.l2;
      const d = (energy(pends[0]) - E0) / sc * 100;
      $('sEnergy').textContent = `${Math.abs(d) < 0.005 ? '0' : d.toFixed(2)}%`;
    }
    if (chal.on) {
      $('chalTime').textContent = chal.phase === 'aim' ? `${CHAL_T}.0` : Math.max(0, CHAL_T - chal.t).toFixed(1);
    }
  }

  function pointerPos(e) { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function grabAt(px, py, id) {
    if (chal.on && chal.phase !== 'aim') return;
    const t = tip(pends[0]);
    const d1 = Math.hypot(px - sx(t[0]), py - sy(t[1])), d2 = Math.hypot(px - sx(t[2]), py - sy(t[3]));
    const lim = Math.max(70, bobR(2) * 3);
    if (Math.min(d1, d2) > lim) return;
    drag = { which: d2 <= d1 ? 2 : 1, id };
    cv.classList.add('is-dragging');
    intro.classList.add('is-faded');
    dragTo(px, py);
    Curio.beep(440, 0.05, 'sine', 0.05);
  }
  Curio.drag(cv, {
    start: (p) => grabAt(p.x, p.y, 'ptr'),
    move: (p) => { if (drag) dragTo(p.x, p.y); },
    end: () => endDrag()
  });
  function dragTo(px, py) {
    const base = pends[0];
    if (drag.which === 1) base.s[0] = Math.atan2(px - ox, py - oy);
    else { const t = tip(base); base.s[1] = Math.atan2(px - sx(t[0]), py - sy(t[1])); }
    const d = mode === 'swarm' ? 1e-4 : chaosDelta;
    pends.forEach((p, i) => { p.s[0] = base.s[0] + i * d; p.s[1] = base.s[1]; p.s[2] = 0; p.s[3] = 0; p.n = 0; p.flips = 0; p.wraps = Math.round(p.s[1] / TAU); });
    resetClock();
  }
  cv.addEventListener('pointermove', (e) => {
    if (drag) return;
    if (e.pointerType === 'mouse') {
      const [px, py] = pointerPos(e), t = tip(pends[0]);
      const near = Math.min(Math.hypot(px - sx(t[0]), py - sy(t[1])), Math.hypot(px - sx(t[2]), py - sy(t[3])));
      cv.style.cursor = near < Math.max(70, bobR(2) * 3) ? 'grab' : 'default';
    }
  });
  function endDrag() {
    if (!drag) return;
    drag = null; cv.classList.remove('is-dragging');
    resetClock();
    Curio.beep(660, 0.06, 'sine', 0.05);
    if (chal.on && chal.phase === 'aim') startRun();
  }
  const arrows = new Set();
  function keyLift(dt) {
    if (!arrows.size || (chal.on && chal.phase !== 'aim')) return;
    const base = pends[0], sp = 2.2 * dt;
    if (arrows.has('ArrowLeft')) base.s[0] -= sp;
    if (arrows.has('ArrowRight')) base.s[0] += sp;
    if (arrows.has('ArrowUp')) base.s[1] += sp;
    if (arrows.has('ArrowDown')) base.s[1] -= sp;
    const d = mode === 'swarm' ? 1e-4 : chaosDelta;
    pends.forEach((p, i) => { p.s[0] = base.s[0] + i * d; p.s[1] = base.s[1]; p.s[2] = 0; p.s[3] = 0; p.n = 0; p.flips = 0; p.wraps = Math.round(p.s[1] / TAU); });
    resetClock();
  }
  addEventListener('keydown', (e) => {
    if (!e.key.startsWith('Arrow') || e.target.closest?.('input')) return;
    e.preventDefault();
    if (!arrows.size) { intro.classList.add('is-faded'); drag = { which: 0, id: 'key' }; }
    arrows.add(e.key);
  });
  addEventListener('keyup', (e) => { if (!arrows.has(e.key)) return; arrows.delete(e.key); if (!arrows.size) endDrag(); });

  function randomDrop() {
    if (chal.on) { Curio.toast('In the challenge you pick the drop. Drag a bob!'); return; }
    const a1 = Curio.rand(1.6, 3.0) * Curio.pick([-1, 1]), a2 = a1 + Curio.rand(-1.2, 1.2);
    setup(a1, a2);
    intro.classList.add('is-faded');
  }
  function setPaused(v) { paused = v; $('bPause').setAttribute('aria-pressed', String(paused)); $('bPause').textContent = paused ? '▶ Play' : '⏸ Pause'; }

  const sliders = [];
  function setParam(key, v) {
    const s = sliders.find((x) => x.key === key);
    if (!s) return;
    s.el.value = v; s.apply();
  }
  function applyPreset(pr) {
    if (chal.on) toggleChallenge(false);
    for (const k of ['l1', 'l2', 'm1', 'm2', 'g', 'b']) setParam(k, (pr.p && pr.p[k] != null) ? pr.p[k] : DEFAULTS[k]);
    setup(pr.a[0], pr.a[1], pr.swarm ? 'swarm' : pr.chaos ? 'chaos' : 'single');
    setPaused(false);
    intro.classList.add('is-faded');
    document.querySelectorAll('.preset').forEach((b) => b.classList.toggle('on', b.dataset.id === pr.id));
    tried.add(pr.id); Curio.store.set('dp:tried', [...tried]);
    if (tried.size >= 6) award('presets');
    Curio.toast(`${pr.name}: ${pr.d}`);
    [392, 523].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.06, 'triangle', 0.06), i * 70));
  }

  function toggleChallenge(on) {
    chal.on = on;
    $('bChal').setAttribute('aria-pressed', String(on));
    $('chal').classList.toggle('hidden', !on);
    sliders.forEach((s) => { s.el.disabled = on && s.key !== 'trail'; });
    if (on) {
      chal.saved = {};
      for (const k of ['l1', 'l2', 'm1', 'm2', 'g', 'b', 'speed']) { chal.saved[k] = P[k]; setParam(k, DEFAULTS[k]); }
      chal.phase = 'aim'; chal.t = 0;
      setup(0.001, 0.001, 'single');
      setPaused(false);
      $('chal').classList.remove('live');
      $('chalMsg').textContent = 'Drag a bob up high and let go. Count starts on release: you get 20 seconds of flips.';
      intro.classList.add('is-faded');
    } else if (chal.saved) {
      for (const k in chal.saved) setParam(k, chal.saved[k]);
      chal.saved = null;
    }
  }
  function startRun() {
    chal.phase = 'run'; chal.t = 0;
    pends[0].flips = 0; pends[0].wraps = Math.round(pends[0].s[1] / TAU); E0 = energy(pends[0]);
    $('chal').classList.add('live');
    $('chalMsg').textContent = 'Flipping! Every full loop of the lower arm counts.';
    [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.07, 'triangle', 0.08), i * 80));
  }
  async function endChallenge() {
    chal.phase = 'done';
    setPaused(true);
    $('chal').classList.remove('live');
    const flips = pends[0].flips;
    const best = Curio.best('flips20', flips);
    $('chalMsg').textContent = `${flips} flips!`;
    if (flips >= 10) award('flip10');
    if (flips >= 25) award('flip25');
    if (flips >= 40) award('flip40');
    if (best.isNew && flips > 0) { Curio.confetti(); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.1), i * 90)); }
    else Curio.beep(392, 0.2, 'triangle', 0.08);
    const rating = flips >= 40 ? 'Helicopter mode. Unreal.' : flips >= 25 ? 'A spin cycle in a box.' : flips >= 10 ? 'Proper acrobatics.' : flips >= 3 ? 'A few loops. Try lifting the lower bob straight up.' : 'Barely a wobble. Lift it higher!';
    const v = await Curio.modal({ emoji: '🤸', title: `${flips} flip${flips === 1 ? '' : 's'} in ${CHAL_T} s`, body: `${rating} ${best.isNew && flips > 0 ? 'New personal best!' : `Your best: ${best.best}.`}`, buttons: [{ label: 'Try again', value: 'again' }, { label: 'Copy result', value: 'share' }, { label: 'Done', value: 'done' }] });
    if (v === 'share') {
      const txt = `🤸 Zoble Double Pendulum flip challenge: ${flips} flips in ${CHAL_T} seconds (best ${best.best}).`;
      try { await navigator.clipboard.writeText(txt); Curio.toast('Copied!'); } catch (e) { Curio.toast(txt, 4000); }
    }
    if (v === 'done') { toggleChallenge(false); setPaused(false); return; }
    toggleChallenge(true);
  }

  function snapshot() {
    const out = document.createElement('canvas');
    out.width = cv.width; out.height = cv.height;
    const o = out.getContext('2d');
    o.drawImage(cv, 0, 0);
    o.fillStyle = C.dark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)';
    o.font = `800 ${16 * dpr}px system-ui, sans-serif`;
    o.fillText('Double Pendulum · Zoble', 16 * dpr, out.height - 18 * dpr);
    try {
      const a = document.createElement('a');
      a.download = `double-pendulum-${Date.now()}.png`;
      a.href = out.toDataURL('image/png');
      a.click();
      award('snap');
      Curio.toast('Snapshot saved 📸');
      cv.animate([{ filter: 'brightness(2)' }, { filter: 'none' }], { duration: 300 });
      Curio.beep(1400, 0.04, 'square', 0.05);
    } catch (e) { Curio.toast('Could not save the image here.'); }
  }

  $('bPause').addEventListener('click', () => setPaused(!paused));
  $('bRandom').addEventListener('click', () => { randomDrop(); Curio.beep(392, 0.08, 'triangle', 0.06); });
  $('bChaos').addEventListener('click', () => {
    if (chal.on) toggleChallenge(false);
    const on = mode !== 'chaos';
    const a1 = Curio.rand(2.0, 2.6), a2 = a1 + Curio.rand(-0.3, 0.6);
    if (on) { setup(a1, a2, 'chaos'); Curio.toast('Three pendulums, started 0.057° apart. Watch them disagree.', 2800); }
    else setup(pends[0].s[0], pends[0].s[1], 'single');
    setPaused(false);
    intro.classList.add('is-faded');
  });
  $('bSwarm').addEventListener('click', () => {
    if (chal.on) toggleChallenge(false);
    if (mode === 'swarm') setup(pends[0].s[0], pends[0].s[1], 'single');
    else { setup(2.5, 2.5, 'swarm'); Curio.toast('40 pendulums, each 0.006° apart. Wait for it...', 2600); }
    setPaused(false);
    intro.classList.add('is-faded');
  });
  $('bChal').addEventListener('click', () => toggleChallenge(!chal.on));
  $('bTrail').addEventListener('click', () => { trailOn = !trailOn; $('bTrail').setAttribute('aria-pressed', String(trailOn)); });
  $('bPhase').addEventListener('click', () => {
    phaseOn = !phaseOn;
    $('bPhase').setAttribute('aria-pressed', String(phaseOn));
    ph.classList.toggle('is-on', phaseOn);
    resize();
    if (phaseOn) { award('phase'); Curio.toast('Phase portrait: each dot is the pair of angles. Order looks like loops, chaos fills the square.', 3200); }
  });
  $('bSnap').addEventListener('click', snapshot);
  $('bPanel').addEventListener('click', () => { const p = $('panel'); p.hidden = !p.hidden; $('bPanel').setAttribute('aria-pressed', String(!p.hidden)); });
  $('presets').innerHTML = PRESETS.map((p) => `<button type="button" class="preset" data-id="${p.id}"><b>${p.name}</b>${p.d}</button>`).join('');
  $('presets').addEventListener('click', (e) => { const b = e.target.closest('.preset'); if (b) applyPreset(PRESETS.find((p) => p.id === b.dataset.id)); });
  $('themes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; theme = b.dataset.k; Curio.store.set('dp:theme', theme); applyTheme(); Curio.beep(700, 0.04, 'triangle', 0.05); });
  $('tmodes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; tmode = b.dataset.k; Curio.store.set('dp:tmode', tmode); applyTheme(); Curio.beep(800, 0.04, 'triangle', 0.05); });

  const PLANETS = [[0, 'zero g'], [1.62, 'Moon'], [3.71, 'Mars'], [8.87, 'Venus'], [9.81, 'Earth'], [11.15, 'Neptune'], [24.79, 'Jupiter']];
  const defs = [
    ['L1', 'l1', (v) => `${v.toFixed(2)} m`], ['L2', 'l2', (v) => `${v.toFixed(2)} m`],
    ['M1', 'm1', (v) => `${v.toFixed(1)} kg`], ['M2', 'm2', (v) => `${v.toFixed(1)} kg`],
    ['G', 'g', (v) => { const n = PLANETS.find((p) => Math.abs(p[0] - v) < 0.12); return `${v.toFixed(2)}${n ? ` · ${n[1]}` : ''}`; }],
    ['B', 'b', (v) => (v === 0 ? 'none' : v.toFixed(2))], ['S', 'speed', (v) => `${v.toFixed(2)}×`],
    ['T', 'trail', (v) => `${Math.round(v / 240 * 10) / 10} s`]
  ];
  for (const [id, key, fmt] of defs) {
    const el = $(id), out = $('o' + id);
    const saved = Curio.store.get('dp:' + key, null);
    if (typeof saved === 'number' && isFinite(saved)) el.value = saved;
    const apply = () => {
      let v = parseFloat(el.value);
      if (id === 'G') { const n = PLANETS.find((p) => Math.abs(p[0] - v) < 0.12); if (n) v = n[0]; }
      P[key] = v; out.textContent = fmt(v);
      if (id.startsWith('L')) for (const p of pends) p.n = 0;
      if (id !== 'S' && id !== 'T' && pends.length) E0 = energy(pends[0]);
    };
    el.addEventListener('input', apply);
    el.addEventListener('change', () => Curio.store.set('dp:' + key, parseFloat(el.value)));
    sliders.push({ el, key, apply });
    apply();
  }

  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, button, select') || e.ctrlKey || e.metaKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); setPaused(!paused); }
    else if (k === 'r') $('bRandom').click();
    else if (k === 'c') $('bChaos').click();
    else if (k === 'w') $('bSwarm').click();
    else if (k === 'f') $('bChal').click();
    else if (k === 't') $('bTrail').click();
    else if (k === 'p') $('bPhase').click();
    else if (k === 's') snapshot();
  });

  let raf = 0, last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(1 / 30, (now - last) / 1000 || 0);
    last = now;
    keyLift(dt);
    if (!paused && !drag && !(chal.on && chal.phase === 'aim')) step(dt);
    draw();
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', resize);
  if (innerWidth >= 900) { $('panel').hidden = false; $('bPanel').setAttribute('aria-pressed', 'true'); }
  renderBadges();
  if (!Curio.store.get('dp:padtip', false)) { Curio.store.set('dp:padtip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar, or lift the arms with the arrow keys', 4200), 2500); }
  setup(2.1, 2.9, 'single');
  applyTheme();
  resize();
  start();

  const GM = Curio.mode;
  const life = Curio.store.get('dp:life', { flips: 0, drops: 0 });
  let flipSeen = 0;
  function paintLife() {
    $('lFlips').textContent = Curio.fmt(life.flips);
    $('lBest').textContent = Curio.getBest('flips20') ?? 0;
    $('lDrops').textContent = Curio.fmt(life.drops);
  }
  setInterval(() => {
    if (document.hidden || !pends.length) return;
    const f = pends[0].flips;
    if (f > flipSeen) { life.flips += f - flipSeen; Curio.store.set('dp:life', life); if (GM === 'advanced') paintLife(); }
    flipSeen = f;
  }, 500);
  cv.addEventListener('pointerup', () => { life.drops++; flipSeen = 0; Curio.store.set('dp:life', life); });
  const FUN = ['classic', 'heavy', 'whip', 'moon', 'jupiter', 'fan', 'butterfly', 'headstand', 'syrup'];
  let lastFun = '';
  function surprise() {
    const pool = FUN.filter((id) => id !== lastFun);
    const id = Curio.pick(pool); lastFun = id;
    applyPreset(PRESETS.find((p) => p.id === id));
    flipSeen = 0;
  }
  $('bSurprise').addEventListener('click', surprise);
  addEventListener('keydown', (e) => { if (e.target.closest?.('input, textarea') || e.ctrlKey || e.metaKey) return; if (e.key === 'g' || e.key === 'G' || (GM === 'simple' && (e.key === 'r' || e.key === 'R'))) { e.stopImmediatePropagation(); surprise(); } }, true);
  const codeOf = () => 'ZDP1.' + btoa(JSON.stringify({ p: ['l1', 'l2', 'm1', 'm2', 'g', 'b'].map((k) => +P[k].toFixed(3)), a: pends.length ? [+pends[0].s[0].toFixed(4), +pends[0].s[1].toFixed(4)] : [2, 2.5], m: mode }));
  $('bCopy').addEventListener('click', async () => {
    const c = codeOf();
    try { await navigator.clipboard.writeText(c); Curio.toast('Setup code copied'); } catch { Curio.toast(c, 5000); }
  });
  $('bPaste').addEventListener('click', async () => {
    const ta = document.createElement('textarea'); ta.className = 'dp-code'; ta.placeholder = 'Paste a ZDP1 code'; ta.setAttribute('aria-label', 'Setup code');
    const v = Curio.modal({ emoji: '📥', title: 'Paste a setup', body: ta, buttons: [{ label: 'Release it', value: 'go' }, { label: 'Cancel', value: '' }] });
    setTimeout(() => ta.focus(), 40);
    if (await v !== 'go') return;
    try {
      const t = ta.value.trim(); if (!t.startsWith('ZDP1.')) throw 0;
      const o = JSON.parse(atob(t.slice(5)));
      ['l1', 'l2', 'm1', 'm2', 'g', 'b'].forEach((k, i) => setParam(k, o.p[i]));
      setup(o.a[0], o.a[1], ['single', 'chaos', 'swarm'].includes(o.m) ? o.m : 'single');
      setPaused(false); intro.classList.add('is-faded'); Curio.toast('Setup loaded. Let it swing!');
    } catch { Curio.toast('That code did not work'); }
  });
  if (GM === 'simple') {
    for (const k of ['l1', 'l2', 'm1', 'm2', 'g', 'b', 'speed']) setParam(k, DEFAULTS[k]);
    if (!pends.length || mode !== 'single') setup(2.1, 2.9, 'single');
  } else paintLife();
  window.__dp = { get mode() { return mode; }, get pends() { return pends; }, get chal() { return chal; }, applyPreset: (id) => applyPreset(PRESETS.find((p) => p.id === id)), startRun, setTheme: (t) => { theme = t; applyTheme(); } };
})();
