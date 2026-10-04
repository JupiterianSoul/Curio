(() => {
  const $ = (id) => document.getElementById(id);
  const ADV = Curio.advanced;
  const DAY = 86400000;
  const STOPS = PP_STOPS.filter((s) => ADV || s.simple);
  const KEY = `planet-passport:${Curio.mode}`;
  const prof = Object.assign({ who: '', born: '', kg: 70, unit: 'kg' }, Curio.store.get('planet-passport:profile', {}));
  let stamps = Curio.store.get(KEY + ':stamps', {});
  if (typeof stamps !== 'object' || !stamps) stamps = {};
  let idx = 0, visited = new Set(), score = 0, guessed = {}, travelling = false;
  const fmt = (n, d = 0) => Curio.fmt(n, d);
  const smart = (n) => (n >= 100 ? fmt(n) : n >= 10 ? fmt(n, 1) : n >= 1 ? fmt(n, 2) : fmt(n, 3));

  const born = () => new Date(prof.born + 'T12:00:00');
  const ageDays = () => Math.max(1, (Date.now() - born().getTime()) / DAY);
  const unitW = (kg) => (prof.unit === 'lb' ? kg * 2.20462 : kg);
  const wTxt = (kg) => { const v = unitW(kg); return `${v >= 1000 ? fmt(v) : v >= 10 ? fmt(v, 1) : fmt(v, 2)} ${prof.unit}`; };
  const jumpM = (s) => 0.5 * 9.807 / s.g;
  const hang = (s) => 2 * Math.sqrt(2 * jumpM(s) / s.g);
  const dist = (m) => (m >= 1000 ? `${fmt(m / 1000, m >= 10000 ? 0 : 1)} km` : m >= 10 ? `${fmt(m)} m` : `${fmt(m, 2)} m`);
  const dur = (sec) => (sec < 60 ? `${fmt(sec, 1)} s` : sec < 3600 ? `${fmt(sec / 60, 1)} min` : `${fmt(sec / 3600, 1)} h`);

  const board = $('board'), voyage = $('voyage'), end = $('end');
  const unitBtns = document.querySelectorAll('[data-u]');
  function paintUnit() { unitBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.u === prof.unit))); }
  $('who').value = prof.who; $('born').value = prof.born; $('kg').value = prof.kg ? +unitW(prof.kg).toFixed(1) : '';
  $('born').max = new Date().toISOString().slice(0, 10); $('born').min = '1900-01-01';
  if (!ADV) document.querySelector('.pp-f--name').remove();
  $('destTxt').textContent = STOPS[STOPS.length - 1].name.toUpperCase();
  $('seat').textContent = `${1 + (prof.who.length * 7) % 30}${'ABCDEF'[prof.who.length % 6]}`;
  paintUnit();
  unitBtns.forEach((b) => b.addEventListener('click', () => {
    const v = parseFloat($('kg').value);
    const kg = Number.isFinite(v) ? (prof.unit === 'lb' ? v / 2.20462 : v) : prof.kg;
    prof.unit = b.dataset.u; paintUnit();
    $('kg').value = +unitW(kg).toFixed(1);
    Curio.sfx && Curio.sfx('tap');
  }));
  $('ticket').addEventListener('submit', (e) => {
    e.preventDefault();
    const b = $('born').value;
    const d = new Date(b + 'T12:00:00');
    if (!b || isNaN(d) || d > new Date() || d.getFullYear() < 1900) { Curio.toast('Pop in a real birthday, please'); $('born').focus(); return; }
    const v = parseFloat($('kg').value);
    prof.kg = Number.isFinite(v) && v > 0 ? Math.min(500, prof.unit === 'lb' ? v / 2.20462 : v) : 70;
    prof.born = b; prof.who = ADV ? $('who').value.trim().slice(0, 18) : prof.who;
    Curio.store.set('planet-passport:profile', prof);
    startVoyage();
  });

  const route = $('route');
  STOPS.forEach((s, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pp-dot'; b.dataset.i = i;
    b.style.setProperty('--c', s.stamp); b.title = s.name; b.setAttribute('aria-label', s.name);
    b.innerHTML = `<i></i><span>${s.name.replace('The ', '')}</span>`;
    b.addEventListener('click', () => { if (visited.has(i) || i === idx + 1) go(i); else Curio.toast('Fly there in order first'); });
    route.append(b);
  });
  function paintRoute() {
    [...route.children].forEach((b, i) => { b.classList.toggle('is-here', i === idx); b.classList.toggle('is-seen', visited.has(i)); });
    const here = route.children[idx]; if (here) { const r = route.getBoundingClientRect(), hr = here.getBoundingClientRect(); route.scrollBy({ left: hr.left - r.left - r.width / 2 + hr.width / 2, behavior: 'smooth' }); }
  }

  const cv = $('scene'), g = cv.getContext('2d');
  let CW = 800, CH = 340, dpr = 1;
  function size() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1);
    CW = Math.max(300, r.width); CH = Math.max(220, r.height);
    cv.width = CW * dpr; cv.height = CH * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener('resize', () => { size(); });
  const stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random() * .75, r: Math.random() * 1.4 + .3, t: Math.random() * 6 }));
  const globes = {};
  const globe = (key, px) => { const id = key + px; return globes[id] || (globes[id] = PlanetArt.Globe(key, px)); };
  const parentKey = { Earth: 'earth', Mars: 'mars', Jupiter: 'jupiter', Saturn: 'saturn', Neptune: 'neptune', Pluto: 'pluto' };

  let jumpT = -1, jumpDur = 1, jumpPx = 0, warpT = -1, rot = 0, lastT = 0, warpFrom = null;
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
  const dark = (s) => { const c = hex(s.sky[0]); return c[0] + c[1] + c[2] < 150; };
  function drawAstro(x, y, s, t, air) {
    g.save(); g.translate(x, y); g.scale(s, s);
    const sw = air ? Math.sin(t * 6) * .25 : Math.sin(t * 2) * .05;
    g.lineCap = 'round';
    g.strokeStyle = '#d8dde6'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(-6, -22); g.lineTo(-9 - (air ? 6 : 0), 0); g.moveTo(6, -22); g.lineTo(9 + (air ? 6 : 0), 0); g.stroke();
    g.fillStyle = '#5b6474'; g.fillRect(-14, -1, 12, 5); g.fillRect(3, -1, 12, 5);
    g.fillStyle = '#c3cad6'; g.beginPath(); g.roundRect(-21, -54, 10, 26, 3); g.fill();
    g.fillStyle = '#eef1f6'; g.beginPath(); g.roundRect(-14, -56, 28, 38, 9); g.fill();
    g.fillStyle = '#ff7a45'; g.fillRect(-14, -36, 28, 4);
    g.strokeStyle = '#eef1f6'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(-12, -48); g.lineTo(-20, -30 - (air ? 18 : 0) + sw * 20); g.moveTo(12, -48); g.lineTo(20, -30 - (air ? 18 : 0) - sw * 20); g.stroke();
    g.fillStyle = '#eef1f6'; g.beginPath(); g.arc(0, -66, 15, 0, Math.PI * 2); g.fill();
    const vg = g.createLinearGradient(-9, -74, 9, -58); vg.addColorStop(0, '#ffcf6b'); vg.addColorStop(1, '#c46b1e');
    g.fillStyle = vg; g.beginPath(); g.ellipse(2, -66, 10, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-1, -69, 3, 2, -.5, 0, Math.PI * 2); g.fill();
    g.restore();
  }
  function draw(t) {
    const s = STOPS[idx];
    const sky = g.createLinearGradient(0, 0, 0, CH); sky.addColorStop(0, s.sky[0]); sky.addColorStop(1, s.sky[1]);
    g.fillStyle = sky; g.fillRect(0, 0, CW, CH);
    if (dark(s)) for (const st of stars) { g.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * .8 + st.t)); g.fillStyle = '#fff'; g.fillRect(st.x * CW, st.y * CH, st.r, st.r); }
    g.globalAlpha = 1;
    const sunR = Math.max(1.6, 26 / s.au), sx = CW * .14, sy = CH * .2;
    const sg = g.createRadialGradient(sx, sy, 0, sx, sy, sunR * 4);
    sg.addColorStop(0, 'rgba(255,240,190,.95)'); sg.addColorStop(.25, 'rgba(255,220,140,.5)'); sg.addColorStop(1, 'rgba(255,220,140,0)');
    g.fillStyle = sg; g.beginPath(); g.arc(sx, sy, sunR * 4, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(sx, sy, sunR, 0, Math.PI * 2); g.fill();
    if (s.parent && parentKey[s.parent]) {
      const pr = Math.min(CH * .32, CW * .16), gl = globe(parentKey[s.parent], 220);
      gl.draw(g, CW * .42, CH * .26, pr, rot * .3, { glow: true });
    }
    const gy = CH * .78;
    const ground = g.createLinearGradient(0, gy - 20, 0, CH); ground.addColorStop(0, s.ground[1]); ground.addColorStop(1, s.ground[0]);
    g.fillStyle = ground;
    g.beginPath(); g.moveTo(0, gy + 6);
    for (let x = 0; x <= CW; x += 20) g.lineTo(x, gy + Math.sin(x * .012 + idx) * 6 + (s.gas ? Math.sin(x * .05 + t * 1.5) * 3 : 0));
    g.lineTo(CW, CH); g.lineTo(0, CH); g.closePath(); g.fill();
    if (s.gas) { g.fillStyle = 'rgba(255,255,255,.18)'; for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse((k * 211 + t * 30) % (CW + 200) - 100, gy + 12 + k * 9, 90, 7, 0, 0, Math.PI * 2); g.fill(); } }
    else { g.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 9; k++) { const x = (k * 137 + idx * 53) % CW, y = gy + 18 + (k * 29) % (CH - gy - 20); g.beginPath(); g.ellipse(x, y, 14 + k % 3 * 6, 4 + k % 2 * 2, 0, 0, Math.PI * 2); g.fill(); } }
    const ax = CW * (CW < 500 ? .3 : .24);
    let lift = 0, air = false;
    if (jumpT >= 0) {
      const k = (t - jumpT) / jumpDur;
      if (k >= 1) jumpT = -1;
      else { lift = 4 * k * (1 - k) * jumpPx; air = true; }
    }
    const top = gy + 4 - lift;
    if (air) {
      g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(ax, gy + 6, 18 * Math.max(.3, 1 - lift / 300), 4, 0, 0, Math.PI * 2); g.fill();
      if (top < -10) {
        g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '800 13px system-ui, sans-serif'; g.textAlign = 'center';
        g.fillText('still going up...', ax, 26); g.beginPath(); g.moveTo(ax - 8, 40); g.lineTo(ax, 32); g.lineTo(ax + 8, 40); g.fill();
      }
    }
    if (top > -100) drawAstro(ax, top, CH < 280 ? .8 : 1, t, air);
    const ps = Math.min(CH * .42, CW * .26), gl = globe(s.key, Math.round(ps * dpr * 1.3) > 260 ? 260 : 180);
    const px = CW - ps * .62 - 12, py = CH * .38;
    g.save();
    g.fillStyle = 'rgba(8,10,28,.55)'; g.beginPath(); g.arc(px, py, ps * .62, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.stroke();
    g.beginPath(); g.arc(px, py, ps * .62 - 2, 0, Math.PI * 2); g.clip();
    const rr = gl.hasRing ? ps * .26 : ps * .44;
    gl.draw(g, px, py, rr, rot, { glow: true });
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '800 10px ui-monospace, monospace'; g.textAlign = 'center';
    g.fillText('YOU ARE HERE', px, py + ps * .62 + 14);
    if (warpT >= 0) {
      const k = (t - warpT) / 1.15;
      if (k >= 1) { warpT = -1; arrive(); }
      else {
        g.fillStyle = `rgba(6,8,24,${Math.sin(k * Math.PI) * .95})`; g.fillRect(0, 0, CW, CH);
        g.strokeStyle = 'rgba(200,220,255,.8)'; g.lineWidth = 2;
        const cx = CW / 2, cy = CH / 2, sp = Math.sin(k * Math.PI);
        for (let i = 0; i < 70; i++) {
          const a = i * 2.39996, d0 = ((i * 37) % 100) / 100 * CW * .6 * (k + .2), l = 20 + sp * 120;
          g.globalAlpha = sp; g.beginPath(); g.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0); g.lineTo(cx + Math.cos(a) * (d0 + l), cy + Math.sin(a) * (d0 + l)); g.stroke();
        }
        g.globalAlpha = 1;
      }
    }
  }
  function loop(ts) {
    const t = ts / 1000, dt = Math.min(.05, t - lastT || 0); lastT = t;
    if (!document.hidden && !voyage.hidden) { rot += dt * .25; draw(t); }
    requestAnimationFrame(loop);
  }

  function setText(id, v) { $(id).textContent = v; }
  function paintStop() {
    const s = STOPS[idx], days = ageDays();
    $('where').textContent = s.name; $('kind').textContent = s.kind;
    const age = days / s.year;
    setText('age', age >= 100 ? fmt(age) : age >= 10 ? fmt(age, 1) : fmt(age, 2));
    const unit = s.parent ? `${s.parent} years` : s.key === 'earth' ? 'Earth years' : `${s.name.replace('The ', '')} years`;
    const nextDays = (Math.floor(age) + 1) * s.year;
    const nb = new Date(born().getTime() + nextDays * DAY);
    const nbTxt = nb.getFullYear() > new Date().getFullYear() + 150 ? `in the year ${nb.getFullYear()}` : nb.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    setText('ageSub', `${unit}. Next birthday: ${nbTxt}`);
    const kg = prof.kg * s.g / 9.807;
    setText('weight', wTxt(kg));
    const ratio = s.g / 9.807;
    setText('wSub', s.key === 'earth' ? 'Exactly what it says at home' : `${ratio >= 1 ? fmt(ratio, 2) + ' times' : fmt(ratio * 100, ratio < .01 ? 2 : 0) + '% of'} your Earth weight`);
    setText('jumpH', dist(jumpM(s)));
    setText('jSub', `Hang time ${dur(hang(s))}${s.gas ? ', off a floating platform' : ''}`);
    const dm = s.day.match(/^(.*?)(?:,\s*| (from .*))(.*)$/);
    setText('dayB', dm ? dm[1] : s.day);
    setText('dSub', dm ? `${dm[2] || ''}${dm[3] || ''}`.trim() || s.temp : s.temp);
    $('fact').textContent = s.fact;
    const light = s.au * 499;
    const drive = s.au * 149.6e6 / 100 / 8766;
    const items = [
      ['Temperature', s.temp],
      ['Sunlight takes', light < 3600 ? `${fmt(light / 60, 1)} minutes to arrive` : `${fmt(light / 3600, 1)} hours to arrive`],
      ['Driving from the Sun', `${fmt(drive)} years at 100 km/h`]
    ];
    if (s.orbit) items.push([`Laps of ${s.parent}`, `${fmt(days / s.orbit)} since you were born`]);
    if (s.key === 'earth') items.push(['Laps of the Sun', `${fmt(days / 365.256, 1)} so far, about ${fmt(days * 86400 * 29.78 / 1e6)} million km`]);
    $('more').innerHTML = '';
    for (const [a, b] of items) { const li = document.createElement('li'); li.innerHTML = '<span></span><b></b>'; li.firstChild.textContent = a; li.lastChild.textContent = b; $('more').append(li); }
    $('back').disabled = idx === 0;
    $('next').textContent = idx === STOPS.length - 1 ? 'Head home ›' : `Next: ${STOPS[idx + 1].name.replace('The ', '')} ›`;
    cv.setAttribute('aria-label', `Your astronaut standing on ${s.name}`);
    paintRoute();
    setupGuess();
  }

  function setupGuess() {
    const box = $('guess'), s = STOPS[idx];
    const hide = !ADV || s.key === 'earth' || guessed[s.key] != null;
    box.hidden = hide;
    document.querySelector('.pp-tile--w').classList.toggle('is-hidden', !hide);
    if (hide) return;
    const r = s.g / 9.807;
    const opts = new Set([r]);
    const cand = [r * 2.5, r / 2.5, r * 6, r / 6, r * 1.6, r / 1.6, 1, .38, 2.53, .17];
    for (const c of Curio.shuffle(cand)) { if (opts.size >= 4) break; if ([...opts].every((o) => Math.abs(Math.log(o / c)) > .3)) opts.add(c); }
    const el = $('guessOpts'); el.innerHTML = '';
    Curio.shuffle([...opts]).forEach((o) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pp-opt';
      b.innerHTML = `<b>${wTxt(prof.kg * o)}</b><small>${o >= 1 ? 'x' + fmt(o, 2) : fmt(o * 100, o < .01 ? 2 : 0) + '%'}</small>`;
      b.addEventListener('click', () => {
        const ok = o === r;
        guessed[s.key] = ok;
        if (ok) { score++; Curio.sfx && Curio.sfx('success'); Curio.toast('Spot on! +1'); } else { Curio.sfx && Curio.sfx('error'); Curio.toast(`Not quite. It is ${wTxt(prof.kg * r)}`); }
        el.querySelectorAll('button').forEach((x) => { x.disabled = true; });
        b.classList.add(ok ? 'is-ok' : 'is-bad');
        setTimeout(setupGuess, 900);
      });
      el.append(b);
    });
  }

  function stamp() {
    const s = STOPS[idx];
    const first = !visited.has(idx);
    visited.add(idx);
    if (first) {
      const age = ageDays() / s.year;
      const old = stamps[s.key];
      stamps[s.key] = { at: Date.now(), age: +age.toFixed(2), n: (old ? old.n : 0) + 1 };
      Curio.store.set(KEY + ':stamps', stamps);
      const fx = $('stampfx');
      fx.textContent = s.name.replace('The ', '').toUpperCase();
      fx.style.setProperty('--c', s.stamp);
      fx.classList.remove('on'); void fx.offsetWidth; fx.classList.add('on');
      setTimeout(() => Curio.sfx && Curio.sfx('stamp'), 380);
      navigator.vibrate && navigator.vibrate(20);
    }
    $('stampN').textContent = Object.keys(stamps).filter((k) => STOPS.some((s2) => s2.key === k)).length;
  }
  function arrive() {
    travelling = false;
    $('warp').textContent = '';
    paintStop(); stamp();
    Curio.beep(660, .12, 'sine', .07); setTimeout(() => Curio.beep(990, .16, 'sine', .06), 110);
  }
  function go(i) {
    if (travelling || i === idx || i < 0) return;
    if (i >= STOPS.length) { finish(); return; }
    const from = STOPS[idx], to = STOPS[i];
    idx = i; travelling = true; jumpT = -1;
    warpT = performance.now() / 1000;
    const au = Math.abs(to.au - from.au);
    $('warp').textContent = au < .01 ? `Hopping over to ${to.name}...` : `Cruising ${fmt(au, au < 1 ? 2 : 1)} AU to ${to.name}...`;
    Curio.sfx && Curio.sfx('whoosh');
  }
  function jump() {
    if (travelling || jumpT >= 0) return;
    const s = STOPS[idx], h = jumpM(s);
    jumpDur = Math.min(4.5, Math.max(.6, hang(s) * (h > 3 ? .5 : 1)));
    jumpPx = Math.min(CH * 2.2, 30 * Math.log2(1 + h / .25) * (CH / 340) * 1.6);
    jumpT = performance.now() / 1000;
    Curio.beep(240 + 300 / Math.max(.3, s.g / 9.807), .25, 'triangle', .07);
    if (ADV) {
      const b = Curio.best(`jump:${s.key}`, +h.toFixed(2));
      if (b.isNew && b.best > 2) Curio.toast(`${dist(h)} straight up. Mind the satellites.`);
    }
  }

  function startVoyage() {
    board.hidden = true; end.hidden = true; voyage.hidden = false;
    idx = 0; visited = new Set(); score = 0; guessed = {};
    size(); paintStop(); stamp();
    Curio.sfx && Curio.sfx('whoosh');
    scrollTo({ top: 0, behavior: 'smooth' });
  }
  function finish() {
    voyage.hidden = true; end.hidden = false;
    const days = ageDays();
    const list = STOPS.map((s) => ({ s, age: days / s.year, kg: prof.kg * s.g / 9.807, j: jumpM(s) }));
    const oldest = list.reduce((a, b) => (b.age > a.age ? b : a)), young = list.reduce((a, b) => (b.age < a.age ? b : a));
    const heavy = list.reduce((a, b) => (b.kg > a.kg ? b : a)), light = list.reduce((a, b) => (b.kg < a.kg ? b : a));
    $('endName').textContent = prof.who || 'traveller';
    $('endLine').textContent = `You crossed ${fmt(STOPS[STOPS.length - 1].au, 1)} AU and stamped ${visited.size} worlds. Back on Earth you are still ${fmt(days / 365.256, 1)} years old, which is honestly the least interesting number on this card.`;
    const st = [
      ['Oldest on', `${oldest.s.name.replace('The ', '')}`, `${fmt(oldest.age, 1)} years`],
      ['Youngest on', young.s.name.replace('The ', ''), `${fmt(young.age, 3)} years`],
      ['Heaviest on', heavy.s.name.replace('The ', ''), wTxt(heavy.kg)],
      ['Lightest on', light.s.name.replace('The ', ''), wTxt(light.kg)]
    ];
    if (ADV) st.push(['Weight guesses', `${score} / ${STOPS.length - 1}`, `best ${Curio.best('guesses', score).best}`]);
    $('endStats').innerHTML = st.map(([a, b, c]) => `<div class="pp-es"><span>${a}</span><b>${b}</b><small>${c}</small></div>`).join('');
    $('endTable').innerHTML = `<table><thead><tr><th>World</th><th>Age</th><th>Weight</th><th>Jump</th></tr></thead><tbody>${list.map((r) => `<tr><td><i style="background:${r.s.stamp}"></i>${r.s.name.replace('The ', '')}</td><td>${smart(r.age)}</td><td>${wTxt(r.kg)}</td><td>${dist(r.j)}</td></tr>`).join('')}</tbody></table>`;
    const trips = Curio.store.get(KEY + ':trips', 0) + 1; Curio.store.set(KEY + ':trips', trips);
    Curio.confetti(); Curio.sfx && Curio.sfx('success');
    scrollTo({ top: 0, behavior: 'smooth' });
  }
  function postcard() {
    const days = ageDays();
    const lines = STOPS.filter((s) => s.simple || ADV).slice(0, 12).map((s) => `${s.name.replace('The ', '')}: ${smart(days / s.year)} years old, ${wTxt(prof.kg * s.g / 9.807)}`);
    return `Greetings from the solar system!\n${lines.join('\n')}\nStamped my Planet Passport on Zoble.`;
  }
  $('share').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(postcard()); Curio.toast('Postcard copied'); } catch { Curio.toast('Could not reach the clipboard'); }
  });
  $('again').addEventListener('click', startVoyage);
  $('edit').addEventListener('click', () => { end.hidden = true; voyage.hidden = true; board.hidden = false; $('born').focus(); });
  $('next').addEventListener('click', () => go(idx + 1));
  $('back').addEventListener('click', () => go(idx - 1));
  $('jump').addEventListener('click', jump);
  $('sceneBox').addEventListener('click', (e) => { if (e.target === cv) jump(); });

  function openBook() {
    const box = $('stamps'); box.innerHTML = '';
    $('bookWho').textContent = `${prof.who || 'Passenger'}, born ${born().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}. ${Curio.store.get(KEY + ':trips', 0)} round trips.`;
    STOPS.forEach((s, i) => {
      const st = stamps[s.key];
      const d = document.createElement('div'); d.className = 'pp-st' + (st ? ' is-on' : '');
      d.style.setProperty('--c', s.stamp); d.style.setProperty('--r', `${((i * 47) % 21) - 10}deg`);
      d.innerHTML = st ? `<b>${s.name.replace('The ', '').toUpperCase()}</b><span>AGE ${smart(st.age)}</span><small>${new Date(st.at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()}</small>` : `<b>${s.name.replace('The ', '')}</b><span>not yet</span>`;
      box.append(d);
    });
    $('book').hidden = false; $('bookX').focus(); Curio.sfx && Curio.sfx('paper');
  }
  $('pass').addEventListener('click', openBook);
  $('bookX').addEventListener('click', () => { $('book').hidden = true; });
  $('book').addEventListener('click', (e) => { if (e.target === $('book')) $('book').hidden = true; });
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input')) return;
    if (!$('book').hidden) { if (e.key === 'Escape') $('book').hidden = true; return; }
    if (voyage.hidden) return;
    if (e.key === 'ArrowRight') go(idx + 1);
    else if (e.key === 'ArrowLeft') go(idx - 1);
    else if (e.key === 'j' || e.key === 'J' || e.key === ' ') { e.preventDefault(); jump(); }
    else if (e.key === 'p' || e.key === 'P') openBook();
  });

  if (!ADV) document.querySelector('.pp-keys').remove();
  requestAnimationFrame(loop);
  window.PP = { go, jump, startVoyage, finish, get idx() { return idx; } };
})();
