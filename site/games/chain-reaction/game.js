(() => {
  const AREA = 640000, DOT_R = 7, BLAST_R = 64;
  let W = 1000, H = 640;
  const LEVELS = [[10, 1], [20, 3], [30, 5], [40, 7], [50, 10], [60, 15], [70, 20], [80, 27], [90, 38], [100, 52], [110, 68], [120, 92], [130, 110], [140, 126], [150, 140]];
  const SCALE = [0, 2, 4, 7, 9];
  const KEY = 'chain-reaction:state';
  const canvas = document.getElementById('field');
  const g = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const intro = document.getElementById('intro');
  const statEl = document.getElementById('stat'), subEl = document.getElementById('sub'), barEl = document.getElementById('bar'), tagEl = document.getElementById('tag');
  const lvlSel = document.getElementById('lvl');

  const saved = Curio.store.get(KEY, {});
  let mode = saved.mode === 'sandbox' ? 'sandbox' : 'levels';
  let level = Math.max(0, Math.min(LEVELS.length - 1, saved.level | 0));
  let unlocked = Math.max(level, saved.unlocked | 0);
  let dots = [], blasts = [], sparks = [], floaters = [], snapshot = null, phase = 'aim', popped = 0, chain = 0, bestChain = saved.bestChain | 0, totalPops = saved.total | 0;
  let spawnT = 0, scale = 1, ox = 0, oy = 0, dpr = 1, cw = 0, ch = 0, paused = false, audioOk = false, touched = false, shake = 0, time = 0, hint = 1;
  let sprites = new Map();

  let ac = null, master = null, budget = 0;
  function audio() {
    if (Curio.muted || !audioOk) return null;
    ac = Curio.audioContext(); if (!ac) return null;
    if (!master) { master = ac.createDynamicsCompressor(); master.threshold.value = -12; master.connect(ac.destination); }
    return ac;
  }
  function tone(freq, dur, type, vol, glide) {
    const a = audio(); if (!a || budget <= 0) return;
    budget--;
    const t = a.currentTime;
    const o = a.createOscillator(), gn = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.linearRampToValueAtTime(vol, t + 0.005); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(master); o.start(t); o.stop(t + dur + 0.03);
  }
  function popNote(k) {
    const oct = Math.min(3, Math.floor(k / 5)), step = k % 5;
    const top = k >= 20;
    const semi = top ? 36 + SCALE[(k * 3) % 5] : oct * 12 + SCALE[step];
    const f = 261.63 * Math.pow(2, semi / 12);
    const vol = Math.max(0.05, 0.16 - k * 0.002);
    tone(f, 0.22, 'triangle', vol);
    tone(f * 2, 0.08, 'sine', vol * 0.35, f * 2.6);
  }
  const SND = {
    place: () => { tone(160, 0.35, 'sine', 0.2, 60); tone(900, 0.12, 'triangle', 0.06, 300); },
    win: () => [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => { budget++; tone(f, 0.3, 'triangle', 0.12); }, i * 80)),
    lose: () => [392, 330, 262].forEach((f, i) => setTimeout(() => { budget++; tone(f, 0.35, 'sine', 0.1); }, i * 140))
  };

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function makeDot(edge) {
    const sp = rnd(38, 75), a = Math.random() * Math.PI * 2;
    let x = rnd(DOT_R, W - DOT_R), y = rnd(DOT_R, H - DOT_R);
    if (edge) { const s = Math.floor(Math.random() * 4); if (s === 0) x = -DOT_R; else if (s === 1) x = W + DOT_R; else if (s === 2) y = -DOT_R; else y = H + DOT_R; }
    return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, hue: Math.floor(Math.random() * 12) * 30, born: edge ? time : -10, edge };
  }
  function setupLevel(keepSnapshot) {
    blasts = []; sparks = []; floaters = []; popped = 0; chain = 0; phase = 'aim'; hint = 1;
    if (keepSnapshot && snapshot) dots = snapshot.map((d) => ({ ...d }));
    else {
      const n = mode === 'levels' ? LEVELS[level][0] : 140;
      dots = Array.from({ length: n }, () => makeDot(false));
      snapshot = dots.map((d) => ({ ...d }));
    }
    lvlSel.value = String(level);
    paint();
    persist();
  }
  function persist() { Curio.store.set(KEY, { mode, level, unlocked, bestChain, total: totalPops }); }

  function paint() {
    if (mode === 'levels') {
      const [n, need] = LEVELS[level];
      statEl.textContent = `${popped} / ${need}`;
      subEl.textContent = `Level ${level + 1} of ${LEVELS.length} · ${n} dots`;
      barEl.style.width = `${Math.min(100, popped / need * 100)}%`;
    } else {
      statEl.textContent = `${chain} chain`;
      subEl.textContent = `Best ${bestChain} · ${Curio.fmt(totalPops)} popped`;
      barEl.style.width = `${Math.min(100, chain / Math.max(20, bestChain) * 100)}%`;
    }
    document.getElementById('rewind').disabled = mode !== 'levels';
    lvlSel.disabled = mode !== 'levels';
  }
  function fillLevels() {
    lvlSel.innerHTML = '';
    LEVELS.forEach(([n, need], i) => {
      const o = document.createElement('option'); o.value = String(i);
      const best = Curio.getBest(`lvl${i}`);
      o.textContent = `${i + 1}. ${need} of ${n}${best != null ? ` (best ${best})` : ''}`;
      o.disabled = i > unlocked;
      lvlSel.append(o);
    });
    lvlSel.value = String(level);
  }

  function blastAt(x, y, hue, player) {
    blasts.push({ x, y, hue, t: 0, r: 0, player });
    for (let i = 0; i < (player ? 26 : 12); i++) { const a = Math.random() * Math.PI * 2, s = rnd(60, player ? 320 : 220); sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: rnd(0.4, 0.9), hue }); }
  }
  function pop(d) {
    popped++; chain++; totalPops++;
    blastAt(d.x, d.y, d.hue, false);
    popNote(chain - 1);
    if (chain >= 5 && chain % 5 === 0) floaters.push({ x: d.x, y: d.y - 10, text: `${chain}!`, life: 1.1, hue: d.hue });
    shake = Math.min(1, shake + 0.06);
  }

  function update(dt) {
    time += dt;
    for (const d of dots) {
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.edge) { if (d.x > DOT_R && d.x < W - DOT_R && d.y > DOT_R && d.y < H - DOT_R) d.edge = false; continue; }
      if (d.x < DOT_R) { d.x = DOT_R; d.vx = Math.abs(d.vx); } else if (d.x > W - DOT_R) { d.x = W - DOT_R; d.vx = -Math.abs(d.vx); }
      if (d.y < DOT_R) { d.y = DOT_R; d.vy = Math.abs(d.vy); } else if (d.y > H - DOT_R) { d.y = H - DOT_R; d.vy = -Math.abs(d.vy); }
    }
    for (const b of blasts) {
      b.t += dt;
      const max = b.player ? BLAST_R * 1.15 : BLAST_R;
      if (b.t < 0.32) { const u = b.t / 0.32; b.r = max * (1 - Math.pow(1 - u, 3)); }
      else if (b.t < 1.7) b.r = max;
      else b.r = Math.max(0, max * (1 - (b.t - 1.7) / 0.35));
    }
    blasts = blasts.filter((b) => b.t < 2.05);
    if (blasts.length) {
      const hit = [];
      for (let i = dots.length - 1; i >= 0; i--) {
        const d = dots[i];
        if (d.edge || time - d.born < 0.6) continue;
        for (const b of blasts) {
          if (b.r <= 0) continue;
          const rr = b.r + DOT_R;
          const dx = d.x - b.x, dy = d.y - b.y;
          if (dx * dx + dy * dy < rr * rr) { hit.push(d); dots.splice(i, 1); break; }
        }
      }
      for (const d of hit) pop(d);
      if (hit.length) paint();
    }
    for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 0.93; s.vy *= 0.93; s.life -= dt; }
    sparks = sparks.filter((s) => s.life > 0);
    if (sparks.length > 700) sparks.splice(0, sparks.length - 700);
    for (const f of floaters) { f.y -= 30 * dt; f.life -= dt; }
    floaters = floaters.filter((f) => f.life > 0);
    shake = Math.max(0, shake - dt * 1.5);
    if (mode === 'sandbox') {
      spawnT -= dt;
      if (dots.length < 140 && spawnT <= 0 && !blasts.length) { dots.push(makeDot(true)); spawnT = 0.03; }
      if (!blasts.length && chain) { if (chain > bestChain) { bestChain = chain; if (chain >= 20) Curio.toast(`New best chain: ${chain}!`); } chain = 0; persist(); paint(); }
    } else if (phase === 'chain' && !blasts.length) finish();
  }

  async function finish() {
    phase = 'done';
    const [n, need] = LEVELS[level];
    const r = Curio.best(`lvl${level}`, popped);
    persist();
    if (popped >= need) {
      SND.win(); Curio.confetti(Math.min(220, 60 + popped * 2));
      if (level + 1 > unlocked) unlocked = Math.min(LEVELS.length - 1, level + 1);
      persist(); fillLevels();
      const last = level === LEVELS.length - 1;
      const res = await Curio.modal({ emoji: last ? '🏆' : '💥', title: last ? 'Every level cleared!' : `Level ${level + 1} cleared!`, body: `You popped ${popped} of ${n} dots (needed ${need}).${r.isNew ? ' New personal best for this level!' : ` Best: ${r.best}.`}`, buttons: last ? [{ label: 'Try sandbox ♾️', value: 'sandbox' }, { label: 'Replay', value: 'again' }] : [{ label: 'Next level ▶', value: 'next' }, { label: 'Replay', value: 'again' }] });
      if (res === 'next') { level++; fillLevels(); setupLevel(false); }
      else if (res === 'sandbox') setMode('sandbox');
      else setupLevel(false);
    } else {
      SND.lose();
      const res = await Curio.modal({ emoji: popped >= need * 0.7 ? '😮' : '🫧', title: popped >= need * 0.7 ? 'So close!' : 'Fizzled out', body: `${popped} popped, ${need} needed. Rewind to try the same dots from a different spot, or roll new ones.`, buttons: [{ label: '↶ Rewind', value: 'rewind' }, { label: '🎲 New dots', value: 'new' }] });
      setupLevel(res === 'rewind');
    }
  }

  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const r = stage.getBoundingClientRect();
    cw = r.width; ch = r.height;
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    const top = cw < 560 ? 70 : 64;
    const aw = cw - 12, ah = ch - top - 8;
    const aspect = Math.max(0.55, Math.min(2.2, aw / Math.max(1, ah)));
    const nW = Math.sqrt(AREA * aspect), nH = AREA / nW;
    if (Math.abs(nW - W) > 1) {
      const fx = nW / W, fy = nH / H;
      for (const d of dots) { d.x *= fx; d.y *= fy; }
      for (const b of blasts) { b.x *= fx; b.y *= fy; }
      if (snapshot) for (const d of snapshot) { d.x *= fx; d.y *= fy; }
      W = nW; H = nH;
    }
    scale = Math.min(aw / W, ah / H);
    ox = (cw - W * scale) / 2; oy = top + (ch - top - 8 - H * scale) / 2;
    sprites = new Map();
  }
  function sprite(hue) {
    let s = sprites.get(hue);
    if (s) return s;
    const R = Math.ceil(DOT_R * 3 * scale * dpr) + 2;
    const c = document.createElement('canvas'); c.width = c.height = R * 2;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(R, R, 0, R, R, R);
    gr.addColorStop(0, `hsla(${hue},100%,75%,0.55)`); gr.addColorStop(0.35, `hsla(${hue},100%,60%,0.18)`); gr.addColorStop(1, `hsla(${hue},100%,50%,0)`);
    x.fillStyle = gr; x.fillRect(0, 0, R * 2, R * 2);
    const r = DOT_R * scale * dpr;
    x.fillStyle = `hsl(${hue},95%,62%)`; x.beginPath(); x.arc(R, R, r, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,.75)'; x.beginPath(); x.arc(R - r * 0.3, R - r * 0.3, r * 0.35, 0, 7); x.fill();
    s = { c, R: R / (scale * dpr) };
    sprites.set(hue, s);
    return s;
  }

  let hover = null;
  function draw() {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#120a2e'; g.fillRect(0, 0, cw, ch);
    const sx = shake ? (Math.random() - 0.5) * shake * 8 : 0, sy = shake ? (Math.random() - 0.5) * shake * 8 : 0;
    g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (ox + sx), dpr * (oy + sy));
    const bg = g.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, W * 0.7);
    bg.addColorStop(0, '#24145a'); bg.addColorStop(1, '#150c38');
    g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, W, H, 18); g.fill();
    g.save(); g.clip();
    g.globalCompositeOperation = 'lighter';
    for (const b of blasts) {
      const a = b.t > 1.7 ? Math.max(0, 1 - (b.t - 1.7) / 0.35) : 1;
      g.fillStyle = b.player ? `rgba(255,255,255,${0.18 * a})` : `hsla(${b.hue},100%,60%,${0.22 * a})`;
      g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.fill();
      g.strokeStyle = b.player ? `rgba(255,255,255,${0.7 * a})` : `hsla(${b.hue},100%,70%,${0.55 * a})`;
      g.lineWidth = 2.5; g.stroke();
    }
    for (const d of dots) { const s = sprite(d.hue); g.drawImage(s.c, d.x - s.R, d.y - s.R, s.R * 2, s.R * 2); }
    let lastHue = -1;
    for (const s of sparks) { if (s.hue !== lastHue) { lastHue = s.hue; g.fillStyle = `hsl(${s.hue},100%,70%)`; } g.globalAlpha = Math.min(1, s.life * 1.6); g.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const f of floaters) { g.globalAlpha = Math.min(1, f.life * 1.5); g.fillStyle = `hsl(${f.hue},100%,80%)`; g.font = `900 ${22 + Math.min(20, chain / 3)}px system-ui, sans-serif`; g.fillText(f.text, f.x, f.y); }
    g.globalAlpha = 1;
    g.restore();
    if (phase === 'aim' && mode === 'levels') {
      if (hover) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.arc(hover[0], hover[1], BLAST_R * 1.15, 0, 7); g.stroke(); g.setLineDash([]); }
      if (hint > 0) {
        const [n, need] = LEVELS[level];
        g.globalAlpha = Math.min(1, hint);
        g.fillStyle = 'rgba(255,255,255,.92)'; g.font = '900 34px system-ui, sans-serif';
        g.fillText(`Pop ${need} of ${n}`, W / 2, H / 2 - 16);
        g.fillStyle = 'rgba(201,189,245,.9)'; g.font = '700 18px system-ui, sans-serif';
        g.fillText('Click anywhere to set off your blast', W / 2, H / 2 + 20);
        g.globalAlpha = 1;
      }
    }
    if (mode === 'sandbox' && keyAim && hover) { g.strokeStyle = 'rgba(255,255,255,.5)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.arc(hover[0], hover[1], BLAST_R * 1.15, 0, 7); g.stroke(); g.setLineDash([]); }
    if (mode === 'sandbox' && !touched) { g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '800 22px system-ui, sans-serif'; g.fillText('Sandbox: click as much as you like', W / 2, H / 2); }
  }

  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left - ox) / scale, (e.clientY - r.top - oy) / scale]; };
  let keyAim = false;
  canvas.addEventListener('pointerdown', (e) => {
    if (paused) { audioOk = true; return; }
    fireAt(...pos(e));
  });
  function fireAt(x, y) {
    audioOk = true;
    if (!touched) { touched = true; intro.classList.add('is-faded'); }
    if (x < 0 || y < 0 || x > W || y > H) return;
    if (mode === 'levels') {
      if (phase !== 'aim') return;
      phase = 'chain'; hint = 0;
    }
    budget += 2; SND.place();
    blastAt(x, y, 0, true);
  }
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') { hover = pos(e); keyAim = false; } });
  canvas.addEventListener('pointerleave', () => { if (!keyAim) hover = null; });

  function setMode(m) {
    mode = m;
    for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
    setupLevel(false);
  }
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => { audioOk = true; setMode(b.dataset.mode); });
  document.getElementById('rewind').addEventListener('click', () => { audioOk = true; if (mode === 'levels') setupLevel(true); });
  document.getElementById('fresh').addEventListener('click', () => { audioOk = true; setupLevel(false); });
  lvlSel.addEventListener('change', () => { level = +lvlSel.value; setupLevel(false); });
  function togglePause() { paused = !paused; const b = document.getElementById('pause'); b.setAttribute('aria-pressed', String(paused)); b.textContent = paused ? '▶ Play' : '⏸ Pause'; tagEl.textContent = paused ? 'PAUSED' : ''; tagEl.classList.toggle('is-on', paused); }
  document.getElementById('pause').addEventListener('click', togglePause);
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); togglePause(); }
    else if (k === 'r') document.getElementById('rewind').click();
    else if (k === 'n') document.getElementById('fresh').click();
    else if (k === 's') setMode(mode === 'levels' ? 'sandbox' : 'levels');
    else if (k.startsWith('arrow')) {
      if (e.target.closest?.('select')) return;
      e.preventDefault();
      const st = e.shiftKey ? 60 : 20;
      if (!hover) hover = [W / 2, H / 2];
      if (k === 'arrowleft') hover[0] -= st; else if (k === 'arrowright') hover[0] += st;
      else if (k === 'arrowup') hover[1] -= st; else if (k === 'arrowdown') hover[1] += st;
      hover = [Math.max(0, Math.min(W, hover[0])), Math.max(0, Math.min(H, hover[1]))];
      keyAim = true;
    }
    else if (k === 'enter' || k === 'f') {
      if (e.target.closest?.('button, select')) return;
      if (paused) return;
      if (keyAim && hover) { e.preventDefault(); fireAt(hover[0], hover[1]); return; }
      if (k === 'enter' && phase === 'aim' && mode === 'levels') { const d = dots[Math.floor(Math.random() * dots.length)]; if (d) { audioOk = true; phase = 'chain'; hint = 0; budget += 2; SND.place(); blastAt(d.x + 20, d.y, 0, true); } }
    }
  });

  let last = 0, raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    budget = 4;
    if (!paused) update(dt);
    draw();
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  window.addEventListener('resize', fit);
  window.Chain = { get dots() { return dots; }, get popped() { return popped; }, get phase() { return phase; }, setMode, clickAt: (x, y) => { audioOk = true; if (mode === 'levels') { if (phase !== 'aim') return; phase = 'chain'; hint = 0; } blastAt(x, y, 0, true); }, setLevel: (i) => { level = i; setupLevel(false); } };

  fit();
  fillLevels();
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  setupLevel(false);
  start();
  if (matchMedia('(pointer: fine)').matches && !Curio.store.get('tp-hint-chain-reaction', false)) { Curio.store.set('tp-hint-chain-reaction', true); setTimeout(() => Curio.toast('Tip: one plain click is all it takes, no dragging, so touchpads are fine. You can also aim with the arrow keys and press Enter', 4200), 1800); }
})();
