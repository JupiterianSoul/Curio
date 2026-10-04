window.SW_DATA = {
  themes: [
    { id: 'classic', name: 'Classic', c: ['#ff5a36', '#ffb400', '#2ec27e', '#1c9cf0', '#9b5de5', '#f15bb5', '#00bbf9', '#fee440', '#00c49a', '#ff8c42', '#6a4c93', '#e63946'], rim: '#2a2420', peg: '#fff', bulbs: false, ptr: '#ff5a36' },
    { id: 'gameshow', name: 'Game show', c: ['#e63946', '#f1faee', '#1d3557', '#ffb703', '#e63946', '#f1faee', '#457b9d', '#ffb703'], rim: '#7a1020', peg: '#ffd166', bulbs: true, ptr: '#ffd166' },
    { id: 'pastel', name: 'Pastel', c: ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'], rim: '#f4ece6', peg: '#ffffff', bulbs: false, ptr: '#ff8fab', light: true },
    { id: 'neon', name: 'Neon', c: ['#ff00a0', '#00f0ff', '#a0ff00', '#ffe600', '#b400ff', '#ff5e00'], rim: '#0a0a14', peg: '#00f0ff', bulbs: true, ptr: '#ff00a0', glow: true, dark: true },
    { id: 'candy', name: 'Candy', c: ['#ff6b9d', '#ffffff', '#ff6b9d', '#ffffff', '#c44569', '#ffffff'], rim: '#c44569', peg: '#fff', bulbs: false, ptr: '#c44569', stripes: true },
    { id: 'ocean', name: 'Ocean', c: ['#03045e', '#0077b6', '#00b4d8', '#48cae4', '#90e0ef', '#0096c7', '#023e8a'], rim: '#012a4a', peg: '#caf0f8', bulbs: false, ptr: '#00b4d8' },
    { id: 'sunset', name: 'Sunset', c: ['#ff4e50', '#fc913a', '#f9d423', '#ff6f91', '#c34a9c', '#845ec2'], rim: '#3b1f3b', peg: '#ffe0a3', bulbs: false, ptr: '#f9d423' },
    { id: 'forest', name: 'Forest', c: ['#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2', '#1b4332', '#d8a657'], rim: '#3e2c1c', peg: '#f2e8cf', bulbs: false, ptr: '#d8a657' },
    { id: 'mono', name: 'Mono', c: ['#111111', '#444444', '#777777', '#aaaaaa', '#dddddd', '#2b2b2b'], rim: '#000000', peg: '#ffffff', bulbs: false, ptr: '#ff5a36' },
    { id: 'gold', name: 'Casino', c: ['#0b6e4f', '#b3001b', '#111111', '#b3001b', '#111111', '#b3001b', '#111111'], rim: '#8a6d1f', peg: '#ffd700', bulbs: true, ptr: '#ffd700', gold: true },
    { id: 'rainbow', name: 'Rainbow', c: ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'], rim: '#ffffff', peg: '#222', bulbs: false, ptr: '#222', light: true },
    { id: 'retro', name: 'Retro', c: ['#e76f51', '#f4a261', '#e9c46a', '#2a9d8f', '#264653'], rim: '#264653', peg: '#e9c46a', bulbs: false, ptr: '#e76f51' }
  ],
  presets: [
    { n: 'Yes or no', e: '👍', l: ['Yes', 'No'] },
    { n: 'Magic 8', e: '🎱', l: ['It is certain', 'Without a doubt', 'Ask again later', 'Better not tell you', 'Don\'t count on it', 'Very doubtful', 'Signs point to yes', 'Outlook good', 'Cannot predict now', 'My sources say no'] },
    { n: 'Dinner', e: '🍕', l: ['Pizza', 'Sushi', 'Tacos', 'Burgers', 'Pasta', 'Curry', 'Ramen', 'Salad', 'Pho', 'Dumplings', 'Stir fry', 'Cereal (no shame)'] },
    { n: 'Dessert', e: '🍰', l: ['Ice cream', 'Brownies', 'Cheesecake', 'Fruit salad', 'Cookies', 'Churros', 'Tiramisu', 'Pancakes', 'Mochi', 'Apple pie'] },
    { n: 'Truth or dare', e: '😈', l: ['Truth *2', 'Dare *2', 'Double dare', 'Your choice'] },
    { n: 'Coin flip', e: '🪙', l: ['Heads', 'Tails'] },
    { n: 'Dice d6', e: '🎲', l: ['1', '2', '3', '4', '5', '6'] },
    { n: '1 to 10', e: '🔢', l: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    { n: 'Rock paper scissors', e: '✂️', l: ['Rock', 'Paper', 'Scissors'] },
    { n: 'Movie night', e: '🎬', l: ['Comedy', 'Horror', 'Sci-fi', 'Rom-com', 'Animated', 'Documentary', 'Action', 'A classic', 'Musical', 'Mystery'] },
    { n: 'Chores', e: '🧹', l: ['Dishes', 'Vacuum', 'Laundry', 'Take out trash', 'Water plants', 'Dust shelves', 'Clean bathroom', 'Free pass! *0.5'] },
    { n: 'Workout', e: '💪', l: ['20 push-ups', '30 squats', '1 min plank', '40 jumping jacks', '15 burpees', '20 lunges', '30 sit-ups', '2 min rest'] },
    { n: 'Weekend plan', e: '🗺️', l: ['Hike', 'Museum', 'Picnic', 'Board games', 'Movie marathon', 'Bake something', 'Visit friends', 'Bike ride', 'Do nothing, gloriously'] },
    { n: 'Board games', e: '♟️', l: ['Chess', 'Monopoly', 'Scrabble', 'Catan', 'Uno', 'Ticket to Ride', 'Codenames', 'Checkers', 'Clue', 'Jenga'] },
    { n: 'Drawing prompt', e: '🎨', l: ['A cat in a hat', 'Your dream house', 'A robot chef', 'An underwater city', 'A dragon at a picnic', 'Your shoe', 'A haunted teapot', 'A planet made of candy', 'A very tired wizard', 'Self-portrait as a vegetable'] },
    { n: 'Icebreakers', e: '🧊', l: ['Best trip ever?', 'Hidden talent?', 'Favourite snack?', 'Dream job as a kid?', 'Worst haircut?', 'Superpower of choice?', 'Last song you sang?', 'Most-used emoji?', 'Desert island book?', 'Strangest food you love?'] },
    { n: 'Planets', e: '🪐', l: ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'] },
    { n: 'Zodiac', e: '♈', l: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] },
    { n: 'Continents', e: '🌍', l: ['Africa', 'Antarctica', 'Asia', 'Australia', 'Europe', 'North America', 'South America'] },
    { n: 'Days of the week', e: '📅', l: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    { n: 'Colours', e: '🌈', l: ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet', 'Pink', 'Black', 'White'] },
    { n: 'Animals', e: '🦊', l: ['Fox', 'Otter', 'Penguin', 'Elephant', 'Octopus', 'Owl', 'Capybara', 'Red panda', 'Axolotl', 'Hedgehog', 'Sloth', 'Narwhal'] },
    { n: 'Music genre', e: '🎧', l: ['Jazz', 'Rock', 'Hip-hop', 'Classical', 'Country', 'Electronic', 'Reggae', 'Metal', 'Pop', 'Funk', 'Blues', 'K-pop'] },
    { n: 'Superpowers', e: '🦸', l: ['Flight', 'Invisibility', 'Teleportation', 'Super strength', 'Time travel', 'Mind reading', 'Talk to animals', 'Never need sleep', 'Breathe underwater', 'Instant expert at anything'] },
    { n: 'Karaoke dare', e: '🎤', l: ['A power ballad', 'A cartoon theme song', 'A song in another language', 'A duet with a stranger', 'Your parents\' favourite', 'Something from the 80s', 'A song you hate', 'Audience picks'] },
    { n: 'Study break', e: '📚', l: ['Stretch for 5 min', 'Drink water', 'Walk around the block', 'Snack time', 'Tidy your desk', 'Dance to one song', 'Call a friend', 'Back to work, champ *2'] },
    { n: 'Pizza toppings', e: '🍄', l: ['Pepperoni', 'Mushrooms', 'Pineapple', 'Olives', 'Peppers', 'Onion', 'Ham', 'Basil', 'Anchovies', 'Extra cheese', 'Jalapeños', 'Sweetcorn'] },
    { n: 'Would you rather', e: '🤔', l: ['Fly or be invisible?', 'Beach or mountains?', 'Past or future?', 'Cats or dogs?', 'Always hot or always cold?', 'No music or no movies?', 'Speak all languages or play all instruments?', 'Giant hamster or tiny elephant?'] },
    { n: 'Elements', e: '🔥', l: ['Fire', 'Water', 'Earth', 'Air', 'Lightning', 'Ice'] },
    { n: 'Prize wheel', e: '🎁', l: ['Grand prize *0.3', 'Try again *3', 'Small prize *2', 'Free hug *2', 'Lose a turn', 'Double points', 'Mystery box', 'Spin again'] }
  ],
  combos: [
    { n: 'Story starter', w: [
      { n: 'Who', l: ['A pirate', 'A grandma', 'A robot', 'A tiny dragon', 'A detective', 'Twin astronauts', 'A talking dog', 'The king'] },
      { n: 'Where', l: ['on the moon', 'in a bakery', 'under the sea', 'in a haunted castle', 'at a music festival', 'in the jungle', 'on a train', 'inside a video game'] },
      { n: 'Problem', l: ['loses a sock', 'finds a treasure map', 'must win a dance-off', 'gets very hungry', 'meets a ghost', 'forgets their own name', 'has to save the world', 'adopts a llama'] }
    ] },
    { n: 'Date night', w: [
      { n: 'Food', l: ['Italian', 'Thai', 'Mexican', 'Picnic', 'Cook together', 'Street food', 'Breakfast for dinner'] },
      { n: 'Activity', l: ['Movie', 'Mini golf', 'Stargazing', 'Board game', 'Museum', 'Karaoke', 'Long walk'] },
      { n: 'Budget', l: ['Free', '$', '$$', 'Splurge'] }
    ] },
    { n: 'Workout builder', w: [
      { n: 'Move', l: ['Squats', 'Push-ups', 'Lunges', 'Burpees', 'Sit-ups', 'Plank'] },
      { n: 'Reps', l: ['10', '15', '20', '25', '30 seconds', '1 minute'] },
      { n: 'Rounds', l: ['1', '2', '3', '4'] }
    ] }
  ],
  ach: [
    { id: 'first', i: '🎡', n: 'First spin', d: 'Spin the wheel' },
    { id: 'spins50', i: '🌀', n: 'Dizzy', d: 'Spin 50 times' },
    { id: 'flick', i: '👆', n: 'Flick of the wrist', d: 'Fling the wheel with a fast swipe' },
    { id: 'themes', i: '🎨', n: 'Interior designer', d: 'Try 5 themes' },
    { id: 'weight', i: '⚖️', n: 'Loaded dice', d: 'Give an entry extra weight' },
    { id: 'wheels', i: '🎠', n: 'Ringmaster', d: 'Have 3 wheels at once' },
    { id: 'elim', i: '🏁', n: 'Last one standing', d: 'Finish an elimination' },
    { id: 'bracket', i: '🏆', n: 'Tournament director', d: 'Crown a bracket champion' },
    { id: 'teams', i: '👥', n: 'Team captain', d: 'Split entries into teams' },
    { id: 'combo', i: '🧩', n: 'Combo platter', d: 'Spin a combo of wheels' },
    { id: 'share', i: '🔗', n: 'Pass it on', d: 'Share a wheel link' },
    { id: 'presets', i: '📦', n: 'Collector', d: 'Load 10 presets' }
  ]
};
