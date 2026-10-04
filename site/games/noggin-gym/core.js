(() => {
  const C = window.Curio;
  const NG = window.NG = window.NG || {};
  NG.stations = NG.stations || [];
  NG.add = (s) => NG.stations.push(s);

  const today = (off = 0) => { const d = new Date(); d.setDate(d.getDate() + off); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return s * y; }
  const ncdf = (z) => .5 * (1 + erf(z / Math.SQRT2));
  const fixPct = (p) => clamp(Math.round(p * 100), 1, 99);
  const pctN = (v, mean, sd, lower) => fixPct(lower ? 1 - ncdf((v - mean) / sd) : ncdf((v - mean) / sd));
  const pctL = (v, median, sigma, lower) => { const z = Math.log(Math.max(1e-6, v) / median) / sigma; return fixPct(lower ? 1 - ncdf(z) : ncdf(z)); };
  const shuffle = (arr, r = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  NG.u = { today, seeded, clamp, esc, pctN, pctL, shuffle, buzz, ncdf };

  let noiseBuf = null;
  function ac() { return C.muted ? null : (C.audioContext && C.audioContext()); }
  function tone(f, d = .12, type = 'sine', v = .12, at = 0, to = 0) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .006); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .03);
  }
  function noise(d, v, f, q = 1, at = 0, kind = 'bandpass', to = 0) {
    const a = ac(); if (!a) return;
    if (!noiseBuf || noiseBuf.sampleRate !== a.sampleRate) { noiseBuf = a.createBuffer(1, a.sampleRate * .6, a.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    const t = a.currentTime + at, s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain();
    s.buffer = noiseBuf; fl.type = kind; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(.05, d / 3)); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    s.connect(fl).connect(g).connect(a.destination); s.start(t); s.stop(t + d + .02);
  }
  function whistle(at = 0, len = .32) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), lfo = a.createOscillator(), lg = a.createGain(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = 2350; lfo.frequency.value = 38; lg.gain.value = 140;
    lfo.connect(lg).connect(o.frequency);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.09, t + .02); g.gain.setValueAtTime(.09, t + len - .05); g.gain.exponentialRampToValueAtTime(.0001, t + len);
    o.connect(g).connect(a.destination); o.start(t); lfo.start(t); o.stop(t + len + .02); lfo.stop(t + len + .02);
    noise(len, .03, 2400, 3, at);
  }
  const snd = {
    whistle: () => { whistle(0, .18); whistle(.24, .38); },
    peep: () => whistle(0, .14),
    clang: () => { [180, 452, 731, 1183].forEach((f, i) => tone(f, .7 - i * .12, 'sine', .07 - i * .012)); noise(.08, .2, 3000, .8); },
    bell: () => { [0, .22, .44].forEach((at) => { tone(1046, 1.1, 'sine', .07, at); tone(2637, .5, 'sine', .025, at); tone(1567, .8, 'triangle', .02, at); }); },
    cheer: () => { noise(1.3, .09, 1200, .5, 0, 'bandpass', 2600); noise(1, .05, 600, .8, .15); [523, 659, 784, 1046].forEach((f, i) => tone(f, .3, 'triangle', .07, .05 + i * .08)); },
    good: (n = 0) => { tone(660 + n * 40, .1, 'triangle', .1); tone(990 + n * 60, .14, 'triangle', .07, .05); },
    bad: () => { tone(170, .16, 'square', .045); tone(130, .22, 'square', .04, .09); },
    tick: () => tone(1500, .03, 'square', .025),
    tap: () => { noise(.04, .18, 2600, 1.4); tone(480, .05, 'triangle', .06); },
    pop: () => tone(380, .09, 'sine', .12, 0, 950),
    count: () => tone(660, .12, 'triangle', .1),
    go: () => { tone(990, .2, 'triangle', .1); tone(1320, .25, 'triangle', .06, .05); },
    thud: () => { tone(120, .16, 'sine', .25, 0, 50); noise(.06, .2, 400, .7, 0, 'lowpass'); },
    swish: () => noise(.25, .1, 400, .8, 0, 'bandpass', 3000),
    unlock: () => { [784, 988, 1318, 1568].forEach((f, i) => tone(f, .22, 'triangle', .07, i * .07)); }
  };
  NG.snd = snd; NG.tone = tone; NG.noise = noise;

  const SKILLS = [
    { id: 'reflex', name: 'Reflexes', short: 'Reflex', color: '#ff6b2c' },
    { id: 'aim', name: 'Aim', short: 'Aim', color: '#e8384f' },
    { id: 'memory', name: 'Memory', short: 'Memory', color: '#7b4fe0' },
    { id: 'timing', name: 'Timing', short: 'Timing', color: '#13a89e' },
    { id: 'eyes', name: 'Eyes', short: 'Eyes', color: '#2f80ed' },
    { id: 'wits', name: 'Wits', short: 'Wits', color: '#e0a100' }
  ];
  const RANKS = [[0, 'Couch potato', 'Everyone starts on the sofa. Up you get.'], [25, 'Weekend jogger', 'Warming up nicely. Keep moving.'], [45, 'Gym regular', 'Right in the thick of the crowd.'], [65, 'Personal trainer', 'Comfortably ahead of most people.'], [82, 'Pro athlete', 'Seriously sharp. Scouts are watching.'], [94, 'Olympian', 'Top of the podium. Wave to the crowd.']];
  const rankOf = (p) => RANKS.reduce((a, r) => (p >= r[0] ? r : a), RANKS[0]);
  const NOGGIN_RANKS = [[0, 'Fresh sneakers'], [150, 'Stretching'], [300, 'Breaking a sweat'], [450, 'Iron noggin'], [600, 'Mind athlete'], [750, 'Brain champion'], [880, 'Legend of the gym']];
  const ACH = [
    ['first', 'First rep', 'Finish any test.'],
    ['five', 'Warmed up', 'Try five different stations.'],
    ['circuit', 'Full circuit', 'Try all fifteen stations.'],
    ['allskills', 'All-rounder', 'Play something from all six skills.'],
    ['workout', 'Workout done', 'Finish a daily workout.'],
    ['workout5', 'Creature of habit', 'Finish five daily workouts.'],
    ['streak3', 'Three in a row', 'Train three days in a row.'],
    ['streak7', 'Week of sweat', 'Train seven days in a row.'],
    ['n500', 'Iron noggin', 'Reach a Noggin score of 450.'],
    ['n700', 'Brain champion', 'Reach a Noggin score of 750.'],
    ['top10', 'Top ten percent', 'Beat 90% of people on any test.'],
    ['top1', 'One in a hundred', 'Beat 99% of people on any test.'],
    ['pb10', 'Record breaker', 'Set ten personal bests.'],
    ['reg50', 'Gym member', 'Finish 50 tests.'],
    ['reg200', 'Lifetime member', 'Finish 200 tests.'],
    ['owl', 'Night shift', 'Train after 10pm.'],
    ['lark', 'Dawn patrol', 'Train before 8am.'],
    ['reflex200', 'Cat reflexes', 'Average under 200ms on the Light test.'],
    ['aim400', 'Hawk eye', 'Under 400ms per target on Classic aim.'],
    ['wpm60', 'Quick fox', 'Type 60 words per minute.'],
    ['chimp9', 'Ayumu level', 'Reach 9 on the Monkey Bars.'],
    ['num10', 'Phone book', 'Recall a 10 digit number.'],
    ['verbal50', 'Walking dictionary', 'Score 50 in the Word Locker.'],
    ['visual12', 'Photographic', 'Reach level 12 on the Tile Mats.'],
    ['seq12', 'Echo chamber', 'Reach level 12 on the Echo Pads.'],
    ['cps10', 'Speed demon', '10 clicks per second on the Speed Bag.'],
    ['stop10', 'Human metronome', 'Stop within 10ms of the target.'],
    ['beat15', 'Click track', 'Hold the beat within 15ms on average.'],
    ['angle900', 'Human protractor', 'Score 900 on the Protractor.'],
    ['odd25', 'Eagle eyes', 'Reach level 25 on the Colour Spotter.'],
    ['paint9', 'Colourist', 'Average 9 out of 10 in the Paint Pot.'],
    ['math30', 'Human calculator', '30 right in a 60 second Number Crunch.']
  ];

  const fresh = () => ({ v: 1, best: {}, hist: [], days: {}, ach: {}, wk: {}, plays: {}, sp: {}, last: {}, opts: {}, tot: { tests: 0, pbs: 0, workouts: 0 }, seenTip: false, coach: 0 });
  let P = fresh();
  try { const raw = C.store.get('gym:v1', null); if (raw && raw.v === 1) P = Object.assign(fresh(), raw); } catch {}
  ['best', 'days', 'ach', 'wk', 'plays', 'sp', 'last', 'opts'].forEach((k) => { if (!P[k] || typeof P[k] !== 'object' || Array.isArray(P[k])) P[k] = {}; });
  if (!Array.isArray(P.hist)) P.hist = [];
  if (!P.tot || typeof P.tot !== 'object') P.tot = fresh().tot;
  const save = () => C.store.set('gym:v1', P);
  NG.data = () => P;

  const simple = () => C.mode !== 'advanced';
  const byId = (id) => NG.stations.find((s) => s.id === id);
  const view = () => document.getElementById('view');
  let cur = null, wk = null, homeTab = 'floor', skillFilter = 'all';

  const COACH = `<svg class="coach" viewBox="0 0 160 170" role="img" aria-label="Coach Wrinkles, a brain in a sweatband">
    <ellipse cx="80" cy="164" rx="46" ry="6" fill="var(--c-shade)"/>
    <g class="coach__legs"><path d="M62 128l-4 26h-12" fill="none" stroke="var(--c-edge)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M98 128l4 26h12" fill="none" stroke="var(--c-edge)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M38 151c4-6 16-6 20 0z" fill="#fff" stroke="var(--c-edge)" stroke-width="3" stroke-linejoin="round"/><path d="M102 151c4-6 16-6 20 0z" fill="#fff" stroke="var(--c-edge)" stroke-width="3" stroke-linejoin="round"/></g>
    <g class="coach__body">
      <path class="coach__arm coach__arm--l" d="M28 92c-12 4-18 12-18 22" fill="none" stroke="var(--c-edge)" stroke-width="5" stroke-linecap="round"/>
      <g class="coach__arm coach__arm--r"><path d="M132 92c12-4 18-14 16-26" fill="none" stroke="var(--c-edge)" stroke-width="5" stroke-linecap="round"/><rect x="138" y="44" width="22" height="26" rx="3" fill="#f7f1e1" stroke="var(--c-edge)" stroke-width="3" transform="rotate(14 149 57)"/><path d="M143 54l12 3M142 60l12 3" stroke="#8a8aa3" stroke-width="2" stroke-linecap="round" transform="rotate(14 149 57)"/></g>
      <path d="M80 30c-18-12-44-6-50 14-14 4-20 22-12 36-6 16 6 34 24 36 8 14 30 18 42 8 14 10 36 4 42-10 18-4 26-22 18-38 8-16-2-34-20-36-6-16-28-22-44-10z" fill="#ff8fb1" stroke="var(--c-edge)" stroke-width="4" stroke-linejoin="round"/>
      <path d="M50 52c6 4 8 10 4 16M76 40c-4 8 0 14 8 16M108 50c-6 2-8 10-4 14M42 92c8-2 14 2 16 8M118 94c-8-2-12 2-14 8M80 118c0-6 4-10 10-10" fill="none" stroke="#d9567f" stroke-width="3" stroke-linecap="round"/>
      <path d="M24 56c34-14 80-14 114 0l-3 13c-34-12-74-12-108 0z" fill="var(--ng-band, #13a89e)" stroke="var(--c-edge)" stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M40 58l4 9M58 54l3 9M100 54l-2 9M118 58l-4 9" stroke="rgba(255,255,255,.55)" stroke-width="3" stroke-linecap="round"/>
      <g class="coach__eyes"><ellipse cx="62" cy="84" rx="10" ry="11" fill="#fffdf6" stroke="var(--c-edge)" stroke-width="3"/><ellipse cx="98" cy="84" rx="10" ry="11" fill="#fffdf6" stroke="var(--c-edge)" stroke-width="3"/>
      <circle class="coach__pupil" cx="64" cy="86" r="4.5" fill="var(--c-edge)"/><circle class="coach__pupil" cx="100" cy="86" r="4.5" fill="var(--c-edge)"/></g>
      <path class="coach__brow" d="M52 70l18 4M108 70l-18 4" stroke="var(--c-edge)" stroke-width="3.5" stroke-linecap="round"/>
      <path class="coach__mouth" d="M70 104c6 6 14 6 20 0" fill="none" stroke="var(--c-edge)" stroke-width="3.5" stroke-linecap="round"/>
      <path class="coach__grin" d="M66 101c4 12 24 12 28 0z" fill="#7a1f3d" stroke="var(--c-edge)" stroke-width="3" stroke-linejoin="round"/>
      <ellipse cx="48" cy="98" rx="6" ry="3.5" fill="#ff5d8f" opacity=".6"/><ellipse cx="112" cy="98" rx="6" ry="3.5" fill="#ff5d8f" opacity=".6"/>
      <path d="M80 112v10" stroke="var(--c-edge)" stroke-width="2" opacity="0"/>
      <path d="M62 116c6 8 12 12 18 14" fill="none" stroke="#3a3a4a" stroke-width="2"/>
      <rect x="77" y="126" width="14" height="8" rx="3" fill="#c7cad6" stroke="var(--c-edge)" stroke-width="2.5"/>
    </g>
  </svg>`;

  let sayTimer = 0;
  function say(text, mood = 'talk') {
    const b = document.getElementById('bubble'), c = document.querySelector('.ng-coach');
    if (!b || !c) return;
    b.textContent = text;
    b.classList.remove('is-on'); void b.offsetWidth; b.classList.add('is-on');
    c.dataset.mood = mood;
    clearTimeout(sayTimer);
    sayTimer = setTimeout(() => { c.dataset.mood = 'idle'; }, 2200);
  }
  NG.say = say;
  const LINES = {
    hello: ['Morning, athlete! Stretch those neurons.', 'Welcome to the gym. Mind the dumbbells, they are made of numbers.', 'No sweatbands required. I wear one for style.', 'Every rep makes your noggin a bit shinier.', 'Pick some equipment. I will hold the clipboard.'],
    hi: ['Lovely form!', 'That is what I call a brain workout.', 'The scoreboard is blushing.', 'Somebody has been eating their vegetables.', 'Textbook!'],
    mid: ['Solid rep. Go again?', 'Right in the middle of the pack. Respectable!', 'Good honest work.', 'Not bad, not bad at all.'],
    lo: ['Warm-up round. The next one counts.', 'Shake it off, champ.', 'Even the best have off days.', 'Hydrate and try again.'],
    pb: ['NEW PERSONAL BEST! I am blowing my whistle very loudly.', 'Record smashed! Somebody fetch the confetti.', 'A new best! Put it on the board.'],
    workout: ['Workout complete! Cool down with a nice glass of water.', 'All stations done. Same time tomorrow?', 'That is today\'s workout in the bag.']
  };
  const pickLine = (k) => LINES[k][Math.floor(Math.random() * LINES[k].length)];

  const achBox = () => { let b = document.querySelector('.ng-achs-pop'); if (!b) { b = document.createElement('div'); b.className = 'ng-achs-pop'; b.setAttribute('role', 'status'); document.body.append(b); } return b; };
  function unlock(id) {
    if (P.ach[id]) return false;
    const a = ACH.find((x) => x[0] === id); if (!a) return false;
    P.ach[id] = Date.now(); save();
    const el = document.createElement('div');
    el.className = 'ng-pop';
    el.innerHTML = `<i aria-hidden="true">${medalSvg(id)}</i><span><small>Badge earned</small><b></b></span>`;
    el.querySelector('b').textContent = a[1];
    achBox().append(el);
    setTimeout(() => snd.unlock(), 250);
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 400); }, 3200);
    return true;
  }
  function medalSvg(id) {
    const i = ACH.findIndex((x) => x[0] === id);
    const cols = ['#ff6b2c', '#13a89e', '#7b4fe0', '#2f80ed', '#e8384f', '#e0a100'];
    const c = cols[(i < 0 ? 0 : i) % cols.length];
    return `<svg viewBox="0 0 40 46" aria-hidden="true"><path d="M12 2h7l-3 14h-7zM21 2h7l3 14h-7z" fill="${c}" stroke="var(--c-edge)" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="29" r="14" fill="#ffd45c" stroke="var(--c-edge)" stroke-width="2.5"/><circle cx="20" cy="29" r="9" fill="none" stroke="#c99400" stroke-width="2"/><path d="M20 23l2 4 4.5.6-3.2 3 .8 4.4-4.1-2.2-4.1 2.2.8-4.4-3.2-3 4.5-.6z" fill="#fff8d9"/></svg>`;
  }

  function streakInfo() {
    let cur = 0, i = 0;
    if (!P.days[today()]) i = -1;
    while (P.days[today(i)]) { cur++; i--; }
    const keys = Object.keys(P.days).sort();
    let best = 0, run = 0, prev = null;
    keys.forEach((k) => { const d = new Date(k + 'T12:00:00'); run = prev && (d - prev) / 864e5 < 1.5 ? run + 1 : 1; prev = d; best = Math.max(best, run); });
    return { cur, best: Math.max(best, cur) };
  }
  function skillScores() {
    return SKILLS.map((sk) => {
      const sts = NG.stations.filter((s) => s.skill === sk.id);
      const played = sts.filter((s) => P.sp[s.id] != null);
      const v = played.length ? Math.round(played.reduce((a, s) => a + P.sp[s.id], 0) / played.length) : 0;
      return { ...sk, v, played: played.length, total: sts.length };
    });
  }
  function noggin() { const sk = skillScores(); return Math.round(sk.reduce((a, s) => a + s.v, 0) / sk.length * 10); }
  const nogginRank = (n) => NOGGIN_RANKS.reduce((a, r) => (n >= r[0] ? r : a), NOGGIN_RANKS[0])[1];

  function radarSvg(size = 300, sk = skillScores()) {
    const cx = size / 2, cy = size / 2 + 6, R = size * .34, n = sk.length;
    const pt = (i, r) => { const a = -Math.PI / 2 + i * Math.PI * 2 / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    let rings = '';
    [.25, .5, .75, 1].forEach((f) => { rings += `<path d="${sk.map((_, i) => (i ? 'L' : 'M') + pt(i, R * f).map((v) => v.toFixed(1)).join(' ')).join(' ')}Z" fill="${f === 1 ? 'var(--surface)' : 'none'}" stroke="var(--line)" stroke-width="${f === 1 ? 2.5 : 1.5}" ${f < 1 ? 'stroke-dasharray="3 5"' : ''}/>`; });
    const spokes = sk.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line)" stroke-width="1.5"/>`; }).join('');
    const shape = sk.map((s, i) => (i ? 'L' : 'M') + pt(i, R * Math.max(.04, s.v / 100)).map((v) => v.toFixed(1)).join(' ')).join(' ') + 'Z';
    const dots = sk.map((s, i) => { const [x, y] = pt(i, R * Math.max(.04, s.v / 100)); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${s.color}" stroke="var(--c-edge)" stroke-width="2"/>`; }).join('');
    const labels = sk.map((s, i) => { const [x, y] = pt(i, R + 26); const anc = Math.abs(x - cx) < 8 ? 'middle' : x < cx ? 'end' : 'start'; return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anc}" class="ng-rad-l">${s.short}</text><text x="${x.toFixed(1)}" y="${(y + 20).toFixed(1)}" text-anchor="${anc}" class="ng-rad-v" fill="${s.color}">${s.played ? s.v : '?'}</text>`; }).join('');
    return `<svg class="ng-radar" viewBox="${-40} ${-10} ${size + 80} ${size + 24}" role="img" aria-label="Skill shape: ${sk.map((s) => s.name + ' ' + s.v).join(', ')}">${rings}${spokes}<path class="ng-rad-shape" d="${shape}" fill="rgba(255,107,44,.28)" stroke="#ff6b2c" stroke-width="3.5" stroke-linejoin="round"/>${dots}${labels}</svg>`;
  }

  function bellSvg(pct, color = '#ff6b2c') {
    const W = 600, H = 170, X0 = 20, X1 = 580, Y0 = 138, Y1 = 40;
    const zOf = (p) => { let lo = -4, hi = 4; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (ncdf(m) < p / 100) lo = m; else hi = m; } return (lo + hi) / 2; };
    const x = (z) => X0 + (z + 3) / 6 * (X1 - X0), y = (z) => Y0 - Math.exp(-z * z / 2) * (Y0 - Y1);
    let d = '', area = '';
    const zz = clamp(zOf(pct), -2.95, 2.95);
    for (let z = -3; z <= 3.001; z += .05) d += `${z === -3 ? 'M' : 'L'}${x(z).toFixed(1)} ${y(z).toFixed(1)} `;
    area = `M${x(-3)} ${Y0} `;
    for (let z = -3; z <= zz; z += .05) area += `L${x(z).toFixed(1)} ${y(z).toFixed(1)} `;
    area += `L${x(zz).toFixed(1)} ${y(zz).toFixed(1)} L${x(zz).toFixed(1)} ${Y0} Z`;
    const mx = x(zz), anc = mx > 470 ? 'end' : mx < 130 ? 'start' : 'middle';
    return `<svg class="ng-bell" viewBox="0 0 ${W} ${H + 20}" role="img" aria-label="You beat about ${pct}% of people">
      <path d="${d}L${X1} ${Y0}L${X0} ${Y0}Z" fill="var(--surface-2)"/>
      <path d="${area}" fill="${color}" opacity=".35"/>
      <path d="${d}" fill="none" stroke="var(--ink-3)" stroke-width="3" stroke-linecap="round"/>
      <line x1="${X0}" x2="${X1}" y1="${Y0}" y2="${Y0}" stroke="var(--c-edge)" stroke-width="3" stroke-linecap="round"/>
      <line x1="${mx.toFixed(1)}" x2="${mx.toFixed(1)}" y1="${Y1 - 8}" y2="${Y0}" stroke="var(--c-edge)" stroke-width="3.5"/>
      <circle cx="${mx.toFixed(1)}" cy="${y(zz).toFixed(1)}" r="8" fill="${color}" stroke="var(--c-edge)" stroke-width="3"/>
      <text x="${mx.toFixed(1)}" y="${Y1 - 12}" text-anchor="${anc}" class="ng-bell-you">you</text>
      <text x="${X0}" y="${Y0 + 24}" class="ng-bell-ax">fewer people</text><text x="${X1}" y="${Y0 + 24}" text-anchor="end" class="ng-bell-ax">better</text>
    </svg>`;
  }
  function spark(vals, color, lower) {
    if (vals.length < 2) return '<p class="c-muted ng-small">Play a couple more rounds to see a trend line here.</p>';
    const mx = Math.max(...vals), mn = Math.min(...vals);
    const x = (i) => 10 + i / (vals.length - 1) * 580, y = (v) => { const t = (v - mn) / Math.max(1e-9, mx - mn); return 90 - (lower ? 1 - t : t) * 72; };
    const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
    return `<svg class="ng-spark" viewBox="0 0 600 100" role="img" aria-label="Recent scores trend"><path d="${d}L${x(vals.length - 1)} 98L10 98Z" fill="${color}" opacity=".14"/><path d="${d}" fill="none" stroke="${color}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>${vals.map((v, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="${i === vals.length - 1 ? 7 : 4}" fill="${i === vals.length - 1 ? 'var(--accent)' : color}" stroke="var(--c-edge)" stroke-width="2"/>`).join('')}</svg>`;
  }

  function workoutFor(seedStr) {
    const r = seeded('noggin-workout-' + seedStr);
    const pools = [['reaction', 'click', 'aim'], ['chimp', 'number', 'verbal', 'visual', 'sequence'], ['stop', 'beat', 'angle', 'odd', 'color', 'math', 'typing']];
    return shuffle(pools.map((p) => p[Math.floor(r() * p.length)]), r).filter(byId);
  }

  function header() {
    return `<header class="ng-hero">
      <div class="ng-hero__text">
        <p class="ng-kicker">Zoble presents</p>
        <h1 class="c-title ng-title">Noggin Gym</h1>
        <p class="c-sub ng-sub">${simple() ? 'A two minute brain workout. Three stations a day, one score, no excuses.' : 'Fifteen pieces of brain equipment: reflexes, aim, memory, timing, eyes and wits. Lift, log, repeat.'}</p>
      </div>
      <div class="ng-coach" data-mood="idle">${COACH}<div class="ng-bubble" id="bubble" role="status"></div></div>
    </header>`;
  }

  function stationArt(s, cls = '') { return `<span class="ng-art ${cls}" aria-hidden="true">${s.art}</span>`; }
  function bestLine(s, modeId) {
    const b = P.best[s.id + ':' + modeId];
    if (!b) return '';
    const m = s.modes.find((x) => x.id === modeId);
    return `${s.fmt ? s.fmt(b.v, modeId) : b.v}${m && m.unit ? ' ' + m.unit : ''}`;
  }

  function scoreboard() {
    const st = streakInfo(), n = noggin();
    const tried = NG.stations.filter((s) => P.plays[s.id]).length;
    return `<section class="ng-board" aria-label="Scoreboard">
      <div class="ng-board__cell ng-board__cell--big"><b>${n}</b><span>Noggin score</span><em>${nogginRank(n)}</em></div>
      <div class="ng-board__cell"><b>${st.cur}</b><span>day streak</span></div>
      <div class="ng-board__cell"><b>${tried}<small>/${NG.stations.length}</small></b><span>stations tried</span></div>
      <div class="ng-board__cell"><b>${Object.keys(P.ach).length}<small>/${ACH.length}</small></b><span>badges</span></div>
    </section>`;
  }

  function workoutCard() {
    const list = workoutFor(today());
    const doneToday = P.wk[today()];
    return `<section class="ng-wk" aria-label="Today's workout">
      <div class="ng-wk__tape" aria-hidden="true"></div>
      <div class="ng-wk__head"><h2>Today's workout</h2><p>${doneToday != null ? `Done today: <b>${doneToday}</b> points. Go again to beat it, or try a fresh mix.` : 'Three quick stations, about two minutes, one combined score. Same mix for everyone today.'}</p></div>
      <ol class="ng-wk__list">${list.map((id, i) => { const s = byId(id); return `<li style="--sc:${s.color}">${stationArt(s)}<span><b>${i + 1}. ${s.name}</b><small>${s.test}</small></span></li>`; }).join('')}</ol>
      <div class="c-row ng-wk__btns"><button class="c-btn ng-big" type="button" data-act="workout">${doneToday != null ? 'Go again' : 'Start workout'}</button><button class="c-btn c-btn--ghost" type="button" data-act="shuffle">Random mix</button></div>
    </section>`;
  }

  function floor() {
    const chips = [['all', 'Everything']].concat(SKILLS.map((s) => [s.id, s.name]));
    const list = NG.stations.filter((s) => skillFilter === 'all' || s.skill === skillFilter);
    return `<div class="ng-chips" role="group" aria-label="Filter by skill">${chips.map(([id, n]) => `<button type="button" class="ng-chip" data-skill="${id}" aria-pressed="${skillFilter === id}">${n}</button>`).join('')}</div>
      <div class="ng-floor">${list.map((s) => {
        const p = P.sp[s.id];
        const lm = P.last[s.id] || s.modes[0].id;
        const bl = bestLine(s, lm);
        const sk = SKILLS.find((k) => k.id === s.skill);
        return `<button type="button" class="ng-st" data-open="${s.id}" style="--sc:${s.color}">
          <span class="ng-st__art">${stationArt(s)}<em style="--kc:${sk.color}">${sk.name}</em></span>
          <span class="ng-st__name">${s.name}</span>
          <span class="ng-st__test">${s.test}</span>
          <span class="ng-st__best">${bl ? 'Best ' + bl : s.modes.length + ' modes, not tried yet'}</span>
          <span class="ng-meter" aria-hidden="true"><i style="width:${p != null ? p : 0}%"></i></span>
        </button>`;
      }).join('')}</div>`;
  }

  function simpleStrip() {
    return `<section class="ng-strip"><h3>Or just one station</h3><div class="ng-strip__row">${NG.stations.map((s) => `<button type="button" class="ng-mini" data-quick="${s.id}" style="--sc:${s.color}" title="${s.name}: ${s.test}">${stationArt(s)}<span>${s.name}</span></button>`).join('')}</div></section>`;
  }

  function home(tab) {
    cleanup();
    if (tab) homeTab = tab;
    cur = null;
    const v = view();
    const sk = skillScores(), n = noggin();
    if (simple()) {
      v.innerHTML = header() + workoutCard() + `<section class="ng-mini-prof"><div>${radarSvg(240, sk)}</div><div><b class="ng-n">${n}</b><span class="ng-n-l">Noggin score · ${nogginRank(n)}</span><p class="c-muted ng-small">Your brain shape fills in as you play. Switch to Advanced for every mode, full stats and badges.</p><p class="ng-small">Day streak: <b>${streakInfo().cur}</b></p></div></section>` + simpleStrip();
    } else {
      v.innerHTML = header() + scoreboard() + workoutCard() + `<div class="ng-tabs" role="tablist"><button type="button" role="tab" data-tab="floor" aria-selected="${homeTab === 'floor'}">Gym floor</button><button type="button" role="tab" data-tab="locker" aria-selected="${homeTab === 'locker'}">Locker room</button></div><div id="tabBody">${homeTab === 'floor' ? floor() : locker()}</div>`;
      if (homeTab === 'locker') afterLocker();
    }
    say(P.tot.tests ? pickLine('hello') : 'Hi! I am Coach Wrinkles. Start with today\'s workout, it only takes two minutes.', 'talk');
    if (!P.seenTip && !simple()) { P.seenTip = true; save(); setTimeout(() => C.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar'), 1200); }
  }

  function locker() {
    const sk = skillScores(), n = noggin(), st = streakInfo();
    const cal = [];
    for (let i = 27; i >= 0; i--) { const k = today(-i); cal.push({ k, c: P.days[k] || 0, d: Number(k.slice(-2)) }); }
    const hist = P.hist.slice(-12).reverse();
    return `<div class="ng-locker">
      <section class="ng-panel ng-prof">
        <div class="ng-prof__radar">${radarSvg(300, sk)}</div>
        <div class="ng-prof__side">
          <p class="ng-kicker">Noggin score</p>
          <div class="ng-n">${n}<small>/1000</small></div>
          <p class="ng-n-l">${nogginRank(n)}</p>
          <ul class="ng-skills">${sk.map((s) => `<li><span>${s.name}</span><i style="--w:${s.v}%;--c:${s.color}"></i><b>${s.played ? s.v : '-'}</b></li>`).join('')}</ul>
          <p class="c-muted ng-small">Each skill is the average of your best percentile on its stations. Unplayed skills count as zero, so try everything.</p>
          <div class="c-row"><button type="button" class="c-btn" data-act="shareProfile">Copy my scorecard</button></div>
        </div>
      </section>
      <section class="ng-panel"><h3>Personal bests</h3><div class="ng-tablewrap"><table class="ng-table"><thead><tr><th>Station</th><th>Mode</th><th>Best</th><th>Beat</th><th>Reps</th></tr></thead><tbody>${NG.stations.map((s) => {
        const rows = s.modes.filter((m) => P.best[s.id + ':' + m.id]);
        if (!rows.length) return `<tr class="is-dim"><td><span class="ng-dot" style="background:${s.color}"></span>${s.name}</td><td>-</td><td>-</td><td>-</td><td>0</td></tr>`;
        return rows.map((m, i) => { const b = P.best[s.id + ':' + m.id]; return `<tr><td>${i ? '' : `<span class="ng-dot" style="background:${s.color}"></span>${s.name}`}</td><td>${m.name}</td><td><b>${s.fmt ? s.fmt(b.v, m.id) : b.v}</b> ${m.unit || ''}</td><td>${b.p}%</td><td>${i ? '' : P.plays[s.id] || 0}</td></tr>`; }).join('');
      }).join('')}</tbody></table></div></section>
      <div class="ng-two">
        <section class="ng-panel"><h3>Attendance</h3><div class="ng-streak"><div><b>${st.cur}</b><span>day streak</span></div><div><b>${st.best}</b><span>best streak</span></div><div><b>${P.tot.tests}</b><span>tests</span></div><div><b>${P.tot.workouts}</b><span>workouts</span></div></div>
          <div class="ng-cal" aria-label="Last four weeks">${cal.map((c) => `<i class="${c.c ? 'on' : ''} ${c.k === today() ? 'today' : ''}" style="--o:${Math.min(1, .35 + c.c * .12)}" title="${c.k}: ${c.c} tests">${c.d}</i>`).join('')}</div></section>
        <section class="ng-panel"><h3>Training log</h3>${hist.length ? `<ul class="ng-log">${hist.map((h) => { const s = byId(h.s); if (!s) return ''; const m = s.modes.find((x) => x.id === h.m); return `<li><span class="ng-dot" style="background:${s.color}"></span><b>${s.name}</b><span>${m ? m.name : ''}</span><em>${s.fmt ? s.fmt(h.v, h.m) : h.v} ${m && m.unit ? m.unit : ''}</em><small>${h.p}%</small></li>`; }).join('')}</ul>` : '<p class="c-muted">Nothing logged yet. The clipboard is waiting.</p>'}</section>
      </div>
      <section class="ng-panel"><h3>Badges <small>${Object.keys(P.ach).length} of ${ACH.length}</small></h3><div class="ng-achs">${ACH.map((a) => `<div class="ng-ach ${P.ach[a[0]] ? 'got' : ''}">${medalSvg(a[0])}<b>${P.ach[a[0]] ? a[1] : a[1]}</b><span>${a[2]}</span></div>`).join('')}</div></section>
      <p class="ng-reset"><button type="button" class="c-btn c-btn--ghost" data-act="reset">Clear my gym records</button></p>
    </div>`;
  }
  function afterLocker() {}

  function stationView(id) {
    cleanup();
    const s = byId(id); if (!s) return home();
    cur = { s };
    const mId = P.last[s.id] && s.modes.some((m) => m.id === P.last[s.id]) ? P.last[s.id] : s.modes[0].id;
    const opts = Object.assign({}, defOpts(s), P.opts[s.id] || {});
    const v = view();
    const paint = () => {
      const m = s.modes.find((x) => x.id === cur.mode) || s.modes[0];
      const hk = P.hist.filter((h) => h.s === s.id && h.m === m.id).slice(-15);
      const optsShown = (s.options || []).filter((o) => !o.modes || o.modes.includes(m.id));
      v.innerHTML = `<div class="ng-top"><button type="button" class="c-btn c-btn--ghost ng-back" data-act="home">Back to the gym</button></div>
      <section class="ng-stv" style="--sc:${s.color}">
        <div class="ng-stv__head">${stationArt(s, 'ng-art--big')}<div><p class="ng-kicker">${s.test} · ${SKILLS.find((k) => k.id === s.skill).name}</p><h2 class="ng-stv__title">${s.name}</h2><p>${s.blurb}</p></div></div>
        <div class="ng-modes" role="radiogroup" aria-label="Mode">${s.modes.map((mm, i) => `<button type="button" role="radio" class="ng-mode" data-mode="${mm.id}" aria-checked="${mm.id === m.id}"><b>${mm.name}</b><span>${mm.desc}</span><em>${bestLine(s, mm.id) ? 'Best ' + bestLine(s, mm.id) : 'No record'}</em><kbd>${i + 1}</kbd></button>`).join('')}</div>
        ${optsShown.length ? `<div class="ng-opts">${optsShown.map((o) => `<div class="ng-opt"><span>${o.label}</span><div class="ng-seg" role="group" aria-label="${o.label}">${o.choices.map(([val, lab]) => `<button type="button" data-opt="${o.id}" data-val="${val}" aria-pressed="${String(opts[o.id]) === String(val)}">${lab}</button>`).join('')}</div></div>`).join('')}</div>` : ''}
        <div class="ng-how"><h3>How it works</h3><p>${m.how || s.how}</p>${s.keys ? `<p class="ng-keys">${s.keys}</p>` : ''}</div>
        <div class="c-row ng-go"><button type="button" class="c-btn ng-big" data-act="start">Start ${m.name}</button><span class="c-muted ng-small">or press <span class="c-kbd">Enter</span></span></div>
        <div class="ng-trend"><h3>Your ${m.name} trend</h3>${spark(hk.map((h) => h.v), s.color, m.lower)}</div>
      </section>`;
    };
    cur.mode = mId; cur.opts = opts;
    paint();
    cur.repaint = paint;
    say(s.coach || pickLine('hello'), 'talk');
    window.scrollTo({ top: 0, behavior: C.calm ? 'auto' : 'smooth' });
  }
  const defOpts = (s) => Object.fromEntries((s.options || []).map((o) => [o.id, o.def]));

  let ctxNow = null;
  function cleanup() {
    if (ctxNow) { ctxNow._dead = true; ctxNow._clean.forEach((f) => { try { f(); } catch {} }); ctxNow = null; }
  }

  function startPlay(s, modeId, opts, flags = {}) {
    cleanup();
    const m = s.modes.find((x) => x.id === modeId) || s.modes[0];
    const v = view();
    const quick = !!flags.quick;
    const seedStr = flags.seed || null;
    v.innerHTML = `<section class="ng-play" style="--sc:${s.color}">
      <div class="ng-play__bar">${stationArt(s, 'ng-art--sm')}<div class="ng-play__t"><b>${s.name}</b><span>${quick ? 'Quick ' + m.name : m.name}${wk ? ` · station ${wk.i + 1} of ${wk.list.length}` : ''}</span></div><div class="ng-hud" id="hud" aria-live="polite"></div><button type="button" class="ng-x" data-act="quit" aria-label="Stop and go back" title="Stop (Esc)">${C.icon ? C.icon('close') : 'x'}</button></div>
      ${wk ? `<div class="ng-wkprog" aria-hidden="true">${wk.list.map((id, i) => `<i class="${i < wk.i ? 'done' : i === wk.i ? 'now' : ''}" style="--sc:${byId(id).color}"></i>`).join('')}</div>` : ''}
      <div class="ng-stage" id="stage"></div>
    </section>`;
    const stage = document.getElementById('stage');
    const ctx = {
      s, mode: m.id, m, opts: Object.assign(defOpts(s), opts || {}), quick, stage,
      rng: seedStr ? seeded(seedStr + s.id + m.id) : Math.random,
      snd, tone, noise, buzz, say, u: NG.u, C,
      _clean: [], _keys: [], _dead: false, hideSafe: false,
      later(fn, ms) { const t = setTimeout(() => { if (!ctx._dead) fn(); }, ms); ctx._clean.push(() => clearTimeout(t)); return t; },
      frame(fn) { let id = 0, on = true; const loop = (t) => { if (!on || ctx._dead) return; if (fn(t) === false) { on = false; return; } id = requestAnimationFrame(loop); }; id = requestAnimationFrame(loop); const stop = () => { on = false; cancelAnimationFrame(id); }; ctx._clean.push(stop); return stop; },
      onKey(fn) { ctx._keys.push(fn); },
      onCleanup(fn) { ctx._clean.push(fn); },
      hud(html) { const h = document.getElementById('hud'); if (h) h.innerHTML = html; },
      finish(res) { if (ctx._dead) return; ctx._dead = true; ctx._clean.forEach((f) => { try { f(); } catch {} }); ctxNow = null; record(s, m, ctx, res); }
    };
    ctxNow = ctx;
    P.last[s.id] = m.id; if (!quick) P.opts[s.id] = ctx.opts; save();
    if (flags.intro) {
      stage.innerHTML = `<div class="ng-ready">${stationArt(s, 'ng-art--big')}<p class="ng-kicker">${s.test}</p><h2>${s.name}</h2><p>${(s.quickHow || m.how || s.how)}</p>${s.keys ? `<p class="ng-keys">${s.keys}</p>` : ''}<button type="button" class="c-btn ng-big" id="readyGo">I'm ready</button><p class="c-muted ng-small">or press <span class="c-kbd">Enter</span></p></div>`;
      const go = () => { if (ctx._dead) return; ctx._keys = []; stage.innerHTML = ''; snd.peep(); s.play(ctx); };
      document.getElementById('readyGo').addEventListener('click', go);
      ctx._keys.push((e) => { if (e.key === 'Enter' || e.code === 'Space') { e.preventDefault(); go(); return true; } });
      setTimeout(() => document.getElementById('readyGo')?.focus({ preventScroll: true }), 30);
    } else { snd.peep(); s.play(ctx); }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function record(s, m, ctx, res) {
    const key = s.id + ':' + m.id;
    const pct = clamp(Math.round(res.pct), 1, 99);
    const lower = !!m.lower;
    const prev = P.best[key];
    const valid = res.valid !== false && res.score != null && isFinite(res.score);
    let isPB = false;
    if (valid && (!prev || (lower ? res.score < prev.v : res.score > prev.v))) { isPB = !!prev; P.best[key] = { v: res.score, p: pct, t: Date.now() }; if (isPB) P.tot.pbs++; }
    else if (valid && prev && pct > prev.p && res.score === prev.v) prev.p = pct;
    if (valid) {
      P.hist.push({ s: s.id, m: m.id, v: res.score, p: pct, t: Date.now(), q: ctx.quick ? 1 : 0 });
      if (P.hist.length > 400) P.hist.splice(0, P.hist.length - 400);
      P.sp[s.id] = Math.max(P.sp[s.id] || 0, pct);
    }
    P.plays[s.id] = (P.plays[s.id] || 0) + 1;
    P.tot.tests++;
    P.days[today()] = (P.days[today()] || 0) + 1;
    save();
    const hr = new Date().getHours();
    unlock('first');
    const tried = NG.stations.filter((x) => P.plays[x.id]).length;
    if (tried >= 5) unlock('five');
    if (tried >= NG.stations.length) unlock('circuit');
    if (SKILLS.every((k) => NG.stations.some((x) => x.skill === k.id && P.plays[x.id]))) unlock('allskills');
    const stI = streakInfo();
    if (stI.cur >= 3) unlock('streak3');
    if (stI.cur >= 7) unlock('streak7');
    const n = noggin();
    if (n >= 450) unlock('n500');
    if (n >= 750) unlock('n700');
    if (valid && pct >= 90) unlock('top10');
    if (valid && pct >= 99) unlock('top1');
    if (P.tot.pbs >= 10) unlock('pb10');
    if (P.tot.tests >= 50) unlock('reg50');
    if (P.tot.tests >= 200) unlock('reg200');
    if (hr >= 22) unlock('owl');
    if (hr >= 4 && hr < 8) unlock('lark');
    (res.feats || []).forEach((f) => unlock(f));
    if (wk) { wk.results.push({ s: s.id, m: m.id, res, pct: valid ? pct : 1 }); }
    showResult(s, m, ctx, res, pct, isPB, prev);
  }

  function showResult(s, m, ctx, res, pct, isPB, prev) {
    const v = view();
    const r = rankOf(pct);
    const key = s.id + ':' + m.id;
    const b = P.best[key];
    const hk = P.hist.filter((h) => h.s === s.id && h.m === m.id).slice(-15);
    const inWk = !!wk, last = inWk && wk.i >= wk.list.length - 1;
    const next = inWk ? (last ? 'See workout score' : 'Next station') : 'Go again';
    v.innerHTML = `<section class="ng-res" style="--sc:${s.color}">
      <div class="ng-res__card">
        <div class="ng-res__ribbon">${stationArt(s, 'ng-art--sm')}<span>${s.name} · ${ctx.quick ? 'Quick ' : ''}${m.name}</span></div>
        <div class="ng-res__main">
          <div class="ng-res__score"><b>${esc(res.display != null ? res.display : res.score)}</b><span>${esc(res.unit || m.unit || '')}</span></div>
          <div class="ng-res__rank"><span class="ng-stamp ${isPB ? 'is-pb' : ''}">${isPB ? 'New best!' : esc(r[1])}</span><p>${res.valid === false ? 'That one did not count. Give it another go.' : `Better than <b>${pct}%</b> of people.`} ${esc(r[2])}</p>${b ? `<p class="c-muted ng-small">Your best ${m.name}: <b>${s.fmt ? s.fmt(b.v, m.id) : b.v} ${m.unit || ''}</b>${isPB && prev ? `, up from ${s.fmt ? s.fmt(prev.v, m.id) : prev.v}` : ''}</p>` : ''}</div>
        </div>
        ${res.valid === false ? '' : bellSvg(pct, s.color)}
        ${res.stats && res.stats.length ? `<div class="ng-tiles">${res.stats.map(([k, val]) => `<div><b>${esc(val)}</b><span>${esc(k)}</span></div>`).join('')}</div>` : ''}
        ${res.note ? `<p class="ng-note">${esc(res.note)}</p>` : ''}
        ${!simple() && !inWk ? `<div class="ng-trend"><h3>Trend</h3>${spark(hk.map((h) => h.v), s.color, m.lower)}</div>` : ''}
        <div class="c-row ng-res__btns"><button type="button" class="c-btn ng-big" data-act="${inWk ? 'wkNext' : 'again'}">${next}</button>${inWk ? '<button type="button" class="c-btn c-btn--ghost" data-act="wkQuit">Stop workout</button>' : `<button type="button" class="c-btn c-btn--ghost" data-act="${simple() ? 'home' : 'station'}">${simple() ? 'Back to the gym' : 'Change mode'}</button>`}<button type="button" class="c-btn c-btn--ghost" data-act="share">Share</button></div>
      </div>
    </section>`;
    cur = { s, mode: m.id, opts: ctx.opts, quick: ctx.quick, res, pct };
    if (isPB) { snd.cheer(); C.confetti(); say(pickLine('pb'), 'cheer'); }
    else if (pct >= 70) { snd.bell(); say(pickLine('hi'), 'cheer'); if (pct >= 90) C.confetti(80); }
    else if (pct >= 35) { snd.clang(); say(pickLine('mid'), 'talk'); }
    else { snd.thud(); say(pickLine('lo'), 'sad'); }
    window.scrollTo({ top: 0, behavior: 'auto' });
    setTimeout(() => v.querySelector('.ng-res__btns .c-btn')?.focus({ preventScroll: true }), 50);
  }

  function shareText() {
    if (!cur || !cur.res) return '';
    const s = cur.s, m = s.modes.find((x) => x.id === cur.mode);
    return `Noggin Gym, ${s.name} (${s.test}, ${m.name}): ${cur.res.display != null ? cur.res.display : cur.res.score} ${cur.res.unit || m.unit || ''}. Better than ${cur.pct}% of people. Train your brain on Zoble.`;
  }
  async function copy(t) { try { await navigator.clipboard.writeText(t); C.toast('Copied to your clipboard'); } catch { C.toast(t, 5000); } }

  function startWorkout(seedStr) {
    const list = workoutFor(seedStr);
    wk = { seed: seedStr, list, i: 0, results: [], daily: seedStr === today() };
    snd.whistle();
    runWorkoutStation();
  }
  function runWorkoutStation() {
    const s = byId(wk.list[wk.i]);
    startPlay(s, s.quick.mode, s.quick.opts, { quick: true, intro: true, seed: wk.daily ? wk.seed : null });
    say(`Station ${wk.i + 1}: ${s.name}. ${s.coach || 'Give it everything.'}`, 'talk');
  }
  function workoutDone() {
    const w = wk; wk = null;
    const score = Math.round(w.results.reduce((a, r) => a + r.pct, 0) / Math.max(1, w.results.length) * 10);
    const prev = w.daily ? P.wk[today()] : null;
    if (w.daily) { if (prev == null || score > prev) P.wk[today()] = score; }
    P.tot.workouts++;
    save();
    unlock('workout');
    if (P.tot.workouts >= 5) unlock('workout5');
    const r = rankOf(score / 10);
    const v = view();
    v.innerHTML = `<section class="ng-res ng-wkres">
      <div class="ng-res__card">
        <div class="ng-res__ribbon"><span>${w.daily ? `Daily workout · ${today()}` : 'Random workout'}</span></div>
        <div class="ng-res__main">
          <div class="ng-res__score"><b>${score}</b><span>workout points out of 1000</span></div>
          <div class="ng-res__rank"><span class="ng-stamp">${esc(r[1])}</span><p>${esc(r[2])}</p>${w.daily && prev != null ? `<p class="c-muted ng-small">${score > prev ? `Beat your earlier ${prev} today!` : `Your best today is still ${prev}.`}</p>` : ''}</div>
        </div>
        <div class="ng-wkrows">${w.results.map((x) => { const s = byId(x.s), m = s.modes.find((y) => y.id === x.m); return `<div class="ng-wkrow" style="--sc:${s.color}">${stationArt(s, 'ng-art--sm')}<span><b>${s.name}</b><small>${s.test}</small></span><em>${esc(x.res.display != null ? x.res.display : x.res.score)} <small>${esc(x.res.unit || m.unit || '')}</small></em><i class="ng-meter"><i style="width:${x.pct}%"></i></i><strong>${x.pct}%</strong></div>`; }).join('')}</div>
        <div class="ng-mini-prof ng-mini-prof--in">${radarSvg(220)}<div><b class="ng-n">${noggin()}</b><span class="ng-n-l">Noggin score · ${nogginRank(noggin())}</span><p class="ng-small">Day streak: <b>${streakInfo().cur}</b></p></div></div>
        <div class="c-row ng-res__btns"><button type="button" class="c-btn ng-big" data-act="home">Back to the gym</button><button type="button" class="c-btn c-btn--ghost" data-act="shuffle">Random mix</button><button type="button" class="c-btn c-btn--ghost" data-act="shareWk">Share</button></div>
      </div>
    </section>`;
    cur = { wkShare: `Noggin Gym ${w.daily ? 'daily workout ' + today() : 'workout'}: ${score}/1000 (${r[1]}). ${w.results.map((x) => `${byId(x.s).name} ${x.pct}%`).join(', ')}. Train your brain on Zoble.` };
    snd.whistle(); setTimeout(() => snd.cheer(), 500);
    C.confetti();
    say(pickLine('workout'), 'cheer');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function profileShare() {
    const sk = skillScores(), n = noggin();
    return `My Noggin Gym scorecard: ${n}/1000 (${nogginRank(n)}). ${sk.map((s) => `${s.name} ${s.played ? s.v : '-'}`).join(', ')}. Day streak ${streakInfo().cur}. Train your brain on Zoble.`;
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('button, [data-act]');
    if (!t || !view().contains(t)) return;
    const act = t.dataset.act;
    if (t.dataset.open) { C.sfx && C.sfx('tap'); stationView(t.dataset.open); return; }
    if (t.dataset.quick) { const s = byId(t.dataset.quick); wk = null; startPlay(s, s.quick.mode, s.quick.opts, { quick: true, intro: true }); return; }
    if (t.dataset.skill) { skillFilter = t.dataset.skill; document.getElementById('tabBody').innerHTML = floor(); snd.tap(); return; }
    if (t.dataset.tab) { homeTab = t.dataset.tab; home(); snd.tap(); return; }
    if (t.dataset.mode && cur && cur.repaint) { cur.mode = t.dataset.mode; cur.repaint(); snd.tap(); return; }
    if (t.dataset.opt && cur && cur.repaint) { const o = (cur.s.options || []).find((x) => x.id === t.dataset.opt); const raw = t.dataset.val; cur.opts[t.dataset.opt] = typeof o.def === 'number' ? Number(raw) : raw === 'true' ? true : raw === 'false' ? false : raw; P.opts[cur.s.id] = cur.opts; save(); cur.repaint(); snd.tap(); return; }
    if (!act) return;
    if (act === 'home') { wk = null; home(); }
    else if (act === 'workout') startWorkout(today());
    else if (act === 'shuffle') startWorkout('r' + Math.random().toString(36).slice(2, 8));
    else if (act === 'start' && cur) { wk = null; startPlay(cur.s, cur.mode, cur.opts, {}); }
    else if (act === 'quit') { cleanup(); if (wk) { wk = null; home(); } else if (simple() || !cur || !cur.s) home(); else stationView(cur.s.id); }
    else if (act === 'again' && cur) startPlay(cur.s, cur.mode, cur.opts, { quick: cur.quick, intro: false });
    else if (act === 'station' && cur) stationView(cur.s.id);
    else if (act === 'wkNext' && wk) { wk.i++; if (wk.i >= wk.list.length) workoutDone(); else runWorkoutStation(); }
    else if (act === 'wkQuit') { wk = null; home(); }
    else if (act === 'share') copy(shareText());
    else if (act === 'shareWk' && cur) copy(cur.wkShare);
    else if (act === 'shareProfile') copy(profileShare());
    else if (act === 'reset') {
      C.modal({ title: 'Clear the gym records?', body: 'Personal bests, history, streaks and badges for Noggin Gym go in the bin. This cannot be undone.', buttons: [{ label: 'Yes, clear them', value: 'yes' }, { label: 'Keep them', value: 'no' }] }).then((v) => { if (v !== 'yes') return; P = fresh(); P.seenTip = true; save(); C.toast('Fresh logbook. Time to set some records.'); home('locker'); });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (document.querySelector('.curio-modal, .curio-sheet')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (ctxNow) {
      if (e.key === 'Escape') { e.preventDefault(); document.querySelector('[data-act="quit"]')?.click(); return; }
      for (const fn of ctxNow._keys.slice()) { if (fn(e) === true) return; }
      return;
    }
    const inField = e.target.closest && e.target.closest('input, textarea, select');
    if (inField) return;
    if (cur && cur.repaint && /^[1-9]$/.test(e.key)) { const m = cur.s.modes[Number(e.key) - 1]; if (m) { cur.mode = m.id; cur.repaint(); snd.tap(); } return; }
    if (e.key === 'Enter' && !(e.target.closest && e.target.closest('button, a'))) {
      const b = view().querySelector('[data-act="start"], [data-act="again"], [data-act="wkNext"], [data-act="workout"]');
      if (b) { e.preventDefault(); b.click(); }
    }
    if (e.key === 'Escape' && cur && cur.repaint) { home(); }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden || !ctxNow || ctxNow.hideSafe) return;
    const c = ctxNow, s = c.s;
    cleanup();
    c.stage.innerHTML = `<div class="ng-ready"><h2>Time out!</h2><p>You looked away, so the clock stopped and this rep was thrown out. Timed tests restart to keep things honest.</p><button type="button" class="c-btn ng-big" id="again2">Restart ${esc(s.name)}</button></div>`;
    document.getElementById('again2').addEventListener('click', () => startPlay(s, c.mode, c.opts, { quick: c.quick, intro: false, seed: wk && wk.daily ? wk.seed : null }));
  });

  document.addEventListener('pointerdown', (e) => { const c = e.target.closest && e.target.closest('.ng-coach'); if (c) { snd.whistle(); say(pickLine(Math.random() < .5 ? 'hello' : 'hi'), 'cheer'); } });

  NG.boot = () => { home(); };
  NG.debug = { get P() { return P; }, get ctx() { return ctxNow; }, get wk() { return wk; }, startPlay, byId, home, stationView, startWorkout, noggin };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => NG.boot());
  else setTimeout(() => NG.boot(), 0);
})();
