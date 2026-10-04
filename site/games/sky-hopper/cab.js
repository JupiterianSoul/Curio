'use strict';
(() => {
  const C = window.Curio;
  if (!C) return;
  const slug = C.slug || document.body.dataset.game || 'classic';
  const store = C.store;
  const HS = `${slug}:hs:v1`;
  const CRT = 'classics:crt';
  const $ = (s, r = document) => (typeof s === 'string' ? r.querySelector(s) : s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const hash = (s) => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const mulberry = (a) => () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pad2 = (n) => String(n).padStart(2, '0');
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
  const ORD = ['1ST', '2ND', '3RD', '4TH', '5TH', '6TH', '7TH', '8TH', '9TH', '10TH'];
  const NAMES = ['ZOB', 'ACE', 'MAX', 'KAT', 'JOY', 'BOP', 'ZIG', 'LUX', 'RAD', 'PIP', 'DOT', 'JET', 'NEO', 'GUS', 'FOX', 'IVY', 'SAM', 'KIT', 'TEX', 'ROX'];
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.!';

  const PIX = {
    A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110',
    C: '01110 10001 10000 10000 10000 10001 01110', D: '11110 10001 10001 10001 10001 10001 11110',
    E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000',
    G: '01110 10001 10000 10111 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001',
    I: '01110 00100 00100 00100 00100 00100 01110', J: '00111 00010 00010 00010 00010 10010 01100',
    K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111',
    M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 10001 11001 10101 10011 10001 10001',
    O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000',
    Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001',
    S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100',
    U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100',
    W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001',
    Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111',
    0: '01110 10001 10011 10101 11001 10001 01110', 1: '00100 01100 00100 00100 00100 00100 01110',
    2: '01110 10001 00001 00010 00100 01000 11111', 3: '11111 00010 00100 00010 00001 10001 01110',
    4: '00010 00110 01010 10010 11111 00010 00010', 5: '11111 10000 11110 00001 00001 10001 01110',
    6: '00110 01000 10000 11110 10001 10001 01110', 7: '11111 00001 00010 00100 01000 01000 01000',
    8: '01110 10001 10001 01110 10001 10001 01110', 9: '01110 10001 10001 01111 00001 00010 01100',
    '-': '00000 00000 00000 11111 00000 00000 00000', '!': '00100 00100 00100 00100 00100 00000 00100',
    '.': '00000 00000 00000 00000 00000 00000 00100', "'": '00100 00100 01000 00000 00000 00000 00000'
  };
  const VEC = {
    A: ['0,6 0,2 2,0 4,2 4,6', '0,3.5 4,3.5'], B: ['0,0 0,6 3,6 4,5 4,4 3,3 0,3', '0,0 3,0 4,1 4,2 3,3'], C: ['4,0 0,0 0,6 4,6'],
    D: ['0,0 0,6 2,6 4,4 4,2 2,0 0,0'], E: ['4,0 0,0 0,6 4,6', '0,3 3,3'], F: ['4,0 0,0 0,6', '0,3 3,3'],
    G: ['4,1.5 4,0 0,0 0,6 4,6 4,3.5 2,3.5'], H: ['0,0 0,6', '4,0 4,6', '0,3 4,3'], I: ['0,0 4,0', '2,0 2,6', '0,6 4,6'],
    J: ['4,0 4,6 2,6 0,4'], K: ['0,0 0,6', '4,0 0,3 4,6'], L: ['0,0 0,6 4,6'], M: ['0,6 0,0 2,2 4,0 4,6'],
    N: ['0,6 0,0 4,6 4,0'], O: ['0,0 4,0 4,6 0,6 0,0'], P: ['0,6 0,0 4,0 4,3 0,3'], Q: ['0,0 4,0 4,4 2,6 0,6 0,0', '2,4 4,6'],
    R: ['0,6 0,0 4,0 4,3 0,3', '1,3 4,6'], S: ['4,0 0,0 0,3 4,3 4,6 0,6'], T: ['0,0 4,0', '2,0 2,6'], U: ['0,0 0,6 4,6 4,0'],
    V: ['0,0 2,6 4,0'], W: ['0,0 0,6 2,4 4,6 4,0'], X: ['0,0 4,6', '4,0 0,6'], Y: ['0,0 2,2 4,0', '2,2 2,6'], Z: ['0,0 4,0 0,6 4,6'],
    0: ['0,0 4,0 4,6 0,6 0,0'], 1: ['2,0 2,6'], 2: ['0,0 4,0 4,3 0,3 0,6 4,6'], 3: ['0,0 4,0 4,6 0,6', '0,3 4,3'],
    4: ['0,0 0,3 4,3', '4,0 4,6'], 5: ['4,0 0,0 0,3 4,3 4,6 0,6'], 6: ['0,0 0,6 4,6 4,3 0,3'], 7: ['0,0 4,0 4,6'],
    8: ['0,0 4,0 4,6 0,6 0,0', '0,3 4,3'], 9: ['4,3 0,3 0,0 4,0 4,6'], '-': ['1,3 3,3'], '.': ['2,5.6 2,6'], '!': ['2,0 2,4', '2,5.6 2,6']
  };

  let uid = 0;
  function pixelSvg(text, o = {}) {
    const id = `cbp${++uid}`;
    const lines = String(text).toUpperCase().split('\n');
    const cell = 10, gap = o.gap ?? 1.2, depth = o.depth ?? 0;
    const widths = lines.map((l) => [...l].reduce((w, ch) => w + (ch === ' ' ? 3 : 6), 0) - 1);
    const W = Math.max(...widths) * cell + depth + 4, H = lines.length * 9 * cell - 2 * cell + depth + 4;
    const cells = [];
    let li = 0;
    for (const line of lines) {
      let x = Math.round((Math.max(...widths) - widths[li]) / 2);
      let ci = 0;
      for (const ch of line) {
        if (ch === ' ') { x += 3; continue; }
        const rows = (PIX[ch] || PIX['-']).split(' ');
        rows.forEach((r, ry) => [...r].forEach((b, rx) => { if (b === '1') cells.push({ x: (x + rx) * cell + 2, y: (li * 9 + ry) * cell + 2, ry, ci, li }); }));
        x += 6;
        ci++;
      }
      li++;
    }
    const s = cell - gap;
    const fillOf = (c) => {
      if (o.rows) return o.rows[c.ry % o.rows.length];
      if (o.letters) return o.letters[c.ci % o.letters.length];
      if (o.lines) return o.lines[c.li % o.lines.length];
      return `url(#${id}g)`;
    };
    const shape = (c, fill, dx = 0, dy = 0) => o.round
      ? `<circle cx="${c.x + dx + s / 2}" cy="${c.y + dy + s / 2}" r="${s / 2}" fill="${fill}"/>`
      : `<rect x="${c.x + dx}" y="${c.y + dy}" width="${s}" height="${s}"${o.radius ? ` rx="${o.radius}"` : ''} fill="${fill}"/>`;
    let body = '';
    if (depth) for (let d = depth; d > 0; d -= 2) body += `<g opacity="${d === depth ? 1 : 0.9}">${cells.map((c) => shape(c, o.shade || '#000', d, d)).join('')}</g>`;
    body += cells.map((c) => shape(c, fillOf(c))).join('');
    if (o.bevel) body += cells.map((c) => `<path d="M${c.x} ${c.y + s}V${c.y}H${c.x + s}l-2 2H${c.x + 2}V${c.y + s - 2}z" fill="#fff" opacity=".5"/><path d="M${c.x + s} ${c.y}V${c.y + s}H${c.x}l2-2H${c.x + s - 2}V${c.y + 2}z" fill="#000" opacity=".28"/>`).join('');
    const g = o.fill || ['#fff', '#fff'];
    return `<svg class="cab-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(String(text).replace(/\n/g, ' '))}"><defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="${H}" gradientUnits="userSpaceOnUse">${g.map((c, i) => `<stop offset="${g.length > 1 ? i / (g.length - 1) : 0}" stop-color="${c}"/>`).join('')}</linearGradient></defs>${body}</svg>`;
  }
  function vectorSvg(text, o = {}) {
    const id = `cbv${++uid}`;
    const lines = String(text).toUpperCase().split('\n');
    const u = 10, adv = 6.4;
    const widths = lines.map((l) => [...l].reduce((w, ch) => w + (ch === ' ' ? 3.6 : adv), 0) - (adv - 4));
    const maxW = Math.max(...widths);
    const W = maxW * u + 24, H = lines.length * 9 * u - 3 * u + 24;
    const paths = lines.map((line, li) => {
      let x = (maxW - widths[li]) / 2;
      let d = '';
      for (const ch of line) {
        if (ch === ' ') { x += 3.6; continue; }
        for (const st of VEC[ch] || VEC['-']) {
          const pts = st.split(' ').map((p) => p.split(',').map(Number));
          d += pts.map(([px, py], i) => `${i ? 'L' : 'M'}${((x + px) * u + 12).toFixed(1)} ${((li * 9 + py) * u + 12).toFixed(1)}`).join('');
        }
        x += adv;
      }
      return d;
    });
    const cols = o.lines || [o.stroke || '#fff'];
    const sw = o.width || 4.2;
    const ghost = o.ghost ? paths.map((d) => `<path d="${d}" stroke="${o.ghost}" transform="translate(4 3)" opacity=".75"/>`).join('') : '';
    return `<svg class="cab-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(String(text).replace(/\n/g, ' '))}"><defs><filter id="${id}f" x="-20%" y="-30%" width="140%" height="160%"><feGaussianBlur stdDeviation="${o.blur || 3.2}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g fill="none" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" filter="url(#${id}f)">${ghost}${paths.map((d, i) => `<path d="${d}" stroke="${cols[i % cols.length]}"/>`).join('')}</g></svg>`;
  }
  function toonHtml(text, o = {}) {
    const lines = String(text).split('\n');
    let i = 0;
    const n = Math.max(...lines.map((l) => l.length));
    return `<div class="cab-word cab-word--${o.kind || 'toon'}${o.kind && o.kind !== 'toon' && o.kind !== 'chrome' ? ' cab-word--toon' : ''}" style="--n:${n}" role="img" aria-label="${esc(String(text).replace(/\n/g, ' '))}">${lines.map((l) => `<span class="cab-wl">${[...l].map((ch) => ch === ' ' ? '<span class="cab-sp"></span>' : `<span class="cab-ch" style="--i:${i++}" data-c="${esc(ch)}">${esc(ch)}</span>`).join('')}</span>`).join('')}</div>`;
  }
  function logo(size) {
    const t = cfg.logo || {};
    const text = (size === 'small' && t.short) || cfg.title;
    if (cfg.style === 'pixel') return pixelSvg(text, t);
    if (cfg.style === 'vector') return vectorSvg(text, t);
    return toonHtml(text, { kind: t.kind || cfg.style });
  }

  let ac = null;
  function tone(f, d, type = 'square', vol = 0.06, slide = 0, at = 0) {
    if (C.muted) return;
    ac = ac || C.audioContext?.();
    if (!ac) return;
    try {
      const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + d + 0.03);
    } catch {}
  }
  function play(seq, type) {
    let at = 0;
    for (const n of seq || []) {
      const [f, ms, slide, vol] = n;
      if (f) tone(f, ms / 1000 * 0.95, n[4] || type || cfg.wave || 'square', vol || 0.06, slide || 0, at);
      at += ms / 1000;
    }
  }
  const SOUND = {
    coin: () => play([[988, 70], [1319, 260]], 'square'),
    tick: () => tone(1200, 0.025, 'square', 0.03),
    move: () => tone(660, 0.04, 'square', 0.04),
    ok: () => play([[523, 60], [784, 60], [1047, 140]], 'square'),
    rank: () => play([[523, 90], [659, 90], [784, 90], [1047, 90], [784, 90], [1047, 260]], 'square')
  };

  let cfg = null, att = null, entry = null, crt = true, pane = 0, timer = 0, credits = 0, guardUntil = 0, starting = false, booted = false, attractOn = false, entryOn = false, seededRandom = null;
  const PANES = ['title', 'scores', 'how'];
  const touchy = () => matchMedia('(pointer: coarse)').matches;

  function readTable(key) {
    const all = store.get(HS, {});
    const raw = all && typeof all === 'object' ? all[key] : null;
    if (Array.isArray(raw)) return raw.filter((e) => e && typeof e.n === 'string' && typeof e.s === 'number').slice(0, 10);
    return seedTable(key);
  }
  function writeTable(key, list) {
    const all = store.get(HS, {});
    const next = all && typeof all === 'object' && !Array.isArray(all) ? all : {};
    next[key] = list.slice(0, 10);
    const keys = Object.keys(next).filter((k) => k.startsWith('daily-')).sort();
    while (keys.length > 7) delete next[keys.shift()];
    store.set(HS, next);
  }
  function seedTable(key) {
    const low = lowFor(key);
    const top = typeof cfg.seed === 'function' ? cfg.seed(key) : cfg.seed;
    const step = cfg.step || 10;
    const fr = low ? [1, 1.12, 1.25, 1.4, 1.6, 1.85, 2.1, 2.45, 2.9, 3.5] : [1, 0.82, 0.68, 0.55, 0.45, 0.36, 0.28, 0.2, 0.13, 0.07];
    const k = key.startsWith('daily-') ? 0.6 : 1;
    const off = hash(slug + key) % NAMES.length;
    return fr.map((f, i) => ({ n: NAMES[(off + i * 7) % NAMES.length], s: Math.max(step, Math.round(top * f * (low ? 1 / k : k) / step) * step), t: 0 }));
  }
  const lowFor = (key) => (typeof cfg.low === 'function' ? cfg.low(key) : !!cfg.low);
  const fmt = (v, key) => (cfg.fmt ? cfg.fmt(v, key) : C.fmt(v));
  function tableHtml(key, hi = -1) {
    const list = readTable(key);
    return `<ol class="cab-hs">${list.map((e, i) => `<li class="${i === hi ? 'is-new' : ''}"><span class="cab-hs-r">${ORD[i]}</span><span class="cab-hs-n">${esc(e.n)}</span><span class="cab-hs-s">${esc(fmt(e.s, key))}</span></li>`).join('')}</ol>`;
  }
  const keyNow = () => (cfg.key ? cfg.key() : window.__arcade?.tableKey?.() || 'score');
  const label = (key) => {
    if (key.startsWith('daily-')) return `DAILY ${key.slice(6)}`;
    return String(cfg.keyLabel ? cfg.keyLabel(key) : key).toUpperCase();
  };

  function build() {
    const body = document.body;
    body.classList.add('cab', `cab--${cfg.style}`);
    const p = cfg.pal || {};
    const vars = { a: p.a, b: p.b, c: p.c, side: p.side, glow: p.glow || p.a, btn: p.btn || p.a, 'btn-ink': p.btnInk || '#111', screen: p.screen || '#05060a', marq: p.marq || p.side, 't1': p.t1, 't2': p.t2, 'tout': p.tout, 'tdeep': p.tdeep };
    for (const k in vars) if (vars[k]) body.style.setProperty(`--cab-${k}`, vars[k]);
    crt = store.get(CRT, true) !== false;
    body.classList.toggle('cab-crt', crt);
    const wrap = $(cfg.wrap), stage = $(cfg.stage);
    if (!wrap || !stage) return false;
    const marq = document.createElement('div');
    marq.className = 'cab-marq';
    marq.setAttribute('aria-hidden', 'true');
    marq.innerHTML = `<i class="cab-bulb"></i><div class="cab-marq__logo">${logo('small')}</div><i class="cab-bulb"></i>`;
    const bez = document.createElement('div');
    bez.className = 'cab-bezel';
    const hud = cfg.hud ? $(cfg.hud) : null;
    wrap.insertBefore(bez, hud && hud.parentNode === wrap ? hud : stage);
    if (hud) bez.append(hud);
    bez.append(stage);
    wrap.insertBefore(marq, bez);
    stage.classList.add('cab-screen');
    const glass = document.createElement('div');
    glass.className = 'cab-glass';
    glass.setAttribute('aria-hidden', 'true');
    stage.append(glass);
    att = document.createElement('section');
    att.className = 'cab-attract';
    att.hidden = true;
    att.setAttribute('aria-label', `${cfg.title} title screen`);
    stage.append(att);
    entry = document.createElement('section');
    entry.className = 'cab-entry';
    entry.hidden = true;
    entry.setAttribute('aria-label', 'Enter your initials');
    stage.append(entry);
    for (const el of [att, entry]) for (const ev of ['pointerdown', 'pointerup', 'click', 'touchstart']) el.addEventListener(ev, (e) => e.stopPropagation());
    const pad = cfg.pad ? $(cfg.pad) : null;
    if (pad) pad.classList.add('cab-pad');
    if (hud) hud.classList.add('cab-hud', 'cab-dark');
    const menuEl = cfg.menu ? $(cfg.menu) : null;
    if (menuEl) menuEl.classList.add('cab-menu');
    document.querySelectorAll(cfg.ovs).forEach((el) => el.classList.add('cab-dark'));
    const canvas = stage.querySelector(cfg.canvas);
    const place = () => {
      if (!canvas) return;
      const sr = stage.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      if (!cr.width || !cr.height) return;
      const box = { left: `${Math.round(cr.left - sr.left)}px`, top: `${Math.round(cr.top - sr.top)}px`, width: `${Math.round(cr.width)}px`, height: `${Math.round(cr.height)}px` };
      for (const el of [glass, att, entry]) Object.assign(el.style, box);
      body.style.setProperty('--cab-cw', `${Math.round(cr.width)}px`);
    };
    if (canvas) {
      const ro = new ResizeObserver(place);
      ro.observe(canvas);
      ro.observe(stage);
      addEventListener('resize', place);
      requestAnimationFrame(place);
    }
    Cab.place = place;
    return true;
  }

  function art() {
    if (cfg.artHtml) return cfg.artHtml;
    const src = cfg.art ? $(cfg.art) : null;
    if (!src) return '';
    const cl = src.cloneNode(true);
    cl.removeAttribute('id');
    cl.querySelectorAll('[id]').forEach((n) => {
      const old = n.id, nu = `${old}-cab`;
      n.id = nu;
      cl.querySelectorAll('*').forEach((m) => {
        for (const a of ['fill', 'stroke', 'filter', 'clip-path', 'mask', 'href', 'xlink:href']) {
          const v = m.getAttribute(a);
          if (v && v.includes(`#${old}`)) m.setAttribute(a, v.replace(new RegExp(`#${old}\\b`, 'g'), `#${nu}`));
        }
      });
    });
    cl.classList.add('cab-art');
    return cl.outerHTML;
  }

  function renderAttract() {
    const key = keyNow();
    const top = readTable(key)[0];
    const adv = C.advanced;
    const help = (cfg.help || []).map(([k, d]) => `<li><b>${esc(k)}</b><span>${esc(d)}</span></li>`).join('');
    att.innerHTML = `
      <div class="cab-a-top"><span>1UP</span><span class="cab-a-hi">HI-SCORE <b>${esc(top ? fmt(top.s, key) : '0')}</b> ${esc(top ? top.n : '')}</span><span>2UP</span></div>
      <div class="cab-a-panes">
        <div class="cab-pane" data-pane="title">
          <div class="cab-logo">${logo('big')}</div>
          <div class="cab-a-art">${art()}</div>
          <p class="cab-tag">${esc(cfg.tag || '')}</p>
        </div>
        <div class="cab-pane" data-pane="scores">
          <h2 class="cab-h">HIGH SCORES</h2>
          <p class="cab-hs-k">${esc(label(key))}</p>
          ${tableHtml(key)}
        </div>
        <div class="cab-pane" data-pane="how">
          <h2 class="cab-h">HOW TO PLAY</h2>
          <ul class="cab-how">${help}</ul>
          ${adv ? `<p class="cab-adv">${esc(cfg.advNote || 'Advanced cabinet: every mode, the daily challenge, unlocks and stats.')}</p>` : ''}
        </div>
      </div>
      <button class="cab-start" type="button" data-cab="start"><span class="cab-blink">${credits ? 'PRESS START' : 'INSERT COIN'}</span><small>${touchy() ? 'Tap to play' : 'Press Space or Enter'}${adv ? ', then pick a mode' : ''}</small></button>
      <div class="cab-a-foot">
        <span class="cab-credit">CREDIT ${credits}</span>
        <span class="cab-dots" role="group" aria-label="Title screen pages">${PANES.map((p, i) => `<button type="button" data-cab-pane="${i}" aria-label="${['Title', 'High scores', 'How to play'][i]}"></button>`).join('')}</span>
        <button type="button" class="cab-crtbtn" data-cab="crt" aria-pressed="${crt}">CRT ${crt ? 'ON' : 'OFF'}</button>
      </div>`;
    att.querySelector('[data-cab="start"]').addEventListener('click', (e) => { e.stopPropagation(); coin(); });
    att.querySelector('[data-cab="crt"]').addEventListener('click', (e) => { e.stopPropagation(); toggleCrt(); });
    att.querySelectorAll('[data-cab-pane]').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); setPane(+b.dataset.cabPane, true); }));
    att.querySelector('.cab-a-panes').addEventListener('click', () => setPane(pane + 1, true));
    setPane(pane, false);
  }
  function setPane(i, user) {
    pane = (i + PANES.length) % PANES.length;
    att.querySelectorAll('.cab-pane').forEach((p, j) => p.classList.toggle('is-on', j === pane));
    att.querySelectorAll('[data-cab-pane]').forEach((b, j) => b.setAttribute('aria-pressed', String(j === pane)));
    if (user) { SOUND.tick(); restartCycle(); }
  }
  function restartCycle() {
    clearInterval(timer);
    timer = setInterval(() => { if (!document.hidden && attractOn && !entryOn) setPane(pane + 1, false); }, pane === 0 ? 6500 : 5000);
  }
  function toggleCrt() {
    crt = !crt;
    store.set(CRT, crt);
    document.body.classList.toggle('cab-crt', crt);
    const b = att?.querySelector('[data-cab="crt"]');
    if (b) { b.textContent = `CRT ${crt ? 'ON' : 'OFF'}`; b.setAttribute('aria-pressed', String(crt)); }
    SOUND.tick();
  }
  function showAttract() {
    if (!att) return;
    starting = false;
    pane = 0;
    renderAttract();
    att.hidden = false;
    attractOn = true;
    document.body.classList.add('cab-attracting');
    restartCycle();
    const b = att.querySelector('[data-cab="start"]');
    if (b && !matchMedia('(pointer: coarse)').matches) b.focus({ preventScroll: true });
  }
  function hideAttract() {
    if (!att) return;
    att.hidden = true;
    attractOn = false;
    document.body.classList.remove('cab-attracting');
    clearInterval(timer);
  }
  function coin() {
    if (starting) return;
    starting = true;
    credits++;
    SOUND.coin();
    const s = att.querySelector('.cab-blink');
    if (s) s.textContent = C.advanced ? 'SELECT MODE' : 'PLAYER 1';
    att.querySelector('.cab-credit').textContent = `CREDIT ${credits}`;
    att.classList.add('is-coin');
    setTimeout(() => {
      att.classList.remove('is-coin');
      hideAttract();
      starting = false;
      if (C.advanced) {
        if (cfg.advanced) cfg.advanced();
        const f = cfg.menu ? $(cfg.menu) : null;
        f?.querySelector('[data-act="start"], .c-btn')?.focus({ preventScroll: true });
      } else {
        play(cfg.jingle);
        if (cfg.start) cfg.start(); else window.__arcade?.start();
      }
    }, 300);
  }

  function openEntry(value, rank, key) {
    return new Promise((resolve) => {
      entryOn = true;
      const last = String(store.get('classics:initials', 'AAA') || 'AAA').toUpperCase().replace(/[^A-Z0-9.!]/g, 'A').padEnd(3, 'A').slice(0, 3);
      const name = [...last];
      let at = 0;
      entry.innerHTML = `
        <div class="cab-e-in">
          <p class="cab-e-h">NEW HIGH SCORE</p>
          <p class="cab-e-rank">${ORD[rank]} PLACE · ${esc(label(key))}</p>
          <div class="cab-e-score">${esc(fmt(value, key))}</div>
          <p class="cab-e-ask">ENTER YOUR INITIALS</p>
          <div class="cab-e-slots">${[0, 1, 2].map((i) => `<div class="cab-e-slot"><button type="button" data-up="${i}" aria-label="Next letter">▲</button><b data-l="${i}"></b><button type="button" data-dn="${i}" aria-label="Previous letter">▼</button></div>`).join('')}</div>
          <button class="cab-e-ok" type="button">OK</button>
          <p class="cab-e-hint">Type letters, or use ▲ ▼ and ◀ ▶, then Enter</p>
        </div>`;
      entry.hidden = false;
      SOUND.rank();
      const paint = () => entry.querySelectorAll('[data-l]').forEach((el, i) => { el.textContent = name[i]; el.parentNode.classList.toggle('is-at', i === at); });
      const shift = (i, d) => { const idx = LETTERS.indexOf(name[i]); name[i] = LETTERS[(idx + d + LETTERS.length) % LETTERS.length]; at = i; SOUND.move(); paint(); };
      const done = () => {
        if (!entryOn) return;
        const n = name.join('');
        store.set('classics:initials', n);
        entryOn = false;
        entry.hidden = true;
        entry.innerHTML = '';
        guardUntil = performance.now() + 450;
        document.removeEventListener('keydown', onKey, true);
        SOUND.ok();
        resolve(n);
      };
      const onKey = (e) => {
        if (!entryOn) return;
        const k = e.key;
        if (k === 'Tab') return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.repeat && (k === 'Enter' || k === ' ')) return;
        if (k === 'Enter' || (k === ' ' && at === 2)) done();
        else if (k === 'ArrowUp' || k === 'w' || k === 'W') shift(at, 1);
        else if (k === 'ArrowDown' || k === 's' || k === 'S') shift(at, -1);
        else if (k === 'ArrowLeft' || k === 'Backspace') { at = Math.max(0, at - 1); SOUND.tick(); paint(); }
        else if (k === 'ArrowRight' || k === ' ') { at = Math.min(2, at + 1); SOUND.tick(); paint(); }
        else if (k.length === 1 && LETTERS.includes(k.toUpperCase())) { name[at] = k.toUpperCase(); SOUND.move(); if (at < 2) at++; paint(); }
      };
      document.addEventListener('keydown', onKey, true);
      entry.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => shift(+b.dataset.up, 1)));
      entry.querySelectorAll('[data-dn]').forEach((b) => b.addEventListener('click', () => shift(+b.dataset.dn, -1)));
      entry.querySelectorAll('[data-l]').forEach((b, i) => b.addEventListener('click', () => { at = i; SOUND.tick(); paint(); }));
      entry.querySelector('.cab-e-ok').addEventListener('click', done);
      paint();
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
      entry.querySelector('.cab-e-ok').focus({ preventScroll: true });
    });
  }

  function overBox(key, hi) {
    const card = cfg.over ? $(cfg.over) : null;
    if (!card) return;
    let box = card.querySelector('.cab-hsbox');
    if (!box) {
      box = document.createElement('div');
      box.className = 'cab-hsbox';
      const rows = card.querySelectorAll(cfg.overRow || '.c-row');
      const row = rows[rows.length - 1];
      if (row) row.parentNode.insertBefore(box, row);
      else card.append(box);
    }
    box.innerHTML = `<p class="cab-hsbox__h">HIGH SCORES <span>${esc(label(key))}</span></p>${tableHtml(key, hi)}`;
  }

  function onKeys(e) {
    if (entryOn) return;
    if (document.querySelector('.curio-modal, .curio-sheet.is-open, .curio-sheet[open]')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (!attractOn) {
      if (performance.now() < guardUntil && (k === ' ' || k === 'Enter')) { e.preventDefault(); e.stopImmediatePropagation(); }
      return;
    }
    if (e.target.closest?.('.curio-bar')) return;
    if (k === ' ' || k === 'Enter' || k === 'Spacebar') { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) coin(); }
    else if (k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); e.stopImmediatePropagation(); setPane(pane + (k === 'ArrowRight' ? 1 : -1), true); }
    else if (k === 'h' || k === 'H') { e.stopImmediatePropagation(); setPane(1, true); }
    else if (k === 'v' || k === 'V') { e.stopImmediatePropagation(); toggleCrt(); }
    else if (k === 'ArrowUp' || k === 'ArrowDown') { e.preventDefault(); e.stopImmediatePropagation(); }
  }

  const Cab = {
    setup(c) {
      cfg = Object.assign({ style: 'pixel', wrap: '.arc-wrap', stage: '.arc-stage', hud: '.arc-hud', pad: '.arc-pad', over: '#ov-over .arc-card', menu: '#ov-menu', art: '#ov-menu .arc-art', ovs: '.arc-ov', canvas: 'canvas', seed: 10000, step: 10 }, c);
      if (!build()) return Cab;
      window.addEventListener('keydown', onKeys, true);
      document.addEventListener('visibilitychange', () => { if (!document.hidden && attractOn) restartCycle(); });
      window.addEventListener('curio:mode', () => { if (attractOn) renderAttract(); });
      return Cab;
    },
    menu(o = {}) {
      if (!cfg || !att) return;
      const first = !booted;
      booted = true;
      Cab.unseed();
      if (first || C.simple || o.attract) showAttract();
      else hideAttract();
    },
    attract: () => showAttract(),
    hide: () => hideAttract(),
    get attracting() { return attractOn; },
    get busy() { return attractOn || entryOn; },
    over(value, o = {}) {
      if (!cfg) return Promise.resolve(-1);
      Cab.unseed();
      const key = o.key || keyNow();
      const low = o.low ?? lowFor(key);
      const v = Number(value);
      if (!isFinite(v) || (!low && v <= 0) || (low && v <= 0)) { overBox(key, -1); return Promise.resolve(-1); }
      const list = readTable(key);
      let rank = list.findIndex((e) => (low ? v < e.s : v > e.s));
      if (rank < 0 && list.length < 10) rank = list.length;
      if (rank < 0) { overBox(key, -1); return Promise.resolve(-1); }
      return openEntry(v, rank, key).then((n) => {
        list.splice(rank, 0, { n, s: v, t: Date.now() });
        writeTable(key, list.slice(0, 10));
        overBox(key, rank);
        o.done?.(rank);
        return rank;
      });
    },
    table: (key) => readTable(key || keyNow()),
    tableHtml,
    today,
    dailyKey: () => `daily-${today()}`,
    seed(str) {
      if (seededRandom) return;
      seededRandom = Math.random;
      const r = mulberry(hash(`${slug}:${str}`));
      Math.random = r;
    },
    unseed() { if (seededRandom) { Math.random = seededRandom; seededRandom = null; } },
    sound: (n) => SOUND[n]?.(),
    play,
    tone,
    pixelSvg,
    vectorSvg,
    logo: () => logo('big')
  };
  window.Cab = Cab;
})();
