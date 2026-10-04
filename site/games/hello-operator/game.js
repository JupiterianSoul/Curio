(() => {
  const $ = (id) => document.getElementById(id);
  const ADV = Curio.advanced;
  const RAD = Math.PI / 180, LAT_TOP = 84, LAT_BOT = -61;
  const FAMOUS = ['London', 'New York', 'Los Angeles', 'Mexico City', 'São Paulo', 'Paris', 'Berlin', 'Cairo', 'Lagos', 'Nairobi', 'Moscow', 'Dubai', 'Mumbai', 'Bangkok', 'Singapore', 'Beijing', 'Tokyo', 'Sydney', 'Auckland', 'Honolulu', 'Toronto', 'Buenos Aires', 'Johannesburg', 'Istanbul'];
  const POOL = ADV ? HO_CITIES.filter((c) => { try { new Intl.DateTimeFormat('en', { timeZone: c.tz }); return true; } catch { return false; } }) : HO_CITIES.filter((c) => FAMOUS.includes(c.name));
  const CFG = ADV ? { hour: 5, hours: 24, every: [1.6, 3.4], patience: 15, lines: 4, strikes: 3 } : { hour: 8, hours: 12, every: [3, 5.5], patience: 22, lines: 3, strikes: 3 };
  const COLORS = ['#ff6b5e', '#4fc3f7', '#ffd54f', '#9ccc65'];
  const fmts = new Map();
  function localHM(tz, ms) {
    let f = fmts.get(tz);
    if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', hour: 'numeric', minute: 'numeric' }); fmts.set(tz, f); }
    const p = f.formatToParts(new Date(ms)); let h = 0, m = 0;
    for (const x of p) { if (x.type === 'hour') h = +x.value % 24; if (x.type === 'minute') m = +x.value; }
    return { h, m, t: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` };
  }
  function sun(ms) {
    const n = ms / 864e5 + 2440587.5 - 2451545.0;
    const L = (280.46 + 0.9856474 * n) % 360, g = ((357.528 + 0.9856003 * n) % 360) * RAD;
    const lam = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD, eps = (23.439 - 0.0000004 * n) * RAD;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    const ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / RAD;
    const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
    return { dec, lon: (((ra - gmst * 15) + 540) % 360) - 180 };
  }
  const alt = (s, lat, lon) => Math.asin(Math.sin(lat * RAD) * Math.sin(s.dec) + Math.cos(lat * RAD) * Math.cos(s.dec) * Math.cos((lon - s.lon) * RAD)) / RAD;
  const awake = (h) => h >= 7 && h < 22, open = (h) => h >= 9 && h < 17;

  const rules = ADV ? [
    'Connect a call only if it is between 7 in the morning and 10 at night where it is going.',
    'If they are asleep, tell the caller to try later.',
    'Briefcase calls go to offices: 9 to 5 only.',
    'Red emergency calls always go through, any hour.',
    'Local times are not on the cards. Read the map: the dark side is night.',
    'Three complaints and you are back on the post room. Streaks multiply your score.'
  ] : [
    'Each card says where a call is going and what time it is there.',
    'Sun: connect it. Moon: they are asleep, tell the caller to try later.',
    'Be quick, callers hang up if you leave them waiting.',
    'Three complaints and the shift is over.'
  ];
  $('rules').innerHTML = rules.map((r) => `<li>${r}</li>`).join('');
  const KEY = `hello-operator:${Curio.mode}`;
  function paintBest() { const b = Curio.getBest(`shift:${Curio.mode}`); $('best').textContent = b != null ? `Best shift: ${b} points` : 'Your first shift. Good luck.'; }
  paintBest();
  if (!ADV) $('keys').remove();

  const cv = $('map'), g = cv.getContext('2d');
  let W = 720, H = 290, dpr = 1;
  const night = document.createElement('canvas'); night.width = 180; night.height = 73;
  const ng = night.getContext('2d'), nid = ng.createImageData(180, 73);
  let landPath = null;
  function fit() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    W = r.width; H = r.width * (LAT_TOP - LAT_BOT) / 360;
    cv.style.height = `${H}px`; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    landPath = new Path2D();
    for (const a of window.WC_LAND) { for (let i = 0; i < a.length; i += 2) { const x = px(a[i]), y = py(a[i + 1]); i ? landPath.lineTo(x, y) : landPath.moveTo(x, y); } landPath.closePath(); }
  }
  const px = (lon) => (lon + 180) / 360 * W, py = (lat) => (LAT_TOP - lat) / (LAT_TOP - LAT_BOT) * H;
  addEventListener('resize', () => { if (!$('desk').hidden) fit(); });
  let nightAt = -1;
  function paintNight(ms) {
    const s = sun(ms), d = nid.data;
    for (let j = 0; j < 73; j++) for (let i = 0; i < 180; i++) {
      const lat = LAT_TOP - (j + .5) / 73 * (LAT_TOP - LAT_BOT), lon = -180 + (i + .5) * 2;
      const a = alt(s, lat, lon), k = a > 0 ? 0 : a < -12 ? 1 : -a / 12, o = (j * 180 + i) * 4;
      d[o] = 10; d[o + 1] = 16; d[o + 2] = 50; d[o + 3] = k * 165;
    }
    ng.putImageData(nid, 0, 0);
    return s;
  }

  let state = null, sel = 0, raf = 0, last = 0;
  function start() {
    $('start').hidden = true; $('desk').hidden = false; $('over').hidden = true;
    fit();
    const d = new Date(); d.setUTCHours(Curio.randInt(0, 23), 0, 0, 0);
    state = { t0: d.getTime(), el: 0, calls: [], next: 1.2, score: 0, strikes: 0, streak: 0, best: 0, ok: 0, woke: 0, hung: 0, turned: 0, log: [], id: 0, sunS: null };
    sel = 0; renderBoard(); paintHud();
    Curio.sfx && Curio.sfx('on');
    cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(frame);
    scrollTo({ top: $('desk').offsetTop - 70, behavior: 'smooth' });
  }
  const now = () => state.t0 + state.el * 3600000 / CFG.hour;
  function newCall() {
    if (state.calls.length >= CFG.lines) return;
    const ms = now();
    const from = Curio.pick(POOL);
    let kind = 'normal';
    if (ADV) { const r = Math.random(); kind = r < .14 ? 'emergency' : r < .36 ? 'business' : 'normal'; }
    const want = Math.random() < .5;
    const cands = POOL.filter((c) => c !== from && (kind === 'business' ? open(localHM(c.tz, ms).h) : awake(localHM(c.tz, ms).h)) === want);
    const to = cands.length ? Curio.pick(cands) : Curio.pick(POOL.filter((c) => c !== from));
    const used = new Set(state.calls.map((c) => c.line));
    let line = 0; while (used.has(line)) line++;
    state.calls.push({ id: ++state.id, from, to, kind, line, life: CFG.patience * (kind === 'emergency' ? .7 : 1), max: CFG.patience * (kind === 'emergency' ? .7 : 1) });
    Curio.beep(kind === 'emergency' ? 1200 : 880, .06, 'square', .05); setTimeout(() => Curio.beep(kind === 'emergency' ? 1200 : 880, .06, 'square', .05), 120);
    renderBoard();
  }
  function judge(c, act) {
    const h = localHM(c.to.tz, now()).h;
    const good = c.kind === 'emergency' ? act === 'connect' : (c.kind === 'business' ? open(h) : awake(h)) === (act === 'connect');
    state.calls = state.calls.filter((x) => x !== c);
    const who = `${c.to.flag} ${c.to.name}`;
    if (good) {
      state.streak++; state.ok++;
      const mult = ADV ? 1 + Math.min(2, Math.floor(state.streak / 5)) : 1;
      const pts = (act === 'connect' ? 10 + Math.ceil(c.life / c.max * 5) : 6) * mult;
      state.score += pts; state.best = Math.max(state.best, state.streak);
      flash(c.line, act === 'connect' ? `Connected! +${pts}` : `Good call. +${pts}`, 'ok');
      if (act === 'connect') { Curio.beep(660, .08, 'triangle', .08); setTimeout(() => Curio.beep(990, .1, 'triangle', .08), 80); } else Curio.beep(520, .08, 'triangle', .06);
      if (mult > 1 && state.streak % 5 === 0) Curio.toast(`${state.streak} in a row! Score x${mult}`);
    } else {
      state.streak = 0; state.strikes++;
      const msg = act === 'connect' ? (c.kind === 'business' ? `${who}: the office is closed. ${localHM(c.to.tz, now()).t} there.` : `You woke someone in ${who}. It is ${localHM(c.to.tz, now()).t} there!`) : (c.kind === 'emergency' ? 'That was an emergency!' : `${who} was wide awake (${localHM(c.to.tz, now()).t}).`);
      if (act === 'connect') state.woke++; else state.turned++;
      state.log.push(msg);
      flash(c.line, 'Complaint!', 'bad'); Curio.toast(msg, 2600);
      Curio.sfx && Curio.sfx('error'); navigator.vibrate && navigator.vibrate([30, 40, 30]);
      document.querySelector('.ho-mapbox').classList.remove('shake'); void document.querySelector('.ho-mapbox').offsetWidth; document.querySelector('.ho-mapbox').classList.add('shake');
    }
    renderBoard(); paintHud();
    if (state.strikes >= CFG.strikes) end(false);
  }
  const flashes = {};
  function flash(line, text, cls) { flashes[line] = { text, cls, until: performance.now() + 1100 }; }

  function renderBoard() {
    const b = $('board'); b.innerHTML = '';
    const ms = now();
    for (let line = 0; line < CFG.lines; line++) {
      const c = state.calls.find((x) => x.line === line);
      const el = document.createElement('div'); el.className = 'ho-line' + (c ? ' is-live' : '') + (line === sel ? ' is-sel' : '') + (c ? ` k-${c.kind}` : '');
      el.style.setProperty('--lc', COLORS[line]);
      const f = flashes[line];
      if (!c) {
        el.innerHTML = `<div class="ho-jack"><i></i><span>Line ${line + 1}</span></div><p class="ho-idle">${f && f.until > performance.now() ? `<b class="${f.cls}">${f.text}</b>` : 'quiet...'}</p>`;
      } else {
        const lt = localHM(c.to.tz, ms), isAwake = c.kind === 'business' ? open(lt.h) : awake(lt.h);
        const tag = c.kind === 'emergency' ? '<span class="ho-tag ho-tag--e">EMERGENCY</span>' : c.kind === 'business' ? '<span class="ho-tag ho-tag--b">💼 OFFICE</span>' : '';
        el.innerHTML = `<div class="ho-jack"><i></i><span>Line ${line + 1}</span>${tag}</div>
          <div class="ho-who"><small>From</small><b>${c.from.flag} ${c.from.name}</b></div>
          <div class="ho-who ho-to"><small>To</small><b>${c.to.flag} ${c.to.name}</b>${ADV ? '' : `<span class="ho-lt ${isAwake ? 'day' : 'night'}">${isAwake ? '☀️' : '🌙'} ${lt.t}</span>`}</div>
          <div class="ho-pat"><i style="width:${c.life / c.max * 100}%"></i></div>
          <div class="ho-acts"><button type="button" class="ho-btn ho-btn--c" data-a="connect">Connect</button><button type="button" class="ho-btn ho-btn--x" data-a="decline">${c.kind === 'business' ? 'Closed, later' : 'Asleep, later'}</button></div>`;
        el.querySelectorAll('[data-a]').forEach((btn) => btn.addEventListener('click', (e) => { e.stopPropagation(); sel = line; judge(c, btn.dataset.a); }));
      }
      el.addEventListener('click', () => { sel = line; renderBoard(); });
      b.append(el);
    }
  }
  function tickBoard() {
    for (const c of state.calls) { const el = $('board').children[c.line]; if (!el) continue; const bar = el.querySelector('.ho-pat i'); if (bar) bar.style.width = `${Math.max(0, c.life / c.max * 100)}%`; if (!ADV) { const lt = el.querySelector('.ho-lt'); if (lt) { const t = localHM(c.to.tz, now()), a = c.kind === 'business' ? open(t.h) : awake(t.h); lt.className = `ho-lt ${a ? 'day' : 'night'}`; lt.textContent = `${a ? '☀️' : '🌙'} ${t.t}`; } } }
  }
  function paintHud() {
    const d = new Date(now());
    $('utc').textContent = `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    $('score').textContent = state.score;
    $('strikes').textContent = '☎'.repeat(state.strikes) + '·'.repeat(CFG.strikes - state.strikes);
    $('shiftBar').style.width = `${Math.min(100, state.el / (CFG.hours * CFG.hour) * 100)}%`;
  }

  function draw(ms) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sea = g.createLinearGradient(0, 0, 0, H); sea.addColorStop(0, '#1d5f86'); sea.addColorStop(1, '#174a6b');
    g.fillStyle = sea; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1;
    for (let lon = -150; lon <= 150; lon += 30) { g.beginPath(); g.moveTo(px(lon), 0); g.lineTo(px(lon), H); g.stroke(); }
    g.fillStyle = '#c9b98d'; g.fill(landPath);
    g.strokeStyle = 'rgba(80,60,30,.5)'; g.lineWidth = 1; g.stroke(landPath);
    if (!state.sunS || Math.abs(ms - nightAt) > 120000) { state.sunS = paintNight(ms); nightAt = ms; }
    g.imageSmoothingEnabled = true; g.drawImage(night, 0, 0, W, H);
    const s = state.sunS;
    const sx = px(s.lon), sy = py(s.dec / RAD);
    const gl = g.createRadialGradient(sx, sy, 0, sx, sy, W * .12); gl.addColorStop(0, 'rgba(255,230,120,.5)'); gl.addColorStop(1, 'rgba(255,230,120,0)');
    g.fillStyle = gl; g.beginPath(); g.arc(sx, sy, W * .12, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffe066'; g.beginPath(); g.arc(sx, sy, Math.max(4, W * .009), 0, Math.PI * 2); g.fill();
    const t = performance.now() / 1000;
    for (const c of state.calls) {
      const x0 = px(c.from.lon), y0 = py(c.from.lat), x1 = px(c.to.lon), y1 = py(c.to.lat);
      const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - Math.abs(x1 - x0) * .25 - 10;
      g.strokeStyle = COLORS[c.line]; g.lineWidth = c.line === sel ? 3.5 : 2; g.setLineDash([8, 6]); g.lineDashOffset = -t * 30;
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke(); g.setLineDash([]);
      for (const [x, y, r] of [[x0, y0, 3.5], [x1, y1, 5 + Math.sin(t * 6) * 1.5]]) { g.fillStyle = COLORS[c.line]; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke(); }
      g.font = `800 ${W < 500 ? 10 : 12}px system-ui, sans-serif`; g.textAlign = x1 > W - 80 ? 'right' : 'left';
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillText(c.to.name, x1 + (x1 > W - 80 ? -8 : 8) + 1, y1 + 4 + 1);
      g.fillStyle = '#fff'; g.fillText(c.to.name, x1 + (x1 > W - 80 ? -8 : 8), y1 + 4);
    }
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    if (document.hidden || !state) { last = ts; return; }
    const dt = Math.min(.1, (ts - (last || ts)) / 1000); last = ts;
    if (!$('over').hidden) return;
    state.el += dt;
    state.next -= dt;
    if (state.next <= 0) { newCall(); state.next = Curio.rand(CFG.every[0], CFG.every[1]) * (1 - Math.min(.35, state.el / (CFG.hours * CFG.hour) * .4)); }
    for (const c of [...state.calls]) {
      c.life -= dt;
      if (c.life <= 0) { state.calls = state.calls.filter((x) => x !== c); state.hung++; state.streak = 0; state.score = Math.max(0, state.score - 3); flash(c.line, 'Caller hung up. -3', 'bad'); Curio.beep(300, .2, 'sawtooth', .04); renderBoard(); }
    }
    for (const k in flashes) if (flashes[k].until < performance.now()) { delete flashes[k]; if (!state.calls.some((c) => c.line === +k)) renderBoard(); }
    tickBoard(); paintHud(); draw(now());
    if (state.el >= CFG.hours * CFG.hour) end(true);
  }
  const RANKS = [[0, 'Trainee with a headset'], [80, 'Junior operator'], [180, 'Night-shift regular'], [320, 'Switchboard ace'], [500, 'Keeper of the world\'s clocks']];
  function end(full) {
    if (!state || !$('over').hidden) return;
    cancelAnimationFrame(raf);
    const b = Curio.best(`shift:${Curio.mode}`, state.score);
    const rank = RANKS.filter((r) => state.score >= r[0]).pop()[1];
    $('ovT').textContent = full ? `${state.score} points: ${rank}` : `Shift cut short: ${state.score} points`;
    $('ovR').innerHTML = [['Put through', state.ok], ['Woken up', state.woke], ['Turned away', state.turned], ['Hung up', state.hung], ['Best streak', state.best]].map(([a, v]) => `<div class="c-stat"><b>${v}</b><span>${a}</span></div>`).join('');
    $('ovB').textContent = `${b.isNew && state.score ? 'A new personal best! ' : `Best: ${b.best}. `}${state.log.length ? `Complaint log: ${state.log.slice(-2).join(' ')}` : 'Not a single complaint. The planet slept soundly.'}`;
    $('over').hidden = false; $('again').focus();
    if (full) { Curio.sfx && Curio.sfx('success'); if (state.strikes === 0) Curio.confetti(); } else Curio.sfx && Curio.sfx('error');
    paintBest();
  }
  $('go').addEventListener('click', start);
  $('again').addEventListener('click', start);
  $('share').addEventListener('click', async () => { try { await navigator.clipboard.writeText(`Hello, Operator on Zoble: ${state.score} points, ${state.ok} calls put through, ${state.woke} people woken up.`); Curio.toast('Report copied'); } catch { Curio.toast('Could not copy'); } });
  addEventListener('keydown', (e) => {
    if (!state || $('desk').hidden || !$('over').hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (/^[1-4]$/.test(k) && +k <= CFG.lines) { sel = +k - 1; renderBoard(); }
    const c = state.calls.find((x) => x.line === sel);
    if (!c) return;
    if (k === 'c' || k === 'enter') { e.preventDefault(); judge(c, 'connect'); }
    else if (k === 'x' || k === 'backspace') { e.preventDefault(); judge(c, 'decline'); }
  });
  document.addEventListener('visibilitychange', () => { last = 0; });
  window.HO = { start, get state() { return state; }, judge, localHM, now: () => now() };
})();
