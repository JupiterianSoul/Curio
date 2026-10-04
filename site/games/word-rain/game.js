'use strict';
function Arcade(o) {
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);
    const stage = $('.arc-stage'), canvas = $('#arc-canvas'), ctx = canvas.getContext('2d');
    const ov = { menu: $('#ov-menu'), pause: $('#ov-pause'), over: $('#ov-over') };
    const STEP = 1 / 120;
    const A = {
        state: 'menu', score: 0, W: o.width || 400, H: o.height || 400, ctx, canvas, stage,
        keys: new Set(), time: 0, bestKey: 'score', STEP, dpr: 1, scale: 1, colors: {}
    };
    const hud = {};
    $$('[data-hud]').forEach((el) => (hud[el.dataset.hud] ||= []).push(el));
    A.hud = (name, v) => { const s = String(v); for (const el of hud[name] || [])
        if (el.textContent !== s)
            el.textContent = s; };
    A.showBest = () => {
        const b = Curio.getBest(A.bestKey) ?? 0;
        A.hud('best', Curio.fmt(Math.max(b, A.state === 'play' || A.state === 'paused' ? A.score : 0)));
    };
    A.setScore = (n) => { A.score = n; A.hud('score', Curio.fmt(n)); A.showBest(); };
    A.addScore = (n) => A.setScore(A.score + n);
    function readColors() {
        const cs = getComputedStyle(document.documentElement);
        for (const k of ['bg', 'surface', 'surface-2', 'ink', 'ink-2', 'ink-3', 'line', 'accent', 'good', 'bad', 'warn']) {
            A.colors[k.replace('-2', '2').replace('-3', '3')] = cs.getPropertyValue('--' + k).trim();
        }
        A.dark = Curio.isDark();
    }
    readColors();
    addEventListener('curio:theme', () => requestAnimationFrame(readColors));
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => requestAnimationFrame(readColors));
    function fit() {
        const r = stage.getBoundingClientRect();
        const aw = Math.max(120, r.width), ah = Math.max(120, r.height);
        if (o.size) {
            const s = o.size(aw, ah);
            A.W = s.w;
            A.H = s.h;
        }
        const sc = Math.min(aw / A.W, ah / A.H);
        const cw = Math.max(1, Math.floor(A.W * sc)), ch = Math.max(1, Math.floor(A.H * sc));
        A.dpr = Math.min(3, window.devicePixelRatio || 1);
        A.scale = sc;
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
        canvas.width = Math.round(cw * A.dpr);
        canvas.height = Math.round(ch * A.dpr);
        o.resized?.();
        render(0);
    }
    function render(alpha) {
        ctx.setTransform(canvas.width / A.W, 0, 0, canvas.height / A.H, 0, 0);
        o.draw(ctx, alpha);
    }
    let last = 0, acc = 0, raf = 0;
    function frame(t) {
        raf = requestAnimationFrame(frame);
        let dt = last ? (t - last) / 1000 : 0;
        last = t;
        if (dt > 0.1)
            dt = 0.1;
        A.time += dt;
        if (A.state === 'play') {
            acc += dt;
            let n = 0;
            while (acc >= STEP && n++ < 16) {
                o.update(STEP);
                acc -= STEP;
                if (A.state !== 'play') {
                    acc = 0;
                    break;
                }
            }
        }
        else {
            acc = 0;
            o.idle?.(dt);
        }
        render(acc / STEP);
    }
    let overAt = 0;
    function show(name) {
        for (const k in ov)
            if (ov[k])
                ov[k].hidden = k !== name;
        if (name)
            ov[name].querySelector('.c-btn')?.focus({ preventScroll: true });
    }
    function releaseAll() { for (const k of [...A.keys]) {
        A.keys.delete(k);
        o.key?.(k, false, false);
    } }
    A.start = () => {
        releaseAll();
        A.score = 0;
        A.state = 'play';
        o.reset();
        A.setScore(A.score);
        show(null);
        last = 0;
        acc = 0;
        if (document.activeElement && document.activeElement !== document.body)
            document.activeElement.blur();
        o.start?.();
    };
    A.pause = () => {
        if (A.state !== 'play')
            return;
        releaseAll();
        A.state = 'paused';
        show('pause');
        Curio.beep(392, 0.06, 'triangle', 0.08);
    };
    A.resume = () => {
        if (A.state !== 'paused')
            return;
        A.state = 'play';
        show(null);
        last = 0;
        acc = 0;
        if (document.activeElement && document.activeElement !== document.body)
            document.activeElement.blur();
    };
    A.menu = () => { releaseAll(); A.state = 'menu'; o.menu?.(); show('menu'); A.showBest(); };
    A.over = ({ title = 'Game over', emoji = '💥', msg = '' } = {}) => {
        if (A.state === 'over')
            return;
        releaseAll();
        A.state = 'over';
        const r = Curio.best(A.bestKey, A.score);
        const box = ov.over;
        const set = (n, v) => { const el = box.querySelector(`[data-o="${n}"]`); if (el)
            el.textContent = v; };
        set('emoji', emoji);
        set('title', title);
        set('score', Curio.fmt(A.score));
        set('best', Curio.fmt(r.best));
        set('msg', msg);
        const isNew = r.isNew && A.score > 0;
        box.querySelector('[data-o="new"]').hidden = !isNew;
        if (isNew) {
            Curio.confetti();
            [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.12), 120 + i * 90));
        }
        overAt = performance.now();
        show('over');
        A.showBest();
    };
    $$('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const a = b.dataset.act;
        if (a === 'start' || a === 'restart') {
            if (performance.now() - overAt > 450)
                A.start();
        }
        else if (a === 'resume')
            A.resume();
        else if (a === 'menu')
            A.menu();
        else if (a === 'pause') {
            if (A.state === 'play')
                A.pause();
            else if (A.state === 'paused')
                A.resume();
        }
    }));
    const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
    const norm = (k) => (k.length === 1 ? k.toLowerCase() : k === 'Spacebar' ? ' ' : k);
    function press(k, down, repeat) {
        if (down)
            A.keys.add(k);
        else
            A.keys.delete(k);
        o.key?.(k, down, repeat);
    }
    A.press = press;
    addEventListener('keydown', (e) => {
        if (e.target.closest?.('input, select, textarea'))
            return;
        if (e.ctrlKey || e.metaKey || e.altKey)
            return;
        const k = norm(e.key);
        const onBtn = e.target.closest?.('button, a');
        if (k === 'p' || k === 'Escape') {
            if (A.state === 'play') {
                A.pause();
                e.preventDefault();
            }
            else if (A.state === 'paused') {
                A.resume();
                e.preventDefault();
            }
            return;
        }
        if (A.state !== 'play') {
            if ((k === ' ' || k === 'Enter') && !onBtn && !e.repeat) {
                e.preventDefault();
                if (A.state === 'paused')
                    A.resume();
                else if (performance.now() - overAt > 450)
                    A.start();
            }
            return;
        }
        if (PREVENT.has(k) || (o.capture || []).includes(k))
            e.preventDefault();
        if (e.repeat) {
            o.key?.(k, true, true);
            return;
        }
        press(k, true, false);
    });
    addEventListener('keyup', (e) => { const k = norm(e.key); if (A.keys.has(k))
        press(k, false, false); });
    addEventListener('blur', () => { releaseAll(); A.pause(); });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            A.pause();
            cancelAnimationFrame(raf);
            raf = 0;
        }
        else if (!raf) {
            last = 0;
            raf = requestAnimationFrame(frame);
        }
    });
    $$('.arc-pad [data-key]').forEach((btn) => {
        const k = btn.dataset.key;
        let on = false;
        const down = (e) => {
            e.preventDefault();
            document.body.classList.add('arc-touch');
            if (on)
                return;
            on = true;
            btn.classList.add('is-down');
            try {
                btn.setPointerCapture(e.pointerId);
            }
            catch { }
            if (A.state === 'play')
                press(k, true, false);
        };
        const up = () => {
            if (!on)
                return;
            on = false;
            btn.classList.remove('is-down');
            if (A.keys.has(k))
                press(k, false, false);
        };
        btn.addEventListener('pointerdown', down);
        btn.addEventListener('pointerup', up);
        btn.addEventListener('pointercancel', up);
        btn.addEventListener('lostpointercapture', up);
        btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
    const toLogical = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * A.W, y: (e.clientY - r.top) / r.height * A.H };
    };
    A.toLogical = toLogical;
    let ptr = null;
    stage.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.arc-ov'))
            return;
        if (e.pointerType === 'touch')
            document.body.classList.add('arc-touch');
        if (A.state !== 'play')
            return;
        if (e.button > 0)
            return;
        e.preventDefault();
        ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moved: false };
        try {
            stage.setPointerCapture(e.pointerId);
        }
        catch { }
        o.pointer?.('down', toLogical(e), e);
    });
    addEventListener('pointermove', (e) => {
        if (A.state !== 'play')
            return;
        o.pointer?.('move', toLogical(e), e);
        if (!ptr || e.pointerId !== ptr.id)
            return;
        const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y;
        const d = o.swipeDist || 26;
        if (Math.hypot(dx, dy) >= d) {
            const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
            ptr.x = e.clientX;
            ptr.y = e.clientY;
            ptr.moved = true;
            o.swipe?.(dir);
        }
    });
    const endPtr = (e) => {
        if (!ptr || e.pointerId !== ptr.id)
            return;
        const p = toLogical(e);
        if (A.state === 'play') {
            if (!ptr.moved && performance.now() - ptr.t < 320 && Math.hypot(e.clientX - ptr.x0, e.clientY - ptr.y0) < 14)
                o.tap?.(p);
            o.pointer?.('up', p, e);
        }
        ptr = null;
    };
    stage.addEventListener('pointerup', endPtr);
    stage.addEventListener('pointercancel', endPtr);
    stage.addEventListener('contextmenu', (e) => e.preventDefault());
    A.beep = (f, d, type, vol) => Curio.beep(f, d, type, vol);
    A.sweep = (f1, f2, d = 0.15, type = 'square', vol = 0.07) => {
        if (Curio.muted)
            return;
        const ac = Curio.audioContext();
        if (!ac)
            return;
        const t = ac.currentTime, osc = ac.createOscillator(), g = ac.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f1, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + d);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        osc.connect(g).connect(ac.destination);
        osc.start(t);
        osc.stop(t + d + 0.02);
    };
    let noiseBuf = null;
    A.noise = (d = 0.3, vol = 0.18, freq = 1200) => {
        if (Curio.muted)
            return;
        const ac = Curio.audioContext();
        if (!ac)
            return;
        if (!noiseBuf) {
            noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
            const ch = noiseBuf.getChannelData(0);
            for (let i = 0; i < ch.length; i++)
                ch[i] = Math.random() * 2 - 1;
        }
        const t = ac.currentTime, src = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
        src.buffer = noiseBuf;
        f.type = 'lowpass';
        f.frequency.setValueAtTime(freq, t);
        f.frequency.exponentialRampToValueAtTime(80, t + d);
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        src.connect(f).connect(g).connect(ac.destination);
        src.start(t);
        src.stop(t + d + 0.02);
    };
    A.fx = {
        list: [],
        clear() { this.list.length = 0; },
        burst(x, y, n, colors, { speed = 160, life = 0.6, size = 3, gravity = 300, spread = Math.PI * 2, angle = 0, drag = 1.5 } = {}) {
            for (let i = 0; i < n; i++) {
                const a = angle + (Math.random() - 0.5) * spread, s = speed * (0.35 + Math.random() * 0.65);
                this.list.push({
                    x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), max: life,
                    size: size * (0.6 + Math.random() * 0.7), c: Array.isArray(colors) ? colors[(Math.random() * colors.length) | 0] : colors, g: gravity, drag
                });
            }
        },
        update(dt) {
            const L = this.list;
            for (let i = L.length - 1; i >= 0; i--) {
                const p = L[i];
                p.life -= dt;
                if (p.life <= 0) {
                    L[i] = L[L.length - 1];
                    L.pop();
                    continue;
                }
                const k = Math.exp(-p.drag * dt);
                p.vx *= k;
                p.vy = p.vy * k + p.g * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }
        },
        draw(g) {
            for (const p of this.list) {
                g.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 1.5));
                g.fillStyle = p.c;
                g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
            g.globalAlpha = 1;
        }
    };
    window.__arcade = A;
    A.boot = () => {
        new ResizeObserver(fit).observe(stage);
        addEventListener('resize', fit);
        fit();
        A.menu();
        raf = requestAnimationFrame(frame);
    };
    return A;
}
function rrect(g, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
}
function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r);
    gg = Math.round((t - gg) * p + gg);
    b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (gg << 8) + b).toString(16).slice(1);
}
function mix(a, b, t) {
    const x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16);
    const c = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
    return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
}
const FONT = 'ui-rounded, "SF Pro Rounded", "Nunito", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif';
(() => {
    const WORDS = [
        'cat dog sun hat cup map pen box fox owl bee egg ice jam key kite lamp moon nest oak pig rain sea star tree',
        'van web yak zoo ant arm bag bat bed bell bird boat book bug bus cake car cow cub day den dot duck ear eel elf',
        'fan fig fish frog gem gift goat gum hen hill hop hug ink jar jet joy kid king leaf lime lion log mud nap net',
        'nut orb pan pea pie pin pop pot pug rat ray red rib rock rose rug sap saw sky sock soup spy tag tea toe top',
        'toy tub urn vet wax wig wind wolf yarn zip blue cold corn crab dart dice dove drum dusk echo fern film flag',
        'foam fork fuzz gold harp hike honk iron jazz jump kiwi lake lava leap mint mist moss mule note oven pear pine',
        'plum pond puma quiz raft reef ring roar salt seal ship silk snow sofa song taco tide tuba vase vine wave yawn',
        'zinc bark beak bolt bone cave chef claw coal cube dune fizz glow hawk heap jolt kelp knot loaf lynx apple',
        'beach bread brick cloud candy chair chalk cliff clock coral crown daisy dream eagle earth fairy feast flame',
        'flute frost ghost giant grape grass heart honey horse igloo jelly jewel juice kayak koala lemon light llama',
        'magic maple melon mouse music night ocean olive otter panda paper party peach pearl piano pilot pizza plant',
        'plume queen quilt radio raven river robot salad scarf shark sheep shell smile snake spoon squid storm sugar',
        'swirl table tiger toast torch tulip uncle unity viola wagon water whale wheat witch zebra badger banana',
        'basket bubble button camera candle carpet castle cheese cherry cookie cotton cowboy dragon engine falcon',
        'finger flower forest garden ginger guitar hammer island jacket jungle kitten ladder lizard marble meadow',
        'mitten monkey muffin nugget orange parrot pepper pickle pirate planet pocket potato puzzle rabbit rocket',
        'saddle silver spider sponge sunset tennis tomato turtle velvet violin waffle walnut window wizard yogurt',
        'zipper avocado balloon bicycle blanket buffalo cabbage cactus capsule caramel caravan cartoon chimney compass',
        'cupcake diamond dolphin dragonfly emerald feather firefly giraffe glacier gorilla harbour hedgehog hamster',
        'jasmine jukebox kangaroo ketchup lantern lobster mammoth mermaid misty monsoon mustard noodles octopus',
        'orchard origami pancake panther peacock pelican penguin pumpkin pyramid raccoon rainbow sandbox sardine',
        'sausage scooter seaweed skyline snowman sparrow spinach sunbeam teapot thunder tornado trumpet unicorn',
        'vampire volcano walrus warrior weasel whisker zeppelin acrobat almanac aquarium backpack bluebird broccoli',
        'calendar carnival chipmunk cinnamon clarinet dinosaur doorbell elephant flamingo goldfish grizzly hurricane',
        'icicle labyrinth lemonade lighthouse marathon meteor milkshake mosquito necklace notebook nightcap overcoat',
        'paradise pinecone popsicle porcupine pretzel quicksand reindeer sandwich scorpion skeleton snowball squirrel',
        'starfish sunflower telescope tortoise treasure umbrella vineyard wildfire woodpecker adventure alligator',
        'amphibian archipelago asteroid avalanche ballerina barbecue blueberry bumblebee butterfly cappuccino',
        'caterpillar celebrate chameleon chocolate chrysalis coconut constellation crocodile dandelion detective',
        'dictionary discovery earthquake electricity encyclopedia equator escalator fireworks fingerprint grasshopper',
        'gymnastics hamburger harmonica helicopter hibernate hippopotamus horizon imagination jellyfish kaleidoscope',
        'kookaburra lemongrass lightning magnifying marshmallow meteorite microscope millennium moonlight motorcycle',
        'mysterious narwhal nightingale observatory orangutan orchestra parachute peppermint photograph pineapple',
        'platypus pomegranate quarterback rattlesnake refrigerator rhinoceros salamander saxophone skateboard',
        'snowflake spaghetti strawberry submarine supernova tambourine tarantula thermometer trampoline tyrannosaurus',
        'underwater velociraptor waterfall watermelon wheelbarrow xylophone zucchini'
    ].join(' ').split(' ');
    const PACKS = {
        mixed: WORDS,
        animals: 'aardvark albatross alpaca antelope armadillo baboon beaver bison bobcat camel caribou cheetah chicken chinchilla cobra cougar coyote crane cricket donkey eagle ferret flamingo gazelle gecko gerbil gibbon heron hyena ibis iguana impala jackal jaguar lemur leopard llama lobster magpie manatee meerkat mongoose moose narwhal ocelot opossum ostrich otter pangolin parrot pelican pigeon piranha puffin python quokka quail raccoon salmon seahorse sloth stingray swan tapir termite toucan vulture wallaby walrus wombat yak zebra ant bat cat cow dog eel elk emu fox gnu hen owl pig ram rat seal bear crab deer duck frog goat hare lark lion mole moth mule newt orca puma slug toad wasp wolf worm'.split(' '),
        space: 'alien apollo asteroid astronaut atmosphere aurora axis binary comet cosmos crater eclipse equinox galaxy gravity helium horizon hubble jupiter kepler lunar mars mercury meteor nebula neptune neutron nova orbit photon planet pluto pulsar quasar radiation rocket satellite saturn solar solstice spaceship spectrum starlight sunspot supernova telescope titan universe uranus venus vacuum zenith gemini orion cassini voyager module launch capsule cosmic stellar moon star sun ring dust void beam flare probe rover dwarf giant tide'.split(' '),
        food: 'almond bagel basil biscuit brownie burrito butter caramel carrot cashew celery cheddar chili chutney cinnamon cobbler croissant crumpet cucumber curry custard dumpling eggplant espresso falafel fudge garlic gnocchi granola guacamole hazelnut hummus kebab lasagna lentil macaron mango meringue mozzarella muffin nachos noodle nutmeg oatmeal omelette paprika pasta pesto pistachio porridge pretzel quiche radish ravioli risotto saffron salsa scone sorbet sushi tofu tortilla truffle vanilla waffle yogurt egg fig jam pie tea bun corn kale leek lime pear plum rice soup stew taco'.split(' '),
        code: 'array boolean buffer bug cache class closure commit compile console debug deploy function hash import integer keyboard lambda loop merge method module mouse network null object pixel pointer python query queue recursion refactor regex render repository runtime script server socket stack string syntax terminal thread token unicode variable vector widget binary cursor database firewall kernel laptop api bit byte code data enum file flag font git heap html json link list node port ram root tab tree type web'.split(' ')
    };
    const H = 600, GROUND = H - 46, FONT_PX = 20;
    const DIFF = { easy: 0.72, normal: 1, hard: 1.3 };
    let TIERS = [];
    const ACH = [
        { id: 'first', name: 'First Drop', d: 'Pop your first word' },
        { id: 'combo20', name: 'Downpour Dancer', d: 'Reach a 20 word combo' },
        { id: 'words50', name: 'Umbrella Pro', d: 'Pop 50 words in one game' },
        { id: 'wpm40', name: 'Quick Fingers', d: 'Finish a game at 40 wpm or more' },
        { id: 'wpm60', name: 'Lightning Typist', d: 'Finish a game at 60 wpm or more' },
        { id: 'level10', name: 'Monsoon', d: 'Reach level 10' },
        { id: 'storm', name: 'Storm Chaser', d: 'Pop a lightning word' },
        { id: 'sprint30', name: 'Sprinter', d: 'Pop 30 words in a 60s sprint' },
        { id: 'daily', name: 'Daily Forecast', d: 'Finish a daily rain' },
        { id: 'packs', name: 'Polyglot', d: 'Play every word pack' },
        { id: 'flawless', name: 'Perfect Aim', d: 'Finish with 100% accuracy and 20+ words' }
    ];
    const SKEY = 'wr2';
    const loadS = () => { const base = { v: 1, mode: 'classic', pack: 'mixed', diff: 'normal', ach: {}, packs: {}, stats: { games: 0, words: 0, chars: 0, bestWpm: 0, bestCombo: 0 }, daily: {} }; const d = Curio.store.get(SKEY, null); return d && d.v === 1 ? { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } } : base; };
    const S = loadS();
    const save = () => Curio.store.set(SKEY, S);
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    let rnd = Math.random;
    const pickR = (arr) => arr[Math.floor(rnd() * arr.length)];
    const randR = (a, b) => a + rnd() * (b - a);
    function seeded(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    const input = document.getElementById('wr-input');
    let words, spawnT, level, cleared, lives, combo, mult, bestCombo, slowT, keys, goodKeys, chars, playT, texts, drops, splashes, recent, flashT, timeLeft, puddle, bolt, fresh = [];
    const mode = () => S.mode, packId = () => (S.mode === 'daily' ? 'mixed' : S.pack);
    const A = Arcade({
        width: 800, height: H, reset, update, draw, pointer, idle, start: onStart,
        size: (w, h) => ({ w: Math.round(Math.max(340, Math.min(1000, H * w / h))), h: H })
    });
    const bestKey = () => (S.mode === 'classic' ? 'score' : S.mode === 'daily' ? 'daily-' + today() : S.mode);
    A.bestKey = bestKey();
    const measure = A.ctx;
    function textW(s) {
        measure.save();
        measure.setTransform(1, 0, 0, 1, 0, 0);
        measure.font = `800 ${FONT_PX}px ${FONT}`;
        const w = measure.measureText(s).width;
        measure.restore();
        return w;
    }
    function buildTiers() {
        const P = PACKS[packId()];
        TIERS = [P.filter((w) => w.length <= 4), P.filter((w) => w.length >= 5 && w.length <= 6), P.filter((w) => w.length >= 7 && w.length <= 8), P.filter((w) => w.length >= 9)];
        for (let i = 0; i < 4; i++) if (!TIERS[i].length) TIERS[i] = TIERS[Math.max(0, i - 1)].length ? TIERS[Math.max(0, i - 1)] : P;
    }
    function reset() {
        A.bestKey = bestKey();
        rnd = S.mode === 'daily' ? seeded([...today()].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) : Math.random;
        buildTiers();
        words = [];
        spawnT = 0.6;
        level = 1;
        cleared = 0;
        lives = 3;
        combo = 0;
        mult = 1;
        bestCombo = 0;
        slowT = 0;
        keys = 0;
        goodKeys = 0;
        chars = 0;
        playT = 0;
        texts = [];
        splashes = [];
        recent = [];
        flashT = 0;
        puddle = 0;
        bolt = null;
        fresh = [];
        timeLeft = S.mode === 'sprint' ? 60 : S.mode === 'daily' ? 90 : 0;
        input.value = '';
        A.fx.clear();
        hud();
    }
    function onStart() {
        input.disabled = false;
        input.value = '';
        input.focus({ preventScroll: true });
        S.packs[packId()] = 1;
        if (Object.keys(PACKS).every((k) => S.packs[k])) award('packs');
        save();
    }
    const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    function hud() {
        A.hud('level', level);
        if (timeLeft > 0 || S.mode === 'sprint' || S.mode === 'daily') { A.hud('livesLbl', 'Time'); A.hud('lives', fmtT(Math.ceil(Math.max(0, timeLeft)))); }
        else if (S.mode === 'zen') { A.hud('livesLbl', 'Zen'); A.hud('lives', '∞'); }
        else { A.hud('livesLbl', 'Lives'); A.hud('lives', lives > 0 ? '♥'.repeat(lives) : '0'); }
        A.hud('combo', '×' + mult);
    }
    function award(id) {
        if (S.ach[id]) return;
        S.ach[id] = Date.now();
        fresh.push(id);
        const a = ACH.find((x) => x.id === id);
        if (a && A.state === 'play') Curio.toast(`🏅 ${a.name}`);
    }
    function pickWord() {
        const weights = [1, level >= 2 ? Math.min(1.2, (level - 1) * 0.4) : 0, level >= 4 ? Math.min(1, (level - 3) * 0.3) : 0, level >= 6 ? Math.min(0.8, (level - 5) * 0.2) : 0];
        let r = rnd() * weights.reduce((a, b) => a + b, 0), t = 0;
        while (t < 3 && r > weights[t]) { r -= weights[t]; t++; }
        let w;
        for (let i = 0; i < 12; i++) {
            w = pickR(TIERS[t]);
            if (!recent.includes(w) && !words.some((o) => o.text[0] === w[0])) break;
        }
        recent.push(w);
        if (recent.length > 40) recent.shift();
        return w;
    }
    function spawn(demo) {
        const text = pickWord();
        const w = textW(text) + 26;
        let x = 0;
        for (let i = 0; i < 10; i++) {
            x = randR(10, Math.max(12, A.W - w - 10));
            if (!words.some((o) => o.y < 70 && x < o.x + o.w + 8 && o.x < x + w + 8)) break;
        }
        const r = rnd();
        const kind = demo ? 'normal' : level >= 2 && r < 0.05 ? 'gold' : level >= 3 && r < 0.09 ? 'ice' : level >= 4 && r < 0.12 ? 'storm' : S.mode === 'classic' && level >= 3 && lives < 3 && r < 0.14 ? 'life' : 'normal';
        const sp = (24 + level * 5.5) * DIFF[S.diff] * randR(0.85, 1.15) * (1 - Math.min(0.3, (text.length - 4) * 0.025)) * (S.mode === 'zen' ? 0.8 : 1);
        words.push({ text, x, y: 18, w, sp, kind, born: A.time, wob: rnd() * 7, pop: 0 });
    }
    function target() {
        const v = input.value.toLowerCase().replace(/[^a-z]/g, '');
        if (!v) return null;
        let best = null;
        for (const w of words) if (w.text.startsWith(v) && (!best || w.y > best.y)) best = w;
        return best;
    }
    function onInput() {
        if (A.state !== 'play') { input.value = ''; return; }
        const raw = input.value;
        const v = raw.toLowerCase().replace(/[^a-z]/g, '');
        if (v !== raw) input.value = v;
        if (!v) return;
        keys++;
        const t = target();
        if (!t) {
            input.value = v.slice(0, -1);
            combo = 0;
            mult = 1;
            hud();
            A.beep(110, 0.1, 'sawtooth', 0.05);
            navigator.vibrate?.(25);
            input.classList.remove('is-bad');
            void input.offsetWidth;
            input.classList.add('is-bad');
            return;
        }
        goodKeys++;
        t.pop = 0.15;
        A.beep(600 + v.length * 40, 0.025, 'square', 0.025);
        A.fx.burst(t.x + 13 + textW(v), t.y, 2, ['#ffffff', '#ff8a6b'], { speed: 60, life: 0.3, size: 2, gravity: 100 });
        if (v === t.text) clearWord(t);
    }
    function clearWord(t, chain) {
        const i = words.indexOf(t);
        if (i < 0) return;
        words.splice(i, 1);
        if (!chain) input.value = '';
        cleared++;
        S.stats.words++;
        chars += t.text.length + 1;
        combo++;
        bestCombo = Math.max(bestCombo, combo);
        mult = Math.min(5, 1 + Math.floor(combo / 5));
        const pts = t.text.length * 10 * mult * (t.kind === 'gold' ? 3 : 1);
        A.addScore(pts);
        award('first');
        if (combo >= 20) award('combo20');
        if (cleared >= 50) award('words50');
        const cx = t.x + t.w / 2, cy = t.y;
        texts.push({ x: cx, y: cy - 10, s: '+' + pts, t: 0.9, c: t.kind === 'gold' ? '#ffd23f' : '#ffffff' });
        const cols = t.kind === 'gold' ? ['#ffd23f', '#fff3a0'] : t.kind === 'ice' ? ['#bdf0ff', '#ffffff'] : t.kind === 'storm' ? ['#ffe14d', '#b18cff'] : t.kind === 'life' ? ['#ff5a7a', '#ffd1dc'] : ['#9fd8ff', '#ffffff'];
        A.fx.burst(cx, cy, 10 + t.text.length * 2, cols, { speed: 170, life: 0.6, size: 3.5, gravity: 260 });
        if (!chain) [784, 988, 1175].slice(0, 1 + Math.min(2, Math.floor(combo / 5))).forEach((f, k) => setTimeout(() => A.beep(f + mult * 20, 0.07, 'triangle', 0.06), k * 50));
        if (t.kind === 'ice') {
            slowT = 5;
            Curio.toast('Brrr! Rain slowed down');
            A.sweep(1600, 400, 0.5, 'sine', 0.06);
        }
        if (t.kind === 'life' && lives < 5) { lives++; Curio.toast('☂️ Umbrella! Extra life'); A.sweep(500, 1200, 0.3, 'triangle', 0.06); }
        if (t.kind === 'storm' && !chain) {
            flashT = 0.5;
            bolt = { x: cx, t: 0.35, seed: Math.random() * 1000 };
            award('storm');
            A.noise(0.7, 0.2, 2000);
            navigator.vibrate?.([40, 30, 40]);
            for (const o of words.slice()) clearWord(o, true);
            Curio.toast('Lightning! Screen cleared');
        }
        if (combo > 0 && combo % 5 === 0 && !chain) texts.push({ x: A.W / 2, y: H * 0.35, s: `Combo ×${mult}`, t: 1.2, c: '#ffd23f', big: true });
        const newLevel = 1 + Math.floor(cleared / (S.mode === 'zen' ? 15 : 10));
        if (newLevel > level) {
            level = newLevel;
            if (level >= 10) award('level10');
            Curio.toast(`Level ${level}: heavier rain`);
            [523, 659, 784].forEach((f, k) => setTimeout(() => A.beep(f, 0.1, 'triangle', 0.06), 200 + k * 90));
        }
        if (S.mode === 'classic' && cleared % 25 === 0 && lives < 5) {
            lives++;
            Curio.toast('Extra life!');
        }
        hud();
    }
    function landed(w) {
        combo = 0;
        mult = 1;
        puddle = Math.min(1, puddle + 0.08);
        if (S.mode === 'classic') { lives--; A.shake = 6; navigator.vibrate?.(50); }
        hud();
        splashes.push({ x: w.x + w.w / 2, t: 0, w: w.w });
        for (let i = 0; i < w.text.length; i++) {
            A.fx.burst(w.x + 13 + i * (w.w - 26) / w.text.length, GROUND, 2, ['#7cc4ff', '#cfe9ff'], { speed: 140, life: 0.6, size: 3, gravity: 500, spread: 1.6, angle: -Math.PI / 2 });
        }
        A.sweep(400, 90, 0.35, 'triangle', 0.09);
        if (input.value && !target()) input.value = '';
    }
    function sim(dt, demo) {
        const slow = slowT > 0 ? 0.45 : 1;
        slowT = Math.max(0, slowT - dt);
        for (let i = words.length - 1; i >= 0; i--) {
            const w = words[i];
            w.y += w.sp * slow * dt;
            w.pop = Math.max(0, w.pop - dt);
            if (w.y >= GROUND - 6) {
                words.splice(i, 1);
                if (!demo) landed(w);
                else splashes.push({ x: w.x + w.w / 2, t: 0, w: w.w });
            }
        }
        for (let i = splashes.length - 1; i >= 0; i--) {
            splashes[i].t += dt;
            if (splashes[i].t > 0.8) splashes.splice(i, 1);
        }
        for (let i = texts.length - 1; i >= 0; i--) {
            texts[i].t -= dt;
            texts[i].y -= 30 * dt;
            if (texts[i].t <= 0) texts.splice(i, 1);
        }
        const rainK = demo ? 1 : 0.6 + Math.min(1.4, level * 0.12);
        for (const d of drops) {
            d.y += d.v * dt * (0.8 + rainK * 0.3);
            d.x -= d.v * 0.12 * dt;
            if (d.y > GROUND) { if (Math.random() < 0.15) splashes.push({ x: d.x, t: 0.5, w: 6 }); d.y = -20; d.x = Math.random() * (A.W + 60); }
        }
        flashT = Math.max(0, flashT - dt);
        if (bolt) { bolt.t -= dt; if (bolt.t <= 0) bolt = null; }
        A.shake = Math.max(0, (A.shake || 0) - dt * 30);
        A.fx.update(dt);
    }
    function finish(title, emoji) {
        const mins = Math.max(playT, 1) / 60;
        const wpm = Math.round(chars / 5 / mins);
        const acc = keys ? Math.round(goodKeys / keys * 100) : 100;
        input.value = '';
        input.blur();
        S.stats.games++;
        S.stats.chars += chars;
        S.stats.bestWpm = Math.max(S.stats.bestWpm, wpm);
        S.stats.bestCombo = Math.max(S.stats.bestCombo, bestCombo);
        if (cleared >= 5 && wpm >= 40) award('wpm40');
        if (cleared >= 5 && wpm >= 60) award('wpm60');
        if (S.mode === 'sprint' && cleared >= 30) award('sprint30');
        if (S.mode === 'daily') { award('daily'); S.daily[today()] = Math.max(S.daily[today()] || 0, A.score); }
        if (acc === 100 && cleared >= 20) award('flawless');
        save();
        lastResult = { wpm, acc, cleared };
        A.over({
            title, emoji,
            msg: `${cleared} words cleared, about ${wpm} wpm at ${acc}% accuracy, best combo ${bestCombo}. ${wpm >= 60 ? 'Your keyboard is smoking.' : wpm >= 35 ? 'Quick fingers!' : 'The puddles thank you for your service.'}`
        });
        const el = document.querySelector('[data-o="badges"]');
        el.innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="wr-badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
        paintMenu();
    }
    let lastResult = null;
    function update(dt) {
        playT += dt;
        if (timeLeft > 0) {
            const before = Math.ceil(timeLeft);
            timeLeft -= dt;
            if (Math.ceil(timeLeft) !== before) { hud(); if (timeLeft < 5.5 && timeLeft > 0) A.beep(880, 0.04, 'square', 0.04); }
            if (timeLeft <= 0) { finish(S.mode === 'daily' ? 'Daily rain over' : 'Time!', '⏱️'); return; }
        }
        spawnT -= dt * (slowT > 0 ? 0.5 : 1);
        if (spawnT <= 0) {
            spawn(false);
            spawnT = Math.max(0.75, 2.5 - level * 0.17) * randR(0.8, 1.2) / Math.sqrt(DIFF[S.diff]) * (S.mode === 'zen' ? 1.25 : 1);
        }
        sim(dt, false);
        if (S.mode === 'classic' && lives <= 0) finish('Washed out', '🌧️');
    }
    let demoT = 0;
    function idle(dt) {
        if (A.state !== 'menu') return;
        demoT -= dt;
        if (demoT <= 0) {
            demoT = Curio.rand(0.8, 1.6);
            if (words.length < 6) spawn(true);
        }
        sim(dt, true);
    }
    function pointer(type) {
        if (type === 'down') input.focus({ preventScroll: true });
    }
    function cloudPill(g, x, y, w, hgt) {
        rrect(g, x, y - hgt / 2, w, hgt, hgt / 2);
        g.moveTo(x + w * 0.3 + 10, y - hgt / 2 + 2);
        g.arc(x + w * 0.3, y - hgt / 2 + 2, 10, 0, Math.PI * 2);
        g.moveTo(x + w * 0.62 + 13, y - hgt / 2 + 1);
        g.arc(x + w * 0.62, y - hgt / 2 + 1, 13, 0, Math.PI * 2);
    }
    function drawWord(g, w, tgt, typedLen) {
        const s = 1 + w.pop * 0.6;
        const x = w.x, y = w.y + Math.sin(A.time * 2 + w.wob) * 1.5;
        const hgt = 30;
        g.save();
        g.translate(x + w.w / 2, y);
        g.scale(s, s);
        g.translate(-x - w.w / 2, -y);
        const fill = w.kind === 'gold' ? '#fff3c4' : w.kind === 'ice' ? '#dff6ff' : w.kind === 'storm' ? '#efe6ff' : w.kind === 'life' ? '#ffe3ea' : '#ffffff';
        const edge = w.kind === 'gold' ? '#f0b400' : w.kind === 'ice' ? '#47b6e6' : w.kind === 'storm' ? '#8c5cff' : w.kind === 'life' ? '#ff5a7a' : 'rgba(30,50,80,.25)';
        g.strokeStyle = 'rgba(200,225,255,.5)';
        g.lineWidth = 1.5;
        g.beginPath();
        for (let k = 0; k < 3; k++) { const dx = x + w.w * (0.25 + k * 0.25); const off = (A.time * 60 + k * 9) % 18; g.moveTo(dx, y + hgt / 2 + off); g.lineTo(dx - 1, y + hgt / 2 + off + 6); }
        g.stroke();
        g.fillStyle = 'rgba(0,0,0,.18)';
        g.beginPath();
        cloudPill(g, x + 2, y + 3, w.w, hgt);
        g.fill();
        const gr = g.createLinearGradient(0, y - hgt, 0, y + hgt / 2);
        gr.addColorStop(0, '#ffffff');
        gr.addColorStop(1, fill);
        g.fillStyle = gr;
        g.beginPath();
        cloudPill(g, x, y, w.w, hgt);
        g.fill();
        g.lineWidth = tgt ? 3 : 1.5;
        g.strokeStyle = tgt ? '#ff5a36' : edge;
        g.beginPath();
        rrect(g, x, y - hgt / 2, w.w, hgt, hgt / 2);
        g.stroke();
        const near = (w.y / GROUND);
        if (near > 0.75) {
            g.fillStyle = `rgba(255,70,70,${(near - 0.75) * 1.4})`;
            g.beginPath();
            rrect(g, x, y - hgt / 2, w.w, hgt, hgt / 2);
            g.fill();
        }
        g.font = `800 ${FONT_PX}px ${FONT}`;
        g.textAlign = 'left';
        g.textBaseline = 'middle';
        const tx = x + 13;
        if (typedLen) {
            const a = w.text.slice(0, typedLen);
            g.fillStyle = '#ff5a36';
            g.fillText(a, tx, y + 1);
            g.fillStyle = '#1d2433';
            g.fillText(w.text.slice(typedLen), tx + textW(a), y + 1);
        }
        else {
            g.fillStyle = '#1d2433';
            g.fillText(w.text, tx, y + 1);
        }
        if (w.kind !== 'normal') {
            g.font = `14px ${FONT}`;
            g.textAlign = 'center';
            g.fillText(w.kind === 'gold' ? '⭐' : w.kind === 'ice' ? '❄️' : w.kind === 'life' ? '☂️' : '⚡', x + w.w, y - hgt / 2);
        }
        g.textBaseline = 'alphabetic';
        g.restore();
    }
    function drawScene(g, W) {
        const dark = A.dark;
        g.fillStyle = dark ? '#18233a' : '#8fa8c2';
        g.beginPath();
        g.moveTo(0, GROUND);
        for (let x = 0; x <= W; x += 40) g.lineTo(x, GROUND - 70 - Math.sin(x * 0.008) * 30 - Math.sin(x * 0.021 + 1) * 14);
        g.lineTo(W, GROUND);
        g.fill();
        g.fillStyle = dark ? '#1c3326' : '#6d9a62';
        g.beginPath();
        g.moveTo(0, GROUND);
        for (let x = 0; x <= W; x += 30) g.lineTo(x, GROUND - 26 - Math.sin(x * 0.013 + 2) * 12);
        g.lineTo(W, GROUND);
        g.fill();
        const houses = Math.floor(W / 160);
        for (let i = 0; i < houses; i++) {
            const hx = 60 + i * 160 + ((i * 53) % 40), hw = 46, hh = 34;
            g.fillStyle = dark ? '#3a3247' : '#d9c7b0';
            g.fillRect(hx, GROUND - hh, hw, hh);
            g.fillStyle = dark ? '#5a2f3a' : '#b5523b';
            g.beginPath(); g.moveTo(hx - 6, GROUND - hh); g.lineTo(hx + hw / 2, GROUND - hh - 22); g.lineTo(hx + hw + 6, GROUND - hh); g.fill();
            g.fillStyle = dark ? '#ffd56b' : '#7aa5c9';
            g.fillRect(hx + 8, GROUND - hh + 9, 10, 10);
            g.fillRect(hx + 28, GROUND - hh + 9, 10, 10);
            g.fillStyle = dark ? '#2a2233' : '#8a5a3c';
            g.fillRect(hx + 18, GROUND - 16, 10, 16);
        }
    }
    function draw(g) {
        const W = A.W, dark = A.dark;
        g.save();
        if (A.shake > 0.1) g.translate((Math.random() - 0.5) * A.shake, (Math.random() - 0.5) * A.shake);
        const sky = g.createLinearGradient(0, 0, 0, H);
        const stormy = Math.min(1, (level || 1) / 12);
        sky.addColorStop(0, dark ? '#0d1424' : mix('#6f8fb0', '#3e4f66', stormy));
        sky.addColorStop(1, dark ? '#1d2a40' : mix('#b9cde0', '#7f93aa', stormy));
        g.fillStyle = sky;
        g.fillRect(-10, -10, W + 20, H + 20);
        drawScene(g, W);
        if (slowT > 0) {
            g.fillStyle = `rgba(170,230,255,${Math.min(0.25, slowT * 0.1)})`;
            g.fillRect(0, 0, W, H);
        }
        g.strokeStyle = dark ? 'rgba(160,190,230,.25)' : 'rgba(255,255,255,.45)';
        g.lineWidth = 1.2;
        g.beginPath();
        for (const d of drops) {
            g.moveTo(d.x, d.y);
            g.lineTo(d.x - d.l * 0.12, d.y + d.l);
        }
        g.stroke();
        for (let layer = 0; layer < 2; layer++) {
            g.fillStyle = layer ? (dark ? '#2a3550' : '#e8eef5') : (dark ? '#202a40' : '#cfd9e4');
            for (let i = 0; i < Math.ceil(W / 90) + 2; i++) {
                const sp = layer ? 6 : 3;
                const cx = i * 90 + ((A.time * sp + layer * 40) % 90) - 45;
                g.beginPath();
                g.arc(cx, -6 + layer * 4, 42, 0, 7);
                g.arc(cx + 40, 4 + layer * 4, 30, 0, 7);
                g.fill();
            }
        }
        if (bolt) {
            g.strokeStyle = `rgba(255,240,150,${bolt.t * 3})`;
            g.lineWidth = 4;
            g.beginPath();
            let bx = bolt.x, by = 20;
            g.moveTo(bx, by);
            for (let k = 0; k < 8; k++) { bx += Math.sin(bolt.seed + k * 3.1) * 30; by += GROUND / 8; g.lineTo(bx, by); }
            g.stroke();
        }
        g.fillStyle = dark ? '#1f3b2a' : '#5aa84a';
        g.fillRect(0, GROUND, W, H - GROUND);
        g.fillStyle = dark ? '#28503a' : '#6cc05a';
        g.fillRect(0, GROUND, W, 6);
        g.strokeStyle = dark ? '#2f5c42' : '#7fd06a';
        g.lineWidth = 2;
        g.beginPath();
        for (let x = 4; x < W; x += 11) { g.moveTo(x, GROUND + 2); g.lineTo(x - 3, GROUND - 5 - (x * 7 % 5)); }
        g.stroke();
        g.fillStyle = dark ? 'rgba(90,140,200,.35)' : 'rgba(120,180,240,.6)';
        for (let i = 0; i < 4; i++) {
            g.beginPath();
            g.ellipse((i + 0.5) * W / 4 + ((i * 37) % 30), GROUND + 24, 40 + puddle * 50, 6 + puddle * 3, 0, 0, 7);
            g.fill();
        }
        for (const s of splashes) {
            g.strokeStyle = `rgba(200,230,255,${1 - s.t / 0.8})`;
            g.lineWidth = 2;
            g.beginPath();
            g.ellipse(s.x, GROUND + 4, s.w * 0.3 + s.t * 60, 4 + s.t * 8, 0, 0, 7);
            g.stroke();
        }
        const t = A.state === 'play' || A.state === 'paused' ? target() : null;
        const typed = input.value.length;
        for (const w of words) if (w !== t) drawWord(g, w, false, 0);
        if (t) drawWord(g, t, true, typed);
        A.fx.draw(g);
        g.textAlign = 'center';
        for (const tx of texts) {
            g.globalAlpha = Math.min(1, tx.t * 2);
            g.font = `900 ${tx.big ? 30 : 18}px ${FONT}`;
            g.lineWidth = 4;
            g.strokeStyle = 'rgba(20,30,50,.5)';
            g.strokeText(tx.s, tx.x, tx.y);
            g.fillStyle = tx.c;
            g.fillText(tx.s, tx.x, tx.y);
        }
        g.globalAlpha = 1;
        if (flashT > 0) {
            g.fillStyle = `rgba(255,255,255,${flashT})`;
            g.fillRect(0, 0, W, H);
        }
        if (A.state === 'play' && playT < 3) {
            g.globalAlpha = Math.min(1, 3 - playT);
            g.font = `700 16px ${FONT}`;
            g.fillStyle = '#ffffff';
            g.fillText(S.mode === 'zen' ? 'Zen mode: no lives, just rain. Pause and pick Menu to stop.' : 'Type the words before they hit the grass', W / 2, GROUND - 20);
            g.globalAlpha = 1;
        }
        g.restore();
    }
    function paintMenu() {
        document.querySelectorAll('[data-seg]').forEach((sg) => {
            const k = sg.dataset.seg;
            sg.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S[k])));
            if (k === 'pack') sg.querySelectorAll('button').forEach((b) => { b.disabled = S.mode === 'daily'; });
        });
        A.bestKey = bestKey();
        A.showBest();
        const st = S.stats;
        const el = document.querySelector('[data-stats]');
        if (el) el.innerHTML = `<div class="c-stat"><b>${st.games}</b><span>Games</span></div><div class="c-stat"><b>${st.words}</b><span>Words</span></div><div class="c-stat"><b>${st.bestWpm}</b><span>Best wpm</span></div><div class="c-stat"><b>${st.bestCombo}</b><span>Best combo</span></div>`;
        const bd = document.querySelector('[data-badges]');
        if (bd) bd.innerHTML = ACH.map((a) => `<span class="wr-badge${S.ach[a.id] ? ' on' : ''}" title="${a.d}">${S.ach[a.id] ? '★' : '☆'} ${a.name}</span>`).join('');
        const bc = document.querySelector('[data-badge-count]');
        if (bc) bc.textContent = `(${ACH.filter((a) => S.ach[a.id]).length}/${ACH.length})`;
    }
    document.querySelectorAll('[data-seg]').forEach((sg) => sg.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || b.disabled) return;
        S[sg.dataset.seg] = b.dataset.v; save(); paintMenu();
        Curio.beep(520, 0.04, 'triangle', 0.05);
        if (sg.dataset.seg === 'pack' && A.state === 'menu') { buildTiers(); words = []; }
    }));
    document.querySelector('[data-share]').addEventListener('click', () => {
        const r = lastResult || { wpm: 0, acc: 100, cleared: 0 };
        const what = S.mode === 'daily' ? `Daily ${today()}` : S.mode === 'sprint' ? '60s Sprint' : S.mode === 'zen' ? 'Zen' : 'Classic';
        const txt = `Curio Word Rain · ${what} (${packId()})\n🌧️ ${A.score} points, ${r.cleared} words, ${r.wpm} wpm, ${r.acc}% accuracy`;
        (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
    });
    drops = Array.from({ length: 90 }, () => ({ x: Math.random() * 1000, y: Math.random() * H, v: 300 + Math.random() * 250, l: 10 + Math.random() * 14 }));
    input.addEventListener('input', onInput);
    input.addEventListener('animationend', () => input.classList.remove('is-bad'));
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            A.pause();
        }
        else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.value = '';
        }
    });
    const basePause = A.pause, baseResume = A.resume, baseMenu = A.menu;
    A.pause = () => { basePause(); if (A.state === 'paused') input.blur(); };
    A.resume = () => { baseResume(); if (A.state === 'play') input.focus({ preventScroll: true }); };
    A.menu = () => { if (A.state === 'paused' && S.mode === 'zen' && cleared > 0) { A.state = 'play'; finish('Zen session over', '🌦️'); return; } baseMenu(); paintMenu(); };
    const wrap = document.querySelector('.arc-wrap');
    const vv = window.visualViewport;
    const fitVV = () => {
        if (!vv) return;
        const h = Math.round(vv.height - 52);
        if (vv.height < innerHeight - 80) wrap.style.height = h + 'px';
        else wrap.style.height = '';
        window.scrollTo(0, 0);
    };
    vv?.addEventListener('resize', fitVV);
    vv?.addEventListener('scroll', () => window.scrollTo(0, 0));
    A.debug = () => ({
        words: words.map((w) => w.text), level, lives, cleared, combo, mult, timeLeft,
        type(s) { input.value = s; onInput(); },
        add(text, y) { words.push({ text, x: 40, y: y || 100, w: textW(text) + 26, sp: 30, kind: 'normal', born: A.time, wob: 0, pop: 0 }); },
        hold() { spawnT = 999; words.length = 0; },
        drop() { for (const w of words) w.y = GROUND; },
        setTime(t) { timeLeft = t; },
        set(k, v) { S[k] = v; paintMenu(); }
    });
    reset();
    paintMenu();
    A.boot();
})();
