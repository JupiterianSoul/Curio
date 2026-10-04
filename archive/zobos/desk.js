(function () {
  const INK = '#2b2347';
  const S = `stroke="${INK}" stroke-linecap="round" stroke-linejoin="round"`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hash = (s) => { let h = 2166136261; for (const c of s) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

  function zob(cls = '') {
    return `<svg class="zobv ${cls}" viewBox="0 0 120 152" aria-hidden="true" focusable="false"><defs><clipPath id="zobv-clip"><path d="M60 40C96 40 112 68 110 100C108 130 88 144 60 144C32 144 12 130 10 100C8 68 24 40 60 40Z"/></clipPath></defs><g class="zobv-all"><g class="zobv-ant"><path d="M62 42C61 28 69 19 79 13" fill="none" ${S} stroke-width="4.5"/><circle class="zobv-bulb" cx="81" cy="12" r="8.5" fill="#ffcf3a" ${S} stroke-width="4.5"/><circle cx="78" cy="9" r="2.6" fill="#fff"/></g><path class="zobv-armb" d="M14 104C4 112 2 124 8 130" fill="none" ${S} stroke-width="12"/><path class="zobv-armb" d="M14 104C4 112 2 124 8 130" fill="none" stroke="#e8457c" stroke-linecap="round" stroke-width="5"/><path d="M60 40C96 40 112 68 110 100C108 130 88 144 60 144C32 144 12 130 10 100C8 68 24 40 60 40Z" fill="#e8457c"/><g clip-path="url(#zobv-clip)"><circle cx="98" cy="134" r="52" fill="#c42d63" opacity=".55"/><circle cx="98" cy="134" r="52" fill="url(#zr-dots)"/><ellipse cx="38" cy="62" rx="15" ry="9" fill="#ff8db3" transform="rotate(-28 38 62)"/></g><path d="M60 40C96 40 112 68 110 100C108 130 88 144 60 144C32 144 12 130 10 100C8 68 24 40 60 40Z" fill="none" ${S} stroke-width="5"/><ellipse cx="30" cy="114" rx="9" ry="6" fill="#ff9ec4"/><ellipse cx="90" cy="114" rx="9" ry="6" fill="#ff9ec4"/><g class="zobv-eye"><circle cx="60" cy="86" r="25" fill="#fffdf6" ${S} stroke-width="5"/><g class="zobv-pupil"><circle cx="60" cy="88" r="11.5" fill="${INK}"/><circle cx="64.5" cy="82.5" r="3.8" fill="#fff"/></g></g><path class="zobv-shut" d="M38 90Q60 104 82 90" fill="none" ${S} stroke-width="5"/><path class="zobv-smile" d="M50 122Q60 131 70 122" fill="none" ${S} stroke-width="4.5"/><ellipse class="zobv-o" cx="60" cy="125" rx="5" ry="6" fill="${INK}"/><g class="zobv-arm"><path d="M106 102C118 94 121 82 116 72" fill="none" ${S} stroke-width="12"/><path d="M106 102C118 94 121 82 116 72" fill="none" stroke="#e8457c" stroke-linecap="round" stroke-width="5"/></g><ellipse cx="42" cy="145" rx="12" ry="6" fill="#c42d63" ${S} stroke-width="4"/><ellipse cx="78" cy="145" rx="12" ry="6" fill="#c42d63" ${S} stroke-width="4"/><g class="zobv-hat zobv-hat--party"><path d="M30 52L46 8L62 46Z" fill="#ffcf3a" ${S} stroke-width="4"/><path d="M38 30L52 26M34 42L58 36" ${S} stroke-width="3" fill="none" stroke="#e8457c"/><circle cx="46" cy="7" r="5" fill="#7fd9b0" ${S} stroke-width="3"/></g><g class="zobv-hat zobv-hat--witch"><path d="M28 46L58 2L76 44Z" fill="#2b2347" ${S} stroke-width="4"/><path d="M14 48Q60 34 106 48Q60 58 14 48Z" fill="#2b2347" ${S} stroke-width="4"/><path d="M40 40Q58 34 72 40" stroke="#ff8a2a" stroke-width="5" fill="none"/></g><g class="zobv-hat zobv-hat--night"><path d="M26 56Q40 14 84 26Q100 34 104 52Q64 40 26 56Z" fill="#4a5bd6" ${S} stroke-width="4"/><circle cx="104" cy="56" r="7" fill="#fffdf6" ${S} stroke-width="3"/></g><g class="zobv-hat zobv-hat--scarf"><path d="M14 112Q60 128 106 112L108 124Q60 140 12 124Z" fill="#d6332b" ${S} stroke-width="4"/><path d="M84 126L92 146L104 142L96 122" fill="#d6332b" ${S} stroke-width="4"/></g></g></svg>`;
  }
  window.ZobleArt = { zob };

  const DEFS = `<svg class="room-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><pattern id="zr-dots" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.1" fill="${INK}" opacity=".22"/></pattern><pattern id="zr-dots-w" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1" fill="#fff" opacity=".35"/></pattern><linearGradient id="zr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color: var(--sky1)"/><stop offset="1" style="stop-color: var(--sky2)"/></linearGradient></defs></svg>`;

  const WINDOW = `<svg viewBox="0 0 200 214" aria-hidden="true" focusable="false"><rect x="10" y="8" width="180" height="186" rx="10" fill="#fff8ec" ${S} stroke-width="5"/><rect x="24" y="22" width="152" height="158" rx="4" fill="url(#zr-sky)" ${S} stroke-width="4"/><g class="win-stars">${[[42, 40], [70, 58], [150, 36], [118, 70], [56, 90], [160, 98], [96, 44]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.6 : 2.4}" fill="#fff6c8"/>`).join('')}</g><g class="win-orb"><circle cx="138" cy="62" r="17" style="fill: var(--orb)" ${S} stroke-width="4"/><circle class="win-bite" cx="148" cy="54" r="14" style="fill: var(--sky1)"/></g><g class="win-clouds"><path d="M40 82q-2-12 12-12q4-10 16-6q10-6 16 4q12 0 10 12z" fill="#fff" ${S} stroke-width="3.5"/><path d="M120 116q-2-10 10-10q4-8 14-4q8-4 12 4q10 0 8 10z" fill="#fff" ${S} stroke-width="3.5"/></g><path d="M24 152Q60 128 96 146T176 138V180H24Z" style="fill: var(--hill)" ${S} stroke-width="4"/><path d="M130 142v-14" ${S} stroke-width="4"/><circle cx="130" cy="122" r="10" style="fill: var(--tree)" ${S} stroke-width="4"/><path d="M100 22V180M24 101H176" ${S} stroke-width="5"/><path d="M100 22V180M24 101H176" stroke="#fff8ec" stroke-width="2"/><rect x="2" y="190" width="196" height="16" rx="5" fill="#d8955c" ${S} stroke-width="5"/><path d="M8 198h184" stroke="#b9743f" stroke-width="2" stroke-dasharray="14 9"/></svg>`;

  const LAMP = `<svg viewBox="0 0 170 320" aria-hidden="true" focusable="false"><ellipse cx="74" cy="304" rx="56" ry="11" fill="${INK}" opacity=".18"/><path d="M26 300q0-22 48-22t48 22z" fill="#ff7b6b" ${S} stroke-width="5"/><path d="M40 292q34-10 68 0" stroke="#fff" stroke-width="3" fill="none" opacity=".6"/><path d="M74 280L44 158" ${S} stroke-width="11"/><path d="M74 280L44 158" stroke="#ffcf3a" stroke-linecap="round" stroke-width="4"/><path d="M58 236l10-4M54 220l10-4M50 204l10-4" ${S} stroke-width="3"/><circle cx="44" cy="158" r="9" fill="#ff7b6b" ${S} stroke-width="4.5"/><path d="M44 158L118 82" ${S} stroke-width="11"/><path d="M44 158L118 82" stroke="#ffcf3a" stroke-linecap="round" stroke-width="4"/><circle cx="118" cy="82" r="8" fill="#ff7b6b" ${S} stroke-width="4.5"/><g class="lamp-head"><path d="M100 60L150 54L166 112Q130 124 92 104Z" fill="#ff7b6b" ${S} stroke-width="5"/><path d="M100 60L150 54L158 82Q126 90 96 82Z" fill="url(#zr-dots)"/><path d="M108 70L148 66" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><ellipse class="lamp-bulb" cx="130" cy="111" rx="20" ry="8" ${S} stroke-width="4"/></g></svg>`;

  const PLANT = `<svg viewBox="0 0 170 260" aria-hidden="true" focusable="false"><g class="pl-leaves"><path class="pl s1" d="M84 186C70 150 40 140 22 150C30 176 56 190 84 186Z" fill="#4caf6e" ${S} stroke-width="4.5"/><path class="pl s1" d="M86 186C100 148 132 138 150 148C142 176 114 190 86 186Z" fill="#5fc27f" ${S} stroke-width="4.5"/><path class="pl s2" d="M84 184C60 120 30 108 14 112C18 146 50 170 84 184Z" fill="#3f9b62" ${S} stroke-width="4.5"/><path class="pl s2" d="M86 182C114 118 148 110 160 116C154 150 120 170 86 182Z" fill="#4caf6e" ${S} stroke-width="4.5"/><path class="pl s3" d="M85 184C78 120 92 76 112 60C126 92 108 150 85 184Z" fill="#5fc27f" ${S} stroke-width="4.5"/><path class="pl s3" d="M84 184C68 130 52 96 30 80C22 110 52 160 84 184Z" fill="#3f9b62" ${S} stroke-width="4.5"/><path class="pl s4" d="M85 184C84 110 70 58 52 34C38 70 60 140 85 184Z" fill="#4caf6e" ${S} stroke-width="4.5"/><path class="pl s4" d="M86 184C100 112 124 72 146 62C152 100 120 150 86 184Z" fill="#6cc58a" ${S} stroke-width="4.5"/><path d="M85 186V150" ${S} stroke-width="4"/><g class="pl s5"><circle cx="52" cy="34" r="9" fill="#ff86b2" ${S} stroke-width="3.5"/><circle cx="52" cy="34" r="3.5" fill="#ffcf3a"/><circle cx="146" cy="62" r="8" fill="#ffcf3a" ${S} stroke-width="3.5"/><circle cx="112" cy="58" r="8" fill="#ff86b2" ${S} stroke-width="3.5"/><circle cx="112" cy="58" r="3" fill="#ffcf3a"/></g></g><g class="pl-drops">${[[60, 120], [86, 104], [112, 124]].map(([x, y]) => `<path d="M${x} ${y}q-6 8 0 12q6-4 0-12z" fill="#7fc9ff" ${S} stroke-width="2.5"/>`).join('')}</g><path d="M38 186H132L120 252H50Z" fill="#d9653b" ${S} stroke-width="5"/><path d="M42 204H128" stroke="#f2a65a" stroke-width="7"/><path d="M42 204H128" ${S} stroke-width="0"/><path d="M34 182H136V198H34Z" fill="#e47a4a" ${S} stroke-width="5"/><path d="M50 240Q85 248 120 240" fill="none" stroke="url(#zr-dots)" stroke-width="10"/><circle cx="76" cy="226" r="3" fill="${INK}"/><circle cx="94" cy="226" r="3" fill="${INK}"/><path d="M78 234q7 5 14 0" fill="none" ${S} stroke-width="3"/></svg>`;

  const MUG = `<svg viewBox="0 0 100 120" aria-hidden="true" focusable="false"><g class="mug-steam"><path d="M30 34q-8-10 0-18t0-16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/><path d="M48 32q-8-10 0-18t0-16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/><path d="M64 34q-8-10 0-18t0-16" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".85"/></g><ellipse cx="48" cy="110" rx="40" ry="7" fill="${INK}" opacity=".18"/><path d="M74 58q22-2 22 18t-24 20" fill="none" ${S} stroke-width="12"/><path d="M74 58q22-2 22 18t-24 20" fill="none" stroke="#fff3df" stroke-linecap="round" stroke-width="5"/><path d="M12 44H82L78 102Q47 112 16 102Z" fill="#fff3df" ${S} stroke-width="5"/><path d="M14 60H80L79 80H15Z" fill="#e8457c"/><text x="47" y="77" text-anchor="middle" font-family="Zoble Hand, sans-serif" font-size="18" fill="#fff">ZOB</text><ellipse class="mug-coffee" cx="47" cy="45" rx="34" ry="7" fill="#6b3b23" ${S} stroke-width="4"/><path d="M14 60H80M15 80H79" ${S} stroke-width="3"/></svg>`;

  const MOUSE = `<svg viewBox="0 0 120 90" aria-hidden="true" focusable="false"><path d="M50 30C40 8 10 14 6 2" fill="none" ${S} stroke-width="3.5"/><ellipse cx="62" cy="58" rx="30" ry="24" fill="#fff8ec" ${S} stroke-width="5"/><path d="M62 34V56M34 54Q62 62 90 54" fill="none" ${S} stroke-width="3.5"/><path d="M50 74q12 6 26 0" fill="none" stroke="url(#zr-dots)" stroke-width="8"/><ellipse cx="62" cy="44" rx="4" ry="6" fill="#e8457c" ${S} stroke-width="2.5"/></svg>`;

  const BIRD = `<svg viewBox="0 0 60 50" aria-hidden="true" focusable="false"><path class="bird-wing" d="M22 26q10-16 22-6q-8 10-22 6z" fill="#4a7fd8" ${S} stroke-width="3.5"/><ellipse cx="26" cy="30" rx="16" ry="13" fill="#5b93ef" ${S} stroke-width="4"/><circle cx="20" cy="26" r="2.6" fill="${INK}"/><path d="M8 28l-7 3l7 3z" fill="#ffcf3a" ${S} stroke-width="2.5"/><path d="M24 43v5M32 43v5" ${S} stroke-width="3"/><path d="M40 32q10-2 14 6q-8 2-14-2z" fill="#4a7fd8" ${S} stroke-width="3"/></svg>`;

  const NOTES = [
    { cls: 'n1', col: '#ffe873', tilt: -6, lines: ['zob\'s computer. hands off!! (ok you can play)', 'tip: press the die for a random game', 'tip: / searches every game', 'every game has a simple and an advanced mode'] },
    { cls: 'n2', col: '#ffb3c7', tilt: 5, lines: ['remember: water gerald', 'buy more coffee', 'the drawer is NOT for snacks', 'call mum (she wants a high score)'] },
    { cls: 'n3', col: '#b8f0d0', tilt: -3, lines: ['do not turn off!', 'seriously. do not.', 'ok fine. the button is right there.'] }
  ];

  window.ZobleDesk = function (api) {
    const { C } = api;
    const room = document.getElementById('room');
    const wall = document.getElementById('wall');
    const front = document.getElementById('front');
    const chin = document.getElementById('chin');
    const crt = document.getElementById('crt');
    const store = C.store;
    const el = (tag, cls = '', inner = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (inner) e.innerHTML = inner; return e; };
    const btn = (cls, label, inner = '') => { const b = el('button', `rb ${cls}`, inner); b.type = 'button'; b.setAttribute('aria-label', label); return b; };
    const pop = (node, cls) => { node.classList.remove(cls); void node.offsetWidth; node.classList.add(cls); };

    room.insertAdjacentHTML('afterbegin', DEFS);

    const params = new URLSearchParams(location.search);
    const PARTS = ['dawn', 'day', 'dusk', 'night'];
    const partOf = (h) => (h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night');
    let part = PARTS.includes(params.get('time')) ? params.get('time') : partOf(new Date().getHours());
    const setPart = (p) => { part = p; room.dataset.time = p; };
    setPart(part);

    const win = el('div', 'r-window');
    win.innerHTML = WINDOW;
    const orb = btn('r-orb', 'The sky outside. Click to fast-forward the day');
    const bird = btn('r-bird', 'A little bird on the window sill', BIRD);
    bird.hidden = true;
    win.append(orb, bird);
    const board = el('div', 'r-board');
    const today = new Date();
    const dayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    const pool = api.games.slice();
    const picks = [];
    const first = api.explorer?.pick?.() || pool[hash(`zob:${dayKey}`) % pool.length];
    picks.push(first);
    for (let i = 1; picks.length < 3 && i < 20; i++) { const g = pool[hash(`pin:${dayKey}:${i}`) % pool.length]; if (!picks.includes(g)) picks.push(g); }
    board.innerHTML = `<span class="r-board__title" aria-hidden="true">zob's wall of fame</span><span class="r-board__doodle" aria-hidden="true">${zob('zobv--doodle')}</span><span class="r-board__score" aria-hidden="true">hi-score<br>zob 999999<br>you ???</span>`;
    picks.forEach((g, i) => {
      const p = btn(`r-polaroid r-polaroid--${i}`, `Photo pinned to the board: ${g.title}. Click to play`, `<span class="r-polaroid__pin" aria-hidden="true"></span><img alt="" src="games/${g.slug}/thumb.svg" draggable="false"><span class="r-polaroid__cap">${esc(g.title.toLowerCase())}</span>`);
      p.addEventListener('click', () => { C.sfx('paper'); api.openGame(g.slug, { from: p.getBoundingClientRect() }); });
      board.append(p);
    });
    const beam = el('div', 'r-beam');
    beam.setAttribute('aria-hidden', 'true');
    wall.append(beam, win, board);

    const lampWrap = el('div', 'r-lamp-wrap');
    const lamp = btn('r-lamp', 'Desk lamp. Click to switch the lights', LAMP);
    const glow = el('div', 'r-glow');
    glow.setAttribute('aria-hidden', 'true');
    lampWrap.append(lamp);
    const plant = btn('r-plant', 'Gerald the plant. Click to water him', PLANT);
    const mug = btn('r-mug', 'Zob\'s coffee mug. Click for a sip', MUG);
    const mouse = btn('r-mouse', 'Zob\'s mouse', MOUSE);
    const kb = el('div', 'r-kb');
    kb.setAttribute('role', 'group');
    kb.setAttribute('aria-label', 'Zob\'s keyboard');
    const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
    kb.innerHTML = `<div class="r-kb__body">${ROWS.map((r, i) => `<div class="r-kb__row r-kb__row--${i}">${[...r].map((k) => `<button type="button" class="r-key${'ZOB'.includes(k) ? ` r-key--${k.toLowerCase()}` : ''}" data-k="${k}" aria-label="${k} key" tabindex="-1">${k}</button>`).join('')}</div>`).join('')}<div class="r-kb__row r-kb__row--3"><button type="button" class="r-key r-key--space" data-k=" " aria-label="Space bar" tabindex="-1"></button></div></div>`;
    const deskTop = el('div', 'r-desktop');
    deskTop.setAttribute('aria-hidden', 'true');
    const apron = el('div', 'r-apron');
    const drawer = btn('r-drawer', 'Desk drawer. Something rattles inside', '<span class="r-drawer__knob"></span><span class="r-drawer__label">secrets</span><span class="r-drawer__inside" aria-hidden="true"><i></i><i></i><i></i><i></i></span>');
    const drawer2 = el('div', 'r-drawer r-drawer--l', '<span class="r-drawer__knob"></span>');
    drawer2.setAttribute('aria-hidden', 'true');
    apron.append(drawer2, drawer);
    front.append(deskTop, glow, apron, lampWrap, mug, kb, mouse, plant);

    chin.innerHTML = `<span class="crt-plate" aria-hidden="true"><b>ZOBLE</b><i>ZobOS inside</i></span><span class="crt-vents" aria-hidden="true"></span>`;
    const knob = btn('crt-knob', 'Colour knob. Turn it to change Zob\'s screen colours');
    const knob2 = el('span', 'crt-knob crt-knob--2');
    knob2.setAttribute('aria-hidden', 'true');
    const led = el('span', 'crt-led');
    led.setAttribute('aria-hidden', 'true');
    const power = btn('crt-power', 'Monitor power button');
    chin.append(knob2, knob, led, power);
    const stickers = el('div', 'crt-stickers');
    stickers.setAttribute('aria-hidden', 'true');
    stickers.innerHTML = '<span class="st st--star"></span><span class="st st--heart"></span><span class="st st--zob"></span><span class="st st--bolt"></span>';
    crt.querySelector('.crt-shell').append(stickers);
    const notesRead = new Set();
    const noteEls = NOTES.map((n, i) => {
      const b = btn(`r-note r-note--${n.cls}`, `Sticky note: ${n.lines[0]}`);
      b.style.setProperty('--note', n.col);
      b.style.setProperty('--tilt', `${n.tilt}deg`);
      let k = 0;
      const paint = () => { b.innerHTML = `<span>${esc(n.lines[k])}</span>`; b.setAttribute('aria-label', `Sticky note: ${n.lines[k]}`); };
      paint();
      b.addEventListener('click', () => {
        notesRead.add(`${i}:${k}`);
        k = (k + 1) % n.lines.length;
        pop(b, 'is-peel');
        C.sfx('paper');
        setTimeout(paint, 140);
        notesRead.add(`${i}:${k}`);
        if (NOTES.every((m, j) => m.lines.every((_, q) => notesRead.has(`${j}:${q}`)))) { C.unlock('notes'); api.zobSay('you read all my notes! now you know all my secrets. well. some.', 3200); }
      });
      return b;
    });
    crt.append(...noteEls);

    const SUN = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="#fff8ec" ${S} stroke-width="2.4"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1" ${S} stroke-width="2.4"/></svg>`;
    const MOON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3a9 9 0 1 0 4 12A7.5 7.5 0 0 1 17 3z" fill="#fff8ec" ${S} stroke-width="2.4"/></svg>`;
    const pbar = el('div', 'pocket-bar');
    pbar.innerHTML = '<span class="pocket-bar__word"><b>Zob<i>OS</i></b><span>pocket edition</span></span>';
    const plamp = btn('pocket-lamp', 'Switch the lights');
    const pled = el('span', 'crt-led');
    pled.setAttribute('aria-hidden', 'true');
    pbar.append(pled, plamp);
    crt.querySelector('.crt-shell').append(pbar);
    function lampOn() { return !C.isDark(); }
    function paintLamp() { room.classList.toggle('lamp-on', lampOn()); plamp.innerHTML = lampOn() ? MOON : SUN; plamp.setAttribute('aria-label', lampOn() ? 'Lights off: dark colours' : 'Lights on: light colours'); }
    paintLamp();
    window.addEventListener('curio:theme', paintLamp);
    window.addEventListener('curio:prefs', paintLamp);
    const DARK_OF = (id) => (id === 'standard' || ['rainy', 'desert', 'marine', 'lilac', 'brick', 'pumpkin', 'eggplant'].includes(id) ? 'midnight' : 'zobnight');
    function toggleLamp() {
      const cur = C.look;
      if (C.isDark()) { const back = store.get('hub:lightlook', null); C.setLook(back && back !== cur ? back : cur === 'midnight' ? 'standard' : 'zob'); C.sfx('on'); }
      else { store.set('hub:lightlook', cur); C.setLook(DARK_OF(cur)); C.sfx('off'); }
      paintLamp();
      pop(lamp, 'is-click');
      pop(plamp, 'is-press');
      C.unlock('lamp');
      if (part === 'night' && !lampOn()) api.zobSay('ooh, cosy. just me and the screen glow.', 2600);
      else if (!lampOn()) api.zobSay('lights off! the screen looks better like this anyway.', 2600);
      else api.zobSay(C.pick(['ah, light! I can see my keyboard again.', 'lamp on. productivity up 400%.']), 2400);
    }
    lamp.addEventListener('click', toggleLamp);
    plamp.addEventListener('click', toggleLamp);

    const visits = () => store.get('hub:visits', 1);
    let waters = store.get('hub:water', 0);
    const stage = () => { const g = visits() + waters * 2; return g >= 24 ? 5 : g >= 14 ? 4 : g >= 7 ? 3 : g >= 3 ? 2 : 1; };
    const paintPlant = () => { plant.dataset.stage = String(stage()); };
    paintPlant();
    let waterTimes = [];
    plant.addEventListener('click', () => {
      waters++; store.set('hub:water', waters);
      const before = plant.dataset.stage;
      paintPlant();
      pop(plant, 'is-water');
      C.sfx('pop');
      C.unlock('plant');
      const t = performance.now();
      waterTimes = waterTimes.filter((x) => t - x < 4000).concat(t);
      if (waterTimes.length >= 5) { waterTimes = []; api.zobSay('careful! Gerald can\'t swim.', 2400); }
      else if (before !== plant.dataset.stage) api.zobSay(plant.dataset.stage === '5' ? 'Gerald is blooming! I\'m so proud.' : 'look, Gerald grew a new leaf!', 2600);
      else if (Math.random() < 0.4) api.zobSay(C.pick(['Gerald says thank you.', 'glug glug glug', 'he grows a little every time you visit.']), 2200);
    });

    let sips = 0;
    mug.addEventListener('click', () => {
      if (mug.classList.contains('is-empty')) { api.zobSay('it\'s empty. I\'ll make more. eventually.', 2200); C.sfx('tap'); return; }
      sips++;
      pop(mug, 'is-sip');
      C.sfx('blip', 3);
      mug.style.setProperty('--level', String(Math.max(0, 1 - sips / 5)));
      if (sips >= 5) {
        mug.classList.add('is-empty');
        C.unlock('coffee');
        api.zobSay('hey! that was MY coffee. all five sips of it.', 3000);
        setTimeout(() => { sips = 0; mug.classList.remove('is-empty'); mug.style.setProperty('--level', '1'); }, 60000);
      } else if (sips === 1) api.zobSay(C.pick(['careful, it\'s hot.', 'that\'s my mug.', 'it\'s decaf. probably.']), 2000);
    });

    mouse.addEventListener('click', () => { pop(mouse, 'is-wiggle'); C.sfx('click'); });
    let typedKeys = '';
    const press = (k) => {
      const b = kb.querySelector(`[data-k="${k === ' ' ? ' ' : k.toUpperCase()}"]`);
      if (!b) return;
      pop(b, 'is-down');
    };
    kb.addEventListener('click', (e) => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      press(b.dataset.k);
      C.sfx('tap');
      typedKeys = (typedKeys + b.dataset.k.toLowerCase()).slice(-5);
      if (typedKeys.endsWith('zob')) { api.zobWave(); api.zobSay('you typed my name! on MY keyboard!', 2400); typedKeys = ''; }
    });
    document.addEventListener('keydown', (e) => { if (e.key.length === 1 && /[a-z ]/i.test(e.key) && !e.ctrlKey && !e.metaKey) press(e.key); });

    let drawerT = 0;
    drawer.addEventListener('click', () => {
      clearTimeout(drawerT);
      drawer.classList.add('is-open');
      C.sfx('lift');
      drawerT = setTimeout(() => { C.secretsWindow().then(() => drawer.classList.remove('is-open')); }, C.calm ? 0 : 380);
    });

    orb.addEventListener('click', () => {
      const n = PARTS[(PARTS.indexOf(part) + 1) % PARTS.length];
      setPart(n);
      C.sfx('whoosh');
      api.zobSay({ dawn: 'good morning! the sun is yawning.', day: 'lovely day for playing indoors.', dusk: 'ooh, the sky is going orange.', night: 'night already? time flies when you\'re clicking.' }[n], 2200);
    });
    function birdVisit() {
      if (!bird.hidden || part === 'night' || document.hidden) return;
      bird.hidden = false;
      bird.classList.remove('is-off');
      pop(bird, 'is-land');
      setTimeout(() => { if (!bird.hidden && !bird.classList.contains('is-off')) { bird.classList.add('is-off'); setTimeout(() => { bird.hidden = true; }, 900); } }, 26000);
    }
    bird.addEventListener('click', () => {
      C.sfx('note', 7);
      setTimeout(() => C.sfx('note', 9), 120);
      bird.classList.add('is-off');
      C.unlock('bird');
      api.zobSay(C.pick(['bye, bird! come back tomorrow.', 'that\'s Pip. he visits most days.', 'tweet tweet. that means hello.']), 2400);
      setTimeout(() => { bird.hidden = true; }, 900);
    });
    setTimeout(birdVisit, 9000 + Math.random() * 12000);
    setInterval(() => { if (Math.random() < 0.35) birdVisit(); }, 60000);

    const FAMILY = ['zob', 'mint', 'sherbet', 'zobnight'];
    knob.addEventListener('click', () => {
      const i = FAMILY.indexOf(C.look);
      const next = FAMILY[(i + 1) % FAMILY.length];
      C.setLook(next);
      knob.style.setProperty('--turn', `${(FAMILY.indexOf(next) + 1) * 72}deg`);
      C.sfx('click');
      const l = C.looks.find((x) => x.id === next);
      if (l) C.balloon(`${l.name}: ${l.note.toLowerCase()}`, { ms: 1800 });
      paintLamp();
    });

    let off = false;
    power.addEventListener('click', () => {
      pop(power, 'is-press');
      if (!off) {
        off = true;
        room.classList.add('crt-off');
        C.sfx('off');
        api.zobSay('hey! I was using that!', 2400);
      } else {
        off = false;
        room.classList.remove('crt-off');
        pop(crt, 'is-boot');
        C.sfx('startup');
        C.unlock('power');
        if (api.powerOn) api.powerOn();
        api.zobSay('have you tried turning it off and on again? yes. yes you have.', 3000);
      }
    });

    let raf = 0, px0 = 0, py0 = 0;
    const look = () => {
      raf = 0;
      const eye = document.querySelector('.zob .zobv-eye');
      const pupil = document.querySelector('.zob .zobv-pupil');
      if (!eye || !pupil) return;
      const r = eye.getBoundingClientRect();
      if (!r.width) return;
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = px0 - cx, dy = py0 - cy, d = Math.hypot(dx, dy) || 1;
      const m = Math.min(1, d / 260) * 7;
      pupil.style.transform = `translate(${(dx / d * m).toFixed(2)}px, ${(dy / d * m).toFixed(2)}px)`;
    };
    window.addEventListener('pointermove', (e) => { px0 = e.clientX; py0 = e.clientY; if (!raf) raf = requestAnimationFrame(look); }, { passive: true });

    function setLed(state) { led.dataset.state = state || ''; }

    return { setLed, setPart, get part() { return part; }, toggleLamp, notes: noteEls };
  };
})();
