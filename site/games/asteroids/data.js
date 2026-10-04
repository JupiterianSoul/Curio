'use strict';
window.AS_DATA = {
  skins: {
    arrow: { name: 'Arrow', color: '#e8f1ff', glow: '#7fb8ff', path: [[16, 0], [-11, -9], [-6, 0], [-11, 9]], need: null },
    falcon: { name: 'Falcon', color: '#5ef2ff', glow: '#2ad0ff', path: [[17, 0], [2, -4], [-4, -12], [-10, -12], [-6, -3], [-10, 0], [-6, 3], [-10, 12], [-4, 12], [2, 4]], need: { text: 'Reach wave 5 to unlock the Falcon.', ach: 'wave5' } },
    viper: { name: 'Viper', color: '#ff5cc8', glow: '#ff2e9a', path: [[18, 0], [-2, -6], [-12, -10], [-8, -2], [-12, 0], [-8, 2], [-12, 10], [-2, 6]], need: { text: 'Defeat the Mothership to unlock the Viper.', ach: 'mother' } },
    moth: { name: 'Moth', color: '#b6ff5c', glow: '#7bff2e', path: [[13, 0], [6, -5], [-2, -14], [-9, -9], [-7, 0], [-9, 9], [-2, 14], [6, 5]], need: { text: 'Collect 500 crystals in total to unlock the Moth.', ach: 'rich' } },
    comet: { name: 'Comet', color: '#ffd84d', glow: '#ffae1a', path: [[16, 0], [8, -6], [-4, -8], [-12, -4], [-8, 0], [-12, 4], [-4, 8], [8, 6]], need: { text: 'Score 50,000 in one run to unlock the Comet.', ach: 'score50k' } },
    phantom: { name: 'Phantom', color: '#c49bff', glow: '#9a5cff', path: [[18, 0], [0, -3], [-6, -14], [-8, -4], [-13, -4], [-10, 0], [-13, 4], [-8, 4], [-6, 14], [0, 3]], need: { text: 'Defeat the Hive Queen to unlock the Phantom.', ach: 'queen' } }
  },
  upgrades: [
    { id: 'rapid', name: 'Rapid fire', desc: 'Shorter cooldown between shots.', costs: [30, 60, 100, 150], icon: '⚡' },
    { id: 'spread', name: 'Spread shot', desc: 'Fire 2, then 3, then 5 bullets at once.', costs: [50, 100, 160], icon: '✳' },
    { id: 'range', name: 'Long barrels', desc: 'Bullets fly faster and further.', costs: [25, 50, 90], icon: '➶' },
    { id: 'engine', name: 'Engines', desc: 'More thrust, top speed and turning.', costs: [25, 50, 90], icon: '🔥' },
    { id: 'shield', name: 'Shield cells', desc: 'Each cell absorbs one hit. Recharges every wave.', costs: [40, 80, 130], icon: '🛡' },
    { id: 'magnet', name: 'Crystal magnet', desc: 'Pull crystals in from further away.', costs: [20, 40, 70], icon: '🧲' },
    { id: 'pierce', name: 'Piercing rounds', desc: 'Bullets punch through extra rocks.', costs: [80, 150], icon: '➹' },
    { id: 'bomb', name: 'Smart bomb', desc: 'One screen-clearing blast. Hold up to 3.', costs: [35], consumable: true, max: 3, icon: '✹' },
    { id: 'hull', name: 'Spare ship', desc: 'One extra life.', costs: [120], consumable: true, max: 9, icon: '▲' }
  ],
  rockTypes: {
    stone: { stroke: '#cdd8ec', fill: 'rgba(120,150,200,.08)', hp: 1, crystals: 1, mult: 1 },
    ice: { stroke: '#8ff0ff', fill: 'rgba(120,230,255,.12)', hp: 1, crystals: 2, mult: 1.2 },
    metal: { stroke: '#ffb366', fill: 'rgba(255,150,80,.1)', hp: 3, crystals: 2, mult: 2 },
    volatile: { stroke: '#ff5c5c', fill: 'rgba(255,80,80,.12)', hp: 1, crystals: 1, mult: 1.5 },
    gold: { stroke: '#ffe066', fill: 'rgba(255,220,90,.14)', hp: 2, crystals: 6, mult: 3 }
  },
  bosses: {
    mother: { name: 'The Mothership', hp: 46, r: 58, pts: 5000, color: '#7dffb0' },
    titan: { name: 'Rock Titan', hp: 70, r: 96, pts: 7000, color: '#ffb366' },
    queen: { name: 'Hive Queen', hp: 80, r: 44, pts: 9000, color: '#ff5cc8' }
  },
  facts: [
    'Real asteroid belts are mostly empty space. The average gap between big rocks is about a million kilometres.',
    'Ceres, the biggest object in the asteroid belt, is a dwarf planet about 940 km across.',
    'The original Asteroids arcade cabinet from 1979 drew its rocks with a vector beam, not pixels.',
    'A smart pilot thrusts in short taps. Space has no brakes.',
    'Metal rocks take three hits. Gold ones are worth the effort.',
    'Red rocks are volatile. Shoot them near other rocks for a free chain reaction.',
    'Hyperspace is free, but it does not choose a nice spot for you.',
    'NASA\'s DART probe nudged the asteroid Dimorphos off course in 2022, shortening its orbit by about 32 minutes.'
  ]
};
