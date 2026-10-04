(() => {
  const D = window.FP_DATA;
  const C = window.Curio;
  const $ = (s) => document.querySelector(s);
  const adv = C.advanced;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  const DESKS = adv
    ? [
        { name: 'Front desk', count: 4, clauses: 7, silly: 2, sly: 0, time: 55, tiny: 0, voids: 0 },
        { name: 'Second floor', count: 4, clauses: 8, silly: 1, sly: 1, time: 55, tiny: 1, voids: 0 },
        { name: 'Legal basement', count: 4, clauses: 9, silly: 1, sly: 2, time: 60, tiny: 2, voids: 1 }
      ]
    : [{ name: 'Front desk', count: 6, clauses: 5, silly: 0, sly: 0, time: 40, tiny: 0, voids: 0 }];
  const TOTAL = DESKS.reduce((a, d) => a + d.count, 0);

  const els = {
    intro: $('#intro'), play: $('#play'), end: $('#end'),
    clauses: $('#clauses'), paper: $('#paper'), sig: $('#sig'), stamp: $('#stamp'),
    signBtn: $('#signBtn'), nextBtn: $('#nextBtn'), verdict: $('#verdict'), verdictText: $('#verdictText'),
    patience: $('#patience'), clerkSay: $('#clerkSay'), clerk: document.querySelector('.fp-clerk')
  };

  let run = null;
  let doc = null;
  let timer = { left: 0, max: 1, last: 0, raf: 0 };

  function sound(kind) {
    if (C.muted) return;
    const ac = C.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    if (kind === 'pen') {
      const len = 0.22;
      const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(i / 180));
      const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = buf; f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 1.2;
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + len);
      s.connect(f).connect(g).connect(ac.destination); s.start(t);
    } else if (kind === 'unpen') {
      C.sfx('paper');
    } else if (kind === 'tick') {
      C.beep(1800, 0.02, 'square', 0.03);
    }
  }

  function fill(text, deal) {
    return text.replace(/\{co\}/g, deal.co).replace(/\{thing\}/g, deal.thing).replace(/\{price\}/g, deal.price);
  }

  function setupIntro() {
    $('#introTitle').textContent = adv ? 'Three floors of paperwork' : 'Please read carefully';
    $('#introText').textContent = adv
      ? 'Twelve contracts, three desks, sneakier clauses the deeper you go. Your red ink is limited and every trap you miss is a lawsuit.'
      : 'Six contracts. Each one hides one or two ridiculous clauses. Strike them, then sign before the clerk gets bored.';
    const rules = adv
      ? ['Strike every clause that would ruin your life, then sign.', 'You get one spare drop of red ink per contract. Use it wisely.', 'Sneaky clauses look normal except for one word. Read every word.', 'In the basement, a clause can cancel another clause. Striking the canceller brings the trap back.', 'Miss three traps and the lawsuits win.']
      : ['Tap a clause to strike it out. Tap again to undo.', 'Normal boring clauses are fine. Leave those alone.', 'Sign quickly for a speed bonus.'];
    $('#introRules').innerHTML = rules.map((r) => `<li>${esc(r)}</li>`).join('');
    const best = C.getBest(`score:${C.mode}`);
    $('#introBest').textContent = best != null ? `Best ${C.mode} score: ${C.fmt(best)}` : '';
    const album = C.store.get('fp:album', {});
    $('#albumBtn').hidden = Object.keys(album).length === 0;
  }

  function show(which) {
    for (const k of ['intro', 'play', 'end']) els[k].hidden = k !== which;
    window.scrollTo({ top: 0, behavior: C.calm ? 'auto' : 'smooth' });
  }

  function start() {
    const pool = C.shuffle(D.deals);
    run = { idx: 0, deskIdx: 0, inDesk: 0, score: 0, caught: 0, traps: 0, wrong: 0, suits: 3, life: [], deals: pool, sillyBag: C.shuffle(D.silly), slyBag: C.shuffle(D.sly), plainBag: [], over: false };
    show('play');
    C.sfx('open');
    nextDoc();
  }

  function draw(bag, src) {
    if (!bag.length) bag.push(...C.shuffle(src));
    return bag.pop();
  }

  function nextDoc() {
    const desk = DESKS[run.deskIdx];
    const deal = run.deals[run.idx % run.deals.length];
    const sillyN = adv ? desk.silly : (Math.random() < 0.5 ? 1 : 2);
    const traps = [];
    for (let i = 0; i < sillyN; i++) traps.push({ kind: 'silly', pair: draw(run.sillyBag, D.silly) });
    for (let i = 0; i < desk.sly; i++) traps.push({ kind: 'sly', pair: draw(run.slyBag, D.sly) });
    const plainN = desk.clauses - traps.length - desk.voids;
    const plains = C.shuffle(D.plain).slice(0, plainN).map((t) => ({ kind: 'plain', text: t }));
    let list = C.shuffle([...plains, ...traps.map((t) => ({ kind: t.kind, text: t.pair[0], fate: t.pair[1] }))]);
    if (desk.voids) {
      const trapIdx = list.findIndex((c) => c.kind !== 'plain');
      const at = C.randInt(trapIdx + 1, list.length);
      list.splice(at, 0, { kind: 'void', target: trapIdx });
      list[trapIdx].voided = true;
    }
    list = list.map((c, i) => ({ ...c, n: i + 1, struck: false, text: c.kind === 'void' ? `Clause ${c.target + 1} above is void and has no effect whatsoever.` : fill(c.text, deal), fate: c.fate ? fill(c.fate, deal) : '' }));
    if (desk.tiny) {
      const picks = C.shuffle(list.map((_, i) => i)).slice(0, desk.tiny);
      picks.forEach((i) => { list[i].tiny = true; });
    }
    const realTraps = list.filter((c) => c.kind === 'silly' || c.kind === 'sly').length;
    doc = { deal, desk, list, ink: realTraps + 1, signed: false };
    render();
    timer.max = desk.time; timer.left = desk.time; timer.last = performance.now();
    cancelAnimationFrame(timer.raf);
    timer.raf = requestAnimationFrame(tick);
    say('Take your time.');
  }

  function render() {
    const { deal, list, desk } = doc;
    $('#seal').style.background = deal.seal;
    $('#sealMark').textContent = deal.mark;
    $('#kicker').textContent = adv ? `${desk.name} · Agreement no. ${1000 + run.idx * 37}` : `Agreement no. ${1000 + run.idx * 37}`;
    $('#docTitle').textContent = deal.title;
    $('#parties').textContent = `Between ${deal.co} and The Customer (you). Price: ${deal.price}.`;
    els.clauses.innerHTML = list.map((c, i) => `<li><button type="button" class="fp-cl${c.tiny ? ' is-tiny' : ''}" data-i="${i}" aria-pressed="false"><span>${esc(c.text)}</span><svg class="fp-mark" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M3 54C2 14 95 6 97 46 99 90 8 98 4 58 3 40 22 18 44 13"/><path d="M1 56C28 50 70 58 99 47"/></svg></button></li>`).join('');
    els.sig.classList.remove('is-on');
    els.stamp.className = 'fp-stamp';
    els.stamp.textContent = '';
    els.signBtn.hidden = false;
    els.verdict.hidden = true;
    els.paper.classList.remove('is-shake');
    hud();
    els.paper.animate?.([{ transform: 'translateY(30px) rotate(2deg)', opacity: 0 }, { transform: 'rotate(-.4deg)', opacity: 1 }], { duration: C.calm ? 1 : 380, easing: 'cubic-bezier(.2,1.2,.4,1)' });
    C.sfx('paper');
  }

  function hud() {
    $('#hudNo').textContent = `${run.idx + 1}/${TOTAL}`;
    $('#hudScore').textContent = C.fmt(run.score);
    if (adv) {
      const used = doc ? doc.list.filter((c) => c.struck).length : 0;
      const left = doc ? Math.max(0, doc.ink - used) : 0;
      $('#hudInk').textContent = '●'.repeat(left) + '○'.repeat(Math.max(0, (doc ? doc.ink : 0) - left));
      $('#hudSuits').textContent = '⚖'.repeat(run.suits) || '0';
    }
  }

  function say(t, cross) {
    if (els.clerkSay.textContent !== t) els.clerkSay.textContent = t;
    if (cross) { els.clerk.classList.remove('is-cross'); void els.clerk.offsetWidth; els.clerk.classList.add('is-cross'); }
  }

  function tick(now) {
    const dt = Math.max(0, Math.min(0.1, (now - timer.last) / 1000));
    timer.last = now;
    if (!document.hidden && doc && !doc.signed) {
      timer.left -= dt;
      const f = Math.max(0, timer.left / timer.max);
      els.patience.style.transform = `scaleX(${f})`;
      els.patience.classList.toggle('is-low', f < 0.25);
      if (!els.clerk.classList.contains('is-cross') || f < 0.1) {
        say(f > 0.7 ? 'Take your time.' : f > 0.45 ? 'Mm-hm.' : f > 0.25 ? 'Any day now.' : f > 0.1 ? 'I have a bus to catch.' : 'SIGN. IT.');
      }
      if (f < 0.25 && Math.floor(timer.left * 2) !== Math.floor((timer.left + dt) * 2)) sound('tick');
      if (timer.left <= 0) { say('Too slow. I signed it for you.', true); sign(true); return; }
    }
    if (doc && !doc.signed) timer.raf = requestAnimationFrame(tick);
  }

  function toggle(i) {
    if (!doc || doc.signed) return;
    const c = doc.list[i]; if (!c) return;
    const btn = els.clauses.querySelector(`[data-i="${i}"]`);
    if (!c.struck && adv) {
      const used = doc.list.filter((x) => x.struck).length;
      if (used >= doc.ink) { say('No more red ink for you.', true); C.sfx('error'); btn.animate?.([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 220 }); return; }
    }
    c.struck = !c.struck;
    btn.classList.toggle('is-struck', c.struck);
    btn.setAttribute('aria-pressed', String(c.struck));
    sound(c.struck ? 'pen' : 'unpen');
    if (c.struck) buzz(12);
    hud();
  }

  function sign(forced) {
    if (!doc || doc.signed) return;
    doc.signed = true;
    cancelAnimationFrame(timer.raf);
    els.signBtn.hidden = true;
    els.sig.classList.add('is-on');
    sound('pen');
    const voidC = doc.list.find((c) => c.kind === 'void');
    const voidStruck = voidC ? voidC.struck : false;
    let caught = 0, wrong = 0, missed = [], wasted = 0, live = 0;
    doc.list.forEach((c, i) => {
      const btn = els.clauses.querySelector(`[data-i="${i}"]`);
      const li = btn.parentElement;
      let note = '', cls = '';
      const isTrap = c.kind === 'silly' || c.kind === 'sly';
      const active = isTrap && (!c.voided || voidStruck);
      if (isTrap) live++;
      if (isTrap && active) {
        if (c.struck) { caught++; note = C.pick(['Caught it!', 'Nice catch.', 'Nope, not signing that.', 'Good eye.', 'Struck. Phew.']); cls = 'is-good'; btn.classList.add('was-trap'); }
        else { missed.push(c); note = `Missed. ${c.fate}`; cls = 'is-bad'; btn.classList.add('was-missed'); }
      } else if (isTrap && !active) {
        if (c.struck) { wasted++; note = `Already void, see clause ${voidC.n}. Wasted ink.`; cls = 'is-meh'; }
        else { note = `Harmless: clause ${voidC.n} cancels it. Well read.`; cls = 'is-good'; caught++; }
      } else if (c.kind === 'void' && c.struck) {
        wrong++; note = 'You struck the clause that cancelled the trap. Oops.'; cls = 'is-bad';
      } else if (c.struck) {
        wrong++; note = C.pick(['That one was perfectly normal.', 'Boring, but fine.', 'Nothing wrong with this one.', 'The clerk sighs. This was fine.']); cls = 'is-meh';
      }
      if (note) {
        const n = document.createElement('span');
        n.className = `fp-note ${cls}`;
        n.textContent = note;
        n.style.animationDelay = `${0.5 + i * 0.07}s`;
        li.append(n);
      }
    });
    const f = Math.max(0, timer.left / timer.max);
    const speed = missed.length === 0 && !forced ? Math.round(f * 50) : 0;
    const gained = caught * 100 - wrong * 40 - wasted * 20 + speed;
    run.score = Math.max(0, run.score + gained);
    run.caught += caught; run.traps += live; run.wrong += wrong;
    missed.forEach((m) => run.life.push(m.fate));
    const album = C.store.get('fp:album', {});
    missed.forEach((m) => { album[m.fate] = (album[m.fate] || 0) + 1; });
    if (missed.length) C.store.set('fp:album', album);
    if (adv) run.suits = Math.max(0, run.suits - missed.length);
    const clean = missed.length === 0;
    setTimeout(() => {
      els.stamp.textContent = clean ? 'APPROVED' : adv ? 'SUED' : 'OOPS';
      els.stamp.classList.add('is-on', clean ? 'is-good' : 'is-bad');
      if (clean) { C.sfx('stamp'); setTimeout(() => C.sfx('success'), 160); } else { C.sfx('stamp'); setTimeout(() => C.sfx('error'), 160); els.paper.classList.add('is-shake'); buzz([30, 40, 30]); }
      if (clean && wrong === 0 && caught > 0) C.confetti(50);
      hud();
      const parts = [];
      if (caught) parts.push(`+${caught * 100} for ${caught === 1 ? 'the trap' : caught + ' traps'}`);
      if (speed) parts.push(`+${speed} speed bonus`);
      if (wrong) parts.push(`-${wrong * 40} for striking normal clauses`);
      if (wasted) parts.push(`-${wasted * 20} wasted ink`);
      const head = clean ? C.pick(['Clean signature.', 'Signed, sealed, safe.', 'Not a goose in sight.', 'Flawless reading.']) : missed.length > 1 ? 'Oh dear. Plural oh dears.' : C.pick(['Oh no. Read the notes.', 'You signed something weird.', 'Your lawyer is crying.']);
      els.verdictText.textContent = `${head} ${parts.join(', ')}${parts.length ? '.' : ''}`;
      run.over = adv && run.suits <= 0;
      $('#nextBtn').textContent = run.over ? 'See the damage' : run.idx + 1 >= TOTAL ? 'Final assessment' : 'Next contract';
      els.verdict.hidden = false;
      els.nextBtn.focus({ preventScroll: true });
    }, C.calm ? 200 : 900);
  }

  function next() {
    if (!doc || !doc.signed || els.verdict.hidden) return;
    if (run.over) return finish();
    run.idx++;
    if (run.idx >= TOTAL) return finish();
    run.inDesk++;
    if (run.inDesk >= DESKS[run.deskIdx].count) {
      run.deskIdx++; run.inDesk = 0;
      C.toast(`Taking the stairs to the ${DESKS[run.deskIdx].name.toLowerCase()}...`, 2200);
    }
    nextDoc();
    window.scrollTo({ top: document.querySelector('.fp-desk').getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 0) - 8, behavior: C.calm ? 'auto' : 'smooth' });
  }

  function finish() {
    doc = null;
    const ratio = run.traps ? Math.max(0, (run.caught - run.wrong * 0.5) / run.traps) : 0;
    let rank = D.ranks[0];
    for (const r of D.ranks) if (ratio >= r[0]) rank = r;
    if (adv && run.over) rank = ['Defendant', 'Three lawsuits. The goose is testifying against you.'];
    const name = rank.length === 3 ? rank[1] : rank[0];
    const text = rank.length === 3 ? rank[2] : rank[1];
    $('#endRank').textContent = name;
    $('#endText').textContent = text;
    $('#endScore').textContent = C.fmt(run.score);
    $('#endCaught').textContent = `${run.caught}/${run.traps}`;
    const b = C.best(`score:${C.mode}`, run.score);
    $('#endBest').textContent = C.fmt(b.best);
    const life = run.life.length ? run.life : null;
    $('#lifeHead').textContent = life ? 'Your life now' : 'Your life now: unchanged';
    $('#endLife').innerHTML = life
      ? life.map((l, i) => `<li style="animation-delay:${i * 0.08}s">${esc(l)}</li>`).join('')
      : '<li class="is-clean">You agreed to nothing strange. The clerk finds this suspicious.</li>';
    show('end');
    if (b.isNew && run.score > 0) { C.confetti(); C.toast('New best score!'); C.sfx('success'); } else C.sfx('stamp');
  }

  function share() {
    const t = `Zoble Fine Print (${C.mode}): ${run ? C.fmt(run.score) : 0} points, ${run ? run.caught : 0}/${run ? run.traps : 0} traps caught.${run && run.life.length ? ' I agreed to: ' + run.life[0] : ' I agreed to nothing weird.'}`;
    (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => C.toast('Copied!'), () => C.toast(t, 4000));
  }

  async function album() {
    const a = C.store.get('fp:album', {});
    const keys = Object.keys(a);
    await C.modal({
      emoji: '📜',
      title: 'Things you agreed to',
      body: Object.assign(document.createElement('ul'), { className: 'fp-life fp-album-list', innerHTML: keys.map((k) => `<li>${esc(k)}${a[k] > 1 ? ` <b>x${a[k]}</b>` : ''}</li>`).join('') }),
      buttons: [{ label: 'Close', value: 'x' }]
    });
  }

  els.clauses.addEventListener('click', (e) => {
    const b = e.target.closest('.fp-cl'); if (!b) return;
    toggle(+b.dataset.i);
  });
  els.signBtn.addEventListener('click', () => sign(false));
  els.nextBtn.addEventListener('click', next);
  $('#startBtn').addEventListener('click', start);
  $('#againBtn').addEventListener('click', () => { setupIntro(); start(); });
  $('#shareBtn').addEventListener('click', share);
  $('#albumBtn').addEventListener('click', album);
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.curio-modal, input, textarea')) return;
    if (!els.play.hidden && doc) {
      if (/^[1-9]$/.test(e.key)) { toggle(+e.key - 1); e.preventDefault(); return; }
      if (e.key === 'Enter') {
        if (e.target.closest && e.target.closest('.fp-cl')) return;
        e.preventDefault();
        if (!doc.signed) sign(false); else next();
      }
    } else if (!els.intro.hidden && e.key === 'Enter' && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); start(); }
  });
  document.addEventListener('visibilitychange', () => { timer.last = performance.now(); });

  setupIntro();
})();
