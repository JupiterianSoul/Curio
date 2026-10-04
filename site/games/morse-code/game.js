(() => {
  const $ = (id) => document.getElementById(id);
  const D = window.MC_DATA;
  const CODE = Object.fromEntries(D.code), DECODE = Object.fromEntries(D.code.map(([k, v]) => [v, k]));
  const KOCH = [...D.koch];
  const VER = 2, KEY = 'morse-v2';
  const vibOK = typeof navigator.vibrate === 'function';
  const esc = (s) => s.replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[m]);
  const pretty = (c) => c.replace(/\./g, '·').replace(/-/g, '−');

  function load() {
    const def = { v: VER, wpm: Curio.store.get('morse-wpm', 18), fwpm: 40, tone: Curio.store.get('morse-tone', 600), vis: 'lighthouse', vibe: false, kwpm: 12, keyMode: 'straight', text: Curio.store.get('morse-text', 'SOS hello world'),
      koch: { lesson: 1, cwpm: 20, ewpm: 10, groups: 8, stats: {}, best: {} }, ear: { lv: Curio.store.get('morse-level', 'easy') }, inv: { best: 0, mode: 'see' }, daily: {}, ach: {}, sent: 0, visUsed: {} };
    const raw = Curio.store.get(KEY, null);
    if (!raw || typeof raw !== 'object' || raw.v !== VER) return def;
    const s = { ...def, ...raw };
    s.koch = { ...def.koch, ...(raw.koch || {}) }; if (!s.koch.stats || typeof s.koch.stats !== 'object') s.koch.stats = {};
    s.koch.lesson = Math.min(KOCH.length - 1, Math.max(1, +s.koch.lesson || 1));
    s.ear = { ...def.ear, ...(raw.ear || {}) }; s.inv = { ...def.inv, ...(raw.inv || {}) };
    ['daily', 'ach', 'visUsed'].forEach((k) => { if (!s[k] || typeof s[k] !== 'object') s[k] = {}; });
    return s;
  }
  const S = load();
  let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => Curio.store.set(KEY, S), 250); };

  function timeline(text, wpm, fwpm) {
    const u = 1.2 / wpm;
    let cg = 3 * u, wg = 7 * u;
    if (fwpm && fwpm < wpm) { const ta = (60 * wpm - 37.2 * fwpm) / (fwpm * wpm); cg = 3 * ta / 19; wg = 7 * ta / 19; }
    const ev = []; const chars = []; let t = 0, li = 0;
    const words = text.toUpperCase().trim().split(/\s+/).filter(Boolean);
    words.forEach((w, wi) => {
      if (wi && ev.length) t += wg - cg;
      for (const c of w) {
        const code = CODE[c]; if (!code) continue;
        const start = t;
        for (let k = 0; k < code.length; k++) { const len = code[k] === '.' ? u : 3 * u; ev.push({ s: t, e: t + len, li }); t += len; if (k < code.length - 1) t += u; }
        chars.push({ c, code, s: start, e: t }); t += cg; li++;
      }
    });
    return { ev, chars, total: Math.max(0, t - cg) };
  }

  const sig = { on: false, hist: [], last: 0 };
  function setSig(on) {
    if (on === sig.on) return;
    const now = performance.now(); sig.on = on;
    if (on) sig.hist.push({ t0: now, t1: 0 }); else if (sig.hist.length) sig.hist[sig.hist.length - 1].t1 = now;
    sig.last = now;
    if (sig.hist.length > 300) sig.hist.splice(0, 100);
    $('stage').classList.toggle('flash', on && S.vis === 'flash');
  }

  let play = null;
  function playText(text, o = {}) {
    stopPlay();
    const wpm = o.wpm || S.wpm, fwpm = o.fwpm ?? S.fwpm, tl = timeline(text, wpm, fwpm);
    if (!tl.ev.length) { o.onEnd?.(); return null; }
    let snd = null;
    if (!Curio.muted && !o.silent) {
      const a = Curio.audioContext();
      if (a) {
        const os = a.createOscillator(), g = a.createGain(); os.type = 'sine'; os.frequency.value = o.tone || S.tone; g.gain.value = 0;
        const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
        os.connect(g).connect(lp).connect(a.destination);
        const t0 = a.currentTime + 0.06;
        tl.ev.forEach(({ s, e }) => { g.gain.setValueAtTime(0, t0 + s); g.gain.linearRampToValueAtTime(0.22, t0 + s + 0.005); g.gain.setValueAtTime(0.22, t0 + e - 0.005); g.gain.linearRampToValueAtTime(0, t0 + e); });
        os.start(); os.stop(t0 + tl.total + 0.2); snd = { os, a };
      }
    }
    if (S.vibe && vibOK && !o.noVibe) {
      const pat = []; let cur = 0; tl.ev.forEach(({ s, e }) => { pat.push(Math.round((s - cur) * 1000), Math.round((e - s) * 1000)); cur = e; });
      pat[0] = Math.max(1, pat[0] + 60); try { navigator.vibrate(pat); } catch {}
    }
    const p0 = performance.now() + 60, me = { snd, raf: 0, tl };
    play = me;
    let lastLi = -1;
    (function frame() {
      if (play !== me) return;
      const t = (performance.now() - p0) / 1000;
      const cur = tl.ev.find((x) => t >= x.s && t < x.e);
      setSig(!!cur);
      const ci = tl.chars.findIndex((c) => t >= c.s && t < c.e + 0.001);
      if (ci >= 0 && ci !== lastLi) { lastLi = ci; o.onChar?.(ci, tl.chars[ci]); }
      if (t > tl.total + 0.05) { play = null; setSig(false); o.onEnd?.(); return; }
      me.raf = requestAnimationFrame(frame);
    })();
    return me;
  }
  function stopPlay() {
    if (!play) return; cancelAnimationFrame(play.raf); try { play.snd?.os.stop(); } catch {} play = null; setSig(false);
    if (vibOK && S.vibe) { try { navigator.vibrate(0); } catch {} }
  }

  const scene = $('scene'), sc = scene.getContext('2d');
  const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random() * 0.55, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6 }));
  let level = 0;
  function sizeScene() { const r = scene.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1); scene.width = Math.round(r.width * dpr); scene.height = Math.round(r.height * dpr); sc.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function drawScene(now, dt) {
    const W = scene.clientWidth, H = scene.clientHeight; if (!W) return;
    level += ((sig.on ? 1 : 0) - level) * Math.min(1, dt * (sig.on ? 40 : 18));
    const v = S.vis;
    sc.clearRect(0, 0, W, H);
    if (v === 'lighthouse') {
      const sky = sc.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#060b1d'); sky.addColorStop(0.6, '#132a52'); sky.addColorStop(1, '#1d3d6b'); sc.fillStyle = sky; sc.fillRect(0, 0, W, H);
      for (const s of stars) { sc.globalAlpha = 0.4 + 0.4 * Math.sin(now / 700 + s.p); sc.fillStyle = '#fff'; sc.beginPath(); sc.arc(s.x * W, s.y * H, s.r, 0, 7); sc.fill(); }
      sc.globalAlpha = 1;
      sc.fillStyle = '#f4f1de'; sc.beginPath(); sc.arc(W * 0.12, H * 0.2, 16, 0, 7); sc.fill(); sc.fillStyle = '#132a52'; sc.beginPath(); sc.arc(W * 0.12 + 7, H * 0.2 - 4, 14, 0, 7); sc.fill();
      const lx = W * 0.72, top = H * 0.2, base = H * 0.78, tw = Math.max(26, W * 0.045);
      if (level > 0.02) {
        sc.save(); sc.globalCompositeOperation = 'lighter';
        const beam = (dir) => { const g = sc.createLinearGradient(lx, top, lx + dir * W * 0.8, top); g.addColorStop(0, `rgba(255,236,160,${0.55 * level})`); g.addColorStop(1, 'rgba(255,236,160,0)'); sc.fillStyle = g; sc.beginPath(); sc.moveTo(lx, top - 4); sc.lineTo(lx + dir * W * 0.85, top - H * 0.22); sc.lineTo(lx + dir * W * 0.85, top + H * 0.2); sc.lineTo(lx, top + 6); sc.fill(); };
        beam(-1); beam(1);
        const glow = sc.createRadialGradient(lx, top, 2, lx, top, H * 0.5); glow.addColorStop(0, `rgba(255,250,220,${level})`); glow.addColorStop(0.2, `rgba(255,220,120,${0.45 * level})`); glow.addColorStop(1, 'rgba(255,200,80,0)');
        sc.fillStyle = glow; sc.beginPath(); sc.arc(lx, top, H * 0.5, 0, 7); sc.fill(); sc.restore();
      }
      sc.fillStyle = '#2b2d42'; sc.beginPath(); sc.moveTo(lx - tw * 1.6, H); sc.quadraticCurveTo(lx - tw, base - 10, lx, base - 6); sc.quadraticCurveTo(lx + tw * 1.2, base - 12, lx + tw * 2.2, H); sc.fill();
      for (let i = 0; i < 5; i++) {
        const y0 = top + 18 + (base - top - 18) * i / 5, y1 = top + 18 + (base - top - 18) * (i + 1) / 5;
        const w0 = tw * (0.62 + 0.38 * i / 5), w1 = tw * (0.62 + 0.38 * (i + 1) / 5);
        sc.fillStyle = i % 2 ? '#f1f1f1' : '#d62828'; sc.beginPath(); sc.moveTo(lx - w0 / 2, y0); sc.lineTo(lx + w0 / 2, y0); sc.lineTo(lx + w1 / 2, y1); sc.lineTo(lx - w1 / 2, y1); sc.fill();
      }
      sc.fillStyle = '#222'; sc.fillRect(lx - tw * 0.45, top + 12, tw * 0.9, 7);
      sc.fillStyle = level > 0.05 ? `rgba(255,${230 + level * 25},${150 + level * 80},1)` : '#3d4b63'; sc.fillRect(lx - tw * 0.3, top - 8, tw * 0.6, 20);
      sc.fillStyle = '#222'; sc.beginPath(); sc.moveTo(lx - tw * 0.42, top - 8); sc.lineTo(lx, top - 24); sc.lineTo(lx + tw * 0.42, top - 8); sc.fill();
      const sea = sc.createLinearGradient(0, H * 0.82, 0, H); sea.addColorStop(0, '#0d2340'); sea.addColorStop(1, '#06101f'); sc.fillStyle = sea; sc.fillRect(0, H * 0.84, W, H * 0.16);
      sc.strokeStyle = 'rgba(160,200,255,.25)'; sc.lineWidth = 1.2;
      for (let r = 0; r < 4; r++) { sc.beginPath(); const y = H * 0.87 + r * H * 0.035; for (let x = 0; x <= W; x += 8) { const yy = y + Math.sin(x / 26 + now / 600 + r) * 2; if (x) sc.lineTo(x, yy); else sc.moveTo(x, yy); } sc.stroke(); }
      if (level > 0.05) { sc.fillStyle = `rgba(255,230,150,${0.35 * level})`; for (let r = 0; r < 6; r++) sc.fillRect(lx - 14 + Math.sin(now / 200 + r) * 6, H * 0.86 + r * 5, 28 - r * 3, 2); }
    } else if (v === 'lamp') {
      const bg = sc.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.7); bg.addColorStop(0, '#1d2433'); bg.addColorStop(1, '#090c14'); sc.fillStyle = bg; sc.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H * 0.48, R = Math.min(W, H) * 0.32;
      if (level > 0.02) { const gl = sc.createRadialGradient(cx, cy, R * 0.5, cx, cy, R * 3); gl.addColorStop(0, `rgba(255,236,170,${0.6 * level})`); gl.addColorStop(1, 'rgba(255,200,80,0)'); sc.fillStyle = gl; sc.fillRect(0, 0, W, H); }
      sc.fillStyle = '#3a3f4b'; sc.beginPath(); sc.arc(cx, cy, R + 14, 0, 7); sc.fill();
      sc.strokeStyle = '#5a6070'; sc.lineWidth = 4; sc.stroke();
      const lens = sc.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 2, cx, cy, R);
      if (level > 0.05) { lens.addColorStop(0, '#fffef2'); lens.addColorStop(0.5, '#ffe08a'); lens.addColorStop(1, '#ff9f1c'); } else { lens.addColorStop(0, '#4b5263'); lens.addColorStop(1, '#1b1f29'); }
      sc.fillStyle = lens; sc.beginPath(); sc.arc(cx, cy, R, 0, 7); sc.fill();
      sc.save(); sc.beginPath(); sc.arc(cx, cy, R, 0, 7); sc.clip();
      const open = level;
      for (let i = -3; i <= 3; i++) { const y = cy + i * R * 0.29; sc.save(); sc.translate(cx, y); sc.scale(1, Math.max(0.08, 1 - open)); sc.fillStyle = '#2a2f3a'; sc.fillRect(-R, -R * 0.14, R * 2, R * 0.28); sc.fillStyle = 'rgba(255,255,255,.08)'; sc.fillRect(-R, -R * 0.14, R * 2, 2); sc.restore(); }
      sc.restore();
      sc.fillStyle = '#3a3f4b'; sc.fillRect(cx - 8, cy + R + 10, 16, H); sc.fillRect(cx + R + 6, cy - 6, 30, 12);
    } else if (v === 'tape') {
      sc.fillStyle = Curio.isDark() ? '#1a1712' : '#efe6d2'; sc.fillRect(0, 0, W, H);
      const ty = H * 0.3, th = H * 0.34;
      sc.fillStyle = '#fbf3df'; sc.fillRect(0, ty, W, th); sc.fillStyle = 'rgba(0,0,0,.08)'; sc.fillRect(0, ty + th - 3, W, 3);
      sc.fillStyle = 'rgba(120,90,40,.15)'; for (let x = (-(now / 10) % 24 + 24) % 24; x < W; x += 24) { sc.beginPath(); sc.arc(x, ty + 8, 2.5, 0, 7); sc.fill(); }
      const head = W * 0.8, pxms = 0.22;
      sc.fillStyle = '#1d3557';
      for (const s of sig.hist) { const x0 = head - (now - s.t0) * pxms, x1 = head - (now - (s.t1 || now)) * pxms; if (x1 < -10) continue; sc.beginPath(); const hgt = 10; const len = Math.max(hgt, x1 - x0); sc.roundRect ? sc.roundRect(x0, ty + th / 2 - hgt / 2, len, hgt, 5) : sc.rect(x0, ty + th / 2 - hgt / 2, len, hgt); sc.fill(); }
      sc.fillStyle = '#6d4c41'; sc.fillRect(head - 6, ty - 20, 12, 22); sc.fillStyle = sig.on ? '#ff5a36' : '#8d6e63'; sc.beginPath(); sc.arc(head, ty - 24, 9, 0, 7); sc.fill();
      sc.fillStyle = '#5d4037'; sc.beginPath(); sc.arc(W + 30, H / 2, H * 0.42, 0, 7); sc.fill(); sc.fillStyle = '#8d6e63'; sc.beginPath(); sc.arc(W + 30, H / 2, H * 0.12, 0, 7); sc.fill();
    } else if (v === 'wave') {
      sc.fillStyle = '#041208'; sc.fillRect(0, 0, W, H);
      sc.strokeStyle = 'rgba(125,255,155,.08)'; sc.lineWidth = 1; for (let x = 0; x < W; x += 30) { sc.beginPath(); sc.moveTo(x, 0); sc.lineTo(x, H); sc.stroke(); } for (let y = 0; y < H; y += 30) { sc.beginPath(); sc.moveTo(0, y); sc.lineTo(W, y); sc.stroke(); }
      const pxms = 0.25, mid = H * 0.5, amp = H * 0.28;
      sc.strokeStyle = '#7dff9b'; sc.lineWidth = 2.5; sc.shadowColor = '#7dff9b'; sc.shadowBlur = 10; sc.beginPath();
      for (let x = W; x >= 0; x -= 1.5) {
        const t = now - (W - x) / pxms;
        const on = sig.hist.some((s) => t >= s.t0 && t < (s.t1 || now));
        const y = on ? mid + Math.sin(x * 0.9) * amp : mid + Math.sin(x * 0.2 + now / 300) * 1.2;
        if (x === W) sc.moveTo(x, y); else sc.lineTo(x, y);
      }
      sc.stroke(); sc.shadowBlur = 0;
    } else {
      const k = level;
      sc.fillStyle = `rgb(${Math.round(12 + 243 * k)},${Math.round(14 + 236 * k)},${Math.round(24 + 196 * k)})`; sc.fillRect(0, 0, W, H);
      if (k < 0.5) { sc.fillStyle = 'rgba(255,255,255,.35)'; sc.font = '800 14px system-ui, sans-serif'; sc.textAlign = 'center'; sc.fillText('Flashlight mode: the whole panel lights up', W / 2, H / 2 - 30); }
    }
  }

  const caption = $('caption');
  function setCaption(html) { caption.innerHTML = html; }

  const textEl = $('text'), morseEl = $('morse');
  const toMorse = (t) => t.toUpperCase().trim().split(/\s+/).filter(Boolean).map((w) => [...w].map((c) => CODE[c] || '').filter(Boolean).join(' ')).filter(Boolean).join(' / ');
  const fromMorse = (m) => m.replace(/[·•]/g, '.').replace(/[–−_]/g, '-').trim().split(/\s*[/|]\s*|\s{3,}/).map((w) => w.trim().split(/\s+/).map((s) => s ? (DECODE[s] ?? '�') : '').join('')).join(' ');
  textEl.addEventListener('input', () => { morseEl.value = toMorse(textEl.value); S.text = textEl.value.slice(0, 500); save(); });
  morseEl.addEventListener('input', () => { textEl.value = fromMorse(morseEl.value); S.text = textEl.value.slice(0, 500); save(); });
  D.famous.forEach(([m, d]) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = m.length > 24 ? m.slice(0, 22) + '…' : m; b.title = d; b.addEventListener('click', () => { textEl.value = m; morseEl.value = toMorse(m); S.text = m; save(); Curio.toast(d, 1600); playMain(); }); $('famous').append(b); });

  const wpmEl = $('wpm'), fEl = $('fwpm'), toneEl = $('tone');
  wpmEl.value = S.wpm; fEl.value = S.fwpm; toneEl.value = S.tone;
  const syncK = () => { $('wpmV').textContent = `${S.wpm} WPM`; $('fwpmV').textContent = S.fwpm >= S.wpm ? 'same' : `${S.fwpm} WPM`; $('toneV').textContent = `${S.tone} Hz`; };
  wpmEl.addEventListener('input', () => { S.wpm = +wpmEl.value; syncK(); save(); if (S.wpm >= 25) unlock('fast'); });
  fEl.addEventListener('input', () => { S.fwpm = +fEl.value; syncK(); save(); });
  toneEl.addEventListener('input', () => { S.tone = +toneEl.value; syncK(); save(); });
  syncK();

  const playBtn = $('playBtn'); let playingMain = false;
  function playMain() {
    if (playingMain) { stopPlay(); endMain(); return; }
    const txt = textEl.value.replace(/\s+/g, ' ').trim();
    if (!toMorse(txt)) { Curio.toast('Type something first'); return; }
    playingMain = true; playBtn.textContent = '■ Stop';
    if (Curio.muted) Curio.toast('Muted. Watch the light! 💡');
    const chars = [...txt.toUpperCase()], pos = []; chars.forEach((c, i) => { if (CODE[c]) pos.push(i); });
    unlock('first');
    if (/\bSOS\b/i.test(txt)) unlock('sos');
    playText(txt, { onChar: (ci, ch) => {
      const i = pos[ci];
      $('now').innerHTML = `${esc(txt.slice(0, i))}<mark>${esc(txt[i])}</mark>${esc(txt.slice(i + 1))} &nbsp; <b>${pretty(ch.code)}</b>`;
      const lo = Math.max(0, i - 14); setCaption(`${esc(txt.slice(lo, i))}<mark>${esc(txt[i])}</mark>${esc(txt.slice(i + 1, i + 8))}<em>${pretty(ch.code)}</em>`);
    }, onEnd: endMain });
  }
  function endMain() { playingMain = false; playBtn.textContent = '▶ Play'; setTimeout(() => { if (!play) setCaption(''); }, 1200); }
  playBtn.addEventListener('click', playMain);
  $('copyMorse').addEventListener('click', async () => { try { await navigator.clipboard.writeText(morseEl.value); Curio.toast('Morse copied'); } catch { Curio.toast('Select the Morse box to copy it'); } });
  const b64e = (s) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
  $('shareMsg').addEventListener('click', async () => {
    const url = location.href.split('#')[0] + '#m=' + b64e(textEl.value.slice(0, 300));
    history.replaceState(null, '', url); unlock('share');
    try { await navigator.clipboard.writeText(url); Curio.toast('Secret link copied. It opens straight into Morse!'); } catch { Curio.toast('Copy the address bar to share'); }
  });

  const visBtns = $('vis').querySelectorAll('button');
  function setVis(v) { S.vis = v; S.visUsed[v] = 1; if (Object.keys(S.visUsed).length >= 5) unlock('vis'); visBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === v))); save(); }
  visBtns.forEach((b) => b.addEventListener('click', () => { setVis(b.dataset.v); if (!play) playText('E E', { noVibe: true }); }));
  $('vibe').setAttribute('aria-pressed', String(S.vibe));
  $('vibe').addEventListener('click', () => { if (!vibOK) { Curio.toast('Vibration is not supported on this device'); return; } S.vibe = !S.vibe; $('vibe').setAttribute('aria-pressed', String(S.vibe)); save(); Curio.toast(S.vibe ? 'Vibrate along: on' : 'Vibrate along: off'); });

  const keyEl = $('key'); let down = 0, sym = '', gapT = 0, side = null, tapText = '', challenge = null;
  const unitMs = () => 1200 / S.kwpm;
  const kw = $('kwpm'); kw.value = S.kwpm;
  const syncTap = () => { $('kwpmV').textContent = `${S.kwpm} WPM`; $('thresh').textContent = Math.round(unitMs() * 2); $('buf').textContent = sym ? pretty(sym) : ' '; $('tapOut').textContent = tapText; };
  kw.addEventListener('input', () => { S.kwpm = +kw.value; syncTap(); save(); });
  function tone(on) {
    if (on) { setSig(true); if (Curio.muted) return; const a = Curio.audioContext(); if (!a) return; const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = S.tone; g.gain.value = 0; o.connect(g).connect(a.destination); o.start(); g.gain.setTargetAtTime(0.22, a.currentTime, 0.004); side = { o, g, a }; if (S.vibe && vibOK) try { navigator.vibrate(400); } catch {} }
    else { setSig(false); if (side) { side.g.gain.setTargetAtTime(0, side.a.currentTime, 0.005); side.o.stop(side.a.currentTime + 0.05); side = null; } if (S.vibe && vibOK) try { navigator.vibrate(0); } catch {} }
  }
  function addSym(s) {
    sym += s; syncTap();
    const bar = document.createElement('i'); bar.className = s === '-' ? 'dash' : ''; bar.style.width = s === '-' ? '30px' : '10px'; $('timing').append(bar);
    while ($('timing').children.length > 24) $('timing').firstChild.remove();
    clearTimeout(gapT);
    gapT = setTimeout(lockLetter, unitMs() * 3 + 180);
  }
  function lockLetter() {
    const ch = DECODE[sym]; tapText += ch ?? '�'; sym = ''; syncTap();
    if (ch) { Curio.beep(1200, 0.03, 'triangle', 0.05); S.sent++; if (S.sent >= 100) unlock('key100'); save(); }
    if (/SOS$/.test(tapText.replace(/\s/g, ''))) unlock('sos');
    checkChallenge();
    gapT = setTimeout(() => { if (tapText && !tapText.endsWith(' ')) { tapText += ' '; syncTap(); } }, unitMs() * 4 + 500);
  }
  function keyDown() { if (down) return; down = performance.now(); clearTimeout(gapT); keyEl.classList.add('down'); tone(true); }
  function keyUp() { if (!down) return; const d = performance.now() - down; down = 0; keyEl.classList.remove('down'); tone(false); addSym(d < unitMs() * 2 ? '.' : '-'); }
  keyEl.addEventListener('pointerdown', (e) => { e.preventDefault(); try { keyEl.setPointerCapture(e.pointerId); } catch {} keyDown(); });
  keyEl.addEventListener('pointerup', keyUp); keyEl.addEventListener('pointercancel', keyUp);
  keyEl.addEventListener('contextmenu', (e) => e.preventDefault());
  function paddle(s) {
    const btn = s === '.' ? $('dotBtn') : $('dashBtn'); btn.classList.add('down'); setTimeout(() => btn.classList.remove('down'), 90);
    tone(true); setTimeout(() => tone(false), s === '.' ? unitMs() : unitMs() * 3);
    clearTimeout(gapT); addSym(s);
  }
  $('dotBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); paddle('.'); });
  $('dashBtn').addEventListener('pointerdown', (e) => { e.preventDefault(); paddle('-'); });
  const kmBtns = $('keyMode').querySelectorAll('button');
  function setKeyMode(m) { S.keyMode = m; kmBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === m))); keyEl.hidden = m !== 'straight'; $('dotBtn').hidden = $('dashBtn').hidden = m === 'straight'; save(); }
  kmBtns.forEach((b) => b.addEventListener('click', () => setKeyMode(b.dataset.k)));
  $('tapClear').addEventListener('click', () => { tapText = ''; sym = ''; clearTimeout(gapT); $('timing').innerHTML = ''; syncTap(); });
  $('tapBack').addEventListener('click', () => { tapText = tapText.trimEnd().slice(0, -1); syncTap(); });
  function newChallenge() {
    const w = Curio.pick(D.words); challenge = { w, n: (challenge?.n || 0), streak: challenge?.streak || 0, t0: performance.now() };
    tapText = ''; sym = ''; $('timing').innerHTML = ''; syncTap();
    $('target').innerHTML = `Send: <b>${esc(w)}</b> <span class="c-muted" style="font-family:var(--mono)">${w.split('').map((c) => pretty(CODE[c])).join('  ')}</span><br><small class="c-muted">Streak ${challenge.streak} · tap ✕ Clear if you slip</small>`;
  }
  function checkChallenge() {
    if (!challenge) return;
    const got = tapText.replace(/\s/g, '');
    if (got === challenge.w) {
      challenge.streak++; challenge.n++;
      const secs = (performance.now() - challenge.t0) / 1000;
      Curio.toast(`✅ ${challenge.w} in ${secs.toFixed(1)}s`); [660, 880, 1100].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.08, 'triangle', 0.08), i * 80));
      if (challenge.streak >= 5) unlock('sendit');
      if (challenge.streak % 5 === 0) Curio.confetti(80);
      setTimeout(newChallenge, 700);
    } else if (!challenge.w.startsWith(got)) { challenge.streak = 0; $('target').querySelector('small').textContent = 'Oops, that went off course. Clear and try again.'; }
  }
  $('sendIt').addEventListener('click', () => { if (challenge) { challenge = null; $('target').innerHTML = ''; $('sendIt').textContent = '🎯 Send-it challenge'; return; } newChallenge(); $('sendIt').textContent = '✕ Stop challenge'; });
  setKeyMode(S.keyMode); syncTap();

  let tab = 'translate';
  function setTab(t) {
    tab = t; stopPlay(); endMain(); stopInvaders(true);
    document.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.tab === t)));
    document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== t; });
    if (t === 'learn') paintKoch();
  }
  document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));

  const kochStat = (c) => S.koch.stats[c] || [0, 0];
  function paintKoch() {
    const L = S.koch.lesson, open = KOCH.slice(0, L + 1), map = $('kochMap'); map.innerHTML = '';
    $('lessonNo').textContent = L;
    KOCH.forEach((c, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mc-mapc'; b.textContent = c;
      const [ok, tot] = kochStat(c), acc = tot ? ok / tot : 0;
      if (i <= L) { b.classList.add('open'); b.style.setProperty('--h', tot ? Math.round(acc * 120) : 210); }
      if (i === L) b.classList.add('new');
      b.disabled = i > L; b.title = i <= L ? `${c} ${CODE[c]}${tot ? ` · ${Math.round(acc * 100)}% of ${tot}` : ''}` : 'Locked';
      b.setAttribute('aria-label', i <= L ? `${c}, ${tot ? Math.round(acc * 100) + ' percent' : 'new'}` : `${c}, locked`);
      b.addEventListener('click', () => playText(c, { wpm: S.koch.cwpm, fwpm: S.koch.ewpm }));
      map.append(b);
    });
    const box = $('lesson'); box.innerHTML = '';
    const nc = KOCH[L];
    const card = document.createElement('div'); card.className = 'mc-lcard';
    card.innerHTML = `<div class="mc-big"></div><div class="info"><b></b><div class="code"></div><span class="c-muted"></span></div><button class="c-btn c-btn--ghost mc-sm" type="button">🔊 Hear it</button>`;
    card.querySelector('.mc-big').textContent = nc;
    card.querySelector('b').textContent = L === 1 ? 'Lesson 1: meet K and M' : `Lesson ${L}: new character`;
    card.querySelector('.code').textContent = L === 1 ? `${pretty(CODE.K)}   ${pretty(CODE.M)}` : pretty(CODE[nc]);
    card.querySelector('span').textContent = `Learning ${open.join(' ')}`;
    card.querySelector('button').addEventListener('click', () => playText(L === 1 ? 'K K M M' : `${nc} ${nc} ${nc}`, { wpm: S.koch.cwpm, fwpm: Math.min(S.koch.ewpm, 8) }));
    const opts = document.createElement('div'); opts.className = 'mc-opts';
    opts.innerHTML = `<div class="mc-knob"><label>Character speed <b></b></label><input type="range" min="12" max="30" aria-label="Character speed"></div><div class="mc-knob"><label>Effective speed <b></b></label><input type="range" min="4" max="20" aria-label="Effective speed"></div><div class="mc-seg" role="group" aria-label="Session length"><button type="button" data-n="5">Short</button><button type="button" data-n="8">Medium</button><button type="button" data-n="14">Long</button></div>`;
    const [cs, es] = opts.querySelectorAll('input'), [cb, eb] = opts.querySelectorAll('label b');
    const sync = () => { cs.value = S.koch.cwpm; es.value = Math.min(S.koch.ewpm, S.koch.cwpm); cb.textContent = `${S.koch.cwpm} WPM`; eb.textContent = `${Math.min(S.koch.ewpm, S.koch.cwpm)} WPM`; opts.querySelectorAll('[data-n]').forEach((x) => x.setAttribute('aria-pressed', String(+x.dataset.n === S.koch.groups))); };
    cs.addEventListener('input', () => { S.koch.cwpm = +cs.value; sync(); save(); });
    es.addEventListener('input', () => { S.koch.ewpm = +es.value; sync(); save(); });
    opts.querySelectorAll('[data-n]').forEach((x) => x.addEventListener('click', () => { S.koch.groups = +x.dataset.n; sync(); save(); }));
    sync();
    const go = document.createElement('div'); go.className = 'mc-row';
    go.innerHTML = '<button class="c-btn" type="button">▶ Start lesson</button>';
    go.querySelector('button').addEventListener('click', startLesson);
    box.append(card, opts, go);
    if (L > 1) { const back = document.createElement('p'); back.className = 'c-muted'; back.style.cssText = 'margin:0;font-size:13px;text-align:center'; back.textContent = `Best on this lesson: ${S.koch.best[L] != null ? S.koch.best[L] + '%' : 'not tried yet'}.`; box.append(back); }
  }
  function startLesson() {
    const L = S.koch.lesson, pool = KOCH.slice(0, L + 1), nc = KOCH[L];
    const groups = []; for (let g = 0; g < S.koch.groups; g++) { let s = ''; for (let i = 0; i < 5; i++) s += Math.random() < 0.3 ? nc : Curio.pick(pool); groups.push(s); }
    const box = $('lesson'); box.innerHTML = '';
    const p = document.createElement('p'); p.className = 'c-muted'; p.style.margin = '0'; p.textContent = 'Type what you hear. Groups of five, spaces optional. Do not stop to think, just skip what you miss.';
    const inp = document.createElement('input'); inp.className = 'c-input mc-copy'; inp.autocomplete = 'off'; inp.setAttribute('autocapitalize', 'characters'); inp.spellcheck = false; inp.setAttribute('aria-label', 'Your copy');
    const meter = document.createElement('div'); meter.className = 'mc-meter'; meter.innerHTML = '<i style="width:0"></i>';
    const row = document.createElement('div'); row.className = 'mc-row'; row.innerHTML = '<button class="c-btn" type="button">✓ Done</button><button class="c-btn c-btn--ghost" type="button">Cancel</button>';
    box.append(p, meter, inp, row); inp.focus();
    const text = groups.join(' ');
    const tl = timeline(text, S.koch.cwpm, Math.min(S.koch.ewpm, S.koch.cwpm));
    const t0 = performance.now(); let raf = 0;
    (function prog() { const f = Math.min(1, (performance.now() - t0) / 1000 / (tl.total + 0.6)); meter.firstChild.style.width = `${f * 100}%`; if (f < 1 && box.contains(meter)) raf = requestAnimationFrame(prog); })();
    setTimeout(() => playText(text, { wpm: S.koch.cwpm, fwpm: Math.min(S.koch.ewpm, S.koch.cwpm), onChar: (ci) => setCaption(`Lesson ${L} · group ${Math.floor(ci / 5) + 1} of ${groups.length}`), onEnd: () => setCaption('') }), 600);
    const [done, cancel] = row.querySelectorAll('button');
    done.addEventListener('click', () => { cancelAnimationFrame(raf); stopPlay(); gradeLesson(groups, inp.value); });
    cancel.addEventListener('click', () => { cancelAnimationFrame(raf); stopPlay(); paintKoch(); });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') done.click(); });
  }
  function align(want, got) {
    const n = want.length, m = got.length, dp = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => i + j));
    for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (want[i - 1] === got[j - 1] ? 0 : 1));
    const out = []; let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + (want[i - 1] === got[j - 1] ? 0 : 1)) { out.unshift({ w: want[i - 1], g: got[j - 1], ok: want[i - 1] === got[j - 1] }); i--; j--; }
      else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) { out.unshift({ w: want[i - 1], g: null, ok: false }); i--; }
      else { out.unshift({ w: null, g: got[j - 1], ok: false }); j--; }
    }
    return out;
  }
  function diffHTML(al) { return al.map((x) => x.ok ? `<span class="ok">${esc(x.w)}</span>` : x.w && x.g ? `<span class="no">${esc(x.g)}</span><span class="miss">${esc(x.w)}</span>` : x.w ? `<span class="miss">${esc(x.w)}</span>` : `<span class="no">${esc(x.g)}</span>`).join(''); }
  async function gradeLesson(groups, typed) {
    const want = groups.join(''), got = typed.toUpperCase().replace(/\s+/g, '');
    const al = align([...want], [...got]), ok = al.filter((x) => x.ok).length, acc = Math.round(100 * ok / Math.max(want.length, al.length));
    al.forEach((x) => { if (x.w) { const s = kochStat(x.w); s[1]++; if (x.ok) s[0]++; S.koch.stats[x.w] = s; } });
    const L = S.koch.lesson; S.koch.best[L] = Math.max(S.koch.best[L] || 0, acc);
    const pass = acc >= 90;
    if (pass && L < KOCH.length - 1) S.koch.lesson = L + 1;
    if (S.koch.lesson >= 5) unlock('koch5'); if (S.koch.lesson >= 15) unlock('koch15'); if (pass && L === KOCH.length - 1) unlock('kochAll');
    save();
    const box = document.createElement('div'); box.style.textAlign = 'left';
    box.innerHTML = `<div class="mc-diff">${diffHTML(al)}</div><p class="c-muted" style="font-size:13px;margin:8px 0 0">Green: right. Red: what you typed wrong. Yellow: what was sent.</p>`;
    if (pass) { Curio.confetti(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.08), i * 90)); } else Curio.beep(300, 0.2, 'triangle', 0.06);
    const v = await Curio.modal({ emoji: pass ? '🎓' : '📻', title: `${acc}% copy`, body: box, buttons: pass && L < KOCH.length - 1 ? [{ label: `Lesson ${L + 1}: add ${KOCH[L + 1]}`, value: 'next' }, { label: 'Close', value: 'close' }] : [{ label: '↻ Try again', value: 'again' }, { label: 'Close', value: 'close' }] });
    paintKoch();
    if (v === 'again') startLesson();
    if (v === 'next') { const c = KOCH[S.koch.lesson]; setTimeout(() => playText(`${c} ${c} ${c}`, { wpm: S.koch.cwpm, fwpm: 8 }), 300); }
  }

  const gameBox = $('game'); let gameMode = null;
  $('gamePick').querySelectorAll('[data-g]').forEach((b) => b.addEventListener('click', () => openGame(b.dataset.g)));
  function openGame(g) {
    stopPlay(); stopInvaders(true); gameMode = g;
    $('gamePick').querySelectorAll('[data-g]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.g === g)));
    gameBox.innerHTML = '';
    if (g === 'ear') earSetup(); else if (g === 'invaders') invSetup(); else dailySetup();
  }

  const LEVELS = { koch: () => KOCH.slice(0, S.koch.lesson + 1).filter((c) => /[A-Z0-9]/.test(c)), easy: () => [...'ETIANMS'], letters: () => [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'], all: () => [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'] };
  const ROUNDS = 10; let ear = null;
  function earSetup() {
    gameBox.innerHTML = `<div class="mc-seg" id="earLv" role="group" aria-label="Level"><button data-lv="easy" type="button">ETIANMS</button><button data-lv="koch" type="button">My Koch letters</button><button data-lv="letters" type="button">A to Z</button><button data-lv="all" type="button">A to Z, 0 to 9</button></div>
      <div class="mc-stats"><div class="c-stat"><b id="pRound">1/10</b><span>Round</span></div><div class="c-stat"><b id="pScore">0</b><span>Score</span></div><div class="c-stat"><b id="pStreak">0</b><span>Streak</span></div><div class="c-stat"><b id="pBest">-</b><span>Best</span></div></div>
      <p class="c-muted" style="margin:0" id="pMsg">Listen, then pick the character you heard.</p>
      <div class="mc-row"><button class="c-btn" id="pPlay" type="button">🔊 Play sound</button><label style="display:flex;gap:6px;align-items:center;font-size:14px;font-weight:700"><input type="checkbox" id="pShow"> Show dots</label></div>
      <div class="mc-buf" id="pHint">&nbsp;</div><div class="mc-choices" id="choices"></div>`;
    $('earLv').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { S.ear.lv = b.dataset.lv; save(); paintEarLv(); earNew(true); }));
    $('pPlay').addEventListener('click', () => { if (!ear?.cur) earNew(true); else earPlay(); });
    $('pShow').addEventListener('change', paintEar);
    paintEarLv(); earNew(true);
  }
  function paintEarLv() { $('earLv').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lv === S.ear.lv))); const b = Curio.getBest(`score-${S.ear.lv}`); $('pBest').textContent = b == null ? '-' : b; }
  function paintEar() { if (!$('pRound')) return; $('pRound').textContent = `${Math.min(ear.round, ROUNDS)}/${ROUNDS}`; $('pScore').textContent = ear.score; $('pStreak').textContent = ear.streak; $('pHint').textContent = $('pShow').checked && ear.cur ? pretty(CODE[ear.cur]) : ' '; }
  function earNew(reset) {
    if (reset) ear = { round: 0, score: 0, streak: 0, cur: null, locked: false, perfect: true };
    ear.round++; ear.locked = false;
    const pool = LEVELS[S.ear.lv](); ear.cur = Curio.pick(pool);
    const opts = new Set([ear.cur]); let guard = 0; while (opts.size < Math.min(4, pool.length) && guard++ < 50) opts.add(Curio.pick(pool));
    const ch = $('choices'); ch.innerHTML = '';
    Curio.shuffle([...opts]).forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mc-choice'; b.textContent = c; b.addEventListener('click', () => earAnswer(b, c)); ch.append(b); });
    $('pMsg').textContent = 'Listen, then pick the character you heard.';
    paintEar(); setTimeout(earPlay, 250);
  }
  function earPlay() { if (!ear?.cur) return; if (Curio.muted) { Curio.toast('Unmute to hear it. Showing the dots instead'); $('pShow').checked = true; paintEar(); } playText(ear.cur, { wpm: Math.min(S.wpm, 20), fwpm: 40 }); }
  function earAnswer(btn, c) {
    if (ear.locked) return; ear.locked = true;
    const ok = c === ear.cur;
    [...$('choices').children].forEach((b) => { if (b.textContent === ear.cur) b.classList.add('good'); });
    if (ok) { ear.score += 10 + ear.streak * 2; ear.streak++; Curio.beep(880, 0.08, 'triangle', 0.1); $('pMsg').textContent = Curio.pick(['Nailed it!', 'Sharp ears!', 'Telegraph operator material.', 'Dit-dah-delightful.', 'Right on the beep.']); }
    else { btn.classList.add('bad'); ear.streak = 0; ear.perfect = false; Curio.beep(180, 0.2, 'sawtooth', 0.08); $('pMsg').textContent = `That was ${ear.cur} (${pretty(CODE[ear.cur])}), not ${c} (${pretty(CODE[c])}).`; try { navigator.vibrate?.(30); } catch {} }
    $('pHint').textContent = pretty(CODE[ear.cur]); paintEar();
    setTimeout(async () => {
      if (gameMode !== 'ear') return;
      if (ear.round >= ROUNDS) {
        const r = Curio.best(`score-${S.ear.lv}`, ear.score); paintEarLv();
        if (ear.perfect) unlock('ear10');
        if (r.isNew || ear.perfect) Curio.confetti();
        const v = await Curio.modal({ emoji: ear.score >= 150 ? '📡' : '🎧', title: `${ear.score} points`, body: `${r.isNew ? 'New personal best! ' : `Best: ${r.best}. `}${ear.perfect ? 'A perfect ten. ' : ''}${ear.score >= 150 ? 'Samuel Morse would be proud.' : ear.score >= 80 ? 'Your ears are warming up.' : 'Beep boop… keep practising!'}`, buttons: [{ label: 'Play again', value: 'again' }, { label: '📋 Share', value: 'share' }, { label: 'Close', value: 'close' }] });
        if (v === 'share') { const t = `🎧 Zoble Morse ear trainer: ${ear.score} points on ${S.ear.lv}${ear.perfect ? ', perfect 10/10' : ''}.`; try { await navigator.clipboard.writeText(t); Curio.toast('Copied!'); } catch { Curio.toast(t, 4000); } }
        if (v === 'again') earNew(true); else if (gameMode === 'ear') { ear.cur = null; $('choices').innerHTML = ''; $('pMsg').textContent = 'Pick a level or press play to start again.'; }
      } else earNew(false);
    }, ok ? 800 : 1800);
  }

  let inv = null;
  function invSetup() {
    gameBox.innerHTML = `<div class="mc-seg" id="invMode" role="group" aria-label="Difficulty"><button data-m="see" type="button">👀 See the code</button><button data-m="ears" type="button">👂 Ears only</button></div>
      <div class="mc-inv"><canvas id="invCv" aria-label="Morse Invaders game"></canvas><div class="mc-invover" id="invOver"><h3>Morse Invaders</h3><p>Letters descend as Morse code. Type the matching letter (or tap the keys below) to zap the lowest one before it lands. Three shields. Waves speed up.</p><button class="c-btn" id="invGo" type="button">▶ Launch</button><small class="c-muted" id="invBest"></small></div></div>
      <div class="mc-kbd" id="invKbd"></div>`;
    const kb = $('invKbd');
    [...'QWERTYUIOPASDFGHJKLZXCVBNM1234567890'].forEach((c) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('pointerdown', (e) => { e.preventDefault(); invShoot(c); }); kb.append(b); });
    const mb = $('invMode').querySelectorAll('button');
    const pm = () => mb.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === S.inv.mode)));
    mb.forEach((b) => b.addEventListener('click', () => { S.inv.mode = b.dataset.m; pm(); save(); })); pm();
    $('invBest').textContent = S.inv.best ? `Best: ${S.inv.best}` : '';
    $('invGo').addEventListener('click', () => { if (inv.paused) { inv.paused = false; $('invOver').hidden = true; inv.running = true; inv.last = performance.now(); inv.raf = requestAnimationFrame(invLoop); } else startInvaders(); });
    const cv = $('invCv'), r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    inv = { cv, g: cv.getContext('2d'), dpr, running: false, ships: [], shots: [], parts: [], score: 0, lives: 3, wave: 1, combo: 0, spawnT: 0, kills: 0, shake: 0, raf: 0, last: 0 };
    inv.g.setTransform(dpr, 0, 0, dpr, 0, 0); drawInvaders(0);
  }
  function invPool() { const w = inv.wave; if (w <= 1) return [...'ETIANM']; if (w === 2) return [...'ETIANMSURWDKGO']; if (w <= 4) return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']; return [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789']; }
  function startInvaders() {
    $('invOver').hidden = true;
    Object.assign(inv, { running: true, paused: false, ships: [], shots: [], parts: [], score: 0, lives: 3, wave: 1, combo: 0, spawnT: 0.5, kills: 0, last: performance.now() });
    cancelAnimationFrame(inv.raf); inv.raf = requestAnimationFrame(invLoop);
  }
  function stopInvaders(hard) { if (!inv) return; inv.running = false; cancelAnimationFrame(inv.raf); if (hard) inv = null; }
  function invLoop(now) {
    if (!inv || !inv.running) return;
    const dt = Math.min(0.05, (now - inv.last) / 1000); inv.last = now;
    if (!document.hidden) { stepInvaders(dt); drawInvaders(now); }
    inv.raf = requestAnimationFrame(invLoop);
  }
  function stepInvaders(dt) {
    const W = inv.cv.clientWidth, H = inv.cv.clientHeight;
    inv.spawnT -= dt;
    const maxShips = 2 + Math.min(4, Math.floor(inv.wave / 2));
    if (inv.spawnT <= 0 && inv.ships.length < maxShips) {
      const ch = Curio.pick(invPool());
      inv.ships.push({ ch, code: CODE[ch], x: 40 + Math.random() * (W - 80), y: -30, vy: (14 + inv.wave * 4) * (S.inv.mode === 'ears' ? 0.8 : 1), wob: Math.random() * 6 });
      inv.spawnT = Math.max(1.1, 3.4 - inv.wave * 0.28);
      if (S.inv.mode === 'ears' || !Curio.muted) playText(ch, { wpm: 20, fwpm: 40, noVibe: true });
    }
    for (const s of inv.ships) { s.y += s.vy * dt; s.wob += dt * 2; }
    for (let i = inv.ships.length - 1; i >= 0; i--) {
      if (inv.ships[i].y > H - 56) {
        const s = inv.ships.splice(i, 1)[0]; inv.lives--; inv.combo = 0; inv.shake = 0.4;
        boom(s.x, H - 56, '#ff5a36', 30); Curio.beep(110, 0.35, 'sawtooth', 0.1); try { navigator.vibrate?.([40, 30, 40]); } catch {}
        if (inv.lives <= 0) { invOver(); return; }
      }
    }
    for (let i = inv.shots.length - 1; i >= 0; i--) { inv.shots[i].life -= dt * 4; if (inv.shots[i].life <= 0) inv.shots.splice(i, 1); }
    for (let i = inv.parts.length - 1; i >= 0; i--) { const p = inv.parts[i]; p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 120 * dt; if (p.life <= 0) inv.parts.splice(i, 1); }
    inv.shake = Math.max(0, inv.shake - dt);
  }
  function boom(x, y, c, n = 22) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 40 + Math.random() * 160; inv.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.5, c }); } }
  function invShoot(ch) {
    if (!inv || !inv.running) return;
    const W = inv.cv.clientWidth, H = inv.cv.clientHeight;
    const targets = inv.ships.filter((s) => s.ch === ch).sort((a, b) => b.y - a.y);
    if (!targets.length) { inv.combo = 0; Curio.beep(150, 0.1, 'square', 0.05); inv.shots.push({ x0: W / 2, y0: H - 40, x1: W / 2 + (Math.random() - 0.5) * 120, y1: 0, life: 0.6, miss: true }); return; }
    const s = targets[0]; inv.ships.splice(inv.ships.indexOf(s), 1);
    inv.shots.push({ x0: W / 2, y0: H - 40, x1: s.x, y1: s.y, life: 1 });
    boom(s.x, s.y, `hsl(${(s.ch.charCodeAt(0) * 37) % 360} 90% 65%)`);
    inv.combo++; inv.kills++; inv.score += 10 * inv.wave + Math.min(50, inv.combo * 2);
    Curio.beep(900 + inv.combo * 20, 0.06, 'square', 0.05);
    if (inv.kills % 8 === 0) { inv.wave++; Curio.toast(`🌊 Wave ${inv.wave}`, 1200); [523, 784].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.1, 'triangle', 0.07), i * 100)); }
    if (inv.score >= 300) unlock('inv300'); if (inv.score >= 1000) unlock('inv1000');
  }
  async function invOver() {
    inv.running = false;
    const r = Curio.best('invaders', inv.score); S.inv.best = Math.max(S.inv.best, inv.score); save();
    if (r.isNew && inv.score > 0) Curio.confetti();
    drawInvaders(performance.now());
    $('invOver').hidden = false; $('invOver').querySelector('h3').textContent = `Game over: ${inv.score}`;
    $('invOver').querySelector('p').textContent = `${inv.kills} letters zapped, reached wave ${inv.wave}. ${r.isNew ? 'New personal best!' : `Best: ${r.best}.`}`;
    $('invGo').textContent = '↻ Play again'; $('invBest').textContent = '';
  }
  function drawInvaders(now) {
    if (!inv) return;
    const g = inv.g, W = inv.cv.clientWidth, H = inv.cv.clientHeight;
    g.save(); g.clearRect(0, 0, W, H);
    if (inv.shake) g.translate((Math.random() - 0.5) * 12 * inv.shake, (Math.random() - 0.5) * 12 * inv.shake);
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#050816'); bg.addColorStop(1, '#1a1040'); g.fillStyle = bg; g.fillRect(-10, -10, W + 20, H + 20);
    for (let i = 0; i < 50; i++) { const x = (i * 97.3) % W, y = ((i * 53.1) + now / (20 + (i % 5) * 10)) % H; g.fillStyle = `rgba(255,255,255,${0.2 + (i % 3) * 0.2})`; g.fillRect(x, y, 1.5, 1.5); }
    for (const s of inv.ships) {
      const x = s.x + Math.sin(s.wob) * 6, y = s.y, hue = (s.ch.charCodeAt(0) * 37) % 360;
      g.fillStyle = `hsl(${hue} 80% 60%)`; g.beginPath(); g.ellipse(x, y, 26, 10, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(200,240,255,.85)'; g.beginPath(); g.ellipse(x, y - 7, 12, 9, 0, Math.PI, 0); g.fill();
      for (let k = -1; k <= 1; k++) { g.fillStyle = Math.floor(now / 200 + k) % 2 ? '#fff6c2' : '#ffb703'; g.beginPath(); g.arc(x + k * 12, y + 2, 2.5, 0, 7); g.fill(); }
      g.textAlign = 'center'; g.font = '900 15px ui-monospace, monospace';
      g.fillStyle = '#fff'; g.fillText(S.inv.mode === 'ears' ? '?' : pretty(s.code), x, y + 28);
    }
    for (const sh of inv.shots) { g.strokeStyle = sh.miss ? `rgba(255,90,54,${sh.life})` : `rgba(125,249,255,${sh.life})`; g.lineWidth = 3; g.shadowColor = '#7df9ff'; g.shadowBlur = 12; g.beginPath(); g.moveTo(sh.x0, sh.y0); g.lineTo(sh.x1, sh.y1); g.stroke(); g.shadowBlur = 0; }
    for (const p of inv.parts) { g.globalAlpha = Math.max(0, p.life); g.fillStyle = p.c; g.fillRect(p.x - 2, p.y - 2, 4, 4); } g.globalAlpha = 1;
    g.fillStyle = '#2b2d42'; g.fillRect(0, H - 22, W, 22); g.fillStyle = '#3d405b'; g.fillRect(0, H - 22, W, 3);
    g.fillStyle = '#7df9ff'; g.beginPath(); g.moveTo(W / 2 - 22, H - 22); g.lineTo(W / 2, H - 50); g.lineTo(W / 2 + 22, H - 22); g.fill();
    g.fillStyle = 'rgba(125,249,255,.12)'; g.fillRect(0, H - 58, W, 2);
    g.fillStyle = '#fff'; g.font = '800 14px system-ui, sans-serif'; g.textAlign = 'left'; g.fillText(`Score ${inv.score}`, 10, 22); g.textAlign = 'right'; g.fillText(`${'🛡'.repeat(Math.max(0, inv.lives))}  Wave ${inv.wave}`, W - 10, 22);
    if (inv.combo >= 3) { g.textAlign = 'center'; g.fillStyle = '#ffd23f'; g.fillText(`${inv.combo}x combo`, W / 2, 22); }
    g.restore();
  }

  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  function hashStr(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
  const dailyPhrase = () => D.phrases[hashStr('morse' + todayKey()) % D.phrases.length];
  function paintDailyState() { const d = S.daily[todayKey()]; $('dailyState').textContent = d ? `Done today ✓ (${d.acc}%)` : 'A new secret message every day.'; }
  function dailySetup() {
    const ph = dailyPhrase(); let listens = 0;
    const done = S.daily[todayKey()];
    gameBox.innerHTML = `<h3 style="margin:0">📅 Daily decode · ${todayKey()}</h3><p class="c-muted" style="margin:0">Today's secret message is ${ph.split(' ').length} word${ph.includes(' ') ? 's' : ''}, ${ph.replace(/ /g, '').length} letters. Listen (or watch the lighthouse) as many times as you need, then type what you got.</p>
      <div class="mc-row"><button class="c-btn" id="dPlay" type="button">▶ Play message</button><button class="c-btn c-btn--ghost" id="dSlow" type="button">🐢 Slower</button></div>
      <form class="mc-answer" id="dForm"><input class="c-input" id="dIn" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Your decoding" placeholder="Type the message"><button class="c-btn" type="submit">Submit</button></form><div class="mc-diff" id="dDiff"></div>`;
    let slow = false;
    $('dPlay').addEventListener('click', () => { listens++; playText(ph, { wpm: slow ? 10 : 15, fwpm: slow ? 6 : 10, onChar: () => setCaption('🔒 Secret message incoming…'), onEnd: () => setCaption('') }); });
    $('dSlow').addEventListener('click', () => { slow = !slow; $('dSlow').textContent = slow ? '🐇 Normal speed' : '🐢 Slower'; });
    if (done) $('dDiff').innerHTML = `<p class="c-muted">Already cracked today (${done.acc}%). Have another go for fun.</p>`;
    $('dForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const got = $('dIn').value.toUpperCase().replace(/\s+/g, ' ').trim();
      const al = align([...ph], [...got]), ok = al.filter((x) => x.ok).length, acc = Math.round(100 * ok / Math.max(ph.length, al.length));
      $('dDiff').innerHTML = diffHTML(al);
      const prev = S.daily[todayKey()];
      S.daily[todayKey()] = { acc: Math.max(acc, prev?.acc || 0), listens }; save(); paintDailyState();
      if (acc >= 90) unlock('daily');
      if (acc === 100) { Curio.confetti(); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.12, 'triangle', 0.08), i * 90)); }
      const v = await Curio.modal({ emoji: acc === 100 ? '🕵️' : acc >= 70 ? '📻' : '🌫️', title: acc === 100 ? 'Message decoded!' : `${acc}% decoded`, body: `It said: "${ph}". You needed ${listens} listen${listens === 1 ? '' : 's'}.`, buttons: [{ label: '📋 Share result', value: 'share' }, { label: 'Close', value: 'close' }] });
      if (v === 'share') { const t = `📡 Zoble Morse daily decode ${todayKey()}: ${acc === 100 ? '✅ cracked' : acc + '%'} in ${listens} listen${listens === 1 ? '' : 's'}. ${'▮'.repeat(Math.round(acc / 10))}${'▯'.repeat(10 - Math.round(acc / 10))}`; try { await navigator.clipboard.writeText(t); Curio.toast('Copied!'); } catch { Curio.toast(t, 4000); } }
    });
  }

  (function buildRef() {
    const chart = $('chart');
    D.code.forEach(([k, v]) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'mc-cell'; b.setAttribute('aria-label', `${k}: ${v.replace(/\./g, 'dot ').replace(/-/g, 'dash ')}`);
      b.innerHTML = `<b></b><span>${pretty(v)}</span>`; b.querySelector('b').textContent = k;
      b.addEventListener('click', () => { chart.querySelectorAll('.playing').forEach((x) => x.classList.remove('playing')); b.classList.add('playing'); playText(k, { onEnd: () => b.classList.remove('playing') }); });
      chart.append(b);
    });
    const W = 640, Hh = 270, nodes = [], edges = [];
    const pos = (code) => { const d = code.length; let i = 0; for (const c of code) i = i * 2 + (c === '-' ? 1 : 0); return [(i + 0.5) / Math.pow(2, d) * W, 22 + d * 58]; };
    const walk = (code) => { if (code.length > 4) return; const [x, y] = pos(code); nodes.push([x, y, code ? (DECODE[code] || '') : '▶', code]); ['.', '-'].forEach((s) => { if (code.length < 4) { const [x2, y2] = pos(code + s); edges.push([x, y, x2, y2, s]); walk(code + s); } }); };
    walk('');
    $('tree').innerHTML = `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Morse tree: go left for a dot, right for a dash">${edges.map(([a, b, c, d, s]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="${s === '.' ? 'e-dot' : 'e-dash'}" stroke-width="2.5"/>`).join('')}${nodes.map(([x, y, t, code]) => `<g data-c="${code}" style="cursor:${t && t !== '▶' ? 'pointer' : 'default'}"><circle cx="${x}" cy="${y}" r="13" class="n"/><text x="${x}" y="${y + 4.5}" text-anchor="middle">${esc(t)}</text></g>`).join('')}</svg>`;
    $('tree').querySelectorAll('g[data-c]').forEach((n) => { const c = DECODE[n.dataset.c]; if (c) n.addEventListener('click', () => playText(c)); });
    const pros = $('prosigns');
    D.prosigns.forEach(([n, code, d]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mc-ref'; b.innerHTML = '<b></b><code></code><span></span>'; b.querySelector('b').textContent = n; b.querySelector('code').textContent = pretty(code); b.querySelector('span').textContent = d; b.addEventListener('click', () => { const tl = code; playText(DECODE[tl] || n); }); pros.append(b); });
    const q = $('qcodes');
    [...D.qcodes, ...D.abbr].forEach(([n, d]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'mc-ref'; b.innerHTML = '<b></b><code></code><span></span>'; b.querySelector('b').textContent = n; b.querySelector('code').textContent = [...n].map((c) => pretty(CODE[c] || '')).join(' '); b.querySelector('span').textContent = d; b.addEventListener('click', () => playText(n)); q.append(b); });
    const h = $('history');
    D.history.forEach(([y, t]) => { const li = document.createElement('li'); li.innerHTML = '<b></b><span></span>'; li.querySelector('b').textContent = y; li.querySelector('span').textContent = t; h.append(li); });
  })();

  const ACH = [
    { id: 'first', i: '📨', n: 'First message', d: 'Play a message' },
    { id: 'sos', i: '🆘', n: 'Save our souls', d: 'Send or play SOS' },
    { id: 'vis', i: '🗼', n: 'Light show', d: 'Try every display' },
    { id: 'share', i: '🔗', n: 'Secret agent', d: 'Share a secret link' },
    { id: 'fast', i: '⚡', n: 'Speed demon', d: 'Set 25 WPM or more' },
    { id: 'key100', i: '👆', n: 'Brass pounder', d: 'Key 100 characters' },
    { id: 'sendit', i: '🎯', n: 'Clean fist', d: '5 send-it words in a row' },
    { id: 'koch5', i: '🎓', n: 'Student', d: 'Reach Koch lesson 5' },
    { id: 'koch15', i: '📻', n: 'Operator', d: 'Reach Koch lesson 15' },
    { id: 'kochAll', i: '🏅', n: 'Licensed', d: 'Pass the final Koch lesson' },
    { id: 'ear10', i: '🎧', n: 'Golden ears', d: 'Perfect 10 in the ear trainer' },
    { id: 'inv300', i: '👾', n: 'Defender', d: 'Score 300 in Morse Invaders' },
    { id: 'inv1000', i: '🛸', n: 'Planet saver', d: 'Score 1,000 in Morse Invaders' },
    { id: 'daily', i: '📅', n: 'Codebreaker', d: 'Decode the daily message' }
  ];
  function paintAch() {
    const box = $('ach'); box.innerHTML = ''; let got = 0;
    ACH.forEach((a) => { const d = document.createElement('div'); d.className = 'mc-badge' + (S.ach[a.id] ? ' got' : ''); if (S.ach[a.id]) got++; d.innerHTML = '<i></i><div><b></b><span></span></div>'; d.querySelector('i').textContent = a.i; d.querySelector('b').textContent = a.n; d.querySelector('span').textContent = a.d; box.append(d); });
    $('achCount').textContent = `${got}/${ACH.length}`;
  }
  const unlockQ = []; let unlockBusy = false;
  function unlock(id) { if (S.ach[id]) return; const a = ACH.find((x) => x.id === id); if (!a) return; S.ach[id] = Date.now(); save(); paintAch(); unlockQ.push(a); if (!unlockBusy) nextUnlock(); }
  function nextUnlock() {
    const a = unlockQ.shift(); if (!a) { unlockBusy = false; return; }
    unlockBusy = true;
    const el = document.createElement('div'); el.className = 'mc-unlock'; el.setAttribute('role', 'status'); el.innerHTML = '<i></i><div><span></span><small></small></div>';
    el.querySelector('i').textContent = a.i; el.querySelector('span').textContent = a.n; el.querySelector('small').textContent = a.d;
    document.body.append(el); setTimeout(() => { el.remove(); nextUnlock(); }, 3100);
  }

  addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea, select')) return;
    if (document.querySelector('.curio-modal')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (tab === 'tap') {
      if (S.keyMode === 'straight' && e.key === ' ') { e.preventDefault(); if (!e.repeat) keyDown(); return; }
      if (S.keyMode === 'paddle' && (e.key === '.' || e.key === '-')) { e.preventDefault(); if (!e.repeat) paddle(e.key); return; }
      if (e.key === 'Backspace') { $('tapBack').click(); return; }
    }
    if (tab === 'games' && gameMode === 'invaders' && inv?.running) { const k = e.key.toUpperCase(); if (/^[A-Z0-9]$/.test(k)) { e.preventDefault(); invShoot(k); } return; }
    if (tab === 'games' && gameMode === 'ear' && ear?.cur && !ear.locked) {
      const k = e.key.toUpperCase(); const btn = [...$('choices').children].find((b) => b.textContent === k); if (btn) btn.click();
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('pPlay').click(); }
    }
  });
  addEventListener('keyup', (e) => { if (tab === 'tap' && S.keyMode === 'straight' && e.key === ' ') keyUp(); });

  let lastT = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    if (!document.hidden) drawScene(now, dt);
    requestAnimationFrame(loop);
  }
  addEventListener('resize', () => { sizeScene(); if (inv && !inv.running) { const r = inv.cv.getBoundingClientRect(); inv.cv.width = Math.round(r.width * inv.dpr); inv.cv.height = Math.round(r.height * inv.dpr); inv.g.setTransform(inv.dpr, 0, 0, inv.dpr, 0, 0); drawInvaders(performance.now()); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stopPlay(); endMain(); if (inv?.running) { inv.running = false; inv.paused = true; cancelAnimationFrame(inv.raf); $('invOver').hidden = false; $('invOver').querySelector('h3').textContent = 'Paused'; $('invOver').querySelector('p').textContent = `Score ${inv.score}, wave ${inv.wave}. The invaders are waiting politely.`; $('invGo').textContent = '▶ Resume'; } } });

  const h = location.hash.replace(/^#/, '');
  if (h.startsWith('m=')) { try { S.text = b64d(h.slice(2)).slice(0, 300); Curio.toast('🔐 A secret message for you. Press play!', 3000); } catch {} }
  textEl.value = S.text; morseEl.value = toMorse(textEl.value);
  setVis(S.vis); paintAch(); paintDailyState(); sizeScene();
  addEventListener('curio:touchpad', (e) => { if (e.detail && S.keyMode === 'straight') { setKeyMode('paddle'); Curio.toast('Touchpad mode: switched the key to Dot and dash buttons, so no holding is needed', 3600); } });
  if (Curio.touchpad && S.keyMode === 'straight') setKeyMode('paddle');
  if (!Curio.touchpad && !Curio.store.get('tp-hint-morse-code', false)) { Curio.store.set('tp-hint-morse-code', true); setTimeout(() => Curio.toast('Tip: on a laptop touchpad, turn on Touchpad mode in the top bar', 3600), 1800); }
  setTimeout(() => { if (!play) playText('HI', { wpm: 12, fwpm: 12, noVibe: true, silent: true }); }, 900);
  requestAnimationFrame(loop);
})();
