(function () {
  const INK = '#2b2622';
  const SW = 3.5;
  const SKIN = { 1: '#ffe0c7', 2: '#f3c79a', 3: '#dfa874', 4: '#b97b4b', 5: '#8a5634', 6: '#5e3a22', green: '#a9d67a', blue: '#95c8ff', purple: '#c9a6f2', gray: '#d9dcdf' };
  const HAIR = { black: '#2b2420', brown: '#7a4a2a', blonde: '#ecc75e', red: '#c4512a', gray: '#a3a3a3', white: '#f4f2ee', pink: '#ff86bd', blue: '#4f8cff', green: '#55b85a', purple: '#8e5bd6', orange: '#ff8a2b' };
  const BROW = { black: '#1f1a17', brown: '#5a3420', blonde: '#a8822a', red: '#8e3518', gray: '#6f6f6f', white: '#9d9a94', pink: '#d9558f', blue: '#2c5fc9', green: '#2f7f35', purple: '#5f3699', orange: '#c75e0c' };
  const SHIRT = { blue: '#4a7bd0', red: '#d64545', green: '#3f9e5a', yellow: '#f2c230', gray: '#8d939a', black: '#3a3a42', white: '#f4f4f0', orange: '#ff8a2b', purple: '#8e5bd6', pink: '#f48fb1', teal: '#22a3a3', brown: '#8a5a3b', stripes: '#f4f4f0' };

  const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;

  const HEADS = {
    oval: { hw: 78, top: 102, bot: 298, d: ell(150, 200, 78, 98) },
    round: { hw: 88, top: 118, bot: 292, d: ell(150, 205, 88, 87) },
    square: { hw: 77, top: 108, bot: 294, d: 'M73 142Q73 108 106 108L194 108Q227 108 227 142L227 254Q227 292 188 294L112 294Q73 292 73 254Z' },
    long: { hw: 67, top: 88, bot: 310, d: ell(150, 199, 67, 111) },
    egg: { hw: 84, top: 100, bot: 294, d: 'M150 100C246 100 240 226 200 272C180 296 120 296 100 272C60 226 54 100 150 100Z' },
    pear: { hw: 78, top: 110, bot: 300, d: 'M150 110C204 110 220 150 228 212C236 276 200 300 150 300C100 300 64 276 72 212C80 150 96 110 150 110Z' },
    heart: { hw: 82, top: 104, bot: 306, d: 'M150 104C230 104 240 168 226 218C212 266 180 298 150 306C120 298 88 266 74 218C60 168 70 104 150 104Z' }
  };

  const NAMES = {
    hair: { none: 'bald head', short: 'hair', spiky: 'spiky hair', mohawk: 'mohawk', afro: 'afro', long: 'long hair', bob: 'bob', combover: 'combover', bun: 'bun', pigtails: 'pigtails', curly: 'curls', mullet: 'mullet', beehive: 'beehive', buzz: 'buzz cut', ponytail: 'ponytail', wild: 'wild hair', peak: 'widow\'s peak' },
    hat: { cap: 'cap', beanie: 'beanie', tophat: 'top hat', cowboy: 'cowboy hat', cone: 'traffic cone', crown: 'crown', party: 'party hat', chef: 'chef hat', pirate: 'pirate hat', propeller: 'propeller hat', fez: 'fez', viking: 'viking helmet', toast: 'head toast', duck: 'rubber duck', halo: 'halo', beret: 'beret' },
    eyes: { dot: 'eyes', round: 'eyes', wide: 'big eyes', sleepy: 'sleepy eyes', squint: 'squint', angry: 'angry eyes', googly: 'googly eyes', cyclops: 'one giant eye', lashes: 'eyelashes' },
    gl: { round: 'specs', square: 'glasses', sunglasses: 'shades', monocle: 'monocle', eyepatch: 'eye patch', '3d': '3D glasses', goggles: 'goggles', heart: 'heart glasses' },
    brows: { normal: 'eyebrows', thick: 'thick eyebrows', unibrow: 'unibrow', angry: 'angry eyebrows', raised: 'raised eyebrows', three: 'three eyebrows', bushy: 'bushy eyebrows', none: 'missing eyebrows' },
    nose: { button: 'nose', big: 'big nose', pointy: 'pointy nose', long: 'long nose', hook: 'hooked nose', clown: 'clown nose', pig: 'snout', tiny: 'nose holes' },
    mouth: { smile: 'smile', frown: 'frown', flat: 'mouth', open: 'open mouth', grin: 'grin', gap: 'gap tooth', smirk: 'smirk', tongue: 'tongue', fangs: 'fangs' },
    fh: { mustache: 'mustache', handlebar: 'handlebar mustache', pencil: 'pencil mustache', beard: 'beard', goatee: 'goatee', wizard: 'wizard beard', stubble: 'stubble', soulpatch: 'soul patch' },
    acc: { parrot: 'parrot', cat: 'cat', bowtie: 'bow tie', tie: 'tie', chain: 'gold chain', earring: 'earring', pipe: 'pipe', rose: 'rose', pearls: 'pearls', scarf: 'scarf', medal: 'medal', snail: 'snail', headphones: 'headphones', lollipop: 'lollipop', baguette: 'baguette', nametag: 'name tag' },
    head: { oval: 'oval face', round: 'round face', square: 'square jaw', long: 'long face', egg: 'egg head', pear: 'pear face', heart: 'pointy chin' }
  };

  function parse(str) {
    const s = { head: 'oval', skin: '2', hair: 'short', hc: 'brown', brows: 'normal', eyes: 'dot', nose: 'button', mouth: 'smile', ears: 'normal', fh: 'none', fhc: '', gl: 'none', hat: 'none', hatc: '', marks: [], acc: [], shirt: 'blue' };
    for (const tok of str.trim().split(/\s+/)) {
      const [k, v] = tok.split(':');
      if (k === 'marks' || k === 'acc') s[k] = v.split('+');
      else s[k] = v;
    }
    if (!s.fhc) s.fhc = s.fh === 'wizard' && !s.hc ? 'white' : s.hc;
    return s;
  }

  function render(spec, opt = {}) {
    const line = !!opt.line;
    const s = typeof spec === 'string' ? parse(spec) : spec;
    const H = HEADS[s.head] || HEADS.oval;
    const T = H.top, W = H.hw;
    const F = (c) => (line ? '#ffffff' : c);
    const K = (c) => (line ? INK : c);
    const HF = (c) => (line ? '#e6e6e6' : c);
    const D = (c) => (line ? '#d4d4d4' : c);
    const skin = SKIN[s.skin] || SKIN[2];
    const hair = HAIR[s.hc] || HAIR.brown;
    const fhair = HAIR[s.fhc] || hair;
    const brow = line ? INK : (BROW[s.hc] || BROW.brown);
    const st = (w = SW) => ` stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
    const P = (d, fill, w) => `<path d="${d}" fill="${fill}"${st(w)}/>`;
    const L = (d, w = SW, col = INK) => `<path d="${d}" fill="none" stroke="${line ? INK : col}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
    const C = (cx, cy, r, fill, w) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${w === 0 ? '' : st(w)}/>`;
    const E = (cx, cy, rx, ry, fill, w, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${w === 0 ? '' : st(w)}${extra}/>`;
    const R = (x, y, w, h, rx, fill, sw) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${sw === 0 ? '' : st(sw)}/>`;
    const out = [];

    if (!line && opt.chart) {
      out.push(`<rect width="300" height="400" fill="#d5dbe0"/>`);
      for (let y = 20, i = 0; y < 400; y += 20, i++) {
        const big = i % 2 === 0;
        out.push(`<path d="M0 ${y}H${big ? 300 : 22}M${big ? 0 : 278} ${y}H300" stroke="#9aa6b0" stroke-width="${big ? 1.2 : 1}"/>`);
        if (big) {
          const inches = 84 - i * 3;
          out.push(`<text x="5" y="${y - 4}" font-size="11" font-family="monospace" fill="#6d7a85">${Math.floor(inches / 12)}'${inches % 12}"</text>`);
        }
      }
    } else if (opt.bg !== false) {
      out.push(`<rect width="300" height="400" fill="#ffffff"/>`);
    }

    out.push('<g transform="translate(15 34) scale(.9)">');
    const l = 150 - W - 4, r = 150 + W + 4, cy = 1.333 * T - 72;
    const cap = (fy, ext = 4, part = 0) => {
      const a = 150 - W - ext, b = 150 + W + ext, c = 1.333 * T - 72 - ext;
      return `M${a} 190C${a - 14} ${c} ${b + 14} ${c} ${b} 190Q${b - 4} ${fy + part} ${150 + W * 0.5} ${fy - 4 + part}Q150 ${fy + 12} ${150 - W * 0.5} ${fy - 4 - part}Q${a + 4} ${fy - part} ${a} 190Z`;
    };

    const back = [];
    const front = [];
    switch (s.hair) {
      case 'short': front.push(P(cap(T + 40), HF(hair))); break;
      case 'buzz': front.push(P(cap(T + 30, 1), line ? '#f0f0f0' : hair, SW)); if (!line) front.push(`<path d="${cap(T + 30, 1)}" fill="${skin}" opacity=".35"/>`); break;
      case 'peak': front.push(P(`M${l} 190C${l - 14} ${cy} ${r + 14} ${cy} ${r} 190Q${r - 6} ${T + 26} ${150 + W * 0.4} ${T + 26}L150 ${T + 62}L${150 - W * 0.4} ${T + 26}Q${l + 6} ${T + 26} ${l} 190Z`, HF(hair))); break;
      case 'spiky': {
        let d = `M${l} 190L${l - 2} ${T + 56}`;
        const n = 7;
        for (let i = 0; i <= n * 2; i++) {
          const x = l - 2 + ((r + 2 - (l - 2)) * i) / (n * 2);
          const base = T + 70 * Math.pow((x - 150) / W, 2) - 10;
          d += `L${x.toFixed(1)} ${(i % 2 ? base - 34 : base).toFixed(1)}`;
        }
        d += `L${r} 190Q${r - 4} ${T + 40} ${150 + W * 0.5} ${T + 36}Q150 ${T + 52} ${150 - W * 0.5} ${T + 36}Q${l + 4} ${T + 40} ${l} 190Z`;
        front.push(P(d, HF(hair)));
        break;
      }
      case 'mohawk': {
        let d = `M126 ${T + 8}`;
        for (let i = 0; i <= 10; i++) {
          const x = 126 + i * 4.8;
          const lift = 18 * Math.sin((i / 10) * Math.PI);
          d += `L${x.toFixed(1)} ${(i % 2 ? T - 44 - lift : T - 8 - lift * 0.6).toFixed(1)}`;
        }
        d += `L174 ${T + 8}Q150 ${T + 16} 126 ${T + 8}Z`;
        front.push(P(d, HF(hair)));
        break;
      }
      case 'afro': {
        const R0 = W + 40, cx = 150, cyy = T + 64;
        let d = '';
        for (let i = 0; i <= 96; i++) {
          const a = (i / 96) * Math.PI * 2;
          const rr = R0 + 7 * Math.sin(a * 14);
          d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)} ${(cyy + Math.sin(a) * rr * 0.92).toFixed(1)}`;
        }
        back.push(P(d + 'Z', HF(hair)));
        front.push(P(cap(T + 28, 2), HF(hair)));
        break;
      }
      case 'long':
        back.push(P(`M${l - 6} ${T + 60}C${l - 14} 250 ${l - 22} 320 ${l - 18} 352L${r + 18} 352C${r + 22} 320 ${r + 14} 250 ${r + 6} ${T + 60}C${r + 6} ${T - 34} ${l - 6} ${T - 34} ${l - 6} ${T + 60}Z`, HF(hair)));
        front.push(P(cap(T + 40, 4, 12), HF(hair)));
        break;
      case 'bob':
        back.push(P(`M${l - 4} ${T + 60}C${l - 10} 220 ${l - 14} 268 ${l - 8} 286L${r + 8} 286C${r + 14} 268 ${r + 10} 220 ${r + 4} ${T + 60}C${r + 4} ${T - 34} ${l - 4} ${T - 34} ${l - 4} ${T + 60}Z`, HF(hair)));
        front.push(P(`M${l} 190C${l - 14} ${cy} ${r + 14} ${cy} ${r} 190L${r - 4} ${T + 48}L${l + 4} ${T + 48}Z`, HF(hair)));
        break;
      case 'combover':
        front.push(L(`M${150 - W + 6} ${T + 46}C${150 - W * 0.4} ${T - 6} ${150 + W * 0.4} ${T - 4} ${150 + W - 2} ${T + 36}`, 5, hair));
        front.push(L(`M${150 - W + 10} ${T + 56}C${150 - W * 0.3} ${T + 4} ${150 + W * 0.5} ${T + 6} ${150 + W} ${T + 52}`, 5, hair));
        front.push(L(`M${150 - W + 14} ${T + 66}C${150 - W * 0.2} ${T + 16} ${150 + W * 0.5} ${T + 18} ${150 + W + 2} ${T + 68}`, 5, hair));
        front.push(P(`M${l + 2} 196Q${l - 6} 170 ${l + 4} 150Q${l + 14} 168 ${l + 12} 196Z`, HF(hair), 3));
        front.push(P(`M${r - 2} 196Q${r + 6} 170 ${r - 4} 150Q${r - 14} 168 ${r - 12} 196Z`, HF(hair), 3));
        break;
      case 'bun':
        back.push(C(150, T - 18, 24, HF(hair)));
        front.push(P(`M${l} 190C${l - 14} ${cy} ${r + 14} ${cy} ${r} 190Q${r - 6} ${T + 30} 150 ${T + 26}Q${l + 6} ${T + 30} ${l} 190Z`, HF(hair)));
        break;
      case 'pigtails':
        back.push(`<g transform="rotate(25 ${l - 16} 226)">${E(l - 16, 226, 15, 36, HF(hair))}</g>`);
        back.push(`<g transform="rotate(-25 ${r + 16} 226)">${E(r + 16, 226, 15, 36, HF(hair))}</g>`);
        front.push(P(cap(T + 36), HF(hair)));
        front.push(C(l - 2, 192, 6, F('#e94b5b'), 3), C(r + 2, 192, 6, F('#e94b5b'), 3));
        break;
      case 'ponytail':
        back.push(P(`M${r - 10} ${T + 40}C${r + 40} ${T + 40} ${r + 44} 250 ${r + 22} 300C${r + 10} 270 ${r + 6} 230 ${r - 6} 200Z`, HF(hair)));
        front.push(P(cap(T + 38, 4, -10), HF(hair)));
        break;
      case 'curly': {
        const parts = [];
        for (let i = 0; i <= 10; i++) {
          const a = Math.PI + (i / 10) * Math.PI;
          const x = 150 + Math.cos(a) * (W + 4);
          const y = T + 72 + Math.sin(a) * 78;
          if (y < 200) parts.push(C(x.toFixed(1), y.toFixed(1), 17, HF(hair)));
        }
        front.push(parts.join(''));
        front.push(`<path d="${cap(T + 40, -4)}" fill="${HF(hair)}"/>`);
        front.push(L(`M${150 - W * 0.7} ${T + 34}Q${150 - W * 0.35} ${T + 50} 150 ${T + 42}Q${150 + W * 0.35} ${T + 52} ${150 + W * 0.7} ${T + 34}`));
        break;
      }
      case 'mullet':
        back.push(P(`M${l + 2} 180C${l - 6} 262 124 300 112 338L188 338C176 300 ${r + 6} 262 ${r - 2} 180Z`, HF(hair)));
        front.push(P(cap(T + 34), HF(hair)));
        break;
      case 'beehive':
        front.push(P(`M${l} 190C${l - 12} ${T - 10} ${150 - W * 0.7} ${T - 112} 150 ${T - 112}C${150 + W * 0.7} ${T - 112} ${r + 12} ${T - 10} ${r} 190Q${r - 4} ${T + 40} ${150 + W * 0.5} ${T + 38}Q150 ${T + 50} ${150 - W * 0.5} ${T + 38}Q${l + 4} ${T + 40} ${l} 190Z`, HF(hair)));
        front.push(L(`M${150 - 30} ${T - 40}Q150 ${T - 70} ${150 + 30} ${T - 40}M${150 - 40} ${T}Q150 ${T - 30} ${150 + 40} ${T}`, 3));
        break;
      case 'wild': {
        const tuft = (sx) => {
          const x0 = 150 + sx * (W - 6);
          const pts = [[0, -60], [30, -78], [22, -46], [50, -50], [28, -20], [54, -6], [26, 4], [44, 30], [6, 20]];
          return P(`M${x0} ${T + 70}` + pts.map(([dx, dy]) => `L${(x0 + sx * dx).toFixed(1)} ${T + 70 + dy}`).join('') + 'Z', HF(hair));
        };
        back.push(tuft(-1), tuft(1));
        front.push(L(`M140 ${T + 2}Q132 ${T - 20} 120 ${T - 22}M152 ${T}Q156 ${T - 26} 168 ${T - 30}`, 4, hair));
        break;
      }
      default:
        if (!line) front.push(`<path d="M${150 - W * 0.45} ${T + 30}Q${150 - W * 0.3} ${T + 12} ${150 - W * 0.05} ${T + 10}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>`);
    }

    const shirtCol = SHIRT[s.shirt] || SHIRT.blue;
    const shirtD = 'M14 440L18 400C22 352 58 332 118 320L150 352L182 320C242 332 278 352 282 400L286 440Z';
    out.push(P(shirtD, F(shirtCol)));
    if (s.shirt === 'stripes' && !line) {
      out.push(`<clipPath id="sk-st"><path d="${shirtD}"/></clipPath><g clip-path="url(#sk-st)" stroke="#2f4f9e" stroke-width="7">${[338, 356, 374, 392, 410, 428].map((y) => `<path d="M0 ${y}H300"/>`).join('')}</g>`);
      out.push(`<path d="${shirtD}" fill="none"${st()}/>`);
    }
    out.push(...back);
    out.push(P('M126 250L126 322L150 352L174 322L174 250Z', F(skin)));

    const ear = (sx) => {
      const x = 150 + sx * (W + 2);
      switch (s.ears) {
        case 'big': return E(150 + sx * (W + 10), 200, 22, 32, F(skin)) + L(`M${150 + sx * (W + 14)} 186Q${150 + sx * (W + 22)} 200 ${150 + sx * (W + 12)} 214`, 2.5);
        case 'small': return E(x, 202, 8, 13, F(skin));
        case 'pointy': return P(`M${150 + sx * (W - 4)} 184L${150 + sx * (W + 30)} 150L${150 + sx * (W + 8)} 228Z`, F(skin));
        case 'none': return '';
        default: return E(x, 200, 12, 20, F(skin)) + L(`M${150 + sx * (W + 4)} 190Q${150 + sx * (W + 9)} 200 ${150 + sx * (W + 3)} 210`, 2.5);
      }
    };
    out.push(ear(-1), ear(1));
    out.push(P(H.d, F(skin)));

    const M = s.marks;
    if (M.includes('blush') && !line) out.push(E(108, 234, 15, 8, '#ff7d8a', 0, ' opacity=".45"'), E(192, 234, 15, 8, '#ff7d8a', 0, ' opacity=".45"'));
    if (M.includes('freckles')) out.push([[104, 222], [113, 228], [100, 231], [110, 236], [196, 222], [187, 228], [200, 231], [190, 236]].map(([x, y]) => C(x, y, 2.2, K('#a0522d'), 0)).join(''));
    if (M.includes('scar')) out.push(L('M100 208L122 244', 3, '#9c3d3d'), L('M104 220L114 214M108 228L118 222M112 236L122 230', 2.5, '#9c3d3d'));
    if (M.includes('mole')) out.push(C(184, 244, 4, K('#4a2c1c'), 0));
    if (M.includes('tear')) out.push(P('M184 212Q178 222 184 226Q190 222 184 212Z', K('#2b4f8a'), 2));
    if (M.includes('wrinkles')) out.push(L('M128 150Q150 145 172 150M132 158Q150 153 168 158', 2.5));
    if (M.includes('bags')) out.push(L('M106 208Q118 214 130 208M170 208Q182 214 194 208', 2.5));
    if (M.includes('sweat')) out.push(P('M200 140Q192 154 200 160Q208 154 200 140Z', F('#8fd0ff'), 2.5));
    if (M.includes('bandaid')) out.push(`<g transform="rotate(-20 118 146)">${R(98, 140, 40, 13, 5, F('#f0c48a'), 2.5)}${R(112, 141, 12, 11, 2, F('#e0a86a'), 0)}</g>`);

    const fhc = HF(fhair);
    const jawL = 150 - W + 4, jawR = 150 + W - 4, B = H.bot;
    const beardInner = `Q${jawR - 16} 236 176 240Q150 230 124 240Q${jawL + 16} 236 ${jawL} 214Z`;
    switch (s.fh) {
      case 'beard': out.push(P(`M${jawL} 214C${jawL + 2} ${B + 12} ${jawR - 2} ${B + 12} ${jawR} 214${beardInner}`, fhc)); break;
      case 'wizard': out.push(P(`M${jawL} 214C${jawL + 4} 300 130 360 150 394C170 360 ${jawR - 4} 300 ${jawR} 214${beardInner}`, fhc)); out.push(L('M140 300Q146 330 150 360M162 300Q158 330 152 352', 2.5)); break;
      case 'goatee': out.push(P(`M138 ${B - 22}Q150 ${B + 16} 162 ${B - 22}Q150 ${B - 14} 138 ${B - 22}Z`, fhc)); break;
      case 'soulpatch': out.push(P('M144 276L156 276L150 290Z', fhc, 2.5)); break;
      case 'stubble': {
        let seed = 7;
        const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
        const dots = [];
        for (let i = 0; i < 70; i++) {
          const a = rnd() * Math.PI, rr = 0.55 + rnd() * 0.42;
          const x = 150 + Math.cos(a) * (W - 6) * rr;
          const y = 236 + Math.sin(a) * (B - 236) * rr;
          if (Math.abs(x - 150) < 28 && y < 276) continue;
          dots.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.3" fill="${line ? INK : '#4a3a30'}" opacity=".7"/>`);
        }
        out.push(dots.join(''));
        break;
      }
      default:
    }

    switch (s.nose) {
      case 'big': out.push(E(150, 226, 17, 14, F(skin))); break;
      case 'pointy': out.push(L('M150 198L168 232L150 236')); break;
      case 'long': out.push(L('M148 196L162 252Q150 260 140 250')); break;
      case 'hook': out.push(L('M146 198Q176 222 160 240Q152 244 146 236')); break;
      case 'clown': out.push(C(150, 226, 15, F('#e8323c'))); if (!line) out.push(C(145, 221, 4, '#ffffff', 0)); break;
      case 'pig': out.push(E(150, 228, 16, 11, F('#ffaab8')), E(144, 228, 3, 4.5, INK, 0), E(156, 228, 3, 4.5, INK, 0)); break;
      case 'tiny': out.push(C(145, 230, 2.6, INK, 0), C(155, 230, 2.6, INK, 0)); break;
      default: out.push(L('M144 228Q150 236 156 228'));
    }

    switch (s.mouth) {
      case 'frown': out.push(L('M128 272Q150 252 172 272')); break;
      case 'flat': out.push(L('M130 264L170 264')); break;
      case 'open': out.push(E(150, 266, 13, 15, K('#6b2323'))); break;
      case 'grin':
      case 'gap':
        out.push(P('M122 254Q150 294 178 254Z', F('#ffffff')));
        out.push(L('M126 262Q150 268 174 262M138 256L138 266M162 256L162 266', 2));
        if (s.mouth === 'gap') out.push(R(146, 256, 8, 10, 1, INK, 0));
        break;
      case 'smirk': out.push(L('M130 266Q160 270 176 252')); break;
      case 'tongue': out.push(P('M140 264Q150 290 160 264Z', F('#ff7d8a'), 3), L('M126 258Q150 274 174 258')); break;
      case 'fangs': out.push(P('M136 264L140 278L144 265Z', F('#ffffff'), 2.5), P('M156 265L160 278L164 264Z', F('#ffffff'), 2.5), L('M126 260Q150 270 174 260')); break;
      default: out.push(L('M126 256Q150 278 174 256'));
    }

    const mus = {
      mustache: 'M120 252Q134 234 150 244Q166 234 180 252Q166 256 150 250Q134 256 120 252Z',
      handlebar: 'M150 244Q134 236 118 248Q106 254 102 242Q100 256 116 258Q134 256 150 250Q166 256 184 258Q200 256 198 242Q194 254 182 248Q166 236 150 244Z',
      pencil: 'M128 248Q150 240 172 248Q150 246 128 248Z'
    };
    if (mus[s.fh]) out.push(P(mus[s.fh], fhc, s.fh === 'pencil' ? 2.5 : SW));
    if (s.fh === 'beard' || s.fh === 'wizard') out.push(P(mus.mustache, fhc));

    const eyeL = 118, eyeR = 182, ey = 192;
    const white = F('#ffffff');
    const eye = (x) => {
      switch (s.eyes) {
        case 'round': return C(x, ey, 13, white) + C(x, ey + 1, 6, INK, 0);
        case 'wide': return C(x, ey, 18, white) + C(x, ey, 5, INK, 0);
        case 'sleepy': return C(x, ey, 12, white) + C(x, ey + 4, 5, INK, 0) + P(`M${x - 12} ${ey}A12 12 0 0 1 ${x + 12} ${ey}Z`, F(skin));
        case 'squint': return L(`M${x - 13} ${ey + 3}Q${x} ${ey - 9} ${x + 13} ${ey + 3}`);
        case 'angry': return C(x, ey, 12, white) + C(x, ey + 2, 5, INK, 0) + L(x < 150 ? `M${x - 15} ${ey - 13}L${x + 14} ${ey - 3}` : `M${x + 15} ${ey - 13}L${x - 14} ${ey - 3}`);
        case 'googly': return C(x, ey, 16, white) + C(x < 150 ? x - 6 : x + 6, x < 150 ? ey - 6 : ey + 5, 7, INK, 0);
        case 'lashes': return C(x, ey, 12, white) + C(x, ey + 1, 6, INK, 0) + L(x < 150 ? `M${x - 10} ${ey - 8}L${x - 17} ${ey - 15}M${x - 3} ${ey - 12}L${x - 6} ${ey - 20}M${x + 5} ${ey - 11}L${x + 6} ${ey - 19}` : `M${x + 10} ${ey - 8}L${x + 17} ${ey - 15}M${x + 3} ${ey - 12}L${x + 6} ${ey - 20}M${x - 5} ${ey - 11}L${x - 6} ${ey - 19}`, 2.5);
        default: return C(x, ey, 5.5, INK, 0);
      }
    };
    if (s.eyes === 'cyclops') out.push(C(150, 188, 25, white), C(150, 190, 10, INK, 0), line ? '' : C(146, 185, 3, '#ffffff', 0));
    else out.push(eye(eyeL), eye(eyeR));

    const bw = s.brows === 'thick' ? 7 : 4.5;
    const BL = (d, w = bw) => `<path d="${d}" fill="none" stroke="${brow}" stroke-width="${w}" stroke-linecap="round"/>`;
    switch (s.brows) {
      case 'unibrow': out.push(BL('M102 172Q126 160 150 168Q174 160 198 172', 6.5)); break;
      case 'angry': out.push(BL('M102 162L134 174'), BL('M198 162L166 174')); break;
      case 'raised': out.push(BL('M104 164Q118 150 132 160'), BL('M168 160Q182 150 196 164')); break;
      case 'three': out.push(BL('M104 172Q118 164 132 170'), BL('M168 170Q182 164 196 172'), BL('M136 150Q150 142 164 150')); break;
      case 'bushy': out.push(P('M100 174L104 162L110 168L114 158L120 166L126 158L130 166L136 162L134 174Z', line ? '#e6e6e6' : brow, 2.5), P('M200 174L196 162L190 168L186 158L180 166L174 158L170 166L164 162L166 174Z', line ? '#e6e6e6' : brow, 2.5)); break;
      case 'none': break;
      case 'thick':
      default: out.push(BL('M104 172Q118 164 132 170'), BL('M168 170Q182 164 196 172'));
    }

    const temples = `M100 188L${150 - W + 2} 184M200 188L${150 + W - 2} 184`;
    switch (s.gl) {
      case 'round': out.push(C(eyeL, ey, 18, line ? 'none' : 'rgba(190,225,255,.3)'), C(eyeR, ey, 18, line ? 'none' : 'rgba(190,225,255,.3)'), L('M136 190Q150 182 164 190'), L(temples, 3)); break;
      case 'square': out.push(R(96, 176, 44, 32, 6, line ? 'none' : 'rgba(190,225,255,.3)'), R(160, 176, 44, 32, 6, line ? 'none' : 'rgba(190,225,255,.3)'), L('M140 188L160 188'), L(temples.replace(/M100/, 'M96').replace(/M200/, 'M204'), 3)); break;
      case 'sunglasses': out.push(P('M94 180L142 180L138 202Q118 214 98 202Z', K('#1d1d22')), P('M158 180L206 180L202 202Q182 214 162 202Z', K('#1d1d22')), L('M142 184L158 184'), L(temples.replace(/M100/, 'M94').replace(/M200/, 'M206'), 3)); if (!line) out.push(L('M104 186L114 186M168 186L178 186', 3, '#ffffff')); break;
      case 'monocle': out.push(C(eyeR, ey, 19, line ? 'none' : 'rgba(255,240,190,.25)', 4), L(`M200 198Q220 250 ${206} 318`, 2, '#c49a2c')); break;
      case 'eyepatch': out.push(E(eyeL, ey, 19, 17, INK), L(`M102 180L${150 - W + 2} 168M134 180L${150 + W - 4} 150`, 3)); break;
      case '3d': out.push(R(94, 176, 46, 32, 4, F('#ff4b4b')), R(160, 176, 46, 32, 4, F('#3fb6ff')), L('M140 186L160 186', 5), L(temples.replace(/M100/, 'M94').replace(/M200/, 'M206'), 3)); break;
      case 'goggles': out.push(L(`M${150 - W - 2} 190L96 190M204 190L${150 + W + 2} 190`, 8, '#5a5a5a'), C(eyeL, ey, 22, line ? 'none' : 'rgba(190,240,220,.35)', 7), C(eyeR, ey, 22, line ? 'none' : 'rgba(190,240,220,.35)', 7)); break;
      case 'heart': {
        const hrt = (x) => `M${x} ${ey + 16}C${x - 30} ${ey - 2} ${x - 18} ${ey - 26} ${x} ${ey - 10}C${x + 18} ${ey - 26} ${x + 30} ${ey - 2} ${x} ${ey + 16}Z`;
        out.push(P(hrt(eyeL), line ? 'none' : 'rgba(255,90,150,.75)'), P(hrt(eyeR), line ? 'none' : 'rgba(255,90,150,.75)'), L('M136 186L164 186'), L(temples, 3));
        break;
      }
      default:
    }

    out.push(...front);

    const hatc = s.hatc ? (SHIRT[s.hatc] || s.hatc) : null;
    switch (s.hat) {
      case 'cap': {
        const c = F(hatc || '#d64545');
        out.push(P(`M${150 - W - 6} ${T + 38}C${150 - W - 6} ${T - 30} ${150 + W + 6} ${T - 30} ${150 + W + 6} ${T + 38}Z`, c));
        out.push(P(`M${150 - W - 14} ${T + 38}Q150 ${T + 66} ${150 + W + 14} ${T + 38}Q150 ${T + 46} ${150 - W - 14} ${T + 38}Z`, c));
        out.push(C(150, T - 13, 5, c, 2.5));
        break;
      }
      case 'beanie': {
        const c = F(hatc || '#3f9e5a');
        out.push(P(`M${150 - W - 4} ${T + 30}C${150 - W - 4} ${T - 36} ${150 + W + 4} ${T - 36} ${150 + W + 4} ${T + 30}Z`, c));
        out.push(R(150 - W - 8, T + 20, 2 * W + 16, 22, 9, c));
        out.push(C(150, T - 26, 13, F('#ffffff')));
        break;
      }
      case 'tophat':
        out.push(R(104, T - 86, 92, 104, 4, D(hatc || '#26262c')), R(104, T - 2, 92, 14, 0, F('#c0392b')), E(150, T + 18, W + 20, 9, D(hatc || '#26262c')));
        break;
      case 'cowboy':
        out.push(P(`M104 ${T + 24}C100 ${T - 48} 138 ${T - 30} 150 ${T - 42}C162 ${T - 30} 200 ${T - 48} 196 ${T + 24}Z`, F('#a86b3c')));
        out.push(L(`M106 ${T + 8}Q150 ${T + 16} 194 ${T + 8}`, 6, '#5b3518'));
        out.push(P(`M${150 - W - 44} ${T + 6}Q150 ${T + 48} ${150 + W + 44} ${T + 6}Q${150 + W + 24} ${T + 36} 150 ${T + 38}Q${150 - W - 24} ${T + 36} ${150 - W - 44} ${T + 6}Z`, F('#a86b3c')));
        break;
      case 'cone': {
        const o = F('#ff7a1a');
        out.push(R(94, T + 6, 112, 16, 3, o));
        out.push(P(`M106 ${T + 10}L141 ${T - 104}Q150 ${T - 112} 159 ${T - 104}L194 ${T + 10}Z`, o));
        const hw = (y) => 9 + (35 * (y - (T - 104))) / 114;
        const band = (y1, y2) => `M${150 - hw(y1)} ${y1}L${150 + hw(y1)} ${y1}L${150 + hw(y2)} ${y2}L${150 - hw(y2)} ${y2}Z`;
        out.push(P(band(T - 70, T - 54), F('#ffffff'), 2.5), P(band(T - 32, T - 14), F('#ffffff'), 2.5));
        break;
      }
      case 'crown':
        out.push(P(`M100 ${T + 22}L96 ${T - 32}L124 ${T - 6}L150 ${T - 44}L176 ${T - 6}L204 ${T - 32}L200 ${T + 22}Z`, F('#f6c431')));
        out.push(C(150, T + 6, 6, F('#e8323c'), 2.5), C(122, T + 8, 5, F('#3f7fe0'), 2.5), C(178, T + 8, 5, F('#3f7fe0'), 2.5));
        break;
      case 'party':
        out.push(P(`M112 ${T + 18}L160 ${T - 92}L190 ${T + 12}Z`, F('#9b59ff')));
        out.push(L(`M128 ${T - 18}L180 ${T - 20}M144 ${T - 54}L172 ${T - 56}`, 5, '#ffd84a'));
        out.push(C(160, T - 96, 9, F('#ffd84a')));
        break;
      case 'chef':
        out.push(C(118, T - 28, 28, F('#ffffff')), C(182, T - 28, 28, F('#ffffff')), C(150, T - 48, 34, F('#ffffff')));
        out.push(R(100, T - 14, 100, 34, 6, F('#ffffff')));
        out.push(L(`M126 ${T - 8}L126 ${T + 14}M150 ${T - 8}L150 ${T + 14}M174 ${T - 8}L174 ${T + 14}`, 2.5));
        break;
      case 'pirate':
        out.push(P(`M${150 - W - 22} ${T + 26}Q110 ${T - 54} 150 ${T - 38}Q190 ${T - 54} ${150 + W + 22} ${T + 26}Q150 ${T + 6} ${150 - W - 22} ${T + 26}Z`, D('#22222a')));
        out.push(C(150, T - 10, 9, F('#ffffff'), 2), L(`M138 ${T + 6}L162 ${T - 2}M138 ${T - 2}L162 ${T + 6}`, 3, '#ffffff'));
        break;
      case 'propeller':
        out.push(P(`M${150 - W - 4} ${T + 34}C${150 - W - 4} ${T - 32} ${150 + W + 4} ${T - 32} ${150 + W + 4} ${T + 34}Z`, F('#3f7fe0')));
        out.push(P(`M150 ${T - 15}C${150 + W * 0.5} ${T - 14} ${150 + W + 4} ${T} ${150 + W + 4} ${T + 34}L150 ${T + 34}Z`, F('#ffd84a')));
        out.push(L(`M150 ${T - 14}L150 ${T - 34}`, 3), E(130, T - 36, 20, 6, F('#e8323c')), E(170, T - 36, 20, 6, F('#3fb65a')), C(150, T - 36, 4, INK, 0));
        break;
      case 'fez':
        out.push(P(`M118 ${T + 20}L124 ${T - 42}L176 ${T - 42}L182 ${T + 20}Z`, F('#c0392b')));
        out.push(L(`M150 ${T - 42}Q170 ${T - 50} 184 ${T - 16}`, 3, '#1d1d1d'), R(180, T - 18, 8, 14, 2, F('#f6c431'), 2));
        break;
      case 'viking': {
        const horn = (sx) => P(`M${150 + sx * (W - 8)} ${T + 14}C${150 + sx * (W + 30)} ${T + 10} ${150 + sx * (W + 40)} ${T - 30} ${150 + sx * (W + 28)} ${T - 58}C${150 + sx * (W + 16)} ${T - 30} ${150 + sx * (W - 6)} ${T - 10} ${150 + sx * (W - 26)} ${T - 2}Z`, F('#f2e6c8'));
        out.push(horn(-1), horn(1));
        out.push(P(`M${150 - W - 4} ${T + 40}C${150 - W - 4} ${T - 32} ${150 + W + 4} ${T - 32} ${150 + W + 4} ${T + 40}Z`, F('#9aa3ad')));
        out.push(R(150 - W - 8, T + 30, 2 * W + 16, 14, 4, F('#c49a2c')), L(`M150 ${T - 18}L150 ${T + 30}`, 3));
        break;
      }
      case 'toast': {
        const d = `M106 ${T + 14}L104 ${T - 26}C86 ${T - 34} 92 ${T - 70} 120 ${T - 66}C136 ${T - 82} 164 ${T - 82} 180 ${T - 66}C208 ${T - 70} 214 ${T - 34} 196 ${T - 26}L194 ${T + 14}Z`;
        out.push(P(d, F('#c98a42')));
        if (!line) out.push(`<path d="${d}" fill="#f3d08a" transform="translate(150 ${T - 30}) scale(.8) translate(-150 ${-(T - 30)})"/>`);
        out.push(R(130, T - 30, 26, 14, 4, F('#ffe48a'), 2));
        break;
      }
      case 'duck':
        out.push(E(146, T - 10, 42, 22, F('#ffd23f')));
        out.push(C(170, T - 42, 18, F('#ffd23f')));
        out.push(P(`M184 ${T - 46}L204 ${T - 38}L184 ${T - 32}Z`, F('#ff8a2b'), 2.5));
        out.push(C(174, T - 47, 3, INK, 0), L(`M128 ${T - 12}Q142 ${T + 2} 156 ${T - 10}`, 3));
        break;
      case 'halo':
        out.push(`<ellipse cx="150" cy="${T - 22}" rx="48" ry="11" fill="none" stroke="${INK}" stroke-width="10"/>`);
        if (!line) out.push(`<ellipse cx="150" cy="${T - 22}" rx="48" ry="11" fill="none" stroke="#ffd84a" stroke-width="5"/>`);
        break;
      case 'beret':
        out.push(P(`M${150 - W - 8} ${T + 32}C${150 - W - 16} ${T - 30} ${150 + W + 10} ${T - 38} ${150 + W + 12} ${T + 18}Q150 ${T + 42} ${150 - W - 8} ${T + 32}Z`, D('#2a2a40')));
        out.push(L(`M146 ${T - 18}L150 ${T - 30}`, 4));
        break;
      default:
    }

    const A = s.acc;
    const shirtAcc = [];
    if (A.includes('scarf')) shirtAcc.push(P('M112 316Q150 338 188 316L192 336Q150 360 108 336Z', F('#d64545')), P('M160 340L172 340L176 392L156 392Z', F('#d64545')), line ? '' : L('M120 324Q150 342 180 324', 3, '#ffffff'));
    if (A.includes('pearls')) {
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, x = (1 - t) * (1 - t) * 124 + 2 * (1 - t) * t * 150 + t * t * 176, y = (1 - t) * (1 - t) * 324 + 2 * (1 - t) * t * 360 + t * t * 324;
        shirtAcc.push(C(x.toFixed(1), y.toFixed(1), 4.5, F('#fffaf0'), 2));
      }
    }
    if (A.includes('chain')) shirtAcc.push(L('M120 324Q150 386 180 324', 4.5, '#d4a62a'), C(150, 368, 12, F('#f6c431')), L('M146 362L154 362L146 374L154 374', 2));
    if (A.includes('tie')) shirtAcc.push(P('M142 330L158 330L155 344L145 344Z', F('#2c4f9e'), 2.5), P('M145 344L139 392L150 400L161 392L155 344Z', F('#2c4f9e'), 2.5));
    if (A.includes('bowtie')) shirtAcc.push(P('M150 336L126 324L126 350Z', F('#e8323c'), 2.5), P('M150 336L174 324L174 350Z', F('#e8323c'), 2.5), C(150, 337, 6, F('#c0262f'), 2.5));
    if (A.includes('medal')) shirtAcc.push(P('M196 332L206 362L216 332Z', F('#3f7fe0'), 2.5), C(206, 370, 11, F('#f6c431'), 2.5), L('M202 370L210 370', 2));
    if (A.includes('nametag')) {
      shirtAcc.push(R(178, 346, 70, 44, 5, F('#ffffff'), 2.5), R(178, 346, 70, 14, 0, F('#e8323c'), 0), L('M178 360L248 360', 2));
      shirtAcc.push(`<text x="213" y="356" text-anchor="middle" font-size="9" font-weight="700" font-family="sans-serif" fill="${line ? INK : '#ffffff'}">HELLO</text><text x="213" y="373" text-anchor="middle" font-size="9" font-weight="700" font-family="sans-serif" fill="${INK}">NOT A</text><text x="213" y="385" text-anchor="middle" font-size="9" font-weight="700" font-family="sans-serif" fill="${INK}">SUSPECT</text>`);
    }
    out.push(...shirtAcc);
    if (A.includes('earring')) out.push(`<circle cx="${150 - W - 4}" cy="226" r="7" fill="none" stroke="${INK}" stroke-width="6"/>`, line ? '' : `<circle cx="${150 - W - 4}" cy="226" r="7" fill="none" stroke="#f6c431" stroke-width="3"/>`);
    if (A.includes('flower')) out.push(...[0, 72, 144, 216, 288].map((a) => C((150 - W - 8 + Math.cos(a * Math.PI / 180) * 9).toFixed(1), (166 + Math.sin(a * Math.PI / 180) * 9).toFixed(1), 6, F('#ffffff'), 2)), C(150 - W - 8, 166, 5, F('#ffd84a'), 2));
    if (A.includes('headphones')) out.push(L(`M${150 - W - 10} 196C${150 - W - 14} ${T - 44} ${150 + W + 14} ${T - 44} ${150 + W + 10} 196`, 8, '#3a3a42'), R(150 - W - 22, 176, 22, 46, 9, K('#3a3a42')), R(150 + W, 176, 22, 46, 9, K('#3a3a42')));
    if (A.includes('pipe')) out.push(L('M166 266L196 280', 5, '#5b3518'), P('M190 274L192 300Q204 308 216 300L218 274Z', F('#7a4a2a')), line ? '' : L('M206 266Q200 256 208 248Q214 240 208 230', 2.5, '#b9b9b9'));
    if (A.includes('rose')) out.push(L('M108 262L180 262', 4, '#2f7f35'), P('M124 262Q130 252 138 258Q132 266 124 262Z', F('#3fb65a'), 2), C(104, 262, 13, F('#e8323c')), L('M104 262Q98 256 104 252Q112 254 108 264', 2));
    if (A.includes('lollipop')) out.push(L('M160 266L206 244', 4, '#ffffff'), L('M160 266L206 244', 1.5), C(214, 240, 17, F('#ff86bd')), L('M214 240m-6 0a6 6 0 1 0 6 -6a10 10 0 1 0 10 10', 2.5));
    if (A.includes('snail')) out.push(P('M180 254Q192 260 214 256L210 250Q196 252 186 248Z', F('#c9b08a'), 2.5), C(200, 240, 11, F('#d98b4a'), 2.5), L('M200 240m-4 0a4 4 0 1 0 4 -4', 2), L('M184 250L178 238M188 250L186 236', 2));
    if (A.includes('baguette')) out.push(P('M38 404L96 300Q106 288 116 298L64 408Z', F('#e0a35a')), L('M70 360L84 362M80 340L94 342M90 320L104 322', 2.5));
    if (A.includes('parrot')) {
      out.push(P('M236 326L252 386L264 378Z', F('#3f7fe0'), 3));
      out.push(E(242, 300, 19, 32, F('#3fb65a')));
      out.push(`<g transform="rotate(-12 250 304)">${E(252, 304, 9, 21, F('#2a8a46'), 3)}</g>`);
      out.push(C(236, 266, 17, F('#e8323c')));
      out.push(P('M222 262Q206 270 216 284Q220 276 226 274Z', F('#ffd23f'), 3));
      out.push(C(232, 262, 3, INK, 0), L('M236 332L232 340M246 332L246 340', 3));
    }
    if (A.includes('cat')) {
      out.push(L('M28 330Q14 300 30 290', 7, '#8d939a'));
      out.push(E(70, 322, 36, 20, F('#9aa3ad')));
      out.push(P('M48 286L52 260L64 278Z', F('#9aa3ad'), 3), P('M76 278L88 260L92 286Z', F('#9aa3ad'), 3));
      out.push(C(70, 290, 22, F('#9aa3ad')));
      out.push(C(62, 288, 3, INK, 0), C(78, 288, 3, INK, 0), L('M66 296L70 299L74 296M50 296L38 292M50 300L38 302M90 296L102 292M90 300L102 302', 2));
    }

    out.push('</g>');
    return out.join('');
  }

  function svg(spec, opt = {}) {
    const label = opt.label ? ` role="img" aria-label="${opt.label}"` : ' aria-hidden="true"';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"${label}>${render(spec, opt)}</svg>`;
  }

  window.SketchFace = { parse, render, svg, NAMES, HEADS };
})();
