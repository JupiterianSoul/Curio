(() => {
  const $ = (s) => document.querySelector(s);
  const box = $('#box'), lid = $('#lid'), lever = $('#lever'), hand = $('#hand'), eyes = $('#eyes');
  const pole = $('#pole'), stripe = $('#poleStripe'), fore = $('#fore'), elbow = $('#elbow'), cover = $('#cover');
  const sw = $('#sw'), bubble = $('#bubble'), stage = $('#stage'), dark = $('#dark'), shadow = $('#shadow');
  const HOLE_X = 152, PIVOT = [265, 134];
  const HOME = { ey: 152, hx: 152, hy: 176 };
  const T = { lid: 0, ey: HOME.ey, hx: HOME.hx, hy: HOME.hy, lever: 28, eyes: 40, look: 0, bx: 0, by: 0, br: 0, sq: 1, cover: 80, coverOp: 0, rot: null, brows: 0 };
  let on = false, busy = false, locked = false, flips = 0;
  const met = new Set(Curio.store.get('um:met', []));
  let allTime = Curio.store.get('um:flips', 0);

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
    box.setAttribute('transform', `translate(${T.bx} ${T.by}) rotate(${T.br} 200 300) translate(200 306) scale(${2 - T.sq} ${T.sq}) translate(-200 -306)`);
    shadow.setAttribute('rx', 150 - Math.min(60, -T.by * .8));
    cover.setAttribute('transform', `translate(${T.cover} 0)`); cover.setAttribute('opacity', T.coverOp);
  }
  const ease = {
    inOut: (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    out: (t) => 1 - Math.pow(1 - t, 3),
    in: (t) => t * t * t,
    back: (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    lin: (t) => t
  };
  function tween(props, dur, e = ease.inOut) {
    const from = {}; for (const k in props) from[k] = T[k];
    if (dur <= 0) { Object.assign(T, props); render(); return Promise.resolve(); }
    return new Promise((res) => {
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / (dur * 1000));
        const k2 = e(p);
        for (const k in props) T[k] = from[k] + (props[k] - from[k]) * k2;
        render();
        if (p < 1) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });
  }
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));
  const all = (...ps) => Promise.all(ps);

  let motorNode = null;
  function motor(dur, pitch = 1) {
    if (Curio.muted) return;
    const ac = Curio.audioContext && Curio.audioContext(); if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(70 * pitch, t); o.frequency.linearRampToValueAtTime(130 * pitch, t + dur * .5); o.frequency.linearRampToValueAtTime(80 * pitch, t + dur);
    f.type = 'lowpass'; f.frequency.value = 500;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + .04); g.gain.setValueAtTime(0.05, t + Math.max(.05, dur - .05)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + .02);
  }
  const click = () => { Curio.beep(1900, .015, 'square', .12); setTimeout(() => Curio.beep(900, .02, 'square', .08), 18); };
  const thud = () => { Curio.beep(110, .12, 'sine', .25); Curio.beep(70, .16, 'triangle', .15); };
  const ding = (f = 880) => Curio.beep(f, .15, 'triangle', .1);

  let bubbleT = 0;
  function say(text, secs = 1.6) {
    bubble.textContent = text; bubble.classList.add('on');
    clearTimeout(bubbleT); bubbleT = setTimeout(() => bubble.classList.remove('on'), secs * 1000);
  }
  function setMood(em, name) { $('#mood').innerHTML = '<span>Mood:</span> '; $('#mood').append(`${em} ${name}`); }

  const TIP_ON = [249, 100], TIP_OFF = [283, 100];
  async function open(d = .35) { motor(d, .8); await tween({ lid: 80 }, d, ease.out); thud(); }
  async function close(d = .3) { motor(d, .8); await tween({ lid: 0 }, d, ease.in); thud(); }
  async function rise(d = .4, ey = 78) { motor(d); await tween({ ey, hx: 200, hy: 70, rot: null }, d, ease.out); }
  async function reach(d = .3) { motor(d); await tween({ hx: TIP_ON[0] - 6, hy: TIP_ON[1] }, d); }
  async function push(d = .18) {
    motor(d, 1.3);
    await tween({ hx: TIP_OFF[0] - 4, hy: TIP_OFF[1] + 2, lever: 28 }, d, ease.in);
    click(); setOff();
  }
  async function retract(d = .4) { motor(d); await tween({ hx: HOME.hx, hy: HOME.hy, ey: HOME.ey, rot: null }, d, ease.inOut); }
  async function basic(s = 1) { await open(.35 * s); await rise(.4 * s); await reach(.3 * s); await push(.18 * s); await wait(.15 * s); await retract(.4 * s); await close(.3 * s); }
  function setOff() { on = false; sw.setAttribute('aria-pressed', 'false'); sw.setAttribute('aria-label', 'Flip the switch on'); }
  function shake() { stage.classList.remove('um-shake'); void stage.offsetWidth; stage.classList.add('um-shake'); }
  function pose(name) { $('#posePoint').setAttribute('opacity', name === 'thumb' ? 0 : 1); $('#poseThumb').setAttribute('opacity', name === 'thumb' ? 1 : 0); $('#poseFlag').setAttribute('opacity', name === 'flag' ? 1 : 0); }

  const MOODS = [
    { em: '🙂', name: 'Polite', run: async () => { await basic(1); } },
    { em: '😴', name: 'Sleepy', run: async () => { say('...five more minutes...', 2.4); await wait(.8); await open(1.4); await rise(1.4); await wait(.5); await reach(1.2); await push(.6); await wait(.4); await retract(1.6); await close(1.2); say('zzz', 1); } },
    { em: '⚡', name: 'Speedy', run: async () => { await basic(.25); say('Too slow.', 1.2); } },
    { em: '👀', name: 'Nosy', run: async () => { await open(.3); await tween({ eyes: 0, look: 0 }, .4, ease.out); await wait(.3); await tween({ look: 5 }, .25); await wait(.5); await tween({ look: -3 }, .25); await wait(.4); await tween({ look: 5 }, .2); await tween({ eyes: 40 }, .25, ease.in); await rise(.3); await reach(.2); await push(.15); await retract(.3); await close(.25); } },
    { em: '🤥', name: 'Fake-out', run: async () => { await open(.3); await rise(.4, 100); await tween({ hx: 200, hy: 92 }, .3); await wait(.5); await retract(.4); await close(.3); await wait(1.2); await tween({ lid: 80 }, .08); thud(); await tween({ ey: 78, hx: TIP_ON[0] - 6, hy: TIP_ON[1] }, .15); await push(.1); say('Gotcha.', 1.2); await wait(.3); await retract(.25); await close(.2); } },
    { em: '🧐', name: 'Double-checking', run: async () => { await basic(.9); await wait(.6); await open(.25); await rise(.3); await reach(.25); for (let i = 0; i < 2; i++) { await tween({ hy: TIP_OFF[1] + 4, hx: TIP_OFF[0] - 10 }, .12); click(); await tween({ hy: TIP_OFF[1] - 10 }, .12); } say('Yep. Off.', 1.2); await retract(.35); await close(.25); } },
    { em: '😒', name: 'Annoyed', run: async () => { say('Ugh. Again?', 1.4); shake(); await wait(.6); await tween({ lid: 80 }, .12); thud(); await tween({ ey: 78, hx: TIP_ON[0] - 8, hy: TIP_ON[1] - 6 }, .2, ease.out); await push(.08); shake(); thud(); await wait(.2); await retract(.2); await tween({ lid: 0 }, .08, ease.in); thud(); shake(); } },
    { em: '✋', name: 'Clingy', run: async () => { await open(.3); await rise(.35); await reach(.25); await push(.15); locked = true; say('Mine.', 2.6); for (let i = 0; i < 6; i++) { await tween({ ey: 74 }, .2); await tween({ ey: 82 }, .2); } locked = false; await retract(.4); await close(.3); } },
    { em: '☝️', name: 'Disapproving', run: async () => { await open(.3); await rise(.35, 70); await tween({ hx: 175, hy: 30, rot: -90 }, .3); say('No. No no no.', 2); for (let i = 0; i < 4; i++) { await tween({ rot: -70 }, .15); await tween({ rot: -110 }, .15); } await tween({ rot: -90 }, .1); T.rot = null; await reach(.3); await push(.15); await retract(.4); await close(.3); } },
    { em: '🫥', name: 'Secretive', run: async () => { await basic(.8); locked = true; motor(.5, 1.5); await tween({ cover: 0, coverOp: 1 }, .5, ease.back); thud(); say('Switch? What switch?', 2.6); await wait(3.2); await tween({ cover: 80, coverOp: 0 }, .5, ease.in); locked = false; } },
    { em: '🥺', name: 'Pleading', run: async () => { await open(.6); await tween({ eyes: 0, look: 4 }, .6); say('Please. I am begging you.', 2.4); await wait(2.2); say('I have a family.', 1.8); await wait(1.4); await tween({ eyes: 40 }, .3); await rise(.6); await reach(.6); await push(.4); await retract(.7); await close(.6); say('thank you.', 1.2); } },
    { em: '🕺', name: 'Party', run: async () => {
      await open(.25); await rise(.3, 70);
      const notes = [523, 659, 784, 1046, 784, 659, 523, 659];
      for (let i = 0; i < 8; i++) { ding(notes[i]); await all(tween({ hx: i % 2 ? 230 : 170, hy: 50, by: -14, sq: 1.05 }, .14, ease.out)); await tween({ by: 0, sq: .94 }, .1, ease.in); }
      await tween({ sq: 1 }, .08); await reach(.15); await push(.1); ding(1318); say('Thank you, thank you.', 1.6); await retract(.3); await close(.25);
    } },
    { em: '🫣', name: 'Sneaky', run: async () => { await wait(2.6); await tween({ lid: 14 }, .6); await tween({ eyes: 22, look: 5 }, .5); await wait(.6); await tween({ eyes: 40 }, .2); await tween({ lid: 80 }, .5); await tween({ ey: 120, hx: 200, hy: 120 }, .6); await tween({ hx: TIP_ON[0] - 6, hy: TIP_ON[1], ey: 92 }, .6); await push(.1); await retract(.6); await close(.6); } },
    { em: '🌚', name: 'Shy', run: async () => { dark.classList.add('on'); await wait(.5); motor(.5); await tween({ lid: 80, ey: 78, hx: TIP_ON[0] - 6, hy: TIP_ON[1] }, .4); await push(.1); await wait(.2); await tween({ lid: 0, ey: HOME.ey, hx: HOME.hx, hy: HOME.hy }, .3); thud(); await wait(.4); dark.classList.remove('on'); say('I was never here.', 1.6); } },
    { em: '🤬', name: 'Furious', run: async () => {
      say('STOP. TOUCHING. ME.', 2.2);
      T.brows = 1;
      for (let i = 0; i < 4; i++) { thud(); await tween({ by: -24, br: i % 2 ? 5 : -5 }, .1, ease.out); await tween({ by: 0, br: 0 }, .1, ease.in); shake(); }
      await tween({ lid: 80 }, .08); await tween({ ey: 78, hx: TIP_ON[0] - 8, hy: TIP_ON[1] }, .1); await push(.06); thud(); shake();
      for (let i = 0; i < 3; i++) { await tween({ hy: TIP_OFF[1] - 12 }, .06); await tween({ hy: TIP_OFF[1] + 2 }, .06); click(); }
      await retract(.15); await tween({ lid: 0 }, .06); thud(); T.brows = 0; render();
    } },
    { em: '🏃', name: 'Runaway', run: async () => {
      say('Nope. I am leaving.', 1.6); await wait(.4);
      for (let i = 0; i < 3; i++) { thud(); await tween({ bx: (i + 1) * 60, by: -16 }, .14, ease.out); await tween({ by: 0 }, .1, ease.in); }
      await tween({ bx: 520 }, .3, ease.in);
      await tween({ lid: 80, ey: 78, hx: TIP_ON[0] - 6, hy: TIP_ON[1] }, 0); await push(0.01); await tween({ lid: 0, ey: HOME.ey, hx: HOME.hx, hy: HOME.hy }, 0);
      await wait(1); T.bx = -520; render();
      await tween({ bx: 0 }, .6, ease.out); thud(); say('Oh, it is off now. Weird.', 1.8);
    } },
    { em: '🏳️', name: 'Diplomatic', run: async () => { pose('flag'); await open(.3); await rise(.4, 70); say('Truce?', 1.6); for (let i = 0; i < 3; i++) { await tween({ hx: 230 }, .2); await tween({ hx: 180 }, .2); } say('No.', 1); pose('point'); await reach(.15); await push(.08); await retract(.35); await close(.3); } },
    { em: '👍', name: 'Smug', run: async () => { await basic(.6); await open(.2); await rise(.3, 72); pose('thumb'); await tween({ hx: 205, hy: 52, rot: 0 }, .25); say('Nailed it.', 1.4); await wait(1.1); pose('point'); T.rot = null; await retract(.35); await close(.25); } },
    { em: '😩', name: 'Exhausted', run: async () => { say('Fine. Whatever. Sure.', 2); await open(.9); await rise(1, 100); await tween({ hy: 110, hx: 200 }, .5); await wait(.6); await reach(.8); await push(.5); await tween({ ey: 120, hy: 130 }, .7); await retract(.5); await close(.9); } },
    { em: '🤖', name: 'Glitching', run: async () => { for (let i = 0; i < 6; i++) { await tween({ lid: Curio.rand(0, 80), bx: Curio.rand(-6, 6) }, .05); Curio.beep(Curio.rand(200, 1500), .04, 'square', .05); } await tween({ bx: 0 }, .05); say('ERR0R: T00 MANY FL1PS', 1.6); await open(.1); await rise(.15); await reach(.1); await push(.05); await retract(.15); await close(.1); } },
    { em: '🫶', name: 'Wholesome', run: async () => { await open(.4); await tween({ eyes: 0, look: -4 }, .4); say('You know what? I like you.', 2); await wait(1.8); say('Still turning it off though.', 1.8); await tween({ eyes: 40 }, .3); await rise(.4); await reach(.3); await push(.2); await retract(.4); await close(.3); } },
    { em: '🎭', name: 'Dramatic', run: async () => { say('This... is my final flip.', 2.4); await wait(1.2); await open(1.2); await rise(1.2); await reach(1.1); [784, 740, 698, 659].forEach((f, i) => setTimeout(() => ding(f), i * 260)); await push(.9); await wait(.5); say('Remember me.', 1.6); await retract(1.1); await close(1); } },
    { em: '🔢', name: 'Countdown', run: async () => { await open(.3); await rise(.35); for (const n of ['3', '2', '1']) { say(n + '...', .7); ding(660); await tween({ by: -6 }, .12, ease.out); await tween({ by: 0 }, .12, ease.in); await wait(.5); } await reach(.12); await push(.08); ding(1320); say('Liftoff. Well, switch-off.', 1.4); await retract(.3); await close(.25); } },
    { em: '🤔', name: 'Philosophical', run: async () => { await open(.5); await tween({ eyes: 0, look: 0 }, .5); say(Curio.pick(['If a switch flips and nobody sees, is it on?', 'What is on, really?', 'I flip, therefore I am.', 'We are all just switches, in the end.']), 2.6); await tween({ look: 4 }, 1.2); await wait(1.4); await tween({ eyes: 40, look: 0 }, .4); await rise(.5); await reach(.4); await push(.25); await retract(.5); await close(.4); } },
    { em: '🎵', name: 'Musical', run: async () => { await open(.25); await rise(.3, 70); const ode = [659, 659, 698, 784, 784, 698, 659, 587, 523, 523, 587, 659, 659, 587, 587]; for (let i = 0; i < ode.length; i++) { ding(ode[i]); await tween({ hx: 185 + (i % 2) * 30, hy: 54 + (i % 3) * 4 }, .17); } say('Beethoven, probably.', 1.4); await reach(.2); await push(.1); await retract(.3); await close(.25); } },
    { em: '😨', name: 'Scared', run: async () => { for (let i = 0; i < 8; i++) { await tween({ bx: i % 2 ? 3 : -3 }, .05); } await tween({ bx: 0 }, .05); await tween({ lid: 18 }, .4); await tween({ eyes: 22, look: -5 }, .3); say('Is it gone?', 1.4); await wait(.9); await tween({ look: 5 }, .3); await wait(.4); await tween({ eyes: 40 }, .1); await tween({ lid: 80 }, .08); await tween({ ey: 78, hx: TIP_ON[0] - 6, hy: TIP_ON[1] }, .12); await push(.06); await retract(.12); await tween({ lid: 0 }, .06); thud(); say('eek', .8); } },
    { em: '🦥', name: 'Lazy', run: async () => { await open(.8); await rise(.9, 120); say('Eh. Can it wait?', 1.6); await wait(1.6); await retract(.6); await close(.5); await wait(1.4); say('...fine.', 1); await open(.6); await rise(.7); await reach(.7); await push(.4); await retract(.7); await close(.6); } },
    { em: '🎩', name: 'Magician', run: async () => { say('Abracadabra!', 1.4); locked = true; motor(.5, 1.5); await tween({ cover: 0, coverOp: 1 }, .45, ease.back); thud(); await wait(.4); await tween({ lever: 28 }, .08); click(); setOff(); await wait(.6); await tween({ cover: 80, coverOp: 0 }, .4, ease.in); ding(988); ding(1318); say('Ta-da!', 1.4); locked = false; await open(.2); await rise(.3, 70); await tween({ hx: 230, hy: 40 }, .2); await wait(.6); await retract(.3); await close(.2); } },
    { em: '📟', name: 'Morse', run: async () => { await open(.2); const sos = [.1, .1, .1, .3, .3, .3, .1, .1, .1]; say('... --- ...', 3); for (const d of sos) { Curio.beep(880, d, 'sine', .1); await tween({ lid: 30 }, d * .5); await tween({ lid: 80 }, d * .5); await wait(.08); } await rise(.3); await reach(.2); await push(.12); await retract(.3); await close(.25); } },
    { em: '🥱', name: 'Bored', run: async () => { say('*yawn*', 1.2); await open(.7); await tween({ eyes: 0 }, .5); for (const l of [-5, 5, -5, 0]) await tween({ look: l }, .45); say('Is that it? A switch?', 1.6); await wait(1); await tween({ eyes: 40 }, .4); await rise(.6); await reach(.5); await push(.35); await retract(.6); await close(.5); } },
    { em: '😂', name: 'Ticklish', run: async () => { say('Hehe! That tickles!', 1.6); for (let i = 0; i < 10; i++) { Curio.beep(900 + Math.random() * 600, .05, 'triangle', .06); await tween({ br: i % 2 ? 3 : -3, by: -3 }, .06); } await tween({ br: 0, by: 0 }, .08); await basic(.6); say('heh', .8); } },
    { em: '🔁', name: 'Rebellious', run: async () => { await basic(.6); await wait(.5); say('Actually...', 1.2); await open(.2); await rise(.25); await tween({ hx: TIP_OFF[0] + 2, hy: TIP_OFF[1] }, .2); await tween({ hx: TIP_ON[0] - 10, hy: TIP_ON[1] + 2, lever: -28 }, .15, ease.in); click(); on = true; await wait(.5); say('No. Off.', 1.2); await push(.12); await retract(.3); await close(.25); } },
    { em: '🌀', name: 'Hypnotist', run: async () => { await open(.4); await tween({ eyes: 0 }, .4); say('You are getting very sleepy...', 2.6); for (let i = 0; i < 10; i++) await tween({ look: i % 2 ? 5 : -5 }, .15); await tween({ look: 0, eyes: 40 }, .3); say('You will stop flipping me.', 1.8); await rise(.4); await reach(.3); await push(.2); await retract(.4); await close(.3); } },
    { em: '🫡', name: 'Formal', run: async () => { say('Good evening. Allow me.', 1.8); await open(.6); await rise(.6, 74); await tween({ hx: 214, hy: 62 }, .4); await wait(.3); await tween({ hx: TIP_ON[0] - 6, hy: TIP_ON[1] }, .5); await push(.3); await wait(.3); say('Will that be all?', 1.6); await retract(.6); await close(.5); } },
    { em: '🥹', name: 'Lonely', special: 'lonely', run: async () => { await open(.3); await tween({ eyes: 0, look: 0 }, .3); say('Oh! You came back!', 1.8); for (let i = 0; i < 3; i++) { ding(880 + i * 110); await tween({ by: -10 }, .12, ease.out); await tween({ by: 0 }, .12, ease.in); } await wait(.6); say('...but rules are rules.', 1.6); await tween({ eyes: 40 }, .3); await rise(.4); await reach(.3); await push(.2); await retract(.4); await close(.3); } },
    { em: '🎉', name: 'Celebrating', special: 'milestone', run: async () => { say(`Flip number ${allTime}! A milestone!`, 2); Curio.confetti(90); await open(.25); await rise(.3, 70); for (let i = 0; i < 6; i++) { ding([523, 659, 784, 1046, 784, 1046][i]); await tween({ hx: i % 2 ? 230 : 170, by: -10 }, .14, ease.out); await tween({ by: 0 }, .1); } await reach(.15); await push(.1); await retract(.3); await close(.25); } }
  ];
  const ANGRY = ['Annoyed', 'Furious', 'Runaway', 'Clingy', 'Secretive'];
  let anger = 0, lastEnd = Date.now(), angerT = 0;
  function paintAnger() { const p = Math.max(0, 1 - anger); const b = $('#pbar'); b.style.width = `${p * 100}%`; b.style.background = p > .6 ? 'var(--good)' : p > .3 ? 'var(--warn)' : 'var(--bad)'; }
  setInterval(() => { if (!busy && anger > 0) { anger = Math.max(0, anger - .03); paintAnger(); } }, 500);

  const SKINS = [
    { id: 'oak', name: 'Oak', need: 0, c: ['#c98b4f', '#a5672f', '#e0a96d', '#d39555', '#7a4a1f', '#9b6232'] },
    { id: 'steel', name: 'Steel', need: 8, c: ['#b0bec5', '#78909c', '#cfd8dc', '#b0bec5', '#37474f', '#90a4ae'] },
    { id: 'bubblegum', name: 'Bubblegum', need: 16, c: ['#f8bbd0', '#f06292', '#fce4ec', '#f8bbd0', '#ad1457', '#f48fb1'] },
    { id: 'midnight', name: 'Midnight', need: 26, c: ['#3f51b5', '#1a237e', '#5c6bc0', '#3949ab', '#0d1442', '#7986cb'] },
    { id: 'gold', name: 'Gold', need: 999, c: ['#ffd54f', '#ffa000', '#ffe082', '#ffca28', '#8d6e00', '#ffb300'] }
  ];
  let skin = Curio.store.get('um:skin', 'oak');
  const skinNeed = (k) => (k.need === 999 ? MOODS.length : k.need);
  function applySkin() {
    const k = SKINS.find((x) => x.id === skin) || SKINS[0];
    const st = (sel, i, j) => { const g = document.querySelectorAll(`${sel} stop`); g[0].setAttribute('stop-color', k.c[i]); g[1].setAttribute('stop-color', k.c[j]); };
    st('#wood', 0, 1); st('#woodTop', 2, 3);
    stage.style.setProperty('--um-line', k.c[4]);
    stage.style.setProperty('--um-grain', k.c[5]);
    $('#skins').innerHTML = SKINS.map((x) => { const ok = met.size >= skinNeed(x); return `<button type="button" class="um-skin${x.id === skin ? ' on' : ''}" data-id="${x.id}" ${ok ? '' : 'disabled'} title="${ok ? x.name : `Meet ${skinNeed(x)} moods to unlock`}"><i style="background:linear-gradient(${x.c[2]}, ${x.c[1]})"></i>${ok ? x.name : `🔒 ${skinNeed(x)}`}</button>`; }).join('');
  }
  $('#skins').addEventListener('click', (e) => { const b = e.target.closest('.um-skin'); if (!b || b.disabled) return; skin = b.dataset.id; Curio.store.set('um:skin', skin); applySkin(); ding(990); });

  const ACH = { first: ['👆', 'First flip'], hundred: ['💯', '100 flips'], thousand: ['🏭', '1,000 flips'], fury: ['🤬', 'Pushed to fury'], night: ['🌙', 'Night owl flip'], lonely: ['🥹', 'Came back'], half: ['📔', 'Half the moods'], all: ['🏆', 'Every mood'] };
  let ach = Curio.store.get('um:ach', []);
  if (!Array.isArray(ach)) ach = [];
  function award(id) { if (ach.includes(id)) return; ach.push(id); Curio.store.set('um:ach', ach); Curio.toast(`${ACH[id][0]} ${ACH[id][1]}`); paintAch(); }
  function paintAch() { $('#ach').innerHTML = Object.entries(ACH).map(([id, [e, n]]) => `<span class="${ach.includes(id) ? 'on' : ''}" title="${n}">${e} ${n}</span>`).join(''); }

  function tickClock() {
    const d = new Date();
    const h = d.getHours(), m = d.getMinutes();
    $('#hourH').setAttribute('transform', `rotate(${(h % 12) * 30 + m / 2})`);
    $('#minH').setAttribute('transform', `rotate(${m * 6})`);
    const night = h >= 20 || h < 6, dusk = h >= 18 && h < 20;
    $('#sky1').setAttribute('stop-color', night ? '#0d1b3e' : dusk ? '#ff8a65' : '#8fd3ff');
    $('#sky2').setAttribute('stop-color', night ? '#283c6e' : dusk ? '#ffd180' : '#e6f6ff');
    $('#sunMoon').setAttribute('fill', night ? '#fff8e1' : '#ffe082');
    $('#winStars').setAttribute('opacity', night ? 1 : 0);
    $('#room').classList.toggle('is-night', night);
  }
  tickClock();
  setInterval(tickClock, 20000);

  const dots = $('#dots');
  MOODS.forEach(() => { const d = document.createElement('div'); dots.append(d); });
  function paintStats() {
    $('#flips').textContent = flips; $('#best').textContent = allTime; $('#met').textContent = `${met.size}/${MOODS.length}`;
    MOODS.forEach((m, i) => {
      const d = dots.children[i]; const has = met.has(m.name);
      d.className = has ? 'on' : '';
      d.innerHTML = has ? `<span>${m.em}</span><b>${m.name}</b>` : `<span>❔</span><b>${m.special === 'lonely' ? 'Leave it alone a while' : m.special === 'milestone' ? 'Every 50th flip' : ANGRY.includes(m.name) ? 'Test its patience' : '???'}</b>`;
    });
    if (met.size >= Math.ceil(MOODS.length / 2)) award('half');
    if (met.size >= MOODS.length) award('all');
    applySkin();
  }

  function nextMood(idle) {
    const by = (n) => MOODS.find((m) => m.name === n);
    if (allTime % 50 === 0) return by('Celebrating');
    if (idle > 45000 && allTime > 1) { award('lonely'); return by('Lonely'); }
    if (anger >= 1) { anger = .45; award('fury'); return by(Curio.pick(ANGRY)); }
    const h = new Date().getHours();
    if ((h >= 23 || h < 5) && Math.random() < .35) { award('night'); return by('Sleepy'); }
    const pool = MOODS.filter((m) => !m.special && !(ANGRY.includes(m.name) && anger < .5));
    const unseen = pool.filter((m) => !met.has(m.name));
    if (flips <= 3) return pool[flips - 1];
    if (unseen.length && Math.random() < .75) return Curio.pick(unseen);
    return Curio.pick(pool.slice(3));
  }

  async function flip() {
    if (busy || locked) {
      if (locked) { say(Curio.pick(['Hands off.', 'I said no.', 'Nice try.']), 1); Curio.beep(150, .1, 'square', .06); }
      return;
    }
    busy = true; on = true;
    const idle = Date.now() - lastEnd;
    anger = Math.min(1.05, anger + (idle < 2500 ? .2 : idle < 6000 ? .08 : 0));
    paintAnger();
    sw.setAttribute('aria-pressed', 'true'); sw.setAttribute('aria-label', 'Switch is on');
    click();
    await tween({ lever: -28 }, .08);
    flips++; allTime++;
    Curio.store.set('um:flips', allTime);
    const m = nextMood(idle);
    award('first');
    if (allTime >= 100) award('hundred');
    if (allTime >= 1000) award('thousand');
    setMood(m.em, m.name);
    const isNew = !met.has(m.name);
    met.add(m.name); Curio.store.set('um:met', [...met]);
    paintStats();
    await wait(.25);
    try { await m.run(); } catch {}
    pose('point'); T.rot = null;
    if (on) { await tween({ lever: 28 }, .1); click(); setOff(); }
    Object.assign(T, { lid: 0, ey: HOME.ey, hx: HOME.hx, hy: HOME.hy, bx: 0, by: 0, br: 0, sq: 1, brows: 0 }); render();
    dark.classList.remove('on');
    busy = false; locked = false;
    lastEnd = Date.now();
    if (isNew && met.size === MOODS.length) {
      Curio.confetti();
      const v = await Curio.modal({ emoji: '📦', title: 'You met every mood', body: `${MOODS.length} moods in ${flips} flips. The machine respects you now. It is still going to turn itself off.`, buttons: [{ label: 'Keep flipping', value: 1 }, { label: 'Reset moods', value: 0 }] });
      if (v === 0) { met.clear(); Curio.store.set('um:met', []); flips = 0; paintStats(); }
    }
    setTimeout(() => { if (!busy) setMood('😌', 'Waiting patiently'); }, 4000);
  }
  sw.addEventListener('click', flip);
  window.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && document.activeElement === document.body) { e.preventDefault(); flip(); } });
  paintStats(); paintAch(); paintAnger(); render();
})();
