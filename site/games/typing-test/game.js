(() => {
  const $ = (id) => document.getElementById(id);
  const DATA = window.TT_DATA;
  const COMMON = [...new Set(DATA.common)];
  const MODES = {
    time: { name: 'Time', ic: '⏱', c: '#ff5a36' },
    words: { name: 'Words', ic: 'Aa', c: '#2f7bf0' },
    quote: { name: 'Quotes', ic: '❝', c: '#8e3bd6' },
    code: { name: 'Code', ic: '{}', c: '#1faa59' },
    weak: { name: 'Weak keys', ic: '◎', c: '#ff9a3c' }
  };
  const SUBS = { time: [15, 30, 60, 120], words: [10, 25, 50, 100], quote: ['short', 'medium', 'long', 'any'], code: ['js', 'py', 'css', 'html'], weak: [30, 60] };
  const SUBLAB = { short: 'Short', medium: 'Medium', long: 'Long', any: 'Any', js: 'JavaScript', py: 'Python', css: 'CSS', html: 'HTML' };
  const PACKS = { common: 'Common words', extra: 'Bigger words', animals: 'Animals', space: 'Space', food: 'Food', nature: 'Nature', science: 'Science', tricky: 'Tricky spellings' };
  const RANKS = [[0, '🐌', 'Snail'], [20, '🐢', 'Tortoise'], [35, '🐇', 'Rabbit'], [50, '🦊', 'Fox'], [65, '🐎', 'Horse'], [80, '🐆', 'Cheetah'], [100, '🦅', 'Falcon'], [120, '🚀', 'Rocket']];
  const ACH = [
    { id: 'first', em: '⌨️', name: 'First Words', desc: 'Finish any test.' },
    { id: 'w40', em: '🐇', name: 'Hop Along', desc: 'Reach 40 WPM.' },
    { id: 'w60', em: '🦊', name: 'Quick Fox', desc: 'Reach 60 WPM.' },
    { id: 'w80', em: '🐆', name: 'Cheetah', desc: 'Reach 80 WPM.' },
    { id: 'w100', em: '🦅', name: 'Falcon', desc: 'Reach 100 WPM.' },
    { id: 'w120', em: '🚀', name: 'Rocket Fingers', desc: 'Reach 120 WPM.' },
    { id: 'acc', em: '🎯', name: 'Spotless', desc: '100% accuracy over 25+ words.' },
    { id: 'quote', em: '📜', name: 'Quote Collector', desc: 'Finish 10 different quotes.' },
    { id: 'code', em: '💻', name: 'Hello, World', desc: 'Finish a code snippet.' },
    { id: 'poly', em: '🌐', name: 'Polyglot', desc: 'Finish code in all four languages.' },
    { id: 'marathon', em: '🏃', name: 'Marathon', desc: 'Finish a 120 second test.' },
    { id: 'daily', em: '📅', name: 'Daily Typist', desc: 'Finish a daily test.' },
    { id: 'weak', em: '🩹', name: 'Weak Spot', desc: 'Finish a weak keys practice.' },
    { id: 'punct', em: '❗', name: 'Punctual', desc: '50+ WPM with punctuation on.' },
    { id: 'nums', em: '🔢', name: 'Number Cruncher', desc: '50+ WPM with numbers on.' },
    { id: 'strict', em: '🧱', name: 'Iron Fingers', desc: 'Finish a strict test.' },
    { id: 'steady', em: '📏', name: 'Metronome', desc: '80% consistency on a 30s+ test.' },
    { id: 'packs', em: '🦁', name: 'Explorer', desc: 'Try four different word packs.' },
    { id: 'streak', em: '🔥', name: 'On Fire', desc: '100 correct keys in a row.' },
    { id: 'regular', em: '🗓️', name: 'Regular', desc: 'Finish 50 tests.' }
  ];

  const fresh = () => ({ v: 2, mode: 'time', sub: { time: 30, words: 25, quote: 'medium', code: 'js', weak: 30 }, pack: 'common', punct: false, nums: false, strict: false, daily: false, sound: 'click', caret: 'line', smooth: true, kb: true, size: 'm', hist: [], keys: {}, ach: {}, dailies: {}, tot: { tests: 0, ms: 0, chars: 0 }, quotes: {}, langs: {}, packs: {} });
  let P = fresh();
  try { const raw = Curio.store.get('tt:v2', null); if (raw && raw.v === 2) P = Object.assign(fresh(), raw); } catch {}
  ['keys', 'ach', 'dailies', 'quotes', 'langs', 'packs'].forEach((k) => { if (!P[k] || typeof P[k] !== 'object' || Array.isArray(P[k])) P[k] = {}; });
  if (!Array.isArray(P.hist)) P.hist = [];
  if (!P.tot || typeof P.tot !== 'object') P.tot = fresh().tot;
  P.sub = Object.assign(fresh().sub, P.sub && typeof P.sub === 'object' ? P.sub : {});
  Object.keys(SUBS).forEach((m) => { if (!SUBS[m].includes(P.sub[m])) P.sub[m] = fresh().sub[m]; });
  if (!MODES[P.mode]) P.mode = 'time';
  if (!PACKS[P.pack]) P.pack = 'common';
  const legacySecs = Curio.store.get('tt-mode', null);
  if (Curio.store.get('tt:v2', null) == null && (legacySecs === 30 || legacySecs === 60)) P.sub.time = legacySecs;
  const save = () => Curio.store.set('tt:v2', P);

  const box = $('box'), wordsEl = $('words'), inp = $('inp'), caret = $('caret'), view = $('view');
  let text = '', spans = [], wordEls = [], wordOf = [], typed = '', okCount = 0;
  let keys = 0, keyOk = 0, running = false, finished = false, startAt = 0, accMs = 0, paused = false;
  let samples = [], errSec = [], ticker = 0, lastSecond = 0, stamps = [], KS = {}, lastKeyAt = 0, streak = 0, maxStreak = 0;
  let curQuote = null, curKey = '', rng = Math.random, lastQuoteIdx = -1, lastResult = null, extraCount = 0;

  const mode = () => P.mode, sub = () => P.sub[P.mode];
  const timed = () => P.mode === 'time' || P.mode === 'weak';
  const isCode = () => P.mode === 'code';
  const usesWords = () => P.mode === 'time' || P.mode === 'words';
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function seeded(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const pickR = (arr) => arr[Math.floor(rng() * arr.length)];

  function cfgKey() {
    const m = P.mode, s = sub();
    if (m === 'time' || m === 'words') return (m === 'time' ? 'wpm' + s : 'words' + s) + (P.pack !== 'common' ? '-' + P.pack : '') + (P.punct ? '-p' : '') + (P.nums ? '-n' : '');
    return m + '-' + s;
  }
  function cfgLabel() {
    const m = P.mode, s = sub();
    let l = m === 'time' ? s + 's' : m === 'words' ? s + ' words' : m === 'quote' ? SUBLAB[s] + ' quote' : m === 'code' ? SUBLAB[s] + ' code' : 'Weak keys ' + s + 's';
    if (usesWords()) { if (P.pack !== 'common') l += ', ' + PACKS[P.pack]; if (P.punct) l += ', punctuation'; if (P.nums) l += ', numbers'; }
    if (P.strict) l += ', strict';
    return l;
  }

  function packList() { return P.pack === 'common' ? COMMON : P.pack === 'extra' ? DATA.extra : DATA.themes[P.pack] || COMMON; }
  function weakLetters() {
    const L = 'abcdefghijklmnopqrstuvwxyz'.split('').map((c) => ({ c, s: P.keys[c] })).filter((x) => x.s && x.s.n >= 8);
    if (L.length < 8) return null;
    const avgs = L.map((x) => x.s.tn ? x.s.t / x.s.tn : 0).filter(Boolean).sort((a, b) => a - b);
    const med = avgs[Math.floor(avgs.length / 2)] || 200;
    return L.map((x) => ({ c: x.c, score: (x.s.miss / x.s.n) * 4 + ((x.s.tn ? x.s.t / x.s.tn : med) / med - 1) })).sort((a, b) => b.score - a.score).slice(0, 5).map((x) => x.c);
  }
  let weakSet = null;
  function genWords(n) {
    let list = packList();
    if (P.mode === 'weak') {
      const all = [...new Set([...COMMON, ...DATA.extra, ...Object.values(DATA.themes).flat()])].filter((x) => /^[a-z]+$/.test(x));
      const ws = weakSet || ['q', 'z', 'x', 'j', 'k'];
      list = all.filter((x) => ws.some((c) => x.includes(c)));
    }
    const out = []; let prev = '';
    while (out.length < n) { const x = pickR(list); if (x && x !== prev) { out.push(x); prev = x; } }
    if (P.mode === 'weak') return out.join(' ');
    if (P.nums) for (let i = 0; i < out.length; i++) if (rng() < .1) out[i] = rng() < .3 ? String(1900 + Math.floor(rng() * 130)) : String(1 + Math.floor(rng() * (rng() < .5 ? 99 : 999)));
    if (P.punct) {
      let left = 0;
      for (let i = 0; i < out.length; i++) {
        if (left <= 0) { left = 5 + Math.floor(rng() * 8); out[i] = out[i][0].toUpperCase() + out[i].slice(1); }
        left--;
        if (left === 0 || i === out.length - 1) { const r = rng(); out[i] += r < .1 ? '?' : r < .17 ? '!' : '.'; }
        else {
          const r = rng();
          if (r < .1) out[i] += ',';
          else if (r < .13) out[i] = '"' + out[i] + '"';
          else if (r < .15) out[i] = '(' + out[i] + ')';
          else if (r < .16) out[i] += ':';
          else if (r < .17) out[i] += ';';
        }
      }
    }
    return out.join(' ');
  }
  function makeText() {
    curQuote = null;
    if (usesWords() || P.mode === 'weak') return genWords(timed() ? 260 : sub());
    if (P.mode === 'quote') {
      const s = sub();
      const pool = DATA.quotes.map((q, i) => ({ q, i })).filter(({ q }) => s === 'any' || (s === 'short' ? q.t.length <= 100 : s === 'medium' ? q.t.length > 100 && q.t.length <= 220 : q.t.length > 220));
      let p = pickR(pool);
      if (pool.length > 1 && p.i === lastQuoteIdx && !P.daily) p = pool.find((x) => x.i !== lastQuoteIdx);
      lastQuoteIdx = p.i; curQuote = p;
      return p.q.t;
    }
    return pickR(DATA.code[sub()]);
  }

  function mkWord() { const w = document.createElement('span'); w.className = 'tt-word'; return w; }
  function addText(str) {
    const frag = document.createDocumentFragment();
    let word = mkWord();
    const start = text.length;
    text += str;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i], s = document.createElement('span');
      if (ch === '\n') {
        s.className = 'tt-ch nl'; s.textContent = '↵'; word.append(s); spans.push(s); wordOf.push(wordEls.length);
        wordEls.push(word); frag.append(word, document.createElement('br')); word = mkWord(); continue;
      }
      s.className = 'tt-ch'; s.textContent = ch; word.append(s); spans.push(s); wordOf.push(wordEls.length);
      if (ch === ' ') { wordEls.push(word); frag.append(word); word = mkWord(); }
    }
    if (word.childNodes.length) { wordEls.push(word); frag.append(word); }
    wordsEl.append(frag);
    return start;
  }
  function appendMore() {
    if (extraCount > 20) return;
    extraCount++;
    const last = wordEls[wordEls.length - 1];
    if (last && text[text.length - 1] !== ' ') { const s = document.createElement('span'); s.className = 'tt-ch'; s.textContent = ' '; last.append(s); spans.push(s); wordOf.push(wordEls.length - 1); text += ' '; }
    addText(genWords(120));
  }

  function reset(keepText) {
    clearInterval(ticker);
    const prevText = text;
    rng = P.daily && P.mode !== 'weak' ? seeded(today() + cfgKey()) : Math.random;
    if (P.mode === 'weak') weakSet = weakLetters();
    text = ''; spans = []; wordEls = []; wordOf = []; extraCount = 0;
    wordsEl.innerHTML = ''; wordsEl.append(caret);
    if (keepText && prevText) addText(prevText); else addText(makeText());
    typed = ''; okCount = 0; keys = 0; keyOk = 0; running = false; finished = false; accMs = 0; paused = false;
    samples = []; errSec = []; lastSecond = 0; stamps = []; KS = {}; lastKeyAt = 0; streak = 0; maxStreak = 0;
    inp.value = ''; inp.disabled = false;
    wordsEl.style.transform = '';
    box.classList.remove('is-typing');
    box.classList.toggle('is-code', isCode());
    $('results').classList.remove('is-on');
    $('time').textContent = timed() ? sub() : '0'; $('timeLab').textContent = timed() ? 'Seconds' : 'Time';
    $('wpm').textContent = '0'; $('acc').textContent = '100%'; $('streak').textContent = '0'; $('streakPill').classList.remove('is-hot');
    $('prog').style.width = '0';
    $('by').textContent = curQuote ? '- ' + curQuote.q.a : P.mode === 'weak' ? 'Practising: ' + (weakSet || ['q', 'z', 'x', 'j', 'k']).join(' ').toUpperCase() + (weakSet ? '' : ' (play a few tests so we can find your real weak keys)') : P.daily ? 'Daily test for ' + today() + ': same text for everyone' : '';
    curKey = cfgKey();
    const pb = Curio.getBest(curKey);
    $('bestline').textContent = pb != null ? pb + ' WPM (' + cfgLabel() + ')' : '-';
    requestAnimationFrame(() => { paint(0, 1); });
    nextKey();
  }

  const elapsed = () => accMs + (running && !paused ? performance.now() - startAt : 0);

  function paint(from, to) {
    const touched = new Set();
    for (let i = Math.max(0, from); i < to && i < spans.length; i++) {
      const s = spans[i];
      const cls = i < typed.length ? (typed[i] === text[i] ? ' ok' : ' bad') : '';
      s.className = 'tt-ch' + (text[i] === '\n' ? ' nl' : '') + cls;
      touched.add(wordOf[i]);
    }
    touched.forEach((wi) => { const w = wordEls[wi]; if (w) w.classList.toggle('has-err', !!w.querySelector('.bad')); });
    placeCaret();
  }
  function placeCaret() {
    const idx = Math.min(typed.length, spans.length - 1);
    const cur = spans[idx]; if (!cur) return;
    const atEnd = typed.length >= spans.length;
    const left = cur.offsetLeft + (atEnd ? cur.offsetWidth : 0), top = cur.offsetTop;
    caret.style.left = left + 'px'; caret.style.top = top + 'px';
    const lh = parseFloat(getComputedStyle(wordsEl).lineHeight) || cur.offsetHeight || 30;
    const keep = isCode() ? 3 : 1;
    const line = Math.round(top / lh);
    wordsEl.style.transform = `translateY(${-Math.max(0, line - keep) * lh}px)`;
  }

  const SHIFT = { '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/', '~': '`' };
  const keyId = (ch) => ch === ' ' ? 'space' : ch === '\n' ? 'enter' : /[A-Z]/.test(ch) ? ch.toLowerCase() : SHIFT[ch] || ch;
  const needsShift = (ch) => /[A-Z]/.test(ch) || !!SHIFT[ch];
  const ROWS = [
    '` 1 2 3 4 5 6 7 8 9 0 - ='.split(' '),
    'q w e r t y u i o p [ ] \\'.split(' '),
    "a s d f g h j k l ; ' enter".split(' '),
    'shift z x c v b n m , . / shift'.split(' '),
    ['space']
  ];
  const KLAB = { enter: ['↵', 'w2'], shift: ['⇧', 'w2'], space: ['space', 'w6'] };
  function kbHTML() {
    return ROWS.map((r) => `<div class="tt-kb-row">${r.map((k) => { const [lab, w] = KLAB[k] || [k, '']; return `<div class="tt-key ${w}" data-k="${k === '\\' ? 'bs' : k}">${lab}</div>`; }).join('')}</div>`).join('');
  }
  const kSel = (id) => `[data-k="${id === '\\' ? 'bs' : id.replace(/"/g, '\\"')}"]`;
  const liveKb = $('liveKb');
  liveKb.innerHTML = kbHTML();
  function nextKey() {
    liveKb.querySelectorAll('.is-next').forEach((e) => e.classList.remove('is-next'));
    const ch = text[typed.length]; if (ch == null) return;
    const el = liveKb.querySelector(kSel(keyId(ch))); el && el.classList.add('is-next');
    if (needsShift(ch)) liveKb.querySelectorAll('[data-k="shift"]').forEach((e) => e.classList.add('is-next'));
  }
  function flashKey(ch, ok) {
    if (!P.kb) return;
    const el = liveKb.querySelector(kSel(keyId(ch))); if (!el) return;
    el.classList.remove('is-hit', 'is-miss'); void el.offsetWidth; el.classList.add(ok ? 'is-hit' : 'is-miss');
    setTimeout(() => el.classList.remove('is-hit', 'is-miss'), 130);
  }

  let noiseBuf = null;
  function sfx(kind) {
    if (Curio.muted || P.sound === 'off') return;
    const ac = Curio.audioContext && Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    const tone = (f0, f1, d, wave, v, at = 0) => {
      const o = ac.createOscillator(), gn = ac.createGain();
      o.type = wave; o.frequency.setValueAtTime(f0, t + at); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + at + d);
      gn.gain.setValueAtTime(.0001, t + at); gn.gain.exponentialRampToValueAtTime(v, t + at + .003); gn.gain.exponentialRampToValueAtTime(.0001, t + at + d);
      o.connect(gn).connect(ac.destination); o.start(t + at); o.stop(t + at + d + .02);
    };
    const noise = (d, f, v, type = 'bandpass') => {
      if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate * .2, ac.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
      const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), gn = ac.createGain();
      s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f * (.9 + Math.random() * .2);
      gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(.0001, t + d);
      s.connect(fl).connect(gn).connect(ac.destination); s.start(t, Math.random() * .1); s.stop(t + d + .02);
    };
    if (kind === 'key') {
      if (P.sound === 'click') { noise(.025, 4200, .09, 'highpass'); tone(190, 120, .03, 'sine', .05); }
      else if (P.sound === 'type') { noise(.06, 1500, .22); tone(2400, 0, .02, 'square', .015); }
      else tone(420 + Math.random() * 160, 900, .06, 'sine', .07);
    } else if (kind === 'err') tone(150, 110, .07, 'square', .035);
    else if (kind === 'streak') { tone(880, 0, .08, 'triangle', .06); tone(1320, 0, .12, 'triangle', .05, .06); }
    else if (kind === 'done') { if (P.sound === 'type') tone(2093, 0, .7, 'sine', .07); [523, 659, 784, 1046].forEach((f, i) => tone(f, 0, .2, 'triangle', .07, i * .08)); }
  }

  function recordKey(ch, ok, now) {
    const id = keyId(ch);
    const s = KS[id] || (KS[id] = { n: 0, miss: 0, t: 0, tn: 0 });
    s.n++; if (!ok) s.miss++;
    const dt = now - lastKeyAt;
    if (lastKeyAt && ok && dt < 1500) { s.t += dt; s.tn++; }
    lastKeyAt = now;
  }
  function startRun(now) {
    running = true; startAt = now; lastSecond = 0;
    ticker = setInterval(tick, 100);
    box.classList.add('is-typing');
  }
  function mistake() {
    const sec = Math.floor(elapsed() / 1000);
    errSec[sec] = (errSec[sec] || 0) + 1;
    streak = 0; $('streak').textContent = '0'; $('streakPill').classList.remove('is-hot');
    sfx('err');
  }
  function popStreak() {
    const r = caret.getBoundingClientRect();
    const el = document.createElement('div'); el.className = 'tt-combo'; el.textContent = '🔥 ' + streak + ' in a row!';
    el.style.left = Math.min(innerWidth - 80, Math.max(80, r.left)) + 'px'; el.style.top = (r.top - 10) + 'px';
    document.body.append(el); setTimeout(() => el.remove(), 900);
    sfx('streak');
  }

  function onInput() {
    if (finished) { inp.value = typed; return; }
    let val = inp.value;
    if (!isCode()) val = val.replace(/\n/g, ' ');
    if (val.length > text.length) val = val.slice(0, text.length);
    let d = 0;
    const lim = Math.min(typed.length, val.length);
    while (d < lim && typed[d] === val[d]) d++;
    const now = performance.now();
    if (P.strict && val.length > typed.length) {
      for (let i = d; i < val.length; i++) {
        if (val[i] !== text[i]) {
          if (!running) startRun(now);
          keys++; recordKey(text[i], false, now); mistake(); flashKey(text[i], false);
          inp.value = typed;
          box.classList.remove('is-shake'); void box.offsetWidth; box.classList.add('is-shake');
          liveStats();
          return;
        }
      }
    }
    if (!running && val.length) startRun(now);
    let newKeys = 0;
    for (let i = d; i < val.length; i++) {
      if (i >= typed.length || typed[i] !== val[i]) {
        const ok = val[i] === text[i];
        keys++; newKeys++; recordKey(text[i], ok, now); stamps[i] = now; flashKey(text[i], ok);
        if (ok) { keyOk++; streak++; maxStreak = Math.max(maxStreak, streak); if (streak % 50 === 0) popStreak(); }
        else mistake();
      }
    }
    if (newKeys && streak > 0) { $('streak').textContent = streak; $('streakPill').classList.toggle('is-hot', streak >= 25); }
    if (newKeys) { const okLast = val[val.length - 1] === text[val.length - 1]; if (okLast) sfx('key'); }
    if (isCode() && val.length > typed.length && val[val.length - 1] === '\n' && text[val.length - 1] === '\n') {
      let j = val.length;
      while (text[j] === ' ') { val += ' '; stamps[j] = now; j++; }
    }
    for (let i = d; i < typed.length; i++) if (typed[i] === text[i]) okCount--;
    for (let i = d; i < val.length; i++) if (val[i] === text[i]) okCount++;
    const old = typed.length;
    typed = val;
    if (inp.value !== val) inp.value = val;
    paint(d, Math.max(old, val.length) + 1);
    nextKey();
    liveStats();
    if (timed() && typed.length > text.length - 80) appendMore();
    if (!timed() && typed.length >= text.length) finish();
  }

  function liveStats() {
    const min = Math.max(elapsed(), 1000) / 60000;
    $('wpm').textContent = Math.round(okCount / 5 / min);
    $('acc').textContent = (keys ? Math.round(keyOk / keys * 100) : 100) + '%';
    if (!timed()) $('prog').style.width = (typed.length / text.length * 100) + '%';
  }
  function tick() {
    if (paused) return;
    const e = elapsed();
    if (timed()) {
      const left = Math.max(0, sub() - e / 1000);
      $('time').textContent = Math.ceil(left);
      $('prog').style.width = Math.min(100, e / 1000 / sub() * 100) + '%';
    } else $('time').textContent = Math.floor(e / 1000);
    while (lastSecond + 1 <= (timed() ? Math.min(sub(), e / 1000) : e / 1000)) { lastSecond++; samples.push({ t: lastSecond, ok: okCount, typed: typed.length }); }
    liveStats();
    if (timed() && e / 1000 >= sub()) finish();
  }

  function rankFor(w) { let r = RANKS[0], next = null; RANKS.forEach((x, i) => { if (w >= x[0]) { r = x; next = RANKS[i + 1] || null; } }); return { r, next }; }
  function verdictFor(w, a) {
    if (a < 85 && w > 30) return 'Speedy, but a lot of slips. Ease off a little and accuracy will lift your score.';
    if (w >= 120) return 'Absolute keyboard wizard. Your fingers are a blur.';
    if (w >= 90) return 'Professional-grade fingers. Seriously quick.';
    if (w >= 70) return 'Faster than most office workers. Nice!';
    if (w >= 50) return 'Comfortably above average. Smooth typing.';
    if (w >= 35) return 'Right around the average typist. Solid.';
    if (w >= 20) return 'Steady and careful. Practice pays off quickly.';
    return 'Every expert started here. Keep your eyes on the screen and try again.';
  }

  function finish() {
    if (finished) return;
    const dur = timed() ? Math.min(sub(), Math.max(1, elapsed() / 1000)) : Math.max(.5, elapsed() / 1000);
    finished = true; running = false;
    clearInterval(ticker);
    if (!samples.length || samples[samples.length - 1].t < dur - .3) samples.push({ t: dur, ok: okCount, typed: typed.length });
    inp.blur();
    box.classList.remove('is-typing', 'is-focus');
    const wpm = Math.round(okCount / 5 / (dur / 60));
    const raw = Math.round(typed.length / 5 / (dur / 60));
    const accuracy = keys ? Math.round(keyOk / keys * 1000) / 10 : 0;
    const per = samples.map((s, i) => { const p = samples[i - 1] || { t: 0, typed: 0 }; return (s.typed - p.typed) / 5 / ((s.t - p.t) / 60 || 1); });
    const mean = per.length ? per.reduce((a, b) => a + b, 0) / per.length : 0;
    const sd = per.length > 1 ? Math.sqrt(per.reduce((a, b) => a + (b - mean) ** 2, 0) / per.length) : 0;
    const consistency = mean ? Math.max(0, Math.min(100, Math.round(100 - sd / mean * 100))) : 0;
    const firstEver = Curio.getBest(curKey) == null;
    const b = Curio.best(curKey, wpm, true);
    const improved = b.isNew && !firstEver && wpm > 0;
    Object.entries(KS).forEach(([k, s]) => { const t = P.keys[k] || (P.keys[k] = { n: 0, miss: 0, t: 0, tn: 0 }); t.n += s.n; t.miss += s.miss; t.t += Math.round(s.t); t.tn += s.tn; });
    P.hist.push({ w: wpm, a: accuracy, r: raw, c: consistency, l: cfgLabel(), k: curKey, m: P.mode, ts: Date.now() });
    if (P.hist.length > 120) P.hist.shift();
    P.tot.tests++; P.tot.ms += Math.round(dur * 1000); P.tot.chars += typed.length;
    if (usesWords()) P.packs[P.pack] = 1;
    if (P.mode === 'quote' && curQuote) P.quotes[curQuote.i] = 1;
    if (P.mode === 'code') P.langs[sub()] = 1;
    let dailyNote = '';
    if (P.daily && P.mode !== 'weak') { const dk = today() + ':' + curKey; if (P.dailies[dk] == null || wpm > P.dailies[dk]) P.dailies[dk] = wpm; dailyNote = ' Daily best today: ' + P.dailies[dk] + ' WPM.'; }
    save();
    const wordsTyped = okCount / 5;
    unlock('first');
    [[40, 'w40'], [60, 'w60'], [80, 'w80'], [100, 'w100'], [120, 'w120']].forEach(([t, id]) => { if (wpm >= t && accuracy >= 80) unlock(id); });
    if (accuracy === 100 && wordsTyped >= 25) unlock('acc');
    if (Object.keys(P.quotes).length >= 10) unlock('quote');
    if (P.mode === 'code' && typed.length >= text.length) unlock('code');
    if (['js', 'py', 'css', 'html'].every((l) => P.langs[l])) unlock('poly');
    if (P.mode === 'time' && sub() === 120) unlock('marathon');
    if (P.daily && P.mode !== 'weak') unlock('daily');
    if (P.mode === 'weak') unlock('weak');
    if (usesWords() && P.punct && wpm >= 50) unlock('punct');
    if (usesWords() && P.nums && wpm >= 50) unlock('nums');
    if (P.strict && wordsTyped >= 10) unlock('strict');
    if (dur >= 30 && consistency >= 80) unlock('steady');
    if (Object.keys(P.packs).length >= 4) unlock('packs');
    if (maxStreak >= 100) unlock('streak');
    if (P.tot.tests >= 50) unlock('regular');

    $('time').textContent = timed() ? '0' : Math.round(dur); $('wpm').textContent = wpm; $('prog').style.width = '100%';
    $('bestline').textContent = b.best + ' WPM (' + cfgLabel() + ')';
    drawGauge(wpm);
    const { r, next } = rankFor(wpm);
    const into = next ? (wpm - r[0]) / (next[0] - r[0]) : 1;
    $('rank').innerHTML = `<div class="tt-rank-em">${r[1]}</div><div><small>Your rank</small><b>${r[2]}</b><div class="tt-rank-bar"><i style="width:${Math.round(into * 100)}%"></i></div><span>${next ? (next[0] - wpm) + ' WPM to ' + next[1] + ' ' + next[2] : 'Top of the ladder!'}</span></div>`;
    $('verdict').innerHTML = (improved ? '<span class="tt-new">New best</span>' : '') + verdictFor(wpm, accuracy) + dailyNote;
    const tiles = [['Accuracy', accuracy + '%'], ['Raw WPM', raw], ['Consistency', consistency + '%'], ['Mistakes', keys - keyOk], ['Time', (Math.round(dur * 10) / 10) + 's'], ['Best', b.best]];
    $('tiles').innerHTML = tiles.map(([a, v]) => `<div><b>${v}</b><span>${a}</span></div>`).join('');
    drawChart();
    heat.scope = 'test'; paintHeatToggles(); drawHeat();
    drawInsights(accuracy, consistency);
    $('results').classList.add('is-on');
    setTimeout(() => $('results').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
    sfx('done');
    if (improved || wpm >= 80) Curio.confetti();
    lastResult = { wpm, accuracy, label: cfgLabel(), rank: r[2], daily: P.daily && P.mode !== 'weak' };
    $('again').focus({ preventScroll: true });
    if (!$('info').hidden && $('info').dataset.p === 'stats') renderInfo('stats');
  }

  function drawGauge(w) {
    const svg = $('gauge'), cx = 120, cy = 104, R = 86, MAX = 150;
    const ang = (v) => Math.PI * (1 - Math.min(MAX, Math.max(0, v)) / MAX);
    const pt = (a, r) => [cx + Math.cos(a) * r, cy - Math.sin(a) * r];
    const cols = ['#9aa6b4', '#7cc44a', '#1faa59', '#2f7bf0', '#8e3bd6', '#ff5a36'];
    let arcs = '';
    for (let i = 0; i < 6; i++) { const v0 = i * 25, v1 = v0 + 25; const [x0, y0] = pt(ang(v0), R), [x1, y1] = pt(ang(v1), R); arcs += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}" stroke="${cols[i]}" stroke-width="14" fill="none" opacity=".9"/>`; }
    let ticks = '';
    for (let v = 0; v <= MAX; v += 25) { const [x0, y0] = pt(ang(v), R - 12), [x1, y1] = pt(ang(v), R - 20), [tx, ty] = pt(ang(v), R + 14); ticks += `<line x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="var(--ink-3)" stroke-width="2"/><text x="${tx.toFixed(1)}" y="${(ty + 3).toFixed(1)}" text-anchor="middle">${v}</text>`; }
    const a = ang(w), [nx, ny] = pt(a, R - 26);
    svg.innerHTML = `${arcs}${ticks}<line x1="${cx}" y1="${cy}" x2="${nx.toFixed(1)}" y2="${ny.toFixed(1)}" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"><animateTransform attributeName="transform" type="rotate" values="${((a - Math.PI) * -180 / Math.PI).toFixed(1)} ${cx} ${cy};6 ${cx} ${cy};0 ${cx} ${cy}" dur="1.1s" calcMode="spline" keySplines=".2 .8 .3 1;.4 0 .6 1" keyTimes="0;.7;1" fill="freeze"/></line><circle cx="${cx}" cy="${cy}" r="9" fill="var(--ink)"/><circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--accent)"/><text class="tt-gv" x="${cx}" y="${cy + 44}" text-anchor="middle">${w}<tspan class="tt-gu" dx="4">WPM</tspan></text>`;
  }
  function drawChart() {
    const svg = $('chart');
    const X0 = 40, X1 = 625, Y0 = 190, Y1 = 14;
    const pts = samples.map((s, i) => { const prev = samples[i - 1] || { t: 0, typed: 0 }; return { t: s.t, wpm: s.ok / 5 / (s.t / 60), raw: Math.max(0, (s.typed - prev.typed) / 5 / ((s.t - prev.t) / 60 || 1)) }; });
    if (!pts.length) { svg.innerHTML = ''; return; }
    const maxV = Math.max(40, ...pts.map((p) => Math.max(p.wpm, p.raw)));
    const top = Math.ceil(maxV / 20) * 20;
    const T = Math.max(...pts.map((p) => p.t), 1);
    const x = (t) => X0 + t / T * (X1 - X0), y = (v) => Y0 - v / top * (Y0 - Y1);
    const path = (k) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p[k]).toFixed(1)}`).join(' ');
    let grid = '';
    for (let v = 0; v <= top; v += top / 4) grid += `<line x1="${X0}" x2="${X1}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${X0 - 8}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`;
    const step = T > 60 ? 20 : T > 30 ? 10 : 5;
    for (let t = step; t <= T; t += step) grid += `<text x="${x(t)}" y="${Y0 + 20}" text-anchor="middle">${t}s</text>`;
    let errs = '';
    errSec.forEach((n, s) => { if (n) errs += `<text x="${x(Math.min(T, s + .5)).toFixed(1)}" y="${Y1 + 10}" text-anchor="middle" style="fill:var(--bad);font-weight:900">✕${n > 1 ? n : ''}</text>`; });
    const dots = pts.map((p) => `<circle cx="${x(p.t).toFixed(1)}" cy="${y(p.wpm).toFixed(1)}" r="3" fill="var(--accent)"/>`).join('');
    svg.innerHTML = `<defs><linearGradient id="ttfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".3"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>${grid}
      <path d="${path('raw')}" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="5 5" stroke-linejoin="round"/>
      <path d="${path('wpm')} L${x(pts[pts.length - 1].t)} ${Y0} L${x(pts[0].t)} ${Y0} Z" fill="url(#ttfill)"/>
      <path d="${path('wpm')}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>${dots}${errs}`;
  }

  const heat = { view: 'acc', scope: 'test' };
  function paintHeatToggles() {
    $('heatView').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === heat.view)));
    $('heatScope').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === heat.scope)));
  }
  function drawHeat(target = $('heatKb'), legend = $('heatLegend'), src = heat.scope === 'all' ? P.keys : KS, view = heat.view) {
    target.innerHTML = kbHTML();
    const dark = Curio.isDark();
    const speeds = Object.values(src).filter((s) => s.tn >= 2).map((s) => s.t / s.tn).sort((a, b) => a - b);
    const med = speeds[Math.floor(speeds.length / 2)] || 200;
    target.querySelectorAll('.tt-key').forEach((el) => {
      const id = el.dataset.k === 'bs' ? '\\' : el.dataset.k;
      const s = src[id];
      if (!s || !s.n) return;
      let hue, strength;
      if (view === 'acc') { const r = s.miss / s.n; hue = 140 - Math.min(1, r / .2) * 140; strength = Math.min(1, .35 + s.n / 30); el.title = `${id}: ${s.miss} missed of ${s.n}`; el.innerHTML += `<small>${Math.round((1 - r) * 100)}%</small>`; }
      else { if (!s.tn) return; const ms = s.t / s.tn, r = Math.max(-1, Math.min(1, (ms / med - 1) * 2)); hue = r < 0 ? 200 : 200 - r * 175; strength = .45 + Math.abs(r) * .45; el.title = `${id}: ${Math.round(ms)}ms on average`; el.innerHTML += `<small>${Math.round(ms)}</small>`; }
      el.style.background = `hsl(${hue.toFixed(0)} 75% ${dark ? 38 : 62}% / ${strength.toFixed(2)})`;
      el.style.borderColor = `hsl(${hue.toFixed(0)} 70% ${dark ? 45 : 50}%)`;
    });
    legend.innerHTML = view === 'acc' ? `<span>Clean</span><i style="background:linear-gradient(90deg,hsl(140 75% 55%),hsl(60 75% 55%),hsl(0 75% 55%))"></i><span>Missed often</span>` : `<span>Fast</span><i style="background:linear-gradient(90deg,hsl(200 75% 55%),hsl(110 60% 70%),hsl(25 75% 55%))"></i><span>Slow</span>`;
  }
  function drawInsights(accuracy, consistency) {
    const tricky = Object.entries(KS).filter(([, s]) => s.miss).sort((a, b) => b[1].miss - a[1].miss || b[1].miss / b[1].n - a[1].miss / a[1].n).slice(0, 5);
    const words = [];
    let s = 0;
    for (let i = 0; i <= typed.length; i++) {
      if (i === typed.length || text[i] === ' ' || text[i] === '\n') {
        const e = i;
        if (e - s >= 3 && stamps[e - 1] && (stamps[s - 1] || stamps[s])) {
          const wtxt = text.slice(s, e);
          const okw = typed.slice(s, e) === wtxt;
          const ms = (stamps[e - 1] - (stamps[s - 1] || stamps[s])) / (e - s);
          if (okw && /\S/.test(wtxt)) words.push({ w: wtxt.trim(), ms });
        }
        s = i + 1;
      }
    }
    const slow = words.sort((a, b) => b.ms - a.ms).slice(0, 4);
    let tip;
    if (accuracy < 90) tip = 'Accuracy first: slow down a touch and your speed will catch up. Every fix with Backspace costs time.';
    else if (consistency < 60) tip = 'Your speed went up and down a lot. Try to keep a steady rhythm, like a drummer.';
    else if (tricky.length && tricky[0][1].miss >= 3) tip = `The ${tricky[0][0] === 'space' ? 'space bar' : '"' + tricky[0][0] + '" key'} tripped you up most. Try a Weak keys practice to drill it.`;
    else tip = 'Nice and clean. Try a longer test, turn on punctuation, or race a famous quote next.';
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    $('insights').innerHTML = `<div class="tt-ins"><h4>Trickiest keys</h4>${tricky.length ? `<ol>${tricky.map(([k, s]) => `<li><code>${esc(k)}</code> missed ${s.miss} of ${s.n}</li>`).join('')}</ol>` : '<p>No mistakes at all. Impressive!</p>'}</div>
      <div class="tt-ins"><h4>Slowest words</h4>${slow.length ? `<ol>${slow.map((x) => `<li><code>${esc(x.w)}</code> ${Math.round(12000 / x.ms)} WPM</li>`).join('')}</ol>` : '<p>Type a few more words to see this.</p>'}</div>
      <div class="tt-ins"><h4>Tip</h4><p>${tip}</p></div>`;
  }

  function unlock(id) {
    if (P.ach[id]) return;
    const a = ACH.find((x) => x.id === id); if (!a) return;
    P.ach[id] = Date.now(); save();
    const el = document.createElement('div'); el.className = 'tt-badge';
    el.style.marginTop = document.querySelectorAll('.tt-badge').length * 56 + 'px';
    el.innerHTML = `<i>${a.em}</i><span><small>Badge unlocked</small><b></b></span>`; el.querySelector('b').textContent = a.name;
    document.body.append(el); setTimeout(() => el.remove(), 3300);
    $('achCount').textContent = `${Object.keys(P.ach).length}/${ACH.length}`;
  }

  function paintDeck() {
    $('modes').innerHTML = Object.entries(MODES).map(([k, m]) => `<button class="tt-tab" type="button" data-m="${k}" aria-pressed="${k === P.mode}" style="--tc:${m.c}"><i>${m.ic}</i>${m.name}</button>`).join('');
    $('sub').innerHTML = SUBS[P.mode].map((v) => `<button type="button" data-v="${v}" aria-pressed="${v === sub()}">${SUBLAB[v] || (P.mode === 'words' ? v : v + 's')}</button>`).join('');
    const w = usesWords();
    $('toggles').innerHTML = `<button class="tt-chip" type="button" data-t="punct" aria-pressed="${P.punct}" ${w ? '' : 'disabled'}>!? Punctuation</button>
      <button class="tt-chip" type="button" data-t="nums" aria-pressed="${P.nums}" ${w ? '' : 'disabled'}>123 Numbers</button>
      <select class="tt-select" id="pack" aria-label="Word pack" ${w ? '' : 'disabled'}>${Object.entries(PACKS).map(([k, n]) => `<option value="${k}" ${k === P.pack ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <button class="tt-chip" type="button" data-t="daily" aria-pressed="${P.daily}" ${P.mode === 'weak' ? 'disabled' : ''}>📅 Daily</button>
      <button class="tt-chip" type="button" data-t="strict" aria-pressed="${P.strict}" title="Wrong keys are blocked until you press the right one">🧱 Strict</button>`;
    box.classList.toggle('is-smooth', !!P.smooth);
    box.classList.remove('caret-block', 'caret-under');
    if (P.caret === 'block') box.classList.add('caret-block'); else if (P.caret === 'under') box.classList.add('caret-under');
    box.style.setProperty('--fs', P.size === 's' ? 'clamp(16px, 2.1vw, 20px)' : P.size === 'l' ? 'clamp(20px, 3.2vw, 31px)' : 'clamp(18px, 2.6vw, 25px)');
    liveKb.classList.toggle('is-hidden', !P.kb);
    $('achCount').textContent = `${Object.keys(P.ach).length}/${ACH.length}`;
  }
  function changed() { save(); paintDeck(); reset(); inp.focus({ preventScroll: true }); }
  $('modes').addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; P.mode = b.dataset.m; changed(); });
  $('sub').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const v = b.dataset.v; P.sub[P.mode] = /^\d+$/.test(v) ? Number(v) : v; changed(); });
  $('toggles').addEventListener('click', (e) => {
    const b = e.target.closest('[data-t]'); if (!b || b.disabled) return;
    P[b.dataset.t] = !P[b.dataset.t];
    if (b.dataset.t === 'daily') Curio.toast(P.daily ? '📅 Daily: everyone gets the same text today' : 'Daily off');
    if (b.dataset.t === 'strict') Curio.toast(P.strict ? '🧱 Strict: wrong keys are blocked until you hit the right one' : 'Strict off');
    changed();
  });
  $('toggles').addEventListener('change', (e) => { if (e.target.id === 'pack') { P.pack = e.target.value; changed(); } });

  inp.addEventListener('input', onInput);
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); reset(); inp.focus(); return; }
    if (e.key === 'Tab') { e.preventDefault(); if (running) { reset(); inp.focus(); } return; }
    if (e.key === 'Enter' && !isCode()) e.preventDefault();
    if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') e.preventDefault();
  });
  inp.addEventListener('focus', () => { box.classList.add('is-focus'); resume(); });
  inp.addEventListener('blur', () => box.classList.remove('is-focus'));
  inp.addEventListener('select', () => { inp.selectionStart = inp.selectionEnd = inp.value.length; });
  box.addEventListener('pointerup', () => { if (!finished) inp.focus({ preventScroll: true }); });
  document.addEventListener('keydown', (e) => {
    if (document.activeElement === inp || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.curio-modal')) return;
    const inCtl = e.target.closest && e.target.closest('button, select, input, textarea');
    if (e.key === 'Escape') { reset(); inp.focus(); }
    else if (e.key === 'Enter' && finished && !inCtl) { e.preventDefault(); reset(); inp.focus(); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  });
  $('restart').addEventListener('click', () => { reset(); inp.focus(); });
  $('again').addEventListener('click', () => { reset(); inp.focus({ preventScroll: true }); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  $('repeat').addEventListener('click', () => { reset(true); inp.focus({ preventScroll: true }); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  $('practice').addEventListener('click', () => { P.mode = 'weak'; changed(); box.scrollIntoView({ block: 'center', behavior: 'smooth' }); });
  $('share').addEventListener('click', async () => {
    if (!lastResult) return;
    const t = `⌨️ Typing Test (${lastResult.label}${lastResult.daily ? ', daily ' + today() : ''}): ${lastResult.wpm} WPM at ${lastResult.accuracy}% accuracy. Rank: ${lastResult.rank}. Curio`;
    try { await navigator.clipboard.writeText(t); Curio.toast('Copied to clipboard'); } catch { Curio.toast(t, 4000); }
  });
  $('heatView').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; heat.view = b.dataset.v; paintHeatToggles(); drawHeat(); });
  $('heatScope').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; heat.scope = b.dataset.v; paintHeatToggles(); drawHeat(); });

  function resume() { if (paused) { paused = false; startAt = performance.now(); } }
  document.addEventListener('visibilitychange', () => {
    if (!running) return;
    if (document.hidden && !paused) { accMs += performance.now() - startAt; paused = true; }
    else if (!document.hidden && document.activeElement === inp) resume();
  });
  window.addEventListener('resize', () => placeCaret());
  window.addEventListener('curio:theme', () => { if ($('results').classList.contains('is-on')) drawHeat(); if (!$('info').hidden && $('info').dataset.p === 'stats') renderInfo('stats'); });

  const info = $('info');
  function trendSvg(list) {
    if (list.length < 2) return '<p class="c-muted">Finish a couple of tests to see your progress line.</p>';
    const W = 640, H = 170, X0 = 34, X1 = 630, Y0 = 145, Y1 = 12;
    const mx = Math.max(...list.map((e) => e.w)) * 1.1 || 10;
    const x = (i) => X0 + i / (list.length - 1) * (X1 - X0), y = (v) => Y0 - v / mx * (Y0 - Y1);
    const ya = (a) => Y0 - (a / 100) * (Y0 - Y1);
    const p = list.map((e, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(e.w).toFixed(1)}`).join(' ');
    const pa = list.map((e, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${ya(e.a).toFixed(1)}`).join(' ');
    const bi = list.reduce((b, e, i) => e.w > list[b].w ? i : b, 0);
    let g = '';
    for (let v = 0; v <= mx; v += Math.max(10, Math.round(mx / 4 / 10) * 10)) g += `<line x1="${X0}" x2="${X1}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" stroke="var(--line)"/><text x="${X0 - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${v}</text>`;
    return `<svg class="tt-trend" viewBox="0 0 ${W} ${H + 10}" role="img" aria-label="Your words per minute over recent tests">${g}<path d="${pa}" fill="none" stroke="var(--good)" stroke-width="1.5" stroke-dasharray="3 4" opacity=".7"/><path d="${p} L${x(list.length - 1)} ${Y0} L${X0} ${Y0} Z" fill="var(--accent)" opacity=".1"/><path d="${p}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round"/>${list.map((e, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(e.w).toFixed(1)}" r="${i === bi ? 5.5 : 3}" fill="${i === bi ? 'var(--good)' : 'var(--accent)'}"/>`).join('')}<text x="${X1}" y="${H + 6}" text-anchor="end">orange: WPM · dashed green: accuracy</text></svg>`;
  }
  function renderInfo(p) {
    info.dataset.p = p;
    if (p === 'stats') {
      const h = P.hist, last10 = h.slice(-10);
      const avg10 = last10.length ? Math.round(last10.reduce((a, e) => a + e.w, 0) / last10.length) : 0;
      const top = h.length ? Math.max(...h.map((e) => e.w)) : 0;
      const rows = [];
      [15, 30, 60, 120].forEach((s) => rows.push([s + ' seconds', 'wpm' + s]));
      [10, 25, 50, 100].forEach((s) => rows.push([s + ' words', 'words' + s]));
      ['short', 'medium', 'long', 'any'].forEach((s) => rows.push([SUBLAB[s] + ' quotes', 'quote-' + s]));
      ['js', 'py', 'css', 'html'].forEach((s) => rows.push([SUBLAB[s] + ' code', 'code-' + s]));
      const cnt = (k) => h.filter((e) => e.k === k).length;
      info.innerHTML = `<h3>📈 Your stats</h3>
        <div class="tt-totals"><div><b>${P.tot.tests}</b><span>Tests</span></div><div><b>${avg10}</b><span>Avg WPM (last 10)</span></div><div><b>${top}</b><span>Top WPM</span></div><div><b>${Math.round(P.tot.ms / 60000)}</b><span>Minutes typed</span></div></div>
        <h3 class="tt-h">Last ${Math.min(40, h.length)} tests</h3>${trendSvg(h.slice(-40))}
        <h3 class="tt-h">Personal bests</h3>
        <table class="tt-pbs"><thead><tr><th>Test</th><th>Best WPM</th><th>Played</th></tr></thead><tbody>${rows.map(([n, k]) => { const b = Curio.getBest(k); return `<tr><td>${n}</td><td>${b != null ? b : '-'}</td><td>${cnt(k)}</td></tr>`; }).join('')}</tbody></table>
        <p class="c-muted" style="font-size:13px">Bests for other word packs, punctuation and numbers are kept separately. Quotes finished: ${Object.keys(P.quotes).length} of ${DATA.quotes.length}.</p>
        <h3 class="tt-h">All-time key heatmap</h3><div class="tt-kb tt-kb--heat" id="lifeKb"></div><div class="tt-heatlegend" id="lifeLegend"></div>
        <div class="c-row" style="margin-top:14px"><button class="c-btn c-btn--ghost" type="button" id="wipe">Reset my stats</button></div>`;
      drawHeat($('lifeKb'), $('lifeLegend'), P.keys, 'acc');
      $('wipe').addEventListener('click', async () => {
        const v = await Curio.modal({ emoji: '🧹', title: 'Reset typing stats?', body: 'This clears your history, key heatmap and badges for this game. Personal bests stay.', buttons: [{ label: 'Reset', value: 'yes' }, { label: 'Cancel', value: 'no' }] });
        if (v !== 'yes') return;
        const keep = { mode: P.mode, sub: P.sub, pack: P.pack, sound: P.sound, caret: P.caret, smooth: P.smooth, kb: P.kb, size: P.size };
        P = Object.assign(fresh(), keep); save(); paintDeck(); renderInfo('stats'); Curio.toast('Stats cleared');
      });
    } else if (p === 'badges') {
      info.innerHTML = `<h3>🏆 Badges · ${Object.keys(P.ach).length} of ${ACH.length}</h3><div class="tt-achs">${ACH.map((a) => `<div class="tt-ach ${P.ach[a.id] ? 'got' : ''}"><i>${a.em}</i><b>${a.name}</b>${a.desc}</div>`).join('')}</div>`;
    } else if (p === 'settings') {
      const seg = (key, opts) => `<div class="tt-seg" data-set="${key}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(P[key]) === String(v)}">${l}</button>`).join('')}</div>`;
      info.innerHTML = `<h3>⚙️ Settings</h3><div class="tt-set">
        <div><h4>Key sound</h4>${seg('sound', [['off', 'Off'], ['click', 'Click'], ['type', 'Typewriter'], ['bubble', 'Bubble']])}</div>
        <div><h4>Caret</h4>${seg('caret', [['line', 'Line'], ['block', 'Block'], ['under', 'Underline']])} ${seg('smooth', [['true', 'Smooth'], ['false', 'Snappy']])}</div>
        <div><h4>Text size</h4>${seg('size', [['s', 'Small'], ['m', 'Medium'], ['l', 'Large']])}</div>
        <div><h4>On-screen keyboard (wide screens)</h4>${seg('kb', [['true', 'Show'], ['false', 'Hide']])}</div></div>`;
    } else {
      info.innerHTML = `<h3>❓ How it works</h3><div class="tt-help">
        <p><b>WPM</b> (words per minute) counts every 5 correctly typed characters as one word, so long and short words are treated fairly. <b>Raw WPM</b> counts everything you typed, mistakes included. <b>Accuracy</b> is the share of key presses that were right first time. <b>Consistency</b> is how steady your speed was from second to second.</p>
        <ul>
          <li><b>Time</b>: type as much as you can in 15, 30, 60 or 120 seconds.</li>
          <li><b>Words</b>: race to finish 10, 25, 50 or 100 words.</li>
          <li><b>Quotes</b>: famous lines from books, speeches and scientists, plus a few Curio facts.</li>
          <li><b>Code</b>: real snippets of JavaScript, Python, CSS and HTML. Press Enter at the end of a line; the indent on the next line is filled in for you.</li>
          <li><b>Weak keys</b>: Curio looks at your key heatmap and builds a practice run full of the letters you miss or hesitate on most.</li>
        </ul>
        <p><b>Daily</b> gives everyone the same text today. <b>Strict</b> blocks wrong keys, so you must fix each slip before moving on. <b>Punctuation</b> and <b>Numbers</b> mix capitals, commas, quotes and digits into word tests.</p>
        <p>Tips: rest your fingers on the home row (the bumps on F and J help you find it without looking), keep your eyes on the screen, and aim for a smooth rhythm rather than bursts. Accuracy first: speed follows.</p>
        <p>Fun fact: the average adult types somewhere around 40 words per minute, and many fast typists sit between 70 and 100.</p></div>`;
    }
  }
  info.addEventListener('click', (e) => {
    const b = e.target.closest('[data-set] button'); if (!b) return;
    const key = b.parentElement.dataset.set; let v = b.dataset.v;
    if (v === 'true' || v === 'false') v = v === 'true';
    P[key] = v; save(); paintDeck();
    b.parentElement.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    if (key === 'sound' && v !== 'off') sfx('key');
    placeCaret();
  });
  document.querySelectorAll('.tt-navtabs .tt-chip').forEach((t) => t.addEventListener('click', () => {
    const p = t.dataset.panel, open = info.hidden || info.dataset.p !== p;
    document.querySelectorAll('.tt-navtabs .tt-chip').forEach((x) => x.setAttribute('aria-pressed', String(open && x === t)));
    info.hidden = !open; if (open) renderInfo(p);
  }));

  paintDeck();
  reset();
  if (matchMedia('(pointer: fine)').matches) inp.focus({ preventScroll: true });
  window.__tt = { get text() { return text; }, get typed() { return typed; }, get finished() { return finished; }, finish: () => finish(), setMode: (m, s) => { P.mode = m; if (s != null) P.sub[m] = s; save(); paintDeck(); reset(); } };
})();
