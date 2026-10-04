(() => {
  const C = window.Curio;
  const A = window.CX_ART;
  const GAMES = window.CX_GAMES;
  const adv = C.advanced;
  const $ = (s) => document.querySelector(s);
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  const ROUNDS = adv ? Infinity : 10;
  const LIVES = 4;
  const POOL = GAMES.filter((g) => !g.boss && (adv || g.simple));
  const BOSS = GAMES.find((g) => g.boss);

  const els = {
    wrap: $('#wrap'), stage: $('#stage'), scene: $('#scene'), intro: $('#intro'), end: $('#end'), hud: $('#hud'), board: document.querySelector('.cx-board'),
    banner: $('#banner'), splash: $('#splash'), ready: $('#ready'), timer: $('#timer'), yarn: $('#yarn'), lives: $('#lives')
  };

  let run = null;
  let cur = null;
  let raf = 0, last = 0;

  const head = (on) => `<svg viewBox="-36 -136 72 64" class="${on ? '' : 'is-gone'}" aria-hidden="true"><path d="M-27 -104L-24 -134L-4 -118ZM27 -104L24 -134L4 -118Z" fill="#f4a259" stroke="#3a2418" stroke-width="3" stroke-linejoin="round"/><circle cx="0" cy="-102" r="26" fill="#f4a259" stroke="#3a2418" stroke-width="3"/><ellipse cx="-9" cy="-104" rx="3.5" ry="5" fill="#3a2418"/><ellipse cx="9" cy="-104" rx="3.5" ry="5" fill="#3a2418"/><path d="M-3 -95h6l-3 3z" fill="#ff7aa2"/></svg>`;

  function sound(kind) {
    if (C.muted) return;
    const ac = C.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    const tone = (f, d, type = 'sine', v = 0.1, when = 0, to = 0) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t + when);
      if (to) o.frequency.exponentialRampToValueAtTime(to, t + when + d);
      g.gain.setValueAtTime(0.0001, t + when); g.gain.exponentialRampToValueAtTime(v, t + when + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + when + d);
      o.connect(g).connect(ac.destination); o.start(t + when); o.stop(t + when + d + 0.05);
    };
    const noise = (d, v, f, type = 'bandpass', when = 0, to = 0, q = 1) => {
      const len = Math.max(1, Math.floor(ac.sampleRate * d));
      const b = ac.createBuffer(1, len, ac.sampleRate); const ch = b.getChannelData(0);
      for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
      const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = b; fl.type = type; fl.frequency.setValueAtTime(f, t + when); fl.Q.value = q;
      if (to) fl.frequency.exponentialRampToValueAtTime(to, t + when + d);
      g.gain.setValueAtTime(v, t + when); g.gain.exponentialRampToValueAtTime(0.0001, t + when + d);
      s.connect(fl).connect(g).connect(ac.destination); s.start(t + when); s.stop(t + when + d + 0.02);
    };
    const meow = (base = 520, when = 0, len = 0.42) => {
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(base, t + when);
      o.frequency.linearRampToValueAtTime(base * 1.55, t + when + len * 0.35);
      o.frequency.linearRampToValueAtTime(base * 0.9, t + when + len);
      f.type = 'bandpass'; f.Q.value = 3;
      f.frequency.setValueAtTime(700, t + when); f.frequency.linearRampToValueAtTime(1600, t + when + len * 0.4); f.frequency.linearRampToValueAtTime(900, t + when + len);
      g.gain.setValueAtTime(0.0001, t + when); g.gain.exponentialRampToValueAtTime(0.12, t + when + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + when + len);
      o.connect(f).connect(g).connect(ac.destination); o.start(t + when); o.stop(t + when + len + 0.05);
    };
    switch (kind) {
      case 'meow': meow(480 + Math.random() * 160, 0, 0.3); break;
      case 'win': meow(600, 0, 0.35); tone(1046, 0.18, 'triangle', 0.06, 0.3); tone(1318, 0.3, 'triangle', 0.06, 0.4); break;
      case 'lose': noise(0.5, 0.25, 5000, 'highpass', 0, 0, 0.7); tone(140, 0.3, 'square', 0.03, 0.05, 90); break;
      case 'hiss': noise(0.35, 0.2, 4500, 'highpass'); break;
      case 'purr': for (let i = 0; i < 8; i++) noise(0.06, 0.18, 140, 'lowpass', i * 0.07); break;
      case 'pop': tone(420, 0.1, 'sine', 0.12, 0, 1000); break;
      case 'tap': noise(0.04, 0.25, 2200, 'bandpass', 0, 0, 1.5); tone(500, 0.05, 'triangle', 0.06); break;
      case 'crash': noise(0.5, 0.35, 3000, 'highpass', 0.05); for (let i = 0; i < 5; i++) tone(2000 + Math.random() * 2500, 0.15, 'triangle', 0.04, 0.05 + i * 0.03); break;
      case 'miss': tone(220, 0.08, 'sine', 0.06, 0, 160); break;
      case 'lick': noise(0.08, 0.15, 3500, 'bandpass', 0, 1800, 2); break;
      case 'knead': tone(110, 0.09, 'sine', 0.18, 0, 70); noise(0.05, 0.08, 500, 'lowpass'); break;
      case 'swish': noise(0.22, 0.18, 600, 'bandpass', 0, 3500); break;
      case 'slide': noise(0.12, 0.08, 1800, 'bandpass', 0, 900); break;
      case 'splash': noise(0.35, 0.22, 900, 'lowpass', 0, 200); tone(600, 0.1, 'sine', 0.05, 0, 1200); break;
      case 'vroom': tone(70, 0.18, 'sawtooth', 0.025, 0, 85); break;
      case 'tick': tone(1500, 0.03, 'square', 0.03); break;
      case 'go': tone(660, 0.08, 'triangle', 0.08); tone(990, 0.12, 'triangle', 0.08, 0.08); break;
    }
  }

  function showPanel(which) {
    els.intro.hidden = which !== 'intro';
    els.end.hidden = which !== 'end';
    els.wrap.classList.toggle('is-panel', which !== null);
    els.hud.hidden = which === 'intro';
    els.board.classList.toggle('is-playing', which === null);
  }

  function setupIntro() {
    $('#introCat').innerHTML = A.cat('happy');
    $('#introTitle').textContent = adv ? 'The Grand Exam' : 'Entrance exam';
    $('#introText').textContent = adv
      ? `${POOL.length} tests in endless rotation, faster every five, with a vacuum cleaner boss every ten. Four lives. How long can you stay a cat?`
      : `Ten quick tests. Each one lasts a few seconds. Lose four and you are probably a dog. Read the big words, then act.`;
    const b = C.getBest(`passed:${C.mode}`);
    $('#introBest').textContent = b != null ? `Best: ${b} test${b === 1 ? '' : 's'} passed` : '';
    showPanel('intro');
    paintLives(LIVES);
    els.scene.innerHTML = A.room('#ffe3c7', '#e8b98a');
  }

  function paintLives(n, popAt = -1) {
    els.lives.innerHTML = Array.from({ length: LIVES }, (_, i) => head(i < n)).join('');
    if (popAt >= 0) els.lives.children[popAt]?.classList.add('is-pop');
    els.lives.setAttribute('aria-label', `${n} lives left`);
  }

  function hud() {
    $('#round').textContent = adv ? String(run.round + 1) : `${Math.min(run.round + 1, ROUNDS)}/${ROUNDS}`;
    $('#score').textContent = run.passed;
    $('#speed').textContent = `x${run.sf.toFixed(2)}`;
  }

  function start() {
    run = { round: 0, lives: LIVES, passed: 0, sf: 1, bag: [], history: [] };
    showPanel(null);
    paintLives(LIVES);
    hud();
    C.sfx('open');
    const top = els.board.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 0) - 8;
    window.scrollTo({ top, behavior: C.calm ? 'auto' : 'smooth' });
    setTimeout(nextRound, 150);
  }

  function draw() {
    if (adv && run.round > 0 && (run.round + 1) % 10 === 0) return BOSS;
    if (!run.bag.length) run.bag = C.shuffle(POOL);
    let g = run.bag.pop();
    if (run.history.length && run.history[run.history.length - 1] === g.id && run.bag.length) { run.bag.unshift(g); g = run.bag.pop(); }
    return g;
  }

  function nextRound() {
    if (run.lives <= 0 || run.round >= ROUNDS) return finish();
    const newSf = adv ? Math.pow(1.12, Math.floor(run.round / 5)) : 1;
    const faster = newSf > run.sf;
    run.sf = newSf;
    hud();
    const g = draw();
    run.history.push(g.id);
    const rd = els.ready;
    rd.classList.toggle('is-boss', !!g.boss);
    $('#readyBig').textContent = g.boss ? 'Boss test!' : faster ? 'Faster!' : `Test ${run.round + 1}`;
    $('#readySmall').textContent = g.boss ? 'Something loud is coming' : `${run.lives} ${run.lives === 1 ? 'life' : 'lives'} left`;
    rd.classList.add('is-on');
    els.banner.className = 'cx-banner';
    sound(g.boss ? 'vroom' : 'tick');
    setTimeout(() => { rd.classList.remove('is-on'); begin(g); }, faster || g.boss ? 1100 : 700);
  }

  function begin(g) {
    els.scene.innerHTML = '';
    const sf = run.sf;
    const base = g.dur * (adv ? Math.max(0.62, Math.pow(1 / sf, 0.7)) : 1.12);
    const api = {
      sf, simple: !adv,
      shuffle: C.shuffle,
      set(html) { els.scene.innerHTML = html; },
      q(sel) { return els.scene.querySelector(sel); },
      sound,
      win(msg) { settle('win', msg); },
      lose(msg) { settle('lose', msg); }
    };
    cur = { g, h: null, t: 0, dur: base, outcome: null, msg: '', holdT: 0, started: false };
    cur.h = g.make(api) || {};
    $('#bannerSay').textContent = g.say;
    $('#bannerHint').textContent = g.hint;
    els.banner.className = 'cx-banner';
    void els.banner.offsetWidth;
    els.banner.classList.add('is-big');
    sound('go');
    els.timer.style.transform = 'scaleX(1)';
    els.yarn.style.left = '100%';
    cur.startAt = performance.now() + (C.calm ? 500 : 800);
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  }

  function settle(outcome, msg) {
    if (!cur || cur.outcome) return;
    cur.outcome = outcome;
    cur.msg = msg || (outcome === 'win' ? cur.g.winText : cur.g.loseText) || (outcome === 'win' ? 'Very cat.' : 'Not very cat.');
    cur.holdT = 0;
  }

  function loop(now) {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    if (!cur) return;
    if (document.hidden) { raf = requestAnimationFrame(loop); return; }
    if (now >= cur.startAt) {
      if (!cur.started) { cur.started = true; els.banner.classList.remove('is-big'); els.banner.classList.add('is-top'); }
      cur.t += dt;
      try { cur.h.tick && cur.h.tick(dt, cur.t); } catch (e) { settle('lose', 'Something went wrong. Very uncat.'); }
      if (!cur.outcome) {
        const f = Math.max(0, 1 - cur.t / cur.dur);
        els.timer.style.transform = `scaleX(${f})`;
        els.yarn.style.left = `${f * 100}%`;
        els.yarn.style.transform = `rotate(${cur.t * -360}deg)`;
        if (cur.t >= cur.dur) {
          const r = cur.h.timeout ? cur.h.timeout() : 'lose';
          settle(r, r === 'win' ? (cur.g.winText || 'Time! You passed.') : (cur.g.loseText || 'Out of time. Very dog of you.'));
        }
      } else {
        cur.holdT += dt;
        if (cur.holdT > (C.calm ? 0.25 : 0.55)) { const c = cur; cur = null; result(c); return; }
      }
    }
    raf = requestAnimationFrame(loop);
  }

  function result(c) {
    const win = c.outcome === 'win';
    const stats = C.store.get('cx:report', {});
    const s = stats[c.g.id] || [0, 0];
    s[0] += win ? 1 : 0; s[1] += 1; stats[c.g.id] = s;
    C.store.set('cx:report', stats);
    if (win) { run.passed++; sound('win'); buzz(20); }
    else { run.lives--; sound('lose'); buzz([50, 40, 50]); paintLives(run.lives, run.lives); }
    run.round++;
    hud();
    $('#splashCat').innerHTML = A.cat(win ? 'happy' : 'cross');
    $('#splashBig').textContent = win ? C.pick(['PURRFECT!', 'VERY CAT!', 'MEOWSOME!', 'PAWSOME!', 'NAILED IT!']) : C.pick(['HISS!', 'BAD KITTY!', 'NOPE!', 'MRRROW?!', 'DOG ALERT!']);
    $('#splashSmall').textContent = c.msg;
    els.banner.className = 'cx-banner';
    els.splash.className = `cx-splash is-on ${win ? 'is-win' : 'is-lose'}`;
    setTimeout(() => { els.splash.className = 'cx-splash'; nextRound(); }, C.calm ? 900 : 1300);
  }

  function finish() {
    cancelAnimationFrame(raf);
    cur = null;
    const passed = run.passed;
    const b = C.best(`passed:${C.mode}`, passed);
    $('#endScore').textContent = passed;
    $('#endBest').textContent = b.best;
    const dip = $('#diploma');
    if (!adv) {
      const ok = run.lives > 0;
      dip.classList.toggle('is-fail', !ok);
      const grade = !ok ? 'F' : ['', 'C', 'B', 'A', 'A+'][run.lives];
      $('#endGrade').textContent = grade;
      $('#endGradeLabel').textContent = 'Grade';
      $('#endTitle').textContent = ok ? (run.lives === LIVES ? 'Certified Purebred Cat' : 'Certified Cat') : 'Probably a Dog';
      $('#endText').textContent = ok
        ? (run.lives === LIVES ? 'Flawless. The Council bows. Someone fetch this cat a sunbeam.' : 'Welcome to the Council. Please collect your box at the door.')
        : 'The Council suspects you wag. Study the report and try again.';
    } else {
      dip.classList.remove('is-fail');
      const rank = passed >= 40 ? 'Supreme Feline Overlord' : passed >= 25 ? 'Council Elder' : passed >= 15 ? 'Senior Cat' : passed >= 8 ? 'Junior Cat' : passed >= 3 ? 'Kitten' : 'Very Confused Dog';
      $('#endGrade').textContent = `x${run.sf.toFixed(2)}`;
      $('#endGradeLabel').textContent = 'Top speed';
      $('#endTitle').textContent = rank;
      $('#endText').textContent = `You passed ${passed} test${passed === 1 ? '' : 's'} before running out of lives${b.isNew && passed ? '. A new record for this household!' : '.'}`;
    }
    showPanel('end');
    if ((b.isNew && passed > 0) || (!adv && run.lives > 0)) { C.confetti(); C.sfx('success'); } else sound('lose');
  }

  function report() {
    const stats = C.store.get('cx:report', {});
    const wrap = document.createElement('div');
    wrap.className = 'cx-report';
    wrap.innerHTML = GAMES.map((g) => {
      const [w, n] = stats[g.id] || [0, 0];
      const p = n ? Math.round((w / n) * 100) : 0;
      return `<div><b>${g.say.replace('BOSS: ', '')}</b>${n ? `${w} of ${n} passed` : 'Not taken yet'}<i style="--p:${p}%"></i></div>`;
    }).join('');
    C.modal({ emoji: '📋', title: 'Report card', body: wrap, buttons: [{ label: 'Close', value: 'x' }] });
  }

  function input(kind, arg) {
    if (!cur || cur.outcome || !cur.started) return;
    const h = cur.h;
    if (kind === 'tap' && h.tap) h.tap(arg.x, arg.y);
    else if (kind === 'num' && h.num) h.num(arg);
    else if (h[kind]) h[kind]();
  }

  els.stage.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const r = els.stage.getBoundingClientRect();
    const s = Math.min(r.width / 400, r.height / 300);
    const ox = (r.width - 400 * s) / 2, oy = (r.height - 300 * s) / 2;
    input('tap', { x: (e.clientX - r.left - ox) / s, y: (e.clientY - r.top - oy) / s });
    e.preventDefault();
  });
  $('#pad').addEventListener('pointerdown', (e) => {
    const b = e.target.closest('button[data-k]'); if (!b) return;
    e.preventDefault();
    input(b.dataset.k);
  });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.curio-modal, input, textarea, .curio-bar')) return;
    if (!els.intro.hidden || !els.end.hidden) {
      if (e.key === 'Enter' && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); start(); }
      return;
    }
    if (e.repeat) return;
    const k = e.key;
    if (k === ' ' || k === 'Enter') { e.preventDefault(); input('act'); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { e.preventDefault(); input('left'); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { e.preventDefault(); input('right'); }
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') { e.preventDefault(); input('up'); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { e.preventDefault(); input('down'); }
    else if (/^[1-9]$/.test(k)) input('num', +k);
  });
  document.addEventListener('visibilitychange', () => { last = performance.now(); });
  $('#startBtn').addEventListener('click', start);
  $('#againBtn').addEventListener('click', start);
  $('#cardBtn').addEventListener('click', report);
  $('#shareBtn').addEventListener('click', () => {
    const t = `Zoble Cat Exam (${C.mode}): passed ${run ? run.passed : 0} tests. Result: ${$('#endTitle').textContent}.`;
    (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => C.toast('Copied!'), () => C.toast(t, 4000));
  });
  window.__cx = { get cur() { return cur; }, input };

  setupIntro();
})();
