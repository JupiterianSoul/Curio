(() => {
  const S = window.TROLLEY;
  const A = window.TrolleyArt;
  const $ = (s) => document.querySelector(s);
  const svg = $('#svg');
  const SAVE = 'trolley:v2';
  const FINAL = S.length - 1;
  const TOP = 'M-90 130 L820 130';
  const BOT = 'M-90 130 L250 130 C330 130 330 240 420 240 L820 240';

  const BADGES = [
    ['first', '🚋', 'End of the line', 'Finish any ride'],
    ['full', '🏁', 'Terminus', 'Finish the full line'],
    ['pacifist', '🕊️', 'Pacifist', 'Finish a ride with 10 or fewer casualties'],
    ['billion', '🐜', 'Ant-agonist', 'Send a trolley through a billion ants'],
    ['drift', '🏎️', 'Multi-track drifter', 'Do the multi-track drift'],
    ['nemesis', '🤝', 'The bigger person', 'Save your nemesis'],
    ['selfless', '🦸', 'Selfless', 'Send the trolley at yourself'],
    ['hive', '🐑', 'Hive mind', 'Agree with the majority 90% of the time (10+ problems)'],
    ['rebel', '🦔', 'Contrarian', 'Agree with the majority under 35% of the time (10+ problems)'],
    ['chaos', '🌀', 'Agent of chaos', 'Pick 6 chaotic options in one ride'],
    ['speed', '⏱️', 'Quick thinker', 'Finish a speed round without timing out'],
    ['daily', '📅', 'Daily commuter', 'Finish a daily dilemma'],
    ['lever', '🕹️', 'Lever enthusiast', 'Pull 100 levers in total'],
    ['gamble', '🎰', 'High roller', 'Win the slot machine lever']
  ];

  const MODES = [
    { id: 'full', name: 'The full line', desc: `All ${S.length} problems, from sensible to deranged.`, col: '#ff6a48', n: S.length },
    { id: 'quick', name: 'Quick ride', desc: '12 random problems, then the final one.', col: '#3b82f6', n: 13 },
    { id: 'daily', name: 'Daily dilemma', desc: "Today's 7 problems, the same for everyone.", col: '#d946ef', n: 7 },
    { id: 'speed', name: 'Speed round', desc: '15 problems, 8 seconds each. Hesitate and the trolley decides.', col: '#f59e0b', n: 15 }
  ];

  const blank = () => ({ v: 2, runs: 0, kills: 0, saved: 0, pulls: 0, decisions: 0, badges: [], history: [], best: {}, daily: {}, run: null });
  function load() {
    const d = blank();
    const s = Curio.store.get(SAVE, null);
    if (!s || typeof s !== 'object' || s.v !== 2) return d;
    for (const k of Object.keys(d)) if (s[k] === undefined || (d[k] !== null && typeof s[k] !== typeof d[k]) || Array.isArray(d[k]) !== Array.isArray(s[k])) s[k] = d[k];
    if (s.run && (!Array.isArray(s.run.order) || typeof s.run.i !== 'number' || s.run.order.some((x) => !S[x]))) s.run = null;
    return s;
  }
  let save = load();
  const persist = () => Curio.store.set(SAVE, save);
  const vibrate = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hashStr = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  let noiseBuf = null;
  const AC = () => (Curio.muted ? null : Curio.audioContext());
  const noise = (ac) => { if (noiseBuf) return noiseBuf; noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return noiseBuf; };
  const SFX = {
    bell() { [0, 220].forEach((t) => setTimeout(() => { Curio.beep(1320, .25, 'triangle', .08); Curio.beep(1980, .18, 'sine', .03); }, t)); },
    clunk() {
      const ac = AC(); if (!ac) return; const t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(60, t + .12);
      g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .15); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .16);
      const n = ac.createBufferSource(); n.buffer = noise(ac); const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2000; const ng = ac.createGain(); ng.gain.setValueAtTime(.2, t + .05); ng.gain.exponentialRampToValueAtTime(.001, t + .12);
      n.connect(f).connect(ng).connect(ac.destination); n.start(t + .05); n.stop(t + .13);
    },
    rumble(dur) {
      const ac = AC(); if (!ac) return () => {}; const t = ac.currentTime;
      const n = ac.createBufferSource(); n.buffer = noise(ac); n.loop = true;
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 180;
      const g = ac.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.35, t + .4); g.gain.setValueAtTime(.35, t + dur - .4); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      n.connect(f).connect(g).connect(ac.destination); n.start(t); n.stop(t + dur + .05);
      let k = 0; const iv = setInterval(() => { Curio.beep(k++ % 2 ? 95 : 120, .05, 'square', .05); }, 170);
      setTimeout(() => clearInterval(iv), dur * 1000);
      return () => { clearInterval(iv); try { g.gain.cancelScheduledValues(ac.currentTime); g.gain.setValueAtTime(.0001, ac.currentTime); } catch {} };
    },
    bonk() {
      const ac = AC(); if (!ac) return; const t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(420 + Math.random() * 120, t); o.frequency.exponentialRampToValueAtTime(90, t + .16);
      g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .2); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + .22);
      Curio.beep(1600 + Math.random() * 600, .05, 'triangle', .05);
    },
    screech() {
      const ac = AC(); if (!ac) return; const t = ac.currentTime;
      const o = ac.createOscillator(), g = ac.createGain(), l = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = 1700; l.frequency.value = 28; lg.gain.value = 90; l.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .9); o.connect(g).connect(ac.destination); o.start(t); l.start(t); o.stop(t + .9); l.stop(t + .9);
    },
    slot() { [523, 659, 784, 659, 523, 880].forEach((f, i) => setTimeout(() => Curio.beep(f, .07, 'square', .05), i * 80)); },
    tick() { Curio.beep(880, .03, 'square', .04); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => Curio.beep(f, .2, 'triangle', .1), i * 120)); }
  };

  svg.innerHTML = `${A.defs()}
    <rect width="720" height="300" fill="url(#trSky)"/>
    <g class="tr-stars">${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 720}" cy="${(i * 53) % 120}" r="${i % 5 === 0 ? 1.6 : .9}" fill="#fff" opacity="${.5 + (i % 3) * .2}"/>`).join('')}</g>
    <circle cx="640" cy="52" r="22" fill="var(--tr-sun)"/><circle cx="640" cy="52" r="34" fill="var(--tr-sun)" opacity=".2"/>
    <g>${A.cloud(80, 40, 1, 90)}${A.cloud(330, 26, .7, 120)}${A.cloud(560, 60, .85, 105)}</g>
    <path d="M0 120 Q120 70 240 110 T480 100 T720 110 V300 H0Z" fill="var(--tr-hill1)"/>
    <path d="M0 130 Q160 96 320 128 T720 120 V300 H0Z" fill="var(--tr-hill2)"/>
    <rect y="124" width="720" height="176" fill="url(#trGround)"/>
    ${Array.from({ length: 26 }, (_, i) => `<path d="M${(i * 131) % 720} ${170 + (i * 37) % 120} l3 -7 l3 7" stroke="var(--tr-grass2)" stroke-width="1.5" fill="none"/>`).join('')}
    <g fill="none" stroke-linecap="butt">
      <path d="${TOP}" stroke="var(--tr-ballast)" stroke-width="30"/><path d="${BOT}" stroke="var(--tr-ballast)" stroke-width="30"/>
      <path d="${TOP}" stroke="var(--tr-sleeper)" stroke-width="22" stroke-dasharray="5 11"/><path d="${BOT}" stroke="var(--tr-sleeper)" stroke-width="22" stroke-dasharray="5 11"/>
      <path class="tr-route" id="routeTop" d="${TOP}" stroke="#ffd166" stroke-width="26"/><path class="tr-route" id="routeBot" d="${BOT}" stroke="#ffd166" stroke-width="26"/>
      <path d="${TOP}" stroke="var(--tr-rail)" stroke-width="14"/><path d="${TOP}" stroke="var(--tr-ballast)" stroke-width="7"/>
      <path d="${BOT}" stroke="var(--tr-rail)" stroke-width="14"/><path d="${BOT}" stroke="var(--tr-ballast)" stroke-width="7"/>
    </g>
    <path class="tr-points" id="points" d="M226 126 L262 126" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
    <path id="mTop" d="${TOP}" fill="none" stroke="none"/><path id="mBot" d="${BOT}" fill="none" stroke="none"/>
    <g id="signs"></g>
    <g transform="translate(150 230)" id="you">${A.person('#ff5a36', '', 2, true)}</g>
    <g><rect x="176" y="218" width="30" height="12" rx="3" fill="#334155"/><g class="tr-lever-arm" id="lever"><path d="M190 222 L170 186" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/><circle cx="170" cy="186" r="8" fill="#ef4444"/><circle cx="167" cy="183" r="2.5" fill="#fff" opacity=".7"/></g></g>
    <g id="topItems"></g><g id="botItems"></g>
    <g id="trolley">${A.trolley()}</g>
    <g id="fx"></g>`;

  const mTop = svg.querySelector('#mTop'), mBot = svg.querySelector('#mBot');
  const trolleyEl = svg.querySelector('#trolley'), fx = svg.querySelector('#fx');
  function place(path, at, extra = '') {
    const L = path.getTotalLength();
    const a = path.getPointAtLength(Math.max(0, Math.min(L, at))), b = path.getPointAtLength(Math.max(0, Math.min(L, at + 1)));
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    trolleyEl.setAttribute('transform', `translate(${a.x} ${a.y - 4}) rotate(${ang}) ${extra}`);
    return a;
  }

  function sign(x, y, text) {
    const w = Math.min(260, 24 + text.length * 7.6);
    return `<g class="tr-sign" transform="translate(${x - w} ${y})"><path d="M${w - 14} 18 v22" stroke="var(--tr-sign-post)" stroke-width="4"/><rect width="${w}" height="24" rx="5" fill="var(--tr-sign)" stroke="var(--tr-sign-post)" stroke-width="2"/><text x="${w / 2}" y="16.5" text-anchor="middle">${esc(text)}</text></g>`;
  }
  function items(list, y, x0) {
    const shown = list.slice(0, 10);
    const step = shown.length > 6 ? 27 : 38;
    return shown.map((tok, k) => {
      const x = x0 + k * step;
      const alive = A.isCreature(tok);
      return `<g class="tr-item${alive ? ' alive' : ''}" data-x="${x}" data-y="${y}" transform="translate(${x} ${y})"><g class="inner" style="animation-delay:-${(k * .37).toFixed(2)}s">${A.sprite(tok, k + Math.round(x))}</g></g>`;
    }).join('');
  }

  let run = null, sc = null, busy = false, stopRumble = () => {}, timerRaf = 0, cur = null, launched = [];

  function draw(scn) {
    sc = scn;
    const kills = run ? run.kills : 0;
    const bot = scn.final ? Array.from({ length: Math.min(10, Math.max(0, kills > 10 ? 10 : kills)) }, () => 'p') : scn.bot;
    const bl = scn.final ? `${Curio.fmt(kills)} previous victim${kills === 1 ? '' : 's'}` : scn.bl;
    svg.querySelector('#topItems').innerHTML = items(scn.top, 130, 440);
    svg.querySelector('#botItems').innerHTML = items(bot, 240, 470);
    svg.querySelector('#signs').innerHTML = sign(712, 146, scn.tl) + sign(712, 262, bl);
    svg.querySelector('#lever').classList.remove('on');
    svg.querySelector('#points').classList.remove('on');
    svg.querySelector('#routeTop').classList.remove('on'); svg.querySelector('#routeBot').classList.remove('on');
    fx.innerHTML = ''; launched = [];
    trolleyEl.style.opacity = 1;
    place(mTop, 40);
  }

  function burst(x, y, big) {
    const words = ['BONK!', 'POW!', 'WHACK!', 'BOING!', 'THWACK!', 'OOF!'];
    const cols = ['#ffd166', '#ff6a48', '#ffffff', '#7dd3fc', '#f472b6'];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    let html = '';
    for (let i = 0; i < (big ? 14 : 8); i++) {
      const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 3;
      html += `<path d="M0 -${r} L${r * .3} -${r * .3} L${r} 0 L${r * .3} ${r * .3} L0 ${r} L-${r * .3} ${r * .3} L-${r} 0 L-${r * .3} -${r * .3}Z" fill="${cols[i % cols.length]}" data-vx="${Math.cos(a) * (2 + Math.random() * 4)}" data-vy="${Math.sin(a) * (2 + Math.random() * 4) - 3}" transform="translate(${x} ${y})"/>`;
    }
    g.innerHTML = html + `<g transform="translate(${x} ${y - 40})"><text class="tr-pow" text-anchor="middle" font-size="${big ? 24 : 18}" font-weight="900" font-family="system-ui,sans-serif" fill="#ffd166" stroke="#7c2d12" stroke-width="3" paint-order="stroke">${Curio.pick(words)}</text></g>`;
    fx.append(g);
    const parts = [...g.querySelectorAll('path')].map((p) => ({ p, x, y, vx: +p.dataset.vx, vy: +p.dataset.vy, life: 1 }));
    const t0 = performance.now();
    (function step(now) {
      const k = (now - t0) / 700;
      for (const q of parts) { q.vy += .25; q.x += q.vx; q.y += q.vy; q.p.setAttribute('transform', `translate(${q.x} ${q.y}) rotate(${k * 300})`); q.p.setAttribute('opacity', Math.max(0, 1 - k)); }
      if (k < 1) requestAnimationFrame(step); else g.remove();
    })(t0);
  }
  function launch(el) {
    if (el.dataset.hit) return; el.dataset.hit = 1;
    el.classList.remove('alive', 'scared');
    const x = +el.dataset.x, y = +el.dataset.y;
    launched.push({ el, x, y, vx: 4 + Math.random() * 5, vy: -(7 + Math.random() * 5), r: 0, vr: (Math.random() - .3) * 22, t: 0 });
    burst(x, y - 20, false);
    SFX.bonk(); vibrate(25);
    const sc2 = $('#scene'); sc2.classList.remove('shake'); void sc2.offsetWidth; sc2.classList.add('shake');
  }
  function stepLaunched() {
    for (const q of launched) {
      if (q.done) continue;
      q.vy += .55; q.x += q.vx; q.y += q.vy; q.r += q.vr; q.t++;
      q.el.setAttribute('transform', `translate(${q.x} ${q.y}) rotate(${q.r})`);
      q.el.setAttribute('opacity', Math.max(0, 1 - q.t / 70));
      if (q.t > 70) q.done = true;
    }
  }

  function ride(path, dur, opts = {}) {
    return new Promise((res) => {
      const L = path.getTotalLength();
      const start = 40, stopAt = opts.stopAt ?? L;
      const groups = opts.groups || [];
      const its = groups.flatMap((g) => [...svg.querySelectorAll(`#${g} .tr-item`)]);
      const t0 = performance.now();
      svg.classList.add('tr-moving');
      its.forEach((el) => setTimeout(() => el.classList.add('scared'), 300));
      (function step(now) {
        const k = Math.min(1, (now - t0) / dur);
        const ease = opts.decel ? 1 - Math.pow(1 - k, 2.4) : k * k * (1.6 - .6 * k);
        let extra = '';
        if (opts.flip) { const fk = Math.max(0, Math.min(1, (ease - .18) / .22)); if (fk > 0 && fk < 1) extra = `translate(0 ${-Math.sin(fk * Math.PI) * 70}) rotate(${fk * 360} 0 -35)`; }
        const pos = start + ease * (stopAt - start);
        const pt = place(path, pos, extra);
        for (const el of its) if (!el.dataset.hit && pt.x + 50 > +el.dataset.x && Math.abs(pt.y - +el.dataset.y) < 60) launch(el);
        if (opts.also) for (const el of opts.also) if (!el.dataset.hit && pt.x + 50 > +el.dataset.x) launch(el);
        stepLaunched();
        if (k < 1) requestAnimationFrame(step);
        else { svg.classList.remove('tr-moving'); its.forEach((el) => el.classList.remove('scared')); let n = 0; (function settle() { stepLaunched(); if (++n < 60) requestAnimationFrame(settle); })(); res(); }
      })(t0);
    });
  }

  function show(which) { for (const id of ['menu', 'play', 'end', 'extra']) $('#' + id).hidden = id !== which; }

  function modeIcon(col, k) {
    const paths = ['M8 40 h40 M8 40 l-4 6 M48 40 l4 6', 'M8 40 h16 c8 0 8 -14 16 -14 h12', 'M28 10 v8 M18 14 l4 4 M38 14 l-4 4', 'M28 16 a14 14 0 1 1 -0.1 0 M28 22 v8 l6 4'];
    return `<svg viewBox="0 0 56 56" aria-hidden="true"><rect width="56" height="56" rx="14" fill="${col}"/><rect x="10" y="20" width="36" height="16" rx="4" fill="#fff" opacity=".95"/><rect x="13" y="23" width="8" height="6" rx="1" fill="${col}" opacity=".6"/><rect x="24" y="23" width="8" height="6" rx="1" fill="${col}" opacity=".6"/><rect x="35" y="23" width="8" height="6" rx="1" fill="${col}" opacity=".6"/><circle cx="18" cy="38" r="3" fill="#1f2937"/><circle cx="38" cy="38" r="3" fill="#1f2937"/><path d="${paths[k]}" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round" opacity=".9"/></svg>`;
  }

  function renderMenu() {
    cancelAnimationFrame(timerRaf); stopRumble();
    run = null;
    $('#hud').hidden = true; $('#q').hidden = true; $('#timer').hidden = true;
    draw({ top: ['p', 'p', 'p', 'p', 'p'], bot: ['p'], tl: '5 people', bl: '1 person', final: false });
    const m = $('#modes'); m.innerHTML = '';
    MODES.forEach((md, k) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'tr-mode';
      const best = save.best[md.id];
      const done = md.id === 'daily' && save.daily[todayKey()];
      b.innerHTML = `${modeIcon(md.col, k)}<span><b>${md.name}</b><small>${md.desc}</small>${done ? `<span class="done">Done today: ${esc(save.daily[todayKey()])}</span>` : best != null ? `<span class="done">Fewest casualties: ${Curio.fmt(best)}</span>` : ''}</span>`;
      b.addEventListener('click', () => startRun(md.id));
      m.append(b);
    });
    const r = $('#resume');
    if (save.run && save.run.i < save.run.order.length) {
      r.hidden = false;
      r.innerHTML = `<span>🚋 Ride in progress: ${MODES.find((x) => x.id === save.run.mode)?.name || 'ride'}, problem ${save.run.i + 1} of ${save.run.order.length}</span><span class="c-row" style="margin:0"><button class="c-btn" type="button" id="resumeBtn">Continue</button><button class="c-btn c-btn--ghost" type="button" id="dropBtn">Discard</button></span>`;
      $('#resumeBtn').addEventListener('click', () => { run = save.run; startPlay(); });
      $('#dropBtn').addEventListener('click', () => { save.run = null; persist(); renderMenu(); });
    } else r.hidden = true;
    $('#statsRow').innerHTML = `<div class="c-stat"><b>${save.runs}</b><span>Rides</span></div><div class="c-stat"><b>${save.kills >= 1e6 ? Curio.fmt(save.kills / 1e6, 1) + 'M' : Curio.fmt(save.kills)}</b><span>Lifetime casualties</span></div><div class="c-stat"><b>${Curio.fmt(save.pulls)}</b><span>Levers pulled</span></div><div class="c-stat"><b>${save.badges.length}/${BADGES.length}</b><span>Badges</span></div>`;
    show('menu');
  }

  function startRun(mode) {
    let order;
    const body = S.map((_, i) => i).filter((i) => i !== FINAL);
    if (mode === 'full') order = [...body, FINAL];
    else if (mode === 'quick') order = [...Curio.shuffle(body).slice(0, 12), FINAL];
    else if (mode === 'speed') order = Curio.shuffle(body).slice(0, 15);
    else {
      const rnd = seeded(hashStr('trolley' + todayKey()));
      const a = body.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      order = [...a.slice(0, 6), FINAL];
    }
    run = { mode, order, i: 0, kills: 0, choices: [], timeouts: 0 };
    save.run = run; persist();
    startPlay();
  }

  function startPlay() {
    $('#hud').hidden = false; $('#q').hidden = false;
    $('#kills').textContent = Curio.fmt(run.kills);
    show('play');
    showProblem();
    $('#scene').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showProblem() {
    const idx = run.order[run.i];
    const scn = S[idx];
    cur = scn;
    busy = false;
    $('#prog').textContent = `Problem ${run.i + 1} / ${run.order.length}`;
    const q = $('#q'); q.textContent = scn.q; q.style.animation = 'none'; void q.offsetWidth; q.style.animation = '';
    $('#result').innerHTML = '';
    $('#choices').hidden = false;
    $('#pull').disabled = false; $('#nothing').disabled = false;
    draw(scn);
    SFX.bell();
    if (run.mode === 'speed') startTimer(); else $('#timer').hidden = true;
  }

  function startTimer() {
    const bar = $('#timerBar'); $('#timer').hidden = false;
    const dur = 8000; let t0 = performance.now(), last = 9, pausedAt = 0;
    cancelAnimationFrame(timerRaf);
    const step = (now) => {
      if (busy) return;
      if (document.hidden) { if (!pausedAt) pausedAt = now; timerRaf = requestAnimationFrame(step); return; }
      if (pausedAt) { t0 += now - pausedAt; pausedAt = 0; }
      const k = Math.min(1, (now - t0) / dur);
      bar.style.transform = `scaleX(${1 - k})`;
      const secs = Math.ceil((1 - k) * 8);
      if (secs < last && secs <= 3) { last = secs; SFX.tick(); }
      if (k >= 1) { run.timeouts++; Curio.toast('Too slow! The trolley decided for you.'); choose(false); return; }
      timerRaf = requestAnimationFrame(step);
    };
    timerRaf = requestAnimationFrame(step);
  }

  async function choose(pulled) {
    if (busy || !run) return; busy = true;
    cancelAnimationFrame(timerRaf);
    const scn = cur;
    $('#pull').disabled = true; $('#nothing').disabled = true;
    let path = mTop, groups = ['topItems'], k = scn.kt, opts = {}, reveal = '';
    if (pulled) {
      svg.querySelector('#lever').classList.add('on');
      SFX.clunk(); vibrate(15);
      save.pulls++;
    }
    let route = pulled ? 'bot' : 'top';
    if (pulled && scn.special === 'gamble') {
      SFX.slot();
      await wait(600);
      if (Math.random() < 1 / 3) { reveal = '🎰 Jackpot! The lever worked.'; award('gamble'); }
      else { route = 'top'; reveal = '🎰 No luck. The lever jammed and the trolley stayed on course.'; }
    }
    if (pulled && scn.special === 'flip') route = 'top';
    if (route === 'bot') { path = mBot; groups = ['botItems']; k = scn.kb === 'total' ? run.kills : scn.kb; svg.querySelector('#points').classList.add('on'); }
    else if (pulled && scn.special === 'flip') { k = scn.kb; opts.flip = true; }
    else if (pulled && scn.special !== 'gamble') { k = scn.kb === 'total' ? run.kills : scn.kb; }
    if (scn.special === 'gamble' && pulled && route === 'top') k = scn.kt;
    svg.querySelector(route === 'bot' ? '#routeBot' : '#routeTop').classList.add('on');
    if (pulled && scn.special === 'stop') {
      opts.decel = true; opts.stopAt = mBot.getTotalLength() * .52; groups = [];
      stopRumble = SFX.rumble(2.2); setTimeout(SFX.screech, 900);
      await ride(mBot, 2300, { ...opts, groups });
      reveal = 'The trolley squealed to a halt. You will be 40 minutes late for work.';
    } else if (pulled && scn.special === 'loop') {
      stopRumble = SFX.rumble(3.2);
      await ride(mBot, 1500, { groups: [] });
      await ride(mTop, 1700, { groups: ['topItems'] });
    } else if (pulled && scn.special === 'drift') {
      stopRumble = SFX.rumble(2.2); setTimeout(SFX.screech, 300);
      await ride(mBot, 2100, { groups: ['botItems'], also: [...svg.querySelectorAll('#topItems .tr-item')] });
    } else {
      stopRumble = SFX.rumble(2.1);
      await ride(path, 2000, { ...opts, groups });
    }
    stopRumble();
    if (scn.special === 'loop' && !pulled) k = scn.kt;
    if (!reveal && scn.reveal && pulled) reveal = scn.reveal;
    const before = run.kills;
    run.kills += k;
    const kb = $('#kills'); kb.textContent = Curio.fmt(run.kills); if (k) { kb.classList.remove('bump'); void kb.offsetWidth; kb.classList.add('bump'); }
    const saved = Math.max(0, (pulled ? (scn.kt === 'total' ? before : scn.kt) : (scn.kb === 'total' ? before : scn.kb)) - k);
    const agree = pulled ? scn.pull : 100 - scn.pull;
    const kt = scn.kt, kbv = scn.kb === 'total' ? before : scn.kb;
    const util = kt === kbv ? null : (k === Math.min(kt, kbv));
    const selfSaved = scn.self ? ((scn.self === 'bot') !== pulled) : null;
    run.choices.push({ i: run.order[run.i], pulled, agree, chaos: scn.chaos ? scn.chaos === (pulled ? 'pull' : 'nothing') : null, k, util, self: selfSaved });
    save.kills += k; save.saved += saved; save.decisions++;
    if (pulled && scn.special === 'drift') award('drift');
    if (!pulled && scn.kt === 1000000000) award('billion');
    if (scn.tag === 'nemesis' && pulled) award('nemesis');
    if (selfSaved === false) award('selfless');
    if (save.pulls >= 100) award('lever');
    run.i++;
    save.run = run.i < run.order.length ? run : null;
    persist();
    const r = document.createElement('div');
    r.className = 'c-card tr-result';
    const lastOne = run.i >= run.order.length;
    const line = agree >= 70 ? "You're with the crowd on this one." : agree >= 40 ? 'People are split down the middle.' : agree >= 15 ? 'A bold minority opinion.' : 'Almost nobody did that. Almost.';
    r.innerHTML = `<div class="big">${agree}% of people agree with you</div>
      <div class="tr-poll" aria-hidden="true"><span class="a${pulled ? ' mine' : ''}" data-w="${scn.pull}">${scn.pull >= 18 ? `Pulled ${scn.pull}%` : ''}</span><span class="b${pulled ? '' : ' mine'}" data-w="${100 - scn.pull}">${100 - scn.pull >= 18 ? `Did nothing ${100 - scn.pull}%` : ''}</span></div>
      <p class="tr-note">${line} ${k ? `${Curio.fmt(k)} ${k === 1 ? 'casualty' : 'casualties'}.` : 'Nobody was hurt.'}</p>
      ${reveal ? `<p class="tr-reveal">${esc(reveal)}</p>` : ''}
      <div class="c-row" style="margin-top:12px"><button class="c-btn" id="next" type="button">${lastOne ? 'See your verdict' : 'Next problem →'}</button></div>`;
    $('#choices').hidden = true;
    $('#result').append(r);
    requestAnimationFrame(() => requestAnimationFrame(() => r.querySelectorAll('.tr-poll span').forEach((s) => { s.style.width = s.dataset.w + '%'; })));
    $('#next').addEventListener('click', next);
    $('#next').focus({ preventScroll: true });
    const token = run.i;
    if (run.mode === 'speed') setTimeout(() => { if (run && run.i === token && $('#next') && !$('#play').hidden) next(); }, 2600);
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function next() {
    if (!run || !$('#next')) return;
    if (run.i >= run.order.length) return end();
    showProblem();
    $('#scene').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function award(id) {
    if (save.badges.includes(id)) return;
    save.badges.push(id); persist();
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => { Curio.toast(`${b[1]} Badge unlocked: ${b[2]}`, 2600); Curio.beep(1046, .12, 'triangle', .08); setTimeout(() => Curio.beep(1568, .16, 'triangle', .08), 100); }, 500);
  }

  function axes(ch) {
    const pct = (arr) => arr.length ? arr.filter(Boolean).length / arr.length : null;
    return {
      lever: pct(ch.map((c) => c.pulled)),
      conform: pct(ch.map((c) => c.agree >= 50)),
      util: pct(ch.filter((c) => c.util !== null).map((c) => c.util)),
      chaos: pct(ch.filter((c) => c.chaos !== null).map((c) => c.chaos)),
      self: pct(ch.filter((c) => c.self !== null).map((c) => c.self))
    };
  }

  function verdict(ch, kills) {
    const ax = axes(ch);
    const n = ch.length;
    const chaosN = ch.filter((c) => c.chaos).length;
    const last = S[ch[n - 1].i];
    if (last.final && ch[n - 1].pulled && ch[n - 1].k >= 20) return ['😈', 'Agent of Chaos', 'You finished by sending the trolley at everyone you had already hit. Efficient, in a way.', '#ef4444'];
    if (ax.chaos !== null && ax.chaos >= .7 && chaosN >= 4) return ['🌀', 'Chaotic Neutral', 'You picked the weird option almost every time it was offered. The trolley respects you.', '#a855f7'];
    if (ax.conform >= .85) return ['🧍', 'Perfectly Average', 'You agreed with the majority almost every time. Are you... the internet?', '#64748b'];
    if (ax.util !== null && ax.util >= .8 && ax.lever >= .45) return ['🧮', 'Utilitarian', 'Greatest good for the greatest number. You would make an excellent spreadsheet.', '#3b82f6'];
    if (ax.lever <= .25) return ['🙅', 'Deontologist (or just lazy)', "You refused to touch the lever. Not your trolley, not your problem.", '#0ea5e9'];
    if (ax.conform <= .4) return ['🦔', 'Contrarian', 'Whatever everyone else did, you did the other thing. On principle.', '#f59e0b'];
    if (ax.self === 0 && ch.filter((c) => c.self !== null).length >= 2) return ['🦸', 'Martyr', 'Every time it came to you or them, you picked you. Heroic, or just tired.', '#10b981'];
    if (kills <= n * 1.2) return ['😇', 'Surprisingly Decent', 'Given the circumstances, you did about as well as anyone could. Which is not great.', '#22c55e'];
    return ['🎲', 'Morally Flexible', 'Your choices follow no pattern we can find. Philosophers will study you.', '#ec4899'];
  }

  function medal(emo, col) {
    return `<svg class="tr-medal" viewBox="0 0 150 150" aria-hidden="true"><defs><radialGradient id="mg" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff7c2"/><stop offset=".5" stop-color="#facc15"/><stop offset="1" stop-color="#b45309"/></radialGradient></defs>
      <path d="M50 96 L36 146 L56 136 L66 150 L76 104Z M100 96 L114 146 L94 136 L84 150 L74 104Z" fill="${col}"/>
      <circle cx="75" cy="66" r="56" fill="url(#mg)"/><circle cx="75" cy="66" r="46" fill="${col}"/><circle cx="75" cy="66" r="46" fill="none" stroke="#fff7c2" stroke-width="2" stroke-dasharray="3 4"/>
      ${Array.from({ length: 8 }, (_, i) => `<ellipse cx="${75 + Math.cos(Math.PI * .6 + i * .22) * 52}" cy="${66 + Math.sin(Math.PI * .6 + i * .22) * 52}" rx="5" ry="2.5" fill="#15803d" transform="rotate(${(Math.PI * .6 + i * .22) * 57 + 90} ${75 + Math.cos(Math.PI * .6 + i * .22) * 52} ${66 + Math.sin(Math.PI * .6 + i * .22) * 52})"/><ellipse cx="${75 + Math.cos(Math.PI * .4 - i * .22) * 52}" cy="${66 + Math.sin(Math.PI * .4 - i * .22) * 52}" rx="5" ry="2.5" fill="#15803d" transform="rotate(${(Math.PI * .4 - i * .22) * 57 + 90} ${75 + Math.cos(Math.PI * .4 - i * .22) * 52} ${66 + Math.sin(Math.PI * .4 - i * .22) * 52})"/>`).join('')}
      <text x="75" y="80" font-size="40" text-anchor="middle">${emo}</text></svg>`;
  }

  function end() {
    const ch = run.choices, kills = run.kills, mode = run.mode;
    const [emo, title, desc, col] = verdict(ch, kills);
    const ax = axes(ch);
    save.runs++;
    const prevBest = save.best[mode];
    const isNew = prevBest == null || kills < prevBest;
    if (isNew) save.best[mode] = kills;
    save.history.unshift({ d: todayKey(), mode, title, kills, n: ch.length });
    save.history = save.history.slice(0, 15);
    if (mode === 'daily' && !save.daily[todayKey()]) save.daily[todayKey()] = title;
    save.run = null;
    persist();
    award('first');
    if (mode === 'full') award('full');
    if (kills <= 10) award('pacifist');
    if (ch.length >= 10 && ax.conform >= .9) award('hive');
    if (ch.length >= 10 && ax.conform < .35) award('rebel');
    if (ch.filter((c) => c.chaos).length >= 6) award('chaos');
    if (mode === 'speed' && run.timeouts === 0) award('speed');
    if (mode === 'daily') award('daily');
    const pulls = ch.filter((c) => c.pulled).length;
    const avg = Math.round(ch.reduce((a, c) => a + c.agree, 0) / ch.length);
    const bar = (label, v, c) => `<div class="tr-axis"><span>${label}</span><span class="bar"><i style="background:${c}" data-w="${v == null ? 0 : Math.round(v * 100)}"></i></span><em>${v == null ? 'n/a' : Math.round(v * 100) + '%'}</em></div>`;
    const e = $('#end');
    e.innerHTML = `${medal(emo, col)}<div class="c-muted" style="font-weight:800;text-transform:uppercase;letter-spacing:.08em;font-size:13px">Your verdict</div>
      <h2>${title}</h2><p class="c-muted" style="max-width:480px;margin:0 auto">${desc}</p>
      <div class="tr-stats"><div class="c-stat"><b>${Curio.fmt(kills)}</b><span>Casualties</span></div><div class="c-stat"><b>${pulls}/${ch.length}</b><span>Levers pulled</span></div><div class="c-stat"><b>${avg}%</b><span>Avg agreement</span></div><div class="c-stat"><b>${Curio.fmt(save.best[mode])}</b><span>${isNew ? 'New record!' : 'Fewest ever'}</span></div></div>
      <div class="tr-axes">${bar('Utilitarian', ax.util, '#3b82f6')}${bar('Goes with the crowd', ax.conform, '#64748b')}${bar('Chaotic', ax.chaos, '#a855f7')}${bar('Lever-happy', ax.lever, '#ff6a48')}${bar('Self-preserving', ax.self, '#10b981')}</div>
      <div class="tr-log" aria-label="Your choices">${ch.map((c, k) => `<span class="${c.pulled ? 'p' : ''}" style="animation-delay:${k * 25}ms" title="Problem ${k + 1}: ${c.pulled ? 'pulled' : 'did nothing'}">${c.pulled ? 'P' : '-'}</span>`).join('')}</div>
      <div class="c-row"><button class="c-btn" id="again" type="button">Ride again</button><button class="c-btn c-btn--ghost" id="shareBtn" type="button">📋 Share</button><button class="c-btn c-btn--ghost" id="toMenu" type="button">All lines</button></div>`;
    $('#hud').hidden = true; $('#q').hidden = true; $('#timer').hidden = true;
    show('end');
    requestAnimationFrame(() => requestAnimationFrame(() => e.querySelectorAll('.tr-axis i').forEach((i) => { i.style.width = i.dataset.w + '%'; })));
    Curio.confetti(); SFX.win();
    const m = run.mode;
    $('#again').addEventListener('click', () => startRun(m));
    $('#toMenu').addEventListener('click', renderMenu);
    $('#shareBtn').addEventListener('click', async () => {
      const text = `Absurd Trolley Problems (Curio)\n${MODES.find((x) => x.id === m).name}: ${title} ${emo}\n${Curio.fmt(kills)} casualties · pulled ${pulls}/${ch.length}\n${ch.map((c) => (c.pulled ? '🕹️' : '🧍')).join('')}`;
      try { await navigator.clipboard.writeText(text); Curio.toast('Copied! Paste it anywhere.'); } catch { Curio.modal({ emoji: '📋', title: 'Your verdict', body: text, buttons: [{ label: 'OK', value: 1 }] }); }
    });
    run = null;
    e.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function extra(title, html) {
    const e = $('#extra');
    e.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px"><h2 class="tr-h2" style="margin:0">${title}</h2><button class="c-btn c-btn--ghost" type="button" id="back">← Back</button></div>${html}`;
    show('extra');
    $('#back').addEventListener('click', renderMenu);
  }
  $('#howBtn').addEventListener('click', () => extra('How it works', `<p>Each problem has two tracks. If you <b>do nothing</b>, the trolley stays on the top track. If you <b>pull the lever</b>, it switches to the bottom one. Some levers do stranger things.</p>
    <p>After each choice you'll see how many (imaginary) people agreed with you. At the end you get a verdict and a profile: how utilitarian, crowd-following, chaotic, lever-happy and self-preserving you were.</p>
    <p><b>Speed round:</b> 8 seconds a problem. If the timer runs out, you did nothing. <b>Daily dilemma:</b> the same 7 problems for everyone today. Your progress is saved, so you can leave mid-ride and come back.</p>
    <p class="c-muted">No real people, lobsters or rubber ducks were harmed. Everyone is just launched into the sky, cartoon-style.</p>`));
  $('#badgeBtn').addEventListener('click', () => {
    const got = new Set(save.badges);
    extra(`Badges ${save.badges.length}/${BADGES.length}`, `<div class="tr-badges">${BADGES.map(([id, ic, n, d]) => `<div class="tr-badge${got.has(id) ? ' got' : ''}"><i>${ic}</i><div><b>${n}</b><small>${d}</small></div></div>`).join('')}</div>
      <h3 style="margin:18px 0 6px">Past rides</h3>${save.history.length ? `<ul class="tr-hist">${save.history.map((h) => `<li><span>${h.d} · ${MODES.find((x) => x.id === h.mode)?.name || h.mode}</span><span><b>${esc(h.title)}</b> · ${Curio.fmt(h.kills)} casualties</span></li>`).join('')}</ul>` : '<p class="c-muted">No rides yet.</p>'}
      <p class="c-muted" style="margin-top:12px">Lifetime: ${Curio.fmt(save.decisions)} decisions, ${Curio.fmt(save.pulls)} levers pulled, ${Curio.fmt(save.saved)} saved.</p>`);
  });

  $('#pull').addEventListener('click', () => choose(true));
  $('#nothing').addEventListener('click', () => choose(false));
  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if ($('#play').hidden) return;
    const k = e.key.toLowerCase();
    if (k === 'p' && !busy) choose(true);
    else if (k === 'n' && !busy) choose(false);
    else if (e.key === 'Enter' && $('#next') && document.activeElement !== $('#next')) { e.preventDefault(); next(); }
  });

  renderMenu();
  window.__trolley = { S, choose, get run() { return run; }, startRun };
})();
