window.LAVA_DATA = {
  THEMES: {
    classic: { name: 'Classic orange', wax: [[255, 110, 20], [255, 150, 40], [255, 88, 30]], liquid: ['#3d0a1a', '#8a1a20', '#d8421c'], glow: [255, 110, 40] },
    blue: { name: 'Deep blue', wax: [[60, 200, 255], [100, 230, 255], [40, 150, 255]], liquid: ['#04112e', '#0b2a6e', '#1a4fb0'], glow: [60, 160, 255] },
    purple: { name: 'Purple haze', wax: [[255, 90, 200], [255, 130, 220], [220, 70, 255]], liquid: ['#16042a', '#3a0f66', '#6a24a8'], glow: [200, 90, 255] },
    green: { name: 'Toxic green', wax: [[180, 255, 60], [120, 255, 120], [210, 255, 90]], liquid: ['#021a18', '#063f3a', '#0c6d5c'], glow: [120, 255, 120] },
    sunset: { name: 'Sunset', wax: [[255, 214, 60], [255, 180, 40], [255, 236, 120]], liquid: ['#3a0626', '#9a1450', '#ff4f6d'], glow: [255, 140, 90] },
    mint: { name: 'Mint', wax: [[200, 255, 230], [160, 250, 210], [230, 255, 245]], liquid: ['#022428', '#0b5560', '#16909a'], glow: [140, 255, 220] },
    bubblegum: { name: 'Bubblegum', wax: [[255, 120, 190], [255, 160, 210], [255, 95, 170]], liquid: ['#0a2440', '#2a6aa8', '#7cc8ff'], glow: [255, 140, 210] },
    lemon: { name: 'Lemon on grape', wax: [[255, 240, 80], [255, 220, 40], [255, 250, 140]], liquid: ['#1a0630', '#45126e', '#7a2fb0'], glow: [240, 220, 120] },
    bloodmoon: { name: 'Blood moon', wax: [[230, 20, 30], [200, 10, 20], [255, 50, 50]], liquid: ['#020203', '#140608', '#2c0a0e'], glow: [255, 40, 40] },
    ocean: { name: 'Ocean foam', wax: [[240, 250, 255], [210, 240, 255], [255, 255, 255]], liquid: ['#010a24', '#062c6a', '#0c5ab4'], glow: [140, 200, 255] },
    candy: { name: 'Cotton candy', wax: [[255, 150, 210], [130, 210, 255], [255, 180, 225]], liquid: ['#1b0b33', '#4a2a7a', '#8a6ad0'], glow: [220, 170, 255] },
    galaxy: { name: 'Galaxy glitter', wax: [[150, 110, 255], [90, 160, 255], [220, 120, 255]], liquid: ['#03020c', '#120a30', '#2a1660'], glow: [140, 120, 255], glitter: [255, 255, 255] },
    gold: { name: 'Gold flake', wax: [[255, 200, 80], [255, 180, 50], [255, 220, 120]], liquid: ['#0c0a06', '#2a2010', '#4a3818'], glow: [255, 190, 90], glitter: [255, 215, 120] },
    rainbow: { name: 'Rainbow', wax: null, liquid: ['#0b0620', '#241a4d', '#3e2a70'], glow: [255, 200, 255] },
    custom: { name: 'Custom', wax: [[255, 120, 60], [255, 150, 80], [255, 100, 50]], liquid: ['#101010', '#303030', '#505050'], glow: [255, 140, 80] }
  },
  SHAPES: {
    classic: { name: 'Rocket', cap: [0.13, 0.05, 0.088], glass: 0.55, base: [0.112, 0.19] },
    tall: { name: 'Tall slim', cap: [0.1, 0.03, 0.058], glass: 0.64, base: [0.075, 0.13] },
    globe: { name: 'Globe', cap: [0.07, 0.045, 0.068], glass: 0.52, base: [0.09, 0.2] },
    grande: { name: 'Grande', cap: [0.12, 0.07, 0.12], glass: 0.5, base: [0.15, 0.24] },
    hourglass: { name: 'Hourglass', cap: [0.1, 0.06, 0.17], glass: 0.58, base: [0.12, 0.19] },
    wavy: { name: 'Wavy bottle', cap: [0.1, 0.04, 0.075], glass: 0.6, base: [0.1, 0.17] },
    cylinder: { name: 'Modern tube', cap: [0.08, 0.1, 0.1], glass: 0.62, base: [0.1, 0.13], square: true }
  },
  FINISHES: {
    chrome: { name: 'Chrome', stops: ['#3a3d44', '#9aa0aa', '#f2f4f7', '#b7bcc5', '#5e636c', '#2c2f35'] },
    gold: { name: 'Gold', stops: ['#5a3e10', '#b8862a', '#ffe9a8', '#d4a645', '#7a5618', '#3d2a08'] },
    copper: { name: 'Copper', stops: ['#4a2010', '#a8582e', '#ffc6a0', '#c87a4e', '#6e3018', '#2e1408'] },
    black: { name: 'Matte black', stops: ['#0c0c0e', '#26272b', '#4a4c52', '#2e2f34', '#18191c', '#0a0a0c'] },
    white: { name: 'Gloss white', stops: ['#9ea3ab', '#e3e6ea', '#ffffff', '#eef0f3', '#c0c5cc', '#8a9098'] },
    rose: { name: 'Rose gold', stops: ['#5a2a2a', '#c27e78', '#ffd8d0', '#d99a90', '#8a4a46', '#3e1c1c'] }
  },
  ROOMS: [
    { id: 'studio', name: 'Studio', icon: '⬜', blurb: 'Just you and the lamp' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️', blurb: 'Moonlight and crickets' },
    { id: 'den', name: '70s den', icon: '🕺', blurb: 'Wood panels and vinyl' },
    { id: 'rain', name: 'Rainy window', icon: '🌧️', blurb: 'Rain on the glass' },
    { id: 'space', name: 'Space station', icon: '🛰️', blurb: 'Earthrise out the window' },
    { id: 'desk', name: 'Late-night desk', icon: '📚', blurb: 'Books, tea and a ticking clock' }
  ],
  PRESETS: [
    { name: 'Classic 1965', blurb: 'The original rocket, orange wax, chrome', room: 'den', lamps: [['classic', 'classic', 'chrome']] },
    { name: 'Midnight study', blurb: 'Deep blue on a desk', room: 'desk', lamps: [['tall', 'blue', 'black']] },
    { name: 'Rainy Sunday', blurb: 'Mint wax and rain', room: 'rain', lamps: [['globe', 'mint', 'white']] },
    { name: 'Space oddity', blurb: 'Glitter galaxy in orbit', room: 'space', lamps: [['cylinder', 'galaxy', 'chrome']] },
    { name: 'Disco den', blurb: 'Three lamps, full groove', room: 'den', lamps: [['classic', 'purple', 'gold'], ['grande', 'sunset', 'copper'], ['tall', 'green', 'gold']] },
    { name: 'Mermaid lagoon', blurb: 'Ocean foam in a wavy bottle', room: 'bedroom', lamps: [['wavy', 'ocean', 'rose']] },
    { name: 'Bubblegum pop', blurb: 'Pink on blue, very sweet', room: 'bedroom', lamps: [['hourglass', 'bubblegum', 'white'], ['globe', 'candy', 'white']] },
    { name: 'Gold rush', blurb: 'Gold flakes on gold', room: 'studio', lamps: [['grande', 'gold', 'gold']] },
    { name: 'Vampire hour', blurb: 'Red wax, black base', room: 'rain', lamps: [['tall', 'bloodmoon', 'black']] },
    { name: 'Citrus twins', blurb: 'Lemon and sunset', room: 'desk', lamps: [['classic', 'lemon', 'copper'], ['classic', 'sunset', 'copper']] },
    { name: 'Rainbow trio', blurb: 'Every color at once', room: 'studio', lamps: [['globe', 'rainbow', 'chrome'], ['classic', 'rainbow', 'chrome'], ['globe', 'rainbow', 'chrome']] },
    { name: 'Zen tube', blurb: 'Minimal and calm', room: 'studio', lamps: [['cylinder', 'mint', 'white']] }
  ],
  BREATHS: [
    { id: 'calm', name: 'Calm 4-6', steps: [['Breathe in', 4], ['Breathe out', 6]] },
    { id: 'box', name: 'Box 4-4-4-4', steps: [['Breathe in', 4], ['Hold', 4], ['Breathe out', 4], ['Hold', 4]] },
    { id: 'sleep', name: 'Sleepy 4-7-8', steps: [['Breathe in', 4], ['Hold', 7], ['Breathe out', 8]] }
  ],
  FACTS: [
    'The lava lamp was invented by British accountant Edward Craven Walker, who launched it in 1963 as the Astro lamp.',
    'Walker got the idea from an egg timer he spotted in a pub: a blob of wax in a bottle of liquid, heated on a stove.',
    'A light bulb in the base is the heater. It warms the wax until it gets less dense than the liquid and floats up.',
    'At the top the wax cools, gets denser again and sinks back down. That loop is called convection.',
    'A cold lava lamp can take an hour or more to start flowing properly.',
    'Shaking a warm lava lamp can turn the liquid cloudy for good, so be gentle.',
    'The wax and the liquid are tuned so their densities are almost identical. A few degrees makes all the difference.',
    'Lava lamps had a huge revival in the 1990s, when millions were sold all over again.'
  ],
  ACH: [
    { id: 'warm', icon: '🔥', name: 'Hands on', desc: 'Warm up a blob by tapping the glass' },
    { id: 'warm100', icon: '♨️', name: 'Heat wave', desc: 'Warm 100 blobs' },
    { id: 'min5', icon: '⏳', name: 'Zoned out', desc: 'Relax for 5 minutes in total' },
    { id: 'min30', icon: '🧘', name: 'Deep chill', desc: 'Relax for 30 minutes in total' },
    { id: 'min120', icon: '🌙', name: 'Lava lifestyle', desc: 'Relax for 2 hours in total' },
    { id: 'themes', icon: '🎨', name: 'Color theory', desc: 'Try 8 different wax colors' },
    { id: 'shapes', icon: '🏺', name: 'Glassblower', desc: 'Try every lamp shape' },
    { id: 'rooms', icon: '🏠', name: 'House tour', desc: 'Visit every room' },
    { id: 'trio', icon: '🕯️', name: 'Collector', desc: 'Light three lamps at once' },
    { id: 'breathe', icon: '🌬️', name: 'Breather', desc: 'Complete 10 guided breaths' },
    { id: 'sound', icon: '🎧', name: 'Soundscaper', desc: 'Turn on the ambient soundscape' },
    { id: 'custom', icon: '🧪', name: 'Mad scientist', desc: 'Mix a custom wax color' },
    { id: 'ambient', icon: '🖥️', name: 'Screensaver', desc: 'Go fullscreen in ambient mode' },
    { id: 'share', icon: '📤', name: 'Show and tell', desc: 'Copy a link to your lamp setup' }
  ]
};
