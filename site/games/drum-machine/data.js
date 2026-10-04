window.DM_DATA = {
  colors: ['#ff4f8b', '#ffa53f', '#ffd23f', '#b6e33f', '#3fe0b0', '#3fb4ff', '#5f8bff', '#8f7bff', '#c77bff', '#ff7bd5', '#ff8a6b', '#9be3ff'],
  kits: [
    { id: '808', name: '808', e: '🔴', accent: '#ff4f8b', art: ['#ff4f8b', '#5a1036'], lp: 20000, v: [
      ['Kick', 'kick', { f0: 150, f1: 46, pd: 0.09, dec: 0.75, click: 0.15 }], ['Snare', 'snare', { tone: 185, td: 0.12, hp: 1400, nd: 0.18, na: 0.7 }],
      ['Closed hat', 'metal', { hp: 7500, dec: 0.05, a: 0.45 }], ['Open hat', 'metal', { hp: 7000, dec: 0.38, a: 0.38 }], ['Clap', 'clap', { bp: 1200, dec: 0.25 }],
      ['Low tom', 'tom', { f0: 160, f1: 80, dec: 0.45 }], ['Hi tom', 'tom', { f0: 260, f1: 140, dec: 0.35 }], ['Rimshot', 'rim', { f: 1700, dec: 0.035 }],
      ['Cowbell', 'cow', { f1: 540, f2: 800, dec: 0.35 }], ['Maracas', 'shaker', { dec: 0.06 }], ['Cymbal', 'metal', { hp: 5000, dec: 1.2, a: 0.25 }], ['Conga', 'conga', { f: 310, dec: 0.2 }]
    ] },
    { id: '909', name: '909', e: '🟠', accent: '#ff8a3f', art: ['#ff8a3f', '#4a2408'], lp: 20000, v: [
      ['Kick', 'kick', { f0: 230, f1: 52, pd: 0.05, dec: 0.42, click: 0.45, drive: 2 }], ['Snare', 'snare', { tone: 220, td: 0.08, hp: 900, nd: 0.22, na: 1 }],
      ['Closed hat', 'hat', { hp: 8500, dec: 0.045, a: 0.5 }], ['Open hat', 'hat', { hp: 8000, dec: 0.32, a: 0.42 }], ['Clap', 'clap', { bp: 1500, dec: 0.3 }],
      ['Low tom', 'tom', { f0: 200, f1: 110, dec: 0.32 }], ['Hi tom', 'tom', { f0: 320, f1: 180, dec: 0.28 }], ['Rim', 'rim', { f: 2100, dec: 0.03 }],
      ['Tambourine', 'tamb', { dec: 0.18 }], ['Shaker', 'shaker', { dec: 0.07 }], ['Ride', 'metal', { hp: 5000, dec: 0.9, a: 0.22 }], ['Crash', 'crash', { dec: 1.4 }]
    ] },
    { id: 'acoustic', name: 'Acoustic', e: '🥁', accent: '#e0a060', art: ['#e0a060', '#4a2c14'], lp: 16000, v: [
      ['Kick', 'kick', { f0: 120, f1: 55, pd: 0.04, dec: 0.32, click: 0.6 }], ['Snare', 'snare', { tone: 200, td: 0.06, hp: 2200, nd: 0.25, na: 1.1, rattle: 1 }],
      ['Hi-hat', 'hat', { hp: 6500, dec: 0.06, a: 0.42 }], ['Open hat', 'hat', { hp: 6000, dec: 0.45, a: 0.35 }], ['Crash', 'crash', { dec: 1.6 }],
      ['Floor tom', 'tom', { f0: 130, f1: 95, dec: 0.5, skin: 1 }], ['Rack tom', 'tom', { f0: 210, f1: 160, dec: 0.4, skin: 1 }], ['Side stick', 'rim', { f: 1300, dec: 0.05 }],
      ['Cowbell', 'cow', { f1: 560, f2: 845, dec: 0.3 }], ['Tambourine', 'tamb', { dec: 0.2 }], ['Ride', 'metal', { hp: 3500, dec: 1.4, a: 0.2 }], ['Ride bell', 'bell', { f: 1250, dec: 0.9 }]
    ] },
    { id: 'lofi', name: 'Lo-fi', e: '☕', accent: '#c9a26b', art: ['#c9a26b', '#3a2a18'], lp: 3200, v: [
      ['Kick', 'kick', { f0: 110, f1: 48, pd: 0.06, dec: 0.45, click: 0.2 }], ['Snare', 'snare', { tone: 170, td: 0.1, hp: 900, nd: 0.2, na: 0.8 }],
      ['Hat', 'hat', { hp: 5000, dec: 0.04, a: 0.35 }], ['Shaker', 'shaker', { dec: 0.09 }], ['Snap', 'snap', {}],
      ['Tom', 'tom', { f0: 140, f1: 100, dec: 0.35 }], ['Hi tom', 'tom', { f0: 210, f1: 150, dec: 0.3 }], ['Rim', 'rim', { f: 900, dec: 0.06 }],
      ['Vinyl pop', 'pop', {}], ['Brush', 'brush', { dec: 0.3, a: 0.02 }], ['Soft crash', 'crash', { dec: 1.2 }], ['Scratch', 'scratch', {}]
    ] },
    { id: 'trap', name: 'Trap', e: '🔥', accent: '#ff3d5a', art: ['#ff3d5a', '#2a0610'], lp: 20000, v: [
      ['808 sub', 'sub', { f0: 120, f1: 45, dec: 1.1 }], ['Snare', 'snare', { tone: 240, td: 0.07, hp: 1800, nd: 0.16, na: 1.1 }],
      ['Hat', 'metal', { hp: 9000, dec: 0.03, a: 0.5 }], ['Open hat', 'metal', { hp: 8000, dec: 0.28, a: 0.36 }], ['Clap', 'clap', { bp: 1600, dec: 0.22 }],
      ['Low tom', 'tom', { f0: 150, f1: 70, dec: 0.4 }], ['Hi tom', 'tom', { f0: 250, f1: 120, dec: 0.3 }], ['Rim', 'rim', { f: 1900, dec: 0.03 }],
      ['Snap', 'snap', {}], ['Shaker', 'shaker', { dec: 0.05 }], ['Crash', 'crash', { dec: 1.3 }], ['Laser', 'zap', { f0: 2400, f1: 200, dec: 0.25, type: 'square' }]
    ] },
    { id: 'house', name: 'House', e: '🪩', accent: '#ffb000', art: ['#ffb000', '#3d2600'], lp: 20000, v: [
      ['Kick', 'kick', { f0: 180, f1: 50, pd: 0.045, dec: 0.38, click: 0.35, drive: 1 }], ['Snare', 'snare', { tone: 210, td: 0.07, hp: 1100, nd: 0.18, na: 0.9 }],
      ['Closed hat', 'hat', { hp: 9000, dec: 0.04, a: 0.45 }], ['Open hat', 'hat', { hp: 8500, dec: 0.26, a: 0.42 }], ['Clap', 'clap', { bp: 1300, dec: 0.32 }],
      ['Tom', 'tom', { f0: 180, f1: 120, dec: 0.3 }], ['Hi tom', 'tom', { f0: 280, f1: 190, dec: 0.25 }], ['Rim', 'rim', { f: 2000, dec: 0.03 }],
      ['Shaker', 'shaker', { dec: 0.06 }], ['Tambourine', 'tamb', { dec: 0.15 }], ['Ride', 'metal', { hp: 5500, dec: 0.8, a: 0.2 }], ['Hey!', 'vox', { f: 230 }]
    ] },
    { id: 'techno', name: 'Techno', e: '🏭', accent: '#8aa0ff', art: ['#8aa0ff', '#141a3d'], lp: 20000, v: [
      ['Kick', 'kick', { f0: 200, f1: 44, pd: 0.06, dec: 0.5, click: 0.3, drive: 5 }], ['Snare', 'snare', { tone: 230, td: 0.06, hp: 1500, nd: 0.15, na: 0.9 }],
      ['Closed hat', 'hat', { hp: 9500, dec: 0.03, a: 0.5 }], ['Open hat', 'hat', { hp: 8500, dec: 0.22, a: 0.4 }], ['Clap', 'clap', { bp: 1800, dec: 0.28 }],
      ['Tom', 'tom', { f0: 170, f1: 90, dec: 0.3 }], ['Hi tom', 'tom', { f0: 260, f1: 150, dec: 0.25 }], ['Rim', 'rim', { f: 2400, dec: 0.025 }],
      ['Clang', 'clang', { f: 420, dec: 0.4 }], ['Shaker', 'shaker', { dec: 0.05 }], ['Ride', 'metal', { hp: 6000, dec: 0.7, a: 0.22 }], ['Sweep', 'sweep', { dec: 0.9, up: 1 }]
    ] },
    { id: 'jungle', name: 'Jungle', e: '🌿', accent: '#3fe07a', art: ['#3fe07a', '#0b3018'], lp: 14000, v: [
      ['Kick', 'kick', { f0: 140, f1: 60, pd: 0.03, dec: 0.25, click: 0.7 }], ['Snare', 'snare', { tone: 260, td: 0.05, hp: 2000, nd: 0.16, na: 1.2, rattle: 1 }],
      ['Hat', 'hat', { hp: 7000, dec: 0.035, a: 0.45 }], ['Open hat', 'hat', { hp: 6500, dec: 0.25, a: 0.35 }], ['Crash', 'crash', { dec: 1.2 }],
      ['Tom', 'tom', { f0: 150, f1: 110, dec: 0.3, skin: 1 }], ['Hi tom', 'tom', { f0: 240, f1: 180, dec: 0.25, skin: 1 }], ['Rim', 'rim', { f: 1500, dec: 0.04 }],
      ['Ride', 'metal', { hp: 4000, dec: 1.1, a: 0.2 }], ['Shaker', 'shaker', { dec: 0.05 }], ['Reverse', 'sweep', { dec: 0.5, up: 1 }], ['Sub', 'sub', { f0: 80, f1: 50, dec: 0.6 }]
    ] },
    { id: 'rock', name: 'Rock', e: '🎸', accent: '#d64545', art: ['#d64545', '#2b0b0b'], lp: 15000, v: [
      ['Kick', 'kick', { f0: 130, f1: 52, pd: 0.035, dec: 0.3, click: 0.8 }], ['Snare', 'snare', { tone: 180, td: 0.08, hp: 1600, nd: 0.3, na: 1.2, rattle: 1 }],
      ['Hi-hat', 'hat', { hp: 6000, dec: 0.07, a: 0.45 }], ['Open hat', 'hat', { hp: 5500, dec: 0.5, a: 0.38 }], ['Crash', 'crash', { dec: 1.8 }],
      ['Floor tom', 'tom', { f0: 110, f1: 80, dec: 0.6, skin: 1 }], ['Rack tom', 'tom', { f0: 190, f1: 140, dec: 0.45, skin: 1 }], ['Stick', 'rim', { f: 1200, dec: 0.05 }],
      ['Cowbell', 'cow', { f1: 560, f2: 845, dec: 0.3 }], ['Tambourine', 'tamb', { dec: 0.22 }], ['Ride', 'metal', { hp: 3500, dec: 1.4, a: 0.22 }], ['China', 'crash', { dec: 0.8, bp: 3000 }]
    ] },
    { id: 'jazz', name: 'Jazz brushes', e: '🎷', accent: '#c7a26b', art: ['#c7a26b', '#2a1d10'], lp: 9000, v: [
      ['Felt kick', 'kick', { f0: 95, f1: 55, pd: 0.05, dec: 0.3, click: 0.1 }], ['Brush tap', 'brush', { dec: 0.22, a: 0.004 }],
      ['Brush swirl', 'brush', { dec: 0.55, a: 0.12 }], ['Hat foot', 'hat', { hp: 5000, dec: 0.05, a: 0.3 }], ['Ride', 'metal', { hp: 4000, dec: 1.6, a: 0.2 }],
      ['Floor tom', 'tom', { f0: 120, f1: 100, dec: 0.5, skin: 1 }], ['Rack tom', 'tom', { f0: 190, f1: 165, dec: 0.4, skin: 1 }], ['Rim click', 'rim', { f: 1100, dec: 0.04 }],
      ['Ride bell', 'bell', { f: 1180, dec: 1 }], ['Snap', 'snap', {}], ['Soft crash', 'crash', { dec: 1.6 }], ['Woodblock', 'clave', { f: 900 }]
    ] },
    { id: 'latin', name: 'Latin', e: '🪇', accent: '#3fe0b0', art: ['#3fe0b0', '#0b3028'], lp: 18000, v: [
      ['Surdo', 'kick', { f0: 95, f1: 60, pd: 0.08, dec: 0.6, click: 0.3 }], ['Conga hi', 'conga', { f: 330, dec: 0.18 }], ['Conga lo', 'conga', { f: 220, dec: 0.25 }],
      ['Shaker', 'shaker', { dec: 0.08 }], ['Clave', 'clave', { f: 2500 }], ['Timbale', 'tom', { f0: 420, f1: 380, dec: 0.25, ring: 1 }],
      ['Bongo', 'conga', { f: 440, dec: 0.12 }], ['Agogo', 'cow', { f1: 880, f2: 1320, dec: 0.3 }], ['Guiro', 'guiro', {}],
      ['Cabasa', 'shaker', { dec: 0.04 }], ['Cowbell', 'cow', { f1: 540, f2: 800, dec: 0.35 }], ['Whistle', 'whistle', { f: 2300 }]
    ] },
    { id: 'chip', name: '8-bit', e: '👾', accent: '#3fb4ff', art: ['#3fb4ff', '#0a2240'], lp: 20000, v: [
      ['Kick', 'chipk', {}], ['Snare', 'chipn', { dec: 0.15, rate: 7000 }], ['Hat', 'chipn', { dec: 0.035, rate: 22000 }], ['Open hat', 'chipn', { dec: 0.2, rate: 22000 }],
      ['Blip', 'blip', { f: 1320 }], ['Tom', 'chipt', { f0: 300, f1: 100 }], ['Hi tom', 'chipt', { f0: 520, f1: 220 }], ['Arp', 'arp', { f: 523 }],
      ['Bass', 'bass', { f: 65 }], ['Coin', 'arp', { f: 988 }], ['Noise crash', 'chipn', { dec: 0.6, rate: 30000 }], ['Laser', 'zap', { f0: 1800, f1: 120, dec: 0.2, type: 'square' }]
    ] },
    { id: 'industrial', name: 'Industrial', e: '⚙️', accent: '#9aa5b1', art: ['#9aa5b1', '#1c2228'], lp: 20000, v: [
      ['Kick', 'kick', { f0: 170, f1: 40, pd: 0.05, dec: 0.45, click: 0.6, drive: 9 }], ['Snare', 'snare', { tone: 200, td: 0.05, hp: 600, nd: 0.25, na: 1.4 }],
      ['Metal hat', 'metal', { hp: 9000, dec: 0.05, a: 0.5 }], ['Steam', 'sweep', { dec: 0.4 }], ['Clang', 'clang', { f: 300, dec: 0.6 }],
      ['Anvil', 'clang', { f: 900, dec: 0.5 }], ['Pipe', 'tom', { f0: 180, f1: 175, dec: 0.6, ring: 1 }], ['Rim', 'rim', { f: 2600, dec: 0.03 }],
      ['Chain', 'shaker', { dec: 0.22 }], ['Hammer', 'kick', { f0: 400, f1: 120, pd: 0.02, dec: 0.1, click: 1 }], ['Crash', 'crash', { dec: 1.2 }], ['Grind', 'scratch', {}]
    ] },
    { id: 'glitch', name: 'Glitch', e: '🧩', accent: '#c77bff', art: ['#c77bff', '#24103a'], lp: 20000, v: [
      ['Kick', 'chipk', {}], ['Snare', 'chipn', { dec: 0.12, rate: 4000 }], ['Glitch A', 'glitch', { n: 4 }], ['Glitch B', 'glitch', { n: 7 }],
      ['Click', 'rim', { f: 4000, dec: 0.012 }], ['Zap', 'zap', { f0: 3000, f1: 80, dec: 0.12 }], ['Bit hat', 'chipn', { dec: 0.02, rate: 30000 }], ['Blip', 'blip', { f: 1760 }],
      ['Stutter', 'arp', { f: 330 }], ['Crunch', 'chipn', { dec: 0.25, rate: 2500 }], ['Pop', 'pop', {}], ['Sweep', 'sweep', { dec: 0.35, up: 1 }]
    ] },
    { id: 'orch', name: 'Orchestral', e: '🎻', accent: '#e8c35c', art: ['#e8c35c', '#3a2c08'], lp: 18000, v: [
      ['Bass drum', 'kick', { f0: 70, f1: 40, pd: 0.1, dec: 1, click: 0.2 }], ['Snare', 'snare', { tone: 190, td: 0.08, hp: 2000, nd: 0.35, na: 1, rattle: 1 }],
      ['Triangle', 'bell', { f: 4200, dec: 1.4 }], ['Cymbal', 'crash', { dec: 2.2 }], ['Orch hit', 'orch', { f: 262, dec: 0.6 }],
      ['Timpani', 'tom', { f0: 110, f1: 98, dec: 1.2, skin: 1 }], ['Timpani hi', 'tom', { f0: 147, f1: 131, dec: 1, skin: 1 }], ['Woodblock', 'clave', { f: 1100 }],
      ['Brass stab', 'orch', { f: 349, dec: 0.4, brass: 1 }], ['Glock', 'bell', { f: 1568, dec: 1.2 }], ['Tam-tam', 'crash', { dec: 3, bp: 600 }], ['Low hit', 'orch', { f: 131, dec: 0.8 }]
    ] },
    { id: 'beatbox', name: 'Beatbox', e: '👄', accent: '#ff7bd5', art: ['#ff7bd5', '#3a0f2e'], lp: 12000, v: [
      ['B (kick)', 'mouth', { k: 'b' }], ['Pf (snare)', 'mouth', { k: 'pf' }], ['T (hat)', 'mouth', { k: 't' }], ['Tss (open)', 'mouth', { k: 'ts' }],
      ['Ch (clap)', 'mouth', { k: 'ch' }], ['Hum', 'mouth', { k: 'hum' }], ['Lip roll', 'mouth', { k: 'brr' }], ['K click', 'mouth', { k: 'k' }],
      ['Pop', 'pop', {}], ['Whistle', 'whistle', { f: 1900 }], ['Uh!', 'vox', { f: 160 }], ['Tongue', 'clave', { f: 1400 }]
    ] },
    { id: 'dub', name: 'Dub', e: '🌴', accent: '#7bd389', art: ['#7bd389', '#13301a'], lp: 9000, v: [
      ['Kick', 'kick', { f0: 120, f1: 50, pd: 0.06, dec: 0.5, click: 0.15 }], ['Rimshot', 'rim', { f: 1500, dec: 0.06 }], ['Hat', 'hat', { hp: 6500, dec: 0.05, a: 0.4 }],
      ['Open hat', 'hat', { hp: 6000, dec: 0.35, a: 0.35 }], ['Snare', 'snare', { tone: 200, td: 0.1, hp: 1500, nd: 0.25, na: 1 }], ['Tom', 'tom', { f0: 150, f1: 100, dec: 0.4, skin: 1 }],
      ['Hi tom', 'tom', { f0: 230, f1: 170, dec: 0.3, skin: 1 }], ['Siren', 'whistle', { f: 700, siren: 1 }], ['Shaker', 'shaker', { dec: 0.07 }],
      ['Clap', 'clap', { bp: 1200, dec: 0.3 }], ['Crash', 'crash', { dec: 1.5 }], ['Bongo', 'conga', { f: 400, dec: 0.12 }]
    ] },
    { id: 'afro', name: 'Afro', e: '🌍', accent: '#ffa53f', art: ['#ffa53f', '#3a1f05'], lp: 16000, v: [
      ['Kick', 'kick', { f0: 130, f1: 55, pd: 0.05, dec: 0.4, click: 0.3 }], ['Snare', 'snare', { tone: 220, td: 0.06, hp: 1600, nd: 0.15, na: 0.8 }], ['Shekere', 'shaker', { dec: 0.1 }],
      ['Open hat', 'hat', { hp: 7000, dec: 0.3, a: 0.35 }], ['Clap', 'clap', { bp: 1400, dec: 0.24 }], ['Talking drum', 'zap', { f0: 160, f1: 240, dec: 0.25 }],
      ['Djembe', 'conga', { f: 200, dec: 0.3 }], ['Djembe slap', 'conga', { f: 380, dec: 0.1 }], ['Bell', 'cow', { f1: 1050, f2: 1400, dec: 0.25 }],
      ['Log drum', 'sub', { f0: 220, f1: 150, dec: 0.3 }], ['Ride', 'metal', { hp: 5000, dec: 0.8, a: 0.2 }], ['Agogo', 'cow', { f1: 740, f2: 1110, dec: 0.3 }]
    ] },
    { id: 'synthwave', name: 'Synthwave', e: '🌆', accent: '#ff5ec4', art: ['#ff5ec4', '#2a0a4a'], lp: 20000, v: [
      ['Kick', 'kick', { f0: 160, f1: 48, pd: 0.06, dec: 0.5, click: 0.3, drive: 1.5 }], ['Snare', 'snare', { tone: 200, td: 0.1, hp: 1200, nd: 0.35, na: 1.1 }],
      ['Hat', 'hat', { hp: 8000, dec: 0.05, a: 0.4 }], ['Open hat', 'hat', { hp: 7500, dec: 0.3, a: 0.35 }], ['Clap', 'clap', { bp: 1300, dec: 0.35 }],
      ['Syn tom low', 'tom', { f0: 300, f1: 80, dec: 0.5 }], ['Syn tom hi', 'tom', { f0: 450, f1: 130, dec: 0.4 }], ['Rim', 'rim', { f: 1800, dec: 0.03 }],
      ['Cowbell', 'cow', { f1: 560, f2: 830, dec: 0.3 }], ['Shaker', 'shaker', { dec: 0.06 }], ['Crash', 'crash', { dec: 1.8 }], ['Zap', 'zap', { f0: 1400, f1: 100, dec: 0.35 }]
    ] },
    { id: 'boombap', name: 'Boom bap', e: '🧢', accent: '#b98b5a', art: ['#b98b5a', '#2a1a0c'], lp: 7000, v: [
      ['Kick', 'kick', { f0: 115, f1: 50, pd: 0.05, dec: 0.5, click: 0.35, drive: 1 }], ['Snare', 'snare', { tone: 160, td: 0.1, hp: 1100, nd: 0.25, na: 1 }],
      ['Hat', 'hat', { hp: 6000, dec: 0.05, a: 0.38 }], ['Open hat', 'hat', { hp: 5500, dec: 0.3, a: 0.32 }], ['Snap', 'snap', {}],
      ['Tom', 'tom', { f0: 140, f1: 100, dec: 0.35 }], ['Hi tom', 'tom', { f0: 210, f1: 150, dec: 0.3 }], ['Rim', 'rim', { f: 1200, dec: 0.05 }],
      ['Vinyl pop', 'pop', {}], ['Scratch', 'scratch', {}], ['Ride', 'metal', { hp: 4500, dec: 0.9, a: 0.18 }], ['Yeah', 'vox', { f: 180 }]
    ] },
    { id: 'dubstep', name: 'Dubstep', e: '💥', accent: '#7cff4f', art: ['#7cff4f', '#0f2e08'], lp: 20000, v: [
      ['Kick', 'kick', { f0: 170, f1: 45, pd: 0.05, dec: 0.45, click: 0.4, drive: 3 }], ['Snare', 'snare', { tone: 210, td: 0.09, hp: 1000, nd: 0.35, na: 1.3, rattle: 1 }],
      ['Hat', 'hat', { hp: 8500, dec: 0.04, a: 0.45 }], ['Open hat', 'hat', { hp: 8000, dec: 0.28, a: 0.38 }], ['Clap', 'clap', { bp: 1500, dec: 0.3 }],
      ['Tom', 'tom', { f0: 180, f1: 90, dec: 0.35 }], ['Hi tom', 'tom', { f0: 280, f1: 140, dec: 0.3 }], ['Rim', 'rim', { f: 2000, dec: 0.03 }],
      ['Sub drop', 'sub', { f0: 130, f1: 30, dec: 1.5 }], ['Laser', 'zap', { f0: 2600, f1: 150, dec: 0.3, type: 'sawtooth' }], ['Crash', 'crash', { dec: 1.6 }], ['Riser', 'sweep', { dec: 1.2, up: 1 }]
    ] }
  ],
  scales: [
    { id: 'minor', n: 'Minor', s: [0, 2, 3, 5, 7, 8, 10] }, { id: 'major', n: 'Major', s: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'pentmin', n: 'Minor pentatonic', s: [0, 3, 5, 7, 10], base: 'minor' }, { id: 'pentmaj', n: 'Major pentatonic', s: [0, 2, 4, 7, 9], base: 'major' },
    { id: 'dorian', n: 'Dorian', s: [0, 2, 3, 5, 7, 9, 10] }, { id: 'phrygian', n: 'Phrygian', s: [0, 1, 3, 5, 7, 8, 10] },
    { id: 'blues', n: 'Blues', s: [0, 3, 5, 6, 7, 10], base: 'minor' }, { id: 'harmmin', n: 'Harmonic minor', s: [0, 2, 3, 5, 7, 8, 11] }
  ],
  synths: [
    { id: 'sub', n: 'Sub' }, { id: 'acid', n: 'Acid' }, { id: 'reese', n: 'Reese' }, { id: 'pluck', n: 'Pluck' }, { id: 'square', n: 'Square' }, { id: 'wobble', n: 'Wobble' }
  ],
  presets: [
    { n: 'Rock', e: '🎸', k: 'acoustic', t: 112, sw: 0, pats: [
      ['x.......x.x.....', '....X.......X...', 'x.x.x.x.x.x.x.x.', '................', 'X...............', '................', '................', '................'],
      ['x.......x.x.....', '....X.......X.oo', 'x.x.x.x.x.x.....', '................', '................', '............xXxX', '................', '................']
    ], chain: [0, 0, 0, 1] },
    { n: 'Boom bap', e: '🧢', k: 'boombap', t: 90, sw: 28, pats: [
      ['X......x..x.....', '....X.......X...', 'x.x.x.x.x.x.x.xo', '..o...o...o...o.', '................', '................', '.......o........', '..............x.']
    ] },
    { n: 'House', e: '🪩', k: 'house', t: 124, sw: 0, b: '0..0..0.3..3..5.', bs: { synth: 'pluck', root: 5, scale: 'minor', oct: 2 }, ch: [0, 5, 3, 4], pats: [
      ['X...X...X...X...', '................', 'x.o.x.o.x.o.x.o.', '..X...X...X...X.', '....X.......X...', '................', '................', '..........x.....']
    ] },
    { n: 'Techno', e: '🏭', k: 'techno', t: 132, sw: 0, b: '..0...0...0...0.', bs: { synth: 'reese', root: 2, scale: 'phrygian', oct: 1 }, pats: [
      ['X...X...X...X...', '................', 'ooXoooXoooXoooXo', '..x...x...x...x.', '....x.......x...', '...........o..o.', 'x..x..x..x..x...', '................'],
      ['X...X...X...X...', '................', 'ooXoooXoooXoooXo', '..x...x...x...x.', '....x.......x...', '..x.....x.x.x.xx', 'x..x..x..x..x...', 'x...x...x...x...']
    ], chain: [0, 0, 0, 1] },
    { n: 'Trap', e: '🔥', k: 'trap', t: 140, sw: 0, pats: [
      ['X.....x...X..x..', '........X.......', '2.x.x.x.3.x.x.2.', '..............o.', '........X.......', '................', '...........x....', '................']
    ] },
    { n: 'Disco', e: '🕺', k: '909', t: 118, sw: 0, b: '0.7.0.7.3.a.3.a.', bs: { synth: 'pluck', root: 9, scale: 'minor', oct: 1 }, pats: [
      ['X...X...X...X...', '....X.......X...', 'x.x.x.x.x.x.x.x.', '..X...X...X...X.', '....x.......x...', '..............xx', '................', 'x...x...x...x...']
    ] },
    { n: 'Bossa nova', e: '🌴', k: 'latin', t: 96, sw: 12, pats: [
      ['x..xx..xx..xx..x', '..o...o...o...o.', '................', 'xoxoxoxoxoxoxoxo', 'x..x..x...x..x..', '................', '................', '................']
    ] },
    { n: 'One drop', e: '🌿', k: 'acoustic', t: 76, sw: 24, pats: [
      ['........X.......', '................', 'x.x.x.x.x.x.x.x.', '..............o.', '................', '................', '........X.......', '................']
    ] },
    { n: 'Funk', e: '🪇', k: 'acoustic', t: 100, sw: 8, pats: [
      ['X.x...x...X..x..', '....X..o.o..X..o', 'xxXxxxXxxxXxxxXx', '..............x.', '................', '................', '................', '................']
    ] },
    { n: 'Breakbeat', e: '🧱', k: 'acoustic', t: 136, sw: 0, pats: [
      ['X.X.......XX....', '....X..o.o..X..o', '................', '................', '................', '................', '................', 'x.x.x.x.x.x.x.x.'],
      ['X.X.......X.....', '.o..X..o.o....X.', '................', '................', 'X...............', '................', '................', 'x.x.x.x.x.x.x.x.']
    ], chain: [0, 0, 0, 1] },
    { n: 'Drum & bass', e: '⚡', k: '909', t: 172, sw: 0, pats: [
      ['X.........X.....', '....X.......X...', 'x.x.x.x.x.x.x.x.', '................', '................', '................', '.......x......x.', '................']
    ] },
    { n: 'Dembow', e: '🌶️', k: '808', t: 96, sw: 0, pats: [
      ['X...X...X...X...', '...x..x....x..x.', 'x.x.x.x.x.x.x.x.', '................', '...o..o....o..o.', '................', '................', '................']
    ] },
    { n: 'Afrobeat', e: '🌍', k: 'acoustic', t: 110, sw: 10, pats: [
      ['x..x..x...x.x...', '....x..x.x..x...', 'x.xxx.xxx.xxx.xx', '................', '................', '..........x...x.', 'x..x..x...x..x..', '................']
    ] },
    { n: 'Samba', e: '🎉', k: 'latin', t: 100, sw: 0, pats: [
      ['o...X...o...X...', 'x.xx.x.xx.xx.x.x', '................', 'xoxoXoxoxoxoXoxo', '................', '................', 'x.x..x.x..x.x...', '................']
    ] },
    { n: 'Salsa', e: '💃', k: 'latin', t: 110, sw: 0, pats: [
      ['...x.......x....', '..x.......x.....', '......xx......xx', '................', 'x..x..x...x.x...', '................', 'x.x.x.x.x.x.x.x.', 'x.xxx.xxx.xxx.xx']
    ] },
    { n: 'Shuffle', e: '🎷', k: 'acoustic', t: 96, sw: 55, pats: [
      ['X.....x.X.....x.', '....X.......X...', '................', '................', '................', '................', '................', 'x.x.x.x.x.x.x.x.']
    ] },
    { n: 'Lo-fi chill', e: '☕', k: 'lofi', t: 78, sw: 35, pats: [
      ['X......x.x......', '....X.......X...', 'x.x.x.x.x.x.x.xo', '................', '................', '................', '..x.......x.....', 'x...............']
    ] },
    { n: 'Electro', e: '🤖', k: '808', t: 125, sw: 0, pats: [
      ['X.....x...X.....', '....X.......X...', 'x.x.x.x.x.x.x.x.', '................', '....X.......X...', '................', '................', '..x..x..x.....x.']
    ] },
    { n: '2-step', e: '🎧', k: '909', t: 132, sw: 40, pats: [
      ['X.........X.....', '....X.......X...', '..x...x...x...x.', '................', '................', '................', '.x..x..x..x..x..', '................']
    ] },
    { n: 'Chiptune', e: '👾', k: 'chip', t: 150, sw: 0, pats: [
      ['X...x...X...x...', '....X.......X...', 'oooooooooooooooo', '................', '..x...x...x.x...', '................', 'x...x...x...x...', 'x..x..x.x..x..x.']
    ] },
    { n: 'Jersey club', e: '🏙️', k: '808', t: 140, sw: 0, pats: [
      ['X...X...X.x.X.x.', '................', 'x.x.x.x.x.x.x.x.', '................', '....X.......X...', '................', '................', '................']
    ] },
    { n: 'Motown', e: '🎙️', k: 'acoustic', t: 104, sw: 0, pats: [
      ['x.x.....x.x.....', 'X...X...X...X...', 'x.x.x.x.x.x.x.x.', '................', 'X...............', '................', '................', '................']
    ] },
    { n: 'Acid house', e: '🧪', k: '909', t: 126, sw: 0, b: '00.7.0.3.0.5.7.3', bs: { synth: 'acid', root: 9, scale: 'minor', oct: 2 }, pats: [
      ['X...X...X...X...', '....X.......X...', 'x.x.x.x.x.x.x.x.', '..X...X...X...X.', '....x.......x...', '', '', '', '', 'o.o.o.o.o.o.o.o.', '', '']
    ] },
    { n: 'Synthwave drive', e: '🌆', k: 'synthwave', t: 100, sw: 0, b: '0.0.0.0.5.5.4.4.', ch: [0, 5, 3, 4], bs: { synth: 'square', root: 4, scale: 'minor', oct: 2 }, pats: [
      ['X.......X.......', '....X.......X...', 'x.x.x.x.x.x.x.x.', '', '....X.......X...', '', '', '', '', 'oooooooooooooooo', 'X...............', '']
    ] },
    { n: 'Half-time wobble', e: '💥', k: 'dubstep', t: 140, sw: 0, b: '0...0...3.....2.', bs: { synth: 'wobble', root: 2, scale: 'minor', oct: 1 }, pats: [
      ['X.........x.....', '........X.......', 'x.x.x.x.x.x.x.x.', '', '........X.......', '', '', '', 'X...............', '......x.......x.', 'X...............', '']
    ] },
    { n: 'Amen jungle', e: '🌿', k: 'jungle', t: 170, sw: 0, b: '0.........3.....', bs: { synth: 'sub', root: 0, scale: 'minor', oct: 1 }, pats: [
      ['X.X.......XX....', '....X..o.o..X..o', '', '', '', '', '', '', 'x.x.x.x.x.x.x.x.', '', '', 'X.........X.....'],
      ['X.X.......X.....', '.o..X..o.o....X.', '', '', 'X...............', '', '', '', 'x.x.x.x.x.x.x.x.', '', '..............x.', 'X.........X.....']
    ], chain: [0, 0, 0, 1] },
    { n: 'Jazz swing', e: '🎷', k: 'jazz', t: 120, sw: 60, b: '0...2...4...5...', ch: [0, 5, 1, 4], bs: { synth: 'pluck', root: 5, scale: 'major', oct: 2 }, pats: [
      ['o...............', '......o.......o.', 'o...o...o...o...', '....x.......x...', 'x..xx..xx..xx..x', '', '', '', '', '', '', '']
    ] },
    { n: 'Industrial stomp', e: '⚙️', k: 'industrial', t: 128, sw: 0, pats: [
      ['X...X...X...X...', '....X.......X...', 'x.x.x.x.x.x.x.x.', '', '..x.....x.x.....', '.......x.......x', '', '', '', 'x..x..x..x..x...', '', '............x...']
    ] },
    { n: 'Glitch hop', e: '🧩', k: 'glitch', t: 95, sw: 20, b: '0.....3...5.....', bs: { synth: 'reese', root: 7, scale: 'minor', oct: 1 }, pats: [
      ['X......x..x.....', '....X.......X...', '..x....x....x..x', '', '.x.x.x.x.x.x.x.x', '...........x....', 'oooooooooooooooo', '', '', '', '', '']
    ] },
    { n: 'Orchestral march', e: '🎺', k: 'orch', t: 110, sw: 0, ch: [0, 3, 4, 0], bs: { synth: 'sub', root: 0, scale: 'major', oct: 2 }, pats: [
      ['X.......X.......', 'X.oxX.o.X.oxX.oo', '', 'X...............', 'X...............', 'x...x...x...x...', '', '', '........X.......', '', '', '']
    ] },
    { n: 'Beatbox groove', e: '👄', k: 'beatbox', t: 92, sw: 15, pats: [
      ['X......x..X.....', '....X.......X...', 'o.o.o.o.o.o.o.o.', '..............x.', '', 'x.......x.......', '', '.......x.....x..', '', '', '', '']
    ] },
    { n: 'Roots dub', e: '🌴', k: 'dub', t: 74, sw: 15, b: '0...0.3.5...3.0.', ch: [0, -1, 3, -1], bs: { synth: 'sub', root: 7, scale: 'minor', oct: 1 }, pats: [
      ['........X.......', '........X.......', 'x.x.x.x.x.x.x.x.', '', '', '', '', 'X...............', '', '', '', '']
    ] },
    { n: 'Afrobeats', e: '🌍', k: 'afro', t: 104, sw: 10, b: '0.....0...4.....', ch: [0, 3, 4, 3], bs: { synth: 'sub', root: 9, scale: 'major', oct: 1 }, pats: [
      ['X..x..X...X..x..', '', 'xoxoxoxoxoxoxoxo', '', '....X.......X...', '', '..x..x....x..x..', '', 'x.x.x.xx.x.x.x.x', 'x.....x...x.....', '', '']
    ] },
    { n: 'Drill', e: '🌃', k: 'trap', t: 142, sw: 0, b: '0.....0...3..5..', bs: { synth: 'sub', root: 1, scale: 'minor', oct: 1 }, pats: [
      ['X.....x...x.....', '......X........X', '2.x.x3x.x.x.2.x.', '', '......X........X', '', '', '', '', '', '', '...........x....']
    ] },
    { n: 'Electro funk', e: '🤖', k: '808', t: 112, sw: 8, b: '0.0..0.3.5.0..7.', bs: { synth: 'square', root: 4, scale: 'minor', oct: 1 }, pats: [
      ['X.....x...X.....', '....X.......X...', 'x.x.x.x.x.x.x.x.', '', '....X.......X...', '', '', '', '..x..x..x.....x.', '', '', '']
    ] }
  ],
  levels: [
    { n: 'Four on the floor', tip: 'Just the kick. Every beat.', p: ['x...x...x...x...'] },
    { n: 'Backbeat', tip: 'Kick on 1 and 3, snare on 2 and 4.', p: ['x.......x.......', '....x.......x...'] },
    { n: 'Hats on', tip: 'Add eighth-note hats on top.', p: ['x.......x.......', '....x.......x...', 'x.x.x.x.x.x.x.x.'] },
    { n: 'Offbeat', tip: 'Open hats live between the kicks.', p: ['x...x...x...x...', '', '', '..x...x...x...x.'] },
    { n: 'Syncopation', tip: 'The kick sneaks in early.', p: ['x.....x...x.....', '....x.......x...'] },
    { n: 'Clap trap', tip: 'One clap, right in the middle.', p: ['x......x..x.....', '', 'x.x.x.x.x.x.x.x.', '', '........x.......'] },
    { n: 'Tom fill', tip: 'A kick, then a tumble down the toms.', p: ['x...............', '', '', '', '', '........x.x.x.xx'] },
    { n: 'More cowbell', tip: 'The prescription calls for it.', p: ['x...x...x...x...', '', '', '', '', '', '', 'x.x..x.x..x.x...'] },
    { n: 'Clave', tip: 'The 3-2 son clave on the rim.', p: ['x.......x.......', '', '', '', '', '', 'x..x..x...x.x...'] },
    { n: 'Funky drummer', tip: 'Busy hats, ghost snares.', p: ['x.x...x...x..x..', '....x..x.x..x...', 'xxxxxxxxxxxxxxxx'] },
    { n: 'Dembow', tip: 'The reggaeton heartbeat.', p: ['x...x...x...x...', '...x..x....x..x.'] },
    { n: 'Full kit', tip: 'Everything at once. Good luck.', p: ['x.....x.x.......', '....x.......x..x', 'x.x.x.x.x.x.x.x.', '..............x.', '....x...........'] }
  ],
  ach: [
    { id: 'first', i: '🥁', n: 'First beat', d: 'Press play' },
    { id: 'kits', i: '🧰', n: 'Gear head', d: 'Play every kit' },
    { id: 'song', i: '🔗', n: 'Songwriter', d: 'Play a song of 4+ bars' },
    { id: 'vel', i: '📶', n: 'Dynamics', d: 'Set a soft or accented step' },
    { id: 'prob', i: '🎲', n: 'Controlled chaos', d: 'Give a step a chance setting' },
    { id: 'rat', i: '⚡', n: 'Rollin\'', d: 'Add a ratchet roll' },
    { id: 'fx', i: '🎛️', n: 'Knob twiddler', d: 'Turn on an effect' },
    { id: 'share', i: '🔗', n: 'Spread the beat', d: 'Copy a share link' },
    { id: 'wav', i: '💾', n: 'Mastered', d: 'Export a WAV' },
    { id: 'live', i: '🎤', n: 'Finger drummer', d: 'Record live pads into a pattern' },
    { id: 'chal3', i: '🕵️', n: 'Beat detective', d: 'Solve 3 challenge levels' },
    { id: 'chalall', i: '🏆', n: 'Golden ears', d: 'Solve every challenge level' },
    { id: 'daily', i: '📅', n: 'Daily groove', d: 'Crack the daily beat' },
    { id: 'presets', i: '🎵', n: 'Crate digger', d: 'Try 10 presets' }
  ]
};
