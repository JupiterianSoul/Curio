(() => {
  const WTP = window.WTP;
  const { P32, PAL, shade, mix, hash, rng, strSeed, pack } = WTP;
  const L = {};
  WTP.levels = L;
  const Wd = () => WTP.world;
  const F_PIN = 8, F_NOGLUE = 32;

  const THEMES = {
    news: { fam: 'city', sky: ['n', 'b'], motif: 'city', style: 'girder', tint: 'o', sign: 'BREAKING', icons: 1 },
    wiki: { fam: 'library', sky: ['g', 'G'], motif: 'hills', style: 'stone', tint: '5', sign: 'CITATION NEEDED' },
    shop: { fam: 'market', sky: ['R', 'o'], motif: 'dots', style: 'girder', tint: 'e', sign: 'SALE 99% OFF' },
    blog: { fam: 'cozy', sky: ['w', 'u'], motif: 'hills', style: 'wood', tint: 'u', sign: 'FRESH BREAD' },
    search: { fam: 'tech', sky: ['n', 'c'], motif: 'grid', style: 'plastic', tint: 'c', sign: 'NO RESULTS' },
    lost: { fam: 'void', sky: ['0', 'p'], motif: 'stars', style: 'girder', tint: 'm', sign: 'ERROR 404' },
    own: { fam: 'cozy', sky: ['p', 'P'], motif: 'waves', style: 'wood', tint: 'P', sign: 'MY WORDS' },
    feed: { fam: 'sky', sky: ['b', 'C'], motif: 'clouds', style: 'cloud', tint: 'c', sign: 'TRENDING' },
    recipe: { fam: 'market', sky: ['R', 'a'], motif: 'hills', style: 'wood', tint: 'o', sign: 'SKIP TO RECIPE' },
    weather: { fam: 'sky', dark: true, sky: ['b', 'C'], motif: 'clouds', style: 'cloud', tint: '7', sign: 'STORM WARNING' },
    inbox: { fam: 'tech', sky: ['n', 'P'], motif: 'waves', style: 'server', tint: 'c', sign: 'INBOX FULL' },
    retro: { fam: 'arcade', sky: ['p', 'k'], motif: 'grid', style: 'plastic', tint: 'y', sign: 'UNDER CONSTRUCTION' },
    video: { fam: 'tech', sky: ['0', 'R'], motif: 'city', style: 'server', tint: 'e', sign: 'LIVE' },
    bank: { fam: 'vault', sky: ['n', 't'], motif: 'city', style: 'stone', tint: 'y', sign: 'VAULT' },
    gov: { fam: 'library', sky: ['n', '3'], motif: 'hills', style: 'stone', tint: '5', sign: 'FORM 27-B' },
    forum: { fam: 'cozy', sky: ['2', 'n'], motif: 'stars', style: 'wood', tint: 'u', sign: 'OFF TOPIC' },
    music: { fam: 'arcade', sky: ['p', 'm'], motif: 'grid', style: 'server', tint: 'm', sign: 'NOW PLAYING' },
    curio: { fam: 'market', sky: ['o', 'y'], motif: 'dots', style: 'plastic', tint: 'o', sign: 'CURIOUSER' },
    tos: { fam: 'library', sky: ['n', 'b'], motif: 'waves', style: 'stone', tint: 'c', sign: 'TERMS APPLY' },
    jobs: { fam: 'city', sky: ['n', 'c'], motif: 'city', style: 'plastic', tint: 'b', sign: 'HIRING' },
    status: { fam: 'tech', sky: ['g', 't'], motif: 'grid', style: 'server', tint: 'l', sign: 'ALL SYSTEMS DOWN' },
    range: { fam: 'city', sky: ['2', '3'], motif: 'grid', style: 'girder', tint: 'e', sign: 'TEST RANGE' },
    arcade: { fam: 'arcade', sky: ['0', 'p'], motif: 'grid', style: 'plastic', tint: 'k', sign: 'INSERT COIN' },
    realty: { fam: 'city', sky: ['b', 'a'], motif: 'city', style: 'girder', tint: 'a', sign: 'SOLD' },
    museum: { fam: 'library', sky: ['w', 'W'], motif: 'hills', style: 'stone', tint: 'y', sign: 'DO NOT TOUCH' },
    launch: { fam: 'space', sky: ['0', 'n'], motif: 'stars', style: 'girder', tint: 'c', sign: 'T MINUS 10' },
    maps: { fam: 'city', sky: ['g', 'G'], motif: 'hills', style: 'plastic', tint: 'G', sign: 'RECALCULATING' },
    airline: { fam: 'sky', sky: ['b', 'C'], motif: 'clouds', style: 'cloud', tint: 'c', sign: 'GATE CHANGE' },
    pets: { fam: 'cozy', sky: ['a', 'Y'], motif: 'hills', style: 'wood', tint: 'k', sign: 'GOOD BOY', leafA: 'G', leafB: 'L' },
    crypto: { fam: 'tech', sky: ['0', 'r'], motif: 'grid', style: 'server', tint: 'y', sign: 'TO THE MOON' },
    cars: { fam: 'city', sky: ['b', 'C'], motif: 'hills', style: 'girder', tint: 'e', sign: 'NO REFUNDS' }
  };
  const SEL = {
    news: { '.n-nav': 'metal', '.n-mast': 'stone', '.n-ad': 'prop:car', '.n-fig': 'image', '.n-foot': 'metal' },
    wiki: { '.w-info': 'stone', '.w-head': 'metal', '.w-toc': 'wood' },
    shop: { '.s-promo': 'metal', '.s-head': 'metal', '.s-hero': 'prop:video', '.s-cart': 'prop:btn', '.s-foot': 'stone' },
    blog: { '.b-head': 'wood', '.b-side': 'wood', '.b-box': 'wood', '.b-recipe': 'paper' },
    search: { '.q-head': 'plastic', '.q-paa': 'plastic' },
    lost: { '.e-hero': 'stone', '.e-err': 'metal' },
    feed: { '.f-top': 'plastic', '.f-poll': 'rubber', '.f-card': 'prop:video' },
    recipe: { '.r-ad': 'prop:car', '.r-top': 'wood', '.r-card': 'wood' },
    weather: { '.t-hero': 'glass', '.t-alert': 'prop:bell', '.t-grid': 'metal' },
    inbox: { '.i-top': 'metal', '.i-side': 'metal' },
    retro: { '.x-mq': 'prop:car', '.x-tbl': 'wood', '.x-badges': 'plastic' },
    video: { '.v-player': 'prop:video', '.v-top': 'metal', '.v-next': 'image' },
    bank: { '.bk-top': 'metal', '.bk-hero': 'stone', '.bk-rates': 'metal' },
    gov: { '.gv-band': 'stone', '.gv-stamp': 'rubber', '.gv-paper': 'paper' },
    forum: { '.fm-head': 'wood', '.fm-bar': 'wood' },
    music: { '.mu-top': 'metal', '.mu-cover': 'prop:video', '.mu-player': 'metal' },
    curio: { '.cu-top': 'plastic', '.cu-grid': 'plastic' },
    tos: { '.ts-caps': 'stone', '.ts-top': 'metal' },
    jobs: { '.jb-top': 'plastic', '.jb-ban': 'image' },
    status: { '.st-top': 'metal', '.st-list': 'metal' },
    arcade: { '.ar-cab': 'plastic', '.ar-screen': 'prop:video', '.ar-top': 'metal' },
    realty: { '.re-tower': 'image', '.re-top': 'metal', '.re-plan': 'wood' },
    museum: { '.mz-frame': 'wood', '.mz-col': 'stone', '.mz-top': 'stone' },
    launch: { '.lc-rocket': 'prop:rocket', '.lc-panel': 'metal', '.lc-top': 'metal' },
    maps: { '.mp-map': 'image', '.mp-zbtn': 'prop:btn', '.mp-top': 'plastic', '.mp-eta': 'rubber' },
    airline: { '.sk-top': 'metal', '.sk-hero': 'image', '.sk-cta': 'prop:btn', '.sk-f': 'plastic' },
    pets: { '.pt-top': 'wood', '.pt-card': 'wood', '.pt-banner': 'rubber' },
    crypto: { '.cr-chart': 'prop:video', '.cr-top': 'metal', '.cr-book': 'metal', '.cr-warn': 'glass' },
    cars: { '.ca-car': 'prop:car', '.ca-top': 'metal', '.ca-lot': 'stone' }
  };
  L.THEMES = THEMES;

  L.prepareDOM = (root, page) => {
    const spec = SEL[page.id] || {};
    for (const sel in spec) {
      const v = spec[sel];
      let list = [];
      try { list = root.querySelectorAll(sel); } catch (e) { list = []; }
      list.forEach((el, k) => {
        if (v.startsWith('prop:')) { if (k < 6) el.setAttribute('data-prop', v.slice(5)); }
        else el.setAttribute('data-mat', v);
      });
    }
  };
  L.margin = () => (window.innerWidth < 700 ? 32 : 56);
  L.topPad = () => 200;
  L.bottomPad = () => 170;

  const C = (k) => P32[k] ?? k;
  function cellsFor(x, y) { const W = Wd(); return x >= 0 && y >= 0 && x < W.w && y < W.h - 3; }
  function put(x, y, c, m, fl = F_NOGLUE) { if (cellsFor(x, y)) Wd().setCell(x, y, c, m, fl); }
  const MT = () => Wd().M;

  function styleCols(style, tint) {
    const t = C(tint);
    if (style === 'wood') return { hi: P32.u, mid: P32.W, lo: P32.w, dark: shade(P32.w, 0.7), acc: P32.a, m: MT().WOOD };
    if (style === 'stone') return { hi: P32['6'], mid: P32['5'], lo: P32['4'], dark: P32['3'], acc: t, m: MT().STONE };
    if (style === 'plastic') return { hi: shade(t, 1.25, 20), mid: t, lo: shade(t, 0.75), dark: shade(t, 0.5), acc: P32['7'], m: MT().PLASTIC };
    if (style === 'cloud') return { hi: P32['7'], mid: P32['6'], lo: P32['5'], dark: P32.C, acc: P32.C, m: MT().RUBBER };
    if (style === 'server') return { hi: P32['4'], mid: P32['2'], lo: P32['1'], dark: P32['0'], acc: t, m: MT().METAL };
    return { hi: mix(P32['6'], t, 0.25), mid: mix(P32['4'], t, 0.35), lo: mix(P32['3'], t, 0.3), dark: P32['2'], acc: t, m: MT().METAL };
  }
  function platform(x0, y, w, sc, style, fl = F_NOGLUE) {
    const h = style === 'wood' ? 3 : 4;
    for (let lx = 0; lx < w; lx++) for (let ly = 0; ly < h; ly++) {
      const x = x0 + lx, yy = y + ly;
      let c;
      if (style === 'girder' || style === 'server') {
        if (ly === 0) c = sc.hi; else if (ly === h - 1) c = sc.dark;
        else { const d = (lx + (ly === 1 ? 0 : 2)) % 4; c = d === 0 || d === 1 ? sc.mid : sc.lo; if (style === 'server' && ly === 1 && lx % 5 === 2) c = (hash(lx, y) & 1) ? P32.l : sc.acc; }
        if (ly === 0 && lx % 8 === 3 && style === 'girder') c = sc.acc;
      } else if (style === 'wood') {
        c = ly === 0 ? sc.hi : ly === h - 1 ? sc.lo : ((hash(lx >> 2, y) & 3) === 0 ? sc.lo : sc.mid);
        if (ly === 1 && (lx % 11 === 2)) c = sc.dark;
      } else if (style === 'stone') {
        c = ly === 0 ? sc.hi : ly === h - 1 ? sc.dark : ((lx + (ly * 3)) % 9 === 0 ? sc.lo : sc.mid);
        if ((hash(lx, ly + y) & 15) === 0) c = sc.lo;
      } else if (style === 'plastic') {
        c = ly === h - 1 ? sc.lo : ly === 0 ? sc.hi : sc.mid;
        if (ly === 0 && lx % 4 === 3) c = sc.mid;
      } else {
        const edge = lx === 0 || lx === w - 1;
        if (edge && (ly === 0 || ly === h - 1)) continue;
        c = ly === 0 ? sc.hi : ly === h - 1 ? sc.lo : sc.mid;
        if (ly === 1 && (hash(lx, y) & 7) === 0) c = sc.hi;
      }
      put(x, yy, c, sc.m, fl);
    }
    if (style === 'plastic') for (let lx = 1; lx < w - 1; lx += 4) { put(x0 + lx, y - 1, sc.hi, sc.m, fl); put(x0 + lx + 1, y - 1, sc.mid, sc.m, fl); }
    return h;
  }
  function post(x, y0, y1, sc, style, wdt = 2) {
    for (let y = y0; y <= y1; y++) for (let k = 0; k < wdt; k++) {
      let c = k === 0 ? sc.hi : sc.lo;
      if (style === 'stone') c = k === 0 ? sc.hi : ((y + k) % 7 === 0 ? sc.dark : sc.mid);
      if ((style === 'girder' || style === 'server') && (y - y0) % 6 === 0) c = sc.acc;
      if (style === 'wood' && (hash(k, y >> 2) & 3) === 0) c = sc.mid;
      if (style === 'cloud') c = k === 0 ? P32['6'] : P32['5'];
      put(x + k, y, c, style === 'cloud' ? MT().PLASTIC : sc.m);
    }
  }
  function chain(x, y0, y1) {
    for (let y = y0; y <= y1; y++) {
      const ph = (y - y0) % 4;
      if (ph === 0 || ph === 2) put(x, y, P32['5'], MT().METAL);
      else { put(x - 1, y, P32['4'], MT().METAL); put(x + 1, y, P32['6'], MT().METAL); }
    }
  }
  function bolt(x, y) { const W = Wd(); if (!cellsFor(x, y)) return; put(x, y, P32['6'], MT().METAL, F_PIN | F_NOGLUE); W.mtl[y * W.w + x] = MT().METAL; }
  let textCache = new Map();
  function textPixels(text, color) {
    const key = `${text}|${color}`;
    if (textCache.has(key)) return textCache.get(key);
    const t = WTP.font.textCanvas(text, { color, outline: null });
    const g = t.cv.getContext('2d');
    const d = g.getImageData(0, 0, t.w, t.h).data;
    const out = { w: t.w, h: t.h, on: new Uint8Array(t.w * t.h) };
    for (let i = 0; i < t.w * t.h; i++) out.on[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    textCache.set(key, out);
    return out;
  }
  function sign(cx, y, text, sc, o = {}) {
    const tp = textPixels(text, '7');
    const w = tp.w + 8, h = tp.h + 6;
    const x0 = Math.round(cx - w / 2);
    const bg = o.bg ? C(o.bg) : sc.dark, fg = o.fg ? C(o.fg) : P32.Y, rim = o.rim ? C(o.rim) : sc.acc;
    const m = o.m ?? MT().WOOD;
    for (let ly = 0; ly < h; ly++) for (let lx = 0; lx < w; lx++) {
      let c = (lx === 0 || ly === 0 || lx === w - 1 || ly === h - 1) ? rim : bg;
      if ((lx === 1 || lx === w - 2) && (ly === 1 || ly === h - 2)) c = P32['6'];
      const tx = lx - 4, ty = ly - 3;
      if (tx >= 0 && ty >= 0 && tx < tp.w && ty < tp.h && tp.on[ty * tp.w + tx]) c = ((hash(tx, ty) & 7) === 0) ? P32['7'] : fg;
      put(x0 + lx, y + ly, c, m);
    }
    return { x0, w, h };
  }
  function region(t, x0, y0, w, h, painter, m, o = {}) {
    for (let ly = 0; ly < h; ly++) for (let lx = 0; lx < w; lx++) { const c = painter(lx, ly); if (c) put(x0 + lx, y0 + ly, c, m, o.fl ?? F_NOGLUE); }
    return Wd().addPropRegion(t, { x0, y0, x1: x0 + w - 1, y1: y0 + h - 1 }, o);
  }
  function crate(x0, y0, s = 9) {
    return region('crate', x0, y0, s, s, (lx, ly) => {
      if (lx === 0 || ly === 0 || lx === s - 1 || ly === s - 1) return P32.w;
      if (lx === ly || lx === s - 1 - ly) return P32.u;
      return (hash(lx, ly) & 3) === 0 ? P32.W : shade(P32.W, 1.1, 6);
    }, MT().WOOD);
  }
  function barrel(x0, y0, big) {
    const w = big ? 9 : 7, h = big ? 11 : 9;
    return region('barrel', x0, y0, w, h, (lx, ly) => {
      if ((lx === 0 || lx === w - 1) && (ly === 0 || ly === h - 1)) return 0;
      if (ly === 2 || ly === h - 3) return P32['0'];
      if (ly >= 4 && ly <= h - 5) return ((lx + ly) >> 1) & 1 ? P32.y : P32['0'];
      return lx === 1 ? P32.e : lx === w - 2 ? P32.R : P32.e;
    }, MT().METAL, { big });
  }
  function safe(x0, y0) {
    const w = 15, h = 13;
    return region('safe', x0, y0, w, h, (lx, ly) => {
      if (lx === 0 || ly === 0 || lx === w - 1 || ly === h - 1) return P32['1'];
      const d = Math.hypot(lx - 7, ly - 6);
      if (d < 2.2) return P32.y; if (d < 3.4) return P32['5'];
      if (lx === 12 && ly > 3 && ly < 9) return P32['6'];
      return ly === 1 ? P32['4'] : P32['3'];
    }, MT().METAL);
  }
  function piggy(x0, y0) {
    const rows = ['...kk.kk....', '..kKKKKKKk..', '.kKK0KKKKKk.', 'kKKKKKKKKKKk', 'kKKKKKKKKKKk', '.kKKKKKKKKk.', '..kk...kk...'];
    return region('piggy', x0, y0, 12, 7, (lx, ly) => { const ch = rows[ly][lx]; return ch === '.' ? 0 : P32[ch]; }, MT().PLASTIC);
  }
  function slider(x0, y0, w, kind) {
    const s = { v: 0.15, v0: 0.15, kind, col: kind === 'volume' ? P32.l : P32.y, bg: P32['2'] };
    const p = region('slider', x0, y0, w, 5, () => P32['2'], MT().PLASTIC, { slider: s });
    WTP.props.drawSlider(p);
    return p;
  }
  function tower(side, sc, style, R, ents) {
    const W = Wd();
    const MW = W.MX;
    if (MW < 8) return;
    const x0 = side < 0 ? 1 : W.w - MW + 1, x1 = side < 0 ? MW - 2 : W.w - 2;
    const topY = 10 + R.int(0, 6);
    const bottom = W.h - 4;
    const pw = style === 'stone' ? 3 : 2;
    post(x0, topY, bottom, sc, style, pw);
    post(x1 - pw + 1, topY + 8, bottom, sc, style, pw);
    let y = topY;
    let k = 0;
    while (y < bottom - 20) {
      const into = (k % 3 === 1) ? R.int(6, 16) : 0;
      const px0 = side < 0 ? x0 : x0 - into, pw2 = (x1 - x0 + 1) + into;
      platform(px0, y, pw2, sc, style);
      if (into) { const bx = side < 0 ? x1 + into : x0 - into; bolt(bx, y + 1); }
      if (style === 'girder' && k % 2 === 0) for (let d = 0; d < Math.min(8, x1 - x0 - 2); d++) put(side < 0 ? x0 + pw + d : x1 - pw - d, y + 4 + d, sc.lo, sc.m);
      const roll = R();
      if (k > 0 && (k % 2 === 0 || roll > 0.8)) WTP.scenery.sideDecor({ W, R, th: L.theme || THEMES.own, ents, PX0: W.PX0, PX1: W.PX1, top: W.top, H: bottom, textPixels, crate, barrel, safe, piggy, platform: () => 0, region: () => null, secret: () => 0, spawn: () => 0 }, px0 + 1, px0 + pw2 - 2, y);
      if (k > 0 && roll < 0.22) ents.push({ t: 'spring', x: (x0 + x1) / 2, y: y - 1 });
      else if (k > 1 && roll < 0.36) ents.push({ t: 'fan', x: side < 0 ? x1 - 3 : x0 + 3, y: y - 8, o: { reach: 70 }, dir: -side });
      else if (k > 0 && roll < 0.5) { barrel(Math.round((x0 + x1) / 2) - 3, y - 9, false); }
      else if (k > 0 && roll < 0.62) crate(Math.round((x0 + x1) / 2) - 4, y - 9, 9);
      else if (k > 0 && roll < 0.72) ents.push({ t: 'wire', x: (x0 + x1) / 2, y: y + 4, o: { len: R.int(16, 26) } });
      else if (k > 0 && roll < 0.8) ents.push({ t: 'shards', x: (x0 + x1) / 2, y: y, w: Math.min(12, x1 - x0 - 2) });
      y += R.int(30, 40);
      k++;
    }
  }
  function nook(x0, y0, sc, style, ents, idx) {
    const w = 15, h = 13;
    for (let ly = 0; ly < h; ly++) for (let lx = 0; lx < w; lx++) {
      const wall = lx < 2 || lx > w - 3 || ly < 2 || ly > h - 3;
      put(x0 + lx, y0 + ly, wall ? (ly < 2 ? sc.hi : sc.mid) : (ly > h - 5 ? sc.lo : sc.dark), wall ? sc.m : MT().PAPER);
    }
    ents.push({ t: 'secret', x: x0 + w / 2, y: y0 + h / 2, o: { idx } });
  }
  function findSolidSpot(R, x0, x1, y0, y1, tries = 400) {
    const W = Wd();
    for (let t = 0; t < tries; t++) {
      const x = R.int(x0, x1), y = R.int(y0, y1);
      let ok = 0;
      for (let dy = -4; dy <= 4; dy += 2) for (let dx = -4; dx <= 4; dx += 2) if (W.frontAt(x + dx, y + dy)) ok++;
      if (ok >= 23) return [x, y];
    }
    return null;
  }
  function findAirSpot(R, x0, x1, y0, y1, w, h, tries = 300) {
    const W = Wd();
    for (let t = 0; t < tries; t++) {
      const x = R.int(x0, x1 - w), y = R.int(y0, y1 - h);
      let clear = true;
      for (let dy = -2; dy < h + 2 && clear; dy += 2) for (let dx = -2; dx < w + 2; dx += 2) if (W.solid(x + dx, y + dy)) { clear = false; break; }
      if (clear) return [x, y];
    }
    return null;
  }

  L.apply = (page) => {
    const W = Wd();
    const th = THEMES[page.id] || THEMES.own;
    const R = rng(strSeed(`wtp-level-${page.id}`));
    const sc = styleCols(th.style, th.tint);
    const ents = [];
    L.theme = th;
    textCache = new Map();
    tower(-1, sc, th.style, R, ents);
    tower(1, sc, th.style, R, ents);
    const PX0 = W.PX0, PX1 = W.PX1, pw = PX1 - PX0;
    const top = W.top, H = (W.bottom || W.h - 3) - 1;
    L.spawn = { x: Math.round(PX0 + pw / 2), y: top - 16 };
    const skit = {
      W, R, th, ents, PX0, PX1, top, H, textPixels,
      platform: (x, y, w, style, fl = F_NOGLUE) => platform(x, y, w, styleCols(style, th.tint), style, fl),
      crate, barrel, safe, piggy,
      region: (t, x0, y0, w, h, painter, m, o) => region(t, x0, y0, w, h, (lx, ly) => C(painter(lx, ly)), m, o),
      secret: (x, y) => ents.push({ t: 'secret', x: x + 0.5, y: y + 0.5, o: { idx: 4 } }),
      spawn: (x, y) => { L.spawn = { x: Math.round(x), y: Math.round(y) - 16 }; }
    };
    WTP.scenery.sky(skit);
    WTP.scenery.basement(skit);
    for (let k = 0; k < 3; k++) {
      const yy = Math.round(top + (H - top) * (0.18 + k * 0.27 + R() * 0.08));
      const spot = findAirSpot(R, PX0 + 8, PX1 - 8, yy - 30, yy + 30, 34, 10);
      if (spot) {
        const [x, y] = spot;
        const w = R.int(22, 34);
        platform(x, y + 6, w, sc, th.style === 'cloud' ? 'cloud' : th.style, 0);
        const roll = R();
        if (roll < 0.35) barrel(x + 2, y - 3, false);
        else if (roll < 0.6) crate(x + w - 11, y - 3, 9);
        else if (roll < 0.8) ents.push({ t: 'spring', x: x + w / 2, y: y + 5 });
      }
    }
    for (let k = 0; k < 3; k++) {
      const yy = Math.round(top + (H - top) * (0.15 + k * 0.3));
      const spot = findSolidSpot(R, PX0 + 6, PX1 - 6, yy, Math.min(H - 8, yy + Math.round((H - top) * 0.25)));
      if (spot) ents.push({ t: 'secret', x: spot[0] + 0.5, y: spot[1] + 0.5, o: { idx: k } });
      else if (W.MX >= 16) nook(k & 1 ? W.w - W.MX + 1 : 0, yy, sc, th.style, ents, k);
    }
    if (W.MX >= 16) nook(R() < 0.5 ? 0 : W.w - W.MX + 1, Math.round(H * 0.82), sc, th.style, ents, 3);
    const extra = KITS[page.id];
    if (extra) extra({ W, R, sc, th, ents, PX0, PX1, top, H, put, platform, crate, barrel, safe, piggy, slider, sign, chain, bolt, findAirSpot, findSolidSpot });
    L.ents = ents;
    L.theme = th;
    return ents;
  };
  L.textPixels = (t, c) => textPixels(t, c);
  L.spawnEnts = () => { WTP.props.resetEnts(L.ents || []); };

  const KITS = {
    bank(k) { for (let i = 0; i < 3; i++) { const s = k.findAirSpot(k.R, k.PX0 + 4, k.PX1 - 4, k.top + 40 + i * 120, k.top + 160 + i * 120, 18, 16); if (s) { k.platform(s[0] - 2, s[1] + 14, 20, k.sc, 'girder', 0); if (i === 1) k.piggy(s[0] + 2, s[1] + 7); else k.safe(s[0] + 1, s[1] + 1); } } },
    shop(k) { for (let i = 0; i < 2; i++) { const s = k.findAirSpot(k.R, k.PX0 + 4, k.PX1 - 4, k.top + 60 + i * 200, k.top + 200 + i * 200, 30, 14); if (s) { k.platform(s[0], s[1] + 12, 30, k.sc, 'girder', 0); k.crate(s[0] + 2, s[1] + 3, 9); k.crate(s[0] + 12, s[1] + 3, 9); k.barrel(s[0] + 22, s[1] + 3, false); } } },
    music(k) { const s = k.findAirSpot(k.R, k.PX0 + 4, k.PX1 - 4, k.top + 40, k.top + 300, 44, 10); if (s) { k.platform(s[0], s[1] + 7, 44, k.sc, 'server', 0); k.slider(s[0] + 4, s[1] + 1, 36, 'volume'); } },
    weather(k) { const s = k.findAirSpot(k.R, k.PX0 + 4, k.PX1 - 4, k.top + 40, k.top + 300, 44, 10); if (s) { k.platform(s[0], s[1] + 7, 44, k.sc, 'cloud', 0); k.slider(s[0] + 4, s[1] + 1, 36, 'bright'); } k.ents.push({ t: 'fan', x: k.PX0 + 6, y: k.top + 20, dir: 1, o: { reach: 110 } }); },
    retro(k) { for (let i = 0; i < 4; i++) k.ents.push({ t: 'spring', x: k.PX0 + 20 + i * ((k.PX1 - k.PX0 - 40) / 3), y: k.top - 1 }); },
    lost(k) { for (let i = 0; i < 4; i++) { const s = k.findAirSpot(k.R, k.PX0 + 4, k.PX1 - 4, k.top + 20, k.H - 40, 16, 8); if (s) { k.platform(s[0], s[1] + 6, 16, k.sc, 'girder', 0); k.ents.push({ t: 'wire', x: s[0] + 8, y: s[1] + 10, o: { len: 18 } }); } } },
    status(k) { for (let i = 0; i < 3; i++) k.ents.push({ t: 'wire', x: k.PX0 + 30 + i * 60, y: k.top + 2, o: { len: 22 + i * 6 } }); },
    arcade(k) { for (let i = 0; i < 3; i++) k.ents.push({ t: 'spring', x: k.PX0 + 30 + i * 70, y: k.top - 1 }); },
    launch(k) { for (let i = 0; i < 3; i++) { const s = k.findAirSpot(k.R, k.PX0 + 4, k.PX1 - 4, k.top + 60, k.H - 60, 9, 12); if (s) k.barrel(s[0], s[1], true); } },
    museum(k) { for (let i = 0; i < 2; i++) { const s = k.findAirSpot(k.R, k.PX0 + 4, k.PX1 - 4, k.top + 60 + i * 150, k.top + 220 + i * 150, 20, 12); if (s) k.ents.push({ t: 'shards', x: s[0] + 10, y: s[1] + 10, w: 14 }); } },
    cars(k) { const s = k.findAirSpot(k.R, k.PX0 + 4, k.PX1 - 4, k.top + 40, k.top + 200, 36, 10); if (s) { k.platform(s[0], s[1] + 8, 36, k.sc, 'girder', 0); k.barrel(s[0] + 4, s[1] - 1, false); k.barrel(s[0] + 14, s[1] - 1, false); k.barrel(s[0] + 24, s[1] - 1, false); } }
  };

  const ICONS = {
    folder: ['..aaa.....', '.aYYYa....', 'aaaaaaaaaa', 'ayyyyyyyya', 'ayyyyyyyya', 'ayyyyyyyya', 'aaaaaaaaaa'],
    trash: ['..4444..', '.666666.', '..5555..', '..5454..', '..5454..', '..5454..', '..5555..'],
    pc: ['5555555.', '5cccccc5', '5cCccCc5', '5cccccc5', '5555555.', '...44...', '.666666.'],
    doc: ['77777...', '7666677.', '7444467.', '7666667.', '7444667.', '7666667.', '7777777.'],
    pic: ['7777777.', '7CCCyC7.', '7CCCCC7.', '7lCCCl7.', '7lllll7.', '7GlGlG7.', '7777777.'],
    note: ['...kkk..', '...k.k..', '...k.k..', '.kkk.k..', 'kkkk.k..', 'kkkkkk..', '.kk.....'],
    exe: ['eeeeeee.', 'e77777e.', 'e7e7e7e.', 'e77777e.', 'e7eee7e.', 'e77777e.', 'eeeeeee.']
  };
  const LABELS = [['folder', 'My Pages'], ['trash', 'Trash'], ['pc', 'This PC'], ['doc', 'homework_v3'], ['pic', 'cat.png'], ['exe', 'Wreck.exe'], ['folder', 'memes'], ['doc', 'secret.txt'], ['note', 'bangers.mp3'], ['folder', 'taxes 2026'], ['doc', 'DO NOT OPEN'], ['pic', 'vacation1'], ['exe', 'setup(1).exe'], ['folder', 'backup old'], ['doc', 'todo.txt'], ['note', 'ringtone']];
  function dith(x, y, t) { return WTP.sprites.dith(x, y, t); }
  L.buildDesktop = (page, vw, vh) => {
    const W = Wd();
    const th = THEMES[page.id] || THEMES.own;
    const OFF = Math.ceil(vw) + 20;
    const DW = W.w + 120 + OFF * 2, DH = Math.ceil(W.h * 0.55) + Math.max(560, Math.ceil(vh) + 160);
    const cv = document.createElement('canvas');
    cv.width = DW; cv.height = DH;
    const g = cv.getContext('2d', { willReadFrequently: true });
    const im = g.createImageData(DW, DH);
    const px = new Uint32Array(im.data.buffer);
    const c1 = P32[th.sky[0]], c2 = P32[th.sky[1]];
    const R = rng(strSeed(`desk-${page.id}`));
    for (let y = 0; y < DH; y++) {
      const t = y / DH;
      const band = Math.floor(t * 10) / 10;
      for (let x = 0; x < DW; x++) px[y * DW + x] = dith(x, y, (t * 10) % 1) ? mix(c1, c2, Math.min(1, band + 0.1)) : mix(c1, c2, band);
    }
    const set = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < DW && y < DH) px[y * DW + x] = c; };
    const motif = th.motif;
    if (motif === 'stars' || motif === 'grid' || motif === 'city') for (let k = 0; k < DW * DH / 220; k++) { const x = R.int(0, DW - 1), y = R.int(0, DH - 1); set(x, y, R() < 0.2 ? P32['7'] : shade(P32['6'], 0.7)); if (R() < 0.05) { set(x + 1, y, P32['6']); set(x - 1, y, P32['6']); set(x, y + 1, P32['6']); set(x, y - 1, P32['6']); } }
    for (let band = 0; band < DH; band += 360) {
      const base = band + 300;
      if (motif === 'hills') {
        for (let layer = 0; layer < 3; layer++) {
          const col = shade(mix(c2, P32.G, 0.5 + layer * 0.15), 0.9 - layer * 0.18);
          for (let x = 0; x < DW; x++) { const hgt = 40 + layer * 18 + Math.sin(x * 0.02 + layer * 2 + band) * (22 - layer * 4) + Math.sin(x * 0.053 + layer) * 8; for (let y = Math.round(base - hgt); y < base + 60; y++) set(x, y, (layer === 2 && dith(x, y, 0.15)) ? shade(col, 1.15) : col); }
        }
        const sx = R.int(30, DW - 30), sy = base - 140;
        for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) if (x * x + y * y < 100) set(sx + x, sy + y, x * x + y * y < 49 ? P32.Y : P32.y);
      } else if (motif === 'waves') {
        for (let layer = 0; layer < 4; layer++) { const col = shade(mix(c2, P32.c, 0.5), 1.15 - layer * 0.12); for (let x = 0; x < DW; x++) { const yy = base - 70 + layer * 22 + Math.round(Math.sin(x * 0.06 + layer * 1.7) * 5); for (let y = yy; y < yy + 22; y++) set(x, y, y === yy ? P32['7'] : col); } }
      } else if (motif === 'grid') {
        const hz = base - 80;
        const sx = DW / 2;
        for (let y = -34; y <= 0; y++) for (let x = -34; x <= 34; x++) if (x * x + y * y < 34 * 34 && !((y + 40) % 7 < 2 && y > -20)) set(sx + x, hz + y, mix(P32.y, P32.k, (y + 34) / 34));
        for (let y = hz; y < hz + 120; y++) for (let x = 0; x < DW; x++) set(x, y, P32['0']);
        for (let k = 0; k < 14; k++) { const yy = hz + Math.round(Math.pow(k / 14, 2) * 120); for (let x = 0; x < DW; x++) set(x, yy, P32.k); }
        for (let k = -20; k <= 20; k++) for (let y = hz; y < hz + 120; y++) set(sx + k * 8 + (k * 8) * ((y - hz) / 40), y, P32.m);
      } else if (motif === 'clouds') {
        for (let k = 0; k < 7; k++) { const cx = R.int(0, DW), cy = band + R.int(20, 320), r = R.int(10, 22); for (let b = 0; b < 5; b++) { const bx = cx + (b - 2) * r * 0.8, by = cy + (b & 1 ? -r * 0.35 : 0), rr = r * (b === 2 ? 1 : 0.75); for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) if (x * x + y * y < rr * rr) set(bx + x, by + y, y > rr * 0.3 ? P32['6'] : P32['7']); } }
      } else if (motif === 'city') {
        let x = 0;
        while (x < DW) { const bw = R.int(14, 34), bh = R.int(60, 190); const col = shade(c1, 0.75 + R() * 0.2); for (let yy = base - bh; yy < base + 60; yy++) for (let xx = x; xx < x + bw; xx++) set(xx, yy, ((xx - x) % 5 === 2 && (yy - base) % 6 === 0 && R() < 0.6) ? (R() < 0.5 ? P32.y : P32.Y) : col); x += bw + R.int(1, 5); }
      } else if (motif === 'dots') {
        for (let y = band; y < band + 360; y += 12) for (let x = (y / 12) & 1 ? 6 : 0; x < DW; x += 12) for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) if (a * a + b * b < 6) set(x + a, y + b, shade(c2, 1.12, 8));
      }
    }
    const font = WTP.font;
    const iconAt = (x, y, k, label) => {
      const rows = ICONS[k];
      for (let ry = 0; ry < rows.length; ry++) for (let rx = 0; rx < rows[ry].length; rx++) { const ch = rows[ry][rx]; if (ch !== '.') { set(x + rx, y + ry, P32[ch]); set(x + rx + 1, y + ry + 1, (px[((y + ry + 1) * DW + x + rx + 1)] === P32[ch]) ? P32[ch] : P32['0']); } }
      return label;
    };
    g.putImageData(im, 0, 0);
    const labels = [];
    let li = R.int(0, LABELS.length - 1);
    const col = [OFF + 6, DW - OFF - 30];
    for (const cx of col) for (let y = 40; y < DH - 80; y += 46) { const [k, lab] = LABELS[li++ % LABELS.length]; labels.push([cx, y, k, lab]); }
    const im2 = g.getImageData(0, 0, DW, DH);
    const px2 = new Uint32Array(im2.data.buffer);
    for (const [x, y, k] of labels) {
      const rows = ICONS[k];
      for (let ry = 0; ry < rows.length; ry++) for (let rx = 0; rx < rows[ry].length; rx++) { const ch = rows[ry][rx]; if (ch === '.') continue; const i = (y + ry) * DW + x + rx + 1; if (i >= 0 && i < px2.length) { px2[i + DW + 1] = P32['0']; } }
      for (let ry = 0; ry < rows.length; ry++) for (let rx = 0; rx < rows[ry].length; rx++) { const ch = rows[ry][rx]; if (ch === '.') continue; const i = (y + ry) * DW + x + rx + 1; if (i >= 0 && i < px2.length) px2[i] = P32[ch]; }
    }
    g.putImageData(im2, 0, 0);
    g.imageSmoothingEnabled = false;
    for (const [x, y, , lab] of labels) { const short = lab.length > 10 ? lab.slice(0, 9) + '.' : lab; font.draw(g, short, x + 6, y + 10, { align: 'center', color: '7', outline: '0' }); }
    const behind = [['paint', 0.18], ['term', 0.42], ['sheet', 0.66], ['chat', 0.86]];
    for (const [kind, f] of behind) {
      const ww = Math.min(150, Math.round(W.w * 0.4)), hh = 90;
      const wx = OFF + Math.round(60 + R() * Math.max(10, W.w - ww - 20)), wy = Math.round(f * (DH - 200)) + 40;
      drawWin(g, kind, wx, wy, ww, hh, R);
    }
    g.fillStyle = PAL['1']; g.fillRect(0, DH - 14, DW, 14);
    g.fillStyle = PAL['3']; g.fillRect(0, DH - 14, DW, 1);
    g.fillStyle = PAL.l; g.fillRect(OFF + 3, DH - 11, 20, 8);
    font.draw(g, 'START', OFF + 13, DH - 10, { align: 'center', color: '0' });
    font.draw(g, '4:04 PM', DW - OFF - 6, DH - 10, { align: 'right', color: '7' });
    return { cv, w: DW, h: DH, off: OFF };
  };
  function drawWin(g, kind, x, y, w, h, R) {
    g.fillStyle = PAL['0']; g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = kind === 'term' ? PAL['0'] : PAL['7']; g.fillRect(x, y + 8, w, h - 8);
    g.fillStyle = kind === 'term' ? PAL['3'] : PAL.b; g.fillRect(x, y, w, 8);
    g.fillStyle = PAL.e; g.fillRect(x + w - 7, y + 2, 4, 4);
    const title = { paint: 'untitled - Paint', term: 'terminal', sheet: 'budget_FINAL.xls', chat: 'Chat with Mom' }[kind];
    WTP.font.draw(g, title, x + 3, y + 1, { color: '7' });
    if (kind === 'paint') {
      const cols = [PAL.e, PAL.y, PAL.l, PAL.c, PAL.k, PAL.P];
      for (let k = 0; k < 6; k++) { g.fillStyle = cols[k]; g.fillRect(x + 3, y + 11 + k * 7, 6, 6); }
      for (let k = 0; k < 40; k++) { g.fillStyle = cols[k % 6]; g.fillRect(x + 16 + Math.round(Math.sin(k * 0.4) * 20 + k * 2), y + 40 + Math.round(Math.cos(k * 0.3) * 20), 3, 3); }
      g.fillStyle = PAL.y; g.fillRect(x + w - 40, y + 20, 18, 18); g.fillStyle = PAL['0']; g.fillRect(x + w - 35, y + 26, 2, 2); g.fillRect(x + w - 29, y + 26, 2, 2); g.fillRect(x + w - 34, y + 32, 8, 1);
    } else if (kind === 'term') {
      const lines = ['$ rm -rf /internet', 'deleting... 12%', 'deleting... 47%', 'ERROR: page fought back', '$ sudo wreck', 'ok'];
      lines.forEach((l, i) => WTP.font.draw(g, l, x + 3, y + 11 + i * 9, { color: 'l' }));
    } else if (kind === 'sheet') {
      g.fillStyle = PAL['5'];
      for (let cx = x; cx < x + w; cx += 22) g.fillRect(cx, y + 8, 1, h - 8);
      for (let cy = y + 8; cy < y + h; cy += 8) g.fillRect(x, cy, w, 1);
      for (let r = 0; r < 9; r++) for (let c = 0; c < Math.floor(w / 22); c++) { g.fillStyle = (r + c) % 5 === 0 ? PAL.e : PAL['3']; g.fillRect(x + c * 22 + 3, y + 10 + r * 8, 4 + ((r * 7 + c * 3) % 12), 3); }
    } else {
      const msgs = [['l', 'are you eating'], ['r', 'busy wrecking'], ['l', 'wrecking what'], ['r', 'the internet'], ['l', 'ok dinner at 6']];
      msgs.forEach(([s, m], i) => { const tw = m.length * 4 + 6; const bx = s === 'l' ? x + 4 : x + w - tw - 4; g.fillStyle = s === 'l' ? PAL['6'] : PAL.c; g.fillRect(bx, y + 11 + i * 15, tw, 11); WTP.font.draw(g, m, bx + 3, y + 13 + i * 15, { color: '0' }); });
    }
  }
})();
