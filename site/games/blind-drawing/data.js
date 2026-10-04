window.BLIND_DATA = {
  prompts: [
    ['🐘', 'an elephant'], ['🚲', 'a bicycle'], ['🐱', 'a cat'], ['🏠', 'a house with a garden'], ['🦒', 'a giraffe'], ['🐙', 'an octopus'],
    ['🚀', 'a rocket going to the moon'], ['🦆', 'a duck'], ['🧛', 'a vampire'], ['🍕', 'a pizza'], ['🐧', 'a penguin on ice'], ['🦕', 'a dinosaur'],
    ['🌳', 'a tree with a swing'], ['🚗', 'a car'], ['🐌', 'a snail'], ['☕', 'a cup of coffee'], ['🏰', 'a castle'], ['🐶', 'a dog chasing its tail'],
    ['🦋', 'a butterfly'], ['🎸', 'a guitar'], ['🐢', 'a turtle'], ['🌋', 'a volcano'], ['🧜', 'a mermaid'], ['🦄', 'a unicorn'],
    ['🤖', 'a robot'], ['🐝', 'a bee'], ['🎂', 'a birthday cake'], ['🦀', 'a crab'], ['⛄', 'a snowman'], ['🐴', 'a horse'],
    ['🦉', 'an owl'], ['🚂', 'a train'], ['🦁', 'a lion'], ['🐸', 'a frog on a lily pad'], ['🧙', 'a wizard'], ['🏄', 'a surfer'],
    ['🐳', 'a whale'], ['🌻', 'a sunflower'], ['🚁', 'a helicopter'], ['🐓', 'a chicken'], ['🦔', 'a hedgehog'], ['🪐', 'Saturn'],
    ['👽', 'an alien'], ['🦩', 'a flamingo'], ['🗽', 'the Statue of Liberty'], ['🐷', 'a pig'], ['🍔', 'a burger'], ['🏝️', 'a desert island'],
    ['🐉', 'a dragon'], ['🛸', 'a flying saucer'], ['🦈', 'a shark'], ['🐨', 'a koala'], ['🎅', 'Santa'], ['🧸', 'a teddy bear'],
    ['🐿️', 'a squirrel'], ['🍦', 'an ice cream cone'], ['🦓', 'a zebra'], ['🙃', 'yourself'], ['👨‍🍳', 'a chef'], ['🐒', 'a monkey'],
    ['🦘', 'a kangaroo'], ['🐊', 'a crocodile'], ['🦥', 'a sloth'], ['🦦', 'an otter'], ['🐫', 'a camel'], ['🦚', 'a peacock'],
    ['🐞', 'a ladybird'], ['🕷️', 'a spider in its web'], ['🐬', 'a dolphin jumping'], ['🦭', 'a seal with a ball'], ['🐼', 'a panda eating bamboo'], ['🦊', 'a fox'],
    ['🐻', 'a bear catching a fish'], ['🐭', 'a mouse with cheese'], ['🐄', 'a cow'], ['🐑', 'a sheep'], ['🦙', 'a llama'], ['🦜', 'a parrot'],
    ['🦞', 'a lobster'], ['🐍', 'a snake'], ['🐇', 'a rabbit in a hat'], ['🦇', 'a bat'], ['🐟', 'a fish in a bowl'], ['🦢', 'a swan'],
    ['🚜', 'a tractor'], ['🚒', 'a fire engine'], ['⛵', 'a sailboat'], ['✈️', 'an aeroplane'], ['🛵', 'a scooter'], ['🚌', 'a double-decker bus'],
    ['🎡', 'a Ferris wheel'], ['🎢', 'a roller coaster'], ['🗼', 'the Eiffel Tower'], ['🌉', 'a bridge'], ['🏟️', 'a stadium'], ['⛺', 'a tent by a campfire'],
    ['🧁', 'a cupcake'], ['🍩', 'a doughnut'], ['🌮', 'a taco'], ['🍉', 'a watermelon slice'], ['🍍', 'a pineapple'], ['🥕', 'a carrot'],
    ['🍌', 'a banana'], ['🍓', 'a strawberry'], ['🥨', 'a pretzel'], ['🍳', 'a frying pan with an egg'], ['🫖', 'a teapot'], ['🍝', 'a bowl of spaghetti'],
    ['🎹', 'a piano'], ['🥁', 'a drum kit'], ['🎺', 'a trumpet'], ['🎻', 'a violin'], ['📷', 'a camera'], ['💡', 'a light bulb'],
    ['⏰', 'an alarm clock'], ['🕶️', 'sunglasses'], ['👟', 'a trainer'], ['🎩', 'a top hat'], ['👑', 'a crown'], ['☂️', 'an umbrella'],
    ['🪑', 'a chair'], ['🛁', 'a bathtub with bubbles'], ['🛏️', 'a bed'], ['🚪', 'a front door'], ['🪴', 'a potted plant'], ['📚', 'a pile of books'],
    ['🌈', 'a rainbow over hills'], ['🌊', 'a big wave'], ['⛰️', 'a mountain range'], ['🌙', 'the moon and stars'], ['☀️', 'a sunny day'], ['⛈️', 'a thunderstorm'],
    ['🧑‍🚀', 'an astronaut'], ['🥷', 'a ninja'], ['🧚', 'a fairy'], ['🧞', 'a genie'], ['🧟', 'a zombie'], ['🤡', 'a clown'],
    ['👻', 'a ghost'], ['🦸', 'a superhero'], ['🏴‍☠️', 'a pirate ship'], ['🧝', 'an elf'], ['👸', 'a princess'], ['🤴', 'a king on a throne'],
    ['🏀', 'someone playing basketball'], ['🚴', 'someone riding a bike'], ['⛷️', 'a skier'], ['🏊', 'a swimmer'], ['🧘', 'someone doing yoga'], ['💃', 'a dancer'],
    ['🎪', 'a circus tent'], ['🎠', 'a carousel horse'], ['🎃', 'a jack-o-lantern'], ['🎄', 'a Christmas tree'], ['🎁', 'a present with a bow'], ['🎈', 'a bunch of balloons']
  ],
  twists: [
    { id: 'other', icon: '🤚', text: 'Use your other hand!' },
    { id: 'one', icon: '➰', text: 'One single stroke only', limit: 1 },
    { id: 'five', icon: '✋', text: 'Five strokes maximum', limit: 5 },
    { id: 'upside', icon: '🙃', text: 'Draw it upside down', flip: true },
    { id: 'sprint', icon: '⚡', text: '10 second sprint', time: 10 },
    { id: 'tail', icon: '🐾', text: 'Start from the bottom and work up' },
    { id: 'big', icon: '🔍', text: 'Fill the whole curtain' },
    { id: 'tiny', icon: '🐜', text: 'Make it really tiny' },
    { id: 'slow', icon: '🐢', text: 'Draw as slowly as you can' },
    { id: 'shut', icon: '🙈', text: 'Close your eyes too' }
  ],
  judges: [['🧐', 'The Critic'], ['👵', 'Grandma'], ['🐶', 'The Dog'], ['🎨', 'Art Teacher'], ['🤖', 'Robot Judge'], ['👶', 'A Toddler'], ['🦉', 'Professor Owl'], ['🐱', 'A Cat']],
  judgeLines: {
    high: ['Magnifique!', 'I am crying.', 'Frame it!', 'Woof! (very good)', 'Calculating... superb.', 'Again! Again!', 'A triumph of confidence.', 'Purrfect.'],
    mid: ['It has something.', 'Lovely, dear.', 'Woof?', 'Solid effort.', 'Acceptable output.', 'Ooh, lines!', 'Hoo, interesting.', 'I shall sit on it.'],
    low: ['Hmm.', 'I love it anyway.', 'Sniffs it, walks off.', 'See me after class.', 'Error: subject not found.', 'Mine now.', 'Hoo... what?', 'Knocks it off the table.']
  }
};
