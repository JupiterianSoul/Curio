(() => {
  const $ = (id) => document.getElementById(id);
  const MODES = { auto: 'Surprise me', analogous: 'Analogous', complementary: 'Complementary', triadic: 'Triadic', split: 'Split', square: 'Square', mono: 'Monochrome', pastel: 'Pastel', warm: 'Warm', cool: 'Cool', earthy: 'Earthy', neon: 'Neon', retro: 'Retro', muted: 'Muted' };
  const saved = Curio.store.get('palette', {}) || {};
  const st = Object.assign({ v: 2, mode: 'auto', fmt: 'css', scene: 'app', colors: null, locks: null, count: 5 }, saved);
  if (!MODES[st.mode]) st.mode = 'auto';
  st.count = Math.max(3, Math.min(8, +st.count || 5));
  let favs = (Curio.store.get('palette-favs', []) || []).filter((f) => Array.isArray(f) && f.length >= 3 && f.every((c) => /^#[0-9a-f]{6}$/i.test(c)));
  const stats = Object.assign({ gen: 0, favs: 0, lib: 0, photos: 0, mmBest: 0, mmGames: 0, perfect: 0, vision: 0, exports: 0, daily: {} }, Curio.store.get('palette-stats', {}) || {});
  if (!stats.daily || typeof stats.daily !== 'object') stats.daily = {};
  let badges = Curio.store.get('palette-badges', []) || [];
  const history = [];

  const hex2rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const rgb2hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  function hsl2rgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    return [f(0) * 255, f(8) * 255, f(4) * 255];
  }
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
    if (mx === mn) return [0, 0, l];
    const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
  }
  const hsl = (h, s, l) => rgb2hex(...hsl2rgb(h, s, l));
  const toHsl = (hex) => rgb2hsl(...hex2rgb(hex));
  function lum(hex) { return hex2rgb(hex).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [.2126, .7152, .0722][i], 0); }
  const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
  const inkOn = (hex) => contrast(hex, '#111111') >= contrast(hex, '#ffffff') ? '#111111' : '#ffffff';
  function lab(hex) {
    const [r, g, b] = hex2rgb(hex).map((v) => { v /= 255; return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); });
    const x = (r * .4124 + g * .3576 + b * .1805) / .95047, y = r * .2126 + g * .7152 + b * .0722, z = (r * .0193 + g * .1192 + b * .9505) / 1.08883;
    const f = (t) => t > .008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  }
  const deltaE = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

  const HUES = [[8, 'Red'], [18, 'Vermilion'], [32, 'Orange'], [44, 'Amber'], [58, 'Yellow'], [75, 'Chartreuse'], [100, 'Lime'], [140, 'Green'], [162, 'Mint'], [178, 'Teal'], [192, 'Cyan'], [205, 'Sky'], [225, 'Blue'], [245, 'Indigo'], [265, 'Violet'], [285, 'Purple'], [305, 'Orchid'], [325, 'Magenta'], [342, 'Pink'], [352, 'Rose'], [361, 'Red']];
  function colorName(hex) {
    const [h, s, l] = toHsl(hex);
    if (s < .12 || (l > .96) || l < .06) {
      if (l < .1) return 'Ink Black'; if (l < .25) return 'Charcoal'; if (l < .45) return 'Slate'; if (l < .65) return 'Pewter'; if (l < .85) return 'Silver'; if (l < .96) return 'Fog'; return 'Snow';
    }
    let name = HUES.find(([lim]) => h < lim)[1];
    if (name === 'Orange' && l < .38) name = 'Brown';
    if (name === 'Amber' && l < .4) name = 'Bronze';
    if (name === 'Yellow' && l < .35) name = 'Olive';
    const adj = l < .2 ? 'Midnight' : l < .32 ? 'Deep' : l > .9 ? 'Whisper' : l > .78 ? 'Pale' : s < .3 ? 'Dusty' : s < .5 ? (l > .6 ? 'Soft' : 'Muted') : s > .82 && l > .4 && l < .65 ? 'Electric' : l > .62 ? 'Light' : '';
    return (adj ? adj + ' ' : '') + name;
  }

  const R = (a, b) => a + Math.random() * (b - a);
  const BADGES = [
    { id: 'gen50', icon: '🎨', name: 'Mixer', d: 'Make 50 palettes' },
    { id: 'gen500', icon: '🌈', name: 'Rainbow addict', d: 'Make 500 palettes' },
    { id: 'fav', icon: '❤️', name: 'Smitten', d: 'Save a favourite' },
    { id: 'fav10', icon: '💐', name: 'Collector', d: 'Keep 10 favourites' },
    { id: 'photo', icon: '📷', name: 'Colour thief', d: 'Pull a palette from a photo' },
    { id: 'lib', icon: '📚', name: 'Browser', d: 'Load 5 library palettes' },
    { id: 'vision', icon: '👁️', name: 'Empath', d: 'Try a colour vision simulation' },
    { id: 'eight', icon: '🎹', name: 'Octave', d: 'Make an 8 colour palette' },
    { id: 'mm', icon: '🧪', name: 'Lab rat', d: 'Finish a Mix Master game' },
    { id: 'mm90', icon: '🎯', name: 'Eagle eye', d: 'Score 95+ on one colour' },
    { id: 'mm400', icon: '🏆', name: 'Colour sommelier', d: 'Score 400+ in Mix Master' },
    { id: 'daily', icon: '📅', name: 'Daily dabbler', d: 'Play the daily Mix Master' },
    { id: 'export', icon: '📦', name: 'Shipped it', d: 'Copy or save an export' }
  ];
  function badge(id) {
    if (badges.includes(id)) return;
    badges.push(id); Curio.store.set('palette-badges', badges);
    const b = BADGES.find((x) => x.id === id);
    if (b) { Curio.toast(`${b.icon} Badge: ${b.name}`, 2400); [784, 988, 1318].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .06), i * 80)); }
    renderBadges();
  }
  function bump(k, n = 1) { stats[k] = (stats[k] || 0) + n; Curio.store.set('palette-stats', stats); }

  function hueFor(mode, h, i, n, sp) {
    switch (mode) {
      case 'analogous': return h + (i - (n - 1) / 2) * sp;
      case 'complementary': return i % 2 ? h + 180 + R(-12, 12) : h + R(-10, 10);
      case 'triadic': return h + (i % 3) * 120 + R(-6, 6);
      case 'split': return h + [0, 150, 210][i % 3];
      case 'square': return h + (i % 4) * 90;
      case 'mono': return h;
      case 'pastel': return h + i * 360 / n;
      case 'warm': return ((R(-25, 55) + 360) % 360);
      case 'cool': return R(165, 275);
      case 'earthy': return R(15, 95);
      case 'neon': return h + i * 360 / n + R(-20, 20);
      case 'retro': return Curio.pick([8, 28, 42, 170, 188, 350]) + R(-8, 8);
      case 'muted': return h + (i - (n - 1) / 2) * sp * 1.6;
      default: return h;
    }
  }
  function generate(mode) {
    const n = st.count;
    if (mode === 'auto') mode = Curio.pick(['analogous', 'complementary', 'triadic', 'split', 'square', 'mono', 'pastel', 'warm', 'cool', 'earthy', 'retro', 'muted', 'analogous']);
    const prev = st.colors || [];
    const locked = prev.filter((_, i) => st.locks && st.locks[i]);
    const h = locked.length ? toHsl(locked[0])[0] + (mode === 'mono' ? 0 : R(-10, 10)) : R(0, 360);
    const sp = R(14, 28);
    const s0 = { pastel: R(.45, .75), earthy: R(.22, .45), neon: 1, retro: R(.45, .65), muted: R(.15, .32) }[mode] ?? R(.45, .85);
    const ls = [];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? .5 : i / (n - 1);
      if (mode === 'pastel') ls.push(i === 0 ? R(.2, .28) : .7 + t * .24 + R(-.02, .02));
      else if (mode === 'neon') ls.push(i === 0 ? R(.06, .1) : R(.5, .62));
      else ls.push(.15 + t * .76 + R(-.04, .04));
    }
    const order = mode === 'mono' || mode === 'analogous' || mode === 'muted' ? ls.map((_, i) => i) : Curio.shuffle(ls.map((_, i) => i));
    const fresh = [];
    for (let i = 0; i < n; i++) {
      const l = Math.max(.04, Math.min(.97, ls[order[i]]));
      const s = mode === 'mono' ? Math.min(.95, s0 * R(.6, 1.1)) : mode === 'neon' ? (l < .2 ? .4 : 1) : Math.min(.95, s0 * R(.85, 1.1) * (l > .85 || l < .2 ? .75 : 1));
      fresh.push(hsl(hueFor(mode, h, i, n, sp), s, l));
    }
    fresh.sort((a, b) => lum(a) - lum(b));
    const out = []; let k = 0;
    for (let i = 0; i < n; i++) out.push(prev[i] && st.locks && st.locks[i] ? prev[i] : fresh[k++]);
    return out;
  }
  function chord() {
    if (Curio.muted) return;
    const scale = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];
    st.colors.forEach((c, i) => { if (st.locks[i]) return; const [hh] = toHsl(c); setTimeout(() => Curio.beep(scale[Math.floor(hh / 360 * scale.length) % scale.length], .09, 'triangle', .05), i * 45); });
  }
  function pushHistory() { if (st.colors) { history.push({ c: st.colors.slice(), l: st.locks.slice() }); if (history.length > 60) history.shift(); } }
  function newPalette(sound = true) {
    pushHistory();
    st.colors = generate(st.mode);
    renderAll(true);
    if (sound) chord();
    bump('gen');
    if (stats.gen >= 50) badge('gen50');
    if (stats.gen >= 500) badge('gen500');
  }
  function setColors(cs, sound) {
    pushHistory();
    st.count = cs.length; st.colors = cs.slice(); st.locks = cs.map(() => false);
    renderAll(true);
    if (sound) chord();
  }
  function back() {
    if (!history.length) return;
    const h = history.pop(); st.colors = h.c; st.locks = h.l; st.count = h.c.length; renderAll(true); Curio.beep(330, .06, 'triangle', .06);
  }
  function setCount(n) {
    n = Math.max(3, Math.min(8, n));
    if (n === st.count) return;
    pushHistory();
    if (n < st.count) { st.colors = st.colors.slice(0, n); st.locks = st.locks.slice(0, n); }
    else {
      while (st.colors.length < n) { st.colors.push('#000000'); st.locks.push(false); }
    }
    st.count = n;
    st.colors = generate(st.mode);
    renderAll(true); chord();
    if (n === 8) badge('eight');
  }

  function renderStrip(anim) {
    const strip = $('strip'); strip.innerHTML = '';
    strip.style.setProperty('--n', st.count);
    $('con').style.setProperty('--n', st.count);
    $('count').textContent = `${st.count} colours`;
    $('less').disabled = st.count <= 3; $('more').disabled = st.count >= 8;
    const narrow = st.count >= 7;
    st.colors.forEach((c, i) => {
      const ink = inkOn(c), [r, g, b] = hex2rgb(c), [h, s, l] = rgb2hsl(r, g, b);
      const sw = document.createElement('div'); sw.className = 'pm-sw' + (anim && !st.locks[i] ? ' new' : '') + (st.locks[i] ? ' locked' : '');
      sw.style.background = c; sw.style.color = ink; sw.style.animationDelay = (i * 40) + 'ms';
      sw.innerHTML = `<div class="pm-tools">
          <button class="pm-tool" type="button" data-lock aria-pressed="${st.locks[i]}" aria-label="${st.locks[i] ? 'Unlock' : 'Lock'} colour ${i + 1}">${st.locks[i] ? '🔒' : '🔓'}</button>
          <span class="pm-tool" title="Edit colour">🎚️<input type="color" value="${c}" aria-label="Edit colour ${i + 1}"></span>
          ${narrow ? '' : `<button class="pm-tool" type="button" data-copy aria-label="Copy ${c}">📋</button>`}
        </div>
        <div class="pm-info"><button class="pm-hex" type="button" data-copy>${c.slice(1).toUpperCase()}</button>
        <div class="pm-cname">${colorName(c)}</div></div>
        <div class="pm-vals">rgb(${r}, ${g}, ${b})<br>hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)</div>`;
      sw.querySelector('[data-lock]').addEventListener('click', () => toggleLock(i));
      sw.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', () => copy(c.toUpperCase(), `${c.toUpperCase()} copied`)));
      const inp = sw.querySelector('input');
      inp.addEventListener('input', () => { st.colors[i] = inp.value; sw.style.background = inp.value; sw.style.color = inkOn(inp.value); });
      inp.addEventListener('change', () => { st.locks[i] = true; renderAll(false); });
      strip.append(sw);
    });
    $('blobs').innerHTML = st.colors.map((c) => `<i style="background:${c}"></i>`).join('');
  }
  function toggleLock(i) {
    if (i >= st.count) return;
    st.locks[i] = !st.locks[i]; renderStrip(false); save();
    Curio.beep(st.locks[i] ? 880 : 440, .05, 'square', .05);
    if (navigator.vibrate) try { navigator.vibrate(8); } catch {}
  }

  function roles() {
    const by = st.colors.slice().sort((a, b) => lum(a) - lum(b));
    const sat = (c) => toHsl(c)[1];
    const mids = by.slice(1, -1).sort((a, b) => sat(b) - sat(a));
    while (mids.length < 3) mids.push(mids[mids.length - 1] || by[1] || by[0]);
    return { dark: by[0], light: by[by.length - 1], primary: mids[0], accent: mids[1], soft: mids[2], all: by };
  }
  const SCENES = { app: '📱 App', poster: '🖼️ Poster', landscape: '🏔️ Landscape', pattern: '🧶 Pattern', room: '🛋️ Room' };
  function sceneSvg(kind) {
    const r = roles(), cs = st.colors;
    const c = (i) => cs[i % cs.length];
    if (kind === 'poster') {
      return `<svg viewBox="0 0 400 260" role="img" aria-label="Poster preview"><rect width="400" height="260" fill="${r.light}"/><circle cx="290" cy="110" r="90" fill="${r.primary}"/><rect x="40" y="40" width="130" height="130" fill="${r.accent}" transform="rotate(-8 105 105)"/><path d="M0 260 L130 120 L260 260Z" fill="${r.dark}"/><circle cx="290" cy="110" r="44" fill="${r.soft}"/><rect x="200" y="196" width="170" height="14" rx="7" fill="${r.dark}"/><rect x="200" y="218" width="120" height="10" rx="5" fill="${r.accent}"/><text x="40" y="236" font-family="system-ui, sans-serif" font-weight="900" font-size="30" fill="${r.light}">FEST</text></svg>`;
    }
    if (kind === 'landscape') {
      return `<svg viewBox="0 0 400 260" role="img" aria-label="Landscape preview"><defs><linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${r.soft}"/><stop offset="1" stop-color="${r.light}"/></linearGradient></defs><rect width="400" height="260" fill="url(#skyG)"/><circle cx="300" cy="80" r="34" fill="${r.accent}"/><path d="M0 170 L80 90 L150 150 L230 70 L320 160 L400 110 L400 260 L0 260Z" fill="${r.primary}" opacity=".75"/><path d="M0 200 Q100 150 200 190 T400 180 L400 260 L0 260Z" fill="${r.dark}" opacity=".8"/><path d="M0 230 Q120 200 220 226 T400 220 L400 260 L0 260Z" fill="${r.dark}"/>${[40, 90, 340].map((x, i) => `<path d="M${x} ${232 - i * 4} l14 -40 l14 40Z" fill="${c(i + 1)}"/>`).join('')}<g fill="${r.light}" opacity=".85"><ellipse cx="90" cy="60" rx="34" ry="10"/><ellipse cx="160" cy="44" rx="24" ry="7"/></g></svg>`;
    }
    if (kind === 'pattern') {
      let s = `<svg viewBox="0 0 400 260" role="img" aria-label="Pattern preview"><rect width="400" height="260" fill="${r.light}"/>`;
      for (let y = 0; y < 5; y++) for (let x = 0; x < 8; x++) {
        const k = (x + y * 3) % cs.length, cx = x * 50 + 25, cy = y * 52 + 26;
        const t = (x + y) % 4;
        if (t === 0) s += `<circle cx="${cx}" cy="${cy}" r="18" fill="${cs[k]}"/>`;
        else if (t === 1) s += `<rect x="${cx - 16}" y="${cy - 16}" width="32" height="32" rx="6" fill="${cs[k]}" transform="rotate(45 ${cx} ${cy})"/>`;
        else if (t === 2) s += `<path d="M${cx - 20} ${cy + 16} L${cx} ${cy - 18} L${cx + 20} ${cy + 16}Z" fill="${cs[k]}"/>`;
        else s += `<path d="M${cx - 20} ${cy} q10 -16 20 0 t20 0" fill="none" stroke="${cs[k]}" stroke-width="7" stroke-linecap="round"/>`;
      }
      return s + '</svg>';
    }
    if (kind === 'room') {
      return `<svg viewBox="0 0 400 260" role="img" aria-label="Room preview"><rect width="400" height="200" fill="${r.light}"/><rect y="200" width="400" height="60" fill="${r.soft}"/><rect x="250" y="40" width="100" height="80" rx="4" fill="${r.accent}" stroke="${r.dark}" stroke-width="6"/><circle cx="300" cy="80" r="20" fill="${r.primary}"/><rect x="40" y="130" width="190" height="70" rx="20" fill="${r.primary}"/><rect x="30" y="110" width="40" height="90" rx="16" fill="${r.primary}"/><rect x="200" y="110" width="40" height="90" rx="16" fill="${r.primary}"/><rect x="70" y="120" width="56" height="40" rx="10" fill="${r.accent}"/><rect x="132" y="122" width="52" height="38" rx="10" fill="${r.soft}"/><rect x="50" y="200" width="10" height="20" fill="${r.dark}"/><rect x="210" y="200" width="10" height="20" fill="${r.dark}"/><rect x="300" y="150" width="14" height="70" fill="${r.dark}"/><path d="M280 150 L334 150 L322 110 L292 110Z" fill="${r.accent}"/><ellipse cx="160" cy="236" rx="120" ry="14" fill="${r.dark}" opacity=".2"/><path d="M352 200 q-4 -30 10 -50 q14 20 10 50Z" fill="${c(2)}"/><rect x="348" y="196" width="28" height="24" rx="4" fill="${r.dark}"/></svg>`;
    }
    return null;
  }
  function renderMocks() {
    $('scenes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === st.scene)));
    if (st.scene !== 'app') { $('mocks').innerHTML = `<div class="pm-scene">${sceneSvg(st.scene)}</div>`; return; }
    const r = roles();
    const mk = (bg, ink, surface, label) => `<div class="pm-mock" style="background:${bg};color:${ink}">
      <div class="mh"><span class="av" style="background:${r.primary}"></span><div><div class="tt">${label}</div><div class="st">3 new things today</div></div></div>
      <div class="bars">${[.5, .8, .35, 1, .65, .9].map((v, i) => `<i style="height:${v * 100}%;background:${[r.primary, r.accent, r.soft][i % 3]}"></i>`).join('')}</div>
      <p class="p">Snacks are ready, the playlist is long and nobody has to be anywhere.</p>
      <div class="chips"><span style="background:${r.accent};color:${inkOn(r.accent)}">fun</span><span style="background:${surface};color:${inkOn(surface)}">cozy</span><span style="background:${r.primary};color:${inkOn(r.primary)}">go</span></div>
      <div class="btns"><span style="background:${r.primary};color:${inkOn(r.primary)}">Let's go</span><span style="border:2px solid ${ink};">Later</span></div>
    </div>`;
    $('mocks').innerHTML = `<div class="pm-mocks">${mk(r.light, r.dark, r.soft, 'Weekend plans') + mk(r.dark, r.light, r.soft, 'Night mode')}</div>`;
  }
  function renderContrast() {
    const cs = st.colors; let html = '<div class="hd"></div>';
    cs.forEach((c) => { html += `<div class="hd"><i style="background:${c}" title="Background ${c}"></i></div>`; });
    cs.forEach((t) => {
      html += `<div class="hd"><i style="background:${t}" title="Text ${t}"></i></div>`;
      cs.forEach((b) => {
        if (t === b) { html += `<div style="background:var(--surface-2)"></div>`; return; }
        const cr = contrast(t, b), badgeT = cr >= 7 ? 'AAA' : cr >= 4.5 ? 'AA' : cr >= 3 ? 'Big' : '✗';
        html += `<div style="background:${b};color:${t}" title="${t} on ${b}: ${cr.toFixed(2)}:1"><span class="aa">Aa</span><span>${cr.toFixed(1)}</span><span class="badge${badgeT === '✗' ? ' no' : ''}">${badgeT}</span></div>`;
      });
    });
    $('con').innerHTML = html;
  }
  const FORMATS = { css: 'CSS', scss: 'SCSS', tailwind: 'Tailwind', json: 'JSON', gradient: 'Gradient', svg: 'SVG', list: 'Hex list' };
  function codeText() {
    const used = {};
    const names = st.colors.map((c) => { let n = colorName(c).toLowerCase().replace(/\s+/g, '-'); used[n] = (used[n] || 0) + 1; return used[n] > 1 ? `${n}-${used[n]}` : n; });
    const r = roles();
    if (st.fmt === 'css') return `:root {\n${st.colors.map((c, i) => `  --color-${i + 1}: ${c};`).join('\n')}\n\n  --bg: ${r.light};\n  --ink: ${r.dark};\n  --primary: ${r.primary};\n  --accent: ${r.accent};\n  --soft: ${r.soft};\n}`;
    if (st.fmt === 'scss') return st.colors.map((c, i) => `$${names[i]}: ${c};`).join('\n');
    if (st.fmt === 'tailwind') return `module.exports = {\n  theme: {\n    extend: {\n      colors: {\n${st.colors.map((c, i) => `        '${names[i]}': '${c}',`).join('\n')}\n      }\n    }\n  }\n};`;
    if (st.fmt === 'json') return JSON.stringify(Object.fromEntries(st.colors.map((c, i) => [names[i], c])), null, 2);
    if (st.fmt === 'gradient') return `background: linear-gradient(90deg, ${st.colors.map((c, i) => `${c} ${Math.round(i / (st.count - 1) * 100)}%`).join(', ')});`;
    if (st.fmt === 'svg') { const w = 100; return `<svg xmlns="http://www.w3.org/2000/svg" width="${w * st.count}" height="100">\n${st.colors.map((c, i) => `  <rect x="${i * w}" width="${w}" height="100" fill="${c}"/>`).join('\n')}\n</svg>`; }
    return st.colors.map((c) => c.toUpperCase()).join(', ');
  }
  function renderCode() {
    $('code').textContent = codeText();
    $('fmts').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === st.fmt)));
  }
  const key = (cs) => cs.join(',');
  function renderFavBtn() { const on = favs.some((f) => key(f) === key(st.colors)); $('fav').textContent = on ? '❤️' : '🤍'; $('fav').setAttribute('aria-pressed', String(on)); }
  function renderFavs() {
    const el = $('favs'); el.innerHTML = '';
    if (!favs.length) { el.innerHTML = '<p class="c-muted" style="margin:0;font-size:14px">Tap the heart (or press F) to keep a palette here.</p>'; return; }
    favs.forEach((f, i) => {
      const row = document.createElement('div'); row.className = 'pm-fav'; row.style.animationDelay = i * 25 + 'ms';
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Load palette ' + f.join(' '));
      b.innerHTML = f.map((c) => `<i style="background:${c}"></i>`).join('');
      b.addEventListener('click', () => { setColors(f); Curio.toast('Palette loaded'); });
      const x = document.createElement('button'); x.type = 'button'; x.className = 'x'; x.textContent = '✕'; x.setAttribute('aria-label', 'Remove favourite');
      x.addEventListener('click', () => { favs.splice(i, 1); Curio.store.set('palette-favs', favs); renderFavs(); renderFavBtn(); });
      row.append(b, x); el.append(row);
    });
  }
  function toggleFav() {
    const k = key(st.colors), idx = favs.findIndex((f) => key(f) === k);
    if (idx >= 0) { favs.splice(idx, 1); Curio.toast('Removed from favourites'); }
    else {
      favs.unshift(st.colors.slice()); favs = favs.slice(0, 60); Curio.toast('Saved to favourites ❤️');
      Curio.beep(784, .06, 'sine', .08); setTimeout(() => Curio.beep(1047, .1, 'sine', .08), 70);
      if (favs.length === 1 || favs.length % 10 === 0) Curio.confetti(70);
      badge('fav'); if (favs.length >= 10) badge('fav10');
    }
    Curio.store.set('palette-favs', favs); renderFavs(); renderFavBtn();
  }
  function save() { Curio.store.set('palette', st); }
  function renderAll(anim) {
    renderStrip(anim); renderMocks(); renderContrast(); renderCode(); renderFavBtn(); save();
    $('back').disabled = !history.length;
    try { window.history.replaceState(null, '', '#' + st.colors.map((c) => c.slice(1)).join('-')); } catch {}
  }

  async function copy(text, msg) {
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.append(ta); ta.select();
      try { ok = document.execCommand('copy'); } catch {} ta.remove();
    }
    Curio.toast(ok ? msg : 'Copy failed, select it by hand');
    if (ok) Curio.beep(990, .05, 'sine', .07);
    return ok;
  }

  function segButtons(el, obj, attr, onPick) {
    Object.entries(obj).forEach(([k, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.dataset[attr] = k;
      b.addEventListener('click', () => onPick(k));
      el.append(b);
    });
  }
  segButtons($('modes'), MODES, 'm', (k) => { st.mode = k; paintModes(); newPalette(); });
  function paintModes() { $('modes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === st.mode))); }
  segButtons($('fmts'), FORMATS, 'f', (k) => { st.fmt = k; save(); renderCode(); });
  segButtons($('scenes'), SCENES, 's', (k) => { st.scene = k; save(); renderMocks(); Curio.beep(600, .03, 'sine', .04); });
  $('gen').addEventListener('click', () => newPalette());
  $('back').addEventListener('click', back);
  $('fav').addEventListener('click', toggleFav);
  $('less').addEventListener('click', () => setCount(st.count - 1));
  $('more').addEventListener('click', () => setCount(st.count + 1));
  $('copyCode').addEventListener('click', async () => { if (await copy(codeText(), `${FORMATS[st.fmt]} copied 📋`)) badge('export'); });
  $('share').addEventListener('click', () => copy(location.href, 'Link copied, go show someone 🔗'));
  $('png').addEventListener('click', () => {
    const n = st.count, w = 200, c = document.createElement('canvas'); c.width = n * w; c.height = 560; const x = c.getContext('2d');
    st.colors.forEach((col, i) => {
      x.fillStyle = col; x.fillRect(i * w, 0, w, 560);
      x.fillStyle = inkOn(col); x.font = 'bold 28px ui-monospace, Menlo, monospace'; x.textAlign = 'center';
      x.fillText(col.toUpperCase(), i * w + w / 2, 480);
      x.font = '600 17px system-ui, sans-serif'; x.fillText(colorName(col), i * w + w / 2, 514);
    });
    c.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'curio-palette.png'; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); badge('export'); }, 'image/png');
  });
  $('vision').addEventListener('change', () => {
    const v = $('vision').value;
    $('visionWrap').style.filter = v ? `url(#cb-${v})` : 'none';
    if (v) { badge('vision'); Curio.toast('Approximate simulation, real vision varies'); }
  });

  $('img').addEventListener('change', () => {
    const f = $('img').files && $('img').files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const W = 120, H = Math.max(1, Math.round(img.height / img.width * W));
      const pc = $('imgc'); pc.width = W; pc.height = H;
      const g = pc.getContext('2d'); g.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      let data;
      try { data = g.getImageData(0, 0, W, H).data; } catch { Curio.toast('Could not read that image'); return; }
      const px = [];
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) px.push([data[i], data[i + 1], data[i + 2]]);
      if (px.length < 10) { Curio.toast('That image is too small or see-through'); return; }
      const cs = kmeans(px, st.count).map((p) => rgb2hex(...p)).sort((a, b) => lum(a) - lum(b));
      $('imgprev').classList.add('on');
      setColors(cs, true);
      bump('photos'); badge('photo');
      Curio.toast('Palette stolen from your photo 📷');
    };
    img.onerror = () => { URL.revokeObjectURL(url); Curio.toast('That file is not an image I can read'); };
    img.src = url;
    $('img').value = '';
  });
  function kmeans(px, k) {
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const cents = [px[Math.floor(Math.random() * px.length)].slice()];
    while (cents.length < k) {
      const dist = px.map((p) => Math.min(...cents.map((c) => d2(p, c))));
      const sum = dist.reduce((a, b) => a + b, 0);
      let r = Math.random() * sum, i = 0;
      while (i < px.length - 1 && (r -= dist[i]) > 0) i++;
      cents.push(px[i].slice());
    }
    for (let it = 0; it < 12; it++) {
      const acc = cents.map(() => [0, 0, 0, 0]);
      for (const p of px) {
        let best = 0, bd = Infinity;
        for (let j = 0; j < k; j++) { const d = d2(p, cents[j]); if (d < bd) { bd = d; best = j; } }
        const a = acc[best]; a[0] += p[0]; a[1] += p[1]; a[2] += p[2]; a[3]++;
      }
      acc.forEach((a, j) => { if (a[3]) cents[j] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
    }
    return cents;
  }

  const LIB = (window.PALETTE_LIBRARY || []).filter((p) => Array.isArray(p) && p[1].length === 5);
  function tagsOf(cs) {
    const hs = cs.map(toHsl);
    const avgS = hs.reduce((a, h) => a + h[1], 0) / hs.length;
    const avgL = hs.reduce((a, h) => a + h[2], 0) / hs.length;
    const warm = hs.filter((h) => h[1] > .2 && (h[0] < 70 || h[0] > 320)).length;
    const cool = hs.filter((h) => h[1] > .2 && h[0] > 150 && h[0] < 290).length;
    const t = [];
    if (warm >= 3) t.push('warm');
    if (cool >= 3) t.push('cool');
    if (avgL > .66) t.push('light');
    if (avgL < .42) t.push('dark');
    if (avgS > .62) t.push('vivid');
    if (avgS < .42) t.push('calm');
    return t;
  }
  const TAGS = { all: 'All', warm: 'Warm', cool: 'Cool', light: 'Light', dark: 'Dark', vivid: 'Vivid', calm: 'Calm' };
  let libTag = 'all';
  segButtons($('tags'), TAGS, 't', (k) => { libTag = k; renderLib(); });
  function renderLib() {
    $('tags').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.t === libTag)));
    const el = $('lib'); el.innerHTML = '';
    LIB.filter(([, cs]) => libTag === 'all' || tagsOf(cs).includes(libTag)).forEach(([name, cs], i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'pm-libi'; b.style.animationDelay = Math.min(i * 15, 400) + 'ms';
      b.innerHTML = `<div class="bar">${cs.map((c) => `<i style="background:${c}"></i>`).join('')}</div><b></b>`;
      b.querySelector('b').textContent = name;
      b.setAttribute('aria-label', 'Load ' + name);
      b.addEventListener('click', () => {
        setColors(cs, true); Curio.toast(`${name} loaded`);
        bump('lib'); if (stats.lib >= 5) badge('lib');
        $('strip').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      el.append(b);
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  function seeded(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
  let mm = null;
  function mmTargets(rand) { return Array.from({ length: 5 }, () => hsl(rand() * 360, .3 + rand() * .6, .25 + rand() * .55)); }
  function mmStart(mode) {
    const done = mode === 'daily' && stats.daily[today];
    const rand = mode === 'daily' ? seeded('mix-' + today) : Math.random;
    mm = { mode, targets: mmTargets(rand), idx: 0, scores: [], locked: false, over: false };
    if (done) { mm.scores = stats.daily[today].slice(); mm.idx = 5; mm.over = true; }
    document.querySelectorAll('.pm-nudge button').forEach((b) => b.addEventListener('click', (e) => {
    e.preventDefault();
    const el = $(b.dataset.n); if (el.disabled) return;
    const stp = b.dataset.n === 'sH' ? 3 : 1;
    el.value = String(Math.max(+el.min, Math.min(+el.max, +el.value + stp * +b.dataset.d)));
    el.dispatchEvent(new Event('input'));
  }));
  $('mmModes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)));
    mmRound();
  }
  function mmRound() {
    const over = mm.idx >= 5;
    $('pips').innerHTML = mm.targets.map((t, i) => {
      const sc = mm.scores[i];
      return `<i class="${i === mm.idx && !over ? 'cur' : ''}" style="${sc != null ? `background:${t}` : ''}">${sc != null ? sc : ''}</i>`;
    }).join('');
    if (over) {
      const total = mm.scores.reduce((a, b) => a + b, 0);
      $('dTarget').style.background = mm.targets[4];
      $('mmScore').innerHTML = `${total}<small>out of 500${mm.mode === 'daily' ? ' · come back tomorrow for a new set' : ''}</small>`;
      $('mmGo').textContent = mm.mode === 'daily' ? '📋 Share result' : '🔁 Play again';
      setSliders(false);
      return;
    }
    const t = mm.targets[mm.idx];
    $('dTarget').style.background = t;
    $('sH').value = Math.floor(Math.random() * 360); $('sS').value = 50; $('sL').value = 50;
    mm.locked = false; setSliders(true);
    $('mmScore').innerHTML = `<small>Colour ${mm.idx + 1} of 5</small>`;
    $('mmGo').textContent = '🔒 Lock in';
    mmPaint();
  }
  function setSliders(on) { ['sH', 'sS', 'sL'].forEach((id) => { $(id).disabled = !on; }); }
  function mixHex() { return hsl(+$('sH').value, +$('sS').value / 100, +$('sL').value / 100); }
  function mmPaint() {
    const h = +$('sH').value, s = +$('sS').value, l = +$('sL').value;
    $('vH').textContent = h + '°'; $('vS').textContent = s + '%'; $('vL').textContent = l + '%';
    $('dMine').style.background = mixHex();
    $('sH').style.background = `linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360].map((x) => hsl(x, s / 100, l / 100)).join(', ')})`;
    $('sS').style.background = `linear-gradient(90deg, ${hsl(h, 0, l / 100)}, ${hsl(h, 1, l / 100)})`;
    $('sL').style.background = `linear-gradient(90deg, #000, ${hsl(h, s / 100, .5)}, #fff)`;
  }
  ['sH', 'sS', 'sL'].forEach((id) => $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('mmGo').click(); } }));
  ['sH', 'sS', 'sL'].forEach((id) => $(id).addEventListener('input', () => { mmPaint(); if (Math.random() < .25) Curio.beep(300 + +$('sH').value, .02, 'sine', .02); }));
  $('mmModes').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => mmStart(b.dataset.m)));
  $('mmGo').addEventListener('click', async () => {
    if (mm.idx >= 5) {
      if (mm.mode === 'daily') {
        const sq = mm.scores.map((s) => (s >= 85 ? '🟩' : s >= 60 ? '🟨' : s >= 35 ? '🟧' : '🟥')).join('');
        const ok = await copy(`🧪 Zoble Mix Master ${today}: ${mm.scores.reduce((a, b) => a + b, 0)}/500\n${sq}`, 'Result copied 📋');
        if (!ok) Curio.toast('Copy failed');
      } else mmStart('practice');
      return;
    }
    if (mm.locked) { mm.idx++; mmRound(); return; }
    mm.locked = true; setSliders(false);
    const t = mm.targets[mm.idx], mine = mixHex();
    const dE = deltaE(t, mine);
    const sc = Math.round(100 * Math.exp(-dE / 22));
    mm.scores[mm.idx] = sc;
    const word = sc >= 95 ? 'Perfect twin!' : sc >= 85 ? 'Gorgeous' : sc >= 70 ? 'So close' : sc >= 50 ? 'Not bad' : sc >= 30 ? 'Hmm, cousins?' : 'Different planet';
    $('mmScore').innerHTML = `${sc}<small>${word} · target ${t.toUpperCase()} · yours ${mine.toUpperCase()}</small>`;
    $('mmScore').classList.remove('pop'); void $('mmScore').offsetWidth; $('mmScore').classList.add('pop');
    ['dTarget', 'dMine'].forEach((id) => { $(id).classList.remove('reveal'); void $(id).offsetWidth; $(id).classList.add('reveal'); });
    if (sc >= 85) { [660, 880, 1100].forEach((f, i) => setTimeout(() => Curio.beep(f, .1, 'triangle', .07), i * 70)); }
    else if (sc >= 50) Curio.beep(660, .12, 'triangle', .07);
    else Curio.beep(200, .2, 'sawtooth', .05);
    if (navigator.vibrate) try { navigator.vibrate(sc >= 85 ? [10, 30, 10] : 15); } catch {}
    if (sc >= 95) { badge('mm90'); bump('perfect'); }
    $('mmGo').textContent = mm.idx < 4 ? '➡️ Next colour' : '🏁 See total';
    $('pips').children[mm.idx].style.background = t; $('pips').children[mm.idx].textContent = sc;
    if (mm.idx === 4) {
      const total = mm.scores.reduce((a, b) => a + b, 0);
      bump('mmGames'); badge('mm');
      if (total > (stats.mmBest || 0)) { stats.mmBest = total; Curio.store.set('palette-stats', stats); }
      if (total >= 400) { badge('mm400'); Curio.confetti(120); }
      if (mm.mode === 'daily') { stats.daily[today] = mm.scores.slice(); Curio.store.set('palette-stats', stats); badge('daily'); }
      renderStats();
    }
  });

  function renderBadges() {
    const el = $('badges'); el.innerHTML = '';
    BADGES.forEach((b) => {
      const d = document.createElement('div'); d.className = 'pm-badge' + (badges.includes(b.id) ? ' got' : '');
      d.innerHTML = `<i aria-hidden="true">${b.icon}</i><div><b></b><span></span></div>`;
      d.querySelector('b').textContent = b.name; d.querySelector('span').textContent = b.d;
      el.append(d);
    });
    renderStats();
  }
  function renderStats() {
    $('stats').innerHTML = [[stats.gen, 'Palettes made'], [favs.length, 'Favourites'], [stats.mmBest || 0, 'Mix Master best'], [stats.mmGames || 0, 'Mix games'], [`${badges.length}/${BADGES.length}`, 'Badges']]
      .map(([v, l]) => `<div class="c-stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }

  addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select') || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.querySelector('.curio-modal')) return;
    if (e.key === ' ') { e.preventDefault(); newPalette(); }
    else if (e.key === 'z' || e.key === 'Z') back();
    else if (e.key === 'f' || e.key === 'F') toggleFav();
    else if (e.key === '+' || e.key === '=') setCount(st.count + 1);
    else if (e.key === '-' || e.key === '_') setCount(st.count - 1);
    else if (e.key === 'v' || e.key === 'V') { const s = $('vision'); s.selectedIndex = (s.selectedIndex + 1) % s.options.length; s.dispatchEvent(new Event('change')); }
    else if (/^[1-8]$/.test(e.key)) toggleLock(+e.key - 1);
  });

  const fromHash = location.hash.slice(1).split('-');
  if (fromHash.length >= 3 && fromHash.length <= 8 && fromHash.every((h) => /^[0-9a-f]{6}$/i.test(h))) { st.colors = fromHash.map((h) => '#' + h.toLowerCase()); st.count = st.colors.length; }
  if (!Array.isArray(st.colors) || st.colors.length !== st.count || !st.colors.every((c) => /^#[0-9a-f]{6}$/i.test(c))) { st.colors = null; st.locks = null; }
  if (!Array.isArray(st.locks) || st.locks.length !== st.count) st.locks = Array(st.count).fill(false);
  if (!st.colors) st.colors = generate(st.mode);
  if (!SCENES[st.scene]) st.scene = 'app';
  if (!FORMATS[st.fmt]) st.fmt = 'css';
  paintModes(); renderAll(true); renderFavs(); renderLib(); renderBadges();
  mmStart(stats.daily[today] ? 'practice' : 'daily');
})();
