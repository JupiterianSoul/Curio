(() => {
  const LW = 800, LH = 600;
  const D = window.BLIND_DATA;
  const PROMPTS = D.prompts;
  const CAPS = [
    'Nailed it. Mostly.', 'Museum quality, if the museum is weird.', 'Close enough. We can tell what it is. Kind of.',
    'Expectation vs reality, part one hundred.', 'Your hand had its own plans.', 'That is going on the fridge.',
    'Abstract. Bold. Confusing.', 'Picasso called, he wants his style back.', 'Somewhere, an art teacher just sighed.',
    'You have invented a new animal.', 'This is surprisingly emotional.', 'Honestly? Better than with your eyes open.',
    'The lines have gone on holiday.', 'A masterpiece of confidence.', 'Every part is in the wrong place. Perfect.',
    'Ten out of ten, no notes.', 'It has a certain wobbly charm.', 'Zero regrets. Lots of lines.'
  ];
  const FRIEND_CAPS = [
    'They will never forgive you.', 'An honest portrait.', 'The likeness is... spiritual.', 'Frame it and give it to them.',
    'This explains a lot about them.', 'Their best angle, apparently.', 'Uncanny. In some way.', 'Your friendship will survive this. Probably.'
  ];
  const TAGS = { few: 'Minimalist approach', many: 'Extremely detailed', fast: 'Done in a flash', slow: 'Took your time' };
  const INKS = { ink: 'Ink', '#d62828': 'Red', '#2f6fed': 'Blue', '#13a86b': 'Green', '#9b51e0': 'Purple', '#ff7b00': 'Orange' };

  const $ = (id) => document.getElementById(id);
  const stage = $('stage'), cv = $('cv'), g = cv.getContext('2d');
  let mode = Curio.store.get('bd-mode', 'prompt');
  if (!['prompt', 'friend', 'party'].includes(mode)) mode = 'prompt';
  let prompt = Curio.pick(PROMPTS);
  let strokes = [], cur = null;
  let state = 'ready';
  let tStart = 0, timeLimit = Curio.store.get('bd-timer', 0), clockRaf = 0;
  let penW = Curio.store.get('bd-pen', 7);
  let ink = Curio.store.get('bd-ink', 'ink');
  if (!INKS[ink]) ink = 'ink';
  let twistOn = Curio.store.get('bd-twist', false);
  let twist = null;
  let gallery = Curio.store.get('bd-gallery', []);
  if (!Array.isArray(gallery)) gallery = [];
  let kept = false, caption = '', judged = null;
  let dpr = 1, scale = 1;
  let party = null, roundId = 0;
  const stats = Object.assign({ v: 1, drawings: 0, twists: 0, parties: 0, best: 0, prompts: [] }, Curio.store.get('bd-stats', {}) || {});
  if (!Array.isArray(stats.prompts)) stats.prompts = [];
  let badges = Curio.store.get('bd-badges', []) || [];

  const paper = () => (Curio.isDark() ? '#1d1b18' : '#fffdf7');
  const inkCol = (k = ink) => (k === 'ink' ? (Curio.isDark() ? '#f3eee7' : '#1d1b19') : k);
  function applyPaper() { document.documentElement.style.setProperty('--paper', paper()); }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = stage.clientWidth, h = stage.clientHeight;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    scale = w / LW;
    render();
  }
  function smooth(c, pts) {
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    if (pts.length < 3) { const l = pts[pts.length - 1]; c.lineTo(l.x + .01, l.y); c.stroke(); return; }
    for (let i = 1; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; c.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2); }
    const l = pts[pts.length - 1]; c.lineTo(l.x, l.y); c.stroke();
  }
  function paint(c, list, w, col = ink, flip = false) {
    c.save();
    if (flip) { c.translate(LW, LH); c.rotate(Math.PI); }
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = inkCol(col); c.lineWidth = w;
    for (const s of list) if (s.length) smooth(c, s);
    c.restore();
  }
  function render() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = paper(); g.fillRect(0, 0, cv.width, cv.height);
    if (state !== 'revealed' && state !== 'revealing') return;
    g.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
    paint(g, strokes, penW, ink, twist && twist.flip);
  }
  function pos(e) {
    const b = cv.getBoundingClientRect();
    return { x: (e.clientX - b.left) / b.width * LW, y: (e.clientY - b.top) / b.height * LH };
  }
  function down(q) {
    if (state === 'revealing' || state === 'revealed' || cur) return;
    if (q.event && q.event.cancelable) q.event.preventDefault();
    if (state === 'ready') { state = 'drawing'; stage.classList.add('is-drawing'); tStart = performance.now(); startClock(); }
    cur = [pos(q)];
    $('dot').classList.add('is-down');
    Curio.beep(300 + Math.random() * 80, .03, 'sine', .04);
  }
  function move(q) {
    if (!cur) return;
    const e = q.event;
    const list = e && e.getCoalescedEvents ? e.getCoalescedEvents() : [];
    for (const ev of (list.length ? list : [q])) {
      const p = pos(ev), l = cur[cur.length - 1];
      if (Math.hypot(p.x - l.x, p.y - l.y) >= 1.5) cur.push(p);
    }
  }
  function up() {
    $('dot').classList.remove('is-down');
    if (cur) { strokes.push(cur); cur = null; }
    syncCount();
    if (twist && twist.limit && strokes.length >= twist.limit && state === 'drawing') { Curio.toast(twist.limit === 1 ? 'One stroke, as promised!' : 'Stroke limit reached!'); const r0 = roundId; setTimeout(() => { if (r0 === roundId) reveal(); }, 250); }
  }
  function syncCount() {
    $('count').textContent = `${strokes.length} stroke${strokes.length === 1 ? '' : 's'}${twist && twist.limit ? ` of ${twist.limit}` : ''}`;
    $('undo').disabled = !strokes.length || state !== 'drawing';
    $('reveal').disabled = !strokes.length || state !== 'drawing';
  }
  function limitNow() { return twist && twist.time ? twist.time : timeLimit; }
  function startClock() {
    cancelAnimationFrame(clockRaf);
    const clock = $('clock');
    const loop = () => {
      if (state !== 'drawing') return;
      const el = (performance.now() - tStart) / 1000, lim = limitNow();
      if (lim) {
        const left = Math.max(0, lim - el);
        clock.textContent = left.toFixed(left < 10 ? 1 : 0);
        clock.classList.toggle('is-low', left < 5);
        if (left <= 0) { Curio.toast('Time is up! Pens down.'); reveal(); return; }
      } else clock.textContent = el.toFixed(0) + 's';
      clockRaf = requestAnimationFrame(loop);
    };
    clockRaf = requestAnimationFrame(loop);
  }
  function inkLength(list = strokes) {
    let s = 0;
    for (const st of list) for (let i = 1; i < st.length; i++) s += Math.hypot(st[i].x - st[i - 1].x, st[i].y - st[i - 1].y);
    return s;
  }
  function judge(list, secs) {
    const n = list.length, len = inkLength(list) / 100;
    let xs = [], ys = [];
    list.forEach((s) => s.forEach((p) => { xs.push(p.x); ys.push(p.y); }));
    const spread = xs.length ? ((Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))) / (LW * LH) : 0;
    const base = 5 + Math.min(2, len / 12) + (spread > .2 && spread < .85 ? 1.2 : 0) + (n >= 4 && n <= 30 ? .8 : 0) - (secs < 4 ? 1 : 0);
    return Curio.shuffle(D.judges.slice()).slice(0, 3).map(([e, name]) => {
      const sc = Math.max(1, Math.min(10, Math.round(base + (Math.random() * 4 - 2))));
      const tier = sc >= 8 ? 'high' : sc >= 5 ? 'mid' : 'low';
      const i = D.judges.findIndex((j) => j[1] === name);
      return { e, name, sc, line: D.judgeLines[tier][i] };
    });
  }
  function showJudges(js) {
    const el = $('judges'); el.innerHTML = '';
    js.forEach((j, i) => {
      const d = document.createElement('div'); d.className = 'bd-judge'; d.style.animationDelay = `${i * 260}ms`;
      d.innerHTML = `<span class="f" aria-hidden="true">${j.e}</span><b>${j.sc}</b><small></small><em></em>`;
      d.querySelector('small').textContent = j.name; d.querySelector('em').textContent = j.line;
      el.append(d);
      setTimeout(() => Curio.beep(300 + j.sc * 60, .08, 'square', .05), 400 + i * 260);
    });
    const tot = js.reduce((a, j) => a + j.sc, 0);
    const t = document.createElement('div'); t.className = 'bd-total'; t.textContent = `${tot}/30`; t.style.animationDelay = '900ms';
    el.append(t);
    return tot;
  }

  function reveal() {
    if (state !== 'drawing') return;
    if (cur) { strokes.push(cur); cur = null; }
    if (!strokes.length) { state = 'ready'; stage.classList.remove('is-drawing'); return; }
    cancelAnimationFrame(clockRaf);
    const secs = (performance.now() - tStart) / 1000;
    if (party) { partyNext(secs); return; }
    state = 'revealing';
    const rid = roundId;
    $('clock').classList.remove('is-low');
    $('drawBtns').hidden = true;
    render();
    let n = 0;
    const roll = setInterval(() => { Curio.beep(110 + (n % 2) * 8, .05, 'triangle', .06); if (++n > 9) clearInterval(roll); }, 55);
    setTimeout(() => { if (rid === roundId) stage.classList.add('is-open'); }, 380);
    setTimeout(() => {
      if (rid !== roundId) return;
      state = 'revealed';
      [523, 659, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, i === 2 ? .25 : .12, 'triangle', .12), i * 110));
      caption = Curio.pick(mode === 'friend' ? FRIEND_CAPS : CAPS);
      const cap = $('cap');
      cap.textContent = caption;
      cap.classList.remove('is-in'); void cap.offsetWidth; cap.classList.add('is-in');
      const len = inkLength();
      const tag = strokes.length <= 3 ? TAGS.few : strokes.length >= 25 ? TAGS.many : secs < 8 ? TAGS.fast : secs > 50 ? TAGS.slow : '';
      $('det').textContent = `${strokes.length} strokes · ${Curio.fmt(len / 100, 1)} m of ink · ${secs.toFixed(1)} s${tag ? ' · ' + tag : ''}${twist ? ' · Twist: ' + twist.text : ''}`;
      judged = judge(strokes, secs);
      const tot = showJudges(judged);
      $('doneBtns').hidden = false;
      kept = false; $('keep').disabled = false; $('keep').textContent = '⭐ Keep';
      stats.drawings++; stats.best = Math.max(stats.best, tot);
      if (twist) stats.twists++;
      if (mode === 'prompt' && !stats.prompts.includes(prompt[1])) stats.prompts.push(prompt[1]);
      Curio.store.set('bd-stats', stats);
      Curio.store.set('bd-count', stats.drawings);
      badge('first');
      if (stats.drawings >= 10) badge('ten');
      if (stats.drawings >= 50) badge('fifty');
      if (mode === 'friend') badge('friend');
      if (twist) badge('twist');
      if (stats.twists >= 10) badge('twist10');
      if (tot >= 27) badge('judges');
      if (tot <= 6) badge('flop');
      if (secs < 5) badge('speedy');
      if (stats.prompts.length >= 25) badge('variety');
      if (stats.drawings === 1 || stats.drawings % 10 === 0 || tot >= 27) Curio.confetti();
      renderStats();
      $('again').focus({ preventScroll: true });
    }, 1500);
  }

  function setPrompt() {
    if (mode === 'friend') {
      const nm = $('fname').value.trim();
      $('emo').textContent = '🧑';
      $('word').textContent = nm ? `Draw ${nm}'s face` : "Draw your friend's face";
      $('small').textContent = 'Look at them, not at the screen!';
    } else if (party) {
      $('emo').textContent = prompt[0];
      $('word').textContent = `${party.names[party.i]}: draw ${prompt[1]}`;
      $('small').textContent = `Player ${party.i + 1} of ${party.names.length}. Everyone else, look away from the screen!`;
    } else {
      $('emo').textContent = prompt[0];
      $('word').textContent = `Draw ${prompt[1]}`;
      $('small').textContent = 'Draw anywhere on the curtain. No peeking!';
    }
    $('twist').hidden = !twist;
    if (twist) $('twist').textContent = `${twist.icon} Twist: ${twist.text}`;
  }
  function newRound(change, keepTwist) {
    if (change && mode !== 'friend') { let p; do { p = Curio.pick(PROMPTS); } while (p === prompt); prompt = p; }
    if (!keepTwist) twist = twistOn ? Curio.pick(D.twists) : null;
    strokes = []; cur = null;
    state = 'ready'; roundId++;
    cancelAnimationFrame(clockRaf);
    stage.classList.remove('is-open', 'is-drawing');
    $('clock').textContent = limitNow() ? String(limitNow()) : '';
    $('clock').classList.remove('is-low');
    $('cap').textContent = ''; $('det').textContent = ''; $('judges').innerHTML = '';
    $('drawBtns').hidden = false; $('doneBtns').hidden = true;
    $('reveal').textContent = party ? (party.i < party.names.length - 1 ? '✋ Done, pass the pen' : '🎭 Reveal everyone!') : '🎭 Reveal!';
    setPrompt(); syncCount(); render();
  }

  function startParty() {
    const n = +$('players').value;
    const names = Array.from({ length: n }, (_, i) => ($(`pn${i}`) && $(`pn${i}`).value.trim()) || `Player ${i + 1}`);
    party = { names, i: 0, drawings: [] };
    $('partyRes').hidden = true;
    let p; do { p = Curio.pick(PROMPTS); } while (p === prompt); prompt = p;
    twist = twistOn ? Curio.pick(D.twists) : null;
    newRound(false, true);
    Curio.toast(`${names[0]}, you are up first!`);
  }
  function partyNext(secs) {
    party.drawings.push({ name: party.names[party.i], strokes: strokes.slice(), secs });
    Curio.beep(660, .08, 'triangle', .07);
    if (party.i < party.names.length - 1) {
      party.i++;
      newRound(false, true);
      Curio.toast(`Pass the pen to ${party.names[party.i]} 👉`);
      return;
    }
    state = 'revealed';
    $('drawBtns').hidden = true;
    const res = $('partyRes'); res.hidden = false;
    const grid = $('partyGrid'); grid.innerHTML = '';
    const scored = party.drawings.map((d) => { const js = judge(d.strokes, d.secs); return Object.assign(d, { js, tot: js.reduce((a, j) => a + j.sc, 0) }); });
    const top = Math.max(...scored.map((d) => d.tot));
    scored.forEach((d, i) => {
      const card = document.createElement('div'); card.className = 'bd-pcard' + (d.tot === top ? ' win' : ''); card.style.animationDelay = `${i * 220}ms`;
      const c = document.createElement('canvas'); c.width = 400; c.height = 300;
      const x = c.getContext('2d'); x.fillStyle = paper(); x.fillRect(0, 0, 400, 300); x.setTransform(.5, 0, 0, .5, 0, 0); paint(x, d.strokes, Math.max(penW, 6), ink, twist && twist.flip);
      const meta = document.createElement('div'); meta.className = 'meta';
      meta.innerHTML = `<b></b><span>${d.js.map((j) => `${j.e} ${j.sc}`).join('  ')}</span><strong>${d.tot}/30</strong>`;
      meta.querySelector('b').textContent = `${d.tot === top ? '👑 ' : ''}${d.name}`;
      card.append(c, meta); grid.append(card);
    });
    const winners = scored.filter((d) => d.tot === top).map((d) => d.name);
    $('partyTitle').textContent = `${prompt[0]} ${prompt[1].charAt(0).toUpperCase() + prompt[1].slice(1)}: ${winners.join(' and ')} win${winners.length > 1 ? '' : 's'}!`;
    Curio.confetti(150);
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, .14, 'triangle', .08), i * 120));
    stats.parties++; Curio.store.set('bd-stats', stats); badge('party');
    renderStats();
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function renderPlayers() {
    const n = +$('players').value, box = $('pnames'); const old = [...box.querySelectorAll('input')].map((i) => i.value);
    box.innerHTML = '';
    for (let i = 0; i < n; i++) { const inp = document.createElement('input'); inp.className = 'c-input'; inp.id = `pn${i}`; inp.maxLength = 14; inp.placeholder = `Player ${i + 1}`; inp.value = old[i] || ''; inp.setAttribute('aria-label', `Player ${i + 1} name`); box.append(inp); }
  }

  function pack(list) { return list.map((s) => s.flatMap((p) => [Math.round(p.x), Math.round(p.y)])); }
  function unpack(list) { return list.map((s) => { const out = []; for (let i = 0; i + 1 < s.length; i += 2) out.push({ x: s[i], y: s[i + 1] }); return out; }); }
  function label() {
    if (mode === 'friend') { const nm = $('fname').value.trim(); return { e: '🧑', t: nm ? `${nm}'s face` : "A friend's face" }; }
    return { e: prompt[0], t: prompt[1].charAt(0).toUpperCase() + prompt[1].slice(1) };
  }
  function keep() {
    if (kept) return;
    const l = label();
    gallery.unshift({ id: Date.now(), e: l.e, t: l.t, c: caption, w: penW, k: ink, f: !!(twist && twist.flip), j: judged ? judged.reduce((a, j) => a + j.sc, 0) : null, s: pack(strokes) });
    gallery = gallery.slice(0, 40);
    Curio.store.set('bd-gallery', gallery);
    kept = true; $('keep').disabled = true; $('keep').textContent = '✓ Kept';
    renderGallery();
    Curio.toast('Added to your gallery');
    Curio.beep(784, .08, 'triangle', .1);
    if (gallery.length >= 10) badge('gallery');
  }
  function savePng() {
    const c = document.createElement('canvas');
    c.width = 1600; c.height = 1200;
    const x = c.getContext('2d');
    x.fillStyle = paper(); x.fillRect(0, 0, c.width, c.height);
    x.setTransform(2, 0, 0, 2, 0, 0);
    paint(x, strokes, penW, ink, twist && twist.flip);
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.fillStyle = Curio.isDark() ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.45)';
    x.font = '800 40px system-ui, sans-serif';
    const l = label();
    x.fillText(`${l.t}, drawn blind${judged ? ` · judges: ${judged.reduce((a, j) => a + j.sc, 0)}/30` : ''}`, 40, c.height - 44);
    const a = document.createElement('a');
    a.download = `blind-${l.t.toLowerCase().replace(/[^a-z]+/g, '-')}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }
  function renderGallery() {
    const gal = $('gal');
    gal.innerHTML = '';
    $('galCount').textContent = gallery.length ? `${gallery.length} saved` : '';
    if (!gallery.length) {
      const e = document.createElement('div'); e.className = 'bd-empty';
      e.textContent = 'Your blind masterpieces will hang here. Reveal one and press Keep.';
      gal.append(e); return;
    }
    gallery.forEach((it, idx) => {
      const card = document.createElement('div'); card.className = 'bd-card'; card.style.animationDelay = `${Math.min(idx * 30, 400)}ms`;
      const want = document.createElement('div'); want.className = 'bd-want';
      want.innerHTML = '<small>Prompt</small><span></span><b></b>';
      want.querySelector('span').textContent = it.e;
      want.querySelector('b').textContent = it.t;
      const c = document.createElement('canvas');
      c.width = 320; c.height = 240;
      c.setAttribute('role', 'img'); c.setAttribute('aria-label', `Blind drawing of ${it.t}`);
      const x = c.getContext('2d');
      x.fillStyle = paper(); x.fillRect(0, 0, 320, 240);
      x.setTransform(.4, 0, 0, .4, 0, 0);
      paint(x, unpack(it.s), Math.max(it.w, 6), it.k && INKS[it.k] ? it.k : 'ink', !!it.f);
      const q = document.createElement('div'); q.className = 'bd-q'; q.textContent = `"${it.c}"${it.j != null ? ` · ${it.j}/30` : ''}`;
      const del = document.createElement('button'); del.type = 'button'; del.className = 'bd-del'; del.textContent = '✕';
      del.setAttribute('aria-label', 'Delete');
      del.addEventListener('click', () => { gallery = gallery.filter((g2) => g2.id !== it.id); Curio.store.set('bd-gallery', gallery); renderGallery(); });
      card.append(want, c, q, del);
      gal.append(card);
    });
  }

  const BADGES = [
    { id: 'first', icon: '🎭', name: 'Opening night', d: 'Reveal your first drawing' },
    { id: 'ten', icon: '🖍️', name: 'Regular', d: 'Reveal 10 drawings' },
    { id: 'fifty', icon: '🏛️', name: 'Retrospective', d: 'Reveal 50 drawings' },
    { id: 'friend', icon: '🧑', name: 'Portraitist', d: 'Draw a friend blind' },
    { id: 'party', icon: '🎉', name: 'Party animal', d: 'Finish a Pass the Pen game' },
    { id: 'twist', icon: '🌀', name: 'Plot twist', d: 'Finish a drawing with a twist' },
    { id: 'twist10', icon: '🎪', name: 'Circus act', d: 'Finish 10 twists' },
    { id: 'judges', icon: '🏆', name: 'Standing ovation', d: 'Score 27+ from the judges' },
    { id: 'flop', icon: '🍅', name: 'Tomatoes thrown', d: 'Score 6 or less' },
    { id: 'speedy', icon: '⚡', name: 'Speed sketch', d: 'Reveal in under 5 seconds' },
    { id: 'variety', icon: '🗂️', name: 'Range', d: 'Draw 25 different prompts' },
    { id: 'gallery', icon: '🖼️', name: 'Curator', d: 'Keep 10 drawings' }
  ];
  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('bd-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) setTimeout(() => { Curio.toast(`${b.icon} Badge: ${b.name}`, 2400); [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .06), i * 80)); }, 1200);
    renderBadges();
  }
  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'bd-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    renderStats();
  }
  function renderStats() {
    $('stats2').innerHTML = [[stats.drawings, 'Reveals'], [`${stats.best}/30`, 'Best judging'], [stats.twists, 'Twists'], [stats.parties, 'Parties'], [`${stats.prompts.length}/${PROMPTS.length}`, 'Prompts drawn'], [`${badges.length}/${BADGES.length}`, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }

  function setMode(m) {
    mode = m; Curio.store.set('bd-mode', m);
    party = null;
    document.body.classList.toggle('is-friend', m === 'friend');
    document.body.classList.toggle('is-party', m === 'party');
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    $('skip').style.display = m === 'friend' ? 'none' : '';
    $('partyRes').hidden = true;
    if (m === 'friend' && !timeLimit) { timeLimit = 60; $('timer').value = '60'; }
    if (m === 'party') { renderPlayers(); startParty(); return; }
    newRound(false);
  }

  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('timer').value = String(timeLimit);
  $('timer').addEventListener('change', (e) => { timeLimit = +e.target.value; Curio.store.set('bd-timer', timeLimit); if (state === 'ready') $('clock').textContent = limitNow() ? String(limitNow()) : ''; });
  $('pen').value = String(penW);
  $('pen').addEventListener('change', (e) => { penW = +e.target.value; Curio.store.set('bd-pen', penW); render(); });
  const inkSel = $('ink');
  Object.entries(INKS).forEach(([k, v]) => { const o = document.createElement('option'); o.value = k; o.textContent = v; inkSel.append(o); });
  inkSel.value = ink;
  inkSel.addEventListener('change', () => { ink = inkSel.value; Curio.store.set('bd-ink', ink); render(); });
  $('twistOn').checked = twistOn;
  $('twistOn').addEventListener('change', () => { twistOn = $('twistOn').checked; Curio.store.set('bd-twist', twistOn); if (state === 'ready') { twist = twistOn ? Curio.pick(D.twists) : null; setPrompt(); syncCount(); $('clock').textContent = limitNow() ? String(limitNow()) : ''; } });
  $('players').addEventListener('change', () => { renderPlayers(); if (mode === 'party') startParty(); });
  $('partyGo').addEventListener('click', () => { if (mode !== 'party') setMode('party'); else startParty(); });
  $('partyAgain').addEventListener('click', () => { startParty(); $('stage').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('fname').addEventListener('input', () => { if (state !== 'revealed') setPrompt(); });
  $('undo').addEventListener('click', () => { strokes.pop(); syncCount(); Curio.beep(240, .05, 'triangle', .06); });
  $('skip').addEventListener('click', () => { if (party) { let p; do { p = Curio.pick(PROMPTS); } while (p === prompt); prompt = p; party.i = 0; party.drawings = []; newRound(false, true); } else newRound(true); Curio.beep(520, .05, 'sine', .07); });
  $('reveal').addEventListener('click', reveal);
  $('keep').addEventListener('click', keep);
  $('png').addEventListener('click', savePng);
  $('again').addEventListener('click', () => newRound(true));
  Curio.drag(cv, { start: down, move, end: up });
  if (matchMedia('(pointer: fine)').matches && !Curio.touchpad && !Curio.store.get('bd-tp-tip', false)) { Curio.store.set('bd-tp-tip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar', 4000), 1200); }
  cv.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); }, { passive: false });
  window.addEventListener('resize', resize);
  window.addEventListener('curio:theme', () => { applyPaper(); render(); renderGallery(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && state === 'drawing') startClock(); });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, textarea, select') || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (e.key === 'Enter') { if (!$('reveal').disabled) reveal(); else if (!$('doneBtns').hidden) newRound(true); }
    else if (k === 'z' && !$('undo').disabled) $('undo').click();
    else if (k === 'n' && state !== 'drawing') $('skip').click();
    else if (k === 'k' && !$('doneBtns').hidden) keep();
  });

  applyPaper();
  renderPlayers();
  setMode(mode);
  renderGallery();
  renderBadges();
  resize();
  window.__blind = { get state() { return state; }, get strokes() { return strokes.length; }, get party() { return party; } };
})();
