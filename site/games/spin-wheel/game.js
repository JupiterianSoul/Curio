(() => {
  const $ = (id) => document.getElementById(id);
  const D = window.SW_DATA;
  const TH = Object.fromEntries(D.themes.map((t) => [t.id, t]));
  const STAGE = { classic: ['#fff3e6', '#ffd9c4'], gameshow: ['#4a0d1c', '#14040a', 1], pastel: ['#fff7fb', '#ece2ff'], neon: ['#1f0b36', '#05020d', 1], candy: ['#ffe8f1', '#ffc2d7'], ocean: ['#dff6ff', '#8fd3f4'], sunset: ['#ffe0bd', '#ff9a8b'], forest: ['#eef7e3', '#b5d99c'], mono: ['#f4f4f4', '#cfcfcf'], gold: ['#14523b', '#06170f', 1], rainbow: ['#ffffff', '#e3f1ff'], retro: ['#f8eedb', '#e9c46a'] };
  const TAU = Math.PI * 2, POINTER = -Math.PI / 2;
  const VER = 2, KEY = 'wheel-v2';
  const vib = (p) => { try { navigator.vibrate?.(p); } catch {} };
  const uid = () => Math.random().toString(36).slice(2, 9);

  function parseLine(line) {
    const m = line.match(/^(.*?)\s*[*x×]\s*(\d+(?:\.\d+)?)\s*$/);
    if (m && m[1].trim()) return { t: m[1].trim().slice(0, 60), w: Math.min(10, Math.max(0.1, +m[2])), h: 0 };
    return { t: line.trim().slice(0, 60), w: 1, h: 0 };
  }
  const fromList = (l) => l.map(parseLine).filter((e) => e.t);
  const newWheel = (name, list, theme = 'classic') => ({ id: uid(), name, theme, entries: fromList(list), hist: [], wins: {} });
  function load() {
    const raw = Curio.store.get(KEY, null);
    const base = { v: VER, wheels: [], cur: 0, mode: 'pick', dur: 'normal', snd: 'click', spins: 0, ach: {}, themesUsed: {}, presetsUsed: {}, teamsN: 2 };
    if (!raw || typeof raw !== 'object' || raw.v !== VER || !Array.isArray(raw.wheels) || !raw.wheels.length) {
      const old = Curio.store.get('wheel-entries', null);
      const list = typeof old === 'string' && old.trim() ? old.split('\n').filter((s) => s.trim()) : D.presets[2].l;
      base.wheels = [newWheel(typeof old === 'string' && old.trim() ? 'My wheel' : 'Dinner', list)];
      if (Curio.store.get('wheel-autoremove', false)) base.mode = 'elim';
      return base;
    }
    const s = { ...base, ...raw };
    s.wheels = raw.wheels.filter((w) => w && Array.isArray(w.entries)).map((w) => ({ id: w.id || uid(), name: String(w.name || 'Wheel').slice(0, 30), theme: TH[w.theme] ? w.theme : 'classic', entries: w.entries.filter((e) => e && typeof e.t === 'string').map((e) => ({ t: e.t.slice(0, 60), w: Math.min(10, Math.max(0.1, +e.w || 1)), h: e.h ? 1 : 0 })), hist: Array.isArray(w.hist) ? w.hist.slice(0, 40) : [], wins: w.wins && typeof w.wins === 'object' ? w.wins : {} }));
    if (!s.wheels.length) s.wheels = [newWheel('Dinner', D.presets[2].l)];
    s.cur = Math.min(s.wheels.length - 1, Math.max(0, +s.cur || 0));
    ['ach', 'themesUsed', 'presetsUsed'].forEach((k) => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
    if (!['pick', 'elim', 'bracket', 'teams'].includes(s.mode)) s.mode = 'pick';
    return s;
  }
  const S = load();
  let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set(KEY, S), 250); };
  const W = () => S.wheels[S.cur];
  const theme = () => TH[W().theme] || TH.classic;

  let override = null;
  const visible = () => override || W().entries.filter((e) => !e.h);
  function colorFor(list, i, th = theme()) {
    const e = list[i]; if (e && e.c) return e.c;
    const n = list.length, C = th.c; let c = C[i % C.length];
    if (n > 1 && i === n - 1 && C[i % C.length] === C[0] && n % C.length === 1) c = C[(i + 2) % C.length];
    return c;
  }
  function textOn(hex) { const v = parseInt(hex.slice(1), 16); const l = 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255); return l > 160 ? '#1d1b19' : '#fff'; }
  function shade(hex, k) { const v = parseInt(hex.slice(1), 16); const f = (x) => Math.max(0, Math.min(255, Math.round(x * k))); return `rgb(${f(v >> 16)},${f((v >> 8) & 255)},${f(v & 255)})`; }
  function slices(list) {
    const tot = list.reduce((a, e) => a + e.w, 0) || 1; let a = 0;
    return list.map((e) => { const s = { a0: a, a1: a + e.w / tot * TAU }; a = s.a1; return s; });
  }

  const cv = $('wheel'), g = cv.getContext('2d');
  let angle = Curio.store.get('wheel-angle', 0) || 0, vel = 0, spinning = false, dragging = null, Sz = 0, winIdx = -1, winT = 0, bulbT = 0;
  function resize() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    Sz = r.width; cv.width = cv.height = Math.max(10, Math.round(Sz * dpr)); g.setTransform(dpr, 0, 0, dpr, 0, 0); dirty = true;
  }
  const FONT = getComputedStyle(document.body).fontFamily;
  function drawWheel(c, size, ang, list, th, opts = {}) {
    const R = size / 2 - (opts.mini ? 1 : 10), C = size / 2;
    c.save(); c.clearRect(0, 0, size, size); c.translate(C, C);
    const rimW = opts.mini ? Math.max(1.5, size * 0.05) : Math.max(8, size * 0.035);
    if (th.gold) { const gr = c.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, '#f6e27a'); gr.addColorStop(0.5, '#8a6d1f'); gr.addColorStop(1, '#f6e27a'); c.fillStyle = gr; }
    else c.fillStyle = th.rim;
    c.beginPath(); c.arc(0, 0, R + (opts.mini ? 0 : 8), 0, TAU); c.fill();
    const r0 = R - (opts.mini ? 0 : rimW - 8);
    const n = list.length, sl = slices(list);
    c.save(); c.rotate(ang);
    if (!n) { c.beginPath(); c.arc(0, 0, r0, 0, TAU); c.fillStyle = '#ccc'; c.fill(); }
    list.forEach((e, i) => {
      const col = colorFor(list, i, th), s = sl[i];
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, r0, s.a0, s.a1); c.closePath();
      const gr = c.createRadialGradient(0, 0, r0 * 0.15, 0, 0, r0); gr.addColorStop(0, shade(col, 1.12)); gr.addColorStop(0.75, col); gr.addColorStop(1, shade(col, 0.8));
      c.fillStyle = gr; c.fill();
      if (th.glow && !opts.mini) { c.save(); c.shadowColor = col; c.shadowBlur = 14; c.strokeStyle = col; c.lineWidth = 2; c.stroke(); c.restore(); }
      c.strokeStyle = th.dark ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.6)'; c.lineWidth = opts.mini ? 0.6 : 2; c.stroke();
      if (i === winIdx && !opts.mini && winT > 0) { c.fillStyle = `rgba(255,255,255,${0.18 + 0.18 * Math.sin(performance.now() / 120)})`; c.fill(); }
      if (opts.mini) return;
      const span = s.a1 - s.a0;
      c.save(); c.rotate((s.a0 + s.a1) / 2);
      const fs = Math.max(9, Math.min(size / 20, r0 * span * 0.5, 30));
      c.font = `800 ${fs}px ${FONT}`; c.fillStyle = textOn(col); c.textAlign = 'right'; c.textBaseline = 'middle';
      if (th.glow) { c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 4; }
      let t = e.t; const maxW = r0 * 0.66;
      if (c.measureText(t).width > maxW) { while (c.measureText(t + '…').width > maxW && t.length > 1) t = t.slice(0, -1); t += '…'; }
      if (span > 0.06) c.fillText(t, r0 - 16, 0);
      c.restore();
    });
    const shine = c.createRadialGradient(-r0 * 0.3, -r0 * 0.4, r0 * 0.1, 0, 0, r0);
    shine.addColorStop(0, 'rgba(255,255,255,.18)'); shine.addColorStop(0.6, 'rgba(255,255,255,0)'); shine.addColorStop(1, 'rgba(0,0,0,.12)');
    c.restore();
    c.beginPath(); c.arc(0, 0, r0, 0, TAU); c.fillStyle = shine; c.fill();
    if (!opts.mini && n > 1) {
      c.save(); c.rotate(ang);
      sl.forEach((s) => { const a = s.a0; c.beginPath(); c.arc(Math.cos(a) * (r0 - 1), Math.sin(a) * (r0 - 1), Math.max(3, size / 105), 0, TAU); c.fillStyle = th.peg; c.fill(); c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.stroke(); });
      c.restore();
    }
    if (!opts.mini && th.bulbs) {
      const nb = 28;
      for (let i = 0; i < nb; i++) {
        const a = i / nb * TAU, x = Math.cos(a) * (R + 1), y = Math.sin(a) * (R + 1);
        const on = spinning ? (i + Math.floor(bulbT * 14)) % 3 === 0 : (i + Math.floor(bulbT * 1.5)) % 2 === 0;
        c.beginPath(); c.arc(x, y, Math.max(2.5, size / 120), 0, TAU);
        c.fillStyle = on ? '#fff6c2' : 'rgba(255,240,180,.35)';
        if (on) { c.shadowColor = '#ffd166'; c.shadowBlur = 10; } c.fill(); c.shadowBlur = 0;
      }
    }
    c.restore();
  }
  let dirty = true;
  function draw() { if (Sz) drawWheel(g, Sz, angle, visible(), theme()); }

  function indexAt(a, list = visible()) {
    const sl = slices(list); const rel = ((POINTER - a) % TAU + TAU) % TAU;
    for (let i = 0; i < sl.length; i++) if (rel >= sl[i].a0 && rel < sl[i].a1) return i;
    return sl.length - 1;
  }
  let flap = 0, flapV = 0;
  function tick(speed) {
    flapV -= Math.min(9, 2 + speed * 0.6);
    if (S.snd === 'off' || Curio.muted) return;
    if (S.snd === 'click') Curio.beep(1700 + Math.random() * 400, 0.016, 'square', Math.min(0.06, 0.018 + speed * 0.004));
    else Curio.beep([523, 587, 659, 784, 880][Math.floor(Math.random() * 5)] * 2, 0.08, 'sine', 0.05);
  }

  let onDone = null;
  function spin(power = 1, v0) {
    const list = visible();
    if (spinning || list.length < 2) { if (list.length < 2) { Curio.toast('Add at least two entries'); shakeWheel(); } return false; }
    spinning = true; winIdx = -1; $('wheelBox').classList.remove('win'); $('stage').classList.add('spinning');
    $('spin').disabled = true; $('spin').classList.remove('pulse'); $('result').textContent = '';
    vel = v0 ?? (11 + Math.random() * 7) * power;
    lastIdx = indexAt(angle);
    S.spins++; save();
    if (S.spins === 1) unlock('first'); if (S.spins >= 50) unlock('spins50');
    return true;
  }
  let lastIdx = 0;
  const FR = { short: 1.25, normal: 0.62, long: 0.36 };
  function physics(dt) {
    if (spinning) {
      const fr = FR[S.dur] || 0.62;
      vel -= (fr * vel + 0.42) * dt;
      if (vel <= 0.02) { vel = 0; finish(); }
      else {
        angle += vel * dt;
        const idx = indexAt(angle);
        if (idx !== lastIdx) { tick(vel); lastIdx = idx; }
      }
      dirty = true;
    }
    flapV += (-flap * 180 - flapV * 14) * dt; flap += flapV * dt; flap = Math.max(-0.8, Math.min(0.2, flap));
    $('pointer').style.transform = `rotate(${(flap * 57).toFixed(2)}deg)`;
  }
  function finish() {
    spinning = false; $('stage').classList.remove('spinning');
    angle = ((angle % TAU) + TAU) % TAU; Curio.store.set('wheel-angle', angle);
    const list = visible(), i = indexAt(angle), e = list[i];
    winIdx = i; winT = 4; $('wheelBox').classList.add('win');
    $('spin').disabled = false;
    const res = $('result'); res.textContent = `🎉 ${e.t}`; res.classList.remove('pop'); void res.offsetWidth; res.classList.add('pop');
    [660, 880, 1320].forEach((f, k) => setTimeout(() => Curio.beep(f, k === 2 ? 0.22 : 0.1, 'triangle', 0.11), k * 110));
    vib([20, 40, 30]);
    const cb = onDone; onDone = null;
    if (cb) { cb(e, i); return; }
    record(e);
    handleResult(e, i);
  }
  function record(e) {
    const w = W(); w.hist.unshift({ t: e.t, at: Date.now() }); if (w.hist.length > 40) w.hist.length = 40;
    w.wins[e.t] = (w.wins[e.t] || 0) + 1; save(); paintStats();
  }

  const undoStack = [];
  const snapW = () => JSON.stringify(W().entries);
  function pushUndo() { undoStack.push({ id: W().id, e: snapW() }); if (undoStack.length > 40) undoStack.shift(); }
  function undo() {
    const u = undoStack.pop(); if (!u) { Curio.toast('Nothing to undo'); return; }
    const w = S.wheels.find((x) => x.id === u.id); if (!w) return;
    w.entries = JSON.parse(u.e); if (W().id !== w.id) S.cur = S.wheels.indexOf(w);
    save(); paintAll(); Curio.toast('Undone'); Curio.beep(400, 0.05, 'triangle', 0.06);
  }

  async function handleResult(e) {
    if (S.mode === 'elim') {
      pushUndo(); const real = W().entries.find((x) => x === e) || W().entries.find((x) => !x.h && x.t === e.t); if (real) real.h = 1;
      const left = W().entries.filter((x) => !x.h);
      save(); paintList(); paintModeInfo(); dirty = true; winIdx = -1;
      if (left.length === 1) {
        unlock('elim'); Curio.confetti(160);
        const v = await Curio.modal({ emoji: '🏁', title: `${left[0].t} survives!`, body: winBody(left[0], 'The last one standing. Everyone else got spun out.'), buttons: [{ label: '↻ Reset and go again', value: 'reset' }, { label: '📋 Copy', value: 'copy' }, { label: 'Close', value: 'close' }] });
        if (v === 'reset') resetHidden(); if (v === 'copy') copy(`🏁 ${left[0].t} survived the elimination on Zoble's Spin the Wheel!`);
      } else Curio.toast(`${e.t} is out! ${left.length} left`);
      return;
    }
    if (S.mode === 'teams') { assignTeam(e); return; }
    Curio.confetti(110);
    const v = await Curio.modal({ emoji: '🎡', title: 'The wheel has spoken', body: winBody(e, Curio.pick(['Fate has chosen. No take-backs.', 'Congratulations (or condolences).', 'The wheel is never wrong.', 'Destiny, delivered.', 'Spun fair and square.', 'Take it up with the wheel.'])), buttons: [{ label: '↻ Spin again', value: 'again' }, { label: `Remove "${e.t.length > 14 ? e.t.slice(0, 13) + '…' : e.t}"`, value: 'remove' }, { label: '📋 Copy', value: 'copy' }, { label: 'Close', value: 'close' }] });
    if (v === 'remove') { pushUndo(); const real = W().entries.find((x) => !x.h && x.t === e.t); if (real) real.h = 1; save(); paintAll(); Curio.toast(`Removed ${e.t}. Ctrl+Z to undo`); }
    if (v === 'again') setTimeout(() => spin(), 150);
    if (v === 'copy') copy(`🎡 The wheel picked: ${e.t}`);
  }
  function winBody(e, msg) {
    const box = document.createElement('div'); box.className = 'sw-win';
    const list = visible(); const i = list.indexOf(e); const col = i >= 0 ? colorFor(list, i) : theme().c[0];
    const card = document.createElement('div'); card.className = 'sw-wincard'; card.style.setProperty('--c', col); card.style.setProperty('--t', textOn(col)); card.textContent = e.t;
    const p = document.createElement('div'); p.className = 'c-muted'; p.textContent = msg;
    box.append(card, p); return box;
  }
  async function copy(t) { try { await navigator.clipboard.writeText(t); Curio.toast('Copied!'); } catch { Curio.toast(t, 4000); } }
  function resetHidden() { pushUndo(); W().entries.forEach((e) => { e.h = 0; }); save(); paintAll(); }
  function shakeWheel() { $('wheelBox').animate([{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }], { duration: 300 }); vib(20); }

  let teams = null;
  const TEAMC = ['#ff5a36', '#1c9cf0', '#2ec27e', '#9b5de5', '#ffb400', '#f15bb5'];
  const TEAMN = ['Red', 'Blue', 'Green', 'Purple', 'Gold', 'Pink'];
  function startTeams() { teams = { n: S.teamsN, lists: Array.from({ length: S.teamsN }, () => []), next: 0, ids: [] }; paintTeams(); }
  function assignTeam(e) {
    if (!teams) startTeams();
    pushUndo(); const real = W().entries.find((x) => !x.h && x.t === e.t); if (real) { real.h = 1; teams.ids.push(real); }
    teams.lists[teams.next].push(e.t); teams.next = (teams.next + 1) % teams.n;
    save(); paintAll(); paintTeams();
    const left = W().entries.filter((x) => !x.h).length;
    if (left === 0 || (left === 1 && W().entries.length > 1)) {
      if (left === 1) { const last = W().entries.find((x) => !x.h); last.h = 1; teams.ids.push(last); teams.lists[teams.next].push(last.t); }
      unlock('teams'); Curio.confetti(100); paintTeams(); paintAll(); Curio.toast('Teams are set!');
    } else Curio.toast(`${e.t} joins Team ${TEAMN[(teams.next + teams.n - 1) % teams.n]}`);
  }
  function dealAll() {
    if (spinning) return;
    resetHidden(); startTeams();
    const order = Curio.shuffle(W().entries.slice());
    order.forEach((e, i) => setTimeout(() => { e.h = 1; teams.ids.push(e); teams.lists[i % teams.n].push(e.t); paintTeams(); paintList(); dirty = true; Curio.beep(600 + (i % teams.n) * 120, 0.05, 'triangle', 0.06); if (i === order.length - 1) { unlock('teams'); Curio.confetti(90); save(); } }, i * 140));
  }
  function paintTeams() {
    const box = $('teamsBox'); box.hidden = S.mode !== 'teams';
    if (S.mode !== 'teams') return;
    const gridEl = $('teamGrid'); gridEl.innerHTML = '';
    const lists = teams ? teams.lists : Array.from({ length: S.teamsN }, () => []);
    lists.forEach((l, i) => {
      const d = document.createElement('div'); d.className = 'sw-team'; d.style.setProperty('--c', TEAMC[i]);
      d.innerHTML = '<h4><i></i><span></span></h4><ul></ul>'; d.querySelector('span').textContent = `Team ${TEAMN[i]} (${l.length})`;
      l.forEach((t) => { const li = document.createElement('li'); li.textContent = t; d.querySelector('ul').append(li); });
      gridEl.append(d);
    });
    $('tInfo').textContent = 'Each spin sends the winner to the next team.';
  }

  let bracket = null;
  function startBracket() {
    const list = Curio.shuffle(W().entries.filter((e) => !e.h).map((e) => ({ t: e.t, w: e.w })));
    if (list.length < 2) { Curio.toast('Need at least two entries for a tournament'); setMode('pick'); return; }
    let size = 1; while (size < list.length) size *= 2;
    const r0 = []; for (let i = 0; i < size / 2; i++) r0.push({ a: list[i] || null, b: list[size - 1 - i] || null, w: null });
    const rounds = [r0]; let n = size / 4; while (n >= 1) { rounds.push(Array.from({ length: n }, () => ({ a: null, b: null, w: null }))); n /= 2; }
    bracket = { rounds, champ: null };
    advanceByes(); paintBracket(); nextMatch();
  }
  function advanceByes() {
    bracket.rounds.forEach((rd, r) => rd.forEach((m, i) => {
      if (m.w) return;
      if (r === 0 && m.a && !m.b) setWinner(r, i, m.a);
      else if (r === 0 && !m.a && m.b) setWinner(r, i, m.b);
    }));
  }
  function setWinner(r, i, e) {
    const m = bracket.rounds[r][i]; m.w = e;
    if (r + 1 < bracket.rounds.length) { const nm = bracket.rounds[r + 1][Math.floor(i / 2)]; if (i % 2) nm.b = e; else nm.a = e; }
    else bracket.champ = e;
  }
  function currentMatch() {
    for (let r = 0; r < bracket.rounds.length; r++) for (let i = 0; i < bracket.rounds[r].length; i++) { const m = bracket.rounds[r][i]; if (!m.w && m.a && m.b) return { r, i, m }; }
    return null;
  }
  function nextMatch() {
    if (!bracket) return;
    const cm = currentMatch();
    if (!cm) { override = null; dirty = true; if (bracket.champ) crown(); return; }
    override = [cm.m.a, cm.m.b]; winIdx = -1; dirty = true;
    $('result').textContent = `${cm.m.a.t} vs ${cm.m.b.t}`;
    paintBracket(); paintModeInfo();
    $('spin').classList.add('pulse');
  }
  function bracketSpin() {
    const cm = currentMatch(); if (!cm) return;
    onDone = (e) => {
      setWinner(cm.r, cm.i, e); paintBracket();
      Curio.toast(`${e.t} advances!`);
      setTimeout(nextMatch, 900);
    };
    if (!spin()) onDone = null;
  }
  async function crown() {
    const e = bracket.champ; paintBracket(); unlock('bracket'); Curio.confetti(200);
    const w = W(); w.hist.unshift({ t: `🏆 ${e.t}`, at: Date.now() }); w.wins[e.t] = (w.wins[e.t] || 0) + 1; save(); paintStats();
    const v = await Curio.modal({ emoji: '🏆', title: 'Champion!', body: winBody(e, `Won ${bracket.rounds.length} round${bracket.rounds.length > 1 ? 's' : ''} of pure luck.`), buttons: [{ label: '↻ New tournament', value: 'again' }, { label: '📋 Copy', value: 'copy' }, { label: 'Close', value: 'close' }] });
    if (v === 'again') startBracket();
    if (v === 'copy') copy(`🏆 ${e.t} won the ${W().name} tournament on Zoble's Spin the Wheel!`);
  }
  function roundName(r, n) { const left = n - r; return left === 1 ? 'Final' : left === 2 ? 'Semi-finals' : left === 3 ? 'Quarter-finals' : `Round ${r + 1}`; }
  function paintBracket() {
    const box = $('bracket'); box.hidden = S.mode !== 'bracket' || !bracket;
    if (box.hidden) return;
    const tree = $('btree'); tree.innerHTML = '';
    const cm = currentMatch(), N = bracket.rounds.length;
    const all = W().entries;
    const colOf = (e) => { const i = all.findIndex((x) => x.t === e.t); return colorFor(all, Math.max(0, i)); };
    bracket.rounds.forEach((rd, r) => {
      const col = document.createElement('div'); col.className = 'sw-round';
      const h = document.createElement('h4'); h.textContent = roundName(r, N); col.append(h);
      rd.forEach((m, i) => {
        const d = document.createElement('div'); d.className = 'sw-match' + (cm && cm.r === r && cm.i === i ? ' now' : '');
        [m.a, m.b].forEach((e) => {
          const row = document.createElement('div');
          if (!e) { row.className = 'tbd'; row.textContent = r === 0 ? 'bye' : 'TBD'; }
          else { row.innerHTML = '<i></i><span></span>'; row.querySelector('i').style.background = colOf(e); row.querySelector('span').textContent = e.t; if (m.w) row.className = m.w === e ? 'w' : 'l'; }
          d.append(row);
        });
        col.append(d);
      });
      tree.append(col);
    });
    const ch = document.createElement('div'); ch.className = 'sw-champ'; ch.innerHTML = '<b>🏆</b><span></span>'; ch.querySelector('span').textContent = bracket.champ ? bracket.champ.t : '?'; tree.append(ch);
    const played = bracket.rounds.flat().filter((m) => m.w && m.a && m.b).length, total = bracket.rounds.flat().filter((m) => !(m.w && (!m.a || !m.b))).length;
    $('bInfo').textContent = bracket.champ ? 'Tournament complete' : `${played} of ${total} matches played`;
    if (cm) setTimeout(() => { const m = tree.querySelector('.sw-match.now'), sc = tree.parentElement; if (m) sc.scrollTo({ left: m.getBoundingClientRect().left - sc.getBoundingClientRect().left + sc.scrollLeft - sc.clientWidth / 2 + m.offsetWidth / 2, behavior: 'smooth' }); }, 50);
  }
  $('bQuit').addEventListener('click', () => setMode('pick'));

  async function comboSpin() {
    if (spinning || S.wheels.length < 2) return;
    const start = S.cur, results = [];
    unlock('combo');
    for (let k = 0; k < S.wheels.length; k++) {
      selectWheel(k, true);
      if (visible().length < 2) { results.push([W().name, visible()[0]?.t || '(nothing left to spin)']); continue; }
      const e = await new Promise((res) => { onDone = (x) => res(x); if (!spin(1, 14 + Math.random() * 6)) { onDone = null; res(null); } });
      if (e) { record(e); results.push([W().name, e.t]); }
      await new Promise((r) => setTimeout(r, 700));
    }
    selectWheel(start, true); $('result').textContent = '🧩 Combo complete';
    Curio.confetti(150);
    const box = document.createElement('div'); box.className = 'sw-combo';
    results.forEach(([n, t]) => { const d = document.createElement('div'); d.innerHTML = '<span></span><b></b>'; d.querySelector('span').textContent = n; d.querySelector('b').textContent = t; box.append(d); });
    const v = await Curio.modal({ emoji: '🧩', title: 'Combo result', body: box, buttons: [{ label: '↻ Spin all again', value: 'again' }, { label: '📋 Copy', value: 'copy' }, { label: 'Close', value: 'close' }] });
    if (v === 'again') comboSpin();
    if (v === 'copy') copy('🧩 ' + results.map(([n, t]) => `${n}: ${t}`).join(' · '));
  }

  function setMode(m) {
    if (spinning) return;
    S.mode = m; save();
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === m)));
    override = null; bracket = null; onDone = null; dirty = true; winIdx = -1;
    $('spin').classList.remove('pulse'); $('result').textContent = '';
    if (m === 'bracket') startBracket();
    if (m === 'teams') { teams = null; paintTeams(); }
    paintBracket(); paintTeams(); paintModeInfo();
  }
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => { setMode(b.dataset.mode); Curio.beep(560, 0.05, 'sine', 0.05); }));
  function paintModeInfo() {
    const box = $('modeInfo'); box.innerHTML = '';
    const left = W().entries.filter((e) => !e.h).length, hidden = W().entries.length - left;
    const btn = (label, fn, ghost) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'c-btn' + (ghost ? ' c-btn--ghost' : ''); b.textContent = label; b.addEventListener('click', fn); box.append(b); return b; };
    const txt = (t) => { const s = document.createElement('span'); s.textContent = t; box.append(s); };
    if (S.mode === 'elim') { txt(`${left} still in${hidden ? `, ${hidden} out` : ''}. Each spin knocks one out.`); if (hidden) btn('↻ Bring everyone back', resetHidden, true); }
    else if (S.mode === 'bracket') { if (bracket && !bracket.champ) txt('Spin to settle each match.'); btn('🔀 New draw', startBracket, true); }
    else if (S.mode === 'teams') {
      txt('Teams:');
      const st = document.createElement('span'); st.className = 'sw-stepper';
      st.innerHTML = '<button type="button" aria-label="Fewer teams">−</button><b></b><button type="button" aria-label="More teams">+</button>';
      st.querySelector('b').textContent = S.teamsN;
      const [m, p] = st.querySelectorAll('button');
      m.addEventListener('click', () => { S.teamsN = Math.max(2, S.teamsN - 1); teams = null; save(); paintModeInfo(); paintTeams(); });
      p.addEventListener('click', () => { S.teamsN = Math.min(6, S.teamsN + 1); teams = null; save(); paintModeInfo(); paintTeams(); });
      box.append(st);
      btn('⚡ Deal everyone', dealAll);
      if (hidden) btn('↻ Reset', () => { resetHidden(); teams = null; paintTeams(); }, true);
    } else if (hidden) { txt(`${hidden} hidden`); btn('↻ Show all', resetHidden, true); }
  }

  $('spin').addEventListener('click', () => { if (S.mode === 'bracket' && bracket) bracketSpin(); else spin(); });
  const angAt = (e) => { const r = cv.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)); };
  const startDrag = (e) => {
    if (spinning) return;
    e.event?.preventDefault();
    dragging = { a: angAt(e), start: angle, x: e.clientX, y: e.clientY, samples: [{ t: performance.now(), a: angle }] };
  };
  const moveDrag = (e) => {
    if (!dragging) return;
    let d = angAt(e) - dragging.a; d = Math.atan2(Math.sin(d), Math.cos(d));
    dragging.a = angAt(e); angle += d; dirty = true;
    const now = performance.now(); dragging.samples.push({ t: now, a: angle }); dragging.samples = dragging.samples.filter((s) => now - s.t < 120);
    const idx = indexAt(angle); if (idx !== lastIdx) { tick(Math.abs(d) * 30); lastIdx = idx; }
  };
  const endDrag = (e) => {
    if (!dragging) return;
    if (!e) { dragging = null; return; }
    const dr = dragging; dragging = null;
    const moved = Math.hypot(e.clientX - dr.x, e.clientY - dr.y);
    const s = dr.samples, first = s[0], last = s[s.length - 1], dt = (last.t - first.t) / 1000;
    const stale = !Curio.touchpad && performance.now() - last.t > 160;
    const v = dt > 0.01 && !stale ? (last.a - first.a) / dt : 0;
    if (moved < 8) { $('spin').click(); return; }
    const tp = Curio.touchpad && e.pointerType === 'mouse', wound = Math.abs(last.a - dr.start);
    if (tp ? wound > 0.3 : Math.abs(v) > 2.5) {
      if (Math.abs(v) > 22) unlock('flick');
      const vv = Math.min(40, tp ? Math.max(10, wound * 6) : Math.abs(v));
      if (S.mode === 'bracket' && bracket) { const cm = currentMatch(); if (cm) { onDone = (x) => { setWinner(cm.r, cm.i, x); paintBracket(); Curio.toast(`${x.t} advances!`); setTimeout(nextMatch, 900); }; if (!spin(1, vv)) onDone = null; } }
      else spin(1, vv);
      if (v < 0 && spinning) vel = vv;
    } else Curio.toast('Give it a harder flick!', 1200);
  };
  Curio.drag(cv, { start: startDrag, move: moveDrag, end: endDrag });
  addEventListener('curio:touchpad', (ev) => { if (ev.detail) Curio.toast('Touchpad mode: click the wheel to grab it, swipe to wind it up, click again to let go. Or press Space', 4000); });

  function selectWheel(i, quiet) {
    if (spinning && !quiet) return;
    S.cur = i; override = null; winIdx = -1; bracket = null; teams = null; save();
    paintAll();
    if (!quiet && S.mode === 'bracket') startBracket();
  }
  function paintWheels() {
    const nav = $('wheels'); nav.innerHTML = '';
    S.wheels.forEach((w, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'sw-wtab'; b.setAttribute('aria-selected', String(i === S.cur)); b.title = `${w.name} (${i + 1})`;
      const mc = document.createElement('canvas'); mc.width = mc.height = 44; drawWheel(mc.getContext('2d'), 44, 0.4, w.entries.filter((e) => !e.h), TH[w.theme] || TH.classic, { mini: true });
      const sp = document.createElement('span'); sp.textContent = w.name;
      b.append(mc, sp); b.addEventListener('click', () => { selectWheel(i); Curio.beep(520 + i * 60, 0.04, 'sine', 0.05); });
      nav.append(b);
    });
    if (S.wheels.length < 6) {
      const add = document.createElement('button'); add.type = 'button'; add.className = 'sw-wtab sw-wtab--add'; add.textContent = '+ New wheel';
      add.addEventListener('click', () => { S.wheels.push(newWheel(`Wheel ${S.wheels.length + 1}`, ['Option 1', 'Option 2', 'Option 3'], D.themes[S.wheels.length % D.themes.length].id)); if (S.wheels.length >= 3) unlock('wheels'); selectWheel(S.wheels.length - 1); $('addInput').focus(); });
      nav.append(add);
    }
    if (S.wheels.length >= 2) {
      const cb = document.createElement('button'); cb.type = 'button'; cb.className = 'sw-wtab sw-wtab--combo'; cb.textContent = '🧩 Spin all wheels';
      cb.addEventListener('click', comboSpin); nav.append(cb);
    }
  }

  function paintList() {
    const list = $('list'); list.innerHTML = '';
    const all = W().entries, vis = all.filter((e) => !e.h), tot = vis.reduce((a, e) => a + e.w, 0) || 1;
    $('count').textContent = `${vis.length} on the wheel${all.length - vis.length ? ` · ${all.length - vis.length} hidden` : ''}`;
    all.forEach((e, i) => {
      const li = document.createElement('li'); li.className = 'sw-item' + (e.h ? ' off' : '');
      const vi = vis.indexOf(e);
      li.innerHTML = `<span class="sw-dot"></span><input class="sw-itext" maxlength="60"><span class="sw-w"><button type="button" aria-label="Less weight">−</button><b></b><button type="button" aria-label="More weight">+</button><small></small></span><button class="sw-ib" type="button" data-a="hide"></button><button class="sw-ib" type="button" data-a="del" aria-label="Delete">✕</button>`;
      li.querySelector('.sw-dot').style.background = vi >= 0 ? colorFor(vis, vi) : 'var(--line)';
      const inp = li.querySelector('.sw-itext'); inp.value = e.t; inp.setAttribute('aria-label', `Entry ${i + 1}`);
      inp.addEventListener('change', () => { const t = inp.value.trim(); if (!t) { pushUndo(); all.splice(i, 1); } else e.t = t.slice(0, 60); save(); paintAll(); });
      li.querySelector('b').textContent = e.w % 1 ? e.w.toFixed(1) : e.w;
      li.querySelector('small').textContent = e.h ? '-' : `${Math.round(e.w / tot * 100)}%`;
      const [mi, pl] = li.querySelectorAll('.sw-w button');
      mi.addEventListener('click', () => { e.w = e.w > 1 ? e.w - 1 : Math.max(0.5, e.w - 0.5); save(); paintAll(); });
      pl.addEventListener('click', () => { e.w = e.w < 1 ? 1 : Math.min(10, e.w + 1); if (e.w > 1) unlock('weight'); save(); paintAll(); });
      const hb = li.querySelector('[data-a="hide"]'); hb.textContent = e.h ? '👁' : '🙈'; hb.setAttribute('aria-label', e.h ? 'Show on wheel' : 'Hide from wheel');
      hb.addEventListener('click', () => { pushUndo(); e.h = e.h ? 0 : 1; save(); paintAll(); });
      li.querySelector('[data-a="del"]').addEventListener('click', () => { pushUndo(); all.splice(i, 1); save(); paintAll(); Curio.beep(260, 0.05, 'sine', 0.05); });
      list.append(li);
    });
    if (!all.length) { const li = document.createElement('li'); li.className = 'sw-empty'; li.textContent = 'No entries yet. Add some above or pick a preset.'; list.append(li); }
  }
  $('addForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('addInput').value.trim(); if (!v) return;
    if (W().entries.length >= 100) { Curio.toast('That is plenty (100 max)'); return; }
    v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).forEach((s) => W().entries.push(parseLine(s)));
    $('addInput').value = ''; save(); paintAll(); Curio.beep(720, 0.04, 'sine', 0.05);
    $('list').scrollTop = $('list').scrollHeight;
  });
  let bulkOn = false;
  $('bulkBtn').addEventListener('click', () => {
    bulkOn = !bulkOn;
    if (bulkOn) { $('bulk').value = W().entries.filter((e) => !e.h).map((e) => e.w !== 1 ? `${e.t} *${e.w}` : e.t).join('\n'); }
    else { pushUndo(); W().entries = fromList($('bulk').value.split('\n')).slice(0, 100); save(); paintAll(); }
    $('bulk').hidden = !bulkOn; $('list').hidden = bulkOn; $('bulkBtn').textContent = bulkOn ? '✓ Done editing' : '📝 Edit as text';
  });
  $('shuffle').addEventListener('click', () => { if (spinning) return; W().entries = Curio.shuffle(W().entries); save(); paintAll(); Curio.beep(640, 0.04, 'sine', 0.05); });
  $('sort').addEventListener('click', () => { if (spinning) return; W().entries.sort((a, b) => a.t.localeCompare(b.t, undefined, { numeric: true })); save(); paintAll(); });
  $('unhide').addEventListener('click', resetHidden);
  $('clearAll').addEventListener('click', () => { if (spinning) return; pushUndo(); W().entries = []; save(); paintAll(); Curio.toast('Cleared. Ctrl+Z to undo'); });
  $('wname').addEventListener('input', () => { W().name = $('wname').value.slice(0, 30) || 'Wheel'; save(); paintWheels(); });
  $('dupWheel').addEventListener('click', () => { if (S.wheels.length >= 6) { Curio.toast('Six wheels max'); return; } const w = JSON.parse(JSON.stringify(W())); w.id = uid(); w.name = (w.name + ' copy').slice(0, 30); w.hist = []; w.wins = {}; S.wheels.push(w); if (S.wheels.length >= 3) unlock('wheels'); selectWheel(S.wheels.length - 1); });
  $('delWheel').addEventListener('click', async () => {
    if (S.wheels.length < 2) { Curio.toast('You need at least one wheel'); return; }
    const v = await Curio.modal({ emoji: '🗑', title: `Delete "${W().name}"?`, body: 'This wheel and its history will be gone for good.', buttons: [{ label: 'Delete', value: 'y' }, { label: 'Keep it', value: 'n' }] });
    if (v !== 'y') return; S.wheels.splice(S.cur, 1); selectWheel(Math.max(0, S.cur - 1));
  });
  D.presets.forEach((p) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = `${p.e} ${p.n}`;
    b.addEventListener('click', () => { if (spinning) return; pushUndo(); W().entries = fromList(p.l); if (/^(Wheel \d+|Option.*|My wheel)$/.test(W().name) || D.presets.some((x) => x.n === W().name)) W().name = p.n; S.presetsUsed[p.n] = 1; if (Object.keys(S.presetsUsed).length >= 10) unlock('presets'); if (S.mode === 'bracket') startBracket(); save(); paintAll(); Curio.beep(700, 0.04, 'sine', 0.06); });
    $('presets').append(b);
  });
  D.combos.forEach((cmb) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = `🧩 ${cmb.n}`;
    b.addEventListener('click', () => {
      if (spinning) return;
      const room = 6 - S.wheels.length; if (room < cmb.w.length) { Curio.toast(`Delete ${cmb.w.length - room} wheel${cmb.w.length - room > 1 ? 's' : ''} first (six max)`); return; }
      cmb.w.forEach((w, i) => S.wheels.push(newWheel(w.n, w.l, D.themes[(i + 3) % D.themes.length].id)));
      if (S.wheels.length >= 3) unlock('wheels');
      selectWheel(S.wheels.length - cmb.w.length); Curio.toast(`${cmb.n}: ${cmb.w.length} wheels added. Try 🧩 Spin all wheels!`, 2600);
    });
    $('combos').append(b);
  });

  const themeEls = [];
  D.themes.forEach((t) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'sw-theme'; b.dataset.t = t.id;
    const mc = document.createElement('canvas'); mc.width = mc.height = 108; drawWheel(mc.getContext('2d'), 108, 0.3, t.c.map((c, i) => ({ t: String(i), w: 1 })), t, { mini: true });
    const sp = document.createElement('span'); sp.textContent = t.name;
    b.append(mc, sp); b.addEventListener('click', () => { setTheme(t.id); Curio.beep(600, 0.05, 'triangle', 0.06); });
    $('themes').append(b); themeEls.push(b);
  });
  function setTheme(id) { W().theme = id; S.themesUsed[id] = 1; if (Object.keys(S.themesUsed).length >= 5) unlock('themes'); save(); paintTheme(); paintWheels(); paintList(); dirty = true; }
  function paintTheme() {
    const t = theme(), st = STAGE[t.id] || STAGE.classic, dark = Curio.isDark();
    themeEls.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === t.id)));
    const stage = $('stage');
    const mixd = (c) => dark && !st[2] ? `color-mix(in srgb, ${c} 28%, #15110f)` : c;
    stage.style.setProperty('--bg1', mixd(st[0])); stage.style.setProperty('--bg2', mixd(st[1]));
    stage.classList.toggle('dark', !!st[2] || dark);
    $('ptrBody').setAttribute('fill', t.ptr);
    $('wheelBox').style.setProperty('--ptr', t.ptr);
    $('spin').style.setProperty('--hubring', t.gold ? '#c9a227' : t.rim);
  }
  function segBind(id, key) {
    const box = $(id), paint = () => box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S[key])));
    box.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S[key] = b.dataset.v; paint(); save(); if (key === 'snd') tick(3); }));
    paint();
  }
  segBind('dur', 'dur'); segBind('snd', 'snd');

  function ago(t) { const s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)} min ago` : s < 86400 ? `${Math.floor(s / 3600)} h ago` : `${Math.floor(s / 86400)} d ago`; }
  function paintStats() {
    const w = W(), wins = w.wins, totalW = Object.values(wins).reduce((a, b) => a + b, 0);
    const row = $('statRow'); row.innerHTML = '';
    const top = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
    [[S.spins, 'All spins'], [totalW, 'This wheel'], [top ? top[0] : '-', 'Luckiest']].forEach(([b, s]) => { const d = document.createElement('div'); d.innerHTML = '<b></b><span></span>'; d.querySelector('b').textContent = b; if (String(b).length > 8) d.querySelector('b').style.fontSize = '14px'; d.querySelector('span').textContent = s; row.append(d); });
    const fr = $('freq'); fr.innerHTML = '';
    const all = w.entries, max = Math.max(1, ...all.map((e) => wins[e.t] || 0));
    if (!totalW) { const e = document.createElement('div'); e.className = 'sw-empty'; e.textContent = 'Spin a few times to see who the wheel favours.'; fr.append(e); }
    else all.forEach((e, i) => { const d = document.createElement('div'); d.className = 'sw-fr'; d.style.setProperty('--c', colorFor(all, i)); d.innerHTML = '<span></span><i></i><b></b>'; d.querySelector('span').textContent = e.t; d.querySelector('i').style.width = `${(wins[e.t] || 0) / max * 100}%`; d.querySelector('b').textContent = wins[e.t] || 0; fr.append(d); });
    const h = $('hist'); h.innerHTML = '';
    if (!w.hist.length) { const li = document.createElement('li'); li.className = 'sw-empty'; li.textContent = 'Nobody yet.'; h.append(li); }
    w.hist.slice(0, 20).forEach((x) => { const li = document.createElement('li'); li.textContent = x.t; const sm = document.createElement('small'); sm.textContent = ago(x.at); li.append(sm); h.append(li); });
  }
  function paintAch() {
    const box = $('ach'); box.innerHTML = ''; let got = 0;
    D.ach.forEach((a) => { const d = document.createElement('div'); d.className = 'sw-badge' + (S.ach[a.id] ? ' got' : ''); if (S.ach[a.id]) got++; d.innerHTML = '<i></i><div><b></b><span></span></div>'; d.querySelector('i').textContent = a.i; d.querySelector('b').textContent = a.n; d.querySelector('span').textContent = a.d; box.append(d); });
    $('achCount').textContent = `${got}/${D.ach.length}`;
  }
  const unlockQ = []; let unlockBusy = false;
  function unlock(id) { if (S.ach[id]) return; const a = D.ach.find((x) => x.id === id); if (!a) return; S.ach[id] = Date.now(); save(); paintAch(); unlockQ.push(a); if (!unlockBusy) nextUnlock(); }
  function nextUnlock() {
    const a = unlockQ.shift(); if (!a) { unlockBusy = false; return; }
    unlockBusy = true;
    const el = document.createElement('div'); el.className = 'sw-unlock'; el.setAttribute('role', 'status'); el.innerHTML = '<i></i><div><span></span><small></small></div>';
    el.querySelector('i').textContent = a.i; el.querySelector('span').textContent = a.n; el.querySelector('small').textContent = a.d;
    document.body.append(el); setTimeout(() => { el.remove(); nextUnlock(); }, 3100);
    [880, 1175, 1568].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.05), 200 + i * 80));
  }

  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = p.dataset.pane !== b.dataset.tab; });
    if (b.dataset.tab === 'stats') paintStats();
  }));

  const b64e = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  const shareBtn = document.createElement('button'); shareBtn.type = 'button'; shareBtn.className = 'sw-chip'; shareBtn.textContent = '🔗 Share wheel';
  shareBtn.addEventListener('click', () => {
    const w = W(); const code = b64e(JSON.stringify({ n: w.name, t: w.theme, e: w.entries.filter((e) => !e.h).map((e) => e.w !== 1 ? [e.t, e.w] : [e.t]) }));
    const url = location.href.split('#')[0] + '#w=' + code; history.replaceState(null, '', url); unlock('share'); copy(url);
  });
  $('clearAll').before(shareBtn);
  function loadShared() {
    const h = location.hash.replace(/^#/, ''); if (!h.startsWith('w=')) return;
    try {
      const o = JSON.parse(b64d(h.slice(2)));
      if (!Array.isArray(o.e) || !o.e.length) return;
      const w = { id: uid(), name: String(o.n || 'Shared wheel').slice(0, 30), theme: TH[o.t] ? o.t : 'classic', entries: o.e.slice(0, 100).map((x) => ({ t: String(x[0]).slice(0, 60), w: Math.min(10, Math.max(0.1, +x[1] || 1)), h: 0 })), hist: [], wins: {} };
      const same = S.wheels.findIndex((x) => x.name === w.name && JSON.stringify(x.entries.map((e) => e.t)) === JSON.stringify(w.entries.map((e) => e.t)));
      if (same >= 0) { S.cur = same; return; }
      if (S.wheels.length >= 6) S.wheels.shift();
      S.wheels.push(w); S.cur = S.wheels.length - 1; save();
      Curio.toast(`Loaded shared wheel "${w.name}"`, 2400);
    } catch {}
  }

  function paintAll() {
    $('wname').value = W().name;
    paintWheels(); paintList(); paintTheme(); paintModeInfo(); paintStats(); paintBracket(); paintTeams();
    $('spin').disabled = spinning || visible().length < 2;
    dirty = true;
  }

  addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); undo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if ((e.key === ' ' || e.key === 'Enter') && (e.target === document.body || e.target === cv)) { e.preventDefault(); $('spin').click(); return; }
    if (/^[1-6]$/.test(k) && +k <= S.wheels.length) { selectWheel(+k - 1); return; }
    if (k === 't') { const i = D.themes.findIndex((t) => t.id === W().theme); setTheme(D.themes[(i + 1) % D.themes.length].id); Curio.toast(`🎨 ${theme().name}`, 900); }
  });

  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (!document.hidden) {
      physics(dt);
      bulbT += dt; if (theme().bulbs) dirty = true;
      if (winT > 0) { winT -= dt; dirty = true; if (winT <= 0) $('wheelBox').classList.remove('win'); }
      if (dirty) { draw(); dirty = false; }
    }
    requestAnimationFrame(loop);
  }
  addEventListener('resize', resize);
  addEventListener('curio:theme', () => { paintTheme(); dirty = true; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && spinning) { angle += vel * 0.4; vel = 0.01; } });

  loadShared();
  S.themesUsed[W().theme] = 1;
  document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === S.mode)));
  paintAll(); paintAch(); resize();
  if (S.mode === 'bracket') startBracket();
  if (S.mode === 'teams') paintTeams();
  $('spin').classList.add('pulse');
  if (!Curio.touchpad && !Curio.store.get('tp-hint-spin-wheel', false)) { Curio.store.set('tp-hint-spin-wheel', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar, or just press Space to spin', 3600), 1800); }
  requestAnimationFrame(loop);
})();
