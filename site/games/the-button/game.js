(() => {
  const D = window.BTN_DATA;
  const $ = (s) => document.querySelector(s);
  const scene = $('#scene'), wrap = $('#wrap'), btn = $('#btn'), lineEl = $('#line'), ava = $('#ava');
  const choicesEl = $('#choices'), decoysEl = $('#decoys'), fxEl = $('#fx'), ring = $('#ring'), ringFg = $('#ringFg');
  const blue = $('#blue'), panel = $('#panel');
  const KEY = 'button:v2';
  const DECOR = ['bulb', 'rug', 'plant', 'window', 'painting', 'clock', 'shelf', 'lamp'];
  const ENDING_IDS = Object.keys(D.endings);
  const RING = 289;

  const fresh = (keep = {}) => ({
    v: 2, ch: 0, bi: -1, prog: 0, flags: {}, presses: 0, theme: 'plain', room: [], log: [], mode: '', modeRef: null,
    choice: false, ended: null, started: Date.now(), lastLine: '', lastBlue: false, post: 0,
    total: keep.total || 0, endings: keep.endings || {}, ach: keep.ach || {}, themes: keep.themes || {}, runs: keep.runs || 0
  });
  function load() {
    const raw = Curio.store.get(KEY, null);
    if (!raw || typeof raw !== 'object' || raw.v !== 2) {
      const old = Number(Curio.store.get('button:count', 0)) || 0;
      return fresh({ total: old });
    }
    const s = Object.assign(fresh(), raw);
    if (!Array.isArray(s.room)) s.room = [];
    if (!Array.isArray(s.log)) s.log = [];
    if (!s.flags || typeof s.flags !== 'object') s.flags = {};
    if (!D.chapters[s.ch]) { s.ch = 0; s.bi = -1; }
    return s;
  }
  let S = load();
  const save = () => Curio.store.set(KEY, S);

  let ac = null;
  function audio() {
    if (Curio.muted) return null;
    ac = Curio.audioContext ? Curio.audioContext() : null;
    return ac;
  }
  function tone(f, d, type = 'sine', v = .12, at = 0, slide = 0) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + .05);
  }
  function noise(d, v = .2, freq = 1200, at = 0) {
    const a = audio(); if (!a) return;
    const len = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, len, a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    src.buffer = buf; f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = v;
    src.connect(f).connect(g).connect(a.destination); src.start(a.currentTime + at);
  }
  const SFX = {
    click() { tone(210 + Math.random() * 40, .1, 'triangle', .22, 0, 60); noise(.03, .12, 3000); },
    blue() { tone(520, .12, 'sine', .14, 0, 380); tone(780, .1, 'sine', .06, .02); },
    magic() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .25, 'triangle', .07, i * .06)); },
    meow() { tone(700, .35, 'sawtooth', .04, 0, 420); tone(900, .3, 'sine', .06, 0, 500); },
    creak() { tone(90, .7, 'sawtooth', .05, 0, 140); tone(120, .5, 'square', .02, .2, 70); },
    crack() { noise(.25, .5, 900); tone(80, .2, 'square', .08, 0, 40); },
    off() { tone(400, .4, 'square', .05, 0, 60); noise(.1, .2, 2000); },
    choice() { tone(660, .08, 'triangle', .12); tone(990, .14, 'triangle', .1, .08); },
    fail() { tone(150, .22, 'square', .07, 0, 90); },
    good() { tone(784, .1, 'triangle', .12); tone(1175, .18, 'triangle', .1, .1); },
    chapter() { [392, 494, 587, 784].forEach((f, i) => tone(f, .5, 'sine', .08, i * .12)); },
    badge() { tone(988, .1, 'triangle', .1); tone(1319, .25, 'triangle', .09, .1); },
    ending() { [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 1.1, 'sine', .06, i * .14)); },
    tick() { tone(1800, .02, 'square', .03); }
  };
  const sfx = (n) => { try { SFX[n] && SFX[n](); } catch {} };
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  let typeTimer = 0;
  function say(text, cls = '') {
    clearInterval(typeTimer);
    lineEl.className = 'bt-line' + (cls ? ' ' + cls : '');
    lineEl.innerHTML = '<span></span><span class="caret"></span>';
    const span = lineEl.firstChild;
    ava.classList.toggle('is-blue', cls === 'is-blue');
    ava.classList.add('talking'); ava.classList.remove('bump'); void ava.offsetWidth; ava.classList.add('bump');
    let k = 0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { span.textContent = text; lineEl.lastChild.remove(); ava.classList.remove('talking'); return; }
    typeTimer = setInterval(() => {
      k += 1;
      span.textContent = text.slice(0, k);
      if (k % 3 === 0 && /\w/.test(text[k - 1] || '')) tone(cls === 'is-blue' ? 900 : 520 + Math.random() * 120, .03, 'sine', .025);
      if (k >= text.length) { clearInterval(typeTimer); lineEl.lastChild?.remove(); ava.classList.remove('talking'); }
    }, 24);
    if (!cls) S.lastLine = text;
  }
  function log(text, choice) {
    S.log.push({ c: S.ch, t: text, k: choice ? 1 : 0 });
    if (S.log.length > 400) S.log.splice(0, S.log.length - 400);
    if (!panel.hidden && panel.dataset.p === 'log') renderPanel('log');
  }

  const beatAt = (ch, bi) => D.chapters[ch]?.beats[bi];
  const ok = (b) => (!b.if || S.flags[b.if]) && (!b.unless || !S.flags[b.unless]);
  function peekNext() {
    let ch = S.ch, bi = S.bi + 1;
    while (D.chapters[ch]) {
      const beats = D.chapters[ch].beats;
      while (bi < beats.length) { if (ok(beats[bi])) return { ch, bi }; bi++; }
      ch++; bi = 0;
    }
    return null;
  }
  const textOf = (b) => typeof b.t === 'function' ? b.t(S.flags) : b.t;

  function show(pos) {
    const b = beatAt(pos.ch, pos.bi);
    if (pos.ch !== S.ch) chapterCard(pos.ch);
    S.ch = pos.ch; S.bi = pos.bi; S.prog = 0;
    if (b.room) roomOps(b.room, true);
    if ('mode' in b) setMode(b.mode, false);
    if (b.sfx) sfx(b.sfx);
    if (b.choice) {
      S.choice = true;
      say(b.choice.q);
      log(b.choice.q);
      renderChoices();
    } else if (b.t) {
      const tx = textOf(b);
      say(tx); log(tx);
    }
    paintHud(); save();
  }

  function chapterCard(ch) {
    const c = D.chapters[ch];
    const card = $('#card');
    $('#cardSub').textContent = c.sub; $('#cardTitle').textContent = c.title;
    card.hidden = false; card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    clearTimeout(chapterCard.t); chapterCard.t = setTimeout(() => { card.hidden = true; }, 2400);
    sfx('chapter');
  }

  function renderChoices() {
    choicesEl.innerHTML = '';
    const b = beatAt(S.ch, S.bi);
    if (!b || !b.choice || !S.choice) { btn.classList.remove('locked'); return; }
    btn.classList.add('locked');
    const opts = b.choice.opts.filter((o) => !o.req || o.req(S.flags));
    opts.forEach((o, i) => {
      const el = document.createElement('button');
      el.type = 'button'; el.className = 'bt-choice' + (o.req ? ' is-special' : '');
      el.style.animationDelay = (i * .07) + 's';
      el.innerHTML = `<kbd>${i + 1}</kbd>`;
      el.append(document.createTextNode(o.label));
      el.addEventListener('click', () => choose(o));
      choicesEl.append(el);
    });
  }

  function choose(o) {
    if (!S.choice) return;
    S.choice = false; choicesEl.innerHTML = ''; btn.classList.remove('locked');
    sfx('choice'); buzz(15);
    log('You chose: ' + o.label, true);
    if (o.set) Object.assign(S.flags, o.set);
    if (o.theme) {
      S.theme = o.theme; S.flags.theme = o.theme; S.themes[o.theme] = 1;
      scene.dataset.theme = o.theme; burst(scene.clientWidth / 2, scene.clientHeight * .4, 28); shake();
      if (Object.keys(S.themes).length >= 3) unlock('themes');
    }
    if (o.ending) { save(); return endStory(o.ending); }
    if (o.say) { say(o.say); log(o.say); }
    paintHud(); save();
  }

  function roomOps(ops, anim) {
    ops.forEach((op) => {
      const id = op.slice(1);
      const has = S.room.includes(id);
      if (op[0] === '+' && !has) S.room.push(id);
      if (op[0] === '-' && has) S.room.splice(S.room.indexOf(id), 1);
      if (anim && op[0] === '+') {
        const el = scene.querySelector(`[data-it="${id}"]`);
        if (el) setTimeout(() => { const r = el.getBoundingClientRect(), sr = scene.getBoundingClientRect(); burst(r.left - sr.left + r.width / 2, r.top - sr.top + r.height / 2, 16); }, 120);
        if (id.startsWith('crack')) shake();
      }
    });
    applyRoom();
    if (DECOR.every((d) => S.room.includes(d))) unlock('decor');
  }
  function applyRoom() {
    scene.querySelectorAll('[data-it]').forEach((el) => el.classList.toggle('on', S.room.includes(el.dataset.it)));
    const has = (k) => S.room.includes(k);
    scene.classList.toggle('lit', has('bulb'));
    ['open', 'crack1', 'crack2', 'thin', 'void'].forEach((k) => scene.classList.toggle(k, has(k)));
    scene.querySelector('.it-cat').classList.toggle('sleep', has('sleep'));
    scene.dataset.theme = S.theme;
    scene.classList.toggle('blueall', S.ended === 'other');
  }

  let modeTimer = 0, modeRaf = 0, holdAt = 0, mashTimes = [], waitFrom = 0, mashTimer = 0;
  function modeBeat() { return S.modeRef ? beatAt(S.modeRef[0], S.modeRef[1]) || {} : {}; }
  function setMode(m, restoring) {
    const prev = S.mode;
    if (!restoring && prev && prev !== m) {
      if (prev === 'run') unlock('chase');
      if (prev === 'decoys') unlock('socks');
      if (prev === 'dark') unlock('dark');
    }
    clearTimeout(modeTimer); cancelAnimationFrame(modeRaf); clearTimeout(mashTimer);
    scene.classList.remove('dark');
    wrap.style.transform = ''; wrap.classList.remove('noped');
    wrap.querySelector('.bt-ped').style.opacity = ''; wrap.querySelector('.bt-base').style.opacity = '';
    btn.classList.remove('hum');
    decoysEl.innerHTML = ''; ring.classList.remove('on'); setRing(0);
    blue.hidden = true;
    S.mode = m || '';
    if (m) S.modeRef = [S.ch, S.bi];
    holdAt = 0; mashTimes = [];
    if (m === 'run') moveRandom();
    if (m === 'tiny') wrap.style.transform = 'scale(.45)';
    if (m === 'giant') wrap.style.transform = 'scale(1.45) translateY(-6%)';
    if (m === 'decoys') placeDecoys();
    if (m === 'dark') { scene.classList.add('dark'); scene.style.setProperty('--mx', '20%'); scene.style.setProperty('--my', '35%'); }
    if (m === 'wait') { ring.classList.add('on'); startWait(); }
    if (m === 'hold' || m === 'mash') ring.classList.add('on');
    if (m === 'hold' && !restoring && !Curio.store.get('tp-hint-the-button', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-the-button', true); setTimeout(() => Curio.toast(Curio.touchpad ? 'Touchpad mode: click the button once to hold it, click again to let go. Or hold Space' : 'Tip: on a touchpad, hold Space, or turn on Touchpad mode in the top bar to hold with one click', 4200), 900); }
    if (m === 'blue') blue.hidden = false;
  }
  const setRing = (f) => { ringFg.style.strokeDashoffset = String(RING * (1 - Math.max(0, Math.min(1, f)))); };

  function moveRandom() {
    const W = scene.clientWidth, H = scene.clientHeight, bw = wrap.offsetWidth;
    const mx = Math.max(0, W / 2 - bw / 2 - 12), my = Math.max(0, H * .5);
    let dx, dy, n = 0;
    const cur = wrap._pos || [0, 0];
    do { dx = Curio.rand(-mx, mx); dy = -Curio.rand(0, my); n++; } while (Math.hypot(dx - cur[0], dy - cur[1]) < W * .2 && n < 20);
    wrap._pos = [dx, dy];
    wrap.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  let realSlot = 1;
  function placeDecoys() {
    decoysEl.innerHTML = '';
    const W = scene.clientWidth;
    const slots = [.2, .5, .8];
    realSlot = Curio.randInt(0, 2);
    wrap.style.transform = `translate(${(slots[realSlot] - .5) * W}px, ${wrap.offsetHeight * .46}px)`;
    wrap.querySelector('.bt-ped').style.opacity = '0';
    btn.classList.add('hum');
    slots.forEach((x, i) => {
      if (i === realSlot) return;
      const d = document.createElement('button');
      d.type = 'button'; d.className = 'bt-decoy'; d.setAttribute('aria-label', 'A button, maybe');
      d.style.left = (x * 100) + '%'; d.style.animationDelay = (i * .08) + 's';
      d.addEventListener('click', (e) => { e.stopPropagation(); fake(d); });
      decoysEl.append(d);
    });
  }
  function fake(d) {
    if (d.classList.contains('poof')) return;
    d.classList.add('poof'); sfx('fail'); buzz([20, 40, 20]);
    say(Curio.pick(D.fakeLines));
    const c = scene.querySelector('.it-cat'); c.classList.remove('annoyed'); void c.offsetWidth; c.classList.add('annoyed');
  }

  function startWait() {
    waitFrom = performance.now();
    const b = modeBeat(), dur = (b.sec || 5) * 1000;
    cancelAnimationFrame(modeRaf);
    const step = () => {
      if (S.mode !== 'wait') return;
      if (document.hidden) { waitFrom = performance.now(); modeRaf = requestAnimationFrame(step); return; }
      const f = (performance.now() - waitFrom) / dur;
      setRing(f);
      if (f >= 1) { unlock('quiet'); sfx('good'); return completeMech(); }
      modeRaf = requestAnimationFrame(step);
    };
    modeRaf = requestAnimationFrame(step);
  }
  function holdStart() {
    if (S.mode !== 'hold' || holdAt) return;
    holdAt = performance.now();
    const dur = (modeBeat().sec || 2) * 1000;
    let lastTick = 0;
    const step = () => {
      if (!holdAt) return;
      const f = (performance.now() - holdAt) / dur;
      setRing(f);
      btn.classList.add('down');
      if (f * 8 > lastTick + 1) { lastTick = Math.floor(f * 8); tone(400 + lastTick * 80, .05, 'sine', .06); buzz(5); }
      if (f >= 1) { holdAt = 0; btn.classList.remove('down'); unlock('hug'); sfx('good'); buzz([30, 30, 60]); return completeMech(); }
      modeRaf = requestAnimationFrame(step);
    };
    modeRaf = requestAnimationFrame(step);
  }
  function holdEnd() {
    if (S.mode !== 'hold' || !holdAt) return;
    const held = performance.now() - holdAt;
    holdAt = 0; cancelAnimationFrame(modeRaf); setRing(0); btn.classList.remove('down');
    if (held > 60) say(Curio.pick(D.holdHint));
  }
  function mashPress() {
    const b = modeBeat(), need = b.count || 15, dur = (b.sec || 4) * 1000;
    const now = performance.now();
    if (!mashTimes.length) {
      clearTimeout(mashTimer);
      mashTimer = setTimeout(() => {
        if (S.mode !== 'mash') return;
        mashTimes = []; setRing(0); sfx('fail'); say(Curio.pick(b.fail || ['Again!']));
      }, dur);
    }
    mashTimes.push(now);
    setRing(mashTimes.length / need);
    tone(300 + mashTimes.length * 40, .04, 'square', .05);
    if (mashTimes.length >= need) { clearTimeout(mashTimer); unlock('mash'); sfx('good'); Curio.confetti(60); completeMech(); }
  }
  function completeMech() {
    const n = peekNext();
    ring.classList.remove('on');
    if (n) show(n);
  }

  function burst(x, y, n = 12) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'); s.className = 'bt-spark';
      const a = Math.random() * Math.PI * 2, r = 30 + Math.random() * 70;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(a) * r + 'px'); s.style.setProperty('--dy', Math.sin(a) * r + 'px');
      fxEl.append(s); setTimeout(() => s.remove(), 850);
    }
  }
  function wave(x, y) {
    const w = document.createElement('i'); w.className = 'bt-wave'; w.style.left = x + 'px'; w.style.top = y + 'px';
    fxEl.append(w); setTimeout(() => w.remove(), 520);
  }
  function shake() { scene.classList.remove('shake'); void scene.offsetWidth; scene.classList.add('shake'); }

  let lastPress = performance.now(), idleSaid = false;
  function press(e) {
    if (!$('#start').hidden) return;
    lastPress = performance.now(); idleSaid = false;
    if (S.choice) { btn.classList.remove('wobble'); void btn.offsetWidth; btn.classList.add('wobble'); sfx('fail'); choicesEl.firstChild?.focus({ preventScroll: true }); return; }
    S.presses++; S.total++;
    sfx('click'); buzz(8);
    btn.classList.add('down'); setTimeout(() => { if (!holdAt) btn.classList.remove('down'); }, 90);
    const r = btn.getBoundingClientRect(), sr = scene.getBoundingClientRect();
    const px = r.left - sr.left + r.width / 2, py = r.top - sr.top + r.height / 2;
    wave(px, py);
    if (S.total === 1) unlock('first');
    if (S.total >= 100) unlock('p100');
    if (S.total >= 1000) unlock('p1000');
    if (S.total >= 5000) unlock('p5000');
    const encore = D.encore[S.total];
    if (S.total % 1000 === 0 || encore) { Curio.confetti(); Curio.best('presses', S.total); }
    paintHud(true);

    if (S.ended) {
      S.post++;
      if (encore) say(encore);
      else if (S.post % 7 === 0) say(Curio.pick(D.postLines));
      save(); return;
    }
    if (S.lastBlue) { S.lastBlue = false; say(D.redHurt[Math.min(D.redHurt.length - 1, (S.flags.betray || 1) - 1)], 'is-hurt'); }
    else if (encore) say(encore);

    const m = S.mode;
    if (m === 'wait') {
      sfx('fail'); buzz([30, 30, 30]); say(Curio.pick(modeBeat().fail || ['Shh!']));
      const c = scene.querySelector('.it-cat'); c.classList.remove('annoyed'); void c.offsetWidth; c.classList.add('annoyed');
      startWait(); save(); return;
    }
    if (m === 'hold') { if (!holdAt && e && e.detail !== 0) say(Curio.pick(D.holdHint)); save(); return; }
    if (m === 'mash') { mashPress(); save(); return; }

    S.prog++;
    const n = peekNext();
    if (n) {
      const need = beatAt(n.ch, n.bi).n || 1;
      if (S.prog >= need) show(n);
      else if (m === 'run') say(Curio.pick(D.runLines));
    }
    if (S.mode === 'run' && m === 'run') moveRandom();
    if (S.mode === 'decoys' && m === 'decoys') placeDecoys();
    if (S.room.includes('plant') && S.presses % 25 === 0) { const p = scene.querySelector('.it-plant'); p.classList.remove('grow'); void p.offsetWidth; p.classList.add('grow'); }
    paintHud(); save();
  }

  function pressBlue() {
    if (S.mode !== 'blue') return;
    S.flags.betray = (S.flags.betray || 0) + 1;
    S.total++; sfx('blue'); buzz(8);
    blue.classList.add('down'); setTimeout(() => blue.classList.remove('down'), 90);
    unlock('traitor');
    const k = S.flags.betray;
    if (k >= D.blueLines.length + 1) { save(); return endStory('other'); }
    say(D.blueLines[k - 1], 'is-blue');
    S.lastBlue = true;
    paintHud(); save();
  }

  function paintHud(bump) {
    $('#count').textContent = Curio.fmt(S.presses);
    $('#total').textContent = Curio.fmt(S.total);
    if (bump) { const c = $('#count'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    const chs = D.chapters.length, c = D.chapters[S.ch];
    const f = S.ended ? 1 : (S.ch + Math.max(0, S.bi + 1) / c.beats.length) / chs;
    $('#progBar').style.width = (f * 100).toFixed(1) + '%';
    $('#progTxt').textContent = S.ended ? 'Story complete: ' + D.endings[S.ended].title : `Chapter ${S.ch + 1} of ${chs}: ${c.title}`;
    $('#chap').textContent = S.ended ? 'Epilogue' : S.bi < 0 && S.ch === 0 ? 'Prologue' : `Chapter ${S.ch + 1} · ${c.title}`;
    $('#endCount').textContent = `${Object.keys(S.endings).length}/${ENDING_IDS.length}`;
    $('#achCount').textContent = `${Object.keys(S.ach).length}/${D.achievements.length}`;
  }

  let badgeQ = [], badgeOn = false;
  function unlock(id) {
    if (S.ach[id]) return;
    const a = D.achievements.find((x) => x.id === id); if (!a) return;
    S.ach[id] = Date.now(); save();
    badgeQ.push(a); if (!badgeOn) nextBadge();
    paintHud();
  }
  function nextBadge() {
    const a = badgeQ.shift(); const el = $('#badge');
    if (!a) { badgeOn = false; return; }
    badgeOn = true;
    el.innerHTML = `<i>${a.emoji}</i><span><small>Badge unlocked</small><b></b></span>`;
    el.querySelector('b').textContent = a.name;
    el.classList.add('on'); sfx('badge');
    setTimeout(() => { el.classList.remove('on'); setTimeout(nextBadge, 450); }, 2600);
  }

  const btnArt = (x, y, r, c1, c2, c3) => `<ellipse cx="${x}" cy="${y + r * .55}" rx="${r * 1.15}" ry="${r * .55}" fill="#1f1b19"/><ellipse cx="${x}" cy="${y + r * .32}" rx="${r}" ry="${r * .55}" fill="${c3}"/><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * .62}" fill="url(#eb)"/><ellipse cx="${x - r * .3}" cy="${y - r * .25}" rx="${r * .35}" ry="${r * .14}" fill="#fff" opacity=".4"/><defs><radialGradient id="eb" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${c1}"/><stop offset=".6" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></radialGradient></defs>`;
  const RED = ['#ff8a7a', '#e0241b', '#8f0f0a'];
  const starsSvg = (n, w = 560, h = 190) => Array.from({ length: n }, () => `<circle cx="${(Math.random() * w).toFixed(0)}" cy="${(Math.random() * h).toFixed(0)}" r="${(Math.random() * 1.4 + .4).toFixed(1)}" fill="#fff" opacity="${(Math.random() * .6 + .3).toFixed(2)}"/>`).join('');
  const ART = {
    forever: () => `<rect width="560" height="190" fill="#1b1036"/>${starsSvg(50)}<path class="ea-float" d="M180 95 C180 40 260 40 280 95 C300 150 380 150 380 95 C380 40 300 40 280 95 C260 150 180 150 180 95Z" fill="none" stroke="#ffd447" stroke-width="8" opacity=".85"/><g class="ea-float">${btnArt(280, 92, 34, ...RED)}</g>`,
    walk: () => `<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ec4ff"/><stop offset="1" stop-color="#e7f6ff"/></linearGradient></defs><rect width="560" height="190" fill="url(#sk)"/><circle cx="460" cy="50" r="26" fill="#ffd84a"/><ellipse class="ea-float" cx="140" cy="45" rx="50" ry="12" fill="#fff"/><path d="M0 140 Q140 90 280 130 T560 120 V190 H0Z" fill="#7cc46a"/><path d="M0 160 Q200 130 560 160 V190 H0Z" fill="#5aa64f"/><path d="M250 190 Q280 150 300 132" stroke="#e8d6a8" stroke-width="10" fill="none"/><g transform="translate(296 108)"><circle r="6" fill="#3a2c22"/><rect x="-4" y="6" width="8" height="16" rx="3" fill="#e05a47"/></g>`,
    swap: () => `<rect width="560" height="190" fill="#e0241b"/><circle cx="280" cy="95" r="120" fill="#ff6b5b" opacity=".5"/><circle cx="280" cy="95" r="70" fill="#ff8a7a" opacity=".5"/><g class="ea-float" transform="translate(280 100)"><circle r="12" fill="#3a2c22" cy="-24"/><rect x="-9" y="-12" width="18" height="32" rx="7" fill="#ffd447"/><path d="M14 -30 q30 -10 40 -30" stroke="#fff" stroke-width="3" fill="none"/><text x="30" y="-62" font-size="18" font-weight="900" fill="#fff">"Oh. You pressed it."</text></g>`,
    unplug: () => `<rect width="560" height="190" fill="#0f0d14"/><path d="M0 150 C120 150 160 110 240 120 S330 150 300 150" stroke="#3a3340" stroke-width="8" fill="none"/><g transform="translate(300 132)"><rect width="46" height="34" rx="6" fill="#6b625a"/><rect x="46" y="8" width="16" height="5" fill="#bbb"/><rect x="46" y="21" width="16" height="5" fill="#bbb"/></g><rect x="410" y="120" width="40" height="56" rx="6" fill="#2a2522"/><circle cx="430" cy="140" r="4" fill="#111"/><circle cx="430" cy="158" r="4" fill="#111"/><g opacity=".5">${btnArt(130, 95, 30, '#6b3a36', '#4a1a16', '#2a0d0b')}</g><text class="ea-float" x="170" y="60" font-size="14" fill="#c9c3d6" font-weight="800">thank you for the presses</text>`,
    door: () => `<rect width="560" height="190" fill="#d8c3a5"/><rect x="200" y="20" width="160" height="170" fill="#7a5a3a"/><rect x="212" y="30" width="136" height="160" fill="#8fd0ff"/><path d="M212 150 Q280 110 348 140 V190 H212Z" fill="#7cc46a"/><circle cx="320" cy="60" r="12" fill="#ffd84a"/><path d="M212 30 L170 40 L170 190 L212 190Z" fill="#a0784f"/><g transform="translate(280 170)" class="ea-float"><circle r="6" cy="-28" fill="#3a2c22"/><rect x="-5" y="-22" width="10" height="18" rx="4" fill="#4a8fd6"/><circle cx="10" cy="-14" r="6" fill="#e0241b"/></g>`,
    launch: () => `<rect width="560" height="190" fill="#050818"/>${starsSvg(70)}<circle cx="470" cy="150" r="40" fill="#2f7fd8"/><path d="M445 140 q10 -12 22 -2 q4 12 -8 14z" fill="#5cbf6a"/><g class="ea-rise" transform="translate(250 30)"><path d="M30 0 C55 20 60 60 55 100 H5 C0 60 5 20 30 0Z" fill="#e9eef7"/><circle cx="30" cy="45" r="13" fill="#4aa0ff" stroke="#9db0cf" stroke-width="4"/><path d="M5 80 L-12 112 L8 104Z M55 80 L72 112 L52 104Z" fill="#e0241b"/><path d="M14 102 Q30 150 46 102Z" fill="#ffb347"/><path d="M20 102 Q30 132 40 102Z" fill="#ffe08a"/></g>`,
    friends: () => `<rect width="560" height="190" fill="#1a1440"/>${starsSvg(30)}${[[280, 70], [255, 48], [232, 50], [218, 68], [224, 92], [244, 112], [264, 130], [280, 145], [296, 130], [316, 112], [336, 92], [342, 68], [328, 50], [305, 48]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#ffd447" opacity=".95"><animate attributeName="opacity" values="1;.3;1" dur="2s" begin="${i * .15}s" repeatCount="indefinite"/></circle>`).join('')}<g transform="translate(0 20)">${btnArt(130, 140, 22, ...RED)}</g>`,
    truth: () => `<defs><radialGradient id="tg"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#ff5a36" stop-opacity="0"/></radialGradient></defs><rect width="560" height="190" fill="#2a0d12"/><circle cx="280" cy="95" r="150" fill="url(#tg)" opacity=".6"/><g class="ea-spin" style="transform-origin:280px 95px">${Array.from({ length: 16 }, (_, i) => `<rect x="278" y="5" width="4" height="34" rx="2" fill="#ffd447" transform="rotate(${i * 22.5} 280 95)"/>`).join('')}</g>${btnArt(280, 92, 40, ...RED)}`,
    other: () => `<rect width="560" height="190" fill="#0d3d80"/><circle cx="280" cy="95" r="110" fill="#1f6fd6" opacity=".5"/><g class="ea-float">${btnArt(280, 90, 44, '#8cc8ff', '#1f6fd6', '#0d3d80')}</g><g opacity=".7">${btnArt(470, 160, 12, ...RED)}</g>`
  };

  function endStory(id) {
    const e = D.endings[id];
    S.ended = id; S.choice = false; choicesEl.innerHTML = ''; btn.classList.remove('locked');
    setMode('', true);
    const firstTime = !S.endings[id];
    S.endings[id] = (S.endings[id] || 0) + 1;
    S.runs = (S.runs || 0) + 1;
    if (id === 'unplug') { S.room = S.room.filter((r) => r !== 'bulb'); }
    if (id === 'friends' || id === 'forever') S.room = S.room.filter((r) => r !== 'thin' && r !== 'void');
    applyRoom();
    log('Ending: ' + e.title, true);
    unlock('end1');
    const found = Object.keys(S.endings).length;
    if (found >= 4) unlock('end4');
    if (found >= ENDING_IDS.length) unlock('endall');
    save(); paintHud();
    say(e.text[2]);
    $('#endArt').innerHTML = `<svg viewBox="0 0 560 190" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${e.title}">${ART[e.art]()}</svg>`;
    $('#endKicker').textContent = `${firstTime ? 'New ending' : 'Ending'} · ${found} of ${ENDING_IDS.length} found`;
    $('#endTitle').textContent = `${e.emoji} ${e.title}`;
    const tx = $('#endText'); tx.innerHTML = '';
    e.text.forEach((p) => { const el = document.createElement('p'); el.textContent = p; tx.append(el); });
    const mins = Math.max(1, Math.round((Date.now() - S.started) / 60000));
    $('#endStats').innerHTML = `<div class="c-stat"><b>${Curio.fmt(S.presses)}</b><span>Presses</span></div><div class="c-stat"><b>${mins}m</b><span>Story time</span></div><div class="c-stat"><b>${found}/${ENDING_IDS.length}</b><span>Endings</span></div>`;
    $('#endGallery').innerHTML = ENDING_IDS.map((k) => `<i class="${S.endings[k] ? '' : 'lock'}${k === id ? ' now' : ''}" title="${S.endings[k] ? D.endings[k].title : 'Locked: ' + D.endings[k].hint}">${S.endings[k] ? D.endings[k].emoji : '?'}</i>`).join('');
    $('#end').hidden = false;
    sfx('ending'); buzz([40, 60, 40, 60, 120]);
    if (firstTime) setTimeout(() => Curio.confetti(), 500);
    $('#endNew').focus({ preventScroll: true });
  }

  function newStory() {
    S = fresh(S);
    save();
    $('#end').hidden = true;
    setMode('', true); applyRoom(); renderChoices(); paintHud();
    say(Object.keys(S.endings).length ? 'Hello? Oh. I have the strangest feeling we\'ve done this before. Anyway: there is a button.' : 'There is a button. You know what to do.');
    if (!panel.hidden) renderPanel(panel.dataset.p);
  }

  function shareText() {
    const found = Object.keys(S.endings).length;
    const last = S.ended ? `I reached the "${D.endings[S.ended].title}" ending` : `I'm on chapter ${S.ch + 1}`;
    return `🔴 The Button: ${last} after ${Curio.fmt(S.presses)} presses. ${found}/${ENDING_IDS.length} endings found, ${Curio.fmt(S.total)} presses all-time. Curio`;
  }
  async function share() {
    const t = shareText();
    try { await navigator.clipboard.writeText(t); Curio.toast('Copied to clipboard'); }
    catch { Curio.toast(t, 4000); }
  }

  function renderPanel(p) {
    panel.dataset.p = p;
    if (p === 'log') {
      const by = [];
      S.log.forEach((l) => { if (!by.length || by[by.length - 1].c !== l.c) by.push({ c: l.c, items: [] }); by[by.length - 1].items.push(l); });
      panel.innerHTML = '<h3>📜 The story so far</h3><div class="bt-log"></div>';
      const box = panel.querySelector('.bt-log');
      if (!by.length) box.innerHTML = '<p class="c-muted">Nothing yet. Press the button.</p>';
      by.forEach((g) => {
        const h = document.createElement('h4'); h.textContent = `Chapter ${g.c + 1} · ${D.chapters[g.c]?.title || ''}`; box.append(h);
        g.items.forEach((l) => { const el = document.createElement('p'); el.textContent = l.t; if (l.k) el.className = 'is-choice'; box.append(el); });
      });
      panel.scrollTop = panel.scrollHeight;
    } else if (p === 'endings') {
      panel.innerHTML = `<h3>🚪 Endings · ${Object.keys(S.endings).length} of ${ENDING_IDS.length}</h3><p class="c-muted" style="margin:0 0 10px">Different choices unlock different endings. Some only appear if you made certain choices earlier.</p><div class="bt-grid">${ENDING_IDS.map((k) => {
        const e = D.endings[k], got = S.endings[k];
        return `<div class="bt-tile ${got ? 'got' : 'locked'}"><i>${got ? e.emoji : '🔒'}</i><b>${got ? e.title : '???'}</b><span>${got ? 'Reached ' + got + (got === 1 ? ' time' : ' times') : 'Hint: ' + e.hint}</span></div>`;
      }).join('')}</div>`;
    } else if (p === 'ach') {
      panel.innerHTML = `<h3>🏆 Badges · ${Object.keys(S.ach).length} of ${D.achievements.length}</h3><div class="bt-grid">${D.achievements.map((a) => `<div class="bt-tile ${S.ach[a.id] ? 'got' : 'locked'}"><i>${a.emoji}</i><b>${a.name}</b><span>${a.desc}</span></div>`).join('')}</div>`;
    } else if (p === 'help') {
      panel.innerHTML = `<h3>❓ How it works</h3><div class="bt-help"><p>Press the button. The narrator who lives inside it will tell you a story, five chapters long. Your presses power the room: watch it fill up with furniture, light and a very opinionated cat.</p><ul><li>When choices appear, pick one (or press <span class="c-kbd">1</span> to <span class="c-kbd">8</span>). Choices change the room, the lines and which endings you can reach.</li><li>Some moments need something different: catching, finding, holding, waiting or mashing. The narrator will tell you what to do.</li><li><span class="c-kbd">Space</span> or <span class="c-kbd">Enter</span> presses the button. Holding works with Space too. On a touchpad, turn on Touchpad mode in the top bar: click once to hold, click again to let go.</li><li>There are nine endings. After one, start a new story and choose differently. Your endings, badges and all-time presses are kept.</li></ul><p class="c-muted">Progress saves automatically on this device.</p></div>`;
    }
  }
  document.querySelectorAll('.bt-tab[data-panel]').forEach((t) => t.addEventListener('click', () => {
    const p = t.dataset.panel;
    const open = panel.hidden || panel.dataset.p !== p;
    document.querySelectorAll('.bt-tab[data-panel]').forEach((x) => x.setAttribute('aria-pressed', String(open && x === t)));
    panel.hidden = !open;
    if (open) renderPanel(p);
  }));
  $('#share').addEventListener('click', share);
  $('#endShare').addEventListener('click', share);
  $('#reset').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '📖', title: 'Start a new story?', body: 'The room, your choices and this story\'s presses reset. Endings, badges and all-time presses are kept.', buttons: [{ label: 'Keep going', value: 0 }, { label: 'New story', value: 1 }] });
    if (v) newStory();
  });
  $('#endNew').addEventListener('click', newStory);
  $('#endKeep').addEventListener('click', () => { $('#end').hidden = true; btn.focus({ preventScroll: true }); });

  btn.addEventListener('click', (e) => { if (S.mode === 'hold' && e.detail !== 0) return; press(e); });
  Curio.drag(btn, {
    start: (p) => { if (S.mode === 'hold' && !S.choice && $('#start').hidden) { p.event.preventDefault(); press(p.event); holdStart(); } },
    end: () => holdEnd()
  });
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  blue.addEventListener('click', pressBlue);
  scene.addEventListener('pointermove', (e) => {
    if (S.mode !== 'dark') return;
    const r = scene.getBoundingClientRect();
    scene.style.setProperty('--mx', (e.clientX - r.left) + 'px'); scene.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });
  scene.addEventListener('pointerdown', (e) => {
    if (S.mode !== 'dark') return;
    const r = scene.getBoundingClientRect();
    scene.style.setProperty('--mx', (e.clientX - r.left) + 'px'); scene.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  let spaceHeld = false;
  document.addEventListener('keydown', (e) => {
    if (!$('#end').hidden || document.querySelector('.curio-modal')) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (S.choice && /^[1-8]$/.test(e.key)) {
      const b = choicesEl.querySelectorAll('.bt-choice')[Number(e.key) - 1];
      if (b) { e.preventDefault(); b.click(); }
      return;
    }
    if ((e.code === 'Space' || e.key === 'Enter') && (tag === 'body' || e.target === btn)) {
      e.preventDefault();
      if (!$('#start').hidden) { $('#startGo').click(); return; }
      if (e.repeat) return;
      if (S.mode === 'hold') { if (!spaceHeld) { spaceHeld = true; press(e); holdStart(); } return; }
      press(e);
    }
  });
  document.addEventListener('keyup', (e) => { if (e.code === 'Space' || e.key === 'Enter') { if (spaceHeld) { spaceHeld = false; holdEnd(); } } });

  function sky() {
    const h = new Date().getHours() + new Date().getMinutes() / 60;
    const el = $('#sky');
    let s1, s2, sun, sx, sy, cl;
    if (h < 5.5 || h >= 20.5) { s1 = '#0b1638'; s2 = '#2a3a6b'; sun = '#f4f1de'; cl = .25; }
    else if (h < 8) { s1 = '#ff9a6b'; s2 = '#ffd9a8'; sun = '#ffcf5a'; cl = .8; }
    else if (h < 17.5) { s1 = '#5fb0ff'; s2 = '#d6efff'; sun = '#ffd84a'; cl = .9; }
    else { s1 = '#6a4c9c'; s2 = '#ff9a6b'; sun = '#ff8a3c'; cl = .7; }
    const dayF = Math.max(0, Math.min(1, (h - 6) / 14));
    sx = 10 + dayF * 60; sy = 12 + Math.abs(dayF - .5) * 40;
    el.style.setProperty('--sky1', s1); el.style.setProperty('--sky2', s2); el.style.setProperty('--sunc', sun);
    el.style.setProperty('--sunx', sx + '%'); el.style.setProperty('--suny', sy + '%'); el.style.setProperty('--cloud', cl);
  }
  function clock() {
    const d = new Date(), s = d.getSeconds(), m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    $('#hh').setAttribute('transform', `rotate(${h * 30} 30 30)`);
    $('#mh').setAttribute('transform', `rotate(${m * 6} 30 30)`);
    $('#sh').setAttribute('transform', `rotate(${s * 6} 30 30)`);
  }
  setInterval(() => {
    if (document.hidden) return;
    clock();
    if (new Date().getSeconds() === 0) sky();
    if (!S.ended && !S.choice && S.mode !== 'wait' && S.mode !== 'hold' && $('#start').hidden && $('#end').hidden && !idleSaid && S.presses > 0 && performance.now() - lastPress > 30000) {
      idleSaid = true; say(Curio.pick(D.idleLines));
    }
  }, 1000);

  const starsEl = $('#stars');
  for (let i = 0; i < 70; i++) {
    const s = document.createElement('i');
    s.style.left = Math.random() * 100 + '%'; s.style.top = Math.random() * 100 + '%';
    s.style.animationDelay = -Math.random() * 3 + 's';
    if (Math.random() < .2) { s.style.width = s.style.height = '3px'; }
    starsEl.append(s);
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) { save(); holdEnd(); } });
  window.addEventListener('resize', () => { if (S.mode === 'run') moveRandom(); if (S.mode === 'decoys') placeDecoys(); });

  function boot() {
    applyRoom(); sky(); clock(); paintHud();
    const st = $('#start');
    if (S.mode) {
      const m = S.mode; S.mode = ''; setMode(m, true);
    }
    if (S.presses > 0 && !S.ended) {
      $('#startText').textContent = `Welcome back. You're in chapter ${S.ch + 1}, "${D.chapters[S.ch].title}", ${Curio.fmt(S.presses)} presses in. ${Object.keys(S.endings).length} of ${ENDING_IDS.length} endings found.`;
      $('#startGo').textContent = 'Continue';
      $('#startNew').hidden = false;
    } else if (S.ended) {
      $('#startText').textContent = `Last time you reached the "${D.endings[S.ended].title}" ending. ${Object.keys(S.endings).length} of ${ENDING_IDS.length} found. Ready for another story?`;
      $('#startGo').textContent = 'New story';
    }
    st.hidden = false;
    lineEl.textContent = '';
    say(S.presses ? 'Oh! You\'re back.' : 'There is a button. You know what to do.');
  }
  $('#startGo').addEventListener('click', () => {
    $('#start').hidden = true; audio();
    if (S.ended) { newStory(); }
    else if (S.presses > 0) { say(S.choice ? beatAt(S.ch, S.bi).choice.q : `Where were we? Ah, yes: "${S.lastLine || 'press the button'}"`); renderChoices(); }
    else say('There is a button. You know what to do.');
    btn.focus({ preventScroll: true });
  });
  $('#startNew').addEventListener('click', () => { $('#start').hidden = true; newStory(); btn.focus({ preventScroll: true }); });

  boot();
  window.__button = {
    get S() { return S; }, press: () => press({ detail: 1 }), pressBlue, choose: (i) => choicesEl.querySelectorAll('.bt-choice')[i]?.click(),
    skipTo(ch) { S.ch = ch; S.bi = -1; S.prog = 0; save(); }, complete: completeMech, D
  };
})();
