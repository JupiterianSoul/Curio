(() => {
  const WTP = window.WTP;
  const { P32, rand, pick } = WTP;
  const SP = WTP.sprites;
  const W = () => WTP.world, FX = () => WTP.fx, G = () => WTP.game, PL = () => WTP.player;
  const A = (n, x) => WTP.audio.play(n, x);
  const list = [], bullets = [], pickups = [];
  const TYPES = {
    ad: { spr: 'ad', hp: 45, w: 22, h: 14, score: 150, label: 'POP-UP AD', fly: true, speed: 38, text: ['WIN!!', 'FREE', 'HOT!', 'SALE'] },
    captcha: { spr: 'captcha', hp: 28, w: 13, h: 12, score: 120, label: 'CAPTCHA', fly: false, speed: 50 },
    cookie: { spr: 'cookie', hp: 80, w: 37, h: 8, score: 220, label: 'COOKIE BANNER', fly: true, speed: 30 },
    cursor: { spr: 'cursor', hp: 10, w: 7, h: 11, score: 60, label: 'CURSOR DRONE', fly: true, speed: 70 },
    modal: { spr: 'modal', hp: 900, w: 44, h: 23, score: 2500, label: 'NEWSLETTER MODAL', fly: true, speed: 20, boss: true }
  };
  const whiteCache = new Map();
  const whiteOf = (sp) => { let c = whiteCache.get(sp); if (!c) { c = SP.toCanvas(SP.tint(sp.out, P32['7'])); whiteCache.set(sp, c); } return c; };
  const iceCache = new Map();
  const iceOf = (sp) => { let c = iceCache.get(sp); if (!c) { const px = sp.out.px.map((v) => (v ? (v === P32['0'] ? v : WTP.mix(v, P32.C, 0.6)) : 0)); c = SP.toCanvas({ w: sp.out.w, h: sp.out.h, px }); iceCache.set(sp, c); } return c; };

  function spawn(type, x, y, o = {}) {
    const T = TYPES[type];
    const e = {
      type, T, x, y, vx: 0, vy: 0, hp: T.hp * (o.hpMul || 1), maxHp: T.hp * (o.hpMul || 1), t: rand(0, 2), cd: rand(1, 2.5), flash: 0, dead: false, freeze: 0, burn: 0, ground: false,
      text: T.text ? pick(T.text) : null, dir: x < (PL().x) ? 1 : -1, phase: 0, spawnT: 0.5,
      damage(d, cause) {
        if (this.dead || this.spawnT > 0.2) return;
        this.hp -= d * (this.freeze > 0 ? 1.5 : 1);
        this.flash = 0.08;
        if (d >= 8) FX().pop(this.x + rand(-4, 4), this.y - this.T.h / 2 - 2, `${Math.round(d)}`, { scale: 1, ramp: ['7', 'Y', 'y'], life: 0.6, vy: -40 });
        if (this.hp <= 0) kill(this, cause);
      }
    };
    list.push(e);
    for (let k = 0; k < 14; k++) FX().spark(x + rand(-T.w / 2, T.w / 2), y + rand(-T.h / 2, T.h / 2), rand(-40, 40), rand(-40, 40), P32['7'], 0.3);
    A('popup');
    return e;
  }
  function kill(e, cause) {
    e.dead = true;
    const T = e.T;
    const sp = SP.ENEMY[T.spr];
    const out = sp.out;
    const x0 = Math.round(e.x - out.w / 2), y0 = Math.round(e.y - out.h / 2);
    for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) {
      const c = out.px[y * out.w + x];
      if (!c || Math.random() > 0.55) continue;
      const dx = x - out.w / 2, dy = y - out.h / 2, d = Math.hypot(dx, dy) || 1;
      FX().debris(x0 + x, y0 + y, (dx / d) * rand(40, 140), (dy / d) * rand(40, 140) - 60, c, { ns: Math.random() < 0.5 });
    }
    FX().explosion(e.x, e.y, T.boss ? 30 : 9);
    if (T.boss) { G()?.slowmo?.(0.3, 1.2); G()?.chroma?.(1); FX().flash(0.8, '#ff5fa2'); for (let k = 0; k < 6; k++) setTimeout(() => WTP.weapons.explode(e.x + rand(-25, 25), e.y + rand(-15, 15), 14, { noPush: true }), k * 150); }
    A('enemyDie');
    G()?.shake?.(T.boss ? 20 : 5);
    G()?.enemyKilled?.(e, cause);
    if (Math.random() < (T.boss ? 1 : 0.12)) pickups.push({ t: 'heart', x: e.x, y: e.y, vx: rand(-40, 40), vy: -120, life: 12 });
    const n = T.boss ? 20 : 3 + ((Math.random() * 4) | 0);
    for (let k = 0; k < n; k++) pickups.push({ t: 'scrap', x: e.x, y: e.y, vx: rand(-90, 90), vy: rand(-160, -60), life: 10 });
  }
  function shoot(e, ang, sp, spr, o = {}) {
    bullets.push({ x: e.x, y: e.y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, spr, life: o.life || 4, homing: o.homing || 0, g: o.g || 0, boom: o.boom || 0 });
    A('enemyShot');
  }
  function update(dt) {
    const P = PL(), pc = P.center();
    const Wd = W();
    for (let k = list.length - 1; k >= 0; k--) {
      const e = list[k];
      if (e.dead) { list.splice(k, 1); continue; }
      const T = e.T;
      e.t += dt; e.flash = Math.max(0, e.flash - dt); e.spawnT = Math.max(0, e.spawnT - dt);
      const slow = e.freeze > 0 ? 0.35 : 1;
      e.freeze = Math.max(0, e.freeze - dt);
      if (e.burn > 0) { e.burn -= dt; e.damage(12 * dt, 'fire'); if (Math.random() < 0.3) FX().flame(e.x + rand(-T.w / 2, T.w / 2), e.y); }
      e.cd -= dt * slow;
      const dx = pc.x - e.x, dy = pc.y - e.y, d = Math.hypot(dx, dy) || 1;
      if (e.type === 'ad') {
        const tx = pc.x + Math.sin(e.t * 0.7) * 60, ty = pc.y - 45 + Math.sin(e.t * 1.3) * 12;
        e.vx += ((tx - e.x) * 1.2 - e.vx) * dt * 2 * slow; e.vy += ((ty - e.y) * 1.2 - e.vy) * dt * 2 * slow;
        if (e.cd <= 0) { e.cd = rand(1.8, 2.6); for (let q = -1; q <= 1; q++) shoot(e, Math.atan2(dy, dx) + q * 0.25, 75, 'coin', { homing: 0.6, life: 4 }); }
      } else if (e.type === 'captcha') {
        e.vy += 520 * dt;
        if (e.ground && e.cd <= 0) {
          e.cd = rand(1.4, 2.2);
          if (Math.random() < 0.55) { e.vy = -rand(160, 230); e.vx = Math.sign(dx) * rand(40, 80); }
          else for (let q = -2; q <= 2; q++) shoot(e, Math.atan2(dy - 10, dx) + q * 0.18, 120, 'check', { g: 80 });
        }
        if (e.ground) e.vx *= Math.pow(0.02, dt);
      } else if (e.type === 'cookie') {
        e.vx = e.dir * T.speed * slow;
        const ty = (G()?.camTop?.() ?? 0) + 22;
        e.vy = (ty - e.y) * 2;
        const v = G()?.view?.();
        if (v && (e.x < v.x + 20 || e.x > v.x + v.w - 20)) { if ((e.x < v.x + 20 && e.dir < 0) || (e.x > v.x + v.w - 20 && e.dir > 0)) e.dir *= -1; }
        if (e.cd <= 0) { e.cd = rand(0.9, 1.4); bullets.push({ x: e.x + rand(-14, 14), y: e.y + 6, vx: rand(-20, 20), vy: 20, spr: 'cookie', life: 6, g: 300, boom: 7 }); A('throw'); }
      } else if (e.type === 'cursor') {
        e.phase += dt;
        if (e.mode === 'dash') {
          if (e.phase > 0.5) { e.mode = null; e.phase = 0; }
        } else {
          const tx = pc.x + Math.cos(e.t * 2 + e.x) * 30, ty = pc.y - 30 + Math.sin(e.t * 2.6) * 14;
          e.vx += ((tx - e.x) * 2 - e.vx) * dt * 3 * slow; e.vy += ((ty - e.y) * 2 - e.vy) * dt * 3 * slow;
          if (e.cd <= 0 && d < 110) { e.cd = rand(1.6, 2.6); e.mode = 'dash'; e.phase = 0; e.vx = (dx / d) * 230; e.vy = (dy / d) * 230; A('hover'); }
        }
      } else if (e.type === 'modal') {
        const v = G()?.view?.();
        const tx = v ? v.x + v.w / 2 + Math.sin(e.t * 0.5) * v.w * 0.25 : e.x, ty = (G()?.camTop?.() ?? e.y) + 40 + Math.sin(e.t) * 8;
        e.vx += ((tx - e.x) - e.vx) * dt * slow; e.vy += ((ty - e.y) - e.vy) * dt * slow;
        if (e.cd <= 0) {
          const ph = e.hp < e.maxHp * 0.5 ? 2 : 1;
          e.cd = ph === 2 ? 1.4 : 2.2;
          const n = ph === 2 ? 16 : 10, off = e.t;
          for (let q = 0; q < n; q++) shoot(e, (q / n) * Math.PI * 2 + off, 70, 'mail', { life: 5 });
          if (Math.random() < 0.4 && list.length < 14) { spawn('cursor', e.x - 20, e.y); spawn('cursor', e.x + 20, e.y); }
        }
      }
      const steps = Math.max(1, Math.ceil(Math.hypot(e.vx, e.vy) * dt));
      e.ground = false;
      for (let s = 0; s < steps; s++) {
        const nx = e.x + (e.vx * dt) / steps, ny = e.y + (e.vy * dt) / steps;
        if (!T.fly) {
          if (box(nx, e.y, T)) { e.vx = -e.vx * 0.3; } else e.x = nx;
          if (box(e.x, ny, T)) { if (e.vy > 0) e.ground = true; e.vy = 0; } else e.y = ny;
        } else { e.x = nx; e.y = ny; }
      }
      if (!T.fly) { let g = 0; while (box(e.x, e.y, T) && g++ < 20) e.y -= 1; }
      if (e.y > Wd.h + 40) { e.dead = true; continue; }
      if (Math.abs(pc.x - e.x) < T.w / 2 + 3 && Math.abs(pc.y - e.y) < T.h / 2 + 6) { if (P.hurt(1, e.x) && e.type === 'cursor') { e.vx *= -1; e.vy = -100; } }
    }
    for (let k = bullets.length - 1; k >= 0; k--) {
      const b = bullets[k];
      b.life -= dt;
      if (b.homing) { const dx = pc.x - b.x, dy = pc.y - b.y, d = Math.hypot(dx, dy) || 1; b.vx += (dx / d) * 90 * b.homing * dt; b.vy += (dy / d) * 90 * b.homing * dt; }
      b.vy += b.g * dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      let dead = b.life <= 0;
      if (!dead && Math.abs(pc.x - b.x) < 4 && Math.abs(pc.y - b.y) < 8) { P.hurt(1, b.x); dead = true; }
      if (!dead && Wd.solid(Math.floor(b.x), Math.floor(b.y))) {
        dead = true;
        if (b.boom) WTP.weapons.explode(b.x, b.y, b.boom, { noPush: true, letters: 3, dmg: 0, sound: 'impact' });
        else FX().spark(b.x, b.y, rand(-30, 30), rand(-40, 0), P32.y, 0.2);
      }
      if (dead) bullets.splice(k, 1);
    }
    for (let k = pickups.length - 1; k >= 0; k--) {
      const p = pickups[k];
      p.life -= dt;
      const dx = pc.x - p.x, dy = pc.y - p.y, d = Math.hypot(dx, dy);
      if (d < 40 && p.life < (p.t === 'heart' ? 11.5 : 9.7)) { p.vx += (dx / (d || 1)) * 900 * dt; p.vy += (dy / (d || 1)) * 900 * dt; p.vx *= 0.92; p.vy *= 0.92; }
      else { p.vy = Math.min(200, p.vy + 400 * dt); p.vx *= 0.98; }
      const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
      if (Wd.solid(Math.floor(nx), Math.floor(p.y))) p.vx *= -0.4; else p.x = nx;
      if (Wd.solid(Math.floor(p.x), Math.floor(ny))) { p.vy *= -0.3; p.vx *= 0.8; } else p.y = ny;
      if (d < 6) {
        if (p.t === 'heart') { if (P.hp < P.maxHp) { P.hp++; A('heal'); FX().pop(p.x, p.y - 6, '+1 ♥', { ramp: ['K', 'k', 'e'] }); } else G()?.bonus?.(200, p.x, p.y); }
        else { A('coin'); G()?.scrap?.(2); }
        pickups.splice(k, 1); continue;
      }
      if (p.life <= 0) pickups.splice(k, 1);
    }
  }
  function box(x, y, T) {
    const s = W().solid;
    const x0 = Math.floor(x - T.w / 2), x1 = Math.floor(x + T.w / 2), y0 = Math.floor(y - T.h / 2), y1 = Math.floor(y + T.h / 2);
    for (let yy = y0; yy <= y1; yy += 2) for (let xx = x0; xx <= x1; xx += 2) if (s(xx, yy)) return true;
    for (let xx = x0; xx <= x1; xx += 2) if (s(xx, y1)) return true;
    return false;
  }
  function draw(ctx) {
    for (const e of list) {
      const sp = SP.ENEMY[e.T.spr];
      const x = Math.round(e.x - sp.w / 2), y = Math.round(e.y - sp.h / 2);
      if (e.spawnT > 0 && ((e.spawnT * 20) | 0) % 2) continue;
      const img = e.flash > 0 ? whiteOf(sp) : e.freeze > 0 ? iceOf(sp) : sp.cv;
      if (e.type === 'cursor') {
        const flip = e.vx < 0;
        if (flip) { ctx.save(); ctx.translate(x + sp.w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); } else ctx.drawImage(img, x, y);
        if (e.mode === 'dash') { ctx.fillStyle = WTP.PAL.c; ctx.fillRect(x + 2, y + sp.h, 2, 1); }
      } else ctx.drawImage(img, x, y);
      if (e.type === 'ad' && e.flash <= 0) WTP.font.draw(ctx, e.text, Math.round(e.x), y + 4, { color: '0', align: 'center' });
      if (e.type === 'cookie' && e.flash <= 0) WTP.font.draw(ctx, 'ACCEPT?', x + 13, y + 1, { color: '2' });
      if (e.type === 'modal' && e.flash <= 0) {
        WTP.font.draw(ctx, 'SUBSCRIBE', Math.round(e.x), y + 4, { color: '0', align: 'center', bold: true });
        WTP.font.draw(ctx, 'YES PLEASE', Math.round(e.x), y + 16, { color: '7', align: 'center' });
      }
      if (e.T.boss || e.hp < e.maxHp) {
        const w = Math.min(40, e.T.w), bx = Math.round(e.x - w / 2), by = y - 4;
        ctx.fillStyle = WTP.PAL['0']; ctx.fillRect(bx - 1, by - 1, w + 2, 3);
        ctx.fillStyle = WTP.PAL.e; ctx.fillRect(bx, by, Math.max(0, Math.round((w * e.hp) / e.maxHp)), 1);
      }
    }
    for (const b of bullets) {
      const sp = SP.PROJ[b.spr];
      if (!sp) continue;
      ctx.drawImage(sp.cv, Math.round(b.x - sp.w / 2), Math.round(b.y - sp.h / 2));
    }
    for (const p of pickups) {
      if (p.life < 2 && ((p.life * 10) | 0) % 2) continue;
      const sp = p.t === 'heart' ? SP.ENEMY.heart : SP.ENEMY.scrap;
      const bob = Math.round(Math.sin(p.life * 6) * 1);
      ctx.drawImage(sp.cv, Math.round(p.x - sp.w / 2), Math.round(p.y - sp.h / 2) + bob);
    }
  }
  function at(x, y, r) {
    for (const e of list) { if (e.dead || e.spawnT > 0.2) continue; if (Math.abs(x - e.x) < e.T.w / 2 + r && Math.abs(y - e.y) < e.T.h / 2 + r) return e; }
    return null;
  }
  function damageCircle(x, y, r, dmg, cause) {
    let hit = 0;
    for (const e of list) {
      if (e.dead) continue;
      const dx = Math.max(Math.abs(x - e.x) - e.T.w / 2, 0), dy = Math.max(Math.abs(y - e.y) - e.T.h / 2, 0);
      if (dx * dx + dy * dy < r * r) { e.damage(dmg, cause); hit++; if (cause === 'freeze') e.freeze = 2; }
    }
    for (let k = bullets.length - 1; k >= 0; k--) { const b = bullets[k]; if (Math.hypot(b.x - x, b.y - y) < r) bullets.splice(k, 1); }
    return hit;
  }
  function rayHit(x, y, dx, dy, max) {
    for (let d = 0; d < max; d += 2) { const e = at(x + dx * d, y + dy * d, 1); if (e) return { enemy: e, x: x + dx * d, y: y + dy * d }; }
    return null;
  }
  function nearest(x, y, R, ang, cone) {
    let best = null, bd = R;
    for (const e of list) {
      if (e.dead) continue;
      const dx = e.x - x, dy = e.y - y, d = Math.hypot(dx, dy);
      if (d > bd) continue;
      if (ang != null) { let da = Math.atan2(dy, dx) - ang; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; if (Math.abs(da) > cone) continue; }
      bd = d; best = e;
    }
    return best;
  }
  function pull(x, y, R, f) { for (const e of list) { const dx = x - e.x, dy = y - e.y, d = Math.hypot(dx, dy) || 1; if (d < R && !e.T.boss) { e.vx += (dx / d) * f; e.vy += (dy / d) * f; } } }
  function push(x, y, R, vx, vy) { for (const e of list) if (Math.hypot(e.x - x, e.y - y) < R && !e.T.boss) { e.vx += vx; e.vy += vy; } }
  function spawnEdge(type, o) {
    const v = G()?.view?.() || { x: 0, y: 0, w: 300, h: 200 };
    const P = PL();
    let x, y;
    const side = Math.random();
    if (type === 'captcha') {
      x = P.x + (Math.random() < 0.5 ? -1 : 1) * rand(60, 120);
      x = Math.max(10, Math.min(W().w - 10, x));
      y = v.y + 10;
    } else if (type === 'cookie') { x = side < 0.5 ? v.x + 10 : v.x + v.w - 10; y = v.y + 20; }
    else if (type === 'modal') { x = v.x + v.w / 2; y = v.y + 30; }
    else { x = side < 0.33 ? v.x + 8 : side < 0.66 ? v.x + v.w - 8 : v.x + rand(10, v.w - 10); y = side < 0.66 ? v.y + rand(20, v.h * 0.5) : v.y + 10; }
    return spawn(type, x, y, o);
  }
  function reset() { list.length = 0; bullets.length = 0; pickups.length = 0; }
  WTP.enemies = { TYPES, list, bullets, pickups, spawn, spawnEdge, update, draw, at, damageCircle, rayHit, nearest, pull, push, reset, count: () => list.filter((e) => !e.dead).length };
})();
