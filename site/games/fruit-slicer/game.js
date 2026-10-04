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
    Curio.drag(canvas, {
        start(p) {
            const e = p.event;
            if (e.pointerType === 'touch') document.body.classList.add('arc-touch');
            if (A.state !== 'play') { ptr = null; return; }
            e.preventDefault();
            ptr = { x0: p.clientX, y0: p.clientY, t: performance.now(), moved: false };
            o.pointer?.('down', toLogical(p), e);
        },
        move(p) {
            if (!ptr || A.state !== 'play') return;
            o.pointer?.('move', toLogical(p), p.event);
        },
        end(p) {
            if (!ptr) return;
            o.pointer?.('up', p ? toLogical(p) : null, p ? p.event : null);
            ptr = null;
        }
    });
    canvas.addEventListener('pointermove', (e) => { if (!ptr && A.state === 'play' && e.pointerType === 'mouse') o.pointer?.('hover', toLogical(e), e); });
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
    const H = 600, G = 720;
    const FRUITS = {
        watermelon: { r: 38, skin: '#2f9a3e', dark: '#1b6127', flesh: '#ff4d5e', rim: '#d9f7a6', juice: '#ff3b55', pts: 1 },
        orange: { r: 26, skin: '#ff951c', dark: '#e07400', flesh: '#ffc04d', rim: '#fff0c2', juice: '#ffa21f', pts: 1 },
        apple: { r: 25, skin: '#e3313c', dark: '#a31621', flesh: '#fff3c9', rim: '#ffe9a8', juice: '#f7ea9a', pts: 1 },
        lemon: { r: 24, skin: '#ffe03a', dark: '#e6b800', flesh: '#fff6a3', rim: '#fffbe0', juice: '#fff06b', pts: 1 },
        kiwi: { r: 22, skin: '#8b6b3e', dark: '#5e4524', flesh: '#86cf45', rim: '#c7ef9b', juice: '#97e055', pts: 1 },
        peach: { r: 26, skin: '#ffab76', dark: '#ff6b5b', flesh: '#ffcf7a', rim: '#ffe1a8', juice: '#ffb35c', pts: 1 },
        plum: { r: 21, skin: '#7a2c8f', dark: '#4e1760', flesh: '#ffc94a', rim: '#ffe28a', juice: '#c73a8a', pts: 1 },
        coconut: { r: 27, skin: '#6b4a2c', dark: '#4a311b', flesh: '#fbf8f0', rim: '#e8dccb', juice: '#f4f1ea', pts: 2 },
        star: { r: 24, skin: '#ffd23f', dark: '#f4a300', flesh: '#fff4a8', rim: '#fff', juice: '#ffe14d', pts: 5 },
        strawberry: { r: 22, skin: '#e8283a', dark: '#a8121f', flesh: '#ff7a86', rim: '#ffd0d5', juice: '#ff3049', pts: 1 },
        pear: { r: 25, skin: '#b9d83a', dark: '#86a51c', flesh: '#fbf6d2', rim: '#eef3b5', juice: '#e6f29a', pts: 1 },
        pineapple: { r: 30, skin: '#e8a91e', dark: '#9c6a10', flesh: '#ffe36b', rim: '#fff2b3', juice: '#ffd93b', pts: 2 },
        dragonfruit: { r: 26, skin: '#ff3d8b', dark: '#2fae55', flesh: '#ffffff', rim: '#ff9cc4', juice: '#ff6fae', pts: 2 },
        lime: { r: 21, skin: '#5ec43a', dark: '#2f8c1e', flesh: '#c6f08a', rim: '#ecffd0', juice: '#9be05a', pts: 1 },
        frost: { r: 24, skin: '#7fdcff', dark: '#2a9fd6', flesh: '#e6f9ff', rim: '#ffffff', juice: '#bdf0ff', pts: 3 },
        frenzy: { r: 24, skin: '#ff8a3d', dark: '#d94f10', flesh: '#ffe0b3', rim: '#fff', juice: '#ffb36b', pts: 3 },
        double: { r: 24, skin: '#b18cff', dark: '#6d45d6', flesh: '#ece2ff', rim: '#fff', juice: '#c9b0ff', pts: 3 }
    };
    const KINDS = ['watermelon', 'orange', 'apple', 'lemon', 'kiwi', 'peach', 'plum', 'coconut', 'strawberry', 'pear', 'pineapple', 'dragonfruit', 'lime'];
    const SPECIAL = ['frost', 'frenzy', 'double'];
    const SKEY = 'fs2';
    const loadS = () => { const base = { v: 1, mode: 'classic', wide: false, hover: false, blade: 'classic', ach: {}, stats: { games: 0, fruit: 0, bestCombo: 0, best: {} }, daily: {} }; const d = Curio.store.get(SKEY, null); return d && d.v === 1 ? { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } } : base; };
    const S = loadS();
    const save = () => Curio.store.set(SKEY, S);
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const BLADES = [
        { id: 'classic', name: 'Steel', need: 0, glow: 'rgba(140,220,255,.45)', core: '#ffffff' },
        { id: 'fire', name: 'Fire', need: 100, glow: 'rgba(255,120,40,.55)', core: '#fff3c4' },
        { id: 'leaf', name: 'Bamboo', need: 200, glow: 'rgba(90,220,110,.5)', core: '#eaffd8' },
        { id: 'rainbow', name: 'Rainbow', need: 350, glow: null, core: '#ffffff' }
    ];
    const ACH = [
        { id: 'first', name: 'First Slice', d: 'Slice a fruit' },
        { id: 'combo4', name: 'Quad Slice', d: 'Slice 4 fruit in one swipe' },
        { id: 'combo6', name: 'Fruit Ninja', d: 'Slice 6 fruit in one swipe' },
        { id: 'score100', name: 'Smoothie Maker', d: 'Score 100 in one game' },
        { id: 'score250', name: 'Juice Bar', d: 'Score 250 in one game' },
        { id: 'star', name: 'Starstruck', d: 'Slice a star fruit' },
        { id: 'frenzy', name: 'Fruit Storm', d: 'Trigger a frenzy fruit' },
        { id: 'allkinds', name: 'Fruit Salad', d: 'Slice every kind of fruit in one game' },
        { id: 'zen200', name: 'Inner Peace', d: 'Slice 200 fruit in total' },
        { id: 'daily', name: 'Daily Dicer', d: 'Finish a daily game' },
        { id: 'nobomb', name: 'Bomb Dodger', d: 'Finish an Arcade game without hitting a bomb' }
    ];
    let rnd = Math.random, timeLeft = 0, slowT = 0, frenzyT = 0, doubleT = 0, bombHits = 0, fresh = [], lastRes = null, kindsSeen = {};
    const pickR = (a) => a[Math.floor(rnd() * a.length)];
    const randR = (a, b) => a + rnd() * (b - a);
    function seeded(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function award(id) { if (S.ach[id]) return; S.ach[id] = Date.now(); fresh.push(id); const a = ACH.find((x) => x.id === id); if (a && A.state === 'play') Curio.toast(`🏅 ${a.name}`); }
    const bladeSkin = () => BLADES.find((b) => b.id === S.blade && (S.stats.best.classic || 0) >= b.need) || BLADES[0];
    const timed = () => S.mode !== 'classic';
    let items, halves, splats, texts, blade, misses, volleyT, volleys, level, sliced, bestCombo, bombT, flash, stroke, shake;
    const A = Arcade({
        width: 800, height: H, reset, update, draw, pointer, idle,
        size: (w, h) => ({ w: Math.round(Math.max(340, Math.min(1000, H * w / h))), h: H })
    });
    function reset() {
        items = [];
        halves = [];
        splats = [];
        texts = [];
        blade = [];
        misses = 0;
        volleyT = 1;
        volleys = 0;
        level = 1;
        sliced = 0;
        bestCombo = 0;
        bombT = 0;
        flash = 0;
        shake = 0;
        stroke = null;
        timers = [];
        A.bestKey = S.mode === 'classic' ? 'score' : S.mode === 'daily' ? 'daily-' + today() : S.mode;
        rnd = S.mode === 'daily' ? seeded([...today()].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) : Math.random;
        timeLeft = S.mode === 'zen' ? 90 : 60;
        slowT = 0; frenzyT = 0; doubleT = 0; bombHits = 0; fresh = []; kindsSeen = {};
        A.fx.clear();
        hud();
    }
    function hud() {
        if (timed()) { A.hud('missesLbl', 'Time'); A.hud('misses', Math.ceil(Math.max(0, timeLeft))); }
        else { A.hud('missesLbl', 'Drops'); A.hud('misses', '✕'.repeat(misses) + '○'.repeat(Math.max(0, 3 - misses))); }
        A.hud('sliced', sliced);
    }
    function launch(kind, demo) {
        const W = A.W;
        const rr = demo ? Curio.rand : randR;
        const x = rr(W * 0.14, W * 0.86);
        const peak = rr(H * 0.12, H * 0.42);
        const vy = -Math.sqrt(2 * G * (H + 40 - peak));
        const tFlight = -vy / G;
        const tx = rr(W * 0.25, W * 0.75);
        const vx = (tx - x) / (tFlight * 1.6);
        const def = kind === 'bomb' ? { r: 24 } : FRUITS[kind];
        items.push({ kind, x, y: H + 40, vx, vy, r: def.r + (S.wide && !demo ? 6 : 0), rot: Math.random() * 7, vr: Curio.rand(-3, 3), demo, t: 0 });
        if (!demo) A.sweep(160, 320, 0.12, 'sine', 0.05);
    }
    function volley() {
        volleys++;
        const maxN = Math.min(6, 1 + Math.floor(level / 1.5)) + (timed() ? 1 : 0);
        const n = 1 + Math.floor(rnd() * maxN);
        let bombs = 0;
        const bombChance = S.mode === 'zen' || volleys < 4 ? 0 : Math.min(0.28, 0.08 + level * 0.025);
        const together = rnd() < 0.5;
        for (let i = 0; i < n; i++) {
            let kind = rnd() < 0.035 ? 'star' : pickR(KINDS);
            if (timed() && S.mode !== 'zen' && rnd() < 0.06) kind = pickR(SPECIAL);
            if (rnd() < bombChance && bombs < 2) { kind = 'bomb'; bombs++; }
            setTimeoutGame(() => launch(kind, false), together ? i * 0.06 : i * 0.32);
        }
        if (volleys > 3 && rnd() < bombChance * 0.5 && !bombs) setTimeoutGame(() => launch('bomb', false), 0.5);
    }
    let timers = [];
    function setTimeoutGame(fn, d) { timers.push({ fn, t: d }); }
    function splitFruit(it, ang) {
        const f = FRUITS[it.kind];
        const nx = -Math.sin(ang), ny = Math.cos(ang);
        for (const s of [-1, 1]) {
            halves.push({
                kind: it.kind, x: it.x + nx * s * 3, y: it.y + ny * s * 3, vx: it.vx * 0.6 + nx * s * 90, vy: Math.min(it.vy, 0) * 0.4 + ny * s * 90 - 60,
                ang, side: s, rot: 0, vr: s * Curio.rand(1.5, 4), r: it.r, life: 3
            });
        }
        A.fx.burst(it.x, it.y, 22, [f.juice, f.flesh, f.juice], { speed: 260, life: 0.7, size: 4.5, gravity: 600, drag: 1.2 });
        A.fx.burst(it.x, it.y, 10, ['#ffffff'], { speed: 180, life: 0.35, size: 2, gravity: 200 });
        splats.push({ x: it.x, y: it.y, r: it.r * Curio.rand(1.1, 1.6), c: f.juice, a: 0.55, seed: Math.random() * 100, ang: ang });
        if (splats.length > 18) splats.shift();
    }
    function hit(it, ang) {
        if (it.kind === 'bomb') {
            if (it.demo) return;
            it.dead = true;
            navigator.vibrate?.([80, 40, 80]);
            if (timed()) {
                bombHits++;
                A.addScore(-Math.min(A.score, 10));
                flash = 0.6; shake = 0.5;
                texts.push({ x: it.x, y: it.y - 30, s: 'Boom! -10', t: 1.2, c: '#ff5a5a', big: true });
                A.fx.burst(it.x, it.y, 50, ['#ffffff', '#ffd166', '#ff6b3d', '#555'], { speed: 380, life: 0.9, size: 4, gravity: 200 });
                A.noise(0.9, 0.3, 1600);
                if (stroke) stroke.hits = [];
                return;
            }
            bombT = 1.3;
            flash = 1;
            shake = 0.8;
            A.fx.burst(it.x, it.y, 60, ['#ffffff', '#ffd166', '#ff6b3d', '#555'], { speed: 420, life: 1.1, size: 4, gravity: 200 });
            A.noise(1.2, 0.3, 1600);
            A.sweep(200, 30, 1, 'sawtooth', 0.08);
            stroke = null;
            return;
        }
        it.dead = true;
        splitFruit(it, ang);
        if (it.demo) return;
        const f = FRUITS[it.kind];
        A.addScore(f.pts * (doubleT > 0 ? 2 : 1));
        sliced++;
        S.stats.fruit++;
        award('first');
        if (S.stats.fruit >= 200) award('zen200');
        kindsSeen[it.kind] = 1;
        if (KINDS.every((k) => kindsSeen[k])) award('allkinds');
        if (it.kind === 'star') award('star');
        navigator.vibrate?.(6);
        if (it.kind === 'frost') { slowT = 4; texts.push({ x: it.x, y: it.y - 30, s: 'Freeze!', t: 1.2, c: '#bdf0ff', big: true }); A.sweep(1600, 400, 0.5, 'sine', 0.06); }
        if (it.kind === 'frenzy') { frenzyT = 3.5; award('frenzy'); texts.push({ x: it.x, y: it.y - 30, s: 'Frenzy!', t: 1.2, c: '#ffb36b', big: true }); A.sweep(300, 1200, 0.4, 'square', 0.05); }
        if (it.kind === 'double') { doubleT = 6; texts.push({ x: it.x, y: it.y - 30, s: 'Double points!', t: 1.2, c: '#c9b0ff', big: true }); }
        hud();
        if (it.kind === 'star') {
            texts.push({ x: it.x, y: it.y - 30, s: 'Star fruit +5', t: 1.2, c: '#ffe14d', big: true });
            [880, 1175, 1568].forEach((fq, i) => setTimeout(() => A.beep(fq, 0.1, 'triangle', 0.07), i * 60));
        }
        A.noise(0.12, 0.14, 3000 + Math.random() * 1500);
        A.beep(500 + Math.random() * 200 + (stroke ? stroke.hits.length * 80 : 0), 0.07, 'triangle', 0.06);
        if (stroke) {
            stroke.hits.push({ x: it.x, y: it.y });
            stroke.last = A.time;
        }
        level = 1 + Math.floor(sliced / 15);
    }
    function endCombo() {
        if (!stroke) return;
        const n = stroke.hits.length;
        if (n >= 4) award('combo4');
        if (n >= 6) award('combo6');
        if (n >= 3) {
            const bonus = n;
            A.addScore(bonus);
            bestCombo = Math.max(bestCombo, n);
            const cx = stroke.hits.reduce((s, h) => s + h.x, 0) / n, cy = stroke.hits.reduce((s, h) => s + h.y, 0) / n;
            texts.push({ x: Math.max(90, Math.min(A.W - 90, cx)), y: Math.max(60, cy - 30), s: `${n} fruit combo +${bonus}`, t: 1.4, c: '#ffe14d', big: true });
            [659, 784, 988, 1319].slice(0, Math.min(4, n - 1)).forEach((fq, i) => setTimeout(() => A.beep(fq, 0.12, 'square', 0.05), i * 70));
        }
        stroke.hits = [];
    }
    function segHit(ax, ay, bx, by, cx, cy, r) {
        const dx = bx - ax, dy = by - ay;
        const l2 = dx * dx + dy * dy || 1;
        let t = ((cx - ax) * dx + (cy - ay) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const px = ax + dx * t - cx, py = ay + dy * t - cy;
        return px * px + py * py <= r * r;
    }
    function cut(ax, ay, bx, by, demo) {
        const len = Math.hypot(bx - ax, by - ay);
        if (len < 3) return;
        const ang = Math.atan2(by - ay, bx - ax);
        for (const it of items) {
            if (it.dead || (!!it.demo !== !!demo)) continue;
            if (segHit(ax, ay, bx, by, it.x, it.y, it.r + (S.wide ? 14 : 4))) hit(it, ang);
        }
    }
    function pointer(type, p) {
        if (bombT > 0) return;
        if (type === 'hover') {
            if (!S.hover) return;
            if (!stroke) stroke = { hits: [], last: A.time, down: true, hover: true };
            const last = blade[blade.length - 1];
            blade.push({ x: p.x, y: p.y, t: A.time });
            if (last && A.time - last.t < 0.12) cut(last.x, last.y, p.x, p.y, false);
            return;
        }
        if (type === 'up' && !p) { if (stroke) { endCombo(); stroke.down = false; } return; }
        if (type === 'down') {
            blade = [{ x: p.x, y: p.y, t: A.time }];
            stroke = { hits: [], last: A.time, down: true };
            A.sweep(900, 1800, 0.06, 'sine', 0.025);
        }
        else if (type === 'move') {
            if (!stroke || !stroke.down) return;
            const last = blade[blade.length - 1];
            blade.push({ x: p.x, y: p.y, t: A.time });
            if (last) cut(last.x, last.y, p.x, p.y, false);
        }
        else if (type === 'up') {
            if (stroke) { endCombo(); stroke.down = false; }
        }
    }
    function physics(dt, demo) {
        for (let i = timers.length - 1; i >= 0; i--) {
            timers[i].t -= dt;
            if (timers[i].t <= 0) { const fn = timers[i].fn; timers.splice(i, 1); fn(); }
        }
        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            if (it.dead) { items.splice(i, 1); continue; }
            it.t += dt;
            it.vy += G * dt;
            it.x += it.vx * dt;
            it.y += it.vy * dt;
            it.rot += it.vr * dt;
            if (it.kind === 'bomb' && Math.random() < dt * 30) {
                const fx = it.x + Math.cos(it.rot - 0.8) * it.r * 1.25, fy = it.y + Math.sin(it.rot - 0.8) * it.r * 1.25;
                A.fx.burst(fx, fy, 1, ['#ffd166', '#ff8a3d', '#ffffff'], { speed: 60, life: 0.3, size: 2.5, gravity: -40 });
            }
            if (it.vy > 0 && it.y > H + it.r + 30) {
                items.splice(i, 1);
                if (!demo && !it.demo && it.kind !== 'bomb' && !timed()) {
                    misses++;
                    hud();
                    A.sweep(300, 120, 0.3, 'triangle', 0.08);
                    texts.push({ x: Math.max(30, Math.min(A.W - 30, it.x)), y: H - 30, s: '✕', t: 1, c: '#ff5a5a', big: true });
                    if (misses >= 3) bombT = 0.9;
                }
            }
        }
        for (let i = halves.length - 1; i >= 0; i--) {
            const h = halves[i];
            h.vy += G * dt;
            h.x += h.vx * dt;
            h.y += h.vy * dt;
            h.rot += h.vr * dt;
            if (h.y > H + 80) halves.splice(i, 1);
        }
        for (let i = splats.length - 1; i >= 0; i--) {
            splats[i].a -= dt * 0.12;
            if (splats[i].a <= 0) splats.splice(i, 1);
        }
        for (let i = texts.length - 1; i >= 0; i--) {
            texts[i].t -= dt;
            texts[i].y -= 30 * dt;
            if (texts[i].t <= 0) texts.splice(i, 1);
        }
        A.fx.update(dt);
        const cutoff = A.time - 0.14;
        while (blade.length && blade[0].t < cutoff) blade.shift();
        flash = Math.max(0, flash - dt * 1.4);
        shake = Math.max(0, shake - dt);
    }
    function finish(title, emoji, msg) {
        S.stats.games++;
        S.stats.bestCombo = Math.max(S.stats.bestCombo, bestCombo);
        S.stats.best[S.mode] = Math.max(S.stats.best[S.mode] || 0, A.score);
        if (A.score >= 100) award('score100');
        if (A.score >= 250) award('score250');
        if (S.mode === 'daily') { award('daily'); S.daily[today()] = Math.max(S.daily[today()] || 0, A.score); }
        if (S.mode === 'arcade' && !bombHits) award('nobomb');
        save();
        lastRes = { sliced, bestCombo };
        A.over({ title, emoji, msg });
        const el = document.querySelector('[data-o="badges"]');
        if (el) el.innerHTML = fresh.map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="fs-badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
        paintMenu();
    }
    function update(dt) {
        if (timed() && bombT <= 0) {
            const before = Math.ceil(timeLeft);
            timeLeft -= dt;
            if (Math.ceil(timeLeft) !== before) { hud(); if (timeLeft < 5.5 && timeLeft > 0) A.beep(1000, 0.05, 'square', 0.04); }
            if (timeLeft <= 0) { finish("Time's up!", '🍉', `${sliced} fruit sliced${bestCombo >= 3 ? `, best combo ${bestCombo}` : ''}. ${A.score >= 200 ? 'A blade of legend.' : A.score >= 90 ? 'The fruit bowl fears you.' : 'Smoothies for everyone.'}`); return; }
        }
        slowT = Math.max(0, slowT - dt);
        doubleT = Math.max(0, doubleT - dt);
        if (frenzyT > 0) {
            frenzyT -= dt;
            if (Math.random() < dt * 9) launch(pickR(KINDS), false);
        }
        if (slowT > 0) dt *= 0.45;
        if (bombT > 0) {
            bombT -= dt;
            physics(dt * 0.25, false);
            if (bombT <= 0) {
                const byBomb = misses < 3;
                finish(byBomb ? 'Kaboom!' : 'Too many drops', byBomb ? '💣' : '🍉', `${sliced} fruit sliced${bestCombo >= 3 ? `, best combo ${bestCombo}` : ''}. ${A.score >= 150 ? 'A blade of legend.' : A.score >= 60 ? 'The fruit bowl fears you.' : byBomb ? 'Tip: bombs are not fruit.' : 'Gravity: 3, You: 0.'}`);
            }
            return;
        }
        if (stroke && stroke.hits.length && A.time - stroke.last > 0.3) endCombo();
        volleyT -= dt;
        if (volleyT <= 0) {
            volley();
            volleyT = Math.max(0.95, 2.7 - level * 0.18) * randR(0.85, 1.2) * (timed() ? 0.75 : 1);
        }
        physics(dt, false);
    }
    let demoT = 0, demoBlade = null;
    function idle(dt) {
        if (A.state !== 'menu') return;
        demoT -= dt;
        if (demoT <= 0) {
            demoT = Curio.rand(1.2, 2);
            const n = Curio.randInt(1, 3);
            for (let i = 0; i < n; i++) launch(Curio.pick(KINDS), true);
        }
        for (const it of items) {
            if (!it.dead && it.demo && it.vy > -60 && it.vy < 60 && !it.cutPlanned) {
                it.cutPlanned = true;
                if (Math.random() < 0.8) demoBlade = { x0: it.x - 80, y0: it.y - 50, x1: it.x + 80, y1: it.y + 40, t: 0 };
            }
        }
        if (demoBlade) {
            const b = demoBlade;
            const t0 = b.t;
            b.t = Math.min(1, b.t + dt * 6);
            const ax = b.x0 + (b.x1 - b.x0) * t0, ay = b.y0 + (b.y1 - b.y0) * t0;
            const bx = b.x0 + (b.x1 - b.x0) * b.t, by = b.y0 + (b.y1 - b.y0) * b.t;
            blade.push({ x: bx, y: by, t: A.time });
            cut(ax, ay, bx, by, true);
            if (b.t >= 1) demoBlade = null;
        }
        physics(dt, true);
    }
    function wood(g) {
        const W = A.W;
        const dark = A.dark;
        const base = dark ? ['#3b2616', '#432b19', '#36220f', '#3f2815'] : ['#b9814a', '#c48b52', '#ad7843', '#bf874d'];
        const pw = 110;
        for (let i = 0, x = 0; x < W; i++, x += pw) {
            g.fillStyle = base[i % 4];
            g.fillRect(x, 0, pw, H);
            g.strokeStyle = dark ? 'rgba(0,0,0,.35)' : 'rgba(90,50,20,.35)';
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(x + 0.5, 0);
            g.lineTo(x + 0.5, H);
            g.stroke();
            g.strokeStyle = dark ? 'rgba(255,220,180,.04)' : 'rgba(90,50,20,.12)';
            g.lineWidth = 1.2;
            for (let k = 0; k < 4; k++) {
                const gx = x + 18 + k * 24 + ((i * 7) % 9);
                g.beginPath();
                g.moveTo(gx, 0);
                g.bezierCurveTo(gx + 6, H * 0.3, gx - 6, H * 0.6, gx + 3, H);
                g.stroke();
            }
            g.fillStyle = dark ? 'rgba(0,0,0,.25)' : 'rgba(90,50,20,.18)';
            g.beginPath();
            g.ellipse(x + 40 + ((i * 37) % 30), (i * 173) % H, 7, 11, 0, 0, 7);
            g.fill();
        }
    }
    function drawSplat(g, s) {
        g.globalAlpha = Math.max(0, s.a);
        g.fillStyle = s.c;
        g.beginPath();
        g.arc(s.x, s.y, s.r * 0.7, 0, 7);
        g.fill();
        for (let k = 0; k < 7; k++) {
            const a = s.seed + k * 0.9, d = s.r * (0.7 + ((s.seed * (k + 3)) % 0.6));
            g.beginPath();
            g.arc(s.x + Math.cos(a) * d, s.y + Math.sin(a) * d, s.r * (0.12 + ((s.seed * (k + 1)) % 0.18)), 0, 7);
            g.fill();
        }
        g.globalAlpha = 1;
    }
    function drawWhole(g, kind, r) {
        if (kind === 'bomb') {
            g.fillStyle = '#26262e';
            g.beginPath();
            g.arc(0, 0, r, 0, 7);
            g.fill();
            g.fillStyle = 'rgba(255,60,60,' + (0.25 + 0.25 * Math.sin(A.time * 14)) + ')';
            g.beginPath();
            g.arc(0, 0, r, 0, 7);
            g.fill();
            g.fillStyle = 'rgba(255,255,255,.35)';
            g.beginPath();
            g.ellipse(-r * 0.35, -r * 0.4, r * 0.25, r * 0.15, -0.6, 0, 7);
            g.fill();
            g.fillStyle = '#4a4a55';
            g.save();
            g.rotate(-0.8);
            g.fillRect(r * 0.82, -5, 8, 10);
            g.strokeStyle = '#c9a26b';
            g.lineWidth = 2.5;
            g.beginPath();
            g.moveTo(r * 0.98, 0);
            g.quadraticCurveTo(r * 1.15, -6, r * 1.25, 0);
            g.stroke();
            g.restore();
            g.fillStyle = '#ffffff';
            g.font = `900 ${r * 0.8}px ${FONT}`;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText('✕', 0, 1);
            g.textBaseline = 'alphabetic';
            return;
        }
        const f = FRUITS[kind];
        if (kind === 'star') {
            g.fillStyle = f.skin;
            g.beginPath();
            for (let i = 0; i < 10; i++) {
                const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.55 : r * 1.1;
                g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            g.closePath();
            g.fill();
            g.strokeStyle = f.dark;
            g.lineWidth = 2;
            g.stroke();
            g.fillStyle = 'rgba(255,255,255,.5)';
            g.beginPath();
            g.arc(-r * 0.2, -r * 0.3, r * 0.18, 0, 7);
            g.fill();
            return;
        }
        if (kind === 'lemon') {
            g.fillStyle = f.skin;
            g.beginPath();
            g.ellipse(0, 0, r * 1.15, r * 0.85, 0, 0, 7);
            g.fill();
            g.beginPath();
            g.ellipse(r * 1.12, 0, 5, 4, 0, 0, 7);
            g.ellipse(-r * 1.12, 0, 5, 4, 0, 0, 7);
            g.fill();
        }
        else {
            g.fillStyle = f.skin;
            g.beginPath();
            g.arc(0, 0, r, 0, 7);
            g.fill();
        }
        if (kind === 'watermelon') {
            g.strokeStyle = f.dark;
            g.lineWidth = 5;
            for (let k = -2; k <= 2; k++) {
                g.beginPath();
                g.ellipse(0, 0, Math.abs(k) * r * 0.32 + 2, r, 0, k < 0 ? Math.PI / 2 : -Math.PI / 2, k < 0 ? Math.PI * 1.5 : Math.PI / 2);
                g.stroke();
            }
        }
        if (kind === 'peach') {
            g.fillStyle = f.dark;
            g.globalAlpha = 0.6;
            g.beginPath();
            g.arc(r * 0.25, r * 0.15, r * 0.65, 0, 7);
            g.fill();
            g.globalAlpha = 1;
            g.strokeStyle = 'rgba(160,60,40,.5)';
            g.lineWidth = 2;
            g.beginPath();
            g.arc(-r * 0.9, 0, r, -0.6, 0.6);
            g.stroke();
        }
        if (kind === 'coconut') {
            g.strokeStyle = f.dark;
            g.lineWidth = 1.5;
            for (let k = 0; k < 14; k++) {
                const a = k * 0.45;
                g.beginPath();
                g.moveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.5);
                g.lineTo(Math.cos(a + 0.2) * r * 0.95, Math.sin(a + 0.2) * r * 0.95);
                g.stroke();
            }
            g.fillStyle = '#3a2412';
            for (const [dx, dy] of [[-6, -8], [6, -8], [0, 2]]) {
                g.beginPath();
                g.arc(dx, dy, 3, 0, 7);
                g.fill();
            }
        }
        if (kind === 'kiwi') {
            g.fillStyle = 'rgba(60,40,20,.35)';
            for (let k = 0; k < 18; k++) g.fillRect(Math.cos(k * 2.4) * r * 0.75, Math.sin(k * 1.7) * r * 0.75, 1.5, 1.5);
        }
        if (kind === 'orange') {
            g.fillStyle = 'rgba(200,90,0,.35)';
            for (let k = 0; k < 14; k++) g.fillRect(Math.cos(k * 2.4) * r * 0.7, Math.sin(k * 1.9) * r * 0.7, 1.6, 1.6);
            g.fillStyle = '#3e8e2e';
            g.beginPath();
            g.ellipse(0, -r + 2, 5, 3, 0, 0, 7);
            g.fill();
        }
        if (kind === 'apple' || kind === 'plum') {
            g.strokeStyle = '#5b3a1e';
            g.lineWidth = 3;
            g.beginPath();
            g.moveTo(0, -r * 0.75);
            g.quadraticCurveTo(2, -r * 1.1, 5, -r * 1.25);
            g.stroke();
            if (kind === 'apple') {
                g.fillStyle = '#4caf50';
                g.beginPath();
                g.ellipse(9, -r * 1.05, 8, 4, -0.5, 0, 7);
                g.fill();
            }
        }
        if (kind === 'strawberry') {
            g.fillStyle = '#ffe9a0';
            for (let k = 0; k < 14; k++) g.beginPath(), g.ellipse(Math.cos(k * 2.4) * r * 0.62, Math.sin(k * 1.7) * r * 0.62 + 2, 1.4, 2.2, k, 0, 7), g.fill();
            g.fillStyle = '#3e9e3a';
            for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(Math.cos(-Math.PI / 2 + (k - 2) * 0.5) * 8, -r + 4, 9, 3.5, (k - 2) * 0.5, 0, 7); g.fill(); }
        }
        if (kind === 'pear') {
            g.fillStyle = f.skin;
            g.beginPath(); g.arc(0, -r * 0.55, r * 0.68, 0, 7); g.fill();
            g.fillStyle = 'rgba(120,150,20,.35)';
            for (let k = 0; k < 10; k++) g.fillRect(Math.cos(k * 2.1) * r * 0.6, Math.sin(k * 1.3) * r * 0.6, 1.5, 1.5);
            g.strokeStyle = '#5b3a1e'; g.lineWidth = 3;
            g.beginPath(); g.moveTo(0, -r * 1.15); g.lineTo(3, -r * 1.45); g.stroke();
        }
        if (kind === 'pineapple') {
            g.strokeStyle = f.dark; g.lineWidth = 1.6;
            g.save(); g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip();
            for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(k * 10 - r, -r); g.lineTo(k * 10 + r, r); g.stroke(); g.beginPath(); g.moveTo(k * 10 + r, -r); g.lineTo(k * 10 - r, r); g.stroke(); }
            g.restore();
            g.fillStyle = '#3f9a45';
            for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo((k - 2) * 6, -r + 4); g.lineTo((k - 2) * 9, -r - 22 + Math.abs(k - 2) * 5); g.lineTo((k - 2) * 6 + 5, -r + 4); g.fill(); }
        }
        if (kind === 'dragonfruit') {
            g.fillStyle = f.dark;
            for (let k = 0; k < 7; k++) { const a = k * 0.9; g.beginPath(); g.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); g.lineTo(Math.cos(a + 0.25) * r * 1.25, Math.sin(a + 0.25) * r * 1.25); g.lineTo(Math.cos(a + 0.4) * r * 0.75, Math.sin(a + 0.4) * r * 0.75); g.fill(); }
        }
        if (kind === 'frost' || kind === 'frenzy' || kind === 'double') {
            g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3;
            g.beginPath(); g.arc(0, 0, r + 5 + Math.sin(A.time * 8) * 2, 0, 7); g.stroke();
            g.fillStyle = '#ffffff';
            g.font = `900 ${r * 0.9}px ${FONT}`;
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(kind === 'frost' ? '❄' : kind === 'frenzy' ? '⚡' : '×2', 0, 1);
            g.textBaseline = 'alphabetic';
        }
        g.fillStyle = 'rgba(255,255,255,.35)';
        g.beginPath();
        g.ellipse(-r * 0.38, -r * 0.42, r * 0.28, r * 0.16, -0.7, 0, 7);
        g.fill();
    }
    function drawFace(g, kind, r) {
        const f = FRUITS[kind];
        const rx = kind === 'lemon' ? r * 1.15 : r, ry = kind === 'lemon' ? r * 0.85 : r;
        g.fillStyle = f.skin;
        g.beginPath();
        g.ellipse(0, 0, rx, ry, 0, 0, 7);
        g.fill();
        g.fillStyle = f.rim;
        g.beginPath();
        g.ellipse(0, 0, rx * 0.88, ry * 0.88, 0, 0, 7);
        g.fill();
        g.fillStyle = f.flesh;
        g.beginPath();
        g.ellipse(0, 0, rx * (kind === 'watermelon' ? 0.76 : 0.82), ry * (kind === 'watermelon' ? 0.76 : 0.82), 0, 0, 7);
        g.fill();
        if (kind === 'watermelon') {
            g.fillStyle = '#2b1a1a';
            for (let k = 0; k < 9; k++) {
                const a = k * 0.7, d = r * (0.3 + (k % 3) * 0.13);
                g.beginPath();
                g.ellipse(Math.cos(a) * d, Math.sin(a) * d, 2.2, 3.4, a, 0, 7);
                g.fill();
            }
        }
        if (kind === 'orange' || kind === 'lemon') {
            g.strokeStyle = f.rim;
            g.lineWidth = 1.5;
            for (let k = 0; k < 10; k++) {
                const a = k * Math.PI / 5;
                g.beginPath();
                g.moveTo(0, 0);
                g.lineTo(Math.cos(a) * rx * 0.8, Math.sin(a) * ry * 0.8);
                g.stroke();
            }
        }
        if (kind === 'kiwi') {
            g.fillStyle = '#eaf7c9';
            g.beginPath();
            g.arc(0, 0, r * 0.28, 0, 7);
            g.fill();
            g.fillStyle = '#1d1d10';
            for (let k = 0; k < 14; k++) {
                const a = k * Math.PI / 7;
                g.beginPath();
                g.ellipse(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, 1.2, 2.2, a, 0, 7);
                g.fill();
            }
        }
        if (kind === 'apple') {
            g.fillStyle = '#6b3d1d';
            for (const a of [0.6, 2.2, 3.8, 5.3]) {
                g.beginPath();
                g.ellipse(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22, 1.8, 3, a, 0, 7);
                g.fill();
            }
        }
        if (kind === 'peach' || kind === 'plum') {
            g.fillStyle = kind === 'peach' ? '#a0522d' : '#b5651d';
            g.beginPath();
            g.ellipse(0, 0, r * 0.3, r * 0.4, 0.3, 0, 7);
            g.fill();
        }
        if (kind === 'dragonfruit') {
            g.fillStyle = '#1d1d10';
            for (let k = 0; k < 30; k++) g.fillRect(Math.cos(k * 2.4) * r * 0.65 * ((k % 5) / 5 + 0.2), Math.sin(k * 2.4) * r * 0.65 * ((k % 5) / 5 + 0.2), 1.6, 1.6);
        }
        if (kind === 'strawberry') {
            g.fillStyle = '#fff1f2';
            g.beginPath(); g.ellipse(0, 0, r * 0.25, r * 0.5, 0, 0, 7); g.fill();
        }
        if (kind === 'pineapple') {
            g.fillStyle = '#f5c842';
            g.beginPath(); g.arc(0, 0, r * 0.25, 0, 7); g.fill();
        }
        if (kind === 'star') {
            g.fillStyle = f.dark;
            g.beginPath();
            for (let i = 0; i < 10; i++) {
                const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.15 : r * 0.5;
                g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            g.closePath();
            g.fill();
        }
    }
    function drawHalf(g, h) {
        g.save();
        g.translate(h.x, h.y);
        g.rotate(h.ang + h.rot);
        g.beginPath();
        g.rect(-h.r * 1.4, h.side < 0 ? -h.r * 1.4 : 0, h.r * 2.8, h.r * 1.4);
        g.clip();
        drawFace(g, h.kind, h.r);
        g.restore();
    }
    function draw(g) {
        const W = A.W;
        g.save();
        if (shake > 0) g.translate((Math.random() - 0.5) * shake * 18, (Math.random() - 0.5) * shake * 18);
        wood(g);
        const vg = g.createRadialGradient(W / 2, H * 0.45, H * 0.3, W / 2, H * 0.5, H * 0.9);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,.35)');
        g.fillStyle = vg;
        g.fillRect(0, 0, W, H);
        if (slowT > 0) { g.fillStyle = `rgba(150,220,255,${Math.min(0.25, slowT * 0.1)})`; g.fillRect(0, 0, W, H); }
        if (doubleT > 0) { g.strokeStyle = `rgba(177,140,255,${0.4 + 0.2 * Math.sin(A.time * 6)})`; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10); }
        if (frenzyT > 0) { g.fillStyle = `rgba(255,140,60,${0.08 + 0.05 * Math.sin(A.time * 12)})`; g.fillRect(0, 0, W, H); }
        for (const s of splats) drawSplat(g, s);
        for (const h of halves) drawHalf(g, h);
        for (const it of items) {
            g.save();
            g.translate(it.x, it.y);
            g.rotate(it.rot);
            drawWhole(g, it.kind, it.r);
            g.restore();
        }
        A.fx.draw(g);
        if (blade.length > 1) {
            const n = blade.length;
            g.lineCap = 'round';
            g.lineJoin = 'round';
            const bs = bladeSkin();
            for (let pass = 0; pass < 2; pass++) {
                for (let i = 1; i < n; i++) {
                    const k = i / (n - 1);
                    g.strokeStyle = pass ? bs.core : bs.glow || `hsla(${(A.time * 300 + i * 25) % 360},90%,60%,.6)`;
                    g.lineWidth = (pass ? 5 : 12) * k + 0.5;
                    g.beginPath();
                    g.moveTo(blade[i - 1].x, blade[i - 1].y);
                    g.lineTo(blade[i].x, blade[i].y);
                    g.stroke();
                }
            }
        }
        g.textAlign = 'center';
        for (const t of texts) {
            g.globalAlpha = Math.min(1, t.t * 2);
            g.font = `900 ${t.big ? 26 : 18}px ${FONT}`;
            g.lineWidth = 5;
            g.strokeStyle = 'rgba(60,30,10,.6)';
            g.strokeText(t.s, t.x, t.y);
            g.fillStyle = t.c;
            g.fillText(t.s, t.x, t.y);
        }
        g.globalAlpha = 1;
        if (A.state === 'play' && S.hover && !blade.length && sliced === 0) {
            g.font = `700 15px ${FONT}`;
            g.fillStyle = 'rgba(255,255,255,.85)';
            g.fillText('Blade follows the pointer: just move to slice', W / 2, H - 20);
        }
        g.restore();
        if (flash > 0) {
            g.fillStyle = `rgba(255,255,255,${Math.min(1, flash)})`;
            g.fillRect(0, 0, W, H);
        }
    }
    A.debug = () => ({
        items: items.length, misses, sliced, halves: halves.length,
        spawn(kind) { items.push({ kind, x: A.W / 2, y: H / 2, vx: 0, vy: -10, r: kind === 'bomb' ? 24 : FRUITS[kind].r, rot: 0, vr: 0, t: 0 }); },
        hold() { volleyT = 999; items.length = 0; timers.length = 0; }
    });
    function paintMenu() {
        document.querySelectorAll('[data-seg="mode"] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S.mode)));
        const w = document.querySelector('[data-wide]'); if (w) w.checked = !!S.wide;
        const hv = document.querySelector('[data-hover]'); if (hv) hv.checked = !!S.hover;
        const bl = document.querySelector('[data-blades]');
        if (bl) bl.innerHTML = BLADES.map((b) => { const ok = (S.stats.best.classic || 0) >= b.need; const bg = b.glow ? `linear-gradient(90deg, ${b.glow}, ${b.core}, ${b.glow})` : 'linear-gradient(90deg,#ff5a36,#ffd23f,#4cd964,#3a7bd5,#b18cff)'; return `<button type="button" class="fs-blade" data-blade="${b.id}" aria-pressed="${bladeSkin().id === b.id}" ${ok ? '' : 'disabled'} title="${ok ? b.name : `Score ${b.need} in Classic to unlock`}" aria-label="${b.name} blade${ok ? '' : ', locked'}"><i style="background:${bg}"></i>${ok ? b.name : '🔒'}</button>`; }).join('');
        A.bestKey = S.mode === 'classic' ? 'score' : S.mode === 'daily' ? 'daily-' + today() : S.mode;
        A.showBest();
        const st = document.querySelector('[data-stats]');
        if (st) st.innerHTML = `<div class="c-stat"><b>${S.stats.games}</b><span>Games</span></div><div class="c-stat"><b>${S.stats.fruit}</b><span>Fruit</span></div><div class="c-stat"><b>${S.stats.bestCombo}</b><span>Best combo</span></div>`;
        const bd = document.querySelector('[data-badges]');
        if (bd) bd.innerHTML = ACH.map((a) => `<span class="fs-badge${S.ach[a.id] ? ' on' : ''}" title="${a.d}">${S.ach[a.id] ? '★' : '☆'} ${a.name}</span>`).join('');
        const bc = document.querySelector('[data-badge-count]');
        if (bc) bc.textContent = `(${ACH.filter((a) => S.ach[a.id]).length}/${ACH.length})`;
    }
    document.querySelector('[data-seg="mode"]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.mode = b.dataset.v; save(); paintMenu(); Curio.beep(520, 0.04, 'triangle', 0.05); });
    document.querySelector('[data-wide]').addEventListener('change', (e) => { S.wide = e.target.checked; save(); });
    document.querySelector('[data-hover]').addEventListener('change', (e) => { S.hover = e.target.checked; save(); });
    document.querySelector('[data-blades]').addEventListener('click', (e) => { const b = e.target.closest('[data-blade]'); if (!b || b.disabled) return; S.blade = b.dataset.blade; save(); paintMenu(); A.sweep(900, 1800, 0.08, 'sine', 0.04); });
    document.querySelector('[data-share]').addEventListener('click', () => {
        const r = lastRes || { sliced: 0, bestCombo: 0 };
        const name = { classic: 'Classic', arcade: 'Arcade 60s', zen: 'Zen', daily: `Daily ${today()}` }[S.mode];
        const txt = `Curio Fruit Slicer · ${name}\n🍉 ${A.score} points, ${r.sliced} fruit sliced, best combo ${r.bestCombo}`;
        (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
    });
    const baseMenu = A.menu;
    A.menu = () => { baseMenu(); paintMenu(); };
    if (!Curio.touchpad && matchMedia('(pointer: fine)').matches && !Curio.store.get('tpTip', false)) { Curio.store.set('tpTip', true); setTimeout(() => Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar (click, swipe, click), or tick "Blade follows pointer"'), 1800); }
    reset();
    paintMenu();
    A.boot();
})();
