(() => {
  const $ = (id) => document.getElementById(id);
  const { STYLES, render } = window.TEXTART_FONTS;
  const COLORS = [
    { id: 'ink', name: 'Plain ink', swatch: 'var(--ink)' },
    { id: 'sunset', name: 'Sunset', stops: ['#ff3d7f', '#ff7a3d', '#ffc23d'] },
    { id: 'ocean', name: 'Ocean', stops: ['#00c6ff', '#0072ff', '#7f5cff'] },
    { id: 'rainbow', name: 'Rainbow', stops: ['#ff4d4d', '#ffa64d', '#ffe14d', '#4dd96b', '#4db8ff', '#9a6bff'] },
    { id: 'candy', name: 'Candy', stops: ['#ff8ad8', '#b48cff', '#7fd8ff'], vertical: true },
    { id: 'forest', name: 'Forest', stops: ['#1f9d55', '#7ac74f', '#d5e94f'], vertical: true },
    { id: 'neon', name: 'Neon on black', solid: '#ff4ff2', glow: true, dark: true },
    { id: 'matrix', name: 'Terminal green', solid: '#3dff6e', glow: true, dark: true },
    { id: 'gold', name: 'Gold on black', stops: ['#fff3b0', '#ffcc33', '#b8860b'], vertical: true, dark: true }
  ];
  const RAMPS = {
    classic: { name: 'Classic', chars: ' .:-=+*#%@' },
    blocks: { name: 'Blocks', chars: ' ░▒▓█' },
    fine: { name: 'Detailed', chars: " .'`^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$" },
    braille: { name: 'Braille', chars: null },
    hash: { name: 'Two-tone', chars: ' #' }
  };
  const st = Object.assign({ tab: 'text', text: 'Hello!', font: 'block', color: 'sunset', ramp: 'classic', cols: 64, inv: false, fit: true, brush: 10, frame: 'none', twist: 'none', galTag: 'all', ink: '#111111', tint: false }, Curio.store.get('textart', {}));
  if (!STYLES[st.font]) st.font = 'block';
  const GAL = window.TEXTART_GALLERY;
  const FRAMES = {
    none: { name: 'None' },
    single: { name: '┌ Single', c: ['┌', '─', '┐', '│', '└', '┘'] },
    double: { name: '╔ Double', c: ['╔', '═', '╗', '║', '╚', '╝'] },
    round: { name: '╭ Round', c: ['╭', '─', '╮', '│', '╰', '╯'] },
    stars: { name: '* Stars', c: ['*', '*', '*', '*', '*', '*'] },
    hearts: { name: '♥ Hearts', c: ['♥', '♥', '♥', '♥', '♥', '♥'] },
    tape: { name: '▓ Tape', c: ['▓', '▓', '▓', '▓', '▓', '▓'] }
  };
  const TWISTS = { none: 'None', mirror: '⇋ Mirror', flip: '⇅ Upside down', wave: '〰 Wave', stretch: '↕ Tall' };
  const MIRROR = { '╭': '╮', '╮': '╭', '╰': '╯', '╯': '╰', '├': '┤', '┤': '├', '/': '\\', '\\': '/', '(': ')', ')': '(', '<': '>', '>': '<', '[': ']', ']': '[', '▌': '▐', '▐': '▌' };
  const FLIP = { '╭': '╰', '╰': '╭', '╮': '╯', '╯': '╮', '┬': '┴', '┴': '┬', '▀': '▄', '▄': '▀', '/': '\\', '\\': '/', '^': 'v', 'v': '^' };
  let badges = Curio.store.get('textart:badges', []);
  if (!Array.isArray(badges)) badges = [];
  function award(id, text) { if (badges.includes(id)) return; badges.push(id); Curio.store.set('textart:badges', badges); setTimeout(() => Curio.toast(`Badge: ${text}`, 2400), 600); }
  function decorate(text) {
    let lines = text.split('\n');
    if (st.twist === 'mirror') { const w = Math.max(...lines.map((l) => [...l].length)); lines = lines.map((l) => [...l.padEnd(w)].reverse().map((ch) => MIRROR[ch] || ch).join('').replace(/\s+$/, '')); }
    else if (st.twist === 'flip') lines = lines.reverse().map((l) => [...l].map((ch) => FLIP[ch] || ch).join(''));
    else if (st.twist === 'wave') lines = lines.map((l, i) => ' '.repeat(Math.round((Math.sin(i * 0.9) + 1) * 3)) + l);
    else if (st.twist === 'stretch') lines = lines.flatMap((l) => [l, l]);
    const F = FRAMES[st.frame];
    if (F && F.c) {
      const w = Math.max(...lines.map((l) => [...l].length));
      const [tl, h, tr, v, bl, br] = F.c;
      lines = [tl + h.repeat(w + 2) + tr, v + ' '.repeat(w + 2) + v, ...lines.map((l) => v + ' ' + l + ' '.repeat(w - [...l].length) + ' ' + v), v + ' '.repeat(w + 2) + v, bl + h.repeat(w + 2) + br];
    }
    return lines.join('\n');
  }
  const save = () => Curio.store.set('textart', st);
  let result = '';

  const out = $('out'), stage = $('stage');
  function gradientCss(c) {
    if (!c.stops) return '';
    return `linear-gradient(${c.vertical ? '180deg' : '90deg'}, ${c.stops.join(', ')})`;
  }
  function paintColor() {
    const c = COLORS.find((x) => x.id === st.color) || COLORS[0];
    out.classList.toggle('grad', !!c.stops);
    out.style.backgroundImage = gradientCss(c);
    out.style.color = c.stops ? 'transparent' : c.solid || '';
    out.style.textShadow = c.glow ? `0 0 6px ${c.solid}, 0 0 14px ${c.solid}` : '';
    stage.classList.toggle('dark', !!c.dark);
    $('colors').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.c === st.color)));
  }
  COLORS.forEach((c) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ta-col'; b.dataset.c = c.id;
    b.title = c.name; b.setAttribute('aria-label', c.name);
    b.style.background = c.stops ? gradientCss(c) : c.solid || c.swatch;
    if (c.dark) b.style.boxShadow = '';
    b.addEventListener('click', () => { st.color = c.id; save(); paintColor(); Curio.beep(700 + COLORS.indexOf(c) * 60, .04, 'sine', .06); });
    $('colors').append(b);
  });

  let measure = null;
  function charRatio() {
    if (measure) return measure;
    const s = document.createElement('span'); s.style.cssText = 'position:absolute;visibility:hidden;font-family:var(--mono);font-size:100px;white-space:pre';
    s.textContent = 'M'.repeat(20); document.body.append(s);
    measure = s.getBoundingClientRect().width / 20 / 100; s.remove();
    return measure || .6;
  }
  function fit() {
    const lines = result.split('\n');
    const longest = Math.max(1, ...lines.map((l) => [...l].length));
    const avail = stage.clientWidth - 36;
    let fs = st.fit ? Math.min(st.tab === 'draw' ? 14 : 20, avail / (longest * charRatio())) : (st.tab === 'draw' ? 9 : 13);
    fs = Math.max(4, Math.floor(fs * 10) / 10);
    out.style.fontSize = fs + 'px';
    $('meta').textContent = `${longest} characters wide · ${lines.length} lines · ${result.replace(/\s/g, '').length} non-space characters`;
  }
  function show(text, html) { result = text; if (html) out.innerHTML = html; else out.textContent = text || ' '; out.classList.toggle('colorful', !!html); if (html) { out.classList.remove('grad'); out.style.backgroundImage = ''; out.style.color = ''; out.style.textShadow = ''; } else paintColor(); fit(); }
  addEventListener('resize', fit);

  const txt = $('txt');
  txt.value = st.text;
  function renderText() { show(decorate(render(txt.value || ' ', st.font))); }
  txt.addEventListener('input', () => { st.text = txt.value; save(); renderText(); });
  Object.entries(STYLES).forEach(([k, s]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ta-font'; b.dataset.f = k;
    const pre = document.createElement('pre'); pre.textContent = render('Ab', k);
    const span = document.createElement('span'); span.textContent = s.name;
    b.append(pre, span);
    b.addEventListener('click', () => { st.font = k; save(); paintFonts(); renderText(); Curio.beep(520, .05, 'triangle', .07); });
    $('fonts').append(b);
  });
  function paintFonts() { $('fonts').querySelectorAll('.ta-font').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === st.font))); }

  const pad = $('pad'), pg = pad.getContext('2d', { willReadFrequently: true });
  function wipe() { pg.fillStyle = '#fff'; pg.fillRect(0, 0, pad.width, pad.height); }
  function restorePad() {
    wipe();
    const data = Curio.store.get('textart-pad', null);
    if (data) { const img = new Image(); img.onload = () => { pg.drawImage(img, 0, 0); convert(); }; img.src = data; return; }
    sample(0);
  }
  let padSaveT = 0;
  function savePad() { clearTimeout(padSaveT); padSaveT = setTimeout(() => { try { Curio.store.set('textart-pad', pad.toDataURL('image/png')); } catch {} }, 400); }
  let sampleIdx = 0;
  function sample(i) {
    wipe(); pg.lineCap = 'round'; pg.lineJoin = 'round'; pg.strokeStyle = '#111'; pg.fillStyle = '#111';
    const k = i % 8;
    if (k === 0) {
      pg.lineWidth = 9; pg.beginPath(); pg.arc(160, 100, 78, 0, Math.PI * 2); pg.stroke();
      pg.beginPath(); pg.ellipse(130, 80, 9, 15, 0, 0, Math.PI * 2); pg.ellipse(190, 80, 9, 15, 0, 0, Math.PI * 2); pg.fill();
      pg.beginPath(); pg.arc(160, 108, 42, .15 * Math.PI, .85 * Math.PI); pg.stroke();
    } else if (k === 1) {
      pg.beginPath(); pg.moveTo(160, 175); pg.bezierCurveTo(40, 100, 80, 10, 160, 60); pg.bezierCurveTo(240, 10, 280, 100, 160, 175); pg.fill();
      pg.fillStyle = '#fff'; pg.beginPath(); pg.ellipse(118, 70, 12, 20, -.6, 0, Math.PI * 2); pg.fill();
    } else if (k === 2) {
      pg.lineWidth = 8;
      pg.beginPath(); pg.ellipse(160, 115, 72, 62, 0, 0, Math.PI * 2); pg.stroke();
      pg.beginPath(); pg.moveTo(98, 85); pg.lineTo(100, 25); pg.lineTo(140, 58); pg.moveTo(222, 85); pg.lineTo(220, 25); pg.lineTo(180, 58); pg.stroke();
      pg.beginPath(); pg.arc(132, 105, 9, 0, Math.PI * 2); pg.arc(188, 105, 9, 0, Math.PI * 2); pg.fill();
      pg.beginPath(); pg.moveTo(152, 128); pg.lineTo(168, 128); pg.lineTo(160, 138); pg.fill();
      pg.lineWidth = 4; pg.beginPath(); pg.moveTo(160, 138); pg.quadraticCurveTo(150, 152, 140, 146); pg.moveTo(160, 138); pg.quadraticCurveTo(170, 152, 180, 146); pg.stroke();
      [[-1, 0], [1, 0]].forEach(([s]) => { [-8, 4].forEach((dy) => { pg.beginPath(); pg.moveTo(160 + s * 40, 132 + dy); pg.lineTo(160 + s * 95, 124 + dy * 2); pg.stroke(); }); });
    } else if (k === 4) {
      pg.fillStyle = '#ff8a3d'; pg.beginPath(); pg.arc(160, 100, 60, 0, Math.PI * 2); pg.fill();
      pg.strokeStyle = '#ffb703'; pg.lineWidth = 6;
      for (let j = 0; j < 12; j++) { const a = j * Math.PI / 6; pg.beginPath(); pg.moveTo(160 + Math.cos(a) * 72, 100 + Math.sin(a) * 72); pg.lineTo(160 + Math.cos(a) * 92, 100 + Math.sin(a) * 92); pg.stroke(); }
      pg.fillStyle = '#111'; pg.beginPath(); pg.arc(140, 90, 6, 0, Math.PI * 2); pg.arc(180, 90, 6, 0, Math.PI * 2); pg.fill();
      pg.strokeStyle = '#111'; pg.lineWidth = 5; pg.beginPath(); pg.arc(160, 104, 24, .2 * Math.PI, .8 * Math.PI); pg.stroke();
    } else if (k === 5) {
      pg.fillStyle = '#3a86ff'; pg.fillRect(0, 150, 320, 50);
      pg.fillStyle = '#6a994e'; pg.beginPath(); pg.moveTo(0, 150); pg.lineTo(80, 60); pg.lineTo(150, 150); pg.fill();
      pg.fillStyle = '#386641'; pg.beginPath(); pg.moveTo(100, 150); pg.lineTo(200, 30); pg.lineTo(300, 150); pg.fill();
      pg.fillStyle = '#fff'; pg.beginPath(); pg.moveTo(200, 30); pg.lineTo(222, 56); pg.lineTo(178, 56); pg.fill();
      pg.fillStyle = '#ffd60a'; pg.beginPath(); pg.arc(270, 40, 18, 0, Math.PI * 2); pg.fill();
    } else if (k === 6) {
      pg.fillStyle = '#e63946'; pg.beginPath(); pg.ellipse(160, 120, 90, 50, 0, Math.PI, 0); pg.fill();
      pg.fillStyle = '#f1faee'; pg.fillRect(125, 120, 70, 60);
      pg.fillStyle = '#fff'; [[120, 95], [165, 85], [205, 100]].forEach(([x, y]) => { pg.beginPath(); pg.arc(x, y, 11, 0, Math.PI * 2); pg.fill(); });
      pg.fillStyle = '#111'; pg.beginPath(); pg.arc(145, 145, 5, 0, Math.PI * 2); pg.arc(175, 145, 5, 0, Math.PI * 2); pg.fill();
    } else if (k === 7) {
      pg.lineWidth = 10; pg.strokeStyle = '#8338ec';
      pg.beginPath(); for (let t = 0; t < 12; t += 0.1) { const r = 6 + t * 7; pg.lineTo(160 + Math.cos(t) * r, 100 + Math.sin(t) * r * 0.85); } pg.stroke();
    } else {
      pg.beginPath();
      for (let j = 0; j < 10; j++) { const r = j % 2 ? 34 : 86, a = -Math.PI / 2 + j * Math.PI / 5; pg.lineTo(160 + Math.cos(a) * r, 108 + Math.sin(a) * r); }
      pg.closePath(); pg.fill();
      pg.fillStyle = '#fff'; pg.beginPath(); pg.arc(145, 105, 6, 0, Math.PI * 2); pg.arc(175, 105, 6, 0, Math.PI * 2); pg.fill();
    }
    convert(); savePad();
  }
  function padXY(e) { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * pad.width, (e.clientY - r.top) / r.height * pad.height]; }
  let drawing = null, convT = 0;
  const undoStack = [];
  function pushUndo() { try { undoStack.push(pg.getImageData(0, 0, pad.width, pad.height)); if (undoStack.length > 20) undoStack.shift(); } catch (e) { } }
  Curio.drag(pad, {
    start: (p) => { pushUndo(); drawing = [p.x / pad.clientWidth * pad.width, p.y / pad.clientHeight * pad.height]; stroke(drawing, drawing); },
    move: (p) => { if (!drawing) return; const q = [p.x / pad.clientWidth * pad.width, p.y / pad.clientHeight * pad.height]; stroke(drawing, q); drawing = q; },
    end: () => { if (drawing) { drawing = null; convert(); savePad(); } }
  });
  $('undoPad').addEventListener('click', () => { const im = undoStack.pop(); if (!im) { Curio.toast('Nothing to undo'); return; } pg.putImageData(im, 0, 0); convert(); savePad(); });
  const INKS = ['#111111', '#e63946', '#ff8a3d', '#ffd60a', '#2a9d8f', '#3a86ff', '#8338ec', '#888888'];
  INKS.forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'ta-ink'; b.style.background = c; b.dataset.ink = c; b.setAttribute('aria-label', `Ink ${c}`); b.addEventListener('click', () => { st.ink = c; if (st.brush < 0) st.brush = 10; save(); paintInks(); paintBrushes(); }); $('inks').append(b); });
  function paintInks() { $('inks').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ink === st.ink))); }
  function stroke(a, b) {
    const erase = st.brush < 0;
    pg.strokeStyle = erase ? '#fff' : st.ink; pg.lineWidth = Math.abs(st.brush); pg.lineCap = 'round';
    pg.beginPath(); pg.moveTo(a[0], a[1]); pg.lineTo(b[0], b[1]); pg.stroke();
    clearTimeout(convT); convT = setTimeout(convert, 30);
  }
  $('brushes').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { st.brush = +b.dataset.b; save(); paintBrushes(); }));
  function paintBrushes() { $('brushes').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.b === st.brush))); }
  $('sample').addEventListener('click', () => { sampleIdx++; sample(sampleIdx); Curio.beep(660, .05, 'triangle', .07); });
  $('wipe').addEventListener('click', () => { wipe(); convert(); savePad(); });
  $('file').addEventListener('change', () => {
    const f = $('file').files[0]; if (!f) return;
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      wipe();
      const s = Math.max(pad.width / img.width, pad.height / img.height), w = img.width * s, h = img.height * s;
      pg.drawImage(img, (pad.width - w) / 2, (pad.height - h) / 2, w, h);
      URL.revokeObjectURL(url); convert(); savePad(); Curio.toast('Photo converted 📷');
    };
    img.onerror = () => { URL.revokeObjectURL(url); Curio.toast('That file did not look like an image'); };
    img.src = url; $('file').value = '';
  });
  Object.entries(RAMPS).forEach(([k, r]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ta-tool'; b.dataset.r = k; b.textContent = r.name;
    b.addEventListener('click', () => { st.ramp = k; save(); paintRamps(); convert(); });
    $('ramps').append(b);
  });
  function paintRamps() { $('ramps').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.r === st.ramp))); }
  $('cols').value = st.cols; $('colsV').textContent = st.cols; $('inv').checked = st.inv;
  $('cols').addEventListener('input', () => { st.cols = +$('cols').value; $('colsV').textContent = st.cols; save(); convert(); });
  $('inv').addEventListener('change', () => { st.inv = $('inv').checked; save(); convert(); });

  const small = document.createElement('canvas'), sgc = small.getContext('2d', { willReadFrequently: true });
  let lastRGB = null;
  function lumaGrid(w, h) {
    small.width = w; small.height = h;
    sgc.imageSmoothingEnabled = true; sgc.imageSmoothingQuality = 'high';
    sgc.drawImage(pad, 0, 0, w, h);
    const d = sgc.getImageData(0, 0, w, h).data, L = new Float32Array(w * h);
    lastRGB = d;
    for (let i = 0; i < w * h; i++) { const v = (d[i * 4] * .299 + d[i * 4 + 1] * .587 + d[i * 4 + 2] * .114) / 255; L[i] = st.inv ? v : 1 - v; }
    return L;
  }
  function convert() {
    if (st.tab !== 'draw') return;
    out.style.lineHeight = st.ramp === 'braille' ? '1' : '1.1';
    const cols = st.cols, aspect = pad.height / pad.width;
    if (st.ramp === 'braille') {
      const w = cols * 2, h = Math.max(4, Math.round(w * aspect / 4) * 4) , L = lumaGrid(w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, old = L[i], nv = old > .5 ? 1 : 0, err = old - nv; L[i] = nv;
        if (x + 1 < w) L[i + 1] += err * 7 / 16;
        if (y + 1 < h) { if (x > 0) L[i + w - 1] += err * 3 / 16; L[i + w] += err * 5 / 16; if (x + 1 < w) L[i + w + 1] += err / 16; }
      }
      const bits = [[0, 0, 1], [0, 1, 2], [0, 2, 4], [1, 0, 8], [1, 1, 16], [1, 2, 32], [0, 3, 64], [1, 3, 128]];
      const lines = [];
      for (let cy = 0; cy < h / 4; cy++) {
        let s = '';
        for (let cx = 0; cx < cols; cx++) {
          let code = 0;
          for (const [dx, dy, b] of bits) if (L[(cy * 4 + dy) * w + cx * 2 + dx] > .5) code |= b;
          s += String.fromCharCode(0x2800 + (code || 0));
        }
        lines.push(s);
      }
      show(lines.join('\n'));
      return;
    }
    const chars = [...RAMPS[st.ramp].chars];
    const rows = Math.max(4, Math.round(cols * aspect * .5)), L = lumaGrid(cols, rows), lines = [], htmls = [];
    const esc = (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c);
    for (let y = 0; y < rows; y++) {
      let s = '', hs = '', cur = '', run = '';
      for (let x = 0; x < cols; x++) {
        const ch = chars[Math.min(chars.length - 1, Math.floor(Math.max(0, L[y * cols + x]) * chars.length))];
        s += ch;
        if (st.tint) {
          const i = (y * cols + x) * 4, q = (v) => Math.min(255, Math.round(v / 32) * 32);
          const col = `rgb(${q(lastRGB[i])},${q(lastRGB[i + 1])},${q(lastRGB[i + 2])})`;
          if (col !== cur) { if (run) hs += `<span style="color:${cur}">${run}</span>`; cur = col; run = ''; }
          run += esc(ch);
        }
      }
      if (run) hs += `<span style="color:${cur}">${run}</span>`;
      lines.push(s.replace(/\s+$/, '')); htmls.push(hs);
    }
    while (lines.length && !lines[lines.length - 1]) { lines.pop(); htmls.pop(); }
    while (lines.length && !lines[0]) { lines.shift(); htmls.shift(); }
    show(lines.join('\n'), st.tint ? htmls.join('\n') : null);
  }

  function setTab(t) {
    st.tab = t; save();
    $('tabText').setAttribute('aria-selected', String(t === 'text')); $('tabDraw').setAttribute('aria-selected', String(t === 'draw')); $('tabGal').setAttribute('aria-selected', String(t === 'gal'));
    $('pText').hidden = t !== 'text'; $('pDraw').hidden = t !== 'draw'; $('pGal').hidden = t !== 'gal';
    if (t === 'text') { out.style.lineHeight = '1'; renderText(); } else if (t === 'draw') convert(); else { out.style.lineHeight = '1.15'; showGal(galPick); }
  }
  $('tabText').addEventListener('click', () => setTab('text'));
  $('tabDraw').addEventListener('click', () => setTab('draw'));
  $('tabGal').addEventListener('click', () => setTab('gal'));
  let galPick = GAL.art[0];
  function showGal(a) { galPick = a; show(decorate(a.art.join('\n'))); out.classList.remove('pop'); void out.offsetWidth; out.classList.add('pop'); }
  const TAGS = ['all', 'animals', 'things', 'nature', 'friends'];
  function paintGal() {
    $('galTags').innerHTML = TAGS.map((t) => `<button type="button" class="ta-tool" data-t="${t}" aria-pressed="${st.galTag === t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('');
    $('gal').replaceChildren(...GAL.art.filter((a) => st.galTag === 'all' || a.tag === st.galTag).map((a) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'ta-card';
      const pre = document.createElement('pre'); pre.textContent = a.art.join('\n');
      const sp = document.createElement('span'); sp.textContent = a.name;
      b.append(pre, sp);
      b.addEventListener('click', () => { showGal(a); Curio.beep(620, .05, 'triangle', .06); $('stage').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
      return b;
    }));
  }
  $('galTags').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (!b) return; st.galTag = b.dataset.t; save(); paintGal(); });
  GAL.kaomoji.forEach(([n, k]) => {
    const b = document.createElement('button'); b.type = 'button';
    b.innerHTML = `<span></span><small></small>`; b.firstChild.textContent = k; b.lastChild.textContent = n;
    b.addEventListener('click', async () => { const ok = await copyText(k); Curio.toast(ok ? `Copied ${k}` : 'Could not copy'); if (ok) { Curio.beep(990, .05, 'sine', .07); award('kao', '(◕‿◕) Kaomoji collector'); } });
    $('kao').append(b);
  });
  paintGal();
  function optRow(id, map, key) {
    $(id).innerHTML = Object.entries(map).map(([k, v]) => `<button type="button" class="ta-tool" data-k="${k}" aria-pressed="${st[key] === k}">${typeof v === 'string' ? v : v.name}</button>`).join('');
    $(id).addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      st[key] = b.dataset.k; save();
      $(id).querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.k === st[key])));
      Curio.beep(560, .05, 'triangle', .06);
      if (st.tab === 'text') renderText(); else if (st.tab === 'gal') showGal(galPick);
      if (key === 'frame' && st.frame !== 'none') award('frame', '🖼️ Framed');
    });
  }
  optRow('frames', FRAMES, 'frame'); optRow('twists', TWISTS, 'twist');
  $('tint').checked = !!st.tint;
  $('tint').addEventListener('change', () => { st.tint = $('tint').checked; save(); convert(); });
  let revealT = 0;
  $('reveal').addEventListener('click', () => {
    clearInterval(revealT);
    const target = result, junk = '#@%&*+=-:.';
    const lines = target.split('\n');
    let step = 0; const N = 22;
    award('reveal', '✨ Showman');
    revealT = setInterval(() => {
      step++;
      const k = step / N;
      out.textContent = lines.map((l) => [...l].map((ch, i) => (ch === ' ' || (i / Math.max(1, l.length)) < k * 1.3 - 0.3 ? ch : junk[(Math.random() * junk.length) | 0])).join('')).join('\n');
      if (step % 3 === 0) Curio.beep(1400 + Math.random() * 600, .015, 'square', .02);
      if (step >= N) { clearInterval(revealT); show(target); Curio.beep(880, .08, 'triangle', .07); }
    }, 45);
  });
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select, button') || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    if (k === '1') setTab('text'); else if (k === '2') setTab('draw'); else if (k === '3') setTab('gal');
    else if (k === 'c') $('copy').click();
    else if (k === 'f' && st.tab === 'text') { const ks = Object.keys(STYLES); st.font = ks[(ks.indexOf(st.font) + 1) % ks.length]; save(); paintFonts(); renderText(); }
  });
  $('fit').setAttribute('aria-pressed', String(st.fit));
  $('fit').addEventListener('click', () => { st.fit = !st.fit; save(); $('fit').setAttribute('aria-pressed', String(st.fit)); $('fit').textContent = st.fit ? '🔍 Fit to box' : '🔍 Actual size'; fit(); });
  $('fit').textContent = st.fit ? '🔍 Fit to box' : '🔍 Actual size';

  async function copyText(t) {
    try { await navigator.clipboard.writeText(t); return true; } catch {}
    const ta = document.createElement('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;opacity:0;left:0;top:0'; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); return ok;
  }
  $('copy').addEventListener('click', async () => {
    const ok = await copyText(result);
    Curio.toast(ok ? 'Copied! Paste it somewhere dramatic 📋' : 'Could not copy, select the text instead');
    if (ok) { const n = Curio.store.get('textart:copies', 0) + 1; Curio.store.set('textart:copies', n); award('copy', '📋 First copy'); if (n >= 10) award('copy10', '📣 Town crier: 10 copies'); }
    if (ok) Curio.beep(880, .06, 'sine', .08);
  });
  function download(name, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  $('dl').addEventListener('click', () => download('curio-text-art.txt', new Blob([result + '\n'], { type: 'text/plain' })));
  $('png').addEventListener('click', () => {
    const lines = result.split('\n'), fs = 16, lh = fs * (st.tab === 'draw' && st.ramp === 'braille' ? 1 : 1.1), pad2 = 28;
    const c = document.createElement('canvas'), x = c.getContext('2d');
    x.font = `${fs}px ui-monospace, Menlo, Consolas, monospace`;
    const cw = Math.max(...lines.map((l) => x.measureText(l).width), 10);
    c.width = Math.ceil(cw + pad2 * 2); c.height = Math.ceil(lines.length * lh + pad2 * 2);
    const col = COLORS.find((q) => q.id === st.color) || COLORS[0];
    x.fillStyle = col.dark ? '#0d0f14' : '#fbf7f0'; x.fillRect(0, 0, c.width, c.height);
    x.font = `${fs}px ui-monospace, Menlo, Consolas, monospace`; x.textBaseline = 'top';
    if (col.stops) {
      const gr = col.vertical ? x.createLinearGradient(0, pad2, 0, c.height - pad2) : x.createLinearGradient(pad2, 0, c.width - pad2, 0);
      col.stops.forEach((s, i) => gr.addColorStop(i / (col.stops.length - 1), s)); x.fillStyle = gr;
    } else x.fillStyle = col.solid || '#1d1b19';
    if (col.glow) { x.shadowColor = col.solid; x.shadowBlur = 10; }
    lines.forEach((l, i) => x.fillText(l, pad2, pad2 + i * lh));
    c.toBlob((b) => b && download('curio-text-art.png', b), 'image/png');
  });

  paintColor(); paintFonts(); paintBrushes(); paintRamps(); paintInks(); restorePad();
  setTab(['draw', 'gal'].includes(st.tab) ? st.tab : 'text');
  window.__ta = { setTab, get result() { return result; }, st, renderText };
})();
