(() => {
  const LW = 600, LH = 400, RES = 2;
  const PER_RAD = 26;
  const IDEAS = [
    'A staircase going all the way across the screen. Then another one going back.',
    'Your name in joined-up handwriting. Yes, every letter connects.',
    'A house with a chimney, a door and a path. The path is the hard part.',
    'A spiral square: go right, down, left, up, a little shorter each time.',
    'A city skyline with as many buildings as you can fit.',
    'A circle. Turn both knobs at once. Good luck.',
    'A cat. The ears are easy, the whiskers are where it gets philosophical.',
    'A maze. Then try to solve it with your eyes.',
    'A mountain range with a sun behind it.',
    'A robot made entirely of rectangles.',
    'A heart. Diagonals are made by turning both knobs together.',
    'A smiley face. Getting from the eyes to the mouth is half the fun.',
    'A pyramid with the sun setting behind it.',
    'A snail. The shell is a square spiral, obviously.',
    'Your initials in giant block capitals.',
    'A train with three carriages and a very square puff of smoke.',
    'A fish swimming through some zigzag seaweed.',
    'A Space Invaders style alien. Pixels are your friend here.',
    'A chess board. Just the grid. It is harder than it sounds.',
    'A rocket taking off, with a staircase-shaped flame.',
    'A bookshelf full of books of different heights.',
    'A tree made only of zigzags.',
    'A sailboat on a wavy sea.',
    'A spider web. Diagonals everywhere.',
    'A lighthouse with beams of light.',
    'A fence that goes all the way around the edge of the screen.',
    'Write HELLO without lifting the stylus, then explain the extra lines.',
    'A castle wall with battlements.',
    'An envelope with the flap closed.',
    'A snake winding from one corner to the other.'
  ];

  const $ = (id) => document.getElementById(id);
  const toy = $('toy'), screen = $('screen'), cv = $('cv'), g = cv.getContext('2d');
  const off = document.createElement('canvas');
  off.width = LW * RES; off.height = LH * RES;
  const o = off.getContext('2d');
  o.scale(RES, RES);
  o.lineCap = 'round'; o.lineJoin = 'round';

  const saved = Curio.store.get('es-state', null);
  let pen = saved && Number.isFinite(saved.x) ? { x: saved.x, y: saved.y } : { x: LW / 2, y: LH / 2 };
  let rotL = 0, rotR = 0;
  let dpr = 1, dirty = true, raf = 0;
  let shaking = false, shakeCount = 0;
  const keys = new Set();
  let keyRaf = 0, lastKey = 0;
  let clickAcc = 0;
  let drawn = false, travelled = 0, challenge = null;

  const LINE = '#4b4f54';
  function strokeTo(x, y) {
    const nx = Math.max(0, Math.min(LW, x)), ny = Math.max(0, Math.min(LH, y));
    if (nx === pen.x && ny === pen.y) return false;
    o.globalCompositeOperation = 'source-over';
    o.strokeStyle = LINE; o.lineWidth = 2.1; o.globalAlpha = .95;
    o.beginPath(); o.moveTo(pen.x, pen.y); o.lineTo(nx, ny); o.stroke();
    o.globalAlpha = 1;
    travelled += Math.hypot(nx - pen.x, ny - pen.y);
    pen = { x: nx, y: ny };
    drawn = true; shakeCount = 0;
    schedule(); persist();
    return true;
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(screen.clientWidth * dpr);
    cv.height = Math.round(screen.clientHeight * dpr);
    dirty = true; render();
  }

  let grain = null;
  function makeGrain() {
    const c = document.createElement('canvas');
    c.width = 160; c.height = 160;
    const x = c.getContext('2d');
    const img = x.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 190 + Math.random() * 30;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v - 4; img.data[i + 3] = 40;
    }
    x.putImageData(img, 0, 0);
    grain = g.createPattern(c, 'repeat');
  }

  function render() {
    raf = 0;
    if (!dirty) return;
    dirty = false;
    const W = cv.width, H = cv.height;
    g.setTransform(1, 0, 0, 1, 0, 0);
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#d8d9d4'); bg.addColorStop(.5, '#cbccc6'); bg.addColorStop(1, '#bfc0ba');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    if (!grain) makeGrain();
    g.fillStyle = grain; g.fillRect(0, 0, W, H);
    g.imageSmoothingEnabled = true;
    g.drawImage(off, 0, 0, W, H);
    const sx = W / LW, sy = H / LH;
    g.fillStyle = '#2f3236';
    g.beginPath(); g.arc(pen.x * sx, pen.y * sy, Math.max(1.6, 1.4 * sx), 0, Math.PI * 2); g.fill();
    if (challenge) drawTarget(g, sx, sy);
    const sheen = g.createLinearGradient(0, 0, W * .6, H);
    sheen.addColorStop(0, 'rgba(255,255,255,.22)'); sheen.addColorStop(.4, 'rgba(255,255,255,0)');
    g.fillStyle = sheen; g.fillRect(0, 0, W, H);
  }
  function schedule() { dirty = true; if (!raf) raf = requestAnimationFrame(render); }

  let persistT = 0;
  function persist() {
    clearTimeout(persistT);
    persistT = setTimeout(() => {
      try { Curio.store.set('es-state', { x: pen.x, y: pen.y, img: drawn ? off.toDataURL('image/png') : null }); } catch {}
    }, 600);
  }
  function restore() {
    if (!saved || !saved.img) return;
    const im = new Image();
    im.onload = () => { o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.drawImage(im, 0, 0); o.restore(); drawn = true; schedule(); };
    im.src = saved.img;
  }

  function setKnob(el, rot) { el.style.transform = `rotate(${rot}rad)`; }
  function click(delta) {
    clickAcc += Math.abs(delta);
    if (clickAcc > .22) {
      clickAcc = 0;
      if (Curio.muted) return;
      const ac = Curio.audioContext && Curio.audioContext();
      if (!ac) return;
      const t = ac.currentTime;
      const len = Math.floor(ac.sampleRate * .012);
      const buf = ac.createBuffer(1, len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400 + Math.random() * 900; f.Q.value = 3;
      const gn = ac.createGain(); gn.gain.value = .35;
      src.connect(f).connect(gn).connect(ac.destination);
      src.start(t);
    }
  }

  function turn(which, da) {
    if (shaking) return;
    if (which === 'l') { rotL += da; setKnob($('kl'), rotL); strokeTo(pen.x + da * PER_RAD, pen.y); }
    else { rotR += da; setKnob($('kr'), rotR); strokeTo(pen.x, pen.y - da * PER_RAD); }
    click(da);
  }

  function bindKnob(el, which) {
    let last = 0, on = false;
    const ang = (e) => { const b = el.getBoundingClientRect(); return Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)); };
    Curio.drag(el, {
      start: (q) => { if (q.event && q.event.cancelable) q.event.preventDefault(); on = true; last = ang(q); el.classList.add('is-grab'); stopGlide(); Curio.audioContext && Curio.audioContext(); },
      move: (q) => {
        if (!on) return;
        const e = q.event;
        const list = e && e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        for (const ev of (list.length ? list : [q])) {
          const b = el.getBoundingClientRect();
          const r = Math.hypot(ev.clientX - (b.left + b.width / 2), ev.clientY - (b.top + b.height / 2));
          const a = ang(ev);
          let d = a - last;
          if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
          last = a;
          if (r < 6) continue;
          turn(which, d);
        }
      },
      end: () => { on = false; el.classList.remove('is-grab'); }
    });
    el.addEventListener('click', (e) => e.preventDefault());
    el.addEventListener('wheel', (e) => { e.preventDefault(); turn(which, (e.deltaY > 0 ? 1 : -1) * .12 * (which === 'r' ? -1 : 1)); }, { passive: false });
  }
  bindKnob($('kl'), 'l');
  bindKnob($('kr'), 'r');

  const KEYMAP = { ArrowLeft: 'L', a: 'L', A: 'L', ArrowRight: 'R', d: 'R', D: 'R', ArrowUp: 'U', w: 'U', W: 'U', ArrowDown: 'D', s: 'D', S: 'D' };
  function keyLoop(now) {
    if (!keys.size) { keyRaf = 0; return; }
    const dt = Math.min(.05, (now - (lastKey || now)) / 1000); lastKey = now;
    const fast = keys.has('shift');
    const v = (fast ? 4.2 : 1.8) * dt * 2;
    let dl = 0, dr = 0;
    if (keys.has('L')) dl -= v;
    if (keys.has('R')) dl += v;
    if (keys.has('U')) dr += v;
    if (keys.has('D')) dr -= v;
    if (dl || dr) {
      if (!shaking) {
        rotL += dl; rotR += dr;
        setKnob($('kl'), rotL); setKnob($('kr'), rotR);
        strokeTo(pen.x + dl * PER_RAD, pen.y - dr * PER_RAD);
        click(Math.abs(dl) + Math.abs(dr));
      }
    }
    keyRaf = requestAnimationFrame(keyLoop);
  }
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select')) return;
    if (e.key === 'Shift') { keys.add('shift'); return; }
    if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); shake(); return; }
    if (document.querySelector('.curio-modal')) return;
    if (e.key === 'Enter' && challenge && !challenge.done && !e.target.closest('button')) { e.preventDefault(); scoreChallenge(); return; }
    if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey) { $('glide').click(); return; }
    const k = KEYMAP[e.key];
    if (!k) return;
    e.preventDefault();
    keys.add(k);
    if (!keyRaf) { lastKey = 0; keyRaf = requestAnimationFrame(keyLoop); }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') keys.delete('shift');
    const k = KEYMAP[e.key];
    if (k) keys.delete(k);
    if (KEYMAP[e.key.toLowerCase()]) keys.delete(KEYMAP[e.key.toLowerCase()]);
  });
  window.addEventListener('blur', () => keys.clear());

  function shake() {
    if (shaking) return;
    shaking = true;
    shakeCount++;
    stopGlide();
    stats.shakes++; saveStats(); if (stats.shakes >= 10) badge('shake10'); renderStats();
    toy.classList.remove('is-shaking'); void toy.offsetWidth; toy.classList.add('is-shaking');
    if (navigator.vibrate) try { navigator.vibrate([60, 40, 60, 40, 60]); } catch {}
    if (!Curio.muted) {
      const ac = Curio.audioContext && Curio.audioContext();
      if (ac) {
        const t = ac.currentTime, len = Math.floor(ac.sampleRate * .9);
        const buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) { const ph = (i / ac.sampleRate) * 11; d[i] = (Math.random() * 2 - 1) * (.25 + .75 * Math.abs(Math.sin(ph * Math.PI))) * (1 - i / len); }
        const src = ac.createBufferSource(); src.buffer = buf;
        const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500;
        const gn = ac.createGain(); gn.gain.value = .18;
        src.connect(f).connect(gn).connect(ac.destination); src.start(t);
      }
    }
    const final = shakeCount >= 3;
    const start = performance.now();
    const step = (now) => {
      const p = (now - start) / 900;
      o.save();
      o.setTransform(1, 0, 0, 1, 0, 0);
      o.globalCompositeOperation = 'destination-out';
      o.fillStyle = `rgba(0,0,0,${final ? .12 : .045})`;
      o.fillRect(0, 0, off.width, off.height);
      o.restore();
      schedule();
      if (p < 1) requestAnimationFrame(step);
      else {
        if (final) { o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, off.width, off.height); o.restore(); drawn = false; shakeCount = 0; Curio.toast('Squeaky clean!'); }
        shaking = false;
        toy.classList.remove('is-shaking');
        schedule(); persist();
      }
    };
    requestAnimationFrame(step);
  }
  $('shake').addEventListener('click', shake);

  function savePng() {
    const pad = 70, top = 90, bottom = 150, c = document.createElement('canvas');
    const sw = LW * 2, sh = LH * 2;
    c.width = sw + pad * 2; c.height = sh + top + bottom;
    const x = c.getContext('2d');
    const red = x.createLinearGradient(0, 0, 0, c.height);
    red.addColorStop(0, '#e3262b'); red.addColorStop(1, '#a81218');
    x.fillStyle = red;
    x.beginPath(); x.roundRect(0, 0, c.width, c.height, 60); x.fill();
    x.fillStyle = '#cfd0cb';
    x.beginPath(); x.roundRect(pad, top, sw, sh, 24); x.fill();
    x.drawImage(off, pad, top, sw, sh);
    x.fillStyle = '#f6c945'; x.font = 'italic 700 54px "Brush Script MT", "Segoe Script", cursive'; x.textAlign = 'center';
    x.fillText('Etch Sketch', c.width / 2, 66);
    for (const kx of [pad + 40, c.width - pad - 40]) {
      x.fillStyle = '#f2f0ea'; x.beginPath(); x.arc(kx, c.height - bottom / 2, 50, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#ffffff'; x.beginPath(); x.arc(kx, c.height - bottom / 2, 28, 0, Math.PI * 2); x.fill();
    }
    const a = document.createElement('a');
    a.download = 'etch-sketch.png';
    a.href = c.toDataURL('image/png');
    a.click();
    Curio.beep(700, .06, 'triangle', .08);
  }
  $('savePng').addEventListener('click', savePng);

  let lastShake = 0, jolts = 0, joltT = 0;
  function onMotion(e) {
    const a = e.accelerationIncludingGravity || e.acceleration;
    if (!a) return;
    const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0);
    const now = performance.now();
    if (m > 22) {
      if (now - joltT > 120) { jolts++; joltT = now; }
      if (jolts >= 3 && now - lastShake > 1200) { lastShake = now; jolts = 0; shake(); }
    }
    if (now - joltT > 800) jolts = 0;
  }
  const DM = window.DeviceMotionEvent;
  const motionBtn = $('motion');
  if (DM && typeof DM.requestPermission === 'function') {
    motionBtn.hidden = false;
    motionBtn.addEventListener('click', async () => {
      try {
        const r = await DM.requestPermission();
        if (r === 'granted') { window.addEventListener('devicemotion', onMotion); motionBtn.hidden = true; Curio.toast('Now shake your phone to erase!'); }
        else Curio.toast('Motion access was not allowed');
      } catch { Curio.toast('Motion is not available here'); }
    });
  } else if (DM && matchMedia('(pointer: coarse)').matches) {
    window.addEventListener('devicemotion', onMotion);
  }

  const ideaEl = $('idea');
  let ideaIdx = Curio.randInt(0, IDEAS.length - 1);
  ideaEl.textContent = IDEAS[ideaIdx];
  $('ideaBtn').addEventListener('click', () => { ideaIdx = (ideaIdx + 1) % IDEAS.length; ideaEl.textContent = IDEAS[ideaIdx]; });

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { if (document.hidden) keys.clear(); });
  const T = (pts) => pts.map(([x, y]) => ({ x, y }));
  const circleT = (cx, cy, r, n = 28, a0 = 0) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + i / n * Math.PI * 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
  const TARGETS = [
    { id: 'stairs', name: 'Staircase', lvl: 1, pts: T([[60, 340], [140, 340], [140, 280], [220, 280], [220, 220], [300, 220], [300, 160], [380, 160], [380, 100], [460, 100], [460, 50], [540, 50]]) },
    { id: 'square', name: 'Square', lvl: 1, pts: T([[180, 80], [420, 80], [420, 320], [180, 320], [180, 80]]) },
    { id: 'plus', name: 'Plus sign', lvl: 1, pts: T([[260, 60], [340, 60], [340, 160], [440, 160], [440, 240], [340, 240], [340, 340], [260, 340], [260, 240], [160, 240], [160, 160], [260, 160], [260, 60]]) },
    { id: 'spiral', name: 'Square spiral', lvl: 2, pts: T([[300, 200], [340, 200], [340, 240], [260, 240], [260, 160], [380, 160], [380, 280], [220, 280], [220, 120], [420, 120], [420, 320], [180, 320], [180, 80], [460, 80]]) },
    { id: 'house', name: 'House', lvl: 2, pts: T([[160, 340], [160, 180], [300, 70], [440, 180], [440, 340], [340, 340], [340, 250], [260, 250], [260, 340], [160, 340]]) },
    { id: 'castle', name: 'Castle wall', lvl: 2, pts: T([[60, 340], [60, 140], [110, 140], [110, 180], [160, 180], [160, 140], [210, 140], [210, 180], [260, 180], [260, 140], [340, 140], [340, 180], [390, 180], [390, 140], [440, 140], [440, 180], [490, 180], [490, 140], [540, 140], [540, 340], [60, 340]]) },
    { id: 'zig', name: 'Zigzag', lvl: 2, pts: T([[60, 300], [140, 100], [220, 300], [300, 100], [380, 300], [460, 100], [540, 300]]) },
    { id: 'tri', name: 'Triangle', lvl: 2, pts: T([[300, 60], [480, 340], [120, 340], [300, 60]]) },
    { id: 'diamond', name: 'Diamond', lvl: 2, pts: T([[300, 50], [450, 200], [300, 350], [150, 200], [300, 50]]) },
    { id: 'E', name: 'Letter E', lvl: 1, pts: T([[400, 70], [220, 70], [220, 200], [360, 200], [220, 200], [220, 330], [400, 330]]) },
    { id: 'S', name: 'Block S', lvl: 1, pts: T([[400, 70], [200, 70], [200, 200], [400, 200], [400, 330], [200, 330]]) },
    { id: 'Z', name: 'Letter Z', lvl: 2, pts: T([[180, 80], [420, 80], [180, 320], [420, 320]]) },
    { id: 'HI', name: 'Say HI', lvl: 2, pts: T([[120, 80], [120, 320], [120, 200], [280, 200], [280, 80], [280, 320], [400, 320], [460, 320], [460, 80], [400, 80], [520, 80], [460, 80], [460, 320], [520, 320]]) },
    { id: 'arrow', name: 'Arrow', lvl: 2, pts: T([[80, 170], [360, 170], [360, 90], [520, 200], [360, 310], [360, 230], [80, 230], [80, 170]]) },
    { id: 'skyline', name: 'City skyline', lvl: 2, pts: T([[40, 360], [40, 220], [100, 220], [100, 140], [160, 140], [160, 260], [210, 260], [210, 80], [270, 80], [270, 200], [330, 200], [330, 120], [380, 120], [380, 240], [440, 240], [440, 170], [500, 170], [500, 280], [560, 280], [560, 360]]) },
    { id: 'star', name: 'Star', lvl: 3, pts: T([[300, 40], [348, 150], [470, 160], [376, 240], [406, 360], [300, 296], [194, 360], [224, 240], [130, 160], [252, 150], [300, 40]]) },
    { id: 'circle', name: 'Circle', lvl: 3, pts: T(circleT(300, 200, 130)) },
    { id: 'heart', name: 'Heart', lvl: 3, pts: T([[300, 340], [170, 220], [140, 160], [150, 110], [190, 80], [240, 80], [280, 110], [300, 140], [320, 110], [360, 80], [410, 80], [450, 110], [460, 160], [430, 220], [300, 340]]) },
    { id: 'wave', name: 'Wave', lvl: 3, pts: T(Array.from({ length: 41 }, (_, i) => [60 + i * 12, 200 + 90 * Math.sin(i / 40 * Math.PI * 4)])) },
    { id: 'maze', name: 'Maze run', lvl: 3, pts: T([[40, 40], [560, 40], [560, 120], [100, 120], [100, 200], [560, 200], [560, 280], [100, 280], [100, 360], [560, 360]]) }
  ];
  let tSamples = [];
  function sampleTarget(pts) {
    const out = [];
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i], L = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(L / 3));
      for (let k = 0; k < n; k++) out.push({ x: a.x + (b.x - a.x) * k / n, y: a.y + (b.y - a.y) * k / n });
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function drawTarget(c, sx, sy) {
    const t = challenge.t;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = challenge.done ? 'rgba(40,140,80,.35)' : 'rgba(199,28,34,.28)'; c.lineWidth = 9 * sx;
    c.beginPath(); t.pts.forEach((p, i) => (i ? c.lineTo(p.x * sx, p.y * sy) : c.moveTo(p.x * sx, p.y * sy))); c.stroke();
    c.setLineDash([6 * sx, 6 * sx]); c.strokeStyle = 'rgba(120,20,20,.5)'; c.lineWidth = 1.2 * sx; c.stroke();
    c.setLineDash([]);
    const e = t.pts[t.pts.length - 1];
    c.fillStyle = 'rgba(199,28,34,.6)'; c.beginPath(); c.arc(e.x * sx, e.y * sy, 6 * sx, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  function startChallenge(id, daily) {
    const t = TARGETS.find((x) => x.id === id) || TARGETS[0];
    stopGlide();
    o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.clearRect(0, 0, off.width, off.height); o.restore();
    pen = { x: t.pts[0].x, y: t.pts[0].y }; drawn = false;
    tSamples = sampleTarget(t.pts);
    challenge = { t, daily: !!daily, start: performance.now(), done: false };
    toy.classList.remove('is-shaking'); void toy.offsetWidth; toy.classList.add('is-shaking');
    setTimeout(() => toy.classList.remove('is-shaking'), 900);
    $('chResult').textContent = `Trace the ${t.name.toLowerCase()} from the stylus. The red dot marks the finish. Press Score when you are done.`;
    $('chScore').disabled = false; $('chQuit').hidden = false;
    paintTargets(); schedule(); persist();
    Curio.beep(520, .08, 'triangle', .07);
    screen.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function scoreChallenge() {
    if (!challenge || challenge.done) return;
    const d = o.getImageData(0, 0, off.width, off.height).data, W = off.width;
    const inked = (x, y) => { const px = Math.round(x * RES), py = Math.round(y * RES); if (px < 0 || py < 0 || px >= W || py >= off.height) return false; return d[(py * W + px) * 4 + 3] > 60; };
    const near = (x, y, r) => { for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) if (inked(x + dx, y + dy)) return true; return false; };
    let cov = 0; tSamples.forEach((p) => { if (near(p.x, p.y, 6)) cov++; });
    const coverage = cov / tSamples.length;
    let ink = 0, good = 0;
    for (let y = 0; y < LH; y += 3) for (let x = 0; x < LW; x += 3) {
      if (!inked(x, y)) continue;
      ink++;
      let m = Infinity;
      for (const p of tSamples) { const dd = (p.x - x) ** 2 + (p.y - y) ** 2; if (dd < m) { m = dd; if (m < 64) break; } }
      if (m < 100) good++;
    }
    const precision = ink ? good / ink : 0;
    const sc = Math.round(100 * coverage * Math.pow(precision, .7));
    const secs = (performance.now() - challenge.start) / 1000;
    challenge.done = true;
    const key = challenge.t.id;
    const prev = stats.ch[key] || 0;
    if (sc > prev) stats.ch[key] = sc;
    if (challenge.daily) { const pd = stats.daily[today] || 0; if (sc > pd) stats.daily[today] = sc; badge('daily'); }
    saveStats();
    badge('challenge');
    if (sc >= 90) badge('ch90');
    if (TARGETS.every((t) => stats.ch[t.id] != null)) badge('allch');
    if (challenge.t.lvl === 3 && sc >= 75) badge('curvy');
    const word = sc >= 95 ? 'Flawless etching!' : sc >= 85 ? 'Steady knobs!' : sc >= 70 ? 'Very respectable.' : sc >= 50 ? 'Recognisable. Mostly.' : 'Abstract interpretation.';
    $('chResult').innerHTML = `<b class="es-score">${sc}</b> ${word} Coverage ${Math.round(coverage * 100)}% · precision ${Math.round(precision * 100)}% · ${secs.toFixed(0)} s${sc > prev && prev ? ' · new best!' : ''}`;
    if (challenge.daily) $('chResult').insertAdjacentHTML('beforeend', ' <button class="c-btn c-btn--ghost" id="chShare" type="button" style="padding:5px 12px;font-size:13px">📋 Share</button>');
    const sh = $('chShare');
    const name = challenge.t.name;
    if (sh) sh.addEventListener('click', async () => { try { await navigator.clipboard.writeText(`🖍️ Zoble Etch Sketch daily ${today}: ${name} ${sc}/100`); Curio.toast('Copied 📋'); } catch { Curio.toast('Copy failed'); } });
    [440, 554, 659, 880].slice(0, sc >= 85 ? 4 : sc >= 60 ? 3 : 1).forEach((f, i) => setTimeout(() => Curio.beep(f, .12, 'triangle', .08), i * 110));
    if (sc >= 85) Curio.confetti();
    $('chScore').disabled = true;
    paintTargets(); renderStats(); schedule();
  }
  function quitChallenge() { challenge = null; $('chQuit').hidden = true; $('chScore').disabled = true; $('chResult').textContent = 'Free drawing. Pick a challenge to trace a guide picture.'; paintTargets(); schedule(); }
  function paintTargets() {
    const el = $('targets'); el.innerHTML = '';
    TARGETS.forEach((t) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'es-tgt'; b.setAttribute('aria-pressed', String(!!challenge && challenge.t.id === t.id));
      const best = stats.ch[t.id];
      b.innerHTML = `<svg viewBox="0 0 600 400" aria-hidden="true"><polyline points="${t.pts.map((p) => `${p.x},${p.y}`).join(' ')}" fill="none" stroke="currentColor" stroke-width="22" stroke-linejoin="round" stroke-linecap="round"/></svg><span></span><em>${best != null ? best : '·'.repeat(t.lvl)}</em>`;
      b.querySelector('span').textContent = t.name;
      b.setAttribute('aria-label', `Challenge: ${t.name}${best != null ? `, best ${best}` : ''}`);
      b.addEventListener('click', () => startChallenge(t.id, false));
      el.append(b);
    });
  }

  let glide = null, glideOn = Curio.store.get('es-glide', false);
  function stopGlide() { if (glide) { cancelAnimationFrame(glide.raf); glide = null; } }
  function glideTo(tx, ty) {
    stopGlide();
    glide = { raf: 0, last: performance.now() };
    const step = (now) => {
      if (!glide) return;
      const dt = Math.min(.05, (now - glide.last) / 1000); glide.last = now;
      const dx = tx - pen.x, dy = ty - pen.y, dist = Math.hypot(dx, dy);
      if (dist < 1 || shaking) { glide = null; return; }
      const sp = Math.min(dist, 160 * dt);
      const mx = dx / dist * sp, my = dy / dist * sp;
      rotL += mx / PER_RAD; rotR -= my / PER_RAD; setKnob($('kl'), rotL); setKnob($('kr'), rotR);
      strokeTo(pen.x + mx, pen.y + my); click(sp / PER_RAD);
      glide.raf = requestAnimationFrame(step);
    };
    glide.raf = requestAnimationFrame(step);
  }
  cv.addEventListener('click', (e) => {
    if (!glideOn) return;
    const b = cv.getBoundingClientRect();
    glideTo((e.clientX - b.left) / b.width * LW, (e.clientY - b.top) / b.height * LH);
  });
  function paintGlide() { $('glide').setAttribute('aria-pressed', String(glideOn)); $('glide').textContent = glideOn ? '🎯 Click-to-glide: on' : '🎯 Click-to-glide: off'; screen.classList.toggle('is-glide', glideOn); }
  $('glide').addEventListener('click', () => { glideOn = !glideOn; Curio.store.set('es-glide', glideOn); paintGlide(); Curio.toast(glideOn ? 'Click anywhere on the screen and the stylus glides there in a straight line' : 'Glide off'); });
  cv.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (shaking) return;
    stopGlide();
    const k = e.deltaMode === 1 ? 16 : 1;
    const dx = Math.max(-40, Math.min(40, e.deltaX * k)) * .35, dy = Math.max(-40, Math.min(40, e.deltaY * k)) * .35;
    rotL += dx / PER_RAD; rotR -= dy / PER_RAD; setKnob($('kl'), rotL); setKnob($('kr'), rotR);
    strokeTo(pen.x + dx, pen.y + dy); click(Math.abs(dx + dy) / PER_RAD);
  }, { passive: false });

  const SKINS = { red: ['#e3262b', '#b9151b', '#9e1015', '#c71c22', 'Classic'], blue: ['#2f7de1', '#1a5bb5', '#124590', '#1d64c4', 'Ocean'], green: ['#2fb36b', '#1b8a4f', '#126b3c', '#1f9a58', 'Mint'], pink: ['#ff7eb6', '#e0478f', '#b72f6f', '#e85a9d', 'Bubblegum'], black: ['#3a3d44', '#24262b', '#15161a', '#2c2e34', 'Midnight'], gold: ['#f2c14e', '#d49b1c', '#a87410', '#c99018', 'Gold'], purple: ['#9b6bff', '#7442e0', '#5428b5', '#6a3bd0', 'Grape'] };
  let skin = Curio.store.get('es-skin', 'red');
  if (!SKINS[skin]) skin = 'red';
  function applySkin() {
    const k = SKINS[skin];
    toy.style.setProperty('--t1', k[0]); toy.style.setProperty('--t2', k[1]); toy.style.setProperty('--t3', k[2]); toy.style.setProperty('--t4', k[3]);
    $('skins').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === skin)));
  }

  let gallery = Curio.store.get('es-gallery', []) || [];
  if (!Array.isArray(gallery)) gallery = [];
  function snap() {
    if (!drawn) { Curio.toast('Draw something first'); return; }
    const c = document.createElement('canvas'); c.width = 300; c.height = 200;
    const x = c.getContext('2d'); x.fillStyle = '#cfd0cb'; x.fillRect(0, 0, 300, 200); x.drawImage(off, 0, 0, 300, 200);
    let url = '';
    try { url = c.toDataURL('image/jpeg', .7); } catch { return; }
    gallery.unshift({ id: Date.now(), img: url, skin });
    gallery = gallery.slice(0, 12);
    Curio.store.set('es-gallery', gallery);
    renderGallery(); badge('gallery');
    Curio.toast('Saved to your shelf 📸'); Curio.beep(1200, .05, 'square', .05); setTimeout(() => Curio.beep(700, .1, 'sine', .06), 60);
  }
  function renderGallery() {
    const el = $('gal'); el.innerHTML = '';
    if (!gallery.length) { el.innerHTML = '<p class="c-muted" style="margin:0">Your saved sketches sit on this shelf. Press 📸 Save to keep one.</p>'; return; }
    gallery.forEach((it) => {
      const k = SKINS[it.skin] || SKINS.red;
      const d = document.createElement('div'); d.className = 'es-mini'; d.style.background = `linear-gradient(180deg, ${k[0]}, ${k[2]})`;
      const im = document.createElement('img'); im.src = it.img; im.alt = 'Saved sketch';
      const x = document.createElement('button'); x.type = 'button'; x.className = 'es-del'; x.textContent = '✕'; x.setAttribute('aria-label', 'Delete sketch');
      x.addEventListener('click', () => { gallery = gallery.filter((g2) => g2.id !== it.id); Curio.store.set('es-gallery', gallery); renderGallery(); });
      d.append(im, x); el.append(d);
    });
  }
  $('snap').addEventListener('click', snap);

  const today = new Date().toISOString().slice(0, 10);
  const stats = Object.assign({ v: 1, dist: 0, shakes: 0, ch: {}, daily: {}, skins: ['red'] }, Curio.store.get('es-stats', {}) || {});
  ['ch', 'daily'].forEach((k) => { if (!stats[k] || typeof stats[k] !== 'object') stats[k] = {}; });
  if (!Array.isArray(stats.skins)) stats.skins = ['red'];
  let badges = Curio.store.get('es-badges', []) || [];
  function saveStats() { Curio.store.set('es-stats', stats); }
  Object.entries(SKINS).forEach(([k, v]) => {
    const b = document.createElement('button'); b.type = 'button'; b.dataset.s = k; b.className = 'es-skin'; b.style.background = `linear-gradient(180deg, ${v[0]}, ${v[2]})`; b.setAttribute('aria-label', `${v[4]} toy colour`); b.title = v[4];
    b.addEventListener('click', () => { skin = k; Curio.store.set('es-skin', k); applySkin(); Curio.beep(600, .05, 'sine', .05); if (!stats.skins.includes(k)) { stats.skins.push(k); saveStats(); if (stats.skins.length >= 4) badge('skins'); } });
    $('skins').append(b);
  });
  const BADGES = [
    { id: 'meter', icon: '📏', name: 'First metre', d: 'Draw 1,000 px of line' },
    { id: 'marathon', icon: '🏃', name: 'Knob marathon', d: 'Draw 50,000 px of line' },
    { id: 'shake10', icon: '🫨', name: 'Shaken, not stirred', d: 'Shake 10 times' },
    { id: 'challenge', icon: '🖍️', name: 'Challenger', d: 'Score a challenge' },
    { id: 'ch90', icon: '🎯', name: 'Surgical knobs', d: 'Score 90+ on a challenge' },
    { id: 'curvy', icon: '〰️', name: 'Curve wrangler', d: 'Score 75+ on a tricky curve' },
    { id: 'allch', icon: '🏆', name: 'Grand tour', d: 'Score every challenge' },
    { id: 'daily', icon: '📅', name: 'Daily etcher', d: 'Play the daily challenge' },
    { id: 'skins', icon: '🎨', name: 'Collector', d: 'Try 4 toy colours' },
    { id: 'gallery', icon: '📸', name: 'Shelf life', d: 'Save a sketch' }
  ];
  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('es-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => { Curio.toast(`${b.icon} Badge: ${b.name}`, 2400); [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .06), i * 80)); }, 500);
    renderBadges();
  }
  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'es-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    renderStats();
  }
  function renderStats() {
    const done = TARGETS.filter((t) => stats.ch[t.id] != null).length;
    $('stats2').innerHTML = [[Curio.fmt(Math.round(stats.dist)), 'Pixels etched'], [stats.shakes, 'Shakes'], [`${done}/${TARGETS.length}`, 'Challenges'], [stats.daily[today] != null ? stats.daily[today] : '-', "Today's daily"], [`${badges.length}/${BADGES.length}`, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }
  setInterval(() => {
    if (!travelled) return;
    stats.dist += travelled; travelled = 0; saveStats();
    if (stats.dist >= 1000) badge('meter');
    if (stats.dist >= 50000) badge('marathon');
    renderStats();
  }, 2000);
  function dailyId() { let h = 7; for (const ch of today) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return TARGETS[h % TARGETS.length].id; }
  $('chDaily').addEventListener('click', () => startChallenge(dailyId(), true));
  $('chScore').addEventListener('click', scoreChallenge);
  $('chQuit').addEventListener('click', quitChallenge);
  if (matchMedia('(pointer: fine)').matches && !Curio.touchpad && !Curio.store.get('es-tp-tip', false)) { Curio.store.set('es-tp-tip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 4000), 1200); }

  applySkin(); paintGlide(); paintTargets(); renderGallery(); renderBadges();
  restore();
  resize();
  window.__etch = { get pen() { return { ...pen }; }, turn, get shaking() { return shaking; }, shake, ink() { const d = o.getImageData(0, 0, off.width, off.height).data; let s = 0; for (let i = 3; i < d.length; i += 4) s += d[i]; return s / 255; } };
})();
