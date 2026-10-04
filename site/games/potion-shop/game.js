(() => {
  const D = window.PS_DATA;
  const C = window.Curio;
  const adv = C.advanced;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  const BASES = D.bases.map(([id, name, color, desc, cost]) => ({ id, name, color, desc, cost: cost || 0, base: true }));
  const ITEMS = {};
  BASES.forEach((b) => { ITEMS[b.id] = b; });
  Object.entries(D.items).forEach(([id, [name, color, desc, tag]]) => { ITEMS[id] = { id, name, color, desc, tag }; });
  const RECIPE = new Map();
  const MAKES = {};
  D.recipes.forEach((r) => {
    const [l, out] = r.split('=');
    const [a, b] = l.split('+');
    RECIPE.set([a, b].sort().join('+'), out);
    MAKES[out] = [a, b];
  });
  const SIMPLE_BASES = ['water', 'ember', 'shroom', 'feather', 'honey'];
  const reachable = (bases) => {
    const have = new Set([...bases, 'sludge']);
    let grew = true;
    while (grew) {
      grew = false;
      for (const [k, out] of RECIPE) { const [a, b] = k.split('+'); if (have.has(a) && have.has(b) && !have.has(out)) { have.add(out); grew = true; } }
    }
    return have;
  };
  const POOL = [...reachable(adv ? BASES.map((b) => b.id) : SIMPLE_BASES)].filter((id) => !ITEMS[id].base);
  const TOTAL = POOL.length;

  const FKEY = `ps:found:${C.mode}`;
  const found = new Set(C.store.get(FKEY, []).filter((id) => ITEMS[id] && !ITEMS[id].base));
  const recipeSeen = C.store.get(`ps:how:${C.mode}`, {});
  const fresh = new Set();

  const RUNKEY = 'ps:run:v1';
  const newRun = () => ({ day: 1, served: 0, coins: 0, stars: 5, scrolls: 3, unlocked: SIMPLE_BASES.slice(), patience: 0, tips: 0, earned: 0, dayCoins: 0, dayServed: 0, dayLost: 0 });
  let run = adv ? Object.assign(newRun(), C.store.get(RUNKEY, {})) : newRun();
  const PER_DAY = adv ? 6 : 5;
  const saveRun = () => { if (adv) C.store.set(RUNKEY, run); };

  const els = {
    shop: $('#shop'), grid: $('#grid'), slotA: $('#slotA'), slotB: $('#slotB'), cauldron: $('#cauldron'), result: $('#result'),
    folk: $('#folk'), askName: $('#askName'), askText: $('#askText'), askHint: $('#askHint'), giveBtn: $('#giveBtn'), hintBtn: $('#hintBtn'),
    patience: $('#patience'), tabIng: $('#tabIng'), tabPot: $('#tabPot'), search: $('#search'), counter: $('#counter')
  };
  let slots = [null, null];
  let tab = 'ing';
  let giving = false;
  let brewing = false;
  let customer = null;
  let lastBrew = null;
  let shiftOver = false;
  let tick = { raf: 0, last: 0 };

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  defs.setAttribute('width', '0'); defs.setAttribute('height', '0');
  defs.setAttribute('aria-hidden', 'true');
  defs.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  defs.innerHTML = '<defs></defs>';
  document.body.append(defs);
  const made = new Set();
  function grad(id, color) {
    if (made.has(id)) return `psg-${id}`;
    made.add(id);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    g.id = `psg-${id}`; g.setAttribute('x1', '0'); g.setAttribute('y1', '0'); g.setAttribute('x2', '0'); g.setAttribute('y2', '1');
    g.innerHTML = `<stop offset="0" stop-color="#ffffff" stop-opacity=".18"/><stop offset=".42" stop-color="#ffffff" stop-opacity=".18"/><stop offset=".42" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.35)}"/>`;
    defs.firstChild.append(g);
    return g.id;
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, p = Math.abs(f);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
  const SHAPES = [
    'M20 4h8v12c8 3 13 10 13 18 0 10-8 16-17 16S7 44 7 34c0-8 5-15 13-18z',
    'M17 6h14v8c3 1 4 3 4 6v24c0 4-3 6-6 6H19c-3 0-6-2-6-6V20c0-3 1-5 4-6z',
    'M16 8h16v6h4c3 0 5 2 5 5v25c0 3-2 6-5 6H12c-3 0-5-3-5-6V19c0-3 2-5 5-5h4z',
    'M19 4h10v14l11 24c2 5-1 8-6 8H14c-5 0-8-3-6-8l11-24z'
  ];
  function bottle(id) {
    const it = ITEMS[id];
    const shape = SHAPES[hash(id) % SHAPES.length];
    const corkY = 1;
    return `<svg viewBox="0 0 48 52" aria-hidden="true"><path d="${shape}" fill="url(#${grad(id, it.color)})" stroke="#120d1a" stroke-width="2.4" stroke-linejoin="round"/><rect x="18.5" y="${corkY}" width="11" height="7" rx="2" fill="#b07a4a" stroke="#120d1a" stroke-width="2"/><path d="M14 26c-1 4-1 9 1 13" stroke="#fff" stroke-opacity=".55" stroke-width="2.6" fill="none" stroke-linecap="round"/>${id === 'sludge' || id === 'slime' ? '<circle cx="21" cy="36" r="2.4" fill="#120d1a"/><circle cx="29" cy="36" r="2.4" fill="#120d1a"/>' : '<circle cx="30" cy="34" r="1.6" fill="#fff" fill-opacity=".7"/><circle cx="25" cy="40" r="1.1" fill="#fff" fill-opacity=".6"/>'}</svg>`;
  }
  const ICON = {
    water: (c) => `<path d="M24 4C18 16 10 24 10 33a14 14 0 0 0 28 0c0-9-8-17-14-29z" fill="${c}" stroke="#120d1a" stroke-width="2.4"/><path d="M17 33c0 4 2 7 5 8" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/><path d="M30 12l3-4 1 4" stroke="#fff" stroke-width="1.6" fill="none" opacity=".7"/>`,
    ember: (c) => `<ellipse cx="24" cy="44" rx="14" ry="5" fill="#3a2a2a"/><path d="M24 4c3 10 14 14 14 26a14 14 0 0 1-28 0c0-7 4-10 6-15 2 5 4 7 6 7-2-6 0-12 2-18z" fill="${c}" stroke="#120d1a" stroke-width="2.4"/><path d="M24 22c2 5 7 7 7 13a7 7 0 0 1-14 0c0-4 3-6 4-9 1 2 2 3 3 3z" fill="#ffe28a"/>`,
    shroom: (c) => `<path d="M19 30h10l2 16c0 3-14 3-14 0z" fill="#f6ead2" stroke="#120d1a" stroke-width="2.4"/><path d="M5 30C5 16 14 8 24 8s19 8 19 22z" fill="${c}" stroke="#120d1a" stroke-width="2.4"/><circle cx="16" cy="20" r="3" fill="#fff"/><circle cx="28" cy="15" r="2.6" fill="#fff"/><circle cx="33" cy="24" r="3" fill="#fff"/><circle cx="22" cy="26" r="2" fill="#fff"/>`,
    feather: (c) => `<path d="M36 4C22 8 12 20 12 36l2 6c10-2 22-12 24-30z" fill="${c}" stroke="#120d1a" stroke-width="2.4"/><path d="M36 6L10 48" stroke="#120d1a" stroke-width="2.2" stroke-linecap="round"/><path d="M18 30l8-2M22 22l8-2M26 16l6-2" stroke="#9a8fc4" stroke-width="1.8"/>`,
    honey: (c) => `<rect x="10" y="14" width="28" height="32" rx="8" fill="${c}" stroke="#120d1a" stroke-width="2.4"/><rect x="12" y="6" width="24" height="9" rx="3" fill="#b07a4a" stroke="#120d1a" stroke-width="2.2"/><path d="M14 15c2 6 6 6 7 0 2 8 6 8 8 0 1 5 5 5 6 0" fill="${c}" stroke="#120d1a" stroke-width="1.6"/><rect x="16" y="26" width="16" height="10" rx="2" fill="#fff6d8" stroke="#120d1a" stroke-width="1.6"/>`,
    frost: (c) => `<g stroke="${c}" stroke-width="4" stroke-linecap="round"><path d="M24 4v44M5 15l38 22M5 37l38-22"/></g><g stroke="#120d1a" stroke-width="1.4" fill="none" opacity=".7"><path d="M19 9l5 5 5-5M19 43l5-5 5 5M8 22l7 1-2-7M40 22l-7 1 2-7M8 30l7-1-2 7M40 30l-7-1 2 7"/></g><circle cx="24" cy="26" r="4" fill="#fff"/>`,
    thorn: (c) => `<path d="M10 46C16 30 26 20 40 6" stroke="#4a3020" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M18 33l-6-3M24 25l6 2M29 19l-5-5M34 13l5 2" stroke="#4a3020" stroke-width="3" stroke-linecap="round"/><path d="M30 22c6-4 12-2 12 4-6 2-10 0-12-4zM16 36c-6-2-10 2-8 7 6 0 8-3 8-7z" fill="${c}" stroke="#120d1a" stroke-width="2"/>`,
    star: (c) => `<path d="M24 4l5 14 15 1-12 9 4 15-12-9-12 9 4-15-12-9 15-1z" fill="${c}" stroke="#120d1a" stroke-width="2.4" stroke-linejoin="round"/><circle cx="40" cy="40" r="2.5" fill="#fff"/><circle cx="8" cy="42" r="1.8" fill="#fff"/><circle cx="38" cy="8" r="1.5" fill="#fff"/>`
  };
  const art = (id) => ITEMS[id].base ? `<svg viewBox="0 0 48 52" aria-hidden="true">${ICON[id](ITEMS[id].color)}</svg>` : bottle(id);

  function portrait(type, color, mood = 'ok') {
    const skin = { goblin: '#8fbf5a', frog: '#6cc24a', ghost: '#eef1ff' }[type] || ['#f2c9a0', '#d9a066', '#a8714a', '#7a4e2d'][hash(color) % 4];
    const mouth = mood === 'happy' ? '<path d="M40 74q10 9 20 0" fill="#5a2a2a" stroke="#120d1a" stroke-width="2.5"/>' : mood === 'cross' ? '<path d="M40 77q10-7 20 0" fill="none" stroke="#120d1a" stroke-width="3" stroke-linecap="round"/>' : '<path d="M42 74q8 4 16 0" fill="none" stroke="#120d1a" stroke-width="3" stroke-linecap="round"/>';
    const brows = mood === 'cross' ? '<path d="M34 52l10 4M66 52l-10 4" stroke="#120d1a" stroke-width="3" stroke-linecap="round"/>' : '';
    const eyes = type === 'frog' ? '<circle cx="36" cy="40" r="10" fill="#6cc24a" stroke="#120d1a" stroke-width="2.5"/><circle cx="64" cy="40" r="10" fill="#6cc24a" stroke="#120d1a" stroke-width="2.5"/><circle cx="36" cy="40" r="5" fill="#120d1a"/><circle cx="64" cy="40" r="5" fill="#120d1a"/>' : '<circle cx="40" cy="60" r="3.6" fill="#120d1a"/><circle cx="60" cy="60" r="3.6" fill="#120d1a"/><circle cx="41" cy="59" r="1.1" fill="#fff"/><circle cx="61" cy="59" r="1.1" fill="#fff"/>';
    const body = type === 'ghost'
      ? `<path d="M18 112V58a32 32 0 0 1 64 0v54l-8-8-8 8-8-8-8 8-8-8-8 8-8-8z" fill="${skin}" stroke="#120d1a" stroke-width="3"/>`
      : `<path d="M14 115c2-22 16-32 36-32s34 10 36 32z" fill="${color}" stroke="#120d1a" stroke-width="3"/><circle cx="50" cy="60" r="${type === 'frog' ? 26 : 24}" fill="${skin}" stroke="#120d1a" stroke-width="3"/>`;
    const extra = {
      knight: `<path d="M24 62c0-20 12-32 26-32s26 12 26 32v-6H24z" fill="#aab4c3" stroke="#120d1a" stroke-width="3"/><path d="M50 22v10" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`,
      granny: `<circle cx="50" cy="32" r="11" fill="#d9d9e3" stroke="#120d1a" stroke-width="2.5"/><path d="M27 58c0-16 10-24 23-24s23 8 23 24c-6-8-16-12-23-12s-17 4-23 12z" fill="#d9d9e3" stroke="#120d1a" stroke-width="2.5"/><circle cx="40" cy="60" r="7" fill="none" stroke="#120d1a" stroke-width="2"/><circle cx="60" cy="60" r="7" fill="none" stroke="#120d1a" stroke-width="2"/>`,
      goblin: `<path d="M27 56L6 44l20 2zM73 56l21-12-20 2z" fill="${skin}" stroke="#120d1a" stroke-width="2.5" stroke-linejoin="round"/><path d="M47 66l3 6 3-6" fill="none" stroke="#120d1a" stroke-width="2"/>`,
      noble: `<path d="M32 40l4-16 8 10 6-14 6 14 8-10 4 16z" fill="#ffcf3a" stroke="#120d1a" stroke-width="2.5" stroke-linejoin="round"/><circle cx="50" cy="34" r="2.5" fill="${color}"/>`,
      farmer: `<ellipse cx="50" cy="42" rx="36" ry="8" fill="#e9c46a" stroke="#120d1a" stroke-width="2.5"/><path d="M32 42c0-14 8-20 18-20s18 6 18 20z" fill="#e9c46a" stroke="#120d1a" stroke-width="2.5"/><path d="M32 38h36" stroke="${color}" stroke-width="4"/>`,
      witch: `<ellipse cx="50" cy="42" rx="34" ry="7" fill="#2b2140" stroke="#120d1a" stroke-width="2.5"/><path d="M34 42l14-38 4 6 14 32z" fill="#2b2140" stroke="#120d1a" stroke-width="2.5" stroke-linejoin="round"/><path d="M36 38h28" stroke="${color}" stroke-width="5"/>`,
      pirate: `<path d="M20 44c10-22 50-22 60 0-10-6-50-6-60 0z" fill="#2b2b2b" stroke="#120d1a" stroke-width="2.5"/><circle cx="50" cy="32" r="4" fill="#fff"/><path d="M33 56h14M54 60l14-4" stroke="#120d1a" stroke-width="2"/><circle cx="60" cy="60" r="6" fill="#120d1a"/>`,
      monk: `<path d="M22 72c-2-30 10-46 28-46s30 16 28 46c-4-14-14-24-28-24S26 58 22 72z" fill="${color}" stroke="#120d1a" stroke-width="2.5"/>`,
      ghost: '',
      frog: `<path d="M38 84c4 4 20 4 24 0" fill="none" stroke="#120d1a" stroke-width="2"/>`
    }[type] || '';
    return `<svg viewBox="0 0 100 115">${body}${type === 'ghost' ? '' : ''}${extra}${eyes}${brows}${mouth}${type === 'frog' || type === 'goblin' ? '' : '<circle cx="32" cy="68" r="4" fill="#ff8fab" opacity=".45"/><circle cx="68" cy="68" r="4" fill="#ff8fab" opacity=".45"/>'}</svg>`;
  }

  function sound(kind) {
    if (C.muted) return;
    const ac = C.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    const tone = (f, d, type = 'sine', v = 0.1, when = 0, to = 0) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t + when);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + when + d);
      g.gain.setValueAtTime(0.0001, t + when); g.gain.exponentialRampToValueAtTime(v, t + when + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + when + d);
      o.connect(g).connect(ac.destination); o.start(t + when); o.stop(t + when + d + 0.05);
    };
    if (kind === 'plop') { tone(300 + Math.random() * 120, 0.12, 'sine', 0.14, 0, 900); }
    else if (kind === 'bubble') { for (let i = 0; i < 6; i++) tone(180 + Math.random() * 300, 0.09, 'sine', 0.06, i * 0.09 + Math.random() * 0.04, 700 + Math.random() * 400); }
    else if (kind === 'new') { [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.35, 'triangle', 0.07, i * 0.07)); tone(2093, 0.5, 'sine', 0.03, 0.35); }
    else if (kind === 'known') { tone(659, 0.2, 'triangle', 0.08); tone(880, 0.25, 'triangle', 0.07, 0.08); }
    else if (kind === 'sludge') { tone(160, 0.35, 'sawtooth', 0.05, 0, 60); tone(110, 0.3, 'sine', 0.12, 0.08, 50); }
    else if (kind === 'coin') { tone(1568, 0.08, 'square', 0.04); tone(2093, 0.25, 'square', 0.04, 0.07); }
    else if (kind === 'door') { tone(880, 0.25, 'sine', 0.06); tone(1175, 0.4, 'sine', 0.05, 0.12); }
    else if (kind === 'huff') { tone(220, 0.18, 'square', 0.04, 0, 140); tone(180, 0.22, 'square', 0.04, 0.12, 110); }
  }

  const haveSet = () => new Set([...run.unlocked, ...found, ...(adv ? [] : SIMPLE_BASES)]);

  function pickTarget() {
    const have = haveSet();
    const one = [];
    const two = [];
    for (const [k, out] of RECIPE) {
      if (out === 'slime' || !POOL.includes(out)) continue;
      const [a, b] = k.split('+');
      if (have.has(a) && have.has(b)) one.push(out);
    }
    const oneSet = new Set([...one, ...have]);
    if (adv) for (const [k, out] of RECIPE) {
      if (out === 'slime' || have.has(out) || one.includes(out) || !POOL.includes(out)) continue;
      const [a, b] = k.split('+');
      if (oneSet.has(a) && oneSet.has(b)) two.push(out);
    }
    const recent = new Set((customer && customer.recent) || []);
    const weighted = [];
    one.forEach((o) => { if (recent.has(o)) return; const w = found.has(o) ? 1 : 4; for (let i = 0; i < w; i++) weighted.push([o, 1]); });
    two.forEach((o) => { if (recent.has(o)) return; const w = Math.min(4, run.day); for (let i = 0; i < w; i++) weighted.push([o, 2]); });
    if (!weighted.length) return [C.pick(one.length ? one : POOL.filter((p) => have.has(p))), 1];
    return C.pick(weighted);
  }

  function nextCustomer() {
    if (shiftOver) return;
    const [want, depth] = pickTarget();
    const [name, type, color] = C.pick(D.folk);
    const recent = [...((customer && customer.recent) || []), want].slice(-6);
    const base = adv ? 70 + run.patience * 20 - Math.min(25, (run.day - 1) * 4) : 0;
    customer = { name, type, color, want, depth, tries: 0, clue: 0, recent, patience: base, max: base, gone: false };
    els.folk.innerHTML = portrait(type, color);
    els.folk.className = 'ps-folk';
    void els.folk.offsetWidth;
    els.folk.classList.add('is-in');
    els.askName.textContent = name;
    els.askText.textContent = D.asks[want] || `I would like a ${ITEMS[want].name}, please.`;
    els.askHint.textContent = '';
    els.giveBtn.disabled = false; els.hintBtn.disabled = false;
    setGiving(false);
    sound('door');
    hud();
    if (adv) { tick.last = performance.now(); cancelAnimationFrame(tick.raf); tick.raf = requestAnimationFrame(loop); }
  }

  function loop(now) {
    const dt = Math.max(0, Math.min(0.1, (now - tick.last) / 1000));
    tick.last = now;
    if (customer && !customer.gone && !document.hidden && !brewing) {
      customer.patience -= dt;
      const f = Math.max(0, customer.patience / customer.max);
      els.patience.style.transform = `scaleX(${f})`;
      els.patience.classList.toggle('is-low', f < 0.25);
      if (customer.patience <= 0) { leave('timeout'); return; }
    }
    if (customer && !customer.gone) tick.raf = requestAnimationFrame(loop);
  }

  function hud() {
    $('#coins').textContent = C.fmt(run.coins);
    $('#foundCount').textContent = `${found.size}/${TOTAL}`;
    $('#potCount').textContent = found.size;
    if (adv) {
      $('#stars').textContent = '★'.repeat(run.stars) + '☆'.repeat(Math.max(0, 5 - run.stars));
      $('#scrolls').textContent = run.scrolls;
      $('#dayLabel').textContent = `${run.day} · ${Math.min(PER_DAY, run.dayServed + 1)}/${PER_DAY}`;
      $('#dayLabelName').textContent = 'Night · guest';
    } else {
      $('#dayLabel').textContent = `${Math.min(PER_DAY, run.served + 1)}/${PER_DAY}`;
    }
  }

  function renderGrid() {
    const q = els.search.value.trim().toLowerCase();
    let ids;
    if (tab === 'ing') ids = (adv ? BASES : BASES.filter((b) => SIMPLE_BASES.includes(b.id))).map((b) => b.id);
    else ids = [...found].filter((id) => !q || ITEMS[id].name.toLowerCase().includes(q)).sort((a, b) => ITEMS[a].name.localeCompare(ITEMS[b].name));
    if (!ids.length) { els.grid.innerHTML = `<p class="ps-empty">${tab === 'pot' && !found.size ? 'No potions yet. Brew something!' : 'Nothing by that name.'}</p>`; return; }
    els.grid.innerHTML = ids.map((id, i) => {
      const it = ITEMS[id];
      const locked = it.base && adv && !run.unlocked.includes(id);
      return `<button type="button" class="ps-item${it.base ? ' is-base' : ''}${locked ? ' is-locked' : ''}${fresh.has(id) ? ' is-fresh' : ''}" data-id="${id}" title="${esc(it.desc)}" aria-label="${esc(it.name)}${locked ? ', locked' : ''}">${tab === 'ing' ? `<i>${i + 1}</i>` : ''}${art(id)}<span>${esc(it.name)}</span></button>`;
    }).join('');
  }

  function setTab(t) {
    tab = t;
    els.tabIng.setAttribute('aria-selected', String(t === 'ing'));
    els.tabPot.setAttribute('aria-selected', String(t === 'pot'));
    els.search.hidden = t !== 'pot' || found.size < 12;
    if (t === 'pot') fresh.clear();
    renderGrid();
  }

  function renderSlots() {
    [els.slotA, els.slotB].forEach((el, i) => {
      const id = slots[i];
      el.classList.toggle('is-full', !!id);
      el.innerHTML = id ? `${art(id)}<small>${esc(ITEMS[id].name)}</small>` : '';
      el.setAttribute('aria-label', id ? `Slot ${i + 1}: ${ITEMS[id].name}. Tap to take it out.` : `Slot ${i + 1}, empty`);
    });
  }

  function addToPot(id) {
    if (brewing) return;
    const it = ITEMS[id];
    if (it.base && adv && !run.unlocked.includes(id)) { openStore(); return; }
    const i = slots[0] == null ? 0 : slots[1] == null ? 1 : -1;
    if (i < 0) return;
    slots[i] = id;
    renderSlots();
    sound('plop');
    buzz(8);
    if (slots[0] && slots[1]) brew();
  }

  function brew() {
    brewing = true;
    const [a, b] = slots;
    els.cauldron.classList.remove('is-boom');
    els.cauldron.classList.add('is-stir');
    sound('bubble');
    document.documentElement.style.setProperty('--ps-liquid', ITEMS[a].color);
    setTimeout(() => {
      const out = RECIPE.get([a, b].sort().join('+')) || 'sludge';
      const isNew = !found.has(out);
      els.cauldron.classList.remove('is-stir');
      void els.cauldron.offsetWidth;
      els.cauldron.classList.add('is-boom');
      document.documentElement.style.setProperty('--ps-liquid', ITEMS[out].color);
      if (isNew) {
        found.add(out);
        fresh.add(out);
        C.store.set(FKEY, [...found]);
        recipeSeen[out] = [a, b];
        C.store.set(`ps:how:${C.mode}`, recipeSeen);
      }
      lastBrew = out;
      if (out === 'sludge') { sound('sludge'); buzz([20, 30, 20]); }
      else if (isNew) { sound('new'); buzz(30); if (found.size % 10 === 0) C.confetti(60); }
      else sound('known');
      showResult(out, isNew, a, b);
      slots = [null, null];
      renderSlots();
      brewing = false;
      hud();
      if (tab === 'pot' || isNew) renderGrid();
      if (found.size === TOTAL && isNew) { C.confetti(); C.toast('Every potion discovered. You are the Grand Alchemist!', 3000); }
    }, C.calm ? 250 : 1000);
  }

  function showResult(out, isNew, a, b) {
    const it = ITEMS[out];
    const canGive = customer && !customer.gone && out !== 'sludge';
    els.result.innerHTML = `<div class="ps-card">${art(out)}<div><b>${esc(it.name)}</b>${isNew ? '<span class="ps-new">New!</span>' : ''}<p>${esc(it.desc)}</p><p class="ps-recipe">${esc(ITEMS[a].name)} + ${esc(ITEMS[b].name)}</p>${canGive ? `<button type="button" class="ps-btn ps-btn--gold" data-give="${out}">Hand it to ${esc(customer.name)}</button>` : ''}</div></div>`;
  }

  function setGiving(on) {
    giving = on && !!customer && !customer.gone;
    els.giveBtn.setAttribute('aria-pressed', String(giving));
    els.shop.classList.toggle('is-giving', giving);
    els.giveBtn.firstChild.textContent = giving ? 'Pick a bottle... ' : 'Give a potion ';
    if (giving) { setTab('pot'); if (!found.size) C.toast('You have not brewed anything yet!'); }
  }

  function give(id) {
    if (!customer || customer.gone) return;
    setGiving(false);
    const want = customer.want;
    const close = ITEMS[id].tag === ITEMS[want].tag;
    if (id === want) {
      const tip = adv ? Math.round(Math.max(0, customer.patience / customer.max) * (6 + run.tips * 6)) : 0;
      const pay = (adv ? 8 + customer.depth * 7 : 10) + (customer.clue ? 0 : 5) + tip;
      payOut(pay, `${C.pick(['Perfect!', 'Exactly what I needed!', 'Marvellous!', 'You are a genius!', 'It is beautiful.'])} Here is ${pay} coins${tip ? `, tip included` : ''}.`, 'happy');
      return;
    }
    customer.tries++;
    if (adv) {
      if (close) { const pay = 4 + customer.depth * 2; payOut(pay, `Not quite ${ITEMS[want].name}, but close enough. ${pay} coins.`, 'ok'); }
      else { run.stars--; run.dayLost++; mood('cross'); say(`${ITEMS[id].name}?! I asked for something else entirely. Good DAY.`); sound('huff'); buzz([40, 30, 40]); leave('angry'); }
      return;
    }
    mood('cross');
    sound('huff');
    say(`${ITEMS[id].name}? ${close ? 'Close, but not quite.' : 'That is not it at all.'} ${D.asks[want] || ''}`);
    if (customer.tries >= 2) clue(true);
    setTimeout(() => { if (customer && !customer.gone) mood('ok'); }, 1300);
  }

  function say(t) { els.askText.textContent = t; }
  function mood(m) {
    if (!customer) return;
    els.folk.innerHTML = portrait(customer.type, customer.color, m);
    els.folk.classList.remove('is-in', 'is-happy', 'is-cross');
    void els.folk.offsetWidth;
    if (m === 'happy') els.folk.classList.add('is-happy');
    if (m === 'cross') els.folk.classList.add('is-cross');
  }

  function payOut(pay, line, m) {
    run.coins += pay; run.earned += pay; run.dayCoins += pay;
    mood(m);
    say(line);
    sound('coin');
    if (m === 'happy') { C.sfx('success'); buzz(25); }
    const pop = document.createElement('span');
    pop.className = 'ps-coinpop';
    pop.textContent = `+${pay}`;
    pop.style.left = '70px'; pop.style.top = '20px';
    els.counter.append(pop);
    setTimeout(() => pop.remove(), 1200);
    leave('paid');
  }

  function leave(why) {
    if (!customer || customer.gone) return;
    customer.gone = true;
    cancelAnimationFrame(tick.raf);
    els.giveBtn.disabled = true; els.hintBtn.disabled = true;
    setGiving(false);
    if (why === 'timeout') { run.stars--; run.dayLost++; mood('cross'); say('I have waited long enough. Hmph.'); sound('huff'); }
    run.served++; run.dayServed++;
    hud();
    saveRun();
    const card = els.result.querySelector('[data-give]');
    if (card) card.remove();
    setTimeout(afterCustomer, C.calm ? 600 : 1500);
  }

  function afterCustomer() {
    if (adv && run.stars <= 0) return closeShop();
    if (adv ? run.dayServed >= PER_DAY : run.served >= PER_DAY) return adv ? endDay() : endShift();
    nextCustomer();
  }

  function clue(auto) {
    if (!customer || customer.gone) return;
    const [a, b] = MAKES[customer.want];
    if (customer.clue >= 2) { C.toast('That is every clue I have!'); return; }
    if (adv && !auto) {
      if (run.scrolls <= 0) { if (run.coins >= 5) { run.coins -= 5; C.toast('Bought a clue for 5 coins'); } else { C.toast('No hint scrolls and no coins for one.'); return; } }
      else run.scrolls--;
    }
    customer.clue++;
    const known = (x) => ITEMS[x].base || found.has(x);
    const nm = (x) => known(x) ? ITEMS[x].name : `something made from ${ITEMS[MAKES[x][0]].name} and ${ITEMS[MAKES[x][1]].name}`;
    els.askHint.textContent = customer.clue === 1 ? `Clue: it needs ${nm(a)}...` : `Clue: ${nm(a)} + ${nm(b)}.`;
    C.sfx('paper');
    hud();
    saveRun();
  }

  async function endShift() {
    shiftOver = true;
    customer = null;
    const b = C.best('coins:simple', run.coins);
    if (b.isNew && run.coins > 0) C.confetti();
    sound('new');
    const v = await C.modal({
      emoji: '🌙',
      title: 'The moon is setting',
      body: `You served ${PER_DAY} customers and made ${run.coins} coins${b.isNew ? ' (a new best!)' : ` (best ${b.best})`}. Your grimoire holds ${found.size} of ${TOTAL} potions.`,
      buttons: [{ label: 'Open again tomorrow', value: 'again' }, { label: 'Just brew for fun', value: 'free' }]
    });
    if (v === 'again') { run = newRun(); shiftOver = false; nextCustomer(); hud(); }
    else freeBrew();
  }

  function freeBrew() {
    customer = null;
    els.folk.innerHTML = portrait('ghost', '#cdd7f6', 'happy');
    els.askName.textContent = 'Closed for the night';
    els.askText.textContent = 'No customers now. Brew whatever you like. Wisp the ghost is watching, quietly impressed.';
    els.askHint.textContent = '';
    els.giveBtn.disabled = false; els.giveBtn.firstChild.textContent = 'Reopen the shop ';
    els.hintBtn.disabled = true;
    els.giveBtn.onclick = () => { els.giveBtn.onclick = null; run = newRun(); shiftOver = false; nextCustomer(); };
  }

  async function endDay() {
    customer = null;
    cancelAnimationFrame(tick.raf);
    const b = C.best('coins:advanced', run.earned);
    const lines = [`Night ${run.day} is over.`, `Earned tonight: ${run.dayCoins} coins.`, run.dayLost ? `Lost ${run.dayLost} reputation star${run.dayLost > 1 ? 's' : ''}.` : 'Not a single grumpy customer.', `Total earned: ${run.earned}${b.isNew ? ' (best ever!)' : ''}.`];
    sound('new');
    await C.modal({ emoji: '🌅', title: 'Sunrise. Shop closed.', body: lines.join(' '), buttons: [{ label: 'Visit the market', value: 'm' }] });
    run.day++; run.dayServed = 0; run.dayCoins = 0; run.dayLost = 0;
    saveRun();
    await openStore(true);
    nextCustomer();
  }

  async function closeShop() {
    customer = null;
    cancelAnimationFrame(tick.raf);
    const b = C.best('coins:advanced', run.earned);
    const nights = run.day;
    C.store.set(RUNKEY, null);
    await C.modal({
      emoji: '🕯️',
      title: 'The shop has closed',
      body: `Your reputation ran out on night ${nights}. You earned ${run.earned} coins in total${b.isNew ? ', a new record' : ` (best ${b.best})`}. The grimoire keeps every recipe you found: ${found.size} of ${TOTAL}.`,
      buttons: [{ label: 'Open a new shop', value: 'again' }]
    });
    run = newRun();
    saveRun();
    hud(); renderGrid();
    nextCustomer();
  }

  function openStore(between) {
    if (!adv) return Promise.resolve();
    const wrap = document.createElement('div');
    wrap.className = 'ps-store';
    const offers = [
      ...BASES.filter((b) => b.cost && !run.unlocked.includes(b.id)).map((b) => ({ key: b.id, title: `Unlock ${b.name}`, note: b.desc, cost: b.cost, buy: () => { run.unlocked.push(b.id); } })),
      { key: 'scroll', title: 'Three hint scrolls', note: 'Each one reveals a clue to a customer\'s recipe.', cost: 20, buy: () => { run.scrolls += 3; } },
      { key: 'candle', title: 'Longer candles', note: 'Customers wait 20 seconds longer.', cost: 30 + run.patience * 30, max: run.patience >= 3, buy: () => { run.patience++; } },
      { key: 'sign', title: 'A fancier sign', note: 'Fast service earns bigger tips.', cost: 35 + run.tips * 35, max: run.tips >= 3, buy: () => { run.tips++; } },
      { key: 'star', title: 'Polish the reputation', note: 'Win back one star with free samples.', cost: 45, max: run.stars >= 5, buy: () => { run.stars++; } }
    ];
    const paint = () => {
      wrap.innerHTML = `<p class="c-muted" style="margin:0 0 4px;text-align:center">You have <b>${run.coins}</b> coins.</p>` + offers.map((o, i) => `<button type="button" data-i="${i}" ${o.max || run.coins < o.cost ? 'disabled' : ''}><b>${esc(o.title)}</b><em>${o.max ? 'maxed' : o.cost + 'c'}</em><small>${esc(o.note)}</small></button>`).join('');
    };
    paint();
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-i]'); if (!btn) return;
      const o = offers[+btn.dataset.i];
      if (o.max || run.coins < o.cost) return;
      run.coins -= o.cost; o.buy(); sound('coin'); C.sfx('success');
      saveRun(); hud(); renderGrid();
      offers.forEach((x) => { if (x.key === 'candle') { x.cost = 30 + run.patience * 30; x.max = run.patience >= 3; } if (x.key === 'sign') { x.cost = 35 + run.tips * 35; x.max = run.tips >= 3; } if (x.key === 'star') x.max = run.stars >= 5; });
      const b = BASES.find((x) => x.id === o.key); if (b) offers.splice(offers.indexOf(o), 1);
      paint();
    });
    return C.modal({ emoji: '🛒', title: between ? 'The morning market' : 'Market stall', body: wrap, buttons: [{ label: between ? 'Open the shop' : 'Back to the cauldron', value: 'ok' }] });
  }

  function book() {
    const wrap = document.createElement('div');
    wrap.className = 'ps-book';
    const all = POOL.slice().sort((a, b) => (found.has(b) - found.has(a)) || ITEMS[a].name.localeCompare(ITEMS[b].name));
    wrap.innerHTML = all.map((id) => {
      const k = found.has(id);
      const how = recipeSeen[id] || (k ? MAKES[id] : null);
      return `<div class="${k ? '' : 'is-unknown'}">${k ? art(id) : '<svg viewBox="0 0 48 52"><path d="M20 4h8v12c8 3 13 10 13 18 0 10-8 16-17 16S7 44 7 34c0-8 5-15 13-18z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-dasharray="4 3"/></svg>'}<span><b>${k ? esc(ITEMS[id].name) : '???'}</b>${k && how ? `${esc(ITEMS[how[0]].name)} + ${esc(ITEMS[how[1]].name)}` : k ? '' : 'Not discovered'}</span></div>`;
    }).join('');
    C.modal({ emoji: '📖', title: `Grimoire: ${found.size} of ${TOTAL}`, body: wrap, buttons: [{ label: 'Close the book', value: 'x' }] });
  }

  els.grid.addEventListener('click', (e) => {
    const b = e.target.closest('.ps-item'); if (!b) return;
    const id = b.dataset.id;
    if (giving && !ITEMS[id].base) { give(id); return; }
    addToPot(id);
  });
  els.slotA.addEventListener('click', () => { if (!brewing && slots[0]) { slots[0] = slots[1]; slots[1] = null; renderSlots(); C.sfx('unpop'); } });
  els.slotB.addEventListener('click', () => { if (!brewing && slots[1]) { slots[1] = null; renderSlots(); C.sfx('unpop'); } });
  els.result.addEventListener('click', (e) => { const b = e.target.closest('[data-give]'); if (b) give(b.dataset.give); });
  els.giveBtn.addEventListener('click', () => { if (els.giveBtn.onclick) return; setGiving(!giving); });
  els.hintBtn.addEventListener('click', () => clue(false));
  els.tabIng.addEventListener('click', () => { setGiving(false); setTab('ing'); });
  els.tabPot.addEventListener('click', () => setTab('pot'));
  els.search.addEventListener('input', renderGrid);
  $('#bookBtn').addEventListener('click', book);
  $('#scrollBtn').addEventListener('click', () => openStore(false));
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.curio-modal, input, textarea')) return;
    const bases = adv ? BASES : BASES.filter((b) => SIMPLE_BASES.includes(b.id));
    if (/^[1-8]$/.test(e.key) && bases[+e.key - 1]) { addToPot(bases[+e.key - 1].id); e.preventDefault(); }
    else if (e.key === 'Backspace' || e.key === 'Delete') { if (!brewing) { slots = [null, null]; renderSlots(); } }
    else if (e.key === 'g' || e.key === 'G') { if (lastBrew && lastBrew !== 'sludge' && customer && !customer.gone && els.result.querySelector('[data-give]')) give(lastBrew); else if (!els.giveBtn.disabled) els.giveBtn.click(); }
    else if (e.key === 'h' || e.key === 'H') clue(false);
    else if (e.key === 'Escape' && giving) setGiving(false);
  });
  document.addEventListener('visibilitychange', () => { tick.last = performance.now(); });

  renderSlots();
  setTab('ing');
  hud();
  nextCustomer();
  if (!C.store.get('ps:tipped', false) && matchMedia('(pointer: fine)').matches) { C.store.set('ps:tipped', true); setTimeout(() => C.toast('Tip: everything works with clicks and keys. Touchpad friendly.', 2600), 1200); }
})();
