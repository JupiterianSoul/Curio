(() => {
  const C = window.Curio, $ = (id) => document.getElementById(id);
  const stage = $('stage');

  const KINDS = {
    digits: { label: 'Digits', chars: '0123456789', first: '123456789', pad: true },
    letters: { label: 'Letters', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
    mixed: { label: 'Mixed', chars: '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ' },
    binary: { label: 'Binary', chars: '01', pad: true }
  };
  const SHOWS = { all: 'All at once', one: 'One by one' };
  const DIRS = { fwd: 'Forwards', back: 'Backwards' };

  const settings = FX.load('settings', 1, { kind: 'digits', show: 'all', dir: 'fwd', lives: 1, start: 1, daily: false });
  if (!KINDS[settings.kind]) settings.kind = 'digits';
  if (!SHOWS[settings.show]) settings.show = 'all';
  if (!DIRS[settings.dir]) settings.dir = 'fwd';
  if (![1, 3].includes(settings.lives)) settings.lives = 1;
  if (![1, 4, 7].includes(settings.start)) settings.start = 1;
  const saveSettings = () => FX.save('settings', 1, settings);
  const stats = FX.load('stats', 1, { games: 0, best: {}, reached: [], recent: [], daily: {}, chars: 0 });
  const saveStats = () => FX.save('stats', 1, stats);

  const BADGES = FX.badges([
    { id: 'first', emoji: '🔢', tier: 'bronze', name: 'First flip', desc: 'Finish a game' },
    { id: 'd7', emoji: '🧑', tier: 'bronze', name: 'Magical seven', desc: 'Recall 7 digits' },
    { id: 'd10', emoji: '📞', tier: 'silver', name: 'Phone book', desc: 'Recall 10 digits' },
    { id: 'd12', emoji: '💳', tier: 'silver', name: 'Card number', desc: 'Recall 12 digits' },
    { id: 'd15', emoji: '🧠', tier: 'gold', name: 'Memory athlete', desc: 'Recall 15 digits' },
    { id: 'd20', emoji: '🥇', tier: 'diamond', name: 'Human hard drive', desc: 'Recall 20 digits', secret: true },
    { id: 'letters', emoji: '🔤', tier: 'silver', name: 'Wordless wonder', desc: 'Recall 8 letters' },
    { id: 'mixed', emoji: '🔣', tier: 'gold', name: 'Password brain', desc: 'Recall 8 mixed characters' },
    { id: 'binary', emoji: '💻', tier: 'gold', name: 'Bit keeper', desc: 'Recall 16 binary digits' },
    { id: 'back', emoji: '🔁', tier: 'silver', name: 'Backwards genius', desc: 'Recall 7 backwards' },
    { id: 'one', emoji: '🎞️', tier: 'silver', name: 'Frame by frame', desc: 'Recall 9 shown one by one' },
    { id: 'quick', emoji: '⚡', tier: 'gold', name: 'Quick fingers', desc: 'Answer 8+ correctly within 3 seconds' },
    { id: 'daily', emoji: '📅', tier: 'bronze', name: 'Daily digits', desc: 'Play the daily board' },
    { id: 'games', emoji: '🗓️', tier: 'silver', name: 'Frequent flyer', desc: 'Play 25 games' }
  ]);

  let cfg = {}, len = 1, target = '', lives = 0, raf = 0, timers = [], rand = Math.random, state = 'idle', askAt = 0, lifeLost = 0;

  const key = () => (cfg.daily ? 'daily' : `${cfg.kind}:${cfg.show}:${cfg.dir}`);
  const bestFor = (k) => stats.best[k] ?? null;
  const paintBest = () => { const b = bestFor(key()); $('best').textContent = b == null ? '-' : b; };
  function paintLives() { $('lives').innerHTML = cfg.lives > 1 ? Array.from({ length: cfg.lives }, (_, i) => `<span class="${i >= lives ? 'is-lost' : ''}">❤️</span>`).join('') : ''; }
  function clear() { cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers = []; }
  const view = (html) => { stage.innerHTML = `<div class="nm-inner">${html}</div>`; return stage; };
  const sizeCls = (n) => (n > 22 ? 'tiny' : n > 12 ? 'small' : '');
  const groupGap = (i) => (cfg.kind === 'binary' ? i > 0 && i % 4 === 0 : false);
  function flapsHtml(str, cls = () => '', n = str.length) {
    return `<div class="nm-flaps ${sizeCls(n)}">${Array.from({ length: n }, (_, i) => `<div class="nm-flap ${groupGap(i) ? 'gap ' : ''}${cls(i)}">${str[i] ?? ''}</div>`).join('')}</div>`;
  }

  function readCfg() {
    cfg = { ...settings };
    if (settings.daily) Object.assign(cfg, { kind: 'digits', show: 'all', dir: 'fwd', lives: 3, start: 3, daily: true });
  }

  function intro() {
    clear(); state = 'idle'; readCfg();
    $('opts').classList.remove('is-locked');
    len = cfg.start; $('level').textContent = len; lives = cfg.lives; paintLives(); paintBest();
    const today = stats.daily[FX.dayKey()];
    view(`<p class="nm-label">Now boarding</p>
      ${flapsHtml(cfg.daily ? 'DAILY' : cfg.kind === 'letters' ? 'ABC' : cfg.kind === 'mixed' ? 'A1B2' : cfg.kind === 'binary' ? '1011' : '7?')}
      <h2>How much can you hold?</h2>
      <div class="nm-steps"><span>1. Look</span><span>2. Remember</span><span>3. ${cfg.dir === 'back' ? 'Type it backwards' : 'Type it back'}</span></div>
      ${cfg.daily ? `<p>Daily board #${FX.dayNumber()}: digits, 3 lives, starts at 3. Everyone gets the same numbers today.${today != null ? ` Your best today: ${today}.` : ''}</p>` : ''}
      <div class="c-row"><button class="c-btn" id="go" type="button">Start</button><button class="c-btn c-btn--ghost" id="daily" type="button">${cfg.daily ? 'Back to practice' : 'Daily board'}</button></div>`);
    $('go').addEventListener('click', begin);
    $('daily').addEventListener('click', () => { settings.daily = !settings.daily; saveSettings(); FX.sfx.click(); intro(); });
    $('go').focus({ preventScroll: true });
  }

  function begin() {
    readCfg();
    rand = cfg.daily ? FX.rng(FX.daySeed('n')) : Math.random;
    len = cfg.start; lives = cfg.lives; lifeLost = 0; paintLives();
    $('opts').classList.add('is-locked');
    FX.sfx.whoosh();
    round();
  }

  function makeTarget(n) {
    const k = KINDS[cfg.kind];
    let s = '';
    for (let i = 0; i < n; i++) {
      const pool = i === 0 && k.first ? k.first : k.chars;
      let c = pool[Math.floor(rand() * pool.length)];
      if (cfg.kind !== 'binary' && n > 2 && i >= 2 && c === s[i - 1] && c === s[i - 2]) c = pool[Math.floor(rand() * pool.length)];
      s += c;
    }
    return s;
  }
  function durationFor(n) {
    if (cfg.kind === 'binary') return 1000 + n * 380;
    const base = 1200 + n * 650;
    return cfg.kind === 'mixed' ? base * 1.15 : base;
  }

  function roll(el, final, delay) {
    return new Promise((res) => {
      const pool = KINDS[cfg.kind].chars;
      let n = 3 + Math.floor(Math.random() * 4);
      timers.push(setTimeout(function step() {
        el.classList.remove('flip'); void el.offsetWidth; el.classList.add('flip');
        if (n-- > 0) { el.textContent = pool[Math.floor(Math.random() * pool.length)]; timers.push(setTimeout(step, 40)); }
        else { el.textContent = final; FX.sfx.noise(0.015, { freq: 3500, vol: 0.12, q: 3 }); res(); }
      }, delay));
    });
  }

  async function round() {
    clear(); state = 'show';
    target = makeTarget(len);
    $('level').textContent = len; FX.bump($('level'));
    if (cfg.show === 'one') return showOne();
    view(`<p class="nm-label">Remember this</p><div id="fl">${flapsHtml(' '.repeat(len))}</div><div class="nm-fuse"><i id="fuse"></i><b id="spark" style="left:100%"></b></div><div class="nm-count" id="cnt"></div>`);
    const flaps = [...stage.querySelectorAll('.nm-flap')];
    await Promise.all(flaps.map((f, i) => roll(f, target[i], i * Math.max(12, 60 - len * 2))));
    if (state !== 'show') return;
    const total = durationFor(len);
    let remaining = total, last = performance.now();
    const fuse = $('fuse'), spark = $('spark'), cnt = $('cnt');
    const tick = (now) => {
      if (state !== 'show') return;
      if (!document.hidden) remaining -= Math.min(100, now - last);
      last = now;
      const p = Math.max(0, remaining / total);
      fuse.style.transform = `scaleX(${p})`; spark.style.left = (p * 100) + '%';
      cnt.textContent = (Math.max(0, remaining) / 1000).toFixed(1) + 's';
      if (remaining <= 0) return ask();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  function showOne() {
    view(`<p class="nm-label">One at a time</p><div id="fl">${flapsHtml('', () => 'blank', len)}</div><div class="nm-count" id="cnt">1 / ${len}</div>`);
    const flaps = [...stage.querySelectorAll('.nm-flap')];
    const per = Math.max(450, 950 - len * 25);
    target.split('').forEach((ch, i) => {
      timers.push(setTimeout(() => {
        if (state !== 'show') return;
        flaps.forEach((f) => { f.textContent = ''; f.classList.remove('cur'); });
        flaps[i].classList.remove('blank'); flaps[i].classList.add('cur'); flaps[i].textContent = ch;
        flaps[i].classList.remove('flip'); void flaps[i].offsetWidth; flaps[i].classList.add('flip');
        $('cnt').textContent = `${i + 1} / ${len}`;
        FX.sfx.tone(520 + i * 20, 0.06, { type: 'triangle', vol: 0.07 });
      }, 400 + i * per));
    });
    timers.push(setTimeout(() => { if (state === 'show') ask(); }, 400 + len * per));
  }

  function ask() {
    clear(); state = 'ask'; askAt = performance.now();
    FX.sfx.tone(780, 0.08, { type: 'triangle', vol: 0.08 });
    const k = KINDS[cfg.kind];
    const coarse = matchMedia('(pointer: coarse)').matches;
    const keys = cfg.kind === 'binary' ? ['0', '1', '⌫'] : ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'];
    view(`<form class="nm-form" id="form" autocomplete="off">
      <p class="nm-label">${cfg.dir === 'back' ? 'Type it backwards' : 'What was it?'}</p>
      <input class="nm-input" id="ans" ${k.pad ? (coarse ? 'inputmode="none"' : 'inputmode="numeric"') : 'inputmode="text" autocapitalize="characters"'} spellcheck="false" aria-label="Your answer" autocomplete="off" maxlength="80">
      ${k.pad ? `<div class="nm-pad${cfg.kind === 'binary' ? ' bin' : ''}">${keys.map((x) => `<button type="button" data-k="${x}" class="${x === '✓' ? 'ok' : ''}" aria-label="${x === '⌫' ? 'Delete' : x === '✓' ? 'Submit' : x}">${x}</button>`).join('')}</div>` : ''}
      <button class="c-btn" type="submit">Submit</button>
    </form>`);
    const inp = $('ans');
    const allowed = new RegExp(`[^${cfg.kind === 'binary' ? '01' : cfg.kind === 'digits' ? '0-9' : cfg.kind === 'letters' ? 'A-Z' : '0-9A-Z'}]`, 'g');
    inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().replace(allowed, ''); FX.sfx.tick(); });
    stage.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
      const x = b.dataset.k;
      FX.sfx.click(); FX.buzz(6);
      if (x === '⌫') inp.value = inp.value.slice(0, -1);
      else if (x === '✓') return check(inp.value);
      else inp.value += x;
    }));
    inp.focus({ preventScroll: true });
    $('form').addEventListener('submit', (e) => { e.preventDefault(); check(inp.value.trim().toUpperCase()); });
  }

  function check(ans) {
    if (state !== 'ask') return;
    const want = cfg.dir === 'back' ? target.split('').reverse().join('') : target;
    const secs = (performance.now() - askAt) / 1000;
    stats.chars += len; saveStats();
    if (ans === want) {
      state = 'between';
      FX.sfx.good(); FX.buzz(15);
      FX.burstAt(stage, { count: 24, colors: ['#ffc233', '#7ef0a4', '#ffffff'] });
      milestone(len);
      if (len >= 8 && secs <= 3) BADGES.unlock('quick');
      if (len === 7 && cfg.kind === 'digits' && cfg.dir === 'fwd') C.toast('You just matched the average human span 🧠');
      view(`<p class="nm-label">Correct</p>${flapsHtml(want, () => 'ok')}<p class="nm-ok">✓ Next: ${len + 1} characters</p>
        <button class="c-btn" id="next" type="button">Next</button>`);
      const b = $('next'); b.focus({ preventScroll: true });
      b.addEventListener('click', () => { len++; round(); });
      return;
    }
    FX.sfx.bad(); FX.buzz([50, 40, 80]); FX.shake(stage, 8);
    lives--; lifeLost++; paintLives();
    if (lives > 0) {
      state = 'between';
      view(`<p class="nm-label">Not quite</p>${compareHtml(ans, want)}<p>${lives} ${lives === 1 ? 'life' : 'lives'} left. Same length again, new characters.</p>
        <button class="c-btn" id="next" type="button">Try again</button>`);
      const b = $('next'); b.focus({ preventScroll: true });
      b.addEventListener('click', round);
      return;
    }
    gameOver(ans, want);
  }

  function compareHtml(ans, want) {
    const n = Math.max(ans.length, want.length);
    return `<div class="nm-cmp"><p class="nm-label" style="margin:0 auto">Answer</p>${flapsHtml(want, (i) => (ans[i] === want[i] ? 'ok' : 'miss'), want.length)}
      <p class="nm-label" style="margin:6px auto 0">You typed</p>${flapsHtml(ans.padEnd(n, ' '), (i) => (ans[i] == null ? 'blank' : ans[i] === want[i] ? 'ok' : 'no'), Math.max(1, n))}</div>`;
  }

  function milestone(n) {
    const k = cfg.kind;
    if (k === 'digits') { if (n >= 7) BADGES.unlock('d7'); if (n >= 10) BADGES.unlock('d10'); if (n >= 12) BADGES.unlock('d12'); if (n >= 15) BADGES.unlock('d15'); if (n >= 20) BADGES.unlock('d20'); }
    if (k === 'letters' && n >= 8) BADGES.unlock('letters');
    if (k === 'mixed' && n >= 8) BADGES.unlock('mixed');
    if (k === 'binary' && n >= 16) BADGES.unlock('binary');
    if (cfg.dir === 'back' && n >= 7) BADGES.unlock('back');
    if (cfg.show === 'one' && n >= 9) BADGES.unlock('one');
  }

  function scaleSvg(s) {
    const max = Math.max(16, s + 2), W = 400, x = (v) => 20 + (v / max) * (W - 40);
    return `<svg class="nm-scale" viewBox="0 0 ${W} 64" role="img" aria-label="You reached ${s}; the typical digit span is about 7">
      <rect x="20" y="28" width="${W - 40}" height="10" rx="5" fill="rgba(255,255,255,.12)"/>
      <rect x="20" y="28" width="${(x(s) - 20).toFixed(1)}" height="10" rx="5" fill="#ffc233"><animate attributeName="width" from="0" to="${(x(s) - 20).toFixed(1)}" dur=".9s" fill="freeze"/></rect>
      <line x1="${x(7)}" x2="${x(7)}" y1="20" y2="46" stroke="#fff" stroke-dasharray="3 2" stroke-width="2"/><text x="${x(7)}" y="14" text-anchor="middle">Typical span ~7</text>
      <circle cx="${x(s)}" cy="33" r="8" fill="#fff" stroke="#ff5a36" stroke-width="4"/><text x="${x(s)}" y="60" text-anchor="middle">You: ${s}</text></svg>`;
  }

  function gameOver(ans, want) {
    state = 'over';
    const reached = len - 1;
    const k = key(), prev = bestFor(k);
    const isNew = reached > 0 && prev != null && reached > prev;
    if (prev == null || reached > prev) stats.best[k] = reached;
    if (cfg.kind === 'digits' && cfg.show === 'all' && cfg.dir === 'fwd' && !cfg.daily) C.best('digits', reached);
    stats.games++;
    stats.reached.push(reached); if (stats.reached.length > 300) stats.reached.shift();
    stats.recent.unshift({ k, v: reached, d: Date.now() }); stats.recent.length = Math.min(12, stats.recent.length);
    if (cfg.daily) { const dk = FX.dayKey(); stats.daily[dk] = Math.max(stats.daily[dk] || 0, reached); BADGES.unlock('daily'); }
    saveStats();
    BADGES.unlock('first');
    if (stats.games >= 25) BADGES.unlock('games');
    paintBest(); tabsApi.refresh();
    $('opts').classList.remove('is-locked');
    if (isNew) { C.confetti(); FX.sfx.fanfare(); } else FX.sfx.lose();
    const unit = cfg.kind === 'digits' ? 'digit' : cfg.kind === 'binary' ? 'bit' : cfg.kind === 'letters' ? 'letter' : 'character';
    const quip = reached >= 15 ? 'That is freakishly good. Memory athlete material.' : reached >= 11 ? 'Way above average!' : reached >= 8 ? 'Above the magical seven!' : reached >= 6 ? 'Right around the human average.' : reached >= 4 ? 'Phone-number-ish. Not bad.' : 'Your short-term memory went for a walk.';
    view(`${isNew ? '<div class="nm-tag">New personal best!</div>' : ''}
      <div class="nm-big">${reached >= 12 ? '🧠' : reached >= 7 ? '✈️' : '🧳'}</div>
      <h2 id="fin">${reached} ${unit}${reached === 1 ? '' : 's'}</h2>
      <p>${quip}</p>
      ${scaleSvg(reached)}
      ${compareHtml(ans, want)}
      <div class="nm-res"><div><b>${bestFor(k) ?? reached}</b><span>Best</span></div><div><b>${KINDS[cfg.kind].label}</b><span>${SHOWS[cfg.show]}</span></div><div><b>${cfg.dir === 'back' ? 'Back' : 'Fwd'}</b><span>Direction</span></div></div>
      <div class="c-row"><button class="c-btn" id="again" type="button">Play again</button><button class="c-btn c-btn--ghost" id="share" type="button">Share</button><button class="c-btn c-btn--ghost" id="menu" type="button">Options</button></div>`);
    $('again').addEventListener('click', begin);
    $('menu').addEventListener('click', intro);
    $('share').addEventListener('click', () => {
      const head = cfg.daily ? `Number Memory daily #${FX.dayNumber()}` : `Number Memory (${KINDS[cfg.kind].label}, ${SHOWS[cfg.show].toLowerCase()}, ${DIRS[cfg.dir].toLowerCase()})`;
      FX.copy(`${head} 🔢\nI held ${reached} ${unit}${reached === 1 ? '' : 's'}\n${'🟨'.repeat(Math.min(reached, 24))}`);
    });
    $('again').focus({ preventScroll: true });
  }

  FX.seg($('oKind'), Object.entries(KINDS).map(([v, k]) => ({ v, label: k.label })), settings.kind, (v) => { settings.kind = v; settings.daily = false; saveSettings(); intro(); }, 'Characters');
  FX.seg($('oShow'), Object.entries(SHOWS).map(([v, l]) => ({ v, label: l })), settings.show, (v) => { settings.show = v; settings.daily = false; saveSettings(); intro(); }, 'Presentation');
  FX.seg($('oDir'), Object.entries(DIRS).map(([v, l]) => ({ v, label: l })), settings.dir, (v) => { settings.dir = v; settings.daily = false; saveSettings(); intro(); }, 'Recall direction');
  FX.seg($('oLives'), [{ v: '1', label: '1' }, { v: '3', label: '3' }], settings.lives, (v) => { settings.lives = +v; saveSettings(); intro(); }, 'Lives');
  FX.seg($('oStart'), [{ v: '1', label: '1' }, { v: '4', label: '4' }, { v: '7', label: '7' }], settings.start, (v) => { settings.start = +v; saveSettings(); intro(); }, 'Starting length');

  FX.onKey((e) => {
    if (e.key === 'Escape' && state !== 'idle') { e.preventDefault(); intro(); }
  });
  document.addEventListener('keydown', (e) => {
    if (state !== 'ask' || e.target.id === 'ans') return;
    const inp = $('ans'); if (!inp) return;
    if (/^[0-9a-zA-Z]$/.test(e.key) || e.key === 'Backspace') inp.focus();
  });

  const tabsApi = FX.tabs($('tabs'), [
    { id: 'how', label: 'How to play', render(p) {
      p.innerHTML = `<ul class="fx-howto">
        <li><i>👀</i><div><b>Look</b><p>A sequence rolls onto the board. A fuse burns down while you memorise it.</p></div></li>
        <li><i>⌨️</i><div><b>Type it back</b><p>When it flips away, type what you saw, or the reverse in Backwards mode. Every correct answer adds one character.</p></div></li>
        <li><i>🧩</i><div><b>Chunk it</b><p>Group characters into bundles, like 415 862 9. In 1956 psychologist George Miller described short-term memory as "seven, plus or minus two" items, and later work by Nelson Cowan suggests closer to four chunks, so chunking is your best friend.</p></div></li>
        <li><i>🔁</i><div><b>Backwards is harder</b><p>Most people can repeat fewer items backwards than forwards. That is why clinicians test both.</p></div></li>
        <li><i>💻</i><div><b>Binary</b><p>Memory athletes have a whole competition event for binary digits. They usually convert groups of three bits into a single number to cheat their way past the limit.</p></div></li>
      </ul><div class="fx-keys"><span><span class="c-kbd">Enter</span> submit</span><span><span class="c-kbd">Esc</span> back to options</span></div>`;
    } },
    { id: 'stats', label: 'Stats', render(p) {
      const r = stats.reached, avg = r.length ? (r.reduce((a, b) => a + b, 0) / r.length).toFixed(1) : '-';
      const top = Math.max(0, ...Object.values(stats.best));
      const b = []; for (let v = 0; v <= 16; v += 2) b.push({ label: v === 16 ? '16+' : `${v}`, n: r.filter((x) => (v === 16 ? x >= 16 : x >= v && x < v + 2)).length });
      const last = r[r.length - 1]; b.forEach((x, i) => { x.hi = last != null && (i === 8 ? last >= 16 : last >= i * 2 && last < i * 2 + 2); });
      const rows = Object.entries(stats.best).sort((x, y) => y[1] - x[1]);
      const label = (k) => { if (k === 'daily') return 'Daily board'; const [a, s, d] = k.split(':'); return `${KINDS[a]?.label || a} · ${SHOWS[s] || s} · ${DIRS[d] || d}`; };
      p.innerHTML = `${FX.statGrid([[stats.games, 'Games'], [top || '-', 'Longest'], [avg, 'Average'], [stats.chars, 'Chars seen']])}
        <h4>How far you get</h4>${r.length ? FX.histogram(b, { label: 'Lengths reached' }) : '<p class="c-muted">Play a game to fill this in.</p>'}
        <h4>Bests by setup</h4><div class="fx-hist-list">${rows.length ? rows.map(([k, v]) => `<div><span>${label(k)}</span><b>${v}</b></div>`).join('') : '<p class="c-muted">Nothing yet.</p>'}</div>`;
    } },
    { id: 'badges', label: 'Badges', render(p) { BADGES.render(p); } }
  ]);

  document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'show' && cfg.show === 'one') { clear(); round(); } });

  const legacy = C.getBest('digits');
  if (legacy != null && stats.best['digits:all:fwd'] == null) { stats.best['digits:all:fwd'] = legacy; saveStats(); }
  intro();
  window.__nm = { get target() { return target; }, get state() { return state; }, get cfg() { return cfg; }, check: (a) => check(a) };
})();
