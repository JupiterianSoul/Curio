window.SKETCH_VOICES = {
  cop: { name: 'Officer Duffy', role: 'first on the scene', emoji: '👮', tint: '#4a7bd0', pitch: 520 },
  gran: { name: 'Nana Ethel', role: 'nervous grandma', emoji: '👵', tint: '#c06c9c', pitch: 760 },
  kid: { name: 'Tyler, age 4', role: 'very reliable', emoji: '🧒', tint: '#f2a92b', pitch: 940 },
  pirate: { name: "Cap'n Barnacle", role: 'retired pirate', emoji: '🦜', tint: '#8a5a3b', pitch: 300 },
  conspiracy: { name: 'Dale', role: 'does his own research', emoji: '🛸', tint: '#3f9e5a', pitch: 610 },
  critic: { name: 'Pierre Lacroix', role: 'art critic', emoji: '🧐', tint: '#8e5bd6', pitch: 460 },
  poet: { name: 'Percival', role: 'poet, unfortunately', emoji: '🪶', tint: '#22a3a3', pitch: 500 },
  dog: { name: 'Biscuit', role: 'a dog, translated', emoji: '🐕', tint: '#b07a3c', pitch: 380 },
  influencer: { name: 'Kayleigh', role: 'influencer, 12 followers', emoji: '🤳', tint: '#e8508a', pitch: 840 },
  surfer: { name: 'Brody', role: 'surfer, was there, dude', emoji: '🏄', tint: '#1f9fd0', pitch: 420 },
  robot: { name: 'UNIT-7', role: 'security robot', emoji: '🤖', tint: '#6d7a85', pitch: 1000 },
  chef: { name: 'Chef Gaston', role: 'furious chef', emoji: '👨‍🍳', tint: '#d64545', pitch: 540 },
  sports: { name: 'Rick', role: 'sportscaster, off duty', emoji: '🎙️', tint: '#e67e22', pitch: 580 },
  ghost: { name: 'The Library Ghost', role: 'deceased, observant', emoji: '👻', tint: '#7f8ea3', pitch: 340 },
  tourist: { name: 'Gunther', role: 'tourist with camera', emoji: '📸', tint: '#16a085', pitch: 470 }
};

window.SKETCH_CASES = [
  { name: 'The Cookie Bandit', crime: 'Took the last cookie from the jar. Did not ask. Did not share.', spec: 'head:round skin:2 hair:short hc:brown brows:normal eyes:dot nose:button mouth:smile ears:normal shirt:red', w: [
    ['cop', 'Round face, short brown hair, two little dot eyes. Smiled the entire time, which frankly felt personal.'],
    ['gran', 'Oh, his face was round as a dinner plate! Normal ears, normal eyebrows, a lovely boy. Except for the crime.'],
    ['kid', 'He had a button nose. A tiny one. And a RED shirt. Can I have a cookie now?']] },
  { name: 'Sir Twirlsalot', crime: "Tickled the museum's T. rex without a permit.", spec: 'head:oval skin:1 hair:none hc:black brows:thick eyes:round nose:big mouth:flat ears:big fh:handlebar shirt:gray', w: [
    ['pirate', "Arr, bald as a cannonball, he was! And a black mustache curlin' up at both ends like a ship's riggin'."],
    ['critic', 'Thick, confident eyebrows. Round, staring eyes. A nose of considerable generosity. Bold, if dated.'],
    ['kid', 'His ears were SO big. Like an elephant. No, TWO elephants.'],
    ['cop', 'Mouth was a flat line under the mustache. Did not laugh at a single one of my jokes. Gray shirt.']] },
  { name: 'The Cone Ranger', crime: "Redirected the entire city's traffic into one parking lot.", spec: 'head:long skin:3 hair:none hat:cone brows:raised eyes:wide nose:long mouth:open ears:normal shirt:orange', w: [
    ['conspiracy', 'He wore a traffic cone. On his HEAD. Do you know what cones really are? Antennas. Think about it.'],
    ['gran', 'Such a long face, dear, like a horse that just heard bad news. And his mouth hanging wide open!'],
    ['surfer', 'Dude had huge eyes, like totally stoked eyes, eyebrows way up. Super long nose, too.'],
    ['kid', 'He had a party hat! An orange one with stripes!'],
    ['cop', 'For the record, it was a traffic cone, not a party hat. Orange shirt to match. Really committed to the bit.']] },
  { name: 'Granny Smith (No Relation)', crime: 'Swapped every apple in the market for a slightly worse apple.', spec: 'head:oval skin:1 hair:bun hc:gray brows:normal eyes:dot nose:button mouth:smirk ears:small gl:round marks:wrinkles acc:pearls shirt:purple', w: [
    ['gran', 'Well I never! Gray hair up in a bun, just like mine. I want it on the record that I was at bingo.'],
    ['critic', 'Round spectacles. A smirk of quiet menace. Pearls. A purple blouse. A very baroque villain.'],
    ['dog', 'Woof woof. (Translation: Forehead had lines on it. Wrinkles. Smelled like apples. Gave me zero treats.)']] },
  { name: 'Cousin Gary', crime: "Taught every parrot at the zoo to say 'no comment'.", spec: 'head:square skin:4 hair:none hat:pirate brows:angry eyes:dot gl:eyepatch nose:hook mouth:grin fh:beard hc:black acc:parrot shirt:white', w: [
    ['pirate', 'That be me cousin Gary! Eye patch, black beard, hooked nose, and a pirate hat he never paid for.'],
    ['kid', 'There was a BIRD on his shoulder! A green and red bird! And he smiled with all his teeth.'],
    ['cop', 'Square jaw. Angry eyebrows. White shirt. The bird refused to give a statement.'],
    ['conspiracy', "That parrot was wearing a wire. Also, birds aren't real. Write that down."]] },
  { name: 'The Donut Dilemma', crime: 'Ate a dozen donuts from the police break room.', spec: 'head:pear skin:3 hair:short hc:black brows:unibrow eyes:squint nose:big mouth:frown ears:normal fh:stubble shirt:blue', w: [
    ['cop', "He ATE OUR DONUTS. One eyebrow. ONE. Straight across. Squinty little eyes. I'll never forget them."],
    ['critic', 'A unibrow so committed it deserves its own wing at the Louvre. The face widens toward the jaw, like a pear.'],
    ['gran', 'He needed a shave, poor thing, stubble everywhere. And such a frown! Short black hair.'],
    ['chef', 'His nose? A big potato. A good potato, I must admit. Blue shirt. Crumbs everywhere.']] },
  { name: 'Three-Brow Jones', crime: 'Raised an eyebrow at the mayor. Then a third.', spec: 'head:oval skin:5 hair:mohawk hc:pink brows:three eyes:round nose:button mouth:smile ears:normal marks:mole shirt:black', w: [
    ['kid', 'He had THREE eyebrows! One, two, THREE! The extra one was in the middle, up high.'],
    ['conspiracy', "Third eyebrow in the middle of the forehead. That's where they put the chip. Classic."],
    ['influencer', 'Okay but the mohawk? PINK. Black tee. Honestly kind of a serve, not gonna lie.'],
    ['cop', 'Mole on the cheek, lower right as you look at him. Big round eyes. Smiling, somehow.']] },
  { name: 'The Disco Inferno', crime: 'Started an unauthorized dance party in the public library.', spec: 'head:round skin:4 hair:afro hc:brown brows:normal eyes:dot nose:button mouth:grin fh:mustache gl:sunglasses acc:chain shirt:yellow', w: [
    ['ghost', 'Shhhhh... he danced... in my library... a huge round afro... dark glasses... a gold chain...'],
    ['sports', 'AND HE GRINS! Big toothy grin, folks! And look at that MUSTACHE, that is a veteran mustache!'],
    ['gran', 'Sunglasses indoors, at night! Who raised him? Lovely yellow shirt though, very cheerful.']] },
  { name: 'The Visitor', crime: "Wouldn't stop winking. Nobody could tell when.", spec: 'head:egg skin:green hair:none brows:none eyes:cyclops nose:tiny mouth:smile ears:pointy acc:bowtie shirt:white', w: [
    ['conspiracy', 'Green. ONE eye. Pointy ears. I have been saying this for YEARS and nobody listened.'],
    ['robot', 'SUBJECT ANALYSIS: Ocular units: 1, centered. Cranium: egg, wider at top. Nose: 2 holes. Eyebrows: 0. Bow tie: 1.'],
    ['kid', 'He was a nice alien. He smiled at me. He had a bow tie like at a wedding and no hair at all.']] },
  { name: 'Baron Von Spoon', crime: 'Insider trading of collectible spoons.', spec: 'head:long skin:1 hair:short hc:gray brows:thick eyes:dot gl:monocle nose:pointy mouth:frown ears:normal fh:handlebar hat:tophat acc:bowtie shirt:black', w: [
    ['critic', 'A monocle, in this economy! A top hat, a long disappointed face, a nose like a fountain pen.'],
    ['pirate', "Mustache curlin' at the ends, aye. Gray, it was. And a frown like a ship with no wind."],
    ['tourist', 'I take photo with him! He say no photos. One glass on one eye only. Very expensive man. Bow tie.']] },
  { name: 'Le Petit Thief', crime: 'Stole a souffle while it was still rising.', spec: 'head:round skin:2 hair:none hat:chef brows:raised eyes:round nose:big mouth:open fh:mustache hc:black marks:blush shirt:white', w: [
    ['chef', 'Mon dieu! He wore MY hat, the tall puffy one! Round face, rosy cheeks, mouth open like he was tasting.'],
    ['kid', 'His mustache was black and his nose was big like a ball.'],
    ['dog', 'Bark! (Translation: His eyebrows went way up when he saw me. Surprised. He smelled like butter. I respect him.)']] },
  { name: 'The Heartbreaker', crime: 'Shoplifted 600 heart-shaped balloons.', spec: 'head:heart skin:3 hair:long hc:red brows:normal eyes:dot nose:button mouth:smile ears:none gl:heart marks:freckles acc:earring shirt:pink', w: [
    ['influencer', "Heart sunglasses, long red hair, freckles. The look was SO cute, I hate that she's a criminal."],
    ['poet', 'Her face, a valentine, narrowing to a point at the chin. Her hair, a long river of rust.'],
    ['gran', "Only one earring, dear. Couldn't afford the pair, I suppose. Pink top. Smiling!"]] },
  { name: 'Fez Fernandez', crime: 'Sold the same bridge to three different people. Twice.', spec: 'head:square skin:4 hair:short hc:black hat:fez brows:thick eyes:round nose:hook mouth:smirk ears:big fh:goatee shirt:green', w: [
    ['tourist', 'He sell me bridge! Nice man! Little red hat, like a flowerpot, with a tassel.'],
    ['cop', 'Square face. Thick eyebrows. Hooked nose. Little goatee on the chin. Green shirt.'],
    ['kid', 'He had big ears and he made a sneaky smile. Like when I hide peas.'],
    ['conspiracy', "Was the hat red or was it a flowerpot? Same thing? That's what they WANT you to think."]] },
  { name: 'Professor Hover', crime: 'Hovered over the parade without a permit.', spec: 'head:round skin:1 hair:curly hc:orange hat:propeller brows:raised eyes:googly nose:button mouth:gap ears:big marks:freckles shirt:blue', w: [
    ['kid', 'His hat had a SPINNY thing! A helicopter! I want one!'],
    ['surfer', 'Gnarly orange curly hair, bro. Eyes going in two different directions. Big ol\' gap in his teeth.'],
    ['gran', 'So many freckles! And his ears stuck out like the handles on a sugar bowl.'],
    ['robot', 'PROPELLER: 2 blades. ROTATION: unauthorized. FACE: round. EYEBROWS: elevated. SHIRT: blue.']] },
  { name: 'Viking Vince', crime: 'Pillaged the salad bar. Took all the croutons.', spec: 'head:square skin:2 hair:long hc:blonde hat:viking brows:angry eyes:dot nose:big mouth:open fh:beard shirt:brown', w: [
    ['sports', 'HE CHARGES THE SALAD BAR! Horned helmet, long blond hair, beard flowing, mouth open in a war cry!'],
    ['chef', 'My croutons! A big nose, a big angry brow, a big appetite. Brown shirt, like a crouton, ironically.'],
    ['gran', 'Horns, on his hat! In a family restaurant! Square face. He needed a haircut AND a manners lesson.']] },
  { name: 'The Toast of the Town', crime: 'Buttered a stranger without consent.', spec: 'head:egg skin:3 hair:short hc:brown hat:toast brows:normal eyes:sleepy nose:button mouth:flat ears:normal marks:bags shirt:yellow', w: [
    ['chef', "There was a slice of toast on his head. Golden brown. Perfectly done. I'm furious and impressed."],
    ['kid', 'He was sleepy. His eyes were half closed. And he had bags under them, like grandpa.'],
    ['critic', 'An egg-shaped head, wider at the top. Mouth a flat line of ennui. He IS the toast of the town, sadly.']] },
  { name: 'Mallory Quack', crime: 'Released 400 rubber ducks into the city fountain.', spec: 'head:oval skin:5 hair:buzz hc:black hat:duck brows:normal eyes:round nose:button mouth:smile ears:normal gl:square acc:tie shirt:teal', w: [
    ['dog', 'WOOF! WOOF! (Translation: DUCK. DUCK ON HEAD. YELLOW DUCK. I could not stop barking.)'],
    ['cop', 'Very short buzzed black hair, square glasses, teal shirt and a tie. Smiling. Rubber duck on head, confirmed.'],
    ['influencer', "The square glasses with the tie? Office core. The duck? Unhinged. I'm obsessed."]] },
  { name: 'Merlin of Parking Lot B', crime: 'Turned a parking ticket into a pigeon.', spec: 'head:long skin:1 hair:long hc:white brows:bushy eyes:dot nose:long mouth:flat ears:normal fh:wizard gl:round shirt:purple', w: [
    ['ghost', 'Ooooh... a long white beard... down to his belly... long white hair... round little spectacles...'],
    ['poet', 'His eyebrows, two snowy hedges. His nose, a long descending stair. His robe, the purple of plums.'],
    ['conspiracy', "A pigeon from a ticket? Pigeons are government drones. So he's a government wizard. Obviously."]] },
  { name: 'Pigtail Penny', crime: 'Picked 40 pockets. Returned them all. With lint.', spec: 'head:round skin:2 hair:pigtails hc:black brows:normal eyes:lashes nose:button mouth:tongue ears:small marks:freckles shirt:red', w: [
    ['kid', 'She had two pony tails sticking out the sides! And she stuck her tongue out at me!!'],
    ['gran', 'Long eyelashes, freckles on her cheeks. Red top. She was very polite returning my wallet.'],
    ['cop', 'Black hair in pigtails, one each side. Round face. She blew a raspberry at the officer. Me. I am the officer.']] },
  { name: 'Second Class Sandra', crime: 'Delivered every letter in town six weeks late.', spec: 'head:oval skin:3 hair:bob hc:purple hat:cap hatc:blue brows:normal eyes:sleepy nose:pointy mouth:frown ears:none acc:snail shirt:blue', w: [
    ['conspiracy', 'Postal cap. Purple bob haircut. And a snail on her cheek. A SNAIL. The snail is the mastermind.'],
    ['kid', 'She had a snail on her face! It was slow. She was sad. Her mouth went down.'],
    ['critic', 'Sleepy, half-lidded eyes. A pointed nose. A purple bob, chin length. A blue cap. Melancholy, in navy.']] },
  { name: 'Hamish Snort', crime: 'Snorted loudly during the national anthem.', spec: 'head:pear skin:1 hair:combover hc:brown brows:normal eyes:dot nose:pig mouth:smile ears:big marks:sweat shirt:pink', w: [
    ['gran', "A combover, dear, three strands doing their very best. His nose was like a little piggy's!"],
    ['sports', 'AND HE SNORTS! Snout flaring! A bead of sweat on the forehead! What a moment for this man!'],
    ['kid', 'His ears were big and his shirt was pink. He looked like a pig. A nice pig.'],
    ['cop', 'Face widens at the jaw. Little dot eyes. Smiling, despite everything.']] },
  { name: 'King Bozo the First', crime: 'Declared himself king of a bowling alley.', spec: 'head:round skin:1 hair:wild hc:blue hat:crown brows:raised eyes:round nose:clown mouth:grin marks:blush acc:bowtie shirt:yellow', w: [
    ['kid', 'A CLOWN! With a red ball nose! And a crown! A clown king!'],
    ['critic', 'Wild blue hair exploding from the sides. A golden crown. Rosy cheeks. A grin with every tooth on display.'],
    ['pirate', "Bow tie, yellow shirt, nose like a cherry. Arr, a fool and a king. The most dangerous kind."],
    ['gran', "His eyebrows were way up, like he'd just seen the bill."]] },
  { name: 'Vlad From Accounts', crime: 'Drained the office coffee pot. Every day. For years.', spec: 'head:long skin:1 hair:peak hc:black brows:angry eyes:angry nose:pointy mouth:fangs ears:pointy shirt:black', w: [
    ['conspiracy', "Pointy ears. Fangs. Hair coming to a point on the forehead. He's been 'working nights' since 1897."],
    ['ghost', 'Oooh... I know him... we share a break room... long pale face... angry eyes... black shirt...'],
    ['cop', 'Pointed nose. Angry eyebrows. Fangs, plural. Never seen him at lunch, come to think of it.']] },
  { name: 'Harold the Innocent', crime: 'Too innocent. Suspiciously, unbearably innocent.', spec: 'head:round skin:2 hair:curly hc:blonde hat:halo brows:normal eyes:dot nose:button mouth:smile marks:blush shirt:white', w: [
    ['gran', 'He had a little halo! A golden ring floating over his blond curls. Rosy cheeks. Such a good boy.'],
    ['conspiracy', "Nobody that innocent is innocent. Round face, white shirt, halo. It's a disguise, people."],
    ['dog', 'Wag wag. (Translation: He is a very good boy. I would know. I am also a very good boy.)']] },
  { name: 'Grandpa Turbo', crime: 'Ran a red light on a mobility scooter. At 4 mph.', spec: 'head:oval skin:1 hair:wild hc:white brows:bushy eyes:round gl:goggles nose:big mouth:grin ears:big fh:mustache marks:wrinkles shirt:brown', w: [
    ['sports', "HE'S DOING FOUR MILES AN HOUR! Goggles on! Wild white hair blowing in the wind! INCREDIBLE!"],
    ['gran', "Oh, that's Walter. Bushy eyebrows, bushy mustache, big ears, wrinkles. He still owes me a casserole dish."],
    ['kid', 'He was laughing with his teeth. And his hair was like two clouds on the sides.']] },
  { name: 'The Hermit', crime: "Hasn't heard a word anyone said since 2019.", spec: 'head:egg skin:4 hair:buzz hc:black brows:normal eyes:sleepy nose:button mouth:flat ears:normal fh:soulpatch acc:headphones shirt:gray', w: [
    ['cop', "Big headphones. I said 'stop'. He said 'what?'. Buzzed hair. Little patch of beard under the lip."],
    ['surfer', 'Total chill vibes, man. Sleepy eyes. Flat mouth. Gray tee. Probably listening to whale sounds.'],
    ['critic', 'An egg-shaped head, wider at the crown, framed by headphones like a pair of brackets. Minimalist.']] },
  { name: 'Mrs. Whiskers (And Her Lady)', crime: 'The cat did it. The lady is an accessory.', spec: 'head:oval skin:2 hair:bob hc:gray brows:normal eyes:round nose:button mouth:smile ears:none gl:square acc:cat+pearls shirt:teal', w: [
    ['dog', 'GRRRRR. (Translation: CAT. Gray cat. On her shoulder. Looking at me. Smug. ARREST THE CAT.)'],
    ['gran', 'Gray bob, square glasses, pearls. Lovely lady. The cat had a guilty look, I thought.'],
    ['kid', 'The kitty was on her shoulder on the side of my drawing hand. Wait. Which hand do I draw with?'],
    ['cop', 'The cat sat on her shoulder, the left side as you look at her. Teal shirt.']] },
  { name: 'Lollipop Larry', crime: "Licked every 'do not lick' sign at the zoo.", spec: 'head:round skin:3 hair:spiky hc:green brows:raised eyes:googly nose:button mouth:open ears:normal marks:freckles acc:lollipop shirt:orange', w: [
    ['kid', 'He had a GIANT lollipop! A swirly pink one! I asked for a lick and he said no.'],
    ['surfer', 'Spiky green hair, dude. Like a cactus. Eyes all wobbly, like googly eyes on a rock.'],
    ['robot', 'FRECKLES: detected. MOUTH: open. EYEBROWS: elevated 40 percent. SHIRT: orange. LICKING: excessive.']] },
  { name: 'Bertrand Baguette', crime: 'Used a baguette as a sword in a bakery duel.', spec: 'head:long skin:1 hair:short hc:black hat:beret brows:raised eyes:sleepy nose:long mouth:smirk ears:normal fh:pencil acc:baguette+scarf shirt:stripes', w: [
    ['chef', 'A beret! A thin little mustache! A striped shirt! And he used MY baguette as a sword!'],
    ['critic', 'Sleepy eyes, a long nose, a smirk. The red scarf is a cliche, and yet, it works.'],
    ['tourist', 'Is he from Paris? He hold bread on shoulder like a guitar. Very long face.']] },
  { name: 'The Narrator', crime: 'Talked through an entire movie. Narrated it, actually.', spec: 'head:round skin:4 hair:short hc:black brows:raised eyes:dot gl:3d nose:big mouth:open ears:normal shirt:red', w: [
    ['ghost', '...he talked... and talked... red and blue glasses... the old movie kind... mouth always open...'],
    ['critic', 'Red and blue 3D glasses, which is bold for a movie in 2D. Round face. Big nose. A red shirt.'],
    ['cop', "Short black hair, eyebrows up, mouth open mid-sentence. He's still talking, actually. We can hear him."]] },
  { name: 'Cowboy Kowalski', crime: 'Lassoed a shopping mall escalator.', spec: 'head:square skin:3 hair:short hc:brown hat:cowboy brows:thick eyes:squint nose:big mouth:flat ears:normal fh:mustache marks:scar acc:scarf shirt:red', w: [
    ['pirate', 'A landlubber cowboy! Big brim hat, squinty eyes, a scar on his cheek, a mustache like a broom.'],
    ['kid', 'He had a cowboy hat! YEEHAW! And a scarf like a bandit.'],
    ['gran', 'Square jaw, thick brows, flat mouth. Red shirt. He tipped his hat at me. Very rude to then rob an escalator.']] },
  { name: 'The Party Animal', crime: 'Brought a kazoo to a funeral. Played it well, though.', spec: 'head:pear skin:2 hair:curly hc:red hat:party brows:raised eyes:round nose:button mouth:grin ears:normal marks:blush shirt:green', w: [
    ['influencer', 'Party hat, curly red hair, a huge grin. At a FUNERAL. Honestly? Main character energy.'],
    ['gran', 'Rosy cheeks, eyebrows up, round eyes. His face got wider at the jaw. Green shirt.'],
    ['sports', "AND HE BLOWS THE KAZOO! The crowd is silent! It's a funeral, folks! The crowd is ALWAYS silent!"]] },
  { name: 'General Nonsense', crime: "Awarded himself 14 medals for 'being great'.", spec: 'head:square skin:1 hair:buzz hc:gray brows:angry eyes:angry nose:big mouth:frown ears:big fh:mustache acc:medal shirt:green', w: [
    ['cop', 'Gray buzz cut. Gray mustache. Angry everything. Medal on his chest. He saluted me. I did not salute back.'],
    ['kid', 'He was SO grumpy. His eyebrows went down like this. And his ears were big.'],
    ['critic', 'Square jaw, a frown, a single medal glinting. The other thirteen were in his pocket.']] },
  { name: 'Beehive Betty', crime: 'Hid a stolen bowling trophy inside her hair.', spec: 'head:oval skin:2 hair:beehive hc:blue brows:raised eyes:lashes nose:button mouth:smile ears:normal marks:mole acc:earring+pearls shirt:pink', w: [
    ['gran', 'Her hair was piled up SO tall, dear, a big blue tower. You could hide a turkey in there.'],
    ['influencer', 'Long lashes, pearls, a beauty mark, one earring. Pink top. The beehive? Retro icon. The theft? Less so.'],
    ['conspiracy', 'That hair is a storage unit. How many trophies in there? One? Forty? Nobody knows.']] },
  { name: 'Pete the Ink', crime: "Sold 'invisible ink' that was just water.", spec: 'head:long skin:3 hair:ponytail hc:brown brows:normal eyes:dot nose:pointy mouth:smirk ears:normal fh:goatee acc:earring shirt:black', w: [
    ['surfer', 'Brown ponytail, little goatee, one earring. Black tee. Smirked like he knew a secret.'],
    ['critic', "A long face, a pointed nose. Smug. I bought three bottles, I'm ashamed to say."],
    ['robot', 'INK DETECTED: 0 percent. WATER: 100 percent. PONYTAIL: confirmed.']] },
  { name: 'Romeo Done Wrong', crime: 'Serenaded the wrong balcony. 40 times.', spec: 'head:heart skin:4 hair:short hc:black brows:raised eyes:lashes nose:button mouth:flat ears:normal fh:pencil acc:rose shirt:white', w: [
    ['poet', 'A rose between his teeth. A pencil mustache, thin as a sigh. Long lashes. Wrong balcony. Tragic.'],
    ['gran', "He was singing at MY balcony. Pointy chin, eyebrows up. Nice voice. I'm 82, Romeo."],
    ['kid', "He had a flower in his mouth. Why? Flowers aren't food."]] },
  { name: 'Bandaid Bernie', crime: 'Fell for every prank in the book. Then stole the book.', spec: 'head:round skin:1 hair:spiky hc:blonde brows:normal eyes:dot nose:button mouth:frown ears:big marks:bandaid+freckles shirt:blue', w: [
    ['kid', 'He had a bandaid on his forehead! I have bandaids too! Mine have dinosaurs.'],
    ['cop', 'Spiky blond hair. Big ears. Freckles. Frowning. Blue shirt. He tripped over our crime scene tape.'],
    ['surfer', 'Little dude looked sad, man. Spiky hair though. Respect.']] },
  { name: 'Not A Suspect', crime: "Wore a name tag that said 'NOT A SUSPECT'. Was a suspect.", spec: 'head:oval skin:3 hair:short hc:brown brows:normal eyes:dot nose:button mouth:smile ears:normal gl:square acc:nametag shirt:gray', w: [
    ['cop', "Name tag said 'not a suspect'. We almost let him go. Square glasses, short brown hair, gray shirt."],
    ['critic', 'Utterly ordinary. Oval face, a smile, dot eyes. The name tag is the only interesting thing about him.'],
    ['conspiracy', 'A name tag. On the right side of his chest as you look at him. Too convenient. TOO convenient.']] },
  { name: 'Mullet McGee', crime: 'Business in the front. Crime in the back.', spec: 'head:square skin:2 hair:mullet hc:blonde brows:normal eyes:squint nose:big mouth:grin ears:normal fh:mustache gl:sunglasses acc:chain shirt:teal', w: [
    ['surfer', 'Blond mullet, bro! Short on top, long in the back! Shades and a gold chain. Legend.'],
    ['sports', 'What a GRIN! A mustache to match! Square jaw like a quarterback! Teal shirt!'],
    ['gran', 'Sunglasses again! Does nobody look at the sun anymore? Big nose, too.']] },
  { name: 'Teardrop Tony', crime: 'Cried at a magic show, then stole the rabbit.', spec: 'head:egg skin:5 hair:buzz hc:black brows:normal eyes:sleepy nose:big mouth:frown ears:normal fh:stubble marks:tear acc:earring shirt:white', w: [
    ['poet', 'A teardrop inked beneath his eye, the right one as you face him. He wept for the rabbit. Then took it.'],
    ['cop', 'Buzz cut, stubble, an earring. Sleepy eyes. Frowning. White shirt. The rabbit is safe.'],
    ['kid', 'He was sad. He had a big nose. And a drawing of a tear on his face.']] },
  { name: 'The Pipe Professor', crime: 'Plagiarized a fortune cookie.', spec: 'head:long skin:1 hair:combover hc:brown brows:bushy eyes:dot nose:hook mouth:flat ears:normal fh:beard gl:round acc:pipe+bowtie shirt:brown', w: [
    ['critic', 'Round spectacles. A full brown beard. A pipe. A bow tie. Yes, he is exactly what you imagine.'],
    ['robot', 'COMBOVER: 3 strands. NOSE: hooked. EYEBROWS: bushy. ORIGINALITY: 0.'],
    ['gran', 'He smoked a pipe like my late husband. Long face. Lovely brown suit.']] },
  { name: 'Sweaty Steve', crime: 'Was nervous. About nothing. Very suspicious.', spec: 'head:round skin:1 hair:combover hc:brown brows:raised eyes:wide nose:button mouth:frown ears:normal marks:sweat+bags acc:tie shirt:white', w: [
    ['cop', 'Sweating. Wide eyes. Eyebrows up. Bags under the eyes. White shirt, tie. He confessed to three unrelated crimes.'],
    ['dog', 'Sniff. (Translation: He smelled like fear. And ham. Round face. I liked him.)'],
    ['influencer', "The combover was giving 'I'm fine'. The frown was giving 'I'm not fine'."]] },
  { name: 'The Evil Twin', crime: 'Claims it was his evil twin. He has no twin.', spec: 'head:oval skin:3 hair:short hc:black brows:angry eyes:dot nose:button mouth:smirk ears:normal fh:pencil marks:scar acc:tie shirt:black', w: [
    ['conspiracy', "There IS a twin. There's always a twin. Scar on the left cheek as you look at him. Thin mustache."],
    ['cop', 'Angry eyebrows, smirking. Black shirt, tie. Short black hair. He has no twin. We checked twice.'],
    ['gran', 'Oh, he looked just like that nice cookie boy, only evil. And a scar!']] },
  { name: 'Sheriff Snooze', crime: 'Fell asleep on duty. The duty was a parade float.', spec: 'head:pear skin:5 hair:none hat:cowboy brows:normal eyes:sleepy nose:big mouth:open ears:big fh:beard hc:gray marks:bags acc:medal shirt:brown', w: [
    ['sports', 'AND HE IS ASLEEP! Mouth wide open! Cowboy hat over the ears! The float is heading for the lake!'],
    ['kid', 'He had a gray beard and a gold star thing. He was snoring like a dragon.'],
    ['gran', 'Big ears, big nose, bags under his eyes. He needs a nap. Well, another nap.'],
    ['robot', 'BRAIN ACTIVITY: minimal. JAW: wider at bottom. SHIRT: brown. SNORE VOLUME: 94 decibels.']] },
  { name: 'Lady Bigwig', crime: 'Cut in line at the post office. Wearing a crown.', spec: 'head:long skin:1 hair:beehive hc:white brows:raised eyes:lashes nose:pointy mouth:smirk ears:small gl:monocle acc:pearls shirt:purple', w: [
    ['gran', 'She cut in front of me! Tall white hair piled up like whipped cream. And a monocle!'],
    ['critic', 'Long face, pointed nose, eyebrows arched in contempt. Pearls. Purple. A walking oil painting.'],
    ['kid', 'She said the crown was invisible. I believed her. Her eyelashes were really long.'],
    ['cop', "There was no crown. She just acted like there was. Lashes, smirk, small ears. That's our lady."]] },
  { name: 'The Masterpiece', crime: 'Everything. At once. Simultaneously.', spec: 'head:egg skin:purple hair:afro hc:orange hat:duck brows:three eyes:googly nose:clown mouth:gap ears:pointy fh:handlebar marks:scar+freckles acc:parrot+bowtie+earring shirt:stripes', w: [
    ['critic', 'This is it. My life\'s work. A purple egg of a face, an orange afro, a duck upon it. I weep.'],
    ['kid', 'THREE eyebrows AND a duck AND a parrot! And a clown nose! Best day EVER!'],
    ['pirate', "A parrot on the shoulder, a mustache curlin' like waves. I'd sail with him. Then he'd rob me."],
    ['conspiracy', "Googly eyes. Gap tooth. Striped shirt. Pointy ears. It's ALL connected. Every single thing."],
    ['cop', 'Scar on the cheek. Freckles. Bow tie. Earring. Honestly, at this point, just draw everything.'],
    ['gran', 'I think I need to sit down, dear.']] }
];

window.SKETCH_INNOCENTS = [
  'Gerald, a local dentist', 'Brenda from the bakery', 'a very confused mime', 'the mayor, again', 'a man named Phil who was just buying milk',
  'your own reflection', 'a substitute teacher', 'a cardboard cutout of a celebrity', 'a lifeguard on his day off', 'the guy who sells balloons',
  'a cat in a trench coat', 'a librarian named Doris', 'someone\'s uncle Kevin', 'a professional hand model', 'the night janitor'
];
