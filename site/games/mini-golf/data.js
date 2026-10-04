'use strict';
(() => {
    const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const oct = [[180, 60], [720, 60], [840, 180], [840, 360], [720, 480], [180, 480], [60, 360], [60, 180]];
    window.MG_COURSES = [
        {
            id: 'meadow', name: 'Meadow Links', blurb: 'Sand, a river, a windmill and one smug island.',
            hazard: 'water', hazardName: 'Splash',
            pal: { bg: '#3f8f3a', bg2: '#47a043', turf: '#5fd068', wall: '#b07a43', wallDark: '#7a4a22', flag: '#ff5a36', accent: '#ffd166' },
            holes: [
                { name: 'Warm-up', par: 2, tee: [150, 270], cup: [750, 270], outer: rect(60, 150, 780, 240), blocks: [rect(425, 225, 50, 90)] },
                { name: 'The Dogleg', par: 3, tee: [190, 130], cup: [770, 405], outer: [[60, 60], [320, 60], [320, 320], [840, 320], [840, 490], [60, 490]], sand: [{ c: [250, 420, 42] }, { c: [560, 455, 30] }] },
                { name: 'Sand Trap', par: 2, tee: [130, 270], cup: [770, 270], outer: rect(60, 100, 780, 340), sand: [{ r: [300, 100, 90, 148] }, { r: [300, 292, 90, 148] }, { r: [600, 100, 60, 132] }, { r: [600, 308, 60, 132] }] },
                { name: 'River Crossing', par: 3, tee: [140, 380], cup: [760, 160], outer: rect(60, 80, 780, 380), water: [{ r: [380, 80, 140, 170] }, { r: [380, 310, 140, 150] }], sand: [{ c: [660, 300, 40] }] },
                { name: 'The Hill', par: 3, tee: [130, 370], cup: [760, 170], outer: rect(60, 110, 780, 320), slopes: [{ r: [300, 110, 300, 320], f: [0, 170] }], posts: [[700, 300, 16]] },
                { name: 'Windmill', par: 3, tee: [130, 270], cup: [770, 270], outer: rect(60, 140, 780, 260), blocks: [rect(430, 140, 40, 90), rect(430, 310, 40, 90)], movers: [{ type: 'spin', x: 450, y: 270, len: 64, speed: 1.7, mill: 1 }] },
                { name: 'Pinball', par: 3, tee: [120, 270], cup: [780, 270], outer: rect(60, 60, 780, 420), blocks: [[[60, 60], [190, 60], [60, 190]], [[60, 480], [60, 350], [190, 480]], [[840, 60], [840, 170], [730, 60]], [[840, 480], [730, 480], [840, 370]]], posts: [[300, 150, 18, 1], [300, 270, 18, 1], [300, 390, 18, 1], [450, 210, 18, 1], [450, 330, 18, 1], [600, 150, 18, 1], [600, 270, 18, 1], [600, 390, 18, 1]] },
                { name: 'Slider Alley', par: 4, tee: [120, 125], cup: [780, 415], outer: rect(60, 60, 780, 420), blocks: [rect(60, 190, 580, 25), rect(260, 325, 580, 25)], slopes: [{ r: [260, 215, 380, 110], f: [-120, 0] }], movers: [{ type: 'slide', x: 420, y1: 60, y2: 190, w: 26, h: 56, period: 3 }, { type: 'slide', x: 520, y1: 350, y2: 480, w: 26, h: 56, period: 2.4 }] },
                { name: 'Treasure Island', par: 4, tee: [120, 270], cup: [700, 270], outer: rect(60, 60, 780, 420), water: [{ r: [560, 60, 280, 110] }, { r: [560, 370, 280, 110] }, { r: [560, 170, 60, 82] }, { r: [560, 288, 60, 82] }, { r: [780, 170, 60, 200] }], sand: [{ c: [200, 140, 48] }, { c: [200, 400, 48] }], posts: [[450, 180, 16], [450, 360, 16]], movers: [{ type: 'spin', x: 330, y: 270, len: 70, speed: -2.1 }] }
            ]
        },
        {
            id: 'canyon', name: 'Lava Canyon', blurb: 'Boost pads, cactus posts and a moat of molten rock.',
            hazard: 'lava', hazardName: 'Sizzle',
            pal: { bg: '#c9773f', bg2: '#b5652f', turf: '#4fb38a', wall: '#e0aa6c', wallDark: '#9c5a2c', flag: '#ffd23f', accent: '#ff8a3d' },
            holes: [
                { name: 'Mesa Start', par: 2, tee: [140, 270], cup: [760, 270], outer: rect(60, 140, 780, 260), water: [{ r: [300, 140, 300, 40] }, { r: [300, 360, 300, 40] }], posts: [[450, 220, 16], [450, 320, 16]] },
                { name: 'Switchback', par: 4, tee: [160, 140], cup: [720, 400], outer: rect(60, 60, 780, 420), blocks: [rect(260, 60, 30, 280), rect(560, 200, 30, 280)], sand: [{ c: [420, 300, 34] }] },
                { name: 'Boost Ramp', par: 3, tee: [130, 270], cup: [795, 225], outer: rect(60, 180, 780, 180), blocks: [rect(700, 180, 30, 110)], slopes: [{ r: [260, 180, 140, 180], f: [700, 0], boost: 1 }], water: [{ r: [540, 180, 90, 60] }, { r: [540, 300, 90, 60] }] },
                { name: 'Lava Moat', par: 3, tee: [140, 400], cup: [650, 270], outer: rect(60, 60, 780, 420), water: [{ r: [500, 120, 100, 60] }, { r: [660, 120, 120, 60] }, { r: [500, 360, 280, 60] }, { r: [720, 180, 60, 180] }, { r: [500, 180, 60, 180] }], posts: [[350, 200, 18], [350, 340, 18]] },
                { name: 'Tumbleweed', par: 3, tee: [130, 390], cup: [720, 130], outer: [[60, 300], [600, 300], [600, 60], [840, 60], [840, 480], [60, 480]], water: [{ r: [780, 230, 60, 70] }], movers: [{ type: 'spin', x: 720, y: 390, len: 70, speed: 2 }] },
                { name: 'Canyon Bank', par: 3, tee: [200, 140], cup: [700, 140], outer: rect(60, 60, 780, 420), blocks: [rect(420, 60, 40, 320), [[60, 400], [140, 480], [60, 480]], [[840, 400], [760, 480], [840, 480]]], sand: [{ c: [600, 300, 40] }] },
                { name: 'Conveyor', par: 2, tee: [130, 270], cup: [770, 270], outer: rect(60, 100, 780, 340), blocks: [rect(250, 210, 400, 120)], slopes: [{ r: [250, 100, 400, 110], f: [-520, 0], boost: 1 }, { r: [250, 330, 400, 110], f: [520, 0], boost: 1 }] },
                { name: 'Rockslide', par: 3, tee: [130, 420], cup: [770, 120], outer: rect(60, 60, 780, 420), movers: [{ type: 'slide', x: 300, y1: 60, y2: 480, w: 30, h: 110, period: 3.2 }, { type: 'slide', x: 450, y1: 60, y2: 480, w: 30, h: 110, period: 2.5 }, { type: 'slide', x: 600, y1: 60, y2: 480, w: 30, h: 110, period: 3.8 }], water: [{ c: [770, 400, 50] }] },
                { name: 'The Volcano', par: 3, tee: [210, 110], cup: [600, 270], outer: oct, slopes: [{ r: [520, 160, 160, 60], f: [0, -220] }, { r: [520, 320, 160, 60], f: [0, 220] }, { r: [680, 190, 60, 160], f: [220, 0] }], water: [{ r: [300, 60, 120, 110] }, { r: [300, 370, 120, 110] }], posts: [[460, 200, 14, 1], [460, 340, 14, 1]] }
            ]
        },
        {
            id: 'glacier', name: 'Glacier Peak', blurb: 'Slippery ice, deep snow and very cold water.',
            hazard: 'frost', hazardName: 'Brrr',
            pal: { bg: '#cfe4f1', bg2: '#e9f4fb', turf: '#5ab89a', wall: '#f4fbff', wallDark: '#7fa6c0', flag: '#3a7bd5', accent: '#9be7ff' },
            holes: [
                { name: 'First Frost', par: 2, tee: [140, 270], cup: [760, 270], outer: rect(60, 150, 780, 240), ice: [{ r: [250, 150, 400, 240] }], posts: [[450, 270, 20]] },
                { name: 'Ice Rink', par: 3, tee: [140, 160], cup: [760, 380], outer: rect(60, 80, 780, 380), ice: [{ r: [60, 80, 780, 380] }], sand: [{ c: [450, 270, 60] }] },
                { name: 'Snow Drifts', par: 3, tee: [130, 270], cup: [780, 400], outer: rect(60, 60, 780, 420), sand: [{ c: [300, 180, 70] }, { c: [300, 380, 60] }, { c: [560, 270, 80] }, { c: [720, 140, 50] }] },
                { name: 'Frozen Pond', par: 3, tee: [140, 270], cup: [760, 270], outer: rect(60, 80, 780, 380), ice: [{ r: [280, 80, 340, 380] }], water: [{ r: [360, 180, 180, 180] }] },
                { name: 'Penguin Slide', par: 3, tee: [180, 400], cup: [760, 140], outer: [[60, 60], [840, 60], [840, 220], [300, 220], [300, 480], [60, 480]], slopes: [{ r: [60, 230, 240, 250], f: [0, -160] }], ice: [{ r: [300, 60, 540, 160] }] },
                { name: 'Icicle Gate', par: 3, tee: [130, 270], cup: [780, 270], outer: rect(60, 140, 780, 260), blocks: [rect(430, 140, 40, 90), rect(430, 310, 40, 90)], ice: [{ r: [470, 140, 370, 260] }], movers: [{ type: 'spin', x: 450, y: 270, len: 64, speed: 2.2 }] },
                { name: 'Crevasse', par: 3, tee: [140, 380], cup: [760, 380], outer: rect(60, 60, 780, 420), water: [{ r: [300, 60, 60, 180] }, { r: [300, 300, 60, 180] }, { r: [560, 60, 60, 90] }, { r: [560, 210, 60, 270] }] },
                { name: 'Slalom', par: 5, tee: [140, 120], cup: [760, 420], outer: rect(60, 60, 780, 420), ice: [{ r: [60, 60, 780, 420] }], blocks: [rect(240, 60, 30, 300), rect(440, 180, 30, 300), rect(640, 60, 30, 300)] },
                { name: 'Avalanche', par: 3, tee: [130, 270], cup: [780, 270], outer: rect(60, 60, 780, 420), slopes: [{ r: [400, 60, 440, 210], f: [0, 140] }, { r: [400, 270, 440, 210], f: [0, -140] }], water: [{ r: [600, 60, 240, 60] }, { r: [600, 420, 240, 60] }], sand: [{ c: [250, 270, 50] }], movers: [{ type: 'slide', x: 520, y1: 60, y2: 480, w: 30, h: 90, period: 3 }] }
            ]
        },
        {
            id: 'cosmos', name: 'Cosmic Course', blurb: 'Portals, gravity wells and the void between stars.',
            hazard: 'void', hazardName: 'Lost in space',
            pal: { bg: '#15112e', bg2: '#221a48', turf: '#5b46c9', wall: '#58e6ff', wallDark: '#1f6b8a', flag: '#ff4fd8', accent: '#58e6ff' },
            holes: [
                { name: 'Liftoff', par: 2, tee: [140, 270], cup: [760, 270], outer: rect(60, 150, 780, 240), blocks: [rect(430, 150, 40, 240)], portals: [{ a: [330, 270], b: [570, 270] }] },
                { name: 'Gravity Well', par: 3, tee: [140, 400], cup: [760, 140], outer: rect(60, 60, 780, 420), wells: [[450, 270, 190, 900]], water: [{ c: [450, 270, 26] }] },
                { name: 'Asteroid Belt', par: 3, tee: [120, 270], cup: [780, 270], outer: rect(60, 60, 780, 420), posts: [[280, 120, 20, 1], [280, 270, 20, 1], [280, 420, 20, 1], [420, 190, 22, 1], [420, 350, 22, 1], [560, 120, 20, 1], [560, 270, 20, 1], [560, 420, 20, 1], [690, 190, 16, 1], [690, 350, 16, 1]] },
                { name: 'Wormhole', par: 3, tee: [140, 400], cup: [760, 140], outer: rect(60, 60, 780, 420), blocks: [rect(330, 60, 30, 420), rect(560, 60, 30, 420)], portals: [{ a: [260, 140], b: [420, 400] }, { a: [500, 140], b: [650, 400] }] },
                { name: 'Orbit', par: 2, tee: [140, 270], cup: [620, 270], outer: rect(60, 60, 780, 420), wells: [[620, 270, 160, 650]], posts: [[400, 200, 16], [400, 340, 16]] },
                { name: 'Satellites', par: 3, tee: [130, 270], cup: [780, 270], outer: rect(60, 140, 780, 260), movers: [{ type: 'spin', x: 330, y: 270, len: 80, speed: 1.6 }, { type: 'spin', x: 600, y: 270, len: 80, speed: -2 }] },
                { name: 'Black Hole', par: 3, tee: [140, 140], cup: [760, 400], outer: rect(60, 60, 780, 420), wells: [[450, 270, 230, 520]], water: [{ c: [450, 270, 60] }], posts: [[700, 160, 18, 1]] },
                { name: 'Nebula Maze', par: 4, tee: [130, 120], cup: [740, 140], outer: rect(60, 60, 780, 420), blocks: [rect(200, 60, 30, 300), rect(380, 180, 30, 300), rect(560, 60, 30, 300)], water: [{ c: [490, 270, 30] }], portals: [{ a: [340, 430], b: [700, 420] }] },
                { name: 'Supernova', par: 3, tee: [140, 270], cup: [650, 270], outer: oct, posts: [[720, 270, 14, 1], [700, 220, 14, 1], [650, 200, 14, 1], [600, 220, 14, 1], [600, 320, 14, 1], [650, 340, 14, 1], [700, 320, 14, 1]], movers: [{ type: 'slide', x: 400, y1: 60, y2: 480, w: 30, h: 120, period: 2.6 }] }
            ]
        }
    ];
})();
