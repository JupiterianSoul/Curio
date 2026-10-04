(function (root) {
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const DECKS = 6;

  function makeShoe(rand = Math.random) {
    const cards = [];
    for (let d = 0; d < DECKS; d++) for (const s of SUITS) for (const r of RANKS) cards.push({ r, s });
    for (let i = cards.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [cards[i], cards[j]] = [cards[j], cards[i]]; }
    return { cards, cut: Math.floor(cards.length * (0.22 + rand() * 0.06)), total: cards.length };
  }

  const value = (c) => (c.r === 'A' ? 11 : ['J', 'Q', 'K'].includes(c.r) ? 10 : +c.r);

  function total(cards) {
    let t = 0, aces = 0;
    for (const c of cards) { t += value(c); if (c.r === 'A') aces++; }
    while (t > 21 && aces) { t -= 10; aces--; }
    return { total: t, soft: aces > 0 && t <= 21 };
  }

  const isBlackjack = (cards) => cards.length === 2 && total(cards).total === 21;
  const canSplit = (cards) => cards.length === 2 && value(cards[0]) === value(cards[1]);
  const dealerHits = (cards) => total(cards).total < 17;

  function strategy(cards, up, opts = {}) {
    const d = value(up);
    const canDouble = cards.length === 2 && opts.canDouble !== false;
    const { total: t, soft } = total(cards);
    const D = (alt) => (canDouble ? 'double' : alt);
    if (opts.canSurrender && cards.length === 2 && !soft && !(canSplit(cards) && value(cards[0]) === 8)) {
      if (t === 16 && (d === 9 || d === 10 || d === 11)) return 'surrender';
      if (t === 15 && d === 10) return 'surrender';
    }
    if (canSplit(cards) && opts.canSplit !== false) {
      const v = value(cards[0]);
      if (v === 11 || v === 8) return 'split';
      if (v === 9 && ![7, 10, 11].includes(d)) return 'split';
      if ((v === 7 || v === 3 || v === 2) && d <= 7) return 'split';
      if (v === 6 && d <= 6) return 'split';
      if (v === 4 && (d === 5 || d === 6)) return 'split';
    }
    if (soft) {
      if (t >= 19) return 'stand';
      if (t === 18) { if (d >= 3 && d <= 6) return D('stand'); if (d <= 8) return 'stand'; return 'hit'; }
      if (t === 17) return d >= 3 && d <= 6 ? D('hit') : 'hit';
      if (t === 15 || t === 16) return d >= 4 && d <= 6 ? D('hit') : 'hit';
      if (t === 13 || t === 14) return d >= 5 && d <= 6 ? D('hit') : 'hit';
      return 'hit';
    }
    if (t >= 17) return 'stand';
    if (t >= 13) return d <= 6 ? 'stand' : 'hit';
    if (t === 12) return d >= 4 && d <= 6 ? 'stand' : 'hit';
    if (t === 11) return d <= 10 ? D('hit') : 'hit';
    if (t === 10) return d <= 9 ? D('hit') : 'hit';
    if (t === 9) return d >= 3 && d <= 6 ? D('hit') : 'hit';
    return 'hit';
  }

  const rankIdx = (r) => RANKS.indexOf(r) + 1;
  const isRed = (s) => s === '♥' || s === '♦';

  function perfectPairs(a, b) {
    if (a.r !== b.r) return null;
    if (a.s === b.s) return { name: 'Perfect pair', pays: 25 };
    if (isRed(a.s) === isRed(b.s)) return { name: 'Coloured pair', pays: 12 };
    return { name: 'Mixed pair', pays: 6 };
  }

  function twentyOnePlus3(a, b, c) {
    const cs = [a, b, c];
    const flush = cs.every((x) => x.s === a.s);
    const ranks = cs.map((x) => rankIdx(x.r)).sort((x, y) => x - y);
    const trips = ranks[0] === ranks[2];
    const run = (rs) => rs[1] === rs[0] + 1 && rs[2] === rs[1] + 1;
    const straight = !trips && (run(ranks) || (ranks[0] === 1 && ranks[1] === 12 && ranks[2] === 13));
    if (trips && flush) return { name: 'Suited trips', pays: 100 };
    if (straight && flush) return { name: 'Straight flush', pays: 40 };
    if (trips) return { name: 'Three of a kind', pays: 30 };
    if (straight) return { name: 'Straight', pays: 10 };
    if (flush) return { name: 'Flush', pays: 5 };
    return null;
  }

  const hiLo = (c) => { const v = value(c); return v <= 6 ? 1 : v >= 10 ? -1 : 0; };

  root.Blackjack = { SUITS, RANKS, DECKS, makeShoe, value, total, isBlackjack, canSplit, dealerHits, strategy, perfectPairs, twentyOnePlus3, hiLo };
})(typeof window !== 'undefined' ? window : globalThis);
