window.CX_GAMES = (() => {
  const A = window.CX_ART;
  const I = A.INK;
  const R = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const at = (el, x, y, s = 1, r = 0) => el && el.setAttribute('transform', `translate(${x} ${y}) rotate(${r}) scale(${s})`);
  const near = (x1, y1, x2, y2, d) => Math.hypot(x1 - x2, y1 - y2) < d;

  const list = [
    {
      id: 'knock', say: 'KNOCK IT OFF!', hint: 'Tap the glass, or press Space', dur: 5, simple: true,
      make(api) {
        api.set(`${A.room('#ffe3c7', '#d9a36f')}
          <rect x="40" y="170" width="250" height="16" rx="4" fill="#9c6644" stroke="${I}" stroke-width="3"/>
          <rect x="60" y="186" width="14" height="70" fill="#7f5539" stroke="${I}" stroke-width="3"/><rect x="256" y="186" width="14" height="70" fill="#7f5539" stroke="${I}" stroke-width="3"/>
          <g id="glass"><path d="M-16 -50h32l-4 50h-24z" fill="#bfe9ff" fill-opacity=".7" stroke="${I}" stroke-width="3" stroke-linejoin="round"/><path d="M-13 -30h26l-2 28h-22z" fill="#62b6ff" opacity=".7"/><path d="M-8 -44v30" stroke="#fff" stroke-width="3" opacity=".8"/></g>
          <g id="pw" transform="translate(372 150) rotate(-90)">${A.paw()}</g>
          <g transform="translate(350 296) scale(.75)">${A.cat('ok')}</g>`);
        const glass = api.q('#glass'), pw = api.q('#pw');
        let gx = 196, pushes = 0, fall = -1, swipe = 0;
        at(glass, gx, 170);
        const push = () => {
          if (fall >= 0) return;
          pushes++; gx += 34; swipe = 0.18; api.sound('tap');
          if (gx > 296) { fall = 0; api.sound('crash'); }
        };
        return {
          tap: push, act: push,
          tick(dt) {
            swipe = Math.max(0, swipe - dt);
            at(pw, 372 - (swipe > 0 ? 300 - gx + 70 : 0) * (swipe / 0.18), 150, 1, -90);
            if (fall >= 0) {
              fall += dt;
              at(glass, gx + fall * 70, 170 + fall * fall * 900, 1, fall * 400);
              if (fall > 0.35) api.win('Gravity: confirmed.');
            } else at(glass, gx, 170);
          }
        };
      }
    },
    {
      id: 'ignore', say: 'IGNORE THE HUMAN!', hint: 'Do absolutely nothing', dur: 3.6, simple: true,
      make(api) {
        const lines = ['Here kitty kitty!', 'Pspspspsps!', 'Who wants TUNA?', 'Come to mummy!', 'Look! A box!'];
        api.set(`${A.room('#e3f0ff', '#c9b28c')}
          <g transform="translate(110 300)">${A.human('front')}</g>
          <g id="hand" transform="translate(178 190)"><circle r="16" fill="#f2c9a0" stroke="${I}" stroke-width="3"/></g>
          <g id="bub">${A.bubble(150, 60, lines[0], 190)}</g>
          <g transform="translate(310 290) scale(-.85 .85)">${A.cat('sleep', { noTail: false })}</g>`);
        const hand = api.q('#hand'), bub = api.q('#bub text');
        let li = 0, lt = 0;
        const fail = () => api.lose('You came when called. Disgraceful.');
        return {
          tap: fail, act: fail, left: fail, right: fail, up: fail, down: fail, num: fail,
          tick(dt, t) {
            at(hand, 178 + Math.sin(t * 14) * 10, 190 + Math.cos(t * 9) * 4);
            lt += dt;
            if (lt > 0.85 / api.sf) { lt = 0; li = (li + 1) % lines.length; bub.textContent = lines[li]; }
          },
          timeout: () => 'win'
        };
      },
      winText: 'Ignored. Magnificent.'
    },
    {
      id: 'box', say: 'SIT IN THE SMALLEST BOX!', hint: 'Tap it, or use 1, 2, 3', dur: 4.2, simple: true,
      make(api) {
        const sizes = api.shuffle([46, 82, 118]);
        const xs = [80, 200, 320];
        const box = (s, i) => `<g class="cx-pick" data-i="${i}" transform="translate(${xs[i]} 262)"><path d="M${-s / 2} 0v${-s * 0.8}h${s}v${s * 0.8}z" fill="#c8915a" stroke="${I}" stroke-width="3"/><path d="M${-s / 2} ${-s * 0.8}l${-s * 0.18} ${-s * 0.25}M${s / 2} ${-s * 0.8}l${s * 0.18} ${-s * 0.25}" stroke="${I}" stroke-width="3"/><path d="M${-s / 4} ${-s * 0.5}h${s / 2}" stroke="${I}" stroke-width="2" opacity=".4"/><text x="0" y="22" text-anchor="middle" class="cx-num">${i + 1}</text></g>`;
        api.set(`${A.room('#fde2e4', '#e2c39f', 230)}${sizes.map(box).join('')}<g id="sel" opacity="0"><path d="M0 0l-10-14h20z" fill="#ff4f8b" stroke="${I}" stroke-width="2"/></g><g id="pc" transform="translate(200 150) scale(.5)">${A.cat('ok')}</g>`);
        let sel = 1, done = false;
        const choose = (i) => {
          if (done) return; done = true;
          const s = sizes[i];
          const pc = api.q('#pc');
          at(pc, xs[i], 262 - s * 0.45, Math.max(0.32, s / 150));
          if (s === 46) { api.sound('purr'); api.win('A perfect fit. Physics weeps.'); }
          else api.lose('Too roomy. Where is the dignity?');
        };
        const mark = () => { const s = api.q('#sel'); s.setAttribute('opacity', '1'); at(s, xs[sel], 120); };
        return {
          tap(x) { const i = x < 140 ? 0 : x < 260 ? 1 : 2; choose(i); },
          num(n) { if (n >= 1 && n <= 3) choose(n - 1); },
          left() { sel = Math.max(0, sel - 1); mark(); }, right() { sel = Math.min(2, sel + 1); mark(); },
          act() { choose(sel); }
        };
      }
    },
    {
      id: 'laser', say: 'CATCH THE DOT!', hint: 'Tap it, or Space when it is in the ring', dur: 5.5, simple: true,
      make(api) {
        api.set(`${A.room('#e9e3ff', '#b9a68a', 140)}<circle cx="200" cy="215" r="44" fill="none" stroke="${I}" stroke-width="3" stroke-dasharray="8 7" opacity=".45"/><g id="dot"><circle r="18" fill="#ff1f3d" opacity=".25"/><circle r="8" fill="#ff1f3d" stroke="#fff" stroke-width="2"/></g><g id="pw" opacity="0">${A.paw()}</g><text id="cnt" x="380" y="40" text-anchor="end" class="cx-num">0/2</text>`);
        const dot = api.q('#dot'), pw = api.q('#pw'), cnt = api.q('#cnt');
        let dx = 200, dy = 215, ph = R(0, 6), got = 0, pounce = 0, px = 0, py = 0;
        const catchIt = () => {
          got++; cnt.textContent = `${got}/2`; api.sound('pop'); ph += R(1.5, 3);
          if (got >= 2) api.win('Got it. It was never there.');
        };
        const swipe = (x, y) => { pounce = 0.25; px = x; py = y; };
        return {
          tap(x, y) { swipe(x, y); if (near(x, y, dx, dy, 48)) catchIt(); else api.sound('miss'); },
          act() { swipe(dx, dy); if (near(dx, dy, 200, 215, 46)) catchIt(); else api.sound('miss'); },
          tick(dt, t) {
            ph += dt * 0.9 * api.sf;
            dx = 200 + Math.sin(ph * 1.7) * 160; dy = 215 + Math.sin(ph * 2.3 + 1) * 60;
            at(dot, dx, dy);
            pounce = Math.max(0, pounce - dt);
            pw.setAttribute('opacity', pounce > 0 ? '1' : '0');
            at(pw, px, py + 14, 0.7);
          }
        };
      }
    },
    {
      id: 'wake', say: 'WAKE THE HUMAN!', hint: 'Tap fast, or mash Space', dur: 4.5, simple: true,
      make(api) {
        api.set(`${A.room('#2e3a6b', '#5a4a7a', 210)}<circle cx="340" cy="50" r="22" fill="#fff4c2"/><circle cx="350" cy="44" r="20" fill="#2e3a6b"/>
          <rect x="40" y="170" width="320" height="80" rx="16" fill="#8fb3ff" stroke="${I}" stroke-width="3"/><rect x="50" y="140" width="110" height="50" rx="20" fill="#fff" stroke="${I}" stroke-width="3"/>
          <g id="face" transform="translate(110 290) scale(.8)">${A.human('front', 'sleep')}</g>
          <rect x="140" y="180" width="220" height="60" rx="14" fill="#ffd6e0" stroke="${I}" stroke-width="3"/>
          <text id="zz" x="170" y="90" class="cx-num cx-numw">z z z</text>
          <rect x="30" y="20" width="200" height="16" rx="8" fill="rgba(255,255,255,.25)" stroke="#fff" stroke-width="2"/><rect id="meter" x="32" y="22" width="0" height="12" rx="6" fill="#ffcf3a"/>
          <g transform="translate(300 182) scale(.55)">${A.cat('ok')}</g>`);
        const meter = api.q('#meter'), zz = api.q('#zz');
        let m = 0, done = false;
        const need = api.simple ? 8 : 10;
        const poke = () => {
          if (done) return;
          m = Math.min(1, m + 1 / need); api.sound('meow');
          if (m >= 1) { done = true; api.q('#face').innerHTML = A.human('front', 'shock'); zz.textContent = 'It is 5am...'; api.win('Breakfast is served. At 5am.'); }
        };
        return {
          tap: poke, act: poke,
          tick(dt, t) { if (!done) m = Math.max(0, m - dt * 0.12); meter.setAttribute('width', String(196 * m)); if (!done) zz.setAttribute('transform', `translate(0 ${Math.sin(t * 3) * 4})`); }
        };
      }
    },
    {
      id: 'cucumber', say: 'STAY ALERT!', hint: 'Jump when you see it. Not before.', dur: 5, simple: true,
      make(api) {
        api.set(`${A.room('#e8fff0', '#d7c2a1')}<ellipse cx="250" cy="262" rx="40" ry="12" fill="#ff7aa2" stroke="${I}" stroke-width="3"/><path d="M220 258q30 -12 60 0" stroke="#a0522d" stroke-width="6" fill="none"/>
          <g id="cc" transform="translate(-80 262)"><rect x="-50" y="-12" width="100" height="24" rx="12" fill="#3fa34d" stroke="${I}" stroke-width="3"/><path d="M-30 -4h6M-6 3h6M20 -4h6" stroke="#c9f2c7" stroke-width="3" stroke-linecap="round"/></g>
          <g id="kitty" transform="translate(200 268) scale(.85)">${A.cat('happy')}</g><text id="bang" x="200" y="60" text-anchor="middle" class="cx-big" opacity="0">!!</text>`);
        const cc = api.q('#cc'), kitty = api.q('#kitty'), bang = api.q('#bang');
        const when = R(0.9, 2.6) / api.sf;
        const window_ = 0.95 / Math.sqrt(api.sf);
        let seen = false, jump = -1;
        const go = () => {
          if (jump >= 0) return;
          if (!seen) { api.lose('You jumped at nothing. Suspicious.'); return; }
          jump = 0; kitty.innerHTML = A.cat('shock'); bang.setAttribute('opacity', '1'); api.sound('hiss');
          api.win('Saved from the green menace.');
        };
        return {
          tap: go, act: go,
          tick(dt, t) {
            if (t > when && !seen) { seen = true; api.sound('swish'); }
            if (seen) { const k = Math.min(1, (t - when) / 0.25); at(cc, -80 + k * 210, 262); }
            if (seen && jump < 0 && t > when + window_ + 0.25) api.lose('Too slow. The cucumber has won.');
            if (jump >= 0) { jump += dt; at(kitty, 200, 268 - Math.sin(Math.min(1, jump * 2.4) * Math.PI) * 140, 0.85); }
          },
          timeout: () => (jump >= 0 ? 'win' : 'lose')
        };
      }
    },
    {
      id: 'groom', say: 'GROOM YOURSELF!', hint: 'Tap the mud, or press Space', dur: 5, simple: true,
      make(api) {
        const spots = [[130, 190], [200, 160], [270, 190], [175, 225], [245, 228]].map(([x, y]) => [x + R(-10, 10), y + R(-8, 8)]);
        const n = api.simple ? 4 : 5;
        api.set(`${A.room('#fff6e5', '#e0c8a8', 250)}
          <ellipse cx="200" cy="200" rx="120" ry="60" fill="${A.FUR}" stroke="${I}" stroke-width="3"/>
          <path d="M120 180q10 20 0 40M160 150q10 30 0 60M240 150q10 30 0 60M280 180q10 20 0 40" stroke="${A.FUR2}" stroke-width="6" fill="none" stroke-linecap="round"/>
          <g transform="translate(330 220) scale(.75)"><circle cx="0" cy="-60" r="30" fill="${A.FUR}" stroke="${I}" stroke-width="3"/><path d="M-26 -72l3-30 19 15zM26 -72l-3-30-19 15z" fill="${A.FUR}" stroke="${I}" stroke-width="3"/><path d="M-16 -62q5-6 10 0M6 -62q5-6 10 0" stroke="${I}" stroke-width="3" fill="none"/><ellipse cx="0" cy="-44" rx="7" ry="9" fill="#ff7aa2" stroke="${I}" stroke-width="2"/></g>
          ${spots.slice(0, n).map(([x, y], i) => `<g class="cx-spot" data-i="${i}" transform="translate(${x} ${y})"><path d="M-16 -4c-4-12 10-16 16-10 8-6 20 2 14 12 8 6-2 16-10 12-6 8-20 4-18-4-10 0-10-10-2-10z" fill="#6b4a2b" stroke="${I}" stroke-width="2"/></g>`).join('')}`);
        const live = new Set(Array.from({ length: n }, (_, i) => i));
        const clean = (i) => {
          if (!live.has(i)) return;
          live.delete(i);
          const el = api.q(`.cx-spot[data-i="${i}"]`);
          el.innerHTML = '<path d="M0 -14v28M-14 0h28M-9 -9l18 18M9 -9l-18 18" stroke="#fff" stroke-width="4" stroke-linecap="round"/>';
          setTimeout(() => el.remove(), 260);
          api.sound('lick');
          if (!live.size) api.win('Spotless. Smells of tongue.');
        };
        return {
          tap(x, y) { let b = -1, bd = 1e9; live.forEach((i) => { const d = Math.hypot(spots[i][0] - x, spots[i][1] - y); if (d < bd) { bd = d; b = i; } }); if (bd < 46) clean(b); else api.sound('miss'); },
          act() { const i = [...live][0]; if (i != null) clean(i); }
        };
      }
    },
    {
      id: 'knead', say: 'MAKE BISCUITS!', hint: 'Left, right, left, right', dur: 5, simple: true,
      make(api) {
        const need = api.simple ? 10 : 14;
        api.set(`${A.room('#ffeef5', '#b8d8ff', 160)}<path d="M20 300c10-90 50-130 180-130s170 40 180 130z" fill="#a0c4ff" stroke="${I}" stroke-width="3"/><g opacity=".3" stroke="#fff" stroke-width="6"><path d="M60 220h280M40 260h320"/></g>
          <g id="pl" transform="translate(150 230)">${A.paw()}</g><g id="pr" transform="translate(250 230)">${A.paw()}</g>
          <text x="80" y="300" class="cx-num" text-anchor="middle">L</text><text x="320" y="300" class="cx-num" text-anchor="middle">R</text>
          <g id="buns"></g>`);
        const pl = api.q('#pl'), pr = api.q('#pr'), buns = api.q('#buns');
        let last = '', count = 0, dl = 0, dr = 0;
        const press = (side) => {
          if (side === last) { api.sound('miss'); return; }
          last = side; count++;
          if (side === 'l') dl = 0.15; else dr = 0.15;
          api.sound('knead');
          buns.innerHTML = Array.from({ length: count }, (_, i) => `<ellipse cx="${30 + (i % 14) * 26}" cy="${30 + Math.floor(i / 14) * 22}" rx="11" ry="8" fill="#e9b872" stroke="${I}" stroke-width="2"/>`).join('');
          if (count >= need) api.win('Biscuits made. None are edible.');
        };
        return {
          left: () => press('l'), right: () => press('r'),
          tap(x) { press(x < 200 ? 'l' : 'r'); },
          num(n) { if (n === 1) press('l'); if (n === 2) press('r'); },
          tick(dt) { dl = Math.max(0, dl - dt); dr = Math.max(0, dr - dt); at(pl, 150, 230 + (dl > 0 ? 18 : 0)); at(pr, 250, 230 + (dr > 0 ? 18 : 0)); }
        };
      }
    },
    {
      id: 'treat', say: 'FIND THE TREAT!', hint: 'Watch the cups, then tap or press 1, 2, 3', dur: 6, simple: true,
      make(api) {
        const xs = [100, 200, 300];
        let pos = [0, 1, 2];
        const treat = Math.floor(Math.random() * 3);
        api.set(`${A.room('#fff1d6', '#c08552', 200)}
          <g id="fish" transform="translate(${xs[treat]} 250)"><path d="M-16 0c8-10 22-10 28 0-6 10-20 10-28 0zM12 0l10-8v16z" fill="#7fc8f8" stroke="${I}" stroke-width="2.5"/></g>
          ${[0, 1, 2].map((i) => `<g class="cup" data-c="${i}" transform="translate(${xs[i]} 262)"><path d="M-36 0l8-70h56l8 70z" fill="#e63946" stroke="${I}" stroke-width="3" stroke-linejoin="round"/><path d="M-30 -20h60" stroke="#fff" stroke-width="5" opacity=".7"/></g>`).join('')}
          ${[0, 1, 2].map((i) => `<text x="${xs[i]}" y="294" text-anchor="middle" class="cx-num">${i + 1}</text>`).join('')}`);
        const cups = [0, 1, 2].map((i) => api.q(`.cup[data-c="${i}"]`));
        const swaps = api.simple ? 3 : 4 + Math.floor(api.sf * 1.5);
        const swapT = 0.42 / api.sf;
        const plan = [];
        for (let i = 0; i < swaps; i++) { const a = Math.floor(Math.random() * 3); let b = Math.floor(Math.random() * 2); if (b >= a) b++; plan.push([a, b]); }
        const showT = 0.9;
        let done = false, ready = false, committed = 0;
        const pick = (slot) => {
          if (!ready || done) return; done = true;
          const c = pos.indexOf(slot);
          cups.forEach((el, i) => at(el, xs[pos[i]], i === c ? 200 : 262));
          if (c === treat) { api.q('#fish').setAttribute('transform', `translate(${xs[slot]} 250)`); api.sound('purr'); api.win('Treat located. Treat eaten.'); }
          else { api.q('#fish').setAttribute('transform', `translate(${xs[pos[treat]]} 250)`); at(cups[treat], xs[pos[treat]], 200); api.lose('Empty cup. Betrayal.'); }
        };
        return {
          tap(x) { pick(x < 150 ? 0 : x < 250 ? 1 : 2); },
          num(n) { if (n >= 1 && n <= 3) pick(n - 1); },
          tick(dt, t) {
            if (done) return;
            if (t < showT) { cups.forEach((el, i) => at(el, xs[pos[i]], i === treat ? 262 - 70 * Math.sin(Math.min(1, t / showT) * Math.PI) : 262)); return; }
            api.q('#fish').setAttribute('opacity', '0');
            const k = (t - showT) / swapT;
            const idx = Math.floor(k);
            while (committed < Math.min(idx, plan.length)) {
              const [a, b] = plan[committed];
              const ia = pos.indexOf(a), ib = pos.indexOf(b);
              pos[ia] = b; pos[ib] = a;
              committed++;
              api.sound('slide');
            }
            if (idx >= plan.length) { if (!ready) { ready = true; cups.forEach((el, i) => at(el, xs[pos[i]], 262)); api.sound('pop'); } return; }
            const f = k - idx;
            const [a, b] = plan[idx];
            const ca = pos.indexOf(a), cb = pos.indexOf(b);
            cups.forEach((el, i) => {
              if (i === ca) at(el, xs[a] + (xs[b] - xs[a]) * f, 262 - Math.sin(f * Math.PI) * 24);
              else if (i === cb) at(el, xs[b] + (xs[a] - xs[b]) * f, 262 + Math.sin(f * Math.PI) * 10);
              else at(el, xs[pos[i]], 262);
            });
          },
          timeout: () => 'lose'
        };
      }
    },
    {
      id: 'steal', say: 'STEAL THE CHICKEN!', hint: 'Only when they are not looking!', dur: 5, simple: true,
      make(api) {
        api.set(`${A.room('#fff7d6', '#c9a27e', 230)}<rect x="0" y="180" width="400" height="20" fill="#8d5a3b" stroke="${I}" stroke-width="3"/>
          <ellipse cx="190" cy="176" rx="50" ry="10" fill="#fff" stroke="${I}" stroke-width="3"/>
          <g id="chick" transform="translate(190 166)"><path d="M-26 0c0-16 14-22 28-18 14 4 18 16 12 22z" fill="#d9822b" stroke="${I}" stroke-width="3"/><path d="M12 2l18 -6M24 -10l8 6M28 -8l2 10" stroke="${I}" stroke-width="3" stroke-linecap="round"/></g>
          <g id="hum" transform="translate(320 200)"></g>
          <g id="pw" transform="translate(40 300) rotate(60)">${A.paw()}</g>
          <text id="eye" x="320" y="40" text-anchor="middle" class="cx-num"></text>`);
        const hum = api.q('#hum'), pw = api.q('#pw'), eye = api.q('#eye');
        let looking = true, next = R(0.6, 1.2) / api.sf, done = false, grab = -1;
        const paint = () => { hum.innerHTML = A.human(looking ? 'front' : 'back'); eye.textContent = looking ? 'watching...' : 'on the phone'; };
        paint();
        const go = () => {
          if (done) return; done = true;
          if (looking) { hum.innerHTML = A.human('front', 'shock'); eye.textContent = 'HEY!'; api.lose('Caught red-pawed.'); }
          else { grab = 0; api.sound('swish'); api.win('Dinner is yours. No regrets.'); }
        };
        return {
          tap: go, act: go,
          tick(dt, t) {
            if (!done) { next -= dt; if (next <= 0) { looking = !looking; next = (looking ? R(0.6, 1.3) : R(0.55, 0.9)) / api.sf; paint(); } }
            if (grab >= 0) { grab += dt; const k = Math.min(1, grab * 4); at(pw, 40 + 130 * k, 300 - 110 * k, 1, 60 - 40 * k); if (k >= 1) at(api.q('#chick'), 40 + 130 - grab * 300, 166 + grab * 120); }
          }
        };
      }
    },
    {
      id: 'sunbeam', say: 'STAY IN THE SUNBEAM!', hint: 'Arrow keys, or tap where to go', dur: 5, simple: false,
      make(api) {
        api.set(`${A.room('#f7ede2', '#b08968', 200)}<rect x="140" y="20" width="120" height="120" rx="6" fill="#bde0fe" stroke="${I}" stroke-width="4"/><path d="M200 20v120M140 80h120" stroke="${I}" stroke-width="4"/>
          <path id="beam" d="M-50 300l30-100h100l30 100z" fill="#ffd166" opacity=".55"/>
          <g id="kc" transform="translate(200 290) scale(.6)">${A.cat('ok')}</g><text id="warm" x="20" y="40" class="cx-num"></text>`);
        const beam = api.q('#beam'), kc = api.q('#kc'), warm = api.q('#warm');
        let cx = 200, tx = 200, hold = 0, bx = 200;
        const ph = R(0, 6);
        return {
          tap(x) { tx = clamp(x, 40, 360); },
          left() { tx = clamp(cx - 60, 40, 360); }, right() { tx = clamp(cx + 60, 40, 360); },
          tick(dt, t) {
            bx = 200 + Math.sin(t * 1.1 * api.sf + ph) * 140;
            beam.setAttribute('transform', `translate(${bx - 30} 0)`);
            const sp = 200 * dt; cx += clamp(tx - cx, -sp, sp);
            const inBeam = Math.abs(cx - bx) < 52;
            at(kc, cx, 290, 0.6);
            warm.textContent = inBeam ? 'warm ☀' : 'cold...';
            hold = inBeam ? hold + dt : 0;
            this.ok = inBeam;
          },
          timeout() { return this.ok ? 'win' : 'lose'; }
        };
      },
      winText: 'Toasty. Like a croissant.', loseText: 'Cold floor. Unacceptable.'
    },
    {
      id: 'fish', say: 'SWIPE A FISH!', hint: 'Tap or Space when the fish is under the paw', dur: 5, simple: false,
      make(api) {
        api.set(`${A.room('#e0fbfc', '#c2a383', 250)}<path d="M80 120c0 90 40 140 120 140s120-50 120-140z" fill="#9ad1f5" fill-opacity=".7" stroke="${I}" stroke-width="3"/><ellipse cx="200" cy="120" rx="120" ry="18" fill="#cbeafc" stroke="${I}" stroke-width="3"/>
          <path d="M184 120v140M216 120v140" stroke="#ff4f8b" stroke-width="3" stroke-dasharray="6 6" opacity=".6"/>
          <g id="fsh"><path d="M-24 0c12-16 34-16 42 0-8 16-30 16-42 0zM16 0l16-12v24z" fill="#ff9f1c" stroke="${I}" stroke-width="2.5"/><circle cx="-12" cy="-3" r="3" fill="${I}"/></g>
          <g id="pw" transform="translate(200 40) rotate(180)">${A.paw()}</g><text id="tries" x="380" y="40" text-anchor="end" class="cx-num">●●</text>`);
        const f = api.q('#fsh'), pw = api.q('#pw'), triesEl = api.q('#tries');
        let fx = 200, dip = -1, tries = 2, caught = false;
        const ph = R(0, 6);
        const swipe = () => {
          if (dip >= 0 || caught) return;
          dip = 0;
          if (Math.abs(fx - 200) < 30) { caught = true; api.sound('splash'); api.win('Sushi. Fresh.'); }
          else { tries--; triesEl.textContent = '●'.repeat(tries); api.sound('splash'); if (tries <= 0) api.lose('Wet paw. No fish.'); }
        };
        return {
          tap: swipe, act: swipe,
          tick(dt, t) {
            if (!caught) { fx = 200 + Math.sin(t * 2.3 * api.sf + ph) * 100; at(f, fx, 200, 1, 0); f.setAttribute('transform', `translate(${fx} 200) scale(${Math.cos(t * 2.3 * api.sf + ph) > 0 ? -1 : 1} 1)`); }
            if (dip >= 0) { dip += dt; const k = Math.sin(Math.min(1, dip * 3.5) * Math.PI); at(pw, 200, 40 + k * 150, 1, 180); if (dip > 0.3) dip = caught ? dip : -1; if (caught) at(f, 200, 200 - k * 160); }
          }
        };
      }
    },
    {
      id: 'hide', say: 'HIDE FROM THE VET!', hint: 'Hide where the torch is not. 1 to 4 or tap.', dur: 5.5, simple: false,
      make(api) {
        const xs = [55, 150, 250, 345];
        const names = ['bed', 'closet', 'curtain', 'box'];
        api.set(`${A.room('#2b2d42', '#3d405b', 230)}
          <rect x="15" y="200" width="80" height="34" rx="6" fill="#8d99ae" stroke="${I}" stroke-width="3"/><rect x="110" y="110" width="80" height="124" rx="4" fill="#6d4c41" stroke="${I}" stroke-width="3"/><path d="M150 110v124" stroke="${I}" stroke-width="3"/>
          <path d="M210 40h80v194c-20-10-60-10-80 0z" fill="#e5989b" stroke="${I}" stroke-width="3"/><rect x="310" y="190" width="70" height="44" fill="#c8915a" stroke="${I}" stroke-width="3"/>
          ${xs.map((x, i) => `<text x="${x}" y="270" text-anchor="middle" class="cx-num cx-numw">${i + 1}</text>`).join('')}
          <path id="torch" d="M200 -10l-40 250h80z" fill="#fff3b0" opacity=".38"/>
          <g id="hk" transform="translate(200 290) scale(.45)">${A.cat('shock')}</g>`);
        const torch = api.q('#torch'), hk = api.q('#hk');
        let spot = -1, ti = 0, tt = 0;
        const seq = [0, 1, 2, 3, 2, 1];
        let si = Math.floor(Math.random() * seq.length);
        const step = 0.62 / api.sf;
        const hideAt = (i) => { spot = i; at(hk, xs[i], i === 1 ? 200 : 236, 0.3); hk.setAttribute('opacity', '.55'); api.sound('swish'); };
        return {
          tap(x) { hideAt(x < 102 ? 0 : x < 200 ? 1 : x < 298 ? 2 : 3); },
          num(n) { if (n >= 1 && n <= 4) hideAt(n - 1); },
          tick(dt) {
            tt += dt; if (tt > step) { tt = 0; si = (si + 1) % seq.length; }
            ti = seq[si];
            torch.setAttribute('transform', `translate(${xs[ti] - 200} 0)`);
          },
          timeout() { this.last = ti; return spot >= 0 && spot !== ti ? 'win' : 'lose'; }
        };
      },
      winText: 'Vet left. Without you.', loseText: 'Found. Into the carrier you go.'
    },
    {
      id: 'zoomies', say: '3AM ZOOMIES!', hint: 'Space or tap to jump', dur: 5, simple: false,
      make(api) {
        api.set(`${A.room('#1f2041', '#4b3f72', 240)}<g opacity=".4" fill="#fff"><circle cx="40" cy="40" r="2"/><circle cx="140" cy="70" r="1.5"/><circle cx="300" cy="30" r="2"/></g><g id="stuff"></g><g id="zk" transform="translate(80 270) scale(.5)">${A.cat('shock')}</g>`);
        const stuff = api.q('#stuff'), zk = api.q('#zk');
        const sp = 230 * api.sf;
        const obs = [1.0, 2.15, 3.25, 4.2].map((tt) => ({ at: tt / Math.sqrt(api.sf), x: 440, kind: Math.floor(Math.random() * 3) }));
        let jy = 0, jt = -1;
        const draw = ['<path d="M-14 0c-4-20 0-34 14-38 14 4 18 18 14 38z" fill="#7b9acc" stroke="#fff" stroke-width="3"/>', '<path d="M-22 0v-14c0-6 10-10 20-10s24 4 24 12v12z" fill="#e76f51" stroke="#fff" stroke-width="3"/>', '<rect x="-16" y="-30" width="32" height="30" rx="4" fill="#ffd166" stroke="#fff" stroke-width="3"/>'];
        const jump = () => { if (jt < 0) { jt = 0; api.sound('swish'); } };
        return {
          tap: jump, act: jump, up: jump,
          tick(dt, t) {
            if (jt >= 0) { jt += dt; jy = Math.sin(Math.min(1, jt / 0.62) * Math.PI) * 95; if (jt >= 0.62) { jt = -1; jy = 0; } }
            at(zk, 80, 270 - jy, 0.5, Math.sin(t * 20) * 4);
            stuff.innerHTML = obs.filter((o) => t >= o.at).map((o) => { o.x = 440 - (t - o.at) * sp; return `<g transform="translate(${o.x} 268)">${draw[o.kind]}</g>`; }).join('');
            for (const o of obs) if (t >= o.at && Math.abs(o.x - 80) < 26 && jy < 34) { api.lose('Crashed into the hallway decor.'); return; }
          },
          timeout: () => 'win'
        };
      },
      winText: 'Zoomed. Nobody slept.'
    },
    {
      id: 'vacuum', boss: true, say: 'BOSS: THE VACUUM!', hint: 'Arrows or tap to run. Survive!', dur: 6, simple: false,
      make(api) {
        api.set(`${A.room('#d8e2dc', '#a3b18a', 110)}
          <g id="vac"><rect x="-34" y="-30" width="68" height="40" rx="14" fill="#6c757d" stroke="${I}" stroke-width="3"/><rect x="-26" y="-22" width="52" height="14" rx="6" fill="#ff4f8b"/><circle cx="-20" cy="12" r="7" fill="${I}"/><circle cx="20" cy="12" r="7" fill="${I}"/><path d="M0 -30v-40" stroke="${I}" stroke-width="5"/></g>
          <g id="vk">${A.cat('shock')}</g>`);
        const vac = api.q('#vac'), vk = api.q('#vk');
        let cx = 320, cy = 250, tx = cx, ty = cy, vx = 70, vy = 200, hd = 0;
        const kb = { l: 0, r: 0, u: 0, d: 0 };
        return {
          tap(x, y) { tx = clamp(x, 30, 370); ty = clamp(y, 150, 285); },
          left() { tx = clamp(cx - 70, 30, 370); ty = cy; }, right() { tx = clamp(cx + 70, 30, 370); ty = cy; },
          up() { ty = clamp(cy - 50, 150, 285); tx = cx; }, down() { ty = clamp(cy + 50, 160, 285); tx = cx; },
          tick(dt, t) {
            const sp = 195 * dt;
            const dx = tx - cx, dy = ty - cy, d = Math.hypot(dx, dy);
            if (d > 1) { cx += dx / d * Math.min(sp, d); cy += dy / d * Math.min(sp, d); }
            const vs = (80 + t * 10) * Math.sqrt(api.sf) * dt;
            const ex = cx - vx, ey = cy - vy, ed = Math.hypot(ex, ey) || 1;
            let want = Math.atan2(ey, ex) - hd;
            while (want > Math.PI) want -= Math.PI * 2;
            while (want < -Math.PI) want += Math.PI * 2;
            hd += clamp(want, -1.5 * dt, 1.5 * dt);
            vx = clamp(vx + Math.cos(hd) * vs, 30, 370); vy = clamp(vy + Math.sin(hd) * vs, 150, 290);
            at(vac, vx, vy, 1, Math.sin(t * 30) * 3);
            at(vk, cx, cy + 20, 0.42);
            if (Math.floor(t * 6) !== Math.floor((t - dt) * 6)) api.sound('vroom');
            if (ed < 36) api.lose('Sucked up. Mostly fur now.');
          },
          timeout: () => 'win'
        };
      },
      winText: 'The vacuum retreats. For now.'
    }
  ];
  return list;
})();
