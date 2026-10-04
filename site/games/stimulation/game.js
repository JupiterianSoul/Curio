(() => {
  const D = window.STIM_DATA;
  const $ = (s) => document.querySelector(s);
  const fx = $('#fx'), front = $('#fxFront');
  const W = () => innerWidth, H = () => innerHeight - 52;
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const UP = D.upgrades;
  const phone = () => innerWidth < 760;

  const blank = () => ({ v: 3, stim: 0, earned: 0, owned: {}, order: [], power: 0, autos: 0, clicks: 0, started: Date.now(), golden: 0, corners: 0, adsClosed: 0, pets: 0, maxCombo: 1, lastSeen: Date.now(), playMs: 0 });
  function loadState() {
    const raw = Curio.store.get('stim:state', null);
    const s = Object.assign(blank(), raw && typeof raw === 'object' ? raw : {});
    if (!s.owned || typeof s.owned !== 'object') s.owned = {};
    if (!Array.isArray(s.order)) s.order = UP.filter((u) => s.owned[u.id]).map((u) => u.id);
    s.order = s.order.filter((id) => s.owned[id] && UP.some((u) => u.id === id));
    ['stim', 'earned', 'power', 'autos', 'clicks', 'golden', 'corners', 'adsClosed', 'pets', 'playMs'].forEach((k) => { s[k] = Number(s[k]) || 0; });
    s.v = 3;
    return s;
  }
  const blankMeta = () => ({ v: 1, trips: Number(Curio.store.get('stim:grass', 0)) || 0, overloads: 0, ach: {}, calm: false, intro: false, bestOutside: null, bestOver: null, lifetimeClicks: 0 });
  let S = loadState();
  let M = Object.assign(blankMeta(), Curio.store.get('stim:meta', {}) || {});
  if (!M.ach || typeof M.ach !== 'object') M.ach = {};
  const save = () => { S.lastSeen = Date.now(); Curio.store.set('stim:state', S); Curio.store.set('stim:meta', M); };

  const fmt = (n) => {
    if (n < 100 && n % 1) return Curio.fmt(Math.floor(n * 10) / 10, 1);
    n = Math.floor(n);
    if (n < 1e6) return Curio.fmt(n);
    const units = [[1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M']];
    for (const [v, u] of units) if (n >= v) return Curio.fmt(n / v, n / v < 100 ? 2 : 1) + u;
    return Curio.fmt(n);
  };
  const fmtTime = (ms) => { const s = Math.round(ms / 1000); return s >= 3600 ? `${Math.floor(s / 3600)}h ${Math.floor(s / 60) % 60}m` : `${Math.floor(s / 60)}m ${s % 60}s`; };

  let combo = 1, comboHeat = 0, frenzyUntil = 0;
  const freshAir = () => 1 + M.trips * .1;
  const brainBonus = () => 1 + M.overloads * .25;
  const baseClick = () => Math.pow(2, S.power) * brainBonus();
  const clickValue = () => baseClick() * (S.owned.combo ? combo : 1) * (performance.now() < frenzyUntil ? 7 : 1);
  const powerCost = () => Math.round(20 * Math.pow(4, S.power));
  const autoCost = () => Math.round(50 * Math.pow(1.17, S.autos));
  const upgradePps = () => UP.reduce((a, u) => a + (S.owned[u.id] ? u.pps : 0), 0) * freshAir();
  const pps = () => (upgradePps() + S.autos * baseClick() * .5) * (performance.now() < frenzyUntil ? 7 : 1);
  const ownedCount = () => S.order.length;

  let ac = null;
  const audio = () => { if (Curio.muted) return null; ac = Curio.audioContext ? Curio.audioContext() : null; return ac; };
  function tone(f, d, type = 'sine', v = .1, at = 0, slide = 0) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .05);
  }
  function noise(d, v = .1, freq = 1000, type = 'bandpass', at = 0) {
    const a = audio(); if (!a) return null;
    const len = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, len, a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf; f.type = type; f.frequency.value = freq;
    const t = a.currentTime + at;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(.5, d / 3)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    src.connect(f).connect(g).connect(a.destination); src.start(t); src.stop(t + d + .05);
    return src;
  }
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  const tickers = new Map();
  const mounted = {};
  const FX = {
    dvd() {
      const d = el('div', 'fx-dvd', '<svg viewBox="0 0 80 36"><ellipse cx="40" cy="27" rx="34" ry="7" fill="currentColor" opacity=".9"/><text x="40" y="22" text-anchor="middle" font-size="20" font-weight="900" font-style="italic" fill="currentColor">DVD</text><ellipse cx="40" cy="27" rx="10" ry="2.5" fill="#000" opacity=".35"/></svg>'); fx.append(d);
      let x = 40, y = 40, vx = 90, vy = 70;
      const cols = ['#ff004c', '#00b3ff', '#2bd96b', '#ffb000', '#9b5cff', '#ff00aa'];
      let ci = 0; d.style.color = cols[0];
      return (dt) => {
        x += vx * dt; y += vy * dt;
        const mw = W() - 80, mh = H() - 36;
        let hit = 0;
        if (x < 0 || x > mw) { vx = -vx; x = Math.max(0, Math.min(mw, x)); hit++; }
        if (y < 0 || y > mh) { vy = -vy; y = Math.max(0, Math.min(mh, y)); hit++; }
        if (hit) { ci = (ci + 1) % cols.length; d.style.color = cols[ci]; }
        if (hit === 2 || (hit && (x < 3 || x > mw - 3) && (y < 3 || y > mh - 3))) { S.corners++; unlock('corner'); Curio.toast('📀 IT HIT THE CORNER!'); gain(Math.max(500, pps() * 30)); Curio.confetti(80); }
        d.style.transform = `translate(${x}px, ${y}px)`;
      };
    },
    lava() { fx.append(el('div', 'fx-lava', '<i></i><i></i><i></i><b></b>')); },
    rainbow() { document.body.classList.add('fx-rainbow'); },
    spin() {
      const spots = [[6, 22], [88, 30], [12, 62], [85, 70], [50, 92], [92, 50]];
      ['🌀', '🍩', '💿', '🎡', '🌟', '🍭'].forEach((e, i) => { const s = el('div', 'fx-spin', e); s.style.left = spots[i][0] + '%'; s.style.top = spots[i][1] + '%'; s.style.animationDuration = (1.2 + i * .4) + 's'; fx.append(s); });
    },
    notif() {
      let t = 2, slot = 0;
      return (dt) => {
        t -= dt; if (t > 0) return; t = Curio.rand(2.5, 5);
        const [a, b] = Curio.pick(D.notifs);
        const n = el('div', 'fx-notif'); n.innerHTML = `<b>🔔 ${a} · now</b>`; n.append(document.createTextNode(b)); n.style.top = (10 + (slot++ % 3) * 70) + 'px';
        front.append(n); setTimeout(() => n.remove(), 4100); tone(1200, .06, 'sine', .04); tone(1600, .08, 'sine', .03, .07);
      };
    },
    stock() {
      const c = canvas('right:12px;bottom:44px', 180, 90, .8);
      const g = c.getContext('2d'); const pts = Array.from({ length: 40 }, () => 45); let t = 0;
      return (dt) => {
        t += dt; if (t < .25) return; t = 0;
        pts.shift(); pts.push(Math.max(8, Math.min(82, pts[pts.length - 1] + Curio.rand(-10, 10.5))));
        g.fillStyle = '#0d1117'; g.fillRect(0, 0, 180, 90);
        const up = pts[39] <= pts[38];
        const grad = g.createLinearGradient(0, 0, 0, 90); grad.addColorStop(0, up ? 'rgba(46,204,113,.45)' : 'rgba(231,76,60,.45)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(i * 4.6, p) : g.moveTo(0, p))); g.lineTo(180, 90); g.lineTo(0, 90); g.fillStyle = grad; g.fill();
        g.strokeStyle = up ? '#2ecc71' : '#e74c3c'; g.lineWidth = 2; g.beginPath();
        pts.forEach((p, i) => (i ? g.lineTo(i * 4.6, p) : g.moveTo(0, p))); g.stroke();
        g.fillStyle = g.strokeStyle; g.font = 'bold 12px sans-serif'; g.fillText((up ? '▲ STIM ' : '▼ STIM ') + (90 - pts[39]).toFixed(1), 6, 14);
      };
    },
    runner() {
      const c = canvas(phone() ? 'left:8px;bottom:40px' : 'left:14px;top:36%', 150, 190, phone() ? .7 : 1);
      const g = c.getContext('2d'); let lane = 1, lx = 1, trains = [], t = 0, dist = 0, coins = [];
      const laneX = (l, y) => 75 + (l - 1) * (20 + y * .2);
      return (dt) => {
        t += dt; dist += dt * 120;
        if (Math.random() < dt * 1.2) trains.push({ l: Curio.randInt(0, 2), y: -30 });
        if (Math.random() < dt * 2) coins.push({ l: Curio.randInt(0, 2), y: -10 });
        trains.forEach((tr) => { tr.y += dt * 110; }); coins.forEach((co) => { co.y += dt * 110; });
        trains = trains.filter((tr) => tr.y < 220); coins = coins.filter((co) => co.y < 220 && !(co.l === lane && co.y > 140 && co.y < 170));
        const danger = trains.find((tr) => tr.l === lane && tr.y > 60 && tr.y < 170);
        if (danger) { const free = [0, 1, 2].filter((l) => !trains.some((tr) => tr.l === l && tr.y > 40 && tr.y < 180)); if (free.length) lane = free[0]; }
        lx += (lane - lx) * Math.min(1, dt * 10);
        const sky = g.createLinearGradient(0, 0, 0, 190); sky.addColorStop(0, '#8fd3ff'); sky.addColorStop(1, '#6b8e5a');
        g.fillStyle = sky; g.fillRect(0, 0, 150, 190);
        g.fillStyle = '#8a7b6a'; g.beginPath(); g.moveTo(55, 0); g.lineTo(95, 0); g.lineTo(150, 190); g.lineTo(0, 190); g.fill();
        g.strokeStyle = '#5a4a3a'; g.lineWidth = 1;
        for (let k = 0; k < 10; k++) { const y = ((k * 22 + dist) % 220) - 20; g.beginPath(); g.moveTo(laneX(-.5, y), y); g.lineTo(laneX(2.5, y), y); g.stroke(); }
        coins.forEach((co) => { g.fillStyle = '#ffd400'; g.beginPath(); g.arc(laneX(co.l, co.y), co.y, 3 + co.y * .02, 0, 7); g.fill(); });
        trains.forEach((tr) => { const s = .5 + tr.y / 190; g.fillStyle = '#c0392b'; g.fillRect(laneX(tr.l, tr.y) - 12 * s, tr.y - 30 * s, 24 * s, 34 * s); g.fillStyle = '#bde3ff'; g.fillRect(laneX(tr.l, tr.y) - 8 * s, tr.y - 26 * s, 16 * s, 8 * s); });
        const px = laneX(lx, 160), bob = Math.abs(Math.sin(t * 12)) * 4;
        g.fillStyle = '#ff5a36'; g.fillRect(px - 5, 148 - bob, 10, 14); g.fillStyle = '#ffd7b0'; g.beginPath(); g.arc(px, 143 - bob, 5, 0, 7); g.fill();
        g.strokeStyle = '#333'; g.lineWidth = 3; const leg = Math.sin(t * 14) * 5; g.beginPath(); g.moveTo(px - 2, 162 - bob); g.lineTo(px - 2 + leg, 172); g.moveTo(px + 2, 162 - bob); g.lineTo(px + 2 - leg, 172); g.stroke();
        g.fillStyle = '#fff'; g.font = 'bold 11px sans-serif'; g.textAlign = 'left'; g.fillText(Math.floor(dist / 10) + 'm', 6, 14);
      };
    },
    confetti() {
      const cols = ['#ff5a36', '#ffc233', '#2ecc71', '#3498db', '#9b59b6', '#ff6fb5'];
      const n = phone() ? 18 : 34;
      for (let i = 0; i < n; i++) { const p = el('div', 'fx-confetti'); p.style.left = Curio.rand(0, 100) + '%'; p.style.background = Curio.pick(cols); p.style.animationDuration = Curio.rand(4, 9) + 's'; p.style.animationDelay = -Curio.rand(0, 9) + 's'; fx.append(p); }
    },
    cube() { fx.append(el('div', 'fx-cube-wrap', '<div class="fx-cube"><i>⚡</i><i>✨</i><i>🔥</i><i>💥</i><i>🎯</i><i>💎</i></div>')); },
    news() {
      const h = D.headlines.join('  •  ');
      front.append(el('div', 'fx-news', `<b>BREAKING</b><span>${h}  •  ${h}</span>`));
    },
    fidget() { fx.append(el('div', 'fx-fidget', '<svg viewBox="0 0 100 100" width="100%" height="100%"><g fill="#3498db"><circle cx="50" cy="18" r="16"/><circle cx="22" cy="66" r="16"/><circle cx="78" cy="66" r="16"/><circle cx="50" cy="50" r="20"/></g><g fill="#fff"><circle cx="50" cy="18" r="7"/><circle cx="22" cy="66" r="7"/><circle cx="78" cy="66" r="7"/><circle cx="50" cy="50" r="9" fill="#ffc233"/></g></svg>')); },
    chat() {
      const box = el('div', 'fx-chat', '<div class="fx-chat__h">🔴 LIVE · <span>1.2K</span> watching</div><div class="fx-chat__b"></div>'); fx.append(box);
      const body = box.lastChild, cnt = box.querySelector('span'); let t = 0, viewers = 1200;
      const cols = ['#ff5a36', '#00b3ff', '#2bd96b', '#ffb000', '#d63bff', '#ff6fb5'];
      return (dt) => {
        t -= dt; if (t > 0) return; t = Curio.rand(.3, 1.1);
        const line = el('p'); const n = el('b'); n.textContent = Curio.pick(D.chatNames) + ': '; n.style.color = Curio.pick(cols);
        line.append(n, document.createTextNode(Curio.pick(D.chatMsgs))); body.append(line);
        while (body.children.length > 12) body.firstChild.remove();
        viewers += Curio.randInt(-20, 40); cnt.textContent = fmt(Math.max(100, viewers));
      };
    },
    money() {
      const n = phone() ? 8 : 14;
      for (let i = 0; i < n; i++) { const p = el('div', 'fx-money', Curio.pick(['💸', '💵', '💰', '🪙'])); p.style.left = Curio.rand(0, 96) + '%'; p.style.animationDuration = Curio.rand(5, 11) + 's'; p.style.animationDelay = -Curio.rand(0, 11) + 's'; fx.append(p); }
    },
    ads() {
      let t = 6;
      return (dt) => {
        t -= dt; if (t > 0) return; t = Curio.rand(9, 16);
        if (front.querySelectorAll('.fx-ad').length >= (phone() ? 1 : 3)) return;
        const [em, a, b] = Curio.pick(D.ads);
        const ad = el('div', 'fx-ad');
        ad.innerHTML = `<div class="fx-ad__bar"><span>ad.exe</span><button type="button" aria-label="Close ad">✕</button></div><div class="fx-ad__body"><i>${em}</i><b></b><small></small><span class="fx-ad__cta">CLAIM NOW</span></div>`;
        ad.querySelector('b').textContent = a; ad.querySelector('small').textContent = b;
        ad.style.left = Curio.rand(4, Math.max(5, 100 - (260 / W()) * 100)) + '%'; ad.style.top = Curio.rand(10, 55) + '%';
        ad.querySelector('button').addEventListener('click', (e) => {
          e.stopPropagation(); S.adsClosed++; if (S.adsClosed >= 10) unlock('ads');
          const v = Math.max(50, pps() * 4); gain(v); floatText(e.clientX, e.clientY, '+' + fmt(v)); tone(900, .06, 'square', .05);
          ad.classList.add('bye'); setTimeout(() => ad.remove(), 250);
        });
        front.append(ad); tone(440, .08, 'square', .04); tone(660, .08, 'square', .04, .08);
        setTimeout(() => ad.remove(), 14000);
      };
    },
    disco() { front.append(el('div', 'fx-disco')); fx.append(el('div', 'fx-ball', '<i></i>')); },
    slime() {
      const c = canvas(phone() ? 'right:8px;bottom:150px' : 'right:210px;bottom:44px', 120, 110, phone() ? .7 : 1);
      const g = c.getContext('2d'); let t = 0;
      return (dt) => {
        t += dt; g.fillStyle = '#ffeef8'; g.fillRect(0, 0, 120, 110);
        const press = Math.max(0, Math.sin(t * 2.2)) * 18;
        const grad = g.createRadialGradient(50, 50, 4, 60, 64, 50); grad.addColorStop(0, '#c3ffb8'); grad.addColorStop(1, '#3fc35a');
        g.fillStyle = grad; g.beginPath();
        for (let a = 0; a <= Math.PI * 2 + .01; a += .2) {
          const r = 34 + Math.sin(a * 3 + t * 3) * 4 + (Math.sin(a) > 0 ? press * Math.sin(a) * .6 : 0);
          const x = 60 + Math.cos(a) * (r + press * .4), y = 64 + Math.sin(a) * (r - press * .5) * .8;
          a ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.fill(); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(48, 52, 10, 5, -.4, 0, 7); g.fill();
        g.fillStyle = '#ffd7b0'; g.beginPath(); g.ellipse(60, 22 + press * .9, 8, 12, 0, 0, 7); g.fill();
      };
    },
    eq() {
      const c = el('canvas', 'fx-eq'); c.setAttribute('aria-hidden', 'true'); fx.append(c);
      const g = c.getContext('2d'); let t = 0; const N = 48; const lv = new Array(N).fill(0);
      return (dt) => {
        t += dt;
        const w = W(), h = 70; if (c.width !== w) { c.width = w; c.height = h; }
        g.clearRect(0, 0, w, h);
        const bw = w / N;
        for (let i = 0; i < N; i++) {
          const target = (Math.sin(t * 3 + i * .5) * .3 + Math.sin(t * 7.3 + i * 1.7) * .25 + .55) * (i % 8 === Math.floor(t * 4) % 8 ? 1.3 : 1);
          lv[i] += (target - lv[i]) * Math.min(1, dt * 12);
          const bh = Math.max(3, lv[i] * h * .9);
          g.fillStyle = `hsl(${(i / N) * 300 + t * 40} 90% 60%)`;
          g.fillRect(i * bw + 1, h - bh, bw - 2, bh);
        }
      };
    },
    quake() { let t = 6; return (dt) => { t -= dt; if (t < 0) { t = Curio.rand(5, 10); shake(); } }; },
    ach() {
      let t = 3;
      return (dt) => {
        t -= dt; if (t > 0) return; t = Curio.rand(7, 12);
        const a = el('div', 'fx-ach', `<i>🏆</i><span><b>Achievement unlocked</b><br></span>`);
        a.querySelector('span').append(document.createTextNode(Curio.pick(D.fakeAch)));
        front.append(a); setTimeout(() => a.remove(), 3300); tone(880, .08, 'triangle', .05); tone(1320, .1, 'triangle', .05, .09);
      };
    },
    pong() {
      const c = canvas(phone() ? 'left:8px;top:120px' : 'left:14px;top:12%', 160, 100, phone() ? .65 : 1);
      const g = c.getContext('2d'); let bx = 80, by = 50, vx = 110, vy = 70, p1 = 50, p2 = 50, s1 = 0, s2 = 0;
      return (dt) => {
        bx += vx * dt; by += vy * dt;
        if (by < 4 || by > 96) { vy = -vy; by = Math.max(4, Math.min(96, by)); }
        p1 += Math.max(-90 * dt, Math.min(90 * dt, by - p1 + Math.sin(bx) * 6));
        p2 += Math.max(-90 * dt, Math.min(90 * dt, by - p2));
        if (bx < 12 && Math.abs(by - p1) < 14) { vx = Math.abs(vx) * 1.02; tone(500, .03, 'square', .02); }
        if (bx > 148 && Math.abs(by - p2) < 14) { vx = -Math.abs(vx) * 1.02; tone(600, .03, 'square', .02); }
        if (bx < 0 || bx > 160) { if (bx < 0) s2++; else s1++; bx = 80; by = 50; vx = (Math.random() < .5 ? -1 : 1) * 110; vy = Curio.rand(-80, 80); }
        g.fillStyle = '#111'; g.fillRect(0, 0, 160, 100);
        g.fillStyle = '#444'; for (let y = 2; y < 100; y += 10) g.fillRect(79, y, 2, 5);
        g.fillStyle = '#fff'; g.fillRect(6, p1 - 11, 4, 22); g.fillRect(150, p2 - 11, 4, 22); g.fillRect(bx - 3, by - 3, 6, 6);
        g.font = 'bold 14px monospace'; g.textAlign = 'center'; g.fillText(s1, 60, 16); g.fillText(s2, 100, 16);
      };
    },
    hype() {
      const h = el('div', 'fx-hype', '<span class="fx-hype__guy"><svg viewBox="0 0 60 70"><circle cx="30" cy="22" r="16" fill="#ffcc99"/><path d="M14 18 Q30 -2 46 18 Z" fill="#222"/><rect x="18" y="8" width="24" height="6" fill="#ff3d3d"/><ellipse cx="30" cy="30" rx="6" ry="5" fill="#7a1f1f"/><circle cx="24" cy="20" r="2" fill="#222"/><circle cx="36" cy="20" r="2" fill="#222"/><path d="M10 70 Q30 40 50 70Z" fill="#ff3d3d"/></svg></span><span class="fx-hype__say">LET\'S GO!</span>'); fx.append(h);
      let t = 0;
      return (dt) => { t -= dt; if (t < 0) { t = 1.6; const s = h.lastChild; s.textContent = Curio.pick(D.hype); s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); } };
    },
    aquarium() {
      const c = canvas(phone() ? 'right:8px;top:200px' : 'right:14px;top:40%', 170, 110, phone() ? .65 : 1);
      const g = c.getContext('2d'); let t = 0;
      const fish = Array.from({ length: 5 }, (_, i) => ({ x: Curio.rand(10, 160), y: Curio.rand(20, 85), v: Curio.rand(15, 35) * (Math.random() < .5 ? -1 : 1), c: ['#ff7a18', '#ffd400', '#ff4d8d', '#4dd0ff', '#b388ff'][i], s: Curio.rand(.7, 1.2) }));
      let bubbles = [];
      return (dt) => {
        t += dt;
        const wg = g.createLinearGradient(0, 0, 0, 110); wg.addColorStop(0, '#5fd1ff'); wg.addColorStop(1, '#0b5f8a');
        g.fillStyle = wg; g.fillRect(0, 0, 170, 110);
        g.fillStyle = '#e8d6a8'; g.beginPath(); g.moveTo(0, 110); g.quadraticCurveTo(85, 92, 170, 104); g.lineTo(170, 110); g.fill();
        g.strokeStyle = '#2e9e4f'; g.lineWidth = 3;
        for (const sx of [20, 30, 140]) { g.beginPath(); g.moveTo(sx, 108); g.quadraticCurveTo(sx + Math.sin(t * 2 + sx) * 6, 85, sx + Math.sin(t * 2 + sx) * 8, 64); g.stroke(); }
        if (Math.random() < dt * 3) bubbles.push({ x: Curio.rand(10, 160), y: 108, r: Curio.rand(1.5, 3.5) });
        bubbles.forEach((b) => { b.y -= dt * 30; b.x += Math.sin(t * 4 + b.y * .1) * .3; });
        bubbles = bubbles.filter((b) => b.y > 0);
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1;
        bubbles.forEach((b) => { g.beginPath(); g.arc(b.x, b.y, b.r, 0, 7); g.stroke(); });
        fish.forEach((f) => {
          f.x += f.v * dt; f.y += Math.sin(t * 2 + f.x * .05) * .2;
          if (f.x < 8 || f.x > 162) f.v = -f.v;
          const d = Math.sign(f.v), s = f.s;
          g.fillStyle = f.c; g.beginPath(); g.ellipse(f.x, f.y, 9 * s, 5.5 * s, 0, 0, 7); g.fill();
          g.beginPath(); g.moveTo(f.x - d * 8 * s, f.y); g.lineTo(f.x - d * 15 * s, f.y - 5 * s + Math.sin(t * 10) * 1.5); g.lineTo(f.x - d * 15 * s, f.y + 5 * s); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.arc(f.x + d * 4.5 * s, f.y - 1.5 * s, 1.8 * s, 0, 7); g.fill();
          g.fillStyle = '#111'; g.beginPath(); g.arc(f.x + d * 5 * s, f.y - 1.5 * s, .9 * s, 0, 7); g.fill();
        });
      };
    },
    snake() {
      const N = 12, CS = 10;
      const c = canvas(phone() ? 'left:8px;bottom:220px' : 'left:184px;bottom:44px', N * CS, N * CS, phone() ? .7 : 1);
      const g = c.getContext('2d');
      let body, dir, food, acc = 0;
      const reset = () => { body = [[5, 6], [4, 6], [3, 6]]; dir = [1, 0]; placeFood(); };
      const placeFood = () => { do { food = [Curio.randInt(0, N - 1), Curio.randInt(0, N - 1)]; } while (body.some(([x, y]) => x === food[0] && y === food[1])); };
      const free = (x, y) => x >= 0 && y >= 0 && x < N && y < N && !body.slice(0, -1).some(([a, b]) => a === x && b === y);
      const space = (sx, sy) => { const seen = new Set(), q = [[sx, sy]]; let n = 0; while (q.length && n < 60) { const [x, y] = q.pop(); const k = x + ',' + y; if (seen.has(k) || !free(x, y)) continue; seen.add(k); n++; q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); } return n; };
      reset();
      return (dt) => {
        acc += dt; if (acc < .12) return; acc = 0;
        const [hx, hy] = body[0];
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => !(dx === -dir[0] && dy === -dir[1]) && free(hx + dx, hy + dy));
        if (!opts.length) { reset(); return; }
        opts.sort((a, b) => {
          const sa = space(hx + a[0], hy + a[1]), sb = space(hx + b[0], hy + b[1]);
          if (Math.min(sa, body.length + 2) !== Math.min(sb, body.length + 2)) return sb - sa;
          return (Math.abs(hx + a[0] - food[0]) + Math.abs(hy + a[1] - food[1])) - (Math.abs(hx + b[0] - food[0]) + Math.abs(hy + b[1] - food[1]));
        });
        dir = opts[0];
        const nh = [hx + dir[0], hy + dir[1]];
        body.unshift(nh);
        if (nh[0] === food[0] && nh[1] === food[1]) { if (body.length > 60) reset(); else placeFood(); } else body.pop();
        g.fillStyle = '#1b2b12'; g.fillRect(0, 0, N * CS, N * CS);
        g.fillStyle = '#ff3d3d'; g.beginPath(); g.arc(food[0] * CS + 5, food[1] * CS + 5, 4, 0, 7); g.fill();
        body.forEach(([x, y], i) => { g.fillStyle = i ? `hsl(${110 + i * 3} 70% ${50 - i * .4}%)` : '#b6ff6b'; g.fillRect(x * CS + 1, y * CS + 1, CS - 2, CS - 2); });
      };
    },
    pet() {
      const p = el('button', 'fx-pet'); p.type = 'button'; p.setAttribute('aria-label', 'Pet the virtual pet');
      p.innerHTML = '<svg viewBox="0 0 80 70"><ellipse cx="40" cy="64" rx="26" ry="5" fill="rgba(0,0,0,.2)"/><path d="M12 50 C10 20 26 6 40 6 C54 6 70 20 68 50 C66 62 14 62 12 50Z" fill="#ff8ac2"/><ellipse cx="30" cy="20" rx="8" ry="5" fill="#fff" opacity=".45"/><circle class="pe" cx="30" cy="34" r="4" fill="#2a1a2a"/><circle class="pe" cx="50" cy="34" r="4" fill="#2a1a2a"/><circle cx="22" cy="44" r="4" fill="#ff5ea8" opacity=".6"/><circle cx="58" cy="44" r="4" fill="#ff5ea8" opacity=".6"/><path d="M34 44 Q40 50 46 44" stroke="#2a1a2a" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg><span class="fx-pet__say"></span>';
      front.append(p);
      let x = W() * .3, vx = 40, t = 0;
      p.addEventListener('click', (e) => {
        S.pets++; if (S.pets >= 25) unlock('pet');
        const v = Math.max(20, pps() * 2); gain(v); floatText(e.clientX, e.clientY, '♥ +' + fmt(v));
        const s = p.querySelector('span'); s.textContent = Curio.pick(D.petLines); p.classList.remove('happy'); void p.offsetWidth; p.classList.add('happy');
        tone(700, .08, 'sine', .08, 0, 1100); buzz(10);
      });
      return (dt) => {
        t += dt; x += vx * dt;
        if (x < 10 || x > W() - 90) { vx = -vx; x = Math.max(10, Math.min(W() - 90, x)); }
        if (Math.random() < dt * .3) vx = Curio.rand(-60, 60);
        const hop = Math.abs(Math.sin(t * 4)) * 14;
        p.style.transform = `translate(${x}px, ${-hop}px) scaleX(${vx < 0 ? -1 : 1})`;
      };
    },
    clock() {
      const c = el('div', 'fx-clock', '<small>SOMETHING HAPPENS IN</small><span>00:10.00</span>'); fx.append(c);
      let left = 10;
      return (dt) => { left -= dt; if (left <= 0) { left = Curio.randInt(8, 30); c.classList.remove('zero'); void c.offsetWidth; c.classList.add('zero'); } c.lastChild.textContent = '00:' + left.toFixed(2).padStart(5, '0'); };
    },
    shorts() {
      const box = el('div', 'fx-shorts', '<div class="fx-shorts__screen"></div><i class="fx-shorts__notch"></i>'); fx.append(box);
      const scr = box.firstChild; let t = 0, i = 0;
      const show = () => {
        const [col, cap, likes] = D.shorts[i++ % D.shorts.length];
        const v = el('div', 'fx-short'); v.style.background = `linear-gradient(160deg, ${col}, #111)`;
        v.innerHTML = `<i>${['😹', '🧼', '🔘', '👆', '🌱', '🧊', '⏳', '🚪', '💡'][(i - 1) % 9]}</i><b></b><span>♥ ${likes}</span>`;
        v.querySelector('b').textContent = cap;
        scr.append(v); while (scr.children.length > 2) scr.firstChild.remove();
      };
      show();
      return (dt) => { t += dt; if (t > 2.6) { t = 0; show(); } };
    },
    golden() {
      let t = Curio.rand(15, 30);
      return (dt) => {
        t -= dt; if (t > 0) return; t = Curio.rand(25, 55);
        const o = el('button', 'fx-gold'); o.type = 'button'; o.setAttribute('aria-label', 'Golden stimulus! Click it');
        o.style.left = Curio.rand(8, 85) + '%'; o.style.top = Curio.rand(15, 75) + '%';
        o.addEventListener('click', (e) => {
          S.golden++; unlock('gold'); o.remove();
          if (Math.random() < .5) { frenzyUntil = performance.now() + 15000; Curio.toast('✨ FRENZY! Everything x7 for 15 seconds'); }
          else { const v = Math.max(1000, pps() * 90 + clickValue() * 20); gain(v); floatText(e.clientX, e.clientY, '+' + fmt(v)); Curio.toast('✨ Lucky! +' + fmt(v)); }
          [784, 988, 1175, 1568].forEach((f, k) => tone(f, .2, 'triangle', .08, k * .05)); buzz([20, 30, 20]);
        });
        front.append(o); setTimeout(() => o.remove(), 9000);
      };
    },
    blocks() {
      const C = 8, R = 14, S2 = 10;
      const c = canvas(phone() ? 'right:8px;bottom:300px' : 'right:14px;top:12%', C * S2, R * S2, phone() ? .7 : 1);
      const g = c.getContext('2d');
      let grid = Array.from({ length: R }, () => new Array(C).fill(0)), pc = null, acc = 0;
      const cols = ['#ff7043', '#ffca28', '#66bb6a', '#29b6f6', '#ab47bc', '#ec407a'];
      const shapes = [[[0, 0], [1, 0], [0, 1], [1, 1]], [[0, 0], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 1]], [[0, 0]], [[0, 0], [1, 0]]];
      const fits = (p, dx, dy) => p.s.every(([x, y]) => { const nx = p.x + x + dx, ny = p.y + y + dy; return nx >= 0 && nx < C && ny < R && (ny < 0 || !grid[ny][nx]); });
      const spawn = () => {
        const s = Curio.pick(shapes); const w = Math.max(...s.map((q) => q[0])) + 1;
        let best = 0, bestScore = -1e9;
        for (let x = 0; x <= C - w; x++) { const p = { s, x, y: 0 }; let d = 0; while (fits(p, 0, d + 1)) d++; const score = d * 2 - Math.abs(x - C / 2) * .1 + Math.random(); if (score > bestScore) { bestScore = score; best = x; } }
        pc = { s, x: best, y: -1, c: Curio.randInt(1, cols.length) };
        if (!fits(pc, 0, 0)) { grid = grid.map((r) => r.fill(0)); }
      };
      return (dt) => {
        acc += dt; if (acc < .09) return; acc = 0;
        if (!pc) spawn();
        if (fits(pc, 0, 1)) pc.y++;
        else { pc.s.forEach(([x, y]) => { if (pc.y + y >= 0) grid[pc.y + y][pc.x + x] = pc.c; }); pc = null; grid = grid.filter((r) => r.some((v) => !v)); while (grid.length < R) grid.unshift(new Array(C).fill(0)); }
        g.fillStyle = '#16121f'; g.fillRect(0, 0, C * S2, R * S2);
        const draw = (x, y, ci) => { g.fillStyle = cols[ci - 1]; g.fillRect(x * S2 + 1, y * S2 + 1, S2 - 2, S2 - 2); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x * S2 + 1, y * S2 + 1, S2 - 2, 2); };
        grid.forEach((r, y) => r.forEach((v, x) => { if (v) draw(x, y, v); }));
        if (pc) pc.s.forEach(([x, y]) => { if (pc.y + y >= 0) draw(pc.x + x, pc.y + y, pc.c); });
      };
    },
    hypno() { const h = el('div', 'fx-hypno'); fx.prepend(h); },
    fireworks() {
      const c = el('canvas', 'fx-fw'); c.setAttribute('aria-hidden', 'true'); fx.prepend(c);
      const g = c.getContext('2d'); let parts = [], rockets = [], t = 0;
      return (dt) => {
        if (c.width !== W() || c.height !== H()) { c.width = W(); c.height = H(); }
        t -= dt;
        if (t < 0) { t = Curio.rand(.6, 1.6); rockets.push({ x: Curio.rand(.1, .9) * c.width, y: c.height, vy: -Curio.rand(320, 460), hue: Curio.randInt(0, 360) }); }
        g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, 0, c.width, c.height); g.globalCompositeOperation = 'lighter';
        rockets.forEach((r) => { r.y += r.vy * dt; r.vy += 220 * dt; g.fillStyle = `hsl(${r.hue} 100% 70%)`; g.fillRect(r.x - 1.5, r.y, 3, 6); });
        rockets = rockets.filter((r) => { if (r.vy > -40) { for (let i = 0; i < 40; i++) { const a = Math.random() * 7, s = Curio.rand(40, 170); parts.push({ x: r.x, y: r.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, hue: r.hue + Curio.randInt(-20, 20) }); } return false; } return true; });
        parts.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.vx *= .98; p.life -= dt * .8; g.fillStyle = `hsla(${p.hue} 100% 65% / ${Math.max(0, p.life)})`; g.beginPath(); g.arc(p.x, p.y, 2, 0, 7); g.fill(); });
        parts = parts.filter((p) => p.life > 0);
        g.globalCompositeOperation = 'source-over';
      };
    },
    vhs() {
      front.append(el('div', 'fx-vhs', '<div class="fx-vhs__lines"></div><div class="fx-vhs__play">PLAY ▶</div><div class="fx-vhs__time" id="vhsTime">00:00:00</div>'));
      document.body.classList.add('fx-retro');
      let t = 0;
      return (dt) => { t += dt; const s = Math.floor(t); const e = document.getElementById('vhsTime'); if (e) e.textContent = `SP ${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
    },
    owl() {
      const o = el('div', 'fx-owl', '<svg viewBox="0 0 70 70"><ellipse cx="35" cy="42" rx="26" ry="24" fill="#58cc02"/><path d="M12 24 L18 8 L28 20Z M58 24 L52 8 L42 20Z" fill="#58cc02"/><circle cx="25" cy="34" r="10" fill="#fff"/><circle cx="45" cy="34" r="10" fill="#fff"/><circle class="oe" cx="26" cy="35" r="5" fill="#222"/><circle class="oe" cx="46" cy="35" r="5" fill="#222"/><path d="M31 44 L35 50 L39 44Z" fill="#ffb000"/><ellipse cx="35" cy="56" rx="14" ry="8" fill="#89e219"/></svg><span></span>'); fx.append(o);
      let t = 4;
      return (dt) => { t -= dt; if (t < 0) { t = Curio.rand(9, 15); const s = o.lastChild; s.textContent = Curio.pick(D.owl); o.classList.remove('talk'); void o.offsetWidth; o.classList.add('talk'); tone(523, .1, 'sine', .05); tone(392, .14, 'sine', .05, .1); } };
    },
    subs() {
      const b = el('div', 'fx-subs', '<small>FOLLOWERS</small><b>0</b><span>▲ live</span>'); fx.append(b);
      let n = Curio.randInt(1000, 9000);
      return (dt) => { n += dt * Curio.rand(5, 60) * (1 + ownedCount() / 10); b.querySelector('b').textContent = Curio.fmt(Math.floor(n)); };
    },
    combo() { $('#combo').hidden = false; }
  };

  function canvas(pos, w, h, scale = 1) {
    const c = el('canvas', 'fx-canvas'); c.width = w; c.height = h; c.setAttribute('aria-hidden', 'true');
    c.style.cssText = `${pos};width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px`;
    fx.append(c); return c;
  }

  function mount(id) {
    if (mounted[id] || !FX[id]) return;
    mounted[id] = true;
    const tick = FX[id]();
    if (tick) tickers.set(id, tick);
  }
  function unmountAll() {
    fx.innerHTML = ''; front.innerHTML = '';
    document.body.classList.remove('fx-rainbow', 'fx-retro');
    $('#combo').hidden = true;
    tickers.clear(); Object.keys(mounted).forEach((k) => delete mounted[k]);
  }

  function shake() { const m = $('.s-wrap'); m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake'); }
  function gain(n) { S.stim += n; S.earned += n; }
  function floatText(x, y, txt, cls = '') {
    const f = el('div', 's-float' + (cls ? ' ' + cls : '')); f.textContent = txt;
    f.style.left = (x - 14 + Curio.rand(-20, 20)) + 'px'; f.style.top = (y - 20) + 'px';
    document.body.append(f); setTimeout(() => f.remove(), 900);
  }

  const shop = $('#shop'), countEl = $('#count');
  function itemHTML(icon, col, name, ds, extra) {
    return `<span class="s-ic" style="--ic:${col}">${icon}</span><span class="tx"><span class="nm">${name}</span><span class="ds">${ds}</span>${extra || ''}</span><span class="pr"></span><i class="s-afford"></i>`;
  }
  function buildShop() {
    shop.innerHTML = '';
    const pw = el('button', 's-item s-rep'); pw.type = 'button'; pw.dataset.id = 'power'; shop.append(pw);
    const au = el('button', 's-item s-rep'); au.type = 'button'; au.dataset.id = 'auto'; shop.append(au);
    UP.forEach((u) => {
      const b = el('button', 's-item'); b.type = 'button'; b.dataset.id = u.id;
      b.innerHTML = itemHTML(u.em, u.col, u.name, `${u.ds} <em>+${fmt(u.pps * freshAir())}/s</em>`);
      shop.append(b);
    });
    const mys = el('div', 's-item s-mystery', '<span class="s-ic">❔</span><span class="tx"><span class="nm">???</span><span class="ds">Keep stimulating to reveal.</span></span><span class="pr"></span>'); mys.dataset.id = 'mystery'; shop.append(mys);
    buildFinale();
    paintShop(true);
  }
  function buildFinale() {
    const f = $('#finale'); f.innerHTML = '';
    const out = el('button', 's-item s-outside'); out.type = 'button'; out.dataset.id = 'outside';
    out.innerHTML = itemHTML('🌳', '#5aa64f', 'Go Outside', 'Touch grass. Ends this run with a calm ending. Gives +10% production forever.') ;
    f.append(out);
    const ov = el('button', 's-item s-overload'); ov.type = 'button'; ov.dataset.id = 'overload';
    ov.innerHTML = itemHTML('🤯', '#ff00aa', 'Maximum Stimulation', 'Overload your brain. Ends this run, loudly. Gives +25% click power forever.');
    f.append(ov);
    f.querySelectorAll('.s-item').forEach((b) => b.addEventListener('click', () => buy(b.dataset.id)));
  }
  let seenAffordable = new Set();
  function paintShop(force) {
    let shown = 0;
    const nextHidden = UP.find((u, i) => !S.owned[u.id] && UP.filter((x, j) => j < i && !S.owned[x.id]).length >= 3);
    for (const b of shop.children) {
      const id = b.dataset.id;
      let cost, label;
      if (id === 'power') {
        cost = powerCost();
        const html = itemHTML('👆', '#ff00aa', `Bigger Clicks <small>lvl ${S.power}</small>`, `Each click gives ${fmt(baseClick() * 2)} instead of ${fmt(baseClick())}.`);
        if (b._k !== S.power + ':' + M.overloads) { b.innerHTML = html; b._k = S.power + ':' + M.overloads; }
      } else if (id === 'auto') {
        cost = autoCost();
        const html = itemHTML('🖱️', '#00b3ff', `Auto-Clicker <small>x${S.autos}</small>`, `A little cursor that clicks for you. +${fmt(baseClick() * .5)}/s each.`);
        const k = S.autos + ':' + S.power;
        if (b._k !== k) { b.innerHTML = html; b._k = k; }
      } else if (id === 'mystery') {
        b.hidden = !nextHidden;
        if (nextHidden) b.querySelector('.pr').textContent = fmt(nextHidden.cost);
        continue;
      } else {
        const u = UP.find((x) => x.id === id);
        const owned = !!S.owned[id];
        b.hidden = owned || shown >= 3;
        if (!owned) shown++;
        cost = u.cost;
        if (owned) continue;
      }
      const can = S.stim >= cost;
      b.disabled = !can;
      b.classList.toggle('can', can);
      label = fmt(cost);
      const pe = b.querySelector('.pr'); if (pe.textContent !== label) pe.textContent = label;
      b.querySelector('.s-afford').style.transform = `scaleX(${Math.min(1, S.stim / cost).toFixed(3)})`;
      if (can && !seenAffordable.has(id) && !b.hidden && !force && id !== 'power' && id !== 'auto') { seenAffordable.add(id); b.classList.remove('ping'); void b.offsetWidth; b.classList.add('ping'); tone(1046, .05, 'sine', .03); }
    }
    const left = UP.filter((u) => !S.owned[u.id]).length;
    $('#more').textContent = left > 3 ? `${left - 3} more distraction${left - 3 === 1 ? '' : 's'} hidden. Keep going.` : left ? '' : 'You own every distraction. The finale awaits.';
    $('#shopNote').textContent = `${ownedCount()}/${UP.length} owned`;
    const out = $('#finale [data-id="outside"]'), ov = $('#finale [data-id="overload"]');
    if (out) { out.disabled = S.stim < D.OUTSIDE_COST; out.querySelector('.pr').textContent = fmt(D.OUTSIDE_COST); out.querySelector('.s-afford').style.transform = `scaleX(${Math.min(1, S.stim / D.OUTSIDE_COST).toFixed(3)})`; out.hidden = ownedCount() < 10; }
    if (ov) { ov.hidden = left > 0; ov.disabled = S.stim < D.OVERLOAD_COST; ov.querySelector('.pr').textContent = fmt(D.OVERLOAD_COST); ov.querySelector('.s-afford').style.transform = `scaleX(${Math.min(1, S.stim / D.OVERLOAD_COST).toFixed(3)})`; }
  }

  function buy(id) {
    if (over) return;
    if (id === 'outside') { if (S.stim >= D.OUTSIDE_COST) finale('outside'); return; }
    if (id === 'overload') { if (S.stim >= D.OVERLOAD_COST) finale('overload'); return; }
    if (id === 'power') {
      if (S.stim < powerCost()) return;
      S.stim -= powerCost(); S.power++; tone(700, .1, 'triangle', .1); tone(1050, .12, 'triangle', .08, .08);
      pulseBtn();
    } else if (id === 'auto') {
      if (S.stim < autoCost()) return;
      S.stim -= autoCost(); S.autos++; tone(880, .06, 'square', .05); paintCursors();
      if (S.autos >= 25) unlock('auto25');
    } else {
      const u = UP.find((x) => x.id === id); if (!u || S.owned[id] || S.stim < u.cost) return;
      S.stim -= u.cost; S.owned[id] = true; S.order.push(id); mount(id);
      [523, 659, 784, 1047].forEach((f, i) => tone(f, .14, 'square', .045, i * .06)); buzz(20);
      const b = shop.querySelector(`[data-id="${id}"]`);
      if (b) { const r = b.getBoundingClientRect(); burst(r.left + 30, r.top + r.height / 2, u.col); }
      Curio.toast(`${u.em} ${u.name} unlocked!`);
      unlock('u1'); if (ownedCount() >= 10) unlock('u10'); if (ownedCount() >= 20) unlock('u20'); if (ownedCount() >= UP.length) unlock('uall');
      paintShelf(id);
    }
    paintShop(); paintCount(); save();
  }
  shop.addEventListener('click', (e) => { const b = e.target.closest('.s-item'); if (b && !b.disabled) buy(b.dataset.id); });

  function burst(x, y, col) {
    for (let i = 0; i < 14; i++) {
      const p = el('i', 's-bit'); const a = Math.random() * 7, r = Curio.rand(30, 90);
      p.style.left = x + 'px'; p.style.top = y + 'px'; p.style.background = col || '#ff00aa';
      p.style.setProperty('--dx', Math.cos(a) * r + 'px'); p.style.setProperty('--dy', Math.sin(a) * r + 'px');
      document.body.append(p); setTimeout(() => p.remove(), 700);
    }
  }

  function paintShelf(newId) {
    const sh = $('#shelf'); sh.innerHTML = '';
    S.order.forEach((id) => {
      const u = UP.find((x) => x.id === id); if (!u) return;
      const i = el('span', 's-chip' + (id === newId ? ' new' : '')); i.textContent = u.em; i.title = u.name; i.style.setProperty('--ic', u.col);
      sh.append(i);
    });
    if (!S.order.length) sh.innerHTML = '<span class="c-muted" style="font-size:13px">Nothing yet. Your brain is a quiet, empty room.</span>';
    $('#ownedCount').textContent = `${ownedCount()} / ${UP.length}`;
    const f = ownedCount() / UP.length;
    $('#meter').style.width = (f * 100).toFixed(1) + '%';
    $('#meterTxt').textContent = `Stimulation level ${Math.round(f * 100)}%`;
    document.documentElement.style.setProperty('--lvl', f.toFixed(3));
  }

  function paintCursors() {
    const box = $('#cursors'); const n = Math.min(S.autos, 24);
    while (box.children.length < n) { const c = el('i', 's-cur', '<svg viewBox="0 0 16 22"><path d="M1 1 L1 17 L5 13 L8 20 L11 19 L8 12 L14 12Z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>'); box.append(c); }
    while (box.children.length > n) box.lastChild.remove();
    [...box.children].forEach((c, i) => { c.style.setProperty('--a', (i / n * 360) + 'deg'); c.style.animationDelay = -(i / n * 2) + 's'; });
  }

  const btn = $('#click');
  function pulseBtn() { btn.classList.remove('pow'); void btn.offsetWidth; btn.classList.add('pow'); }
  let lastClickAt = 0;
  function doClick(x, y) {
    if (over) return;
    const now = performance.now();
    if (S.owned.combo) {
      comboHeat = Math.min(5, comboHeat + (now - lastClickAt < 400 ? .18 : .05));
      combo = 1 + Math.floor(comboHeat);
      if (combo >= 5) unlock('combo');
      S.maxCombo = Math.max(S.maxCombo, combo);
    }
    lastClickAt = now;
    const v = clickValue();
    gain(v); S.clicks++; M.lifetimeClicks++;
    if (S.clicks === 1) unlock('c1');
    if (S.clicks >= 1000) unlock('c1k');
    if (S.clicks >= 10000) unlock('c10k');
    tone(380 + Math.min(900, (S.clicks % 40) * 22) + combo * 40, .04, 'square', .045); buzz(5);
    const r = btn.getBoundingClientRect();
    if (x == null) { x = r.left + r.width / 2; y = r.top + r.height / 3; }
    floatText(x, y, '+' + fmt(v), combo > 1 ? 'hot' : '');
    const ring = el('i', 's-ripple'); ring.style.left = (x - r.left) + 'px'; ring.style.top = (y - r.top) + 'px'; btn.append(ring); setTimeout(() => ring.remove(), 500);
    btn.classList.add('down'); clearTimeout(doClick.t); doClick.t = setTimeout(() => btn.classList.remove('down'), 70);
    if (S.owned.quake) shake();
    paintCount();
  }
  btn.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); doClick(e.clientX, e.clientY); });
  btn.addEventListener('click', (e) => { if (e.detail === 0) doClick(); });
  document.addEventListener('keydown', (e) => {
    if (over || !$('#intro').hidden || document.querySelector('.curio-modal')) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (e.code === 'Space' && (tag === 'body' || e.target === btn)) { e.preventDefault(); if (!e.repeat || S.autos > 0) doClick(); }
    if (e.key === 'b' || e.key === 'B') { const c = [...shop.querySelectorAll('.s-item.can:not([hidden])')].pop(); if (c) buy(c.dataset.id); }
    const k = e.key.toLowerCase();
    if (k === 'g' || k === 'p' || k === 'x') {
      const t = k === 'g' ? front.querySelector('.fx-gold') : k === 'p' ? front.querySelector('.fx-pet') : [...front.querySelectorAll('.fx-ad:not(.bye) button')].pop();
      if (t) { const r = t.getBoundingClientRect(); t.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 })); }
    }
  });

  function paintCount() {
    countEl.textContent = fmt(S.stim);
    $('#rate').textContent = fmt(pps());
    $('#per').textContent = fmt(clickValue());
    const buffs = [];
    if (performance.now() < frenzyUntil) buffs.push(`<span class="s-buff gold">✨ Frenzy x7 · ${Math.ceil((frenzyUntil - performance.now()) / 1000)}s</span>`);
    if (M.trips) buffs.push(`<span class="s-buff">🌳 Fresh air +${M.trips * 10}%</span>`);
    if (M.overloads) buffs.push(`<span class="s-buff">🧠 Big brain +${M.overloads * 25}%</span>`);
    const html = buffs.join('');
    if ($('#buffs')._h !== html) { $('#buffs').innerHTML = html; $('#buffs')._h = html; }
    if (S.earned >= 1e6) unlock('m1');
    if (S.earned >= 1e9) unlock('b1');
  }

  let badgeQ = [];
  function unlock(id) {
    if (M.ach[id]) return;
    const a = D.achievements.find((x) => x.id === id); if (!a) return;
    M.ach[id] = Date.now(); save();
    $('#achCount').textContent = `${Object.keys(M.ach).length}/${D.achievements.length}`;
    badgeQ.push(a); if (badgeQ.length === 1) showBadge();
  }
  function showBadge() {
    const a = badgeQ[0]; if (!a) return;
    const b = el('div', 's-badge', `<i>${a.em}</i><span><small>Badge unlocked</small><b></b></span>`); b.querySelector('b').textContent = a.name;
    document.body.append(b); tone(988, .1, 'triangle', .08); tone(1319, .2, 'triangle', .07, .1);
    setTimeout(() => { b.classList.add('out'); setTimeout(() => { b.remove(); badgeQ.shift(); showBadge(); }, 400); }, 2600);
  }

  let last = performance.now(), acc = 0, saveT = 0, raf = 0, over = false;
  function loop(now) {
    raf = 0;
    if (document.hidden || over) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    S.playMs += dt * 1000;
    gain(pps() * dt);
    if (S.owned.combo) {
      if (now - lastClickAt > 500) comboHeat = Math.max(0, comboHeat - dt * 1.5);
      combo = 1 + Math.floor(comboHeat);
      $('#comboBar').style.width = (comboHeat / 5 * 100).toFixed(1) + '%';
      $('#comboTxt').textContent = 'x' + combo;
    }
    if (!document.body.classList.contains('calm')) for (const t of tickers.values()) t(dt);
    else if (tickers.has('golden')) tickers.get('golden')(dt);
    acc += dt; if (acc > .15) { acc = 0; paintCount(); paintShop(); }
    saveT += dt; if (saveT > 3) { saveT = 0; save(); }
    raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && !over) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); else save(); });

  function finale(kind) {
    over = true; save();
    const elapsed = S.playMs || (Date.now() - S.started);
    const order = S.order.slice().reverse();
    const ownedSnap = ownedCount();
    const endEl = $('#end');
    if (kind === 'overload') {
      document.body.classList.add('s-overload');
      let k = 0;
      const crescendo = setInterval(() => { tone(200 + k * 40, .15, 'sawtooth', .04 + k * .002); shake(); k++; if (k > 30) clearInterval(crescendo); }, 90);
      setTimeout(() => { unmountAll(); document.body.classList.remove('s-overload'); runEnd(kind, elapsed, ownedSnap); }, 3200);
    } else {
      let i = 0;
      const off = () => {
        if (i < order.length) {
          const id = order[i++];
          if (tickers.has(id)) tickers.delete(id);
          const u = UP.find((x) => x.id === id);
          tone(800 - i * 15, .05, 'square', .04);
          if (u) Curio.toast(`${u.em} off`, 300);
          setTimeout(off, Math.max(40, 180 - i * 6));
        } else { unmountAll(); runEnd(kind, elapsed, ownedSnap); }
      };
      off();
    }
    endEl.dataset.kind = kind;
  }

  let endRaf = 0, endAudio = [];
  function runEnd(kind, elapsed, ownedSnap) {
    const endEl = $('#end'); endEl.hidden = false; endEl.dataset.kind = kind;
    const lines = $('#endLines'); lines.innerHTML = ''; $('#endCard').hidden = true; $('#endBack').hidden = true;
    const cv = $('#endCv');
    const script = kind === 'outside'
      ? ['You went outside.', 'The grass is real.', 'The sky has no notifications.', 'A bird makes a noise, and it\'s fine.', 'Nothing is spinning. Nothing is bouncing.', 'It\'s quiet. Your brain says thank you.']
      : ['BRAIN.EXE has stopped responding.', 'Too much stimulation detected.', 'Rebooting brain...', 'Loading boredom... done.', 'Loading patience... done.', 'Hello again.'];
    if (kind === 'outside') { M.trips++; Curio.store.set('stim:grass', M.trips); unlock('grass'); }
    else { M.overloads++; unlock('over'); }
    if (elapsed < 25 * 60000) unlock('fast');
    const b = Curio.best(kind === 'outside' ? 'outside' : 'overload', Math.round(elapsed / 1000), false);
    const stats = { earned: S.earned, clicks: S.clicks, owned: ownedSnap, golden: S.golden, elapsed, best: b.best * 1000, isNew: b.isNew };
    S = blank(); save();
    if (kind === 'outside') { drawOutside(cv); ambience(); } else { drawReboot(cv); }
    script.forEach((t, i) => setTimeout(() => {
      const p = el('p'); p.textContent = t; lines.append(p);
      if (kind === 'overload') tone(i < 3 ? 120 : 600 + i * 80, .2, i < 3 ? 'sawtooth' : 'sine', .06);
      if (lines.children.length > 3) lines.firstChild.classList.add('fade');
    }, 900 + i * 1700));
    setTimeout(() => showEndCard(kind, stats), 900 + script.length * 1700);
  }
  function showEndCard(kind, st) {
    const c = $('#endCard');
    const outside = kind === 'outside';
    c.innerHTML = `<div class="s-end__em">${outside ? '🌳' : '🧠'}</div><h2>${outside ? 'You touched grass.' : 'Maximum stimulation reached.'}</h2>
      <p>${outside ? 'Fresh air bonus: every distraction now produces 10% more per trip outside.' : 'Your brain got bigger. Every click is now 25% stronger per overload.'}</p>
      <div class="s-end__stats">
        <div class="c-stat"><b>${fmtTime(st.elapsed)}</b><span>${st.isNew ? 'New best!' : 'Best ' + fmtTime(st.best)}</span></div>
        <div class="c-stat"><b>${fmt(st.earned)}</b><span>Stim earned</span></div>
        <div class="c-stat"><b>${fmt(st.clicks)}</b><span>Clicks</span></div>
        <div class="c-stat"><b>${st.owned}</b><span>Distractions</span></div>
        <div class="c-stat"><b>${st.golden}</b><span>Golden orbs</span></div>
      </div>
      <p class="s-end__small">Trips outside: ${M.trips} · Overloads: ${M.overloads}</p>
      <div class="c-row"><button class="c-btn" type="button" id="endAgain">Go back inside</button><button class="c-btn c-btn--ghost" type="button" id="endStay">${outside ? 'Stay a while' : 'Look around'}</button><button class="c-btn c-btn--ghost" type="button" id="endShare">Share</button></div>`;
    c.hidden = false;
    Curio.confetti(outside ? 60 : 140);
    c.querySelector('#endAgain').addEventListener('click', backInside);
    c.querySelector('#endStay').addEventListener('click', () => { c.hidden = true; $('#endLines').innerHTML = ''; $('#endBack').hidden = false; });
    c.querySelector('#endShare').addEventListener('click', () => shareText(`${outside ? '🌳 I went outside' : '🤯 I reached maximum stimulation'} in Stimulation Clicker after ${fmtTime(st.elapsed)}, ${fmt(st.clicks)} clicks and ${st.owned} distractions. Zoble`));
    c.querySelector('#endAgain').focus();
  }
  function backInside() {
    cancelAnimationFrame(endRaf); endAudio.forEach((s) => { try { s.stop(); } catch {} }); endAudio = [];
    clearInterval(birdT);
    $('#end').hidden = true;
    over = false; seenAffordable = new Set();
    unmountAll(); buildShop(); paintShelf(); paintCursors(); paintCount(); save(); start();
  }
  $('#endBack').addEventListener('click', backInside);

  let birdT = 0;
  function ambience() {
    const a = audio(); if (!a) return;
    const w = noise(60, .03, 500, 'lowpass'); if (w) endAudio.push(w);
    [196, 247, 294, 392].forEach((f, i) => tone(f, 6, 'sine', .025, i * .4));
    birdT = setInterval(() => { if (document.hidden || $('#end').hidden) return; const f = Curio.rand(2200, 3400); tone(f, .08, 'sine', .03, 0, f * 1.3); tone(f * 1.1, .07, 'sine', .025, .12, f * .9); }, 2600);
  }
  function drawOutside(cv) {
    const g = cv.getContext('2d'); let t0 = performance.now();
    const blades = [], clouds = [], birds = [], flies = [];
    const resize = () => { const dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize();
    const Wd = () => innerWidth, Hd = () => innerHeight;
    for (let i = 0; i < 260; i++) blades.push({ x: Math.random(), h: Curio.rand(18, 44), p: Math.random() * 7, c: `hsl(${Curio.randInt(95, 125)} ${Curio.randInt(45, 65)}% ${Curio.randInt(32, 46)}%)`, d: Math.random() });
    blades.sort((a, b) => a.d - b.d);
    for (let i = 0; i < 5; i++) clouds.push({ x: Math.random(), y: Curio.rand(.06, .3), s: Curio.rand(.6, 1.3), v: Curio.rand(.004, .012) });
    for (let i = 0; i < 4; i++) birds.push({ x: Math.random(), y: Curio.rand(.12, .3), v: Curio.rand(.02, .04), p: Math.random() * 7 });
    for (let i = 0; i < 6; i++) flies.push({ x: Math.random(), y: Curio.rand(.62, .85), p: Math.random() * 7, c: Curio.pick(['#ffd447', '#ff8ac2', '#fff', '#8fd3ff']) });
    const frame = (now) => {
      if ($('#end').hidden) return;
      if (document.hidden) { endRaf = requestAnimationFrame(frame); return; }
      if (cv.width !== Math.round(innerWidth * Math.min(2, devicePixelRatio || 1))) resize();
      const t = (now - t0) / 1000, w = Wd(), h = Hd();
      const rise = Math.min(1, t / 8);
      const sky = g.createLinearGradient(0, 0, 0, h * .7);
      sky.addColorStop(0, `hsl(${205 - (1 - rise) * 30} ${70}% ${48 + rise * 18}%)`); sky.addColorStop(1, `hsl(${30 + rise * 170} ${80 - rise * 30}% ${78 + rise * 10}%)`);
      g.fillStyle = sky; g.fillRect(0, 0, w, h);
      const sy = h * (.62 - rise * .45);
      const sg = g.createRadialGradient(w * .78, sy, 10, w * .78, sy, 140); sg.addColorStop(0, 'rgba(255,240,170,.9)'); sg.addColorStop(1, 'rgba(255,240,170,0)');
      g.fillStyle = sg; g.fillRect(0, 0, w, h);
      g.fillStyle = '#fff3b0'; g.beginPath(); g.arc(w * .78, sy, 42, 0, 7); g.fill();
      clouds.forEach((c) => { c.x = (c.x + c.v * (1 / 60)) % 1.3; const cx = c.x * w * 1.3 - w * .15, cy = c.y * h; g.fillStyle = 'rgba(255,255,255,.92)'; [[0, 0, 34], [30, -12, 28], [58, 0, 30], [28, 8, 30]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(cx + dx * c.s, cy + dy * c.s, r * c.s, 0, 7); g.fill(); }); });
      birds.forEach((b) => { b.x = (b.x + b.v / 60) % 1.1; const bx = b.x * w, by = b.y * h + Math.sin(t + b.p) * 6, f = Math.sin(t * 8 + b.p) * 5; g.strokeStyle = '#2a3b4a'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 9, by - f); g.quadraticCurveTo(bx - 4, by - 4, bx, by); g.quadraticCurveTo(bx + 4, by - 4, bx + 9, by - f); g.stroke(); });
      const hill = (base, amp, col, ph) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * base + Math.sin(x / w * 3 + ph) * amp + Math.sin(x / w * 7 + ph) * amp * .3); g.lineTo(w, h); g.fill(); };
      hill(.6, 22, '#8fcf7a', 1); hill(.68, 18, '#6cbc5a', 2.4); hill(.78, 14, '#4f9e44', 4);
      blades.forEach((b) => { const bx = b.x * w, by = h * (.8 + b.d * .2) + 6, sway = Math.sin(t * 1.6 + b.p + bx * .01) * 6; g.strokeStyle = b.c; g.lineWidth = 2 + b.d * 2; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + sway * .4, by - b.h * .6, bx + sway, by - b.h * (1 + b.d * .4)); g.stroke(); });
      flies.forEach((f) => { const fx2 = f.x * w + Math.sin(t * .7 + f.p) * 60, fy = f.y * h + Math.sin(t * 1.3 + f.p * 2) * 20, fl = Math.abs(Math.sin(t * 12 + f.p)); g.fillStyle = f.c; g.beginPath(); g.ellipse(fx2 - 4, fy, 5 * fl + 1, 4, -.4, 0, 7); g.ellipse(fx2 + 4, fy, 5 * fl + 1, 4, .4, 0, 7); g.fill(); });
      endRaf = requestAnimationFrame(frame);
    };
    endRaf = requestAnimationFrame(frame);
  }
  function drawReboot(cv) {
    const g = cv.getContext('2d'); const t0 = performance.now();
    const frame = (now) => {
      if ($('#end').hidden) return;
      if (document.hidden) { endRaf = requestAnimationFrame(frame); return; }
      const dpr = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(innerWidth * dpr)) { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
      const t = (now - t0) / 1000, w = innerWidth, h = innerHeight;
      const calm = Math.min(1, Math.max(0, (t - 4) / 6));
      g.fillStyle = `rgb(${Math.round(10 + calm * 20)}, ${Math.round(12 + calm * 30)}, ${Math.round(40 + calm * 60)})`; g.fillRect(0, 0, w, h);
      if (calm < 1) for (let i = 0; i < 30 * (1 - calm); i++) { g.fillStyle = `hsla(${Curio.randInt(0, 360)} 100% 60% / ${.4 * (1 - calm)})`; g.fillRect(Math.random() * w, Math.random() * h, Curio.rand(20, 200), Curio.rand(2, 10)); }
      g.strokeStyle = `rgba(150, 200, 255, ${.15 + calm * .2})`; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { g.beginPath(); for (let x = 0; x <= w; x += 10) { const y = h * (.3 + i * .08) + Math.sin(x * .01 + t * (1 + i * .2)) * 20 * (1 - calm * .7); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
      const bw = Math.min(320, w * .7), bx = (w - bw) / 2, by = h * .78;
      g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(bx, by, bw, 8);
      g.fillStyle = '#8fd3ff'; g.fillRect(bx, by, bw * Math.min(1, t / 10), 8);
      endRaf = requestAnimationFrame(frame);
    };
    endRaf = requestAnimationFrame(frame);
  }

  async function shareText(t) {
    try { await navigator.clipboard.writeText(t); Curio.toast('Copied to clipboard'); } catch { Curio.toast(t, 4000); }
  }
  $('#share').addEventListener('click', () => shareText(`🎰 Stimulation Clicker: ${fmt(S.stim)} stimulation, ${fmt(pps())}/s, ${ownedCount()}/${UP.length} distractions owned. Trips outside: ${M.trips}. Zoble`));

  const info = $('#info');
  function renderInfo(p) {
    info.dataset.p = p;
    if (p === 'stats') {
      const rows = [['Stimulation earned this run', fmt(S.earned)], ['Clicks this run', fmt(S.clicks)], ['Time this run', fmtTime(S.playMs)], ['Per click', fmt(clickValue())], ['Per second', fmt(pps())], ['Auto-clickers', S.autos], ['Bigger Clicks level', S.power], ['Golden orbs caught', S.golden], ['Corner hits', S.corners], ['Ads closed', S.adsClosed], ['Pet pets', S.pets], ['Best combo', 'x' + S.maxCombo], ['Lifetime clicks', fmt(M.lifetimeClicks)], ['Trips outside', M.trips], ['Overloads', M.overloads], ['Fastest outside', Curio.getBest('outside') != null ? fmtTime(Curio.getBest('outside') * 1000) : '-']];
      info.innerHTML = '<h3>📊 Stats</h3><dl class="s-dl">' + rows.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('') + '</dl>';
    } else if (p === 'ach') {
      info.innerHTML = `<h3>🏆 Badges · ${Object.keys(M.ach).length} of ${D.achievements.length}</h3><div class="s-achs">${D.achievements.map((a) => `<div class="s-ach ${M.ach[a.id] ? 'got' : ''}"><i>${a.em}</i><b>${a.name}</b><span>${a.desc}</span></div>`).join('')}</div>`;
    } else {
      info.innerHTML = `<h3>❓ How to play</h3><ul class="s-help"><li>Click the big button (or press <span class="c-kbd">Space</span>) to earn stimulation.</li><li>Spend it in the shop. Each distraction adds stimulation per second and something new to look at.</li><li><b>Bigger Clicks</b> doubles every click. <b>Auto-Clickers</b> click for you. Press <span class="c-kbd">B</span> to buy the cheapest thing you can afford.</li><li>Close pop-up ads, pet the pet and catch golden orbs for bonuses. Keys: <span class="c-kbd">X</span> closes an ad, <span class="c-kbd">P</span> pets the pet, <span class="c-kbd">G</span> grabs a golden orb.</li><li>When you are ready: <b>Go Outside</b> for a calm ending and a permanent production bonus, or own everything and choose <b>Maximum Stimulation</b>.</li><li>Too much? <b>Calm mode</b> hides the effects but keeps your income.</li></ul>`;
    }
  }
  document.querySelectorAll('.s-tool[data-panel]').forEach((t) => t.addEventListener('click', () => {
    const p = t.dataset.panel, open = info.hidden || info.dataset.p !== p;
    document.querySelectorAll('.s-tool[data-panel]').forEach((x) => x.setAttribute('aria-pressed', String(open && x === t)));
    info.hidden = !open; if (open) renderInfo(p);
  }));
  const calmBtn = $('#calm');
  const paintCalm = () => { document.body.classList.toggle('calm', !!M.calm); calmBtn.setAttribute('aria-pressed', String(!!M.calm)); };
  calmBtn.addEventListener('click', () => { M.calm = !M.calm; paintCalm(); save(); Curio.toast(M.calm ? '😌 Calm mode on. Effects hidden.' : '🎰 Calm mode off. Here we go.'); });
  $('#reset').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '🧹', title: 'Reset this run?', body: 'Your stimulation, upgrades and auto-clickers will be wiped. Badges and bonuses from going outside are kept.', buttons: [{ label: 'Keep going', value: 0 }, { label: 'Reset', value: 1 }] });
    if (!v) return;
    S = blank(); unmountAll(); buildShop(); paintShelf(); paintCursors(); paintCount(); save();
  });

  $('#introGo').addEventListener('click', () => { $('#intro').hidden = true; M.intro = true; save(); audio(); btn.focus({ preventScroll: true }); });

  const away = Date.now() - (S.lastSeen || Date.now());
  buildShop();
  S.order.forEach((id) => mount(id));
  paintShelf(); paintCursors(); paintCalm(); paintCount();
  $('#achCount').textContent = `${Object.keys(M.ach).length}/${D.achievements.length}`;
  if (away > 60000 && upgradePps() > 0) {
    const secs = Math.min(3600, away / 1000);
    const v = upgradePps() * secs * .25;
    gain(v); setTimeout(() => Curio.toast(`While you were away: +${fmt(v)} stimulation`, 3200), 600);
  }
  if (!M.intro && S.clicks === 0) $('#intro').hidden = false;
  start();
  window.__stim = { get S() { return S; }, get M() { return M; }, gain, buy, UP, finale, click: () => doClick() };
})();
