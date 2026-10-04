(() => {
  const f = (n) => Math.round(n * 10) / 10;
  const poly = (pts, close = true) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + (close ? ' Z' : '');
  const regular = (n, r, cx = 50, cy = 52, rot = -Math.PI / 2) => {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return poly(pts);
  };
  const star = (n, ro, ri, cx = 50, cy = 53) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro; const a = -Math.PI / 2 + (i / (n * 2)) * Math.PI * 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return poly(pts);
  };
  const curve = (fn, a, b, steps, close = false) => {
    const pts = [];
    for (let i = 0; i <= steps; i++) pts.push(fn(a + (b - a) * (i / steps)));
    return poly(pts, close);
  };
  const circ = (cx, cy, r) => `M${f(cx + r)} ${f(cy)} A${r} ${r} 0 1 1 ${f(cx - r)} ${f(cy)} A${r} ${r} 0 1 1 ${f(cx + r)} ${f(cy)} Z`;
  const rays = (n, r1, r2, cx = 50, cy = 50) => {
    let d = '';
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; d += ` M${f(cx + r1 * Math.cos(a))} ${f(cy + r1 * Math.sin(a))} L${f(cx + r2 * Math.cos(a))} ${f(cy + r2 * Math.sin(a))}`; }
    return d;
  };

  window.TRACE_SHAPES = [
    { id: 'circle', name: 'Circle', emoji: '⚪', lvl: 1, d: circ(50, 50, 40) },
    { id: 'triangle', name: 'Triangle', emoji: '🔺', lvl: 1, d: poly([[50, 10], [92, 86], [8, 86]]) },
    { id: 'square', name: 'Square', emoji: '🟥', lvl: 1, d: poly([[12, 12], [88, 12], [88, 88], [12, 88]]) },
    { id: 'pentagon', name: 'Pentagon', emoji: '⬟', lvl: 1, d: regular(5, 42) },
    { id: 'hexagon', name: 'Hexagon', emoji: '⬢', lvl: 1, d: regular(6, 42, 50, 50, 0) },
    { id: 'heart', name: 'Heart', emoji: '❤️', lvl: 1, d: 'M50 86 C22 66 6 50 9 31 C12 14 36 8 50 28 C64 8 88 14 91 31 C94 50 78 66 50 86 Z' },
    { id: 'star', name: 'Star', emoji: '⭐', lvl: 2, d: star(5, 44, 18) },
    { id: 'wave', name: 'Wave', emoji: '🌊', lvl: 1, d: curve((t) => [8 + t * 84, 50 + 20 * Math.sin(t * Math.PI * 4)], 0, 1, 80) },
    { id: 'arrow', name: 'Arrow', emoji: '➡️', lvl: 1, d: 'M8 42 L58 42 L58 22 L92 50 L58 78 L58 58 L8 58 Z' },
    { id: 'moon', name: 'Moon', emoji: '🌙', lvl: 2, d: 'M62 10 A42 42 0 1 0 62 90 A44 44 0 0 1 62 10 Z' },
    { id: 'lightning', name: 'Lightning', emoji: '⚡', lvl: 2, d: 'M60 6 L24 54 L46 54 L36 94 L78 40 L55 40 L66 6 Z' },
    { id: 'cloud', name: 'Cloud', emoji: '☁️', lvl: 2, d: 'M26 74 C8 74 6 52 22 48 C20 30 42 22 52 34 C58 18 84 22 82 44 C96 46 96 74 78 74 Z' },
    { id: 'spiral', name: 'Spiral', emoji: '🌀', lvl: 3, d: curve((t) => { const a = t * Math.PI * 6; const r = 3 + t * 40; return [50 + r * Math.cos(a), 50 + r * Math.sin(a)]; }, 0, 1, 180) },
    { id: 'infinity', name: 'Infinity', emoji: '♾️', lvl: 2, d: curve((t) => { const s = Math.sin(t), c = Math.cos(t), k = 1 + s * s; return [50 + 44 * c / k, 50 + 44 * s * c / k]; }, 0, Math.PI * 2, 120, true) },
    { id: 'flower', name: 'Flower', emoji: '🌸', lvl: 3, d: curve((t) => { const r = 42 * Math.cos(5 * t); return [50 + r * Math.cos(t), 50 + r * Math.sin(t)]; }, 0, Math.PI, 200, true) },
    { id: 'house', name: 'House', emoji: '🏠', lvl: 1, d: 'M14 90 L14 46 L50 14 L86 46 L86 90 Z M40 90 L40 62 L60 62 L60 90' },
    { id: 'fish', name: 'Fish', emoji: '🐟', lvl: 2, d: 'M10 50 C26 26 58 24 74 46 L92 30 L90 70 L74 54 C58 76 26 74 10 50 Z' },
    { id: 'cat', name: 'Cat', emoji: '🐱', lvl: 2, d: 'M20 42 L22 10 L40 26 C46 24 54 24 60 26 L78 10 L80 42 C90 60 80 88 50 88 C20 88 10 60 20 42 Z M45 60 L55 60 L50 66 Z' },
    { id: 'car', name: 'Car', emoji: '🚗', lvl: 2, d: 'M8 68 L8 54 C8 49 12 47 18 46 L30 44 L40 28 C42 26 44 25 48 25 L68 25 C72 25 74 26 76 29 L85 44 C91 45 94 49 94 55 L94 68 Z' + circ(28, 70, 9) + circ(74, 70, 9) },
    { id: 'apple', name: 'Apple', emoji: '🍎', lvl: 2, d: 'M50 30 C40 20 16 22 14 46 C12 70 30 92 42 88 C46 86 54 86 58 88 C70 92 88 70 86 46 C84 22 60 20 50 30 Z M50 30 C50 22 53 14 58 8' },
    { id: 'leaf', name: 'Leaf', emoji: '🍃', lvl: 1, d: 'M14 86 C14 40 40 14 88 12 C86 60 60 86 14 86 Z M14 86 L66 34' },
    { id: 'tree', name: 'Pine Tree', emoji: '🌲', lvl: 2, d: 'M50 6 L72 34 L60 34 L80 60 L65 60 L88 86 L12 86 L35 60 L20 60 L40 34 L28 34 Z M44 86 L44 96 L56 96 L56 86' },
    { id: 'umbrella', name: 'Umbrella', emoji: '☂️', lvl: 2, d: 'M8 50 C10 24 30 10 50 10 C70 10 90 24 92 50 C86 44 78 44 72 50 C66 44 56 44 50 50 C44 44 34 44 28 50 C22 44 14 44 8 50 Z M50 50 L50 84 C50 92 38 92 38 84' },
    { id: 'key', name: 'Key', emoji: '🔑', lvl: 2, d: circ(26, 50, 16) + ' M42 50 L92 50 L92 64 M80 50 L80 60 M70 50 L70 62' },
    { id: 'note', name: 'Music Notes', emoji: '🎵', lvl: 3, d: 'M44 76 L44 20 L80 12 L80 68 M44 76 C44 84 24 88 24 80 C24 72 44 68 44 76 Z M80 68 C80 76 60 80 60 72 C60 64 80 60 80 68 Z' },
    { id: 'bird', name: 'Bird', emoji: '🐦', lvl: 1, d: 'M8 42 C20 28 36 30 50 52 C64 30 80 28 92 42' },
    { id: 'mountains', name: 'Mountains', emoji: '🏔️', lvl: 1, d: 'M4 84 L32 34 L46 56 L62 22 L96 84 Z M24 48 L32 34 L40 48' },
    { id: 'sun', name: 'Sun', emoji: '☀️', lvl: 2, d: circ(50, 50, 20) + rays(8, 28, 44) },
    { id: 'ghost', name: 'Ghost', emoji: '👻', lvl: 2, d: 'M22 90 L22 44 C22 22 36 10 50 10 C64 10 78 22 78 44 L78 90 L68 80 L59 90 L50 80 L41 90 L32 80 Z' + circ(40, 42, 5) + circ(60, 42, 5) },
    { id: 'rocket', name: 'Rocket', emoji: '🚀', lvl: 3, d: 'M50 6 C64 18 68 36 66 64 L34 64 C32 36 36 18 50 6 Z M34 50 L20 72 L34 68 M66 50 L80 72 L66 68 M42 64 L46 78 L54 78 L58 64' + circ(50, 36, 7) },
    { id: 'crown', name: 'Crown', emoji: '👑', lvl: 2, d: 'M12 78 L8 30 L30 50 L50 18 L70 50 L92 30 L88 78 Z M12 90 L88 90' },
    { id: 'gem', name: 'Gem', emoji: '💎', lvl: 3, d: 'M30 16 L70 16 L90 38 L50 90 L10 38 Z M10 38 L90 38 M30 16 L40 38 L50 90 M70 16 L60 38 L50 90' },
    { id: 'cup', name: 'Teacup', emoji: '☕', lvl: 2, d: 'M18 34 L80 34 L75 74 C73 83 67 88 59 88 L39 88 C31 88 25 83 23 74 Z M79 44 C94 44 94 66 76 66' },
    { id: 'snail', name: 'Snail', emoji: '🐌', lvl: 3, d: curve((t) => { const a = t * Math.PI * 4; const r = 2 + t * 26; return [44 + r * Math.cos(a), 52 + r * Math.sin(a)]; }, 0, 1, 120) + ' M70 52 C70 66 76 80 92 80 L8 80 M80 66 L86 46 M86 66 L94 50' },
    { id: 'A', name: 'Letter A', emoji: '🅰️', lvl: 1, d: 'M18 90 L50 10 L82 90 M31 58 L69 58' },
    { id: 'B', name: 'Letter B', emoji: '🅱️', lvl: 2, d: 'M24 10 L24 90 M24 10 L54 10 C74 10 74 48 54 48 L24 48 M54 48 C80 48 80 90 54 90 L24 90' },
    { id: 'S', name: 'Letter S', emoji: '🔤', lvl: 2, d: 'M78 22 C70 8 26 6 24 28 C22 50 78 46 78 70 C78 94 30 94 20 76' },
    { id: 'M', name: 'Letter M', emoji: 'Ⓜ️', lvl: 1, d: 'M14 90 L14 10 L50 60 L86 10 L86 90' },
    { id: 'G', name: 'Letter G', emoji: '🔤', lvl: 2, d: 'M80 26 C70 8 40 6 26 22 C10 40 14 76 34 88 C52 98 78 90 82 66 L82 54 L56 54' },
    { id: 'R', name: 'Letter R', emoji: '🔤', lvl: 2, d: 'M24 90 L24 10 L56 10 C80 10 80 50 56 50 L24 50 M50 50 L80 90' },
    { id: 'eight', name: 'Number 8', emoji: '8️⃣', lvl: 2, d: 'M50 48 C30 46 24 34 26 24 C28 12 40 8 50 8 C60 8 72 12 74 24 C76 34 70 46 50 48 C26 50 20 64 22 74 C24 86 38 92 50 92 C62 92 76 86 78 74 C80 64 74 50 50 48 Z' },
    { id: 'two', name: 'Number 2', emoji: '2️⃣', lvl: 1, d: 'M22 28 C26 10 48 6 62 10 C80 16 80 38 66 50 L20 90 L82 90' },
    { id: 'curio', name: 'Spiro Loop', emoji: '➰', lvl: 3, d: curve((t) => [50 + 30 * Math.cos(t) + 12 * Math.cos(6 * t), 50 + 30 * Math.sin(t) - 12 * Math.sin(6 * t)], 0, Math.PI * 2, 240, true) }
  ];
})();
