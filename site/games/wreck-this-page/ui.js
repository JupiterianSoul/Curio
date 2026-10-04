(() => {
  const WTP = window.WTP;
  const { $, el, esc, fmtInt, fmtTime, PAL } = WTP;
  const SP = WTP.sprites, WP = WTP.weapons, MD = WTP.modes, PG = WTP.progress, AU = WTP.audio, G = WTP.game, I = WTP.input;
  const C = WTP.C;
  const U = {};
  WTP.ui = U;
  const S = () => WTP.save;
  let cur = 'title';
  const history = [];
  let pendingMode = 'free';
  let audioOn = false;
  const SIMPLE = !!C.simple;
  const SIMPLE_KIT = ['shotgun', 'rocket', 'grenade', 'flame', 'whip', 'hammer'];
  const SIMPLE_PAGES = ['news', 'shop', 'lost', 'feed', 'arcade', 'blog', 'weather', 'retro', 'video', 'museum'];
  document.body.classList.toggle('wtp-simple', SIMPLE);
  U.simple = SIMPLE;
  function simplePage(step = 0) {
    const n = SIMPLE_PAGES.length;
    const i = (((S().simpleIdx | 0) + step) % n + n) % n;
    if (step) { S().simpleIdx = i; WTP.persist(); }
    return WTP.pages.find((p) => p.id === SIMPLE_PAGES[i]) || WTP.pages[0];
  }
  function startSimple(step = 0) {
    const page = simplePage(step);
    launch({ mode: 'free', page, weapons: SIMPLE_KIT.slice(), params: { goal: 75, autoEnd: true }, simple: true, tryGadget: 'boots' });
  }
  U.startSimple = startSimple;

  const style = document.createElement('style');
  const scopeCss = (css) => css.split('}').map((ch) => { const i = ch.indexOf('{'); if (i < 0) return ch; return ch.slice(0, i).split(',').map((x) => (x.trim() ? `.wtp-src ${x.trim()}` : x)).join(', ') + ' ' + ch.slice(i); }).join('}');
  style.textContent = scopeCss(WTP.css || '');
  document.head.append(style);

  const icoCache = new Map();
  function icoMask(name, scale) {
    const key = `${name}|${scale}`;
    if (!icoCache.has(key)) icoCache.set(key, SP.iconURL(name, '7', scale, null));
    return icoCache.get(key);
  }
  function paintIcons(root = document) {
    root.querySelectorAll('[data-ico]').forEach((e) => {
      const big = e.closest('.px-btn--big, .px-ib, .tbtn, .tr, .toast-ach');
      const sc = big ? 3 : 2;
      const url = icoMask(e.dataset.ico, sc);
      const px = big ? 24 : 16;
      e.style.cssText += `;width:${px}px;height:${px}px;background:currentColor;-webkit-mask:url(${url}) no-repeat 0 0/${px}px ${px}px;mask:url(${url}) no-repeat 0 0/${px}px ${px}px;`;
    });
  }
  const ico = (n) => `<span class="ico" data-ico="${n}" aria-hidden="true"></span>`;
  const spriteCache = new Map();
  const wImg = (id, scale = 2) => { const k = `${id}|${scale}`; if (!spriteCache.has(k)) spriteCache.set(k, SP.spriteURL(WP.BY[id].sprite, scale)); return spriteCache.get(k); };
  const enemyImg = (k, scale = 2) => { const key = `e${k}|${scale}`; if (!spriteCache.has(key)) spriteCache.set(key, SP.spriteURL(SP.ENEMY[k], scale)); return spriteCache.get(key); };

  function applyTheme() {
    const cb = !!S().settings.colorblind;
    $('app').classList.toggle('wtp-cb', cb);
    $('stage').classList.toggle('wtp-cb', cb);
  }

  let wipeBusy = false;
  function wipe(mid) {
    const cv = $('wipe');
    if (WTP.reducedMotion() || wipeBusy) { mid(); return; }
    wipeBusy = true;
    const r = cv.getBoundingClientRect();
    const B = 14;
    const w = Math.ceil(r.width / B), h = Math.ceil(r.height / B);
    cv.width = w; cv.height = h;
    const g = cv.getContext('2d');
    const order = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) order.push([x, y, SP.BAYER[(y & 3) * 4 + (x & 3)] + ((x + y) / (w + h)) * 8]);
    order.sort((a, b) => a[2] - b[2]);
    const dur = 150;
    let t0 = performance.now(), phase = 0, done = 0;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const n = Math.floor(k * order.length);
      if (phase === 0) {
        g.fillStyle = PAL['0'];
        for (; done < n; done++) g.fillRect(order[done][0], order[done][1], 1, 1);
        if (k >= 1) { g.fillRect(0, 0, w, h); phase = 1; mid(); t0 = performance.now(); done = 0; }
        requestAnimationFrame(step);
      } else {
        for (; done < n; done++) g.clearRect(order[done][0], order[done][1], 1, 1);
        if (k >= 1) { g.clearRect(0, 0, w, h); wipeBusy = false; return; }
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  const SCREENS = { title: 'scrTitle', main: 'scrMain', modes: 'scrModes', pages: 'scrPages', campaign: 'scrCampaign', puzzles: 'scrPuzzles', armory: 'scrArmory', wardrobe: 'scrWardrobe', trophies: 'scrTrophies', stats: 'scrStats', settings: 'scrSettings', help: 'scrHelp' };
  const TITLES = { modes: 'Quick play', pages: 'Pick a page', campaign: 'Campaign', puzzles: 'Ammo puzzles', armory: 'Armory', wardrobe: 'Wardrobe', trophies: 'Trophies', stats: 'Stats', settings: 'Settings', help: 'How to play' };
  function show(id, push = true) {
    if (push && cur !== id) history.push(cur);
    wipe(() => {
      for (const k in SCREENS) $(SCREENS[k]).classList.toggle('is-on', k === id);
      cur = id;
      WTP.title.setMode(id === 'title' ? 'title' : id === 'main' ? 'menu' : 'sub');
      render(id);
      const scr = $(SCREENS[id]);
      scr.scrollTop = 0;
      const f = scr.querySelector('.s-body button:not([disabled]), .m-menu button, #tStart');
      if (f) f.focus({ preventScroll: true });
    });
    AU.play('select');
  }
  function back() {
    const prev = history.pop() || 'main';
    AU.play('back');
    show(prev === cur ? 'main' : prev, false);
  }
  function head(id) {
    const h = $(SCREENS[id]).querySelector('.s-head');
    if (!h) return;
    h.innerHTML = `<button class="px-btn px-btn--ghost" type="button" data-act="back">${ico('back')}<span>Back</span></button><h2 class="px-h2">${TITLES[id] || ''}</h2><span class="scrap">${ico('scrap')}<span>${fmtInt(S().scrap)}</span></span>`;
    h.querySelector('[data-act="back"]').addEventListener('click', back);
  }
  function render(id) {
    if (TITLES[id]) head(id);
    const R = { main: renderMain, modes: renderModes, pages: renderPages, campaign: renderCampaign, puzzles: renderPuzzles, armory: renderArmory, wardrobe: renderWardrobe, trophies: renderTrophies, stats: renderStats, settings: renderSettings, help: renderHelp, title: renderTitle };
    R[id] && R[id]();
    paintIcons($(SCREENS[id]));
  }
  function renderTitle() {
    const st = S().stats;
    if (SIMPLE) {
      $('tTag').textContent = 'One page. Six weapons. Go.';
      $('tStats').textContent = `Next up: ${simplePage().site}`;
      requestAnimationFrame(() => WTP.title.place && WTP.title.place());
      return;
    }
    $('tStats').textContent = st.pixels ? `${fmtInt(st.pixels)} pixels wrecked so far` : `${WP.DEFS.length} weapons · ${WTP.pages.filter((p) => !p.hidden).length} pages · ${MD.MODE_COUNT || 9} modes`;
    requestAnimationFrame(() => WTP.title.place && WTP.title.place());
  }
  let sidePrev = null;
  function renderMain() {
    const daily = MD.daily();
    const dBest = WTP.getBest(`daily:${daily.date}`);
    const stars = MD.totalStars();
    const maxStars = MD.CAMPAIGN.length * 3 + MD.PUZZLES.length * 3;
    const owned = PG.ownedCount();
    const items = [
      ['campaign', 'flag', 'Campaign', `${stars}★`, true],
      ['modes', 'play', 'Quick play', '', true],
      ['daily', 'calendar', 'Daily challenge', dBest != null ? '✓' : 'NEW'],
      ['armory', 'gun', 'Armory', `${owned}/${WP.DEFS.length}`],
      ['wardrobe', 'shirt', 'Wardrobe', ''],
      ['trophies', 'trophy', 'Trophies', `${Object.keys(S().achievements).length}/${PG.ACH.length}`],
      ['stats', 'stats', 'Stats', ''],
      ['settings', 'gear', 'Settings', ''],
      ['help', 'help', 'How to play', '']
    ];
    const m = $('mMenu');
    m.innerHTML = items.map(([k, ic, label, badge, big]) => `<button class="px-btn${big ? ' px-btn--big' : k === 'daily' ? ' px-btn--sec' : ' px-btn--ghost'}" type="button" data-go="${k}">${ico(ic)}<span>${label}</span>${badge ? `<span class="badge">${badge}</span>` : ''}</button>`).join('');
    m.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.go;
      if (k === 'daily') return startDaily();
      show(k);
    }));
    const side = $('mSide');
    side.innerHTML = `<canvas id="sideHero" width="20" height="23" style="width:100px;height:115px;image-rendering:pixelated" aria-label="Your hero"></canvas>
      <b>${esc(SP.SKINS.find((s) => s.id === S().skin)?.name || 'Wrecker')}</b>
      <div class="row"><span>Scrap</span><b>${fmtInt(S().scrap)}</b></div>
      <div class="row"><span>Stars</span><b>${stars}/${maxStars}</b></div>
      <div class="row"><span>Pixels wrecked</span><b>${fmtInt(S().stats.pixels)}</b></div>
      <div class="row"><span>Best combo</span><b>${fmtInt(S().stats.bestCombo)}</b></div>
      <div class="row"><span>Today</span><b>${esc(WTP.pages.find((p) => p.id === daily.page)?.site || '')}</b></div>`;
    clearInterval(sidePrev);
    const hc = $('sideHero').getContext('2d');
    let fi = 0;
    const anims = ['idle', 'idle', 'run', 'run', 'victory'];
    let ai = 0;
    const tick = () => {
      const fr = SP.playerFrames(S().skin).anims[anims[ai]];
      hc.clearRect(0, 0, 20, 23);
      hc.drawImage(fr[fi % fr.length].r, 0, 0);
      fi++;
      if (fi % 12 === 0) ai = (ai + 1) % anims.length;
    };
    tick();
    sidePrev = setInterval(() => { if (cur === 'main' && !document.hidden) tick(); }, 140);
  }

  const MODE_ORDER = ['free', 'speed', 'time', 'survival', 'targets', 'puzzle', 'zen', 'daily'];
  const MODE_ICON_COLOR = { free: '#ff7f3f', speed: '#ffe066', time: '#e8484f', survival: '#ff5fa2', targets: '#4aa3ff', puzzle: '#9a4dff', zen: '#6fcf5a', daily: '#20a39e' };
  function modeBest(k) {
    if (k === 'survival') { const b = WTP.getBest('survival'); return b != null ? `Best: wave ${b}` : 'Not played yet'; }
    if (k === 'puzzle') { const n = MD.PUZZLES.filter((p) => S().bests[`puzzle:${p.id}`]).length; return `${n}/${MD.PUZZLES.length} solved`; }
    if (k === 'daily') { const d = MD.daily(); return d.goal; }
    if (k === 'zen') return `${WTP.fmtClock(S().stats.zenTime)} relaxed`;
    const n = WTP.pages.filter((p) => S().bests[`${k}:${p.id}`] != null || S().bests[`${k}:${p.id}:60`] != null).length;
    return n ? `Records on ${n} pages` : 'No records yet';
  }
  function renderModes() {
    const g = $('modeGrid');
    g.innerHTML = MODE_ORDER.map((k) => {
      const M = MD.MODES[k];
      return `<button class="mode-card" type="button" data-mode="${k}"><div class="mc-top" style="background:${MODE_ICON_COLOR[k]}"><img alt="" src="${SP.iconURL(M.icon, '0', 7, null)}"></div><div class="mc-b"><b>${M.name}</b><small>${M.desc}</small><div class="best">${esc(modeBest(k))}</div></div></button>`;
    }).join('');
    g.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.mode;
      if (k === 'puzzle') return show('puzzles');
      if (k === 'daily') return startDaily();
      pendingMode = k;
      show('pages');
    }));
  }
  function startDaily() {
    const d = MD.daily();
    const page = WTP.pages.find((p) => p.id === d.page) || WTP.pages[0];
    launch({ mode: 'daily', page, weapons: d.weapons, params: { daily: d } });
  }

  const thumbs = new Map();
  let thumbQueue = [], thumbBusy = false;
  const thumbHost = el('div');
  thumbHost.setAttribute('aria-hidden', 'true');
  thumbHost.className = 'wtp-src';
  thumbHost.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;z-index:-1';
  document.body.append(thumbHost);
  async function makeThumb(page) {
    thumbHost.innerHTML = page.html;
    const root = thumbHost.firstElementChild;
    root.style.width = '760px';
    await new Promise((r) => requestAnimationFrame(r));
    const data = await WTP.world.rasterize(root, {});
    thumbHost.innerHTML = '';
    const Wt = 128, Ht = 96, k = 760 / Wt;
    const cv = document.createElement('canvas');
    cv.width = Wt; cv.height = Ht;
    const g = cv.getContext('2d');
    const img = g.createImageData(Wt, Ht);
    const u = new Uint32Array(img.data.buffer);
    const top = 80;
    for (let y = 0; y < Ht; y++) for (let x = 0; x < Wt; x++) {
      const sx = Math.min(data.PW - 1, Math.floor(x * k + k / 2)), sy = Math.min(data.PH - 1, Math.floor(top + y * k + k / 2));
      const o = (sy * data.PW + sx) * 4;
      const fa = data.fd[o + 3] / 255;
      const r = data.fd[o] * fa + data.bd[o] * (1 - fa), gg = data.fd[o + 1] * fa + data.bd[o + 1] * (1 - fa), b = data.fd[o + 2] * fa + data.bd[o + 2] * (1 - fa);
      u[y * Wt + x] = WTP.pack(r | 0, gg | 0, b | 0);
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
  async function pumpThumbs() {
    if (thumbBusy) return;
    thumbBusy = true;
    while (thumbQueue.length) {
      const p = thumbQueue.shift();
      if (thumbs.has(p.id) || G.playing) continue;
      try { thumbs.set(p.id, await makeThumb(p)); } catch (e) { thumbs.set(p.id, null); }
      placeThumb(p.id);
      await new Promise((r) => setTimeout(r, 30));
    }
    thumbBusy = false;
  }
  function placeThumb(id) {
    const slot = document.querySelector(`.pg-thumb[data-thumb="${id}"]`);
    const c = thumbs.get(id);
    if (!slot || !c) return;
    const copy = document.createElement('canvas');
    copy.width = c.width; copy.height = c.height;
    copy.getContext('2d').drawImage(c, 0, 0);
    copy.setAttribute('aria-hidden', 'true');
    slot.innerHTML = '';
    slot.append(copy);
  }
  function pageBest(p, mode) {
    const M = MD.MODES[mode];
    if (!M || !M.bestKey) return '';
    let key;
    try { key = M.bestKey({ page: p, limit: 60, params: {} }); } catch (e) { return ''; }
    if (mode === 'time') key = `time:${p.id}:60`;
    const v = S().bests[key];
    if (v == null) return '';
    return `Best ${M.fmt ? M.fmt(v) : fmtInt(v)}`;
  }
  function renderPages() {
    const M = MD.MODES[pendingMode];
    $('pgInfo').innerHTML = `<span class="tag">${esc(M.name)}</span> ${esc(M.desc)}`;
    const list = WTP.pages.filter((p) => !p.hidden);
    const g = $('pgGrid');
    const randCard = `<button class="pg-card" type="button" data-page="__random"><div class="pg-thumb" style="background:#1a1226;align-items:center"><img alt="" src="${SP.iconURL('dice', 'y', 7, '0')}" style="image-rendering:pixelated"></div><div class="pg-b"><b>Random page</b><small>Let fate pick your victim.</small><div class="pg-best"></div></div></button>`;
    g.innerHTML = randCard + list.map((p) => {
      const b = pageBest(p, pendingMode);
      const flat = S().bests[`flat:${p.id}`];
      return `<button class="pg-card" type="button" data-page="${p.id}" aria-label="${esc(`${p.site}: ${p.title}`)}"><div class="pg-thumb" data-thumb="${p.id}"></div><div class="pg-b"><b>${esc(p.site)}</b><small>${esc(p.blurb || '')}</small><div class="pg-best">${esc(b)}${flat ? ` ${b ? '· ' : ''}${flat}%` : ''}</div></div>${S().seenPages[p.id] ? '' : '<span class="pg-medal tag">NEW</span>'}</button>`;
    }).join('');
    g.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => {
      let id = b.dataset.page;
      if (id === '__random') id = WTP.pick(list).id;
      const p = WTP.pages.find((x) => x.id === id);
      launch({ mode: pendingMode, page: p });
    }));
    for (const p of list) { if (thumbs.has(p.id)) placeThumb(p.id); else thumbQueue.push(p); }
    setTimeout(pumpThumbs, 260);
  }
  function renderCampaign() {
    const g = $('campList');
    g.innerHTML = MD.CAMPAIGN.map((lv, i) => {
      const unlocked = MD.campaignUnlocked(i);
      const stars = S().campaign[lv.id] || 0;
      const page = WTP.pages.find((p) => p.id === lv.page);
      const wps = lv.weapons === 'all' ? '<small>Every weapon you own</small>' : `<div class="wp">${lv.weapons.map((w) => `<img alt="${esc(WP.BY[w].name)}" title="${esc(WP.BY[w].name)}" src="${wImg(w, 2)}">`).join('')}</div>`;
      return `<button class="lv${unlocked ? '' : ' is-locked'}${stars ? ' is-done' : ''}" type="button" data-lv="${i}" ${unlocked ? '' : 'aria-disabled="true"'}><span class="lv-n">Level ${i + 1} · ${esc(MD.MODES[lv.mode].name)}</span><b>${esc(lv.name)}</b><small>${unlocked ? esc(lv.story) : 'Finish the previous level to unlock.'}</small><small>${esc(page?.site || '')}</small>${unlocked ? wps : ''}<span class="stars">${'★'.repeat(stars)}<span style="color:var(--panel2)">${'★'.repeat(3 - stars)}</span></span></button>`;
    }).join('');
    g.querySelectorAll('[data-lv]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.lv);
      if (!MD.campaignUnlocked(i)) { AU.play('deny'); return; }
      startLevel(i);
    }));
  }
  function startLevel(i) {
    const lv = MD.CAMPAIGN[i];
    const page = WTP.pages.find((p) => p.id === lv.page);
    launch({ mode: lv.mode, page, params: lv.params, weapons: lv.weapons, campaign: lv, levelIdx: i });
  }
  function renderPuzzles() {
    const g = $('puzList');
    g.innerHTML = MD.PUZZLES.map((pz, i) => {
      const st = S().bests[`puzzle:${pz.id}`] || 0;
      const page = WTP.pages.find((p) => p.id === pz.page);
      const ammo = Object.entries(pz.ammo).map(([w, n]) => `<span style="display:inline-flex;align-items:center;gap:4px"><img alt="${esc(WP.BY[w].name)}" src="${wImg(w, 2)}" style="height:20px;image-rendering:pixelated">×${n}</span>`).join(' ');
      return `<button class="puz-card" type="button" data-pz="${i}"><span class="lv-n" style="color:var(--muted)">Puzzle ${i + 1} · ${esc(page?.site || '')}</span><b>${esc(pz.name)}</b><small>${esc(pz.hint)}</small><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">${ammo}</div><span class="stars" style="color:#ffb347;letter-spacing:4px">${'★'.repeat(st)}<span style="color:var(--panel2)">${'★'.repeat(3 - st)}</span></span></button>`;
    }).join('');
    g.querySelectorAll('[data-pz]').forEach((b) => b.addEventListener('click', () => {
      const pz = MD.PUZZLES[Number(b.dataset.pz)];
      launch({ mode: 'puzzle', page: WTP.pages.find((p) => p.id === pz.page), params: { puzzle: pz }, weapons: Object.keys(pz.ammo) });
    }));
  }

  let armCat = 'all', armSel = 'pistol', armAnim = 0;
  const GD = () => WTP.gadgets;
  const gImg = (id, scale = 3) => { const k = `g${id}|${scale}`; if (!spriteCache.has(k)) spriteCache.set(k, SP.spriteURL(GD().BY[id].sprite, scale)); return spriteCache.get(k); };
  const lvPips = (lv) => `<span class="lvp">${[1, 2, 3].map((k) => `<i class="${k <= lv ? 'on' : ''}"></i>`).join('')}</span>`;
  function renderArmory() {
    const tabs = $('armTabs');
    const cats = [{ id: 'all', name: 'All', icon: 'gun' }, ...WP.CATS, { id: 'gadgets', name: 'Gadgets', icon: 'gadget' }];
    tabs.innerHTML = cats.map((c) => `<button class="arm-tab" type="button" role="tab" aria-selected="${c.id === armCat}" data-cat="${c.id}">${ico(c.icon)}<span>${c.name}</span></button>`).join('');
    tabs.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { armCat = b.dataset.cat; if (armCat === 'gadgets' && !GD().BY[armSel]) armSel = S().gadget; if (armCat !== 'gadgets' && !WP.BY[armSel]) armSel = 'pistol'; AU.play('hover'); renderArmory(); paintIcons(tabs); }));
    const g = $('armGrid');
    if (armCat === 'gadgets') {
      g.innerHTML = GD().DEFS.map((d) => {
        const own = GD().owned(d.id), eq = S().gadget === d.id;
        return `<button class="arm-cell${own ? '' : ' is-locked'}" type="button" data-g="${d.id}" aria-pressed="${d.id === armSel}" aria-label="${esc(d.name)}">${own ? '<span class="own"></span>' : ''}<img alt="" src="${gImg(d.id, 4)}"><b>${esc(d.name)}</b><small>${eq ? 'Equipped' : own ? 'Owned' : `${ico('scrap')} ${fmtInt(d.price)}`}</small></button>`;
      }).join('');
      g.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { armSel = b.dataset.g; AU.play('hover'); g.querySelectorAll('[data-g]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderGadgetDetail(); }));
      paintIcons(g);
      if (!GD().BY[armSel]) armSel = S().gadget;
      renderGadgetDetail();
      return;
    }
    const list = WP.DEFS.filter((d) => armCat === 'all' || d.cat === armCat);
    g.innerHTML = list.map((d) => {
      const own = PG.isOwned(d.id);
      const slot = S().hotbar.indexOf(d.id);
      return `<button class="arm-cell${own ? '' : ' is-locked'}" type="button" data-w="${d.id}" aria-pressed="${d.id === armSel}" aria-label="${esc(d.name)}${own ? '' : `, costs ${d.price} scrap`}">${own ? '<span class="own"></span>' : ''}<img alt="" src="${wImg(d.id, 3)}"><b>${esc(d.name)}</b><small>${own ? (slot >= 0 ? `Slot ${(slot + 1) % 10}` : 'Owned') + (WP.upg(d.id) ? ` · Lv ${WP.upg(d.id) + 1}` : '') : `${ico('scrap')} ${fmtInt(d.price)}`}</small></button>`;
    }).join('');
    g.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { armSel = b.dataset.w; AU.play('hover'); g.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderArmDetail(); }));
    paintIcons(g);
    if (!WP.BY[armSel]) armSel = 'pistol';
    renderArmDetail();
  }
  function renderGadgetDetail() {
    const d = GD().BY[armSel];
    const own = GD().owned(d.id), eq = S().gadget === d.id;
    const box = $('armDetail');
    box.innerHTML = `<div class="big"><img alt="" src="${gImg(d.id, 8)}" style="image-rendering:pixelated;max-height:110px"></div>
      <h3>${esc(d.name)}</h3><div class="cat">Movement gadget · press ${esc(keyName(S().keys.gadget?.[0]))} (or the gadget button)</div>
      <p>${esc(d.tip)}</p>
      <div class="px-row">${own ? `<button class="px-btn${eq ? ' px-btn--ghost' : ''}" type="button" data-act="equip">${ico(eq ? 'check' : 'gadget')}<span>${eq ? 'Equipped' : 'Equip'}</span></button>` : `<button class="px-btn px-btn--gold${S().scrap >= d.price ? '' : ' is-off'}" type="button" data-act="buyg">${ico('scrap')}<span>Buy ${fmtInt(d.price)}</span></button>`}<button class="px-btn px-btn--sec" type="button" data-act="tryg">${ico('target')}<span>Try it</span></button></div>`;
    paintIcons(box);
    box.querySelector('[data-act="equip"]')?.addEventListener('click', () => { GD().equip(d.id); AU.play('select'); renderArmory(); });
    box.querySelector('[data-act="buyg"]')?.addEventListener('click', () => {
      if (GD().buy(d.id)) { GD().equip(d.id); AU.play('buy'); C.confetti && C.confetti(60); toastAch({ name: `${d.name} unlocked`, desc: 'Equipped. Press the gadget key to use it.', icon: 'gadget' }); renderArmory(); head('armory'); paintIcons($('scrArmory')); }
      else { AU.play('deny'); label2(`Need ${fmtInt(d.price - S().scrap)} more scrap. Wreck more pages!`); }
    });
    box.querySelector('[data-act="tryg"]').addEventListener('click', () => {
      launch({ mode: 'free', page: WTP.rangePage, practice: true, params: { goal: 101 }, tryGadget: d.id });
    });
  }
  function renderArmDetail() {
    const d = WP.BY[armSel];
    const own = PG.isOwned(d.id);
    const cat = WP.CATS.find((c) => c.id === d.cat);
    const pips = (n) => `<span class="pips">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
    const lv = WP.upg(d.id);
    const slot = S().hotbar.indexOf(d.id);
    const box = $('armDetail');
    const up = own && lv < 3 ? WP.upCost(d.id, lv) : 0;
    box.innerHTML = `<div class="big"><canvas id="armCv" width="72" height="30" style="width:360px;max-width:100%;height:auto"></canvas></div>
      <h3>${esc(d.name)} ${own ? lvPips(lv) : ''}</h3><div class="cat">${esc(cat?.name || '')}${d.alt ? ` · ALT: ${esc(d.alt)}` : ''}${d.hold ? ' · Hold to fire' : ''}</div>
      <p class="does">${ico('star')} ${esc(d.does || '')}</p>
      <p>${esc(d.tip)}</p>
      <div class="statbar"><span>Power</span>${pips(Math.min(5, d.st[0] + (lv >= 2 ? 1 : 0)))}</div><div class="statbar"><span>Rate</span>${pips(Math.min(5, d.st[1] + (lv >= 3 ? 1 : 0)))}</div><div class="statbar"><span>Range</span>${pips(d.st[2])}</div><div class="statbar"><span>Chaos</span>${pips(d.st[3])}</div>
      ${own ? `<div class="upg"><b>Level ${lv + 1} of 4</b><small>${lv < 3 ? 'Each level: bigger holes, +25% damage, faster cooldown.' : 'Fully upgraded. Maximum mayhem.'}</small></div>` : ''}
      <div class="px-row">${own ? `${lv < 3 ? `<button class="px-btn px-btn--gold${S().scrap >= up ? '' : ' is-off'}" type="button" data-act="upg">${ico('up')}<span>Upgrade ${fmtInt(up)}</span></button>` : ''}<button class="px-btn px-btn--ghost" type="button" data-act="hot">${ico(slot >= 0 ? 'cross' : 'check')}<span>${slot >= 0 ? `Remove from slot ${(slot + 1) % 10}` : 'Add to hotbar'}</span></button>` : `<button class="px-btn px-btn--gold${S().scrap >= d.price ? '' : ' is-off'}" type="button" data-act="buy">${ico('scrap')}<span>Buy ${fmtInt(d.price)}</span></button>`}<button class="px-btn px-btn--sec" type="button" data-act="try">${ico('target')}<span>Try it</span></button></div>`;
    paintIcons(box);
    box.querySelector('[data-act="try"]').addEventListener('click', () => {
      launch({ mode: 'free', page: WTP.rangePage, weapons: [d.id], allWeapons: false, practice: true, first: d.id, params: { goal: 101 } });
    });
    box.querySelector('[data-act="buy"]')?.addEventListener('click', () => {
      if (PG.buyWeapon(d.id)) { AU.play('buy'); C.confetti && C.confetti(60); toastAch({ name: `${d.name} unlocked`, desc: S().hotbar.includes(d.id) ? 'Added to your hotbar. Go break something.' : 'Hotbar full: assign it from the weapons menu (Tab).', icon: 'gun' }); renderArmory(); head('armory'); paintIcons($('scrArmory')); }
      else { AU.play('deny'); label2(`Need ${fmtInt(d.price - S().scrap)} more scrap. Wreck more pages!`); }
    });
    box.querySelector('[data-act="upg"]')?.addEventListener('click', () => {
      if (S().scrap >= up) { S().scrap -= up; S().upg[d.id] = lv + 1; WTP.persist(); AU.play('unlock'); toastAch({ name: `${d.name} Lv ${lv + 2}`, desc: 'Bigger, meaner, faster.', icon: 'up' }); renderArmory(); head('armory'); paintIcons($('scrArmory')); }
      else { AU.play('deny'); label2(`Need ${fmtInt(up - S().scrap)} more scrap.`); }
    });
    box.querySelector('[data-act="hot"]')?.addEventListener('click', () => {
      const hb = S().hotbar;
      const k = hb.indexOf(d.id);
      if (k >= 0) hb[k] = null;
      else { const e = hb.indexOf(null); hb[e >= 0 ? e : 9] = d.id; }
      WTP.persist(); AU.play('select'); renderArmory();
    });
    armAnim++;
    const myAnim = armAnim;
    const cv = $('armCv');
    const g = cv.getContext('2d');
    let t = 0, last = performance.now(), fireT = 0.6, recoil = 0, flash = 0;
    const proj = [];
    const sp = d.sprite;
    const step = (now) => {
      if (myAnim !== armAnim || cur !== 'armory' || !cv.isConnected) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      fireT -= dt;
      const gx = Math.round(26 - sp.w / 2), gy = 15;
      if (fireT <= 0) { fireT = d.hold ? 0.05 : Math.max(0.12, Math.min(1.2, d.rate || 0.5)) + 0.25; recoil = d.hold ? 1 : 3; flash = 0.06; proj.push({ x: gx + sp.w, y: gy, vx: 90, life: 0.5 }); }
      recoil *= Math.pow(0.001, dt); flash -= dt;
      g.clearRect(0, 0, 72, 30);
      g.imageSmoothingEnabled = false;
      const bob = Math.round(Math.sin(t * 3) * 1);
      g.drawImage(sp.cv, Math.round(gx - recoil), gy - Math.round(sp.h / 2) + bob);
      if (flash > 0 && d.flash) { const fr = SP.explosions().flash[d.flash][0]; g.drawImage(fr, Math.round(gx - recoil + sp.w - 1), gy + bob - Math.floor(fr.height / 2) - 1); }
      for (let k = proj.length - 1; k >= 0; k--) { const p = proj[k]; p.x += p.vx * dt; p.life -= dt; if (p.life <= 0 || p.x > 72) { proj.splice(k, 1); continue; } g.fillStyle = PAL.y; g.fillRect(Math.round(p.x), p.y + bob, 2, 1); }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderWardrobe() {
    const g = $('wardGrid');
    g.innerHTML = SP.SKINS.map((s) => {
      const stt = PG.skinStatus(s);
      const eq = S().skin === s.id;
      return `<button class="sk${stt.ok ? '' : ' is-locked'}" type="button" data-sk="${s.id}" aria-pressed="${eq}"><img alt="" src="${SP.frameURL(s.id, 'idle', 0, 5)}"><b>${esc(s.name)}</b><small>${esc(s.desc)}</small><small>${eq ? 'Equipped' : stt.ok ? 'Click to equip' : stt.buy ? `${ico('scrap')} ${esc(stt.text)}` : `${ico('lock')} ${esc(stt.text)}`}</small></button>`;
    }).join('');
    g.querySelectorAll('[data-sk]').forEach((b) => b.addEventListener('click', () => {
      const s = SP.SKINS.find((x) => x.id === b.dataset.sk);
      const stt = PG.skinStatus(s);
      if (stt.ok || (stt.buy && PG.buySkin(s))) { S().skins[s.id] = true; S().skin = s.id; WTP.persist(); AU.play(stt.buy ? 'buy' : 'select'); PG.check(); renderWardrobe(); head('wardrobe'); paintIcons($('scrWardrobe')); }
      else { AU.play('deny'); label2(stt.buy ? `Need ${fmtInt(stt.cost - S().scrap)} more scrap` : `Locked: ${stt.text}`); }
    }));
    paintIcons(g);
    let f = 0;
    const animT = setInterval(() => {
      if (cur !== 'wardrobe' || document.hidden) { if (cur !== 'wardrobe') clearInterval(animT); return; }
      f++;
      g.querySelectorAll('.sk').forEach((b) => {
        const s = b.dataset.sk;
        const pressed = b.getAttribute('aria-pressed') === 'true';
        const anim = pressed ? 'victory' : (f >> 3) % 3 === 2 ? 'run' : 'idle';
        const n = SP.playerFrames(s).anims[anim].length;
        b.querySelector('img').src = SP.frameURL(s, anim, f % n, 5);
      });
    }, 150);
  }
  function renderTrophies() {
    const got = Object.keys(S().achievements).length;
    $('trophGrid').innerHTML = `<div class="troph-sum" style="grid-column:1/-1">${got} of ${PG.ACH.length} trophies unlocked. Each one pays out scrap.</div>` + PG.ACH.map((a) => {
      const ok = !!S().achievements[a.id];
      return `<div class="tr${ok ? ' is-got' : ''}"><span class="ti">${ico(ok ? a.icon : 'lock')}</span><span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small><small>${ok ? 'Unlocked' : `Reward ${fmtInt(a.r)} scrap`}</small></span></div>`;
    }).join('');
    $('trophGrid').querySelectorAll('.tr').forEach((t) => t.style.setProperty('color', 'var(--text)'));
  }
  function renderStats() {
    const s = S().stats;
    const fav = Object.entries(s.weaponUse || {}).sort((a, b) => b[1] - a[1])[0];
    const cells = [
      ['Pixels wrecked', fmtInt(s.pixels)], ['Time wrecking', WTP.fmtClock(s.time)], ['Runs', fmtInt(s.runs)], ['Wins', fmtInt(s.wins)],
      ['Best combo', fmtInt(s.bestCombo)], ['Shots fired', fmtInt(s.shots)], ['Explosions', fmtInt(s.explosions)], ['Letters freed', fmtInt(s.letters)],
      ['Chunks dropped', fmtInt(s.chunks)], ['Glass shattered', fmtInt(s.glass)], ['Pixels burned', fmtInt(s.burned)], ['Ice shattered', fmtInt(s.iced)],
      ['Pixels painted', fmtInt(s.painted)], ['Enemies popped', fmtInt(s.kills)], ['Best wave', fmtInt(s.bestWave)], ['Jumps', fmtInt(s.jumps)],
      ['Wall jumps', fmtInt(s.walljumps)], ['Dashes', fmtInt(s.dashes)], ['Distance run', `${fmtInt(s.distance / 50)} m`], ['Black hole meals', fmtInt(s.eaten)],
      ['Nukes', fmtInt(s.nukes)], ['Scrap earned', fmtInt(s.scrapEarned)], ['Favourite weapon', fav ? WP.BY[fav[0]]?.name || '-' : '-'], ['Dailies done', fmtInt(s.dailies)]
    ];
    $('statsGrid').innerHTML = cells.map(([k, v]) => `<div class="px-panel st-cell"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join('') + `<div class="px-panel st-cell"><b>Danger zone</b><span>Wipes every unlock, record and stat.</span><div class="px-row" style="margin-top:10px"><button class="px-btn px-btn--ghost" type="button" id="resetAll">${ico('reset')}<span>Reset progress</span></button></div></div>`;
    $('resetAll').addEventListener('click', async () => {
      const v = C.modal ? await C.modal({ emoji: '💣', title: 'Reset everything?', body: 'All weapons, skins, stars, records and stats will be wiped. This cannot be undone.', buttons: [{ label: 'Keep my stuff', value: 'no' }, { label: 'Wipe it', value: 'yes' }] }) : 'no';
      if (v !== 'yes') return;
      const fresh = WTP.freshSave();
      for (const k of Object.keys(S())) delete S()[k];
      Object.assign(S(), fresh);
      WTP.persist(true);
      AU.play('boom', 30);
      render('stats');
    });
  }
  const KEY_LABELS = { left: 'Move left', right: 'Move right', jump: 'Jump', down: 'Drop / fast fall', dash: 'Dash', fire: 'Fire (keyboard)', alt: 'Alt fire', melee: 'Kick (always available)', gadget: 'Use gadget', prev: 'Previous weapon', next: 'Next weapon', wheel: 'Weapons menu / wheel', reset: 'Restart', pause: 'Pause' };
  const keyName = (c) => (c || '-').replace(/^Key/, '').replace(/^Digit/, '').replace('ArrowLeft', '←').replace('ArrowRight', '→').replace('ArrowUp', '↑').replace('ArrowDown', '↓').replace('ShiftLeft', 'Shift').replace('ShiftRight', 'R Shift').replace('Space', 'Space').replace('Escape', 'Esc');
  function renderSettings() {
    const st = S().settings;
    const seg = (key, opts) => `<span class="seg" role="group">${opts.map(([v, l]) => `<button type="button" data-set="${key}" data-v="${v}" aria-pressed="${String(st[key]) === String(v)}">${l}</button>`).join('')}</span>`;
    const tog = (key) => seg(key, [[true, 'On'], [false, 'Off']]);
    $('setsBody').innerHTML = `
      <div class="px-panel set-group"><h3 class="px-h3">Sound</h3>
        <div class="set-row"><label>Music</label>${seg('music', [[0, '0'], [0.3, '30'], [0.6, '60'], [1, '100']])}</div>
        <div class="set-row"><label>Effects</label>${seg('sfx', [[0, '0'], [0.4, '40'], [0.8, '80'], [1, '100']])}</div>
        <div class="set-row"><label>Mute all</label><span class="c-muted">Use the speaker in the top bar</span></div>
      </div>
      <div class="px-panel set-group"><h3 class="px-h3">Juice</h3>
        <div class="set-row"><label>Screen shake</label>${seg('shake', [[0, 'Off'], [0.5, '50%'], [1, '100%'], [1.5, '150%']])}</div>
        <div class="set-row"><label>Particles</label>${seg('particles', [[0, 'Low'], [1, 'Med'], [2, 'High']])}</div>
        <div class="set-row"><label>Flashes and colour split</label>${tog('flashes')}</div>
        <div class="set-row"><label>Adaptive quality</label>${tog('adaptive')}</div>
        <div class="set-row"><label>Vibration</label>${tog('haptics')}</div>
        <div class="set-row"><label>Show FPS</label>${tog('fps')}</div>
      </div>
      <div class="px-panel set-group"><h3 class="px-h3">Weapons</h3>
        <div class="set-row"><label>Tab opens</label>${seg('radial', [[false, 'Grid menu'], [true, 'Radial wheel']])}</div>
        <div class="set-row"><label>Switch weapons</label><span>Q / E, mouse wheel, 1 to 0</span></div>
      </div>
      <div class="px-panel set-group"><h3 class="px-h3">Touch controls</h3>
        <div class="set-row"><label>Aiming</label>${seg('touchAim', [['auto', 'Auto + drag'], ['stick', 'Twin stick']])}</div>
        <div class="set-row"><label>Button size</label>${seg('touchSize', [[0.8, 'S'], [1, 'M'], [1.25, 'L']])}</div>
        <div class="set-row"><label>Opacity</label>${seg('touchAlpha', [[0.3, '30%'], [0.55, '55%'], [0.85, '85%']])}</div>
        <div class="set-row"><label>Buttons on the left</label>${tog('touchSwap')}</div>
      </div>
      <div class="px-panel set-group"><h3 class="px-h3">Aiming and touchpad</h3>
        <div class="set-row"><label>Click toggles fire (no holding)</label>${tog('toggleFire')}</div>
        <div class="set-row"><label>Aim assist</label>${seg('aimAssist', [[0, 'Off'], [1, 'Light'], [2, 'Strong']])}</div>
        <div class="set-row"><label>Colourblind-safe colours</label>${tog('colorblind')}</div>
        <div class="set-row"><label>Keyboard aim</label><span><span class="key">I</span><span class="key">J</span><span class="key">K</span><span class="key">L</span> or auto</span></div>
        <div class="set-row"><label>Lock fire on/off</label><span class="key">V</span></div>
      </div>
      <div class="px-panel set-group"><h3 class="px-h3">Keys</h3>
        ${Object.keys(KEY_LABELS).map((a) => `<div class="set-row"><label>${KEY_LABELS[a]}</label><button class="keybtn" type="button" data-key="${a}">${esc(keyName(S().keys[a]?.[0]))}</button></div>`).join('')}
        <div class="set-row"><span></span><button class="px-btn px-btn--ghost" type="button" id="keysReset">${ico('reset')}<span>Default keys</span></button></div>
      </div>`;
    $('setsBody').querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.set;
      let v = b.dataset.v;
      v = v === 'true' ? true : v === 'false' ? false : isNaN(Number(v)) ? v : Number(v);
      st[k] = v;
      WTP.persist();
      AU.setVolumes();
      applyTheme();
      applyTouch();
      AU.play('select');
      renderSettings();
      paintIcons($('setsBody'));
      const again = $('setsBody').querySelector(`[data-set="${k}"][data-v="${b.dataset.v}"]`);
      again && again.focus({ preventScroll: true });
    }));
    $('setsBody').querySelectorAll('[data-key]').forEach((b) => b.addEventListener('click', () => {
      b.classList.add('is-wait'); b.textContent = 'Press a key';
      I.capture = (code) => {
        b.classList.remove('is-wait');
        if (code !== 'Escape' || b.dataset.key === 'pause') {
          const a = b.dataset.key;
          for (const other in S().keys) S().keys[other] = S().keys[other].filter((c) => c !== code);
          S().keys[a] = [code, ...S().keys[a].filter((c) => c !== code)].slice(0, 3);
          WTP.persist();
        }
        renderSettings(); paintIcons($('setsBody'));
      };
    }));
    $('keysReset').addEventListener('click', () => { S().keys = JSON.parse(JSON.stringify(WTP.DEFAULT_KEYS)); WTP.persist(); renderSettings(); paintIcons($('setsBody')); });
  }
  function renderHelp() {
    const k = (a) => `<span class="key">${esc(keyName(S().keys[a]?.[0]))}</span>`;
    const EN = WTP.enemies;
    const best = EN.ORDER.map((t) => { const T = EN.TYPES[t]; return `<div class="bst"><img alt="" src="${EN.portrait(t, t === 'modal' || t === 'algo' ? 2 : 3)}"><span><b>${esc(T.name)}</b><small>${esc(T.desc)}</small></span></div>`; }).join('');
    $('helpBody').innerHTML = `
      <div class="px-panel"><h3 class="px-h3">Keyboard and mouse</h3><ul>
        <li>${k('left')} ${k('right')} run, ${k('jump')} jump, again in the air to double jump</li>
        <li>Slide down walls, jump off them to wall jump</li>
        <li>${k('dash')} dashes (you are invincible while dashing)</li>
        <li>${k('melee')} kicks in your aim direction. Every loadout has it, so you can always dig yourself out</li>
        <li>${k('gadget')} uses your gadget (jetpack, grappling hook, glider and more)</li>
        <li>Aim with the mouse, click to fire</li>
        <li>${k('prev')} ${k('next')}, mouse wheel or <span class="key">1</span>-<span class="key">0</span> switch weapons</li>
        <li>${k('wheel')} opens the weapons menu: equip anything you own and assign it to a hotbar slot</li>
        <li>${k('alt')} or right click: alt fire, ${k('reset')} restart, ${k('pause')} pause, <span class="key">+</span> <span class="key">-</span> or pinch to zoom</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">Touchpad or keyboard only</h3><ul>
        <li>Aim with <span class="key">I</span> <span class="key">J</span> <span class="key">K</span> <span class="key">L</span>, or do nothing and auto aim finds the nearest stuff</li>
        <li>Fire with ${k('fire')} or <span class="key">Enter</span>, <span class="key">V</span> locks fire on so you never hold anything</li>
        <li>One swipe of two fingers switches exactly one weapon</li>
        <li>Turn on Touchpad mode in the top bar: click once to start firing, click again to stop</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">Touch</h3><ul>
        <li>Touch anywhere on the left side to get a joystick</li><li>Hold the big fire button to fire with auto aim, drag it to aim yourself</li><li>Buttons for jump, kick, dash and your gadget</li><li>Tap the weapon to cycle, tap the grid for the weapons menu</li><li>Settings: button size, opacity, twin stick aiming, left handed layout</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">Gamepad</h3><ul>
        <li>Left stick move, right stick aim, RT fire, LT alt</li><li>A jump, B dash, X kick, stick clicks gadget</li><li>LB RB switch, Y weapons menu, Start pauses</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">How pages break</h3><ul>
        <li>Paper and text break in one hit. Letters pop off and fall</li>
        <li>Glass shatters all at once. Wood takes a couple of hits and splinters. Metal dents first and needs real force. Stone cracks</li>
        <li>Buttons pop off and do whatever they say: buy, delete, download, subscribe...</li>
        <li>Videos play when hit, cars in ads drive off, barrels explode, crates and safes hold scrap</li>
        <li>Behind the page content is the page background, behind that its source code, and behind that your desktop. Big hits punch through all of it</li>
        <li>Loose debris is soft: walk through it or stand on it. You can always kick your way out</li>
        <li>Three secret floppy disks hide inside every page. Dig for them</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">Weapons and gadgets</h3><ul>
        <li>Every weapon does one thing nothing else does. Read its line in the Armory</li>
        <li>Upgrade weapons up to level 4 with scrap: bigger holes, more damage, faster cooldowns</li>
        <li>Gadgets have their own slot: Spring Boots, Grappling Hook, Jetpack, Paper Glider, Wall Claws, Bounce Pads, Blast Boots, Blink Drive</li>
        <li>Every 25 pixels wrecked is 1 scrap</li></ul></div>
      <div class="px-panel help-best"><h3 class="px-h3">The page fights back</h3><div class="best-grid">${best}</div></div>`;
  }
  function showLoading(on) {
    const l = $('loading');
    l.hidden = !on;
    if (!on) return;
    const cv = $('loadCv'), g = cv.getContext('2d');
    let t = 0;
    const tick = () => {
      if (l.hidden) return;
      t++;
      g.clearRect(0, 0, 64, 32);
      g.fillStyle = PAL['3'];
      for (let x = 0; x < 64; x += 4) if (((x / 4 + t / 3) | 0) % 3 !== 0) g.fillRect(x, 28, 3, 2);
      const f = SP.playerFrames(S().skin).anims.run;
      g.drawImage(f[(t >> 2) % f.length].r, 22, 4);
      for (let k = 0; k < 6; k++) { g.fillStyle = [PAL.y, PAL.o, PAL.e, PAL.c, PAL.l, PAL.k][k]; g.fillRect(((t * 2 + k * 11) % 70) - 4, 8 + ((k * 7 + t) % 14), 2, 2); }
      requestAnimationFrame(tick);
    };
    tick();
  }
  let launching = false;
  async function launch(opts) {
    if (launching) return;
    launching = true;
    ensureAudio();
    lastOpts = opts;
    wipe(async () => {
      showLoading(true);
      try { await G.start(opts); } catch (e) { console.warn(e); }
      showLoading(false);
      launching = false;
    });
  }
  let lastOpts = null;
  U.showStage = (on) => {
    $('stage').hidden = !on;
    $('app').hidden = on;
    if (on) { WTP.title.stop(); clearInterval(sidePrev); }
    else { WTP.title.start(); AU.music('title'); AU.muffle(false); render(cur); }
  };

  U.hudSetup = (run) => {
    const h = run.hud || {};
    $('hud').classList.toggle('is-min', !!h.minimal);
    $('hudMeter').hidden = !h.pct;
    $('hudStats').hidden = false;
    $('hudScoreW').hidden = h.score === false;
    $('hudTimeL').textContent = h.countdown ? 'left' : 'time';
    const goal = run.goal || (h.goal) || 0;
    $('hudGoal').style.display = goal && goal <= 100 ? '' : 'none';
    $('hudGoal').style.left = `${goal}%`;
    $('hudFinish').hidden = SIMPLE || !(run.modeId === 'free' || run.modeId === 'zen');
    $('hudWheel').hidden = SIMPLE; $('tMenu').hidden = SIMPLE;
    $('resultsOvl').hidden = true; $('pauseOvl').hidden = true; $('wheel').hidden = true; $('radial').hidden = true;
    $('announce').innerHTML = '';
    U.hud(run);
  };
  let lastHud = '';
  U.hud = (run) => {
    const h = run.hud || {};
    const pct = MD.pct();
    const key = `${pct.toFixed(1)}|${Math.floor(run.t)}|${Math.round(run.score)}|${WTP.player.hp}|${run.wave}|${run.targetsDown}`;
    if (key === lastHud) return;
    lastHud = key;
    $('hudPct').textContent = `${pct.toFixed(pct < 10 ? 1 : 0)}%`;
    $('hudBar').style.width = `${Math.min(100, pct)}%`;
    $('hudBar').parentElement.classList.toggle('is-hot', run.goal && pct >= run.goal * 0.85);
    const t = h.countdown ? Math.max(0, (run.limit || 60) - run.t) : run.t;
    $('hudTime').textContent = WTP.fmtClock(Math.ceil(h.countdown ? t : Math.floor(t)));
    $('hudTimeW').classList.toggle('is-warn', !!h.countdown && t <= 10);
    $('hudScore').textContent = fmtInt(run.score);
    const ex = $('hudExtra');
    const parts = [];
    if (h.hp) {
      const P = WTP.player;
      parts.push(`<span class="hearts">${Array.from({ length: P.maxHp }, (_, i) => `<img alt="" class="${i < P.hp ? '' : 'off'}" src="${enemyImg('heart', 3)}">`).join('')}</span>`);
    }
    if (h.wave) parts.push(`<b>WAVE ${run.wave || 1}${run.maxWave ? `/${run.maxWave}` : ''}</b>`);
    if (h.targets) parts.push(`${ico('target')}<b>${run.targetsDown || 0}/${run.targetsTotal || 0}</b>`);
    ex.hidden = !parts.length;
    if (parts.length) { ex.innerHTML = parts.join(''); paintIcons(ex); }
  };
  U.tick = () => { if (G.run) U.gadgetHud(); };
  U.hudWeapons = (slots, curId) => {
    const hb = $('hotbar');
    const ammo = WP.ammo();
    const n = Math.max(slots.length, G.run?.hotbarMode ? 10 : 0);
    let html = '';
    for (let i = 0; i < Math.min(n, 10); i++) {
      const id = slots[i];
      const num = (i + 1) % 10;
      if (!id) { html += `<button class="w-cell is-empty" type="button" data-slot="${i}" aria-label="Empty slot ${num}, open the weapons menu" title="Empty slot ${num}"><span class="n">${num}</span><span class="plus">+</span></button>`; continue; }
      const a = ammo ? ammo[id] : null;
      const lv = WP.upg(id);
      html += `<button class="w-cell" type="button" data-w="${id}" data-slot="${i}" aria-pressed="${id === curId}" aria-label="${esc(WP.BY[id].name)}" title="${esc(WP.BY[id].name)} (${num})"><span class="n">${num}</span><img alt="" src="${wImg(id, 3)}">${lv ? lvPips(lv) : ''}${a != null ? `<span class="am${a <= 0 ? ' is-zero' : ''}">${a}</span>` : ''}</button>`;
    }
    const inBar = slots.includes(curId);
    if (!inBar && curId) html += `<button class="w-cell is-extra" type="button" data-w="${curId}" aria-pressed="true" aria-label="${esc(WP.BY[curId].name)} (not on the hotbar)" title="${esc(WP.BY[curId].name)}"><span class="n">*</span><img alt="" src="${wImg(curId, 3)}"></button>`;
    hb.innerHTML = html;
    hb.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { G.selectWeapon(b.dataset.w); $('cv').focus({ preventScroll: true }); }));
    hb.querySelectorAll('.is-empty').forEach((b) => b.addEventListener('click', () => U.wheel(true, Number(b.dataset.slot))));
    const d = WP.BY[curId];
    if (!d) return;
    $('hudAlt').hidden = !d.alt; $('tAlt').hidden = !d.alt;
    const tc = $('tWpnCv'), g = tc.getContext('2d');
    g.clearRect(0, 0, 40, 20); g.imageSmoothingEnabled = false;
    g.drawImage(d.sprite.cv, Math.round(20 - d.sprite.w / 2), Math.round(10 - d.sprite.h / 2));
    U.gadgetHud(true);
  };
  let gadLast = '';
  U.gadgetHud = (force) => {
    const GDm = WTP.gadgets;
    const id = GDm.curId();
    const cd = GDm.cooldown(), fuel = GDm.fuel();
    const key = `${id}|${cd > 0 ? Math.ceil(cd * 10) : 0}|${Math.round(fuel * 20)}`;
    if (!force && key === gadLast) return;
    gadLast = key;
    const d = GDm.BY[id];
    for (const cvId of ['gadCv', 'tGadCv']) {
      const cv = $(cvId); if (!cv) continue;
      const g = cv.getContext('2d');
      g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false;
      g.drawImage(d.sprite.cv, Math.round((cv.width - d.sprite.w) / 2), Math.round((cv.height - d.sprite.h) / 2));
    }
    $('gadKey').textContent = keyName(S().keys.gadget?.[0]);
    $('kickKey').textContent = keyName(S().keys.melee?.[0]);
    const bar = $('gadBar');
    const k = id === 'jetpack' ? fuel : cd > 0 ? 1 - cd / 1.2 : 1;
    bar.style.width = `${Math.round(Math.max(0, Math.min(1, k)) * 100)}%`;
    $('gadBtn').title = `${d.name}: ${d.tip}`;
    $('gadBtn').setAttribute('aria-label', `Gadget: ${d.name}`);
  };
  let wnT = 0;
  U.weaponName = (d) => { const n = $('wname'); n.textContent = `${d.name}: ${d.tip}`; n.classList.add('is-on'); clearTimeout(wnT); wnT = setTimeout(() => n.classList.remove('is-on'), 1600); };
  U.label = (text, ms = 1200) => { const n = $('wname'); n.textContent = text; n.classList.add('is-on'); clearTimeout(wnT); wnT = setTimeout(() => n.classList.remove('is-on'), ms); };
  function label2(text) { if (G.playing) U.label(text); else if (C.toast) C.toast(text); }
  const RAMPS = [['7', '6', '5'], ['7', 'Y', 'y', 'a'], ['7', 'Y', 'y', 'a', 'o'], ['Y', 'y', 'a', 'o', 'e'], ['7', 'K', 'k', 'P', 'p'], ['7', 'C', 'c', 'b', 'n'], ['Y', 'y', 'o', 'e', 'R', 'r'], ['7', 'L', 'l', 'G', 'g'], ['7', 'Y', 'k', 'P', 'n']];
  U.announce = (text, tier = 2) => {
    const box = $('announce');
    const t = WTP.font.textCanvas(text, { big: true, outline: '0', ramp: RAMPS[Math.min(RAMPS.length - 1, tier)], depth: 2, depthColor: '0' });
    const scale = Math.max(2, Math.min(Math.floor((window.innerWidth * 0.92) / t.w), 3 + Math.min(2, tier >> 2)));
    const c = document.createElement('canvas');
    c.width = t.w; c.height = t.h;
    c.getContext('2d').drawImage(t.cv, 0, 0);
    c.style.width = `${t.w * scale}px`; c.style.height = `${t.h * scale}px`;
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', text);
    box.innerHTML = '';
    box.append(c);
  };

  let wheelCat = 'all', wmPick = null, wmSlot = null;
  U.wheelOpen = () => !$('wheel').hidden || !$('radial').hidden;
  U.wheel = (open, slot) => {
    if (open && SIMPLE) { G.cycle(1); return; }
    if (open && S().settings.radial && slot === undefined && $('radial').hidden) return U.radial(true);
    const w = $('wheel');
    if (!open) { w.hidden = true; $('radial').hidden = true; wmPick = null; wmSlot = null; $('cv').focus({ preventScroll: true }); return; }
    if (!G.run || G.run.ended) return;
    $('radial').hidden = true;
    I.pointerFire = false;
    w.hidden = false;
    wmSlot = slot ?? null;
    wmPick = null;
    renderMenu();
    AU.play('select');
  };
  function renderMenu() {
    const box = $('wheelRing');
    const avail = G.available();
    const canAssign = !!G.run?.hotbarMode;
    const cats = [{ id: 'all', short: 'All', icon: 'gun' }, ...WP.CATS.filter((c) => avail.some((id) => WP.BY[id].cat === c.id))];
    if (!cats.some((c) => c.id === wheelCat)) wheelCat = 'all';
    const list = avail.filter((id) => wheelCat === 'all' || WP.BY[id].cat === wheelCat);
    const slots = G.slots();
    const hint = canAssign ? (wmPick ? `Now pick a slot for ${WP.BY[wmPick].name} (or press 1 to 0)` : wmSlot != null ? `Pick a weapon for slot ${(wmSlot + 1) % 10}` : 'Click a weapon to equip it. Then click a slot below, or press 1 to 0, to put it on your hotbar.') : 'This loadout is fixed for this level. Click a weapon to equip it.';
    const owned = WTP.gadgets.DEFS.filter((d) => WTP.gadgets.owned(d.id));
    box.innerHTML = `<div class="wm-head"><h2 class="px-h2">Weapons</h2><span class="wm-count">${avail.length} owned</span><button class="px-ib wm-close" type="button" aria-label="Close menu">${ico('cross')}</button></div>
      <div class="wm-cats">${cats.map((c) => `<button class="wm-cat" type="button" data-cat="${c.id}" aria-pressed="${c.id === wheelCat}">${ico(c.icon)}<span>${esc(c.short || c.name)}</span></button>`).join('')}</div>
      <div class="wm-grid">${list.map((id) => { const d = WP.BY[id]; const sl = slots.indexOf(id); const lv = WP.upg(id); return `<button class="wm-w${id === wmPick ? ' is-pick' : ''}" type="button" data-w="${id}" aria-pressed="${id === WP.st.cur}" title="${esc(d.does || d.tip)}"><img alt="" src="${wImg(id, 2)}"><span>${esc(d.name)}</span>${sl >= 0 ? `<em>${(sl + 1) % 10}</em>` : ''}${lv ? lvPips(lv) : ''}</button>`; }).join('')}</div>
      <p class="wm-hint">${esc(hint)}</p>
      ${canAssign ? `<div class="wm-slots">${slots.map((id, i) => `<button class="wm-slot${i === wmSlot ? ' is-pick' : ''}" type="button" data-slot="${i}" aria-label="Slot ${(i + 1) % 10}${id ? `: ${esc(WP.BY[id].name)}` : ', empty'}"><span class="n">${(i + 1) % 10}</span>${id ? `<img alt="" src="${wImg(id, 2)}">` : ''}</button>`).join('')}<button class="wm-slot wm-clear" type="button" data-clear="1" aria-label="Clear the picked slot" title="Clear slot">${ico('cross')}</button></div>` : ''}
      ${owned.length > 1 ? `<div class="wm-gads"><span>Gadget</span>${owned.map((d) => `<button class="wm-g" type="button" data-g="${d.id}" aria-pressed="${WTP.gadgets.curId() === d.id}" title="${esc(d.name)}"><img alt="" src="${gImg(d.id, 3)}"></button>`).join('')}</div>` : ''}
      ${I.isTouch ? '' : '<small class="wm-keys">Arrows move · Enter equip · 1 to 0 assign · Q E category · Esc close</small>'}`;
    paintIcons(box);
    box.querySelector('.wm-close').addEventListener('click', () => U.wheel(false));
    box.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { wheelCat = b.dataset.cat; AU.play('hover'); renderMenu(); box.querySelector(`[data-cat="${wheelCat}"]`)?.focus(); }));
    box.querySelectorAll('[data-w]').forEach((b) => {
      b.addEventListener('click', () => {
        const id = b.dataset.w;
        G.selectWeapon(id);
        if (wmSlot != null && canAssign) { G.assignSlot(wmSlot, id); AU.play('buy'); wmSlot = null; wmPick = null; U.wheel(false); return; }
        if (canAssign) { wmPick = id; renderMenu(); box.querySelector(`[data-w="${id}"]`)?.focus(); }
        else U.wheel(false);
      });
      b.addEventListener('focus', () => { AU.play('hover'); b.dataset.focus = '1'; });
      b.addEventListener('dblclick', () => U.wheel(false));
    });
    box.querySelectorAll('[data-slot]').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.slot);
      if (wmPick) { G.assignSlot(i, wmPick); AU.play('buy'); G.label(`${WP.BY[wmPick].name.toUpperCase()} IN SLOT ${(i + 1) % 10}`, 900); wmPick = null; wmSlot = null; renderMenu(); return; }
      wmSlot = wmSlot === i ? null : i; AU.play('hover'); renderMenu();
    }));
    box.querySelector('[data-clear]')?.addEventListener('click', () => { if (wmSlot != null) { G.assignSlot(wmSlot, null); AU.play('back'); renderMenu(); } else G.label('PICK A SLOT FIRST, THEN CLEAR IT', 900); });
    box.querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => { WTP.gadgets.equip(b.dataset.g); AU.play('select'); U.gadgetHud(true); renderMenu(); }));
    const f = box.querySelector('.wm-w.is-pick') || box.querySelector('.wm-w[aria-pressed="true"]') || box.querySelector('.wm-w');
    f && f.focus({ preventScroll: true });
  }
  U.menuKey = (code) => {
    if (!/^Digit[0-9]$/.test(code) || !G.run?.hotbarMode) return false;
    const n = Number(code.slice(5)), i = n === 0 ? 9 : n - 1;
    const foc = document.activeElement?.dataset?.w;
    const id = wmPick || foc;
    if (!id) return false;
    G.assignSlot(i, id); G.selectWeapon(id, true); AU.play('buy'); G.label(`${WP.BY[id].name.toUpperCase()} IN SLOT ${n}`, 900);
    wmPick = null; renderMenu();
    return true;
  };
  let radSel = -1;
  U.radial = (open) => {
    const r = $('radial');
    if (!open) { r.hidden = true; $('cv').focus({ preventScroll: true }); return; }
    if (!G.run || G.run.ended) return;
    I.pointerFire = false;
    r.hidden = false;
    const slots = G.slots();
    const n = 10;
    radSel = Math.max(0, slots.indexOf(WP.st.cur));
    const ring = $('radRing');
    ring.innerHTML = slots.slice(0, n).map((id, i) => {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return `<button class="rad-slot${id ? '' : ' is-empty'}" type="button" data-i="${i}" ${id ? `data-w="${id}"` : ''} aria-pressed="${i === radSel}" style="left:${50 + Math.cos(a) * 38}%;top:${50 + Math.sin(a) * 38}%" aria-label="${id ? esc(WP.BY[id].name) : 'Empty slot'}"><span class="n">${(i + 1) % 10}</span>${id ? `<img alt="" src="${wImg(id, 3)}">` : '<span class="plus">+</span>'}</button>`;
    }).join('') + `<div class="rad-center px-panel"><b id="radName"></b><small id="radDoes"></small><button class="px-btn px-btn--ghost" type="button" id="radMenu">${ico('grid')}<span>All weapons</span></button></div>`;
    paintIcons(ring);
    const pickI = (i) => { radSel = i; ring.querySelectorAll('.rad-slot').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.i) === i))); const id = slots[i]; $('radName').textContent = id ? WP.BY[id].name : `Slot ${(i + 1) % 10} is empty`; $('radDoes').textContent = id ? WP.BY[id].does : 'Open All weapons to fill it'; };
    const choose = (i) => { const id = slots[i]; if (id) { G.selectWeapon(id); U.radial(false); } else { r.hidden = true; U.wheel(true, i); } };
    ring.querySelectorAll('.rad-slot').forEach((b) => { b.addEventListener('click', () => choose(Number(b.dataset.i))); b.addEventListener('pointerenter', () => pickI(Number(b.dataset.i))); });
    $('radMenu').addEventListener('click', () => { r.hidden = true; U.wheel(true, null); });
    r.onpointermove = (e) => { const rr = ring.getBoundingClientRect(); const dx = e.clientX - (rr.left + rr.width / 2), dy = e.clientY - (rr.top + rr.height / 2); if (Math.hypot(dx, dy) < rr.width * 0.18) return; const a = Math.atan2(dy, dx) + Math.PI / 2; const i = ((Math.round((a / (Math.PI * 2)) * n) % n) + n) % n; if (i !== radSel) { pickI(i); AU.play('hover'); } };
    U.radialPick = () => choose(radSel);
    U.radialStep = (d) => pickI((radSel + d + n) % n);
    pickI(radSel);
    AU.play('select');
  };
  $('wheel').addEventListener('click', (e) => { if (e.target.id === 'wheel') U.wheel(false); });
  $('radial').addEventListener('click', (e) => { if (e.target.id === 'radial') U.radial(false); });
  U.pauseMenu = (on) => {
    const o = $('pauseOvl');
    o.hidden = !on;
    if (!on) return;
    const run = G.run;
    const lv = run.opts.campaign;
    if (SIMPLE) {
      $('pauseCard').innerHTML = `<h2 class="px-h2">Paused</h2><p class="px-p">${esc(run.page.site)}</p>
        <div class="ovl-btns">
          <button class="px-btn" type="button" data-p="resume">${ico('play')}<span>Resume</span></button>
          <button class="px-btn px-btn--ghost" type="button" data-p="nextpage">${ico('page')}<span>Next page</span></button>
          <button class="px-btn px-btn--ghost" type="button" data-p="restart">${ico('reset')}<span>Restart</span></button>
          ${C.setTouchpad && !I.isTouch ? `<button class="px-btn px-btn--ghost" type="button" data-p="pad">${ico('alt')}<span>Touchpad mode: ${C.touchpad ? 'ON' : 'OFF'}</span></button>` : ''}
          <button class="px-btn px-btn--ghost" type="button" data-p="quit">${ico('home')}<span>Title screen</span></button>
        </div>
        <p class="px-p" style="margin-top:14px">${I.isTouch ? 'Left side moves. Hold the orange button to fire, drag it to aim.' : `Move ${esc(keyName(S().keys.left[0]))}${esc(keyName(S().keys.right[0]))} · jump ${esc(keyName(S().keys.jump[0]))} · aim with the mouse · click to fire · 1 to 6 swap · ${esc(keyName(S().keys.melee[0]))} kick`}</p>`;
    } else $('pauseCard').innerHTML = `<h2 class="px-h2">Paused</h2><p class="px-p">${esc(run.page.site)} · ${esc(run.mode.name)}${lv ? ` · ${esc(lv.name)}` : ''}</p>
      <div class="ovl-btns">
        <button class="px-btn" type="button" data-p="resume">${ico('play')}<span>Resume</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-p="weapons">${ico('grid')}<span>Weapons and gadget</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-p="restart">${ico('reset')}<span>Restart</span></button>
        ${run.modeId === 'free' || run.modeId === 'zen' ? `<button class="px-btn px-btn--ghost" type="button" data-p="finish">${ico('flag')}<span>Finish and see results</span></button>` : ''}
        ${C.setTouchpad && !I.isTouch ? `<button class="px-btn px-btn--ghost" type="button" data-p="pad">${ico('alt')}<span>Touchpad mode: ${C.touchpad ? 'ON' : 'OFF'}</span></button>` : ''}
        <button class="px-btn px-btn--ghost" type="button" data-p="fire">${ico('alt')}<span>Click toggles fire: ${S().settings.toggleFire ? 'ON' : 'OFF'}</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-p="assist">${ico('target')}<span>Aim assist: ${['OFF', 'LIGHT', 'STRONG'][S().settings.aimAssist]}</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-p="quit">${ico('home')}<span>Quit to menu</span></button>
      </div>
      <p class="px-p" style="margin-top:14px">Keys: ${esc(keyName(S().keys.jump[0]))} jump · ${esc(keyName(S().keys.dash[0]))} dash · IJKL aim · ${esc(keyName(S().keys.fire[0]))} fire · V lock fire</p>`;
    paintIcons(o);
    o.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => {
      const a = b.dataset.p;
      if (a === 'resume') G.pause(false);
      else if (a === 'weapons') { G.pause(false); U.wheel(true, null); }
      else if (a === 'nextpage') { o.hidden = true; G.paused = false; G.quit(); startSimple(1); }
      else if (a === 'restart') { o.hidden = true; G.paused = false; G.restart(); }
      else if (a === 'finish') { o.hidden = true; G.paused = false; G.end('finish'); }
      else if (a === 'quit') { o.hidden = true; G.paused = false; G.quit(); }
      else if (a === 'fire') { S().settings.toggleFire = !S().settings.toggleFire; WTP.persist(); U.pauseMenu(true); o.querySelector('[data-p="fire"]').focus(); }
      else if (a === 'pad') { C.setTouchpad(!C.touchpad); U.pauseMenu(true); o.querySelector('[data-p="pad"]').focus(); }
      else if (a === 'assist') { S().settings.aimAssist = (S().settings.aimAssist + 1) % 3; WTP.persist(); U.pauseMenu(true); o.querySelector('[data-p="assist"]').focus(); }
    }));
    o.querySelector('[data-p="resume"]').focus();
  };
  U.showFinish = (on) => { if (SIMPLE) return; $('hudFinish').hidden = !on && !(G.run && (G.run.modeId === 'free' || G.run.modeId === 'zen')); if (on) U.label('80% REACHED! KEEP GOING OR HIT THE FLAG TO FINISH', 2600); };
  U.closeOverlays = () => { $('pauseOvl').hidden = true; $('resultsOvl').hidden = true; $('wheel').hidden = true; $('radial').hidden = true; };

  function gradeCanvas(g) {
    const ramps = { S: ['7', 'Y', 'y', 'a', 'o', 'e'], A: ['7', 'L', 'l', 'G', 'g'], B: ['7', 'C', 'c', 'b', 'n'], C: ['7', '6', '5', '4', '3'] };
    const t = WTP.font.textCanvas(g, { big: true, outline: '0', ramp: ramps[g] || ramps.C, depth: 3, depthColor: '0' });
    const c = document.createElement('canvas');
    c.width = t.w; c.height = t.h;
    c.getContext('2d').drawImage(t.cv, 0, 0);
    c.style.width = `${t.w * 7}px`; c.style.height = `${t.h * 7}px`;
    c.setAttribute('role', 'img'); c.setAttribute('aria-label', `Grade ${g}`);
    return c;
  }
  U.results = (r) => {
    const run = r.run;
    const o = $('resultsOvl');
    o.hidden = false;
    const card = $('resCard');
    const lv = run.opts.campaign;
    const kind = run.sub ? Object.keys(MD.MODES).find((k) => MD.MODES[k] === run.sub) : run.modeId;
    const goalTxt = kind === 'targets' || kind === 'puzzle' ? 'Every target down!' : kind === 'speed' ? 'Page wrecked in time!' : 'Page wrecked!';
    const reasonTxt = { goal: goalTxt, time: "Time's up!", dead: 'You got deleted.', waves: 'All waves survived!', ammo: 'Out of ammo.', finish: run.modeId === 'zen' ? 'Namaste.' : 'Run finished.' }[run.reason] || 'Done.';
    const rows = [['Score', fmtInt(run.score)], ...r.rows, ['Best combo', fmtInt(run.maxCombo)], ['Pixels wrecked', fmtInt(WTP.world.destroyed)], ['Letters freed', fmtInt(run.stats.letters)], ['Explosions', fmtInt(run.stats.explosions)]];
    const nextLv = lv && run.won && run.opts.levelIdx < MD.CAMPAIGN.length - 1 ? run.opts.levelIdx + 1 : null;
    const bestTxt = r.best ? (r.best.isNew ? 'NEW RECORD!' : `Record: ${run.mode.fmt ? run.mode.fmt(r.best.best) : fmtInt(r.best.best)}`) : '';
    card.innerHTML = `<div class="res-top"><div class="grade" id="gradeBox"></div><div class="res-title"><b>${esc(reasonTxt)}</b><small>${esc(run.page.site)} · ${esc(lv ? lv.name : run.mode.name)}</small>${bestTxt ? `<div style="color:${r.best && r.best.isNew ? '#ffb347' : 'var(--muted)'}">${esc(bestTxt)}</div>` : ''}
      ${r.stars || lv || run.modeId === 'puzzle' ? `<div class="res-stars">${[0, 1, 2].map((k) => `<i class="${k < r.stars ? '' : 'off'}" style="animation-delay:${0.6 + k * 0.25}s">★</i>`).join('')}</div>` : ''}</div></div>
      <div class="res-rows">${rows.map(([k, v], i) => `<div style="--d:${0.2 + i * 0.08}s"><span>${esc(k)}</span><b data-tally="${esc(String(v))}">${esc(String(v))}</b></div>`).join('')}</div>
      <div class="res-reward">${ico('scrap')}<span>Scrap earned</span><b id="resScrap">+0</b>${r.bonus ? `<span>Bonus</span><b>+${fmtInt(r.bonus)}</b>` : ''}<span style="margin-left:auto">Total ${fmtInt(S().scrap)}</span></div>
      ${r.achs.length ? `<div class="res-achs">${r.achs.map((a) => `<div>${ico('trophy')}<b>${esc(a.name)}</b><span class="c-muted">+${fmtInt(a.r)}</span></div>`).join('')}</div>` : ''}
      <div class="ovl-btns">
        ${SIMPLE ? `<button class="px-btn px-btn--good" type="button" data-r="nextpage">${ico('play')}<span>Next page</span></button>` : ''}
        ${nextLv != null ? `<button class="px-btn px-btn--good" type="button" data-r="next">${ico('play')}<span>Next level</span></button>` : ''}
        <button class="px-btn" type="button" data-r="again">${ico('reset')}<span>Play again</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-r="keep">${ico('eye')}<span>Look at the wreckage</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-r="menu">${ico('home')}<span>${lv ? 'Campaign' : SIMPLE ? 'Title' : 'Menu'}</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-r="share">${ico('page')}<span>Copy result</span></button>
      </div>`;
    $('gradeBox').append(gradeCanvas(run.grade));
    paintIcons(card);
    setTimeout(() => AU.play(run.grade === 'S' ? 'gradeS' : 'stamp'), 120);
    const target = r.scrap;
    const t0 = performance.now();
    const tally = () => {
      const k = Math.min(1, (performance.now() - t0) / 900);
      const n = $('resScrap');
      if (!n) return;
      n.textContent = `+${fmtInt(target * k)}`;
      if (k < 1) { AU.play('tally'); requestAnimationFrame(tally); }
    };
    setTimeout(() => requestAnimationFrame(tally), 500);
    card.querySelectorAll('[data-tally]').forEach((b) => {
      const raw = b.dataset.tally;
      const num = Number(raw.replace(/,/g, ''));
      if (!isFinite(num) || num < 10 || /[:%]/.test(raw)) return;
      const t1 = performance.now() + 200;
      const go = () => { const k = Math.max(0, Math.min(1, (performance.now() - t1) / 700)); b.textContent = fmtInt(num * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(go); };
      requestAnimationFrame(go);
    });
    if (run.won && C.confetti) setTimeout(() => C.confetti(run.grade === 'S' ? 180 : 90), 300);
    const share = `💥 I wrecked ${run.page.site} on Zoble: Wreck This Page. Grade ${run.grade}, ${fmtInt(run.score)} points, ${fmtInt(run.maxCombo)} hit combo, ${MD.pct().toFixed(0)}% destroyed.`;
    card.querySelectorAll('[data-r]').forEach((b) => b.addEventListener('click', async () => {
      const a = b.dataset.r;
      if (a === 'again') { o.hidden = true; G.restart(); }
      else if (a === 'keep') { o.hidden = true; G.run.ended = true; I.enabled = true; AU.muffle(false); U.label('ESC OR THE PAUSE BUTTON TO LEAVE', 2400); }
      else if (a === 'menu') { o.hidden = true; G.quit(); if (lv) { history.length = 0; history.push('main'); cur = 'campaign'; for (const k in SCREENS) $(SCREENS[k]).classList.toggle('is-on', k === 'campaign'); render('campaign'); } }
      else if (a === 'next') { o.hidden = true; G.quit(); startLevel(nextLv); }
      else if (a === 'nextpage') { o.hidden = true; G.quit(); startSimple(1); }
      else if (a === 'share') { try { await navigator.clipboard.writeText(share); label2('Copied! Go brag.'); } catch (e) { label2(share); } }
    }));
    const f = card.querySelector('[data-r="nextpage"]') || card.querySelector('[data-r="next"]') || card.querySelector('[data-r="again"]');
    f && f.focus({ preventScroll: true });
  };

  const toastQ = [];
  let toastLive = 0;
  function toastAch(a) {
    if (toastLive >= 2) { toastQ.push(a); return; }
    toastLive++;
    setTimeout(() => { toastLive--; if (toastQ.length) toastAch(toastQ.shift()); }, 2600);
    let box = $('achToasts');
    if (!box) { box = el('div', 'toasts wtp-toastroot'); box.id = 'achToasts'; document.body.append(box); }
    const t = el('div', 'px-panel toast-ach', `<span class="ti">${ico(a.icon || 'trophy')}</span><span><small>${a.r ? 'Trophy unlocked' : 'Unlocked'}</small><b>${esc(a.name)}</b><small>${esc(a.desc || '')}${a.r ? ` · +${fmtInt(a.r)} scrap` : ''}</small></span>`);
    t.style.cssText = 'color:var(--text)';
    box.append(t);
    paintIcons(t);
    setTimeout(() => t.remove(), 4100);
  }
  WTP.on('achievement', (a) => { AU.play('achievement'); toastAch(a); });

  function ensureAudio() {
    if (audioOn) return;
    audioOn = true;
    try { C.audioContext && C.audioContext(); } catch (e) { }
    AU.setVolumes();
    if (!G.playing) AU.music('title');
  }
  function focusables() {
    const scope = !$('stage').hidden ? ($('resultsOvl').hidden ? ($('pauseOvl').hidden ? ($('radial').hidden ? $('wheel') : $('radial')) : $('pauseOvl')) : $('resultsOvl')) : $(SCREENS[cur]);
    return [...scope.querySelectorAll('button:not([disabled]), textarea')].filter((e) => e.offsetParent !== null);
  }
  function spatial(dir, sel) {
    const list = focusables().filter((e) => !sel || e.matches(sel));
    if (!list.length) return;
    const a = document.activeElement;
    if (!list.includes(a)) { list[0].focus(); return; }
    const r0 = a.getBoundingClientRect();
    const cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
    let best = null, bd = 1e9;
    for (const e of list) {
      if (e === a) continue;
      const r = e.getBoundingClientRect();
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      const dx = x - cx, dy = y - cy;
      const ok = dir === 'up' ? dy < -4 : dir === 'down' ? dy > 4 : dir === 'left' ? dx < -4 : dx > 4;
      if (!ok) continue;
      const main = dir === 'up' || dir === 'down' ? Math.abs(dy) : Math.abs(dx);
      const side = dir === 'up' || dir === 'down' ? Math.abs(dx) : Math.abs(dy);
      const d = main + side * 2.5;
      if (d < bd) { bd = d; best = e; }
    }
    if (best) { best.focus(); best.scrollIntoView({ block: 'nearest' }); AU.play('hover'); }
  }
  U.padNav = () => {
    I.pollPad();
    if (I.take('navUp')) spatial('up');
    if (I.take('navDown')) spatial('down');
    if (I.take('navLeft')) spatial('left');
    if (I.take('navRight')) spatial('right');
    if (I.take('navOk')) { const a = document.activeElement; if (a && a.tagName === 'BUTTON') a.click(); }
    if (I.take('navBack')) {
      if (!$('stage').hidden) { if (!$('wheel').hidden || !$('radial').hidden) U.wheel(false); else if (!$('pauseOvl').hidden) G.pause(false); }
      else if (cur !== 'title' && cur !== 'main') back();
    }
    const ax = I.gpAxes;
    const now = performance.now();
    if (Math.hypot(ax[0], ax[1]) > 0.6 && now - (U.lastStick || 0) > 220) { U.lastStick = now; spatial(Math.abs(ax[0]) > Math.abs(ax[1]) ? (ax[0] > 0 ? 'right' : 'left') : (ax[1] > 0 ? 'down' : 'up')); }
  };
  function menuPadLoop() { if ($('stage').hidden && !document.hidden) U.padNav(); requestAnimationFrame(menuPadLoop); }

  window.addEventListener('keydown', (e) => {
    if (I.capture) return;
    const tg = e.target;
    const typing = tg && (tg.tagName === 'TEXTAREA' || tg.tagName === 'INPUT');
    if (!$('stage').hidden) {
      const wk = S().keys.wheel || [];
      if (!$('radial').hidden) {
        if (e.code === 'Escape') { e.preventDefault(); U.radial(false); return; }
        if (wk.includes(e.code) || e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); U.radialPick(); return; }
        if (e.code === 'ArrowRight' || e.code === 'ArrowDown' || e.code === 'KeyE') { e.preventDefault(); U.radialStep(1); AU.play('hover'); }
        if (e.code === 'ArrowLeft' || e.code === 'ArrowUp' || e.code === 'KeyQ') { e.preventDefault(); U.radialStep(-1); AU.play('hover'); }
        if (/^Digit[0-9]$/.test(e.code)) { const n = Number(e.code.slice(5)); U.radialStep(0); const id = G.slots()[n === 0 ? 9 : n - 1]; if (id) { G.selectWeapon(id); U.radial(false); } }
        return;
      }
      if (!$('wheel').hidden) {
        if (e.code === 'Escape' || wk.includes(e.code)) { e.preventDefault(); U.wheel(false); return; }
        if (e.code.startsWith('Arrow')) { e.preventDefault(); spatial(e.code.slice(5).toLowerCase(), '.wm-w, .wm-slot, .wm-cat, .wm-g'); }
        if (e.code === 'KeyQ' || e.code === 'KeyE') {
          const cats = [...$('wheelRing').querySelectorAll('.wm-cat')];
          const i = cats.findIndex((b) => b.dataset.cat === wheelCat);
          const nb = cats[(i + (e.code === 'KeyE' ? 1 : -1) + cats.length) % cats.length];
          if (nb) nb.click();
        }
        if (/^Digit[0-9]$/.test(e.code)) { e.preventDefault(); if (!U.menuKey(e.code)) { const n = Number(e.code.slice(5)); const id = G.slots()[n === 0 ? 9 : n - 1]; if (id) { G.selectWeapon(id); U.wheel(false); } } }
        return;
      }
      if (!$('resultsOvl').hidden || !$('pauseOvl').hidden) {
        if (e.code.startsWith('Arrow')) { e.preventDefault(); spatial(e.code.slice(5).toLowerCase()); }
        if (e.code === 'Escape' && !$('pauseOvl').hidden) { e.preventDefault(); G.pause(false); }
        return;
      }
      if (G.run && G.run.ended && $('resultsOvl').hidden && (e.code === 'Escape' || e.code === 'KeyP')) { e.preventDefault(); G.quit(); }
      return;
    }
    if (typing) return;
    ensureAudio();
    if (cur === 'title' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); if (SIMPLE) startSimple(); else show('main'); return; }
    if (e.code === 'Escape' && cur !== 'title' && cur !== 'main') { e.preventDefault(); back(); return; }
    if (e.code.startsWith('Arrow')) { e.preventDefault(); spatial(e.code.slice(5).toLowerCase()); }
  });
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  function bindStatic() {
    $('tStart').addEventListener('click', () => { ensureAudio(); AU.play('title'); if (SIMPLE) startSimple(); else show('main'); });
    $('ownGo').addEventListener('click', () => {
      const t = $('ownText').value.trim();
      if (t.split(/\s+/).length < 3) { label2('Type or paste a few words first'); $('ownText').focus(); return; }
      launch({ mode: pendingMode, page: WTP.ownPage(t) });
    });
    $('hudPause').addEventListener('click', () => { if (G.run && G.run.ended && $('resultsOvl').hidden) G.quit(); else G.pause(true); });
    $('hudWheel').addEventListener('click', () => U.wheel(true));
    $('hudAlt').addEventListener('click', () => { I.press('alt'); $('cv').focus({ preventScroll: true }); });
    $('hudFinish').addEventListener('click', () => { if (G.run && !G.run.ended) G.end('finish'); });
    $('tWpn').addEventListener('click', () => { G.cycle(1); });
    $('tMenu').addEventListener('click', () => U.wheel(true, null));
    $('gadBtn').addEventListener('click', () => { I.press('gadget'); $('cv').focus({ preventScroll: true }); });
    $('kickBtn').addEventListener('click', () => { I.press('melee'); $('cv').focus({ preventScroll: true }); });
    I.bindTouch({ moveZone: $('tzMove'), joyL: $('joyL'), fire: $('tFire'), buttons: [[$('tJump'), 'jump'], [$('tDash'), 'dash'], [$('tAlt'), 'alt'], [$('tKick'), 'melee'], [$('tGad'), 'gadget']] });
    document.addEventListener('pointermove', (e) => { if (e.target.closest && e.target.closest('.px-btn, .mode-card, .pg-card, .arm-cell, .lv, .sk')) { const t = e.target.closest('button'); if (t && t !== U.hoverEl) { U.hoverEl = t; AU.play('hover'); } } });
  }

  function applyTouch() {
    const st = S().settings;
    const t = $('touch');
    t.style.setProperty('--tsize', String(st.touchSize || 1));
    t.style.setProperty('--talpha', String(st.touchAlpha ?? 0.55));
    t.classList.toggle('is-swap', !!st.touchSwap);
    t.classList.toggle('is-stick', st.touchAim === 'stick');
  }
  U.applyTouch = applyTouch;
  function init() {
    applyTheme();
    applyTouch();
    WTP.font.install().then(() => { WTP.title.start && WTP.title.on && WTP.title.start(); });
    G.init();
    WTP.title.init();
    bindStatic();
    paintIcons(document);
    PG.defaultHotbar();
    WTP.title.start();
    render('title');
    menuPadLoop();
    PG.check();
    U.go = show;
    U.launch = launch;
  }
  U.screen = () => cur;
  init();
})();
