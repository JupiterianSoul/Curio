(function () {
  const RAW = `1|H|Hydrogen|1.008|nm|gas|1766|13.99|20.271
2|He|Helium|4.0026|ng|gas|1868|0|4.222
3|Li|Lithium|6.94|am|solid|1817|453.65|1603
4|Be|Beryllium|9.0122|ae|solid|1798|1560|2742
5|B|Boron|10.81|md|solid|1808|2349|4200
6|C|Carbon|12.011|nm|solid|0|3915|3915
7|N|Nitrogen|14.007|nm|gas|1772|63.15|77.355
8|O|Oxygen|15.999|nm|gas|1774|54.36|90.188
9|F|Fluorine|18.998|ha|gas|1886|53.48|85.03
10|Ne|Neon|20.180|ng|gas|1898|24.56|27.104
11|Na|Sodium|22.990|am|solid|1807|370.94|1156.09
12|Mg|Magnesium|24.305|ae|solid|1755|923|1363
13|Al|Aluminium|26.982|pt|solid|1825|933.47|2743
14|Si|Silicon|28.085|md|solid|1824|1687|3538
15|P|Phosphorus|30.974|nm|solid|1669|317.3|553.7
16|S|Sulfur|32.06|nm|solid|0|388.36|717.8
17|Cl|Chlorine|35.45|ha|gas|1774|171.6|239.11
18|Ar|Argon|39.95|ng|gas|1894|83.81|87.302
19|K|Potassium|39.098|am|solid|1807|336.7|1032
20|Ca|Calcium|40.078|ae|solid|1808|1115|1757
21|Sc|Scandium|44.956|tm|solid|1879|1814|3109
22|Ti|Titanium|47.867|tm|solid|1791|1941|3560
23|V|Vanadium|50.942|tm|solid|1801|2183|3680
24|Cr|Chromium|51.996|tm|solid|1797|2180|2944
25|Mn|Manganese|54.938|tm|solid|1774|1519|2334
26|Fe|Iron|55.845|tm|solid|0|1811|3134
27|Co|Cobalt|58.933|tm|solid|1735|1768|3200
28|Ni|Nickel|58.693|tm|solid|1751|1728|3003
29|Cu|Copper|63.546|tm|solid|0|1357.77|2835
30|Zn|Zinc|65.38|tm|solid|1746|692.68|1180
31|Ga|Gallium|69.723|pt|solid|1875|302.91|2673
32|Ge|Germanium|72.630|md|solid|1886|1211.4|3106
33|As|Arsenic|74.922|md|solid|1250|887|887
34|Se|Selenium|78.971|nm|solid|1817|494|958
35|Br|Bromine|79.904|ha|liquid|1825|265.8|332
36|Kr|Krypton|83.798|ng|gas|1898|115.78|119.93
37|Rb|Rubidium|85.468|am|solid|1861|312.45|961
38|Sr|Strontium|87.62|ae|solid|1790|1050|1650
39|Y|Yttrium|88.906|tm|solid|1794|1799|3203
40|Zr|Zirconium|91.224|tm|solid|1789|2128|4650
41|Nb|Niobium|92.906|tm|solid|1801|2750|5017
42|Mo|Molybdenum|95.95|tm|solid|1778|2896|4912
43|Tc|Technetium|97|tm|solid|1937|2430|4538
44|Ru|Ruthenium|101.07|tm|solid|1844|2607|4423
45|Rh|Rhodium|102.91|tm|solid|1804|2237|3968
46|Pd|Palladium|106.42|tm|solid|1802|1828.05|3236
47|Ag|Silver|107.87|tm|solid|0|1234.93|2435
48|Cd|Cadmium|112.41|tm|solid|1817|594.22|1040
49|In|Indium|114.82|pt|solid|1863|429.75|2345
50|Sn|Tin|118.71|pt|solid|0|505.08|2875
51|Sb|Antimony|121.76|md|solid|0|903.78|1908
52|Te|Tellurium|127.60|md|solid|1782|722.66|1261
53|I|Iodine|126.90|ha|solid|1811|386.85|457.4
54|Xe|Xenon|131.29|ng|gas|1898|161.4|165.05
55|Cs|Caesium|132.91|am|solid|1860|301.7|944
56|Ba|Barium|137.33|ae|solid|1772|1000|2118
57|La|Lanthanum|138.91|la|solid|1839|1193|3737
58|Ce|Cerium|140.12|la|solid|1803|1068|3716
59|Pr|Praseodymium|140.91|la|solid|1885|1208|3403
60|Nd|Neodymium|144.24|la|solid|1885|1297|3347
61|Pm|Promethium|145|la|solid|1945|1315|3273
62|Sm|Samarium|150.36|la|solid|1879|1345|2173
63|Eu|Europium|151.96|la|solid|1901|1099|1802
64|Gd|Gadolinium|157.25|la|solid|1880|1585|3546
65|Tb|Terbium|158.93|la|solid|1843|1629|3396
66|Dy|Dysprosium|162.50|la|solid|1886|1680|2840
67|Ho|Holmium|164.93|la|solid|1878|1734|2873
68|Er|Erbium|167.26|la|solid|1843|1802|3141
69|Tm|Thulium|168.93|la|solid|1879|1818|2223
70|Yb|Ytterbium|173.05|la|solid|1878|1097|1469
71|Lu|Lutetium|174.97|la|solid|1907|1925|3675
72|Hf|Hafnium|178.49|tm|solid|1923|2506|4876
73|Ta|Tantalum|180.95|tm|solid|1802|3290|5731
74|W|Tungsten|183.84|tm|solid|1783|3695|6203
75|Re|Rhenium|186.21|tm|solid|1925|3459|5869
76|Os|Osmium|190.23|tm|solid|1803|3306|5285
77|Ir|Iridium|192.22|tm|solid|1803|2719|4403
78|Pt|Platinum|195.08|tm|solid|1735|2041.4|4098
79|Au|Gold|196.97|tm|solid|0|1337.33|3243
80|Hg|Mercury|200.59|tm|liquid|0|234.32|629.88
81|Tl|Thallium|204.38|pt|solid|1861|577|1746
82|Pb|Lead|207.2|pt|solid|0|600.61|2022
83|Bi|Bismuth|208.98|pt|solid|1753|544.7|1837
84|Po|Polonium|209|pt|solid|1898|527|1235
85|At|Astatine|210|ha|solid|1940|~575|~610
86|Rn|Radon|222|ng|gas|1899|202|211.5
87|Fr|Francium|223|am|solid|1939|~281|~890
88|Ra|Radium|226|ae|solid|1898|973|2010
89|Ac|Actinium|227|ac|solid|1899|1500|3500
90|Th|Thorium|232.04|ac|solid|1829|2023|5061
91|Pa|Protactinium|231.04|ac|solid|1913|1841|4300
92|U|Uranium|238.03|ac|solid|1789|1405.3|4404
93|Np|Neptunium|237|ac|solid|1940|912|4447
94|Pu|Plutonium|244|ac|solid|1940|912.5|3505
95|Am|Americium|243|ac|solid|1944|1449|2880
96|Cm|Curium|247|ac|solid|1944|1613|3383
97|Bk|Berkelium|247|ac|solid|1949|1259|~2900
98|Cf|Californium|251|ac|solid|1950|1173|~1743
99|Es|Einsteinium|252|ac|solid|1952|1133|~1269
100|Fm|Fermium|257|ac|unknown|1952|~1800|
101|Md|Mendelevium|258|ac|unknown|1955|~1100|
102|No|Nobelium|259|ac|unknown|1966|~1100|
103|Lr|Lawrencium|266|ac|unknown|1961|~1900|
104|Rf|Rutherfordium|267|tm|unknown|1964|~2400|~5800
105|Db|Dubnium|268|tm|unknown|1967||
106|Sg|Seaborgium|269|tm|unknown|1974||
107|Bh|Bohrium|270|tm|unknown|1981||
108|Hs|Hassium|269|tm|unknown|1984||
109|Mt|Meitnerium|278|uk|unknown|1982||
110|Ds|Darmstadtium|281|uk|unknown|1994||
111|Rg|Roentgenium|282|uk|unknown|1994||
112|Cn|Copernicium|285|uk|unknown|1996||
113|Nh|Nihonium|286|uk|unknown|2004||
114|Fl|Flerovium|289|uk|unknown|1998||
115|Mc|Moscovium|290|uk|unknown|2003||
116|Lv|Livermorium|293|uk|unknown|2000||
117|Ts|Tennessine|294|uk|unknown|2010||
118|Og|Oganesson|294|uk|unknown|2002||`;

  const FACTS = {
    H: 'Roughly three out of every four atoms of ordinary matter in the universe are hydrogen. Every star starts out as a big ball of it.',
    He: 'Helium was found on the Sun (in its spectrum, during an 1868 eclipse) 27 years before anyone found it on Earth.',
    Li: 'So light it floats on oil. Most of the lithium mined today ends up in rechargeable batteries.',
    Be: 'The James Webb Space Telescope mirrors are made of beryllium coated in a whisper-thin layer of gold.',
    B: 'Boron is why Pyrex glass does not crack when you pour boiling water into it.',
    C: 'Diamond and pencil graphite are both pure carbon: only the way the atoms are stacked is different.',
    N: 'About 78% of every breath you take is nitrogen, and your body does absolutely nothing with it.',
    O: 'Liquid oxygen is pale blue and magnetic: it sticks between the poles of a strong magnet.',
    F: 'The most reactive element of all. A jet of fluorine gas can set glass, water and even asbestos on fire.',
    Ne: 'Neon signs glow red-orange. All the other colours in "neon" signs come from other gases or coated tubes.',
    Na: 'Drop sodium in water and it fizzes, skates around and may explode. Combine it with toxic chlorine and you get table salt.',
    Mg: 'Burning magnesium is so bright that early photographers used it as a camera flash.',
    Al: 'In the 1850s aluminium cost more than gold. Napoleon III saved aluminium cutlery for his most honoured guests.',
    Si: 'The second most common element in Earth\'s crust, after oxygen. Sand, glass and every computer chip run on it.',
    P: 'Discovered by an alchemist who boiled down vat after vat of urine looking for the philosopher\'s stone.',
    S: 'Pure sulfur barely smells. The rotten-egg stink comes from compounds like hydrogen sulfide.',
    Cl: 'Used as a weapon in World War I, and now used to keep swimming pools and drinking water safe.',
    Ar: 'Almost 1% of the air is argon. Its name comes from the Greek for "lazy", because it reacts with nothing.',
    K: 'Bananas are famous for potassium, and a tiny fraction of it is radioactive: you are very slightly radioactive too.',
    Ca: 'Your skeleton holds roughly a kilogram of calcium. It is also what makes chalk, marble and seashells.',
    Sc: 'Mendeleev predicted scandium (as "eka-boron") eight years before it was discovered.',
    Ti: 'As strong as many steels but about 45% lighter, which is why it ends up in jet engines and hip replacements.',
    V: 'Some sea squirts concentrate vanadium in their blood millions of times above sea water levels, and nobody is quite sure why.',
    Cr: 'Rubies are red and emeralds are green for the same reason: a pinch of chromium.',
    Mn: 'The seafloor is littered with potato-sized lumps of manganese that grow a few millimetres per million years.',
    Fe: 'Iron is the last element a big star can make by fusion. When a star\'s core fills up with iron, it collapses.',
    Co: 'The deep blue of Ming porcelain comes from cobalt. Its name comes from "kobold", a mischievous goblin of German mines.',
    Ni: 'Earth\'s core is mostly iron with a hefty slug of nickel, thousands of kilometres under your feet.',
    Cu: 'The Statue of Liberty is covered in copper, about 2.4 mm thick. It started out shiny brown and turned green in about 30 years.',
    Zn: 'You need zinc to taste and smell properly. A US penny is about 97.5% zinc with a thin copper coat.',
    Ga: 'Gallium melts at 29.8 °C, so a spoon made of it melts in a hot cup of tea, or in your hand.',
    Ge: 'Mendeleev predicted germanium\'s density and atomic weight with uncanny accuracy 15 years before it was found.',
    As: 'The classic poison of Victorian murder mysteries, it was also used in a popular green wallpaper dye.',
    Se: 'Brazil nuts are so rich in selenium that eating a couple a day covers your needs, and eating dozens is too much.',
    Br: 'One of only two elements that are liquid at room temperature. It is a dark red liquid that smells awful.',
    Kr: 'From 1960 to 1983 the metre was officially defined using the orange light of krypton-86.',
    Rb: 'Rubidium catches fire on contact with air and is used in the atomic clocks inside GPS satellites.',
    Sr: 'The red in fireworks and road flares comes from strontium salts.',
    Y: 'Yttrium, ytterbium, terbium and erbium are all named after one small Swedish village: Ytterby.',
    Zr: 'Cubic zirconia, the cheap diamond lookalike, is zirconium oxide.',
    Nb: 'Niobium-titanium wire is used for the superconducting magnets in MRI scanners and the Large Hadron Collider.',
    Mo: 'Molybdenum steel was used in World War I tank armour because it stayed tough without being too thick.',
    Tc: 'The first element ever made artificially. Every atom of it is radioactive, yet hospitals use it in millions of scans a year.',
    Ru: 'A rare platinum-group metal used in hard disk drives to help store more data per square inch.',
    Rh: 'One of the rarest and most expensive metals on Earth, mostly used in car catalytic converters.',
    Pd: 'Palladium can soak up 900 times its own volume of hydrogen gas, like a metal sponge.',
    Ag: 'Silver conducts heat and electricity better than any other element, including copper.',
    Cd: 'Painters loved cadmium yellows and reds. Monet used them, despite cadmium being toxic.',
    In: 'Indium is in nearly every touch screen, as indium tin oxide, a coating that is both transparent and conductive.',
    Sn: 'A bar of tin "cries": bending it makes a crackling sound as its crystals rub together.',
    Sb: 'Ancient Egyptian women used antimony sulfide as black eyeliner (kohl).',
    Te: 'Eat a tiny bit of tellurium and your breath will smell of garlic for weeks.',
    I: 'Your thyroid needs iodine, which is why many countries add it to table salt.',
    Xe: 'Xenon is used in ion thrusters that push spacecraft like NASA\'s Dawn through space.',
    Cs: 'The second is defined by caesium: exactly 9,192,631,770 ticks of its atomic vibration.',
    Ba: 'Before an X-ray of your gut you might drink a barium milkshake so your insides show up.',
    La: 'A single Toyota Prius hybrid battery contains about 10 to 15 kg of lanthanum.',
    Ce: 'Scratch a "flint" lighter and the sparks are mostly cerium alloy shavings catching fire.',
    Pr: 'Mixed into glass, praseodymium makes the yellow-blocking goggles worn by glassblowers.',
    Nd: 'Neodymium magnets are the strongest permanent magnets you can buy. They are in headphones, phones and wind turbines.',
    Pm: 'Promethium is so radioactive and unstable that there is perhaps half a kilogram of it in Earth\'s crust at any moment.',
    Sm: 'Samarium-cobalt magnets keep working at temperatures that would wreck neodymium ones.',
    Eu: 'Euro banknotes glow under UV light thanks to europium in the ink, a neat anti-counterfeit trick.',
    Gd: 'Gadolinium is injected as a contrast agent so MRI scans show more detail.',
    Tb: 'Terbium makes the green in old TV screens and some energy-saving bulbs.',
    Dy: 'Its name means "hard to get at" in Greek, because it took its discoverer more than 30 attempts to isolate it.',
    Ho: 'Holmium has the highest magnetic strength of any element and is used to make the strongest artificial magnetic fields.',
    Er: 'Erbium-doped fibre amplifiers boost the light signals that carry the internet under the oceans.',
    Tm: 'One of the rarest lanthanides. A tiny portable X-ray machine can run on radioactive thulium.',
    Yb: 'Ytterbium atomic clocks are so precise they would lose less than a second over the age of the universe.',
    Lu: 'The densest and hardest of the lanthanides, and one of the priciest metals to produce.',
    Hf: 'Hafnium soaks up neutrons, so it is used in the control rods of nuclear submarine reactors.',
    Ta: 'Named after Tantalus of Greek myth. Tiny tantalum capacitors are in nearly every phone.',
    W: 'Tungsten has the highest melting point of any metal, 3,422 °C, which is why it lit up a century of light bulbs.',
    Re: 'Rhenium was the last stable element to be discovered, in 1925.',
    Os: 'The densest naturally occurring element: a litre of osmium would weigh about 22.6 kg.',
    Ir: 'A thin worldwide layer of iridium-rich clay, 66 million years old, is the fingerprint of the asteroid that wiped out the dinosaurs.',
    Pt: 'All the platinum ever mined would fit in an average living room.',
    Au: 'All the gold ever mined would make a cube only about 22 metres on each side.',
    Hg: 'The only metal that is liquid at room temperature. Hatmakers who breathed its fumes gave us "mad as a hatter".',
    Tl: 'Odourless, tasteless and highly toxic, thallium earned the nickname "the poisoner\'s poison".',
    Pb: 'The Romans made water pipes from lead. "Plumbing" comes from its Latin name, plumbum.',
    Bi: 'Bismuth crystals grow in rainbow-coloured staircase shapes. It is also the pink stuff in some stomach medicines.',
    Po: 'Discovered by Marie and Pierre Curie, and named after Marie\'s homeland, Poland.',
    At: 'The rarest natural element. There is less than a gram of it in Earth\'s whole crust at any moment.',
    Rn: 'A radioactive gas that seeps out of granite rock and can build up in basements.',
    Fr: 'Nobody has ever seen a visible piece of francium: it is so radioactive it would vaporise itself.',
    Ra: 'Radium glowed in the dark, so it was painted on watch dials. The women who painted them suffered terribly.',
    Th: 'Named after Thor, the Norse god of thunder. Thorium could one day fuel safer nuclear reactors.',
    U: 'The heaviest element found in large amounts in nature. A kilogram of uranium-235 can release as much energy as about 2,700 tonnes of coal.',
    Np: 'The first element beyond uranium, named after Neptune, the planet beyond Uranus.',
    Pu: 'Plutonium is warm to the touch because of its own radioactive decay. Some space probes run on that heat.',
    Am: 'Most household smoke detectors contain a speck of americium-241.',
    Cm: 'Named after Marie and Pierre Curie. Mars rovers use curium to measure what rocks are made of.',
    Bk: 'Named after Berkeley, California, the town where it was made.',
    Cf: 'Californium is one of the most expensive substances ever made, at tens of millions of dollars per gram.',
    Es: 'First found in the debris of the first hydrogen bomb test, in 1952.',
    Fm: 'Also found in hydrogen bomb fallout, and named after physicist Enrico Fermi.',
    Md: 'Named after Dmitri Mendeleev, the father of the periodic table. The first batch was 17 atoms.',
    No: 'Named after Alfred Nobel. Its discovery was disputed by labs in Sweden, the USA and the USSR for years.',
    Lr: 'Named after Ernest Lawrence, inventor of the cyclotron particle accelerator.',
    Rf: 'Named after Ernest Rutherford, who discovered that atoms have a tiny dense nucleus.',
    Db: 'Named after Dubna, the Russian town of the lab that made it.',
    Sg: 'Glenn Seaborg was still alive when it was named after him, a first for any element.',
    Bh: 'Named after Niels Bohr. Only a handful of atoms have ever existed.',
    Hs: 'Named after Hesse, the German state. Its longest-lived atoms survive for only seconds.',
    Mt: 'Named after Lise Meitner, who helped explain nuclear fission but was left out of the Nobel Prize for it.',
    Ds: 'Named after Darmstadt, Germany. It survives for just seconds before falling apart.',
    Rg: 'Named after Wilhelm Röntgen, discoverer of X-rays.',
    Cn: 'Named after Nicolaus Copernicus, who put the Sun at the centre of the solar system.',
    Nh: 'The first element discovered in Asia. "Nihon" is one way of saying "Japan" in Japanese.',
    Fl: 'Named after the Flerov Laboratory in Dubna. It may behave almost like a noble gas.',
    Mc: 'Named after the Moscow region. Only about a hundred atoms have ever been made.',
    Lv: 'Named after the Lawrence Livermore National Laboratory in California.',
    Ts: 'Named after the state of Tennessee. Making it took berkelium shipped from the USA to Russia.',
    Og: 'The heaviest element known. Only a handful of atoms have been made, and each lasted under a millisecond.'
  };

  const ORIGIN = {
    H: 'Greek for "water maker"',
    He: 'Greek helios, the Sun',
    Li: 'Greek lithos, stone',
    Be: 'the gemstone beryl',
    B: 'borax, the mineral it came from',
    C: 'Latin carbo, charcoal',
    N: 'Greek for "nitre maker"',
    O: 'Greek for "acid maker"',
    F: 'the mineral fluorite, from Latin fluere, to flow',
    Ne: 'Greek neos, new',
    Na: 'soda; the symbol comes from Latin natrium',
    Mg: 'Magnesia, a region of Greece',
    Al: 'alum, a salt used since ancient times',
    Si: 'Latin silex, flint',
    P: 'Greek for "light bearer"',
    S: 'Latin sulfur',
    Cl: 'Greek chloros, pale green',
    Ar: 'Greek argos, lazy',
    K: 'potash; the symbol comes from Latin kalium',
    Ca: 'Latin calx, lime',
    Sc: 'Scandinavia',
    Ti: 'the Titans of Greek myth',
    V: 'Vanadis, another name for the Norse goddess Freyja',
    Cr: 'Greek chroma, colour',
    Mn: 'magnesia nigra, a black mineral',
    Fe: 'Old English iren; the symbol comes from Latin ferrum',
    Co: 'German kobold, a goblin blamed by miners',
    Ni: 'German Kupfernickel, "Old Nick\'s copper"',
    Cu: 'Latin cuprum, from Cyprus',
    Zn: 'German Zink, maybe from Zinke, a prong',
    Ga: 'Gallia, Latin for France',
    Ge: 'Germany',
    As: 'Greek arsenikon, a yellow pigment',
    Se: 'Greek selene, the Moon',
    Br: 'Greek bromos, stench',
    Kr: 'Greek kryptos, hidden',
    Rb: 'Latin rubidus, deep red',
    Sr: 'Strontian, a village in Scotland',
    Y: 'Ytterby, a village in Sweden',
    Zr: 'the mineral zircon',
    Nb: 'Niobe, daughter of Tantalus in Greek myth',
    Mo: 'Greek molybdos, lead',
    Tc: 'Greek technetos, artificial',
    Ru: 'Ruthenia, Latin for Russia',
    Rh: 'Greek rhodon, rose',
    Pd: 'the asteroid Pallas',
    Ag: 'Old English seolfor; the symbol comes from Latin argentum',
    Cd: 'Latin cadmia, an old name for zinc ore',
    In: 'the indigo line in its light',
    Sn: 'Old English tin; the symbol comes from Latin stannum',
    Sb: 'maybe Greek anti-monos, "never alone"; the symbol comes from Latin stibium',
    Te: 'Latin tellus, Earth',
    I: 'Greek iodes, violet',
    Xe: 'Greek xenos, stranger',
    Cs: 'Latin caesius, sky blue',
    Ba: 'Greek barys, heavy',
    La: 'Greek lanthanein, to lie hidden',
    Ce: 'the dwarf planet Ceres',
    Pr: 'Greek for "green twin"',
    Nd: 'Greek for "new twin"',
    Pm: 'Prometheus, who stole fire from the gods',
    Sm: 'the mineral samarskite, named after a Russian mining official',
    Eu: 'Europe',
    Gd: 'Johan Gadolin, a Finnish chemist',
    Tb: 'Ytterby, a village in Sweden',
    Dy: 'Greek dysprositos, hard to get at',
    Ho: 'Holmia, Latin for Stockholm',
    Er: 'Ytterby, a village in Sweden',
    Tm: 'Thule, the mythical far north',
    Yb: 'Ytterby, a village in Sweden',
    Lu: 'Lutetia, Latin for Paris',
    Hf: 'Hafnia, Latin for Copenhagen',
    Ta: 'Tantalus of Greek myth',
    W: 'Swedish tung sten, heavy stone; the symbol comes from wolfram',
    Re: 'Rhenus, Latin for the Rhine',
    Os: 'Greek osme, smell',
    Ir: 'Iris, Greek goddess of the rainbow',
    Pt: 'Spanish platina, little silver',
    Au: 'Old English gold; the symbol comes from Latin aurum',
    Hg: 'the god Mercury; the symbol comes from Greek for "liquid silver"',
    Tl: 'Greek thallos, a green shoot',
    Pb: 'Old English lead; the symbol comes from Latin plumbum',
    Bi: 'German Wismut, of uncertain origin',
    Po: 'Poland, Marie Curie\'s home country',
    At: 'Greek astatos, unstable',
    Rn: 'radium, which it comes from',
    Fr: 'France',
    Ra: 'Latin radius, ray',
    Ac: 'Greek aktis, ray',
    Th: 'Thor, the Norse god of thunder',
    Pa: '"before actinium", which it decays into',
    U: 'the planet Uranus',
    Np: 'the planet Neptune',
    Pu: 'Pluto',
    Am: 'the Americas',
    Cm: 'Marie and Pierre Curie',
    Bk: 'Berkeley, California',
    Cf: 'California',
    Es: 'Albert Einstein',
    Fm: 'Enrico Fermi',
    Md: 'Dmitri Mendeleev, who drew up the periodic table',
    No: 'Alfred Nobel',
    Lr: 'Ernest Lawrence, inventor of the cyclotron',
    Rf: 'Ernest Rutherford',
    Db: 'Dubna, a science town in Russia',
    Sg: 'Glenn Seaborg',
    Bh: 'Niels Bohr',
    Hs: 'Hesse, a state in Germany',
    Mt: 'Lise Meitner',
    Ds: 'Darmstadt, Germany',
    Rg: 'Wilhelm Röntgen, discoverer of X-rays',
    Cn: 'Nicolaus Copernicus',
    Nh: 'Nihon, Japanese for Japan',
    Fl: 'the Flerov Laboratory in Dubna',
    Mc: 'the Moscow region',
    Lv: 'Livermore, California',
    Ts: 'Tennessee',
    Og: 'Yuri Oganessian, a nuclear physicist'
  };

  const SETS = [
    { id: 'body', name: 'In your body', ico: '🫀', blurb: 'By mass, about 99% of you is just six elements: oxygen, carbon, hydrogen, nitrogen, calcium and phosphorus.', v: { O: 65, C: 18.5, H: 9.5, N: 3.2, Ca: 1.5, P: 1, K: 0.4, S: 0.3, Na: 0.2, Cl: 0.2, Mg: 0.1, Fe: 0.006, Zn: 0.003, Cu: 0.0001, I: 0.00002 } },
    { id: 'air', name: 'In the air', ico: '🌬️', blurb: 'Dry air by volume. Carbon is there as carbon dioxide, and water vapour comes on top.', v: { N: 78.08, O: 20.95, Ar: 0.93, C: 0.04, Ne: 0.0018, He: 0.0005, Kr: 0.0001, H: 0.00005, Xe: 0.000009 } },
    { id: 'crust', name: "In Earth's crust", ico: '🪨', blurb: "Nearly half of the rock beneath your feet, by mass, is oxygen locked up in minerals.", v: { O: 46.1, Si: 28.2, Al: 8.2, Fe: 5.6, Ca: 4.2, Na: 2.4, Mg: 2.3, K: 2.1, Ti: 0.57, H: 0.14, P: 0.11, Mn: 0.1 } },
    { id: 'phone', name: 'In your phone', ico: '📱', blurb: 'A smartphone holds well over 60 different elements. Here are some of the stars.', v: { Li: 1, Co: 1, C: 1, Al: 1, Si: 1, Cu: 1, Au: 1, Ag: 1, Sn: 1, In: 1, Ga: 1, As: 1, Ta: 1, Nd: 1, Pr: 1, Dy: 1, Tb: 1, Gd: 1, Eu: 1, Y: 1, La: 1, Ni: 1, W: 1, Mg: 1, K: 1, O: 1 } },
    { id: 'people', name: 'Named after people', ico: '🧑‍🔬', blurb: 'Only a few scientists get an element. Glenn Seaborg and Yuri Oganessian got theirs while still alive.', v: { Sm: 1, Gd: 1, Cm: 1, Es: 1, Fm: 1, Md: 1, No: 1, Lr: 1, Rf: 1, Sg: 1, Bh: 1, Mt: 1, Rg: 1, Cn: 1, Fl: 1, Og: 1 } },
    { id: 'places', name: 'Named after places', ico: '🗺️', blurb: 'One tiny Swedish village, Ytterby, has four elements named after it.', v: { Mg: 1, Sc: 1, Cu: 1, Ga: 1, Ge: 1, Sr: 1, Y: 1, Ru: 1, Eu: 1, Tb: 1, Ho: 1, Er: 1, Tm: 1, Yb: 1, Lu: 1, Hf: 1, Re: 1, Po: 1, Fr: 1, Am: 1, Bk: 1, Cf: 1, Db: 1, Hs: 1, Ds: 1, Nh: 1, Mc: 1, Lv: 1, Ts: 1 } },
    { id: 'space', name: 'Named after space', ico: '🪐', blurb: 'The Sun, the Moon, planets, a dwarf planet and an asteroid all made it into the table.', v: { He: 1, Se: 1, Te: 1, Ce: 1, Pd: 1, U: 1, Np: 1, Pu: 1 } },
    { id: 'precious', name: 'Precious metals', ico: '💍', blurb: 'Rare, shiny and resistant to rust. Rhodium has often been the priciest of all.', v: { Au: 1, Ag: 1, Pt: 1, Pd: 1, Rh: 1, Ir: 1, Os: 1, Ru: 1 } },
    { id: 'ancient', name: 'Known since ancient times', ico: '🏺', blurb: 'People were using these long before anyone knew what an element was.', v: null }
  ];

  const CATS = {
    am: { name: 'Alkali metal', c: '#ff8a65' },
    ae: { name: 'Alkaline earth metal', c: '#ffc95c' },
    tm: { name: 'Transition metal', c: '#f6a5b5' },
    pt: { name: 'Post-transition metal', c: '#9fd9c3' },
    md: { name: 'Metalloid', c: '#c7d982' },
    nm: { name: 'Reactive nonmetal', c: '#8fd0f2' },
    ha: { name: 'Halogen', c: '#7fe0e0' },
    ng: { name: 'Noble gas', c: '#c3a8f2' },
    la: { name: 'Lanthanide', c: '#f7b8e0' },
    ac: { name: 'Actinide', c: '#e8a7a7' },
    uk: { name: 'Unknown properties', c: '#d4cec6' }
  };

  const num = (s) => {
    if (s === '') return { v: null, est: false };
    const est = s[0] === '~';
    return { v: Number(est ? s.slice(1) : s), est };
  };

  const els = RAW.split('\n').map((line) => {
    const [z, sym, name, mass, cat, phase, year, mp, bp] = line.split('|');
    const m = num(mp), b = num(bp);
    const Z = Number(z);
    let row, col;
    if (Z === 1) { row = 1; col = 1; }
    else if (Z === 2) { row = 1; col = 18; }
    else if (Z <= 18) {
      const start = Z <= 10 ? 3 : 11;
      row = Z <= 10 ? 2 : 3;
      const i = Z - start;
      col = i < 2 ? i + 1 : i + 11;
    } else if (Z <= 54) {
      const start = Z <= 36 ? 19 : 37;
      row = Z <= 36 ? 4 : 5;
      col = Z - start + 1;
    } else {
      const base = Z <= 86 ? 55 : 87;
      const per = Z <= 86 ? 6 : 7;
      const i = Z - base;
      if (i < 2) { row = per; col = i + 1; }
      else if (i < 17) { row = per + 3; col = i + 1; }
      else { row = per; col = i - 13; }
    }
    return {
      z: Z, sym, name, mass: Number(mass), radioactive: Z === 43 || Z === 61 || Z >= 84,
      cat, phase, year: Number(year), mp: m.v, bp: b.v, mpEst: m.est, bpEst: b.est,
      sublimes: sym === 'C' || sym === 'As',
      row, col, fact: FACTS[sym] || '', origin: ORIGIN[sym] || ''
    };
  });

  window.PT = { els, CATS, SETS };
})();
