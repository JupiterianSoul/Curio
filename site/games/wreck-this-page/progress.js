(() => {
  const WTP = window.WTP;
  const S = () => WTP.save;
  const st = () => S().stats;
  const ownedCount = () => WTP.weapons.DEFS.filter((d) => d.price === 0 || S().owned[d.id]).length;
  const ACH = [
    { id: 'first', name: 'First Blood', desc: 'Destroy your first pixel.', icon: 'star', r: 50, test: () => st().pixels > 0 },
    { id: 'px10k', name: 'Hobbyist', desc: 'Wreck 10,000 pixels in total.', icon: 'stats', r: 100, test: () => st().pixels >= 1e4 },
    { id: 'px100k', name: 'Professional', desc: 'Wreck 100,000 pixels in total.', icon: 'stats', r: 250, test: () => st().pixels >= 1e5 },
    { id: 'px1m', name: 'Demolition Crew', desc: 'Wreck 1,000,000 pixels in total.', icon: 'stats', r: 600, test: () => st().pixels >= 1e6 },
    { id: 'px10m', name: 'Heat Death', desc: 'Wreck 10,000,000 pixels in total.', icon: 'stats', r: 2000, test: () => st().pixels >= 1e7 },
    { id: 'flat', name: 'Flattened', desc: 'Destroy 80% of any page.', icon: 'page', r: 100, test: (c) => c && c.pct >= 80 },
    { id: 'sweep', name: 'Clean Sweep', desc: 'Destroy 99% of a page.', icon: 'page', r: 500, test: (c) => c && c.pct >= 99 },
    { id: 'tourist', name: 'Tourist', desc: 'Visit every built-in page.', icon: 'home', r: 300, test: () => WTP.pages.filter((p) => !p.hidden).every((p) => S().seenPages[p.id]) },
    { id: 'words', name: 'Wordsmith', desc: 'Wreck a page made of your own words.', icon: 'pen', r: 100, test: (c) => c && c.own },
    { id: 'speedS', name: 'Speed Demon', desc: 'Get an S in Speedrun.', icon: 'clock', r: 300, test: (c) => c && c.mode === 'speed' && c.grade === 'S' },
    { id: 'timeS', name: 'Time Lord', desc: 'Get an S in Time Attack.', icon: 'bolt', r: 300, test: (c) => c && c.mode === 'time' && c.grade === 'S' },
    { id: 'wave10', name: 'Survivor', desc: 'Reach wave 10 in Survival.', icon: 'skull', r: 500, test: () => st().bestWave >= 10 },
    { id: 'nohit', name: 'Untouchable', desc: 'Clear wave 5 without taking a hit.', icon: 'heart', r: 400, test: (c) => c && c.noHitWave >= 5 },
    { id: 'targetS', name: 'Bullseye', desc: 'Get an S in Target Hunt.', icon: 'target', r: 300, test: (c) => c && c.mode === 'targets' && c.grade === 'S' },
    { id: 'puzzles', name: 'Puzzle Master', desc: 'Solve every ammo puzzle.', icon: 'puzzle', r: 800, test: () => WTP.modes.PUZZLES.every((p) => (S().bests[`puzzle:${p.id}`] || 0) > 0) },
    { id: 'zen', name: 'Inner Peace', desc: 'Spend 10 minutes in Zen mode.', icon: 'zen', r: 200, test: () => st().zenTime >= 600 },
    { id: 'daily3', name: 'Daily Driver', desc: 'Complete 3 daily challenges.', icon: 'calendar', r: 300, test: () => st().dailies >= 3 },
    { id: 'campaign', name: 'Story Mode', desc: 'Finish the campaign.', icon: 'flag', r: 1000, test: () => WTP.modes.CAMPAIGN.every((l) => (S().campaign[l.id] || 0) > 0) },
    { id: 'stars', name: 'Three-Star General', desc: 'Get 3 stars on every campaign level.', icon: 'star', r: 2000, test: () => WTP.modes.CAMPAIGN.every((l) => (S().campaign[l.id] || 0) >= 3) },
    { id: 'c100', name: 'Combo Starter', desc: 'Reach a 100-hit combo.', icon: 'bolt', r: 150, test: () => st().bestCombo >= 100 },
    { id: 'c500', name: 'Combo Machine', desc: 'Reach a 500-hit combo.', icon: 'bolt', r: 400, test: () => st().bestCombo >= 500 },
    { id: 'c1000', name: 'Combo God', desc: 'Reach a 1,000-hit combo.', icon: 'bolt', r: 1000, test: () => st().bestCombo >= 1000 },
    { id: 'pyro', name: 'Pyromaniac', desc: 'Burn 20,000 pixels.', icon: 'skull', r: 300, test: () => st().burned >= 2e4 },
    { id: 'ice', name: 'Ice Ice Baby', desc: 'Shatter 5,000 frozen pixels.', icon: 'star', r: 300, test: () => st().iced >= 5000 },
    { id: 'glass', name: 'Glass Act', desc: 'Shatter 50 glass elements.', icon: 'cross', r: 300, test: () => st().glass >= 50 },
    { id: 'letters', name: 'Letter Opener', desc: 'Knock 1,000 letters off the page.', icon: 'pen', r: 300, test: () => st().letters >= 1000 },
    { id: 'nuke', name: 'Big Bang', desc: 'Detonate a pocket nuke.', icon: 'skull', r: 300, test: () => st().nukes >= 1 },
    { id: 'hole', name: 'Event Horizon', desc: 'Feed black holes 5,000 pixels.', icon: 'zen', r: 300, test: () => st().eaten >= 5000 },
    { id: 'own20', name: 'Collector', desc: 'Own 20 weapons.', icon: 'gun', r: 500, test: () => ownedCount() >= 20 },
    { id: 'ownall', name: 'Arsenal', desc: 'Own every single weapon.', icon: 'gun', r: 3000, test: () => ownedCount() >= WTP.weapons.DEFS.length },
    { id: 'skins4', name: 'Fashionista', desc: 'Unlock 4 skins.', icon: 'shirt', r: 300, test: () => WTP.sprites.SKINS.filter((s) => skinStatus(s).ok).length >= 4 },
    { id: 'rj', name: 'Rocket Jumper', desc: 'Get launched 60 pixels into the air by your own explosion.', icon: 'jump', r: 200, test: (c) => c && c.rocketJump >= 60 },
    { id: 'walls', name: 'Wall Runner', desc: 'Wall jump 10 times in one run.', icon: 'jump', r: 200, test: (c) => c && c.walljumps >= 10 },
    { id: 'dash', name: 'Dash Master', desc: 'Dash 200 times.', icon: 'dash', r: 200, test: () => st().dashes >= 200 },
    { id: 'portal', name: 'Thinking With Portals', desc: 'Teleport through portals 25 times.', icon: 'eye', r: 300, test: () => st().portals >= 25 },
    { id: 'paint', name: 'Vandal', desc: 'Paint 20,000 pixels.', icon: 'pen', r: 300, test: () => st().painted >= 2e4 },
    { id: 'bees', name: 'Hive Mind', desc: 'Let bees eat 2,000 pixels.', icon: 'bolt', r: 300, test: () => st().bees >= 2000 },
    { id: 'throws', name: 'Telekinetic', desc: 'Throw 50 chunks with the gravity gun.', icon: 'gear', r: 300, test: () => st().throws >= 50 },
    { id: 'slowmo', name: 'Bullet Time', desc: 'Trigger slow motion 10 times.', icon: 'clock', r: 200, test: () => st().slowmos >= 10 },
    { id: 'boss', name: 'Unsubscribed', desc: 'Defeat the Newsletter Modal.', icon: 'cross', r: 800, test: (c) => c && c.bossKilled },
    { id: 'kills', name: 'Pop-up Blocker', desc: 'Pop 250 enemies.', icon: 'skull', r: 400, test: () => st().kills >= 250 },
    { id: 'timber', name: 'Timber!', desc: 'Drop a single chunk bigger than 260 pixels.', icon: 'star', r: 150, test: (c) => c && c.timber }
  ];
  const queue = [];
  function check(ctx) {
    const got = [];
    for (const a of ACH) {
      if (S().achievements[a.id]) continue;
      let ok = false;
      try { ok = a.test(ctx); } catch (e) { ok = false; }
      if (ok) { S().achievements[a.id] = Date.now(); S().scrap += a.r; got.push(a); queue.push(a); }
    }
    if (got.length) { WTP.persist(); for (const a of got) WTP.emit('achievement', a); }
    return got;
  }
  function skinStatus(s) {
    const n = s.need;
    if (n.type === 'free' || S().skins[s.id]) return { ok: true, text: 'Unlocked' };
    if (n.type === 'stars') { const have = WTP.modes.totalStars(); return { ok: have >= n.n, text: `${have}/${n.n} stars` }; }
    if (n.type === 'scrap') return { ok: false, buy: true, cost: n.n, text: `${WTP.fmtInt(n.n)} scrap` };
    if (n.type === 'ach') { const have = Object.keys(S().achievements).length; return { ok: have >= n.n, text: `${have}/${n.n} trophies` }; }
    if (n.type === 'wave') return { ok: st().bestWave >= n.n, text: `Reach wave ${n.n}` };
    if (n.type === 'pixels') return { ok: st().pixels >= n.n, text: `${WTP.fmtInt(Math.min(st().pixels, n.n))}/${WTP.fmtInt(n.n)} pixels` };
    if (n.type === 'page') { const ok = (S().bests[`flat:${n.n}`] || 0) >= 80; return { ok, text: 'Flatten Dave\'s homepage (80%)' }; }
    if (n.type === 'burn') return { ok: st().burned >= n.n, text: `${WTP.fmtInt(Math.min(st().burned, n.n))}/${WTP.fmtInt(n.n)} burned` };
    return { ok: false, text: '?' };
  }
  function buySkin(s) {
    const stt = skinStatus(s);
    if (stt.ok) { S().skins[s.id] = true; return true; }
    if (stt.buy && S().scrap >= stt.cost) { S().scrap -= stt.cost; S().skins[s.id] = true; WTP.persist(); return true; }
    return false;
  }
  function buyWeapon(id) {
    const d = WTP.weapons.BY[id];
    if (!d || d.price === 0 || S().owned[id]) return true;
    if (S().scrap < d.price) return false;
    S().scrap -= d.price;
    S().owned[id] = true;
    const hb = S().hotbar;
    if (!hb.includes(id)) { const k = hb.indexOf(null); if (k >= 0) hb[k] = id; }
    WTP.persist();
    check();
    return true;
  }
  const isOwned = (id) => { const d = WTP.weapons.BY[id]; return !!d && (d.price === 0 || !!S().owned[id]); };
  function defaultHotbar() {
    const hb = WTP.normHotbar(S().hotbar).map((id) => (id && isOwned(id) ? id : null));
    if (!hb.some(Boolean)) {
      const owned = WTP.weapons.DEFS.filter((d) => isOwned(d.id)).map((d) => d.id);
      for (let i = 0; i < hb.length && i < owned.length; i++) hb[i] = owned[i];
    }
    S().hotbar = hb;
    return hb;
  }
  WTP.progress = { ACH, check, skinStatus, buySkin, buyWeapon, isOwned, defaultHotbar, ownedCount, queue };
})();
