window.PIZZA_DATA = {
  doughs: {
    classic: { name: 'Classic', sw: '#f2d79f', rim: 1, rate: 1, tip: 'The all-rounder.' },
    thin: { name: 'Thin & crispy', sw: '#f4dcab', rim: .55, rate: 1.35, tip: 'Bakes fast, crunches loud.' },
    neapolitan: { name: 'Neapolitan', sw: '#f7e3b6', rim: 1.45, rate: 1.6, leopard: true, tip: 'Puffy rim, leopard spots, wood-fired speed.' },
    deep: { name: 'Deep dish', sw: '#ecc27a', rim: 1.7, rate: .7, deep: true, tip: 'Chicago style. Slow and tall.' },
    stuffed: { name: 'Stuffed crust', sw: '#f2d79f', rim: 1.55, rate: .95, stuffed: true, tip: 'A secret ring of cheese.' },
    sourdough: { name: 'Sourdough', sw: '#efd4a0', rim: 1.2, rate: 1.1, blisters: true, tip: 'Tangy, bubbly, blistered.' },
    wholewheat: { name: 'Wholewheat', sw: '#d9b07a', rim: 1, rate: 1, bran: true, crust: [[0, '#d9b07a'], [.6, '#c9965a'], [1, '#a8713a'], [1.4, '#6b4120'], [2.2, '#1c120b']], dough: [[0, '#e4c08e'], [.6, '#d8ab6e'], [1.1, '#b9854a'], [1.7, '#5e3a1c'], [2.2, '#2a1a0e']], tip: 'Nutty and wholesome.' },
    charcoal: { name: 'Charcoal', sw: '#3a3a3e', rim: 1.1, rate: 1, crust: [[0, '#4a4a50'], [1, '#2e2e33'], [1.6, '#1a1a1d'], [2.2, '#0a0a0b']], dough: [[0, '#56565c'], [1, '#3d3d43'], [1.6, '#202024'], [2.2, '#0d0d0e']], tip: 'Activated charcoal dough. Very dramatic.' },
    beet: { name: 'Beetroot', sw: '#d4627e', rim: 1, rate: 1, crust: [[0, '#e48aa0'], [.8, '#d4627e'], [1.2, '#a8405a'], [1.7, '#5a1e2c'], [2.2, '#1c0a0f']], dough: [[0, '#eda3b4'], [.8, '#e07f98'], [1.3, '#b04a64'], [1.8, '#4a1824'], [2.2, '#1c0a0f']], tip: 'Pink! Tastes faintly earthy.' },
    spinach: { name: 'Spinach', sw: '#8fbf6a', rim: 1, rate: 1, crust: [[0, '#a8cf86'], [.8, '#8fbf6a'], [1.2, '#6a9a44'], [1.7, '#33481d'], [2.2, '#10170a']], dough: [[0, '#bcdc9e'], [.8, '#a3cc80'], [1.3, '#79a552'], [1.8, '#2f441b'], [2.2, '#10170a']], tip: 'Green, healthy, mildly suspicious.' },
    cauli: { name: 'Cauliflower', sw: '#f3ead2', rim: .8, rate: 1.15, bran: true, crust: [[0, '#f3ead2'], [.8, '#e8d6a8'], [1.2, '#c9a463'], [1.7, '#5e4020'], [2.2, '#1c120b']], dough: [[0, '#f7f0dc'], [.8, '#efe2bb'], [1.3, '#d0ad6c'], [1.8, '#5e4020'], [2.2, '#1c120b']], tip: 'Low carb, high hopes.' }
  },
  sauces: {
    arrabbiata: { name: 'Arrabbiata', c: '#b3200f' },
    buffalo: { name: 'Buffalo', c: '#e0581f' },
    pumpkin: { name: 'Pumpkin', c: '#e8902f' },
    choc: { name: 'Chocolate', c: '#4a2614' }
  },
  cheeses: {
    goat: { name: 'Goat cheese', c: ['#ffffff', '#fbf8ee', '#e9cf94'], fine: true },
    gouda: { name: 'Smoked gouda', c: ['#f7d77c', '#f0c55a', '#c98a2e'] },
    provolone: { name: 'Provolone', c: ['#fff6dc', '#ffeab0', '#e8b45a'] },
    vegan: { name: 'Vegan', c: ['#f6ecd0', '#f0dfb2', '#d9b064'] }
  },
  orders: [
    { name: 'Margherita', who: ['👵', 'Nonna Rosa'], dough: 'neapolitan', sauce: 'tomato', cheese: 'mozz', need: ['basil'], avoid: ['pineapple'], slices: 8, note: 'Like they make it in Naples, please.' },
    { name: 'Pepperoni Classic', who: ['🧒', 'Little Timmy'], sauce: 'tomato', cheese: 'mozz', need: ['pepperoni'], max: 1, slices: 8, note: 'ONLY pepperoni. Nothing green. NOTHING GREEN.' },
    { name: 'Hawaiian', who: ['🏄', 'Kai the Surfer'], sauce: 'tomato', cheese: 'mozz', need: ['ham', 'pineapple'], note: 'Yes, pineapple. Do not judge me.' },
    { name: 'Marinara', who: ['👨‍🍳', 'Chef Marco'], sauce: 'tomato', cheese: 'none', need: ['garlic', 'basil'], note: 'No cheese at all. It is the oldest kind, you know.' },
    { name: 'Diavola', who: ['😈', 'A Spicy Gentleman'], sauce: 'arrabbiata', cheese: 'mozz', need: ['salami', 'chili'], note: 'Make it hot. Hotter than that.' },
    { name: 'Capricciosa', who: ['🎻', 'Maestro Luigi'], sauce: 'tomato', cheese: 'mozz', need: ['ham', 'mushroom', 'artichoke', 'olive'], note: 'All four, arranged with love.' },
    { name: 'Prosciutto e Rucola', who: ['🕵️', 'A Food Critic'], dough: 'thin', sauce: 'tomato', cheese: 'mozz', need: ['prosciutto', 'rocket'], note: 'Thin base. I will be taking notes.' },
    { name: 'Garden Veggie', who: ['🧘', 'Yoga Instructor Sky'], sauce: 'tomato', cheese: 'mozz', need: ['greenpepper', 'onion', 'mushroom', 'tomato'], avoid: ['pepperoni', 'ham', 'bacon', 'sausage', 'salami', 'chicken', 'prosciutto', 'meatball', 'anchovy', 'shrimp'], note: 'No meat, no fish, lots of colour.' },
    { name: 'BBQ Chicken', who: ['🤠', 'Rodeo Rita'], sauce: 'bbq', cheese: 'gouda', need: ['chicken', 'onion'], note: 'Smoky as a campfire, but not burnt.' },
    { name: 'Meat Feast', who: ['🦖', 'A Hungry T-Rex'], sauce: 'tomato', cheese: 'mozz', need: ['pepperoni', 'sausage', 'bacon', 'ham', 'meatball'], minTops: 25, note: 'MEAT. MORE MEAT.' },
    { name: 'Pesto Verde', who: ['🐸', 'Sir Ribbit'], dough: 'spinach', sauce: 'pesto', cheese: 'mozz', need: ['spinach', 'basil'], note: 'Everything green, please.' },
    { name: 'Buffalo Blue', who: ['🏈', 'Coach Brick'], sauce: 'buffalo', cheese: 'blue', need: ['chicken'], note: 'Game day special.' },
    { name: 'Breakfast Pizza', who: ['🐓', 'Rooster Ron'], sauce: 'white', cheese: 'cheddar', need: ['egg', 'bacon', 'sausage'], note: 'Breakfast, but in pizza form.' },
    { name: 'Dessert Pizza', who: ['🧁', 'Princess Sprinkles'], sauce: 'choc', cheese: 'none', need: ['strawberry', 'marshmallow', 'chocchips'], note: 'Chocolate sauce, no cheese, all the sweets.' },
    { name: 'Fig and Goat', who: ['🦢', 'Lady Featherington'], dough: 'sourdough', sauce: 'white', cheese: 'goat', need: ['fig', 'rocket'], note: 'Something elegant for the garden party.' },
    { name: 'Pizza Patata', who: ['🥔', 'Farmer Giles'], sauce: 'white', cheese: 'provolone', need: ['potato', 'garlic'], note: 'Potato on pizza. Trust the Romans.' },
    { name: 'Frutti di Mare', who: ['🧜', 'Marina the Mermaid'], sauce: 'tomato', cheese: 'none', need: ['shrimp', 'anchovy'], note: 'Seafood, no cheese. It is the rule by the sea.' },
    { name: 'Puttanesca', who: ['🎭', 'Madame Opera'], sauce: 'tomato', cheese: 'mozz', need: ['olive', 'capers', 'anchovy'], note: 'Salty and dramatic, like me.' },
    { name: 'Fiesta', who: ['🪅', 'DJ Piñata'], sauce: 'tomato', cheese: 'cheddar', need: ['jalapeno', 'corn', 'chicken', 'redpepper'], note: 'Party on a plate!' },
    { name: 'Chicago Deep Dish', who: ['🌬️', 'Windy City Walt'], dough: 'deep', sauce: 'tomato', cheese: 'mozz', need: ['sausage'], slices: 6, note: 'Deep dish, six slices, no shortcuts.' },
    { name: 'Four Cheese', who: ['🐭', 'Mr. Squeakers'], dough: 'stuffed', sauce: 'white', cheese: 'parm', need: ['ricotta', 'feta'], max: 2, note: 'Cheese. Cheese in the crust. Cheese on top. Cheese.' },
    { name: 'Autumn Harvest', who: ['🍂', 'Professor Maple'], sauce: 'pumpkin', cheese: 'goat', need: ['pear', 'onion', 'spinach'], note: 'Cozy jumper energy.' },
    { name: 'Pink Party', who: ['🦩', 'Flora Flamingo'], dough: 'beet', sauce: 'white', cheese: 'goat', need: ['fig', 'strawberry'], note: 'Make it as pink as possible.' },
    { name: 'Midnight Special', who: ['🧛', 'Count Pepperoni'], dough: 'charcoal', sauce: 'tomato', cheese: 'mozz', need: ['olive', 'pepperoni'], avoid: ['garlic'], note: 'Dark dough. And absolutely NO garlic.' },
    { name: 'Health Nut', who: ['🏃', 'Marathon Mo'], dough: 'cauli', sauce: 'tomato', cheese: 'vegan', need: ['broccoli', 'spinach', 'tomato'], note: 'Cauliflower base, vegan cheese, vegetables.' },
    { name: 'The Wizard', who: ['🧙', 'Old Wizard Gus'], dough: 'wholewheat', sauce: 'pesto', cheese: 'parm', need: ['mushroom', 'sundried', 'olive'], note: 'Ingredients of great power. And mushrooms.' }
  ]
};
