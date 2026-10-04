(() => {
  const PALETTES = [
    { id: 'curio', name: 'Curio 32', colors: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa', '#291814', '#111d35', '#422136', '#125359', '#742f29', '#49333b', '#a28879', '#f3ef7d', '#be1250', '#ff6c24', '#a8e72e', '#00b543', '#065ab5', '#754665', '#ff6e59', '#ffffff'] },
    { id: 'pico8', name: 'PICO-8', colors: ['#000000', '#1d2b53', '#7e2553', '#008751', '#ab5236', '#5f574f', '#c2c3c7', '#fff1e8', '#ff004d', '#ffa300', '#ffec27', '#00e436', '#29adff', '#83769c', '#ff77a8', '#ffccaa'] },
    { id: 'sweetie', name: 'Sweetie 16', colors: ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86', '#333c57'] },
    { id: 'endesga', name: 'Endesga 32', colors: ['#be4a2f', '#d77643', '#ead4aa', '#e4a672', '#b86f50', '#733e39', '#3e2731', '#a22633', '#e43b44', '#f77622', '#feae34', '#fee761', '#63c74d', '#3e8948', '#265c42', '#193c3e', '#124e89', '#0099db', '#2ce8f5', '#ffffff', '#c0cbdc', '#8b9bb4', '#5a6988', '#3a4466', '#262b44', '#181425', '#ff0044', '#68386c', '#b55088', '#f6757a', '#e8b796', '#c28569'] },
    { id: 'gameboy', name: 'Game Boy', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
    { id: 'c64', name: 'Commodore 64', colors: ['#000000', '#ffffff', '#68372b', '#70a4b2', '#6f3d86', '#588d43', '#352879', '#b8c76f', '#6f4f25', '#433900', '#9a6759', '#444444', '#6c6c6c', '#9ad284', '#6c5eb5', '#959595'] },
    { id: 'cga', name: 'CGA 16', colors: ['#000000', '#0000aa', '#00aa00', '#00aaaa', '#aa0000', '#aa00aa', '#aa5500', '#aaaaaa', '#555555', '#5555ff', '#55ff55', '#55ffff', '#ff5555', '#ff55ff', '#ffff55', '#ffffff'] },
    { id: 'pastel', name: 'Pastel dream', colors: ['#fbe7ef', '#f7c5d8', '#f19cbb', '#d97aa6', '#fde8c8', '#f9cf93', '#f4b26b', '#e2d5f7', '#c3b1ef', '#9b86d9', '#d4f0e4', '#a8e0c8', '#73c7a6', '#d6ecfb', '#a9d3f5', '#6fb1e8', '#fff8d6', '#ffef9e', '#ffffff', '#4a3f55'] },
    { id: 'skin', name: 'Skin and hair', colors: ['#ffe0c7', '#f5c6a5', '#e8b48f', '#d49a6a', '#c68642', '#a86b3c', '#8d5524', '#6b3e1e', '#4a2a14', '#2e1a0e', '#f2d16b', '#d9a441', '#b5651d', '#7a3b1a', '#3b2416', '#141010'] },
    { id: 'gray', name: 'Grayscale', colors: ['#000000', '#242424', '#494949', '#6d6d6d', '#929292', '#b6b6b6', '#dbdbdb', '#ffffff'] }
  ];

  const pad = (rows, n = 16) => rows.map((r) => r.padEnd(n, '.').slice(0, n)).concat(Array(Math.max(0, n - rows.length)).fill('.'.repeat(n))).slice(0, n);
  const grid = (n, fn) => Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => fn(x, y)).join(''));

  const heart = grid(16, (x, y) => { const u = (x - 7.5) / 6.5, v = -(y - 6.5) / 6.5; const f = (u * u + v * v - 1) ** 3 - u * u * v * v * v; const g = ((x - 7.5) / 5.6) ** 2 + (-(y - 6.2) / 5.6) ** 2; return f <= 0 ? (g < 0.18 && x < 7 && y < 6 ? 'w' : f > -0.02 ? 'd' : 'r') : '.'; });
  const star = grid(16, (x, y) => { const cx = 7.5, cy = 8, a = Math.atan2(y - cy, x - cx) + Math.PI / 2, r = Math.hypot(x - cx, y - cy); const k = Math.cos(Math.PI / 5) / Math.cos(((a % (2 * Math.PI / 5)) + 2 * Math.PI / 5) % (2 * Math.PI / 5) - Math.PI / 5); const R = 4 + 3.4 * Math.max(0, k - 0.81) / 0.19; return r < R - 0.6 ? (r < 2 ? 'w' : 'y') : r < R + 0.2 ? 'o' : '.'; });
  const smiley = grid(16, (x, y) => { const d = Math.hypot(x - 7.5, y - 7.5); if (d > 7) return '.'; if (d > 6.1) return 'k'; if ((x === 5 || x === 10) && (y === 5 || y === 6)) return 'k'; if (y === 10 && x > 4 && x < 11) return 'k'; if (y === 9 && (x === 4 || x === 11)) return 'k'; return d < 3 && x < 7 && y < 6 ? 'w' : 'y'; });
  const coin = [1, 0.66, 0.2, 0.66].map((s, i) => grid(16, (x, y) => { const rx = 6.5 * s + 0.4, d = ((x - 7.5) / rx) ** 2 + ((y - 7.5) / 6.5) ** 2; if (d > 1) return '.'; if (d > 0.72) return 'o'; if (s > 0.5 && Math.abs(x - 7.5) < 1 * s && y > 4 && y < 11) return 'o'; return i === 2 ? 'o' : (x - 7.5) / rx < -0.3 && y < 7 ? 'w' : 'y'; }));
  const ball = [2, 1, 0.5, 1.5, 4, 8, 11, 12].map((h) => { const cy = 13 - h * 0.85 - 2, sq = h < 1 ? 1.25 : 1; return grid(16, (x, y) => { if (y === 15 && x > 3 && x < 12) return 'g'; const d = ((x - 7.5) / (3.2 * sq)) ** 2 + ((y - cy - (sq > 1 ? 0.6 : 0)) / (3.2 / sq)) ** 2; if (d > 1) return '.'; return d < 0.25 && x < 7 && y < cy ? 'w' : d > 0.7 ? 'd' : 'r'; }); });
  const flame = [0, 1, 2, 3].map((f) => grid(16, (x, y) => { const t = (15 - y) / 13, w = 5.2 * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * 0.3), cx = 7.5 + Math.sin(t * 5 + f * 1.6) * 1.4 * t; if (y > 14 || y < 1) return '.'; const d = Math.abs(x - cx) / Math.max(0.3, w); if (d > 1) return '.'; return d < 0.35 && t < 0.55 ? 'w' : d < 0.7 && t < 0.8 ? 'y' : 'o'; }));
  const slime = [[1, 1], [1.12, 0.86], [0.92, 1.1], [1, 1]].map(([sx, sy], i) => { const lift = i === 2 ? 1.5 : 0; return grid(16, (x, y) => { const cy = 11.5 - lift, d = ((x - 7.5) / (6 * sx)) ** 2 + ((y - cy) / (5.5 * sy)) ** 2; if (y > 14 - lift || d > 1) return '.'; if ((x === 5 || x === 10) && Math.abs(y - (cy - 1)) < 1) return 'k'; if (y === Math.round(cy + 1.5) && x > 6 && x < 9) return 'k'; return d > 0.78 ? 'd' : d < 0.2 && x < 7 && y < cy - 1 ? 'w' : 'g'; }); });

  const TEMPLATES = [
    { id: 'heart', name: 'Heart', pal: { r: '#ff004d', d: '#be1250', w: '#ffccaa' }, frames: [heart] },
    { id: 'star', name: 'Star', pal: { y: '#ffec27', o: '#ffa300', w: '#fff1e8' }, frames: [star] },
    { id: 'smiley', name: 'Smiley', pal: { y: '#ffec27', k: '#1d2b53', w: '#fff1e8' }, frames: [smiley] },
    { id: 'mushroom', name: 'Mushroom', pal: { k: '#291814', r: '#ff004d', w: '#fff1e8', s: '#ffccaa', e: '#1d2b53' }, frames: [pad([
      '......kkkk', '....kkrrrrkk', '...krrwwrrrrk', '..krrwwwwrrwwk', '..krrwwwwrrwwk', '.krrrrwwrrrrrrk', '.krwwrrrrrrwwrk', '.kwwwwrrrrwwwwk', '.kwwwwrrrrwwwwk', '..kkkkkkkkkkkk', '....kssssssk', '....ksesseesk', '....ksesseesk', '....kssssssk', '.....kkkkkk'
    ].map((r) => '.' + r))] },
    { id: 'sword', name: 'Sword', pal: { k: '#1d2b53', w: '#fff1e8', s: '#c2c3c7', g: '#ffa300', b: '#ab5236' }, frames: [pad([
      '.............kk', '............kwsk', '...........kwsk', '..........kwsk', '.........kwsk', '........kwsk', '.......kwsk', '..kk..kwsk', '..kgkkwsk', '...kgksk', '...kkgk', '..kbkkgk', '.kbk..kgk', 'kbk....kk', 'kk'
    ])] },
    { id: 'potion', name: 'Potion', pal: { k: '#1d2b53', w: '#fff1e8', g: '#c2c3c7', p: '#ff77a8', m: '#7e2553', c: '#ab5236' }, frames: [pad([
      '......kkkk', '......kcck', '......kcck', '.....kkkkkk', '......kggk', '......kggk', '....kkggggkk', '...kggwgggggk', '..kgwpppppppgk', '..kgpppppppmgk', '..kgwppppppmgk', '..kgpppppppmgk', '..kgppppppmmgk', '...kgmmmmmmgk', '....kkkkkkkk'
    ])] },
    { id: 'ghost', name: 'Ghost', pal: { k: '#1d2b53', w: '#fff1e8', g: '#c2c3c7', b: '#29adff' }, frames: [pad([
      '.....kkkkkk', '...kkwwwwwwkk', '..kwwwwwwwwwwk', '.kwwwwwwwwwwwwk', '.kwwkkwwwwkkwwk', '.kwwkbwwwwkbwwk', '.kwwkkwwwwkkwwk', '.kwwwwwwwwwwwwk', '.kwwwwwkkwwwwwk', '.kwwwwwwwwwwwwk', '.kgwwwwwwwwwwgk', '.kggwwwwwwwwggk', '.kgggwwggwwgggk', '.kgkgggkkgggkgk', '.kk.kkk..kkk.kk'
    ])] },
    { id: 'cat', name: 'Cat', pal: { k: '#291814', o: '#ffa300', d: '#ab5236', w: '#fff1e8', p: '#ff77a8', g: '#00e436' }, frames: [pad([
      '', '..kk........kk', '..kok......kok', '..kook....kook', '..koookkkkoooo k', '.kooooooooooook', '.koodooooooodok', '.kooggooooggook', '.koogkooookgook', '.kooooopppooook', 'kwwoooookooooowwk', '.kooowwwwwwoook', '..kkoooooooookk', '....kkkkkkkk'
    ])] },
    { id: 'house', name: 'House', pal: { k: '#1d2b53', r: '#be1250', b: '#ab5236', w: '#fff1e8', y: '#ffec27', d: '#742f29', g: '#00b543' }, frames: [pad([
      '..........kk', '.......kk.kdk', '.....kkrrkkdk', '....krrrrrrkk', '...krrrrrrrrk', '..krrrrrrrrrrk', '.krrrrrrrrrrrrk', 'kkkkkkkkkkkkkkkk', '.kbbbbbbbbbbbbk', '.kbkkkbbbbkkkbk', '.kbkykbbbbkykbk', '.kbkkkbkkbkkkbk', '.kbbbbbkdkbbbbk', '.kbbbbbkdkbbbbk', 'gggggggkdkgggggg', 'gggggggggggggggg'
    ])] },
    { id: 'tree', name: 'Pine tree', pal: { k: '#125359', g: '#00b543', l: '#00e436', b: '#742f29', w: '#fff1e8' }, frames: [pad([
      '.......kk', '......kllk', '.....kglggk', '....kggglggk', '.....kgggk', '....kglgggk', '...kggglgggk', '..kgggggglggk', '....kggggggk', '...kgglggglgk', '..kggggggglggk', '.kgglgggggggglk', '.kkkkkkkkkkkkkk', '......kbbk', '......kbbk', '....wwwwwwww'
    ])] },
    { id: 'ship', name: 'Rocket ship', pal: { k: '#1d2b53', w: '#fff1e8', g: '#c2c3c7', r: '#ff004d', b: '#29adff', o: '#ffa300', y: '#ffec27' }, frames: [pad([
      '.......kk', '......kwwk', '.....kwwwgk', '.....kwwwgk', '....kwwbbwgk', '....kwbbbbgk', '....kwwbbwgk', '....kwwwwwgk', '...krwwwwwgrk', '..krrwwwwwgrrk', '..krrwwwwwgrrk', '..kkrkwwwwkrkk', '....kkkkkkkk', '.....koyyok', '......kyyk', '.......kk'
    ])] },
    { id: 'bug', name: 'Space bug', pal: { k: '#008751', g: '#00e436', w: '#fff1e8' }, frames: [pad([
      '', '', '', '...g.....g', '....g...g', '...ggggggg', '..gg.ggg.gg', '.ggggggggggg', '.g.ggggggg.g', '.g.g.....g.g', '....gg.gg'
    ].map((r) => '..' + r)), pad([
      '', '', '', '...g.....g', '.g..g...g..g', '.g.ggggggg.g', '.ggg.ggg.ggg', '.ggggggggggg', '..ggggggggg', '...g.....g', '..g.......g'
    ].map((r) => '..' + r))] },
    { id: 'coin', name: 'Spinning coin', pal: { y: '#ffec27', o: '#ffa300', w: '#fff1e8' }, frames: coin, fps: 8 },
    { id: 'ball', name: 'Bouncy ball', pal: { r: '#ff004d', d: '#be1250', w: '#fff1e8', g: '#5f574f' }, frames: ball, fps: 12 },
    { id: 'flame', name: 'Flame', pal: { o: '#ff6c24', y: '#ffec27', w: '#fff1e8' }, frames: flame, fps: 8 },
    { id: 'slime', name: 'Bouncing slime', pal: { g: '#00e436', d: '#008751', w: '#fff1e8', k: '#1d2b53' }, frames: slime, fps: 6 }
  ];

  const PROMPTS = ['a sleepy cat', 'a tiny castle', 'your favorite snack', 'a robot friend', 'a haunted house', 'a cup of coffee', 'a dragon egg', 'a cactus in a pot', 'a rainy window', 'a space helmet', 'a slice of pizza', 'a treasure chest', 'a magic wand', 'a jellyfish', 'a lighthouse', 'a sneaker', 'an ice cream cone', 'a frog prince', 'a hot air balloon', 'a snowman', 'a key', 'a mushroom house', 'an alien plant', 'a submarine', 'a sushi roll', 'a wizard hat', 'a cozy campfire', 'a penguin', 'a retro TV', 'a potted sunflower', 'a skull with a bow', 'a tiny whale', 'a paper boat', 'a bubble tea', 'a knight', 'a cloud with a face', 'a rubber duck', 'a moon rabbit', 'a lantern', 'a cassette tape', 'a bee', 'a ninja', 'a planet with rings', 'a crystal', 'a birthday cake', 'a snail', 'a lollipop', 'a fox', 'an octopus', 'a candle', 'a dinosaur', 'a guitar', 'a strawberry', 'a ghost pet', 'a teapot', 'a beach umbrella', 'a crown', 'a mailbox', 'a hedgehog', 'a volcano'];

  const ACH = [
    { id: 'first', icon: '🟥', name: 'First pixel', desc: 'Place your very first pixel' },
    { id: 'px1k', icon: '🧱', name: 'Brick by brick', desc: 'Place 1,000 pixels' },
    { id: 'px10k', icon: '🏰', name: 'Pixel mason', desc: 'Place 10,000 pixels' },
    { id: 'tools6', icon: '🧰', name: 'Toolbox', desc: 'Use 6 different tools' },
    { id: 'layers', icon: '🍰', name: 'Layer cake', desc: 'Work with 3 layers' },
    { id: 'anim', icon: '🎞️', name: 'Animator', desc: 'Make an animation with 4 frames' },
    { id: 'png', icon: '🖼️', name: 'Framed', desc: 'Export a PNG' },
    { id: 'gif', icon: '🎬', name: 'GIF maker', desc: 'Export an animated GIF' },
    { id: 'sheet', icon: '🗂️', name: 'Sprite sheet', desc: 'Export a sprite sheet' },
    { id: 'gallery', icon: '🏛️', name: 'Curator', desc: 'Save 5 artworks to your gallery' },
    { id: 'template', icon: '📐', name: 'Remix', desc: 'Open a template' },
    { id: 'daily', icon: '📅', name: 'Daily doodle', desc: 'Save art for the daily prompt' },
    { id: 'mirror', icon: '🦋', name: 'Symmetry', desc: 'Draw with mirror mode' },
    { id: 'palettes', icon: '🎨', name: 'Palette hopper', desc: 'Try 5 palettes' },
    { id: 'big', icon: '🖌️', name: 'Big canvas', desc: 'Fill 600 pixels on a 64 canvas' }
  ];

  window.PIXEL_DATA = { PALETTES, TEMPLATES, PROMPTS, ACH };
})();
