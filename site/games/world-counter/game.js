(() => {
  const C = window.WC_COUNTERS, CATS = window.WC_CATS, ICONS = window.WC_ICONS;
  const LAND = window.WC_LAND, CITIES = window.WC_CITIES, NAMES = window.WC_CITY_NAMES;
  const $ = (id) => document.getElementById(id);
  const YEAR = 365.2425 * 86400;
  const D = Math.PI / 180;
  const SAVE = 'wc:v2';
  const POP_BASE = 8.2e9, POP_T = Date.UTC(2025, 6, 1), POP_GROWTH = 70e6;
  const popAt = (t) => POP_BASE + POP_GROWTH * (t - POP_T) / 1000 / YEAR;

  const BADGES = [
    ['m1', '⏱️', 'One minute of humanity', 'Watch for a minute in total'],
    ['m10', '🍿', 'Settled in', 'Watch for 10 minutes in total'],
    ['m60', '🧘', 'An hour of humanity', 'Watch for an hour in total'],
    ['warp', '⏩', 'Time traveller', 'Fast-forward at a day per second'],
    ['life', '🎂', 'Life story', 'Count everything since you were born'],
    ['pin', '📌', 'Curator', 'Pin 5 counters'],
    ['spin', '🌍', 'World spinner', 'Drag the globe around'],
    ['million', '👶', 'A million babies', 'See a million births since you arrived'],
    ['chime', '🔔', 'Ding', 'Turn on a sound'],
    ['share', '📣', 'Town crier', 'Copy your summary'],
    ['night', '🦉', 'Night owl', 'Visit between midnight and 5am'],
    ['explore', '🧭', 'Explorer', 'Look at every category']
  ];

  const blank = () => ({ v: 2, pins: [], birth: '', watched: 0, badges: [], frame: 'arrived', chime: 'off', seen: [] });
  function load() {
    const d = blank(), s = Curio.store.get(SAVE, null);
    if (!s || typeof s !== 'object' || s.v !== 2) return d;
    for (const k of Object.keys(d)) if (s[k] == null || typeof s[k] !== typeof d[k] || Array.isArray(d[k]) !== Array.isArray(s[k])) s[k] = d[k];
    return s;
  }
  const save = load();
  const persist = () => Curio.store.set(SAVE, save);
  function award(id) {
    if (save.badges.includes(id)) return;
    save.badges.push(id); persist();
    const b = BADGES.find((x) => x[0] === id);
    if (b) { Curio.toast(`${b[1]} Badge unlocked: ${b[2]}`, 2600); Curio.beep(1046, .12, 'triangle', .07); setTimeout(() => Curio.beep(1568, .16, 'triangle', .07), 100); }
    if (!$('badges').hidden) renderBadges();
  }

  const fmt = (n, dec = 0) => n.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  function big(n, dec = 0) {
    if (n >= 1e21) return fmt(n / 1e21, 3) + ' sextillion';
    if (n >= 1e18) return fmt(n / 1e18, 3) + ' quintillion';
    if (n >= 1e15) return fmt(n / 1e15, 3) + ' quadrillion';
    if (n >= 1e12) return fmt(n / 1e12, 3) + ' trillion';
    return fmt(Math.floor(n * 10 ** dec) / 10 ** dec, dec);
  }
  function rateText(r) {
    if (r >= 1e9) return `${fmt(r / 1e9, 2)} billion per second`;
    if (r >= 1e6) return `${fmt(r / 1e6, 2)} million per second`;
    if (r >= 1) return `${fmt(r, r < 10 ? 1 : 0)} per second`;
    const every = 1 / r;
    if (every < 60) return `1 every ${fmt(every, 1)} seconds`;
    if (every < 3600) return `1 every ${fmt(every / 60, 1)} minutes`;
    if (every < 86400) return `1 every ${fmt(every / 3600, 1)} hours`;
    return `${fmt(r * 86400, 1)} a day`;
  }
  const special = {
    bday: (p) => p / 365.2425 / 86400,
    heart: (p) => p * 70 / 60,
    breath: (p) => p * 15 / 60,
    blink: (p) => p * 17 / 60,
    sleep: (p) => p * (8 / 24) / 3600,
    steps: (p) => p * 5000 / 86400,
    words: (p) => p * 16000 / 86400
  };
  const rateOf = (c, pop) => (c.s ? special[c.s](pop) : c.r);

  let vt = Date.now();
  const t0 = vt, real0 = performance.now();
  let warp = 1, lastFrame = performance.now(), realWatched = 0;
  const WARPS = [[1, 'Real time'], [60, '1 min/s'], [3600, '1 hour/s'], [86400, '1 day/s']];
  const FRAMES = [['arrived', 'Since you arrived'], ['today', 'Today'], ['year', 'This year'], ['life', 'Your lifetime']];
  const CHIMES = [['off', '🔕 Off'], ['births', '👶 Births'], ['heart', '💓 My heartbeat'], ['lightning', '⚡ Lightning']];
  let frame = FRAMES.some((f) => f[0] === save.frame) ? save.frame : 'arrived';
  if (frame === 'life' && !save.birth) frame = 'arrived';
  let filter = 'all', query = '';

  function seg(el, items, cur, on, role) {
    el.innerHTML = '';
    for (const [id, label] of items) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      if (role) { b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(id === cur)); }
      else b.setAttribute('aria-pressed', String(id === cur));
      b.addEventListener('click', () => on(id));
      el.append(b);
    }
  }
  function setFrame(f) {
    frame = f; save.frame = f; persist();
    $('birthRow').hidden = f !== 'life';
    if (f === 'life') { if (!save.birth) { $('birth').focus(); Curio.toast('Pick your birthday to count your whole life'); } else award('life'); }
    seg($('frames'), FRAMES, frame, setFrame, true);
    const lbl = FRAMES.find((x) => x[0] === f)[1].toLowerCase();
    tiles.forEach((t) => { t.fr.textContent = f === 'life' ? 'in your lifetime' : lbl; t.last = -1; });
    Curio.beep(700, .04, 'triangle', .05);
  }
  function setWarp(w) {
    warp = w; seg($('warps'), WARPS, warp, setWarp);
    $('warpPill').hidden = w === 1 && vt - Date.now() < 2000;
    if (w === 86400) award('warp');
    Curio.beep(400 + Math.log10(w) * 150, .06, 'triangle', .05);
  }
  function setChime(c) {
    save.chime = c; persist(); seg($('chimes'), CHIMES, c, setChime);
    if (c !== 'off') { award('chime'); if (Curio.muted) Curio.toast('Unmute Curio in the top bar to hear it'); }
  }
  $('birth').max = new Date().toISOString().slice(0, 10);
  if (save.birth) $('birth').value = save.birth;
  $('birth').addEventListener('change', () => {
    const v = $('birth').value;
    if (!v || isNaN(new Date(v + 'T00:00:00'))) return;
    save.birth = v; persist(); award('life');
    tiles.forEach((t) => { t.last = -1; });
  });

  const tiles = [];
  const sections = $('sections');
  function buildTiles() {
    sections.innerHTML = '';
    tiles.length = 0;
    for (const cat of CATS) {
      const items = C.filter((c) => c.c === cat.id);
      const h = document.createElement('h2'); h.className = 'wc-h'; h.style.setProperty('--a', cat.a); h.style.setProperty('--b', cat.b);
      h.innerHTML = `<i aria-hidden="true"></i>${cat.label}`;
      const grid = document.createElement('div'); grid.className = 'wc-grid';
      sections.append(h, grid);
      for (const c of items) {
        const el = document.createElement('article');
        el.className = 'wc-tile';
        el.style.setProperty('--a', cat.a); el.style.setProperty('--b', cat.b);
        const pinned = save.pins.includes(c.id);
        el.innerHTML = `<div class="wc-row1"><div class="wc-ic" aria-hidden="true"><svg viewBox="0 0 32 32">${ICONS[c.i] || ''}</svg></div><div class="wc-label">${c.l}</div><button class="wc-pin" type="button" aria-pressed="${pinned}" aria-label="Pin ${c.l}">${pinned ? '★' : '☆'}</button></div>
          <div class="wc-num"><span class="n">0</span><small>${c.u || ''}</small></div><div class="wc-frame"></div>
          <div class="wc-rate"></div>${!c.s && c.r < 1 ? '<div class="wc-prog"><i></i></div>' : ''}<p class="wc-note">${c.n}</p>`;
        grid.append(el);
        const t = { c, el, cat, h, grid, n: el.querySelector('.n'), fr: el.querySelector('.wc-frame'), rate: el.querySelector('.wc-rate'), prog: el.querySelector('.wc-prog i'), last: -1, lastInt: -1, lastRate: '' };
        el.querySelector('.wc-pin').addEventListener('click', (e) => {
          const b = e.currentTarget; const on = !save.pins.includes(c.id);
          save.pins = on ? [...save.pins, c.id] : save.pins.filter((x) => x !== c.id);
          persist(); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '★' : '☆';
          Curio.beep(on ? 990 : 500, .06, 'triangle', .06);
          if (save.pins.length >= 5) award('pin');
          if (filter === 'pinned') applyFilter();
        });
        tiles.push(t);
      }
    }
    tiles.forEach((t) => { t.fr.textContent = frame === 'life' ? 'in your lifetime' : FRAMES.find((x) => x[0] === frame)[1].toLowerCase(); });
  }
  function applyFilter() {
    const q = query.trim().toLowerCase();
    let any = false;
    const visCats = new Set();
    for (const t of tiles) {
      const ok = (filter === 'all' || (filter === 'pinned' ? save.pins.includes(t.c.id) : t.c.c === filter)) && (!q || (t.c.l + ' ' + t.c.n).toLowerCase().includes(q));
      t.el.hidden = !ok;
      if (ok) { any = true; visCats.add(t.c.c); }
    }
    tiles.forEach((t) => { t.h.hidden = !visCats.has(t.c.c); t.grid.hidden = !visCats.has(t.c.c); });
    $('empty').hidden = any;
    if (!any && filter === 'pinned') { $('empty').hidden = false; $('empty').textContent = 'Nothing pinned yet. Tap the ☆ on any counter.'; }
    else $('empty').textContent = 'No counters match. Try another word.';
  }
  function buildChips() {
    const el = $('chips'); el.innerHTML = '';
    const list = [['all', 'All', null], ['pinned', '★ Pinned', null], ...CATS.map((c) => [c.id, c.label, c.b])];
    for (const [id, label, col] of list) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'wc-chip';
      b.innerHTML = `${col ? `<i style="background:${col}"></i>` : ''}${label}`;
      b.setAttribute('aria-pressed', String(filter === id));
      b.addEventListener('click', () => {
        filter = id; buildChips(); applyFilter();
        if (CATS.some((c) => c.id === id) && !save.seen.includes(id)) { save.seen.push(id); persist(); if (CATS.every((c) => save.seen.includes(c.id))) award('explore'); }
      });
      el.append(b);
    }
  }
  $('search').addEventListener('input', (e) => { query = e.target.value; applyFilter(); });

  const cvs = $('globe');
  const g = cvs.getContext('2d');
  let GS = 340, R = 150, cx = 170, cy = 170, dpr = 1;
  let lon0 = (-new Date().getTimezoneOffset() / 60) * 15, lat0 = 18, spinOn = true, dragging = false;
  const night = document.createElement('canvas'); const NS = 120; night.width = night.height = NS;
  const ng = night.getContext('2d'); const nImg = ng.createImageData(NS, NS);
  function resize() {
    const w = cvs.clientWidth || 300;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cvs.width = Math.round(w * dpr); cvs.height = Math.round(w * dpr);
    GS = w; R = w * .44; cx = w / 2; cy = w / 2;
  }
  function toView(lon, lat) {
    const l = lon * D, p = lat * D, l0 = lon0 * D, p0 = lat0 * D;
    const X = Math.cos(p) * Math.cos(l), Y = Math.cos(p) * Math.sin(l), Z = Math.sin(p);
    const x1 = Math.cos(l0) * X + Math.sin(l0) * Y, y1 = -Math.sin(l0) * X + Math.cos(l0) * Y, z1 = Z;
    const zx = Math.cos(p0) * x1 + Math.sin(p0) * z1, zz = -Math.sin(p0) * x1 + Math.cos(p0) * z1;
    return [y1, zz, zx];
  }
  function sunLonLat(t) {
    const d = new Date(t);
    const start = Date.UTC(d.getUTCFullYear(), 0, 0);
    const N = (t - start) / 86400000;
    const decl = -23.44 * Math.cos(2 * Math.PI / 365 * (N + 10));
    const hrs = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
    let lon = -15 * (hrs - 12);
    return [lon, decl];
  }
  function dayFraction(t) {
    const [sl, sd] = sunLonLat(t);
    let tot = 0, day = 0;
    for (const [la, lo, w] of CITIES) {
      const dot = Math.sin(la * D) * Math.sin(sd * D) + Math.cos(la * D) * Math.cos(sd * D) * Math.cos((lo - sl) * D);
      tot += w; if (dot > -0.0145) day += w;
    }
    return day / tot;
  }

  const pings = [];
  const sample = (arr, wIdx) => { if (wIdx == null) return Curio.pick(arr); let tot = 0; for (const a of arr) tot += a[wIdx]; let r = Math.random() * tot; for (let i = 0; i < arr.length; i++) { r -= arr[i][wIdx]; if (r <= 0) return i; } return 0; };
  function addPing(type) {
    if (type === 'birth') { const i = sample(CITIES, 2); const [la, lo] = CITIES[i]; pings.push({ la: la + (Math.random() - .5) * 3, lo: lo + (Math.random() - .5) * 3, t: 0, type, i }); return i; }
    if (type === 'bolt') { const [la, lo] = Curio.pick(window.WC_LIGHTNING); pings.push({ la: la + (Math.random() - .5) * 14, lo: lo + (Math.random() - .5) * 14, t: 0, type }); return -1; }
    const [la, lo] = Curio.pick(window.WC_QUAKES); pings.push({ la: la + (Math.random() - .5) * 4, lo: lo + (Math.random() - .5) * 4, t: 0, type: 'quake' }); return -1;
  }

  function drawGlobe(dt) {
    const w = GS;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, w);
    const atm = g.createRadialGradient(cx, cy, R * .95, cx, cy, R * 1.16);
    atm.addColorStop(0, 'rgba(120,190,255,.55)'); atm.addColorStop(1, 'rgba(120,190,255,0)');
    g.fillStyle = atm; g.beginPath(); g.arc(cx, cy, R * 1.16, 0, Math.PI * 2); g.fill();
    const ocean = g.createRadialGradient(cx - R * .35, cy - R * .35, R * .1, cx, cy, R);
    ocean.addColorStop(0, '#4fa3ef'); ocean.addColorStop(.7, '#1d5fb8'); ocean.addColorStop(1, '#0e3a7e');
    g.fillStyle = ocean; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
    g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1;
    for (let la = -60; la <= 60; la += 30) { g.beginPath(); let pen = false; for (let lo = -180; lo <= 180; lo += 5) { const [x, y, z] = toView(lo, la); if (z < 0) { pen = false; continue; } const X = cx + x * R, Y = cy - y * R; pen ? g.lineTo(X, Y) : g.moveTo(X, Y); pen = true; } g.stroke(); }
    for (let lo = -180; lo < 180; lo += 30) { g.beginPath(); let pen = false; for (let la = -90; la <= 90; la += 5) { const [x, y, z] = toView(lo, la); if (z < 0) { pen = false; continue; } const X = cx + x * R, Y = cy - y * R; pen ? g.lineTo(X, Y) : g.moveTo(X, Y); pen = true; } g.stroke(); }
    const land = g.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    land.addColorStop(0, '#8fd18a'); land.addColorStop(1, '#3f8f4a');
    g.fillStyle = land; g.strokeStyle = 'rgba(20,70,30,.55)'; g.lineWidth = 1;
    for (const poly of LAND) {
      const pts = poly.map(([lo, la]) => toView(lo, la));
      if (pts.every((p) => p[2] < 0)) continue;
      g.beginPath();
      pts.forEach(([x, y, z], k) => { let X = x, Y = y; if (z < 0) { const m = Math.hypot(x, y) || 1; X = x / m; Y = y / m; } const px = cx + X * R, py = cy - Y * R; k ? g.lineTo(px, py) : g.moveTo(px, py); });
      g.closePath(); g.fill(); g.stroke();
    }
    const [sl, sd] = sunLonLat(vt);
    const sv = toView(sl, sd);
    const d = nImg.data;
    for (let j = 0; j < NS; j++) for (let i = 0; i < NS; i++) {
      const x = (i + .5) / NS * 2 - 1, y = 1 - (j + .5) / NS * 2;
      const r2 = x * x + y * y, o = (j * NS + i) * 4;
      if (r2 > 1.02) { d[o + 3] = 0; continue; }
      const z = Math.sqrt(Math.max(0, 1 - r2));
      const dot = x * sv[0] + y * sv[1] + z * sv[2];
      const a = Math.max(0, Math.min(1, (0.08 - dot) * 5));
      d[o] = 6; d[o + 1] = 10; d[o + 2] = 40; d[o + 3] = a * 175;
    }
    ng.putImageData(nImg, 0, 0);
    g.imageSmoothingEnabled = true;
    g.drawImage(night, cx - R, cy - R, R * 2, R * 2);
    for (let k = 0; k < CITIES.length; k++) {
      const [la, lo, wgt] = CITIES[k];
      const [x, y, z] = toView(lo, la);
      if (z < .05) continue;
      const dot = Math.sin(la * D) * Math.sin(sd * D) + Math.cos(la * D) * Math.cos(sd * D) * Math.cos((lo - sl) * D);
      if (dot > -0.02) continue;
      const rr = 1 + Math.sqrt(wgt) * .45;
      const X = cx + x * R, Y = cy - y * R;
      const gl = g.createRadialGradient(X, Y, 0, X, Y, rr * 3);
      gl.addColorStop(0, 'rgba(255,225,140,.95)'); gl.addColorStop(1, 'rgba(255,200,90,0)');
      g.fillStyle = gl; g.beginPath(); g.arc(X, Y, rr * 3, 0, Math.PI * 2); g.fill();
    }
    for (let k = pings.length - 1; k >= 0; k--) {
      const p = pings[k]; p.t += dt;
      const life = p.type === 'quake' ? 2.4 : p.type === 'bolt' ? .5 : 1.4;
      if (p.t > life) { pings.splice(k, 1); continue; }
      const [x, y, z] = toView(p.lo, p.la);
      if (z < .05) continue;
      const X = cx + x * R, Y = cy - y * R, f = p.t / life;
      if (p.type === 'birth') {
        g.strokeStyle = `rgba(255,126,182,${1 - f})`; g.lineWidth = 2; g.beginPath(); g.arc(X, Y, 2 + f * 12, 0, Math.PI * 2); g.stroke();
        g.fillStyle = `rgba(255,170,210,${1 - f})`; g.beginPath(); g.arc(X, Y, 2.2, 0, Math.PI * 2); g.fill();
      } else if (p.type === 'bolt') {
        g.strokeStyle = `rgba(255,240,140,${1 - f})`; g.lineWidth = 1.8; g.beginPath(); g.moveTo(X - 2, Y - 8); g.lineTo(X + 2, Y - 2); g.lineTo(X - 1, Y - 1); g.lineTo(X + 3, Y + 6); g.stroke();
        g.fillStyle = `rgba(255,255,220,${(1 - f) * .5})`; g.beginPath(); g.arc(X, Y, 7 * (1 - f), 0, Math.PI * 2); g.fill();
      } else {
        for (let q = 0; q < 3; q++) { const ff = (f + q * .2) % 1; g.strokeStyle = `rgba(255,90,54,${(1 - ff) * .9})`; g.lineWidth = 1.6; g.beginPath(); g.arc(X, Y, 3 + ff * 20, 0, Math.PI * 2); g.stroke(); }
      }
    }
    g.restore();
    const hl = g.createRadialGradient(cx - R * .45, cy - R * .5, 0, cx - R * .45, cy - R * .5, R * 1.1);
    hl.addColorStop(0, 'rgba(255,255,255,.28)'); hl.addColorStop(.4, 'rgba(255,255,255,.04)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(180,220,255,.5)'; g.lineWidth = 1.2; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
  }

  let drag = null;
  Curio.drag(cvs, {
    start: (p) => { drag = { x: p.clientX, y: p.clientY, lon: lon0, lat: lat0 }; dragging = true; },
    move: (p) => {
      if (!drag) return;
      const k = 180 / (R * Math.PI);
      lon0 = drag.lon - (p.clientX - drag.x) * k;
      lat0 = Math.max(-70, Math.min(70, drag.lat + (p.clientY - drag.y) * k));
      if (Math.abs(p.clientX - drag.x) > 40) award('spin');
    },
    end: () => { drag = null; dragging = false; }
  });
  cvs.tabIndex = 0;
  cvs.addEventListener('keydown', (e) => {
    const m = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 8], ArrowDown: [0, -8] }[e.key];
    if (!m) return;
    e.preventDefault(); lon0 += m[0]; lat0 = Math.max(-70, Math.min(70, lat0 + m[1])); award('spin');
  });
  cvs.addEventListener('wheel', (e) => { e.preventDefault(); lon0 += e.deltaX * .25; lat0 = Math.max(-70, Math.min(70, lat0 - e.deltaY * .2)); }, { passive: false });

  const featured = [['births', '👶', 'babies born'], ['lightning', '⚡', 'lightning flashes'], ['emails', '📧', 'emails sent'], ['trees', '🌳', 'trees cut down'], ['coffee', '☕', 'cups of coffee drunk'], ['myheart', '💓', 'beats of your heart']];
  const milestones = {};
  function since(c, pop, secs) { return rateOf(c, pop) * secs; }
  function frameSeconds(f) {
    if (f === 'arrived') return (vt - t0) / 1000;
    const now = new Date(vt);
    if (f === 'today') return (vt - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 1000;
    if (f === 'year') return (vt - new Date(now.getFullYear(), 0, 1).getTime()) / 1000;
    if (save.birth) { const b = new Date(save.birth + 'T00:00:00').getTime(); return Math.max(0, (vt - b) / 1000); }
    return 0;
  }
  const byId = Object.fromEntries(C.map((c) => [c.id, c]));

  let lastTiles = 0, lastTicker = 0, lastDN = 0, chimeAcc = 0, heartAcc = 0, birthAcc = 0, boltAcc = 0, quakeAcc = 0, chimeCount = 0, chimeWin = 0, raf = 0, lastSave = 0;
  function frameLoop(now) {
    raf = requestAnimationFrame(frameLoop);
    if (document.hidden) { lastFrame = now; return; }
    const dtReal = Math.min(.1, (now - lastFrame) / 1000); lastFrame = now;
    vt += dtReal * 1000 * warp;
    realWatched += dtReal;
    const pop = popAt(vt);
    if (spinOn && !dragging) lon0 += dtReal * (warp > 1 ? Math.min(40, 6 * Math.log10(warp) + 6) : 6);
    birthAcc += dtReal * warp * byId.births.r; boltAcc += dtReal * warp * 44; quakeAcc += dtReal * warp * byId.quakes.r;
    let nb = Math.floor(birthAcc); birthAcc -= nb; let born = -1;
    for (let k = 0; k < Math.min(nb, 6); k++) born = addPing('birth');
    let nl = Math.floor(boltAcc); boltAcc -= nl; for (let k = 0; k < Math.min(nl, warp > 1 ? 4 : 2); k++) if (Math.random() < (warp > 1 ? 1 : .35)) addPing('bolt');
    let nq = Math.floor(quakeAcc); quakeAcc -= nq; for (let k = 0; k < Math.min(nq, 2); k++) addPing('quake');
    if (born >= 0 && now - lastTicker > 2600) {
      lastTicker = now;
      const tk = $('ticker'); tk.textContent = `👶 Somewhere, a baby was just born. Maybe near ${NAMES[born]}.`; tk.classList.remove('flash'); void tk.offsetWidth; tk.classList.add('flash');
    }
    if (pings.length > 120) pings.splice(0, pings.length - 120);
    drawGlobe(dtReal * Math.min(warp, 4));
    if (save.chime !== 'off' && !Curio.muted) {
      if (now - chimeWin > 1000) { chimeWin = now; chimeCount = 0; }
      if (save.chime === 'births') { chimeAcc += nb; if (chimeAcc >= 1 && chimeCount < 12) { chimeAcc = 0; chimeCount++; Curio.beep(1100 + Math.random() * 500, .05, 'sine', .05); } else if (chimeAcc >= 1) chimeAcc = 0; }
      if (save.chime === 'heart') { heartAcc += dtReal * warp * 70 / 60; if (heartAcc >= 1) { heartAcc = 0; Curio.beep(70, .12, 'sine', .35); setTimeout(() => Curio.beep(60, .1, 'sine', .25), 140); } }
      if (save.chime === 'lightning') { chimeAcc += nl; if (chimeAcc >= (warp > 1 ? 400 : 10) && chimeCount < 6) { chimeAcc = 0; chimeCount++; crackle(); } }
    }
    $('pop').textContent = fmt(Math.floor(pop));
    const sOpen = (now - real0) / 1000;
    const m = Math.floor(sOpen / 60), s = Math.floor(sOpen % 60);
    $('clock').textContent = m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
    const vs = (vt - t0) / 1000;
    if (vs - sOpen > 5) { $('warpPill').hidden = false; $('vclock').textContent = vs > 86400 * 2 ? `${fmt(vs / 86400, 1)} days` : vs > 7200 ? `${fmt(vs / 3600, 1)} hours` : `${fmt(vs / 60, 1)} minutes`; }
    if (now - lastDN > 1000) {
      lastDN = now;
      const f = dayFraction(vt);
      $('dayBar').style.width = (f * 100).toFixed(1) + '%';
      $('dayPct').textContent = Math.round(f * 100) + '%'; $('nightPct').textContent = Math.round((1 - f) * 100) + '%';
      $('popSub').textContent = warp > 1 ? `time is running ${fmt(warp)}× faster than normal` : 'growing by about 2 people every second';
      summary(pop);
    }
    if (now - lastTiles > 66) {
      lastTiles = now;
      const secs = frameSeconds(frame);
      for (const t of tiles) {
        if (t.el.hidden) continue;
        const c = t.c, r = rateOf(c, pop), dec = c.dec || 0;
        const v = r * secs;
        const txt = frame === 'life' && !save.birth ? '?' : big(v, v < 1e12 ? dec : 0);
        if (txt !== t.lastTxt) { t.n.textContent = txt; t.n.parentElement.classList.toggle('long', txt.length > 13); t.lastTxt = txt; }
        const iv = Math.floor(v);
        if (frame === 'arrived' && r * warp < 15 && iv !== t.lastInt && t.lastInt >= 0) {
          t.el.classList.remove('tick'); void t.el.offsetWidth; t.el.classList.add('tick');
          const p = document.createElement('span'); p.className = 'wc-plus'; p.textContent = '+1'; t.el.append(p); setTimeout(() => p.remove(), 900);
        }
        t.lastInt = iv;
        const rt = rateText(r);
        if (rt !== t.lastRate) { t.rate.textContent = rt; t.lastRate = rt; }
        if (t.prog) t.prog.style.width = ((v % 1) * 100).toFixed(1) + '%';
      }
      const arrived = (vt - t0) / 1000;
      for (const [id, , label] of featured) {
        const v = since(byId[id], pop, arrived);
        const mark = Math.pow(10, Math.floor(Math.log10(Math.max(1, v))));
        if (mark >= 100 && (milestones[id] || 0) < mark) {
          if (milestones[id]) { Curio.toast(`🎉 ${fmt(mark)} ${label} since you arrived`, 2200); Curio.beep(880, .08, 'triangle', .06); }
          milestones[id] = mark;
        }
      }
      if (since(byId.births, pop, arrived) >= 1e6) award('million');
    }
    if (now - lastSave > 5000) {
      lastSave = now;
      save.watched += 5; persist();
      if (save.watched >= 60) award('m1');
      if (save.watched >= 600) award('m10');
      if (save.watched >= 3600) award('m60');
    }
  }
  function crackle() {
    const ac = Curio.audioContext(); if (!ac || Curio.muted) return;
    const t = ac.currentTime, len = ac.sampleRate * .4;
    const b = ac.createBuffer(1, len, ac.sampleRate), dd = b.getChannelData(0);
    for (let i = 0; i < len; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (Math.random() < .3 ? 1 : .3);
    const src = ac.createBufferSource(); src.buffer = b;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
    const gg = ac.createGain(); gg.gain.value = .25;
    src.connect(f).connect(gg).connect(ac.destination); src.start(t);
  }

  function summaryText(pop) {
    const arrived = (vt - t0) / 1000;
    const sOpen = (performance.now() - real0) / 1000;
    const m = Math.floor(sOpen / 60), s = Math.floor(sOpen % 60);
    const parts = featured.map(([id, emo, label]) => `${emo} ${big(since(byId[id], pop, arrived))} ${label}`);
    const warped = arrived - sOpen > 5 ? ` (and I fast-forwarded ${arrived > 86400 * 2 ? fmt(arrived / 86400, 1) + ' days' : arrived > 7200 ? fmt(arrived / 3600, 1) + ' hours' : fmt(arrived / 60, 1) + ' minutes'} of world time)` : '';
    return { head: `In my ${m} min ${s} s on World Right Now${warped}:`, parts };
  }
  function summary(pop) {
    const { head, parts } = summaryText(pop);
    $('summary').innerHTML = `${head}<br>${parts.join(' · ')}`;
  }
  $('share').addEventListener('click', async () => {
    const { head, parts } = summaryText(popAt(vt));
    const text = `${head}\n${parts.join('\n')}\n(Curio · World Right Now)`;
    try { await navigator.clipboard.writeText(text); Curio.toast('Copied! Paste it anywhere.'); } catch { Curio.modal({ emoji: '📋', title: 'Your summary', body: text, buttons: [{ label: 'OK', value: 1 }] }); }
    award('share');
  });
  function renderBadges() {
    const got = new Set(save.badges);
    $('badges').innerHTML = BADGES.map(([id, ic, n, d]) => `<div class="wc-badge${got.has(id) ? ' got' : ''}"><i>${ic}</i><div><b>${n}</b><small>${d}</small></div></div>`).join('') + `<p class="c-muted" style="grid-column:1/-1;margin:4px 0 0">Total time watched: ${fmt(save.watched / 60, 1)} minutes · ${save.badges.length}/${BADGES.length} badges</p>`;
  }
  $('badgesBtn').addEventListener('click', () => { const b = $('badges'); b.hidden = !b.hidden; if (!b.hidden) renderBadges(); });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea,select')) return;
    if (e.key === ' ' && !e.target.closest('button')) { e.preventDefault(); spinOn = !spinOn; Curio.toast(spinOn ? 'Globe spinning' : 'Globe paused'); }
    else if (/^[1-4]$/.test(e.key)) setFrame(FRAMES[Number(e.key) - 1][0]);
    else if (e.key === 'w' || e.key === 'W') { const i = WARPS.findIndex((x) => x[0] === warp); setWarp(WARPS[(i + 1) % WARPS.length][0]); }
    else if (e.key === '/') { e.preventDefault(); $('search').focus(); }
  });
  addEventListener('resize', resize);

  if (new Date().getHours() < 5) setTimeout(() => award('night'), 1500);
  if (!Curio.store.get('wc:tipShown', false) && !Curio.touchpad) { Curio.store.set('wc:tipShown', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar to spin the globe with clicks', 4200), 1800); }
  buildTiles(); buildChips(); applyFilter();
  seg($('frames'), FRAMES, frame, setFrame, true);
  $('birthRow').hidden = frame !== 'life';
  seg($('warps'), WARPS, warp, setWarp);
  seg($('chimes'), CHIMES, save.chime, setChime);
  resize();
  raf = requestAnimationFrame(frameLoop);
  window.__wc = { setWarp, setFrame, get vt() { return vt; }, tiles };
})();
