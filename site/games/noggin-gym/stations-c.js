(() => {
  const NG = window.NG = window.NG || {};
  NG.stations = NG.stations || [];
  const add = (s) => NG.stations.push(s);
  const E = 'var(--c-edge)';
  const kb = (k) => `<span class="c-kbd">${k}</span>`;
  const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;

  const WATCH = (id) => `<svg class="sw-svg" viewBox="0 0 240 270" aria-hidden="true">
    <rect x="102" y="6" width="36" height="20" rx="6" fill="#9aa0b5" stroke="${E}" stroke-width="4"/><path d="M190 52l14-14" stroke="${E}" stroke-width="8" stroke-linecap="round"/>
    <circle cx="120" cy="148" r="104" fill="#13a89e" stroke="${E}" stroke-width="5"/><circle cx="120" cy="148" r="88" fill="var(--surface)" stroke="${E}" stroke-width="3"/>
    ${Array.from({ length: 60 }, (_, i) => { const a = i / 60 * Math.PI * 2, r1 = i % 5 ? 80 : 72; return `<line x1="${(120 + Math.sin(a) * r1).toFixed(1)}" y1="${(148 - Math.cos(a) * r1).toFixed(1)}" x2="${(120 + Math.sin(a) * 85).toFixed(1)}" y2="${(148 - Math.cos(a) * 85).toFixed(1)}" stroke="var(--ink-3)" stroke-width="${i % 5 ? 1.5 : 3}"/>`; }).join('')}
    <g id="${id}"><path d="M120 158V70" stroke="#e8384f" stroke-width="4" stroke-linecap="round"/><circle cx="120" cy="70" r="5" fill="#e8384f"/></g><circle cx="120" cy="148" r="8" fill="${E}"/>
  </svg>`;
  add({
    id: 'stop', name: 'Stopwatch Stretch', test: 'Stop at 10', skill: 'timing', color: '#00897b',
    blurb: 'Start the stopwatch and stop it at exactly the target. Then do it again with the numbers fading away, or with no clock at all.',
    coach: 'Count in your head. One Mississippi, two Mississippi...',
    how: 'Press start, then stop the clock as close to the target as you can. Your score is how many milliseconds you were off, on average over three tries.',
    quickHow: 'Start the stopwatch and stop it at exactly 10.000 seconds. The numbers fade after 3 seconds, so keep counting. Three tries.',
    keys: `${kb('Space')} start and stop`,
    art: `<svg viewBox="0 0 120 90"><rect x="52" y="4" width="16" height="9" rx="3" fill="#9aa0b5" stroke="${E}" stroke-width="2.5"/><circle cx="60" cy="50" r="36" fill="#00897b" stroke="${E}" stroke-width="3"/><circle cx="60" cy="50" r="28" fill="#fff" stroke="${E}" stroke-width="2.5"/><path d="M60 50V28" stroke="#e8384f" stroke-width="3.5" stroke-linecap="round"/><text x="60" y="68" text-anchor="middle" font-size="10" font-weight="800" fill="#00897b">10.00</text><path d="M90 20l7-7" stroke="${E}" stroke-width="4" stroke-linecap="round"/></svg>`,
    modes: [
      { id: 'classic', name: 'Ten seconds', unit: 'ms off', lower: true, desc: 'The classic: stop at 10.000', how: 'Press start, then stop the clock at exactly 10.000 seconds. Three tries. Score is your average miss in milliseconds.' },
      { id: 'pick', name: 'Pick a target', unit: 'ms off', lower: true, desc: 'From 3 to 30 seconds', how: 'Choose your own target from 3 to 30 seconds. Longer targets drift more.' },
      { id: 'random', name: 'Random', unit: 'ms off', lower: true, desc: 'A surprise target each try', how: 'A new random target between 2 and 20 seconds every try.' },
      { id: 'gauntlet', name: 'Gauntlet', unit: 'ms off', lower: true, desc: 'Five blind targets in a row', how: 'Five different targets, no clock visible at all. Your score is the total of all five misses.' }
    ],
    options: [
      { id: 'vis', label: 'Clock', choices: [['visible', 'Visible'], ['fades', 'Fades'], ['blind', 'Blind']], def: 'fades', modes: ['classic', 'pick', 'random'] },
      { id: 'target', label: 'Target', choices: [[3000, '3s'], [5000, '5s'], [7500, '7.5s'], [15000, '15s'], [30000, '30s']], def: 5000, modes: ['pick'] }
    ],
    quick: { mode: 'classic', opts: { vis: 'fades' } },
    fmt: (v) => Math.round(v),
    play(ctx) {
      const mode = ctx.mode, vis = mode === 'gauntlet' ? 'blind' : ctx.opts.vis || 'fades';
      const N = mode === 'gauntlet' ? 5 : 3;
      const targets = Array.from({ length: N }, (_, i) => mode === 'classic' ? 10000 : mode === 'pick' ? ctx.opts.target : mode === 'random' ? Math.round((2000 + ctx.rng() * 18000) / 100) * 100 : [3000, 6500, 4200, 9000, 12500][i]);
      ctx.stage.innerHTML = `<div class="sw"><div class="sw-target" id="swT"></div><div class="sw-face">${WATCH('swHand')}<div class="sw-read" id="swR">0.000</div></div><button type="button" class="c-btn ng-big sw-btn" id="swB">Start</button><div class="sw-log" id="swL"></div></div>`;
      const btn = ctx.stage.querySelector('#swB'), read = ctx.stage.querySelector('#swR'), hand = ctx.stage.querySelector('#swHand'), tEl = ctx.stage.querySelector('#swT'), log = ctx.stage.querySelector('#swL');
      let i = 0, state = 'idle', t0 = 0, errs = [], signed = [];
      const paintT = () => { tEl.innerHTML = `<small>Try ${i + 1} of ${N}</small> Stop at <b>${(targets[i] / 1000).toFixed(3)}s</b>`; ctx.hud(`<b>${i + 1}</b>/${N}`); };
      const show = (ms) => { read.textContent = (ms / 1000).toFixed(3); hand.setAttribute('transform', `rotate(${(ms / 1000 * 6) % 360} 120 148)`); };
      function press() {
        if (state === 'idle') {
          state = 'run'; t0 = performance.now(); btn.textContent = 'Stop'; btn.classList.add('is-run'); ctx.snd.tick();
          read.classList.remove('is-hid'); hand.style.opacity = '';
          if (vis === 'blind') { read.classList.add('is-hid'); hand.style.opacity = '0'; }
          ctx.frame((now) => {
            if (state !== 'run') return false;
            const el = now - t0; show(el);
            if (vis === 'fades' && el > 3000) { read.classList.add('is-hid'); hand.style.opacity = '0'; }
            if (el > targets[i] * 2 + 5000) { stop(now); return false; }
          });
        } else if (state === 'run') stop(performance.now());
      }
      function stop(now) {
        state = 'show';
        const el = Math.round(now - t0), d = el - targets[i];
        errs.push(Math.abs(d)); signed.push(d);
        read.classList.remove('is-hid'); hand.style.opacity = ''; show(el);
        btn.classList.remove('is-run');
        const ad = Math.abs(d);
        log.insertAdjacentHTML('beforeend', `<span class="${ad < 50 ? 'ok' : ad < 300 ? 'meh' : 'no'}">${(el / 1000).toFixed(3)}s <b>${d === 0 ? '±0' : (d > 0 ? '+' : '-') + ad}ms</b></span>`);
        ad < 30 ? ctx.snd.bell() : ad < 200 ? ctx.snd.good(2) : ctx.snd.thud();
        i++;
        if (i >= N) { btn.disabled = true; btn.textContent = 'Done'; ctx.later(end, 900); return; }
        btn.textContent = 'Next try';
        ctx.later(() => { state = 'idle'; paintT(); show(0); btn.textContent = 'Start'; }, 700);
      }
      function end() {
        const total = errs.reduce((a, b) => a + b, 0);
        const score = mode === 'gauntlet' ? total : Math.round(avg(errs));
        const rel = mode === 'gauntlet' ? total / targets.reduce((a, b) => a + b, 0) : avg(errs.map((e, k) => e / targets[k]));
        const med = { visible: .006, fades: .016, blind: .045 }[vis];
        const lean = Math.round(avg(signed));
        ctx.finish({ score, display: score, unit: mode === 'gauntlet' ? 'ms off in total' : 'ms off on average', pct: NG.u.pctL(Math.max(.0002, rel), mode === 'gauntlet' ? .05 : med, .85, true), feats: errs.some((e) => e <= 10) ? ['stop10'] : [], stats: [['Closest', Math.min(...errs) + 'ms'], ['Furthest', Math.max(...errs) + 'ms'], ['Lean', lean === 0 ? 'none' : Math.abs(lean) + 'ms ' + (lean < 0 ? 'early' : 'late')], ['Clock', vis]] });
      }
      btn.addEventListener('click', press);
      ctx.onKey((e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat && !btn.disabled) press(); return true; } });
      paintT(); show(0); ctx.later(() => btn.focus({ preventScroll: true }), 30);
    }
  });

  const ROPE = `<svg class="jr-svg" viewBox="0 0 240 200" aria-hidden="true">
    <ellipse cx="120" cy="188" rx="60" ry="7" fill="var(--c-shade)"/>
    <path class="jr-rope" d="M40 110 C 60 200, 180 200, 200 110" fill="none" stroke="#8e24aa" stroke-width="5" stroke-linecap="round"/>
    <g class="jr-kid"><circle cx="120" cy="62" r="20" fill="#ff8fb1" stroke="${E}" stroke-width="4"/><path d="M100 58c12-8 28-8 40 0" stroke="#13a89e" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="113" cy="66" r="3" fill="${E}"/><circle cx="127" cy="66" r="3" fill="${E}"/><path d="M114 74c4 3 8 3 12 0" stroke="${E}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M120 82v44M120 126l-14 34M120 126l14 34M120 96l-40 14M120 96l40 14" stroke="${E}" stroke-width="5" stroke-linecap="round" fill="none"/>
    <rect x="32" y="104" width="10" height="18" rx="4" fill="#ffd23f" stroke="${E}" stroke-width="3"/><rect x="198" y="104" width="10" height="18" rx="4" fill="#ffd23f" stroke="${E}" stroke-width="3"/></g>
  </svg>`;
  add({
    id: 'beat', name: 'Jump Rope', test: 'Keep the Beat', skill: 'timing', color: '#8e24aa',
    blurb: 'Skip in time with the rope. Then the music stops and you have to keep the rhythm going on your own.',
    coach: 'Feel the groove. Hop, hop, hop...',
    how: 'Tap along with the beat. After 8 beats the click goes silent: keep tapping at the same tempo. Score is how far off your taps were.',
    quickHow: 'Tap along with the beat (Space, click or tap). After 8 beats the click stops: keep the rhythm going on your own for 12 more.',
    keys: `${kb('Space')} or tap the pad`,
    art: `<svg viewBox="0 0 120 90"><path d="M14 40c10 60 82 60 92 0" fill="none" stroke="#8e24aa" stroke-width="4" stroke-linecap="round"/><rect x="8" y="26" width="10" height="18" rx="4" fill="#ffd23f" stroke="${E}" stroke-width="2.5"/><rect x="102" y="26" width="10" height="18" rx="4" fill="#ffd23f" stroke="${E}" stroke-width="2.5"/><circle cx="60" cy="22" r="10" fill="#ff8fb1" stroke="${E}" stroke-width="2.5"/><path d="M60 32v22M60 54l-8 14M60 54l8 14M60 40l-14 4M60 40l14 4" stroke="${E}" stroke-width="3" stroke-linecap="round"/><path d="M92 8v14a4 4 0 1 1-3-4V8l8-2" fill="none" stroke="${E}" stroke-width="2.5" stroke-linecap="round"/></svg>`,
    modes: [
      { id: 'hold', name: 'Hold the tempo', unit: 'ms off', lower: true, desc: 'The click stops, you keep going', how: 'Tap along with the beat. After 8 beats the click goes silent and the rope vanishes: keep tapping at the same tempo for 16 beats.' },
      { id: 'copy', name: 'Copy the rhythm', unit: 'points', desc: 'Echo a drum pattern', how: 'Listen to a drum pattern, then tap it back after the count-in. Four patterns, each scored out of 100.' },
      { id: 'guess', name: 'Guess the BPM', unit: 'points', desc: 'Name that tempo', how: 'Listen to (and watch) a beat, then guess its tempo in beats per minute. Five rounds, 100 points each.' }
    ],
    options: [{ id: 'bpm', label: 'Tempo', choices: [[70, '70'], [100, '100'], [130, '130'], [160, '160']], def: 100, modes: ['hold', 'copy'] }],
    quick: { mode: 'hold', opts: { bpm: 100 } },
    fmt: (v, m) => Math.round(v),
    play(ctx) {
      const mode = ctx.mode;
      const LAT = () => { const a = ctx.C.audioContext && !ctx.C.muted ? ctx.C.audioContext() : null; return a ? Math.min(80, ((a.outputLatency || 0) + (a.baseLatency || 0)) * 1000) : 0; };
      const at = (perf) => { const a = ctx.C.audioContext && !ctx.C.muted ? ctx.C.audioContext() : null; return a ? Math.max(0, (perf - performance.now()) / 1000) : 0; };
      const click = (perf, hi) => ctx.tone(hi ? 1560 : 1040, .05, 'square', .12, at(perf));
      const kick = (perf) => { ctx.tone(150, .2, 'sine', .4, at(perf), 45); ctx.noise(.05, .1, 1800, 1, at(perf), 'highpass'); };
      ctx.stage.innerHTML = `<div class="jr"><div class="jr-msg" id="jrM"></div><div class="jr-stage" id="jrS">${ROPE}<div class="jr-steps" id="jrSteps"></div></div><button type="button" class="jr-pad" id="jrP">TAP</button><div class="jr-extra" id="jrX"></div></div>`;
      const msg = ctx.stage.querySelector('#jrM'), S = ctx.stage.querySelector('#jrS'), pad = ctx.stage.querySelector('#jrP'), steps = ctx.stage.querySelector('#jrSteps'), X = ctx.stage.querySelector('#jrX');
      const hop = () => { S.classList.remove('is-hop'); void S.offsetWidth; S.classList.add('is-hop'); };
      let onTap = () => {};
      const tap = () => { const t = performance.now(); pad.classList.remove('is-hit'); void pad.offsetWidth; pad.classList.add('is-hit'); ctx.noise(.04, .1, 2400, 1.4); onTap(t); };
      pad.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
      ctx.onKey((e) => { if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) tap(); return true; } });
      if (mode === 'hold') {
        const bpm = ctx.quick ? 100 : ctx.opts.bpm, period = 60000 / bpm, LEAD = 8, SIL = ctx.quick ? 12 : 16;
        msg.innerHTML = 'Tap <b>TAP</b> (or Space) to start the rope';
        let T0 = 0, taps = [], running = false;
        onTap = (t) => {
          if (!running) {
            running = true; const lat = LAT(); T0 = t + 600 + lat; S.style.setProperty('--per', (period / 1000).toFixed(3)); ctx.later(() => S.classList.add('is-on'), T0 - performance.now());
            for (let b = 0; b < LEAD; b++) click(T0 - lat + b * period, b % 4 === 0);
            msg.innerHTML = 'Skip along with the beat...';
            let shown = -1;
            ctx.frame((now) => {
              const b = Math.floor((now - T0) / period);
              if (b !== shown && b >= 0) { shown = b; if (b < LEAD) hop(); if (b === LEAD) { S.classList.remove('is-on'); S.classList.add('is-silent'); msg.innerHTML = 'Silence! Keep the beat going...'; } }
              steps.textContent = b < LEAD ? `${Math.max(0, LEAD - b)} beats of music left` : `${Math.max(0, LEAD + SIL - b)} beats to go`;
              if (now > T0 + (LEAD + SIL - .5) * period) { done(); return false; }
            });
            return;
          }
          hop(); taps.push(t);
        };
        function done() {
          const silentStart = T0 + LEAD * period, end = T0 + (LEAD + SIL) * period;
          const used = new Set(), offs = [];
          taps.filter((t) => t > silentStart - period / 2 && t < end).forEach((t) => { const k = Math.round((t - T0) / period); if (k < LEAD || used.has(k)) return; used.add(k); offs.push(t - (T0 + k * period)); });
          const missed = SIL - offs.length;
          if (offs.length < SIL / 2) { ctx.finish({ score: 999, valid: false, display: '-', unit: 'not enough taps', pct: 1, stats: [['Taps in silence', offs.length], ['Needed', Math.ceil(SIL / 2)]] }); return; }
          const err = Math.round(avg(offs.map(Math.abs)) + missed * 12);
          const drift = Math.round(avg(offs.slice(-4)) - avg(offs.slice(0, 4)));
          const ints = taps.slice(1).map((t, i) => t - taps[i]).filter((d) => d > period * .5 && d < period * 1.5);
          const yourBpm = ints.length ? 60000 / avg(ints) : bpm;
          ctx.finish({ score: err, display: err, unit: 'ms off per beat', pct: NG.u.pctL(Math.max(3, err), 38 * (100 / bpm) ** .3, .55, true), feats: err < 15 ? ['beat15'] : [], stats: [['Your tempo', yourBpm.toFixed(1) + ' BPM'], ['Target', bpm + ' BPM'], ['Drift', (drift > 0 ? 'dragging +' : drift < 0 ? 'rushing ' : '') + drift + 'ms'], ['Missed beats', missed]] });
        }
      } else if (mode === 'copy') {
        S.classList.add('is-copy');
        const bpm = ctx.opts.bpm || 100, stepMs = 60000 / bpm / 4;
        const pool = (window.NG_RHYTHMS || []).filter((p) => p[2] <= 3 && p[1].length === 16);
        const picks = NG.u.shuffle(pool, ctx.rng).slice(0, 4).sort((a, b) => a[2] - b[2]);
        let k = 0, scores = [];
        const round = () => {
          if (k >= picks.length) { const tot = Math.round(avg(scores)); ctx.finish({ score: tot, display: tot, unit: 'points out of 100', pct: NG.u.pctN(tot, 62, 15), stats: picks.map((p, i) => [p[0], scores[i]]) }); return; }
          const [name, pat] = picks[k];
          ctx.hud(`<b>${k + 1}</b>/4`);
          steps.innerHTML = `<div class="jr-pat">${pat.split('').map((c) => `<i class="${c === 'x' ? 'on' : ''}"></i>`).join('')}</div>`;
          const cells = [...steps.querySelectorAll('i')];
          msg.innerHTML = `Pattern ${k + 1}: <b>${name}</b>. Listen...`;
          const t0 = performance.now() + 500;
          for (let b = 0; b < 4; b++) click(t0 + b * stepMs * 4, b === 0);
          const p0 = t0 + 16 * stepMs;
          pat.split('').forEach((c, i) => { if (c === 'x') { kick(p0 + i * stepMs); ctx.later(() => { cells[i].classList.add('lit'); hop(); ctx.later(() => cells[i].classList.remove('lit'), stepMs * .9); }, p0 + i * stepMs - performance.now()); } });
          const c0 = p0 + 16 * stepMs;
          for (let b = 0; b < 4; b++) click(c0 + b * stepMs * 4, b === 0);
          ctx.later(() => { msg.innerHTML = 'Count-in... then <b>your turn!</b>'; }, c0 - performance.now());
          const u0 = c0 + 16 * stepMs, uEnd = u0 + 16 * stepMs + 200;
          const taps = [];
          ctx.later(() => { msg.innerHTML = 'Tap it back now!'; }, u0 - performance.now() - 50);
          onTap = (t) => { if (t > u0 - stepMs * 1.5 && t < uEnd) { taps.push(t); hop(); const i = Math.round((t - u0) / stepMs); if (cells[i]) cells[i].classList.add('tap'); } };
          ctx.later(() => {
            onTap = () => {};
            const on = pat.split('').map((c, i) => c === 'x' ? u0 + i * stepMs : null).filter((v) => v != null);
            const used = new Set(); let pts = 0;
            on.forEach((o) => { let bi = -1, bd = 1e9; taps.forEach((t, j) => { if (!used.has(j) && Math.abs(t - o) < bd) { bd = Math.abs(t - o); bi = j; } }); if (bi >= 0 && bd < stepMs * 1.2) { used.add(bi); pts += Math.max(0, 100 - bd * .9); } });
            const extra = taps.length - used.size;
            const sc = Math.max(0, Math.round(pts / on.length - extra * 8));
            scores.push(sc); sc >= 80 ? ctx.snd.good(4) : sc >= 50 ? ctx.snd.good(1) : ctx.snd.bad();
            msg.innerHTML = `${name}: <b>${sc}</b> points`;
            cells.forEach((c) => c.classList.remove('tap'));
            k++; ctx.later(round, 1300);
          }, uEnd - performance.now());
        };
        msg.innerHTML = 'Get ready to listen...';
        ctx.later(round, 700);
      } else {
        S.classList.add('is-copy');
        let k = 0, pts = [], val = 100, cur = 0;
        X.innerHTML = `<div class="jr-guess"><button type="button" class="c-btn c-btn--ghost" data-d="-10">-10</button><button type="button" class="c-btn c-btn--ghost" data-d="-1">-1</button><output id="jrV">100</output><button type="button" class="c-btn c-btn--ghost" data-d="1">+1</button><button type="button" class="c-btn c-btn--ghost" data-d="10">+10</button></div><input type="range" class="jr-range" id="jrR" min="50" max="200" value="100" aria-label="Your tempo guess"><button type="button" class="c-btn" id="jrGo">Lock in guess</button>`;
        pad.textContent = 'Play again'; pad.classList.add('is-small');
        const out = X.querySelector('#jrV'), rng = X.querySelector('#jrR'), go = X.querySelector('#jrGo');
        const setV = (v) => { val = Math.max(50, Math.min(200, v)); out.textContent = val; rng.value = val; };
        X.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => setV(val + Number(b.dataset.d))));
        rng.addEventListener('input', () => setV(Number(rng.value)));
        const playTempo = () => { const p = 60000 / cur, t0 = performance.now() + 300; for (let b = 0; b < 8; b++) { click(t0 + b * p, b % 4 === 0); ctx.later(hop, t0 + b * p - performance.now()); } };
        const round = () => {
          if (k >= 5) { const tot = pts.reduce((a, b) => a + b, 0); ctx.finish({ score: tot, display: tot, unit: 'points out of 500', pct: NG.u.pctN(tot, 300, 90), stats: pts.map((p, i) => ['Round ' + (i + 1), p]) }); return; }
          cur = 60 + Math.round(ctx.rng() * 120); ctx.hud(`<b>${k + 1}</b>/5`);
          msg.innerHTML = `Round ${k + 1}: how fast is this beat?`; playTempo(); go.disabled = false;
        };
        onTap = () => playTempo();
        go.addEventListener('click', () => { if (go.disabled) return; go.disabled = true; const err = Math.abs(val - cur); const p = Math.max(0, Math.round(100 - err * 4)); pts.push(p); msg.innerHTML = `It was <b>${cur} BPM</b>. You said ${val}: ${p} points.`; p >= 80 ? ctx.snd.good(3) : ctx.snd.tap(); k++; ctx.later(round, 1600); });
        ctx.onKey((e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setV(val + (e.shiftKey ? 10 : 1)); return true; } if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setV(val - (e.shiftKey ? 10 : 1)); return true; } });
        ctx.hideSafe = true;
        ctx.later(round, 500);
      }
    }
  });

  add({
    id: 'angle', name: 'Protractor Press', test: 'Guess the Angle', skill: 'eyes', color: '#00838f',
    blurb: 'How good is your eye for angles? Guess them, draw them, and read the gap between clock hands.',
    coach: 'A right angle is 90. Everything else is just a feeling.',
    how: 'Ten rounds. Each round is scored out of 100 by how close you get. Your score is out of 1000.',
    quickHow: 'Five angles. Guess how many degrees each one is, using the slider or the buttons. Closer means more points.',
    keys: `${kb('Left')} ${kb('Right')} adjust (hold ${kb('Shift')} for 10), ${kb('Enter')} lock in`,
    art: `<svg viewBox="0 0 120 90"><path d="M10 76a50 50 0 0 1 100 0z" fill="#b2ebf2" stroke="${E}" stroke-width="3" stroke-linejoin="round"/>${Array.from({ length: 13 }, (_, i) => { const a = Math.PI - i * Math.PI / 12; return `<line x1="${(60 + Math.cos(a) * 50).toFixed(1)}" y1="${(76 - Math.sin(a) * 50).toFixed(1)}" x2="${(60 + Math.cos(a) * 43).toFixed(1)}" y2="${(76 - Math.sin(a) * 43).toFixed(1)}" stroke="${E}" stroke-width="2"/>`; }).join('')}<path d="M60 76L98 40" stroke="#00838f" stroke-width="4" stroke-linecap="round"/><path d="M60 76h40" stroke="#e8384f" stroke-width="4" stroke-linecap="round"/><path d="M78 76a18 18 0 0 0-5-13" fill="none" stroke="${E}" stroke-width="2.5"/><circle cx="60" cy="76" r="4" fill="${E}"/></svg>`,
    modes: [
      { id: 'guess', name: 'Guess', unit: 'points', desc: 'How many degrees is that?', how: 'An angle appears. Estimate it in degrees with the slider, buttons or arrow keys. Ten rounds, 100 points each.' },
      { id: 'draw', name: 'Draw', unit: 'points', desc: 'Make the angle we ask for', how: 'We name an angle. Rotate the arm until you think it matches: drag it, use the slider, or the arrow keys.' },
      { id: 'clock', name: 'Clock', unit: 'points', desc: 'The gap between two hands', how: 'A clock shows a time. Guess the smaller angle between the hour and minute hands. Remember the hour hand moves too.' }
    ],
    quick: { mode: 'guess', opts: {} },
    fmt: (v) => Math.round(v),
    play(ctx) {
      ctx.hideSafe = true;
      const mode = ctx.mode, ROUNDS = ctx.quick ? 5 : 10;
      let k = 0, pts = [], errsAll = [], cur = 0, val = mode === 'clock' ? 90 : 180, max = mode === 'clock' ? 180 : 360, locked = false, clockT = null;
      ctx.stage.innerHTML = `<div class="an"><div class="an-q" id="anQ"></div><svg class="an-svg" id="anS" viewBox="0 0 300 300" role="img" aria-label="Angle"></svg>
        <div class="an-ctl"><div class="jr-guess"><button type="button" class="c-btn c-btn--ghost" data-d="-10">-10</button><button type="button" class="c-btn c-btn--ghost" data-d="-1">-1</button><output id="anV">0</output><button type="button" class="c-btn c-btn--ghost" data-d="1">+1</button><button type="button" class="c-btn c-btn--ghost" data-d="10">+10</button></div>
        <input type="range" class="jr-range" id="anR" min="0" max="${max}" aria-label="Your answer in degrees"><button type="button" class="c-btn ng-big" id="anGo">Lock it in</button></div><p class="an-fb" id="anF"></p></div>`;
      const S = ctx.stage.querySelector('#anS'), q = ctx.stage.querySelector('#anQ'), out = ctx.stage.querySelector('#anV'), rng = ctx.stage.querySelector('#anR'), go = ctx.stage.querySelector('#anGo'), fb = ctx.stage.querySelector('#anF');
      const cx = 150, cy = 150, R = 118;
      const P = (deg, r) => [cx + Math.cos(deg * Math.PI / 180) * r, cy - Math.sin(deg * Math.PI / 180) * r];
      const arcPath = (from, sweep, r) => { const [x0, y0] = P(from, r), [x1, y1] = P(from + sweep, r); return `M${cx} ${cy}L${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 0 ${x1.toFixed(1)} ${y1.toFixed(1)}Z`; };
      const ray = (deg, col, w = 6, dash = '') => { const [x, y] = P(deg, R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round" ${dash ? `stroke-dasharray="${dash}"` : ''}/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${w}" fill="${col}"/>`; };
      let base = 0;
      const grid = () => `<rect x="2" y="2" width="296" height="296" rx="18" fill="var(--surface)" stroke="var(--c-edge)" stroke-width="3"/>${Array.from({ length: 9 }, (_, i) => `<path d="M${30 + i * 30} 8V292M8 ${30 + i * 30}H292" stroke="var(--line)" stroke-width="1" opacity=".6"/>`).join('')}`;
      function paint(reveal) {
        let s = grid();
        if (mode === 'clock') {
          const [h, m] = clockT;
          s += `<circle cx="${cx}" cy="${cy}" r="${R + 10}" fill="#fff8e7" stroke="#b8860b" stroke-width="6"/>` + Array.from({ length: 12 }, (_, i) => { const [x, y] = P(90 - i * 30, R - 6), [x2, y2] = P(90 - i * 30, R - 20); return `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#3b2a10" stroke-width="4"/>`; }).join('');
          const ma = 90 - m * 6, ha = 90 - (h % 12) * 30 - m * .5;
          const [mx, my] = P(ma, R - 22), [hx, hy] = P(ha, R - 50);
          if (reveal) { let d = ((ma - ha) % 360 + 360) % 360; const from = d > 180 ? ma : ha; s += `<path d="${arcPath(from, Math.min(d, 360 - d), 46)}" fill="#00838f" opacity=".3"/>`; }
          s += `<line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#3b2a10" stroke-width="9" stroke-linecap="round"/><line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#3b2a10" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="8" fill="#e8384f"/>`;
          s += `<text x="${cx}" y="${cy + 66}" text-anchor="middle" class="an-time">${h}:${String(m).padStart(2, '0')}</text>`;
        } else if (mode === 'guess') {
          s += `<path d="${arcPath(base, cur, 54)}" fill="#00838f" opacity="${reveal ? .35 : .18}"/>` + ray(base, 'var(--ink)') + ray(base + cur, '#00838f');
          if (reveal) s += ray(base + val, '#e8384f', 4, '8 8');
        } else {
          s += `<path d="${arcPath(base, val, 54)}" fill="#00838f" opacity=".18"/>` + ray(base, 'var(--ink)') + ray(base + val, '#00838f', 7);
          if (reveal) s += ray(base + cur, '#1faa59', 4, '8 8');
          const [hx, hy] = P(base + val, R);
          s += `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="16" fill="#00838f" stroke="var(--c-edge)" stroke-width="3" class="an-handle"/>`;
        }
        s += `<circle cx="${cx}" cy="${cy}" r="7" fill="var(--c-edge)"/>`;
        S.innerHTML = s;
      }
      const setV = (v) => { val = Math.max(0, Math.min(max, Math.round(v))); out.textContent = val + '°'; rng.value = val; if (mode === 'draw' && !locked) paint(false); };
      ctx.stage.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { if (!locked) setV(val + Number(b.dataset.d)); }));
      rng.addEventListener('input', () => { if (!locked) setV(Number(rng.value)); });
      if (mode === 'draw') {
        const drag = ctx.C.drag(S, { start: (p) => aimAt(p), move: (p) => aimAt(p) });
        ctx.onCleanup(drag);
        S.classList.add('is-drag');
      }
      function aimAt(p) {
        if (locked) return;
        const r = S.getBoundingClientRect(), sx = 300 / r.width;
        const a = Math.atan2(-(p.y * sx - cy), p.x * sx - cx) * 180 / Math.PI;
        setV(((a - base) % 360 + 360) % 360);
      }
      function round() {
        if (k >= ROUNDS) {
          const total = pts.reduce((a, b) => a + b, 0), score = Math.round(total / ROUNDS * 10);
          const mean = mode === 'guess' ? 780 : mode === 'draw' ? 810 : 700;
          ctx.finish({ score, display: score, unit: 'points out of 1000', pct: NG.u.pctN(score, mean, 95), feats: score >= 900 ? ['angle900'] : [], stats: [['Average miss', avg(errsAll).toFixed(1) + '°'], ['Closest', Math.min(...errsAll) + '°'], ['Bullseyes', errsAll.filter((e) => e === 0).length], ['Rounds', ROUNDS]] });
          return;
        }
        locked = false; go.textContent = 'Lock it in'; fb.textContent = '';
        base = mode === 'clock' ? 0 : Math.round(ctx.rng() * 360);
        if (mode === 'clock') { clockT = [1 + Math.floor(ctx.rng() * 12), Math.floor(ctx.rng() * 12) * 5]; const ma = clockT[1] * 6, ha = (clockT[0] % 12) * 30 + clockT[1] * .5; let d = Math.abs(ma - ha) % 360; cur = Math.round(Math.min(d, 360 - d) * 10) / 10; q.innerHTML = `Round ${k + 1}: the angle between the hands?`; setV(90); }
        else if (mode === 'guess') { cur = 5 + Math.round(ctx.rng() * 345); q.innerHTML = `Round ${k + 1}: how many degrees is the teal angle?`; setV(180); }
        else { cur = 5 + Math.round(ctx.rng() * 345); q.innerHTML = `Round ${k + 1}: draw <b>${cur}°</b>`; setV(0); }
        paint(false); ctx.hud(`<b>${k + 1}</b>/${ROUNDS}`);
      }
      function lock() {
        if (locked) { k++; round(); return; }
        locked = true;
        const err = Math.round(Math.abs(val - cur) * 10) / 10;
        const p = Math.max(0, Math.round(100 - err * (mode === 'clock' ? 4 : 3)));
        pts.push(p); errsAll.push(Math.round(err));
        paint(true);
        fb.innerHTML = `It was <b>${cur}°</b>, you said ${val}°. <b>${p}</b> points${err === 0 ? '. Bullseye!' : ''}`;
        p >= 90 ? ctx.snd.bell() : p >= 60 ? ctx.snd.good(2) : ctx.snd.thud();
        go.textContent = k + 1 >= ROUNDS ? 'See score' : 'Next angle';
      }
      go.addEventListener('click', lock);
      ctx.onKey((e) => {
        if (e.key === 'Enter') { e.preventDefault(); lock(); return true; }
        if (locked) return;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); setV(val + (e.shiftKey ? 10 : 1)); return true; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); setV(val - (e.shiftKey ? 10 : 1)); return true; }
      });
      round();
    }
  });

  add({
    id: 'odd', name: 'Colour Spotter', test: 'Odd Colour Out', skill: 'eyes', color: '#039be5',
    blurb: 'One tile is a slightly different shade. Spot it. The boards grow and the difference shrinks until even an eagle squints.',
    coach: 'Relax your eyes. The odd one will pop out.',
    how: 'Tap the tile that is a slightly different colour. Each find adds a level. Wrong taps cost 3 seconds.',
    quickHow: 'Tap the one tile that is a slightly different colour. 30 seconds on the clock, wrong taps cost 3 seconds.',
    keys: `${kb('Arrows')} move, ${kb('Space')} or ${kb('Enter')} pick`,
    art: `<svg viewBox="0 0 120 90">${[0, 1, 2, 3].map((r) => [0, 1, 2, 3, 4].map((c) => `<rect x="${12 + c * 20}" y="${6 + r * 20}" width="17" height="17" rx="5" fill="${r === 1 && c === 3 ? '#4fc3f7' : '#039be5'}" stroke="${E}" stroke-width="2"/>`).join('')).join('')}<circle cx="80" cy="34" r="16" fill="rgba(255,255,255,.3)" stroke="${E}" stroke-width="4"/><path d="M92 46l14 14" stroke="${E}" stroke-width="7" stroke-linecap="round"/></svg>`,
    modes: [
      { id: 'classic', name: 'Classic', unit: 'levels', desc: '60 seconds on the clock', how: 'Sixty seconds. Tap the odd tile out. Each find is a level. Wrong taps cost 3 seconds.' },
      { id: 'zen', name: 'Zen', unit: 'levels', desc: 'No clock, three lives', how: 'No timer at all. Three lives. Take a breath and see how deep you can go.' },
      { id: 'twins', name: 'Twins', unit: 'levels', desc: 'Two odd tiles per board', how: 'Two odd tiles hide on every board. Find both. Sixty seconds.' }
    ],
    options: [{ id: 'cb', label: 'Colour-blind mode', choices: [[0, 'Off'], [1, 'Lightness only']], def: 0 }],
    quick: { mode: 'classic', opts: { cb: 0 } },
    fmt: (v) => v,
    play(ctx) {
      const mode = ctx.mode, cb = !!Number(ctx.opts.cb || 0), DUR = ctx.quick ? 30 : 60;
      ctx.hideSafe = mode === 'zen';
      let level = 0, lives = 3, time = DUR, lastT = 0, started = false, odds = [], found = new Set(), misses = 0, n = 2;
      ctx.stage.innerHTML = `<div class="oc"><div class="oc-top" id="ocT"></div><div class="oc-board" id="ocB"></div><div class="cs-bar" ${mode === 'zen' ? 'hidden' : ''}><i id="ocBar"></i></div></div>`;
      const B = ctx.stage.querySelector('#ocB'), top = ctx.stage.querySelector('#ocT'), bar = ctx.stage.querySelector('#ocBar');
      const sizeFor = (lv) => Math.min(9, (mode === 'twins' ? 3 : 2) + Math.floor(lv / 3));
      const deltaFor = (lv) => Math.max(cb ? 2.5 : 2, (mode === 'twins' ? 28 : 24) * Math.pow(.9, lv));
      const hsl = (c) => `hsl(${c.h.toFixed(1)} ${c.s.toFixed(1)}% ${c.l.toFixed(1)}%)`;
      const paintTop = () => { top.innerHTML = `<span>level <b>${level}</b></span><span>${mode === 'zen' ? Array.from({ length: 3 }, (_, i) => `<i class="${i < lives ? '' : 'gone'}">&#10084;</i>`).join('') : `<b>${Math.max(0, Math.ceil(time))}</b>s`}</span>`; ctx.hud(`level <b>${level}</b>`); };
      function make() {
        n = sizeFor(level); const d = deltaFor(level);
        const h = ctx.rng() * 360, s = 45 + ctx.rng() * 35, l = 38 + ctx.rng() * 24;
        const sign = l > 55 ? -1 : l < 45 ? 1 : (ctx.rng() < .5 ? -1 : 1);
        const base = { h, s, l }, odd = cb ? { h, s, l: l + sign * d } : { h: (h + (ctx.rng() < .5 ? -1 : 1) * d * 1.6 + 360) % 360, s, l: l + sign * d * .45 };
        odds = []; const cnt = mode === 'twins' ? 2 : 1;
        while (odds.length < cnt) { const o = Math.floor(ctx.rng() * n * n); if (!odds.includes(o)) odds.push(o); }
        found = new Set();
        B.style.setProperty('--n', n); B.innerHTML = '';
        const focused = B.contains(document.activeElement);
        for (let i = 0; i < n * n; i++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'oc-t'; b.style.background = hsl(odds.includes(i) ? odd : base); b.setAttribute('aria-label', `Tile ${Math.floor(i / n) + 1}, ${i % n + 1}`); b.addEventListener('click', () => pick(i, b)); B.append(b); }
        if (focused) B.children[Math.floor(n * n / 2)].focus({ preventScroll: true });
        paintTop();
      }
      function pick(i, b) {
        if (!started && mode !== 'zen') { started = true; lastT = performance.now(); ctx.frame(tick); }
        if (odds.includes(i)) {
          if (found.has(i)) return;
          found.add(i); b.classList.add('is-found');
          if (found.size >= odds.length) { level++; ctx.snd.good(Math.min(6, Math.floor(level / 4))); make(); }
          else ctx.snd.pop();
        } else {
          misses++; b.classList.add('is-bad'); ctx.snd.bad(); ctx.buzz(40);
          if (mode === 'zen') { lives--; paintTop(); if (lives <= 0) { B.querySelectorAll('.oc-t').forEach((x, j) => { if (odds.includes(j)) x.classList.add('is-show'); }); ctx.later(end, 1200); } }
          else { time -= 3; paintTop(); }
        }
      }
      function tick(now) { time -= (now - lastT) / 1000; lastT = now; bar.style.width = Math.max(0, time / DUR * 100) + '%'; paintTop(); if (time <= 0) { B.querySelectorAll('.oc-t').forEach((x, j) => { x.disabled = true; if (odds.includes(j)) x.classList.add('is-show'); }); ctx.later(end, 900); return false; } }
      function end() {
        const scale = mode === 'zen' ? 1 : Math.sqrt(60 / DUR);
        const mean = mode === 'classic' ? 17 : mode === 'zen' ? 19 : 12;
        ctx.finish({ score: level, display: level, unit: 'boards cleared', pct: NG.u.pctN(level * scale + (cb ? 2 : 0), mean, 6), feats: level >= 25 ? ['odd25'] : [], stats: [['Misses', misses], ['Last grid', `${n} by ${n}`], ['Difference', deltaFor(level).toFixed(1) + '%']], note: 'A typical human can tell apart around a million shades.' });
      }
      B.addEventListener('keydown', (e) => { const all = [...B.children]; const i = all.indexOf(document.activeElement); if (i < 0) return; const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -n, ArrowDown: n }[e.key]; if (d == null) return; e.preventDefault(); const j = i + d; if (j >= 0 && j < all.length) all[j].focus(); });
      make();
      if (mode !== 'zen') top.insertAdjacentHTML('beforeend', '<span class="oc-hint">clock starts on your first tap</span>');
    }
  });

  function hsb2rgb(h, s, v) { s /= 100; v /= 100; const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [f(5), f(3), f(1)].map((x) => Math.round(x * 255)); }
  function rgb2hsb([r, g, b]) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0; if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; } return [Math.round(h) % 360, Math.round(mx ? d / mx * 100 : 0), Math.round(mx * 100)]; }
  function rgb2lab([r, g, b]) { const lin = (c) => { c /= 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; }; const R = lin(r), G = lin(g), B = lin(b); const X = (R * .4124564 + G * .3575761 + B * .1804375) / .95047, Y = R * .2126729 + G * .7151522 + B * .072175, Z = (R * .0193339 + G * .119192 + B * .9503041) / 1.08883; const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116); const fx = f(X), fy = f(Y), fz = f(Z); return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]; }
  function dE00([L1, a1, b1], [L2, a2, b2]) {
    const rad = Math.PI / 180, deg = 180 / Math.PI;
    const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cb = (C1 + C2) / 2, G = .5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)));
    const a1p = (1 + G) * a1, a2p = (1 + G) * a2, C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
    const hp = (b, a) => { if (a === 0 && b === 0) return 0; const h = Math.atan2(b, a) * deg; return h < 0 ? h + 360 : h; };
    const h1p = hp(b1, a1p), h2p = hp(b2, a2p), dLp = L2 - L1, dCp = C2p - C1p;
    let dhp = 0; if (C1p * C2p !== 0) { dhp = h2p - h1p; if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360; }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp / 2 * rad), Lbp = (L1 + L2) / 2, Cbp = (C1p + C2p) / 2;
    let hbp = h1p + h2p; if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hbp += h1p + h2p < 360 ? 360 : -360; hbp /= 2; }
    const T = 1 - .17 * Math.cos((hbp - 30) * rad) + .24 * Math.cos(2 * hbp * rad) + .32 * Math.cos((3 * hbp + 6) * rad) - .2 * Math.cos((4 * hbp - 63) * rad);
    const dTh = 30 * Math.exp(-(((hbp - 275) / 25) ** 2)), Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
    const Sl = 1 + (.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2), Sc = 1 + .045 * Cbp, Sh = 1 + .015 * Cbp * T, Rt = -Math.sin(2 * dTh * rad) * Rc;
    return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
  }
  const css = (hsb) => { const [r, g, b] = hsb2rgb(...hsb); return `rgb(${r}, ${g}, ${b})`; };
  const labOf = (hsb) => rgb2lab(hsb2rgb(...hsb));
  const scoreFor = (d) => Math.round(100 * Math.exp(-((d / 22) ** 1.6))) / 10;
  const hexRgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  add({
    id: 'color', name: 'Paint Pot', test: 'Color Match', skill: 'eyes', color: '#ab47bc',
    blurb: 'A colour flashes up. Remember it, then mix it back from memory with hue, saturation and brightness.',
    coach: 'Memorise the mood of the colour, not just its name.',
    how: 'Look at the colour, then rebuild it with the three sliders. Every colour is scored out of 10.',
    quickHow: 'A colour shows for 5 seconds. Then rebuild it from memory with the hue, saturation and brightness sliders. Three colours, each scored out of 10.',
    keys: `${kb('Tab')} between sliders, ${kb('Arrows')} adjust, ${kb('Enter')} submit`,
    art: `<svg viewBox="0 0 120 90"><path d="M28 30h64l-6 52H34z" fill="#cfd8dc" stroke="${E}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="60" cy="30" rx="32" ry="8" fill="#ab47bc" stroke="${E}" stroke-width="3"/><path d="M38 32c0 10 4 14 6 4 2 14 8 14 9 2" fill="#ab47bc" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/><path d="M76 24l26-20" stroke="#8d6e63" stroke-width="6" stroke-linecap="round"/><path d="M70 30l8-8 6 6-6 4z" fill="#ffd23f" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/><circle cx="18" cy="70" r="6" fill="#ffd23f" stroke="${E}" stroke-width="2"/><circle cx="104" cy="66" r="5" fill="#4fc3f7" stroke="${E}" stroke-width="2"/></svg>`,
    modes: [
      { id: 'classic', name: 'From memory', unit: 'out of 10', desc: 'See it, then mix it', how: 'A colour shows for a few seconds. Then rebuild it from memory with the hue, saturation and brightness sliders. Five colours, each scored out of 10.' },
      { id: 'name', name: 'Name it', unit: 'out of 10', desc: 'Mix a colour from its name', how: 'We give you the name of a web colour like Steel Blue or Peach Puff. Mix it from imagination. Five colours.' },
      { id: 'palette', name: 'Line-up', unit: 'out of 10', desc: 'Spot the original swatch', how: 'Four colours flash up. Then pick each original out of a line-up of near-identical impostors. Three palettes.' }
    ],
    options: [{ id: 'view', label: 'Look time', choices: [[5000, '5s'], [3000, '3s'], [1500, 'Glimpse']], def: 5000, modes: ['classic', 'palette'] }],
    quick: { mode: 'classic', opts: { view: 5000 } },
    fmt: (v) => Number(v).toFixed(1),
    play(ctx) {
      ctx.hideSafe = true;
      const mode = ctx.mode, VIEW = ctx.quick ? 5000 : ctx.opts.view, ROUNDS = ctx.quick ? 3 : mode === 'palette' ? 3 : 5;
      const NAMED = (window.NG_COLOURS || []).filter(([, h]) => { const [hh, s, b] = rgb2hsb(hexRgb(h)); return s > 15 || b < 90; });
      let k = 0, scores = [], dists = [];
      ctx.stage.innerHTML = `<div class="pp"><div class="pp-q" id="ppQ"></div><div class="pp-main" id="ppM"></div></div>`;
      const q = ctx.stage.querySelector('#ppQ'), M = ctx.stage.querySelector('#ppM');
      const randCol = () => [Math.floor(ctx.rng() * 360), 25 + Math.floor(ctx.rng() * 70), 30 + Math.floor(ctx.rng() * 65)];
      const finish = () => { const a = Math.round(avg(scores) * 10) / 10; const mean = mode === 'classic' ? 6.4 : mode === 'name' ? 5.4 : 7; ctx.finish({ score: a, display: a.toFixed(1), unit: 'out of 10 on average', pct: NG.u.pctN(a, mean, 1.5), feats: mode === 'classic' && a >= 9 ? ['paint9'] : [], stats: (mode === 'palette' ? [['Right picks', scores.filter((s) => s === 10).length + '/' + scores.length]] : [['Best colour', Math.max(...scores).toFixed(1)], ['Worst colour', Math.min(...scores).toFixed(1)], ['Average miss', avg(dists).toFixed(1) + ' dE']]) }); };
      function mixer(target, label) {
        let hsb = [Math.floor(ctx.rng() * 360), 50, 50];
        M.innerHTML = `<div class="pp-mix"><div class="pp-sw" id="ppSw"></div><div class="pp-sl">
          <label><span>Hue</span><input type="range" min="0" max="359" data-i="0" class="pp-r pp-h"></label>
          <label><span>Saturation</span><input type="range" min="0" max="100" data-i="1" class="pp-r pp-s"></label>
          <label><span>Brightness</span><input type="range" min="0" max="100" data-i="2" class="pp-r pp-b"></label></div>
          <button type="button" class="c-btn ng-big" id="ppGo">That's the one</button></div>`;
        const sw = M.querySelector('#ppSw'), rs = [...M.querySelectorAll('.pp-r')];
        const paint = () => { sw.style.background = css(hsb); rs[0].value = hsb[0]; rs[1].value = hsb[1]; rs[2].value = hsb[2]; rs[1].style.background = `linear-gradient(90deg, ${css([hsb[0], 0, hsb[2]])}, ${css([hsb[0], 100, hsb[2]])})`; rs[2].style.background = `linear-gradient(90deg, #000, ${css([hsb[0], hsb[1], 100])})`; };
        rs.forEach((r) => r.addEventListener('input', () => { hsb[Number(r.dataset.i)] = Number(r.value); paint(); }));
        paint(); rs[0].focus({ preventScroll: true });
        const submit = () => {
          const d = dE00(labOf(hsb), labOf(target)), sc = scoreFor(d);
          scores.push(sc); dists.push(d);
          M.innerHTML = `<div class="pp-cmp"><div style="background:${css(target)}"><span>${label || 'The colour'}</span></div><div style="background:${css(hsb)}"><span>Your mix</span></div></div><p class="pp-score"><b>${sc.toFixed(1)}</b> / 10</p><button type="button" class="c-btn ng-big" id="ppNext">${k + 1 >= ROUNDS ? 'See score' : 'Next colour'}</button>`;
          sc >= 8 ? ctx.snd.bell() : sc >= 5 ? ctx.snd.good(1) : ctx.snd.thud();
          const nx = M.querySelector('#ppNext'); nx.focus({ preventScroll: true });
          nx.addEventListener('click', () => { k++; round(); });
        };
        M.querySelector('#ppGo').addEventListener('click', submit);
        M._submit = submit;
      }
      ctx.onKey((e) => { if (e.key === 'Enter') { const b = M.querySelector('#ppGo, #ppNext'); if (b && document.activeElement && document.activeElement.tagName === 'INPUT') { e.preventDefault(); b.click(); return true; } } });
      function round() {
        if (k >= ROUNDS) return finish();
        ctx.hud(`<b>${k + 1}</b>/${ROUNDS}`);
        if (mode === 'classic') {
          const t = randCol();
          q.textContent = `Colour ${k + 1} of ${ROUNDS}: memorise it`;
          M.innerHTML = `<div class="pp-show" style="background:${css(t)}"><div class="pp-timer"><i style="animation-duration:${VIEW}ms"></i></div></div>`;
          ctx.snd.swish();
          ctx.later(() => { q.textContent = 'Now mix it from memory'; mixer(t); }, VIEW);
        } else if (mode === 'name') {
          const [nm, hx] = NAMED[Math.floor(ctx.rng() * NAMED.length)];
          q.innerHTML = `Colour ${k + 1} of ${ROUNDS}: mix <b>${nm}</b>`;
          mixer(rgb2hsb(hexRgb(hx)), nm);
        } else {
          const cols = Array.from({ length: 4 }, randCol);
          q.textContent = `Palette ${k + 1} of ${ROUNDS}: remember all four`;
          M.innerHTML = `<div class="pp-pal">${cols.map((c) => `<i style="background:${css(c)}"></i>`).join('')}</div><div class="pp-timer"><i style="animation-duration:${VIEW + 1000}ms"></i></div>`;
          ctx.later(() => { let j = 0; const pickOne = () => {
            if (j >= 4) { k++; round(); return; }
            const t = cols[j], dv = Math.max(6, 14 - k * 3);
            const fakes = [[t[0] + dv * 1.5, t[1], t[2]], [t[0], Math.max(5, Math.min(100, t[1] + (t[1] > 60 ? -dv : dv))), t[2]], [t[0], t[1], Math.max(10, Math.min(100, t[2] + (t[2] > 60 ? -dv : dv)))]].map(([h, s, b]) => [(h + 360) % 360, s, b]);
            const opts = NG.u.shuffle([t].concat(fakes), ctx.rng);
            q.textContent = `Which was swatch ${j + 1}?`;
            M.innerHTML = `<div class="pp-pal pp-slots">${cols.map((c, i) => `<i class="${i < j ? '' : 'q'}" style="${i < j ? `background:${css(c)}` : ''}">${i === j ? '?' : ''}</i>`).join('')}</div><div class="pp-opts">${opts.map((c, i) => `<button type="button" class="pp-opt" data-i="${i}" style="background:${css(c)}" aria-label="Option ${i + 1}"></button>`).join('')}</div>`;
            M.querySelectorAll('.pp-opt').forEach((b) => b.addEventListener('click', () => { const ok = opts[Number(b.dataset.i)] === t; scores.push(ok ? 10 : 0); b.classList.add(ok ? 'is-ok' : 'is-no'); ok ? ctx.snd.good(2) : ctx.snd.bad(); M.querySelectorAll('.pp-opt').forEach((x) => { x.disabled = true; if (opts[Number(x.dataset.i)] === t) x.classList.add('is-ok'); }); j++; ctx.later(pickOne, 700); }));
            M.querySelector('.pp-opt').focus({ preventScroll: true });
          }; pickOne(); }, VIEW + 1000);
        }
      }
      round();
    }
  });

  const OPS = { add: 'Add', sub: 'Subtract', mul: 'Times', div: 'Divide', mix: 'Mixed', sq: 'Squares', pct: 'Percent', miss: 'Missing number' };
  const RATE = { add: 26, sub: 23, mul: 19, div: 18, mix: 20, sq: 14, pct: 12, miss: 15 };
  add({
    id: 'math', name: 'Number Crunches', test: 'Mental Math', skill: 'wits', color: '#5e35b1',
    blurb: 'Sums, products, squares and percentages against the clock. Answers go in as soon as they are right, so keep your fingers moving.',
    coach: 'No calculators in my gym. I checked your pockets.',
    how: 'Type the answer. It submits itself the moment it is right. Wrong answers flash red and clear.',
    quickHow: 'Mixed sums for 30 seconds. Type the answer with your keyboard or the keypad. It goes in as soon as it is right.',
    keys: `${kb('0')}-${kb('9')} type, ${kb('Backspace')} fix, ${kb('Tab')} skip`,
    art: `<svg viewBox="0 0 120 90"><rect x="10" y="10" width="100" height="70" rx="8" fill="#8d6e63" stroke="${E}" stroke-width="3"/><rect x="18" y="18" width="84" height="54" rx="4" fill="#fff8e7" stroke="${E}" stroke-width="2"/>${[30, 44, 58].map((y, r) => `<path d="M18 ${y}h84" stroke="${E}" stroke-width="2"/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="${(r === 1 ? 52 : 28) + i * 11 + (i > 2 ? 14 : 0)}" cy="${y}" r="5" fill="${['#5e35b1', '#e8384f', '#ffd23f'][r]}" stroke="${E}" stroke-width="1.5"/>`).join('')}`).join('')}</svg>`,
    modes: [
      { id: 'sprint', name: 'Sprint', unit: 'correct', desc: '60 seconds, as many as you can', how: 'Sixty seconds. Answer as many as you can. Skipping is free but does not score.' },
      { id: 'survival', name: 'Survival', unit: 'correct', desc: 'Right answers buy time', how: 'Start with 15 seconds. Right answers add up to 3 seconds (less as you go), every slip costs 4. Last as long as you can.' },
      { id: 'race', name: 'Race 25', unit: 'seconds', lower: true, desc: '25 answers, fast as you can', how: 'Twenty-five answers as fast as possible. Skips cost 3 seconds.' }
    ],
    options: [{ id: 'op', label: 'Sums', choices: Object.entries(OPS), def: 'mix' }, { id: 'diff', label: 'Difficulty', choices: [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']], def: 'normal' }],
    quick: { mode: 'sprint', opts: { op: 'mix', diff: 'normal' } },
    fmt: (v, m) => m === 'race' ? Number(v).toFixed(1) : v,
    play(ctx) {
      const mode = ctx.mode, op = ctx.quick ? 'mix' : ctx.opts.op, diff = ctx.quick ? 'normal' : ctx.opts.diff, F = { easy: .6, normal: 1, hard: 1.7 }[diff];
      const DUR = mode === 'sprint' ? (ctx.quick ? 30 : 60) : 15;
      const R = (a, b) => Math.floor(a + ctx.rng() * (b - a + 1));
      let k = 0;
      function gen(kind) {
        const st = Math.min(k, 30), sc = (n, min = 3) => Math.max(min, Math.round(n * F));
        if (kind === 'mix') kind = ['add', 'sub', 'mul', 'div'][R(0, 3)];
        if (kind === 'add') { const hi = sc(12 + st * 3); const a = R(2, hi), b = R(2, hi); return { t: `${a} + ${b}`, a: a + b }; }
        if (kind === 'sub') { const hi = sc(15 + st * 3, 6); const a = R(5, hi), b = R(1, a); return { t: `${a} − ${b}`, a: a - b }; }
        if (kind === 'mul' || kind === 'div') { const hi = sc(st < 10 ? 10 : 12 + Math.floor((st - 10) / 4), 5); const a = R(2, hi), b = R(2, hi); return kind === 'mul' ? { t: `${a} × ${b}`, a: a * b } : { t: `${a * b} ÷ ${b}`, a }; }
        if (kind === 'sq') { const n = R(2, Math.min(sc(st < 8 ? 12 : 12 + st), 30)); return ctx.rng() < .5 ? { t: `${n}²`, a: n * n } : { t: `√${n * n}`, a: n }; }
        if (kind === 'pct') { const opts = [[10, 10], [50, 2], [20, 5], [25, 4], [5, 20], [30, 10], [75, 4], [40, 5], [1, 100], [200, 1], [15, 20]]; const [p, u] = opts[R(0, Math.min(opts.length - 1, 3 + Math.floor(st / 2)))]; const base = R(1, sc(8 + st)) * u; return { t: `${p}% of ${base}`, a: p * base / 100 }; }
        const a = R(2, sc(12 + st * 2)), b = R(2, sc(12 + st * 2));
        return ctx.rng() < .5 ? { t: `${a} + ? = ${a + b}`, a: b } : { t: `? × ${Math.min(a, 12)} = ${Math.min(a, 12) * b}`, a: b };
      }
      ctx.stage.innerHTML = `<div class="mm"><div class="mm-top" id="mmT"></div><div class="mm-q" id="mmQ"></div><div class="mm-a" id="mmA" aria-live="polite">&nbsp;</div>
        <div class="mm-pad">${['7', '8', '9', '4', '5', '6', '1', '2', '3', '-', '0', 'del'].map((x) => `<button type="button" data-k="${x}">${x === 'del' ? '&#9003;' : x === '-' ? '−' : x}</button>`).join('')}<button type="button" data-k="skip" class="mm-skip">Skip</button></div><div class="cs-bar" ${mode === 'race' ? 'hidden' : ''}><i id="mmBar"></i></div></div>`;
      const qEl = ctx.stage.querySelector('#mmQ'), aEl = ctx.stage.querySelector('#mmA'), top = ctx.stage.querySelector('#mmT'), bar = ctx.stage.querySelector('#mmBar');
      let q = null, input = '', score = 0, slips = 0, skips = 0, streak = 0, bestStreak = 0, time = DUR, lastT = 0, started = false, t0 = 0, elapsed = 0, penalty = 0, times = [], qAt = 0;
      const paintTop = () => { top.innerHTML = `<span><b>${score}</b>${mode === 'race' ? '/25' : ' right'}</span><span>${mode === 'race' ? `<b>${(elapsed + penalty).toFixed(1)}</b>s` : `<b>${Math.max(0, Math.ceil(time))}</b>s`}</span><span class="${streak >= 10 ? 'hot' : ''}">streak <b>${streak}</b></span>`; ctx.hud(`<b>${score}</b> right`); };
      const next = () => { q = gen(op); k++; qEl.textContent = q.t; qEl.classList.remove('is-in'); void qEl.offsetWidth; qEl.classList.add('is-in'); input = ''; aEl.innerHTML = '&nbsp;'; qAt = performance.now(); };
      const start = () => { if (started) return; started = true; lastT = t0 = performance.now(); ctx.frame(tick); };
      function type(x) {
        start();
        if (x === 'del') input = input.slice(0, -1);
        else if (x === 'skip') { skips++; streak = 0; if (mode === 'race') penalty += 3; ctx.snd.tap(); next(); paintTop(); return; }
        else if (x === '-') { if (!input) input = '-'; }
        else if (input.replace('-', '').length < 7) input += x;
        aEl.textContent = input || ' ';
        const want = String(q.a);
        if (input === want) {
          score++; streak++; bestStreak = Math.max(bestStreak, streak); times.push(performance.now() - qAt);
          if (mode === 'survival') time += Math.max(.8, 3 - score * .06);
          ctx.snd.good(Math.min(6, Math.floor(streak / 3)));
          aEl.classList.remove('is-ok'); void aEl.offsetWidth; aEl.classList.add('is-ok');
          if (mode === 'race' && score >= 25) { end(); return; }
          ctx.later(next, 90); paintTop();
        } else if (input.length >= want.length && !want.startsWith(input)) {
          slips++; streak = 0; if (mode === 'survival') time -= 4;
          ctx.snd.bad(); ctx.buzz(40);
          aEl.classList.remove('is-no'); void aEl.offsetWidth; aEl.classList.add('is-no');
          ctx.later(() => { input = ''; aEl.innerHTML = '&nbsp;'; }, 260); paintTop();
        }
      }
      function tick(now) {
        const dt = (now - lastT) / 1000; lastT = now;
        if (mode === 'race') { elapsed = (now - t0) / 1000; paintTop(); return; }
        time -= dt; elapsed = (now - t0) / 1000;
        bar.style.width = Math.max(0, Math.min(100, time / (mode === 'sprint' ? DUR : 30) * 100)) + '%';
        paintTop();
        if (time <= 0) { end(); return false; }
      }
      function end() {
        if (!started) return;
        started = false;
        const fast = times.length ? Math.min(...times) / 1000 : 0;
        const rate = RATE[op] * (diff === 'easy' ? 1.3 : diff === 'hard' ? .7 : 1);
        const stats = [['Slips', slips], ['Skips', skips], ['Best streak', bestStreak], ['Fastest', fast ? fast.toFixed(2) + 's' : '-']];
        if (mode === 'sprint') ctx.finish({ score, display: score, unit: `right in ${DUR} seconds`, pct: NG.u.pctN(score * 60 / DUR, rate, rate * .38), feats: score >= 30 && DUR === 60 ? ['math30'] : [], stats });
        else if (mode === 'survival') ctx.finish({ score, display: score, unit: `right, lasted ${elapsed.toFixed(0)}s`, pct: NG.u.pctN(score, rate * .7, rate * .35), stats });
        else { const tt = Math.round((elapsed + penalty) * 10) / 10; ctx.finish({ score: tt, display: tt.toFixed(1), unit: 'seconds for 25', pct: NG.u.pctL(tt, 25 / rate * 60, .35, true), stats }); }
      }
      ctx.stage.querySelectorAll('.mm-pad button').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); type(b.dataset.k); }));
      ctx.stage.querySelectorAll('.mm-pad button').forEach((b) => b.addEventListener('click', (e) => { if (e.detail === 0) type(b.dataset.k); }));
      ctx.onKey((e) => {
        if (/^[0-9]$/.test(e.key)) { e.preventDefault(); type(e.key); return true; }
        if (e.key === '-') { e.preventDefault(); type('-'); return true; }
        if (e.key === 'Backspace') { e.preventDefault(); type('del'); return true; }
        if (e.key === 'Tab' || e.key === 'ArrowRight') { e.preventDefault(); type('skip'); return true; }
      });
      next(); paintTop();
      top.insertAdjacentHTML('beforeend', '<span class="oc-hint">clock starts on your first key</span>');
    }
  });

  add({
    id: 'typing', name: 'Keyboard Treadmill', test: 'Typing Test', skill: 'wits', color: '#546e7a',
    blurb: 'Keep pace with the belt: timed runs, word counts, famous quotes and real code. The timer starts on your first key.',
    coach: 'Eyes on the words, not your fingers.',
    how: 'Type the text exactly. Mistakes show in red; Backspace fixes them. Your speed counts only correct characters.',
    quickHow: 'Type the words as fast as you can for 15 seconds. The timer starts on your first key. Tap the text box first on a phone.',
    keys: `${kb('Backspace')} fixes mistakes`,
    art: `<svg viewBox="0 0 120 90"><path d="M10 70h100" stroke="${E}" stroke-width="3" stroke-linecap="round"/><rect x="8" y="50" width="104" height="18" rx="9" fill="#546e7a" stroke="${E}" stroke-width="3"/><circle cx="17" cy="59" r="5" fill="#cfd8dc" stroke="${E}" stroke-width="2"/><circle cx="103" cy="59" r="5" fill="#cfd8dc" stroke="${E}" stroke-width="2"/>${['W', 'P', 'M'].map((c, i) => `<rect x="${30 + i * 22}" y="${28 + (i % 2) * 4}" width="18" height="18" rx="4" fill="${i === 2 ? '#ff6b2c' : '#fff'}" stroke="${E}" stroke-width="2.5"/><text x="${39 + i * 22}" y="${41 + (i % 2) * 4}" text-anchor="middle" font-size="11" font-weight="800" fill="${i === 2 ? '#fff' : E}">${c}</text>`).join('')}<path d="M14 50V16h10" stroke="${E}" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>`,
    modes: [
      { id: 'time', name: 'Timed', unit: 'WPM', desc: 'Type until the clock runs out', how: 'Common words scroll by. Type as many as you can before the clock runs out.' },
      { id: 'words', name: 'Word count', unit: 'WPM', desc: 'A fixed number of words', how: 'A fixed number of common words. The clock stops when you finish the last one.' },
      { id: 'quote', name: 'Quotes', unit: 'WPM', desc: 'Famous lines, with punctuation', how: 'A famous quote, capitals and punctuation included.' },
      { id: 'code', name: 'Code', unit: 'WPM', desc: 'Real snippets, brackets and all', how: 'A short code snippet. Spaces and line breaks count. Press Enter for new lines.' }
    ],
    options: [
      { id: 'secs', label: 'Seconds', choices: [[15, '15'], [30, '30'], [60, '60']], def: 30, modes: ['time'] },
      { id: 'count', label: 'Words', choices: [[10, '10'], [25, '25'], [50, '50']], def: 25, modes: ['words'] },
      { id: 'len', label: 'Length', choices: [['short', 'Short'], ['medium', 'Medium'], ['long', 'Long']], def: 'medium', modes: ['quote'] },
      { id: 'lang', label: 'Language', choices: [['js', 'JavaScript'], ['py', 'Python'], ['css', 'CSS'], ['html', 'HTML']], def: 'js', modes: ['code'] },
      { id: 'pack', label: 'Word pack', choices: [['common', 'Common'], ['extra', 'Bigger'], ['animals', 'Animals'], ['space', 'Space'], ['food', 'Food'], ['tricky', 'Tricky']], def: 'common', modes: ['time', 'words'] }
    ],
    quick: { mode: 'time', opts: { secs: 15, pack: 'common' } },
    fmt: (v) => Math.round(v),
    play(ctx) {
      ctx.hideSafe = true;
      const D = window.NG_TYPE, mode = ctx.mode;
      const secs = ctx.quick ? 15 : ctx.opts.secs;
      const list = () => { const p = ctx.quick ? 'common' : ctx.opts.pack; return p === 'common' ? D.common : p === 'extra' ? D.extra : D.themes[p] || D.common; };
      const words = (n) => { const L = list(), out = []; let prev = ''; while (out.length < n) { const w = L[Math.floor(ctx.rng() * L.length)]; if (w !== prev) { out.push(w); prev = w; } } return out.join(' '); };
      let text = '', by = '';
      if (mode === 'time') text = words(secs * 4);
      else if (mode === 'words') text = words(ctx.opts.count);
      else if (mode === 'quote') { const len = ctx.opts.len; const pool = D.quotes.filter((x) => len === 'short' ? x.t.length <= 100 : len === 'medium' ? x.t.length > 100 && x.t.length <= 220 : x.t.length > 220); const p = pool[Math.floor(ctx.rng() * pool.length)] || D.quotes[0]; text = p.t; by = p.a; }
      else { const L = D.code[ctx.opts.lang] || D.code.js; text = L[Math.floor(ctx.rng() * L.length)]; }
      text = text.replace(/’/g, "'");
      ctx.stage.innerHTML = `<div class="ty"><div class="ty-live" id="tyL"></div><div class="ty-box ${mode === 'code' ? 'is-code' : ''}" id="tyB"><div class="ty-text" id="tyT"></div><textarea class="ty-in" id="tyI" aria-label="Type the text shown" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea><div class="ty-cover" id="tyC">Click or tap here, then start typing</div></div>${by ? `<p class="ty-by">${NG.u.esc(by)}</p>` : ''}</div>`;
      const box = ctx.stage.querySelector('#tyB'), T = ctx.stage.querySelector('#tyT'), inp = ctx.stage.querySelector('#tyI'), cover = ctx.stage.querySelector('#tyC'), live = ctx.stage.querySelector('#tyL');
      T.innerHTML = [...text].map((c) => c === '\n' ? '<span class="nl">&#8629;</span><br>' : `<span>${NG.u.esc(c)}</span>`).join('');
      const spans = [...T.querySelectorAll('span')];
      let started = false, t0 = 0, keys = 0, keyOk = 0, done = false, prevLen = 0, samples = [];
      const focus = () => { inp.focus({ preventScroll: true }); cover.hidden = true; };
      box.addEventListener('pointerdown', (e) => { e.preventDefault(); focus(); });
      inp.addEventListener('blur', () => { if (!done) cover.hidden = false; });
      const correct = () => { let n = 0; const v = inp.value; for (let i = 0; i < v.length; i++) if (v[i] === text[i]) n++; return n; };
      const wpm = () => { const m = Math.max(1 / 60, (performance.now() - t0) / 60000); return correct() / 5 / m; };
      const paintLive = () => { const left = mode === 'time' ? Math.max(0, secs - (started ? (performance.now() - t0) / 1000 : 0)) : null; live.innerHTML = `<span><b>${started ? Math.round(wpm()) : 0}</b> WPM</span><span><b>${keys ? Math.round(keyOk / keys * 100) : 100}%</b> accuracy</span>${left != null ? `<span><b>${Math.ceil(left)}</b>s</span>` : `<span><b>${inp.value.length}</b>/${text.length}</span>`}`; ctx.hud(`<b>${started ? Math.round(wpm()) : 0}</b> WPM`); };
      inp.addEventListener('keydown', (e) => { if (e.key === 'Tab') e.preventDefault(); if (e.key === 'Enter' && mode !== 'code') e.preventDefault(); });
      inp.addEventListener('input', () => {
        if (done) return;
        let v = inp.value;
        if (v.length > text.length) { v = v.slice(0, text.length); inp.value = v; }
        if (!started && v.length) { started = true; t0 = performance.now(); ctx.hideSafe = false; ctx.frame(tick); }
        if (v.length > prevLen) { for (let i = prevLen; i < v.length; i++) { keys++; if (v[i] === text[i]) keyOk++; else ctx.tone(180, .05, 'square', .03); } ctx.noise(.025, .08, 3200, 1.5); }
        prevLen = v.length;
        spans.forEach((s, i) => { s.className = (text[i] === '\n' ? 'nl ' : '') + (i < v.length ? (v[i] === text[i] ? 'ok' : 'no') : '') + (i === v.length ? ' cur' : ''); });
        const c = spans[Math.min(v.length, spans.length - 1)];
        if (c) { const top = c.offsetTop - T.offsetTop; if (top > box.clientHeight * .45) T.style.transform = `translateY(${-(top - box.clientHeight * .3)}px)`; else T.style.transform = ''; }
        paintLive();
        if (v.length >= text.length && mode !== 'time') end();
      });
      function tick(now) { const el = (now - t0) / 1000; if (Math.floor(el) > samples.length) samples.push(Math.round(wpm())); paintLive(); if (mode === 'time' && el >= secs) { end(); return false; } }
      function end() {
        if (done) return; done = true; inp.blur(); inp.disabled = true;
        const el = Math.max(.5, (performance.now() - t0) / 1000);
        const w = Math.round(correct() / 5 / (el / 60));
        const raw = Math.round(inp.value.length / 5 / (el / 60));
        const acc = keys ? Math.round(keyOk / keys * 100) : 0;
        const mean = mode === 'code' ? 28 : mode === 'quote' ? 38 : 41;
        const cons = samples.length > 3 ? Math.max(0, Math.round(100 - (Math.sqrt(avg(samples.map((s) => (s - avg(samples)) ** 2))) / Math.max(1, avg(samples))) * 100)) : null;
        ctx.finish({ score: w, display: w, unit: 'words per minute', pct: NG.u.pctN(w * (acc < 90 ? acc / 95 : 1), mean, 15), feats: w >= 60 && acc >= 90 ? ['wpm60'] : [], stats: [['Accuracy', acc + '%'], ['Raw speed', raw + ' WPM'], ['Characters', `${correct()}/${inp.value.length}`], ['Time', el.toFixed(1) + 's']].concat(cons != null ? [['Consistency', cons + '%']] : []), note: 'Most people type around 40 words per minute. Professional typists often pass 70.' });
      }
      spans[0] && spans[0].classList.add('cur');
      paintLive();
      ctx.later(focus, 60);
    }
  });
})();
