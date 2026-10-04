'use strict';
window.BLOCKS_DATA = {
  COLORS: { I: '#2fc6e8', O: '#f7c831', T: '#a55ee6', S: '#4cc65c', Z: '#ef4f53', J: '#3c78e8', L: '#f78a2c', G: '#8c8798' },
  PASTEL: { I: '#8fe3f3', O: '#ffe58f', T: '#d1a8f5', S: '#a8e8ae', Z: '#f8a6a8', J: '#a5c2f6', L: '#fcc495', G: '#c8c4cf' },
  MODES: {
    marathon: { name: 'Marathon', blurb: 'Clear 150 lines as the speed climbs through 15 levels.', short: '150 lines', icon: 'marathon' },
    sprint: { name: 'Sprint', blurb: 'Clear 40 lines as fast as you can. Every frame counts.', short: '40 lines', icon: 'sprint' },
    ultra: { name: 'Ultra', blurb: 'Two minutes. Score as much as you can. T-spins pay big.', short: '2 minutes', icon: 'ultra' },
    dig: { name: 'Dig', blurb: 'Ten rows of garbage with holes. Dig to the bottom fast.', short: 'Garbage', icon: 'dig' },
    daily: { name: 'Daily', blurb: 'Today\'s Ultra with the same piece order for everyone.', short: 'Seeded', icon: 'daily' },
    zen: { name: 'Zen', blurb: 'Gentle speed and no game over. Topping out just clears the board.', short: 'Endless', icon: 'zen' }
  },
  SKINS: [
    { id: 'gem', name: 'Gem', unlock: null },
    { id: 'flat', name: 'Flat', unlock: null },
    { id: 'retro', name: 'Retro', unlock: { lines: 40 } },
    { id: 'jelly', name: 'Jelly', unlock: { lines: 100 } },
    { id: 'neon', name: 'Neon', unlock: { tetrises: 5 } },
    { id: 'glass', name: 'Glass', unlock: { tspins: 3 } },
    { id: 'stone', name: 'Stone', unlock: { lines: 300 } },
    { id: 'pastel', name: 'Pastel', unlock: { games: 15 } },
    { id: 'pixel', name: 'Pixel', unlock: { sprint: 1 } },
    { id: 'gold', name: 'Gold Bars', unlock: { badges: 10 } }
  ],
  THEMES: [
    ['#2a1f4f', '#6a3fa8'], ['#0f3057', '#00587a'], ['#1b4332', '#2d6a4f'], ['#5c2a2a', '#a33f3f'],
    ['#3d2c5c', '#c0587e'], ['#1d3557', '#457b9d'], ['#3a2a14', '#a8641e'], ['#102a43', '#2f6f8f'],
    ['#2b2d42', '#6d597a'], ['#3b0d3d', '#7b2d7f'], ['#0b3d2e', '#1e8a6b'], ['#40160f', '#c2410c'],
    ['#14213d', '#3a4f9b'], ['#2d1b3d', '#8e3d8f'], ['#111827', '#4b5563']
  ],
  BADGES: [
    { id: 'firstline', name: 'First Line', desc: 'Clear your first line.', icon: 'line' },
    { id: 'tetris', name: 'Four by Four', desc: 'Clear four lines at once.', icon: 'four' },
    { id: 'tspin', name: 'Spin Doctor', desc: 'Land a T-spin that clears lines.', icon: 'spin' },
    { id: 'tsd', name: 'Double Trouble', desc: 'Land a T-spin double.', icon: 'spin' },
    { id: 'tst', name: 'Triple Threat', desc: 'Land a T-spin triple.', icon: 'crown' },
    { id: 'b2b', name: 'Back to Back', desc: 'Chain two difficult clears.', icon: 'chain' },
    { id: 'combo4', name: 'Combo Breaker', desc: 'Reach a 4-combo.', icon: 'bolt' },
    { id: 'combo8', name: 'Combo King', desc: 'Reach an 8-combo.', icon: 'crown' },
    { id: 'pc', name: 'Spotless', desc: 'Get a perfect clear.', icon: 'sparkle' },
    { id: 'lvl10', name: 'Double Digits', desc: 'Reach level 10 in Marathon.', icon: 'up' },
    { id: 'marathon', name: 'Marathoner', desc: 'Finish all 150 Marathon lines.', icon: 'medal' },
    { id: 'sprint', name: 'Sprinter', desc: 'Finish a 40-line Sprint.', icon: 'clock' },
    { id: 'sprint90', name: 'Lightning', desc: 'Sprint in under 90 seconds.', icon: 'bolt' },
    { id: 'ultra30k', name: 'Ultra Scorer', desc: 'Score 30,000 in Ultra.', icon: 'star' },
    { id: 'dig', name: 'Excavator', desc: 'Dig through all the garbage.', icon: 'shovel' },
    { id: 'dig60', name: 'Mole', desc: 'Finish Dig in under 60 seconds.', icon: 'shovel' },
    { id: 'daily', name: 'Daily Grind', desc: 'Play a daily challenge.', icon: 'cal' },
    { id: 'zen100', name: 'Still Water', desc: 'Clear 100 lines in one Zen session.', icon: 'leaf' },
    { id: 'pps2', name: 'Quick Hands', desc: 'Average 2 pieces per second over 100 pieces.', icon: 'bolt' },
    { id: 'lines1000', name: 'Line Factory', desc: 'Clear 1,000 lines in total.', icon: 'line' },
    { id: 'hold0', name: 'No Take-backs', desc: 'Finish a Sprint without using hold.', icon: 'star' },
    { id: 'skins5', name: 'Collector', desc: 'Unlock 5 block skins.', icon: 'sparkle' }
  ],
  QUIPS: [
    'The blocks win this round.',
    'Gravity is undefeated.',
    'Stack happens.',
    'That I piece was coming, honest.',
    'Your well needed a little more well.',
    'Ten columns, infinite regrets.',
    'Beautiful stacking, tragic ending.',
    'The ceiling was closer than it looked.',
    'Somewhere an S piece is very proud of itself.',
    'Nice try, block wrangler.'
  ],
  MUSIC: [
    ['E5', 2], ['B4', 1], ['C5', 1], ['D5', 2], ['C5', 1], ['B4', 1], ['A4', 2], ['A4', 1], ['C5', 1], ['E5', 2], ['D5', 1], ['C5', 1],
    ['B4', 3], ['C5', 1], ['D5', 2], ['E5', 2], ['C5', 2], ['A4', 2], ['A4', 2], [null, 2],
    [null, 1], ['D5', 2], ['F5', 1], ['A5', 2], ['G5', 1], ['F5', 1], ['E5', 3], ['C5', 1], ['E5', 2], ['D5', 1], ['C5', 1],
    ['B4', 2], ['B4', 1], ['C5', 1], ['D5', 2], ['E5', 2], ['C5', 2], ['A4', 2], ['A4', 2], [null, 2]
  ],
  BASS: ['E2', 'E3', 'E2', 'E3', 'A2', 'A3', 'A2', 'A3', 'G#2', 'G#3', 'G#2', 'G#3', 'A2', 'A3', 'B2', 'C3', 'D2', 'D3', 'D2', 'D3', 'C2', 'C3', 'C2', 'C3', 'B1', 'B2', 'B1', 'B2', 'E2', 'E3', 'E2', 'E3']
};
