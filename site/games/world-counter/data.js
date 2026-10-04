(() => {
  const YEAR = 365.2425 * 86400, DAY = 86400;
  const y = (n) => n / YEAR, d = (n) => n / DAY;
  window.WC_CATS = [
    { id: 'people', label: 'People', a: '#ff8a65', b: '#e64a19' },
    { id: 'you', label: 'Your body', a: '#f48fb1', b: '#c2185b' },
    { id: 'online', label: 'Online', a: '#64b5f6', b: '#1565c0' },
    { id: 'planet', label: 'Planet', a: '#81c784', b: '#2e7d32' },
    { id: 'space', label: 'Space & motion', a: '#9575cd', b: '#4527a0' },
    { id: 'food', label: 'Food & drink', a: '#ffd54f', b: '#ef8f00' },
    { id: 'made', label: 'Stuff made & used', a: '#90a4ae', b: '#455a64' },
    { id: 'move', label: 'On the move', a: '#4dd0e1', b: '#00838f' }
  ];
  window.WC_COUNTERS = [
    { id: 'births', c: 'people', l: 'Babies born', r: y(132e6), n: 'About 132 million a year (UN estimate)', i: 'baby' },
    { id: 'deaths', c: 'people', l: 'Deaths', r: y(62e6), n: 'About 62 million a year (UN estimate)', i: 'dove' },
    { id: 'growth', c: 'people', l: 'Net population growth', r: y(70e6), n: 'Births minus deaths: about 70 million more people a year', i: 'growth' },
    { id: 'twins', c: 'people', l: 'Sets of twins born', r: y(1.6e6), n: 'About 1.6 million twin births a year', i: 'twins', dec: 1 },
    { id: 'bday', c: 'people', l: 'Birthdays starting', s: 'bday', n: 'Everyone alive spread over 365 days: about 22 million birthdays a day', i: 'cake' },
    { id: 'heart', c: 'people', l: 'Human heartbeats', s: 'heart', n: 'Everyone alive at about 70 beats a minute', i: 'heart' },
    { id: 'breath', c: 'people', l: 'Breaths taken', s: 'breath', n: 'Everyone alive at about 15 breaths a minute', i: 'lungs' },
    { id: 'blink', c: 'people', l: 'Blinks', s: 'blink', n: 'Everyone alive at about 17 blinks a minute', i: 'eye' },
    { id: 'sleep', c: 'people', l: 'Hours slept by humanity', s: 'sleep', u: ' h', n: 'Everyone alive sleeping about 8 hours a day', i: 'moon' },
    { id: 'steps', c: 'people', l: 'Steps walked', s: 'steps', n: 'About 5,000 steps a day each, a rough average from phone step counters', i: 'feet' },
    { id: 'words', c: 'people', l: 'Words spoken', s: 'words', n: 'About 16,000 words a day each, from a 2007 recording study', i: 'speech' },

    { id: 'myheart', c: 'you', l: 'Your heartbeats', r: 70 / 60, n: 'A resting heart beats roughly 60 to 100 times a minute. We assumed 70.', i: 'heart' },
    { id: 'mybreath', c: 'you', l: 'Your breaths', r: 15 / 60, n: 'About 12 to 20 breaths a minute at rest', i: 'lungs' },
    { id: 'myblink', c: 'you', l: 'Your blinks', r: 17 / 60, n: 'About 15 to 20 blinks a minute, fewer while staring at screens', i: 'eye' },
    { id: 'mycells', c: 'you', l: 'Cells your body replaced', r: 3.8e6, n: 'About 330 billion cells a day, mostly blood and gut cells (2021 estimate)', i: 'cell' },
    { id: 'myskin', c: 'you', l: 'Skin cells shed', r: 500, n: 'Around 30,000 a minute. They are a lot of household dust.', i: 'skin' },
    { id: 'myhair', c: 'you', l: 'Your hair grew', r: d(350000), u: ' nm', n: 'About 0.35 mm a day, roughly 1 cm a month', i: 'hair' },
    { id: 'mynails', c: 'you', l: 'Your fingernails grew', r: d(100000), u: ' nm', n: 'About 3 mm a month', i: 'nail' },
    { id: 'mykcal', c: 'you', l: 'Calories you burned resting', r: d(1600), u: ' kcal', dec: 2, n: 'A typical adult resting metabolic rate is 1,400 to 1,800 kcal a day', i: 'flame' },
    { id: 'myspit', c: 'you', l: 'Saliva you made', r: d(1000), u: ' mL', dec: 2, n: 'Roughly half a litre to 1.5 litres a day', i: 'drop' },

    { id: 'emails', c: 'online', l: 'Emails sent', r: d(360e9), n: 'About 360 billion a day, including lots of spam', i: 'mail' },
    { id: 'search', c: 'online', l: 'Google searches', r: y(5e12), n: 'More than 5 trillion a year, according to Google', i: 'search' },
    { id: 'whatsapp', c: 'online', l: 'WhatsApp messages', r: d(100e9), n: 'About 100 billion a day, according to Meta', i: 'chat' },
    { id: 'posts', c: 'online', l: 'Posts on X', r: d(500e6), n: 'Roughly 500 million a day (last widely reported figure)', i: 'post' },
    { id: 'youtube', c: 'online', l: 'Hours of video uploaded to YouTube', r: 500 / 60, u: ' h', n: 'About 500 hours every minute', i: 'play' },
    { id: 'photos', c: 'online', l: 'Photos taken', r: y(2e12), n: 'About 2 trillion a year, mostly on phones', i: 'camera' },
    { id: 'btc', c: 'online', l: 'Bitcoin blocks mined', r: 1 / 600, dec: 2, n: 'The network is tuned to find one block about every 10 minutes', i: 'coin' },
    { id: 'data', c: 'online', l: 'Data created', r: y(147e12), u: ' GB', n: 'About 147 zettabytes a year (2024 industry estimate)', i: 'data' },

    { id: 'lightning', c: 'planet', l: 'Lightning flashes', r: 44, n: 'About 44 a second, measured by NASA satellites', i: 'bolt' },
    { id: 'quakes', c: 'planet', l: 'Earthquakes (detectable)', r: y(500e3), dec: 2, n: 'About 500,000 a year, per the USGS', i: 'quake' },
    { id: 'felt', c: 'planet', l: 'Earthquakes people can feel', r: y(100e3), dec: 2, n: 'About 100,000 a year are strong enough to feel', i: 'quake' },
    { id: 'trees', c: 'planet', l: 'Trees cut down', r: y(15e9), n: 'About 15 billion a year (2015 study in Nature)', i: 'tree' },
    { id: 'co2', c: 'planet', l: 'CO₂ from fossil fuels', r: y(37.4e9), u: ' t', n: 'About 37 billion tonnes a year (Global Carbon Project)', i: 'factory' },
    { id: 'greenland', c: 'planet', l: 'Greenland ice lost', r: y(270e9), u: ' t', n: 'About 270 billion tonnes a year (NASA GRACE satellites)', i: 'ice' },
    { id: 'antarctica', c: 'planet', l: 'Antarctic ice lost', r: y(150e9), u: ' t', n: 'About 150 billion tonnes a year (NASA GRACE satellites)', i: 'ice' },
    { id: 'rain', c: 'planet', l: 'Rain and snow falling', r: y(5.05e17), u: ' L', n: 'About 505,000 cubic kilometres of water a year', i: 'rain' },
    { id: 'amazon', c: 'planet', l: 'Water poured out by the Amazon', r: 209000, u: ' m³', n: 'About 209,000 cubic metres every second, the most of any river', i: 'river' },
    { id: 'dust', c: 'planet', l: 'Space dust landing on Earth', r: d(44000), u: ' kg', dec: 1, n: 'Roughly 44 tonnes a day, by one NASA estimate', i: 'meteor' },
    { id: 'sun', c: 'planet', l: 'Solar energy reaching Earth', r: 48.1, u: ' TWh', n: 'About 173,000 terawatts: a year of human energy use roughly every hour', i: 'sun' },

    { id: 'orbit', c: 'space', l: 'Km Earth travelled around the Sun', r: 29.78, u: ' km', n: 'An average of 29.78 km every second', i: 'orbit' },
    { id: 'spin', c: 'space', l: 'Km the equator spun', r: 0.465, u: ' km', dec: 2, n: 'A point on the equator moves at about 465 metres a second', i: 'globe' },
    { id: 'galaxy', c: 'space', l: 'Km the Sun moved around the galaxy', r: 230, u: ' km', n: 'About 230 km a second. One lap takes around 230 million years.', i: 'galaxy' },
    { id: 'light', c: 'space', l: 'Km a beam of light travelled', r: 299792.458, u: ' km', n: 'Exactly 299,792.458 km every second', i: 'beam' },
    { id: 'iss', c: 'space', l: 'Km the International Space Station flew', r: 7.66, u: ' km', n: 'About 7.66 km a second: 16 orbits a day', i: 'iss' },
    { id: 'moon', c: 'space', l: 'Nanometres the Moon drifted away', r: y(3.8e7), u: ' nm', dec: 1, n: 'About 3.8 cm a year, measured with lasers bounced off Apollo mirrors', i: 'moonaway' },
    { id: 'atlantic', c: 'space', l: 'Nanometres the Atlantic widened', r: y(2.5e7), u: ' nm', dec: 1, n: 'About 2.5 cm a year, roughly as fast as fingernails grow', i: 'plates' },

    { id: 'coffee', c: 'food', l: 'Cups of coffee', r: d(2.25e9), n: 'About 2.25 billion cups a day', i: 'coffee' },
    { id: 'banana', c: 'food', l: 'Bananas eaten', r: y(100e9), n: 'About 100 billion a year', i: 'banana' },
    { id: 'pizza', c: 'food', l: 'Pizza slices eaten in the US', r: 350, n: 'About 350 slices a second', i: 'pizza' },
    { id: 'eggs', c: 'food', l: 'Eggs laid by hens', r: y(1.6e12), n: 'About 1.6 trillion a year (FAO)', i: 'egg' },
    { id: 'beer', c: 'food', l: 'Litres of beer brewed', r: y(1.9e11), u: ' L', n: 'About 1.9 billion hectolitres a year', i: 'beer' },
    { id: 'rice', c: 'food', l: 'Rice grown', r: y(520e6), u: ' t', n: 'About 520 million tonnes of milled rice a year (FAO)', i: 'rice' },
    { id: 'coke', c: 'food', l: 'Coca-Cola drinks served', r: d(2.2e9), n: 'About 2.2 billion servings a day, according to the company', i: 'soda' },
    { id: 'waste', c: 'food', l: 'Food wasted', r: y(1.05e9), u: ' t', n: 'About 1.05 billion tonnes a year (UN Environment Programme, 2024)', i: 'bin' },
    { id: 'sugar', c: 'food', l: 'Sugar produced', r: y(180e6), u: ' t', n: 'About 180 million tonnes a year', i: 'sugar' },
    { id: 'honey', c: 'food', l: 'Honey produced', r: y(1.8e6), u: ' t', dec: 2, n: 'About 1.8 million tonnes a year (FAO)', i: 'honey' },

    { id: 'cars', c: 'made', l: 'Motor vehicles made', r: y(93e6), dec: 1, n: 'About 93 million a year (OICA)', i: 'car' },
    { id: 'evs', c: 'made', l: 'Electric cars sold', r: y(17e6), dec: 1, n: 'About 17 million in 2024 (IEA)', i: 'ev' },
    { id: 'bikes', c: 'made', l: 'Bicycles made', r: y(100e6), dec: 1, n: 'Over 100 million a year', i: 'bike' },
    { id: 'phones', c: 'made', l: 'Smartphones sold', r: y(1.2e9), n: 'About 1.2 billion a year', i: 'phone' },
    { id: 'pcs', c: 'made', l: 'PCs shipped', r: y(260e6), dec: 1, n: 'About 260 million a year', i: 'pc' },
    { id: 'oil', c: 'made', l: 'Barrels of oil used', r: d(103e6), n: 'About 103 million barrels a day', i: 'barrel' },
    { id: 'power', c: 'made', l: 'Electricity generated', r: y(3.0e10), u: ' MWh', n: 'About 30,000 terawatt-hours a year', i: 'plug' },
    { id: 'solar', c: 'made', l: 'Solar panels installed', r: y(6e8), u: ' kW', n: 'About 600 gigawatts of capacity added in 2024', i: 'solar' },
    { id: 'plastic', c: 'made', l: 'Plastic produced', r: y(400e6), u: ' t', n: 'About 400 million tonnes a year', i: 'bottle' },
    { id: 'steel', c: 'made', l: 'Steel produced', r: y(1.89e9), u: ' t', n: 'About 1.9 billion tonnes a year (worldsteel)', i: 'ibeam' },
    { id: 'cement', c: 'made', l: 'Cement produced', r: y(4.1e9), u: ' t', n: 'About 4 billion tonnes a year', i: 'cement' },
    { id: 'gold', c: 'made', l: 'Gold mined', r: y(3.6e6), u: ' kg', dec: 2, n: 'About 3,600 tonnes a year (World Gold Council)', i: 'gold' },
    { id: 'paper', c: 'made', l: 'Paper and cardboard made', r: y(400e6), u: ' t', n: 'About 400 million tonnes a year', i: 'paper' },
    { id: 'crayons', c: 'made', l: 'Crayola crayons made', r: y(3e9), n: 'About 3 billion a year, according to Crayola', i: 'crayon' },

    { id: 'flights', c: 'move', l: 'Flights taking off', r: y(38e6), dec: 1, n: 'About 38 million commercial flights a year', i: 'plane' },
    { id: 'pax', c: 'move', l: 'Air passengers', r: y(5e9), n: 'About 5 billion passenger journeys a year (IATA)', i: 'case' },
    { id: 'boxes', c: 'move', l: 'Shipping containers handled at ports', r: y(860e6), n: 'About 860 million container moves (TEU) a year', i: 'ship' }
  ];

  window.WC_LAND = [
    [[-168, 66], [-162, 70], [-156, 71], [-140, 70], [-128, 70], [-115, 68], [-100, 68], [-95, 72], [-85, 70], [-82, 66], [-90, 63], [-94, 59], [-90, 57], [-82, 55], [-79, 52], [-77, 58], [-73, 62], [-65, 60], [-61, 56], [-56, 52], [-60, 47], [-65, 44], [-70, 42], [-74, 40], [-76, 35], [-80, 32], [-81, 27], [-80, 25], [-82, 27], [-84, 30], [-89, 30], [-94, 29], [-97, 27], [-97, 22], [-95, 19], [-91, 18], [-88, 21], [-87, 16], [-84, 15], [-83, 10], [-79, 9], [-77, 8], [-80, 7], [-85, 11], [-87, 13], [-92, 14], [-96, 16], [-105, 20], [-106, 23], [-110, 24], [-112, 29], [-114, 31], [-112, 26], [-110, 23], [-115, 30], [-117, 33], [-121, 35], [-124, 40], [-124, 46], [-125, 49], [-130, 54], [-135, 58], [-142, 60], [-150, 60], [-153, 57], [-158, 56], [-162, 55], [-158, 58], [-162, 60], [-165, 62], [-168, 66]],
    [[-73, 78], [-60, 82], [-35, 83], [-20, 82], [-18, 76], [-22, 70], [-26, 68], [-40, 65], [-44, 60], [-50, 62], [-53, 67], [-56, 72], [-66, 76], [-73, 78]],
    [[-80, 9], [-77, 8], [-72, 12], [-63, 11], [-60, 8], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-35, -9], [-39, -14], [-41, -22], [-48, -26], [-53, -33], [-58, -35], [-57, -38], [-62, -39], [-65, -42], [-65, -47], [-68, -50], [-69, -55], [-72, -53], [-75, -48], [-74, -42], [-73, -37], [-71, -30], [-70, -20], [-71, -17], [-76, -14], [-80, -6], [-81, -3], [-80, 0], [-78, 2], [-77, 7], [-80, 9]],
    [[-17, 21], [-16, 15], [-17, 13], [-13, 9], [-8, 4], [-3, 5], [3, 6], [7, 4], [9, 4], [10, -1], [12, -6], [13, -12], [12, -18], [15, -27], [18, -33], [20, -35], [26, -34], [31, -29], [33, -26], [35, -22], [35, -18], [40, -15], [40, -10], [39, -5], [42, 0], [46, 3], [51, 11], [44, 11], [43, 12], [39, 16], [37, 20], [35, 25], [33, 28], [32, 31], [25, 32], [20, 31], [15, 32], [10, 34], [11, 37], [3, 37], [-2, 35], [-6, 36], [-10, 31], [-13, 28], [-17, 21]],
    [[44, -25], [47, -25], [50, -15], [49, -12], [44, -17], [44, -25]],
    [[-9, 37], [-9, 43], [-2, 43.5], [-1, 46], [-4, 48], [2, 51], [5, 53], [8, 54], [10, 54], [14, 54], [20, 55], [22, 57], [24, 60], [30, 60], [34, 65], [40, 66], [44, 68], [54, 69], [60, 70], [68, 73], [73, 72], [80, 73], [88, 75], [100, 77], [110, 77], [114, 74], [125, 73], [135, 72], [145, 72], [160, 70], [170, 70], [180, 68], [180, 65], [175, 62], [170, 60], [163, 58], [162, 54], [156, 51], [157, 57], [160, 60], [155, 60], [150, 59], [142, 59], [136, 55], [140, 52], [140, 48], [135, 43], [130, 42], [128, 38], [126, 35], [126, 38], [122, 40], [121, 37], [119, 35], [121, 31], [122, 28], [119, 25], [116, 23], [110, 21], [108, 21], [106, 18], [109, 12], [105, 9], [103, 10], [100, 13], [100, 8], [103, 1], [104, 1.5], [101, 3], [98, 8], [98, 15], [95, 17], [94, 19], [92, 22], [89, 22], [87, 21], [85, 19], [80, 15], [80, 10], [77, 8], [76, 11], [73, 17], [72, 21], [69, 22], [66, 25], [62, 25], [57, 26], [56, 27], [52, 28], [49, 30], [48, 29], [50, 26], [51, 24], [56, 26], [57, 24], [59, 22], [55, 17], [52, 16], [45, 13], [43, 13], [39, 21], [35, 28], [34, 31], [35, 36], [30, 36], [27, 37], [26, 40], [29, 41], [33, 42], [38, 41], [41, 41], [41, 43], [38, 45], [35, 45], [31, 46], [30, 45], [28, 44], [28, 42], [26, 40], [23, 40], [22, 37], [21, 39], [19, 42], [16, 43], [13, 45], [12, 44], [16, 41], [18, 40], [16, 38], [15, 40], [12, 42], [9, 44], [7, 44], [3, 43], [3, 42], [0, 40], [-1, 37], [-5, 36], [-9, 37]],
    [[5, 58], [5, 62], [11, 64], [14, 67], [17, 69], [21, 70], [26, 71], [30, 70], [28, 68], [24, 66], [22, 65], [21, 63], [18, 61], [19, 59], [16, 56], [13, 55], [12, 57], [11, 59], [8, 58], [5, 58]],
    [[-5, 50], [1, 51], [2, 53], [-1, 55], [-2, 57], [-2, 58.6], [-5, 58.5], [-6, 56], [-5, 55], [-3, 54.5], [-4, 53], [-5, 52], [-5, 50]],
    [[-10, 52], [-6, 52], [-6, 55], [-8, 55], [-10, 54], [-10, 52]],
    [[-24, 64], [-22, 66], [-15, 66.5], [-13, 65], [-18, 63.5], [-24, 64]],
    [[130, 31], [132, 34], [135, 34], [140, 35], [141, 38], [142, 41], [140, 41], [139, 38], [136, 37], [133, 35], [130, 33], [130, 31]],
    [[140, 42], [143, 42], [145, 44], [142, 45.5], [140, 43], [140, 42]],
    [[95, 5], [98, 4], [104, -2], [106, -6], [102, -4], [96, 2], [95, 5]],
    [[109, 1], [111, 2], [117, 7], [119, 5], [118, 1], [116, -4], [111, -3], [109, 1]],
    [[105, -6], [109, -7], [114, -7], [115, -8.5], [106, -7.5], [105, -6]],
    [[131, -1], [138, -2], [145, -5], [150, -10], [143, -9], [138, -8], [134, -4], [131, -1]],
    [[120, 18], [122, 18], [124, 13], [126, 8], [125, 6], [122, 7], [123, 10], [120, 14], [120, 18]],
    [[80, 10], [82, 7], [81, 6], [80, 6.5], [80, 10]],
    [[114, -22], [114, -26], [115, -34], [118, -35], [123, -34], [129, -31.5], [134, -32], [138, -35], [140, -38], [146, -39], [150, -37], [153, -31], [153, -25], [150, -22], [146, -19], [145, -15], [142, -11], [141, -17], [136, -15], [137, -12], [132, -11], [129, -15], [126, -14], [122, -18], [114, -22]],
    [[145, -41], [148, -41], [148, -43], [146, -43.5], [145, -41]],
    [[172.7, -34.4], [175, -36.5], [178.5, -37.7], [176.9, -39.6], [175, -41.6], [174.6, -39.8], [172.7, -34.4]],
    [[172.7, -40.5], [174.3, -41.5], [171.3, -44.4], [169, -46.6], [166.5, -46], [168, -44], [172.7, -40.5]],
    [[-85, 22], [-80, 23.2], [-74, 20], [-77.5, 20], [-85, 22]],
    [[-74.5, 18.5], [-72, 20], [-68.5, 18.5], [-71, 17.6], [-74.5, 18.5]],
    [[120, 25], [122, 25.3], [121, 22], [120, 23], [120, 25]],
    [[-180, -78], [-150, -77], [-120, -73], [-90, -72], [-70, -70], [-60, -64], [-58, -63], [-62, -66], [-62, -71], [-40, -78], [-20, -74], [0, -70], [30, -69], [60, -67], [90, -66], [120, -66], [150, -68], [165, -71], [170, -77], [180, -78], [180, -90], [-180, -90]]
  ];

  window.WC_CITIES = [
    [35.7, 139.7, 37], [28.6, 77.2, 33], [31.2, 121.5, 29], [23.8, 90.4, 23], [-23.5, -46.6, 22], [30, 31.2, 22], [19.4, -99.1, 22], [39.9, 116.4, 22], [19.1, 72.9, 21], [34.7, 135.5, 19],
    [29.6, 106.5, 17], [24.9, 67, 17], [-4.3, 15.3, 17], [6.5, 3.4, 16], [41, 29, 16], [-34.6, -58.4, 15], [22.6, 88.4, 15], [14.6, 121, 15], [23.1, 113.3, 14], [39.1, 117.2, 14],
    [31.5, 74.3, 14], [13, 77.6, 13], [-22.9, -43.2, 13], [22.5, 114.1, 13], [55.8, 37.6, 12.6], [13.1, 80.3, 12], [4.7, -74.1, 11], [-6.2, 106.8, 11], [-12, -77, 11], [48.9, 2.35, 11],
    [13.75, 100.5, 11], [17.4, 78.5, 11], [37.6, 127, 10], [51.5, -0.1, 9.6], [35.7, 51.4, 9.5], [41.9, -87.6, 9], [40.7, -74, 19], [34, -118.2, 12.5], [10.8, 106.7, 9], [-8.8, 13.2, 9],
    [23, 72.6, 8.5], [3.1, 101.7, 8.6], [22.3, 114.2, 7.6], [24.7, 46.7, 7.7], [33.3, 44.4, 7.5], [-33.4, -70.6, 6.9], [40.4, -3.7, 6.7], [43.7, -79.4, 6.4], [-6.8, 39.3, 7.8], [-1.3, 36.8, 5.3],
    [-26.2, 28, 6.2], [9, 38.7, 5.5], [-33.9, 151.2, 5.3], [-37.8, 145, 5.1], [52.5, 13.4, 3.6], [5.3, -4, 5.9], [15.6, 32.5, 6], [16.8, 96.2, 5.6], [34.5, 69.2, 4.6], [14.7, -17.4, 3.3],
    [29.8, -95.4, 7], [25.8, -80.2, 6.1], [33.7, -84.4, 6.2], [25.7, -100.3, 5], [20.7, -103.3, 5.3], [10.5, -66.9, 3], [33.6, -7.6, 4], [36.8, 3, 3], [41.9, 12.5, 4.3], [45.5, 9.2, 3.1],
    [50.45, 30.5, 3], [39.9, 32.9, 5.3], [30.7, 104, 9.5], [30.6, 114.3, 9], [34.3, 108.9, 8], [1.35, 103.8, 6], [25, 121.5, 7], [-36.8, 174.8, 1.7], [61.2, -149.9, .4], [64.1, -21.9, .2],
    [21.3, -157.9, .9], [27.7, 85.3, 1.5], [59.9, 10.75, 1.1], [55.7, 12.6, 1.4], [52.2, 21, 1.8], [47.5, 19.05, 1.8], [38, 23.7, 3.2], [45.5, -73.6, 4.3], [49.3, -123.1, 2.6], [-31.95, 115.86, 2.1]
  ];

  window.WC_CITY_NAMES = ['Tokyo', 'Delhi', 'Shanghai', 'Dhaka', 'São Paulo', 'Cairo', 'Mexico City', 'Beijing', 'Mumbai', 'Osaka', 'Chongqing', 'Karachi', 'Kinshasa', 'Lagos', 'Istanbul', 'Buenos Aires', 'Kolkata', 'Manila', 'Guangzhou', 'Tianjin', 'Lahore', 'Bengaluru', 'Rio de Janeiro', 'Shenzhen', 'Moscow', 'Chennai', 'Bogotá', 'Jakarta', 'Lima', 'Paris', 'Bangkok', 'Hyderabad', 'Seoul', 'London', 'Tehran', 'Chicago', 'New York', 'Los Angeles', 'Ho Chi Minh City', 'Luanda', 'Ahmedabad', 'Kuala Lumpur', 'Hong Kong', 'Riyadh', 'Baghdad', 'Santiago', 'Madrid', 'Toronto', 'Dar es Salaam', 'Nairobi', 'Johannesburg', 'Addis Ababa', 'Sydney', 'Melbourne', 'Berlin', 'Abidjan', 'Khartoum', 'Yangon', 'Kabul', 'Dakar', 'Houston', 'Miami', 'Atlanta', 'Monterrey', 'Guadalajara', 'Caracas', 'Casablanca', 'Algiers', 'Rome', 'Milan', 'Kyiv', 'Ankara', 'Chengdu', 'Wuhan', "Xi'an", 'Singapore', 'Taipei', 'Auckland', 'Anchorage', 'Reykjavík', 'Honolulu', 'Kathmandu', 'Oslo', 'Copenhagen', 'Warsaw', 'Budapest', 'Athens', 'Montreal', 'Vancouver', 'Perth'];

  window.WC_LIGHTNING = [[9.8, -71.6], [0, 23], [27, 85], [27.5, -81], [5, 105], [-10, -55], [8, -5], [-2, 115], [-15, 132], [14, -88], [-3, 30], [20, 80], [30, -95], [-25, -55]];
  window.WC_QUAKES = [[36, 141], [-33, -72], [-3, 128], [58, -153], [36, -120], [39, 38], [32, 52], [28, 84], [17, -99], [-41, 175], [-12, -77], [12, 125], [-20, -175], [53, 159], [42, 13], [-6, 147], [14, -91], [24, 122]];
})();
