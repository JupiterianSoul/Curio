'use strict';
(() => {
  const C = window.Curio;
  const $ = (id) => document.getElementById(id);
  const EX = window.COUNTRY_EXTRA || {}, SH = window.COUNTRY_SHAPES || {}, CE = window.COUNTRY_CENTERS || {}, FS = window.FLAG_SVGS || {};
  const ALL = window.COUNTRIES.map((c) => {
    const e = EX[c.code] || ['', '', '', 0, ''];
    return { ...c, currency: e[0], langs: e[1], borders: e[2] ? e[2].split(' ') : [], landlocked: !!e[3], demonym: e[4], shape: SH[c.code] || null, center: CE[c.code] || null };
  });
  const BY = Object.fromEntries(ALL.map((c) => [c.code, c]));
  const CONT = { EU: 'Europe', AS: 'Asia', AF: 'Africa', NA: 'North America', SA: 'South America', OC: 'Oceania' };
  const REGIONS = [['world', 'World'], ['EU', 'Europe'], ['AS', 'Asia'], ['AF', 'Africa'], ['NA', 'N. America'], ['SA', 'S. America'], ['OC', 'Oceania']];
  const MODES = {
    flags: { name: 'Flags', desc: 'Name the country', info: 'See a flag, pick the country. The classic.' },
    reverse: { name: 'Reverse', desc: 'Pick the flag', info: 'We name a country, you spot its flag among four.' },
    shapes: { name: 'Shapes', desc: 'Country outlines', info: 'Identify countries from their outline alone. Islands included.' },
    capitals: { name: 'Capitals', desc: 'Name the capital', info: 'Pick the capital city of each country.' },
    neighbours: { name: 'Neighbours', desc: 'Who borders who?', info: 'Which of these countries shares a land border with the one shown?' },
    type: { name: 'Type it', desc: 'No options', info: 'Type the country name for each flag. Close spelling counts.' },
    blitz: { name: 'Blitz', desc: '60 seconds', info: 'As many flags as you can in 60 seconds. Wrong answers cost 3 seconds.' },
    daily: { name: 'Daily', desc: 'Same for everyone', info: 'Ten mixed questions, the same for everyone today. Share your grid!' }
  };
  const DIFFS = [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Lookalikes']];
  const ALIASES = {
    US: ['usa', 'us', 'united states of america', 'america'], GB: ['uk', 'britain', 'great britain', 'england'], CI: ['cote divoire'], CD: ['drc', 'democratic republic of the congo', 'congo kinshasa', 'zaire'],
    CG: ['congo', 'congo brazzaville', 'republic of congo'], CZ: ['czech republic'], MM: ['burma'], SZ: ['swaziland'], MK: ['macedonia'], TL: ['east timor'], CV: ['cabo verde'],
    KR: ['korea', 'republic of korea'], KP: ['dprk'], VA: ['vatican', 'holy see'], NL: ['holland'], AE: ['uae', 'emirates'], BA: ['bosnia'], TR: ['turkiye'], LA: ['lao'],
    VC: ['st vincent', 'saint vincent'], KN: ['st kitts', 'saint kitts'], LC: ['st lucia'], ST: ['sao tome'], TT: ['trinidad'], AG: ['antigua'], FM: ['federated states of micronesia'],
    PG: ['png'], CF: ['car'], DO: ['dominican rep'], VN: ['viet nam'], RU: ['russian federation'], SY: ['syrian arab republic'], IR: ['persia'], GQ: ['eq guinea'], GW: ['guinea bissau'], BS: ['the bahamas'], GM: ['the gambia']
  };
  const BADGES = [
    { id: 'first', name: 'First Flag', desc: 'Answer your first question right.', f: 'NP' },
    { id: 'perfect', name: 'Flawless', desc: 'Get every question right in a round.', f: 'JP' },
    { id: 'streak10', name: 'Hot Streak', desc: 'Answer 10 in a row.', f: 'KG' },
    { id: 'streak25', name: 'Unstoppable', desc: 'Answer 25 in a row.', f: 'MK' },
    { id: 'aceEU', name: 'European Ace', desc: 'Perfect Flags round in Europe.', f: 'DE' },
    { id: 'aceAS', name: 'Asian Ace', desc: 'Perfect Flags round in Asia.', f: 'IN' },
    { id: 'aceAF', name: 'African Ace', desc: 'Perfect Flags round in Africa.', f: 'ZA' },
    { id: 'aceNA', name: 'North American Ace', desc: 'Perfect Flags round in North America.', f: 'CA' },
    { id: 'aceSA', name: 'South American Ace', desc: 'Perfect Flags round in South America.', f: 'BR' },
    { id: 'aceOC', name: 'Oceania Ace', desc: 'Perfect Flags round in Oceania.', f: 'AU' },
    { id: 'shapes10', name: 'Cartographer', desc: 'Get 10 right in a Shapes round.', f: 'IT' },
    { id: 'capitals12', name: 'Capital Idea', desc: 'Get 12 right in a Capitals round.', f: 'GB' },
    { id: 'neigh10', name: 'Good Neighbour', desc: 'Get 10 right in a Neighbours round.', f: 'CH' },
    { id: 'typist', name: 'Touch Typist', desc: 'Type 10 countries right in one round.', f: 'EE' },
    { id: 'blitz20', name: 'Speed Flagger', desc: 'Get 20 right in a Blitz.', f: 'SC' },
    { id: 'hard12', name: 'Eagle Eye', desc: 'Get 12 right on Lookalikes difficulty.', f: 'AL' },
    { id: 'daily', name: 'Daily Traveller', desc: 'Finish a daily quiz.', f: 'BT' },
    { id: 'dailyperfect', name: 'Perfect Postcard', desc: 'Get 10 out of 10 on a daily quiz.', f: 'KI' },
    { id: 'master50', name: 'Vexillologist', desc: 'Master 50 countries.', f: 'CY' },
    { id: 'master150', name: 'World Expert', desc: 'Master 150 countries.', f: 'BR' },
    { id: 'atlas100', name: 'Armchair Explorer', desc: 'Open 100 countries in the Atlas.', f: 'NZ' },
    { id: 'all196', name: 'Seen Them All', desc: 'Answer a question about all 196 countries.', f: 'MN' }
  ];
  const SAVE_KEY = 'flagquiz:save', VER = 2;
  function load() {
    const d = { v: VER, mode: 'flags', region: 'world', diff: 'normal', m: {}, seen: [], atlas: [], badges: {}, daily: {}, history: [], stats: { rounds: 0, right: 0, wrong: 0, bestStreak: 0 } };
    let s; try { s = C.store.get(SAVE_KEY, null); } catch { s = null; }
    if (!s || typeof s !== 'object') return d;
    if (MODES[s.mode]) d.mode = s.mode;
    if (REGIONS.some((r) => r[0] === s.region)) d.region = s.region;
    if (DIFFS.some((r) => r[0] === s.diff)) d.diff = s.diff;
    for (const k of ['m', 'badges', 'daily']) if (s[k] && typeof s[k] === 'object' && !Array.isArray(s[k])) d[k] = s[k];
    for (const k of ['seen', 'atlas']) if (Array.isArray(s[k])) d[k] = s[k].filter((x) => BY[x]);
    if (Array.isArray(s.history)) d.history = s.history.filter((h) => h && typeof h === 'object').slice(0, 15);
    if (s.stats && typeof s.stats === 'object') for (const k in d.stats) if (Number.isFinite(s.stats[k])) d.stats[k] = s.stats[k];
    return d;
  }
  const save = load();
  const SIMPLE = C.simple, SIMPLE_N = 10;
  const persist = () => C.store.set(SAVE_KEY, save);
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, rnd = Math.random) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vib = (p) => { if (navigator.vibrate) try { navigator.vibrate(p); } catch {} };
  const flagEl = (code, cls = 'fq-fl') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = FS[code] || ''; d.setAttribute('role', 'img'); return d; };
  const shapeEl = (code, cls = 'fq-shape') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="${SH[code] || ''}"/></svg>`; return d; };
  function miniMap(code) {
    const c = BY[code], p = c.center;
    const dot = p ? `<circle class="ring" cx="${p[0] + 180}" cy="${90 - p[1]}" r="5"/><circle class="dot" cx="${p[0] + 180}" cy="${90 - p[1]}" r="3.4"/>` : '';
    return `<svg class="fq-mini" viewBox="0 0 360 150" role="img" aria-label="Map showing where ${c.name} is"><path d="${window.WORLD_PATH || ''}"/>${dot}</svg>`;
  }
  const fmtPop = (n) => (n >= 1e9 ? (n / 1e9).toFixed(2) + ' billion' : n >= 1e6 ? (n / 1e6).toFixed(1) + ' million' : C.fmt(n));

  const sfx = {
    tone(f, d, type = 'triangle', vol = 0.12, delay = 0, to = 0) {
      if (C.muted) return;
      const ac = C.audioContext(); if (!ac) return;
      const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t); if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    good(s) { const b = 587 * Math.pow(2, Math.min(12, s) / 24); this.tone(b, 0.1); this.tone(b * 1.26, 0.1, 'triangle', 0.1, 0.06); this.tone(b * 1.5, 0.2, 'triangle', 0.1, 0.12); },
    bad() { this.tone(210, 0.3, 'sawtooth', 0.08, 0, 100); },
    flip() { this.noise(0.14, 2600, 0.08, 'highpass'); },
    stamp(v = 1) { this.noise(0.07, 380, 0.5 * v, 'lowpass'); this.tone(90, 0.09, 'sine', 0.18 * v, 0, 60); },
    noise(d, f, vol, type) {
      if (C.muted) return;
      const ac = C.audioContext(); if (!ac) return;
      const len = Math.floor(ac.sampleRate * d), b = ac.createBuffer(1, len, ac.sampleRate), x = b.getChannelData(0);
      for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
      const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = b; fl.type = type; fl.frequency.value = f; g.gain.value = vol; s.connect(fl).connect(g).connect(ac.destination); s.start();
    },
    tick() { this.tone(1300, 0.03, 'square', 0.03); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.11, i * 0.08)); }
  };

  function colorBuckets(code) {
    const svg = FS[code] || '', set = new Set();
    for (const m of svg.matchAll(/fill="(#[0-9a-fA-F]{3,6})"/g)) {
      let h = m[1].slice(1); if (h.length === 3) h = [...h].map((x) => x + x).join('');
      const r = parseInt(h.slice(0, 2), 16) / 255, g = parseInt(h.slice(2, 4), 16) / 255, b = parseInt(h.slice(4, 6), 16) / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
      if (l > 0.85 && s < 0.4) { set.add('w'); continue; }
      if (l < 0.18) { set.add('k'); continue; }
      let hue = 0; const d = mx - mn;
      if (d) hue = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      hue = (hue * 60 + 360) % 360;
      set.add(hue < 15 || hue >= 340 ? 'r' : hue < 40 ? 'o' : hue < 70 ? 'y' : hue < 170 ? 'g' : hue < 200 ? 'c' : hue < 260 ? 'b' : 'p');
    }
    return set;
  }
  const BUCKETS = {};
  const buckets = (c) => (BUCKETS[c] ||= colorBuckets(c));
  function similarity(a, b) {
    const A = buckets(a), B = buckets(b);
    let i = 0; for (const x of A) if (B.has(x)) i++;
    return i / (A.size + B.size - i || 1) + (BY[a].cont === BY[b].cont ? 0.15 : 0);
  }

  const view = { menu: $('menu'), game: $('game'), result: $('result'), atlas: $('atlas'), stats: $('stats') };
  function show(n) { for (const k in view) view[k].hidden = k !== n; scrollTo({ top: 0, behavior: 'auto' }); }

  const mq = [$('mq1'), $('mq2')];
  const mqFlags = shuffle(ALL.map((c) => c.code)).slice(0, 40);
  mq.forEach((row, ri) => { const list = mqFlags.slice(ri * 20, ri * 20 + 20); [...list, ...list].forEach((code) => { const s = document.createElement('span'); s.innerHTML = FS[code]; row.append(s); }); });

  function modeIcon(id) {
    if (id === 'flags') return `<div style="width:54px;height:36px;border-radius:4px;overflow:hidden;box-shadow:0 2px 5px rgba(0,0,0,.25)">${FS.BR}</div>`;
    if (id === 'reverse') return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;width:48px">${['FR', 'IT', 'IE', 'CI'].map((c) => `<div style="height:15px;overflow:hidden;border-radius:2px">${FS[c]}</div>`).join('')}</div>`;
    if (id === 'shapes') return `<svg viewBox="0 0 100 100" width="38" height="38"><path d="${SH.IT}" fill="#1e88e5"/></svg>`;
    if (id === 'capitals') return '<svg viewBox="0 0 40 40" width="38" height="38"><path d="M6 34h28v3H6zM9 18h22v14H9z" fill="#c8a35a"/><path d="M7 18l13-9 13 9z" fill="#e0b860"/><circle cx="20" cy="9" r="5" fill="#1e88e5"/><path d="M12 21v10M17 21v10M23 21v10M28 21v10" stroke="#8a6a2a" stroke-width="2"/></svg>';
    if (id === 'neighbours') return `<svg viewBox="0 0 100 100" width="40" height="40"><path d="${SH.FR}" fill="#1e88e5" transform="translate(-6 8) scale(.62)"/><path d="${SH.DE}" fill="#ef6c00" transform="translate(44 -2) scale(.55)"/></svg>`;
    if (id === 'type') return '<svg viewBox="0 0 48 32" width="46" height="31"><rect x="1" y="1" width="46" height="30" rx="5" fill="#fff" stroke="#9aa7b4" stroke-width="2"/><g fill="#9aa7b4"><rect x="6" y="6" width="6" height="5" rx="1"/><rect x="14" y="6" width="6" height="5" rx="1"/><rect x="22" y="6" width="6" height="5" rx="1"/><rect x="30" y="6" width="6" height="5" rx="1"/><rect x="38" y="6" width="4" height="5" rx="1"/><rect x="8" y="13" width="6" height="5" rx="1"/><rect x="16" y="13" width="6" height="5" rx="1"/><rect x="24" y="13" width="6" height="5" rx="1"/><rect x="32" y="13" width="8" height="5" rx="1"/></g><rect x="12" y="21" width="24" height="5" rx="1" fill="#1e88e5"/></svg>';
    if (id === 'blitz') return '<svg viewBox="0 0 40 40" width="38" height="38"><circle cx="20" cy="22" r="14" fill="#fff" stroke="#f59e0b" stroke-width="3"/><rect x="17" y="3" width="6" height="5" rx="2" fill="#f59e0b"/><path d="M20 22V13M20 22l7 4" stroke="#111" stroke-width="2.6" stroke-linecap="round"/></svg>';
    return '<svg viewBox="0 0 40 40" width="38" height="38"><rect x="6" y="8" width="28" height="26" rx="5" fill="#fff" stroke="#1e88e5" stroke-width="2.5"/><path d="M6 13a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v3H6z" fill="#1e88e5"/><path d="M14 25l4 4 8-9" stroke="#2ecc71" stroke-width="3.2" fill="none" stroke-linecap="round"/></svg>';
  }
  const modesEl = $('modes');
  for (const id in MODES) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fq-mode'; b.setAttribute('role', 'radio'); b.dataset.mode = id;
    b.innerHTML = `<div class="ic" aria-hidden="true">${modeIcon(id)}</div><b></b><small></small>`;
    b.querySelector('b').textContent = MODES[id].name; b.querySelector('small').textContent = MODES[id].desc;
    b.addEventListener('click', () => { save.mode = id; persist(); sfx.tick(); renderMenu(); });
    modesEl.append(b);
  }
  function seg(el, items, key, disabled) {
    el.innerHTML = '';
    for (const [id, label] of items) {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.disabled = disabled;
      b.setAttribute('aria-pressed', String(save[key] === id));
      b.addEventListener('click', () => { save[key] = id; persist(); sfx.tick(); renderMenu(); });
      el.append(b);
    }
  }
  function poolFor(mode, region) {
    let p = ALL.filter((c) => region === 'world' || c.cont === region);
    if (mode === 'shapes') p = p.filter((c) => c.shape);
    if (mode === 'neighbours') p = p.filter((c) => c.borders.length);
    return p;
  }
  const bestKey = (mode = save.mode) => (mode === 'simple' ? 'simple' : mode === 'daily' ? `daily-${today()}` : `${mode}-${save.region}-${mode === 'type' || mode === 'blitz' ? 'x' : save.diff}`);
  function renderMenu() {
    modesEl.querySelectorAll('.fq-mode').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.mode === save.mode)));
    const daily = save.mode === 'daily';
    seg($('regions'), REGIONS, 'region', daily);
    seg($('diff'), DIFFS, 'diff', daily || save.mode === 'type' || save.mode === 'blitz');
    const n = daily ? 10 : poolFor(save.mode, save.region).length;
    const best = C.getBest(bestKey());
    const rec = save.daily[today()];
    $('modeinfo').textContent = daily ? `${MODES.daily.info}${rec ? ` Today: ${rec.first}/10 first try.` : ''}` : `${MODES[save.mode].info} ${n} countries in this pool.${best != null ? ` Best: ${C.fmt(best)}.` : ''}`;
    $('play').disabled = !daily && n < 4;
  }

  let R = null, qTimer = 0, timerRaf = 0, autoT = 0;
  function makeQuestions() {
    const mode = SIMPLE ? 'simple' : save.mode;
    if (mode === 'simple') return shuffle(ALL.filter((c) => c.pop > 9e6)).slice(0, SIMPLE_N).map((c) => ({ kind: 'flags', c }));
    if (mode === 'daily') {
      const rnd = mulberry(hashStr('flags-' + today()));
      const kinds = ['flags', 'flags', 'flags', 'shapes', 'shapes', 'capitals', 'capitals', 'reverse', 'reverse', 'neighbours'];
      const used = new Set();
      return kinds.map((k) => { const pool = poolFor(k, 'world').filter((c) => !used.has(c.code)); const c = pool[Math.floor(rnd() * pool.length)]; used.add(c.code); return { kind: k, c, rnd }; });
    }
    const pool = shuffle(poolFor(mode, save.region));
    const n = mode === 'blitz' ? pool.length : Math.min(15, pool.length);
    return pool.slice(0, n).map((c) => ({ kind: mode === 'blitz' ? 'flags' : mode, c }));
  }
  function distractors(q, rnd = Math.random) {
    const { kind, c } = q;
    const diff = SIMPLE ? 'easy' : save.mode === 'daily' ? 'normal' : save.diff;
    const keyOf = (x) => (kind === 'capitals' ? x.capital : x.code);
    let cands = ALL.filter((x) => x.code !== c.code);
    if (kind === 'neighbours') {
      const nb = c.borders.map((b) => BY[b]).filter(Boolean);
      const right = nb[Math.floor(rnd() * nb.length)];
      const others = shuffle(ALL.filter((x) => x.code !== c.code && !c.borders.includes(x.code)), rnd).sort((a, b) => (b.cont === c.cont) - (a.cont === c.cont));
      return { answer: right, opts: shuffle([right, ...others.slice(0, 3)], rnd) };
    }
    if (kind === 'shapes') cands = cands.filter((x) => x.shape);
    const region = SIMPLE || save.mode === 'daily' ? 'world' : save.region;
    if (region !== 'world') { const same = cands.filter((x) => x.cont === region); if (same.length >= 3) cands = same; }
    let picks;
    if (diff === 'hard') {
      if (kind === 'shapes') picks = cands.slice().sort((a, b) => Math.abs(Math.log(a.area / c.area)) - Math.abs(Math.log(b.area / c.area)) + (rnd() - 0.5) * 0.4).slice(0, 3);
      else picks = cands.slice().sort((a, b) => similarity(c.code, b.code) - similarity(c.code, a.code) + (rnd() - 0.5) * 0.08).slice(0, 3);
    } else if (diff === 'easy') {
      const far = cands.filter((x) => x.cont !== c.cont);
      picks = shuffle(far.length >= 3 ? far : cands, rnd).slice(0, 3);
    } else {
      const near = shuffle(cands.filter((x) => x.cont === c.cont), rnd), rest = shuffle(cands.filter((x) => x.cont !== c.cont), rnd);
      picks = [...near, ...rest].slice(0, 3);
    }
    const seen = new Set([keyOf(c)]);
    picks = picks.filter((x) => { const k = keyOf(x); if (seen.has(k)) return false; seen.add(k); return true; });
    for (const x of shuffle(cands, rnd)) { if (picks.length >= 3) break; if (!seen.has(keyOf(x))) { seen.add(keyOf(x)); picks.push(x); } }
    return { answer: c, opts: shuffle([c, ...picks.slice(0, 3)], rnd) };
  }

  function start() {
    const mode = SIMPLE ? 'simple' : save.mode;
    R = { mode, qs: makeQuestions(), i: -1, score: 0, right: 0, wrong: 0, streak: 0, bestStreak: 0, log: [], newBadges: [], timeLeft: 60, typed: 0, hintsUsed: 0, start: performance.now(), done: false };
    $('h-best').textContent = C.getBest(bestKey()) ?? '-';
    $('h-qlabel').textContent = mode === 'blitz' ? 'Seconds' : 'Question';
    show('game');
    next();
    if (mode === 'blitz') { lastT = performance.now(); cancelAnimationFrame(timerRaf); timerRaf = requestAnimationFrame(blitzTick); }
  }
  let lastT = 0, qStart = 0, qLimit = 15;
  function blitzTick(t) {
    if (!R || R.done) return;
    timerRaf = requestAnimationFrame(blitzTick);
    const dt = Math.min(0.2, (t - lastT) / 1000); lastT = t;
    if (document.hidden) return;
    const b = Math.ceil(R.timeLeft); R.timeLeft -= dt;
    if (R.timeLeft <= 5 && Math.ceil(R.timeLeft) !== b) sfx.tick();
    $('h-q').textContent = Math.max(0, Math.ceil(R.timeLeft));
    const tm = $('timer'); tm.querySelector('i').style.width = Math.max(0, R.timeLeft / 60 * 100) + '%'; tm.classList.toggle('low', R.timeLeft < 10);
    if (R.timeLeft <= 0) finish();
  }
  function qTick(t) {
    if (!R || R.done || R.answered) return;
    timerRaf = requestAnimationFrame(qTick);
    if (document.hidden) { qStart += 16; return; }
    const left = qLimit - (t - qStart) / 1000;
    const tm = $('timer'); tm.querySelector('i').style.width = Math.max(0, left / qLimit * 100) + '%'; tm.classList.toggle('low', left < 4);
    const sec = Math.ceil(left); if (left < 3.2 && sec !== qTimer) { qTimer = sec; sfx.tick(); }
    if (left <= 0) answer(null);
  }
  function next() {
    clearTimeout(autoT);
    R.i++;
    if (R.i >= R.qs.length || R.done) return finish();
    const q = R.qs[R.i];
    R.answered = false; R.hint = 0;
    const d = distractors(q, q.rnd || Math.random);
    q.answer = d.answer; q.opts = d.opts;
    if (R.mode !== 'blitz') $('h-q').textContent = `${R.i + 1}/${R.qs.length}`;
    paintHud();
    const prompt = $('prompt'); prompt.innerHTML = '<svg class="fq-postmark" aria-hidden="true"><use href="#pmk"/></svg>';
    const kind = q.kind, c = q.c;
    let question = '';
    if (kind === 'flags' || kind === 'type') { const f = flagEl(c.code, 'fq-flag'); f.setAttribute('aria-label', 'Mystery flag'); prompt.append(f); question = kind === 'type' ? 'Type the country:' : 'Which country is this?'; }
    else if (kind === 'reverse') { prompt.innerHTML = `<div class="fq-name"><b></b><span>${CONT[c.cont]}</span></div>`; prompt.querySelector('b').textContent = c.name; question = 'Which flag belongs to it?'; }
    else if (kind === 'shapes') { const s = shapeEl(c.code); s.setAttribute('role', 'img'); s.setAttribute('aria-label', 'Mystery country outline'); prompt.append(s); question = 'Which country has this shape?'; }
    else if (kind === 'capitals') { const w = document.createElement('div'); w.className = 'fq-pair'; const f = flagEl(c.code, 'fq-flag sm'); f.setAttribute('aria-label', `Flag of ${c.name}`); const nm = document.createElement('div'); nm.className = 'fq-name'; nm.innerHTML = '<b></b>'; nm.querySelector('b').textContent = c.name; w.append(f, nm); prompt.append(w); question = `What's the capital of ${c.name}?`; }
    else if (kind === 'neighbours') { const w = document.createElement('div'); w.className = 'fq-pair'; const s = c.shape ? shapeEl(c.code, 'fq-shape sm') : flagEl(c.code, 'fq-flag sm'); const nm = document.createElement('div'); nm.className = 'fq-name'; nm.innerHTML = `<b></b><span>${CONT[c.cont]}</span>`; nm.querySelector('b').textContent = c.name; w.append(s, nm); prompt.append(w); question = `Which country borders ${c.name}?`; }
    $('question').textContent = question;
    const opts = $('opts'); opts.innerHTML = '';
    $('reveal').hidden = true;
    const typing = kind === 'type';
    $('typeform').hidden = !typing; opts.hidden = typing;
    if (typing) { const inp = $('typein'); inp.value = ''; inp.disabled = false; setTimeout(() => inp.focus({ preventScroll: true }), 50); $('typehint').disabled = false; $('typeskip').disabled = false; }
    else q.opts.forEach((o, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fq-opt' + (kind === 'reverse' ? ' flagopt' : '');
      b.dataset.code = o.code;
      b.innerHTML = `<span class="k">${i + 1}</span>`;
      if (kind === 'reverse') { const f = flagEl(o.code); f.setAttribute('aria-label', `Flag option ${i + 1}`); b.append(f); }
      else b.append(document.createTextNode(kind === 'capitals' ? o.capital : o.name));
      b.addEventListener('click', () => answer(o));
      opts.append(b);
    });
    sfx.flip();
    if (R.mode === 'simple') { $('timer').hidden = true; cancelAnimationFrame(timerRaf); }
    else if (R.mode !== 'blitz') { $('timer').hidden = false; qLimit = typing ? 25 : 15; qStart = performance.now(); qTimer = 0; cancelAnimationFrame(timerRaf); timerRaf = requestAnimationFrame(qTick); }
  }
  function paintHud() {
    $('h-score').textContent = R.mode === 'simple' ? R.right : C.fmt(R.score);
    $('h-streak').textContent = R.streak;
  }
  function bump(id) { const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  function answer(o, typedOk) {
    if (!R || R.answered || R.done) return;
    const q = R.qs[R.i];
    R.answered = true;
    if (R.mode !== 'blitz') cancelAnimationFrame(timerRaf);
    const ok = typedOk != null ? typedOk : !!o && o.code === q.answer.code;
    const left = R.mode === 'blitz' || R.mode === 'simple' ? 1 : Math.max(0, qLimit - (performance.now() - qStart) / 1000) / qLimit;
    const code = q.c.code;
    const m = save.m[code] || [0, 0];
    if (ok) {
      R.right++; R.streak++; R.bestStreak = Math.max(R.bestStreak, R.streak);
      const pts = Math.round((100 + 50 * left - (R.hint || 0) * 30) * (1 + Math.min(10, R.streak - 1) * 0.1));
      R.score += Math.max(10, pts);
      m[0]++; save.stats.right++;
      if (q.kind === 'type') R.typed++;
      sfx.good(R.streak); sfx.stamp(); vib(10);
      bump('h-score');
      award('first');
      if (R.streak >= 10) award('streak10'); if (R.streak >= 25) award('streak25');
      if (R.streak > 0 && R.streak % 10 === 0) { C.confetti(70); C.toast(`${R.streak} in a row!`); }
    } else {
      R.wrong++; R.streak = 0; m[1]++; save.stats.wrong++;
      if (R.mode === 'blitz') R.timeLeft = Math.max(0, R.timeLeft - 3);
      sfx.bad(); sfx.stamp(0.6); vib([25, 35, 25]);
    }
    save.m[code] = m;
    if (q.kind !== 'type' || ok) { const sm = document.createElement('div'); sm.className = 'fq-stampmark ' + (ok ? 'ok' : 'no'); sm.textContent = ok ? 'Approved' : 'Return to sender'; $('prompt').append(sm); }
    if (!save.seen.includes(code)) { save.seen.push(code); if (save.seen.length >= ALL.length) award('all196'); }
    save.stats.bestStreak = Math.max(save.stats.bestStreak, R.bestStreak);
    R.log.push({ kind: q.kind, code, ok, pick: o ? o.code : null, ans: q.answer.code });
    persist();
    paintHud();
    $('opts').querySelectorAll('.fq-opt').forEach((b) => {
      b.disabled = true;
      if (b.dataset.code === q.answer.code) b.classList.add('good');
      else if (o && b.dataset.code === o.code) b.classList.add('bad');
      else b.classList.add('dim');
    });
    if (q.kind === 'type') { const inp = $('typein'); inp.disabled = true; $('typehint').disabled = true; $('typeskip').disabled = true; if (!ok) { $('typeform').classList.remove('bad'); void $('typeform').offsetWidth; $('typeform').classList.add('bad'); } }
    if (R.mode === 'blitz') { autoT = setTimeout(next, ok ? 280 : 650); return; }
    showReveal(q, ok);
    autoT = setTimeout(() => { if (ok) next(); }, 1700);
  }
  function showReveal(q, ok) {
    const rv = $('reveal');
    const c = q.kind === 'neighbours' ? q.answer : q.c;
    rv.innerHTML = '';
    const left = document.createElement('div');
    const h = document.createElement('h3'); h.append(flagEl(c.code)); const nm = document.createElement('span'); nm.textContent = (ok ? 'Yes! ' : 'It was ') + c.name; h.append(nm);
    left.append(h);
    const facts = [['Capital', c.capital], ['Continent', CONT[c.cont]], ['Population', fmtPop(c.pop)], ['Area', C.fmt(c.area) + ' km²']];
    if (c.currency) facts.push(['Currency', c.currency]);
    if (q.kind === 'neighbours') facts.unshift(['Borders', `${q.c.name}`]);
    const dl = document.createElement('dl');
    for (const [k, v] of facts) { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); }
    left.append(dl);
    const map = document.createElement('div'); map.innerHTML = miniMap(c.code);
    const nb = document.createElement('button'); nb.type = 'button'; nb.className = 'c-btn'; nb.textContent = R.i + 1 >= R.qs.length ? 'See results' : 'Next';
    nb.addEventListener('click', next);
    rv.append(left, map.firstChild, nb);
    rv.hidden = false;
    if (!ok) setTimeout(() => nb.focus({ preventScroll: true }), 50);
    if (innerWidth < 600) rv.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
  }

  const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/&/g, 'and').replace(/^the\s+/, '').replace(/\bst\.?\s/g, 'saint ').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  function lev(a, b) { const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
  function typedMatches(text, c) {
    const t = norm(text); if (!t) return false;
    const names = [c.name, ...(ALIASES[c.code] || [])].map(norm);
    return names.some((n) => n === t || (n.length > 4 && lev(n, t) <= (n.length > 8 ? 2 : 1)));
  }
  $('typeform').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!R || R.answered) return;
    const q = R.qs[R.i], v = $('typein').value;
    if (!v.trim()) return;
    const ok = typedMatches(v, q.c);
    if (!ok) {
      const other = ALL.find((x) => x.code !== q.c.code && typedMatches(v, x));
      if (!other && norm(v).length < 3) return;
    }
    answer(ok ? q.c : { code: '??' }, ok);
  });
  $('typehint').addEventListener('click', () => {
    if (!R || R.answered) return;
    const q = R.qs[R.i]; R.hint = (R.hint || 0) + 1; R.hintsUsed++;
    const nm = q.c.name, shown = nm.slice(0, Math.min(nm.length - 1, R.hint * 2));
    $('typein').placeholder = shown + nm.slice(shown.length).replace(/[^ ]/g, '_');
    $('typein').value = shown; $('typein').focus();
    sfx.tick();
  });
  $('typeskip').addEventListener('click', () => answer(null, false));

  function finish() {
    if (!R || R.done) return;
    R.done = true; cancelAnimationFrame(timerRaf); clearTimeout(autoT);
    const total = R.right + R.wrong, mode = R.mode;
    save.stats.rounds++;
    const isNew = mode === 'simple' ? C.best('simple', R.right).isNew && R.right > 0 : C.best(bestKey(mode), R.score).isNew && R.score > 0;
    const perfect = total > 0 && R.wrong === 0 && mode !== 'blitz' && R.right === R.qs.length;
    if (perfect && mode !== 'daily') award('perfect');
    if (perfect && mode === 'flags' && save.region !== 'world') award('ace' + save.region);
    if (mode === 'shapes' && R.right >= 10) award('shapes10');
    if (mode === 'capitals' && R.right >= 12) award('capitals12');
    if (mode === 'neighbours' && R.right >= 10) award('neigh10');
    if (mode === 'type' && R.typed >= 10) award('typist');
    if (mode === 'blitz' && R.right >= 20) award('blitz20');
    if (save.diff === 'hard' && !['daily', 'type', 'blitz'].includes(mode) && R.right >= 12) award('hard12');
    if (mode === 'daily') {
      award('daily'); if (R.right === 10) award('dailyperfect');
      const d = save.daily[today()] || { first: null, best: 0, plays: 0 };
      d.plays++; d.best = Math.max(d.best, R.right); if (d.first == null) d.first = R.right;
      save.daily[today()] = d;
      const keys = Object.keys(save.daily).sort(); while (keys.length > 40) delete save.daily[keys.shift()];
    }
    const mastered = Object.values(save.m).filter(([r, w]) => r >= 3 && r > w * 2).length;
    if (mastered >= 50) award('master50'); if (mastered >= 150) award('master150');
    if (mode !== 'simple') save.history.unshift({ m: mode, r: save.region, s: R.score, ok: R.right, n: total, t: Date.now() });
    save.history.length = Math.min(15, save.history.length);
    persist();
    const acc = total ? Math.round(R.right / total * 100) : 0;
    const tier = acc === 100 && total >= 10 ? 'gold' : acc >= 80 ? 'silver' : acc >= 50 ? 'bronze' : 'none';
    $('r-medal').innerHTML = medal(tier, R.log[0]?.code || 'UN');
    $('r-title').textContent = perfect ? 'Every letter delivered!' : acc >= 80 ? 'Globetrotter!' : acc >= 50 ? 'Not bad, traveller' : 'Lost in the post';
    $('r-score').textContent = mode === 'simple' ? `${R.right}/${SIMPLE_N}` : C.fmt(R.score);
    $('r-new').hidden = !isNew;
    const rs = [[`${R.right}/${total}`, 'Correct'], [acc + '%', 'Accuracy'], [R.bestStreak, 'Best streak'], [mastered, 'Mastered']];
    $('r-stats').innerHTML = rs.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const wrongs = R.log.filter((l) => !l.ok).map((l) => BY[l.ans]?.name).filter(Boolean);
    $('r-msg').textContent = mode === 'daily' ? 'Come back tomorrow for a new set.' : wrongs.length ? `Study up on: ${wrongs.slice(0, 5).join(', ')}${wrongs.length > 5 ? '...' : ''}.` : 'Not a single slip. Impressive.';
    const earned = $('r-earned'); earned.innerHTML = '';
    R.newBadges.forEach((n) => { const sp = document.createElement('span'); sp.textContent = 'Badge: ' + n; earned.append(sp); });
    const rv = $('review'); rv.innerHTML = '';
    for (const l of R.log) {
      const c = BY[l.kind === 'neighbours' ? l.ans : l.code];
      const d = document.createElement('div'); d.className = 'fq-rv' + (l.ok ? '' : ' bad');
      d.append(l.kind === 'shapes' ? shapeEl(c.code) : flagEl(c.code));
      d.append(document.createTextNode(l.kind === 'capitals' ? `${c.capital}` : c.name));
      if (!l.ok && l.pick && BY[l.pick]) { const s = document.createElement('small'); s.textContent = 'you said ' + (l.kind === 'capitals' ? BY[l.pick].capital : BY[l.pick].name); d.append(s); }
      rv.append(d);
    }
    if (isNew || perfect) { C.confetti(); sfx.fanfare(); }
    show('result');
  }
  function medal(tier, code) {
    const c = { gold: ['#ffd54a', '#c98a00'], silver: ['#e3e8ee', '#8a96a3'], bronze: ['#f0a76b', '#a4592a'], none: ['#d6cfc4', '#948c82'] }[tier];
    return `<svg viewBox="0 0 86 86" aria-hidden="true"><path d="M28 2h12l6 22h-12zM46 2h12l-6 22h-12z" fill="#1e88e5"/><circle cx="43" cy="52" r="31" fill="${c[1]}"/><circle cx="43" cy="52" r="26" fill="${c[0]}"/><path d="M33 38v30" stroke="${c[1]}" stroke-width="3.4" stroke-linecap="round"/><path d="M34 39c6-4 10 4 18 0v14c-8 4-12-4-18 0z" fill="${c[1]}"/></svg>`;
  }
  function shareText() {
    const grid = R.log.map((l) => (l.ok ? '🟩' : '🟥')).join('');
    if (R.mode === 'simple') return `Zoble Flag Quiz: ${R.right}/${SIMPLE_N} flags\n${grid}`;
    if (R.mode === 'daily') return `Zoble Flag Quiz daily ${today()}: ${R.right}/10\n${grid}`;
    return `Zoble Flag Quiz (${MODES[R.mode].name}, ${REGIONS.find((r) => r[0] === save.region)[1]}): ${C.fmt(R.score)} points, ${R.right}/${R.right + R.wrong}\n${grid}`;
  }

  function award(id) {
    if (save.badges[id]) return;
    const b = BADGES.find((x) => x.id === id); if (!b) return;
    save.badges[id] = Date.now(); R?.newBadges.push(b.name);
    C.toast(`Badge unlocked: ${b.name}`); persist();
  }

  let atlasReg = 'world';
  function renderAtlas() {
    const q = norm($('atlas-q').value || '');
    const reg = $('atlas-reg'); reg.innerHTML = '';
    for (const [id, label] of REGIONS) { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', String(atlasReg === id)); b.addEventListener('click', () => { atlasReg = id; renderAtlas(); }); reg.append(b); }
    const grid = $('atlas-grid'); grid.innerHTML = '';
    const list = ALL.filter((c) => (atlasReg === 'world' || c.cont === atlasReg) && (!q || norm(c.name).includes(q) || norm(c.capital).includes(q))).sort((a, b) => a.name.localeCompare(b.name));
    for (const c of list) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fq-card';
      b.append(flagEl(c.code));
      const m = save.m[c.code] || [0, 0], stars = m[0] >= 3 && m[0] > m[1] * 2 ? 3 : m[0] >= 2 ? 2 : m[0] >= 1 ? 1 : 0;
      const nm = document.createElement('b'); nm.textContent = c.name;
      const sm = document.createElement('small'); sm.innerHTML = `<span class="st" aria-label="${stars} of 3 stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span> `; sm.append(document.createTextNode(c.capital));
      b.append(nm, sm);
      b.addEventListener('click', () => openDetail(c.code));
      grid.append(b);
    }
    if (!list.length) grid.innerHTML = '<p class="c-muted">No countries match.</p>';
  }
  function openDetail(code) {
    const c = BY[code], d = $('detail');
    if (!save.atlas.includes(code)) { save.atlas.push(code); if (save.atlas.length >= 100) { R = R || { newBadges: [] }; award('atlas100'); } persist(); }
    d.innerHTML = '';
    const side = document.createElement('div'); side.className = 'side';
    side.append(flagEl(code));
    if (c.shape) side.append(shapeEl(code));
    const main = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = c.name; main.append(h);
    const m = save.m[code] || [0, 0];
    const facts = [['Capital', c.capital], ['Continent', CONT[c.cont]], ['Population', fmtPop(c.pop)], ['Area', C.fmt(c.area) + ' km²'], ['Currency', c.currency || '-'], ['Languages', c.langs || '-'], ['People', c.demonym || '-'], ['Landlocked', c.landlocked ? 'Yes' : 'No'], ['Your record', `${m[0]} right, ${m[1]} wrong`]];
    const dl = document.createElement('dl');
    for (const [k, v] of facts) { const dt = document.createElement('dt'); dt.textContent = k; const dd = document.createElement('dd'); dd.textContent = v; dl.append(dt, dd); }
    main.append(dl);
    if (c.borders.length) {
      const p = document.createElement('div'); p.className = 'c-row'; p.style.justifyContent = 'flex-start'; p.style.gap = '6px'; p.style.marginBottom = '8px';
      const lab = document.createElement('b'); lab.textContent = 'Neighbours:'; lab.style.fontSize = '13px'; p.append(lab);
      for (const b of c.borders) { const x = BY[b]; if (!x) continue; const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'c-btn c-btn--ghost'; btn.style.padding = '4px 10px'; btn.style.fontSize = '12.5px'; btn.textContent = x.name; btn.addEventListener('click', () => openDetail(b)); p.append(btn); }
      main.append(p);
    }
    const map = document.createElement('div'); map.innerHTML = miniMap(code); map.style.maxWidth = '360px'; main.append(map);
    const x = document.createElement('button'); x.type = 'button'; x.className = 'c-btn c-btn--ghost x'; x.textContent = 'Close'; x.style.marginTop = '8px'; x.addEventListener('click', () => { d.hidden = true; });
    main.append(x);
    d.append(side, main); d.hidden = false;
    d.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    sfx.flip();
  }
  function openStats() {
    const s = save.stats, acc = s.right + s.wrong ? Math.round(s.right / (s.right + s.wrong) * 100) : 0;
    const mastered = Object.values(save.m).filter(([r, w]) => r >= 3 && r > w * 2).length;
    const cells = [[s.rounds, 'Rounds'], [s.right, 'Correct'], [acc + '%', 'Accuracy'], [s.bestStreak, 'Best streak'], [`${save.seen.length}/196`, 'Seen'], [mastered, 'Mastered'], [save.atlas.length, 'Atlas visits'], [`${Object.keys(save.badges).length}/${BADGES.length}`, 'Badges']];
    $('statgrid').innerHTML = cells.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('');
    const ct = $('continents'); ct.innerHTML = '';
    for (const k in CONT) {
      const pool = ALL.filter((c) => c.cont === k), mm = pool.filter((c) => { const m = save.m[c.code]; return m && m[0] >= 3 && m[0] > m[1] * 2; }).length;
      const row = document.createElement('div'); row.innerHTML = `<span></span><i style="--p:${Math.round(mm / pool.length * 100)}%"></i><span>${mm}/${pool.length}</span>`;
      row.firstChild.textContent = CONT[k]; ct.append(row);
    }
    const bw = $('badges'); bw.innerHTML = '';
    for (const b of BADGES) {
      const el = document.createElement('div'); el.className = 'fq-badge' + (save.badges[b.id] ? ' on' : '');
      el.append(flagEl(b.f));
      const t = document.createElement('div'); t.innerHTML = '<b></b><small></small>'; t.querySelector('b').textContent = b.name; t.querySelector('small').textContent = b.desc;
      el.append(t); bw.append(el);
    }
    const hl = $('history'); hl.innerHTML = save.history.length ? '' : '<li>No rounds yet.</li>';
    for (const h of save.history) { const li = document.createElement('li'); li.innerHTML = '<b></b><span></span>'; li.querySelector('b').textContent = `${MODES[h.m]?.name || h.m}: ${C.fmt(h.s)} (${h.ok}/${h.n})`; li.querySelector('span').textContent = `${REGIONS.find((r) => r[0] === h.r)?.[1] || ''} · ${new Date(h.t).toLocaleDateString()}`; hl.append(li); }
    show('stats');
  }

  $('play').addEventListener('click', start);
  $('again').addEventListener('click', start);
  $('to-menu').addEventListener('click', () => { renderMenu(); show('menu'); });
  $('open-atlas').addEventListener('click', () => { $('detail').hidden = true; renderAtlas(); show('atlas'); });
  $('open-stats').addEventListener('click', openStats);
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { renderMenu(); show('menu'); }));
  $('atlas-q').addEventListener('input', renderAtlas);
  $('quit').addEventListener('click', () => { if (R && !R.done) { if (R.right + R.wrong === 0 && !SIMPLE) { R.done = true; cancelAnimationFrame(timerRaf); renderMenu(); show('menu'); } else finish(); } });
  $('share').addEventListener('click', async () => { const t = shareText(); try { await navigator.clipboard.writeText(t); C.toast('Copied to clipboard'); } catch { C.toast(t.split('\n')[0], 4000); } });
  addEventListener('keydown', (e) => {
    if (view.game.hidden || !R || R.done || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input')) return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 4 && !R.answered) { const b = $('opts').querySelectorAll('.fq-opt')[n - 1]; if (b) { e.preventDefault(); b.click(); } }
    else if ((e.key === 'Enter' || e.key === ' ') && R.answered && !e.target.closest('button')) { e.preventDefault(); next(); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastT = performance.now(); });

  window.__flags = { get R() { return R; }, save, start, answerRight() { const q = R.qs[R.i]; if (q.kind === 'type') answer(q.c, true); else answer(q.answer); }, answerWrong() { const q = R.qs[R.i]; answer(q.kind === 'type' ? { code: '??' } : q.opts.find((o) => o.code !== q.answer.code), false); }, next: () => next(), typedMatches: (t, c) => typedMatches(t, BY[c]) };
  renderMenu();
  if (SIMPLE) start();
  if (!C.store.get('tip:touchpad:flag-quiz', false) && !matchMedia('(pointer: coarse)').matches) {
    C.store.set('tip:touchpad:flag-quiz', true);
    setTimeout(() => C.toast('Tip: press 1 to 4 to answer and Enter for the next flag, no pointing needed', 4000), 1200);
  }
})();
