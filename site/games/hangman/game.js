(() => {
  const DATA = window.HANGMAN_WORDS;
  const CATS = Object.keys(DATA);
  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SAVE = 'hmv2';
  const NS = 'http://www.w3.org/2000/svg';
  const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);
  const isLetter = (ch) => ch >= 'A' && ch <= 'Z';

  const MODES = [
    { id: 'classic', e: '🎈', name: 'Classic', sub: 'Endless words, build a streak' },
    { id: 'daily', e: '📅', name: 'Word of the day', sub: 'Same word for everyone today' },
    { id: 'blitz', e: '⏱️', name: 'Blitz', sub: '90 seconds, as many words as you can' },
    { id: 'duo', e: '👯', name: 'Two players', sub: 'One sets a word, one guesses' }
  ];
  const DIFFS = [{ id: 8, name: 'Easy · 8' }, { id: 6, name: 'Normal · 6' }, { id: 4, name: 'Hard · 4' }];
  const SCENE_LIST = [{ id: 'balloon', name: '🎈 Balloons' }, { id: 'snowman', name: '⛄ Snowman' }];
  const BADGES = [
    { id: 'first', e: '🎉', t: 'First Word', d: 'Solve a word' },
    { id: 'perfect', e: '💎', t: 'Flawless', d: 'Solve a word with no misses' },
    { id: 'close', e: '😅', t: 'Close Call', d: 'Solve on your very last life' },
    { id: 'streak5', e: '🔥', t: 'Warming Up', d: 'Reach a streak of 5' },
    { id: 'streak10', e: '🌋', t: 'On a Roll', d: 'Reach a streak of 10' },
    { id: 'streak25', e: '☄️', t: 'Unstoppable', d: 'Reach a streak of 25' },
    { id: 'long', e: '📜', t: 'Wordsmith', d: 'Solve a word with 12 or more letters' },
    { id: 'rare', e: '🦓', t: 'Quizzical', d: 'Solve a word containing Q, X or Z' },
    { id: 'consonant', e: '🤫', t: 'Consonant King', d: 'Solve without guessing a single vowel' },
    { id: 'hard', e: '🧗', t: 'Daredevil', d: 'Solve a word on Hard' },
    { id: 'master', e: '🎓', t: 'Category Master', d: 'Solve 10 words in one category' },
    { id: 'explorer', e: '🧭', t: 'Explorer', d: 'Solve words in 10 different categories' },
    { id: 'daily', e: '📅', t: 'Word of the Day', d: 'Solve a daily word' },
    { id: 'blitz5', e: '⚡', t: 'Speed Reader', d: 'Solve 5 words in one blitz' },
    { id: 'blitz10', e: '🌩️', t: 'Lightning', d: 'Solve 10 words in one blitz' },
    { id: 'duo', e: '👯', t: 'Party Game', d: 'Finish a two-player round' },
    { id: 'nohint', e: '🙈', t: 'No Peeking', d: 'Solve 10 in a row without hints' },
    { id: 'cat', e: '🐱', t: 'Cat Whisperer', d: 'Keep Biscuit afloat 10 times' },
    { id: 'snow', e: '⛄', t: 'Frosty Friend', d: 'Save the snowman 10 times' },
    { id: 'century', e: '💯', t: 'Century', d: 'Solve 100 words' }
  ];

  const DEF = { v: 2, mode: 'classic', cat: 'random', diff: 6, scene: 'balloon', streak: 0, won: 0, lost: 0, perfect: 0, catStats: {}, badges: {}, recent: [], hist: [], daily: {}, blitzBest: 0, letters: { right: 0, wrong: 0 }, saved: { balloon: 0, snowman: 0 }, cleanRun: 0 };
  function load() {
    const s = Curio.store.get(SAVE, null);
    const out = JSON.parse(JSON.stringify(DEF));
    if (s && typeof s === 'object' && s.v === 2) {
      for (const k of Object.keys(DEF)) if (s[k] != null && typeof s[k] === typeof DEF[k] && Array.isArray(s[k]) === Array.isArray(DEF[k])) out[k] = s[k];
    } else {
      const old = Curio.store.get('hm:stats', null);
      if (old && typeof old === 'object') { out.streak = +old.streak || 0; out.won = +old.won || 0; out.lost = +old.lost || 0; }
      const oc = Curio.store.get('hm:cat', null);
      if (oc && (oc === 'random' || DATA[oc])) out.cat = oc;
    }
    if (out.cat !== 'random' && !DATA[out.cat]) out.cat = 'random';
    if (!DIFFS.some((d) => d.id === out.diff)) out.diff = 6;
    if (!SCENE_LIST.some((d) => d.id === out.scene)) out.scene = 'balloon';
    if (!MODES.some((d) => d.id === out.mode)) out.mode = 'classic';
    return out;
  }
  const S = load();
  const keepS = { mode: S.mode, diff: S.diff, cat: S.cat };
  if (Curio.simple) Object.assign(S, { mode: 'classic', diff: 6, cat: 'random' });
  const save = () => Curio.store.set(SAVE, Curio.simple ? { ...S, ...keepS } : S);

  let noiseBuf = null;
  const sfx = {
    ac() { return Curio.muted ? null : Curio.audioContext(); },
    tone(f, d = 0.1, type = 'sine', v = 0.1, f2 = 0, delay = 0) {
      const ac = this.ac(); if (!ac) return;
      const t = ac.currentTime + delay;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
    },
    noise(d = 0.08, v = 0.1, freq = 1500, delay = 0, q = 1, type = 'bandpass') {
      const ac = this.ac(); if (!ac) return;
      if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.8, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const t = ac.currentTime + delay;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(f).connect(g).connect(ac.destination); src.start(t, Math.random() * 0.2); src.stop(t + d + 0.02);
    },
    hit(k) { const f = [523, 587, 659, 698, 784, 880, 988, 1046][k % 8]; this.tone(f, 0.12, 'triangle', 0.09); this.tone(f * 2, 0.08, 'sine', 0.03, 0, 0.03); window.Cafe?.sound('tile', 0.7); this.noise(0.12, 0.05, 3800, 0.03, 3); },
    pop() { this.noise(0.09, 0.3, 2600, 0, 0.7); this.tone(900, 0.06, 'square', 0.05, 200); },
    sizzle() { this.noise(0.4, 0.07, 4000, 0, 0.5, 'highpass'); this.tone(240, 0.25, 'sine', 0.05, 160); },
    splash() { this.noise(0.5, 0.25, 700, 0, 0.6); this.noise(0.3, 0.15, 2200, 0.1, 0.8); },
    win() { [523, 659, 784, 1046, 1318].forEach((f, k) => this.tone(f, 0.18, 'triangle', 0.12, 0, k * 0.08)); },
    lose() { [392, 330, 262, 196].forEach((f, k) => this.tone(f, 0.24, 'sine', 0.08, 0, k * 0.14)); },
    tick() { this.tone(1200, 0.02, 'square', 0.025); },
    badge() { [880, 1175, 1568].forEach((f, k) => this.tone(f, 0.14, 'sine', 0.09, 0, k * 0.07)); }
  };
  const buzz = (p) => { try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; navigator.vibrate?.(p); } catch {} };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const BCOL = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f43', '#ff6fb5', '#2ec4b6'];

  const cloud = (x, y, s, dur, delay) => `<g class="cloud" style="animation-duration:${dur}s;animation-delay:${delay}s"><g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".85"><ellipse cx="0" cy="0" rx="22" ry="12"/><ellipse cx="16" cy="-6" rx="16" ry="12"/><ellipse cx="-14" cy="-3" rx="13" ry="9"/></g></g>`;
  const skyDefs = (id) => `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sky-1)"/><stop offset="1" style="stop-color:var(--sky-2)"/></linearGradient><linearGradient id="${id}water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--water-1)"/><stop offset="1" style="stop-color:var(--water-2)"/></linearGradient>`;

  function catFace() {
    return `<g class="face face-happy"><circle cx="-6" cy="25" r="2.4" fill="#2a1d14"/><circle cx="6" cy="25" r="2.4" fill="#2a1d14"/><circle cx="-5.2" cy="24.2" r=".8" fill="#fff"/><circle cx="6.8" cy="24.2" r=".8" fill="#fff"/><path d="M-4 31 q4 4 8 0" stroke="#2a1d14" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>
      <g class="face face-worried" opacity="0"><circle cx="-6" cy="26" r="2.4" fill="#2a1d14"/><circle cx="6" cy="26" r="2.4" fill="#2a1d14"/><path d="M-10 20 l6 2 M10 20 l-6 2" stroke="#2a1d14" stroke-width="1.5" stroke-linecap="round"/><path d="M-4 33 q4 -3 8 0" stroke="#2a1d14" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M11 18 q2 4 0 6 q-2 -2 0 -6z" fill="#7fd3ff"/></g>
      <g class="face face-scared" opacity="0"><circle cx="-6" cy="25" r="3.4" fill="#fff" stroke="#2a1d14" stroke-width="1.2"/><circle cx="6" cy="25" r="3.4" fill="#fff" stroke="#2a1d14" stroke-width="1.2"/><circle cx="-6" cy="25" r="1.3" fill="#2a1d14"/><circle cx="6" cy="25" r="1.3" fill="#2a1d14"/><ellipse cx="0" cy="33" rx="3" ry="3.5" fill="#2a1d14"/></g>
      <g class="face face-wet" opacity="0"><path d="M-9 25 h6 M3 25 h6" stroke="#2a1d14" stroke-width="2" stroke-linecap="round"/><path d="M-4 33 q4 -3 8 0" stroke="#2a1d14" stroke-width="1.6" fill="none"/><path d="M-12 14 l4 5 M12 14 l-4 5" stroke="#2a1d14" stroke-width="1.5"/></g>
      <g class="face face-joy" opacity="0"><path d="M-9 26 q3 -4 6 0 M3 26 q3 -4 6 0" stroke="#2a1d14" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M-5 30 q5 7 10 0z" fill="#2a1d14"/><circle cx="-11" cy="30" r="2.5" fill="#ff8a80" opacity=".6"/><circle cx="11" cy="30" r="2.5" fill="#ff8a80" opacity=".6"/></g>`;
  }

  const SCENES = {
    balloon: {
      build(host, lives, id = 'b') {
        const n = lives;
        let balloons = '';
        for (let i = 0; i < n; i++) {
          const a = n === 1 ? 0 : -1.05 + (2.1 * i) / (n - 1);
          const dist = 74 + (i % 2) * 12;
          const bx = Math.sin(a) * dist * 0.85, by = -Math.cos(a) * dist - 4;
          const c = BCOL[i % BCOL.length];
          balloons += `<g class="bl" data-i="${i}"><path class="str" d="M0 0 Q${bx * 0.4} ${by * 0.45 + 8} ${bx} ${by + 21}" stroke="rgba(60,50,40,.55)" stroke-width="1.2" fill="none"/><g class="sway" style="animation-delay:${(-i * 0.37).toFixed(2)}s;animation-duration:${2.6 + (i % 3) * 0.5}s"><ellipse cx="${bx}" cy="${by}" rx="15" ry="19" fill="${c}"/><ellipse cx="${bx}" cy="${by}" rx="15" ry="19" fill="url(#${id}shade)"/><path d="M${bx - 3} ${by + 20} l3 -3 l3 3z" fill="${c}"/><ellipse cx="${bx - 5}" cy="${by - 7}" rx="4" ry="6" fill="#fff" opacity=".55" transform="rotate(-20 ${bx - 5} ${by - 7})"/></g></g>`;
        }
        host.innerHTML = `<svg viewBox="0 0 300 260" aria-hidden="true"><defs>${skyDefs(id)}<radialGradient id="${id}shade" cx=".35" cy=".3" r=".8"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>
          <rect width="300" height="260" fill="url(#${id}sky)"/>
          <g class="sun"><circle cx="252" cy="44" r="30" fill="#ffe082" opacity=".35"/><circle cx="252" cy="44" r="20" fill="#ffd54f"/></g>
          ${cloud(40, 40, 1, 38, -5)}${cloud(150, 70, 0.7, 52, -30)}${cloud(220, 28, 0.8, 45, -18)}
          <path d="M0 190 Q50 150 110 178 T220 170 T300 176 V260 H0Z" style="fill:var(--hill-2)"/>
          <path d="M0 200 Q70 175 140 196 T300 190 V260 H0Z" style="fill:var(--hill)"/>
          <circle cx="40" cy="186" r="9" fill="#2e7d32" opacity=".7"/><rect x="38.5" y="190" width="3" height="10" fill="#6d4c41"/>
          <circle cx="268" cy="182" r="11" fill="#2e7d32" opacity=".7"/><rect x="266.5" y="187" width="3" height="12" fill="#6d4c41"/>
          <rect y="206" width="300" height="54" fill="url(#${id}water)"/>
          <g class="wave"><path d="M-20 212 q10 -4 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/></g>
          <g class="bob"><g transform="translate(58 214)"><ellipse cx="0" cy="2" rx="12" ry="6" fill="#ffd54f"/><circle cx="7" cy="-6" r="6" fill="#ffd54f"/><path d="M12 -6 l6 1.5 l-6 1.5z" fill="#ff9800"/><circle cx="8.5" cy="-7.5" r="1.2" fill="#222"/></g></g>
          <g class="splash" opacity="0"><ellipse cx="150" cy="214" rx="10" ry="3" fill="none" stroke="#fff" stroke-width="2"/><ellipse cx="150" cy="214" rx="22" ry="6" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/></g>
          <g transform="translate(150 100)"><g class="rig" style="transition:transform .9s cubic-bezier(.4,1.4,.5,1)">
            <g class="balloons">${balloons}</g>
            <g class="cat" transform="scale(1.15)">
              <path d="M10 56 q16 2 14 -14" stroke="#e8954a" stroke-width="5" fill="none" stroke-linecap="round"/>
              <ellipse cx="0" cy="52" rx="13" ry="15" fill="#f4a65d"/><ellipse cx="0" cy="55" rx="7" ry="10" fill="#fde3c8"/>
              <path d="M-6 64 v8 M6 64 v8" stroke="#f4a65d" stroke-width="6" stroke-linecap="round"/>
              <path d="M-9 44 L-3 2 M9 44 L3 2" stroke="#f4a65d" stroke-width="5" stroke-linecap="round"/>
              <circle cx="-2" cy="2" r="3.5" fill="#fde3c8"/><circle cx="2" cy="2" r="3.5" fill="#fde3c8"/>
              <path d="M-14 18 L-12 4 L-3 13Z M14 18 L12 4 L3 13Z" fill="#f4a65d"/><path d="M-12 15 L-11 8 L-6 13Z M12 15 L11 8 L6 13Z" fill="#ffc1cc"/>
              <circle cx="0" cy="26" r="15" fill="#f4a65d"/>
              <path d="M-6 13 l2 5 M0 12 v5 M6 13 l-2 5" stroke="#d9823a" stroke-width="2" stroke-linecap="round"/>
              <ellipse cx="0" cy="31" rx="7" ry="5" fill="#fde3c8"/><path d="M-1.5 28.5 h3 l-1.5 2z" fill="#ff8a80"/>
              <path d="M-8 30 h-9 M-8 32 l-8 3 M8 30 h9 M8 32 l8 3" stroke="#8d6e63" stroke-width=".8"/>
              ${catFace()}
            </g>
          </g></g>
          <g class="rainbow" opacity="0"><path d="M30 210 A120 120 0 0 1 270 210" stroke="#ff6b6b" stroke-width="6" fill="none"/><path d="M38 210 A112 112 0 0 1 262 210" stroke="#ffd93d" stroke-width="6" fill="none"/><path d="M46 210 A104 104 0 0 1 254 210" stroke="#6bcb77" stroke-width="6" fill="none"/><path d="M54 210 A96 96 0 0 1 246 210" stroke="#4d96ff" stroke-width="6" fill="none"/></g>
          <g class="fxl"></g>
        </svg>`;
        host.dataset.lives = lives;
        host.dataset.popped = 0;
      },
      update(host, misses, lives, animate) {
        const svg = host.querySelector('svg'); if (!svg) return;
        const bls = [...svg.querySelectorAll('.bl')];
        const order = popOrder(lives);
        let popped = +host.dataset.popped;
        while (popped < misses && popped < lives) {
          const b = bls[order[popped]];
          if (b && animate && !reduce) popBalloon(svg, b); else if (b) b.style.display = 'none';
          popped++;
        }
        host.dataset.popped = popped;
        const t = Math.min(1, misses / lives);
        svg.querySelector('.rig').style.transform = `translateY(${t * 40}px)`;
        setFace(svg, misses >= lives ? 'wet' : lives - misses <= 1 ? 'scared' : t >= 0.5 ? 'worried' : 'happy');
      },
      lose(host) {
        const svg = host.querySelector('svg');
        const rig = svg.querySelector('.rig');
        rig.style.transition = 'transform .7s cubic-bezier(.5,0,1,.6)';
        rig.style.transform = "translateY(100px)";
        setTimeout(() => { sfx.splash(); const sp = svg.querySelector('.splash'); sp.style.transition = 'opacity .2s'; sp.setAttribute('opacity', 1); sp.animate([{ transform: 'scale(.4)', opacity: 1 }, { transform: 'scale(1.8)', opacity: 0 }], { duration: 900, fill: 'forwards' }); sp.style.transformOrigin = '150px 214px'; drops(svg, 150, 210); }, reduce ? 0 : 650);
        setFace(svg, 'wet');
      },
      win(host) {
        const svg = host.querySelector('svg');
        setFace(svg, 'joy');
        const rig = svg.querySelector('.rig');
        rig.style.transition = 'transform 2.4s cubic-bezier(.5,0,.6,1)';
        setTimeout(() => { rig.style.transform = 'translateY(-260px)'; }, 500);
        const rb = svg.querySelector('.rainbow');
        rb.style.transition = 'opacity 1.2s ease .3s'; rb.setAttribute('opacity', '.8');
        sparkles(svg);
      }
    },
    snowman: {
      build(host, lives, id = 's') {
        host.innerHTML = `<svg viewBox="0 0 300 260" aria-hidden="true"><defs>${skyDefs(id)}<radialGradient id="${id}ball" cx=".38" cy=".32" r=".75"><stop offset=".55" style="stop-color:var(--snow)"/><stop offset="1" style="stop-color:var(--snow-sh)"/></radialGradient></defs>
          <rect width="300" height="260" fill="url(#${id}sky)"/>
          <g class="sun" style="transform-origin:62px 58px;transition:transform 1s ease, opacity 1s"><g class="rot">${Array.from({ length: 12 }, (_, i) => `<path d="M62 58 L${62 + Math.cos((i * Math.PI) / 6) * 46} ${58 + Math.sin((i * Math.PI) / 6) * 46}" stroke="#ffd54f" stroke-width="5" stroke-linecap="round" opacity=".7"/>`).join('')}</g><circle cx="62" cy="58" r="24" fill="#ffca28"/><circle cx="55" cy="54" r="2.5" fill="#6d4c41"/><circle cx="69" cy="54" r="2.5" fill="#6d4c41"/><path d="M54 63 q8 6 16 0" stroke="#6d4c41" stroke-width="2.2" fill="none" stroke-linecap="round"/></g>
          ${cloud(200, 40, 0.9, 50, -12)}${cloud(90, 100, 0.6, 60, -40)}
          <g class="flakes" opacity=".9">${Array.from({ length: 14 }, (_, i) => `<circle class="flake" cx="${(i * 23) % 300}" cy="0" r="${1.5 + (i % 3)}" fill="#fff" style="animation-duration:${5 + (i % 5)}s;animation-delay:${(-i * 0.7).toFixed(1)}s"/>`).join('')}</g>
          <path d="M0 205 Q60 188 130 200 T300 196 V260 H0Z" style="fill:var(--snow)"/>
          <path d="M0 222 Q80 210 160 220 T300 216 V260 H0Z" style="fill:var(--snow-sh)" opacity=".5"/>
          <g transform="translate(36 198)"><path d="M0 0 l-12 0 l12 -34 l12 34z" fill="#2e7d32"/><path d="M0 -20 l-9 10 h18z" fill="#388e3c"/><rect x="-2" y="0" width="4" height="7" fill="#6d4c41"/><path d="M-8 -4 h16" stroke="#fff" stroke-width="2" opacity=".8"/></g>
          <g transform="translate(270 196)"><path d="M0 0 l-10 0 l10 -28 l10 28z" fill="#2e7d32"/><rect x="-2" y="0" width="4" height="6" fill="#6d4c41"/></g>
          <ellipse class="puddle" cx="150" cy="222" rx="18" ry="4" fill="url(#${id}water)" opacity=".85" style="transition:all .9s ease"/>
          <g class="man" style="transform-origin:150px 222px;transition:transform .9s cubic-bezier(.4,1.3,.5,1)">
            <path class="arm armL" d="M126 128 L98 108 M108 115 l-6 -9" stroke="#6d4c41" stroke-width="4" stroke-linecap="round" fill="none" style="transform-origin:126px 128px;transition:transform .8s ease"/>
            <path class="arm armR" d="M174 128 L204 112 M194 117 l5 -10" stroke="#6d4c41" stroke-width="4" stroke-linecap="round" fill="none" style="transform-origin:174px 128px;transition:transform .8s ease"/>
            <circle cx="150" cy="186" r="38" fill="url(#${id}ball)"/>
            <circle cx="150" cy="130" r="27" fill="url(#${id}ball)"/>
            <circle cx="150" cy="122" r="2.5" fill="#37474f"/><circle cx="150" cy="134" r="2.5" fill="#37474f"/><circle cx="150" cy="182" r="3" fill="#37474f"/><circle cx="150" cy="196" r="3" fill="#37474f"/>
            <g class="scarf" opacity="0" style="transition:opacity .6s"><path d="M126 107 q24 12 48 0 l-2 9 q-22 10 -44 0z" fill="#e53935"/><path d="M162 112 l4 26 l9 -2 l-5 -24z" fill="#c62828"/><path d="M130 110 l3 5 M138 113 l2 5 M146 114 l1 5 M154 114 l-1 5 M162 112 l-2 5" stroke="#fff" stroke-width="2"/></g>
            <circle cx="150" cy="86" r="21" fill="url(#${id}ball)"/>
            <g class="drips" opacity="0" style="transition:opacity .5s"><path d="M128 196 q2 10 4 0z M170 200 q2 9 4 0z M140 146 q2 8 4 0z" style="fill:var(--snow-sh)"/></g>
            <g class="sface face-happy"><circle cx="142" cy="81" r="2.6" fill="#263238"/><circle cx="158" cy="81" r="2.6" fill="#263238"/>${[-8, -4, 0, 4, 8].map((dx, k) => `<circle cx="${150 + dx}" cy="${95 + Math.abs(dx) * -0.25 + (k === 2 ? 1 : 0)}" r="1.5" fill="#263238"/>`).join('')}</g>
            <g class="sface face-worried" opacity="0"><circle cx="142" cy="82" r="2.6" fill="#263238"/><circle cx="158" cy="82" r="2.6" fill="#263238"/><path d="M137 75 l7 2 M163 75 l-7 2" stroke="#263238" stroke-width="1.8" stroke-linecap="round"/><path d="M143 97 q7 -4 14 0" stroke="#263238" stroke-width="2" fill="none" stroke-linecap="round"/></g>
            <g class="sface face-joy" opacity="0"><path d="M138 82 q4 -5 8 0 M154 82 q4 -5 8 0" stroke="#263238" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M142 93 q8 8 16 0" stroke="#263238" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="138" cy="91" r="3" fill="#ff8a80" opacity=".6"/><circle cx="162" cy="91" r="3" fill="#ff8a80" opacity=".6"/></g>
          </g>
          <g class="carrot" style="transform-origin:151px 88px;transition:transform .8s ease"><path d="M151 86 L174 91 L151 92z" fill="#ff9800"/><path d="M157 88 v3 M163 89 v2" stroke="#e65100" stroke-width="1"/></g>
          <g class="hat" style="transform-origin:150px 68px;transition:transform .8s ease"><rect x="133" y="64" width="34" height="5" rx="2" fill="#263238"/><rect x="139" y="42" width="22" height="24" rx="3" fill="#37474f"/><rect x="139" y="58" width="22" height="4" fill="#e53935"/></g>
          <g class="fxl"></g>
        </svg>`;
      },
      update(host, misses, lives) {
        const svg = host.querySelector('svg'); if (!svg) return;
        const t = Math.min(1, misses / lives);
        svg.querySelector('.sun').style.transform = `scale(${1 + t * 0.9}) translate(${t * 14}px, ${t * 10}px)`;
        svg.querySelector('.man').style.transform = `scale(${1 + t * 0.22}, ${1 - t * 0.55})`;
        const pd = svg.querySelector('.puddle');
        pd.setAttribute('rx', 18 + t * 70); pd.setAttribute('ry', 4 + t * 9);
        const sy = 1 - t * 0.55;
        svg.querySelector('.carrot').style.transform = `translateY(${134 * (1 - sy)}px) rotate(${t * 40}deg)`;
        svg.querySelector('.hat').style.transform = `translateY(${154 * (1 - sy)}px) rotate(${-t * 22}deg) translate(${-t * 6}px, 0)`;
        svg.querySelector('.armL').style.transform = `rotate(${-t * 55}deg)`;
        svg.querySelector('.armR').style.transform = `rotate(${t * 55}deg)`;
        svg.querySelector('.drips').setAttribute('opacity', t > 0.15 ? 1 : 0);
        svg.querySelector('.flakes').setAttribute('opacity', Math.max(0, 0.9 - t * 1.6));
        setFace(svg, t >= 0.5 ? 'worried' : 'happy', '.sface');
      },
      lose(host) {
        const svg = host.querySelector('svg');
        sfx.sizzle();
        svg.querySelector('.man').style.transform = 'scale(1.5, .14)';
        const pd = svg.querySelector('.puddle'); pd.setAttribute('rx', 100); pd.setAttribute('ry', 14);
        svg.querySelector('.hat').style.transform = 'translate(-40px, 150px) rotate(-30deg)';
        svg.querySelector('.carrot').style.transform = 'translate(30px, 128px) rotate(70deg)';
        drops(svg, 150, 200);
      },
      win(host) {
        const svg = host.querySelector('svg');
        svg.querySelector('.scarf').setAttribute('opacity', 1);
        svg.querySelector('.flakes').setAttribute('opacity', 1);
        svg.querySelector('.sun').style.transform = 'scale(.7) translate(-30px, -30px)';
        svg.querySelector('.sun').style.opacity = '.6';
        svg.querySelector('.man').style.transform = 'scale(1, 1)';
        svg.querySelector('.armL').style.transform = 'rotate(-30deg)';
        svg.querySelector('.armR').style.transform = 'rotate(30deg)';
        svg.querySelector('.carrot').style.transform = 'none';
        svg.querySelector('.hat').style.transform = 'rotate(8deg) translateY(-6px)';
        setFace(svg, 'joy', '.sface');
        sparkles(svg);
      }
    }
  };

  function popOrder(n) {
    const order = [];
    for (let k = 0; k < n; k++) order.push(k % 2 === 0 ? k / 2 : n - 1 - (k - 1) / 2);
    return order;
  }
  function setFace(svg, which, sel = '.face') {
    svg.querySelectorAll(sel).forEach((f) => f.setAttribute('opacity', f.classList.contains(`face-${which}`) ? 1 : 0));
  }
  function popBalloon(svg, b) {
    const el = b.querySelector('ellipse');
    const cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy');
    const color = el.getAttribute('fill');
    const fxl = svg.querySelector('.fxl');
    const ox = 150 + cx, oy = 100 + cy + (parseFloat((svg.querySelector('.rig').style.transform.match(/translateY\(([-\d.]+)px/) || [0, 0])[1]) || 0);
    b.querySelector('.sway').animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.35)', opacity: 0 }], { duration: 120, fill: 'forwards' });
    b.querySelector('.str').animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(40px)', opacity: 0 }], { duration: 700, fill: 'forwards', easing: 'ease-in' });
    for (let k = 0; k < 9; k++) {
      const p = document.createElementNS(NS, 'path');
      const a = (k / 9) * Math.PI * 2;
      p.setAttribute('d', `M${ox} ${oy} l4 -2 l-1 5z`);
      p.setAttribute('fill', color);
      fxl.append(p);
      p.animate([{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * 34}px, ${Math.sin(a) * 34 + 20}px) rotate(${180 + k * 40}deg)`, opacity: 0 }], { duration: 650, easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => p.remove();
    }
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', ox); ring.setAttribute('cy', oy); ring.setAttribute('r', 10);
    ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', '#fff'); ring.setAttribute('stroke-width', 3);
    fxl.append(ring);
    ring.style.transformOrigin = `${ox}px ${oy}px`;
    ring.animate([{ transform: 'scale(.5)', opacity: 1 }, { transform: 'scale(2.6)', opacity: 0 }], { duration: 380 }).onfinish = () => ring.remove();
  }
  function drops(svg, x, y) {
    if (reduce) return;
    const fxl = svg.querySelector('.fxl');
    for (let k = 0; k < 12; k++) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', 2 + Math.random() * 2.5);
      c.setAttribute('fill', '#bfe9ff');
      fxl.append(c);
      const a = -Math.PI * (0.15 + Math.random() * 0.7);
      c.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * 50}px, ${Math.sin(a) * 50}px)`, opacity: 0.9, offset: 0.5 }, { transform: `translate(${Math.cos(a) * 80}px, 10px)`, opacity: 0 }], { duration: 800, delay: 650, easing: 'ease-out', fill: 'both' }).onfinish = () => c.remove();
    }
  }
  function sparkles(svg) {
    if (reduce) return;
    const fxl = svg.querySelector('.fxl');
    for (let k = 0; k < 16; k++) {
      const p = document.createElementNS(NS, 'path');
      const x = 30 + Math.random() * 240, y = 20 + Math.random() * 170, s = 3 + Math.random() * 4;
      p.setAttribute('d', `M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3}Z`);
      p.setAttribute('fill', Curio.pick(['#fff59d', '#ffffff', '#ffd54f', '#b3e5fc']));
      fxl.append(p);
      p.style.transformOrigin = `${x}px ${y}px`;
      p.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.3) rotate(45deg)', opacity: 1, offset: 0.4 }, { transform: 'scale(0) rotate(90deg)', opacity: 0 }], { duration: 900 + Math.random() * 600, delay: k * 90 }).onfinish = () => p.remove();
    }
  }

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function dailyWord() {
    const k = todayKey();
    const cat = CATS[hashStr(`cat${k}`) % CATS.length];
    const list = DATA[cat].words.filter((w) => w.replace(/[^A-Z]/g, '').length >= 6);
    return { word: list[hashStr(`w${k}`) % list.length], cat };
  }

  let word, wordCat, guessed, misses, over, hinted, lives, mode, seq, usedHint, round = 0, blitz = null, clue = '';
  const keys = {};

  ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].forEach((row) => {
    const r = document.createElement('div'); r.className = 'row';
    for (const ch of row) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = ch; b.setAttribute('aria-label', `Letter ${ch}`);
      b.addEventListener('click', () => guess(ch));
      keys[ch] = b; r.append(b);
    }
    $('kb').append(r);
  });

  function radio(container, items, current, render, onPick, cls) {
    container.replaceChildren();
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); if (cls) b.className = cls;
      b.setAttribute('aria-checked', String(it.id === current));
      b.innerHTML = render(it);
      b.addEventListener('click', () => { onPick(it); sfx.tick(); });
      container.append(b);
    });
  }

  function buildMenu() {
    app.classList.remove('playing');
    radio($('modes'), MODES, S.mode, (m) => {
      let sub = m.sub;
      if (m.id === 'daily') { const d = S.daily[todayKey()]; if (d) sub = d.won ? `Solved today with ${d.misses} miss${d.misses === 1 ? '' : 'es'}!` : 'Today’s word got away. Tomorrow!'; }
      if (m.id === 'blitz' && S.blitzBest) sub += ` · best ${S.blitzBest}`;
      return `<span class="e">${m.e}</span><b>${m.name}</b><small>${sub}</small>`;
    }, (m) => { S.mode = m.id; save(); buildMenu(); }, 'mode');
    radio($('diff'), DIFFS, S.diff, (d) => d.name, (d) => { S.diff = d.id; save(); buildMenu(); });
    radio($('scenes'), SCENE_LIST, S.scene, (d) => d.name, (d) => { S.scene = d.id; save(); buildMenu(); });
    const items = [{ id: 'random', e: '🎲', label: 'Everything' }, ...CATS.map((k) => ({ id: k, e: DATA[k].emoji, label: DATA[k].label }))];
    radio($('cats'), items, S.cat, (c) => {
      const st = c.id === 'random' ? null : S.catStats[c.id];
      const total = c.id === 'random' ? CATS.reduce((a, k) => a + DATA[k].words.length, 0) : DATA[c.id].words.length;
      const solved = st ? st.w : 0;
      return `<span class="e">${c.e}</span><span class="t"><b>${c.label}</b><small>${c.id === 'random' ? `${total} words` : `${solved}/${total} solved`}</small></span>${c.id !== 'random' ? `<span class="prog" style="width:${(solved / total) * 100}%"></span>` : ''}`;
    }, (c) => { S.cat = c.id; save(); buildMenu(); }, 'cat');
    $('cats-card').classList.toggle('locked', S.mode === 'daily' || S.mode === 'duo');
    SCENES[S.scene].build($('hero-scene'), S.diff, 'h');
    $('go').textContent = { classic: 'Start guessing', daily: 'Play today’s word', blitz: 'Start the clock', duo: 'Set a secret word' }[S.mode];
    $('badge-count').textContent = `${Object.keys(S.badges).filter((k) => BADGES.some((b) => b.id === k)).length}/${BADGES.length}`;
  }

  function show(which) {
    $('menu').hidden = which !== 'menu'; $('game').hidden = which !== 'game';
    app.classList.toggle('playing', which === 'game');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function pickWord() {
    const c = S.cat === 'random' ? Curio.pick(CATS) : S.cat;
    const pool = DATA[c].words.filter((w) => !S.recent.includes(w));
    const w = Curio.pick(pool.length ? pool : DATA[c].words);
    S.recent = [w, ...S.recent].slice(0, 300);
    return [w, c];
  }

  function paintHud() {
    $('mode-tag').textContent = mode === 'classic' ? 'Classic' : mode === 'daily' ? `Daily · ${todayKey()}` : mode === 'blitz' ? 'Blitz' : 'Two players';
    $('h-streak').textContent = S.streak;
    $('h-best').textContent = Curio.getBest('streak') ?? 0;
    $('h-timer').hidden = mode !== 'blitz';
    $('h-blitz').hidden = mode !== 'blitz';
    if (blitz) $('h-solved').textContent = blitz.solved;
  }

  function startRound(opts = {}) {
    round++;
    mode = opts.mode || S.mode;
    lives = mode === 'daily' ? 6 : S.diff;
    if (opts.word) { word = opts.word; wordCat = opts.cat || null; }
    else if (mode === 'daily') { const d = dailyWord(); word = d.word; wordCat = d.cat; }
    else [word, wordCat] = pickWord();
    clue = opts.clue || '';
    guessed = new Set(); hinted = new Set(); misses = 0; over = false; seq = []; usedHint = false;
    show('game');
    Object.values(keys).forEach((b) => { b.className = ''; b.disabled = false; });
    $('controls').hidden = false; $('result').hidden = true;
    $('skip').hidden = mode === 'daily' || mode === 'duo';
    $('cat-label').textContent = `${wordCat ? `${DATA[wordCat].emoji} ${DATA[wordCat].label}` : '🤫 Secret word'} · ${letters().size} different letters`;
    $('clue').hidden = !clue; $('clue').textContent = clue ? `Clue: ${clue}` : '';
    SCENES[S.scene].build($('scene'), lives);
    SCENES[S.scene].update($('scene'), 0, lives, false);
    $('word').classList.remove('won');
    renderWord(); renderLives(); paintHud();
    save();
  }

  const letters = () => new Set([...word].filter(isLetter));

  function renderWord(reveal = false) {
    const el = $('word'); el.replaceChildren();
    let i = 0;
    word.split(' ').forEach((part) => {
      const w = document.createElement('div'); w.className = 'w';
      for (const ch of part) {
        const s = document.createElement('span');
        s.className = 'slot'; s.style.setProperty('--i', i++);
        if (!isLetter(ch)) { s.classList.add('punct'); s.textContent = ch; }
        else if (guessed.has(ch) || reveal) {
          const c = document.createElement('span'); c.className = 'ch'; c.textContent = ch; s.append(c);
          if (!guessed.has(ch)) s.classList.add('missed');
          else if (hinted.has(ch)) s.classList.add('hinted');
          else s.classList.add('got');
        }
        w.append(s);
      }
      el.append(w);
    });
    el.setAttribute('aria-label', `Word: ${[...word].map((ch) => (!isLetter(ch) || guessed.has(ch) || reveal ? ch : 'blank')).join(' ')}`);
  }

  function renderLives() {
    const el = $('lives');
    el.className = `lives${S.scene === 'snowman' ? ' snow' : ''}`;
    el.innerHTML = Array.from({ length: lives }, (_, i) => `<i class="${i < lives - misses ? '' : 'gone'}" style="--c:${BCOL[popOrder(lives).slice().reverse()[i] % BCOL.length]}"></i>`).join('');
    el.setAttribute('aria-label', `${lives - misses} of ${lives} lives left`);
    $('hint').disabled = over || lives - misses <= 1;
  }

  function guess(ch) {
    if (over || guessed.has(ch) || $('game').hidden) return;
    guessed.add(ch);
    keys[ch].disabled = true;
    if (word.includes(ch)) {
      keys[ch].classList.add('hit');
      seq.push(1);
      S.letters.right++;
      const count = [...word].filter((c) => c === ch).length;
      sfx.hit(guessed.size); if (count > 1) sfx.tone(1318, 0.1, 'sine', 0.06, 0, 0.08);
      buzz(8);
      renderWord();
      if (count >= 3) Curio.toast(`${count} ${ch}s!`);
      if ([...letters()].every((l) => guessed.has(l))) win();
    } else {
      keys[ch].classList.add('miss');
      seq.push(0);
      S.letters.wrong++;
      miss();
    }
  }

  function miss() {
    misses++;
    const w = $('word'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake');
    const sc = $('scene'); sc.classList.remove('shake'); void sc.offsetWidth; sc.classList.add('shake');
    if (S.scene === 'balloon') sfx.pop(); else sfx.sizzle();
    buzz(40);
    SCENES[S.scene].update($('scene'), misses, lives, true);
    renderLives();
    if (misses >= lives) lose();
  }

  function hint() {
    if (over || lives - misses <= 1) return;
    const left = [...letters()].filter((l) => !guessed.has(l));
    if (!left.length) return;
    left.sort((a, b) => [...word].filter((c) => c === b).length - [...word].filter((c) => c === a).length);
    const ch = left[0];
    usedHint = true;
    hinted.add(ch);
    Curio.toast(`There is a ${ch} in there. That cost a ${S.scene === 'balloon' ? 'balloon' : 'bit of snowman'}.`);
    guessed.add(ch); keys[ch].disabled = true; keys[ch].classList.add('hit');
    miss();
    if (over) return;
    renderWord();
    if ([...letters()].every((l) => guessed.has(l))) win();
  }

  function award(ctx) {
    const got = [];
    const give = (id) => { if (!S.badges[id]) { S.badges[id] = Date.now(); const b = BADGES.find((x) => x.id === id); if (b) got.push(b); } };
    if (ctx.won) {
      give('first');
      if (misses === 0) give('perfect');
      if (lives - misses === 1) give('close');
      if (S.streak >= 5) give('streak5');
      if (S.streak >= 10) give('streak10');
      if (S.streak >= 25) give('streak25');
      if (word.replace(/[^A-Z]/g, '').length >= 12) give('long');
      if (/[QXZ]/.test(word)) give('rare');
      if (![...guessed].some((c) => VOWELS.has(c)) && word.replace(/[^A-Z]/g, '').length >= 4) give('consonant');
      if (lives === 4 && mode !== 'daily') give('hard');
      if (wordCat && (S.catStats[wordCat]?.w || 0) >= 10) give('master');
      if (Object.values(S.catStats).filter((c) => c.w > 0).length >= 10) give('explorer');
      if (mode === 'daily') give('daily');
      if (S.cleanRun >= 10) give('nohint');
      if (S.saved.balloon >= 10) give('cat');
      if (S.saved.snowman >= 10) give('snow');
      if (S.won >= 100) give('century');
    }
    if (mode === 'duo') give('duo');
    if (ctx.blitz >= 5) give('blitz5');
    if (ctx.blitz >= 10) give('blitz10');
    return got;
  }

  const WIN_LINES = {
    balloon: ['Biscuit stays airborne!', 'Up, up and away!', 'Purr-fect.', 'Dry paws all round.'],
    snowman: ['The snowman lives!', 'Cool as ice.', 'Frosty and fabulous.', 'Not a drop melted. Well, a few.']
  };
  const LOSE_LINES = {
    balloon: ['Splash! Biscuit is wet and furious.', 'Into the drink.', 'One very damp cat.', 'The duck is laughing.'],
    snowman: ['Just a puddle and a hat now.', 'Melted. Tragic.', 'The sun wins this one.', 'Snowman soup.']
  };

  function recordWord(won) {
    if (mode === 'duo') return;
    if (wordCat) { const c = (S.catStats[wordCat] ||= { w: 0, l: 0 }); if (won) c.w++; else c.l++; }
    S.hist.unshift({ w: word, won, m: misses, c: wordCat, t: Date.now() });
    S.hist = S.hist.slice(0, 30);
  }

  function win() {
    over = true;
    const t0 = round;
    recordWord(true);
    if (mode !== 'duo') {
      S.won++;
      S.saved[S.scene]++;
      if (misses === 0) S.perfect++;
      S.cleanRun = usedHint ? 0 : S.cleanRun + 1;
    }
    if (mode === 'classic') { S.streak++; Curio.best('streak', S.streak); }
    if (mode === 'daily' && !S.daily[todayKey()]) S.daily[todayKey()] = { won: true, misses, seq: seq.slice() };
    $('word').classList.add('won');
    SCENES[S.scene].win($('scene'));
    sfx.win(); buzz([20, 30, 40]);
    if (mode === 'blitz') { blitz.solved++; blitz.words.push({ w: word, ok: true }); paintHud(); const el = $('h-blitz'); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => { if (t0 === round && blitz) startRound({ mode: 'blitz' }); }, 900); save(); return; }
    Curio.confetti(misses === 0 ? 160 : 90);
    const got = award({ won: true });
    save();
    showResult(true, got);
  }

  function lose() {
    over = true;
    const t0 = round;
    recordWord(false);
    if (mode !== 'duo') { S.lost++; S.cleanRun = 0; }
    if (mode === 'classic') S.streak = 0;
    if (mode === 'daily' && !S.daily[todayKey()]) S.daily[todayKey()] = { won: false, misses, seq: seq.slice() };
    renderWord(true);
    SCENES[S.scene].lose($('scene'));
    sfx.lose();
    if (mode === 'blitz') { blitz.words.push({ w: word, ok: false }); setTimeout(() => { if (t0 === round && blitz) startRound({ mode: 'blitz' }); }, 1300); save(); return; }
    const got = award({ won: false });
    save();
    showResult(false, got);
  }

  function showResult(won, got) {
    paintHud(); renderLives();
    $('controls').hidden = true;
    const r = $('result'); r.hidden = false;
    const best = Curio.getBest('streak') ?? 0;
    const line = won
      ? mode === 'classic' ? `${misses === 0 ? 'Zero misses! ' : ''}Streak ${S.streak}${S.streak === best && S.streak > 1 ? ', a new personal best!' : `, best ${best}.`}` : mode === 'daily' ? `Solved with ${misses} miss${misses === 1 ? '' : 'es'}. Come back tomorrow for a new one.` : 'The guesser wins this round!'
      : `The word was ${word}.${mode === 'classic' ? ` Streak reset, best ${best}.` : ''}`;
    const stats = mode === 'duo' ? '' : `<div class="rstats"><div><b>${misses}</b><span>Misses</span></div><div><b>${S.won}</b><span>Solved</span></div><div><b>${S.letters.right + S.letters.wrong ? Math.round((S.letters.right / (S.letters.right + S.letters.wrong)) * 100) : 0}%</b><span>Hit rate</span></div></div>`;
    r.innerHTML = `<div class="big" aria-hidden="true">${won ? Curio.pick(['🎉', '🥳', '🌈']) : S.scene === 'balloon' ? '💦' : '🫠'}</div><h2></h2><p></p>${got.length ? `<div class="newb">${got.map((b) => `<span>${b.e} ${b.t}</span>`).join('')}</div>` : ''}${stats}<div class="c-row"><button type="button" class="c-btn" id="next">${mode === 'daily' ? 'Play classic' : mode === 'duo' ? 'Swap and go again' : 'Next word'}</button>${mode === 'daily' ? '<button type="button" class="c-btn c-btn--ghost" id="share">Share</button>' : ''}<button type="button" class="c-btn c-btn--ghost" id="r-menu">Menu</button></div>`;
    r.querySelector('h2').textContent = Curio.pick((won ? WIN_LINES : LOSE_LINES)[S.scene]);
    r.querySelector('p').textContent = line;
    if (got.length) setTimeout(() => sfx.badge(), 700);
    $('next').addEventListener('click', next);
    $('r-menu').addEventListener('click', toMenu);
    r.querySelector('#share')?.addEventListener('click', shareDaily);
    setTimeout(() => $('next')?.focus({ preventScroll: true }), 60);
  }

  function next() {
    if (mode === 'daily') { S.mode = 'classic'; save(); startRound({ mode: 'classic' }); }
    else if (mode === 'duo') duoSetup();
    else startRound({ mode });
  }

  async function shareDaily() {
    const d = S.daily[todayKey()] || { won: over && misses < lives, misses, seq };
    const icon = S.scene === 'balloon' ? '🎈' : '⛄';
    const text = `Hangman on Zoble · Daily ${todayKey()}\n${d.won ? `${icon} Solved with ${d.misses} miss${d.misses === 1 ? '' : 'es'}` : '💦 Got away from me'}\n${(d.seq || []).map((x) => (x ? '🟩' : '🟥')).join('')}`;
    try { await navigator.clipboard.writeText(text); Curio.toast('Copied. No spoilers inside.'); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); Curio.toast('Copied. No spoilers inside.'); } catch { Curio.toast('Could not copy, sorry.'); }
      ta.remove();
    }
  }

  let timer = 0;
  function startBlitz() {
    blitz = { left: 90, solved: 0, words: [] };
    startRound({ mode: 'blitz' });
    clearInterval(timer);
    let last = performance.now();
    timer = setInterval(() => {
      if (document.hidden || !blitz) { last = performance.now(); return; }
      const now = performance.now();
      blitz.left -= (now - last) / 1000; last = now;
      const s = Math.max(0, Math.ceil(blitz.left));
      $('h-time').textContent = s;
      $('h-timer').classList.toggle('low', s <= 10);
      if (s <= 5 && $('h-time').dataset.s !== String(s)) { $('h-time').dataset.s = s; sfx.tone(880, 0.05, 'square', 0.04); }
      if (blitz.left <= 0) endBlitz();
    }, 100);
    $('h-time').textContent = 90;
  }
  function endBlitz() {
    clearInterval(timer);
    if (!blitz) return;
    const b = blitz; blitz = null;
    round++;
    over = true;
    const isBest = b.solved > S.blitzBest;
    S.blitzBest = Math.max(S.blitzBest, b.solved);
    const got = award({ blitz: b.solved });
    save();
    if (b.solved) { Curio.confetti(); sfx.win(); } else sfx.lose();
    $('controls').hidden = true;
    const r = $('result'); r.hidden = false;
    r.innerHTML = `<div class="big" aria-hidden="true">⏱️</div><h2>Time!</h2><p>You solved ${b.solved} word${b.solved === 1 ? '' : 's'} in 90 seconds.${isBest && b.solved ? ' New personal best!' : ` Best: ${S.blitzBest}.`}</p>${got.length ? `<div class="newb">${got.map((x) => `<span>${x.e} ${x.t}</span>`).join('')}</div>` : ''}<div class="wordlist">${b.words.concat(word && !b.words.some((x) => x.w === word) ? [{ w: word, ok: false }] : []).map((x) => `<span class="${x.ok ? 'w' : 'l'}">${x.w}</span>`).join('')}</div><div class="c-row" style="margin-top:12px"><button type="button" class="c-btn" id="b-again">Again</button><button type="button" class="c-btn c-btn--ghost" id="b-menu">Menu</button></div>`;
    renderWord(true);
    $('b-again').addEventListener('click', startBlitz);
    $('b-menu').addEventListener('click', toMenu);
  }

  function duoSetup() {
    openSheet('Two players', `<div class="secret"><p class="c-muted" style="margin:0">Player 1: type a secret word or phrase while player 2 looks away. Letters and spaces only, up to 24 characters.</p>
      <label>Secret word <input class="c-input" id="secret" type="password" autocomplete="off" maxlength="24" spellcheck="false"></label>
      <label>Clue (optional) <input class="c-input" id="secret-clue" type="text" autocomplete="off" maxlength="40" style="text-transform:none;letter-spacing:0;font-weight:600"></label>
      <p class="err" id="secret-err"></p>
      <div class="c-row"><button type="button" class="c-btn" id="secret-go">Hide it and play</button><button type="button" class="c-btn c-btn--ghost" id="secret-show">Peek</button></div></div>`);
    const inp = $('secret');
    setTimeout(() => inp.focus(), 50);
    $('secret-show').addEventListener('click', () => { inp.type = inp.type === 'password' ? 'text' : 'password'; });
    const go = () => {
      const w = inp.value.toUpperCase().replace(/\s+/g, ' ').trim();
      if (!/^[A-Z ]{2,24}$/.test(w) || w.replace(/ /g, '').length < 2) { $('secret-err').textContent = 'Use at least 2 letters, A to Z and spaces only.'; return; }
      const c = $('secret-clue').value.trim().slice(0, 40);
      closeSheet();
      startRound({ mode: 'duo', word: w, clue: c });
    };
    $('secret-go').addEventListener('click', go);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    $('secret-clue').addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
  }

  function openSheet(title, html) {
    $('sheet-title').textContent = title;
    $('sheet-body').innerHTML = html;
    $('sheet').hidden = false;
    $('sheet-x').focus({ preventScroll: true });
  }
  function closeSheet() { $('sheet').hidden = true; }
  $('sheet-x').addEventListener('click', closeSheet);
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) closeSheet(); });

  function toMenu() { if (Curio.simple) { closeSheet(); clearInterval(timer); startRound({ mode: 'classic' }); return; } round++; clearInterval(timer); blitz = null; over = true; closeSheet(); show('menu'); buildMenu(); }

  function showStats() {
    const tot = S.won + S.lost;
    let html = `<div class="sgrid"><div><b>${S.won}</b><span>Solved</span></div><div><b>${tot ? Math.round((S.won / tot) * 100) : 0}%</b><span>Win rate</span></div><div><b>${Curio.getBest('streak') ?? 0}</b><span>Best streak</span></div><div><b>${S.blitzBest}</b><span>Blitz best</span></div></div>`;
    html += `<div class="sgrid"><div><b>${S.perfect}</b><span>Flawless</span></div><div><b>${S.saved.balloon}</b><span>Cats saved</span></div><div><b>${S.saved.snowman}</b><span>Snowmen saved</span></div><div><b>${S.letters.right + S.letters.wrong ? Math.round((S.letters.right / (S.letters.right + S.letters.wrong)) * 100) : 0}%</b><span>Letter hit rate</span></div></div>`;
    html += '<table class="rtable"><thead><tr><th>Category</th><th>Solved</th><th>Missed</th><th>Of</th></tr></thead><tbody>';
    for (const k of CATS) { const c = S.catStats[k] || { w: 0, l: 0 }; html += `<tr><td>${DATA[k].emoji} ${DATA[k].label}</td><td>${c.w}</td><td>${c.l}</td><td>${DATA[k].words.length}</td></tr>`; }
    html += '</tbody></table>';
    html += `<h3 class="sub">Badges ${Object.keys(S.badges).length}/${BADGES.length}</h3><div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? 'got' : 'locked'}"><span class="e">${b.e}</span><b>${b.t}</b><small>${b.d}</small></div>`).join('')}</div>`;
    html += `<h3 class="sub">Recent words</h3>${S.hist.length ? `<div class="wordlist">${S.hist.map((h) => `<span class="${h.won ? 'w' : 'l'}">${h.w}</span>`).join('')}</div>` : '<p class="c-muted">Nothing yet.</p>'}`;
    html += '<p style="margin-top:14px"><button type="button" class="c-btn c-btn--ghost" id="reset">Reset all stats</button></p>';
    openSheet('Stats and badges', html);
    $('reset').addEventListener('click', async () => {
      closeSheet();
      const v = await Curio.modal({ emoji: '🧹', title: 'Wipe everything?', body: 'Stats, badges and history will be cleared.', buttons: [{ label: 'Keep them', value: 'no' }, { label: 'Wipe', value: 'yes' }] });
      if (v !== 'yes') return;
      Object.assign(S, { streak: 0, won: 0, lost: 0, perfect: 0, catStats: {}, badges: {}, recent: [], hist: [], daily: {}, blitzBest: 0, letters: { right: 0, wrong: 0 }, saved: { balloon: 0, snowman: 0 }, cleanRun: 0 });
      save(); buildMenu();
    });
  }

  function showHow() {
    const total = CATS.reduce((a, k) => a + DATA[k].words.length, 0);
    openSheet('How to play', `<div class="how">
      <p><b>Guess the word one letter at a time.</b> Right letters fill in every matching slot. Wrong letters cost a life: Biscuit loses a balloon, or the sun gets a little hotter on the snowman.</p>
      <p><b>Lives.</b> Easy gives you 8, Normal 6 and Hard 4. Run out and Biscuit goes for an unplanned swim, or the snowman becomes a puddle with a hat in it.</p>
      <p><b>Hints</b> reveal the most common missing letter, but cost a life. You cannot use one on your last life.</p>
      <p><b>Modes.</b> Classic is endless and builds a streak. Word of the day is the same for everyone and only your first try counts. Blitz gives you 90 seconds to solve as many as you can. Two players lets one person type a secret word for the other.</p>
      <p><b>Tips.</b> E, A, R, I, O, T, N and S are the most common letters in English words. Vowels first is a classic opener, but there is a badge for never guessing one at all.</p>
      <p class="c-muted">${CATS.length} categories and ${total.toLocaleString('en-US')} words.</p>
    </div>`);
  }

  $('go').addEventListener('click', () => {
    sfx.tone(392, 0.08, 'triangle', 0.08); sfx.tone(587, 0.12, 'triangle', 0.08, 0, 0.07);
    if (S.mode === 'duo') duoSetup();
    else if (S.mode === 'blitz') startBlitz();
    else if (S.mode === 'daily' && S.daily[todayKey()]) {
      const d = S.daily[todayKey()];
      Curio.toast(d.won ? 'Already solved today. Have another go for fun.' : 'Already played today. This one is for practice.');
      startRound({ mode: 'daily' });
    } else startRound({ mode: S.mode });
  });
  $('how').addEventListener('click', showHow);
  $('stats-btn').addEventListener('click', showStats);
  $('hint').addEventListener('click', hint);
  $('back').addEventListener('click', toMenu);
  $('skip').addEventListener('click', () => {
    if (!over && guessed.size && mode === 'classic') { S.streak = 0; save(); Curio.toast(`It was ${word}. Streak reset.`); }
    if (mode === 'blitz') { blitz && blitz.words.push({ w: word, ok: false }); startRound({ mode: 'blitz' }); return; }
    startRound({ mode });
  });

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    if (!$('sheet').hidden) { if (e.key === 'Escape') closeSheet(); return; }
    if (e.target.closest && e.target.closest('input')) return;
    if ($('game').hidden) { if (e.key === 'Enter' && !e.target.closest('button')) { $('go').click(); e.preventDefault(); } return; }
    const k = e.key.toUpperCase();
    if (k.length === 1 && isLetter(k)) { guess(k); e.preventDefault(); }
    else if (e.key === '?') hint();
    else if (e.key === 'Enter' && over && !$('result').hidden && !e.target.closest('button')) { ($('next') || $('b-again'))?.click(); e.preventDefault(); }
    else if (e.key === 'Escape') toMenu();
  });

  buildMenu();
  if (Curio.simple) startRound({ mode: 'classic' });
  window.__hangman = { get word() { return word; }, guess, hint, get misses() { return misses; }, get over() { return over; }, get lives() { return lives; }, startRound, S, endBlitz };
})();
