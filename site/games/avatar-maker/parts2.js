(() => {
  const P = window.FACE_PARTS;
  const { shade, star, heartPath, stroke, base, eyeBall, EL, ER } = P;
  const ink = '#1d1412';

  P.COLORS.skin.push('#fff0e6', '#c58c5c', '#3a2416', '#7fd1c1', '#ffd36e', '#c9c9c9');
  P.COLORS.hair.push('#5a3a8a', '#ff9f43', '#7fd1c1', '#e8e1d0', '#8b2e2e');
  P.COLORS.eye.push('#c98b2a', '#1d1b19', '#4fb3d9', '#ff6fb5');
  P.COLORS.bg.push('#b8f2e6', '#ffe5ec', '#ffcb77', '#a0c4ff', '#9bf6ff', '#caffbf', '#3a0ca3', '#ff7b54');
  P.COLORS.shirt.push('#ffcb77', '#a0c4ff', '#3a0ca3', '#c1121f', '#606c38', '#e9edc9');
  P.COLORS.hat.push('#ff9fb3', '#a0c4ff', '#606c38', '#c1121f', '#bfbfbf', '#7fd1c1');
  P.COLORS.glasses.push('#8e5cff', '#2a9d8f', '#f4f4f4', '#ff9f43');

  Object.assign(P.SHAPES, {
    pear: { name: 'Pear', ear: 112, el: '<path d="M200 296 C140 296 104 262 106 214 C108 160 134 92 200 90 C266 92 292 160 294 214 C296 262 260 296 200 296Z"/>' },
    diamond: { name: 'Diamond', ear: 116, el: '<path d="M200 294 C176 294 126 248 112 196 C108 170 134 112 168 94 C188 84 212 84 232 94 C266 112 292 170 288 196 C274 248 224 294 200 294Z"/>' },
    wide: { name: 'Wide', ear: 96, el: '<ellipse cx="200" cy="196" rx="106" ry="94"/>' },
    bean: { name: 'Bean', ear: 112, el: '<path d="M200 296 C150 296 108 266 106 214 C104 168 120 150 120 120 C122 96 150 84 200 84 C250 84 286 100 290 150 C294 186 296 210 292 236 C284 274 246 296 200 296Z"/>' },
    kitty: { name: 'Kitty', ear: 0, earType: 'cat', el: '<ellipse cx="200" cy="194" rx="96" ry="98"/>', extra: () => `<g ${stroke('#3b2a20', 2.5)} opacity=".6"><path d="M130 232 L92 224 M130 240 L94 244 M270 232 L308 224 M270 240 L306 244"/></g>` },
    bear: { name: 'Bear', ear: 0, earType: 'bear', el: '<ellipse cx="200" cy="196" rx="98" ry="96"/>', extra: (sk) => `<ellipse cx="200" cy="240" rx="40" ry="30" fill="${shade(sk, .3)}"/>` },
    robot: { name: 'Robot', ear: 110, earType: 'bolt', el: '<rect x="110" y="88" width="180" height="202" rx="30"/>', extra: (sk) => `<g fill="${shade(sk, -.18)}"><circle cx="126" cy="104" r="4"/><circle cx="274" cy="104" r="4"/><circle cx="126" cy="274" r="4"/><circle cx="274" cy="274" r="4"/></g>` }
  });

  const CAPF = 'M104 196 C96 104 150 74 200 74 C250 74 304 104 296 196 C290 152 272 128 240 120 C214 132 174 132 150 122 C124 134 110 160 104 196Z';
  const SLICKF = 'M108 180 C100 100 150 78 200 78 C250 78 300 100 292 180 C280 136 250 116 200 116 C150 116 120 136 108 180Z';
  const CURTAIN = 'M104 210 C94 100 150 72 200 76 C250 72 306 100 296 210 C290 160 270 130 236 120 C222 116 208 108 200 96 C192 108 178 116 164 120 C130 130 110 160 104 210Z';
  Object.assign(P.HAIR, {
    fringe: { name: 'Fringe', back: (c) => `<path d="M98 190 C88 96 150 70 200 70 C250 70 312 96 302 190 L304 296 Q300 306 288 304 L112 304 Q100 306 96 296Z" fill="${c}"/>`, front: (c) => `<path d="M104 200 C94 100 150 70 200 70 C250 70 306 100 296 200 C294 176 290 156 286 150 L114 150 C110 156 106 176 104 200Z" fill="${c}"/><g ${stroke(shade(c, -.2), 2.5)}><path d="M150 150 L154 126 M200 150 V124 M250 150 L246 126"/></g>` },
    curtains: { name: 'Curtains', front: (c) => `<path d="${CURTAIN}" fill="${c}"/>` },
    mullet: { name: 'Mullet', back: (c) => `<path d="M112 170 L102 318 Q132 336 160 314 L176 300 L224 300 L240 314 Q268 336 298 318 L288 170Z" fill="${c}"/>`, front: (c) => `<path d="${CAPF}" fill="${c}"/>` },
    braids: { name: 'Braids', back: (c) => `<path d="M100 196 C90 96 150 70 200 70 C250 70 310 96 300 196Z" fill="${c}"/>${[112, 288].map((x) => `<g fill="${c}" stroke="${shade(c, -.3)}" stroke-width="2">${[230, 256, 282, 308, 334].map((y, i) => `<ellipse cx="${x}" cy="${y}" rx="${16 - i}" ry="15"/>`).join('')}</g><rect x="${x - 9}" y="350" width="18" height="10" rx="4" fill="#ff6fb5"/>`).join('')}`, front: (c) => `<path d="${CURTAIN}" fill="${c}"/>` },
    locs: { name: 'Locs', back: (c) => `<g ${stroke(c, 18)}>${[108, 126, 144, 256, 274, 292].map((x, i) => `<path d="M${x} 130 Q${x + (i < 3 ? -14 : 14)} 220 ${x + (i < 3 ? -6 : 6)} ${300 + (i % 3) * 12}"/>`).join('')}</g>`, front: (c) => `<path d="${SLICKF}" fill="${c}"/><g ${stroke(c, 16)}><path d="M150 112 Q140 140 138 168"/><path d="M250 112 Q260 140 262 168"/><path d="M178 104 Q170 124 168 142"/><path d="M222 104 Q230 124 232 142"/></g><g ${stroke(shade(c, -.25), 2)}>${[150, 178, 222, 250].map((x) => `<path d="M${x - 6} 124 h12 M${x - 6} 138 h12"/>`).join('')}</g>` },
    wavy: { name: 'Wavy', back: (c) => `<path d="M96 196 C84 94 150 66 200 66 C250 66 316 94 304 196 C318 230 296 250 312 280 C326 306 300 330 312 360 L88 360 C100 330 74 306 88 280 C104 250 82 230 96 196Z" fill="${c}"/>`, front: (c) => `<path d="M104 206 C92 100 150 70 206 72 C266 74 308 110 296 206 C288 160 266 128 226 118 C196 132 150 132 132 150 C116 166 108 184 104 206Z" fill="${c}"/>` },
    pixie: { name: 'Pixie', front: (c) => `<path d="M106 200 C96 110 140 76 200 74 C260 76 304 110 294 186 C288 150 270 126 240 118 L250 140 L220 124 L226 150 L190 126 C160 132 132 150 118 176 Z" fill="${c}"/>` },
    flattop: { name: 'Flat top', front: (c) => `<path d="M112 178 L108 66 Q200 56 292 66 L288 178 C276 132 250 118 200 118 C150 118 124 132 112 178Z" fill="${c}"/><path d="M110 66 Q200 56 290 66" ${stroke(shade(c, .25), 4)}/>` },
    receding: { name: 'Receding', front: (c) => `<g fill="${c}"><path d="M106 196 C100 150 108 126 126 112 C130 140 126 168 112 200Z"/><path d="M294 196 C300 150 292 126 274 112 C270 140 274 168 288 200Z"/></g><path d="M170 92 Q200 80 230 92" ${stroke(c, 6)} opacity=".5"/>` },
    undercut: { name: 'Undercut', front: (c) => `<path d="M110 170 C108 100 150 84 200 84 C250 84 292 100 290 170 C276 130 250 114 200 114 C150 114 124 130 110 170Z" fill="${c}" opacity=".45"/><path d="M118 132 C120 70 180 46 240 54 C290 62 306 96 290 132 C270 106 240 98 200 102 C164 104 138 116 118 132Z" fill="${c}"/>` },
    messy: { name: 'Bedhead', front: (c) => `<path d="M104 196 L98 140 L116 146 L110 100 L140 110 L146 70 L172 92 L196 56 L212 88 L246 62 L250 100 L284 88 L278 128 L304 132 L296 196 C282 146 244 124 200 124 C156 124 118 146 104 196Z" fill="${c}"/><path d="M196 56 Q190 30 172 26" ${stroke(c, 6)}/>` },
    emo: { name: 'Side fringe', back: (c) => `<path d="M100 190 C90 96 150 70 200 70 C250 70 310 96 300 190 L302 250 L98 250Z" fill="${c}"/>`, front: (c) => `<path d="M104 200 C92 100 150 70 210 72 C270 74 308 110 296 196 C290 150 270 126 250 120 C240 170 210 200 148 216 C170 190 180 160 176 130 C140 140 116 166 104 200Z" fill="${c}"/>` },
    puffs: { name: 'Puffs', back: (c) => `<g fill="${c}"><circle cx="104" cy="104" r="52"/><circle cx="296" cy="104" r="52"/></g><g fill="${shade(c, .2)}" opacity=".5"><circle cx="92" cy="90" r="14"/><circle cx="284" cy="90" r="14"/></g>`, front: (c) => `<path d="${SLICKF}" fill="${c}"/>` },
    spacebuns: { name: 'Space buns', back: (c) => `<g fill="${c}"><circle cx="128" cy="76" r="36"/><circle cx="272" cy="76" r="36"/></g><g ${stroke(shade(c, -.25), 3)}><path d="M110 70 Q128 58 146 70"/><path d="M254 70 Q272 58 290 70"/></g>`, front: (c) => `<path d="${SLICKF}" fill="${c}"/>` },
    manbun: { name: 'Top knot', back: (c) => `<ellipse cx="200" cy="58" rx="28" ry="22" fill="${c}"/><rect x="186" y="74" width="28" height="10" rx="4" fill="${shade(c, -.35)}"/>`, front: (c) => `<path d="${SLICKF}" fill="${c}"/><g ${stroke(shade(c, -.2), 2.5)}><path d="M150 100 Q170 90 190 84 M210 84 Q232 90 252 100"/></g>` }
  });

  const both = (f) => [EL, ER].map((p, i) => f(p[0], p[1], i)).join('');
  Object.assign(P.EYES, {
    cat: { name: 'Cat', draw: (s) => both((x, y) => `<path d="M${x - 17} ${y} Q${x} ${y - 18} ${x + 17} ${y} Q${x} ${y + 18} ${x - 17} ${y}Z" fill="#e6f27a" stroke="${ink}" stroke-width="2.5"/><ellipse cx="${x}" cy="${y}" rx="3.5" ry="11" fill="${ink}"/>`) },
    tired: { name: 'Tired', draw: (s) => eyeBall(EL, s.eyeC, 13) + eyeBall(ER, s.eyeC, 13) + both((x, y) => `<path d="M${x - 14} ${y + 16} Q${x} ${y + 24} ${x + 14} ${y + 16}" ${stroke(shade(s.skin, -.35), 3)}/><path d="M${x - 16} ${y - 6} L${x + 16} ${y - 6} L${x + 16} ${y - 18} L${x - 16} ${y - 18}Z" fill="${s.skin}"/><path d="M${x - 15} ${y - 6} H${x + 15}" ${stroke(ink, 3)}/>`) },
    side: { name: 'Side-eye', draw: (s) => both((x, y) => `<ellipse cx="${x}" cy="${y}" rx="17" ry="13" fill="#fff"/><circle cx="${x + 8}" cy="${y + 1}" r="8" fill="${s.eyeC}"/><circle cx="${x + 9}" cy="${y + 1}" r="4" fill="#141010"/><path d="M${x - 18} ${y - 4} L${x + 18} ${y - 4} L${x + 18} ${y - 16} L${x - 18} ${y - 16}Z" fill="${s.skin}"/><path d="M${x - 17} ${y - 4} H${x + 17}" ${stroke(ink, 3)}/>`) },
    rolling: { name: 'Eye roll', draw: (s) => both((x, y) => `<circle cx="${x}" cy="${y}" r="16" fill="#fff"/><circle cx="${x + 3}" cy="${y - 9}" r="7" fill="${s.eyeC}"/><circle cx="${x + 3}" cy="${y - 10}" r="3.5" fill="#141010"/>`) },
    wide: { name: 'Shocked', draw: () => both((x, y) => `<circle cx="${x}" cy="${y}" r="19" fill="#fff" stroke="${ink}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="3.5" fill="#141010"/>`) },
    anime: { name: 'Anime', draw: (s) => both((x, y) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="20" fill="${ink}"/><ellipse cx="${x}" cy="${y + 6}" rx="11" ry="10" fill="${s.eyeC}" opacity=".9"/><circle cx="${x - 5}" cy="${y - 8}" r="6" fill="#fff"/><circle cx="${x + 6}" cy="${y + 8}" r="3" fill="#fff"/><path d="M${x - 18} ${y - 18} Q${x} ${y - 26} ${x + 18} ${y - 16}" ${stroke(ink, 4)}/>`) },
    crying: { name: 'Sobbing', draw: () => both((x, y) => `<path d="M${x - 14} ${y + 2} Q${x} ${y - 10} ${x + 14} ${y + 2}" ${stroke(ink, 5)}/><path d="M${x - 6} ${y + 6} Q${x - 10} ${y + 50} ${x - 4} ${y + 80} L${x + 6} ${y + 80} Q${x + 10} ${y + 50} ${x + 6} ${y + 6}Z" fill="#8ecae6" opacity=".8"/>`) },
    spiral: { name: 'Spiral', draw: () => both((x, y) => `<circle cx="${x}" cy="${y}" r="17" fill="#fff"/><path d="M${x} ${y} m-2 0 a2 2 0 1 1 4 0 a5 5 0 1 1 -9 1 a8 8 0 1 1 15 -2 a11 11 0 1 1 -21 3" ${stroke(ink, 2.5)}/>`) },
    money: { name: 'Money', draw: () => both((x, y) => `<circle cx="${x}" cy="${y}" r="17" fill="#fff"/><text x="${x}" y="${y + 9}" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="26" fill="#1f9d55">$</text>`) },
    laser: { name: 'Laser', draw: () => both((x, y) => `<circle cx="${x}" cy="${y}" r="20" fill="#ff2d2d" opacity=".25"/><circle cx="${x}" cy="${y}" r="13" fill="#ff2d2d"/><circle cx="${x}" cy="${y}" r="6" fill="#fff3b0"/>`) },
    squint: { name: 'Squint', draw: () => `<g ${stroke(ink, 5)}><path d="M152 180 L178 192 L152 202"/><path d="M248 180 L222 192 L248 202"/></g>` },
    cyclops: { name: 'Cyclops', draw: (s) => eyeBall([200, 186], s.eyeC, 30) + `<path d="M168 168 Q200 146 232 168" ${stroke(ink, 4)}/>` }
  });

  Object.assign(P.BROWS, {
    raised: { name: 'Raised', draw: (c) => `<g ${stroke(c, 6)}><path d="M148 152 Q166 132 184 148"/><path d="M216 148 Q234 132 252 152"/></g>` },
    sad: { name: 'Sad', draw: (c) => `<g ${stroke(c, 6)}><path d="M150 166 Q168 156 184 146"/><path d="M216 146 Q232 156 250 166"/></g>` },
    flat: { name: 'Flat', draw: (c) => `<g ${stroke(c, 7)}><path d="M150 160 H182"/><path d="M218 160 H250"/></g>` },
    dots: { name: 'Dots', draw: (c) => `<g fill="${c}"><ellipse cx="166" cy="152" rx="9" ry="6"/><ellipse cx="234" cy="152" rx="9" ry="6"/></g>` },
    zigzag: { name: 'Zigzag', draw: (c) => `<g ${stroke(c, 5)}><path d="M148 162 L156 154 L164 162 L172 154 L182 160"/><path d="M218 160 L228 154 L236 162 L244 154 L252 162"/></g>` },
    furious: { name: 'Furious', draw: (c) => `<g fill="${c}"><path d="M144 146 L190 168 L186 176 L142 158Z"/><path d="M256 146 L210 168 L214 176 L258 158Z"/></g>` }
  });

  Object.assign(P.NOSES, {
    roman: { name: 'Roman', draw: (sk) => `<path d="M196 196 Q210 206 204 216 Q214 228 208 236 Q200 240 192 234" ${stroke(shade(sk, -.35), 4)}/>` },
    tiny: { name: 'Nostrils', draw: (sk) => `<g fill="${shade(sk, -.4)}"><ellipse cx="194" cy="228" rx="3" ry="4"/><ellipse cx="206" cy="228" rx="3" ry="4"/></g>` },
    bulb: { name: 'Bulb', draw: (sk) => `<circle cx="200" cy="226" r="20" fill="${shade(sk, -.08)}" stroke="${shade(sk, -.28)}" stroke-width="3"/><circle cx="193" cy="218" r="5" fill="${shade(sk, .35)}"/>` },
    vee: { name: 'Cute', draw: (sk) => `<path d="M194 222 L200 230 L206 222" ${stroke(shade(sk, -.35), 3.5)}/>` },
    hook: { name: 'Hook', draw: (sk) => `<path d="M196 196 C214 210 222 232 208 238 Q200 240 194 232" ${stroke(shade(sk, -.35), 4)}/>` },
    rosy: { name: 'Rosy', draw: (sk) => `<circle cx="200" cy="224" r="13" fill="#ff7a8a" opacity=".55"/><circle cx="200" cy="224" r="9" fill="${shade(sk, -.12)}"/>` }
  });

  Object.assign(P.MOUTHS, {
    dgrin: { name: 'Big D', draw: (d, u) => `<path d="M168 242 H232 Q232 286 200 286 Q168 286 168 242Z" fill="#5a1f1a" stroke="${d}" stroke-width="4" stroke-linejoin="round"/><path d="M174 246 H226 V254 H174Z" fill="#fff"/><path d="M182 276 Q200 266 218 276 Q210 284 200 284 Q190 284 182 276Z" fill="#ff7a8a"/>` },
    wobbly: { name: 'Wobbly', draw: (d) => `<path d="M170 256 Q177 248 184 256 Q191 264 198 256 Q205 248 212 256 Q219 264 228 256" ${stroke(d, 5)}/>` },
    wail: { name: 'Wail', draw: (d) => `<path d="M174 276 Q176 244 200 244 Q224 244 226 276 Q200 268 174 276Z" fill="#5a1f1a" stroke="${d}" stroke-width="4" stroke-linejoin="round"/><path d="M186 270 Q200 262 214 270" ${stroke('#ff7a8a', 5)}/>` },
    cat: { name: 'Kitty', draw: (d) => `<path d="M176 250 Q188 264 200 250 Q212 264 224 250" ${stroke(d, 5)}/>` },
    lips: { name: 'Lipstick', draw: () => `<path d="M174 252 Q186 238 200 246 Q214 238 226 252 Q214 270 200 270 Q186 270 174 252Z" fill="#d6284d"/><path d="M176 252 Q200 258 224 252" ${stroke('#8f1532', 2.5)}/><ellipse cx="208" cy="261" rx="6" ry="2.5" fill="#fff" opacity=".45"/>` },
    beam: { name: 'Beam', draw: (d) => `<path d="M156 240 Q200 312 244 240 Z" fill="#fff" stroke="${d}" stroke-width="4" stroke-linejoin="round"/><g ${stroke('#ddd', 2)}><path d="M178 246 V262 M200 246 V270 M222 246 V262 M162 252 Q200 262 238 252"/></g>` },
    whistle: { name: 'Whistle', draw: (d) => `<circle cx="210" cy="256" r="8" fill="#5a1f1a" stroke="${d}" stroke-width="4"/><g ${stroke('#3d7cff', 2.5)} opacity=".7"><path d="M228 248 q6 -6 12 0 t12 0"/></g>` },
    drool: { name: 'Drool', draw: (d) => `<path d="M174 250 Q200 270 226 250" ${stroke(d, 6)}/><path d="M218 258 Q216 280 220 286 Q226 280 222 258Z" fill="#9fe6ff" stroke="#4aa3d1" stroke-width="1.5"/>` },
    braces: { name: 'Braces', draw: (d, u) => `<path d="M166 244 Q200 284 234 244Z" fill="#5a1f1a" stroke="${d}" stroke-width="4"/><path d="M170 246 H230 Q228 256 200 258 Q172 256 170 246Z" fill="#fff"/><path d="M172 251 H228" ${stroke('#9aa4ad', 2.5)}/><g fill="#7a8590">${[178, 190, 202, 214, 224].map((x) => `<rect x="${x - 2.5}" y="248" width="5" height="5" rx="1"/>`).join('')}</g>` },
    yikes: { name: 'Yikes', draw: (d) => `<rect x="166" y="242" width="68" height="28" rx="12" fill="#fff" stroke="${d}" stroke-width="4"/><g ${stroke('#c8c8c8', 2)}><path d="M166 256 H234 M183 242 V270 M200 242 V270 M217 242 V270"/></g>` },
    tiny: { name: 'Tiny', draw: (d) => `<path d="M192 254 Q200 260 208 254" ${stroke(d, 4)}/>` }
  });

  Object.assign(P.BEARDS, {
    mutton: { name: 'Mutton chops', draw: (c) => `<g fill="${c}"><path d="M110 196 C108 240 120 268 150 270 C160 260 160 244 150 236 C132 228 124 214 124 196Z"/><path d="M290 196 C292 240 280 268 250 270 C240 260 240 244 250 236 C268 228 276 214 276 196Z"/></g>` },
    pencil: { name: 'Pencil', draw: (c) => `<path d="M174 242 Q200 234 226 242" ${stroke(c, 3.5)}/>` },
    walrus: { name: 'Walrus', draw: (c) => `<path d="M160 260 C158 236 184 230 200 238 C216 230 242 236 240 260 C232 250 222 262 214 252 C208 262 192 262 186 252 C178 262 168 250 160 260Z" fill="${c}"/>` },
    wizard: { name: 'Wizard', draw: (c) => `<path d="M114 206 C112 270 150 306 180 330 L200 398 L220 330 C250 306 288 270 286 206 C280 236 262 254 240 258 C232 236 168 236 160 258 C138 254 120 236 114 206Z" fill="${c}"/><g ${stroke(shade(c, -.2), 2.5)} opacity=".6"><path d="M180 290 Q190 330 198 380 M220 290 Q210 330 202 380"/></g>` },
    anchor: { name: 'Anchor', draw: (c) => `<path d="M168 244 C178 234 194 236 200 240 C206 236 222 234 232 244 C220 242 208 246 200 246 C192 246 180 242 168 244Z" fill="${c}"/><path d="M170 266 Q170 300 200 304 Q230 300 230 266 L222 266 Q220 290 200 292 Q180 290 178 266Z" fill="${c}"/>` },
    lumberjack: { name: 'Lumberjack', draw: (c) => `<path d="M108 196 C100 300 150 338 200 338 C250 338 300 300 292 196 C286 240 264 256 240 260 C230 236 170 236 160 260 C136 256 114 240 108 196Z" fill="${c}"/>${[150, 180, 220, 250].map((x, i) => `<path d="M${x} ${284 + (i % 2) * 10} q6 12 0 24" ${stroke(shade(c, -.25), 3)}/>`).join('')}` }
  });

  Object.assign(P.GLASSES, {
    aviator: { name: 'Aviator', draw: (c) => `<g fill="#3a4b5c" fill-opacity=".75" stroke="${c}" stroke-width="3.5"><path d="M138 176 H192 Q194 214 168 214 Q140 212 138 176Z"/><path d="M208 176 H262 Q260 212 232 214 Q206 214 208 176Z"/></g><path d="M192 178 Q200 172 208 178 M138 178 L112 176 M262 178 L288 176" ${stroke(c, 3)}/><g fill="#fff" opacity=".35"><path d="M148 182 h16 l-10 14Z"/><path d="M218 182 h16 l-10 14Z"/></g>` },
    halfmoon: { name: 'Reading', draw: (c) => `<g ${stroke(c, 4)}><path d="M142 198 H190 Q190 218 166 218 Q142 218 142 198Z"/><path d="M210 198 H258 Q258 218 234 218 Q210 218 210 198Z"/><path d="M190 200 Q200 194 210 200 M142 198 L112 186 M258 198 L288 186"/></g>` },
    stars: { name: 'Stars', draw: (c) => `<g fill="#ffd166" fill-opacity=".55" stroke="${c}" stroke-width="4" stroke-linejoin="round"><path d="${star(166, 190, 30, 14)}"/><path d="${star(234, 190, 30, 14)}"/></g><path d="M192 186 L208 186" ${stroke(c, 4)}/>` },
    visor: { name: 'Visor', draw: (c) => `<path d="M118 176 Q200 160 282 176 L276 206 Q200 194 124 206Z" fill="#2db4ff" fill-opacity=".6" stroke="${c}" stroke-width="4" stroke-linejoin="round"/><path d="M140 182 Q200 172 260 182" ${stroke('#fff', 3)} opacity=".6"/>` },
    pixel: { name: 'Deal with it', draw: () => `<g fill="#111"><rect x="128" y="176" width="148" height="8"/><rect x="140" y="184" width="48" height="16"/><rect x="212" y="184" width="48" height="16"/><rect x="148" y="200" width="32" height="8"/><rect x="220" y="200" width="32" height="8"/></g><g fill="#fff"><rect x="148" y="186" width="8" height="6"/><rect x="220" y="186" width="8" height="6"/></g>` },
    rimless: { name: 'Rimless', draw: (c) => `<g fill="#cfe8ff" fill-opacity=".25" stroke="${c}" stroke-width="1.5"><rect x="142" y="174" width="48" height="34" rx="12"/><rect x="210" y="174" width="48" height="34" rx="12"/></g><path d="M190 186 Q200 180 210 186 M142 184 L112 180 M258 184 L288 180" ${stroke(c, 3)}/>` },
    patch: { name: 'Eye patch', draw: (c) => `<path d="M112 140 L288 214" ${stroke(c, 4)}/><path d="M144 174 Q166 164 188 174 Q190 204 166 210 Q142 204 144 174Z" fill="${c}"/>` },
    huge: { name: 'Oversized', draw: (c) => `<g fill="#cfe8ff" fill-opacity=".2" stroke="${c}" stroke-width="6"><circle cx="160" cy="196" r="38"/><circle cx="240" cy="196" r="38"/></g><path d="M196 190 Q200 186 204 190" ${stroke(c, 5)}/>` }
  });

  Object.assign(P.HATS, {
    bucket: { name: 'Bucket', draw: (c) => `<path d="M128 130 L140 60 Q200 44 260 60 L272 130Z" fill="${c}"/><path d="M92 138 Q200 108 308 138 L296 156 Q200 132 104 156Z" fill="${shade(c, -.15)}"/><path d="M134 116 Q200 104 266 116" ${stroke(shade(c, -.3), 3)} stroke-dasharray="6 6"/>` },
    chef: { name: 'Chef', draw: () => `<g fill="#fff" stroke="#d8d8d8" stroke-width="3"><circle cx="150" cy="60" r="38"/><circle cx="200" cy="40" r="44"/><circle cx="250" cy="60" r="38"/><rect x="132" y="70" width="136" height="64" rx="8"/></g><path d="M134 116 H266" ${stroke('#d8d8d8', 3)}/>` },
    pirate: { name: 'Pirate', draw: (c) => `<path d="M76 128 Q120 40 200 52 Q280 40 324 128 Q260 108 200 116 Q140 108 76 128Z" fill="${shade(c, -.75)}"/><path d="M90 122 Q200 92 310 122" ${stroke('#ffd166', 4)}/><circle cx="200" cy="86" r="14" fill="#fff"/><g fill="#1d1b19"><circle cx="195" cy="84" r="3"/><circle cx="205" cy="84" r="3"/></g><path d="M186 104 L214 112 M214 104 L186 112" ${stroke('#fff', 4)}/>` },
    grad: { name: 'Graduate', draw: (c) => `<path d="M126 104 L130 140 Q200 156 270 140 L274 104Z" fill="#1d1b19"/><path d="M200 46 L330 88 L200 128 L70 88Z" fill="#2a2a2a"/><path d="M200 86 L300 104 L302 150" ${stroke('#ffd166', 3)}/><path d="M296 150 h12 l-2 18 h-8Z" fill="#ffd166"/><circle cx="200" cy="86" r="5" fill="#ffd166"/>` },
    santa: { name: 'Santa', draw: () => `<path d="M112 126 C120 60 180 30 240 46 C290 60 310 100 330 150 C300 120 280 104 270 110 L288 126Z" fill="#d62828"/><circle cx="330" cy="156" r="18" fill="#fff"/><rect x="100" y="114" width="200" height="34" rx="17" fill="#fff"/>` },
    fedora: { name: 'Fedora', draw: (c) => `<path d="M138 116 C134 70 150 50 176 48 Q200 64 224 48 C250 50 266 70 262 116Z" fill="${c}"/><rect x="138" y="96" width="124" height="18" fill="${shade(c, -.4)}"/><path d="M72 120 Q200 100 328 120 Q300 140 200 138 Q100 140 72 120Z" fill="${shade(c, -.12)}"/>` },
    hardhat: { name: 'Hard hat', draw: () => `<path d="M110 132 C110 66 150 44 200 44 C250 44 290 66 290 132Z" fill="#ffc233"/><rect x="88" y="124" width="224" height="20" rx="8" fill="#e6a100"/><path d="M200 46 V124" ${stroke('#e6a100', 12)}/>` },
    bow: { name: 'Hair bow', draw: (c) => `<g fill="${c}" stroke="${shade(c, -.3)}" stroke-width="3" stroke-linejoin="round"><path d="M232 88 L196 58 Q186 96 232 88Z"/><path d="M232 88 L270 62 Q282 100 232 88Z"/></g><circle cx="232" cy="86" r="10" fill="${shade(c, -.2)}"/>` },
    propeller: { name: 'Propeller', draw: (c) => `<path d="M112 140 C112 74 150 54 200 54 C250 54 288 74 288 140Z" fill="${c}"/><g fill="#ffd166"><path d="M140 112 C140 70 170 60 200 58 V140 Z"/></g><g fill="#3d7cff"><path d="M260 112 C260 70 230 60 200 58 V140 Z" opacity=".7"/></g><path d="M200 54 V30" ${stroke('#555', 4)}/><g class="fm-prop"><ellipse cx="174" cy="28" rx="26" ry="7" fill="#ef476f"/><ellipse cx="226" cy="28" rx="26" ry="7" fill="#06d6a0"/></g><circle cx="200" cy="28" r="5" fill="#555"/>` },
    tiara: { name: 'Tiara', draw: () => `<path d="M136 112 Q200 92 264 112 L256 98 L232 100 L222 72 L210 92 L200 58 L190 92 L178 72 L168 100 L144 98Z" fill="#e8e8f0" stroke="#b0b0c0" stroke-width="3" stroke-linejoin="round"/><g fill="#ff6fb5"><circle cx="200" cy="80" r="7"/></g><g fill="#8ecae6"><circle cx="176" cy="96" r="4"/><circle cx="224" cy="96" r="4"/></g>` },
    bunny: { name: 'Bunny ears', draw: (c) => `<g fill="${c}" stroke="${shade(c, -.25)}" stroke-width="3"><ellipse cx="158" cy="44" rx="20" ry="58" transform="rotate(-12 158 44)"/><ellipse cx="242" cy="44" rx="20" ry="58" transform="rotate(12 242 44)"/></g><g fill="#ff9fb3"><ellipse cx="158" cy="48" rx="9" ry="40" transform="rotate(-12 158 48)"/><ellipse cx="242" cy="48" rx="9" ry="40" transform="rotate(12 242 48)"/></g><path d="M118 112 Q200 70 282 112" ${stroke(shade(c, -.3), 8)}/>` },
    catears: { name: 'Cat ears', draw: (c) => `<path d="M118 114 Q200 72 282 114" ${stroke('#1d1b19', 8)}/><g fill="#1d1b19"><path d="M126 108 L120 48 L172 84Z"/><path d="M274 108 L280 48 L228 84Z"/></g><g fill="${c}"><path d="M134 98 L130 64 L160 86Z"/><path d="M266 98 L270 64 L240 86Z"/></g>` },
    helmet: { name: 'Space helmet', draw: () => `<circle cx="200" cy="190" r="150" fill="#bfe9ff" fill-opacity=".22" stroke="#e8eef3" stroke-width="12"/><path d="M106 110 Q150 56 210 50" ${stroke('#fff', 10)} opacity=".7"/><circle cx="270" cy="70" r="7" fill="#fff" opacity=".8"/>` },
    sunhat: { name: 'Sun hat', draw: (c) => `<ellipse cx="200" cy="122" rx="160" ry="34" fill="#f2d48f"/><path d="M134 120 C134 64 160 44 200 44 C240 44 266 64 266 120Z" fill="#f2d48f"/><rect x="134" y="98" width="132" height="18" fill="${c}"/><g ${stroke('#d9b56a', 2)} opacity=".7"><path d="M60 122 Q200 150 340 122"/><path d="M90 116 Q200 140 310 116"/></g>` },
    antennae: { name: 'Antennae', draw: (c) => `<path d="M118 116 Q200 76 282 116" ${stroke('#1d1b19', 7)}/><g ${stroke('#1d1b19', 4)}><path d="M160 96 Q150 60 128 40"/><path d="M240 96 Q250 60 272 40"/></g><g fill="${c}"><circle cx="126" cy="38" r="14"/><circle cx="274" cy="38" r="14"/></g><g fill="#fff" opacity=".6"><circle cx="122" cy="33" r="4"/><circle cx="270" cy="33" r="4"/></g>` },
    sweatband: { name: 'Sweatband', draw: (c) => `<path d="M108 150 Q200 120 292 150 L290 172 Q200 142 110 172Z" fill="${c}"/><path d="M110 160 Q200 132 290 160" ${stroke('#fff', 4)} opacity=".7"/>` },
    flowercrown: { name: 'Flower crown', draw: () => `<path d="M110 132 Q200 92 290 132" ${stroke('#6a994e', 6)}/>${[[116, 128, '#ff6fb5'], [146, 110, '#ffd166'], [176, 100, '#fff'], [200, 98, '#ef476f'], [224, 100, '#fff'], [254, 110, '#ffd166'], [284, 128, '#ff6fb5']].map(([x, y, c]) => `<g fill="${c}">${[0, 72, 144, 216, 288].map((a) => `<circle cx="${(x + Math.cos(a * Math.PI / 180) * 7).toFixed(1)}" cy="${(y + Math.sin(a * Math.PI / 180) * 7).toFixed(1)}" r="6.5"/>`).join('')}</g><circle cx="${x}" cy="${y}" r="4" fill="#e6a100"/>`).join('')}` }
  });

  Object.assign(P.OUTFITS, {
    jacket: { name: 'Leather', draw: (c, s) => `${base('#2a2622')}<path d="M172 318 Q200 344 228 318Z" fill="${s}"/><path d="M180 322 L200 400 L220 322Z" fill="${c}"/><g fill="#3a3530"><path d="M168 318 L198 400 L176 400 L144 334Z"/><path d="M232 318 L202 400 L224 400 L256 334Z"/></g><path d="M198 400 V340" ${stroke('#bfbfbf', 2)} stroke-dasharray="3 3"/>` },
    sweater: { name: 'Knit', draw: (c, s) => `${base(c)}<path d="M168 318 Q200 352 232 318Z" fill="${s}"/><path d="M166 318 Q200 356 234 318" ${stroke(shade(c, -.2), 9)}/><g fill="${shade(c, .45)}">${[90, 130, 170, 210, 250, 290].map((x) => `<path d="${star(x, 376, 8, 3.5)}"/>`).join('')}</g><path d="M60 360 Q200 344 340 360" ${stroke(shade(c, .45), 4)}/>` },
    dress: { name: 'Sundress', draw: (c, s) => `<path d="M50 400 C56 340 110 316 200 316 C290 316 344 340 350 400Z" fill="${s}"/><path d="M80 400 C90 352 130 336 200 336 C270 336 310 352 320 400Z" fill="${c}"/><g ${stroke(c, 7)}><path d="M150 340 L154 318"/><path d="M250 340 L246 318"/></g><g fill="#fff" opacity=".6">${[120, 160, 200, 240, 280].map((x, i) => `<circle cx="${x}" cy="${370 + (i % 2) * 14}" r="5"/>`).join('')}</g>` },
    spacesuit: { name: 'Spacesuit', draw: (c, s) => `${base('#eef2f5')}<path d="M162 318 Q200 340 238 318 L240 330 Q200 354 160 330Z" fill="#9aa4ad"/><rect x="236" y="352" width="54" height="34" rx="6" fill="#cfd6dc"/><g fill="${c}"><circle cx="250" cy="368" r="5"/></g><circle cx="266" cy="368" r="5" fill="#ffd166"/><circle cx="280" cy="368" r="5" fill="#2fbf7f"/><path d="M110 354 h40 v18 h-40Z" fill="${c}"/>` },
    hero: { name: 'Hero', draw: (c, s) => `<path d="M40 400 C40 330 100 312 140 316 L260 316 C300 312 360 330 360 400Z" fill="#d62828"/>${base(c)}<path d="M172 318 Q200 340 228 318Z" fill="${s}"/><path d="M200 340 L234 356 L224 392 L176 392 L166 356Z" fill="#ffd166" stroke="${shade(c, -.3)}" stroke-width="3"/><text x="200" y="384" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="30" fill="${shade(c, -.3)}">C</text>` },
    labcoat: { name: 'Lab coat', draw: (c, s) => `${base('#f7f7f7')}<path d="M176 318 L200 348 L224 318Z" fill="${s}"/><path d="M180 322 L200 400 L220 322Z" fill="${c}"/><g fill="#e4e4e4" stroke="#cfcfcf" stroke-width="2"><path d="M170 316 L198 400 L180 400 L148 334Z"/><path d="M230 316 L202 400 L220 400 L252 334Z"/></g><rect x="252" y="356" width="34" height="26" rx="3" fill="#ececec" stroke="#cfcfcf" stroke-width="2"/><path d="M262 352 V370 M272 352 V370" ${stroke('#3d7cff', 3)}/>` },
    jersey: { name: 'Jersey', draw: (c, s) => `${base(c)}<path d="M170 318 L200 344 L230 318Z" fill="${s}"/><path d="M168 318 L200 346 L232 318" ${stroke('#fff', 6)}/><path d="M56 384 Q70 352 100 340 M344 384 Q330 352 300 340" ${stroke('#fff', 7)}/><text x="200" y="394" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="40" fill="#fff">7</text>` },
    tank: { name: 'Tank top', draw: (c, s) => `<path d="M50 400 C56 340 110 316 200 316 C290 316 344 340 350 400Z" fill="${s}"/><path d="M104 400 C110 354 140 330 150 318 Q200 362 250 318 C260 330 290 354 296 400Z" fill="${c}"/>` }
  });

  Object.assign(P.ACCS, {
    mask: { name: 'Face mask', draw: () => `<path d="M136 226 Q200 214 264 226 L258 276 Q200 300 142 276Z" fill="#cfe8ff" stroke="#9cc4ff" stroke-width="3"/><g ${stroke('#9cc4ff', 2.5)}><path d="M144 240 Q200 230 256 240 M146 256 Q200 248 254 256"/><path d="M136 228 L112 206 M264 228 L288 206"/></g>` },
    whiskers: { name: 'Whiskers', draw: () => `<g ${stroke('#1d1412', 2.5)}><path d="M150 232 L110 222 M150 240 L108 242 M150 248 L112 260"/><path d="M250 232 L290 222 M250 240 L292 242 M250 248 L288 260"/></g><path d="M194 220 L206 220 L200 228Z" fill="#1d1412"/>` },
    heartcheek: { name: 'Cheek heart', draw: () => `<path d="${heartPath(256, 226, .7)}" fill="#ff3d6e"/>` },
    pencil: { name: 'Ear pencil', draw: (s) => { const e = (P.SHAPES[s.face].ear || 112); return `<g transform="rotate(-30 ${400 - e} 170)"><rect x="${400 - e - 6}" y="120" width="12" height="80" fill="#ffc233"/><path d="M${400 - e - 6} 200 L${400 - e} 216 L${400 - e + 6} 200Z" fill="#f2d48f"/><rect x="${400 - e - 6}" y="112" width="12" height="10" fill="#ff9fb3"/></g>`; }, top: true },
    glitter: { name: 'Glitter', draw: () => `<g fill="#ffd166">${[[140, 214], [262, 214], [150, 240], [252, 240], [132, 232], [270, 232]].map(([x, y]) => `<path d="${star(x, y, 5, 2)}"/>`).join('')}</g>` },
    headset: { name: 'Headset mic', draw: (s) => { const e = (P.SHAPES[s.face].ear || 112); return `<rect x="${e - 12}" y="182" width="24" height="34" rx="10" fill="#333"/><path d="M${e} 214 Q${e + 10} 266 172 262" ${stroke('#333', 4)}/><circle cx="170" cy="262" r="7" fill="#333"/>`; }, top: true },
    browring: { name: 'Brow ring', draw: () => `<circle cx="244" cy="154" r="6" fill="none" stroke="#c9c9c9" stroke-width="3"/>` },
    bubble: { name: 'Bubblegum', draw: () => `<circle cx="200" cy="262" r="30" fill="#ff8fc8" opacity=".9"/><circle cx="190" cy="252" r="8" fill="#fff" opacity=".6"/>` },
    scarf: { name: 'Scarf', draw: () => `<path d="M150 312 Q200 340 250 312 L256 336 Q200 362 144 336Z" fill="#d62828"/><path d="M230 332 L250 400 L224 400 L214 338Z" fill="#b71f1f"/><g ${stroke('#fff', 4)} opacity=".7"><path d="M160 326 Q200 344 240 326"/></g>` },
    badge: { name: 'Pin badge', draw: () => `<circle cx="258" cy="364" r="15" fill="#ffd166" stroke="#c99a1e" stroke-width="3"/><path d="${star(258, 364, 9, 4)}" fill="#ff5a36"/>` },
    medal: { name: 'Gold medal', draw: () => `<path d="M178 318 L200 360 L222 318" ${stroke('#3d7cff', 8)}/><circle cx="200" cy="370" r="18" fill="#ffd166" stroke="#c99a1e" stroke-width="3"/><text x="200" y="377" text-anchor="middle" font-family="Arial, sans-serif" font-weight="900" font-size="18" fill="#a07400">1</text>` }
  });

  Object.assign(P.BG, {
    grid: { name: 'Graph', draw: (c, u) => `<defs><pattern id="gr${u}" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0 H0 V25" fill="none" stroke="${shade(c, -.15)}" stroke-width="1.5"/></pattern></defs><rect width="400" height="400" fill="${c}"/><rect width="400" height="400" fill="url(#gr${u})"/>` },
    checker: { name: 'Checker', draw: (c, u) => `<defs><pattern id="ck${u}" width="50" height="50" patternUnits="userSpaceOnUse"><rect width="25" height="25" fill="${shade(c, .25)}"/><rect x="25" y="25" width="25" height="25" fill="${shade(c, .25)}"/></pattern></defs><rect width="400" height="400" fill="${c}"/><rect width="400" height="400" fill="url(#ck${u})"/>` },
    waves: { name: 'Waves', draw: (c) => { let s = `<rect width="400" height="400" fill="${c}"/>`; for (let i = 0; i < 8; i++) { const y = 30 + i * 52; s += `<path d="M0 ${y} Q50 ${y - 18} 100 ${y} T200 ${y} T300 ${y} T400 ${y}" fill="none" stroke="${shade(c, .3)}" stroke-width="9" stroke-linecap="round"/>`; } return s; } },
    hearts: { name: 'Hearts', draw: (c) => { let s = `<rect width="400" height="400" fill="${c}"/><g fill="${shade(c, .35)}">`; for (let i = 0; i < 25; i++) { const x = 40 + (i % 5) * 80 + (Math.floor(i / 5) % 2) * 40, y = 40 + Math.floor(i / 5) * 80; s += `<path d="${heartPath(x % 400, y, .8)}"/>`; } return s + '</g>'; } },
    night: { name: 'Starry night', draw: (c, u) => { let s = `<defs><linearGradient id="n${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14123a"/><stop offset="1" stop-color="${shade(c, -.35)}"/></linearGradient></defs><rect width="400" height="400" fill="url(#n${u})"/><g fill="#fff">`; for (let i = 0; i < 40; i++) { s += `<circle cx="${(i * 89) % 400}" cy="${(i * 53 + i * i) % 400}" r="${1 + (i % 3) * .8}" opacity="${.4 + (i % 4) * .15}"/>`; } return s + `</g><circle cx="320" cy="70" r="26" fill="#fff3b0"/><circle cx="332" cy="62" r="24" fill="#14123a" opacity=".9"/>`; } },
    clouds: { name: 'Sky', draw: (c, u) => `<defs><linearGradient id="sk${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(c, -.1)}"/><stop offset="1" stop-color="${shade(c, .5)}"/></linearGradient></defs><rect width="400" height="400" fill="url(#sk${u})"/><g fill="#fff" opacity=".9"><circle cx="60" cy="90" r="24"/><circle cx="86" cy="80" r="30"/><circle cx="116" cy="92" r="22"/><rect x="40" y="90" width="96" height="24" rx="12"/><circle cx="300" cy="150" r="20"/><circle cx="326" cy="140" r="26"/><circle cx="352" cy="152" r="18"/><rect x="284" y="150" width="86" height="20" rx="10"/></g>` },
    bricks: { name: 'Bricks', draw: (c, u) => `<defs><pattern id="br${u}" width="80" height="40" patternUnits="userSpaceOnUse"><rect width="80" height="40" fill="${shade(c, -.25)}"/><rect x="2" y="2" width="76" height="16" rx="2" fill="${c}"/><rect x="-38" y="22" width="76" height="16" rx="2" fill="${c}"/><rect x="42" y="22" width="76" height="16" rx="2" fill="${c}"/></pattern></defs><rect width="400" height="400" fill="url(#br${u})"/>` },
    rainbow: { name: 'Rainbow', draw: (c) => `<rect width="400" height="400" fill="${shade(c, .55)}"/>${['#ef476f', '#ff9f43', '#ffd166', '#06d6a0', '#118ab2', '#8e5cff'].map((col, i) => `<circle cx="200" cy="420" r="${380 - i * 34}" fill="${col}" opacity=".85"/>`).join('')}<circle cx="200" cy="420" r="176" fill="${shade(c, .55)}"/>` },
    sunset: { name: 'Sunset', draw: (c, u) => `<defs><linearGradient id="su${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7b54"/><stop offset=".6" stop-color="#ffd166"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="400" height="400" fill="url(#su${u})"/><circle cx="200" cy="260" r="110" fill="#fff3b0" opacity=".6"/><g fill="${shade(c, -.2)}" opacity=".5"><rect y="300" width="400" height="8"/><rect y="320" width="400" height="10"/><rect y="344" width="400" height="14"/></g>` },
    halftone: { name: 'Halftone', draw: (c) => { let s = `<rect width="400" height="400" fill="${c}"/><g fill="${shade(c, -.18)}">`; for (let y = 10; y < 400; y += 22) for (let x = 10 + ((y / 22) % 2) * 11; x < 400; x += 22) { const r = 1 + 7 * (x + y) / 800; s += `<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}"/>`; } return s + '</g>'; } }
  });

  function hand(x, y, rot, kind, sk) {
    const o = shade(sk, -.3);
    const st = `fill="${sk}" stroke="${o}" stroke-width="3" stroke-linejoin="round"`;
    const fist = `<rect x="-19" y="-16" width="38" height="34" rx="13" ${st}/><path d="M-10 -14 V-4 M0 -15 V-4 M10 -14 V-4" ${stroke(o, 2.5)}/>`;
    let g = '';
    if (kind === 'open') g = `${[-15, -5, 5, 15].map((fx, i) => `<rect x="${fx - 4.5}" y="${-38 + Math.abs(i - 1.5) * 3}" width="9" height="30" rx="4.5" ${st}/>`).join('')}<rect x="-20" y="-16" width="40" height="34" rx="14" ${st}/><ellipse cx="-24" cy="2" rx="6" ry="13" transform="rotate(-30 -24 2)" ${st}/>`;
    else if (kind === 'peace') g = `<rect x="-14" y="-46" width="10" height="36" rx="5" transform="rotate(-10 -9 -12)" ${st}/><rect x="2" y="-46" width="10" height="36" rx="5" transform="rotate(10 7 -12)" ${st}/>${fist}`;
    else if (kind === 'thumb') g = `<rect x="-26" y="-40" width="12" height="32" rx="6" ${st}/>${fist}`;
    else if (kind === 'point') g = `<rect x="-6" y="-44" width="11" height="34" rx="5.5" ${st}/>${fist}`;
    else g = fist;
    return `<g transform="translate(${x} ${y}) rotate(${rot})">${g}</g>`;
  }
  function arm(path, s) { const c = s.outfitC; return `<path d="${path}" ${stroke(shade(c, -.25), 36)}/><path d="${path}" ${stroke(c, 30)}/>`; }
  const mirror = (svg) => `<g transform="translate(400 0) scale(-1 1)">${svg}</g>`;
  Object.assign(P.POSES, {
    wave: { name: 'Wave', draw: (s) => `<g class="fm-wave">${arm('M300 400 Q340 340 334 292', s)}${hand(334, 262, 12, 'open', s.skin)}</g>` },
    peace: { name: 'Peace', tilt: -4, draw: (s) => arm('M296 400 Q336 350 328 300', s) + hand(326, 278, -6, 'peace', s.skin) },
    thumbs: { name: 'Thumbs up', draw: (s) => arm('M290 400 Q320 360 316 330', s) + hand(314, 316, 0, 'thumb', s.skin) },
    double: { name: 'Double thumbs', tilt: 3, draw: (s) => arm('M290 400 Q320 360 316 330', s) + hand(314, 316, 0, 'thumb', s.skin) + mirror(arm('M290 400 Q320 360 316 330', s) + hand(314, 316, 0, 'thumb', s.skin)) },
    think: { name: 'Thinking', tilt: 6, draw: (s) => arm('M320 400 Q290 340 250 322', s) + hand(234, 312, -20, 'point', s.skin) },
    shrug: { name: 'Shrug', tilt: -6, draw: (s) => arm('M300 400 Q320 350 352 330', s) + hand(356, 312, 50, 'open', s.skin) + mirror(arm('M300 400 Q320 350 352 330', s) + hand(356, 312, 50, 'open', s.skin)) },
    flex: { name: 'Flex', draw: (s) => `<path d="M290 400 Q350 360 354 300" ${stroke(s.outfitC, 34)}/><circle cx="346" cy="336" r="26" fill="${s.outfitC}"/>` + hand(352, 274, 8, 'fist', s.skin) },
    coffee: { name: 'Coffee', draw: (s) => arm('M296 400 Q320 370 314 344', s) + `<rect x="300" y="282" width="40" height="46" rx="6" fill="#f4f4f4" stroke="#cfcfcf" stroke-width="3"/><path d="M340 292 q16 0 16 14 q0 14 -16 14" ${stroke('#cfcfcf', 5)}/><rect x="300" y="296" width="40" height="12" fill="#ff5a36"/><g class="fm-steam" ${stroke('#fff', 3)} opacity=".8"><path d="M312 274 q-6 -10 0 -18 q6 -8 0 -16"/><path d="M328 274 q-6 -10 0 -18 q6 -8 0 -16"/></g>` + hand(314, 330, 0, 'fist', s.skin) },
    icecream: { name: 'Ice cream', draw: (s) => arm('M296 400 Q324 366 320 340', s) + `<path d="M302 300 L338 300 L320 352Z" fill="#e0a96d" stroke="#b5793d" stroke-width="2"/><path d="M306 306 L334 306 M310 318 L330 318" ${stroke('#b5793d', 2)}/><circle cx="320" cy="290" r="20" fill="#ff9fb3"/><circle cx="314" cy="272" r="15" fill="#fff3d6"/><circle cx="318" cy="260" r="5" fill="#d62828"/>` + hand(320, 340, 0, 'fist', s.skin) },
    balloon: { name: 'Balloon', draw: (s) => `<path d="M336 330 Q350 200 344 130" ${stroke('#888', 2)}/><ellipse cx="344" cy="96" rx="32" ry="38" fill="#ef476f"/><path d="M338 134 l6 -6 l6 6Z" fill="#ef476f"/><ellipse cx="332" cy="82" rx="7" ry="11" fill="#fff" opacity=".45"/>` + arm('M296 400 Q330 370 334 346', s) + hand(334, 338, 0, 'fist', s.skin) },
    mic: { name: 'Karaoke', tilt: -3, draw: (s) => arm('M300 400 Q300 330 262 312', s) + `<path d="M250 300 L232 282" ${stroke('#333', 10)}/><circle cx="226" cy="274" r="14" fill="#9aa4ad" stroke="#555" stroke-width="3"/><g class="fm-notes" fill="#ff5a36"><text x="300" y="250" font-size="30" font-family="Arial, sans-serif">&#9834;</text><text x="330" y="210" font-size="24" font-family="Arial, sans-serif">&#9835;</text></g>` + hand(256, 306, -40, 'fist', s.skin) },
    selfie: { name: 'Selfie', tilt: 5, draw: (s) => arm('M300 400 Q350 330 344 270', s) + `<rect x="318" y="196" width="50" height="86" rx="9" fill="#1d1b19"/><rect x="323" y="204" width="40" height="66" rx="4" fill="#8ecae6"/><circle cx="343" cy="232" r="10" fill="${s.skin}"/>` + hand(342, 268, 0, 'fist', s.skin) },
    heart: { name: 'Big heart', draw: (s) => arm('M110 400 Q130 380 168 366', s) + arm('M290 400 Q270 380 232 366', s) + `<path d="${heartPath(200, 344, 2.6)}" fill="#ff3d6e" stroke="#c81d4e" stroke-width="3"/><ellipse cx="178" cy="324" rx="8" ry="5" fill="#fff" opacity=".5"/>` + hand(168, 362, 30, 'fist', s.skin) + hand(232, 362, -30, 'fist', s.skin) },
    book: { name: 'Bookworm', tilt: 4, draw: (s) => arm('M100 400 Q120 380 150 370', s) + arm('M300 400 Q280 380 250 370', s) + `<path d="M200 336 L130 320 L130 384 L200 398Z" fill="#fff" stroke="#3d7cff" stroke-width="6" stroke-linejoin="round"/><path d="M200 336 L270 320 L270 384 L200 398Z" fill="#fff" stroke="#3d7cff" stroke-width="6" stroke-linejoin="round"/><g ${stroke('#c8c8c8', 2)}><path d="M144 338 L188 348 M144 352 L188 362 M212 348 L256 338 M212 362 L256 352"/></g>` + hand(140, 372, 20, 'fist', s.skin) + hand(260, 372, -20, 'fist', s.skin) }
  });

  const floaty = (inner) => `<g class="fm-float">${inner}</g>`;
  Object.assign(P.FX, {
    sweat: { name: 'Sweat drop', draw: () => floaty(`<path d="M290 120 Q276 146 284 156 Q296 164 302 150 Q304 138 290 120Z" fill="#9fe6ff" stroke="#4aa3d1" stroke-width="2.5"/>`) },
    anger: { name: 'Anger mark', draw: () => floaty(`<g ${stroke('#e5383b', 7)}><path d="M286 98 Q300 112 314 98 M286 128 Q300 114 314 128 M286 98 Q300 112 286 128 M314 98 Q300 112 314 128"/></g>`) },
    zzz: { name: 'Zzz', draw: () => `<g class="fm-zzz" fill="#3d7cff" font-family="Arial, sans-serif" font-weight="900"><text x="290" y="120" font-size="26">z</text><text x="314" y="90" font-size="34">z</text><text x="344" y="54" font-size="44">Z</text></g>` },
    sparkle: { name: 'Sparkles', draw: () => `<g class="fm-twinkle" fill="#fff3b0" stroke="#e6a100" stroke-width="2">${[[70, 90, 16], [330, 110, 20], [80, 270, 12], [340, 260, 14], [300, 40, 10]].map(([x, y, r]) => `<path d="M${x} ${y - r} Q${x + 3} ${y - 3} ${x + r} ${y} Q${x + 3} ${y + 3} ${x} ${y + r} Q${x - 3} ${y + 3} ${x - r} ${y} Q${x - 3} ${y - 3} ${x} ${y - r}Z"/>`).join('')}</g>` },
    hearts: { name: 'Floating hearts', draw: () => `<g class="fm-rise" fill="#ff3d6e">${[[70, 120, 1], [330, 90, 1.3], [350, 180, .8], [56, 200, .7]].map(([x, y, k]) => `<path d="${heartPath(x, y, k)}"/>`).join('')}</g>` },
    question: { name: 'Question', draw: () => floaty(`<text x="300" y="110" font-size="72" font-family="Arial, sans-serif" font-weight="900" fill="#8e5cff" stroke="#fff" stroke-width="3" paint-order="stroke">?</text>`) },
    exclaim: { name: 'Surprise', draw: () => floaty(`<text x="306" y="110" font-size="76" font-family="Arial, sans-serif" font-weight="900" fill="#ff5a36" stroke="#fff" stroke-width="3" paint-order="stroke">!</text><g ${stroke('#ff5a36', 4)}><path d="M60 80 L84 100 M50 120 L80 124 M70 50 L90 78"/></g>`) },
    notes: { name: 'Music', draw: () => `<g class="fm-rise" fill="#118ab2" font-family="Arial, sans-serif" font-weight="900"><text x="300" y="110" font-size="42">&#9834;</text><text x="56" y="140" font-size="36">&#9835;</text><text x="340" y="190" font-size="28">&#9834;</text></g>` },
    steam: { name: 'Steam', draw: () => `<g class="fm-rise" fill="#f4f4f4" stroke="#bbb" stroke-width="2"><circle cx="96" cy="120" r="16"/><circle cx="80" cy="96" r="12"/><circle cx="304" cy="120" r="16"/><circle cx="320" cy="96" r="12"/></g>` },
    idea: { name: 'Big idea', draw: () => floaty(`<g transform="translate(320 70)"><circle r="26" fill="#ffd166" stroke="#e6a100" stroke-width="3"/><rect x="-11" y="22" width="22" height="16" rx="3" fill="#9aa4ad"/><path d="M-8 6 L0 -6 L8 6" ${stroke('#e6a100', 3)}/><g ${stroke('#ffd166', 4)}><path d="M-44 0 h-10 M44 0 h10 M0 -44 v-10 M-32 -32 l-8 -8 M32 -32 l8 -8"/></g></g>`) },
    cloud: { name: 'Rain cloud', draw: () => `<g class="fm-float"><g fill="#9aa4ad"><circle cx="160" cy="34" r="24"/><circle cx="196" cy="24" r="32"/><circle cx="236" cy="36" r="24"/><rect x="138" y="34" width="120" height="26" rx="13"/></g></g><g class="fm-rain" ${stroke('#4aa3d1', 3)}><path d="M160 70 l-4 12 M188 76 l-4 12 M216 70 l-4 12 M244 76 l-4 12"/></g>` },
    dizzy: { name: 'Dizzy stars', draw: () => `<g class="fm-orbit" fill="#ffd166" stroke="#e6a100" stroke-width="2"><ellipse cx="200" cy="80" rx="110" ry="22" fill="none" stroke="#e6a100" stroke-dasharray="6 8" opacity=".6"/>${[[100, 80], [200, 58], [300, 80], [200, 102]].map(([x, y]) => `<path d="${star(x, y, 13, 6)}"/>`).join('')}</g>` },
    blush: { name: 'Mega blush', draw: () => `<g fill="#ff3d6e" opacity=".35"><ellipse cx="146" cy="232" rx="28" ry="14"/><ellipse cx="254" cy="232" rx="28" ry="14"/></g><g ${stroke('#ff3d6e', 2.5)} opacity=".6"><path d="M130 228 l6 -8 M142 228 l6 -8 M154 228 l6 -8 M240 228 l6 -8 M252 228 l6 -8 M264 228 l6 -8"/></g>` }
  });

  Object.assign(P.MOODS, {
    happy: { name: 'Happy', eyes: 'happy', brows: 'natural', mouth: 'grin', fx: 'none' },
    joy: { name: 'Overjoyed', eyes: 'squint', brows: 'raised', mouth: 'dgrin', fx: 'sparkle' },
    love: { name: 'In love', eyes: 'hearts', brows: 'arched', mouth: 'smile', fx: 'hearts' },
    sad: { name: 'Sad', eyes: 'crying', brows: 'sad', mouth: 'wail', fx: 'cloud' },
    angry: { name: 'Angry', eyes: 'angry', brows: 'furious', mouth: 'yikes', fx: 'anger' },
    shocked: { name: 'Shocked', eyes: 'wide', brows: 'raised', mouth: 'o', fx: 'exclaim' },
    sleepy: { name: 'Sleepy', eyes: 'closed', brows: 'flat', mouth: 'drool', fx: 'zzz' },
    cool: { name: 'Cool', eyes: 'side', brows: 'skeptic', mouth: 'smirk', fx: 'none' },
    silly: { name: 'Silly', eyes: 'squint', brows: 'zigzag', mouth: 'tongue', fx: 'notes' },
    confused: { name: 'Confused', eyes: 'rolling', brows: 'skeptic', mouth: 'wobbly', fx: 'question' },
    dizzy: { name: 'Dizzy', eyes: 'spiral', brows: 'worried', mouth: 'wobbly', fx: 'dizzy' },
    rich: { name: 'Rich', eyes: 'money', brows: 'arched', mouth: 'beam', fx: 'sparkle' },
    nervous: { name: 'Nervous', eyes: 'round', brows: 'worried', mouth: 'yikes', fx: 'sweat' },
    starstruck: { name: 'Starstruck', eyes: 'stars', brows: 'raised', mouth: 'dgrin', fx: 'sparkle' },
    furious: { name: 'Fuming', eyes: 'laser', brows: 'furious', mouth: 'teeth', fx: 'steam' },
    shy: { name: 'Shy', eyes: 'closed', brows: 'sad', mouth: 'tiny', fx: 'blush' },
    genius: { name: 'Genius', eyes: 'round', brows: 'raised', mouth: 'smirk', fx: 'idea' },
    smug: { name: 'Smug', eyes: 'tired', brows: 'skeptic', mouth: 'smirk', fx: 'none' }
  });
})();
