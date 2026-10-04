(() => {
  const $ = (id) => document.getElementById(id);
  const ADV = Curio.advanced;
  const CODE = SR.code;
  const FREQ = 640;
  const KEY = 'spy-radio';
  const prog = Object.assign({ stars: {} }, Curio.store.get(KEY + ':prog', {}));
  if (typeof prog.stars !== 'object' || !prog.stars) prog.stars = {};
  const saveProg = () => Curio.store.set(KEY + ':prog', prog);

  const menu = $('menu'), desk = $('desk'), card = $('card');
  const lamp = $('lamp'), tape = $('tape'), tg = tape.getContext('2d');
  let run = null, raf = 0, chartTimer = 0;

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function buildChart() {
    const c = $('chart'); c.innerHTML = '';
    const keys = Object.keys(CODE).sort((a, b) => (/\d/.test(a) - /\d/.test(b)) || a.localeCompare(b));
    for (const ch of keys) {
      const p = CODE[ch];
      const d = el('div', 'sr-cc' + (/\d/.test(ch) ? ' dg' : ''));
      d.innerHTML = `<b>${ch}</b><span>${[...p].map((s) => `<i class="${s === '.' ? 'd' : 'h'}"></i>`).join('')}</span>`;
      d.dataset.ch = ch;
      c.append(d);
    }
  }
  buildChart();
  const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  function buildKeys(digits) {
    const k = $('keys'); k.innerHTML = '';
    const rows = digits ? ['1234567890', ...ROWS] : ROWS;
    for (const r of rows) {
      const row = el('div', 'sr-krow');
      for (const ch of r) { const b = el('button', 'sr-k', ch); b.type = 'button'; b.dataset.ch = ch; b.addEventListener('click', () => typeCh(ch)); row.append(b); }
      k.append(row);
    }
  }

  let ac = null, staticSrc = null, scheduled = [];
  const audio = () => { if (Curio.muted) return null; ac = Curio.audioContext && Curio.audioContext(); return ac; };
  function beepAt(when, dur, vol = .16, f = FREQ) {
    const a = ac; if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, when); g.gain.linearRampToValueAtTime(vol, when + .006); g.gain.setValueAtTime(vol, when + dur - .006); g.gain.linearRampToValueAtTime(0, when + dur);
    o.connect(g).connect(a.destination); o.start(when); o.stop(when + dur + .02);
    scheduled.push(o);
  }
  function stopAudio() { for (const o of scheduled) { try { o.stop(); } catch {} } scheduled = []; }
  function staticOn(on) {
    if (staticSrc) { try { staticSrc.g.gain.setTargetAtTime(0, staticSrc.a.currentTime, .1); staticSrc.s.stop(staticSrc.a.currentTime + .5); } catch {} staticSrc = null; }
    const a = on && audio(); if (!a) return;
    const len = a.sampleRate * 2, b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (Math.random() < .002 ? 3 : .6);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = b; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = .6; g.gain.value = .025;
    s.connect(f).connect(g).connect(a.destination); s.start(); staticSrc = { s, g, a };
  }
  function click(f = 1800, v = .05) { Curio.beep(f, .02, 'square', v); }

  function timeline(text, wpm) {
    const u = 1200 / wpm, fw = ADV ? Math.max(1, 2.2 - (wpm - 9) * .15) : 2.2;
    const ev = []; let t = 0;
    [...text].forEach((ch, i) => {
      if (ch === ' ') { t += u * 7 * fw * .8; return; }
      const p = CODE[ch] || '';
      [...p].forEach((s, k) => {
        const d = s === '.' ? u : u * 3;
        ev.push({ t0: t, t1: t + d, s, ci: i });
        t += d + (k < p.length - 1 ? u : 0);
      });
      ev.push({ t0: t, t1: t, s: '|', ci: i });
      t += u * 3 * fw;
    });
    return { ev, len: t };
  }

  function makeSlots(text) {
    const box = $('slots'); box.innerHTML = '';
    [...text].forEach((ch, i) => {
      const s = el('span', ch === ' ' ? 'sr-gap' : 'sr-slot');
      s.dataset.i = i; if (ch !== ' ') s.textContent = '';
      box.append(s);
    });
  }
  function paintSlots() {
    const box = $('slots');
    [...box.children].forEach((s, i) => {
      if (run.text[i] === ' ') return;
      s.textContent = i < run.pos ? run.text[i] : '';
      s.classList.toggle('is-done', i < run.pos);
      s.classList.toggle('is-cur', i === run.pos);
    });
  }

  function startTx() {
    const tx = run.queue[run.qi];
    run.text = tx.text; run.pos = 0; run.reply = !!tx.reply;
    while (run.text[run.pos] === ' ') run.pos++;
    run.tl = timeline(run.text, run.wpm);
    run.loopStart = performance.now() + 450;
    run.scheduledLoop = -1;
    run.tapeMarks = [];
    $('what').textContent = tx.reply ? `Key back: ${tx.text}` : tx.label || 'Incoming transmission';
    $('wpm').textContent = `${run.wpm} WPM`;
    const digits = /\d/.test(run.text);
    $('keys').hidden = run.reply; $('keypad').hidden = !run.reply; $('keyed').hidden = !run.reply;
    $('slots').hidden = run.reply;
    $('repeat').hidden = run.reply;
    $('chart').classList.toggle('digits', digits);
    if (!run.reply) { buildKeys(digits); makeSlots(run.text); paintSlots(); }
    else { run.keyed = ''; run.cur = ''; run.lastKey = 0; paintKeyed(); stopAudio(); }
    const total = tx.reply ? 12 + run.text.length * 6 : Math.round(9 + run.tl.len / 1000 * 2.6 + run.text.replace(/ /g, '').length * 1.2);
    run.limit = total * (ADV ? 1 : 1.1); run.left = run.limit;
    run.mistakes = run.mistakes || 0;
  }
  function scheduleLoop(now) {
    if (run.reply || run.done) return;
    const L = run.tl.len + 1600;
    const k = Math.floor((now - run.loopStart) / L);
    if (k < 0 || k === run.scheduledLoop) return;
    run.scheduledLoop = k;
    const base = run.loopStart + k * L;
    if (audio()) {
      const off = (base - performance.now()) / 1000;
      for (const e of run.tl.ev) if (e.s !== '|') beepAt(ac.currentTime + Math.max(0, off + e.t0 / 1000), (e.t1 - e.t0) / 1000);
    }
  }

  function drawTape(now) {
    const w = tape.clientWidth, h = tape.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (tape.width !== Math.round(w * dpr)) { tape.width = Math.round(w * dpr); tape.height = Math.round(h * dpr); }
    tg.setTransform(dpr, 0, 0, dpr, 0, 0);
    tg.fillStyle = '#f4ead2'; tg.fillRect(0, 0, w, h);
    tg.fillStyle = 'rgba(120,90,40,.12)'; for (let x = (-(now / 12) % 24 + 24) % 24; x < w; x += 24) tg.fillRect(x, 0, 1, h);
    tg.fillStyle = 'rgba(120,90,40,.25)'; tg.fillRect(0, 6, w, 1); tg.fillRect(0, h - 7, w, 1);
    if (!run || run.reply || !run.tl) return;
    const show = run.tapeOn;
    const L = run.tl.len + 1600, sp = Math.min(.16, 70 / (1200 / run.wpm)) ;
    const head = w * .78;
    const t = now - run.loopStart;
    const k = Math.floor(t / L);
    tg.save();
    for (let loop = Math.max(0, k - 2); loop <= k; loop++) {
      const lt = t - loop * L;
      for (const e of run.tl.ev) {
        if (e.t0 > lt) break;
        const x0 = head - (lt - e.t0) * sp;
        if (x0 < -40) continue;
        if (e.s === '|') {
          if (!ADV || run.mission?.chart) { tg.fillStyle = 'rgba(180,60,40,.35)'; tg.fillRect(x0 + 6, 10, 1.5, h - 20); }
          continue;
        }
        if (!show) continue;
        const x1 = head - (lt - Math.min(lt, e.t1)) * sp;
        tg.fillStyle = '#2a2018';
        if (e.s === '.') { tg.beginPath(); tg.arc((x0 + x1) / 2, h / 2, 4.5, 0, Math.PI * 2); tg.fill(); }
        else { tg.beginPath(); tg.roundRect(x0, h / 2 - 4, Math.max(2, x1 - x0), 8, 4); tg.fill(); }
      }
    }
    if (run.mission?.noise) { tg.fillStyle = 'rgba(40,30,20,.35)'; for (let i = 0; i < 14; i++) tg.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    tg.restore();
    tg.fillStyle = '#c0392b'; tg.fillRect(head + 2, 4, 2, h - 8);
    if (!show) { tg.fillStyle = 'rgba(60,40,20,.55)'; tg.font = '700 12px ui-monospace, monospace'; tg.textAlign = 'left'; tg.fillText('TAPE PRINTER JAMMED: LISTEN AND WATCH THE LAMP', 12, h / 2 + 4); }
  }

  let hotEl = null;
  function lampAt(now) {
    if (!run || run.reply || run.done || !run.tl) return false;
    const L = run.tl.len + 1600, t = now - run.loopStart;
    if (t < 0) return false;
    const lt = t % L;
    let on = false, ci = -1;
    for (const e of run.tl.ev) { if (e.t0 > lt) break; ci = e.s === '|' ? (lt - e.t0 < 500 ? e.ci : -1) : e.ci; if (e.s !== '|' && lt < e.t1) on = true; }
    if (run.simple) {
      const ch = ci >= 0 ? run.text[ci] : null;
      const want = ch ? $('chart').querySelector(`[data-ch="${CSS.escape(ch)}"]`) : null;
      if (want !== hotEl) { if (hotEl) hotEl.classList.remove('hot'); hotEl = want; if (hotEl) hotEl.classList.add('hot'); }
    }
    return on;
  }

  let lastNow = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(100, now - (lastNow || now)); lastNow = now;
    if (document.hidden) return;
    if (run && !run.done && !run.paused) {
      scheduleLoop(now); scheduleLoop(now + 400);
      run.left -= dt / 1000;
      if (run.simple) { run.clock -= dt / 1000; if (run.clock <= 0) { endShift(); return; } }
      else if (run.left <= 0) { lost(); return; }
      const k = run.simple ? run.clock / 120 : run.left / run.limit;
      $('sig').style.width = `${Math.max(0, k) * 100}%`;
      $('sig').classList.toggle('low', k < .25);
      $('secs').textContent = Math.ceil(run.simple ? run.clock : run.left);
      if (run.reply && run.cur && now - run.lastKey > 1100) commitLetter();
    }
    lamp.classList.toggle('on', lampAt(now));
    drawTape(now);
  }

  function typeCh(ch) {
    if (!run || run.done || run.paused || run.reply) return;
    ch = ch.toUpperCase();
    const want = run.text[run.pos];
    const kb = $('keys').querySelector(`[data-ch="${CSS.escape(ch)}"]`);
    if (ch === want) {
      run.pos++;
      while (run.text[run.pos] === ' ') run.pos++;
      if (run.simple) { run.score += 10; run.letters++; }
      click(2200, .04);
      if (kb) { kb.classList.remove('ok'); void kb.offsetWidth; kb.classList.add('ok'); }
      paintSlots();
      if (run.pos >= run.text.length) txDone();
    } else {
      run.mistakes++;
      if (!run.simple) run.left -= 2;
      Curio.beep(150, .12, 'square', .05);
      navigator.vibrate && navigator.vibrate(30);
      const s = $('slots').children[run.pos]; if (s) { s.classList.remove('bad'); void s.offsetWidth; s.classList.add('bad'); }
      if (kb) { kb.classList.remove('no'); void kb.offsetWidth; kb.classList.add('no'); }
    }
    if (run.simple) paintScore();
  }

  function paintKeyed() {
    const box = $('keyed');
    const want = run.text;
    const done = run.keyed;
    box.innerHTML = `<div class="sr-target">${[...want].map((c, i) => `<span class="${i < done.length ? (done[i] === c ? 'ok' : 'no') : i === done.length ? 'cur' : ''}"><b>${c}</b><small>${CODE[c] ? CODE[c].replace(/\./g, '•').replace(/-/g, '▬') : ''}</small></span>`).join('')}</div><div class="sr-now">${run.cur ? [...run.cur].map((s) => `<i class="${s === '.' ? 'd' : 'h'}"></i>`).join('') : '<em>key the next letter</em>'}</div>`;
    if (!run.mission?.chart && ADV) box.querySelectorAll('small').forEach((s, i) => { if (i >= done.length) s.textContent = '?'; });
  }
  function key(sym) {
    if (!run || run.done || !run.reply || run.paused) return;
    run.cur += sym; run.lastKey = performance.now();
    if (audio()) beepAt(ac.currentTime + .005, sym === '.' ? .08 : .24, .14, 700);
    lamp.classList.add('on'); setTimeout(() => lamp.classList.remove('on'), sym === '.' ? 90 : 250);
    if (run.cur.length > 6) run.cur = run.cur.slice(-6);
    paintKeyed();
  }
  function commitLetter() {
    if (!run.cur) return;
    const ch = Object.keys(CODE).find((k) => CODE[k] === run.cur) || '?';
    const want = run.text[run.keyed.length];
    run.cur = '';
    if (ch === want) { run.keyed += ch; click(2200, .04); }
    else { run.mistakes++; run.left -= 2; Curio.beep(150, .12, 'square', .05); Curio.toast(ch === '?' ? 'That is not a letter. Try again.' : `That was ${ch}. Try again.`); }
    paintKeyed();
    if (run.keyed === run.text) txDone();
  }
  function rubOut() { if (!run || !run.reply) return; if (run.cur) run.cur = run.cur.slice(0, -1); paintKeyed(); }

  function txDone() {
    stopAudio();
    run.qi++;
    if (run.simple) {
      const bonus = 20 + Math.round(Math.max(0, run.left) * 1.5);
      run.score += bonus; run.words.push(run.text); paintScore();
      Curio.sfx && Curio.sfx('success');
      floatText(`+${bonus}`);
      if (run.words.length % 3 === 0 && run.wpm < 18) { run.wpm++; Curio.toast(`Faster now: ${run.wpm} WPM`); }
      run.queue.push({ text: pickWord() });
      run.paused = true;
      setTimeout(() => { if (!run || run.done) return; run.paused = false; startTx(); }, 700);
      return;
    }
    Curio.sfx && Curio.sfx('on');
    if (run.qi < run.queue.length) { run.paused = true; setTimeout(() => { if (!run || run.done) return; run.paused = false; startTx(); }, 800); return; }
    run.done = true; staticOn(false);
    run.timeFrac = Math.max(0, run.left / run.limit);
    setTimeout(question, 500);
  }
  function floatText(t) {
    const f = el('div', 'sr-float', t); $('slots').append(f); setTimeout(() => f.remove(), 900);
  }

  function showCard({ tag, title, body, opts, btns }) {
    $('cardTag').textContent = tag || ''; $('cardTitle').textContent = title || ''; $('cardBody').textContent = body || '';
    const o = $('cardOpts'); o.innerHTML = '';
    (opts || []).forEach((x) => { const b = el('button', 'sr-opt', x.label); b.type = 'button'; b.addEventListener('click', () => x.go(b)); o.append(b); });
    const bb = $('cardBtns'); bb.innerHTML = '';
    (btns || []).forEach((x) => { const b = el('button', 'c-btn ' + (x.ghost ? 'c-btn--ghost' : ''), x.label); b.type = 'button'; b.addEventListener('click', x.go); bb.append(b); });
    card.hidden = false;
    const f = card.querySelector('button'); if (f) f.focus();
  }
  const hideCard = () => { card.hidden = true; };

  function question() {
    const m = run.mission;
    if (!m.q) { finishMission(true); return; }
    const order = Curio.shuffle(m.opts.map((t, i) => ({ t, i })));
    let tries = 0;
    showCard({
      tag: 'DECODED', title: m.q, body: `Your notes say: "${m.tx.join(' ')}"`,
      opts: order.map(({ t, i }) => ({ label: t, go: (b) => {
        tries++;
        if (i === m.a) { b.classList.add('ok'); Curio.sfx && Curio.sfx('success'); setTimeout(() => finishMission(tries === 1), 500); }
        else { b.classList.add('no'); b.disabled = true; Curio.sfx && Curio.sfx('error'); }
      } }))
    });
  }
  function finishMission(firstTry) {
    const m = run.mission, i = run.mi;
    let stars = 1;
    if (firstTry && run.mistakes <= 2) stars++;
    if (run.timeFrac > .35 && run.mistakes <= 1 && firstTry) stars++;
    const old = prog.stars[i] || 0;
    if (stars > old) { prog.stars[i] = stars; saveProg(); }
    if (stars === 3) Curio.confetti();
    const last = i === SR.missions.length - 1;
    showCard({
      tag: `MISSION ${i + 1} COMPLETE`, title: '★'.repeat(stars) + '☆'.repeat(3 - stars), body: m.after,
      btns: [
        ...(last ? [{ label: 'Close the file', go: () => { hideCard(); exitDesk(); if (Object.keys(prog.stars).length === SR.missions.length) Curio.toast('Operation Nightjar complete. The radio hums proudly.'); } }] : [{ label: 'Next mission', go: () => { hideCard(); startMission(i + 1); } }]),
        { label: 'Retry', ghost: true, go: () => { hideCard(); startMission(i); } },
        { label: 'Dossier', ghost: true, go: () => { hideCard(); exitDesk(); } }
      ]
    });
  }
  function lost() {
    run.done = true; stopAudio(); staticOn(false);
    Curio.sfx && Curio.sfx('error');
    if (run.simple) return;
    showCard({ tag: 'SIGNAL LOST', title: 'The line went dead', body: 'Somebody was triangulating your position, so you pulled the plug. Retune and try again.', btns: [{ label: 'Retune', go: () => { hideCard(); startMission(run.mi); } }, { label: 'Dossier', ghost: true, go: () => { hideCard(); exitDesk(); } }] });
  }

  function enterDesk() { menu.hidden = true; desk.hidden = false; $('sub').hidden = true; document.body.classList.add('on-desk'); scrollTo(0, 0); if (!raf) raf = requestAnimationFrame(frame); }
  function exitDesk() { if (run) { run.done = true; } run = null; stopAudio(); staticOn(false); desk.hidden = true; menu.hidden = false; $('sub').hidden = false; document.body.classList.remove('on-desk'); renderMenu(); }

  function startMission(i) {
    const m = SR.missions[i];
    stopAudio();
    run = { mission: m, mi: i, wpm: m.wpm, queue: m.reply ? [{ text: m.reply, reply: true }] : m.tx.map((t, k) => ({ text: t, label: `Transmission ${k + 1} of ${m.tx.length}` })), qi: 0, mistakes: 0, tapeOn: m.tape, done: true };
    enterDesk();
    $('peek').hidden = !!m.chart;
    $('chart').classList.toggle('on', !!m.chart);
    $('score').textContent = `Mission ${i + 1}`;
    showCard({ tag: `${SR.chapters[m.ch].toUpperCase()}`, title: `Mission ${i + 1}: ${m.name}`, body: `${m.brief}${m.tape ? '' : ' No tape this time.'}${m.chart ? ' The codebook is open on the desk.' : ''}`, btns: [{ label: m.reply ? 'Open the key' : 'Tune in', go: () => { hideCard(); run.done = false; startTx(); staticOn(!!m.noise); } }, { label: 'Back', ghost: true, go: () => { hideCard(); exitDesk(); } }] });
  }

  let bag = [];
  function pickWord() {
    if (!bag.length) bag = Curio.shuffle(SR.quick.filter((w) => w.length <= (run && run.words.length > 6 ? 7 : 5)));
    return bag.pop();
  }
  function paintScore() { $('score').textContent = `Score ${run.score}`; }
  function startShift() {
    stopAudio(); bag = [];
    run = { simple: true, wpm: 9, queue: [], qi: 0, score: 0, letters: 0, words: [], mistakes: 0, clock: 120, tapeOn: true, done: false };
    run.queue.push({ text: pickWord() });
    enterDesk();
    $('peek').hidden = true; $('chart').classList.add('on');
    startTx(); paintScore();
    Curio.sfx && Curio.sfx('on');
  }
  function endShift() {
    run.done = true; stopAudio();
    const b = Curio.best('shift', run.score);
    if (b.isNew && run.score > 0) Curio.confetti();
    Curio.sfx && Curio.sfx('success');
    const r = run;
    showCard({ tag: 'END OF SHIFT', title: `${r.score} points`, body: `You decoded ${r.words.length} word${r.words.length === 1 ? '' : 's'} (${r.letters} letters${r.mistakes ? `, ${r.mistakes} slips` : ', not a single slip'}). ${b.isNew && r.score ? 'A new personal best!' : `Best: ${b.best}.`}${r.words.length ? ` Last ones in: ${r.words.slice(-4).join(', ')}.` : ''}`, btns: [{ label: 'Another shift', go: () => { hideCard(); startShift(); } }, { label: 'Done', ghost: true, go: () => { hideCard(); exitDesk(); } }] });
  }

  function renderMenu() {
    menu.innerHTML = '';
    if (!ADV) {
      const best = Curio.getBest('shift');
      const c = el('div', 'sr-dossier sr-dossier--simple');
      c.innerHTML = `<div class="sr-paper"><p class="sr-paper__tag">TONIGHT'S SHIFT</p><h2>Two minutes on the receiver</h2><p>Words arrive as beeps, a flashing lamp and marks on the paper tape. Find each letter in the codebook and tap it in. Every word speeds things up a little.</p><div class="sr-howto"><span><i class="d"></i> short beep</span><span><i class="h"></i> long beep</span><span><b>A</b> = <i class="d"></i><i class="h"></i></span></div><button class="c-btn sr-big" type="button" id="shift">Start the shift</button><p class="sr-best">${best != null ? `Best shift: ${best} points` : 'No shifts on record yet'}</p></div>`;
      menu.append(c);
      c.querySelector('#shift').addEventListener('click', startShift);
      return;
    }
    const total = Object.values(prog.stars).reduce((a, b) => a + b, 0);
    const head = el('div', 'sr-dhead', `<h2>Operation Nightjar</h2><p>${total} of ${SR.missions.length * 3} stars. Decode each transmission, then act on what it says.</p>`);
    menu.append(head);
    SR.chapters.forEach((name, ch) => {
      const sec = el('div', 'sr-chap'); sec.append(el('h3', '', name));
      const grid = el('div', 'sr-mgrid');
      SR.missions.forEach((m, i) => {
        if (m.ch !== ch) return;
        const open = i === 0 || prog.stars[i - 1] || prog.stars[i];
        const b = el('button', 'sr-mission' + (open ? '' : ' is-locked'));
        b.type = 'button'; b.disabled = !open;
        const st = prog.stars[i] || 0;
        b.innerHTML = `<span class="sr-mission__n">${String(i + 1).padStart(2, '0')}</span><b>${open ? m.name : 'Classified'}</b><small>${m.reply ? 'Send a reply' : `${m.wpm} WPM${m.tape ? '' : ', no tape'}${m.noise ? ', static' : ''}`}</small><span class="sr-mission__s">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span>`;
        b.addEventListener('click', () => startMission(i));
        grid.append(b);
      });
      sec.append(grid); menu.append(sec);
    });
    const q = el('div', 'sr-quick', `<div><b>Practice shift</b><span>Two minutes of random words. Best: ${Curio.getBest('shift') ?? 0}</span></div>`);
    const qb = el('button', 'c-btn c-btn--ghost', 'Start'); qb.type = 'button'; qb.addEventListener('click', startShift); q.append(qb);
    menu.append(q);
  }

  $('repeat').addEventListener('click', () => { if (!run || run.done || run.reply) return; stopAudio(); run.loopStart = performance.now() + 300; run.scheduledLoop = -1; if (!run.simple) run.left -= 1; click(); });
  $('peek').addEventListener('click', () => {
    if (!run || run.done) return;
    const c = $('chart');
    if (c.classList.contains('on')) return;
    c.classList.add('on'); run.left -= 4; Curio.toast('Codebook open for 6 seconds (cost: 4 s of signal)');
    clearTimeout(chartTimer); chartTimer = setTimeout(() => { if (run && !run.mission?.chart && !run.simple) c.classList.remove('on'); }, 6000);
  });
  $('quit').addEventListener('click', () => { if (run && run.simple && !run.done) { endShift(); return; } exitDesk(); });
  $('dot').addEventListener('click', () => key('.'));
  $('dash').addEventListener('click', () => key('-'));
  $('gap').addEventListener('click', () => commitLetter());
  $('del').addEventListener('click', rubOut);
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!card.hidden) { if (e.key === 'Escape') { const g = $('cardBtns').querySelector('.c-btn--ghost'); if (g) g.click(); } return; }
    if (!run || run.done) return;
    if (run.reply) {
      if (e.key === '.' || e.key === 'j' || e.key === 'J') { e.preventDefault(); key('.'); }
      else if (e.key === '-' || e.key === 'k' || e.key === 'K') { e.preventDefault(); key('-'); }
      else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); commitLetter(); }
      else if (e.key === 'Backspace') { e.preventDefault(); rubOut(); }
      return;
    }
    if (e.key === 'Escape') { $('quit').click(); return; }
    if (/^[a-z0-9]$/i.test(e.key)) { e.preventDefault(); if (e.key === 'r' && e.shiftKey) return; typeCh(e.key); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && run) { stopAudio(); run.scheduledLoop = -1; staticOn(false); } else if (run && run.mission?.noise && !run.done) staticOn(true); });
  renderMenu();
  window.SRX = { startMission, startShift, get run() { return run; }, typeCh, key, commitLetter };
})();
