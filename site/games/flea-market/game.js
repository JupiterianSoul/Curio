(() => {
  const D = window.FM_DATA;
  const C = window.Curio;
  const adv = C.advanced;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };
  const money = (n) => `$${C.fmt(Math.round(n))}`;
  const nice = (n) => n < 20 ? Math.max(1, Math.round(n)) : n < 100 ? Math.round(n / 5) * 5 : Math.round(n / 10) * 10;

  const STALLS = adv ? 8 : 6;
  const START = adv ? 200 : 150;
  const LOOKS = 5;

  const ITEMS = D.items.map(([emo, name, desc, value, clues], i) => ({ emo, name, desc, value, clues, i }));
  let st = null;
  let stall = null;

  const els = {
    bubble: $('#bubble'), face: $('#face'), mini: $('#mini'), vname: $('#vname'), patience: $('#patience'), art: $('#itemArt'), tag: $('#tag'), ask: $('#ask'),
    iname: $('#iname'), idesc: $('#idesc'), clues: $('#clues'), offer: $('#offer'), range: $('#range'), deal: $('#deal'), nextRow: $('#nextRow'), bag: $('#bag')
  };

  function face(look, color, mood = 'ok') {
    const ink = '#2e2017';
    const skin = ['#f2c9a0', '#d9a066', '#a8714a', '#f5d6b8'][look.length % 4];
    const mouth = mood === 'happy' ? `<path d="M40 74q10 10 20 0" fill="#7a2e2e" stroke="${ink}" stroke-width="2.5"/>` : mood === 'mad' ? `<path d="M40 78q10-8 20 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>` : `<path d="M41 74q9 4 18 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    const brows = mood === 'mad' ? `<path d="M33 50l12 4M67 50l-12 4" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>` : '';
    const eyes = look === 'shades' ? `<rect x="28" y="52" width="20" height="10" rx="4" fill="${ink}"/><rect x="52" y="52" width="20" height="10" rx="4" fill="${ink}"/><path d="M48 56h4" stroke="${ink}" stroke-width="2"/>` : look === 'beanie' && mood !== 'mad' ? `<path d="M34 58q5 3 10 0M56 58q5 3 10 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>` : `<circle cx="39" cy="58" r="3.6" fill="${ink}"/><circle cx="61" cy="58" r="3.6" fill="${ink}"/>`;
    const hat = {
      cap: `<path d="M24 46c2-22 50-22 52 0z" fill="${color}" stroke="${ink}" stroke-width="2.5"/><path d="M70 44h22" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`,
      scarf: `<path d="M24 50c0-24 52-24 52 0-8-10-44-10-52 0z" fill="#8b5a2b" stroke="${ink}" stroke-width="2.5"/><path d="M28 86c14 8 30 8 44 0l2 10c-16 8-32 8-48 0z" fill="${color}" stroke="${ink}" stroke-width="2.5"/>`,
      shades: `<path d="M26 46c2-20 46-20 48 0-10-6-38-6-48 0z" fill="#1b1b1b" stroke="${ink}" stroke-width="2.5"/>`,
      beanie: `<path d="M24 50c0-26 52-26 52 0z" fill="${color}" stroke="${ink}" stroke-width="2.5"/><circle cx="50" cy="22" r="6" fill="${color}" stroke="${ink}" stroke-width="2.5"/><path d="M24 50h52" stroke="${ink}" stroke-width="5"/>`,
      bun: `<circle cx="50" cy="24" r="10" fill="#d9d9e3" stroke="${ink}" stroke-width="2.5"/><path d="M26 54c0-22 48-22 48 0-8-10-40-10-48 0z" fill="#d9d9e3" stroke="${ink}" stroke-width="2.5"/><circle cx="39" cy="58" r="8" fill="none" stroke="${ink}" stroke-width="2"/><circle cx="61" cy="58" r="8" fill="none" stroke="${ink}" stroke-width="2"/>`,
      hat: `<ellipse cx="50" cy="40" rx="34" ry="7" fill="${color}" stroke="${ink}" stroke-width="2.5"/><path d="M32 40c0-18 36-18 36 0z" fill="${color}" stroke="${ink}" stroke-width="2.5"/><path d="M60 82l-6-4" stroke="${ink}" stroke-width="2"/>`
    }[look] || '';
    return `<svg viewBox="0 0 100 110"><path d="M14 110c2-20 16-30 36-30s34 10 36 30z" fill="${color}" stroke="${ink}" stroke-width="3"/><circle cx="50" cy="60" r="26" fill="${skin}" stroke="${ink}" stroke-width="3"/>${eyes}${brows}${mouth}<circle cx="32" cy="68" r="4" fill="#ff8fab" opacity=".4"/><circle cx="68" cy="68" r="4" fill="#ff8fab" opacity=".4"/>${hat}</svg>`;
  }

  function sound(kind) {
    if (C.muted) return;
    if (kind === 'coin') { C.beep(1568, 0.07, 'square', 0.04); setTimeout(() => C.beep(2093, 0.2, 'square', 0.04), 70); }
    else if (kind === 'till') { C.sfx('success'); setTimeout(() => { C.beep(2637, 0.25, 'triangle', 0.05); }, 200); }
    else if (kind === 'hmm') { C.beep(220, 0.12, 'triangle', 0.08); setTimeout(() => C.beep(196, 0.16, 'triangle', 0.07), 110); }
    else if (kind === 'huff') C.sfx('error');
    else if (kind === 'look') C.sfx('paper');
    else if (kind === 'step') C.beep(900, 0.02, 'square', 0.03);
  }

  function say(t, mood) {
    els.bubble.textContent = t;
    els.bubble.classList.remove('is-pop'); void els.bubble.offsetWidth; els.bubble.classList.add('is-pop');
    if (mood && stall.v) paintFace(mood);
  }
  function paintFace(mood = 'ok') {
    const v = stall.v;
    const svg = v.buyer ? face(['cap', 'scarf', 'hat', 'beanie', 'bun'][stall.n % 5], ['#5e60ce', '#2a9d8f', '#e76f51', '#8338ec', '#577590'][stall.n % 5], mood) : face(v.look, v.color, mood);
    els.face.innerHTML = svg;
    els.mini.innerHTML = `${svg}<span>${esc(v.name)}</span>`;
    els.face.className = `fm-face${mood === 'mad' ? ' is-mad' : mood === 'happy' ? ' is-happy' : ''}`;
  }

  function hud() {
    $('#cash').textContent = money(st.cash);
    $('#stallNo').textContent = st.phase === 'sell' ? `${Math.min(st.sellIdx + 1, st.bag.length)}/${st.bag.length}` : `${Math.min(st.n + 1, STALLS)}/${STALLS}`;
    $('#stallLabel').textContent = st.phase === 'sell' ? 'Customer' : 'Stall';
    $('#bagCount').textContent = st.bag.filter((b) => !b.sold).length;
    $('#looks').textContent = st.looks;
  }

  function paintBag() {
    const items = st.bag;
    els.bag.innerHTML = items.length ? items.map((b) => `<div><span>${b.it.emo}</span><b>${esc(b.it.name)}</b><span>paid ${money(b.paid)}${b.sold ? `, sold ${money(b.sold)}` : ''}</span></div>`).join('') : '<p class="c-muted">Empty, for now.</p>';
  }

  function estimate(it) {
    return (0.45 * it.value + 0.55 * 30) * C.rand(0.6, 1.45);
  }

  function setOffer(n) {
    const max = stall.mode === 'buy' ? Math.max(1, Math.min(st.cash, stall.ask)) : Math.max(stall.offer * 4, stall.it.value * 2, stall.bag.paid * 3, 20);
    const min = stall.mode === 'buy' ? 1 : stall.offer;
    stall.my = Math.max(min, Math.min(max, Math.round(n)));
    els.range.min = String(min); els.range.max = String(max); els.range.value = String(stall.my);
    els.offer.textContent = money(stall.my);
  }

  function paintPatience() {
    els.patience.innerHTML = Array.from({ length: stall.p0 }, (_, i) => `<i class="${i < stall.p ? '' : 'is-gone'}"></i>`).join('');
  }

  function showItem(it) {
    els.art.textContent = it.emo;
    els.art.className = 'fm-item'; void els.art.offsetWidth; els.art.classList.add('is-in');
    $('#iname').textContent = it.name;
    $('#idesc').textContent = it.desc;
    els.clues.innerHTML = '';
  }

  function nextStall() {
    if (st.n >= STALLS) return adv ? startSelling() : appraise();
    const v = C.pick(D.vendors);
    let it;
    do { it = C.pick(ITEMS); } while (st.seen.includes(it.i) && st.seen.length < ITEMS.length);
    st.seen.push(it.i);
    const ask0 = nice(estimate(it) * C.rand(v.mark[0], v.mark[1]));
    stall = { mode: 'buy', v, it, n: st.n, ask0, ask: ask0, min: Math.max(1, Math.round(ask0 * v.floor * C.rand(0.95, 1.08))), p: v.patience, p0: v.patience, clue: 0, done: false };
    showItem(it);
    paintFace('ok');
    els.vname.textContent = v.name;
    $('#tagLabel').textContent = 'Asking';
    els.ask.textContent = money(stall.ask);
    $('#offerLabel').textContent = 'Your offer';
    $('#offerBtn').firstChild.textContent = 'Make offer ';
    $('#payBtn').textContent = 'Pay asking';
    $('#lookBtn').hidden = false;
    $('#walkBtn').firstChild.textContent = 'Walk away ';
    paintPatience();
    say(v.lines.hi);
    setOffer(stall.ask * 0.6);
    els.deal.hidden = false; els.nextRow.hidden = true;
    hud();
    C.sfx('paper');
  }

  function look() {
    if (!stall || stall.done || stall.mode !== 'buy') return;
    if (stall.clue >= stall.it.clues.length) { C.toast('Nothing more to see. It is what it is.'); return; }
    if (adv) { if (st.looks <= 0) { C.toast('No inspections left today.'); return; } st.looks--; }
    const clue = stall.it.clues[stall.clue++];
    els.clues.insertAdjacentHTML('beforeend', `<li>${esc(clue)}</li>`);
    sound('look');
    if (stall.clue === 1 && Math.random() < 0.4) say(C.pick(['Careful, careful.', 'You touch it, you buy it.', 'Take your time, love.', 'Mint condition, that.']));
    hud();
  }

  function buy(price) {
    stall.done = true;
    st.cash -= price;
    st.bag.push({ it: stall.it, paid: price, sold: 0 });
    paintFace('happy');
    say(stall.v.lines.yes, 'happy');
    els.art.classList.add('is-gone');
    sound('coin'); buzz(15);
    finishStall(`Bought for ${money(price)}.${price < stall.ask0 * 0.7 ? ' A proper bargain.' : ''}`);
  }

  function offer() {
    if (!stall || stall.done) return;
    if (stall.mode === 'sell') return counterSell();
    const x = stall.my;
    if (x > st.cash) { C.toast('You do not have that much.'); return; }
    if (x >= stall.ask) return buy(stall.ask);
    if (x >= stall.min) return buy(x);
    if (x < stall.ask0 * 0.35) { stall.p -= 2; say(stall.v.lines.insult, 'mad'); sound('huff'); }
    else {
      stall.p -= 1;
      if (stall.p > 0) {
        stall.ask = Math.max(stall.min, nice((stall.ask + x) / 2 + stall.ask * 0.05));
        if (stall.ask > stall.ask0) stall.ask = stall.ask0;
        els.ask.textContent = money(stall.ask);
        els.tag.classList.remove('is-drop'); void els.tag.offsetWidth; els.tag.classList.add('is-drop');
        say(stall.v.lines.counter.replace('%s', money(stall.ask)), 'ok');
        sound('hmm');
        setOffer(Math.min(stall.my, stall.ask));
      }
    }
    paintPatience();
    if (stall.p <= 0) { stall.done = true; say(stall.v.lines.no, 'mad'); sound('huff'); buzz([30, 30, 30]); finishStall('No sale. They have turned their back on you.'); }
  }

  function payAsking() {
    if (!stall || stall.done) return;
    if (stall.mode === 'sell') return acceptSell();
    if (stall.ask > st.cash) { C.toast('Not enough cash for that.'); sound('huff'); return; }
    buy(stall.ask);
  }

  function walk() {
    if (!stall || stall.done) return;
    if (stall.mode === 'sell') return keepItem();
    stall.done = true;
    say(C.pick(['Your loss!', 'Suit yourself.', 'It will be gone in five minutes, you know.', 'Come back when you are serious.']), 'ok');
    finishStall('You walk on, hands in pockets.');
  }

  function finishStall(text) {
    els.deal.hidden = true;
    $('#nextText').textContent = text;
    els.nextRow.hidden = false;
    paintBag(); hud();
    $('#nextBtn').firstChild.textContent = st.phase === 'sell' ? (st.sellIdx + 1 >= st.bag.length ? 'Count the till ' : 'Next customer ') : (st.n + 1 >= STALLS ? (adv ? 'Set up your own stall ' : 'Call the appraiser ') : 'Next stall ');
    $('#nextBtn').focus({ preventScroll: true });
  }

  function next() {
    if (st.phase === 'sell') { st.sellIdx++; return nextBuyer(); }
    st.n++;
    nextStall();
  }

  function startSelling() {
    st.phase = 'sell';
    st.sellIdx = 0;
    $('#sub').textContent = 'Day two: your own table. Customers will haggle with you. Do you know what your finds are worth?';
    C.toast('Sunday! Your turn behind the table.', 2600);
    if (!st.bag.length) return appraise();
    nextBuyer();
  }

  function nextBuyer() {
    if (st.sellIdx >= st.bag.length) return appraise();
    const b = st.bag[st.sellIdx];
    const it = b.it;
    const max = Math.max(1, nice(it.value * C.rand(0.85, 1.35)));
    const first = Math.max(1, nice(max * C.rand(0.4, 0.7)));
    stall = { mode: 'sell', it, bag: b, n: st.sellIdx, max, offer: first, p: 2, p0: 2, done: false, v: { name: C.pick(D.buyers), buyer: true } };
    showItem(it);
    stall.it.clues.forEach((c, i) => { if (i < 1) els.clues.insertAdjacentHTML('beforeend', `<li>${esc(c)}</li>`); });
    paintFace('ok');
    els.vname.textContent = 'Customer';
    $('#tagLabel').textContent = 'They offer';
    els.ask.textContent = money(first);
    $('#offerLabel').textContent = 'Your price';
    $('#offerBtn').firstChild.textContent = 'Counter ';
    $('#payBtn').textContent = 'Accept offer';
    $('#lookBtn').hidden = true;
    $('#walkBtn').firstChild.textContent = 'Keep it ';
    paintPatience();
    say(`${stall.v.name} picks up your ${it.name.toLowerCase()}. "I will give you ${money(first)} for it."`);
    setOffer(Math.max(first + 1, Math.round(b.paid * 1.5)));
    els.deal.hidden = false; els.nextRow.hidden = true;
    hud();
  }

  function sold(price) {
    stall.done = true;
    st.cash += price;
    stall.bag.sold = price;
    paintFace('happy');
    const diff = stall.it.value - price;
    say(diff > stall.it.value * 0.3 ? `"Pleasure!" They practically run off. Was it worth more?` : `"Lovely, thank you."`, 'happy');
    els.art.classList.add('is-gone');
    sound('till'); buzz(20);
    finishStall(`Sold for ${money(price)} (you paid ${money(stall.bag.paid)}).`);
  }
  function acceptSell() { sold(stall.offer); }
  function counterSell() {
    const x = stall.my;
    if (x <= stall.max) return sold(x);
    stall.p--;
    paintPatience();
    if (x > stall.max * 1.7 || stall.p <= 0) {
      stall.done = true; say('"Too rich for me." They put it down and wander off.', 'mad'); sound('huff');
      finishStall('No sale. It goes back in the bag.');
      return;
    }
    stall.offer = Math.min(stall.max, nice((stall.offer + stall.max) / 2 + 1));
    els.ask.textContent = money(stall.offer);
    els.tag.classList.remove('is-drop'); void els.tag.offsetWidth; els.tag.classList.add('is-drop');
    say(`"Hmm. ${money(stall.offer)}, and that is my last offer."`, 'ok');
    sound('hmm');
    setOffer(Math.max(stall.offer, stall.my));
  }
  function keepItem() {
    stall.done = true;
    say('"Fair enough." They move along.', 'ok');
    finishStall('You keep it. Maybe it will look nice on a shelf.');
  }

  function appraise() {
    st.phase = 'end';
    const rows = st.bag.map((b) => {
      if (adv) {
        const gain = b.sold ? b.sold - b.paid : b.it.value * 0.5 - b.paid;
        return { b, gain, line: b.sold ? `paid ${money(b.paid)}, sold ${money(b.sold)}` : `paid ${money(b.paid)}, kept (half value)`, val: b.it.value };
      }
      return { b, gain: b.it.value - b.paid, line: `paid ${money(b.paid)}`, val: b.it.value };
    });
    const profit = Math.round(rows.reduce((a, r) => a + r.gain, 0));
    let rank = D.ranks[0];
    for (const r of D.ranks) if (profit >= r[0]) rank = r;
    $('#endKick').textContent = adv ? 'The weekend is over' : 'The appraiser has arrived';
    $('#endTitle').textContent = rank[1];
    $('#endText').textContent = rows.length ? rank[2] : 'You bought nothing at all. Zero risk, zero treasure. Very sensible. Very boring.';
    $('#endRows').innerHTML = rows.map((r) => `<li><span>${r.b.it.emo}</span><span><b>${esc(r.b.it.name)}</b><small>${r.line}. Really worth ${money(r.val)}</small></span><span class="fm-val ${r.gain >= 0 ? 'is-win' : 'is-loss'}">${r.gain >= 0 ? '+' : '-'}${money(Math.abs(r.gain))}</span></li>`).join('');
    $('#endProfit').textContent = `${profit < 0 ? '-' : ''}${money(Math.abs(profit))}`;
    const b = C.best(`profit:${C.mode}`, profit);
    $('#endBest').textContent = `${b.best < 0 ? '-' : ''}${money(Math.abs(b.best))}`;
    $('#end').hidden = false;
    const lis = [...document.querySelectorAll('#endRows li')];
    lis.forEach((li, i) => setTimeout(() => { li.classList.add('is-on'); sound(rows[i].gain >= 0 ? 'coin' : 'hmm'); }, 300 + i * (C.calm ? 80 : 380)));
    setTimeout(() => { if (profit > 0) { C.confetti(profit > 200 ? 140 : 60); sound('till'); } }, 400 + lis.length * (C.calm ? 80 : 380));
    $('#againBtn').focus({ preventScroll: true });
  }

  function start() {
    st = { cash: START, n: 0, bag: [], seen: [], looks: LOOKS, phase: 'buy', sellIdx: 0 };
    $('#end').hidden = true;
    $('#sub').textContent = adv
      ? `Saturday you buy, Sunday you sell from your own table. ${money(START)} in your pocket, ${LOOKS} careful inspections. Make a profit.`
      : `${money(START)} in your pocket and ${STALLS} stalls. Inspect, haggle, buy. Then the appraiser tells you what it was all really worth.`;
    paintBag();
    nextStall();
  }

  document.querySelectorAll('.fm-step').forEach((b) => b.addEventListener('click', () => { if (!stall || stall.done) return; setOffer(stall.my + +b.dataset.step); sound('step'); }));
  els.range.addEventListener('input', () => { if (stall && !stall.done) setOffer(+els.range.value); });
  $('#offerBtn').addEventListener('click', offer);
  $('#payBtn').addEventListener('click', payAsking);
  $('#lookBtn').addEventListener('click', look);
  $('#walkBtn').addEventListener('click', walk);
  $('#nextBtn').addEventListener('click', next);
  $('#againBtn').addEventListener('click', () => { start(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  $('#shareBtn').addEventListener('click', () => {
    const t = `Zoble Flea Market (${C.mode}): ${$('#endTitle').textContent}, profit ${$('#endProfit').textContent}.`;
    (navigator.clipboard?.writeText(t) || Promise.reject()).then(() => C.toast('Copied!'), () => C.toast(t, 4000));
  });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.curio-modal, input[type="text"], textarea')) return;
    if (!$('#end').hidden) return;
    if (e.key === 'Enter') {
      if (e.target.closest && e.target.closest('button')) return;
      e.preventDefault();
      if (!els.nextRow.hidden) next(); else offer();
    } else if (e.key === 'ArrowUp' || e.key === '+') { if (stall && !stall.done) { e.preventDefault(); setOffer(stall.my + (e.shiftKey ? 10 : 1)); } }
    else if (e.key === 'ArrowDown' || e.key === '-') { if (stall && !stall.done) { e.preventDefault(); setOffer(stall.my - (e.shiftKey ? 10 : 1)); } }
    else if (e.key === 'i' || e.key === 'I') look();
    else if (e.key === 'w' || e.key === 'W') walk();
  });

  start();
})();
