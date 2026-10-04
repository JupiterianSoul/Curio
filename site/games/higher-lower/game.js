(() => {
  const C = window.Curio, $ = (id) => document.getElementById(id);
  const M = window.HL_MORE;
  const YEAR = new Date().getFullYear();
  const G = (a, b) => `linear-gradient(150deg, ${a}, ${b})`;
  const num = (v, d = 0) => C.fmt(v, d);
  const contName = (c) => ({ AF: 'Africa', AS: 'Asia', EU: 'Europe', NA: 'North America', SA: 'South America', OC: 'Oceania' }[c] || '');
  function structEmoji(n) {
    const map = [[/Eiffel|Skytree|Canton|CN Tower|Ostankino|Berlin TV|Space Needle|Tokyo Tower|Oriental Pearl|Milad|Macau|Sky Tower|Sydney Tower|Strat|Blackpool/, '🗼'], [/Liberty/, '🗽'], [/Pyramid|Sphinx/, '🔺'],
      [/Bridge/, '🌉'], [/Cathedral|Minster|Basilica/, '⛪'], [/Colosseum/, '🏟️'], [/Taj/, '🕌'], [/Big Ben/, '🕰️'], [/Eye/, '🎡'],
      [/Dam/, '💧'], [/Christ|Unity|Motherland|Angel/, '🗿'], [/Pisa|Arc de|Brandenburg/, '🏛️'], [/Atomium/, '⚛️'], [/Arch/, '🌈'], [/Burj Al Arab|Marina/, '🏨']];
    for (const [re, e] of map) if (re.test(n)) return e;
    return '🏙️';
  }
  const peakEmoji = (n, v) => (v > 8000 ? '🏔️' : /Etna|Vesuvius|Fuji|Popoc|Cotopaxi|Helens|Rainier|Mauna|Kilimanjaro|Damavand|Ararat|Orizaba|Chimborazo|Ojos|Erebus|Teide|Mayon|Pinatubo|Ruapehu|Kerinci|Cameroon|Shasta|Hood|Kazbek/.test(n) ? '🌋' : '⛰️');
  const yearTxt = (y) => (y < 0 ? `c. ${-y} BC` : y < 1500 ? `c. ${y}` : String(y));
  const money = (v) => (v >= 1000 ? `$${(v / 1000).toFixed(2)} billion` : `$${Math.round(v)} million`);
  function weight(v) {
    if (v >= 1000) return `${num(v / 1000, v < 10000 ? 1 : 0)} tonnes`;
    if (v >= 1) return `${num(v, v < 10 && v % 1 ? 1 : 0)} kg`;
    if (v >= 0.001) return `${num(v * 1000)} g`;
    return `${num(v * 1000, 1)} g`;
  }
  const speedF = (v) => (v < 1 ? num(v, 2) : v < 100 && v % 1 ? num(v, 1) : num(v));

  const ART = {
    crowd: '<g fill="#fff">' + Array.from({ length: 11 }, (_, i) => `<circle cx="${18 + i * 37}" cy="${120 + (i % 3) * 10}" r="14"/><rect x="${2 + i * 37}" y="${138 + (i % 3) * 10}" width="32" height="70" rx="14"/>`).join('') + '</g>',
    map: '<g fill="none" stroke="#fff" stroke-width="3">' + Array.from({ length: 6 }, (_, i) => `<path d="M-10 ${60 + i * 26} C80 ${30 + i * 26} 140 ${110 + i * 22} 220 ${70 + i * 24} S360 ${40 + i * 26} 420 ${80 + i * 22}"/>`).join('') + '</g>',
    skyline: '<g fill="#fff">' + [[0, 90, 40], [42, 60, 30], [76, 120, 36], [116, 40, 24], [144, 150, 30], [178, 80, 44], [226, 130, 26], [256, 70, 40], [300, 170, 22], [326, 100, 36], [366, 60, 34]].map(([x, h, w]) => `<rect x="${x}" y="${200 - h}" width="${w}" height="${h}" rx="2"/>`).join('') + '</g>',
    peaks: '<path fill="#fff" d="M0 200 L60 110 L95 150 L160 50 L215 130 L260 90 L330 160 L370 120 L400 150 L400 200Z"/><path fill="#fff" opacity=".6" d="M148 68 L160 50 L172 68 L165 64 L160 70 L154 64Z"/>',
    film: '<g fill="#fff"><rect x="-10" y="90" width="420" height="80" rx="6"/></g><g fill="#000" opacity=".5">' + Array.from({ length: 14 }, (_, i) => `<rect x="${i * 30}" y="96" width="16" height="12" rx="2"/><rect x="${i * 30}" y="152" width="16" height="12" rx="2"/>`).join('') + '</g><path fill="#fff" d="M330 20 l10 22 24 3 -18 16 5 24 -21 -12 -21 12 5 -24 -18 -16 24 -3z"/>',
    paws: '<g fill="#fff">' + [[40, 150, -20], [110, 110, 10], [180, 160, -10], [250, 120, 20], [320, 165, 0], [370, 100, 15]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse cx="0" cy="10" rx="16" ry="13"/><circle cx="-14" cy="-10" r="6"/><circle cx="-4" cy="-17" r="6"/><circle cx="8" cy="-16" r="6"/><circle cx="16" cy="-8" r="6"/></g>`).join('') + '</g>',
    temple: '<g fill="#fff"><path d="M60 90 L200 30 L340 90Z"/><rect x="60" y="94" width="280" height="12"/>' + Array.from({ length: 7 }, (_, i) => `<rect x="${72 + i * 40}" y="110" width="18" height="72"/>`).join('') + '<rect x="50" y="184" width="300" height="16"/></g>',
    speed: '<g stroke="#fff" stroke-linecap="round">' + Array.from({ length: 7 }, (_, i) => `<line x1="${20 + (i % 3) * 40}" y1="${50 + i * 22}" x2="${180 + (i % 4) * 50}" y2="${50 + i * 22}" stroke-width="${8 - (i % 3) * 2}"/>`).join('') + '</g>',
    waves: '<g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round">' + Array.from({ length: 5 }, (_, i) => `<path d="M-10 ${80 + i * 28} q25 -18 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0"/>`).join('') + '</g>',
    planets: '<g fill="#fff"><circle cx="300" cy="120" r="56"/><ellipse cx="300" cy="120" rx="96" ry="18" fill="none" stroke="#fff" stroke-width="6"/><circle cx="90" cy="150" r="26"/><circle cx="170" cy="70" r="12"/>' + Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 71) % 400}" cy="${(i * 47) % 200}" r="2.5"/>`).join('') + '</g>',
    gears: '<g fill="none" stroke="#fff" stroke-width="10"><circle cx="110" cy="140" r="44" stroke-dasharray="14 10"/><circle cx="110" cy="140" r="18"/><circle cx="210" cy="96" r="32" stroke-dasharray="12 9"/></g><g fill="#fff"><path d="M320 40 a40 40 0 0 1 26 70 v20 h-52 v-20 a40 40 0 0 1 26 -70z"/><rect x="298" y="136" width="44" height="10" rx="4"/><rect x="304" y="150" width="32" height="10" rx="4"/></g>',
    island: '<g fill="#fff"><ellipse cx="200" cy="200" rx="150" ry="40"/><path d="M196 166 C196 120 204 90 214 64" stroke="#fff" stroke-width="10" fill="none"/><path d="M214 64 C180 50 150 60 140 80 C170 66 196 66 214 64Z"/><path d="M214 64 C250 46 280 56 290 76 C262 64 236 64 214 64Z"/><path d="M214 64 C212 40 226 24 246 20 C232 36 224 50 214 64Z"/></g><g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M10 160 q20 -12 40 0 t40 0"/><path d="M320 150 q20 -12 40 0 t40 0"/></g>'
  };

  const CATS = {
    pop: { label: 'Population', icon: '👥', title: 'Population (2023 estimates)', art: 'crowd', hi: 'More', lo: 'Fewer', lead: 'has', unit: 'people', q: 'people than', minR: 1.08, fmt: (v) => num(v),
      items: window.COUNTRIES.map((c) => ({ name: c.name, sub: contName(c.cont), emoji: c.flag, code: c.code, value: c.pop })), grads: [['#00acc1', '#006064'], ['#5c6bc0', '#283593'], ['#26a69a', '#00695c'], ['#ec407a', '#ad1457']] },
    area: { label: 'Area', icon: '🗺️', title: 'Total area of countries (km²)', art: 'map', hi: 'Bigger', lo: 'Smaller', lead: 'covers', unit: 'km²', q: 'in area than', minR: 1.08, fmt: (v) => (v < 10 ? num(v, 2) : num(v)),
      items: window.COUNTRIES.map((c) => ({ name: c.name, sub: contName(c.cont), emoji: c.flag, code: c.code, value: c.area })), grads: [['#8d6e63', '#4e342e'], ['#7cb342', '#33691e'], ['#ffa726', '#e65100'], ['#78909c', '#37474f']] },
    tall: { label: 'Structures', icon: '🏙️', title: 'Height of famous structures', art: 'skyline', hi: 'Taller', lo: 'Shorter', lead: 'stands', unit: 'metres tall', q: 'than', minR: 1.06, fmt: (v) => (v % 1 ? num(v, 1) : num(v)),
      items: window.STRUCTURES.map(([name, sub, v]) => ({ name, sub, emoji: structEmoji(name), value: v })), grads: [['#42a5f5', '#1565c0'], ['#7e57c2', '#4527a0'], ['#ef5350', '#b71c1c'], ['#26c6da', '#00838f']] },
    peak: { label: 'Mountains', icon: '🏔️', title: 'Mountain elevations (m above sea level)', art: 'peaks', hi: 'Higher', lo: 'Lower', lead: 'rises', unit: 'metres above sea level', q: 'than', minR: 1.04, fmt: (v) => num(v),
      items: window.MOUNTAINS.map(([name, sub, v]) => ({ name, sub, emoji: peakEmoji(name, v), value: v })), grads: [['#546e7a', '#263238'], ['#4db6ac', '#00695c'], ['#9575cd', '#4527a0'], ['#4fc3f7', '#01579b']] },
    films: { label: 'Box office', icon: '🎬', title: 'Worldwide box office, all releases (USD, approx.)', art: 'film', hi: 'More', lo: 'Less', lead: 'grossed', unit: 'worldwide', q: 'than', minR: 1.08, fmt: money,
      items: M.films.map(([name, sub, v]) => ({ name, sub, emoji: '🎬', value: v })), grads: [['#e53935', '#7f0000'], ['#ffb300', '#e65100'], ['#8e24aa', '#38006b'], ['#3949ab', '#1a237e']] },
    animals: { label: 'Animal weight', icon: '🐾', title: 'Typical adult weight', art: 'paws', hi: 'Heavier', lo: 'Lighter', lead: 'weighs about', unit: '', q: 'than', minR: 1.3, fmt: weight,
      items: M.animals.map(([name, sub, v, e]) => ({ name, sub, emoji: e, value: v })), grads: [['#66bb6a', '#1b5e20'], ['#ffa726', '#bf360c'], ['#8d6e63', '#3e2723'], ['#26a69a', '#004d40']] },
    landmarks: { label: 'Landmark age', icon: '🏛️', title: 'How old? (year completed, approx. for ancient sites)', art: 'temple', hi: 'Older', lo: 'Newer', lead: 'was completed', unit: 'years ago', q: 'than', fmt: (v) => num(v),
      close: (a, b) => Math.abs(a - b) < Math.max(8, 0.1 * Math.min(a, b)),
      items: M.landmarks.map(([name, sub, y, e]) => ({ name, sub, emoji: e, value: YEAR - y + (y < 0 ? -1 : 0), note: `Completed ${yearTxt(y)}` })), grads: [['#a1887f', '#4e342e'], ['#ffca28', '#ff6f00'], ['#5c6bc0', '#1a237e'], ['#ef6c00', '#8d2c00']] },
    speeds: { label: 'Top speed', icon: '⚡', title: 'Top speed (km/h)', art: 'speed', hi: 'Faster', lo: 'Slower', lead: 'reaches', unit: 'km/h', q: 'than', minR: 1.2, fmt: speedF,
      items: M.speeds.map(([name, sub, v, e]) => ({ name, sub, emoji: e, value: v })), grads: [['#ff7043', '#bf360c'], ['#29b6f6', '#01579b'], ['#d4e157', '#827717'], ['#ab47bc', '#4a148c']] },
    rivers: { label: 'Rivers', icon: '🌊', title: 'River length (km)', art: 'waves', hi: 'Longer', lo: 'Shorter', lead: 'flows for', unit: 'km', q: 'than', minR: 1.1, fmt: (v) => num(v),
      items: M.rivers.map(([name, sub, v]) => ({ name, sub, emoji: '🌊', value: v })), grads: [['#29b6f6', '#0d47a1'], ['#26c6da', '#006064'], ['#5c6bc0', '#1a237e'], ['#4db6ac', '#004d40']] },
    space: { label: 'Space', icon: '🪐', title: 'Diameter of planets, moons and more (km)', art: 'planets', hi: 'Bigger', lo: 'Smaller', lead: 'is', unit: 'km across', q: 'than', minR: 1.08, fmt: (v) => (v < 100 ? num(v, 1) : num(v)),
      items: M.space.map(([name, sub, v, e]) => ({ name, sub, emoji: e, value: v })), grads: [['#3949ab', '#0d0d3b'], ['#5e35b1', '#1a0033'], ['#00897b', '#00251a'], ['#c2185b', '#2a0016']] },
    inventions: { label: 'Inventions', icon: '💡', title: 'Which came later? (year)', art: 'gears', hi: 'Later', lo: 'Earlier', lead: 'arrived in', unit: '', q: 'than', from: 1400, fmt: (v) => String(Math.round(v)),
      close: (a, b) => Math.abs(a - b) < 3,
      items: M.inventions.map(([name, sub, v, e]) => ({ name, sub, emoji: e, value: v })), grads: [['#ffb300', '#e65100'], ['#7cb342', '#1b5e20'], ['#039be5', '#01579b'], ['#f06292', '#880e4f']] },
    islands: { label: 'Islands', icon: '🏝️', title: 'Island area (km²)', art: 'island', hi: 'Bigger', lo: 'Smaller', lead: 'covers', unit: 'km²', q: 'than', minR: 1.1, fmt: (v) => num(v),
      items: M.islands.map(([name, sub, v]) => ({ name, sub, emoji: '🏝️', value: v })), grads: [['#26c6da', '#00695c'], ['#ffca28', '#f57f17'], ['#66bb6a', '#1b5e20'], ['#42a5f5', '#0d47a1']] }
  };
  const KEYS = Object.keys(CATS);
  const TOTAL = KEYS.reduce((s, k) => s + CATS[k].items.length, 0);
  const isClose = (cat, a, b) => (cat.close ? cat.close(a, b) : Math.max(a, b) / Math.min(a, b) < cat.minR);

  const MODES = [{ v: 'streak', label: 'Streak', sub: 'one miss ends it' }, { v: 'lives', label: '3 Lives', sub: 'three strikes' }, { v: 'time', label: 'Time attack', sub: '60 seconds' }, { v: 'daily', label: 'Daily', sub: '12 questions' }];
  const SIMPLE = C.simple;
  const SIMPLE_KEYS = ['pop', 'tall', 'peak', 'animals', 'space', 'films', 'rivers', 'speeds'];
  const ROUNDS = 10;
  let bouts = 0;
  if (SIMPLE) document.getElementById('tag').textContent = 'Ten quick rounds. Pick the bigger number. No setup, no fuss.';
  const settings = FX.load('settings', 1, { mode: 'streak', cat: C.store.get('hl-mode', 'mix') });
  if (!MODES.some((m) => m.v === settings.mode)) settings.mode = 'streak';
  if (settings.cat !== 'mix' && !CATS[settings.cat]) settings.cat = 'mix';
  const saveSettings = () => FX.save('settings', 1, settings);
  const stats = FX.load('stats', 1, { games: 0, best: {}, acc: {}, right: 0, recent: [], daily: {} });
  const saveStats = () => FX.save('stats', 1, stats);

  const BADGES = FX.badges([
    { id: 'first', emoji: '📈', tier: 'bronze', name: 'First guess', desc: 'Finish a game' },
    { id: 's5', emoji: '🙂', tier: 'bronze', name: 'Hot hand', desc: 'Streak of 5' },
    { id: 's10', emoji: '🔥', tier: 'silver', name: 'On fire', desc: 'Streak of 10' },
    { id: 's20', emoji: '🧠', tier: 'gold', name: 'Walking almanac', desc: 'Streak of 20' },
    { id: 's40', emoji: '📚', tier: 'diamond', name: 'Encyclopedia', desc: 'Streak of 40', secret: true },
    { id: 'pop', emoji: '👥', tier: 'silver', name: 'Demographer', desc: '10 in a row on Population' },
    { id: 'films', emoji: '🎬', tier: 'silver', name: 'Film buff', desc: '10 in a row on Box office' },
    { id: 'animals', emoji: '🐾', tier: 'silver', name: 'Zoologist', desc: '10 in a row on Animal weight' },
    { id: 'landmarks', emoji: '🏛️', tier: 'silver', name: 'Historian', desc: '10 in a row on Landmark age' },
    { id: 'space', emoji: '🪐', tier: 'silver', name: 'Astronomer', desc: '10 in a row on Space' },
    { id: 'inventions', emoji: '💡', tier: 'silver', name: 'Inventor', desc: '10 in a row on Inventions' },
    { id: 'time', emoji: '⏱️', tier: 'gold', name: 'Speed quizzer', desc: '20 right in Time attack' },
    { id: 'daily', emoji: '📅', tier: 'bronze', name: 'Daily fact', desc: 'Finish a daily game' },
    { id: 'dailyp', emoji: '🌟', tier: 'gold', name: 'Perfect day', desc: '12 out of 12 on a daily' },
    { id: 'explorer', emoji: '🧭', tier: 'silver', name: 'Explorer', desc: 'Answer in all 12 categories' },
    { id: 'games', emoji: '🎲', tier: 'silver', name: 'Regular', desc: 'Play 25 games' }
  ]);

  const L = $('left'), R = $('right'), vs = $('vs'), vsText = vs.querySelector('span'), board = $('board');
  function bell(n = 1) {
    const ac = C.muted ? null : C.audioContext(); if (!ac) return;
    for (let k = 0; k < n; k++) {
      const t = ac.currentTime + k * 0.32;
      [[1180, 0.16], [2770, 0.06], [3910, 0.03]].forEach(([f, v]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
        o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 1.25);
      });
    }
  }
  function crowd(dur, from, to, vol) {
    const ac = C.muted ? null : C.audioContext(); if (!ac) return;
    const len = Math.floor(ac.sampleRate * dur), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / len);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), t = ac.currentTime;
    s.buffer = buf; f.type = 'bandpass'; f.Q.value = 1.4; f.frequency.setValueAtTime(from, t); f.frequency.linearRampToValueAtTime(to, t + dur);
    g.gain.value = vol; s.connect(f).connect(g).connect(ac.destination); s.start(t);
  }
  const cheer = () => crowd(0.7, 900, 1500, 0.22);
  const groan = () => crowd(0.8, 600, 260, 0.3);
  let shownSec = -1, mode = SIMPLE ? 'simple' : settings.mode, catKey, left, right, score = 0, run = 0, catRun = 0, busy = false, used = new Set(), gi = 0, lives = 3, timeLeft = 0, timerRaf = 0, lastT = 0, rand = Math.random, dailyQ = 0, dailyMarks = [], over = false;

  const pickR = (arr) => arr[Math.floor(rand() * arr.length)];
  function pickItem(cat, avoid) {
    const pool = cat.items.filter((it) => !used.has(it.name));
    const src = pool.length > 2 ? pool : cat.items;
    if (!avoid) return pickR(src);
    for (let i = 0; i < 60; i++) {
      const c = pickR(src);
      if (c.name === avoid.name || isClose(cat, c.value, avoid.value)) continue;
      if (SIMPLE && !cat.close && i < 50 && Math.max(c.value, avoid.value) / Math.min(c.value, avoid.value) < 1.6) continue;
      if (!cat.close) { const r = Math.max(c.value, avoid.value) / Math.min(c.value, avoid.value); if (r > (i < 30 ? 15 : 300)) continue; }
      return c;
    }
    return src.find((c) => c.name !== avoid.name && !isClose(cat, c.value, avoid.value)) || cat.items.find((c) => c.name !== avoid.name && c.value !== avoid.value);
  }

  function renderCats() {
    const list = [['mix', '🎲', 'Mixed', TOTAL], ...KEYS.map((k) => [k, CATS[k].icon, CATS[k].label, CATS[k].items.length])];
    $('cats').innerHTML = list.map(([k, i, l, n]) => `<button type="button" class="hl-chip" data-cat="${k}" aria-pressed="${settings.cat === k}"><i>${i}</i>${l} <small>${n}</small></button>`).join('');
    $('cats').querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => {
      if (busy && !over) return;
      settings.cat = b.dataset.cat; saveSettings(); FX.sfx.click(); renderCats(); newGame();
    }));
    $('cats').style.opacity = mode === 'daily' ? '.45' : '';
    $('cats').style.pointerEvents = mode === 'daily' ? 'none' : '';
  }
  const bestKey = () => (mode === 'simple' ? 'simple' : mode === 'daily' ? 'daily' : `${mode}:${settings.cat}`);
  const paintBest = () => { const b = stats.best[bestKey()] ?? (mode === 'streak' ? C.getBest(settings.cat) : null); $('best').textContent = b == null ? '-' : b; };
  function paintExtra() {
    const ex = $('extra');
    if (mode === 'lives') ex.innerHTML = [0, 1, 2].map((i) => `<span class="${i >= lives ? 'is-lost' : ''}">❤️</span>`).join('');
    else if (mode === 'time') ex.innerHTML = `<span class="hl-timer${timeLeft < 10000 ? ' low' : ''}">${Math.ceil(timeLeft / 1000)}s</span>`;
    else if (mode === 'daily') ex.innerHTML = `<span class="hl-timer">${Math.min(dailyQ + 1, 12)}/12</span>`;
    else if (mode === 'simple') ex.innerHTML = `<span class="hl-rounds" role="img" aria-label="Round ${Math.min(dailyQ + 1, ROUNDS)} of ${ROUNDS}">${Array.from({ length: ROUNDS }, (_, i) => `<i class="${i < dailyMarks.length ? (dailyMarks[i] ? 'is-win' : 'is-loss') : i === dailyQ ? 'is-now' : ''}"></i>`).join('')}</span>`;
    else ex.innerHTML = '';
    $('scoreLabel').textContent = mode === 'streak' ? 'Streak' : mode === 'simple' ? `Round ${Math.min(dailyQ + 1, ROUNDS)}/${ROUNDS}` : 'Score';
  }

  function newGame() {
    cancelAnimationFrame(timerRaf);
    mode = SIMPLE ? 'simple' : settings.mode;
    score = 0; run = 0; catRun = 0; used = new Set(); busy = false; over = false; lives = 3; timeLeft = 60000; dailyQ = 0; dailyMarks = [];
    rand = mode === 'daily' ? FX.rng(FX.daySeed('hl')) : Math.random;
    $('streak').textContent = 0;
    renderCats(); paintBest(); paintExtra();
    catKey = mode === 'simple' ? pickR(SIMPLE_KEYS) : mode === 'daily' ? pickR(KEYS) : settings.cat === 'mix' ? pickR(KEYS) : settings.cat;
    $('posterSub').textContent = mode === 'simple' ? 'Ten rounds' : MODES.find((m) => m.v === mode).label;
    startCategory();
    if (bouts++) bell(2);
    if (mode === 'time') { lastT = 0; timerRaf = requestAnimationFrame(tickTimer); }
  }
  function tickTimer(now) {
    if (over) return;
    if (!lastT) lastT = now;
    if (!document.hidden && !busy) timeLeft -= Math.min(100, now - lastT);
    lastT = now;
    const sec = Math.ceil(timeLeft / 1000);
    if (sec !== shownSec) { shownSec = sec; paintExtra(); }
    if (timeLeft <= 0) { timeLeft = 0; paintExtra(); endGame('Time is up!'); return; }
    timerRaf = requestAnimationFrame(tickTimer);
  }

  function startCategory() {
    const cat = CATS[catKey];
    const ct = $('cat'); ct.textContent = `${cat.icon} ${cat.title}`; ct.classList.remove('pop'); void ct.offsetWidth; ct.classList.add('pop');
    left = pickItem(cat); used.add(left.name);
    right = pickItem(cat, left); used.add(right.name);
    gi = Math.floor(rand() * 4);
    render(true);
  }

  function badgeHtml(it) {
    if (it.code && !supportsFlags) return `<div class="badge txt" role="img" aria-label="${it.name}">${it.code}</div>`;
    return `<div class="badge" role="img" aria-label="${it.name}">${it.emoji}</div>`;
  }
  const supportsFlags = (() => {
    try {
      const c = document.createElement('canvas'); c.width = c.height = 20; const g = c.getContext('2d');
      g.font = '16px sans-serif'; g.fillText('🇫🇷', 0, 16);
      const d = g.getImageData(0, 0, 20, 20).data; let colors = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 0 && Math.abs(d[i] - d[i + 2]) > 60) colors++;
      return colors > 5;
    } catch { return true; }
  })();

  function fill(el, it, known, grad) {
    const cat = CATS[catKey];
    el.style.setProperty('--g', G(...grad));
    const red = el === L;
    el.classList.toggle('is-red', red); el.classList.toggle('is-blue', !red);
    el.innerHTML = `<div class="corner">${red ? 'Red corner' : 'Blue corner'}<small>${red ? 'the champ' : 'the challenger'}</small></div><svg class="art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${ART[cat.art]}</svg>${badgeHtml(it)}<div class="nm"></div><div class="sb"></div>
      ${known
        ? `<div class="lead">${cat.lead}</div><div class="val">${cat.fmt(it.value)}</div><div class="unit">${cat.unit}</div>${it.note ? `<div class="note">${it.note}</div>` : ''}`
        : `<div class="lead">${cat.lead === 'is' ? 'is it' : cat.lead}</div><div class="hl-btns"><button type="button" class="hl-btn" data-g="1"><kbd>1</kbd>▲ ${cat.hi}</button><button type="button" class="hl-btn" data-g="-1"><kbd>2</kbd>▼ ${cat.lo}</button></div><div class="unit">${cat.q} <span class="than"></span></div>`}`;
    el.querySelector('.nm').textContent = it.name;
    el.querySelector('.sb').textContent = it.sub;
    const than = el.querySelector('.than'); if (than) than.textContent = left.name;
    el.querySelectorAll('.hl-btn').forEach((b) => b.addEventListener('click', () => guess(+b.dataset.g)));
    el.classList.remove('good', 'bad');
  }
  function render(both) {
    const g = CATS[catKey].grads;
    fill(L, left, true, g[gi % 4]);
    fill(R, right, false, g[(gi + 1) % 4]);
    vs.className = 'hl-vs'; vsText.textContent = 'VS';
    [both ? L : null, R].forEach((el) => { if (!el) return; el.classList.remove('hl-in'); void el.offsetWidth; el.classList.add('hl-in'); });
  }

  function ratioText(cat, a, b) {
    if (cat === CATS.inventions) return `${Math.abs(a - b)} years ${a > b ? 'later' : 'earlier'}`;
    if (cat === CATS.landmarks) return `${num(Math.abs(a - b))} years ${a > b ? 'older' : 'newer'}`;
    const r = a / b;
    if (r >= 1) return `${r >= 10 ? num(r) : r.toFixed(1)}× ${cat.hi.toLowerCase()}`;
    const inv = 1 / r;
    return `${inv >= 10 ? num(inv) : inv.toFixed(1)}× ${cat.lo.toLowerCase()}`;
  }

  async function guess(dir) {
    if (busy || over) return;
    busy = true;
    const cat = CATS[catKey];
    const ok = dir === 1 ? right.value > left.value : right.value < left.value;
    const acc = stats.acc[catKey] || [0, 0]; acc[1]++; if (ok) acc[0]++; stats.acc[catKey] = acc;
    if (KEYS.every((k) => stats.acc[k]?.[1])) BADGES.unlock('explorer');
    const btns = R.querySelector('.hl-btns');
    const val = document.createElement('div'); val.className = 'val'; val.textContent = cat.fmt(cat.from || 0);
    btns.replaceWith(val);
    R.querySelector('.unit').textContent = cat.unit;
    R.querySelector('.lead').textContent = cat.lead;
    let ticks = 0;
    const tickSound = setInterval(() => FX.sfx.tone(300 + ticks++ * 25, 0.03, { type: 'square', vol: 0.03 }), 70);
    await new Promise((res) => {
      const from = cat.from || 0, to = right.value, t0 = performance.now(), ms = 900;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms), e = 1 - (1 - p) ** 3;
        val.textContent = cat.fmt(from + (to - from) * e);
        if (p < 1 && !document.hidden) requestAnimationFrame(step); else { val.textContent = cat.fmt(to); res(); }
      };
      requestAnimationFrame(step);
    });
    clearInterval(tickSound);
    if (right.note) { const n = document.createElement('div'); n.className = 'note'; n.textContent = right.note; R.append(n); }
    const rt = document.createElement('div'); rt.className = 'hl-ratio'; rt.textContent = ratioText(cat, right.value, left.value); R.append(rt);
    R.classList.add(ok ? 'good' : 'bad');
    vs.className = 'hl-vs ' + (ok ? 'good' : 'bad'); vsText.textContent = ok ? 'KO!' : 'MISS';
    if (ok) {
      FX.sfx.good(); cheer(); FX.buzz(12);
      score++; run++; catRun++; stats.right++;
      const s = $('streak'); s.textContent = score; s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump');
      FX.burstAt(vs, { count: 14, speed: 5, colors: ['#2ecc71', '#ffffff', '#ffd166'] });
      if (run >= 5) BADGES.unlock('s5');
      if (run >= 10) BADGES.unlock('s10');
      if (run >= 20) BADGES.unlock('s20');
      if (run >= 40) BADGES.unlock('s40');
      if (catRun >= 10 && ['pop', 'films', 'animals', 'landmarks', 'space', 'inventions'].includes(catKey)) BADGES.unlock(catKey);
      if (mode === 'time' && score >= 20) BADGES.unlock('time');
      if (run > 0 && run % 10 === 0) { C.toast(`🔥 ${run} in a row!`); C.confetti(60); }
    } else {
      FX.sfx.bad(); groan(); FX.buzz([40, 30, 60]);
      board.classList.remove('shake'); void board.offsetWidth; board.classList.add('shake');
      run = 0; catRun = 0;
    }
    if (mode === 'daily' || mode === 'simple') dailyMarks.push(ok);
    saveStats();
    await wait(ok ? 1000 : 1300);
    if (!ok) {
      if (mode === 'streak') return endGame(`${right.name} is ${right.value > left.value ? cat.hi.toLowerCase() : cat.lo.toLowerCase()}: ${cat.fmt(right.value)} vs ${cat.fmt(left.value)}${cat.unit ? ' ' + cat.unit : ''}.`);
      if (mode === 'lives') { lives--; paintExtra(); if (lives <= 0) return endGame('Out of lives.'); }
      if (mode === 'time') { timeLeft = Math.max(0, timeLeft - 5000); FX.floatAt($('extra'), '-5s', 'var(--bad)'); paintExtra(); }
    }
    if (over) return;
    if (mode === 'simple') {
      dailyQ++; paintExtra();
      if (dailyQ >= ROUNDS) return endGame('Final bell!');
      bell(1);
      if (dailyQ % 3 === 0 || !ok) { catKey = pickR(SIMPLE_KEYS.filter((k) => k !== catKey)); startCategory(); }
      else { left = right; right = pickItem(cat, left); used.add(right.name); gi++; render(true); }
      busy = false; return;
    }
    if (mode === 'daily') {
      dailyQ++; paintExtra();
      if (dailyQ >= 12) return endGame('Daily complete!');
      catKey = pickR(KEYS); startCategory(); busy = false; return;
    }
    if (settings.cat === 'mix' && catRun >= 5) {
      catKey = C.pick(KEYS.filter((k) => k !== catKey)); catRun = 0;
      C.toast(`New category: ${CATS[catKey].icon} ${CATS[catKey].label}`);
      startCategory();
    } else if (settings.cat === 'mix' && !ok) {
      catKey = C.pick(KEYS.filter((k) => k !== catKey)); catRun = 0; startCategory();
    } else {
      left = right; right = pickItem(cat, left); used.add(right.name); gi++;
      render(true);
    }
    busy = false;
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function endGame(reason) {
    over = true; busy = true; cancelAnimationFrame(timerRaf);
    const k = bestKey(), prev = stats.best[k];
    const isNew = score > 0 && prev != null && score > prev;
    if (prev == null || score > prev) stats.best[k] = score;
    if (mode === 'streak') C.best(settings.cat, score);
    if (mode === 'simple') C.best('simple', score);
    stats.games++;
    if (mode !== 'simple') stats.recent.unshift({ m: mode, c: mode === 'daily' ? 'daily' : settings.cat, v: score, d: Date.now() }); stats.recent.length = Math.min(12, stats.recent.length);
    if (mode === 'daily') { const dk = FX.dayKey(); stats.daily[dk] = Math.max(stats.daily[dk] || 0, score); BADGES.unlock('daily'); if (score === 12) BADGES.unlock('dailyp'); }
    saveStats();
    BADGES.unlock('first');
    if (stats.games >= 25) BADGES.unlock('games');
    paintBest(); tabsApi.refresh();
    if (isNew) { C.confetti(); FX.sfx.fanfare(); } else FX.sfx.lose();
    const quip = mode === 'simple' ? (score === 10 ? 'Flawless victory. Undisputed champ.' : score >= 8 ? 'Won on points, comfortably.' : score >= 6 ? 'Split decision, but you take it.' : score >= 4 ? 'Went the distance. Respect.' : 'Saved by the bell. Rematch?') : score >= 30 ? 'Walking almanac.' : score >= 20 ? 'Seriously impressive.' : score >= 10 ? 'Great run!' : score >= 5 ? 'Nice going.' : score >= 2 ? 'A decent start.' : 'Ouch. Shake it off.';
    const body = document.createElement('div');
    body.className = 'hl-res';
    const label = mode === 'simple' ? 'Simple bout · 10 rounds' : mode === 'daily' ? `Daily #${FX.dayNumber()}` : `${MODES.find((m) => m.v === mode).label} · ${settings.cat === 'mix' ? 'Mixed' : CATS[settings.cat].label}`;
    body.innerHTML = `<div>${reason}</div><div>${quip} Best: ${stats.best[k]}${isNew ? ' (new!)' : ''}</div>${mode === 'daily' || mode === 'simple' ? `<div class="grid">${dailyMarks.map((x) => (x ? '🟩' : '🟥')).join('')}</div>` : ''}<div class="c-muted">${label}</div>`;
    const v = await C.modal({ emoji: isNew ? '🏆' : score >= 10 ? '🔥' : '📉', title: `${mode === 'streak' ? 'Streak' : 'Score'}: ${score}${mode === 'daily' ? '/12' : mode === 'simple' ? '/10' : ''}`, body, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Share', value: 'share' }] });
    if (v === 'share') {
      const head = mode === 'simple' ? `Higher or Lower on Zoble: ${score}/10` : mode === 'daily' ? `Higher or Lower daily #${FX.dayNumber()}: ${score}/12` : `Higher or Lower (${label}): ${score}`;
      FX.copy(`${head} 📈\n${mode === 'daily' || mode === 'simple' ? dailyMarks.map((x) => (x ? '🟩' : '🟥')).join('') : '🟩'.repeat(Math.min(score, 20))}`);
    }
    newGame();
  }

  FX.seg($('oMode'), MODES, settings.mode, (v) => { settings.mode = v; saveSettings(); newGame(); }, 'Game mode');

  FX.onKey((e) => {
    if (e.key === 'ArrowUp' || e.key === '1' || e.key === 'h' || e.key === 'H') { e.preventDefault(); guess(1); }
    else if (e.key === 'ArrowDown' || e.key === '2' || e.key === 'l' || e.key === 'L') { e.preventDefault(); guess(-1); }
    else if ((e.key === 'n' || e.key === 'N') && (!busy || over)) newGame();
  });

  const tabsApi = FX.tabs($('tabs'), [
    { id: 'how', label: 'How to play', render(p) {
      p.innerHTML = `<ul class="fx-howto">
        <li><i>👈</i><div><b>The left card is known</b><p>It shows its number. The right card hides its number.</p></div></li>
        <li><i>☝️</i><div><b>Higher or lower?</b><p>Decide whether the right card's number is higher or lower. If you are right, it slides over and a new challenger appears.</p></div></li>
        <li><i>🎮</i><div><b>Modes</b><p>Streak ends on the first miss. 3 Lives forgives two. Time attack gives you 60 seconds, and a miss costs 5. Daily is 12 mixed questions, the same for everyone today.</p></div></li>
        <li><i>📚</i><div><b>About the numbers</b><p>${num(TOTAL)} facts across 12 categories. Populations are 2023 estimates. Box office figures are all-time worldwide grosses in US dollars, not adjusted for inflation. Animal weights are typical adults, which vary a lot. Ancient landmark dates are approximate, so very close pairs are never shown.</p></div></li>
      </ul>`;
    } },
    { id: 'stats', label: 'Stats', render(p) {
      const tot = Object.values(stats.acc).reduce((s, a) => s + a[1], 0);
      const top = Math.max(0, ...Object.values(stats.best));
      p.innerHTML = `${FX.statGrid([[stats.games, 'Games'], [top || '-', 'Top score'], [stats.right, 'Right answers'], [tot ? Math.round((stats.right / tot) * 100) + '%' : '-', 'Accuracy']])}
        <h4>Accuracy by category</h4><div class="hl-acc">${KEYS.map((k) => { const a = stats.acc[k] || [0, 0]; const pct = a[1] ? Math.round((a[0] / a[1]) * 100) : 0; return `<div><span>${CATS[k].icon}</span><span class="bar" title="${CATS[k].label}"><i style="width:${pct}%"></i></span><b>${a[1] ? pct + '%' : '-'}</b></div>`; }).join('')}</div>
        <h4>Recent games</h4><div class="fx-hist-list">${stats.recent.length ? stats.recent.map((r) => `<div><span>${MODES.find((m) => m.v === r.m)?.label || r.m} · ${r.c === 'mix' ? 'Mixed' : r.c === 'daily' ? 'Daily' : CATS[r.c]?.label || r.c}</span><b>${r.v}</b></div>`).join('') : '<p class="c-muted">Nothing yet.</p>'}</div>`;
    } },
    { id: 'badges', label: 'Badges', render(p) { BADGES.render(p); } }
  ]);

  document.addEventListener('visibilitychange', () => { if (!document.hidden) lastT = 0; });
  newGame();
  window.__hl = { get left() { return left; }, get right() { return right; }, get busy() { return busy; }, get over() { return over; }, guess, CATS, get score() { return score; } };
})();
