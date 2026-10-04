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
  function renderArmory() {
    const tabs = $('armTabs');
    const cats = [{ id: 'all', name: 'All', icon: 'gun' }, ...WP.CATS];
    tabs.innerHTML = cats.map((c) => `<button class="arm-tab" type="button" role="tab" aria-selected="${c.id === armCat}" data-cat="${c.id}">${ico(c.icon)}<span>${c.name}</span></button>`).join('');
    tabs.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { armCat = b.dataset.cat; AU.play('hover'); renderArmory(); paintIcons(tabs); }));
    const list = WP.DEFS.filter((d) => armCat === 'all' || d.cat === armCat);
    const g = $('armGrid');
    g.innerHTML = list.map((d) => {
      const own = PG.isOwned(d.id);
      return `<button class="arm-cell${own ? '' : ' is-locked'}" type="button" data-w="${d.id}" aria-pressed="${d.id === armSel}" aria-label="${esc(d.name)}${own ? '' : `, costs ${d.price} scrap`}">${own ? '<span class="own"></span>' : ''}<img alt="" src="${wImg(d.id, 3)}"><b>${esc(d.name)}</b><small>${own ? (S().hotbar.includes(d.id) ? `Hotbar ${S().hotbar.indexOf(d.id) + 1}` : 'Owned') : `${ico('scrap')} ${fmtInt(d.price)}`}</small></button>`;
    }).join('');
    g.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { armSel = b.dataset.w; AU.play('hover'); g.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); renderArmDetail(); }));
    paintIcons(g);
    renderArmDetail();
  }
  function renderArmDetail() {
    const d = WP.BY[armSel];
    const own = PG.isOwned(d.id);
    const cat = WP.CATS.find((c) => c.id === d.cat);
    const pips = (n) => `<span class="pips">${[1, 2, 3, 4, 5].map((k) => `<i class="${k <= n ? 'on' : ''}"></i>`).join('')}</span>`;
    const inHot = S().hotbar.includes(d.id);
    const box = $('armDetail');
    box.innerHTML = `<div class="big"><canvas id="armCv" width="72" height="30" style="width:360px;max-width:100%;height:auto"></canvas></div>
      <h3>${esc(d.name)}</h3><div class="cat">${esc(cat?.name || '')}${d.alt ? ` · ALT: ${esc(d.alt)}` : ''}${d.hold ? ' · Hold to fire' : ''}</div>
      <p>${esc(d.tip)}</p>
      <div class="statbar"><span>Power</span>${pips(d.st[0])}</div><div class="statbar"><span>Rate</span>${pips(d.st[1])}</div><div class="statbar"><span>Range</span>${pips(d.st[2])}</div><div class="statbar"><span>Chaos</span>${pips(d.st[3])}</div>
      <div class="px-row">${own ? `<button class="px-btn px-btn--ghost" type="button" data-act="hot">${ico(inHot ? 'cross' : 'check')}<span>${inHot ? 'Remove from hotbar' : 'Add to hotbar'}</span></button>` : `<button class="px-btn px-btn--gold${S().scrap >= d.price ? '' : ' is-off'}" type="button" data-act="buy">${ico('scrap')}<span>Buy ${fmtInt(d.price)}</span></button>`}<button class="px-btn px-btn--sec" type="button" data-act="try">${ico('target')}<span>Try it</span></button></div>`;
    paintIcons(box);
    box.querySelector('[data-act="try"]').addEventListener('click', () => {
      launch({ mode: 'free', page: WTP.rangePage, weapons: [d.id], allWeapons: false, practice: true, first: d.id, params: { goal: 101 } });
    });
    box.querySelector('[data-act="buy"]')?.addEventListener('click', () => {
      if (PG.buyWeapon(d.id)) { AU.play('buy'); C.confetti && C.confetti(60); toastAch({ name: `${d.name} unlocked`, desc: 'Added to your hotbar. Go break something.', icon: 'gun' }); renderArmory(); head('armory'); paintIcons($('scrArmory')); }
      else { AU.play('deny'); label2(`Need ${fmtInt(d.price - S().scrap)} more scrap. Wreck more pages!`); }
    });
    box.querySelector('[data-act="hot"]')?.addEventListener('click', () => {
      const hb = S().hotbar;
      if (hb.includes(d.id)) hb.splice(hb.indexOf(d.id), 1);
      else { if (hb.length >= 10) hb.pop(); hb.push(d.id); }
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
  const KEY_LABELS = { left: 'Move left', right: 'Move right', jump: 'Jump', down: 'Drop / fast fall', dash: 'Dash', fire: 'Fire (keyboard)', alt: 'Alt fire', prev: 'Previous weapon', next: 'Next weapon', wheel: 'Weapon wheel', reset: 'Restart', pause: 'Pause' };
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
      v = v === 'true' ? true : v === 'false' ? false : Number(v);
      st[k] = v;
      WTP.persist();
      AU.setVolumes();
      applyTheme();
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
    $('helpBody').innerHTML = `
      <div class="px-panel"><h3 class="px-h3">Keyboard and mouse</h3><ul>
        <li>${k('left')} ${k('right')} run, ${k('jump')} jump, again in the air to double jump</li>
        <li>Slide down walls, jump off them to wall jump</li>
        <li>${k('dash')} dashes (you are invincible while dashing)</li>
        <li>Aim with the mouse, click to fire</li>
        <li>${k('prev')} ${k('next')}, mouse wheel or <span class="key">1</span>-<span class="key">0</span> switch weapons, ${k('wheel')} opens the wheel</li>
        <li>${k('alt')} or right click: alt fire, ${k('reset')} restart, ${k('pause')} pause</li>
        <li><span class="key">+</span> <span class="key">-</span> or pinch zoom the camera</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">Touchpad or keyboard only</h3><ul>
        <li>Aim with <span class="key">I</span> <span class="key">J</span> <span class="key">K</span> <span class="key">L</span>, or do nothing and auto aim finds the nearest stuff</li>
        <li>Fire with ${k('fire')} or <span class="key">Enter</span></li>
        <li><span class="key">V</span> locks fire on, so you never have to hold anything</li>
        <li>Turn on Touchpad mode in the top bar: click once to start firing, click again to stop</li>
        <li>Settings has "Click toggles fire" and aim assist</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">Touch</h3><ul>
        <li>Left stick runs (push up to jump)</li><li>Right stick aims and fires</li><li>Green button jumps, blue dashes</li><li>The weapon button opens the wheel</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">Gamepad</h3><ul>
        <li>Left stick move, right stick aim, RT fire, LT alt</li><li>A jump, B dash, LB RB switch, Y wheel</li><li>Start pauses, the d-pad works in menus</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">Wrecking tips</h3><ul>
        <li>Hit a word and its letters pop off and fall</li><li>Buttons and search boxes are glass: one hit shatters the whole thing</li>
        <li>Freeze things, then hit the ice to shatter it</li><li>Loose chunks fall and pile up as debris you can stand on</li>
        <li>Keep hitting things to grow your combo multiplier</li><li>Every 25 pixels wrecked is 1 scrap. Spend it in the Armory</li></ul></div>
      <div class="px-panel"><h3 class="px-h3">The page fights back</h3><ul>
        <li><img alt="" src="${enemyImg('ad', 1)}" style="height:16px;image-rendering:pixelated"> Pop-up ads float after you and spit coins</li>
        <li><img alt="" src="${enemyImg('captcha', 1)}" style="height:16px;image-rendering:pixelated"> Captchas hop and throw check marks</li>
        <li><img alt="" src="${enemyImg('cookie', 1)}" style="height:12px;image-rendering:pixelated"> Cookie banners drop explosive cookies</li>
        <li><img alt="" src="${enemyImg('cursor', 1)}" style="height:16px;image-rendering:pixelated"> Cursor drones dive at you and click</li></ul></div>`;
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
    $('hudFinish').hidden = !(run.modeId === 'free' || run.modeId === 'zen');
    $('resultsOvl').hidden = true; $('pauseOvl').hidden = true; $('wheel').hidden = true;
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
  U.hudWeapons = (loadout, curId) => {
    const hb = $('hotbar');
    const ammo = WP.ammo();
    hb.innerHTML = loadout.slice(0, 20).map((id, i) => {
      const a = ammo ? ammo[id] : null;
      return `<button class="w-cell" type="button" data-w="${id}" aria-pressed="${id === curId}" aria-label="${esc(WP.BY[id].name)}" title="${esc(WP.BY[id].name)}${i < 10 ? ` (${(i + 1) % 10})` : ''}">${i < 10 ? `<span class="n">${(i + 1) % 10}</span>` : ''}<img alt="" src="${wImg(id, 3)}">${a != null ? `<span class="am${a <= 0 ? ' is-zero' : ''}">${a}</span>` : ''}</button>`;
    }).join('');
    hb.querySelectorAll('[data-w]').forEach((b) => b.addEventListener('click', () => { G.selectWeapon(b.dataset.w); $('cv').focus({ preventScroll: true }); }));
    const sel = hb.querySelector('[aria-pressed="true"]');
    if (sel && hb.scrollWidth > hb.clientWidth) hb.scrollLeft = sel.offsetLeft - hb.clientWidth / 2;
    const d = WP.BY[curId];
    $('hudAlt').hidden = !d.alt; $('tAlt').hidden = !d.alt;
    const tc = $('tWpnCv'), g = tc.getContext('2d');
    g.clearRect(0, 0, 40, 20); g.imageSmoothingEnabled = false;
    g.drawImage(d.sprite.cv, Math.round(20 - d.sprite.w / 2), Math.round(10 - d.sprite.h / 2));
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

  let wheelCat = null;
  U.wheelOpen = () => !$('wheel').hidden;
  U.wheel = (open) => {
    const w = $('wheel');
    if (!open) { w.hidden = true; $('cv').focus({ preventScroll: true }); return; }
    if (!G.run || G.run.ended) return;
    I.pointerFire = false;
    w.hidden = false;
    const lo = G.loadout();
    const allowed = G.run.allWeapons ? WP.DEFS.map((d) => d.id) : G.run.free ? WP.DEFS.filter((d) => PG.isOwned(d.id)).map((d) => d.id) : lo;
    const curD = WP.current();
    wheelCat = curD.cat;
    const ring = $('wheelRing');
    const cats = WP.CATS;
    ring.innerHTML = `<div class="wh-cats">${cats.map((c, i) => {
      const a = (i / cats.length) * Math.PI * 2 - Math.PI / 2;
      const has = allowed.some((id) => WP.BY[id].cat === c.id);
      const first = allowed.find((id) => WP.BY[id].cat === c.id);
      return `<button class="wh-cat" type="button" data-cat="${c.id}" ${has ? '' : 'disabled'} aria-pressed="${c.id === wheelCat}" aria-label="${esc(c.name)}" title="${esc(c.name)}" style="left:${50 + Math.cos(a) * 42}%;top:${50 + Math.sin(a) * 42}%">${first ? `<img alt="" src="${wImg(first, 2)}">` : ico(c.icon)}<span>${esc(c.short || c.name)}</span></button>`;
    }).join('')}</div><div class="px-panel wh-center" id="whCenter"></div><button class="px-ib wh-close" type="button" aria-label="Close wheel">${ico('cross')}</button>`;
    const fill = () => {
      const list = allowed.filter((id) => WP.BY[id].cat === wheelCat);
      $('whCenter').innerHTML = `<h3>${esc(WP.CATS.find((c) => c.id === wheelCat)?.name || '')}</h3><div class="wh-list">${list.map((id) => `<button class="wh-w" type="button" data-w="${id}" aria-pressed="${id === WP.st.cur}"><img alt="" src="${wImg(id, 2)}"><span>${esc(WP.BY[id].name)}</span></button>`).join('')}</div>${I.isTouch ? '' : '<small class="wh-hint">Arrows pick · Enter equip · Q E category · Esc close</small>'}`;
      $('whCenter').querySelectorAll('[data-w]').forEach((b) => {
        b.addEventListener('click', () => { G.selectWeapon(b.dataset.w); U.wheel(false); });
        b.addEventListener('focus', () => AU.play('hover'));
      });
      const f = $('whCenter').querySelector('[aria-pressed="true"]') || $('whCenter').querySelector('[data-w]');
      f && f.focus({ preventScroll: true });
    };
    ring.querySelectorAll('[data-cat]').forEach((b) => {
      const pick = () => { wheelCat = b.dataset.cat; ring.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); fill(); AU.play('hover'); };
      b.addEventListener('click', pick);
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') { wheelCat = b.dataset.cat; ring.querySelectorAll('[data-cat]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); fill(); } });
    });
    ring.querySelector('.wh-close').addEventListener('click', () => U.wheel(false));
    paintIcons(ring);
    fill();
    AU.play('select');
  };
  $('wheel').addEventListener('click', (e) => { if (e.target.id === 'wheel') U.wheel(false); });

  U.pauseMenu = (on) => {
    const o = $('pauseOvl');
    o.hidden = !on;
    if (!on) return;
    const run = G.run;
    const lv = run.opts.campaign;
    $('pauseCard').innerHTML = `<h2 class="px-h2">Paused</h2><p class="px-p">${esc(run.page.site)} · ${esc(run.mode.name)}${lv ? ` · ${esc(lv.name)}` : ''}</p>
      <div class="ovl-btns">
        <button class="px-btn" type="button" data-p="resume">${ico('play')}<span>Resume</span></button>
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
      else if (a === 'restart') { o.hidden = true; G.paused = false; G.restart(); }
      else if (a === 'finish') { o.hidden = true; G.paused = false; G.end('finish'); }
      else if (a === 'quit') { o.hidden = true; G.paused = false; G.quit(); }
      else if (a === 'fire') { S().settings.toggleFire = !S().settings.toggleFire; WTP.persist(); U.pauseMenu(true); o.querySelector('[data-p="fire"]').focus(); }
      else if (a === 'pad') { C.setTouchpad(!C.touchpad); U.pauseMenu(true); o.querySelector('[data-p="pad"]').focus(); }
      else if (a === 'assist') { S().settings.aimAssist = (S().settings.aimAssist + 1) % 3; WTP.persist(); U.pauseMenu(true); o.querySelector('[data-p="assist"]').focus(); }
    }));
    o.querySelector('[data-p="resume"]').focus();
  };
  U.showFinish = (on) => { $('hudFinish').hidden = !on && !(G.run && (G.run.modeId === 'free' || G.run.modeId === 'zen')); if (on) U.label('80% REACHED! KEEP GOING OR HIT THE FLAG TO FINISH', 2600); };
  U.closeOverlays = () => { $('pauseOvl').hidden = true; $('resultsOvl').hidden = true; $('wheel').hidden = true; };

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
        ${nextLv != null ? `<button class="px-btn px-btn--good" type="button" data-r="next">${ico('play')}<span>Next level</span></button>` : ''}
        <button class="px-btn" type="button" data-r="again">${ico('reset')}<span>Play again</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-r="keep">${ico('eye')}<span>Look at the wreckage</span></button>
        <button class="px-btn px-btn--ghost" type="button" data-r="menu">${ico('home')}<span>${lv ? 'Campaign' : 'Menu'}</span></button>
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
      else if (a === 'share') { try { await navigator.clipboard.writeText(share); label2('Copied! Go brag.'); } catch (e) { label2(share); } }
    }));
    const f = card.querySelector('[data-r="next"]') || card.querySelector('[data-r="again"]');
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
    const scope = !$('stage').hidden ? ($('resultsOvl').hidden ? ($('pauseOvl').hidden ? $('wheel') : $('pauseOvl')) : $('resultsOvl')) : $(SCREENS[cur]);
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
      if (!$('stage').hidden) { if (!$('wheel').hidden) U.wheel(false); else if (!$('pauseOvl').hidden) G.pause(false); }
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
      if (!$('wheel').hidden) {
        if (e.code === 'Escape' || e.code === 'Tab') { e.preventDefault(); U.wheel(false); return; }
        if (e.code.startsWith('Arrow')) { e.preventDefault(); spatial(e.code.slice(5).toLowerCase(), '.wh-w'); }
        if (e.code === 'KeyQ' || e.code === 'KeyE') {
          const cats = [...$('wheelRing').querySelectorAll('.wh-cat:not([disabled])')];
          const i = cats.findIndex((b) => b.dataset.cat === wheelCat);
          const nb = cats[(i + (e.code === 'KeyE' ? 1 : -1) + cats.length) % cats.length];
          if (nb) nb.click();
        }
        if (/^Digit[1-9]$/.test(e.code)) { const b = $('whCenter').querySelectorAll('[data-w]')[Number(e.code.slice(5)) - 1]; if (b) b.click(); }
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
    if (cur === 'title' && (e.code === 'Enter' || e.code === 'Space')) { e.preventDefault(); show('main'); return; }
    if (e.code === 'Escape' && cur !== 'title' && cur !== 'main') { e.preventDefault(); back(); return; }
    if (e.code.startsWith('Arrow')) { e.preventDefault(); spatial(e.code.slice(5).toLowerCase()); }
  });
  document.addEventListener('pointerdown', ensureAudio, { once: true });

  function bindStatic() {
    $('tStart').addEventListener('click', () => { ensureAudio(); AU.play('title'); show('main'); });
    $('ownGo').addEventListener('click', () => {
      const t = $('ownText').value.trim();
      if (t.split(/\s+/).length < 3) { label2('Type or paste a few words first'); $('ownText').focus(); return; }
      launch({ mode: pendingMode, page: WTP.ownPage(t) });
    });
    $('hudPause').addEventListener('click', () => { if (G.run && G.run.ended && $('resultsOvl').hidden) G.quit(); else G.pause(true); });
    $('hudWheel').addEventListener('click', () => U.wheel(true));
    $('hudAlt').addEventListener('click', () => { I.press('alt'); $('cv').focus({ preventScroll: true }); });
    $('hudFinish').addEventListener('click', () => { if (G.run && !G.run.ended) G.end('finish'); });
    $('tWpn').addEventListener('click', () => U.wheel(true));
    I.bindTouch({ stickL: $('stickL'), stickR: $('stickR'), buttons: [[$('tJump'), 'jump'], [$('tDash'), 'dash'], [$('tAlt'), 'alt']] });
    document.addEventListener('pointermove', (e) => { if (e.target.closest && e.target.closest('.px-btn, .mode-card, .pg-card, .arm-cell, .lv, .sk')) { const t = e.target.closest('button'); if (t && t !== U.hoverEl) { U.hoverEl = t; AU.play('hover'); } } });
  }

  function init() {
    applyTheme();
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
