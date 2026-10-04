(() => {
  const BJ = window.Blackjack;
  const $ = (id) => document.getElementById(id);
  const START = 1000, MIN = 5, SIDE_MAX = 100;
  const SUIT_NAME = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
  const FELTS = { green: '#0b6b4f', blue: '#134f86', red: '#8a1f2b', purple: '#4e2a7d', black: '#262a2e' };
  const BACKS = { red: '#b3261e', blue: '#1f4fa3', green: '#1d7a4a', gold: '#c99a2e', black: '#3a3a3a' };
  const BADGES = [
    ['first', '🃏 First hand', 'Play a hand'],
    ['bj', '✨ Natural', 'Get a blackjack'],
    ['bj5', '👑 Royal flush of luck', 'Five blackjacks'],
    ['double', '✌️ Double trouble', 'Win a doubled hand'],
    ['split3', '🪓 Split personality', 'Win 3 hands in one round'],
    ['highroller', '🎩 High roller', 'Bet $500 on one hand'],
    ['pair', '👯 Pair up', 'Win a Perfect Pairs bet'],
    ['perfect', '💎 Perfect pair', 'Hit the 25:1 pair'],
    ['t3', '🎰 Three for luck', 'Win a 21+3 bet'],
    ['insure', '☂️ Covered', 'Win an insurance bet'],
    ['book25', '📘 By the book', '25 textbook moves in a row'],
    ['book100', '🎓 Professor', '100 textbook moves in a row'],
    ['quiz10', '🧠 Counter', '10 count quizzes right'],
    ['drill', '⚡ Rain Man', 'Ace a full-deck drill at Pit boss speed'],
    ['k2', '💵 Doubled up', 'Reach $2,000'],
    ['k10', '🏦 Ten grand', 'Reach $10,000']
  ];

  const opts = Object.assign({ coach: false, count: false, quiz: false, insurance: true, surrender: true, fast: false, felt: 'green', back: 'red' }, Curio.store.get('bj:opts', {}));
  if (Curio.store.get('bj:coach', false)) opts.coach = true;
  let balance = Curio.store.get('bj:balance', START);
  if (typeof balance !== 'number' || !isFinite(balance)) balance = START;
  let peak = Curio.store.get('bj:peak', START);
  const stats = Object.assign({ w: 0, l: 0, p: 0 }, Curio.store.get('bj:stats', {}));
  const more = Object.assign({ v: 2, hands: 0, bjs: 0, bigWin: 0, book: 0, bookTotal: 0, streak: 0, bestStreak: 0, sideWins: 0, sideNet: 0, quizR: 0, quizT: 0, drillBest: 0, wagered: 0 }, Curio.store.get('bj:more', {}));
  let badges = Curio.store.get('bj:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const lastBet = Curio.store.get('bj:lastbet', 25);
  let bets = { main: typeof lastBet === 'number' ? lastBet : 25, pp: 0, t3: 0 };
  let prevBets = { ...bets };
  let target = 'main';
  let handId = 0, shoe = BJ.makeShoe(), phase = 'bet', dealer = [], hands = [], active = 0, token = 0, holeDown = true;
  let rc = 0, insBet = 0, insResolve = null, sinceQuiz = 0;
  const money = (n) => `${n < 0 ? '-' : ''}$${Curio.fmt(Math.abs(n), Math.abs(n) % 1 ? 2 : 0)}`;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };
  const betTotal = () => bets.main + bets.pp + bets.t3;

  function save() {
    Curio.store.set('bj:balance', balance);
    Curio.store.set('bj:stats', stats);
    Curio.store.set('bj:more', more);
    if (balance > peak) { peak = balance; Curio.store.set('bj:peak', peak); Curio.best('peak', peak); }
    if (balance >= 2000) award('k2');
    if (balance >= 10000) award('k10');
  }
  function saveOpts() { Curio.store.set('bj:opts', opts); Curio.store.set('bj:coach', opts.coach); }

  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('bj:badges', badges);
    const b = BADGES.find((x) => x[0] === id);
    if (b) setTimeout(() => Curio.toast(`Badge unlocked: ${b[1]}`), 700);
    renderStats();
  }

  function draw() {
    if (shoe.cards.length <= 0) { shoe = BJ.makeShoe(); rc = 0; }
    return shoe.cards.pop();
  }

  const PIPS = {
    2: [[50, 20], [50, 80]],
    3: [[50, 20], [50, 50], [50, 80]],
    4: [[32, 20], [68, 20], [32, 80], [68, 80]],
    5: [[32, 20], [68, 20], [50, 50], [32, 80], [68, 80]],
    6: [[32, 20], [68, 20], [32, 50], [68, 50], [32, 80], [68, 80]],
    7: [[32, 20], [68, 20], [50, 35], [32, 50], [68, 50], [32, 80], [68, 80]],
    8: [[32, 20], [68, 20], [50, 35], [32, 50], [68, 50], [50, 65], [32, 80], [68, 80]],
    9: [[32, 19], [68, 19], [32, 39], [68, 39], [50, 50], [32, 61], [68, 61], [32, 81], [68, 81]],
    10: [[32, 19], [68, 19], [50, 30], [32, 39], [68, 39], [32, 61], [68, 61], [50, 70], [32, 81], [68, 81]]
  };
  const HATS = {
    K: '<path d="M14 30 L18 14 L26 24 L32 10 L38 24 L46 14 L50 30 Z" fill="currentColor"/><circle cx="32" cy="10" r="2.5" fill="currentColor"/>',
    Q: '<path d="M16 30 Q18 18 24 24 Q28 12 32 20 Q36 12 40 24 Q46 18 48 30 Z" fill="currentColor"/><circle cx="32" cy="17" r="2.5" fill="#f5c84b"/>',
    J: '<path d="M16 30 Q20 18 32 18 Q44 18 48 30 Z" fill="currentColor"/><path d="M40 20 Q52 6 54 8 Q50 14 44 22" fill="currentColor" opacity=".7"/>'
  };
  function courtSvg(r, s) {
    return `<svg viewBox="0 0 64 96" aria-hidden="true">${HATS[r]}<circle cx="32" cy="42" r="12" fill="#f6d9b8" stroke="currentColor" stroke-width="1.5"/><circle cx="27.5" cy="41" r="1.4" fill="#222"/><circle cx="36.5" cy="41" r="1.4" fill="#222"/><path d="M28 47 Q32 50 36 47" stroke="#222" stroke-width="1.3" fill="none"/>${r === 'K' ? '<path d="M24 48 Q32 60 40 48 L40 52 Q32 62 24 52 Z" fill="#7a5230"/>' : ''}<path d="M10 92 Q12 60 32 56 Q52 60 54 92 Z" fill="currentColor" opacity=".85"/><text x="32" y="84" text-anchor="middle" font-size="18" fill="#fff" font-weight="900">${s}</text></svg>`;
  }

  function cardEl(c, down) {
    const el = document.createElement('div');
    el.className = `card${down ? ' down' : ''}`;
    const red = c.s === '♥' || c.s === '♦';
    const court = ['J', 'Q', 'K'].includes(c.r);
    let mid;
    if (court) mid = `<div class="court">${courtSvg(c.r, c.s)}</div>`;
    else if (c.r === 'A') mid = `<span class="p ace" style="left:50%;top:50%">${c.s}</span>`;
    else mid = PIPS[+c.r].map(([x, y]) => `<span class="p${y > 52 ? ' f' : ''}" style="left:${x}%;top:${y}%">${c.s}</span>`).join('');
    el.innerHTML = `<div class="in"><div class="face${red ? ' red' : ''}"><div class="c1">${c.r}<small>${c.s}</small></div>${mid}<div class="c2">${c.r}<small>${c.s}</small></div></div><div class="back"></div></div>`;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', down ? 'Face-down card' : `${c.r} of ${SUIT_NAME[c.s]}`);
    if (!down) addTag(el, c);
    return el;
  }
  function addTag(el, c) {
    if (!opts.count || el.querySelector('.tag')) return;
    const v = BJ.hiLo(c);
    const t = document.createElement('span');
    t.className = `tag${v > 0 ? ' plus' : v < 0 ? ' minus' : ''}`;
    t.textContent = v > 0 ? '+1' : v < 0 ? '-1' : '0';
    el.append(t);
  }

  function flyIn(el) {
    const shoeR = document.querySelector('.shoe').getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const dx = shoeR.left + shoeR.width / 2 - (r.left + r.width / 2), dy = shoeR.top + shoeR.height / 2 - (r.top + r.height / 2);
    el.classList.add('deal');
    el.style.transform = `translate(${dx}px, ${dy}px) rotate(-40deg) scale(.6)`;
    const wasDown = el.classList.contains('down');
    if (!wasDown) el.classList.add('down');
    el.getBoundingClientRect();
    el.classList.remove('deal');
    el.style.transform = '';
    if (!wasDown) setTimeout(() => el.classList.remove('down'), 160);
    swish();
  }

  function swish() {
    const ac = !Curio.muted && Curio.audioContext && Curio.audioContext();
    if (!ac) return;
    const len = Math.floor(ac.sampleRate * 0.09);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400; f.Q.value = 0.8;
    const g = ac.createGain(); g.gain.value = 0.25;
    src.connect(f).connect(g).connect(ac.destination);
    src.start();
  }
  function clack(n = 1) {
    for (let i = 0; i < n; i++) setTimeout(() => { Curio.beep(2600 + Math.random() * 600, 0.025, 'square', 0.03); Curio.beep(1800, 0.03, 'triangle', 0.04); }, i * 45);
  }

  async function dealTo(target, handIdx, down) {
    const c = draw();
    if (!down) rc += BJ.hiLo(c);
    if (target === 'dealer') {
      dealer.push(c);
      const el = cardEl(c, down);
      $('d-cards').append(el);
      flyIn(el);
    } else {
      hands[handIdx].cards.push(c);
      renderHands();
      const el = $('hands').children[handIdx].querySelector('.cards').lastElementChild;
      flyIn(el);
    }
    paintTotals();
    paintShoe();
    await sleep(opts.fast ? 150 : 330);
    return c;
  }

  function handLabel(cards) {
    const t = BJ.total(cards);
    if (BJ.isBlackjack(cards)) return 'BJ';
    return t.soft && t.total < 21 ? `${t.total - 10}/${t.total}` : String(t.total);
  }

  function paintTotals() {
    if (!dealer.length) { $('d-tot').textContent = ''; return; }
    $('d-tot').textContent = holeDown ? String(BJ.value(dealer[0])) : handLabel(dealer);
  }

  function trueCount() { const decks = Math.max(0.5, shoe.cards.length / 52); return rc / decks; }
  function paintShoe() {
    $('shoe-n').textContent = shoe.cards.length;
    $('shoe-fill').style.setProperty('--fill', `${Math.round(shoe.cards.length / shoe.total * 100)}%`);
    $('countbox').classList.toggle('hidden', !opts.count);
    $('rc').textContent = rc > 0 ? `+${rc}` : rc;
    const tc = trueCount();
    $('tc').textContent = `${tc >= 0 ? '+' : ''}${tc.toFixed(1)}`;
  }

  function renderHands() {
    const host = $('hands');
    const keep = new Set(hands.map((h) => String(h.id)));
    [...host.children].forEach((d) => { if (!keep.has(d.dataset.id)) d.remove(); });
    hands.forEach((h, i) => {
      let div = [...host.children].find((d) => d.dataset.id === String(h.id));
      if (!div) {
        div = document.createElement('div');
        div.className = 'hand';
        div.dataset.id = h.id;
        div.innerHTML = '<div class="cards"></div><div class="meta"></div>';
      }
      if (host.children[i] !== div) host.insertBefore(div, host.children[i] || null);
      const cardsEl = div.querySelector('.cards');
      while (cardsEl.children.length > h.cards.length) cardsEl.lastElementChild.remove();
      while (cardsEl.children.length < h.cards.length) cardsEl.append(cardEl(h.cards[cardsEl.children.length], false));
      div.classList.toggle('active', phase === 'play' && i === active && hands.length > 1);
      div.classList.toggle('done-hand', phase === 'play' && i !== active);
      const res = h.result ? `<span class="res ${h.result.cls}">${h.result.text}</span>` : '';
      div.querySelector('.meta').innerHTML = h.cards.length ? `<span class="tot">${handLabel(h.cards)}</span><span>${money(h.bet)}${h.doubled ? ' (2x)' : ''}</span>${res}` : '';
    });
  }

  function stackInto(host, amount) {
    host.replaceChildren();
    let left = amount, k = 0;
    for (const v of [1000, 500, 100, 25, 5, 1]) while (left >= v && k < 10) {
      const c = document.createElement('span');
      c.className = 'chip';
      c.dataset.v = v;
      c.style.bottom = `${k * 4}px`;
      c.style.animationDelay = `${k * 25}ms`;
      host.append(c); left -= v; k++;
    }
    host.style.height = `${16 + k * 4}px`;
  }

  function renderSpots() {
    const inPlay = phase !== 'bet';
    const amounts = inPlay ? { main: hands.reduce((s, h) => s + h.bet, 0), pp: bets.pp, t3: bets.t3 } : bets;
    document.querySelectorAll('.spot').forEach((sp) => {
      const k = sp.dataset.spot;
      const st = sp.querySelector('.stack');
      const key = `${amounts[k]}`;
      if (st.dataset.k !== key) { stackInto(st, amounts[k]); st.dataset.k = key; }
      sp.querySelector('b').textContent = money(amounts[k]);
      sp.classList.toggle('sel', !inPlay && k === target);
      sp.disabled = inPlay;
    });
  }

  function render() {
    $('bj').dataset.felt = opts.felt;
    $('bj').dataset.back = opts.back;
    setStat('bal', money(balance));
    $('peak').textContent = money(peak);
    $('rec').textContent = `${stats.w}-${stats.l}-${stats.p}`;
    $('acc').textContent = more.bookTotal ? `${Math.round(more.book / more.bookTotal * 100)}%` : '-';
    paintShoe();
    $('bet-acts').classList.toggle('hidden', phase !== 'bet');
    $('chips').classList.toggle('hidden', phase !== 'bet');
    $('play-acts').classList.toggle('hidden', phase !== 'play');
    $('ins-acts').classList.toggle('hidden', phase !== 'insure');
    document.querySelectorAll('#chips .chip').forEach((c) => {
      const v = +c.dataset.v;
      c.disabled = phase !== 'bet' || betTotal() + v > balance || (target !== 'main' && bets[target] + v > SIDE_MAX);
    });
    $('deal').disabled = phase !== 'bet' || bets.main < MIN || betTotal() > balance;
    $('clear').disabled = phase !== 'bet' || !betTotal();
    const pt = prevBets.main + prevBets.pp + prevBets.t3;
    $('rebet').disabled = phase !== 'bet' || !pt || pt * 2 > balance || prevBets.pp * 2 > SIDE_MAX || prevBets.t3 * 2 > SIDE_MAX;
    document.querySelectorAll('.sw').forEach((s) => s.setAttribute('aria-pressed', String(!!opts[s.dataset.opt])));
    $('refill').classList.toggle('hidden', !(phase === 'bet' && balance < MIN));
    renderSpots();
    renderHands();
    paintTotals();
    paintActions();
  }

  let lastBal = balance;
  function setStat(id, text) {
    const el = $(id);
    if (el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('bump', 'up', 'down'); void el.offsetWidth;
    if (id === 'bal' && phase === 'bet') { el.classList.add('bump', balance > lastBal ? 'up' : balance < lastBal ? 'down' : 'bump'); setTimeout(() => el.classList.remove('up', 'down'), 900); }
    lastBal = balance;
  }

  function availability(h) {
    return {
      canDouble: h.cards.length === 2 && balance >= h.bet && !h.splitAces,
      canSplit: BJ.canSplit(h.cards) && hands.length < 4 && balance >= h.bet && !h.splitAces,
      canSurrender: opts.surrender && hands.length === 1 && h.cards.length === 2
    };
  }
  function book(h) {
    const av = availability(h);
    return BJ.strategy(h.cards, dealer[0], { canDouble: av.canDouble, canSplit: av.canSplit, canSurrender: av.canSurrender });
  }

  function paintActions() {
    const hint = $('hint');
    document.querySelectorAll('#play-acts .c-btn').forEach((b) => b.classList.remove('tip'));
    if (phase === 'bet') {
      let msg = balance < MIN ? 'Out of chips! Tap <b>Refill bankroll</b> for a fresh $1,000.' : betTotal() > balance ? 'Bet is more than your balance. Clear and try again.' : `Chips go on the <b>${{ main: 'main bet', pp: 'Perfect Pairs', t3: '21+3' }[target]}</b>. Minimum main bet ${money(MIN)}${target !== 'main' ? `, side bets up to ${money(SIDE_MAX)}` : ''}.`;
      if (opts.count && balance >= MIN) {
        const tc = trueCount();
        const units = tc < 1 ? 1 : Math.min(8, Math.floor(tc) * 2);
        msg += ` <br>True count ${tc >= 0 ? '+' : ''}${tc.toFixed(1)}: ${tc < 1 ? 'the shoe is neutral or poor, bet small.' : `the shoe is rich in tens, a counter bets about <b>${units}x</b> their base unit.`}`;
      }
      hint.innerHTML = msg;
      return;
    }
    if (phase === 'insure') {
      const tc = trueCount();
      hint.innerHTML = `Dealer shows an ace. Insurance costs ${money(insCost())} and pays 2 to 1.${opts.coach || opts.count ? ` ${opts.count ? `True count is ${tc.toFixed(1)}: ` : 'Coach: '}<b>${tc >= 3 && opts.count ? 'take it' : 'decline'}</b>${opts.count ? ' (counters insure at +3 or higher).' : ', insurance is a sucker bet without a count.'}` : ''}`;
      return;
    }
    if (phase !== 'play') { hint.textContent = ''; return; }
    const h = hands[active];
    const av = availability(h);
    $('a-double').disabled = !av.canDouble;
    $('a-split').disabled = !av.canSplit;
    $('a-surrender').disabled = !av.canSurrender;
    $('a-surrender').classList.toggle('hidden', !opts.surrender);
    $('a-hit').disabled = false; $('a-stand').disabled = false;
    if (opts.coach) {
      const a = book(h);
      $(`a-${a}`).classList.add('tip');
      hint.innerHTML = `Coach says: <b>${a[0].toUpperCase() + a.slice(1)}</b>. ${handLabel(h.cards)} against a dealer ${dealer[0].r}.`;
    } else hint.textContent = hands.length > 1 ? `Playing hand ${active + 1} of ${hands.length}.` : '';
  }

  function banner(text) {
    const b = $('banner');
    b.textContent = text;
    b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
  }
  function shake() { const t = $('table'); t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); }
  function floatMsg(text) {
    const d = document.createElement('div');
    d.className = 'sidepay';
    d.textContent = text;
    $('table').append(d);
    setTimeout(() => d.remove(), 2300);
  }

  const insCost = () => Math.floor(hands[0].bet / 2);

  async function deal() {
    if (phase !== 'bet' || bets.main < MIN || betTotal() > balance) return;
    const my = ++token;
    if (shoe.cards.length <= shoe.cut) { shoe = BJ.makeShoe(); rc = 0; Curio.toast('Cut card! Fresh six-deck shoe shuffled.'); }
    balance -= betTotal();
    more.wagered += betTotal();
    if (bets.main >= 500) award('highroller');
    Curio.store.set('bj:lastbet', bets.main);
    prevBets = { ...bets };
    save();
    dealer = []; hands = [{ id: ++handId, cards: [], bet: bets.main, doubled: false }]; active = 0; holeDown = true; insBet = 0;
    $('d-cards').replaceChildren();
    $('hands').replaceChildren();
    phase = 'dealing';
    banner('');
    render();
    await dealTo('player', 0);
    await dealTo('dealer', 0, false);
    await dealTo('player', 0);
    await dealTo('dealer', 0, true);
    if (my !== token) return;
    settleSides();
    await sleep(bets.pp || bets.t3 ? 500 : 0);
    const up = BJ.value(dealer[0]);
    const pBJ = BJ.isBlackjack(hands[0].cards);
    if (up === 11 && opts.insurance && balance >= insCost() && insCost() > 0) {
      phase = 'insure';
      banner(pBJ ? 'Even money?' : 'Insurance?');
      render();
      const take = await new Promise((r) => { insResolve = r; });
      insResolve = null;
      if (my !== token) return;
      if (take) { insBet = insCost(); balance -= insBet; save(); clack(2); }
      phase = 'dealing';
      render();
    }
    if (up >= 10) {
      banner('Dealer peeks...');
      await sleep(650);
      if (my !== token) return;
      if (BJ.isBlackjack(dealer)) {
        await reveal();
        settle();
        return;
      }
      if (insBet) floatMsg(`Insurance lost -${money(insBet)}`);
      banner('');
    }
    if (pBJ) {
      await reveal();
      settle();
      return;
    }
    phase = 'play';
    render();
  }

  function settleSides() {
    const [a, b] = hands[0].cards;
    const msgs = [];
    let net = 0;
    if (bets.pp) {
      const r = BJ.perfectPairs(a, b);
      if (r) { balance += bets.pp * (r.pays + 1); net += bets.pp * r.pays; msgs.push(`${r.name} ${r.pays}:1`); award('pair'); if (r.pays === 25) award('perfect'); more.sideWins++; }
      else net -= bets.pp;
    }
    if (bets.t3) {
      const r = BJ.twentyOnePlus3(a, b, dealer[0]);
      if (r) { balance += bets.t3 * (r.pays + 1); net += bets.t3 * r.pays; msgs.push(`${r.name} ${r.pays}:1`); award('t3'); more.sideWins++; }
      else net -= bets.t3;
    }
    more.sideNet += net;
    if (msgs.length) {
      floatMsg(`${msgs.join(' + ')}! +${money(net > 0 ? net : 0)}`);
      Curio.confetti(50);
      [784, 988, 1175].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.08, 'triangle', 0.1), k * 70));
      buzz([20, 40, 20]);
      clack(4);
    }
    save();
    render();
  }

  async function reveal() {
    if (!holeDown) return;
    holeDown = false;
    rc += BJ.hiLo(dealer[1]);
    const el = $('d-cards').children[1];
    if (el) { el.classList.remove('down'); el.setAttribute('aria-label', `${dealer[1].r} of ${SUIT_NAME[dealer[1].s]}`); addTag(el, dealer[1]); }
    Curio.beep(900, 0.03, 'triangle', 0.06);
    paintTotals();
    paintShoe();
    await sleep(500);
  }

  function track(h, a) {
    const want = book(h);
    more.bookTotal++;
    if (want === a) {
      more.book++; more.streak++;
      if (more.streak > more.bestStreak) more.bestStreak = more.streak;
      if (more.streak >= 25) award('book25');
      if (more.streak >= 100) award('book100');
    } else {
      more.streak = 0;
      if (!opts.coach) Curio.toast(`Book play was ${want}.`, 1400);
    }
  }

  async function act(a) {
    if (phase !== 'play') return;
    const h = hands[active];
    const btn = $(`a-${a}`);
    if (btn.disabled || btn.classList.contains('hidden')) return;
    track(h, a);
    const my = token;
    phase = 'busy';
    render();
    if (a === 'hit') {
      await dealTo('player', active);
      if (my !== token) return;
      const t = BJ.total(h.cards).total;
      if (t > 21) { Curio.beep(160, 0.2, 'sawtooth', 0.06); shake(); buzz(60); banner(hands.length > 1 ? `Hand ${active + 1} busts!` : 'Bust!'); await sleep(450); return nextHand(); }
      if (t === 21) { await sleep(150); return nextHand(); }
    } else if (a === 'stand') {
      Curio.beep(500, 0.04, 'sine', 0.06);
      return nextHand();
    } else if (a === 'surrender') {
      h.surrendered = true;
      Curio.beep(330, 0.12, 'sine', 0.06);
      banner('Surrendered. Half back.');
      await sleep(350);
      return nextHand();
    } else if (a === 'double') {
      balance -= h.bet; more.wagered += h.bet; h.bet *= 2; h.doubled = true; save();
      clack(3);
      await dealTo('player', active);
      if (my !== token) return;
      if (BJ.total(h.cards).total > 21) { banner('Doubled... and bust!'); shake(); buzz(60); await sleep(450); }
      return nextHand();
    } else if (a === 'split') {
      balance -= h.bet; more.wagered += h.bet; save();
      const c2 = h.cards.pop();
      const aces = c2.r === 'A';
      hands.splice(active + 1, 0, { id: ++handId, cards: [c2], bet: h.bet, doubled: false, splitAces: aces });
      h.splitAces = aces;
      clack(2);
      renderHands();
      await sleep(250);
      await dealTo('player', active);
      await dealTo('player', active + 1);
      if (my !== token) return;
      if (aces) { banner('Split aces get one card each.'); active = hands.length; return nextHand(true); }
      if (BJ.total(h.cards).total === 21) return nextHand();
    }
    phase = 'play';
    render();
  }

  async function nextHand(skipToDealer) {
    if (!skipToDealer) active++;
    while (active < hands.length && (hands[active].splitAces || BJ.total(hands[active].cards).total >= 21)) active++;
    if (active < hands.length) { phase = 'play'; render(); return; }
    phase = 'dealer';
    render();
    await dealerPlay();
  }

  async function dealerPlay() {
    const my = token;
    await reveal();
    if (hands.some((h) => !h.surrendered && BJ.total(h.cards).total <= 21)) {
      while (BJ.dealerHits(dealer)) {
        await dealTo('dealer', 0, false);
        if (my !== token) return;
      }
    }
    settle();
  }

  function settle() {
    phase = 'settle';
    const dt = BJ.total(dealer).total, dBJ = BJ.isBlackjack(dealer);
    let back = 0, staked = 0, wonHands = 0;
    if (insBet && dBJ) { back += insBet * 3; award('insure'); floatMsg(`Insurance pays ${money(insBet * 2)}`); }
    staked += insBet;
    for (const h of hands) {
      staked += h.bet;
      const t = BJ.total(h.cards).total;
      const pBJ = hands.length === 1 && BJ.isBlackjack(h.cards);
      if (h.surrendered) { back += h.bet / 2; h.result = { cls: 'push', text: 'Surrender' }; }
      else if (pBJ && !dBJ) { back += h.bet * 2.5; h.result = { cls: 'bj', text: 'Blackjack' }; wonHands++; }
      else if (dBJ && !pBJ) { h.result = { cls: 'lose', text: 'Dealer BJ' }; }
      else if (pBJ && dBJ) { back += h.bet; h.result = { cls: 'push', text: 'Push' }; }
      else if (t > 21) { h.result = { cls: 'lose', text: 'Bust' }; }
      else if (dt > 21 || t > dt) { back += h.bet * 2; h.result = { cls: 'win', text: 'Win' }; wonHands++; if (h.doubled) award('double'); }
      else if (t < dt) { h.result = { cls: 'lose', text: 'Lose' }; }
      else { back += h.bet; h.result = { cls: 'push', text: 'Push' }; }
    }
    balance += back;
    const net = back - staked;
    if (net > 0) stats.w++; else if (net < 0) stats.l++; else stats.p++;
    more.hands++;
    award('first');
    if (wonHands >= 3) award('split3');
    if (net > more.bigWin) more.bigWin = net;
    const pBJ = hands.some((h) => h.result.cls === 'bj');
    if (pBJ) { more.bjs++; award('bj'); if (more.bjs >= 5) award('bj5'); }
    save();
    if (pBJ) { banner(`Blackjack! +${money(net)}`); Curio.confetti(90); clack(5); buzz([30, 50, 30]); [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.12), k * 80)); }
    else if (net > 0) { banner(`${dt > 21 ? 'Dealer busts! ' : ''}You win ${money(net)}`); clack(3); buzz(25); [660, 880].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.1), k * 90)); }
    else if (net < 0) { banner(dBJ ? 'Dealer has blackjack.' : `${hands.length > 1 ? 'Net ' : ''}-${money(-net)}`); Curio.beep(220, 0.18, 'sawtooth', 0.05); }
    else banner('Push. Nobody wins.');
    if (balance >= 2000 && Math.floor(balance / 1000) > Math.floor(Curio.store.get('bj:celebrated', START) / 1000)) {
      Curio.store.set('bj:celebrated', balance);
      setTimeout(() => Curio.toast(`New milestone: ${money(balance)}! 🤑`), 900);
    }
    phase = 'bet';
    fitBets();
    render();
    renderStats();
    if (balance < MIN) bankrupt();
    else if (opts.quiz && ++sinceQuiz >= 5) { sinceQuiz = 0; setTimeout(quiz, 900); }
  }

  function fitBets() {
    if (betTotal() <= balance) return;
    bets.pp = 0; bets.t3 = 0;
    if (bets.main > balance) bets.main = Math.floor(balance / 5) * 5 >= MIN ? Math.floor(balance / 5) * 5 : 0;
  }

  function answerSet(correct) {
    const set = new Set([correct]);
    while (set.size < 5) set.add(correct + Curio.randInt(-4, 4));
    return [...set].sort((a, b) => a - b);
  }
  async function quiz() {
    if (phase !== 'bet' || document.querySelector('.curio-modal')) return;
    const ans = answerSet(rc);
    const v = await Curio.modal({ emoji: '🧮', title: 'Count check', body: 'Quick, what is the Hi-Lo running count for this shoe?', buttons: ans.map((n) => ({ label: n > 0 ? `+${n}` : String(n), value: n })) });
    more.quizT++;
    if (v === rc) { more.quizR++; Curio.toast('Spot on. The pit boss is watching you now.'); Curio.beep(880, 0.08, 'triangle', 0.1); if (more.quizR >= 10) award('quiz10'); }
    else Curio.toast(`It was ${rc > 0 ? '+' : ''}${rc}. Keep at it.`);
    save(); renderStats();
  }

  async function bankrupt() {
    const v = await Curio.modal({ emoji: '🪙', title: 'Busted flat', body: `You are out of chips. Peak bankroll this run: ${money(peak)}. ${more.hands} hands played, ${more.bjs} blackjacks. The house always... well, usually wins. Want a fresh $1,000?`, buttons: [{ label: 'Refill to $1,000', value: 'refill' }, { label: 'Not now', value: 'no' }] });
    if (v === 'refill') refill();
  }

  function refill() {
    balance = START; bets = { main: 25, pp: 0, t3: 0 };
    Curio.store.set('bj:celebrated', START);
    save();
    Curio.toast('Fresh chips. Good luck!');
    clack(6);
    render();
  }

  function renderStats() {
    const items = [
      [more.hands, 'Hands'], [more.bjs, 'Blackjacks'], [money(more.bigWin), 'Best win'],
      [more.bestStreak, 'Book streak'], [more.sideWins, 'Side wins'], [more.quizT ? `${more.quizR}/${more.quizT}` : '-', 'Quizzes'],
      [money(more.wagered), 'Wagered'], [money(peak), 'Peak'], [more.drillBest ? `${more.drillBest}` : '-', 'Drill best']
    ];
    $('statgrid').innerHTML = items.map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('badges').innerHTML = BADGES.map(([id, name, d]) => `<div class="badge${badges.includes(id) ? ' got' : ''}"><b>${badges.includes(id) ? name : `🔒 ${name.split(' ').slice(1).join(' ')}`}</b>${d}</div>`).join('');
  }

  function swatches(host, map, key) {
    host.innerHTML = Object.entries(map).map(([k, c]) => `<button type="button" class="swatch" data-k="${k}" style="background:${c}" aria-label="${k}" aria-pressed="${opts[key] === k}"></button>`).join('');
    host.addEventListener('click', (e) => {
      const b = e.target.closest('.swatch'); if (!b) return;
      opts[key] = b.dataset.k; saveOpts();
      host.querySelectorAll('.swatch').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
      Curio.beep(700, 0.04, 'triangle', 0.06);
      render();
    });
  }

  const drill = { running: false, len: 10, spd: 700, count: 0, timer: 0 };
  function segInit(id, key) {
    $(id).addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b || drill.running) return;
      drill[key] = +b.dataset.v;
      $(id).querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    });
  }
  function drillBestText() { $('d-best').textContent = more.drillBest ? `Best: ${more.drillBest} cards counted perfectly in one drill.` : 'Get it right to set a best.'; }
  async function runDrill() {
    if (drill.running) return;
    drill.running = true;
    drill.count = 0;
    $('d-go').disabled = true;
    $('d-ans').replaceChildren();
    const deck = Curio.shuffle(BJ.makeShoe().cards).slice(0, drill.len);
    const stage = $('d-stage');
    for (let i = 3; i > 0; i--) { stage.innerHTML = `<b style="font-size:48px">${i}</b>`; Curio.beep(500, 0.05, 'sine', 0.06); await sleep(450); }
    for (const c of deck) {
      if (!drill.running) return;
      drill.count += BJ.hiLo(c);
      stage.replaceChildren(cardEl(c, false));
      stage.querySelector('.tag')?.remove();
      swish();
      await sleep(drill.spd);
      if (document.hidden) await new Promise((r) => { const f = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', f); r(); } }; document.addEventListener('visibilitychange', f); });
    }
    stage.innerHTML = '<b style="font-size:20px">What is the running count?</b>';
    const host = $('d-ans');
    host.innerHTML = answerSet(drill.count).map((n) => `<button type="button" class="c-btn c-btn--ghost" data-n="${n}">${n > 0 ? '+' : ''}${n}</button>`).join('');
    host.onclick = (e) => {
      const b = e.target.closest('[data-n]'); if (!b) return;
      const right = +b.dataset.n === drill.count;
      host.querySelectorAll('button').forEach((x) => { x.disabled = true; if (+x.dataset.n === drill.count) x.className = 'c-btn'; });
      stage.innerHTML = right ? `<b style="font-size:24px">✅ Correct! ${drill.count > 0 ? '+' : ''}${drill.count}</b>` : `<b style="font-size:20px">❌ It was ${drill.count > 0 ? '+' : ''}${drill.count}</b>`;
      if (right) {
        Curio.beep(880, 0.08, 'triangle', 0.1); setTimeout(() => Curio.beep(1175, 0.1, 'triangle', 0.1), 90);
        if (drill.len > more.drillBest) { more.drillBest = drill.len; save(); }
        if (drill.len === 52 && drill.spd <= 380) { award('drill'); Curio.confetti(100); }
      } else { Curio.beep(200, 0.2, 'sawtooth', 0.05); buzz(60); }
      drillBestText(); renderStats();
      drill.running = false;
      $('d-go').disabled = false;
      $('d-go').textContent = 'Go again';
    };
  }

  $('spots').addEventListener('click', (e) => {
    const s = e.target.closest('.spot'); if (!s || phase !== 'bet') return;
    target = s.dataset.spot;
    Curio.beep(900, 0.03, 'sine', 0.05);
    render();
  });
  $('chips').addEventListener('click', (e) => {
    const c = e.target.closest('.chip'); if (!c || phase !== 'bet') return;
    const v = +c.dataset.v;
    if (betTotal() + v > balance) { Curio.toast('Not enough chips for that.'); return; }
    if (target !== 'main' && bets[target] + v > SIDE_MAX) { Curio.toast(`Side bets max out at ${money(SIDE_MAX)}.`); return; }
    bets[target] += v;
    clack(1);
    buzz(8);
    render();
  });
  const clearBets = () => { if (phase !== 'bet') return; bets = { main: 0, pp: 0, t3: 0 }; Curio.beep(300, 0.05, 'sine', 0.06); render(); };
  const rebet = () => { if ($('rebet').disabled) return; bets = { main: prevBets.main * 2, pp: prevBets.pp * 2, t3: prevBets.t3 * 2 }; clack(3); render(); };
  $('clear').addEventListener('click', clearBets);
  $('rebet').addEventListener('click', rebet);
  $('deal').addEventListener('click', deal);
  $('ins-yes').addEventListener('click', () => insResolve && insResolve(true));
  $('ins-no').addEventListener('click', () => insResolve && insResolve(false));
  $('play-acts').addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) act(b.dataset.a); });
  document.querySelectorAll('.sw').forEach((s) => s.addEventListener('click', () => {
    const k = s.dataset.opt;
    opts[k] = !opts[k]; saveOpts();
    Curio.beep(opts[k] ? 900 : 500, 0.04, 'triangle', 0.06);
    if (k === 'coach') Curio.toast(opts.coach ? 'Coach on: the textbook move glows gold.' : 'Coach off. You are on your own.');
    if (k === 'count') { Curio.toast(opts.count ? 'Hi-Lo overlay on. Every card shows its tag.' : 'Overlay off. Count in your head!'); document.querySelectorAll('.table .card').forEach((el) => el.querySelector('.tag')?.remove()); }
    render();
  }));
  $('refill').addEventListener('click', refill);
  $('d-go').addEventListener('click', runDrill);
  segInit('d-len', 'len'); segInit('d-spd', 'spd');
  $('share').addEventListener('click', async () => {
    const txt = `🃏 Zoble Blackjack: ${money(balance)} bankroll (peak ${money(peak)}), ${more.hands} hands, ${more.bjs} blackjacks, ${more.bookTotal ? Math.round(more.book / more.bookTotal * 100) : 0}% by the book. ${badges.length}/${BADGES.length} badges.`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied to clipboard!'); } catch (e) { Curio.toast(txt, 4000); }
  });
  $('reset').addEventListener('click', async () => {
    const v = await Curio.modal({ emoji: '🧹', title: 'Reset stats?', body: 'This clears your record, badges and bankroll back to $1,000.', buttons: [{ label: 'Reset', value: 'y' }, { label: 'Cancel', value: 'n' }] });
    if (v !== 'y') return;
    Object.assign(stats, { w: 0, l: 0, p: 0 });
    Object.assign(more, { hands: 0, bjs: 0, bigWin: 0, book: 0, bookTotal: 0, streak: 0, bestStreak: 0, sideWins: 0, sideNet: 0, quizR: 0, quizT: 0, drillBest: 0, wagered: 0 });
    badges = []; Curio.store.set('bj:badges', badges);
    peak = START; Curio.store.set('bj:peak', START);
    refill(); renderStats(); drillBestText();
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (phase === 'bet') {
      if (k === 'enter' && !(document.activeElement && document.activeElement.tagName === 'BUTTON')) { e.preventDefault(); deal(); }
      else if (k === 'c') clearBets();
      else if (k === 'r') rebet();
    } else if (phase === 'insure') {
      if (k === 'y' && insResolve) insResolve(true);
      if (k === 'n' && insResolve) insResolve(false);
    } else if (phase === 'play') {
      const a = { h: 'hit', s: 'stand', d: 'double', p: 'split', u: 'surrender' }[k];
      if (a) act(a);
    }
  });

  const tray = $('tray');
  ['#e0a400', '#8e24aa', '#8e24aa', '#222', '#222', '#222', '#2e9d4a', '#2e9d4a', '#2e9d4a', '#e53935', '#e53935', '#8d99a6'].forEach((c) => { const s = document.createElement('span'); s.style.setProperty('--c', c); tray.append(s); });
  swatches($('felts'), FELTS, 'felt');
  swatches($('backs'), BACKS, 'back');
  fitBets();
  render();
  renderStats();
  drillBestText();
  banner('Place your bet');
  if (balance < MIN) setTimeout(bankrupt, 600);
  window.__bj = {
    get phase() { return phase; }, get hands() { return hands; }, get dealer() { return dealer; }, get balance() { return balance; }, get rc() { return rc; },
    setShoe(cards) { shoe = { cards: cards.slice().reverse(), cut: 0, total: cards.length }; }, setFast(v) { opts.fast = v; }, setBets(b) { Object.assign(bets, b); render(); },
    deal, act, insure: (v) => insResolve && insResolve(v)
  };
})();
