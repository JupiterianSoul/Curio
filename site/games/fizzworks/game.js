(() => {
  const $ = (id) => document.getElementById(id);
  const ADV = Curio.advanced;
  const { BW, BH, KIND, SPARK_R, World, bestClick } = FZ;
  const LEVELS = FZ_LEVELS.filter((l) => ADV || !l.adv);
  const KEY = `fizzworks:${Curio.mode}`;
  const prog = Object.assign({ stars: {}, at: 0 }, Curio.store.get(KEY, {}));
  if (typeof prog.stars !== 'object' || !prog.stars) prog.stars = {};
  const save = () => Curio.store.set(KEY, prog);
  const COL = { b: ['#9be15d', '#4fa52a'], big: ['#ffb347', '#e0701a'], tiny: ['#7fe7f2', '#2aa6c4'], rk: ['#ff7eb6', '#d23a7c'], sh: ['#9be15d', '#4fa52a'], dud: ['#ff6b5e', '#b3261e'], tm: ['#c89bff', '#7a3fe0'] };
  const DESC = { b: 'Fizzer: pops with a medium burst.', big: 'Big fizzer: a huge burst. Small ones cannot reach back to it.', tiny: 'Tiny fizzer: a little burst that only reaches close neighbours.', rk: 'Rocket: fires a thin beam the way it points, all the way to the wall.', sh: 'Shielded: needs two hits from two different pops or beams.', dud: 'Dud: must not pop. If it does, the experiment fails.', tm: 'Timer: waits a moment after being hit, then pops with a big burst.' };

  const cv = $('tray'), g = cv.getContext('2d');
  let cw = 800, ch = 500, dpr = 1, sc = 1, ox = 0, oy = 0, vis = 1;
  let li = Math.min(prog.at | 0, LEVELS.length - 1), level = LEVELS[li], world = null, used = 0, state = 'aim', hinted = false, hintPt = null, fails = 0, daily = false, quota = 0;
  let aim = null, keyAim = false, parts = [], rings = [], shake = 0, chainN = 0, lastPop = 0, startT = 0;

  function fit() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    cw = r.width; ch = r.height;
    cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
    sc = Math.min(cw / BW, ch / BH); ox = (cw - BW * sc) / 2; oy = (ch - BH * sc) / 2; vis = Math.max(1, Math.min(1.6, .55 / sc));
  }
  addEventListener('resize', fit);

  let ac = null;
  const audio = () => (Curio.muted ? null : (ac = Curio.audioContext && Curio.audioContext()));
  const PENTA = [0, 2, 4, 7, 9];
  function tone(f, d, type = 'triangle', v = .1, to) {
    const a = audio(); if (!a) return;
    const t = a.currentTime, o = a.createOscillator(), gn = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    gn.gain.setValueAtTime(0, t); gn.gain.linearRampToValueAtTime(v, t + .005); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(gn).connect(a.destination); o.start(t); o.stop(t + d + .02);
  }
  function popSound(kind) {
    const k = chainN++, oct = Math.min(3, Math.floor(k / 5)), semi = oct * 12 + PENTA[k % 5];
    const f = 330 * Math.pow(2, semi / 12) * (kind === 'big' ? .5 : kind === 'tiny' ? 2 : 1);
    if (performance.now() - lastPop < 18) return;
    lastPop = performance.now();
    tone(f, .18, 'sine', .09, f * 1.6);
    tone(f * 2, .06, 'triangle', .03);
  }

  function load(i, isDaily) {
    daily = !!isDaily;
    if (!daily) { li = i; level = LEVELS[li]; prog.at = li; save(); }
    world = new World(level); used = 0; state = 'aim'; hinted = false; hintPt = null; parts = []; rings = []; chainN = 0; startT = performance.now();
    $('lvlNo').textContent = daily ? `Daily lab, ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : `Level ${li + 1} of ${LEVELS.length}`;
    $('lvlName').textContent = level.name;
    $('tip').textContent = level.tip;
    banner(daily ? `Beat the lab record: ${quota}` : level.name, 1600);
    paintHud();
  }
  function paintHud() {
    const s = world.score();
    $('left').textContent = daily ? `${s.popped}` : s.left;
    document.querySelector('.fz-left small').textContent = daily ? `popped, record ${quota}` : 'to pop';
    const box = $('sparks'); box.innerHTML = '';
    for (let k = 0; k < level.sparks; k++) { const i = document.createElement('i'); if (k < used) i.className = 'used'; box.append(i); }
    box.setAttribute('aria-label', `${level.sparks - used} sparks left`);
  }
  let bannerT = 0;
  function banner(t, ms) { const b = $('banner'); b.textContent = t; b.classList.add('on'); clearTimeout(bannerT); bannerT = setTimeout(() => b.classList.remove('on'), ms || 1400); }

  function toBoard(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - ox) / sc, y: (e.clientY - r.top - oy) / sc }; }
  function spark(x, y) {
    if (state === 'over' || used >= level.sparks) return;
    if (x < -20 || y < -20 || x > BW + 20 || y > BH + 20) return;
    used++; state = 'run'; hintPt = null; chainN = 0;
    world.spark(x, y);
    tone(180, .35, 'sine', .18, 60); tone(900, .1, 'triangle', .05, 300);
    for (let k = 0; k < 18; k++) { const a = Math.random() * 6.28, s = 80 + Math.random() * 260; parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .5 + Math.random() * .3, c: '#fff6c8', r: 2 }); }
    paintHud();
  }
  cv.addEventListener('pointerdown', (e) => { e.preventDefault(); const p = toBoard(e); keyAim = false; aim = p; spark(p.x, p.y); });
  cv.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') { aim = toBoard(e); keyAim = false; } });
  cv.addEventListener('pointerleave', () => { if (!keyAim) aim = null; });

  function handleEvents() {
    for (const ev of world.events) {
      if (ev.k === 'pop') {
        const p = ev.p, c = COL[p.t];
        popSound(p.t);
        rings.push({ x: p.x, y: p.y, R: p.R, t: 0, c: c[0] });
        const n = p.t === 'big' ? 26 : p.t === 'tiny' ? 8 : 14;
        for (let k = 0; k < n; k++) { const a = Math.random() * 6.28, s = 60 + Math.random() * (p.t === 'big' ? 340 : 200); parts.push({ x: p.x, y: p.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: .5 + Math.random() * .5, c: Math.random() < .5 ? c[0] : '#ffffff', r: 2 + Math.random() * 3 }); }
        shake = Math.min(1, shake + (p.t === 'big' ? .35 : .08));
        if (p.t === 'rk') tone(500, .3, 'sawtooth', .04, 1800);
        if (p.t === 'dud') { tone(110, .5, 'square', .09, 70); shake = 1; navigator.vibrate && navigator.vibrate([40, 40, 80]); }
      } else if (ev.k === 'crack') { tone(1800, .08, 'triangle', .07); tone(2600, .05, 'sine', .04); }
      else if (ev.k === 'arm') tone(880, .05, 'square', .04);
    }
    world.events = [];
  }

  function settle() {
    const s = world.score();
    paintHud();
    if (s.duds > 0) return finish(false, 'A dud went off', 'The red ones were meant to stay put. Try another spot.');
    if (daily) {
      if (used >= level.sparks) return finishDaily(s);
      state = 'aim'; return;
    }
    if (s.left === 0) return finish(true);
    if (used >= level.sparks) return finish(false, 'Fizzled out', `${s.left} fizzer${s.left === 1 ? '' : 's'} still sitting there, smug.`);
    state = 'aim';
  }
  function starsFor() { let st = used <= level.par ? 3 : 2; if (hinted) st = Math.min(st, 2); return st; }
  function overlay(title, body, btns, grid) {
    $('ovTitle').textContent = title; $('ovBody').textContent = body;
    const g2 = $('ovGrid'); g2.innerHTML = ''; if (grid) g2.append(grid);
    const b = $('ovBtns'); b.innerHTML = '';
    btns.forEach((x) => { const e = document.createElement('button'); e.type = 'button'; e.className = 'c-btn' + (x.ghost ? ' c-btn--ghost' : ''); e.textContent = x.label; e.addEventListener('click', () => { closeOver(); x.go(); }); b.append(e); });
    $('over').hidden = false; b.querySelector('button')?.focus();
  }
  function closeOver() { $('over').hidden = true; }
  function finish(win, title, body) {
    state = 'over';
    if (win) {
      const st = starsFor();
      if ((prog.stars[li] || 0) < st) { prog.stars[li] = st; save(); }
      Curio.sfx && Curio.sfx('success'); Curio.confetti();
      const last = li === LEVELS.length - 1;
      const total = Object.values(prog.stars).reduce((a, b) => a + b, 0);
      setTimeout(() => overlay(last ? 'The whole lab is clean!' : `${'★'.repeat(st)}${'☆'.repeat(3 - st)}`, last ? `Every experiment done. ${total} of ${LEVELS.length * 3} stars.${ADV ? ' The daily lab has a new tray every day.' : ' Switch to Advanced for 16 more experiments.'}` : `${level.name} cleared with ${used} spark${used === 1 ? '' : 's'}.${st < 3 ? (hinted ? ' Hints cap it at two stars.' : ` Par is ${level.par}.`) : ''}`, last ? [{ label: 'Pick a level', go: showLevels }, { label: 'Replay', ghost: true, go: () => load(li) }] : [{ label: 'Next experiment', go: () => load(li + 1) }, { label: 'Replay', ghost: true, go: () => load(li) }]), 650);
    } else {
      fails++;
      Curio.sfx && Curio.sfx('error');
      setTimeout(() => overlay(title, `${body}${fails >= 2 && !ADV ? ' Stuck? The Hint button shows a good spot.' : ''}`, [{ label: 'Try again', go: () => load(li, daily) }, { label: 'Levels', ghost: true, go: showLevels }]), 500);
    }
  }
  function finishDaily(s) {
    state = 'over';
    const day = dayKey();
    const rec = Curio.store.get(KEY + ':daily', {});
    const prev = rec[day] || 0;
    if (s.popped > prev) { rec[day] = s.popped; Curio.store.set(KEY + ':daily', rec); }
    const beat = s.popped >= quota;
    if (beat) { Curio.confetti(); Curio.sfx && Curio.sfx('success'); } else Curio.sfx && Curio.sfx('error');
    setTimeout(() => overlay(beat ? (s.popped > quota ? 'New lab record!' : 'Matched the lab record') : 'Not quite the record', `You popped ${s.popped} of ${s.popped + s.left} with no duds. The lab record is ${quota}. Your best today: ${Math.max(prev, s.popped)}.`, [{ label: 'Try again', go: () => load(0, true) }, { label: 'Back to the levels', ghost: true, go: () => load(li) }]), 500);
  }

  function hint() {
    if (state === 'over' || daily) return;
    if (!hintPt) {
      const prior = [];
      const b = bestClick(level, prior, 25);
      hintPt = b ? { x: b.x, y: b.y } : null;
    }
    if (hintPt) { hinted = true; banner('Try a spark around the glowing ring', 1800); tone(1200, .1, 'sine', .05); }
  }

  function showLevels() {
    state = state === 'over' ? 'over' : state;
    const grid = document.createElement('div'); grid.className = 'fz-levels';
    LEVELS.forEach((l, i) => {
      const open = i === 0 || prog.stars[i - 1] || prog.stars[i] || i <= (prog.at | 0);
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fz-lv' + (open ? '' : ' locked') + (l.adv ? ' adv' : '');
      b.disabled = !open;
      const st = prog.stars[i] || 0;
      b.innerHTML = `<b>${i + 1}</b><span>${open ? l.name : 'Locked'}</span><small>${'★'.repeat(st)}${'☆'.repeat(3 - st)}</small>`;
      b.addEventListener('click', () => { closeOver(); load(i); });
      grid.append(b);
    });
    const total = Object.values(prog.stars).reduce((a, b) => a + b, 0);
    overlay('Experiments', `${total} of ${LEVELS.length * 3} stars collected.`, [{ label: 'Close', ghost: true, go: () => {} }], grid);
  }
  const dayKey = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
  function startDaily() {
    level = FZ_DAILY(dayKey());
    banner('Measuring the lab record...', 3000);
    setTimeout(() => {
      const a = bestClick(level, [], 25);
      const b = bestClick(level, [{ x: a.x, y: a.y }], 25);
      quota = b.s.popped;
      load(0, true);
    }, 40);
  }

  const LEG = $('legend');
  for (const k of ADV ? ['b', 'big', 'tiny', 'rk', 'sh', 'dud', 'tm'] : ['b', 'big', 'tiny', 'rk']) {
    const li2 = document.createElement('li');
    li2.innerHTML = `<i style="background:radial-gradient(circle at 35% 35%, ${COL[k][0]}, ${COL[k][1]})"></i>`;
    li2.append(DESC[k]); LEG.append(li2);
  }

  function blob(p, t) {
    const c = COL[p.t], r = p.r * vis;
    g.save(); g.translate(p.x, p.y);
    const wob = 1 + Math.sin(t * 3 + p.i) * .04;
    if (p.t === 'rk') {
      g.rotate(p.a * Math.PI / 180);
      g.strokeStyle = 'rgba(255,126,182,.25)'; g.setLineDash([6, 10]); g.lineWidth = 2; g.beginPath(); g.moveTo(r + 4, 0); g.lineTo(r + 120, 0); g.stroke(); g.setLineDash([]);
      g.fillStyle = c[1]; g.beginPath(); g.moveTo(-r, -r * .9); g.lineTo(-r * .2, -r * .4); g.lineTo(-r * .2, r * .4); g.lineTo(-r, r * .9); g.closePath(); g.fill();
      const gr = g.createLinearGradient(0, -r * .6, 0, r * .6); gr.addColorStop(0, '#ffd1e5'); gr.addColorStop(1, c[1]);
      g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, r * 1.25, r * .58, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(r * .35, 0, r * .22, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3a1830'; g.beginPath(); g.arc(r * .4, 0, r * .11, 0, Math.PI * 2); g.fill();
      g.restore(); return;
    }
    g.scale(wob, 2 - wob);
    const gr = g.createRadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(.25, c[0]); gr.addColorStop(1, c[1]);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill();
    if (p.t === 'sh') {
      g.strokeStyle = p.hp > 1 ? '#e6edf3' : '#9aa7b3'; g.lineWidth = 4;
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + Math.PI / 6; const x = Math.cos(a) * (r + 5), y = Math.sin(a) * (r + 5); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke();
      if (p.hp < 2) { g.strokeStyle = '#2b3440'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-r - 4, -4); g.lineTo(-4, 2); g.lineTo(3, -7); g.lineTo(r + 3, 4); g.stroke(); }
    }
    if (p.t === 'tm') {
      g.strokeStyle = '#efe2ff'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (p.popAt != null ? Math.max(0, (p.popAt - world.t) / p.d) : 1)); g.stroke();
      g.fillStyle = '#2a1050'; g.font = `900 ${r * .9}px system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(p.popAt != null ? Math.max(0, p.popAt - world.t).toFixed(1) : p.d.toFixed(1), 0, r * .55);
    }
    const lx = aim ? Math.max(-1, Math.min(1, (aim.x - p.x) / 120)) : 0, ly = aim ? Math.max(-1, Math.min(1, (aim.y - p.y) / 120)) : 0;
    const ey = p.t === 'tm' ? -r * .25 : -r * .1, ex = r * .34, er = Math.max(2.2, r * .26);
    if (p.t === 'dud') {
      g.strokeStyle = '#3b0b08'; g.lineWidth = 2.4;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * ex - er * .7, ey - er * .7); g.lineTo(s * ex + er * .7, ey + er * .7); g.moveTo(s * ex + er * .7, ey - er * .7); g.lineTo(s * ex - er * .7, ey + er * .7); g.stroke(); }
      g.beginPath(); g.arc(0, r * .45, r * .25, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
    } else {
      for (const s of [-1, 1]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(s * ex, ey, er, 0, Math.PI * 2); g.fill(); g.fillStyle = '#16210f'; g.beginPath(); g.arc(s * ex + lx * er * .45, ey + ly * er * .45, er * .5, 0, Math.PI * 2); g.fill(); }
      if (p.popAt != null && p.t !== 'tm') { g.fillStyle = '#16210f'; g.beginPath(); g.arc(0, r * .45, r * .2, 0, Math.PI * 2); g.fill(); }
    }
    g.restore();
  }

  function draw(t) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, cw, ch);
    const sx = shake ? (Math.random() - .5) * shake * 10 : 0, sy = shake ? (Math.random() - .5) * shake * 10 : 0;
    g.setTransform(dpr * sc, 0, 0, dpr * sc, dpr * (ox + sx), dpr * (oy + sy));
    const bg = g.createLinearGradient(0, 0, 0, BH); bg.addColorStop(0, '#123c45'); bg.addColorStop(1, '#0b2830');
    g.fillStyle = bg; g.beginPath(); g.roundRect(0, 0, BW, BH, 26); g.fill();
    g.save(); g.clip();
    g.strokeStyle = 'rgba(160,230,230,.07)'; g.lineWidth = 1;
    for (let x = 50; x < BW; x += 50) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, BH); g.stroke(); }
    for (let y = 50; y < BH; y += 50) { g.beginPath(); g.moveTo(0, y); g.lineTo(BW, y); g.stroke(); }
    for (let k = 0; k < 18; k++) { const bx = (k * 173 + t * 12 * (1 + k % 3)) % (BW + 40) - 20, by = BH - ((t * 30 * (1 + k % 4) + k * 97) % (BH + 40)); g.fillStyle = 'rgba(160,240,230,.08)'; g.beginPath(); g.arc(bx, by, 3 + k % 4 * 2, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = 'lighter';
    for (const b of world.blasts) {
      const a = 1 - b.age / .5, col = b.src < 0 ? '255,246,200' : b.kind === 'dud' ? '255,90,80' : b.kind === 'big' ? '255,170,80' : b.kind === 'tiny' ? '120,230,245' : b.kind === 'tm' ? '200,155,255' : b.kind === 'sh' ? '200,220,230' : '160,230,100';
      g.fillStyle = `rgba(${col},${.16 * a})`; g.beginPath(); g.arc(b.x, b.y, b.r, 0, Math.PI * 2); g.fill();
      g.strokeStyle = `rgba(${col},${.7 * a})`; g.lineWidth = 3; g.stroke();
    }
    for (const m of world.beams) {
      const a = m.done ? Math.max(0, 1 - (m.fade || 0) / .25) : 1;
      g.strokeStyle = `rgba(255,140,200,${.35 * a})`; g.lineWidth = 22; g.lineCap = 'round';
      g.beginPath(); g.moveTo(m.x, m.y); g.lineTo(m.x + m.dx * m.len, m.y + m.dy * m.len); g.stroke();
      g.strokeStyle = `rgba(255,235,245,${a})`; g.lineWidth = 5; g.stroke();
    }
    for (const p of parts) { g.globalAlpha = Math.max(0, Math.min(1, p.life * 2)); g.fillStyle = p.c; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    let hov = null;
    if (aim && state !== 'over') for (const p of world.pieces) if (p.alive && Math.hypot(p.x - aim.x, p.y - aim.y) < p.r + 10) hov = p;
    if (hov) {
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.setLineDash([5, 7]); g.lineWidth = 2;
      g.beginPath(); g.arc(hov.x, hov.y, hov.R, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    }
    for (const p of world.pieces) if (p.alive) blob(p, t);
    if (hintPt) {
      const k = (Math.sin(t * 5) + 1) / 2;
      g.strokeStyle = `rgba(255,236,120,${.5 + k * .5})`; g.lineWidth = 4; g.beginPath(); g.arc(hintPt.x, hintPt.y, SPARK_R * (.9 + k * .15), 0, Math.PI * 2); g.stroke();
    }
    if (aim && state !== 'over' && used < level.sparks) {
      g.strokeStyle = 'rgba(255,246,200,.85)'; g.lineWidth = 2.5; g.setLineDash([8, 6]);
      g.beginPath(); g.arc(aim.x, aim.y, SPARK_R, t * .8, t * .8 + Math.PI * 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = 'rgba(255,246,200,.9)'; g.beginPath(); g.arc(aim.x, aim.y, 3, 0, Math.PI * 2); g.fill();
    }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 6; g.beginPath(); g.roundRect(3, 3, BW - 6, BH - 6, 24); g.stroke();
  }

  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    if (document.hidden) { last = now; return; }
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now;
    const t = now / 1000;
    if (world) {
      world.step(dt);
      handleEvents();
      if (state === 'run' && !world.busy()) settle();
      else if (state === 'run') paintHudSoon();
      for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy = p.vy * .92 + 120 * dt; p.life -= dt; }
      parts = parts.filter((p) => p.life > 0);
      if (parts.length > 600) parts.splice(0, parts.length - 600);
      shake = Math.max(0, shake - dt * 2.2);
      draw(t);
    }
  }
  let hudT = 0;
  function paintHudSoon() { const n = performance.now(); if (n - hudT > 120) { hudT = n; paintHud(); } }

  $('retry').addEventListener('click', () => { closeOver(); load(li, daily); });
  $('hint').addEventListener('click', hint);
  $('levels').addEventListener('click', showLevels);
  $('daily').addEventListener('click', startDaily);
  if (!ADV) $('daily').remove();
  $('over').addEventListener('click', (e) => { if (e.target === $('over')) closeOver(); });
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('over').hidden) { if (e.key === 'Escape') closeOver(); return; }
    const k = e.key.toLowerCase();
    if (k.startsWith('arrow')) {
      e.preventDefault();
      const st = e.shiftKey ? 60 : 20;
      if (!aim) aim = { x: BW / 2, y: BH / 2 };
      aim = { x: Math.max(0, Math.min(BW, aim.x + (k === 'arrowright' ? st : k === 'arrowleft' ? -st : 0))), y: Math.max(0, Math.min(BH, aim.y + (k === 'arrowdown' ? st : k === 'arrowup' ? -st : 0))) };
      keyAim = true;
    } else if ((k === 'enter' || k === ' ') && !(e.target.closest && e.target.closest('button, summary'))) { e.preventDefault(); if (!aim) aim = { x: BW / 2, y: BH / 2 }; spark(aim.x, aim.y); }
    else if (k === 'r') load(li, daily);
    else if (k === 'h') hint();
    else if (k === 'l') showLevels();
    else if (k === 'n' && prog.stars[li] && li < LEVELS.length - 1) load(li + 1);
  });

  fit();
  load(li);
  requestAnimationFrame(frame);
  if (!Curio.store.get('fizzworks:seen', false)) { Curio.store.set('fizzworks:seen', true); setTimeout(() => banner('Click near a fizzer to drop a spark', 2600), 1700); }
  window.FZG = { load, spark, get world() { return world; }, get state() { return state; }, showLevels, startDaily, hint };
})();
