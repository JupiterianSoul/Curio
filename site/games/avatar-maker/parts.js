window.FACE_PARTS = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  }

  const COLORS = {
    skin: ['#ffe3cc', '#f9cba5', '#eab489', '#d6a06f', '#b97a4c', '#94603a', '#6e4429', '#4b2e1c', '#a5e07f', '#9cc4ff', '#cfa8ff', '#ff9fb3'],
    hair: ['#1c1412', '#3d2618', '#6b4022', '#a8672f', '#d9a45a', '#f0d690', '#bfbfbf', '#f4f4f4', '#cc3b26', '#ff6fb5', '#3d7cff', '#2fbf7f', '#8e5cff'],
    eye: ['#3b2a20', '#6b4a2b', '#2f6fbf', '#3c8f5a', '#6f7a80', '#8e5cff', '#d64545'],
    bg: ['#ffd166', '#ef476f', '#06d6a0', '#118ab2', '#8ecae6', '#cdb4db', '#ffafcc', '#f4a261', '#2a9d8f', '#264653', '#e9edc9', '#ffffff', '#1d1b19'],
    shirt: ['#ff5a36', '#3d7cff', '#2fbf7f', '#ffd166', '#8e5cff', '#ef476f', '#1d1b19', '#f4f4f4', '#6b4022', '#2a9d8f', '#ff9fb3', '#7a8590'],
    hat: ['#ff5a36', '#3d7cff', '#2fbf7f', '#ffd166', '#8e5cff', '#1d1b19', '#f4f4f4', '#6b4022', '#ef476f', '#2a9d8f'],
    glasses: ['#1d1b19', '#7a4a24', '#d64545', '#3d7cff', '#ffd166', '#ff6fb5', '#bfbfbf', '#2fbf7f']
  };

  const EL = [166, 190], ER = [234, 190];
  const stroke = (c, w) => `fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

  const SHAPES = {
    round: { name: 'Round', ear: 108, el: '<ellipse cx="200" cy="190" rx="92" ry="102"/>' },
    oval: { name: 'Oval', ear: 118, el: '<ellipse cx="200" cy="188" rx="82" ry="106"/>' },
    square: { name: 'Square', ear: 112, el: '<rect x="112" y="90" width="176" height="200" rx="52"/>' },
    heart: { name: 'Heart', ear: 110, el: '<path d="M200 294 C168 294 116 250 110 190 C104 128 146 86 200 86 C254 86 296 128 290 190 C284 250 232 294 200 294Z"/>' },
    chubby: { name: 'Chubby', ear: 106, el: '<path d="M200 292 C128 292 102 252 104 200 C106 130 146 90 200 90 C254 90 294 130 296 200 C298 252 272 292 200 292Z"/>' },
    long: { name: 'Long', ear: 122, el: '<ellipse cx="200" cy="186" rx="78" ry="112"/>' },
    elf: { name: 'Elf', ear: 116, elf: true, el: '<ellipse cx="200" cy="190" rx="84" ry="102"/>' },
    alien: { name: 'Alien', ear: 0, el: '<path d="M200 292 C180 292 150 262 134 226 C110 200 96 160 108 128 C122 94 160 80 200 80 C240 80 278 94 292 128 C304 160 290 200 266 226 C250 262 220 292 200 292Z"/>' }
  };

  function ears(s, skin) {
    const sh = SHAPES[s.face] || SHAPES.round; if (!sh.ear && !sh.earType) return '';
    const x1 = sh.ear, x2 = 400 - sh.ear, d = shade(skin, -.12), inner = shade(skin, -.2);
    if (sh.elf) return `<g fill="${skin}" stroke="${d}" stroke-width="3"><path d="M${x1 + 6} 176 L${x1 - 40} 140 L${x1 - 6} 222 Z"/><path d="M${x2 - 6} 176 L${x2 + 40} 140 L${x2 + 6} 222 Z"/></g>`;
    if (sh.earType === 'cat') return `<g fill="${skin}" stroke="${d}" stroke-width="3" stroke-linejoin="round"><path d="M118 132 L112 46 L182 100Z"/><path d="M282 132 L288 46 L218 100Z"/></g><g fill="#ff9fb3" opacity=".7"><path d="M128 118 L124 68 L164 100Z"/><path d="M272 118 L276 68 L236 100Z"/></g>`;
    if (sh.earType === 'bear') return `<g fill="${skin}" stroke="${d}" stroke-width="3"><circle cx="124" cy="104" r="34"/><circle cx="276" cy="104" r="34"/></g><g fill="${inner}"><circle cx="126" cy="106" r="18"/><circle cx="274" cy="106" r="18"/></g>`;
    if (sh.earType === 'bolt') return `<g fill="#9aa4ad" stroke="#5f6870" stroke-width="3"><rect x="${x1 - 22}" y="170" width="26" height="46" rx="6"/><rect x="${x2 - 4}" y="170" width="26" height="46" rx="6"/></g><g ${stroke('#5f6870', 4)}><path d="M${x1 - 14} 182 H${x1 - 4} M${x1 - 14} 194 H${x1 - 4} M${x1 - 14} 206 H${x1 - 4}"/><path d="M${x2 + 4} 182 H${x2 + 14} M${x2 + 4} 194 H${x2 + 14} M${x2 + 4} 206 H${x2 + 14}"/></g><path d="M200 86 V58" ${stroke('#5f6870', 5)}/><circle cx="200" cy="52" r="10" fill="#ff5a36"/>`;
    return `<g fill="${skin}"><ellipse cx="${x1}" cy="198" rx="16" ry="23"/><ellipse cx="${x2}" cy="198" rx="16" ry="23"/></g><g ${stroke(d, 3)}><path d="M${x1 + 4} 188 q-8 8 0 18"/><path d="M${x2 - 4} 188 q8 8 0 18"/></g>`;
  }

  const BG = {
    solid: { name: 'Plain', draw: (c) => `<rect width="400" height="400" fill="${c}"/>` },
    dots: { name: 'Dots', draw: (c, u) => `<defs><pattern id="d${u}" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="4" fill="${shade(c, .35)}"/></pattern></defs><rect width="400" height="400" fill="${c}"/><rect width="400" height="400" fill="url(#d${u})"/>` },
    stripes: { name: 'Stripes', draw: (c, u) => `<defs><pattern id="s${u}" width="34" height="34" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="17" height="34" fill="${shade(c, .18)}"/></pattern></defs><rect width="400" height="400" fill="${c}"/><rect width="400" height="400" fill="url(#s${u})"/>` },
    burst: { name: 'Sunburst', draw: (c) => {
      let rays = '';
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, b = a + Math.PI / 16; rays += `M200 200 L${(200 + Math.cos(a) * 400).toFixed(1)} ${(200 + Math.sin(a) * 400).toFixed(1)} L${(200 + Math.cos(b) * 400).toFixed(1)} ${(200 + Math.sin(b) * 400).toFixed(1)}Z`; }
      return `<rect width="400" height="400" fill="${c}"/><path d="${rays}" fill="${shade(c, .22)}"/>`;
    } },
    circle: { name: 'Spotlight', draw: (c) => `<rect width="400" height="400" fill="${shade(c, .7)}"/><circle cx="200" cy="200" r="178" fill="${c}"/>` },
    fade: { name: 'Gradient', draw: (c, u) => `<defs><linearGradient id="g${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, .45)}"/><stop offset="1" stop-color="${shade(c, -.25)}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g${u})"/>` },
    confetti: { name: 'Confetti', draw: (c) => {
      const cols = ['#ffffff', '#ffd166', '#ef476f', '#06d6a0', '#118ab2'];
      let s = `<rect width="400" height="400" fill="${c}"/>`;
      for (let i = 0; i < 38; i++) { const x = (i * 97) % 400, y = (i * 61 + (i % 5) * 37) % 400, r = (i * 37) % 180; s += `<rect x="${x}" y="${y}" width="12" height="6" rx="2" fill="${cols[i % 5]}" opacity=".8" transform="rotate(${r} ${x + 6} ${y + 3})"/>`; }
      return s;
    } }
  };

  const OUTFITS = {
    tee: { name: 'T-shirt', draw: (c, s) => `${base(c)}<path d="M170 318 Q200 350 230 318Z" fill="${s}"/><path d="M168 318 Q200 352 232 318" ${stroke(shade(c, -.2), 6)}/>` },
    vneck: { name: 'V-neck', draw: (c, s) => `${base(c)}<path d="M172 318 L200 364 L228 318Z" fill="${s}"/><path d="M170 318 L200 366 L230 318" ${stroke(shade(c, -.2), 5)}/>` },
    hoodie: { name: 'Hoodie', draw: (c, s) => `${base(c)}<path d="M136 336 C150 300 250 300 264 336 C246 322 154 322 136 336Z" fill="${shade(c, -.18)}"/><path d="M172 318 Q200 344 228 318Z" fill="${s}"/><g ${stroke('#f4f4f4', 4)}><path d="M186 338 V378"/><path d="M214 338 V378"/></g><circle cx="186" cy="380" r="4" fill="#f4f4f4"/><circle cx="214" cy="380" r="4" fill="#f4f4f4"/>` },
    collar: { name: 'Shirt', draw: (c, s) => `${base(c)}<path d="M176 318 L200 346 L224 318Z" fill="${s}"/><g fill="${shade(c, .55)}" stroke="${shade(c, -.15)}" stroke-width="2"><path d="M172 314 L200 346 L178 362 L158 326Z"/><path d="M228 314 L200 346 L222 362 L242 326Z"/></g><g fill="${shade(c, -.3)}"><circle cx="200" cy="364" r="3.5"/><circle cx="200" cy="386" r="3.5"/></g>` },
    suit: { name: 'Suit', draw: (c, s) => `${base(c)}<path d="M168 318 L200 400 L232 318Z" fill="#f7f7f7"/><path d="M178 318 L200 336 L222 318Z" fill="${s}"/><path d="M194 336 L206 336 L212 386 L200 400 L188 386Z" fill="#d64545"/><path d="M194 336 L206 336 L203 346 L197 346Z" fill="#a83232"/><g fill="${shade(c, -.25)}"><path d="M166 318 L200 400 L176 400 L150 336Z"/><path d="M234 318 L200 400 L224 400 L250 336Z"/></g>` },
    turtle: { name: 'Turtleneck', draw: (c) => base(c), over: (c) => `<rect x="166" y="286" width="68" height="46" rx="14" fill="${shade(c, -.08)}"/><g ${stroke(shade(c, -.25), 2.5)}><path d="M170 298 H230"/><path d="M170 308 H230"/><path d="M170 318 H230"/></g>` },
    overalls: { name: 'Overalls', draw: (c, s) => `${base('#f4f4f4')}<path d="M170 318 Q200 348 230 318Z" fill="${s}"/><path d="M150 400 L156 352 L244 352 L250 400Z" fill="${c}"/><g fill="${c}"><path d="M140 328 L156 324 L170 356 L156 358Z"/><path d="M260 328 L244 324 L230 356 L244 358Z"/></g><circle cx="165" cy="358" r="5" fill="#ffd166"/><circle cx="235" cy="358" r="5" fill="#ffd166"/><rect x="182" y="366" width="36" height="22" rx="4" fill="${shade(c, -.15)}"/>` },
    stripes: { name: 'Stripy', draw: (c, s) => `${base('#f7f7f7')}<g fill="${c}"><path d="M70 352 C110 342 290 342 330 352 L338 366 C300 356 100 356 62 366Z"/><path d="M56 380 C100 370 300 370 344 380 L348 394 C300 384 100 384 52 394Z"/><path d="M98 330 C140 322 260 322 302 330 L316 340 C270 332 130 332 84 340Z"/></g><path d="M170 318 Q200 350 230 318Z" fill="${s}"/><path d="M168 318 Q200 352 232 318" ${stroke(c, 6)}/>` }
  };
  function base(c) { return `<path d="M50 400 C56 340 110 316 200 316 C290 316 344 340 350 400Z" fill="${c}"/>`; }

  function eyeBall([x, y], c, r = 16) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x}" cy="${y + 1}" r="${r * .56}" fill="${c}"/><circle cx="${x}" cy="${y + 1}" r="${r * .28}" fill="#141010"/><circle cx="${x + r * .25}" cy="${y - r * .25}" r="${r * .17}" fill="#fff"/>`;
  }
  const happy = ([x, y], d) => `<path d="M${x - 14} ${y + 5} Q${x} ${y - 14} ${x + 14} ${y + 5}" ${stroke(d, 6)}/>`;
  const heartPath = (x, y, s) => `M${x} ${y + 9 * s} C${x - 22 * s} ${y - 4 * s} ${x - 12 * s} ${y - 20 * s} ${x} ${y - 8 * s} C${x + 12 * s} ${y - 20 * s} ${x + 22 * s} ${y - 4 * s} ${x} ${y + 9 * s}Z`;
  function star(x, y, R, r) { let p = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; p += `${i ? 'L' : 'M'}${(x + Math.cos(a) * q).toFixed(1)} ${(y + Math.sin(a) * q).toFixed(1)}`; } return p + 'Z'; }

  const EYES = {
    round: { name: 'Round', draw: (s) => eyeBall(EL, s.eyeC) + eyeBall(ER, s.eyeC) },
    dots: { name: 'Dots', draw: () => `<g fill="#1d1412"><ellipse cx="${EL[0]}" cy="${EL[1]}" rx="8" ry="11"/><ellipse cx="${ER[0]}" cy="${ER[1]}" rx="8" ry="11"/></g><g fill="#fff"><circle cx="${EL[0] + 3}" cy="${EL[1] - 4}" r="2.5"/><circle cx="${ER[0] + 3}" cy="${ER[1] - 4}" r="2.5"/></g>` },
    happy: { name: 'Happy', draw: () => happy(EL, '#1d1412') + happy(ER, '#1d1412') },
    big: { name: 'Sparkly', draw: (s) => [EL, ER].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="18" ry="22" fill="#fff"/><ellipse cx="${x}" cy="${y + 3}" rx="13" ry="16" fill="${s.eyeC}"/><ellipse cx="${x}" cy="${y + 4}" rx="7" ry="9" fill="#141010"/><circle cx="${x + 5}" cy="${y - 4}" r="5" fill="#fff"/><circle cx="${x - 5}" cy="${y + 9}" r="2.5" fill="#fff"/>`).join('') },
    sleepy: { name: 'Sleepy', draw: (s) => [EL, ER].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 3}" rx="15" ry="10" fill="#fff"/><circle cx="${x}" cy="${y + 6}" r="7" fill="${s.eyeC}"/><circle cx="${x}" cy="${y + 6}" r="3" fill="#141010"/><path d="M${x - 18} ${y + 3} Q${x} ${y - 20} ${x + 18} ${y + 3}Z" fill="${s.skin}"/><path d="M${x - 16} ${y + 3} Q${x} ${y - 3} ${x + 16} ${y + 3}" ${stroke('#1d1412', 4)}/>`).join('') },
    wink: { name: 'Wink', draw: (s) => eyeBall(EL, s.eyeC) + happy(ER, '#1d1412') },
    angry: { name: 'Grumpy', draw: (s) => eyeBall(EL, s.eyeC, 14) + eyeBall(ER, s.eyeC, 14) + `<g fill="${s.skin}"><path d="M144 166 L190 166 L190 190 L144 174Z"/><path d="M256 166 L210 166 L210 190 L256 174Z"/></g><g ${stroke('#1d1412', 4)}><path d="M150 176 L184 188"/><path d="M250 176 L216 188"/></g>` },
    lashes: { name: 'Lashes', draw: (s) => eyeBall(EL, s.eyeC) + eyeBall(ER, s.eyeC) + `<g ${stroke('#1d1412', 3.5)}><path d="M152 180 l-8 -6 M156 175 l-5 -8 M162 173 l-2 -9"/><path d="M248 180 l8 -6 M244 175 l5 -8 M238 173 l2 -9"/></g>` },
    stars: { name: 'Starry', draw: () => `<g fill="#ffd166" stroke="#b07a00" stroke-width="2.5" stroke-linejoin="round"><path d="${star(EL[0], EL[1], 17, 7)}"/><path d="${star(ER[0], ER[1], 17, 7)}"/></g>` },
    hearts: { name: 'Love', draw: () => `<g fill="#ff3d6e"><path d="${heartPath(EL[0], EL[1], 1)}"/><path d="${heartPath(ER[0], ER[1], 1)}"/></g>` },
    dizzy: { name: 'Dizzy', draw: () => `<g ${stroke('#1d1412', 5)}>${[EL, ER].map(([x, y]) => `<path d="M${x - 10} ${y - 10} L${x + 10} ${y + 10} M${x + 10} ${y - 10} L${x - 10} ${y + 10}"/>`).join('')}</g>` },
    closed: { name: 'Calm', draw: () => `<g ${stroke('#1d1412', 5)}><path d="M152 192 Q166 200 180 192"/><path d="M220 192 Q234 200 248 192"/></g>` }
  };

  const BROWS = {
    natural: { name: 'Natural', draw: (c) => `<g ${stroke(c, 6)}><path d="M150 162 Q166 152 182 160"/><path d="M218 160 Q234 152 250 162"/></g>` },
    thick: { name: 'Bushy', draw: (c) => `<g ${stroke(c, 12)}><path d="M150 160 Q166 150 182 158"/><path d="M218 158 Q234 150 250 160"/></g>` },
    arched: { name: 'Arched', draw: (c) => `<g ${stroke(c, 5)}><path d="M148 162 Q162 140 184 156"/><path d="M216 156 Q238 140 252 162"/></g>` },
    angry: { name: 'Cross', draw: (c) => `<g ${stroke(c, 8)}><path d="M150 152 L184 166"/><path d="M216 166 L250 152"/></g>` },
    worried: { name: 'Worried', draw: (c) => `<g ${stroke(c, 7)}><path d="M150 164 L184 150"/><path d="M216 150 L250 164"/></g>` },
    skeptic: { name: 'Skeptic', draw: (c) => `<g ${stroke(c, 7)}><path d="M150 162 Q166 156 182 162"/><path d="M216 150 Q234 136 252 152"/></g>` },
    unibrow: { name: 'Unibrow', draw: (c) => `<path d="M146 162 Q166 148 200 158 Q234 148 254 162" ${stroke(c, 9)}/>` },
    thin: { name: 'Thin', draw: (c) => `<g ${stroke(c, 3)}><path d="M152 160 Q166 154 180 158"/><path d="M220 158 Q234 154 248 160"/></g>` },
    none: { name: 'None', draw: () => '' }
  };

  const NOSES = {
    button: { name: 'Button', draw: (sk) => `<circle cx="200" cy="224" r="11" fill="${shade(sk, -.13)}"/><circle cx="196" cy="220" r="3.5" fill="${shade(sk, .35)}"/>` },
    dot: { name: 'Dot', draw: (sk) => `<ellipse cx="200" cy="224" rx="7" ry="5" fill="${shade(sk, -.3)}"/>` },
    curve: { name: 'Curve', draw: (sk) => `<path d="M198 198 Q186 226 200 232 Q212 234 212 226" ${stroke(shade(sk, -.35), 4)}/>` },
    long: { name: 'Long', draw: (sk) => `<path d="M200 196 L188 236 Q200 242 212 236" ${stroke(shade(sk, -.35), 4)}/>` },
    wide: { name: 'Wide', draw: (sk) => `<path d="M184 222 Q182 236 194 234 Q200 240 206 234 Q218 236 216 222" ${stroke(shade(sk, -.35), 4)}/>` },
    pointy: { name: 'Pointy', draw: (sk) => `<path d="M200 200 L216 232 L194 232Z" fill="${shade(sk, -.1)}" stroke="${shade(sk, -.3)}" stroke-width="3" stroke-linejoin="round"/>` },
    clown: { name: 'Clown', draw: () => `<circle cx="200" cy="224" r="15" fill="#ff2d2d"/><circle cx="195" cy="218" r="4.5" fill="#ffb3b3"/>` },
    snout: { name: 'Snout', draw: (sk) => `<ellipse cx="200" cy="226" rx="20" ry="14" fill="${shade(sk, -.08)}" stroke="${shade(sk, -.3)}" stroke-width="3"/><g fill="${shade(sk, -.45)}"><ellipse cx="193" cy="226" rx="3.5" ry="5"/><ellipse cx="207" cy="226" rx="3.5" ry="5"/></g>` },
    none: { name: 'None', draw: () => '' }
  };

  const MOUTHS = {
    smile: { name: 'Smile', draw: (d) => `<path d="M172 248 Q200 274 228 248" ${stroke(d, 6)}/>` },
    grin: { name: 'Grin', draw: (d, u) => `<defs><clipPath id="m${u}"><path d="M166 244 Q200 290 234 244Z"/></clipPath></defs><path d="M166 244 Q200 290 234 244Z" fill="#5a1f1a"/><g clip-path="url(#m${u})"><rect x="160" y="240" width="80" height="12" fill="#fff"/><ellipse cx="200" cy="274" rx="18" ry="9" fill="#ff7a8a"/></g><path d="M166 244 Q200 290 234 244Z" ${stroke(d, 4)}/>` },
    laugh: { name: 'Laugh', draw: (d, u) => `<defs><clipPath id="m${u}"><path d="M162 240 L238 240 Q236 292 200 292 Q164 292 162 240Z"/></clipPath></defs><path d="M162 240 L238 240 Q236 292 200 292 Q164 292 162 240Z" fill="#5a1f1a"/><g clip-path="url(#m${u})"><rect x="160" y="238" width="80" height="13" fill="#fff"/><ellipse cx="200" cy="290" rx="26" ry="16" fill="#ff7a8a"/></g><path d="M162 240 L238 240 Q236 292 200 292 Q164 292 162 240Z" ${stroke(d, 4)}/>` },
    smirk: { name: 'Smirk', draw: (d) => `<path d="M176 256 Q208 262 230 242" ${stroke(d, 6)}/>` },
    flat: { name: 'Meh', draw: (d) => `<path d="M180 254 L220 254" ${stroke(d, 6)}/>` },
    o: { name: 'Gasp', draw: (d) => `<ellipse cx="200" cy="256" rx="12" ry="16" fill="#5a1f1a" stroke="${d}" stroke-width="4"/>` },
    tongue: { name: 'Blep', draw: (d) => `<path d="M188 252 Q188 278 200 278 Q212 278 212 252Z" fill="#ff7a8a" stroke="${d}" stroke-width="3"/><path d="M200 256 V270" ${stroke('#e0566a', 2.5)}/><path d="M174 250 Q200 262 226 250" ${stroke(d, 6)}/>` },
    frown: { name: 'Frown', draw: (d) => `<path d="M174 264 Q200 240 226 264" ${stroke(d, 6)}/>` },
    fangs: { name: 'Fangs', draw: (d) => `<path d="M176 248 Q200 264 224 248" ${stroke(d, 6)}/><g fill="#fff" stroke="${d}" stroke-width="2" stroke-linejoin="round"><path d="M182 253 L186 270 L191 256Z"/><path d="M218 253 L214 270 L209 256Z"/></g>` },
    teeth: { name: 'Bucky', draw: (d) => `<path d="M174 248 Q200 266 226 248" ${stroke(d, 6)}/><g fill="#fff" stroke="${d}" stroke-width="2.5"><rect x="189" y="255" width="11" height="14" rx="2"/><rect x="200" y="255" width="11" height="14" rx="2"/></g>` },
    kiss: { name: 'Kiss', draw: () => `<path d="M194 244 Q212 248 198 254 Q214 260 194 266" ${stroke('#d64545', 6)}/>` }
  };

  const CAP = 'M104 196 C96 104 150 74 200 74 C250 74 304 104 296 196 C290 152 272 128 240 120 C214 132 174 132 150 122 C124 134 110 160 104 196Z';
  const SLICK = 'M108 180 C100 100 150 78 200 78 C250 78 300 100 292 180 C280 136 250 116 200 116 C150 116 120 136 108 180Z';
  const HAIR = {
    bald: { name: 'Bald', front: () => '', back: () => '' },
    buzz: { name: 'Buzz', front: (c) => `<path d="M110 170 C108 100 150 84 200 84 C250 84 292 100 290 170 C276 130 250 114 200 114 C150 114 124 130 110 170Z" fill="${c}" opacity=".85"/>` },
    short: { name: 'Short', front: (c) => `<path d="${CAP}" fill="${c}"/>` },
    side: { name: 'Side part', front: (c) => `<path d="M104 202 C90 110 150 70 212 72 C270 74 308 110 296 196 C292 160 284 138 270 126 C236 134 184 124 156 102 C150 134 124 156 104 202Z" fill="${c}"/>` },
    spiky: { name: 'Spiky', front: (c) => `<path d="M104 192 L96 118 L128 128 L128 76 L160 102 L174 52 L200 94 L226 50 L240 100 L274 74 L272 128 L304 118 L296 192 C282 142 244 124 200 124 C156 124 118 142 104 192Z" fill="${c}"/>` },
    afro: { name: 'Afro', back: (c) => `<g fill="${c}"><circle cx="200" cy="150" r="126"/><circle cx="96" cy="200" r="50"/><circle cx="304" cy="200" r="50"/><circle cx="110" cy="90" r="54"/><circle cx="290" cy="90" r="54"/><circle cx="200" cy="44" r="50"/></g>`, front: (c) => `<g fill="${c}"><circle cx="128" cy="134" r="30"/><circle cx="160" cy="114" r="30"/><circle cx="200" cy="108" r="30"/><circle cx="240" cy="114" r="30"/><circle cx="272" cy="134" r="30"/></g>` },
    curly: { name: 'Curly', back: (c) => `<g fill="${c}">${[[110, 140], [96, 180], [100, 222], [114, 258], [290, 140], [304, 180], [300, 222], [286, 258], [140, 96], [180, 80], [220, 80], [260, 96]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="30"/>`).join('')}</g>`, front: (c) => `<g fill="${c}">${[[120, 150], [136, 122], [164, 108], [200, 104], [236, 108], [264, 122], [280, 150]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="22"/>`).join('')}</g>` },
    long: { name: 'Long', back: (c) => `<path d="M100 190 C90 90 150 68 200 68 C250 68 310 90 300 190 L314 370 Q300 380 270 376 L130 376 Q100 380 86 370Z" fill="${c}"/>`, front: (c) => `<path d="M104 210 C94 100 150 72 200 72 C250 72 306 100 296 210 C290 150 262 116 206 110 L200 98 L194 110 C138 116 110 150 104 210Z" fill="${c}"/>` },
    bob: { name: 'Bob', back: (c) => `<path d="M96 200 C86 96 150 68 200 68 C250 68 314 96 304 200 L306 270 Q302 284 286 282 L114 282 Q98 284 94 270Z" fill="${c}"/>`, front: (c) => `<path d="M102 196 C94 100 150 74 200 74 C250 74 306 100 298 196 L296 150 C250 156 150 156 104 150Z" fill="${c}"/>` },
    ponytail: { name: 'Ponytail', back: (c) => `<path d="M262 116 C340 110 352 210 326 300 C318 250 300 210 278 176Z" fill="${c}"/><circle cx="276" cy="122" r="12" fill="#ff5a36"/>`, front: (c) => `<path d="${SLICK}" fill="${c}"/>` },
    bun: { name: 'Bun', back: (c) => `<circle cx="200" cy="66" r="38" fill="${c}"/><path d="M180 98 Q200 88 220 98" ${stroke(shade(c, -.25), 4)}/>`, front: (c) => `<path d="${SLICK}" fill="${c}"/>` },
    pigtails: { name: 'Pigtails', back: (c) => `<g fill="${c}"><ellipse cx="88" cy="232" rx="32" ry="46"/><ellipse cx="312" cy="232" rx="32" ry="46"/></g><g fill="#ff6fb5"><circle cx="108" cy="196" r="9"/><circle cx="292" cy="196" r="9"/></g>`, front: (c) => `<path d="M104 204 C94 100 150 74 200 74 C250 74 306 100 296 204 C290 150 262 118 206 112 L200 100 L194 112 C138 118 110 150 104 204Z" fill="${c}"/>` },
    mohawk: { name: 'Mohawk', front: (c) => `<path d="M110 170 C108 100 150 84 200 84 C250 84 292 100 290 170 C276 130 250 114 200 114 C150 114 124 130 110 170Z" fill="${c}" opacity=".3"/><path d="M184 128 L172 70 L186 78 L184 34 L200 52 L210 18 L218 52 L232 40 L226 80 L238 74 L216 128Z" fill="${c}"/>` },
    swoosh: { name: 'Quiff', front: (c) => `<path d="M106 196 C96 120 128 84 166 66 C204 46 268 50 288 84 C252 70 230 82 226 96 C262 98 300 124 294 196 C288 156 262 130 220 126 C180 124 130 138 106 196Z" fill="${c}"/>` }
  };

  const BEARDS = {
    none: { name: 'None', draw: () => '' },
    stubble: { name: 'Stubble', draw: (c) => `<path d="M118 226 C126 290 168 302 200 302 C232 302 274 290 282 226 C262 262 240 272 200 272 C160 272 138 262 118 226Z M170 244 C182 236 218 236 230 244 C220 250 180 250 170 244Z" fill="${c}" opacity=".28"/>` },
    moustache: { name: 'Moustache', draw: (c) => `<path d="M166 248 C176 230 194 232 200 240 C206 232 224 230 234 248 C222 244 208 248 200 248 C192 248 178 244 166 248Z" fill="${c}"/>` },
    handlebar: { name: 'Handlebar', draw: (c) => `<path d="M152 236 C150 250 164 252 172 244 C182 234 196 234 200 240 C204 234 218 234 228 244 C236 252 250 250 248 236 C252 254 236 260 222 252 C212 248 206 250 200 250 C194 250 188 248 178 252 C164 260 148 254 152 236Z" fill="${c}"/>` },
    goatee: { name: 'Goatee', draw: (c) => `<path d="M168 246 C178 234 194 236 200 240 C206 236 222 234 232 246 C220 244 208 246 200 246 C192 246 180 244 168 246Z" fill="${c}"/><path d="M182 270 Q200 264 218 270 L212 298 Q200 306 188 298Z" fill="${c}"/>` },
    full: { name: 'Full beard', draw: (c) => `<path d="M112 200 C110 276 150 318 200 318 C250 318 290 276 288 200 C282 236 262 254 240 258 C232 236 168 236 160 258 C138 254 118 236 112 200Z" fill="${c}"/><path d="M168 278 Q200 270 232 278 Q220 292 200 292 Q180 292 168 278Z" fill="${shade(c, -.2)}" opacity=".5"/>` },
    chinstrap: { name: 'Chinstrap', draw: (c) => `<path d="M116 210 C122 270 160 300 200 300 C240 300 278 270 284 210" ${stroke(c, 10)}/>` },
    soul: { name: 'Soul patch', draw: (c) => `<path d="M192 272 L208 272 L200 286Z" fill="${c}"/>` },
    viking: { name: 'Braids', draw: (c) => `<path d="M112 200 C110 276 150 300 200 300 C250 300 290 276 288 200 C282 236 262 254 240 258 C232 236 168 236 160 258 C138 254 118 236 112 200Z" fill="${c}"/>${[180, 220].map((x) => `<g fill="${c}" stroke="${shade(c, -.3)}" stroke-width="2"><ellipse cx="${x}" cy="306" rx="9" ry="10"/><ellipse cx="${x}" cy="324" rx="8" ry="9"/><ellipse cx="${x}" cy="340" rx="7" ry="8"/></g><circle cx="${x}" cy="352" r="5" fill="#ffd166"/>`).join('')}` }
  };

  const GLASSES = {
    none: { name: 'None', draw: () => '' },
    round: { name: 'Round', draw: (c) => `<g ${stroke(c, 5)}><circle cx="166" cy="190" r="23"/><circle cx="234" cy="190" r="23"/><path d="M189 188 Q200 180 211 188"/><path d="M143 186 L112 180"/><path d="M257 186 L288 180"/></g>` },
    square: { name: 'Square', draw: (c) => `<g ${stroke(c, 5)}><rect x="140" y="172" width="52" height="38" rx="7"/><rect x="208" y="172" width="52" height="38" rx="7"/><path d="M192 186 L208 186"/><path d="M140 182 L112 178"/><path d="M260 182 L288 178"/></g>` },
    nerd: { name: 'Thick', draw: (c) => `<g ${stroke(c, 9)}><rect x="140" y="172" width="52" height="38" rx="5"/><rect x="208" y="172" width="52" height="38" rx="5"/><path d="M192 184 L208 184"/></g><rect x="194" y="179" width="12" height="9" fill="#fff" stroke="${c}" stroke-width="2"/>` },
    shades: { name: 'Shades', draw: (c) => `<g fill="#141414" stroke="${c}" stroke-width="4" stroke-linejoin="round"><path d="M136 176 L194 176 Q196 212 166 214 Q138 212 136 176Z"/><path d="M206 176 L264 176 Q262 212 234 214 Q204 212 206 176Z"/></g><path d="M194 180 L206 180 M136 178 L112 176 M264 178 L288 176" ${stroke(c, 4)}/><g fill="#fff" opacity=".45"><path d="M146 182 L160 182 L150 198Z"/><path d="M216 182 L230 182 L220 198Z"/></g>` },
    cat: { name: 'Cat-eye', draw: (c) => `<g fill="none" stroke="${c}" stroke-width="5" stroke-linejoin="round"><path d="M134 170 Q166 168 192 180 Q190 210 166 210 Q142 208 138 186Z"/><path d="M266 170 Q234 168 208 180 Q210 210 234 210 Q258 208 262 186Z"/></g><path d="M192 184 Q200 178 208 184" ${stroke(c, 4)}/><g fill="${c}"><path d="M134 170 L124 158 L144 172Z"/><path d="M266 170 L276 158 L256 172Z"/></g>` },
    threed: { name: '3D', draw: () => `<rect x="134" y="170" width="132" height="42" rx="6" fill="#f4f4f4" stroke="#bbb" stroke-width="2"/><rect x="144" y="176" width="44" height="30" rx="4" fill="#ff2d4d" opacity=".75"/><rect x="212" y="176" width="44" height="30" rx="4" fill="#2db4ff" opacity=".75"/>` },
    hearts: { name: 'Hearts', draw: (c) => `<g fill="#ff6fb5" fill-opacity=".7" stroke="${c}" stroke-width="4" stroke-linejoin="round"><path d="${heartPath(166, 192, 1.45)}"/><path d="${heartPath(234, 192, 1.45)}"/></g><path d="M192 184 L208 184" ${stroke(c, 4)}/>` },
    monocle: { name: 'Monocle', draw: (c) => `<circle cx="234" cy="190" r="24" fill="#cfe8ff" fill-opacity=".35" stroke="#d9a45a" stroke-width="5"/><path d="M252 206 Q270 260 248 320" ${stroke('#d9a45a', 2.5)} stroke-dasharray="4 4"/>` },
    goggles: { name: 'Goggles', draw: (c) => `<path d="M110 188 L290 188" ${stroke(c, 10)}/><g fill="#9fe6ff" stroke="#5a5a5a" stroke-width="7"><circle cx="166" cy="190" r="24"/><circle cx="234" cy="190" r="24"/></g><g fill="#fff" opacity=".6"><circle cx="158" cy="182" r="6"/><circle cx="226" cy="182" r="6"/></g>` }
  };

  const HATS = {
    none: { name: 'None', draw: () => '' },
    beanie: { name: 'Beanie', draw: (c) => `<path d="M100 150 C100 70 150 44 200 44 C250 44 300 70 300 150Z" fill="${c}"/><rect x="94" y="132" width="212" height="34" rx="14" fill="${shade(c, -.15)}"/><g ${stroke(shade(c, -.3), 3)}>${[118, 146, 174, 202, 230, 258, 284].map((x) => `<path d="M${x} 138 V160"/>`).join('')}</g><circle cx="200" cy="40" r="20" fill="${shade(c, .5)}"/>` },
    cap: { name: 'Cap', draw: (c) => `<path d="M104 146 C100 72 150 52 200 52 C250 52 300 72 296 146Z" fill="${c}"/><path d="M196 140 C240 128 320 128 344 150 C320 162 250 160 196 150Z" fill="${shade(c, -.2)}"/><circle cx="200" cy="54" r="8" fill="${shade(c, -.2)}"/><path d="M200 56 V140" ${stroke(shade(c, -.15), 3)}/>` },
    top: { name: 'Top hat', draw: (c) => `<rect x="138" y="12" width="124" height="112" rx="8" fill="${c}"/><rect x="138" y="92" width="124" height="18" fill="#d64545"/><ellipse cx="200" cy="124" rx="108" ry="18" fill="${shade(c, -.15)}"/>` },
    crown: { name: 'Crown', draw: () => `<path d="M122 120 L114 50 L152 86 L176 36 L200 78 L224 36 L248 86 L286 50 L278 120Z" fill="#ffd166" stroke="#c99a1e" stroke-width="5" stroke-linejoin="round"/><g fill="#ef476f"><circle cx="200" cy="104" r="8"/></g><g fill="#118ab2"><circle cx="156" cy="106" r="6"/><circle cx="244" cy="106" r="6"/></g>` },
    cowboy: { name: 'Cowboy', draw: (c) => `<path d="M146 112 C140 54 166 34 182 50 Q200 62 218 50 C234 34 260 54 254 112Z" fill="${c}"/><rect x="146" y="96" width="108" height="12" fill="${shade(c, -.35)}"/><path d="M50 108 C80 130 140 132 200 128 C260 132 320 130 350 108 C340 140 280 152 200 150 C120 152 60 140 50 108Z" fill="${shade(c, -.1)}"/>` },
    party: { name: 'Party', draw: (c) => `<path d="M156 118 L200 8 L244 118Z" fill="${c}"/><g fill="${shade(c, .6)}"><path d="M172 78 L200 92 L228 78 L232 90 L200 104 L168 90Z"/><path d="M186 44 L200 52 L214 44 L218 56 L200 64 L182 56Z"/></g><circle cx="200" cy="10" r="12" fill="#ffd166"/><ellipse cx="200" cy="118" rx="46" ry="8" fill="${shade(c, -.2)}"/>` },
    wizard: { name: 'Wizard', draw: (c) => `<path d="M128 116 C150 80 170 40 200 8 C210 30 236 40 260 34 C236 52 250 90 272 116Z" fill="${c}"/><ellipse cx="200" cy="118" rx="112" ry="18" fill="${shade(c, -.2)}"/><g fill="#ffd166"><path d="${star(184, 76, 11, 5)}"/><path d="${star(222, 96, 7, 3)}"/><path d="${star(206, 48, 6, 2.5)}"/></g>` },
    beret: { name: 'Beret', draw: (c) => `<ellipse cx="190" cy="104" rx="104" ry="42" fill="${c}" transform="rotate(-10 190 104)"/><path d="M118 132 Q200 112 286 122" ${stroke(shade(c, -.25), 8)}/><path d="M196 62 L198 48" ${stroke(c, 7)}/>` },
    headphones: { name: 'Headphones', draw: (c) => `<path d="M100 196 C92 80 150 52 200 52 C250 52 308 80 300 196" ${stroke(c, 14)}/><g fill="${shade(c, -.2)}"><rect x="84" y="168" width="34" height="60" rx="14"/><rect x="282" y="168" width="34" height="60" rx="14"/></g><g fill="${shade(c, .4)}"><rect x="92" y="180" width="10" height="36" rx="5"/><rect x="298" y="180" width="10" height="36" rx="5"/></g>` },
    viking: { name: 'Viking', draw: () => `<path d="M104 132 C14 120 46 30 70 40 C56 70 76 106 112 104Z" fill="#f4ecd8" stroke="#c9b991" stroke-width="3"/><path d="M296 132 C386 120 354 30 330 40 C344 70 324 106 288 104Z" fill="#f4ecd8" stroke="#c9b991" stroke-width="3"/><path d="M100 140 C100 70 150 48 200 48 C250 48 300 70 300 140Z" fill="#9aa4ad"/><rect x="96" y="126" width="208" height="20" rx="8" fill="#7a8590"/><g fill="#d0d6db">${[118, 160, 200, 240, 282].map((x) => `<circle cx="${x}" cy="136" r="4"/>`).join('')}</g><rect x="194" y="50" width="12" height="80" fill="#7a8590"/>` },
    flowers: { name: 'Flowers', draw: () => [[116, 136, '#ff6fb5'], [140, 108, '#ffd166'], [170, 92, '#ef476f'], [200, 86, '#8ecae6'], [230, 92, '#ff9f43'], [260, 108, '#ff6fb5'], [284, 136, '#cdb4db']].map(([x, y, c]) => `<g fill="${c}">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 9).toFixed(1)}" cy="${(y + Math.sin(a * Math.PI / 180) * 9).toFixed(1)}" r="8"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="6" fill="#fff3b0"/>`).join('') },
    halo: { name: 'Halo', draw: () => `<ellipse cx="200" cy="52" rx="74" ry="18" fill="none" stroke="#ffd166" stroke-width="10"/><ellipse cx="200" cy="52" rx="74" ry="18" fill="none" stroke="#fff3b0" stroke-width="3"/>` },
    horns: { name: 'Horns', draw: () => `<g fill="#d64545" stroke="#a02c2c" stroke-width="3" stroke-linejoin="round"><path d="M132 112 C112 90 116 56 130 40 C134 70 150 86 160 98Z"/><path d="M268 112 C288 90 284 56 270 40 C266 70 250 86 240 98Z"/></g>` }
  };

  const ACCS = {
    blush: { name: 'Blush', draw: () => `<g fill="#ff6f8e" opacity=".35"><ellipse cx="142" cy="230" rx="18" ry="11"/><ellipse cx="258" cy="230" rx="18" ry="11"/></g>` },
    freckles: { name: 'Freckles', draw: (s) => `<g fill="${shade(s.skin, -.35)}" opacity=".7">${[[146, 218], [156, 226], [140, 228], [152, 236], [254, 218], [244, 226], [260, 228], [248, 236]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6"/>`).join('')}</g>` },
    earrings: { name: 'Earrings', draw: (s) => { const e = SHAPES[s.face].ear || 116; return `<g ${stroke('#ffd166', 4)}><circle cx="${e}" cy="230" r="9"/><circle cx="${400 - e}" cy="230" r="9"/></g>`; } },
    mole: { name: 'Beauty mark', draw: () => `<circle cx="238" cy="240" r="4" fill="#3b2a20"/>` },
    bandaid: { name: 'Band-aid', draw: () => `<g transform="rotate(-25 150 220)"><rect x="130" y="212" width="42" height="16" rx="8" fill="#f2c094"/><rect x="144" y="212" width="14" height="16" fill="#e2a874"/><g fill="#c98a5a"><circle cx="136" cy="218" r="1.3"/><circle cx="136" cy="223" r="1.3"/><circle cx="166" cy="218" r="1.3"/><circle cx="166" cy="223" r="1.3"/></g></g>` },
    nosering: { name: 'Nose ring', draw: () => `<path d="M206 230 a6 6 0 1 1 -6 8" ${stroke('#c9c9c9', 3)}/>` },
    flower: { name: 'Ear flower', draw: (s) => { const x = (SHAPES[s.face].ear || 120) + 4; return `<g fill="#ff6fb5">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 11).toFixed(1)}" cy="${(176 + Math.sin(a * Math.PI / 180) * 11).toFixed(1)}" r="10"/>`).join('')}</g><circle cx="${x}" cy="176" r="7" fill="#ffd166"/>`; } },
    sticker: { name: 'Star sticker', draw: () => `<path d="${star(258, 150, 13, 6)}" fill="#ffd166" stroke="#c99a1e" stroke-width="2"/>` },
    bowtie: { name: 'Bow tie', draw: () => `<path d="M200 330 L168 314 L168 346Z M200 330 L232 314 L232 346Z" fill="#d64545" stroke="#a02c2c" stroke-width="3" stroke-linejoin="round"/><rect x="192" y="322" width="16" height="16" rx="4" fill="#a02c2c"/>` },
    necklace: { name: 'Necklace', draw: () => `<path d="M168 318 Q200 360 232 318" ${stroke('#ffd166', 3)}/><path d="M200 340 l8 10 l-8 10 l-8 -10Z" fill="#8ecae6" stroke="#ffd166" stroke-width="2"/>` },
    scar: { name: 'Scar', draw: () => `<g ${stroke('#b0524a', 3)}><path d="M248 158 L222 214"/><path d="M234 176 l10 5 M228 190 l10 5 M240 166 l9 4"/></g>` },
    paint: { name: 'Face paint', draw: () => `<g fill="#3d7cff" opacity=".8"><path d="M128 214 L162 208 L160 214 L128 222Z"/><path d="M130 228 L162 220 L160 226 L132 236Z"/><path d="M272 214 L238 208 L240 214 L272 222Z"/><path d="M270 228 L238 220 L240 226 L268 236Z"/></g>` },
    tear: { name: 'Single tear', draw: () => `<path d="M152 206 Q144 222 152 228 Q160 222 152 206Z" fill="#8ecae6" stroke="#4aa3d1" stroke-width="2"/>` }
  };

  const POSES = { none: { name: 'None', draw: () => '' } };
  const FX = { none: { name: 'None', draw: () => '' } };
  const MOODS = {};
  const BODY_ACCS = ['bowtie', 'necklace', 'scarf', 'badge', 'medal'];
  const OVER_BEARD = ['full', 'viking', 'stubble', 'chinstrap', 'lumberjack', 'wizard', 'mutton'];

  let uidN = 0;
  function render(s, opts = {}) {
    const u = 'f' + (++uidN);
    const skin = s.skin, hc = s.hairC;
    const mouthC = shade(skin, -.6), browC = s.hair === 'bald' ? shade(skin, -.55) : shade(hc, -.2);
    const st = Object.assign({}, s, { skin });
    const hair = HAIR[s.hair] || HAIR.short;
    const face = SHAPES[s.face] || SHAPES.round;
    const outfit = OUTFITS[s.outfit] || OUTFITS.tee;
    const pose = POSES[s.pose] || POSES.none;
    const tilt = pose.tilt || 0;
    const beard = BEARDS[s.beard] || BEARDS.none;
    const accs = (s.acc || []).filter((k) => ACCS[k]);
    const head = [
      ears(s, skin),
      `<g fill="${skin}">${face.el}</g>`,
      face.extra ? face.extra(skin) : '',
      OVER_BEARD.includes(s.beard) ? beard.draw(shade(hc, -.08)) : '',
      (NOSES[s.nose] || NOSES.button).draw(skin),
      (MOUTHS[s.mouth] || MOUTHS.smile).draw(mouthC, u),
      OVER_BEARD.includes(s.beard) ? '' : beard.draw(shade(hc, -.08)),
      `<g class="fm-eyes">${(EYES[s.eyes] || EYES.round).draw(st)}</g>`,
      (BROWS[s.brows] || BROWS.natural).draw(browC),
      accs.filter((k) => !BODY_ACCS.includes(k) && !ACCS[k].top).map((k) => ACCS[k].draw(st)).join(''),
      hair.front ? hair.front(hc) : '',
      accs.filter((k) => ACCS[k].top).map((k) => ACCS[k].draw(st)).join(''),
      (GLASSES[s.glasses] || GLASSES.none).draw(s.glassesC),
      (HATS[s.hat] || HATS.none).draw(s.hatC)
    ];
    const parts = [
      (BG[s.bg] || BG.solid).draw(s.bgC, u),
      pose.back ? pose.back(st) : '',
      outfit.draw(s.outfitC, skin),
      hair.back ? `<g transform="rotate(${tilt} 200 300)">${hair.back(hc)}</g>` : '',
      `<rect x="172" y="250" width="56" height="74" rx="10" fill="${skin}"/><rect x="172" y="262" width="56" height="26" fill="#000" opacity=".1"/>`,
      outfit.over ? outfit.over(s.outfitC) : '',
      `<g class="fm-head" transform="rotate(${tilt} 200 300)">${head.join('')}</g>`,
      accs.filter((k) => BODY_ACCS.includes(k)).map((k) => ACCS[k].draw(st)).join(''),
      pose.draw(st),
      `<g class="fm-fx">${(FX[s.fx] || FX.none).draw(st)}</g>`
    ];
    const vb = opts.viewBox || '0 0 400 400';
    const size = opts.size ? ` width="${opts.size}" height="${opts.size}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"${size}${opts.label ? ` role="img" aria-label="${opts.label}"` : ' aria-hidden="true"'}>${parts.join('')}</svg>`;
  }

  return { COLORS, SHAPES, BG, OUTFITS, EYES, BROWS, NOSES, MOUTHS, HAIR, BEARDS, GLASSES, HATS, ACCS, POSES, FX, MOODS, render, shade, star, heartPath, stroke, base, eyeBall, EL, ER };
})();
