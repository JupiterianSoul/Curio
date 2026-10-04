(() => {
  const $ = (id) => document.getElementById(id);
  const P = window.FACE_PARTS;
  const { COLORS } = P;
  const MOOD_SET = Object.fromEntries(Object.entries(P.MOODS).map(([k, m]) => [k, { name: m.name }]));
  const CATS = [
    { k: 'face', label: 'Face', icon: '🙂', set: P.SHAPES, color: ['skin', 'skin', 'Skin tone'], vb: '50 30 300 300' },
    { k: 'hair', label: 'Hair', icon: '💇', set: P.HAIR, color: ['hairC', 'hair', 'Hair colour'], vb: '20 0 360 400' },
    { k: 'eyes', label: 'Eyes', icon: '👀', set: P.EYES, color: ['eyeC', 'eye', 'Eye colour'], vb: '120 130 160 120' },
    { k: 'brows', label: 'Brows', icon: '🤨', set: P.BROWS, color: ['hairC', 'hair', 'Brow colour'], vb: '120 120 160 110' },
    { k: 'nose', label: 'Nose', icon: '👃', set: P.NOSES, vb: '140 170 120 100' },
    { k: 'mouth', label: 'Mouth', icon: '👄', set: P.MOUTHS, vb: '140 200 120 110' },
    { k: 'mood', label: 'Mood', icon: '🎭', set: MOOD_SET, mood: true, vb: '40 0 320 320' },
    { k: 'beard', label: 'Beard', icon: '🧔', set: P.BEARDS, color: ['hairC', 'hair', 'Beard colour'], vb: '80 140 240 260' },
    { k: 'glasses', label: 'Glasses', icon: '👓', set: P.GLASSES, color: ['glassesC', 'glasses', 'Frame colour'], vb: '90 110 220 160' },
    { k: 'hat', label: 'Hat', icon: '🎩', set: P.HATS, color: ['hatC', 'hat', 'Hat colour'], vb: '0 0 400 400' },
    { k: 'outfit', label: 'Outfit', icon: '👕', set: P.OUTFITS, color: ['outfitC', 'shirt', 'Outfit colour'], vb: '40 230 320 170' },
    { k: 'pose', label: 'Pose', icon: '👋', set: P.POSES, color: ['outfitC', 'shirt', 'Sleeve colour'], vb: '0 0 400 400' },
    { k: 'acc', label: 'Extras', icon: '✨', set: P.ACCS, multi: true, vb: '50 80 300 320' },
    { k: 'fx', label: 'Effects', icon: '💫', set: P.FX, vb: '0 0 400 400' },
    { k: 'bg', label: 'Backdrop', icon: '🖼️', set: P.BG, color: ['bgC', 'bg', 'Backdrop colour'], vb: '0 0 400 400' }
  ];
  const DEFAULT = { v: 2, name: '', face: 'round', skin: '#f9cba5', hair: 'short', hairC: '#6b4022', eyes: 'round', eyeC: '#6b4a2b', brows: 'natural', nose: 'button', mouth: 'smile', beard: 'none', glasses: 'none', glassesC: '#1d1b19', hat: 'none', hatC: '#ff5a36', outfit: 'tee', outfitC: '#3d7cff', acc: ['blush'], bg: 'dots', bgC: '#ffd166', pose: 'none', fx: 'none' };
  const SETS = { face: P.SHAPES, hair: P.HAIR, eyes: P.EYES, brows: P.BROWS, nose: P.NOSES, mouth: P.MOUTHS, beard: P.BEARDS, glasses: P.GLASSES, hat: P.HATS, outfit: P.OUTFITS, bg: P.BG, pose: P.POSES, fx: P.FX };
  const HEX = /^#[0-9a-f]{6}$/i;
  function sanitize(s) {
    if (!s || typeof s !== 'object') return null;
    const o = Object.assign({}, DEFAULT);
    for (const k of Object.keys(SETS)) if (typeof s[k] === 'string' && SETS[k][s[k]]) o[k] = s[k];
    for (const k of ['skin', 'hairC', 'eyeC', 'glassesC', 'hatC', 'outfitC', 'bgC']) if (typeof s[k] === 'string' && HEX.test(s[k])) o[k] = s[k];
    o.acc = Array.isArray(s.acc) ? s.acc.filter((k) => P.ACCS[k]).slice(0, 8) : [];
    o.name = typeof s.name === 'string' ? s.name.slice(0, 28) : '';
    return o;
  }
  const clone = (s) => JSON.parse(JSON.stringify(s));
  let state = sanitize(Curio.store.get('facemaker', null)) || clone(DEFAULT);
  let cat = 'face';
  const undoStack = [], redoStack = [];
  let gallery = (Curio.store.get('facemaker-gallery', []) || []).map(sanitize).filter(Boolean);
  let locks = Curio.store.get('facemaker-locks', []) || [];
  if (!Array.isArray(locks)) locks = [];
  const statsDef = { rand: 0, saved: 0, wins: 0, best: {}, moods: [], poses: [], exports: 0, photos: 0, renamed: 0 };
  let stats = Object.assign({}, statsDef, Curio.store.get('facemaker-stats', {}) || {});
  if (!Array.isArray(stats.moods)) stats.moods = [];
  if (!Array.isArray(stats.poses)) stats.poses = [];
  if (!stats.best || typeof stats.best !== 'object') stats.best = {};
  let badges = Curio.store.get('facemaker-badges', []) || [];
  if (!Array.isArray(badges)) badges = [];
  let alive = Curio.store.get('facemaker-alive', true) !== false;

  const NAME_A = ['Captain', 'Professor', 'Little', 'Big', 'Sir', 'Lady', 'Doctor', 'Agent', 'Auntie', 'Uncle', 'Baron', 'Coach', 'DJ', 'Chef', 'Count', 'Duchess', 'Major', 'Grandma', 'Lil', 'Detective', 'Madame', 'Admiral', 'Mayor', 'Dr.'];
  const NAME_B = ['Noodle', 'Pickles', 'Biscuit', 'Waffles', 'Pebble', 'Muffin', 'Sprout', 'Bramble', 'Ziggy', 'Mango', 'Tofu', 'Pip', 'Wobble', 'Clementine', 'Gizmo', 'Juniper', 'Nacho', 'Marbles', 'Sunny', 'Rascal', 'Dumpling', 'Crumpet', 'Fizz', 'Pudding', 'Sprocket', 'Toast', 'Bean', 'Moxie', 'Jellybean', 'Turnip'];
  function autoName(s) {
    const h = JSON.stringify(Object.assign({}, s, { name: '' })).split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    return `${NAME_A[h % NAME_A.length]} ${NAME_B[(h >>> 5) % NAME_B.length]}`;
  }
  const nameFor = (s) => (s.name && s.name.trim()) || autoName(s);

  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('facemaker-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) { Curio.toast(`${b.icon} Sticker unlocked: ${b.name}`, 2600); [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .12, 'triangle', .07), i * 90)); }
    renderBadges();
  }
  const BADGES = [
    { id: 'first', icon: '🖼️', name: 'First portrait', d: 'Save your first face' },
    { id: 'crew10', icon: '👪', name: 'Full house', d: 'Save 10 faces' },
    { id: 'crew25', icon: '🏟️', name: 'Crowd', d: 'Save 25 faces' },
    { id: 'dice50', icon: '🎲', name: 'Dice addict', d: 'Randomize 50 times' },
    { id: 'moods', icon: '🎭', name: 'Drama club', d: 'Try 10 different moods' },
    { id: 'poses', icon: '🕺', name: 'Supermodel', d: 'Strike every pose' },
    { id: 'copy', icon: '🪞', name: 'Copycat', d: 'Win a Copycat round' },
    { id: 'copyhard', icon: '🧠', name: 'Perfect twin', d: 'Win Copycat on Hard' },
    { id: 'speedy', icon: '⚡', name: 'Speedy', d: 'Win Copycat in under 30s' },
    { id: 'export', icon: '⬇️', name: 'Framed', d: 'Download a portrait' },
    { id: 'photo', icon: '📸', name: 'Say cheese', d: 'Take a group photo' },
    { id: 'namer', icon: '✍️', name: 'Name giver', d: 'Rename a character' },
    { id: 'locks', icon: '🔐', name: 'Locksmith', d: 'Randomize with 3+ locks' },
    { id: 'code', icon: '🔗', name: 'Cloner', d: 'Load a face from a code' }
  ];
  function saveStats() { Curio.store.set('facemaker-stats', stats); }

  function save() { Curio.store.set('facemaker', state); }
  function push() {
    undoStack.push(JSON.stringify(state)); if (undoStack.length > 80) undoStack.shift();
    redoStack.length = 0; syncUndo();
  }
  function syncUndo() { $('undo').disabled = !undoStack.length; $('redo').disabled = !redoStack.length; }
  function paint(pop) {
    $('preview').innerHTML = P.render(state, { label: 'Your character: ' + nameFor(state) });
    if (document.activeElement !== $('name')) $('name').value = nameFor(state);
    if (pop) { $('preview').classList.remove('pop'); void $('preview').offsetWidth; $('preview').classList.add('pop'); }
    save();
    if (cc) checkCopy();
  }
  function blip() {
    Curio.beep(500 + Math.random() * 400, .05, 'triangle', .07);
    if (navigator.vibrate) try { navigator.vibrate(8); } catch {}
  }
  function set(changes, sound = true) {
    push(); Object.assign(state, changes); paint(); renderOpts();
    if (sound) blip();
  }

  CATS.forEach((c) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'fm-cat'; b.setAttribute('role', 'tab'); b.dataset.k = c.k;
    b.innerHTML = `<i aria-hidden="true">${c.icon}</i>${c.label}`;
    b.addEventListener('click', () => { cat = c.k; renderCats(); renderOpts(); Curio.beep(700, .03, 'sine', .04); });
    $('cats').append(b);
  });
  function renderCats() {
    $('cats').querySelectorAll('.fm-cat').forEach((b) => {
      const on = b.dataset.k === cat;
      b.setAttribute('aria-selected', String(on));
      b.querySelector('.lk')?.remove();
      if (locks.includes(b.dataset.k)) { const l = document.createElement('span'); l.className = 'lk'; l.textContent = '🔒'; b.append(l); }
      if (on) { const box = $('cats'); const l = b.offsetLeft - box.offsetLeft; if (l < box.scrollLeft || l + b.offsetWidth > box.scrollLeft + box.clientWidth) box.scrollLeft = l - 20; }
    });
    const c = CATS.find((x) => x.k === cat);
    $('catTitle').textContent = `${c.label} · ${Object.keys(c.set).length} options`;
    const locked = locks.includes(cat);
    $('lock').setAttribute('aria-pressed', String(locked));
    $('lock').textContent = locked ? '🔒 Locked' : '🔓 Lock';
    $('lock').title = 'Locked parts stay put when you randomize';
  }

  function moodMatches(m) { const d = P.MOODS[m]; return state.eyes === d.eyes && state.brows === d.brows && state.mouth === d.mouth; }
  function applyMood(k) {
    const d = P.MOODS[k];
    if (!stats.moods.includes(k)) { stats.moods.push(k); saveStats(); if (stats.moods.length >= 10) badge('moods'); }
    return { eyes: d.eyes, brows: d.brows, mouth: d.mouth, fx: d.fx };
  }

  function renderOpts() {
    const c = CATS.find((x) => x.k === cat), opts = $('opts');
    opts.innerHTML = '';
    Object.entries(c.set).forEach(([k, v], i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'fm-opt';
      b.style.animationDelay = Math.min(i * 12, 300) + 'ms';
      const on = c.mood ? moodMatches(k) : c.multi ? state.acc.includes(k) : state[c.k] === k;
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', `${c.label}: ${v.name}`);
      let preview;
      if (c.mood) preview = Object.assign({}, state, { eyes: P.MOODS[k].eyes, brows: P.MOODS[k].brows, mouth: P.MOODS[k].mouth, fx: P.MOODS[k].fx, hat: 'none', pose: 'none' });
      else preview = Object.assign({}, state, c.multi ? { acc: [k] } : { [c.k]: k });
      if (c.k !== 'hat' && c.k !== 'mood' && c.k !== 'face') preview.hat = c.k === 'bg' || c.k === 'pose' || c.k === 'fx' ? state.hat : 'none';
      if (c.k !== 'fx' && c.k !== 'mood') preview.fx = 'none';
      if (c.k !== 'pose') preview.pose = 'none';
      b.innerHTML = P.render(preview, { viewBox: c.vb }) + `<span>${v.name}</span>`;
      b.addEventListener('click', () => {
        if (c.mood) { set(applyMood(k)); return; }
        if (c.multi) set({ acc: state.acc.includes(k) ? state.acc.filter((x) => x !== k) : [...state.acc, k] });
        else {
          set({ [c.k]: k });
          if (c.k === 'pose' && k !== 'none' && !stats.poses.includes(k)) { stats.poses.push(k); saveStats(); if (stats.poses.length >= Object.keys(P.POSES).length - 1) badge('poses'); }
        }
      });
      opts.append(b);
    });
    const sw = $('sw'); sw.innerHTML = '';
    if (c.color) {
      const [key, pal, title] = c.color;
      const h = document.createElement('h3'); h.textContent = title; sw.append(h);
      COLORS[pal].forEach((col) => {
        const d = document.createElement('button'); d.type = 'button'; d.className = 'fm-dot'; d.style.background = col;
        d.setAttribute('aria-label', `${title} ${col}`); d.setAttribute('aria-pressed', String(state[key] === col));
        d.addEventListener('click', () => set({ [key]: col }));
        sw.append(d);
      });
      const custom = document.createElement('input'); custom.type = 'color'; custom.value = state[key]; custom.setAttribute('aria-label', 'Custom ' + title.toLowerCase());
      custom.style.cssText = 'width:38px;height:34px;border:0;background:none;padding:0;cursor:pointer';
      custom.addEventListener('change', () => set({ [key]: custom.value }));
      sw.append(custom);
    }
  }

  const R = Curio.pick, chance = (p) => Math.random() < p;
  const keys = (o) => Object.keys(o);
  function randomPart(k) {
    switch (k) {
      case 'face': return { face: R(keys(P.SHAPES).filter((x) => !['alien', 'robot', 'kitty', 'bear'].includes(x) || chance(.25))), skin: chance(.08) ? R(COLORS.skin.slice(8)) : R(COLORS.skin.slice(0, 8)) };
      case 'hair': return { hair: R(keys(P.HAIR)), hairC: chance(.8) ? R(COLORS.hair.slice(0, 8)) : R(COLORS.hair.slice(8)) };
      case 'eyes': return { eyes: R(keys(P.EYES)), eyeC: R(COLORS.eye) };
      case 'brows': return { brows: R(keys(P.BROWS)) };
      case 'nose': return { nose: R(keys(P.NOSES).filter((x) => x !== 'clown' || chance(.2))) };
      case 'mouth': return { mouth: R(keys(P.MOUTHS)) };
      case 'beard': return { beard: chance(.3) ? R(keys(P.BEARDS).filter((x) => x !== 'none')) : 'none' };
      case 'glasses': return { glasses: chance(.35) ? R(keys(P.GLASSES).filter((x) => x !== 'none')) : 'none', glassesC: R(COLORS.glasses) };
      case 'hat': return { hat: chance(.4) ? R(keys(P.HATS).filter((x) => x !== 'none')) : 'none', hatC: R(COLORS.hat) };
      case 'outfit': return { outfit: R(keys(P.OUTFITS)), outfitC: R(COLORS.shirt) };
      case 'acc': return { acc: Curio.shuffle(keys(P.ACCS)).slice(0, Curio.randInt(0, 2)) };
      case 'bg': return { bg: R(keys(P.BG)), bgC: R(COLORS.bg) };
      case 'pose': return { pose: chance(.35) ? R(keys(P.POSES).filter((x) => x !== 'none')) : 'none' };
      case 'fx': return { fx: chance(.2) ? R(keys(P.FX).filter((x) => x !== 'none')) : 'none' };
      case 'mood': return chance(.4) ? applyMood(R(keys(P.MOODS))) : {};
      default: return {};
    }
  }
  function randomState(base) {
    const s = clone(base || DEFAULT);
    s.name = '';
    CATS.forEach((c) => { if (!locks.includes(c.k)) Object.assign(s, randomPart(c.k)); });
    if (locks.includes('mood')) { s.eyes = base.eyes; s.brows = base.brows; s.mouth = base.mouth; }
    if (s.skin === s.bgC) s.bgC = '#8ecae6';
    return s;
  }
  function randomize() {
    if (cc) { Curio.toast('No randomizing in Copycat, that would be cheating 😉'); return; }
    push(); state = randomState(state); paint(true); renderOpts();
    Curio.beep(380, .05, 'square', .05); setTimeout(() => Curio.beep(760, .07, 'square', .05), 60);
    stats.rand++; saveStats();
    if (stats.rand >= 50) badge('dice50');
    if (locks.length >= 3) badge('locks');
  }
  $('rand').addEventListener('click', randomize);
  $('shuffleCat').addEventListener('click', () => {
    let ch = randomPart(cat), tries = 0;
    while (tries++ < 6 && Object.keys(ch).every((k) => JSON.stringify(state[k]) === JSON.stringify(ch[k]))) ch = randomPart(cat);
    set(ch); $('preview').classList.remove('pop'); void $('preview').offsetWidth; $('preview').classList.add('pop');
  });
  $('lock').addEventListener('click', toggleLock);
  function toggleLock() {
    locks = locks.includes(cat) ? locks.filter((x) => x !== cat) : [...locks, cat];
    Curio.store.set('facemaker-locks', locks); renderCats();
    Curio.beep(locks.includes(cat) ? 300 : 500, .06, 'square', .05);
  }
  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(state));
    state = JSON.parse(undoStack.pop()); syncUndo();
    paint(); renderOpts(); Curio.beep(300, .05, 'triangle', .06);
  }
  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(state));
    state = JSON.parse(redoStack.pop()); syncUndo();
    paint(); renderOpts(); Curio.beep(420, .05, 'triangle', .06);
  }
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);

  $('name').addEventListener('change', () => {
    const v = $('name').value.trim().slice(0, 28);
    if (v && v !== autoName(state)) { push(); state.name = v; stats.renamed++; saveStats(); badge('namer'); }
    else state.name = '';
    paint();
  });
  $('name').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('name').blur(); });

  function renderGallery() {
    const g = $('gallery'); g.innerHTML = '';
    if (!gallery.length) { g.innerHTML = '<p class="fm-empty">Nobody here yet. Make a face and press Save.</p>'; return; }
    gallery.forEach((s, i) => {
      const w = document.createElement('div'); w.className = 'fm-saved'; w.style.animationDelay = i * 20 + 'ms';
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Load ' + nameFor(s));
      b.innerHTML = P.render(s);
      b.addEventListener('click', () => {
        if (cc) { Curio.toast('Finish your Copycat round first'); return; }
        push(); state = clone(s); paint(true); renderOpts(); Curio.toast(`${nameFor(s)} is back 👋`);
      });
      const d = document.createElement('button'); d.type = 'button'; d.className = 'fm-del'; d.textContent = '✕'; d.setAttribute('aria-label', 'Delete ' + nameFor(s));
      d.addEventListener('click', () => { gallery.splice(i, 1); Curio.store.set('facemaker-gallery', gallery); renderGallery(); Curio.beep(200, .08, 'sawtooth', .04); });
      const n = document.createElement('small'); n.textContent = nameFor(s);
      w.append(b, d, n); g.append(w);
    });
  }
  function keep() {
    const snap = JSON.stringify(state);
    if (gallery.some((s) => JSON.stringify(s) === snap)) { Curio.toast('Already in your crew'); return; }
    gallery.unshift(JSON.parse(snap)); gallery = gallery.slice(0, 48);
    Curio.store.set('facemaker-gallery', gallery); renderGallery();
    stats.saved++; saveStats();
    Curio.toast(`${nameFor(state)} joined your crew 🎉`);
    if (gallery.length === 1 || gallery.length % 5 === 0) Curio.confetti(80);
    Curio.beep(660, .06, 'sine', .08); setTimeout(() => Curio.beep(990, .1, 'sine', .08), 80);
    badge('first');
    if (gallery.length >= 10) badge('crew10');
    if (gallery.length >= 25) badge('crew25');
  }
  $('keep').addEventListener('click', keep);

  function download(name, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  const slugName = (s) => 'curio-' + nameFor(s).toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
  function svgImage(s, size) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(new Blob([P.render(s, { size })], { type: 'image/svg+xml' }));
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('img')); };
      img.src = url;
    });
  }
  $('svg').addEventListener('click', () => { download(slugName(state) + '.svg', new Blob([P.render(state, { size: 400 })], { type: 'image/svg+xml' })); badge('export'); });
  $('png').addEventListener('click', async () => {
    try {
      const img = await svgImage(state, 800);
      const c = document.createElement('canvas'); c.width = c.height = 800;
      c.getContext('2d').drawImage(img, 0, 0, 800, 800);
      c.toBlob((b) => { if (b) { download(slugName(state) + '.png', b); Curio.toast('Portrait saved 🖼️'); badge('export'); } }, 'image/png');
    } catch { Curio.toast('PNG export failed, try SVG'); }
  });
  $('group').addEventListener('click', async () => {
    const crew = gallery.length ? gallery.slice(0, 24) : [state];
    const cols = Math.min(6, crew.length), rows = Math.ceil(crew.length / cols), S = 240, pad = 24, head = 90, foot = 40;
    const c = document.createElement('canvas'); c.width = cols * (S + pad) + pad; c.height = head + rows * (S + pad + foot);
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 0, 0, c.height); grd.addColorStop(0, '#fff3d6'); grd.addColorStop(1, '#ffd9c7');
    g.fillStyle = grd; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#1d1b19'; g.font = '900 40px system-ui, sans-serif'; g.textAlign = 'center';
    g.fillText(crew.length > 1 ? 'My Curio crew' : nameFor(state), c.width / 2, 60);
    try {
      for (let i = 0; i < crew.length; i++) {
        const img = await svgImage(crew[i], S);
        const x = pad + (i % cols) * (S + pad), y = head + Math.floor(i / cols) * (S + pad + foot);
        g.save(); g.shadowColor = 'rgba(0,0,0,.18)'; g.shadowBlur = 18; g.shadowOffsetY = 6;
        g.beginPath(); g.roundRect ? g.roundRect(x, y, S, S, 26) : g.rect(x, y, S, S); g.fillStyle = '#fff'; g.fill(); g.restore();
        g.save(); g.beginPath(); g.roundRect ? g.roundRect(x, y, S, S, 26) : g.rect(x, y, S, S); g.clip(); g.drawImage(img, x, y, S, S); g.restore();
        g.fillStyle = '#5d5750'; g.font = '800 20px system-ui, sans-serif'; g.fillText(nameFor(crew[i]).slice(0, 22), x + S / 2, y + S + 28);
      }
      c.toBlob((b) => { if (b) { download('curio-crew.png', b); Curio.toast('Group photo saved 📸'); stats.photos++; saveStats(); badge('photo'); Curio.beep(1200, .05, 'square', .06); setTimeout(() => Curio.beep(600, .12, 'sine', .06), 60); } }, 'image/png');
    } catch { Curio.toast('Group photo failed'); }
  });

  const encode = (s) => 'FM2:' + btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  function decode(t) {
    try { const raw = t.trim().replace(/^FM\d:/, ''); return sanitize(JSON.parse(decodeURIComponent(escape(atob(raw))))); } catch { return null; }
  }
  $('code').addEventListener('click', async () => {
    const box = document.createElement('div');
    const p = document.createElement('p'); p.textContent = 'Share this code with a friend, or paste one here to load their face.'; p.style.margin = '0 0 8px';
    const ta = document.createElement('textarea'); ta.className = 'fm-codebox'; ta.value = encode(state); ta.setAttribute('aria-label', 'Face code');
    box.append(p, ta);
    const v = await Curio.modal({ emoji: '🔗', title: 'Face code', body: box, buttons: [{ label: 'Copy code', value: 'copy' }, { label: 'Load pasted code', value: 'load' }, { label: 'Close', value: 'x' }] });
    if (v === 'copy') {
      try { await navigator.clipboard.writeText(encode(state)); Curio.toast('Code copied 📋'); } catch { Curio.toast('Copy failed, select the text instead'); }
    } else if (v === 'load') {
      const s = decode(ta.value);
      if (!s) { Curio.toast('That code looks scrambled 🤔'); return; }
      if (cc) { Curio.toast('Finish your Copycat round first'); return; }
      push(); state = s; paint(true); renderOpts(); Curio.toast(`${nameFor(s)} arrived 👋`); badge('code');
    }
  });

  function setAlive(on) {
    alive = on; Curio.store.set('facemaker-alive', on);
    $('preview').classList.toggle('alive', on);
    $('alive').setAttribute('aria-pressed', String(on));
    $('alive').textContent = on ? '✨ Alive' : '⏸ Still';
  }
  $('alive').addEventListener('click', () => setAlive(!alive));
  document.addEventListener('visibilitychange', () => $('preview').classList.toggle('alive', alive && !document.hidden));

  let cc = null;
  const CC_KEYS = ['face', 'hair', 'eyes', 'brows', 'nose', 'mouth', 'beard', 'glasses', 'hat', 'outfit'];
  const CC_LEVELS = { easy: { n: 4, label: 'Easy', extra: [] }, normal: { n: 7, label: 'Normal', extra: [] }, hard: { n: 10, label: 'Hard', extra: ['skin', 'hairC'] } };
  async function startCopy() {
    const lvl = await Curio.modal({ emoji: '🪞', title: 'Copycat', body: 'A mystery face appears. Rebuild it part by part as fast as you can. Easy changes 4 parts, Normal 7, Hard changes everything plus skin and hair colour.', buttons: [{ label: 'Easy', value: 'easy' }, { label: 'Normal', value: 'normal' }, { label: 'Hard', value: 'hard' }, { label: 'Cancel', value: '' }] });
    if (!lvl) { setMode(false); return; }
    const L = CC_LEVELS[lvl];
    const target = clone(state); target.name = '';
    Curio.shuffle(CC_KEYS.slice()).slice(0, L.n).forEach((k) => {
      const opts = keys(SETS[k]).filter((x) => x !== state[k]);
      target[k] = R(opts);
    });
    if (L.extra.includes('skin')) target.skin = R(COLORS.skin.filter((x) => x !== state.skin).slice(0, 10));
    if (L.extra.includes('hairC')) target.hairC = R(COLORS.hair.filter((x) => x !== state.hairC));
    cc = { lvl, target, keys: CC_KEYS.concat(L.extra), start: performance.now(), penalty: 0, done: false, hint: false };
    $('ccTarget').innerHTML = P.render(target, { label: 'Target face' });
    $('cc').classList.add('on');
    setMode(true);
    checkCopy();
    tickCopy();
    Curio.beep(520, .08, 'triangle', .07); setTimeout(() => Curio.beep(780, .1, 'triangle', .07), 90);
  }
  function wrongKeys() { return cc ? cc.keys.filter((k) => state[k] !== cc.target[k]) : []; }
  function checkCopy() {
    if (!cc || cc.done) return;
    const wrong = wrongKeys(), total = cc.keys.length, ok = total - wrong.length;
    $('ccMeter').style.width = (ok / total * 100) + '%';
    $('ccCount').textContent = `${ok}/${total} match`;
    const catOf = (k) => (k === 'skin' ? 'face' : k === 'hairC' ? 'hair' : k);
    $('cats').querySelectorAll('.fm-cat').forEach((b) => {
      b.querySelector('.bad')?.remove();
      b.classList.remove('good-dot');
      if (cc.hint && wrong.some((k) => catOf(k) === b.dataset.k)) { const d = document.createElement('span'); d.className = 'bad'; b.append(d); }
    });
    if (!wrong.length) winCopy();
  }
  function tickCopy() {
    if (!cc || cc.done) return;
    $('ccTime').textContent = ((performance.now() - cc.start) / 1000 + cc.penalty).toFixed(1) + 's';
    requestAnimationFrame(tickCopy);
  }
  async function winCopy() {
    cc.done = true;
    const t = (performance.now() - cc.start) / 1000 + cc.penalty;
    const lvl = cc.lvl;
    const prev = stats.best[lvl];
    const isNew = !prev || t < prev;
    if (isNew) stats.best[lvl] = +t.toFixed(1);
    stats.wins++; saveStats();
    badge('copy'); if (lvl === 'hard') badge('copyhard'); if (t < 30) badge('speedy');
    Curio.confetti(140);
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, .14, 'triangle', .08), i * 110));
    if (navigator.vibrate) try { navigator.vibrate([20, 40, 20]); } catch {}
    const share = `🪞 Curio Face Maker Copycat (${CC_LEVELS[lvl].label}): matched in ${t.toFixed(1)}s`;
    const v = await Curio.modal({ emoji: '🪞', title: isNew ? 'New best twin!' : 'Perfect match!', body: `${CC_LEVELS[lvl].label}: ${t.toFixed(1)}s${cc.penalty ? ` (incl. ${cc.penalty}s of hints)` : ''}. Best: ${stats.best[lvl].toFixed(1)}s.`, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Copy result', value: 'share' }, { label: 'Done', value: 'done' }] });
    endCopy();
    if (v === 'share') { try { await navigator.clipboard.writeText(share); Curio.toast('Result copied 📋'); } catch { Curio.toast(share, 3000); } }
    if (v === 'again') startCopy();
    renderStats();
  }
  function endCopy() {
    cc = null; $('cc').classList.remove('on');
    $('cats').querySelectorAll('.bad').forEach((d) => d.remove());
    setMode(false);
  }
  $('ccHint').addEventListener('click', () => { if (!cc || cc.hint) return; cc.hint = true; cc.penalty += 10; checkCopy(); Curio.beep(240, .1, 'sawtooth', .04); Curio.toast('Red dots mark the parts that are still wrong'); });
  $('ccQuit').addEventListener('click', endCopy);
  function setMode(copy) {
    $('mCreate').setAttribute('aria-pressed', String(!copy));
    $('mCopy').setAttribute('aria-pressed', String(copy));
    $('rand').disabled = copy;
  }
  $('mCreate').addEventListener('click', () => { if (cc) endCopy(); });
  $('mCopy').addEventListener('click', () => { if (!cc) startCopy(); });

  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'fm-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    renderStats();
  }
  function renderStats() {
    const parts = CATS.reduce((a, c) => a + Object.keys(c.set).length, 0);
    const best = ['easy', 'normal', 'hard'].map((l) => stats.best[l] ? `${stats.best[l].toFixed(1)}s` : 'none');
    $('stats').innerHTML = [[badges.length + '/' + BADGES.length, 'Stickers'], [parts, 'Parts'], [stats.rand, 'Randomizes'], [stats.wins, 'Copycat wins'], [best.join(' / '), 'Best E/N/H']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }

  const order = CATS.map((c) => c.k);
  addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === 'r') randomize();
    else if (k === 'z') undo();
    else if (k === 'y') redo();
    else if (k === 's') keep();
    else if (k === 'l') toggleLock();
    else if (k === 'arrowright' || k === 'arrowleft') {
      e.preventDefault();
      cat = order[(order.indexOf(cat) + (k === 'arrowright' ? 1 : order.length - 1)) % order.length];
      renderCats(); renderOpts(); Curio.beep(700, .03, 'sine', .04);
    } else if (k === 'arrowup' || k === 'arrowdown') {
      const c = CATS.find((x) => x.k === cat);
      if (c.multi || c.mood) return;
      e.preventDefault();
      const ks = keys(c.set), i = ks.indexOf(state[c.k]);
      set({ [c.k]: ks[(i + (k === 'arrowdown' ? 1 : ks.length - 1)) % ks.length] });
    }
  });

  setAlive(alive && !matchMedia('(prefers-reduced-motion: reduce)').matches);
  renderCats(); renderOpts(); paint(); renderGallery(); renderBadges(); syncUndo();
})();
