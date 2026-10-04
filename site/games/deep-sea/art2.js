(function () {
  const A = window.DeepArt;
  const svg = (w, h, inner, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label || ''}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
  const eye = (x, y, r = 3.4, glow) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${glow || '#fff'}"/><circle cx="${x - r * 0.25}" cy="${y}" r="${r * 0.55}" fill="#111"/>`;
  const dots = (pts, c = '#7cf7ff', r = 2) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join('');

  A.manowar = () => svg(110, 110, `
    <path d="M20 40 Q20 14 56 12 Q92 14 96 34 Q80 46 56 46 Q30 46 20 40Z" fill="#a98bff" opacity=".85"/>
    <path d="M30 22 Q50 6 72 10 Q66 20 52 22Z" fill="#ff8ad8" opacity=".85"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${30 + i * 7} 44 q${i % 2 ? 6 : -6} 20 0 36 q${i % 2 ? -6 : 6} 14 ${i % 3 - 1} 28" stroke="${i % 2 ? '#6fb6ff' : '#c7a6ff'}" stroke-width="2" fill="none"/>`).join('')}`);
  A.otter = () => svg(130, 70, `
    <path d="M10 44 Q12 30 40 30 L96 32 Q114 34 120 44 Q110 54 90 54 L40 54 Q14 56 10 44Z" fill="#7a4e2c"/>
    <path d="M20 46 Q50 58 96 50 Q70 60 40 58Z" fill="#c9a27a"/>
    <circle cx="22" cy="34" r="13" fill="#d9b58e"/><circle cx="14" cy="24" r="4" fill="#7a4e2c"/><circle cx="30" cy="24" r="4" fill="#7a4e2c"/>
    ${eye(18, 32, 2)}${eye(28, 32, 2)}<ellipse cx="23" cy="38" rx="3" ry="2" fill="#2d1a10"/>
    <path d="M40 34 Q44 22 52 30" stroke="#7a4e2c" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="28" r="5" fill="#8a8fa0"/>`);
  A.seahorse = () => svg(70, 110, `
    <path d="M34 8 Q52 8 50 24 Q48 36 38 40 Q52 50 50 70 Q48 88 34 92 Q24 96 26 104 Q16 98 22 88 Q34 80 32 66 Q30 54 24 48 Q18 40 22 28 L6 26 L10 20 L24 20 Q26 10 34 8Z" fill="#f2a33a"/>
    <path d="M38 40 Q46 56 44 72" stroke="#d9862f" stroke-width="2" fill="none"/>
    ${[48, 56, 64, 72, 80].map((y) => `<path d="M${30 + (y % 3)} ${y} h12" stroke="#d9862f" stroke-width="1.5"/>`).join('')}
    <path d="M48 40 Q60 44 56 54 Q50 50 46 46Z" fill="#ffc77a"/>
    ${eye(34, 20, 3)}`);
  A.mantis = () => svg(130, 70, `
    <path d="M30 36 Q40 24 70 26 Q104 28 118 40 Q104 52 70 52 Q40 52 30 44Z" fill="#2ecc71"/>
    ${[60, 72, 84, 96].map((x, i) => `<path d="M${x} 28 q4 12 0 24" stroke="${['#ff5a36', '#ffc233', '#4ea6ef', '#e84393'][i]}" stroke-width="4" fill="none"/>`).join('')}
    <path d="M118 40 L128 30 L126 50Z" fill="#4ea6ef"/>
    <path d="M34 40 Q20 30 22 18 Q28 30 38 34" fill="#e84393"/><path d="M34 44 Q16 48 12 40" stroke="#e84393" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="30" cy="22" r="5" fill="#ffc233"/><circle cx="40" cy="20" r="5" fill="#ffc233"/><path d="M28 22h4M38 20h4" stroke="#1d1b19" stroke-width="1.5"/>`);
  A.puffer = () => svg(110, 100, `
    <circle cx="50" cy="50" r="34" fill="#e8c86a"/><path d="M20 58 Q50 86 80 58 Q66 80 50 80 Q34 80 20 58Z" fill="#fff4cc"/>
    ${Array.from({ length: 20 }, (_, i) => { const a = i / 20 * 6.283; return `<path d="M${50 + Math.cos(a) * 33} ${50 + Math.sin(a) * 33} l${Math.cos(a) * 7} ${Math.sin(a) * 7}" stroke="#b8963a" stroke-width="2"/>`; }).join('')}
    ${[[38, 34], [56, 30], [66, 44], [44, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#8a6a2a"/>`).join('')}
    <path d="M82 50 L104 36 L100 50 L104 64Z" fill="#d9b44a"/>${eye(30, 42, 6)}<circle cx="18" cy="56" r="3" fill="#8a4a2a"/>`);
  A.lionsmane = () => svg(110, 130, `
    <path d="M12 40 Q12 6 55 6 Q98 6 98 40 Q88 46 78 40 Q66 48 55 40 Q44 48 32 40 Q22 46 12 40Z" fill="#e8854a" opacity=".9"/>
    <path d="M28 26 q8 -10 27 -10 q19 0 27 10" stroke="#ffc49a" stroke-width="4" fill="none"/>
    ${Array.from({ length: 14 }, (_, i) => `<path d="M${16 + i * 6} 42 q${i % 2 ? 8 : -8} 24 0 44 q${i % 2 ? -8 : 8} 20 ${i % 3 - 1} 42" stroke="${i % 3 ? '#f2a36a' : '#ffd0a8'}" stroke-width="${i % 3 ? 1.5 : 3}" fill="none" opacity=".85"/>`).join('')}`);
  A.seadragon = () => svg(150, 80, `
    <path d="M20 40 Q40 30 70 36 Q100 40 120 52 Q130 60 140 56" stroke="#d9a33a" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M20 40 L2 36 L4 42Z" fill="#d9a33a"/>
    ${[[40, 32, -1], [60, 34, -1], [78, 38, -1], [56, 42, 1], [86, 46, 1], [104, 46, -1], [118, 58, 1]].map(([x, y, s]) => `<path d="M${x} ${y} q${-6} ${s * 14} ${-14} ${s * 18} q8 2 12 ${-s * 4} q4 ${s * 8} 10 ${s * 10} q-2 ${-s * 12} -8 ${-s * 24}Z" fill="#9cc94a"/>`).join('')}
    ${eye(24, 38, 3)}`);
  A.hammer = () => A.shark({ body: '#8a9aa8', fin: '#6a7a88' }).replace('</svg>', `<path d="M10 12 Q16 22 18 34 Q20 46 14 58 L22 58 Q28 46 26 34 Q24 22 18 12Z" fill="#8a9aa8"/><circle cx="14" cy="14" r="3" fill="#111"/><circle cx="14" cy="56" r="3" fill="#111"/></svg>`);
  A.spidercrab = () => svg(170, 90, `
    ${Array.from({ length: 8 }, (_, i) => { const s = i < 4 ? -1 : 1, k = i % 4; return `<path d="M${85 + s * 10} ${40 + k * 4} q${s * (30 + k * 6)} ${-18 + k * 6} ${s * (60 + k * 8)} ${30 + k * 6}" stroke="#e8743a" stroke-width="4" fill="none" stroke-linecap="round"/>`; }).join('')}
    <ellipse cx="85" cy="44" rx="22" ry="16" fill="#e8743a"/><ellipse cx="80" cy="38" rx="10" ry="6" fill="#ffb27a" opacity=".6"/>
    ${[[72, 50], [96, 50], [84, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fff6e8"/>`).join('')}${eye(78, 30, 2)}${eye(92, 30, 2)}`);
  A.orca = () => svg(180, 80, `
    <path d="M150 36 Q166 20 178 22 Q168 36 178 50 Q164 50 150 42Z" fill="#1d1b19"/>
    <path d="M6 40 Q8 18 50 16 Q110 14 152 38 Q110 58 50 58 Q10 58 6 40Z" fill="#1d1b19"/>
    <path d="M88 18 Q94 -4 100 2 Q96 12 102 22Z" fill="#1d1b19"/>
    <path d="M12 46 Q40 60 90 52 Q60 62 36 60 Q18 56 12 46Z" fill="#fff"/>
    <ellipse cx="38" cy="30" rx="10" ry="4" fill="#fff"/><path d="M96 38 Q110 34 118 40 Q106 44 96 38Z" fill="#b8c2cc"/>
    <path d="M58 52 Q64 66 78 70 Q74 58 74 52Z" fill="#1d1b19"/>`);
  A.opah = () => svg(130, 100, `
    <path d="M10 50 Q30 6 72 10 Q104 16 108 50 Q104 84 72 90 Q30 94 10 50Z" fill="#d9536a"/>
    ${dots([[40, 30], [56, 24], [72, 30], [50, 44], [66, 46], [82, 40], [44, 62], [62, 66], [80, 60]], '#fff4e8', 3)}
    <path d="M58 12 Q70 -4 86 6 L74 18Z M108 50 L128 30 L122 50 L128 70Z" fill="#e8414e"/>
    <path d="M60 50 Q80 40 90 58 Q76 56 60 50Z" fill="#e8414e"/>${eye(28, 44, 6, '#ffd36b')}`);
  A.firefly = () => A.squid({ body: '#3a5fa8', fin: '#2d4a88', spots: true });
  A.humboldt = () => A.squid({ body: '#c8323a', fin: '#a8262e', bigEye: true });
  A.sponge = () => svg(80, 120, `
    <path d="M24 116 Q16 70 22 30 Q26 10 40 6 Q54 10 58 30 Q64 70 56 116Z" fill="#eef4f6" opacity=".85" stroke="#c9dde4" stroke-width="2"/>
    ${Array.from({ length: 8 }, (_, i) => `<path d="M${24 + i * 4} 112 Q${30 + i * 2} 60 ${36 + i} 10" stroke="#b9cfd6" stroke-width="1" fill="none"/>`).join('')}
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${22 + (i % 2) * 2} ${20 + i * 10} Q40 ${24 + i * 10} ${58 - (i % 2) * 2} ${20 + i * 10}" stroke="#b9cfd6" stroke-width="1" fill="none"/>`).join('')}
    <path d="M34 60 q4 -4 8 0 q-2 4 -8 0z M38 70 q4 -4 8 0 q-2 4 -8 0z" fill="#ff9a8a"/>`);
  A.bathysphere = () => svg(110, 120, `
    <path d="M55 0 V30" stroke="#5a6577" stroke-width="2"/><path d="M45 4 V30 M65 4 V30" stroke="#5a6577" stroke-width="1" stroke-dasharray="3 3"/>
    <circle cx="55" cy="68" r="38" fill="#5a6e7c"/><circle cx="55" cy="68" r="38" fill="url(#ds-shine)"/>
    <circle cx="55" cy="68" r="10" fill="#bfe8ff" stroke="#2d3a4a" stroke-width="4"/><circle cx="34" cy="58" r="7" fill="#bfe8ff" stroke="#2d3a4a" stroke-width="3"/>
    <rect x="44" y="26" width="22" height="8" rx="3" fill="#3a4654"/>
    ${Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.283; return `<circle cx="${55 + Math.cos(a) * 32}" cy="${68 + Math.sin(a) * 32}" r="1.6" fill="#2d3a4a"/>`; }).join('')}`);
  A.pyrosome = () => svg(160, 60, `
    <path d="M10 30 Q10 14 40 14 L140 16 Q154 18 154 30 Q154 42 140 44 L40 46 Q10 46 10 30Z" fill="#ffb8c8" opacity=".55"/>
    <ellipse cx="148" cy="30" rx="6" ry="12" fill="#1a3a5a"/>
    ${dots(Array.from({ length: 26 }, (_, i) => [24 + (i * 23) % 120, 20 + (i * 11) % 22]), '#7cf7ff', 2.2)}`);
  A.combjelly = () => svg(80, 110, `
    <path d="M40 6 Q70 10 70 56 Q68 100 40 104 Q12 100 10 56 Q10 10 40 6Z" fill="#c8102e" opacity=".55"/>
    <path d="M40 6 Q70 10 70 56 Q68 100 40 104" fill="none" stroke="#ff8a9a" stroke-width="2"/>
    ${[18, 28, 52, 62].map((x, i) => `<path d="M${x} 16 Q${x + (i < 2 ? -6 : 6)} 56 ${x} 96" stroke="url(#ds-rainbow)" stroke-width="2.5" fill="none" stroke-dasharray="3 2"/>`).join('')}
    <ellipse cx="40" cy="60" rx="12" ry="20" fill="#5a0010" opacity=".75"/>`);
  A.glassoctopus = () => A.octopus({ body: 'rgba(220,240,255,.45)' }).replace('</svg>', '<ellipse cx="55" cy="30" rx="6" ry="9" fill="#e8a33a" opacity=".8"/></svg>');
  A.loosejaw = () => A.viper().replace('</svg>', '<circle cx="30" cy="34" r="4" fill="#ff3a3a"/><circle cx="30" cy="34" r="8" fill="#ff3a3a" opacity=".3"/></svg>');
  A.cookiecutter = () => A.shark({ body: '#5a4a44', fin: '#3e322e' }).replace('</svg>', '<path d="M30 46 Q70 56 110 40" stroke="#7cf7ff" stroke-width="3" opacity=".7" fill="none"/></svg>');
  A.blobfish = () => svg(120, 80, `
    <path d="M10 40 Q10 10 46 10 Q80 10 84 30 Q96 30 112 22 Q108 40 112 58 Q96 50 84 50 Q78 72 46 72 Q10 70 10 40Z" fill="#f2b6b8"/>
    <path d="M18 48 Q24 66 40 62 Q30 52 30 44Z" fill="#e89a9e"/>
    <ellipse cx="22" cy="40" rx="10" ry="6" fill="#e48a90"/>${eye(30, 26, 4)}${eye(46, 24, 4)}
    <path d="M18 56 Q30 60 40 54" stroke="#b8686e" stroke-width="2" fill="none"/>`);
  A.goblin = () => A.shark({ body: '#e8b0b0', fin: '#d49090' }).replace('</svg>', '<path d="M4 34 Q-6 26 0 22 Q10 24 24 30Z" fill="#e8b0b0"/><path d="M8 44 l2 6 l3 -6 l3 6 l3 -6" stroke="#fff" stroke-width="1.5" fill="none"/></svg>');
  A.narwhal = () => svg(200, 80, `
    <path d="M6 30 L60 36" stroke="#efe6d6" stroke-width="4" stroke-linecap="round"/><path d="M14 31 l4 2 M26 32 l4 2 M38 33 l4 2 M50 35 l4 2" stroke="#c9bfae" stroke-width="1.5"/>
    <path d="M168 40 Q184 26 196 28 Q186 40 196 54 Q182 54 168 44Z" fill="#7d8a96"/>
    <path d="M56 40 Q60 22 96 22 Q140 22 170 42 Q140 60 96 60 Q60 60 56 40Z" fill="#9aa8b4"/>
    ${dots([[90, 30], [106, 28], [120, 34], [100, 40], [134, 40], [114, 46], [144, 46]], '#5d6a76', 2.5)}
    <path d="M60 44 Q90 60 140 52" stroke="#e8eef2" stroke-width="5" fill="none" opacity=".6"/>${eye(70, 38, 2.2)}`);
  A.dragonfish = () => A.eel({ body: '#141420' }).replace('</svg>', `${dots([[30, 40], [44, 33], [58, 30], [72, 33], [86, 38], [100, 40], [114, 37], [128, 34]], '#7cf7ff', 1.8)}<path d="M18 46 Q16 64 24 74" stroke="#141420" stroke-width="2" fill="none"/><circle cx="25" cy="75" r="3.5" fill="#ff5ab0"/><path d="M12 42 l2 6 l2 -6 l2 6" stroke="#fff" stroke-width="1.2" fill="none"/></svg>`);
  A.chimaera = () => svg(170, 70, `
    <path d="M70 36 Q120 40 168 30 Q120 46 72 46Z" fill="#9aa4b4"/>
    <path d="M10 36 Q20 14 50 16 Q74 18 80 36 Q74 50 50 52 Q20 54 10 36Z" fill="#b8c2d0"/>
    <path d="M40 18 L46 2 L54 18Z M60 34 Q74 50 66 62 Q58 52 52 44Z" fill="#9aa4b4"/>
    <path d="M30 26 Q50 20 70 30" stroke="#8a94a4" stroke-width="1.5" fill="none"/>${eye(24, 30, 6, '#9ef0e8')}`);
  A.yeti = () => svg(140, 90, `
    ${[0, 1, 2, 3].map((k) => `<path d="M${50 - k * 4} ${52 + k * 3} l-24 ${10 + k * 4}" stroke="#f3ece0" stroke-width="4" stroke-linecap="round"/><path d="M${90 + k * 4} ${52 + k * 3} l24 ${10 + k * 4}" stroke="#f3ece0" stroke-width="4" stroke-linecap="round"/>`).join('')}
    <path d="M50 40 Q30 20 10 22" stroke="#f3ece0" stroke-width="10" stroke-linecap="round" fill="none"/><path d="M90 40 Q110 20 130 22" stroke="#f3ece0" stroke-width="10" stroke-linecap="round" fill="none"/>
    ${Array.from({ length: 16 }, (_, i) => `<path d="M${14 + i * 2.5} ${22 + (i % 3)} l${-2 + (i % 3)} 8" stroke="#e0d2b8" stroke-width="1.5"/><path d="M${126 - i * 2.5} ${22 + (i % 3)} l${2 - (i % 3)} 8" stroke="#e0d2b8" stroke-width="1.5"/>`).join('')}
    <ellipse cx="70" cy="48" rx="24" ry="16" fill="#f8f2e8"/>`);
  A.sixgill = () => A.shark({ body: '#5a5e48', fin: '#46493a' }).replace('</svg>', `${[50, 54, 58, 62, 66, 70].map((x) => `<path d="M${x - 10} 30 v10" stroke="#3a3c2e" stroke-width="1.5"/>`).join('')}</svg>`).replace(/<circle cx="24" cy="30" r="2.6" fill="#fff"\/>/, '<circle cx="24" cy="30" r="2.6" fill="#7dffb0"/>');
  A.snail = () => svg(110, 80, `
    <path d="M20 64 Q20 52 40 52 L92 56 Q102 60 96 66 Q60 72 20 68Z" fill="#3a3a44"/>
    ${Array.from({ length: 12 }, (_, i) => `<path d="M${24 + i * 6} 56 l3 10 l3 -10" fill="#5a5a66"/>`).join('')}
    <circle cx="52" cy="38" r="24" fill="#2a2a30"/><circle cx="52" cy="38" r="24" fill="url(#ds-shine)"/>
    <path d="M52 38 m-14 0 a14 14 0 1 1 14 14 a9 9 0 1 1 -9 -9" stroke="#6a6a78" stroke-width="3" fill="none"/>`);
  A.whalefall = () => svg(200, 80, `
    <path d="M0 74 Q100 64 200 74 V80 H0Z" fill="#3a3530"/>
    <path d="M20 60 Q24 44 44 44 L62 50" stroke="#e9e1d2" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${Array.from({ length: 16 }, (_, i) => `<rect x="${60 + i * 7}" y="${56 + (i % 2)}" width="5" height="6" rx="1" fill="#e9e1d2"/>`).join('')}
    ${Array.from({ length: 8 }, (_, i) => `<path d="M${66 + i * 10} 56 q${4} -18 ${10} -20" stroke="#ddd3c0" stroke-width="2.5" fill="none"/>`).join('')}
    ${dots(Array.from({ length: 14 }, (_, i) => [66 + i * 7, 54 - (i % 3) * 2]), '#ff5a8a', 1.5)}`);
  A.endurance = () => A.ship({ hull: '#2a2420', funnels: [100], tilt: 4, rust: true }).replace('</svg>', '<path d="M60 40 V6 M100 38 V4 M140 40 V10" stroke="#3a2a1a" stroke-width="3"/><path d="M60 14 h30 M100 12 h30 M140 18 h22" stroke="#3a2a1a" stroke-width="2"/></svg>');
  A.pingpong = () => svg(100, 120, `
    <path d="M50 118 V20" stroke="#e8e0cc" stroke-width="4"/>
    ${[30, 46, 62, 78].map((y, i) => `<path d="M50 ${y} L${20 - i * 2} ${y - 4} M50 ${y} L${80 + i * 2} ${y - 4}" stroke="#e8e0cc" stroke-width="2"/><circle cx="${18 - i * 2}" cy="${y - 4}" r="6" fill="#f6f0e2"/><circle cx="${82 + i * 2}" cy="${y - 4}" r="6" fill="#f6f0e2"/>`).join('')}
    <circle cx="50" cy="14" r="7" fill="#f6f0e2"/>`);
  A.grenadier = () => svg(170, 60, `
    <path d="M10 30 Q20 10 50 14 Q80 18 168 32 Q80 42 50 46 Q20 50 10 30Z" fill="#8a96a6"/>
    <path d="M50 14 L56 0 L64 16Z" fill="#6a7686"/><path d="M60 46 Q100 56 160 34" stroke="#6a7686" stroke-width="2" fill="none" stroke-dasharray="2 3"/>
    ${eye(26, 26, 7)}<path d="M14 36 l-4 6" stroke="#6a7686" stroke-width="2"/>`);
  A.lizardfish = () => svg(160, 60, `
    <path d="M6 30 Q16 18 50 20 Q110 22 150 30 Q110 40 50 42 Q16 42 6 30Z" fill="#3a3e4a"/>
    <path d="M150 30 L158 20 L156 40Z M70 20 L78 8 L88 22Z" fill="#2a2e38"/>
    <path d="M8 32 l3 5 l3 -5 l3 5 l3 -5 l3 5" stroke="#fff" stroke-width="1.2" fill="none"/>${eye(24, 26, 3.2)}`);
  A.seaspider = () => svg(140, 100, `
    ${Array.from({ length: 8 }, (_, i) => { const s = i < 4 ? -1 : 1, k = i % 4; return `<path d="M70 ${44 + k * 4} q${s * 20} ${-30 + k * 8} ${s * (44 + k * 6)} ${-10 + k * 14} q${s * 6} 20 ${s * 14} ${36 - k * 4}" stroke="#d9603a" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`; }).join('')}
    <rect x="62" y="34" width="16" height="36" rx="7" fill="#e8743a"/><circle cx="70" cy="30" r="6" fill="#e8743a"/>`);
  A.brittlestar = () => svg(120, 100, `
    ${Array.from({ length: 5 }, (_, i) => { const a = i / 5 * 6.283 - 1.57; const x = 60 + Math.cos(a) * 46, y = 50 + Math.sin(a) * 40; return `<path d="M60 50 Q${60 + Math.cos(a + 0.4) * 30} ${50 + Math.sin(a + 0.4) * 28} ${x} ${y}" stroke="#d9a3c8" stroke-width="5" fill="none" stroke-linecap="round"/>`; }).join('')}
    <circle cx="60" cy="50" r="12" fill="#c87ab0"/><path d="M60 42 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1z" fill="#ffd0ea"/>`);
  A.blackbox = () => svg(110, 80, `
    <rect x="20" y="20" width="70" height="46" rx="6" fill="#ff7a1a"/><rect x="20" y="20" width="70" height="10" rx="4" fill="#ffffff" opacity=".25"/>
    <path d="M28 56 h54" stroke="#fff" stroke-width="3"/><text x="55" y="48" text-anchor="middle" font-size="9" font-weight="900" fill="#1d1b19" font-family="system-ui,sans-serif">FLIGHT RECORDER</text>
    <rect x="34" y="66" width="10" height="8" fill="#3a3f48"/><rect x="66" y="66" width="10" height="8" fill="#3a3f48"/>`);
  A.sealily = () => svg(90, 130, `
    <path d="M45 128 Q42 90 46 50" stroke="#d9c26a" stroke-width="5" fill="none"/>
    ${[110, 96, 82, 68].map((y) => `<path d="M44 ${y} l-10 -6 M46 ${y} l10 -6" stroke="#d9c26a" stroke-width="2"/>`).join('')}
    <ellipse cx="46" cy="46" rx="8" ry="6" fill="#e8b84a"/>
    ${Array.from({ length: 8 }, (_, i) => { const a = -2.8 + i * 0.32; return `<path d="M46 44 Q${46 + Math.cos(a) * 24} ${44 + Math.sin(a) * 34} ${46 + Math.cos(a) * 38} ${44 + Math.sin(a) * 26 + 10}" stroke="#ffcf5a" stroke-width="3" fill="none" stroke-linecap="round"/>`; }).join('')}`);
  A.bigfin = () => svg(120, 130, `
    <ellipse cx="60" cy="24" rx="40" ry="14" fill="#e8d8d0" opacity=".85"/><path d="M50 22 Q60 40 70 22 L66 50 L54 50Z" fill="#d8c0b8"/>
    ${Array.from({ length: 10 }, (_, i) => `<path d="M${50 + i * 2} 48 Q${46 + i * 3} 70 ${40 + i * 4} 90 Q${36 + i * 5} 110 ${42 + i * 4} 128" stroke="#e8d8d0" stroke-width="1.6" fill="none"/>`).join('')}
    <path d="M52 48 Q50 46 54 44 L66 44 Q70 46 68 48" fill="#d8c0b8"/>${eye(56, 46, 2)}${eye(64, 46, 2)}`);
  A.bag = () => svg(90, 100, `
    <path d="M22 30 Q20 18 30 16 Q34 6 40 18 L54 18 Q60 6 64 16 Q74 18 72 30 L78 90 Q46 100 14 90Z" fill="#eef2f6" opacity=".8" stroke="#c9d1dc" stroke-width="1.5"/>
    <path d="M30 40 Q46 50 62 40 M26 60 Q46 72 66 60" stroke="#c9d1dc" stroke-width="1.2" fill="none"/>`);
  A.kaiko = () => svg(140, 90, `
    <rect x="20" y="20" width="100" height="44" rx="6" fill="#ffd23f"/><rect x="20" y="20" width="100" height="12" rx="6" fill="#fff" opacity=".3"/>
    <path d="M20 64 h100 v10 h-100z" fill="#3a3f48"/><circle cx="34" cy="44" r="8" fill="#bfe8ff" stroke="#2d3a4a" stroke-width="3"/>
    <path d="M110 44 l20 10 l-4 6" stroke="#5a6577" stroke-width="3" fill="none"/><text x="76" y="50" text-anchor="middle" font-size="12" font-weight="900" fill="#2d3a4a" font-family="system-ui,sans-serif">KAIKO</text>
    <path d="M70 20 V0" stroke="#5a6577" stroke-width="2"/>`);
})();
