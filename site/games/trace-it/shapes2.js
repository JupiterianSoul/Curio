(() => {
  const f = (n) => Math.round(n * 10) / 10;
  const poly = (pts, close = true) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + (close ? ' Z' : '');
  const regular = (n, r, cx = 50, cy = 50, rot = -Math.PI / 2) => { const pts = []; for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return poly(pts); };
  const star = (n, ro, ri, cx = 50, cy = 52) => { const pts = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro; const a = -Math.PI / 2 + (i / (n * 2)) * Math.PI * 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return poly(pts); };
  const curve = (fn, a, b, steps, close = false) => { const pts = []; for (let i = 0; i <= steps; i++) pts.push(fn(a + (b - a) * (i / steps))); return poly(pts, close); };
  const circ = (cx, cy, r) => `M${f(cx + r)} ${f(cy)} A${r} ${r} 0 1 1 ${f(cx - r)} ${f(cy)} A${r} ${r} 0 1 1 ${f(cx + r)} ${f(cy)} Z`;
  const ell = (cx, cy, rx, ry) => `M${f(cx + rx)} ${f(cy)} A${rx} ${ry} 0 1 1 ${f(cx - rx)} ${f(cy)} A${rx} ${ry} 0 1 1 ${f(cx + rx)} ${f(cy)} Z`;
  const T = Math.PI * 2;
  const add = [
    { id: 'diamond', name: 'Diamond', emoji: '🔷', lvl: 1, cat: 'shapes', d: poly([[50, 6], [86, 50], [50, 94], [14, 50]]) },
    { id: 'octagon', name: 'Octagon', emoji: '🛑', lvl: 1, cat: 'shapes', d: regular(8, 42, 50, 50, Math.PI / 8) },
    { id: 'plus', name: 'Plus', emoji: '➕', lvl: 1, cat: 'shapes', d: poly([[38, 8], [62, 8], [62, 38], [92, 38], [92, 62], [62, 62], [62, 92], [38, 92], [38, 62], [8, 62], [8, 38], [38, 38]]) },
    { id: 'oval', name: 'Oval', emoji: '🥚', lvl: 1, cat: 'shapes', d: ell(50, 50, 42, 28) },
    { id: 'semicircle', name: 'Semicircle', emoji: '🌗', lvl: 1, cat: 'shapes', d: 'M8 66 A42 42 0 0 1 92 66 Z' },
    { id: 'parallelogram', name: 'Parallelogram', emoji: '▱', lvl: 1, cat: 'shapes', d: poly([[26, 24], [94, 24], [74, 76], [6, 76]]) },
    { id: 'trapezoid', name: 'Trapezoid', emoji: '⏢', lvl: 1, cat: 'shapes', d: poly([[30, 22], [70, 22], [92, 78], [8, 78]]) },
    { id: 'star6', name: 'Six-point star', emoji: '✡️', lvl: 2, cat: 'shapes', d: star(6, 44, 24, 50, 50) },
    { id: 'star8', name: 'Compass star', emoji: '🧭', lvl: 2, cat: 'shapes', d: star(8, 44, 16, 50, 50) },
    { id: 'roundsq', name: 'Rounded square', emoji: '🔲', lvl: 1, cat: 'shapes', d: 'M28 12 L72 12 Q88 12 88 28 L88 72 Q88 88 72 88 L28 88 Q12 88 12 72 L12 28 Q12 12 28 12 Z' },
    { id: 'zigzag', name: 'Zigzag', emoji: '〰️', lvl: 1, cat: 'shapes', d: poly([[6, 70], [20, 30], [34, 70], [48, 30], [62, 70], [76, 30], [94, 70]], false) },
    { id: 'rings', name: 'Two rings', emoji: '⭕', lvl: 2, cat: 'shapes', d: circ(34, 50, 26) + ' ' + circ(66, 50, 26) },
    { id: 'rose3', name: 'Three petals', emoji: '☘️', lvl: 2, cat: 'curves', d: curve((t) => [50 + 42 * Math.cos(3 * t) * Math.cos(t), 50 + 42 * Math.cos(3 * t) * Math.sin(t)], 0, Math.PI, 180, true) },
    { id: 'rose5', name: 'Five petals', emoji: '🌸', lvl: 3, cat: 'curves', d: curve((t) => [50 + 42 * Math.cos(5 * t) * Math.cos(t), 50 + 42 * Math.cos(5 * t) * Math.sin(t)], 0, Math.PI, 260, true) },
    { id: 'cardioid', name: 'Cardioid', emoji: '🫀', lvl: 2, cat: 'curves', d: curve((t) => { const r = 26 * (1 - Math.sin(t)); return [50 + r * Math.cos(t), 22 - r * Math.sin(t)]; }, 0, T, 200, true) },
    { id: 'astroid', name: 'Astroid', emoji: '✴️', lvl: 2, cat: 'curves', d: curve((t) => [50 + 42 * Math.pow(Math.cos(t), 3), 50 + 42 * Math.pow(Math.sin(t), 3)], 0, T, 200, true) },
    { id: 'lissajous', name: 'Lissajous', emoji: '🪢', lvl: 3, cat: 'curves', d: curve((t) => [50 + 40 * Math.sin(3 * t + Math.PI / 2), 50 + 40 * Math.sin(2 * t)], 0, T, 260, true) },
    { id: 'trefoil', name: 'Trefoil', emoji: '♾️', lvl: 3, cat: 'curves', d: curve((t) => [50 + 14 * (Math.sin(t) + 2 * Math.sin(2 * t)), 50 + 14 * (Math.cos(t) - 2 * Math.cos(2 * t))], 0, T, 240, true) },
    { id: 'coil', name: 'Spring', emoji: '🌀', lvl: 2, cat: 'curves', d: curve((t) => [10 + t * 13 + 12 * Math.cos(t * T + Math.PI), 50 + 22 * Math.sin(t * T + Math.PI)], 0, 6, 300) },
    { id: 'squiggle', name: 'Squiggle', emoji: '🐍', lvl: 2, cat: 'curves', d: curve((t) => [8 + t * 84, 50 + 26 * Math.sin(t * T * 2.5) * Math.cos(t * 3)], 0, 1, 160) },
    { id: 'dspiral', name: 'Double spiral', emoji: '💫', lvl: 3, cat: 'curves', d: curve((t) => { const s = t < 0 ? -1 : 1, a = Math.abs(t) * T * 2.2, r = Math.abs(t) * 22; return [50 + s * 22 - s * r * Math.cos(a), 50 - r * Math.sin(a) * s]; }, -1, 1, 300) },
    { id: 'gear', name: 'Gear', emoji: '⚙️', lvl: 3, cat: 'shapes', d: curve((t) => { const r = 34 + 8 * Math.max(-1, Math.min(1, 3 * Math.sin(t * 10))); return [50 + r * Math.cos(t), 50 + r * Math.sin(t)]; }, 0, T, 300, true) },
    { id: 'letterW', name: 'Letter W', emoji: '🔠', lvl: 1, cat: 'letters', d: poly([[6, 14], [26, 88], [50, 36], [74, 88], [94, 14]], false) },
    { id: 'letterZ', name: 'Letter Z', emoji: '💤', lvl: 1, cat: 'letters', d: poly([[14, 14], [86, 14], [14, 86], [86, 86]], false) },
    { id: 'letterE', name: 'Cursive e', emoji: '✒️', lvl: 2, cat: 'letters', d: 'M14 60 C40 62 80 54 78 34 C76 14 40 12 28 34 C14 60 30 88 56 88 C72 88 82 80 90 70' },
    { id: 'three', name: 'Number 3', emoji: '3️⃣', lvl: 1, cat: 'letters', d: 'M22 20 C34 6 72 6 74 26 C76 44 54 48 44 48 C60 48 80 54 78 72 C76 94 34 96 20 80' },
    { id: 'five', name: 'Number 5', emoji: '5️⃣', lvl: 1, cat: 'letters', d: 'M78 12 L30 12 L24 48 C40 38 74 38 78 62 C82 88 46 98 22 82' },
    { id: 'at', name: 'At sign', emoji: '📧', lvl: 3, cat: 'letters', d: 'M64 40 C60 28 40 28 36 46 C32 64 52 70 60 56 L66 36 L62 58 C62 70 80 70 86 56 C94 32 76 10 50 10 C24 10 8 32 10 54 C12 78 36 94 60 90 C70 88 76 84 80 80' },
    { id: 'amp', name: 'Ampersand', emoji: '➰', lvl: 3, cat: 'letters', d: 'M86 88 L34 38 C24 28 28 10 44 10 C60 10 62 28 50 38 L26 56 C12 68 18 90 40 90 C58 90 70 78 80 58' },
    { id: 'bell', name: 'Bell', emoji: '🔔', lvl: 2, cat: 'objects', d: 'M50 8 C30 8 26 26 26 44 C26 62 20 70 10 78 L90 78 C80 70 74 62 74 44 C74 26 70 8 50 8 Z M42 84 C42 94 58 94 58 84' },
    { id: 'bulb', name: 'Light bulb', emoji: '💡', lvl: 2, cat: 'objects', d: 'M38 74 C38 62 20 54 20 36 C20 18 34 6 50 6 C66 6 80 18 80 36 C80 54 62 62 62 74 Z M38 82 L62 82 M40 90 L60 90' },
    { id: 'envelope', name: 'Envelope', emoji: '✉️', lvl: 1, cat: 'objects', d: poly([[8, 22], [92, 22], [92, 80], [8, 80], [8, 22], [50, 56], [92, 22]], false) },
    { id: 'pencil', name: 'Pencil', emoji: '✏️', lvl: 1, cat: 'objects', d: poly([[10, 74], [70, 14], [86, 30], [26, 90], [6, 94]]) },
    { id: 'glasses', name: 'Glasses', emoji: '👓', lvl: 2, cat: 'objects', d: circ(28, 54, 18) + ' ' + circ(72, 54, 18) + ' M46 52 C48 46 52 46 54 52 M10 52 L4 40 M90 52 L96 40' },
    { id: 'anchor', name: 'Anchor', emoji: '⚓', lvl: 2, cat: 'objects', d: circ(50, 16, 8) + ' M50 24 L50 90 M32 38 L68 38 M14 60 C16 80 34 90 50 90 C66 90 84 80 86 60 M8 66 L14 56 L22 64 M92 66 L86 56 L78 64' },
    { id: 'kite', name: 'Kite', emoji: '🪁', lvl: 2, cat: 'objects', d: poly([[54, 6], [86, 36], [54, 70], [22, 36]]) + ' M54 70 C46 78 62 82 52 90 C46 94 50 98 44 98' },
    { id: 'balloon', name: 'Balloon', emoji: '🎈', lvl: 1, cat: 'objects', d: 'M50 70 C30 66 18 48 18 32 C18 14 32 4 50 4 C68 4 82 14 82 32 C82 48 70 66 50 70 L44 76 L56 76 L50 70 C44 80 58 86 50 96' },
    { id: 'bottle', name: 'Bottle', emoji: '🍾', lvl: 1, cat: 'objects', d: poly([[42, 6], [58, 6], [58, 28], [70, 40], [70, 94], [30, 94], [30, 40], [42, 28]]) },
    { id: 'lollipop', name: 'Lollipop', emoji: '🍭', lvl: 2, cat: 'objects', d: 'M50 64 C34 64 22 52 22 36 C22 20 34 8 50 8 C66 8 78 20 78 36 C78 48 68 56 56 56 C46 56 40 48 40 38 C40 30 46 24 52 24 C60 24 64 30 62 38 M50 64 L50 96' },
    { id: 'cone', name: 'Ice cream', emoji: '🍦', lvl: 1, cat: 'objects', d: 'M24 44 C16 26 32 8 50 8 C68 8 84 26 76 44 Z M24 44 L50 94 L76 44' },
    { id: 'hourglass', name: 'Hourglass', emoji: '⏳', lvl: 1, cat: 'objects', d: poly([[18, 8], [82, 8], [82, 14], [54, 50], [82, 86], [82, 92], [18, 92], [18, 86], [46, 50], [18, 14]]) },
    { id: 'trophy', name: 'Trophy', emoji: '🏆', lvl: 2, cat: 'objects', d: 'M26 10 L74 10 C74 40 64 54 50 58 C36 54 26 40 26 10 Z M26 18 C10 18 10 42 30 44 M74 18 C90 18 90 42 70 44 M50 58 L50 76 M34 76 L66 76 L70 90 L30 90 Z' },
    { id: 'shield', name: 'Shield', emoji: '🛡️', lvl: 1, cat: 'objects', d: 'M50 6 L88 18 C88 56 74 80 50 94 C26 80 12 56 12 18 Z' },
    { id: 'tent', name: 'Tent', emoji: '⛺', lvl: 1, cat: 'objects', d: poly([[6, 86], [50, 12], [94, 86], [6, 86], [50, 86], [50, 12]], false) },
    { id: 'magnifier', name: 'Magnifier', emoji: '🔍', lvl: 1, cat: 'objects', d: circ(40, 40, 28) + ' M60 60 L90 90' },
    { id: 'headphones', name: 'Headphones', emoji: '🎧', lvl: 2, cat: 'objects', d: 'M16 62 L16 52 C16 26 32 10 50 10 C68 10 84 26 84 52 L84 62 M10 60 L26 60 L26 90 L10 90 Z M74 60 L90 60 L90 90 L74 90 Z' },
    { id: 'whale', name: 'Whale', emoji: '🐋', lvl: 2, cat: 'animals', d: 'M8 54 C8 30 34 22 56 30 C70 36 76 48 80 40 C82 30 88 22 96 24 C90 30 92 40 90 48 C86 64 70 78 44 78 C22 78 8 70 8 54 Z M30 22 C30 12 22 10 18 14 M30 22 C30 12 38 10 42 14' },
    { id: 'rabbit', name: 'Rabbit', emoji: '🐰', lvl: 2, cat: 'animals', d: 'M36 48 C30 30 24 6 34 6 C44 6 44 30 44 44 M56 44 C56 30 56 6 66 6 C76 6 70 30 64 48 C80 54 82 76 70 86 C60 94 40 94 30 86 C18 76 20 54 36 48 C42 44 58 44 64 48' },
    { id: 'turtle', name: 'Turtle', emoji: '🐢', lvl: 2, cat: 'animals', d: 'M14 64 C14 40 30 26 50 26 C70 26 86 40 86 64 Z M86 58 C90 54 98 56 98 62 C98 68 92 70 86 66 M26 64 L22 76 L32 76 L34 64 M66 64 L68 76 L78 76 L74 64 M14 62 L6 66' },
    { id: 'butterfly', name: 'Butterfly', emoji: '🦋', lvl: 2, cat: 'animals', d: 'M50 30 C40 6 6 6 8 30 C10 46 36 50 50 50 C36 52 14 62 18 80 C24 96 46 86 50 64 C54 86 76 96 82 80 C86 62 64 52 50 50 C64 50 90 46 92 30 C94 6 60 6 50 30 Z M50 30 L50 74 M48 30 L40 16 M52 30 L60 16' },
    { id: 'bat', name: 'Bat', emoji: '🦇', lvl: 3, cat: 'animals', d: 'M50 36 L44 26 L44 40 C34 30 20 26 4 34 C14 40 16 50 14 58 C22 52 30 54 34 62 C38 54 44 54 50 62 C56 54 62 54 66 62 C70 54 78 52 86 58 C84 50 86 40 96 34 C80 26 66 30 56 40 L56 26 Z' },
    { id: 'duck', name: 'Duck', emoji: '🦆', lvl: 2, cat: 'animals', d: 'M28 40 C28 22 50 16 56 32 L72 34 L58 42 C58 46 60 50 66 52 C80 54 92 58 92 66 C92 82 74 90 50 90 C24 90 8 78 12 60 L28 64 C30 58 30 50 28 40 Z' },
    { id: 'mouse', name: 'Mouse', emoji: '🐭', lvl: 2, cat: 'animals', d: circ(26, 28, 16) + ' ' + circ(74, 28, 16) + ' ' + ell(50, 58, 34, 30) },
    { id: 'pig', name: 'Pig face', emoji: '🐷', lvl: 2, cat: 'animals', d: ell(50, 54, 40, 34) + ' ' + ell(50, 64, 16, 11) + ' M22 26 L14 6 L36 22 M78 26 L86 6 L64 22' },
    { id: 'dolphin', name: 'Dolphin', emoji: '🐬', lvl: 3, cat: 'animals', d: 'M8 46 L22 44 C30 30 50 22 66 30 L72 18 L76 34 C86 42 90 56 86 70 L96 80 L80 78 L74 90 L72 74 C60 70 46 66 32 58 C24 58 14 54 8 46 Z' },
    { id: 'jellyfish', name: 'Jellyfish', emoji: '🪼', lvl: 2, cat: 'animals', d: 'M14 50 C14 26 30 10 50 10 C70 10 86 26 86 50 Z M26 50 C20 64 32 74 26 90 M42 50 C38 66 48 76 42 94 M58 50 C62 66 52 76 58 94 M74 50 C80 64 68 74 74 90' },
    { id: 'owl', name: 'Owl', emoji: '🦉', lvl: 3, cat: 'animals', d: 'M22 20 L34 30 C44 26 56 26 66 30 L78 20 L80 40 C90 60 82 90 50 92 C18 90 10 60 20 40 Z ' + circ(38, 46, 10) + ' ' + circ(62, 46, 10) + ' M46 58 L50 66 L54 58 Z' },
    { id: 'tulip', name: 'Tulip', emoji: '🌷', lvl: 1, cat: 'nature', d: 'M28 20 L40 32 L50 14 L60 32 L72 20 L72 44 C72 58 62 66 50 66 C38 66 28 58 28 44 Z M50 66 L50 96 M50 84 C40 78 30 78 24 70 M50 88 C60 80 70 82 76 74' },
    { id: 'drop', name: 'Raindrop', emoji: '💧', lvl: 1, cat: 'nature', d: 'M50 6 C60 26 80 46 80 64 C80 82 66 94 50 94 C34 94 20 82 20 64 C20 46 40 26 50 6 Z' },
    { id: 'snowflake', name: 'Snowflake', emoji: '❄️', lvl: 2, cat: 'nature', d: [0, 1, 2].map((k) => { const a = k * Math.PI / 3, c = Math.cos(a), s = Math.sin(a); return `M${f(50 - 42 * c)} ${f(50 - 42 * s)} L${f(50 + 42 * c)} ${f(50 + 42 * s)}`; }).join(' ') + [0, 1, 2, 3, 4, 5].map((k) => { const a = k * Math.PI / 3, px = 50 + 28 * Math.cos(a), py = 50 + 28 * Math.sin(a); return ` M${f(px + 9 * Math.cos(a + 2.2))} ${f(py + 9 * Math.sin(a + 2.2))} L${f(px)} ${f(py)} L${f(px + 9 * Math.cos(a - 2.2))} ${f(py + 9 * Math.sin(a - 2.2))}`; }).join('') },
    { id: 'acorn', name: 'Acorn', emoji: '🌰', lvl: 2, cat: 'nature', d: 'M18 40 C18 22 34 14 50 14 C66 14 82 22 82 40 Z M50 14 L52 4 M24 40 C24 66 40 86 50 94 C60 86 76 66 76 40' },
    { id: 'palm', name: 'Palm tree', emoji: '🌴', lvl: 3, cat: 'nature', d: 'M46 94 C48 70 52 50 50 30 M50 30 C40 18 22 18 8 28 C24 26 36 28 50 30 C44 16 50 6 62 4 C58 14 54 22 50 30 C62 20 80 20 92 30 C78 30 64 30 50 30 C64 34 78 44 82 56 C70 46 60 38 50 30' },
    { id: 'volcano', name: 'Volcano', emoji: '🌋', lvl: 2, cat: 'nature', d: 'M4 92 L36 36 L44 42 L56 36 L64 42 L96 92 Z M42 30 C38 20 44 14 48 8 M58 30 C62 22 58 14 64 8 M50 28 L50 16' },
    { id: 'rainbow', name: 'Rainbow', emoji: '🌈', lvl: 2, cat: 'nature', d: 'M6 80 A44 44 0 0 1 94 80 M20 80 A30 30 0 0 1 80 80 M34 80 A16 16 0 0 1 66 80' },
    { id: 'clover', name: 'Four-leaf clover', emoji: '🍀', lvl: 3, cat: 'nature', d: 'M50 50 C30 50 16 40 22 26 C28 14 46 18 50 30 C54 18 72 14 78 26 C84 40 70 50 50 50 C70 50 84 60 78 74 C72 86 54 82 50 70 C46 82 28 86 22 74 C16 60 30 50 50 50 M50 70 C56 82 62 90 68 96' },
    { id: 'cactus', name: 'Cactus', emoji: '🌵', lvl: 2, cat: 'nature', d: 'M40 94 L40 20 C40 8 60 8 60 20 L60 94 M40 60 L26 60 C18 60 16 54 16 48 L16 30 C16 24 26 24 26 30 L26 50 L40 50 M60 46 L74 46 L74 26 C74 20 84 20 84 26 L84 46 C84 52 80 56 74 56 L60 56' },
    { id: 'mushroom', name: 'Mushroom', emoji: '🍄', lvl: 1, cat: 'nature', d: 'M8 54 C8 26 28 10 50 10 C72 10 92 26 92 54 Z M36 54 L32 88 C32 94 68 94 68 88 L64 54' },
    { id: 'sailboat', name: 'Sailboat', emoji: '⛵', lvl: 2, cat: 'objects', d: 'M10 70 L90 70 L76 88 L24 88 Z M50 70 L50 6 M50 10 L84 62 L50 62 M46 18 L16 62 L46 62' },
    { id: 'lighthouse', name: 'Lighthouse', emoji: '🗼', lvl: 2, cat: 'objects', d: 'M34 94 L40 34 L60 34 L66 94 Z M36 34 L64 34 L64 24 L36 24 Z M40 24 L40 14 L60 14 L60 24 M38 14 L50 4 L62 14 M38 54 L62 54 M36 74 L64 74' }
  ];
  const catOf = { circle: 'shapes', triangle: 'shapes', square: 'shapes', pentagon: 'shapes', hexagon: 'shapes', heart: 'shapes', star: 'shapes', wave: 'curves', arrow: 'shapes', moon: 'nature', lightning: 'nature', cloud: 'nature', spiral: 'curves', infinity: 'curves', flower: 'nature', house: 'objects', fish: 'animals', cat: 'animals', car: 'objects', apple: 'nature', leaf: 'nature', tree: 'nature', umbrella: 'objects', key: 'objects', note: 'objects', bird: 'animals', mountains: 'nature', sun: 'nature', ghost: 'objects', rocket: 'objects', crown: 'objects', gem: 'shapes', cup: 'objects', snail: 'animals', eight: 'letters', two: 'letters', curio: 'curves' };
  window.TRACE_SHAPES.forEach((s) => { if (!s.cat) s.cat = catOf[s.id] || 'objects'; });
  window.TRACE_SHAPES.push(...add);
})();
