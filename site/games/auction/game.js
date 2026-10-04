(() => {
  const LOTS = window.AUCTION_LOTS;
  const CATS = window.AUCTION_CATS;
  const ART = window.AuctionArt;
  const $ = (id) => document.getElementById(id);
  const room = $('room');
  const SAVE = 'auction:v2';

  const BADGES = [
    ['first', '🔨', 'First gavel', 'Finish any sale'],
    ['perfect', '🎯', 'Bang on', 'Score a perfect 1,000 on a lot'],
    ['hat3', '🎩', 'Hat trick', 'Three lots of 850+ in one sale'],
    ['dealer', '🧐', 'Art dealer', 'Score 6,000+ in a classic sale'],
    ['sothebys', '🏛️', 'Head of the house', 'Score 9,000+ in a classic sale'],
    ['bargain', '🛍️', 'Bargain hunter', 'Win a Bidding War lot for under half its value'],
    ['overpaid', '💸', 'Money to burn', "Pay more than double a lot's value"],
    ['tycoon', '🤑', 'Tycoon', 'Finish a Bidding War with 2,500+ points'],
    ['streak5', '📈', 'On a roll', '5 in a row in Higher or Lower'],
    ['streak12', '🔮', 'Market oracle', '12 in a row in Higher or Lower'],
    ['daily', '📅', 'Daily regular', 'Finish a Daily Sale'],
    ['seen50', '📚', 'Browser', 'See 50 different lots'],
    ['seenall', '🗝️', 'Completionist', 'See every lot in the catalogue'],
    ['specialist', '🔬', 'Specialist', 'Finish a sale in a single category'],
    ['nailed20', '⭐', 'Eye for value', 'Score 850+ on 20 different lots']
  ];

  const MODES = [
    { id: 'classic', icon: '🔨', name: 'Classic sale', desc: '10 lots. Guess each final price. Up to 1,000 points a lot.', a: '#ffcf70', b: '#f08a24' },
    { id: 'war', icon: '🙋', name: 'Bidding war', desc: 'Outbid three rivals live. Win lots below their true value.', a: '#9be7a0', b: '#2e7d32' },
    { id: 'hl', icon: '⚖️', name: 'Higher or lower', desc: 'Two lots, one question: which sold for more? Keep the streak.', a: '#a7c7ff', b: '#3d6fd8' },
    { id: 'daily', icon: '📅', name: 'Daily sale', desc: 'The same 10 lots for everyone today. One shot at glory.', a: '#ffb3c7', b: '#d6336c' }
  ];

  const blank = () => ({ v: 2, cat: 'all', style: 'slider', games: { classic: 0, war: 0, hl: 0, daily: 0 }, best: { classic: null, war: null, hl: null, daily: null }, perfect: 0, seen: [], nailed: [], badges: [], daily: {}, history: [] });
  function loadSave() {
    const d = blank();
    const s = Curio.store.get(SAVE, null);
    if (!s || typeof s !== 'object' || s.v !== 2) return d;
    for (const k of Object.keys(d)) if (s[k] == null || typeof s[k] !== typeof d[k] || Array.isArray(d[k]) !== Array.isArray(s[k])) s[k] = d[k];
    for (const k of Object.keys(d.games)) { if (typeof s.games[k] !== 'number') s.games[k] = 0; if (!(k in s.best)) s.best[k] = null; }
    return s;
  }
  let save = loadSave();
  const persist = () => Curio.store.set(SAVE, save);

  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const words = (n) => {
    const f = (x) => x.toLocaleString('en-US', { maximumSignificantDigits: 3 });
    if (n >= 1e9) return '$' + f(n / 1e9) + ' billion';
    if (n >= 1e6) return '$' + f(n / 1e6) + ' million';
    if (n >= 1e3) return '$' + f(n / 1e3) + ' thousand';
    return money(n);
  };
  const short = (n) => {
    const f = (x) => x.toLocaleString('en-US', { maximumSignificantDigits: 3 });
    if (n >= 1e9) return '$' + f(n / 1e9) + 'B';
    if (n >= 1e6) return '$' + f(n / 1e6) + 'M';
    if (n >= 1e3) return '$' + f(n / 1e3) + 'K';
    return money(n);
  };
  const nice = (n) => { const p = Math.pow(10, Math.floor(Math.log10(n)) - 2); return Math.round(n / p) * p; };
  const nice2 = (n) => { const p = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / p) * p; };
  const pointsFor = (guess, actual) => {
    const d = Math.abs(Math.log10(guess / actual));
    if (d <= Math.log10(1.02)) return 1000;
    return Math.round(1000 * Math.pow(Math.max(0, 1 - d / 1.2), 1.6));
  };
  const catOf = (id) => CATS.find((c) => c.id === id) || CATS[0];
  const vibrate = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };

  function seeded(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const hashStr = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const shuffleWith = (arr, rnd) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let noiseBuf = null;
  const AC = () => (Curio.muted ? null : Curio.audioContext());
  function noise(ac) {
    if (noiseBuf) return noiseBuf;
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.6, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noiseBuf;
  }
  const SFX = {
    gavel() {
      const ac = AC(); if (!ac) return;
      const t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(48, t + .18);
      g.gain.setValueAtTime(.55, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .32);
      const n = ac.createBufferSource(); n.buffer = noise(ac);
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 1.2;
      const ng = ac.createGain(); ng.gain.setValueAtTime(.6, t); ng.gain.exponentialRampToValueAtTime(.001, t + .09);
      n.connect(f).connect(ng).connect(ac.destination); n.start(t); n.stop(t + .1);
    },
    crowd(vol = .12, dur = .9) {
      const ac = AC(); if (!ac) return;
      const t = ac.currentTime;
      const n = ac.createBufferSource(); n.buffer = noise(ac); n.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 520;
      const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .15); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      n.connect(f).connect(g).connect(ac.destination); n.start(t); n.stop(t + dur + .05);
    },
    tick(k = 0) { Curio.beep(260 + k * 500, .03, 'triangle', .05); },
    ching() { [1046, 1318, 1568].forEach((f, i) => setTimeout(() => Curio.beep(f, .16, 'triangle', .09), i * 70)); },
    sad() { Curio.beep(330, .18, 'sawtooth', .05); setTimeout(() => Curio.beep(220, .3, 'sawtooth', .05), 160); },
    whoosh() {
      const ac = AC(); if (!ac) return;
      const t = ac.currentTime;
      const n = ac.createBufferSource(); n.buffer = noise(ac);
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2400, t + .3);
      const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .08); g.gain.exponentialRampToValueAtTime(.0001, t + .35);
      n.connect(f).connect(g).connect(ac.destination); n.start(t); n.stop(t + .4);
    },
    fanfare() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, .2, 'triangle', .1), i * 120)); }
  };

  $('auctioneer').innerHTML = ART.auctioneer();
  const auc = $('auctioneer'), bubble = $('bubble');
  let talkTimer = 0, bubbleTimer = 0;
  function say(text, ms = 2600, mood = '') {
    bubble.textContent = text;
    bubble.classList.add('on');
    auc.classList.remove('happy', 'sad');
    if (mood) auc.classList.add(mood);
    auc.classList.add('talk');
    clearTimeout(talkTimer); clearTimeout(bubbleTimer);
    talkTimer = setTimeout(() => auc.classList.remove('talk'), Math.min(ms, 300 + text.length * 40));
    if (ms > 0) bubbleTimer = setTimeout(() => bubble.classList.remove('on'), ms);
  }
  function bang() {
    auc.classList.remove('bang'); void auc.offsetWidth; auc.classList.add('bang');
    setTimeout(() => { SFX.gavel(); vibrate(30); room.classList.remove('shake'); void room.offsetWidth; room.classList.add('shake'); }, 130);
  }
  function stamp(text = 'SOLD', lost = false) {
    const s = $('stamp'); s.textContent = text; s.classList.toggle('lost', lost);
    s.classList.remove('on'); void s.offsetWidth; s.classList.add('on');
  }
  const clearStamp = () => $('stamp').classList.remove('on');
  auc.addEventListener('click', () => { bang(); say(Curio.pick(['Order! Order!', 'That is my gavel, thank you.', 'Please do not poke the auctioneer.', 'Bidding is for paddles, not fingers.', 'I have been doing this for 41 years.']), 1800, 'happy'); });

  const dust = $('dust');
  for (let i = 0; i < 16; i++) {
    const d = document.createElement('i');
    d.style.left = (30 + Math.random() * 40) + '%'; d.style.top = (30 + Math.random() * 65) + '%';
    d.style.animationDuration = (5 + Math.random() * 6) + 's'; d.style.animationDelay = (-Math.random() * 8) + 's';
    dust.append(d);
  }

  function showArt(lot, el = $('art')) {
    el.innerHTML = `<svg viewBox="0 0 240 170" preserveAspectRatio="xMidYMax meet">${ART.lotArt(lot.a)}</svg>`;
    el.setAttribute('aria-label', lot.n);
    el.classList.remove('in', 'idle'); void el.offsetWidth; el.classList.add('in');
    setTimeout(() => { el.classList.remove('in'); el.classList.add('idle'); }, 700);
  }
  const thumb = (lot) => `<svg viewBox="0 0 240 170" preserveAspectRatio="xMidYMid meet" style="--hole:#4a1620">${ART.lotArt(lot.a)}</svg>`;

  function markSeen(lot) {
    if (!save.seen.includes(lot.n)) { save.seen.push(lot.n); persist(); }
    if (save.seen.length >= 50) award('seen50');
    if (save.seen.length >= LOTS.length) award('seenall');
  }
  function award(id) {
    if (save.badges.includes(id)) return;
    save.badges.push(id); persist();
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => { Curio.toast(`${b[1]} Badge unlocked: ${b[2]}`, 2600); SFX.ching(); }, 400);
  }

  let mode = 'classic', lots = [], round = 0, score = 0, results = [], busy = false, timers = [], rounds = 10, singleCat = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function show(which) {
    for (const id of ['menu', 'play', 'end', 'extra']) $(id).hidden = id !== which;
  }

  function poolFor(cat) { return cat === 'all' ? LOTS.slice() : LOTS.filter((l) => l.c === cat); }

  function renderMenu() {
    clearTimers(); clearStamp();
    room.classList.remove('hl', 'war', 'dim');
    $('duo').hidden = true; $('rivals').hidden = true; $('pedestal').hidden = false; $('placard').hidden = true;
    const m = $('modes'); m.innerHTML = '';
    for (const md of MODES) {
      const b = document.createElement('button');
      b.className = 'au-mode'; b.type = 'button';
      b.style.setProperty('--a', md.a); b.style.setProperty('--b', md.b);
      const best = save.best[md.id];
      const dailyDone = md.id === 'daily' && save.daily[todayKey()] != null;
      b.innerHTML = `<span class="ic" aria-hidden="true">${md.icon}</span><span><b>${md.name}</b><small>${md.desc}</small>${dailyDone ? `<span class="done">Today: ${save.daily[todayKey()].toLocaleString('en-US')} pts</span>` : best != null ? `<span class="done">Best: ${best.toLocaleString('en-US')}</span>` : ''}</span>`;
      b.addEventListener('click', () => start(md.id));
      m.append(b);
    }
    const cats = $('cats'); cats.innerHTML = '';
    for (const c of CATS) {
      const n = poolFor(c.id).length;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'au-chip';
      b.textContent = `${c.icon} ${c.label} (${n})`;
      b.setAttribute('aria-pressed', String(save.cat === c.id));
      b.addEventListener('click', () => { save.cat = c.id; persist(); renderMenu(); SFX.tick(.3); });
      cats.append(b);
    }
    const st = $('styleChips'); st.innerHTML = '';
    for (const [id, label] of [['slider', '🎚️ Name your price'], ['paddle', '🏷️ Pick from four (easier)']]) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'au-chip'; b.textContent = label;
      b.setAttribute('aria-pressed', String(save.style === id));
      b.addEventListener('click', () => { save.style = id; persist(); renderMenu(); SFX.tick(.3); });
      st.append(b);
    }
    const played = Object.values(save.games).reduce((a, b) => a + b, 0);
    $('statsRow').innerHTML = `<div class="c-stat"><b>${played}</b><span>Sales</span></div><div class="c-stat"><b>${save.best.classic == null ? '-' : save.best.classic.toLocaleString('en-US')}</b><span>Best classic</span></div><div class="c-stat"><b>${save.seen.length}/${LOTS.length}</b><span>Lots seen</span></div><div class="c-stat"><b>${save.badges.length}/${BADGES.length}</b><span>Badges</span></div>`;
    const feature = LOTS[hashStr(todayKey() + 'f') % LOTS.length];
    showArt(feature);
    say(Curio.pick(['Welcome to the saleroom! Pick a sale below.', 'Paddles ready? We have 139 lots tonight.', 'Ah, a new bidder. Do sit down.', `Tonight's star lot: ${feature.n}. Probably.`]), 4200, 'happy');
    show('menu');
  }

  function hud(items) {
    $('hud').innerHTML = items.map(([id, v, l]) => `<div class="c-stat"><b id="${id}">${v}</b><span>${l}</span></div>`).join('') + '<button class="c-btn c-btn--ghost" type="button" id="quit" style="padding:6px 12px;font-size:13px" aria-label="Leave the sale">✕</button>';
    $('quit').addEventListener('click', quit);
  }
  async function quit() {
    const v = await Curio.modal({ emoji: '🚪', title: 'Leave the sale?', body: 'This sale will not count.', buttons: [{ label: 'Leave', value: 1 }, { label: 'Keep bidding', value: 0 }] });
    if (v) { clearTimers(); renderMenu(); }
  }
  const bumpEl = (id, text) => { const e = $(id); if (!e) return; e.textContent = text; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); };

  function setInfo(lot, hideDesc = false) {
    const c = catOf(lot.c);
    $('catTag').textContent = `${c.icon} ${c.label}`;
    $('name').textContent = lot.n;
    $('meta').textContent = `Sold ${lot.y} · ${lot.h}`;
    const d = $('desc'); d.textContent = lot.d; d.classList.toggle('hide', hideDesc);
    $('info').hidden = false;
  }

  function start(m) {
    mode = m; clearTimers(); clearStamp();
    singleCat = save.cat !== 'all' && m !== 'daily';
    if (m === 'hl') return startHL();
    let pool = m === 'daily' ? LOTS.slice() : poolFor(save.cat);
    if (m === 'daily') {
      if (save.daily[todayKey()] != null) Curio.toast('You already played today. This run is just for fun.', 2600);
      lots = shuffleWith(pool, seeded(hashStr('auction' + todayKey()))).slice(0, 10);
    } else lots = Curio.shuffle(pool).slice(0, m === 'war' ? 8 : 10);
    rounds = lots.length; round = 0; score = 0; results = [];
    if (m === 'war') return startWar();
    room.classList.remove('hl', 'war');
    $('duo').hidden = true; $('rivals').hidden = true; $('pedestal').hidden = false;
    hud([['hRound', `1/${rounds}`, 'Lot'], ['hScore', '0', 'Score'], ['hBest', save.best[m] == null ? '-' : save.best[m].toLocaleString('en-US'), 'Best']]);
    show('play');
    showLot();
    room.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showLot() {
    const lot = lots[round];
    busy = false; clearStamp();
    $('hRound').textContent = `${round + 1}/${rounds}`;
    $('placard').hidden = false; $('tag').textContent = `Lot ${round + 1} of ${rounds}`;
    showArt(lot); setInfo(lot); markSeen(lot); SFX.whoosh();
    say(Curio.pick([`Lot ${round + 1}! ${lot.n}. What am I bid?`, 'Feast your eyes on this one.', 'Ooh, careful, this one has a story.', 'Next up, a real conversation piece.', 'Who will start me off?', 'A fine lot. Let us begin.']), 3000);
    const c = $('controls');
    if (save.style === 'paddle') {
      const opts = makeOptions(lot.p);
      c.innerHTML = `<div class="au-opts" role="group" aria-label="Pick a price">${opts.map((o, i) => `<button class="au-opt" type="button" data-v="${o}"><small>${i + 1}</small>${short(o)}</button>`).join('')}</div>`;
      c.querySelectorAll('.au-opt').forEach((b) => b.addEventListener('click', () => lockIn(Number(b.dataset.v), b)));
    } else {
      c.innerHTML = `<div class="au-readout" id="guess" aria-live="polite">$1,000,000</div><div class="au-readout-sub" id="guessWords"></div>
        <div class="au-slider-row"><button class="au-nudge" type="button" id="down" aria-label="Lower the price">−</button>
        <input class="au-range" type="range" id="range" min="3" max="9" step="0.001" value="6" aria-label="Your price guess">
        <button class="au-nudge" type="button" id="up" aria-label="Raise the price">+</button></div>
        <div class="au-scale" aria-hidden="true"><span>$1K</span><span>$1M</span><span>$1B</span></div>
        <button class="c-btn au-big" type="button" id="lock">🔨 Lock in my bid</button>`;
      const range = $('range');
      let lastTick = 0, lastSay = 0;
      range.addEventListener('input', () => {
        paintGuess();
        const now = performance.now();
        if (now - lastTick > 45) { lastTick = now; SFX.tick((Number(range.value) - 3) / 6); }
        if (now - lastSay > 1500) { lastSay = now; say(`Do I hear ${words(guessVal())}?`, 1400); }
      });
      $('down').addEventListener('click', () => nudge(-0.02));
      $('up').addEventListener('click', () => nudge(0.02));
      $('lock').addEventListener('click', () => lockIn(guessVal()));
      paintGuess();
    }
  }
  const guessVal = () => nice(Math.pow(10, Number($('range').value)));
  function paintGuess() { const g = guessVal(); $('guess').textContent = money(g); $('guessWords').textContent = words(g); }
  function nudge(k) { const r = $('range'); if (!r) return; r.value = Math.max(3, Math.min(9, Number(r.value) + k)); paintGuess(); SFX.tick(k > 0 ? .8 : .1); }
  function makeOptions(p) {
    const facs = Curio.shuffle([1 / 30, 1 / 10, 1 / 4, 3, 4, 10, 30, 1 / 3]);
    const out = [nice2(p)];
    for (const f of facs) { const v = nice2(p * f); if (out.length < 4 && v >= 1000 && v <= 3e9 && out.every((o) => Math.abs(Math.log10(o / v)) > .3)) out.push(v); }
    return Curio.shuffle(out);
  }

  function lockIn(guess, optBtn) {
    if (busy) return; busy = true;
    const lot = lots[round];
    let pts = pointsFor(guess, lot.p);
    if (save.style === 'paddle') {
      const right = Math.abs(Math.log10(guess / lot.p)) < .05;
      pts = right ? 1000 : Math.round(pts / 3);
      document.querySelectorAll('.au-opt').forEach((b) => { b.disabled = true; const v = Number(b.dataset.v); if (Math.abs(Math.log10(v / lot.p)) < .05) b.classList.add('right'); else if (b === optBtn) b.classList.add('wrong'); });
    }
    say(`${words(guess)}, says the bidder. Let us see...`, 2000);
    const c = $('controls');
    const wrap = document.createElement('div'); wrap.className = 'au-reveal';
    wrap.innerHTML = `<div class="au-price" id="price">$0</div><div class="au-yours">Your bid: ${money(guess)}</div>
      <div class="au-bar" aria-hidden="true"><div class="au-pin you" id="pinYou"><i></i>You</div><div class="au-pin real" id="pinReal"><i></i><span></span></div></div>
      <div class="au-pts" id="pts"></div><p class="au-verdict" id="verdict"></p><button class="c-btn" type="button" id="next" hidden>Next lot →</button>`;
    if (save.style === 'paddle') c.append(wrap); else c.replaceChildren(wrap);
    const pos = (v) => (Math.max(3, Math.min(9, Math.log10(v))) - 3) / 6 * 100 + '%';
    $('pinYou').style.left = pos(guess); $('pinReal').style.left = '0%';
    room.classList.add('dim');
    const dur = 2200, t0 = performance.now();
    let lastBeep = 0;
    const step = (now) => {
      if (!$('price')) return;
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      const v = Math.pow(10, 3 + (Math.log10(lot.p) - 3) * e);
      $('price').textContent = money(k < 1 ? nice(v) : lot.p);
      $('pinReal').style.left = pos(v);
      if (now - lastBeep > 90 && k < 1) { lastBeep = now; SFX.tick(e); }
      if (k < 1) { requestAnimationFrame(step); return; }
      room.classList.remove('dim');
      $('price').classList.add('done');
      $('pinReal').querySelector('span').textContent = 'Sold';
      bang(); stamp('SOLD');
      score += pts;
      results.push({ lot, guess, pts });
      bumpEl('hScore', score.toLocaleString('en-US'));
      if (pts >= 850 && !save.nailed.includes(lot.n)) save.nailed.push(lot.n);
      if (pts === 1000) { save.perfect++; award('perfect'); }
      if (save.nailed.length >= 20) award('nailed20');
      persist();
      if (pts >= 850) { Curio.confetti(70); setTimeout(SFX.ching, 250); SFX.crowd(.16, 1.2); } else if (pts < 300) setTimeout(SFX.sad, 250);
      const ratio = guess / lot.p;
      const verdict = pts === 1000 ? 'Bang on! Are you secretly an auctioneer?' : pts >= 850 ? 'So close you could hear the gavel.' : pts >= 600 ? `Not bad at all, just a little ${ratio > 1 ? 'high' : 'low'}.` : ratio > 1 ? `You would have overpaid by ${ratio >= 10 ? Math.round(ratio).toLocaleString('en-US') : ratio.toFixed(1)}×.` : `It sold for ${1 / ratio >= 10 ? Math.round(1 / ratio).toLocaleString('en-US') : (1 / ratio).toFixed(1)}× your bid.`;
      say(pts === 1000 ? "Bang on! I'm out of a job." : pts >= 850 ? 'Sold! You really know your stuff.' : pts >= 500 ? `Sold for ${words(lot.p)}! Respectable guess.` : ratio > 1 ? 'Sold! Thank goodness you were not buying.' : 'Ha! A bargain hunter, I see.', 3200, pts >= 500 ? 'happy' : 'sad');
      let p0 = performance.now();
      const ptStep = (n2) => { const kk = Math.min(1, (n2 - p0) / 600); if ($('pts')) $('pts').textContent = `+${Math.round(pts * kk).toLocaleString('en-US')} points`; if (kk < 1) requestAnimationFrame(ptStep); };
      requestAnimationFrame(ptStep);
      $('verdict').textContent = verdict;
      const nx = $('next'); nx.hidden = false; nx.textContent = round + 1 >= rounds ? 'See my results →' : 'Next lot →';
      nx.addEventListener('click', nextLot);
      nx.focus({ preventScroll: true });
    };
    requestAnimationFrame(step);
  }
  function nextLot() {
    round++;
    if (round >= rounds) return finish();
    showLot();
  }

  function trophy(tier) {
    const c = ['#cd7f32', '#c0c0c0', '#ffd54f', '#7ee0ff'][tier];
    return `<svg class="au-trophy" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="${ART.shade(c, .4)}"/><stop offset=".5" stop-color="${c}"/><stop offset="1" stop-color="${ART.shade(c, -.3)}"/></linearGradient></defs><path d="M30 20 h60 v18 Q90 70 60 74 Q30 70 30 38Z" fill="url(#tg)"/><path d="M30 26 Q12 26 14 42 Q16 56 34 58 M90 26 Q108 26 106 42 Q104 56 86 58" stroke="${c}" stroke-width="6" fill="none"/><rect x="54" y="72" width="12" height="18" fill="${c}"/><rect x="38" y="90" width="44" height="12" rx="3" fill="#5d3a1a"/><rect x="32" y="102" width="56" height="10" rx="3" fill="#3e2716"/><path d="M60 32 l4 9 l10 1 l-7 7 l2 10 l-9 -5 l-9 5 l2 -10 l-7 -7 l10 -1Z" fill="#fff" opacity=".85"/></svg>`;
  }
  const gradeColor = (p) => p >= 850 ? '#2ecc71' : p >= 500 ? '#f1c40f' : p >= 200 ? '#e67e22' : '#e74c3c';
  const gradeEmoji = (p) => p >= 850 ? '🟩' : p >= 500 ? '🟨' : p >= 200 ? '🟧' : '🟥';

  function finishCommon(m, value, extra = {}) {
    save.games[m] = (save.games[m] || 0) + 1;
    const prev = save.best[m];
    const isNew = prev == null || value > prev;
    if (isNew) save.best[m] = value;
    save.history.unshift({ m, value, d: todayKey(), cat: m === 'daily' ? 'all' : save.cat });
    save.history = save.history.slice(0, 20);
    persist();
    award('first');
    if (singleCat && m !== 'hl') award('specialist');
    return { isNew, best: save.best[m] };
  }

  async function share(text) {
    try { await navigator.clipboard.writeText(text); Curio.toast('Copied! Paste it anywhere.'); }
    catch { Curio.modal({ emoji: '📋', title: 'Your result', body: text, buttons: [{ label: 'OK', value: 1 }] }); }
  }

  function finish() {
    const max = rounds * 1000;
    const pct = score / max;
    const { isNew, best } = finishCommon(mode, score);
    if (mode === 'daily') { if (save.daily[todayKey()] == null) save.daily[todayKey()] = score; persist(); award('daily'); }
    if (results.filter((r) => r.pts >= 850).length >= 3) award('hat3');
    if (rounds >= 10 && score >= 6000) award('dealer');
    if (rounds >= 10 && score >= 9000) award('sothebys');
    const titles = [[.9, 3, 'Head of the auction house'], [.75, 2, 'Seasoned collector'], [.6, 2, 'Art dealer'], [.45, 1, 'Weekend antiquer'], [.3, 0, 'Car-boot sale regular'], [0, 0, 'Please step away from the paddle']];
    const [, tier, title] = titles.find(([min]) => pct >= min);
    const e = $('end');
    e.innerHTML = `${trophy(tier)}<div class="c-muted" style="font-weight:800">${mode === 'daily' ? `Daily sale · ${todayKey()}` : 'Classic sale'}</div>
      <h2>${score.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}</h2><div class="au-title">${title}</div>
      <p class="c-muted" style="margin:4px 0 0">${isNew ? '🎉 New personal best!' : `Personal best: ${best.toLocaleString('en-US')}`}</p>
      <div class="au-grade">${results.map((r, i) => `<i style="background:${gradeColor(r.pts)};animation-delay:${i * 60}ms" title="${r.pts}"></i>`).join('')}</div>
      <ul class="au-list">${results.map((r, i) => `<li style="animation-delay:${i * 50}ms"><div class="th">${thumb(r.lot)}</div><span>${esc(r.lot.n)}<small>Sold ${words(r.lot.p)} · you said ${words(r.guess)}</small></span><b>+${r.pts}</b></li>`).join('')}</ul>
      <div class="c-row"><button class="c-btn" type="button" id="again">Play again</button><button class="c-btn c-btn--ghost" type="button" id="shareBtn">📋 Share</button><button class="c-btn c-btn--ghost" type="button" id="toMenu">Menu</button></div>`;
    show('end');
    $('placard').hidden = true;
    stamp(pct >= .6 ? 'BRAVO' : 'SOLD', pct < .3);
    say(pct >= .75 ? 'Magnificent! Drinks are on the house.' : pct >= .45 ? 'A fine evening of bidding.' : 'Well. The gift shop is to your left.', 4000, pct >= .45 ? 'happy' : 'sad');
    SFX.fanfare(); if (pct >= .6 || isNew) Curio.confetti();
    $('again').addEventListener('click', () => start(mode));
    $('toMenu').addEventListener('click', renderMenu);
    $('shareBtn').addEventListener('click', () => share(`The Auction (Curio) · ${mode === 'daily' ? 'Daily ' + todayKey() : 'Classic'}\n${score.toLocaleString('en-US')} / ${max.toLocaleString('en-US')} · ${title}\n${results.map((r) => gradeEmoji(r.pts)).join('')}`));
    $('again').focus({ preventScroll: true });
    e.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  let war = null;
  function gauss() { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function startWar() {
    room.classList.remove('hl'); room.classList.add('war');
    $('duo').hidden = true; $('pedestal').hidden = false;
    const rv = $('rivals'); rv.hidden = false;
    rv.innerHTML = ART.RIVALS.map((r, i) => `<div class="au-rival" id="rv${i}"><div style="position:relative">${ART.rival(r)}<div class="pad">${r.paddle}</div></div><span class="nm">${r.name}</span><span class="say"></span></div>`).join('');
    hud([['hRound', `1/${rounds}`, 'Lot'], ['hScore', '0', 'Points'], ['hProfit', '$0', 'Profit']]);
    war = { profit: 0 };
    show('play');
    warLot();
    room.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function warLot() {
    clearTimers(); clearStamp();
    const lot = lots[round];
    busy = false;
    $('hRound').textContent = `${round + 1}/${rounds}`;
    $('placard').hidden = false; $('tag').textContent = `Lot ${round + 1} of ${rounds}`;
    showArt(lot); setInfo(lot, false); markSeen(lot); SFX.whoosh();
    const R = lot.p;
    const n = gauss() * .1;
    const lo = nice2(R * Math.pow(10, n - .22)), hi = nice2(R * Math.pow(10, n + .12));
    const open = nice2(R * Math.pow(10, -.9 - Math.random() * .4));
    const rivals = ART.RIVALS.map((r, i) => {
      let v = R * Math.pow(10, gauss() * .22 + (Math.random() < .25 ? -.35 : 0));
      return { i, v, in: true };
    });
    war.lot = lot; war.price = open; war.prev = open; war.rivals = rivals; war.me = true; war.done = false; war.lastOut = null; war.ticks = 0;
    rivals.forEach((r) => { const el = $('rv' + r.i); el.classList.remove('out', 'down'); el.classList.add('up'); el.querySelector('.say').classList.remove('on'); });
    $('controls').innerHTML = `<div class="au-war"><span class="au-est">House estimate: ${short(lo)} to ${short(hi)}</span>
      <div class="au-readout" id="wPrice">${money(open)}</div><div class="au-readout-sub" id="wSub">Opening bid. Your paddle is up.</div>
      <button class="au-paddle" type="button" id="paddle">🙋 Paddle up · tap to drop out</button>
      <div class="au-going" aria-hidden="true"><i id="going"></i></div>
      <p class="c-muted" style="font-size:13px;margin:8px 0 0">If you win, you resell at the real price. Profit is points. Overpay and you lose points.</p></div>`;
    $('paddle').addEventListener('click', dropOut);
    say(`Lot ${round + 1}. I open at ${words(open)}!`, 2400);
    later(warTick, 1500);
  }
  function rivalSay(i, text) {
    const s = $('rv' + i).querySelector('.say'); s.textContent = text; s.classList.add('on');
    later(() => s.classList.remove('on'), 1100);
  }
  function warTick() {
    if (!war || war.done) return;
    war.prev = war.price;
    const inc = war.price * (1.07 + Math.random() * .05);
    war.price = nice2(inc) > war.price ? nice2(inc) : nice(inc);
    war.ticks++;
    const p = $('wPrice'); p.textContent = money(war.price); p.classList.remove('tick'); void p.offsetWidth; p.classList.add('tick');
    SFX.tick(Math.min(1, war.ticks / 30));
    for (const r of war.rivals) {
      if (!r.in) continue;
      if (war.price > r.v) {
        r.in = false; war.lastOut = r;
        const el = $('rv' + r.i); el.classList.remove('up'); el.classList.add('down', 'out');
        rivalSay(r.i, Curio.pick(['Pass.', 'Too rich!', "I'm out.", 'No thanks.', 'Pfft.']));
      } else {
        const el = $('rv' + r.i); el.classList.toggle('up', Math.random() < .7);
      }
    }
    const active = war.rivals.filter((r) => r.in).length + (war.me ? 1 : 0);
    if (active <= 1) return going(active === 0);
    if (war.ticks % 3 === 1) say(`${words(war.price)}! Do I hear more?`, 1200);
    $('wSub').textContent = war.me ? `${active - 1} rival${active - 1 === 1 ? '' : 's'} still in. Your paddle is up.` : `${active} rival${active === 1 ? '' : 's'} still in. You are out.`;
    later(warTick, war.me ? Math.max(420, 760 - war.ticks * 14) : 240);
  }
  function dropOut() {
    if (!war || war.done || !war.me) return;
    war.me = false;
    const b = $('paddle'); b.classList.add('out'); b.textContent = '🙅 You dropped out'; b.disabled = true;
    SFX.tick(0); say('The bidder in the front row drops out!', 1600);
    const active = war.rivals.filter((r) => r.in).length;
    if (active <= 1) { clearTimers(); going(active === 0); }
  }
  function going(none) {
    war.done = true; clearTimers();
    let winner, price = war.price;
    if (war.me) winner = 'me';
    else {
      const left = war.rivals.find((r) => r.in);
      winner = left || war.lastOut;
      if (!left) price = war.prev;
    }
    war.winner = winner; war.final = price;
    const b = $('paddle'); if (b) b.disabled = true;
    const g = $('going');
    const steps = ['Going once...', 'Going twice...'];
    steps.forEach((t, i) => later(() => { say(t, 900); if (g) g.style.width = ((i + 1) * 50) + '%'; Curio.beep(500 - i * 80, .08, 'triangle', .06); }, i * 800));
    later(() => warSold(), 1700);
  }
  function warSold() {
    const lot = war.lot, R = lot.p, P = war.final;
    const g = $('going'); if (g) g.style.width = '100%';
    bang();
    let pts = 0, line, sub;
    if (war.winner === 'me') {
      pts = Math.max(-2000, Math.round(1000 * (R - P) / R));
      war.profit += R - P;
      stamp('YOURS');
      if (P <= R / 2) award('bargain');
      if (P > R * 2) award('overpaid');
      line = pts > 0 ? `Sold to the eager bidder at ${words(P)}!` : `Sold to you at ${words(P)}. Oh dear.`;
      sub = `You paid ${money(P)}. It really sold for ${money(R)}. ${pts >= 0 ? 'Profit' : 'Loss'}: ${money(Math.abs(R - P))}.`;
      if (pts > 0) { SFX.ching(); if (pts > 400) Curio.confetti(60); } else SFX.sad();
    } else {
      const r = ART.RIVALS[war.winner.i];
      stamp('SOLD', true);
      line = `Sold to ${r.name}, paddle ${r.paddle}, for ${words(P)}!`;
      sub = P < R ? `A rival got it for ${money(P)}. It really sold for ${money(R)}. A missed bargain!` : `A rival paid ${money(P)}. It really sold for ${money(R)}. Good thing you let it go.`;
      SFX.crowd(.14, 1);
    }
    say(line, 3200, pts >= 0 ? 'happy' : 'sad');
    score += pts;
    results.push({ lot, guess: P, pts, won: war.winner === 'me' });
    bumpEl('hScore', score.toLocaleString('en-US'));
    bumpEl('hProfit', (war.profit < 0 ? '-' : '') + short(Math.abs(war.profit) || 0));
    $('controls').innerHTML = `<div class="au-reveal"><div class="au-price done">${money(R)}</div><div class="au-yours">The real sale price</div>
      <div class="au-pts">${war.winner === 'me' ? (pts >= 0 ? '+' : '') + pts.toLocaleString('en-US') + ' points' : '0 points'}</div><p class="au-verdict">${sub}</p>
      <button class="c-btn" type="button" id="next">${round + 1 >= rounds ? 'See my results →' : 'Next lot →'}</button></div>`;
    $('next').addEventListener('click', () => { round++; if (round >= rounds) finishWar(); else warLot(); });
    $('next').focus({ preventScroll: true });
  }
  function finishWar() {
    clearTimers();
    const { isNew, best } = finishCommon('war', score);
    if (score >= 2500) award('tycoon');
    const won = results.filter((r) => r.won);
    const tier = score >= 2500 ? 3 : score >= 1200 ? 2 : score >= 0 ? 1 : 0;
    const title = score >= 2500 ? 'Ruthless tycoon' : score >= 1200 ? 'Shrewd collector' : score >= 0 ? 'Cautious bidder' : score > -1500 ? 'Enthusiastic overpayer' : 'The house thanks you for your donation';
    const e = $('end');
    e.innerHTML = `${trophy(tier)}<div class="c-muted" style="font-weight:800">Bidding war</div><h2>${score.toLocaleString('en-US')} points</h2><div class="au-title">${title}</div>
      <p class="c-muted" style="margin:4px 0 0">Won ${won.length} of ${rounds} lots · net ${war.profit < 0 ? 'loss' : 'profit'} ${money(Math.abs(war.profit))} · ${isNew ? '🎉 New best!' : `Best: ${best.toLocaleString('en-US')}`}</p>
      <ul class="au-list">${results.map((r, i) => `<li style="animation-delay:${i * 50}ms"><div class="th">${thumb(r.lot)}</div><span>${esc(r.lot.n)}<small>${r.won ? `You paid ${words(r.guess)}` : `Rival paid ${words(r.guess)}`} · worth ${words(r.lot.p)}</small></span><b>${r.won ? (r.pts >= 0 ? '+' : '') + r.pts : '-'}</b></li>`).join('')}</ul>
      <div class="c-row"><button class="c-btn" type="button" id="again">Play again</button><button class="c-btn c-btn--ghost" type="button" id="shareBtn">📋 Share</button><button class="c-btn c-btn--ghost" type="button" id="toMenu">Menu</button></div>`;
    show('end'); $('rivals').hidden = true; room.classList.remove('war'); $('placard').hidden = true;
    say(score > 0 ? 'Shrewd work. I hope you have a big house.' : 'You do realise you are meant to pay LESS?', 4000, score > 0 ? 'happy' : 'sad');
    SFX.fanfare(); if (score >= 1200 || isNew) Curio.confetti();
    $('again').addEventListener('click', () => start('war'));
    $('toMenu').addEventListener('click', renderMenu);
    $('shareBtn').addEventListener('click', () => share(`The Auction (Curio) · Bidding war\n${score.toLocaleString('en-US')} points · ${title}\nWon ${won.length}/${rounds} lots, net ${war.profit < 0 ? '-' : '+'}${short(Math.abs(war.profit))}`));
  }

  let hl = null;
  function startHL() {
    const pool = poolFor(save.cat);
    room.classList.add('hl'); room.classList.remove('war');
    $('rivals').hidden = true; $('placard').hidden = true; $('duo').hidden = false;
    hl = { pool, streak: 0, used: new Set() };
    hud([['hStreak', '0', 'Streak'], ['hBest', save.best.hl == null ? '-' : save.best.hl, 'Best']]);
    $('info').hidden = true;
    show('play');
    hlPair();
    room.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function hlPair() {
    clearStamp(); busy = false;
    let a, b, tries = 0;
    const fresh = hl.pool.filter((l) => !hl.used.has(l.n));
    const src = fresh.length >= 2 ? fresh : hl.pool;
    do { a = Curio.pick(src); b = Curio.pick(src); tries++; } while ((a === b || Math.abs(Math.log10(a.p / b.p)) < .04) && tries < 200);
    hl.used.add(a.n); hl.used.add(b.n);
    hl.pair = [a, b];
    markSeen(a); markSeen(b);
    const duo = $('duo');
    duo.innerHTML = [a, b].map((l, i) => `<button type="button" data-i="${i}" aria-label="${esc(l.n)}"><span class="tagp" id="tp${i}"></span><div class="au-art" id="da${i}"></div><div class="au-plinth"></div></button>`).join('');
    [a, b].forEach((l, i) => showArt(l, $('da' + i)));
    duo.querySelectorAll('button').forEach((bt) => bt.addEventListener('click', () => hlPick(Number(bt.dataset.i))));
    SFX.whoosh();
    $('controls').innerHTML = `<h2 class="au-h2" style="text-align:center;margin-bottom:8px">Which sold for more?</h2><div class="au-opts">${[a, b].map((l, i) => `<button class="au-opt" type="button" data-i="${i}" style="font-size:15px;text-align:left;line-height:1.25"><small>${i === 0 ? '1 or ←' : '2 or →'}</small>${esc(l.n)}<small style="margin-top:4px">${catOf(l.c).icon} ${l.y} · ${esc(l.h)}</small></button>`).join('')}</div>`;
    $('controls').querySelectorAll('.au-opt').forEach((bt) => bt.addEventListener('click', () => hlPick(Number(bt.dataset.i))));
    say(Curio.pick(['Which fetched more? Choose wisely.', 'Two lots enter. One costs more.', 'Left or right? The market has spoken.', 'Hmm, this is a tricky pair.']), 2600);
  }
  function hlPick(i) {
    if (busy) return; busy = true;
    const [a, b] = hl.pair;
    const win = a.p >= b.p ? 0 : 1;
    const ok = i === win;
    [a, b].forEach((l, k) => { const t = $('tp' + k); t.textContent = short(l.p); t.classList.add('on'); });
    $('duo').querySelectorAll('button').forEach((bt, k) => bt.classList.add(k === win ? 'win' : 'lose'));
    $('controls').querySelectorAll('.au-opt').forEach((bt, k) => { bt.disabled = true; if (k === win) bt.classList.add('right'); else if (k === i) bt.classList.add('wrong'); bt.insertAdjacentHTML('beforeend', `<small style="font-size:15px;color:var(--ink);margin-top:6px">${money([a, b][k].p)}</small>`); });
    bang();
    if (ok) {
      hl.streak++;
      bumpEl('hStreak', hl.streak);
      SFX.ching();
      if (hl.streak >= 5) award('streak5');
      if (hl.streak >= 12) award('streak12');
      const ratio = Math.max(a.p, b.p) / Math.min(a.p, b.p);
      say(hl.streak % 5 === 0 ? `${hl.streak} in a row! Remarkable.` : `Correct! About ${ratio >= 10 ? Math.round(ratio).toLocaleString('en-US') : ratio.toFixed(1)}× more.`, 1600, 'happy');
      later(hlPair, 1700);
    } else {
      SFX.sad(); stamp('NOPE', true);
      say('Ooh, no. The market disagrees.', 2400, 'sad');
      later(finishHL, 1600);
    }
  }
  function finishHL() {
    const s = hl.streak;
    const { isNew, best } = finishCommon('hl', s);
    const tier = s >= 12 ? 3 : s >= 7 ? 2 : s >= 3 ? 1 : 0;
    const title = s >= 12 ? 'Market oracle' : s >= 7 ? 'Price whisperer' : s >= 3 ? 'Decent instincts' : 'Coin-flipper';
    $('info').hidden = false;
    const e = $('end');
    e.innerHTML = `${trophy(tier)}<div class="c-muted" style="font-weight:800">Higher or lower</div><h2>${s} in a row</h2><div class="au-title">${title}</div>
      <p class="c-muted" style="margin:4px 0 14px">${isNew ? '🎉 New best streak!' : `Best streak: ${best}`}</p>
      <div class="c-row"><button class="c-btn" type="button" id="again">Play again</button><button class="c-btn c-btn--ghost" type="button" id="shareBtn">📋 Share</button><button class="c-btn c-btn--ghost" type="button" id="toMenu">Menu</button></div>`;
    show('end');
    if (isNew && s >= 3) Curio.confetti();
    $('again').addEventListener('click', () => start('hl'));
    $('toMenu').addEventListener('click', renderMenu);
    $('shareBtn').addEventListener('click', () => share(`The Auction (Curio) · Higher or lower\n${s} in a row · ${title}`));
  }

  function showExtra(html, title) {
    clearTimers();
    const e = $('extra');
    e.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px"><h2 class="au-h2" style="margin:0">${title}</h2><button class="c-btn c-btn--ghost" type="button" id="back">← Back</button></div>${html}`;
    show('extra');
    $('back').addEventListener('click', renderMenu);
    e.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  $('howBtn').addEventListener('click', () => {
    showExtra(`<div class="au-how"><ol>
      <li><b>Classic sale:</b> slide to set a price on a log scale ($1K to $1B) and lock it in. Within 2% of the real price scores a perfect 1,000. Every 10× you are off costs most of the points.</li>
      <li><b>Pick from four:</b> an easier bidding style. The right price scores 1,000; a wrong one scores a little if it was close.</li>
      <li><b>Bidding war:</b> the price climbs on its own. Keep your paddle up to stay in; tap to drop out. Rivals quit when it gets too rich for them. Win a lot and you resell it at its real price, so profit is points and overpaying costs you.</li>
      <li><b>Higher or lower:</b> two lots, pick the pricier sale. One wrong answer ends the streak.</li>
      <li><b>Daily sale:</b> today's 10 lots are the same for everybody. Your first run of the day is your score.</li>
    </ol><p class="c-muted">Choose a catalogue to play only cars, dinosaurs, sport and so on. Keys: arrows nudge the price, Enter bids, 1-4 picks, Space drops your paddle.</p></div>`, 'How to play');
  });
  $('catBtn').addEventListener('click', () => {
    const seen = new Set(save.seen), nailed = new Set(save.nailed);
    const html = CATS.filter((c) => c.id !== 'all').map((c) => {
      const ls = LOTS.filter((l) => l.c === c.id);
      return `<h3 style="margin:14px 0 8px">${c.icon} ${c.label} <span class="c-muted" style="font-size:14px">${ls.filter((l) => seen.has(l.n)).length}/${ls.length}</span></h3><div class="au-grid">${ls.map((l) => seen.has(l.n) ? `<div class="au-tile${nailed.has(l.n) ? ' star' : ''}"><div class="th">${thumb(l)}</div>${esc(l.n)}<b>${short(l.p)}${nailed.has(l.n) ? ' ⭐' : ''}</b></div>` : `<div class="au-tile locked"><div class="th">?</div>Not seen yet<b>???</b></div>`).join('')}</div>`;
    }).join('');
    showExtra(`<p class="c-muted" style="margin:0">You have seen ${save.seen.length} of ${LOTS.length} lots. ⭐ marks lots you priced within a whisker.</p>${html}`, 'Catalogue');
  });
  $('badgeBtn').addEventListener('click', () => {
    const got = new Set(save.badges);
    const hist = save.history.slice(0, 8).map((h) => `<li>${h.d} · ${MODES.find((m) => m.id === h.m)?.name || h.m} · <b>${h.value.toLocaleString('en-US')}</b></li>`).join('');
    showExtra(`<div class="au-badges">${BADGES.map(([id, ic, name, desc]) => `<div class="au-badge${got.has(id) ? ' got' : ''}"><i>${ic}</i><div><b>${name}</b><small>${desc}</small></div></div>`).join('')}</div>
      <h3 style="margin:18px 0 6px">Recent sales</h3>${hist ? `<ul style="margin:0;padding-left:18px">${hist}</ul>` : '<p class="c-muted">No sales yet.</p>'}
      <p class="c-muted" style="margin-top:12px">Perfect bids: ${save.perfect} · Lots priced within a whisker: ${save.nailed.length}</p>`, `Badges ${save.badges.length}/${BADGES.length}`);
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input[type=text],textarea')) return;
    if ($('play').hidden) return;
    const k = e.key;
    if (mode === 'hl' && !busy) {
      if (k === '1' || k === 'ArrowLeft') { e.preventDefault(); hlPick(0); }
      else if (k === '2' || k === 'ArrowRight') { e.preventDefault(); hlPick(1); }
      return;
    }
    if (mode === 'war') {
      if (k === ' ' && war && !war.done && war.me) { e.preventDefault(); dropOut(); }
      else if (k === 'Enter' && $('next') && document.activeElement !== $('next')) { e.preventDefault(); $('next').click(); }
      return;
    }
    if (k === 'Enter') {
      if ($('next') && !$('next').hidden && document.activeElement !== $('next')) { e.preventDefault(); $('next').click(); }
      else if ($('lock') && !busy && document.activeElement !== $('lock')) { e.preventDefault(); lockIn(guessVal()); }
    } else if ((k === 'ArrowLeft' || k === 'ArrowRight') && $('range') && document.activeElement !== $('range') && !busy) {
      e.preventDefault(); nudge(k === 'ArrowLeft' ? -0.02 : 0.02);
    } else if (/^[1-4]$/.test(k) && !busy) {
      const b = document.querySelectorAll('.au-opt')[Number(k) - 1]; if (b) b.click();
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode === 'war' && war && !war.done && !$('play').hidden) {
      clearTimers();
      const resume = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', resume); if (war && !war.done) later(warTick, 600); } };
      document.addEventListener('visibilitychange', resume);
    }
  });

  renderMenu();
  window.__auction = { LOTS, start, get state() { return { mode, round, score, rounds, busy, results, war, hl }; } };
})();
