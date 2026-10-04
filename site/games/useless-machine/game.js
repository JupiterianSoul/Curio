(() => {
  const $ = (s) => document.querySelector(s);
  const ADV = Curio.advanced;
  const box = $('#box'), lid = $('#lid'), lever = $('#lever'), hand = $('#hand'), eyes = $('#eyes');
  const pole = $('#pole'), stripe = $('#poleStripe'), fore = $('#fore'), elbow = $('#elbow'), cover = $('#cover');
  const sw = $('#sw'), lidBtn = $('#lidBtn'), bubble = $('#bubble'), stage = $('#stage'), room = $('#room'), dark = $('#dark'), shadow = $('#shadow');
  const ring = $('#ring'), ledOn = $('#ledOn'), lockG = $('#lock'), backG = $('#back'), decoysG = $('#decoys'), realSwitch = $('#switch');
  const fly = $('#fly'), jar = $('#jar'), cookie = $('#cookie'), zzz = $('#zzz');
  const HOLE_X = 152, PIVOT = [265, 134], TIP_ON = [249, 100], TIP_OFF = [283, 100];
  const HOME = { ey: 152, hx: 152, hy: 176 };
  const T = { lid: 0, ey: HOME.ey, hx: HOME.hx, hy: HOME.hy, lever: 28, eyes: 40, look: 0, bx: 0, by: 0, br: 0, sq: 1, sx: 1, cover: 80, coverOp: 0, rot: null, brows: 0 };
  const RC = 2 * Math.PI * 38;
  let on = false, locked = false, epoch = 0, armOut = false, hold = 0, won = false, trickStart = 0, idle = 0, freeMode = false, busy = false;

  function render() {
    lid.setAttribute('transform', `rotate(${-T.lid} 112 134)`);
    lever.setAttribute('transform', `rotate(${T.lever} ${PIVOT[0]} ${PIVOT[1]})`);
    pole.setAttribute('y2', T.ey); stripe.setAttribute('y2', T.ey);
    fore.setAttribute('x1', HOLE_X); fore.setAttribute('y1', T.ey); fore.setAttribute('x2', T.hx); fore.setAttribute('y2', T.hy);
    elbow.setAttribute('cy', T.ey);
    const ang = T.rot != null ? T.rot : Math.atan2(T.hy - T.ey, T.hx - HOLE_X) * 180 / Math.PI;
    hand.setAttribute('transform', `translate(${T.hx} ${T.hy}) rotate(${ang})`);
    eyes.setAttribute('transform', `translate(0 ${T.eyes})`);
    $('#pupL').setAttribute('cx', 140 + T.look); $('#pupR').setAttribute('cx', 166 + T.look);
    $('#browL').setAttribute('opacity', T.brows); $('#browR').setAttribute('opacity', T.brows);
    box.setAttribute('transform', `translate(${T.bx} ${T.by}) rotate(${T.br} 200 300) translate(200 306) scale(${(2 - T.sq) * T.sx} ${T.sq}) translate(-200 -306)`);
    shadow.setAttribute('rx', 150 - Math.min(60, -T.by * .8)); shadow.setAttribute('cx', 200 + T.bx);
    cover.setAttribute('transform', `translate(${T.cover} 0)`); cover.setAttribute('opacity', T.coverOp);
    place(sw, 265 + T.bx, 118 + T.by, 76, 86);
    place(lidBtn, 152 + T.bx, 100 + T.by, 130, 130);
  }
  function place(el, cx, cy, w, h) { el.style.left = `${(cx - w / 2) / 4}%`; el.style.top = `${(cy - h / 2) / 3.3}%`; el.style.width = `${w / 4}%`; el.style.height = `${h / 3.3}%`; }
  const ease = { inOut: (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2, out: (t) => 1 - Math.pow(1 - t, 3), in: (t) => t * t * t, back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }, lin: (t) => t };
  function tween(props, dur, e = ease.inOut) {
    const from = {}; for (const k in props) from[k] = T[k];
    const ep = epoch;
    if (dur <= 0) { Object.assign(T, props); render(); return Promise.resolve(); }
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = (now) => {
        if (ep !== epoch) { res(); return; }
        const p = Math.min(1, (now - t0) / (dur * 1000)), k2 = e(p);
        for (const k in props) T[k] = props[k] == null ? null : from[k] + (props[k] - from[k]) * k2;
        render();
        if (p < 1) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });
  }
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
  const all = (...ps) => Promise.all(ps);
  function motor(dur, pitch = 1) {
    if (Curio.muted) return;
    const ac = Curio.audioContext && Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(70 * pitch, t); o.frequency.linearRampToValueAtTime(130 * pitch, t + dur * .5); o.frequency.linearRampToValueAtTime(80 * pitch, t + dur);
    f.type = 'lowpass'; f.frequency.value = 500;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .04); g.gain.setValueAtTime(.05, t + Math.max(.05, dur - .05)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(f).connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .02);
  }
  const click = () => { Curio.beep(1900, .015, 'square', .12); setTimeout(() => Curio.beep(900, .02, 'square', .08), 18); };
  const thud = () => { Curio.beep(110, .12, 'sine', .25); Curio.beep(70, .16, 'triangle', .15); };
  const ding = (f = 880) => Curio.beep(f, .15, 'triangle', .1);
  let bubbleT = 0;
  function say(text, secs = 1.8) { bubble.textContent = text; bubble.classList.add('on'); clearTimeout(bubbleT); bubbleT = setTimeout(() => bubble.classList.remove('on'), secs * 1000); }
  function shake() { stage.classList.remove('um-shake'); void stage.offsetWidth; stage.classList.add('um-shake'); }
  function pose(name) { $('#posePoint').setAttribute('opacity', name === 'thumb' ? 0 : 1); $('#poseThumb').setAttribute('opacity', name === 'thumb' ? 1 : 0); $('#poseFlag').setAttribute('opacity', name === 'flag' ? 1 : 0); }
  function setLed() { ledOn.setAttribute('opacity', on ? 1 : 0); sw.setAttribute('aria-pressed', String(on)); sw.setAttribute('aria-label', on ? 'The switch is on' : 'Flip the switch on'); }
  function setOff() { on = false; setLed(); }
  async function open(d = .35) { motor(d, .8); await tween({ lid: 80 }, d, ease.out); thud(); }
  async function close(d = .3) { motor(d, .8); await tween({ lid: 0 }, d, ease.in); thud(); }
  async function rise(d = .4, ey = 78) { motor(d); await tween({ ey, hx: 200, hy: 70, rot: null }, d, ease.out); }
  async function reach(d = .3) { motor(d); await tween({ hx: TIP_ON[0] - 6, hy: TIP_ON[1] }, d); }
  async function push(d = .18) { motor(d, 1.3); const ep = epoch; await tween({ hx: TIP_OFF[0] - 4, hy: TIP_OFF[1] + 2, lever: 28 }, d, ease.in); if (ep !== epoch) return; click(); setOff(); }
  async function retract(d = .4) { motor(d); await tween({ hx: HOME.hx, hy: HOME.hy, ey: HOME.ey, rot: null }, d, ease.inOut); }
  async function basic(s = 1) { await open(.35 * s); await rise(.4 * s); await reach(.3 * s); await push(.18 * s); await wait(.15 * s); await retract(.4 * s); await close(.3 * s); }

  async function attack(s = 1, bonkable = true) {
    const my = ++epoch;
    busy = true; armOut = bonkable; lidBtn.hidden = !bonkable;
    const ok = () => my === epoch;
    await open(.35 * s); if (!ok()) return false;
    await rise(.4 * s); if (!ok()) return false;
    await reach(.3 * s); if (!ok()) return false;
    armOut = false; lidBtn.hidden = true;
    await push(.18 * s); if (!ok()) return false;
    await wait(.12 * s); if (!ok()) return false;
    await retract(.35 * s); if (!ok()) return false;
    await close(.25 * s);
    busy = false;
    if (ok() && trick.afterOff) trick.afterOff();
    return true;
  }
  async function bonk() {
    if (!armOut || freeMode) return;
    armOut = false; lidBtn.hidden = true; epoch++;
    Curio.beep(300, .08, 'square', .1); thud(); shake();
    navigator.vibrate && navigator.vibrate(25);
    await tween({ lid: 0, ey: HOME.ey, hx: HOME.hx, hy: HOME.hy, rot: null }, .12, ease.in);
    busy = false; T.brows = 1; render(); setTimeout(() => { T.brows = 0; render(); }, 900);
    trick.onBonk && trick.onBonk();
  }
  function resetBox() {
    epoch++; armOut = false; busy = false; lidBtn.hidden = true;
    Object.assign(T, { lid: 0, ey: HOME.ey, hx: HOME.hx, hy: HOME.hy, lever: 28, eyes: 40, look: 0, bx: 0, by: 0, br: 0, sq: 1, sx: 1, cover: 80, coverOp: 0, rot: null, brows: 0 });
    on = false; locked = false; setLed(); pose('point'); render();
    lockG.setAttribute('opacity', 0); backG.setAttribute('opacity', 0); decoysG.innerHTML = ''; realSwitch.setAttribute('opacity', 1);
    $('#led').setAttribute('opacity', 1); $('#eyes').setAttribute('opacity', 1);
    fly.setAttribute('opacity', 0); jar.setAttribute('opacity', 0); cookie.setAttribute('opacity', 0); zzz.setAttribute('opacity', 0);
    document.querySelectorAll('.um-hit--d').forEach((b) => { b.hidden = true; });
    $('#tools').innerHTML = ''; dark.classList.remove('on');
    sw.hidden = false;
  }
  async function playerFlip() {
    if (won || (freeMode && busy)) return;
    idle = 0;
    if (!freeMode && trick.onSwitch && trick.onSwitch() === false) return;
    if (locked) { say(Curio.pick(['Locked. Ha.', 'Nope.', 'Not today.']), 1.2); Curio.beep(160, .1, 'square', .05); shake(); return; }
    if (on) { say(Curio.pick(['It is already on. Wait for it.', 'Patience.', 'Yes yes, it is on.']), 1.2); return; }
    on = true; setLed(); click();
    await tween({ lever: -28 }, .08, ease.out);
    if (freeMode) { freeFlip(); return; }
    trick.onFlip && trick.onFlip();
  }

  const btn = (label, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'c-btn c-btn--ghost ' + (cls || ''); b.innerHTML = label; b.addEventListener('click', fn); return b; };
  let hintT = 0;
  function hint(t) { $('#hint').textContent = t || ''; }
  function hintLater(t, s) { clearTimeout(hintT); hintT = setTimeout(() => { if (!won) hint(t); }, s * 1000); }

  const TRICKS = {
    polite: {
      name: 'Polite', em: '🙂', intro: 'Go on. Flip me. I dare you.',
      setup() { this.sulk = false; },
      async onFlip() { await wait(.6); if (on && !won) attack(1.1); },
      onBonk() { say('Ow! Okay, okay. You win this one.', 2.4); this.sulk = true; },
      afterOff() { if (!this.sulk) hint('Psst: click the lid while it is open (or press B) to bonk it shut.'); }
    },
    persistent: {
      name: 'Persistent', em: '😤', intro: 'I bounce back. Every. Single. Time.',
      setup() { this.n = 0; hintLater('Bonk it every time it peeks out. It gives up eventually.', 9); },
      async onFlip() { await wait(.3); if (on && !won) attack(.75); },
      async onBonk() { this.n++; if (this.n >= 3) { say('Fine! FINE. I need a lie down.', 2.4); return; } say(Curio.pick(['Ow.', 'Again?!', 'Rude.', 'That one hurt.']), 1); await wait(.45); if (on && !won) attack(.75 - this.n * .08); },
      afterOff() { this.n = 0; }
    },
    fly: {
      name: 'Fly swatter', em: '🪰', intro: 'Glass cover. Unbreakable. Unbeatable. Mostly.',
      setup() { locked = true; T.cover = 0; T.coverOp = 1; render(); fly.setAttribute('opacity', 1); this.t = 0; this.phase = 'buzz'; this.next = 4; hintLater('That fly is driving the box mad. Wait for it to land.', 8); },
      tick(dt) {
        this.t += dt;
        if (this.phase === 'buzz') {
          const a = this.t * 2.1, x = 200 + Math.cos(a) * 170 + Math.sin(a * 2.7) * 30, y = 60 + Math.sin(a * 1.3) * 45;
          fly.setAttribute('transform', `translate(${x} ${y})`);
          this.next -= dt;
          if (this.next <= 0) { this.phase = 'land'; this.left = 5.5; this.swat(); }
        } else if (this.phase === 'land') {
          fly.setAttribute('transform', `translate(${300 + T.bx} ${108 + Math.sin(this.t * 30) * 1.5})`);
          this.left -= dt;
          if (this.left <= 0) { this.phase = 'buzz'; this.next = 4 + Math.random() * 2; this.unswat(); }
        }
      },
      async swat() {
        say('A FLY? On MY lid?', 1.6); locked = false;
        const my = ++epoch; busy = true;
        await tween({ cover: 80, coverOp: 0, eyes: 0, look: 6 }, .3, ease.out);
        await open(.2); await rise(.25, 70);
        while (my === epoch && this.phase === 'land' && !won) { await tween({ hx: 300, hy: 60 }, .18); Curio.beep(500, .04, 'square', .05); await tween({ hx: 240, hy: 50 }, .18); }
      },
      async unswat() {
        if (won) return;
        say('Gone. Good.', 1.2);
        epoch++;
        await tween({ hx: HOME.hx, hy: HOME.hy, ey: HOME.ey, eyes: 40, look: 0, rot: null }, .3);
        await tween({ lid: 0 }, .2); thud(); busy = false;
        if (on && !won) await attack(.6, false);
        if (won) return;
        locked = true; await tween({ cover: 0, coverOp: 1 }, .35, ease.back); thud();
      },
      onFlip() { if (this.phase === 'land') say('Hey! Not now, I am BUSY!', 1.6); }
    },
    runaway: {
      name: 'Runaway', em: '🏃', intro: 'Catch me if you can.',
      setup() { this.pos = 0; hintLater('Shoo it into a corner first: click the floor beside it, or use the arrow keys.', 6); $('#tools').append(btn('◀ Shoo left', () => this.shoo(-1)), btn('Shoo right ▶', () => this.shoo(1))); },
      async hop(dir) {
        const np = Math.max(-2, Math.min(2, this.pos + dir));
        if (np === this.pos) { say('Ow. Wall.', 1); shake(); return; }
        this.pos = np; thud();
        await tween({ bx: (this.pos * 65 + T.bx) / 2, by: -18 }, .12, ease.out);
        await tween({ bx: this.pos * 65, by: 0 }, .12, ease.in); thud();
      },
      shoo(dir) { if (won) return; idle = 0; this.hop(dir); say(Curio.pick(['Eek!', 'Shoo yourself!', 'Hmph.']), .9); },
      onRoom(side) { if (Math.abs(side) > 40) this.shoo(side > 0 ? -1 : 1); },
      onSwitch() {
        if (on || Math.abs(this.pos) === 2) return true;
        const dir = this.pos === 0 ? (Math.random() < .5 ? -1 : 1) : -Math.sign(this.pos);
        say(Curio.pick(['Nope!', 'Too slow!', 'Whoosh!']), .9); this.hop(dir); return false;
      },
      onFlip() { say('Hey! I am squished against the wall! I cannot open my lid!', 2.6); T.brows = 1; render(); }
    },
    echo: {
      name: 'Secret knock', em: '🥁', intro: 'Only friends get to leave me on. Friends know the knock.',
      setup() {
        this.friend = false; this.taps = []; this.playing = false;
        this.pat = Curio.pick([[0, .3, .6], [0, .3, .45, .75], [0, .45, .6, .9, 1.2], [0, .2, .4, .8]]);
        setTimeout(() => { if (!won && trick === this) this.knock(); }, 900);
        $('#tools').append(btn('Hear the knock again', () => this.knock()), btn('Knock on the lid (K)', () => this.tap(), 'um-knock'));
        hintLater('Tap the lid (or press K) as many times as it knocks, with the same rhythm.', 7);
      },
      async knock() {
        if (this.playing) return; this.playing = true;
        say('Listen...', 1);
        for (const t of this.pat) setTimeout(() => { Curio.beep(220, .07, 'triangle', .2); thud(); tween({ lid: 14 }, .05).then(() => tween({ lid: 0 }, .06)); }, 600 + t * 1000);
        await wait(.9 + this.pat[this.pat.length - 1] + .3); this.playing = false; this.taps = [];
      },
      tap() {
        if (won || this.friend) return; idle = 0;
        const now = performance.now() / 1000;
        if (this.taps.length && now - this.taps[this.taps.length - 1] > 1.3) this.taps = [];
        this.taps.push(now); Curio.beep(260, .06, 'triangle', .18); tween({ lid: 10 }, .04).then(() => tween({ lid: 0 }, .05));
        clearTimeout(this.chk); this.chk = setTimeout(() => this.check(), 900);
      },
      check() {
        const t0 = this.taps[0], got = this.taps.map((x) => x - t0), want = this.pat;
        this.taps = [];
        if (!got.length) return;
        if (got.length !== want.length) { say(got.length < want.length ? 'Too few knocks. Stranger danger.' : 'Too many knocks. Who ARE you?', 1.8); Curio.beep(150, .15, 'square', .05); return; }
        const err = Math.max(...got.map((g, i) => Math.abs(g / (got[got.length - 1] || 1) - want[i] / want[want.length - 1])));
        if (err > .28) { say('Right number, wrong rhythm. Again.', 1.8); Curio.beep(150, .15, 'square', .05); return; }
        this.friend = true; say('Oh! A friend! Go ahead, flip me.', 2.4); ding(784); ding(1046);
      },
      onBonkArea() { this.tap(); },
      async onFlip() { if (this.friend) { say('La la la, nothing to see here.', 2); return; } await wait(.4); if (on && !won) attack(.7, false); }
    },
    shell: {
      name: 'Shell game', em: '🎩', intro: 'Three switches. One is real. Keep your eyes on mine.',
      setup() {
        realSwitch.setAttribute('opacity', 0); sw.hidden = true; this.shuffling = false;
        this.real = Curio.randInt(0, 2); this.els = [];
        [222, 265, 308].forEach((x) => {
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g.innerHTML = '<ellipse cx="0" cy="6" rx="18" ry="7" fill="#555" stroke="#2c2c2c" stroke-width="2"/><rect x="-12" y="-4" width="24" height="11" rx="4" fill="#777" stroke="#2c2c2c" stroke-width="2"/><g class="lv" transform="rotate(28 0 0)"><rect x="-3" y="-30" width="6" height="30" rx="3" fill="url(#metal)" stroke="#444" stroke-width="1.2"/><circle cx="0" cy="-30" r="5.5" fill="#e53935" stroke="#7a1d1d" stroke-width="2"/></g>';
          decoysG.append(g); this.els.push({ g, x });
        });
        this.layout();
        document.querySelectorAll('.um-hit--d').forEach((b) => { b.hidden = false; });
        this.glanceT = 1.2; hintLater('The box cannot help glancing at the real one.', 8);
      },
      layout() { this.els.forEach((e) => e.g.setAttribute('transform', `translate(${e.x} 128)`)); document.querySelectorAll('.um-hit--d').forEach((b, i) => place(b, this.els[i].x + T.bx, 112, 40, 64)); },
      tick(dt) { if (this.shuffling || won || on) return; this.glanceT -= dt; if (this.glanceT <= 0) { this.glanceT = 2.5 + Math.random() * 2; const tx = this.els[this.real].x; tween({ look: (tx - 265) / 9, eyes: 18 }, .25).then(() => wait(.5)).then(() => { if (!on) tween({ look: 0, eyes: 40 }, .3); }); } },
      async shuffle() {
        this.shuffling = true;
        for (let k = 0; k < 4; k++) {
          const a = Curio.randInt(0, 2); let b = Curio.randInt(0, 1); if (b >= a) b++;
          const xa = this.els[a].x, xb = this.els[b].x, ta = performance.now();
          await new Promise((res) => { const step = (n) => { const p = Math.min(1, (n - ta) / 220); this.els[a].x = xa + (xb - xa) * p; this.els[b].x = xb + (xa - xb) * p; this.layout(); if (p < 1) requestAnimationFrame(step); else res(); }; requestAnimationFrame(step); });
          Curio.beep(400 + k * 80, .04, 'triangle', .06);
        }
        this.shuffling = false;
      },
      async pick(i) {
        if (won || this.shuffling || on) return; idle = 0;
        const e = this.els[i], lv = e.g.querySelector('.lv');
        lv.setAttribute('transform', 'rotate(-28 0 0)'); click();
        if (i === this.real) {
          on = true; setLed(); say('Wait. Which one did you...?', 2.4);
          for (let k = 0; k < 6; k++) await tween({ look: k % 2 ? 6 : -6, eyes: 10 }, .2);
          return;
        }
        Curio.beep(140, .2, 'sawtooth', .06); say(Curio.pick(['Wrong one! Ha!', 'Bzzzt. Fake.', 'So close. Not really.']), 1.4);
        await wait(.35); lv.setAttribute('transform', 'rotate(28 0 0)'); click();
        await this.shuffle();
      }
    },
    sleeper: {
      name: 'Light sleeper', em: '😴', intro: 'I never sleep. Never ever. *yawn*',
      setup() { this.state = 'awake'; hintLater('Even boxes get sleepy if nothing happens for a while.', 9); },
      tick() {
        if (won) return;
        if (this.state === 'awake' && idle > 4 && !busy) { this.state = 'drowsy'; tween({ eyes: 24 }, .8); say('So... quiet...', 1.4); }
        if (this.state === 'drowsy' && idle > 7.5) { this.state = 'asleep'; tween({ eyes: 32 }, .6); zzz.setAttribute('opacity', 1); clearInterval(this.snore); this.snore = setInterval(() => { if (Curio.sfx) Curio.sfx('snore'); }, 1600); }
        if (this.state === 'asleep') zzz.setAttribute('transform', `translate(${T.bx + Math.sin(performance.now() / 400) * 4} ${Math.sin(performance.now() / 700) * 3})`);
      },
      wake(msg) { clearInterval(this.snore); zzz.setAttribute('opacity', 0); this.state = 'awake'; tween({ eyes: 0, look: 0 }, .12); T.brows = 1; render(); say(msg || 'Huh? WHAT? I am awake!', 1.6); setTimeout(() => { T.brows = 0; tween({ eyes: 40 }, .3); }, 900); },
      onInput() { if (this.state !== 'awake' && !won) this.wake(); },
      onSwitch() { if (this.state === 'asleep') { on = true; setLed(); tween({ lever: -28 }, .3); Curio.beep(1200, .01, 'square', .03); return false; } if (this.state === 'drowsy') this.wake('Hm? Was that the switch?'); return true; },
      onFlip() { attack(.32, false); },
      cleanup() { clearInterval(this.snore); }
    },
    snack: {
      name: 'Snack time', em: '🍪', intro: 'I do not work for free. I want a cookie.',
      setup() { jar.setAttribute('opacity', 1); this.cx = 34; this.cy = 262; this.eating = false; cookie.setAttribute('opacity', 1); this.pos(); $('#tools').append(btn('Offer a cookie (C)', () => this.feed())); hintLater('Drag a cookie from the jar onto the lid.', 6); },
      pos() { cookie.setAttribute('transform', `translate(${this.cx} ${this.cy})`); },
      async feed() {
        if (this.eating || won) return; idle = 0;
        const sx = this.cx, sy = this.cy, t0 = performance.now(), tx = 152 + T.bx;
        await new Promise((res) => { const st = (n) => { const p = Math.min(1, (n - t0) / 500); this.cx = sx + (tx - sx) * p; this.cy = sy + (112 - sy) * p - Math.sin(p * Math.PI) * 60; this.pos(); if (p < 1) requestAnimationFrame(st); else res(); }; requestAnimationFrame(st); });
        this.eat();
      },
      async eat() {
        this.eating = true; cookie.setAttribute('opacity', 0);
        epoch++; busy = true;
        await tween({ lid: 60 }, .15); say('Ooh! nom nom nom', 2.2);
        const tEnd = performance.now() + 7000; let k = 0;
        while (!won && performance.now() < tEnd && trick === this) { k++; Curio.beep(180 + Math.random() * 80, .05, 'square', .05); tween({ lid: k % 2 ? 30 : 60, by: k % 2 ? -3 : 0 }, .2); await wait(.22); }
        await tween({ lid: 0, by: 0 }, .2); thud(); busy = false;
        this.eating = false; this.cx = 34; this.cy = 262; this.pos(); cookie.setAttribute('opacity', 1);
        if (!won) { say('More. Now. Or the switch goes off.', 1.8); if (on) attack(.6, false); }
      },
      onFlip() { if (this.eating) { say('mmf, busy eating', 1.4); return; } say('No snack, no deal.', 1.2); attack(.45, false); }
    },
    combo: {
      name: 'Combination', em: '🔐', intro: 'Padlock. Three digits. You will never guess.',
      setup() {
        this.code = String(Curio.randInt(100, 999)); $('#pin').textContent = this.code.split('').join(' ');
        lockG.setAttribute('opacity', 1); locked = true; this.entry = ''; this.spinning = false;
        const pad = document.createElement('div'); pad.className = 'um-pad';
        const disp = document.createElement('output'); disp.className = 'um-disp'; disp.textContent = '_ _ _'; this.disp = disp;
        pad.append(disp);
        for (let d = 1; d <= 9; d++) pad.append(btn(String(d), () => this.key(String(d)), 'um-key'));
        pad.append(btn('Clear', () => { this.entry = ''; this.paint(); }, 'um-key um-key--w'), btn('0', () => this.key('0'), 'um-key'));
        $('#tools').append(btn('Spin the box around', () => this.spin()), pad);
        hintLater('Boxes keep their secrets on the back.', 7);
      },
      paint() { this.disp.textContent = (this.entry + '___').slice(0, 3).split('').join(' '); },
      key(d) {
        if (won || !locked) return; idle = 0;
        this.entry += d; Curio.beep(600 + +d * 40, .04, 'square', .05); this.paint();
        if (this.entry.length === 3) {
          if (this.entry === this.code) { locked = false; lockG.setAttribute('opacity', 0); ding(988); ding(1318); say('Wait, how did you... that is on my BACK.', 2.6); T.brows = 1; render(); }
          else { say('Wrong! Ha!', 1.2); Curio.beep(150, .2, 'square', .06); shake(); setTimeout(() => { this.entry = ''; this.paint(); }, 400); }
        }
      },
      async spin() {
        if (this.spinning || won) return; this.spinning = true; idle = 0;
        say('Whee!', 1);
        await tween({ sx: 0 }, .2, ease.in); backG.setAttribute('opacity', 1); realSwitch.setAttribute('opacity', 0); lockG.setAttribute('opacity', 0); $('#led').setAttribute('opacity', 0); $('#eyes').setAttribute('opacity', 0);
        await tween({ sx: 1 }, .2, ease.out); await wait(1.8);
        await tween({ sx: 0 }, .2, ease.in); backG.setAttribute('opacity', 0); realSwitch.setAttribute('opacity', 1); if (locked) lockG.setAttribute('opacity', 1); $('#led').setAttribute('opacity', 1); $('#eyes').setAttribute('opacity', 1);
        await tween({ sx: 1 }, .2, ease.out); this.spinning = false;
      },
      onSwitch() { return !this.spinning; },
      onFlip() { say('...I am too stunned to move.', 2.2); }
    },
    lonely: {
      name: 'Lonely', em: '🥹', intro: 'Final trick. I have every defence. You cannot win. Ha. Ha ha.',
      setup() { this.seq = false; this.tries = 0; },
      onInput() { if (won) return; if (this.seq) { epoch++; this.seq = false; say('There you are! HA! Got you.', 1.6); tween({ eyes: 40, look: 0, lid: 0, ey: HOME.ey, hx: HOME.hx, hy: HOME.hy, rot: null }, .2); } },
      onSwitch() { this.onInput(); this.tries++; if (this.tries === 6) hint('Maybe it does not want to be beaten. Maybe it wants something else.'); if (this.tries === 10) hint('Try doing nothing at all for a while.'); return true; },
      onRoom() { say(Curio.pick(['Missed!', 'Ha!', 'Nope.']), .8); },
      onFlip() { attack(.28, false); },
      tick() { if (!won && !this.seq && !on && !busy && idle > 11) this.go(); },
      async go() {
        this.seq = true; const my = ++epoch;
        say('...hello?', 1.8); await tween({ lid: 20, eyes: 18 }, .6); if (my !== epoch) return;
        for (const l of [-6, 6, -3]) { await tween({ look: l }, .5); if (my !== epoch) return; }
        await wait(.6); if (my !== epoch) return;
        say('Are you still there?', 2); await wait(2.2); if (my !== epoch) return;
        say('I... I was only playing.', 2.2); await wait(2.2); if (my !== epoch) return;
        await open(.4); await rise(.5); if (my !== epoch) return;
        await tween({ hx: TIP_OFF[0] + 2, hy: TIP_OFF[1] }, .4); if (my !== epoch) return;
        await tween({ hx: TIP_ON[0] - 8, hy: TIP_ON[1] + 2, lever: -28 }, .35, ease.in); if (my !== epoch) return;
        click(); on = true; setLed();
        say('There. On. Stay a bit?', 3); this.seq = false;
        await retract(.5); await close(.4);
      }
    }
  };
  const ORDER = ADV ? ['polite', 'persistent', 'fly', 'runaway', 'echo', 'shell', 'sleeper', 'snack', 'combo', 'lonely'] : ['polite', 'persistent', 'echo', 'runaway', 'snack'];
  const KEY = `useless-machine:${Curio.mode}`;
  const prog = Object.assign({ beaten: {}, times: {}, at: 0 }, Curio.store.get(KEY, {}));
  if (typeof prog.beaten !== 'object' || !prog.beaten) prog.beaten = {};
  if (typeof prog.times !== 'object' || !prog.times) prog.times = {};
  const saveProg = () => Curio.store.set(KEY, prog);
  let ti = Math.min(prog.at | 0, ORDER.length - 1), trick = TRICKS[ORDER[ti]];

  function startTrick(i) {
    if (trick && trick.cleanup) trick.cleanup();
    freeMode = false; document.body.classList.remove('um-freeplay');
    ti = i; trick = TRICKS[ORDER[ti]]; prog.at = ti; saveProg();
    resetBox(); won = false; hold = 0; idle = 0;
    hint(''); clearTimeout(hintT);
    $('#trickNo').textContent = `Trick ${ti + 1} of ${ORDER.length}`;
    $('#trickName').textContent = `${trick.em} ${trick.name}`;
    $('#freeBtn').textContent = 'Free play';
    paintPips();
    trick.setup && trick.setup();
    trickStart = performance.now();
    const me = trick;
    setTimeout(() => { if (trick === me && !won) say(me.intro, 2.8); }, 350);
  }
  function paintPips() {
    const p = $('#pips'); p.innerHTML = '';
    ORDER.forEach((k, i) => { const d = document.createElement('i'); d.title = TRICKS[k].name; if (prog.beaten[k]) d.className = 'on'; if (i === ti && !freeMode) d.classList.add('cur'); p.append(d); });
  }
  const LINES = { polite: 'I want it noted that I was polite about it.', persistent: 'My arm is tired. Are you happy now?', fly: 'That fly was working for you. I KNEW it.', runaway: 'Corners are cheating.', echo: 'Fine. We are friends now. Do not tell anyone.', shell: 'I blinked. That is all. I blinked.', sleeper: 'I was resting my eyes.', snack: 'Worth it. Totally worth it.', combo: 'Who reads the back of a box?!', lonely: 'Thanks for staying.' };
  function win() {
    won = true; epoch++; armOut = false; lidBtn.hidden = true;
    if (trick.cleanup) trick.cleanup();
    const secs = (performance.now() - trickStart) / 1000, k = ORDER[ti];
    const first = !prog.beaten[k], prev = prog.times[k];
    prog.beaten[k] = true;
    if (!prev || secs < prev) prog.times[k] = +secs.toFixed(1);
    saveProg(); paintPips();
    Curio.sfx && Curio.sfx('success'); Curio.confetti();
    const last = ti === ORDER.length - 1;
    setTimeout(() => {
      $('#ovEm').textContent = trick.em;
      $('#ovT').textContent = last ? (ADV ? 'Every trick beaten!' : 'You beat the box!') : 'Trick beaten!';
      $('#ovB').textContent = `"${LINES[k]}" ${secs.toFixed(1)} s${prev && secs < prev ? ', a new best' : prev ? ` (best ${prev} s)` : ''}.${last ? (ADV ? ' The box has nothing left. Free play is always open.' : ' Switch to Advanced for five more devious tricks.') : ''}`;
      const b = $('#ovBtns'); b.innerHTML = '';
      const go = (l, f, ghost) => b.append(btn(l, () => { $('#over').hidden = true; f(); }, ghost ? '' : 'um-solid'));
      if (!last) go('Next trick', () => startTrick(ti + 1)); else go('Free play', () => startFree());
      go('Again', () => startTrick(ti), true);
      $('#ovG').innerHTML = '';
      $('#over').hidden = false; b.querySelector('button').focus();
    }, 900);
    if (first && last) Curio.toast('The box is officially out of tricks.');
  }

  let moods = null, moodBag = [], allTime = Curio.store.get('um:flips', 0);
  function startFree() {
    if (trick && trick.cleanup) trick.cleanup();
    resetBox(); freeMode = true; won = false; hold = 0; document.body.classList.add('um-freeplay');
    $('#trickNo').textContent = 'Free play';
    $('#trickName').textContent = 'Flip it, see how it feels';
    $('#freeBtn').textContent = 'Back to the tricks';
    hint(ADV ? 'Every flip gets a new mood. There are over thirty to meet.' : 'Every flip gets a new mood.');
    paintPips();
    if (!moods) moods = UM_MOODS({ T, tween, ease, wait, all, say, motor, click, thud, ding, open, close, rise, reach, push, retract, basic, setOff, shake, pose, dark, TIP_ON, TIP_OFF, HOME, lock: (v) => { locked = v; }, setOn: () => { on = true; setLed(); }, allTime: () => allTime });
  }
  async function freeFlip() {
    allTime++; Curio.store.set('um:flips', allTime);
    if (!moodBag.length) moodBag = Curio.shuffle(moods.filter((m, i) => !m.special && (ADV || i < 20)));
    const m = allTime % 50 === 0 ? moods.find((x) => x.special === 'milestone') : moodBag.pop();
    busy = true; epoch++;
    $('#trickName').textContent = `${m.em} ${m.name}`;
    try { await wait(.25); await m.run(); } catch {}
    if (on) { on = false; T.lever = 28; render(); }
    setLed(); busy = false; locked = false;
  }

  let dragC = null;
  sw.addEventListener('click', playerFlip);
  lidBtn.addEventListener('click', () => { idle = 0; if (trick.onBonkArea && !armOut) { trick.onBonkArea(); return; } bonk(); });
  document.querySelectorAll('.um-hit--d').forEach((b, i) => b.addEventListener('click', () => trick.pick && trick.pick(i)));
  room.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button') || freeMode || won) return;
    idle = 0;
    if (trick.onInput) trick.onInput();
    const r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 400;
    if (trick.onRoom) trick.onRoom(x - (200 + T.bx));
  });
  const vb = (p) => { const r = stage.getBoundingClientRect(); return [(p.clientX - r.left) / r.width * 400, (p.clientY - r.top) / r.height * 330]; };
  Curio.drag(cookie, {
    start: (p) => {
      dragC = null;
      if (trick !== TRICKS.snack || freeMode || trick.eating || won) return;
      const [x, y] = vb(p);
      dragC = { ox: trick.cx - x, oy: trick.cy - y }; idle = 0; Curio.beep(500, .04, 'triangle', .05);
    },
    move: (p) => { if (!dragC) return; const [x, y] = vb(p); trick.cx = x + dragC.ox; trick.cy = y + dragC.oy; trick.pos(); },
    end: () => {
      if (!dragC) return; dragC = null;
      if (trick.cx > 95 + T.bx && trick.cx < 215 + T.bx && trick.cy > 50 && trick.cy < 175) trick.eat();
      else { say('Into my lid, please. I am not an animal.', 1.6); trick.cx = 34; trick.cy = 262; trick.pos(); }
    }
  });
  $('#retry').addEventListener('click', () => { $('#over').hidden = true; if (freeMode) startFree(); else startTrick(ti); });
  $('#freeBtn').addEventListener('click', () => { if (freeMode) startTrick(ti); else startFree(); });
  $('#tricks').addEventListener('click', () => {
    $('#ovEm').textContent = '📋'; $('#ovT').textContent = 'The bag of tricks';
    $('#ovB').textContent = `${ORDER.filter((k) => prog.beaten[k]).length} of ${ORDER.length} beaten.`;
    const g = $('#ovG'); g.innerHTML = '';
    ORDER.forEach((k, i) => {
      const open2 = i === 0 || prog.beaten[ORDER[i - 1]] || prog.beaten[k];
      const b = btn(`<span>${open2 ? TRICKS[k].em : '🔒'}</span><b>${i + 1}. ${open2 ? TRICKS[k].name : '???'}</b><small>${prog.times[k] ? `${prog.times[k]} s` : open2 ? 'not beaten yet' : 'locked'}</small>`, () => { $('#over').hidden = true; startTrick(i); }, 'um-tile');
      b.disabled = !open2; g.append(b);
    });
    const bb = $('#ovBtns'); bb.innerHTML = ''; bb.append(btn('Close', () => { $('#over').hidden = true; }));
    $('#over').hidden = false;
  });
  $('#over').addEventListener('click', (e) => { if (e.target === $('#over') && !won) $('#over').hidden = true; });
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!$('#over').hidden) { if (e.key === 'Escape' && !won) $('#over').hidden = true; return; }
    if (e.target.closest && e.target.closest('input')) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { if (e.target.closest && e.target.closest('button')) return; e.preventDefault(); playerFlip(); return; }
    idle = 0;
    if (freeMode) return;
    if (trick.onInput) trick.onInput();
    if (k === 'b') { if (trick.onBonkArea && !armOut) trick.onBonkArea(); else bonk(); }
    else if (k === 'k' && trick.tap) trick.tap();
    else if (k === 'arrowleft' && trick.shoo) { e.preventDefault(); trick.shoo(-1); }
    else if (k === 'arrowright' && trick.shoo) { e.preventDefault(); trick.shoo(1); }
    else if (k === 'c' && trick.feed) trick.feed();
    else if (/^[0-9]$/.test(k) && trick.key) trick.key(k);
    else if (/^[1-3]$/.test(k) && trick.pick) trick.pick(+k - 1);
  });

  let last = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(.1, (now - (last || now)) / 1000); last = now;
    if (document.hidden) return;
    if (!freeMode && !won) {
      idle += dt;
      if (trick.tick) trick.tick(dt);
      if (on) { hold += dt; if (hold >= 3) win(); } else hold = 0;
    } else if (freeMode) hold = 0;
    ring.setAttribute('stroke-dasharray', `${Math.min(1, hold / 3) * RC} ${RC}`);
    ring.setAttribute('opacity', hold > 0 ? 1 : 0);
  }
  render();
  startTrick(ti);
  requestAnimationFrame(loop);
  window.UM = { startTrick, startFree, get trick() { return trick; }, get on() { return on; }, get idle() { return idle; }, get epoch() { return epoch; }, get dbg() { return [won, freeMode, hold.toFixed(2), document.hidden].join(','); }, flip: playerFlip, bonk, TRICKS };
})();
