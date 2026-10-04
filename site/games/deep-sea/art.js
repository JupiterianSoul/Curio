(function () {
  const svg = (w, h, inner, label) =>
    `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || ''}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const eye = (x, y, r = 3.4, glow) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${glow || '#fff'}"/><circle cx="${x - r * 0.25}" cy="${y}" r="${r * 0.55}" fill="#111"/>`;

  const A = {};

  A.jelly = (c = '#f6c8ec', label) => svg(100, 110, `
    <path d="M14 46 Q14 8 50 8 Q86 8 86 46 Q76 52 68 46 Q59 54 50 46 Q41 54 32 46 Q23 52 14 46Z" fill="${c}" opacity=".85"/>
    <path d="M30 30 q6 -8 12 0 q6 8 12 0 q6 -8 12 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>
    ${[22, 36, 50, 64, 78].map((x, i) => `<path d="M${x} 48 q${i % 2 ? 7 : -7} 14 0 26 q${i % 2 ? -7 : 7} 14 0 30" stroke="${c}" stroke-width="3" fill="none" opacity=".75"/>`).join('')}`, label);

  A.atolla = (label) => svg(100, 100, `
    <circle cx="50" cy="42" r="30" fill="#b3122e"/>
    <circle cx="50" cy="42" r="18" fill="#6d0a1c"/>
    ${Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<circle cx="${50 + Math.cos(a) * 25}" cy="${42 + Math.sin(a) * 25}" r="3" fill="#5ad8ff"/>`; }).join('')}
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${22 + i * 7} 66 q${i % 2 ? 5 : -5} 12 0 30" stroke="#d64a5f" stroke-width="2" fill="none"/>`).join('')}`, label);

  A.fish = (o = {}) => {
    const { body = '#f2a33a', fin = '#e07b1f', label, stripes, belly, eyeR = 3.6, glow } = o;
    return svg(120, 70, `
      <path d="M92 35 L114 16 L110 35 L114 54Z" fill="${fin}"/>
      <path d="M52 14 Q64 2 76 16Z M56 56 Q66 66 74 54Z" fill="${fin}"/>
      <path d="M10 35 Q30 8 64 12 Q90 16 98 35 Q90 54 64 58 Q30 62 10 35Z" fill="${body}"/>
      ${belly ? `<path d="M14 38 Q40 58 90 42 Q70 56 40 54 Q22 50 14 38Z" fill="${belly}"/>` : ''}
      ${stripes ? stripes.map((x) => `<path d="M${x} 13 q-6 22 0 45" stroke="#fff" stroke-width="7" fill="none"/><path d="M${x - 4} 13 q-6 22 0 45" stroke="#1d1b19" stroke-width="1.6" fill="none"/><path d="M${x + 4} 13 q-6 22 0 45" stroke="#1d1b19" stroke-width="1.6" fill="none"/>`).join('') : ''}
      <path d="M44 38 q10 8 18 -2" stroke="${fin}" stroke-width="3" fill="none"/>
      ${eye(24, 30, eyeR, glow)}
      <path d="M11 37 q5 2 9 0" stroke="#1d1b19" stroke-width="1.6" fill="none"/>`, label);
  };

  A.dolphin = (label) => svg(140, 70, `
    <path d="M112 30 L134 14 Q130 30 136 46Z" fill="#6b8ea8"/>
    <path d="M66 18 Q74 2 86 4 Q80 12 82 22Z" fill="#6b8ea8"/>
    <path d="M4 38 Q10 34 22 33 Q40 16 76 18 Q104 20 118 32 Q104 46 70 48 Q40 50 24 43 Q10 44 4 38Z" fill="#86a9c2"/>
    <path d="M22 41 Q44 50 80 44 Q60 52 38 50Z" fill="#dfe9f1"/>
    <path d="M56 46 Q60 58 70 60 Q66 52 68 46Z" fill="#6b8ea8"/>
    ${eye(30, 32, 2.6)}
    <path d="M6 38 q8 3 16 2" stroke="#46657d" stroke-width="1.5" fill="none"/>`, label);

  A.turtle = (label) => svg(130, 80, `
    <path d="M40 22 Q30 4 16 8 Q24 18 34 28Z M38 58 Q28 76 14 72 Q22 62 34 52Z M92 26 Q104 14 114 18 Q106 28 96 34Z M92 54 Q104 66 114 62 Q106 52 96 46Z" fill="#5f9e57"/>
    <ellipse cx="18" cy="40" rx="14" ry="10" fill="#6fb466"/>
    ${eye(12, 37, 2.6)}
    <ellipse cx="66" cy="40" rx="36" ry="26" fill="#7b5a2c"/>
    <path d="M50 26 L66 20 L82 26 L84 44 L66 54 L48 44Z" fill="#9a7338" stroke="#5a4020" stroke-width="2"/>
    <path d="M50 26 L38 34 M82 26 L94 34 M48 44 L38 48 M84 44 L94 48 M66 54 L66 64 M66 20 L66 14" stroke="#5a4020" stroke-width="2"/>`, label);

  A.diver = (o = {}) => svg(130, 70, `
    <rect x="48" y="16" width="36" height="12" rx="6" fill="${o.freedive ? 'transparent' : '#f2c230'}"/>
    <path d="M20 36 Q24 26 36 28 L92 30 Q100 32 100 38 Q98 44 90 44 L36 44 Q24 46 20 36Z" fill="${o.suit || '#23324a'}"/>
    <path d="M96 34 L118 22 L124 30 L102 40Z M96 40 L118 50 L122 42 L102 36Z" fill="${o.fins || '#ff5a36'}"/>
    <path d="M40 30 L28 18 M44 42 L34 56" stroke="${o.suit || '#23324a'}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="16" cy="34" r="9" fill="#f1c7a3"/>
    <rect x="6" y="28" width="12" height="8" rx="3" fill="#8fd3ff" stroke="#23324a" stroke-width="2"/>
    ${o.freedive ? '' : '<circle cx="8" cy="18" r="3" fill="none" stroke="#bfe8ff" stroke-width="1.5"/><circle cx="12" cy="8" r="2" fill="none" stroke="#bfe8ff" stroke-width="1.5"/>'}`, o.label);

  A.manta = (label) => svg(140, 90, `
    <path d="M70 26 Q40 22 6 50 Q40 44 58 58 Q64 70 70 70 Q76 70 82 58 Q100 44 134 50 Q100 22 70 26Z" fill="#2c3e57"/>
    <path d="M60 30 Q54 22 58 16 M80 30 Q86 22 82 16" stroke="#2c3e57" stroke-width="6" stroke-linecap="round" fill="none"/>
    <path d="M70 70 Q72 82 80 88" stroke="#2c3e57" stroke-width="3" fill="none"/>
    <path d="M52 50 Q70 44 88 50 Q70 60 52 50Z" fill="#dfe6ee" opacity=".7"/>
    ${eye(58, 34, 2.4)}${eye(84, 34, 2.4)}`, label);

  A.shark = (o = {}) => svg(150, 70, `
    <path d="M118 32 L146 8 Q138 32 146 56 L120 40Z" fill="${o.fin || '#5f6f7d'}"/>
    <path d="M60 18 Q70 -2 80 2 Q78 12 82 22Z" fill="${o.fin || '#5f6f7d'}"/>
    <path d="M4 38 Q12 20 50 18 Q96 16 122 34 Q98 50 56 52 Q20 54 4 38Z" fill="${o.body || '#7f93a3'}"/>
    <path d="M6 40 Q30 54 70 50 Q100 46 118 38 Q96 52 60 54 Q24 56 6 40Z" fill="#eef2f4"/>
    <path d="M58 48 Q62 62 76 64 Q70 54 72 48Z" fill="${o.fin || '#5f6f7d'}"/>
    <path d="M40 30 v10 M44 30 v10 M48 30 v10" stroke="#4d5b67" stroke-width="1.5"/>
    ${eye(24, 30, 2.6)}
    <path d="M8 42 q10 6 20 2" stroke="#b33" stroke-width="1.5" fill="none"/>
    <path d="M10 42 l3 3 l3 -3 l3 3 l3 -3 l3 3" stroke="#fff" stroke-width="1.2" fill="none"/>`, o.label);

  A.whale = (o = {}) => svg(180, 80, `
    <path d="M150 34 Q166 18 178 20 Q168 34 178 50 Q164 50 150 40Z" fill="${o.body || '#4f6f94'}"/>
    <path d="M6 40 Q8 16 50 14 Q110 12 152 36 Q110 58 50 58 Q10 58 6 40Z" fill="${o.body || '#4f6f94'}"/>
    <path d="M10 46 Q50 62 120 50 Q90 60 50 60 Q20 58 10 46Z" fill="${o.belly || '#9fb6cf'}"/>
    ${o.grooves ? Array.from({ length: 5 }, (_, i) => `<path d="M${14 + i * 4} ${48 + i} Q60 ${57 - i} 100 ${52 - i}" stroke="#7d95ad" stroke-width="1.2" fill="none"/>`).join('') : ''}
    <path d="M60 52 Q66 66 80 70 Q76 58 76 52Z" fill="${o.body || '#4f6f94'}"/>
    ${eye(34, 36, 2.4)}
    ${o.spout ? '<path d="M40 12 q-4 -6 -8 -8 M40 12 q0 -8 0 -10 M40 12 q4 -6 8 -8" stroke="#dff3ff" stroke-width="2" fill="none"/>' : ''}`, o.label);

  A.sperm = (label) => svg(190, 80, `
    <path d="M160 36 Q176 20 188 22 Q178 36 188 52 Q174 52 160 42Z" fill="#5c5f68"/>
    <path d="M6 20 Q6 10 20 10 L80 10 Q130 12 162 38 Q130 58 70 58 Q20 58 8 44Z" fill="#6d717b"/>
    <path d="M10 46 L60 50" stroke="#e8e8e8" stroke-width="3"/>
    <path d="M112 16 q4 -4 8 0 q4 -4 8 0" stroke="#5c5f68" stroke-width="3" fill="none"/>
    ${eye(64, 38, 2.2)}
    <path d="M72 50 Q78 64 90 66 Q86 56 86 50Z" fill="#5c5f68"/>`, label);

  A.beaked = (label) => svg(170, 70, `
    <path d="M140 32 Q156 18 168 20 Q158 32 168 46 Q154 46 140 38Z" fill="#8a7a6b"/>
    <path d="M4 36 Q14 30 26 30 Q50 14 90 16 Q124 18 144 34 Q120 50 80 52 Q40 52 26 42 Q12 42 4 36Z" fill="#a39180"/>
    <path d="M90 16 Q96 6 102 8 Q100 14 104 22Z" fill="#8a7a6b"/>
    <path d="M24 32 q20 -8 30 0" stroke="#d6c9bc" stroke-width="2" fill="none"/>
    <path d="M60 40 l30 -6 M70 44 l26 -4" stroke="#e7ddd1" stroke-width="1.4"/>
    ${eye(34, 34, 2.2)}`, label);

  A.squid = (o = {}) => svg(160, 70, `
    <path d="M154 35 L134 16 Q126 35 134 54Z" fill="${o.fin || o.body}"/>
    <path d="M60 22 Q100 14 140 35 Q100 56 60 48Z" fill="${o.body || '#d9644a'}"/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M60 ${26 + i * 3} Q${40 - (o.long ? 0 : 0)} ${22 + i * 4} ${4 + (i % 3) * 6} ${14 + i * 6}" stroke="${o.body || '#d9644a'}" stroke-width="${i === 0 || i === 7 ? 2 : 3}" fill="none" stroke-linecap="round"/>`).join('')}
    ${o.long ? `<path d="M60 32 Q20 30 -10 48" stroke="${o.body}" stroke-width="2" fill="none"/>` : ''}
    ${eye(66, 34, o.bigEye ? 7 : 4)}
    ${o.spots ? Array.from({ length: 10 }, (_, i) => `<circle cx="${76 + (i * 13) % 56}" cy="${28 + (i * 7) % 16}" r="1.8" fill="#8fe8ff"/>`).join('') : ''}`, o.label);

  A.vampire = (label) => svg(110, 110, `
    <path d="M55 10 Q86 12 86 44 L100 34 Q96 50 86 54 Q92 76 104 96 Q80 84 70 72 Q64 96 55 100 Q46 96 40 72 Q30 84 6 96 Q18 76 24 54 Q14 50 10 34 L24 44 Q24 12 55 10Z" fill="#7a1631"/>
    <path d="M24 54 Q55 70 86 54 Q70 84 55 86 Q40 84 24 54Z" fill="#3c0a18"/>
    ${eye(42, 36, 6, '#6ee7ff')}${eye(70, 36, 6, '#6ee7ff')}`, label);

  A.octopus = (o = {}) => svg(110, 100, `
    ${o.dumbo ? `<ellipse cx="22" cy="30" rx="14" ry="9" fill="${o.fin || '#f08aa0'}" transform="rotate(-30 22 30)"/><ellipse cx="88" cy="30" rx="14" ry="9" fill="${o.fin || '#f08aa0'}" transform="rotate(30 88 30)"/>` : ''}
    <path d="M55 6 Q84 8 84 40 Q84 58 70 62 L32 62 Q26 58 26 40 Q26 8 55 6Z" fill="${o.body || '#ec6f8b'}"/>
    ${o.dumbo ? `<path d="M30 58 Q20 84 12 90 Q34 88 44 66 Q52 92 55 94 Q60 92 66 66 Q76 88 98 90 Q90 84 80 58Z" fill="${o.body}" opacity=".9"/>` :
      Array.from({ length: 6 }, (_, i) => `<path d="M${32 + i * 9} 60 q${(i - 2.5) * 6} 18 ${(i - 2.5) * 10} 30" stroke="${o.body || '#ec6f8b'}" stroke-width="6" stroke-linecap="round" fill="none"/>`).join('')}
    ${eye(44, 38, 5)}${eye(66, 38, 5)}`, o.label);

  A.eel = (o = {}) => svg(170, 80, `
    <path d="M${o.gulper ? 40 : 18} 40 Q70 20 100 40 T160 40" stroke="${o.body || '#2b2b3a'}" stroke-width="${o.gulper ? 7 : 12}" fill="none" stroke-linecap="round"/>
    ${o.crest ? `<path d="M20 34 Q60 10 100 34 T160 36" stroke="${o.crest}" stroke-width="3" fill="none" stroke-dasharray="3 3"/><path d="M22 30 L18 6 L30 26 L34 4 L38 26" fill="${o.crest}"/>` : ''}
    ${o.gulper ? `<path d="M44 40 L4 10 Q2 40 4 70Z" fill="${o.body || '#2b2b3a'}"/><path d="M40 40 L10 18 Q8 40 10 62Z" fill="#111"/><circle cx="162" cy="40" r="4" fill="#ff5ab0"/>` : ''}
    ${o.frill ? `<path d="M12 40 Q8 30 18 28 L26 32 L22 44 Z" fill="${o.body}"/><path d="M26 30 v14 M30 30 v14" stroke="#c44" stroke-width="2"/>` : ''}
    ${eye(o.gulper ? 38 : 16, 36, 2.4)}`, o.label);

  A.nautilus = (label) => svg(110, 90, `
    <circle cx="62" cy="44" r="34" fill="#f3e3c8"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M62 44 L${62 + Math.cos(-1.2 + i * 0.5) * 34} ${44 + Math.sin(-1.2 + i * 0.5) * 34}" stroke="#b3542b" stroke-width="${5 - i * 0.5}" />`).join('')}
    <path d="M62 44 m-10 0 a10 10 0 1 1 10 10" stroke="#8a6a4a" stroke-width="3" fill="none"/>
    <path d="M30 40 Q16 44 8 60 M30 48 Q18 56 14 70 M32 54 Q26 66 26 78" stroke="#e4b99a" stroke-width="3" fill="none"/>
    <path d="M26 30 Q34 30 34 50 Q26 58 22 50Z" fill="#e4b99a"/>
    ${eye(30, 38, 3)}`, label);

  A.hatchet = (label) => svg(90, 90, `
    <path d="M70 40 L86 30 L84 50 Z" fill="#9fb5c9"/>
    <path d="M10 30 Q30 10 70 30 L72 50 Q50 84 20 60 Q10 50 10 30Z" fill="#c6d3df"/>
    <path d="M18 60 Q40 74 64 52" stroke="#6ee7ff" stroke-width="3" stroke-dasharray="3 4" fill="none"/>
    <path d="M26 28 L60 34" stroke="#8aa0b4" stroke-width="2"/>
    ${eye(22, 30, 6)}`, label);

  A.barreleye = (label) => svg(130, 80, `
    <path d="M104 40 L126 26 L122 40 L126 54Z" fill="#4a3a2c"/>
    <path d="M14 44 Q30 30 70 32 Q100 34 108 40 Q100 50 70 52 Q30 54 14 44Z" fill="#6b5640"/>
    <path d="M14 36 Q16 4 44 6 Q62 8 62 34 Z" fill="#bfefff" opacity=".35" stroke="#dff7ff" stroke-width="1.5"/>
    <ellipse cx="32" cy="24" rx="6" ry="9" fill="#35d08a"/><ellipse cx="46" cy="24" rx="6" ry="9" fill="#35d08a"/>
    <circle cx="18" cy="38" r="1.6" fill="#111"/><circle cx="22" cy="38" r="1.6" fill="#111"/>`, label);

  A.siphono = (label) => svg(170, 60, `
    <path d="M6 30 Q40 10 80 30 T168 30" stroke="#e2c4ff" stroke-width="2" fill="none"/>
    ${Array.from({ length: 11 }, (_, i) => `<ellipse cx="${12 + i * 14}" cy="${30 + Math.sin(i) * 8}" rx="6" ry="8" fill="#c79bff" opacity=".6"/><path d="M${12 + i * 14} ${38 + Math.sin(i) * 8} q3 8 0 16" stroke="#ff8fd8" stroke-width="1.5" fill="none"/>`).join('')}`, label);

  A.angler = (label) => svg(120, 90, `
    <path d="M28 30 Q24 8 6 10" stroke="#3d2f2a" stroke-width="3" fill="none"/>
    <circle cx="6" cy="10" r="7" fill="#fff6a0" opacity=".35"/><circle cx="6" cy="10" r="4" fill="#fff9c4"/>
    <path d="M96 50 L118 36 L114 52 L118 68Z" fill="#3d2f2a"/>
    <path d="M14 56 Q10 24 50 22 Q90 22 100 52 Q90 80 50 80 Q20 80 14 56Z" fill="#4e3b33"/>
    <path d="M12 56 Q30 44 50 56 Q30 72 12 56Z" fill="#1a1210"/>
    <path d="M14 52 l4 6 l4 -6 l4 6 l4 -6 l4 6 l4 -6 M16 60 l4 -5 l4 5 l4 -5 l4 5 l4 -5" stroke="#f3eee7" stroke-width="1.5" fill="none"/>
    ${eye(44, 36, 3)}`, label);

  A.fangtooth = (label) => svg(120, 80, `
    <path d="M92 40 L116 26 L112 40 L116 56Z" fill="#40302a"/>
    <path d="M10 40 Q12 14 50 14 Q84 16 96 40 Q84 64 50 64 Q12 66 10 40Z" fill="#5a4038"/>
    <path d="M10 44 L50 44" stroke="#1a1210" stroke-width="4"/>
    <path d="M14 44 L16 26 L20 44 M26 44 L28 30 L32 44 M20 44 L22 58 L25 44 M34 44 L36 56 L38 44" fill="#fff" stroke="#fff" stroke-width="1"/>
    ${eye(40, 28, 3)}`, label);

  A.swallower = (label) => svg(110, 90, `
    <path d="M20 30 Q50 18 90 30 L106 22 L102 34 L106 44 L90 38 Q60 36 40 38Z" fill="#26262f"/>
    <path d="M28 36 Q30 80 60 82 Q86 80 80 40 Q60 36 28 36Z" fill="#3b3b4a"/>
    <ellipse cx="56" cy="60" rx="18" ry="16" fill="#6a6a80" opacity=".6"/>
    <path d="M20 30 l4 5 l4 -5 l4 5" stroke="#eee" stroke-width="1.2" fill="none"/>
    ${eye(26, 26, 2.2)}`, label);

  A.seal = (label) => svg(150, 70, `
    <path d="M120 36 L146 24 Q140 36 146 50Z" fill="#6c5a4a"/>
    <path d="M8 34 Q10 20 30 20 Q70 16 124 34 Q80 56 40 52 Q12 50 8 34Z" fill="#8a7461"/>
    <path d="M10 30 Q2 30 4 38 Q10 40 14 36" fill="#8a7461"/>
    <path d="M50 48 Q54 62 66 64 Q62 54 62 48Z" fill="#6c5a4a"/>
    ${eye(22, 28, 3)}
    <path d="M6 34 l-6 -2 M6 36 l-6 2" stroke="#3a2f26" stroke-width="1"/>`, label);

  A.penguin = (label) => svg(120, 60, `
    <path d="M10 30 Q14 16 36 14 Q80 12 108 30 Q80 46 36 46 Q14 44 10 30Z" fill="#1c2430"/>
    <path d="M22 36 Q60 48 100 32 Q70 44 36 44 Q24 42 22 36Z" fill="#f4f0e6"/>
    <path d="M26 20 Q30 26 40 26" stroke="#f2b233" stroke-width="4" fill="none"/>
    <path d="M4 30 L12 27 L12 33Z" fill="#e88a2a"/>
    <path d="M56 36 Q66 52 78 50" stroke="#1c2430" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M104 30 L118 24 L116 36Z" fill="#e88a2a"/>
    ${eye(20, 26, 2)}`, label);

  A.isopod = (label) => svg(120, 70, `
    <ellipse cx="60" cy="36" rx="50" ry="24" fill="#c9b8a6"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${24 + i * 11} 14 Q${22 + i * 11} 36 ${24 + i * 11} 58" stroke="#a08c77" stroke-width="2" fill="none"/>`).join('')}
    <path d="M10 30 Q-2 20 2 10 M10 40 Q-2 50 2 60" stroke="#a08c77" stroke-width="2" fill="none"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${28 + i * 12} 58 l-4 8" stroke="#a08c77" stroke-width="2"/>`).join('')}
    <ellipse cx="18" cy="30" rx="4" ry="6" fill="#333"/>`, label);

  A.amphipod = (o = {}) => svg(120, 70, `
    <path d="M14 34 Q20 12 60 12 Q100 14 108 34 Q110 44 100 46 L20 46 Q12 44 14 34Z" fill="${o.body || '#f1e6d0'}"/>
    ${Array.from({ length: 6 }, (_, i) => `<path d="M${30 + i * 12} 14 Q${28 + i * 12} 30 ${30 + i * 12} 46" stroke="#d2c2a4" stroke-width="2" fill="none"/>`).join('')}
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${24 + i * 11} 46 q-3 8 -8 12" stroke="#d2c2a4" stroke-width="2" fill="none"/>`).join('')}
    <path d="M14 30 Q2 14 6 4 M16 34 Q2 30 0 22" stroke="#d2c2a4" stroke-width="2" fill="none"/>
    <path d="M106 36 l12 -6 M106 40 l12 4" stroke="#d2c2a4" stroke-width="2"/>
    <circle cx="20" cy="28" r="2.6" fill="#b34"/>`, o.label);

  A.seapig = (label) => svg(120, 70, `
    <path d="M12 44 Q14 18 60 18 Q104 18 108 44 Q108 52 100 52 L20 52 Q12 52 12 44Z" fill="#f2b9c4"/>
    <path d="M40 20 Q36 6 30 4 M50 18 Q48 4 44 0 M60 18 Q62 6 68 2" stroke="#f2b9c4" stroke-width="4" stroke-linecap="round" fill="none"/>
    ${Array.from({ length: 7 }, (_, i) => `<path d="M${22 + i * 13} 50 v10" stroke="#e79aa9" stroke-width="5" stroke-linecap="round"/>`).join('')}
    <circle cx="22" cy="40" r="3" fill="#c46a7d"/><circle cx="16" cy="44" r="4" fill="#e79aa9"/>`, label);

  A.cucumber = (label) => svg(120, 80, `
    <path d="M20 40 Q20 14 60 14 Q98 14 100 40 Q98 62 60 64 Q22 64 20 40Z" fill="#ff7e9b" opacity=".55"/>
    <path d="M36 40 Q60 24 86 40 Q60 54 36 40Z" fill="#b31e4f" opacity=".7"/>
    <path d="M20 34 Q4 20 8 8 Q18 24 24 30Z M100 36 Q114 20 116 30 Q110 40 100 44Z" fill="#ff9db4" opacity=".7"/>`, label);

  A.tripod = (label) => svg(140, 90, `
    <path d="M30 40 L24 88 M34 40 L42 88 M100 46 L112 88" stroke="#9aa8b8" stroke-width="2"/>
    <path d="M116 30 L138 20 L134 32 L138 44Z" fill="#6f7f90"/>
    <path d="M10 32 Q20 20 60 22 Q100 24 118 32 Q100 42 60 42 Q20 44 10 32Z" fill="#8494a6"/>
    <path d="M40 24 Q30 8 44 2 M44 24 Q40 10 56 6" stroke="#9aa8b8" stroke-width="1.6" fill="none"/>
    <circle cx="20" cy="30" r="1.6" fill="#111"/>`, label);

  A.snailfish = (label) => svg(140, 70, `
    <path d="M10 36 Q10 14 40 14 Q70 16 100 30 Q124 36 136 34 Q124 42 100 42 Q70 56 40 56 Q10 58 10 36Z" fill="#f6dfe3" opacity=".9"/>
    <path d="M40 16 Q80 18 120 34 M40 54 Q80 52 120 38" stroke="#f0c2cb" stroke-width="3" fill="none"/>
    <ellipse cx="46" cy="38" rx="10" ry="8" fill="#f1a9b8" opacity=".6"/>
    ${eye(24, 30, 2.6)}`, label);

  A.cusk = (label) => svg(150, 60, `
    <path d="M8 32 Q12 16 40 16 Q90 16 146 30 Q90 46 40 46 Q12 46 8 32Z" fill="#d8c8b8"/>
    <path d="M40 16 Q90 12 146 30 M40 46 Q90 50 146 30" stroke="#bfa98f" stroke-width="3" fill="none"/>
    ${eye(22, 28, 2.2)}
    <path d="M10 36 l-6 8 M14 38 l-4 9" stroke="#bfa98f" stroke-width="1.5"/>`, label);

  A.greenland = (label) => A.shark({ body: '#5c6166', fin: '#474b50', label }).replace('#eef2f4', '#8b9196');

  A.frilled = (label) => A.eel({ body: '#5a4a44', frill: true, label });

  A.ship = (o = {}) => svg(200, 90, `
    <g ${o.tilt ? `transform="rotate(${o.tilt} 100 50)"` : ''}>
    <path d="M6 44 L194 44 L182 76 L22 76Z" fill="${o.hull || '#1e1e24'}"/>
    <path d="M6 44 L194 44 L192 50 L8 50Z" fill="#fff" opacity=".85"/>
    <path d="M22 70 L182 70 L180 76 L24 76Z" fill="#8c2020"/>
    <rect x="34" y="32" width="136" height="12" fill="#e9e1d0"/>
    ${(o.funnels || [58, 88, 118, 148]).map((x) => `<rect x="${x}" y="8" width="12" height="24" fill="#e6a000"/><rect x="${x}" y="8" width="12" height="6" fill="#1e1e24"/>`).join('')}
    ${Array.from({ length: 16 }, (_, i) => `<circle cx="${22 + i * 10}" cy="58" r="1.6" fill="#f2e6a0" opacity=".6"/>`).join('')}
    </g>
    ${o.rust ? '<path d="M20 60 q10 10 30 6 M120 70 q20 -4 40 4" stroke="#8a4b20" stroke-width="4" fill="none" opacity=".7"/>' : ''}`, o.label);

  A.battleship = (label) => svg(200, 80, `
    <path d="M4 44 L196 44 L176 70 L28 70Z" fill="#5a636e"/>
    <path d="M60 30 L140 30 L150 44 L50 44Z" fill="#6c7581"/>
    <rect x="88" y="10" width="14" height="22" fill="#6c7581"/><rect x="96" y="2" width="3" height="10" fill="#6c7581"/>
    <rect x="34" y="36" width="20" height="8" fill="#4a525c"/><path d="M34 38 L10 36 M34 41 L10 40" stroke="#4a525c" stroke-width="2.5"/>
    <rect x="150" y="36" width="20" height="8" fill="#4a525c"/><path d="M170 38 L194 36 M170 41 L194 40" stroke="#4a525c" stroke-width="2.5"/>
    <path d="M40 60 q20 6 40 0 M120 64 q20 -4 40 2" stroke="#8a4b20" stroke-width="3" fill="none" opacity=".7"/>`, label);

  A.destroyer = (label) => svg(190, 70, `
    <path d="M4 40 L186 40 L170 62 L20 62Z" fill="#505a64"/>
    <rect x="70" y="24" width="50" height="16" fill="#606b76"/>
    <rect x="86" y="8" width="10" height="16" fill="#606b76"/>
    <rect x="30" y="32" width="14" height="8" fill="#444c55"/><rect x="140" y="32" width="14" height="8" fill="#444c55"/>
    <path d="M30 56 q30 4 60 -2" stroke="#8a4b20" stroke-width="3" fill="none" opacity=".7"/>`, label);

  A.sub = (o = {}) => svg(170, 70, `
    <path d="M10 40 Q10 24 40 24 L130 24 Q160 26 162 40 Q160 54 130 56 L40 56 Q10 56 10 40Z" fill="${o.body || '#3b4250'}"/>
    <path d="M60 24 L66 8 L96 8 L100 24Z" fill="${o.body || '#3b4250'}"/>
    <path d="M80 8 v-6" stroke="${o.body || '#3b4250'}" stroke-width="2"/>
    <path d="M160 40 L168 28 L168 52Z" fill="#2a2f39"/>
    ${[40, 56, 72].map((x) => `<circle cx="${x}" cy="40" r="3" fill="#f2e6a0" opacity=".7"/>`).join('')}`, o.label);

  A.bathyscaphe = (o = {}) => svg(170, 110, `
    <path d="M10 40 Q10 18 40 18 L130 18 Q162 20 162 40 Q160 60 130 62 L40 62 Q10 62 10 40Z" fill="${o.body || '#e9e4d8'}"/>
    <rect x="72" y="6" width="26" height="12" fill="${o.body || '#e9e4d8'}"/>
    <path d="M40 30 H130" stroke="#b9b2a2" stroke-width="2"/>
    <text x="86" y="48" font-size="12" font-family="sans-serif" font-weight="800" fill="#2a2f39" text-anchor="middle">${o.text || 'TRIESTE'}</text>
    <path d="M78 62 L78 72 M94 62 L94 72" stroke="#6a6a6a" stroke-width="3"/>
    <circle cx="86" cy="86" r="18" fill="#4a5360"/>
    <circle cx="80" cy="84" r="4" fill="#bfefff"/>`, o.label);

  A.upright = (o = {}) => svg(90, 130, `
    <rect x="20" y="10" width="50" height="96" rx="12" fill="${o.body || '#e8eef4'}"/>
    <rect x="28" y="24" width="34" height="20" rx="8" fill="#6ec9ff" opacity=".8"/>
    <rect x="30" y="54" width="30" height="36" rx="4" fill="${o.accent || '#ffb000'}"/>
    <path d="M14 98 L76 98 L80 118 L10 118Z" fill="#4a5360"/>
    <path d="M70 60 L86 70" stroke="#9aa" stroke-width="3"/>
    <circle cx="36" cy="108" r="3" fill="#fff8a0"/><circle cx="54" cy="108" r="3" fill="#fff8a0"/>
    <text x="45" y="76" font-size="9" font-family="sans-serif" font-weight="800" fill="#1d1b19" text-anchor="middle">${o.text || ''}</text>`, o.label);

  A.alvin = (label) => svg(140, 90, `
    <path d="M20 50 Q20 20 60 18 L100 18 Q126 20 126 44 L126 60 Q126 70 110 70 L34 70 Q20 70 20 60Z" fill="#f4f4f4"/>
    <path d="M60 18 L64 6 L84 6 L88 18Z" fill="#e25d2c"/>
    <rect x="20" y="50" width="106" height="8" fill="#e25d2c"/>
    <circle cx="34" cy="42" r="6" fill="#6ec9ff" stroke="#3b4250" stroke-width="2"/>
    <path d="M20 62 L4 74 M26 66 L14 82" stroke="#3b4250" stroke-width="3"/>
    <text x="80" y="42" font-size="12" font-family="sans-serif" font-weight="900" fill="#1d1b19">ALVIN</text>`, label);

  A.vent = (label) => svg(140, 120, `
    <path d="M70 18 q-12 -10 -4 -18 M70 18 q10 -8 2 -18" stroke="#58535a" stroke-width="10" fill="none" opacity=".6" stroke-linecap="round"/>
    <path d="M50 118 L60 20 L80 20 L92 118Z" fill="#3a2f2a"/>
    <path d="M60 20 L80 20 L78 30 L62 30Z" fill="#ff7a2a" opacity=".8"/>
    <path d="M30 118 L40 70 L52 70 L56 118Z M96 118 L102 80 L112 80 L118 118Z" fill="#4a3d36"/>
    ${[18, 26, 34, 110, 118, 126].map((x, i) => `<path d="M${x} 118 Q${x - 2} ${100 - i * 2} ${x} ${88 - (i % 3) * 6}" stroke="#f3eee7" stroke-width="4" fill="none"/><circle cx="${x}" cy="${86 - (i % 3) * 6}" r="4" fill="#e5304a"/>`).join('')}`, label);

  A.mountain = (label) => svg(160, 110, `
    <path d="M4 108 L64 14 L84 40 L96 26 L156 108Z" fill="#6d7c8e"/>
    <path d="M64 14 L78 36 L70 32 L62 40 L54 30Z M96 26 L106 40 L98 38Z" fill="#fff"/>
    <path d="M64 14 L64 2 L78 6 L64 10" fill="#ff5a36" stroke="#ff5a36" stroke-width="1"/>`, label);

  A.plain = (label) => svg(170, 60, `
    <path d="M0 40 Q40 30 80 38 T170 36 L170 60 L0 60Z" fill="#3b3f4e"/>
    <path d="M0 46 Q50 38 100 46 T170 44" stroke="#565b6d" stroke-width="2" fill="none"/>
    <circle cx="30" cy="38" r="2" fill="#9aa"/><circle cx="120" cy="40" r="2" fill="#9aa"/>
    <path d="M86 38 v-14 M86 24 l6 3 l-6 3" stroke="#ff5a36" stroke-width="2" fill="#ff5a36"/>`, label);

  A.nodules = (label) => svg(160, 60, `
    <path d="M0 40 Q80 30 160 40 L160 60 L0 60Z" fill="#403a36"/>
    ${[[18, 40, 9], [44, 38, 12], [70, 42, 8], [92, 36, 13], [122, 40, 10], [146, 42, 8]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="#2a2522"/><ellipse cx="${x - r * 0.3}" cy="${y - r * 0.3}" rx="${r * 0.35}" ry="${r * 0.2}" fill="#6b6056"/>`).join('')}`, label);

  A.xeno = (label) => svg(110, 90, `
    <path d="M10 86 L100 86" stroke="#4a4a50" stroke-width="4"/>
    <path d="M20 84 Q16 40 50 30 Q88 24 92 60 Q94 80 86 84Z" fill="#c7b89e"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${26 + i * 7} 80 Q${24 + i * 7} 56 ${34 + i * 6} ${38 + (i % 2) * 6}" stroke="#9f8f73" stroke-width="2" fill="none"/>`).join('')}`, label);

  A.trench = (label) => svg(200, 90, `
    <path d="M0 10 L60 10 L86 80 L120 80 L140 10 L200 10 L200 90 L0 90Z" fill="#171a22"/>
    <path d="M86 80 L120 80" stroke="#ff5a36" stroke-width="3"/>
    <text x="103" y="72" font-size="10" fill="#ff8a6a" text-anchor="middle" font-family="sans-serif" font-weight="800">YOU</text>`, label);

  A.mola = (label) => svg(110, 110, `
    <path d="M60 14 Q72 -2 80 4 Q74 16 76 26Z M60 96 Q72 112 80 106 Q74 94 76 84Z" fill="#8c9aa6"/>
    <ellipse cx="54" cy="55" rx="44" ry="38" fill="#a9b6c0"/>
    <path d="M94 30 Q106 55 94 80" stroke="#8c9aa6" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M14 56 q4 4 8 0" stroke="#555" stroke-width="2" fill="none"/>
    ${eye(26, 44, 4)}`, label);

  A.swordfish = (label) => svg(190, 70, `
    <path d="M4 34 L60 32 L60 38Z" fill="#6f7f90"/>
    <path d="M150 34 L180 10 Q172 34 180 58Z" fill="#3e5670"/>
    <path d="M90 22 Q96 2 110 4 Q104 16 110 26Z" fill="#3e5670"/>
    <path d="M52 36 Q70 18 110 22 Q140 26 154 34 Q140 46 110 48 Q70 52 52 36Z" fill="#5a7894"/>
    <path d="M56 40 Q90 52 150 38 Q120 50 90 50Z" fill="#cdd9e3"/>
    ${eye(66, 32, 3)}`, label);

  A.coelacanth = (label) => svg(140, 80, `
    <path d="M106 40 L120 24 L128 40 L120 56Z M128 40 L138 34 L138 46Z" fill="#3b4d6b"/>
    <path d="M8 40 Q14 16 50 16 Q90 18 110 40 Q90 62 50 64 Q14 64 8 40Z" fill="#46597a"/>
    ${[[40, 30], [60, 26], [80, 34], [56, 48], [30, 46], [78, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#dfe8f2"/>`).join('')}
    <path d="M44 62 Q46 76 56 76 Q54 66 56 60Z M70 62 Q74 76 84 74 Q80 66 80 58Z M60 18 Q64 4 74 4 Q70 12 72 20Z" fill="#3b4d6b"/>
    ${eye(22, 34, 3.6)}`, label);

  A.oarfish = (label) => svg(200, 60, `
    <path d="M10 30 Q60 14 110 30 T198 30" stroke="#d6dde4" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M10 24 Q60 8 110 24 T198 24" stroke="#e5304a" stroke-width="3" fill="none"/>
    <path d="M10 26 L6 2 L14 20 L16 0 L20 20" fill="#e5304a"/>
    ${eye(12, 30, 2.4)}`, label);

  A.lantern = (label) => A.fish({ body: '#4a5a72', fin: '#394860', label, eyeR: 5 }).replace('</svg>',
    [[40, 48], [50, 50], [60, 50], [70, 48], [80, 45], [34, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#7cf7ff"/>`).join('') + '</svg>');

  A.viper = (label) => svg(140, 70, `
    <path d="M106 36 L132 24 L128 36 L132 48Z" fill="#26344a"/>
    <path d="M10 36 Q20 18 60 22 Q100 26 110 36 Q100 46 60 50 Q20 54 10 36Z" fill="#324560"/>
    ${Array.from({ length: 8 }, (_, i) => `<circle cx="${30 + i * 9}" cy="46" r="1.8" fill="#7cf7ff"/>`).join('')}
    <path d="M12 38 L6 14 L10 36 M18 38 L14 18 L18 36 M12 38 L8 56 L14 40" stroke="#f3eee7" stroke-width="1.8" fill="none"/>
    <path d="M40 22 Q34 6 40 0" stroke="#324560" stroke-width="2" fill="none"/><circle cx="40" cy="0" r="2" fill="#7cf7ff"/>
    ${eye(24, 30, 3.4)}`, label);

  A.tubeworms = (label) => A.vent(label);

  window.DeepArt = A;
})();
