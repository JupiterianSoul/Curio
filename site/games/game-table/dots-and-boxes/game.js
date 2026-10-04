(() => {
  const D = window.DotsBoxes;
  const $ = (id) => document.getElementById(id);
  const svg = $('board');
  const NS = 'http://www.w3.org/2000/svg';
  const U = 60, PAD = 18;
  const COLORS = ['var(--p1)', 'var(--p2)', 'var(--p3)', 'var(--p4)'];
  const HEX = ['#ff5a36', '#2f7de1', '#1f9d55', '#9b59b6'];
  const MARKS = ['★', '●', '▲', '◆'];
  const FACES = ['😀', '😎', '🤠', '🥳'];
  const ACH = [
    ['first', '✏️', 'First box', 'Win a game against the AI'],
    ['medium', '🧠', 'Outsmarted', 'Beat the Clever AI'],
    ['hard', '🦊', 'Double-crosser', 'Beat the Sneaky AI'],
    ['big', '🗺️', 'Big map', 'Win on 7×7 or the wide 8×5 board'],
    ['chain', '⛓️', 'Chain gang', 'Take 6 or more boxes in one turn'],
    ['shutout', '🧹', 'Shutout', 'Win without the AI scoring a box'],
    ['party', '🎉', 'Party game', 'Finish a 3 or 4 player game'],
    ['nohint', '🙈', 'Pure instinct', 'Beat Clever or Sneaky without hints or undo']
  ];

  const SAVE_V = 2;
  const load = () => {
    const oldSize = Curio.store.get('db:size', 5);
    const base = { v: SAVE_V, size: `${oldSize}x${oldSize}`, mode: Curio.store.get('db:mode', 'hard'), safety: false, rec: {}, ach: {}, boxes: 0, games: 0 };
    const raw = Curio.store.get('db:v2', null);
    if (!raw || raw.v !== SAVE_V) return base;
    return { ...base, ...raw, rec: raw.rec || {}, ach: raw.ach || {} };
  };
  const save = load();
  if (!['3x3', '4x4', '5x5', '6x6', '7x7', '5x8'].includes(save.size)) save.size = '5x5';
  if (!['easy', 'medium', 'hard', 'two', 'three', 'four'].includes(save.mode)) save.mode = 'hard';
  const keep = { size: save.size, mode: save.mode };
  if (Curio.simple) { save.size = '4x4'; save.mode = 'medium'; }
  const persist = () => Curio.store.set('db:v2', Curio.simple ? { ...save, ...keep } : save);
  const players = () => ({ two: 2, three: 3, four: 4 }[save.mode] || 2);
  const vsAI = () => ['easy', 'medium', 'hard'].includes(save.mode);

  let g, turn, over, busy, token = 0, lineEls, hitEls, boxEls, markEls, lastLine = -1, hist = [], usedHelp = false, turnBoxes = 0, bestRun = 0, hintLine = -1;

  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.append(e); return e; };
  const names = () => (vsAI() ? ['You', 'AI'] : Array.from({ length: players() }, (_, k) => `Player ${k + 1}`));

  function lineCoords(l) {
    if (l < g.H) { const r = Math.floor(l / g.C), c = l % g.C; return [PAD + c * U, PAD + r * U, PAD + (c + 1) * U, PAD + r * U]; }
    const k = l - g.H, r = Math.floor(k / (g.C + 1)), c = k % (g.C + 1);
    return [PAD + c * U, PAD + r * U, PAD + c * U, PAD + (r + 1) * U];
  }

  function build() {
    svg.replaceChildren();
    const W = g.C * U + PAD * 2, Hh = g.R * U + PAD * 2;
    svg.setAttribute('viewBox', `0 0 ${W} ${Hh}`);
    const defs = el('defs', {}, svg);
    HEX.forEach((h, k) => {
      const p = el('pattern', { id: `hatch${k + 1}`, width: 8, height: 8, patternUnits: 'userSpaceOnUse', patternTransform: `rotate(${[45, -45, 30, -30][k]})` }, defs);
      el('rect', { width: 8, height: 8, fill: h, 'fill-opacity': 0.14 }, p);
      el('line', { x1: 0, y1: 0, x2: 0, y2: 8, stroke: h, 'stroke-width': 3, 'stroke-opacity': 0.35 }, p);
    });
    const gb = el('g', {}, svg), gl = el('g', {}, svg), gd = el('g', {}, svg);
    boxEls = []; markEls = []; lineEls = []; hitEls = [];
    for (let b = 0; b < g.R * g.C; b++) {
      const r = Math.floor(b / g.C), c = b % g.C;
      boxEls.push(el('rect', { class: 'box', x: PAD + c * U + 4, y: PAD + r * U + 4, width: U - 8, height: U - 8, rx: 6 }, gb));
      markEls.push(el('text', { class: 'mark', x: PAD + c * U + U / 2, y: PAD + r * U + U / 2 + 1 }, gb));
    }
    for (let l = 0; l < g.n; l++) {
      const [x1, y1, x2, y2] = lineCoords(l);
      const hit = el('line', { class: 'hit', x1, y1, x2, y2, tabindex: 0, role: 'button', 'aria-label': describe(l) }, gl);
      const wob = (Math.sin(l * 12.9898) * 43758.5453) % 1 * 3;
      const mx = (x1 + x2) / 2 + (y1 === y2 ? 0 : wob), my = (y1 + y2) / 2 + (y1 === y2 ? wob : 0);
      const ln = el('path', { class: 'ln', d: `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}` }, gl);
      hit.addEventListener('click', () => human(l));
      hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); human(l); } });
      hitEls.push(hit); lineEls.push(ln);
    }
    for (let r = 0; r <= g.R; r++) for (let c = 0; c <= g.C; c++) el('circle', { class: 'dot', cx: PAD + c * U, cy: PAD + r * U, r: 5.5 }, gd);
  }

  function describe(l) {
    if (l < g.H) { const r = Math.floor(l / g.C), c = l % g.C; return `Horizontal line, row ${r + 1}, between dots ${c + 1} and ${c + 2}`; }
    const k = l - g.H, r = Math.floor(k / (g.C + 1)), c = k % (g.C + 1);
    return `Vertical line, column ${c + 1}, between rows ${r + 1} and ${r + 2}`;
  }

  function buildScores() {
    const box = $('scores'); box.replaceChildren();
    names().forEach((n, k) => {
      const d = document.createElement('div');
      d.className = 'pl'; d.id = `pl${k + 1}`; d.style.setProperty('--pc', COLORS[k]);
      d.innerHTML = `<i>${vsAI() && k === 1 ? '🤖' : FACES[k]}</i><div><b id="sc${k + 1}">0</b><span></span></div>`;
      d.querySelector('span').textContent = n;
      box.append(d);
    });
  }

  function newGame() {
    token++;
    const [R, C] = save.size.split('x').map(Number);
    g = D.create(R, C);
    turn = 1; over = false; busy = false; lastLine = -1; hist = []; usedHelp = false; turnBoxes = 0; bestRun = 0; hintLine = -1;
    build(); buildScores();
    document.querySelector('.curio-modal')?.remove();
    render();
  }

  function render(msg) {
    const sc = D.score(g, players());
    sc.forEach((v, k) => { const e = $(`sc${k + 1}`); if (e) e.textContent = v; $(`pl${k + 1}`)?.classList.toggle('turn', !over && turn === k + 1); });
    svg.style.setProperty('--tc', COLORS[turn - 1]);
    $('paper').classList.toggle('safety', save.safety);
    hitEls.forEach((h, l) => h.classList.toggle('risky', !g.lines[l] && !D.capturing(g, l) && g.lineBoxes[l].some((b) => D.sides(g, b) === 2)));
    lineEls.forEach((ln, l) => ln.classList.toggle('hintln', l === hintLine && !g.lines[l]));
    document.querySelectorAll('#sizes button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.size === save.size)));
    document.querySelectorAll('#modes button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.mode === save.mode)));
    $('safety').checked = save.safety;
    $('undo').disabled = !hist.length || busy;
    $('hint').disabled = over || busy || (vsAI() && turn !== 1);
    if (over) return;
    const nm = names();
    const who = vsAI() ? (turn === 1 ? 'Your turn' : 'AI is drawing...') : `${nm[turn - 1]}'s turn`;
    $('status').textContent = msg ? `${msg} ${who}.` : `${who}.`;
    $('status').style.color = vsAI() ? '' : HEX[turn - 1];
  }

  function burst(b, p) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const r = Math.floor(b / g.C), c = b % g.C;
    const cx = PAD + c * U + U / 2, cy = PAD + r * U + U / 2;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const dot = el('circle', { cx, cy, r: 3, fill: HEX[p - 1] }, svg);
      dot.animate([{ transform: 'translate(0,0)', opacity: 1 }, { transform: `translate(${Math.cos(a) * 30}px, ${Math.sin(a) * 30}px)`, opacity: 0 }], { duration: 500, easing: 'ease-out' });
      setTimeout(() => dot.remove(), 520);
    }
  }

  function drawLine(l, p) {
    const done = D.apply(g, l, p);
    hintLine = -1;
    lineEls[l].classList.add(`p${p}`, 'drawn');
    window.Cafe?.sound('pencil', 0.8);
    hitEls[l].classList.add('used');
    hitEls[l].setAttribute('tabindex', '-1');
    hitEls[l].setAttribute('aria-label', `${describe(l)}, drawn`);
    if (lastLine >= 0) lineEls[lastLine].classList.remove('last');
    lastLine = l;
    lineEls[l].classList.add('last');
    for (const b of done) {
      boxEls[b].classList.add(`p${p}`);
      markEls[b].textContent = MARKS[p - 1];
      markEls[b].classList.add('on', `p${p}`);
      burst(b, p);
    }
    if (done.length) {
      const s = $(`sc${p}`); s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump');
      turnBoxes += done.length; bestRun = Math.max(bestRun, turnBoxes);
      if (!vsAI() || p === 1) save.boxes += done.length;
      [660, 880].slice(0, done.length).forEach((f, k) => setTimeout(() => Curio.beep(f + (p - 1) * -120, 0.08, 'triangle', 0.12), k * 80));
      try { navigator.vibrate?.(12); } catch {}
    } else { turnBoxes = 0; Curio.beep(p === 1 ? 420 : 320, 0.04, 'sine', 0.08); }
    return done;
  }

  function nextPlayer() { return turn % players() + 1; }

  function afterMove(done) {
    if (!D.open(g).length) { finish(); return; }
    if (vsAI() && turn === 1 && turnBoxes >= 6) unlock('chain');
    if (!done.length) { turn = nextPlayer(); turnBoxes = 0; }
    const msg = done.length ? (done.length === 2 ? 'Double box!' : 'Box!') + ' Go again.' : '';
    render(msg);
    if (vsAI() && turn === 2) aiTurn();
  }

  function human(l) {
    if (over || busy || g.lines[l] || (vsAI() && turn !== 1)) return;
    hist.push({ lines: g.lines.slice(), boxes: g.boxes.slice(), turn, lastLine });
    const done = drawLine(l, turn);
    if (!done.length && vsAI() && g.lineBoxes[l].some((b) => D.sides(g, b) === 3)) { Curio.toast('Uh oh, that was a third side.'); $('paper').classList.remove('shake'); void $('paper').offsetWidth; $('paper').classList.add('shake'); }
    afterMove(done);
  }

  function aiTurn() {
    busy = true;
    render();
    const my = token;
    const think = () => {
      if (my !== token) return;
      const l = D.choose(g, 2, save.mode);
      const done = drawLine(l, 2);
      if (!D.open(g).length) { busy = false; finish(); return; }
      if (done.length) { render('AI closed a box and goes again.'); setTimeout(think, 380); return; }
      busy = false; turnBoxes = 0;
      turn = 1;
      render();
    };
    setTimeout(think, 550);
  }

  function restoreFrom(h) {
    g.lines = h.lines.slice(); g.boxes = h.boxes.slice(); turn = h.turn;
    build();
    for (let l = 0; l < g.n; l++) if (g.lines[l]) { lineEls[l].classList.add(`p${g.lines[l]}`); hitEls[l].classList.add('used'); hitEls[l].setAttribute('tabindex', '-1'); }
    g.boxes.forEach((p, b) => { if (p) { boxEls[b].classList.add(`p${p}`); markEls[b].textContent = MARKS[p - 1]; markEls[b].classList.add('on', `p${p}`); } });
    lastLine = h.lastLine; if (lastLine >= 0 && g.lines[lastLine]) lineEls[lastLine].classList.add('last');
  }
  function undo() {
    if (!hist.length || busy) return;
    token++;
    usedHelp = true;
    restoreFrom(hist.pop());
    over = false; busy = false; turnBoxes = 0;
    document.querySelector('.curio-modal')?.remove();
    Curio.beep(500, 0.05, 'sine', 0.08);
    render();
  }
  function hint() {
    if (over || busy || (vsAI() && turn !== 1)) return;
    usedHelp = true;
    hintLine = D.choose(g, turn, 'hard');
    Curio.beep(990, 0.06, 'sine', 0.07);
    const caps = D.capturing(g, hintLine);
    Curio.toast(caps ? 'Take the box on the glowing line.' : D.isSafe(g, hintLine) ? 'The glowing line is safe: it gives nothing away.' : 'No safe lines left. The glowing one gives away the least.');
    render();
  }

  function unlock(id) {
    if (save.ach[id]) return;
    save.ach[id] = Date.now(); persist();
    const a = ACH.find((x) => x[0] === id);
    if (a) setTimeout(() => Curio.toast(`${a[1]} Badge unlocked: ${a[2]}`, 2400), 1000);
  }
  function paintStats() {
    const r = (k) => save.rec[k] || { w: 0, l: 0, d: 0 };
    $('statgrid').innerHTML = [[`${r('easy').w}-${r('easy').l}`, 'vs Easy'], [`${r('medium').w}-${r('medium').l}`, 'vs Clever'], [`${r('hard').w}-${r('hard').l}`, 'vs Sneaky'], [save.games, 'Games'], [Curio.fmt(save.boxes), 'Boxes'], [Object.keys(save.ach).length, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
    $('achs').innerHTML = ACH.map(([id, e, n, d]) => `<div class="ach${save.ach[id] ? ' on' : ''}" title="${d}"><span>${e}</span><div><b>${n}</b>${d}</div></div>`).join('');
    $('ach-count').textContent = `${Object.keys(save.ach).length}/${ACH.length}`;
  }

  async function finish() {
    over = true; busy = false;
    render();
    const sc = D.score(g, players());
    const nm = names();
    save.games++;
    let title, emoji, body = `${nm.map((n, k) => `${n} ${sc[k]}`).join(', ')} on a ${g.C}×${g.R} board. `;
    const top = Math.max(...sc), winners = sc.map((v, k) => (v === top ? k : -1)).filter((k) => k >= 0);
    if (!vsAI()) {
      title = winners.length > 1 ? 'A tie at the top!' : `${nm[winners[0]]} wins!`;
      emoji = winners.length > 1 ? '🤝' : '🏆';
      $('status').textContent = title;
      if (winners.length === 1) Curio.confetti();
      if (players() > 2) unlock('party');
    } else {
      const [a, b] = sc;
      const rr = (save.rec[save.mode] ||= { w: 0, l: 0, d: 0 });
      if (a > b) {
        rr.w++;
        const best = Curio.best(`margin-${save.mode}-${save.size}`, a - b);
        title = 'You out-boxed the machine!'; emoji = '🏆';
        body += best.isNew ? `Best margin yet on this board: +${a - b}.` : `Best margin here: +${best.best}.`;
        $('status').textContent = `You win ${a} to ${b}!`;
        unlock('first');
        if (save.mode === 'medium') unlock('medium');
        if (save.mode === 'hard') unlock('hard');
        if (save.size === '7x7' || save.size === '5x8') unlock('big');
        if (!b) unlock('shutout');
        if (!usedHelp && save.mode !== 'easy') unlock('nohint');
        Curio.confetti();
        [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.12), k * 90));
      } else if (a < b) {
        rr.l++;
        title = 'Boxed in by the AI'; emoji = '🤖';
        body += 'Tip: count the long chains near the end and try to make your opponent open the first one.';
        $('status').textContent = `AI wins ${b} to ${a}.`;
        [392, 330, 262].forEach((f, k) => setTimeout(() => Curio.beep(f, 0.16, 'sawtooth', 0.07), k * 120));
      } else { rr.d++; title = 'Dead heat!'; emoji = '🤝'; $('status').textContent = 'A tie!'; }
    }
    $('status').style.color = '';
    persist(); paintStats();
    const my = token;
    await new Promise((r) => setTimeout(r, 800));
    if (my !== token) return;
    const v = await Curio.modal({ emoji, title, body, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Share', value: 'share' }, { label: 'Look at the board', value: 'look' }] });
    if (v === 'share') { try { await navigator.clipboard.writeText(`✏️ Zoble Dots and Boxes (${g.C}×${g.R}): ${nm.map((n, k) => `${n} ${sc[k]}`).join(', ')}`); Curio.toast('Copied!'); } catch { Curio.toast('Could not reach the clipboard.'); } }
    if (v === 'again' && my === token) newGame();
  }

  $('new').addEventListener('click', newGame);
  $('undo').addEventListener('click', undo);
  $('hint').addEventListener('click', hint);
  $('safety').addEventListener('change', (e) => { save.safety = e.target.checked; persist(); render(); });
  $('sizes').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    save.size = x.dataset.size; persist();
    newGame();
  });
  $('modes').addEventListener('click', (e) => {
    const x = e.target.closest('button'); if (!x) return;
    save.mode = x.dataset.mode; persist();
    Curio.toast(!vsAI() ? `${players()} players. Take turns on one device.` : save.mode === 'hard' ? 'Sneaky AI: knows about chains and the double-cross.' : save.mode === 'medium' ? 'Clever AI: never gifts a box if it can help it.' : 'Easy AI: grabs boxes, not much else.');
    newGame();
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal') || e.target.closest?.('input')) return;
    const k = e.key.toLowerCase();
    if (k === 'n') newGame(); else if (k === 'u') undo(); else if (k === 'h') hint();
  });

  paintStats();
  newGame();
  if (!Curio.touchpad && !Curio.store.get('padtip:dots-and-boxes', false)) { Curio.store.set('padtip:dots-and-boxes', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad? Turn on Touchpad mode in the top bar.', 3400), 2200); }
  window.__db = { get g() { return g; }, get turn() { return turn; }, get busy() { return busy; }, get over() { return over; }, human, hint, undo, setMode(m, s) { save.mode = m; if (s) save.size = s; persist(); newGame(); } };
})();
