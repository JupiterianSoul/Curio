window.HM = window.HM || {};
(() => {
  const W = 1500, H = 1000;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mk = (w = W, h = H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  function makeSampler(spacing, emit, K = .5) {
    let sm, raw, pPrev, mPrev, left = 0, vel = 0, prS = null;
    function walk(x0, y0, cx, cy, x1, y1, pa, pb) {
      const est = Math.hypot(cx - x0, cy - y0) + Math.hypot(x1 - cx, y1 - cy);
      const n = Math.max(1, Math.ceil(est / 1.5));
      let px = x0, py = y0;
      for (let i = 1; i <= n; i++) {
        const t = i / n, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        let d = Math.hypot(x - px, y - py), sp = spacing();
        while (d > 0 && left + d >= sp) {
          const f = (sp - left) / d;
          px += (x - px) * f; py += (y - py) * f;
          emit(px, py, pa == null ? null : pa + (pb - pa) * t, vel, false);
          d = Math.hypot(x - px, y - py); left = 0; sp = spacing();
        }
        left += d; px = x; py = y;
      }
    }
    return {
      begin(p) { raw = p; sm = { x: p.x, y: p.y }; pPrev = sm; mPrev = sm; left = 0; vel = 0; prS = p.pr; emit(p.x, p.y, p.pr, 0, true); },
      move(p) {
        const dt = Math.max(1, p.t - raw.t);
        vel += (Math.min(Math.hypot(p.x - raw.x, p.y - raw.y) / dt, 8) - vel) * .3; raw = p;
        const prOld = prS; prS = p.pr == null ? null : (prS == null ? p.pr : prS + (p.pr - prS) * .5);
        sm = { x: sm.x + (p.x - sm.x) * K, y: sm.y + (p.y - sm.y) * K };
        const mid = { x: (pPrev.x + sm.x) / 2, y: (pPrev.y + sm.y) / 2 };
        walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, mid.x, mid.y, prOld, prS);
        mPrev = mid; pPrev = sm;
      },
      end() { if (raw) walk(mPrev.x, mPrev.y, pPrev.x, pPrev.y, raw.x, raw.y, prS, prS); },
      decay(f) { vel *= f; },
      get vel() { return vel; }
    };
  }

  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const ui = {
    field(label, side) {
      const f = h('div', 'hm-field');
      const l = h('div', 'hm-lab'); l.append(label);
      const s = h('span'); if (side != null) s.textContent = side; l.append(s);
      f.append(l); f.side = s;
      return f;
    },
    seg(items, current, onPick, label) {
      const el = h('div', 'hm-seg'); el.setAttribute('role', 'group'); if (label) el.setAttribute('aria-label', label);
      const btns = items.map((it) => {
        const b = h('button'); b.type = 'button'; b.dataset.id = it.id; b.innerHTML = it.label; if (it.title) b.title = it.title;
        b.addEventListener('click', () => onPick(it.id)); el.append(b); return b;
      });
      const set = (id) => btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === String(id))));
      set(current);
      return { el, set };
    },
    slider(min, max, val, onInput, label, step = 1) {
      const el = h('input'); el.type = 'range'; el.min = min; el.max = max; el.step = step; el.value = val; el.setAttribute('aria-label', label || 'Size');
      el.addEventListener('input', () => onInput(+el.value));
      return { el, set: (v) => { el.value = v; } };
    },
    swatches(colors, cls, onPick, cols) {
      const el = h('div', 'hm-sw ' + (cls || ''));
      if (cols) el.style.setProperty('--cols', cols);
      const btns = colors.map((c, i) => {
        const b = h('button'); b.type = 'button'; b.style.background = c.hex; b.title = c.name; b.setAttribute('aria-label', c.name);
        b.innerHTML = '<b></b>';
        b.addEventListener('click', () => onPick(i)); el.append(b); return b;
      });
      const set = (sel) => btns.forEach((b, i) => b.setAttribute('aria-pressed', String(Array.isArray(sel) ? sel.includes(i) : i === sel)));
      return { el, set, btns };
    },
    btn(label, onClick, cls) { const b = h('button', 'hm-btn ' + (cls || '')); b.type = 'button'; b.innerHTML = label; b.addEventListener('click', onClick); return b; }
  };

  function noiseBuffer(ac, secs, shape) {
    const len = Math.floor(ac.sampleRate * secs), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { const r = Math.random() * 2 - 1; if (shape === 'brown') { last = last * .6 + r * .4; d[i] = last; } else d[i] = r; }
    return b;
  }
  const audio = () => (!Curio.muted && Curio.audioContext ? Curio.audioContext() : null);

  HM.kit = { W, H, clamp, mk, makeSampler, ui, h, noiseBuffer, audio, adv: () => Curio.advanced };
})();
