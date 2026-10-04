(() => {
  const R = window.RPS;
  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SAVE = 'rpsv2';
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  const KEYS = { rock: 'R', paper: 'P', scissors: 'S', lizard: 'L', spock: 'K', well: 'W' };
  const EMO = { rock: '✊', paper: '✋', scissors: '✌️', lizard: '🦎', spock: '🖖', well: '🕳️' };
  const TONES = [
    { id: 't1', skin: '#f6d0b1', d: '#d9a581', l: '#fde5d2' },
    { id: 't2', skin: '#e8b48a', d: '#c48a5f', l: '#f5d1b3' },
    { id: 't3', skin: '#c68a5c', d: '#9c653d', l: '#dcab84' },
    { id: 't4', skin: '#8d5a3b', d: '#653e26', l: '#a97656' },
    { id: 't5', skin: '#5a3825', d: '#3c2416', l: '#7a5038' },
    { id: 't6', skin: '#ffd54f', d: '#d4a72c', l: '#ffe891' }
  ];
  const MODES = [
    { id: 'quick', e: '⚡', name: 'Quick match', sub: 'Pick a rival and a length. Spot its habit.' },
    { id: 'tour', e: '🏆', name: 'Tournament', sub: 'Eight players, three rounds, one trophy.' },
    { id: 'daily', e: '📅', name: 'Daily gauntlet', sub: 'Three seeded rivals in a row. One shot a day counts.' }
  ];
  const LENGTHS = [{ id: 3, name: 'First to 3' }, { id: 5, name: 'First to 5' }, { id: 10, name: 'First to 10' }];
  const BADGES = [
    { id: 'first', e: '🎉', t: 'First Blood', d: 'Win a match' },
    { id: 'rocky', e: '🪨', t: 'Rock Bottom', d: 'Beat Rocky' },
    { id: 'echo', e: '🔁', t: 'Echo Chamber', d: 'Beat Echo' },
    { id: 'cyclo', e: '🔄', t: 'Cycle Breaker', d: 'Beat Cyclo' },
    { id: 'sly', e: '🦊', t: 'Out-Slyed', d: 'Beat Sly' },
    { id: 'bounce', e: '🏀', t: 'Bounced Out', d: 'Beat Bounce' },
    { id: 'dice', e: '🎲', t: 'Lady Luck', d: 'Beat Dice' },
    { id: 'mind', e: '🧠', t: 'Unreadable', d: 'Beat Mindreader' },
    { id: 'mind10', e: '🕶️', t: 'Poker Face', d: 'Beat Mindreader in a first to 10' },
    { id: 'champ', e: '🏆', t: 'Champion', d: 'Win a tournament' },
    { id: 'daily', e: '📅', t: 'Gauntlet Runner', d: 'Clear the daily gauntlet' },
    { id: 'perfect', e: '💯', t: 'Flawless', d: 'Win a match without losing a round' },
    { id: 'comeback', e: '🛡️', t: 'Comeback Kid', d: 'Win after trailing by 3' },
    { id: 'streak5', e: '🔥', t: 'On Fire', d: 'Win 5 rounds in a row' },
    { id: 'spotter', e: '🔍', t: 'Pattern Spotter', d: 'Win 75% of decisive rounds vs a habit bot (5+ wins)' },
    { id: 'spock', e: '🖖', t: 'Live Long', d: 'Win a Lizard Spock match' },
    { id: 'well', e: '🕳️', t: 'Down the Well', d: 'Win a match with the Well' },
    { id: 'hundred', e: '💪', t: 'Wrist Workout', d: 'Throw 100 rounds' },
    { id: 'thousand', e: '🦾', t: 'Iron Wrist', d: 'Throw 1,000 rounds' },
    { id: 'tie5', e: '🪞', t: 'Great Minds', d: 'Tie 5 rounds in one match' }
  ];

  const DEF = { v: 2, mode: 'quick', rules: 'classic', opp: 'rocky', target: 5, tone: 't2', fast: false, rec: {}, badges: {}, throws: {}, rounds: 0, roundsWon: 0, matches: 0, tours: { played: 0, won: 0 }, daily: {}, hist: [], bestStreak: 0 };
  function load() {
    const s = Curio.store.get(SAVE, null);
    const out = JSON.parse(JSON.stringify(DEF));
    if (s && typeof s === 'object' && s.v === 2) for (const k of Object.keys(DEF)) if (s[k] != null && typeof s[k] === typeof DEF[k] && Array.isArray(s[k]) === Array.isArray(DEF[k])) out[k] = s[k];
    else { const n = Curio.store.get('rps:n', 3); if (n === 5) out.rules = 'rpsls'; out.opp = 'mind'; out.target = 10; }
    if (!R.RULES[out.rules]) out.rules = 'classic';
    if (!R.PERSONAS.some((p) => p.id === out.opp)) out.opp = 'rocky';
    if (!LENGTHS.some((l) => l.id === out.target)) out.target = 5;
    if (!MODES.some((m) => m.id === out.mode)) out.mode = 'quick';
    if (!TONES.some((t) => t.id === out.tone)) out.tone = 't2';
    return out;
  }
  const S = load();
  const save = () => Curio.store.set(SAVE, S);

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
      if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const t = ac.currentTime + delay;
      const src = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(f).connect(g).connect(ac.destination); src.start(t, Math.random() * 0.3); src.stop(t + d + 0.02);
    },
    thump(k) { this.tone(110 + k * 12, 0.12, 'sine', 0.22, 60); this.noise(0.05, 0.06, 600, 0, 0.8); window.Cafe?.sound('thock', 0.5 + k * 0.2); },
    whoosh() { this.noise(0.18, 0.08, 900, 0, 0.6); },
    clap() { this.noise(0.09, 0.22, 2400, 0, 0.9); this.noise(0.07, 0.15, 1300, 0.02, 1.2); },
    win() { [659, 880, 1175].forEach((f, k) => this.tone(f, 0.16, 'triangle', 0.12, 0, k * 0.07)); },
    lose() { this.tone(300, 0.3, 'sawtooth', 0.06, 140); },
    tie() { this.tone(420, 0.2, 'sine', 0.1, 480); this.tone(480, 0.2, 'sine', 0.06, 420, 0.1); },
    fanfare() { [523, 659, 784, 1046, 784, 1046].forEach((f, k) => this.tone(f, 0.2, 'triangle', 0.12, 0, k * 0.11)); },
    sad() { [392, 349, 311, 262].forEach((f, k) => this.tone(f, 0.26, 'sawtooth', 0.05, 0, k * 0.16)); },
    tick() { this.tone(1200, 0.02, 'square', 0.025); },
    badge() { [880, 1175, 1568].forEach((f, k) => this.tone(f, 0.14, 'sine', 0.09, 0, k * 0.07)); }
  };
  const buzz = (p) => { try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; navigator.vibrate?.(p); } catch {} };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const mixHex = (h, t, to = 0) => { const a = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); return `rgb(${a.map((v) => Math.round(v + (to - v) * t)).join(',')})`; };

  function handSVG(o, pose = 'rock', cls = '') {
    const F = [{ y: 44, h: 22, L: 84 }, { y: 66, h: 22, L: 90 }, { y: 88, h: 21, L: 82 }, { y: 109, h: 19, L: 66 }];
    let fingers = '';
    F.forEach((f, i) => {
      const oy = f.y + f.h / 2;
      const extra = i === 0 ? `<g class="extra x-lizard"><circle cx="${150 + f.L * 0.62}" cy="${f.y - 2}" r="7" fill="#fff" stroke="${o.d}" stroke-width="2"/><circle cx="${152 + f.L * 0.62}" cy="${f.y - 2}" r="3.2" fill="#1b1b1b"/><circle cx="${150 + f.L}" cy="${f.y + 5}" r="1.6" fill="${o.d}"/></g><g class="extra x-spock"><path d="M${160 + f.L} ${f.y - 14} l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" fill="#fff59d"/></g>` : '';
      fingers += `<g class="f f${i + 1}" style="transform-origin:146px ${oy}px"><rect x="132" y="${f.y}" width="${f.L + 14}" height="${f.h}" rx="${f.h / 2}" fill="${o.skin}" stroke="${o.d}" stroke-width="2"/><rect x="${133 + f.L - 6}" y="${f.y + 4}" width="12" height="${f.h - 8}" rx="4" fill="${o.l}"/><path d="M${146 + f.L * 0.45} ${f.y + 4} q-3 ${(f.h - 8) / 2} 0 ${f.h - 8}" stroke="${o.d}" stroke-width="1.6" fill="none" opacity=".55"/>${extra}</g>`;
    });
    const bolts = o.robot ? `<circle cx="72" cy="62" r="3" fill="${o.l}"/><circle cx="72" cy="114" r="3" fill="${o.l}"/><path d="M72 76 v24" stroke="${o.l}" stroke-width="3" stroke-linecap="round"/>` : `<path d="M66 62 v52" stroke="rgba(0,0,0,.12)" stroke-width="4"/>`;
    const palmShade = `<path d="M84 120 q30 14 64 -2" stroke="${o.d}" stroke-width="2" fill="none" opacity=".45"/>`;
    return `<svg class="hand ${cls}" data-pose="${pose}" viewBox="0 0 250 170" aria-hidden="true"><g class="hand-g">
      <rect x="-90" y="56" width="168" height="64" rx="18" fill="${o.sleeve}"/>
      <rect x="-90" y="56" width="168" height="18" rx="9" fill="#fff" opacity=".12"/>
      ${fingers}
      <rect x="62" y="50" width="22" height="76" rx="10" fill="${o.cuff}"/>${bolts}
      <rect x="74" y="40" width="84" height="92" rx="32" fill="${o.skin}" stroke="${o.d}" stroke-width="2"/>
      <path d="M90 50 q24 -8 54 0" stroke="${o.l}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".7"/>${palmShade}
      <g class="extra x-well"><ellipse cx="168" cy="60" rx="21" ry="18" fill="rgba(20,20,40,.6)" stroke="${o.d}" stroke-width="4"/><ellipse cx="168" cy="56" rx="13" ry="7" fill="rgba(120,180,255,.4)"/></g>
      <g class="thumb" style="transform-origin:96px 40px"><rect x="86" y="26" width="72" height="26" rx="13" fill="${o.skin}" stroke="${o.d}" stroke-width="2"/><rect x="139" y="31" width="14" height="16" rx="5" fill="${o.l}"/><path d="M118 30 q-3 9 0 18" stroke="${o.d}" stroke-width="1.6" fill="none" opacity=".55"/></g>
    </g></svg>`;
  }

  const youLook = () => { const t = TONES.find((x) => x.id === S.tone) || TONES[1]; return { skin: t.skin, d: t.d, l: t.l, sleeve: '#ff5a36', cuff: '#fff4ec' }; };
  const botLook = (p) => ({ skin: p.glove, d: mixHex(p.glove, 0.35), l: mixHex(p.glove, 0.45, 255), sleeve: '#37474f', cuff: mixHex(p.glove, 0.2), robot: true });

  function botFace(p) {
    const b = p.face, dk = mixHex(p.glove, 0.4);
    const eyes = {
      dot: `<circle cx="17" cy="24" r="4.5" fill="#1b1530"/><circle cx="31" cy="24" r="4.5" fill="#1b1530"/><circle cx="18.5" cy="22.5" r="1.4" fill="#fff"/><circle cx="32.5" cy="22.5" r="1.4" fill="#fff"/>`,
      ring: `<circle cx="17" cy="24" r="6" fill="#fff" stroke="#1b1530" stroke-width="2"/><circle cx="31" cy="24" r="6" fill="#fff" stroke="#1b1530" stroke-width="2"/><circle cx="18" cy="25" r="2.6" fill="#1b1530"/><circle cx="32" cy="25" r="2.6" fill="#1b1530"/>`,
      slit: `<path d="M11 24 q6 -5 12 0 q-6 3 -12 0z M25 24 q6 -5 12 0 q-6 3 -12 0z" fill="#1b1530"/><circle cx="17" cy="23.5" r="1.6" fill="#ffeb3b"/><circle cx="31" cy="23.5" r="1.6" fill="#ffeb3b"/>`,
      pip: `<rect x="11" y="18" width="12" height="12" rx="3" fill="#fff" stroke="#1b1530" stroke-width="1.5"/><rect x="25" y="18" width="12" height="12" rx="3" fill="#fff" stroke="#1b1530" stroke-width="1.5"/><circle cx="17" cy="24" r="2" fill="#1b1530"/><circle cx="28.5" cy="21.5" r="1.5" fill="#1b1530"/><circle cx="33.5" cy="26.5" r="1.5" fill="#1b1530"/>`,
      visor: `<rect x="9" y="18" width="30" height="11" rx="5.5" fill="#102027"/><rect x="12" y="21" width="9" height="5" rx="2.5" fill="#64ffda"><animate attributeName="x" values="12;27;12" dur="2.4s" repeatCount="indefinite"/></rect>`
    }[p.eye];
    const top = p.id === 'rocky' ? `<path d="M8 14 l6 -8 l8 5 l6 -7 l7 6 l6 -3 l1 9z" fill="${dk}"/>` : p.id === 'mind' ? `<path d="M10 14 q14 -14 28 0" fill="none" stroke="${dk}" stroke-width="3"/><circle cx="24" cy="5" r="3" fill="#64ffda"/>` : p.id === 'dice' ? `<rect x="19" y="2" width="10" height="8" rx="2" fill="#fff" stroke="${dk}"/><circle cx="24" cy="6" r="1.4" fill="${dk}"/>` : `<path d="M24 11 V4" stroke="${dk}" stroke-width="2"/><circle cx="24" cy="4" r="2.6" fill="${p.glove}"/>`;
    const mouth = p.id === 'sly' ? `<path d="M17 36 q8 4 15 -2" stroke="#1b1530" stroke-width="2.2" fill="none" stroke-linecap="round"/>` : p.id === 'bounce' ? `<path d="M16 34 q8 8 16 0z" fill="#1b1530"/>` : p.id === 'echo' ? `<ellipse cx="24" cy="36" rx="4" ry="3" fill="#1b1530"/>` : `<path d="M17 36 H31" stroke="#1b1530" stroke-width="2.4" stroke-linecap="round"/>`;
    return `<svg viewBox="0 0 48 48" aria-hidden="true">${top}<rect x="6" y="10" width="36" height="34" rx="12" fill="${b}" stroke="${dk}" stroke-width="2"/><rect x="2" y="22" width="5" height="10" rx="2" fill="${dk}"/><rect x="41" y="22" width="5" height="10" rx="2" fill="${dk}"/>${eyes}${mouth}</svg>`;
  }
  function youFace() {
    const t = TONES.find((x) => x.id === S.tone) || TONES[1];
    return `<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="25" r="20" fill="${t.skin}" stroke="${t.d}" stroke-width="2"/><path d="M8 18 q16 -18 32 0 q-6 -6 -16 -6 q-10 0 -16 6z" fill="#4e342e"/><circle cx="17" cy="25" r="2.6" fill="#2a2018"/><circle cx="31" cy="25" r="2.6" fill="#2a2018"/><path d="M17 33 q7 6 14 0" stroke="#2a2018" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="12" cy="31" r="3" fill="#ff8a80" opacity=".45"/><circle cx="36" cy="31" r="3" fill="#ff8a80" opacity=".45"/></svg>`;
  }
  const persona = (id) => R.PERSONAS.find((p) => p.id === id) || R.PERSONAS[0];

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(seed) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function dailyPlan() {
    const r = seeded(`rps-${todayKey()}`);
    const pool = R.PERSONAS.map((p) => p.id).filter((id) => id !== 'mind');
    const picks = [];
    while (picks.length < 2) { const p = pool[Math.floor(r() * pool.length)]; if (!picks.includes(p)) picks.push(p); }
    picks.push('mind');
    const rules = ['classic', 'classic', 'well', 'rpsls'][Math.floor(r() * 4)];
    return { opps: picks, rules };
  }

  let rules, player, history, score, streak, bestStreakMatch, busy = false, matchOpp, matchTarget, matchMode, worstDeficit, ties, token = 0, tour = null, dailyRun = null;

  function radio(container, items, current, render, onPick, cls) {
    container.replaceChildren();
    items.forEach((it) => {
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.className = cls || '';
      b.setAttribute('aria-checked', String(it.id === current));
      b.innerHTML = render(it);
      b.addEventListener('click', () => { onPick(it); sfx.tick(); });
      container.append(b);
    });
  }

  function miniHand(look, pose) { return handSVG(look, pose, 'minihand').replace('viewBox="0 0 250 170"', 'viewBox="70 0 190 160"'); }

  function buildHero() {
    const h = $('hero');
    const stars = Array.from({ length: 22 }, () => `<i class="star" style="left:${Math.random() * 100}%;top:${Math.random() * 60}%;animation-delay:${(Math.random() * 2).toFixed(2)}s"></i>`).join('');
    const p = persona(S.opp);
    h.innerHTML = `${stars}<div class="hand-wrap">${handSVG(youLook(), 'rock')}</div><div class="hvs">VS</div><div class="hand-wrap mirror">${handSVG(botLook(p), 'rock')}</div>`;
    const poses = R.RULES[S.rules].moves;
    clearInterval(buildHero.t);
    let k = 0;
    buildHero.t = setInterval(() => {
      if (document.hidden || $('menu').hidden) return;
      const hs = h.querySelectorAll('.hand');
      if (!hs.length) return;
      k++;
      hs[0].dataset.pose = k % 3 === 0 ? poses[(k / 3) % poses.length] : 'rock';
      hs[1].dataset.pose = k % 3 === 0 ? poses[(k / 3 + 1) % poses.length] : 'rock';
    }, 700);
  }

  function buildMenu() {
    app.classList.remove('playing');
    radio($('modes'), MODES, S.mode, (m) => {
      let sub = m.sub;
      if (m.id === 'daily') { const d = S.daily[todayKey()]; if (d != null) sub = d >= 3 ? '<span class="done">Cleared today! Come back tomorrow.</span>' : `Best today: ${d} of 3 rivals beaten.`; }
      if (m.id === 'tour' && S.tours.won) sub += ` Trophies: ${S.tours.won}.`;
      return `<span class="e">${m.e}</span><b>${m.name}</b><small>${sub}</small>`;
    }, (m) => { S.mode = m.id; save(); buildMenu(); }, 'mode');
    radio($('opps'), R.PERSONAS, S.opp, (p) => {
      const r = S.rec[p.id];
      return `<span class="ava">${botFace(p)}</span><span class="t"><b>${p.name}</b><small>${p.tag}</small></span><span class="rec">${r ? `${r.w}-${r.l}` : ''}</span>`;
    }, (p) => { S.opp = p.id; save(); buildMenu(); }, 'opt');
    $('opps').classList.toggle('locked', S.mode !== 'quick');
    const look = youLook();
    radio($('rules'), Object.values(R.RULES), S.rules, (r) => `<span class="t"><b>${r.name}</b><small>${r.moves.map(cap).join(', ')}</small></span><span class="icons">${r.moves.map((m) => miniHand(look, m)).join('')}</span>`, (r) => { S.rules = r.id; save(); buildMenu(); }, 'opt');
    $('rules').parentElement.querySelectorAll('h2.mt')[0].hidden = S.mode !== 'quick';
    $('lengths').hidden = S.mode !== 'quick';
    radio($('lengths'), LENGTHS, S.target, (l) => l.name, (l) => { S.target = l.id; save(); buildMenu(); });
    radio($('tones'), TONES, S.tone, (t) => '', (t) => { S.tone = t.id; save(); buildMenu(); });
    [...$('tones').children].forEach((b, i) => { b.style.background = TONES[i].skin; b.setAttribute('aria-label', `Skin tone ${i + 1}`); });
    $('rules').classList.toggle('locked', S.mode === 'daily');
    $('opt-fast').checked = S.fast;
    $('go').textContent = S.mode === 'tour' ? 'Enter the tournament' : S.mode === 'daily' ? 'Run the gauntlet' : 'Let’s throw';
    $('badge-count').textContent = `${Object.keys(S.badges).filter((k) => BADGES.some((b) => b.id === k)).length}/${BADGES.length}`;
    buildHero();
  }

  function show(which) {
    for (const id of ['menu', 'game', 'bracket-view']) $(id).hidden = id !== which;
    app.classList.toggle('playing', which !== 'menu');
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function startMatch(oppId, rulesId, target, mode) {
    token++;
    rules = R.makeRules(rulesId);
    matchOpp = oppId; matchTarget = target; matchMode = mode;
    player = R.createPlayer(oppId, rules);
    history = []; score = { you: 0, ai: 0, tie: 0 }; streak = 0; bestStreakMatch = 0; worstDeficit = 0; ties = 0; busy = false;
    show('game');
    const p = persona(oppId);
    $('ava-you').innerHTML = youFace();
    $('ava-ai').innerHTML = botFace(p);
    $('ai-name').textContent = p.name;
    $('mode-tag').textContent = mode === 'tour' ? `Tournament · ${tour.roundName}` : mode === 'daily' ? `Daily · rival ${dailyRun.idx + 1} of 3` : `${rules.name} · first to ${target}`;
    $('you-hand').innerHTML = handSVG(youLook(), 'rock');
    $('ai-hand').innerHTML = handSVG(botLook(p), 'rock');
    $('ai-hand').classList.add('mirror');
    $('you-side').className = 'side you-side'; $('ai-side').className = 'side ai-side';
    $('arena').className = 'arena';
    $('call').textContent = 'VS'; $('call').className = 'call';
    $('verdict').innerHTML = `Pick your throw.<small>${p.name}: “${p.blurb}”</small>`;
    const picks = $('picks'); picks.replaceChildren();
    rules.moves.forEach((m, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'pick-btn';
      b.setAttribute('aria-label', `${cap(m)} (key ${KEYS[m]} or ${i + 1})`);
      b.innerHTML = `<span class="mini">${miniHand(youLook(), m)}</span><span>${cap(m)}</span><span class="k"><span class="c-kbd">${KEYS[m]}</span></span>`;
      b.addEventListener('click', () => play(i));
      picks.append(b);
    });
    $('strip').replaceChildren();
    $('brain-panel').hidden = false;
    $('brain-title').textContent = oppId === 'mind' ? 'What Mindreader predicted' : `Case file: ${p.name}`;
    $('keys').innerHTML = `Keys: ${rules.moves.map((m) => `<span class="c-kbd">${KEYS[m]}</span> ${m}`).join(', ')}. <span class="c-kbd">Esc</span> menu.`;
    paint();
    paintBrain(null);
    paintMine();
    sfx.tone(392, 0.08, 'triangle', 0.08); sfx.tone(587, 0.12, 'triangle', 0.08, 0, 0.07);
  }

  function pips(el, n, on) {
    el.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < on ? 'on' : ''}"></i>`).join('');
  }
  function paint() {
    $('sc-you').textContent = score.you; $('sc-ai').textContent = score.ai;
    pips($('pips-you'), matchTarget, score.you); pips($('pips-ai'), matchTarget, score.ai);
    $('round-tag').textContent = `Round ${history.length + 1}${score.tie ? ` · ${score.tie} tie${score.tie === 1 ? '' : 's'}` : ''}`;
  }

  function paintBars(el, dist, mark) {
    el.replaceChildren();
    const top = dist ? dist.indexOf(Math.max(...dist)) : -1;
    rules.moves.forEach((m, i) => {
      const row = document.createElement('div');
      row.className = `bar${i === top ? ' top' : ''}`;
      row.innerHTML = `<span>${EMO[m]} ${cap(m)}</span><span class="track"><span class="fill"></span></span><span class="pct">${dist ? `${Math.round(dist[i] * 100)}%` : '-'}${i === mark ? ' ←' : ''}</span>`;
      el.append(row);
      requestAnimationFrame(() => { row.querySelector('.fill').style.width = dist ? `${dist[i] * 100}%` : '0%'; });
    });
  }

  function paintBrain(choice, you) {
    const note = $('brain-note');
    const p = persona(matchOpp);
    if (matchOpp === 'mind') {
      paintBars($('bars'), choice && history.length > 2 ? choice.dist : null, you);
      if (!choice || history.length <= 2) note.textContent = 'Still gathering data. Guessing randomly for now.';
      else {
        const pct = Math.round(choice.confidence * 100);
        note.innerHTML = `It was <b>${pct}%</b> sure you would throw ${EMO[rules.moves[choice.guess]]} ${choice.guess === you ? 'and it was right.' : 'and it was wrong. Nice dodge.'} Sharpest trick right now: <b>${choice.model.name}</b>.`;
      }
      return;
    }
    const counts = Array(rules.n).fill(0);
    history.forEach((h) => counts[h.ai]++);
    const tot = history.length;
    paintBars($('bars'), tot ? counts.map((c) => c / tot) : null, -1);
    const clues = ['Watch what it throws right after you do something.', 'Every bot here has one habit. Most of them are simple.', 'Try throwing the same thing three times and see how it reacts.', 'Look at the strip of rounds below for patterns.'];
    note.textContent = tot < 4 ? `${p.name}'s throws so far. ${Curio.pick(clues)}` : `${p.name}'s throws so far. ${tot >= 8 && score.you > score.ai * 1.5 ? 'You seem to have it figured out.' : Curio.pick(clues)}`;
  }

  function paintMine() {
    const counts = Array(rules.n).fill(0);
    history.forEach((h) => counts[h.you]++);
    const tot = history.length;
    paintBars($('mine'), tot ? counts.map((c) => c / tot) : null, -1);
    let ent = 0;
    counts.forEach((c) => { if (c) { const q = c / tot; ent -= q * Math.log(q); } });
    const maxE = Math.log(rules.n);
    const randomness = tot ? Math.round((ent / maxE) * 100) : 0;
    let rep = 0;
    for (let i = 1; i < history.length; i++) if (history[i].you === history[i - 1].you) rep++;
    $('mine-note').innerHTML = tot < 3 ? 'Throw a few and your tendencies will show up here.' : `Spread score <b>${randomness}%</b>. You repeated your last throw ${rep} time${rep === 1 ? '' : 's'}. ${randomness < 70 ? 'You have a favourite. Bots notice that.' : 'Nicely mixed up.'}`;
  }

  async function play(you) {
    if (busy) return;
    busy = true;
    const t0 = token;
    const btns = [...document.querySelectorAll('.pick-btn')];
    btns.forEach((b, i) => { b.disabled = true; b.classList.toggle('chosen', i === you); });
    const choice = player.choose(history);
    const ai = choice.move;
    const yw = $('you-hand'), aw = $('ai-hand'), call = $('call'), arena = $('arena');
    const yh = yw.querySelector('.hand'), ah = aw.querySelector('.hand');
    $('you-side').className = 'side you-side'; $('ai-side').className = 'side ai-side'; arena.className = 'arena';
    yh.dataset.pose = 'rock'; ah.dataset.pose = 'rock';
    yw.classList.remove('reveal'); aw.classList.remove('reveal');
    const fast = S.fast || reduce;
    const words = ['Rock', 'Paper', 'Scissors'];
    if (!fast) {
      yw.style.setProperty('--pump', '.32s'); aw.style.setProperty('--pump', '.32s');
      void yw.offsetWidth;
      yw.classList.add('pump'); aw.classList.add('pump');
      sfx.whoosh();
      for (let k = 0; k < 3; k++) {
        call.textContent = `${words[k]}...`; call.className = 'call pop';
        setTimeout(() => sfx.thump(k), 140);
        await sleep(320);
        if (t0 !== token) return;
      }
      yw.classList.remove('pump'); aw.classList.remove('pump');
    } else await sleep(60);
    if (t0 !== token) return;
    call.textContent = 'Shoot!'; call.className = 'call shoot pop';
    void yw.offsetWidth;
    yh.dataset.pose = rules.moves[you]; ah.dataset.pose = rules.moves[ai];
    yw.classList.add('reveal'); aw.classList.add('reveal');
    sfx.clap(); buzz(15);

    const r = rules.outcome(you, ai);
    player.learn(history, you);
    history.push({ you, ai, result: r });
    S.rounds++; S.throws[rules.moves[you]] = (S.throws[rules.moves[you]] || 0) + 1;
    const Y = cap(rules.moves[you]), A = cap(rules.moves[ai]);
    const strip = document.createElement('span');
    strip.textContent = EMO[rules.moves[you]];
    strip.title = `You ${rules.moves[you]}, ${persona(matchOpp).name} ${rules.moves[ai]}`;
    await sleep(fast ? 80 : 160);
    if (t0 !== token) return;
    if (r > 0) {
      score.you++; streak++; S.roundsWon++;
      bestStreakMatch = Math.max(bestStreakMatch, streak);
      S.bestStreak = Math.max(S.bestStreak, streak);
      $('you-side').classList.add('won'); $('ai-side').classList.add('lost'); arena.classList.add('win-you');
      $('verdict').innerHTML = `<span class="w">${Curio.pick(['You win the round!', 'Point to you!', 'Got it!', 'Nailed it!'])}</span>${streak >= 3 ? `<span class="combo">${streak} in a row</span>` : ''}<small>${Y} ${rules.verb(you, ai)} ${A.toLowerCase()}.</small>`;
      sfx.win(); burst('left'); strip.className = 'w';
      bump('sc-you');
    } else if (r < 0) {
      score.ai++; streak = 0;
      $('ai-side').classList.add('won'); $('you-side').classList.add('lost'); arena.classList.add('win-ai');
      $('verdict').innerHTML = `<span class="l">${Curio.pick([`${persona(matchOpp).name} takes it.`, 'Point to the bot.', 'Ouch.', 'Read like a book.'])}</span><small>${A} ${rules.verb(ai, you)} ${Y.toLowerCase()}.</small>`;
      sfx.lose(); burst('right'); strip.className = 'l'; buzz([20, 40, 20]);
      bump('sc-ai');
    } else {
      score.tie++; ties++;
      $('you-side').classList.add('tie'); $('ai-side').classList.add('tie');
      $('verdict').innerHTML = `<span class="t">${Curio.pick(['Tie!', 'Great minds.', 'Jinx!', 'Mirror match.'])}</span><small>You both threw ${Y.toLowerCase()}.</small>`;
      sfx.tie(); strip.className = 't';
    }
    worstDeficit = Math.max(worstDeficit, score.ai - score.you);
    $('strip').append(strip);
    while ($('strip').children.length > 24) $('strip').firstChild.remove();
    paint(); paintBrain(choice, you); paintMine();
    if (score.you >= matchTarget || score.ai >= matchTarget) { save(); await sleep(900); if (t0 === token) endMatch(); return; }
    await sleep(fast ? 120 : 380);
    if (t0 !== token) return;
    busy = false;
    btns.forEach((b) => { b.disabled = false; b.classList.remove('chosen'); });
  }

  function bump(id) { const el = $(id); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }

  function burst(side) {
    if (reduce) return;
    const c = $('burst'), arena = $('arena');
    const w = arena.clientWidth, h = arena.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    c.width = w * dpr; c.height = h * dpr;
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ox = side === 'left' ? w * 0.27 : w * 0.73, oy = h * 0.5;
    const cols = side === 'left' ? ['#ffd54f', '#ff8a65', '#fff59d', '#ffffff'] : ['#80deea', '#b39ddb', '#ffffff', '#90caf9'];
    const parts = Array.from({ length: 34 }, () => { const a = Math.random() * Math.PI * 2, s = 2 + Math.random() * 6; return { x: ox, y: oy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, r: 2 + Math.random() * 4, c: Curio.pick(cols), life: 1 }; });
    let f = 0;
    const tick = () => {
      g.clearRect(0, 0, w, h);
      g.globalAlpha = Math.max(0, 0.5 - f / 40);
      g.fillStyle = cols[0];
      g.beginPath(); g.arc(ox, oy, 30 + f * 4, 0, Math.PI * 2); g.fill();
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.022;
        g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c;
        g.save(); g.translate(p.x, p.y); g.rotate(f * 0.1);
        g.beginPath(); for (let k = 0; k < 8; k++) { const rr = k % 2 ? p.r * 0.45 : p.r * 1.4; g.lineTo(Math.cos((k * Math.PI) / 4) * rr, Math.sin((k * Math.PI) / 4) * rr); } g.closePath(); g.fill();
        g.restore();
      }
      if (++f < 50 && !document.hidden) requestAnimationFrame(tick); else g.clearRect(0, 0, w, h);
    };
    requestAnimationFrame(tick);
  }

  function award(ctx) {
    const got = [];
    const give = (id) => { if (!S.badges[id]) { S.badges[id] = Date.now(); const b = BADGES.find((x) => x.id === id); if (b) got.push(b); } };
    if (ctx.won) {
      give('first'); give(matchOpp);
      if (matchOpp === 'mind' && matchTarget >= 10) give('mind10');
      if (score.ai === 0) give('perfect');
      if (worstDeficit >= 3) give('comeback');
      if (rules.id === 'rpsls') give('spock');
      if (rules.id === 'well') give('well');
      const dec = score.you + score.ai;
      if (['rocky', 'echo', 'cyclo', 'sly', 'bounce'].includes(matchOpp) && score.you >= 5 && score.you / dec >= 0.75) give('spotter');
    }
    if (bestStreakMatch >= 5) give('streak5');
    if (ties >= 5) give('tie5');
    if (S.rounds >= 100) give('hundred');
    if (S.rounds >= 1000) give('thousand');
    if (ctx.champ) give('champ');
    if (ctx.daily) give('daily');
    return got;
  }

  function shareText() {
    const p = persona(matchOpp);
    const won = score.you > score.ai;
    const seq = history.map((h) => (h.result > 0 ? '🟩' : h.result < 0 ? '🟥' : '🟨')).join('');
    return `Rock Paper Scissors on Zoble\n${won ? 'Beat' : 'Lost to'} ${p.name} ${score.you}-${score.ai} (${rules.name})\n${seq}\nMy throws: ${history.map((h) => EMO[rules.moves[h.you]]).join('')}`;
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); Curio.toast('Copied. Go brag.'); }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); Curio.toast('Copied. Go brag.'); } catch { Curio.toast('Could not copy, sorry.'); }
      ta.remove();
    }
  }

  async function endMatch() {
    const won = score.you > score.ai;
    const p = persona(matchOpp);
    S.matches++;
    const rec = (S.rec[matchOpp] ||= { w: 0, l: 0 });
    if (won) rec.w++; else rec.l++;
    S.hist.unshift({ t: Date.now(), o: matchOpp, r: rules.id, y: score.you, a: score.ai, m: matchMode });
    S.hist = S.hist.slice(0, 15);
    let fresh = [];
    if (matchMode === 'quick') fresh = award({ won });
    if (won) { Curio.confetti(); sfx.fanfare(); buzz([30, 40, 60]); } else { sfx.sad(); buzz(90); }
    save();
    if (matchMode === 'tour') { fresh = award({ won }); save(); tourAfterMatch(won, fresh); return; }
    if (matchMode === 'daily') { fresh = award({ won }); save(); dailyAfterMatch(won, fresh); return; }
    const decisive = score.you + score.ai;
    const body = `<div class="result-card">
      <div class="ribbon">${won ? '🏆' : `<span class="rface">${botFace(p)}</span>`}</div>
      <h3>${won ? Curio.pick([`You beat ${p.name}!`, `${p.name} has been out-thrown`, 'Victory, by hand']) : Curio.pick([`${p.name} wins the match`, 'Read like a book', 'The bot takes it'])}</h3>
      <p class="c-muted">${score.you} to ${score.ai} in ${history.length} rounds.</p>
      ${fresh.length ? `<div class="newb">${fresh.map((b) => `<span>${b.e} ${b.t}</span>`).join('')}</div>` : ''}
      <div class="rstats"><div><b>${decisive ? Math.round((score.you / decisive) * 100) : 0}%</b><span>Rounds won</span></div><div><b>${bestStreakMatch}</b><span>Best streak</span></div><div><b>${rec.w}-${rec.l}</b><span>vs ${p.name}</span></div></div>
      <div class="tell"><span class="ava">${botFace(p)}</span><span><b>${p.name}'s secret:</b> ${p.tell}</span></div>
      <div class="c-row"><button type="button" class="c-btn" data-a="again">Rematch</button><button type="button" class="c-btn c-btn--ghost" data-a="share">Share</button><button type="button" class="c-btn c-btn--ghost" data-a="menu">Menu</button></div>
    </div>`;
    if (fresh.length) setTimeout(() => sfx.badge(), 600);
    openSheet(won ? 'Match won' : 'Match lost', body, (a) => {
      if (a === 'again') { closeSheet(); startMatch(matchOpp, rules.id, matchTarget, 'quick'); }
      else if (a === 'share') copy(shareText());
      else if (a === 'menu') { closeSheet(); toMenu(); }
    });
  }

  function newTour() {
    const bots = Curio.shuffle(R.PERSONAS.map((p) => p.id));
    const mi = bots.indexOf('mind');
    if (mi < 4) { const swap = 4 + Math.floor(Math.random() * 3); [bots[mi], bots[swap]] = [bots[swap], bots[mi]]; }
    const slots = ['you', ...bots.slice(0, 3), ...bots.slice(3)];
    tour = { rounds: [slots], scores: [[]], stage: 0, alive: true, rules: S.rules, roundName: 'Quarter-final', champion: null };
    S.tours.played++; save();
  }
  const ROUND_NAMES = ['Quarter-final', 'Semi-final', 'Final'];
  const ROUND_TARGET = [3, 3, 4];

  function simulateStage() {
    const st = tour.stage, list = tour.rounds[st];
    const rr = R.makeRules(tour.rules);
    tour.scores[st] = tour.scores[st] || [];
    for (let i = 0; i < list.length; i += 2) {
      if (list[i] === 'you' || list[i + 1] === 'you' || tour.scores[st][i / 2]) continue;
      const res = R.simulateBots(list[i], list[i + 1], rr, ROUND_TARGET[st]);
      tour.scores[st][i / 2] = { w: res.winner, s: res.score };
    }
  }

  function advance() {
    const st = tour.stage, list = tour.rounds[st];
    const next = [];
    for (let i = 0; i < list.length; i += 2) next.push(tour.scores[st][i / 2].w);
    tour.rounds[st + 1] = next;
    tour.scores[st + 1] = [];
    tour.stage++;
    if (next.length === 1) tour.champion = next[0];
  }

  function nameOf(id) { return id === 'you' ? 'You' : persona(id).name; }
  function faceOf(id) { return id === 'you' ? youFace() : botFace(persona(id)); }

  function renderBracket() {
    const el = $('bracket'); el.replaceChildren();
    const titles = ['Quarter-finals', 'Semi-finals', 'Final', 'Champion'];
    for (let c = 0; c < 4; c++) {
      const col = document.createElement('div'); col.className = 'bcol';
      col.innerHTML = `<h3>${titles[c]}</h3>`;
      const list = tour.rounds[c] || [];
      const size = [8, 4, 2, 1][c];
      for (let i = 0; i < size; i++) {
        const id = list[i];
        const slot = document.createElement('div');
        slot.style.animationDelay = `${(c * 3 + i) * 0.02}s`;
        if (!id) { slot.className = 'bslot empty'; slot.textContent = '?'; col.append(slot); continue; }
        const sc = tour.scores[c] && tour.scores[c][Math.floor(i / 2)];
        const lost = sc && sc.w !== id;
        const scoreTxt = sc ? sc.s[i % 2] : '';
        slot.className = `bslot${id === 'you' ? ' me' : ''}${lost ? ' out' : ''}${c === 3 ? ' champ' : ''}`;
        slot.innerHTML = `<span class="ava">${faceOf(id)}</span><span class="nm">${c === 3 ? '🏆 ' : ''}${nameOf(id)}</span><span class="sc">${scoreTxt}</span>`;
        col.append(slot);
      }
      el.append(col);
    }
  }

  function showBracket(title, sub, buttons) {
    show('bracket-view');
    $('bv-title').textContent = title;
    $('bv-sub').textContent = sub;
    renderBracket();
    const acts = $('bv-actions'); acts.replaceChildren();
    buttons.forEach(([label, fn], i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = i === 0 ? 'c-btn' : 'c-btn c-btn--ghost'; b.textContent = label;
      b.addEventListener('click', fn);
      acts.append(b);
    });
    setTimeout(() => acts.querySelector('button')?.focus({ preventScroll: true }), 50);
  }

  function tourNext() {
    simulateStage();
    const list = tour.rounds[tour.stage];
    const idx = list.indexOf('you');
    const opp = list[idx % 2 === 0 ? idx + 1 : idx - 1];
    tour.roundName = ROUND_NAMES[tour.stage];
    showBracket(`${ROUND_NAMES[tour.stage]}`, `Next up: ${persona(opp).name}, ${persona(opp).tag.toLowerCase()}. First to ${ROUND_TARGET[tour.stage]}. ${tour.stage === 0 ? 'The other matches are being played as we speak.' : ''}`, [
      [`Fight ${persona(opp).name}`, () => startMatch(opp, tour.rules, ROUND_TARGET[tour.stage], 'tour')],
      ['Forfeit', () => { tour = null; toMenu(); }]
    ]);
  }

  function tourAfterMatch(won, fresh) {
    const st = tour.stage, list = tour.rounds[st];
    const idx = list.indexOf('you');
    const opp = list[idx % 2 === 0 ? idx + 1 : idx - 1];
    tour.scores[st][Math.floor(idx / 2)] = { w: won ? 'you' : opp, s: idx % 2 ? [score.ai, score.you] : [score.you, score.ai] };
    if (won) {
      advance();
      if (tour.champion === 'you') {
        S.tours.won++;
        const got = award({ won: true, champ: true });
        save();
        Curio.confetti(220); sfx.fanfare();
        showBracket('Champion!', `You won the whole thing. ${got.concat(fresh).map((b) => `${b.e} ${b.t}`).join(' · ')}`, [['Another tournament', () => { newTour(); tourNext(); }], ['Share', () => copy(`Rock Paper Scissors on Zoble\n🏆 Won a tournament, beating ${tour.rounds[2].filter((x) => x !== 'you').map(nameOf).join(', ')} in the final`)], ['Menu', toMenu]]);
        return;
      }
      showBracket('Through!', `You beat ${persona(opp).name} ${score.you}-${score.ai}.${fresh.length ? ` New: ${fresh.map((b) => `${b.e} ${b.t}`).join(', ')}.` : ''}`, [['Continue', tourNext], ['Menu', toMenu]]);
    } else {
      while (!tour.champion) { simulateStage(); advance(); }
      showBracket('Knocked out', `${persona(opp).name} won ${score.ai}-${score.you}. ${nameOf(tour.champion)} went on to lift the trophy. ${persona(opp).tell}`, [['Try again', () => { newTour(); tourNext(); }], ['Menu', toMenu]]);
    }
  }

  function dailyStart() {
    const plan = dailyPlan();
    dailyRun = { ...plan, idx: 0 };
    dailyIntro();
  }
  function dailyIntro() {
    const opp = dailyRun.opps[dailyRun.idx];
    const p = persona(opp);
    tour = null;
    show('bracket-view');
    $('bv-title').textContent = `Daily gauntlet · ${todayKey()}`;
    $('bv-sub').textContent = `Rules today: ${R.RULES[dailyRun.rules].name}. Rival ${dailyRun.idx + 1} of 3 is ${p.name}. First to 3, and one loss ends the run.`;
    const el = $('bracket'); el.replaceChildren();
    dailyRun.opps.forEach((id, i) => {
      const col = document.createElement('div'); col.className = 'bcol';
      col.innerHTML = `<h3>Rival ${i + 1}</h3><div class="bslot${i < dailyRun.idx ? ' out' : i === dailyRun.idx ? ' me' : ''}"><span class="ava">${botFace(persona(id))}</span><span class="nm">${i < dailyRun.idx ? '✓ ' : ''}${persona(id).name}</span></div>`;
      el.append(col);
    });
    const col = document.createElement('div'); col.className = 'bcol';
    col.innerHTML = `<h3>Prize</h3><div class="bslot champ"><span class="nm">📅 Gauntlet badge</span></div>`;
    el.append(col);
    const acts = $('bv-actions'); acts.replaceChildren();
    const b = document.createElement('button'); b.type = 'button'; b.className = 'c-btn'; b.textContent = `Fight ${p.name}`;
    b.addEventListener('click', () => startMatch(opp, dailyRun.rules, 3, 'daily'));
    const m = document.createElement('button'); m.type = 'button'; m.className = 'c-btn c-btn--ghost'; m.textContent = 'Menu';
    m.addEventListener('click', toMenu);
    acts.append(b, m);
  }
  function dailyAfterMatch(won, fresh) {
    const k = todayKey();
    if (won) dailyRun.idx++;
    S.daily[k] = Math.max(S.daily[k] || 0, dailyRun.idx);
    let got = fresh;
    if (dailyRun.idx >= 3) { got = got.concat(award({ won: true, daily: true })); }
    save();
    if (won && dailyRun.idx < 3) { Curio.toast(`${persona(matchOpp).name} down. ${3 - dailyRun.idx} to go.`); dailyIntro(); return; }
    const cleared = dailyRun.idx >= 3;
    const body = `<div class="result-card"><div class="ribbon">${cleared ? '📅' : '💥'}</div><h3>${cleared ? 'Gauntlet cleared!' : `Stopped by ${persona(matchOpp).name}`}</h3><p class="c-muted">You beat ${dailyRun.idx} of 3 rivals today.</p>${got.length ? `<div class="newb">${got.map((b) => `<span>${b.e} ${b.t}</span>`).join('')}</div>` : ''}<div class="tell"><span class="ava">${botFace(persona(matchOpp))}</span><span><b>${persona(matchOpp).name}'s secret:</b> ${persona(matchOpp).tell}</span></div><div class="c-row"><button type="button" class="c-btn" data-a="retry">Run it again</button><button type="button" class="c-btn c-btn--ghost" data-a="share">Share</button><button type="button" class="c-btn c-btn--ghost" data-a="menu">Menu</button></div></div>`;
    if (cleared) { Curio.confetti(200); }
    openSheet('Daily gauntlet', body, (a) => {
      if (a === 'retry') { closeSheet(); dailyStart(); }
      else if (a === 'share') copy(`Rock Paper Scissors on Zoble · Daily ${k}\n${'🟩'.repeat(dailyRun.idx)}${'⬜'.repeat(3 - dailyRun.idx)} ${dailyRun.idx}/3 rivals beaten`);
      else { closeSheet(); toMenu(); }
    });
  }

  let sheetHandler = null;
  function openSheet(title, html, onAction) {
    $('sheet-title').textContent = title;
    $('sheet-body').innerHTML = html;
    sheetHandler = onAction || null;
    $('sheet').hidden = false;
    ($('sheet-body').querySelector('.c-btn') || $('sheet-x')).focus({ preventScroll: true });
  }
  function closeSheet() { $('sheet').hidden = true; sheetHandler = null; }
  $('sheet-body').addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b && sheetHandler) sheetHandler(b.dataset.a); });
  $('sheet-x').addEventListener('click', () => { const h = sheetHandler; closeSheet(); if (h && !$('game').hidden && score && (score.you >= matchTarget || score.ai >= matchTarget)) toMenu(); });
  $('sheet').addEventListener('click', (e) => { if (e.target === $('sheet')) $('sheet-x').click(); });

  function toMenu() { if (Curio.simple) { closeSheet(); startMatch('mind', 'classic', 5, 'quick'); return; } token++; busy = false; closeSheet(); show('menu'); buildMenu(); }

  function showStats() {
    const tw = Object.values(S.throws).reduce((a, b) => a + b, 0);
    let html = `<div class="sgrid"><div><b>${S.matches}</b><span>Matches</span></div><div><b>${S.rounds}</b><span>Rounds</span></div><div><b>${S.rounds ? Math.round((S.roundsWon / S.rounds) * 100) : 0}%</b><span>Rounds won</span></div><div><b>${S.tours.won}</b><span>Trophies</span></div></div>`;
    html += '<h3 class="sub">Your favourite throws, all time</h3><div class="bars">';
    for (const m of R.ALL) {
      const c = S.throws[m] || 0;
      if (!c && !['rock', 'paper', 'scissors'].includes(m)) continue;
      html += `<div class="bar"><span>${EMO[m]} ${cap(m)}</span><span class="track"><span class="fill" style="width:${tw ? (c / tw) * 100 : 0}%"></span></span><span class="pct">${tw ? Math.round((c / tw) * 100) : 0}%</span></div>`;
    }
    html += '</div><p class="note">Studies of real players find rock is a slightly popular opener and people tend to avoid repeating a throw three times. How do you compare?</p>';
    html += '<table class="rtable"><thead><tr><th>Rival</th><th>Won</th><th>Lost</th></tr></thead><tbody>';
    for (const p of R.PERSONAS) { const r = S.rec[p.id] || { w: 0, l: 0 }; html += `<tr><td>${p.name} <span class="c-muted">${p.tag}</span></td><td>${r.w}</td><td>${r.l}</td></tr>`; }
    html += '</tbody></table>';
    html += `<h3 class="sub">Badges ${Object.keys(S.badges).length}/${BADGES.length}</h3><div class="badges">${BADGES.map((b) => `<div class="badge ${S.badges[b.id] ? 'got' : 'locked'}"><span class="e">${b.e}</span><b>${b.t}</b><small>${b.d}</small></div>`).join('')}</div>`;
    html += `<h3 class="sub">Recent matches</h3>${S.hist.length ? `<table class="rtable"><tbody>${S.hist.map((h) => `<tr><td>${h.y > h.a ? '✅' : '❌'} ${persona(h.o).name}</td><td>${h.y}-${h.a}</td><td>${R.RULES[h.r] ? R.RULES[h.r].name : ''}</td><td>${h.m === 'tour' ? 'Tournament' : h.m === 'daily' ? 'Daily' : 'Quick'}</td></tr>`).join('')}</tbody></table>` : '<p class="c-muted">No matches yet.</p>'}`;
    html += '<p><button type="button" class="c-btn c-btn--ghost" data-a="reset">Reset all stats</button></p>';
    openSheet('Stats and badges', html, async (a) => {
      if (a !== 'reset') return;
      closeSheet();
      const v = await Curio.modal({ emoji: '🧹', title: 'Wipe everything?', body: 'Records, badges and history will be cleared.', buttons: [{ label: 'Keep them', value: 'no' }, { label: 'Wipe', value: 'yes' }] });
      if (v !== 'yes') return;
      Object.assign(S, { rec: {}, badges: {}, throws: {}, rounds: 0, roundsWon: 0, matches: 0, tours: { played: 0, won: 0 }, daily: {}, hist: [], bestStreak: 0 });
      save(); buildMenu();
    });
  }

  function wheel(id) {
    const r = R.RULES[id], n = r.moves.length, cx = 150, cy = 150, rad = 105;
    const pos = r.moves.map((m, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]; });
    let s = `<svg class="wheel" viewBox="0 0 300 300" aria-hidden="true"><defs><marker id="ah-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" fill="var(--accent)"/></marker></defs>`;
    r.moves.forEach((a, i) => r.moves.forEach((b, j) => {
      if (!R.BEATS[a][b]) return;
      const [x1, y1] = pos[i], [x2, y2] = pos[j];
      const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
      s += `<line x1="${x1 + (dx / L) * 30}" y1="${y1 + (dy / L) * 30}" x2="${x2 - (dx / L) * 34}" y2="${y2 - (dy / L) * 34}" stroke="var(--accent)" stroke-width="2.5" marker-end="url(#ah-${id})" opacity=".8"/>`;
    }));
    const look = youLook();
    r.moves.forEach((m, i) => { s += `<circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="28" fill="var(--surface-2)" stroke="var(--line)" stroke-width="2"/><svg x="${pos[i][0] - 25}" y="${pos[i][1] - 19}" width="50" height="38" viewBox="70 0 190 160" overflow="hidden">${handSVG(look, m).replace(/<svg[^>]*>/, `<g class="hand" data-pose="${m}">`).replace(/<\/svg>$/, '</g>')}</svg>`; });
    return `${s}</svg>`;
  }

  function showHow() {
    const html = `<div class="how">
      <p><b>The basics.</b> Pick a throw. You and your rival pump three times and reveal together. Rock crushes scissors, scissors cut paper, paper covers rock. Win the round, win a point.</p>
      ${wheel('classic')}
      <p><b>Every bot has a habit.</b> Rocky, Echo, Cyclo, Sly and Bounce each follow one simple rule with a little noise. Work out the rule and you can beat them almost every time. The rule is revealed after each match.</p>
      <p><b>Dice</b> is truly random, so no strategy beats it in the long run. <b>Mindreader</b> runs five pattern detectors on your throws and plays the counter, so the only defence is to be genuinely unpredictable.</p>
      <p><b>With the Well.</b> A French playground variant. The well swallows rock and scissors, and paper covers the well. Fun fact: rock is now a strictly bad choice, because the well beats everything rock beats.</p>
      ${wheel('well')}
      <p><b>Lizard Spock.</b> Five throws where each beats two and loses to two. Scissors cut paper, paper covers rock, rock crushes lizard, lizard poisons Spock, Spock smashes scissors, scissors decapitate lizard, lizard eats paper, paper disproves Spock, Spock vaporizes rock, and rock crushes scissors.</p>
      ${wheel('rpsls')}
      <p><b>Tournament.</b> You and the seven bots in a knockout bracket. Quarter and semi-finals are first to 3, the final is first to 4. <b>Daily gauntlet:</b> three seeded rivals in a row, the same for everyone today, ending with Mindreader.</p>
    </div>`;
    openSheet('How to play', html);
  }

  $('go').addEventListener('click', () => {
    if (S.mode === 'tour') { newTour(); tourNext(); }
    else if (S.mode === 'daily') dailyStart();
    else startMatch(S.opp, S.rules, S.target, 'quick');
  });
  $('how').addEventListener('click', showHow);
  $('stats-btn').addEventListener('click', showStats);
  $('opt-fast').addEventListener('change', (e) => { S.fast = e.target.checked; save(); });
  $('restart').addEventListener('click', () => {
    if (matchMode === 'tour') { Curio.toast('No restarts in a tournament. Forfeit from the menu.'); return; }
    if (matchMode === 'daily') { Curio.toast('No restarts in the gauntlet.'); return; }
    startMatch(matchOpp, rules.id, matchTarget, 'quick');
  });
  $('back').addEventListener('click', toMenu);

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    if (!$('sheet').hidden) { if (e.key === 'Escape') $('sheet-x').click(); return; }
    if (!$('game').hidden) {
      const k = e.key.toLowerCase();
      const map = { r: 'rock', p: 'paper', s: 'scissors', l: 'lizard', k: 'spock', v: 'spock', w: 'well' };
      let idx = -1;
      if (map[k]) idx = rules.moves.indexOf(map[k]);
      else if (/^[1-5]$/.test(k) && +k <= rules.n) idx = +k - 1;
      if (idx >= 0) { play(idx); e.preventDefault(); }
      else if (e.key === 'Escape') toMenu();
    } else if (!$('bracket-view').hidden) {
      if (e.key === 'Escape') toMenu();
    } else if (e.key === 'Enter' && !e.target.closest('button,input')) { $('go').click(); e.preventDefault(); }
  });

  buildMenu();
  if (Curio.simple) startMatch('mind', 'classic', 5, 'quick');
  window.__rps = { play, get busy() { return busy; }, get score() { return score; }, get history() { return history; }, startMatch, S, get tour() { return tour; } };
})();
