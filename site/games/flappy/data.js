'use strict';
window.FLAPPY_DATA = {
  CHARS: [
    { id: 'chick', name: 'Chick', price: 0, desc: 'The original fluffball.' },
    { id: 'robin', name: 'Robin', price: 60, desc: 'Red-breasted and ready.' },
    { id: 'penguin', name: 'Penguin', price: 120, desc: 'Flightless? Not today.' },
    { id: 'bee', name: 'Bumblebee', price: 180, desc: 'Buzzes between the pipes.' },
    { id: 'bat', name: 'Bat', price: 250, desc: 'Born for night levels.' },
    { id: 'owl', name: 'Owl', price: 320, desc: 'Wise, round, slightly judgy.' },
    { id: 'ghost', name: 'Ghost', price: 400, desc: 'Boo. Still hits pipes though.' },
    { id: 'dragon', name: 'Dragon', price: 520, desc: 'Tiny wings, big attitude.' },
    { id: 'robot', name: 'Robot', price: 650, desc: 'Propeller-powered tin can.' },
    { id: 'ufo', name: 'UFO', price: 800, desc: 'Take me to your high score.' },
    { id: 'parrot', name: 'Parrot', price: 950, desc: 'Every colour at once.' },
    { id: 'phoenix', name: 'Phoenix', price: 1200, desc: 'Rises from every crash.' }
  ],
  WORLDS: [
    { id: 'meadow', name: 'Meadow', price: 0, pipe: 'pipe', far: 'hills', near: 'trees', ground: 'grass',
      day: { top: '#7fd3ff', bot: '#d9f4ff', far: '#9ed9a0', near: '#5fb563', ground: '#e3c98f', grass: '#6cc24a', pipe: '#5cc45a', pipeDark: '#2f8f3a', cloud: '#ffffff' },
      night: { top: '#0b1636', bot: '#2a3e74', far: '#24415a', near: '#183a2e', ground: '#5a4c33', grass: '#2c5a2a', pipe: '#2f7d3b', pipeDark: '#16471f', cloud: '#5f6f9a' } },
    { id: 'sunset', name: 'Sunset Bay', price: 150, pipe: 'post', far: 'sea', near: 'palms', ground: 'sand',
      day: { top: '#ff9a6b', bot: '#ffe0a3', far: '#f78f8f', near: '#3e6b5a', ground: '#f2d39b', grass: '#e7b86a', pipe: '#b5794a', pipeDark: '#7a4a25', cloud: '#ffd2c2' },
      night: { top: '#1b1340', bot: '#5c3a72', far: '#2c2a5a', near: '#1a2e2a', ground: '#6a5a44', grass: '#5a4a32', pipe: '#6b4a2f', pipeDark: '#3a2616', cloud: '#7a5f8f' } },
    { id: 'city', name: 'Neon City', price: 300, pipe: 'tower', far: 'skyline', near: 'buildings', ground: 'road',
      day: { top: '#9fc4ff', bot: '#e8f0ff', far: '#a9b6cc', near: '#7f8aa3', ground: '#6b6f7a', grass: '#8c909c', pipe: '#6c7bd8', pipeDark: '#3a46a0', cloud: '#ffffff' },
      night: { top: '#07051a', bot: '#2a1446', far: '#1b1638', near: '#120f2a', ground: '#1c1a2a', grass: '#ff3fb4', pipe: '#2b2160', pipeDark: '#120c35', cloud: '#3a2f6a' } },
    { id: 'snow', name: 'Snowy Peaks', price: 450, pipe: 'ice', far: 'peaks', near: 'pines', ground: 'snow',
      day: { top: '#9fd6ff', bot: '#f2fbff', far: '#c9dff2', near: '#4f8a6e', ground: '#f4f8fb', grass: '#ffffff', pipe: '#a9dcf5', pipeDark: '#5ea7cf', cloud: '#ffffff' },
      night: { top: '#0a1a33', bot: '#2c4a6e', far: '#3a5574', near: '#1d3a33', ground: '#b8c8d8', grass: '#d8e6f2', pipe: '#5b8fb3', pipeDark: '#2c5a7a', cloud: '#6a7f9a' } },
    { id: 'desert', name: 'Dune Desert', price: 600, pipe: 'column', far: 'dunes', near: 'cacti', ground: 'sand',
      day: { top: '#ffc46b', bot: '#fff1c9', far: '#f2b866', near: '#d9954a', ground: '#f0cf8a', grass: '#e2b265', pipe: '#e3b26e', pipeDark: '#a8723a', cloud: '#fff6e0' },
      night: { top: '#120c2a', bot: '#3d2d5a', far: '#5a4060', near: '#3e2c44', ground: '#7a6448', grass: '#6a5438', pipe: '#8a6a44', pipeDark: '#4a3420', cloud: '#5a4a6a' } },
    { id: 'ocean', name: 'Deep Reef', price: 800, pipe: 'coral', far: 'reef', near: 'kelp', ground: 'seabed', gravity: 0.8, flap: 0.88,
      day: { top: '#1fa2d6', bot: '#8fe3f2', far: '#2b8fb0', near: '#2e9e7e', ground: '#e9d7a5', grass: '#d9c08a', pipe: '#ff7f7f', pipeDark: '#c4475a', cloud: '#c8f2ff' },
      night: { top: '#021029', bot: '#0b3b5c', far: '#0c3550', near: '#0e3e3a', ground: '#5a5038', grass: '#4a4230', pipe: '#a8456a', pipeDark: '#5a1f3a', cloud: '#2a6a8a' } },
    { id: 'candy', name: 'Candy Land', price: 1000, pipe: 'cane', far: 'cream', near: 'lollies', ground: 'cake',
      day: { top: '#ffc8e6', bot: '#fff0f8', far: '#ffd9a8', near: '#ff8fc1', ground: '#f7c59f', grass: '#ff7eb6', pipe: '#ffffff', pipeDark: '#ff4f8f', cloud: '#ffffff' },
      night: { top: '#2a0f3a', bot: '#6a2c6a', far: '#5a3a5a', near: '#7a2a5a', ground: '#6a4a3a', grass: '#a83a7a', pipe: '#e6d6e6', pipeDark: '#a8306a', cloud: '#7a4a8a' } },
    { id: 'space', name: 'Outer Space', price: 1300, pipe: 'pylon', far: 'planets', near: 'asteroids', ground: 'moon', gravity: 0.72, flap: 0.82,
      day: { top: '#141a4a', bot: '#3b2a7a', far: '#6a4fd6', near: '#4a3a8a', ground: '#9a98a8', grass: '#c8c6d6', pipe: '#8a96b8', pipeDark: '#4a5478', cloud: '#7a6ad6' },
      night: { top: '#03030f', bot: '#120c30', far: '#3a2a8a', near: '#2a2050', ground: '#5a586a', grass: '#8a889a', pipe: '#5a6688', pipeDark: '#2a3450', cloud: '#3a2a7a' } }
  ],
  TRAILS: [
    { id: 'none', name: 'None', price: 0 },
    { id: 'puffs', name: 'Puffs', price: 80 },
    { id: 'sparkle', name: 'Sparkles', price: 200 },
    { id: 'hearts', name: 'Hearts', price: 350 },
    { id: 'rainbow', name: 'Rainbow', price: 600 },
    { id: 'bubbles', name: 'Bubbles', price: 400 },
    { id: 'fire', name: 'Fire', price: 900 }
  ],
  MODES: {
    classic: { name: 'Classic', blurb: 'Endless pipes, steady speed. How far can you go?' },
    hard: { name: 'Hard', blurb: 'Narrower gaps, faster scroll, and pipes that slide up and down.' },
    daily: { name: 'Daily', blurb: 'Today\'s pipe layout is the same for everyone. Bring your best flap.' },
    rush: { name: 'Coin Rush', blurb: '45 seconds, wide gaps, coins everywhere. Grab as many as you can.' }
  },
  POWERS: {
    shield: { name: 'Bubble', desc: 'Survive one crash.', color: '#6fd6ff' },
    magnet: { name: 'Magnet', desc: 'Pulls coins in for 8 seconds.', color: '#ff6b6b' },
    slow: { name: 'Slow-mo', desc: 'Everything slows for 5 seconds.', color: '#b9a4ff' },
    tiny: { name: 'Shrink', desc: 'Half size for 7 seconds.', color: '#7bea8b' }
  },
  MEDALS: [
    { at: 150, id: 'diamond', name: 'Diamond', c: ['#bff4ff', '#5fc7e6'] },
    { at: 80, id: 'platinum', name: 'Platinum', c: ['#eef2f7', '#9aa7b8'] },
    { at: 40, id: 'gold', name: 'Gold', c: ['#ffd54a', '#c98a00'] },
    { at: 20, id: 'silver', name: 'Silver', c: ['#e3e8ee', '#8a96a3'] },
    { at: 10, id: 'bronze', name: 'Bronze', c: ['#f0a76b', '#a4592a'] }
  ],
  BADGES: [
    { id: 'first', name: 'Liftoff', desc: 'Pass your first pipe.', icon: 'wing' },
    { id: 'bronze', name: 'Bronze Wings', desc: 'Score 10 in one flight.', icon: 'medal' },
    { id: 'silver', name: 'Silver Wings', desc: 'Score 20.', icon: 'medal' },
    { id: 'gold', name: 'Gold Wings', desc: 'Score 40.', icon: 'medal' },
    { id: 'platinum', name: 'Platinum Wings', desc: 'Score 80.', icon: 'crown' },
    { id: 'diamond', name: 'Diamond Wings', desc: 'Score 150.', icon: 'crown' },
    { id: 'hard20', name: 'Hardcore', desc: 'Score 20 in Hard mode.', icon: 'bolt' },
    { id: 'daily', name: 'Daily Flapper', desc: 'Play a daily challenge.', icon: 'cal' },
    { id: 'rush50', name: 'Gold Digger', desc: 'Grab 50 coins in one Coin Rush.', icon: 'coin' },
    { id: 'coins500', name: 'Piggy Bank', desc: 'Collect 500 coins in total.', icon: 'coin' },
    { id: 'shield', name: 'Saved by the Bubble', desc: 'Survive a crash with a bubble.', icon: 'shield' },
    { id: 'night', name: 'Night Owl', desc: 'Fly through a full night.', icon: 'moon' },
    { id: 'chars3', name: 'Flock', desc: 'Own 3 characters.', icon: 'wing' },
    { id: 'worlds3', name: 'Globetrotter', desc: 'Unlock 3 worlds.', icon: 'globe' },
    { id: 'flaps1000', name: 'Wing Day', desc: 'Flap 1,000 times in total.', icon: 'wing' },
    { id: 'close', name: 'Close Shave', desc: 'Squeeze through 5 pipes in a row within a hair.', icon: 'bolt' },
    { id: 'space', name: 'Astronaut', desc: 'Score 20 in Outer Space.', icon: 'globe' },
    { id: 'phoenix', name: 'Reborn', desc: 'Buy the Phoenix.', icon: 'crown' }
  ],
  QUIPS: [
    'Gravity: 1, you: 0.',
    'That pipe came out of nowhere.',
    'Flap harder. Or softer. Possibly both.',
    'Pipes do not care about your feelings.',
    'A majestic, brief flight.',
    'The ground is undefeated.',
    'Wings are a suggestion, apparently.',
    'So close you could smell the pipe.',
    'Every legend starts with a faceplant.',
    'Feathers everywhere.'
  ]
};
