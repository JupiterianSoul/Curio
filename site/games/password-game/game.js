(() => {
  const DATA = window.PW_DATA;
  const $ = (s) => document.querySelector(s);
  const pw = $('#pw'), rulesEl = $('#rules'), countEl = $('#count'), bar = $('#bar'), confirmEl = $('#confirm'), box = $('#box');
  const SAVE = 'pw:v2';
  const seg = window.Intl && Intl.Segmenter ? new Intl.Segmenter('en', { granularity: 'grapheme' }) : null;
  const graphemes = (s) => (seg ? [...seg.segment(s)].map((x) => x.segment) : Array.from(s));
  const glen = (s) => graphemes(s).length;
  const count = (s, sub) => s.split(sub).length - 1;
  const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
  const romanValue = (s) => { const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }; let t = 0; for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]] || 0; t += a < b ? -a : a; } return t; };
  const romans = (s) => s.match(/[IVXLCDM]+/g) || [];
  const digitSum = (s) => (s.match(/\d/g) || []).reduce((a, d) => a + +d, 0);
  const numbers = (s) => (s.match(/\d+/g) || []).map(Number);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const vibrate = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hashStr = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function moonIndex(d = new Date()) { const syn = 29.530588853, ref = Date.UTC(2000, 0, 6, 18, 14); let age = ((d - ref) / 86400000) % syn; if (age < 0) age += syn; return Math.floor(age / syn * 8 + 0.5) % 8; }

  const MODES = [
    { id: 'classic', name: 'Classic', icon: '🔐', desc: 'All 41 rules. Fire, flies, Morse code and a baby chicken.', a: '#ffcf70', b: '#f08a24' },
    { id: 'quick', name: 'Quick', icon: '⚡', desc: '20 rules for a coffee break. Paul still needs you.', a: '#a7f3d0', b: '#10b981' },
    { id: 'daily', name: 'Daily', icon: '📅', desc: "All 41 rules with today's flag, riddle, colour and captcha for everyone.", a: '#c7d2fe', b: '#6366f1' },
    { id: 'hardcore', name: 'Hardcore', icon: '🔥', desc: 'Fire spreads faster, the fly is hungrier and so is Paul.', a: '#fecaca', b: '#dc2626' }
  ];
  const QUICK = ['len5', 'number', 'upper', 'special', 'digits25', 'month', 'roman', 'sponsor', 'egg', 'weekday', 'planet', 'moon', 'country', 'strong', 'fire', 'hatch', 'dice', 'morse', 'bubbles', 'bang'];
  const BADGES = [
    ['win', '🔓', 'Accepted', 'Finish any mode'], ['classic', '📜', 'Rule follower', 'Finish Classic'], ['fast', '⚡', 'Speed typist', 'Finish Classic in under 15 minutes'],
    ['hard', '🔥', 'Hardcore', 'Finish Hardcore'], ['daily', '📅', 'Daily password', 'Finish a Daily'], ['quick', '☕', 'Coffee break', 'Finish Quick'],
    ['hatch', '🐣', "It's a chick!", 'Hatch Paul'], ['fire', '🧯', 'Firefighter', 'Put out the fire'], ['fly', '🪰', 'Swatter', 'Swat the fly'],
    ['bubbles', '🫧', 'Pop pop', 'Pop all the bubble wrap'], ['rule30', '🧗', 'Deep in the rules', 'Reach rule 30'], ['rip3', '🪦', 'Three funerals', 'Lose Paul in 3 different ways'],
    ['long', '📏', 'Novelist', 'Win with a password of 100+ characters']
  ];
  const CAUSES = { deleted: 'Deleted with the backspace key', burned: 'Caught in the password fire', starved: 'Forgot to feed him', overfed: 'Ate too many bugs', abandoned: 'Left behind when you started over' };

  const blank = () => ({ v: 2, wins: {}, best: {}, deaths: {}, furthest: 0, played: 0, badges: [], daily: {}, run: null });
  function load() {
    const d = blank(), s = Curio.store.get(SAVE, null);
    if (!s || typeof s !== 'object' || s.v !== 2) return d;
    for (const k of Object.keys(d)) if (s[k] === undefined || (d[k] !== null && (typeof s[k] !== typeof d[k] || Array.isArray(d[k]) !== Array.isArray(s[k])))) s[k] = d[k];
    if (s.run && (typeof s.run !== 'object' || typeof s.run.value !== 'string' || !s.run.st || !MODES.some((m) => m.id === s.run.st.mode))) s.run = null;
    return s;
  }
  const save = load();
  const persist = () => Curio.store.set(SAVE, save);
  function award(id) {
    if (save.badges.includes(id)) return;
    save.badges.push(id); persist();
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => { Curio.toast(`${b[1]} Badge unlocked: ${b[2]}`, 2600); Curio.beep(1046, .12, 'triangle', .07); setTimeout(() => Curio.beep(1568, .16, 'triangle', .07), 100); }, 300);
  }

  const AC = () => (Curio.muted ? null : Curio.audioContext());
  const SFX = {
    reveal(n) { Curio.beep(480 + n * 14, .09, 'triangle', .08); setTimeout(() => Curio.beep(720 + n * 14, .08, 'triangle', .06), 70); },
    ok() { Curio.beep(1040, .05, 'sine', .05); },
    bad() { Curio.beep(220, .08, 'square', .04); },
    pop() { const ac = AC(); if (!ac) return; const t = ac.currentTime; const len = ac.sampleRate * .06; const b = ac.createBuffer(1, len, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 4); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 800; const g = ac.createGain(); g.gain.value = .5; s.connect(f).connect(g).connect(ac.destination); s.start(t); },
    whoosh() { const ac = AC(); if (!ac) return; const t = ac.currentTime; const len = ac.sampleRate * .5; const b = ac.createBuffer(1, len, ac.sampleRate); const d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / len); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(1600, t + .5); const g = ac.createGain(); g.gain.value = .25; s.connect(f).connect(g).connect(ac.destination); s.start(t); },
    splat() { Curio.beep(140, .15, 'sawtooth', .08); this.pop(); },
    chirp() { [1800, 2200, 1900].forEach((f, i) => setTimeout(() => Curio.beep(f, .05, 'sine', .06), i * 70)); },
    sad() { Curio.beep(200, .4, 'sawtooth', .08); setTimeout(() => Curio.beep(120, .6, 'sawtooth', .08), 300); },
    win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .18, 'triangle', .1), i * 110)); },
    tone(on) { if (!on) return; Curio.beep(620, .09, 'sine', .05); }
  };

  const randHex = (r) => '#' + Array.from({ length: 6 }, () => (r() < .7 ? 'abcdef'[Math.floor(r() * 6)] : '0123456789'[Math.floor(r() * 10)])).join('');
  const randCaptcha = (r) => Array.from({ length: 5 }, () => 'abcdefghjkmnprstwyz'[Math.floor(r() * 19)]).join('');
  function fresh(mode) {
    const r = mode === 'daily' ? seeded(hashStr('pw' + todayKey())) : Math.random;
    const pick = (n) => Math.floor(r() * n);
    return {
      mode, flag: pick(DATA.FLAGS.length), riddle: pick(DATA.RIDDLES.length), hex: randHex(r), captcha: randCaptcha(r), morse: DATA.MORSE_WORDS[pick(DATA.MORSE_WORDS.length)],
      back: pick(DATA.BACKWARDS.length), colour: pick(DATA.COLOURS.length), dice: 0, revealed: 1, paul: 'none', paulPlaced: false,
      fireOn: false, fireOut: false, fireAcc: 0, flyOn: false, flySwatted: false, flyAcc: 0, bubbles: Array(15).fill(0), feedOn: false, mealAcc: 0, starve: 0,
      elapsed: 0, won: false, dead: false, cause: ''
    };
  }
  let st = null;
  const hard = () => st && st.mode === 'hardcore';
  const listFor = (mode) => (mode === 'quick' ? RULES.filter((r) => QUICK.includes(r.id)) : RULES);
  let LIST = [];

  function flagSVG(i) {
    const [, kind, c] = DATA.FLAGS[i];
    let inner = '';
    if (kind === 'v') inner = c.map((col, k) => `<rect x="${k * 60 / c.length}" width="${60 / c.length + .5}" height="40" fill="${col}"/>`).join('');
    else if (kind === 'h') inner = c.map((col, k) => `<rect y="${k * 40 / c.length}" width="60" height="${40 / c.length + .5}" fill="${col}"/>`).join('');
    else if (kind === 'disc') inner = `<rect width="60" height="40" fill="${c[0]}"/><circle cx="30" cy="20" r="12" fill="${c[1]}"/>`;
    else if (kind === 'disc2') inner = `<rect width="60" height="40" fill="${c[0]}"/><circle cx="27" cy="20" r="11" fill="${c[1]}"/>`;
    else if (kind === 'cross') inner = `<rect width="60" height="40" fill="${c[0]}"/><rect x="17" width="8" height="40" fill="${c[1]}"/><rect y="16" width="60" height="8" fill="${c[1]}"/>`;
    else if (kind === 'plus') inner = `<rect width="60" height="40" fill="${c[0]}"/><rect x="26" y="9" width="8" height="22" fill="${c[1]}"/><rect x="19" y="16" width="22" height="8" fill="${c[1]}"/>`;
    else if (kind === 'col') inner = `<rect width="60" height="20" fill="${c[0]}"/><rect y="20" width="60" height="10" fill="${c[1]}"/><rect y="30" width="60" height="10" fill="${c[2]}"/>`;
    return `<svg class="flag" viewBox="0 0 60 40" role="img" aria-label="A country flag"><rect width="60" height="40" fill="#ccc"/>${inner}<rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.15)"/></svg>`;
  }
  function dieSVG(n) {
    const P = { 1: [[32, 32]], 2: [[20, 20], [44, 44]], 3: [[18, 18], [32, 32], [46, 46]], 4: [[20, 20], [44, 20], [20, 44], [44, 44]], 5: [[18, 18], [46, 18], [32, 32], [18, 46], [46, 46]], 6: [[20, 16], [44, 16], [20, 32], [44, 32], [20, 48], [44, 48]] };
    return `<rect x="4" y="4" width="56" height="56" rx="12" fill="#fff" stroke="#cbd5e1" stroke-width="2"/><rect x="4" y="44" width="56" height="16" rx="8" fill="#e2e8f0" opacity=".6"/>${(P[n] || []).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.5" fill="${n === 1 ? '#dc2626' : '#1f2937'}"/>`).join('')}${n ? '' : '<text x="32" y="42" font-size="26" text-anchor="middle" font-weight="900" fill="#94a3b8">?</text>'}`;
  }
  function paulSVG() {
    if (!st || st.paul === 'none') return `<svg viewBox="0 0 64 64"><ellipse cx="32" cy="40" rx="16" ry="20" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="4 4"/><text x="32" y="46" font-size="16" text-anchor="middle" fill="var(--ink-3)" font-weight="900">?</text></svg>`;
    if (st.paul === 'dead') return `<svg viewBox="0 0 64 64"><path d="M14 60 V28 a18 18 0 0 1 36 0 V60Z" fill="#94a3b8"/><path d="M14 60 V28 a18 18 0 0 1 36 0 V60Z" fill="none" stroke="#64748b" stroke-width="2"/><text x="32" y="36" font-size="9" text-anchor="middle" font-weight="900" fill="#334155">RIP</text><text x="32" y="48" font-size="8" text-anchor="middle" font-weight="800" fill="#334155">PAUL</text><path d="M8 60 h48" stroke="#16a34a" stroke-width="4"/><circle cx="46" cy="56" r="3" fill="#f472b6"/></svg>`;
    if (st.paul === 'egg') {
      const crack = Math.min(3, Math.floor(Math.max(0, st.revealed - LIST.findIndex((r) => r.id === 'egg') - 1) / 4));
      const cracks = ['', '<path d="M24 30 l4 4 l-3 4 l4 3" stroke="#7c5a2a" stroke-width="1.5" fill="none"/>', '<path d="M24 30 l4 4 l-3 4 l4 3 M38 26 l-3 5 l4 3 l-2 5" stroke="#7c5a2a" stroke-width="1.5" fill="none"/>', '<path d="M24 30 l4 4 l-3 4 l4 3 M38 26 l-3 5 l4 3 l-2 5 M20 42 l6 -1 l4 3 l6 -2 l5 2 l5 -1" stroke="#7c5a2a" stroke-width="1.5" fill="none"/>'][crack];
      return `<svg viewBox="0 0 64 64"><ellipse cx="32" cy="58" rx="16" ry="3" fill="rgba(0,0,0,.15)"/><g class="egg-wobble" style="--wob:${[3.2, 2.4, 1.6, 1][crack]}s"><path d="M32 8 q16 10 16 30 a16 18 0 0 1 -32 0 q0 -20 16 -30Z" fill="#fdf3dc" stroke="#e0c99a" stroke-width="1.5"/><circle cx="26" cy="26" r="2.5" fill="#d9b57a"/><circle cx="38" cy="36" r="3" fill="#d9b57a"/><circle cx="28" cy="46" r="2" fill="#d9b57a"/><path d="M24 18 q4 -5 8 -5" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/>${cracks}</g></svg>`;
    }
    const hungry = st.feedOn && st.starve > 0;
    const eyes = hungry ? '<circle cx="26" cy="28" r="3" fill="#111"/><circle cx="38" cy="28" r="3" fill="#111"/><path d="M22 22 l6 2 M42 22 l-6 2" stroke="#111" stroke-width="1.5"/>' : '<path d="M23 28 q3 -4 6 0 M35 28 q3 -4 6 0" stroke="#111" stroke-width="2" fill="none" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 64 64"><ellipse cx="32" cy="60" rx="16" ry="3" fill="rgba(0,0,0,.15)"/><g class="chick-bob"><path d="M27 56 l-2 4 M37 56 l2 4 M25 60 h-4 M39 60 h4" stroke="#f97316" stroke-width="2" stroke-linecap="round"/><ellipse cx="32" cy="38" rx="17" ry="18" fill="#fde047"/><path d="M16 40 q-6 -4 -3 -10 q6 2 6 8Z" fill="#facc15"/><path d="M48 40 q6 -4 3 -10 q-6 2 -6 8Z" fill="#facc15"/><path d="M30 14 q2 -6 6 -4 q-2 2 -2 5" fill="#fde047" stroke="#eab308"/>${eyes}<path d="M29 33 l3 4 l3 -4Z" fill="#f97316"/><circle cx="22" cy="36" r="3" fill="#fb923c" opacity=".45"/><circle cx="42" cy="36" r="3" fill="#fb923c" opacity=".45"/><path d="M14 52 q18 8 36 0 q-6 6 -18 6 q-12 0 -18 -6Z" fill="#f5f5f4" opacity=".9"/><path d="M14 52 l4 -4 l3 4 l4 -4 l3 4 l4 -4 l3 4 l4 -4 l3 4 l4 -4 l3 4" stroke="#e7e5e4" fill="none"/></g></svg>`;
  }

  const RULES = [
    { id: 'len5', t: 'Your password must be at least 5 characters.', test: (s, g) => g.length >= 5 },
    { id: 'number', t: 'Your password must include a number.', test: (s) => /\d/.test(s) },
    { id: 'upper', t: 'Your password must include an uppercase letter.', test: (s) => /[A-Z]/.test(s) },
    { id: 'special', t: 'Your password must include a special character.', test: (s) => /[^A-Za-z0-9\s]/.test(s) },
    { id: 'digits25', t: 'The digits in your password must add up to 25.', test: (s) => digitSum(s) === 25, hint: (s) => `Current sum: ${digitSum(s)}` },
    { id: 'month', t: 'Your password must include a month of the year.', test: (s) => DATA.MONTHS.some((m) => s.toLowerCase().includes(m)) },
    { id: 'roman', t: 'Your password must include a Roman numeral.', test: (s) => romans(s).length > 0, hint: () => 'Roman numerals are uppercase I, V, X, L, C, D and M.' },
    { id: 'sponsor', t: 'Your password must include one of our sponsors:', test: (s) => DATA.SPONSORS.some(([n]) => s.toLowerCase().includes(n)),
      extra: (el) => { el.innerHTML = `<div class="sponsors">${DATA.SPONSORS.map(([n, bg, fg]) => `<span class="sponsor" style="background:${bg};color:${fg}">${n}</span>`).join('')}</div>`; } },
    { id: 'roman35', t: 'The Roman numerals in your password should multiply to 35.', test: (s) => { const r = romans(s); return r.length > 0 && r.reduce((a, x) => a * romanValue(x), 1) === 35; },
      hint: (s) => { const r = romans(s); return r.length ? `Found: ${r.join(' × ')} = ${r.reduce((a, x) => a * romanValue(x), 1)}` : ''; } },
    { id: 'captcha', t: 'Your password must include this CAPTCHA:', test: (s) => s.includes(st.captcha), key: () => st.captcha, extra: (el) => {
      const c = document.createElement('canvas'); c.width = 220; c.height = 70; c.className = 'captcha'; c.style.width = '220px'; c.setAttribute('role', 'img'); c.setAttribute('aria-label', 'Captcha reading ' + st.captcha.split('').join(' '));
      const g = c.getContext('2d'); g.fillStyle = '#e9eef3'; g.fillRect(0, 0, 220, 70);
      for (let k = 0; k < 5; k++) { g.strokeStyle = `hsl(${k * 70},40%,70%)`; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 10 + k * 12); for (let x = 0; x <= 220; x += 10) g.lineTo(x, 10 + k * 12 + Math.sin(x / 18 + k) * 6); g.stroke(); }
      [...st.captcha].forEach((ch, k) => { g.save(); g.translate(28 + k * 40, 44); g.rotate((Math.random() - .5) * .7); g.fillStyle = ['#2c3e50', '#8e44ad', '#c0392b', '#16a085', '#d35400'][k]; g.font = `900 ${32 + (k % 2) * 6}px Georgia, serif`; g.textAlign = 'center'; g.fillText(ch, 0, 10); g.restore(); });
      g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(70, 10, 150, 70, 220, 30); g.stroke();
      const b = document.createElement('button'); b.className = 'refresh'; b.type = 'button'; b.textContent = '🔄 New one';
      b.onclick = () => { st.captcha = randCaptcha(Math.random); update(true); }; el.append(c, b);
    } },
    { id: 'egg', t: "🥚 This is my chicken Paul. He hasn't hatched yet. Please put him in your password and keep him safe.", test: (s) => s.includes('🥚') || s.includes('🐣') },
    { id: 'weekday', t: 'Your password must include the day of the week it is today.', test: (s) => s.toLowerCase().includes(DATA.DAYS[new Date().getDay()]) },
    { id: 'planet', t: 'Your password must include a planet. (Sorry, Pluto.)', test: (s) => DATA.PLANETS.some((p) => s.toLowerCase().includes(p)) },
    { id: 'element', t: 'Your password must include a two-letter symbol from the periodic table.', test: (s) => DATA.ELEMENTS.some((e) => s.includes(e)), hint: () => 'Symbols are case-sensitive, like He or Fe.' },
    { id: 'moon', t: 'Your password must include the current phase of the moon as an emoji.', test: (s) => s.includes(DATA.MOONS[moonIndex()]), hint: () => 'The moon tray is under the password box.' },
    { id: 'country', t: 'Your password must include the name of this country.', test: (s) => s.toLowerCase().includes(DATA.FLAGS[st.flag][0]), key: () => st.flag, extra: (el) => { el.innerHTML = flagSVG(st.flag); } },
    { id: 'leap', t: 'Your password must include a leap year.', test: (s) => numbers(s).some((n) => n > 0 && ((n % 4 === 0 && n % 100 !== 0) || n % 400 === 0)) },
    { id: 'riddle', t: 'Your password must include the answer to this riddle:', test: (s) => s.toLowerCase().includes(DATA.RIDDLES[st.riddle][1]), key: () => st.riddle,
      extra: (el) => { el.innerHTML = `<div class="riddle" role="img" aria-label="emoji riddle">${DATA.RIDDLES[st.riddle][0]} = ?</div>`; } },
    { id: 'noq', t: 'Your password must not contain the letter that comes after P in the alphabet.', test: (s) => !/q/i.test(s) },
    { id: 'strong', t: 'Your password is not strong enough. Add three 💪.', test: (s) => count(s, '💪') >= 3, hint: (s) => `💪 × ${count(s, '💪')}` },
    { id: 'vowels', t: 'Your password must contain every vowel: a, e, i, o and u.', test: (s) => [...'aeiou'].every((v) => s.toLowerCase().includes(v)), hint: (s) => `Missing: ${[...'aeiou'].filter((v) => !s.toLowerCase().includes(v)).join(', ')}` },
    { id: 'hex', t: 'Your password must include this colour in hex, like #a1b2c3.', test: (s) => s.toLowerCase().includes(st.hex), key: () => st.hex, extra: (el) => {
      const sw = document.createElement('div'); sw.className = 'swatch'; sw.style.background = st.hex; sw.setAttribute('role', 'img'); sw.setAttribute('aria-label', 'Colour swatch');
      const b = document.createElement('button'); b.className = 'refresh'; b.type = 'button'; b.textContent = '🔄 Different colour';
      b.onclick = () => { st.hex = randHex(Math.random); update(true); }; el.append(sw, b);
    } },
    { id: 'hour', t: 'Your password must include the current hour (24-hour clock).', test: (s) => s.includes(String(new Date().getHours())) },
    { id: 'fire', mini: 'Live', t: '🔥 Oh no! Your password is on fire. Put it out before it reaches Paul!', test: (s) => !s.includes('🔥') },
    { id: 'hatch', t: '🐣 Paul has hatched! Please keep him in your password. He is very small.', test: (s) => s.includes('🐣') && !s.includes('🥚') },
    { id: 'feed', mini: 'Live', t: 'Paul is hungry. Keep 1 to 3 🐛 in your password. He eats one every so often, and more than 3 gives him a tummy ache.', test: (s) => { const n = count(s, '🐛'); return n >= 1 && n <= 3; }, hint: (s) => `🐛 × ${count(s, '🐛')}` },
    { id: 'currency', t: 'Your password must include a currency symbol: $, £, € or ¥.', test: (s) => /[$£€¥]/.test(s) },
    { id: 'dice', mini: 'Game', t: 'Roll the die. Your password must include the number you rolled, written as a word.', test: (s) => st.dice > 0 && s.toLowerCase().includes(DATA.DICE_WORDS[st.dice - 1]), key: () => 'd', extra: (el) => {
      const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); d.setAttribute('viewBox', '0 0 64 64'); d.setAttribute('class', 'die'); d.setAttribute('role', 'img'); d.innerHTML = dieSVG(st.dice); d.setAttribute('aria-label', st.dice ? `Die showing ${st.dice}` : 'Die not rolled');
      const b = document.createElement('button'); b.className = 'refresh'; b.type = 'button'; b.textContent = st.dice ? '🎲 Roll again' : '🎲 Roll';
      b.onclick = () => {
        if (d.classList.contains('rolling')) return;
        d.classList.add('rolling'); let n = 0;
        const iv = setInterval(() => { d.innerHTML = dieSVG(1 + Math.floor(Math.random() * 6)); Curio.beep(300 + Math.random() * 300, .02, 'square', .04); if (++n > 9) { clearInterval(iv); d.classList.remove('rolling'); st.dice = 1 + Math.floor(Math.random() * 6); d.innerHTML = dieSVG(st.dice); d.setAttribute('aria-label', `Die showing ${st.dice}`); b.textContent = '🎲 Roll again'; Curio.beep(880, .08, 'triangle', .08); update(true); save2(); } }, 60);
      };
      el.append(d, b);
    } },
    { id: 'brackets', t: 'Your password must contain a pair of brackets with something inside them, like (this).', test: (s) => /\([^()]+\)|\[[^\[\]]+\]|\{[^{}]+\}/.test(s) },
    { id: 'morse', mini: 'Game', t: 'This lamp is blinking a word in Morse code. Your password must include that word.', test: (s) => s.toLowerCase().includes(st.morse), key: () => st.morse, extra: (el) => {
      const lamp = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lamp.setAttribute('viewBox', '0 0 70 70'); lamp.setAttribute('class', 'lamp'); lamp.setAttribute('role', 'img'); lamp.setAttribute('aria-label', 'A blinking lamp');
      lamp.innerHTML = '<circle class="glow" cx="35" cy="30" r="30" fill="#fff36b" opacity=".4"/><circle class="glass" cx="35" cy="30" r="18" fill="#57534e" stroke="#292524" stroke-width="3"/><rect x="27" y="48" width="16" height="12" rx="3" fill="#78716c"/><path d="M27 52 h16 M27 56 h16" stroke="#44403c"/>';
      const key = document.createElement('div'); key.className = 'morse-key';
      key.innerHTML = Object.entries(DATA.MORSE).map(([k, v]) => `<span>${k} ${v.replace(/\./g, '·').replace(/-/g, '–')}</span>`).join('');
      const lb = document.createElement('button'); lb.className = 'refresh'; lb.type = 'button'; lb.textContent = '🔈 Beep along'; lb.setAttribute('aria-pressed', 'false');
      let listen = false; lb.onclick = () => { listen = !listen; lb.setAttribute('aria-pressed', String(listen)); lb.textContent = listen ? '🔊 Beeping' : '🔈 Beep along'; };
      el.append(lamp, lb, key);
      const seq = [];
      for (const ch of st.morse) { for (const sym of DATA.MORSE[ch]) { seq.push([1, sym === '.' ? 280 : 840]); seq.push([0, 280]); } seq[seq.length - 1] = [0, 840]; }
      seq[seq.length - 1] = [0, 2000];
      let k = 0;
      const step = () => { if (!lamp.isConnected && k > 0) return; const [on, ms] = seq[k % seq.length]; lamp.classList.toggle('on', !!on); if (on && listen) Curio.beep(620, ms / 1000, 'sine', .04); k++; morseTimer = setTimeout(step, ms); };
      clearTimeout(morseTimer); step();
    } },
    { id: 'backwards', t: () => `Your password must include the word "${DATA.BACKWARDS[st.back][0]}" spelled backwards.`, test: (s) => s.toLowerCase().includes(DATA.BACKWARDS[st.back][1]) },
    { id: 'fly', mini: 'Live', t: '🪰 A fly got into the password box. Every few seconds it eats a letter. Swat it!', test: () => st.flySwatted },
    { id: 'palindrome', t: 'Your password must include a palindrome at least 3 characters long (and not just one letter repeated).', test: (s) => {
      const a = graphemes(s.toLowerCase());
      for (let i = 0; i < a.length; i++) for (let j = i + 3; j <= Math.min(a.length, i + 12); j++) { const w = a.slice(i, j); if (new Set(w).size > 1 && w.join('') === w.slice().reverse().join('')) return true; }
      return false;
    } },
    { id: 'colour', t: 'Your password must include the name of this colour.', test: (s) => s.toLowerCase().includes(DATA.COLOURS[st.colour][0]), key: () => st.colour,
      extra: (el) => { el.innerHTML = `<svg class="blob" viewBox="0 0 90 70" role="img" aria-label="A coloured blob"><path d="M20 10 Q45 -4 70 12 Q92 30 76 52 Q60 72 30 64 Q2 56 6 34 Q8 18 20 10Z" fill="${DATA.COLOURS[st.colour][1]}" stroke="rgba(0,0,0,.2)" stroke-width="2"/><ellipse cx="34" cy="22" rx="10" ry="5" fill="#fff" opacity=".35"/></svg>`; } },
    { id: 'friend', t: 'Paul is lonely. Put a 🐸 right next to him.', test: (s, g) => { const i = g.findIndex((x) => x === '🐣' || x === '🥚'); return i >= 0 && (g[i - 1] === '🐸' || g[i + 1] === '🐸'); } },
    { id: 'bubbles', mini: 'Game', t: 'Before you go on, pop all of this bubble wrap. It is very important.', test: () => st.bubbles.every(Boolean), hint: () => `${st.bubbles.filter(Boolean).length} of ${st.bubbles.length} popped`, key: () => 'b', extra: (el) => {
      const w = document.createElement('div'); w.className = 'bubbles';
      st.bubbles.forEach((p, k) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'bub' + (p ? ' popped' : ''); b.setAttribute('aria-label', p ? 'Popped bubble' : 'Bubble');
        b.onclick = () => { if (st.bubbles[k]) return; st.bubbles[k] = 1; b.classList.add('popped'); b.setAttribute('aria-label', 'Popped bubble'); SFX.pop(); vibrate(8); if (st.bubbles.every(Boolean)) award('bubbles'); update(); save2(); };
        w.append(b);
      });
      el.append(w);
    } },
    { id: 'rhyme', t: 'Your password must include a word that rhymes with "cat" (but not cat).', test: (s) => DATA.RHYMES.some((w) => s.toLowerCase().includes(w)) },
    { id: 'water', t: 'Your password must include the chemical formula for water.', test: (s) => s.includes('H2O') || s.includes('H₂O') },
    { id: 'prime', t: 'The length of your password must be a prime number.', test: (s, g) => isPrime(g.length), hint: (s, g) => `Length: ${g.length}` },
    { id: 'ownlen', t: 'Your password must include its own length.', test: (s, g) => s.includes(String(g.length)), hint: (s, g) => `Length: ${g.length}` },
    { id: 'bang', t: 'Your password must end with an exclamation mark, because this is exciting!', test: (s) => s.endsWith('!') }
  ];
  let morseTimer = 0;

  const TRAY = [...DATA.MOONS, '🥚', '🐛', '💪', '🐸', '🌚', '🍕', '🦖', '⭐'];
  const tray = $('#tray');
  tray.innerHTML = '<span>Emoji</span>';
  TRAY.forEach((e) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = e; b.setAttribute('aria-label', 'Insert ' + e);
    b.addEventListener('pointerdown', (ev) => ev.preventDefault());
    b.addEventListener('click', () => {
      if (pw.disabled) return;
      pushHist();
      const a = pw.selectionStart ?? pw.value.length, z = pw.selectionEnd ?? pw.value.length;
      pw.value = pw.value.slice(0, a) + e + pw.value.slice(z);
      pw.selectionStart = pw.selectionEnd = a + e.length;
      onInput();
    });
    tray.append(b);
  });

  let hist = [];
  function pushHist() { if (hist[hist.length - 1] !== pw.value) { hist.push(pw.value); if (hist.length > 60) hist.shift(); } }
  $('#undo').addEventListener('click', () => { if (!hist.length || pw.disabled) return; pw.value = hist.pop(); onInput(); Curio.beep(500, .04, 'triangle', .05); });

  function autosize() { pw.style.height = 'auto'; pw.style.height = pw.scrollHeight + 'px'; }

  function mutate(fn) {
    const s = pw.value, caret = pw.selectionStart ?? s.length;
    const g = graphemes(s);
    const res = fn(g);
    if (!res) return;
    const ns = res.g.join('');
    let pre = 0; for (let i = 0; i < res.at && i < g.length; i++) pre += g[i].length;
    const delta = ns.length - s.length;
    pw.value = ns;
    const focused = document.activeElement === pw;
    if (focused) { const c = caret > pre ? Math.max(pre, caret + delta) : caret; pw.selectionStart = pw.selectionEnd = Math.min(ns.length, c); }
    autosize(); update();
  }

  const cards = new Map();
  let lastOrder = '';
  function card(r, i) {
    let c = cards.get(r.id);
    if (!c) {
      c = document.createElement('div'); c.className = 'rule'; c.dataset.id = r.id;
      c.innerHTML = `<div class="rule__head"><span class="st" aria-hidden="true"></span><span>Rule ${i + 1}</span>${r.mini ? `<span class="mini">${r.mini}</span>` : ''}</div><div class="rule__body"><div class="txt"></div><div class="c-muted hint"></div></div>`;
      c.querySelector('.txt').textContent = typeof r.t === 'function' ? r.t() : r.t;
      c.addEventListener('animationend', () => c.classList.add('settled'), { once: true });
      cards.set(r.id, c);
    }
    if (r.extra) {
      const body = c.querySelector('.rule__body');
      let ex = body.querySelector('.extra');
      const k = String(r.key ? r.key() : 'x');
      if (!ex || ex.dataset.key !== k) { ex?.remove(); ex = document.createElement('div'); ex.className = 'extra'; ex.dataset.key = k; r.extra(ex); body.append(ex); }
    }
    return c;
  }

  let lastSig = '';
  function update(force) {
    if (!st) return;
    const s = pw.value, g = graphemes(s);
    countEl.textContent = g.length;
    countEl.classList.toggle('is-prime', isPrime(g.length) && st.revealed > LIST.findIndex((r) => r.id === 'prime'));
    if (st.dead || st.won) return;
    const hasPaul = s.includes('🥚') || s.includes('🐣');
    if (st.revealed > LIST.findIndex((r) => r.id === 'egg') && LIST.some((r) => r.id === 'egg') && hasPaul && !st.paulPlaced) { st.paulPlaced = true; st.paul = 'egg'; renderPet(); Curio.toast('Paul is safe in your password. 🥚'); }
    if (st.paulPlaced && !hasPaul) return killPaul('deleted');
    if (st.feedOn && count(s, '🐛') > 3) return killPaul('overfed');
    const prev = st.revealed;
    while (st.revealed < LIST.length && LIST.slice(0, st.revealed).every((r) => r.test(s, g))) { st.revealed++; const rr = LIST[st.revealed - 1], me = st; if (HOOKS.includes(rr.id)) { setTimeout(() => { if (st === me && !st.dead && !st.won) { onReveal(rr); update(true); } }, 0); break; } }
    if (st.revealed > prev) { SFX.reveal(st.revealed); if (st.revealed > save.furthest) { save.furthest = st.revealed; persist(); } if (st.revealed >= 30) award('rule30'); }
    const res = LIST.slice(0, st.revealed).map((r, i) => ({ r, i, ok: r.test(s, g) }));
    const allOk = st.revealed === LIST.length && res.every((x) => x.ok);
    const sig = st.revealed + '|' + res.map((x) => (x.ok ? 1 : 0)).join('') + '|' + res.map((x) => (x.r.hint && !x.ok ? x.r.hint(s, g) : '')).join('/');
    const passed = res.filter((x) => x.ok).length;
    bar.style.width = (passed / LIST.length * 100) + '%';
    $('#ruleCount').textContent = `${passed}/${LIST.length}`;
    if (sig !== lastSig || force) { render(res, s, g, sig); lastSig = sig; }
    box.classList.toggle('burning', s.includes('🔥'));
    renderConfirm(allOk);
  }
  let prevOk = {};
  function render(res, s, g) {
    const bad = res.filter((x) => !x.ok).sort((a, b) => b.i - a.i);
    const good = res.filter((x) => x.ok).sort((a, b) => b.i - a.i);
    const ordered = [...bad, ...good];
    const order = ordered.map((x) => x.r.id).join(',');
    for (const x of ordered) {
      const c = card(x.r, x.i);
      c.classList.toggle('ok', x.ok); c.classList.toggle('bad', !x.ok);
      c.querySelector('.st').textContent = x.ok ? '✓' : '✕';
      c.querySelector('.hint').textContent = x.r.hint && !x.ok ? x.r.hint(s, g) : '';
      if (prevOk[x.r.id] !== undefined && prevOk[x.r.id] !== x.ok) { c.classList.remove('flip'); void c.offsetWidth; c.classList.add('flip'); if (x.ok) SFX.ok(); }
      prevOk[x.r.id] = x.ok;
    }
    if (order !== lastOrder) {
      lastOrder = order;
      const focusEl = document.activeElement;
      const frag = document.createDocumentFragment();
      for (const x of ordered) frag.append(cards.get(x.r.id));
      rulesEl.replaceChildren(frag);
      if (focusEl && focusEl !== document.activeElement && focusEl.isConnected) focusEl.focus({ preventScroll: true });
    }
  }

  const HOOKS = ['fire', 'hatch', 'feed', 'fly'];
  function onReveal(r) {
    if (r.id === 'fire' && !st.fireOut) startFire();
    if (r.id === 'hatch' && st.paul === 'egg') hatch();
    if (r.id === 'feed') { st.feedOn = true; st.mealAcc = 0; $('#hunger').hidden = false; Curio.toast('Paul is hungry! Keep 1 to 3 🐛 in your password.'); }
    if (r.id === 'fly' && !st.flySwatted) startFly();
  }

  function startFire() {
    st.fireOn = true;
    mutate((g) => {
      const pi = g.findIndex((x) => x === '🥚' || x === '🐣');
      let at, tries = 0;
      do { at = Math.floor(Math.random() * (g.length + 1)); tries++; } while (pi >= 0 && Math.abs(at - pi) < 4 && tries < 30);
      g.splice(at, 0, '🔥');
      return { g, at };
    });
    SFX.whoosh(); vibrate([30, 40, 30]);
  }
  function spreadFire() {
    mutate((g) => {
      const fires = g.map((x, i) => (x === '🔥' ? i : -1)).filter((i) => i >= 0);
      if (!fires.length) return null;
      const f = Curio.pick(fires);
      const opts = [f - 1, f + 1].filter((i) => i >= 0 && i < g.length && g[i] !== '🔥');
      if (!opts.length) return null;
      const t = Curio.pick(opts);
      if (g[t] === '🥚' || g[t] === '🐣') { setTimeout(() => killPaul('burned'), 0); }
      g[t] = '🔥';
      return { g, at: t };
    });
    Curio.beep(120 + Math.random() * 80, .1, 'sawtooth', .03);
  }
  function hatch() {
    mutate((g) => { const i = g.indexOf('🥚'); if (i < 0) return null; g[i] = '🐣'; return { g, at: i }; });
    st.paul = 'chick';
    const p = $('#pet'); p.classList.remove('hatching'); void p.offsetWidth; p.classList.add('hatching');
    renderPet(); SFX.chirp(); Curio.confetti(60); award('hatch');
  }

  let flyEl = null, flyRaf = 0, fx = 0, fy = 0, tx = 0, ty = 0;
  function startFly() {
    st.flyOn = true; st.flyAcc = 0;
    const zone = $('#flyZone');
    flyEl = document.createElement('button'); flyEl.type = 'button'; flyEl.className = 'pw-fly'; flyEl.setAttribute('aria-label', 'A fly. Click to swat it.');
    flyEl.innerHTML = '<svg viewBox="0 0 44 44"><ellipse class="wing" cx="15" cy="14" rx="9" ry="6" fill="rgba(200,230,255,.85)" stroke="#94a3b8"/><ellipse class="wing" cx="29" cy="14" rx="9" ry="6" fill="rgba(200,230,255,.85)" stroke="#94a3b8"/><ellipse cx="22" cy="24" rx="8" ry="10" fill="#1f2937"/><circle cx="22" cy="14" r="6" fill="#111827"/><circle cx="18.5" cy="12.5" r="3" fill="#b91c1c"/><circle cx="25.5" cy="12.5" r="3" fill="#b91c1c"/><path d="M15 26 l-6 4 M15 30 l-6 6 M29 26 l6 4 M29 30 l6 6" stroke="#111" stroke-width="1.5"/></svg>';
    zone.append(flyEl);
    const w = zone.clientWidth, h = zone.clientHeight;
    fx = w * .8; fy = h * .3; tx = fx; ty = fy;
    flyEl.addEventListener('click', swat);
    flyEl.addEventListener('pointerdown', (e) => { e.preventDefault(); swat(); });
    let buzz = 0, restUntil = 0, nextRest = performance.now() + 3000;
    const loop = (t) => {
      if (!flyEl) return;
      flyRaf = requestAnimationFrame(loop);
      if (document.hidden) return;
      const W = zone.clientWidth, H = zone.clientHeight;
      if (t > nextRest) { restUntil = t + 1800; nextRest = t + 4200; }
      if (t < restUntil) { flyEl.classList.add('landed'); return; }
      flyEl.classList.remove('landed');
      if (Math.hypot(tx - fx, ty - fy) < 8) { tx = 20 + Math.random() * (W - 40); ty = 10 + Math.random() * (H - 20); }
      const sp = hard() ? 3.2 : 2.2;
      const a = Math.atan2(ty - fy, tx - fx);
      fx += Math.cos(a) * sp + Math.sin(t / 90) * 1.2; fy += Math.sin(a) * sp + Math.cos(t / 70) * 1.2;
      flyEl.style.left = fx + 'px'; flyEl.style.top = fy + 'px';
      flyEl.style.transform = `rotate(${a * 57 + 90}deg)`;
      if (t - buzz > 2400 && !Curio.muted) { buzz = t; Curio.beep(180 + Math.random() * 40, .25, 'sawtooth', .012); }
    };
    flyRaf = requestAnimationFrame(loop);
  }
  function swat() {
    if (!flyEl || st.flySwatted) return;
    st.flySwatted = true; st.flyOn = false;
    const s = document.createElement('div'); s.className = 'pw-splat'; s.style.left = fx + 'px'; s.style.top = fy + 'px';
    s.innerHTML = '<svg viewBox="0 0 44 44"><path d="M22 6 l4 10 l10 -4 l-6 9 l10 5 l-11 2 l3 11 l-8 -7 l-6 9 l-1 -11 l-11 1 l8 -8 l-8 -7 l11 1Z" fill="#65a30d" opacity=".8"/><circle cx="22" cy="22" r="5" fill="#1f2937"/></svg>';
    $('#flyZone').append(s); setTimeout(() => s.remove(), 1400);
    flyEl.remove(); flyEl = null; cancelAnimationFrame(flyRaf);
    SFX.splat(); vibrate(40);
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    award('fly'); update(true); save2();
  }
  function flyEat() {
    let ate = '';
    mutate((g) => {
      const idx = g.map((x, i) => (/^[a-z]$/i.test(x) ? i : -1)).filter((i) => i >= 0);
      if (!idx.length) return null;
      const i = Curio.pick(idx); ate = g[i]; g.splice(i, 1); return { g, at: i };
    });
    if (ate && flyEl) {
      const n = document.createElement('div'); n.className = 'pw-nom'; n.textContent = `nom! ate "${ate}"`; n.style.left = fx + 'px'; n.style.top = (fy - 20) + 'px';
      $('#flyZone').append(n); setTimeout(() => n.remove(), 1000); Curio.beep(400, .05, 'square', .04);
    }
  }
  function stopLive() { if (flyEl) { flyEl.remove(); flyEl = null; } cancelAnimationFrame(flyRaf); clearTimeout(morseTimer); }

  function renderPet() {
    $('#petArt').innerHTML = paulSVG();
    const status = !st || st.paul === 'none' ? 'Not here yet.' : st.paul === 'dead' ? 'Gone, but not forgotten.' : st.paul === 'egg' ? 'An egg. Wobbling more as you go.' : st.feedOn ? (st.starve > 0 ? `Starving! ${Math.ceil(((hard() ? 20000 : 30000) - st.starve) / 1000)}s to feed him.` : 'Hatched, fed and chirpy.') : 'Hatched and chirpy.';
    $('#petStatus').textContent = status;
    $('#pet').classList.toggle('alarm', !!(st && st.feedOn && st.starve > 0 && st.paul === 'chick'));
  }

  let tickAcc = 0, lastSaveT = 0;
  setInterval(() => {
    if (!st || st.dead || st.won || document.hidden || $('#game').hidden) return;
    st.elapsed += 250;
    const secs = Math.floor(st.elapsed / 1000);
    $('#timer').textContent = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
    if (st.fireOn) {
      if (!pw.value.includes('🔥')) { st.fireOn = false; st.fireOut = true; Curio.toast('🧯 Fire is out. Phew.'); award('fire'); SFX.ok(); update(true); }
      else { st.fireAcc += 250; if (st.fireAcc >= (hard() ? 900 : 1400)) { st.fireAcc = 0; spreadFire(); } }
    }
    if (st.flyOn && !st.flySwatted) { st.flyAcc += 250; if (st.flyAcc >= (hard() ? 5000 : 8000)) { st.flyAcc = 0; flyEat(); } }
    if (st.feedOn && st.paul === 'chick') {
      const bugs = count(pw.value, '🐛');
      st.mealAcc += 250;
      if (st.mealAcc >= (hard() ? 15000 : 25000)) {
        st.mealAcc = 0;
        if (bugs > 0) { mutate((g) => { const i = g.lastIndexOf('🐛'); if (i < 0) return null; g.splice(i, 1); return { g, at: i }; }); Curio.toast('Paul ate a 🐛. Yum.'); SFX.chirp(); }
      }
      if (count(pw.value, '🐛') === 0) { st.starve += 250; if (st.starve >= (hard() ? 20000 : 30000)) return killPaul('starved'); }
      else st.starve = 0;
      const full = Math.min(1, count(pw.value, '🐛') / 3) * (1 - st.mealAcc / (hard() ? 15000 : 25000) * .33);
      $('#hungerBar').style.width = (st.starve > 0 ? (1 - st.starve / (hard() ? 20000 : 30000)) * 20 : 20 + full * 80) + '%';
      if (st.elapsed % 1000 === 0) renderPet();
    }
    if (st.elapsed % 1000 === 0) update();
    if (st.elapsed - lastSaveT > 3000) { lastSaveT = st.elapsed; save2(); }
  }, 250);

  let confirmShown = false;
  function renderConfirm(allOk) {
    if (st.won) return;
    if (allOk && !confirmShown) {
      confirmShown = true;
      confirmEl.innerHTML = `<div class="c-card confirm"><b style="font-size:20px">🎉 All ${LIST.length} rules satisfied!</b><div class="c-muted">Final rule: please confirm your password.</div>
        <input class="c-input" id="pw2" type="text" autocomplete="off" spellcheck="false" aria-label="Confirm password" placeholder="Retype your password">
        <div class="c-muted" style="font-size:13px" id="pw2msg">Retype it exactly. Yes, including Paul.</div></div>`;
      const p2 = $('#pw2');
      p2.addEventListener('input', () => {
        if (p2.value === pw.value) win();
        else if (glen(p2.value) >= glen(pw.value)) $('#pw2msg').textContent = 'Passwords do not match. Classic.';
      });
      SFX.reveal(LIST.length + 4);
    } else if (!allOk && confirmShown) { confirmShown = false; confirmEl.innerHTML = ''; }
  }

  function share(text) { navigator.clipboard?.writeText(text).then(() => Curio.toast('Copied! Paste it anywhere.'), () => Curio.modal({ emoji: '📋', title: 'Your result', body: text, buttons: [{ label: 'OK', value: 1 }] })); }

  function win() {
    st.won = true; pw.disabled = true; stopLive();
    const secs = Math.round(st.elapsed / 1000);
    const m = st.mode;
    save.wins[m] = (save.wins[m] || 0) + 1;
    const prev = save.best[m]; const isNew = prev == null || secs < prev; if (isNew) save.best[m] = secs;
    if (m === 'daily') save.daily[todayKey()] = secs;
    save.run = null; persist();
    award('win'); if (m === 'classic') award('classic'); if (m === 'classic' && secs < 900) award('fast'); if (m === 'hardcore') award('hard'); if (m === 'daily') award('daily'); if (m === 'quick') award('quick');
    if (glen(pw.value) >= 100) award('long');
    Curio.confetti(); SFX.win(); vibrate([40, 60, 40]);
    const tm = `${Math.floor(secs / 60)}m ${secs % 60}s`;
    const e = $('#end');
    e.innerHTML = `<div class="pw-cert"><svg viewBox="0 0 64 64" aria-hidden="true">${paulSVG().replace(/^<svg[^>]*>|<\/svg>$/g, '')}<path d="M24 12 l8 -12 l8 12Z" fill="#ec4899"/><circle cx="32" cy="0" r="3" fill="#facc15"/></svg>
      <div class="c-muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:12px">Certificate of password</div><h2>Password accepted!</h2>
      <p style="margin:4px 0">${MODES.find((x) => x.id === m).name} · ${LIST.length} rules · ${tm} · ${glen(pw.value)} characters</p>
      <p class="c-muted" style="margin:0">${isNew ? '🎉 New personal best!' : `Best: ${Math.floor(save.best[m] / 60)}m ${save.best[m] % 60}s`} · ${st.paul === 'chick' ? 'Paul survived and is very proud of you.' : 'Paul is proud of you.'}</p>
      <div class="pw-final" aria-label="Your final password">${esc(pw.value)}</div><p class="c-muted" style="font-size:12px;margin:0">Please do not use this as an actual password.</p></div>
      <div class="c-row"><button class="c-btn" type="button" id="again">Play again</button><button class="c-btn c-btn--ghost" type="button" id="shareBtn">📋 Share</button><button class="c-btn c-btn--ghost" type="button" id="toMenu">Menu</button></div>`;
    $('#game').hidden = true; e.hidden = false;
    $('#again').onclick = () => startGame(m); $('#toMenu').onclick = renderMenu;
    $('#shareBtn').onclick = () => share(`The Password Game (Curio) · ${MODES.find((x) => x.id === m).name}\n${LIST.length} rules in ${tm} · ${glen(pw.value)} characters · Paul ${st.paul === 'chick' ? 'survived 🐣' : 'is fine 🥚'}`);
    e.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function killPaul(cause) {
    if (st.dead) return;
    st.dead = true; st.cause = cause; st.paul = 'dead'; pw.disabled = true; stopLive();
    save.deaths[cause] = (save.deaths[cause] || 0) + 1; save.run = null; persist();
    if (Object.keys(save.deaths).filter((k) => k !== 'abandoned').length >= 3) award('rip3');
    renderPet(); SFX.sad(); vibrate([80, 60, 120]);
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    const msgs = { deleted: 'You backspaced over a baby chicken.', burned: 'The fire reached Paul. He was a little too crispy.', starved: 'Paul went too long without a 🐛.', overfed: 'Paul ate more than 3 bugs and exploded. You were warned.' };
    rulesEl.innerHTML = `<div class="c-card" style="text-align:center;padding:18px"><svg viewBox="0 0 64 64" width="80" height="80" aria-hidden="true">${paulSVG().replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><h3 style="margin:6px 0">Rest in peace, Paul.</h3><p class="c-muted">${msgs[cause] || ''}</p></div>`;
    cards.clear(); lastOrder = '';
    const v = await Curio.modal({ emoji: '🪦', title: 'Paul has died', body: msgs[cause] || '', buttons: [{ label: 'Try again', value: 'again' }, { label: 'Menu', value: 'menu' }] });
    if (v === 'again') startGame(st.mode); else renderMenu();
  }

  function save2() { if (st && !st.dead && !st.won) { save.run = { st, value: pw.value }; persist(); } }
  function onInput() { autosize(); update(); save2(); }
  pw.addEventListener('beforeinput', () => pushHist());
  pw.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); });
  pw.addEventListener('input', () => { if (pw.value.includes('\n')) pw.value = pw.value.replace(/\n/g, ''); onInput(); });
  addEventListener('resize', autosize);

  function startGame(mode, resume) {
    stopLive(); cards.clear(); lastOrder = ''; lastSig = ''; prevOk = {}; hist = []; confirmShown = false; confirmEl.innerHTML = '';
    LIST = listFor(mode);
    if (resume) { st = Object.assign(fresh(mode), resume.st); pw.value = resume.value; }
    else { if (st && st.paulPlaced && !st.dead && !st.won) { save.deaths.abandoned = (save.deaths.abandoned || 0) + 1; } st = fresh(mode); pw.value = ''; save.played++; }
    persist();
    $('#modeChip').textContent = `${MODES.find((m) => m.id === mode).icon} ${MODES.find((m) => m.id === mode).name}`;
    $('#hunger').hidden = !st.feedOn;
    pw.disabled = false; rulesEl.innerHTML = '';
    $('#menu').hidden = true; $('#end').hidden = true; $('#game').hidden = false;
    if (st.flyOn && !st.flySwatted) startFly();
    renderPet(); autosize(); update(true);
    pw.focus({ preventScroll: true });
    $('#game').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  $('#restart').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '🔄', title: 'Start over?', body: st && st.paulPlaced ? 'Your password, all its rules and Paul will be forgotten.' : 'Your password and all its rules will be forgotten.', buttons: [{ label: 'Start over', value: 1 }, { label: 'Cancel', value: 0 }] });
    if (v) startGame(st.mode);
  });
  $('#quit').addEventListener('click', () => { save2(); stopLive(); renderMenu(); });

  function heroArt() {
    return `<svg viewBox="0 0 220 150"><defs><linearGradient id="lk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#ffcf70"/><stop offset="1" stop-color="#f08a24"/></linearGradient></defs>
      <ellipse cx="110" cy="140" rx="80" ry="8" fill="rgba(0,0,0,.12)"/>
      <path d="M78 66 v-18 a32 32 0 0 1 64 0 v18" stroke="#94a3b8" stroke-width="12" fill="none" stroke-linecap="round"/>
      <rect x="62" y="62" width="96" height="74" rx="16" fill="url(#lk)"/><circle cx="110" cy="92" r="10" fill="#7c2d12"/><path d="M106 96 h8 l-2 16 h-4Z" fill="#7c2d12"/>
      ${['*', '*', '*', '*'].map((c, i) => `<text x="${80 + i * 20}" y="132" font-size="18" font-weight="900" fill="#fff" text-anchor="middle">${c}</text>`).join('')}
      <g transform="translate(170 92)"><g class="egg-wobble" style="--wob:2.4s;transform-origin:0 36px"><path d="M0 4 q14 9 14 27 a14 15 0 0 1 -28 0 q0 -18 14 -27Z" fill="#fdf3dc" stroke="#e0c99a" stroke-width="1.5"/><circle cx="-5" cy="18" r="2" fill="#d9b57a"/><circle cx="5" cy="28" r="2.5" fill="#d9b57a"/></g></g>
      <g transform="translate(36 100)"><rect x="-14" y="-10" width="28" height="20" rx="5" fill="#ef4444"/><text x="0" y="5" font-size="13" text-anchor="middle" font-weight="900" fill="#fff">✕</text></g>
      <g transform="translate(40 40)"><rect x="-14" y="-10" width="28" height="20" rx="5" fill="#22c55e"/><text x="0" y="5" font-size="13" text-anchor="middle" font-weight="900" fill="#fff">✓</text></g>
      <path d="M182 30 q6 -10 14 -4" stroke="#f97316" stroke-width="3" fill="none"/><text x="186" y="28" font-size="16">🔥</text></svg>`;
  }
  function renderMenu() {
    stopLive();
    $('#game').hidden = true; $('#end').hidden = true; $('#menu').hidden = false;
    $('#heroArt').innerHTML = heroArt();
    const m = $('#modes'); m.innerHTML = '';
    const resume = save.run;
    if (resume) {
      const b = document.createElement('button'); b.className = 'pw-mode'; b.type = 'button'; b.style.gridColumn = '1 / -1';
      b.style.setProperty('--a', '#fde68a'); b.style.setProperty('--b', '#f59e0b');
      b.innerHTML = `<span class="ic">▶️</span><span><b>Continue your password</b><small>${MODES.find((x) => x.id === resume.st.mode).name}, rule ${resume.st.revealed} of ${listFor(resume.st.mode).length}. ${resume.st.paulPlaced ? 'Paul is waiting.' : ''}</small></span>`;
      b.onclick = () => startGame(resume.st.mode, resume);
      m.append(b);
    }
    for (const md of MODES) {
      const b = document.createElement('button'); b.className = 'pw-mode'; b.type = 'button';
      b.style.setProperty('--a', md.a); b.style.setProperty('--b', md.b);
      const best = save.best[md.id];
      const dd = md.id === 'daily' && save.daily[todayKey()] != null;
      b.innerHTML = `<span class="ic" aria-hidden="true">${md.icon}</span><span><b>${md.name}</b><small>${md.desc}</small>${dd ? '<span class="done">Done today ✓</span>' : best != null ? `<span class="done">Best: ${Math.floor(best / 60)}m ${best % 60}s</span>` : ''}</span>`;
      b.onclick = async () => {
        if (save.run) { const v = await Curio.modal({ emoji: '🥚', title: 'Abandon your current password?', body: 'Your saved password (and maybe Paul) will be lost.', buttons: [{ label: 'Start new', value: 1 }, { label: 'Cancel', value: 0 }] }); if (!v) return; if (save.run.st.paulPlaced) save.deaths.abandoned = (save.deaths.abandoned || 0) + 1; save.run = null; persist(); }
        startGame(md.id);
      };
      m.append(b);
    }
    const wins = Object.values(save.wins).reduce((a, b) => a + b, 0);
    const deaths = Object.entries(save.deaths).filter(([k]) => k !== 'abandoned').reduce((a, [, b]) => a + b, 0);
    $('#statsRow').innerHTML = `<div class="c-stat"><b>${wins}</b><span>Passwords</span></div><div class="c-stat"><b>${save.furthest}</b><span>Furthest rule</span></div><div class="c-stat"><b>${deaths}</b><span>Pauls lost</span></div><div class="c-stat"><b>${save.badges.length}/${BADGES.length}</b><span>Badges</span></div>`;
    $('#menuExtra').innerHTML = '';
  }
  $('#howBtn').addEventListener('click', () => {
    $('#menuExtra').innerHTML = `<div class="pw-how"><h3>How to play</h3><ol>
      <li>Type a password. Each time it satisfies every rule so far, a new rule appears.</li>
      <li>Rules stack up and some fight each other. Broken rules float to the top in red.</li>
      <li>Some rules are live: a fire spreads through your password, a fly eats letters, and Paul eats bugs. Others are tiny games: a die, a Morse lamp and bubble wrap.</li>
      <li>Paul is an egg. Keep him in your password. If you delete him, burn him, starve him or overfeed him, it's over.</li>
      <li>Use the emoji tray for moons, eggs, bugs and muscles. Your progress saves itself, so you can come back later.</li>
    </ol></div>`;
  });
  $('#badgeBtn').addEventListener('click', () => {
    const got = new Set(save.badges);
    const graves = Object.entries(save.deaths).filter(([, n]) => n > 0);
    $('#menuExtra').innerHTML = `<div class="pw-badges">${BADGES.map(([id, ic, n, d]) => `<div class="pw-badge${got.has(id) ? ' got' : ''}"><i>${ic}</i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>
      <h3 style="margin:18px 0 4px">In memory of Paul</h3>${graves.length ? `<div class="pw-graves">${graves.map(([k, n]) => `<div class="pw-grave"><svg viewBox="0 0 64 64" aria-hidden="true"><path d="M14 60 V28 a18 18 0 0 1 36 0 V60Z" fill="#94a3b8"/><text x="32" y="40" font-size="12" text-anchor="middle" font-weight="900" fill="#334155">× ${n}</text><path d="M8 60 h48" stroke="#16a34a" stroke-width="4"/></svg><div>${CAUSES[k] || k}</div></div>`).join('')}</div>` : '<p class="c-muted">No Pauls have been harmed. Yet.</p>'}`;
  });

  window.__pw = { RULES, get LIST() { return LIST; }, get st() { return st; }, moonIndex, DATA, glen, update, startGame, swat, hatch, killPaul };
  if (save.run) { startGame(save.run.st.mode, save.run); Curio.toast('Welcome back. Your password missed you.'); }
  else renderMenu();
})();
