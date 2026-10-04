(() => {
  const SIMPLE = Curio.simple;
  const $ = (s) => document.querySelector(s);
  const stage = $('#stage'), svg = $('#svg'), laserEl = $('#laser'), hint = $('#hint');
  const el = (id) => document.getElementById(id);
  const head = el('head'), cat = el('cat'), body = el('body'), tail = el('tail'), earL = el('earL'), earR = el('earR');
  const lidL = el('lidL'), lidR = el('lidR'), lidLo = el('lidLo'), lidRo = el('lidRo');
  const pupL = el('pupL'), pupR = el('pupR'), hiL = el('hiL'), hiR = el('hiR');
  const mouth = el('mouth'), mouthOpen = el('mouthOpen'), blushL = el('blushL'), blushR = el('blushR');
  const browL = el('browL'), browR = el('browR'), whiskers = el('whiskers');

  const stats = Object.assign({ pets: 0, treats: 0, catches: 0, bites: 0 }, Curio.store.get('pc:stats', {}) || {});
  const saveStats = () => { Curio.store.set('pc:stats', stats); paintStats(); };
  function paintStats() { $('#sYarn').textContent = Curio.fmt(stats.yarn || 0); $('#sPets').textContent = Curio.fmt(stats.pets); $('#sTreats').textContent = Curio.fmt(stats.treats); $('#sCatch').textContent = Curio.fmt(stats.catches); $('#sBites').textContent = Curio.fmt(stats.bites); }

  const S = {
    purr: 0, irr: 0, idle: 0, petting: 0, contPet: 0, bellyT: 0, bellyOut: 0, petDist: 0,
    lid: .08, lidLo: 0, pupil: 7, px: 0, py: 0, ear: 0, tailA: 0, t: 0,
    blinkT: 3, blinkHold: 0, slowBlink: 0, heartT: 0, zT: 0, buttCool: 0,
    bite: 0, sulk: 0, eat: 0, laser: false, pounce: 0, pounceCool: 0, look: null, mood: '', headbuttCool: 4, trapWarned: false
  };
  const H = { x: 0, y: 0, r: 0, s: 1 }, HT = { x: 0, y: 0, r: 0, s: 1 };
  const C = { x: 0, y: 0, s: 1, r: 0 }, CT = { x: 0, y: 0, s: 1, r: 0 };
  let pointer = null, lastMove = 0, lastPt = null, treatTimes = [];

  const toSvg = (cx, cy) => { const r = stage.getBoundingClientRect(); const k = 400 / r.width; return [(cx - r.left) * k, (cy - r.top) * k]; };
  const toStage = (sx, sy) => { const r = stage.getBoundingClientRect(); const k = r.width / 400; return [sx * k, sy * k]; };

  function zoneAt(x, y) {
    const hx = x - H.x, hy = y - H.y;
    const inHead = Math.pow((hx - 200) / 114, 2) + Math.pow((hy - 160) / 96, 2) <= 1 || (hy < 120 && hy > 20 && Math.abs(hx - 200) < 92);
    if (inHead) {
      if (hy > 212 && Math.abs(hx - 200) < 62) return 'chin';
      if (Math.abs(hx - 200) > 60 && hy > 150) return 'cheeks';
      return 'head';
    }
    if (Math.pow((x - 200) / 58, 2) + Math.pow((y - 330) / 74, 2) <= 1) return 'belly';
    if (y > 390 && Math.abs(x - 200) < 76) return 'paws';
    if (x > 296 && y > 170 && y < 400) return 'tail';
    if (Math.abs(x - 200) < 104 && y > 196 && y < 414) return 'back';
    return null;
  }
  const ZONE = { head: [1, 0], cheeks: [1.5, 0], chin: [1.6, 0], back: [.8, 0], paws: [.2, .012], tail: [0, .07], belly: [1.2, 0] };
  const CATS = [
    { id: 'biscuit', name: 'Biscuit', breed: 'Ginger tabby', fav: 'cheeks', pat: 1, quirk: 'Food motivated. Very.', c: { fur: ['#ffb877', '#f08a3e'], base: '#f08a3e', line: '#c9652a', stripe: '#d06a2b', t1: '#e07b39', t2: '#f39a52', light: '#ffe4c7', lid2: '#f6a865', iris: ['#d4e157', '#8bc34a', '#558b2f'] } },
    { id: 'mochi', name: 'Mochi', breed: 'White fluff', fav: 'head', pat: 1.25, quirk: 'Gentle soul. Loves head scratches.', c: { fur: ['#ffffff', '#e6e3df'], base: '#f2efeb', line: '#b8b2aa', stripe: '#e2ddd6', t1: '#dedad4', t2: '#f4f1ed', light: '#ffffff', lid2: '#ebe7e2', iris: ['#b3e5fc', '#4fc3f7', '#0277bd'] } },
    { id: 'shadow', name: 'Shadow', breed: 'Black cat', fav: 'chin', pat: .85, quirk: 'Mysterious. Secretly a chin-scratch addict.', c: { fur: ['#55555e', '#26262b'], base: '#2c2c31', line: '#121214', stripe: '#232327', t1: '#1d1d21', t2: '#38383e', light: '#44444c', lid2: '#3a3a40', iris: ['#ffe082', '#ffb300', '#e65100'] } },
    { id: 'earl', name: 'Earl', breed: 'Tuxedo', fav: 'back', pat: 1, quirk: 'Very formal. Enjoys a firm back stroke.', c: { fur: ['#4a4a52', '#222226'], base: '#2b2b2f', line: '#111113', stripe: '#26262a', t1: '#1d1d20', t2: '#333338', light: '#f7f7f7', lid2: '#3a3a40', iris: ['#c5e1a5', '#7cb342', '#33691e'] } },
    { id: 'pebble', name: 'Pebble', breed: 'Grey tabby', fav: 'cheeks', pat: 1.1, quirk: 'Chill. Will nap on anything warm.', c: { fur: ['#c2c2ca', '#8a8a93'], base: '#93939b', line: '#5f5f66', stripe: '#5a5a62', t1: '#77777f', t2: '#a2a2aa', light: '#ececf1', lid2: '#a6a6ae', iris: ['#fff59d', '#cddc39', '#827717'] } },
    { id: 'duchess', name: 'Duchess', breed: 'Siamese', fav: 'chin', pat: .7, quirk: 'A diva. Short fuse, big opinions.', c: { fur: ['#fff6ea', '#e3cfb2'], base: '#6d4c41', line: '#8d6e63', stripe: '#d8c2a2', t1: '#5d4037', t2: '#6d4c41', light: '#fff8ee', lid2: '#e3cfb2', iris: ['#b3e5fc', '#29b6f6', '#01579b'] } },
    { id: 'patches', name: 'Patches', breed: 'Calico', fav: 'head', pat: 1, quirk: 'Three colours, three moods, one cat.', c: { fur: ['#fff7ec', '#ead9c2'], base: '#e07b39', line: '#a1887f', stripe: '#3e3a39', t1: '#3e3a39', t2: '#e07b39', light: '#ffffff', lid2: '#efe0cc', iris: ['#dcedc8', '#9ccc65', '#558b2f'] } }
  ];
  const save0 = Curio.store.get('pc:cats', null);
  const cats = Object.assign({ v: 1, cur: 'biscuit', bond: {}, fav: [] }, save0 && save0.v === 1 ? save0 : {});
  if (typeof cats.bond !== 'object' || !cats.bond) cats.bond = {};
  if (!Array.isArray(cats.fav)) cats.fav = [];
  const saveCats = () => Curio.store.set('pc:cats', cats);
  const totalBond = () => CATS.reduce((a, c) => a + (cats.bond[c.id] || 0), 0);
  const unlockedCat = (i) => i === 0 || totalBond() >= i * 2;
  let CAT = SIMPLE ? CATS[0] : CATS.find((c) => c.id === cats.cur) || CATS[0];
  if (!unlockedCat(CATS.indexOf(CAT))) CAT = CATS[0];
  function applyCat() {
    const c = CAT.c;
    const set = (id, cols) => { document.querySelectorAll(`#${id} stop`).forEach((st, i) => st.setAttribute('stop-color', cols[i] || cols[cols.length - 1])); };
    set('fur', c.fur); set('iris', c.iris);
    const v = { base: c.base, line: c.line, stripe: c.stripe, t1: c.t1, t2: c.t2, light: c.light, lid2: c.lid2 };
    for (const k in v) stage.style.setProperty(`--c-${k}`, v[k]);
    stage.setAttribute('aria-label', `${CAT.name} the ${CAT.breed.toLowerCase()}. Move your pointer or finger across it to pet it.`);
    $('#catName').textContent = `${CAT.name} · ${CAT.breed}`;
    $('#catQuirk').textContent = CAT.quirk + (cats.fav.includes(CAT.id) ? ` Favourite spot: ${CAT.fav}.` : ' Favourite spot: ???');
    paintRoster();
  }
  function paintRoster() {
    $('#roster').innerHTML = CATS.map((c, i) => {
      const ok = unlockedCat(i), b = cats.bond[c.id] || 0;
      return `<button type="button" class="pc-cat${c === CAT ? ' on' : ''}" data-i="${i}" ${ok ? '' : 'disabled'} title="${ok ? `${c.name}, ${c.breed}` : `Unlocks at ${i * 2} total bond hearts`}"><i style="background:radial-gradient(circle at 40% 35%, ${c.c.fur[0]}, ${c.c.base})"><em style="background:${c.c.iris[1]}"></em><em style="background:${c.c.iris[1]}"></em></i><b>${ok ? c.name : '🔒'}</b><small>${ok ? '♥'.repeat(b) + '♡'.repeat(5 - b) : `${i * 2} ♥`}</small></button>`;
    }).join('');
    $('#bondTotal').textContent = `${totalBond()} bond hearts`;
  }
  let blissT = 0, bondCool = 0;
  function checkBond(dt) {
    bondCool = Math.max(0, bondCool - dt);
    if (S.purr >= 94 && !S.bite) blissT += dt; else blissT = Math.max(0, blissT - dt * 2);
    if (blissT > 4 && bondCool <= 0) {
      blissT = 0; bondCool = 25;
      const b = cats.bond[CAT.id] || 0;
      award('bliss');
      if (b < 5) {
        const before = CATS.map((c, i) => unlockedCat(i));
        cats.bond[CAT.id] = b + 1; saveCats();
        fx('word', `+1 bond ♥`, 200, 30);
        Curio.beep(880, .1, 'triangle', .08); setTimeout(() => Curio.beep(1320, .14, 'triangle', .08), 100);
        CATS.forEach((c, i) => { if (!before[i] && unlockedCat(i)) { Curio.confetti(100); Curio.toast(`🐾 ${c.name} the ${c.breed.toLowerCase()} wants to meet you!`, 3000); } });
        if (CATS.every((c, i) => unlockedCat(i))) award('allcats');
        if (cats.bond[CAT.id] >= 5) award('bff');
        paintRoster();
      }
    }
  }
  const ACH = { bliss: ['😻', 'Pure bliss'], fav: ['🎯', 'Found a sweet spot'], allfav: ['🗺️', 'Knows every cat'], allcats: ['🏠', 'Full house'], bff: ['💞', 'Best friends'], yarn: ['🧶', 'Yarn champion'], bitten: ['🩹', 'Did not read the room'], hunter: ['🔴', 'Laser master'] };
  let ach = Curio.store.get('pc:ach', []);
  if (!Array.isArray(ach)) ach = [];
  function award(id) { if (SIMPLE || ach.includes(id)) return; ach.push(id); Curio.store.set('pc:ach', ach); Curio.toast(`${ACH[id][0]} ${ACH[id][1]}`, 2400); paintAch(); }
  function paintAch() { $('#ach').innerHTML = Object.entries(ACH).map(([id, [e, n]]) => `<span class="${ach.includes(id) ? 'on' : ''}" title="${n}">${e}</span>`).join(''); }

  let audio = null;
  function ensureAudio() {
    if (audio) { if (audio.ac.state === 'suspended') audio.ac.resume(); return audio; }
    const ac = Curio.audioContext && Curio.audioContext();
    if (!ac) return null;
    const len = ac.sampleRate * 2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + .04 * (Math.random() * 2 - 1)) / 1.04; d[i] = last * 3.5; }
    const src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320;
    const am = ac.createGain(); am.gain.value = .5;
    const lfo = ac.createOscillator(); lfo.frequency.value = 24;
    const lfoG = ac.createGain(); lfoG.gain.value = .5;
    lfo.connect(lfoG).connect(am.gain);
    const rumble = ac.createOscillator(); rumble.type = 'triangle'; rumble.frequency.value = 48;
    const rg = ac.createGain(); rg.gain.value = .25;
    rumble.connect(rg).connect(am);
    const master = ac.createGain(); master.gain.value = 0;
    src.connect(lp).connect(am).connect(master).connect(ac.destination);
    src.start(); lfo.start(); rumble.start();
    audio = { ac, master, lfo };
    hint.textContent = 'Stroke slowly. Try the cheeks and chin.';
    return audio;
  }
  function purrAudio(dt) {
    if (!audio) return;
    const ac = audio.ac;
    const breath = (Math.sin(S.t * Math.PI * 2 / 2.4) + 1) / 2;
    let level = S.purr > 8 && !S.bite && !S.sulk ? (S.purr / 100) * (.35 + .65 * breath) * .55 : 0;
    if (Curio.muted || document.hidden) level = 0;
    audio.master.gain.setTargetAtTime(level, ac.currentTime, .08);
    audio.lfo.frequency.setTargetAtTime(breath > .5 ? 25 : 21, ac.currentTime, .2);
  }
  function noiseBurst(dur, type, freq, vol) {
    if (Curio.muted) return;
    const ac = Curio.audioContext && Curio.audioContext(); if (!ac) return;
    const n = Math.floor(ac.sampleRate * dur);
    const b = ac.createBuffer(1, n, ac.sampleRate); const d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.min(1, i / (n * .1)) * Math.pow(1 - i / n, 1.5);
    const s = ac.createBufferSource(); s.buffer = b;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(ac.destination); s.start();
  }
  function meow(p = 1) {
    if (Curio.muted) return;
    const ac = Curio.audioContext && Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(420 * p, t); o.frequency.linearRampToValueAtTime(760 * p, t + .16); o.frequency.linearRampToValueAtTime(520 * p, t + .5);
    const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 4;
    f1.frequency.setValueAtTime(700, t); f1.frequency.linearRampToValueAtTime(1500, t + .18); f1.frequency.linearRampToValueAtTime(900, t + .5);
    const g = ac.createGain();
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .06); g.gain.setValueAtTime(.3, t + .3); g.gain.exponentialRampToValueAtTime(.0001, t + .55);
    o.connect(f1).connect(g).connect(ac.destination); o.start(t); o.stop(t + .6);
  }

  function fx(cls, text, sx, sy) {
    const [x, y] = toStage(sx, sy);
    const d = document.createElement('div');
    d.className = 'pc-fx ' + cls; d.textContent = text;
    d.style.left = x + 'px'; d.style.top = y + 'px';
    stage.append(d); setTimeout(() => d.remove(), cls === 'z' ? 2200 : 1100);
  }
  const heart = () => fx('heart', '♥', 200 + H.x + Curio.rand(-90, 90), 70 + H.y + Curio.rand(-20, 30));

  function setMood(m) {
    if (S.mood === m) return;
    S.mood = m;
    const md = $('#mood'); md.textContent = m; md.classList.remove('pop'); void md.offsetWidth; md.classList.add('pop');
  }

  function onMove(e) {
    const now = performance.now();
    const [sx, sy] = toSvg(e.clientX, e.clientY);
    pointer = { sx, sy, cx: e.clientX, cy: e.clientY };
    if (S.laser) {
      const r = stage.getBoundingClientRect();
      laserEl.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
      laserEl.hidden = S.dotHidden > 0;
      S.idle = 0;
      return;
    }
    if (e.pointerType !== 'mouse' && !e.isPrimary) return;
    const dtm = Math.max(8, Math.min(120, now - lastMove));
    lastMove = now;
    if (!lastPt) { lastPt = [e.clientX, e.clientY]; return; }
    const d = Math.hypot(e.clientX - lastPt[0], e.clientY - lastPt[1]);
    lastPt = [e.clientX, e.clientY];
    const zone = zoneAt(sx, sy);
    if (!zone || d < .5 || d > 140) return;
    const speed = d / dtm * 1000;
    S.spd = (S.spd || 0) * .8 + speed * .2;
    S.idle = 0;
    S.petting = .25;
    let [pm, im] = ZONE[zone];
    if (zone === CAT.fav) {
      pm *= 1.8;
      if (!cats.fav.includes(CAT.id) && S.purr > 40) { cats.fav.push(CAT.id); saveCats(); fx('word', `${CAT.fav}! the good spot`, sx, sy - 20); award('fav'); if (cats.fav.length >= CATS.length) award('allfav'); applyCat(); }
    }
    let gain = 0, irr = 0;
    if (S.spd < 50) { gain = 0; }
    else if (S.spd < 1500) gain = .04 * pm * Math.min(d, 30);
    else { gain = .008 * pm * Math.min(d, 30); irr += .025 * Math.min(d, 30) * Math.min(3, S.spd / 1500); }
    irr += im * Math.min(d, 30);
    if (zone === 'belly') {
      S.bellyT += dtm / 1000; S.bellyOut = 0;
      if (S.bellyT > 1.3) { irr += .35 * Math.min(d, 30); gain = 0; if (!S.trapWarned) { S.trapWarned = true; fx('word', 'IT WAS A TRAP', 200, 300); } }
    }
    if (S.sulk > 0) { irr += .05 * d; gain *= .1; }
    if (S.eat > 0) gain *= .5;
    S.purr = Math.min(100, S.purr + gain);
    S.irr = Math.min(110, S.irr + irr / CAT.pat);
    if (gain > 0) { S.petDist += d; if (S.petDist > 420) { S.petDist = 0; stats.pets++; saveStats(); } }
  }
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerleave', () => { lastPt = null; pointer = null; if (S.laser) laserEl.hidden = true; });
  let downAt = null;
  stage.addEventListener('pointerdown', (e) => {
    ensureAudio();
    lastPt = [e.clientX, e.clientY]; lastMove = performance.now();
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (S.laser) onMove(e);
  });
  stage.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'mouse') lastPt = null;
    if (!downAt || S.laser) return;
    if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 8 && performance.now() - downAt.t < 350) {
      const [sx, sy] = toSvg(e.clientX, e.clientY);
      const z = zoneAt(sx, sy);
      if (!z) return;
      S.idle = 0;
      if (Math.hypot(sx - 200 - H.x, sy - 197 - H.y) < 22) {
        fx('word', Math.random() < .2 ? 'achoo!' : 'boop!', 200, 170);
        S.blinkHold = .25; Curio.beep(1200, .05, 'sine', .08);
      } else if (z === 'belly') {
        S.irr = Math.min(110, S.irr + 25);
      } else if (!S.bite && !S.sulk) {
        meow(Curio.rand(.9, 1.2)); fx('word', Curio.pick(['mrrp?', 'meow', 'mew', 'mrrow']), 200, 50);
      }
    }
    downAt = null;
  });

  $('#treat').addEventListener('click', () => {
    ensureAudio();
    S.idle = 0;
    const now = performance.now();
    treatTimes = treatTimes.filter((t) => now - t < 60000);
    if (S.eat > 0) return;
    if (treatTimes.length >= 5) {
      HT.r = -14; S.lookAway = 1.8;
      Curio.toast('The cat is full. And judging you.');
      fx('word', 'no thank you', 200, 40);
      return;
    }
    treatTimes.push(now);
    const t = document.createElement('div');
    t.className = 'pc-treat';
    t.innerHTML = '<svg viewBox="0 0 46 26" width="46" height="26"><path d="M4 13C10 3 26 2 34 13 26 24 10 23 4 13z" fill="#ff8a65" stroke="#d84315" stroke-width="2"/><path d="M34 13l10-8v16z" fill="#ff8a65" stroke="#d84315" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="11" r="2" fill="#3e2723"/><path d="M18 9q3 4 0 8M23 8q3 5 0 10" stroke="#d84315" stroke-width="1.6" fill="none"/></svg>';
    const [x0, y0] = toStage(200, -10), [x1, y1] = toStage(200, 398);
    t.style.left = x0 + 'px'; t.style.top = y0 + 'px';
    stage.append(t);
    requestAnimationFrame(() => requestAnimationFrame(() => { t.style.top = y1 + 'px'; }));
    S.look = [200, 398];
    Curio.beep(700, .06, 'sine', .06);
    setTimeout(() => {
      S.eat = 1.6;
      let k = 0;
      const nom = setInterval(() => {
        k++;
        fx('word', 'nom', 200 + Curio.rand(-40, 40), 300);
        Curio.beep(260 + k * 30, .06, 'triangle', .1);
        if (k === 2) t.style.opacity = '0';
        if (k >= 3) { clearInterval(nom); t.remove(); }
      }, 420);
      S.purr = Math.min(100, S.purr + 28); S.irr = Math.max(0, S.irr - 45); S.sulk = 0;
      stats.treats++; saveStats();
      setTimeout(() => { S.look = null; heart(); heart(); if (Math.random() < .6) meow(1.15); }, 1500);
    }, 650);
  });

  $('#blink').addEventListener('click', () => {
    ensureAudio();
    S.idle = 0;
    if (S.lid > .85) { Curio.toast('The cat is asleep. It slow-blinked in its dreams, probably.'); return; }
    if (S.irr > 55 || S.bite || S.sulk) { Curio.toast('The cat stares back. Unblinking. Not now.'); return; }
    Curio.toast('You slowly blink at the cat...');
    setTimeout(() => {
      S.slowBlink = 1.6;
      S.purr = Math.min(100, S.purr + 15);
      setTimeout(() => { heart(); heart(); heart(); Curio.toast('It slow-blinked back. That is cat for "I love you."'); }, 900);
    }, 800);
  });

  const laserBtn = $('#laserBtn');
  laserBtn.addEventListener('click', () => {
    ensureAudio();
    S.laser = !S.laser;
    laserBtn.setAttribute('aria-pressed', S.laser);
    stage.classList.toggle('laser-on', S.laser);
    laserEl.hidden = true;
    S.idle = 0; S.lidSnap = 1;
    hint.textContent = S.laser ? 'Move the red dot around. Hold it still and the cat will pounce.' : 'Stroke slowly. Try the cheeks and chin.';
    if (!S.laser) { CT.x = CT.y = CT.r = 0; CT.s = 1; }
  });
  let dotHist = [];

  function bite() {
    S.bite = 1; stats.bites++; saveStats();
    if (stats.bites >= 5) award('bitten');
    if (SIMPLE && !ended) { sessionBites++; if (sessionBites >= 3) setTimeout(() => endSimple('bite'), 900); else think(sessionBites === 1 ? 'Strike one. I keep a list.' : 'Strike two. My lawyer is a raccoon.'); }
    noiseBurst(.55, 'highpass', 2600, .5);
    stage.classList.remove('shake'); void stage.offsetWidth; stage.classList.add('shake');
    fx('word', Curio.pick(['CHOMP!', 'BITE!', 'HISSS!', 'NOM (angry)']), pointer ? pointer.sx : 200, pointer ? pointer.sy : 200);
    if (navigator.vibrate) try { navigator.vibrate(80); } catch {}
    if (pointer) { const dx = pointer.sx - 200, dy = pointer.sy - 170, d = Math.hypot(dx, dy) || 1; HT.x = dx / d * 30; HT.y = dy / d * 24; }
    HT.s = 1.12;
    setTimeout(() => { S.bite = 0; S.sulk = 3.2; HT.x = 0; HT.y = 0; HT.s = 1; S.irr = 55; S.purr = 0; S.bellyT = 0; }, 700);
  }

  function update(dt) {
    S.t += dt;
    const awake = S.lid < .9;
    if (S.petting > 0) { S.petting -= dt; S.contPet += dt; } else { S.contPet = Math.max(0, S.contPet - dt * 3); }
    S.idle += dt;
    if (S.petting <= 0) { S.purr = Math.max(0, S.purr - dt * 3.2); S.irr = Math.max(0, S.irr - dt * (S.sulk ? 4 : 9)); }
    if (S.contPet > 22) S.irr += dt * 2.2;
    S.bellyOut += dt; if (S.bellyOut > .6) { S.bellyT = Math.max(0, S.bellyT - dt * 2); if (S.bellyT === 0) S.trapWarned = false; }
    if (S.sulk > 0) S.sulk -= dt;
    if (S.eat > 0) S.eat -= dt;
    if (S.slowBlink > 0) S.slowBlink -= dt;
    if (S.lookAway > 0) { S.lookAway -= dt; if (S.lookAway <= 0) HT.r = 0; }
    if (S.irr >= 100 && !S.bite && !S.laser) bite();
    S.headbuttCool -= dt;

    const asleep = !S.laser && S.idle > 28 && S.purr < 60;
    const sleepy = !S.laser && S.idle > 14;
    let mood, mk;
    if (S.bite) mk = 'annoyed';
    else if (S.sulk > 0) mk = 'sulk';
    else if (S.laser) mk = 'hunting';
    else if (S.eat > 0) mk = 'munching';
    else if (S.irr > 62) mk = 'annoyed';
    else if (S.irr > 35) mk = 'twitchy';
    else if (asleep) mk = 'asleep';
    else if (S.purr > 72) mk = 'bliss';
    else if (S.purr > 30) mk = 'happy';
    else if (sleepy) mk = 'sleepy';
    else mk = 'curious';
    S.mk = mk;
    thinkT -= dt;
    if (thinkT <= 0) { thinkT = Curio.rand(5, 9); think(); }
    if (SIMPLE && !ended) {
      if (S.purr >= 88 && !S.bite) napT += dt; else napT = Math.max(0, napT - dt * .4);
      $('#napBar').style.width = Math.min(100, napT / NAP * 100) + '%';
      if (napT >= NAP) endSimple('nap');
    }
    if (S.bite) mood = '😾 CHOMP';
    else if (S.sulk > 0) mood = '😤 Sulking';
    else if (S.laser) mood = S.pounce > 0 ? '🐾 POUNCE!' : '😼 Hunting';
    else if (S.eat > 0) mood = '😋 Munching';
    else if (S.irr > 62) mood = '😾 Annoyed. Back off.';
    else if (S.irr > 35) mood = '😼 Getting twitchy';
    else if (asleep) mood = '😴 Asleep';
    else if (S.purr > 72) mood = '😻 Blissful';
    else if (S.purr > 30) mood = '😺 Happy';
    else if (sleepy) mood = '😪 Sleepy';
    else mood = '🐱 Curious';
    setMood(mood);

    let lidT = .08, lo = 0, pup = 7, ear = Math.sin(S.t * .7) * 2, tailF = 1.2, tailAmp = 7;
    if (S.purr > 30) { lidT = .22; lo = .3; pup = 6; tailF = 1; tailAmp = 5; }
    if (S.purr > 72) { lidT = .42; lo = .55; }
    if (sleepy) lidT = Math.max(lidT, .55);
    if (asleep) { lidT = 1; lo = 0; tailF = .4; tailAmp = 2; }
    if (S.irr > 35) { tailF = 4.5; tailAmp = 13; ear = -14; pup = 4.5; lidT = .26; lo = 0; }
    if (S.irr > 62 || S.sulk > 0) { tailF = 8; tailAmp = 24; ear = -38; pup = 3.5; lidT = .36; }
    if (S.bite) { ear = -45; lidT = .1; pup = 3; }
    if (S.laser) { lidT = .02; lo = 0; pup = 14; ear = 6; tailF = 9; tailAmp = 4; }
    if (S.look) pup = 12;
    if (S.eat > 0) { lidT = .5; lo = .5; }
    S.blinkT -= dt;
    if (S.blinkT <= 0 && awake) { S.blinkHold = .13; S.blinkT = Curio.rand(2.5, 6.5); }
    if (S.blinkHold > 0) { S.blinkHold -= dt; lidT = 1; }
    if (S.slowBlink > 0) lidT = S.slowBlink > .4 ? 1 : lidT;
    if (!S.laser && S.purr > 48 && awake && S.slowBlink <= 0 && Math.random() < dt * .08) S.slowBlink = 1.4;
    const lidSpeed = S.blinkHold > 0 ? 40 : S.slowBlink > 0 ? 3 : asleep ? 1.2 : 6;
    S.lid += (lidT - S.lid) * Math.min(1, dt * lidSpeed);
    S.lidLo += (lo - S.lidLo) * Math.min(1, dt * 5);
    S.pupil += (pup - S.pupil) * Math.min(1, dt * 6);
    S.ear += (ear - S.ear) * Math.min(1, dt * 8);

    let target = S.look || (S.laser && !laserEl.hidden && pointer ? [pointer.sx, pointer.sy] : pointer ? [pointer.sx, pointer.sy] : null);
    if (S.lookAway > 0 || S.sulk > 0) target = [-300, 120];
    let tx = 0, ty = 0;
    if (target) { const dx = target[0] - 200, dy = target[1] - 150, d = Math.hypot(dx, dy) || 1; const m = Math.min(8, d / 18); tx = dx / d * m; ty = dy / d * m * .8; }
    S.px += (tx - S.px) * Math.min(1, dt * 10); S.py += (ty - S.py) * Math.min(1, dt * 10);

    if (S.laser) {
      CT.y = 14; CT.s = .97;
      if (pointer && !laserEl.hidden) {
        const now = performance.now();
        dotHist.push([now, pointer.cx, pointer.cy]);
        dotHist = dotHist.filter((p) => now - p[0] < 700);
        const still = dotHist.length > 3 && now - dotHist[0][0] > 600 && dotHist.every((p) => Math.hypot(p[1] - pointer.cx, p[2] - pointer.cy) < 12);
        HT.r = Math.max(-12, Math.min(12, (pointer.sx - 200) / 14));
        S.pounceCool -= dt;
        if (still && S.pounce <= 0 && S.pounceCool <= 0) {
          S.wiggle = .5; S.pounce = .9; S.pounceCool = 1.4;
          S.pounceAt = [pointer.cx, pointer.cy];
          S.pounceTarget = [Math.max(-120, Math.min(120, (pointer.sx - 200) * .7)), Math.max(-90, Math.min(30, (pointer.sy - 330) * .5))];
        }
      }
      if (S.pounce > 0) {
        S.pounce -= dt;
        if (S.wiggle > 0) { S.wiggle -= dt; CT.r = Math.sin(S.t * 60) * 2.5; if (S.wiggle <= 0) { CT.r = 0; CT.x = S.pounceTarget[0]; CT.y = S.pounceTarget[1]; CT.s = 1.06; noiseBurst(.12, 'lowpass', 900, .3); } }
        else if (!S.pounceJudged && S.pounce < .3) {
          S.pounceJudged = true;
          const got = pointer && Math.hypot(pointer.cx - S.pounceAt[0], pointer.cy - S.pounceAt[1]) < 40;
          if (got) { stats.catches++; saveStats(); if (stats.catches >= 10) award('hunter'); fx('word', Curio.pick(['Gotcha!', 'GOT IT', 'Mine!']), 200, 60); [700, 900, 1200].forEach((f, i) => setTimeout(() => Curio.beep(f, .08, 'triangle', .08), i * 70)); S.dotHidden = .9; laserEl.hidden = true; }
          else { fx('word', Curio.pick(['Missed!', 'Huh?', 'Where did it go']), 200, 60); }
        }
        if (S.pounce <= 0) { CT.x = 0; CT.y = 14; CT.s = .97; S.pounceJudged = false; }
      }
      if (S.dotHidden > 0) { S.dotHidden -= dt; if (S.dotHidden <= 0 && pointer) laserEl.hidden = false; }
    } else if (!S.bite) {
      if (!S.lookAway) HT.r = S.sulk > 0 ? -12 : 0;
    }

    if (S.eat > 0) { HT.y = 34 + Math.abs(Math.sin(S.t * 8)) * 8; } else if (!S.bite && !S.headbutt) HT.y = asleep ? 10 : 0;
    if (!S.laser && !S.bite && S.purr > 70 && pointer && S.headbuttCool <= 0 && Math.random() < dt * .6) {
      S.headbuttCool = Curio.rand(3, 6);
      const dx = pointer.sx - 200, dy = pointer.sy - 160, d = Math.hypot(dx, dy) || 1;
      if (d < 220) {
        S.headbutt = .45; HT.x = dx / d * 24; HT.y = dy / d * 16; HT.r = dx > 0 ? 10 : -10; HT.s = 1.07;
        fx('word', 'bonk', pointer.sx, pointer.sy - 20); heart();
        Curio.beep(180, .08, 'sine', .15);
        S.purr = Math.min(100, S.purr + 5);
      }
    }
    if (S.headbutt > 0) { S.headbutt -= dt; if (S.headbutt <= 0) { S.headbutt = 0; HT.x = 0; HT.y = 0; HT.r = 0; HT.s = 1; } }

    const k = Math.min(1, dt * (S.bite ? 18 : 9));
    for (const p in H) H[p] += (HT[p] - H[p]) * k;
    const kc = Math.min(1, dt * (S.pounce > 0 && S.wiggle <= 0 ? 16 : 7));
    for (const p in C) C[p] += (CT[p] - C[p]) * kc;
    S.tailA = Math.sin(S.t * tailF) * tailAmp + (S.irr > 62 ? Math.sin(S.t * 23) * 5 : 0);

    if (S.purr > 50 && !S.bite) { S.heartT -= dt * (S.purr / 100); if (S.heartT <= 0) { S.heartT = 1.3; heart(); } }
    if (asleep) { S.zT -= dt; if (S.zT <= 0) { S.zT = 1.6; fx('z', 'z', 260 + Curio.rand(0, 30), 80); } }
    checkBond(dt);
    updateYarn(dt);
  }

  const yarnEl = $('#yarn');
  let yarn = null, swipe = 0, swipeSide = 1;
  function startYarn() {
    ensureAudio();
    if (S.laser) $('#laserBtn').click();
    S.idle = 0;
    const fromLeft = Math.random() < .5;
    yarn = { x: fromLeft ? -30 : 430, y: 380, vx: fromLeft ? 170 : -170, vy: -120, t: 0, hits: 0, spin: 0 };
    yarnEl.hidden = false;
    Curio.beep(500, .05, 'triangle', .06);
  }
  function updateYarn(dt) {
    if (swipe > 0) swipe -= dt;
    if (!yarn) return;
    yarn.t += dt;
    yarn.vy += 520 * dt;
    yarn.x += yarn.vx * dt; yarn.y += yarn.vy * dt;
    yarn.spin += yarn.vx * dt * 2;
    if (yarn.y > 400) { yarn.y = 400; yarn.vy = -Math.abs(yarn.vy) * .55; yarn.vx *= .9; if (Math.abs(yarn.vy) > 60) Curio.beep(220, .03, 'sine', .04); }
    S.look = [yarn.x, yarn.y];
    S.idle = 0;
    if (swipe <= 0 && Math.abs(yarn.x - 200) < 95 && yarn.y > 340 && !S.bite && S.sulk <= 0) {
      swipe = .35; swipeSide = yarn.x < 200 ? -1 : 1;
      yarn.vx = swipeSide * Curio.rand(220, 320); yarn.vy = -Curio.rand(220, 360);
      yarn.hits++;
      S.purr = Math.min(100, S.purr + 6);
      noiseBurst(.08, 'bandpass', 1400, .25);
      fx('word', Curio.pick(['bap!', 'swat!', 'mine!', 'pew']), yarn.x, yarn.y - 30);
    }
    if (yarn.t > 9 || yarn.x < -80 || yarn.x > 480) {
      if (yarn.hits >= 5) { fx('word', `${yarn.hits} swats!`, 200, 40); }
      stats.yarn = (stats.yarn || 0) + yarn.hits; saveStats();
      if (yarn.hits >= 8) award('yarn');
      yarn = null; S.look = null; yarnEl.hidden = true;
    }
  }
  $('#yarnBtn').addEventListener('click', startYarn);
  $('#roster').addEventListener('click', (e) => {
    const b = e.target.closest('.pc-cat'); if (!b || b.disabled) return;
    const c = CATS[+b.dataset.i]; if (c === CAT) return;
    CAT = c; cats.cur = c.id; saveCats();
    Object.assign(S, { purr: 0, irr: 0, sulk: 0, bellyT: 0, idle: 0 });
    stage.classList.remove('swap'); void stage.offsetWidth; stage.classList.add('swap');
    applyCat();
    setTimeout(() => { meow(Curio.rand(.9, 1.3)); fx('word', Curio.pick(['mrrp?', 'hello', 'meow']), 200, 50); }, 350);
  });

  function render() {
    const breath = 1 + Math.sin(S.t * (S.lid > .9 ? 1.6 : 3)) * .012;
    cat.setAttribute('transform', `translate(${C.x} ${C.y}) translate(200 414) rotate(${C.r}) scale(${C.s}) translate(-200 -414)`);
    body.setAttribute('transform', `translate(200 414) scale(1 ${breath}) translate(-200 -414)`);
    head.setAttribute('transform', `translate(${H.x} ${H.y}) translate(200 190) rotate(${H.r}) scale(${H.s}) translate(-200 -190)`);
    tail.setAttribute('transform', `rotate(${S.tailA} 282 380)`);
    const sw = swipe > 0 ? Math.sin((1 - swipe / .35) * Math.PI) : 0;
    el('pawL').setAttribute('transform', swipeSide < 0 ? `translate(${-sw * 18} ${-sw * 46}) rotate(${-sw * 30} 164 408)` : '');
    el('pawR').setAttribute('transform', swipeSide > 0 ? `translate(${sw * 18} ${-sw * 46}) rotate(${sw * 30} 236 408)` : '');
    if (yarn) { const [yx, yy] = toStage(yarn.x, yarn.y); yarnEl.style.transform = `translate(${yx}px, ${yy}px) rotate(${yarn.spin}deg)`; }
    earL.setAttribute('transform', `rotate(${S.ear} 150 104)`);
    earR.setAttribute('transform', `rotate(${-S.ear} 250 104)`);
    const lh = S.lid * 62;
    lidL.setAttribute('height', lh); lidR.setAttribute('height', lh);
    const lo = S.lidLo * 22;
    lidLo.setAttribute('y', 182 - lo); lidLo.setAttribute('height', lo); lidRo.setAttribute('y', 182 - lo); lidRo.setAttribute('height', lo);
    const rx = S.pupil, ry = Math.max(rx, 21 - (S.pupil > 10 ? 3 : 0));
    pupL.setAttribute('cx', 158 + S.px); pupL.setAttribute('cy', 152 + S.py); pupL.setAttribute('rx', rx); pupL.setAttribute('ry', ry);
    pupR.setAttribute('cx', 242 + S.px); pupR.setAttribute('cy', 152 + S.py); pupR.setAttribute('rx', rx); pupR.setAttribute('ry', ry);
    hiL.setAttribute('cx', 166 + S.px * .5); hiL.setAttribute('cy', 142 + S.py * .5); hiR.setAttribute('cx', 250 + S.px * .5); hiR.setAttribute('cy', 142 + S.py * .5);
    const open = S.bite || (S.eat > 0 && Math.sin(S.t * 8) > 0) ? 1 : 0;
    mouthOpen.setAttribute('opacity', open); mouth.setAttribute('opacity', 1 - open);
    const bl = Math.max(0, (S.purr - 35) / 65);
    blushL.setAttribute('opacity', bl * .55); blushR.setAttribute('opacity', bl * .55);
    const brow = S.irr > 50 || S.bite || S.sulk > 0 ? 1 : 0;
    browL.setAttribute('opacity', brow); browR.setAttribute('opacity', brow);
    whiskers.setAttribute('transform', `translate(0 ${S.irr > 62 ? -4 : S.purr > 60 ? 2 : 0})`);
    $('#purrBar').style.width = S.purr + '%';
    const pat = Math.max(0, 100 - S.irr);
    const pb = $('#patBar'); pb.style.width = pat + '%';
    pb.style.backgroundColor = pat > 60 ? 'var(--good)' : pat > 30 ? 'var(--warn)' : 'var(--bad)';
  }

  const THOUGHTS = {
    curious: ['who are you. what do you want. do you have ham', 'I could knock something off a shelf right now. I will not. Probably.', 'your hand smells like a sandwich', 'is that a bird? no. is it a bird now?', 'I have been awake for nine minutes. I need a nap.'],
    happy: ['this human is acceptable', 'ok yes. there. THERE.', 'I will allow seven more pets', 'I am putting you in my will. You get the box.', 'do not stop. that is an order.'],
    bliss: ['I am a puddle now', 'I have forgotten what the floor is', 'you may live here now', 'motor running at one hundred percent', 'brrrrrrrrrrrrrr', 'I love you. I will deny this later.'],
    twitchy: ['careful', 'the tail is a warning system. it is warning.', 'one more and I start a podcast about you', 'I am counting. you are on four.'],
    annoyed: ['I will remember this', 'I know where you sleep', 'this is going in my diary', 'you have been reported to the cat council'],
    sulk: ['I am not talking to you', 'I am staring at the wall on purpose', 'that was assault, legally', 'I will forgive you in one to six business days'],
    asleep: ['zzz... ham... zzz', 'dreaming of 3am zoomies', 'zzz... the red dot... it is mine... zzz', 'zzz... knock it off the table... zzz'],
    sleepy: ['so... sleepy...', 'my eyes are just resting', 'loaf mode engaged', 'five more minutes. or hours.'],
    hunting: ['the dot. THE DOT.', 'I have trained my whole life for this', 'it mocks me', 'I will end you, small red sun'],
    munching: ['nom', 'best day of my life', 'this changes everything', 'more fish. immediately.', 'I would die for you. briefly.']
  };
  const CAT_THOUGHTS = {
    biscuit: ['is it dinner. it feels like dinner', 'I can hear the treat bag from three rooms away'],
    mochi: ['I am a cloud with feet', 'please do not vacuum me again'],
    shadow: ['I was never here', 'I am the night. also I am hungry.'],
    earl: ['Good evening. Pets at the back, please.', 'I am wearing a tuxedo and you are wearing whatever that is'],
    pebble: ['warm spot detected', 'I sat on your laptop earlier. you are welcome.'],
    duchess: ['you may now kiss the paw', 'I have staff for this', 'I was a queen in a past life. Also this life.'],
    patches: ['three colours, zero chill', 'one of my moods likes you. guess which.']
  };
  let thinkT = 3, napT = 0, ended = false, sessionBites = 0, startT = performance.now();
  const NAP = 6;
  function think(text) {
    const b = $('#think'); if (!b) return;
    const k = S.mk || 'curious';
    let pool = THOUGHTS[k] || THOUGHTS.curious;
    if ((k === 'curious' || k === 'happy') && Math.random() < .35) pool = CAT_THOUGHTS[CAT.id] || pool;
    b.textContent = text || Curio.pick(pool);
    b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  }
  function endSimple(why) {
    if (ended) return;
    ended = true;
    const secs = Math.round((performance.now() - startT) / 1000);
    const box = $('#end');
    const nap = why === 'nap';
    if (nap) { S.purr = 50; S.idle = 40; Curio.confetti(); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, .14, 'triangle', .07), i * 110)); }
    else { [300, 240, 180].forEach((f, i) => setTimeout(() => Curio.beep(f, .16, 'square', .05), i * 120)); }
    const r = nap ? Curio.best('nap-time', secs, false) : null;
    box.innerHTML = `<div class="pc-end__card"><div class="pc-end__badge">${nap ? '😴' : '⚖️'}</div><small>${nap ? 'Mission accomplished' : 'Case closed'}</small><h2>${nap ? 'Biscuit is asleep. On your hand.' : 'Biscuit has filed a restraining order.'}</h2><p>${nap ? 'You can never move again. This is your life now. Cancel your plans. Learn to love this chair.' : 'Three bites. The court has ruled in favour of the cat. You must stay 50 metres from the belly at all times.'}</p><div class="pc-end__stats"><span><b>${secs}s</b>time</span><span><b>${sessionBites}</b>bites</span>${r ? `<span><b>${r.best}s</b>${r.isNew ? 'new best' : 'best'}</span>` : ''}</div><div class="pc-end__btns"><button type="button" class="pc-btn" id="endAgain">${nap ? 'Pet again' : 'Try gentler'}</button><button type="button" class="pc-btn pc-btn--ghost" id="endAdv">Meet all seven cats (Advanced)</button></div></div>`;
    box.hidden = false;
    think(nap ? 'zzz... this is my human now... zzz' : 'objection sustained');
    box.querySelector('#endAgain').addEventListener('click', () => { box.hidden = true; ended = false; napT = 0; sessionBites = 0; startT = performance.now(); Object.assign(S, { purr: 0, irr: 0, sulk: 0, idle: 0, bellyT: 0 }); });
    box.querySelector('#endAdv').addEventListener('click', () => Curio.setMode('advanced'));
    box.querySelector('#endAgain').focus({ preventScroll: true });
  }

  const KZ = { head: [200, 100], cheeks: [128, 190], chin: [200, 232], back: [272, 300] };
  let kzone = 'cheeks', kAnim = 0;
  function keyStroke(dir) {
    if (S.laser || ended) return;
    const [zx, zy] = KZ[kzone];
    const r = stage.getBoundingClientRect(), k = r.width / 400;
    const span = 34 * dir;
    const t0 = performance.now();
    cancelAnimationFrame(kAnim);
    lastPt = null;
    const stepK = (now) => {
      const f = Math.min(1, (now - t0) / 380);
      const sx = zx - span + span * 2 * f, sy = zy + Math.sin(f * Math.PI) * 4;
      onMove({ clientX: r.left + sx * k, clientY: r.top + sy * k, pointerType: 'mouse', isPrimary: true });
      if (f < 1) kAnim = requestAnimationFrame(stepK);
    };
    kAnim = requestAnimationFrame(stepK);
  }
  window.addEventListener('keydown', (e) => {
    if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') || document.querySelector('.curio-modal')) return;
    const zk = { 1: 'head', 2: 'cheeks', 3: 'chin', 4: 'back' }[e.key];
    if (zk) { kzone = zk; hint.textContent = `Keyboard petting: ${zk}. Tap the arrow keys slowly to stroke.`; return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); if (!e.repeat) keyStroke(e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1); return; }
    const k = e.key.toLowerCase();
    if (k === 't') $('#treat').click();
    if (k === 'b') $('#blink').click();
    if (!SIMPLE && k === 'l') $('#laserBtn').click();
    if (!SIMPLE && k === 'y') $('#yarnBtn').click();
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!document.hidden) { update(dt); render(); purrAudio(dt); }
    else if (audio) audio.master.gain.value = 0;
    requestAnimationFrame(loop);
  }
  paintStats();
  applyCat();
  paintAch();
  const tickRoom = () => { const h = new Date().getHours(); $('#room').classList.toggle('is-night', h >= 20 || h < 6); };
  tickRoom(); setInterval(tickRoom, 60000);
  requestAnimationFrame(loop);
  if (SIMPLE) {
    $('#subLine').textContent = 'Biscuit needs a nap. Pet him to sleep: keep the purr bar full. Three bites and you are out.';
    hint.textContent = 'Stroke slowly with your mouse, touchpad or finger. Or press 1 to 4 for a spot and tap the arrow keys.';
  }
  window.PetCat = { S, stats, cats, startYarn, endSimple, think };
})();
