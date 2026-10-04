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
        const r = Curio.best(A.bestKey, A.score, !o.lower);
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
    Curio.drag(canvas, {
        start(p) {
            const e = p.event;
            if (e.pointerType === 'touch') document.body.classList.add('arc-touch');
            if (A.state !== 'play') { ptr = null; return; }
            e.preventDefault();
            ptr = { x: p.clientX, y: p.clientY, x0: p.clientX, y0: p.clientY, t: performance.now(), moved: false };
            o.pointer?.('down', toLogical(p), e);
        },
        move(p) {
            if (!ptr || A.state !== 'play') return;
            o.pointer?.('move', toLogical(p), p.event);
            if (Math.hypot(p.clientX - ptr.x0, p.clientY - ptr.y0) > 14) ptr.moved = true;
        },
        end(p) {
            if (!ptr) return;
            if (!p || A.state !== 'play') o.pointer?.('cancel', null, null);
            else {
                const q = toLogical(p);
                if (!ptr.moved && performance.now() - ptr.t < 320) o.tap?.(q);
                o.pointer?.('up', q, p.event);
            }
            ptr = null;
        }
    });
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
    const CW = 900, CH = 540, R = 7, CUP = 11, WALL = 5, MAXV = 980, MAXDRAG = 150, MAXSTROKES = 10;
    const COURSES = window.MG_COURSES;
    const HAZ = { meadow: 'water', canyon: 'lava', glacier: 'frost', cosmos: 'void' };
    const SANDCOL = { meadow: ['#e9cf8f', '#d4b46c'], canyon: ['#f3c98a', '#d9a35c'], glacier: ['#ffffff', '#b8d4e8'], cosmos: ['#b9a7ff', '#8d77e8'] };
    const SKINS = [
        { id: 'white', name: 'Classic', need: null, c: ['#ffffff', '#d9dde3'] },
        { id: 'coral', name: 'Coral', need: 'birdie', c: ['#ff8a6b', '#e2502e'] },
        { id: 'mint', name: 'Mint', need: 'clean', c: ['#8ff0c4', '#2fb47c'] },
        { id: 'gold', name: 'Gold', need: 'ace', c: ['#ffe27a', '#d69a12'] },
        { id: 'galaxy', name: 'Galaxy', need: 'cosmos', c: ['#c58bff', '#4b2bb8'] },
        { id: 'rainbow', name: 'Rainbow', need: 'allfour', c: ['#ff5a36', '#3a7bd5'] }
    ];
    const ACH = [
        { id: 'first', name: 'First Putt', d: 'Sink your first ball' },
        { id: 'birdie', name: 'Birdwatcher', d: 'Make a birdie' },
        { id: 'eagle', name: 'Eagle Eye', d: 'Make an eagle or better' },
        { id: 'ace', name: 'Ace!', d: 'Hole in one' },
        { id: 'aces5', name: 'Ace Collector', d: 'Five career holes in one' },
        { id: 'under', name: 'Under Par', d: 'Finish a course under par' },
        { id: 'clean', name: 'Bone Dry', d: 'Finish a course with no hazard penalties' },
        { id: 'meadow', name: 'Meadow Done', d: 'Finish Meadow Links' },
        { id: 'canyon', name: 'Fireproof', d: 'Finish Lava Canyon' },
        { id: 'glacier', name: 'Cool Head', d: 'Finish Glacier Peak' },
        { id: 'cosmos', name: 'Astronaut', d: 'Finish the Cosmic Course' },
        { id: 'allfour', name: 'Grand Tour', d: 'Finish all four courses' },
        { id: 'daily', name: 'Daily Golfer', d: 'Finish a daily challenge' },
        { id: 'portal', name: 'Wormhole Rider', d: 'Ride 15 portals' },
        { id: 'bumper', name: 'Pinball Wizard', d: 'Hit 60 bumpers' }
    ];
    const SKEY = 'mg2';
    const load = () => {
        const d = Curio.store.get(SKEY, null);
        const base = { v: 2, ach: {}, holeBest: {}, done: {}, skin: 'white', stats: { rounds: 0, holes: 0, strokes: 0, aces: 0, splashes: 0, portals: 0, bumps: 0 }, daily: {} };
        if (!d || typeof d !== 'object' || d.v !== 2) return base;
        return { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } };
    };
    let S = load();
    const save = () => Curio.store.set(SKEY, S);
    const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    function seeded(seed) {
        let s = seed >>> 0;
        return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    }
    const hashStr = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
    const ALL = COURSES.flatMap((c) => c.holes.map((h, i) => ({ course: c, hole: h, idx: i })));
    function dailyRound() {
        const rnd = seeded(hashStr('mg' + today()));
        const pool = ALL.slice();
        for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
        return pool.slice(0, 3);
    }
    const SIMPLE = Curio.simple;
    let mode = SIMPLE ? 'simple' : 'round', courseId = 'meadow', round = [];
    if (S.aim !== 'point' && S.aim !== 'sling') S.aim = matchMedia('(pointer: fine)').matches ? 'point' : 'sling';
    const QUIPS = {
        ace: ['The ducks are applauding. Ducks cannot applaud. And yet.', 'Somebody call the newspaper. The very local one.', 'That ball had a dream and a plan.', 'Witnesses report a small gasp from the windmill.'],
        under: ['Lovely. The flag is blushing.', 'Smooth as a buttered windmill.', 'Your caddie is crying. You do not have a caddie. I am crying.', 'The hole saw you coming and simply gave up.'],
        par: ['Par. Respectable. Your gran would approve.', 'Exactly as planned. Allegedly.', 'Textbook. A very boring textbook.', 'Solid. Like a garden gnome.'],
        bogey: ['The windmill says it was nothing personal.', 'Close enough for mini golf.', 'One extra. Nobody saw. Except the ducks.', 'A scenic route. Very relaxing.'],
        worse: ['The ball has filed a complaint.', 'You and the hole are no longer on speaking terms.', 'That was less golf and more pinball.', 'The flag looked away. Out of kindness.'],
        picked: ['Ten strokes. The ball has been escorted from the premises.', 'We picked it up for you. The ball needed a break.']
    };
    const SIMPLE_END = [
        [-9, 'Mini golf legend', 'Three holes, zero mercy. The windmill has asked for your autograph and also for you to leave.'],
        [-1, 'Under par!', 'The groundskeeper has named a gnome after you. It is the ugly one, but still.'],
        [0, 'Dead on par', 'Perfectly average in every way. The ducks nod at you. Ducks do not nod lightly.'],
        [3, 'Holiday golfer', 'A few extra putts, a lot of fun. The ice cream stand is to your left.'],
        [99, 'Windmill victim', 'The windmill wins this time. It always wins. It has been winning since 1987.']
    ];
    let holeI, strokes, card, ball, last, phase, phaseT, drag, aim, banner, ripples, rot, sinkT, stopT, flagWave, penalties, shake = 0, simT = 0;
    let layers = null, layerKey = '';
    const A = Arcade({
        width: CW, height: CH, reset, update, draw, key, pointer, idle, lower: true, resized,
        menu: () => { buildRound(); holeI = 0; card = []; startHole(); banner = null; paintMenu(); },
        capture: ['Enter', 'r', '[', ']'],
        size: (w, h) => (w >= h * 0.95 ? { w: CW, h: CH } : { w: CH, h: CW })
    });
    const bestKey = () => (mode === 'simple' ? 'simple3' : mode === 'daily' ? 'daily-' + today() : 'course-' + courseId);
    A.showBest = () => {
        if (mode === 'practice') { const b = S.holeBest[cur().course.id + cur().idx]; A.hud('best', b == null ? '-' : b); return; }
        const b = Curio.getBest(bestKey()); A.hud('best', b == null ? '-' : b);
    };
    function resized() { rot = A.W < A.H; layerKey = ''; }
    addEventListener('curio:theme', () => { layerKey = ''; });
    const cur = () => round[holeI];
    const hole = () => cur().hole;
    const course = () => cur().course;
    function buildRound() {
        if (mode === 'simple') { const c = COURSES[0]; round = [0, 5, 6].map((i) => ({ course: c, hole: c.holes[i], idx: i })); }
        else if (mode === 'daily') round = dailyRound();
        else { const c = COURSES.find((x) => x.id === courseId) || COURSES[0]; round = c.holes.map((h, i) => ({ course: c, hole: h, idx: i })); }
    }
    function segsOf(poly) {
        const out = [];
        for (let i = 0; i < poly.length; i++) out.push([poly[i], poly[(i + 1) % poly.length]]);
        return out;
    }
    function inShape(s, x, y) {
        if (s.r) return x >= s.r[0] && x <= s.r[0] + s.r[2] && y >= s.r[1] && y <= s.r[1] + s.r[3];
        return Math.hypot(x - s.c[0], y - s.c[1]) <= s.c[2];
    }
    function inPoly(poly, x, y) {
        let c = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const [xi, yi] = poly[i], [xj, yj] = poly[j];
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
        }
        return c;
    }
    function distSeg(px, py, a, b) {
        const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
        const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l2));
        return Math.hypot(px - a[0] - dx * t, py - a[1] - dy * t);
    }
    function reset() {
        buildRound();
        holeI = 0;
        card = [];
        penalties = 0;
        A.fx.clear();
        startHole();
    }
    function prep(h) {
        if (!h.segs) h.segs = [...segsOf(h.outer), ...(h.blocks || []).flatMap(segsOf)];
    }
    function startHole() {
        const h = hole();
        prep(h);
        strokes = 0;
        ball = { x: h.tee[0], y: h.tee[1], vx: 0, vy: 0, s: 1, vis: true, pc: -1, trail: [] };
        last = { x: ball.x, y: ball.y };
        aim = { a: Math.atan2(h.cup[1] - h.tee[1], h.cup[0] - h.tee[0]), p: 0.5, kb: false };
        drag = null;
        phase = 'aim';
        const hb = S.holeBest[course().id + cur().idx];
        banner = { t: 2.2, title: `Hole ${holeI + 1} · Par ${h.par}`, sub: `${h.name}${mode === 'daily' ? ' · ' + course().name : ''}${hb != null ? ' · best ' + hb : ''}` };
        ripples = [];
        stopT = 0;
        layerKey = '';
        document.querySelectorAll('[data-mg-prac]').forEach((b) => (b.hidden = mode !== 'practice'));
        hud();
    }
    function totalPar(n) { return round.slice(0, n).reduce((s, r) => s + r.hole.par, 0); }
    function hud() {
        if (!round.length) return;
        A.hud('hole', mode === 'practice' ? `${holeI + 1}` : `${holeI + 1}/${round.length}`);
        A.hud('par', hole().par);
        A.hud('strokes', strokes);
        const tot = card.reduce((s, c) => s + c, 0);
        const rel = tot - totalPar(card.length);
        A.hud('total', mode === 'practice' ? 'practice' : card.length ? `${tot} (${rel > 0 ? '+' : rel < 0 ? '-' : '±'}${Math.abs(rel)})` : '0');
        A.showBest();
    }
    function moverState(m, t) {
        if (m.type === 'spin') {
            const a = t * m.speed;
            const dx = Math.cos(a) * m.len, dy = Math.sin(a) * m.len;
            const dx2 = Math.cos(a + Math.PI / 2) * m.len, dy2 = Math.sin(a + Math.PI / 2) * m.len;
            const segs = [[[m.x - dx, m.y - dy], [m.x + dx, m.y + dy]]];
            if (m.mill) segs.push([[m.x - dx2, m.y - dy2], [m.x + dx2, m.y + dy2]]);
            return { segs, spin: m, a };
        }
        const k = (Math.sin(t * Math.PI * 2 / m.period) + 1) / 2;
        const top = m.y1 + (m.y2 - m.y1 - m.h) * k;
        const vy = Math.cos(t * Math.PI * 2 / m.period) * Math.PI / m.period * (m.y2 - m.y1 - m.h);
        const x = m.x - m.w / 2;
        return { segs: segsOf(rect(x, top, m.w, m.h)), vy, box: [x, top, m.w, m.h] };
    }
    let quiet = false;
    function collideSeg(b0, a, b, e, wvx, wvy) {
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const l2 = dx * dx + dy * dy || 1;
        let t = ((b0.x - a[0]) * dx + (b0.y - a[1]) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const px = a[0] + dx * t, py = a[1] + dy * t;
        let nx = b0.x - px, ny = b0.y - py;
        const d = Math.hypot(nx, ny);
        const rr = R + WALL;
        if (d >= rr || d === 0) return false;
        nx /= d;
        ny /= d;
        b0.x = px + nx * rr;
        b0.y = py + ny * rr;
        let wx = wvx || 0, wy = wvy || 0;
        if (typeof wvx === 'function') [wx, wy] = wvx(px, py);
        const rvx = b0.vx - wx, rvy = b0.vy - wy;
        const vn = rvx * nx + rvy * ny;
        if (vn < 0) {
            b0.vx -= (1 + e) * vn * nx;
            b0.vy -= (1 + e) * vn * ny;
            const tx = -ny, ty = nx;
            const vt = b0.vx * tx + b0.vy * ty;
            b0.vx -= vt * tx * 0.04;
            b0.vy -= vt * ty * 0.04;
            if (-vn > 70 && !quiet && A.state === 'play') {
                A.beep(Math.min(900, 180 + -vn * 0.5), 0.04, 'triangle', Math.min(0.09, -vn / 6000));
                if (-vn > 520) { shake = Math.max(shake, Math.min(6, -vn / 160)); A.fx.burst(px, py, 6, ['#ffffff', course().pal.wall], { speed: 90, life: 0.35, size: 2.5, gravity: 0, drag: 4 }); }
            }
        }
        return true;
    }
    function terrainAt(h, x, y) {
        for (const s of h.water || []) if (inShape(s, x, y)) return 'water';
        for (const s of h.sand || []) if (inShape(s, x, y)) return 'sand';
        for (const s of h.ice || []) if (inShape(s, x, y)) return 'ice';
        return 'green';
    }
    function step(b0, dt, t) {
        const h = hole();
        const terrain = terrainAt(h, b0.x, b0.y);
        if (terrain === 'water') return 'water';
        const fr = terrain === 'sand' ? 3.2 : terrain === 'ice' ? 0.12 : 0.55;
        const dec = terrain === 'sand' ? 420 : terrain === 'ice' ? 9 : 55;
        let ax = 0, ay = 0;
        for (const s of h.slopes || []) if (inShape(s, b0.x, b0.y)) { ax += s.f[0]; ay += s.f[1]; }
        for (const w of h.wells || []) {
            const dx = w[0] - b0.x, dy = w[1] - b0.y, d = Math.hypot(dx, dy);
            if (d < w[2] && d > 1) { const k = w[3] * (0.35 + 0.65 * (1 - d / w[2])); ax += dx / d * k; ay += dy / d * k; }
        }
        b0.vx += ax * dt;
        b0.vy += ay * dt;
        const sp = Math.hypot(b0.vx, b0.vy);
        if (sp > 0) {
            const ns = Math.max(0, sp * Math.exp(-fr * dt) - dec * dt);
            b0.vx *= ns / sp;
            b0.vy *= ns / sp;
        }
        b0.x += b0.vx * dt;
        b0.y += b0.vy * dt;
        for (const [a, b] of h.segs) collideSeg(b0, a, b, 0.72);
        for (const p of h.posts || []) {
            let nx = b0.x - p[0], ny = b0.y - p[1];
            const d = Math.hypot(nx, ny), rr = R + p[2];
            if (d < rr && d > 0) {
                nx /= d;
                ny /= d;
                b0.x = p[0] + nx * rr;
                b0.y = p[1] + ny * rr;
                const vn = b0.vx * nx + b0.vy * ny;
                if (vn < 0) {
                    const e = p[3] ? 1.15 : 0.75;
                    b0.vx -= (1 + e) * vn * nx;
                    b0.vy -= (1 + e) * vn * ny;
                    if (!quiet) {
                        if (p[3]) { p.hit = 0.25; S.stats.bumps++; }
                        if (A.state === 'play') {
                            A.beep(p[3] ? 1200 + Math.random() * 300 : 300, 0.05, p[3] ? 'square' : 'triangle', 0.05);
                            if (p[3]) A.fx.burst(p[0] + nx * p[2], p[1] + ny * p[2], 8, [course().pal.accent, '#ffffff'], { speed: 140, life: 0.4, size: 3, gravity: 0, drag: 3 });
                        }
                    }
                }
            }
        }
        for (const m of h.movers || []) {
            const st = moverState(m, t);
            for (const [a, b] of st.segs) {
                if (st.spin) collideSeg(b0, a, b, 0.6, (px, py) => [-m.speed * (py - m.y), m.speed * (px - m.x)]);
                else collideSeg(b0, a, b, 0.6, 0, st.vy);
            }
            if (st.spin) {
                const d = Math.hypot(b0.x - m.x, b0.y - m.y);
                if (d < R + 9 && d > 0) {
                    b0.x = m.x + (b0.x - m.x) / d * (R + 9);
                    b0.y = m.y + (b0.y - m.y) / d * (R + 9);
                }
            }
        }
        const ps = h.portals || [];
        if (b0.pc >= 0) {
            const p = ps[b0.pc];
            if (!p || Math.hypot(b0.x - p.b[0], b0.y - p.b[1]) > 24) b0.pc = -1;
        }
        else {
            for (let i = 0; i < ps.length; i++) {
                const p = ps[i];
                if (Math.hypot(b0.x - p.a[0], b0.y - p.a[1]) < 14) {
                    b0.x = p.b[0];
                    b0.y = p.b[1];
                    b0.pc = i;
                    if (!quiet) {
                        S.stats.portals++;
                        b0.trail = [];
                        A.sweep(300, 1400, 0.25, 'sine', 0.06);
                        A.fx.burst(p.a[0], p.a[1], 14, ['#ff9f43', '#ffffff'], { speed: 120, life: 0.5, size: 3, gravity: 0, drag: 3 });
                        A.fx.burst(p.b[0], p.b[1], 14, ['#58e6ff', '#ffffff'], { speed: 120, life: 0.5, size: 3, gravity: 0, drag: 3 });
                    }
                    break;
                }
            }
        }
        const sp2 = Math.hypot(b0.vx, b0.vy);
        if (sp2 > MAXV * 1.3) {
            b0.vx *= MAXV * 1.3 / sp2;
            b0.vy *= MAXV * 1.3 / sp2;
        }
        const dc = Math.hypot(b0.x - h.cup[0], b0.y - h.cup[1]);
        if (dc < CUP) {
            if (sp2 < 430) return 'cup';
            const nx = (h.cup[0] - b0.x) / (dc || 1), ny = (h.cup[1] - b0.y) / (dc || 1);
            b0.vx = b0.vx * 0.86 + nx * 40;
            b0.vy = b0.vy * 0.86 + ny * 40;
        }
        else if (dc < CUP + 6 && sp2 < 140) {
            b0.vx += (h.cup[0] - b0.x) * 12 * dt;
            b0.vy += (h.cup[1] - b0.y) * 12 * dt;
        }
        return null;
    }
    function shotSpeed(pow) { return MAXV * pow * pow * 0.35 + MAXV * pow * 0.65; }
    function shoot(ang, pow) {
        if (phase !== 'aim') return;
        pow = Math.max(0, Math.min(1, pow));
        if (pow < 0.04) return;
        const v = shotSpeed(pow);
        last = { x: ball.x, y: ball.y };
        ball.vx = Math.cos(ang) * v;
        ball.vy = Math.sin(ang) * v;
        strokes++;
        phase = 'roll';
        stopT = 0;
        A.noise(0.06, 0.25, 2500);
        A.beep(220 + pow * 200, 0.06, 'triangle', 0.09);
        A.fx.burst(ball.x, ball.y, 5, ['#ffffff'], { speed: 60, life: 0.3, size: 2, gravity: 0, drag: 5, angle: ang + Math.PI, spread: 1.4 });
        navigator.vibrate?.(8);
        hud();
    }
    function nameFor(n, par) {
        if (n === 1) return 'Hole in one!';
        const d = n - par;
        return d <= -3 ? 'Albatross!' : d === -2 ? 'Eagle!' : d === -1 ? 'Birdie!' : d === 0 ? 'Par' : d === 1 ? 'Bogey' : d === 2 ? 'Double bogey' : `+${d}`;
    }
    const unlocked = [];
    function award(id) {
        if (S.ach[id]) return;
        S.ach[id] = Date.now();
        unlocked.push(id);
        const a = ACH.find((x) => x.id === id);
        if (a) Curio.toast(`🏅 ${a.name}: ${a.d}`);
        const sk = SKINS.find((s) => s.need === id);
        if (sk) setTimeout(() => Curio.toast(`New ball unlocked: ${sk.name}`), 1600);
    }
    function finishHole(picked) {
        const h = hole();
        const n = picked ? MAXSTROKES : strokes;
        if (mode !== 'practice') card.push(n);
        A.setScore(card.reduce((s, c) => s + c, 0));
        if (!picked) {
            const k = course().id + cur().idx;
            if (S.holeBest[k] == null || n < S.holeBest[k]) S.holeBest[k] = n;
            S.stats.holes++;
            S.stats.strokes += n;
            award('first');
            if (n === 1) { S.stats.aces++; award('ace'); if (S.stats.aces >= 5) award('aces5'); }
            if (n - h.par <= -1) award('birdie');
            if (n - h.par <= -2) award('eagle');
            if (S.stats.portals >= 15) award('portal');
            if (S.stats.bumps >= 60) award('bumper');
            save();
        }
        const label = picked ? 'Picked up' : nameFor(n, h.par);
        const qk = picked ? 'picked' : n === 1 ? 'ace' : n < h.par ? 'under' : n === h.par ? 'par' : n === h.par + 1 ? 'bogey' : 'worse';
        banner = { t: 2.6, title: label, sub: `${n} stroke${n === 1 ? '' : 's'} on a par ${h.par}`, big: true, card: mode !== 'practice', quip: Curio.pick(QUIPS[qk]) };
        phase = 'between';
        phaseT = 2.6;
        if (n === 1) { Curio.confetti(); navigator.vibrate?.([30, 40, 30, 40, 60]); }
        else navigator.vibrate?.(20);
        const good = n <= h.par;
        (good ? [523, 659, 784, 1047] : [440, 392]).forEach((f, i) => setTimeout(() => A.beep(f, 0.12, 'triangle', 0.08), i * 90));
        A.fx.burst(h.cup[0], h.cup[1], good ? 30 : 12, good ? ['#ffd166', '#ffffff', course().pal.flag, '#7dffb0'] : ['#ffffff'], { speed: 220, life: 0.9, size: 3.5, gravity: 120, drag: 2 });
        hud();
    }
    function endRound() {
        const tot = card.reduce((s, c) => s + c, 0), par = totalPar(round.length), rel = tot - par;
        S.stats.rounds++;
        if (mode === 'daily') { award('daily'); S.daily[today()] = Math.min(S.daily[today()] ?? 99, tot); }
        else if (mode === 'simple') { }
        else {
            S.done[courseId] = Math.min(S.done[courseId] ?? 999, tot);
            award(courseId);
            if (rel < 0) award('under');
            if (penalties === 0) award('clean');
            if (COURSES.every((c) => S.done[c.id] != null)) award('allfour');
        }
        save();
        A.bestKey = bestKey();
        fillCard();
        const where = mode === 'daily' ? 'today’s 3-hole challenge' : course().name;
        const up = document.querySelector('[data-mg-adv]');
        if (up) up.hidden = mode !== 'simple';
        if (mode === 'simple') {
            const e = SIMPLE_END.find((x) => rel <= x[0]);
            A.over({ title: e[1], emoji: rel <= 0 ? '🏆' : rel <= 3 ? '🍦' : '🌀', msg: `${tot} strokes on three holes, par ${par} (${rel > 0 ? '+' + rel : rel === 0 ? 'even' : rel}). ${e[2]}` });
            if (rel <= 0) Curio.confetti();
            paintBadges(document.querySelector('[data-o="badges"]'), unlocked.splice(0));
            return;
        }
        A.over({
            title: rel < 0 ? 'Under par!' : rel === 0 ? 'Right on par' : 'Round complete',
            emoji: rel <= 0 ? '🏆' : '⛳',
            msg: `${tot} strokes on ${where}, par ${par} (${rel > 0 ? '+' + rel : rel === 0 ? 'even' : rel}). ${rel <= -3 ? 'Pro tour is calling.' : rel <= 0 ? 'Smooth putting.' : rel <= 6 ? 'The windmill sends its regards.' : 'Golf is hard. The ducks enjoyed the visit.'}`
        });
        if (rel <= 0) Curio.confetti();
        paintBadges(document.querySelector('[data-o="badges"]'), unlocked.splice(0));
    }
    function update(dt) {
        flagWave = (flagWave || 0) + dt;
        simT = A.time;
        shake = Math.max(0, shake - dt * 20);
        if (banner) {
            banner.t -= dt;
            if (banner.t <= 0) banner = null;
        }
        for (const p of hole().posts || []) if (p.hit) p.hit = Math.max(0, p.hit - dt);
        for (let i = ripples.length - 1; i >= 0; i--) {
            ripples[i].t += dt;
            if (ripples[i].t > 1) ripples.splice(i, 1);
        }
        A.fx.update(dt);
        if (phase === 'roll') {
            const n = 4;
            for (let i = 0; i < n; i++) {
                const r = step(ball, dt / n, A.time);
                if (r === 'water') {
                    phase = 'water';
                    phaseT = 1.1;
                    ball.vis = false;
                    ball.trail = [];
                    ripples.push({ x: ball.x, y: ball.y, t: 0 });
                    const hz = HAZ[course().id];
                    const cols = hz === 'lava' ? ['#ff6a1a', '#ffd23f', '#3a2a22'] : hz === 'void' ? ['#c58bff', '#ffffff', '#58e6ff'] : ['#bfe9ff', '#ffffff', '#6ec6ff'];
                    A.fx.burst(ball.x, ball.y, 22, cols, { speed: 150, life: 0.7, size: 3, gravity: hz === 'lava' ? -60 : 0, drag: 3 });
                    if (hz === 'lava') { A.noise(0.5, 0.2, 2000); A.sweep(900, 120, 0.4, 'sawtooth', 0.04); }
                    else if (hz === 'void') A.sweep(800, 60, 0.6, 'sine', 0.07);
                    else { A.noise(0.4, 0.16, 700); A.sweep(600, 200, 0.3, 'sine', 0.05); }
                    strokes++;
                    penalties++;
                    S.stats.splashes++;
                    shake = 5;
                    navigator.vibrate?.(50);
                    hud();
                    Curio.toast(`${course().hazardName}! +1 stroke`);
                    return;
                }
                if (r === 'cup') {
                    phase = 'sink';
                    sinkT = 0;
                    ball.trail = [];
                    A.beep(523, 0.08, 'sine', 0.1);
                    setTimeout(() => A.beep(330, 0.12, 'sine', 0.1), 80);
                    return;
                }
            }
            const sp = Math.hypot(ball.vx, ball.vy);
            if (sp > 160) { ball.trail.push([ball.x, ball.y]); if (ball.trail.length > 14) ball.trail.shift(); }
            else if (ball.trail.length) ball.trail.shift();
            if (sp < 9) stopT += dt;
            else stopT = 0;
            if (stopT > 0.25 || sp < 2) {
                ball.vx = ball.vy = 0;
                ball.trail = [];
                if (strokes >= MAXSTROKES) {
                    Curio.toast('Ten strokes. Ball picked up.');
                    finishHole(true);
                }
                else {
                    phase = 'aim';
                    const h = hole();
                    if (!aim.kb) aim.a = Math.atan2(h.cup[1] - ball.y, h.cup[0] - ball.x);
                }
            }
        }
        else if (phase === 'water') {
            phaseT -= dt;
            if (phaseT <= 0) {
                ball.x = last.x;
                ball.y = last.y;
                ball.vx = ball.vy = 0;
                ball.vis = true;
                ball.pc = -1;
                if (strokes >= MAXSTROKES) finishHole(true);
                else phase = 'aim';
            }
        }
        else if (phase === 'sink') {
            sinkT += dt;
            const h = hole();
            ball.x += (h.cup[0] - ball.x) * Math.min(1, dt * 14);
            ball.y += (h.cup[1] - ball.y) * Math.min(1, dt * 14);
            ball.s = Math.max(0, 1 - sinkT * 2.2);
            if (sinkT > 0.5) finishHole(false);
        }
        else if (phase === 'between') {
            phaseT -= dt;
            if (phaseT <= 0) {
                if (mode === 'practice') { holeI = (holeI + 1) % round.length; startHole(); }
                else if (holeI >= round.length - 1) endRound();
                else {
                    holeI++;
                    startHole();
                }
            }
        }
        if (phase === 'aim' && aim.kb) {
            if (A.keys.has('ArrowLeft')) aim.a -= dt * (A.keys.has('Shift') ? 0.3 : 1.6);
            if (A.keys.has('ArrowRight')) aim.a += dt * (A.keys.has('Shift') ? 0.3 : 1.6);
            if (A.keys.has('ArrowUp')) aim.p = Math.min(1, aim.p + dt * 0.7);
            if (A.keys.has('ArrowDown')) aim.p = Math.max(0.05, aim.p - dt * 0.7);
        }
    }
    function fillCard() {
        const el = document.querySelector('[data-o="card"]');
        if (!el) return;
        const head = round.map((_, i) => `<th>${i + 1}</th>`).join('');
        const par = round.map((r) => `<td>${r.hole.par}</td>`).join('');
        const you = card.map((n, i) => `<td class="${n < round[i].hole.par ? 'is-under' : n > round[i].hole.par ? 'is-over' : ''}">${n}</td>`).join('');
        el.innerHTML = `<table><tr><th></th>${head}<th>Σ</th></tr><tr><th>Par</th>${par}<td>${totalPar(round.length)}</td></tr><tr><th>You</th>${you}<td><b>${card.reduce((s, c) => s + c, 0)}</b></td></tr></table>`;
    }
    function shareText() {
        const tot = card.reduce((s, c) => s + c, 0), rel = tot - totalPar(round.length);
        const sq = card.map((n, i) => (n === 1 ? '⭐' : n < round[i].hole.par ? '🟩' : n === round[i].hole.par ? '🟨' : '🟥')).join('');
        const where = mode === 'daily' ? `Daily ${today()}` : course().name;
        return `Zoble Mini Golf · ${where}\n${tot} strokes (${rel > 0 ? '+' + rel : rel === 0 ? 'E' : rel})\n${sq}`;
    }
    let demoT = 0;
    function idle(dt) {
        if (A.state !== 'menu') return;
        flagWave = (flagWave || 0) + dt;
        simT = A.time;
        A.fx.update(dt);
        demoT += dt;
        if (phase === 'aim' && demoT > 1.2) {
            demoT = 0;
            const h = hole();
            const a = Math.atan2(h.cup[1] - ball.y, h.cup[0] - ball.x) + Curio.rand(-0.5, 0.5);
            ball.vx = Math.cos(a) * 600;
            ball.vy = Math.sin(a) * 600;
            phase = 'roll';
        }
        if (phase === 'roll') {
            quiet = true;
            for (let i = 0; i < 4; i++) {
                const r = step(ball, dt / 4, A.time);
                if (r) { ball.x = hole().tee[0]; ball.y = hole().tee[1]; ball.vx = ball.vy = 0; phase = 'aim'; break; }
            }
            quiet = false;
            if (Math.hypot(ball.vx, ball.vy) < 6) { ball.vx = ball.vy = 0; phase = 'aim'; }
        }
    }
    function toWorld(p) { return rot ? { x: p.y, y: CH - p.x } : { x: p.x, y: p.y }; }
    function pointAim(w) {
        aim.a = Math.atan2(w.y - ball.y, w.x - ball.x);
        aim.p = Math.max(0.06, Math.min(1, Math.hypot(w.x - ball.x, w.y - ball.y) / 300));
        aim.kb = true;
    }
    A.canvas.addEventListener('pointermove', (e) => {
        if (S.aim !== 'point' || e.pointerType !== 'mouse' || A.state !== 'play' || phase !== 'aim' || (drag && !drag.pending)) return;
        pointAim(toWorld(A.toLogical(e)));
    });
    function pointer(type, p, e) {
        if (type === 'cancel') { drag = null; return; }
        const w = toWorld(p);
        if (S.aim === 'point' && e && e.pointerType === 'mouse') {
            if (type === 'down' && phase === 'aim') { pointAim(w); shoot(aim.a, aim.p); }
            drag = null;
            return;
        }
        if (type === 'down') {
            drag = phase === 'aim' ? { x0: w.x, y0: w.y, x: w.x, y: w.y } : { pending: true, x: w.x, y: w.y };
            aim.kb = false;
        }
        else if (type === 'move' && drag) {
            if (drag.pending && phase === 'aim') drag = { x0: w.x, y0: w.y, x: w.x, y: w.y };
            drag.x = w.x;
            drag.y = w.y;
        }
        else if (type === 'up' && drag) {
            if (drag.pending) { drag = null; return; }
            const dx = drag.x0 - drag.x, dy = drag.y0 - drag.y;
            const pow = Math.min(1, Math.hypot(dx, dy) * A.scale / MAXDRAG);
            const ang = Math.atan2(dy, dx);
            drag = null;
            shoot(ang, pow);
        }
    }
    function jumpHole(d) {
        if (mode !== 'practice') return;
        holeI = (holeI + d + round.length) % round.length;
        startHole();
        A.beep(660, 0.05, 'triangle', 0.06);
    }
    function key(k, down) {
        if (!down) return;
        if (k.startsWith('Arrow')) aim.kb = true;
        if ((k === ' ' || k === 'Enter') && phase === 'aim') {
            aim.kb = true;
            shoot(aim.a, aim.p);
        }
        if (k === 'r' && mode === 'practice') startHole();
        if (k === ']') jumpHole(1);
        if (k === '[') jumpHole(-1);
    }
    function pathPoly(g, poly) {
        g.beginPath();
        g.moveTo(poly[0][0], poly[0][1]);
        for (let i = 1; i < poly.length; i++) g.lineTo(poly[i][0], poly[i][1]);
        g.closePath();
    }
    function shapePath(g, s) {
        g.beginPath();
        if (s.r) g.rect(s.r[0], s.r[1], s.r[2], s.r[3]);
        else g.arc(s.c[0], s.c[1], s.c[2], 0, 7);
    }
    function bbox(s) { return s.r ? s.r : [s.c[0] - s.c[2], s.c[1] - s.c[2], s.c[2] * 2, s.c[2] * 2]; }
    function pal() {
        const p = course().pal;
        if (!A.dark) return p;
        return { ...p, bg: shade(p.bg, -0.45), bg2: shade(p.bg2, -0.45), turf: shade(p.turf, -0.28), wall: shade(p.wall, -0.15), wallDark: shade(p.wallDark, -0.3) };
    }
    function drawDecor(g, rnd, cid, x, y, s) {
        if (cid === 'meadow') {
            if (rnd() < 0.3) {
                const cols = ['#ffffff', '#ffd166', '#ff8fab', '#c3a6ff'];
                for (let i = 0; i < 5; i++) { g.fillStyle = cols[(rnd() * 4) | 0]; g.beginPath(); g.arc(x + rnd() * 30 - 15, y + rnd() * 30 - 15, 2.5, 0, 7); g.fill(); }
                return;
            }
            g.fillStyle = 'rgba(0,0,0,.22)';
            g.beginPath(); g.ellipse(x + 8 * s, y + 10 * s, 26 * s, 20 * s, 0, 0, 7); g.fill();
            const gr = g.createRadialGradient(x - 8 * s, y - 10 * s, 2, x, y, 28 * s);
            gr.addColorStop(0, A.dark ? '#4c9a4a' : '#8fdc6a');
            gr.addColorStop(1, A.dark ? '#1d4a24' : '#2f7d32');
            g.fillStyle = gr;
            for (const [dx, dy, r] of [[-10, 4, 16], [10, 4, 16], [0, -8, 18], [0, 8, 15]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 7); g.fill(); }
        }
        else if (cid === 'canyon') {
            if (rnd() < 0.45) {
                g.fillStyle = 'rgba(0,0,0,.2)';
                g.beginPath(); g.ellipse(x + 6, y + 18 * s, 14 * s, 6 * s, 0, 0, 7); g.fill();
                g.fillStyle = A.dark ? '#2e7a4a' : '#3fa463';
                rrect(g, x - 6 * s, y - 22 * s, 12 * s, 40 * s, 6 * s); g.fill();
                rrect(g, x - 18 * s, y - 10 * s, 8 * s, 18 * s, 4 * s); g.fill();
                rrect(g, x + 10 * s, y - 16 * s, 8 * s, 16 * s, 4 * s); g.fill();
                g.fillRect(x - 14 * s, y + 2 * s, 10 * s, 5 * s);
                g.fillRect(x + 4 * s, y - 4 * s, 10 * s, 5 * s);
                g.fillStyle = 'rgba(255,255,255,.25)';
                g.fillRect(x - 3 * s, y - 18 * s, 2.5 * s, 32 * s);
            }
            else {
                g.fillStyle = 'rgba(0,0,0,.2)';
                g.beginPath(); g.ellipse(x + 5, y + 8, 24 * s, 10 * s, 0, 0, 7); g.fill();
                g.fillStyle = A.dark ? '#6b3a22' : '#a65a30';
                g.beginPath(); g.moveTo(x - 22 * s, y + 8 * s); g.lineTo(x - 12 * s, y - 14 * s); g.lineTo(x + 8 * s, y - 18 * s); g.lineTo(x + 22 * s, y + 6 * s); g.closePath(); g.fill();
                g.fillStyle = A.dark ? '#8a4e2c' : '#c97a45';
                g.beginPath(); g.moveTo(x - 12 * s, y - 14 * s); g.lineTo(x + 8 * s, y - 18 * s); g.lineTo(x + 2 * s, y - 2 * s); g.closePath(); g.fill();
            }
        }
        else if (cid === 'glacier') {
            if (rnd() < 0.35) {
                g.fillStyle = A.dark ? 'rgba(220,235,255,.25)' : 'rgba(255,255,255,.9)';
                g.beginPath(); g.ellipse(x, y, 22 * s, 12 * s, 0, 0, 7); g.fill();
                return;
            }
            g.fillStyle = 'rgba(40,70,110,.22)';
            g.beginPath(); g.ellipse(x + 8, y + 16 * s, 18 * s, 7 * s, 0, 0, 7); g.fill();
            for (let i = 0; i < 3; i++) {
                const w = (22 - i * 5) * s, top = y - 10 * s - i * 11 * s;
                g.fillStyle = A.dark ? '#1f4d3c' : '#2f7a5c';
                g.beginPath(); g.moveTo(x, top - 14 * s); g.lineTo(x + w, top + 12 * s); g.lineTo(x - w, top + 12 * s); g.closePath(); g.fill();
                g.fillStyle = A.dark ? '#cfe2ee' : '#ffffff';
                g.beginPath(); g.moveTo(x, top - 14 * s); g.lineTo(x + w * 0.45, top - 2 * s); g.lineTo(x - w * 0.45, top - 2 * s); g.closePath(); g.fill();
            }
        }
        else {
            const r = 1 + rnd() * 1.8;
            g.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.6})`;
            g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
            if (rnd() < 0.12) {
                const pr = 10 + rnd() * 16, hue = (rnd() * 360) | 0;
                const gr = g.createRadialGradient(x - pr * 0.4, y - pr * 0.4, 1, x, y, pr);
                gr.addColorStop(0, `hsl(${hue},80%,72%)`);
                gr.addColorStop(1, `hsl(${hue},60%,30%)`);
                g.fillStyle = gr;
                g.beginPath(); g.arc(x, y, pr, 0, 7); g.fill();
                if (rnd() < 0.5) { g.strokeStyle = `hsla(${hue},80%,80%,.7)`; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, pr * 1.7, pr * 0.45, -0.4, 0, 7); g.stroke(); }
            }
        }
    }
    function buildLayers() {
        const k = canvas.width / A.W;
        const key = `${course().id}${cur().idx}|${k}|${A.dark}`;
        if (layers && layerKey === key) return;
        layerKey = key;
        const mk = () => { const c = document.createElement('canvas'); c.width = Math.ceil(CW * k); c.height = Math.ceil(CH * k); const g = c.getContext('2d'); g.setTransform(k, 0, 0, k, 0, 0); return [c, g]; };
        const [lc, g] = mk(), [uc, u] = mk();
        layers = { low: lc, up: uc };
        const h = hole(), P = pal(), cid = course().id;
        const bgG = g.createLinearGradient(0, 0, CW, CH);
        bgG.addColorStop(0, P.bg2);
        bgG.addColorStop(1, P.bg);
        g.fillStyle = bgG;
        g.fillRect(0, 0, CW, CH);
        const rnd = seeded(hashStr(cid + cur().idx));
        g.fillStyle = cid === 'cosmos' ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.06)';
        for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(rnd() * CW, rnd() * CH, 20 + rnd() * 50, 0, 7); g.fill(); }
        const n = cid === 'cosmos' ? 140 : 46;
        for (let i = 0; i < n; i++) {
            const x = rnd() * CW, y = rnd() * CH;
            let ok = !inPoly(h.outer, x, y);
            if (ok) for (const sg of segsOf(h.outer)) if (distSeg(x, y, sg[0], sg[1]) < (cid === 'cosmos' ? 12 : 34)) { ok = false; break; }
            if (ok) drawDecor(g, rnd, cid, x, y, 0.8 + rnd() * 0.5);
        }
        g.save();
        g.translate(8, 10);
        pathPoly(g, h.outer);
        g.fillStyle = 'rgba(0,0,0,.28)';
        g.filter = 'blur(6px)';
        g.fill();
        g.filter = 'none';
        g.restore();
        pathPoly(g, h.outer);
        const tg = g.createLinearGradient(0, 0, 0, CH);
        tg.addColorStop(0, shade(P.turf, 0.1));
        tg.addColorStop(1, shade(P.turf, -0.08));
        g.fillStyle = tg;
        g.fill();
        g.save();
        pathPoly(g, h.outer);
        g.clip();
        g.fillStyle = A.dark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.1)';
        for (let x = -CH; x < CW; x += 60) {
            g.beginPath();
            g.moveTo(x, 0);
            g.lineTo(x + 30, 0);
            g.lineTo(x + 30 + CH, CH);
            g.lineTo(x + CH, CH);
            g.fill();
        }
        g.fillStyle = 'rgba(0,0,0,.05)';
        for (let i = 0; i < 900; i++) g.fillRect(rnd() * CW, rnd() * CH, 1.5, 1.5);
        for (const s of h.slopes || []) {
            shapePath(g, s);
            if (s.boost) {
                const bg = g.createLinearGradient(s.r[0], s.r[1], s.r[0] + s.r[2], s.r[1] + s.r[3]);
                bg.addColorStop(0, 'rgba(255,210,63,.35)');
                bg.addColorStop(1, 'rgba(255,90,54,.35)');
                g.fillStyle = bg;
            }
            else g.fillStyle = A.dark ? 'rgba(0,0,0,.15)' : 'rgba(30,90,30,.16)';
            g.fill();
        }
        for (const s of h.ice || []) {
            shapePath(g, s);
            const [x, y, w, hh] = bbox(s);
            const ig = g.createLinearGradient(x, y, x + w, y + hh);
            ig.addColorStop(0, A.dark ? '#6f9fb8' : '#e6f7ff');
            ig.addColorStop(1, A.dark ? '#4b7a96' : '#b8e2f7');
            g.fillStyle = ig;
            g.fill();
            g.save();
            shapePath(g, s);
            g.clip();
            g.strokeStyle = 'rgba(255,255,255,.7)';
            g.lineWidth = 3;
            for (let i = x - hh; i < x + w; i += 70) { g.beginPath(); g.moveTo(i, y + hh); g.lineTo(i + hh * 0.6, y); g.stroke(); }
            g.strokeStyle = 'rgba(120,170,200,.35)';
            g.lineWidth = 1;
            for (let i = 0; i < w * hh / 9000; i++) { const cx = x + rnd() * w, cy = y + rnd() * hh; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + rnd() * 30 - 15, cy + rnd() * 30 - 15); g.lineTo(cx + rnd() * 30 - 15, cy + rnd() * 30 - 15); g.stroke(); }
            g.restore();
        }
        const sc = SANDCOL[cid];
        for (const s of h.sand || []) {
            g.save();
            g.translate(0, 2);
            shapePath(g, s);
            g.fillStyle = 'rgba(0,0,0,.12)';
            g.fill();
            g.restore();
            shapePath(g, s);
            const [x, y, w, hh] = bbox(s);
            const sg = g.createRadialGradient(x + w * 0.35, y + hh * 0.3, 2, x + w / 2, y + hh / 2, Math.max(w, hh) * 0.7);
            sg.addColorStop(0, shade(sc[0], 0.15));
            sg.addColorStop(1, sc[0]);
            g.fillStyle = A.dark ? shade(sc[0], -0.25) : sg;
            g.fill();
            g.strokeStyle = sc[1];
            g.lineWidth = 3;
            g.stroke();
            g.save();
            shapePath(g, s);
            g.clip();
            g.fillStyle = cid === 'glacier' ? 'rgba(120,160,200,.35)' : cid === 'cosmos' ? 'rgba(255,255,255,.6)' : 'rgba(160,120,50,.35)';
            for (let i = 0; i < w * hh / 220; i++) g.fillRect(x + rnd() * w, y + rnd() * hh, 2, 2);
            g.restore();
        }
        const hz = HAZ[cid];
        for (const s of h.water || []) {
            shapePath(g, s);
            const [x, y, w, hh] = bbox(s);
            const wg = g.createLinearGradient(x, y, x, y + hh);
            if (hz === 'lava') { wg.addColorStop(0, '#ffb02e'); wg.addColorStop(1, '#ff4d12'); }
            else if (hz === 'void') { wg.addColorStop(0, '#0a0620'); wg.addColorStop(1, '#000000'); }
            else if (hz === 'frost') { wg.addColorStop(0, '#3a8fcf'); wg.addColorStop(1, '#1d5a92'); }
            else { wg.addColorStop(0, '#5cc0f0'); wg.addColorStop(1, '#2a8fd0'); }
            g.fillStyle = wg;
            g.fill();
            g.lineWidth = 3;
            g.strokeStyle = hz === 'lava' ? '#a8320a' : hz === 'void' ? '#c58bff' : hz === 'frost' ? '#e6f7ff' : '#2a86c0';
            g.stroke();
        }
        g.fillStyle = 'rgba(255,255,255,.5)';
        rrect(g, h.tee[0] - 18, h.tee[1] - 18, 36, 36, 7);
        g.fill();
        g.strokeStyle = 'rgba(255,255,255,.7)';
        g.lineWidth = 1.5;
        g.stroke();
        g.lineJoin = 'round';
        pathPoly(g, h.outer);
        g.strokeStyle = 'rgba(0,0,0,.16)';
        g.lineWidth = 34;
        g.stroke();
        g.restore();
        u.lineJoin = 'round';
        u.lineCap = 'round';
        const wallPath = (poly, fill) => {
            u.save();
            u.translate(3, 4);
            pathPoly(u, poly);
            u.strokeStyle = 'rgba(0,0,0,.25)';
            u.lineWidth = WALL * 2 + 2;
            u.stroke();
            if (fill) { u.fillStyle = 'rgba(0,0,0,.25)'; u.fill(); }
            u.restore();
            pathPoly(u, poly);
            if (fill) { u.fillStyle = P.wallDark; u.fill(); }
            u.strokeStyle = P.wallDark;
            u.lineWidth = WALL * 2 + 2;
            u.stroke();
            u.strokeStyle = P.wall;
            u.lineWidth = WALL * 2 - 4;
            u.stroke();
            u.save();
            u.translate(-1, -1.5);
            pathPoly(u, poly);
            u.strokeStyle = 'rgba(255,255,255,.35)';
            u.lineWidth = 1.5;
            u.stroke();
            u.restore();
        };
        wallPath(h.outer, false);
        for (const b of h.blocks || []) wallPath(b, true);
        const cx = h.cup[0], cy = h.cup[1];
        u.fillStyle = 'rgba(255,255,255,.4)';
        u.beginPath();
        u.arc(cx, cy, CUP + 5, 0, 7);
        u.fill();
        const cg = u.createRadialGradient(cx - 3, cy - 4, 1, cx, cy, CUP);
        cg.addColorStop(0, '#000');
        cg.addColorStop(0.75, '#10200f');
        cg.addColorStop(1, '#3d4a3a');
        u.fillStyle = cg;
        u.beginPath();
        u.arc(cx, cy, CUP, 0, 7);
        u.fill();
    }
    function drawDynamic(g) {
        const h = hole(), cid = course().id, t = A.time;
        for (const s of h.slopes || []) {
            g.save();
            shapePath(g, s);
            g.clip();
            const ang = Math.atan2(s.f[1], s.f[0]);
            const [x, y, w, hh] = s.r;
            const sp = s.boost ? 90 : 30;
            const off = (t * sp) % 50;
            g.strokeStyle = s.boost ? 'rgba(255,240,200,.8)' : 'rgba(255,255,255,.35)';
            g.lineWidth = s.boost ? 4 : 3;
            for (let i = x + 25; i < x + w; i += 50) {
                for (let j = y + 25; j < y + hh; j += 50) {
                    g.save();
                    g.translate(i + Math.cos(ang) * (off - 25), j + Math.sin(ang) * (off - 25));
                    g.rotate(ang);
                    g.beginPath();
                    g.moveTo(-6, -8);
                    g.lineTo(4, 0);
                    g.lineTo(-6, 8);
                    g.stroke();
                    g.restore();
                }
            }
            g.restore();
        }
        const hz = HAZ[cid];
        for (const s of h.water || []) {
            g.save();
            shapePath(g, s);
            g.clip();
            const [x, y, w, hh] = bbox(s);
            if (hz === 'lava') {
                g.fillStyle = 'rgba(120,30,0,.35)';
                for (let i = 0; i < 6; i++) {
                    const px = x + ((i * 53 + t * 9) % w), py = y + ((i * 37) % hh);
                    g.beginPath(); g.ellipse(px, py, 18, 8, 0.3, 0, 7); g.fill();
                }
                for (let i = 0; i < 4; i++) {
                    const ph = (t * 0.7 + i * 0.27) % 1;
                    const px = x + ((i * 71) % w), py = y + ((i * 43 + 20) % hh);
                    g.fillStyle = `rgba(255,236,150,${1 - ph})`;
                    g.beginPath(); g.arc(px, py, 2 + ph * 6, 0, 7); g.fill();
                }
            }
            else if (hz === 'void') {
                for (let i = 0; i < 18; i++) {
                    const px = x + ((i * 47) % w), py = y + ((i * 29) % hh);
                    g.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t * 2 + i))})`;
                    g.fillRect(px, py, 1.5, 1.5);
                }
                if (s.c) {
                    g.strokeStyle = 'rgba(197,139,255,.5)';
                    g.lineWidth = 2;
                    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(s.c[0], s.c[1], s.c[2] * (0.3 + 0.25 * i), t * 2 + i, t * 2 + i + 2.4); g.stroke(); }
                }
            }
            else {
                g.strokeStyle = hz === 'frost' ? 'rgba(230,247,255,.5)' : 'rgba(255,255,255,.4)';
                g.lineWidth = 2;
                for (let j = y + 12; j < y + hh; j += 22) {
                    g.beginPath();
                    for (let i = x; i <= x + w; i += 8) g.lineTo(i, j + Math.sin(i * 0.08 + t * 2 + j) * 3);
                    g.stroke();
                }
                if (hz === 'frost') {
                    g.fillStyle = 'rgba(240,250,255,.85)';
                    for (let i = 0; i < 3; i++) { const px = x + ((i * 61 + t * 6) % w), py = y + ((i * 47 + 15) % hh); g.beginPath(); g.moveTo(px, py); g.lineTo(px + 14, py + 3); g.lineTo(px + 9, py + 11); g.lineTo(px - 3, py + 8); g.closePath(); g.fill(); }
                }
            }
            g.restore();
        }
        for (const w of h.wells || []) {
            g.strokeStyle = 'rgba(197,139,255,.35)';
            g.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const ph = ((t * 0.5 + i / 4) % 1);
                const r = w[2] * (1 - ph);
                g.globalAlpha = ph;
                g.beginPath(); g.arc(w[0], w[1], r, 0, 7); g.stroke();
            }
            g.globalAlpha = 1;
        }
        for (const p of h.portals || []) {
            for (const [pt, col] of [[p.a, '#ff9f43'], [p.b, '#58e6ff']]) {
                const gr = g.createRadialGradient(pt[0], pt[1], 2, pt[0], pt[1], 20);
                gr.addColorStop(0, '#ffffff');
                gr.addColorStop(0.4, col);
                gr.addColorStop(1, 'rgba(0,0,0,0)');
                g.fillStyle = gr;
                g.beginPath(); g.arc(pt[0], pt[1], 20, 0, 7); g.fill();
                g.strokeStyle = col;
                g.lineWidth = 3;
                for (let i = 0; i < 2; i++) { g.beginPath(); g.arc(pt[0], pt[1], 15, t * 3 + i * Math.PI, t * 3 + i * Math.PI + 1.8); g.stroke(); }
            }
            g.strokeStyle = 'rgba(255,255,255,.12)';
            g.setLineDash([3, 8]);
            g.lineWidth = 2;
            g.beginPath(); g.moveTo(p.a[0], p.a[1]); g.lineTo(p.b[0], p.b[1]); g.stroke();
            g.setLineDash([]);
        }
        for (const p of h.posts || []) {
            g.fillStyle = 'rgba(0,0,0,.25)';
            g.beginPath();
            g.arc(p[0] + 3, p[1] + 4, p[2], 0, 7);
            g.fill();
            const P = course().pal;
            const base = p[3] ? (p.hit ? '#ffffff' : cid === 'cosmos' ? '#8a6bff' : '#ff5fa2') : cid === 'canyon' ? '#3fa463' : cid === 'glacier' ? '#cfeaf7' : P.wallDark;
            const gr = g.createRadialGradient(p[0] - p[2] * 0.35, p[1] - p[2] * 0.35, 1, p[0], p[1], p[2]);
            gr.addColorStop(0, shade(base, 0.45));
            gr.addColorStop(1, base);
            g.fillStyle = gr;
            g.beginPath();
            g.arc(p[0], p[1], p[2] * (p.hit ? 1.12 : 1), 0, 7);
            g.fill();
            if (p[3]) {
                g.strokeStyle = 'rgba(255,255,255,.7)';
                g.lineWidth = 2;
                g.beginPath(); g.arc(p[0], p[1], p[2] * 0.6, 0, 7); g.stroke();
            }
            else if (cid === 'canyon') {
                g.strokeStyle = 'rgba(255,255,255,.6)';
                g.lineWidth = 1;
                for (let i = 0; i < 6; i++) { const a = i * 1.05; g.beginPath(); g.moveTo(p[0] + Math.cos(a) * p[2] * 0.7, p[1] + Math.sin(a) * p[2] * 0.7); g.lineTo(p[0] + Math.cos(a) * (p[2] + 3), p[1] + Math.sin(a) * (p[2] + 3)); g.stroke(); }
            }
        }
    }
    function drawMovers(g) {
        const h = hole(), P = course().pal;
        for (const m of h.movers || []) {
            const st = moverState(m, simT);
            if (st.spin) {
                if (m.mill) {
                    g.fillStyle = 'rgba(0,0,0,.25)';
                    rrect(g, m.x - 20 + 5, m.y - 20 + 6, 40, 40, 6); g.fill();
                    g.fillStyle = '#c0533a';
                    rrect(g, m.x - 20, m.y - 20, 40, 40, 6); g.fill();
                    g.fillStyle = '#8f3524';
                    g.beginPath(); g.moveTo(m.x - 24, m.y - 16); g.lineTo(m.x, m.y - 30); g.lineTo(m.x + 24, m.y - 16); g.closePath(); g.fill();
                }
                for (const [[ax, ay], [bx, by]] of st.segs) {
                    g.strokeStyle = 'rgba(0,0,0,.25)';
                    g.lineWidth = 14;
                    g.lineCap = 'round';
                    g.beginPath(); g.moveTo(ax + 4, ay + 5); g.lineTo(bx + 4, by + 5); g.stroke();
                    g.strokeStyle = m.mill ? '#f4f1ea' : course().id === 'cosmos' ? '#d9d4ff' : '#f4f1ea';
                    g.lineWidth = 12;
                    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
                    g.strokeStyle = course().id === 'cosmos' ? '#58e6ff' : course().id === 'glacier' ? '#3a7bd5' : '#e53935';
                    g.setLineDash([12, 12]);
                    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
                    g.setLineDash([]);
                }
                g.fillStyle = '#8d5a2b';
                g.beginPath(); g.arc(m.x, m.y, 10, 0, 7); g.fill();
                g.fillStyle = '#ffd166';
                g.beginPath(); g.arc(m.x, m.y, 4, 0, 7); g.fill();
            }
            else {
                const [x, y, w, hh] = st.box;
                g.fillStyle = 'rgba(0,0,0,.25)';
                rrect(g, x + 4, y + 5, w, hh, 6); g.fill();
                const mg = g.createLinearGradient(x, 0, x + w, 0);
                mg.addColorStop(0, shade(P.wallDark, 0.2));
                mg.addColorStop(1, P.wallDark);
                g.fillStyle = mg;
                rrect(g, x, y, w, hh, 6); g.fill();
                g.fillStyle = 'rgba(255,255,255,.35)';
                rrect(g, x + 3, y + 3, w - 6, 8, 4); g.fill();
                g.fillStyle = P.accent;
                for (let yy = y + 16; yy < y + hh - 10; yy += 14) g.fillRect(x + 5, yy, w - 10, 4);
            }
        }
    }
    function drawFlag(g) {
        const h = hole();
        if (phase === 'sink' || phase === 'between') return;
        const cx = h.cup[0], cy = h.cup[1];
        const near = Math.hypot(ball.x - cx, ball.y - cy) < 60;
        g.globalAlpha = near ? 0.35 : 1;
        g.strokeStyle = 'rgba(0,0,0,.25)';
        g.lineWidth = 3;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + 22, cy + 10); g.stroke();
        g.strokeStyle = '#f4f1ea';
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx, cy - 44); g.stroke();
        const wv = Math.sin((flagWave || 0) * 5) * 3;
        g.fillStyle = course().pal.flag;
        g.beginPath();
        g.moveTo(cx, cy - 44);
        g.quadraticCurveTo(cx + 13, cy - 40 + wv, cx + 26, cy - 36);
        g.quadraticCurveTo(cx + 13, cy - 32 - wv, cx, cy - 28);
        g.fill();
        g.fillStyle = '#fff';
        g.font = `900 8px ${FONT}`;
        g.textAlign = 'center';
        g.fillText(String(holeI + 1), cx + 10, cy - 33 + wv * 0.3);
        g.globalAlpha = 1;
    }
    function skin() { return SKINS.find((s) => s.id === S.skin && (!s.need || S.ach[s.need])) || SKINS[0]; }
    function drawBall(g) {
        if (!ball.vis) return;
        const r = R * ball.s;
        if (r <= 0.2) return;
        const sk = skin();
        if (ball.trail.length > 1) {
            for (let i = 1; i < ball.trail.length; i++) {
                const k = i / ball.trail.length;
                g.strokeStyle = `rgba(255,255,255,${k * 0.35})`;
                g.lineWidth = r * 2 * k;
                g.lineCap = 'round';
                g.beginPath(); g.moveTo(ball.trail[i - 1][0], ball.trail[i - 1][1]); g.lineTo(ball.trail[i][0], ball.trail[i][1]); g.stroke();
            }
        }
        g.fillStyle = 'rgba(0,0,0,.28)';
        g.beginPath(); g.arc(ball.x + 2.5, ball.y + 3, r, 0, 7); g.fill();
        let gr;
        if (sk.id === 'rainbow') {
            gr = g.createConicGradient ? g.createConicGradient(A.time * 4, ball.x, ball.y) : null;
            if (gr) ['#ff5a36', '#ffd166', '#4cd964', '#3a7bd5', '#c58bff', '#ff5a36'].forEach((c, i) => gr.addColorStop(i / 5, c));
        }
        if (!gr) {
            gr = g.createRadialGradient(ball.x - r * 0.4, ball.y - r * 0.4, r * 0.1, ball.x, ball.y, r);
            gr.addColorStop(0, shade(sk.c[0], 0.5));
            gr.addColorStop(0.6, sk.c[0]);
            gr.addColorStop(1, sk.c[1]);
        }
        g.fillStyle = gr;
        g.beginPath(); g.arc(ball.x, ball.y, r, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,.85)';
        g.beginPath(); g.arc(ball.x - r * 0.35, ball.y - r * 0.35, r * 0.28, 0, 7); g.fill();
        if (sk.id === 'galaxy') {
            g.fillStyle = '#fff';
            for (let i = 0; i < 3; i++) g.fillRect(ball.x + Math.cos(i * 2 + A.time) * r * 0.5, ball.y + Math.sin(i * 2 + A.time) * r * 0.5, 1.2, 1.2);
        }
    }
    function drawAim(g) {
        if (phase !== 'aim' || A.state !== 'play') return;
        let ang, pow;
        if (drag && !drag.pending) {
            const dx = drag.x0 - drag.x, dy = drag.y0 - drag.y;
            pow = Math.min(1, Math.hypot(dx, dy) * A.scale / MAXDRAG);
            ang = Math.atan2(dy, dx);
            if (pow < 0.04) return;
        }
        else if (aim.kb) { ang = aim.a; pow = aim.p; }
        else return;
        const col = pow < 0.5 ? mix('#4cd964', '#ffd60a', pow * 2) : mix('#ffd60a', '#ff3b30', (pow - 0.5) * 2);
        const len = 40 + pow * 180;
        g.strokeStyle = col;
        g.fillStyle = col;
        g.lineWidth = 3;
        g.setLineDash([2, 9]);
        g.lineDashOffset = -A.time * 30;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(ball.x, ball.y);
        g.lineTo(ball.x + Math.cos(ang) * len, ball.y + Math.sin(ang) * len);
        g.stroke();
        g.setLineDash([]);
        g.lineDashOffset = 0;
        g.save();
        g.translate(ball.x + Math.cos(ang) * len, ball.y + Math.sin(ang) * len);
        g.rotate(ang);
        g.beginPath(); g.moveTo(8, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.fill();
        g.restore();
        g.strokeStyle = 'rgba(255,255,255,.7)';
        g.lineWidth = 2;
        g.beginPath(); g.moveTo(ball.x, ball.y); g.lineTo(ball.x - Math.cos(ang) * pow * 50, ball.y - Math.sin(ang) * pow * 50); g.stroke();
        g.beginPath();
        g.arc(ball.x, ball.y, R + 6 + pow * 8, -Math.PI / 2, -Math.PI / 2 + pow * Math.PI * 2);
        g.strokeStyle = col;
        g.lineWidth = 4;
        g.stroke();
    }
    function draw(g) {
        buildLayers();
        g.save();
        if (shake > 0.05) g.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        if (rot) g.transform(0, 1, -1, 0, CH, 0);
        g.drawImage(layers.low, 0, 0, CW, CH);
        drawDynamic(g);
        g.drawImage(layers.up, 0, 0, CW, CH);
        for (const r of ripples) {
            g.strokeStyle = `rgba(255,255,255,${1 - r.t})`;
            g.lineWidth = 2;
            g.beginPath(); g.arc(r.x, r.y, 6 + r.t * 30, 0, 7); g.stroke();
            g.beginPath(); g.arc(r.x, r.y, 3 + r.t * 16, 0, 7); g.stroke();
        }
        drawBall(g);
        drawMovers(g);
        drawFlag(g);
        drawAim(g);
        A.fx.draw(g);
        g.restore();
        if (A.state !== 'play' && A.state !== 'paused') return;
        const W = A.W, Hh = A.H;
        if (banner) {
            const a = Math.min(1, banner.t * 2, (banner.big ? 2.6 : 2.2) - banner.t + 0.6);
            const pop = 1 + Math.max(0, (banner.big ? 2.6 : 2.2) - banner.t < 0.25 ? 0.25 - ((banner.big ? 2.6 : 2.2) - banner.t) : 0);
            g.globalAlpha = Math.max(0, Math.min(1, a));
            const bw = Math.min(W - 30, banner.card ? 440 : 340), bh = (banner.card ? 150 : 84) + (banner.quip ? 26 : 0);
            const by = Hh * 0.5 - bh / 2;
            g.save();
            g.translate(W / 2, Hh / 2);
            g.scale(pop, pop);
            g.translate(-W / 2, -Hh / 2);
            const bgg = g.createLinearGradient(0, by, 0, by + bh);
            bgg.addColorStop(0, 'rgba(25,45,30,.88)');
            bgg.addColorStop(1, 'rgba(10,25,15,.88)');
            g.fillStyle = bgg;
            rrect(g, W / 2 - bw / 2, by, bw, bh, 18);
            g.fill();
            g.strokeStyle = 'rgba(255,255,255,.15)';
            g.lineWidth = 1.5;
            g.stroke();
            g.textAlign = 'center';
            g.fillStyle = '#ffffff';
            g.font = `900 ${banner.big ? 32 : 26}px ${FONT}`;
            g.fillText(banner.title, W / 2, by + 38);
            g.font = `700 15px ${FONT}`;
            g.fillStyle = '#c8f5c0';
            g.fillText(banner.sub, W / 2, by + 62);
            if (banner.card) {
                const n = round.length, cw = Math.min(42, (bw - 30) / n);
                const x0 = W / 2 - (cw * n) / 2;
                for (let i = 0; i < n; i++) {
                    const x = x0 + i * cw + cw / 2;
                    g.fillStyle = 'rgba(255,255,255,.5)';
                    g.font = `700 11px ${FONT}`;
                    g.fillText(String(i + 1), x, by + 92);
                    const v = card[i], par = round[i].hole.par;
                    g.font = `800 16px ${FONT}`;
                    g.fillStyle = v == null ? 'rgba(255,255,255,.3)' : v < par ? '#7dffb0' : v > par ? '#ffb38a' : '#ffffff';
                    g.fillText(v == null ? '·' : String(v), x, by + 116);
                    g.fillStyle = 'rgba(255,255,255,.4)';
                    g.font = `600 10px ${FONT}`;
                    g.fillText('par ' + par, x, by + 134);
                }
            }
            if (banner.quip) {
                g.font = `italic 600 13px ${FONT}`;
                g.fillStyle = '#ffe9a8';
                g.fillText(banner.quip, W / 2, by + bh - 14, bw - 24);
            }
            g.restore();
            g.globalAlpha = 1;
        }
        if (phase === 'aim' && (!drag || drag.pending) && strokes === 0 && !aim.kb && !banner) {
            g.textAlign = 'center';
            g.font = `700 14px ${FONT}`;
            g.fillStyle = 'rgba(255,255,255,.92)';
            g.fillText(mode === 'practice' ? 'Practice: [ ] change hole, R restarts it' : S.aim === 'point' && !document.body.classList.contains('arc-touch') ? 'Point where to putt (further = harder), then click' : Curio.touchpad ? 'Click, pull back, click again to putt' : 'Drag back from anywhere, release to putt', W / 2, Hh - 14);
        }
    }
    const canvas = A.canvas;
    function paintBadges(el, fresh) {
        if (!el) return;
        const list = fresh ? ACH.filter((a) => fresh.includes(a.id)) : ACH;
        el.innerHTML = list.map((a) => `<span class="mg-badge${S.ach[a.id] ? ' is-on' : ''}${fresh ? ' is-new' : ''}" title="${a.d}"><i aria-hidden="true">${S.ach[a.id] ? '★' : '☆'}</i>${a.name}</span>`).join('');
        el.hidden = !list.length;
    }
    function paintMenu() {
        document.querySelectorAll('[data-course]').forEach((b) => {
            const id = b.dataset.course;
            const best = Curio.getBest('course-' + id);
            const c = COURSES.find((x) => x.id === id);
            const par = c.holes.reduce((s, h) => s + h.par, 0);
            b.querySelector('[data-cbest]').textContent = best == null ? `Par ${par}` : `Best ${best} · par ${par}`;
            b.setAttribute('aria-pressed', String(id === courseId && mode !== 'daily'));
        });
        const db = document.querySelector('[data-daily-best]');
        if (db) db.textContent = S.daily[today()] != null ? `Today: ${S.daily[today()]}` : 'Three random holes, same for everyone today';
        document.querySelectorAll('[data-aim]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.aim === S.aim)));
        document.querySelectorAll('[data-gm]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.gm === (mode === 'practice' ? 'practice' : 'round'))));
        const sk = document.querySelector('[data-skins]');
        if (sk) sk.innerHTML = SKINS.map((s) => {
            const ok = !s.need || S.ach[s.need];
            const bg = s.id === 'rainbow' ? 'conic-gradient(#ff5a36,#ffd166,#4cd964,#3a7bd5,#c58bff,#ff5a36)' : `radial-gradient(circle at 35% 35%, ${shade(s.c[0], 0.5)}, ${s.c[0]} 55%, ${s.c[1]})`;
            const need = ACH.find((a) => a.id === s.need);
            return `<button type="button" class="mg-skin" data-skin="${s.id}" aria-pressed="${S.skin === s.id}" ${ok ? '' : 'disabled'} title="${ok ? s.name : 'Locked: ' + need.d}" aria-label="${s.name} ball${ok ? '' : ' (locked)'}" style="background:${bg}">${ok ? '' : '🔒'}</button>`;
        }).join('');
        const st = S.stats;
        const stats = document.querySelector('[data-stats]');
        if (stats) stats.innerHTML = `<div class="c-stat"><b>${st.rounds}</b><span>Rounds</span></div><div class="c-stat"><b>${st.holes}</b><span>Holes</span></div><div class="c-stat"><b>${st.aces}</b><span>Aces</span></div><div class="c-stat"><b>${st.holes ? (st.strokes / st.holes).toFixed(1) : '-'}</b><span>Avg/hole</span></div><div class="c-stat"><b>${st.splashes}</b><span>Hazards</span></div>`;
        paintBadges(document.querySelector('[data-badges]'));
        const cnt = document.querySelector('[data-badge-count]');
        if (cnt) cnt.textContent = `${ACH.filter((a) => S.ach[a.id]).length}/${ACH.length}`;
    }
    document.addEventListener('click', (e) => {
        const c = e.target.closest('[data-course]');
        if (c) { courseId = c.dataset.course; if (mode === 'daily') mode = 'round'; A.start(); return; }
        if (e.target.closest('[data-daily]')) { mode = 'daily'; A.start(); return; }
        const am = e.target.closest('[data-aim]');
        if (am) { S.aim = am.dataset.aim; save(); paintMenu(); A.beep(600, 0.04, 'triangle', 0.05); return; }
        if (e.target.closest('[data-mg-adv]')) { Curio.setMode('advanced'); return; }
        const m = e.target.closest('[data-gm]');
        if (m) { mode = m.dataset.gm; paintMenu(); A.beep(520, 0.04, 'triangle', 0.05); return; }
        const s = e.target.closest('[data-skin]');
        if (s && !s.disabled) { S.skin = s.dataset.skin; save(); paintMenu(); A.beep(700, 0.05, 'triangle', 0.06); return; }
        const j = e.target.closest('[data-mg-prac]');
        if (j) { jumpHole(j.dataset.mgPrac === 'next' ? 1 : -1); j.blur(); return; }
        if (e.target.closest('[data-share]')) {
            const txt = shareText();
            (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Scorecard copied'), () => Curio.toast('Copy failed, sorry'));
        }
    });
    A.debug = () => ({
        hole: holeI, strokes, phase, card: card.slice(), ball: { x: Math.round(ball.x), y: Math.round(ball.y) }, rot, mode, course: course().id,
        cupPos: hole().cup, count: round.length,
        sink() { const h = hole(); ball.x = h.cup[0] - 30; ball.y = h.cup[1]; ball.vx = 0; ball.vy = 0; ball.pc = -1; phase = 'aim'; aim.a = Math.atan2(h.cup[1] - ball.y, h.cup[0] - ball.x); aim.p = 0.4; aim.kb = true; banner = null; },
        skipBanner() { banner = null; phaseT = Math.min(phaseT || 0, 0.01); },
        toWater() { const h = hole(); const s = (h.water || [])[0]; if (!s) return false; const b = bbox(s); ball.x = b[0] + b[2] / 2; ball.y = b[1] + b[3] / 2; ball.vx = 1; ball.vy = 0; phase = 'roll'; return true; },
        jump(i) { holeI = i; startHole(); },
        setMode(m, c) { mode = m; if (c) courseId = c; },
        solve(ci, hi, opts = {}) {
            const c = COURSES[ci], h = c.holes[hi];
            const save0 = round, saveI = holeI;
            round = [{ course: c, hole: h, idx: hi }];
            holeI = 0;
            prep(h);
            quiet = true;
            const angN = opts.ang || 72, pows = opts.pows || [0.15, 0.25, 0.35, 0.45, 0.55, 0.7, 0.85, 1], cap = opts.cap || 30, depth = opts.depth || h.par + 1;
            let rnd = seeded(ci * 100 + hi + 7);
            const sim = (x, y, a, p, t0) => {
                const b = { x, y, vx: Math.cos(a) * shotSpeed(p), vy: Math.sin(a) * shotSpeed(p), pc: -1, trail: [] };
                let t = t0, still = 0;
                for (let i = 0; i < 120 * 12; i++) {
                    for (let k = 0; k < 4; k++) {
                        const r = step(b, 1 / 480, t);
                        t += 1 / 480;
                        if (r) return { r, x, y };
                    }
                    const sp = Math.hypot(b.vx, b.vy);
                    if (sp < 9) still += 1 / 120; else still = 0;
                    if (still > 0.25 || sp < 2) break;
                }
                return { r: 'stop', x: b.x, y: b.y };
            };
            let front = [[h.tee[0], h.tee[1]]], found = 0, shots = 0;
            for (let d = 1; d <= depth && !found; d++) {
                const next = new Map();
                for (const [x, y] of front) {
                    for (let ai = 0; ai < angN && !found; ai++) {
                        const a = ai / angN * Math.PI * 2 + rnd() * 0.02;
                        for (const p of pows) {
                            shots++;
                            const r = sim(x, y, a, p, rnd() * 10);
                            if (r.r === 'cup') { found = d; break; }
                            if (r.r === 'stop') next.set(`${Math.round(r.x / 25)},${Math.round(r.y / 25)}`, [r.x, r.y]);
                        }
                    }
                    if (found) break;
                }
                const arr = [...next.values()];
                arr.sort((p, q) => Math.hypot(p[0] - h.cup[0], p[1] - h.cup[1]) - Math.hypot(q[0] - h.cup[0], q[1] - h.cup[1]));
                front = arr.slice(0, cap >> 1); const rest = arr.slice(cap >> 1); for (let i = 0; i < cap >> 1 && rest.length; i++) front.push(rest.splice(Math.floor(rnd() * rest.length), 1)[0]);
            }
            quiet = false;
            round = save0;
            holeI = saveI;
            return { name: h.name, par: h.par, found, shots };
        }
    });
    if (S.aim === 'sling' && !Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tpTip', false)) { Curio.store.set('tpTip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar to putt with click, pull, click'), 1800); }
    rot = false;
    buildRound();
    holeI = 0;
    card = [];
    penalties = 0;
    startHole();
    banner = null;
    A.boot();
})();
