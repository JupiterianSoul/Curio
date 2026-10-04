(() => {
  const { W, H, clamp, mk, h } = HM.kit;
  const $ = (id) => document.getElementById(id);
  const ADV = Curio.advanced;
  const KEY = 'happy-mediums';
  const ORDER = ['chalk', 'water', 'ink', 'spray'];
  const LOADING = { chalk: 'Sweeping the pavement...', water: 'Taping down the paper...', ink: 'Grinding the ink stick...', spray: 'Finding a legal wall...' };
  const PROMPTS = [
    'A cat who is late for work', 'Your breakfast, but heroic', 'A lighthouse on a stormy night', 'Three fish having a meeting', 'A tree that grew in the wrong place',
    'The best sandwich ever made', 'A dragon at the dentist', 'Your street from a bird\'s eye', 'A robot learning to dance', 'A volcano made of ice cream',
    'Someone waving from a train', 'The moon eating a cookie', 'A tiny house on a huge mountain', 'A snail winning a race', 'Rain over a city',
    'A bicycle with too many wheels', 'A jellyfish in space', 'The view from your window', 'A crown for a frog', 'A forest at the end of autumn',
    'A sunflower that is very tired', 'Your favourite shoes', 'A whale in a bathtub', 'Fireworks over the sea', 'A cactus wearing a scarf',
    'A sleepy owl', 'The inside of a seashell', 'A pirate ship in a bottle', 'Two birds sharing a worm', 'A mountain at sunrise',
    'Your name, as big as you can', 'A kite stuck in a tree', 'A rocket made of cardboard', 'A dog who saw a ghost', 'A bowl of noodles',
    'A rainbow that went wrong', 'A haunted teacup', 'The last leaf on a branch', 'A garden on the roof', 'An octopus doing eight chores',
    'A bridge between two clouds', 'A penguin on holiday', 'Your hand, traced and decorated', 'A storm in a teacup', 'A fox in the snow',
    'The sun going to bed', 'A tiger made of stripes only', 'A map of an imaginary island', 'An umbrella for a mouse', 'A wave about to break',
    'A sheep that is mostly cloud', 'A ladder to the stars', 'A tortoise with a jetpack', 'A field of poppies', 'A monster who is shy',
    'Bamboo in the wind', 'A koi pond', 'A paper boat on a puddle', 'A spiral that never ends', 'The loudest colour you know',
    'A goldfish dreaming', 'An apple, with one bite', 'Your mood right now', 'A comet with a long tail', 'A city made of books'
  ];
  const CLIENTS = [
    ['Mrs Pemberton', 'retired lighthouse keeper'], ['Duke Fernsby', 'owns too many hats'], ['Little Ola', 'age seven, very serious'], ['Chef Rossi', 'opening a noodle bar'],
    ['Captain Vee', 'pirate, semi-retired'], ['Mr Bramble', 'runs the garden centre'], ['The Mayor', 'needs it by lunch'], ['Professor Quill', 'collects odd art'],
    ['Granny Moss', 'wants it for the fridge'], ['DJ Static', 'needs an album cover'], ['Ms Okafor', 'decorating a cafe'], ['Sir Reginald', 'a cat, technically']
  ];
  const TWISTS = [
    { id: 'colours', n: 3, text: 'Use 3 colours at most', mats: ['chalk', 'water', 'spray'] },
    { id: 'colours', n: 1, text: 'Use only one colour', mats: ['chalk', 'spray', 'water'] },
    { id: 'strokes', n: 12, text: 'In 12 strokes or fewer', mats: ['ink', 'water', 'chalk', 'spray'] },
    { id: 'strokes', n: 5, text: 'Five strokes. Not one more.', mats: ['ink'] },
    { id: 'none', text: 'No rules, just make it lovely', mats: ORDER }
  ];
  const REACT_GOOD = ['"I am getting it framed. Twice."', '"This is going straight above the fireplace."', '"I cried a little. In a good way."', '"Exactly what I pictured. Better, actually."', '"My cousin will be furious. Wonderful."'];
  const REACT_OK = ['"Interesting. I did say the rules, but I like it."', '"Not what I asked for, but I will allow it."', '"It is... bold. I respect bold."'];
  const REACT_LATE = ['"Late, but worth the wait. Mostly."', '"The clock ran out but the art did not."'];

  const mats = {};
  let cur = null, curId = Curio.store.get(KEY + ':medium', 'chalk');
  if (!ORDER.includes(curId)) curId = 'chalk';
  const cv = $('cv'), g = cv.getContext('2d');
  cv.width = W; cv.height = H;
  let presentNeeded = true, strokes = 0, drawing = false;

  HM.flag = (text, ms) => {
    const el = $('flag'); el.textContent = text || ''; el.classList.toggle('on', !!text);
    clearTimeout(HM.flagT); if (text && ms) HM.flagT = setTimeout(() => el.classList.remove('on'), ms);
  };
  HM.cursor = (c) => { cv.style.cursor = c; };

  const stats = Object.assign({ hung: 0, tried: {}, jobs: 0, tips: 0, best: 0 }, Curio.store.get(KEY + ':stats', {}));
  const saveStats = () => Curio.store.set(KEY + ':stats', stats);

  function docPoint(e) {
    const r = cv.getBoundingClientRect(); const pen = e.pointerType === 'pen' && e.pressure > 0;
    return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height, pr: pen ? e.pressure : null, t: e.timeStamp || performance.now() };
  }
  let unDrag = null;
  function bindDrag() {
    unDrag = Curio.drag(cv, {
      start: (p) => {
        if (!cur || drawing) return;
        p.event.preventDefault?.();
        const res = cur.down(docPoint(p.event));
        if (res === 'click') { setTimeout(() => { if (unDrag) unDrag(); cv.classList.remove('curio-latched'); bindDrag(); }, 0); return; }
        drawing = true; strokes++; hideHint(); checkStrokes();
      },
      move: (p) => {
        if (!cur || !drawing) return;
        const e = p.event; e.preventDefault?.();
        const list = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
        for (const ev of (list.length ? list : [e])) cur.move(docPoint(ev));
      },
      end: () => { if (!cur || !drawing) return; drawing = false; cur.up(); presentNeeded = true; }
    });
  }
  bindDrag();
  cv.addEventListener('pointermove', (e) => { if (cur && !drawing) cur.hover(docPoint(e)); });
  cv.addEventListener('pointerleave', () => { if (cur && !drawing) { cur.hover(null); presentNeeded = true; } });

  function hideHint() { $('hint').classList.remove('on'); }

  const tabs = $('tabs');
  ORDER.forEach((id, i) => {
    const b = h('button', 'hm-tab'); b.type = 'button'; b.dataset.m = id;
    const name = { chalk: 'Sidewalk Chalk', water: 'Watercolour', ink: 'Ink Painting', spray: 'Graffiti Wall' }[id];
    const surf = { chalk: 'pavement', water: 'cold-press paper', ink: 'rice paper', spray: 'brick wall' }[id];
    b.innerHTML = `<span class="hm-tab__art hm-art-${id}" aria-hidden="true"></span><span class="hm-tab__txt"><b>${name}</b><small>on ${surf}</small></span>`;
    b.title = `${name} (Alt+${i + 1})`;
    b.addEventListener('click', () => choose(id));
    tabs.append(b);
  });

  async function choose(id, quiet) {
    if (cur && cur.id === id) return;
    if (commission && commission.m !== id && !quiet) {
      const ok = await Curio.modal({ emoji: '🧑‍🎨', title: 'Leave the commission?', body: `${commission.client} asked for ${nameOf(commission.m)}. Switching walks away from the job.`, buttons: [{ label: 'Walk away', value: true }, { label: 'Stay', value: false }] });
      if (!ok) return;
      endCommission(false, true);
    }
    if (cur) { if (drawing) { drawing = false; cur.up(); } cur.pause(); }
    curId = id; Curio.store.set(KEY + ':medium', id);
    document.body.dataset.medium = id;
    tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === id)));
    const m = mats[id] || (mats[id] = HM.mats[id]());
    const veil = $('veil'); veil.textContent = LOADING[id]; veil.classList.add('on');
    await new Promise((r) => setTimeout(r, 30));
    m.init();
    cur = m; presentNeeded = true;
    veil.classList.remove('on');
    cv.setAttribute('aria-label', `${m.name} on ${m.surface.toLowerCase()}. Drag to ${m.verb}.`);
    HM.cursor('crosshair');
    buildPanel();
    if (!stats.tried[id]) { stats.tried[id] = 1; saveStats(); if (Object.keys(stats.tried).length === 4 && ADV) { Curio.toast('All four mediums tried. A true generalist.'); Curio.confetti(); } }
    if (!quiet) Curio.sfx && Curio.sfx('paper');
    cur.resume();
  }
  const nameOf = (id) => ({ chalk: 'sidewalk chalk', water: 'watercolour', ink: 'ink', spray: 'spray paint' }[id]);

  function buildPanel() {
    const host = $('tools'); host.textContent = '';
    cur.panel(host);
    $('tip').textContent = cur.tip;
    $('keys').textContent = ADV ? `Keys: ${cur.keys}, [ ] size, U undo.` : '';
  }

  async function clearArt() {
    if (!cur) return;
    const c = cur.clearCopy;
    const ok = await Curio.modal({ emoji: '🧽', title: c.title, body: c.body, buttons: [{ label: c.yes, value: true }, { label: c.no, value: false }] });
    if (ok) { cur.clear(); strokes = 0; presentNeeded = true; }
  }
  function undo() { if (!cur) return; if (cur.undo()) { presentNeeded = true; Curio.beep(330, .05, 'triangle', .07); } else Curio.toast('Nothing to undo'); }
  function fullCanvas() { const c = mk(), x = c.getContext('2d'); cur.draw(x, false); return c; }
  function download(canvas, name, msg) {
    canvas.toBlob((b) => {
      if (!b) return;
      const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name;
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      if (msg) Curio.toast(msg);
      Curio.beep(880, .08, 'triangle', .08);
    }, 'image/png');
  }
  function savePng() { if (!cur) return; download(fullCanvas(), `zoble-happy-mediums-${cur.id}.png`, cur.saveMsg); presentNeeded = true; }

  const gallery = () => { const g = Curio.store.get(KEY + ':gallery', []); return Array.isArray(g) ? g.filter((x) => x && x.img) : []; };
  function hang(extra) {
    if (!cur) return null;
    const full = fullCanvas(), t = mk(600, 400), x = t.getContext('2d');
    x.imageSmoothingQuality = 'high'; x.drawImage(full, 0, 0, 600, 400);
    let img = '';
    try { img = t.toDataURL('image/jpeg', .82); } catch { return null; }
    const item = Object.assign({ id: Date.now().toString(36), m: cur.id, title: prompt, when: Date.now(), img }, extra || {});
    let list = gallery(); list.unshift(item); list = list.slice(0, 16);
    Curio.store.set(KEY + ':gallery', list);
    if (Curio.store.get(KEY + ':gallery', []).length !== list.length) { list = list.slice(0, 8); Curio.store.set(KEY + ':gallery', list); }
    stats.hung++; saveStats(); paintCount(); paintLedger();
    presentNeeded = true;
    return item;
  }
  function hangClick() {
    const it = hang();
    if (!it) { Curio.toast('The gallery wall is full. Take something down first.'); return; }
    Curio.sfx && Curio.sfx('stamp');
    const b = $('galBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
    Curio.toast(`Hung in the gallery: "${it.title}"`);
  }
  function paintCount() { $('galN').textContent = gallery().length; }

  function openGallery() {
    const list = gallery();
    const box = $('gallery'), grid = $('galGrid');
    grid.textContent = '';
    $('galEmpty').hidden = list.length > 0;
    list.forEach((it) => {
      const b = h('button', 'hm-frame-item'); b.type = 'button';
      b.innerHTML = `<span class="hm-matte"><img alt=""></span><span class="hm-plaque"><b></b><small></small></span>`;
      b.querySelector('img').src = it.img;
      b.querySelector('img').alt = it.title;
      b.querySelector('b').textContent = it.title;
      b.querySelector('small').textContent = `${nameOf(it.m)}${it.client ? `, for ${it.client}` : ''}`;
      if (it.client) b.classList.add('is-job');
      b.addEventListener('click', () => openPiece(it));
      grid.append(b);
    });
    box.hidden = false; box.querySelector('.hm-close').focus();
    Curio.sfx && Curio.sfx('open');
  }
  function closeGallery() { $('gallery').hidden = true; $('piece').hidden = true; }
  function openPiece(it) {
    const p = $('piece');
    $('pieceImg').src = it.img; $('pieceImg').alt = it.title;
    $('pieceTitle').textContent = it.title;
    const d = new Date(it.when);
    $('pieceMeta').textContent = `${nameOf(it.m)}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}${it.client ? `. Commissioned by ${it.client}${it.fee ? `, paid ${it.fee} coins` : ''}` : ''}`;
    p.hidden = false; p.dataset.id = it.id;
    $('pieceDl').focus();
  }
  $('pieceDl').addEventListener('click', () => {
    const it = gallery().find((x) => x.id === $('piece').dataset.id); if (!it) return;
    const im = new Image();
    im.onload = () => { const c = mk(im.width, im.height); c.getContext('2d').drawImage(im, 0, 0); download(c, `zoble-${it.m}-${it.id}.png`, 'Downloaded'); };
    im.src = it.img;
  });
  $('pieceDel').addEventListener('click', () => {
    const id = $('piece').dataset.id;
    Curio.store.set(KEY + ':gallery', gallery().filter((x) => x.id !== id));
    $('piece').hidden = true; paintCount(); openGallery(); Curio.beep(240, .08, 'triangle', .06);
  });
  $('pieceBack').addEventListener('click', () => { $('piece').hidden = true; });
  document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeGallery));
  $('gallery').addEventListener('click', (e) => { if (e.target === $('gallery')) closeGallery(); });

  let prompt = Curio.store.get(KEY + ':prompt', '') || Curio.pick(PROMPTS);
  function setPrompt(p) { prompt = p; $('promptTxt').textContent = p; Curio.store.set(KEY + ':prompt', p); }
  function shuffle() {
    if (commission) { Curio.toast('Finish the commission first'); return; }
    let p = prompt; while (p === prompt) p = Curio.pick(PROMPTS);
    setPrompt(p);
    const el = $('promptTxt'); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    Curio.sfx && Curio.sfx('roll');
  }

  let commission = null, timerRaf = 0;
  async function startCommission() {
    if (commission) { deliver(); return; }
    const [client, about] = Curio.pick(CLIENTS);
    const m = Curio.pick(ORDER);
    const tw = Curio.pick(TWISTS.filter((t) => t.mats.includes(m)));
    const secs = tw.id === 'strokes' && tw.n <= 5 ? 90 : Curio.pick([120, 150, 180]);
    const brief = Curio.pick(PROMPTS);
    const ok = await Curio.modal({ emoji: '✉️', title: `A commission from ${client}`, body: `${client} (${about}) would like: "${brief}". In ${nameOf(m)}, within ${Math.round(secs / 60 * 10) / 10} minutes. Special request: ${tw.text.toLowerCase()}. You start on a fresh surface.`, buttons: [{ label: 'Take the job', value: true }, { label: 'Not today', value: false }] });
    if (!ok) return;
    await choose(m, true);
    cur.clear(); strokes = 0; presentNeeded = true;
    setPrompt(brief);
    commission = { client, m, tw, secs, end: performance.now() + secs * 1000, brief };
    document.body.classList.add('on-job');
    $('jobBtn').textContent = 'Deliver';
    $('jobInfo').textContent = `For ${client}: ${tw.text}`;
    Curio.sfx && Curio.sfx('on');
    tickTimer();
  }
  function tickTimer() {
    cancelAnimationFrame(timerRaf);
    if (!commission) { $('timer').style.width = '0'; return; }
    const left = Math.max(0, commission.end - performance.now()), k = left / (commission.secs * 1000);
    $('timer').style.width = `${k * 100}%`;
    $('timer').classList.toggle('late', k < .2);
    const s = Math.ceil(left / 1000);
    $('jobClock').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    if (left <= 0) { Curio.toast('Time! The client is at the door.'); deliver(true); return; }
    timerRaf = requestAnimationFrame(tickTimer);
  }
  function checkStrokes() {
    if (!commission || commission.tw.id !== 'strokes') return;
    const left = commission.tw.n - strokes;
    $('jobInfo').textContent = `For ${commission.client}: ${left >= 0 ? `${left} stroke${left === 1 ? '' : 's'} left` : 'over the stroke limit'}`;
  }
  function ruleKept() {
    const t = commission.tw;
    if (t.id === 'colours') return cur.used <= t.n;
    if (t.id === 'strokes') return strokes <= t.n;
    return true;
  }
  function deliver(late) {
    if (!commission) return;
    if (strokes === 0) { Curio.toast('The client peers at the blank surface. Paint something first!'); if (!late) return; }
    const c = commission, kept = ruleKept(), left = Math.max(0, (c.end - performance.now()) / 1000);
    const fee = strokes === 0 ? 0 : 20 + (kept ? 15 : 0) + Math.round(left / 6);
    const it = strokes ? hang({ client: c.client, fee, title: c.brief }) : null;
    endCommission(true);
    stats.jobs += strokes ? 1 : 0; stats.tips += fee; stats.best = Math.max(stats.best, fee); saveStats(); paintLedger();
    const line = !strokes ? '"Is this... conceptual?"' : late ? Curio.pick(REACT_LATE) : kept ? Curio.pick(REACT_GOOD) : Curio.pick(REACT_OK);
    if (kept && strokes && !late) Curio.confetti();
    Curio.sfx && Curio.sfx(strokes ? 'success' : 'error');
    Curio.modal({ emoji: strokes ? (kept ? '🖼️' : '🤔') : '😶', title: strokes ? `Delivered to ${c.client}` : 'Nothing delivered', body: `${line}${strokes ? ` Fee: ${fee} coins${kept ? ' (rule kept, +15)' : ' (rule broken, no bonus)'}${left > 0 ? `, plus ${Math.round(left / 6)} for being early` : ''}. ${it ? 'It is hanging in your gallery now.' : ''}` : ''}`, buttons: [{ label: 'Next job', value: 'next' }, { label: 'Back to the easel', value: 'easel' }] }).then((v) => { if (v === 'next') startCommission(); });
  }
  function endCommission() {
    commission = null; cancelAnimationFrame(timerRaf);
    document.body.classList.remove('on-job');
    $('timer').style.width = '0';
    if ($('jobBtn')) $('jobBtn').textContent = 'Take a commission';
    $('jobInfo').textContent = ''; $('jobClock').textContent = '';
  }
  function paintLedger() {
    const el = $('ledger'); if (!el) return;
    el.innerHTML = `<div class="c-stat"><b>${stats.hung}</b><span>Hung</span></div><div class="c-stat"><b>${stats.jobs}</b><span>Commissions</span></div><div class="c-stat"><b>${stats.tips}</b><span>Coins earned</span></div><div class="c-stat"><b>${Object.keys(stats.tried).length}/4</b><span>Mediums</span></div>`;
  }

  $('shuffle').addEventListener('click', shuffle);
  $('undo').addEventListener('click', undo);
  $('clear').addEventListener('click', clearArt);
  $('save').addEventListener('click', savePng);
  $('hang').addEventListener('click', hangClick);
  $('galBtn').addEventListener('click', openGallery);
  if ($('jobBtn')) $('jobBtn').addEventListener('click', startCommission);
  if (!ADV) { $('jobBtn')?.remove(); $('ledgerBox')?.remove(); }

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input, textarea')) return;
    if (!$('gallery').hidden) { if (e.key === 'Escape') { if (!$('piece').hidden) $('piece').hidden = true; else closeGallery(); } return; }
    if (document.querySelector('.curio-modal')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return; }
    if (e.altKey && '1234'.includes(e.key)) { e.preventDefault(); choose(ORDER[+e.key - 1]); return; }
    if (e.ctrlKey || e.metaKey || e.altKey || !cur) return;
    const k = e.key.toLowerCase();
    if (k === '[') { cur.resize(-1); presentNeeded = true; return; }
    if (k === ']') { cur.resize(1); presentNeeded = true; return; }
    if (k === 'u') { undo(); return; }
    if (k === 'p' && !commission) { shuffle(); return; }
    if (k === 'g') { openGallery(); return; }
    if (cur.key(k, e)) { e.preventDefault(); presentNeeded = true; }
  });
  document.addEventListener('visibilitychange', () => { if (!cur) return; if (document.hidden) cur.pause(); else cur.resume(); });

  let lastT = performance.now(), badgeShown = null;
  function loop(t) {
    const dt = Math.min(.05, (t - lastT) / 1000); lastT = t;
    if (!document.hidden && cur) {
      const need = cur.frame(dt, t);
      if (need || presentNeeded) { cur.draw(g, true); presentNeeded = false; }
      const b = cur.badge || '';
      if (b !== badgeShown) { badgeShown = b; const el = $('badge'); el.textContent = b; el.classList.toggle('on', !!b); el.dataset.state = b.toLowerCase().replace(/\s+/g, '-'); }
    }
    requestAnimationFrame(loop);
  }

  setPrompt(prompt);
  paintCount(); paintLedger();
  choose(curId, true).then(() => {
    requestAnimationFrame(loop);
    if (!Curio.touchpad && !Curio.store.get('tp-hint-happy-mediums', false) && matchMedia('(pointer: fine)').matches) { Curio.store.set('tp-hint-happy-mediums', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar: click to touch down, click again to lift', 4200), 1800); }
  });
  addEventListener('curio:touchpad', (e) => { if (e.detail) Curio.toast('Touchpad mode: click the surface to start, move to draw, click again to lift', 3600); });
  HM.debug = { get cur() { return cur; }, choose, hang, gallery, startCommission, deliver, get strokes() { return strokes; } };
})();
