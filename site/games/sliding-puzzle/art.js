(function () {
  const TAU = Math.PI * 2;
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function kit(g, seed) {
    const r = rng(seed);
    const k = {
      r, rr: (a, b) => a + r() * (b - a),
      lin(x0, y0, x1, y1, stops) { const gr = g.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; },
      rad(x, y, r0, r1, stops, x0 = x, y0 = y) { const gr = g.createRadialGradient(x0, y0, r0, x, y, r1); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; },
      fill(f, x = 0, y = 0, w = 600, h = 600) { g.fillStyle = f; g.fillRect(x, y, w, h); },
      circ(x, y, rad, f) { g.fillStyle = f; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); },
      ell(x, y, rx, ry, f, rot = 0) { g.fillStyle = f; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); },
      path(d, f, stroke, lw) { const p = new Path2D(d); if (f) { g.fillStyle = f; g.fill(p); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(p); } },
      poly(pts, f) { g.fillStyle = f; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); },
      ridge(y0, amp, freq, f, ph = 0, jag = 0) { g.fillStyle = f; g.beginPath(); g.moveTo(0, 600); for (let x = 0; x <= 600; x += 6) g.lineTo(x, y0 - Math.sin(x * freq + ph) * amp - Math.sin(x * freq * 2.7 + ph * 2) * amp * 0.35 - (jag ? (r() - 0.5) * jag : 0)); g.lineTo(600, 600); g.closePath(); g.fill(); },
      stars(n, y1, col = '#fff') { for (let i = 0; i < n; i++) { g.globalAlpha = 0.3 + r() * 0.7; k.circ(r() * 600, r() * y1, r() * 1.8 + 0.4, col); } g.globalAlpha = 1; },
      cloud(x, y, s, f) { [[0, 0, 40], [38, -14, 46], [80, 0, 38], [40, 12, 40], [-30, 10, 28], [112, 12, 26]].forEach(([dx, dy, rad]) => k.circ(x + dx * s, y + dy * s, rad * s, f)); },
      pine(x, y, h, f, snow) { const w = h * 0.42; for (let i = 0; i < 4; i++) { const ty = y - h + i * h * 0.2, bw = w * (0.45 + i * 0.2); k.poly([[x, ty], [x - bw, ty + h * 0.32], [x + bw, ty + h * 0.32]], f); if (snow) k.poly([[x, ty], [x - bw * 0.45, ty + h * 0.14], [x + bw * 0.45, ty + h * 0.14]], snow); } k.fill('#3b2a1f', x - h * 0.04, y - h * 0.04, h * 0.08, h * 0.12); },
      glow(x, y, rad, col) { g.fillStyle = k.rad(x, y, 0, rad, [[0, col], [1, 'rgba(0,0,0,0)']]); g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    };
    return k;
  }

  const PICS = [
    { id: 'fox', set: 'Wild', name: 'Autumn fox', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 600, [[0, '#ffcf8a'], [0.55, '#ffa765'], [1, '#e8743b']]));
      k.glow(420, 160, 260, 'rgba(255,240,200,.7)');
      for (let i = 0; i < 9; i++) { const x = i * 75 + k.rr(-20, 20), h = k.rr(220, 320); k.fill('#7a4a2e', x - 7, 600 - h - 60, 14, h + 60); k.circ(x, 600 - h - 60, k.rr(55, 80), ['#d9582b', '#e98a2f', '#c43f2b', '#f0a73c'][i % 4]); k.circ(x + 30, 600 - h - 20, k.rr(35, 50), ['#e98a2f', '#c43f2b', '#f0a73c', '#d9582b'][i % 4]); }
      k.ridge(470, 14, 0.012, '#a7542d'); k.ridge(500, 10, 0.02, '#8a4325', 2);
      k.ell(300, 520, 150, 28, 'rgba(60,25,10,.35)');
      k.path('M380 500 C470 500 520 430 480 370 C450 330 400 360 420 400 C440 440 400 470 360 470 Z', '#f07a2b');
      k.path('M480 370 C500 340 470 320 455 340 C445 352 455 372 470 380 Z', '#fff6ea');
      k.path('M230 505 C200 430 230 340 300 320 C370 340 400 430 370 505 Z', '#f07a2b');
      k.path('M262 505 C255 450 275 400 300 392 C325 400 345 450 338 505 Z', '#fff1df');
      k.path('M232 255 L222 170 L282 222 Z', '#e0611c'); k.path('M368 255 L378 170 L318 222 Z', '#e0611c');
      k.path('M238 238 L234 194 L266 222 Z', '#4a2615'); k.path('M362 238 L366 194 L334 222 Z', '#4a2615');
      k.path('M300 200 C360 200 395 245 380 285 C370 315 330 345 300 360 C270 345 230 315 220 285 C205 245 240 200 300 200 Z', '#f07a2b');
      k.path('M300 360 C280 348 240 322 226 290 C258 300 285 312 300 330 C315 312 342 300 374 290 C360 322 320 348 300 360 Z', '#fff6ea');
      k.circ(300, 345, 9, '#2b1a12');
      k.path('M258 272 q12 -10 24 0 M318 272 q12 -10 24 0', null, '#2b1a12', 5);
      for (let i = 0; i < 26; i++) { const x = k.rr(0, 600), y = k.rr(0, 600); k.ell(x, y, 9, 5, ['#d9582b', '#f0a73c', '#b8361f'][i % 3], k.rr(0, 3)); }
    } },
    { id: 'koi', set: 'Wild', name: 'Koi pond', draw(g, k) {
      k.fill(k.rad(300, 300, 40, 480, [[0, '#4fc3c8'], [0.6, '#1f8a99'], [1, '#0c4e63']]));
      g.globalAlpha = 0.18; for (let i = 0; i < 40; i++) { g.strokeStyle = '#e0ffff'; g.lineWidth = 2; g.beginPath(); g.ellipse(k.rr(0, 600), k.rr(0, 600), k.rr(10, 40), k.rr(4, 12), 0, 0, TAU); g.stroke(); } g.globalAlpha = 1;
      const koi = (x, y, rot, s, base, spots) => {
        g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
        k.ell(4, 6, 70, 26, 'rgba(0,30,40,.25)');
        k.path('M-90 0 C-120 -30 -130 -10 -115 0 C-130 10 -120 30 -90 0 Z', base);
        k.path('M-20 -18 L-5 -42 L10 -18 Z M-20 18 L-5 42 L10 18 Z', base);
        k.ell(0, 0, 68, 22, base);
        spots.forEach(([sx, sy, sr, c]) => k.ell(sx, sy, sr, sr * 0.7, c));
        k.circ(50, -8, 3.5, '#111'); k.circ(50, 8, 3.5, '#111');
        g.restore();
      };
      koi(200, 220, 0.5, 1.1, '#fff4ea', [[10, -6, 16, '#f26b1d'], [-30, 6, 12, '#f26b1d'], [40, 4, 9, '#222']]);
      koi(420, 380, -2.5, 1.2, '#f26b1d', [[0, -5, 14, '#fff4ea'], [-35, 5, 10, '#fff4ea']]);
      koi(360, 150, 2.9, 0.8, '#ffd23f', [[10, 0, 12, '#f26b1d']]);
      koi(160, 450, -0.4, 0.9, '#fff4ea', [[20, 0, 18, '#e2401f']]);
      const pad = (x, y, rad, flower) => { k.circ(x + 6, y + 8, rad, 'rgba(0,40,30,.3)'); g.fillStyle = '#3f9b4a'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, rad, 0.3, TAU - 0.1); g.closePath(); g.fill(); g.strokeStyle = '#2e7d39'; g.lineWidth = 2; for (let a = 0.6; a < TAU - 0.2; a += 0.5) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * rad * 0.9, y + Math.sin(a) * rad * 0.9); g.stroke(); } if (flower) { for (let i = 0; i < 8; i++) k.ell(x + Math.cos(i * TAU / 8) * 16, y + Math.sin(i * TAU / 8) * 16, 18, 8, '#ff8fb5', i * TAU / 8); for (let i = 0; i < 6; i++) k.ell(x + Math.cos(i * TAU / 6 + 0.3) * 9, y + Math.sin(i * TAU / 6 + 0.3) * 9, 12, 6, '#ffc1d6', i * TAU / 6 + 0.3); k.circ(x, y, 7, '#ffd23f'); } };
      pad(500, 110, 60, true); pad(90, 120, 46, false); pad(520, 520, 54, false); pad(80, 560, 70, true); pad(300, 560, 38, false);
      g.globalAlpha = 0.25; for (let i = 0; i < 12; i++) k.ell(k.rr(0, 600), k.rr(0, 600), k.rr(20, 60), 3, '#fff', k.rr(0, 3)); g.globalAlpha = 1;
    } },
    { id: 'owl', set: 'Wild', name: 'Night owl', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 600, [[0, '#0b1640'], [1, '#2a3a7a']])); k.stars(120, 600);
      k.glow(430, 150, 200, 'rgba(255,250,210,.35)'); k.circ(430, 150, 80, '#fff6cf'); k.circ(405, 130, 14, '#efe2a8'); k.circ(455, 175, 10, '#efe2a8'); k.circ(440, 120, 7, '#efe2a8');
      k.path('M-20 470 C150 430 350 470 620 400 L620 440 C380 500 160 470 -20 510 Z', '#4a3021');
      for (let i = 0; i < 6; i++) { const x = 60 + i * 100, y = 470 - i * 10; k.ell(x, y + 20, 26, 10, '#2f6b3a', 0.5); k.ell(x + 30, y + 10, 22, 9, '#3f8a4a', -0.4); }
      k.ell(270, 300, 110, 150, '#8b5a3c');
      k.ell(270, 345, 72, 100, '#e9d3b5');
      for (let i = 0; i < 12; i++) k.path(`M${232 + (i % 4) * 25} ${300 + Math.floor(i / 4) * 40} q8 10 16 0`, null, '#b48a62', 4);
      k.path('M175 190 L190 120 L230 170 Z M365 190 L350 120 L310 170 Z', '#6d4430');
      k.circ(225, 230, 52, '#a8744f'); k.circ(315, 230, 52, '#a8744f');
      k.circ(225, 230, 40, '#ffd23f'); k.circ(315, 230, 40, '#ffd23f');
      k.circ(228, 232, 22, '#1a1208'); k.circ(312, 232, 22, '#1a1208'); k.circ(235, 224, 7, '#fff'); k.circ(319, 224, 7, '#fff');
      k.path('M258 262 L282 262 L270 292 Z', '#f08a00');
      k.path('M240 445 l-6 30 M255 448 l0 30 M270 448 l6 30 M290 448 l0 30 M305 445 l6 30', null, '#f0a000', 7);
      k.ell(160, 330, 30, 80, '#6d4430', 0.25); k.ell(380, 330, 30, 80, '#6d4430', -0.25);
    } },
    { id: 'whale', set: 'Wild', name: 'Deep blue whale', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 600, [[0, '#4fc3f7'], [0.5, '#1565c0'], [1, '#0a2a5c']]));
      g.globalAlpha = 0.14; for (let i = 0; i < 6; i++) { const x = 60 + i * 110; k.poly([[x, 0], [x + 50, 0], [x + 140, 600], [x + 40, 600]], '#fff'); } g.globalAlpha = 1;
      k.path('M70 300 C120 210 330 190 450 240 C510 265 540 280 560 250 C575 225 600 230 590 260 C580 300 560 330 520 330 C480 380 330 420 200 400 C120 390 60 360 70 300 Z', '#3d5f8f');
      k.path('M90 340 C160 380 300 400 440 360 C400 400 300 418 200 404 C140 396 100 372 90 340 Z', '#c9d8ea');
      for (let i = 0; i < 6; i++) k.path(`M${150 + i * 45} ${375 + (i % 2) * 4} q20 6 40 0`, null, '#9fb4cf', 3);
      k.path('M250 370 C250 420 220 450 190 455 C210 420 215 395 220 370 Z', '#2f4c75');
      k.circ(150, 318, 7, '#0b1c33'); k.circ(152, 316, 2, '#fff');
      k.path('M110 300 q20 -8 40 0', null, '#2f4c75', 3);
      for (let i = 0; i < 18; i++) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(k.rr(60, 200), k.rr(60, 260), k.rr(3, 10), 0, TAU); g.stroke(); }
      for (let i = 0; i < 14; i++) { const x = 380 + k.rr(0, 180), y = 90 + k.rr(0, 90); k.ell(x, y, 10, 4, '#ffd23f'); k.poly([[x - 9, y], [x - 16, y - 5], [x - 16, y + 5]], '#ffd23f'); }
      k.ridge(560, 12, 0.02, '#c2a36b'); k.ridge(580, 8, 0.03, '#a5844e');
      for (let i = 0; i < 9; i++) { const x = 20 + i * 70 + k.rr(-10, 10); k.path(`M${x} 600 C${x - 20} 540 ${x + 20} 520 ${x} 470 C${x + 25} 520 ${x - 5} 545 ${x + 12} 600 Z`, i % 2 ? '#2e8b57' : '#3fae6a'); }
    } },
    { id: 'lighthouse', set: 'Places', name: 'Lighthouse at dusk', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 360, [[0, '#3b2a6b'], [0.5, '#c2507a'], [1, '#ffb36b']]), 0, 0, 600, 360);
      k.glow(150, 340, 220, 'rgba(255,220,150,.6)'); k.circ(150, 345, 60, '#ffd98a');
      k.fill(k.lin(0, 340, 0, 600, [[0, '#ff9e7a'], [0.25, '#5d4b8a'], [1, '#1e2650']]), 0, 340, 600, 260);
      g.globalAlpha = 0.5; for (let i = 0; i < 30; i++) k.fill('#ffd9b0', k.rr(40, 260), 350 + i * 8 + k.rr(0, 4), k.rr(20, 90), 2); g.globalAlpha = 1;
      g.globalAlpha = 0.28; k.poly([[420, 150], [-40, 60], [-40, 250]], '#fff6c2'); g.globalAlpha = 1;
      k.path('M330 600 C340 520 380 480 440 470 C500 460 560 480 610 520 L610 600 Z', '#2b2440');
      k.path('M300 600 C310 560 340 540 380 545 C410 550 420 580 430 600 Z', '#3a3156');
      k.poly([[390, 470], [450, 470], [438, 180], [402, 180]], '#f4f1ea');
      for (let i = 0; i < 4; i++) { const y = 200 + i * 70; k.poly([[402 - i * 3 - 2, y], [438 + i * 3 + 2, y], [440 + i * 3 + 4, y + 30], [400 - i * 3 - 4, y + 30]], '#d84a3a'); }
      k.fill('#2b2440', 392, 160, 56, 22); k.circ(420, 150, 18, '#fff6c2'); k.glow(420, 150, 70, 'rgba(255,246,194,.8)');
      k.poly([[386, 140], [454, 140], [420, 108]], '#d84a3a');
      k.fill('#ffd98a', 412, 300, 16, 22);
      for (let i = 0; i < 5; i++) { const x = 120 + i * 60 + k.rr(-20, 20), y = 90 + k.rr(0, 80); k.path(`M${x - 12} ${y} q6 -8 12 0 q6 -8 12 0`, null, '#2b2440', 3); }
    } },
    { id: 'mountain', set: 'Places', name: 'Mountain sunrise', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 420, [[0, '#7fb6ff'], [0.55, '#ffb3c1'], [1, '#ffe39a']]));
      k.glow(300, 300, 240, 'rgba(255,230,150,.8)'); k.circ(300, 300, 64, '#fff2b3');
      const mtn = (pts, f, snow) => { k.poly(pts, f); if (snow) snow.forEach((s) => k.poly(s, '#f8fbff')); };
      mtn([[-20, 420], [120, 190], [230, 330], [330, 160], [470, 320], [560, 220], [640, 420]], '#7d88b8', [[[120, 190], [95, 232], [118, 222], [140, 240], [150, 222]], [[330, 160], [298, 214], [320, 204], [344, 222], [362, 205]], [[560, 220], [538, 254], [560, 246], [584, 262]]]);
      mtn([[-20, 440], [80, 330], [190, 410], [300, 300], [420, 420], [520, 340], [640, 440]], '#59629a');
      k.fill(k.lin(0, 420, 0, 600, [[0, '#a8c6e8'], [1, '#5a7fb5']]), 0, 420, 600, 180);
      g.save(); g.globalAlpha = 0.35; g.translate(0, 840); g.scale(1, -1);
      mtn([[-20, 420], [120, 190], [230, 330], [330, 160], [470, 320], [560, 220], [640, 420]], '#7d88b8');
      g.restore(); g.globalAlpha = 1;
      g.globalAlpha = 0.5; for (let i = 0; i < 18; i++) k.fill('#fff', k.rr(100, 500), 430 + k.rr(0, 160), k.rr(20, 70), 2); g.globalAlpha = 1;
      k.ridge(560, 18, 0.015, '#2f5d3a');
      for (let i = 0; i < 12; i++) k.pine(i * 55 + k.rr(-10, 10), 575 + k.rr(-8, 8), k.rr(70, 110), '#24452b');
    } },
    { id: 'city', set: 'Places', name: 'City at night', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 600, [[0, '#0d0a2b'], [0.6, '#3b1f6b'], [1, '#8a3a7a']])); k.stars(90, 300);
      k.circ(470, 110, 44, '#fff3c4'); k.circ(490, 98, 40, '#1a1240');
      const bl = (x, w, h, c, win) => { k.fill(c, x, 470 - h, w, h + 10); for (let yy = 470 - h + 14; yy < 460; yy += 22) for (let xx = x + 8; xx < x + w - 10; xx += 18) if (k.r() < win) k.fill(k.r() < 0.8 ? '#ffd76b' : '#9ff0ff', xx, yy, 9, 12); };
      for (let i = 0; i < 12; i++) bl(i * 52 - 10, 60, k.rr(120, 260), '#2a1d55', 0.15);
      for (let i = 0; i < 9; i++) bl(i * 70 - 20, k.rr(50, 70), k.rr(90, 330), ['#3d2a73', '#46307f', '#352566'][i % 3], 0.55);
      k.fill('#4a3585', 300, 110, 8, 30); k.circ(304, 108, 5, '#ff4f6d');
      k.fill(k.lin(0, 470, 0, 600, [[0, '#2a1b5a'], [1, '#0e0a2a']]), 0, 470, 600, 130);
      g.globalAlpha = 0.6; for (let i = 0; i < 60; i++) k.fill(k.r() < 0.7 ? '#ffd76b' : '#9ff0ff', k.rr(0, 600), k.rr(480, 600), k.rr(6, 30), 2); g.globalAlpha = 1;
      k.path('M0 470 L600 470', null, '#ff6fb5', 3);
    } },
    { id: 'desert', set: 'Places', name: 'Desert dunes', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 380, [[0, '#ffb36b'], [1, '#ffe7b3']]));
      k.glow(420, 230, 200, 'rgba(255,255,220,.8)'); k.circ(420, 230, 80, '#fff4c9');
      k.ridge(360, 30, 0.009, '#f2a65a', 1); k.ridge(420, 26, 0.012, '#e48a3e', 3); k.ridge(480, 22, 0.016, '#d0702e', 5); k.ridge(550, 18, 0.02, '#b85a24', 2);
      const cactus = (x, y, h) => { const c = '#3f8a4a', w = h * 0.16; k.path(`M${x - w / 2} ${y} V${y - h + w / 2} a${w / 2} ${w / 2} 0 0 1 ${w} 0 V${y} Z`, c); k.path(`M${x - w / 2} ${y - h * 0.45} H${x - w * 1.4} V${y - h * 0.75} a${w / 2.4} ${w / 2.4} 0 0 1 ${w * 0.84} 0 V${y - h * 0.58} H${x - w / 2} Z`, c); k.path(`M${x + w / 2} ${y - h * 0.55} H${x + w * 1.3} V${y - h * 0.82} a${w / 2.4} ${w / 2.4} 0 0 1 ${w * 0.84} 0 V${y - h * 0.4} H${x + w / 2} Z`, c); g.globalAlpha = 0.25; k.fill('#fff', x - w * 0.15, y - h + w, w * 0.12, h - w * 1.4); g.globalAlpha = 1; };
      cactus(120, 520, 190); cactus(500, 560, 130); cactus(330, 470, 80);
      for (let i = 0; i < 4; i++) { const x = 160 + i * 40, y = 120 + (i % 2) * 20; k.path(`M${x - 10} ${y} q5 -7 10 0 q5 -7 10 0`, null, '#7a3b1e', 3); }
    } },
    { id: 'rocket', set: 'Cosmos', name: 'Lift off', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 600, [[0, '#050818'], [0.6, '#16245a'], [1, '#3b4fa0']])); k.stars(160, 450);
      k.path('M380 600 V250 H400 V600 Z M380 300 L340 300 M380 380 L340 380 M380 460 L340 460', '#7d8ea3', '#7d8ea3', 6);
      k.glow(270, 470, 140, 'rgba(255,170,60,.8)');
      k.path('M240 440 C230 500 255 540 270 580 C285 540 310 500 300 440 Z', '#ffb03a'); k.path('M255 440 C250 480 262 510 270 535 C278 510 290 480 285 440 Z', '#fff2b3');
      k.path('M230 440 L230 260 C230 190 250 140 270 110 C290 140 310 190 310 260 L310 440 Z', '#f3f5f8');
      k.path('M270 110 C255 132 245 155 238 180 L302 180 C295 155 285 132 270 110 Z', '#e53935');
      k.path('M230 360 L190 430 L190 450 L230 430 Z M310 360 L350 430 L350 450 L310 430 Z', '#e53935');
      k.circ(270, 250, 26, '#90a4ae'); k.circ(270, 250, 19, '#4fc3f7'); k.circ(263, 243, 6, '#e1f5fe');
      k.fill('#cfd8dc', 230, 400, 80, 10);
      for (let i = 0; i < 22; i++) k.circ(k.rr(120, 460), k.rr(530, 640), k.rr(30, 70), ['#e8e3df', '#d6cfca', '#f5f1ee'][i % 3]);
    } },
    { id: 'planet', set: 'Cosmos', name: 'Ringed giant', draw(g, k) {
      k.fill('#07061a'); k.glow(160, 180, 280, 'rgba(160,60,200,.45)'); k.glow(480, 460, 260, 'rgba(40,120,220,.4)'); k.stars(220, 600);
      g.save(); g.translate(300, 310); g.rotate(-0.35);
      g.strokeStyle = 'rgba(255,214,150,.5)'; g.lineWidth = 26; g.beginPath(); g.ellipse(0, 0, 240, 64, 0, Math.PI, TAU); g.stroke();
      g.restore();
      g.save(); g.beginPath(); g.arc(300, 310, 150, 0, TAU); g.clip();
      k.fill(k.lin(150, 160, 450, 460, [[0, '#ffd59a'], [0.5, '#e8955a'], [1, '#7a3b5a']]));
      for (let i = 0; i < 9; i++) { g.globalAlpha = 0.35; g.save(); g.translate(300, 310); g.rotate(-0.35); k.fill(i % 2 ? '#fff0d0' : '#b85a3a', -200, -150 + i * 34, 400, k.rr(8, 18)); g.restore(); }
      g.globalAlpha = 1; k.glow(240, 250, 160, 'rgba(255,255,255,.3)'); k.fill(k.rad(300, 310, 80, 160, [[0, 'rgba(0,0,0,0)'], [1, 'rgba(20,0,40,.6)']]));
      g.restore();
      g.save(); g.translate(300, 310); g.rotate(-0.35);
      g.strokeStyle = 'rgba(255,214,150,.85)'; g.lineWidth = 26; g.beginPath(); g.ellipse(0, 0, 240, 64, 0, 0, Math.PI); g.stroke();
      g.strokeStyle = 'rgba(255,240,210,.6)'; g.lineWidth = 6; g.beginPath(); g.ellipse(0, 0, 220, 56, 0, 0, Math.PI); g.stroke();
      g.restore();
      k.circ(500, 120, 30, '#cfd8dc'); k.circ(492, 112, 8, '#b0bec5'); k.circ(510, 128, 5, '#b0bec5');
      k.circ(100, 480, 18, '#90caf9'); k.circ(95, 476, 5, '#64b5f6');
    } },
    { id: 'balloons', set: 'Cosmos', name: 'Balloon festival', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 600, [[0, '#62b8ff'], [1, '#d9f1ff']]));
      k.cloud(60, 120, 1, 'rgba(255,255,255,.9)'); k.cloud(380, 80, 0.8, 'rgba(255,255,255,.8)'); k.cloud(420, 300, 1.1, 'rgba(255,255,255,.85)');
      const balloon = (x, y, s, cols) => {
        g.save(); g.translate(x, y); g.scale(s, s);
        const env = new Path2D('M0 -90 C60 -90 80 -40 70 0 C60 40 20 70 14 90 L-14 90 C-20 70 -60 40 -70 0 C-80 -40 -60 -90 0 -90 Z');
        g.save(); g.clip(env); cols.forEach((c, i) => k.fill(c, -80 + i * (160 / cols.length), -100, 160 / cols.length + 1, 200)); k.fill(k.rad(-25, -40, 0, 110, [[0, 'rgba(255,255,255,.45)'], [1, 'rgba(0,0,0,.15)']]), -80, -100, 160, 200); g.restore();
        k.path('M-12 90 L-10 112 M12 90 L10 112', null, '#5d4037', 2);
        k.fill('#8d6e63', -12, 112, 24, 18);
        g.restore();
      };
      balloon(170, 260, 1.4, ['#e53935', '#ffd23f', '#e53935', '#ffd23f', '#e53935']);
      balloon(430, 180, 1.0, ['#7c4dff', '#4fc3f7', '#7c4dff', '#4fc3f7']);
      balloon(470, 410, 0.7, ['#43a047', '#fff', '#43a047', '#fff', '#43a047']);
      balloon(310, 110, 0.5, ['#ff7043', '#ffca28', '#ff7043']);
      k.ridge(560, 26, 0.01, '#7cc576'); k.ridge(590, 18, 0.017, '#4f9e4b', 2);
    } },
    { id: 'aurora', set: 'Cosmos', name: 'Northern lights', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 600, [[0, '#020617'], [0.7, '#0b2a4a'], [1, '#1d4f6e']])); k.stars(150, 420);
      for (let band = 0; band < 3; band++) {
        for (let i = 0; i < 26; i++) {
          g.globalAlpha = 0.07; g.strokeStyle = band === 1 ? '#c084fc' : '#4ade80'; g.lineWidth = 30 - i;
          g.beginPath(); for (let x = -20; x <= 620; x += 10) { const y = 140 + band * 60 + Math.sin(x * 0.012 + band * 1.7) * 50 + Math.sin(x * 0.03 + band) * 14 + i * 3; x === -20 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
        }
      }
      g.globalAlpha = 1;
      k.ridge(470, 30, 0.008, '#c9dcef'); k.ridge(520, 22, 0.014, '#e8f1fb', 2);
      for (let i = 0; i < 14; i++) k.pine(i * 46 + k.rr(-8, 8), 560 + k.rr(-12, 12), k.rr(70, 130), '#0b1f2e', '#dce9f5');
      k.fill('#f4f8fc', 0, 565, 600, 40);
    } },
    { id: 'cat', set: 'Cozy', name: 'Window cat', draw(g, k) {
      k.fill(k.lin(0, 0, 600, 600, [[0, '#f6c9a8'], [1, '#e8a983']]));
      k.fill('#6b4a3a', 60, 40, 480, 420); k.fill(k.lin(0, 60, 0, 440, [[0, '#18234d'], [1, '#3c5a9a']]), 80, 60, 440, 380);
      g.save(); g.beginPath(); g.rect(80, 60, 440, 380); g.clip(); k.stars(40, 300); k.circ(420, 140, 40, '#fff3c4'); k.glow(420, 140, 100, 'rgba(255,243,196,.3)');
      g.globalAlpha = 0.4; for (let i = 0; i < 50; i++) { const x = k.rr(80, 520), y = k.rr(60, 440); k.path(`M${x} ${y} l-4 14`, null, '#bcd4ff', 1.5); } g.globalAlpha = 1;
      k.ridge(430, 16, 0.02, '#1b2a50'); g.restore();
      k.fill('#6b4a3a', 296, 60, 10, 380); k.fill('#6b4a3a', 80, 246, 440, 10);
      k.path('M40 30 C90 140 70 300 110 470 L40 470 Z', '#d84a3a'); k.path('M560 30 C510 140 530 300 490 470 L560 470 Z', '#d84a3a');
      k.fill('#8a6450', 30, 456, 540, 30); k.fill('#5e4032', 30, 484, 540, 10);
      k.path('M330 456 C320 420 330 340 370 330 C410 340 430 420 420 456 Z', '#4a4a55');
      k.path('M420 450 C470 455 500 420 480 390', null, '#4a4a55', 14);
      k.circ(375, 300, 46, '#4a4a55'); k.path('M338 280 L342 238 L368 264 Z M412 280 L408 238 L382 264 Z', '#4a4a55'); k.path('M346 274 L348 250 L362 264 Z M404 274 L402 250 L388 264 Z', '#ff9fb2');
      k.ell(358, 298, 7, 9, '#cddc39'); k.ell(392, 298, 7, 9, '#cddc39'); k.ell(358, 298, 2.5, 8, '#111'); k.ell(392, 298, 2.5, 8, '#111');
      k.path('M370 314 h10 l-5 5 z', '#ff9fb2');
      k.fill('#c46a3a', 140, 400, 70, 56); k.fill('#a3532a', 136, 396, 78, 12);
      for (let i = 0; i < 7; i++) k.ell(175 + Math.cos(i) * 20, 380 - i * 8, 26, 10, '#3f8a4a', -0.6 + i * 0.25);
      k.fill(k.lin(0, 494, 0, 600, [[0, '#d99a72'], [1, '#c4825d']]), 0, 494, 600, 106);
    } },
    { id: 'tea', set: 'Cozy', name: 'Tea time', draw(g, k) {
      k.fill('#fff4e6');
      for (let y = 0; y < 600; y += 50) for (let x = 0; x < 600; x += 50) if ((x + y) / 50 % 2) k.fill('rgba(229,57,53,.22)', x, y, 50, 50);
      for (let x = 0; x < 600; x += 50) k.fill('rgba(229,57,53,.12)', x, 0, 25, 600);
      k.ell(300, 380, 210, 70, 'rgba(80,40,20,.15)');
      k.ell(420, 470, 120, 40, '#f5f5f5'); k.ell(420, 465, 100, 30, '#ececec');
      for (let i = 0; i < 5; i++) { const x = 360 + i * 30, y = 455 + (i % 2) * 8; k.circ(x, y, 22, '#d9a066'); k.circ(x - 5, y - 4, 3, '#6d3f1e'); k.circ(x + 6, y + 3, 3, '#6d3f1e'); }
      k.path('M170 400 C150 330 170 250 260 240 C350 250 370 330 350 400 Z', '#2f6fb5');
      k.path('M175 330 C230 345 290 345 345 330', null, '#fff', 6);
      for (let i = 0; i < 5; i++) k.circ(200 + i * 30, 360, 8, '#fff');
      k.path('M350 330 C410 310 420 280 440 260', null, '#2f6fb5', 18);
      k.path('M170 300 C120 300 120 370 175 370', null, '#2f6fb5', 14);
      k.ell(260, 242, 70, 16, '#2a5d9a'); k.circ(260, 222, 14, '#2a5d9a');
      k.path('M440 250 C450 220 430 200 445 175 M455 245 C470 215 450 195 465 170', null, 'rgba(255,255,255,.9)', 5);
      const cup = (x, y) => { k.ell(x, y + 32, 64, 16, '#ececec'); k.path(`M${x - 46} ${y - 20} C${x - 46} ${y + 30} ${x + 46} ${y + 30} ${x + 46} ${y - 20} Z`, '#fff'); k.ell(x, y - 20, 46, 12, '#b5652e'); k.path(`M${x + 44} ${y - 8} c26 0 26 26 0 26`, null, '#fff', 8); k.path(`M${x - 40} ${y} q40 12 80 0`, null, '#2f6fb5', 4); };
      cup(140, 500); cup(470, 230);
      k.path('M120 460 C130 430 110 420 125 395 M150 455 C162 428 140 418 155 392', null, 'rgba(160,110,80,.5)', 4);
    } },
    { id: 'sunflowers', set: 'Cozy', name: 'Sunflower field', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 380, [[0, '#4aa3ff'], [1, '#bfe4ff']]));
      k.cloud(80, 90, 0.9, '#fff'); k.cloud(390, 140, 0.7, 'rgba(255,255,255,.9)');
      k.ridge(330, 12, 0.01, '#6fb35a'); k.fill('#5c9e46', 0, 340, 600, 260);
      const flower = (x, y, s) => {
        k.path(`M${x} ${y} C${x + 4 * s} ${y + 80 * s} ${x - 6 * s} ${y + 160 * s} ${x} ${y + 400 * s}`, null, '#3f7d2a', 7 * s);
        k.ell(x + 22 * s, y + 70 * s, 26 * s, 10 * s, '#4f9a33', -0.6); k.ell(x - 22 * s, y + 110 * s, 26 * s, 10 * s, '#4f9a33', 0.6);
        for (let i = 0; i < 16; i++) { const a = i * TAU / 16; k.ell(x + Math.cos(a) * 34 * s, y + Math.sin(a) * 34 * s, 22 * s, 9 * s, i % 2 ? '#ffc107' : '#ffd54f', a); }
        k.circ(x, y, 24 * s, '#6d4c1e'); k.circ(x, y, 18 * s, '#4e3412');
        for (let i = 0; i < 10; i++) k.circ(x + (k.r() - 0.5) * 26 * s, y + (k.r() - 0.5) * 26 * s, 2 * s, '#8d6e2e');
      };
      for (let row = 0; row < 4; row++) { const s = 0.35 + row * 0.28, y = 340 + row * 70; for (let i = 0; i < 9 - row * 2; i++) flower(i * (600 / (8 - row * 2)) + k.rr(-15, 15) + (row % 2) * 30, y + k.rr(-10, 10), s); }
    } },
    { id: 'cabin', set: 'Cozy', name: 'Snowy cabin', draw(g, k) {
      k.fill(k.lin(0, 0, 0, 600, [[0, '#1b2b5a'], [0.6, '#6a5a9a'], [1, '#e8b7c8']])); k.stars(60, 250);
      k.ridge(420, 26, 0.009, '#c9d6ec'); k.fill(k.lin(0, 430, 0, 600, [[0, '#eef4ff'], [1, '#c9d8ef']]), 0, 430, 600, 170);
      k.fill('#7a4a2e', 200, 330, 220, 140);
      for (let i = 0; i < 7; i++) k.fill(i % 2 ? '#8d5636' : '#6d3f24', 200, 330 + i * 20, 220, 10);
      k.poly([[180, 340], [310, 250], [440, 340]], '#4a2a1a'); k.poly([[176, 340], [310, 244], [444, 340], [440, 352], [310, 262], [180, 352]], '#f5f9ff');
      k.fill('#5d3a26', 370, 250, 26, 60); k.fill('#f5f9ff', 366, 246, 34, 10);
      g.globalAlpha = 0.5; for (let i = 0; i < 6; i++) k.circ(384 + i * 14 + Math.sin(i) * 10, 230 - i * 26, 12 + i * 4, '#e6e9f5'); g.globalAlpha = 1;
      k.glow(255, 400, 70, 'rgba(255,200,90,.6)'); k.fill('#ffcf6b', 230, 380, 50, 44); k.fill('#7a4a2e', 253, 380, 4, 44); k.fill('#7a4a2e', 230, 400, 50, 4);
      k.fill('#4a2a1a', 330, 390, 50, 80); k.circ(370, 432, 3, '#ffcf6b');
      for (let i = 0; i < 7; i++) k.pine(i < 3 ? 40 + i * 55 : 450 + (i - 3) * 45, 500 + k.rr(-20, 20), k.rr(120, 180), '#1f4a3a', '#f5f9ff');
      for (let i = 0; i < 120; i++) k.circ(k.rr(0, 600), k.rr(0, 600), k.rr(1, 3.2), 'rgba(255,255,255,.85)');
    } }
  ];

  const cache = new Map();
  function render(id, size) {
    const key = `${id}@${size}`;
    if (cache.has(key)) return cache.get(key);
    const pic = PICS.find((p) => p.id === id) || PICS[0];
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d');
    g.scale(size / 600, size / 600);
    let h = 0; for (const ch of pic.id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    pic.draw(g, kit(g, h));
    const url = c.toDataURL(size > 300 ? 'image/jpeg' : 'image/png', 0.9);
    cache.set(key, url);
    return url;
  }
  window.SLIDE_ART = { PICS, render };
})();
