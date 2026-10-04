(() => {
  const $ = (id) => document.getElementById(id);
  const MODES = {
    visual: { name: 'Light', kind: 'simple', desc: 'Click when red turns green', color: '#1faa59', median: 273, sigma: .24, icon: '<svg viewBox="0 0 48 48"><rect x="15" y="3" width="18" height="42" rx="8" fill="#2a2a30"/><circle cx="24" cy="12" r="5" fill="#e04848"/><circle cx="24" cy="24" r="5" fill="#f2c14e" opacity=".35"/><circle cx="24" cy="36" r="5" fill="#2bd46e"/></svg>' },
    audio: { name: 'Sound', kind: 'simple', desc: 'Click the moment you hear the beep', color: '#4d6df0', median: 235, sigma: .25, icon: '<svg viewBox="0 0 48 48"><path d="M8 18 H16 L26 9 V39 L16 30 H8Z" fill="#4d6df0"/><path d="M31 17 Q36 24 31 31 M36 12 Q44 24 36 36" stroke="#4d6df0" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>' },
    choice: { name: 'Colour', kind: 'choice', n: 2, desc: 'Blue means left, orange means right', color: '#ff8a1f', median: 420, sigma: .22, icon: '<svg viewBox="0 0 48 48"><path d="M24 6 A18 18 0 0 0 24 42Z" fill="#2f7bf0"/><path d="M24 6 A18 18 0 0 1 24 42Z" fill="#ff8a1f"/></svg>' },
    choice4: { name: 'Four colours', kind: 'choice', n: 4, desc: 'Four colours, four keys: D F J K', color: '#e0457b', median: 520, sigma: .24, icon: '<svg viewBox="0 0 48 48"><path d="M24 24 L24 6 A18 18 0 0 0 6 24Z" fill="#2f7bf0"/><path d="M24 24 L42 24 A18 18 0 0 0 24 6Z" fill="#ff8a1f"/><path d="M24 24 L6 24 A18 18 0 0 0 24 42Z" fill="#1faa59"/><path d="M24 24 L24 42 A18 18 0 0 0 42 24Z" fill="#e0457b"/></svg>' },
    stroop: { name: 'Tricky words', kind: 'choice', n: 2, stroop: true, desc: 'Answer the ink colour, not the word', color: '#c79a00', median: 560, sigma: .25, icon: '<svg viewBox="0 0 48 48"><rect x="3" y="11" width="42" height="26" rx="8" fill="#2a2a30"/><text x="24" y="29" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="12" fill="#ff8a1f">BLUE</text></svg>' },
    gonogo: { name: 'Go / No-go', kind: 'gonogo', desc: 'Click on green. Freeze on purple.', color: '#8e3bd6', median: 340, sigma: .22, icon: '<svg viewBox="0 0 48 48"><circle cx="16" cy="24" r="11" fill="#2bd46e"/><path d="M31 15 L39 15 L44 20 L44 28 L39 33 L31 33 L26 28 L26 20Z" fill="#8e3bd6"/></svg>' },
    timing: { name: 'Timing', kind: 'timing', desc: 'Stop the orbiting dot right on the line', color: '#16a3b8', median: 48, sigma: .62, lo: 5, step: 20, icon: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="#bfe8ef" stroke-width="5"/><path d="M24 2 V12" stroke="#16a3b8" stroke-width="4" stroke-linecap="round"/><circle cx="36" cy="12" r="5.5" fill="#16a3b8"/></svg>' }
  };
  const ORDER = Object.keys(MODES);
  const COLS2 = [{ n: 'BLUE', c: '#2f7bf0', c2: '#1442a0', k: 'F' }, { n: 'ORANGE', c: '#ff8a1f', c2: '#c44f00', k: 'J' }];
  const COLS4 = [{ n: 'BLUE', c: '#2f7bf0', c2: '#1442a0', k: 'D' }, { n: 'ORANGE', c: '#ff8a1f', c2: '#c44f00', k: 'F' }, { n: 'GREEN', c: '#1faa59', c2: '#0f6b37', k: 'J' }, { n: 'PINK', c: '#e0457b', c2: '#99204c', k: 'K' }];
  const colsFor = (m) => MODES[m].n === 4 ? COLS4 : COLS2;
  const IC = {
    lightRed: '<svg viewBox="0 0 64 64"><rect x="18" y="2" width="28" height="60" rx="12" fill="#232328"/><circle cx="32" cy="16" r="15" fill="#ff5b5b" opacity=".25"/><circle cx="32" cy="16" r="10" fill="#ff5b5b"/><circle cx="32" cy="32" r="8" fill="#5a4a1e"/><circle cx="32" cy="48" r="8" fill="#1e4a30"/><circle cx="29" cy="13" r="3" fill="#fff" opacity=".6"/></svg>',
    lightGreen: '<svg viewBox="0 0 64 64"><rect x="18" y="2" width="28" height="60" rx="12" fill="#232328"/><circle cx="32" cy="16" r="8" fill="#5a1e1e"/><circle cx="32" cy="32" r="8" fill="#5a4a1e"/><circle cx="32" cy="48" r="15" fill="#7dffb0" opacity=".3"/><circle cx="32" cy="48" r="10" fill="#3dff8a"/><circle cx="29" cy="45" r="3" fill="#fff" opacity=".7"/></svg>',
    tap: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="14" fill="#fff"/><g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M32 4 V12 M32 52 V60 M4 32 H12 M52 32 H60 M12 12 L18 18 M46 46 L52 52 M52 12 L46 18 M18 46 L12 52"/></g></svg>',
    hand: '<svg viewBox="0 0 64 64"><path d="M20 30 V14 a4 4 0 0 1 8 0 V28 V10 a4 4 0 0 1 8 0 V28 V13 a4 4 0 0 1 8 0 V30 V20 a4 4 0 0 1 8 0 V38 C52 52 44 60 34 60 C26 60 20 56 14 46 L8 36 a4 4 0 0 1 7 -4Z" fill="#fff"/></svg>',
    watch: '<svg viewBox="0 0 64 64"><circle cx="32" cy="36" r="22" fill="none" stroke="#fff" stroke-width="6"/><path d="M32 36 L40 26" stroke="#fff" stroke-width="5" stroke-linecap="round"/><rect x="26" y="4" width="12" height="7" rx="3" fill="#fff"/></svg>',
    ear: '<svg viewBox="0 0 64 64"><path d="M10 24 H22 L36 12 V52 L22 40 H10Z" fill="#fff"/><path d="M44 22 Q50 32 44 42 M50 16 Q60 32 50 48" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".5"/></svg>',
    flag: '<svg viewBox="0 0 64 64"><path d="M14 6 V60" stroke="#fff" stroke-width="6" stroke-linecap="round"/><path d="M16 8 H52 L44 20 L52 32 H16Z" fill="#fff"/></svg>',
    dots: '<svg viewBox="0 0 64 64"><circle cx="14" cy="32" r="6" fill="#fff"><animate attributeName="opacity" values="1;.3;1" dur="1.2s" repeatCount="indefinite"/></circle><circle cx="32" cy="32" r="6" fill="#fff"><animate attributeName="opacity" values="1;.3;1" dur="1.2s" begin=".2s" repeatCount="indefinite"/></circle><circle cx="50" cy="32" r="6" fill="#fff"><animate attributeName="opacity" values="1;.3;1" dur="1.2s" begin=".4s" repeatCount="indefinite"/></circle></svg>',
    circle: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="#fff"/></svg>',
    diamond: '<svg viewBox="0 0 64 64"><path d="M32 4 L60 32 L32 60 L4 32Z" fill="#fff"/></svg>',
    square: '<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="8" fill="#fff"/></svg>',
    tri: '<svg viewBox="0 0 64 64"><path d="M32 6 L60 56 H4Z" fill="#fff"/></svg>',
    stop: '<svg viewBox="0 0 64 64"><path d="M22 4 H42 L60 22 V42 L42 60 H22 L4 42 V22Z" fill="#fff"/><rect x="16" y="28" width="32" height="8" rx="4" fill="#8e3bd6"/></svg>',
    check: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="#fff"/><path d="M18 33 L28 43 L47 22" stroke="#1f9d55" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    mute: '<svg viewBox="0 0 64 64"><path d="M10 24 H22 L36 12 V52 L22 40 H10Z" fill="#fff"/><path d="M44 24 L58 40 M58 24 L44 40" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>',
    orbit: '<svg viewBox="0 0 120 120" class="rt-orbit"><circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="10"/><path d="M60 2 V26" stroke="#fff" stroke-width="5" stroke-linecap="round"/><g id="orbDot"><circle cx="60" cy="14" r="12" fill="#ffe14d" opacity=".35"/><circle cx="60" cy="14" r="8" fill="#ffe14d"/></g></svg>'
  };
  const SHAPES = ['circle', 'diamond', 'square', 'tri'];
  const ACH = [
    { id: 'first', em: '⚡', name: 'First Spark', desc: 'Finish any session.' },
    { id: 's250', em: '🏎️', name: 'Quick', desc: 'Average under 250ms on Light.' },
    { id: 's210', em: '🚀', name: 'Lightning', desc: 'Average under 210ms on Light.' },
    { id: 's180', em: '🐈', name: 'Cat Reflexes', desc: 'Average under 180ms on Light.' },
    { id: 'audio', em: '👂', name: 'Sharp Ears', desc: 'Average under 210ms on Sound.' },
    { id: 'choice', em: '🎨', name: 'Colour Sorter', desc: 'Finish Colour with no mistakes.' },
    { id: 'choicefast', em: '🧠', name: 'Quick Decider', desc: 'Average under 380ms on Colour.' },
    { id: 'four', em: '🌈', name: 'Rainbow Brain', desc: 'Finish Four colours with no mistakes.' },
    { id: 'stroop', em: '🪄', name: 'Word Wizard', desc: 'Finish Tricky words with 90%+ right.' },
    { id: 'gonogo', em: '🧊', name: 'Ice Cold', desc: 'Finish Go / No-go with no false starts.' },
    { id: 'timing', em: '🎯', name: 'Clockwork', desc: 'Timing: average under 30ms off.' },
    { id: 'spot', em: '💫', name: 'Spot On', desc: 'Timing: land within 3ms of the line.' },
    { id: 'streak', em: '🔥', name: 'Hot Streak', desc: 'Five Light tries in a row under 250ms.' },
    { id: 'steady', em: '📏', name: 'Metronome', desc: 'Spread under 20ms in a 10+ try session.' },
    { id: 'marathon', em: '🏃', name: 'Marathon', desc: 'Finish a 20-try session.' },
    { id: 'allmodes', em: '🎛️', name: 'All Rounder', desc: 'Finish all seven modes.' },
    { id: 'daily', em: '📅', name: 'Daily Reflex', desc: 'Finish a daily challenge.' },
    { id: 'days3', em: '🗓️', name: 'Three Days', desc: 'Play on three different days.' },
    { id: 'jumpy', em: '🦘', name: 'Jumpy', desc: 'Jump the gun three times in one session.' },
    { id: 'pb', em: '🏅', name: 'Improving', desc: 'Beat your personal best.' },
    { id: 'owl', em: '🦉', name: 'Night Owl', desc: 'Finish a session after 10pm.' },
    { id: 'lark', em: '🐦', name: 'Early Bird', desc: 'Finish a session before 8am.' },
    { id: 'hundred', em: '💯', name: 'Hundred Club', desc: 'Make 100 tries in total.' },
    { id: 'regular', em: '🎖️', name: 'Regular', desc: 'Finish 25 sessions.' }
  ];
  const FACTS = [
    'A blink of an eye takes roughly 100 to 400 milliseconds.',
    'In sprinting, reacting within 0.1 seconds of the starting gun counts as a false start.',
    'Hearing is usually a little quicker than sight: sound signals reach the brain faster than visual ones.',
    'Your fastest nerve fibres carry signals at up to about 120 metres per second.',
    'A screen refreshing 60 times a second only shows a new picture every 16.7 milliseconds, so your device adds a little delay of its own.',
    'More choices make decisions slower. Psychologists call this Hick\'s law.',
    'Naming the ink colour of a word like BLUE printed in orange is slow. It is called the Stroop effect, first described in 1935.',
    'Reaction times tend to be quickest in your twenties and slow down gently with age.',
    'Being tired slows your reactions, so a good night\'s sleep really does help.',
    'Most people get a little faster over their first few tries. Warming up is real.',
    'Go / no-go tasks are used by scientists to study self-control: the hard part is not reacting.',
    'Light travels about 300 kilometres in a single millisecond.',
    'Sound only travels about 34 centimetres in a millisecond through air.',
    'Many hummingbirds beat their wings more than 50 times a second.',
    'Catching a falling ruler is an old classroom way to measure reaction time: the further it drops, the slower you were.',
    'Timing tasks test anticipation: instead of reacting, you predict when something will happen. Batters and goalkeepers rely on it.'
  ];
  const TIERS = [[.62, '🐈', 'Cat reflexes', 'Suspiciously fast. Are you a cat?'], [.77, '⚡', 'Lightning', 'Lightning reflexes. Esports scouts, take note.'], [.92, '🏎️', 'Racer', 'Quick! Faster than most humans.'], [1.08, '🙂', 'Solidly human', 'Right around the human average.'], [1.28, '☕', 'Sleepy', 'A touch sleepy. A stretch might help.'], [99, '🐢', 'Tortoise', 'Were you also doing something else?']];

  const fresh = () => ({ v: 2, mode: 'visual', tries: 5, hist: {}, done: {}, ach: {}, daily: {}, fastest: {}, tot: { tries: 0, earlies: 0, sessions: 0 }, days: {} });
  let P = Object.assign(fresh(), Curio.store.get('rt:v2', {}) || {});
  if (P.v !== 2) P = fresh();
  ['hist', 'done', 'ach', 'daily', 'fastest', 'days'].forEach((k) => { if (!P[k] || typeof P[k] !== 'object') P[k] = {}; });
  if (!P.tot || typeof P.tot !== 'object') P.tot = fresh().tot;
  if (!MODES[P.mode]) P.mode = 'visual';
  if (![5, 10, 20].includes(P.tries)) P.tries = 5;
  const save = () => Curio.store.set('rt:v2', P);
  const bestKey = (m) => m === 'visual' ? 'avg' : 'avg-' + m;

  const panel = $('panel'), icon = $('icon'), big = $('big'), small = $('small'), pips = $('pips'), results = $('results'), choiceBox = $('choice');
  let mode = P.mode, tries = P.tries, daily = false;
  let state = 'ready', times = [], trials = [], timer = 0, goAt = 0, target = 0, isNogo = false, earlies = 0, rng = Math.random, streak = 0, factIdx = Math.floor(Math.random() * FACTS.length);
  let orbit = null, trialMeta = {}, lastPt = null;

  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const R = (a, b) => a + rng() * (b - a);
  const kind = () => MODES[mode].kind;

  function set(cls, ic, b, s, col) {
    panel.className = 'rt-panel' + (cls ? ' is-' + cls : '') + (kind() === 'choice' ? ' has-choice' : '') + (MODES[mode].n === 4 ? ' has-four' : '');
    if (col) { panel.style.setProperty('--pc', col.c); panel.style.setProperty('--pc2', col.c2); } else { panel.style.removeProperty('--pc'); panel.style.removeProperty('--pc2'); }
    icon.className = 'rt-icon' + (ic === 'orbit' ? ' rt-icon--big' : '') + (ic === 'mode' ? ' rt-icon--mode' : '');
    icon.innerHTML = ic === 'mode' ? MODES[mode].icon : IC[ic] || '';
    big.textContent = b; small.textContent = s; big.style.color = '';
    void panel.offsetWidth; panel.classList.add('is-big');
  }

  function tone(f, d, type = 'sine', v = .12, at = 0) {
    if (Curio.muted) return 0;
    const ac = Curio.audioContext && Curio.audioContext(); if (!ac) return 0;
    const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .004); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + .03);
    return ac;
  }
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  function sparks(x, y, n = 14, col = '#fff') {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const r = panel.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'); s.className = 'rt-spark';
      const a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 90;
      s.style.left = (x - r.left) + 'px'; s.style.top = (y - r.top) + 'px'; s.style.background = col;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      panel.append(s); setTimeout(() => s.remove(), 650);
    }
  }

  const listForPips = () => kind() === 'gonogo' ? trials.filter((t) => !t.nogo || t.err) : trials;
  function goalCount() { return kind() === 'gonogo' ? times.length : trials.length; }
  function paintPips() {
    pips.innerHTML = '';
    const list = listForPips();
    const valid = times.length ? Math.min(...times) : null;
    for (let i = 0; i < tries; i++) {
      const d = document.createElement('div');
      const t = list[i];
      let cls = 'rt-pip';
      if (t) cls += ' is-set' + (t.err ? ' is-bad' : '') + (!t.err && t.ms === valid && times.length > 1 ? ' is-best' : '');
      d.className = cls;
      if (!t) d.textContent = '#' + (i + 1);
      else if (t.err) d.textContent = '✕ ' + (t.err === 'nogo' ? 'stop' : t.err === 'miss' ? 'missed' : 'wrong');
      else if (kind() === 'timing') d.textContent = (t.signed > 0 ? '+' : t.signed < 0 ? '-' : '') + t.ms + ' ms';
      else d.textContent = t.ms + ' ms';
      pips.append(d);
    }
    if (kind() === 'gonogo') {
      const ok = trials.filter((t) => t.nogo && !t.err).length;
      if (ok) { const d = document.createElement('div'); d.className = 'rt-pip is-set is-best'; d.textContent = `✋ ${ok} held`; pips.append(d); }
    }
  }

  function readyScreen() {
    clearTimeout(timer); stopOrbit(); state = 'ready';
    paintChoice();
    $('fact').textContent = '💡 ' + FACTS[factIdx % FACTS.length];
    if (mode === 'audio' && Curio.muted) { set('neutral', 'mute', 'Sound is off', 'Turn it on with 🔊 in the top bar, then click to start'); return; }
    const m = MODES[mode];
    const pb = Curio.getBest(bestKey(mode));
    set('ready', 'mode', daily ? 'Daily challenge' : 'Click to start', `${m.desc}.${pb != null ? ' Best: ' + pb + 'ms' + (kind() === 'timing' ? ' off' : '') : ''}`);
  }
  function paintChoice() {
    const k = kind();
    choiceBox.hidden = k !== 'choice';
    if (k !== 'choice') return;
    const cols = colsFor(mode);
    choiceBox.className = 'rt-choice' + (cols.length === 4 ? ' is-four' : '');
    choiceBox.innerHTML = cols.map((c, i) => `<button class="rt-cbtn" type="button" data-side="${i}" style="--bc:${c.c}"><kbd>${c.k}</kbd><span>${c.n}</span></button>`).join('');
  }

  function arm() {
    if (mode === 'audio' && Curio.muted) { readyScreen(); return; }
    clearTimeout(timer);
    if (kind() === 'timing') return startOrbit();
    state = 'wait';
    if (mode === 'visual') set('wait', 'lightRed', 'Wait for green…', 'Steady…');
    else if (mode === 'audio') set('listen', 'ear', 'Listen…', 'Click when you hear the beep');
    else if (kind() === 'choice') set('neutral', 'dots', 'Get ready…', MODES[mode].stroop ? 'Answer the INK colour, not the word' : colsFor(mode).map((c) => c.n.toLowerCase() + ': ' + c.k).join(' · '));
    else set('neutral', 'dots', 'Wait…', 'Green: click. Purple: don\'t!');
    const delay = kind() === 'simple' ? R(1500, 4500) : R(1000, 2800);
    timer = setTimeout(stimulus, delay);
  }

  function markGo() { goAt = performance.now(); requestAnimationFrame(() => { goAt = performance.now(); }); }
  function stimulus() {
    state = 'go';
    if (mode === 'visual') { set('go', 'lightGreen', 'CLICK!', ''); markGo(); }
    else if (mode === 'audio') {
      const ac = Curio.audioContext && Curio.audioContext();
      if (!ac || Curio.muted) { readyScreen(); return; }
      const lead = .03;
      tone(1000, .16, 'square', .14, lead);
      goAt = performance.now() + lead * 1000 + ((ac.outputLatency || ac.baseLatency || 0) * 1000);
    } else if (kind() === 'choice') {
      const cols = colsFor(mode);
      target = Math.floor(rng() * cols.length);
      if (MODES[mode].stroop) {
        const congruent = rng() < .5;
        const word = congruent ? target : 1 - target;
        set('stroop', '', cols[word].n, '');
        big.style.color = cols[target].c;
        trialMeta = { congruent };
      } else {
        set('color', SHAPES[target], cols[target].n, cols.length === 2 ? (target ? 'right ▶' : '◀ left') : 'key ' + cols[target].k, cols[target]);
        trialMeta = {};
      }
      markGo();
    } else {
      isNogo = rng() < .3;
      if (isNogo) {
        set('nogo', 'stop', 'STOP', 'Don\'t touch anything');
        timer = setTimeout(() => {
          trials.push({ nogo: true, ms: 0, err: '' });
          state = 'result'; set('good', 'check', 'Nice restraint', 'Next one coming…');
          tone(660, .08, 'triangle', .08); paintPips();
          timer = setTimeout(arm, 900);
        }, 1100);
      } else set('go', 'tap', 'GO!', '');
      markGo();
    }
  }

  const PERIOD = 1500;
  function startOrbit() {
    state = 'orbit';
    set('orbit', 'orbit', '', 'Click or press Space as the dot crosses the line');
    const revs = R(.85, 1.7);
    const t0 = performance.now() + 150;
    orbit = { t0, target: t0 + revs * PERIOD, revs, raf: 0 };
    const dot = icon.querySelector('#orbDot');
    const step = () => {
      if (state !== 'orbit' || !orbit) return;
      const now = performance.now();
      const left = (orbit.target - now) / PERIOD;
      if (dot) dot.setAttribute('transform', `rotate(${(-left * 360).toFixed(2)} 60 60)`);
      if (now > orbit.target + 450) { timingResult(null); return; }
      orbit.raf = requestAnimationFrame(step);
    };
    orbit.raf = requestAnimationFrame(step);
  }
  function stopOrbit() { if (orbit) cancelAnimationFrame(orbit.raf); orbit = null; }
  function timingResult(stamp) {
    if (!orbit) return;
    const tgt = orbit.target; stopOrbit();
    if (stamp == null) {
      trials.push({ ms: 450, signed: 450, err: 'miss' });
      state = 'result'; set('early', 'hand', 'Missed it!', 'The dot sailed past. Click to try the next one');
      tone(160, .2, 'square', .07); paintPips();
      if (trials.length >= tries) return done();
      return;
    }
    const signed = Math.round(stamp - tgt), ms = Math.abs(signed);
    times.push(ms); trials.push({ ms, signed, err: '' });
    paintPips();
    if (ms <= 3) unlock('spot');
    tone(ms < 15 ? 1318 : ms < 40 ? 988 : 659, .12, 'triangle', .1); buzz(12);
    if (lastPt) sparks(lastPt.x, lastPt.y, ms < 15 ? 22 : 10, '#ffe14d');
    if (trials.length >= tries) return done();
    state = 'result';
    const what = ms <= 3 ? 'Spot on!' : ms + ' ms ' + (signed < 0 ? 'early' : 'late');
    set('result', 'watch', what, `${trials.length} of ${tries}. Click to go again`);
  }

  function hit(stamp, side) {
    if (state === 'done') { restart(); return; }
    if (state === 'ready' || state === 'early' || state === 'result') return arm();
    if (state === 'orbit') return timingResult(stamp);
    if (state === 'wait') {
      clearTimeout(timer); state = 'early'; earlies++; streak = 0;
      if (earlies >= 3) unlock('jumpy');
      set('early', 'hand', 'Too soon!', 'Click to try that one again');
      tone(160, .2, 'square', .07); buzz([30, 40, 30]);
      return;
    }
    if (state !== 'go') return;
    const ms = Math.round(stamp - goAt);
    if (kind() === 'gonogo' && isNogo) {
      clearTimeout(timer);
      trials.push({ nogo: true, ms, err: 'nogo' });
      state = 'result'; set('early', 'hand', 'That was a STOP!', 'Impulse control: 0. Click to continue');
      tone(160, .25, 'square', .07); buzz([40, 30, 40]); paintPips();
      return;
    }
    if (ms < 100) {
      state = 'early'; earlies++; streak = 0;
      set('early', 'hand', 'Too fast to be real', 'Guessing doesn\'t count. Click to retry');
      tone(160, .2, 'square', .07);
      return;
    }
    if (kind() === 'choice') {
      if (side == null) return;
      if (side !== target) {
        trials.push({ ms, err: 'wrong', congruent: trialMeta.congruent });
        state = 'result'; set('early', 'hand', 'Wrong colour!', 'Click or press a key to continue');
        tone(160, .25, 'square', .07); buzz([40, 30, 40]); paintPips();
        if (trials.length >= tries) return done();
        return;
      }
    }
    times.push(ms); trials.push({ ms, err: '', congruent: trialMeta.congruent });
    paintPips();
    tone(ms < 220 ? 1046 : ms < 300 ? 784 : 523, .1, 'triangle', .12); buzz(15);
    if (lastPt) sparks(lastPt.x, lastPt.y, ms < MODES[mode].median * .85 ? 20 : 10);
    if (mode === 'visual') { streak = ms < 250 ? streak + 1 : 0; if (streak >= 5) unlock('streak'); }
    if (goalCount() >= tries) return done();
    state = 'result';
    const n = goalCount();
    const hot = mode === 'visual' && streak >= 3 ? `🔥 ${streak} in a row under 250! ` : '';
    set('result', 'watch', ms + ' ms', `${hot}${ms < 200 ? 'Blazing! ' : ms < 260 ? 'Quick! ' : ms > 400 && kind() === 'simple' ? 'Sleepy. ' : ''}${n} of ${tries}. ${kind() === 'choice' ? 'Press a key' : 'Click'} to keep going`);
  }

  function erf(x) { const s = Math.sign(x); x = Math.abs(x); const t = 1 / (1 + .3275911 * x); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return s * y; }
  const cdf = (ms, m) => .5 * (1 + erf(Math.log(ms / m.median) / (m.sigma * Math.SQRT2)));
  const pdf = (ms, m) => Math.exp(-((Math.log(ms / m.median)) ** 2) / (2 * m.sigma * m.sigma)) / (ms * m.sigma * Math.sqrt(2 * Math.PI));
  const tierFor = (a) => { const r = a / MODES[mode].median; return TIERS.find((t) => r < t[0]); };

  function drawChart(avg) {
    const m = MODES[mode], svg = $('chart');
    const MINMS = m.lo || 100, step = m.step || 100;
    const X0 = 30, X1 = 610, Y0 = 170, Y1 = 36, MAXMS = Math.max(MINMS + step * 5, Math.round(m.median * 2.3 / step) * step);
    const x = (ms) => X0 + (Math.min(MAXMS, Math.max(MINMS, ms)) - MINMS) / (MAXMS - MINMS) * (X1 - X0);
    const peak = pdf(m.median * Math.exp(-m.sigma * m.sigma), m);
    const y = (ms) => Y0 - pdf(ms, m) / peak * (Y0 - Y1);
    const inc = (MAXMS - MINMS) / 150;
    let line = '';
    for (let ms = MINMS; ms <= MAXMS + .001; ms += inc) line += `${ms === MINMS ? 'M' : 'L'}${x(ms).toFixed(1)} ${y(ms).toFixed(1)} `;
    const lo = Math.max(MINMS, Math.min(avg, MAXMS));
    let slower = `M${x(lo).toFixed(1)} ${Y0} L${x(lo).toFixed(1)} ${y(lo).toFixed(1)} `;
    for (let ms = lo; ms <= MAXMS + .001; ms += inc) slower += `L${x(ms).toFixed(1)} ${y(ms).toFixed(1)} `;
    slower += `L${x(MAXMS)} ${Y0} Z`;
    const tstep = (MAXMS - MINMS) / step > 7 ? step * 2 : step;
    let ticks = '';
    for (let t = Math.ceil(MINMS / tstep) * tstep; t <= MAXMS; t += tstep) ticks += `<text x="${x(t)}" y="${Y0 + 22}" text-anchor="middle">${t}ms</text><line x1="${x(t)}" x2="${x(t)}" y1="${Y0}" y2="${Y0 + 5}" stroke="var(--line)" stroke-width="2"/>`;
    const ax = x(avg), anchor = ax > 520 ? 'end' : ax < 120 ? 'start' : 'middle';
    svg.innerHTML = `<defs><linearGradient id="rtg" x1="0" x2="1"><stop offset="0" stop-color="${m.color}" stop-opacity=".45"/><stop offset="1" stop-color="${m.color}" stop-opacity=".12"/></linearGradient></defs>
      <path d="${line} L${X1} ${Y0} L${X0} ${Y0} Z" fill="var(--surface-2)"/>
      <path d="${slower}" fill="url(#rtg)"/>
      <path d="${line}" fill="none" stroke="var(--ink-3)" stroke-width="2.5"/>
      <line x1="${X0}" x2="${X1}" y1="${Y0}" y2="${Y0}" stroke="var(--line)" stroke-width="2"/>
      <line x1="${x(m.median)}" x2="${x(m.median)}" y1="${Y1 + 12}" y2="${Y0}" stroke="var(--ink-3)" stroke-width="1.5" stroke-dasharray="4 5"/>
      <text x="${x(m.median) + 6}" y="${Y1 + 8}">typical ${m.median}ms</text>
      ${ticks}
      <line x1="${ax}" x2="${ax}" y1="${Y1 - 12}" y2="${Y0}" stroke="var(--accent)" stroke-width="3"/>
      <circle cx="${ax}" cy="${y(Math.min(Math.max(avg, MINMS), MAXMS))}" r="6" fill="var(--accent)"/>
      <text class="rt-you" x="${ax}" y="${Y1 - 18}" text-anchor="${anchor}">You · ${avg}ms</text>`;
  }
  function drawBars() {
    const svg = $('bars'), list = listForPips();
    const max = Math.max(kind() === 'timing' ? 30 : 500, ...list.filter((t) => !t.err).map((t) => t.ms || 0));
    const n = list.length, bw = Math.min(60, 580 / Math.max(1, n));
    const fast = times.length ? Math.min(...times) : 0;
    let out = `<line x1="30" x2="620" y1="120" y2="120" stroke="var(--line)" stroke-width="2"/>`;
    list.forEach((t, i) => {
      const x = 34 + i * (580 / n) + (580 / n - bw) / 2 + 2, h = t.err ? 100 : Math.max(4, (t.ms / max) * 100);
      let col = t.err ? 'var(--bad)' : t.ms === fast ? 'var(--good)' : MODES[mode].color;
      if (kind() === 'timing' && !t.err && t.ms !== fast) col = t.signed < 0 ? '#4d6df0' : '#ff8a1f';
      out += `<rect x="${x.toFixed(1)}" y="${(120 - h).toFixed(1)}" width="${(bw - 4).toFixed(1)}" height="${h.toFixed(1)}" rx="5" fill="${col}" opacity="${t.err ? .35 : .9}"><animate attributeName="height" from="0" to="${h.toFixed(1)}" dur=".5s" fill="freeze"/><animate attributeName="y" from="120" to="${(120 - h).toFixed(1)}" dur=".5s" fill="freeze"/></rect>`;
      if (n <= 12 || i % 2 === 0) out += `<text x="${(x + (bw - 4) / 2).toFixed(1)}" y="140" text-anchor="middle" style="font-size:11px">${t.err ? '✕' : kind() === 'timing' ? (t.signed > 0 ? '+' : t.signed < 0 ? '-' : '') + t.ms : t.ms}</text>`;
    });
    svg.innerHTML = out;
  }
  function drawHist(svg = $('hist'), m = mode) {
    const h = (P.hist[m] || []).slice(-20);
    if (h.length < 2) { svg.innerHTML = `<text x="320" y="70" text-anchor="middle">Play a few more sessions to see your trend.</text>`; return; }
    const vals = h.map((e) => e.avg), mx = Math.max(...vals) * 1.08, mn = Math.min(...vals) * .9;
    const x = (i) => 40 + i / (h.length - 1) * 570, y = (v) => 120 - (v - mn) / Math.max(1, mx - mn) * 100;
    const best = Math.min(...vals);
    const d = h.map((e, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(e.avg).toFixed(1)}`).join(' ');
    svg.innerHTML = `<line x1="40" x2="610" y1="${y(best)}" y2="${y(best)}" stroke="var(--good)" stroke-dasharray="4 5" stroke-width="1.5"/><text x="612" y="${y(best) - 6}" text-anchor="end" style="fill:var(--good)">best ${best}ms</text>
      <path d="${d} L${x(h.length - 1)} 130 L40 130 Z" fill="${MODES[m].color}" opacity=".1"/>
      <path d="${d}" fill="none" stroke="${MODES[m].color}" stroke-width="3" stroke-linejoin="round"/>
      ${h.map((e, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(e.avg).toFixed(1)}" r="${i === h.length - 1 ? 6 : 3.5}" fill="${i === h.length - 1 ? 'var(--accent)' : MODES[m].color}"/>`).join('')}`;
  }
  function drawGauge(avg) {
    const m = MODES[mode], svg = $('gauge');
    const lo = m.lo || 100, hi = Math.round(m.median * 2), cx = 110, cy = 112, r = 88;
    const ang = (v) => Math.PI * (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo));
    const pt = (a, rr) => [cx + Math.cos(a) * rr, cy - Math.sin(a) * rr];
    const arc = (v0, v1, col) => { const [x0, y0] = pt(ang(v0), r), [x1, y1] = pt(ang(v1), r); return `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${col}" stroke-width="16" fill="none"/>`; };
    const segs = [[lo, m.median * .77, '#1f9d55'], [m.median * .77, m.median * .92, '#7cc44a'], [m.median * .92, m.median * 1.08, '#f2c14e'], [m.median * 1.08, m.median * 1.28, '#f29a1f'], [m.median * 1.28, hi, '#e04848']];
    const a = ang(avg), [nx, ny] = pt(a, r - 18);
    svg.innerHTML = `${segs.map(([a0, a1, c]) => arc(Math.max(lo, a0), Math.min(hi, a1), c)).join('')}
      <text x="${pt(Math.PI, r)[0] - 4}" y="${cy + 16}" text-anchor="start">${kind() === 'timing' ? 'precise' : 'fast'}</text><text x="${pt(0, r)[0] + 4}" y="${cy + 16}" text-anchor="end">${kind() === 'timing' ? 'off' : 'slow'}</text>
      <line class="rt-needle" x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="${((a - Math.PI) * -180 / Math.PI).toFixed(1)} ${cx} ${cy};6 ${cx} ${cy};0 ${cx} ${cy}" dur="1s" calcMode="spline" keySplines=".2 .8 .3 1;.4 0 .6 1" keyTimes="0;.7;1" fill="freeze"/></line>
      <circle cx="${cx}" cy="${cy}" r="9" fill="var(--ink)"/>`;
  }

  function unlock(id) {
    if (P.ach[id]) return;
    const a = ACH.find((x) => x.id === id); if (!a) return;
    P.ach[id] = Date.now(); save();
    const b = document.createElement('div'); b.className = 'rt-badge';
    b.style.marginTop = document.querySelectorAll('.rt-badge').length * 56 + 'px';
    b.innerHTML = `<i>${a.em}</i><span><small>Badge unlocked</small><b></b></span>`; b.querySelector('b').textContent = a.name;
    document.body.append(b); setTimeout(() => b.remove(), 3100);
    setTimeout(() => { tone(988, .1, 'triangle', .08); tone(1319, .2, 'triangle', .07, .1); }, 300);
    $('achCount').textContent = `${Object.keys(P.ach).length}/${ACH.length}`;
  }

  let lastResult = null;
  function done() {
    state = 'done'; clearTimeout(timer); stopOrbit();
    const valid = times.slice();
    const avg = valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
    const sorted = valid.slice().sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const fast = sorted[0] || 0, slow = sorted[sorted.length - 1] || 0;
    const sd = valid.length > 1 ? Math.round(Math.sqrt(valid.reduce((a, b) => a + (b - avg) ** 2, 0) / valid.length)) : 0;
    const errors = trials.filter((t) => t.err).length;
    const held = trials.filter((t) => t.nogo && !t.err).length;
    const m = MODES[mode];
    const pct = Math.max(1, Math.min(99, Math.round((1 - cdf(Math.max(1, avg), m)) * 100)));
    const prevBest = Curio.getBest(bestKey(mode));
    const b = avg ? Curio.best(bestKey(mode), avg, false) : { best: prevBest, isNew: false };
    const improved = b.isNew && prevBest != null;
    if (!P.hist[mode]) P.hist[mode] = [];
    if (avg) P.hist[mode].push({ avg, ts: Date.now(), n: tries, err: errors, sd });
    if (P.hist[mode].length > 60) P.hist[mode].shift();
    P.done[mode] = (P.done[mode] || 0) + 1;
    P.tot.tries += trials.length; P.tot.earlies += earlies; P.tot.sessions++;
    P.days[today()] = (P.days[today()] || 0) + 1;
    if (fast && (!P.fastest[mode] || fast < P.fastest[mode])) P.fastest[mode] = fast;
    let dailyNote = '';
    if (daily && avg) { const k = today() + ':' + mode; const prev = P.daily[k]; if (prev == null || avg < prev) P.daily[k] = avg; dailyNote = `Daily best today: ${P.daily[k]}ms.`; unlock('daily'); }
    save();
    unlock('first');
    if (mode === 'visual' && avg && avg < 250) unlock('s250');
    if (mode === 'visual' && avg && avg < 210) unlock('s210');
    if (mode === 'visual' && avg && avg < 180) unlock('s180');
    if (mode === 'audio' && avg && avg < 210) unlock('audio');
    if (mode === 'choice' && !errors) unlock('choice');
    if (mode === 'choice' && avg < 380 && avg) unlock('choicefast');
    if (mode === 'choice4' && !errors) unlock('four');
    if (mode === 'stroop' && (trials.length - errors) / trials.length >= .9) unlock('stroop');
    if (mode === 'gonogo' && !errors) unlock('gonogo');
    if (mode === 'timing' && avg && avg < 30 && !errors) unlock('timing');
    if (tries >= 10 && sd && sd < 20 && kind() !== 'timing') unlock('steady');
    if (tries >= 20) unlock('marathon');
    if (ORDER.every((k) => P.done[k])) unlock('allmodes');
    if (Object.keys(P.days).length >= 3) unlock('days3');
    if (improved) unlock('pb');
    const hr = new Date().getHours();
    if (hr >= 22) unlock('owl');
    if (hr < 8 && hr >= 4) unlock('lark');
    if (P.tot.tries >= 100) unlock('hundred');
    if (P.tot.sessions >= 25) unlock('regular');

    const tier = tierFor(Math.max(1, avg));
    set('done', 'flag', avg + (kind() === 'timing' ? ' ms off' : ' ms average'), 'Click to play again');
    $('medal').innerHTML = `<span>${tier[1]}</span>`;
    $('resKicker').textContent = `${m.name} · ${tries} tries${daily ? ' · daily' : ''} · ${tier[2]}`;
    $('avg').textContent = avg + 'ms';
    $('verdict').textContent = (improved ? 'New personal best! ' : '') + tier[3] + (dailyNote ? ' ' + dailyNote : '');
    const cells = [['Median', median + 'ms'], [kind() === 'timing' ? 'Closest' : 'Fastest', fast + 'ms'], [kind() === 'timing' ? 'Furthest' : 'Slowest', slow + 'ms'], ['Spread', '±' + sd + 'ms'], [kind() === 'timing' ? 'Better than' : 'Faster than', pct + '%'], ['Best average', b.best + 'ms']];
    if (kind() === 'choice') cells.push(['Accuracy', Math.round((trials.length - errors) / trials.length * 100) + '%']);
    if (m.stroop) {
      const con = trials.filter((t) => !t.err && t.congruent === true).map((t) => t.ms), inc = trials.filter((t) => !t.err && t.congruent === false).map((t) => t.ms);
      if (con.length && inc.length) { const d = Math.round(inc.reduce((a, c) => a + c, 0) / inc.length - con.reduce((a, c) => a + c, 0) / con.length); cells.push(['Stroop effect', (d > 0 ? '+' : '') + d + 'ms']); }
    }
    if (kind() === 'timing') {
      const ok = trials.filter((t) => !t.err), early = ok.filter((t) => t.signed < 0).length;
      const bias = ok.length ? Math.round(ok.reduce((a, t) => a + t.signed, 0) / ok.length) : 0;
      cells.push(['Early / late', `${early} / ${ok.length - early}`], ['Lean', bias === 0 ? 'none' : Math.abs(bias) + 'ms ' + (bias < 0 ? 'early' : 'late')]);
      if (errors) cells.push(['Missed', errors]);
    }
    if (kind() === 'gonogo') cells.push(['Stops held', `${held}/${held + errors}`]);
    if (earlies) cells.push(['False starts', earlies]);
    $('stats').innerHTML = cells.map(([a, v]) => `<div><b>${v}</b><span>${a}</span></div>`).join('');
    $('cmpNote').textContent = kind() === 'timing' ? 'Lower is better: how many milliseconds you landed away from the line. The curve is a rough estimate.' : 'The coloured area shows the share of people slower than you. These curves are rough estimates.';
    drawGauge(avg); drawChart(avg); drawBars(); drawHist();
    results.classList.add('is-on');
    if (improved || avg < m.median * .8) Curio.confetti();
    [523, 659, 784].forEach((f, i) => tone(f, .18, 'triangle', .09, i * .09));
    lastResult = { avg, fast, pct, errors, tier: tier[2] };
    paintModes();
    factIdx++;
    if (!info.hidden && info.dataset.p === 'records') renderInfo('records');
    setTimeout(() => results.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 150);
  }

  function restart() {
    clearTimeout(timer); stopOrbit();
    times = []; trials = []; earlies = 0; streak = 0;
    rng = daily ? seeded(today() + mode + tries) : Math.random;
    paintPips();
    results.classList.remove('is-on');
    readyScreen();
  }

  function paintModes() {
    const box = $('modes');
    box.innerHTML = ORDER.map((k, i) => {
      const m = MODES[k];
      const pb = Curio.getBest(bestKey(k));
      return `<button class="rt-mode" role="tab" type="button" data-mode="${k}" aria-selected="${k === mode}" style="--mc:${m.color}" title="${m.name} (key ${i + 1})">${m.icon}<b>${m.name}</b><span>${m.desc}</span><em>${pb != null ? 'Best ' + pb + 'ms' : 'Not played'}</em></button>`;
    }).join('');
    $('tries').innerHTML = [5, 10, 20].map((n) => `<button type="button" data-n="${n}" aria-pressed="${n === tries}">${n} tries</button>`).join('');
    $('daily').setAttribute('aria-pressed', String(daily));
    const dk = P.daily[today() + ':' + mode];
    $('modeInfo').textContent = daily ? `Same delays for everyone today.${dk != null ? ' Your best: ' + dk + 'ms' : ''}` : '';
    $('hint').innerHTML = kind() === 'choice' ? (MODES[mode].n === 4 ? 'Keys: <span class="c-kbd">D</span> blue, <span class="c-kbd">F</span> orange, <span class="c-kbd">J</span> green, <span class="c-kbd">K</span> pink. Or tap the buttons.' : `Keys: <span class="c-kbd">F</span> or <span class="c-kbd">←</span> for blue, <span class="c-kbd">J</span> or <span class="c-kbd">→</span> for orange. ${MODES[mode].stroop ? 'Answer the colour of the letters, not the word.' : 'Or tap the buttons.'}`)
      : kind() === 'gonogo' ? 'Click or press <span class="c-kbd">Space</span> on green. Do nothing on purple. Clicking early resets that try.'
        : kind() === 'timing' ? 'Press <span class="c-kbd">Space</span> or click as the yellow dot crosses the line at the top. Early and late both count.'
          : mode === 'audio' ? 'Keep your eyes closed if you like. <span class="c-kbd">Space</span> works too. Headphones help.'
            : 'Tip: <span class="c-kbd">Space</span> works too. Clicking early resets that attempt. Keys <span class="c-kbd">1</span>-<span class="c-kbd">7</span> switch modes.';
    $('achCount').textContent = `${Object.keys(P.ach).length}/${ACH.length}`;
  }
  const idle = () => state === 'ready' || state === 'done' || state === 'early' || state === 'result';
  function setMode(m) { mode = m; P.mode = mode; save(); paintModes(); restart(); tone(660, .05, 'triangle', .06); }
  $('modes').addEventListener('click', (e) => { const b = e.target.closest('.rt-mode'); if (!b || !idle()) return; setMode(b.dataset.mode); });
  $('tries').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; tries = Number(b.dataset.n); P.tries = tries; save(); paintModes(); restart(); });
  $('daily').addEventListener('click', () => { daily = !daily; paintModes(); restart(); Curio.toast(daily ? '📅 Daily challenge: same delays for everyone today' : 'Free play'); });

  panel.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    e.preventDefault();
    lastPt = { x: e.clientX, y: e.clientY };
    if (kind() === 'choice' && state === 'go') return;
    hit(e.timeStamp || performance.now(), null);
  });
  choiceBox.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.rt-cbtn'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    lastPt = { x: e.clientX, y: e.clientY };
    hit(e.timeStamp || performance.now(), Number(b.dataset.side));
  });
  document.addEventListener('keydown', (e) => {
    if (e.repeat || document.querySelector('.curio-modal') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (/^[1-7]$/.test(k) && idle() && !(e.target.closest && e.target.closest('input, textarea, select'))) { setMode(ORDER[Number(k) - 1]); return; }
    const centre = () => { const r = panel.getBoundingClientRect(); lastPt = { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    if (kind() === 'choice') {
      const map = MODES[mode].n === 4 ? { d: 0, f: 1, j: 2, k: 3 } : { f: 0, arrowleft: 0, j: 1, arrowright: 1 };
      if (k in map) { e.preventDefault(); centre(); hit(e.timeStamp || performance.now(), map[k]); return; }
    }
    if (e.code !== 'Space' && e.key !== 'Enter') return;
    if (e.target.closest && e.target.closest('button') && e.target !== panel) return;
    e.preventDefault();
    centre();
    hit(e.timeStamp || performance.now(), null);
  });
  $('again').addEventListener('click', (e) => { e.stopPropagation(); restart(); panel.focus(); panel.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('share').addEventListener('click', async () => {
    if (!lastResult) return;
    const m = MODES[mode];
    const t = `⚡ Reaction Time (${m.name}, ${tries} tries${daily ? ', daily ' + today() : ''}): ${lastResult.avg}ms ${kind() === 'timing' ? 'off the line' : 'average, fastest ' + lastResult.fast + 'ms'}. ${lastResult.tier}! Better than ${lastResult.pct}% of people. Curio`;
    try { await navigator.clipboard.writeText(t); Curio.toast('Copied to clipboard'); } catch { Curio.toast(t, 4000); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && (state === 'wait' || state === 'go' || state === 'orbit')) {
      clearTimeout(timer); stopOrbit(); state = 'early';
      set('early', 'hand', 'You looked away', 'Click to try that one again');
    }
  });

  const info = $('info');
  function spark(list, col) {
    if (list.length < 2) return '<span class="c-muted" style="font-size:12px">-</span>';
    const mx = Math.max(...list), mn = Math.min(...list);
    const x = (i) => 3 + i / (list.length - 1) * 114, y = (v) => 27 - (v - mn) / Math.max(1, mx - mn) * 22;
    return `<svg class="rt-sparkline" viewBox="0 0 120 30" aria-hidden="true"><path d="${list.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
  }
  function renderInfo(p) {
    info.dataset.p = p;
    if (p === 'badges') info.innerHTML = `<h3>🏆 Badges · ${Object.keys(P.ach).length} of ${ACH.length}</h3><div class="rt-achs">${ACH.map((a) => `<div class="rt-ach ${P.ach[a.id] ? 'got' : ''}"><i>${a.em}</i><b>${a.name}</b>${a.desc}</div>`).join('')}</div>`;
    else if (p === 'records') {
      const days = Object.keys(P.days).length;
      const tod = [['Morning', 5, 12], ['Afternoon', 12, 17], ['Evening', 17, 22], ['Night', 22, 29]].map(([n, a, b]) => {
        const v = (P.hist.visual || []).filter((e) => { let h = new Date(e.ts).getHours(); if (h < 5) h += 24; return h >= a && h < b; }).map((e) => e.avg);
        return { n, v: v.length ? Math.round(v.reduce((x, y) => x + y, 0) / v.length) : 0 };
      });
      const tmax = Math.max(1, ...tod.map((t) => t.v)), tmin = Math.min(...tod.filter((t) => t.v).map((t) => t.v));
      const cal = [];
      for (let i = 27; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; cal.push({ k, n: P.days[k] || 0, d: d.getDate() }); }
      info.innerHTML = `<h3>📈 Stats</h3>
        <div class="rt-totals"><div><b>${P.tot.sessions}</b><span>Sessions</span></div><div><b>${P.tot.tries}</b><span>Tries</span></div><div><b>${P.tot.earlies}</b><span>False starts</span></div><div><b>${days}</b><span>Days played</span></div></div>
        <table class="rt-rec"><thead><tr><th>Mode</th><th>Best avg</th><th>Fastest</th><th>Runs</th><th class="rt-hide-sm">Trend</th></tr></thead><tbody>${ORDER.map((k) => { const m = MODES[k], h = P.hist[k] || []; const pb = Curio.getBest(bestKey(k)); return `<tr><td><span class="rt-dot" style="background:${m.color}"></span>${m.name}</td><td>${pb != null ? pb + 'ms' : '-'}</td><td>${P.fastest[k] ? P.fastest[k] + 'ms' : '-'}</td><td>${P.done[k] || 0}</td><td class="rt-hide-sm">${spark(h.slice(-15).map((e) => e.avg), m.color)}</td></tr>`; }).join('')}</tbody></table>
        <div class="rt-dash">
          <div class="rt-dpanel"><h4>Light reactions by time of day</h4><div class="rt-tod">${tod.map((t) => `<div><i style="height:${t.v ? Math.round(20 + t.v / tmax * 70) : 4}px;background:${t.v && t.v === tmin ? 'var(--good)' : 'var(--accent)'};opacity:${t.v ? 1 : .25}"></i><b>${t.v ? t.v + 'ms' : '-'}</b><span>${t.n}</span></div>`).join('')}</div><p class="c-muted rt-dnote">${tod.filter((t) => t.v).length > 1 ? 'Green marks your quickest time of day.' : 'Play Light at different times of day to compare.'}</p></div>
          <div class="rt-dpanel"><h4>Last 4 weeks</h4><div class="rt-cal">${cal.map((c) => `<i class="${c.n ? 'on' : ''} ${c.k === today() ? 'today' : ''}" style="--o:${Math.min(1, .35 + c.n * .2)}" title="${c.k}: ${c.n} sessions">${c.d}</i>`).join('')}</div><p class="c-muted rt-dnote">Each filled day is a day you played.</p></div>
        </div>
        <h3 class="rt-h">Trend for ${MODES[mode].name}</h3><svg class="rt-chart rt-hist" id="hist2" viewBox="0 0 640 140" role="img" aria-label="Recent session averages"></svg>`;
      drawHist($('hist2'), mode);
    } else info.innerHTML = `<h3>❓ How it works</h3><div class="rt-help"><p><b>Light</b> is the classic test: the gap between the screen turning green and your click. Most people average around a quarter of a second, and screens and mice add a little delay of their own.</p><p><b>Sound</b> is usually faster than light. Hearing reaches the brain quicker than vision, so many people are a few tens of milliseconds quicker here.</p><p><b>Colour</b> adds a decision, and <b>Four colours</b> adds a bigger one. More choices means slower answers: that is Hick's law in action.</p><p><b>Tricky words</b> is the Stroop test: the word says one colour but is printed in another. Answer the ink colour. Your results show how much the mismatched words slowed you down.</p><p><b>Go / No-go</b> tests self-control as well as speed: react to green but hold still on purple.</p><p><b>Timing</b> is different: nothing to react to, you predict. A dot orbits the ring and you press as it crosses the line. Your score is how many milliseconds early or late you were.</p><p>Times under 100ms are thrown out in the reaction modes: nobody reacts that fast, so it was a guess. The comparison curves are rough estimates for people taking tests like this online.</p><p><b>Shortcuts</b>: <span class="c-kbd">Space</span> or <span class="c-kbd">Enter</span> to start and react, <span class="c-kbd">1</span>-<span class="c-kbd">7</span> to switch modes.</p></div>`;
  }
  document.querySelectorAll('.rt-tabs .rt-chip').forEach((t) => t.addEventListener('click', () => {
    const p = t.dataset.panel, open = info.hidden || info.dataset.p !== p;
    document.querySelectorAll('.rt-tabs .rt-chip').forEach((x) => x.setAttribute('aria-pressed', String(open && x === t)));
    info.hidden = !open; if (open) renderInfo(p);
  }));

  const legacy = Curio.getBest('avg');
  if (legacy != null && !P.done.visual) P.done.visual = 1;
  paintModes(); restart();
  window.__rt = { get state() { return state; }, get mode() { return mode; }, hit: (side) => hit(performance.now(), side), get target() { return target; }, get nogo() { return isNogo; }, get orbitTarget() { return orbit ? orbit.target : 0; }, setMode: (m) => { mode = m; paintModes(); restart(); } };
})();
