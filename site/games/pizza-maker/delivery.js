window.PizzaDelivery = (() => {
  const S = 600, TAU = Math.PI * 2;
  const LANES = [210, 300, 390];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }
  function start(host, opts = {}) {
    return new Promise((resolve) => {
      const wrap = document.createElement('div'); wrap.className = 'pz-dv';
      wrap.innerHTML = `<canvas width="600" height="600" aria-label="Delivery game. Use left and right to dodge, up to speed up."></canvas>
        <div class="pz-dv-ctl"><button type="button" data-d="-1" aria-label="Move left">◀</button><button type="button" data-boost aria-label="Toggle turbo" aria-pressed="false">🚀</button><button type="button" data-d="1" aria-label="Move right">▶</button></div>`;
      host.append(wrap);
      const cv = wrap.querySelector('canvas'), g = cv.getContext('2d');
      const dpr = Math.min(2, devicePixelRatio || 1);
      function size() { const r = cv.getBoundingClientRect(); cv.width = cv.height = Math.max(200, Math.round(r.width * dpr)); }
      size();
      const total = opts.distance || 1500;
      const st = { lane: 1, x: LANES[1], dist: 0, speed: 280, boost: false, cond: 1, coins: 0, t: 0, inv: 0, shake: 0, objs: [], scen: [], spawn: 0, over: false, started: false, count: 3, msg: [], wob: 0 };
      for (let y = -40; y < S + 80; y += 80) st.scen.push(scenery(y));
      function scenery(y) {
        const side = Math.random() < .5 ? 0 : 1;
        const kind = Math.random() < .55 ? 'tree' : Math.random() < .7 ? 'house' : 'bush';
        return { y, side, kind, x: side ? rnd(470, 560) : rnd(40, 130), c: ['#ef476f', '#ffd166', '#118ab2', '#06d6a0', '#f4a261', '#cdb4db'][Math.floor(Math.random() * 6)] };
      }
      function spawnRow() {
        const lanes = Curio.shuffle([0, 1, 2]);
        const n = Math.random() < .25 ? 2 : 1;
        for (let i = 0; i < n; i++) {
          const r = Math.random();
          const type = r < .3 ? 'car' : r < .5 ? 'cone' : r < .65 ? 'hole' : r < .75 ? 'puddle' : 'coin';
          st.objs.push({ type, lane: lanes[i], y: -60, v: type === 'car' ? rnd(.35, .6) : 0, c: ['#3d7cff', '#2fbf7f', '#ffd166', '#8e5cff', '#ef476f', '#7a8590'][Math.floor(Math.random() * 6)], hit: false });
        }
        if (n === 1 && Math.random() < .5) { const l = lanes[2]; for (let k = 0; k < 3; k++) st.objs.push({ type: 'coin', lane: l, y: -60 - k * 46, v: 0 }); }
      }
      let dir = 0;
      const move = (d) => { if (st.over || !st.started) return; const nl = clamp(st.lane + d, 0, 2); if (nl !== st.lane) { st.lane = nl; Curio.beep(500 + nl * 80, .03, 'triangle', .04); } };
      const onKey = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); move(-1); }
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); move(1); }
        else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { e.preventDefault(); st.boost = true; paintBoost(); }
        else if (e.key === ' ') { e.preventDefault(); st.boost = !st.boost; paintBoost(); }
        else if (e.key === 'Escape') finish(false);
      };
      const onKeyUp = (e) => { if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { st.boost = false; paintBoost(); } };
      addEventListener('keydown', onKey); addEventListener('keyup', onKeyUp);
      wrap.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('pointerdown', (e) => { e.preventDefault(); move(+b.dataset.d); }));
      const bb = wrap.querySelector('[data-boost]');
      const paintBoost = () => { bb.setAttribute('aria-pressed', String(st.boost)); bb.style.background = st.boost ? '#ffc233' : ''; };
      bb.addEventListener('click', (e) => { e.preventDefault(); st.boost = !st.boost; paintBoost(); Curio.beep(st.boost ? 660 : 330, .05, 'square', .04); });
      let sx = null;
      cv.addEventListener('pointerdown', (e) => { sx = e.clientX; });
      cv.addEventListener('pointerup', (e) => {
        if (sx == null) return;
        const dx = e.clientX - sx; sx = null;
        if (Math.abs(dx) > 24) move(dx > 0 ? 1 : -1);
        else { const r = cv.getBoundingClientRect(); move(e.clientX - r.left < r.width / 2 ? -1 : 1); }
      });
      function hit(o) {
        if (st.inv > 0) return;
        const dmg = { car: .22, cone: .08, hole: .1, puddle: .04 }[o.type] || 0;
        st.cond = Math.max(0, st.cond - dmg); st.inv = 1.1; st.shake = 14;
        st.msg.push({ t: o.type === 'car' ? 'BONK!' : o.type === 'puddle' ? 'Splash!' : o.type === 'hole' ? 'Bump!' : 'Oof!', y: 440, life: 1, c: '#ff5a36' });
        if (o.type === 'puddle') st.wob = 1;
        Curio.beep(o.type === 'car' ? 110 : 180, .18, 'sawtooth', .07);
        if (navigator.vibrate) try { navigator.vibrate(o.type === 'car' ? 80 : 30); } catch {}
        if (st.cond <= 0) { st.msg.push({ t: 'Pizza destroyed!', y: 300, life: 2, c: '#d64545' }); setTimeout(() => finish(true), 900); st.over = true; }
      }
      let last = performance.now(), raf = 0;
      function loop(now) {
        raf = requestAnimationFrame(loop);
        let dt = Math.min(.05, (now - last) / 1000); last = now;
        if (document.hidden) return;
        if (!st.started) {
          st.count -= dt;
          if (Math.ceil(st.count) !== Math.ceil(st.count + dt)) Curio.beep(st.count <= 0 ? 880 : 440, .1, 'square', .05);
          if (st.count <= 0) st.started = true;
          dt = 0;
        }
        if (!st.over && st.started) {
          st.t += dt;
          st.speed = Math.min(520, 280 + st.t * 6);
          const v = st.speed * (st.boost ? 1.5 : 1);
          st.dist += v * dt / 4;
          st.spawn -= v * dt;
          if (st.spawn <= 0 && st.dist < total - 120) { spawnRow(); st.spawn = rnd(170, 260); }
          st.objs.forEach((o) => { o.y += v * (1 - o.v) * dt; });
          st.scen.forEach((s) => { s.y += v * dt; if (s.y > S + 60) Object.assign(s, scenery(s.y - S - 120)); });
          const px = LANES[st.lane];
          st.x += (px - st.x) * Math.min(1, dt * 14);
          st.objs.forEach((o) => {
            if (o.hit) return;
            const ox = LANES[o.lane], h = o.type === 'car' ? 46 : 22;
            if (Math.abs(ox - st.x) < 34 && Math.abs(o.y - 470) < h) {
              o.hit = true;
              if (o.type === 'coin') { st.coins++; Curio.beep(1200 + (st.coins % 5) * 80, .06, 'triangle', .05); st.msg.push({ t: '+1', y: 430, life: .7, c: '#e6a100', x: ox }); }
              else hit(o);
            }
          });
          st.objs = st.objs.filter((o) => o.y < S + 80 && !(o.hit && o.type === 'coin'));
          if (st.dist >= total) { st.over = true; st.msg.push({ t: 'Delivered!', y: 300, life: 2, c: '#1f9d55' }); [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Curio.beep(f, .12, 'triangle', .07), i * 100)); setTimeout(() => finish(true), 1300); }
        }
        st.inv = Math.max(0, st.inv - dt); st.shake *= .88; st.wob = Math.max(0, st.wob - dt * 1.5);
        st.msg.forEach((m) => { m.life -= dt; m.y -= dt * 40; }); st.msg = st.msg.filter((m) => m.life > 0);
        draw();
      }
      function draw() {
        const k = cv.width / S;
        g.setTransform(k, 0, 0, k, 0, 0);
        g.save();
        if (st.shake > .5) g.translate(rnd(-st.shake, st.shake), rnd(-st.shake, st.shake));
        g.fillStyle = '#7cc46a'; g.fillRect(-20, -20, S + 40, S + 40);
        g.fillStyle = '#d9d2c3'; g.fillRect(140, -20, 20, S + 40); g.fillRect(440, -20, 20, S + 40);
        g.fillStyle = '#4a4e57'; g.fillRect(160, -20, 280, S + 40);
        const off = (st.dist * 4) % 60;
        g.fillStyle = '#f4f4f4';
        [255, 345].forEach((x) => { for (let y = -60 + off; y < S + 60; y += 60) g.fillRect(x - 3, y, 6, 30); });
        g.fillStyle = '#e6a100'; g.fillRect(158, -20, 4, S + 40); g.fillRect(438, -20, 4, S + 40);
        st.scen.forEach((s) => {
          if (s.kind === 'tree') { g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.arc(s.x + 6, s.y + 8, 26, 0, TAU); g.fill(); g.fillStyle = '#2e7d32'; g.beginPath(); g.arc(s.x, s.y, 26, 0, TAU); g.fill(); g.fillStyle = '#43a047'; g.beginPath(); g.arc(s.x - 7, s.y - 7, 14, 0, TAU); g.fill(); }
          else if (s.kind === 'house') { g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(s.x - 30 + 6, s.y - 26 + 8, 60, 52); g.fillStyle = s.c; g.fillRect(s.x - 30, s.y - 26, 60, 52); g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(s.x - 30, s.y - 26); g.lineTo(s.x, s.y); g.lineTo(s.x - 30, s.y + 26); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(s.x - 30, s.y - 2, 60, 4); }
          else { g.fillStyle = '#558b2f'; [[-10, 0], [8, -4], [2, 8]].forEach(([dx, dy]) => { g.beginPath(); g.arc(s.x + dx, s.y + dy, 11, 0, TAU); g.fill(); }); }
        });
        if (st.dist > total - 200) {
          const y = 380 - (total - st.dist) * 4 + 40;
          g.fillStyle = '#ff5a36'; g.fillRect(470, y - 40, 90, 70); g.fillStyle = '#b8392a'; g.beginPath(); g.moveTo(462, y - 40); g.lineTo(515, y - 80); g.lineTo(568, y - 40); g.fill();
          g.fillStyle = '#fff'; g.font = '900 22px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText(String(opts.house || 42), 515, y + 2);
          g.fillStyle = '#f4f4f4'; for (let x = 160; x < 440; x += 40) { g.fillRect(x, y + 10, 20, 12); }
        }
        st.objs.forEach((o) => {
          const x = LANES[o.lane], y = o.y;
          if (o.type === 'car') {
            g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, x - 26 + 4, y - 44 + 6, 52, 88, 14); g.fill();
            g.fillStyle = o.c; rr(g, x - 26, y - 44, 52, 88, 14); g.fill();
            g.fillStyle = '#bfe3ff'; rr(g, x - 20, y - 30, 40, 18, 6); g.fill(); rr(g, x - 20, y + 16, 40, 14, 6); g.fill();
            g.fillStyle = '#fff3b0'; g.fillRect(x - 20, y + 40, 10, 4); g.fillRect(x + 10, y + 40, 10, 4);
          } else if (o.type === 'cone') {
            g.fillStyle = '#ff6d00'; g.beginPath(); g.moveTo(x, y - 18); g.lineTo(x + 14, y + 14); g.lineTo(x - 14, y + 14); g.fill();
            g.fillStyle = '#fff'; g.fillRect(x - 8, y - 2, 16, 5); g.fillStyle = '#e65100'; g.fillRect(x - 18, y + 12, 36, 6);
          } else if (o.type === 'hole') {
            g.fillStyle = '#2a2c31'; g.beginPath(); g.ellipse(x, y, 24, 14, 0, 0, TAU); g.fill(); g.strokeStyle = '#6a6e77'; g.lineWidth = 3; g.stroke();
          } else if (o.type === 'puddle') {
            g.fillStyle = 'rgba(100,170,230,.75)'; g.beginPath(); g.ellipse(x, y, 30, 16, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(x - 8, y - 4, 8, 3, 0, 0, TAU); g.fill();
          } else if (o.type === 'coin') {
            const s = Math.abs(Math.sin(st.t * 6 + y * .02));
            g.fillStyle = '#e6a100'; g.beginPath(); g.ellipse(x, y, 13 * s + 2, 13, 0, 0, TAU); g.fill(); g.fillStyle = '#ffd54f'; g.beginPath(); g.ellipse(x, y, 9 * s + 1, 9, 0, 0, TAU); g.fill();
          }
        });
        const bx = st.x + Math.sin(st.t * 30) * st.wob * 10, by = 470;
        if (!(st.inv > 0 && Math.floor(st.inv * 12) % 2)) {
          g.save(); g.translate(bx, by); g.rotate((LANES[st.lane] - st.x) * -.004 + st.wob * Math.sin(st.t * 30) * .2);
          g.fillStyle = 'rgba(0,0,0,.25)'; rr(g, -16 + 4, -40 + 6, 32, 84, 12); g.fill();
          g.fillStyle = '#222'; rr(g, -7, -44, 14, 18, 5); g.fill(); rr(g, -7, 30, 14, 18, 5); g.fill();
          g.fillStyle = '#d62828'; rr(g, -15, -34, 30, 70, 12); g.fill();
          g.fillStyle = '#9aa4ad'; g.fillRect(-22, -30, 44, 5);
          g.fillStyle = '#f2d48f'; rr(g, -18, 8, 36, 32, 4); g.fill(); g.strokeStyle = '#c9a25a'; g.lineWidth = 2; g.stroke();
          g.fillStyle = '#d62828'; g.font = '900 12px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('PIZZA', 0, 29);
          g.fillStyle = '#ffd166'; g.beginPath(); g.arc(0, -8, 12, 0, TAU); g.fill(); g.fillStyle = '#1d1b19'; g.fillRect(-9, -16, 18, 6);
          if (st.boost && st.started && !st.over) { g.fillStyle = 'rgba(255,170,40,.8)'; g.beginPath(); g.moveTo(-6, 48); g.lineTo(0, 70 + Math.random() * 14); g.lineTo(6, 48); g.fill(); }
          g.restore();
        }
        g.restore();
        g.fillStyle = 'rgba(29,27,25,.75)'; rr(g, 12, 12, 576, 46, 14); g.fill();
        g.fillStyle = '#fff'; g.font = '800 18px system-ui, sans-serif'; g.textAlign = 'left';
        g.fillText(`🍕 ${Math.round(st.cond * 100)}%`, 26, 42);
        g.fillText(`🪙 ${st.coins}`, 150, 42);
        g.fillText(`⏱ ${st.t.toFixed(1)}s`, 240, 42);
        g.fillStyle = 'rgba(255,255,255,.2)'; rr(g, 360, 28, 210, 12, 6); g.fill();
        g.fillStyle = '#ffd166'; rr(g, 360, 28, 210 * clamp(st.dist / total, 0, 1), 12, 6); g.fill();
        g.fillText('🏠', 548, 22 + 24);
        st.msg.forEach((m) => { g.globalAlpha = clamp(m.life, 0, 1); g.fillStyle = m.c; g.font = '900 34px system-ui, sans-serif'; g.textAlign = 'center'; g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeText(m.t, m.x || 300, m.y); g.fillText(m.t, m.x || 300, m.y); g.globalAlpha = 1; });
        if (!st.started) {
          g.fillStyle = 'rgba(29,27,25,.55)'; g.fillRect(0, 0, S, S);
          g.fillStyle = '#fff'; g.textAlign = 'center'; g.font = '900 30px system-ui, sans-serif'; g.fillText(`Deliver to No. ${opts.house || 42}`, 300, 220);
          g.font = '700 18px system-ui, sans-serif'; g.fillText('Dodge cars, cones and potholes. Grab coins.', 300, 256); g.fillText('◀ ▶, A/D or swipe to steer · 🚀 or Space for turbo', 300, 282);
          g.font = '900 90px system-ui, sans-serif'; g.fillText(String(Math.max(1, Math.ceil(st.count))), 300, 390);
        }
      }
      let done = false;
      function finish(arrived) {
        if (done) return; done = true;
        cancelAnimationFrame(raf);
        removeEventListener('keydown', onKey); removeEventListener('keyup', onKeyUp);
        removeEventListener('resize', size);
        wrap.remove();
        resolve({ arrived: arrived && st.cond > 0, cond: st.cond, coins: st.coins, time: st.t });
      }
      addEventListener('resize', size);
      raf = requestAnimationFrame(loop);
    });
  }
  return { start };
})();
