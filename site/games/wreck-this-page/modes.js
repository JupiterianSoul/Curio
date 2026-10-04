(() => {
  const WTP = window.WTP;
  const { rand, pick } = WTP;
  const G = () => WTP.game, Wd = () => WTP.world, EN = () => WTP.enemies, PL = () => WTP.player;
  const pct = () => (Wd().destroyed / Wd().total) * 100;
  const gradeBy = (v, s, a, b, lower) => lower ? (v <= s ? 'S' : v <= a ? 'A' : v <= b ? 'B' : 'C') : (v >= s ? 'S' : v >= a ? 'A' : v >= b ? 'B' : 'C');
  const par = () => Math.round(Math.max(35, Math.min(130, Wd().total / 1500)));

  const MODES = {
    free: {
      name: 'Free Wreck', icon: 'play', col: 'o', music: 'wreck',
      desc: 'No clock, no rules. Wreck the page however you like. Hit 80% to call it flattened.',
      hud: { pct: true, time: true, score: true, goal: 80 },
      setup(run) { run.goal = run.params?.goal || 80; G().label(`WRECK ${run.goal}% OF ${run.page.site.toUpperCase()}`, 2400); },
      tick(run) { if (!run.goalHit && pct() >= run.goal) { run.goalHit = true; G().announce('PAGE FLATTENED!', 4); G().showFinish(true); if (run.params?.autoEnd) G().end('goal'); } },
      grade(run) { return gradeBy(pct(), 95, 80, 50); },
      bestKey: (run) => `free:${run.page.id}`, bestVal: (run) => Math.round(run.score), higher: true,
      rows(run) { return [['Destroyed', `${pct().toFixed(1)}%`], ['Time', WTP.fmtTime(run.t)]]; }
    },
    speed: {
      name: 'Speedrun', icon: 'clock', col: 'y', music: 'wreck2',
      desc: 'Wreck 80% of the page as fast as humanly possible. The clock starts when you do.',
      hud: { pct: true, time: true, score: false, goal: 80, big: 'time' },
      setup(run) { run.goal = run.params?.goal || 80; run.par = par(); G().label(`${run.goal}% AS FAST AS YOU CAN · PAR ${run.par}s`, 2400); },
      tick(run) { if (pct() >= run.goal) G().end('goal'); },
      grade(run) { return run.reason !== 'goal' ? 'C' : gradeBy(run.t, run.par * 0.6, run.par, run.par * 1.5, true); },
      bestKey: (run) => `speed:${run.page.id}`, bestVal: (run) => run.reason === 'goal' ? Math.round(run.t * 10) / 10 : null, higher: false, fmt: (v) => WTP.fmtTime(v),
      rows(run) { return [['Time', run.reason === 'goal' ? WTP.fmtTime(run.t) : 'DNF'], ['Par', `${run.par}s`]]; }
    },
    time: {
      name: 'Time Attack', icon: 'bolt', col: 'e', music: 'wreck',
      desc: 'Sixty seconds. Destroy as much as you can before the bell.',
      hud: { pct: true, time: true, score: true, countdown: true, big: 'score' },
      setup(run) { run.limit = run.params?.limit || 60; G().label(`${run.limit} SECONDS. GO!`, 2000); G().startTimer(); },
      tick(run) { const left = run.limit - run.t; if (left <= 5 && Math.ceil(left) !== run.lastBeep) { run.lastBeep = Math.ceil(left); WTP.audio.play('countdown'); } if (left <= 0) G().end('time'); },
      grade(run) { const p = pct(); const k = run.limit / 60; return gradeBy(p, 70 * k, 50 * k, 30 * k); },
      bestKey: (run) => `time:${run.page.id}:${run.limit}`, bestVal: (run) => Math.round(run.score), higher: true,
      rows(run) { return [['Destroyed', `${pct().toFixed(1)}%`], ['In', `${run.limit}s`]]; }
    },
    survival: {
      name: 'Survival', icon: 'skull', col: 'k', music: 'survival',
      desc: 'The page fights back. Pop-up ads, captchas, cookie banners and cursor drones. Survive the waves.',
      hud: { pct: true, time: true, score: true, hp: true, wave: true },
      setup(run) { run.wave = 0; run.waveT = 2.5; run.maxWave = run.params?.waves || 0; run.kills = 0; run.noHit = true; PL().maxHp = 6; PL().hp = 6; G().label('SURVIVE THE PAGE', 2000); G().startTimer(); },
      tick(run, dt) {
        const alive = EN().count();
        if (run.spawnQ && run.spawnQ.length) { run.spawnT -= dt; if (run.spawnT <= 0) { const t = run.spawnQ.shift(); EN().spawnEdge(t, { hpMul: 1 + run.wave * 0.08 }); run.spawnT = Math.max(0.35, 1.2 - run.wave * 0.06); } }
        else if (alive === 0) {
          if (run.wave > 0 && !run.waveClear) { run.waveClear = true; G().announce(`WAVE ${run.wave} CLEAR`, 2); G().bonus(250 * run.wave, PL().x, PL().y - 20); if (run.maxWave && run.wave >= run.maxWave) { G().end('waves'); return; } }
          run.waveT -= dt;
          if (run.waveT <= 0) startWave(run);
        }
      },
      grade(run) { const w = run.maxWave ? (run.wave >= run.maxWave && run.reason === 'waves' ? 10 : run.wave) : run.wave; return gradeBy(w - (run.reason === 'dead' ? 1 : 0), 10, 7, 4); },
      bestKey: () => 'survival', bestVal: (run) => run.wave, higher: true, fmt: (v) => `Wave ${v}`,
      rows(run) { return [['Wave reached', run.wave], ['Enemies popped', run.kills || 0]]; }
    },
    targets: {
      name: 'Target Hunt', icon: 'target', col: 'c', music: 'wreck2',
      desc: 'Specific words and elements are marked for demolition. Find them, wreck them, beat the clock.',
      hud: { time: true, targets: true, score: false, big: 'time' },
      setup(run) {
        const n = run.params?.count || 8;
        let total = 0;
        if (run.params?.selector) total = Wd().setTargetsFromRects(Wd().tElems);
        else if (run.params?.match) total = Wd().setTargetsFromWords(Wd().words.filter((w) => run.params.match.test(w.text)));
        else {
          const r = WTP.rng(run.params?.seed ?? (Math.random() * 1e9) | 0);
          const pool = Wd().words.filter((w) => w.text.length >= 5 && w.y > 120);
          const picked = [];
          const used = new Set();
          for (const w of r.shuffle(pool)) { if (picked.length >= n) break; const k = w.text.toLowerCase(); if (used.has(k)) continue; if (picked.some((p) => Math.abs(p.y - w.y) < 40 && Math.abs(p.x - w.x) < 120)) continue; used.add(k); picked.push(w); }
          total = Wd().setTargetsFromWords(picked);
        }
        run.targetsTotal = total; run.targetsDown = 0;
        run.par = Math.round(15 + total * 6);
        G().label(`DESTROY ${total} TARGETS`, 2200);
      },
      tick(run) { if (run.targetsTotal && run.targetsDown >= run.targetsTotal) G().end('goal'); },
      grade(run) { if (run.reason !== 'goal') return 'C'; return gradeBy(run.t, run.par * 0.6, run.par, run.par * 1.6, true); },
      bestKey: (run) => `targets:${run.page.id}`, bestVal: (run) => run.reason === 'goal' ? Math.round(run.t * 10) / 10 : null, higher: false, fmt: (v) => WTP.fmtTime(v),
      rows(run) { return [['Targets', `${run.targetsDown}/${run.targetsTotal}`], ['Time', WTP.fmtTime(run.t)]]; }
    },
    puzzle: {
      name: 'Ammo Puzzles', icon: 'puzzle', col: 'P', music: 'zen',
      desc: 'Every marked word must go, but your ammo is counted. Line up the perfect shots.',
      hud: { targets: true, ammo: true, time: true },
      setup(run) {
        const pz = run.params.puzzle;
        const total = Wd().setTargetsFromWords(Wd().words.filter((w) => pz.match.test(w.text)));
        run.targetsTotal = total; run.targetsDown = 0;
        WTP.weapons.setAmmo(pz.ammo);
        run.ammoStart = Object.values(pz.ammo).reduce((a, b) => a + b, 0);
        G().label(pz.hint, 3200);
      },
      tick(run, dt) {
        if (run.targetsTotal && run.targetsDown >= run.targetsTotal) { G().end('goal'); return; }
        const ammo = WTP.weapons.ammo();
        const left = ammo ? Object.values(ammo).reduce((a, b) => a + Math.max(0, b), 0) : 1;
        const busy = WTP.weapons.shots.length > 0 || Wd().chunks.length > 0 || Wd().burning.length > 0;
        if (left <= 0 && !busy) { run.outT = (run.outT || 0) + dt; if (run.outT > 2.5) G().end('ammo'); } else run.outT = 0;
      },
      grade(run) {
        if (run.reason !== 'goal') return 'C';
        const ammo = WTP.weapons.ammo() || {};
        const left = Object.values(ammo).reduce((a, b) => a + Math.max(0, b), 0);
        const frac = left / Math.max(1, run.ammoStart);
        return frac >= 0.4 ? 'S' : frac >= 0.2 ? 'A' : 'B';
      },
      bestKey: (run) => `puzzle:${run.params.puzzle.id}`, bestVal: (run) => run.reason === 'goal' ? { S: 3, A: 2, B: 1, C: 0 }[run.grade] : null, higher: true, fmt: (v) => '★'.repeat(v),
      rows(run) { const a = WTP.weapons.ammo() || {}; return [['Targets', `${run.targetsDown}/${run.targetsTotal}`], ['Ammo left', Object.values(a).reduce((x, y) => x + Math.max(0, y), 0)]]; }
    },
    zen: {
      name: 'Zen', icon: 'zen', col: 'l', music: 'zen',
      desc: 'Every weapon, infinite everything, no clock, no HUD. Just you, a page, and the quiet sound of it falling apart.',
      hud: { minimal: true },
      setup() { G().label('BREATHE IN. BREATHE OUT. WRECK.', 2600); },
      tick() { },
      grade() { return 'S'; },
      rows(run) { return [['Destroyed', `${pct().toFixed(1)}%`], ['Time relaxing', WTP.fmtClock(run.t)]]; }
    },
    daily: {
      name: 'Daily Challenge', icon: 'calendar', col: 't', music: 'wreck2',
      desc: 'Same page, same weapons, same goal for everyone today. One new challenge every day.',
      hud: { pct: true, time: true, score: true },
      setup(run) {
        const d = run.params.daily;
        run.sub = MODES[d.kind];
        run.params = { ...run.params, ...d.params };
        run.sub.setup(run);
        run.hud = run.sub.hud;
      },
      tick(run, dt) { run.sub.tick(run, dt); },
      grade(run) { return run.sub.grade(run); },
      bestKey: (run) => `daily:${run.params.daily.date}`, bestVal: (run) => Math.round(run.score + (run.reason === 'goal' ? 5000 : 0) - (run.sub === MODES.speed || run.sub === MODES.targets ? run.t * 20 : 0)), higher: true,
      rows(run) { return run.sub.rows(run); }
    }
  };
  function startWave(run) {
    run.wave++;
    run.waveClear = false;
    run.waveT = 3;
    const w = run.wave;
    const q = [];
    const boss = run.params?.boss && (run.maxWave ? w === run.maxWave : w % 5 === 0);
    if (boss) { q.push('modal'); for (let k = 0; k < 2; k++) q.push('cursor'); }
    else {
      const n = 2 + Math.floor(w * 1.4);
      for (let k = 0; k < n; k++) {
        const r = Math.random();
        q.push(w < 2 ? (r < 0.6 ? 'ad' : 'cursor') : w < 4 ? (r < 0.4 ? 'ad' : r < 0.7 ? 'cursor' : 'captcha') : (r < 0.3 ? 'ad' : r < 0.55 ? 'cursor' : r < 0.8 ? 'captcha' : 'cookie'));
      }
      if (w % 3 === 0) q.push('cookie');
    }
    run.spawnQ = q; run.spawnT = 0.5;
    G().announce(boss ? 'BOSS: THE NEWSLETTER' : `WAVE ${w}`, boss ? 4 : 2);
    WTP.audio.play('alarm');
    if (boss) WTP.audio.music('boss');
    else if (WTP.audio.song !== 'survival') WTP.audio.music('survival');
  }

  const PUZZLES = [
    { id: 'p1', page: 'news', name: 'The Stairs Trilogy', match: /^(up)?stairs$/i, ammo: { grenade: 3, rocket: 1, pistol: 8 }, hint: 'DESTROY EVERY "STAIRS". 3 GRENADES, 1 ROCKET, 8 BULLETS.' },
    { id: 'p2', page: 'wiki', name: 'Stick to the Facts', match: /^stick$/i, ammo: { crossbow: 4, grenade: 2, smg: 20 }, hint: 'EVERY "STICK" MUST GO. CROSSBOW BOLTS PIERCE WHOLE LINES.' },
    { id: 'p3', page: 'blog', name: 'Goodbye, Gerald', match: /^gerald('s)?$/i, ammo: { cluster: 2, pistol: 10 }, hint: 'DELETE GERALD. 2 CLUSTER BOMBS AND A PISTOL.' },
    { id: 'p4', page: 'recipe', name: 'Hold the Cheese', match: /^(cheese|lasagna)$/i, ammo: { lava: 5, grenade: 3 }, hint: 'NO MORE CHEESE. NO MORE LASAGNA. LAVA DRIPS DOWN.' },
    { id: 'p5', page: 'gov', name: 'Formless', match: /^forms?$/i, ammo: { sticky: 5, plasma: 4 }, hint: 'THE WORD "FORM" IS NOW FORBIDDEN. STICKIES CAN STACK.' },
    { id: 'p6', page: 'tos', name: 'I Do Not Agree', match: /^(terms|agree|agreed)$/i, ammo: { railgun: 2, sniper: 3, grenade: 2 }, hint: 'TWO RAILGUN SHOTS PIERCE THE WHOLE PAGE. LINE THEM UP.' },
    { id: 'p7', page: 'forum', name: 'Off Topic', match: /^(posted|today)$/i, ammo: { katana: 16, grenade: 2 }, hint: 'SLICE EVERY "POSTED" AND "TODAY". 16 SWINGS.' },
    { id: 'p8', page: 'inbox', name: 'Unsubscribe', match: /^(urgent|password|blorp)$/i, ammo: { homing: 2, pistol: 8 }, hint: 'HOMING MISSILES SEEK YOUR AIM POINT.' },
    { id: 'p9', page: 'shop', name: 'Cart Abandonment', match: /^(cart|sock|everything)$/i, ammo: { shotgun: 4, banana: 1 }, hint: 'EMPTY THE CART. ONE BANANA. USE IT WISELY.' },
    { id: 'p10', page: 'tos', name: 'Fine Print', match: /^(account|content|service)$/i, ammo: { tesla: 12, firework: 2 }, hint: 'TESLA ARCS JUMP BETWEEN LETTERS.' }
  ];

  const CAMPAIGN = [
    { id: 'c1', name: 'Hello, World', page: 'lost', mode: 'free', params: { goal: 50, autoEnd: true }, weapons: ['pistol', 'smg'], story: 'Your first page is already missing. Help it go missing harder. Wreck half of it.', stars: { metric: 'time', t: [30, 55, 90] } },
    { id: 'c2', name: 'Breaking News', page: 'news', mode: 'speed', params: { goal: 70 }, weapons: ['pistol', 'smg', 'shotgun', 'grenade'], story: 'A man found stairs. The press found out. Bury the story: 70%, fast.', stars: { metric: 'time', t: [50, 80, 140] } },
    { id: 'c3', name: 'Citation Needed', page: 'wiki', mode: 'targets', params: { count: 8, seed: 31 }, weapons: ['smg', 'shotgun', 'revolver', 'crossbow'], story: 'Eight facts on this page are unsourced. Remove them with prejudice.', stars: { metric: 'time', t: [45, 75, 140] } },
    { id: 'c4', name: 'Doorbuster Sale', page: 'shop', mode: 'time', params: { limit: 45 }, weapons: ['shotgun', 'rocket', 'grenade', 'minigun'], story: 'Everything must go. Everything. You have 45 seconds.', stars: { metric: 'pct', t: [60, 45, 30] } },
    { id: 'c5', name: 'Comment Section', page: 'blog', mode: 'survival', params: { waves: 4 }, weapons: ['smg', 'shotgun', 'grenade', 'rifle'], story: 'The comments have become sentient. Survive four waves of them.', stars: { metric: 'hp', t: [5, 3, 1] } },
    { id: 'c6', name: 'Skip to Recipe', page: 'recipe', mode: 'targets', params: { selector: '.r-body > p' }, weapons: ['flame', 'grenade', 'laser'], story: 'Nine paragraphs of life story stand between you and lasagna. Burn through them.', stars: { metric: 'time', t: [40, 70, 130] } },
    { id: 'c7', name: 'Forecast: Chaos', page: 'weather', mode: 'free', params: { goal: 75, autoEnd: true }, weapons: ['freeze', 'flame', 'tesla', 'lava'], story: 'Today: 100% chance of you. Freeze it, burn it, zap it. 75%.', stars: { metric: 'time', t: [45, 75, 130] } },
    { id: 'c8', name: 'Inbox Zero', page: 'inbox', mode: 'targets', params: { selector: '.i-m' }, weapons: ['katana', 'chainsaw', 'eraser'], story: 'Every unread email is a weight on the soul. Delete them all, by hand.', stars: { metric: 'time', t: [40, 70, 120] } },
    { id: 'c9', name: 'Under Construction', page: 'retro', mode: 'speed', params: { goal: 80 }, weapons: ['tesla', 'laser', 'ballgun', 'firework'], story: 'Dave\'s page has been under construction since 1998. Finish the job.', stars: { metric: 'time', t: [45, 75, 130] } },
    { id: 'c10', name: 'The Vault Job', page: 'bank', mode: 'targets', params: { selector: '.bk-field, .bk-btn, .bk-tip' }, weapons: ['sticky', 'drill', 'mine', 'gravity'], story: 'Crack the login, rob the tips. Stickies stack, the drill digs.', stars: { metric: 'time', t: [40, 70, 120] } },
    { id: 'c11', name: 'Form 27-B', page: 'gov', mode: 'survival', params: { waves: 6 }, weapons: ['rifle', 'plasma', 'homing', 'sticky', 'katana'], story: 'Bureaucracy fights back. Six waves of paperwork with teeth.', stars: { metric: 'hp', t: [5, 3, 1] } },
    { id: 'c12', name: 'Going Viral', page: 'feed', mode: 'time', params: { limit: 60 }, weapons: ['blackhole', 'tornado', 'bees', 'meteor', 'rocket'], story: 'Disasters only. Make the feed trend for the wrong reasons.', stars: { metric: 'pct', t: [75, 55, 35] } },
    { id: 'c13', name: 'Hub Takedown', page: 'curio', mode: 'survival', params: { waves: 3, boss: true }, weapons: 'all', story: 'The final page. The hub itself. Something big is waiting to ask if you want to subscribe.', stars: { metric: 'hp', t: [5, 3, 1] } }
  ];
  function campaignStars(lv, run) {
    if (!run.won) return 0;
    const s = lv.stars;
    let v;
    if (s.metric === 'time') v = run.t;
    else if (s.metric === 'pct') v = pct();
    else v = PL().hp;
    const lower = s.metric === 'time';
    if (lower) return v <= s.t[0] ? 3 : v <= s.t[1] ? 2 : 1;
    return v >= s.t[0] ? 3 : v >= s.t[1] ? 2 : 1;
  }
  const campaignUnlocked = (i) => i === 0 || (WTP.save.campaign[CAMPAIGN[i - 1].id] || 0) > 0;
  const totalStars = () => CAMPAIGN.reduce((a, l) => a + (WTP.save.campaign[l.id] || 0), 0) + PUZZLES.reduce((a, p) => a + (WTP.save.bests[`puzzle:${p.id}`] || 0), 0);

  function daily(dateKey = WTP.todayKey()) {
    const r = WTP.rng(WTP.strSeed(`wtp-daily-${dateKey}`));
    const pages = WTP.pages.filter((p) => !p.hidden).map((p) => p.id);
    const page = r.pick(pages);
    const pool = WTP.weapons.DEFS.filter((d) => d.id !== 'nuke').map((d) => d.id);
    const weapons = r.shuffle(pool).slice(0, 3);
    const kinds = [
      { kind: 'speed', params: { goal: 60 + r.int(0, 3) * 5 }, label: (p) => `Wreck ${p.goal}% as fast as you can` },
      { kind: 'time', params: { limit: [30, 45, 60][r.int(0, 2)] }, label: (p) => `Score as much as you can in ${p.limit}s` },
      { kind: 'targets', params: { count: 6 + r.int(0, 4), seed: r.int(1, 99999) }, label: (p) => `Destroy ${p.count} marked words` }
    ];
    const k = r.pick(kinds);
    return { date: dateKey, page, weapons, kind: k.kind, params: k.params, goal: k.label(k.params) };
  }

  WTP.modes = { MODES, PUZZLES, CAMPAIGN, campaignStars, campaignUnlocked, totalStars, daily, pct, startWave };
})();
