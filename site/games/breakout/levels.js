'use strict';
window.BK_LEVELS = [
  { name: 'Hello, Bricks', rows: ['', '111111111111', '111111111111', '222222222222', '111111111111', '111111111111'] },
  { name: 'Pyramid Scheme', rows: ['.....22.....', '....2112....', '...211112...', '..21111112..', '.21111?1112.', '211111111112'] },
  { name: 'Space Invader', rows: ['..1......1..', '...1....1...', '..22222222..', '.22.2222.22.', '222222222222', '2.22222222.2', '2.2......2.2', '...22..22...'] },
  { name: 'Checkmate-ish', rows: ['2.2.2.2.2.2.', '.2.2.2.2.2.2', '1.1.?.1.1.1.', '.1.1.1.1.?.1', '3.3.3.3.3.3.', '.3.3.3.3.3.3'] },
  { name: 'Bricktron Awakens', boss: 'tron', top: 190, rows: ['', '1.1.1..1.1.1', '.2.2.22.2.2.'] },
  { name: 'Brick Heart', rows: ['.222....222.', '21112..21112', '211112211112', '211111111112', '.2111G11112.', '..21111112..', '...211112...', '....2112....', '.....22.....'] },
  { name: 'The Fortress', rows: ['3S3S3SS3S3S3', '3..........3', '3.22222222.3', '3.2G1111G2.3', '3.22222222.3', '3..........3', 'S1111SS1111S'] },
  { name: 'TNT Factory', rows: ['222222222222', '2X22X22X22X2', '222222222222', '111111111111', '1X11X11X11X1', '111111111111'] },
  { name: 'Have a Nice Day', rows: ['...222222...', '..21111112..', '.2111111112.', '.21S1111S12.', '.2111111112.', '.21X1111X12.', '.211XXXX112.', '..21111112..', '...222222...'] },
  { name: 'The Eye Opens', boss: 'eye', top: 210, rows: ['', 'S..........S', '.3.3.3.3.3.3', '3.3.3.3.3.3.'] },
  { name: 'Liftoff', drift: 40, rows: ['.....33.....', '....3113....', '....1??1....', '....1111....', '....1GG1....', '...211112...', '..22111122..', '..2.1111.2..', '.....XX.....'] },
  { name: 'Now You See Me', rows: ['IIIIIIIIIIII', 'I1I1I1I1I1I1', '222222222222', '1I1I1I1I1I1I', 'IIIIIIIIIIII', '..??....??..'] },
  { name: 'Mushroom Kingdom', rows: ['....3333....', '..33211233..', '.3211111123.', '.311GG11GG13', '321111111123', '333333333333', '...111111...', '...1R11R1...', '...111111...'] },
  { name: 'Zigzag Alley', drift: 30, rows: ['2...2...2...', '.2.2.2.2.2.2', '..2...2...2.', '1...1...1...', '.1.1.1.1.1.1', '..1...1...1.', 'X...X...X...'] },
  { name: 'Brickmother', boss: 'mother', top: 220, rows: ['', '22........22', '.11......11.'] },
  { name: 'The Regenerators', rows: ['RRRRRRRRRRRR', 'R2R2R2R2R2R2', '111111111111', 'SS..SSSS..SS', '111111111111', '..?......?..'] },
  { name: 'Brick Cat', rows: ['.2........2.', '.22......22.', '.2122222212.', '.2111111112.', '.21G1111G12.', '.2111XX1112.', '.2111111112.', '..21111112..', '...222222...'] },
  { name: 'Night City', rows: ['.......3....', '.3.....3..3.', '.3..2..3..3.', '33..2.33.333', '33.22.33.333', '332223333333', 'S1S1S1S1S1S1'] },
  { name: 'Diamond Mine', rows: ['SS...44...SS', '....4334....', '...432234...', '..4321G234..', '...432234...', '....4334....', 'SS...44...SS'] },
  { name: 'Twin Cores', boss: 'twins', top: 220, rows: ['', 'R.R.R..R.R.R', '.1.1.11.1.1.'] },
  { name: 'Rainbow Fuse', rows: ['444444444444', '333333333333', '2222GG222222', '111111111111', '?1111111111?', 'XXXXXXXXXXXX'] },
  { name: 'Grandmaster', drift: 24, rows: ['3.3.3.3.3.3.', '.3.3.3.3.3.3', '2.2.2.2.2.2.', '.2.2.2.2.2.2', '1.1.1.1.1.1.', '.1.1.1.1.1.1', '4.4.4.4.4.4.', '.4.4.4.4.4.4'] },
  { name: 'Ghost Vault', rows: ['SIIIIIIIIIIS', 'SI33333333IS', 'SI3RRRRRR3IS', 'SI3RGGGGR3IS', 'SI3RRRRRR3IS', 'SI33333333IS', 'SIIIIIIIIIIS'] },
  { name: 'Starfield', drift: 36, rows: ['1...1...1...', '..?...G...?.', '.1...1...1..', '4..X...X...4', '..1...1...1.', '.3...3...3..', '3...3...3...'] },
  { name: 'The Monolith', boss: 'mono', top: 230, rows: ['', 'S.X.4..4.X.S', '.2.2.22.2.2.'] }
];
window.BK_BOSSES = {
  tron: { name: 'Bricktron', w: 150, h: 60, hp: 22, color: '#ff8a3d', pts: 3000 },
  eye: { name: 'The Eye', w: 96, h: 96, hp: 30, color: '#c45cff', pts: 4000 },
  mother: { name: 'Brickmother', w: 170, h: 64, hp: 36, color: '#3dff9a', pts: 5000 },
  twins: { name: 'Twin Cores', w: 92, h: 56, hp: 22, color: '#3dd6ff', pts: 6000 },
  mono: { name: 'The Monolith', w: 190, h: 78, hp: 64, color: '#ff3d7f', pts: 10000 }
};
window.BK_POWERS = {
  wide: { color: '#2f9bff', name: 'Wide paddle', good: true, w: 9, t: 15 },
  multi: { color: '#ff4fa3', name: 'Multi-ball', good: true, w: 9 },
  slow: { color: '#18c29c', name: 'Slow-mo', good: true, w: 7, t: 10 },
  life: { color: '#ff3b4f', name: 'Extra life', good: true, w: 2 },
  laser: { color: '#ff6a2b', name: 'Lasers', good: true, w: 7, t: 10 },
  catch: { color: '#b46bff', name: 'Sticky paddle', good: true, w: 6, t: 15 },
  mega: { color: '#ffb800', name: 'Mega ball', good: true, w: 5, t: 12 },
  fire: { color: '#ff2d2d', name: 'Fireball', good: true, w: 5, t: 8 },
  shield: { color: '#3dd6ff', name: 'Shield', good: true, w: 5, t: 25 },
  warp: { color: '#9cff3d', name: 'Warp gate', good: true, w: 1 },
  shrink: { color: '#7a7f8c', name: 'Shrink!', good: false, w: 4, t: 10 },
  fast: { color: '#5c5c70', name: 'Speed up!', good: false, w: 4, t: 10 }
};
window.BK_THEMES = {
  neon: { bg: ['#120c33', '#05040f'], grid: 'rgba(130,100,255,.16)', bricks: ['#ff3d7f', '#ff8a3d', '#ffe14d', '#3dff9a', '#3dd6ff', '#6b7bff', '#c45cff', '#ff5cd6'], paddle: ['#5ef2ff', '#2a7fff'], ball: '#ffffff', glow: 1, text: '#ffffff', sub: '#b9a8ff', steel: '#8b93b8', deco: 'orbs' },
  candy: { bg: ['#fff6fb', '#ffe3ef'], grid: 'rgba(255,110,160,.14)', bricks: ['#ff6b9a', '#ff9f5a', '#ffc93f', '#4fcf86', '#45b8f0', '#8c7dff', '#c77dff', '#ff7dc4'], paddle: ['#ff7aa8', '#e8457a'], ball: '#5b2a86', glow: 0.25, text: '#4a2240', sub: '#c2457a', steel: '#b7aebf', deco: 'sprinkles' },
  synth: { bg: ['#2d0b52', '#ff5e7a'], grid: 'rgba(255,80,200,.55)', bricks: ['#ff2e88', '#ff6c3d', '#ffcc00', '#00f0ff', '#7d5cff', '#ff2e88', '#ffcc00', '#00f0ff'], paddle: ['#ffe066', '#ff6c3d'], ball: '#ffffff', glow: 0.9, text: '#ffffff', sub: '#ffd1f0', steel: '#9a8cc0', deco: 'sun' },
  ocean: { bg: ['#0d4b6e', '#021726'], grid: 'rgba(120,220,255,.1)', bricks: ['#ff7a6b', '#ffb36b', '#ffe08a', '#6bffc8', '#5ed1ff', '#7fa6ff', '#c69cff', '#ff9ccf'], paddle: ['#7fffe0', '#1fb5a8'], ball: '#ffffff', glow: 0.6, text: '#ffffff', sub: '#9fe7ff', steel: '#7f9bb0', deco: 'bubbles' }
};
