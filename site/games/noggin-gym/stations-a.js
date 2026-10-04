(() => {
  const NG = window.NG = window.NG || {};
  NG.stations = NG.stations || [];
  const add = (s) => NG.stations.push(s);
  const E = 'var(--c-edge)';
  const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const sd = (a) => { if (a.length < 2) return 0; const m = avg(a); return Math.sqrt(avg(a.map((v) => (v - m) ** 2))); };
  const kb = (k) => `<span class="c-kbd">${k}</span>`;

  const RX = {
    light: { median: 273, sigma: .24 }, audio: { median: 235, sigma: .25 }, choice: { median: 420, sigma: .22 }, choice4: { median: 520, sigma: .24 },
    stroop: { median: 560, sigma: .25 }, gonogo: { median: 340, sigma: .22 }, timing: { median: 48, sigma: .62 }
  };
  const COLS2 = [{ n: 'BLUE', c: '#2f7bf0', k: 'F' }, { n: 'ORANGE', c: '#ff8a1f', k: 'J' }];
  const COLS4 = [{ n: 'BLUE', c: '#2f7bf0', k: 'D' }, { n: 'ORANGE', c: '#ff8a1f', k: 'F' }, { n: 'GREEN', c: '#1faa59', k: 'J' }, { n: 'PINK', c: '#e0457b', k: 'K' }];
  const FACTS = ['A blink takes roughly 100 to 400 milliseconds.', 'In sprinting, reacting within 0.1 seconds of the gun counts as a false start.', 'Hearing is usually a little quicker than sight.', 'More choices make decisions slower. That is Hick\'s law.', 'The Stroop effect was first described in 1935.', 'A 60Hz screen only shows a new picture every 16.7 milliseconds.', 'Being tired slows your reactions. Sleep is a training tool.', 'Light travels about 300 kilometres in a millisecond.'];

  add({
    id: 'reaction', name: 'Starting Blocks', test: 'Reaction Time', skill: 'reflex', color: '#ff6b2c',
    blurb: 'Seven ways to test your reflexes, from traffic lights to tricky words and a dot that orbits the clock.',
    coach: 'Eyes on the light. Do not jump the gun!',
    how: 'Wait for the signal, then react as fast as you can. Jumping early resets that try.',
    quickHow: 'When the light turns green, click or tap the pad (or press Space). Five tries. Jumping early does not count.',
    keys: `${kb('Space')} react · ${kb('F')} ${kb('J')} colours · ${kb('D')} ${kb('F')} ${kb('J')} ${kb('K')} four colours`,
    art: `<svg viewBox="0 0 120 90"><path d="M8 78h104" stroke="${E}" stroke-width="3" stroke-linecap="round"/><path d="M12 77l10-24h34l14 24z" fill="#ff6b2c" stroke="${E}" stroke-width="3" stroke-linejoin="round"/><path d="M26 64h30" stroke="#ffd0b0" stroke-width="4" stroke-linecap="round"/><path d="M91 60v17" stroke="${E}" stroke-width="4"/><rect x="79" y="8" width="24" height="54" rx="10" fill="#2b2d42" stroke="${E}" stroke-width="3"/><circle cx="91" cy="21" r="6.5" fill="#ff4d4d"/><circle cx="91" cy="35" r="6.5" fill="#ffd23f" opacity=".45"/><circle cx="91" cy="49" r="6.5" fill="#3ddc84"/><circle cx="89" cy="47" r="2" fill="#fff"/></svg>`,
    modes: [
      { id: 'light', name: 'Light', unit: 'ms', lower: true, desc: 'Red, red, red... GREEN.', how: 'The pad turns red. When it flips to green, click it or press Space. Times under 100ms are guesses and do not count.' },
      { id: 'audio', name: 'Sound', unit: 'ms', lower: true, desc: 'React to a beep', how: 'Listen for the beep, then react. Most people are a little faster with their ears than their eyes. Needs sound on.' },
      { id: 'choice', name: 'Colour', unit: 'ms', lower: true, desc: 'Blue left, orange right', how: 'A colour flashes up. Blue means F or the left button, orange means J or the right button. Wrong colour counts as a miss.' },
      { id: 'choice4', name: 'Four colours', unit: 'ms', lower: true, desc: 'Four colours, four keys', how: 'Four colours mapped to D, F, J and K (or the four buttons). More choices means slower answers: Hick\'s law in action.' },
      { id: 'stroop', name: 'Tricky words', unit: 'ms', lower: true, desc: 'Answer the ink, not the word', how: 'A colour word appears printed in a colour. Answer the INK colour, not the word. Blue is F or left, orange is J or right.' },
      { id: 'gonogo', name: 'Go / No-go', unit: 'ms', lower: true, desc: 'Green go, purple freeze', how: 'React to green as fast as you can, but do nothing on purple STOP signs. Self-control counts too.' },
      { id: 'timing', name: 'Orbit', unit: 'ms off', lower: true, desc: 'Stop the dot on the line', how: 'A dot orbits a ring. Press as it crosses the line at the top. Early and late both count. This tests anticipation, not reaction.' }
    ],
    options: [{ id: 'tries', label: 'Tries', choices: [[5, '5'], [10, '10'], [20, '20']], def: 5 }],
    quick: { mode: 'light', opts: { tries: 5 } },
    fmt: (v) => Math.round(v),
    play(ctx) {
      const mode = ctx.mode, tries = ctx.quick ? 5 : ctx.opts.tries;
      const kind = mode === 'choice' || mode === 'choice4' || mode === 'stroop' ? 'choice' : mode;
      const cols = mode === 'choice4' ? COLS4 : COLS2;
      ctx.stage.innerHTML = `<div class="rx">
        <button type="button" class="rx-pad" id="rxPad"><span class="rx-ic" id="rxIc"></span><b id="rxBig">Tap to start</b><span id="rxSmall">or press Space</span></button>
        ${kind === 'choice' ? `<div class="rx-choice ${cols.length === 4 ? 'is-four' : ''}">${cols.map((c, i) => `<button type="button" class="rx-cb" data-i="${i}" style="--bc:${c.c}"><kbd>${c.k}</kbd>${c.n}</button>`).join('')}</div>` : ''}
        <div class="rx-pips" id="rxPips"></div>
        <p class="ng-fact">${FACTS[Math.floor(Math.random() * FACTS.length)]}</p>
      </div>`;
      const pad = ctx.stage.querySelector('#rxPad'), big = ctx.stage.querySelector('#rxBig'), small = ctx.stage.querySelector('#rxSmall'), ic = ctx.stage.querySelector('#rxIc'), pipsEl = ctx.stage.querySelector('#rxPips');
      let state = 'ready', times = [], trials = [], goAt = 0, target = 0, nogo = false, earlies = 0, timer = 0, orbit = null, congruent = null;
      const R = (a, b) => a + ctx.rng() * (b - a);
      const set = (cls, b, s, color) => { pad.className = 'rx-pad is-' + cls; big.textContent = b; small.textContent = s || ''; pad.style.removeProperty('--pc'); big.style.color = ''; if (color) pad.style.setProperty('--pc', color); };
      const pips = () => { pipsEl.innerHTML = Array.from({ length: tries }, (_, i) => { const t = trials.filter((x) => !x.held)[i]; return `<i class="${t ? (t.err ? 'bad' : 'ok') : ''}">${t ? (t.err ? 'x' : Math.round(t.ms)) : i + 1}</i>`; }).join(''); ctx.hud(`<b>${Math.min(tries, trials.filter((x) => !x.held).length)}</b>/${tries}`); };
      const counted = () => trials.filter((x) => !x.held).length;
      function ready() {
        if (mode === 'audio' && ctx.C.muted) { set('wait', 'Sound is off', 'Turn on sound in the top bar, then tap here'); state = 'ready'; return; }
        set('ready', counted() ? 'Tap for the next one' : 'Tap to start', 'or press Space'); state = 'ready';
      }
      function arm() {
        if (mode === 'audio' && ctx.C.muted) { ready(); return; }
        clearTimeout(timer);
        if (mode === 'timing') { startOrbit(); return; }
        state = 'wait';
        if (mode === 'light') set('wait', 'Wait for green...', 'steady');
        else if (mode === 'audio') set('listen', 'Listen...', 'react to the beep');
        else if (kind === 'choice') set('neutral', 'Get ready...', mode === 'stroop' ? 'answer the INK colour' : cols.map((c) => c.n.toLowerCase() + ' ' + c.k).join(', '));
        else set('neutral', 'Wait...', 'green: go, purple: freeze');
        timer = ctx.later(stimulus, mode === 'light' || mode === 'audio' ? R(1500, 4200) : R(900, 2600));
      }
      const markGo = () => { goAt = performance.now(); requestAnimationFrame(() => { goAt = performance.now(); }); };
      function stimulus() {
        state = 'go';
        if (mode === 'light') { set('go', 'CLICK!', ''); markGo(); }
        else if (mode === 'audio') { const a = ctx.C.audioContext && ctx.C.audioContext(); ctx.tone(1000, .16, 'square', .14, .03); goAt = performance.now() + 30 + (a ? ((a.outputLatency || a.baseLatency || 0) * 1000) : 0); }
        else if (kind === 'choice') {
          target = Math.floor(ctx.rng() * cols.length);
          if (mode === 'stroop') { congruent = ctx.rng() < .5; set('stroop', cols[congruent ? target : 1 - target].n, ''); big.style.color = cols[target].c; }
          else set('color', cols[target].n, cols.length === 2 ? (target ? 'right' : 'left') : 'key ' + cols[target].k, cols[target].c);
          markGo();
        } else {
          nogo = ctx.rng() < .3;
          if (nogo) { set('nogo', 'STOP', 'hold still'); timer = ctx.later(() => { trials.push({ held: true }); ctx.snd.good(); set('good', 'Nice restraint', 'next one coming'); state = 'pause'; timer = ctx.later(arm, 800); }, 1100); }
          else set('go', 'GO!', '');
          markGo();
        }
      }
      const PERIOD = 1500;
      function startOrbit() {
        state = 'orbit';
        set('orbit', '', 'press as the dot crosses the line');
        ic.innerHTML = `<svg viewBox="0 0 120 120" class="rx-orbit"><circle cx="60" cy="60" r="46" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="10"/><path d="M60 2v24" stroke="#fff" stroke-width="5" stroke-linecap="round"/><g id="rxDot"><circle cx="60" cy="14" r="12" fill="#ffe14d" opacity=".35"/><circle cx="60" cy="14" r="8" fill="#ffe14d"/></g></svg>`;
        const t0 = performance.now() + 150;
        orbit = { target: t0 + R(.85, 1.7) * PERIOD };
        const dot = ic.querySelector('#rxDot');
        ctx.frame(() => {
          if (state !== 'orbit' || !orbit) return false;
          const now = performance.now(), left = (orbit.target - now) / PERIOD;
          dot.setAttribute('transform', `rotate(${(-left * 360).toFixed(2)} 60 60)`);
          if (now > orbit.target + 450) { timingHit(null); return false; }
        });
      }
      function timingHit(stamp) {
        if (!orbit) return;
        const tg = orbit.target; orbit = null;
        if (stamp == null) { trials.push({ ms: 450, err: true }); ctx.snd.bad(); set('early', 'Missed it!', 'tap for the next one'); state = 'result'; pips(); if (counted() >= tries) done(); return; }
        const signed = Math.round(stamp - tg), ms = Math.abs(signed);
        times.push(ms); trials.push({ ms, signed }); pips();
        ctx.snd.good(ms < 15 ? 4 : ms < 40 ? 2 : 0); ctx.buzz(12);
        if (counted() >= tries) return done();
        state = 'result'; set('result', ms <= 3 ? 'Spot on!' : `${ms} ms ${signed < 0 ? 'early' : 'late'}`, 'tap for the next one');
      }
      function hit(stamp, side) {
        if (state === 'done') return;
        if (state === 'ready' || state === 'early' || state === 'result') return arm();
        if (state === 'orbit') return timingHit(stamp);
        if (state === 'wait') { clearTimeout(timer); state = 'early'; earlies++; set('early', 'Too soon!', 'tap to retry that one'); ctx.snd.bad(); ctx.buzz([30, 40, 30]); return; }
        if (state !== 'go') return;
        const ms = Math.round(stamp - goAt);
        if (kind === 'gonogo' && nogo) { clearTimeout(timer); trials.push({ ms, err: true, held: false }); state = 'result'; set('early', 'That was a STOP!', 'tap to continue'); ctx.snd.bad(); pips(); if (counted() >= tries) done(); return; }
        if (ms < 100) { state = 'early'; earlies++; set('early', 'Too fast to be real', 'guesses do not count, tap to retry'); ctx.snd.bad(); return; }
        if (kind === 'choice') {
          if (side == null) return;
          if (side !== target) { trials.push({ ms, err: true }); state = 'result'; set('early', 'Wrong colour!', 'tap or press a key to continue'); ctx.snd.bad(); pips(); if (counted() >= tries) done(); return; }
        }
        times.push(ms); trials.push({ ms, congruent }); pips();
        ctx.snd.good(ms < 220 ? 4 : ms < 300 ? 2 : 0); ctx.buzz(15);
        pad.classList.add('is-pop'); ctx.later(() => pad.classList.remove('is-pop'), 200);
        if (counted() >= tries) return done();
        state = 'result';
        set('result', ms + ' ms', `${ms < 200 ? 'Blazing! ' : ms < 260 ? 'Quick! ' : ''}${counted()} of ${tries}, tap to keep going`);
      }
      function done() {
        state = 'done';
        const ok = times.slice();
        if (!ok.length) { ctx.finish({ score: 0, valid: false, display: '-', unit: 'no clean tries', pct: 1, stats: [['Mistakes', trials.filter((t) => t.err).length]] }); return; }
        const a = Math.round(avg(ok)), errs = trials.filter((t) => t.err).length;
        const md = RX[mode];
        const pct = NG.u.pctL(a, md.median, md.sigma, true) - (errs ? Math.min(30, errs * 6) : 0);
        const sorted = ok.slice().sort((x, y) => x - y);
        const stats = [[mode === 'timing' ? 'Closest' : 'Fastest', sorted[0] + 'ms'], [mode === 'timing' ? 'Furthest' : 'Slowest', sorted[sorted.length - 1] + 'ms'], ['Median', sorted[Math.floor(sorted.length / 2)] + 'ms'], ['Spread', '±' + Math.round(sd(ok)) + 'ms']];
        if (kind === 'choice' || kind === 'gonogo' || mode === 'timing') stats.push(['Mistakes', errs]);
        if (earlies) stats.push(['False starts', earlies]);
        if (mode === 'stroop') { const c1 = trials.filter((t) => !t.err && t.congruent === true).map((t) => t.ms), c2 = trials.filter((t) => !t.err && t.congruent === false).map((t) => t.ms); if (c1.length && c2.length) stats.push(['Stroop effect', (avg(c2) - avg(c1) > 0 ? '+' : '') + Math.round(avg(c2) - avg(c1)) + 'ms']); }
        if (mode === 'timing') { const okT = trials.filter((t) => !t.err); const bias = Math.round(avg(okT.map((t) => t.signed))); stats.push(['Lean', bias === 0 ? 'none' : Math.abs(bias) + 'ms ' + (bias < 0 ? 'early' : 'late')]); }
        ctx.finish({ score: a, display: a, unit: mode === 'timing' ? 'ms off the line' : 'ms average', pct: Math.max(1, pct), stats, feats: mode === 'light' && a < 200 ? ['reflex200'] : [], note: `Typical for this test: about ${md.median}ms.` });
      }
      const stamp = (e) => { const n = performance.now(); return e.timeStamp && Math.abs(n - e.timeStamp) < 1000 ? e.timeStamp : n; };
      pad.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); if (kind === 'choice' && state === 'go') return; hit(stamp(e), null); });
      ctx.stage.querySelectorAll('.rx-cb').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); hit(stamp(e), Number(b.dataset.i)); }));
      ctx.onKey((e) => {
        if (e.repeat) return true;
        const k = e.key.toLowerCase();
        if (kind === 'choice') { const map = cols.length === 4 ? { d: 0, f: 1, j: 2, k: 3 } : { f: 0, arrowleft: 0, j: 1, arrowright: 1 }; if (k in map) { e.preventDefault(); hit(stamp(e), map[k]); return true; } }
        if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); hit(stamp(e), null); return true; }
      });
      const onSound = () => { if (state === 'ready') ready(); };
      window.addEventListener('curio:sound', onSound); ctx.onCleanup(() => window.removeEventListener('curio:sound', onSound));
      pips(); ready();
      ctx.later(() => pad.focus({ preventScroll: true }), 30);
    }
  });

  const CPS_RANKS = [[3, 'Sloth'], [5, 'Tortoise'], [6.5, 'House cat'], [8, 'Rabbit'], [10, 'Cheetah'], [12, 'Woodpecker'], [99, 'Robot']];
  add({
    id: 'click', name: 'Speed Bag', test: 'Click Speed', skill: 'reflex', color: '#e8384f',
    blurb: 'Pummel the speed bag. Clicks per second, a race to a hundred, or a target hunt that tests speed and accuracy together.',
    coach: 'Fast hands! Jab, jab, jab!',
    how: 'Click or tap the bag as fast as you can. The clock starts on your first hit.',
    quickHow: 'Hit the bag as many times as you can in 5 seconds. Click, tap, or press Space. The clock starts on your first hit.',
    keys: `${kb('Space')} or ${kb('Z')} ${kb('X')} when picked as input`,
    art: `<svg viewBox="0 0 120 90"><rect x="18" y="6" width="84" height="10" rx="4" fill="#8d6e63" stroke="${E}" stroke-width="3"/><path d="M60 16v8" stroke="${E}" stroke-width="4"/><path d="M60 24c-17 0-22 14-22 28 0 14 9 26 22 26s22-12 22-26c0-14-5-28-22-28z" fill="#e8384f" stroke="${E}" stroke-width="3"/><path d="M50 36c-4 6-5 14-3 22" stroke="#ff9aa8" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M92 40l12-6M94 52h14M92 64l12 6M28 40l-12-6M26 52H12" stroke="${E}" stroke-width="3" stroke-linecap="round"/></svg>`,
    modes: [
      { id: 'cps', name: 'Clicks per second', unit: 'CPS', desc: 'Hit as fast as you can', how: 'Hit the bag as many times as you can before the timer runs out. Your score is clicks per second.' },
      { id: 'race', name: 'Race', unit: 'seconds', lower: true, desc: 'First to the finish line', how: 'Race to a set number of hits. Your score is how long it took.' },
      { id: 'hunt', name: 'Target hunt', unit: 'hits', desc: 'Pop targets for 20 seconds', how: 'Targets pop up around the ring for 20 seconds and shrink away. Hit as many as you can. Misses lower your accuracy.' }
    ],
    options: [
      { id: 'dur', label: 'Time', choices: [[5, '5s'], [10, '10s'], [30, '30s']], def: 5, modes: ['cps'] },
      { id: 'n', label: 'Race to', choices: [[50, '50'], [100, '100']], def: 50, modes: ['race'] },
      { id: 'input', label: 'Input', choices: [['click', 'Click or tap'], ['space', 'Space'], ['zx', 'Z and X']], def: 'click', modes: ['cps', 'race'] },
      { id: 'size', label: 'Targets', choices: [['big', 'Big'], ['medium', 'Medium'], ['small', 'Small']], def: 'big', modes: ['hunt'] }
    ],
    quick: { mode: 'cps', opts: { dur: 5, input: 'click' } },
    fmt: (v, m) => m === 'cps' ? v.toFixed(1) : m === 'race' ? v.toFixed(2) : v,
    play(ctx) {
      const mode = ctx.mode, input = ctx.quick ? 'click' : ctx.opts.input;
      if (mode === 'hunt') return hunt(ctx);
      const goal = mode === 'cps' ? (ctx.quick ? 5 : ctx.opts.dur) : ctx.opts.n;
      ctx.stage.innerHTML = `<div class="cs">
        <div class="cs-ring"><div class="cs-num" id="csN">0</div><div class="cs-sub" id="csSub">${input === 'space' ? 'Press Space to start' : input === 'zx' ? 'Alternate Z and X to start' : 'Hit the bag to start'}</div></div>
        <button type="button" class="cs-bag" id="csBag" aria-label="Speed bag. Hit it as fast as you can">
          <svg viewBox="0 0 200 230" aria-hidden="true"><rect x="20" y="4" width="160" height="16" rx="6" fill="#8d6e63" stroke="${E}" stroke-width="4"/><path d="M100 20v18" stroke="${E}" stroke-width="6"/>
          <g class="cs-swing"><path d="M100 38c-34 0-46 30-46 62 0 36 20 66 46 66s46-30 46-66c0-32-12-62-46-62z" fill="#e8384f" stroke="${E}" stroke-width="5"/><path d="M78 64c-8 12-10 30-6 48" stroke="#ff9aa8" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M84 160c10 6 22 6 32 0" stroke="#a51d33" stroke-width="5" fill="none" stroke-linecap="round"/></g></svg>
        </button>
        <div class="cs-bar"><i id="csBar"></i></div>
      </div>`;
      const bag = ctx.stage.querySelector('#csBag'), nEl = ctx.stage.querySelector('#csN'), sub = ctx.stage.querySelector('#csSub'), bar = ctx.stage.querySelector('#csBar');
      let clicks = [], t0 = 0, state = 'idle', lastKey = '';
      ctx.hud(mode === 'cps' ? `<b>${goal}</b>s` : `<b>0</b>/${goal}`);
      function hitIt() {
        if (state === 'done') return;
        const now = performance.now();
        if (state === 'idle') { state = 'run'; t0 = now; ctx.frame(tick); }
        clicks.push(now - t0);
        nEl.textContent = clicks.length;
        bag.classList.remove('is-hit'); void bag.offsetWidth; bag.classList.add('is-hit');
        ctx.tone(150 + Math.random() * 40, .06, 'triangle', .14); ctx.noise(.03, .12, 900, 1);
        if (mode === 'race') { bar.style.width = (clicks.length / goal * 100) + '%'; ctx.hud(`<b>${clicks.length}</b>/${goal}`); if (clicks.length >= goal) end(); }
      }
      function tick() {
        if (state !== 'run') return false;
        const el = (performance.now() - t0) / 1000;
        if (mode === 'cps') { bar.style.width = Math.min(100, el / goal * 100) + '%'; sub.textContent = `${Math.max(0, goal - el).toFixed(1)}s left`; ctx.hud(`<b>${Math.max(0, goal - el).toFixed(1)}</b>s`); if (el >= goal) { end(); return false; } }
        else sub.textContent = `${el.toFixed(2)}s`;
      }
      function end() {
        state = 'done';
        const el = mode === 'cps' ? goal : clicks[clicks.length - 1] / 1000;
        const cps = clicks.length / Math.max(.001, el);
        const halves = [clicks.filter((c) => c < el * 500).length, clicks.filter((c) => c >= el * 500).length];
        const rank = CPS_RANKS.find((r) => cps < r[0])[1];
        const pct = NG.u.pctN(cps, 6.5, 1.8);
        const feats = cps >= 10 ? ['cps10'] : [];
        ctx.snd.bell();
        ctx.later(() => ctx.finish(mode === 'cps'
          ? { score: Math.round(cps * 100) / 100, display: cps.toFixed(1), unit: 'clicks per second', pct, feats, stats: [['Clicks', clicks.length], ['Rank', rank], ['First half', halves[0]], ['Second half', halves[1]]], note: 'Typical click speed is about 6 to 7 clicks per second.' }
          : { score: Math.round(el * 100) / 100, display: el.toFixed(2), unit: 'seconds', pct, feats, stats: [['Speed', cps.toFixed(1) + ' CPS'], ['Rank', rank], ['Hits', clicks.length]] }), 450);
      }
      bag.addEventListener('pointerdown', (e) => { if (e.button > 0) return; e.preventDefault(); if (input !== 'click') { sub.textContent = input === 'space' ? 'Use the Space bar for this one' : 'Use Z and X for this one'; return; } hitIt(); });
      ctx.onKey((e) => {
        if (input === 'space' && e.code === 'Space') { e.preventDefault(); if (!e.repeat) hitIt(); return true; }
        if (input === 'zx' && (e.key === 'z' || e.key === 'x' || e.key === 'Z' || e.key === 'X')) { e.preventDefault(); const k = e.key.toLowerCase(); if (!e.repeat && k !== lastKey) { lastKey = k; hitIt(); } return true; }
        if (input === 'click' && (e.code === 'Space' || e.key === 'Enter')) { e.preventDefault(); sub.textContent = 'Click or tap the bag for this one'; return true; }
      });
    }
  });

  function hunt(ctx) {
    const SZ = { big: 70, medium: 54, small: 40 }[ctx.opts.size || 'big'];
    const DUR = 20;
    ctx.stage.innerHTML = `<div class="hunt"><div class="hunt-arena" id="hA"><p class="hunt-msg" id="hM">Tap the first target to start the clock</p></div><div class="cs-bar"><i id="hBar"></i></div></div>`;
    const A = ctx.stage.querySelector('#hA'), msg = ctx.stage.querySelector('#hM'), bar = ctx.stage.querySelector('#hBar');
    let hits = 0, shots = 0, t0 = 0, run = false, combo = 0, bestCombo = 0;
    const spawn = () => {
      const r = A.getBoundingClientRect();
      const d = SZ * (r.width < 500 ? .9 : 1);
      const t = document.createElement('button');
      t.type = 'button'; t.className = 'hunt-t'; t.setAttribute('aria-label', 'Target');
      t.style.width = t.style.height = d + 'px';
      t.style.left = (8 + Math.random() * (r.width - d - 16)) + 'px';
      t.style.top = (8 + Math.random() * (r.height - d - 16)) + 'px';
      t.style.setProperty('--life', run ? '1.7s' : '600s');
      t.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); if (!run) { run = true; t0 = performance.now(); msg.remove(); ctx.frame(tick); A.querySelectorAll('.hunt-t').forEach((x) => x.style.setProperty('--life', '1.7s')); } hits++; shots++; combo++; bestCombo = Math.max(bestCombo, combo); ctx.snd.good(Math.min(6, combo)); t.classList.add('is-hit'); t.disabled = true; ctx.later(() => t.remove(), 180); ctx.later(spawn, 60); ctx.hud(`<b>${hits}</b> hits`); });
      t.addEventListener('animationend', (e) => { if (e.animationName === 'huntLife' && t.isConnected && !t.disabled) { t.remove(); combo = 0; if (run) spawn(); } });
      A.append(t);
    };
    A.addEventListener('pointerdown', (e) => { if (!run || e.target !== A) return; shots++; combo = 0; ctx.snd.bad(); const m = document.createElement('i'); m.className = 'hunt-miss'; const r = A.getBoundingClientRect(); m.style.left = (e.clientX - r.left) + 'px'; m.style.top = (e.clientY - r.top) + 'px'; A.append(m); ctx.later(() => m.remove(), 500); });
    function tick() {
      const el = (performance.now() - t0) / 1000;
      bar.style.width = Math.min(100, el / DUR * 100) + '%';
      if (el >= DUR) { run = false; A.querySelectorAll('.hunt-t').forEach((t) => t.remove()); const acc = shots ? hits / shots : 0; const pct = NG.u.pctN(hits / DUR * (0.6 + 0.4 * acc), 1.05, .38); ctx.finish({ score: hits, display: hits, unit: 'targets in 20 seconds', pct, stats: [['Accuracy', Math.round(acc * 100) + '%'], ['Best combo', bestCombo], ['Per second', (hits / DUR).toFixed(2)]] }); return false; }
    }
    ctx.hud('<b>0</b> hits');
    ctx.later(() => { spawn(); spawn(); }, 60);
  }

  const AIM = {
    classic: { median: 560, sigma: .25 },
    grid: { mean: 34, sd: 10 }, flick: { mean: 15, sd: 4.5 }, track: { mean: 50, sd: 18 }, precision: { mean: 90, sd: 22 }
  };
  add({
    id: 'aim', name: 'Target Range', test: 'Aim Trainer', skill: 'aim', color: '#c62828',
    blurb: 'Five drills for your pointing hand: classic speed, gridshot, fading flicks, smooth tracking and archery precision.',
    coach: 'Steady hand, soft eyes. Do not chase, glide.',
    how: 'Hit the targets. Bigger target settings help on a touchpad.',
    quickHow: 'Hit 15 targets as fast as you can. Each one appears somewhere new. Your score is the average time per target.',
    keys: `Tracking drill: ${kb('Arrows')} also steer the sight`,
    art: `<svg viewBox="0 0 120 90"><path d="M44 80l16-24 16 24" fill="none" stroke="#8d6e63" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="60" cy="40" r="32" fill="#fff" stroke="${E}" stroke-width="3"/><circle cx="60" cy="40" r="24" fill="#c62828"/><circle cx="60" cy="40" r="16" fill="#fff"/><circle cx="60" cy="40" r="8" fill="#c62828"/><path d="M60 40l40-30" stroke="${E}" stroke-width="3" stroke-linecap="round"/><path d="M96 6l10-2-4 10z" fill="#ffd23f" stroke="${E}" stroke-width="2" stroke-linejoin="round"/></svg>`,
    modes: [
      { id: 'classic', name: 'Classic', unit: 'ms per target', lower: true, desc: '30 targets, pure speed', how: '30 targets, one at a time. Hit each as fast as you can. Your score is the average time per target.' },
      { id: 'grid', name: 'Gridshot', unit: 'hits', desc: 'Three at once, 30 seconds', how: 'Three targets sit on a 3 by 3 grid. Every hit spawns a new one. Score as many hits as you can in 30 seconds. Misses cost a point.' },
      { id: 'flick', name: 'Flick', unit: 'caught', desc: 'Catch them before they fade', how: '25 targets pop up and shrink away. Catch as many as you can before they vanish.' },
      { id: 'track', name: 'Tracking', unit: '% on target', desc: 'Follow the drifter, no clicks', how: 'Keep your pointer (or finger) on the drifting target for 20 seconds. No clicking needed. Arrow keys steer the sight too.' },
      { id: 'precision', name: 'Precision', unit: 'points', desc: 'Archery rings, gold scores 10', how: '15 shots at an archery target that moves each time. The gold centre scores 10, the outer ring 1. Best possible: 150.' }
    ],
    options: [{ id: 'size', label: 'Target size', choices: [['big', 'Big'], ['normal', 'Normal'], ['small', 'Small']], def: 'normal' }],
    quick: { mode: 'classic', opts: { size: 'big' } },
    fmt: (v) => Math.round(v),
    play(ctx) {
      const mode = ctx.mode;
      const base = { big: 34, normal: 27, small: 20 }[ctx.opts.size || 'normal'];
      ctx.stage.innerHTML = `<div class="aim"><div class="aim-arena" id="aA"><div class="aim-msg" id="aM"></div></div><div class="cs-bar"><i id="aBar"></i></div></div>`;
      const A = ctx.stage.querySelector('#aA'), msg = ctx.stage.querySelector('#aM'), bar = ctx.stage.querySelector('#aBar');
      const W = () => A.clientWidth, H = () => A.clientHeight;
      const rad = () => base * Math.max(.8, Math.min(1.2, Math.min(W(), H()) / 420));
      const mk = (x, y, r, cls = 'aim-t') => { const t = document.createElement('button'); t.type = 'button'; t.className = cls; t.style.left = (x - r) + 'px'; t.style.top = (y - r) + 'px'; t.style.width = t.style.height = (2 * r) + 'px'; t.setAttribute('aria-label', 'Target'); A.append(t); return t; };
      const rpos = (r) => [r + 6 + Math.random() * (W() - 2 * r - 12), r + 6 + Math.random() * (H() - 2 * r - 12)];
      const burst = (x, y, good = true) => { const b = document.createElement('i'); b.className = good ? 'aim-burst' : 'aim-miss'; b.style.left = x + 'px'; b.style.top = y + 'px'; A.append(b); ctx.later(() => b.remove(), 500); };
      let shots = 0, hits = 0;
      const misser = (e) => { if (e.target !== A) return; if (!started) return; shots++; ctx.snd.bad(); const r = A.getBoundingClientRect(); burst(e.clientX - r.left, e.clientY - r.top, false); onMiss(); };
      let started = false, onMiss = () => {};
      A.addEventListener('pointerdown', misser);
      const intro = (text, cb) => { msg.innerHTML = `<p>${text}</p>`; msg.hidden = false; const r = rad() * 1.3; const t = mk(W() / 2, H() / 2 + 34, r, 'aim-t aim-start'); t.textContent = 'GO'; t.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); t.remove(); msg.hidden = true; ctx.snd.go(); started = true; cb(); }); };
      if (mode === 'classic') {
        const N = ctx.quick ? 15 : 30;
        let n = 0, last = 0, times = [];
        const next = () => {
          const r = rad(), [x, y] = rpos(r), t = mk(x, y, r);
          t.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            const now = performance.now(); times.push(now - last); last = now; n++; shots++; hits++;
            burst(x, y); ctx.snd.good(Math.min(5, n % 6)); t.remove();
            bar.style.width = (n / N * 100) + '%'; ctx.hud(`<b>${n}</b>/${N}`);
            if (n >= N) { const a = Math.round(avg(times)); const acc = hits / shots; ctx.finish({ score: a, display: a, unit: 'ms per target', pct: NG.u.pctL(a / (0.7 + 0.3 * acc), AIM.classic.median, AIM.classic.sigma, true), feats: a < 400 && N >= 30 ? ['aim400'] : [], stats: [['Accuracy', Math.round(acc * 100) + '%'], ['Fastest', Math.round(Math.min(...times)) + 'ms'], ['Slowest', Math.round(Math.max(...times)) + 'ms'], ['Targets', N]] }); }
            else next();
          });
        };
        ctx.hud(`<b>0</b>/${N}`);
        intro(`Hit ${N} targets as fast as you can. Tap GO to begin.`, () => { last = performance.now(); next(); });
      } else if (mode === 'grid') {
        const DUR = 30; let score = 0, t0 = 0;
        const cells = new Set();
        const place = () => {
          const free = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((c) => !cells.has(c));
          const c = free[Math.floor(Math.random() * free.length)]; cells.add(c);
          const cw = W() / 3, ch = H() / 3, r = Math.min(rad(), cw / 2.4, ch / 2.4);
          const x = cw * (c % 3) + cw / 2, y = ch * Math.floor(c / 3) + ch / 2;
          const t = mk(x, y, r);
          t.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); hits++; shots++; score++; cells.delete(c); burst(x, y); ctx.snd.good(score % 5); t.remove(); place(); ctx.hud(`<b>${score}</b> hits`); });
        };
        onMiss = () => { score = Math.max(0, score - 1); ctx.hud(`<b>${score}</b> hits`); };
        A.classList.add('aim-grid');
        intro('Gridshot: three targets, 30 seconds. Every hit spawns another.', () => {
          t0 = performance.now(); place(); place(); place();
          ctx.frame(() => { const el = (performance.now() - t0) / 1000; bar.style.width = Math.min(100, el / DUR * 100) + '%'; if (el >= DUR) { A.querySelectorAll('.aim-t').forEach((t) => t.remove()); const acc = shots ? hits / shots : 0; ctx.finish({ score, display: score, unit: 'hits in 30 seconds', pct: NG.u.pctN(score, AIM.grid.mean, AIM.grid.sd), stats: [['Accuracy', Math.round(acc * 100) + '%'], ['Per second', (hits / DUR).toFixed(2)]] }); return false; } });
        });
      } else if (mode === 'flick') {
        const N = 25; let n = 0, caught = 0;
        const life = { big: 1500, normal: 1200, small: 1000 }[ctx.opts.size || 'normal'];
        const next = () => {
          if (n >= N) { const acc = shots ? hits / shots : 0; ctx.finish({ score: caught, display: caught, unit: `caught out of ${N}`, pct: NG.u.pctN(caught, AIM.flick.mean, AIM.flick.sd), stats: [['Missed', N - caught], ['Accuracy', Math.round(acc * 100) + '%']] }); return; }
          n++; ctx.hud(`<b>${caught}</b> caught · ${n}/${N}`); bar.style.width = (n / N * 100) + '%';
          const r = rad(), [x, y] = rpos(r), t = mk(x, y, r, 'aim-t aim-fade');
          t.style.animationDuration = life + 'ms';
          let gone = false;
          const tm = ctx.later(() => { if (gone) return; gone = true; t.remove(); ctx.snd.tick(); ctx.later(next, 180); }, life);
          t.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); if (gone) return; gone = true; clearTimeout(tm); caught++; hits++; shots++; burst(x, y); ctx.snd.good(3); t.remove(); ctx.hud(`<b>${caught}</b> caught · ${n}/${N}`); ctx.later(next, 160); });
        };
        intro('Flick: 25 targets that shrink away. Catch them quickly.', next);
      } else if (mode === 'track') {
        const DUR = 20; let on = 0, tot = 0, t0 = 0, px = -999, py = -999, last = 0;
        const r = rad() * 1.15;
        const sight = document.createElement('i'); sight.className = 'aim-sight'; A.append(sight);
        let tx = W() / 2, ty = H() / 2, vx = 120, vy = 80;
        const t = mk(tx, ty, r, 'aim-t aim-track'); t.tabIndex = -1;
        const move = (e) => { const b = A.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; };
        A.addEventListener('pointermove', move); A.addEventListener('pointerdown', move);
        ctx.onKey((e) => { const st = 14; if (e.key.startsWith('Arrow')) { e.preventDefault(); if (px < 0) { px = W() / 2; py = H() / 2; } if (e.key === 'ArrowLeft') px -= st; if (e.key === 'ArrowRight') px += st; if (e.key === 'ArrowUp') py -= st; if (e.key === 'ArrowDown') py += st; return true; } });
        intro('Tracking: keep your pointer on the drifting target for 20 seconds. No clicking.', () => {
          t0 = last = performance.now();
          ctx.frame((now) => {
            const dt = Math.min(.05, (now - last) / 1000); last = now;
            const el = (now - t0) / 1000;
            if (Math.random() < dt * 1.2) { const a = Math.random() * Math.PI * 2, sp = 90 + el * 6; vx = Math.cos(a) * sp; vy = Math.sin(a) * sp; }
            tx += vx * dt; ty += vy * dt;
            if (tx < r + 4 || tx > W() - r - 4) { vx *= -1; tx = Math.max(r + 4, Math.min(W() - r - 4, tx)); }
            if (ty < r + 4 || ty > H() - r - 4) { vy *= -1; ty = Math.max(r + 4, Math.min(H() - r - 4, ty)); }
            t.style.left = (tx - r) + 'px'; t.style.top = (ty - r) + 'px';
            sight.style.left = px + 'px'; sight.style.top = py + 'px';
            const inside = Math.hypot(px - tx, py - ty) <= r;
            t.classList.toggle('is-on', inside);
            tot += dt; if (inside) on += dt;
            const p = Math.round(on / Math.max(.001, tot) * 100);
            ctx.hud(`<b>${p}%</b> on target`);
            bar.style.width = Math.min(100, el / DUR * 100) + '%';
            if (el >= DUR) { t.remove(); ctx.finish({ score: p, display: p, unit: '% on target', pct: NG.u.pctN(p, AIM.track.mean, AIM.track.sd), stats: [['Time on target', on.toFixed(1) + 's'], ['Drill length', DUR + 's']] }); return false; }
          });
        });
      } else {
        const N = 15; let n = 0, pts = 0, golds = 0;
        const R = rad() * 2.2;
        const next = () => {
          if (n >= N) { ctx.finish({ score: pts, display: pts, unit: `points out of ${N * 10}`, pct: NG.u.pctN(pts, AIM.precision.mean, AIM.precision.sd), stats: [['Golds', golds], ['Per arrow', (pts / N).toFixed(1)]] }); return; }
          const [x, y] = rpos(R);
          const t = mk(x, y, R, 'aim-t aim-rings');
          t.addEventListener('pointerdown', (e) => {
            e.preventDefault(); e.stopPropagation();
            const b = A.getBoundingClientRect(); const d = Math.hypot(e.clientX - b.left - x, e.clientY - b.top - y) / R;
            const p = Math.max(1, Math.min(10, 10 - Math.floor(d * 10)));
            pts += p; n++; hits++; shots++; if (p >= 9) golds++;
            const f = document.createElement('i'); f.className = 'aim-pts'; f.textContent = '+' + p; f.style.left = (e.clientX - b.left) + 'px'; f.style.top = (e.clientY - b.top) + 'px'; A.append(f); ctx.later(() => f.remove(), 700);
            p >= 9 ? ctx.snd.good(6) : ctx.snd.tap();
            t.remove(); ctx.hud(`<b>${pts}</b> pts · ${n}/${N}`); bar.style.width = (n / N * 100) + '%';
            ctx.later(next, 250);
          });
        };
        ctx.hud(`<b>0</b> pts · 0/${N}`);
        onMiss = () => { n++; ctx.hud(`<b>${pts}</b> pts · ${n}/${N}`); A.querySelectorAll('.aim-rings').forEach((t) => t.remove()); ctx.later(next, 250); };
        intro('Precision: 15 arrows. Aim for the gold.', next);
      }
    }
  });
})();
