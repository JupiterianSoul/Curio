window.STIM_DATA = (() => {
  const U = (id, name, em, cost, pps, ds, col) => ({ id, name, em, cost, pps, ds, col });
  const upgrades = [
    U('dvd', 'Bouncing DVD Logo', '📀', 15, 1, 'Will it hit the corner? Nobody knows.', '#7b5cff'),
    U('lava', 'Lava Lamp', '🫧', 60, 3, 'Groovy blobs, forever rising.', '#ff7a18'),
    U('rainbow', 'Rainbow Text', '🌈', 150, 6, 'Numbers are better in every colour.', '#ff3d7f'),
    U('spin', 'Spinning Things', '🌀', 350, 12, 'Donuts, discs and lollipops. Spinning. That\'s it.', '#21b5e8'),
    U('notif', 'Notifications', '🔔', 700, 22, 'You have (1) new dopamine.', '#ffb000'),
    U('stock', 'Stock Ticker', '📈', 1300, 40, 'Line goes up. Line goes down. Line goes up.', '#1f9d55'),
    U('runner', 'Endless Runner', '🏃', 2400, 70, 'A tiny guy dodging trains, just for you.', '#e0543a'),
    U('confetti', 'Confetti Rain', '🎊', 4200, 120, 'Every day is a celebration now.', '#ff6fb5'),
    U('cube', 'Spinning Cube', '🧊', 7000, 200, 'Three whole dimensions of stimulation.', '#3498db'),
    U('news', 'Breaking News', '📰', 11000, 330, 'A ticker of urgent nonsense.', '#c0392b'),
    U('fidget', 'Fidget Spinner', '🪀', 17000, 520, 'Very retro. Very soothing.', '#2b87d1'),
    U('chat', 'Live Chat', '💬', 26000, 800, 'Strangers typing W in all caps.', '#9146ff'),
    U('money', 'Money Rain', '💸', 40000, 1200, 'Not real money. Real feelings, though.', '#2ecc71'),
    U('ads', 'Pop-up Ads', '🪟', 60000, 1800, 'Close them for a tiny reward. They come back.', '#ff5a36'),
    U('disco', 'Disco Lights', '🪩', 90000, 2700, 'Your screen is now a nightclub.', '#d63bff'),
    U('slime', 'ASMR Slime', '🟢', 135000, 4000, 'Squish. Squish. Squish.', '#7bed6b'),
    U('eq', 'Music Visualiser', '🎛️', 200000, 6000, 'Bars that bounce to music that isn\'t playing.', '#00c2ff'),
    U('ach', 'Achievement Pop-ups', '🏆', 300000, 9000, 'You are doing SO well.', '#ffc233'),
    U('pong', 'Self-Playing Pong', '🏓', 450000, 13500, 'Two paddles, zero players, endless rally.', '#ffffff'),
    U('hype', 'Hype Man', '🗣️', 680000, 20000, 'A guy who shouts encouragement.', '#ff9f00'),
    U('aquarium', 'Tiny Aquarium', '🐠', 1000000, 30000, 'Fish swim. Bubbles bubble. You watch.', '#1fb6c9'),
    U('quake', 'Earthquake Mode', '🌋', 1500000, 45000, 'Every click shakes the page.', '#a0522d'),
    U('snake', 'Self-Playing Snake', '🐍', 2300000, 68000, 'It eats. It grows. It never loses.', '#43a047'),
    U('pet', 'Virtual Pet', '🥚', 3400000, 100000, 'A blob that loves you. Pet it for bonuses.', '#ff8ac2'),
    U('clock', 'Countdown to Nothing', '⏱️', 5000000, 150000, 'Something is about to happen. It never does.', '#333333'),
    U('shorts', 'Endless Shorts', '📱', 7500000, 220000, 'Swipe. Swipe. Swipe. Swipe.', '#ff0050'),
    U('golden', 'Golden Stimulus', '✨', 11000000, 330000, 'Rare golden orbs appear. Click them. Trust me.', '#e6b800'),
    U('blocks', 'Falling Blocks', '🧱', 16000000, 480000, 'A puzzle game playing itself, flawlessly.', '#ff7043'),
    U('hypno', 'Hypno Spiral', '😵‍💫', 24000000, 720000, 'Look into the spiral. Keep clicking.', '#8e24aa'),
    U('fireworks', 'Fireworks', '🎆', 36000000, 1080000, 'A permanent New Year\'s Eve.', '#ff1744'),
    U('vhs', 'Retro Tape Filter', '📼', 54000000, 1600000, 'Everything looks like 1989 now.', '#00e5ff'),
    U('owl', 'Pushy Study Owl', '🦉', 80000000, 2400000, 'Reminds you about your streak. Constantly.', '#58cc02'),
    U('subs', 'Follower Counter', '📊', 120000000, 3600000, 'A number that only goes up. Beautiful.', '#e53935'),
    U('combo', 'Combo Meter', '🔥', 180000000, 5400000, 'Click fast to multiply every click up to x5.', '#ff6d00')
  ];
  const OUTSIDE_COST = 1000000000;
  const OVERLOAD_COST = 5000000000;

  const notifs = [
    ['Mom', 'Call me when you can'], ['Streaks', '🔥 You\'re on a 3-day streak!'], ['Weather', 'It\'s nice outside. Just saying.'],
    ['Bank', 'Your card was used at: Stimulation'], ['Group chat', '47 new messages'], ['Calendar', 'Meeting in 5 minutes (you are late)'],
    ['Fitness', 'Time to stand up! 🧍'], ['Shop', 'Your cart misses you 🛒'], ['Farm game', 'Your crops are ready 🌽'],
    ['Unknown', 'u up?'], ['News', 'Scientists discover new colour'], ['App', 'We\'ve updated our privacy policy'],
    ['Battery', '20% remaining. Plug in?'], ['Photos', 'You have a new memory from 4 years ago'], ['Delivery', 'Your parcel is 9 stops away'],
    ['Podcast', 'New episode: 3 hours on spoons'], ['Dentist', 'Reminder: floss'], ['Game', 'Your energy is full! ⚡']
  ];
  const headlines = [
    'Local person clicks button, feels something', 'Scientists confirm: more is more', 'Stimulation reaches record high',
    'Experts urge public to keep clicking', 'Grass reportedly still outside', 'Cube continues spinning, officials baffled',
    'DVD logo narrowly misses corner again', 'Man discovers second button, faints', 'Lava lamp enters 400th hour of rising',
    'Breaking: this headline is also breaking', 'Fidget spinner sets new spin record', 'Area slime declared "extremely squishy"',
    'Study finds 9 in 10 notifications unnecessary', 'Fish in tiny aquarium unaware of internet', 'Snake grows, refuses to elaborate'
  ];
  const chatNames = ['xX_clicker_Xx', 'dopamine_dan', 'mod_steve', 'cubefan99', 'grass_toucher', 'notabot', 'lava_lady', 'pog_master', 'stim_queen', 'button_boi', 'quiet_kevin', 'fidget_fiona'];
  const chatMsgs = ['W', 'W W W', 'lets gooo', 'first', 'pog', 'is this live?', 'CLICK FASTER', 'what is happening', 'L', 'the cube 😍', 'corner when', 'hi chat', 'this is so calming', 'ratio', 'GG', 'me fr', 'how is it not boring', 'big number', '🔥🔥🔥', 'no way', 'chat is this real', 'he clicked', 'can we get a W', 'too stimulating', 'go outside lol', 'wholesome', 'clip that'];
  const ads = [
    ['🧊', 'You WON a free cube!', 'Click to claim (it\'s already yours)'], ['💡', 'One weird trick', 'Buttons hate him'], ['🔥', 'HOT stims in your area', 'They want to be clicked'],
    ['⚠️', 'Your PC has 1 virus', 'It\'s just the DVD logo. It\'s fine.'], ['🎰', 'Spin to WIN!', 'You will not win'], ['🍕', 'Pizza in 30 min', 'Or it\'s free. Probably.'],
    ['🎮', 'Play now!', 'It\'s this game. You\'re playing it.'], ['📈', 'Invest in STIM', 'Number go up guaranteed*'], ['🛋️', 'New sofa?', 'You will never leave it']
  ];
  const hype = ['LET\'S GOOO!', 'YOU\'RE CRUSHING IT!', 'CLICK CLICK CLICK!', 'UNSTOPPABLE!', 'LEGENDARY!', 'WHO\'S THE BEST? YOU!', 'MORE!!!', 'I BELIEVE IN YOU!', 'ELITE CLICKING!', 'HISTORIC!', 'GENERATIONAL TALENT!', 'THAT\'S MY CLICKER!'];
  const fakeAch = ['Clicked a button', 'Existed for 10 seconds', 'Looked at a cube', 'Did not go outside', 'Blinked', 'Scrolled a little', 'Achieved an achievement', 'Stayed hydrated (unverified)', 'Noticed the DVD logo', 'Held very still', 'Breathed in', 'Breathed out', 'Sat down', 'Thought about lunch'];
  const owl = ['Don\'t forget your streak! 🦉', 'You haven\'t practised today.', 'I\'m not angry. Just disappointed.', 'One quick lesson? Please?', 'Your streak misses you.', 'I know where you live. (Just kidding.)', 'Keep it up! Or else.'];
  const shorts = [
    ['#ff0050', 'cat vs cucumber 😱', '1.2M'], ['#00c2ff', 'satisfying soap cutting', '880K'], ['#ffb000', 'rating every button', '2.4M'],
    ['#7b5cff', 'POV: you clicked', '640K'], ['#2ecc71', 'grass ASMR (no grass)', '3.1M'], ['#ff6d00', 'cube day 400', '95K'],
    ['#e91e63', 'wait for it...', '7.7M'], ['#3f51b5', 'how to go outside (tutorial)', '12'], ['#009688', 'life hack: click more', '410K']
  ];
  const petLines = ['♥', 'hehe', 'more pets', 'u r nice', '♥♥', 'bloop', '!!!', 'stim pls'];

  const achievements = [
    { id: 'c1', em: '👆', name: 'First Click', desc: 'Click the button.' },
    { id: 'c1k', em: '🖱️', name: 'Clicker', desc: 'Click 1,000 times.' },
    { id: 'c10k', em: '🦾', name: 'Iron Finger', desc: 'Click 10,000 times.' },
    { id: 'u1', em: '🛒', name: 'Consumer', desc: 'Buy your first upgrade.' },
    { id: 'u10', em: '🛍️', name: 'Shopaholic', desc: 'Own 10 upgrades.' },
    { id: 'u20', em: '🧠', name: 'Overstimulated', desc: 'Own 20 upgrades.' },
    { id: 'uall', em: '🌌', name: 'Everything At Once', desc: 'Own every upgrade.' },
    { id: 'corner', em: '📀', name: 'THE CORNER', desc: 'See the DVD logo hit a corner.' },
    { id: 'gold', em: '✨', name: 'Midas Touch', desc: 'Catch a golden stimulus.' },
    { id: 'combo', em: '🔥', name: 'On Fire', desc: 'Reach a x5 combo.' },
    { id: 'ads', em: '❌', name: 'Ad Blocker', desc: 'Close 10 pop-up ads.' },
    { id: 'pet', em: '🥰', name: 'Good Blob', desc: 'Pet the virtual pet 25 times.' },
    { id: 'm1', em: '💰', name: 'Millionaire', desc: 'Earn 1,000,000 stimulation in one run.' },
    { id: 'b1', em: '🏦', name: 'Billionaire', desc: 'Earn 1,000,000,000 stimulation in one run.' },
    { id: 'grass', em: '🌳', name: 'Touched Grass', desc: 'Go outside.' },
    { id: 'over', em: '🤯', name: 'Overload', desc: 'Reach maximum stimulation.' },
    { id: 'fast', em: '⏱️', name: 'Speedrunner', desc: 'Finish a run in under 25 minutes.' },
    { id: 'auto25', em: '🤖', name: 'Automation', desc: 'Own 25 auto-clickers.' }
  ];

  return { upgrades, OUTSIDE_COST, OVERLOAD_COST, notifs, headlines, chatNames, chatMsgs, ads, hype, fakeAch, owl, shorts, petLines, achievements };
})();
