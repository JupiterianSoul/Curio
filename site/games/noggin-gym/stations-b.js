(() => {
  const NG = window.NG = window.NG || {};
  NG.stations = NG.stations || [];
  const add = (s) => NG.stations.push(s);
  const E = 'var(--c-edge)';
  const kb = (k) => `<span class="c-kbd">${k}</span>`;
  const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const PENTA = [0, 2, 4, 7, 9];
  const note = (i) => 261.63 * 2 ** ((PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12);

  function roving(grid, cols) {
    grid.addEventListener('keydown', (e) => {
      const btns = [...grid.querySelectorAll('button:not([disabled])')];
      const all = [...grid.querySelectorAll('button')];
      const i = all.indexOf(document.activeElement);
      if (i < 0) return;
      const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key];
      if (d == null) return;
      e.preventDefault();
      let j = i + d;
      while (j >= 0 && j < all.length && all[j].disabled) j += d;
      if (j >= 0 && j < all.length) all[j].focus();
      else if (btns.length) btns[0].focus();
    });
  }

  add({
    id: 'chimp', name: 'Monkey Bars', test: 'Chimp Test', skill: 'memory', color: '#8d5a3b',
    blurb: 'Remember where the numbers are, then swing through them in order. A chimp called Ayumu is famously great at this.',
    coach: 'Look first, tap later. Number one goes first!',
    how: 'Numbers appear on the grid. Tap them in order from 1. After your first tap the rest turn blank, so remember where they were.',
    quickHow: 'Numbers appear on the grid. Tap 1 first: the rest go blank. Then tap the blanks in order. Two strikes and you are out.',
    keys: `${kb('Arrows')} move, ${kb('Space')} tap`,
    art: `<svg viewBox="0 0 120 90"><path d="M14 84V14M106 84V14" stroke="${E}" stroke-width="5" stroke-linecap="round"/><path d="M10 16h100" stroke="#8d5a3b" stroke-width="8" stroke-linecap="round"/><path d="M10 16h100" stroke="${E}" stroke-width="2" stroke-linecap="round" opacity=".4"/>${[30, 50, 70, 90].map((x, i) => `<path d="M${x} 16v14" stroke="${E}" stroke-width="3"/><rect x="${x - 9}" y="30" width="18" height="18" rx="4" fill="${['#ffd23f', '#fff', '#fff', '#fff'][i]}" stroke="${E}" stroke-width="2.5"/>`).join('')}<text x="30" y="44" text-anchor="middle" font-size="13" font-weight="800" fill="${E}">1</text><path d="M62 66c6-10 22-10 30-2-4 2-10 4-14 10-4-4-10-6-16-8z" fill="#ffd23f" stroke="${E}" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
    modes: [
      { id: 'classic', name: 'Classic', unit: 'numbers', desc: 'Tap 1 and the rest go blank', how: 'Numbers appear on the grid. Tap them in order from 1. After your first tap the rest turn blank, so remember where they were.' },
      { id: 'flash', name: 'Flash', unit: 'numbers', desc: 'They vanish on their own', how: 'The numbers vanish on their own after a moment, a little faster every level. Then tap the blanks in order.' },
      { id: 'reverse', name: 'Reverse', unit: 'numbers', desc: 'Biggest number first', how: 'Start from the biggest number and count down to 1. The others hide after your first tap.' },
      { id: 'blackout', name: 'Blackout', unit: 'numbers', desc: 'Empty cells turn into tiles too', how: 'After your first tap every cell on the grid turns into a tile, empty ones too. Pure recall of positions.' },
      { id: 'letters', name: 'Letters', unit: 'letters', desc: 'A, B, C instead of 1, 2, 3', how: 'Same as Classic with letters. Tap A first, then B, then C.' }
    ],
    options: [{ id: 'lives', label: 'Strikes', choices: [[1, '1'], [3, '3']], def: 3 }, { id: 'start', label: 'Start at', choices: [[4, '4'], [6, '6']], def: 4 }],
    quick: { mode: 'classic', opts: { lives: 2, start: 4 } },
    fmt: (v) => v,
    play(ctx) {
      ctx.hideSafe = true;
      const mode = ctx.mode, lives0 = ctx.quick ? 2 : ctx.opts.lives;
      let n = ctx.quick ? 4 : ctx.opts.start, lives = lives0, best = n - 1, strikes = 0, fastLvl = 0;
      const phone = innerWidth < 600;
      const cols = phone ? 5 : 8, rows = phone ? 7 : 5;
      ctx.stage.innerHTML = `<div class="ch"><div class="ch-info" id="chI"></div><div class="ch-grid" id="chG" style="--cols:${cols}"></div><div class="ch-lives" id="chL"></div></div>`;
      const G = ctx.stage.querySelector('#chG'), info = ctx.stage.querySelector('#chI'), L = ctx.stage.querySelector('#chL');
      roving(G, cols);
      const paintL = () => { L.innerHTML = Array.from({ length: lives0 }, (_, i) => `<i class="${i < lives ? '' : 'gone'}" aria-hidden="true">&#127820;</i>`).join('') + `<span class="sr">${lives} strikes left</span>`; ctx.hud(`<b>${n}</b> to remember`); };
      const label = (i) => mode === 'letters' ? LET[i] : String(i + 1);
      let order = [], step = 0, hidden = false, t0 = 0, flashT = 0;
      function level() {
        G.innerHTML = '';
        const cells = NG.u.shuffle([...Array(cols * rows).keys()], ctx.rng).slice(0, n);
        order = mode === 'reverse' ? cells.slice().reverse() : cells;
        step = 0; hidden = false;
        info.textContent = mode === 'reverse' ? `Start from ${n} and count down` : `Tap ${label(0)} to begin`;
        for (let c = 0; c < cols * rows; c++) {
          const b = document.createElement('button'); b.type = 'button';
          const k = cells.indexOf(c);
          b.className = 'ch-cell' + (k >= 0 ? ' is-num' : '');
          b.textContent = k >= 0 ? label(k) : '';
          b.disabled = k < 0;
          b.dataset.c = c;
          b.setAttribute('aria-label', k >= 0 ? `Tile ${label(k)}` : 'Empty');
          b.style.animationDelay = (k >= 0 ? k * 25 : 0) + 'ms';
          b.addEventListener('click', () => tap(c, b));
          G.append(b);
        }
        paintL();
        t0 = performance.now();
        if (mode === 'flash') flashT = ctx.later(hide, Math.max(450, 2400 - (n - 4) * 160));
        ctx.later(() => G.querySelector(`[data-c="${order[0]}"]`)?.focus({ preventScroll: true }), 40);
      }
      function hide() {
        if (hidden) return; hidden = true; clearTimeout(flashT);
        G.querySelectorAll('.ch-cell').forEach((b) => { if (b.classList.contains('is-num') && !b.classList.contains('is-done')) { b.classList.add('is-hid'); b.setAttribute('aria-label', 'Hidden tile'); } if (mode === 'blackout') { b.disabled = b.classList.contains('is-done'); if (!b.classList.contains('is-num')) b.classList.add('is-hid', 'is-fake'); b.setAttribute('aria-label', 'Hidden tile'); } });
        info.textContent = 'Now from memory';
      }
      function tap(c, b) {
        if (b.classList.contains('is-done')) return;
        const want = order[step];
        if (c === want) {
          if (mode === 'flash' && !hidden) { info.textContent = 'Wait for them to vanish...'; return; }
          b.classList.add('is-done'); b.classList.remove('is-hid'); b.disabled = true;
          if (mode !== 'blackout') b.textContent = '';
          ctx.tone(note(step + 3), .14, 'triangle', .1);
          if (step === 0) hide();
          step++;
          if (step >= order.length) {
            const secs = (performance.now() - t0) / 1000;
            best = Math.max(best, n);
            if (n >= 8 && secs < 3) fastLvl++;
            ctx.snd.good(4); info.textContent = ['Ook ook!', 'Clean!', 'Banana-worthy!', 'Smooth swinging!'][n % 4];
            n++; ctx.later(level, 650);
          }
        } else {
          strikes++; lives--;
          b.classList.add('is-wrong'); ctx.snd.bad(); ctx.buzz([40, 30, 40]);
          G.querySelectorAll('.ch-cell').forEach((x) => { const k = order.indexOf(Number(x.dataset.c)); if (k >= 0 && !x.classList.contains('is-done')) { x.classList.remove('is-hid'); x.classList.add('is-show'); x.textContent = mode === 'reverse' ? label(n - 1 - k) : label(k); } x.disabled = true; });
          paintL();
          if (lives <= 0) { info.textContent = 'Out of strikes!'; ctx.later(end, 1300); }
          else { info.textContent = 'Strike! Same length, new board.'; ctx.later(level, 1400); }
        }
      }
      function end() {
        const mean = mode === 'classic' || mode === 'letters' ? 8 : mode === 'flash' ? 7 : 6.8;
        ctx.finish({ score: best, display: best, unit: mode === 'letters' ? 'letters remembered' : 'numbers remembered', pct: NG.u.pctN(best + (lives0 === 1 ? .5 : 0), mean, 2.4), feats: best >= 9 ? ['chimp9'] : [], stats: [['Strikes used', strikes], ['Grid', `${cols} by ${rows}`], ['Speedy levels', fastLvl]], note: 'Ayumu the chimpanzee could remember 9 numbers flashed for a fraction of a second.' });
      }
      level();
    }
  });

  const NUMK = { digits: { chars: '0123456789', first: '123456789', mean: 7.5, sd: 1.9 }, letters: { chars: 'ABCDEFGHJKLMNPQRSTUVWXYZ', mean: 6.5, sd: 1.6 }, binary: { chars: '01', mean: 12, sd: 3.5 }, back: { chars: '0123456789', first: '123456789', mean: 6, sd: 1.7 } };
  add({
    id: 'number', name: 'Number Weights', test: 'Number Memory', skill: 'memory', color: '#3949ab',
    blurb: 'Lift heavier and heavier numbers. Look, hold it in your head, then type it back. Each rep adds a digit.',
    coach: 'Chunk it! 3, 3 and 4, like a phone number.',
    how: 'A number appears for a few seconds. When it disappears, type it back. Every correct answer adds one more character.',
    quickHow: 'A number flashes up. When it vanishes, type it back. Every rep adds a digit. One mistake and the bar drops.',
    keys: `${kb('0')}-${kb('9')} type, ${kb('Enter')} submit`,
    art: `<svg viewBox="0 0 120 90"><path d="M10 46h100" stroke="#9aa0b5" stroke-width="6" stroke-linecap="round"/><path d="M10 46h100" stroke="${E}" stroke-width="2" stroke-linecap="round" opacity=".5"/><rect x="18" y="20" width="16" height="52" rx="5" fill="#3949ab" stroke="${E}" stroke-width="3"/><rect x="86" y="20" width="16" height="52" rx="5" fill="#3949ab" stroke="${E}" stroke-width="3"/><rect x="36" y="28" width="10" height="36" rx="4" fill="#7986cb" stroke="${E}" stroke-width="3"/><rect x="74" y="28" width="10" height="36" rx="4" fill="#7986cb" stroke="${E}" stroke-width="3"/><rect x="48" y="34" width="24" height="24" rx="6" fill="#fff" stroke="${E}" stroke-width="3"/><text x="60" y="51" text-anchor="middle" font-size="14" font-weight="800" fill="#3949ab">7</text></svg>`,
    modes: [
      { id: 'digits', name: 'Digits', unit: 'digits', desc: 'The classic number span', how: 'A number appears for a few seconds. When it disappears, type it back. Every correct answer adds a digit.' },
      { id: 'back', name: 'Backwards', unit: 'digits', desc: 'Type it in reverse', how: 'Same as Digits, but type the number back to front. 1234 becomes 4321.' },
      { id: 'letters', name: 'Letters', unit: 'letters', desc: 'No numbers to lean on', how: 'A string of capital letters. Letters are harder to chunk than numbers, so expect a lower score.' },
      { id: 'binary', name: 'Binary', unit: 'bits', desc: 'Ones and zeros', how: 'Only ones and zeros, shown in groups of four. Starts at 4 bits. Great practice for chunking.' }
    ],
    options: [{ id: 'show', label: 'Show', choices: [['all', 'All at once'], ['one', 'One by one']], def: 'all' }, { id: 'lives', label: 'Lives', choices: [[1, '1'], [3, '3']], def: 1 }],
    quick: { mode: 'digits', opts: { show: 'all', lives: 1 } },
    fmt: (v) => v,
    play(ctx) {
      const mode = ctx.mode, K = NUMK[mode], show = ctx.quick ? 'all' : ctx.opts.show;
      let len = mode === 'binary' ? 4 : ctx.quick ? 4 : 3, lives = ctx.quick ? 1 : ctx.opts.lives, best = len - 1, target = '', fastest = 99;
      ctx.stage.innerHTML = `<div class="nm"><div class="nm-plate" id="nmP"></div><div class="nm-bar"><i id="nmB"></i></div><form class="nm-form" id="nmF" hidden><label class="sr" for="nmIn">Type what you saw</label><input class="c-input nm-in" id="nmIn" autocomplete="off" autocapitalize="characters" spellcheck="false"><button class="c-btn" type="submit">Lift it</button></form><p class="nm-msg" id="nmM"></p></div>`;
      const plate = ctx.stage.querySelector('#nmP'), barI = ctx.stage.querySelector('#nmB'), form = ctx.stage.querySelector('#nmF'), inp = ctx.stage.querySelector('#nmIn'), msg = ctx.stage.querySelector('#nmM');
      inp.inputMode = mode === 'letters' ? 'text' : 'numeric';
      const make = () => { let s = ''; for (let i = 0; i < len; i++) { const pool = i === 0 && K.first ? K.first : K.chars; let c = pool[Math.floor(ctx.rng() * pool.length)]; if (mode !== 'binary' && i >= 2 && c === s[i - 1] && c === s[i - 2]) c = pool[Math.floor(ctx.rng() * pool.length)]; s += c; } return s; };
      const fmtS = (s) => mode === 'binary' ? s.replace(/(.{4})(?=.)/g, '$1 ') : s;
      const size = () => len > 18 ? 'xs' : len > 12 ? 's' : len > 8 ? 'm' : '';
      let askAt = 0;
      function round() {
        target = make(); form.hidden = true; msg.textContent = '';
        ctx.hud(`<b>${len}</b> ${mode === 'binary' ? 'bits' : mode === 'letters' ? 'letters' : 'digits'} · ${'&#10084;'.repeat(lives)}`);
        plate.className = 'nm-plate ' + size();
        const dur = mode === 'binary' ? 1000 + len * 380 : 1200 + len * 650;
        if (show === 'one') {
          let i = 0; plate.textContent = '';
          const step = () => { if (i >= len) { plate.textContent = ''; ask(); return; } plate.innerHTML = `<span class="nm-one">${target[i]}</span><small>${i + 1}/${len}</small>`; ctx.snd.tick(); i++; ctx.later(step, 750); };
          barI.style.transition = 'none'; barI.style.width = '0'; step();
        } else {
          plate.textContent = fmtS(target);
          barI.style.transition = 'none'; barI.style.width = '100%'; void barI.offsetWidth;
          barI.style.transition = `width ${dur}ms linear`; barI.style.width = '0';
          ctx.later(ask, dur);
        }
      }
      function ask() {
        plate.className = 'nm-plate nm-q'; plate.textContent = mode === 'back' ? 'Type it backwards' : 'What was it?';
        form.hidden = false; inp.value = ''; inp.focus({ preventScroll: true }); askAt = performance.now();
      }
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (form.hidden) return;
        const want = mode === 'back' ? target.split('').reverse().join('') : target;
        const got = inp.value.replace(/\s+/g, '').toUpperCase();
        if (!got) return;
        form.hidden = true;
        const right = got === want;
        plate.className = 'nm-plate nm-check ' + size();
        plate.innerHTML = `<span class="nm-row"><small>Number</small>${fmtS(want).split('').map((c) => `<i>${c}</i>`).join('')}</span><span class="nm-row"><small>You</small>${fmtS(got).split('').map((c, i) => `<i class="${c === fmtS(want)[i] ? 'ok' : 'no'}">${c}</i>`).join('')}</span>`;
        if (right) { const secs = (performance.now() - askAt) / 1000; if (len >= 8) fastest = Math.min(fastest, secs); best = Math.max(best, len); len++; ctx.snd.clang(); msg.textContent = 'Lifted! One more digit on the bar.'; ctx.later(round, 1300); }
        else { lives--; ctx.snd.bad(); ctx.buzz([40, 30, 40]); if (lives > 0) { msg.textContent = 'Dropped it. Same weight again.'; ctx.later(round, 1700); } else { msg.textContent = 'The bar wins this time.'; ctx.later(end, 1600); } }
      });
      function end() {
        ctx.finish({ score: best, display: best, unit: `${mode === 'binary' ? 'bits' : mode === 'letters' ? 'letters' : 'digits'} remembered`, pct: NG.u.pctN(best, K.mean, K.sd), feats: mode === 'digits' && best >= 10 ? ['num10'] : [], stats: [['Show', show === 'one' ? 'One by one' : 'All at once'], ['Longest', best]].concat(fastest < 99 ? [['Quick answer', fastest.toFixed(1) + 's']] : []), note: 'Most people can hold about 7 digits, give or take two. Chunking into groups helps a lot.' });
      }
      ctx.later(round, 300);
    }
  });

  add({
    id: 'verbal', name: 'Word Locker', test: 'Verbal Memory', skill: 'memory', color: '#6a1b9a',
    blurb: 'Words come out of the locker one at a time. Have you seen this one before, or is it new? Easy at first.',
    coach: 'Seen it, or new? Trust your gut.',
    how: 'Words appear one at a time. If you have seen the word earlier in this game, press SEEN. If not, press NEW. Three mistakes and you are done.',
    quickHow: 'Words appear one at a time. Seen it earlier in this round? Press SEEN. Brand new? Press NEW. 35 seconds on the clock.',
    keys: `${kb('S')} or ${kb('Left')} seen · ${kb('N')} or ${kb('Right')} new`,
    art: `<svg viewBox="0 0 120 90"><rect x="22" y="6" width="34" height="78" rx="4" fill="#9c4dcc" stroke="${E}" stroke-width="3"/><rect x="64" y="6" width="34" height="78" rx="4" fill="#6a1b9a" stroke="${E}" stroke-width="3"/>${[16, 22, 28].map((y) => `<path d="M30 ${y}h18M72 ${y}h18" stroke="${E}" stroke-width="2.5" stroke-linecap="round"/>`).join('')}<circle cx="50" cy="50" r="3" fill="${E}"/><circle cx="92" cy="50" r="3" fill="${E}"/><rect x="8" y="56" width="58" height="22" rx="6" fill="#fff" stroke="${E}" stroke-width="3" transform="rotate(-8 37 67)"/><text x="37" y="72" text-anchor="middle" font-size="13" font-weight="800" fill="#6a1b9a" transform="rotate(-8 37 67)">word</text></svg>`,
    modes: [
      { id: 'classic', name: 'Classic', unit: 'points', desc: 'Three lives', how: 'Words appear one at a time. Seen it earlier this game? Press SEEN. New? Press NEW. Three mistakes and you are done.' },
      { id: 'sudden', name: 'Sudden death', unit: 'points', desc: 'One mistake ends it', how: 'Same rules, one life. Walk the tightrope.' },
      { id: 'sprint', name: 'Sprint', unit: 'points', desc: '60 seconds, mistakes cost 3s', how: 'As many right answers as you can in 60 seconds. Every mistake knocks 3 seconds off the clock.' }
    ],
    options: [{ id: 'deck', label: 'Deck', choices: [['words', 'Words'], ['emoji', 'Emoji'], ['numbers', 'Numbers']], def: 'words' }],
    quick: { mode: 'sprint', opts: { deck: 'words' } },
    fmt: (v) => v,
    play(ctx) {
      const mode = ctx.mode, deck = ctx.quick ? 'words' : ctx.opts.deck;
      ctx.hideSafe = mode !== 'sprint';
      const W = NG.u.shuffle(window.NG_WORDS || [], ctx.rng), EM = NG.u.shuffle(window.NG_EMOJI || [], ctx.rng);
      let unseen = deck === 'emoji' ? EM.slice() : W.slice(), seen = [], seenSet = new Set(), cur = '', last = '', shown = 0;
      let score = 0, lives = mode === 'sudden' ? 1 : 3, streak = 0, bestStreak = 0, wrong = 0;
      const DUR = ctx.quick ? 35 : 60;
      let timeLeft = DUR, lastT = 0, started = false;
      ctx.stage.innerHTML = `<div class="vb"><div class="vb-meta" id="vbM"></div><div class="vb-card" id="vbC"><span class="vb-word" id="vbW"></span></div><div class="vb-btns"><button type="button" class="vb-b vb-seen" id="vbS"><b>SEEN</b><small>S or Left</small></button><button type="button" class="vb-b vb-new" id="vbN"><b>NEW</b><small>N or Right</small></button></div><div class="cs-bar" ${mode === 'sprint' ? '' : 'hidden'}><i id="vbBar"></i></div></div>`;
      const card = ctx.stage.querySelector('#vbC'), wEl = ctx.stage.querySelector('#vbW'), meta = ctx.stage.querySelector('#vbM'), barI = ctx.stage.querySelector('#vbBar');
      const makeNum = () => { const d = Math.min(7, 3 + Math.floor(shown / 20)); for (let k = 0; k < 50; k++) { let s = String(1 + Math.floor(ctx.rng() * 9)); for (let i = 1; i < d; i++) s += Math.floor(ctx.rng() * 10); if (!seenSet.has(s)) return s; } return String(Math.floor(ctx.rng() * 1e9)); };
      function next() {
        const pSeen = seen.length < 3 ? .12 : Math.min(.55, .35 + seen.length / 300);
        const choices = seen.filter((w) => w !== last);
        let w;
        const canNew = deck === 'numbers' || unseen.length;
        if ((ctx.rng() < pSeen && choices.length) || !canNew) w = choices.length ? choices[Math.floor(ctx.rng() * choices.length)] : seen[0];
        else w = deck === 'numbers' ? makeNum() : unseen.pop();
        cur = w; last = w; shown++;
        wEl.textContent = w; wEl.className = 'vb-word' + (deck === 'emoji' ? ' is-emoji' : '') + (w.length > 10 ? ' is-long' : '');
        card.classList.remove('is-in'); void card.offsetWidth; card.classList.add('is-in');
        paint();
      }
      const paint = () => {
        meta.innerHTML = `<span><b>${score}</b> score</span><span>${mode === 'sprint' ? `<b>${Math.max(0, Math.ceil(timeLeft))}</b>s` : Array.from({ length: mode === 'sudden' ? 1 : 3 }, (_, i) => `<i class="${i < lives ? '' : 'gone'}">&#10084;</i>`).join('')}</span><span class="${streak >= 10 ? 'hot' : ''}">streak <b>${streak}</b></span>`;
        ctx.hud(`<b>${score}</b> pts`);
      };
      function answer(saidSeen) {
        if (lives <= 0 || timeLeft <= 0) return;
        if (mode === 'sprint' && !started) { started = true; lastT = performance.now(); ctx.frame(tick); }
        const was = seenSet.has(cur);
        const ok = was === saidSeen;
        if (!was) { seenSet.add(cur); seen.push(cur); }
        card.classList.remove('is-ok', 'is-no'); void card.offsetWidth; card.classList.add(ok ? 'is-ok' : 'is-no');
        if (ok) { score++; streak++; bestStreak = Math.max(bestStreak, streak); ctx.snd.good(Math.min(6, Math.floor(streak / 5))); }
        else { wrong++; streak = 0; ctx.snd.bad(); ctx.buzz(40); if (mode === 'sprint') timeLeft -= 3; else lives--; }
        if (lives <= 0) { paint(); ctx.later(end, 500); return; }
        next();
      }
      function tick(now) { timeLeft -= (now - lastT) / 1000; lastT = now; barI.style.width = Math.max(0, timeLeft / DUR * 100) + '%'; paint(); if (timeLeft <= 0) { end(); return false; } }
      function end() {
        let pct;
        if (mode === 'classic') pct = NG.u.pctL(Math.max(1, score), 42, .5);
        else if (mode === 'sudden') pct = NG.u.pctL(Math.max(1, score), 16, .65);
        else pct = NG.u.pctN(score * 60 / DUR, 30, 9);
        if (deck === 'emoji') pct = Math.max(1, pct - 6);
        if (deck === 'numbers') pct = Math.min(99, pct + 8);
        ctx.finish({ score, display: score, unit: 'words remembered', pct, feats: score >= 50 ? ['verbal50'] : [], stats: [['Best streak', bestStreak], ['Mistakes', wrong], ['Cards shown', shown], ['Deck', deck]], note: 'Recognising something you have seen is much easier than recalling it from scratch.' });
      }
      ctx.stage.querySelector('#vbS').addEventListener('click', () => answer(true));
      ctx.stage.querySelector('#vbN').addEventListener('click', () => answer(false));
      ctx.onKey((e) => { const k = e.key.toLowerCase(); if (e.repeat) return true; if (k === 's' || k === 'arrowleft') { e.preventDefault(); answer(true); return true; } if (k === 'n' || k === 'arrowright') { e.preventDefault(); answer(false); return true; } });
      next();
    }
  });

  add({
    id: 'visual', name: 'Tile Mats', test: 'Visual Memory', skill: 'memory', color: '#1e88e5',
    blurb: 'Tiles on the mat light up for a moment. Step on the same ones. The mat grows and the pattern gets bigger every level.',
    coach: 'Take a mental photo. Click!',
    how: 'Some tiles flash. When they go dark, tap the ones that lit up. Three wrong tiles in a level costs a life.',
    quickHow: 'Some tiles flash. When they go dark, tap the ones that lit up. Three wrong tiles costs your only life.',
    keys: `${kb('Arrows')} move, ${kb('Space')} or ${kb('Enter')} tap`,
    art: `<svg viewBox="0 0 120 90"><path d="M10 72l18-58h64l18 58z" fill="#0d47a1" stroke="${E}" stroke-width="3" stroke-linejoin="round"/><g stroke="#5e9de6" stroke-width="2.5"><path d="M24 30h72M18 50h84M50 14l-6 58M70 14l6 58"/></g><path d="M52 32h17l3 16H50z" fill="#fff"/><path d="M30 52h18l-2 18H26z" fill="#fff"/><path d="M74 14h14l4 14H76z" fill="#fff"/></svg>`,
    modes: [
      { id: 'classic', name: 'Classic', unit: 'levels', desc: 'Remember the lit tiles', how: 'Some tiles flash. When they go dark, tap all the ones that lit up, in any order. Three wrong tiles in a level costs a life.' },
      { id: 'sequence', name: 'Sequence', unit: 'levels', desc: 'Same tiles, in order', how: 'Tiles light up one at a time. Tap them back in the same order. Order matters now.' },
      { id: 'mirror', name: 'Mirror', unit: 'levels', desc: 'Tap the reflection', how: 'Tap the mirror image of the pattern, as if the board were flipped left to right.' }
    ],
    options: [{ id: 'speed', label: 'Flash time', choices: [['relaxed', 'Relaxed'], ['normal', 'Normal'], ['blitz', 'Blitz']], def: 'normal' }, { id: 'lives', label: 'Lives', choices: [[1, '1'], [3, '3']], def: 3 }],
    quick: { mode: 'classic', opts: { speed: 'normal', lives: 1 } },
    fmt: (v) => v,
    play(ctx) {
      ctx.hideSafe = true;
      const mode = ctx.mode, k = { relaxed: 1.6, normal: 1, blitz: .55 }[ctx.quick ? 'normal' : ctx.opts.speed];
      const lives0 = ctx.quick ? 1 : ctx.opts.lives;
      let level = 1, lives = lives0, misses = 0, best = 0, pattern = [], found = new Set(), seqPos = 0, phase = 'show', perfect = 0;
      const sizeFor = (lv) => mode === 'sequence' ? (lv <= 3 ? 3 : lv <= 7 ? 4 : lv <= 12 ? 5 : 6) : (lv <= 2 ? 3 : lv <= 4 ? 4 : lv <= 7 ? 5 : lv <= 11 ? 6 : 7);
      const countFor = (lv) => mode === 'sequence' ? Math.min(lv + 2, sizeFor(lv) ** 2) : Math.min(lv + 2, Math.floor(sizeFor(lv) ** 2 * .62));
      ctx.stage.innerHTML = `<div class="vm"><div class="vm-msg" id="vmM"></div><div class="vm-grid" id="vmG"></div><div class="ch-lives" id="vmL"></div></div>`;
      const G = ctx.stage.querySelector('#vmG'), msg = ctx.stage.querySelector('#vmM'), L = ctx.stage.querySelector('#vmL');
      let n = 3;
      const paint = () => { L.innerHTML = Array.from({ length: lives0 }, (_, i) => `<i class="${i < lives ? '' : 'gone'}">&#10084;</i>`).join('') + `<span class="vm-miss">${'x'.repeat(misses)}${'.'.repeat(3 - misses)}</span>`; ctx.hud(`level <b>${level}</b>`); };
      function start() {
        n = sizeFor(level); const cnt = countFor(level);
        G.style.setProperty('--n', n); G.innerHTML = '';
        for (let i = 0; i < n * n; i++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'vm-t'; b.disabled = true; b.setAttribute('aria-label', `Tile ${Math.floor(i / n) + 1}, ${i % n + 1}`); b.addEventListener('click', () => tap(i, b)); G.append(b); }
        pattern = NG.u.shuffle([...Array(n * n).keys()], ctx.rng).slice(0, cnt);
        found = new Set(); seqPos = 0; misses = 0; phase = 'show'; paint();
        msg.textContent = mode === 'sequence' ? 'Watch the order...' : 'Remember these...';
        const tiles = [...G.children];
        if (mode === 'sequence') {
          pattern.forEach((p, i) => { ctx.later(() => { tiles[p].classList.add('is-lit'); ctx.tone(note(i + 4), .2, 'sine', .1); ctx.later(() => tiles[p].classList.remove('is-lit'), 420 * k); }, 600 + i * 600 * k); });
          ctx.later(go, 600 + pattern.length * 600 * k + 200);
        } else {
          ctx.later(() => { pattern.forEach((p) => tiles[p].classList.add('is-lit')); ctx.snd.swish(); }, 500);
          ctx.later(() => { pattern.forEach((p) => tiles[p].classList.remove('is-lit')); go(); }, 500 + (1000 + cnt * 60) * k);
        }
      }
      function go() {
        phase = 'input'; msg.textContent = mode === 'mirror' ? 'Now tap the mirror image' : mode === 'sequence' ? 'Your turn, in order' : 'Your turn';
        [...G.children].forEach((b) => { b.disabled = false; });
        G.children[0].focus({ preventScroll: true });
      }
      const goal = (p) => mode === 'mirror' ? Math.floor(p / n) * n + (n - 1 - p % n) : p;
      function tap(i, b) {
        if (phase !== 'input' || b.classList.contains('is-ok')) return;
        const targets = pattern.map(goal);
        const ok = mode === 'sequence' ? targets[seqPos] === i : targets.includes(i) && !found.has(i);
        if (ok) {
          found.add(i); seqPos++; b.classList.add('is-ok'); b.disabled = true;
          ctx.tone(note(found.size + 3), .12, 'triangle', .09);
          if (found.size >= pattern.length) { phase = 'done'; best = Math.max(best, level); if (misses === 0) perfect++; ctx.snd.good(5); msg.textContent = misses ? 'Level clear!' : 'Flawless!'; level++; ctx.later(start, 800); }
        } else {
          misses++; b.classList.add('is-bad'); ctx.snd.bad(); ctx.buzz(40); paint();
          if (mode === 'sequence') ctx.later(() => b.classList.remove('is-bad'), 400); else b.disabled = true;
          if (misses >= 3) {
            phase = 'done'; lives--; paint();
            [...G.children].forEach((x, j) => { x.disabled = true; if (targets.includes(j) && !found.has(j)) x.classList.add('is-show'); });
            if (lives <= 0) { msg.textContent = 'Out of lives!'; ctx.later(end, 1300); }
            else { msg.textContent = 'Three misses. Lost a life, try that level again.'; ctx.later(start, 1500); }
          }
        }
      }
      function end() {
        const mean = mode === 'classic' ? 9 : mode === 'sequence' ? 7.5 : 6.5;
        ctx.finish({ score: best, display: best, unit: 'levels cleared', pct: NG.u.pctN(best + (lives0 === 1 ? .7 : 0), mean, 3), feats: mode === 'classic' && best >= 12 ? ['visual12'] : [], stats: [['Flawless levels', perfect], ['Biggest mat', `${n} by ${n}`], ['Flash time', { 1.6: 'Relaxed', 1: 'Normal', .55: 'Blitz' }[k]]] });
      }
      G.addEventListener('keydown', (e) => {
        const all = [...G.children]; const i = all.indexOf(document.activeElement); if (i < 0) return;
        const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -n, ArrowDown: n }[e.key]; if (d == null) return;
        e.preventDefault(); e.stopPropagation(); const j = i + d; if (j >= 0 && j < all.length) all[j].focus();
      }, true);
      start();
    }
  });

  const CLASSIC4 = [{ c: '#22c55e', f: 415.3 }, { c: '#ef4444', f: 311.1 }, { c: '#eab308', f: 247 }, { c: '#3b82f6', f: 207.7 }];
  const PAL = ['#ef476f', '#ff8c42', '#ffc233', '#8ac926', '#06d6a0', '#1b9aaa', '#4361ee', '#9b5de5', '#f15bb5', '#ff595e', '#2ec4b6', '#e9c46a', '#90be6d', '#577590', '#c77dff', '#f4a261'];
  const KEYS = { classic: ['q', 'w', 'a', 's'], g3: ['q', 'w', 'e', 'a', 's', 'd', 'z', 'x', 'c'], g4: ['1', '2', '3', '4', 'q', 'w', 'e', 'r', 'a', 's', 'd', 'f', 'z', 'x', 'c', 'v'] };
  add({
    id: 'sequence', name: 'Echo Pads', test: 'Sequence Memory', skill: 'memory', color: '#43a047',
    blurb: 'Drum pads light up and sing a tune. Echo it back. Every round the tune grows by one note.',
    coach: 'Listen and watch. Then play it back like a rock star.',
    how: 'Watch the pads light up, then tap them back in the same order. Each level adds one more step.',
    quickHow: 'Watch the pads light up, then tap them in the same order. Every level adds a step. One slip ends it.',
    keys: `Keys ${kb('Q')} ${kb('W')} ${kb('E')} / ${kb('A')} ${kb('S')} ${kb('D')} / ${kb('Z')} ${kb('X')} ${kb('C')} on the 3 by 3 pads`,
    art: `<svg viewBox="0 0 120 90"><ellipse cx="60" cy="74" rx="50" ry="10" fill="var(--c-shade)"/>${[['#22c55e', 22, 14], ['#ef4444', 62, 14], ['#eab308', 22, 46], ['#3b82f6', 62, 46]].map(([c, x, y], i) => `<rect x="${x}" y="${y}" width="36" height="28" rx="8" fill="${c}" stroke="${E}" stroke-width="3" ${i === 1 ? 'opacity="1"' : 'opacity=".75"'}/>`).join('')}<path d="M70 20h18" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/><path d="M104 10l6-6M108 22h8" stroke="${E}" stroke-width="3" stroke-linecap="round"/></svg>`,
    modes: [
      { id: 'normal', name: 'Normal', unit: 'levels', desc: 'Grows by one each round', how: 'Watch the pads, then tap them back in the same order. Each level adds one more step to the same tune.' },
      { id: 'reverse', name: 'Reverse', unit: 'levels', desc: 'Play it backwards', how: 'Play the tune back to front: the last pad first.' },
      { id: 'speed', name: 'Speed', unit: 'levels', desc: 'Fast flashes, quick fingers', how: 'Faster flashes, and you have 2 seconds per tap before the pads time out.' },
      { id: 'chaos', name: 'Chaos', unit: 'levels', desc: 'A brand new tune each level', how: 'Every level is a completely new random tune, one step longer than before. No building on the last one.' }
    ],
    options: [{ id: 'pads', label: 'Pads', choices: [['classic', '4 pads'], ['g3', '3 by 3'], ['g4', '4 by 4']], def: 'g3' }, { id: 'chance', label: 'Second chance', choices: [[1, 'Off'], [2, 'On']], def: 1 }],
    quick: { mode: 'normal', opts: { pads: 'g3', chance: 1 } },
    fmt: (v) => v,
    play(ctx) {
      ctx.hideSafe = ctx.mode !== 'speed';
      const mode = ctx.mode, layout = ctx.quick ? 'g3' : ctx.opts.pads, N = { classic: 4, g3: 9, g4: 16 }[layout], cols = layout === 'g4' ? 4 : layout === 'g3' ? 3 : 2;
      let lives = ctx.quick ? 1 : ctx.opts.chance, seq = [], pos = 0, state = 'show', best = 0, deadline = 0;
      ctx.stage.innerHTML = `<div class="sq"><div class="vm-msg" id="sqM">Watch...</div><div class="sq-board sq-${layout}" id="sqB" style="--cols:${cols}"></div><div class="cs-bar" ${mode === 'speed' ? '' : 'hidden'}><i id="sqT"></i></div></div>`;
      const B = ctx.stage.querySelector('#sqB'), msg = ctx.stage.querySelector('#sqM'), tbar = ctx.stage.querySelector('#sqT');
      const col = (i) => layout === 'classic' ? CLASSIC4[i].c : PAL[i % PAL.length];
      const freq = (i) => layout === 'classic' ? CLASSIC4[i].f * 2 : note(i);
      for (let i = 0; i < N; i++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'sq-pad'; b.style.setProperty('--pc', col(i)); b.setAttribute('aria-label', `Pad ${i + 1}, key ${KEYS[layout][i].toUpperCase()}`); b.innerHTML = `<kbd>${KEYS[layout][i].toUpperCase()}</kbd>`; b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(i); }); b.addEventListener('click', (e) => { if (e.detail === 0) press(i); }); B.append(b); }
      roving(B, cols);
      const pads = [...B.children];
      const flash = (i, ms) => { pads[i].classList.add('is-lit'); ctx.tone(freq(i), Math.max(.18, ms / 1000), 'triangle', .14); ctx.tone(freq(i) * 2, Math.max(.12, ms / 1500), 'sine', .04); ctx.later(() => pads[i].classList.remove('is-lit'), ms); };
      const pick = () => Math.floor(ctx.rng() * N);
      function level() {
        if (mode === 'chaos') { const L = seq.length + 1; seq = Array.from({ length: L }, pick); }
        else seq.push(pick());
        pos = 0; state = 'show'; B.classList.add('is-show'); msg.textContent = 'Watch...';
        ctx.hud(`level <b>${seq.length}</b>`);
        const on = mode === 'speed' ? Math.max(160, 300 - seq.length * 8) : Math.max(260, 480 - seq.length * 10), gap = mode === 'speed' ? 90 : 170;
        seq.forEach((p, i) => ctx.later(() => flash(p, on), 500 + i * (on + gap)));
        ctx.later(() => { state = 'input'; B.classList.remove('is-show'); msg.textContent = mode === 'reverse' ? 'Your turn, backwards!' : 'Your turn!'; if (mode === 'speed') arm(); }, 500 + seq.length * (on + gap));
      }
      function arm() { deadline = performance.now() + 2000; ctx.frame(() => { if (state !== 'input') return false; const left = deadline - performance.now(); tbar.style.width = Math.max(0, left / 2000 * 100) + '%'; if (left <= 0) { fail(); return false; } }); }
      function press(i) {
        if (state !== 'input') return;
        const want = mode === 'reverse' ? seq[seq.length - 1 - pos] : seq[pos];
        if (i === want) {
          flash(i, 200); pos++;
          if (mode === 'speed') deadline = performance.now() + 2000;
          if (pos >= seq.length) { state = 'wait'; best = seq.length; msg.textContent = ['Nice echo!', 'Rock star!', 'Encore!', 'Perfect pitch!'][seq.length % 4]; ctx.later(level, 700); }
        } else fail(i);
      }
      function fail(i) {
        state = 'wait'; ctx.snd.bad(); ctx.buzz([40, 30, 40]);
        if (i != null) { pads[i].classList.add('is-bad'); ctx.later(() => pads[i].classList.remove('is-bad'), 500); }
        lives--;
        if (lives > 0) { msg.textContent = 'Oops! Second chance: watch again.'; pos = 0; ctx.later(() => { state = 'show'; B.classList.add('is-show'); const on = 420; seq.forEach((p, k) => ctx.later(() => flash(p, on), 400 + k * (on + 170))); ctx.later(() => { state = 'input'; B.classList.remove('is-show'); msg.textContent = 'Your turn!'; if (mode === 'speed') arm(); }, 400 + seq.length * 590); }, 900); return; }
        msg.textContent = 'The tune got away!';
        ctx.later(() => {
          const mean = mode === 'normal' ? 9 : mode === 'speed' ? 8 : mode === 'reverse' ? 7 : 6;
          ctx.finish({ score: best, display: best, unit: 'steps remembered', pct: NG.u.pctN(best, mean + (layout === 'classic' ? 1 : layout === 'g4' ? -1 : 0), 3), feats: best >= 12 && mode === 'normal' ? ['seq12'] : [], stats: [['Pads', N], ['Longest tune', best]] });
        }, 1100);
      }
      ctx.onKey((e) => { const idx = KEYS[layout].indexOf(e.key.toLowerCase()); if (idx >= 0) { e.preventDefault(); if (!e.repeat) press(idx); return true; } });
      ctx.later(level, 400);
    }
  });
})();
