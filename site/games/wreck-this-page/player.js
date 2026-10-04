(() => {
  const WTP = window.WTP;
  const { rand, P32 } = WTP;
  const P = {
    x: 0, y: 0, vx: 0, vy: 0, w: 6, h: 14, ground: false, wall: 0, face: 1, jumps: 1, airDash: 1, coyote: 0, buffer: 0,
    dashT: 0, dashCd: 0, dashDir: 1, wallLock: 0, land: 0, hurtT: 0, iframes: 0, hp: 6, maxHp: 6, dead: false, anim: 'idle', animT: 0,
    ghosts: [], recoil: 0, swing: 0, swingDir: 1, victory: false, peakY: 0, rocketJumpStart: null, stepT: 0, frames: null, skin: 'hero', lastGround: 0, blink: 0
  };
  WTP.player = P;
  const W = () => WTP.world;
  const I = () => WTP.input;
  const collide = (x, y, w, h) => {
    const s = W().solid;
    const x0 = Math.floor(x), x1 = Math.floor(x + w - 0.001), y0 = Math.floor(y), y1 = Math.floor(y + h - 0.001);
    for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) if (s(xx, yy)) return true;
    return false;
  };
  P.collide = collide;
  P.inside = (x, y) => x >= Math.floor(P.x) && x <= Math.floor(P.x + P.w - 0.001) && y >= Math.floor(P.y) && y <= Math.floor(P.y + P.h - 0.001);
  P.center = () => ({ x: P.x + P.w / 2, y: P.y + P.h / 2 });
  P.spawn = (x, y) => {
    Object.assign(P, { x, y, vx: 0, vy: 0, ground: false, wall: 0, jumps: 1, airDash: 1, coyote: 0, buffer: 0, dashT: 0, dashCd: 0, land: 0, hurtT: 0, iframes: 0, hp: P.maxHp, dead: false, victory: false, ghosts: [], recoil: 0, swing: 0 });
    P.setSkin(WTP.save.skin);
  };
  P.setSkin = (id) => { P.skin = id; P.frames = WTP.sprites.playerFrames(id); };
  P.impulse = (ix, iy) => { P.vx += ix; P.vy += iy; if (iy < -40) { P.ground = false; P.rocketJumpStart = P.rocketJumpStart ?? P.y; } };
  P.hurt = (dmg, fromX) => {
    if (P.iframes > 0 || P.dead || P.dashT > 0) return false;
    P.hp -= dmg;
    P.hurtT = 0.35; P.iframes = 1.1;
    P.vx = (P.x + P.w / 2 < fromX ? -1 : 1) * 120; P.vy = -150; P.ground = false;
    WTP.audio.play('hurt');
    WTP.game?.shake?.(8); WTP.game?.hitstop?.(0.06);
    WTP.fx.flash(0.35, '#e8484f');
    WTP.vibe(80);
    if (P.hp <= 0) { P.dead = true; WTP.audio.play('die'); WTP.game?.playerDied?.(); }
    return true;
  };

  P.update = (dt, ctl) => {
    const In = I();
    const mx = ctl ? 0 : In.moveX();
    const down = !ctl && In.downHeld();
    if (!ctl) {
      if (In.take('jump')) P.buffer = 0.13;
      if (In.stickL.y < -0.62 && !P.stickJump) { P.buffer = 0.13; P.stickJump = true; }
      if (In.stickL.y > -0.4) P.stickJump = false;
      if (In.gpAxes[1] < -0.75 && !P.padJump) { P.padJump = true; }
      if (In.gpAxes[1] > -0.4) P.padJump = false;
      if (In.take('dash')) tryDash(mx);
    }
    const held = !ctl && In.jumpHeld();
    P.buffer = Math.max(0, P.buffer - dt);
    P.dashCd = Math.max(0, P.dashCd - dt);
    P.iframes = Math.max(0, P.iframes - dt);
    P.hurtT = Math.max(0, P.hurtT - dt);
    P.wallLock = Math.max(0, P.wallLock - dt);
    P.recoil *= Math.pow(0.0005, dt);
    P.swing = Math.max(0, P.swing - dt);
    if (P.dead) { P.vy += 600 * dt; P.vx *= 0.95; move(dt); return; }

    if (P.dashT > 0) {
      P.dashT -= dt;
      P.vx = P.dashDir * 300; P.vy = 0;
      if (Math.random() < 0.9) P.ghosts.push({ x: P.x, y: P.y, face: P.face, t: 0.22, anim: 'dash' });
      if (P.dashT <= 0) { P.vx = P.dashDir * 110; }
      move(dt);
      return;
    }
    const RUN = 84;
    const accel = P.ground ? 1100 : 640;
    const target = mx * RUN;
    if (P.wallLock <= 0) {
      if (Math.abs(P.vx) > RUN * 1.05 && Math.sign(P.vx) === Math.sign(target || P.vx)) P.vx += (target - P.vx) * Math.min(1, dt * (P.ground ? 9 : 1.2));
      else if (P.vx < target) P.vx = Math.min(target, P.vx + accel * dt);
      else if (P.vx > target) P.vx = Math.max(target, P.vx - accel * dt * (P.ground && !mx ? 1.4 : 1));
    }
    if (mx) P.face = mx > 0 ? 1 : -1;

    P.vy += (down ? 1150 : 680) * dt;
    if (!held && P.vy < -70 && !P.boosted) P.vy += 900 * dt;
    const sliding = !P.ground && P.wall !== 0 && mx === P.wall && P.vy > 0;
    if (sliding) {
      P.vy = Math.min(P.vy, 48);
      if (Math.random() < 0.35) WTP.fx.dust(P.x + (P.wall > 0 ? P.w : 0), P.y + P.h - 3);
    }
    P.sliding = sliding;
    if (P.vy > 330) P.vy = 330;
    P.coyote = P.ground ? 0.1 : Math.max(0, P.coyote - dt);
    if (P.buffer > 0) {
      if (P.ground || P.coyote > 0) { P.vy = -222; P.ground = false; P.coyote = 0; P.buffer = 0; WTP.audio.play('jump'); puff(5); WTP.game?.stat?.('jumps', 1); }
      else if (P.wall !== 0 || wallNear()) {
        const wd = P.wall || wallNear();
        P.vy = -212; P.vx = -wd * 150; P.face = -wd; P.wall = 0; P.buffer = 0; P.wallLock = 0.12; P.jumps = 1; P.airDash = 1;
        WTP.audio.play('walljump'); puff(4); WTP.game?.stat?.('walljumps', 1);
      } else if (P.jumps > 0) { P.jumps--; P.vy = -198; P.buffer = 0; WTP.audio.play('djump'); ring(); WTP.game?.stat?.('jumps', 1); }
    }
    P.boosted = P.vy < -280;
    const wasGround = P.ground;
    const vyBefore = P.vy;
    move(dt);
    if (P.ground && !wasGround) {
      if (vyBefore > 220) { P.land = 0.14; puff(6); WTP.audio.play('land'); if (vyBefore > 320) WTP.game?.shake?.(2); }
      if (P.rocketJumpStart != null) { const hgt = P.rocketJumpStart - P.peakY; if (hgt > 25) WTP.game?.rocketJump?.(hgt); P.rocketJumpStart = null; }
    }
    if (!P.ground) P.peakY = Math.min(P.peakY, P.y); else P.peakY = P.y;
    if (P.ground) { P.jumps = 1; P.airDash = 1; P.lastGround = performance.now(); }
    if (P.wall !== 0) P.airDash = 1;
    P.land = Math.max(0, P.land - dt);
    if (P.ground && Math.abs(P.vx) > 20) {
      P.stepT += dt * Math.abs(P.vx) / 84;
      if (P.stepT > 0.28) { P.stepT = 0; WTP.audio.play('step'); if (Math.random() < 0.4) WTP.fx.dust(P.x + P.w / 2, P.y + P.h - 1); }
      WTP.game?.stat?.('distance', Math.abs(P.vx) * dt);
    }
  };
  function wallNear() {
    if (collide(P.x - 1.2, P.y + 2, P.w, P.h - 5)) return -1;
    if (collide(P.x + 1.2, P.y + 2, P.w, P.h - 5)) return 1;
    return 0;
  }
  function tryDash(mx) {
    if (P.dashCd > 0 || P.dead) return;
    if (!P.ground && P.airDash <= 0) return;
    if (!P.ground) P.airDash--;
    P.dashDir = mx ? Math.sign(mx) : P.face;
    P.face = P.dashDir;
    P.dashT = 0.14; P.dashCd = 0.42; P.iframes = Math.max(P.iframes, 0.2);
    WTP.audio.play('dash');
    puff(4);
    WTP.game?.stat?.('dashes', 1);
  }
  function move(dt) {
    P.wall = 0;
    const dx = P.vx * dt;
    const sx = Math.max(1, Math.ceil(Math.abs(dx) / 0.5));
    for (let s = 0; s < sx; s++) {
      const nx = P.x + dx / sx;
      if (!collide(nx, P.y, P.w, P.h)) { P.x = nx; continue; }
      let stepped = false;
      if (P.ground || P.vy >= 0 || P.dashT > 0) for (let up = 1; up <= 4; up++) if (!collide(nx, P.y - up, P.w, P.h)) { P.x = nx; P.y -= up; stepped = true; break; }
      if (!stepped) { P.wall = Math.sign(dx); if (P.dashT > 0) P.dashT = 0; P.vx = 0; break; }
    }
    const dy = P.vy * dt;
    const sy = Math.max(1, Math.ceil(Math.abs(dy) / 0.5));
    P.ground = false;
    for (let s = 0; s < sy; s++) {
      const ny = P.y + dy / sy;
      if (!collide(P.x, ny, P.w, P.h)) { P.y = ny; continue; }
      if (dy > 0) P.ground = true;
      P.vy = 0;
      break;
    }
    if (!P.ground && P.vy >= 0 && collide(P.x, P.y + 0.3, P.w, P.h)) P.ground = true;
    if (P.wall === 0 && !P.ground) {
      if (collide(P.x - 0.5, P.y + 1, P.w, P.h - 4)) P.wall = -1;
      else if (collide(P.x + 0.5, P.y + 1, P.w, P.h - 4)) P.wall = 1;
    }
    let guard = 0;
    while (collide(P.x, P.y, P.w, P.h) && guard++ < 24) { P.y -= 1; P.vy = Math.min(P.vy, 0); }
    if (P.x < 0) P.x = 0;
    if (P.x > W().w - P.w) P.x = W().w - P.w;
  }
  function puff(n) { for (let k = 0; k < n; k++) WTP.fx.smoke(P.x + P.w / 2 + rand(-3, 3), P.y + P.h - 1, 1, P32['6']); }
  function ring() { for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; WTP.fx.spark(P.x + P.w / 2, P.y + P.h, Math.cos(a) * 60, Math.sin(a) * 25, P32['7'], 0.18); } }

  P.pickAnim = () => {
    if (P.victory) return 'victory';
    if (P.hurtT > 0 || P.dead) return 'hurt';
    if (P.dashT > 0) return 'dash';
    if (P.land > 0) return 'land';
    if (!P.ground && P.sliding) return 'wall';
    if (!P.ground) return P.vy < 0 ? 'jump' : 'fall';
    if (Math.abs(P.vx) > 12) return 'run';
    return 'idle';
  };
  P.frame = (t) => {
    const a = P.pickAnim();
    if (a !== P.anim) { P.anim = a; P.animT = 0; }
    P.animT += t;
    const fr = P.frames.anims[a];
    const speed = a === 'run' ? 0.075 * 84 / Math.max(30, Math.abs(P.vx)) : a === 'idle' ? 0.38 : a === 'victory' ? 0.16 : 0.12;
    let idx = Math.floor(P.animT / speed) % fr.length;
    if (a === 'land') idx = Math.min(fr.length - 1, Math.floor(P.animT / 0.07));
    return fr[idx];
  };
  P.drawPos = (f) => {
    const cx = Math.round(P.x + P.w / 2), fy = Math.round(P.y + P.h);
    const ax = P.face > 0 ? 10 : f.w - 10;
    return [cx - ax, fy - 22];
  };
  P.shoulder = (f) => {
    const [dx, dy] = P.drawPos(f);
    const sx = P.face > 0 ? f.shoulder[0] : f.w - 1 - f.shoulder[0];
    return { x: dx + sx + 0.5, y: dy + f.shoulder[1] + 1.5 };
  };
  P.gun = () => P.gunPos || { x: P.x + P.w / 2, y: P.y + 5 };

  P.draw = (ctx, dt, weaponSprite, aim, opts = {}) => {
    for (let k = P.ghosts.length - 1; k >= 0; k--) {
      const g = P.ghosts[k];
      g.t -= dt;
      if (g.t <= 0) { P.ghosts.splice(k, 1); continue; }
      const fr = P.frames.anims.dash[0];
      if (WTP.sprites.dith(Math.round(g.x), Math.round(g.y), g.t * 4)) {
        const cx = Math.round(g.x + P.w / 2), fy = Math.round(g.y + P.h);
        const ax = g.face > 0 ? 10 : fr.w - 10;
        ctx.globalAlpha = Math.min(1, g.t * 4) * 0.6;
        ctx.drawImage(g.face > 0 ? fr.white : fr.whiteL, cx - ax, fy - 22);
        ctx.globalAlpha = 1;
      }
    }
    const f = P.frame(dt);
    const [dx, dy] = P.drawPos(f);
    const blink = P.iframes > 0 && !P.victory && (Math.floor(performance.now() / 70) & 1);
    const sh = P.shoulder(f);
    const ang = Math.atan2(aim.y, aim.x);
    const flip = aim.x < 0;
    const drawArm = () => {
      if (!weaponSprite || P.victory || P.dead) { P.gunPos = { x: sh.x + aim.x * 4, y: sh.y + aim.y * 4 }; return; }
      let a = ang;
      if (opts.swing) a += opts.swing;
      const ca = Math.cos(a), sa = Math.sin(a);
      const rk = P.recoil;
      const reach = 4 - rk;
      const hx = sh.x + ca * reach, hy = sh.y + sa * reach;
      const arm = P.frames.arm.rotated(a, flip);
      ctx.drawImage(arm.cv, Math.round(sh.x - arm.ox), Math.round(sh.y - arm.oy));
      const r = weaponSprite.rotated(a, flip);
      ctx.drawImage(r.cv, Math.round(hx - r.ox), Math.round(hy - r.oy));
      const [mx, my] = weaponSprite.muzzle(a, flip);
      P.gunPos = { x: hx, y: hy };
      P.muzzle = { x: hx + mx, y: hy + my };
    };
    const behind = aim.y < -0.85;
    if (behind) drawArm();
    if (blink) { ctx.drawImage(P.face > 0 ? f.white : f.whiteL, dx, dy); if (!behind) drawArm(); return; }
    ctx.drawImage(P.face > 0 ? f.bodyR : f.bodyL, dx, dy);
    if (!behind) drawArm();
    ctx.drawImage(P.face > 0 ? f.headR : f.headL, dx, dy);
  };
})();
