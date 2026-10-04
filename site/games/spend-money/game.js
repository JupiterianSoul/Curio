(() => {
  const FORTUNES = window.SM_FORTUNES, ITEMS = window.SM_ITEMS, CATS = window.SM_CATS;
  const TINT = { food: '#ff9f43', fun: '#9b59b6', tech: '#4ea6ef', style: '#e84393', pets: '#ffc233', ride: '#2ecc71', home: '#e17055', big: '#636e72', good: '#1f9d55' };
  const $ = (id) => document.getElementById(id);
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const short = (n) => n >= 1e12 ? `$${+(n / 1e12).toFixed(2)} trillion` : n >= 1e9 ? `$${+(n / 1e9).toFixed(2)} billion` : n >= 1e6 ? `$${+(n / 1e6).toFixed(2)} million` : money(n);

  const saved = Curio.store.get('sm:save', null);
  const S = { v: 2, who: 'gates', custom: 1e9, carts: {}, badges: [] };
  if (saved && saved.v === 2) Object.assign(S, saved);
  if (!S.carts || typeof S.carts !== 'object') S.carts = {};
  if (!Array.isArray(S.badges)) S.badges = [];
  if (!FORTUNES.find((f) => f.id === S.who)) S.who = 'gates';
  S.custom = Math.max(1, Math.min(1e15, Number(S.custom) || 1e9));
  let saveT = 0;
  const save = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set('sm:save', S), 200); };

  const fortune = () => FORTUNES.find((f) => f.id === S.who);
  const total = () => fortune().custom ? S.custom : fortune().amount;
  let counts = ITEMS.map(() => 0);
  function loadCart() {
    const cart = S.carts[S.who] || {};
    counts = ITEMS.map((it) => Math.max(0, Math.floor(Number(cart[it.n]) || 0)));
    if (spent() > total()) counts = ITEMS.map(() => 0);
  }
  function storeCart() {
    const cart = {};
    ITEMS.forEach((it, i) => { if (counts[i]) cart[it.n] = counts[i]; });
    S.carts[S.who] = cart; save();
  }
  const spent = () => counts.reduce((s, c, i) => s + c * ITEMS[i].p, 0);
  const remaining = () => total() - spent();
  const history = [];

  function avatar(f, size = 40) {
    const ini = f.custom ? '?' : f.id === 'lottery' ? '$' : f.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
    return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" aria-hidden="true"><defs><linearGradient id="av-${f.id}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${f.col}"/><stop offset="1" stop-color="${f.col}" stop-opacity=".7"/></linearGradient></defs><circle cx="20" cy="20" r="19" fill="url(#av-${f.id})"/><circle cx="20" cy="20" r="15.5" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/><text x="20" y="25" text-anchor="middle" font-size="${ini.length > 1 ? 13 : 16}" font-weight="900" fill="#fff" font-family="system-ui,sans-serif">${ini}</text></svg>`;
  }
  function paintWho() {
    const box = $('who');
    box.innerHTML = '';
    for (const f of FORTUNES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(f.id === S.who));
      b.title = f.tag;
      b.innerHTML = `${avatar(f)}<span><b>${f.name}</b><small>${f.custom ? short(S.custom) : short(f.amount)}</small></span>`;
      b.addEventListener('click', () => pickFortune(f.id));
      box.append(b);
    }
    $('customBox').hidden = !fortune().custom;
    $('custom').value = Math.round(S.custom).toLocaleString('en-US');
  }
  function pickFortune(id) {
    if (id === S.who) return;
    storeCart();
    S.who = id; save();
    loadCart(); history.length = 0; stopTimer(true);
    paintWho(); refresh(true);
    Curio.beep(660, 0.08, 'triangle', 0.1);
    $('bar').classList.remove('glint'); void $('bar').offsetWidth; $('bar').classList.add('glint');
  }
  function parseAmount(s) {
    const m = String(s).toLowerCase().replace(/[$,\s]/g, '').match(/^([\d.]+)(k|m|b|t|thousand|million|billion|trillion)?$/);
    if (!m) return null;
    const mult = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9, t: 1e12, trillion: 1e12 }[m[2]] || 1;
    const v = parseFloat(m[1]) * mult;
    return isFinite(v) && v >= 1 ? Math.min(1e15, v) : null;
  }
  $('custom').addEventListener('change', () => {
    const v = parseAmount($('custom').value);
    if (!v) { Curio.toast('Try something like 5,000,000 or 2.5b'); $('custom').value = Math.round(S.custom).toLocaleString('en-US'); return; }
    S.custom = v; save();
    if (spent() > v) { counts = ITEMS.map(() => 0); Curio.toast('Your cart was refunded to fit the new fortune'); }
    storeCart(); paintWho(); refresh(true);
  });

  let cat = 'all', query = '', sort = 'up';
  function paintCats() {
    const box = $('cats');
    box.innerHTML = '';
    for (const [id, label] of CATS) {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = label; b.dataset.c = id;
      b.setAttribute('aria-pressed', String(id === cat));
      b.addEventListener('click', () => { cat = id; paintCats(); applyView(); Curio.beep(520, 0.04, 'sine', 0.06); });
      box.append(b);
    }
  }

  const grid = $('grid');
  const cards = ITEMS.map((it, i) => {
    const el = document.createElement('article');
    el.className = 'c-card sm-item';
    el.style.setProperty('--tint', `color-mix(in srgb, ${TINT[it.c]} 16%, var(--surface))`);
    el.innerHTML = `<div class="sm-item__art">${it.a}<span class="sm-item__qty">0</span></div>
      <div class="sm-item__name">${it.n}</div>
      <div class="sm-item__price">${money(it.p)}</div>
      ${it.f ? `<div class="sm-item__fact">${it.f}</div>` : ''}
      <div class="sm-item__ctl">
        <button type="button" class="sm-sell" aria-label="Sell one ${it.n}">Sell</button>
        <input type="number" inputmode="numeric" min="0" step="1" value="0" aria-label="How many ${it.n}">
        <button type="button" class="sm-buy" aria-label="Buy one ${it.n}">Buy</button>
        <button type="button" class="sm-max" aria-label="Buy as many ${it.n} as you can afford">Buy max</button>
      </div>`;
    const [sell, input, buy, max] = el.querySelectorAll('button, input');
    holdable(sell, () => setCount(i, counts[i] - holdStep(), { source: sell }));
    holdable(buy, () => setCount(i, counts[i] + holdStep(), { source: buy }));
    max.addEventListener('click', () => {
      const can = Math.floor((remaining()) / it.p);
      if (can <= 0) { setCount(i, counts[i] + 1, { source: buy }); return; }
      setCount(i, counts[i] + can, { source: buy });
    });
    input.addEventListener('input', () => { const v = Math.max(0, Math.floor(Number(input.value) || 0)); setCount(i, v, { fromInput: true }); });
    input.addEventListener('blur', () => { input.value = counts[i]; });
    grid.append(el);
    return { el, sell, input, buy, max, qty: el.querySelector('.sm-item__qty') };
  });

  let holdN = 0;
  const holdStep = () => holdN < 6 ? 1 : holdN < 14 ? 5 : holdN < 24 ? 25 : 250;
  function holdable(btn, fn) {
    let timer = 0;
    const stop = () => { clearTimeout(timer); holdN = 0; };
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || btn.disabled) return;
      holdN = 0; fn();
      const rep = () => { holdN++; fn(); if (!btn.disabled) timer = setTimeout(rep, Math.max(40, 160 - holdN * 8)); };
      timer = setTimeout(rep, 380);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
    btn.addEventListener('click', (e) => { if (e.detail !== 0) return; holdN = 0; fn(); });
  }

  function applyView() {
    const q = query.trim().toLowerCase();
    let list = ITEMS.map((it, i) => i).filter((i) => (cat === 'all' || ITEMS[i].c === cat) && (!q || ITEMS[i].n.toLowerCase().includes(q)) && (sort !== 'owned' || counts[i] > 0));
    if (sort === 'down') list.reverse();
    const show = new Set(list);
    cards.forEach((c, i) => { c.el.hidden = !show.has(i); });
    list.forEach((i, k) => { cards[i].el.style.order = k; });
    $('none').hidden = list.length > 0;
    if (!list.length) $('none').textContent = sort === 'owned' ? 'You do not own anything yet. Treat yourself.' : 'Nothing matches. Try "yacht".';
  }
  $('search').addEventListener('input', (e) => { query = e.target.value; applyView(); });
  $('sort').addEventListener('change', (e) => { sort = e.target.value; applyView(); });

  function floatText(src, text, bad) {
    if (!src) return;
    const r = src.getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'sm-float';
    el.textContent = text;
    if (bad) el.style.color = 'var(--bad)';
    el.style.left = `${Math.max(8, Math.min(innerWidth - 120, r.left + r.width / 2 - 30))}px`;
    el.style.top = `${r.top - 14}px`;
    document.body.append(el);
    setTimeout(() => el.remove(), 950);
  }
  let lastSnd = 0;
  function chaChing(price, n) {
    const now = performance.now();
    if (now - lastSnd < 55) return;
    lastSnd = now;
    const f = 440 + Math.min(900, Math.log10(price + 1) * 70);
    Curio.beep(f, 0.05, 'triangle', 0.1);
    setTimeout(() => Curio.beep(f * 1.5, 0.08, 'triangle', 0.08), 50);
    if (price * n >= 1e9) { [523, 659, 784, 1046].forEach((x, i) => setTimeout(() => Curio.beep(x, 0.14, 'square', 0.04), 120 + i * 90)); Curio.confetti(60); }
  }

  function setCount(i, want, o = {}) {
    want = Math.max(0, Math.floor(want));
    const it = ITEMS[i];
    const others = spent() - counts[i] * it.p;
    const maxAfford = Math.floor((total() - others) / it.p + 1e-9);
    const v = Math.min(want, maxAfford);
    const prev = counts[i];
    if (want > maxAfford) {
      const bar = $('bar');
      bar.classList.remove('shake'); void bar.offsetWidth; bar.classList.add('shake');
      setTimeout(() => bar.classList.remove('shake'), 400);
      if (o.fromInput) Curio.toast(`You can only afford ${maxAfford.toLocaleString('en-US')}`);
      else if (v === prev) floatText(o.source, 'Too pricey!', true);
      Curio.beep(150, 0.15, 'square', 0.06);
      try { navigator.vibrate?.(30); } catch {}
    }
    if (v === prev) { if (!o.fromInput) cards[i].input.value = counts[i]; return; }
    if (!o.noHistory) { history.push([i, prev]); if (history.length > 300) history.shift(); }
    counts[i] = v;
    if (v > prev) {
      chaChing(it.p, v - prev);
      const c = cards[i].el; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
      floatText(o.source, `-${short(it.p * (v - prev))}`);
      startTimer();
    } else Curio.beep(330, 0.06, 'sine', 0.08);
    storeCart();
    refresh(false, o.fromInput ? i : -1);
    checkBadges(i, v - prev);
    if (v > prev && remaining() < ITEMS[0].p) finish();
  }

  let shown = total(), raf = 0, refreshT = 0;
  function refresh(instant, skipInput = -1) {
    const rem = remaining();
    cards.forEach((c, i) => {
      c.sell.disabled = counts[i] === 0;
      c.buy.disabled = ITEMS[i].p > rem;
      c.max.disabled = ITEMS[i].p > rem;
      if (i !== skipInput) c.input.value = counts[i];
      c.el.classList.toggle('owned', counts[i] > 0);
      c.qty.textContent = counts[i] >= 1e6 ? `${(counts[i] / 1e6).toFixed(1)}M` : counts[i] >= 1e4 ? `${Math.round(counts[i] / 1e3)}k` : counts[i].toLocaleString('en-US');
    });
    const pct = spent() / total() * 100;
    $('spentTxt').textContent = pct === 0 ? `${fortune().name}: go on, buy something` : `You have spent ${pct < 0.000001 ? 'less than 0.000001' : pct < 0.001 ? pct.toFixed(6) : pct < 1 ? pct.toFixed(4) : pct.toFixed(2)}% of ${fortune().name === 'Your own fortune' ? 'your fortune' : fortune().name + "'s fortune"}`;
    $('fill').style.width = pct + '%';
    $('cartCount').textContent = counts.filter((c) => c > 0).length;
    if (instant) { cancelAnimationFrame(raf); shown = rem; $('money').textContent = money(rem); }
    else animate();
    clearTimeout(refreshT);
    refreshT = setTimeout(() => { paintReceipt(); paintPersp(); if (sort === 'owned') applyView(); }, 120);
  }
  function animate() {
    cancelAnimationFrame(raf);
    const from = shown, to = remaining(), t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 500);
      shown = k >= 1 ? to : from + (to - from) * (1 - Math.pow(1 - k, 3));
      $('money').textContent = money(shown);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function paintPersp() {
    const T = total(), sp = spent();
    const years = T / 31557600;
    const stackKm = T / 100 * 0.1092 / 1e6;
    const each = T / 8.2e9;
    const daily = remaining() * 0.05 / 365;
    const items = [
      `Spending <b>$1 every second</b>, it would take you <b>${years >= 1 ? Math.round(years).toLocaleString('en-US') + ' years' : Math.round(years * 365).toLocaleString('en-US') + ' days'}</b> to get through the whole fortune.`,
      `As a stack of $100 bills it would be <b>${stackKm >= 1 ? stackKm.toFixed(1) + ' km' : Math.round(stackKm * 1000).toLocaleString('en-US') + ' m'}</b> tall${stackKm > 100 ? ', poking out into space' : stackKm > 8.8 ? ', taller than Mount Everest' : ''}.`,
      `Shared out, every person on Earth would get <b>${each >= 1 ? money(each) : (each * 100).toFixed(1) + ' cents'}</b>.`,
      `Left in a savings account at 5%, what you have left would earn <b>${money(daily)}</b> a day.`,
      `So far you have spent <b>${(sp / 62000).toLocaleString('en-US', { maximumFractionDigits: 1 })} years</b> of a typical US salary.`
    ];
    $('persp').innerHTML = items.map((t) => `<li><i></i><span>${t}</span></li>`).join('');
  }

  function receiptLines() {
    return ITEMS.map((it, i) => ({ it, n: counts[i] })).filter((x) => x.n > 0);
  }
  function paintReceipt() {
    const lines = receiptLines();
    $('rcList').innerHTML = lines.length ? lines.map(({ it, n }) => `<li><span>${it.n}</span><b>${money(n * it.p)}</b><small>${n.toLocaleString('en-US')} x ${money(it.p)}</small></li>`).join('') : '<li><span>Nothing yet. Surely you want a Big Mac?</span></li>';
    $('rcTotal').textContent = money(spent());
    $('rcLeft').textContent = money(remaining());
    $('rcSub').textContent = `Paid for by ${fortune().name} · ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    let seed = Math.round(spent() % 1e9) + 7, bars = '';
    let x = 4;
    while (x < 196) { seed = (seed * 16807) % 2147483647; const w = 1 + seed % 3; bars += `<rect x="${x}" y="0" width="${w}" height="40" fill="#2a2622"/>`; x += w + 1 + (seed >> 3) % 3; }
    $('barcode').innerHTML = bars;
  }
  function receiptText() {
    const W = 40;
    const row = (a, b) => { const sp = Math.max(1, W - a.length - b.length); return a + ' '.repeat(sp) + b; };
    const out = ['ZOBLE MEGASTORE'.padStart(27), `Paid for by ${fortune().name}`, new Date().toDateString(), '-'.repeat(W)];
    for (const { it, n } of receiptLines()) { out.push(row(it.n.slice(0, 26), money(n * it.p))); out.push(`  ${n.toLocaleString('en-US')} x ${money(it.p)}`); }
    out.push('-'.repeat(W), row('TOTAL', money(spent())), row('LEFT OVER', money(remaining())), '', 'No refunds on islands.');
    return out.join('\n');
  }
  $('rcCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(receiptText()); Curio.toast('Receipt copied'); award('receipt'); } catch { Curio.toast('Could not copy, sorry'); } });
  function download(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  $('rcTxt').addEventListener('click', () => { download(new Blob([receiptText()], { type: 'text/plain' }), 'billionaire-receipt.txt'); award('receipt'); });
  $('rcPng').addEventListener('click', () => {
    const lines = receiptLines();
    const W = 420, lh = 22, H = 200 + lines.length * lh * 2 + 120;
    const cv = document.createElement('canvas');
    cv.width = W * 2; cv.height = H * 2;
    const g = cv.getContext('2d'); g.scale(2, 2);
    g.fillStyle = '#fffdf6'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2a2622'; g.textBaseline = 'top';
    const mono = (s, w = 500) => `${w} ${s}px ui-monospace, Menlo, Consolas, monospace`;
    g.font = mono(20, 800); g.textAlign = 'center'; g.fillText('ZOBLE MEGASTORE', W / 2, 24);
    g.font = mono(12); g.fillStyle = '#7a7067'; g.fillText(`Paid for by ${fortune().name}`, W / 2, 54); g.fillText(new Date().toDateString(), W / 2, 70);
    let y = 100; g.textAlign = 'left'; g.fillStyle = '#2a2622';
    const dash = (yy) => { g.fillStyle = '#c9bfb2'; for (let x = 20; x < W - 20; x += 10) g.fillRect(x, yy, 6, 2); g.fillStyle = '#2a2622'; };
    dash(y); y += 14;
    for (const { it, n } of lines) {
      g.font = mono(14, 700); g.textAlign = 'left'; g.fillText(it.n.slice(0, 30), 20, y);
      g.textAlign = 'right'; g.fillText(money(n * it.p), W - 20, y); y += lh;
      g.font = mono(12); g.fillStyle = '#8a8076'; g.textAlign = 'left'; g.fillText(`${n.toLocaleString('en-US')} x ${money(it.p)}`, 30, y - 4); g.fillStyle = '#2a2622'; y += lh;
    }
    dash(y); y += 14;
    g.font = mono(16, 800); g.textAlign = 'left'; g.fillText('TOTAL', 20, y); g.textAlign = 'right'; g.fillText(money(spent()), W - 20, y); y += 26;
    g.font = mono(13); g.fillStyle = '#7a7067'; g.textAlign = 'left'; g.fillText('LEFT OVER', 20, y); g.textAlign = 'right'; g.fillText(money(remaining()), W - 20, y); y += 34;
    let seed = Math.round(spent() % 1e9) + 7, x = 60; g.fillStyle = '#2a2622';
    while (x < W - 60) { seed = (seed * 16807) % 2147483647; const w = 1 + seed % 3; g.fillRect(x, y, w, 40); x += w + 1 + (seed >> 3) % 3; }
    cv.toBlob((b) => { if (b) { download(b, 'billionaire-receipt.png'); award('receipt'); } });
  });
  $('reset').addEventListener('click', async () => {
    if (!spent()) { Curio.toast('Nothing to refund'); return; }
    const ok = await Curio.modal({ emoji: '🧾', title: 'Refund everything?', body: 'Every purchase goes back on the shelf.', buttons: [{ label: 'Refund', value: true }, { label: 'Keep it all', value: false }] });
    if (!ok) return;
    counts = ITEMS.map(() => 0); history.length = 0; storeCart(); stopTimer(true); refresh(false);
    Curio.toast('Everything refunded. The shopkeepers are furious.');
  });
  $('toReceipt').addEventListener('click', () => $('receiptSec').scrollIntoView({ behavior: 'smooth' }));
  function undo() {
    const h = history.pop();
    if (!h) { Curio.toast('Nothing to undo'); return; }
    setCount(h[0], h[1], { noHistory: true });
    Curio.toast(`Undid: ${ITEMS[h[0]].n}`, 1000);
  }
  $('undo').addEventListener('click', undo);
  addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.target.closest('input')) { e.preventDefault(); undo(); }
    else if (e.key === '/' && !e.target.closest('input, select, textarea')) { e.preventDefault(); $('search').focus(); }
  });

  let speedOn = false, t0 = 0, tick = 0;
  function startTimer() {
    if (!speedOn || t0) return;
    t0 = performance.now();
    $('timer').hidden = false;
    const run = () => { if (!t0) return; $('timer').textContent = `Speedrun ${((performance.now() - t0) / 1000).toFixed(1)} s`; tick = requestAnimationFrame(run); };
    run();
  }
  function stopTimer(clear) {
    cancelAnimationFrame(tick);
    const ms = t0 ? performance.now() - t0 : 0;
    t0 = 0;
    if (clear) { $('timer').hidden = !speedOn; $('timer').textContent = speedOn ? 'Speedrun ready: the clock starts on your first buy' : ''; }
    return ms;
  }
  $('speedrun').addEventListener('change', async (e) => {
    speedOn = e.target.checked;
    if (speedOn && spent() > 0) {
      const ok = await Curio.modal({ emoji: '⏱️', title: 'Start a speedrun?', body: 'Your cart will be emptied, then the clock starts on your first purchase. Spend it all as fast as you can.', buttons: [{ label: 'Go!', value: true }, { label: 'Not now', value: false }] });
      if (!ok) { speedOn = false; e.target.checked = false; return; }
      counts = ITEMS.map(() => 0); history.length = 0; storeCart(); refresh(true);
    }
    stopTimer(true);
    $('timer').hidden = !speedOn;
  });

  async function finish() {
    const ms = speedOn && t0 ? stopTimer(false) : 0;
    Curio.confetti(160);
    [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.2, 'triangle', 0.09), i * 110));
    award('all');
    let body = `${money(total())} gone. The accountants are weeping.`;
    if (ms) {
      const r = Curio.best(`speed-${S.who}`, Math.round(ms), false);
      body = `You spent ${short(total())} in ${(ms / 1000).toFixed(1)} seconds. ${r.isNew ? 'A new personal best!' : `Your best is ${(r.best / 1000).toFixed(1)} s.`}`;
      award('speed');
      $('timer').textContent = `Finished in ${(ms / 1000).toFixed(1)} s`;
    }
    const choice = await Curio.modal({ emoji: '💸', title: 'You spent it all!', body, buttons: [{ label: 'Admire the receipt', value: 'r' }, { label: 'Start over', value: 'again' }, { label: 'Copy brag', value: 'brag' }] });
    if (choice === 'again') { counts = ITEMS.map(() => 0); history.length = 0; storeCart(); stopTimer(true); refresh(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    else if (choice === 'brag') { try { await navigator.clipboard.writeText(`I spent all ${short(total())} of ${fortune().name}'s money${ms ? ` in ${(ms / 1000).toFixed(1)} s` : ''}. Biggest buy: ${biggest()}. Zoble: Spend a Billionaire's Money`); Curio.toast('Copied'); } catch {} }
    else $('receiptSec').scrollIntoView({ behavior: 'smooth' });
  }
  const biggest = () => { let best = null; ITEMS.forEach((it, i) => { if (counts[i] && (!best || it.p * counts[i] > best.p * counts[best.id])) best = it; }); return best ? best.n : 'nothing'; };

  const BADGES = [
    ['first', 'First purchase', 'Buy anything', '#1f9d55', 'M12 20l6 6 12-12'],
    ['macs', 'Happy meal', 'Own 1,000 Big Macs', '#f2a33a', 'M10 18q0-8 10-8t10 8zM9 21h22M10 25h20q0 5-10 5t-10-5z'],
    ['team', 'Team owner', 'Buy a sports team', '#d64545', 'M20 9a11 11 0 1 0 0 22 11 11 0 0 0 0-22zM9 20h22M20 9v22'],
    ['half', 'Halfway', 'Spend 50%', '#4ea6ef', 'M20 9a11 11 0 1 0 0 22V9z'],
    ['all', 'Broke', 'Spend every dollar', '#ffb020', 'M11 14h18v14H11zM15 10h10v4M20 18v6'],
    ['giver', 'Philanthropist', 'Give $1 billion to good causes', '#e84393', 'M20 30s-10-6-10-13a5.5 5.5 0 0 1 10-3 5.5 5.5 0 0 1 10 3c0 7-10 13-10 13z'],
    ['variety', 'Collector', 'Own 30 different things', '#9b59b6', 'M10 10h8v8h-8zM22 10h8v8h-8zM10 22h8v8h-8zM22 22h8v8h-8z'],
    ['zoo', 'Zookeeper', 'Own every kind of pet', '#ffc233', 'M14 16a3 3 0 1 1 0-.1zM26 16a3 3 0 1 1 0-.1zM12 26c2-6 14-6 16 0 0 3-4 4-8 4s-8-1-8-4z'],
    ['space', 'Space baron', 'Buy the space station', '#2f5aa8', 'M8 16h8v8H8zM24 16h8v8h-8zM16 19h8v2h-8z'],
    ['speed', 'Speedrunner', 'Finish a speedrun', '#ff5a36', 'M20 10a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM20 14v7l4 3'],
    ['receipt', 'Paper trail', 'Export your receipt', '#7a7067', 'M13 9h14v22l-3-2-4 2-4-2-3 2zM16 15h8M16 20h8']
  ];
  function paintBadges(newId) {
    $('badges').innerHTML = BADGES.map(([id, n, how, col, d]) => {
      const got = S.badges.includes(id);
      const stroke = d.includes('l6 6') || d.includes('v7l4 3') || d.includes('M9 20h22');
      return `<div class="sm-b${got ? '' : ' locked'}"${id === newId ? ' style="animation:sm-pop .5s 2"' : ''}><svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="${col}"/><path d="${d}" fill="${stroke ? 'none' : '#fff'}" stroke="#fff" stroke-width="${stroke ? 2.6 : 0.8}" stroke-linecap="round" stroke-linejoin="round"/></svg>${n}<small>${got ? 'Unlocked' : how}</small></div>`;
    }).join('');
  }
  function award(id) {
    if (S.badges.includes(id)) return;
    S.badges.push(id); save(); paintBadges(id);
    const b = BADGES.find((x) => x[0] === id);
    setTimeout(() => Curio.toast(`Achievement: ${b[1]}`), 250);
  }
  function checkBadges(i, delta) {
    if (delta > 0) award('first');
    const byName = (n) => counts[ITEMS.findIndex((x) => x.n === n)] || 0;
    if (byName('Big Mac') >= 1000) award('macs');
    if (['NBA team', 'NFL team', 'Premier League club', 'Formula 1 team'].some((n) => byName(n) > 0)) award('team');
    if (spent() >= total() / 2) award('half');
    if (ITEMS.reduce((s, it, k) => s + (it.c === 'good' ? it.p * counts[k] : 0), 0) >= 1e9) award('giver');
    if (counts.filter((c) => c > 0).length >= 30) award('variety');
    if (ITEMS.every((it, k) => it.c !== 'pets' || counts[k] > 0)) award('zoo');
    if (byName('International Space Station') > 0) award('space');
  }

  paintWho(); paintCats(); loadCart(); applyView(); paintBadges();
  refresh(true);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelAnimationFrame(raf); });
})();
