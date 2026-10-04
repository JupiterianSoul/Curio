(() => {
  const G0 = 9.807;
  const V0 = Math.sqrt(2 * G0 * 0.5);
  const BODIES = window.PW_BODIES;
  const WHO = window.PW_WHO;
  const $ = (id) => document.getElementById(id);
  const dpr = () => Math.min(2, window.devicePixelRatio || 1);
  const KG_LB = 2.20462, KG_ST = 6.35029;
  const TYPE_LABEL = { star: 'Star', planet: 'Planet', moon: 'Moon', dwarf: 'Dwarf planet', small: 'Small body', extreme: 'Dead star' };

  const saved = Curio.store.get('pw:save', null);
  const S = {
    v: 2, kg: 70, you: 70, unit: 'kg', who: 'you', sel: 3, seen: [], badges: [], jumped: [], quizBest: 0
  };
  if (saved && saved.v === 2) Object.assign(S, saved);
  else {
    const oldU = Curio.store.get('pw:unit', 'kg'), oldW = Curio.store.get('pw:w', null);
    if (oldW) { S.unit = oldU === 'lb' ? 'lb' : 'kg'; S.you = S.kg = oldU === 'lb' ? oldW / KG_LB : oldW; }
  }
  if (!Array.isArray(S.seen)) S.seen = [];
  if (!Array.isArray(S.badges)) S.badges = [];
  if (!Array.isArray(S.jumped)) S.jumped = [];
  S.sel = Math.max(0, Math.min(BODIES.length - 1, S.sel | 0));
  if (!WHO.find((w) => w.id === S.who)) S.who = 'you';
  if (!['kg', 'lb', 'st'].includes(S.unit)) S.unit = 'kg';
  const save = () => Curio.store.set('pw:save', S);

  const words = (n, d = 1) => {
    const a = Math.abs(n);
    if (a >= 1e15) return (n / 1e15).toLocaleString('en-US', { maximumFractionDigits: d }) + ' quadrillion';
    if (a >= 1e12) return (n / 1e12).toLocaleString('en-US', { maximumFractionDigits: d }) + ' trillion';
    if (a >= 1e9) return (n / 1e9).toLocaleString('en-US', { maximumFractionDigits: d }) + ' billion';
    if (a >= 1e6) return (n / 1e6).toLocaleString('en-US', { maximumFractionDigits: d }) + ' million';
    if (a >= 100) return Math.round(n).toLocaleString('en-US');
    if (a >= 10) return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
    if (a >= 0.1) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (a >= 0.001) return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
    return n.toExponential(1);
  };
  const toUnit = (kg) => S.unit === 'lb' ? kg * KG_LB : S.unit === 'st' ? kg / KG_ST : kg;
  const fromUnit = (v) => S.unit === 'lb' ? v / KG_LB : S.unit === 'st' ? v * KG_ST : v;
  const unitName = () => S.unit;
  const ratio = (b) => b.g / G0;
  const lenStr = (m) => {
    if (m >= 1000) return words(m / 1000) + ' km';
    if (m >= 1) return (m < 10 ? m.toFixed(2) : m < 100 ? m.toFixed(1) : Math.round(m).toLocaleString('en-US')) + ' m';
    if (m >= 0.01) return (m * 100).toFixed(1) + ' cm';
    if (m >= 1e-3) return (m * 1000).toFixed(2) + ' mm';
    if (m >= 1e-6) return (m * 1e6).toFixed(2) + ' µm';
    if (m >= 1e-9) return (m * 1e9).toFixed(2) + ' nm';
    return (m * 1e12).toFixed(2) + ' pm, smaller than an atom';
  };
  const timeStr = (s) => {
    if (s >= 3600) return (s / 3600).toFixed(1) + ' hours';
    if (s >= 120) return (s / 60).toFixed(1) + ' minutes';
    if (s >= 1) return s.toFixed(s < 10 ? 2 : 1) + ' s';
    if (s >= 1e-3) return (s * 1000).toFixed(1) + ' ms';
    if (s >= 1e-6) return (s * 1e6).toFixed(2) + ' µs';
    return (s * 1e9).toFixed(3) + ' ns';
  };
  const speedStr = (ms) => ms >= 1000 ? words(ms / 1000) + ' km/s' : ms.toFixed(ms < 10 ? 1 : 0) + ' m/s';
  const escapes = (b) => b.esc < V0;

  const globes = {};
  function globe(key, px) {
    px = Math.max(16, Math.round(px));
    const id = key + ':' + px;
    return globes[id] || (globes[id] = PlanetArt.Globe(key, px));
  }
  const queue = [];
  let qBusy = false;
  function later(fn) {
    queue.push(fn);
    if (!qBusy) { qBusy = true; setTimeout(pump, 0); }
  }
  function pump() {
    const t0 = performance.now();
    while (queue.length && performance.now() - t0 < 14) queue.shift()();
    if (queue.length) setTimeout(pump, 16); else qBusy = false;
  }
  function paintGlobe(cv, key, rot = 0.6) {
    const d = dpr();
    const css = cv.clientWidth || parseInt(cv.dataset.size || '48', 10);
    cv.width = cv.height = Math.round(css * d);
    const g = cv.getContext('2d');
    const b = PlanetArt.bodies[key];
    const rad = cv.width / 2 / (b.ring ? 2.3 : b.star ? 1.6 : 1.1);
    const gl = globe(key, rad * 2);
    g.clearRect(0, 0, cv.width, cv.height);
    gl.draw(g, cv.width / 2, cv.height / 2, rad, rot);
    return { g, gl, rad };
  }

  const cv = $('scene'), sg = cv.getContext('2d');
  let W = 0, H = 0, D = 1;
  let stars = [];
  function sizeScene() {
    D = dpr();
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = Math.round(W * D); cv.height = Math.round(H * D);
    let s = 99;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    stars = Array.from({ length: Math.round(W * H / 2200) }, () => [r() * W, r() * H * 0.75, r() * 1.4 + 0.3, r() * 6.28]);
    groundGlobe = null;
  }
  let groundGlobe = null, groundKey = '', parentGlobe = null, parentKey = '';
  function groundR() { return Math.min(W * 0.44, H * 0.62); }
  function ensureGlobes(b) {
    const R = groundR();
    const px = Math.min(420, Math.round(R * 2 * Math.min(D, 1.2)));
    if (!groundGlobe || groundKey !== b.key || groundGlobe.size !== px) { groundGlobe = globe(b.key, px); groundKey = b.key; }
    if (b.parent) {
      const pr = parentRadius(b);
      const pb = PlanetArt.bodies[b.parent];
      const ppx = Math.round(pr * 2 * D / 1);
      if (!parentGlobe || parentKey !== b.parent + ppx) { parentGlobe = globe(b.parent, ppx); parentKey = b.parent + ppx; }
      if (pb.ring) parentGlobe.ringed = true;
    } else parentGlobe = null;
  }
  const parentRadius = (b) => H * (b.key === 'io' ? 0.2 : b.parent === 'jupiter' ? 0.14 : b.key === 'charon' || b.key === 'pluto' ? 0.12 : b.key === 'phobos' ? 0.24 : 0.1);

  const jump = { on: false, t0: 0, dur: 1, px: 0, real: 0, h: 0, escape: false, land: 0, drop: 0 };
  let selT = 0;

  function drawWho(g, who, x, y, s, sq, t, body) {
    const sy = sq, sx = 1 + (1 - sq) * 0.7;
    g.save();
    g.translate(x, y);
    g.scale(sx * s, sy * s);
    const hot = body.key === 'sun';
    if (who === 'cat') {
      g.fillStyle = hot ? '#ff9a3a' : '#f29a3a';
      g.beginPath(); g.ellipse(0, -16, 20, 13, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = g.fillStyle; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(17, -18); g.quadraticCurveTo(34, -24 + Math.sin(t * 3) * 4, 28, -42); g.stroke();
      g.fillRect(-15, -8, 6, 8); g.fillRect(8, -8, 6, 8);
      g.beginPath(); g.arc(-14, -32, 12, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.moveTo(-24, -38); g.lineTo(-22, -52); g.lineTo(-14, -42); g.moveTo(-12, -42); g.lineTo(-4, -52); g.lineTo(-4, -36); g.fill();
      g.fillStyle = '#c86a1a';
      for (const k of [-6, 2, 10]) { g.fillRect(k, -28, 3, 9); }
      g.fillStyle = '#1d1b19';
      g.beginPath(); g.arc(-18, -33, 1.8, 0, Math.PI * 2); g.arc(-10, -33, 1.8, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ff7a9a'; g.beginPath(); g.arc(-14, -29, 1.5, 0, Math.PI * 2); g.fill();
    } else if (who === 'dog') {
      g.fillStyle = '#b07a46';
      g.beginPath(); g.ellipse(0, -18, 22, 13, 0, 0, Math.PI * 2); g.fill();
      g.fillRect(-17, -9, 7, 9); g.fillRect(10, -9, 7, 9);
      g.strokeStyle = '#b07a46'; g.lineWidth = 5; g.lineCap = 'round';
      g.beginPath(); g.moveTo(20, -22); g.lineTo(28, -34 + Math.sin(t * 14) * 3); g.stroke();
      g.beginPath(); g.arc(-18, -36, 13, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#7a4f2a'; g.beginPath(); g.ellipse(-28, -32, 5, 10, 0.4, 0, Math.PI * 2); g.ellipse(-8, -32, 5, 10, -0.4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#f3e3cc'; g.beginPath(); g.ellipse(-22, -30, 7, 5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1d1b19'; g.beginPath(); g.arc(-27, -31, 2.4, 0, Math.PI * 2); g.arc(-22, -39, 1.8, 0, Math.PI * 2); g.arc(-14, -39, 1.8, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ff5a6a'; g.beginPath(); g.ellipse(-24, -25, 2.5, 3.5, 0, 0, Math.PI * 2); g.fill();
    } else if (who === 'robot') {
      g.fillStyle = '#8a97a8'; g.fillRect(-14, -12, 8, 12); g.fillRect(6, -12, 8, 12);
      g.fillStyle = '#b9c4d2'; g.beginPath(); g.roundRect(-18, -40, 36, 30, 6); g.fill();
      g.fillStyle = '#5ad8ff'; g.beginPath(); g.roundRect(-11, -32, 22, 12, 3); g.fill();
      g.fillStyle = '#9aa7b8'; g.beginPath(); g.roundRect(-14, -62, 28, 22, 6); g.fill();
      g.fillStyle = '#1d1b19'; g.fillRect(-9, -55, 6, 6); g.fillRect(3, -55, 6, 6);
      g.fillStyle = '#5a6577'; g.fillRect(-1, -72, 2, 10);
      g.fillStyle = Math.sin(t * 5) > 0 ? '#ff5a36' : '#ffb199'; g.beginPath(); g.arc(0, -73, 3.5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#8a97a8'; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(-18, -34); g.lineTo(-26, -20); g.moveTo(18, -34); g.lineTo(26, -20); g.stroke();
    } else {
      g.fillStyle = '#c9d1dc'; g.beginPath(); g.roundRect(-20, -48, 12, 26, 4); g.fill();
      g.fillStyle = '#f4f6f9';
      g.beginPath(); g.roundRect(-11, -14, 9, 14, 3); g.roundRect(2, -14, 9, 14, 3); g.fill();
      g.beginPath(); g.roundRect(-14, -46, 28, 34, 8); g.fill();
      g.strokeStyle = '#f4f6f9'; g.lineWidth = 7; g.lineCap = 'round';
      const wave = jump.on ? -1 : Math.sin(t * 2) * 0.3;
      g.beginPath(); g.moveTo(-12, -40); g.lineTo(-20, -26 + wave * 8); g.moveTo(12, -40); g.lineTo(21, -27 - (jump.on ? 14 : 0)); g.stroke();
      g.fillStyle = '#ff5a36'; g.fillRect(-6, -36, 12, 8);
      g.fillStyle = '#5a6577'; g.fillRect(-11, -14, 22, 3);
      g.fillStyle = '#f4f6f9'; g.beginPath(); g.arc(0, -58, 15, 0, Math.PI * 2); g.fill();
      const vg = g.createLinearGradient(-10, -66, 10, -50);
      vg.addColorStop(0, hot ? '#ffcf4a' : '#5a8cff'); vg.addColorStop(1, hot ? '#a8320a' : '#1b2350');
      g.fillStyle = vg; g.beginPath(); g.ellipse(2, -58, 11, 8.5, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(-2, -61, 4, 2, -0.4, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }

  function drawScale(g, x, y, s, text, body) {
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 2, 40, 5, 0, 0, Math.PI * 2); g.fill();
    const sg2 = g.createLinearGradient(0, -14, 0, 0);
    sg2.addColorStop(0, '#ffffff'); sg2.addColorStop(1, '#d6dde6');
    g.fillStyle = sg2; g.beginPath(); g.roundRect(-36, -14, 72, 14, 6); g.fill();
    g.strokeStyle = '#8894a3'; g.lineWidth = 1; g.stroke();
    g.fillStyle = body.key === 'neutron' ? '#3a0a0a' : '#1b2a1e';
    g.beginPath(); g.roundRect(-17, -11.5, 34, 9, 2); g.fill();
    g.fillStyle = body.key === 'neutron' ? '#ff5a5a' : '#7dff9a';
    g.font = '800 7px ui-monospace, monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 0, -6.8, 32);
    g.restore();
  }

  function drawScene(now) {
    if (!W || !H) return;
    const b = BODIES[S.sel];
    ensureGlobes(b);
    const t = now / 1000;
    const g = sg;
    g.setTransform(D, 0, 0, D, 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, b.sky[0]); sky.addColorStop(1, b.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, W, H);
    if (b.dark) {
      for (const [x, y, r, p] of stars) { g.globalAlpha = 0.45 + 0.4 * Math.sin(t * 1.3 + p); g.fillStyle = '#fff'; g.fillRect(x, y, r, r); }
      g.globalAlpha = 1;
    } else if (b.key === 'earth') {
      g.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 0.31 + t * 0.012 * (1 + i * 0.3)) % 1.3 - 0.15) * W, cy = H * (0.12 + i * 0.07);
        g.beginPath(); g.ellipse(cx, cy, 34 + i * 6, 10, 0, 0, Math.PI * 2); g.ellipse(cx + 14, cy - 8, 18, 12, 0, 0, Math.PI * 2); g.fill();
      }
    }
    if (b.key === 'mercury') {
      const gl = g.createRadialGradient(W * 0.2, H * 0.2, 2, W * 0.2, H * 0.2, H * 0.22);
      gl.addColorStop(0, 'rgba(255,240,200,1)'); gl.addColorStop(0.25, 'rgba(255,200,80,.9)'); gl.addColorStop(1, 'rgba(255,160,40,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(W * 0.2, H * 0.2, H * 0.22, 0, Math.PI * 2); g.fill();
    }
    if (parentGlobe) {
      const pr = parentRadius(b);
      parentGlobe.draw(g, W * 0.8, H * 0.24, pr, t * 0.05);
    }
    const R = groundR();
    const cx = W / 2, top = H * 0.6, cy = top + R;
    groundGlobe.draw(g, cx, cy, R, t * 0.08, { glow: true });
    if (b.key === 'io') {
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.4 + i * 0.33) % 1;
        const a = -1.2 + i * 1.1;
        const px = cx + Math.sin(a) * R * 0.92, py = cy - Math.cos(a) * R * 0.92;
        g.fillStyle = `rgba(255,${180 - i * 30},80,${0.5 * (1 - ph)})`;
        g.beginPath(); g.ellipse(px, py - ph * 40, 6 + ph * 18, 10 + ph * 34, a, 0, Math.PI * 2); g.fill();
      }
    }
    if (b.key === 'enceladus' || b.key === 'triton') {
      for (let i = 0; i < 2; i++) {
        const a = i ? 0.9 : -0.8, px = cx + Math.sin(a) * R, py = cy - Math.cos(a) * R;
        const plume = g.createLinearGradient(px, py, px + Math.sin(a) * 90, py - Math.cos(a) * 90);
        plume.addColorStop(0, 'rgba(220,240,255,.6)'); plume.addColorStop(1, 'rgba(220,240,255,0)');
        g.fillStyle = plume; g.beginPath(); g.moveTo(px - 4, py); g.lineTo(px + Math.sin(a) * 90 - 20, py - Math.cos(a) * 90); g.lineTo(px + Math.sin(a) * 90 + 20, py - Math.cos(a) * 90); g.lineTo(px + 4, py); g.fill();
      }
    }
    if (b.key === 'titan' || b.key === 'venus' || b.key === 'mars') {
      const hz = g.createLinearGradient(0, top - 60, 0, H);
      const c = b.key === 'titan' ? '232,170,80' : b.key === 'venus' ? '240,200,130' : '240,170,130';
      hz.addColorStop(0, `rgba(${c},0)`); hz.addColorStop(0.4, `rgba(${c},.35)`); hz.addColorStop(1, `rgba(${c},.15)`);
      g.fillStyle = hz; g.fillRect(0, top - 60, W, H - top + 60);
    }

    const s = Math.max(0.75, Math.min(1.5, H / 300));
    const kgHere = S.kg * ratio(b);
    const label = kgHere >= 1e7 ? toUnit(kgHere).toExponential(1) : words(toUnit(kgHere), 1).replace(' million', 'M').replace(' billion', 'B');
    drawScale(g, cx, top + 1, s, label, b);
    const feet = top - 13 * s;
    let lift = 0, sq = 1;
    const r = ratio(b);
    const base = b.key === 'neutron' ? 0.07 : Math.max(0.35, Math.min(1.06, 1 - 0.06 * Math.log10(r)));
    sq = base;
    if (jump.on) {
      const k = (now - jump.t0) / 1000 / jump.dur;
      if (jump.escape) {
        lift = k * k * H * 1.4;
        if (k >= 1) { jump.on = false; jump.drop = now; }
      } else if (k >= 1) {
        jump.on = false; jump.land = now; landed(b);
      } else {
        lift = 4 * jump.px * k * (1 - k);
        sq = base * (k < 0.08 ? 1.08 : 1);
      }
    }
    if (jump.land) {
      const k = (now - jump.land) / 280;
      if (k < 1) sq = base * (1 - Math.sin(k * Math.PI) * Math.min(0.32, 0.1 * Math.sqrt(r)));
      else jump.land = 0;
    }
    if (jump.drop) {
      const k = (now - jump.drop) / 900;
      if (k < 1) lift = (1 - k) * (1 - k) * H * 0.9;
      else jump.drop = 0;
    }
    if (selT) {
      const k = (now - selT) / 520;
      if (k < 1) { const e = 1 - k; lift = Math.max(lift, e * e * H * 0.7); if (k > 0.85) sq = base * 0.85; }
      else selT = 0;
    }
    if (!jump.on && !jump.drop && !selT) lift += Math.sin(t * 2.2) * 0.6 * (b.key === 'neutron' ? 0 : 1);
    const shadowA = Math.max(0, 0.35 - lift / 400);
    g.fillStyle = `rgba(0,0,0,${shadowA})`; g.beginPath(); g.ellipse(cx, feet + 1, 18 * s * (1 - Math.min(0.6, lift / 300)), 3 * s, 0, 0, Math.PI * 2); g.fill();
    drawWho(g, S.who, cx, feet - lift, s, sq, t, b);
    if (jump.on && !jump.escape && jump.real > 0.3) {
      g.fillStyle = 'rgba(255,255,255,.9)'; g.font = `800 ${12 * s}px ${getComputedStyle(document.body).fontFamily}`; g.textAlign = 'left';
      const k = (now - jump.t0) / 1000 / jump.dur;
      g.fillText(`${timeStr(Math.min(jump.real, k * jump.real))}`, cx + 34 * s, feet - lift - 30 * s);
    }
    if (b.key === 'neutron') {
      g.fillStyle = 'rgba(160,200,255,.12)';
      g.fillRect(0, 0, W, H);
    }
  }

  function landed(b) {
    const r = ratio(b);
    Curio.beep(Math.max(60, 140 - Math.log10(r + 1) * 30), 0.14, 'sine', 0.22);
    try { navigator.vibrate?.(Math.min(60, 12 + r * 6)); } catch {}
  }

  function boing(b) {
    if (Curio.muted) return;
    const ac = Curio.audioContext(); if (!ac) return;
    const tt = ac.currentTime;
    const dur = Math.max(0.12, Math.min(1.2, jump.dur * 0.5));
    const o = ac.createOscillator(), gn = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(200, tt);
    o.frequency.exponentialRampToValueAtTime(jump.escape ? 1800 : 260 + 400 / Math.max(0.3, Math.sqrt(ratio(b))), tt + dur);
    gn.gain.setValueAtTime(0.0001, tt);
    gn.gain.exponentialRampToValueAtTime(0.14, tt + 0.02);
    gn.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
    o.connect(gn).connect(ac.destination); o.start(tt); o.stop(tt + dur + 0.05);
  }

  function doJump() {
    const b = BODIES[S.sel];
    if (jump.on || jump.drop) return;
    const g = b.g;
    if (b.key === 'neutron' || b.key === 'whitedwarf') {
      jump.land = performance.now();
      Curio.beep(70, 0.2, 'square', 0.08);
      Curio.toast(b.key === 'neutron' ? 'You tried. You rose about the width of an atom.' : 'You leave the ground for under two microseconds.');
      addJumped(b);
      return;
    }
    const T = 2 * V0 / g;
    const Hm = V0 * V0 / (2 * g);
    jump.escape = escapes(b);
    jump.real = T;
    jump.dur = jump.escape ? 1.6 : Math.max(0.28, Math.min(6, T));
    const s = Math.max(0.75, Math.min(1.5, H / 300));
    jump.px = Math.min(H * 0.5, 30 * s * Math.pow(Hm / 0.5, 0.42));
    jump.t0 = performance.now();
    jump.on = true;
    const ff = $('ff');
    if (jump.escape) { ff.hidden = false; ff.textContent = 'Escape velocity reached. Bye!'; }
    else if (T > 6) { ff.hidden = false; ff.textContent = `Fast-forward ×${Math.round(T / 6)} · up ${lenStr(Hm)}`; }
    else { ff.hidden = false; ff.textContent = `Up ${lenStr(Hm)} · ${timeStr(T)} in the air`; }
    clearTimeout(doJump.tt);
    doJump.tt = setTimeout(() => { ff.hidden = true; }, jump.dur * 1000 + (jump.escape ? 2600 : 1500));
    boing(b);
    addJumped(b);
    if (jump.escape) setTimeout(() => Curio.toast('Your jump beat the escape velocity. You are now a tiny moon.'), 700);
  }
  function addJumped(b) {
    if (!S.jumped.includes(b.key)) { S.jumped.push(b.key); save(); }
    if (b.key === 'moon') award('moonwalk');
    if (b.key === 'comet') award('escape');
    if (b.key === 'phobos') award('floaty');
    if (S.jumped.length >= 10) award('bouncer');
  }

  let raf = 0;
  function loop(now) {
    raf = 0;
    if (document.hidden) return;
    drawScene(now);
    animateCards(now);
    raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && !document.hidden) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', kick);

  function setWhoIcons() {
    const icons = {
      you: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#e8eef6"/><circle cx="16" cy="14" r="9" fill="#fff" stroke="#c9d1dc"/><ellipse cx="17" cy="14" rx="6.5" ry="5" fill="#2a3b7a"/><path d="M8 30q8-8 16 0" fill="#fff" stroke="#c9d1dc"/></svg>',
      cat: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#ffe6c7"/><path d="M8 10l2-6 5 5h2l5-5 2 6v9a8 8 0 0 1-16 0z" fill="#f29a3a"/><circle cx="12.5" cy="16" r="1.6" fill="#1d1b19"/><circle cx="19.5" cy="16" r="1.6" fill="#1d1b19"/><path d="M15 20h2l-1 1z" fill="#ff7a9a"/></svg>',
      dog: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#f3e3cc"/><circle cx="16" cy="17" r="9" fill="#b07a46"/><ellipse cx="7.5" cy="16" rx="3.5" ry="7" fill="#7a4f2a"/><ellipse cx="24.5" cy="16" rx="3.5" ry="7" fill="#7a4f2a"/><circle cx="13" cy="15" r="1.5" fill="#1d1b19"/><circle cx="19" cy="15" r="1.5" fill="#1d1b19"/><ellipse cx="16" cy="20" rx="2.4" ry="1.8" fill="#1d1b19"/></svg>',
      robot: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#dfe6ef"/><rect x="8" y="10" width="16" height="13" rx="3" fill="#9aa7b8"/><rect x="11" y="14" width="3" height="3" fill="#1d1b19"/><rect x="18" y="14" width="3" height="3" fill="#1d1b19"/><path d="M16 10V5" stroke="#5a6577" stroke-width="1.5"/><circle cx="16" cy="5" r="2" fill="#ff5a36"/></svg>'
    };
    const box = $('who');
    box.innerHTML = '';
    for (const w of WHO) {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.id = w.id;
      b.innerHTML = icons[w.icon] + `<span>${w.label}</span>`;
      b.addEventListener('click', () => setWho(w.id));
      box.append(b);
    }
  }
  function setWho(id) {
    if (S.who === 'you') S.you = S.kg;
    S.who = id;
    const w = WHO.find((x) => x.id === id);
    S.kg = w.kg || S.you || 70;
    if (id !== 'you') award('pets');
    save(); paintWho(); syncInput(); refresh(true);
    selT = performance.now();
    Curio.beep(520, 0.06, 'triangle', 0.1);
  }
  function paintWho() { [...$('who').children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === S.who))); }

  const input = $('w');
  function syncInput() { input.value = +toUnit(S.kg).toFixed(S.unit === 'st' ? 1 : 1); }
  function setKg(kg) {
    kg = Math.max(0.1, Math.min(100000, kg));
    S.kg = kg;
    if (S.who === 'you') S.you = kg;
    save(); refresh(false);
  }
  input.addEventListener('input', () => { const v = Number(input.value); if (v > 0) setKg(fromUnit(v)); });
  input.addEventListener('blur', syncInput);
  const step = (d) => { setKg(fromUnit(Math.max(0.1, Math.round(toUnit(S.kg)) + d))); syncInput(); Curio.beep(d > 0 ? 440 : 330, 0.05, 'triangle', 0.08); };
  let holdT = 0;
  for (const [id, d] of [['minus', -1], ['plus', 1]]) {
    const el = $(id);
    el.addEventListener('click', () => step(d));
    el.addEventListener('pointerdown', () => { clearInterval(holdT); let n = 0; holdT = setInterval(() => { if (++n > 4) step(d * (n > 20 ? 5 : 1)); }, 90); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, () => clearInterval(holdT)));
  }
  const unitBtns = document.querySelectorAll('.pw-unit button');
  const paintUnit = () => unitBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.u === S.unit)));
  function setUnit(u) { if (u === S.unit) return; S.unit = u; save(); paintUnit(); syncInput(); refresh(false); Curio.beep(600, 0.05, 'sine', 0.08); }
  unitBtns.forEach((b) => b.addEventListener('click', () => setUnit(b.dataset.u)));

  let shownW = 0, countRaf = 0;
  function countTo(target) {
    cancelAnimationFrame(countRaf);
    const from = shownW, t0 = performance.now();
    const stepF = (now) => {
      const k = Math.min(1, (now - t0) / 650), e = 1 - Math.pow(1 - k, 3);
      shownW = from + (target - from) * e;
      $('bigW').textContent = words(shownW, 1);
      if (k < 1) countRaf = requestAnimationFrame(stepF);
    };
    countRaf = requestAnimationFrame(stepF);
  }

  function facts(b) {
    const r = ratio(b);
    const T = 2 * V0 / b.g, Hm = V0 * V0 / (2 * b.g);
    const esc = escapes(b);
    const lift = 50 / r;
    return [
      ['Gravity', `${b.g >= 1e5 ? words(b.g) : b.g.toLocaleString('en-US', { maximumFractionDigits: 4 })} m/s²`],
      ['Jump height', esc ? 'Infinite: you escape!' : lenStr(Hm)],
      ['Time in the air', esc ? 'Forever' : timeStr(T)],
      ['Throw a ball up', esc ? 'It never comes back' : lenStr(400 / (2 * b.g))],
      ['Drop from 1 m', timeStr(Math.sqrt(2 / b.g))],
      ['If you can lift 50 kg', `you could lift ${words(lift)} kg`],
      ['Escape velocity', speedStr(b.esc)],
      ['A day lasts', b.day]
    ];
  }

  function refresh(animate) {
    const b = BODIES[S.sel];
    const kgHere = S.kg * ratio(b);
    if (animate) countTo(toUnit(kgHere)); else { cancelAnimationFrame(countRaf); shownW = toUnit(kgHere); $('bigW').textContent = words(shownW, 1); }
    $('bigU').textContent = unitName();
    const r = ratio(b);
    $('bigX').textContent = `${r >= 1000 ? words(r) : r < 0.01 ? r.toPrecision(2) : r.toFixed(2)} × your Earth weight`;
    $('sName').textContent = b.name;
    $('sType').textContent = b.of ? `Moon of ${b.of}` : TYPE_LABEL[b.type];
    $('facts').innerHTML = facts(b).map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    $('quip').textContent = `${b.quip} Temperature: ${b.temp}.`;
    cv.setAttribute('aria-label', `${WHO.find((w) => w.id === S.who).label} on a bathroom scale on ${b.name}, reading ${words(toUnit(kgHere))} ${unitName()}`);
    paintCards();
    paintLadder();
    [...$('strip').children].forEach((el, i) => { el.setAttribute('aria-current', String(i === S.sel)); el.classList.toggle('seen', S.seen.includes(BODIES[i].key)); });
  }

  function select(i, fromUser) {
    i = (i + BODIES.length) % BODIES.length;
    S.sel = i;
    const b = BODIES[i];
    if (!S.seen.includes(b.key)) S.seen.push(b.key);
    save();
    jump.on = false; jump.drop = 0; $('ff').hidden = true;
    selT = performance.now();
    refresh(true);
    if (fromUser) {
      Curio.beep(300 + i * 25, 0.07, 'triangle', 0.08);
      const st = $('strip').children[i];
      st?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    if (b.key === 'neutron') award('pancake');
    if (b.key === 'sun') award('toasty');
    if (S.seen.length >= 10) award('tourist');
    if (S.seen.length >= BODIES.length) award('grand');
  }

  function buildStrip() {
    const nav = $('strip');
    BODIES.forEach((b, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.innerHTML = `<canvas data-size="48" aria-hidden="true"></canvas><span>${b.name.replace(/^The /, '').replace('A neutron star', 'Neutron star')}</span>`;
      el.addEventListener('click', () => { select(i, true); });
      nav.append(el);
      later(() => paintGlobe(el.querySelector('canvas'), b.key, 0.5 + i));
    });
  }

  const FILTERS = [['all', 'All'], ['planet', 'Planets'], ['moon', 'Moons'], ['dwarf', 'Dwarfs & small'], ['extreme', 'Stars']];
  let filter = 'all', sort = 'sun';
  function buildFilters() {
    const box = $('filter');
    for (const [id, label] of FILTERS) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label; b.dataset.f = id;
      b.addEventListener('click', () => { filter = id; paintFilter(); buildCards(); Curio.beep(500, 0.04, 'sine', 0.06); });
      box.append(b);
    }
    paintFilter();
    $('sort').addEventListener('change', (e) => { sort = e.target.value; buildCards(); });
  }
  const paintFilter = () => [...$('filter').children].forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === filter)));
  const inFilter = (b) => filter === 'all' || (filter === 'planet' && b.type === 'planet') || (filter === 'moon' && b.type === 'moon') || (filter === 'dwarf' && (b.type === 'dwarf' || b.type === 'small')) || (filter === 'extreme' && (b.type === 'star' || b.type === 'extreme'));

  let cards = [];
  const vis = new Set();
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    for (const e of es) { const c = cards.find((x) => x.el === e.target); if (!c) continue; if (e.isIntersecting) vis.add(c); else vis.delete(c); }
  }, { rootMargin: '60px' }) : null;
  function buildCards() {
    const grid = $('grid');
    grid.innerHTML = ''; vis.clear(); cards.forEach((c) => io?.unobserve(c.el));
    let list = BODIES.map((b, i) => ({ b, i })).filter(({ b }) => inFilter(b));
    if (sort === 'light') list.sort((a, c) => a.b.g - c.b.g);
    else if (sort === 'heavy') list.sort((a, c) => c.b.g - a.b.g);
    else if (sort === 'az') list.sort((a, c) => a.b.name.replace(/^(The|A) /, '').localeCompare(c.b.name.replace(/^(The|A) /, '')));
    cards = list.map(({ b, i }, n) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'c-card pw-card';
      el.style.animationDelay = `${Math.min(n, 16) * 30}ms`;
      el.innerHTML = `<canvas aria-hidden="true"></canvas><div><div class="t">${b.of ? 'Moon of ' + b.of : TYPE_LABEL[b.type]}</div><h3>${b.name}</h3><div class="v"><span></span> <small></small></div><div class="x"></div><div class="bar"><i></i></div></div>`;
      el.addEventListener('click', () => { select(i, true); $('sceneWrap').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      grid.append(el);
      const c = { el, b, i, cv: el.querySelector('canvas'), v: el.querySelector('.v span'), u: el.querySelector('.v small'), x: el.querySelector('.x'), bar: el.querySelector('.bar i'), ready: null, rot: i * 0.7 };
      later(() => { c.ready = paintGlobe(c.cv, b.key, c.rot); });
      io?.observe(el);
      return c;
    });
    paintCards();
  }
  function paintCards() {
    const maxL = Math.log10(1.3e12 / 0.00017);
    for (const c of cards) {
      const r = ratio(c.b);
      c.v.textContent = words(toUnit(S.kg * r), 1);
      c.u.textContent = unitName();
      c.x.textContent = `${r >= 1000 ? words(r) : r < 0.01 ? r.toPrecision(2) : r.toFixed(2)} × Earth`;
      c.bar.style.width = `${Math.max(2, (Math.log10(c.b.g / 0.00017)) / maxL * 100)}%`;
      c.el.setAttribute('aria-current', String(c.i === S.sel));
      c.el.setAttribute('aria-label', `${c.b.name}: ${words(toUnit(S.kg * r))} ${unitName()}`);
    }
  }
  let lastCardT = 0;
  function animateCards(now) {
    if (now - lastCardT < 50) return;
    lastCardT = now;
    for (const c of vis) {
      if (!c.ready) continue;
      c.rot += 0.02;
      const { g, gl, rad } = c.ready;
      g.clearRect(0, 0, c.cv.width, c.cv.height);
      gl.draw(g, c.cv.width / 2, c.cv.height / 2, rad, c.rot);
    }
  }

  function paintLadder() {
    const box = $('ladder');
    const list = BODIES.slice().sort((a, b) => a.g - b.g);
    const lo = Math.log10(0.0001), hi = Math.log10(1.3e12);
    if (!box.children.length) {
      box.innerHTML = list.map((b) => `<div class="pw-rung${b.key === 'earth' ? ' earth' : ''}" data-k="${b.key}"><b>${b.name.replace(/^The /, '').replace('A neutron star', 'Neutron star')}</b><div class="track"><div class="fill"></div><span class="lbl"></span></div></div>`).join('');
    }
    for (const el of box.children) {
      const b = BODIES.find((x) => x.key === el.dataset.k);
      const w = (Math.log10(b.g) - lo) / (hi - lo) * 100;
      const f = el.querySelector('.fill');
      f.style.width = w + '%';
      f.style.background = b.key === BODIES[S.sel].key ? 'var(--pw)' : `color-mix(in srgb, ${b.sky[1]} 70%, var(--surface-2))`;
      el.querySelector('.lbl').textContent = `${words(toUnit(S.kg * ratio(b)), 1)} ${unitName()}`;
    }
  }

  const BADGES = [
    ['tourist', 'Tourist', 'Visit 10 worlds', '#4ea6ef', 'M12 26l8-16 8 16z'],
    ['grand', 'Grand tour', 'Visit every world', '#ffb020', 'M20 8l3.5 7.5 8 1-6 5.5 1.6 8L20 26l-7.1 4 1.6-8-6-5.5 8-1z'],
    ['moonwalk', 'Moonwalker', 'Jump on the Moon', '#b9b7b1', 'M24 10a10 10 0 1 0 6 16 12 12 0 0 1-6-16z'],
    ['floaty', 'Floaty', 'Jump on Phobos', '#a89480', 'M10 22c4-10 16-10 20 0z'],
    ['escape', 'Escape artist', 'Jump off a comet', '#5ad8ff', 'M20 6c6 6 6 16 0 22-6-6-6-16 0-22zm-7 18l-3 6 6-2zm14 0l3 6-6-2z'],
    ['pancake', 'Pancake', 'Visit a neutron star', '#7fc6ff', 'M8 22h24v4H8zM10 18h20v3H10z'],
    ['toasty', 'Toasty', 'Stand on the Sun', '#ff7a1a', 'M20 6c4 6 8 8 8 14a8 8 0 0 1-16 0c0-4 2-6 4-8 0 4 2 5 2 5 2-4 2-7 2-11z'],
    ['pets', 'Pet scientist', 'Weigh someone else', '#f29a3a', 'M14 16a3 3 0 1 1 0-.1zM26 16a3 3 0 1 1 0-.1zM12 24c2-5 14-5 16 0 0 3-4 4-8 4s-8-1-8-4z'],
    ['bouncer', 'Bouncer', 'Jump on 10 worlds', '#2ecc71', 'M20 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM12 30c2-8 14-8 16 0z'],
    ['quiz5', 'Sharp', '5 in a row in the quiz', '#9b59b6', 'M10 20l6 6 14-14'],
    ['quiz10', 'Gravity guru', 'Perfect quiz', '#e84393', 'M12 10h16v6a8 8 0 0 1-16 0zM17 26h6v4h-6zM14 30h12v2H14z']
  ];
  function paintBadges(newId) {
    const box = $('badges');
    box.innerHTML = BADGES.map(([id, name, how, col, d]) => {
      const got = S.badges.includes(id);
      return `<div class="pw-b${got ? '' : ' locked'}${id === newId ? ' new' : ''}" title="${how}"><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="${col}"/><circle cx="20" cy="20" r="14.5" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/><path d="${d}" fill="#fff" stroke="#fff" stroke-width="${d.includes('l6 6') ? 3.5 : 0}" stroke-linecap="round" stroke-linejoin="round" fill-opacity="${d.includes('l6 6') ? 0 : 0.95}"/></svg>${name}<small>${got ? 'Unlocked' : how}</small></div>`;
    }).join('');
    $('badgeCount').textContent = `${S.badges.length} of ${BADGES.length} unlocked`;
  }
  function award(id) {
    if (S.badges.includes(id)) return;
    S.badges.push(id); save();
    const b = BADGES.find((x) => x[0] === id);
    paintBadges(id);
    Curio.toast(`Badge unlocked: ${b[1]}`);
    [660, 880, 1320].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.08), i * 90));
  }

  const quiz = { round: 0, score: 0, streak: 0, best: 0, pair: null, locked: false, on: false };
  function quizStart() {
    Object.assign(quiz, { round: 0, score: 0, streak: 0, best: 0, on: true });
    quizNext();
  }
  function quizNext() {
    quiz.locked = false;
    if (quiz.round >= 10) return quizEnd();
    let a, b;
    do { a = Curio.pick(BODIES); b = Curio.pick(BODIES); } while (a === b || Math.abs(Math.log10(a.g / b.g)) < 0.015);
    quiz.pair = [a, b];
    quiz.round++;
    const body = $('quizBody');
    body.innerHTML = `<div class="pw-qhead"><span>Round ${quiz.round} of 10</span><span>Score ${quiz.score} · streak ${quiz.streak}</span></div>
      <div class="pw-q"><button type="button" class="pw-opt" data-i="0"><canvas data-size="72" aria-hidden="true"></canvas>${a.name}<small></small></button><span class="or">or</span><button type="button" class="pw-opt" data-i="1"><canvas data-size="72" aria-hidden="true"></canvas>${b.name}<small></small></button></div>`;
    body.querySelectorAll('.pw-opt').forEach((btn) => {
      paintGlobe(btn.querySelector('canvas'), quiz.pair[btn.dataset.i].key, 0.6);
      btn.addEventListener('click', () => quizAnswer(+btn.dataset.i));
    });
  }
  function quizAnswer(i) {
    if (quiz.locked) return;
    quiz.locked = true;
    const [a, b] = quiz.pair;
    const right = (a.g > b.g ? 0 : 1) === i;
    const opts = $('quizBody').querySelectorAll('.pw-opt');
    opts.forEach((o, k) => { o.querySelector('small').textContent = `${words(toUnit(S.kg * ratio(quiz.pair[k])), 1)} ${unitName()}`; });
    opts[i].classList.add(right ? 'right' : 'wrong');
    if (!right) opts[1 - i].classList.add('right');
    if (right) {
      quiz.score++; quiz.streak++; quiz.best = Math.max(quiz.best, quiz.streak);
      Curio.beep(660, 0.08, 'triangle', 0.1); setTimeout(() => Curio.beep(990, 0.12, 'triangle', 0.1), 80);
      if (quiz.streak >= 5) award('quiz5');
    } else {
      quiz.streak = 0;
      Curio.beep(180, 0.2, 'sawtooth', 0.06);
      try { navigator.vibrate?.(40); } catch {}
    }
    setTimeout(quizNext, 1100);
  }
  function quizEnd() {
    quiz.on = false;
    const res = Curio.best('quiz', quiz.score);
    if (quiz.score === 10) { award('quiz10'); Curio.confetti(); }
    const msg = quiz.score === 10 ? 'Flawless. Newton would be proud.' : quiz.score >= 7 ? 'Strong pull. Nicely done.' : quiz.score >= 4 ? 'Not bad for a mere Earthling.' : 'Gravity is hard. Try again?';
    $('quizBody').innerHTML = `<div class="pw-qend"><b>${quiz.score}/10</b><p>${msg}<br><span class="c-muted">Best: ${res.best}/10${res.isNew ? ' · new record!' : ''} · longest streak ${quiz.best}</span></p><div class="c-row"><button class="c-btn" type="button" id="qAgain">Play again</button><button class="c-btn c-btn--ghost" type="button" id="qShare">Copy score</button></div></div>`;
    $('qAgain').addEventListener('click', quizStart);
    $('qShare').addEventListener('click', () => copy(`I scored ${quiz.score}/10 on the Zoble gravity quiz. Where would you weigh more?`));
  }
  function quizIntro() {
    const best = Curio.getBest('quiz');
    $('quizBody').innerHTML = `<div class="pw-qend"><svg viewBox="0 0 220 90" width="220" height="90" aria-hidden="true"><defs><radialGradient id="qa" cx=".35" cy=".35"><stop offset="0" stop-color="#ffd9a8"/><stop offset="1" stop-color="#c0532e"/></radialGradient><radialGradient id="qb" cx=".35" cy=".35"><stop offset="0" stop-color="#c9e4ff"/><stop offset="1" stop-color="#2a5bd6"/></radialGradient></defs><circle cx="55" cy="45" r="34" fill="url(#qa)"/><circle cx="165" cy="45" r="26" fill="url(#qb)"/><text x="110" y="52" text-anchor="middle" font-size="22" font-weight="900" fill="currentColor">?</text></svg><p class="c-muted">${best != null ? `Your best: ${best}/10` : 'Pick the world with the stronger pull.'}</p><button class="c-btn" type="button" id="qStart">Start the quiz</button></div>`;
    $('qStart').addEventListener('click', () => { quizStart(); Curio.beep(520, 0.08, 'triangle', 0.1); });
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); Curio.toast('Copied to clipboard'); }
    catch { Curio.toast('Could not copy, sorry'); }
  }
  $('share').addEventListener('click', () => {
    const pick = ['moon', 'mars', 'jupiter', 'pluto', 'neutron'].map((k) => BODIES.find((b) => b.key === k));
    const u = unitName();
    const lines = pick.map((b) => `${b.name}: ${words(toUnit(S.kg * ratio(b)), 1)} ${u}`);
    copy(`If I weigh ${words(toUnit(S.kg), 1)} ${u} on Earth...\n${lines.join('\n')}\nCurio: Weight on Other Planets`);
  });
  $('randomW').addEventListener('click', () => { let j; do j = Curio.randInt(0, BODIES.length - 1); while (j === S.sel); select(j, true); });
  $('prev').addEventListener('click', () => select(S.sel - 1, true));
  $('next').addEventListener('click', () => select(S.sel + 1, true));
  $('jump').addEventListener('click', doJump);
  $('scene').addEventListener('click', doJump);
  addEventListener('keydown', (e) => {
    if (e.target.closest('input, select, textarea')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); select(S.sel + 1, true); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); select(S.sel - 1, true); }
    else if (e.key === 'j' || e.key === 'J') doJump();
    else if (e.key === 'u' || e.key === 'U') setUnit(S.unit === 'kg' ? 'lb' : S.unit === 'lb' ? 'st' : 'kg');
    else if (e.key === '+' || e.key === '=') step(1);
    else if (e.key === '-') step(-1);
  });

  let rt = 0;
  new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(() => { sizeScene(); kick(); }, 60); }).observe($('sceneWrap'));
  sizeScene();
  setWhoIcons(); paintWho(); paintUnit(); syncInput();
  buildStrip(); buildFilters(); buildCards();
  paintBadges(); quizIntro();
  select(S.sel, false);
  kick();
})();
