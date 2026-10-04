(function (root) {
  const P = (t, x, y, o) => Object.assign({ t, x: Math.round(x), y: Math.round(y) }, o || {});
  const row = (t, x, y, n, dx, dy = 0, o) => Array.from({ length: n }, (_, i) => P(t, x + dx * i, y + dy * i, o));
  const ring = (t, cx, cy, r, n, ph = 0, o) => Array.from({ length: n }, (_, i) => { const a = ph + i / n * Math.PI * 2; return P(t, cx + Math.cos(a) * r, cy + Math.sin(a) * r, o); });
  const path = (t, pts, gap, o) => {
    const out = [];
    let carry = 0;
    for (let k = 1; k < pts.length; k++) {
      const [x0, y0] = pts[k - 1], [x1, y1] = pts[k], L = Math.hypot(x1 - x0, y1 - y0);
      let d = k === 1 ? 0 : gap - carry;
      for (; d <= L + .01; d += gap) out.push(P(t, x0 + (x1 - x0) * d / L, y0 + (y1 - y0) * d / L, o));
      carry = L - (d - gap);
    }
    return out;
  };
  const spiral = (t, cx, cy, n, gap, turn) => {
    const out = []; let a = 0, r = 30;
    for (let i = 0; i < n; i++) { out.push(P(t, cx + Math.cos(a) * r, cy + Math.sin(a) * r)); const da = gap / r; a += da; r += turn * da / (Math.PI * 2); }
    return out;
  };

  const L = [
    { name: 'First fizz', tip: 'Click near a fizzer. Its pop sets off its neighbours.', sparks: 1, par: 1, p: [...row('b', 160, 312, 9, 85)] },
    { name: 'The bridge', tip: 'Big fizzers have a much bigger pop.', sparks: 1, par: 1, p: [P('b', 150, 200), P('b', 225, 200), P('b', 300, 200), P('b', 370, 235), P('big', 440, 280), P('b', 560, 340), P('b', 635, 370), P('b', 710, 400), P('b', 785, 430), P('b', 860, 460)] },
    { name: 'Liftoff', tip: 'Rockets fire a beam the way they point.', sparks: 1, par: 1, p: [P('rk', 150, 500, { a: -25 }), P('b', 839, 179), P('b', 914, 200), P('b', 764, 140), P('b', 880, 110), P('b', 230, 530), P('b', 300, 560)] },
    { name: 'Tiny steps', tip: 'Tiny fizzers only reach their closest friends.', sparks: 1, par: 1, p: path('tiny', [[120, 140], [500, 140], [500, 480], [880, 480]], 50) },
    { name: 'Relay', tip: 'Rockets can light other rockets.', sparks: 1, par: 1, p: [P('rk', 100, 560, { a: 0 }), P('rk', 900, 560, { a: -90 }), ...row('b', 900, 90, 9, -75), P('b', 420, 560), P('b', 640, 560)] },
    { name: 'Halo', tip: 'Where does a halo start?', sparks: 1, par: 1, p: [P('big', 500, 312), ...ring('b', 500, 312, 120, 10), P('b', 685, 312), ...ring('b', 500, 312, 250, 20)] },
    { name: 'Islands', tip: 'Two sparks this time. Spend them wisely.', sparks: 2, par: 2, p: [P('b', 150, 150), P('b', 220, 150), P('b', 185, 210), P('rk', 120, 230, { a: 20 }), P('b', 684, 435), P('b', 750, 410), P('b', 720, 490), P('b', 760, 110), P('b', 830, 110), P('b', 800, 170)] },
    { name: 'Big league', tip: 'Bigs can reach far. Small ones cannot reach back.', sparks: 1, par: 1, p: [...path('big', [[120, 500], [380, 500], [380, 140], [640, 140], [640, 500], [900, 500]], 130), P('b', 120, 390), P('b', 900, 390), P('b', 510, 260), P('b', 250, 610 - 0)] },
    { name: 'Ricochet', tip: 'Follow the beams around the tray.', sparks: 1, par: 1, p: [P('rk', 100, 100, { a: 0 }), P('rk', 900, 100, { a: 90 }), P('rk', 900, 525, { a: 180 }), P('rk', 500, 525, { a: -90 }), ...row('b', 500, 440, 5, 0, -75), P('b', 300, 100), P('b', 700, 100), P('b', 900, 310), P('b', 700, 525), P('b', 300, 525)] },
    { name: 'Snail shell', tip: 'Start from the middle, or the end. One of them works.', sparks: 1, par: 1, p: [P('big', 500, 312), ...spiral('b', 500, 312, 26, 78, 95).slice(1)] },
    { name: 'Fireworks', tip: 'Light the fuse in the middle.', sparks: 1, par: 1, p: [P('b', 500, 312), ...ring('rk', 500, 312, 70, 8).map((q, i) => Object.assign(q, { a: i * 45 })), P('b', 940, 312), P('b', 60, 312), P('b', 500, 40), P('b', 500, 585), P('b', 740, 552), P('b', 260, 72), P('b', 740, 72), P('b', 260, 552)] },
    { name: 'Grand finale', tip: 'Everything you have learned, all at once.', sparks: 2, par: 1, p: [...path('tiny', [[80, 80], [300, 80]], 50), P('rk', 350, 80, { a: 90 }), ...row('b', 350, 200, 5, 0, 80), P('big', 430, 540), ...ring('b', 560, 420, 85, 9), P('big', 560, 420), P('rk', 670, 495, { a: -60 }), P('b', 870, 150), P('b', 930, 120), P('b', 905, 60)] },

    { name: 'Shell game', tip: 'Shielded fizzers need two hits from two different pops.', sparks: 1, par: 1, adv: true, p: [...row('b', 100, 260, 12, 75), ...row('sh', 137, 320, 11, 75)] },
    { name: 'Tough nut', tip: 'Crack them first, then knock them over.', sparks: 2, par: 2, adv: true, p: [P('big', 500, 312), ...ring('sh', 500, 312, 112, 10)] },
    { name: 'Escort', tip: 'A beam counts as one hit. Its neighbours can give the second.', sparks: 1, par: 1, adv: true, p: [P('rk', 90, 312, { a: 0 }), ...row('sh', 220, 312, 8, 80), ...row('b', 260, 262, 7, 80), P('b', 860, 380), P('b', 900, 312)] },
    { name: 'Armour plating', tip: 'One spark can hit two things at once.', sparks: 2, par: 1, adv: true, p: [...ring('sh', 300, 312, 90, 7), P('big', 300, 312), P('b', 465, 312), P('b', 540, 312), P('big', 610, 312), ...ring('sh', 720, 312, 80, 7, .4), P('b', 720, 312)] },
    { name: 'Do not touch', tip: 'Red duds must stay unpopped. Clear everything else.', sparks: 1, par: 1, adv: true, p: [...row('b', 100, 312, 5, 75), P('dud', 500, 312), P('rk', 400, 385, { a: 0 }), P('b', 620, 385), ...row('b', 600, 312, 5, 75)] },
    { name: 'Minefield', tip: 'Pick your spark carefully.', sparks: 2, par: 2, adv: true, p: [...row('b', 120, 150, 4, 80), P('dud', 300, 240), P('dud', 520, 150), ...row('b', 640, 150, 4, 80), P('rk', 880, 215, { a: 90 }), ...row('b', 160, 470, 10, 80), P('dud', 460, 360), P('dud', 820, 360)] },
    { name: 'Thread the needle', tip: 'Beams are thin. Duds beside the line are safe.', sparks: 1, par: 1, adv: true, p: [P('b', 90, 312), P('rk', 160, 312, { a: 0 }), P('dud', 400, 262), P('dud', 400, 362), P('dud', 600, 262), P('dud', 600, 362), ...ring('b', 860, 312, 80, 7)] },
    { name: 'Bottleneck', tip: 'Tiny fizzers squeeze past duds that a big pop would hit.', sparks: 2, par: 2, adv: true, p: [P('big', 300, 200), ...ring('b', 300, 200, 120, 9), ...row('tiny', 490, 200, 4, 50), P('dud', 565, 265), P('dud', 565, 135), ...row('b', 680, 140, 3, 0, 80), ...row('b', 760, 140, 3, 0, 80), P('dud', 300, 470), P('b', 300, 590), P('b', 220, 560)] },
    { name: 'Timers', tip: 'Purple timers wait before they pop.', sparks: 1, par: 1, adv: true, p: [P('tm', 160, 312, { d: 1.2 }), ...row('b', 240, 312, 3, 75), P('tm', 460, 312, { d: 1.6 }), ...row('b', 540, 312, 3, 75), P('tm', 760, 312, { d: 1 }), P('b', 840, 312), P('b', 900, 250), P('b', 900, 375)] },
    { name: 'Second chances', tip: 'A timer pops late, which is exactly when a cracked shield needs it.', sparks: 1, par: 1, adv: true, p: [P('b', 300, 312), P('tm', 340, 380, { d: 1 }), P('sh', 380, 312), P('b', 460, 312), P('tm', 500, 380, { d: 1.2 }), P('sh', 540, 312), P('b', 620, 312), P('big', 700, 312), P('b', 800, 250), P('b', 800, 375), P('sh', 860, 312), P('b', 915, 262), P('b', 915, 362)] },
    { name: 'Merry-go-round', tip: 'Some fizzers move. Fire when they cross the line.', sparks: 1, par: 1, adv: true, moving: true, p: [P('b', 120, 312), P('b', 195, 312), P('rk', 270, 312, { a: 0 }), P('b', 500, 312, { mv: { k: 'orbit', cx: 500, cy: 312, r: 160, s: .9, ph: 1 } }), P('b', 500, 312, { mv: { k: 'orbit', cx: 500, cy: 312, r: 160, s: .9, ph: 1 + Math.PI } }), ...row('b', 730, 312, 3, 75), P('b', 195, 240), P('b', 195, 384)] },
    { name: 'Pendulum', tip: 'Arm the timer at the top. It pops at the bottom.', sparks: 1, par: 1, adv: true, moving: true, p: [...row('b', 100, 120, 5, 75), P('tm', 450, 170, { d: 2.2, mv: { k: 'line', x0: 450, y0: 170, x1: 640, y1: 470, s: 1.4, ph: -Math.PI / 2 } }), P('dud', 470, 380), ...row('b', 640, 540, 4, 75), P('b', 700, 470)] },
    { name: 'Traffic', tip: 'Time the first spark for the top lane. Catch any stragglers with the second.', sparks: 2, par: 2, adv: true, moving: true, p: [P('rk', 70, 200, { a: 0 }), P('b', 500, 200, { mv: { k: 'line', x0: 500, y0: 110, x1: 500, y1: 290, s: 1.6 } }), P('rk', 930, 200, { a: 90 }), P('b', 600, 450, { mv: { k: 'line', x0: 600, y0: 360, x1: 600, y1: 540, s: .8 } }), P('rk', 930, 450, { a: 180 }), ...ring('b', 160, 450, 70, 6), P('b', 160, 450)] },
    { name: 'Clockwork', tip: 'Shields, timers, rockets and a ticking heart.', sparks: 2, par: 1, adv: true, p: [P('tm', 500, 312, { d: 1 }), ...ring('sh', 500, 312, 80, 8), ...ring('b', 500, 312, 165, 14), ...ring('rk', 500, 312, 240, 4, Math.PI / 4).map((q, i) => Object.assign(q, { a: 45 + i * 90 })), P('b', 770, 42), P('b', 230, 42), P('b', 770, 582), P('b', 230, 582)] },
    { name: 'No pressure', tip: 'Duds everywhere. One clean spark.', sparks: 1, par: 1, adv: true, p: [...ring('dud', 500, 312, 180, 10, 0), ...ring('b', 500, 312, 70, 6), P('b', 500, 312), P('rk', 500, 230, { a: -90 }), ...row('b', 500, 40, 3, 75, 0), ...row('b', 425, 40, 3, -75, 0)] },
    { name: 'Lab accident', tip: 'The final experiment. Every trick in the lab, one spark.', sparks: 2, par: 1, adv: true, p: [...path('tiny', [[80, 560], [80, 300]], 50), P('rk', 80, 245, { a: -20 }), P('sh', 300, 170), P('b', 360, 150), P('b', 300, 100), P('b', 430, 190), P('tm', 500, 235, { d: .8 }), ...ring('b', 640, 312, 85, 8), P('big', 640, 312), P('dud', 640, 560), P('dud', 880, 312), P('rk', 760, 420, { a: -82 }), P('b', 800, 150), P('b', 870, 130)] }
  ];

  function daily(seed) {
    let s = seed >>> 0 || 1;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const types = ['b', 'b', 'b', 'b', 'b', 'big', 'tiny', 'tiny', 'rk', 'sh', 'dud', 'tm'];
    const p = [];
    let tries = 0;
    while (p.length < 30 && tries++ < 4000) {
      const t = types[rnd() * types.length | 0];
      const x = 60 + rnd() * 880, y = 50 + rnd() * 525;
      if (p.some((q) => Math.hypot(q.x - x, q.y - y) < 58)) continue;
      const near = p.filter((q) => Math.hypot(q.x - x, q.y - y) < 95).length;
      if (p.length > 3 && !near && rnd() < .7) continue;
      p.push(P(t, x, y, t === 'rk' ? { a: Math.round(rnd() * 8) * 45 } : t === 'tm' ? { d: .6 + Math.round(rnd() * 3) * .3 } : null));
    }
    return { name: 'Daily lab', tip: 'Same tray for everyone today. Pop as many as you can with two sparks, without a single dud.', sparks: 2, par: 2, daily: true, p };
  }

  root.FZ_LEVELS = L;
  root.FZ_DAILY = daily;
})(typeof window !== 'undefined' ? window : globalThis);
