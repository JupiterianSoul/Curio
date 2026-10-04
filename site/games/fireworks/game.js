(() => {
  const D = window.FIREWORKS_DATA;
  const $ = (id) => document.getElementById(id);
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const R = (a, b) => a + Math.random() * (b - a);
  const SHELL = Object.fromEntries(D.SHELLS.map((s) => [s.id, s]));
  const SCHEME = Object.fromEntries(D.SCHEMES.map((s) => [s.id, s]));
  const KINDS = D.SHELLS.map((s) => s.id).filter((k) => k !== 'text');
  const PALETTE = [0, 12, 28, 45, 55, 120, 160, 190, 210, 265, 290, 320, 340];

  const SIMPLE = Curio.simple;
  const KEY = 'fireworks:v2';
  function loadSave() {
    const base = { v: 2, launched: 0, kinds: {}, scenes: {}, shows: [], crowdBest: 0, daily: {}, ach: {}, settings: { kind: 'mix', scheme: 'mix', scene: 'harbor', text: 'WOW' } };
    const s = Curio.store.get(KEY, null);
    if (!s || s.v !== 2) return base;
    return { ...base, ...s, settings: { ...base.settings, ...(s.settings || {}) }, kinds: s.kinds || {}, scenes: s.scenes || {}, shows: Array.isArray(s.shows) ? s.shows : [], daily: s.daily || {}, ach: s.ach || {} };
  }
  const save = loadSave();
  if (!SCHEME[save.settings.scheme]) save.settings.scheme = 'mix';
  if (save.settings.kind !== 'mix' && !SHELL[save.settings.kind]) save.settings.kind = 'mix';
  if (!D.SCENES.some((s) => s.id === save.settings.scene)) save.settings.scene = 'harbor';
  let saveT = 0;
  const persist = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set(KEY, save), 300); };
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function strSeed(str) { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  const canvas = $('sky'), ctx = canvas.getContext('2d');
  const mk = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d')]; };
  const [fx, fctx] = mk(), [bgC, bctx] = mk(), [sceneC, sctx] = mk(), [glowC, gctx] = mk();
  let W = 0, H = 0, dpr = 1, waterTop = 0, waterBot = 0, sceneId = save.settings.scene, reflAlpha = 0.5;
  const GRAV = 0.045, MAX_PARTS = 6000;
  let snow = [], boats = [];

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(1.75, devicePixelRatio || 1);
    W = r.width; H = r.height;
    for (const c of [canvas, fx, bgC, sceneC]) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
    for (const c of [ctx, fctx, bctx, sctx]) c.setTransform(dpr, 0, 0, dpr, 0, 0);
    glowC.width = Math.max(1, Math.round(W / 4)); glowC.height = Math.max(1, Math.round(H / 4));
    paintScene();
  }

  function paintScene() {
    const s = sceneId, rnd = rng(strSeed(s + Math.round(W)));
    bctx.clearRect(0, 0, W, H); sctx.clearRect(0, 0, W, H);
    const sky = { harbor: ['#04020d', '#120a2e', '#2a1545', '#3a1c48'], lake: ['#020612', '#0a1a3a', '#1b2d5a', '#2c3c6a'], beach: ['#03081a', '#0b1d40', '#1d3a66', '#3a4f7a'], village: ['#03050f', '#0c1430', '#1d2850', '#33406a'] }[s];
    waterTop = { harbor: H * 0.8, lake: H * 0.76, beach: H * 0.72, village: H * 0.86 }[s];
    waterBot = s === 'beach' ? H * 0.88 : H;
    reflAlpha = s === 'village' ? 0.22 : 0.55;
    const g = bctx.createLinearGradient(0, 0, 0, waterTop);
    g.addColorStop(0, sky[0]); g.addColorStop(0.5, sky[1]); g.addColorStop(0.85, sky[2]); g.addColorStop(1, sky[3]);
    bctx.fillStyle = g; bctx.fillRect(0, 0, W, waterTop);
    for (let i = 0; i < W * H / 2600; i++) {
      bctx.globalAlpha = rnd() * 0.7 + 0.1; bctx.fillStyle = rnd() < 0.15 ? '#cfe0ff' : '#fff';
      const z = rnd() < 0.08 ? 1.7 : 1; bctx.fillRect(rnd() * W, rnd() * waterTop * 0.92, z, z);
    }
    bctx.globalAlpha = 1;
    const neb = bctx.createRadialGradient(W * 0.3, H * 0.25, 0, W * 0.3, H * 0.25, W * 0.6);
    neb.addColorStop(0, 'rgba(120,80,200,.08)'); neb.addColorStop(1, 'rgba(0,0,0,0)'); bctx.fillStyle = neb; bctx.fillRect(0, 0, W, waterTop);
    const mx = W * (s === 'lake' ? 0.2 : 0.82), my = H * 0.15, mr = Math.max(14, Math.min(W, H) * 0.035);
    const mg = bctx.createRadialGradient(mx, my, mr * 0.5, mx, my, mr * 6);
    mg.addColorStop(0, 'rgba(255,245,220,.2)'); mg.addColorStop(1, 'rgba(255,245,220,0)');
    bctx.fillStyle = mg; bctx.beginPath(); bctx.arc(mx, my, mr * 6, 0, TAU); bctx.fill();
    bctx.fillStyle = '#f6efd9'; bctx.beginPath(); bctx.arc(mx, my, mr, 0, TAU); bctx.fill();
    bctx.fillStyle = 'rgba(0,0,0,.07)'; bctx.beginPath(); bctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.25, 0, TAU); bctx.arc(mx + mr * 0.35, my + mr * 0.3, mr * 0.18, 0, TAU); bctx.fill();
    const wg = bctx.createLinearGradient(0, waterTop, 0, waterBot);
    if (s === 'village') { wg.addColorStop(0, '#2a3552'); wg.addColorStop(1, '#141a2e'); }
    else { wg.addColorStop(0, sky[2]); wg.addColorStop(0.15, '#0a0b22'); wg.addColorStop(1, '#020208'); }
    bctx.fillStyle = wg; bctx.fillRect(0, waterTop, W, waterBot - waterTop);
    const mrx = mx, mry0 = waterTop + 4;
    if (s !== 'village') for (let y = mry0; y < waterBot; y += 3) { const w = (mr * 1.6) * (1 + (y - mry0) / 60) * R(0.5, 1.2); bctx.fillStyle = `rgba(255,240,210,${0.18 * (1 - (y - mry0) / (waterBot - mry0))})`; bctx.fillRect(mrx - w / 2 + R(-4, 4), y, w, 1.5); }

    if (s === 'harbor') {
      const base = waterTop, maxH = Math.min(H * 0.26, 220);
      const far = [], near = [];
      let x = -10; while (x < W + 10) { const w = 26 + rnd() * 44; far.push([x, w, maxH * (0.35 + rnd() * 0.6)]); x += w + rnd() * 10 - 6; }
      x = -10; while (x < W + 10) { const w = 30 + rnd() * 50; near.push([x, w, maxH * (0.18 + rnd() * 0.52)]); x += w + rnd() * 14; }
      const drawRow = (row, fill, lit) => {
        for (const [bx, bw, bh] of row) {
          sctx.fillStyle = fill; sctx.fillRect(bx, base - bh, bw, bh);
          if (rnd() < 0.3) { sctx.fillRect(bx + bw / 2 - 1, base - bh - 8 - rnd() * 18, 2, 30); sctx.fillStyle = 'rgba(255,60,60,.9)'; sctx.fillRect(bx + bw / 2 - 1.5, base - bh - 26, 3, 3); sctx.fillStyle = fill; }
          if (rnd() < 0.25) { sctx.beginPath(); sctx.moveTo(bx, base - bh); sctx.lineTo(bx + bw / 2, base - bh - bw * 0.35); sctx.lineTo(bx + bw, base - bh); sctx.fill(); }
          for (let wy = base - bh + 8; wy < base - 6; wy += 11) for (let wx = bx + 5; wx < bx + bw - 7; wx += 9) {
            if (rnd() < lit) { sctx.fillStyle = rnd() < 0.8 ? 'rgba(255,214,130,.85)' : 'rgba(170,210,255,.7)'; sctx.fillRect(wx, wy, 3.5, 5); sctx.fillStyle = fill; }
          }
        }
      };
      drawRow(far, '#150d28', 0.12); drawRow(near, '#07040f', 0.2);
      sctx.fillStyle = '#05030a'; sctx.fillRect(0, base - 3, W, 4);
      for (let i = 0; i < W / 30; i++) { sctx.fillStyle = `rgba(255,${200 + rnd() * 40},140,.9)`; sctx.fillRect(i * 30 + rnd() * 8, base - 6, 2, 2); }
    } else if (s === 'lake') {
      const ridge = (yb, amp, col, n, jag) => {
        sctx.fillStyle = col; sctx.beginPath(); sctx.moveTo(0, waterTop);
        let y = yb;
        for (let x = 0; x <= W + 20; x += W / n) { y = yb - amp * (0.3 + rnd() * 0.7); sctx.lineTo(x, y); if (jag) sctx.lineTo(x + W / n / 2, y + amp * 0.25 * rnd()); }
        sctx.lineTo(W, waterTop); sctx.closePath(); sctx.fill();
      };
      ridge(waterTop - H * 0.06, H * 0.22, '#1a2550', 7, true);
      sctx.fillStyle = 'rgba(230,240,255,.18)';
      ridge(waterTop - H * 0.02, H * 0.14, '#111a3a', 10, true);
      ridge(waterTop, H * 0.06, '#0a1028', 18, false);
      for (let x = 0; x < W; x += 9 + rnd() * 10) { const h = 18 + rnd() * 34; sctx.fillStyle = '#04070f'; sctx.beginPath(); sctx.moveTo(x, waterTop - h); sctx.lineTo(x - h * 0.28, waterTop); sctx.lineTo(x + h * 0.28, waterTop); sctx.fill(); }
      sctx.fillStyle = 'rgba(255,200,120,.9)'; for (let i = 0; i < 3; i++) { const cx = W * (0.2 + rnd() * 0.6); sctx.fillRect(cx, waterTop - 7, 3, 3); }
    } else if (s === 'beach') {
      sctx.fillStyle = '#0d1530'; sctx.beginPath(); sctx.moveTo(W * 0.6, waterTop); sctx.quadraticCurveTo(W * 0.78, waterTop - H * 0.09, W * 0.98, waterTop); sctx.fill();
      const sg = sctx.createLinearGradient(0, waterBot, 0, H); sg.addColorStop(0, '#2b2438'); sg.addColorStop(1, '#120e1a');
      sctx.fillStyle = sg; sctx.beginPath(); sctx.moveTo(0, waterBot + 6); sctx.quadraticCurveTo(W * 0.5, waterBot - 10, W, waterBot + 4); sctx.lineTo(W, H); sctx.lineTo(0, H); sctx.fill();
      sctx.fillStyle = 'rgba(200,220,255,.15)'; sctx.fillRect(0, waterBot - 2, W, 1.5);
      const palm = (px, ph, lean) => {
        sctx.strokeStyle = '#06040a'; sctx.lineWidth = Math.max(5, ph * 0.04); sctx.lineCap = 'round';
        sctx.beginPath(); sctx.moveTo(px, H); sctx.quadraticCurveTo(px + lean * 0.4, H - ph * 0.6, px + lean, H - ph); sctx.stroke();
        sctx.fillStyle = '#06040a';
        for (let k = 0; k < 7; k++) {
          const a = -Math.PI / 2 + (k - 3) * 0.48 + (rnd() - 0.5) * 0.2, L = ph * (0.42 + rnd() * 0.15);
          const tx = px + lean + Math.cos(a) * L, ty = H - ph + Math.sin(a) * L * 0.6 + L * 0.35;
          sctx.beginPath(); sctx.moveTo(px + lean, H - ph);
          sctx.quadraticCurveTo(px + lean + Math.cos(a) * L * 0.5, H - ph + Math.sin(a) * L * 0.7 - 10, tx, ty);
          sctx.quadraticCurveTo(px + lean + Math.cos(a) * L * 0.55, H - ph + Math.sin(a) * L * 0.4, px + lean, H - ph + 4); sctx.fill();
        }
      };
      palm(W * 0.08, H * 0.42, W * 0.05); palm(W * 0.92, H * 0.36, -W * 0.06); if (W > 700) palm(W * 0.8, H * 0.25, -W * 0.02);
    } else if (s === 'village') {
      const hill = (y0, amp, col) => { sctx.fillStyle = col; sctx.beginPath(); sctx.moveTo(0, H); for (let x = 0; x <= W; x += 10) sctx.lineTo(x, y0 - Math.sin(x / W * 3 + amp) * H * 0.04 - amp * 4); sctx.lineTo(W, H); sctx.fill(); };
      hill(H * 0.8, 1, '#28304d'); hill(H * 0.86, 2.2, '#3a4466');
      for (let i = 0; i < Math.max(5, W / 90); i++) {
        const hx = rnd() * W, hw = 30 + rnd() * 30, hh = 22 + rnd() * 20, hy = H * 0.84 + rnd() * 6;
        sctx.fillStyle = '#0c0f1e'; sctx.fillRect(hx, hy - hh, hw, hh);
        sctx.beginPath(); sctx.moveTo(hx - 5, hy - hh); sctx.lineTo(hx + hw / 2, hy - hh - hw * 0.5); sctx.lineTo(hx + hw + 5, hy - hh); sctx.fill();
        sctx.fillStyle = '#e8eef8'; sctx.beginPath(); sctx.moveTo(hx - 5, hy - hh); sctx.lineTo(hx + hw / 2, hy - hh - hw * 0.5); sctx.lineTo(hx + hw + 5, hy - hh); sctx.lineTo(hx + hw + 5, hy - hh + 3); sctx.lineTo(hx + hw / 2, hy - hh - hw * 0.5 + 4); sctx.lineTo(hx - 5, hy - hh + 3); sctx.fill();
        sctx.fillStyle = 'rgba(255,200,110,.9)'; sctx.fillRect(hx + hw * 0.2, hy - hh * 0.65, 6, 6); if (hw > 42) sctx.fillRect(hx + hw * 0.65, hy - hh * 0.65, 6, 6);
      }
      const sg = sctx.createLinearGradient(0, waterTop, 0, H); sg.addColorStop(0, 'rgba(220,230,250,.0)'); sg.addColorStop(1, 'rgba(220,230,250,.12)');
      sctx.fillStyle = sg; sctx.fillRect(0, waterTop, W, H - waterTop);
      snow = Array.from({ length: Math.round(W / 6) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0.3 + Math.random() * 0.8, r: Math.random() * 1.6 + 0.5, p: Math.random() * 6 }));
    }
    if (s !== 'village') snow = [];
    boats = s === 'village' ? [] : Array.from({ length: Math.max(1, Math.round(W / (s === 'harbor' ? 400 : 700))) }, () => ({ x: rnd() * W, y: waterTop + 8 + rnd() * (waterBot - waterTop) * 0.35, v: (rnd() - 0.5) * 0.15, s: 0.6 + rnd() * 0.5 }));
    const sh = Math.round((waterBot - waterTop) * dpr);
    if (s !== 'beach' && sh > 0) {
      for (let y = 0; y < waterBot - waterTop; y += 2) {
        const src = waterTop - y * 1.1;
        if (src < 0) break;
        bctx.globalAlpha = 0.35 * (1 - y / (waterBot - waterTop)) * (s === 'village' ? 0.5 : 1);
        bctx.drawImage(sceneC, 0, src * dpr, W * dpr, 2 * dpr, Math.sin(y * 0.3) * 3, waterTop + y, W, 2);
      }
      bctx.globalAlpha = 1;
    }
    fctx.clearRect(0, 0, W, H);
  }

  let noiseBuf = null, master = null, hushed = false;
  function audio() {
    if (Curio.muted || hushed) return null;
    const ac = Curio.audioContext(); if (!ac) return null;
    if (!master) {
      master = ac.createDynamicsCompressor(); master.threshold.value = -18; master.ratio.value = 6; master.connect(ac.destination);
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return ac;
  }
  function noise(ac, t, { dur, freq, type = 'lowpass', vol, q = 0.7, sweep }) {
    const src = ac.createBufferSource(); src.buffer = noiseBuf; src.playbackRate.value = R(0.8, 1.2);
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (sweep) f.frequency.exponentialRampToValueAtTime(sweep, t + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  function tone(f0, f1, dur, vol, type = 'sine', delay = 0) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function boom(y, big) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime + 0.05 + (1 - y / H) * 0.25;
    noise(ac, t, { dur: big ? 2 : 1.3, freq: R(280, 520), vol: big ? 0.95 : 0.6 });
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(R(70, 95), t); o.frequency.exponentialRampToValueAtTime(32, t + 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(big ? 0.7 : 0.5, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.75);
  }
  function whoosh(whistle) {
    const ac = audio(); if (!ac) return;
    noise(ac, ac.currentTime, { dur: 0.9, freq: 500, sweep: 2400, type: 'bandpass', vol: 0.07, q: 2 });
    if (whistle) tone(R(900, 1300), R(2200, 3000), 1.1, 0.05, 'sine');
  }
  function crackle(n, delay = 0.1) {
    const ac = audio(); if (!ac) return;
    const t0 = ac.currentTime + delay;
    for (let i = 0; i < n; i++) noise(ac, t0 + Math.random() * 0.7, { dur: 0.03, freq: R(2500, 6000), type: 'highpass', vol: R(0.08, 0.2) });
  }
  function buzz() { const ac = audio(); if (!ac) return; for (let i = 0; i < 6; i++) noise(ac, ac.currentTime + 0.2 + i * 0.12, { dur: 0.3, freq: R(800, 1500), type: 'bandpass', q: 6, vol: 0.06 }); }
  function cheer(size = 1) {
    const ac = audio(); if (!ac) return;
    const t = ac.currentTime;
    for (let i = 0; i < 26 * size; i++) noise(ac, t + Math.random() * 1.4, { dur: R(0.15, 0.4), freq: R(700, 2600), type: 'bandpass', q: R(3, 8), vol: R(0.03, 0.07) * size });
    noise(ac, t, { dur: 1.8, freq: 1100, type: 'bandpass', q: 1.2, vol: 0.12 * size });
  }
  function aww() { tone(420, 260, 0.9, 0.06, 'triangle'); const ac = audio(); if (ac) noise(ac, ac.currentTime, { dur: 1, freq: 700, sweep: 400, type: 'bandpass', q: 2, vol: 0.08 }); }
  function chime(notes = [523, 659, 784, 1047]) { notes.forEach((f, i) => tone(f, f * 0.99, 0.35, 0.08, 'triangle', i * 0.08)); }

  let parts = [], rockets = [], smoke = [], flash = 0, flashHue = 0, shake = 0;
  function add(p) { if (parts.length < MAX_PARTS) parts.push(p); }
  function spark(x, y, vx, vy, color, o = {}) {
    add({ x, y, vx, vy, color, life: 1, decay: o.decay ?? R(0.009, 0.014), drag: o.drag ?? 0.975, grav: o.grav ?? GRAV, size: o.size ?? 2.4, trail: o.trail || 0, crackle: o.crackle || 0, split: o.split || 0, tw: o.tw || 0, hue: o.hue, hs: o.hs || 0, wig: o.wig || 0, sub: o.sub || 0, subHue: o.subHue, ph: Math.random() * 10 });
  }
  function colorFn(schemeId) {
    const sc = SCHEME[schemeId] || SCHEME.mix;
    const hues = sc.hues || [Curio.pick(PALETTE), Curio.pick(PALETTE)];
    return {
      hue: () => Curio.pick(hues),
      col: (h, l = 62) => sc.gold ? `hsl(${40 + R(-4, 6)},100%,${l}%)` : sc.silver ? `hsl(210,25%,${Math.min(95, l + 22)}%)` : `hsl(${h},100%,${sc.pale ? l + 12 : l}%)`,
      gold: !!sc.gold, silver: !!sc.silver
    };
  }
  function sphere(x, y, n, v, cf, o = {}, h2) {
    const h = cf.hue(), hh = h2 ?? (Math.random() < 0.4 ? cf.hue() : h);
    for (let i = 0; i < n; i++) {
      const z = Math.random() * 2 - 1, t = Math.random() * TAU, r = Math.sqrt(1 - z * z), vv = v * R(0.92, 1.05);
      spark(x, y, Math.cos(t) * r * vv, Math.sin(t) * r * vv, cf.col(i % 2 ? h : hh), { ...o, hue: i % 2 ? h : hh });
    }
  }
  function shapeBurst(x, y, pts, scale, cf, o) { const h = cf.hue(); for (const [px, py] of pts) spark(x, y, px * scale, py * scale, cf.col(h, 65), { decay: 0.01, drag: 0.965, grav: 0.018, ...o }); }
  let textPts = null, textFor = '';
  function sampleText(str) {
    if (textFor === str && textPts) return textPts;
    const c = document.createElement('canvas'); c.width = 600; c.height = 140;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.font = '900 110px ui-rounded, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    const w = Math.min(580, x.measureText(str).width);
    x.fillText(str, 300, 72, 580);
    const d = x.getImageData(0, 0, 600, 140).data, pts = [];
    const step = Math.max(4, Math.round(w / 90));
    for (let yy = 0; yy < 140; yy += step) for (let xx = 0; xx < 600; xx += step) if (d[(yy * 600 + xx) * 4 + 3] > 128) pts.push([(xx - 300) / 300, (yy - 72) / 300]);
    textPts = pts; textFor = str; return pts;
  }
  const BURST = {
    peony(x, y, s, cf) { const crack = Math.random() < 0.3; sphere(x, y, Math.round(110 * s), 4.2 * s, cf, { crackle: crack ? 1 : 0, tw: Math.random() < 0.2 ? 1 : 0 }); if (crack) crackle(18); },
    chrys(x, y, s, cf) { sphere(x, y, Math.round(90 * s), 4.4 * s, cf, { trail: 1, decay: 0.011 }); },
    dahlia(x, y, s, cf) { sphere(x, y, Math.round(42 * s), 3.3 * s, cf, { size: 4, decay: 0.0065, drag: 0.97 }); },
    willow(x, y, s) { for (let i = 0; i < Math.round(80 * s); i++) { const z = Math.random() * 2 - 1, t = Math.random() * TAU, r = Math.sqrt(1 - z * z), v = 3.6 * s * R(0.9, 1.05); spark(x, y, Math.cos(t) * r * v, Math.sin(t) * r * v, `hsl(${R(36, 46)},100%,${R(55, 68)}%)`, { decay: R(0.0045, 0.006), drag: 0.965, grav: 0.03, size: 2, trail: 1 }); } },
    palm(x, y, s, cf) { const n = 7, h = cf.gold || Math.random() < 0.5 ? null : cf.hue(); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * Math.PI * 1.25, v = 4.6 * s * R(0.95, 1.05); spark(x, y, Math.cos(a) * v, Math.sin(a) * v, h == null ? `hsl(${R(38, 46)},100%,62%)` : cf.col(h), { trail: 1, size: 4.2, decay: 0.0075, grav: 0.05, drag: 0.972 }); } sphere(x, y, 20, 1.2 * s, cf, { decay: 0.03 }); },
    ring(x, y, s, cf) { ringAt(x, y, s, cf, Math.random() < 0.5); },
    saturn(x, y, s, cf) { sphere(x, y, Math.round(50 * s), 2.2 * s, cf, { decay: 0.012 }); ringAt(x, y, s * 1.05, cf, false, R(0.15, 0.35)); },
    crossette(x, y, s, cf) { const h = cf.hue(), n = Math.round(22 * s); for (let i = 0; i < n; i++) { const a = (i / n) * TAU + Math.random() * 0.2, v = 3.4 * s * R(0.9, 1.1); spark(x, y, Math.cos(a) * v, Math.sin(a) * v, cf.col(h, 70), { split: Curio.randInt(34, 46), decay: 0.008, size: 3 }); } },
    crackle(x, y, s, cf) { const sc = cf.gold || cf.silver ? cf : colorFn(Math.random() < 0.5 ? 'gold' : 'silver'); sphere(x, y, Math.round(80 * s), 4 * s, sc, { crackle: 1, decay: 0.013 }); crackle(40, 0.6); },
    strobe(x, y, s) { for (let i = 0; i < Math.round(70 * s); i++) { const z = Math.random() * 2 - 1, t = Math.random() * TAU, r = Math.sqrt(1 - z * z), v = 3.8 * s * R(0.9, 1.05); spark(x, y, Math.cos(t) * r * v, Math.sin(t) * r * v, '#ffffff', { tw: 2, decay: 0.0075, size: 3 }); } },
    kamuro(x, y, s) { for (let i = 0; i < Math.round(160 * s); i++) { const z = Math.random() * 2 - 1, t = Math.random() * TAU, r = Math.sqrt(1 - z * z), v = 3.9 * s * R(0.85, 1.05); spark(x, y, Math.cos(t) * r * v, Math.sin(t) * r * v, `hsl(${R(36, 48)},100%,${R(60, 75)}%)`, { decay: R(0.0035, 0.005), drag: 0.955, grav: 0.022, size: 1.8, tw: 1 }); } },
    horsetail(x, y, s, cf) { const h = cf.hue(); for (let i = 0; i < Math.round(60 * s); i++) { const a = -Math.PI / 2 + R(-0.45, 0.45), v = R(2, 4.6) * s; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, cf.gold ? `hsl(42,100%,64%)` : cf.col(h), { grav: 0.065, trail: 1, decay: 0.0068, drag: 0.98 }); } },
    cluster(x, y, s, cf) { sphere(x, y, Math.round(30 * s), 2.4 * s, cf, { decay: 0.02 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + R(-0.2, 0.2), v = 3.2 * s; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, '#fff6d8', { sub: Curio.randInt(30, 44), subHue: cf.hue(), decay: 0.004, size: 2.6 }); } },
    ghost(x, y, s) { const h = Curio.pick(PALETTE); for (let i = 0; i < Math.round(100 * s); i++) { const z = Math.random() * 2 - 1, t = Math.random() * TAU, r = Math.sqrt(1 - z * z), v = 4 * s * R(0.92, 1.05); spark(x, y, Math.cos(t) * r * v, Math.sin(t) * r * v, null, { hue: h, hs: R(140, 220), decay: 0.0095 }); } },
    spiral(x, y, s, cf) { const arms = 6, per = 16, a0 = Math.random() * TAU, h = cf.hue(), h2 = cf.hue(); for (let k = 0; k < arms; k++) for (let i = 1; i <= per; i++) { const a = a0 + k / arms * TAU + i * 0.13, v = (0.4 + i * 0.26) * s; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, cf.col(k % 2 ? h : h2), { decay: 0.01, drag: 0.968, grav: 0.02, size: 2.6 }); } },
    fish(x, y, s, cf) { const h = cf.hue(); for (let i = 0; i < 26; i++) { const a = Math.random() * TAU, v = R(1.4, 3.4) * s; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, cf.col(h, 70), { wig: R(0.2, 0.35), decay: R(0.009, 0.013), drag: 0.985, grav: 0.012, trail: 1, size: 2.4 }); } buzz(); },
    heart(x, y, s, cf) { const pts = []; for (let i = 0; i < 90; i++) { const t = (i / 90) * TAU; pts.push([16 * Math.sin(t) ** 3 / 17 * 4, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 * 4]); } const h = cf.gold ? null : Curio.pick([340, 350, 0, 320]); const c2 = h == null ? cf : { ...cf, hue: () => h }; shapeBurst(x, y, pts, s, c2, {}); },
    smiley(x, y, s, cf) { const v = 4 * s, c = cf.gold ? cf.col(45, 60) : 'hsl(52,100%,60%)', o = { decay: 0.01, drag: 0.965, grav: 0.02 }; for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU; spark(x, y, Math.cos(a) * v, Math.sin(a) * v, c, o); } for (const ex of [-0.35, 0.35]) for (let i = 0; i < 7; i++) { const a = Math.random() * TAU, r = Math.random() * 0.07; spark(x, y, (ex + Math.cos(a) * r) * v, (-0.3 + Math.sin(a) * r) * v, c, o); } for (let i = 0; i <= 18; i++) { const a = 0.18 * Math.PI + (i / 18) * 0.64 * Math.PI; spark(x, y, Math.cos(a) * 0.55 * v, Math.sin(a) * 0.55 * v, c, o); } },
    starshape(x, y, s, cf) { const V = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 0.45 : 1; V.push([Math.cos(a) * r, Math.sin(a) * r]); } const pts = []; for (let k = 0; k < 10; k++) { const [ax, ay] = V[k], [bx, by] = V[(k + 1) % 10]; for (let i = 0; i < 10; i++) pts.push([(ax + (bx - ax) * i / 10) * 4, (ay + (by - ay) * i / 10) * 4]); } shapeBurst(x, y, pts, s, cf, {}); },
    butterfly(x, y, s, cf) { const h1 = cf.hue(), h2 = cf.hue(); for (let i = 0; i < 180; i++) { const t = i / 180 * 12 * Math.PI; const r = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) + Math.sin(t / 12) ** 5; const px = Math.sin(t) * r, py = -Math.cos(t) * r; spark(x, y, px * 1.05 * s, py * 1.05 * s, cf.col(px < 0 ? h1 : h2, 64), { decay: 0.0095, drag: 0.965, grav: 0.016 }); } },
    brocade(x, y, s) { for (let i = 0; i < Math.round(200 * s); i++) { const z = Math.random() * 2 - 1, t = Math.random() * TAU, r = Math.sqrt(1 - z * z), v = 5.2 * s * R(0.9, 1.04); spark(x, y, Math.cos(t) * r * v, Math.sin(t) * r * v, `hsl(${R(34, 46)},100%,${R(55, 70)}%)`, { decay: R(0.0048, 0.006), drag: 0.968, grav: 0.032, trail: 1, size: 2.4 }); } crackle(30, 1.2); },
    text(x, y, s, cf, word) { const pts = sampleText(word || save.settings.text || 'WOW'); const span = Math.min(W * 0.85, 640) / 2 / 28.6; const h = cf.hue(); for (const [px, py] of pts) spark(x, y, px * span * 1, py * span * 1, cf.col(h, 66), { decay: 0.0085, drag: 0.965, grav: 0.008, size: 2.6 }); }
  };
  function ringAt(x, y, s, cf, double, tiltIn) {
    const h = cf.hue(), tilt = tiltIn ?? R(0.2, 0.9), rot = Math.random() * TAU, n = Math.round(64 * s), v = 4 * s;
    const rings = double ? [[1, h], [0.55, (h + 180) % 360]] : [[1, h]];
    for (const [k, hh] of rings) for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, ux = Math.cos(a), uy = Math.sin(a) * tilt;
      const rx = ux * Math.cos(rot) - uy * Math.sin(rot), ry = ux * Math.sin(rot) + uy * Math.cos(rot);
      spark(x, y, rx * v * k, ry * v * k, cf.col(hh), { decay: 0.011 });
    }
  }

  let launched = 0, inAir = 0;
  const countEl = $('count'), intro = $('intro');
  function pickKind() { const k = save.settings.kind; return k === 'mix' ? Curio.pick(KINDS) : k; }
  function launch(tx, ty, opts = {}) {
    ty = Math.min(ty, waterTop - 40); ty = Math.max(ty, 46);
    tx = clamp(tx, 20, W - 20);
    const sx = clamp(tx + R(-0.06, 0.06) * W, 10, W - 10);
    const h = waterTop - ty, g = GRAV * 1.6;
    const vy = -Math.sqrt(2 * g * h), t = -vy / g;
    const kind = opts.kind || pickKind(), scheme = opts.scheme || save.settings.scheme;
    const whistle = !opts.quiet && Math.random() < 0.22;
    rockets.push({ x: sx, y: waterTop, vx: (tx - sx) / t, vy, g, kind, scheme, word: opts.word, size: R(0.92, 1.12) * clamp(Math.min(W, H) / 700, 0.75, 1.25) * (kind === 'brocade' ? 1.15 : 1), whistle, src: opts.src || 'user', quiet: !!opts.quiet });
    launched++; countEl.textContent = Curio.fmt(launched);
    if (opts.src !== 'auto') {
      save.launched++;
      save.kinds[kind] = (save.kinds[kind] || 0) + 1;
      unlock('first'); if (save.launched >= 100) unlock('hundred'); if (save.launched >= 1000) unlock('thousand');
      if (KINDS.every((k) => save.kinds[k])) unlock('alltypes');
      if (kind === 'text') unlock('text');
      if (rockets.length >= 8) unlock('salvo');
      persist();
    }
    intro.classList.add('is-faded');
    if (!opts.quiet) whoosh(whistle);
  }
  function explode(r) {
    hushed = r.quiet;
    const cf = colorFn(r.scheme);
    BURST[r.kind](r.x, r.y, r.size, cf, r.word);
    flash = Math.min(1, flash + (r.kind === 'brocade' ? 0.9 : 0.55)); flashHue = cf.gold ? 40 : cf.hue();
    for (let i = 0; i < 14; i++) spark(r.x, r.y, R(-1.2, 1.2), R(-1.2, 1.2), '#fff', { decay: 0.08, size: 3.4 });
    for (let i = 0; i < 6; i++) if (smoke.length < 140) smoke.push({ x: r.x + R(-40, 40) * r.size, y: r.y + R(-30, 40) * r.size, r: R(40, 90) * r.size, life: 1, vx: R(0.05, 0.25), vy: R(-0.05, 0.1) });
    const big = r.kind === 'brocade' || r.kind === 'willow' || r.kind === 'kamuro' || r.size > 1.1;
    boom(r.y, big);
    if (big) shake = Math.max(shake, 5);
    if (navigator.vibrate && r.src === 'user' && lastType === 'touch') navigator.vibrate(big ? 25 : 10);
    hushed = false;
    if (mode === 'crowd' && r.src === 'user') crowdBurst(r);
  }

  function update() {
    inAir = rockets.length;
    for (let i = rockets.length - 1; i >= 0; i--) {
      const r = rockets[i];
      r.x += r.vx; r.y += r.vy; r.vy += r.g;
      spark(r.x + R(-1, 1), r.y, R(-0.3, 0.3), R(0.5, 1.5), `hsl(40,100%,${R(55, 75)}%)`, { decay: R(0.04, 0.07), size: r.whistle ? 2.4 : 1.8, grav: 0.02 });
      if (r.whistle && Math.random() < 0.5) spark(r.x, r.y, R(-0.8, 0.8), R(0.2, 1), '#fff', { decay: 0.08, size: 1.4 });
      if (r.vy >= 0) { rockets.splice(i, 1); explode(r); }
    }
    let crackles = 0;
    const out = [];
    for (const p of parts) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.grav;
      if (p.wig) { const a = Math.atan2(p.vy, p.vx) + Math.PI / 2, w = Math.sin((1 - p.life) * 60 + p.ph) * p.wig; p.x += Math.cos(a) * w; p.y += Math.sin(a) * w; }
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      if (p.trail && Math.random() < 0.55) spark(p.x, p.y, 0, 0.2, p.color || `hsl(${p.hue},100%,62%)`, { decay: 0.035, size: 1.4, grav: 0.01, drag: 0.9 });
      if (p.split && --p.split === 0) {
        const a0 = Math.atan2(p.vy, p.vx) + Math.PI / 4;
        for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI / 2; spark(p.x, p.y, p.vx * 0.4 + Math.cos(a) * 2.2, p.vy * 0.4 + Math.sin(a) * 2.2, '#fff6d8', { decay: 0.02, size: 2 }); }
        crackles++; continue;
      }
      if (p.sub && --p.sub === 0) {
        for (let k = 0; k < 34; k++) { const a = Math.random() * TAU, v = R(1.2, 2); spark(p.x, p.y, Math.cos(a) * v + p.vx * 0.3, Math.sin(a) * v + p.vy * 0.3, `hsl(${p.subHue},100%,64%)`, { decay: 0.016 }); }
        crackles += 2; continue;
      }
      if (p.life <= 0) {
        if (p.crackle && Math.random() < 0.6) for (let k = 0; k < 3; k++) spark(p.x, p.y, R(-1.2, 1.2), R(-1.2, 1.2), '#fffbe8', { decay: R(0.08, 0.14), size: 1.6, grav: 0.02 });
        continue;
      }
      if (p.y > waterTop + 4 && p.vy > 0) continue;
      out.push(p);
    }
    parts = out;
    if (crackles) crackle(Math.min(12, crackles));
    for (const s of smoke) { s.x += s.vx; s.y += s.vy; s.r += 0.12; s.life -= 0.0035; }
    smoke = smoke.filter((s) => s.life > 0);
    flash *= 0.9;
    for (const b of boats) { b.x += b.v; if (b.x < -40) b.x = W + 40; if (b.x > W + 40) b.x = -40; }
    for (const f of snow) { f.y += f.v; f.x += Math.sin(f.p + f.y * 0.02) * 0.3; if (f.y > H) { f.y = -4; f.x = Math.random() * W; } }
  }

  let time = 0;
  function render() {
    time++;
    fctx.globalCompositeOperation = 'destination-out';
    fctx.fillStyle = 'rgba(0,0,0,.2)'; fctx.fillRect(0, 0, W, H);
    fctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      let a = p.life > 0.3 ? 1 : p.life / 0.3;
      if (p.tw === 1 && Math.random() < 0.4) a *= 0.2;
      if (p.tw === 2 && Math.floor(time * 0.25 + p.ph) % 2) continue;
      fctx.globalAlpha = a;
      fctx.fillStyle = p.hs ? `hsl(${p.hue + (1 - p.life) * p.hs},100%,62%)` : p.color;
      const s = p.size * (0.6 + 0.4 * p.life);
      fctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    fctx.globalAlpha = 1;
    for (const r of rockets) { fctx.fillStyle = '#fff3c4'; fctx.fillRect(r.x - 1.6, r.y - 1.6, 3.2, 3.2); }
    fctx.globalCompositeOperation = 'source-over';

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    let ox = 0, oy = 0;
    if (shake > 0.3) { ox = R(-1, 1) * shake * dpr; oy = R(-1, 1) * shake * dpr; shake *= 0.86; }
    ctx.drawImage(bgC, ox, oy);
    if (flash > 0.02) { ctx.globalAlpha = flash * 0.12; ctx.fillStyle = `hsl(${flashHue},80%,55%)`; ctx.globalCompositeOperation = 'lighter'; ctx.fillRect(0, 0, canvas.width, waterTop * dpr); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    ctx.setTransform(dpr, 0, 0, dpr, ox / dpr, oy / dpr);
    for (const s of smoke) {
      const lit = 0.06 + flash * 0.18;
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      g.addColorStop(0, `hsla(${flashHue},30%,${40 + flash * 30}%,${s.life * lit})`); g.addColorStop(1, 'hsla(0,0%,50%,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    }
    ctx.setTransform(1, 0, 0, 1, ox, oy);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(fx, 0, 0);
    gctx.globalCompositeOperation = 'source-over';
    gctx.clearRect(0, 0, glowC.width, glowC.height);
    gctx.drawImage(fx, 0, 0, glowC.width, glowC.height);
    ctx.globalAlpha = 0.7; ctx.imageSmoothingEnabled = true;
    ctx.drawImage(glowC, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(sceneC, 0, 0);
    const wt = Math.round(waterTop), wb = waterBot;
    {
      ctx.globalCompositeOperation = 'lighter';
      for (let y = 0; y < wb - wt; y += 2) {
        const src = wt - y * 1.6;
        if (src < 2) break;
        const off = Math.sin(y * 0.16 + time * 0.08) * (1 + y * 0.05);
        ctx.globalAlpha = reflAlpha * (1 - y / (wb - wt));
        ctx.drawImage(fx, 0, Math.round(src * dpr), canvas.width, Math.round(2 * dpr), off * dpr, (wt + y) * dpr, canvas.width, 2 * dpr);
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    }
    ctx.setTransform(dpr, 0, 0, dpr, ox / dpr, oy / dpr);
    if (sceneId === 'beach') ctx.drawImage(sceneC, 0, (waterBot - 12) * dpr, W * dpr, (H - waterBot + 12) * dpr, 0, waterBot - 12, W, H - waterBot + 12);
    for (const b of boats) {
      ctx.fillStyle = '#05030a'; ctx.beginPath(); ctx.moveTo(b.x - 18 * b.s, b.y); ctx.lineTo(b.x + 18 * b.s, b.y); ctx.lineTo(b.x + 12 * b.s, b.y + 6 * b.s); ctx.lineTo(b.x - 12 * b.s, b.y + 6 * b.s); ctx.fill();
      ctx.fillRect(b.x - 1, b.y - 22 * b.s, 2, 22 * b.s);
      ctx.fillStyle = 'rgba(255,220,150,.9)'; ctx.fillRect(b.x - 1.5, b.y - 23 * b.s, 3, 3);
    }
    if (snow.length) { ctx.fillStyle = 'rgba(240,245,255,.8)'; for (const f of snow) { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, TAU); ctx.fill(); } }
    if (mode === 'crowd') drawCrowd();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  let crowd = [];
  function makeCrowd() {
    crowd = [];
    const n = Math.round(W / 16);
    for (let i = 0; i < n; i++) crowd.push({ x: (i + Math.random() * 0.6) * (W / n), h: R(30, 46), w: R(13, 18), ph: Math.random() * 6, kid: Math.random() < 0.15, hat: Math.random() < 0.12 });
  }
  function drawCrowd() {
    const base = W < 640 ? H - 58 : H + 4, ex = crowdState ? crowdState.ex / 100 : 0.5, cheering = crowdState && performance.now() < crowdState.cheerUntil;
    for (const p of crowd) {
      const bob = Math.sin(time * (0.1 + ex * 0.15) + p.ph) * (1 + ex * 3) * (cheering ? 2 : 1);
      const hgt = p.h * (p.kid ? 0.75 : 1), hy = base - hgt + bob;
      ctx.fillStyle = '#040208';
      ctx.beginPath(); ctx.ellipse(p.x, base - hgt * 0.35 + bob, p.w * 0.6, hgt * 0.5, 0, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, hy, p.w * 0.36, 0, TAU); ctx.fill();
      if (p.hat) ctx.fillRect(p.x - p.w * 0.4, hy - p.w * 0.5, p.w * 0.8, 3);
      if (cheering || ex > 0.75) {
        ctx.strokeStyle = '#040208'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        const wave = Math.sin(time * 0.3 + p.ph) * 4;
        ctx.beginPath(); ctx.moveTo(p.x - p.w * 0.35, base - hgt * 0.65 + bob); ctx.lineTo(p.x - p.w * 0.6 + wave, hy - p.w * 0.9); ctx.moveTo(p.x + p.w * 0.35, base - hgt * 0.65 + bob); ctx.lineTo(p.x + p.w * 0.6 - wave, hy - p.w * 0.9); ctx.stroke();
      }
      if (flash > 0.05) { ctx.fillStyle = `hsla(${flashHue},90%,70%,${flash * 0.35})`; ctx.beginPath(); ctx.arc(p.x, hy, p.w * 0.36, Math.PI * 1.1, Math.PI * 1.9); ctx.fill(); }
    }
  }

  let mode = 'free', lastType = 'mouse';
  let hold = null;
  Curio.drag(canvas, {
    start(p) {
      if (!startEl.hidden || !resEl.hidden) return;
      lastType = p.pointerType;
      const pt = [p.x, p.y];
      const latchy = Curio.touchpad && p.pointerType === 'mouse';
      if (mode === 'crowd') { crowdFire(pt); if (!latchy) hold = { p: pt, t: 0 }; return; }
      if (mode === 'design') { designTap(pt); return; }
      launch(...pt);
      if (!latchy) hold = { p: pt, t: 0 };
    },
    move(p) { if (hold) hold.p = [p.x, p.y]; },
    end() { hold = null; }
  });

  let auto = false, autoT = 0, autoN = 0;
  function setAuto(v) { auto = v; $('autoBtn').setAttribute('aria-pressed', String(v)); $('autoBtn').querySelector('span').textContent = v ? 'Stop show' : 'Auto show'; autoT = 0; if (v) Curio.toast('Sit back. The show is on us. 🎆'); }
  $('autoBtn').addEventListener('click', () => setAuto(!auto));

  function paintPickers() {
    const k = save.settings.kind;
    $('kindBtn').querySelector('i').textContent = k === 'mix' ? '🎲' : SHELL[k].icon;
    $('kindBtn').querySelector('span').textContent = k === 'mix' ? 'Mix' : SHELL[k].name;
    const sc = SCHEME[save.settings.scheme];
    $('schemeBtn').querySelector('span').textContent = sc.name;
    $('schemeBtn').querySelector('i').style.background = swatch(sc);
    const sn = D.SCENES.find((s) => s.id === sceneId);
    $('sceneBtn').querySelector('i').textContent = sn.icon;
    $('sceneBtn').querySelector('span').textContent = sn.name;
  }
  function swatch(sc) {
    if (!sc.hues) return 'conic-gradient(#ff5a5a, #ffc233, #6bff6b, #3ad7ff, #8a6bff, #ff6fd8, #ff5a5a)';
    if (sc.gold) return 'radial-gradient(circle at 35% 35%, #fff2b0, #f0b429 60%, #a8730c)';
    if (sc.silver) return 'radial-gradient(circle at 35% 35%, #fff, #c9d4e4 60%, #7d8aa0)';
    const stops = sc.hues.map((h) => `hsl(${h},100%,${sc.pale ? 72 : 58}%)`);
    return `conic-gradient(${stops.concat(stops[0]).join(',')})`;
  }
  const drawer = $('drawer'), drawerBody = $('drawerBody');
  function openDrawer(title, build) {
    $('drawerT').textContent = title; drawerBody.textContent = ''; build(drawerBody);
    drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('is-on'));
    drawer.querySelector('.fw-drawer__x').focus();
  }
  function closeDrawer() { drawer.classList.remove('is-on'); setTimeout(() => { drawer.hidden = true; }, 200); }
  drawer.addEventListener('click', (e) => { if (e.target === drawer) closeDrawer(); });
  drawer.querySelector('.fw-drawer__x').addEventListener('click', closeDrawer);

  function shellGrid(box, current, onPick, withMix) {
    const grid = document.createElement('div'); grid.className = 'fw-shells';
    const items = (withMix ? [{ id: 'mix', icon: '🎲', name: 'Mix', desc: 'A random shell every time' }] : []).concat(D.SHELLS);
    for (const s of items) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fw-shell'; b.setAttribute('aria-pressed', String(current === s.id));
      b.innerHTML = '<i></i><b></b><small></small>';
      b.querySelector('i').textContent = s.icon; b.querySelector('b').textContent = s.name; b.querySelector('small').textContent = s.desc;
      if (s.id !== 'mix' && !save.kinds[s.id]) b.classList.add('new');
      b.addEventListener('click', () => onPick(s.id));
      grid.append(b);
    }
    box.append(grid);
  }
  function openKinds() {
    openDrawer('Pick a shell', (box) => {
      shellGrid(box, save.settings.kind, (id) => {
        if (id === 'text') { closeDrawer(); openWrite(); return; }
        save.settings.kind = id; persist(); paintPickers(); closeDrawer();
        if (mode === 'free') launch(R(W * 0.25, W * 0.75), R(H * 0.15, H * 0.4), { kind: id === 'mix' ? undefined : id });
      }, true);
    });
  }
  function openSchemes() {
    openDrawer('Colors', (box) => {
      const grid = document.createElement('div'); grid.className = 'fw-schemes';
      for (const sc of D.SCHEMES) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'fw-scheme'; b.setAttribute('aria-pressed', String(save.settings.scheme === sc.id));
        b.innerHTML = '<i></i><span></span>'; b.querySelector('i').style.background = swatch(sc); b.querySelector('span').textContent = sc.name;
        b.addEventListener('click', () => { save.settings.scheme = sc.id; persist(); paintPickers(); closeDrawer(); if (mode === 'free') launch(R(W * 0.25, W * 0.75), R(H * 0.15, H * 0.4)); });
        grid.append(b);
      }
      box.append(grid);
    });
  }
  function openScenes() {
    openDrawer('Scenery', (box) => {
      const grid = document.createElement('div'); grid.className = 'fw-scenes';
      for (const sc of D.SCENES) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'fw-scene'; b.setAttribute('aria-pressed', String(sceneId === sc.id)); b.dataset.scene = sc.id;
        b.innerHTML = '<i></i><b></b>'; b.querySelector('i').textContent = sc.icon; b.querySelector('b').textContent = sc.name;
        b.addEventListener('click', () => { setScene(sc.id); closeDrawer(); });
        grid.append(b);
      }
      box.append(grid);
    });
  }
  function setScene(id) {
    sceneId = id; save.settings.scene = id; save.scenes[id] = 1;
    if (D.SCENES.every((s) => save.scenes[s.id])) unlock('scenes');
    persist(); paintScene(); paintPickers(); if (mode === 'crowd') makeCrowd();
  }
  function openWrite() {
    openDrawer('Write in the sky', (box) => {
      const f = document.createElement('form'); f.className = 'fw-write';
      f.innerHTML = '<input class="c-input" maxlength="12" aria-label="Word to write" autocomplete="off"><button class="c-btn" type="submit">Launch ✍️</button>';
      const inp = f.querySelector('input'); inp.value = save.settings.text || 'WOW';
      const p = document.createElement('p'); p.className = 'fw-lead'; p.textContent = 'Up to 12 letters. Short words look best. Try your name!';
      f.addEventListener('submit', (e) => { e.preventDefault(); const v = inp.value.trim().slice(0, 12) || 'WOW'; save.settings.text = v; persist(); closeDrawer(); launch(W / 2, H * 0.3, { kind: 'text', word: v }); });
      box.append(p, f);
      setTimeout(() => inp.focus(), 50);
    });
  }
  $('kindBtn').addEventListener('click', openKinds);
  $('schemeBtn').addEventListener('click', openSchemes);
  $('sceneBtn').addEventListener('click', openScenes);
  $('writeBtn').addEventListener('click', openWrite);

  let show = { len: 30, cues: [] }, playhead = 0, playing = false, recording = false, sel = -1, snap = true, undoStack = [], watchedFrom0 = false, showName = 'Untitled show';
  const tl = $('timeline'), tg = tl.getContext('2d');
  function parseCues(code) {
    return code.split(';').map((s) => s.trim()).filter(Boolean).map((s) => { const [t, x, y, k, c] = s.split(','); return { t: +t, x: +x, y: +y, k: SHELL[k] ? k : 'peony', c: SCHEME[c] ? c : 'mix' }; }).filter((c) => isFinite(c.t) && isFinite(c.x) && isFinite(c.y));
  }
  const cueCode = (cues) => cues.map((c) => `${c.t.toFixed(2)},${c.x.toFixed(3)},${c.y.toFixed(3)},${c.k},${c.c}`).join(';');
  function pushUndo() { undoStack.push(JSON.stringify(show)); if (undoStack.length > 60) undoStack.shift(); }
  function undo() { if (!undoStack.length) return; show = JSON.parse(undoStack.pop()); sel = -1; paintTimeline(); paintCue(); }
  function designTap(p) {
    const k = save.settings.kind === 'mix' ? Curio.pick(KINDS) : save.settings.kind;
    pushUndo();
    let t = playhead;
    if (snap && !playing) t = Math.round(t * 4) / 4;
    const cue = { t: clamp(t, 0, show.len - 0.05), x: clamp(p[0] / W, 0.03, 0.97), y: clamp(p[1] / H, 0.05, waterTop / H - 0.05), k, c: save.settings.scheme };
    if (playing) cue.fresh = true;
    show.cues.push(cue); show.cues.sort((a, b) => a.t - b.t);
    sel = show.cues.indexOf(cue);
    fireCue(cue, false);
    if (!playing) playhead = Math.min(show.len, playhead + 0.5);
    paintTimeline(); paintCue();
    if (show.cues.length >= 25) unlock('showlong');
  }
  function fireCue(c, quiet) { launch(c.x * W, c.y * H, { kind: c.k, scheme: c.c, src: 'show', quiet, word: c.k === 'text' ? save.settings.text : undefined }); }
  function paintTimeline() {
    const r = tl.getBoundingClientRect(), w = r.width, h = r.height, d = Math.min(2, devicePixelRatio || 1);
    if (tl.width !== Math.round(w * d)) { tl.width = Math.round(w * d); tl.height = Math.round(h * d); }
    tg.setTransform(d, 0, 0, d, 0, 0); tg.clearRect(0, 0, w, h);
    const pad = 12, px = (w - pad * 2) / show.len;
    tg.fillStyle = 'rgba(255,255,255,.06)'; tg.beginPath(); tg.roundRect?.(pad - 6, 8, w - pad * 2 + 12, h - 16, 10); tg.fill();
    tg.strokeStyle = 'rgba(255,255,255,.18)'; tg.fillStyle = 'rgba(255,255,255,.5)'; tg.font = '700 10px ui-rounded, system-ui, sans-serif'; tg.textAlign = 'center';
    for (let s = 0; s <= show.len; s++) { const x = pad + s * px; tg.beginPath(); tg.moveTo(x, h - 12); tg.lineTo(x, h - (s % 5 ? 16 : 22)); tg.stroke(); if (s % 5 === 0) tg.fillText(`${s}s`, x, h - 1); }
    show.cues.forEach((c, i) => {
      const x = pad + c.t * px, y = 14 + (c.y / (waterTop / H)) * (h - 40);
      const sc = SCHEME[c.c];
      tg.fillStyle = sc.gold ? '#f0b429' : sc.silver ? '#d8e0ee' : sc.hues ? `hsl(${sc.hues[0]},100%,62%)` : '#ff9ad5';
      tg.beginPath(); tg.arc(x, y, i === sel ? 7 : 5, 0, TAU); tg.fill();
      if (i === sel) { tg.strokeStyle = '#fff'; tg.lineWidth = 2; tg.stroke(); tg.lineWidth = 1; }
    });
    const x = pad + playhead * px;
    tg.strokeStyle = recording ? '#ff4d4d' : '#ffb27a'; tg.lineWidth = 2; tg.beginPath(); tg.moveTo(x, 6); tg.lineTo(x, h - 12); tg.stroke(); tg.lineWidth = 1;
    tg.fillStyle = recording ? '#ff4d4d' : '#ffb27a'; tg.beginPath(); tg.moveTo(x - 5, 4); tg.lineTo(x + 5, 4); tg.lineTo(x, 10); tg.fill();
    $('tlTime').textContent = `${playhead.toFixed(1)} / ${show.len}s · ${show.cues.length} cue${show.cues.length === 1 ? '' : 's'}`;
  }
  let tlDrag = null;
  Curio.drag(tl, {
    start(p) {
      const r = tl.getBoundingClientRect(), x = p.x, y = p.y, pad = 12, px = (r.width - pad * 2) / show.len;
      let hit = -1, bd = 16;
      show.cues.forEach((c, i) => { const cx = pad + c.t * px, cy = 14 + (c.y / (waterTop / H)) * (r.height - 40), d = Math.hypot(cx - x, cy - y); if (d < bd) { bd = d; hit = i; } });
      if (hit >= 0) { sel = hit; pushUndo(); tlDrag = { cue: show.cues[hit], moved: false }; }
      else { sel = -1; playhead = clamp((x - pad) / px, 0, show.len); tlDrag = { scrub: true }; }
      paintTimeline(); paintCue();
    },
    move(p) {
      if (!tlDrag) return;
      const r = tl.getBoundingClientRect(), pad = 12, px = (r.width - pad * 2) / show.len;
      let t = clamp((p.x - pad) / px, 0, show.len - 0.05);
      if (tlDrag.scrub) playhead = t;
      else { if (snap) t = Math.round(t * 4) / 4; tlDrag.cue.t = t; tlDrag.moved = true; }
      paintTimeline();
    },
    end() { if (tlDrag && tlDrag.cue) { show.cues.sort((a, b) => a.t - b.t); sel = show.cues.indexOf(tlDrag.cue); if (!tlDrag.moved) undoStack.pop(); } tlDrag = null; paintTimeline(); paintCue(); }
  });
  addEventListener('keydown', (e) => {
    if (mode !== 'design' || sel < 0 || !show.cues[sel] || !startEl.hidden || !drawer.hidden) return;
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    const c = show.cues[sel];
    if (e.key === ',' || e.key === '.') { pushUndo(); c.t = clamp(c.t + (e.key === '.' ? 0.25 : -0.25), 0, show.len - 0.05); show.cues.sort((a, b) => a.t - b.t); sel = show.cues.indexOf(c); paintTimeline(); paintCue(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { pushUndo(); show.cues.splice(sel, 1); sel = -1; paintTimeline(); paintCue(); }
  });
  function paintCue() {
    const box = $('cueEdit');
    if (sel < 0 || !show.cues[sel]) { box.innerHTML = '<span class="fw-hint">Tap the sky to place a shell at the playhead. Drag dots to retime them.</span>'; return; }
    const c = show.cues[sel];
    box.innerHTML = '';
    const ks = document.createElement('select'); ks.className = 'fw-sel'; ks.setAttribute('aria-label', 'Shell type');
    for (const s of D.SHELLS) { const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.icon} ${s.name}`; ks.append(o); }
    ks.value = c.k; ks.addEventListener('change', () => { pushUndo(); c.k = ks.value; fireCue(c, false); });
    const cs = document.createElement('select'); cs.className = 'fw-sel'; cs.setAttribute('aria-label', 'Colors');
    for (const s of D.SCHEMES) { const o = document.createElement('option'); o.value = s.id; o.textContent = s.name; cs.append(o); }
    cs.value = c.c; cs.addEventListener('change', () => { pushUndo(); c.c = cs.value; paintTimeline(); fireCue(c, false); });
    const t = document.createElement('span'); t.className = 'fw-hint'; t.textContent = `${c.t.toFixed(2)}s`;
    const pv = document.createElement('button'); pv.type = 'button'; pv.className = 'fw-mini'; pv.textContent = '▶'; pv.setAttribute('aria-label', 'Preview cue'); pv.addEventListener('click', () => fireCue(c, false));
    const del = document.createElement('button'); del.type = 'button'; del.className = 'fw-mini'; del.textContent = '🗑'; del.setAttribute('aria-label', 'Delete cue');
    del.addEventListener('click', () => { pushUndo(); show.cues.splice(sel, 1); sel = -1; paintTimeline(); paintCue(); });
    box.append(t, ks, cs, pv, del);
  }
  function setPlaying(v) {
    playing = v; $('playBtn').textContent = v ? '⏸' : '▶'; $('playBtn').setAttribute('aria-label', v ? 'Pause' : 'Play');
    if (v) { if (playhead >= show.len - 0.05) playhead = 0; watchedFrom0 = playhead < 0.1; }
    if (!v) { recording = false; $('recBtn').setAttribute('aria-pressed', 'false'); }
    paintTimeline();
  }
  $('playBtn').addEventListener('click', () => setPlaying(!playing));
  $('recBtn').addEventListener('click', () => { recording = !recording; $('recBtn').setAttribute('aria-pressed', String(recording)); if (recording && !playing) setPlaying(true); if (recording) Curio.toast('Recording. Tap the sky in time!'); paintTimeline(); });
  $('rewBtn').addEventListener('click', () => { playhead = 0; paintTimeline(); });
  $('undoBtn').addEventListener('click', undo);
  $('snapBtn').addEventListener('click', () => { snap = !snap; $('snapBtn').setAttribute('aria-pressed', String(snap)); });
  $('lenSel').addEventListener('change', () => { pushUndo(); show.len = +$('lenSel').value; show.cues = show.cues.filter((c) => c.t < show.len); playhead = Math.min(playhead, show.len); paintTimeline(); });
  $('clearShowBtn').addEventListener('click', () => { if (!show.cues.length) return; pushUndo(); show.cues = []; sel = -1; paintTimeline(); paintCue(); Curio.toast('Cleared. Undo if you regret it.'); });
  $('showsBtn').addEventListener('click', openShows);
  function loadShow(s, name) { pushUndo(); show = { len: s.len, cues: parseCues(s.code) }; showName = name || s.name || 'Show'; playhead = 0; sel = -1; $('lenSel').value = String([15, 20, 24, 30, 45, 60].includes(show.len) ? show.len : 30); if (!['15', '20', '24', '30', '45', '60'].includes($('lenSel').value)) $('lenSel').value = '30'; paintTimeline(); paintCue(); }
  function openShows() {
    openDrawer('Shows', (box) => {
      const h1 = document.createElement('h3'); h1.textContent = 'Save this show'; box.append(h1);
      const f = document.createElement('form'); f.className = 'fw-write';
      f.innerHTML = '<input class="c-input" maxlength="28" aria-label="Show name"><button class="c-btn" type="submit">💾 Save</button>';
      const inp = f.querySelector('input'); inp.value = showName;
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!show.cues.length) { Curio.toast('Add some cues first'); return; }
        const name = inp.value.trim() || 'Untitled show';
        const ex = save.shows.findIndex((s) => s.name === name);
        const rec = { name, len: show.len, code: cueCode(show.cues) };
        if (ex >= 0) save.shows[ex] = rec; else save.shows.unshift(rec);
        save.shows = save.shows.slice(0, 12);
        showName = name; persist(); unlock('show'); Curio.toast(`Saved "${name}"`); closeDrawer();
      });
      box.append(f);
      const list = (title, arr, mine) => {
        if (!arr.length) return;
        const h = document.createElement('h3'); h.textContent = title; box.append(h);
        const ul = document.createElement('div'); ul.className = 'fw-showlist';
        arr.forEach((s, i) => {
          const row = document.createElement('div'); row.className = 'fw-showrow';
          const n = document.createElement('div'); n.innerHTML = '<b></b><small></small>'; n.querySelector('b').textContent = s.name; n.querySelector('small').textContent = `${parseCues(s.code).length} cues · ${s.len}s`;
          const play = document.createElement('button'); play.type = 'button'; play.className = 'c-btn'; play.textContent = '▶ Play';
          play.addEventListener('click', () => { loadShow(s, s.name); closeDrawer(); setPlaying(true); });
          const share = document.createElement('button'); share.type = 'button'; share.className = 'c-btn c-btn--ghost'; share.textContent = '📋'; share.setAttribute('aria-label', 'Copy show code');
          share.addEventListener('click', async () => { const code = `FW1|${s.len}|${s.code}`; try { await navigator.clipboard.writeText(code); Curio.toast('Show code copied. Share it!'); } catch { Curio.toast('Could not copy'); } });
          row.append(n, play, share);
          if (mine) { const del = document.createElement('button'); del.type = 'button'; del.className = 'c-btn c-btn--ghost'; del.textContent = '🗑'; del.setAttribute('aria-label', 'Delete show'); del.addEventListener('click', () => { save.shows.splice(i, 1); persist(); row.remove(); }); row.append(del); }
          ul.append(row);
        });
        box.append(ul);
      };
      list('Your shows', save.shows, true);
      list('Demo shows', D.SHOWS, false);
      const h2 = document.createElement('h3'); h2.textContent = 'Import a show code'; box.append(h2);
      const imp = document.createElement('form'); imp.className = 'fw-write';
      imp.innerHTML = '<input class="c-input" aria-label="Show code" placeholder="FW1|30|..."><button class="c-btn c-btn--ghost" type="submit">Load</button>';
      imp.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = imp.querySelector('input').value.trim(), m = v.match(/^FW1\|(\d+)\|(.*)$/);
        if (!m) { Curio.toast('That does not look like a show code'); return; }
        const cues = parseCues(m[2]);
        if (!cues.length) { Curio.toast('No cues found in that code'); return; }
        loadShow({ len: clamp(+m[1], 5, 60), code: m[2] }, 'Imported show'); closeDrawer(); setPlaying(true);
      });
      box.append(imp);
    });
  }
  function stepShow(dt) {
    if (!playing) return;
    const prev = playhead;
    playhead += dt;
    for (const c of show.cues) if (c.t >= prev && c.t < playhead) { if (c.fresh) delete c.fresh; else fireCue(c, false); }
    if (playhead >= show.len) {
      playhead = show.len; setPlaying(false);
      if (watchedFrom0 && show.cues.length >= 5) unlock('playdemo');
    }
    if (Math.floor(prev * 10) !== Math.floor(playhead * 10)) paintTimeline();
  }

  let crowdState = null;
  function crowdLevel(daily) {
    const seed = daily ? strSeed('fw' + today()) : (Math.random() * 1e9) | 0;
    const r = rng(seed), reqs = [];
    for (let i = 0; i < 12; i++) reqs.push(D.REQUESTS[Math.floor(r() * D.REQUESTS.length)]);
    return { reqs, daily };
  }
  function startCrowd(daily) {
    const L = crowdLevel(daily);
    crowdState = { score: 0, ex: 55, ammo: 6, reload: 0, t0: performance.now(), end: performance.now() + 60000, reqs: L.reqs, ri: 0, req: null, reqUntil: 0, nextReq: performance.now() + 4000, hist: [], recent: [], granted: 0, daily, cheerUntil: 0, over: false };
    makeCrowd();
    paintCrowd();
  }
  const KIND_PTS = { peony: 10, chrys: 14, dahlia: 12, willow: 16, palm: 16, ring: 12, saturn: 18, crossette: 18, crackle: 16, strobe: 14, kamuro: 20, horsetail: 16, cluster: 22, ghost: 18, spiral: 18, fish: 16, heart: 20, smiley: 20, starshape: 20, butterfly: 22, brocade: 26, text: 24 };
  function crowdFire(p) {
    const cs = crowdState; if (!cs || cs.over) return;
    if (cs.ammo <= 0) { tone(180, 140, 0.12, 0.08, 'square'); Curio.toast('Reloading…', 700); return; }
    cs.ammo--;
    launch(p[0], p[1], { kind: save.settings.kind === 'mix' ? Curio.pick(KINDS) : save.settings.kind, word: save.settings.text });
    paintCrowd();
  }
  function crowdBurst(r) {
    const cs = crowdState; if (!cs || cs.over) return;
    const now = performance.now();
    const rec = { k: r.kind, c: r.scheme, x: r.x / W, y: r.y / H, t: now };
    cs.hist.push(rec);
    const lastKinds = cs.hist.slice(-5, -1).map((h) => h.k);
    let mult = lastKinds.includes(r.kind) ? (lastKinds[lastKinds.length - 1] === r.kind ? 0.35 : 0.8) : 1.5;
    const together = cs.hist.filter((h) => now - h.t < 800).length;
    mult *= 1 + 0.3 * (together - 1);
    const pts = Math.round((KIND_PTS[r.kind] || 10) * mult);
    cs.score += pts; cs.ex = clamp(cs.ex + pts / 3, 0, 100);
    floatText(`+${pts}${together > 1 ? ` ×${together}` : ''}`, r.x, r.y - 30, mult >= 1.5 ? '#7ee0c3' : mult < 0.5 ? '#ff8a8a' : '#fff');
    if (mult < 0.5) floatText('yawn…', r.x, r.y + 10, '#ff8a8a');
    if (cs.req && now < cs.reqUntil && reqMet(cs.req, rec, together)) {
      cs.score += 150; cs.ex = clamp(cs.ex + 25, 0, 100); cs.granted++; cs.req = null; cs.cheerUntil = now + 1800; cs.nextReq = now + R(3000, 5000);
      floatText('Request granted! +150', W / 2, H * 0.55, '#ffd36a'); cheer(1.2); chime([659, 784, 1047]);
      if (cs.granted >= 5) unlock('requests5');
      $('req').classList.remove('is-on');
    } else if (together >= 3 || r.kind === 'brocade') { cs.cheerUntil = now + 1200; cheer(0.7); }
    paintCrowd();
  }
  function reqMet(q, rec, together) {
    if (q.test === 'kind') return rec.k === q.kind;
    if (q.test === 'scheme') return rec.c === q.scheme;
    if (q.test === 'high') return rec.y < 0.25;
    if (q.test === 'low') return rec.y > 0.48;
    if (q.test === 'left') return rec.x < 0.33;
    if (q.test === 'right') return rec.x > 0.67;
    if (q.test === 'triple') return together >= 3;
    return false;
  }
  const floats = [];
  function floatText(text, x, y, color) {
    const el = document.createElement('div'); el.className = 'fw-float'; el.textContent = text; el.style.left = `${x}px`; el.style.top = `${y}px`; el.style.color = color;
    $('stage').append(el); floats.push(el);
    setTimeout(() => el.remove(), 1200);
  }
  function stepCrowd(dt) {
    const cs = crowdState; if (!cs || cs.over) return;
    const now = performance.now();
    cs.reload += dt;
    if (cs.reload > 0.7) { cs.reload = 0; if (cs.ammo < 6) { cs.ammo++; paintCrowd(); } }
    cs.ex = clamp(cs.ex - dt * 3.2, 0, 100);
    if (!cs.req && now > cs.nextReq && cs.ri < cs.reqs.length) {
      cs.req = cs.reqs[cs.ri++]; cs.reqUntil = now + 8000;
      const el = $('req'); el.textContent = cs.req.text; el.style.left = `${clamp(R(0.2, 0.8) * W, 90, W - 90)}px`; el.classList.add('is-on');
      tone(880, 990, 0.15, 0.05, 'triangle');
    }
    if (cs.req && now > cs.reqUntil) { cs.req = null; cs.ex = clamp(cs.ex - 12, 0, 100); cs.nextReq = now + 2500; $('req').classList.remove('is-on'); aww(); floatText('Aww…', W / 2, H * 0.6, '#ff8a8a'); }
    if (now >= cs.end || cs.ex <= 0) endCrowd(cs.ex <= 0);
    if (Math.floor(now / 200) !== cs.lastPaint) { cs.lastPaint = Math.floor(now / 200); paintCrowd(); }
  }
  function paintCrowd() {
    const cs = crowdState; if (!cs) return;
    $('cScore').textContent = Curio.fmt(cs.score);
    $('cTime').textContent = `${Math.max(0, Math.ceil((cs.end - performance.now()) / 1000))}s`;
    $('cMeter').style.width = `${cs.ex}%`;
    $('cMeter').style.background = cs.ex > 66 ? 'linear-gradient(90deg,#7ee0c3,#4fd18b)' : cs.ex > 33 ? 'linear-gradient(90deg,#ffd36a,#ffb03a)' : 'linear-gradient(90deg,#ff8a6a,#ff5a36)';
    $('cMood').textContent = cs.ex > 80 ? '🤩' : cs.ex > 60 ? '😃' : cs.ex > 40 ? '🙂' : cs.ex > 20 ? '😐' : '🥱';
    const am = $('cAmmo'); am.textContent = '';
    for (let i = 0; i < 6; i++) { const s = document.createElement('i'); if (i >= cs.ammo) s.className = 'empty'; am.append(s); }
  }
  function endCrowd(left) {
    const cs = crowdState; cs.over = true;
    $('req').classList.remove('is-on');
    const best = Math.max(save.crowdBest, cs.score), isNew = cs.score > save.crowdBest;
    save.crowdBest = best;
    if (cs.daily) { const k = today(); if (!save.daily[k] || save.daily[k] < cs.score) save.daily[k] = cs.score; unlock('daily'); }
    unlock('crowd1'); if (cs.score >= 500) unlock('crowd500'); if (cs.score >= 1000) unlock('crowd1000');
    persist();
    if (!left) { cheer(1.5); Curio.confetti(); } else aww();
    setTimeout(() => showResult({
      emoji: left ? '🥱' : isNew ? '🏆' : '👏', title: left ? 'The crowd went home' : isNew ? 'New best show!' : 'What a show!',
      big: `${Curio.fmt(cs.score)} pts`, line: `${cs.granted} request${cs.granted === 1 ? '' : 's'} granted · ${cs.hist.length} shells`,
      best: cs.daily ? `Daily best: ${Curio.fmt(save.daily[today()] || cs.score)} · all-time ${Curio.fmt(best)}` : `Best: ${Curio.fmt(best)}`,
      share: `🎆 Fireworks crowd show${cs.daily ? ' (daily ' + today() + ')' : ''}: ${Curio.fmt(cs.score)} points, ${cs.granted} requests granted`
    }), 1200);
  }

  const resEl = $('result');
  let lastShare = '';
  function showResult(o) {
    $('resEmoji').textContent = o.emoji; $('resTitle').textContent = o.title; $('resBig').textContent = o.big; $('resLine').textContent = o.line; $('resBest').textContent = o.best;
    lastShare = o.share;
    resEl.hidden = false; requestAnimationFrame(() => resEl.classList.add('is-on')); $('resAgain').focus();
  }
  function hideResult() { resEl.classList.remove('is-on'); resEl.hidden = true; }
  $('resAgain').addEventListener('click', () => { hideResult(); startCrowd(crowdState?.daily); });
  $('resMenu').addEventListener('click', () => { hideResult(); showStart(); });
  $('resShare').addEventListener('click', async () => { try { await navigator.clipboard.writeText(lastShare); Curio.toast('Copied! 📋'); } catch { Curio.toast(lastShare, 4000); } });

  function setMode(m, opts = {}) {
    mode = m;
    document.body.dataset.fwmode = m;
    setAuto(false); setPlaying(false); recording = false;
    crowdState = null; $('req').classList.remove('is-on');
    $('modeLbl').textContent = m === 'free' ? 'Free play' : m === 'design' ? 'Show designer' : opts.daily ? 'Daily crowd show' : 'Crowd show';
    if (m === 'design') { requestAnimationFrame(() => { paintTimeline(); paintCue(); }); if (!show.cues.length) loadShow(D.SHOWS[0], D.SHOWS[0].name); }
    if (m === 'crowd') startCrowd(opts.daily);
  }

  const ACH = Object.fromEntries(D.ACH.map((a) => [a.id, a]));
  function unlock(id) {
    if (save.ach[id] || !ACH[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH[id];
    const el = document.createElement('div'); el.className = 'fw-badge';
    el.innerHTML = '<i></i><div><small>Achievement unlocked</small><b></b></div>';
    el.querySelector('i').textContent = a.icon; el.querySelector('b').textContent = a.name;
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('is-on'));
    setTimeout(() => { el.classList.remove('is-on'); setTimeout(() => el.remove(), 500); }, 3000);
    chime([784, 988, 1319]);
  }
  function openTrophies() {
    openDrawer('Trophies and stats', (box) => {
      const st = document.createElement('div'); st.className = 'fw-stats';
      const fav = Object.entries(save.kinds).sort((a, b) => b[1] - a[1])[0];
      const rows = [['Shells launched', Curio.fmt(save.launched)], ['Shell types tried', `${KINDS.filter((k) => save.kinds[k]).length} / ${KINDS.length}`], ['Favorite', fav ? `${SHELL[fav[0]].icon} ${SHELL[fav[0]].name}` : '-'], ['Saved shows', save.shows.length], ['Best crowd score', Curio.fmt(save.crowdBest)], ['Daily shows', Object.keys(save.daily).length]];
      for (const [k, v] of rows) { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = v; d.querySelector('span').textContent = k; st.append(d); }
      box.append(st);
      const h = document.createElement('h3'); h.textContent = `Achievements ${Object.keys(save.ach).length} / ${D.ACH.length}`; box.append(h);
      const ag = document.createElement('div'); ag.className = 'fw-ach';
      for (const a of D.ACH) { const d = document.createElement('div'); d.className = save.ach[a.id] ? 'on' : ''; d.innerHTML = '<i></i><b></b><small></small>'; d.querySelector('i').textContent = save.ach[a.id] ? a.icon : '🔒'; d.querySelector('b').textContent = a.name; d.querySelector('small').textContent = a.desc; ag.append(d); }
      box.append(ag);
    });
  }
  function openHelp() {
    openDrawer('How to play', (box) => {
      box.innerHTML = `<div class="fw-help">
        <p><b>Free play:</b> tap the sky to launch a shell to that spot. Hold to keep them coming. Pick from 22 shell types, 11 color schemes and 4 scenes, or write a word in the sky.</p>
        <p><b>Show designer:</b> tap the sky to place a shell at the playhead. Press ⏺ to record live while the show plays, drag dots on the timeline to retime them, then save it or copy a code to share.</p>
        <p><b>Crowd show:</b> 60 seconds to please a crowd. Variety scores big, repeats get yawns, and shells that burst together multiply. Grant shouted requests for +150. You have 6 mortars that reload over time. If the excitement meter empties, everyone goes home.</p>
        <p class="fw-keys"><span class="c-kbd">Space</span> launch · <span class="c-kbd">A</span> auto show · <span class="c-kbd">K</span> shells · <span class="c-kbd">C</span> colors · <span class="c-kbd">S</span> scenery · <span class="c-kbd">W</span> write · <span class="c-kbd">P</span> play show · <span class="c-kbd">R</span> record · <span class="c-kbd">,</span> <span class="c-kbd">.</span> nudge selected cue · <span class="c-kbd">Del</span> delete cue · <span class="c-kbd">Ctrl</span>+<span class="c-kbd">Z</span> undo cue · <span class="c-kbd">Esc</span> menu</p>
      </div>`;
    });
  }
  $('trophyBtn').addEventListener('click', openTrophies);
  $('helpBtn').addEventListener('click', openHelp);
  $('menuBtn').addEventListener('click', () => showStart());

  const startEl = $('start');
  function showStart() {
    setAuto(false); setPlaying(false);
    if (crowdState && !crowdState.over) { crowdState.over = true; $('req').classList.remove('is-on'); }
    $('stBest').textContent = save.crowdBest ? `Best ${Curio.fmt(save.crowdBest)}` : 'Please the crowd';
    const dd = save.daily[today()];
    $('stDaily').textContent = dd ? `Today: ${Curio.fmt(dd)}` : 'New today';
    $('stLine').textContent = `${Curio.fmt(save.launched)} shells launched · ${Object.keys(save.ach).length}/${D.ACH.length} trophies`;
    startEl.hidden = false; requestAnimationFrame(() => startEl.classList.add('is-on'));
    $('goFree').focus();
    auto = true; autoT = 0;
  }
  function hideStart() {
    auto = false; startEl.classList.remove('is-on'); setTimeout(() => { startEl.hidden = true; }, 250);
    if (!Curio.store.get('fireworks:tphint', false) && !Curio.touchpad) { Curio.store.set('fireworks:tphint', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode (🖱️ in the top bar) for click-to-drag on the show timeline.', 5000), 3000); }
  }
  $('goFree').addEventListener('click', () => { hideStart(); setMode('free'); });
  $('goDesign').addEventListener('click', () => { hideStart(); setMode('design'); });
  $('goCrowd').addEventListener('click', () => { hideStart(); setMode('crowd'); });
  $('goDaily').addEventListener('click', () => { hideStart(); setMode('crowd', { daily: true }); });
  $('goHelp').addEventListener('click', openHelp);
  function finale() {
    const n = 14;
    for (let i = 0; i < n; i++) setTimeout(() => launch(R(W * 0.08, W * 0.92), R(H * 0.08, H * 0.42), { kind: Curio.pick(KINDS.filter((x) => x !== 'fish')) }), i * 110 + (i > 9 ? 260 : 0));
    if (navigator.vibrate) navigator.vibrate([12, 60, 12, 60, 30]);
  }
  function surprise() {
    const sc = Curio.pick(D.SCENES.filter((s) => s.id !== sceneId));
    setScene(sc.id);
    save.settings.scheme = Curio.pick(D.SCHEMES).id; save.settings.kind = 'mix'; persist(); paintPickers();
    for (let i = 0; i < 5; i++) setTimeout(() => launch(R(W * 0.15, W * 0.85), R(H * 0.12, H * 0.4)), 200 + i * 160);
    Curio.toast(`${sc.icon} ${sc.name}, ${SCHEME[save.settings.scheme].name}`, 1800);
  }
  $('surprise').addEventListener('click', surprise);
  $('finale').addEventListener('click', finale);
  startEl.querySelectorAll('[data-scene]').forEach((b) => b.addEventListener('click', () => { setScene(b.dataset.scene); startEl.querySelectorAll('[data-scene]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && mode === 'design') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && SIMPLE) { if (!drawer.hidden) closeDrawer(); return; }
    if (e.key === 'Escape') { if (!drawer.hidden) closeDrawer(); else if (!resEl.hidden) { hideResult(); showStart(); } else if (startEl.hidden) showStart(); else { hideStart(); setMode(mode); } return; }
    if (!startEl.hidden || !drawer.hidden || !resEl.hidden) return;
    const k = e.key.toLowerCase();
    if (e.key === ' ' || e.key === 'Enter') {
      if (e.target.closest && e.target.closest('button')) return;
      e.preventDefault();
      const p = [R(W * 0.1, W * 0.9), R(H * 0.12, H * 0.5)];
      if (mode === 'crowd') crowdFire(p); else if (mode === 'design') designTap(p); else launch(...p);
    }
    else if (k === 'a' && mode === 'free') setAuto(!auto);
    else if (k === 'f' && mode === 'free') finale();
    else if (k === 'r' && SIMPLE) surprise();
    else if (SIMPLE && (k === 'k' || k === 'c' || k === 'w')) return;
    else if (k === 'k') openKinds(); else if (k === 'c') openSchemes(); else if (k === 's') openScenes(); else if (k === 'w') openWrite();
    else if (k === 'p' && mode === 'design') setPlaying(!playing);
    else if (k === 'r' && mode === 'design') $('recBtn').click();
  });

  let raf = 0, last = 0, acc = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(100, t - (last || t)); last = t;
    acc += dt;
    let n = 0;
    while (acc >= 1000 / 60 && n < 3) {
      acc -= 1000 / 60; n++;
      if (hold && mode === 'free' && ++hold.t % 14 === 0) launch(...hold.p);
      if (auto && --autoT <= 0) {
        autoN++;
        const quiet = !startEl.hidden;
        if (autoN % 18 === 0) { for (let k = 0; k < 6; k++) setTimeout(() => launch(R(W * 0.1, W * 0.9), R(H * 0.1, H * 0.45), { src: 'auto', quiet, kind: Curio.pick(KINDS) }), k * 140); autoT = 220; }
        else { launch(R(W * 0.1, W * 0.9), R(H * 0.1, H * 0.5), { src: 'auto', quiet, kind: save.settings.kind === 'mix' || quiet ? Curio.pick(KINDS.filter((x) => x !== 'fish')) : save.settings.kind }); autoT = Curio.randInt(30, 75); }
      }
      if (mode === 'design') stepShow(1 / 60);
      if (mode === 'crowd') stepCrowd(1 / 60);
      update();
    }
    if (n === 3) acc = 0;
    if (n) render();
  }
  const start = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  addEventListener('resize', () => { resize(); if (mode === 'crowd') makeCrowd(); if (mode === 'design') paintTimeline(); });

  window.__fw = { launch, setMode, setScene, get parts() { return parts; }, get show() { return show; }, get crowd() { return crowdState; }, designTap, setPlaying, BURST, get save() { return save; }, loadShow };

  resize();
  paintPickers();
  document.body.dataset.fwmode = 'free';
  if (SIMPLE) setMode('free'); else showStart();
  start();
})();
