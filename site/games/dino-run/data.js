'use strict';
window.DR_DATA = {
  biomes: [
    { id: 'desert', name: 'Dusty Desert', sky: ['#ffd9a0', '#fff3dc'], far: '#e9b27a', mid: '#d99a5e', ground: '#e8c48a', top: '#c99a5a', dot: '#b88445', obs: '#3f9a4b', obs2: '#2c7a37', sun: '#fff1a8', deco: 'sun', kinds: ['cactusS', 'cactusT', 'cactusS', 'tumble', 'cactusT'] },
    { id: 'jungle', name: 'Steamy Jungle', sky: ['#9fe3c4', '#e6fff0'], far: '#5fae7a', mid: '#3f8f5c', ground: '#7a5a3a', top: '#4c9a3a', dot: '#5e4228', obs: '#8a5a32', obs2: '#5e3a1e', sun: '#fffbe0', deco: 'leaves', kinds: ['log', 'vine', 'bush', 'log', 'vine'] },
    { id: 'tundra', name: 'Frozen Tundra', sky: ['#a8c8ff', '#eaf3ff'], far: '#c7d8f2', mid: '#9fb8de', ground: '#f4f8ff', top: '#cfe0f7', dot: '#b4c8e6', obs: '#7fd0ff', obs2: '#4aa6e0', sun: '#ffffff', deco: 'snow', kinds: ['spike', 'snowball', 'spike', 'iceS', 'snowball'] },
    { id: 'volcano', name: 'Lava Lands', sky: ['#4a1a1a', '#b5432a'], far: '#2a1010', mid: '#3d1a14', ground: '#3a2622', top: '#1f1412', dot: '#ff6a2b', obs: '#5a4a46', obs2: '#3a2c29', sun: '#ff9a3d', deco: 'embers', kinds: ['pit', 'boulder', 'meteor', 'pit', 'boulder'] },
    { id: 'night', name: 'Moonlit Plains', sky: ['#0d1033', '#2a2f6b'], far: '#1a1f4a', mid: '#232a5c', ground: '#2f365e', top: '#3f4a82', dot: '#55609c', obs: '#5fd28a', obs2: '#3aa866', sun: '#f4f1d8', deco: 'stars', kinds: ['cactusS', 'bat', 'cactusT', 'bat', 'cactusS'] }
  ],
  chars: {
    rex: { name: 'Rex', color: '#4caf50', cost: 0, perk: 'The original. No tricks, all heart.' },
    ruby: { name: 'Ruby', color: '#ff6fa5', cost: 150, perk: 'Springy legs: jumps a little higher.', acc: 'bow' },
    sunny: { name: 'Sunny', color: '#ffbf2e', cost: 300, perk: 'Cool shades: amber drifts toward her.', acc: 'shades' },
    frost: { name: 'Frost', color: '#6fcfff', cost: 500, perk: 'Lightweight: can always double jump.', acc: 'scarf' },
    ember: { name: 'Ember', color: '#ff5a36', cost: 800, perk: 'Hot headed: starts every run with a shield.', acc: 'flame' },
    shadow: { name: 'Shadow', color: '#8e6bff', cost: 1200, perk: 'Ninja focus: power-ups last 50% longer.', acc: 'band' }
  },
  powers: {
    shield: { name: 'Shield', color: '#5ad1ff', t: 0 },
    magnet: { name: 'Magnet', color: '#ff5a7a', t: 9 },
    wings: { name: 'Double jump', color: '#ffffff', t: 10 },
    slow: { name: 'Slow-mo', color: '#b98cff', t: 5 },
    rocket: { name: 'Rocket', color: '#ff8a1f', t: 3.5 },
    double: { name: 'Amber x2', color: '#ffc21a', t: 10 }
  },
  quips: [
    'That cactus had it coming. So did you.',
    'The meteor is still on schedule.',
    'Evolution is proud of you. Mostly.',
    'Fun fact: real T. rex arms were about a metre long. Still no help with cacti.',
    'Birds are living dinosaurs. The pterodactyl is not a bird, and it is very smug about it.',
    'Velociraptors were roughly turkey sized. The movies lied.',
    'Amber really can preserve ancient insects. Some pieces are 100 million years old.',
    'The word dinosaur means terrible lizard. You were more of a mildly unlucky lizard.',
    'Pterosaurs could have wingspans of over 10 metres. This one is a small one, thankfully.',
    'Some dinosaurs had feathers. Frost would like that noted.'
  ]
};
