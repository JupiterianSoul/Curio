(() => {
  const M = window.MancalaEngine;
  const $ = (id) => document.getElementById(id);
  const boardEl = $('board'), stonesEl = $('stones');
  const YOU = 0, AI = 1;
  const COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8', '#4dd0e1', '#ff8a65', '#f06292', '#aed581', '#90a4ae'];
  const EARTH = ['#9e9e9e', '#8d6e63', '#bcaaa4', '#757575', '#a1887f', '#cfd8dc', '#6d4c41', '#b0bec5'];
  const RULES = {
    kalah: [
      '<b>Pick one of your six pits</b> (the bottom row, or the left column on a phone). Scoop up every stone in it.',
      '<b>Sow counter-clockwise:</b> drop one stone into each following pit, including your own store, but skipping the opponent\'s store.',
      '<b>Last stone in your store?</b> Free turn! Chain these for big swings.',
      '<b>Last stone in one of your empty pits?</b> Capture it plus everything in the pit directly opposite.',
      '<b>Game ends</b> when one side\'s pits are all empty. The other player banks whatever is left on their side. Most stones in store wins.'
    ],
    oware: [
      'Oware (the Abapa rules) is played across Ghana, the Caribbean and beyond. <b>The stores are only for captured seeds:</b> sowing skips them.',
      '<b>Sow counter-clockwise</b> one seed per pit. If you scoop 12 or more seeds, skip the pit you started from.',
      '<b>Capture:</b> if your last seed lands on the opponent\'s side and makes that pit hold exactly <b>2 or 3</b>, take them. Then check the pit before it, and keep going while each holds 2 or 3.',
      '<b>Grand slam:</b> a move that would capture every one of the opponent\'s seeds captures nothing.',
      '<b>Feed your opponent:</b> if their side is empty you must make a move that gives them seeds. If you cannot, the game ends and you keep the seeds on your side.',
      'First to <b>25 seeds</b> wins. 24 each is a draw. After 100 moves without a capture, each side keeps its own seeds.'
    ],
    avalanche: [
      'The chain-reaction family favourite. <b>Sow like Kalah</b>, skipping the opponent\'s store.',
      '<b>Landed in a pit that already had stones?</b> Scoop the whole pit up and keep sowing. Avalanches can travel all the way round the board.',
      '<b>Landed in your store?</b> Free turn.',
      '<b>Landed in an empty pit?</b> Your turn ends. There are no captures.',
      '<b>Game ends</b> when one side is empty; the other side banks its stones. Most stones wins.'
    ]
  };
  const BADGES = [
    ['win', '🏆 First win', 'Beat the AI'],
    ['hard', '🧠 Grandmaster', 'Beat the Hard AI'],
    ['oware', '🌍 Abapa', 'Win at Oware'],
    ['avalanche', '🏔️ Avalanche', 'Win at Avalanche'],
    ['kalah6', '🪨 Heavy board', 'Win Kalah 6'],
    ['all', '🗺️ World tour', 'Win every rule set'],
    ['shutout', '🧹 Clean sweep', 'Win by 20 or more'],
    ['chain3', '🔁 Chain gang', '3 free turns in a row'],
    ['bigcap', '💰 Big haul', 'Capture 10+ in one move'],
    ['duo', '👥 Table talk', 'Finish a 2-player game'],
    ['nohint', '🎯 Unaided', 'Beat Hard without undo or hints'],
    ['ten', '🔟 Regular', 'Win 10 games']
  ];

  let variant = Curio.store.get('mc:variant', 'kalah4');
  if (!M.VARIANTS[variant]) variant = 'kalah4';
  let level = Curio.store.get('mc:level', 'medium');
  if (!['easy', 'medium', 'hard', 'duo'].includes(level)) level = 'medium';
  let fast = Curio.store.get('mc:fast', false);
  let look = Object.assign({ board: 'walnut', skin: 'gems' }, Curio.store.get('mc:look', {}));
  let records = Curio.store.get('mc:records2', null);
  if (!records || typeof records !== 'object') {
    records = { kalah4: Curio.store.get('mc:records', {}) };
  }
  const totals = Object.assign({ v: 2, games: 0, wins: 0, bestCap: 0, bestChain: 0, bestMargin: 0 }, Curio.store.get('mc:totals', {}));
  let badges = Curio.store.get('mc:badges', []);
  if (!Array.isArray(badges)) badges = [];
  const won = new Set(Curio.store.get('mc:wonv', []));
  const rec = () => ((records[variant] ||= {})[level] ||= { w: 0, l: 0, d: 0 });
  let b, turn, over, busy, token = 0, stones, history = [], msc = 0, chain = 0, aided = false;
  const duo = () => level === 'duo';
  const human = (p) => duo() || p === YOU;
  const R = () => M.rulesOf(variant);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } };
  const name = (p) => (duo() ? (p === 0 ? 'Player 1' : 'Player 2') : p === YOU ? 'You' : 'The AI');

  function award(id) {
    if (badges.includes(id)) return;
    badges.push(id);
    Curio.store.set('mc:badges', badges);
    const x = BADGES.find((y) => y[0] === id);
    if (x) setTimeout(() => Curio.toast(`Badge: ${x[1]}`), 1200);
  }

  const pits = [];
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('button');
    el.type = 'button';
    const store = i === 6 || i === 13;
    el.className = `pit${store ? ' store' : ''}${i > 6 ? ' top' : ''}`;
    let hr, hc, vr, vc;
    if (i === 13) { hr = '1 / 3'; hc = '1'; vr = '1'; vc = '1 / 3'; }
    else if (i === 6) { hr = '1 / 3'; hc = '8'; vr = '8'; vc = '1 / 3'; }
    else if (i < 6) { hr = '2'; hc = String(i + 2); vr = String(i + 2); vc = '1'; }
    else { hr = '1'; hc = String(2 + (12 - i)); vr = String(2 + (12 - i)); vc = '2'; }
    el.style.setProperty('--hr', hr); el.style.setProperty('--hc', hc);
    el.style.setProperty('--vr', vr); el.style.setProperty('--vc', vc);
    el.innerHTML = '<span class="count">0</span>';
    if (!store) {
      el.addEventListener('click', () => play(i));
      el.addEventListener('mouseenter', () => preview(i));
      el.addEventListener('focus', () => preview(i));
      el.addEventListener('mouseleave', () => preview(-1));
      el.addEventListener('blur', () => preview(-1));
    } else el.tabIndex = -1;
    boardEl.insertBefore(el, stonesEl);
    pits.push(el);
  }

  let worker = null, pending = null, hintPending = null;
  function makeWorker() {
    try {
      const src = `const M=(${window.mancalaEngine.toString()})();onmessage=(e)=>{postMessage({id:e.data.id,kind:e.data.kind,m:M.think(e.data.b,e.data.p,e.data.level,e.data.v)});};`;
      worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = (e) => {
        if (e.data.kind === 'hint') { if (hintPending && e.data.id === token) hintPending(e.data.m); return; }
        if (e.data.id === token && pending) pending(e.data.m);
      };
      worker.onerror = () => { worker = null; };
    } catch (e) { worker = null; }
  }
  makeWorker();

  function spot(i, k, total) {
    const br = boardEl.getBoundingClientRect(), pr = pits[i].getBoundingClientRect();
    const cx = pr.left - br.left + pr.width / 2, cy = pr.top - br.top + pr.height / 2;
    const store = i === 6 || i === 13;
    const rx = pr.width / 2 * (store ? 0.55 : 0.52), ry = pr.height / 2 * (store ? 0.74 : 0.52);
    const t = Math.sqrt((k + 0.5) / Math.max(total, 8));
    const a = k * 2.39996 + i;
    return { x: cx + Math.cos(a) * rx * Math.min(1, t), y: cy + Math.sin(a) * ry * Math.min(1, t) };
  }

  function stoneSize() {
    const w = pits[0].getBoundingClientRect().width;
    const per = Math.max(...b.slice(0, 6), ...b.slice(7, 13), 4);
    const shrink = per > 10 ? Math.sqrt(10 / per) : 1;
    return Math.max(8, Math.min(17, w * 0.2 * shrink));
  }

  function layoutPit(i, animate) {
    const list = stones[i];
    list.forEach((s, k) => {
      const p = spot(i, k, list.length);
      s.el.classList.toggle('instant', !animate);
      s.el.style.left = `${p.x}px`; s.el.style.top = `${p.y}px`;
    });
  }

  function layoutAll() {
    stonesEl.style.setProperty('--s', `${stoneSize()}px`);
    for (let i = 0; i < 14; i++) layoutPit(i, false);
  }

  function buildStones() {
    stonesEl.replaceChildren();
    stones = Array.from({ length: 14 }, () => []);
    let c = 0;
    for (let i = 0; i < 14; i++) for (let k = 0; k < b[i]; k++) {
      const el = document.createElement('span');
      el.className = 'stone instant';
      el.style.setProperty('--c', COLORS[(c * 7 + i) % COLORS.length]);
      el.style.setProperty('--p', EARTH[(c * 5 + i * 3) % EARTH.length]);
      el.style.rotate = `${(c * 47) % 180}deg`;
      c++;
      stonesEl.append(el);
      stones[i].push({ el });
    }
    layoutAll();
  }

  function stopAI() {
    token++;
    pending = null; hintPending = null;
    if (busy && worker) { worker.terminate(); makeWorker(); }
  }

  function newGame() {
    stopAI();
    b = M.initial(R().seeds); turn = YOU; over = false; busy = false; history = []; msc = 0; chain = 0; aided = false;
    buildStones();
    document.querySelector('.curio-modal')?.remove();
    renderRules();
    render();
  }

  function applyLook() {
    document.querySelector('.mc').dataset.board = look.board;
    stonesEl.className = `stones skin-${look.skin}`;
    document.querySelectorAll('#boards button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === look.board)));
    document.querySelectorAll('#skins button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === look.skin)));
  }

  function renderRules() {
    const kind = R().kind;
    $('rules-title').textContent = `How to play ${R().name}${kind === 'kalah' ? ` (${R().seeds} stones a pit)` : ''}`;
    $('rules').innerHTML = RULES[kind].map((x) => `<li>${x}</li>`).join('');
  }

  function render(msg) {
    const ok = new Set(!over && !busy && human(turn) ? M.legal(b, turn, variant) : []);
    pits.forEach((el, i) => {
      const c = el.querySelector('.count');
      if (c.textContent !== String(b[i])) c.textContent = b[i];
      el.classList.toggle('ok', ok.has(i));
      const label = i === 6 ? `${name(0)} store` : i === 13 ? `${name(1)} store` : i < 6 ? `${name(0)} pit ${i + 1}` : `${name(1)} pit ${i - 6}`;
      el.setAttribute('aria-label', `${label}: ${b[i]} stone${b[i] === 1 ? '' : 's'}${ok.has(i) ? ', tap to sow' : ''}`);
      el.tabIndex = ok.has(i) ? 0 : -1;
    });
    $('who-me').classList.toggle('on', !over && turn === 0);
    $('who-ai').classList.toggle('on', !over && turn === 1);
    $('who-me').textContent = duo() ? `Player 1: ${b[6]} 🟠` : `You: ${b[6]} 😀`;
    $('who-ai').textContent = duo() ? `🔵 Player 2: ${b[13]}` : `🤖 AI: ${b[13]}`;
    $('speed').setAttribute('aria-pressed', String(fast));
    $('speed').textContent = fast ? '⏩ Fast: on' : '⏩ Fast: off';
    $('undo').disabled = !history.length || (busy && human(turn));
    $('hint').disabled = over || busy || !human(turn);
    document.querySelectorAll('#levels button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.level === level)));
    document.querySelectorAll('#variants button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.v === variant)));
    renderStats();
    if (over) return;
    const st = $('status');
    const extraNote = R().kind === 'oware' ? `${msc >= 60 ? ` ${100 - msc} moves left before the no-capture limit.` : ''}` : '';
    if (human(turn)) {
      const who = duo() ? `${name(turn)}, your turn.` : 'Your turn.';
      const sub = msg || (duo() ? `Pick a pit on the ${turn === 0 ? 'bottom' : 'top'} row.` : 'Pick a pit on your side.');
      st.innerHTML = busy ? `Sowing...${msg ? `<small>${msg}</small>` : ''}` : `${who}<small>${sub}${extraNote}</small>`;
    } else st.innerHTML = `AI's turn...${msg ? `<small>${msg}</small>` : ''}`;
  }

  function renderStats() {
    const r = rec();
    const items = [
      [`${r.w}-${r.l}-${r.d}`, duo() ? 'P1-P2-Draw' : 'W-L-D here'], [totals.games, 'Games'], [totals.wins, 'Wins'],
      [totals.bestMargin || '-', 'Best margin'], [totals.bestCap || '-', 'Best capture'], [totals.bestChain || '-', 'Best chain']
    ];
    $('statgrid').innerHTML = items.map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('badges').innerHTML = BADGES.map(([id, nm, d]) => `<div class="badge${badges.includes(id) ? ' got' : ''}"><b>${badges.includes(id) ? nm : `🔒 ${nm.split(' ').slice(1).join(' ')}`}</b>${d}</div>`).join('');
  }

  function preview(i) {
    pits.forEach((p) => { p.classList.remove('land'); p.querySelector('.ghost')?.remove(); });
    if (i < 0 || busy || over || !human(turn) || !M.legal(b, turn, variant).includes(i)) return;
    const r = M.sow(b, i, turn, variant);
    pits[r.last].classList.add('land');
    const gain = r.board[M.STORE[turn]] - b[M.STORE[turn]];
    if (gain > 0) { const g = document.createElement('span'); g.className = 'ghost'; g.textContent = `+${gain}`; pits[M.STORE[turn]].append(g); }
  }

  function popAt(i, text) {
    const br = boardEl.getBoundingClientRect(), pr = pits[i].getBoundingClientRect();
    const d = document.createElement('div');
    d.className = 'pop';
    d.textContent = text;
    d.style.left = `${pr.left - br.left + pr.width / 2}px`;
    d.style.top = `${pr.top - br.top + pr.height / 2}px`;
    boardEl.append(d);
    setTimeout(() => d.remove(), 1200);
  }
  function tick(i) {
    const c = pits[i].querySelector('.count');
    c.textContent = stones[i].length;
    c.classList.remove('tick'); void c.offsetWidth; c.classList.add('tick');
  }
  function plink(k) {
    const ac = !Curio.muted && Curio.audioContext && Curio.audioContext();
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(900 + (k % 8) * 70, t);
    o.frequency.exponentialRampToValueAtTime(420 + (k % 8) * 30, t + 0.07);
    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.14);
  }
  function shake() { boardEl.classList.remove('shake'); void boardEl.offsetWidth; boardEl.classList.add('shake'); }

  async function animateMove(i, p, r) {
    const my = token;
    const step = fast ? 100 : 220;
    pits[i].classList.add('src');
    const hand = stones[i].splice(0);
    hand.forEach((s) => { s.el.classList.remove('instant'); s.el.classList.add('fly'); });
    tick(i);
    await sleep(step / 2);
    let k = 0;
    for (const ev of r.path) {
      if (typeof ev === 'object') {
        const more = stones[ev.pick].splice(0);
        more.forEach((s) => { s.el.classList.remove('instant'); s.el.classList.add('fly'); });
        hand.push(...more);
        tick(ev.pick);
        pits[ev.pick].classList.add('flash');
        setTimeout(() => pits[ev.pick].classList.remove('flash'), 600);
        Curio.beep(240, 0.08, 'triangle', 0.08);
        await sleep(step);
        if (my !== token) return false;
        continue;
      }
      const s = hand.shift();
      stones[ev].push(s);
      layoutPit(ev, true);
      hand.forEach((h) => { const pt = spot(ev, stones[ev].length, stones[ev].length + 1); h.el.style.left = `${pt.x}px`; h.el.style.top = `${pt.y - 6}px`; });
      tick(ev);
      plink(k++);
      await sleep(step);
      if (my !== token) return false;
      s.el.classList.remove('fly');
    }
    pits[i].classList.remove('src');
    if (r.capture) {
      await sleep(step);
      const store = M.STORE[p];
      const moved = r.capture.pits.flatMap((x) => stones[x].splice(0));
      r.capture.pits.forEach((x) => { tick(x); pits[x].classList.add('flash'); setTimeout(() => pits[x].classList.remove('flash'), 650); });
      stones[store].push(...moved);
      moved.forEach((s) => s.el.classList.add('fly'));
      layoutPit(store, true);
      tick(store);
      popAt(store, `+${r.capture.stones}`);
      [300, 240, 200].forEach((f, j) => setTimeout(() => Curio.beep(f, 0.09, 'square', 0.06), j * 70));
      if (r.capture.stones >= 6) { shake(); buzz([30, 30, 30]); } else buzz(20);
      if (human(p) && !duo()) {
        if (r.capture.stones > totals.bestCap) totals.bestCap = r.capture.stones;
        if (r.capture.stones >= 10) award('bigcap');
      }
      Curio.toast(human(p) && !duo() ? `Capture! ${r.capture.stones} into your store.` : `${name(p)} captured ${r.capture.stones}.`);
      await sleep(450);
      if (my !== token) return false;
      moved.forEach((s) => s.el.classList.remove('fly'));
    }
    if (r.extra) {
      pits[M.STORE[p]].classList.add('flash');
      setTimeout(() => pits[M.STORE[p]].classList.remove('flash'), 650);
      popAt(M.STORE[p], 'Free turn!');
      [660, 880].forEach((f, j) => setTimeout(() => Curio.beep(f, 0.07, 'triangle', 0.1), j * 70));
    }
    if (r.sweep) {
      await sleep(step * 2);
      if (!(await sweepAnim(r.sweep))) return false;
    }
    b = r.board;
    if (stoneSize() !== parseFloat(stonesEl.style.getPropertyValue('--s'))) layoutAll();
    return true;
  }

  async function sweepAnim(sweep) {
    const my = token;
    for (const sw of sweep) {
      const moved = stones[sw.pit].splice(0);
      stones[sw.store].push(...moved);
      moved.forEach((s) => s.el.classList.add('fly'));
      layoutPit(sw.store, true);
      tick(sw.pit); tick(sw.store);
    }
    Curio.beep(500, 0.15, 'sine', 0.08);
    await sleep(500);
    return my === token;
  }

  async function play(i) {
    if (over || busy || !human(turn)) return;
    if (!M.pitsOf(turn).includes(i)) { if (!duo()) Curio.toast('Those are the AI\'s pits.'); return; }
    if (!M.legal(b, turn, variant).includes(i)) {
      Curio.toast(b[i] ? 'You must feed your opponent!' : 'That pit is empty.');
      pits[i].animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 200 });
      return;
    }
    history.push({ b: b.slice(), turn, msc, chain });
    if (history.length > 200) history.shift();
    busy = true;
    preview(-1);
    render();
    const p = turn;
    const r = M.sow(b, i, p, variant);
    if (!(await animateMove(i, p, r))) return;
    busy = false;
    next(r, p);
  }

  async function next(r, p) {
    msc = r.capture ? 0 : msc + 1;
    if (r.over) { finish(); return; }
    if (R().kind === 'oware' && msc >= 100) {
      const nb = b.slice();
      const sweep = [];
      for (const q of [0, 1]) for (const x of M.pitsOf(q)) if (nb[x]) { sweep.push({ pit: x, store: M.STORE[q], n: nb[x] }); nb[M.STORE[q]] += nb[x]; nb[x] = 0; }
      Curio.toast('100 moves without a capture. Each side keeps its seeds.');
      if (!(await sweepAnim(sweep))) return;
      b = nb;
      finish();
      return;
    }
    if (r.extra) {
      chain++;
      if (human(p) && !duo()) { if (chain > totals.bestChain) totals.bestChain = chain; if (chain >= 3) award('chain3'); }
      turn = p;
      const msg = human(p) ? `Last stone in the store. Free turn!${chain > 1 ? ` That is ${chain} in a row!` : ''}` : 'The AI landed in its store and goes again.';
      if (human(p)) { Curio.toast(chain > 1 ? `Free turn x${chain}! 🔥` : 'Free turn! 🎉'); buzz(15); }
      render(msg);
      if (!human(p)) aiTurn(msg);
      return;
    }
    chain = 0;
    turn = 1 - p;
    render(r.capture && !human(p) ? `It captured ${r.capture.stones}.` : '');
    if (!human(turn)) aiTurn();
  }

  function aiTurn(msg) {
    busy = true; render(msg || 'Thinking about where to sow.');
    const my = ++token, t0 = performance.now();
    pending = async (m) => {
      pending = null;
      await sleep(Math.max(0, 550 - (performance.now() - t0)));
      if (my !== token) return;
      const legal = M.legal(b, AI, variant);
      if (!legal.includes(m)) m = legal[0];
      const r = M.sow(b, m, AI, variant);
      if (!(await animateMove(m, AI, r))) return;
      busy = false;
      next(r, AI);
    };
    if (worker) worker.postMessage({ id: my, b, p: AI, level, v: variant });
    else setTimeout(() => pending && pending(M.think(b, AI, 'easy', variant)), 30);
  }

  function undo() {
    if (!history.length || (busy && human(turn))) return;
    stopAI();
    const h = history.pop();
    b = h.b; turn = h.turn; msc = h.msc; chain = h.chain || 0; over = false; busy = false; aided = true;
    document.querySelector('.curio-modal')?.remove();
    buildStones();
    Curio.beep(520, 0.06, 'sine', 0.07); setTimeout(() => Curio.beep(390, 0.06, 'sine', 0.07), 60);
    render('Move taken back.');
  }

  function hint() {
    if (over || busy || !human(turn)) return;
    aided = true;
    const show = (m) => {
      hintPending = null;
      if (m < 0) return;
      pits[m].classList.remove('hint'); void pits[m].offsetWidth; pits[m].classList.add('hint');
      setTimeout(() => pits[m].classList.remove('hint'), 3100);
      Curio.beep(1046, 0.08, 'sine', 0.08);
    };
    if (worker) { hintPending = show; worker.postMessage({ id: token, kind: 'hint', b, p: turn, level: 'medium', v: variant }); }
    else show(M.think(b, turn, 'easy', variant));
  }

  async function finish() {
    over = true; busy = false;
    render();
    const p1 = b[6], p2 = b[13];
    const outcome = p1 > p2 ? 'win' : p1 < p2 ? 'lose' : 'draw';
    rec()[{ win: 'w', lose: 'l', draw: 'd' }[outcome]]++;
    Curio.store.set('mc:records2', records);
    const st = $('status');
    let body = '';
    let title, emoji;
    if (duo()) {
      award('duo');
      title = outcome === 'draw' ? 'Dead even' : `${outcome === 'win' ? 'Player 1' : 'Player 2'} wins!`;
      emoji = outcome === 'draw' ? '🤝' : '🏆';
      st.innerHTML = `${title} ${Math.max(p1, p2)} to ${Math.min(p1, p2)}`;
      body = `Head to head on ${R().name}: ${rec().w}-${rec().l}-${rec().d}.`;
      Curio.confetti();
    } else {
      totals.games++;
      if (outcome === 'win') {
        totals.wins++;
        const margin = p1 - p2;
        if (margin > totals.bestMargin) totals.bestMargin = margin;
        const best = Curio.best(`margin-${variant}-${level}`, margin);
        body = best.isNew ? `A ${margin}-stone margin, your best on ${level} ${R().name}!` : `Best margin here: ${best.best}.`;
        title = 'Master sower!'; emoji = '🏆';
        st.innerHTML = `You win, ${p1} to ${p2}! 🎉`;
        award('win');
        if (level === 'hard') { award('hard'); if (!aided) award('nohint'); }
        if (variant === 'oware') award('oware');
        if (variant === 'avalanche') award('avalanche');
        if (variant === 'kalah6') award('kalah6');
        if (margin >= 20) award('shutout');
        if (totals.wins >= 10) award('ten');
        won.add(variant); Curio.store.set('mc:wonv', [...won]);
        if (Object.keys(M.VARIANTS).every((v) => won.has(v))) award('all');
        Curio.confetti();
        buzz([30, 40, 60]);
        [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.12), k * 90));
      } else if (outcome === 'lose') {
        body = R().kind === 'oware' ? 'Tip: avoid leaving pits with 1 or 2 seeds where the AI can reach them.' : 'Tip: count stones so your last one lands in your store, and keep an eye on empty pits.';
        title = 'Out-sown by the machine'; emoji = '🤖';
        st.innerHTML = `AI wins, ${p2} to ${p1}.<small>The stones have spoken.</small>`;
        [392, 330, 262].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.16, 'sawtooth', 0.07), k * 120));
      } else { body = 'Perfectly shared.'; title = 'Even stevens'; emoji = '🤝'; st.innerHTML = `A ${p1}-${p2} draw!`; }
      body += ` Record vs ${level} AI on ${R().name}: ${rec().w}-${rec().l}-${rec().d}.`;
    }
    Curio.store.set('mc:totals', totals);
    renderStats();
    const my = token;
    await sleep(900);
    if (my !== token) return;
    const node = document.createElement('div');
    node.className = 'result';
    const tot = Math.max(1, p1 + p2);
    node.innerHTML = `<div class="bar"><span style="width:${p1 / tot * 100}%;background:var(--accent)">${p1}</span><span style="width:${p2 / tot * 100}%;background:#4f7cc4">${p2}</span></div><div>${body}</div>`;
    const v = await Curio.modal({ emoji, title, body: node, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Share', value: 'share' }, { label: 'Look at the board', value: 'look' }] });
    if (v === 'again' && my === token) newGame();
    if (v === 'share') share(`${p1}-${p2}`);
  }

  async function share(score) {
    const r = rec();
    const txt = `🪨 Curio Mancala (${R().name}, ${duo() ? '2 players' : `${level} AI`})${score ? `: ${score}` : ''}. Record ${r.w}-${r.l}-${r.d}, ${totals.wins} wins total, ${badges.length}/${BADGES.length} badges.`;
    try { await navigator.clipboard.writeText(txt); Curio.toast('Copied to clipboard!'); } catch (e) { Curio.toast(txt, 4000); }
  }

  $('new').addEventListener('click', newGame);
  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', hint);
  $('share').addEventListener('click', () => share(''));
  $('speed').addEventListener('click', () => { fast = !fast; Curio.store.set('mc:fast', fast); render(); });
  $('levels').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    level = x.dataset.level; Curio.store.set('mc:level', level);
    Curio.toast(level === 'duo' ? 'Pass and play. Player 1 takes the bottom row.' : `${x.textContent.slice(2).trim()} AI. New game!`);
    newGame();
  });
  $('variants').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    variant = x.dataset.v; Curio.store.set('mc:variant', variant);
    Curio.toast(`${M.VARIANTS[variant].name}! Rules are below the board.`);
    newGame();
  });
  const pickLook = (id, key) => $(id).addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    look[key] = x.dataset.k; Curio.store.set('mc:look', look);
    applyLook();
    Curio.beep(700, 0.04, 'triangle', 0.06);
  });
  pickLook('boards', 'board'); pickLook('skins', 'skin');
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k >= '1' && k <= '6') play(turn === 0 ? +k - 1 : 13 - +k);
    else if (k === 'n') newGame();
    else if (k === 'u') undo();
    else if (k === 'h') hint();
  });
  if (window.ResizeObserver) new ResizeObserver(() => { if (stones) layoutAll(); }).observe(boardEl);
  else addEventListener('resize', () => layoutAll());

  applyLook();
  newGame();
  window.__mc = { get b() { return b; }, get turn() { return turn; }, get busy() { return busy; }, get over() { return over; }, play, undo, setFast(v) { fast = v; }, M };
})();
