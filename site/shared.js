(function () {
  const slug = document.body?.dataset.game || '';
  const game = (window.CURIO_GAMES || []).find((g) => g.slug === slug);
  const root = slug ? '../../' : './';

  const store = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(`curio:${key}`);
        return raw == null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(`curio:${key}`, JSON.stringify(value)); } catch {}
    }
  };

  function applyTheme(t) {
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
  }
  applyTheme(store.get('theme', 'auto'));
  const isDark = () => {
    const t = document.documentElement.dataset.theme;
    if (t) return t === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  };

  let muted = store.get('muted', false);
  let touchpad = store.get('touchpad', false);
  const applyTouchpad = () => document.documentElement.classList.toggle('curio-touchpad', touchpad);
  applyTouchpad();
  function setTouchpad(on) {
    touchpad = !!on;
    store.set('touchpad', touchpad);
    applyTouchpad();
    window.dispatchEvent(new CustomEvent('curio:touchpad', { detail: touchpad }));
  }

  function bar() {
    if (document.body.dataset.nobar != null) return;
    const el = document.createElement('header');
    el.className = 'curio-bar';
    el.innerHTML = `
      <a class="curio-bar__home" href="${root}index.html" aria-label="All games">
        <span class="curio-bar__logo">✦</span><span>Zoble</span>
      </a>
      <div class="curio-bar__title"></div>
      <button class="curio-bar__btn" data-act="touchpad" type="button"></button>
      <button class="curio-bar__btn" data-act="sound" type="button"></button>
      <button class="curio-bar__btn" data-act="theme" type="button" aria-label="Toggle dark mode"></button>
      ${slug ? `<a class="curio-bar__btn" data-act="random" href="#" aria-label="Random game" title="Random game">🎲</a>` : ''}`;
    el.querySelector('.curio-bar__title').textContent = game ? game.title : '';
    const sound = el.querySelector('[data-act="sound"]');
    const paintSound = () => { sound.textContent = muted ? '🔇' : '🔊'; sound.setAttribute('aria-label', muted ? 'Unmute' : 'Mute'); };
    paintSound();
    sound.addEventListener('click', () => { muted = !muted; store.set('muted', muted); paintSound(); });
    const pad = el.querySelector('[data-act="touchpad"]');
    const paintPad = () => {
      pad.textContent = touchpad ? '👆' : '🖱️';
      pad.setAttribute('aria-pressed', String(touchpad));
      pad.setAttribute('aria-label', 'Touchpad mode');
      pad.title = touchpad ? 'Touchpad mode on: click once to grab or draw, click again to let go' : 'Touchpad mode off';
    };
    paintPad();
    pad.addEventListener('click', () => {
      setTouchpad(!touchpad); paintPad();
      toast(touchpad ? 'Touchpad mode on: click to start a drag, click again to let go' : 'Touchpad mode off', 2600);
    });
    window.addEventListener('curio:touchpad', paintPad);
    const theme = el.querySelector('[data-act="theme"]');
    const paintTheme = () => { theme.textContent = isDark() ? '☀️' : '🌙'; };
    paintTheme();
    theme.addEventListener('click', () => {
      const next = isDark() ? 'light' : 'dark';
      store.set('theme', next); applyTheme(next); paintTheme();
      window.dispatchEvent(new CustomEvent('curio:theme', { detail: next }));
    });
    el.querySelector('[data-act="random"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      const others = (window.CURIO_READY || []).filter((g) => g.slug !== slug);
      const pick = others[Math.floor(Math.random() * others.length)];
      if (pick) location.href = `${root}games/${pick.slug}/index.html`;
    });
    document.body.prepend(el);
    document.body.classList.add('curio-has-bar');
  }

  let audio = null;
  function ctx() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audio = new AC();
    }
    if (audio.state === 'suspended') audio.resume();
    return audio;
  }
  function beep(freq = 440, duration = 0.08, type = 'sine', volume = 0.15) {
    if (muted) return;
    const ac = ctx(); if (!ac) return;
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(t); osc.stop(t + duration + 0.02);
  }

  let toastEl = null, toastTimer = 0;
  function toast(text, ms = 1800) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'curio-toast'; toastEl.setAttribute('role', 'status'); document.body.append(toastEl); }
    toastEl.textContent = text;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), ms);
  }

  function modal({ emoji = '', title = '', body = '', buttons = [{ label: 'Play again', value: 'again' }] } = {}) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div');
      wrap.className = 'curio-modal';
      wrap.innerHTML = `<div class="curio-modal__box" role="dialog" aria-modal="true">
        <div class="curio-modal__emoji"></div><div class="curio-modal__title"></div>
        <p class="curio-modal__body"></p><div class="c-row"></div></div>`;
      wrap.querySelector('.curio-modal__emoji').textContent = emoji;
      wrap.querySelector('.curio-modal__title').textContent = title;
      const b = wrap.querySelector('.curio-modal__body');
      if (body instanceof Node) b.append(body); else b.textContent = body;
      const row = wrap.querySelector('.c-row');
      buttons.forEach((btn, i) => {
        const el = document.createElement('button');
        el.type = 'button';
        el.className = i === 0 ? 'c-btn' : 'c-btn c-btn--ghost';
        el.textContent = btn.label;
        el.addEventListener('click', () => { wrap.remove(); resolve(btn.value); });
        row.append(el);
      });
      document.body.append(wrap);
      row.querySelector('button')?.focus();
    });
  }

  function confetti(count = 120) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const c = document.createElement('canvas');
    c.className = 'curio-confetti';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    c.style.width = '100%'; c.style.height = '100%';
    document.body.append(c);
    const g = c.getContext('2d'); g.scale(dpr, dpr);
    const colors = ['#ff5a36', '#ffc233', '#2ecc71', '#3498db', '#9b59b6', '#ff6fb5'];
    const bits = Array.from({ length: count }, () => ({
      x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .35,
      vx: (Math.random() - .5) * 14, vy: -Math.random() * 14 - 4,
      r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
      c: colors[(Math.random() * colors.length) | 0]
    }));
    let frames = 0;
    (function tick() {
      g.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of bits) {
        p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
      }
      if (++frames < 180) requestAnimationFrame(tick); else c.remove();
    })();
  }

  function best(key, score, higherIsBetter = true) {
    const k = `best:${slug || 'hub'}:${key}`;
    const prev = store.get(k, null);
    const isNew = prev == null || (higherIsBetter ? score > prev : score < prev);
    if (isNew) store.set(k, score);
    return { best: isNew ? score : prev, isNew };
  }
  const getBest = (key) => store.get(`best:${slug || 'hub'}:${key}`, null);

  function drag(el, { start, move, end } = {}) {
    let active = null;
    let latched = false;
    let downAt = null;
    let moved = false;
    const at = (e) => {
      const r = el.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, clientX: e.clientX, clientY: e.clientY, pressure: e.pressure || 0.5, pointerType: e.pointerType, event: e };
    };
    const finish = (e) => {
      if (active == null) return;
      active = null;
      latched = false;
      el.classList.remove('curio-latched');
      end?.(e ? at(e) : null);
    };
    const onDown = (e) => {
      if (e.button != null && e.button > 0) return;
      if (latched) { e.preventDefault(); finish(e); return; }
      active = e.pointerId;
      downAt = { x: e.clientX, y: e.clientY };
      moved = false;
      try { el.setPointerCapture(e.pointerId); } catch {}
      start?.(at(e));
    };
    const onMove = (e) => {
      if (latched) { move?.(at(e)); return; }
      if (active !== e.pointerId) return;
      if (downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) moved = true;
      move?.(at(e));
    };
    const onUp = (e) => {
      if (active !== e.pointerId || latched) return;
      if (touchpad && e.pointerType === 'mouse' && !moved) {
        latched = true;
        el.classList.add('curio-latched');
        try { el.releasePointerCapture(e.pointerId); } catch {}
        return;
      }
      finish(e);
    };
    const onOutside = (e) => { if (latched && !el.contains(e.target)) finish(null); };
    const onKey = (e) => { if (e.key === 'Escape' && latched) finish(null); };
    const onBlur = () => { if (latched) finish(null); };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    window.addEventListener('blur', onBlur);
    window.addEventListener('pointerdown', onOutside, true);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('pointerdown', onOutside, true);
    };
  }

  if (slug) {
    const played = store.get('played', {});
    played[slug] = Date.now();
    store.set('played', played);
  }

  window.Curio = {
    slug, game, store, beep, toast, modal, confetti, best, getBest, isDark,
    get muted() { return muted; },
    get touchpad() { return touchpad; },
    setTouchpad, drag,
    audioContext: ctx,
    rand: (a, b) => a + Math.random() * (b - a),
    randInt: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
    shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    fmt: (n, d = 0) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d })
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bar);
  else bar();
})();
