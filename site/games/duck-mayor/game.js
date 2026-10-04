(() => {
  const D = window.DM_DATA;
  const C = window.Curio;
  const adv = C.advanced;
  const $ = (s) => document.querySelector(s);
  const INK = '#1f2a44';
  const UNIT = 8;
  const GOAL = 20;
  const TERM = 15;
  const METERS = D.meters.filter((m) => adv || m.k !== 'o');
  const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch {} };

  const ICONS = {
    b: '<path d="M5 24c0-9 6-14 15-14s15 5 15 14v8c0 2-1 3-3 3H8c-2 0-3-1-3-3z" fill="#e0a458" stroke="#1f2a44" stroke-width="2.6"/><path d="M13 16l3 6M20 14l2 7M27 16l-1 6" stroke="#9c5b22" stroke-width="2.4" stroke-linecap="round"/>',
    p: '<path d="M20 3c7 10 13 16 13 24a13 13 0 0 1-26 0c0-8 6-14 13-24z" fill="#4fb0c6" stroke="#1f2a44" stroke-width="2.6"/><path d="M13 27c0 4 3 6 6 7" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/>',
    j: '<g stroke="#1f2a44" stroke-width="2.4" stroke-linecap="round"><path d="M20 2v5M20 33v5M2 20h5M33 20h5M7 7l4 4M29 29l4 4M33 7l-4 4M11 29l-4 4"/></g><circle cx="20" cy="20" r="11" fill="#ffcf3a" stroke="#1f2a44" stroke-width="2.6"/><path d="M15 22q5 5 10 0" stroke="#1f2a44" stroke-width="2.4" fill="none" stroke-linecap="round"/><circle cx="16" cy="17" r="1.6" fill="#1f2a44"/><circle cx="24" cy="17" r="1.6" fill="#1f2a44"/>',
    o: '<rect x="6" y="6" width="22" height="11" rx="3" transform="rotate(-35 17 11)" fill="#9c6644" stroke="#1f2a44" stroke-width="2.6"/><path d="M20 16l12 16" stroke="#1f2a44" stroke-width="7" stroke-linecap="round"/><path d="M20 16l12 16" stroke="#c08552" stroke-width="3" stroke-linecap="round"/><rect x="4" y="32" width="18" height="5" rx="2" fill="#6d4c41" stroke="#1f2a44" stroke-width="2"/>'
  };
  const icon = (k, cls = '') => `<svg viewBox="0 0 40 40" class="${cls}" aria-hidden="true">${ICONS[k]}</svg>`;

  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = f < 0 ? 0 : 255, p = Math.abs(f);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function duck(kind) {
    const [, , color] = D.folk[kind];
    const s = `stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;
    if (kind === 'frog') {
      return `<svg viewBox="0 0 120 120" aria-hidden="true"><ellipse cx="60" cy="104" rx="44" ry="20" fill="${shade(color, -0.15)}" ${s}/><ellipse cx="60" cy="78" rx="38" ry="28" fill="${color}" ${s}/><circle cx="40" cy="52" r="14" fill="${color}" ${s}/><circle cx="80" cy="52" r="14" fill="${color}" ${s}/><circle cx="40" cy="52" r="7" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="80" cy="52" r="7" fill="#fff" stroke="${INK}" stroke-width="2"/><circle cx="41" cy="53" r="3.5" fill="${INK}"/><circle cx="79" cy="53" r="3.5" fill="${INK}"/><path d="M38 82q22 14 44 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="44" y="94" width="32" height="12" rx="3" fill="#ff006e" ${s}/><text x="60" y="104" text-anchor="middle" font-size="9" font-weight="900" fill="#fff" font-family="sans-serif">UNION</text></svg>`;
    }
    const swan = kind === 'swan';
    const heron = kind === 'heron';
    const small = kind === 'pip';
    const hx = swan ? 50 : 50, hy = swan ? 30 : heron ? 36 : 56;
    const body = `<ellipse cx="64" cy="100" rx="${heron ? 30 : 40}" ry="24" fill="${color}" ${s}/><path d="M48 96q18-12 36 2q-16 14-36-2z" fill="${shade(color, -0.12)}" stroke="${INK}" stroke-width="2"/><path d="M100 92l16-12-4 20z" fill="${color}" ${s}/>`;
    const neck = swan ? `<path d="M56 92C40 76 64 56 54 40" fill="none" stroke="${INK}" stroke-width="17" stroke-linecap="round"/><path d="M56 92C40 76 64 56 54 40" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round"/>` : heron ? `<path d="M58 92C52 74 58 56 52 44" fill="none" stroke="${INK}" stroke-width="15" stroke-linecap="round"/><path d="M58 92C52 74 58 56 52 44" fill="none" stroke="${color}" stroke-width="9" stroke-linecap="round"/>` : '';
    const beak = heron ? `<path d="M30 ${hy + 2}l-28 4 28 4z" fill="#f4a261" ${s}/>` : `<path d="M28 ${hy + 2}q-16 2-18 9 12 4 24-1z" fill="${kind === 'goose' ? '#ff8c42' : '#ff9f1c'}" ${s}/>`;
    const head = `<circle cx="${hx}" cy="${hy}" r="${swan || heron ? 18 : 23}" fill="${color}" ${s}/>${beak}<circle cx="${hx - 6}" cy="${hy - 4}" r="4" fill="${INK}"/><circle cx="${hx - 5}" cy="${hy - 5.5}" r="1.4" fill="#fff"/><circle cx="${hx + 4}" cy="${hy + 6}" r="4" fill="#ff8fab" opacity=".45"/>`;
    const acc = {
      chef: `<path d="M34 ${hy - 18}c-8-2-10-14 0-16 2-10 16-12 20-4 8-6 20 0 16 10 6 4 2 12-6 12z" fill="#fff" ${s}/><rect x="36" y="${hy - 22}" width="30" height="8" rx="2" fill="#fff" ${s}/>`,
      treasurer: `<circle cx="${hx - 6}" cy="${hy - 4}" r="8" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="${hx + 10}" cy="${hy - 4}" r="8" fill="none" stroke="${INK}" stroke-width="2.4"/><circle cx="${hx + 6}" cy="${hy - 26}" r="8" fill="${shade(color, -0.2)}" ${s}/><g fill="#fff" stroke="${INK}" stroke-width="1.4"><circle cx="46" cy="${hy + 26}" r="3"/><circle cx="54" cy="${hy + 28}" r="3"/><circle cx="62" cy="${hy + 27}" r="3"/></g>`,
      police: `<path d="M28 ${hy - 14}c4-14 40-14 44 0z" fill="#2f5bd3" ${s}/><rect x="24" y="${hy - 16}" width="52" height="7" rx="3" fill="#1f2a44"/><circle cx="50" cy="${hy - 22}" r="4" fill="#ffcf3a" stroke="${INK}" stroke-width="1.6"/>`,
      prof: `<rect x="30" y="${hy - 20}" width="40" height="10" rx="5" fill="#1f2a44"/><circle cx="40" cy="${hy - 15}" r="6" fill="#8ecae6" stroke="${INK}" stroke-width="2"/><circle cx="58" cy="${hy - 15}" r="6" fill="#8ecae6" stroke="${INK}" stroke-width="2"/><path d="M40 ${hy + 24}l10 10 10-10" fill="#fff" ${s}/>`,
      pip: `<path d="M${hx} ${hy - 22}c-2-8 4-10 6-4 2-6 8-4 6 2" fill="${color}" ${s}/>`,
      artist: `<ellipse cx="${hx + 2}" cy="${hy - 20}" rx="22" ry="8" fill="#d1495b" ${s}/><path d="M${hx + 2} ${hy - 28}v-6" stroke="${INK}" stroke-width="3"/>`,
      swan: `<path d="M${hx - 12} ${hy - 14}l3-14 6 8 4-10 4 10 6-8 3 14z" fill="#ffcf3a" ${s}/>`,
      goose: `<rect x="${hx - 18}" y="${hy - 9}" width="30" height="9" rx="3" fill="${INK}"/><path d="M40 ${hy + 24}q12 8 26 0" fill="none" stroke="#ffcf3a" stroke-width="4"/>`,
      heron: `<path d="M${hx - 20} ${hy - 12}h40l-6-12h-28z" fill="#8a9a5b" ${s}/>`,
      farmer: `<ellipse cx="${hx}" cy="${hy - 16}" rx="32" ry="7" fill="#e9c46a" ${s}/><path d="M${hx - 16} ${hy - 16}c0-14 32-14 32 0z" fill="#e9c46a" ${s}/><path d="M${hx - 16} ${hy - 19}h32" stroke="#d62828" stroke-width="3"/>`,
      reporter: `<path d="M${hx - 20} ${hy - 14}h40l-6-14h-28z" fill="#5c4033" ${s}/><rect x="${hx + 4}" y="${hy - 24}" width="12" height="8" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`,
      granny: `<circle cx="${hx + 4}" cy="${hy - 24}" r="9" fill="#e5e5e5" ${s}/><circle cx="${hx - 6}" cy="${hy - 4}" r="7" fill="none" stroke="${INK}" stroke-width="2.2"/><path d="M30 ${hy + 20}q30 16 60 0l4 12q-34 14-68 0z" fill="#9d4edd" ${s}/>`
    }[kind] || '';
    const inner = `${body}${neck}${head}${acc}`;
    return `<svg viewBox="0 0 120 120" aria-hidden="true">${small ? `<g transform="translate(18 30) scale(.75)">${inner}</g>` : inner}</svg>`;
  }

  const els = {
    meters: $('#meters'), card: $('#card'), portrait: $('#portrait'), who: $('#who'), role: $('#role'), text: $('#text'),
    tagL: $('#tagL'), tagR: $('#tagR'), btnL: $('#btnL'), btnR: $('#btnR'), over: $('#over'), last: $('#last'), day: $('#day'), dayNote: $('#dayNote')
  };

  let st = null;
  let card = null;
  let busy = false;

  function parse(fx) {
    const out = {};
    (fx || '').split(' ').filter(Boolean).forEach((p) => {
      const k = p[0];
      const n = parseInt(p.slice(1), 10);
      if (METERS.some((m) => m.k === k)) out[k] = n;
    });
    return out;
  }

  function buildMeters() {
    els.meters.innerHTML = METERS.map((m) => `<div class="dm-meter" data-k="${m.k}" title="${m.name}"><div class="dm-mico">${icon(m.k, 'dm-dim')}<div class="dm-full">${icon(m.k)}</div></div><span>${m.name}</span><i class="dm-dot"></i></div>`).join('');
  }

  function paintMeters(changed = {}) {
    METERS.forEach((m) => {
      const el = els.meters.querySelector(`[data-k="${m.k}"]`);
      const v = st.v[m.k];
      el.querySelector('.dm-full').style.setProperty('--cut', `${100 - Math.max(0, Math.min(100, v))}%`);
      el.classList.toggle('is-danger', v <= 18 || v >= 82);
      el.setAttribute('aria-label', `${m.name}: ${Math.round(v)} out of 100`);
      if (changed[m.k]) {
        el.classList.remove('is-up', 'is-down');
        void el.offsetWidth;
        el.classList.add(changed[m.k] > 0 ? 'is-up' : 'is-down');
      }
    });
  }

  function preview(side) {
    const fx = side && card ? parse(card[side][1]) : {};
    METERS.forEach((m) => {
      const d = els.meters.querySelector(`[data-k="${m.k}"] .dm-dot`);
      const n = Math.abs(fx[m.k] || 0);
      d.className = `dm-dot${n >= 2 ? ' is-l' : n ? ' is-s' : ''}`;
    });
    els.tagL.style.opacity = side === 'l' ? '1' : '0';
    els.tagR.style.opacity = side === 'r' ? '1' : '0';
  }

  function eligible() {
    return D.cards.filter((c, i) => (adv || !c.adv) && (!c.needs || st.flags[c.needs]) && !st.recent.includes(i) && !(c.set && st.usedSet.includes(i)));
  }

  function nextCard() {
    let pool = eligible();
    if (!pool.length) { st.recent = []; pool = eligible(); }
    const fresh = pool.filter((c) => c.needs);
    const c = fresh.length && Math.random() < 0.35 ? C.pick(fresh) : C.pick(pool);
    const idx = D.cards.indexOf(c);
    st.recent.push(idx);
    if (st.recent.length > Math.min(14, D.cards.length / 3)) st.recent.shift();
    card = c;
    card.idx = idx;
    const [name, role, color] = D.folk[c.w];
    els.portrait.style.setProperty('--dm-c', color === '#ffffff' ? '#ffd6a5' : color);
    els.portrait.innerHTML = duck(c.w);
    els.who.textContent = name;
    els.role.textContent = role;
    els.text.textContent = c.t;
    els.tagL.textContent = c.l[0];
    els.tagR.textContent = c.r[0];
    $('#btnLText').textContent = c.l[0];
    $('#btnRText').textContent = c.r[0];
    els.card.style.transition = 'none';
    els.card.style.transform = '';
    els.card.classList.remove('is-in');
    void els.card.offsetWidth;
    els.card.classList.add('is-in');
    preview(null);
    quack(c.w);
  }

  function sound(kind, n = 0) {
    if (C.muted) return;
    const ac = C.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    if (kind === 'quack') {
      const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain();
      const base = 260 + n * 30;
      o.type = 'sawtooth'; o.frequency.setValueAtTime(base, t); o.frequency.linearRampToValueAtTime(base * 0.75, t + 0.16);
      f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 4;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.14, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.connect(f).connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.22);
    } else if (kind === 'swish') {
      C.sfx('whoosh');
    } else if (kind === 'up') {
      C.beep(660, 0.08, 'triangle', 0.06); setTimeout(() => C.beep(880, 0.1, 'triangle', 0.05), 70);
    } else if (kind === 'down') {
      C.beep(330, 0.1, 'triangle', 0.06); setTimeout(() => C.beep(247, 0.12, 'triangle', 0.05), 70);
    }
  }
  const quack = (w) => sound('quack', Object.keys(D.folk).indexOf(w) % 5);

  const REACT = {
    b: ['The bakery cheers.', 'Bellies rumble.'],
    p: ['The pond sparkles.', 'The pond looks sad.'],
    j: ['Ducks are dancing.', 'Grumbling all round.'],
    o: ['Very orderly.', 'Things get rowdy.']
  };

  function decide(side) {
    if (busy || !card || st.over) return;
    busy = true;
    const fx = parse(card[side][1]);
    const changed = {};
    for (const [k, n] of Object.entries(fx)) {
      const unit = adv ? UNIT + Math.floor((st.day - 1) / TERM) * 1.5 : UNIT;
      const d = n * unit + Math.round(C.rand(-2, 2));
      st.v[k] += d;
      changed[k] = d;
    }
    if (card.set) {
      if (card.set[side]) st.flags[card.set[side]] = true;
      if (!st.usedSet.includes(card.idx)) st.usedSet.push(card.idx);
    }
    const big = Object.entries(changed).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0];
    els.last.textContent = `"${card[side][0]}" ${big ? REACT[big[0]][big[1] > 0 ? 0 : 1] : ''}`;
    const dir = side === 'l' ? -1 : 1;
    els.card.style.transition = 'transform .35s cubic-bezier(.4,0,.6,1)';
    els.card.style.transform = `translate(${dir * 560}px, 60px) rotate(${dir * 34}deg)`;
    sound('swish');
    preview(null);
    paintMeters(changed);
    const ups = Object.values(changed).filter((x) => x > 0).length;
    setTimeout(() => sound(ups >= Object.keys(changed).length / 2 ? 'up' : 'down'), 120);
    buzz(12);
    st.day++;
    setTimeout(() => {
      busy = false;
      const broke = METERS.find((m) => st.v[m.k] <= 0 || st.v[m.k] >= 100);
      if (broke) return end(`${broke.k}${st.v[broke.k] <= 0 ? '-' : '+'}`);
      if (!adv && st.day > GOAL) return end('win');
      if (adv && (st.day - 1) % TERM === 0) { C.toast(`Re-elected! Term ${Math.floor((st.day - 1) / TERM) + 1} begins.`, 2400); C.confetti(70); C.sfx('success'); }
      paintDay();
      nextCard();
    }, C.calm ? 120 : 360);
  }

  function paintDay() {
    els.day.textContent = `Day ${st.day}`;
    els.dayNote.textContent = adv ? `Term ${Math.floor((st.day - 1) / TERM) + 1} · next election in ${TERM - ((st.day - 1) % TERM)} days` : `${GOAL - st.day + 1} days until re-election`;
  }

  function end(key) {
    st.over = true;
    const days = key === 'win' ? GOAL : st.day - 1;
    const b = C.best(`days:${C.mode}`, days);
    const book = C.store.get('dm:endings', {});
    book[key] = (book[key] || 0) + 1;
    C.store.set('dm:endings', book);
    if (key === 'win') {
      $('#overIcon').innerHTML = duck('pip');
      $('#overKick').textContent = 'Election night';
      $('#overTitle').textContent = 'Re-elected!';
      $('#overText').textContent = 'Twenty days and the town is still standing. The ducks carry you around the pond on a lily pad.';
      C.confetti(); C.sfx('success');
    } else {
      const [title, text] = D.endings[key];
      $('#overIcon').innerHTML = icon(key[0]);
      $('#overKick').textContent = `Ended on day ${st.day - 1}`;
      $('#overTitle').textContent = title;
      $('#overText').textContent = text;
      sound('down'); C.sfx('error');
      buzz([40, 40, 60]);
    }
    $('#overDays').textContent = days;
    $('#overBest').textContent = b.best;
    els.over.hidden = false;
    els.card.hidden = true;
    els.btnL.disabled = true; els.btnR.disabled = true;
    if (b.isNew && key !== 'win' && days > 3) C.toast('New record!');
    $('#againBtn').focus({ preventScroll: true });
  }

  function start() {
    st = { v: {}, day: 1, flags: {}, recent: [], usedSet: [], over: false };
    METERS.forEach((m) => { st.v[m.k] = 50; });
    els.over.hidden = true;
    els.card.hidden = false;
    els.btnL.disabled = false; els.btnR.disabled = false;
    els.last.textContent = adv ? 'Four meters, endless terms. Stay balanced.' : 'Survive twenty days to win re-election.';
    paintMeters();
    paintDay();
    nextCard();
  }

  function book() {
    const got = C.store.get('dm:endings', {});
    const wrap = document.createElement('div');
    wrap.className = 'dm-book';
    const keys = [...Object.keys(D.endings), 'win'];
    wrap.innerHTML = keys.map((k) => {
      const has = got[k];
      const [title, text] = k === 'win' ? ['Re-elected!', 'Survived a full simple term.'] : D.endings[k];
      return `<div class="${has ? '' : 'is-locked'}"><b>${has ? title : '???'}</b>${has ? `${text} <i>(x${has})</i>` : 'Not reached yet.'}</div>`;
    }).join('');
    C.modal({ emoji: '📜', title: `Endings: ${keys.filter((k) => got[k]).length} of ${keys.length}`, body: wrap, buttons: [{ label: 'Close', value: 'x' }] });
  }

  let dx0 = 0, dx = 0, dragging = false;
  C.drag(els.card, {
    start(p) { if (busy || !card || st.over) return; dragging = true; dx0 = p.clientX; dx = 0; els.card.style.transition = 'none'; },
    move(p) {
      if (!dragging) return;
      dx = p.clientX - dx0;
      els.card.style.transform = `translate(${dx}px, ${Math.abs(dx) * 0.08}px) rotate(${dx * 0.06}deg)`;
      preview(Math.abs(dx) > 24 ? (dx < 0 ? 'l' : 'r') : null);
    },
    end() {
      if (!dragging) return;
      dragging = false;
      if (Math.abs(dx) > 90) { decide(dx < 0 ? 'l' : 'r'); return; }
      els.card.style.transition = 'transform .3s cubic-bezier(.3,1.5,.5,1)';
      els.card.style.transform = '';
      preview(null);
    }
  });
  els.btnL.addEventListener('click', () => decide('l'));
  els.btnR.addEventListener('click', () => decide('r'));
  [['l', els.btnL], ['r', els.btnR]].forEach(([s, b]) => {
    b.addEventListener('pointerenter', () => { if (!busy) preview(s); });
    b.addEventListener('pointerleave', () => preview(null));
    b.addEventListener('focus', () => preview(s));
    b.addEventListener('blur', () => preview(null));
  });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.curio-modal, input, textarea')) return;
    if (st && st.over) { if (e.key === 'Enter' && !(e.target.closest && e.target.closest('button'))) { e.preventDefault(); start(); } return; }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); decide('l'); }
    else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); decide('r'); }
  });
  $('#againBtn').addEventListener('click', start);
  $('#bookBtn').addEventListener('click', book);

  buildMeters();
  start();
})();
