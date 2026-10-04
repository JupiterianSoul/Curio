(() => {
  const SIMPLE = Curio.simple;
  const $ = (s) => document.querySelector(s);
  const desk = $('#desk'), logEl = $('#log'), canvas = $('#prints'), puddle = $('#puddle');
  const pctx = canvas.getContext('2d');
  const svgNS = 'http://www.w3.org/2000/svg';
  let DW = desk.clientWidth, DH = desk.clientHeight;
  const FLOOR = 44;

  const ICONS = {
    folder: '<svg viewBox="0 0 48 48"><path d="M4 12a3 3 0 0 1 3-3h12l4 5h18a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#f4b400"/><path d="M4 18h40v20a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ffd54f"/></svg>',
    bin: '<svg viewBox="0 0 48 48"><path d="M12 14h24l-3 28H15z" fill="#cfd8dc" stroke="#78909c" stroke-width="2"/><rect x="9" y="9" width="30" height="5" rx="2" fill="#90a4ae"/><path d="M19 19v18M24 19v18M29 19v18" stroke="#90a4ae" stroke-width="2"/></svg>',
    txt: '<svg viewBox="0 0 48 48"><path d="M10 4h20l10 10v30H10z" fill="#fff" stroke="#b0bec5" stroke-width="2"/><path d="M30 4v10h10" fill="#eceff1" stroke="#b0bec5" stroke-width="2"/><path d="M15 22h20M15 28h20M15 34h14" stroke="#90a4ae" stroke-width="2.5"/></svg>',
    xls: '<svg viewBox="0 0 48 48"><path d="M10 4h20l10 10v30H10z" fill="#fff" stroke="#b0bec5" stroke-width="2"/><rect x="14" y="20" width="22" height="18" fill="#c8e6c9" stroke="#2e7d32" stroke-width="1.5"/><path d="M14 26h22M14 32h22M21 20v18M28 20v18" stroke="#2e7d32" stroke-width="1.2"/></svg>',
    img: '<svg viewBox="0 0 48 48"><rect x="5" y="9" width="38" height="30" rx="3" fill="#fff" stroke="#b0bec5" stroke-width="2"/><path d="M14 33l6-10 5 7 4-5 7 8z" fill="#ff9800"/><circle cx="17" cy="18" r="3.5" fill="#ffb74d"/><path d="M28 14l3 4 3-4v8h-6z" fill="#795548"/></svg>',
    danger: '<svg viewBox="0 0 48 48"><path d="M4 12a3 3 0 0 1 3-3h12l4 5h18a3 3 0 0 1 3 3v21a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#e53935"/><path d="M4 18h40v20a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ef5350"/><path d="M24 22v8M24 34v1" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/></svg>'
  };
  const MUG = '<svg viewBox="0 0 50 50" width="46" height="46"><path d="M8 14h28v24a8 8 0 0 1-8 8H16a8 8 0 0 1-8-8z" fill="#ff7043"/><path d="M36 20h4a6 6 0 0 1 0 12h-4" fill="none" stroke="#ff7043" stroke-width="4"/><ellipse cx="22" cy="14" rx="14" ry="4" fill="#5d3a1a"/><path d="M16 8q2-4 0-7M24 9q2-4 0-7" stroke="#bbb" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M14 24h16" stroke="#fff" stroke-width="3" opacity=".6"/></svg>';
  const PLANT = '<svg viewBox="0 0 60 70" width="54" height="64"><path d="M30 36C18 30 10 18 14 6c8 6 14 16 16 30zM30 36c4-14 12-24 22-28 2 12-8 24-22 28zM30 38C22 30 8 30 4 24c10-2 22 2 26 14z" fill="#43a047"/><path d="M30 36c-2-10 0-20 4-28" stroke="#2e7d32" stroke-width="2" fill="none"/><path d="M14 40h32l-4 26H18z" fill="#d84315"/><rect x="12" y="36" width="36" height="7" rx="2" fill="#bf360c"/></svg>';
  const DUCK = '<svg viewBox="0 0 50 44" width="44" height="40"><path d="M6 26c0 10 8 16 20 16s20-6 20-14c0-6-6-8-12-6-2-10-18-12-20-2-4-2-8 0-8 6z" fill="#ffd600"/><circle cx="22" cy="14" r="10" fill="#ffd600"/><path d="M30 14l10 2-10 4z" fill="#ff6d00"/><circle cx="25" cy="11" r="1.8" fill="#222"/><path d="M14 30q8 6 18 0" stroke="#f9a825" stroke-width="2" fill="none"/></svg>';
  const PHONE = '<svg viewBox="0 0 30 50" width="28" height="46"><rect x="2" y="2" width="26" height="46" rx="5" fill="#263238"/><rect x="5" y="7" width="20" height="34" rx="2" fill="#4fc3f7"/><path d="M8 14h14M8 19h10M8 24h12" stroke="#fff" stroke-width="2" opacity=".8"/><circle cx="15" cy="44.5" r="1.8" fill="#607d8b"/><circle cx="21" cy="10" r="3" fill="#e53935"/></svg>';
  const PENCILS = '<svg viewBox="0 0 44 60" width="40" height="56"><path d="M12 6l4 22M22 2v26M32 8l-4 20" stroke-width="5" stroke-linecap="round"/><path d="M12 6l4 22" stroke="#ffca28" stroke-width="5"/><path d="M22 2v26" stroke="#ef5350" stroke-width="5"/><path d="M32 8l-4 20" stroke="#42a5f5" stroke-width="5"/><rect x="6" y="24" width="32" height="34" rx="4" fill="#7e57c2"/><rect x="6" y="24" width="32" height="6" fill="#9575cd"/><path d="M14 40h16" stroke="#fff" stroke-width="2" opacity=".5"/></svg>';
  const SPILLS = { mug: '#6d4321', plant: '#5d4037', pencils: '#7e57c2' };

  const ITEMS = [
    { id: 'docs', label: 'Documents', kind: 'steal', icon: 'folder', home: [44, 54] },
    { id: 'bin', label: 'Recycle Bin', kind: 'steal', icon: 'bin', home: [44, 148] },
    { id: 'homework', label: 'homework_FINAL.txt', kind: 'steal', icon: 'txt', home: [44, 242] },
    { id: 'taxes', label: 'taxes_v3_real.xls', kind: 'steal', icon: 'xls', home: [124, 54] },
    { id: 'cat', label: 'cat.jpg', kind: 'steal', icon: 'img', home: [124, 148] },
    { id: 'secret', label: 'DO NOT OPEN', kind: 'steal', icon: 'danger', home: [124, 242] },
    { id: 'note1', label: 'the sticky note', kind: 'steal', note: 'buy milk & bread (NOT for goose)', home: [-.56, -.64] },
    { id: 'note2', label: 'the pink sticky note', kind: 'steal', note: 'call mom back!!', color: 'pink', home: [-.74, -.7] },
    { id: 'note3', label: 'the password note', kind: 'steal', note: 'wifi pw: goose_free_zone', color: 'blue', home: [-.9, -.6] },
    { id: 'duck', label: 'the rubber duck', kind: 'steal', thing: DUCK, home: [-.3, -.86] },
    { id: 'mug', label: 'your coffee', kind: 'knock', thing: MUG, home: [-.9, -.84] },
    { id: 'plant', label: 'the plant', kind: 'knock', thing: PLANT, home: [-.47, -.84] },
    { id: 'phone', label: 'your phone', kind: 'steal', thing: PHONE, home: [-.95, -.36] },
    { id: 'pencils', label: 'the pencil cup', kind: 'knock', thing: PENCILS, home: [-.14, -.86] }
  ];
  function homeXY(it) {
    const [a, b] = it.home;
    const hw = (it.el ? it.el.offsetWidth : 70) / 2 + 4;
    const x = a < 0 ? -a * DW : a;
    return [Math.max(hw, Math.min(DW - hw, x)), b < 0 ? -b * (DH - FLOOR) : b];
  }

  ITEMS.forEach((it) => {
    const el = document.createElement('div');
    el.className = 'cg-item';
    if (it.icon) { el.classList.add('cg-icon'); el.innerHTML = ICONS[it.icon] + '<span></span>'; el.lastChild.textContent = it.label; }
    else if (it.note) { el.classList.add('cg-note'); if (it.color) el.classList.add(it.color); el.textContent = it.note; }
    else { el.classList.add('cg-thing'); el.innerHTML = it.thing + (it.kind === 'knock' ? `<i class="cg-spill" style="background:${SPILLS[it.id]}"></i>` : ''); }
    el.setAttribute('aria-label', it.label);
    desk.append(el);
    it.el = el;
    [it.x, it.y] = homeXY(it);
    it.rot = it.note ? Curio.rand(-6, 6) : 0;
    it.knocked = false; it.moved = false;
  });
  function placeItem(it) {
    const w = it.el.offsetWidth, h = it.el.offsetHeight;
    it.el.style.transform = `translate(${it.x - w / 2}px, ${it.y - h / 2}px)`;
    it.el.style.rotate = (it.knocked ? (it.id === 'plant' ? 84 : -88) : it.rot) + 'deg';
  }
  function placePuddle() {
    puddle.style.left = (DW * .69 - puddle.offsetWidth / 2) + 'px';
    puddle.style.top = (DH - FLOOR - 58) + 'px';
  }
  const puddleXY = () => [DW * .69, DH - FLOOR - 35];

  function sizeCanvas() {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = DW * dpr; canvas.height = DH * dpr;
    pctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const BREEDS = [
    { name: 'Domestic goose', body: '#fafaf5', line: '#d6d6cc', wing: '#e3e3da', wline: '#c9c9bf', tail: '#e8e8e0', neck: '#fafaf5', head: '#fafaf5', beak: '#ff9800', jaw: '#ef6c00', legA: '#ff8f00', legB: '#f57c00' },
    { name: 'Greylag goose', body: '#c9c2b5', line: '#a39b8d', wing: '#9b9385', wline: '#7f776a', tail: '#a8a093', neck: '#b3ab9e', head: '#b3ab9e', beak: '#ff8a50', jaw: '#f4703a', legA: '#f4a6a6', legB: '#e99393' },
    { name: 'Canada goose', body: '#9c8a74', line: '#7d6c58', wing: '#7a6957', wline: '#5f5142', tail: '#2b2622', neck: '#24211f', head: '#24211f', beak: '#2b2b2b', jaw: '#1b1b1b', legA: '#3a3a3a', legB: '#2a2a2a', cheek: true },
    { name: 'Emperor goose', body: '#9eabbd', line: '#7d8a9c', wing: '#7f8ca0', wline: '#66728a', tail: '#5d6a7e', neck: '#f4f4f0', head: '#f4f4f0', beak: '#f48fb1', jaw: '#e57399', legA: '#ff9800', legB: '#f57c00', throat: true }
  ];
  function gooseSvg(c) {
    return `<svg viewBox="0 -20 120 140" aria-hidden="true">
    <ellipse cx="54" cy="117" rx="34" ry="5" fill="rgba(0,0,0,.18)"/>
    <g class="gLegs">
      <g class="legL"><path d="M46 92v22" stroke="${c.legA}" stroke-width="4.5" stroke-linecap="round"/><path d="M46 114l-8 3h17z" fill="${c.legA}"/></g>
      <g class="legR"><path d="M62 92v22" stroke="${c.legB}" stroke-width="4.5" stroke-linecap="round"/><path d="M62 114l-8 3h17z" fill="${c.legB}"/></g>
    </g>
    <g class="gBody">
      <path d="M6 58l18 6-6 10z" fill="${c.tail}"/>
      <ellipse cx="52" cy="76" rx="40" ry="24" fill="${c.body}" stroke="${c.line}" stroke-width="2"/>
      <path d="M40 92q16 6 34-2" stroke="${c.line}" stroke-width="3" fill="none" opacity=".5"/>
      <g class="gWing"><path d="M26 68q24-16 50-2q-8 18-38 16q-10-2-12-14z" fill="${c.wing}" stroke="${c.wline}" stroke-width="2"/><path d="M36 74q14 4 28-2M40 79q10 2 20-1" stroke="${c.wline}" stroke-width="2" fill="none"/></g>
      <g class="gNeck">
        <path d="M74 70C86 58 82 40 92 26" stroke="${c.neck}" stroke-width="17" stroke-linecap="round" fill="none"/>
        <path d="M74 70C86 58 82 40 92 26" stroke="${c.line}" stroke-width="19" stroke-linecap="round" fill="none" opacity=".35" transform="translate(1 1)"/>
        <path d="M74 70C86 58 82 40 92 26" stroke="${c.neck}" stroke-width="16" stroke-linecap="round" fill="none"/>
        ${c.throat ? '<path d="M80 62C88 52 86 42 94 32" stroke="#2b2b2b" stroke-width="6" stroke-linecap="round" fill="none"/>' : ''}
        <circle cx="94" cy="24" r="12" fill="${c.head}"/>
        ${c.cheek ? '<path d="M88 26q4 8 12 6q-2-6-6-8z" fill="#fff"/>' : ''}
        <g class="gJaw"><path d="M104 27l14 1.5-14 4.5z" fill="${c.jaw}"/></g>
        <path d="M104 20l16 5-16 3z" fill="${c.beak}"/>
        <circle cx="98" cy="20" r="2.6" fill="#1d1b19"/><circle cx="98.8" cy="19.2" r=".8" fill="#fff"/>
        <path class="gBrow" d="M94 15l8 3" stroke="${c.cheek ? '#fff' : '#1d1b19'}" stroke-width="2.2" stroke-linecap="round" opacity="0"/>
        <g class="gHat"></g>
      </g>
    </g>
  </svg>`;
  }
  const geese = [];
  let G = null;
  function makeGoose(bi, hat) {
    const g = { x: 0, y: 0, face: 1, W: 110, held: null, task: [], speed: 0, spd: 1, breed: bi,
      walkPhase: Math.random() * 6, honkT: 0, peckT: 0, flapT: 0, annoy: 0, muddy: 0, distAcc: 0, step: 0, idle: 1.2, hat: hat || 0 };
    const el = document.createElement('div');
    el.className = 'cg-goose';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `${/^[AEIOU]/.test(BREEDS[bi].name) ? 'An' : 'A'} ${BREEDS[bi].name.toLowerCase()}. Click or tap to shoo it.`);
    el.innerHTML = gooseSvg(BREEDS[bi]);
    desk.append(el);
    Object.assign(g, { el, legL: el.querySelector('.legL'), legR: el.querySelector('.legR'), neck: el.querySelector('.gNeck'), jaw: el.querySelector('.gJaw'), wing: el.querySelector('.gWing'), body: el.querySelector('.gBody'), brow: el.querySelector('.gBrow'), hatG: el.querySelector('.gHat') });
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); G = g; shoo(g.x - g.face * 40, g.y); } });
    g.hatG.innerHTML = HATS[g.hat] ? HATS[g.hat].svg : '';
    geese.push(g);
    return g;
  }

  const HATS = [
    { name: 'nothing', svg: '' },
    { name: 'top hat', svg: '<rect x="84" y="-8" width="20" height="18" rx="2" fill="#222"/><rect x="84" y="4" width="20" height="4" fill="#d32f2f"/><rect x="78" y="9" width="32" height="4" rx="2" fill="#222"/>' },
    { name: 'party hat', svg: '<path d="M83 13l11-30 11 30z" fill="#ec407a"/><path d="M86 6l16 0M89 -2l10 0M91 -10l6 0" stroke="#ffeb3b" stroke-width="3"/><circle cx="94" cy="-17" r="4" fill="#ffeb3b"/>' },
    { name: 'crown', svg: '<path d="M82 13l-2-16 8 8 6-12 6 12 8-8-2 16z" fill="#ffc107" stroke="#e0a000" stroke-width="1.5"/><circle cx="94" cy="7" r="2.4" fill="#e53935"/><circle cx="86" cy="8" r="1.8" fill="#1e88e5"/><circle cx="102" cy="8" r="1.8" fill="#43a047"/>' },
    { name: 'chef hat', svg: '<rect x="85" y="4" width="18" height="10" fill="#fff" stroke="#ddd"/><circle cx="87" cy="-1" r="7" fill="#fff" stroke="#ddd"/><circle cx="101" cy="-1" r="7" fill="#fff" stroke="#ddd"/><circle cx="94" cy="-6" r="8" fill="#fff" stroke="#ddd"/>' },
    { name: 'tiny cowboy hat', svg: '<path d="M78 11q16 6 32 0q-2 4-16 5q-14-1-16-5z" fill="#8d6e63"/><path d="M85 11q0-14 9-12q9-2 9 12z" fill="#a1887f"/><rect x="85" y="7" width="18" height="3" fill="#5d4037"/>' },
    { name: 'beanie', svg: '<path d="M82 14q0-16 12-16t12 16z" fill="#1e88e5"/><rect x="81" y="10" width="26" height="5" rx="2" fill="#1565c0"/><circle cx="94" cy="-4" r="4.5" fill="#fff"/>' },
    { name: 'wizard hat', svg: '<path d="M82 13l14-36 10 36z" fill="#5e35b1"/><path d="M78 13h32" stroke="#4527a0" stroke-width="5" stroke-linecap="round"/><circle cx="93" cy="0" r="2" fill="#ffeb3b"/><circle cx="99" cy="-10" r="1.6" fill="#ffeb3b"/><circle cx="90" cy="8" r="1.4" fill="#ffeb3b"/>' },
    { name: 'viking helmet', svg: '<path d="M82 13q0-16 12-16t12 16z" fill="#9e9e9e"/><rect x="81" y="9" width="26" height="5" fill="#795548"/><path d="M82 6q-8-4-6-14q4 8 9 9z M106 6q8-4 6-14q-4 8-9 9z" fill="#fff8e1" stroke="#bcaaa4"/>' },
    { name: 'flower crown', svg: '<path d="M80 12q14-6 28 0" stroke="#43a047" stroke-width="2" fill="none"/><circle cx="84" cy="11" r="3.5" fill="#f06292"/><circle cx="91" cy="9" r="3.5" fill="#ffeb3b"/><circle cx="98" cy="9" r="3.5" fill="#ba68c8"/><circle cx="105" cy="11" r="3.5" fill="#4fc3f7"/><circle cx="91" cy="9" r="1.2" fill="#ff9800"/><circle cx="84" cy="11" r="1.2" fill="#fff"/>' },
    { name: 'propeller cap', svg: '<path d="M82 14q0-14 12-14t12 14z" fill="#e53935"/><path d="M82 14q12-5 24 0" fill="#1e88e5"/><rect x="93" y="-6" width="2" height="7" fill="#555"/><ellipse class="cg-prop" cx="94" cy="-7" rx="11" ry="2.4" fill="#ffeb3b"/>' },
    { name: 'halo', svg: '<ellipse class="cg-halo" cx="94" cy="-4" rx="12" ry="3.5" fill="none" stroke="#ffd54f" stroke-width="3"/>' },
    { name: 'bow', svg: '<path d="M94 10l-10-7v14z M94 10l10-7v14z" fill="#ec407a"/><circle cx="94" cy="10" r="3" fill="#c2185b"/>' },
    { name: 'pair of cool shades', svg: '<rect x="92" y="16" width="11" height="6" rx="2" fill="#111"/><path d="M86 18h7" stroke="#111" stroke-width="2"/><path d="M94 17l3 0" stroke="#fff" stroke-width="1" opacity=".6"/>' }
  ];

  const BREAD_MAX = 3;
  const MODE = { on: false, t: 0, score: 0, max: 0, diff: 1, bread: BREAD_MAX, tick: 0 };
  const DIFFS = [
    { name: 'Calm', e: '🙂', geese: 1, spd: 1, idle: 1 },
    { name: 'Feisty', e: '😤', geese: 2, spd: 1.2, idle: .7 },
    { name: 'Feral', e: '😈', geese: 3, spd: 1.45, idle: .45 }
  ];
  const ACH = {
    cursor: ['🖱️', 'Cursor thief', 'Let a goose steal your cursor'],
    bread10: ['🍞', 'Bread winner', 'Feed 10 pieces of bread'],
    flock: ['🪿', 'Flock', 'Have 5 geese at once'],
    hats: ['🎩', 'Milliner', 'Try every hat'],
    chaos100: ['🌪️', 'Total chaos', 'Reach 100 chaos'],
    defend: ['🛡️', 'Guardian', 'Finish a Defend round'],
    sgrade: ['🏆', 'Goose whisperer', 'Get an S in Defend'],
    feral: ['😈', 'Feral tamer', 'Get an A or better on Feral'],
    pranks: ['📕', 'Full rap sheet', 'Witness every goose crime'],
    popups: ['🪟', 'Pop-up survivor', 'Close 10 goose error messages'],
    total: ['🪿', 'Total Goose', 'Score 70 chaos in one Simple round']
  };
  const PRANKS = {
    steal: ['🗂️', 'Grand theft file'], mug: ['☕', 'Coffee crime'], plant: ['🪴', 'Plant assault'], pencils: ['✏️', 'Pencil spill'],
    mud: ['🟫', 'Mud art'], cursor: ['🖱️', 'Cursor heist'], bite: ['🦷', 'Finger nibble'], type: ['⌨️', 'Ghost typing'],
    rename: ['🏷️', 'Identity fraud'], popup: ['🪟', 'Fake error'], nap: ['💤', 'Napping on duty'], hide: ['🫣', 'Hide and honk']
  };
  let pranksSeen = Curio.store.get('cg:pranks', {});
  if (!pranksSeen || typeof pranksSeen !== 'object' || Array.isArray(pranksSeen)) pranksSeen = {};
  function crime(id) {
    const first = !pranksSeen[id];
    pranksSeen[id] = (pranksSeen[id] || 0) + 1;
    Curio.store.set('cg:pranks', pranksSeen);
    if (first && !SIMPLE) { Curio.toast(`${PRANKS[id][0]} New crime on the rap sheet: ${PRANKS[id][1]}`, 2200); }
    if (Object.keys(PRANKS).every((k) => pranksSeen[k])) award('pranks');
    paintPranks();
  }
  function paintPranks() {
    const el = $('#pranks'); if (!el) return;
    const n = Object.keys(PRANKS).filter((k) => pranksSeen[k]).length;
    el.innerHTML = `<div class="cg-sheet__h">Crimes witnessed <b>${n}/${Object.keys(PRANKS).length}</b></div><div class="cg-sheet__grid">${Object.entries(PRANKS).map(([k, [e, nm]]) => `<span class="${pranksSeen[k] ? 'on' : ''}" title="${pranksSeen[k] ? `${nm}: ${pranksSeen[k]} times` : 'Not witnessed yet'}">${pranksSeen[k] ? e : '?'}</span>`).join('')}</div>`;
  }
  let ach = Curio.store.get('cg:ach', []);
  if (!Array.isArray(ach)) ach = [];
  let hatsSeen = Curio.store.get('cg:hats', []);
  if (!Array.isArray(hatsSeen)) hatsSeen = [];
  function award(id) {
    if (SIMPLE && id !== 'total') return;
    if (ach.includes(id)) return;
    ach.push(id);
    Curio.store.set('cg:ach', ach);
    const a = ACH[id];
    Curio.toast(`${a[0]} Achievement: ${a[1]}`, 2400);
    [784, 988, 1175].forEach((f, k) => setTimeout(() => Curio.beep(f, .1, 'triangle', .07), k * 80));
    paintAch();
  }
  function paintAch() {
    $('#ach').innerHTML = Object.entries(ACH).map(([id, [e, n, d]]) => `<span class="${ach.includes(id) ? 'on' : ''}" title="${n}: ${d}">${e}</span>`).join('');
  }
  const S = { honks: 0, stolen: 0, knocked: 0, bread: 0, shoos: 0, cursor: 0, chaos: 0 };
  const life = Curio.store.get('cg:life', { honks: 0, chaos: 0 });
  const tm = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  function log(text, you = false) {
    const li = document.createElement('li');
    if (you) li.className = 'you';
    li.innerHTML = '<time></time><span></span>';
    li.firstChild.textContent = tm(); li.lastChild.textContent = text;
    logEl.prepend(li);
    while (logEl.children.length > 60) logEl.lastChild.remove();
  }
  function chaos(n) {
    S.chaos += n;
    $('#chaos').textContent = S.chaos;
    const c = $('.cg-chaos'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
    if (S.chaos >= 100) award('chaos100');
    const r = Curio.best('chaos', S.chaos);
    if (r.isNew && S.chaos >= 50 && S.chaos - n < 50) Curio.toast('🪿 New personal chaos record!');
    paintStats();
  }
  function paintStats() {
    $('#stats').textContent = `📯 ${S.honks} honks · 🗂️ ${S.stolen} stolen · 💥 ${S.knocked} knocked · 🍞 ${S.bread} bread · 👋 ${S.shoos} shoos · best chaos ${Curio.getBest('chaos') || 0}`;
  }

  function honkSound(p = 1, loud = 1) {
    if (Curio.muted) return;
    const ac = Curio.audioContext && Curio.audioContext();
    if (!ac) return;
    const t = ac.currentTime;
    const out = ac.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.22 * loud, t + 0.03);
    out.gain.setValueAtTime(0.2 * loud, t + 0.16);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1150; bp.Q.value = 1.6;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    bp.connect(lp).connect(out).connect(ac.destination);
    [[1, 'sawtooth'], [1.013, 'square'], [2.01, 'sawtooth']].forEach(([m, type]) => {
      const o = ac.createOscillator(); o.type = type;
      const f = 360 * p * m;
      o.frequency.setValueAtTime(f * .92, t);
      o.frequency.linearRampToValueAtTime(f, t + .05);
      o.frequency.linearRampToValueAtTime(f * .8, t + .32);
      const g = ac.createGain(); g.gain.value = m > 2 ? .35 : 1;
      o.connect(g).connect(bp);
      o.start(t); o.stop(t + .36);
    });
  }
  const HONKS = ['HONK', 'HONK!', 'HONK HONK', 'HONNK', 'HJONK', 'honk?'];
  function honk(loud = 1, word) {
    G.honkT = .32;
    S.honks++; life.honks++;
    honkSound(Curio.rand(.9, 1.12), loud);
    const [bx, by] = beak();
    const b = document.createElement('div');
    b.className = 'cg-bubble'; b.textContent = word || Curio.pick(HONKS);
    desk.append(b);
    const w = b.offsetWidth;
    b.style.left = Math.max(4, Math.min(DW - w - 4, bx - w / 2 + G.face * 20)) + 'px';
    b.style.top = Math.max(4, by - 56) + 'px';
    setTimeout(() => b.remove(), 800);
    chaos(1);
  }

  function beak() {
    const k = G.W / 120;
    const left = G.x - (G.face > 0 ? 54 : 66) * k, top = G.y - 137 * k;
    const lean = G.peckT > 0 ? 18 : 0;
    return [left + (G.face > 0 ? 116 : 4) * k, top + (45 + lean) * k];
  }

  let pointer = { x: -999, y: -999, inside: false, mouse: false, t: 0 };
  let fakeCursor = null, cursorStolen = false;

  const breads = [];
  const breadSVG = '<svg viewBox="0 0 34 30" width="34" height="30"><path d="M4 12C2 4 10 2 17 2s15 2 13 10v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="#e0a456" stroke="#a86c28" stroke-width="2"/><path d="M8 13c0-4 4-6 9-6s9 2 9 6v11H8z" fill="#fbe3b5"/></svg>';

  const rnd = (a, b) => Curio.rand(a, b);
  const clampX = (x) => Math.max(G.W * .5, Math.min(DW - G.W * .5, x));
  const clampY = (y) => Math.max(G.W * 1.1, Math.min(DH - FLOOR - 4, y));
  const randSpot = () => [rnd(G.W * .6, DW - G.W * .6), rnd(G.W * 1.2, DH - FLOOR - 8)];

  const LINES = {
    steal: ['Stole "%". Does not know what it is. Does not care.', 'Yoinked "%". Very fast. Very rude.', 'Confiscated "%" pending a full honk-vestigation.', 'Collected "%" for its museum of your things.', 'Took "%" and ran. Honk.', 'Relocated "%" for tax reasons.', 'Borrowed "%" forever.', 'Grabbed "%". It is his now. That is the law.', 'Picked up "%" with its beak. Your files have bite marks now.'],
    drop: ['Dropped "%" somewhere worse.', 'Hid "%". You will never find it. (It is right there.)', 'Abandoned "%" in the middle of nowhere.', 'Left "%" where it does not belong. Satisfied.'],
    mug: ['Knocked over your coffee. Maintained eye contact the whole time.', 'Pushed your coffee off. Watched it fall. No regrets.', 'Spilled your coffee. Now you are awake.'],
    plant: ['Shoved the plant over. It was in the way of nothing.', 'Knocked over the plant. The plant had it coming.', 'Toppled the plant. Called it gardening.'],
    pencils: ['Knocked over the pencil cup. Pencils everywhere. Art.', 'Tipped the pencils out. Ate none of them. Considered it.', 'Pushed the pencil cup off. Honked at the noise it made.'],
    honk: ['HONKED. At nothing. With feeling.', 'Honked at the clock. The clock did not honk back.', 'Practised its honk. It is perfect already.', 'Honked in a minor key. Ominous.', 'Honked at the rubber duck. Romantically.', 'Honked at a pixel.', 'Let out a honk that echoed through your RAM.', 'Honked at your todo list. It is his todo list now.'],
    mud: ['Took a mud bath. Now tracking it across your desktop.', 'Stomped through the mud puddle. Fresh footprints incoming.', 'Splashed in the mud. Your wallpaper is ruined. He is thrilled.'],
    cursor: ['STOLE YOUR CURSOR. Go get it.', 'Grabbed your mouse pointer with its beak. Good luck clicking things.', 'Took your cursor and ran off with it. Classic.'],
    bite: ['Bit you. Gently. Mostly.', 'Caught you. Honked directly into your soul.', 'Nibbled your finger. You deserved it, apparently.'],
    chase: ['Is now chasing you. You did this.', 'Has had ENOUGH. Coming for you.', 'Wings out. Neck out. Coming for you.'],
    shoo: ['Got shooed. Plotting revenge.', 'Was shooed. Felt nothing. Will return.', 'Fled. Will remember this.', 'Flapped away. Honked over its shoulder.'],
    bread: ['Ate bread. Forgave you. For now.', 'Accepted your bread offering. Peace, briefly.', 'Devoured the bread. Looked at you for more.', 'Ate bread. Do not feed the goose, says the note. The goose ate the note too. (It did not.)'],
    type: ['Typed "%" into your to-do list. It is now legally binding.', 'Added "%" to your to-do list. Tapped every key with its beak. Twice.', 'Edited your to-do list: "%". Signed it HONK.'],
    rename: ['Renamed "%" to "#". You will never find it again.', 'Changed "%" to "#". Called it a rebrand.', 'Renamed "%" to "#" for legal reasons.'],
    popup: ['Opened a "%" pop-up. Nobody asked.', 'Invented a "%" message. It has buttons. They do nothing.', 'Summoned a "%" window from absolutely nowhere.'],
    nap: ['Fell asleep on your desktop. Snores in HONK.', 'Took a power nap. Dreaming of bread and crime.', 'Napped for exactly three seconds. Woke up angrier.'],
    hide: ['Hid behind your to-do list. Thinks you cannot see it. You can see it.', 'Went into hiding. The beak is sticking out.', 'Is hiding. Will jump out. Has no plan beyond that.'],
    wander: ['Waddled around with purpose. The purpose is unknown.', 'Paced back and forth like a tiny feathered CEO.', 'Looked directly at you. Then away. Then back.', 'Sat down for one second. Got back up. Too much to do.', 'Inspected your desktop icons. Unimpressed.', 'Stared at the window for a while. Judging.']
  };
  const line = (k, n) => Curio.pick(LINES[k]).replace('%', n || '');

  function setTask(list) { G.task = list; }
  function chooseTask() {
    const free = ITEMS.filter((i) => i.kind === 'steal' && !geese.some((g) => g.held === i) && !i.drag);
    const knock = ITEMS.filter((i) => i.kind === 'knock' && !i.knocked && !i.drag);
    const named = ITEMS.filter((i) => i.icon && !i.renamed && !geese.some((g) => g.held === i) && !i.drag);
    const opts = [['wander', 2.6], ['honk', 1.4], ['steal', 4], ['knock', knock.length ? 2.2 : 0], ['mud', G.muddy > 0 ? .3 : 1.1], ['cursor', pointer.mouse && pointer.inside && !cursorStolen && Date.now() - pointer.t < 4000 ? 1 : 0],
      ['type', typed < 4 ? 1 : 0], ['rename', named.length ? 1 : 0], ['popup', desk.querySelectorAll('.cg-pop').length < 2 ? .9 : 0], ['nap', .45], ['hide', .4]];
    let r = Math.random() * opts.reduce((a, o) => a + o[1], 0);
    let pick = 'wander';
    for (const [k, w] of opts) { if ((r -= w) < 0) { pick = k; break; } }
    if (pick === 'wander') {
      const p = randSpot();
      setTask([{ t: 'walk', to: () => p, sp: 85 }, { t: 'wait', d: rnd(.4, 1.4) }, ...(Math.random() < .2 ? [{ t: 'do', f: () => log(line('wander')) }] : [])]);
    } else if (pick === 'honk') {
      setTask([{ t: 'do', f: () => { honk(); if (Math.random() < .35) log(line('honk')); } }, { t: 'wait', d: .5 }, ...(Math.random() < .5 ? [{ t: 'do', f: () => honk() }, { t: 'wait', d: .5 }] : [])]);
    } else if (pick === 'steal' && free.length) {
      const it = Curio.pick(free);
      const dest = Math.random() < .5 ? [Math.random() < .5 ? G.W * .6 : DW - G.W * .6, rnd(G.W * 1.2, DH - FLOOR - 10)] : randSpot();
      setTask([
        { t: 'walk', to: () => [it.x, it.y + 22], sp: 115, item: it },
        { t: 'peck', d: .35 },
        { t: 'do', f: () => { if (it.drag) return setTask([]); grab(it); log(line('steal', it.label)); S.stolen++; chaos(3); honk(.6, 'honk!'); crime('steal'); } },
        { t: 'walk', to: () => dest, sp: 140 },
        { t: 'do', f: () => { if (G.held === it) { drop(); if (Math.random() < .5) log(line('drop', it.label)); } } },
        { t: 'wait', d: .6 }
      ]);
    } else if (pick === 'knock' && knock.length) {
      const it = Curio.pick(knock);
      const side = G.x < it.x ? -1 : 1;
      setTask([
        { t: 'walk', to: () => [it.x + side * G.W * .45, it.y + 26], sp: 85 },
        { t: 'face', dir: -side },
        { t: 'wait', d: .5 },
        { t: 'peck', d: .3 },
        { t: 'do', f: () => { if (it.drag) return; knockOver(it); honk(1, 'HONK'); log(line(it.id)); S.knocked++; chaos(4); crime(it.id); } },
        { t: 'wait', d: .9 }
      ]);
    } else if (pick === 'mud') {
      setTask([{ t: 'walk', to: puddleXY, sp: 90 }, { t: 'stomp', d: 1.2 }, { t: 'do', f: () => { G.muddy = 60; log(line('mud')); chaos(2); crime('mud'); } }, { t: 'walk', to: () => randSpot(), sp: 80 }]);
    } else if (pick === 'cursor') {
      startChase(false);
    } else if (pick === 'type') {
      const w = desk.querySelector('.cg-window');
      const at = () => [w.offsetLeft + w.offsetWidth * rnd(.3, .7), Math.min(DH - FLOOR - 8, w.offsetTop + w.offsetHeight + G.W * .55)];
      const spot = at();
      setTask([{ t: 'walk', to: () => spot, sp: 100 }, { t: 'peck', d: .2 }, { t: 'wait', d: .1 }, { t: 'peck', d: .2 }, { t: 'wait', d: .1 }, { t: 'peck', d: .2 }, { t: 'do', f: () => typeTodo() }, { t: 'wait', d: .5 }]);
    } else if (pick === 'rename' && named.length) {
      const it = Curio.pick(named);
      setTask([{ t: 'walk', to: () => [it.x, it.y + 22], sp: 105 }, { t: 'peck', d: .3 }, { t: 'peck', d: .3 }, { t: 'do', f: () => renameIt(it) }, { t: 'wait', d: .6 }]);
    } else if (pick === 'popup') {
      setTask([{ t: 'face', dir: Math.random() < .5 ? 1 : -1 }, { t: 'do', f: () => { honk(1, 'HONK.EXE'); popup(); } }, { t: 'wait', d: .8 }]);
    } else if (pick === 'nap') {
      const p = randSpot();
      setTask([{ t: 'walk', to: () => p, sp: 70 }, { t: 'do', f: () => { G.napping = true; bubble('Zzz', 'zz'); log(line('nap')); chaos(1); crime('nap'); } }, { t: 'wait', d: 2.6 }, { t: 'do', f: () => { G.napping = false; honk(1.1, 'HONK!'); } }]);
    } else if (pick === 'hide') {
      const w = desk.querySelector('.cg-window');
      const spot = [Math.min(DW - G.W * .6, w.offsetLeft + w.offsetWidth * .5), Math.min(DH - FLOOR - 8, w.offsetTop + w.offsetHeight * .7)];
      setTask([{ t: 'walk', to: () => spot, sp: 120 }, { t: 'do', f: () => { G.hiding = true; log(line('hide')); chaos(2); crime('hide'); } }, { t: 'wait', d: 2.4 }, { t: 'do', f: () => { G.hiding = false; honk(1.3, 'BOO. HONK.'); } }, { t: 'walk', to: () => randSpot(), sp: 140 }]);
    } else {
      const p = randSpot();
      setTask([{ t: 'walk', to: () => p, sp: 70 }]);
    }
  }
  function startChase(angry) {
    if (angry) log(line('chase'));
    G.brow.setAttribute('opacity', 1);
    setTask([{ t: 'do', f: () => honk(1.2, 'HONK!!') }, { t: 'chase', d: angry ? 7 : 5 }, { t: 'do', f: () => G.brow.setAttribute('opacity', G.annoy > 2 ? 1 : 0) }]);
  }
  function caught() {
    G.annoy = 1;
    G.brow.setAttribute('opacity', 0);
    if (pointer.mouse && !cursorStolen) {
      cursorStolen = true;
      desk.classList.add('nocursor');
      fakeCursor = document.createElement('div');
      fakeCursor.className = 'cg-fakecursor';
      fakeCursor.innerHTML = '<svg viewBox="0 0 22 30" width="22" height="30"><path d="M2 2v22l6-6 4 10 4-2-4-9h8z" fill="#fff" stroke="#000" stroke-width="2" stroke-linejoin="round"/></svg>';
      desk.append(fakeCursor);
      G.held = 'cursor';
      S.cursor++; chaos(10); log(line('cursor')); award('cursor');
      honk(1.2, 'HONK >:)');
      const dest = [pointer.x < DW / 2 ? DW - G.W * .7 : G.W * .7, rnd(G.W * 1.3, DH - FLOOR - 10)];
      setTask([{ t: 'walk', to: () => dest, sp: 150 }, { t: 'do', f: () => drop() }, { t: 'do', f: () => honk() }, { t: 'wait', d: 1 }]);
      crime('cursor');
    } else {
      desk.classList.remove('shake'); void desk.offsetWidth; desk.classList.add('shake');
      honk(1.3, 'HONK!!!');
      log(line('bite')); chaos(5); crime('bite');
      if (navigator.vibrate) try { navigator.vibrate(60); } catch {}
      setTask([{ t: 'wait', d: .6 }, { t: 'walk', to: () => randSpot(), sp: 110 }]);
    }
  }

  let typed = 0, popsClosed = Curio.store.get('cg:pops', 0) | 0;
  const TODO = [['honk', 'buy goose a hat', 'steal bread'], ['HONK HONK HONK', 'give goose the car keys', 'cancel all meetings (goose)'], ['bread', 'become CEO (goose)', 'sell the house, buy bread'], ['apologise to goose', 'h o n k', 'why is the goose typing']];
  const todoBase = desk.querySelector('.cg-window__body').innerHTML;
  function typeTodo() {
    const body = desk.querySelector('.cg-window__body');
    const t = Curio.pick(TODO[Math.min(TODO.length - 1, typed)]);
    typed++;
    const ln = document.createElement('span'); ln.className = 'cg-typed'; ln.textContent = `${5 + typed}. ${t}`;
    body.append(document.createElement('br'), ln);
    honk(.7, 'tap tap honk');
    log(line('type', t));
    chaos(3); crime('type');
  }
  const RENAMES = { docs: 'Honkuments', bin: 'Bread Bin', homework: 'homework_HONK.txt', taxes: 'taxes_goose_owes_nothing.xls', cat: 'goose.jpg', secret: 'OPENED (by goose)' };
  function renameIt(it) {
    if (it.drag || geese.some((g) => g.held === it)) return;
    it.renamed = true;
    const span = it.el.querySelector('span');
    span.textContent = RENAMES[it.id] || 'honk';
    it.el.classList.add('renamed');
    honk(.8, 'honk :)');
    log(line('rename', it.label).replace('#', RENAMES[it.id] || 'honk'));
    chaos(3); crime('rename');
  }
  const POPS = [
    ['goose.exe', 'Are you sure you want to HONK?', ['Honk', 'Also honk']],
    ['System', 'Your files have been honked. Send 3 bread to unhonk them.', ['Pay in bread', 'Never']],
    ['Error 404', 'Peace and quiet not found.', ['OK', 'OK but louder']],
    ['Update', 'A goose is installing updates. Do not turn off your goose.', ['Fine']],
    ['Warning', 'Low disk space. The goose is sitting on it.', ['Move goose', 'Respect goose']],
    ['goose.exe', 'goose.exe has stopped responding. It is just staring now.', ['Wait', 'Stare back']],
    ['Antivirus', '1 threat detected: GOOSE. Quarantine failed. The goose ate the quarantine.', ['Panic', 'Accept fate']],
    ['Calendar', 'Reminder: HONK in 5 minutes. HONK in 4 minutes. HONK.', ['Snooze', 'HONK']],
    ['Printer', 'Printer is out of paper. Goose is out of patience.', ['Retry']],
    ['Mail', 'You have 1 new message from: goose. Subject: honk. Attachment: honk.zip', ['Open', 'Delete (it will come back)']]
  ];
  function popup() {
    const [title, text, btns] = Curio.pick(POPS);
    const el = document.createElement('div');
    el.className = 'cg-pop'; el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-label', title);
    el.innerHTML = `<div class="cg-pop__bar"><span></span><button type="button" aria-label="Close">×</button></div><div class="cg-pop__body"><i>🪿</i><p></p></div><div class="cg-pop__btns">${btns.map(() => '<button type="button"></button>').join('')}</div>`;
    el.querySelector('.cg-pop__bar span').textContent = title;
    el.querySelector('p').textContent = text;
    el.querySelectorAll('.cg-pop__btns button').forEach((b, i) => { b.textContent = btns[i]; });
    desk.append(el);
    const w = el.offsetWidth, h = el.offsetHeight;
    el.style.left = rnd(8, Math.max(9, DW - w - 8)) + 'px';
    el.style.top = rnd(8, Math.max(9, DH - FLOOR - h - 8)) + 'px';
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', (e) => {
      if (!e.target.closest('button')) return;
      el.classList.add('bye'); setTimeout(() => el.remove(), 200);
      popsClosed++; Curio.store.set('cg:pops', popsClosed);
      if (popsClosed >= 10) award('popups');
      Curio.beep(Curio.pick([440, 523, 392]), .06, 'square', .05);
      if (Math.random() < .3) log(Curio.pick(['You closed the pop-up. The goose opens a mental note.', 'You clicked a button. The goose wrote it down.', 'Pop-up dismissed. The goose is drafting a new one.']), true);
    });
    log(line('popup', title));
    chaos(4); crime('popup');
    Curio.beep(330, .12, 'square', .06);
  }
  function bubble(text, cls) {
    const [bx, by] = beak();
    const b = document.createElement('div');
    b.className = 'cg-bubble' + (cls ? ' ' + cls : ''); b.textContent = text;
    desk.append(b);
    b.style.left = Math.max(4, Math.min(DW - b.offsetWidth - 4, bx - b.offsetWidth / 2)) + 'px';
    b.style.top = Math.max(4, by - 56) + 'px';
    setTimeout(() => b.remove(), 1600);
  }

  function grab(it) { G.held = it; it.el.classList.add('held'); it.moved = true; }
  function drop() {
    const h = G.held;
    G.held = null;
    if (h === 'cursor') { if (fakeCursor) { const [bx, by] = beak(); fakeCursor.style.transform = `translate(${bx - 4}px, ${by}px)`; fakeCursor._x = bx; fakeCursor._y = by + 10; } return; }
    if (h) { h.el.classList.remove('held'); h.y = Math.min(DH - FLOOR - h.el.offsetHeight / 2, h.y + 14); h.rot = Curio.rand(-18, 18); placeItem(h); }
  }
  function knockOver(it) { it.knocked = true; it.moved = true; placeItem(it); Curio.beep(110, .25, 'triangle', .12); setTimeout(() => Curio.beep(80, .2, 'sine', .1), 120); }

  function walkTo(tx, ty, sp, dt) {
    tx = clampX(tx); ty = clampY(ty);
    const dx = tx - G.x, dy = ty - G.y, d = Math.hypot(dx, dy);
    if (d < 4) { G.speed = 0; return true; }
    const s = Math.min(d, sp * (G.spd || 1) * dt);
    G.x += dx / d * s; G.y += dy / d * s; G.speed = sp;
    if (Math.abs(dx) > 3) G.face = dx > 0 ? 1 : -1;
    G.distAcc += s;
    if (G.distAcc > 22) { G.distAcc = 0; footprint(Math.atan2(dy, dx)); }
    return false;
  }
  function footprint(ang) {
    const [px, py] = puddleXY();
    if (Math.abs(G.x - px) < puddle.offsetWidth / 2 && Math.abs(G.y - py) < 24) G.muddy = 60;
    if (G.muddy <= 0) return;
    G.muddy--; G.step ^= 1;
    const side = G.step ? 1 : -1;
    const ox = Math.cos(ang + Math.PI / 2) * 6 * side, oy = Math.sin(ang + Math.PI / 2) * 6 * side;
    pctx.save();
    pctx.translate(G.x + ox, G.y + oy);
    pctx.rotate(ang);
    pctx.globalAlpha = Math.min(.6, .15 + G.muddy / 80);
    pctx.fillStyle = '#5d4026';
    pctx.beginPath();
    pctx.moveTo(-5, 0); pctx.lineTo(7, -6); pctx.quadraticCurveTo(9, 0, 7, 6); pctx.closePath();
    pctx.fill();
    pctx.strokeStyle = '#4a321d'; pctx.lineWidth = 1.6; pctx.lineCap = 'round';
    pctx.beginPath(); pctx.moveTo(-5, 0); pctx.lineTo(8, -6.5); pctx.moveTo(-5, 0); pctx.lineTo(9, 0); pctx.moveTo(-5, 0); pctx.lineTo(8, 6.5); pctx.stroke();
    pctx.restore();
  }

  function shoo(px, py) {
    S.shoos++;
    G.annoy += 1;
    G.flapT = .8;
    if (G.held) drop();
    honk(1.1, Curio.pick(['HONK!', 'HISSS', 'HONK?!']));
    const dx = G.x - px, dy = G.y - py, d = Math.hypot(dx, dy) || 1;
    const dest = [G.x + dx / d * 190 + rnd(-30, 30), G.y + dy / d * 120 + rnd(-30, 30)];
    if (G.annoy >= 2.8) { G.annoy = 3; setTask([{ t: 'walk', to: () => dest, sp: 260 }]); setTimeout(() => startChase(true), 400); }
    else { setTask([{ t: 'walk', to: () => dest, sp: 260 }, { t: 'wait', d: 1 }]); if (Math.random() < .6) log(line('shoo')); }
    paintStats();
  }

  let breadMode = false;
  const breadBtn = $('#bread');
  breadBtn.addEventListener('click', () => {
    breadMode = !breadMode;
    breadBtn.setAttribute('aria-pressed', breadMode);
    desk.classList.toggle('bread-mode', breadMode);
    if (breadMode) Curio.toast('🍞 Tap anywhere on the desktop to throw bread');
  });
  function throwBread(x, y) {
    const b = document.createElement('div');
    b.className = 'cg-bread'; b.innerHTML = breadSVG;
    b.style.left = x + 'px'; b.style.top = y + 'px';
    desk.append(b);
    const br = { x, y, el: b, bites: 0 };
    breads.push(br);
    Curio.beep(500, .05, 'sine', .06);
    const keep = G;
    geese.forEach((g) => { G = g; goForBread(); });
    G = keep;
  }
  function goForBread() {
    if (!breads.length) return;
    let near = breads[0];
    breads.forEach((b) => { if (Math.hypot(b.x - G.x, b.y - G.y) < Math.hypot(near.x - G.x, near.y - G.y)) near = b; });
    const side = G.x < near.x ? -1 : 1;
    if (G.held) drop();
    G.brow.setAttribute('opacity', 0);
    setTask([
      { t: 'walk', to: () => [near.x + side * G.W * .5, near.y + 18], sp: 190 },
      { t: 'face', dir: -side },
      { t: 'peck', d: .3 }, { t: 'do', f: () => nibble(near) }, { t: 'wait', d: .15 },
      { t: 'peck', d: .3 }, { t: 'do', f: () => nibble(near) }, { t: 'wait', d: .15 },
      { t: 'peck', d: .3 }, { t: 'do', f: () => eat(near) },
      { t: 'wait', d: .6 }
    ]);
  }
  function nibble(b) { if (!breads.includes(b)) return; b.bites++; b.el.style.scale = 1 - b.bites * .25; Curio.beep(900, .03, 'square', .04); }
  function eat(b) {
    const i = breads.indexOf(b); if (i < 0) return; breads.splice(i, 1);
    b.el.remove();
    G.annoy = 0; S.bread++; life.bread = (life.bread || 0) + 1; if (life.bread >= 10) award('bread10');
    log(line('bread'));
    for (let k = 0; k < 3; k++) setTimeout(() => {
      const h = document.createElement('div'); h.className = 'cg-heart'; h.textContent = '♥'; h.style.color = '#e91e63';
      h.style.left = (G.x + rnd(-20, 20)) + 'px'; h.style.top = (G.y - G.W * 1.1) + 'px'; desk.append(h); setTimeout(() => h.remove(), 1200);
    }, k * 180);
    [660, 880].forEach((f, k) => setTimeout(() => Curio.beep(f, .08, 'triangle', .08), k * 90));
    paintStats();
    if (breads.length) setTimeout(goForBread, 300);
  }

  $('#hat').addEventListener('click', () => {
    G = geese[0];
    const h = (G.hat + 1) % HATS.length;
    geese.forEach((g, k) => { g.hat = k === 0 ? h : (h + k * 3) % HATS.length; g.hatG.innerHTML = HATS[g.hat].svg; });
    Curio.store.set('cg:hat', G.hat);
    if (!hatsSeen.includes(h)) { hatsSeen.push(h); Curio.store.set('cg:hats', hatsSeen); if (hatsSeen.length >= HATS.length - 1) award('hats'); }
    if (G.hat) { honk(.9, 'honk :)'); log(`Put on a ${HATS[G.hat].name}. Looks incredible. Knows it.`); }
    else log('Took off the hat. Back to business. The business is crime.');
  });
  $('#honk').addEventListener('click', () => {
    G = Curio.pick(geese);
    honkSound(.7, .8);
    log('You honked at the goose.', true);
    setTimeout(() => {
      if (Math.random() < .5) { honk(1.2, 'HONK!!'); log('Honked back louder. Won the argument.'); }
      else { G.annoy += 1; startChase(true); }
    }, 500);
  });
  $('#tidy').addEventListener('click', () => {
    geese.forEach((g) => { G = g; if (G.held && G.held !== 'cursor') drop(); });
    ITEMS.forEach((it) => { [it.x, it.y] = homeXY(it); it.knocked = false; it.moved = false; it.rot = it.note ? Curio.rand(-6, 6) : 0; if (it.renamed) { it.renamed = false; it.el.querySelector('span').textContent = it.label; it.el.classList.remove('renamed'); } placeItem(it); });
    pctx.clearRect(0, 0, DW, DH);
    desk.querySelectorAll('.cg-pop').forEach((p) => p.remove());
    desk.querySelector('.cg-window__body').innerHTML = todoBase; typed = 0;
    log('You tidied everything up. The goose saw. The goose remembers.', true);
    setTimeout(() => honk(1, 'HONK.'), 700);
  });

  let dragIt = null;
  desk.addEventListener('pointermove', (e) => {
    const r = desk.getBoundingClientRect();
    pointer = { x: e.clientX - r.left, y: e.clientY - r.top, inside: true, mouse: e.pointerType === 'mouse', t: Date.now() };
    if (cursorStolen && fakeCursor && !geese.some((g) => g.held === 'cursor') && Math.hypot(pointer.x - fakeCursor._x, pointer.y - fakeCursor._y) < 26) {
      cursorStolen = false; fakeCursor.remove(); fakeCursor = null; desk.classList.remove('nocursor');
      log('You got your cursor back. The goose is disappointed.', true);
      Curio.beep(700, .06, 'triangle', .08);
    }
  });
  desk.addEventListener('pointerleave', () => { pointer.inside = false; });
  desk.addEventListener('pointerdown', (e) => {
    const r = desk.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    pointer = { x, y, inside: true, mouse: e.pointerType === 'mouse', t: Date.now() };
    const gEl = e.target.closest('.cg-goose');
    if (gEl) { e.preventDefault(); G = geese.find((g) => g.el === gEl) || G; shoo(x, y); return; }
    if (breadMode) {
      e.preventDefault();
      if (MODE.on) { if (MODE.bread <= 0) { Curio.toast('Out of bread! Shoo them by hand.'); return; } MODE.bread--; paintHud(); }
      throwBread(x, Math.min(y, DH - FLOOR - 16));
      return;
    }
  });
  const deskXY = (p) => { const r = desk.getBoundingClientRect(); return [p.clientX - r.left, p.clientY - r.top]; };
  ITEMS.forEach((it) => Curio.drag(it.el, {
    start: (p) => {
      if (breadMode) return;
      p.event?.preventDefault?.();
      const [x, y] = deskXY(p);
      if (it.knocked) { it.knocked = false; placeItem(it); log(`You set ${it.label} back up.`, true); return; }
      const holder = geese.find((g) => g.held === it);
      if (holder) { G = holder; drop(); G.annoy += 1; honk(1.2, 'HONK!!'); log(`You yanked ${it.label} out of its beak. Bold.`, true); if (G.annoy >= 3) startChase(true); else setTask([{ t: 'wait', d: .6 }]); }
      dragIt = { it, ox: x - it.x, oy: y - it.y };
      it.drag = true; it.el.classList.add('drag');
    },
    move: (p) => {
      if (!dragIt || dragIt.it !== it) return;
      const [x, y] = deskXY(p);
      it.x = Math.max(20, Math.min(DW - 20, x - dragIt.ox));
      it.y = Math.max(20, Math.min(DH - FLOOR - 10, y - dragIt.oy));
      placeItem(it);
    },
    end: () => {
      if (!dragIt || dragIt.it !== it) return;
      it.drag = false; it.el.classList.remove('drag'); dragIt = null;
      const [hx, hy] = homeXY(it);
      if (Math.hypot(it.x - hx, it.y - hy) < 50) { it.x = hx; it.y = hy; it.moved = false; it.rot = it.note ? Curio.rand(-6, 6) : 0; placeItem(it); Curio.beep(820, .05, 'triangle', .06); }
    }
  }));
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || document.querySelector('.curio-modal')) return;
    const k = e.key.toLowerCase();
    const map = SIMPLE ? { b: '#bread', h: '#hat', o: '#honk' } : { b: '#bread', h: '#hat', o: '#honk', t: '#tidy', '+': '#addGoose', '=': '#addGoose', '-': '#remGoose', w: '#wallBtn', d: '#defend' };
    if (map[k]) { e.preventDefault(); $(map[k]).click(); }
    if (k === 'r') {
      e.preventDefault();
      if (performance.now() < (window.__cgR || 0)) return;
      window.__cgR = performance.now() + 1200;
      const it = ITEMS.find((i) => (i.moved || i.knocked) && !i.drag && !geese.some((g) => g.held === i));
      if (!it) { Curio.toast('Everything is already home.'); return; }
      [it.x, it.y] = homeXY(it); it.knocked = false; it.moved = false; it.rot = it.note ? Curio.rand(-6, 6) : 0; placeItem(it);
      Curio.beep(820, .05, 'triangle', .06);
      log(`You put ${it.label} back.`, true);
    }
    if (k === 's') { e.preventDefault(); G = geese.reduce((a, g) => (Math.hypot(g.x - pointer.x, g.y - pointer.y) < Math.hypot(a.x - pointer.x, a.y - pointer.y) ? g : a), geese[0]); shoo(G.x - G.face * 40, G.y); }
  });
  if (!Curio.store.get('cg:tptip', false)) { Curio.store.set('cg:tptip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar. Click an item to pick it up, click again to drop it.', 5000), 2500); }

  function render() {
    const k = G.W / 120;
    const left = G.x - (G.face > 0 ? 54 : 66) * k, top = G.y - 137 * k;
    G.el.style.width = G.W + 'px'; G.el.style.height = (G.W * 140 / 120) + 'px';
    G.el.style.transform = `translate(${left}px, ${top}px)`;
    G.el.style.zIndex = 50 + Math.round(G.y / 10);
    G.el.classList.toggle('flip', G.face < 0);
    const walking = G.speed > 0;
    const sw = walking ? Math.sin(G.walkPhase) * (G.speed > 150 ? 32 : 22) : 0;
    G.legL.setAttribute('transform', `rotate(${sw} 46 92)`);
    G.legR.setAttribute('transform', `rotate(${-sw} 62 92)`);
    const bob = walking ? Math.abs(Math.sin(G.walkPhase)) * -3 : Math.sin(G.walkPhase * .25) * .8;
    const tilt = walking ? Math.sin(G.walkPhase) * 3 : 0;
    G.body.setAttribute('transform', `translate(0 ${bob}) rotate(${tilt} 52 90)`);
    let na = 0;
    if (G.peckT > 0) na = 34;
    else if (G.honkT > 0) na = -10;
    else if (G.speed > 150) na = 26;
    G.neck.setAttribute('transform', `rotate(${na} 76 70)`);
    G.jaw.setAttribute('transform', `rotate(${G.honkT > 0 ? 24 : 0} 104 28)`);
    const flap = G.flapT > 0 ? Math.sin(G.flapT * 40) * 30 - 20 : 0;
    G.wing.setAttribute('transform', `rotate(${flap} 30 70)`);
    G.el.classList.toggle('angry', G.annoy >= 2.5);
    G.el.classList.toggle('napping', !!G.napping);
    G.el.classList.toggle('hiding', !!G.hiding);
    if (G.napping && Math.random() < .02) bubble('z', 'zz');
    if (G.held && G.held !== 'cursor') {
      const [bx, by] = beak();
      const it = G.held;
      it.x = bx + G.face * 4; it.y = by + it.el.offsetHeight / 2 - 6;
      it.rot = G.face * 12 + Math.sin(G.walkPhase) * 6;
      placeItem(it);
    } else if (G.held === 'cursor' && fakeCursor) {
      const [bx, by] = beak();
      fakeCursor.style.transform = `translate(${bx - 4}px, ${by - 4}px) rotate(${G.face * 20}deg)`;
    }
  }

  function step(dt) {
    G.honkT -= dt; G.peckT -= dt; G.flapT -= dt;
    G.annoy = Math.max(0, G.annoy - dt * .04);
    G.speed = 0;
    if (!G.task.length) {
      G.idle -= dt;
      if (G.idle <= 0) { G.idle = rnd(.3, 1.6) * (MODE.on ? DIFFS[MODE.diff].idle : SIMPLE ? .6 : 1); if (breads.length) goForBread(); else chooseTask(); }
    }
    const a = G.task[0];
    if (a) {
      if (a.t === 'walk') {
        const [tx, ty] = a.to();
        if (walkTo(tx, ty, a.sp, dt)) G.task.shift();
        a.time = (a.time || 0) + dt;
        if (a.time > 12) G.task.shift();
      } else if (a.t === 'wait') {
        a.d -= dt; if (a.d <= 0) G.task.shift();
      } else if (a.t === 'peck') {
        if (a.start == null) { a.start = 1; G.peckT = a.d; }
        a.d -= dt; if (a.d <= 0) G.task.shift();
      } else if (a.t === 'stomp') {
        G.speed = 60; G.walkPhase += dt * 16;
        if (Math.random() < dt * 4) { const [px, py] = puddleXY(); G.x = clampX(px + rnd(-20, 20)); G.y = clampY(py + rnd(-6, 6)); G.muddy = 60; footprint(rnd(-3, 3)); Curio.beep(120, .05, 'sine', .05); }
        a.d -= dt; if (a.d <= 0) G.task.shift();
      } else if (a.t === 'face') {
        G.face = a.dir; G.task.shift();
      } else if (a.t === 'do') {
        G.task.shift(); a.f();
      } else if (a.t === 'chase') {
        a.d -= dt;
        let [bx, by] = beak();
        const tx = pointer.inside ? pointer.x - (bx - G.x) : G.x, ty = pointer.inside ? pointer.y - (by - G.y) : G.y;
        walkTo(tx, ty, 175, dt);
        [bx, by] = beak();
        if (pointer.inside && Math.hypot(bx - pointer.x, by - pointer.y) < 34) { G.task = []; caught(); }
        else if (a.d <= 0) { G.task.shift(); }
        if (Math.random() < dt * 1.2) honk(1, Curio.pick(['HONK', 'HONK!', 'HISSS']));
      }
    }
    if (G.speed > 0) G.walkPhase += dt * (G.speed > 150 ? 20 : 12);
    else G.walkPhase += dt * 2;
  }

  function resize() {
    const oldW = DW, oldH = DH;
    DW = desk.clientWidth; DH = desk.clientHeight;
    geese.forEach((g) => { g.W = DW < 520 ? 84 : 110; });
    sizeCanvas(); placePuddle();
    ITEMS.forEach((it) => {
      if (!it.moved) [it.x, it.y] = homeXY(it);
      else { it.x = Math.min(it.x, DW - 20); it.y = Math.min(it.y, DH - FLOOR - 10); }
      placeItem(it);
    });
    geese.forEach((g) => { G = g; G.x = clampX(G.x * (oldW ? DW / oldW : 1)); G.y = clampY(G.y * (oldH ? DH / oldH : 1)); });
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!document.hidden) {
      for (const g of geese) { G = g; step(dt); render(); }
      if (MODE.on) modeTick(dt);
      if (SR.on) simpleTick(dt);
    }
    requestAnimationFrame(loop);
  }
  function clock() { $('#clock').textContent = tm(); }

  G = makeGoose(0, Math.min(HATS.length - 1, Math.max(0, Curio.store.get('cg:hat', 0) | 0)));
  resize();
  G.x = -60; G.y = DH * .62; G.face = 1;
  setTask([{ t: 'walk', to: () => [DW * .32, DH * .62], sp: 90 }, { t: 'do', f: () => { honk(1, 'HONK'); log('A goose has entered your desktop.'); } }, { t: 'wait', d: .8 }]);
  G.x = G.W * .5;
  paintStats(); clock();
  setInterval(clock, 15000);
  setInterval(() => Curio.store.set('cg:life', life), 5000);
  window.addEventListener('resize', resize);
  requestAnimationFrame(loop);
  function paintCount() { $('#gooseCount').textContent = `🪿 ${geese.length}`; $('#addGoose').disabled = geese.length >= 5; $('#remGoose').disabled = geese.length <= 1; }
  function addGoose(quiet) {
    if (geese.length >= 5) return;
    const keep = G;
    const g = makeGoose(geese.length % BREEDS.length, (geese[0].hat + geese.length * 3) % HATS.length);
    g.W = geese[0].W;
    g.spd = MODE.on ? DIFFS[MODE.diff].spd : 1;
    const fromLeft = Math.random() < .5;
    g.x = fromLeft ? g.W * .5 : DW - g.W * .5; g.y = DH * Curio.rand(.45, .75); g.face = fromLeft ? 1 : -1;
    G = g;
    setTask([{ t: 'walk', to: () => randSpot(), sp: 120 }, { t: 'do', f: () => honk(1, 'HONK') }]);
    if (!quiet) log(`${/^[AEIOU]/.test(BREEDS[g.breed].name) ? 'An' : 'A'} ${BREEDS[g.breed].name.toLowerCase()} has joined. There are ${geese.length} of them now.`);
    G = keep;
    if (geese.length >= 5) award('flock');
    paintCount();
  }
  function removeGoose() {
    if (geese.length <= 1) return;
    const g = geese.pop();
    if (g.held && g.held !== 'cursor') { const k = G; G = g; drop(); G = k; }
    if (g.held === 'cursor' && fakeCursor) { fakeCursor._x = g.x; fakeCursor._y = g.y; }
    g.el.classList.add('leaving');
    setTimeout(() => g.el.remove(), 400);
    if (G === g) G = geese[0];
    log(`The ${BREEDS[g.breed].name.toLowerCase()} waddled off. For now.`);
    paintCount();
  }
  $('#addGoose').addEventListener('click', () => addGoose(false));
  $('#remGoose').addEventListener('click', removeGoose);

  const WALLS = ['sky', 'sunset', 'night', 'meadow', 'retro'];
  let wall = WALLS.includes(Curio.store.get('cg:wall', 'sky')) ? Curio.store.get('cg:wall', 'sky') : 'sky';
  function paintWall() { WALLS.forEach((w) => desk.classList.toggle(`wall-${w}`, w === wall)); }
  $('#wallBtn').addEventListener('click', () => { wall = WALLS[(WALLS.indexOf(wall) + 1) % WALLS.length]; Curio.store.set('cg:wall', wall); paintWall(); Curio.beep(560, .05, 'triangle', .05); });
  paintWall();

  const ROUND = 90;
  const atHome = () => ITEMS.filter((it) => !it.moved && !it.knocked && !geese.some((g) => g.held === it)).length;
  function paintHud() {
    const hud = $('#hud');
    hud.hidden = !MODE.on;
    if (!MODE.on) return;
    const t = Math.max(0, Math.ceil(ROUND - MODE.t));
    hud.innerHTML = `<b>${DIFFS[MODE.diff].e} ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</b><span>🛡️ ${atHome()}/${ITEMS.length} safe</span><span>⭐ ${Math.round(MODE.score)}</span><span>🍞 ${MODE.bread}</span>`;
    hud.classList.toggle('low', t <= 10);
  }
  function modeTick(dt) {
    MODE.t += dt;
    MODE.score += atHome() * dt;
    MODE.max += ITEMS.length * dt;
    MODE.tick -= dt;
    if (MODE.tick <= 0) { MODE.tick = .25; paintHud(); }
    if (MODE.t >= ROUND) endDefend();
  }
  async function startDefend() {
    if (MODE.on) { endDefend(true); return; }
    const v = await Curio.modal({ emoji: '🛡️', title: 'Defend the desktop', body: `Keep your files, notes and mug where they belong for ${ROUND} seconds. Every second, every item at home scores a point. Drag stolen things back, shoo geese away, and spend your ${BREAD_MAX} bread wisely.`, buttons: DIFFS.map((d, i) => ({ label: `${d.e} ${d.name} (${d.geese} goose${d.geese > 1 ? 'e' : ''})`, value: i })).concat([{ label: 'Not now', value: -1 }]) });
    if (v == null || v < 0) return;
    MODE.diff = v; MODE.on = true; MODE.t = 0; MODE.score = 0; MODE.max = 0; MODE.bread = BREAD_MAX; MODE.tick = 0;
    $('#tidy').click();
    while (geese.length > DIFFS[v].geese) removeGoose();
    while (geese.length < DIFFS[v].geese) addGoose(true);
    geese.forEach((g) => { g.spd = DIFFS[v].spd; g.idle = .2; });
    $('#defend').textContent = '⏹ Stop round';
    desk.classList.add('defending');
    log(`Defend round started on ${DIFFS[v].name}. Protect everything!`, true);
    paintHud();
  }
  async function endDefend(abort) {
    MODE.on = false;
    geese.forEach((g) => { g.spd = 1; });
    $('#defend').textContent = '🛡️ Defend mode';
    desk.classList.remove('defending');
    paintHud();
    if (abort) { log('You gave up defending. The geese celebrate.', true); return; }
    const pct = MODE.max ? MODE.score / MODE.max * 100 : 0;
    const grade = pct >= 85 ? 'S' : pct >= 70 ? 'A' : pct >= 55 ? 'B' : pct >= 40 ? 'C' : 'D';
    const pts = Math.round(MODE.score);
    const d = DIFFS[MODE.diff];
    const r = Curio.best(`defend-${MODE.diff}`, pts);
    award('defend');
    if (grade === 'S') award('sgrade');
    if (MODE.diff === 2 && (grade === 'S' || grade === 'A')) award('feral');
    if (grade === 'S' || grade === 'A') Curio.confetti();
    const quips = { S: 'The geese have filed a formal complaint about you.', A: 'Barely any honking-related losses.', B: 'Respectable. The goose respects you a little.', C: 'The goose won some battles. You won the war. Sort of.', D: 'The goose owns this desktop now. You just live here.' };
    log(`Defend round over: grade ${grade}, ${pts} points.`, true);
    const v = await Curio.modal({ emoji: grade === 'S' || grade === 'A' ? '🏆' : grade === 'D' ? '🪿' : '🛡️', title: `Grade ${grade} on ${d.name}`, body: `${pts} points (${Math.round(pct)}% of everything kept safe). ${r.isNew ? 'New personal best!' : `Best on ${d.name}: ${r.best}.`} ${quips[grade]}`, buttons: [{ label: 'Play again', value: 'again' }, { label: 'Copy result', value: 'share' }, { label: 'Done', value: 'done' }] });
    if (v === 'again') startDefend();
    if (v === 'share') { const t = `🪿 I defended my desktop from ${d.geese} goose${d.geese > 1 ? 'e' : ''} on ${d.name}: grade ${grade}, ${pts} points. Chaos Goose on Zoble.`; try { await navigator.clipboard.writeText(t); Curio.toast('Copied!'); } catch (e) { Curio.toast(t, 4000); } }
  }
  $('#defend').addEventListener('click', startDefend);

  const SR = { on: false, t: 0, len: 60, tick: 0 };
  const RANKS = [
    [0, 'Suspiciously Calm', 'The goose did almost nothing. That is what worries us. It is planning something bigger.'],
    [10, 'Mild Inconvenience', 'The goose rates this desktop two honks out of five. It will be back with friends.'],
    [25, 'Feathered Menace', 'Your coffee will never be the same. Neither will you.'],
    [45, 'Public Enemy No. 1', 'The goose has added itself to your contacts as "Mum".'],
    [70, 'Total Goose', 'The goose now pays your rent. Not to you. To itself.']
  ];
  function paintSimpleHud() {
    const hud = $('#hud');
    hud.hidden = false;
    const t = Math.max(0, Math.ceil(SR.len - SR.t));
    hud.innerHTML = `<b>⏱ 0:${String(t).padStart(2, '0')}</b><span class="cg-meter" aria-label="Chaos ${S.chaos}"><i style="width:${Math.min(100, S.chaos / 70 * 100)}%"></i></span><span>🌪️ ${S.chaos}</span>`;
    hud.classList.toggle('low', t <= 10);
  }
  function simpleTick(dt) {
    SR.t += dt; SR.tick -= dt;
    if (SR.tick <= 0) { SR.tick = .25; paintSimpleHud(); }
    if (SR.t >= SR.len) endSimple();
  }
  function startSimple() {
    $('#report')?.remove();
    Object.keys(S).forEach((k) => { S[k] = 0; });
    $('#chaos').textContent = 0; paintStats();
    if (SR.started) $('#tidy').click();
    SR.started = true; SR.on = true; SR.t = 0; SR.tick = 0;
    geese.forEach((g) => { g.annoy = 0; });
    paintSimpleHud();
  }
  function endSimple() {
    SR.on = false;
    paintSimpleHud();
    const rank = RANKS.filter((r) => S.chaos >= r[0]).pop();
    const r = Curio.best('simple-chaos', S.chaos);
    if (S.chaos >= 70) { award('total'); Curio.confetti(); }
    honk(1.3, 'HONK!!!');
    const crimes = [['🗂️', 'things stolen', S.stolen], ['💥', 'things knocked over', S.knocked], ['📯', 'honks', S.honks], ['👋', 'times shooed', S.shoos], ['🍞', 'bread eaten', S.bread]].filter((c) => c[2] > 0);
    const el = document.createElement('div');
    el.className = 'cg-report'; el.id = 'report'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Incident report');
    el.innerHTML = `<div class="cg-report__win"><div class="cg-pop__bar"><span>incident_report.txt</span></div><div class="cg-report__body">
      <div class="cg-report__stamp">CASE CLOSED</div>
      <small>Goose incident report · 60 seconds</small>
      <h3></h3><p class="cg-report__quip"></p>
      <div class="cg-report__score"><b>${S.chaos}</b><span>chaos${r.isNew && S.chaos > 0 ? ' · new record!' : r.best != null ? ` · best ${r.best}` : ''}</span></div>
      <ul>${crimes.length ? crimes.map((c) => `<li>${c[0]} <b>${c[2]}</b> ${c[1]}</li>`).join('') : '<li>No crimes recorded. Yet.</li>'}</ul>
      <div class="cg-report__btns"><button type="button" class="cg-btn cg-btn--go" data-r="again">Another 60 seconds</button><button type="button" class="cg-btn" data-r="adv">More geese (Advanced)</button><button type="button" class="cg-btn" data-r="share">Share</button></div>
    </div></div>`;
    el.querySelector('h3').textContent = rank[1];
    el.querySelector('.cg-report__quip').textContent = rank[2];
    el.addEventListener('pointerdown', (e) => e.stopPropagation());
    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-r]'); if (!b) return;
      if (b.dataset.r === 'again') startSimple();
      if (b.dataset.r === 'adv') Curio.setMode('advanced');
      if (b.dataset.r === 'share') { const t = `🪿 A goose caused ${S.chaos} chaos on my desktop in 60 seconds. Verdict: ${rank[1]}. Chaos Goose on Zoble.`; try { await navigator.clipboard.writeText(t); Curio.toast('Copied!'); } catch (err) { Curio.toast(t, 4000); } }
    });
    desk.append(el);
    log(`Incident report filed: ${rank[1]}, ${S.chaos} chaos.`, true);
    el.querySelector('[data-r="again"]').focus({ preventScroll: true });
  }
  if (SIMPLE) {
    $('#subLine').innerHTML = 'You have to look after a goose for <b>60 seconds</b>. Shoo it, feed it, drag your things back. It will not go well.';
    setTimeout(startSimple, 1800);
  }
  paintPranks();
  paintAch();
  paintCount();
  window.ChaosGoose = { get G() { return G; }, geese, ITEMS, S, MODE, SR, chooseTask, throwBread, shoo, addGoose, endDefend, endSimple, popup, typeTodo, renameIt };
})();
