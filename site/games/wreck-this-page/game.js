(() => {
  const WTP = window.WTP;
  const { $, P32, PAL, rand } = WTP;
  const Wd = WTP.world, FX = WTP.fx, PL = WTP.player, WP = WTP.weapons, EN = WTP.enemies, I = WTP.input, AU = WTP.audio, MD = WTP.modes;
  const STEP = 1 / 60;
  const G = { run: null, playing: false, paused: false };
  WTP.game = G;
  let cv, ctx, stage, dpr = 1, vw = 1, vh = 1, S = 3, zoomBias = 0;
  const cam = { x: 0, y: 0 };
  let shakeT = 0, hitstopT = 0, timeScale = 1, slowT = 0, chromaT = 0;
  let raf = 0, last = 0, acc = 0, hudT = 0, pendingSlot = null;
  let voidPat = null, voidS = 0, shadowCv = null, shadowCtx = null, desk = null;
  let comboY = 0, frameMs = 16, slowFrames = 0, fastFrames = 0, quality = 2, workMs = 4, workMax = 4;
  const aim = { x: 1, y: 0, ang: 0 };
  let loadout = [];

  G.init = () => {
    stage = $('stage'); cv = $('cv'); ctx = cv.getContext('2d');
    I.bindCanvas(cv);
    window.addEventListener('resize', () => { if (G.playing) resize(); });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { if (G.playing && !G.paused && G.run && !G.run.ended) G.pause(true); cancelAnimationFrame(raf); AU.stopLoops(); }
      else if (G.playing) { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
    });
    window.addEventListener('curio:touchpad', () => { if (G.playing && WTP.C.touchpad) G.label('TOUCHPAD MODE: CLICK TO START FIRING, CLICK AGAIN TO STOP', 2600); });
    window.addEventListener('keydown', (e) => {
      if (!G.playing || G.paused || e.repeat) return;
      if (/^Digit[0-9]$/.test(e.code)) pendingSlot = Number(e.code.slice(5));
      if (e.code === 'Equal' || e.code === 'NumpadAdd') G.zoom(1);
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') G.zoom(-1);
    });
  };
  function resize() {
    const r = stage.getBoundingClientRect();
    vw = Math.max(1, r.width); vh = Math.max(1, r.height);
    dpr = Math.min(3, window.devicePixelRatio || 1);
    cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
    computeScale();
  }
  G.resize = resize;
  function computeScale() {
    const W = (Wd.PX1 - Wd.PX0) || Wd.w || 380;
    let s = Math.floor((vw * dpr) / (W + 16));
    const minS = I.isTouch ? Math.round(1.6 * dpr) : Math.round(1.4 * dpr);
    s = Math.max(2, s, minS);
    S = Math.max(2, Math.min(14, s + zoomBias));
  }
  const viewW = () => cv.width / S, viewH = () => cv.height / S;
  G.view = () => ({ x: cam.x, y: cam.y, w: viewW(), h: viewH() });
  G.camTop = () => cam.y;
  G.mouseWorld = () => ({ x: cam.x + (I.mouse.x * dpr) / S, y: cam.y + (I.mouse.y * dpr) / S });
  G.inPlayer = (x, y) => PL.inside(x, y);
  G.shake = (n) => { shakeT = Math.min(34, Math.max(shakeT, shakeT * 0.6 + n)); };
  G.hitstop = (t) => { hitstopT = Math.max(hitstopT, t); };
  G.slowmo = (scale, dur) => { if (WTP.reducedMotion()) return; timeScale = scale; slowT = dur; G.stat('slowmos', 1); };
  G.chroma = (a) => { if (!WTP.save.settings.flashes) return; chromaT = Math.max(chromaT, 0.1 + a * 0.18); };
  G.label = (text, ms = 1200) => WTP.ui?.label?.(text, ms);
  G.announce = (text, tier = 2) => { WTP.ui?.announce?.(text, tier); AU.play('announce', tier); };
  G.event = (text, x, y, scale = 2) => { FX.pop(x, y, text, { scale, ramp: ['7', 'Y', 'y', 'a', 'o', 'e'], life: 1.3, vy: -18 }); if (text === 'TIMBER!' && G.run) G.run.timber = true; };
  G.allWeapons = () => !!(G.run && G.run.allWeapons);
  G.startTimer = () => { if (G.run && !G.run.timerOn) G.run.timerOn = true; };
  G.stat = (k, n) => { if (!G.run) return; G.run.stats[k] = (G.run.stats[k] || 0) + n; };
  G.weaponUsed = (id, dt) => { if (!G.run) return; const u = G.run.stats.weaponUse = G.run.stats.weaponUse || {}; u[id] = (u[id] || 0) + (dt || 1); };
  G.ammoChanged = () => WTP.ui?.hudWeapons?.(G.slots(), WP.st.cur);
  G.scrap = (n) => { if (G.run) G.run.bonusScrap += n; };
  G.bonus = (pts, x, y) => { if (!G.run) return; G.run.score += pts; FX.pop(x, y, `+${WTP.fmtInt(pts)}`, { scale: 1, ramp: ['Y', 'y', 'a'] }); };
  G.rocketJump = (h) => { if (G.run) G.run.rocketJump = Math.max(G.run.rocketJump || 0, h); if (h > 45) FX.pop(PL.x + 3, PL.y - 10, 'ROCKET JUMP!', { scale: 1, ramp: ['7', 'C', 'c'] }); };
  G.targetDown = (T) => {
    const run = G.run; if (!run) return;
    run.targetsDown = (run.targetsDown || 0) + 1;
    G.bonus(300, (T.x0 + T.x1) / 2, T.y0);
    FX.pop((T.x0 + T.x1) / 2, T.y0 - 8, 'TARGET DOWN!', { scale: 1, ramp: ['7', 'L', 'l', 'G'] });
    AU.play('coin'); AU.play('combo', 6);
    G.shake(4);
  };
  G.enemyKilled = (e) => {
    const run = G.run; if (!run) return;
    run.kills = (run.kills || 0) + 1;
    G.bonus(e.T.score, e.x, e.y - 10);
    G.stat('kills', 1);
    if (e.T.boss) { run.bossKilled = true; G.announce('UNSUBSCRIBED!', 6); }
    G.comboBump(8);
  };
  G.playerDied = () => { if (G.run && !G.run.ended) setTimeout(() => G.end('dead'), 1400); };

  const TIERS = [[10, 'NICE!'], [25, 'GREAT!'], [50, 'WRECKED!'], [100, 'DEVASTATING!'], [200, 'CATASTROPHIC!'], [350, 'UNSTOPPABLE!'], [500, 'PAGE NOT FOUND!'], [750, 'ERROR 500!'], [1000, 'INTERNET DESTROYER!'], [1500, 'BLUE SCREEN!'], [2500, 'THE WEB IS GONE!']];
  G.comboBump = (n) => {
    const run = G.run;
    if (!run || run.ended) return;
    run.combo += n; run.comboT = 1.6;
    if (run.combo > run.maxCombo) run.maxCombo = run.combo;
    for (let k = 0; k < TIERS.length; k++) {
      const [t, txt] = TIERS[k];
      if (run.combo >= t && run.comboShown < t) { run.comboShown = t; G.announce(txt, Math.min(8, k + 1)); if (k >= 3) G.shake(4); }
    }
  };
  G.scored = (n, x, y) => {
    const run = G.run;
    if (!run || run.ended) return;
    G.startTimer();
    if (n <= 0) return;
    G.comboBump(1 + Math.floor(n / 60));
    const mult = 1 + Math.min(9, Math.floor(run.combo / 15));
    if (mult > (run.mult || 1)) { run.comboPop = 1; AU.play('combo', mult); }
    run.score += n * mult;
    run.mult = mult;
    if (x >= 0 && n >= 80) FX.pop(x, y, `+${WTP.fmtInt(n * mult)}`, { scale: 1, ramp: n >= 400 ? ['7', 'Y', 'y', 'o'] : ['7', '6', '5'] });
  };

  function setLoadout(list) {
    loadout = list.map((id) => (id && WP.BY[id] ? id : null));
    if (!G.run?.hotbarMode) loadout = loadout.filter(Boolean);
    if (!loadout.some(Boolean)) loadout = G.run?.hotbarMode ? ['pistol', ...new Array(WTP.HOTBAR_N - 1).fill(null)] : ['pistol'];
    WP.select(loadout.find(Boolean));
    WTP.ui?.hudWeapons?.(G.slots(), WP.st.cur);
  }
  G.loadout = () => loadout.filter(Boolean);
  G.slots = () => (G.run?.hotbarMode ? WTP.save.hotbar.map((id) => (id && WTP.progress.isOwned(id) ? id : null)) : loadout.slice(0, WTP.HOTBAR_N));
  G.available = () => {
    if (!G.run) return [];
    if (G.run.allWeapons) return WP.DEFS.map((d) => d.id);
    if (G.run.hotbarMode) return WP.DEFS.filter((d) => WTP.progress.isOwned(d.id)).map((d) => d.id);
    return loadout.filter(Boolean);
  };
  G.selectWeapon = (id, quiet) => {
    if (!id || !WP.BY[id] || !G.available().includes(id)) { if (!quiet) { G.label('NOT IN THIS LOADOUT', 800); AU.play('deny'); } return false; }
    if (WP.st.cur !== id) {
      WP.select(id);
      if (!quiet) { AU.play('select'); WTP.ui?.weaponName?.(WP.BY[id]); }
    }
    WTP.ui?.hudWeapons?.(G.slots(), id);
    return true;
  };
  G.assignSlot = (slot, id) => {
    if (!G.run?.hotbarMode && G.run) return false;
    if (slot < 0 || slot >= WTP.HOTBAR_N) return false;
    if (id && !WTP.progress.isOwned(id)) return false;
    const hb = WTP.save.hotbar;
    if (id) { const k = hb.indexOf(id); if (k >= 0) hb[k] = hb[slot] && k !== slot ? hb[slot] : null; }
    hb[slot] = id || null;
    WTP.persist();
    if (G.run) { loadout = hb.slice(); WTP.ui?.hudWeapons?.(G.slots(), WP.st.cur); }
    return true;
  };
  G.cycle = (d) => {
    let ring = G.slots().filter(Boolean);
    if (ring.length < 2) ring = G.available();
    if (!ring.length) return;
    let i = ring.indexOf(WP.st.cur);
    if (i < 0) i = d > 0 ? -1 : 0;
    i = (i + d + ring.length) % ring.length;
    G.selectWeapon(ring[i]);
  };
  G.slotKey = (n) => { const idx = n === 0 ? 9 : n - 1; const id = G.slots()[idx]; if (id) G.selectWeapon(id); else { G.label(`SLOT ${n} IS EMPTY: OPEN THE WEAPONS MENU (TAB) TO FILL IT`, 1400); AU.play('deny'); } };

  G.start = async (opts) => {
    const page = opts.page;
    const mode = MD.MODES[opts.mode] || MD.MODES.free;
    G.stopLoop();
    WTP.ui?.showStage?.(true);
    resize();
    await new Promise((r) => requestAnimationFrame(r));
    const host = $('srcHost');
    const LW = window.innerWidth < 700 ? Math.max(340, Math.min(480, Math.floor((window.innerWidth - 10) / 2) * 2)) : 760;
    host.innerHTML = page.html;
    const root = host.firstElementChild;
    root.style.width = `${LW}px`;
    if (LW < 600) root.classList.add('nw');
    try { if (document.fonts?.ready) await document.fonts.ready; } catch (e) { }
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    WTP.levels.prepareDOM(root, page);
    const data = await Wd.rasterize(root, { targetSel: opts.params?.selector, margin: WTP.levels.margin(), top: WTP.levels.topPad(), bottom: WTP.levels.bottomPad() });
    host.innerHTML = '';
    Wd.build(data);
    WTP.levels.apply(page);
    Wd.finalize();
    resize();
    desk = WTP.levels.buildDesktop(page, viewW(), viewH());
    G.prepare(opts, mode);
  };
  G.prepare = (opts, mode) => {
    Wd.reset();
    FX.clear(); WP.reset(); EN.reset(); WP.setAmmo(null);
    WTP.gadgets.force = opts.tryGadget || null;
    WTP.props.reset(); WTP.levels.spawnEnts();
    computeScale();
    const run = G.run = {
      opts, mode, modeId: opts.mode, page: opts.page, params: { ...(opts.params || {}) }, t: 0, timerOn: false, score: 0, combo: 0, comboT: 0, comboShown: 0, maxCombo: 0, mult: 1,
      stats: { letters: 0, explosions: 0, shots: 0, chunks: 0, glass: 0, burned: 0, iced: 0, painted: 0, kills: 0, jumps: 0, walljumps: 0, dashes: 0, portals: 0, throws: 0, bees: 0, eaten: 0, nukes: 0, distance: 0, slowmos: 0 },
      ended: false, bonusScrap: 0, allWeapons: !!opts.allWeapons, free: !opts.weapons, hud: mode.hud, kills: 0, noHit: true, noHitWave: 0, wave: 0, frame: 0
    };
    let list;
    if (run.allWeapons) list = WP.DEFS.map((d) => d.id);
    else if (opts.weapons === 'all') list = WP.DEFS.filter((d) => WTP.progress.isOwned(d.id)).map((d) => d.id);
    else if (Array.isArray(opts.weapons)) list = opts.weapons.slice();
    else list = null;
    run.hotbarMode = !list;
    if (!list) list = WTP.progress.defaultHotbar().slice();
    if (opts.mode === 'puzzle') list = Object.keys(opts.params.puzzle.ammo);
    if (opts.first) { const k = list.indexOf(opts.first); if (k >= 0) list.splice(k, 1); list.unshift(opts.first); }
    setLoadout(list);
    PL.maxHp = 6;
    const sp = WTP.levels.spawn || { x: Math.floor(Wd.w / 2), y: 2 };
    PL.spawn(sp.x - 3, sp.y);
    cam.x = PL.x - viewW() / 2; cam.y = -14;
    mode.setup(run);
    WTP.save.seenPages[opts.page.id] = true;
    WTP.persist();
    AU.music(mode.music);
    AU.muffle(false);
    WTP.ui?.hudSetup?.(run);
    G.playing = true; G.paused = false;
    timeScale = 1; slowT = 0; hitstopT = 0; shakeT = 0; chromaT = 0;
    I.enabled = true; I.clear(); I.fireLock = false;
    last = performance.now(); acc = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    cv.focus({ preventScroll: true });
    if (!WTP.save.tipTouchpad && !I.isTouch && !(WTP.C.touchpad)) { WTP.save.tipTouchpad = true; WTP.persist(); setTimeout(() => G.label('TIP: ON A TOUCHPAD? TURN ON TOUCHPAD MODE IN THE TOP BAR, OR PRESS V TO LOCK FIRE', 4600), 2800); }
  };
  G.restart = () => { if (!G.run) return; commitRun(); const o = G.run.opts; WTP.ui?.closeOverlays?.(); G.prepare(o, MD.MODES[o.mode] || MD.MODES.free); };
  G.stopLoop = () => { G.playing = false; cancelAnimationFrame(raf); AU.stopLoops(); };
  G.pause = (on) => {
    if (!G.run || G.run.ended) return;
    G.paused = on;
    I.pointerFire = false;
    AU.muffle(on);
    if (on) AU.stopLoops();
    else { last = performance.now(); cv.focus({ preventScroll: true }); }
    WTP.ui?.pauseMenu?.(on);
  };
  G.quit = () => { if (G.run && !G.run.ended) commitRun(); G.stopLoop(); G.run = null; I.enabled = false; I.fireLock = false; cv.style.filter = ''; WTP.ui?.showStage?.(false); };
  G.showFinish = (on) => WTP.ui?.showFinish?.(on);

  function commitRun() {
    const run = G.run;
    if (!run || run.committed) return 0;
    run.committed = true;
    const s = WTP.save.stats;
    const px = Wd.destroyed;
    s.pixels += px;
    for (const k of Object.keys(run.stats)) if (k !== 'weaponUse') s[k] = (s[k] || 0) + (run.stats[k] || 0);
    s.time += run.t; s.runs++;
    if (run.modeId === 'zen') s.zenTime += run.t;
    s.bestCombo = Math.max(s.bestCombo, run.maxCombo);
    for (const [id, n] of Object.entries(run.stats.weaponUse || {})) s.weaponUse[id] = (s.weaponUse[id] || 0) + n;
    const scrap = Math.floor(px / 25) + run.bonusScrap;
    run.scrapBase = scrap;
    WTP.save.scrap += scrap;
    s.scrapEarned += scrap;
    WTP.persist();
    WTP.progress.check({ pct: MD.pct(), mode: run.modeId });
    return scrap;
  }

  G.end = (reason) => {
    const run = G.run;
    if (!run || run.ended) return;
    run.ended = true; run.reason = reason;
    I.pointerFire = false; I.fireLock = false;
    AU.stopLoops();
    const mode = run.mode;
    const pct = MD.pct();
    run.won = reason === 'goal' || reason === 'waves' || (reason === 'time' && pct > 1) || reason === 'finish';
    run.grade = mode.grade(run);
    if (run.opts.campaign && !run.won) run.grade = 'C';
    const scrapBase = commitRun();
    const gradeBonus = { S: 400, A: 200, B: 80, C: 20 }[run.grade] || 0;
    let bonus = run.won ? gradeBonus : 0;
    let stars = 0, best = null;
    if (run.opts.campaign) {
      const lv = run.opts.campaign;
      stars = MD.campaignStars(lv, run);
      const prev = WTP.save.campaign[lv.id] || 0;
      if (stars > prev) { bonus += (stars - prev) * 250; WTP.save.campaign[lv.id] = stars; }
    }
    if (run.modeId === 'puzzle' && run.won) {
      stars = { S: 3, A: 2, B: 1 }[run.grade] || 1;
      const prev = WTP.save.bests[`puzzle:${run.params.puzzle.id}`] || 0;
      if (stars > prev) { WTP.save.bests[`puzzle:${run.params.puzzle.id}`] = stars; bonus += (stars - prev) * 150; }
    }
    if (mode.bestKey && run.modeId !== 'puzzle' && !run.opts.practice && !run.opts.campaign) {
      const v = mode.bestVal(run);
      if (v != null) best = WTP.setBest(mode.bestKey(run), v, mode.higher);
    }
    if (run.modeId === 'daily' && run.won) WTP.save.stats.dailies++;
    if (run.modeId === 'survival') WTP.save.stats.bestWave = Math.max(WTP.save.stats.bestWave, run.wave);
    if (pct >= 80) WTP.save.bests[`flat:${run.page.id}`] = Math.max(WTP.save.bests[`flat:${run.page.id}`] || 0, Math.floor(pct));
    WTP.save.scrap += bonus;
    if (run.won) WTP.save.stats.wins++;
    WTP.persist(true);
    const achs = WTP.progress.check({ pct, mode: run.modeId === 'daily' ? run.sub && Object.keys(MD.MODES).find((k) => MD.MODES[k] === run.sub) : run.modeId, grade: run.grade, own: run.page.id === 'own', noHitWave: run.noHitWave, rocketJump: run.rocketJump || 0, walljumps: run.stats.walljumps, bossKilled: run.bossKilled, timber: run.timber });
    const result = { run, pct, scrap: scrapBase, bonus, stars, best, achs, rows: mode.rows(run) };
    PL.victory = run.won;
    if (run.won) AU.jingle('win'); else AU.jingle('lose');
    AU.music(null);
    setTimeout(() => { if (G.run === run) { AU.muffle(true); WTP.ui?.results?.(result); } }, run.won ? 1300 : 900);
  };

  function updateAim(dt) {
    const o = PL.center();
    const oy = PL.y + 5;
    const src = I.aim.src;
    let tx = null, ty = null;
    const ka = I.keyAim();
    const setT = (x, y) => { const m = Math.hypot(x, y); if (m > 0.01) { tx = x / m; ty = y / m; } };
    const manualKeys = src === 'keys' && performance.now() - I.lastKey < 3000;
    if (ka) setT(ka[0], ka[1]);
    else if (I.stickR.id != null && I.fireDrag && Math.hypot(I.stickR.x, I.stickR.y) > 0.2) setT(I.stickR.x, I.stickR.y);
    else if (I.isTouch && WTP.save.settings.touchAim === 'stick' && src === 'stick') { tx = aim.x; ty = aim.y; }
    else if (I.gp && Math.hypot(I.gpAxes[2], I.gpAxes[3]) > 0.3) setT(I.gpAxes[2], I.gpAxes[3]);
    else if (src === 'mouse' && I.mouse.in && (performance.now() - I.mouse.lastMove < 5000 || performance.now() - I.lastKey > 1500)) { const m = G.mouseWorld(); setT(m.x - o.x, m.y - oy); }
    else if (manualKeys || src === 'test') { tx = aim.x; ty = aim.y; }
    else if (I.isTouch && I.stickR.id == null && Math.abs(I.stickL.x) > 0.3 && !EN.count()) setT(Math.sign(I.stickL.x), 0);
    else {
      const face = PL.face;
      const e = EN.nearest(o.x, oy, 140);
      if (e) setT(e.x - o.x, e.y - oy);
      else {
        let best = null, bd = 1e9;
        for (let a = -1; a <= 1.001; a += 0.125) {
          const ang = (face > 0 ? 0 : Math.PI) + a * face;
          const r = Wd.raycast(o.x, oy, Math.cos(ang), Math.sin(ang), 110, 1.5);
          if (r.hit) { const d = Math.hypot(r.x - o.x, r.y - oy) + Math.abs(a) * 20; if (d < bd) { bd = d; best = [Math.cos(ang), Math.sin(ang)]; } }
        }
        if (best) setT(best[0], best[1]); else setT(face, 0);
      }
    }
    const assist = WTP.save.settings.aimAssist;
    if (tx != null && assist) {
      const cone = (assist === 2 ? 0.45 : 0.22) * (I.isTouch ? 1.6 : 1);
      const e = EN.nearest(o.x, oy, 170, Math.atan2(ty, tx), cone);
      if (e) { const ex = e.x - o.x, ey = e.y - oy, m = Math.hypot(ex, ey) || 1; const k = assist === 2 ? 0.75 : 0.45; setT(tx * (1 - k) + (ex / m) * k, ty * (1 - k) + (ey / m) * k); }
      else if (assist === 2 && (ka || I.gp)) {
        const r = Wd.nearestSolid(o.x + tx * 50, oy + ty * 50, 22);
        if (r) { const ex = r[0] - o.x, ey = r[1] - oy, m = Math.hypot(ex, ey) || 1; setT(tx * 0.6 + (ex / m) * 0.4, ty * 0.6 + (ey / m) * 0.4); }
      }
    }
    if (tx != null) {
      const want = Math.atan2(ty, tx);
      if (src === 'mouse' && !ka) aim.ang = want;
      else { let da = want - aim.ang; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; aim.ang += da * Math.min(1, dt * (ka ? 14 : 9)); }
      aim.x = Math.cos(aim.ang); aim.y = Math.sin(aim.ang);
    }
    if (Math.abs(aim.x) > 0.08 && PL.dashT <= 0) PL.face = aim.x > 0 ? 1 : -1;
  }

  function step(dt) {
    const run = G.run;
    if (I.take('pause')) { G.pause(true); return; }
    if (I.take('reset')) { G.restart(); return; }
    if (I.take('wheel')) WTP.ui?.wheel?.(true);
    if (I.take('next')) G.cycle(1);
    if (I.take('prev')) G.cycle(-1);
    if (I.zoomReq) { G.zoom(I.zoomReq < 0 ? 1 : -1); I.zoomReq = 0; }
    updateAim(dt);
    const ended = run.ended;
    PL.update(dt, ended);
    const hand = PL.gunPos || PL.gun();
    let gun = PL.muzzle || hand;
    const bx = PL.x + PL.w / 2, by = PL.y + 5;
    const gdx = gun.x - bx, gdy = gun.y - by, gd = Math.hypot(gdx, gdy);
    if (gd > 0.01) for (let t = 0; t <= gd; t += 0.5) { const x = bx + (gdx * t) / gd, y = by + (gdy * t) / gd; if (Wd.solid(Math.floor(x), Math.floor(y))) { gun = { x, y }; break; } }
    const wheelOpen = WTP.ui?.wheelOpen?.();
    const want = !ended && !wheelOpen && !PL.dead && I.wantFire();
    const alt = !ended && I.take('alt');
    if (!ended && !PL.dead && I.take('melee')) WP.melee({ x: bx, y: PL.y + PL.h / 2, ax: aim.x, ay: aim.y });
    WP.update(dt, want, alt, { x: gun.x, y: gun.y, hx: hand.x, hy: hand.y, ax: aim.x, ay: aim.y, bx, by });
    WTP.props.update(dt);
    EN.update(dt);
    Wd.updateBurn();
    Wd.updateIce();
    Wd.updateChunks(dt);
    Wd.updateSand();
    if (quality >= 2 || (run.frame & 1)) Wd.updateSand();
    FX.update(dt);
    if (!ended) {
      if (run.timerOn) run.t += dt;
      run.comboT -= dt;
      run.comboPop = Math.max(0, (run.comboPop || 0) - dt * 3);
      if (run.comboT <= 0 && run.combo) { run.combo = 0; run.comboShown = 0; run.mult = 1; }
      run.mode.tick(run, dt);
      if (run.hud?.hp) {
        if (PL.hurtT > 0) run.noHit = false;
        if (run.waveClear && run.noHit) run.noHitWave = Math.max(run.noHitWave, run.wave);
      }
      if (PL.y > Wd.h + 30) PL.spawn(PL.x, 2);
    }
    run.frame++;
  }

  function loop(t) {
    if (!G.playing) return;
    raf = requestAnimationFrame(loop);
    const t0 = performance.now();
    const dt = Math.max(0, Math.min(0.1, (t - last) / 1000));
    last = t;
    frameMs = frameMs * 0.92 + dt * 1000 * 0.08;
    adapt();
    I.pollPad();
    if (!G.paused && G.run) {
      if (pendingSlot != null) { G.slotKey(pendingSlot); pendingSlot = null; }
      if (slowT > 0) { slowT -= dt; timeScale = slowT <= 0 ? 1 : Math.min(1, timeScale + dt * 0.4); }
      const wheelSlow = WTP.ui?.wheelOpen?.() ? 0.12 : 1;
      if (hitstopT > 0) hitstopT -= dt;
      else {
        acc += dt * timeScale * wheelSlow;
        let n = 0;
        while (acc >= STEP && n < 5) { step(STEP); acc -= STEP; n++; }
        if (n === 5) acc = 0;
      }
      shakeT *= Math.pow(0.004, dt);
      chromaT = Math.max(0, chromaT - dt);
      updateCam(dt);
    } else if (G.paused) WTP.ui?.padNav?.();
    render(dt);
    const work = performance.now() - t0;
    workMs = workMs * 0.95 + work * 0.05;
    workMax = Math.max(workMax * 0.995, work);
    if (WTP.save.settings.fps) drawFps();
    hudT -= dt;
    if (hudT <= 0 && G.run) { hudT = 0.1; WTP.ui?.hud?.(G.run); WTP.ui?.tick?.(); }
  }
  function drawFps() {
    const sc = Math.max(2, Math.round(dpr * 2));
    const txt = `${Math.round(1000 / Math.max(1, frameMs))} FPS  ${workMs.toFixed(1)}MS  Q${quality}`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    WTP.font.draw(ctx, txt, 12 * dpr, cv.height - 70 * dpr, { color: 'l', outline: '0', scale: sc });
  }
  function adapt() {
    const maxQ = WTP.save.settings.particles;
    if (!WTP.save.settings.adaptive) { if (quality !== maxQ) setQuality(maxQ); return; }
    if (frameMs > 21 || workMs > 13) { slowFrames++; fastFrames = 0; if (slowFrames > 90 && quality > 0) { setQuality(quality - 1); slowFrames = 0; } }
    else if (frameMs < 18.5 && workMs < 8) { fastFrames++; slowFrames = 0; if (fastFrames > 400 && quality < maxQ) { setQuality(quality + 1); fastFrames = 0; } }
    if (quality > maxQ) setQuality(maxQ);
  }
  function setQuality(q) {
    quality = q;
    Wd.quality = q;
    FX.cap = [2500, 5000, 8500][q];
    Wd.chunkLimit = [30, 50, 80][q];
    Wd.componentLimit = [500, 750, 1000][q];
  }
  G.quality = () => quality;
  G.frameMs = () => frameMs;
  setQuality(2);

  function updateCam(dt) {
    const vwc = viewW(), vhc = viewH();
    const pc = PL.center();
    let tx = pc.x - vwc / 2 + aim.x * Math.min(36, vwc * 0.14);
    let ty = pc.y - vhc * (I.isTouch ? 0.46 : 0.5) + aim.y * Math.min(28, vhc * 0.12);
    if (vwc >= Wd.w - 2) tx = (Wd.w - vwc) / 2; else tx = Math.max(-2, Math.min(Wd.w + 2 - vwc, tx));
    ty = Math.max(-34, Math.min(Wd.h + 8 - vhc, ty));
    cam.x += (tx - cam.x) * Math.min(1, dt * 7);
    cam.y += (ty - cam.y) * Math.min(1, dt * (PL.vy > 200 ? 12 : 7));
  }

  function makeVoid() {
    if (voidPat && voidS === S) return;
    voidS = S;
    const T = 48;
    const g = { w: T, h: T, px: new Uint32Array(T * T) };
    const base = P32['1'], dark = P32['0'], line = P32['2'], node = P32['3'];
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      let c = base;
      if (WTP.sprites.dith(x, y, 0.18)) c = dark;
      if (x % 24 === 0 || y % 24 === 0) c = line;
      g.px[y * T + x] = c;
    }
    const traces = [[4, 8, 18, 8], [18, 8, 18, 18], [30, 30, 44, 30], [30, 30, 30, 40], [8, 36, 16, 36], [36, 4, 36, 14]];
    for (const [x0, y0, x1, y1] of traces) { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) g.px[y * T + x] = line; g.px[y1 * T + x1] = node; g.px[y0 * T + x0] = node; }
    const small = WTP.sprites.toCanvas(g);
    const big = document.createElement('canvas');
    big.width = T * S; big.height = T * S;
    const b = big.getContext('2d');
    b.imageSmoothingEnabled = false;
    b.drawImage(small, 0, 0, big.width, big.height);
    voidPat = ctx.createPattern(big, 'repeat');
  }
  function drawShadow(x0, y0, w, h) {
    if (!shadowCv || shadowCv.width < w || shadowCv.height < h) { shadowCv = document.createElement('canvas'); shadowCv.width = w + 32; shadowCv.height = h + 32; shadowCtx = shadowCv.getContext('2d'); }
    shadowCtx.globalCompositeOperation = 'source-over';
    shadowCtx.clearRect(0, 0, shadowCv.width, shadowCv.height);
    shadowCtx.drawImage(Wd.levelCv, x0, y0, w, h, 0, 0, w, h);
    shadowCtx.globalCompositeOperation = 'source-in';
    shadowCtx.fillStyle = PAL['0'];
    shadowCtx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.6;
    ctx.drawImage(shadowCv, 0, 0, w, h, x0 + 2, y0 + 3, w, h);
    ctx.globalAlpha = 1;
  }
  function render(dt) {
    if (!G.run) return;
    Wd.flush();
    makeVoid();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = PAL['1'];
    ctx.fillRect(0, 0, cv.width, cv.height);
    const intensity = WTP.save.settings.shake * (WTP.reducedMotion() ? 0.3 : 1);
    const sh = shakeT * intensity;
    const sx = sh > 0.4 ? Math.round(rand(-sh, sh) * 0.5) * Math.max(1, S >> 1) : 0, sy = sh > 0.4 ? Math.round(rand(-sh, sh) * 0.5) * Math.max(1, S >> 1) : 0;
    const ox = Math.round(-cam.x * S + sx), oy = Math.round(-cam.y * S + sy);
    ctx.setTransform(S, 0, 0, S, ox, oy);
    if (desk) ctx.drawImage(desk.cv, Math.round(cam.x * 0.3 - 60 - (desk.off || 0)), Math.round(cam.y * 0.45 - 60));
    else { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.translate(Math.round(ox * 0.35) % (48 * S), Math.round(oy * 0.35) % (48 * S)); ctx.fillStyle = voidPat; ctx.fillRect(-48 * S, -48 * S, cv.width + 96 * S, cv.height + 96 * S); ctx.restore(); }
    const vx0 = Math.max(0, Math.floor(cam.x) - 4), vy0 = Math.max(0, Math.floor(cam.y) - 4);
    const vx1 = Math.min(Wd.w, Math.ceil(cam.x + viewW()) + 4), vy1 = Math.min(Wd.h, Math.ceil(cam.y + viewH()) + 4);
    const rw = vx1 - vx0, rh = vy1 - vy0;
    if (rw > 0 && rh > 0) {
      if (quality >= 1) drawShadow(vx0, vy0, rw, rh);
      ctx.drawImage(Wd.levelCv, vx0, vy0, rw, rh, vx0, vy0, rw, rh);
    }
    ctx.fillStyle = PAL['0'];
    const fy0 = Wd.top - 1, fh = Wd.h - Wd.top - 2;
    ctx.fillRect(Wd.PX0 - 1, fy0, 1, fh); ctx.fillRect(Wd.PX1, fy0, 1, fh);
    drawTargets();
    const fxr = FX.render(ctx, cam, viewW(), viewH());
    ctx.drawImage(fxr.back, fxr.ox, fxr.oy);
    WTP.props.draw(ctx);
    EN.draw(ctx);
    WP.draw(ctx);
    WTP.gadgets.drawWorld(ctx);
    const cur = WP.current();
    PL.draw(ctx, dt, G.run.ended && G.run.won ? null : cur.sprite, aim, { swing: WP.swing() });
    if (PL.muzzle && !G.run.ended) {
      if (cur.id === 'minigun' && WP.st.spin > 0 && (((performance.now() / (70 - WP.st.spin * 55)) | 0) & 1)) { ctx.fillStyle = PAL['6']; ctx.fillRect(Math.round(PL.muzzle.x - aim.x * 4), Math.round(PL.muzzle.y - aim.y * 4), 1, 1); }
      if (cur.id === 'chainsaw' && I.wantFire()) { ctx.fillStyle = PAL['7']; const t = (performance.now() / 40) | 0; for (let k = 4; k < 14; k += 3) ctx.fillRect(Math.round(PL.gunPos.x + aim.x * (k + (t & 1))), Math.round(PL.gunPos.y + aim.y * (k + (t & 1)) - 1), 1, 1); }
      if (cur.charge && WP.st.charge > 0) { const k = Math.min(1, WP.st.charge / cur.charge); ctx.fillStyle = k >= 1 ? PAL['7'] : PAL.C; const s2 = 1 + Math.round(k * 2); ctx.fillRect(Math.round(PL.muzzle.x) - (s2 >> 1), Math.round(PL.muzzle.y) - (s2 >> 1), s2, s2); }
      if (WP.st.reload > 0) WTP.font.draw(ctx, 'RELOAD', Math.round(PL.x + 3), Math.round(PL.y - 14), { align: 'center', color: 'y', outline: '0' });
    }
    FX.drawAnims(ctx, 1);
    ctx.drawImage(fxr.front, fxr.ox, fxr.oy);
    for (const p of FX.pops) {
      const k = p.t / p.life;
      const sc = Math.max(1, Math.round(p.scale * (k < 0.1 ? 0.6 + k * 4 : 1)));
      if (k > 0.8 && !WTP.sprites.dith(Math.round(p.x), Math.round(p.y), (1 - k) * 5)) continue;
      WTP.font.draw(ctx, p.text, Math.round(p.x), Math.round(p.y + p.vy * p.t * (1 - k * 0.5)), { align: 'center', ramp: p.ramp || ['7'], outline: '0', scale: sc });
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (FX.flashA > 0.01) { ctx.globalAlpha = Math.min(0.85, FX.flashA); ctx.fillStyle = FX.flashC; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1; }
    if (PL.hp <= 2 && G.run.hud?.hp && !G.run.ended) { const a = 0.2 + Math.sin(performance.now() / 160) * 0.08; ctx.globalAlpha = a; ctx.strokeStyle = PAL.e; ctx.lineWidth = 16 * dpr; ctx.strokeRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1; }
    drawOffscreen(ox, oy);
    drawCombo();
    drawCrosshair();
    const f = chromaT > 0 ? `drop-shadow(${Math.round(chromaT * 30)}px 0 0 rgba(255,95,162,.55)) drop-shadow(-${Math.round(chromaT * 30)}px 0 0 rgba(143,227,255,.55))` : '';
    if (cv.style.filter !== f) cv.style.filter = f;
  }
  function drawTargets() {
    const T = Wd.targets;
    if (!T || T.length < 2) return;
    const pulse = (Math.sin(performance.now() / 160) + 1) / 2;
    const sem = WTP.sem();
    ctx.fillStyle = pulse > 0.5 ? WTP.css32(sem.target) : WTP.css32(sem.target2);
    const p = Math.round(pulse);
    for (let k = 1; k < T.length; k++) {
      const g = T[k];
      if (!g || g.done) continue;
      const x0 = g.x0 - 2 - p, y0 = g.y0 - 2 - p, x1 = g.x1 + 2 + p, y1 = g.y1 + 2 + p;
      const L = 3;
      ctx.fillRect(x0, y0, L, 1); ctx.fillRect(x0, y0, 1, L);
      ctx.fillRect(x1 - L + 1, y0, L, 1); ctx.fillRect(x1, y0, 1, L);
      ctx.fillRect(x0, y1, L, 1); ctx.fillRect(x0, y1 - L + 1, 1, L);
      ctx.fillRect(x1 - L + 1, y1, L, 1); ctx.fillRect(x1, y1 - L + 1, 1, L);
    }
  }
  function drawOffscreen(ox, oy) {
    const T = Wd.targets;
    const pts = [];
    if (T && T.length > 1) for (let k = 1; k < T.length; k++) { const g = T[k]; if (g && !g.done) pts.push({ x: (g.x0 + g.x1) / 2, y: (g.y0 + g.y1) / 2, c: WTP.sem().targetHex }); }
    for (const e of EN.list) if (!e.dead) pts.push({ x: e.x, y: e.y, c: PAL.e });
    if (!pts.length) return;
    const m = 22 * dpr;
    const u = Math.max(2, Math.round(dpr * 2));
    for (const p of pts) {
      const sx = p.x * S + ox, sy = p.y * S + oy;
      if (sx > 0 && sy > 0 && sx < cv.width && sy < cv.height) continue;
      const cx = cv.width / 2, cy = cv.height / 2;
      const a = Math.atan2(sy - cy, sx - cx);
      const k = Math.min((cv.width / 2 - m) / Math.abs(Math.cos(a) || 0.001), (cv.height / 2 - m) / Math.abs(Math.sin(a) || 0.001));
      const x = Math.round(cx + Math.cos(a) * k), y = Math.round(cy + Math.sin(a) * k);
      const dir = Math.round(a / (Math.PI / 2)) & 3;
      const pix = [[0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [1, -1], [1, 0], [1, 1], [2, 0]];
      ctx.fillStyle = PAL['0'];
      for (const [px, py] of pix) { const [rx, ry] = rot(px, py, dir); ctx.fillRect(x + rx * u - u, y + ry * u - u, u * 3, u * 3); }
      ctx.fillStyle = p.c;
      for (const [px, py] of pix) { const [rx, ry] = rot(px, py, dir); ctx.fillRect(x + rx * u, y + ry * u, u, u); }
    }
  }
  const rot = (x, y, d) => (d === 0 ? [x, y] : d === 1 ? [-y, x] : d === 2 ? [-x, -y] : [y, -x]);
  function drawCrosshair() {
    if (I.isTouch || !I.mouse.in || I.aim.src !== 'mouse' || G.run.ended || G.paused) return;
    const u = Math.max(2, Math.round(dpr * 2));
    const x = Math.round(I.mouse.x * dpr), y = Math.round(I.mouse.y * dpr);
    const fire = I.wantFire();
    const gap = fire ? 2 : 3;
    const c = fire ? PAL.y : PAL['7'];
    const rects = [];
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const w = dx ? 2 * u : u, h = dy ? 2 * u : u;
      const rx = dx > 0 ? x + gap * u : dx < 0 ? x - gap * u - w : x - (u >> 1);
      const ry = dy > 0 ? y + gap * u : dy < 0 ? y - gap * u - h : y - (u >> 1);
      rects.push([rx, ry, w, h]);
    }
    rects.push([x - (u >> 1), y - (u >> 1), u, u]);
    const o = Math.max(1, u >> 1);
    ctx.fillStyle = PAL['0'];
    for (const [rx, ry, w, h] of rects) ctx.fillRect(rx - o, ry - o, w + o * 2, h + o * 2);
    for (let k = 0; k < rects.length; k++) { const [rx, ry, w, h] = rects[k]; ctx.fillStyle = k === 4 && I.pointerFire && WTP.save.settings.toggleFire ? PAL.e : c; ctx.fillRect(rx, ry, w, h); }
  }
  function drawCombo() {
    const run = G.run;
    if (!run || run.combo < 5 || run.hud?.minimal || run.ended) return;
    const sc = Math.max(2, Math.round(dpr * 2));
    const narrow = vw < 560;
    if (!comboY || (run.frame % 30) === 0) { const hl = document.querySelector('.hud-l'); const sr = stage.getBoundingClientRect(); comboY = hl ? hl.getBoundingClientRect().bottom - sr.top + 18 : 90; }
    const left = narrow;
    const x = left ? 12 * dpr : cv.width - 14 * dpr, y = Math.round((narrow ? comboY : 76) * dpr);
    const al = left ? 'left' : 'right';
    const pop = Math.max(0, run.comboPop || 0);
    const t = WTP.font.draw(ctx, `${run.combo} HIT COMBO`, x, y, { align: al, ramp: ['7', 'Y', 'y', 'a', 'o'], outline: '0', scale: sc, bold: true });
    WTP.font.draw(ctx, `x${run.mult}`, x, y + t.h * sc, { align: al, ramp: ['Y', 'y', 'a', 'o', 'e'], outline: '0', scale: sc * 2 + (pop > 0.5 ? sc : 0), bold: true });
    const BW = Math.round(110 * dpr);
    const bw = Math.round(BW * Math.max(0, run.comboT / 1.6));
    const bx = left ? x : x - BW;
    ctx.fillStyle = PAL['0']; ctx.fillRect(bx - sc, y - sc * 3, BW + sc * 2, sc * 3);
    ctx.fillStyle = run.comboT < 0.5 ? PAL.e : PAL.y; ctx.fillRect(bx, y - sc * 2, bw, sc);
  }

  G.zoom = (d) => { zoomBias = Math.max(-2, Math.min(4, zoomBias + d)); computeScale(); voidPat = null; if (G.run && desk && desk.h < Wd.h * 0.55 + viewH() + 100) desk = WTP.levels.buildDesktop(G.run.page, viewW(), viewH()); };
  G.aim = aim;
  G.cam = cam;
  G.scale = () => S;

  window.__wtp = {
    get stats() { const r = G.run; return { W: Wd.w, H: Wd.h, total: Wd.total, destroyed: Wd.destroyed, pct: MD.pct(), score: r?.score, t: r?.t, parts: FX.np, chunks: Wd.chunks.length, burning: Wd.burning.length, rubble: Wd.rubbleN, shots: WP.shots.length, weapon: WP.st.cur, ended: r?.ended, grade: r?.grade, enemies: EN.count(), hp: PL.hp, wave: r?.wave, targets: r?.targetsTotal, targetsDown: r?.targetsDown, quality, frameMs, workMs, workMax, S, P: { x: PL.x, y: PL.y, ground: PL.ground } }; },
    select: (id) => G.selectWeapon(id, true),
    fire: (on) => { I.fireLock = on; },
    setAim: (x, y) => { const m = Math.hypot(x, y) || 1; aim.x = x / m; aim.y = y / m; aim.ang = Math.atan2(aim.y, aim.x); I.aim.src = 'test'; },
    tp: (x, y) => { PL.x = x; PL.y = y; PL.vx = 0; PL.vy = 0; },
    explode: (x, y, r) => WP.explode(x, y, r),
    end: (r) => G.end(r),
    weapons: () => WP.DEFS.map((d) => d.id),
    allowAll: () => { if (G.run) { G.run.allWeapons = true; } }
  };
})();
