(function () {
  const slug = document.body?.dataset.game || '';
  const game = (window.CURIO_GAMES || []).find((g) => g.slug === slug);
  const root = document.body?.dataset.root ?? (slug ? '../../' : './');
  const html = document.documentElement;

  const store = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(`curio:${key}`);
        return raw == null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(`curio:${key}`, JSON.stringify(value)); } catch {}
    },
    remove(key) {
      try { localStorage.removeItem(`curio:${key}`); } catch {}
    }
  };

  const LOOKS = [
    { id: 'newsprint', name: 'Newsprint', dark: false, bg: '#f3ead7', ink: '#1e2148', a: '#dc2f6c', b: '#2f5bd3', note: 'Cream paper, navy ink' },
    { id: 'midnight', name: 'Midnight Press', dark: true, bg: '#13162e', ink: '#f4ead6', a: '#ff7a45', b: '#4dd0c4', note: 'The late edition' },
    { id: 'mint', name: 'Mint Riso', dark: false, bg: '#dcecdf', ink: '#0f3a2f', a: '#d93c30', b: '#ff5fa2', note: 'Green ink, red stamps' },
    { id: 'bubblegum', name: 'Bubblegum', dark: false, bg: '#ffe0ea', ink: '#33124a', a: '#6c33ea', b: '#00a0a0', note: 'Chewed, then printed' },
    { id: 'kraft', name: 'Kraft Paper', dark: false, bg: '#d6be97', ink: '#2a1c0f', a: '#bd3119', b: '#245a8f', note: 'Brown bag, rubber stamps' },
    { id: 'arcade', name: 'Arcade Basement', dark: true, bg: '#0e100c', ink: '#eaffdc', a: '#b8ff3c', b: '#ff3df0', note: 'Smells like pizza' },
    { id: 'blueprint', name: 'Blueprint', dark: true, bg: '#1a4682', ink: '#f4f8ff', a: '#ffd23f', b: '#ff8a5c', note: 'For serious inventors' }
  ];
  const lookById = (id) => LOOKS.find((l) => l.id === id);

  const legacy = store.get('theme', 'auto');
  const prefs = Object.assign({ look: legacy === 'dark' ? 'midnight' : legacy === 'light' ? 'newsprint' : 'auto', ui: true, volume: 0.8, calm: false, cursor: 'normal', big: false, contrast: false }, store.get('prefs', {}));
  const savePrefs = () => store.set('prefs', prefs);
  const osDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const osCalm = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const resolved = () => (prefs.look === 'auto' || !lookById(prefs.look)) ? (osDark() ? 'midnight' : 'newsprint') : prefs.look;
  let shownLook = '';
  function applyLook(silent) {
    const id = resolved();
    const l = lookById(id);
    html.dataset.look = id;
    html.dataset.theme = l.dark ? 'dark' : 'light';
    const changed = shownLook && shownLook !== id;
    shownLook = id;
    if (changed && !silent) window.dispatchEvent(new CustomEvent('curio:theme', { detail: l.dark ? 'dark' : 'light' }));
  }
  function applyPrefs() {
    html.classList.toggle('curio-calm', !!prefs.calm);
    html.classList.toggle('curio-big', !!prefs.big);
    html.classList.toggle('curio-contrast', !!prefs.contrast);
    html.classList.toggle('curio-cursor-pencil', prefs.cursor === 'pencil');
    html.classList.toggle('curio-cursor-big', prefs.cursor === 'big');
    if (master) master.gain.value = prefs.volume;
  }
  applyLook(true);
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => { if (prefs.look === 'auto') applyLook(); });
  const isDark = () => !!lookById(html.dataset.look || resolved())?.dark;
  const calm = () => !!prefs.calm || osCalm();

  function setLook(id, from) {
    if (id !== 'auto' && !lookById(id)) return;
    const go = () => {
      prefs.look = id; savePrefs();
      store.set('theme', id === 'auto' ? 'auto' : lookById(id).dark ? 'dark' : 'light');
      applyLook();
    };
    const tried = store.get('hub:looks', {});
    tried[id === 'auto' ? resolved() : id] = 1;
    store.set('hub:looks', tried);
    if (LOOKS.every((l) => tried[l.id])) unlock('wardrobe');
    if (document.startViewTransition && !calm()) {
      if (from) {
        const r = from.getBoundingClientRect();
        html.style.setProperty('--ink-x', `${Math.round(r.left + r.width / 2)}px`);
        html.style.setProperty('--ink-y', `${Math.round(r.top + r.height / 2)}px`);
      } else { html.style.setProperty('--ink-x', '50%'); html.style.setProperty('--ink-y', '0px'); }
      try { document.startViewTransition(go); return; } catch {}
    }
    go();
  }

  let muted = store.get('muted', false);
  let touchpad = store.get('touchpad', false);
  const applyTouchpad = () => html.classList.toggle('curio-touchpad', touchpad);
  applyTouchpad();
  function setTouchpad(on) {
    touchpad = !!on;
    store.set('touchpad', touchpad);
    applyTouchpad();
    window.dispatchEvent(new CustomEvent('curio:touchpad', { detail: touchpad }));
  }
  const MODE_KEY = `mode:${slug || 'hub'}`;
  let mode = store.get(MODE_KEY, null) || store.get('modeDefault', 'simple');
  if (mode !== 'simple' && mode !== 'advanced') mode = 'simple';
  html.dataset.mode = mode;
  function setMode(next) {
    next = next === 'advanced' ? 'advanced' : 'simple';
    if (next === mode) return;
    mode = next;
    store.set(MODE_KEY, mode);
    store.set('modeDefault', mode);
    html.dataset.mode = mode;
    window.dispatchEvent(new CustomEvent('curio:mode', { detail: mode }));
    const firstFlip = !store.get('hub:secrets', {}).switch;
    if (document.body.dataset.modes !== 'live') { if (firstFlip) { const g = store.get('hub:secrets', {}); g.switch = Date.now(); store.set('hub:secrets', g); store.set('hub:later', 'switch'); } location.reload(); }
    else unlock('switch');
  }
  function setMuted(on) {
    muted = !!on; store.set('muted', muted);
    window.dispatchEvent(new CustomEvent('curio:sound', { detail: !muted }));
  }

  let audio = null, master = null;
  function ctx() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { audio = new AC(); } catch { return null; }
      try {
        const out = audio.destination;
        master = audio.createGain();
        master.gain.value = prefs.volume;
        master.connect(out);
        Object.defineProperty(audio, 'destination', { value: master, configurable: true });
      } catch { master = null; }
    }
    if (audio.state === 'suspended') audio.resume().catch(() => {});
    return audio;
  }
  function beep(freq = 440, duration = 0.08, type = 'sine', volume = 0.15) {
    if (muted) return;
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t); osc.stop(t + duration + 0.02);
  }

  let noiseBuf = null;
  function tone(ac, f, d, type, vol, when = 0, to = 0) {
    const t = ac.currentTime + when;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + d + 0.03);
  }
  function noise(ac, d, vol, freq, q = 1, when = 0, kind = 'bandpass', to = 0) {
    if (!noiseBuf) {
      noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    const t = ac.currentTime + when;
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = kind; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if (to) f.frequency.exponentialRampToValueAtTime(to, t + d);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(ac.destination);
    s.start(t, Math.random() * 0.3); s.stop(t + d + 0.02);
  }
  const PENTA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880, 1046.5];
  const SFX = {
    tap: (ac) => { noise(ac, 0.035, 0.22, 2600, 1.4); tone(ac, 480, 0.05, 'triangle', 0.07); },
    hover: (ac, n = 0) => tone(ac, 1250 + (n % 7) * 90, 0.03, 'sine', 0.022),
    on: (ac) => { tone(ac, 620, 0.08, 'triangle', 0.09); tone(ac, 930, 0.1, 'triangle', 0.09, 0.06); },
    off: (ac) => { tone(ac, 720, 0.08, 'triangle', 0.08); tone(ac, 460, 0.11, 'triangle', 0.08, 0.06); },
    open: (ac) => { noise(ac, 0.22, 0.16, 500, 0.9, 0, 'bandpass', 2800); tone(ac, 300, 0.16, 'sine', 0.05, 0.02, 520); },
    close: (ac) => { noise(ac, 0.18, 0.13, 2600, 0.9, 0, 'bandpass', 500); tone(ac, 480, 0.12, 'sine', 0.04, 0, 300); },
    success: (ac) => { [523.3, 659.3, 784, 1046.5].forEach((f, i) => { tone(ac, f, 0.32, 'triangle', 0.08, i * 0.075); tone(ac, f * 2, 0.2, 'sine', 0.025, i * 0.075); }); },
    error: (ac) => { tone(ac, 190, 0.14, 'square', 0.04); tone(ac, 150, 0.2, 'square', 0.04, 0.1); },
    stamp: (ac) => { noise(ac, 0.07, 0.45, 900, 0.7, 0, 'lowpass'); tone(ac, 120, 0.14, 'sine', 0.22, 0, 55); },
    pop: (ac) => tone(ac, 380, 0.09, 'sine', 0.12, 0, 950),
    unpop: (ac) => tone(ac, 820, 0.09, 'sine', 0.1, 0, 330),
    roll: (ac) => { for (let i = 0; i < 9; i++) noise(ac, 0.03, 0.3 - i * 0.025, 1800 + Math.random() * 1500, 2, i * 0.06 + Math.random() * 0.03); },
    squeak: (ac) => { tone(ac, 820, 0.1, 'sine', 0.08, 0, 1500); tone(ac, 1400, 0.12, 'sine', 0.06, 0.09, 1000); },
    paper: (ac) => noise(ac, 0.14, 0.1, 3500, 0.6, 0, 'highpass'),
    whoosh: (ac) => noise(ac, 0.45, 0.2, 300, 0.8, 0, 'bandpass', 3000),
    note: (ac, n = 0) => { const f = PENTA[((n % PENTA.length) + PENTA.length) % PENTA.length]; tone(ac, f, 0.5, 'sine', 0.12); tone(ac, f * 4, 0.12, 'sine', 0.03); tone(ac, f * 2, 0.25, 'triangle', 0.03); },
    snore: (ac) => noise(ac, 0.8, 0.06, 260, 2, 0, 'bandpass', 160),
    coin: (ac) => { tone(ac, 988, 0.08, 'square', 0.05); tone(ac, 1319, 0.3, 'square', 0.05, 0.08); },
    blip: (ac, n = 0) => tone(ac, 330 + (n % 8) * 55, 0.05, 'square', 0.035),
    lift: (ac) => { noise(ac, 0.12, 0.3, 160, 0.8, 0, 'lowpass'); tone(ac, 90, 0.2, 'sine', 0.2, 0, 60); tone(ac, 520, 0.12, 'triangle', 0.05, 0.12, 780); },
    flip: (ac) => { tone(ac, 520, 0.07, 'triangle', 0.08, 0, 760); noise(ac, 0.05, 0.12, 4200, 1, 0.02, 'highpass'); }
  };
  let lastHover = 0;
  function sfx(name, n) {
    if (muted || !prefs.ui) return;
    if (name === 'hover') { const now = performance.now(); if (now - lastHover < 70) return; lastHover = now; }
    const ac = ctx(); if (!ac || !SFX[name]) return;
    try { SFX[name](ac, n); } catch {}
  }

  const ICONS = {
    home: '<path d="M3.4 11.4 12 4.1l8.7 7.5"/><path d="M5.6 9.9v9.4c0 .5.3.8.8.8h11.4c.5 0 .8-.3.8-.8V9.6"/><path d="M10 20v-5c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v5"/><path d="M16.1 7V4.3h2.2v4.6"/>',
    sound: '<path d="M3.9 9.4h3.3L12 5.3v13.6l-4.8-4.1H3.9z"/><path d="M15.3 9.3c1.4 1.5 1.4 4 0 5.5"/><path d="M17.9 6.7c2.9 3 2.9 7.8 0 10.8"/>',
    mute: '<path d="M3.9 9.4h3.3L12 5.3v13.6l-4.8-4.1H3.9z"/><path d="M15.6 9.6l4.9 5M20.6 9.5l-5.1 5.2"/>',
    sun: '<path d="M12 7.9c2.4-.1 4.2 1.8 4.1 4.2-.1 2.3-1.9 4-4.2 4-2.3-.1-4-1.9-3.9-4.2.1-2.3 1.8-4 4-4z"/><path d="M12 2.7v2.1M12 19.3v2.1M2.8 12h2.1M19.2 12h2.1M5.4 5.4l1.5 1.5M17.2 17.2l1.5 1.4M5.5 18.6l1.4-1.4M17.1 6.9l1.5-1.5"/>',
    moon: '<path d="M19.5 14.7A8 8 0 0 1 9.3 4.4a8 8 0 1 0 10.2 10.3z"/><path d="M16.5 4.2v2.6M15.2 5.5h2.6"/>',
    look: '<path d="M12 3.5c-5 0-8.7 3.7-8.6 8.4.1 4.6 3.9 8.3 8.3 8.3 1.4 0 2-1 1.5-2.1-.6-1.2.1-2.5 1.5-2.5h2.4c2.3 0 3.6-1.6 3.5-3.6-.3-4.9-3.8-8.5-8.6-8.5z"/><circle class="f" cx="7.7" cy="11.4" r="1.35"/><circle class="f" cx="9.8" cy="7.5" r="1.35"/><circle class="f" cx="14.4" cy="7.4" r="1.35"/>',
    touchpad: '<path d="M3.6 6.3c0-.9.7-1.6 1.6-1.6h13.6c.9 0 1.6.7 1.6 1.6v11.3c0 .9-.7 1.6-1.6 1.6H5.2c-.9 0-1.6-.7-1.6-1.6z"/><path d="M3.7 15.1h16.6M12 15.2v4"/><circle class="f" cx="11" cy="9.6" r="1.6"/><path d="M14.2 7.6c.8.8.8 3.2-.1 4"/>',
    mouse: '<path d="M12 3.6c-3.4 0-5.6 2.4-5.6 5.6v5.5c0 3.3 2.4 5.8 5.6 5.8s5.6-2.5 5.6-5.8V9.2c0-3.2-2.2-5.6-5.6-5.6z"/><path d="M12 7.3v3"/>',
    dice: '<g transform="rotate(-9 12 12)"><path d="M5.3 4h13.4c.7 0 1.3.6 1.3 1.3v13.4c0 .7-.6 1.3-1.3 1.3H5.3c-.7 0-1.3-.6-1.3-1.3V5.3C4 4.6 4.6 4 5.3 4z"/><circle class="f" cx="8.4" cy="8.4" r="1.45"/><circle class="f" cx="15.6" cy="15.6" r="1.45"/><circle class="f" cx="12" cy="12" r="1.45"/><circle class="f" cx="15.6" cy="8.4" r="1.45"/><circle class="f" cx="8.4" cy="15.6" r="1.45"/></g>',
    knobs: '<path d="M3.8 7.1h9.1M17.4 7.1h2.8M3.8 16.9h2.9M11.3 16.9h8.9"/><path d="M15.1 4.9c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2-2.2-1-2.2-2.2 1-2.2 2.2-2.2zM9 14.7c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2-2.2-1-2.2-2.2 1-2.2 2.2-2.2z"/>',
    search: '<path d="M10.4 4.2c3.4-.1 6.1 2.6 6.1 6 0 3.4-2.7 6.1-6.1 6.1-3.4 0-6.1-2.8-6-6.2.1-3.3 2.7-5.9 6-5.9z"/><path d="M15 15.1l5.3 5.2"/><path d="M7.6 8.7c.4-.9 1.1-1.5 2-1.8"/>',
    star: '<path d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.7l-5.3 2.8 1-5.8-4.3-4.1 6-.8z"/>',
    starf: '<path class="s" d="M12 3.4l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.7l-5.3 2.8 1-5.8-4.3-4.1 6-.8z"/>',
    close: '<path d="M6.1 6.3 17.9 17.7M18 6.1 6 18"/>',
    check: '<path d="M4.6 12.7l4.5 4.4 10.4-10.5"/>',
    clock: '<path d="M12 3.9c4.5 0 8.1 3.6 8.1 8.1s-3.6 8.1-8.1 8.1-8.1-3.6-8.1-8.1 3.7-8.1 8.1-8.1z"/><path d="M12 7.6v4.6l3 1.9"/>',
    sparkle: '<path d="M11 3.2c.6 4.5 2.4 6.5 6.9 7.2-4.5.8-6.3 2.8-6.9 7.4-.6-4.6-2.4-6.6-6.9-7.4 4.5-.7 6.3-2.7 6.9-7.2z"/><path d="M19 15.8v4.4M16.8 18h4.4"/>',
    heart: '<path d="M12 19.6c-5-3.4-8.3-6.4-8.3-10 0-2.4 1.9-4.3 4.2-4.3 1.8 0 3.2 1 4.1 2.5.9-1.5 2.3-2.5 4.1-2.5 2.4 0 4.2 1.9 4.2 4.3 0 3.6-3.3 6.6-8.3 10z"/>',
    plane: '<path d="M3.6 11.3 20.4 4l-5.2 16.3-3.4-6.6z"/><path d="M11.8 13.7l8.6-9.7"/>',
    book: '<path d="M4.5 5.3c2.6-.9 5.3-.6 7.5 1v13.1c-2.2-1.6-4.9-1.9-7.5-1z"/><path d="M19.5 5.3c-2.6-.9-5.3-.6-7.5 1v13.1c2.2-1.6 4.9-1.9 7.5-1z"/>',
    keyhole: '<path d="M12 4.3c2.2 0 3.9 1.7 3.9 3.9 0 1.5-.8 2.7-2 3.4l1.3 7.9H8.8l1.3-7.9c-1.2-.7-2-1.9-2-3.4 0-2.2 1.7-3.9 3.9-3.9z"/>',
    reset: '<path d="M5.3 12.1a6.8 6.8 0 1 0 2-4.9"/><path d="M5 4.6v3.6h3.6"/>',
    trash: '<path d="M5 7.1h14M9.5 7V4.8h5V7M6.6 7.1l.9 12.3h9l.9-12.3M10.2 10.6v5.5M13.8 10.6v5.5"/>',
    motion: '<path d="M3.5 9h11.2c1.7 0 2.8-1.3 2.6-2.8-.2-1.3-1.5-2-2.7-1.6"/><path d="M3.5 13.4h14.8c1.6 0 2.7 1.3 2.4 2.8-.3 1.3-1.6 2-2.8 1.5"/><path d="M3.5 17.6h6.4"/>',
    cursor: '<path d="M5.3 3.9l13 6.6-5.7 1.7-2.5 5.6z"/><path d="M13 12.6l4.6 5.1"/>',
    text: '<path d="M3.9 18.4 8.2 6l4.3 12.4M5.4 14.4H11"/><path d="M14.9 12.3c.6-.9 1.4-1.3 2.5-1.3 1.6 0 2.6 1 2.6 2.6v4.8"/><path d="M20 15c-3.5-.4-5.4.4-5.4 2 0 1 .8 1.6 1.9 1.6 1.6 0 3.2-1.1 3.5-2.6"/>',
    contrast: '<path d="M12 4c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z"/><path class="f" d="M12 4.2a7.8 7.8 0 0 1 0 15.6z"/>',
    arrow: '<path d="M4.5 12.2h14.2M13.6 6.8l5.4 5.4-5.4 5.3"/>',
    up: '<path d="M12 19.5V5M6.6 10.4 12 5l5.4 5.4"/>',
    trophy: '<path d="M7.4 4.4h9.2v4.7c0 2.7-2 4.9-4.6 4.9s-4.6-2.2-4.6-4.9z"/><path d="M7.4 6.3H4.6c0 2.6 1.2 3.9 3.1 4.2M16.6 6.3h2.8c0 2.6-1.2 3.9-3.1 4.2M12 14v3.4M8.4 19.9h7.2l-.6-2.5H9z"/>',
    lock: '<path d="M6.2 10.6h11.6v9H6.2z"/><path d="M8.7 10.5V8c0-2 1.4-3.6 3.3-3.6s3.3 1.6 3.3 3.6v2.5"/><path d="M12 14.2v2"/>',
    explore: '<path d="M3.6 13.7l12.8-6 1.6 3.5-12.8 6z"/><path d="M16.4 7.6l3-1.4 1.6 3.5-3 1.4"/><path d="M10.1 14.5l-2.6 5.8M11.6 14l2.8 6.2"/>',
    life: '<path d="M12 3.9c4.5 0 8.1 3.6 8.1 8.1s-3.6 8.1-8.1 8.1-8.1-3.6-8.1-8.1 3.7-8.1 8.1-8.1z"/><path d="M14.4 9.4c-.5-1-1.4-1.4-2.4-1.4-1.3 0-2.3.7-2.3 1.8 0 2.4 4.9 1.3 4.9 3.9 0 1.1-1 1.9-2.5 1.9-1.1 0-2-.5-2.5-1.4M12 6.5V8M12 15.6v1.6"/>',
    absurd: '<path d="M12.2 12.1c.4-.7-.4-1.4-1.1-1.2-1.1.3-1.2 1.8-.5 2.6 1.1 1.2 3.1.9 4-.4 1.3-1.8.6-4.3-1.2-5.4-2.4-1.4-5.5-.4-6.7 2-1.5 2.9-.2 6.5 2.7 7.8 3.4 1.6 7.5 0 8.9-3.5"/>',
    skill: '<path d="M12 7.2c3.6 0 6.6 2.9 6.6 6.5s-3 6.6-6.6 6.6-6.6-3-6.6-6.6 3-6.5 6.6-6.5z"/><path d="M12 13.7l3-3M9.9 3.7h4.2M12 3.8v3.2M18.5 6.5l1.5-1.4"/>',
    brain: '<path d="M9.2 17.5h5.6M9.9 20.4h4.2"/><path d="M12 3.6c-3.4 0-5.9 2.6-5.8 5.8.1 2 1 3.4 2.3 4.6.6.6.9 1.3.9 2.1v1.3h5.2v-1.3c0-.8.3-1.6.9-2.1 1.3-1.2 2.2-2.6 2.3-4.6.1-3.2-2.4-5.8-5.8-5.8z"/><path d="M10.4 10.6c.6-.9 2.6-.9 3.2 0"/>',
    arcade: '<path d="M5 15.4h14c.6 0 1 .4 1 1v2.5c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1v-2.5c0-.6.4-1 1-1z"/><path d="M12 15.3V9.5"/><path d="M12 3.6c1.6 0 2.9 1.3 2.9 2.9S13.6 9.4 12 9.4 9.1 8.1 9.1 6.5 10.4 3.6 12 3.6z"/><path d="M16.4 13.3h1.8"/>',
    puzzle: '<path d="M5 8.4h3.2c-.6-2.6 4.1-2.6 3.5 0H15v3.4c2.5-.6 2.5 4.1 0 3.5V19H5v-3.6c2.4.6 2.4-4.1 0-3.4z"/><path d="M15 8.4h4v3"/>',
    versus: '<path d="M4.4 4.3l9.2 9.3M4.4 4.3l3.3.2-.1 3.1M13 15.8l3.4 3.5 1.6-1.6-3.4-3.5M14.8 12.4l-2.4 2.4"/><path d="M19.6 4.3l-9.2 9.3M19.6 4.3l-3.3.2.1 3.1M11 15.8l-3.4 3.5L6 17.7l3.4-3.5M9.2 12.4l2.4 2.4"/>',
    toy: '<path d="M12 3.4v2.8"/><path d="M6.2 9.4c0-1.8 2.6-3.2 5.8-3.2s5.8 1.4 5.8 3.2c0 3.7-3.2 7.9-5.8 10.7-2.6-2.8-5.8-7-5.8-10.7z"/><path d="M6.5 10.6c3.6 1.3 7.4 1.3 11 0"/>',
    make: '<path d="M6.5 14.9c1.4 0 2.6 1.2 2.6 2.6s-1.2 2.6-2.6 2.6-2.6-1.2-2.6-2.6 1.2-2.6 2.6-2.6zM6.5 3.9c1.4 0 2.6 1.2 2.6 2.6S7.9 9.1 6.5 9.1 3.9 7.9 3.9 6.5s1.2-2.6 2.6-2.6z"/><path d="M8.7 8.1 20 17.3M8.7 15.9 20 6.7"/>',
    draw: '<path d="M4.6 19.4l.9-4.2L15.8 4.9c.6-.6 1.6-.6 2.2 0l1.1 1.1c.6.6.6 1.6 0 2.2L8.8 18.5z"/><path d="M14 6.7l3.3 3.3M5.5 15.2l3.3 3.3"/>',
    everything: '<path d="M4.3 4.4h6.4v6.4H4.3zM13.3 4.4h6.4v6.4h-6.4zM4.3 13.3h6.4v6.4H4.3zM13.3 13.3h6.4v6.4h-6.4z"/>',
    eye: '<path d="M2.8 12.2C5 8 8.3 5.9 12 5.9s7 2.1 9.2 6.3C19 16.3 15.7 18.4 12 18.4s-7-2.1-9.2-6.2z"/><circle class="f" cx="12" cy="12.1" r="2.7"/>',
    classic: '<path d="M4.6 15.8h14.8c.6 0 1 .4 1 1v2.4c0 .6-.4 1-1 1H4.6c-.6 0-1-.4-1-1v-2.4c0-.6.4-1 1-1z"/><path d="M9.3 15.7l1.5-6.2"/><path d="M11.2 3.9c1.7.1 2.9 1.5 2.8 3.1-.1 1.6-1.5 2.8-3.1 2.7-1.6-.1-2.8-1.5-2.7-3.1.1-1.6 1.4-2.8 3-2.7z"/><circle class="f" cx="15.6" cy="13.6" r="1.25"/><circle class="f" cx="18.4" cy="12.4" r="1.25"/>',
    gym: '<path d="M8.2 12h7.6"/><path d="M5.6 7.4h2.5v9.2H5.6zM15.9 7.4h2.5v9.2h-2.5z"/><path d="M3.4 9.6v4.8M20.6 9.6v4.8"/>',
    coin: '<path d="M12 3.8c4.6 0 8.2 3.6 8.2 8.2s-3.6 8.2-8.2 8.2-8.2-3.6-8.2-8.2 3.6-8.2 8.2-8.2z"/><path d="M12 7v10M14.5 9.1c-.5-.8-1.4-1.2-2.5-1.2-1.4 0-2.4.7-2.4 1.8 0 2.5 5 1.4 5 4 0 1.1-1.1 1.9-2.6 1.9-1.2 0-2.1-.5-2.6-1.4"/>',
    flask: '<path d="M9.4 3.9h5.2M10.3 4v5.4L4.9 18.3c-.6 1 .1 2 1.2 2h11.8c1.1 0 1.8-1 1.2-2L13.7 9.4V4"/><path d="M7.4 14.6c2.6-1 5.8 1 9.2-.2"/><circle class="f" cx="11" cy="17.3" r="1"/><circle class="f" cx="14.4" cy="16.8" r=".8"/>',
    simple: '<path d="M12 4.2c4.3 0 7.8 3.5 7.8 7.8s-3.5 7.8-7.8 7.8-7.8-3.5-7.8-7.8 3.5-7.8 7.8-7.8z"/><circle class="f" cx="12" cy="12" r="2.6"/>',
    advanced: '<path d="M12 3.7l8.3 4.3-8.3 4.3L3.7 8z"/><path d="M3.8 12.1l8.2 4.2 8.2-4.2"/><path d="M3.8 16l8.2 4.3 8.2-4.3"/>',
    bolt: '<path d="M13.4 3.4 5.6 13.3h5.6l-1.1 7.3 8.1-10.1h-5.7z"/>',
    target: '<path d="M12 3.8c4.6 0 8.2 3.6 8.2 8.2s-3.6 8.2-8.2 8.2-8.2-3.6-8.2-8.2 3.6-8.2 8.2-8.2z"/><path d="M12 7.7c2.4 0 4.3 1.9 4.3 4.3s-1.9 4.3-4.3 4.3-4.3-1.9-4.3-4.3 1.9-4.3 4.3-4.3z"/><circle class="f" cx="12" cy="12" r="1.4"/>'
  };
  function sprite() {
    if (document.getElementById('curio-icons')) return;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'curio-icons';
    svg.setAttribute('aria-hidden', 'true');
    svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    svg.innerHTML = Object.entries(ICONS).map(([k, v]) => `<symbol id="ci-${k}" viewBox="0 0 24 24">${v}</symbol>`).join('');
    document.body.prepend(svg);
  }
  const icon = (name, cls = '') => `<svg class="ci ${cls}" aria-hidden="true" focusable="false"><use href="#ci-${name}"></use></svg>`;

  let pimN = 0;
  function pim(cls = '') {
    const id = `pim${++pimN}`;
    const body = 'M61 23c22-1 38 15 39 39 1 26-15 44-40 44-23 0-39-16-39-41 0-25 17-41 40-42z';
    return `<svg class="pim ${cls}" viewBox="0 0 120 132" aria-hidden="true" focusable="false">
      <defs><pattern id="${id}d" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.05" fill="#1b1830" opacity=".22"/></pattern>
      <clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
      <g class="pim__all">
        <path class="pim__leg" d="M47 102l-2 14h-9" fill="none" stroke="#1b1830" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path class="pim__leg pim__leg--r" d="M74 102l2 14h9" fill="none" stroke="#1b1830" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <g class="pim__wob">
          <path d="${body}" transform="translate(5 4)" fill="var(--c-pop)" opacity=".7"/>
          <path class="pim__ant" d="M60 24c-3-9 0-15 7-19" fill="none" stroke="#1b1830" stroke-width="3.5" stroke-linecap="round"/>
          <circle class="pim__bulb" cx="68" cy="5" r="5.5" fill="var(--c-sun)" stroke="#1b1830" stroke-width="3"/>
          <path class="pim__arm" d="M23 70c-8 2-12 7-13 14" fill="none" stroke="#1b1830" stroke-width="4" stroke-linecap="round"/>
          <path class="pim__arm pim__arm--r" d="M98 70c8 2 12 7 13 14" fill="none" stroke="#1b1830" stroke-width="4" stroke-linecap="round"/>
          <path class="pim__skin" d="${body}" fill="var(--accent)"/>
          <g clip-path="url(#${id}c)"><path d="M18 74c12 26 50 36 84 10v40H18z" fill="url(#${id}d)"/></g>
          <path d="${body}" fill="none" stroke="#1b1830" stroke-width="4" stroke-linejoin="round"/>
          <ellipse cx="36" cy="80" rx="7" ry="4" fill="#ff7aa8" opacity=".75"/>
          <ellipse cx="86" cy="80" rx="7" ry="4" fill="#ff7aa8" opacity=".75"/>
          <g class="pim__eye">
            <ellipse cx="61" cy="58" rx="19" ry="20" fill="#fffdf6" stroke="#1b1830" stroke-width="3.5"/>
            <g class="pim__pupil"><circle cx="61" cy="60" r="8.5" fill="#1b1830"/><circle cx="64" cy="56.5" r="2.7" fill="#fffdf6"/></g>
            <path class="pim__lid" d="M42 58c0-12 9-20 19-20s19 8 19 20z" fill="var(--accent)" stroke="#1b1830" stroke-width="3.5" stroke-linejoin="round"/>
          </g>
          <path class="pim__shut" d="M44 60c6 7 28 7 34 0" fill="none" stroke="#1b1830" stroke-width="4" stroke-linecap="round"/>
          <path class="pim__mouth" d="M53 87c4 5 11 5 15 0" fill="none" stroke="#1b1830" stroke-width="3.5" stroke-linecap="round"/>
          <path class="pim__o" d="M60 85c3 0 5 2.5 5 5.5s-2 5-5 5-5-2-5-5 2-5.5 5-5.5z" fill="#1b1830"/>
          <g class="pim__hat pim__hat--night"><path d="M30 34c8-14 30-20 48-10 10 6 16 2 20-4-2 12-10 18-18 18z" fill="#3c4aa6" stroke="#1b1830" stroke-width="3" stroke-linejoin="round"/><circle cx="99" cy="19" r="6" fill="#fffdf6" stroke="#1b1830" stroke-width="3"/><path d="M28 36c18-6 36-6 54 2" fill="none" stroke="#fffdf6" stroke-width="6" stroke-linecap="round"/></g>
          <g class="pim__hat pim__hat--party"><path d="M44 30l22-30 16 34z" fill="var(--c-sun)" stroke="#1b1830" stroke-width="3" stroke-linejoin="round"/><path d="M52 21l18 4M58 12l14 3" stroke="var(--accent)" stroke-width="3"/><circle cx="66" cy="0" r="5" fill="var(--c-pop)" stroke="#1b1830" stroke-width="3"/></g>
          <g class="pim__hat pim__hat--witch"><path d="M26 36c16-8 54-8 70 0" fill="none" stroke="#1b1830" stroke-width="6" stroke-linecap="round"/><path d="M40 34c4-12 8-26 22-34 0 10 6 22 18 34z" fill="#2b2140" stroke="#1b1830" stroke-width="3" stroke-linejoin="round"/><path d="M42 30c12-3 26-3 36 0" stroke="#ff8a2a" stroke-width="5"/></g>
          <g class="pim__hat pim__hat--scarf"><path d="M26 92c20 10 50 10 70 0l2 9c-22 11-52 11-74 0z" fill="#d6332b" stroke="#1b1830" stroke-width="3" stroke-linejoin="round"/><path d="M78 98l6 20 9-3-4-18" fill="#d6332b" stroke="#1b1830" stroke-width="3" stroke-linejoin="round"/></g>
        </g>
      </g>
    </svg>`;
  }

  const SECRETS = [
    ['konami', 'Up, up, down, down', 'An old cheat code still works here.'],
    ['poke', 'Hello, Zob', 'You poked the little guy.'],
    ['dizzy', 'Room is spinning', 'Poked Zob until everything went round.'],
    ['sleepy', 'Shh, he is asleep', 'Sat still long enough for Zob to nod off.'],
    ['night', 'Night owl', 'Visited between midnight and five.'],
    ['early', 'Early bird', 'Visited before seven in the morning.'],
    ['wardrobe', 'Wardrobe change', 'Tried on every single theme.'],
    ['bottom', 'Rock bottom', 'Scrolled all the way to the floor.'],
    ['whoosh', 'Whoosh', 'Scrolled faster than a printing press.'],
    ['nothing', 'It does nothing', 'Kept clicking the tile that does nothing.'],
    ['composer', 'Z, O, B, L, E', 'Played the logo like a xylophone, in order.'],
    ['answer', 'Don\'t panic', 'Asked the search box for the answer to everything.'],
    ['snoop', 'Snoop', 'Found the back room.'],
    ['lights', 'Lights on', 'Pulled the chain in the back room.'],
    ['trail', 'Ink everywhere', 'Typed a three letter word and got messy.'],
    ['regular', 'Regular', 'Came back ten times. Hello again.'],
    ['explorer', 'Explorer', 'Tried ten different things.'],
    ['drawer', 'Completionist', 'Tried everything in one drawer.'],
    ['misprint', 'Misprint', 'Triple-clicked the dateline.'],
    ['console', 'Hello, developer', 'Said hi to Zob in the console.'],
    ['lost', 'Lost and found', 'Went looking for something you lost.'],
    ['missed', 'Zob missed you', 'Wandered off to another tab and came back.'],
    ['roller', 'High roller', 'Let the die decide five times.'],
    ['peek', 'Hide and seek', 'Found Zob hiding behind a tile.'],
    ['coin', 'Insert coin', 'Fed the arcade cabinet three coins in a row.'],
    ['gains', 'Do you even lift', 'Lifted the Brain Gym dumbbell ten times.'],
    ['switch', 'Two minds', 'Flipped a game between Simple and Advanced.'],
    ['tickle', 'Ticklish', 'Hovered over Zob until he giggled.']
  ];
  function unlock(id) {
    const got = store.get('hub:secrets', {});
    if (got[id] || !SECRETS.some((s) => s[0] === id)) return false;
    got[id] = Date.now();
    store.set('hub:secrets', got);
    const s = SECRETS.find((x) => x[0] === id);
    setTimeout(() => sticker(s[1], s[2]), 60);
    return true;
  }
  const found = () => store.get('hub:secrets', {});
  let stickerEl = null, stickerTimer = 0;
  function sticker(title, text) {
    stickerEl?.remove();
    const el = document.createElement('div');
    el.className = 'curio-sticker';
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="curio-sticker__badge">${icon('trophy')}</div><div><small>secret sticker found</small><b></b><span></span></div>`;
    el.querySelector('b').textContent = title;
    el.querySelector('span').textContent = text;
    document.body.append(el);
    stickerEl = el;
    sfx('success');
    clearTimeout(stickerTimer);
    stickerTimer = setTimeout(() => { el.classList.add('is-leaving'); setTimeout(() => el.remove(), 320); }, 4200);
  }

  function bar() {
    sprite();
    if (document.body.dataset.nobar != null) return;
    const el = document.createElement('header');
    el.className = 'curio-bar';
    el.innerHTML = `
      <a class="curio-bar__home" href="${root}index.html" aria-label="Zoble home: all games">
        <span class="curio-bar__logo">${pim('pim--mini')}</span><span class="curio-bar__word">Zoble</span>
      </a>
      <div class="curio-bar__title"></div>
      ${slug && document.body.dataset.modes != null ? `<div class="curio-mode" role="group" aria-label="Game mode"><span class="curio-mode__blob" aria-hidden="true"></span><button type="button" data-mode="simple" title="Simple: quick and easy">${icon('simple')}<span>Simple</span></button><button type="button" data-mode="advanced" title="Advanced: more content, longer games">${icon('advanced')}<span>Advanced</span></button></div>` : ''}
      <button class="curio-bar__btn" data-act="touchpad" type="button"></button>
      <button class="curio-bar__btn" data-act="sound" type="button"></button>
      <button class="curio-bar__btn" data-act="theme" type="button" aria-label="Change theme" title="Change theme">${icon('look')}</button>
      ${slug ? `<a class="curio-bar__btn" data-act="random" href="#" aria-label="Random game" title="Random game">${icon('dice')}</a>` : ''}
      <button class="curio-bar__btn" data-act="settings" type="button" aria-label="Settings" title="Settings">${icon('knobs')}</button>`;
    el.querySelector('.curio-bar__title').textContent = game ? game.title : (document.body.dataset.title || '');
    const sound = el.querySelector('[data-act="sound"]');
    const paintSound = () => { sound.innerHTML = icon(muted ? 'mute' : 'sound'); sound.setAttribute('aria-label', muted ? 'Unmute' : 'Mute'); sound.title = muted ? 'Sound is off' : 'Sound is on'; };
    paintSound();
    sound.addEventListener('click', () => { setMuted(!muted); sfx('on'); });
    window.addEventListener('curio:sound', paintSound);
    const pad = el.querySelector('[data-act="touchpad"]');
    const paintPad = () => {
      pad.innerHTML = icon(touchpad ? 'touchpad' : 'mouse');
      pad.setAttribute('aria-pressed', String(touchpad));
      pad.setAttribute('aria-label', 'Touchpad mode');
      pad.title = touchpad ? 'Touchpad mode on: click once to grab or draw, click again to let go' : 'Touchpad mode off';
    };
    paintPad();
    pad.addEventListener('click', () => {
      setTouchpad(!touchpad); paintPad();
      sfx(touchpad ? 'on' : 'off');
      toast(touchpad ? 'Touchpad mode on: click to start a drag, click again to let go' : 'Touchpad mode off', 2600);
    });
    window.addEventListener('curio:touchpad', paintPad);
    const theme = el.querySelector('[data-act="theme"]');
    theme.addEventListener('click', () => {
      const i = LOOKS.findIndex((l) => l.id === resolved());
      const next = LOOKS[(i + 1) % LOOKS.length];
      sfx('paper');
      setLook(next.id, theme);
      toast(`${next.name}: ${next.note.toLowerCase()}`, 1600);
    });
    el.querySelector('[data-act="settings"]').addEventListener('click', (e) => openSettings(e.currentTarget));
    el.querySelector('[data-act="random"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      sfx('roll');
      const others = (window.CURIO_READY || []).filter((g) => g.slug !== slug);
      const pick = others[Math.floor(Math.random() * others.length)];
      if (pick) setTimeout(() => { location.href = `${root}games/${pick.slug}/index.html`; }, calm() ? 0 : 260);
    });
    const modeBox = el.querySelector('.curio-mode');
    if (modeBox) {
      const paintMode = () => modeBox.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
      paintMode();
      modeBox.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-mode]');
        if (!b || b.dataset.mode === mode) return;
        sfx('pop');
        setMode(b.dataset.mode);
        paintMode();
      });
      window.addEventListener('curio:mode', paintMode);
    }
    el.querySelector('.curio-bar__home').addEventListener('mouseenter', () => sfx('squeak'));
    if (modeBox) el.classList.add('has-mode');
    document.body.prepend(el);
    document.body.classList.add('curio-has-bar');
  }

  let sheet = null, sheetReturn = null;
  function closeSettings() {
    if (!sheet) return;
    const s = sheet; sheet = null;
    sfx('close');
    s.classList.add('is-leaving');
    setTimeout(() => s.remove(), calm() ? 0 : 230);
    document.removeEventListener('keydown', sheetKeys, true);
    sheetReturn?.focus?.();
  }
  function sheetKeys(e) {
    if (!sheet) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSettings(); return; }
    if (e.key === 'Tab') {
      const f = [...sheet.querySelectorAll('button, input, a[href]')].filter((x) => !x.disabled && x.offsetParent);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  function openSettings(from) {
    if (sheet) return;
    sheetReturn = from || document.activeElement;
    sfx('open');
    const wrap = document.createElement('div');
    wrap.className = 'curio-sheet';
    const sw = (l) => `<button type="button" class="curio-look" role="radio" data-look="${l.id}" style="--sw-bg:${l.bg};--sw-ink:${l.ink}" aria-label="${l.name}: ${l.note}">
        <span class="curio-look__aa" aria-hidden="true">Aa</span>
        <span class="curio-look__inks" aria-hidden="true"><i style="background:${l.a}"></i><i style="background:${l.b}"></i></span>
        <span class="curio-look__name">${l.name}</span>
        <svg class="ci curio-look__tick" aria-hidden="true"><use href="#ci-check"></use></svg></button>`;
    const row = (key, title, text, ic) => `<div class="curio-row"><div class="curio-row__text"><b>${title}</b><span>${text}</span></div>
        <button type="button" class="curio-switch" role="switch" data-key="${key}" aria-label="${title}"></button></div>`;
    const got = Object.keys(found()).length;
    wrap.innerHTML = `<div class="curio-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="curio-set-title">
      <div class="curio-sheet__head">
        <h2 class="curio-sheet__title" id="curio-set-title">Settings<small>knobs, dials and one big red button</small></h2>
        <button type="button" class="curio-sheet__close" aria-label="Close settings">${icon('close')}</button>
      </div>
      <section class="curio-set"><h3 class="curio-set__label">${icon('look')}Paper and ink</h3>
        <div class="curio-looks" role="radiogroup" aria-label="Theme">${LOOKS.map(sw).join('')}
          <button type="button" class="curio-look" role="radio" data-look="auto" style="--sw-bg:linear-gradient(135deg,#f3ead7 50%,#13162e 50%);--sw-ink:#1e2148;background:linear-gradient(135deg,#f3ead7 50%,#13162e 50%)" aria-label="Match my device">
          <span class="curio-look__aa" aria-hidden="true">Aa</span><span class="curio-look__name" style="background:#f3ead7;color:#1e2148;padding:1px 6px;border-radius:4px">Match my device</span>
          <svg class="ci curio-look__tick" aria-hidden="true" style="color:#f4ead6"><use href="#ci-check"></use></svg></button>
        </div>
      </section>
      <section class="curio-set"><h3 class="curio-set__label">${icon('sound')}Sound</h3>
        ${row('sound', 'Game sounds', 'Beeps, boops and booms inside the games.')}
        ${row('ui', 'Clicky paper noises', 'Little taps and rustles when you poke the interface.')}
        <div class="curio-row"><div class="curio-row__text"><b>Volume</b><input class="curio-range" type="range" min="0" max="100" step="5" data-key="volume" aria-label="Volume"></div></div>
      </section>
      <section class="curio-set"><h3 class="curio-set__label">${icon('touchpad')}Hands and pointers</h3>
        ${row('touchpad', 'Touchpad mode', 'Click once to grab or draw, click again to let go. No holding.')}
        <div class="curio-row" style="display:block"><div class="curio-row__text" style="margin-bottom:8px"><b>Cursor</b><span>What your pointer looks like here.</span></div>
          <div class="curio-seg" role="radiogroup" aria-label="Cursor">
            <button type="button" role="radio" data-cursor="normal">${icon('cursor')}Normal</button>
            <button type="button" role="radio" data-cursor="pencil">${icon('draw')}Pencil</button>
            <button type="button" role="radio" data-cursor="big">${icon('arrow')}Big</button>
          </div></div>
      </section>
      <section class="curio-set"><h3 class="curio-set__label">${icon('advanced')}Simple or Advanced</h3>
        <div class="curio-row" style="display:block"><div class="curio-row__text" style="margin-bottom:8px"><b>New games start in</b><span>Simple is quick and easy to pick up. Advanced has every mode, stat and setting.</span></div>
          <div class="curio-seg" role="radiogroup" aria-label="Default game mode">
            <button type="button" role="radio" data-defmode="simple">${icon('simple')}Simple</button>
            <button type="button" role="radio" data-defmode="advanced">${icon('advanced')}Advanced</button>
          </div></div>
        ${slug && document.body.dataset.modes != null ? `<div class="curio-row" style="display:block"><div class="curio-row__text" style="margin-bottom:8px"><b>This game</b><span>Switching may restart the page.</span></div>
          <div class="curio-seg" role="radiogroup" aria-label="Mode for this game">
            <button type="button" role="radio" data-thismode="simple">${icon('simple')}Simple</button>
            <button type="button" role="radio" data-thismode="advanced">${icon('advanced')}Advanced</button>
          </div></div>` : ''}
      </section>
      <section class="curio-set"><h3 class="curio-set__label">${icon('eye')}Comfort</h3>
        ${row('calm', 'Reduce motion', 'Calm mode: less wiggling, bouncing and flying paper.')}
        ${row('big', 'Bigger text', 'Bumps up the size of words around the place.')}
        ${row('contrast', 'High contrast', 'Darker ink, stronger lines, no paper grain.')}
      </section>
      <section class="curio-set"><h3 class="curio-set__label">${icon('trash')}Start fresh</h3>
        <button type="button" class="curio-danger" data-act="reset">${icon('reset')}Reset hub data</button>
        <span class="c-muted" style="display:block;font-size:13px;margin-top:6px">Forgets what you played, your favourites and found stickers. Game high scores stay.</span>
      </section>
      <p class="curio-sheet__foot">${got ? `${got} of ${SECRETS.length} secret stickers found. ` : 'There are secrets around here. '}<button type="button" data-act="book">Open the sticker book</button></p>
    </div>`;
    const sync = () => {
      wrap.querySelectorAll('.curio-look').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.look === prefs.look)));
      wrap.querySelectorAll('[data-cursor]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.cursor === prefs.cursor)));
      const def = store.get('modeDefault', 'simple') === 'advanced' ? 'advanced' : 'simple';
      wrap.querySelectorAll('[data-defmode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.defmode === def)));
      wrap.querySelectorAll('[data-thismode]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.thismode === mode)));
      const val = { sound: !muted, ui: prefs.ui, touchpad, calm: prefs.calm, big: prefs.big, contrast: prefs.contrast };
      wrap.querySelectorAll('.curio-switch').forEach((b) => b.setAttribute('aria-checked', String(!!val[b.dataset.key])));
      wrap.querySelector('[data-key="volume"]').value = Math.round(prefs.volume * 100);
    };
    sync();
    wrap.addEventListener('click', (e) => {
      if (e.target === wrap) { closeSettings(); return; }
      const lookBtn = e.target.closest('.curio-look');
      if (lookBtn) { sfx('paper'); setLook(lookBtn.dataset.look, lookBtn); setTimeout(sync, 20); return; }
      const cur = e.target.closest('[data-cursor]');
      if (cur) { prefs.cursor = cur.dataset.cursor; savePrefs(); applyPrefs(); sfx('tap'); sync(); return; }
      const dm = e.target.closest('[data-defmode]');
      if (dm) { store.set('modeDefault', dm.dataset.defmode); sfx('flip'); sync(); toast(`New games will open in ${dm.dataset.defmode === 'advanced' ? 'Advanced' : 'Simple'} mode`, 1800); return; }
      const tm = e.target.closest('[data-thismode]');
      if (tm) { if (tm.dataset.thismode !== mode) { sfx('flip'); const keepDef = store.get('modeDefault', 'simple'); const live = document.body.dataset.modes === 'live'; if (!live) store.set('modeDefault', keepDef); setMode(tm.dataset.thismode); store.set('modeDefault', keepDef); sync(); } return; }
      const sw = e.target.closest('.curio-switch');
      if (sw) {
        const k = sw.dataset.key;
        const on = sw.getAttribute('aria-checked') !== 'true';
        if (k === 'sound') setMuted(!on);
        else if (k === 'touchpad') setTouchpad(on);
        else { prefs[k] = on; savePrefs(); applyPrefs(); }
        if (k === 'ui' && on) prefs.ui = true;
        sfx(on ? 'on' : 'off');
        sync();
        return;
      }
      if (e.target.closest('.curio-sheet__close')) { closeSettings(); return; }
      if (e.target.closest('[data-act="book"]')) { closeSettings(); setTimeout(openBook, 120); return; }
      if (e.target.closest('[data-act="reset"]')) {
        sfx('error');
        modal({ emoji: '', title: 'Wipe the hub clean?', body: 'Played marks, favourites, recent games and secret stickers go in the bin. Game scores stay put.', buttons: [{ label: 'Yes, sweep it', value: 'yes' }, { label: 'Keep it', value: 'no' }] }).then((v) => {
          if (v !== 'yes') return;
          ['played', 'hub:favs', 'hub:secrets', 'hub:looks', 'hub:seen', 'hub:tag', 'hub:view', 'hub:visits', 'hub:rolls', 'hub:pokes', 'hub:thumbs', 'hub:lost', 'hub:credits', 'hub:lifts', 'hub:peeked'].forEach((k) => store.remove(k));
          toast('Swept. Fresh as a new notebook.');
          window.dispatchEvent(new CustomEvent('curio:reset'));
        });
      }
    });
    const vol = wrap.querySelector('[data-key="volume"]');
    vol.addEventListener('input', () => { prefs.volume = vol.value / 100; applyPrefs(); });
    vol.addEventListener('change', () => { savePrefs(); sfx('note', Math.round(prefs.volume * 8)); });
    document.body.append(wrap);
    sheet = wrap;
    document.addEventListener('keydown', sheetKeys, true);
    setTimeout(() => wrap.querySelector('.curio-sheet__close')?.focus(), 30);
  }

  const BOOK = {
    konami: ['up', 'An old cheat code. Arrows, then two letters.'], poke: ['heart', 'Say hello to the little guy.'], dizzy: ['reset', 'Say hello. A lot. Quickly.'],
    sleepy: ['moon', 'Sit very, very still.'], night: ['moon', 'Come back when the moon is out.'], early: ['sun', 'Come back before breakfast.'],
    wardrobe: ['look', 'Try on every outfit.'], bottom: ['up', 'How far down does this go?'], whoosh: ['plane', 'Scroll like you mean it.'],
    nothing: ['close', 'Something in the toy box does nothing.'], composer: ['sparkle', 'The logo is an instrument.'], answer: ['search', 'Ask the search box the big question.'],
    snoop: ['keyhole', 'Every cabinet has a back door.'], lights: ['sun', 'It is dark back there. Find the chain.'], trail: ['draw', 'Type something a pen is full of.'],
    regular: ['clock', 'Keep coming back.'], explorer: ['explore', 'Try ten different things.'], drawer: ['check', 'Empty a whole drawer.'],
    misprint: ['contrast', 'The date is printed a little loose.'], console: ['text', 'Developers have their own way in.'], lost: ['search', 'Lost something? Look for it.'],
    missed: ['heart', 'Leave, then come back.'], roller: ['dice', 'Let the die decide. Often.'], peek: ['eye', 'Someone is hiding behind a tile.'],
    coin: ['coin', 'The arcade takes coins. Quickly.'], gains: ['gym', 'The gym has equipment. Use it.'], switch: ['advanced', 'Some games have two minds.'], tickle: ['heart', 'Hover where it tickles.']
  };
  function openBook() {
    const got = found();
    const list = document.createElement('div');
    list.className = 'curio-book';
    SECRETS.forEach(([id, name, text], i) => {
      const has = !!got[id];
      const [ic, hint] = BOOK[id] || ['star', 'Keep poking around.'];
      const c = document.createElement('div');
      c.className = `curio-book__item${has ? ' is-got' : ''}`;
      c.style.setProperty('--r', `${((i * 37) % 9 - 4) * 1.3}deg`);
      c.style.setProperty('--sc', ['var(--c-sun)', 'var(--accent)', 'var(--c-pop)', 'var(--good)'][i % 4]);
      c.innerHTML = `<span class="curio-book__badge">${has ? icon(ic) : '?'}</span><b></b><span></span>`;
      c.querySelector('b').textContent = has ? name : 'Not found yet';
      c.querySelector('span:last-child').textContent = has ? text : hint;
      list.append(c);
    });
    const n = Object.keys(got).length;
    modal({ emoji: '', title: `Sticker book: ${n} of ${SECRETS.length}`, body: list, wide: true, buttons: [{ label: 'Close the book', value: 'ok' }] });
  }

  let toastEl = null, toastTimer = 0;
  function toast(text, ms = 1800) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'curio-toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
    toastEl.textContent = text;
    toastEl.classList.remove('is-on');
    void toastEl.offsetWidth;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), ms);
  }

  function modal({ emoji = '', title = '', body = '', buttons = [{ label: 'Play again', value: 'again' }], wide = false } = {}) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'curio-modal';
      wrap.innerHTML = `<div class="curio-modal__box" role="dialog" aria-modal="true">
        <div class="curio-modal__emoji"></div><div class="curio-modal__title"></div>
        <div class="curio-modal__body"></div><div class="c-row"></div></div>`;
      if (wide) wrap.querySelector('.curio-modal__box').classList.add('is-wide');
      wrap.querySelector('.curio-modal__emoji').textContent = emoji;
      if (!emoji) wrap.querySelector('.curio-modal__emoji').remove();
      wrap.querySelector('.curio-modal__title').textContent = title;
      const b = wrap.querySelector('.curio-modal__body');
      if (body instanceof Node) b.append(body); else b.textContent = body;
      const row = wrap.querySelector('.c-row');
      buttons.forEach((btn, i) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = i === 0 ? 'c-btn' : 'c-btn c-btn--ghost';
        el.textContent = btn.label;
        el.addEventListener('click', () => { sfx('tap'); wrap.remove(); resolve(btn.value); });
        row.append(el);
      });
      document.body.append(wrap);
      sfx('open');
      row.querySelector('button')?.focus();
    });
  }

  function confetti(count = 120) {
    if (calm() || osCalm()) return;
    const c = document.createElement('canvas');
    c.className = 'curio-confetti';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    c.style.width = '100%'; c.style.height = '100%';
    document.body.append(c);
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    const cs = getComputedStyle(html);
    const tok = (k, f) => (cs.getPropertyValue(k).trim() || f);
    const colors = [tok('--accent', '#dc2f6c'), tok('--c-pop', '#2f5bd3'), tok('--c-sun', '#ffcf3a'), tok('--good', '#1d8a52'), '#ff7aa8', tok('--ink', '#1e2148')];
    const bits = Array.from({ length: count }, (_, i) => ({
      x: innerWidth / 2 + (Math.random() - .5) * 220, y: innerHeight * .35,
      vx: (Math.random() - .5) * 15, vy: -Math.random() * 14 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      w: 6 + Math.random() * 7, h: 4 + Math.random() * 5,
      k: i % 5,
      c: colors[(Math.random() * colors.length) | 0]
    }));
    let frames = 0;
    (function tick() {
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of bits) {
        p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.strokeStyle = p.c;
        if (p.k === 0) { g.beginPath(); g.arc(0, 0, p.w / 2, 0, Math.PI * 2); g.fill(); }
        else if (p.k === 1) { g.lineWidth = 2.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-p.w, 0); g.quadraticCurveTo(-p.w / 2, -p.h, 0, 0); g.quadraticCurveTo(p.w / 2, p.h, p.w, 0); g.stroke(); }
        else if (p.k === 2) { g.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5, rr = j % 2 ? p.w * .25 : p.w * .6; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); }
        else { g.scale(1, Math.cos(p.r * 3)); g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
        g.restore();
      }
      if (++frames < 190) requestAnimationFrame(tick); else c.remove();
    })();
  }

  let trailOn = false, trailHue = 0;
  function onTrail(e) {
    if (e.pointerType === 'touch') return;
    trailHue++;
    if (trailHue % 2) return;
    const d = document.createElement('i');
    d.className = 'curio-trail';
    const cs = getComputedStyle(html);
    const cols = ['--accent', '--c-pop', '--c-sun'];
    d.style.background = cs.getPropertyValue(cols[(trailHue >> 1) % 3]).trim();
    d.style.left = `${e.clientX}px`; d.style.top = `${e.clientY}px`;
    const s = 6 + Math.random() * 9;
    d.style.width = d.style.height = `${s}px`;
    document.body.append(d);
    setTimeout(() => d.remove(), 900);
  }
  function trail(on = !trailOn) {
    trailOn = !!on;
    window[trailOn ? 'addEventListener' : 'removeEventListener']('pointermove', onTrail);
    return trailOn;
  }

  function best(key, score, higherIsBetter = true) {
    const k = `best:${slug || 'hub'}:${key}`;
    const prev = store.get(k, null);
    const isNew = prev == null || (higherIsBetter ? score > prev : score < prev);
    if (isNew) store.set(k, score);
    return { best: isNew ? score : prev, isNew };
  }
  const getBest = (key) => store.get(`best:${slug || 'hub'}:${key}`, null);

  function drag(el, { start, move, end } = {}) {
    let active = null;
    let latched = false;
    let downAt = null;
    let moved = false;
    const at = (e) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, clientX: e.clientX, clientY: e.clientY, pressure: e.pressure || 0.5, pointerType: e.pointerType, event: e };
    };
    const finish = (e) => {
      if (active == null) return;
      active = null;
      latched = false;
      el.classList.remove('curio-latched');
      end?.(e ? at(e) : null);
    };
    const onDown = (e) => {
      if (e.button != null && e.button > 0) return;
      if (latched) { e.preventDefault(); finish(e); return; }
      active = e.pointerId;
      downAt = { x: e.clientX, y: e.clientY };
      moved = false;
      try { el.setPointerCapture(e.pointerId); } catch {}
      start?.(at(e));
    };
    const onMove = (e) => {
      if (latched) { move?.(at(e)); return; }
      if (active !== e.pointerId) return;
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) moved = true;
      move?.(at(e));
    };
    const onUp = (e) => {
      if (active !== e.pointerId || latched) return;
      if (touchpad && e.pointerType === 'mouse' && !moved) {
        latched = true;
        el.classList.add('curio-latched');
        try { el.releasePointerCapture(e.pointerId); } catch {}
        return;
      }
      finish(e);
    };
    const onOutside = (e) => { if (latched && !el.contains(e.target)) finish(null); };
    const onKey = (e) => { if (e.key === 'Escape' && latched) finish(null); };
    const onBlur = () => { if (latched) finish(null); };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pointerdown', onOutside, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointerdown', onOutside, true);
    };
  }

  if (slug) {
    const played = store.get('played', {});
    played[slug] = Date.now();
    store.set('played', played);
    if (Object.keys(played).length >= 10) setTimeout(() => unlock('explorer'), 1500);
  }

  window.Curio = {
    slug, game, store, beep, toast, modal, confetti, best, getBest, isDark,
    get muted() { return muted; },
    get touchpad() { return touchpad; },
    get mode() { return mode; },
    get simple() { return mode === 'simple'; },
    get advanced() { return mode === 'advanced'; },
    setMode,
    get look() { return resolved(); },
    get prefs() { return { ...prefs }; },
    get calm() { return calm(); },
    setTouchpad, setMuted, setLook, drag,
    looks: LOOKS.map((l) => ({ ...l })),
    audioContext: ctx,
    sfx, icon, pim, unlock, found, secrets: SECRETS.map(([id, name, text]) => ({ id, name, text })),
    settings: openSettings, closeSettings, stickerBook: openBook, trail,
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    fmt: (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })
  };
  applyPrefs();

  window.zob = () => {
    console.log('%c  (o)  %c hi! I am Zob, a zoble. I live in the cabinet. You found my secret door.', 'background:#dc2f6c;color:#fff;border-radius:50%;font-size:16px;padding:6px', 'font-size:14px');
    unlock('console');
    return 'squeak';
  };

  function later() {
    const id = store.get('hub:later', null);
    if (!id) return;
    store.remove('hub:later');
    const s = SECRETS.find((x) => x[0] === id);
    if (s) setTimeout(() => sticker(s[1], s[2]), 700);
  }
  const boot = () => { bar(); later(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
