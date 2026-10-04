(() => {
  const WTP = window.WTP;
  const { P32, PAL, rand, randInt } = WTP;
  const SP = WTP.sprites;
  const T = { on: false, mode: 'title', t: 0 };
  WTP.title = T;
  let cv, ctx, P = 3, cw = 0, ch = 0, raf = 0, last = 0;
  let wins = [], parts = [], booms = [], shots = [], stars = [], far = [];
  let logo = null, logoT = 0, dark = true, hero = null;
  const DITH = SP.dith;

  function isDark() { return WTP.C.isDark ? WTP.C.isDark() : true; }
  T.init = () => {
    cv = WTP.$('bg'); ctx = cv.getContext('2d');
    window.addEventListener('resize', () => { if (T.on) resize(); });
    window.addEventListener('curio:theme', () => { dark = isDark(); });
    dark = isDark();
    document.addEventListener('visibilitychange', () => { if (!document.hidden && T.on) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); } });
  };
  function resize() {
    const r = cv.parentElement.getBoundingClientRect();
    P = Math.max(2, Math.min(6, Math.round(Math.min(r.width / 300, r.height / 190))));
    cw = Math.ceil(r.width / P); ch = Math.ceil(r.height / P);
    cv.width = cw; cv.height = ch;
    build();
    place();
  }
  function mkWindow(x, layer) {
    const w = randInt(40, 76), h = randInt(44, 84);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    const themes = [['7', 'e', '5'], ['7', 'c', '5'], ['Y', 'o', '4'], ['7', 'l', '5'], ['K', 'k', '4'], ['C', 'b', '4'], ['6', 'P', '4'], ['7', 'y', '3']];
    const [bg, ac, tx] = WTP.pick(themes);
    g.fillStyle = PAL['0']; g.fillRect(0, 0, w, h);
    g.fillStyle = PAL[bg]; g.fillRect(1, 1, w - 2, h - 2);
    g.fillStyle = PAL['6']; g.fillRect(1, 1, w - 2, 7);
    g.fillStyle = PAL['0']; g.fillRect(1, 8, w - 2, 1);
    g.fillStyle = PAL.e; g.fillRect(3, 3, 2, 2); g.fillStyle = PAL.y; g.fillRect(7, 3, 2, 2); g.fillStyle = PAL.l; g.fillRect(11, 3, 2, 2);
    g.fillStyle = PAL['7']; g.fillRect(16, 3, w - 20, 3);
    g.fillStyle = PAL[ac]; g.fillRect(1, 9, w - 2, 6);
    let y = 18;
    while (y < h - 6) {
      const r = Math.random();
      if (r < 0.2 && y < h - 22) { g.fillStyle = PAL[ac]; g.fillRect(4, y, Math.min(26, w - 8), 14); g.fillStyle = PAL['7']; g.fillRect(6, y + 9, 6, 3); y += 18; continue; }
      g.fillStyle = PAL[tx];
      g.fillRect(4, y, randInt(Math.floor(w * 0.4), w - 8), 2);
      y += 5;
    }
    const sx = layer === 0 ? 0.25 : 0.55;
    return { c, g, x, y: ch - h - (layer === 0 ? randInt(26, 50) : randInt(4, 18)), w, h, layer, sx, hp: 1 };
  }
  function build() {
    wins = [];
    let x = -10;
    while (x < cw * 1.6) { wins.push(mkWindow(x, 0)); x += randInt(40, 70); }
    x = -20;
    while (x < cw * 1.6) { wins.push(mkWindow(x, 1)); x += randInt(60, 100); }
    wins.sort((a, b) => a.layer - b.layer);
    stars = [];
    for (let k = 0; k < (cw * ch) / 180; k++) stars.push({ x: rand(0, cw), y: rand(0, ch * 0.6), p: rand(0, 6) });
    far = [];
    let fx = 0;
    while (fx < cw + 60) { const w = randInt(14, 34), h = randInt(20, 60); far.push({ x: fx, w, h }); fx += w + randInt(0, 6); }
    hero = { x: Math.round(cw * 0.12), dir: 1, t: 0, fireT: 2, anim: 'idle', fi: 0 };
    makeLogo();
  }
  const logoGeom = (scale) => { const s = scale + 1, s2 = scale; const by = Math.round(ch * 0.14) - 4 * s - 12; return { by, bh: 12 * s + 16 * s2 + 16 }; };
  function plateH() { const pl = WTP.$('tPlate'); return (pl && pl.offsetHeight) || 230; }
  function fitScale() {
    let scale = Math.max(1, Math.min(4, Math.floor(cw / 115)));
    const H = ch * P;
    while (scale > 1) { const g = logoGeom(scale); if ((g.by + g.bh + 4) * P + plateH() + 40 <= H) break; scale--; }
    return scale;
  }
  function place() {
    const sp = WTP.$('tSpacer');
    if (!sp || !logo) return;
    const want = fitScale();
    if (want !== logo.scale) makeLogo();
    const g = logoGeom(logo.scale);
    const H = ch * P;
    const top = Math.max(8, Math.min((g.by + g.bh + 4) * P + 16, H - plateH() - 30));
    sp.style.height = `${Math.round(top)}px`;
  }
  T.place = place;
  function makeLogo() {
    const scale = fitScale();
    const mk = (txt, ramp, dc) => [...txt].map((ch2) => ch2 === ' ' ? null : WTP.font.textCanvas(ch2, { big: true, outline: '0', ramp, depth: 3, depthColor: dc }));
    logo = {
      scale,
      l1: mk('WRECK', ['7', 'Y', 'Y', 'y', 'y', 'a', 'a', 'o', 'e', 'e', 'R'], 'r'),
      l2: mk('THIS PAGE', ['7', '7', 'C', 'C', 'c', 'c', 'b', 'b', 'n', 'n'], 'n'),
      hit: new Map()
    };
    logoT = 0;
  }
  function boom(x, y, r = 10) {
    booms.push({ x, y, size: r * 2.6, t: 0, dur: 0.5 + r * 0.01 });
    for (let k = 0; k < r * 3; k++) { const a = rand(0, 6.28), s = rand(20, 90); parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, c: Math.random() < 0.5 ? PAL.y : PAL.o, life: rand(0.3, 0.9), g: 140 }); }
    for (const w of wins) {
      const wx = Math.round(w.x), wy = w.y;
      if (x < wx - r || x > wx + w.w + r || y < wy - r || y > wy + w.h + r) continue;
      const lx = x - wx, ly = y - wy;
      const g = w.g;
      const img = g.getImageData(0, 0, w.w, w.h);
      const u = new Uint32Array(img.data.buffer);
      for (let yy = Math.max(0, Math.floor(ly - r - 2)); yy < Math.min(w.h, ly + r + 2); yy++) for (let xx = Math.max(0, Math.floor(lx - r - 2)); xx < Math.min(w.w, lx + r + 2); xx++) {
        const d = Math.hypot(xx - lx, yy - ly) + ((xx * 7 + yy * 13) % 5) * 0.4 - 1;
        const i = yy * w.w + xx;
        if (d < r) {
          if (u[i] && Math.random() < 0.3) parts.push({ x: wx + xx, y: wy + yy, vx: (xx - lx) * rand(3, 8), vy: (yy - ly) * rand(3, 8) - 30, c: `rgb(${u[i] & 255},${(u[i] >> 8) & 255},${(u[i] >> 16) & 255})`, life: rand(0.8, 1.8), g: 220 });
          u[i] = 0;
        } else if (d < r + 2 && u[i]) u[i] = WTP.shade(u[i], 0.6);
      }
      g.putImageData(img, 0, 0);
      w.hp -= r * r / (w.w * w.h) * 3;
    }
    WTP.title.shake = Math.min(4, (WTP.title.shake || 0) + r * 0.15);
  }
  T.start = () => {
    if (!cv) T.init();
    T.on = true;
    resize();
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  };
  T.stop = () => { T.on = false; cancelAnimationFrame(raf); };
  T.setMode = (m) => { if (m !== T.mode) { T.mode = m; if (m === 'title') { logoT = 0; } } };
  T.kick = () => { const w = WTP.pick(wins.filter((v) => v.layer === 1 && v.x > 0 && v.x < cw - 40)); if (w) boom(w.x + rand(8, w.w - 8), w.y + rand(10, w.h - 8), randInt(6, 12)); };
  function loop(t) {
    if (!T.on) return;
    raf = requestAnimationFrame(loop);
    if (document.hidden) return;
    const dt = Math.max(0, Math.min(0.05, (t - last) / 1000));
    last = t;
    T.t += dt; logoT += dt;
    update(dt);
    draw();
  }
  function update(dt) {
    const speed = T.mode === 'title' ? 10 : 5;
    for (const w of wins) {
      w.x -= speed * w.sx * dt;
      if (w.x + w.w < -10 || w.hp < -0.5) {
        const maxX = Math.max(...wins.filter((v) => v.layer === w.layer).map((v) => v.x + v.w));
        const nw = mkWindow(Math.max(cw + 4, maxX + randInt(-10, 20)), w.layer);
        Object.assign(w, nw);
      }
    }
    for (const f of far) { f.x -= speed * 0.08 * dt; if (f.x + f.w < 0) f.x += cw + 70; }
    hero.t += dt;
    hero.fireT -= dt;
    if (hero.fireT <= 0) {
      hero.fireT = rand(1.2, 2.6);
      const targets = wins.filter((v) => v.layer === 1 && v.x > hero.x + 20 && v.x < cw - 20);
      const w = WTP.pick(targets);
      if (w) {
        const hx = hero.x + 10, hy = ch - 14;
        const tx = w.x + rand(8, w.w - 8), ty = w.y + rand(10, w.h - 10);
        const d = Math.hypot(tx - hx, ty - hy) || 1;
        shots.push({ x: hx, y: hy, vx: ((tx - hx) / d) * 140, vy: ((ty - hy) / d) * 140, tx, ty, t: 0 });
        hero.recoil = 1;
      }
    }
    hero.recoil = Math.max(0, (hero.recoil || 0) - dt * 6);
    for (let k = shots.length - 1; k >= 0; k--) {
      const s = shots[k];
      s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt;
      if (Math.random() < 0.8) parts.push({ x: s.x, y: s.y, vx: rand(-5, 5), vy: rand(-5, 5), c: Math.random() < 0.5 ? PAL['5'] : PAL['4'], life: 0.5, g: -10 });
      if (Math.hypot(s.tx - s.x, s.ty - s.y) < 4 || s.t > 3) { boom(s.tx, s.ty, randInt(7, 13)); shots.splice(k, 1); }
    }
    for (let k = parts.length - 1; k >= 0; k--) {
      const p = parts[k];
      p.life -= dt;
      if (p.life <= 0 || p.y > ch + 5) { parts.splice(k, 1); continue; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    if (parts.length > 900) parts.splice(0, parts.length - 900);
    for (let k = booms.length - 1; k >= 0; k--) { booms[k].t += dt; if (booms[k].t > booms[k].dur) booms.splice(k, 1); }
    T.shake = Math.max(0, (T.shake || 0) - dt * 8);
  }
  function sky() {
    const bandsD = ['0', '0', '1', '1', 'p', 'p', 'r', 'R'];
    const bandsL = ['c', 'c', 'C', 'C', 'K', 'K', 'Y', 'y'];
    const bands = dark ? bandsD : bandsL;
    const img = ctx.createImageData(cw, ch);
    const u = new Uint32Array(img.data.buffer);
    const n = bands.length;
    for (let y = 0; y < ch; y++) {
      const f = (y / ch) * (n - 1);
      const i0 = Math.floor(f), fr = f - i0;
      const c0 = P32[bands[i0]], c1 = P32[bands[Math.min(n - 1, i0 + 1)]];
      for (let x = 0; x < cw; x++) u[y * cw + x] = DITH(x, y, fr) ? c1 : c0;
    }
    ctx.putImageData(img, 0, 0);
  }
  let skyCache = null, skyKey = '';
  function draw() {
    ctx.imageSmoothingEnabled = false;
    const key = `${cw}x${ch}${dark}`;
    if (skyKey !== key) { sky(); skyCache = ctx.getImageData(0, 0, cw, ch); skyKey = key; } else ctx.putImageData(skyCache, 0, 0);
    const sh = T.shake > 0.3 ? Math.round(rand(-T.shake, T.shake)) : 0;
    ctx.save();
    ctx.translate(sh, Math.round(rand(-T.shake, T.shake) * 0.5));
    if (dark) {
      for (const s of stars) { const tw = Math.sin(T.t * 2 + s.p) > 0.6; ctx.fillStyle = tw ? PAL['7'] : PAL['4']; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
      disc(Math.round(cw * (cw > 200 ? 0.9 : 0.86)), Math.round(ch * (cw > 200 ? 0.13 : 0.5)), 9, PAL['6'], PAL['7']);
    } else {
      disc(Math.round(cw * 0.78), Math.round(ch * 0.62), 16, PAL.a, PAL.y);
    }
    ctx.fillStyle = dark ? PAL['1'] : PAL.m;
    for (const f of far) { ctx.fillRect(Math.round(f.x), ch - f.h - 20, f.w, f.h + 20); }
    ctx.fillStyle = dark ? PAL['2'] : PAL.K;
    for (const f of far) for (let yy = ch - f.h - 16; yy < ch - 22; yy += 6) for (let xx = 3; xx < f.w - 3; xx += 5) if (((f.x * 3 + xx + yy) | 0) % 7 < 2) ctx.fillRect(Math.round(f.x) + xx, yy, 2, 2);
    for (const w of wins) {
      if (w.layer === 0) { ctx.globalAlpha = dark ? 0.55 : 0.75; ctx.drawImage(w.c, Math.round(w.x), w.y); ctx.globalAlpha = 1; }
      else ctx.drawImage(w.c, Math.round(w.x), w.y);
    }
    ctx.fillStyle = PAL['0']; ctx.fillRect(0, ch - 8, cw, 8);
    ctx.fillStyle = PAL['2']; ctx.fillRect(0, ch - 8, cw, 1);
    for (let x = ((-T.t * 30) % 8 + 8) % 8; x < cw; x += 8) { ctx.fillStyle = PAL['3']; ctx.fillRect(Math.round(x), ch - 5, 4, 1); }
    const E = SP.explosions().fire;
    for (const b of booms) {
      let best = E[0]; for (const s of E) if (Math.abs(s.size - b.size) < Math.abs(best.size - b.size)) best = s;
      const fr = best.frames[Math.min(best.frames.length - 1, Math.floor((b.t / b.dur) * best.frames.length))];
      ctx.drawImage(fr, Math.round(b.x - best.size / 2), Math.round(b.y - best.size / 2));
    }
    for (const s of shots) { const r = SP.PROJ.rocket.rotated(Math.atan2(s.vy, s.vx), s.vx < 0); ctx.drawImage(r.cv, Math.round(s.x - r.ox), Math.round(s.y - r.oy)); }
    for (const p of parts) { ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
    drawHero();
    ctx.restore();
    if (T.mode !== 'title') {
      ctx.fillStyle = PAL['0'];
      ctx.globalAlpha = T.mode === 'sub' ? (dark ? 0.7 : 0.5) : (dark ? 0.55 : 0.35);
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalAlpha = 1;
    }
    if (T.mode !== 'sub') drawLogo();
  }
  function disc(cx, cy, r, c1, c2) {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y);
      if (d > r) continue;
      ctx.fillStyle = d < r * 0.6 || DITH(cx + x, cy + y, 1 - (d - r * 0.6) / (r * 0.4)) ? c2 : c1;
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
  function drawHero() {
    const fr = SP.playerFrames(WTP.save.skin);
    const anim = fr.anims.idle;
    const f = anim[Math.floor(T.t / 0.38) % anim.length];
    const x = hero.x, y = ch - 8 - 22;
    ctx.drawImage(f.r, x, y);
    const sh = [x + f.shoulder[0] + 0.5, y + f.shoulder[1] + 0.5];
    const tgt = shots[0] ? Math.atan2(shots[0].vy, shots[0].vx) : -0.35;
    const a = tgt;
    const arm = fr.arm.rotated(a, false);
    ctx.drawImage(arm.cv, Math.round(sh[0] - arm.ox), Math.round(sh[1] - arm.oy));
    const wsp = SP.WEAPON.rocket.rotated(a, false);
    const hx = sh[0] + Math.cos(a) * (3 - (hero.recoil || 0) * 2), hy = sh[1] + Math.sin(a) * (3 - (hero.recoil || 0) * 2);
    ctx.drawImage(wsp.cv, Math.round(hx - wsp.ox), Math.round(hy - wsp.oy));
  }
  function drawLogo() {
    if (!logo) return;
    const s2 = T.mode === 'title' ? logo.scale : 1;
    const s = T.mode === 'title' ? logo.scale + 1 : 1;
    const lineW = (arr, k) => arr.reduce((a, c) => a + (c ? (c.w - 2) * k : 4 * k), 0);
    const w1 = lineW(logo.l1, s), w2 = lineW(logo.l2, s2);
    const titleTop = Math.round(ch * 0.14);
    const draw1 = (arr, y0, wTot, delay, xBase, s) => {
      let x = xBase ?? Math.round((cw - wTot) / 2);
      arr.forEach((c, k) => {
        if (!c) { x += 4 * s; return; }
        const t = logoT - delay - k * 0.06;
        let dy = 0;
        if (T.mode === 'title') {
          if (t < 0) { x += (c.w - 2) * s; return; }
          if (t < 0.35) dy = Math.round(-Math.pow(1 - t / 0.35, 2) * 40 * s / 3);
          else dy = Math.round(Math.sin(T.t * 3 + k * 0.6) * 1.2) * Math.max(1, s >> 1);
        }
        ctx.drawImage(c.cv, x, y0 + dy, c.w * s, c.h * s);
        x += (c.w - 2) * s;
      });
    };
    if (T.mode === 'title') {
      const bw = Math.min(cw - 4, Math.max(w1, w2) + 14 * s), { by, bh } = logoGeom(logo.scale);
      const pop = Math.min(1, logoT / 0.25);
      if (pop > 0) {
        const ww = Math.round(bw * pop), hh = Math.round(bh * pop);
        const x0 = Math.round(cw / 2 - ww / 2), y0 = Math.round(by + bh / 2 - hh / 2);
        ctx.fillStyle = PAL['0']; ctx.fillRect(x0 + 3, y0 + 4, ww, hh);
        ctx.fillRect(x0 - 1, y0 - 1, ww + 2, hh + 2);
        ctx.fillStyle = PAL['1']; ctx.fillRect(x0, y0, ww, hh);
        ctx.fillStyle = PAL['2']; ctx.fillRect(x0, y0, ww, 11);
        ctx.fillStyle = PAL['0']; ctx.fillRect(x0, y0 + 11, ww, 1);
        if (pop >= 1) {
          ctx.fillStyle = PAL.e; ctx.fillRect(x0 + 4, y0 + 4, 3, 3);
          ctx.fillStyle = PAL.y; ctx.fillRect(x0 + 9, y0 + 4, 3, 3);
          ctx.fillStyle = PAL.l; ctx.fillRect(x0 + 14, y0 + 4, 3, 3);
          ctx.fillStyle = PAL['1']; ctx.fillRect(x0 + 21, y0 + 2, ww - 26, 8);
          ctx.save(); ctx.beginPath(); ctx.rect(x0 + 22, y0 + 2, ww - 28, 8); ctx.clip();
          WTP.font.draw(ctx, ww > 150 ? 'www.wreck-this-page.example' : 'wreck-this-page', x0 + 24, y0 + 1, { color: '5' });
          ctx.restore();
          for (let y = y0 + 13; y < y0 + hh - 1; y += 2) for (let x = x0 + 1 + (y & 2 ? 1 : 0); x < x0 + ww - 1; x += 6) { ctx.fillStyle = PAL['0']; ctx.fillRect(x, y, 1, 1); }
        }
      }
      draw1(logo.l1, titleTop, w1, 0.1, null, s);
      draw1(logo.l2, titleTop + 12 * s, w2, 0.5, null, s2);
    } else {
      draw1(logo.l1, 6, w1, 0, 6, s);
      draw1(logo.l2, 6, w2, 0, 6 + w1 + 6 * s, s2);
    }
  }
  T.logoBottom = () => { if (!logo) return 200; const g = logoGeom(logo.scale); return (g.by + g.bh + 4) * P; };
})();
