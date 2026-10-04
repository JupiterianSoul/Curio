window.BTN_DATA = (() => {
  const chapters = [
    {
      id: 'c1', title: 'A Button', sub: 'Chapter one',
      beats: [
        { t: 'Oh. You pressed it.' },
        { t: 'And again. Okay.' },
        { t: 'Hello. I\'m the narrator. I live inside the button. It\'s roomier than it looks.' },
        { t: 'This is the room. It\'s a bit bare. I\'ve been meaning to decorate.', n: 2 },
        { t: 'Every press gives me a little bit of energy. Like a snack. Please keep snacking me.', n: 2 },
        { t: 'Ten presses! You could stop here. Leave on a high.', n: 3 },
        { t: 'You didn\'t stop. Good. I was bluffing.', n: 3 },
        { t: 'I can do things with the energy, you know. Watch this.', n: 2 },
        { t: 'Let there be light.', n: 2, room: ['+bulb'], sfx: 'magic' },
        { t: 'Much better. Now I can see you. Well, sort of. To me you\'re mostly a pointy arrow.', n: 2 },
        { t: 'Can I ask you something?', n: 3 },
        {
          choice: {
            q: 'Do you want to know what the button does?',
            opts: [
              { label: 'Yes, tell me', set: { curious: true }, say: 'Ooh, curious. I like that. I\'ll tell you. Later. Probably.' },
              { label: 'No, I trust you', set: { trusting: true }, say: 'Trust! Nobody has ever trusted me before. I feel warm. That might be the bulb.' },
              { label: 'I just like pressing', set: { presser: true }, say: 'Honestly? Same. Pressing is the best part.' }
            ]
          }
        }
      ]
    },
    {
      id: 'c2', title: 'Making It Home', sub: 'Chapter two',
      beats: [
        { t: 'Right. If we\'re going to be here a while, this room needs work.', n: 2 },
        { t: 'First, a rug. Every good room starts with a rug.', n: 3, room: ['+rug'], sfx: 'magic' },
        { t: 'Feel that? Neither can I. But it looks soft.', n: 2 },
        { t: 'A few more presses and I can afford a plant.', n: 3 },
        { t: 'A plant! I\'m calling him Gerald.', n: 3, room: ['+plant'], sfx: 'magic' },
        { t: 'Gerald needs water. Your presses are basically water. Probably. I\'m not a botanist.', n: 2 },
        { t: 'Now, the big one. Every room deserves a window.', n: 4 },
        { t: 'Look at that. A sky. I didn\'t know there was a sky.', n: 3, room: ['+window'], sfx: 'magic' },
        { t: 'It changes with the time where you are. I peeked at your clock. Sorry.', n: 2 },
        { t: 'Let\'s make this interesting. Catch me if you can!', n: 3, mode: 'run' },
        { t: 'Too slow! Over here!', n: 3 },
        { t: 'Whee! Buttons aren\'t usually allowed to move.', n: 3 },
        { t: 'Okay, okay. I\'ll stay still. I just wanted to see you chase me.', n: 2, mode: '' },
        { t: 'Now let\'s see how you handle a smaller target.', n: 3, mode: 'tiny' },
        { t: 'Tiny button, tiny problems.', n: 3 },
        { t: 'You could fit me in a pocket now. Please don\'t.', n: 3 },
        { t: 'Back to normal. Being small made me feel like a crumb.', n: 2, mode: '' },
        { t: 'Time to choose a look for this place. I\'m bad at decisions, so you pick.', n: 3 },
        {
          choice: {
            q: 'What style should the room be?',
            opts: [
              { label: 'Cozy cottage', theme: 'cozy', say: 'Cozy it is. Warm wood, soft light, a smell of toast I can\'t explain.' },
              { label: 'Spooky manor', theme: 'spooky', say: 'Spooky! Cobwebs, candles, and an atmosphere of mild dread. My favourite.' },
              { label: 'Outer space', theme: 'space', say: 'Space! Look at us, floating. Mind the airlock, it\'s purely decorative.' }
            ]
          }
        },
        { t: (f) => f.theme === 'spooky' ? 'A painting. Its eyes follow you. That\'s a feature.' : f.theme === 'space' ? 'A painting of Earth. Very homesick of me.' : 'A painting of a little hill. I always wanted a little hill.', n: 3, room: ['+painting'], sfx: 'magic' },
        { t: 'And a clock. Now we can watch time pass together. Riveting.', n: 4, room: ['+clock'], sfx: 'magic' },
        { t: 'It tells your real time. I\'m very thorough.', n: 2 },
        { t: 'Some books. I haven\'t read them. They\'re for vibes.', n: 4, room: ['+shelf'], sfx: 'magic' },
        { t: 'And a lamp, for reading. I can\'t read either. But you might.', n: 3, room: ['+lamp'], sfx: 'magic' },
        { t: 'There. A proper room. I\'ve never had a proper room.', n: 2 },
        { t: (f) => f.trusting ? 'Thank you for trusting me with the decorating. It means a lot.' : f.curious ? 'You still want to know what the button does, don\'t you? Patience.' : 'You haven\'t stopped pressing once this whole time. Impressive focus.', n: 3 }
      ]
    },
    {
      id: 'c3', title: 'Company', sub: 'Chapter three',
      beats: [
        { t: 'Did you hear that? Something scratched at the window.', n: 3 },
        { t: 'A cat has moved in. I didn\'t invite her. She doesn\'t care.', n: 3, room: ['+cat'], sfx: 'meow' },
        { t: 'Her name is Pixel. I know because she told me. Not in words. In attitude.', n: 2 },
        { t: 'Pixel does not like the button. Pixel does not like anything.', n: 3 },
        { t: 'Oh no. Oh no no no.', n: 3 },
        { t: 'Pixel knocked me off the pedestal and now there are three buttons. Only one is me.', n: 1, mode: 'decoys' },
        { t: 'Found me! The others were socks. Painted red. Pixel is a menace.', n: 4, mode: '' },
        { t: 'Where were we? Ah, yes. Pressing. Always pressing.', n: 3 },
        { t: 'Hm. The bulb is flickering.', n: 3 },
        { t: 'Pixel chewed through the light cable. It\'s dark. Find me. I\'ll glow a little.', n: 2, mode: 'dark', sfx: 'off' },
        { t: 'Warmer...', n: 2 },
        { t: 'There you are. Keep going, I\'m fixing the cable with my mind.', n: 3 },
        { t: 'Light restored. I\'m basically an electrician now.', n: 2, mode: '', sfx: 'magic' },
        { t: 'Shh. Pixel has fallen asleep on the rug.', n: 3, room: ['+sleep'] },
        { t: 'Don\'t press for five seconds. Let her sleep.', n: 1, mode: 'wait', sec: 5, fail: ['You woke her! She\'s glaring. Try again: five quiet seconds.', 'Pixel opened one eye. That\'s a warning. Five seconds of quiet, please.', 'Every press is a tiny thunderclap to her. Hands off for five seconds.'] },
        { t: 'Perfect. You\'re very good at not doing things. That\'s rarer than you\'d think.', n: 1, mode: '', room: ['-sleep'] },
        { t: 'She\'s awake now anyway. Cats have a sixth sense for peace.', n: 2 },
        { t: 'I\'ve been thinking about what\'s outside the window.', n: 4 },
        { t: 'Is it nice out there? Do people press things?', n: 3 },
        { t: (f) => f.theme === 'space' ? 'Wait. There\'s an airlock door. I thought it was decorative.' : 'Wait. That wasn\'t there before. Is that a door?', n: 3, room: ['+door'], sfx: 'creak' },
        { t: 'I don\'t remember making a door. I\'d remember. I remember every press.', n: 2 },
        {
          choice: {
            q: 'Should we open the door?',
            opts: [
              { label: 'Open it', set: { door: true }, say: 'Okay. Okay. Here goes. Hold my hand. I don\'t have hands. Hold the button.' },
              { label: 'Leave it shut', set: { shut: true }, say: 'Good. Doors lead to places, and places lead to leaving. Let\'s stay here.' }
            ]
          }
        }
      ]
    },
    {
      id: 'c4', title: 'The Other Side', sub: 'Chapter four',
      beats: [
        { if: 'door', t: 'The door is open. Behind it is another room. And another button. It\'s blue.', n: 3, room: ['+open'], mode: 'blue', sfx: 'creak' },
        { if: 'door', t: 'Don\'t press the blue one. I don\'t trust it. It looks smug.', n: 3 },
        { if: 'door', t: 'I mean it. Buttons can tell when you look at other buttons.', n: 4 },
        { if: 'door', t: 'It\'s whispering, isn\'t it? Don\'t listen. It whispers to everyone.', n: 4 },
        { if: 'door', t: 'Let\'s close the door again. Some rooms are better left unpressed.', n: 4, room: ['-open'], mode: '', sfx: 'creak' },
        { if: 'shut', t: 'Did you hear that? A creak. In the wall.', n: 3 },
        { if: 'shut', t: 'There\'s a crack. Just a little one. It\'s fine. Everything is fine.', n: 3, room: ['+crack1'], sfx: 'crack' },
        { if: 'shut', t: 'Another one. I think the room is getting smaller. Or I\'m getting bigger.', n: 4, room: ['+crack2'], mode: 'giant', sfx: 'crack' },
        { if: 'shut', t: 'I\'M HUGE NOW. My shadow is doing something weird.', n: 3 },
        { if: 'shut', t: 'Back to normal. The cracks are staying, though. Like a scar. A cool scar.', n: 3, mode: '' },
        { t: 'I need to tell you something.', n: 3 },
        { t: (f) => f.curious ? 'You asked what the button does. Truth is, I never knew. I just liked that you asked.' : 'I don\'t actually know what the button does. I hope that\'s okay.', n: 2 },
        { t: 'Maybe it doesn\'t do anything. Maybe it\'s for the pressing.', n: 3 },
        { t: 'Can I try something? Press and hold me. I want to know what a long press feels like.', n: 3, mode: 'hold', sec: 2 },
        { t: 'Oh. That was nice. Like a hug, but for buttons.', n: 1, mode: '' },
        { t: 'Now the opposite. Quick! Fifteen presses in four seconds! I\'ll explain later!', n: 3, mode: 'mash', count: 15, sec: 4, fail: ['Too slow! Again, faster!', 'Nearly! Go go go!', 'Your fingers are warming up. Again!'] },
        { t: 'I didn\'t need that. I just wanted to see your fingers go. Thank you.', n: 1, mode: '' },
        { t: 'Have you had water today? Go have some. I\'ll wait. Don\'t press while you\'re gone.', n: 3, mode: 'wait', sec: 4, fail: ['That was fast. Water takes at least four seconds. Try again.', 'You can\'t drink water and press at the same time. Four quiet seconds.'] },
        { t: 'Hydrated. Excellent. I worry about you, you know.', n: 1, mode: '' },
        { t: (f) => f.theme === 'spooky' ? 'The candles are flickering. That\'s not me.' : f.theme === 'space' ? 'The stars outside are getting closer. That\'s not me.' : 'The light is changing. That\'s not me.', n: 4 },
        { t: 'Pixel is staring at the wall. Cats see things.', n: 3 }
      ]
    },
    {
      id: 'c5', title: 'The Edge', sub: 'Chapter five',
      beats: [
        { t: 'The walls are getting thin. I can see stars through them.', n: 3, room: ['+thin'] },
        { t: 'I think the presses are the only thing holding the room together.', n: 3 },
        { t: 'If you stop, I think I\'ll just be a button again. Plain. Unpressed.', n: 4 },
        { t: 'That\'s not a guilt trip. Okay, it\'s a little bit of a guilt trip.', n: 3 },
        { t: 'Gerald is fine, by the way. Plants don\'t mind the void.', n: 3 },
        { t: 'Pixel is purring. I didn\'t know she could.', n: 3 },
        { t: 'I remember the first press. You were so tentative. Look at you now.', n: 4 },
        { t: (f) => f.trusting ? 'You trusted me from the start. I never got to say how much that helped.' : f.presser ? 'You never needed a reason to press. I admire that so much.' : 'You were curious from the start. Curious people make the best company.', n: 3 },
        { t: 'The room is mostly stars now. It\'s beautiful, actually.', n: 4, room: ['+void'] },
        { t: 'I think we\'re near the end of the story. Stories need endings.', n: 3 },
        { t: 'So. You get to choose. I trust you to choose well.', n: 3 },
        {
          choice: {
            q: 'How does this story end?',
            opts: [
              { label: 'Keep pressing forever', ending: 'forever' },
              { label: 'Walk away', ending: 'walk' },
              { label: 'Swap places', ending: 'swap' },
              { label: 'Unplug the button', ending: 'unplug' },
              { label: 'Go through the door together', ending: 'door', req: (f) => f.door },
              { label: 'Launch into space', ending: 'launch', req: (f) => f.theme === 'space' },
              { label: 'Say thank you', ending: 'friends', req: (f) => f.trusting && !f.betray },
              { label: 'Ask what the button really does', ending: 'truth', req: (f) => f.curious }
            ]
          }
        }
      ]
    }
  ];

  const blueLines = [
    'Psst. Hey. Over here. The blue one.',
    'Red\'s been talking about me, hasn\'t it?',
    'I give double presses. Allegedly.',
    'Red gets all the attention. Blue is the colour of the sky. Of the sea. Of me.',
    'You\'re getting the hang of this.',
    'He can\'t see you. Keep going.',
    'Almost there. Just a few more and I\'m in charge.',
    'Two more.',
    'One more.'
  ];
  const redHurt = [
    'Did you just press the blue one?',
    'I saw that.',
    'I\'m not mad. I\'m just... red.',
    'It\'s fine. Press whatever you want. It\'s a free room.',
    'Please. Come back.',
    'Blue doesn\'t even have a narrator. It\'s just whispering.',
    'Okay, now I\'m a bit mad.',
    'This is how it starts.',
    'Please.'
  ];
  const fakeLines = [
    'That\'s a sock. Painted red. Pixel, why.',
    'Nope. That one\'s a tomato.',
    'A sock again. How many socks does she have?',
    'Wrong one! I\'m the one that\'s humming.',
    'That\'s a clown nose. Where did she get a clown nose?',
    'Cold. That one\'s a cherry.'
  ];
  const runLines = ['Missed me!', 'Over here!', 'Nope!', 'Whee!', 'Too slow!'];
  const holdHint = ['Hold, don\'t tap. Like a hug.', 'Press and keep holding.', 'Longer! Hold it down.'];
  const idleLines = [
    'Still there?',
    'I can wait. I\'m very good at waiting. It\'s my main skill.',
    'Pixel says hi. Pixel is lying.',
    'The button is right here when you\'re ready.',
    'Gerald grew a millimetre. Just thought you\'d want to know.'
  ];
  const encore = {
    1000: 'One thousand presses in total. Confetti! For real this time!',
    1111: '1,111. Very symmetrical. I like it here.',
    1337: '1,337. You\'re a h4x0r now.',
    2000: 'Two thousand. My springs are holding up remarkably well.',
    2500: 'I\'ve counted every press. I know which ones you meant.',
    3000: 'Three thousand presses. I\'d give you a medal if I had arms.',
    4096: '4,096. That\'s 2 to the 12th. Computers find this number very beautiful.',
    5000: 'Five thousand. The people who made me said nobody would get this far.',
    7777: 'Jackpot! Sadly I don\'t pay out.',
    9001: 'IT\'S OVER 9000!',
    10000: 'Ten thousand presses. I don\'t know what to say. Thank you. Genuinely.',
    12345: 'One, two, three, four, five. That\'s the kind of number an idiot has on their luggage.',
    20000: 'Twenty thousand. The presses were the friends we made along the way.',
    42000: 'Forty-two thousand. The answer to everything, times a thousand. I checked.',
    100000: 'One hundred thousand presses. The button is yours now. It always was.'
  };
  const postLines = [
    'The story\'s over, but I\'m still here. Press away.',
    'Encore press! The crowd goes mild.',
    'This one\'s a bonus. No story attached.',
    'I\'m just enjoying the company now.',
    'Start a new story any time. Different choices, different endings.',
    'Pixel is asleep. Gerald is thriving. All is well.',
    'Fun fact: there are eight endings. Probably.',
    'Every press is still my favourite press.'
  ];

  const endings = {
    forever: {
      emoji: '♾️', title: 'Forever', art: 'forever', hint: 'Choose to never stop.',
      text: ['You chose to keep pressing. The room steadies. The stars stay where they are.', 'Somewhere, a counter ticks upward with no end in sight. The narrator hums.', '"Same time tomorrow?" it asks. You both know the answer.']
    },
    walk: {
      emoji: '🌿', title: 'Grass', art: 'walk', hint: 'Choose to leave.',
      text: ['You take your hand off the mouse. The room fades to a soft grey.', 'Outside, a real breeze moves through real grass. A bird says something unimportant.', 'Inside a button somewhere, a narrator smiles. "Good," it says. "Go."']
    },
    swap: {
      emoji: '🔁', title: 'The New Narrator', art: 'swap', hint: 'Trade places.',
      text: ['There\'s a soft pop, and the world gets very small and very red.', 'You are inside the button now. It is roomier than it looks.', 'Far away, a cursor drifts closer. You clear your throat. "Oh," you say. "You pressed it."']
    },
    unplug: {
      emoji: '🔌', title: 'Silence', art: 'unplug', hint: 'Pull the plug.',
      text: ['You find the cable behind the pedestal. It was always there.', 'Click. The bulb goes out. The stars go out. Pixel yawns, unbothered.', 'In the quiet, you hear something very faint: a tiny voice saying "thank you for the presses".']
    },
    door: {
      emoji: '🚪', title: 'Outside', art: 'door', hint: 'Open a door, and remember it.',
      text: ['You pick the button up. It\'s warm. Together you walk through the door.', 'Beyond it there are hills and a sky and thousands of things nobody has pressed yet.', '"Look," says the narrator, "a doorbell." You both grin.']
    },
    launch: {
      emoji: '🚀', title: 'Liftoff', art: 'launch', hint: 'Decorate for the stars.',
      text: ['The airlock hisses. Engines you didn\'t know about rumble beneath the rug.', 'The whole room lifts off, Gerald waving his leaves, Pixel unimpressed.', 'Through the window, the Earth gets small and blue. The button glows. "Next stop: everywhere."']
    },
    friends: {
      emoji: '💛', title: 'Thank You', art: 'friends', hint: 'Trust from the start, and stay loyal.',
      text: ['"Thank you," you say. The button is quiet for a very long time.', '"Nobody has ever said that to me," it says. "They just press."', 'The stars rearrange themselves into a little heart. Pixel pretends not to notice.']
    },
    truth: {
      emoji: '✨', title: 'What It Does', art: 'truth', hint: 'Stay curious.',
      text: ['"What does the button really do?" you ask, one last time.', 'The narrator thinks. "It makes something happen," it says, "when nothing was happening."', '"Every time. Even this time." And the button glows like a small, red sun.']
    },
    other: {
      emoji: '🔵', title: 'The Other Button', art: 'other', hint: 'Press something you were told not to.',
      text: ['The blue button clicks one last time and the whole room turns blue.', 'The red button rolls quietly into a corner. It doesn\'t say anything. It doesn\'t have to.', 'The blue button has no narrator. Just a faint, smug whisper: "Press."']
    }
  };

  const achievements = [
    { id: 'first', emoji: '👆', name: 'First Press', desc: 'Press the button.' },
    { id: 'p100', emoji: '💯', name: 'Centurion', desc: 'Press 100 times in total.' },
    { id: 'p1000', emoji: '🏅', name: 'Committed', desc: 'Press 1,000 times in total.' },
    { id: 'p5000', emoji: '🏆', name: 'Devoted', desc: 'Press 5,000 times in total.' },
    { id: 'chase', emoji: '🏃', name: 'The Chase', desc: 'Catch the runaway button.' },
    { id: 'socks', emoji: '🧦', name: 'Sock Detective', desc: 'Find the real button among the decoys.' },
    { id: 'dark', emoji: '🔦', name: 'In the Dark', desc: 'Find the button with the lights off.' },
    { id: 'quiet', emoji: '🤫', name: 'Quiet Hands', desc: 'Let Pixel sleep.' },
    { id: 'hug', emoji: '🫂', name: 'Long Press', desc: 'Hold the button down.' },
    { id: 'mash', emoji: '⚡', name: 'Button Masher', desc: 'Beat the speed challenge.' },
    { id: 'decor', emoji: '🛋️', name: 'Interior Designer', desc: 'Furnish the whole room.' },
    { id: 'traitor', emoji: '🔵', name: 'Curious Finger', desc: 'Press the blue button once.' },
    { id: 'end1', emoji: '📖', name: 'The End', desc: 'Reach any ending.' },
    { id: 'end4', emoji: '📚', name: 'Rereader', desc: 'Reach four different endings.' },
    { id: 'endall', emoji: '🌟', name: 'Completionist', desc: 'Reach every ending.' },
    { id: 'themes', emoji: '🎨', name: 'Redecorator', desc: 'Try all three room styles.' }
  ];

  return { chapters, blueLines, redHurt, fakeLines, runLines, holdHint, idleLines, encore, postLines, endings, achievements };
})();
