(() => {
  const $ = (s) => document.querySelector(s);
  const C = window.Curio;
  const SIMPLE = C.simple;
  const JAR = 5;
  const ORACLE = window.FC_ORACLE || [];
  let session = [];
  const KINDS = {
    classic: { name: 'Classic', fill: 'url(#dough)', crumb: '#d9953a', w: 62 },
    advice: { name: 'Chocolate', fill: 'url(#chocDough)', crumb: '#5a2e14', w: 12 },
    love: { name: 'Strawberry', fill: 'url(#loveDough)', crumb: '#f48fb1', w: 10 },
    misfortune: { name: 'Misfortune', fill: 'url(#darkDough)', crumb: '#3f3350', w: 8 },
    gold: { name: 'Golden', fill: 'url(#goldDough)', crumb: '#ffcc33', w: 0 }
  };
  const ALL = [
    ...window.FORTUNES.map((t, i) => ({ id: 'f' + i, t, kind: 'classic' })),
    ...window.LEGENDARY.map((t, i) => ({ id: 'g' + i, t, kind: 'gold' })),
    ...window.FC_ADVICE.map((t, i) => ({ id: 'a' + i, t, kind: 'advice' })),
    ...window.FC_LOVE.map((t, i) => ({ id: 'l' + i, t, kind: 'love' })),
    ...window.FC_MISFORTUNE.map((t, i) => ({ id: 'm' + i, t, kind: 'misfortune' }))
  ];
  const WORDS = window.FC_WORDS;
  const BY = Object.fromEntries(ALL.map((f) => [f.id, f]));
  const clean = (t) => t.replace(/^GOLDEN FORTUNE: /, '');
  let state = Object.assign({ found: [], cracked: 0, words: [], lastDaily: '', streak: 0, oracle: [], asked: 0 }, C.store.get('fc:state', {}) || {});
  if (!Array.isArray(state.oracle)) state.oracle = [];
  if (typeof state.asked !== 'number') state.asked = 0;
  state.found = (Array.isArray(state.found) ? state.found : []).filter((id) => BY[id]);
  state.words = (Array.isArray(state.words) ? state.words : []).filter((i) => WORDS[i]);
  if (typeof state.cracked !== 'number') state.cracked = 0;
  const save = () => C.store.set('fc:state', state);
  const cookie = $('#cookie'), paper = $('#paper'), stage = $('#stage'), tip = $('#tip'), actions = $('#actions');
  let current = null, kind = 'classic', cracking = false, daily = false;
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  const hashStr = (s) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  function rollKind() {
    daily = !SIMPLE && state.lastDaily !== dayKey();
    if (daily) kind = 'classic';
    else if (state.cracked > 0 && state.cracked % 25 === 24) kind = 'gold';
    else if (Math.random() < 0.06) kind = 'gold';
    else {
      const tot = Object.values(KINDS).reduce((a, k) => a + k.w, 0);
      let r = Math.random() * tot;
      kind = Object.keys(KINDS).find((k) => (r -= KINDS[k].w) < 0) || 'classic';
    }
    cookie.querySelectorAll('.dough').forEach((p) => p.setAttribute('fill', KINDS[kind].fill));
    cookie.dataset.kind = kind;
    $('#ribbon').hidden = !daily;
    cookie.setAttribute('aria-label', `Crack the ${daily ? 'daily' : KINDS[kind].name.toLowerCase()} fortune cookie`);
    tip.textContent = daily ? '📅 Your daily cookie. Everyone gets the same one today.' : kind === 'gold' ? '✨ Ooh, a golden cookie. Rare fortunes inside.' : kind === 'misfortune' ? '🌑 Uh oh. A misfortune cookie. Crack at your own risk.' : kind === 'love' ? '💗 A strawberry cookie. Something sweet inside.' : kind === 'advice' ? '🍫 A chocolate cookie. It has opinions.' : 'Tap the cookie to crack it.';
  }
  function pickFortune() {
    if (daily) {
      const pool = ALL.filter((f) => f.kind === 'classic');
      return pool[hashStr(`fc-${dayKey()}`) % pool.length];
    }
    const pool = ALL.filter((f) => f.kind === kind);
    const unseen = pool.filter((f) => !state.found.includes(f.id));
    if (unseen.length && (Math.random() < .8 || unseen.length === pool.length)) return C.pick(unseen);
    return C.pick(pool);
  }
  function luckyNumbers(seed) {
    const s = new Set();
    let x = seed || Math.floor(Math.random() * 1e9);
    while (s.size < 6) { x = (x * 1103515245 + 12345) >>> 0; s.add(1 + (x >>> 8) % 49); }
    return [...s].sort((a, b) => a - b);
  }

  function crackSound() {
    if (C.muted) return;
    const ac = C.audioContext && C.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    [0, .05, .11].forEach((off, k) => {
      const len = .06;
      const buf = ac.createBuffer(1, ac.sampleRate * len, ac.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
      const src = ac.createBufferSource(); src.buffer = buf;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + k * 900; f.Q.value = 1.2;
      const g = ac.createGain(); g.gain.value = .5;
      src.connect(f).connect(g).connect(ac.destination);
      src.start(t + off);
    });
  }
  function crumbs() {
    const r = stage.getBoundingClientRect(), c = cookie.getBoundingClientRect();
    const cx = c.left - r.left + c.width / 2, cy = c.top - r.top + c.height * .45;
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('i'); el.className = 'fc-crumb';
      el.style.left = cx + 'px'; el.style.top = cy + 'px';
      el.style.setProperty('--dx', C.rand(-140, 140) + 'px'); el.style.setProperty('--dy', C.rand(-60, 90) + 'px');
      el.style.background = KINDS[kind].crumb;
      stage.append(el); setTimeout(() => el.remove(), 900);
    }
    if (kind === 'gold') for (let i = 0; i < 10; i++) { const s = document.createElement('i'); s.className = 'fc-spark'; s.textContent = '✦'; s.style.left = cx + C.rand(-120, 120) + 'px'; s.style.top = cy + C.rand(-80, 30) + 'px'; s.style.animationDelay = `${i * 50}ms`; stage.append(s); setTimeout(() => s.remove(), 1400); }
  }

  function crack() {
    if (cracking || current) return;
    cracking = true;
    cookie.classList.remove('idle', 'enter'); cookie.classList.add('wobble');
    C.beep(300, .05, 'triangle', .06);
    try { navigator.vibrate?.(20); } catch (e) { }
    setTimeout(() => {
      cookie.classList.remove('wobble'); cookie.classList.add('broken');
      cookie.disabled = true;
      crackSound(); crumbs();
      const f = pickFortune();
      const isNew = !state.found.includes(f.id);
      if (isNew) state.found.push(f.id);
      state.cracked++;
      const wi = daily ? hashStr(`w-${dayKey()}`) % WORDS.length : C.randInt(0, WORDS.length - 1);
      const newWord = !state.words.includes(wi);
      if (newWord) state.words.push(wi);
      if (daily) {
        const y = new Date(); y.setDate(y.getDate() - 1);
        state.streak = state.lastDaily === dayKey(y) ? (state.streak || 0) + 1 : 1;
        state.lastDaily = dayKey();
      }
      save();
      current = { f, nums: luckyNumbers(daily ? hashStr(`n-${dayKey()}`) : 0), isNew, word: WORDS[wi], newWord, daily };
      paper.className = `fc-paper k-${f.kind}`;
      paper.innerHTML = '';
      const front = document.createElement('div'); front.className = 'fc-front';
      const tags = [];
      if (daily) tags.push(['📅 DAILY', 'daily']);
      if (f.kind !== 'classic') tags.push([f.kind === 'gold' ? '★ GOLDEN' : KINDS[f.kind].name.toUpperCase(), f.kind]);
      if (isNew) tags.push(['NEW', 'new']);
      tags.forEach(([t, c]) => { const s = document.createElement('span'); s.className = 'tag t-' + c; s.textContent = t; front.append(s); });
      const p = document.createElement('p'); p.textContent = clean(f.t); front.append(p);
      const q = !SIMPLE && $('#ask') ? $('#ask').value.trim() : '';
      if (q) {
        const oi = C.randInt(0, ORACLE.length - 1);
        if (!state.oracle.includes(oi)) state.oracle.push(oi);
        state.asked++;
        save();
        const o = document.createElement('div'); o.className = 'fc-oracle';
        o.innerHTML = '<small>You asked</small><em></em><small>The cookie answers</small><strong></strong>';
        o.querySelector('em').textContent = `"${q.slice(0, 90)}"`;
        o.querySelector('strong').textContent = ORACLE[oi];
        front.append(o);
        $('#ask').value = '';
      }
      const n = document.createElement('div'); n.className = 'nums';
      n.innerHTML = '<small>Lucky numbers</small>' + current.nums.map((x) => `<b>${x}</b>`).join('');
      front.append(n);
      const back = document.createElement('div'); back.className = 'fc-back';
      back.innerHTML = `<small>Learn Chinese${newWord ? ' · NEW WORD' : ''}</small><b lang="zh"></b><span class="py"></span><span class="en"></span>`;
      back.querySelector('b').textContent = current.word[0];
      back.querySelector('.py').textContent = current.word[1];
      back.querySelector('.en').textContent = current.word[2];
      paper.append(front, back);
      void paper.offsetWidth; paper.classList.add('show');
      setTimeout(() => { [523, 659, 784].forEach((fr, i) => setTimeout(() => C.beep(fr * (f.kind === 'gold' ? 1.5 : f.kind === 'misfortune' ? .75 : 1), .12, f.kind === 'misfortune' ? 'sawtooth' : 'triangle', .07), i * 80)); }, 300);
      if (f.kind === 'gold') C.confetti();
      tip.textContent = daily ? `Daily cookie cracked. Streak: ${state.streak} day${state.streak === 1 ? '' : 's'}.` : isNew ? `New fortune! ${state.found.length} of ${ALL.length} collected.` : 'You have seen this one before. The universe is repeating itself.';
      actions.hidden = false;
      if (SIMPLE) {
        session.push(f);
        paintJar();
        if (session.length >= JAR) { $('#again').textContent = '🧾 The bill, please'; tip.textContent = 'That was the last cookie in the jar. Time to settle up.'; }
      }
      paint(f.id);
      checkAch();
      if (state.found.length === ALL.length && isNew) {
        C.confetti();
        C.modal({ emoji: '🥠', title: 'Fortune book complete!', body: `All ${ALL.length} fortunes collected in ${state.cracked} cookies. Your future is now fully known. Spooky.`, buttons: [{ label: 'Wow', value: 1 }] });
      }
      cracking = false;
      $('#again').focus({ preventScroll: true });
    }, 450);
  }
  function reset() {
    current = null;
    paper.classList.remove('show', 'flipped'); paper.style.opacity = 0;
    actions.hidden = true;
    cookie.classList.remove('broken'); cookie.disabled = false;
    rollKind();
    cookie.classList.add('enter');
    C.beep(500, .05, 'sine', .05);
    setTimeout(() => { cookie.classList.remove('enter'); cookie.classList.add('idle'); paper.style.opacity = ''; }, 600);
    cookie.focus({ preventScroll: true });
  }
  cookie.addEventListener('click', crack);
  $('#again').addEventListener('click', () => { if (SIMPLE && session.length >= JAR) bill(); else reset(); });
  function paintJar() {
    const j = $('#jar'); if (!j) return;
    j.innerHTML = Array.from({ length: JAR }, (_, i) => `<i class="${i < session.length ? 'gone' : ''}" aria-hidden="true"></i>`).join('') + `<span>${JAR - session.length} cookie${JAR - session.length === 1 ? '' : 's'} left in the jar</span>`;
  }
  function bill() {
    const box = $('#bill');
    const total = session.reduce((a, f) => a + clean(f.t).length, 0);
    const finale = C.pick(window.FC_FINALES || ['The jar is empty.']);
    const r = C.best('jars', (C.getBest('jars') || 0) + 1);
    box.innerHTML = `<div class="fc-bill__paper"><b class="fc-bill__shop">Golden Crumb Takeaway</b><small>Order #${C.randInt(100, 999)} · table for one · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small><h2>Your future, itemised</h2><ol></ol><div class="fc-bill__line"><span>Words of wisdom</span><span>${total}</span></div><div class="fc-bill__line"><span>Crumbs on floor</span><span>${C.randInt(40, 400)}</span></div><div class="fc-bill__line fc-bill__total"><span>TOTAL</span><span>1 future</span></div><p class="fc-bill__fin"></p><small>No refunds. Futures are final. Jars emptied: ${r.best}</small><div class="fc-bill__btns"><button type="button" class="fc-btn" id="newJar">🫙 New jar</button><button type="button" class="fc-btn fc-btn--ghost" id="toAdv">📖 Fortune book (Advanced)</button></div></div>`;
    const ol = box.querySelector('ol');
    session.forEach((f) => { const li = document.createElement('li'); li.textContent = clean(f.t); ol.append(li); });
    box.querySelector('.fc-bill__fin').textContent = finale;
    box.hidden = false;
    C.confetti();
    [392, 523, 659, 784, 1046].forEach((fr, i) => setTimeout(() => C.beep(fr, .12, 'triangle', .07), i * 90));
    box.querySelector('#newJar').addEventListener('click', () => { session = []; box.hidden = true; $('#again').textContent = '🥠 Another cookie'; paintJar(); reset(); });
    box.querySelector('#toAdv').addEventListener('click', () => C.setMode('advanced'));
    box.querySelector('#newJar').focus({ preventScroll: true });
  }
  $('#flip').addEventListener('click', () => { if (!current) return; paper.classList.toggle('flipped'); C.beep(700, .04, 'triangle', .05); });
  paper.addEventListener('click', () => { if (current) paper.classList.toggle('flipped'); });
  $('#copy').addEventListener('click', async () => {
    if (!current) return;
    const text = `🥠 My ${current.daily ? 'daily ' : ''}fortune: "${clean(current.f.t)}"\nLucky numbers: ${current.nums.join(', ')}\nWord of the cookie: ${current.word[0]} (${current.word[1]}) = ${current.word[2]}\n(cracked on Zoble)`;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) { }
    if (!ok) {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch (e) { }
      ta.remove();
    }
    C.toast(ok ? '📋 Copied! Go spread the wisdom.' : 'Could not copy. Screenshot it instead.');
  });
  window.addEventListener('keydown', (e) => {
    if (e.target !== document.body) return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!$('#bill').hidden) return; current ? (SIMPLE && session.length >= JAR ? bill() : reset()) : crack(); }
    if ((e.key === 'f' || e.key === 'F') && current) paper.classList.toggle('flipped');
  });

  const ACH = [
    ['first', '🥠', 'First crack', () => state.cracked >= 1],
    ['fifty', '📚', '50 fortunes', () => state.found.length >= 50],
    ['gold', '✨', 'Struck gold', () => state.found.some((id) => BY[id].kind === 'gold')],
    ['allkinds', '🌈', 'Every flavour', () => Object.keys(KINDS).every((k) => state.found.some((id) => BY[id].kind === k))],
    ['doom', '🌑', 'Cursed', () => state.found.filter((id) => BY[id].kind === 'misfortune').length >= 10],
    ['words', '🀄', '10 words', () => state.words.length >= 10],
    ['streak', '🔥', '3 day streak', () => state.streak >= 3],
    ['hundred', '💯', '100 cracked', () => state.cracked >= 100],
    ['oracle', '🔮', 'Asked 10 questions', () => state.asked >= 10],
    ['seer', '👁️', '20 oracle answers', () => state.oracle.length >= 20]
  ];
  let ach = C.store.get('fc:ach', []);
  if (!Array.isArray(ach)) ach = [];
  function checkAch() {
    ACH.forEach(([id, e, n, ok]) => { if (!ach.includes(id) && ok()) { ach.push(id); C.toast(`${e} Achievement: ${n}`); } });
    C.store.set('fc:ach', ach);
  }

  let filter = 'all';
  function paintTabs() {
    const tabs = [['all', 'All', ALL.length], ...Object.keys(KINDS).map((k) => [k, KINDS[k].name, ALL.filter((f) => f.kind === k).length])];
    $('#tabs').innerHTML = tabs.map(([k, n, tot]) => {
      const got = k === 'all' ? state.found.length : state.found.filter((id) => BY[id].kind === k).length;
      return `<button type="button" role="tab" class="k-${k}" aria-selected="${filter === k}" data-k="${k}">${n} <small>${got}/${tot}</small></button>`;
    }).join('') + `<span class="fc-achs">${ACH.map(([id, e, n]) => `<i class="${ach.includes(id) ? 'on' : ''}" title="${n}">${e}</i>`).join('')}</span>`;
  }
  $('#tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; filter = b.dataset.k; paint(); });
  function paint(fresh) {
    const found = state.found.length;
    $('#cracked').textContent = C.fmt(state.cracked);
    $('#found').textContent = `${found}/${ALL.length}`;
    $('#golden').textContent = state.found.filter((id) => BY[id].kind === 'gold').length;
    $('#streak').textContent = state.streak || 0;
    $('#bookCount').textContent = `${found} of ${ALL.length} collected · ${Math.round(found / ALL.length * 100)}%`;
    $('#bookBar').style.width = (found / ALL.length * 100) + '%';
    paintTabs();
    const list = $('#list');
    list.innerHTML = '';
    const ids = state.found.filter((id) => filter === 'all' || BY[id].kind === filter);
    if (!ids.length) { const li = document.createElement('li'); li.className = 'locked'; li.textContent = found ? 'None of this flavour yet. Keep cracking.' : 'Empty. Crack a cookie to start your collection.'; list.append(li); }
    ids.slice().reverse().forEach((id) => {
      const li = document.createElement('li');
      const f = BY[id];
      li.className = `k-${f.kind}` + (id === fresh ? ' fresh' : '');
      li.textContent = (f.kind === 'gold' ? '★ ' : '') + clean(f.t);
      list.append(li);
    });
    const pool = ALL.filter((f) => filter === 'all' || f.kind === filter).length;
    const left = pool - ids.length;
    if (left && ids.length) { const li = document.createElement('li'); li.className = 'locked'; li.textContent = `🔒 ${left} more hiding in cookies`; list.append(li); }
    if ($('#oracleCount')) $('#oracleCount').textContent = `${state.oracle.length} of ${ORACLE.length} oracle answers heard · ${state.asked} questions asked`;
    $('#words').innerHTML = WORDS.map((w, i) => state.words.includes(i) ? `<div class="on"><b lang="zh">${w[0]}</b><span>${w[1]}</span><small>${w[2]}</small></div>` : '<div><b>?</b><span>&nbsp;</span><small>&nbsp;</small></div>').join('');
  }
  if (SIMPLE) {
    $('#subLine').textContent = 'Five cookies in the jar. Crack them, read your future, then ask for the bill.';
    paintJar();
  }
  rollKind(); paint(); checkAch();
  window.FortuneCookie = { crack, reset, state, ALL };
})();
