(function () {
  const C = window.Curio;
  const games = window.CURIO_READY || [];
  const tags = window.CURIO_TAGS || {};
  const $ = (id) => document.getElementById(id);
  const store = C.store;
  const body = document.body;
  const now = Date.now();
  const calm = () => C.calm;

  const DRAWERS = {
    classic: ['Zoble Arcade', 'the classics, rebuilt by hand. no quarters needed'],
    gym: ['Brain Gym', 'reaction, memory, aim and typing. warm up first'],
    explore: ['Far-off places', 'scroll down, zoom out, get properly lost'],
    life: ['Money and mortality', 'numbers about you, your wallet and your birthday'],
    absurd: ['Deeply absurd', 'we cannot explain these and we will not try'],
    skill: ['Tests of skill', 'how fast, how round, how steady is your hand'],
    brain: ['Brain teasers', 'logic, words and the occasional headache'],
    arcade: ['Arcade corner', 'no coins required, high scores encouraged'],
    puzzle: ['The puzzle drawer', 'click around until something clicks'],
    versus: ['Versus', 'you against a computer that never gets tired'],
    toy: ['The toy box', 'no goals, no timers, just fiddling'],
    make: ['Make things', 'the workshop: glue, string, and good ideas'],
    draw: ['The drawing desk', 'pencils sharpened, paper waiting']
  };
  const INKS = ['var(--accent)', 'var(--c-pop)', 'var(--c-sun)', 'var(--good)'];
  const SKINS = { classic: 'arcade', gym: 'lab', explore: 'postcard', life: 'receipt', absurd: 'polaroid', skill: 'index', brain: 'index', arcade: 'sticker', puzzle: 'polaroid', versus: 'card', toy: 'sticker', make: 'tag', draw: 'sketch' };
  const SKIN_CYCLE = ['polaroid', 'postcard', 'sticker', 'index', 'tag', 'sketch', 'card', 'receipt'];
  const skinOf = (t) => SKINS[t] || SKIN_CYCLE[hash(t || 'x') % SKIN_CYCLE.length];
  const OWN_DECO = { sticker: 1, sketch: 1, tag: 1, arcade: 1, lab: 1, card: 1, postcard: 1 };
  const slugify = (t) => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const balance = (n, max) => {
    if (n <= max) return n;
    let best = max, left = -1;
    for (let c = max; c >= 3; c--) { const r = n % c; const score = r === 0 ? c : r; if (score > left) { left = score; best = c; } }
    return best;
  };
  const GO = { arcade: 'Press start', lab: 'Begin test', postcard: 'Visit', receipt: 'Check out', card: 'Deal me in', tag: 'Make one', sketch: 'Pick up a pencil' };
  const PINS = ['#dc2f6c', '#2f5bd3', '#ffcf3a', '#1d8a52', '#ff7a45', '#6c33ea'];
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const iconOf = (t) => (DRAWERS[t] ? t : 'sparkle');
  const bestOf = (slug) => {
    let out = null;
    try {
      const pre = `curio:best:${slug}:`;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k || !k.startsWith(pre)) continue;
        const v = JSON.parse(localStorage.getItem(k));
        if (typeof v === 'number' && isFinite(v) && (out == null || v > out)) out = v;
      }
    } catch {}
    return out;
  };
  const nameOf = (t) => DRAWERS[t]?.[0] || tags[t] || t;
  const labelOf = (t) => tags[t] || DRAWERS[t]?.[0] || t.replace(/-/g, ' ');
  const ALL_TAGS = [...new Set([...Object.keys(tags), ...games.map((g) => g.tag).filter(Boolean)])];

  let played = store.get('played', {});
  let favs = store.get('hub:favs', {});
  let seen = store.get('hub:seen', null);
  function loadSeen() {
    seen = store.get('hub:seen', null);
    if (!seen) { seen = {}; games.forEach((g, i) => { seen[g.slug] = i >= games.length - 12 ? now : 0; }); }
    else games.forEach((g) => { if (!(g.slug in seen)) seen[g.slug] = now; });
    store.set('hub:seen', seen);
  }
  loadSeen();
  const isNew = (g) => !!seen[g.slug] && now - seen[g.slug] < 14 * 864e5;

  let view = store.get('hub:view', 'all');
  let cat = store.get('hub:tag', 'all');
  if (!['all', 'unplayed', 'favs', 'new', 'recent'].includes(view)) view = 'all';
  if (cat !== 'all' && !games.some((g) => g.tag === cat)) cat = 'all';

  const search = $('search');
  const cabinet = $('cabinet');
  const find = $('find');

  $('deskmark').innerHTML = C.mark();
  find.insertAdjacentHTML('afterbegin', C.icon('search'));
  $('clear').innerHTML = C.icon('close');
  $('uptop').innerHTML = C.icon('plane');
  $('keyhole').innerHTML = C.icon('keyhole');
  $('t-look').innerHTML = C.icon('look');
  $('t-knobs').innerHTML = C.icon('knobs');
  $('f-knobs').innerHTML = `${C.icon('knobs')}Settings`;
  $('f-roll').innerHTML = `${C.icon('dice')}Surprise me`;
  $('f-home').innerHTML = `${C.icon('up')}Back to the top`;
  $('total').textContent = games.length;

  const paintSound = () => { const b = $('t-sound'); b.innerHTML = C.icon(C.muted ? 'mute' : 'sound'); b.setAttribute('aria-label', C.muted ? 'Unmute' : 'Mute'); b.title = C.muted ? 'Sound is off' : 'Sound is on'; };
  paintSound();
  window.addEventListener('curio:sound', paintSound);
  $('t-sound').addEventListener('click', () => { C.setMuted(!C.muted); C.sfx('on'); });
  $('t-look').addEventListener('click', (e) => {
    const i = C.looks.findIndex((l) => l.id === C.look);
    const next = C.looks[(i + 1) % C.looks.length];
    C.sfx('paper');
    C.setLook(next.id, e.currentTarget);
    C.toast(`${next.name}: ${next.note.toLowerCase()}`, 1600);
  });
  $('t-knobs').addEventListener('click', (e) => C.settings(e.currentTarget));
  $('f-knobs').addEventListener('click', (e) => C.settings(e.currentTarget));
  $('f-book').addEventListener('click', () => C.stickerBook());

  const d = new Date();
  const H = d.getHours(), M = d.getMonth(), D = d.getDate(), W = d.getDay();
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const issue = Math.floor((d - new Date(2024, 0, 1)) / 864e5);
  $('vol').textContent = `Vol. ${d.getFullYear() - 2023} · No. ${issue}`;
  $('dateline').textContent = `${DAYS[W]}, ${D} ${MONTHS[M]} ${d.getFullYear()}`;
  const part = H < 5 ? 'The very late edition' : H < 7 ? 'The early edition' : H < 12 ? 'Morning edition' : H < 18 ? 'Afternoon edition' : H < 22 ? 'Evening edition' : 'Late edition';
  const FORECAST = [
    'Forecast: 80% chance of clicking, clearing by bedtime.',
    'Forecast: scattered high scores, light drizzle of confetti.',
    'Forecast: visibility excellent, productivity questionable.',
    'Forecast: a warm front of curiosity moving in from the left.',
    'Forecast: calm, with occasional gusts of "one more go".',
    'Forecast: patchy fog over the puzzle drawer.'
  ];
  let edition = C.pick(FORECAST);
  let label = (W === 0 || W === 6) && H >= 7 && H < 22 ? `Weekend ${part.toLowerCase()}` : part;
  if (M === 0 && D === 1) { label = 'New year edition'; edition = 'Fresh paper, fresh ink, same old games. Happy new year.'; setTimeout(() => C.confetti(120), 900); }
  else if (M === 2 && D === 14) { label = 'Pi day edition'; edition = 'Three point one four one five nine, and so on. Everything round is half price.'; }
  else if (M === 9 && D >= 24) { label = 'Spooky season edition'; edition = D === 31 ? 'Happy Halloween. The back room light keeps flickering, and nobody has touched the chain.' : 'Something rustles in the back room. Probably the jars.'; }
  else if (M === 11 && D >= 24 && D <= 26) { label = 'Holiday edition'; edition = 'Printed on the good paper. Back to the usual stock in January.'; }
  if (M === 3 && D === 1) { body.classList.add('fools'); label = 'April fools edition'; edition = 'Everything is printed perfectly normally. Nothing to see here.'; }
  $('edition').textContent = edition;
  const paintEar = () => { $('ear-l').innerHTML = `<small>${label}</small><b>${DAYS[W]}</b><span>Free, always. No sign-up, no ads.</span>`; };
  paintEar();
  const HEADLINES = [
    'Local reader opens one more game, insists it is the last',
    'Experts confirm the button still does nothing',
    'Puzzle drawer reports record levels of quiet muttering',
    'Snake grows longer, declines to comment',
    'High score set at 2am, no witnesses awake',
    'Die rolls a six again; statisticians unmoved',
    'Back room light found on, briefly',
    'Committee approves more confetti, with reservations'
  ];
  let headN = hash(d.toDateString()) % HEADLINES.length, headSeen = 0;
  const paintHead = () => { $('headline').textContent = HEADLINES[headN]; $('ear-n').textContent = `${String(headN + 1).padStart(2, '0')} / ${String(HEADLINES.length).padStart(2, '0')}`; };
  paintHead();
  $('ear-r').addEventListener('click', () => {
    headN = (headN + 1) % HEADLINES.length;
    const ear = $('ear-r');
    ear.classList.remove('turn'); void ear.offsetWidth; ear.classList.add('turn');
    paintHead();
    C.sfx('paper');
    if (++headSeen >= HEADLINES.length - 1) C.unlock('extra');
  });
  if (M === 9) {
    const bats = document.createElement('div');
    bats.className = 'bats';
    bats.setAttribute('aria-hidden', 'true');
    const bat = '<svg viewBox="0 0 40 20"><path d="M20 6c-2-4 2-4 0 0zM20 8c-4-6-10-8-18-4 4 2 6 6 4 10 4-4 8-2 10 2 2-4 2-6 4-8 2 2 2 4 4 8 2-4 6-6 10-2-2-4 0-8 4-10-8-4-14-2-18 4z" fill="currentColor"/></svg>';
    bats.innerHTML = bat + bat + bat;
    const pos = [[6, 10, 0], [28, 0, 1.6], [58, 76, 3.1]];
    [...bats.children].forEach((b, i) => { b.style.left = `${pos[i][0]}%`; b.style.top = `${pos[i][1]}%`; b.style.animationDelay = `${pos[i][2]}s`; });
    $('stage').append(bats);
  }
  if (M === 11 || (M === 0 && D < 8)) {
    const snow = document.createElement('div');
    snow.className = 'snow';
    snow.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 26; i++) { const f = document.createElement('i'); f.style.left = `${Math.random() * 100}%`; f.style.animationDuration = `${5 + Math.random() * 6}s`; f.style.animationDelay = `${-Math.random() * 8}s`; f.style.transform = `scale(${0.5 + Math.random()})`; snow.append(f); }
    $('stage').append(snow);
  }
  if (W === 5 && D === 13) {
    $('press').insertAdjacentHTML('beforeend', '<svg class="cat" viewBox="0 0 70 40" aria-hidden="true"><path d="M8 34c0-12 8-20 24-20h14l4-8 3 7 4-7 2 10c4 2 5 6 4 10l-4 2v6h-5v-6H22v6h-5v-5c-4 0-6-2-9-5zM8 34C2 30 2 20 8 16" fill="currentColor"/><circle cx="56" cy="20" r="1.6" fill="#ffcf3a"/></svg>');
    label = 'Friday the 13th edition'; paintEar();
    $('edition').textContent = 'A black cat is walking across the bottom of the page. Do not make eye contact.';
  }

  let visits = store.get('hub:visits', 0) + 1;
  store.set('hub:visits', visits);
  if (visits >= 10) setTimeout(() => C.unlock('regular'), 2500);
  if (H < 5) setTimeout(() => C.unlock('night'), 2000);
  else if (H < 7) setTimeout(() => C.unlock('early'), 2000);

  const letters = [...document.querySelectorAll('#logo span')];
  let tune = [];
  letters.forEach((s, i) => {
    s.addEventListener('pointerenter', () => { C.sfx('note', i + 3); boing(s); });
    s.addEventListener('click', () => {
      C.sfx('note', i + 5);
      boing(s);
      tune = tune.concat(i).slice(-5);
      if (tune.join('') === '01234') {
        tune = [];
        C.unlock('composer');
        $('logo').classList.add('encore');
        setTimeout(() => $('logo').classList.remove('encore'), 1600);
        C.toast('Bravo. The nameplate takes a bow.', 2200);
      }
    });
  });
  function boing(s) { s.classList.remove('boing'); void s.offsetWidth; s.classList.add('boing'); setTimeout(() => s.classList.remove('boing'), 140); }

  $('dateline').addEventListener('click', (e) => {
    if (e.detail !== 3) return;
    body.classList.add('misprint');
    C.sfx('stamp');
    C.toast('Hold the presses! Somebody bumped the printer.', 2400);
    C.unlock('misprint');
    setTimeout(() => body.classList.remove('misprint'), 3800);
  });

  function party() {
    body.classList.add('party');
    cabinet.classList.add('party');
    C.sfx('success');
    C.confetti(160);
    C.toast('Bonus issue. The presses have gone slightly mad.', 3000);
    C.unlock('konami');
    setTimeout(() => { body.classList.remove('party'); cabinet.classList.remove('party'); }, 6500);
  }
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let keys = [], typed = '';
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    keys = keys.concat(k).slice(-KONAMI.length);
    if (keys.join() === KONAMI.join()) { keys = []; party(); }
    const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
    if (inField || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === '/') { e.preventDefault(); search.focus(); return; }
    if (k === 'r' && !document.querySelector('.ticket-wrap, .curio-modal, .curio-sheet')) { roll(); }
    if (e.key === '?') C.toast('Shortcuts: / to search, R to roll the die, Esc to clear. There may be others.', 3600);
    if (k.length === 1 && /[a-z]/.test(k)) {
      typed = (typed + k).slice(-8);
      if (typed.endsWith('ink')) { const on = C.trail(); C.toast(on ? 'Leaking ink. Type it again to stop.' : 'Ink cap back on.'); C.unlock('trail'); typed = ''; }
      if (typed.endsWith('hello')) { C.toast('Hello. The presses say hello back.', 2000); typed = ''; }
      if (typed.endsWith('news')) { $('ear-r').click(); typed = ''; }
    }
  });

  const SYN = {
    music: ['piano', 'drum', 'beat', 'theremin', 'melod', 'music', 'sound'],
    space: ['planet', 'universe', 'solar', 'asteroid', 'moon', 'space', 'mars'],
    cards: ['solitaire', 'blackjack', 'memory', 'card'],
    words: ['word', 'typing', 'anagram', 'hangman', 'letter'],
    cat: ['cat', 'pet'],
    paint: ['paint', 'draw', 'colour', 'color', 'sketch', 'ink', 'pixel'],
    relax: ['zen', 'sand', 'lava', 'slime', 'bubble', 'aquarium', 'garden', 'wave'],
    numbers: ['math', 'number', 'count', 'billion', 'interest'],
    two: ['versus', 'chess', 'checkers', 'connect', 'pong', 'tic'],
    sea: ['ocean', 'sea', 'deep', 'water', 'aquarium', 'fish']
  };
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  const hay = (g) => norm(`${g.title} ${g.blurb} ${tags[g.tag] || ''} ${nameOf(g.tag)} ${g.slug.replace(/-/g, ' ')}`);
  function score(g, q) {
    const t = norm(g.title), all = hay(g);
    if (t === q) return 120;
    if (t.startsWith(q)) return 100;
    if (t.split(' ').some((w) => w.startsWith(q))) return 85;
    if (t.includes(q)) return 75;
    if (all.split(' ').some((w) => w.startsWith(q))) return 55;
    if (all.includes(q)) return 45;
    const words = q.split(' ');
    if (words.length > 1 && words.every((w) => all.includes(w))) return 40;
    const syn = SYN[q] || SYN[q.replace(/s$/, '')];
    if (syn && syn.some((w) => all.includes(w))) return 30;
    if (q.length >= 3) { let i = 0; for (const ch of t) if (ch === q[i]) i++; if (i === q.length) return 10; }
    return 0;
  }

  function tally(n) {
    const parts = [];
    for (let i = 0; i < n; i++) {
      const g = Math.floor(i / 5), k = i % 5, x = g * 26;
      const j = ((hash(`t${i}`) % 7) - 3) * 0.35;
      if (k < 4) parts.push(`<path d="M${x + k * 5 + j} ${3 + Math.abs(j)}l${-j * .6} 19"/>`);
      else parts.push(`<path d="M${x - 3} 18l${22} -12"/>`);
    }
    const w = Math.max(10, Math.ceil(n / 5) * 26);
    return `<svg viewBox="-4 0 ${w + 4} 24" style="width:${(w + 4) * 0.9}px" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true">${parts.join('')}</svg>`;
  }

  function tile(g, i, size) {
    const h = hash(g.slug);
    const el = document.createElement('article');
    el.className = `tile${size ? ` is-${size}` : ''}`;
    el.dataset.slug = g.slug;
    el.style.setProperty('--tint', g.color);
    el.style.setProperty('--i', String(i % 12));
    if (!size) el.style.setProperty('--tilt', `${(((h % 37) / 36) * 1.4 - 0.7).toFixed(2)}deg`);
    else if (size === 'wide') el.style.setProperty('--tilt', `${(((h % 11) / 10) * 0.6 - 0.3).toFixed(2)}deg`);
    const skin = skinOf(g.tag);
    el.dataset.skin = skin;
    if (skin === 'arcade' || skin === 'lab') el.style.setProperty('--tilt', '0deg');
    el.dataset.tag = g.tag || '';
    const deco = ['tape', '', '', 'corners', '', '', 'tape', '', ''][h % 9];
    if (!OWN_DECO[skin]) {
      if (deco && size !== 'big') el.dataset.deco = deco;
      if (size === 'big') el.dataset.deco = 'tape';
    }
    el.style.setProperty('--tr', `${((h >> 3) % 9) - 4}deg`);
    el.style.setProperty('--pin', PINS[(h >> 5) % PINS.length]);
    const a = document.createElement('a');
    a.className = 'tile__link';
    a.href = `games/${g.slug}/index.html`;
    a.innerHTML = `<span class="tile__art"><span class="tile__emoji" aria-hidden="true"></span></span><span class="tile__text"><span class="tile__title"></span><span class="tile__blurb"></span><span class="tile__go">${GO[skin] || 'Open it'} ${C.icon('arrow')}</span></span>`;
    if (skin === 'lab') {
      const m = document.createElement('span');
      m.className = 'tile__meta';
      const b = bestOf(g.slug);
      m.innerHTML = `<i>test ${String(i + 1).padStart(2, '0')}</i><i></i>`;
      m.lastChild.textContent = played[g.slug] ? (b != null ? `record ${C.fmt(b, b % 1 ? 2 : 0)}` : `last ${ago(played[g.slug])}`) : 'untested';
      a.querySelector('.tile__text').prepend(m);
    }
    if (skin === 'receipt') {
      const m = document.createElement('span');
      m.className = 'tile__meta';
      m.textContent = `no. ${String(h % 9000 + 1000)}`;
      a.querySelector('.tile__text').prepend(m);
    }
    a.querySelector('.tile__emoji').textContent = g.emoji;
    a.querySelector('.tile__title').textContent = g.title;
    a.querySelector('.tile__blurb').textContent = g.blurb;
    const img = new Image();
    img.alt = ''; img.loading = i < 6 ? 'eager' : 'lazy'; img.decoding = 'async';
    img.onload = () => a.querySelector('.tile__emoji')?.remove();
    img.onerror = () => img.remove();
    img.src = `games/${g.slug}/thumb.svg`;
    a.querySelector('.tile__art').append(img);
    if (played[g.slug]) {
      const s = document.createElement('span');
      s.className = 'stamp'; s.textContent = 'tried';
      s.setAttribute('aria-hidden', 'true');
      a.querySelector('.tile__art').append(s);
      a.setAttribute('aria-description', 'already tried');
    }
    a.addEventListener('pointerenter', () => C.sfx(skin === 'arcade' ? 'blip' : 'hover', h));
    a.addEventListener('click', () => C.sfx('tap'));
    el.append(a);
    const fav = document.createElement('button');
    fav.type = 'button'; fav.className = 'fav';
    const paintFav = () => { fav.setAttribute('aria-pressed', String(!!favs[g.slug])); fav.innerHTML = C.icon(favs[g.slug] ? 'starf' : 'star'); };
    fav.setAttribute('aria-label', `Favourite ${g.title}`);
    paintFav();
    fav.addEventListener('click', () => {
      if (favs[g.slug]) delete favs[g.slug]; else favs[g.slug] = Date.now();
      store.set('hub:favs', favs);
      paintFav();
      fav.classList.remove('boop'); void fav.offsetWidth; fav.classList.add('boop');
      C.sfx(favs[g.slug] ? 'pop' : 'unpop');
      C.toast(favs[g.slug] ? `${g.title} went in your favourites` : `${g.title} left your favourites`, 1400);
      paintChrome();
    });
    el.append(fav);
    if (isNew(g)) {
      const b = document.createElement('span');
      b.className = 'burst'; b.textContent = 'New';
      b.setAttribute('aria-hidden', 'true');
      el.append(b);
    }
    return el;
  }

  function arcadeCorner(key, list) {
    const sec = document.createElement('section');
    sec.className = 'drawer corner-arcade';
    sec.id = `drawer-${key}`;
    sec.setAttribute('aria-labelledby', `h-${key}`);
    const credits = store.get('hub:credits', 0);
    sec.innerHTML = `<div class="cab">
      <div class="cab__marquee">
        <span class="cab__bulbs" aria-hidden="true">${'<i></i>'.repeat(22)}</span>
        <h2 class="cab__title" id="h-${key}"><span>Zoble</span> <span>Arcade</span></h2>
        <p class="cab__sub"></p>
      </div>
      <div class="cab__glass">
        <div class="cab__hud" aria-hidden="true"><span>1UP <b class="cab__p1">00</b></span><span class="cab__hi">HI-SCORE <b>AAA 999999</b></span><span>CREDIT <b class="cab__credit">${String(credits % 100).padStart(2, '0')}</b></span></div>
        <div class="shelf cab__shelf"></div>
      </div>
      <div class="cab__deck">
        <span class="cab__stick" aria-hidden="true"><i></i></span>
        <span class="cab__btns" aria-hidden="true"><i></i><i></i><i></i></span>
        <div class="cab__board" aria-label="Your arcade records"><b>Your records</b><ol class="cab__scores"></ol></div>
        <button type="button" class="cab__coin">${C.icon('coin')}<span>Insert coin</span></button>
      </div>
    </div>`;
    sec.querySelector('.cab__sub').textContent = DRAWERS[key]?.[1] || '';
    const shelf = sec.querySelector('.cab__shelf');
    const many = list.length > 12;
    shelf.classList.toggle('is-many', many);
    shelf.style.setProperty('--gcols', String(many ? 6 : balance(list.length, 5)));
    list.forEach((g, i) => shelf.append(tile(g, i, '')));
    const done = list.filter((g) => played[g.slug]).length;
    sec.querySelector('.cab__p1').textContent = String(done * 100).padStart(4, '0');
    const scores = sec.querySelector('.cab__scores');
    const rows = list.map((g) => [g, bestOf(g.slug)]).sort((a, b) => (b[1] ?? -1) - (a[1] ?? -1)).slice(0, 5);
    rows.forEach(([g, b]) => {
      const li = document.createElement('li');
      li.innerHTML = '<span></span><i></i><b></b>';
      li.firstChild.textContent = g.title.toUpperCase();
      li.lastChild.textContent = b == null ? '-----' : String(Math.round(b)).padStart(5, '0');
      scores.append(li);
    });
    const coin = sec.querySelector('.cab__coin');
    let streak = 0, streakT = 0;
    coin.addEventListener('click', () => {
      const c = store.get('hub:credits', 0) + 1;
      store.set('hub:credits', c);
      sec.querySelector('.cab__credit').textContent = String(c % 100).padStart(2, '0');
      C.sfx('coin');
      coin.classList.remove('drop'); void coin.offsetWidth; coin.classList.add('drop');
      clearTimeout(streakT); streakT = setTimeout(() => { streak = 0; }, 2500);
      if (++streak >= 3) {
        streak = 0;
        sec.classList.remove('is-jackpot'); void sec.offsetWidth; sec.classList.add('is-jackpot');
        setTimeout(() => sec.classList.remove('is-jackpot'), 3200);
        C.unlock('coin');
        C.toast(C.pick(['Ready player one.', 'Three credits! The cabinet is very excited.', 'Player one has entered the game.']), 2200);
      }
    });
    return sec;
  }

  function gymCorner(key, list) {
    const sec = document.createElement('section');
    sec.className = 'drawer corner-gym';
    sec.id = `drawer-${key}`;
    sec.setAttribute('aria-labelledby', `h-${key}`);
    const today = new Date().toDateString();
    const doneToday = list.filter((g) => played[g.slug] && new Date(played[g.slug]).toDateString() === today);
    sec.innerHTML = `<div class="gym">
      <div class="gym__head">
        <div class="gym__sign"><span class="gym__bolt" aria-hidden="true">${C.icon('bolt')}</span><h2 id="h-${key}">Brain Gym</h2><p></p></div>
        <div class="gym__clip" aria-label="Today's workout">
          <span class="gym__clamp" aria-hidden="true"></span>
          <b>Today's workout</b>
          <ul class="gym__list"></ul>
          <small class="gym__sum"></small>
        </div>
        <button type="button" class="gym__bell" aria-label="Lift the dumbbell"><svg viewBox="0 0 120 50" aria-hidden="true"><rect x="22" y="21" width="76" height="8" rx="3" fill="#8b93a7" stroke="#1b1830" stroke-width="3"/><rect x="8" y="6" width="16" height="38" rx="4" fill="var(--accent)" stroke="#1b1830" stroke-width="3"/><rect x="96" y="6" width="16" height="38" rx="4" fill="var(--accent)" stroke="#1b1830" stroke-width="3"/><rect x="1" y="13" width="9" height="24" rx="3" fill="#2b2b3a" stroke="#1b1830" stroke-width="3"/><rect x="110" y="13" width="9" height="24" rx="3" fill="#2b2b3a" stroke="#1b1830" stroke-width="3"/></svg><span class="gym__reps">0 reps</span></button>
      </div>
      <div class="shelf gym__shelf"></div>
    </div>`;
    sec.querySelector('.gym__sign p').textContent = DRAWERS[key]?.[1] || '';
    const ul = sec.querySelector('.gym__list');
    const items = list.flatMap((g) => (Array.isArray(g.tests) && g.tests.length ? g.tests.map((t) => {
      const name = typeof t === 'string' ? t : t.name || t.title || '';
      const id = typeof t === 'string' ? slugify(t) : t.id || slugify(name);
      return { g, name, href: `games/${g.slug}/index.html#${id}` };
    }) : [{ g, name: g.title, href: `games/${g.slug}/index.html` }])).filter((x) => x.name).slice(0, 6);
    items.forEach(({ g, name, href }) => {
      const li = document.createElement('li');
      const ok = doneToday.includes(g);
      li.className = ok ? 'is-done' : '';
      li.innerHTML = `<span class="gym__box">${ok ? C.icon('check') : ''}</span><a></a>`;
      li.querySelector('a').href = href;
      li.querySelector('a').textContent = name;
      ul.append(li);
    });
    const n = items.length;
    const k = items.filter((x) => doneToday.includes(x.g)).length;
    sec.querySelector('.gym__sum').textContent = k >= n ? 'All done. Take the rest of the day off.' : k ? `${k} of ${n} done. Keep going.` : 'Nothing yet today. Start with a warm-up.';
    const shelf = sec.querySelector('.gym__shelf');
    const few = list.length <= 2;
    shelf.classList.toggle('is-few', few);
    if (!few) shelf.style.setProperty('--gcols', String(balance(list.length, 6)));
    list.forEach((g, i) => shelf.append(tile(g, i, few ? 'wide' : '')));
    const bell = sec.querySelector('.gym__bell');
    let reps = 0;
    bell.addEventListener('click', () => {
      reps++;
      const total = store.get('hub:lifts', 0) + 1;
      store.set('hub:lifts', total);
      bell.querySelector('.gym__reps').textContent = `${reps} rep${reps === 1 ? '' : 's'}`;
      bell.classList.remove('lift'); void bell.offsetWidth; bell.classList.add('lift');
      C.sfx('lift');
      if (reps === 10) { C.unlock('gains'); C.toast('Ten reps! Your brain is visibly bigger.', 2400); C.confetti(60); }
      if (reps === 25) C.toast('Ok, that\'s enough. The dumbbell is tired.', 2200);
    });
    return sec;
  }
  const CORNERS = { classic: arcadeCorner, gym: gymCorner };

  let nothing = 0;
  function blankTile() {
    const el = document.createElement('article');
    el.className = 'tile';
    el.style.setProperty('--tilt', '1.2deg');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'blank';
    const words = ['(this space intentionally left blank)', 'this tile does nothing.', 'still nothing.', 'nope. nothing.', 'you are very persistent.', 'fine. have a sticker.'];
    b.textContent = words[0];
    b.addEventListener('click', () => {
      nothing++;
      b.textContent = words[Math.min(nothing, words.length - 1)];
      b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      C.sfx(nothing >= 5 ? 'stamp' : 'tap');
      if (nothing >= 5) C.unlock('nothing');
    });
    el.append(b);
    return el;
  }

  let cols = 0;
  function measure() {
    const w = (cabinet.clientWidth - 32) || innerWidth;
    return innerWidth <= 560 ? 2 : Math.max(1, Math.floor((w + 26) / (190 + 26)));
  }
  function sizes(n) {
    const out = Array(n).fill('');
    if (n < 4 || cols < 2) return out;
    out[0] = 'big';
    const cells = n + (cols >= 3 ? 3 : 1);
    let need = Math.min((cols - (cells % cols)) % cols, n - 1);
    if (cols >= 3 && need === 0 && n > 12) need = cols;
    if (need > n - 1) need = 0;
    for (let k = 0; k < need; k++) {
      let idx = Math.min(n - 1, 1 + Math.round(((k + 0.6) * (n - 1)) / need));
      while (out[idx] && idx < n - 1) idx++;
      while (out[idx] && idx > 1) idx--;
      out[idx] = 'wide';
    }
    return out;
  }

  function drawer(key, title, desc, ic, ink, list, opts = {}) {
    const sec = document.createElement('section');
    sec.className = 'drawer';
    sec.id = `drawer-${key}`;
    sec.style.setProperty('--dc', ink);
    const head = document.createElement('header');
    head.className = 'drawer__head';
    if (opts.no) {
      const k = document.createElement('span');
      k.className = 'drawer__no';
      k.textContent = `Section ${String(opts.no).padStart(2, '0')}`;
      head.append(k);
    }
    const h2 = document.createElement('h2');
    h2.className = 'plate';
    h2.innerHTML = C.icon(ic);
    h2.append(title);
    const p = document.createElement('p');
    p.className = 'drawer__desc'; p.textContent = desc;
    head.append(h2, p);
    if (opts.tally) {
      const done = list.filter((g) => played[g.slug]).length;
      const t = document.createElement('span');
      t.className = 'drawer__tally';
      t.innerHTML = done ? `${tally(done)}<span>${done} of ${list.length} tried</span>` : `<span>${list.length} things, none tried yet</span>`;
      if (done === list.length && list.length) {
        t.insertAdjacentHTML('afterbegin', '<span class="drawer__done">complete</span>');
        setTimeout(() => C.unlock('drawer'), 1800);
      }
      head.append(t);
    }
    const shelf = document.createElement('div');
    shelf.className = 'shelf';
    const sz = sizes(list.length);
    list.forEach((g, i) => shelf.append(tile(g, i, sz[i])));
    if (opts.extra) shelf.append(opts.extra);
    sec.append(head, shelf);
    return sec;
  }

  const stampMark = (word) => `<span class="nil" aria-hidden="true"><span>${word}</span></span>`;
  function emptyState(title, text, withRoll = true, word = 'nil') {
    const e = document.createElement('div');
    e.className = 'empty';
    e.innerHTML = `${stampMark(word)}<div class="empty__text"><b></b><p></p><div class="c-row" style="justify-content:flex-start"></div></div>`;
    e.querySelector('b').textContent = title;
    e.querySelector('p').textContent = text;
    const row = e.querySelector('.c-row');
    if (withRoll) {
      const r = document.createElement('button');
      r.type = 'button'; r.className = 'c-btn'; r.textContent = 'Roll the die instead';
      r.addEventListener('click', roll);
      row.append(r);
    }
    if (search.value) {
      const c = document.createElement('button');
      c.type = 'button'; c.className = 'c-btn c-btn--ghost'; c.textContent = 'Clear the search';
      c.addEventListener('click', () => { search.value = ''; render(); search.focus(); });
      row.append(c);
    }
    return e;
  }

  const VIEWS = [
    ['all', 'Everything', 'everything'],
    ['unplayed', 'Not played', 'eye'],
    ['favs', 'Favourites', 'star'],
    ['new', 'New', 'sparkle'],
    ['recent', 'Recent', 'clock']
  ];
  const views = $('views');
  VIEWS.forEach(([k, label, ic]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tab'; b.dataset.view = k;
    b.innerHTML = `${C.icon(ic)}<span>${label}</span><b></b>`;
    b.addEventListener('click', () => { view = k; store.set('hub:view', view); C.sfx('paper'); render(true); });
    views.append(b);
  });
  const cats = $('cats');
  const chipTags = ALL_TAGS.filter((t) => games.some((g) => g.tag === t)).sort((a, b) => (CORNERS[b] ? 1 : 0) - (CORNERS[a] ? 1 : 0));
  [['all', 'All drawers', 'everything'], ...chipTags.map((t) => [t, nameOf(t), iconOf(t)])].forEach(([k, label, ic], i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = `stampchip${CORNERS[k] ? ` stampchip--${k}` : ''}`; b.dataset.tag = k;
    b.style.setProperty('--r', `${((hash(k) % 5) - 2) * 0.3}deg`);
    const n = k === 'all' ? games.length : games.filter((g) => g.tag === k).length;
    b.innerHTML = `${C.icon(ic)}<span></span><small>${n}</small>`;
    b.querySelector('span').textContent = k === 'all' ? label : labelOf(k);
    b.title = k === 'all' ? 'Show every drawer' : `${label}: ${DRAWERS[k]?.[1] || ''}`;
    b.addEventListener('click', () => {
      cat = k; store.set('hub:tag', cat);
      b.classList.remove('thunk'); void b.offsetWidth; b.classList.add('thunk');
      C.sfx('stamp');
      render(true);
    });
    cats.append(b);
  });

  function counts() {
    return {
      all: games.length,
      unplayed: games.filter((g) => !played[g.slug]).length,
      favs: games.filter((g) => favs[g.slug]).length,
      new: games.filter(isNew).length,
      recent: games.filter((g) => played[g.slug]).length
    };
  }
  function paintChrome() {
    const n = counts();
    views.querySelectorAll('.tab').forEach((b) => {
      b.setAttribute('aria-pressed', String(b.dataset.view === view));
      const c = b.querySelector('b');
      c.textContent = n[b.dataset.view];
      c.hidden = b.dataset.view === 'all' || !n[b.dataset.view];
    });
    cats.querySelectorAll('.stampchip').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tag === cat)));
    const got = Object.keys(C.found()).length;
    const st = $('status');
    st.innerHTML = `<span><b>${games.length}</b> things in the cabinet</span><span>you've tried <b>${n.recent}</b></span><span><b>${n.favs}</b> favourite${n.favs === 1 ? '' : 's'}</span><button type="button" id="st-book">${got ? `${got} secret sticker${got === 1 ? '' : 's'} found` : 'secret stickers: none yet'}</button>`;
    $('st-book').addEventListener('click', () => C.stickerBook());
    const def = store.get('modeDefault', 'simple') === 'advanced' ? 'advanced' : 'simple';
    const mb = document.createElement('button');
    mb.type = 'button'; mb.id = 'st-mode'; mb.className = 'st-mode';
    mb.setAttribute('aria-label', `New games open in ${def} mode. Switch to ${def === 'simple' ? 'advanced' : 'simple'}`);
    mb.innerHTML = `${C.icon(def)}<span>games open in <b>${def === 'simple' ? 'Simple' : 'Advanced'}</b></span>`;
    mb.addEventListener('click', () => {
      const next = (store.get('modeDefault', 'simple') === 'advanced') ? 'simple' : 'advanced';
      store.set('modeDefault', next);
      C.sfx('flip');
      C.toast(next === 'advanced' ? 'Advanced it is: every mode, stat and setting.' : 'Simple it is: quick and easy to pick up.', 2200);
      paintChrome();
      $('st-mode').focus();
    });
    st.append(mb);
    $('f-book').innerHTML = `${C.icon('book')}Sticker book <small>${got} / ${C.secrets.length}</small>`;
    $('f-count').textContent = `You have opened ${n.recent} of ${games.length}.`;
  }

  function renderCorner() {
    let list = games.filter((g) => played[g.slug]).sort((a, b) => played[b.slug] - played[a.slug]).slice(0, 10);
    const fresh = !list.length;
    if (fresh) {
      const seenTags = new Set();
      list = games.filter((g) => g.starter).slice(0, 7);
      for (const g of [...games].sort((a, b) => (CORNERS[b.tag] ? 1 : 0) - (CORNERS[a.tag] ? 1 : 0))) {
        if (list.length >= 7) break;
        if (seenTags.has(g.tag) || list.includes(g)) continue;
        seenTags.add(g.tag); list.push(g);
      }
    }
    const corner = $('corner');
    corner.hidden = !list.length || !!search.value.trim();
    $('corner-h').textContent = fresh ? 'First time here?' : 'Back for more?';
    corner.querySelector('.corner__head p').textContent = fresh ? 'start with one of these, then wander' : 'where you left off';
    const line = $('line');
    line.replaceChildren(...list.map((g) => {
      const a = document.createElement('a');
      a.className = 'snap';
      a.href = `games/${g.slug}/index.html`;
      a.style.setProperty('--tint', g.color);
      a.style.setProperty('--tilt', `${((hash(g.slug) % 9) - 4) * 0.35}deg`);
      a.innerHTML = '<img alt="" loading="lazy" decoding="async"><b></b><small></small>';
      a.querySelector('img').src = `games/${g.slug}/thumb.svg`;
      a.querySelector('b').textContent = g.title;
      a.querySelector('small').textContent = fresh ? `from ${labelOf(g.tag).toLowerCase()}` : ago(played[g.slug]);
      a.addEventListener('pointerenter', () => C.sfx('hover', hash(g.slug)));
      return a;
    }));
    line.style.setProperty('--w', `${list.length * 156 + 20}px`);
  }
  function renderDaily() {
    const el = $('daily');
    const q = search.value.trim();
    el.hidden = !!q || !games.length;
    if (el.hidden) return;
    const key = new Date().toDateString();
    const g = games[hash(`pick${key}`) % games.length];
    const lines = ['Five minutes, well spent.', 'Recommended by the desk. No refunds.', 'Today\'s least productive use of time.', 'Highly rated by people who should be working.', 'Better than whatever you were about to do.', 'Read the instructions. Or don\'t.'];
    el.innerHTML = `<h2 id="daily-h"><small>${DAYS[new Date().getDay()]}</small>Pick of the day</h2>
      <a class="daily__card" href="games/${g.slug}/index.html"><span class="daily__art" style="--tint:${g.color}"><img alt="" decoding="async"></span><b></b><span class="daily__why"></span></a>
`;
    el.querySelector('img').src = `games/${g.slug}/thumb.svg`;
    el.querySelector('b').textContent = g.title;
    el.querySelector('.daily__why').textContent = lines[hash(key) % lines.length];
    if (played[g.slug] && new Date(played[g.slug]).toDateString() === key) el.querySelector('.daily__card').insertAdjacentHTML('beforeend', '<span class="stamp">done!</span>');
    el.querySelector('a').addEventListener('pointerenter', () => C.sfx('hover', 9));
  }
  function ago(t) {
    const s = (Date.now() - t) / 1000;
    if (s < 90) return 'just now';
    if (s < 3600) return `${Math.round(s / 60)} min ago`;
    if (s < 86400) return `${Math.round(s / 3600)} h ago`;
    const dd = Math.round(s / 86400);
    return dd === 1 ? 'yesterday' : `${dd} days ago`;
  }

  let io = null;
  function animateIn() {
    io?.disconnect();
    if (calm() || !('IntersectionObserver' in window)) return;
    const tiles = [...cabinet.querySelectorAll('.tile')];
    tiles.forEach((t) => t.classList.add('pre'));
    io = new IntersectionObserver((entries) => {
      let k = 0;
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const t = en.target;
        io.unobserve(t);
        t.style.setProperty('--i', String(k++));
        t.classList.remove('pre');
        t.classList.add('enter');
        t.addEventListener('animationend', () => t.classList.remove('enter'), { once: true });
      }
    }, { rootMargin: '0px 0px -30px 0px' });
    tiles.forEach((t) => io.observe(t));
  }

  function hide() {
    if (store.get('hub:secrets', {}).regmark) return;
    const tiles = [...cabinet.querySelectorAll('.tile:not(.is-big)')];
    if (tiles.length < 6) return;
    const t = tiles[3 + Math.floor(Math.random() * (tiles.length - 3))];
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'regmark';
    b.setAttribute('aria-label', 'A small printer\'s mark');
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      b.classList.add('found');
      C.sfx('stamp');
      C.toast('Registration mark. The plates line up perfectly. Carry on.', 2600);
      C.unlock('regmark');
      setTimeout(() => b.remove(), 900);
    });
    t.append(b);
  }

  let special = '';
  function render(scrollUp) {
    cols = measure();
    played = store.get('played', {});
    favs = store.get('hub:favs', {});
    paintChrome();
    renderCorner();
    renderDaily();
    const raw = search.value;
    const q = norm(raw);
    find.classList.toggle('has-text', !!raw);
    const inCat = (g) => cat === 'all' || g.tag === cat;
    const out = [];
    special = '';
    if (q === '42') {
      special = 'answer';
      C.unlock('answer');
      out.push(emptyState('The answer, yes.', 'Forty-two. The question is still being worked out. Results expected in a few million years.', true, '42'));
    } else if (q === 'lost' || q === 'lost and found' || q === 'found') {
      C.unlock('lost');
      const el = document.createElement('div');
      el.className = 'empty';
      el.innerHTML = `${stampMark('L&amp;F')}<div class="empty__text"><b>Lost something?</b><p>There is a box behind the counter for everything people drop. Socks, keys, a perfectly good circle.</p><div class="c-row" style="justify-content:flex-start"><a class="c-btn" href="lost.html">Open the lost and found</a></div></div>`;
      out.push(el);
    } else if (q === 'secret' || q === 'secrets' || q === 'easter egg' || q === 'easter eggs') {
      out.push(emptyState('Nice try.', `Secrets are not searchable. That is what makes them secrets. There are ${C.secrets.length} of them, though.`, false));
    } else if (q === 'konami') {
      out.push(emptyState('Up, up, down, down...', 'You know the rest. Not in here though. Try it out there, with the search box closed.', false));
    }
    let shown = [];
    if (out.length) {
      const sec = document.createElement('section');
      sec.className = 'drawer';
      sec.append(...out);
      cabinet.replaceChildren(sec);
    } else if (!q && view === 'all') {
      const keys = ALL_TAGS.filter((t) => cat === 'all' || t === cat).sort((a, b) => (CORNERS[b] ? 1 : 0) - (CORNERS[a] ? 1 : 0));
      const secs = keys.map((t, i) => {
        const list = games.filter((g) => g.tag === t);
        shown = shown.concat(list);
        if (!list.length) return null;
        if (CORNERS[t]) return CORNERS[t](t, list);
        return drawer(t, nameOf(t), DRAWERS[t]?.[1] || '', iconOf(t), INKS[i % INKS.length], list, { tally: true, no: i + 1, extra: t === 'toy' ? blankTile() : null });
      }).filter(Boolean);
      cabinet.replaceChildren(...secs);
    } else {
      let list = games.filter(inCat);
      if (view === 'unplayed') list = list.filter((g) => !played[g.slug]);
      if (view === 'favs') list = list.filter((g) => favs[g.slug]).sort((a, b) => favs[b.slug] - favs[a.slug]);
      if (view === 'new') list = list.filter(isNew);
      if (view === 'recent') list = list.filter((g) => played[g.slug]).sort((a, b) => played[b.slug] - played[a.slug]);
      if (q) list = list.map((g) => [g, score(g, q)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
      shown = list;
      const VTITLE = { all: ['Everything', 'every single thing in the cabinet'], unplayed: ['Not played yet', 'fresh paper, never touched'], favs: ['Your favourites', 'the ones you starred'], new: ['Fresh off the press', 'recently added to the cabinet'], recent: ['Recently opened', 'most recent first'] };
      let [title, desc] = VTITLE[view];
      if (cat !== 'all') desc = `${desc}, in ${nameOf(cat).toLowerCase()}`;
      if (q) { title = `${list.length} found`; desc = `for "${raw.trim()}"${view !== 'all' ? `, in ${VTITLE[view][0].toLowerCase()}` : ''}${cat !== 'all' ? `, in ${nameOf(cat).toLowerCase()}` : ''}`; }
      const sec = drawer('results', title, desc, q ? 'search' : VIEWS.find((v) => v[0] === view)[2], 'var(--accent)', list, { flat: true });
      if (!list.length) {
        const shelf = sec.querySelector('.shelf');
        if (q) shelf.append(emptyState(C.pick(['We looked everywhere.', 'Nothing in the drawers.', 'Not a sausage.']), `Nothing matches "${raw.trim()}". Try a shorter word, or let the die pick for you.`));
        else if (view === 'favs') shelf.append(emptyState('No favourites yet.', 'Hover a tile and tap its star to keep it here.', true));
        else if (view === 'unplayed') shelf.append(emptyState('You played everything.', 'Every single thing in this drawer. Genuinely impressive.', false, 'done'));
        else if (view === 'recent') shelf.append(emptyState('Nothing opened yet.', 'Things you open show up here, newest first.', true));
        else shelf.append(emptyState('Nothing new right now.', 'New arrivals carry a small label for two weeks.', true));
      }
      cabinet.replaceChildren(sec);
    }
    hide();
    animateIn();
    if (scrollUp) {
      const top = $('views').getBoundingClientRect().top + scrollY - 90;
      if (scrollY > top) scrollTo({ top, behavior: calm() ? 'auto' : 'smooth' });
    }
    return shown;
  }

  let searchT = 0;
  search.addEventListener('input', () => {
    clearTimeout(searchT);
    searchT = setTimeout(() => { render(); }, 90);
    find.classList.toggle('has-text', !!search.value);
    C.sfx('hover', search.value.length * 3);
  });
  search.addEventListener('keydown', (e) => { if (e.key === 'Escape' && search.value) { e.preventDefault(); search.value = ''; render(); } });
  $('clear').addEventListener('click', () => { search.value = ''; C.sfx('close'); render(); search.focus(); });
  const HINTS = ['Find a thing', 'Try "space"', 'Try "cat"', 'Try "music"', 'Try "draw"', 'Try "puzzle"', 'Try "relax"', 'Try "two players"'];
  let hintI = 0;
  const paintHint = () => { search.placeholder = hintI === 0 ? (innerWidth < 560 ? 'Find a thing' : `Find a thing among ${games.length}`) : HINTS[hintI]; };
  paintHint();
  setInterval(() => { if (document.activeElement !== search && !search.value && !document.hidden) { hintI = (hintI + 1) % HINTS.length; paintHint(); } }, 3600);

  let rolling = false;
  function roll() {
    if (rolling) return;
    let pool = games.filter((g) => cat === 'all' || g.tag === cat);
    const fresh = pool.filter((g) => !played[g.slug]);
    if (fresh.length) pool = fresh;
    if (!pool.length) pool = games;
    const g = C.pick(pool);
    rolling = true;
    const n = C.randInt(1, 6);
    const die = $('die'), btn = $('roll');
    const rolls = store.get('hub:rolls', 0) + 1;
    store.set('hub:rolls', rolls);
    if (rolls >= 5) C.unlock('roller');
    C.sfx('roll');
    if (calm()) { die.dataset.n = n; rolling = false; ticket(g, n); return; }
    btn.classList.remove('is-rolling'); void btn.offsetWidth; btn.classList.add('is-rolling');
    let k = 0;
    const vis = [...cabinet.querySelectorAll('.tile')].filter((t) => { const r = t.getBoundingClientRect(); return r.bottom > 80 && r.top < innerHeight - 20; });
    let lit = null;
    const iv = setInterval(() => {
      die.dataset.n = String(1 + (k++ % 6));
      lit?.classList.remove('lit');
      lit = vis.length ? vis[(Math.random() * vis.length) | 0] : null;
      lit?.classList.add('lit');
      if (lit) C.sfx('blip', k);
    }, 85);
    setTimeout(() => {
      clearInterval(iv); lit?.classList.remove('lit'); die.dataset.n = n; btn.classList.remove('is-rolling');
      C.sfx('stamp');
      const el = cabinet.querySelector(`.tile[data-slug="${g.slug}"]`);
      if (el) { const r = el.getBoundingClientRect(); if (r.top > 0 && r.bottom < innerHeight) { el.classList.add('picked'); setTimeout(() => el.classList.remove('picked'), 1000); } }
      setTimeout(() => { rolling = false; ticket(g, n); }, 250);
    }, 900);
  }
  const NUM = ['', 'one', 'two', 'three', 'four', 'five', 'six'];
  function ticket(g, n) {
    const wrap = document.createElement('div');
    wrap.className = 'ticket-wrap';
    wrap.innerHTML = `<div class="ticket" role="dialog" aria-modal="true" aria-label="The die picked something">
      <div class="ticket__top"><span>admit one</span><span>rolled a ${NUM[n]}</span></div>
      <div class="ticket__art" style="--tint:${g.color}"><img alt=""></div>
      <div class="ticket__title"></div><p class="ticket__blurb"></p>
      <div class="ticket__bar"><i></i></div>
      <div class="c-row"><a class="c-btn" href="games/${g.slug}/index.html">Let's go</a><button type="button" class="c-btn c-btn--ghost" data-again>Roll again</button></div></div>`;
    wrap.querySelector('img').src = `games/${g.slug}/thumb.svg`;
    wrap.querySelector('.ticket__title').textContent = g.title;
    wrap.querySelector('.ticket__blurb').textContent = g.blurb;
    document.body.append(wrap);
    C.sfx('open');
    const bar = wrap.querySelector('.ticket__bar');
    let go = setTimeout(() => { location.href = `games/${g.slug}/index.html`; }, 2600);
    requestAnimationFrame(() => requestAnimationFrame(() => bar.classList.add('go')));
    const hold = () => { clearTimeout(go); go = 0; bar.classList.remove('go'); bar.style.opacity = '.35'; };
    wrap.querySelector('.ticket').addEventListener('pointerenter', hold, { once: true });
    const close = () => { clearTimeout(go); wrap.remove(); document.removeEventListener('keydown', onKey, true); C.sfx('close'); };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); $('roll').focus(); }
      if (e.key.toLowerCase() === 'r') { e.preventDefault(); close(); roll(); }
      if (e.key === 'Tab') hold();
    };
    document.addEventListener('keydown', onKey, true);
    wrap.addEventListener('click', (e) => { if (e.target === wrap) close(); });
    wrap.querySelector('[data-again]').addEventListener('click', () => { close(); roll(); });
    wrap.querySelector('a').focus({ preventScroll: true });
  }
  $('roll').addEventListener('click', roll);
  $('f-roll').addEventListener('click', roll);
  $('roll').addEventListener('pointerenter', () => C.sfx('hover', 3));

  const bar = $('pressbar');
  ['--ink', '--accent', '--c-pop', '--c-sun', '--good'].forEach((v) => [100, 60, 25].forEach((k) => {
    const sw = document.createElement('i');
    sw.style.background = `color-mix(in srgb, var(${v}) ${k}%, transparent)`;
    bar.append(sw);
  }));
  $('slug').textContent = `Zoble · ${DAYS[W]} ${D} ${MONTHS[M]} · plate 1 of 2 · ${games.length} pieces`;
  const desk = $('desk'), uptop = $('uptop');
  let lastY = scrollY, lastT = performance.now(), skew = 0, skewRaf = 0, bottomHit = false;
  function settle() {
    skew *= 0.86;
    if (Math.abs(skew) < 0.02) { skew = 0; cabinet.style.setProperty('--skew', '0deg'); skewRaf = 0; return; }
    cabinet.style.setProperty('--skew', `${skew.toFixed(3)}deg`);
    skewRaf = requestAnimationFrame(settle);
  }
  window.addEventListener('scroll', () => {
    const t = performance.now(), y = scrollY;
    const v = (y - lastY) / Math.max(8, t - lastT);
    lastY = y; lastT = t;
    if (!calm()) {
      skew = Math.max(-2.2, Math.min(2.2, skew + v * 0.35));
      if (!skewRaf) skewRaf = requestAnimationFrame(settle);
    }
    if (Math.abs(v) > 9) C.unlock('whoosh');
    desk.classList.toggle('is-stuck', desk.getBoundingClientRect().top <= 0 && y > 200);
    uptop.classList.toggle('is-on', y > 1400);
    if (!bottomHit && innerHeight + y >= document.documentElement.scrollHeight - 30 && y > 600) {
      bottomHit = true;
      C.unlock('bottom');
      $('slug').classList.add('is-signed');
    }
  }, { passive: true });
  uptop.addEventListener('click', () => {
    C.sfx('whoosh');
    uptop.classList.add('launch');
    scrollTo({ top: 0, behavior: calm() ? 'auto' : 'smooth' });
    setTimeout(() => uptop.classList.remove('launch', 'is-on'), 900);
  });

  let away = 0;
  const title = document.title;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { away = Date.now(); document.title = 'Your place is saved · Zoble'; }
    else {
      document.title = title;
      if (away && Date.now() - away > 8000) { C.unlock('missed'); C.toast('Welcome back. Nothing moved, we checked.', 2400); }
      away = 0;
      played = store.get('played', {});
    }
  });

  window.addEventListener('curio:reset', () => { loadSeen(); played = {}; favs = {}; nothing = 0; render(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted) render(); });

  let rT = 0;
  window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (measure() !== cols) render(); }, 200); });
  render();
  console.log('%cZoble%c  printed in two inks. Developers may type zoble() and press enter.', 'font: 700 18px sans-serif; color:#dc2f6c', 'color:#888');
})();
