(() => {
  const WTP = window.WTP;
  const C = WTP.C;
  const held = new Set();
  const pending = {};
  const I = {
    mouse: { x: 0, y: 0, in: false, lastMove: 0 },
    aim: { x: 1, y: 0, src: 'auto' },
    stickL: { x: 0, y: 0, id: null },
    stickR: { x: 0, y: 0, id: null },
    touchBtns: {},
    pointerFire: false, fireLock: false, gp: null, gpPrev: [], gpAxes: [0, 0, 0, 0], lastGp: 0, lastKey: 0,
    enabled: false, capture: null, isTouch: WTP.isTouchDevice(), wheelAcc: 0, zoomReq: 0
  };
  WTP.input = I;
  if (I.isTouch) document.body.classList.add('is-touch');
  window.addEventListener('touchstart', () => { if (!I.isTouch) { I.isTouch = true; document.body.classList.add('is-touch'); } }, { passive: true });

  const keymap = () => WTP.save.keys;
  const actionsFor = (code) => { const out = []; const m = keymap(); for (const a in m) if (m[a].includes(code)) out.push(a); return out; };
  I.down = (a) => { const codes = keymap()[a] || []; for (const c of codes) if (held.has(c)) return true; return !!I.touchBtns[a] || gpDown(a); };
  I.take = (a) => { const v = pending[a]; pending[a] = false; return !!v; };
  I.press = (a) => { pending[a] = true; };
  I.clear = () => { held.clear(); for (const k in pending) pending[k] = false; I.pointerFire = false; I.touchBtns = {}; };
  const AIMKEYS = { KeyI: [0, -1], KeyK: [0, 1], KeyJ: [-1, 0], KeyL: [1, 0] };
  const BLOCK = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'];

  window.addEventListener('keydown', (e) => {
    if (I.capture) { e.preventDefault(); const fn = I.capture; I.capture = null; fn(e.code); return; }
    if (!I.enabled) return;
    if (WTP.game?.paused || (WTP.ui?.wheelOpen?.())) return;
    const tg = e.target;
    if (tg && (tg.tagName === 'TEXTAREA' || tg.tagName === 'INPUT' || tg.tagName === 'SELECT')) return;
    if (BLOCK.includes(e.code) || AIMKEYS[e.code]) e.preventDefault();
    I.lastKey = performance.now();
    if (AIMKEYS[e.code]) I.aim.src = 'keys';
    if (e.repeat) { held.add(e.code); return; }
    held.add(e.code);
    for (const a of actionsFor(e.code)) pending[a] = true;
    if (/^Digit[0-9]$/.test(e.code)) pending.slot = Number(e.code.slice(5));
    if (e.code === 'KeyV') { I.fireLock = !I.fireLock; WTP.game?.label?.(I.fireLock ? 'FIRE LOCK ON (V)' : 'FIRE LOCK OFF', 900); }
  });
  window.addEventListener('keyup', (e) => { held.delete(e.code); });
  window.addEventListener('blur', () => { held.clear(); I.pointerFire = false; });

  function keyAim() {
    let x = 0, y = 0;
    for (const c in AIMKEYS) if (held.has(c)) { x += AIMKEYS[c][0]; y += AIMKEYS[c][1]; }
    return x || y ? [x, y] : null;
  }
  I.keyAim = keyAim;

  let detach = null;
  I.bindCanvas = (cv) => {
    cv.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.pointerType === 'pen') { const r = cv.getBoundingClientRect(); I.mouse.x = e.clientX - r.left; I.mouse.y = e.clientY - r.top; I.mouse.in = true; I.mouse.lastMove = performance.now(); I.aim.src = 'mouse'; } });
    cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') I.mouse.in = I.pointerFire || I.mouse.in; });
    const toggleMode = () => WTP.save.settings.toggleFire && !C.touchpad;
    const startFire = (p) => {
      if (p.pointerType === 'touch') return;
      I.mouse.x = p.x; I.mouse.y = p.y; I.mouse.in = true; I.aim.src = 'mouse'; I.mouse.lastMove = performance.now();
      C.audioContext && C.audioContext();
      if (toggleMode()) I.pointerFire = !I.pointerFire; else I.pointerFire = true;
      cv.focus({ preventScroll: true });
    };
    const moveFire = (p) => { if (p.pointerType === 'touch') return; I.mouse.x = p.x; I.mouse.y = p.y; I.mouse.in = true; I.mouse.lastMove = performance.now(); };
    const endFire = () => { if (!toggleMode()) I.pointerFire = false; };
    if (C.drag) detach = C.drag(cv, { start: startFire, move: moveFire, end: endFire });
    else {
      cv.addEventListener('pointerdown', (e) => { if (e.button === 0) { const r = cv.getBoundingClientRect(); startFire({ x: e.clientX - r.left, y: e.clientY - r.top, pointerType: e.pointerType }); } });
      window.addEventListener('pointerup', () => endFire());
    }
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => { if (e.button === 2) pending.alt = true; });
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.ctrlKey) { I.zoomReq += e.deltaY; return; }
      I.wheelAcc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      const TH = e.deltaMode === 1 ? 3 : 70;
      if (Math.abs(I.wheelAcc) >= TH) { pending[I.wheelAcc > 0 ? 'next' : 'prev'] = true; I.wheelAcc = 0; }
    }, { passive: false });
  };

  function bindStick(el, s, onDown, onUp) {
    const knob = el.querySelector('i');
    const upd = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width / 2), dy = (e.clientY - cy) / (r.height / 2);
      const m = Math.hypot(dx, dy);
      if (m > 1) { dx /= m; dy /= m; }
      s.x = dx; s.y = dy;
      knob.style.transform = `translate(${Math.round(dx * r.width * 0.3)}px, ${Math.round(dy * r.height * 0.3)}px)`;
    };
    el.addEventListener('pointerdown', (e) => { e.preventDefault(); s.id = e.pointerId; try { el.setPointerCapture(e.pointerId); } catch (er) { } el.classList.add('is-on'); C.audioContext && C.audioContext(); upd(e); onDown && onDown(); });
    el.addEventListener('pointermove', (e) => { if (e.pointerId === s.id) upd(e); });
    const end = (e) => { if (e.pointerId !== s.id) return; s.id = null; s.x = 0; s.y = 0; knob.style.transform = ''; el.classList.remove('is-on'); onUp && onUp(); };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }
  I.bindTouch = (els) => {
    bindStick(els.stickL, I.stickL);
    bindStick(els.stickR, I.stickR, () => { I.aim.src = 'stick'; });
    for (const [el, act] of els.buttons) {
      const dn = (e) => { e.preventDefault(); I.touchBtns[act] = true; pending[act] = true; el.classList.add('is-on'); C.audioContext && C.audioContext(); };
      const up = () => { I.touchBtns[act] = false; el.classList.remove('is-on'); };
      el.addEventListener('pointerdown', dn);
      el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    }
  };

  const GP = { jump: [0], dash: [1, 2], alt: [6], fire: [7], prev: [4], next: [5], wheel: [3], reset: [8], pause: [9] };
  function gpDown(a) {
    const g = I.gp;
    if (!g) return false;
    const b = GP[a];
    if (b) for (const k of b) if (g.buttons[k] && (g.buttons[k].pressed || g.buttons[k].value > 0.5)) return true;
    return false;
  }
  I.pollPad = () => {
    let pads = [];
    try { pads = navigator.getGamepads ? navigator.getGamepads() : []; } catch (e) { pads = []; }
    let g = null;
    for (const p of pads || []) if (p && p.connected) { g = p; break; }
    I.gp = g;
    if (!g) return;
    const prev = I.gpPrev;
    const now = g.buttons.map((b) => b.pressed || b.value > 0.5);
    for (const a in GP) for (const k of GP[a]) if (now[k] && !prev[k]) pending[a] = true;
    if (now[12] && !prev[12]) pending.navUp = true;
    if (now[13] && !prev[13]) pending.navDown = true;
    if (now[14] && !prev[14]) pending.navLeft = true;
    if (now[15] && !prev[15]) pending.navRight = true;
    if (now[0] && !prev[0]) pending.navOk = true;
    if (now[1] && !prev[1]) pending.navBack = true;
    I.gpPrev = now;
    const dz = (v) => (Math.abs(v) < 0.18 ? 0 : v);
    I.gpAxes = [dz(g.axes[0] || 0), dz(g.axes[1] || 0), dz(g.axes[2] || 0), dz(g.axes[3] || 0)];
    if (now.some(Boolean) || I.gpAxes.some((v) => v)) { I.lastGp = performance.now(); if (Math.hypot(I.gpAxes[2], I.gpAxes[3]) > 0.3) I.aim.src = 'pad'; }
  };
  I.moveX = () => {
    let mx = 0;
    if (I.down('left')) mx -= 1;
    if (I.down('right')) mx += 1;
    if (Math.abs(I.stickL.x) > 0.22) mx = Math.max(-1, Math.min(1, I.stickL.x * 1.4));
    if (Math.abs(I.gpAxes[0]) > 0.2) mx = I.gpAxes[0];
    if (I.gp && I.gp.buttons[14]?.pressed && !mx) mx = -1;
    if (I.gp && I.gp.buttons[15]?.pressed && !mx) mx = 1;
    return mx;
  };
  I.downHeld = () => I.down('down') || I.stickL.y > 0.7 || I.gpAxes[1] > 0.7;
  I.jumpHeld = () => I.down('jump') || I.stickL.y < -0.62 || !!I.touchBtns.jump;
  I.wantFire = () => I.pointerFire || I.fireLock || I.down('fire') || held.has('Enter') || held.has('NumpadEnter') || (I.stickR.id != null && Math.hypot(I.stickR.x, I.stickR.y) > 0.35) || !!I.touchBtns.fire;
  I.gpNav = (a) => I.take(a);
})();
