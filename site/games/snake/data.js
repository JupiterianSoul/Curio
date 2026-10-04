'use strict';
(function () {
  const N = 20;
  function grid() { return Array.from({ length: N }, () => Array(N).fill('.')); }
  function put(g, x, y, c = '#') { if (x >= 0 && y >= 0 && x < N && y < N) g[y][x] = c; }
  function rect(g, x, y, w, h, c = '#') { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) put(g, i, j, c); }
  function hl(g, x1, x2, y) { for (let x = x1; x <= x2; x++) put(g, x, y); }
  function vl(g, x, y1, y2) { for (let y = y1; y <= y2; y++) put(g, x, y); }
  function build(fn) { const g = grid(); fn(g); return g.map((r) => r.join('')); }

  const MAPS = {
    open: { name: 'Open Field', desc: 'No obstacles, just you and the apples.', rows: build(() => {}) },
    wrap: { name: 'Endless Loop', desc: 'Edges wrap around to the other side.', wrap: true, rows: build(() => {}) },
    pillars: { name: 'Pillars', desc: 'Nine stone pillars to weave between.', rows: build((g) => { for (const y of [3, 9, 15]) for (const x of [3, 9, 15]) rect(g, x, y, 2, 2); }) },
    corners: { name: 'Corners', desc: 'Four L-shaped walls guard the corners.', rows: build((g) => { hl(g, 2, 6, 2); vl(g, 2, 2, 6); hl(g, 13, 17, 2); vl(g, 17, 2, 6); hl(g, 2, 6, 17); vl(g, 2, 13, 17); hl(g, 13, 17, 17); vl(g, 17, 13, 17); }) },
    tunnels: { name: 'Tunnels', desc: 'Two long walls with doorways.', rows: build((g) => { hl(g, 0, 7, 6); hl(g, 12, 19, 6); hl(g, 0, 7, 13); hl(g, 12, 19, 13); }) },
    cross: { name: 'Crossroads', desc: 'A big plus sign with an open heart.', rows: build((g) => { vl(g, 9, 2, 7); vl(g, 10, 2, 7); vl(g, 9, 12, 17); vl(g, 10, 12, 17); hl(g, 2, 6, 9); hl(g, 13, 17, 9); hl(g, 13, 17, 10); hl(g, 2, 6, 11); }) },
    rooms: { name: 'Four Rooms', desc: 'Walls split the field into four rooms.', rows: build((g) => { vl(g, 9, 0, 3); vl(g, 9, 6, 7); vl(g, 9, 12, 13); vl(g, 9, 16, 19); hl(g, 0, 3, 8); hl(g, 6, 13, 8); hl(g, 16, 19, 8); }) },
    spiral: { name: 'Spiral', desc: 'A coiled wall that winds to the middle.', rows: build((g) => { hl(g, 2, 17, 2); vl(g, 17, 2, 17); hl(g, 4, 17, 17); vl(g, 4, 6, 17); hl(g, 4, 13, 6); vl(g, 13, 6, 13); hl(g, 8, 13, 13); }) },
    lanes: { name: 'Lanes', desc: 'Vertical bars with gaps that alternate.', rows: build((g) => { vl(g, 3, 0, 13); vl(g, 12, 0, 13); vl(g, 7, 6, 19); vl(g, 16, 6, 19); }) },
    donut: { name: 'Donut', desc: 'A ring in the middle with four doors.', rows: build((g) => { hl(g, 5, 8, 5); hl(g, 11, 14, 5); hl(g, 5, 8, 14); hl(g, 11, 14, 14); vl(g, 5, 5, 8); vl(g, 5, 11, 14); vl(g, 14, 5, 8); vl(g, 14, 11, 14); }) },
    zigzag: { name: 'Zigzag', desc: 'Staggered walls like a mountain trail.', rows: build((g) => { for (let i = 0; i < 4; i++) { const y = 3 + i * 4; hl(g, i % 2 ? 6 : 0, i % 2 ? 19 : 13, y); } }) },
    portals: { name: 'Portal Park', desc: 'Step into a ring, pop out of its twin.', rows: build((g) => { rect(g, 9, 4, 2, 2); rect(g, 9, 14, 2, 2); put(g, 2, 2, 'a'); put(g, 17, 17, 'a'); put(g, 17, 2, 'b'); put(g, 2, 17, 'b'); }) },
    maze: { name: 'Hedge Maze', desc: 'Short hedges in a maze-like grid.', rows: build((g) => { hl(g, 2, 5, 3); vl(g, 8, 1, 5); hl(g, 12, 17, 3); vl(g, 15, 5, 8); hl(g, 2, 6, 7); vl(g, 3, 13, 17); hl(g, 6, 9, 15); vl(g, 12, 12, 17); hl(g, 14, 18, 14); hl(g, 9, 13, 6); }) },
    arena: { name: 'Arena', desc: 'Wrapping edges around a central block.', wrap: true, rows: build((g) => { rect(g, 8, 4, 4, 4); rect(g, 8, 13, 4, 3); }) },
    diamond: { name: 'Diamond', desc: 'A diamond ring with open tips.', rows: build((g) => { for (let i = 0; i < 6; i++) { if (i === 0) continue; put(g, 9 - i, 3 + i); put(g, 10 + i, 3 + i); put(g, 9 - i, 16 - i); put(g, 10 + i, 16 - i); } }) },
    gates: { name: 'Gates', desc: 'Portals plus walls, a tricky combo.', rows: build((g) => { hl(g, 0, 19, 6); hl(g, 0, 19, 13); put(g, 9, 6, '.'); put(g, 10, 13, '.'); put(g, 1, 3, 'a'); put(g, 18, 16, 'a'); put(g, 18, 3, 'b'); put(g, 1, 16, 'b'); }) },
    comb: { name: 'Comb', desc: 'Teeth hang from the top and rise from below.', rows: build((g) => { for (let x = 2; x < 19; x += 4) vl(g, x, 0, 7); for (let x = 4; x < 19; x += 4) vl(g, x, 12, 19); }) }
  };

  const THEMES = {
    meadow: { name: 'Meadow', a: '#bfe39a', b: '#b2db88', da: '#1f2c1b', db: '#233220', wall: '#6f8f3a', wallTop: '#8db44d', wallDark: '#3e5a22', dwall: '#4c6b2c', dwallTop: '#64883a', edge: '#5b8f3a', dedge: '#3a5a2e', decor: 'flowers', ink: '#1d3b12', dink: '#e8f5d8' },
    desert: { name: 'Desert', a: '#f3dca6', b: '#ecd293', da: '#352b1c', db: '#3b3020', wall: '#c98b4b', wallTop: '#e2a865', wallDark: '#8a5a2b', dwall: '#9a6534', dwallTop: '#b47a43', edge: '#c08a45', dedge: '#6b4c26', decor: 'cactus', ink: '#5a3a12', dink: '#f8e7c6' },
    tundra: { name: 'Tundra', a: '#e6f2fb', b: '#d8eaf7', da: '#1a2531', db: '#1e2a37', wall: '#7fbde6', wallTop: '#b9e2fb', wallDark: '#4b8bb8', dwall: '#3f78a3', dwallTop: '#5c9ccb', edge: '#8cbfe2', dedge: '#33536e', decor: 'snow', ink: '#163a57', dink: '#dff1ff' },
    volcano: { name: 'Volcano', a: '#3b2b27', b: '#42302b', da: '#2a1f1c', db: '#30231f', wall: '#231b19', wallTop: '#3a2d29', wallDark: '#120d0c', dwall: '#1a1311', dwallTop: '#2c211e', edge: '#ff7a2f', dedge: '#c4521d', decor: 'lava', ink: '#ffe2c8', dink: '#ffe2c8', dark: true },
    cosmos: { name: 'Cosmos', a: '#151b38', b: '#18203f', da: '#0f1329', db: '#121731', wall: '#4d5fd6', wallTop: '#7a8cff', wallDark: '#2c3794', dwall: '#4253c2', dwallTop: '#6c7ef0', edge: '#7a8cff', dedge: '#5263d8', decor: 'stars', ink: '#e4e8ff', dink: '#e4e8ff', dark: true }
  };

  const WORLDS = [
    { id: 'meadow', name: 'Green Meadow', theme: 'meadow', blurb: 'Gentle hills and juicy apples.' },
    { id: 'desert', name: 'Dune Desert', theme: 'desert', blurb: 'Hot sand, sandstone walls, faster pace.' },
    { id: 'tundra', name: 'Frost Tundra', theme: 'tundra', blurb: 'Icy corridors and the first portals.' },
    { id: 'volcano', name: 'Ember Volcano', theme: 'volcano', blurb: 'Obsidian mazes over glowing lava.' },
    { id: 'cosmos', name: 'Deep Cosmos', theme: 'cosmos', blurb: 'Zero-g mazes among the stars.' }
  ];

  const L = (map, goal, speed, extra = {}) => ({ map, goal, speed, ...extra });
  const LEVELS = [
    L('open', 8, 7), L('pillars', 10, 7.5), L('corners', 12, 8), L('tunnels', 12, 8.5), L('wrap', 14, 9), L('cross', 15, 9),
    L('open', 14, 9.5, { power: true }), L('lanes', 14, 9.5), L('donut', 15, 10), L('zigzag', 16, 10), L('rooms', 16, 10.5), L('pillars', 18, 11, { power: true }),
    L('portals', 14, 10), L('tunnels', 16, 10.5, { power: true }), L('spiral', 16, 10.5), L('gates', 16, 11), L('arena', 18, 11, { power: true }), L('diamond', 18, 11.5),
    L('maze', 16, 11), L('comb', 16, 11.5), L('rooms', 18, 12, { power: true }), L('lanes', 18, 12), L('spiral', 20, 12.5), L('zigzag', 20, 13, { power: true }),
    L('gates', 18, 12.5), L('portals', 20, 13, { power: true }), L('comb', 20, 13), L('maze', 22, 13.5, { power: true }), L('diamond', 22, 14), L('arena', 25, 14.5, { power: true })
  ].map((l, i) => ({ ...l, n: i + 1, world: Math.floor(i / 6), par: Math.round(l.goal * (5.2 - Math.floor(i / 6) * 0.35)) }));

  const SKINS = [
    { id: 'garden', name: 'Garden', kind: 'solid', c: ['#5cbf45', '#2f6b22'], belly: '#b5ec8f', unlock: null },
    { id: 'lime', name: 'Lime Fizz', kind: 'gradient', c: ['#c6f04a', '#4cbf3a'], belly: '#f3ffc0', unlock: { apples: 50 } },
    { id: 'coral', name: 'Coral', kind: 'spots', c: ['#ff7d6b', '#c24a3c'], spot: '#ffd2c2', belly: '#ffd8ce', unlock: { apples: 120 } },
    { id: 'ocean', name: 'Ocean', kind: 'gradient', c: ['#3ec7e0', '#1f5fbf'], belly: '#c8f4ff', unlock: { level: 6 } },
    { id: 'candy', name: 'Candy Cane', kind: 'stripes', c: ['#ff5d8f', '#ffffff'], outline: '#b2224f', belly: '#ffe3ec', unlock: { apples: 250 } },
    { id: 'tiger', name: 'Tiger', kind: 'stripes', c: ['#ff9a1f', '#2b1a10'], outline: '#7a3c06', belly: '#ffe0b0', stripe: 0.3, unlock: { length: 40 } },
    { id: 'python', name: 'Python', kind: 'diamonds', c: ['#b8a14a', '#5a4a1c'], spot: '#3a2f12', belly: '#efe2a8', unlock: { level: 12 } },
    { id: 'rainbow', name: 'Rainbow', kind: 'rainbow', c: ['#ff4d4d', '#8a3fff'], belly: '#ffffff', unlock: { badges: 8 } },
    { id: 'neon', name: 'Neon', kind: 'neon', c: ['#39ffb4', '#0b3d2c'], belly: '#d6fff0', unlock: { combo: 5 } },
    { id: 'galaxy', name: 'Galaxy', kind: 'galaxy', c: ['#5a3fd6', '#1a1146'], belly: '#c9b9ff', unlock: { level: 30 } },
    { id: 'gold', name: 'Golden', kind: 'metal', c: ['#ffd54a', '#a87400'], belly: '#fff2b8', unlock: { score: 800 } },
    { id: 'zebra', name: 'Zebra', kind: 'stripes', c: ['#f6f6f6', '#222222'], outline: '#111111', belly: '#ffffff', stripe: 0.45, unlock: { daily: 3 } },
    { id: 'ghost', name: 'Phantom', kind: 'ghost', c: ['#d9e4ff', '#8293c9'], belly: '#ffffff', unlock: { ghosts: 10 } },
    { id: 'lava', name: 'Magma', kind: 'lava', c: ['#ff6a1f', '#3a120a'], belly: '#ffd08a', unlock: { level: 24 } },
    { id: 'robot', name: 'Robo', kind: 'segments', c: ['#b8c3cf', '#58636f'], spot: '#4fd1ff', belly: '#eef3f8', unlock: { games: 25 } },
    { id: 'berry', name: 'Berry', kind: 'spots', c: ['#a44bd6', '#5d1f86'], spot: '#f3c4ff', belly: '#f1d7ff', unlock: { time: 90 } }
  ];

  const POWERS = {
    gold: { name: 'Golden Apple', desc: '+50 points and grow by 3.', color: '#ffc93c' },
    slow: { name: 'Snail Shell', desc: 'Time slows down for 6 seconds.', color: '#7fc8ff', dur: 6 },
    ghost: { name: 'Ghost', desc: 'Pass through walls and yourself for 6 seconds.', color: '#c9b8ff', dur: 6 },
    magnet: { name: 'Magnet', desc: 'Pulls apples toward you for 8 seconds.', color: '#ff6b6b', dur: 8 },
    double: { name: 'Double', desc: 'Every point counts twice for 10 seconds.', color: '#ffb142', dur: 10 },
    shield: { name: 'Shield', desc: 'Saves you from one crash.', color: '#4fd1a5' },
    scissors: { name: 'Scissors', desc: 'Snips a third off your tail.', color: '#9aa7b4' },
    clock: { name: 'Clock', desc: 'Blitz only: +6 seconds.', color: '#5ad16b' }
  };

  const BADGES = [
    { id: 'first', name: 'First Bite', desc: 'Eat your first apple.', icon: 'apple' },
    { id: 'len20', name: 'Noodle', desc: 'Reach length 20.', icon: 'ruler' },
    { id: 'len40', name: 'Long Boi', desc: 'Reach length 40.', icon: 'ruler' },
    { id: 'len80', name: 'Anaconda', desc: 'Reach length 80.', icon: 'crown' },
    { id: 'score500', name: 'Half a Grand', desc: 'Score 500 in one game.', icon: 'star' },
    { id: 'score1500', name: 'Apple Tycoon', desc: 'Score 1,500 in one game.', icon: 'star' },
    { id: 'combo5', name: 'Combo Chomper', desc: 'Hit a x5 combo.', icon: 'bolt' },
    { id: 'power5', name: 'Power Hungry', desc: 'Grab 5 power-ups in one game.', icon: 'bolt' },
    { id: 'ghostwalk', name: 'Ghost Walker', desc: 'Slither through yourself as a ghost.', icon: 'ghost' },
    { id: 'portal10', name: 'Portal Hopper', desc: 'Use portals 10 times in one game.', icon: 'portal' },
    { id: 'shield', name: 'Close Call', desc: 'Get saved by a shield.', icon: 'shield' },
    { id: 'w1', name: 'Meadow Master', desc: 'Clear world 1 of the campaign.', icon: 'flag' },
    { id: 'w2', name: 'Dune Drifter', desc: 'Clear world 2.', icon: 'flag' },
    { id: 'w3', name: 'Ice Skater', desc: 'Clear world 3.', icon: 'flag' },
    { id: 'w4', name: 'Fire Walker', desc: 'Clear world 4.', icon: 'flag' },
    { id: 'w5', name: 'Star Serpent', desc: 'Clear the whole campaign.', icon: 'crown' },
    { id: 'stars3', name: 'Perfectionist', desc: 'Earn 3 stars on any level.', icon: 'star' },
    { id: 'allstars', name: 'Constellation', desc: 'Earn 3 stars on all 30 levels.', icon: 'crown' },
    { id: 'daily', name: 'Daily Diner', desc: 'Play a daily challenge.', icon: 'calendar' },
    { id: 'ta300', name: 'Speed Eater', desc: 'Score 300 in Blitz.', icon: 'clock' },
    { id: 'zen60', name: 'Inner Peace', desc: 'Reach length 60 in Zen.', icon: 'leaf' },
    { id: 'apples1000', name: 'Orchard', desc: 'Eat 1,000 apples in total.', icon: 'apple' },
    { id: 'insane', name: 'Lightning Tongue', desc: 'Score 300 on Insane speed.', icon: 'bolt' },
    { id: 'skins5', name: 'Fashionista', desc: 'Unlock 5 skins.', icon: 'palette' }
  ];

  const DEATHS = [
    'Snakes are not supposed to taste themselves.',
    'That wall came out of nowhere.',
    'A noble, noodly effort.',
    'The apples will remember you.',
    'Long snake, short life.',
    'Somewhere, an apple is laughing.',
    'You zigged when you should have zagged.',
    'Even pythons have off days.',
    'Hiss-terical crash.',
    'The scales of fate were not kind.',
    'Ssssso close.',
    'Your tail sends its regards.'
  ];

  window.SNAKE_DATA = { N, MAPS, THEMES, WORLDS, LEVELS, SKINS, POWERS, BADGES, DEATHS };
})();
