(() => {
  const A = window.RobotArt;
  const $ = (s) => document.querySelector(s);
  const cap = $('#cap'), head = $('#head'), body = $('#body'), msg = $('#msg'), verifyBtn = $('#verify');
  const SAVE = 'robot:v2';
  const vibrate = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hashStr = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const fmtT = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  const BADGES = [
    ['human', '🧑', 'Certified human', 'Finish the story'], ['flawless', '💎', 'Suspiciously perfect', 'Finish the story with 3 or fewer fails'],
    ['speed', '⏱️', 'Speedrunner', 'Finish a speedrun in under 10 minutes'], ['daily', '📅', 'Daily human', 'Finish a daily gauntlet'],
    ['circle', '⭕', 'Perfect circle', 'Draw a circle scoring 90% or more'], ['catch', '🏃', 'Caught it', 'Catch the runaway checkbox'],
    ['clicker', '👆', 'Click fiend', 'Click one box 50 times'], ['sheep', '🐑', 'Shepherd', 'Count the sheep right first time'],
    ['patience', '🧘', 'Patience', 'Resist the button'], ['purr', '🐈', 'Cat whisperer', 'Make the cat purr'],
    ['sus', '🤖', 'Highly suspicious', 'Fail 50 captchas in total'], ['practice', '🎯', 'Practice makes human', 'Clear 10 levels in practice mode']
  ];
  const blank = () => ({ v: 2, maxLevel: 0, story: null, best: {}, daily: {}, badges: [], totalFails: 0, practice: 0, done: {} });
  function load() {
    const d = blank(), s = Curio.store.get(SAVE, null);
    if (!s || typeof s !== 'object' || s.v !== 2) return d;
    for (const k of Object.keys(d)) if (s[k] === undefined || (d[k] !== null && (typeof s[k] !== typeof d[k] || Array.isArray(d[k]) !== Array.isArray(s[k])))) s[k] = d[k];
    return s;
  }
  const save = load();
  const persist = () => Curio.store.set(SAVE, save);
  function award(id) {
    if (save.badges.includes(id)) return;
    save.badges.push(id); persist();
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => { Curio.toast(`${b[1]} Badge unlocked: ${b[2]}`, 2600); Curio.beep(1046, .12, 'triangle', .07); setTimeout(() => Curio.beep(1568, .16, 'triangle', .07), 100); }, 500);
  }

  $('#inspector').innerHTML = A.inspector();
  const insp = $('#inspector'), sayEl = $('#say');
  function say(t, mood) {
    sayEl.textContent = t; sayEl.classList.remove('pop'); void sayEl.offsetWidth; sayEl.classList.add('pop');
    insp.classList.remove('sus', 'happy', 'shake');
    if (mood) { void insp.offsetWidth; insp.classList.add(mood); if (mood === 'sus') insp.classList.add('shake'); }
  }
  const FAILS = ["Hmm. That's exactly what a robot would do.", 'Beep boop? We heard that.', 'Incorrect. Please try again, human (allegedly).', 'Our AI thinks you are an AI.', 'Close. But robots are also close.', 'A real human would have got that. Probably.', 'Suspicious. Very suspicious.', "Error 418: I'm a teapot. Are you?", "We've notified your toaster.", 'Please blink twice if you are human.'];
  const PASSES = ['Fine. Next.', 'Noted. Moving on.', 'Acceptable. For now.', 'My sensors are... inconclusive.', 'Humanlike behaviour detected.', 'Impressive. For a carbon unit.', 'You may proceed.', 'That checks out. Annoyingly.'];

  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  let cleanup = [], onVerify = null, passing = false;
  const later = (fn, ms) => { const t = setTimeout(fn, ms); cleanup.push(() => clearTimeout(t)); return t; };
  const every = (fn, ms) => { const t = setInterval(() => { if (!document.hidden) fn(); }, ms); cleanup.push(() => clearInterval(t)); };
  const loop = (fn) => { let r = 0, last = performance.now(); const f = (t) => { r = requestAnimationFrame(f); const dt = Math.min(.05, (t - last) / 1000); last = t; if (!document.hidden) fn(dt, t); }; r = requestAnimationFrame(f); cleanup.push(() => cancelAnimationFrame(r)); };
  const drag = (el, hs) => { cleanup.push(Curio.drag(el, hs)); };
  const listen = (el, ev, fn, o) => { el.addEventListener(ev, fn, o); cleanup.push(() => el.removeEventListener(ev, fn, o)); };
  function header(small, big, sub) { head.innerHTML = `<small>${small}</small><b>${big}</b>${sub ? `<small>${sub}</small>` : ''}`; head.hidden = false; }
  function checkboxRow(label) {
    const row = h('div', 'cb-row');
    row.innerHTML = `<div class="cb-left"><button class="cb" type="button" aria-label="${label}"></button><span>${label}</span></div><div class="logo">${A.svg('<path d="M20 3 l13 5 v10 c0 9 -6 15 -13 19 c-7 -4 -13 -10 -13 -19 v-10Z" fill="#4a90e2"/><path d="M13 20 l5 5 l9 -10" stroke="#fff" stroke-width="3.5" fill="none"/>')}notCAPTCHA</div>`;
    return row;
  }
  function grid(cols, items, opts = {}) {
    const g = h('div', 'grid'); g.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    items.forEach((inner, k) => {
      const b = h('button', 'tile'); b.type = 'button'; b.innerHTML = inner; b.setAttribute('aria-label', (opts.labels && opts.labels[k]) || `Tile ${k + 1}`); b.setAttribute('aria-pressed', 'false');
      if (opts.wiggle && opts.wiggle[k]) b.classList.add('wiggle');
      b.onclick = () => { if (opts.onTap) return opts.onTap(k, b); b.classList.toggle('sel'); b.setAttribute('aria-pressed', String(b.classList.contains('sel'))); Curio.beep(600, .03, 'sine', .05); };
      g.append(b);
    });
    body.append(g);
    return g;
  }
  const selected = (g) => [...g.children].map((b, k) => (b.classList.contains('sel') ? k : -1)).filter((k) => k >= 0);
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  let mode = 'story', order = [], idx = 0, fails = 0, levelFails = 0, hum = 100, t0 = 0, elapsedBase = 0, splits = [], levelStart = 0;
  function pass(note) {
    if (passing) return; passing = true;
    Curio.beep(880, .08, 'triangle', .1); setTimeout(() => Curio.beep(1320, .1, 'triangle', .1), 80); vibrate(15);
    msg.className = 'msg ok'; msg.textContent = note || 'Verified ✔';
    cap.classList.add('passed'); onVerify = null;
    hum = Math.min(100, hum + 2); paintMeter();
    splits.push({ id: LEVELS[order[idx]].id, ms: performance.now() - levelStart, f: levelFails });
    const lv = order[idx];
    if (mode === 'story' || mode === 'speed') { save.maxLevel = Math.max(save.maxLevel, lv + 1); }
    save.done[LEVELS[lv].id] = 1;
    if (mode === 'practice') { save.practice++; if (save.practice >= 10) award('practice'); }
    persist();
    say(Curio.pick(PASSES), 'happy');
    setTimeout(() => { if (!$('#play').hidden) { idx++; if (mode === 'practice' || idx >= order.length) finish(); else loadLevel(); } }, 850);
  }
  function fail(text) {
    if (passing) return;
    fails++; levelFails++; save.totalFails++; if (save.totalFails >= 50) award('sus'); persist();
    hum = Math.max(0, hum - 5); paintMeter();
    Curio.beep(160, .18, 'sawtooth', .08); vibrate([30, 30, 30]);
    msg.className = 'msg'; msg.textContent = text || Curio.pick(FAILS);
    cap.classList.remove('shake'); void cap.offsetWidth; cap.classList.add('shake');
    say(Curio.pick(['Interesting.', 'I saw that.', 'Logging this incident.', 'Bzzt. Suspicious.', 'Humans make mistakes. So do robots pretending.', 'Hmm.']), 'sus');
    if (mode === 'story') saveStory();
  }
  function paintMeter() { $('#meter').style.width = hum + '%'; $('#meterTxt').textContent = `Humanity ${hum}%`; }

  const LEVELS = [
    { id: 'box', hint: 'Just click the box. Really.', run() {
      head.hidden = true; verifyBtn.hidden = true;
      const row = checkboxRow("I'm not a robot"); body.append(row);
      const cb = row.querySelector('.cb');
      cb.onclick = () => { if (cb.classList.contains('spin')) return; cb.classList.add('spin'); later(() => { cb.classList.remove('spin'); cb.classList.add('ok'); pass('Easy, right? Right.'); }, 900); };
    } },
    { id: 'runaway', hint: 'It gets tired after a few escapes. Keep chasing it.', run() {
      head.hidden = true; verifyBtn.hidden = true;
      const zone = h('div', 'zone'); body.append(zone);
      const cb = h('button', 'cb'); cb.type = 'button'; cb.setAttribute('aria-label', "I'm not a robot");
      const label = h('div', 'note', "I'm not a robot"); zone.append(cb, label);
      let x = 40, y = 60, esc2 = 0; const tired = 6;
      const put = () => { cb.style.left = x + 'px'; cb.style.top = y + 'px'; }; put();
      const flee = () => {
        esc2++;
        const W = zone.clientWidth - 36, H = zone.clientHeight - 70;
        let nx, ny, t = 0; do { nx = Curio.randInt(4, W); ny = Curio.randInt(4, H); t++; } while (Math.hypot(nx - x, ny - y) < 90 && t < 20);
        x = nx; y = ny; put(); Curio.beep(900 + esc2 * 60, .04, 'square', .05);
        label.textContent = ['Nope.', 'Too slow!', 'Catch me!', "Robots can't catch me.", 'Wheee!', 'Okay okay...'][Math.min(esc2 - 1, 5)];
        if (esc2 >= tired) label.textContent = "Fine. I'm tired. Click me.";
      };
      listen(zone, 'pointermove', (e) => { if (esc2 >= tired || e.pointerType !== 'mouse') return; const r = cb.getBoundingClientRect(); if (Math.hypot(e.clientX - (r.left + 16), e.clientY - (r.top + 16)) < 55) flee(); });
      cb.addEventListener('pointerdown', (e) => { if (esc2 < tired) { e.preventDefault(); flee(); } });
      cb.onclick = () => { if (esc2 < tired) return; cb.classList.add('ok'); award('catch'); pass('Caught it. Impressive, for a human.'); };
    } },
    { id: 'lights', hint: 'Every square with a traffic light. Not the cones.', run() {
      const decoys = ['car', 'tree', 'house', 'bike', 'bus', 'bird', 'cone', 'scooter', 'taxi', 'building', 'hotdog', 'duck', 'hydrant'];
      const n = Curio.randInt(4, 6);
      const tiles = Curio.shuffle([...Array(n).fill('trafficlight'), ...Array.from({ length: 16 - n }, () => Curio.pick(decoys))]);
      header('Select all squares with', 'traffic lights', 'If there are none, you are lying.');
      const g = grid(4, tiles.map((t) => A.svg(A.I[t])), { labels: tiles });
      onVerify = () => { const want = tiles.map((t, k) => (t === 'trafficlight' ? k : -1)).filter((k) => k >= 0); same(selected(g), want) ? pass() : fail(selected(g).length < want.length ? 'You missed a traffic light. It saw you.' : null); };
    } },
    { id: 'wobbly', hint: 'Six characters, lower case. Press New text if it is too wobbly.', run() {
      header('Type the text below', 'Wobbly words', "Case doesn't matter. Sanity might.");
      const cv = h('canvas'); cv.width = 360; cv.height = 110; cv.style.cssText = 'width:100%;border-radius:4px;display:block'; cv.setAttribute('role', 'img');
      const inp = h('input', 'inp'); inp.placeholder = 'Type what you see'; inp.autocomplete = 'off'; inp.setAttribute('aria-label', 'Captcha text'); inp.autocapitalize = 'off'; inp.spellcheck = false;
      const again = h('button', 'sbtn', '🔄 New text'); again.type = 'button';
      const row = h('div', 'row'); row.append(again); body.append(cv, inp, row);
      let word = '', seeds = [];
      const g = cv.getContext('2d');
      const make = () => { word = Array.from({ length: 6 }, () => 'abcdefhkmnprstuvwxyz2345678'[Curio.randInt(0, 26)]).join(''); seeds = [...word].map(() => [Math.random() * 6, Curio.rand(-.5, .5), Curio.pick(['#2c3e50', '#8e44ad', '#c0392b', '#16a085', '#d35400'])]); cv.setAttribute('aria-label', 'Distorted text reading ' + word.split('').join(' ')); };
      make();
      loop((dt, t) => {
        g.fillStyle = '#e9eef3'; g.fillRect(0, 0, 360, 110);
        for (let k = 0; k < 6; k++) { g.strokeStyle = `hsl(${k * 60},40%,70%)`; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 20 + k * 15); for (let x = 0; x <= 360; x += 20) g.lineTo(x, 20 + k * 15 + Math.sin(x / 30 + t / 700 + k) * 10); g.stroke(); }
        [...word].forEach((ch, k) => { const [s, rot, col] = seeds[k]; g.save(); g.translate(40 + k * 56, 66 + Math.sin(t / 400 + s) * 12); g.rotate(rot + Math.sin(t / 600 + s) * .25); g.scale(1 + Math.sin(t / 500 + s) * .15, 1); g.fillStyle = col; g.font = `900 ${44 + (k % 3) * 6}px Georgia, serif`; g.textAlign = 'center'; g.fillText(ch, 0, 14); g.restore(); });
        g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(120, 20, 240, 110, 360, 50); g.stroke();
      });
      again.onclick = () => { make(); inp.value = ''; inp.focus(); };
      onVerify = () => (inp.value.trim().toLowerCase() === word ? pass() : (fail(), make(), inp.value = ''));
      later(() => inp.focus({ preventScroll: true }), 300);
    } },
    { id: 'sad', hint: 'Frowns and tears count. Smiles and sunglasses do not.', run() {
      const sad = ['sad', 'cry', 'tear'], happy = ['happy', 'laugh', 'cool', 'love', 'wink'];
      const n = Curio.randInt(3, 4);
      const tiles = Curio.shuffle([...Array.from({ length: n }, () => Curio.pick(sad)), ...Array.from({ length: 9 - n }, () => Curio.pick(happy))]);
      header('Select all images that are', 'sad', 'Emotionally, not technically.');
      const g = grid(3, tiles.map((m, k) => A.svg(A.face(m, k))), { labels: tiles.map((m) => `a ${m} face`) });
      onVerify = () => { const want = tiles.map((t, k) => (sad.includes(t) ? k : -1)).filter((k) => k >= 0); same(selected(g), want) ? pass('You have feelings. Noted.') : fail("Robots don't understand sadness. Do you?"); };
    } },
    { id: 'fifty', hint: 'Click the track, then use the arrow keys or the nudge buttons.', run() {
      header('Set the slider to', 'exactly 50%', 'Not 49.9. Not 50.1. Fifty.');
      const val = h('div', 'count-big', '0.0%');
      const r = h('input'); r.type = 'range'; r.min = 0; r.max = 100; r.step = .1; r.value = Curio.pick([3.7, 88.2, 21.4, 72.9]); r.style.width = '100%'; r.setAttribute('aria-label', 'Percentage slider');
      const row = h('div', 'row');
      [['−1', -1], ['−0.1', -.1], ['+0.1', .1], ['+1', 1]].forEach(([l, d]) => { const b = h('button', 'sbtn', l); b.type = 'button'; b.onclick = () => { r.value = Math.round((+r.value + d) * 10) / 10; paint(); Curio.beep(500 + d * 200, .03, 'triangle', .04); }; row.append(b); });
      body.append(val, r, row);
      const paint = () => { val.textContent = (+r.value).toFixed(1) + '%'; };
      r.addEventListener('input', paint); paint();
      onVerify = () => (Math.abs(+r.value - 50) < .001 ? pass('Perfectly balanced.') : fail(`${(+r.value).toFixed(1)}% is not 50%. A robot would know that.`));
    } },
    { id: 'clicks', hint: 'Space bar works too, if your finger is tired.', run() {
      head.hidden = true; verifyBtn.hidden = true;
      const row = checkboxRow("I'm not a robot (click 50 times)"); body.append(row);
      const cnt = h('div', 'count-big', '0 / 50'); body.append(cnt);
      const cb = row.querySelector('.cb'); let n = 0;
      const hit = () => { if (n >= 50) return; n++; cnt.textContent = `${n} / 50`; cb.classList.toggle('ok', n % 2 === 1); Curio.beep(300 + n * 12, .03, 'square', .04); if (n === 25) { msg.className = 'msg ok'; msg.textContent = 'Halfway! Your finger is very human.'; } if (n >= 50) { cb.classList.add('ok'); award('clicker'); pass('50 clicks. Robots get bored after 49.'); } };
      cb.onclick = hit;
      listen(document, 'keydown', (e) => { if (e.key === ' ' && !e.repeat && document.activeElement !== cb) { e.preventDefault(); hit(); } });
    } },
    { id: 'giraffe', hint: 'Turn it until the legs point down. Arrow keys work.', run() {
      header('Rotate the image', "so it's upright", 'Giraffes are usually vertical.');
      let rot = Curio.pick([60, 90, 120, 150, 180, 210, 240, 270, 300]);
      const img = h('div'); img.innerHTML = `<svg class="big-art" viewBox="0 0 150 150" width="170" height="170" role="img" aria-label="A rotated giraffe">${A.giraffe}</svg>`;
      const art = img.firstChild;
      const paint = () => { art.style.transform = `rotate(${rot}deg)`; };
      const row = h('div', 'row');
      const turn = (d) => { rot += d; paint(); Curio.beep(500, .03); };
      [['⟲ Left', -30], ['⟳ Right', 30]].forEach(([l, d]) => { const b = h('button', 'sbtn', l); b.type = 'button'; b.onclick = () => turn(d); row.append(b); });
      body.append(img, row); paint();
      listen(document, 'keydown', (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); turn(-30); } if (e.key === 'ArrowRight') { e.preventDefault(); turn(30); } });
      onVerify = () => ((((rot % 360) + 360) % 360) === 0 ? pass('That giraffe thanks you.') : fail('The giraffe is dizzy. Try again.'));
    } },
    { id: 'math', hint: 'The previous sum is accepted too, if you are a bit slow.', run() {
      header('Solve', '<span id="eq">?</span>', 'Quickly. It changes.');
      const inp = h('input', 'inp'); inp.inputMode = 'numeric'; inp.placeholder = 'Answer'; inp.setAttribute('aria-label', 'Answer'); body.append(inp);
      let cur = 0, prev = null;
      const roll = () => { const a = Curio.randInt(2, 19), b = Curio.randInt(2, 12), op = Curio.pick(['+', '×', '−']); prev = cur; cur = op === '+' ? a + b : op === '×' ? a * b : a - b; const e = head.querySelector('#eq'); if (e) e.textContent = `${a} ${op} ${b}`; };
      roll(); every(roll, 2600);
      onVerify = () => { const v = parseInt(inp.value.replace('−', '-'), 10); v === cur || v === prev ? pass('Maths: completed. Brain: slightly warm.') : (fail('Wrong, or too slow. Both very human, though.'), inp.value = ''); };
      later(() => inp.focus({ preventScroll: true }), 300);
    } },
    { id: 'three', hint: 'Count "one Mississippi, two Mississippi..." in your head.', run() {
      header('Start the timer and stop it at', 'exactly 3 seconds', 'No clock. Feel it in your soul.');
      verifyBtn.hidden = true;
      const b = h('button', 'hold', '▶ START'); b.type = 'button';
      const out = h('div', 'count-big', '&nbsp;'); body.append(b, out);
      let t1 = 0, on = false;
      b.onclick = () => {
        if (!on) { on = true; t1 = performance.now(); b.classList.add('on'); b.textContent = '■ STOP'; Curio.beep(660, .05, 'triangle', .06); return; }
        on = false; b.classList.remove('on'); b.textContent = '▶ START';
        const s = (performance.now() - t1) / 1000; out.textContent = s.toFixed(2) + 's';
        Math.abs(s - 3) <= .2 ? pass('Your internal clock is impeccable.') : fail(s < 3 ? 'Too short. Impatient, like a robot.' : 'Too long. Did you fall asleep?');
      };
    } },
    { id: 'robots', hint: 'Look very carefully at what each thing actually is.', run() {
      const objs = Curio.shuffle(['toaster', 'broom', 'fax', 'gamepad', 'ufo', 'dish', 'plug', 'leg', 'mechanic']);
      const names = { toaster: "That's a toaster.", broom: "That's a broom. It's not even electric.", fax: "That's a fax machine. It's just old.", gamepad: "That's a controller.", ufo: "That's a UFO. Different problem.", dish: "That's a satellite dish.", plug: "That's a plug. Rude.", leg: "That's a prosthetic leg. Very human.", mechanic: "That's Dave. Dave is a mechanic." };
      header('Select all squares with', 'robots', 'Take your time.');
      const g = grid(3, objs.map((o) => A.svg(A.I[o])), { labels: objs });
      onVerify = () => { const s = selected(g); s.length === 0 ? pass('Correct. There were no robots. A robot would have found one.') : fail(names[objs[s[0]]]); };
    } },
    { id: 'crowd', hint: 'Glasses AND a moustache. He is very proud of it.', run() {
      header('Find the one wearing', 'a disguise', 'He thinks he blends in.');
      verifyBtn.hidden = true;
      const crowd = h('div', 'crowd'); const N = 60, target = Curio.randInt(0, N - 1);
      for (let k = 0; k < N; k++) {
        const b = h('button'); b.type = 'button'; b.innerHTML = A.svg(A.person(k * 5 + 3, k === target ? A.disguise : (k % 11 === 4 ? '<circle cx="16.5" cy="16" r="3.2" fill="none" stroke="#111" stroke-width="1.4"/><circle cx="23.5" cy="16" r="3.2" fill="none" stroke="#111" stroke-width="1.4"/>' : '')));
        b.setAttribute('aria-label', k === target ? 'person in disguise' : 'person');
        b.onclick = () => (k === target ? pass('Found him! His mum will be so disappointed.') : fail(Curio.pick(["That's Gary.", "That's just Linda.", 'Nope, those are real glasses.', "That's your neighbour. Wave!"])));
        crowd.append(b);
      }
      body.append(crowd);
    } },
    { id: 'yourself', hint: 'Only one of them has a face made of skin.', run() {
      const n = Curio.randInt(0, 8);
      header('Select the image of', 'yourself', 'Be honest.');
      verifyBtn.hidden = true;
      grid(3, Array.from({ length: 9 }, (_, k) => A.svg(k === n ? A.person(Curio.randInt(0, 30)) : A.robotFace)), { labels: Array.from({ length: 9 }, (_, k) => (k === n ? 'a human' : 'a robot')), onTap: (k) => (k === n ? pass("Good. That's you. Probably.") : fail("Interesting. Very interesting. We'll make a note.")) });
    } },
    { id: 'green', hint: 'Wait for green. Space also clicks it.', run() {
      header("Click the light when it's", 'green', 'Three times. Red resets you.');
      verifyBtn.hidden = true;
      const light = h('button', 'light'); light.type = 'button'; light.setAttribute('aria-label', 'Traffic light');
      const out = h('div', 'count-big', '0 / 3'); body.append(light, out);
      let col = 'red', hits = 0;
      const COLS = { red: '#e74c3c', amber: '#f39c12', green: '#2ecc71' };
      const cycle = () => { col = col === 'green' ? Curio.pick(['red', 'amber']) : Curio.pick(['red', 'amber', 'green', 'green']); light.style.background = COLS[col]; light.style.color = COLS[col]; light.setAttribute('aria-label', 'Light is ' + col); later(cycle, col === 'green' ? Curio.randInt(700, 1100) : Curio.randInt(600, 1400)); };
      cycle();
      light.onclick = () => {
        if (col === 'green') { hits++; out.textContent = `${hits} / 3`; Curio.beep(700 + hits * 100, .06, 'triangle', .1); if (hits >= 3) { light.onclick = null; pass('Great reflexes. Suspiciously great.'); } }
        else { hits = 0; out.textContent = '0 / 3'; fail(col === 'red' ? 'That was red. Colourblind robots do that.' : 'Amber means wait. Everybody knows that.'); }
      };
    } },
    { id: 'cheese', hint: 'Drag it, or in Touchpad mode click once to pick it up and click again to drop. Enter feeds him too.', run() {
      header('Drag the cheese to', 'the mouse', "He's been waiting all day.");
      verifyBtn.hidden = true;
      const zone = h('div', 'zone'); body.append(zone);
      const cheese = h('div', 'piece', A.svg(A.I.cheese)); cheese.setAttribute('role', 'button'); cheese.setAttribute('aria-label', 'Cheese, drag it or press Enter'); cheese.tabIndex = 0;
      const mouse = h('div', 'piece', A.svg(A.I.mouse)); mouse.style.cursor = 'default';
      zone.append(cheese, mouse);
      const W = () => zone.clientWidth;
      let cx = 20, cy = 150, mx = W() - 90, my = 30, off = null, fed = false;
      const put = () => { cheese.style.left = cx + 'px'; cheese.style.top = cy + 'px'; mouse.style.left = mx + 'px'; mouse.style.top = my + 'px'; };
      put();
      const feed = () => { if (fed) return; fed = true; cheese.remove(); mouse.innerHTML = A.svg(A.I.mouseHappy); Curio.beep(1200, .08, 'triangle', .08); pass('Nom. The mouse vouches for you.'); };
      drag(cheese, {
        start: (p) => { off = { dx: p.x, dy: p.y }; },
        move: (p) => { if (!off || fed) return; const r = zone.getBoundingClientRect(); cx = Math.max(0, Math.min(W() - 60, p.clientX - r.left - off.dx)); cy = Math.max(0, Math.min(170, p.clientY - r.top - off.dy)); put(); if (Math.hypot(cx - mx, cy - my) < 46) feed(); },
        end: () => { off = null; }
      });
      cheese.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); feed(); } });
      every(() => { if (fed) return; mx = Math.max(0, Math.min(W() - 60, mx + Curio.randInt(-20, 20))); my = Math.max(0, Math.min(170, my + Curio.randInt(-14, 14))); put(); }, 1100);
    } },
    { id: 'vibe', hint: 'The squares that are dancing. Those are vibing.', run() {
      const icons = ['star', 'heart', 'moon', 'leaf', 'drop', 'bolt', 'sun', 'cloud', 'duck'];
      const wig = Curio.shuffle([1, 1, 1, Curio.randInt(0, 1), 0, 0, 0, 0, 0]);
      const tiles = Curio.shuffle(icons);
      header('Select all squares that', 'are vibing', 'You will know it when you see it.');
      const g = grid(3, tiles.map((t) => A.svg(A.I[t])), { wiggle: wig });
      onVerify = () => { const want = wig.map((w, k) => (w ? k : -1)).filter((k) => k >= 0); same(selected(g), want) ? pass('Good vibes only. Verified.') : fail('Those vibes were off.'); };
    } },
    { id: 'dog', hint: 'One word. Starts with a W, often.', run() {
      header('Type the sound', 'a dog makes', 'Spelling is flexible. Dogs are too.');
      const inp = h('input', 'inp'); inp.placeholder = 'The sound'; inp.setAttribute('aria-label', 'Dog sound'); body.append(inp);
      onVerify = () => { const v = inp.value.toLowerCase().replace(/[^a-z ]/g, '').trim(); /^(w+o+f+|b+a+r+k+|r+u+f+|a+r+f+|w+u+f+|bow ?wow|y+a+p+|w+o+o+f+|g+r+)+( |$)/.test(v) ? pass('Good human. Who is a good human? You are.') : fail(v === 'meow' ? 'That is a cat. We have concerns.' : v ? `"${v}"? No dog says that.` : 'Silence? Even robots beep.'); };
      later(() => inp.focus({ preventScroll: true }), 300);
    } },
    { id: 'circle', hint: 'One smooth loop, ending where you started. Touchpad mode: click to start drawing, click again to stop.', run() {
      header('Draw a', 'perfect circle', 'Robots draw perfect circles. Humans draw nearly perfect circles. Go.');
      verifyBtn.hidden = true;
      const cv = h('canvas', 'drawpad'); body.append(cv);
      const out = h('div', 'count-big', '&nbsp;'); body.append(out);
      const g = cv.getContext('2d');
      let pts = [], scale = 1;
      const size = () => { const w = cv.clientWidth; scale = Math.min(2, devicePixelRatio || 1); cv.width = w * scale; cv.height = 260 * scale; g.setTransform(scale, 0, 0, scale, 0, 0); };
      later(size, 0);
      const draw = (col) => { g.clearRect(0, 0, cv.width, cv.height); g.strokeStyle = col || '#4a90e2'; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); };
      drag(cv, {
        start: (p) => { pts = [p]; out.innerHTML = '&nbsp;'; },
        move: (p) => { if (!pts.length) return; const l = pts[pts.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 2) { pts.push({ x: p.x, y: p.y }); draw(); } },
        end: () => {
          if (pts.length < 12) { pts = []; return; }
          const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length, cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
          const rs = pts.map((p) => Math.hypot(p.x - cx, p.y - cy)); const r = rs.reduce((a, b) => a + b, 0) / rs.length;
          const sd = Math.sqrt(rs.reduce((a, b) => a + (b - r) ** 2, 0) / rs.length);
          let sweep = 0; for (let i = 1; i < pts.length; i++) { let d = Math.atan2(pts[i].y - cy, pts[i].x - cx) - Math.atan2(pts[i - 1].y - cy, pts[i - 1].x - cx); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; sweep += d; }
          const gap = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) / r;
          let score = Math.max(0, 1 - sd / r * 2.4) * 100;
          if (Math.abs(sweep) < 5.4 || gap > .6 || r < 25) score = Math.min(score, 40);
          score = Math.round(score * 10) / 10;
          out.textContent = score.toFixed(1) + '%';
          draw(score >= 75 ? '#22c55e' : '#ef4444');
          if (score >= 90) award('circle');
          if (score >= 75) pass(score >= 95 ? 'Too perfect... but we will allow it.' : 'A lovely, wobbly, human circle.');
          else fail(Math.abs(sweep) < 5.4 ? 'That is not a full circle. Go all the way round.' : 'That is more of a potato. Try again.');
          pts = [];
        }
      });
    } },
    { id: 'sheep', hint: 'Count each one as it jumps. Press Replay to watch again (it counts as a fail).', run() {
      header('Count the sheep', 'jumping the fence', 'Try not to fall asleep.');
      const N = Curio.randInt(4, 9);
      const zone = h('div', 'zone'); zone.innerHTML = `<svg viewBox="0 0 300 200" style="width:100%;height:100%" aria-hidden="true"><rect y="150" width="300" height="50" fill="#86c86d"/><g fill="#a16207"><rect x="140" y="104" width="8" height="50"/><rect x="160" y="104" width="8" height="50"/><rect x="120" y="112" width="70" height="6"/><rect x="120" y="130" width="70" height="6"/></g><g id="flock"></g></svg>`;
      const inp = h('input', 'inp'); inp.inputMode = 'numeric'; inp.placeholder = 'How many?'; inp.setAttribute('aria-label', 'Number of sheep');
      const replay = h('button', 'sbtn', '↻ Replay'); replay.type = 'button';
      const row = h('div', 'row'); row.append(replay);
      body.append(zone, inp, row);
      const flock = zone.querySelector('#flock');
      let firstTry = true, start = 0, running = false;
      const run = () => { start = performance.now(); running = true; };
      replay.onclick = () => { firstTry = false; levelFails++; run(); };
      run();
      loop((dt, t) => {
        if (!running) return;
        const el = (t - start) / 1000; let html = '';
        for (let k = 0; k < N; k++) {
          const p = (el - k * 1.1) / 1.6; if (p < 0 || p > 1) continue;
          const x = -40 + p * 380, y = 120 - Math.max(0, Math.sin(Math.min(1, Math.max(0, (x - 70) / 160)) * Math.PI)) * 60;
          html += `<g transform="translate(${x} ${y - 20}) scale(1.5)">${A.sheep}</g>`;
        }
        flock.innerHTML = html;
        if (el > N * 1.1 + 1.8) { running = false; flock.innerHTML = ''; }
      });
      onVerify = () => { if (+inp.value === N) { if (firstTry) award('sheep'); pass('Correct. You may now sleep.'); } else { firstTry = false; fail('Wrong number. The sheep are offended.'); inp.value = ''; } };
    } },
    { id: 'sizes', hint: 'Smallest first. Wrong order starts over.', run() {
      header('Click the circles from', 'smallest to biggest', 'Size matters here.');
      verifyBtn.hidden = true;
      const sizes = Curio.shuffle([18, 28, 38, 48, 58]);
      const sorted = sizes.slice().sort((a, b) => a - b);
      const row = h('div', 'row'); row.style.minHeight = '90px'; body.append(row);
      let step = 0;
      sizes.forEach((s) => {
        const b = h('button'); b.type = 'button'; b.style.cssText = `width:${s + 12}px;height:${s + 12}px;border-radius:50%;border:0;cursor:pointer;background:radial-gradient(circle at 35% 30%,#93c5fd,#3b82f6);color:#fff;font:900 14px var(--font)`; b.setAttribute('aria-label', `circle of size ${s}`);
        b.onclick = () => {
          if (b.dataset.done) return;
          if (s === sorted[step]) { b.dataset.done = 1; step++; b.textContent = step; b.style.background = '#22c55e'; Curio.beep(400 + step * 120, .06, 'triangle', .07); if (step === 5) pass('Ordered. Like a tidy human.'); }
          else { fail('That one is not next.'); step = 0; row.querySelectorAll('button').forEach((x) => { delete x.dataset.done; x.textContent = ''; x.style.background = 'radial-gradient(circle at 35% 30%,#93c5fd,#3b82f6)'; }); }
        };
        row.append(b);
      });
    } },
    { id: 'odd', hint: 'One square is a tiny bit lighter. Squint.', run() {
      header('Click the square that is', 'a different colour', 'Only a little different.');
      verifyBtn.hidden = true;
      const hue = Curio.randInt(0, 359), t = Curio.randInt(0, 35);
      grid(6, Array.from({ length: 36 }, () => ''), { onTap: (k) => (k === t ? pass('Eagle eyes. Human eagle eyes.') : fail('Those look the same to us too.')) });
      [...body.querySelector('.grid').children].forEach((b, k) => { b.style.background = `hsl(${hue},60%,${k === t ? 58 : 50}%)`; b.setAttribute('aria-label', 'Colour square'); });
    } },
    { id: 'blind', hint: 'Type the three words exactly, no full stop needed.', run() {
      header('With your eyes closed, type', '"i am human"', 'We cannot check if your eyes are closed. We trust you.');
      const inp = h('input', 'inp'); inp.type = 'password'; inp.autocomplete = 'off'; inp.placeholder = '••••••••'; inp.setAttribute('aria-label', 'Type i am human'); body.append(inp);
      onVerify = () => { const v = inp.value.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim(); v === 'i am human' ? pass('Typed blind. Very trusting of you.') : (fail('That was not it. Open your eyes, maybe.'), inp.value = ''); };
      later(() => inp.focus({ preventScroll: true }), 300);
    } },
    { id: 'spell', hint: 'Click H, U, M, A, N in order. Typing the letters works too.', run() {
      header('Click the letters to spell', 'HUMAN', 'They wander a bit.');
      verifyBtn.hidden = true;
      const zone = h('div', 'letters'); const out = h('div', 'spelled', ''); body.append(out, zone);
      const word = 'HUMAN'; let got = '';
      const ls = Curio.shuffle([...'HUMANROB']).map((ch) => ({ ch, x: Math.random() * 250, y: Math.random() * 160, vx: Curio.rand(-18, 18), vy: Curio.rand(-14, 14) }));
      const tryLetter = (ch, btn) => {
        if (ch === word[got.length]) { got += ch; out.textContent = got; if (btn) btn.classList.add('used'); Curio.beep(500 + got.length * 100, .05, 'triangle', .07); if (got === word) pass('H-U-M-A-N. Spelled like a human.'); }
        else { got = ''; out.textContent = ''; zone.querySelectorAll('button').forEach((b) => b.classList.remove('used')); fail(ch === 'R' || ch === 'O' || ch === 'B' ? 'R-O-B...? We see where this is going.' : 'Wrong letter. Starting over.'); }
      };
      ls.forEach((l) => { const b = h('button', '', l.ch); b.type = 'button'; b.setAttribute('aria-label', 'Letter ' + l.ch); b.onclick = () => { if (!b.classList.contains('used')) tryLetter(l.ch, b); }; l.el = b; zone.append(b); });
      listen(document, 'keydown', (e) => { const k = e.key.toUpperCase(); if (/^[A-Z]$/.test(k) && !e.ctrlKey && !e.metaKey) { const l = ls.find((q) => q.ch === k && !q.el.classList.contains('used')); if (l) tryLetter(k, l.el); } });
      loop((dt) => { const W = zone.clientWidth - 52, H = zone.clientHeight - 52; for (const l of ls) { l.x += l.vx * dt; l.y += l.vy * dt; if (l.x < 0 || l.x > W) { l.vx *= -1; l.x = Math.max(0, Math.min(W, l.x)); } if (l.y < 0 || l.y > H) { l.vy *= -1; l.y = Math.max(0, Math.min(H, l.y)); } l.el.style.left = l.x + 'px'; l.el.style.top = l.y + 'px'; } });
    } },
    { id: 'pet', hint: 'Stroke the head and back, not the belly. Or press the Pet button (or P).', run() {
      header('Pet the cat', 'until it purrs', 'Avoid the belly. It is a trap.');
      verifyBtn.hidden = true;
      const wrap = h('div'); wrap.style.cssText = 'position:relative;touch-action:none';
      wrap.innerHTML = `<svg viewBox="0 0 200 180" style="width:100%;max-width:300px;display:block;margin:0 auto" role="img" aria-label="A cat">${A.cat('calm')}</svg>`;
      const meter = h('div', 'bar100', '<i></i>'); const btn = h('button', 'sbtn', '🖐 Pet (P)'); btn.type = 'button';
      const row = h('div', 'row'); row.append(btn);
      body.append(wrap, meter, row);
      const svgEl = wrap.firstChild; let purr = 0, lastX = null, lastY = null, angry = 0, done = false;
      const paint = (mood) => { svgEl.innerHTML = A.cat(mood); meter.firstChild.style.width = Math.min(100, purr) + '%'; };
      const add = (n) => { if (done) return; purr += n; if (purr >= 100) { done = true; paint('purr'); award('purr'); Curio.beep(90, .6, 'sine', .3); pass('Prrrrrr. The cat has approved you.'); } else paint('calm'); };
      const at = (cx, cy) => { const r = svgEl.getBoundingClientRect(); return { x: (cx - r.left) / r.width * 200, y: (cy - r.top) / r.height * 180 }; };
      listen(wrap, 'pointermove', (e) => {
        if (done || performance.now() < angry) return;
        const p = at(e.clientX, e.clientY);
        if (lastX != null) {
          const d = Math.hypot(p.x - lastX, p.y - lastY);
          const belly = Math.hypot((p.x - 100) / 34, (p.y - 146) / 18) < 1;
          const onCat = Math.hypot((p.x - 100) / 70, (p.y - 132) / 38) < 1 || Math.hypot(p.x - 100, p.y - 76) < 40;
          if (belly) { purr = Math.max(0, purr - 40); angry = performance.now() + 1200; paint('angry'); Curio.beep(200, .2, 'sawtooth', .06); fail('THE BELLY. You were warned.'); }
          else if (onCat) add(d * .35);
        }
        lastX = p.x; lastY = p.y;
      });
      const pet = () => { add(14); Curio.beep(300, .05, 'sine', .05); };
      btn.onclick = pet;
      listen(document, 'keydown', (e) => { if (e.key === 'p' || e.key === 'P') pet(); });
    } },
    { id: 'bus', hint: 'Every square that contains any part of the bus, even a tiny corner.', run() {
      header('Select all squares with', 'a bus', 'Even a little bit of bus counts.');
      const S = 320, cv = h('canvas'); cv.width = S; cv.height = S; cv.style.cssText = 'width:100%;display:block;border-radius:4px';
      const wrap = h('div'); wrap.style.position = 'relative'; wrap.append(cv); body.append(wrap);
      const g = cv.getContext('2d');
      const bx = Curio.randInt(10, 120), by = Curio.randInt(60, 170), bw = Curio.randInt(150, 190), bh = Curio.randInt(80, 105);
      const busPath = (c) => { c.fillStyle = '#facc15'; c.beginPath(); c.roundRect(bx, by, bw, bh, 14); c.fill(); c.fillStyle = '#bfdbfe'; for (let k = 0; k < 4; k++) c.fillRect(bx + 12 + k * (bw - 24) / 4, by + 12, (bw - 24) / 4 - 8, bh * .32); c.fillStyle = '#111'; c.beginPath(); c.arc(bx + 34, by + bh, 14, 0, Math.PI * 2); c.arc(bx + bw - 34, by + bh, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ef4444'; c.fillRect(bx, by + bh * .6, bw, 6); };
      g.fillStyle = '#bae6fd'; g.fillRect(0, 0, S, S); g.fillStyle = '#9ca3af'; g.fillRect(0, S * .72, S, S * .28); g.fillStyle = '#d1d5db'; for (let x = 10; x < S; x += 50) g.fillRect(x, S * .85, 26, 5);
      g.fillStyle = '#86efac'; g.beginPath(); g.arc(270, 80, 30, 0, Math.PI * 2); g.fill(); g.fillStyle = '#92400e'; g.fillRect(265, 100, 10, 40);
      busPath(g);
      const off = document.createElement('canvas'); off.width = S; off.height = S; const og = off.getContext('2d'); busPath(og);
      const data = og.getImageData(0, 0, S, S).data;
      const want = [];
      for (let k = 0; k < 16; k++) { const tx = (k % 4) * 80, ty = Math.floor(k / 4) * 80; let n = 0; for (let y = ty; y < ty + 80; y += 2) for (let x = tx; x < tx + 80; x += 2) if (data[(y * S + x) * 4 + 3] > 0) n++; if (n > 12) want.push(k); }
      const gr = h('div', 'grid'); gr.style.cssText = 'position:absolute;inset:0;grid-template-columns:repeat(4,1fr);gap:2px';
      for (let k = 0; k < 16; k++) { const b = h('button', 'tile'); b.type = 'button'; b.style.background = 'transparent'; b.style.outline = '1px solid rgba(255,255,255,.7)'; b.setAttribute('aria-label', `Square ${k + 1}`); b.onclick = () => { b.classList.toggle('sel'); Curio.beep(600, .03, 'sine', .05); }; gr.append(b); }
      wrap.append(gr);
      onVerify = () => (same(selected(gr), want) ? pass('Bus located. Public transport thanks you.') : fail(selected(gr).length < want.length ? 'Some bus escaped your selection.' : 'That square has no bus in it.'));
    } },
    { id: 'rain', hint: 'Rain, drizzle and storms all count. Snow does not.', run() {
      const wet = ['rain', 'drizzle', 'storm'], dry = ['sun', 'cloud', 'snow', 'wind', 'rainbow', 'moon'];
      const n = Curio.randInt(2, 4);
      const tiles = Curio.shuffle([...Array.from({ length: n }, () => Curio.pick(wet)), ...Array.from({ length: 9 - n }, () => Curio.pick(dry))]);
      header('Select all squares where', "it's raining", 'Bring an umbrella.');
      const g = grid(3, tiles.map((t) => A.svg(A.I[t])), { labels: tiles });
      onVerify = () => { const want = tiles.map((t, k) => (wet.includes(t) ? k : -1)).filter((k) => k >= 0); same(selected(g), want) ? pass('Forecast: human, with a chance of verified.') : fail('Meteorologically incorrect.'); };
    } },
    { id: 'hundred', hint: 'It reaches 100% only for a moment. Enter works.', run() {
      header('Click Verify when loading is at', 'exactly 100%', 'Not 99%. It does get there. Eventually.');
      const bar = h('div', 'bar100', '<i></i>'); const out = h('div', 'count-big', '0%'); body.append(out, bar);
      let v = 0, phase = 0, hold = 0;
      loop((dt) => {
        if (phase === 0) { v += dt * 45; if (v >= 99) { v = 99; phase = 1; hold = 1.6 + Math.random(); } }
        else if (phase === 1) { hold -= dt; if (hold <= 0) { v = 100; phase = 2; hold = 1.3; Curio.beep(1000, .05, 'triangle', .05); } }
        else if (phase === 2) { hold -= dt; if (hold <= 0) { v = Curio.randInt(62, 96); phase = 0; } }
        bar.firstChild.style.width = v + '%'; out.textContent = Math.floor(v) + '%';
      });
      onVerify = () => (v === 100 ? pass('Perfect timing. Your patience is noted.') : fail(`${Math.floor(v)}% is not 100%. Loading is a journey.`));
    } },
    { id: 'dream', hint: 'Five words or more. Anything at all.', run() {
      header('To prove you dream, describe', 'your last dream', 'Robots dream of electric sheep. Be specific.');
      const ta = h('textarea', 'inp'); ta.rows = 3; ta.placeholder = 'I was in a giant teapot...'; ta.setAttribute('aria-label', 'Your dream'); body.append(ta);
      onVerify = () => { const w = ta.value.trim().split(/\s+/).filter(Boolean); if (/electric sheep/i.test(ta.value)) return fail('Electric sheep? Nice try, unit.'); w.length >= 5 ? pass(Curio.pick(['How weird. How human.', 'We have filed this under "concerning".', 'Fascinating. Also, why the teapot?'])) : fail('Dreams are longer than that. Five words at least.'); };
      later(() => ta.focus({ preventScroll: true }), 300);
    } },
    { id: 'memory', hint: 'Watch the four symbols, then click them in the same order.', run() {
      header('Remember the sequence', 'then repeat it', 'Humans have notoriously bad memory. Prove it is okay.');
      verifyBtn.hidden = true;
      const syms = ['star', 'heart', 'moon', 'bolt', 'drop', 'leaf'];
      const seq = Array.from({ length: 4 }, () => Curio.pick(syms));
      const show = h('div', 'seq'); const pad = h('div', 'row'); body.append(show, pad);
      let input = [], ready = false;
      const play = () => {
        ready = false; input = []; show.innerHTML = '';
        seq.forEach((s, k) => later(() => { show.innerHTML = `<span>${A.svg(A.I[s])}</span>`; Curio.beep(400 + syms.indexOf(s) * 90, .2, 'sine', .07); }, 300 + k * 800));
        later(() => { show.innerHTML = '<span></span><span></span><span></span><span></span>'; ready = true; }, 300 + seq.length * 800);
      };
      syms.forEach((s) => { const b = h('button', 'sbtn', A.svg(A.I[s])); b.type = 'button'; b.style.cssText = 'width:52px;height:52px;padding:6px'; b.setAttribute('aria-label', s); b.onclick = () => {
        if (!ready) return;
        input.push(s); show.children[input.length - 1].innerHTML = A.svg(A.I[s]); Curio.beep(400 + syms.indexOf(s) * 90, .1, 'sine', .07);
        if (s !== seq[input.length - 1]) { fail('That is not what we showed you.'); later(play, 900); }
        else if (input.length === seq.length) pass('Memory verified. Barely.');
      }; pad.append(b); });
      play();
    } },
    { id: 'hop', hint: 'Click the square where the cat is right now. Three times.', run() {
      header('Click the square with', 'the cat', 'He moves around. Cats do that.');
      verifyBtn.hidden = true;
      let at = Curio.randInt(0, 8), hits = 0;
      const out = h('div', 'count-big', '0 / 3');
      const catMini = '<circle cx="20" cy="22" r="11" fill="#f59e0b"/><path d="M10 16 l1 -10 l7 6Z M30 16 l-1 -10 l-7 6Z" fill="#f59e0b"/><circle cx="16" cy="21" r="1.8" fill="#111"/><circle cx="24" cy="21" r="1.8" fill="#111"/><path d="M18 26 h4 l-2 2Z" fill="#db2777"/>';
      const g = grid(3, Array.from({ length: 9 }, () => ''), { onTap: (k, b) => { if (k === at) { hits++; out.textContent = `${hits} / 3`; b.classList.add('flash'); Curio.beep(700 + hits * 100, .06, 'triangle', .08); if (hits >= 3) pass('Cat caught three times. It is unimpressed.'); else move(); } else { hits = 0; out.textContent = '0 / 3'; fail('The cat was not there. It never is.'); } } });
      body.append(out);
      const move = () => { const tiles = [...g.children]; tiles.forEach((t) => { t.innerHTML = ''; t.setAttribute('aria-label', 'Empty square'); }); let n; do { n = Curio.randInt(0, 8); } while (n === at); at = n; tiles[at].innerHTML = A.svg(catMini); tiles[at].setAttribute('aria-label', 'Square with the cat'); };
      at = -1; move(); every(move, 1500);
    } },
    { id: 'resist', hint: 'Do. Not. Click. Just wait.', run() {
      header('Do not click', 'the button', 'For 6 seconds. Robots cannot resist buttons.');
      verifyBtn.hidden = true;
      const b = h('button', 'hold', 'CLICK ME'); b.type = 'button'; b.style.fontSize = '26px';
      const out = h('div', 'count-big', '6'); body.append(b, out);
      let left = 6;
      const reset = () => { left = 6; out.textContent = left; };
      b.onclick = () => { fail(Curio.pick(['You clicked it. Of course you did.', 'Robot reflex detected.', 'It said CLICK ME and you obeyed. Hmm.'])); reset(); };
      every(() => { left--; out.textContent = Math.max(0, left); b.textContent = ['CLICK ME', 'PLEASE', 'GO ON', 'JUST ONCE', 'PRETTY PLEASE', "IT'S FREE"][6 - Math.max(1, left)] || 'CLICK ME'; if (left <= 0) { b.onclick = null; award('patience'); pass('Willpower confirmed. Very human.'); } }, 1000);
    } },
    { id: 'disguised', hint: 'Look at the necks.', run() {
      header('One of these humans is', 'a robot in disguise', 'Find it.');
      verifyBtn.hidden = true;
      const t = Curio.randInt(0, 5);
      grid(3, Array.from({ length: 6 }, (_, k) => A.svg(A.person(k * 5 + 2, k === t ? A.bolt : ''))), { labels: Array.from({ length: 6 }, () => 'a person'), onTap: (k) => (k === t ? pass('Unmasked! It was using a very convincing wig.') : fail('That is a perfectly normal human. Rude.')) });
    } },
    { id: 'stars', hint: 'Only 5 stars will do. Keep insisting.', run() {
      header('Please rate this captcha', '5 stars', 'Your feedback is very important to us.');
      verifyBtn.hidden = true;
      const row = h('div', 'stars'); const note = h('div', 'count-big', ''); note.style.fontSize = '16px'; body.append(row, note);
      let tries = 0;
      for (let k = 1; k <= 5; k++) {
        const b = h('button', 'off', '★'); b.type = 'button'; b.setAttribute('aria-label', `${k} stars`);
        b.onclick = () => {
          row.querySelectorAll('button').forEach((x, i) => x.classList.toggle('off', i >= k));
          if (k < 5) return fail(`${k} star${k === 1 ? '' : 's'}? We only accept 5 stars.`);
          tries++;
          if (tries < 3) { note.textContent = ['Are you sure?', 'Really sure? It was quite hard.'][tries - 1]; Curio.beep(500, .05, 'triangle', .05); later(() => row.querySelectorAll('button').forEach((x, i) => x.classList.toggle('off', i >= 4)), 400); }
          else pass('Thank you for your 5-star review!');
        };
        row.append(b);
      }
    } },
    { id: 'wrong', hint: 'Robots are always right. Humans are not.', run() {
      header('What is', '2 + 2?', 'Take your time. Humans often do.');
      const inp = h('input', 'inp'); inp.inputMode = 'numeric'; inp.placeholder = 'Answer'; inp.setAttribute('aria-label', 'Answer'); body.append(inp);
      onVerify = () => { const v = inp.value.trim(); if (!v) return fail('No answer is not an answer.'); if (/^(4|four|4\.0+)$/i.test(v)) { inp.value = ''; return fail('Too accurate. Robots love accuracy.'); } pass(`${esc(v).slice(0, 12)}? Wrong. Wonderfully, humanly wrong.`); };
      later(() => inp.focus({ preventScroll: true }), 300);
    } },
    { id: 'final', hint: 'Uncheck the box.', run() {
      head.hidden = true; verifyBtn.hidden = true;
      const row = checkboxRow("I'm a robot"); body.append(row);
      const cb = row.querySelector('.cb'); cb.classList.add('ok'); cb.setAttribute('aria-label', "I'm a robot (checked)");
      const note = h('p', '', 'Our records indicate this box is already checked. Is that correct?'); note.style.cssText = 'margin:4px 12px 10px;font-size:14px;color:#888'; body.append(note);
      cb.onclick = () => { if (cb.classList.contains('spin')) return; cb.classList.remove('ok'); cb.classList.add('spin'); later(() => { cb.classList.remove('spin'); pass('Box unchecked. Robot status: revoked.'); }, 900); };
    } }
  ];

  const dots = $('#dots');
  function loadLevel() {
    cleanup.forEach((f) => f()); cleanup = [];
    passing = false; levelFails = 0; levelStart = performance.now();
    body.innerHTML = ''; msg.textContent = ''; msg.className = 'msg'; head.hidden = false; verifyBtn.hidden = false; onVerify = null;
    cap.classList.remove('passed', 'enter'); void cap.offsetWidth; cap.classList.add('enter');
    const lv = order[idx];
    $('#lvl').textContent = mode === 'practice' ? `Practice · level ${lv + 1}` : `Level ${idx + 1} of ${order.length}${mode === 'daily' ? ' · daily' : mode === 'speed' ? ' · speedrun' : ''}`;
    dots.innerHTML = order.map((_, k) => `<i class="${k < idx ? 'done' : k === idx ? 'cur' : ''}"></i>`).join('');
    LEVELS[lv].run();
    if (idx === 0 && mode !== 'practice') say('Hello. I am Unit 7. I will be watching you.');
    else if (lv === LEVELS.length - 1) say('Final check. Do not disappoint me.');
    else if (!passing) say(Curio.pick(['Next test. Proceed.', 'Let us see you handle this.', 'This one is my favourite.', 'Robots usually fail here.', 'I designed this one myself.', 'Hmm. Begin.']));
    if (mode === 'story') saveStory();
    Curio.beep(520, .05, 'sine', .05);
  }
  verifyBtn.addEventListener('click', () => { if (onVerify) onVerify(); });
  document.addEventListener('keydown', (e) => {
    if ($('#play').hidden) return;
    if (e.key === 'Enter' && onVerify && !e.target.closest('textarea')) { e.preventDefault(); onVerify(); }
    else if ((e.key === 'h' || e.key === 'H') && !e.target.closest('input,textarea') && LEVELS[order[idx]].id !== 'spell') showHint();
  });
  function showHint() { const lv = LEVELS[order[idx]]; msg.className = 'msg ok'; msg.textContent = '💡 ' + lv.hint; hum = Math.max(0, hum - 3); paintMeter(); say('Needing hints. Noted.', 'sus'); }
  $('#hintBtn').addEventListener('click', showHint);
  $('#quitBtn').addEventListener('click', () => { if (mode === 'story') saveStory(); cleanup.forEach((f) => f()); cleanup = []; renderMenu(); });

  function elapsed() { return elapsedBase + (performance.now() - t0); }
  let lastTick = performance.now();
  setInterval(() => {
    const now = performance.now();
    if (document.hidden || $('#play').hidden) { t0 += now - lastTick; }
    lastTick = now;
    if (!$('#play').hidden) $('#time').textContent = fmtT(elapsed());
  }, 250);

  function saveStory() { save.story = { idx, fails, hum, ms: elapsed() }; persist(); }
  function start(m, opts = {}) {
    mode = m; idx = 0; fails = 0; hum = 100; splits = []; elapsedBase = 0; t0 = performance.now();
    if (m === 'daily') { const rnd = seeded(hashStr('robot' + todayKey())); const pool = LEVELS.map((_, i) => i).slice(1, -1); for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; } order = [...pool.slice(0, 8), LEVELS.length - 1]; }
    else if (m === 'practice') order = [opts.level];
    else order = LEVELS.map((_, i) => i);
    if (m === 'story' && opts.resume && save.story) { idx = Math.min(save.story.idx, order.length - 1); fails = save.story.fails || 0; hum = save.story.hum ?? 100; elapsedBase = save.story.ms || 0; }
    $('#menu').hidden = true; $('#end').hidden = true; $('#play').hidden = false;
    paintMeter(); loadLevel();
    $('#play').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function finish() {
    cleanup.forEach((f) => f()); cleanup = [];
    const ms = elapsed();
    if (mode === 'practice') { renderMenu(true); Curio.toast('Level cleared!'); return; }
    if (mode === 'story') { save.story = null; award('human'); if (fails <= 3) award('flawless'); const b = save.best.story; if (b == null || fails < b) save.best.story = fails; }
    if (mode === 'speed') { const b = save.best.speed; if (b == null || ms < b) save.best.speed = Math.round(ms); if (ms < 600000) award('speed'); }
    if (mode === 'daily') { if (save.daily[todayKey()] == null) save.daily[todayKey()] = fails; award('daily'); }
    persist();
    const conf = Math.max(1, Math.min(100, hum));
    const title = conf >= 90 ? 'Certified human' : conf >= 70 ? 'Probably human' : conf >= 40 ? 'Human-ish' : 'We have concerns';
    $('#play').hidden = true;
    const e = $('#end'); e.hidden = false;
    e.innerHTML = `<div class="r-cert"><svg viewBox="0 0 40 40" aria-hidden="true">${A.person(4)}<path d="M8 6 l4 -5 l4 5 l4 -5 l4 5 l4 -5 l4 5 v3 h-24Z" fill="#facc15" transform="translate(0 -2) scale(1 .9)"/></svg></div>
      <div class="c-muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:12px">${mode === 'speed' ? 'Speedrun complete' : mode === 'daily' ? `Daily gauntlet · ${todayKey()}` : 'Verification complete'}</div>
      <h2>You are human.</h2><p class="c-sub" style="margin:0 0 6px">${title}. Probably.</p>
      <p class="c-muted">Humanity confidence: ${conf}%. ${fails ? `You failed ${fails} time${fails === 1 ? '' : 's'}, which is honestly the most human thing about you.` : 'Zero mistakes. Which is, frankly, a little suspicious.'}</p>
      <div class="c-row" style="margin:14px 0"><div class="c-stat"><b>${fails}</b><span>Fails</span></div><div class="c-stat"><b>${fmtT(ms)}</b><span>Time</span></div><div class="c-stat"><b>${conf}%</b><span>Humanity</span></div></div>
      ${mode === 'speed' ? `<div class="r-splits">${splits.map((s, k) => `<div>${k + 1}. ${s.id} · ${(s.ms / 1000).toFixed(1)}s${s.f ? ` · ${s.f}✕` : ''}</div>`).join('')}</div>` : ''}
      <div class="c-row"><button class="c-btn" id="again" type="button">Verify again</button><button class="c-btn c-btn--ghost" id="shareBtn" type="button">📋 Share</button><button class="c-btn c-btn--ghost" id="toMenu" type="button">Menu</button></div>`;
    Curio.confetti(); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, .18, 'triangle', .1), i * 110));
    const m = mode;
    $('#again').onclick = () => start(m); $('#toMenu').onclick = () => renderMenu();
    $('#shareBtn').onclick = () => { const t = `I'm Not a Robot (Zoble) · ${m === 'speed' ? 'Speedrun' : m === 'daily' ? 'Daily ' + todayKey() : 'Story'}\n${title}: ${conf}% human · ${fails} fails · ${fmtT(ms)}`; navigator.clipboard?.writeText(t).then(() => Curio.toast('Copied! Paste it anywhere.'), () => Curio.modal({ emoji: '📋', title: 'Your result', body: t, buttons: [{ label: 'OK', value: 1 }] })); };
    e.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const MODES = [
    { id: 'story', icon: '🛡️', name: 'Story', desc: 'All 35 checks, from easy to absurd. Progress is saved.', a: '#bfdbfe', b: '#3b82f6' },
    { id: 'daily', icon: '📅', name: 'Daily gauntlet', desc: "Today's 9 checks, the same for everyone.", a: '#fbcfe8', b: '#db2777' },
    { id: 'speed', icon: '⏱️', name: 'Speedrun', desc: 'All 35 in one go, with splits. Hints cost humanity, not time.', a: '#fde68a', b: '#d97706' },
    { id: 'practice', icon: '🎯', name: 'Practice', desc: 'Replay any level you have reached.', a: '#bbf7d0', b: '#16a34a' }
  ];
  function renderMenu(practiceOpen) {
    cleanup.forEach((f) => f()); cleanup = [];
    $('#play').hidden = true; $('#end').hidden = true;
    const m = $('#menu'); m.hidden = false;
    const hero = `<div class="r-hero"><svg viewBox="0 0 230 140" aria-hidden="true"><rect x="4" y="34" width="156" height="66" rx="6" fill="var(--surface)" stroke="var(--line)" stroke-width="2"/><rect x="16" y="52" width="28" height="28" rx="4" fill="#fff" stroke="#c1c1c1" stroke-width="2"/><path d="M21 66 l7 7 l13 -17" stroke="#1f9d55" stroke-width="5" fill="none"/><text x="52" y="71" font-size="13" font-weight="800" fill="var(--ink)">I'm not a robot</text><g transform="translate(166 36) scale(.8)">${A.inspector().replace('<svg viewBox="0 0 80 80">', '').replace('</svg>', '')}</g></svg></div>`;
    const resume = save.story ? `<button class="r-mode" type="button" id="resume" style="grid-column:1/-1;--a:#fde68a;--b:#f59e0b"><span class="ic">▶️</span><span><b>Continue the story</b><small>Level ${save.story.idx + 1} of ${LEVELS.length} · ${save.story.fails} fails so far</small></span></button>` : '';
    const total = save.badges.length;
    m.innerHTML = `${hero}<h2>Choose your verification</h2><div class="r-modes">${resume}${MODES.map((md) => `<button class="r-mode" type="button" data-m="${md.id}" style="--a:${md.a};--b:${md.b}"><span class="ic" aria-hidden="true">${md.icon}</span><span><b>${md.name}</b><small>${md.desc}</small>${md.id === 'story' && save.best.story != null ? `<span class="done">Best: ${save.best.story} fails</span>` : md.id === 'speed' && save.best.speed ? `<span class="done">Best: ${fmtT(save.best.speed)}</span>` : md.id === 'daily' && save.daily[todayKey()] != null ? '<span class="done">Done today ✓</span>' : ''}</span></button>`).join('')}</div>
      <div class="r-stats"><div class="c-stat"><b>${Math.min(save.maxLevel, LEVELS.length)}/${LEVELS.length}</b><span>Reached</span></div><div class="c-stat"><b>${save.totalFails}</b><span>Total fails</span></div><div class="c-stat"><b>${save.best.speed ? fmtT(save.best.speed) : '-'}</b><span>Best speedrun</span></div><div class="c-stat"><b>${total}/${BADGES.length}</b><span>Badges</span></div></div>
      <div class="c-row"><button class="c-btn c-btn--ghost" type="button" id="badgeBtn">🏅 Badges</button></div><div id="menuExtra"></div>`;
    m.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.m;
      if (id === 'practice') return showLevels();
      if (id === 'story' && save.story) { save.story = null; persist(); }
      start(id);
    }));
    m.querySelector('#resume')?.addEventListener('click', () => start('story', { resume: true }));
    $('#badgeBtn').addEventListener('click', () => { const got = new Set(save.badges); $('#menuExtra').innerHTML = `<div class="r-badges">${BADGES.map(([id, ic, n, d]) => `<div class="r-badge${got.has(id) ? ' got' : ''}"><i>${ic}</i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>`; });
    if (practiceOpen) showLevels();
  }
  function showLevels() {
    const max = Math.max(1, Math.min(save.maxLevel + 1, LEVELS.length));
    $('#menuExtra').innerHTML = `<h3 style="margin:16px 0 4px">Practice a level</h3><p class="c-muted" style="margin:0">Reach more levels in Story or Speedrun to unlock them.</p><div class="r-levels">${LEVELS.map((l, i) => `<button type="button" data-l="${i}" ${i >= max ? 'disabled' : ''} class="${save.done[l.id] ? 'cleared' : ''}"><b>${i + 1}</b>${i >= max ? '🔒' : l.id}</button>`).join('')}</div>`;
    $('#menuExtra').querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => start('practice', { level: +b.dataset.l })));
    $('#menuExtra').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  const q = new URLSearchParams(location.search);
  if (q.has('level')) { const l = Math.max(0, Math.min(LEVELS.length - 1, +q.get('level') - 1)); start('practice', { level: l }); }
  else renderMenu();
  if (!Curio.store.get('robot:tip', false) && !Curio.touchpad) { Curio.store.set('robot:tip', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar for the drag and draw levels', 4200), 1500); }
  window.__robot = { LEVELS, start, pass, get idx() { return idx; }, get order() { return order; } };
})();
