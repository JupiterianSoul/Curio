(() => {
  const C = window.Curio;
  const slug = C ? C.slug : 'x';
  const reduce = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function dayKey(d = new Date()) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  const daySeed = (salt = '') => hash(dayKey() + ':' + slug + ':' + salt);
  const dayNumber = () => Math.floor((Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()) - Date.UTC(2024, 0, 1)) / 86400000);

  function load(key, version, defaults) {
    const raw = C.store.get(`${slug}:${key}`, null);
    const base = typeof structuredClone === 'function' ? structuredClone(defaults) : JSON.parse(JSON.stringify(defaults));
    if (!raw || typeof raw !== 'object' || raw.v !== version || typeof raw.data !== 'object' || raw.data == null) return base;
    for (const k of Object.keys(base)) if (k in raw.data && typeof raw.data[k] === typeof base[k] && Array.isArray(raw.data[k]) === Array.isArray(base[k])) base[k] = raw.data[k];
    return base;
  }
  const save = (key, version, data) => C.store.set(`${slug}:${key}`, { v: version, data });

  function ac() { return !C || C.muted ? null : C.audioContext(); }
  function tone(freq, dur = 0.15, o = {}) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + (o.delay || 0);
    const osc = a.createOscillator(), g = a.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.glide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.glide), t + dur);
    if (o.detune) osc.detune.value = o.detune;
    const v = o.vol ?? 0.14, at = o.attack ?? 0.008;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + at);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = g;
    if (o.filter) { const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filter; g.connect(f); node = f; }
    osc.connect(g); node.connect(a.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  function noise(dur = 0.1, o = {}) {
    const a = ac(); if (!a) return;
    const t = a.currentTime + (o.delay || 0);
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** (o.decay ?? 2);
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = o.ftype || 'bandpass'; f.frequency.value = o.freq || 2000; f.Q.value = o.q ?? 1;
    const g = a.createGain(); g.gain.value = o.vol ?? 0.2;
    src.connect(f).connect(g).connect(a.destination);
    src.start(t);
  }
  const sfx = {
    tone, noise,
    click() { noise(0.03, { freq: 3200, vol: 0.18, q: 2 }); tone(1400, 0.03, { type: 'square', vol: 0.03 }); },
    tick() { noise(0.02, { freq: 5000, vol: 0.12, q: 4 }); },
    pop(p = 0) { tone(520 + p * 40, 0.09, { type: 'triangle', vol: 0.12, glide: 760 + p * 50 }); },
    good() { tone(660, 0.1, { type: 'triangle', vol: 0.12 }); tone(990, 0.16, { type: 'triangle', vol: 0.11, delay: 0.08 }); },
    bad() { tone(220, 0.28, { type: 'sawtooth', vol: 0.07, glide: 110, filter: 900 }); noise(0.12, { freq: 300, vol: 0.15 }); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', vol: 0.11, delay: i * 0.09 })); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => { tone(f, 0.3, { type: 'triangle', vol: 0.1, delay: i * 0.1 }); tone(f / 2, 0.3, { type: 'sine', vol: 0.06, delay: i * 0.1 }); }); },
    lose() { [392, 330, 262].forEach((f, i) => tone(f, 0.24, { type: 'triangle', vol: 0.1, delay: i * 0.14 })); },
    whoosh() { noise(0.25, { freq: 900, vol: 0.12, q: 0.6, decay: 1 }); },
    badge() { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.25, { type: 'sine', vol: 0.09, delay: i * 0.07 })); }
  };

  const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch {} };

  function shake(el, s = 8) {
    if (!el || reduce() || !el.animate) return;
    el.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${-s}px, ${s * 0.3}px)` }, { transform: `translate(${s}px, ${-s * 0.3}px)` }, { transform: `translate(${-s * 0.6}px, 0)` }, { transform: `translate(${s * 0.4}px, 0)` }, { transform: 'translate(0,0)' }], { duration: 380, easing: 'ease-out' });
  }
  function bump(el, scale = 1.18) {
    if (!el || reduce() || !el.animate) return;
    el.animate([{ transform: 'scale(1)' }, { transform: `scale(${scale})` }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.2,1.6,.4,1)' });
  }

  let pc = null, pg = null, parts = [], praf = 0;
  function ensureCanvas() {
    if (pc) return;
    pc = document.createElement('canvas');
    pc.className = 'fx-particles';
    pc.setAttribute('aria-hidden', 'true');
    document.body.append(pc);
    pg = pc.getContext('2d');
    const size = () => { const d = Math.min(2, devicePixelRatio || 1); pc.width = innerWidth * d; pc.height = innerHeight * d; pg.setTransform(d, 0, 0, d, 0, 0); };
    size(); addEventListener('resize', size);
  }
  function loop() {
    pg.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((p) => p.life > 0);
    for (const p of parts) {
      p.vy += p.g; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.life -= 1; p.r += p.vr;
      const a = clamp(p.life / p.max, 0, 1);
      pg.globalAlpha = a; pg.fillStyle = p.c;
      pg.save(); pg.translate(p.x, p.y); pg.rotate(p.r);
      if (p.shape === 'star') { pg.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? p.s * 0.45 : p.s; const an = i * Math.PI / 5; pg.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } pg.fill(); }
      else if (p.shape === 'rect') pg.fillRect(-p.s, -p.s * 0.5, p.s * 2, p.s);
      else { pg.beginPath(); pg.arc(0, 0, p.s * a + 0.5, 0, Math.PI * 2); pg.fill(); }
      pg.restore();
    }
    pg.globalAlpha = 1;
    if (parts.length && !document.hidden) praf = requestAnimationFrame(loop); else { praf = 0; parts = []; pg.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function burst(x, y, o = {}) {
    if (reduce()) return;
    ensureCanvas();
    const colors = o.colors || ['#ff5a36', '#ffc233', '#2ecc71', '#3498db', '#9b59b6', '#ff6fb5'];
    const n = o.count || 18, sp = o.speed || 6;
    for (let i = 0; i < n; i++) {
      const an = Math.random() * Math.PI * 2, v = sp * (0.4 + Math.random() * 0.8);
      const life = (o.life || 40) * (0.6 + Math.random() * 0.6);
      parts.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v - (o.lift || 1), g: o.gravity ?? 0.18, s: (o.size || 4) * (0.6 + Math.random() * 0.8), c: colors[(Math.random() * colors.length) | 0], life, max: life, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, shape: o.shape || (Math.random() < 0.3 ? 'star' : 'dot') });
    }
    if (parts.length > 600) parts.splice(0, parts.length - 600);
    if (!praf) praf = requestAnimationFrame(loop);
  }
  function burstAt(el, o) { if (!el) return; const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, o); }
  function float(x, y, text, color = 'var(--accent)') {
    const d = document.createElement('div');
    d.className = 'fx-float'; d.textContent = text; d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.color = color;
    document.body.append(d);
    setTimeout(() => d.remove(), 1000);
  }
  function floatAt(el, text, color) { if (!el) return; const r = el.getBoundingClientRect(); float(r.left + r.width / 2, r.top + r.height / 3, text, color); }

  function countUp(el, to, ms = 800, fmt = (v) => Math.round(v)) {
    return new Promise((res) => {
      if (reduce() || document.hidden) { el.textContent = fmt(to); res(); return; }
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / ms), e = 1 - (1 - p) ** 3;
        el.textContent = fmt(to * e);
        if (p < 1 && !document.hidden) requestAnimationFrame(step); else { el.textContent = fmt(to); res(); }
      };
      requestAnimationFrame(step);
    });
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); C.toast('Copied to clipboard'); return true; } catch {}
    try {
      const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.append(t); t.select(); const ok = document.execCommand('copy'); t.remove();
      C.toast(ok ? 'Copied to clipboard' : 'Could not copy'); return ok;
    } catch { C.toast('Could not copy'); return false; }
  }

  const TIER = { bronze: ['#e3a26b', '#a8612d'], silver: ['#e6ebf0', '#8e9aa6'], gold: ['#ffe17a', '#d49a00'], diamond: ['#b9f3ff', '#4aa6d8'] };
  function medal(emoji, tier = 'bronze', locked = false) {
    const [a, b] = TIER[tier] || TIER.bronze;
    const id = 'm' + Math.random().toString(36).slice(2, 8);
    return `<svg viewBox="0 0 64 64" class="fx-medal${locked ? ' is-locked' : ''}" aria-hidden="true">
      <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
      <path d="M20 2h10l4 14H24zM34 2h10l-4 14H30z" fill="${locked ? '#9a948c' : '#e8553b'}" opacity=".85"/>
      <circle cx="32" cy="38" r="22" fill="url(#${id})"/>
      <circle cx="32" cy="38" r="17" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-dasharray="3 3"/>
      <text x="32" y="45" text-anchor="middle" font-size="20">${locked ? '🔒' : emoji}</text></svg>`;
  }

  function badges(defs, version = 1) {
    let got = load('badges', version, { ids: {} }).ids;
    const api = {
      defs,
      has: (id) => !!got[id],
      count: () => defs.filter((d) => got[d.id]).length,
      unlock(id) {
        if (got[id]) return false;
        const d = defs.find((x) => x.id === id); if (!d) return false;
        got[id] = Date.now(); save('badges', version, { ids: got });
        showUnlock(d); return true;
      },
      reset() { got = {}; save('badges', version, { ids: got }); },
      render(el) {
        el.innerHTML = `<p class="fx-badge-count">${api.count()} of ${defs.length} unlocked</p><div class="fx-badges">${defs.map((d) => {
          const on = !!got[d.id];
          return `<div class="fx-badge${on ? ' is-on' : ''}" title="${d.desc}">${medal(d.emoji, d.tier, !on)}<b>${on || !d.secret ? d.name : '???'}</b><small>${on || !d.secret ? d.desc : 'Secret badge'}</small></div>`;
        }).join('')}</div>`;
      }
    };
    return api;
  }
  let unlockQ = Promise.resolve();
  function showUnlock(d) {
    unlockQ = unlockQ.then(() => new Promise((res) => {
      const el = document.createElement('div');
      el.className = 'fx-unlock'; el.setAttribute('role', 'status');
      el.innerHTML = `${medal(d.emoji, d.tier)}<div><small>Badge unlocked</small><b></b><span></span></div>`;
      el.querySelector('b').textContent = d.name; el.querySelector('span').textContent = d.desc;
      document.body.append(el);
      sfx.badge(); buzz([20, 40, 20]);
      requestAnimationFrame(() => el.classList.add('is-on'));
      setTimeout(() => { el.classList.remove('is-on'); setTimeout(() => { el.remove(); res(); }, 350); }, 2600);
    }));
  }

  function tabs(el, list, key) {
    const remembered = C.store.get(`${slug}:tab`, list[0].id);
    let cur = list.some((t) => t.id === remembered) ? remembered : list[0].id;
    el.classList.add('fx-tabs-wrap');
    el.innerHTML = `<div class="fx-tabs" role="tablist">${list.map((t) => `<button type="button" role="tab" data-tab="${t.id}">${t.label}</button>`).join('')}</div><div class="fx-tabpanel" role="tabpanel"></div>`;
    const panel = el.querySelector('.fx-tabpanel');
    const paint = () => {
      el.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === cur)));
      const t = list.find((x) => x.id === cur);
      panel.innerHTML = ''; t.render(panel);
    };
    el.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { cur = b.dataset.tab; C.store.set(`${slug}:tab`, cur); paint(); }));
    paint();
    return { refresh: paint, show(id) { cur = id; paint(); } };
  }

  function seg(el, options, value, onChange, label) {
    el.classList.add('fx-seg'); el.setAttribute('role', 'group'); if (label) el.setAttribute('aria-label', label);
    el.innerHTML = options.map((o) => `<button type="button" data-v="${o.v}">${o.label}${o.sub ? `<small>${o.sub}</small>` : ''}</button>`).join('');
    const paint = (v) => el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    paint(value);
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { if (el.dataset.locked) return; sfx.click(); paint(b.dataset.v); onChange(b.dataset.v); }));
    return { set: paint };
  }

  function histogram(values, o = {}) {
    const W = 320, H = 120, pad = 18;
    const n = values.length || 1, max = Math.max(1, ...values.map((v) => v.n));
    const bw = (W - pad * 2) / n;
    return `<svg class="fx-hist" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="${o.label || 'Histogram'}">${values.map((v, i) => {
      const h = Math.max(v.n ? 4 : 1, (v.n / max) * (H - 20));
      const x = pad + i * bw + bw * 0.12, w = bw * 0.76;
      return `<rect x="${x.toFixed(1)}" y="${(H - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${v.hi ? 'var(--accent)' : 'color-mix(in srgb, var(--ink-3) 55%, transparent)'}"><title>${v.label}: ${v.n}</title></rect>${v.n ? `<text x="${(x + w / 2).toFixed(1)}" y="${(H - h - 4).toFixed(1)}" text-anchor="middle" class="n">${v.n}</text>` : ''}<text x="${(x + w / 2).toFixed(1)}" y="${H + 14}" text-anchor="middle">${v.label}</text>`;
    }).join('')}</svg>`;
  }
  function statGrid(items) {
    return `<div class="fx-statgrid">${items.map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}</div>`;
  }

  function onKey(fn) {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('.curio-modal')) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' && t.type !== 'range' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      fn(e);
    });
  }

  window.FX = { rng, hash, dayKey, daySeed, dayNumber, load, save, sfx, buzz, shake, bump, burst, burstAt, float, floatAt, countUp, copy, medal, badges, tabs, seg, histogram, statGrid, onKey, clamp, reduce };
})();
