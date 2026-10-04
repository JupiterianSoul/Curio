(function () {
  const P = window.PlanetArt;
  const starTex = (stops, sc = 8) => { const rp = P.R(stops); return (p) => P.ramp(rp, P.fbm(p[0] * sc, p[1] * sc, p[2] * sc, 4) * 0.9 + P.fbm(p[0] * 2, p[1] * 2, p[2] * 2, 2) * 0.3 - 0.1); };
  P.def('star_yellow', { name: 'Yellow star', star: true, glow: '#ffd04a', tex: starTex([[0, '#e07a10'], [0.5, '#ffc040'], [1, '#fff6c8']]) });
  P.def('star_white', { name: 'White star', star: true, glow: '#cfe0ff', tex: starTex([[0, '#a8c4ff'], [0.55, '#e8f0ff'], [1, '#ffffff']]) });
  P.def('star_blue', { name: 'Blue star', star: true, glow: '#7faaff', tex: starTex([[0, '#3a6ae0'], [0.5, '#8fb5ff'], [1, '#eef4ff']]) });
  P.def('star_orange', { name: 'Orange star', star: true, glow: '#ff9a3a', tex: starTex([[0, '#b8420a'], [0.5, '#ff8a2a'], [1, '#ffd8a0']], 6) });
  P.def('star_red', { name: 'Red giant', star: true, glow: '#ff5a2a', tex: starTex([[0, '#6a1004'], [0.45, '#d0381a'], [0.8, '#ff8050'], [1, '#ffc0a0']], 4) });

  const HEIGHT = { person: 1, giraffe: 1, trex: 0.4, whale: 0.26, plane: 0.27, statue: 1, rocket: 1, tree: 1, pyramid: 1, ship: 0.2, eiffel: 1, empire: 1, burj: 1, bridge: 0.09, mountain: 1, ant: 0.35, bee: 0.6, bird: 0.55, mouse: 0.5, cat: 0.6, tardigrade: 0.5, bacterium: 0.4, rbc: 0.45, hair: 2.4, atom: 1, dna: 3, virus: 1, iss: 0.6, rock: 0.7, duck: 0.8 };
  const WIDTH = { person: 0.3, giraffe: 0.62, statue: 0.34, eiffel: 0.42, burj: 0.2, mountain: 1.9, rocket: 0.14, tree: 0.3, pyramid: 1.66, empire: 0.22, dna: 1, hair: 1, volcano: 1 };
  const FLOAT = new Set(['iss', 'rock', 'duck']);

  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const gauss = () => (rnd() + rnd() + rnd() - 1.5) / 1.5;
  const TAU = Math.PI * 2;

  function sprite(kind, c, o) {
    const S = 640, cs = document.createElement('canvas');
    cs.width = cs.height = S;
    const x = cs.getContext('2d');
    const R = S / 2;
    x.translate(R, R);
    const dot = (px, py, r, col, a = 1) => { x.globalAlpha = a; x.fillStyle = col; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); };
    const glow = (px, py, r, col, a) => { const gr = x.createRadialGradient(px, py, 0, px, py, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = a; x.fillStyle = gr; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); };
    x.globalCompositeOperation = 'lighter';
    if (kind === 'nebula') {
      for (let i = 0; i < 70; i++) { const a = rnd() * TAU, d = Math.pow(rnd(), 0.7) * R * 0.75; glow(Math.cos(a) * d, Math.sin(a) * d * 0.8, 40 + rnd() * 120, c[i % 3], 0.17); }
      for (let i = 0; i < 200; i++) dot(gauss() * R * 0.5, gauss() * R * 0.5, rnd() * 1.6 + 0.4, '#fff', 0.8);
      for (let i = 0; i < 4; i++) glow(gauss() * 30, gauss() * 30, 30, '#fff6e0', 0.7);
    } else if (kind === 'pillars') {
      for (let i = 0; i < 60; i++) glow(gauss() * R * 0.7, gauss() * R * 0.7, 60 + rnd() * 100, c[1], 0.12);
      x.globalCompositeOperation = 'source-over';
      const cols = [[-0.42, 0.95, 0.62, 0.17], [0.02, 0.95, 0.28, 0.12], [0.4, 0.95, 0.42, 0.13]];
      for (const [cx, by, ty, w] of cols) {
        const g = x.createLinearGradient(cx * R, by * R, cx * R, -ty * R);
        g.addColorStop(0, '#3a2414'); g.addColorStop(0.7, '#8a5a32'); g.addColorStop(1, '#ffcf8a');
        x.fillStyle = g; x.globalAlpha = 0.95;
        x.beginPath(); x.moveTo((cx - w) * R, by * R);
        for (let k = 0; k <= 20; k++) { const t = k / 20; x.lineTo((cx - w * (1 - t * 0.5) + Math.sin(t * 9 + cx * 5) * 0.03) * R, (by - (by + ty) * t) * R); }
        x.arc(cx * R, -ty * R, w * 0.5 * R, Math.PI, 0);
        for (let k = 20; k >= 0; k--) { const t = k / 20; x.lineTo((cx + w * (1 - t * 0.5) + Math.cos(t * 7 + cx * 3) * 0.03) * R, (by - (by + ty) * t) * R); }
        x.fill();
      }
      x.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 160; i++) dot(gauss() * R * 0.8, gauss() * R * 0.8, rnd() * 1.4 + 0.3, '#fff', 0.7);
    } else if (kind === 'crab') {
      glow(0, 0, R * 0.7, c[1], 0.35);
      for (let i = 0; i < 260; i++) {
        const a = rnd() * TAU, r0 = R * (0.15 + rnd() * 0.2), r1 = R * (0.55 + rnd() * 0.35);
        x.globalAlpha = 0.25; x.strokeStyle = rnd() < 0.6 ? c[0] : '#ffb3a0'; x.lineWidth = 1 + rnd() * 2;
        x.beginPath(); x.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.75);
        x.quadraticCurveTo(Math.cos(a + 0.3) * (r0 + r1) / 2, Math.sin(a + 0.3) * (r0 + r1) / 2 * 0.75, Math.cos(a + gauss() * 0.2) * r1, Math.sin(a) * r1 * 0.75); x.stroke();
      }
      glow(0, 0, R * 0.18, c[2], 0.9); dot(0, 0, 3, '#fff', 1);
    } else if (kind === 'cluster') {
      glow(0, 0, R * 0.6, c[1], 0.35);
      for (let i = 0; i < 3000; i++) { const d = Math.pow(rnd(), 1.8) * R * 0.95, a = rnd() * TAU; dot(Math.cos(a) * d, Math.sin(a) * d, rnd() * 1.4 + 0.5, rnd() < 0.8 ? c[0] : c[1], 0.7); }
    } else if (kind === 'dwarf') {
      for (let i = 0; i < 2200; i++) { const px = gauss() * R * 0.8, py = gauss() * R * 0.45 + px * 0.2; dot(px, py, rnd() * 1.3 + 0.4, c[0], 0.55); }
      glow(-R * 0.15, 0, R * 0.35, c[0], 0.35);
      for (let i = 0; i < 8; i++) glow(gauss() * R * 0.5, gauss() * R * 0.3, 12 + rnd() * 20, c[1], 0.7);
    } else if (kind === 'galaxy') {
      const arms = o.arms || 2;
      glow(0, 0, R * 0.95, c[1], 0.25);
      for (let i = 0; i < 7000; i++) {
        const arm = i % arms, t = Math.pow(rnd(), 0.9), r = t * R * 0.95;
        const ang = arm * TAU / arms + t * 5.2 + gauss() * 0.35;
        dot(Math.cos(ang) * r + gauss() * 6, Math.sin(ang) * r + gauss() * 6, rnd() * 1.3 + 0.3, t < 0.25 ? c[0] : rnd() < 0.7 ? c[1] : '#ffffff', 0.55);
      }
      for (let i = 0; i < 40; i++) { const t = 0.3 + rnd() * 0.6, ang = (i % arms) * TAU / arms + t * 5.2; glow(Math.cos(ang) * t * R * 0.95, Math.sin(ang) * t * R * 0.95, 6 + rnd() * 6, '#ff9ec8', 0.6); }
      glow(0, 0, R * 0.28, c[0], 0.9);
      glow(0, 0, R * 0.1, '#fff', 0.9);
    } else if (kind === 'elliptical') {
      for (let i = 0; i < 6; i++) glow(0, 0, R * (0.95 - i * 0.14), c[i % 2], 0.25);
      for (let i = 0; i < 1500; i++) { const d = Math.pow(rnd(), 2) * R * 0.9, a = rnd() * TAU; dot(Math.cos(a) * d, Math.sin(a) * d * 0.75, rnd() + 0.3, c[0], 0.4); }
      glow(0, 0, R * 0.12, '#fff', 0.9);
    } else if (kind === 'oort') {
      for (let i = 0; i < 3600; i++) { const a = rnd() * TAU, d = R * (0.62 + rnd() * 0.36) * Math.sqrt(1 - Math.pow(rnd(), 3) * 0.6); dot(Math.cos(a) * d, Math.sin(a) * d, rnd() * 1 + 0.4, c[0], 0.5); }
      glow(0, 0, 8, '#ffcc33', 1);
    } else if (kind === 'group') {
      const mini = (px, py, rr, col, tilt) => {
        x.save(); x.translate(px, py); x.scale(1, tilt);
        for (let i = 0; i < 600; i++) { const t = rnd(), ang = (i % 2) * Math.PI + t * 5 + gauss() * 0.4; dot(Math.cos(ang) * t * rr, Math.sin(ang) * t * rr, 0.8, col, 0.6); }
        glow(0, 0, rr * 0.35, '#fff3d6', 0.9); x.restore();
      };
      mini(-R * 0.3, R * 0.1, 30, c[1], 1);
      mini(R * 0.3, -R * 0.12, 46, c[0], 0.4);
      mini(R * 0.12, R * 0.22, 14, c[1], 0.6);
      for (let i = 0; i < 80; i++) glow(gauss() * R * 0.6, gauss() * R * 0.6, 3 + rnd() * 6, i % 2 ? c[0] : c[1], 0.8);
      x.globalCompositeOperation = 'source-over';
      x.globalAlpha = 0.25; x.strokeStyle = '#9fb8ff'; x.setLineDash([6, 8]); x.lineWidth = 2;
      x.beginPath(); x.arc(0, 0, R * 0.92, 0, TAU); x.stroke(); x.setLineDash([]);
    } else if (kind === 'void') {
      const nodes = Array.from({ length: 90 }, () => { const a = rnd() * TAU, d = R * (0.72 + rnd() * 0.25); return [Math.cos(a) * d, Math.sin(a) * d]; });
      for (const [ax, ay] of nodes) glow(ax, ay, 8 + rnd() * 14, rnd() < 0.5 ? c[0] : c[1], 0.7);
      for (let i = 0; i < 12; i++) glow(gauss() * R * 0.35, gauss() * R * 0.35, 4, c[1], 0.8);
      x.globalCompositeOperation = 'source-over'; x.globalAlpha = 0.3; x.strokeStyle = '#8fa3ff'; x.setLineDash([4, 8]);
      x.beginPath(); x.arc(0, 0, R * 0.68, 0, TAU); x.stroke(); x.setLineDash([]);
    } else if (kind === 'super' || kind === 'web' || kind === 'laniakea') {
      const nodes = Array.from({ length: kind === 'web' ? 80 : 38 }, () => { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R * 0.92; return [Math.cos(a) * d, Math.sin(a) * d * (kind === 'web' ? 0.45 : 1)]; });
      x.lineWidth = kind === 'web' ? 2 : 1.5;
      for (const [ax, ay] of nodes) for (const [bx, by] of nodes) {
        const dd = Math.hypot(ax - bx, ay - by);
        if (dd > 0 && dd < R * 0.3) {
          x.globalAlpha = 0.12; x.strokeStyle = c[0]; x.beginPath(); x.moveTo(ax, ay); x.lineTo(bx, by); x.stroke();
          for (let k = 0; k < 10; k++) { const t = rnd(); dot(ax + (bx - ax) * t + gauss() * 3, ay + (by - ay) * t + gauss() * 3, 0.9, c[0], 0.5); }
        }
      }
      for (const [ax, ay] of nodes) glow(ax, ay, 6 + rnd() * 10, rnd() < 0.5 ? c[0] : c[1], 0.8);
      if (kind === 'laniakea') {
        x.globalCompositeOperation = 'source-over';
        x.strokeStyle = c[1]; x.lineWidth = 1.6;
        for (let i = 0; i < 30; i++) {
          let px = Math.cos(i / 30 * TAU) * R * 0.95, py = Math.sin(i / 30 * TAU) * R * 0.95;
          x.globalAlpha = 0.35; x.beginPath(); x.moveTo(px, py);
          for (let s = 0; s < 30; s++) { const tx = -R * 0.1 - px, ty = R * 0.05 - py; px += tx * 0.08 + ty * 0.03; py += ty * 0.08 - tx * 0.03; x.lineTo(px, py); }
          x.stroke();
        }
        glow(-R * 0.1, R * 0.05, 30, '#fff', 0.8);
      }
    } else if (kind === 'universe') {
      x.globalCompositeOperation = 'source-over';
      x.save(); x.beginPath(); x.arc(0, 0, R - 1, 0, TAU); x.clip();
      x.fillStyle = '#3a2a6a'; x.fillRect(-R, -R, S, S);
      for (let i = 0; i < 1100; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; glow(Math.cos(a) * d, Math.sin(a) * d, 10 + rnd() * 34, rnd() < 0.5 ? c[0] : c[1], 0.35); }
      x.globalCompositeOperation = 'lighter';
      for (const [f, col] of [[0.72, '#7a5cff'], [0.5, '#9fc1ff']]) { x.globalAlpha = 0.25; x.strokeStyle = col; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, R * f, 0, TAU); x.stroke(); }
      glow(0, 0, 14, '#fff', 1);
      x.restore();
    }
    return cs;
  }
  const SPRITES = new Set(['nebula', 'pillars', 'crab', 'cluster', 'dwarf', 'galaxy', 'elliptical', 'oort', 'group', 'void', 'super', 'web', 'laniakea', 'universe']);
  const spriteCache = {};
  function getSprite(o, i) {
    if (!spriteCache[i]) { seed = 1000 + i * 77; spriteCache[i] = sprite(o.kind, o.c, o); }
    return spriteCache[i];
  }

  const globeCache = {};
  function globe(key, px) {
    const b = Math.max(32, Math.min(512, Math.pow(2, Math.ceil(Math.log2(Math.max(8, px))))));
    const id = key + b;
    return globeCache[id] || (globeCache[id] = P.Globe(key, b));
  }

  function drawSprite(g, sp, X, Y, Lw, Lh, W, H) {
    const x0 = X - Lw / 2, y0 = Y - Lh / 2;
    if (Lw < W * 6) { g.drawImage(sp, x0, y0, Lw, Lh); return; }
    const sx0 = Math.max(0, (0 - x0) / Lw * sp.width), sx1 = Math.min(sp.width, (W - x0) / Lw * sp.width);
    const sy0 = Math.max(0, (0 - y0) / Lh * sp.height), sy1 = Math.min(sp.height, (H - y0) / Lh * sp.height);
    if (sx1 <= sx0 || sy1 <= sy0) return;
    g.drawImage(sp, sx0, sy0, sx1 - sx0, sy1 - sy0, x0 + sx0 / sp.width * Lw, y0 + sy0 / sp.height * Lh, (sx1 - sx0) / sp.width * Lw, (sy1 - sy0) / sp.height * Lh);
  }
  const lin = (g, x0, y0, x1, y1, stops) => { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([t, c]) => gr.addColorStop(t, c)); return gr; };
  const rad = (g, x, y, r0, r1, stops, ox = 0, oy = 0) => { const gr = g.createRadialGradient(x + ox, y + oy, r0, x, y, r1); stops.forEach(([t, c]) => gr.addColorStop(t, c)); return gr; };
  function circle(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, Math.max(0.3, r), 0, TAU); g.fill(); }
  function ell(g, x, y, rx, ry, rot, fill) { g.fillStyle = fill; g.beginPath(); g.ellipse(x, y, Math.max(0.2, rx), Math.max(0.2, ry), rot, 0, TAU); g.fill(); }

  const rockShapes = {};
  function rockShape(i) {
    if (!rockShapes[i]) { seed = 300 + i * 31; rockShapes[i] = { pts: Array.from({ length: 18 }, () => 0.8 + rnd() * 0.26), cr: Array.from({ length: 7 }, () => [gauss() * 0.45, gauss() * 0.3, 0.04 + rnd() * 0.09]) }; }
    return rockShapes[i];
  }
  function drawRock(g, o, i, X, Y, L, t) {
    const sh = rockShape(i), r = L / 2;
    if (o.tail) {
      const tg = g.createLinearGradient(X, Y, X + L * 4, Y - L);
      tg.addColorStop(0, 'rgba(190,230,255,.6)'); tg.addColorStop(1, 'rgba(190,230,255,0)');
      g.fillStyle = tg; g.beginPath(); g.moveTo(X + r * 0.3, Y - r * 0.35); g.lineTo(X + L * 4.2, Y - L * 1.4); g.lineTo(X + L * 4.2, Y - L * 0.1); g.lineTo(X + r * 0.3, Y + r * 0.35); g.fill();
      circle(g, X, Y, r * 1.3, rad(g, X, Y, r * 0.5, r * 1.3, [[0, 'rgba(200,235,255,.35)'], [1, 'rgba(200,235,255,0)']]));
    }
    g.beginPath();
    for (let k = 0; k <= 18; k++) { const a = k / 18 * TAU, rr = sh.pts[k % 18] * r; const px = X + Math.cos(a) * rr, py = Y + Math.sin(a) * rr * 0.7; k ? g.lineTo(px, py) : g.moveTo(px, py); }
    g.fillStyle = rad(g, X, Y, r * 0.05, r * 1.1, [[0, o.c[0]], [1, o.c[1]]], -r * 0.35, -r * 0.3);
    g.fill();
    if (r > 4) {
      for (const [cx, cy, cr] of sh.cr) {
        ell(g, X + cx * r, Y + cy * r, cr * r, cr * r * 0.7, 0, 'rgba(0,0,0,.22)');
        ell(g, X + cx * r - cr * r * 0.2, Y + cy * r - cr * r * 0.2, cr * r * 0.7, cr * r * 0.45, 0, 'rgba(255,255,255,.07)');
      }
      g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(X + r * 0.25, Y + r * 0.2, r * 0.9, r * 0.55, 0.3, 0, TAU); g.globalAlpha = 0.5; g.fill(); g.globalAlpha = 1;
    }
  }

  const D = {};
  D.atom = (g, o, X, Y, L, t) => {
    const r = L / 2;
    circle(g, X, Y, r, rad(g, X, Y, 0, r, [[0, 'rgba(90,216,255,.35)'], [0.7, 'rgba(90,216,255,.12)'], [1, 'rgba(90,216,255,0)']]));
    g.strokeStyle = 'rgba(160,230,255,.6)'; g.lineWidth = Math.max(0.5, r * 0.02);
    for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(X, Y, r * 0.85, r * 0.3, k * Math.PI / 3, 0, TAU); g.stroke(); }
    circle(g, X, Y, r * 0.1, rad(g, X, Y, 0, r * 0.1, [[0, '#ffd0dc'], [1, o.c[1]]], -r * 0.03, -r * 0.03));
    const a = t * 2.5, k = Math.floor(t * 0.5) % 3;
    const ex = Math.cos(a) * r * 0.85, ey = Math.sin(a) * r * 0.3, rr = k * Math.PI / 3;
    circle(g, X + ex * Math.cos(rr) - ey * Math.sin(rr), Y + ex * Math.sin(rr) + ey * Math.cos(rr), Math.max(1, r * 0.05), '#fff');
  };
  D.dna = (g, o, X, Y, L, t) => {
    const w = L, h = L * 3, top = Y - h / 2;
    for (let k = 0; k <= 40; k++) {
      const y = top + k / 40 * h, ph = k / 40 * TAU * 1.5 + t;
      const x1 = X + Math.sin(ph) * w / 2, x2 = X - Math.sin(ph) * w / 2;
      if (k % 2 === 0) { g.strokeStyle = k % 4 ? 'rgba(255,211,107,.8)' : 'rgba(123,228,149,.8)'; g.lineWidth = Math.max(0.5, w * 0.06); g.beginPath(); g.moveTo(x1, y); g.lineTo(x2, y); g.stroke(); }
      const front = Math.cos(ph) > 0;
      circle(g, x1, y, Math.max(0.5, w * 0.09), front ? o.c[0] : '#a8325a');
      circle(g, x2, y, Math.max(0.5, w * 0.09), front ? '#2a8ab0' : o.c[1]);
    }
  };
  D.virus = (g, o, X, Y, L, t) => {
    const r = L / 2 * 0.75;
    g.strokeStyle = o.c[0]; g.lineWidth = Math.max(0.5, r * 0.08);
    for (let k = 0; k < 18; k++) {
      const a = k / 18 * TAU + t * 0.1;
      g.beginPath(); g.moveTo(X + Math.cos(a) * r, Y + Math.sin(a) * r); g.lineTo(X + Math.cos(a) * r * 1.3, Y + Math.sin(a) * r * 1.3); g.stroke();
      circle(g, X + Math.cos(a) * r * 1.32, Y + Math.sin(a) * r * 1.32, r * 0.1, o.c[1]);
    }
    circle(g, X, Y, r, rad(g, X, Y, r * 0.1, r, [[0, '#ffd0c0'], [1, '#c8503a']], -r * 0.3, -r * 0.3));
    for (let k = 0; k < 6; k++) circle(g, X + Math.cos(k * 1.1) * r * 0.5, Y + Math.sin(k * 1.7) * r * 0.45, r * 0.08, 'rgba(255,255,255,.25)');
  };
  D.bacterium = (g, o, X, Y, L, t) => {
    const w = L, h = L * 0.4;
    g.strokeStyle = 'rgba(123,228,149,.6)'; g.lineWidth = Math.max(0.4, h * 0.04);
    for (let k = 0; k < 5; k++) { g.beginPath(); const sx = X + w / 2 - h * 0.2, sy = Y - h * 0.3 + k * h * 0.15; g.moveTo(sx, sy); for (let s = 1; s <= 12; s++) g.lineTo(sx + s * w * 0.05, sy + Math.sin(s * 0.9 + t * 6 + k) * h * 0.15); g.stroke(); }
    g.fillStyle = lin(g, X, Y - h / 2, X, Y + h / 2, [[0, '#a8f0b8'], [0.5, o.c[0]], [1, o.c[1]]]);
    g.beginPath(); g.roundRect(X - w / 2, Y - h / 2, w, h, h / 2); g.fill();
    ell(g, X - w * 0.1, Y, w * 0.18, h * 0.2, 0, 'rgba(30,100,50,.35)');
  };
  D.rbc = (g, o, X, Y, L) => {
    const rx = L / 2, ry = L * 0.22;
    ell(g, X, Y, rx, ry, 0, rad(g, X, Y, 0, rx, [[0, '#ff7a8a'], [1, o.c[1]]]));
    ell(g, X, Y - ry * 0.1, rx * 0.5, ry * 0.45, 0, 'rgba(120,10,30,.45)');
    ell(g, X - rx * 0.3, Y - ry * 0.5, rx * 0.35, ry * 0.15, 0, 'rgba(255,255,255,.25)');
  };
  D.hair = (g, o, X, Y, L) => {
    const w = L, h = L * 2.4, top = Y - h / 2;
    g.fillStyle = lin(g, X - w / 2, 0, X + w / 2, 0, [[0, o.c[1]], [0.4, '#b07a46'], [1, o.c[1]]]);
    g.fillRect(X - w / 2, top, w, h);
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = Math.max(0.4, w * 0.02);
    for (let k = 0; k < 14; k++) { const y = top + k * h / 14; g.beginPath(); g.moveTo(X - w / 2, y + w * 0.1); g.quadraticCurveTo(X, y - w * 0.1, X + w / 2, y + w * 0.12); g.stroke(); }
  };
  D.tardigrade = (g, o, X, Y, L, t) => {
    const w = L, h = L * 0.5;
    g.fillStyle = o.c[1];
    for (let k = 0; k < 4; k++) { const lx = X - w * 0.3 + k * w * 0.2; g.beginPath(); g.roundRect(lx - w * 0.05, Y + h * 0.15, w * 0.1, h * 0.38 + Math.sin(t * 4 + k) * h * 0.04, w * 0.04); g.fill(); }
    ell(g, X, Y, w / 2, h / 2, 0, rad(g, X, Y, 0, w / 2, [[0, '#fff3e0'], [1, o.c[0]]], -w * 0.1, -h * 0.2));
    g.strokeStyle = 'rgba(140,110,70,.35)'; g.lineWidth = Math.max(0.5, w * 0.01);
    for (let k = 1; k < 5; k++) { g.beginPath(); g.ellipse(X - w / 2 + k * w / 5, Y, w * 0.02, h * 0.45, 0, 0, TAU); g.stroke(); }
    circle(g, X - w * 0.42, Y - h * 0.05, Math.max(0.6, w * 0.03), '#3a2a1a');
  };
  D.ant = (g, o, X, Y, L, t) => {
    const w = L, h = w * 0.35, b = Y + h / 2;
    g.strokeStyle = o.c[1]; g.lineWidth = Math.max(0.5, w * 0.02); g.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const lx = X - w * 0.05 + k * w * 0.08, s = Math.sin(t * 10 + k * 2) * w * 0.03; g.beginPath(); g.moveTo(lx, Y); g.lineTo(lx - w * 0.12 + s, b); g.moveTo(lx, Y); g.lineTo(lx + w * 0.1 - s, b); g.stroke(); }
    ell(g, X + w * 0.28, Y - h * 0.05, w * 0.22, h * 0.32, 0.1, o.c[0]);
    ell(g, X, Y - h * 0.1, w * 0.12, h * 0.18, 0, o.c[0]);
    circle(g, X - w * 0.27, Y - h * 0.18, w * 0.11, o.c[0]);
    g.beginPath(); g.moveTo(X - w * 0.33, Y - h * 0.25); g.quadraticCurveTo(X - w * 0.42, Y - h * 0.7, X - w * 0.5, Y - h * 0.55); g.stroke();
    ell(g, X + w * 0.22, Y - h * 0.18, w * 0.08, h * 0.08, 0, 'rgba(255,255,255,.2)');
  };
  D.bee = (g, o, X, Y, L, t) => {
    const w = L, h = w * 0.6;
    const flap = Math.sin(t * 40) * 0.3;
    ell(g, X + w * 0.02, Y - h * 0.35, w * 0.22, h * 0.32, -0.5 + flap, 'rgba(220,240,255,.7)');
    ell(g, X + w * 0.15, Y - h * 0.3, w * 0.18, h * 0.26, -0.2 - flap, 'rgba(220,240,255,.6)');
    ell(g, X + w * 0.12, Y + h * 0.05, w * 0.3, h * 0.28, 0, o.c[0]);
    g.fillStyle = o.c[1];
    for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(X + w * (0.02 + k * 0.12), Y + h * 0.05, w * 0.03, h * 0.27, 0, 0, TAU); g.fill(); }
    circle(g, X - w * 0.25, Y + h * 0.02, w * 0.14, o.c[1]);
    circle(g, X - w * 0.31, Y - h * 0.02, w * 0.035, '#fff');
  };
  D.bird = (g, o, X, Y, L, t) => {
    const w = L, h = w * 0.55;
    const flap = Math.sin(t * 30);
    ell(g, X + w * 0.05, Y - h * 0.15 - flap * h * 0.2, w * 0.25, h * 0.15, -0.6 - flap * 0.5, '#4ea6ef');
    ell(g, X, Y, w * 0.28, h * 0.24, 0.1, lin(g, X, Y - h * 0.3, X, Y + h * 0.3, [[0, o.c[0]], [1, '#e9f6ee']]));
    g.fillStyle = o.c[1]; g.beginPath(); g.moveTo(X + w * 0.25, Y); g.lineTo(X + w * 0.5, Y - h * 0.1); g.lineTo(X + w * 0.48, Y + h * 0.15); g.fill();
    circle(g, X - w * 0.25, Y - h * 0.15, w * 0.13, o.c[0]);
    g.strokeStyle = '#2d2416'; g.lineWidth = Math.max(0.5, w * 0.025); g.beginPath(); g.moveTo(X - w * 0.36, Y - h * 0.15); g.lineTo(X - w * 0.5, Y - h * 0.12); g.stroke();
    circle(g, X - w * 0.28, Y - h * 0.18, w * 0.025, '#111');
    ell(g, X - w * 0.18, Y - h * 0.02, w * 0.06, h * 0.08, 0, '#e8414e');
  };
  D.mouse = (g, o, X, Y, L, t) => {
    const w = L, h = w * 0.5, b = Y + h / 2;
    g.strokeStyle = o.c[1]; g.lineWidth = Math.max(0.5, w * 0.03); g.beginPath(); g.moveTo(X + w * 0.45, Y + h * 0.2); g.quadraticCurveTo(X + w * 0.9, Y + h * 0.4, X + w * 0.8, b - h * 0.05); g.stroke();
    ell(g, X + w * 0.08, Y + h * 0.05, w * 0.4, h * 0.42, 0, rad(g, X, Y, 0, w * 0.4, [[0, '#cfd6de'], [1, o.c[0]]], -w * 0.1, -h * 0.2));
    circle(g, X - w * 0.3, Y - h * 0.32, w * 0.13, o.c[0]); circle(g, X - w * 0.3, Y - h * 0.32, w * 0.08, o.c[1]);
    circle(g, X - w * 0.42, Y - h * 0.02, w * 0.03, '#111');
    circle(g, X - w * 0.53, Y + h * 0.08, w * 0.035, o.c[1]);
  };
  D.cat = (g, o, X, Y, L, t) => {
    const w = L, h = w * 0.6, b = Y + h / 2;
    g.strokeStyle = o.c[0]; g.lineWidth = Math.max(1, w * 0.07); g.lineCap = 'round';
    g.beginPath(); g.moveTo(X + w * 0.38, Y); g.quadraticCurveTo(X + w * 0.62, Y - h * 0.3 + Math.sin(t * 2) * h * 0.1, X + w * 0.5, Y - h * 0.6); g.stroke();
    g.fillStyle = o.c[0];
    for (const lx of [-0.25, -0.12, 0.2, 0.32]) g.fillRect(X + lx * w, Y, w * 0.07, b - Y);
    ell(g, X + w * 0.05, Y - h * 0.05, w * 0.38, h * 0.25, 0, o.c[0]);
    circle(g, X - w * 0.33, Y - h * 0.3, w * 0.16, o.c[0]);
    g.beginPath(); g.moveTo(X - w * 0.46, Y - h * 0.38); g.lineTo(X - w * 0.45, Y - h * 0.62); g.lineTo(X - w * 0.36, Y - h * 0.45); g.moveTo(X - w * 0.3, Y - h * 0.45); g.lineTo(X - w * 0.2, Y - h * 0.62); g.lineTo(X - w * 0.2, Y - h * 0.36); g.fill();
    g.fillStyle = o.c[1]; for (let k = 0; k < 3; k++) g.fillRect(X + (k * 0.12 - 0.05) * w, Y - h * 0.28, w * 0.04, h * 0.2);
    circle(g, X - w * 0.39, Y - h * 0.32, w * 0.025, '#1d1b19'); circle(g, X - w * 0.27, Y - h * 0.32, w * 0.025, '#1d1b19');
  };
  D.person = (g, o, X, Y, L, t) => {
    const top = Y - L / 2, h = L;
    g.fillStyle = '#23324a'; g.beginPath(); g.roundRect(X - h * 0.1, top + h * 0.54, h * 0.085, h * 0.46, h * 0.02); g.roundRect(X + h * 0.015, top + h * 0.54, h * 0.085, h * 0.46, h * 0.02); g.fill();
    g.fillStyle = lin(g, X - h * 0.12, 0, X + h * 0.12, 0, [[0, '#2558b8'], [0.5, o.c[1]], [1, '#1f4a9a']]);
    g.beginPath(); g.roundRect(X - h * 0.11, top + h * 0.19, h * 0.22, h * 0.4, h * 0.05); g.fill();
    g.strokeStyle = o.c[1]; g.lineWidth = h * 0.06; g.lineCap = 'round';
    const wave = Math.sin(t * 3) * 0.06;
    g.beginPath(); g.moveTo(X - h * 0.1, top + h * 0.24); g.lineTo(X - h * 0.16, top + h * 0.5); g.moveTo(X + h * 0.1, top + h * 0.24); g.lineTo(X + h * (0.2 + wave), top + h * 0.06); g.stroke();
    circle(g, X - h * 0.165, top + h * 0.52, h * 0.03, o.c[0]); circle(g, X + h * (0.2 + wave), top + h * 0.05, h * 0.03, o.c[0]);
    circle(g, X, top + h * 0.1, h * 0.085, rad(g, X, top + h * 0.1, 0, h * 0.085, [[0, '#ffd0a8'], [1, o.c[0]]], -h * 0.02, -h * 0.02));
    g.fillStyle = '#4a2f1a'; g.beginPath(); g.arc(X, top + h * 0.085, h * 0.088, Math.PI * 1.02, -0.02); g.fill();
    circle(g, X - h * 0.03, top + h * 0.1, h * 0.01, '#1d1b19'); circle(g, X + h * 0.03, top + h * 0.1, h * 0.01, '#1d1b19');
  };
  D.giraffe = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L, left = X - h * 0.31;
    const body = lin(g, 0, top, 0, top + h, [[0, '#ffd27a'], [1, o.c[0]]]);
    g.fillStyle = body;
    for (const lx of [0.05, 0.13, 0.38, 0.46]) { g.beginPath(); g.roundRect(left + h * lx, top + h * 0.6, h * 0.05, h * 0.4, h * 0.01); g.fill(); }
    g.beginPath(); g.ellipse(left + h * 0.28, top + h * 0.58, h * 0.27, h * 0.1, -0.12, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(left + h * 0.4, top + h * 0.55); g.lineTo(left + h * 0.5, top + h * 0.1); g.lineTo(left + h * 0.58, top + h * 0.12); g.lineTo(left + h * 0.52, top + h * 0.56); g.fill();
    g.beginPath(); g.ellipse(left + h * 0.57, top + h * 0.08, h * 0.08, h * 0.04, 0.4, 0, TAU); g.fill();
    g.fillStyle = o.c[1];
    [[.2, .56], [.3, .6], [.12, .6], [.36, .54], [.47, .35], [.49, .22], [.45, .45], [.25, .52], [.51, .3]].forEach(([a, b]) => { g.beginPath(); g.roundRect(left + a * h - h * 0.022, top + b * h - h * 0.018, h * 0.044, h * 0.036, h * 0.01); g.fill(); });
    g.fillRect(left + h * 0.53, top, h * 0.012, h * 0.05);
    circle(g, left + h * 0.59, top + h * 0.07, h * 0.008, '#1d1b19');
  };
  D.trex = (g, o, X, Y, L, t) => {
    const w = L, h = w * 0.4, b = Y + h / 2, top = Y - h / 2;
    g.fillStyle = lin(g, 0, top, 0, b, [[0, '#8aab4a'], [1, o.c[1]]]);
    g.beginPath();
    g.moveTo(X + w * 0.5, Y - h * 0.05);
    g.quadraticCurveTo(X + w * 0.1, Y - h * 0.35, X - w * 0.12, Y - h * 0.3);
    g.lineTo(X - w * 0.2, top + h * 0.05); g.quadraticCurveTo(X - w * 0.36, top - h * 0.02, X - w * 0.5, top + h * 0.12);
    g.lineTo(X - w * 0.48, top + h * 0.32); g.lineTo(X - w * 0.3, top + h * 0.3); g.lineTo(X - w * 0.25, Y);
    g.quadraticCurveTo(X - w * 0.05, Y + h * 0.15, X + w * 0.15, Y + h * 0.05);
    g.quadraticCurveTo(X + w * 0.35, Y + h * 0.02, X + w * 0.5, Y - h * 0.05); g.fill();
    g.beginPath(); g.moveTo(X - w * 0.08, Y); g.lineTo(X - w * 0.12, b); g.lineTo(X - w * 0.02, b); g.lineTo(X + w * 0.04, Y); g.fill();
    g.beginPath(); g.moveTo(X + w * 0.06, Y); g.lineTo(X + w * 0.04, b); g.lineTo(X + w * 0.14, b); g.lineTo(X + w * 0.16, Y); g.fill();
    g.strokeStyle = o.c[1]; g.lineWidth = Math.max(1, w * 0.012); g.beginPath(); g.moveTo(X - w * 0.22, Y - h * 0.1); g.lineTo(X - w * 0.27, Y + h * 0.02); g.stroke();
    circle(g, X - w * 0.38, top + h * 0.1, Math.max(0.6, w * 0.008), '#1d1b19');
    g.strokeStyle = '#fff'; g.lineWidth = Math.max(0.4, w * 0.004); g.beginPath(); g.moveTo(X - w * 0.49, top + h * 0.24); g.lineTo(X - w * 0.32, top + h * 0.24); g.stroke();
  };
  D.whale = (g, o, X, Y, L) => {
    const r = L / 2, h = L * 0.26;
    g.fillStyle = lin(g, 0, Y - h, 0, Y + h, [[0, '#7a9cc4'], [1, o.c[0]]]);
    g.beginPath(); g.moveTo(X - r, Y); g.quadraticCurveTo(X - r, Y - h, X - r * 0.3, Y - h * 0.9); g.quadraticCurveTo(X + r * 0.5, Y - h * 0.7, X + r * 0.85, Y - h * 0.1);
    g.lineTo(X + r, Y - h * 0.6); g.lineTo(X + r * 0.95, Y + h * 0.1); g.lineTo(X + r, Y + h * 0.5); g.lineTo(X + r * 0.82, Y + h * 0.1);
    g.quadraticCurveTo(X, Y + h * 0.9, X - r * 0.7, Y + h * 0.5); g.quadraticCurveTo(X - r, Y + h * 0.4, X - r, Y); g.fill();
    g.fillStyle = o.c[1]; g.beginPath(); g.ellipse(X - r * 0.45, Y + h * 0.35, r * 0.4, h * 0.18, 0.05, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(40,60,90,.3)'; g.lineWidth = Math.max(0.4, h * 0.02);
    for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(X - r * 0.8, Y + h * (0.2 + k * 0.06)); g.lineTo(X - r * 0.15, Y + h * (0.3 + k * 0.06)); g.stroke(); }
    circle(g, X - r * 0.72, Y - h * 0.1, Math.max(0.6, h * 0.05), '#111');
  };
  D.plane = (g, o, X, Y, L) => {
    const w = L, h = w * 0.27;
    g.fillStyle = '#cfd6de'; g.beginPath(); g.moveTo(X - w * 0.05, Y); g.lineTo(X + w * 0.25, Y + h * 0.9); g.lineTo(X + w * 0.32, Y + h * 0.9); g.lineTo(X + w * 0.12, Y); g.fill();
    g.fillStyle = lin(g, 0, Y - h * 0.3, 0, Y + h * 0.3, [[0, '#ffffff'], [1, '#c9d1dc']]);
    g.beginPath(); g.roundRect(X - w / 2, Y - h * 0.18, w * 0.95, h * 0.36, h * 0.18); g.fill();
    g.beginPath(); g.ellipse(X - w * 0.3, Y - h * 0.18, w * 0.16, h * 0.14, 0, Math.PI, 0); g.fill();
    g.fillStyle = o.c[1]; g.beginPath(); g.moveTo(X + w * 0.36, Y - h * 0.15); g.lineTo(X + w * 0.46, Y - h * 0.8); g.lineTo(X + w * 0.5, Y - h * 0.8); g.lineTo(X + w * 0.47, Y - h * 0.1); g.fill();
    g.fillRect(X - w * 0.5, Y + h * 0.02, w * 0.95, h * 0.05);
    g.fillStyle = '#2d3a4a'; for (let k = 0; k < 18; k++) g.fillRect(X - w * 0.38 + k * w * 0.04, Y - h * 0.08, w * 0.012, h * 0.06);
  };
  D.statue = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L;
    g.fillStyle = lin(g, X - h * 0.17, 0, X + h * 0.17, 0, [[0, '#7d8792'], [0.5, o.c[1]], [1, '#7d8792']]);
    g.fillRect(X - h * 0.17, top + h * 0.72, h * 0.34, h * 0.28); g.fillRect(X - h * 0.12, top + h * 0.5, h * 0.24, h * 0.22);
    g.fillStyle = lin(g, X - h * 0.08, 0, X + h * 0.08, 0, [[0, '#4f9e84'], [0.5, '#8fe0c2'], [1, '#4f9e84']]);
    g.beginPath(); g.moveTo(X - h * 0.08, top + h * 0.5); g.lineTo(X - h * 0.05, top + h * 0.2); g.lineTo(X + h * 0.05, top + h * 0.2); g.lineTo(X + h * 0.08, top + h * 0.5); g.fill();
    g.beginPath(); g.arc(X, top + h * 0.17, h * 0.035, 0, TAU); g.fill();
    g.fillRect(X + h * 0.03, top + h * 0.04, h * 0.02, h * 0.18);
    for (let s = -2; s <= 2; s++) g.fillRect(X + s * h * 0.018 - h * 0.004, top + h * 0.12, h * 0.008, h * 0.03);
    circle(g, X + h * 0.04, top + h * 0.03, h * 0.025, rad(g, X + h * 0.04, top + h * 0.03, 0, h * 0.05, [[0, '#fff3b0'], [1, '#ffb020']]));
  };
  D.iss = (g, o, X, Y, L) => {
    g.fillStyle = '#9aa7b5'; g.fillRect(X - L / 2, Y - L * 0.012, L, L * 0.024);
    for (const s of [-1, 1]) for (const k of [0.55, 0.82]) for (const v of [-0.16, 0.02]) {
      g.fillStyle = lin(g, 0, Y + v * L, 0, Y + (v + 0.14) * L, [[0, '#4a72c8'], [1, o.c[1]]]);
      g.fillRect(X + s * L / 2 * k - L * 0.05, Y + v * L, L * 0.1, L * 0.14);
      g.strokeStyle = 'rgba(160,190,255,.5)'; g.lineWidth = Math.max(0.3, L * 0.003);
      g.strokeRect(X + s * L / 2 * k - L * 0.05, Y + v * L, L * 0.1, L * 0.14);
    }
    g.fillStyle = o.c[0]; g.beginPath(); g.roundRect(X - L * 0.12, Y - L * 0.03, L * 0.24, L * 0.06, L * 0.02); g.fill();
    g.beginPath(); g.roundRect(X - L * 0.02, Y - L * 0.09, L * 0.04, L * 0.18, L * 0.015); g.fill();
    g.fillStyle = '#e9edf2'; g.fillRect(X - L * 0.2, Y - L * 0.05, L * 0.03, L * 0.1); g.fillRect(X + L * 0.17, Y - L * 0.05, L * 0.03, L * 0.1);
  };
  D.rocket = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L, w = h * 0.09;
    g.fillStyle = lin(g, X - w, 0, X + w, 0, [[0, '#c9d1dc'], [0.45, '#ffffff'], [1, '#aab4bf']]);
    g.beginPath(); g.moveTo(X - w * 0.6, top + h * 0.08); g.lineTo(X, top); g.lineTo(X + w * 0.6, top + h * 0.08); g.fill();
    g.fillRect(X - w * 0.6, top + h * 0.08, w * 1.2, h * 0.24);
    g.fillRect(X - w * 0.8, top + h * 0.32, w * 1.6, h * 0.22);
    g.fillRect(X - w, top + h * 0.54, w * 2, h * 0.43);
    g.fillStyle = o.c[1];
    for (const y of [0.32, 0.54, 0.7]) g.fillRect(X - w, top + h * y, w * 2, h * 0.015);
    for (let k = 0; k < 4; k++) g.fillRect(X - w + k * w * 0.5, top + h * 0.6, w * 0.25, h * 0.08);
    g.fillStyle = '#2d3a4a'; g.beginPath(); g.moveTo(X - w, top + h * 0.97); g.lineTo(X - w * 1.6, top + h); g.lineTo(X - w, top + h * 0.85); g.fill(); g.beginPath(); g.moveTo(X + w, top + h * 0.97); g.lineTo(X + w * 1.6, top + h); g.lineTo(X + w, top + h * 0.85); g.fill();
  };
  D.tree = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L;
    g.fillStyle = lin(g, X - h * 0.03, 0, X + h * 0.03, 0, [[0, '#5a3218'], [0.5, '#9a5a32'], [1, '#5a3218']]);
    g.beginPath(); g.moveTo(X - h * 0.035, top + h); g.lineTo(X - h * 0.012, top + h * 0.05); g.lineTo(X + h * 0.012, top + h * 0.05); g.lineTo(X + h * 0.035, top + h); g.fill();
    for (let k = 0; k < 9; k++) {
      const y = top + h * (0.06 + k * 0.075), w = h * (0.05 + k * 0.012);
      ell(g, X - w * 0.3, y, w, h * 0.04, 0, k % 2 ? '#2f7d3a' : '#276b31');
      ell(g, X + w * 0.35, y + h * 0.02, w * 0.9, h * 0.035, 0, k % 2 ? '#3a9447' : '#2f7d3a');
    }
  };
  D.pyramid = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L, hw = h * 0.83;
    g.fillStyle = o.c[0]; g.beginPath(); g.moveTo(X - hw, top + h); g.lineTo(X, top); g.lineTo(X + hw * 0.25, top + h); g.fill();
    g.fillStyle = o.c[1]; g.beginPath(); g.moveTo(X + hw * 0.25, top + h); g.lineTo(X, top); g.lineTo(X + hw, top + h); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = Math.max(0.3, h * 0.004);
    for (let k = 1; k < 16; k++) { const y = top + h * k / 16, f = k / 16; g.beginPath(); g.moveTo(X - hw * f, y); g.lineTo(X + hw * f, y); g.stroke(); }
  };
  D.ship = (g, o, X, Y, L) => {
    const w = L, h = w * 0.2, b = Y + h / 2;
    g.fillStyle = '#1d1b19'; g.beginPath(); g.moveTo(X - w / 2, Y); g.lineTo(X + w / 2, Y - h * 0.05); g.lineTo(X + w * 0.45, b); g.lineTo(X - w * 0.46, b); g.fill();
    g.fillStyle = '#a8321e'; g.fillRect(X - w * 0.47, b - h * 0.15, w * 0.92, h * 0.12);
    g.fillStyle = '#f4f6f9'; g.fillRect(X - w * 0.38, Y - h * 0.22, w * 0.72, h * 0.22);
    g.fillStyle = '#2d3a4a'; for (let k = 0; k < 30; k++) g.fillRect(X - w * 0.36 + k * w * 0.023, Y - h * 0.15, w * 0.008, h * 0.05);
    for (let k = 0; k < 4; k++) { const fx = X - w * 0.22 + k * w * 0.13; g.fillStyle = '#e8a33a'; g.fillRect(fx, Y - h * 0.55, w * 0.04, h * 0.34); g.fillStyle = '#1d1b19'; g.fillRect(fx, Y - h * 0.55, w * 0.04, h * 0.08); }
  };
  D.eiffel = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L;
    g.fillStyle = lin(g, X - h * 0.2, 0, X + h * 0.2, 0, [[0, '#6a4f3a'], [0.5, o.c[0]], [1, '#6a4f3a']]);
    g.beginPath(); g.moveTo(X - h * 0.21, top + h); g.quadraticCurveTo(X - h * 0.05, top + h * 0.5, X - h * 0.012, top + h * 0.08); g.lineTo(X + h * 0.012, top + h * 0.08); g.quadraticCurveTo(X + h * 0.05, top + h * 0.5, X + h * 0.21, top + h);
    g.lineTo(X + h * 0.12, top + h); g.quadraticCurveTo(X, top + h * 0.8, X - h * 0.12, top + h); g.fill();
    g.fillStyle = o.c[1]; g.fillRect(X - h * 0.13, top + h * 0.7, h * 0.26, h * 0.025); g.fillRect(X - h * 0.07, top + h * 0.45, h * 0.14, h * 0.02);
    g.fillRect(X - h * 0.004, top, h * 0.008, h * 0.09);
    g.strokeStyle = 'rgba(40,25,15,.25)'; g.lineWidth = Math.max(0.3, h * 0.003);
    for (let k = 0; k < 10; k++) { const y = top + h * (0.5 + k * 0.05); g.beginPath(); g.moveTo(X - h * (0.05 + k * 0.016), y); g.lineTo(X + h * (0.05 + k * 0.016), y + h * 0.05); g.moveTo(X + h * (0.05 + k * 0.016), y); g.lineTo(X - h * (0.05 + k * 0.016), y + h * 0.05); g.stroke(); }
  };
  D.empire = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L;
    const steps = [[0.11, 1, 0.7], [0.085, 0.86, 0.6], [0.06, 0.62, 0.48], [0.045, 0.45, 0.38], [0.03, 0.36, 0.3], [0.015, 0.3, 0.24]];
    for (const [w, y] of steps) { g.fillStyle = lin(g, X - h * w, 0, X + h * w, 0, [[0, '#8a97a6'], [0.4, '#d6dee8'], [1, '#7a8796']]); g.fillRect(X - h * w, top + h * (1 - y), h * w * 2, h * y); }
    g.fillStyle = 'rgba(255,240,180,.55)'; for (let k = 0; k < 40; k++) g.fillRect(X - h * 0.1 + (k % 8) * h * 0.026, top + h * (0.2 + Math.floor(k / 8) * 0.15), h * 0.008, h * 0.05);
    g.fillStyle = o.c[1]; g.fillRect(X - h * 0.004, top, h * 0.008, h * 0.24);
  };
  D.burj = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L;
    const steps = [[0.1, 1], [0.08, 0.8], [0.06, 0.62], [0.045, 0.46], [0.03, 0.32], [0.018, 0.2]];
    for (const [w, y] of steps) { g.fillStyle = lin(g, X - h * w, 0, X + h * w, 0, [[0, '#7f93a8'], [0.45, '#e8f0f8'], [1, '#6f8193']]); g.fillRect(X - h * w, top + h * (1 - y), h * w * 2, h * y); }
    g.fillStyle = o.c[1]; g.beginPath(); g.moveTo(X - h * 0.006, top + h * 0.2); g.lineTo(X, top); g.lineTo(X + h * 0.006, top + h * 0.2); g.fill();
  };
  D.bridge = (g, o, X, Y, L) => {
    const w = L, h = w * 0.09, b = Y + h / 2, top = Y - h / 2, deck = b - h * 0.3;
    const t1 = X - w * 0.23, t2 = X + w * 0.23;
    g.fillStyle = 'rgba(78,166,239,.5)'; g.fillRect(X - w / 2, b - h * 0.05, w, h * 0.1);
    g.strokeStyle = o.c[0]; g.lineWidth = Math.max(0.6, h * 0.025);
    g.beginPath(); g.moveTo(X - w / 2, deck - h * 0.05); g.quadraticCurveTo((X - w / 2 + t1) / 2, deck, t1, top);
    g.quadraticCurveTo(X, deck + h * 0.25, t2, top); g.quadraticCurveTo((t2 + X + w / 2) / 2, deck, X + w / 2, deck - h * 0.05); g.stroke();
    g.lineWidth = Math.max(0.3, h * 0.006);
    for (let k = 1; k < 30; k++) { const x = t1 + (t2 - t1) * k / 30, u = k / 30 * 2 - 1; const cy = top + (deck + h * 0.12 - top) * (1 - u * u); g.beginPath(); g.moveTo(x, cy); g.lineTo(x, deck); g.stroke(); }
    g.fillStyle = o.c[0]; g.fillRect(X - w / 2, deck, w, h * 0.06);
    for (const tx of [t1, t2]) { g.fillStyle = o.c[1]; g.fillRect(tx - h * 0.04, top, h * 0.08, b - top); g.fillStyle = o.c[0]; g.fillRect(tx - h * 0.03, top, h * 0.06, b - top - h * 0.05); }
  };
  D.mountain = (g, o, X, Y, L) => {
    const top = Y - L / 2, h = L, hw = h * 0.95;
    g.fillStyle = lin(g, 0, top, 0, top + h, [[0, '#9aa8b8'], [1, '#5a6877']]); g.beginPath(); g.moveTo(X - hw, top + h); g.lineTo(X - hw * 0.3, top + h * 0.3); g.lineTo(X - hw * 0.12, top + h * 0.42); g.lineTo(X, top); g.lineTo(X + hw * 0.4, top + h * 0.5); g.lineTo(X + hw * 0.55, top + h * 0.4); g.lineTo(X + hw, top + h); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(X, top); g.lineTo(X + hw * 0.4, top + h * 0.5); g.lineTo(X + hw * 0.55, top + h * 0.4); g.lineTo(X + hw, top + h); g.lineTo(X + hw * 0.1, top + h); g.fill();
    g.fillStyle = o.c[1]; g.beginPath(); g.moveTo(X, top); g.lineTo(X + hw * 0.16, top + h * 0.2); g.lineTo(X + hw * 0.05, top + h * 0.17); g.lineTo(X - hw * 0.03, top + h * 0.24); g.lineTo(X - hw * 0.09, top + h * 0.15); g.fill();
    g.beginPath(); g.moveTo(X - hw * 0.3, top + h * 0.3); g.lineTo(X - hw * 0.22, top + h * 0.38); g.lineTo(X - hw * 0.36, top + h * 0.38); g.fill();
    g.fillStyle = '#ff5a36'; g.fillRect(X - 0.5, top - Math.min(10, h * 0.06), 1.2, Math.min(10, h * 0.06)); g.fillRect(X, top - Math.min(10, h * 0.06), Math.min(7, h * 0.04), Math.min(4, h * 0.025));
  };
  D.duck = (g, o, X, Y, L, t, i) => {
    const r = L / 2;
    const tg = g.createLinearGradient(X, Y, X + L * 2, Y - L * 0.8);
    tg.addColorStop(0, 'rgba(200,230,255,.3)'); tg.addColorStop(1, 'rgba(200,230,255,0)');
    g.fillStyle = tg; g.beginPath(); g.moveTo(X, Y - r * 0.4); g.lineTo(X + L * 2.2, Y - L); g.lineTo(X + L * 2.2, Y - L * 0.3); g.lineTo(X, Y + r * 0.4); g.fill();
    drawRock(g, { c: o.c }, i, X + r * 0.25, Y + r * 0.1, L * 0.62);
    drawRock(g, { c: o.c }, i + 50, X - r * 0.35, Y - r * 0.2, L * 0.42);
  };
  D.snowman = (g, o, X, Y, L) => {
    const r = L / 2;
    ell(g, X + r * 0.32, Y, r * 0.58, r * 0.42, 0.1, rad(g, X + r * 0.32, Y, r * 0.05, r * 0.6, [[0, '#e8a080'], [1, o.c[1]]], -r * 0.2, -r * 0.15));
    ell(g, X - r * 0.48, Y - r * 0.05, r * 0.45, r * 0.38, -0.1, rad(g, X - r * 0.48, Y, r * 0.05, r * 0.45, [[0, '#e8a080'], [1, o.c[1]]], -r * 0.15, -r * 0.15));
    ell(g, X - r * 0.08, Y, r * 0.1, r * 0.18, 0, 'rgba(255,230,220,.35)');
  };
  D.volcano = (g, o, X, Y, L) => {
    const w = L, h = w * 0.1;
    g.fillStyle = lin(g, 0, Y - h, 0, Y + h, [[0, '#e0884a'], [1, o.c[1]]]);
    g.beginPath(); g.moveTo(X - w / 2, Y + h / 2); g.bezierCurveTo(X - w * 0.25, Y + h * 0.3, X - w * 0.12, Y - h / 2, X - w * 0.06, Y - h / 2); g.lineTo(X + w * 0.06, Y - h / 2); g.bezierCurveTo(X + w * 0.12, Y - h / 2, X + w * 0.25, Y + h * 0.3, X + w / 2, Y + h / 2); g.fill();
    ell(g, X, Y - h * 0.45, w * 0.05, h * 0.08, 0, '#7a2a10');
    g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.moveTo(X - w * 0.06, Y - h / 2); g.bezierCurveTo(X - w * 0.12, Y - h / 2, X - w * 0.25, Y + h * 0.3, X - w / 2, Y + h / 2); g.lineTo(X - w * 0.3, Y + h / 2); g.fill();
  };
  D.storm = (g, o, X, Y, L, t) => {
    const r = L / 2;
    const gr = g.createRadialGradient(X, Y, 1, X, Y, r);
    gr.addColorStop(0, '#f0b08a'); gr.addColorStop(0.5, o.c[0]); gr.addColorStop(1, 'rgba(143,58,34,0)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(X, Y, r, r * 0.55, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,230,210,.35)'; g.lineWidth = Math.max(0.5, r * 0.03);
    for (let k = 1; k <= 4; k++) { g.beginPath(); g.ellipse(X, Y, r * k * 0.22, r * k * 0.12, 0.2, t * 0.3 * (k % 2 ? 1 : -1), t * 0.3 + 5); g.stroke(); }
  };
  D.blackhole = (g, o, X, Y, L, t) => {
    const r = L / 2;
    const disk = (front) => {
      g.save(); g.beginPath(); if (front) g.rect(X - r * 5, Y, r * 10, r * 5); else g.rect(X - r * 5, Y - r * 5, r * 10, r * 5); g.clip();
      g.translate(X, Y); g.scale(1, 0.24);
      const gr = g.createRadialGradient(0, 0, r * 1.2, 0, 0, r * 2.5);
      gr.addColorStop(0, '#fff6d0'); gr.addColorStop(0.25, o.c[0]); gr.addColorStop(0.6, o.c[1]); gr.addColorStop(1, 'rgba(255,90,54,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r * 2.5, 0, TAU); g.arc(0, 0, r * 1.15, 0, TAU, true); g.fill();
      g.restore();
    };
    circle(g, X, Y, r * 1.8, rad(g, X, Y, r, r * 1.8, [[0, 'rgba(255,170,80,.2)'], [1, 'rgba(255,170,80,0)']]));
    disk(false);
    g.save(); g.translate(X, Y); g.scale(1, 0.95);
    g.strokeStyle = 'rgba(255,214,140,.9)'; g.lineWidth = Math.max(1, r * 0.12);
    g.beginPath(); g.arc(0, 0, r * 1.35, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    g.restore();
    circle(g, X, Y, r, '#000');
    g.strokeStyle = 'rgba(255,230,180,.85)'; g.lineWidth = Math.max(0.6, r * 0.04); g.beginPath(); g.arc(X, Y, r * 1.04, 0, TAU); g.stroke();
    disk(true);
  };
  D.orbit = (g, o, X, Y, L, t) => {
    const r = L / 2;
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(160,190,255,.4)'; g.beginPath(); g.arc(X, Y, r, 0, TAU); g.stroke();
    const a = -0.6 + t * 0.2;
    circle(g, X + Math.cos(a) * r, Y + Math.sin(a) * r, Math.max(2, Math.min(6, r * 0.01)), o.c[0]);
    if (o.inner) { g.strokeStyle = 'rgba(160,190,255,.25)'; for (const au of [0.39, 0.72, 1, 1.52]) { g.beginPath(); g.arc(X, Y, r * au / o.inner, 0, TAU); g.stroke(); } }
    const sunR = Math.max(1.5, r * (1.3927e9 / (o.s / 2)) / 2);
    circle(g, X, Y, sunR * 3 + 4, rad(g, X, Y, 0, sunR * 3 + 4, [[0, 'rgba(255,204,51,.9)'], [1, 'rgba(255,204,51,0)']]));
    circle(g, X, Y, sunR, '#fff1a8');
  };
  D.system = (g, o, X, Y, L, t) => {
    const r = L / 2;
    const orbits = [0.39, 0.72, 1, 1.52, 5.2, 9.58, 19.2, 30.05].map((a) => a / 30.05);
    const cols = ['#b5ada5', '#f3d7a1', '#4ea0f0', '#e0703f', '#e3b98a', '#e8cf94', '#9fe3e8', '#4b70dd'];
    g.lineWidth = 1.2;
    orbits.forEach((a, k) => {
      const rr = r * a;
      if (rr < 1.5) return;
      g.strokeStyle = 'rgba(160,190,255,.35)'; g.beginPath(); g.arc(X, Y, rr, 0, TAU); g.stroke();
      const ang = -0.6 + k * 2.1 + t * 0.4 / Math.pow(a * 30, 1.5);
      circle(g, X + Math.cos(ang) * rr, Y + Math.sin(ang) * rr, Math.max(1.5, Math.min(5, r * 0.012)), cols[k]);
    });
    circle(g, X, Y, 8, rad(g, X, Y, 0, 8, [[0, 'rgba(255,204,51,1)'], [1, 'rgba(255,204,51,0)']]));
  };
  D.bubble = (g, o, X, Y, L, t) => {
    const r = L / 2;
    const gr = g.createRadialGradient(X + r * 0.2, Y, r * 0.3, X, Y, r);
    gr.addColorStop(0, 'rgba(90,160,255,0)'); gr.addColorStop(0.8, 'rgba(90,160,255,.18)'); gr.addColorStop(1, 'rgba(140,190,255,.5)');
    g.fillStyle = gr; g.beginPath(); g.ellipse(X, Y, r, r * 0.85, 0, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(160,200,255,.6)'; g.lineWidth = 1.5; g.stroke();
    D.system(g, o, X - r * 0.2, Y, L * (9e12 / o.s), t);
  };
  D.gap = (g, o, X, Y, L, t, i, env) => {
    const r = L / 2;
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.setLineDash([6, 6]); g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(X - r, Y); g.lineTo(X + r, Y); g.stroke(); g.setLineDash([]);
    circle(g, X - r, Y, 9, rad(g, X - r, Y, 0, 9, [[0, '#fff1a8'], [1, 'rgba(255,176,32,0)']]));
    circle(g, X + r, Y, 7, rad(g, X + r, Y, 0, 7, [[0, '#ffb0a0'], [1, 'rgba(194,54,26,0)']]));
    if (L > 60 && L < env.W * 3) {
      g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '700 12px ' + env.font; g.textAlign = 'center';
      g.fillText('Sun', X - r, Y - 14); g.fillText('Proxima', X + r, Y - 14);
    }
  };
  D.neutron = (g, o, X, Y, L, t) => {
    const r = L / 2, a = t * 1.5;
    for (const s of [1, -1]) {
      const bx = Math.cos(a) * s, by = Math.sin(a) * 0.4 * s;
      const gr = g.createLinearGradient(X, Y, X + bx * r * 8, Y - r * 8 * s * 0.9 + by * r);
      gr.addColorStop(0, 'rgba(160,210,255,.7)'); gr.addColorStop(1, 'rgba(160,210,255,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(X, Y); g.lineTo(X + bx * r * 8 - r * 1.5, Y - r * 8 * s); g.lineTo(X + bx * r * 8 + r * 1.5, Y - r * 8 * s); g.fill();
    }
    globe('neutron', L * 2).draw(g, X, Y, r, t);
  };

  function draw(g, o, i, X, Y, L, env) {
    g.globalAlpha = 1;
    const t = env.t;
    if (o.kind === 'globe') { const gl = globe(o.key, L * env.dpr); gl.draw(g, X, Y, L / 2, t * 0.05 + i); return; }
    if (o.kind === 'rock') { drawRock(g, o, i, X, Y, L, t); return; }
    if (SPRITES.has(o.kind)) { drawSprite(g, getSprite(o, i), X, Y, L, L * (o.tilt || (o.kind === 'galaxy' ? 0.9 : 1)), env.W, env.H); return; }
    if (D[o.kind]) D[o.kind](g, o, X, Y, L, t, i, env);
  }
  function warm(o, i, px) {
    if (o.kind === 'globe') globe(o.key, px);
    else if (SPRITES.has(o.kind)) getSprite(o, i);
  }

  window.SpaceArt = { draw, warm, HEIGHT, WIDTH, FLOAT, globe };
})();
