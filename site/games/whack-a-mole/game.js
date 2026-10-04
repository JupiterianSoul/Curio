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
    const W = 600;
    let ROUND = 60;
    const SKEY = 'wam2';
    const loadS = () => { const base = { v: 1, mode: 'classic', big: false, skin: 'classic', ach: {}, stats: { games: 0, bonks: 0, golds: 0, best: {} }, daily: {} }; const d = Curio.store.get(SKEY, null); return d && d.v === 1 ? { ...base, ...d, stats: { ...base.stats, ...(d.stats || {}) } } : base; };
    const S = loadS();
    const save = () => Curio.store.set(SKEY, S);
    const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
    const SKINS = [
        { id: 'classic', name: 'Mallet', need: 0, head: '#e8483f', hi: '#ff7a6b', band: '#9e2a24' },
        { id: 'squeaky', name: 'Squeaky', need: 400, head: '#ff7fc4', hi: '#ffc2e3', band: '#c2408a' },
        { id: 'frost', name: 'Frost', need: 800, head: '#58c8ff', hi: '#b8ecff', band: '#1f7fb8' },
        { id: 'gold', name: 'Golden', need: 1200, head: '#f2b705', hi: '#ffe680', band: '#b07d00' }
    ];
    const ACH = [
        { id: 'first', name: 'First Bonk', d: 'Bonk a mole' },
        { id: 'combo15', name: 'On a Roll', d: 'Reach a 15 bonk combo' },
        { id: 'score500', name: 'Mole Menace', d: 'Score 500 in one game' },
        { id: 'score1000', name: 'Mole Legend', d: 'Score 1000 in one game' },
        { id: 'king', name: 'Regicide', d: 'Bonk the king mole' },
        { id: 'gold10', name: 'Gold Rush', d: 'Bonk 10 golden moles in total' },
        { id: 'nobomb', name: 'Bomb Squad', d: 'Finish a classic game without bonking a bomb' },
        { id: 'survive60', name: 'Survivor', d: 'Last 60 seconds in Survival' },
        { id: 'frenzy300', name: 'Frenzied', d: 'Score 300 in Frenzy' },
        { id: 'daily', name: 'Daily Digger', d: 'Finish a daily game' },
        { id: 'acc90', name: 'Sharpshooter', d: 'Finish with 90% accuracy and 30+ bonks' }
    ];
    let rnd = Math.random, lives = 3, bombHits = 0, fresh = [], lastRes = null, kingBonks = 0;
    const pickR = (a) => a[Math.floor(rnd() * a.length)];
    const randR = (a, b) => a + rnd() * (b - a);
    function seeded(seed) { return () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
    function award(id) { if (S.ach[id]) return; S.ach[id] = Date.now(); fresh.push(id); const a = ACH.find((x) => x.id === id); if (a && A.state === 'play') Curio.toast(`🏅 ${a.name}`); }
    const skin = () => SKINS.find((k) => k.id === S.skin && (S.stats.best.classic || 0) >= k.need) || SKINS[0];
    const HX = [110, 300, 490];
    let H = 640, HY = [250, 410, 570];
    const KEYMAP = { 7: 0, 8: 1, 9: 2, 4: 3, 5: 4, 6: 5, 1: 6, 2: 7, 3: 8, q: 0, w: 1, e: 2, a: 3, s: 4, d: 5, z: 6, x: 7, c: 8 };
    let holes, timeLeft, elapsed, spawnT, combo, mult, bestCombo, hits, swings, texts, hammer, shake, ready, flash, clouds;
    const A = Arcade({
        width: W, height: H, reset, update, draw, key, pointer, idle, resized: layout, capture: Object.keys(KEYMAP),
        size: (w, h) => ({ w: W, h: Math.round(Math.max(640, Math.min(1100, W * h / w))) })
    });
    function layout() {
        H = A.H;
        const top = 150, span = H - top;
        HY = [top + span * 0.22, top + span * 0.53, top + span * 0.84].map(Math.round);
        if (holes) holes.forEach((h, i) => { h.y = HY[Math.floor(i / 3)]; });
    }
    function makeHoles() {
        holes = [];
        for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) holes.push({ x: HX[c], y: HY[r], m: null });
    }
    function reset() {
        makeHoles();
        ROUND = S.mode === 'frenzy' ? 30 : 60;
        A.bestKey = S.mode === 'classic' ? 'score' : S.mode === 'daily' ? 'daily-' + today() : S.mode;
        rnd = S.mode === 'daily' ? seeded([...today()].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261)) : Math.random;
        lives = 3; bombHits = 0; fresh = []; kingBonks = 0;
        timeLeft = S.mode === 'survival' ? 0 : ROUND;
        elapsed = 0;
        spawnT = 0.3;
        combo = 0;
        mult = 1;
        bestCombo = 0;
        hits = 0;
        swings = 0;
        texts = [];
        shake = 0;
        flash = 0;
        ready = 1.3;
        A.fx.clear();
        hud();
    }
    function hud() {
        if (S.mode === 'survival') { A.hud('timeLbl', 'Lives'); A.hud('time', lives > 0 ? '♥'.repeat(lives) : '0'); }
        else { A.hud('timeLbl', 'Time'); A.hud('time', Math.ceil(Math.max(0, timeLeft))); }
        A.hud('combo', '×' + mult);
    }
    function pickType() {
        const r = rnd();
        if (elapsed > 4 && r < 0.12) return 'bomb';
        if (elapsed > 8 && r < 0.18) return 'bunny';
        if (r < 0.24) return 'gold';
        if (elapsed > 15 && r < 0.27 && !holes.some((h) => h.m && h.m.type === 'king')) return 'king';
        if (S.mode !== 'survival' && elapsed > 6 && r < 0.31) return 'clock';
        if (elapsed > 10 && r < 0.43) return 'helmet';
        return 'mole';
    }
    function spawn(demo) {
        const free = holes.filter((h) => !h.m);
        if (!free.length) return;
        const h = demo ? Curio.pick(free) : pickR(free);
        const prog = Math.min(1, elapsed / (S.mode === 'survival' ? 90 : ROUND));
        const type = demo ? (Math.random() < 0.15 ? 'gold' : 'mole') : pickType();
        let stay = (1.15 - prog * 0.6) * (demo ? Curio.rand(0.8, 1.25) : randR(0.8, 1.25)) * (S.big ? 1.25 : 1) * (S.mode === 'frenzy' ? 0.85 : 1);
        if (type === 'gold') stay *= 0.6;
        if (type === 'bomb' || type === 'bunny') stay *= 1.3;
        if (type === 'king') stay *= 1.8;
        h.m = { type, t: 0, rise: type === 'gold' ? 0.09 : 0.14, stay, state: 'up', hp: type === 'helmet' ? 2 : type === 'king' ? 3 : 1, bonk: 0, hat: type === 'helmet', look: Math.random() < 0.5 ? -1 : 1 };
        if (!demo) A.fx.burst(h.x, h.y, 6, ['#7a5230', '#9b6b3f'], { speed: 100, life: 0.35, size: 3, gravity: 500, spread: 2, angle: -Math.PI / 2 });
        if (!demo) A.beep(type === 'gold' ? 1320 : type === 'bomb' ? 180 : 520 + Math.random() * 120, 0.05, type === 'bomb' ? 'sawtooth' : 'sine', 0.035);
    }
    function upAmount(m) {
        if (m.state === 'up') {
            if (m.t < m.rise) return easeOut(m.t / m.rise);
            if (m.t < m.rise + m.stay) return 1;
            const k = (m.t - m.rise - m.stay) / 0.16;
            return Math.max(0, 1 - k);
        }
        if (m.state === 'bonked') return m.t < 0.35 ? 1 : Math.max(0, 1 - (m.t - 0.35) / 0.14);
        return 0;
    }
    const easeOut = (x) => 1 - (1 - x) * (1 - x) * (1 - x) * (1 - x) + Math.sin(x * Math.PI) * 0.08;
    function float(x, y, s, c, big) { texts.push({ x, y, s, c, t: 1, big }); }
    function resetCombo() {
        if (combo >= 5) float(W / 2, 120, 'Combo lost', '#ffffff', false);
        combo = 0;
        mult = 1;
        hud();
    }
    function whack(i, demo) {
        const h = holes[i];
        hammer.hole = i;
        hammer.x = h.x + 8;
        hammer.y = h.y - 50;
        hammer.swing = 0.0001;
        if (!demo) swings++;
        const m = h.m;
        const up = m ? upAmount(m) : 0;
        if (!m || m.state !== 'up' || up < 0.3) {
            if (!demo) {
                A.beep(120, 0.08, 'triangle', 0.08);
                A.fx.burst(h.x, h.y + 4, 8, ['#7a5230', '#9b6b3f'], { speed: 120, life: 0.4, size: 3, gravity: 500, spread: 2, angle: -Math.PI / 2 });
                resetCombo();
            }
            return;
        }
        if (m.type === 'bunny') {
            if (demo) return;
            m.state = 'bonked';
            m.t = 0;
            A.addScore(-Math.min(A.score, 20));
            float(h.x, h.y - 120, 'Not the bunny! -20', '#ffb3c7', true);
            A.sweep(900, 300, 0.3, 'triangle', 0.07);
            navigator.vibrate?.(40);
            if (S.mode === 'survival') { lives--; hud(); }
            resetCombo();
            return;
        }
        if (m.type === 'king' && m.hp > 1) {
            m.hp--;
            m.t = Math.min(m.t, m.rise + m.stay * 0.5);
            A.beep(700 - m.hp * 120, 0.08, 'square', 0.06);
            A.fx.burst(h.x, h.y - 80, 12, ['#ffe14d', '#b18cff', '#ffffff'], { speed: 200, life: 0.4, size: 3, gravity: 300 });
            float(h.x, h.y - 120, m.hp === 2 ? 'Your majesty!' : 'One more!', '#e0c3ff', false);
            shake = 0.15;
            return;
        }
        if (m.type === 'bomb') {
            if (demo) return;
            m.state = 'bonked';
            m.t = 0.35;
            m.boom = true;
            bombHits++;
            navigator.vibrate?.([60, 40, 60]);
            if (S.mode === 'survival') { lives--; hud(); } else timeLeft = Math.max(0, timeLeft - 5);
            shake = 0.6;
            flash = 0.6;
            A.fx.burst(h.x, h.y - 40, 50, ['#ffffff', '#ffd166', '#ff6b3d', '#444'], { speed: 360, life: 0.9, size: 4, gravity: 250 });
            A.noise(0.9, 0.3, 1400);
            float(h.x, h.y - 120, S.mode === 'survival' ? 'Ouch! -1 life' : '-5 seconds', '#ff5a5a', true);
            resetCombo();
            return;
        }
        if (m.type === 'helmet' && m.hp > 1) {
            m.hp--;
            m.hat = false;
            m.hatFly = { x: 0, y: -60, vx: Curio.rand(-160, 160), vy: -260, r: 0 };
            m.t = Math.min(m.t, m.rise + m.stay * 0.4);
            A.beep(1400, 0.06, 'square', 0.06);
            A.beep(900, 0.1, 'triangle', 0.05);
            A.fx.burst(h.x, h.y - 70, 10, ['#ffe14d', '#ffffff'], { speed: 200, life: 0.4, size: 3, gravity: 300 });
            if (!demo) float(h.x, h.y - 120, 'Clank! Again!', '#ffe14d', false);
            return;
        }
        m.state = 'bonked';
        m.t = 0;
        A.fx.burst(h.x, h.y - 60, 12, m.type === 'gold' ? ['#ffe14d', '#fff6b0', '#ffffff'] : ['#ffffff', '#ffe9a8'], { speed: 220, life: 0.5, size: 3, gravity: 250 });
        if (demo) return;
        hits++;
        combo++;
        S.stats.bonks++;
        award('first');
        navigator.vibrate?.(10);
        if (combo >= 15) award('combo15');
        bestCombo = Math.max(bestCombo, combo);
        mult = Math.min(5, 1 + Math.floor(combo / 5));
        const base = m.type === 'gold' ? 50 : m.type === 'king' ? 100 : m.type === 'helmet' ? 25 : m.type === 'clock' ? 15 : 10;
        if (m.type === 'king') { award('king'); kingBonks++; shake = 0.3; Curio.confetti(); }
        if (m.type === 'clock') { timeLeft = Math.min(99, timeLeft + 3); float(h.x, h.y - 145, '+3s', '#9cf0ff', true); A.sweep(600, 1500, 0.2, 'sine', 0.06); }
        if (m.type === 'gold') { S.stats.golds++; if (S.stats.golds >= 10) award('gold10'); }
        const pts = base * mult;
        A.addScore(pts);
        float(h.x, h.y - 115, '+' + pts, m.type === 'gold' ? '#ffe14d' : '#ffffff', m.type === 'gold');
        if (m.type === 'gold') {
            if (S.mode !== 'survival') { timeLeft = Math.min(99, timeLeft + 2); float(h.x, h.y - 145, '+2s', '#9cf0ff', false); }
            [1047, 1319, 1568].forEach((f, k) => setTimeout(() => A.beep(f, 0.08, 'triangle', 0.07), k * 55));
        }
        else if (skin().id === 'squeaky') A.sweep(900, 1700, 0.12, 'sine', 0.08);
        else {
            A.noise(0.1, 0.2, 900);
            A.beep(260 + combo * 12, 0.09, 'square', 0.06);
        }
        A.fx.burst(h.x, h.y - 60, 6, ['#ffffff'], { speed: 260, life: 0.25, size: 2, gravity: 0, drag: 6 });
        if (combo > 0 && combo % 5 === 0 && mult <= 5) {
            float(W / 2, 120, `Combo ×${mult}!`, '#ffe14d', true);
            A.beep(1568, 0.12, 'triangle', 0.06);
        }
        hud();
    }
    function simMoles(dt, demo) {
        for (const h of holes) {
            const m = h.m;
            if (!m) continue;
            m.t += dt;
            if (m.hatFly) {
                const f = m.hatFly;
                f.vy += 900 * dt;
                f.x += f.vx * dt;
                f.y += f.vy * dt;
                f.r += dt * 9;
            }
            if (m.state === 'up' && m.t > m.rise + m.stay + 0.16) {
                if (!demo && m.type !== 'bomb' && m.type !== 'bunny') {
                    resetCombo();
                    float(h.x, h.y - 30, 'Missed!', 'rgba(255,255,255,.85)', false);
                    if (S.mode === 'survival') { lives--; hud(); A.beep(200, 0.15, 'sawtooth', 0.05); }
                }
                h.m = null;
            }
            else if (m.state === 'bonked' && m.t > 0.5) h.m = null;
        }
        if (hammer.touchT > 0) hammer.touchT -= dt;
        if (hammer.swing > 0) {
            hammer.swing += dt;
            if (hammer.swing > 0.24) hammer.swing = 0;
        }
        for (let i = texts.length - 1; i >= 0; i--) {
            texts[i].t -= dt;
            texts[i].y -= 40 * dt;
            if (texts[i].t <= 0) texts.splice(i, 1);
        }
        for (const c of clouds) {
            c.x += c.v * dt;
            if (c.x > W + 80) c.x = -80;
        }
        A.fx.update(dt);
        shake = Math.max(0, shake - dt);
        flash = Math.max(0, flash - dt * 2);
    }
    function update(dt) {
        if (ready > 0) {
            ready -= dt;
            simMoles(dt, false);
            if (ready <= 0) A.beep(880, 0.15, 'square', 0.06);
            return;
        }
        elapsed += dt;
        if (S.mode !== 'survival') {
            const before = Math.ceil(timeLeft);
            timeLeft -= dt;
            const now = Math.ceil(timeLeft);
            if (now !== before) {
                hud();
                if (now <= 5 && now > 0) A.beep(1000, 0.05, 'square', 0.05);
            }
        }
        if ((S.mode !== 'survival' && timeLeft <= 0) || (S.mode === 'survival' && lives <= 0)) {
            timeLeft = Math.max(0, timeLeft);
            hud();
            endGame();
            return;
        }
        spawnT -= dt;
        const prog = Math.min(1, elapsed / (S.mode === 'survival' ? 90 : ROUND));
        const maxUp = 1 + Math.floor(prog * 3.5) + (S.mode === 'frenzy' ? 1 : 0);
        if (spawnT <= 0) {
            if (holes.filter((h) => h.m && h.m.state === 'up').length < maxUp) spawn(false);
            spawnT = (0.85 - prog * 0.45) * randR(0.6, 1.3) * (S.mode === 'frenzy' ? 0.6 : 1);
        }
        simMoles(dt, false);
    }
    function endGame() {
        const acc = swings ? Math.round(hits / swings * 100) : 0;
        S.stats.games++;
        S.stats.best[S.mode] = Math.max(S.stats.best[S.mode] || 0, A.score);
        if (A.score >= 500) award('score500');
        if (A.score >= 1000) award('score1000');
        if (S.mode === 'classic' && !bombHits) award('nobomb');
        if (S.mode === 'survival' && elapsed >= 60) award('survive60');
        if (S.mode === 'frenzy' && A.score >= 300) award('frenzy300');
        if (S.mode === 'daily') { award('daily'); S.daily[today()] = Math.max(S.daily[today()] || 0, A.score); }
        if (acc >= 90 && hits >= 30) award('acc90');
        const newSkin = SKINS.find((k) => k.need > 0 && S.stats.best.classic >= k.need && !S.ach['skin-' + k.id]);
        if (newSkin) { S.ach['skin-' + newSkin.id] = Date.now(); setTimeout(() => Curio.toast(`New hammer unlocked: ${newSkin.name}`), 900); }
        save();
        lastRes = { hits, acc, bestCombo, time: Math.round(elapsed) };
        A.over({
            title: S.mode === 'survival' ? 'Overrun!' : "Time's up!",
            emoji: '🔨',
            msg: `${hits} bonks, ${acc}% accuracy, best combo ${bestCombo}${S.mode === 'survival' ? `, survived ${Math.round(elapsed)}s` : ''}. ${A.score >= 900 ? 'The moles have filed a complaint.' : A.score >= 450 ? 'Solid hammer work.' : 'The moles are laughing underground.'}`
        });
        const el = document.querySelector('[data-o="badges"]');
        if (el) el.innerHTML = fresh.filter((id) => ACH.some((a) => a.id === id)).map((id) => { const a = ACH.find((x) => x.id === id); return `<span class="wm-badge on new" title="${a.d}">★ ${a.name}</span>`; }).join('');
        paintMenu();
    }
    let demoT = 0;
    function idle(dt) {
        if (A.state !== 'menu') return;
        elapsed = 20;
        demoT -= dt;
        if (demoT <= 0) {
            demoT = Curio.rand(0.5, 1.1);
            spawn(true);
        }
        for (let i = 0; i < 9; i++) {
            const m = holes[i].m;
            if (m && m.state === 'up' && m.t > m.rise + 0.25 && !m.planned) {
                m.planned = true;
                if (Math.random() < 0.6) setTimeout(() => { if (A.state === 'menu' && holes[i].m === m) whack(i, true); }, 120);
            }
        }
        simMoles(dt, true);
    }
    function key(k, down) {
        if (!down || ready > 0) return;
        if (k in KEYMAP) {
            hammer.mouse = false;
            whack(KEYMAP[k], false);
        }
    }
    function pointer(type, p, e) {
        if (type === 'move' || type === 'down') {
            hammer.x = p.x;
            hammer.y = p.y;
            hammer.mouse = e.pointerType === 'mouse';
        }
        if (type === 'down') {
            hammer.touchT = 0.5;
            if (ready > 0) return;
            let best = -1, bd = Infinity;
            holes.forEach((h, i) => {
                const dx = Math.abs(p.x - h.x), dy = p.y - h.y;
                if (S.big ? (dx < 98 && dy > -155 && dy < 60) : (dx < 85 && dy > -130 && dy < 45)) {
                    const d = dx + Math.abs(dy + 40);
                    if (d < bd) { bd = d; best = i; }
                }
            });
            if (best >= 0) {
                const sx = p.x, sy = p.y;
                whack(best, false);
                hammer.x = sx;
                hammer.y = sy;
            }
            else {
                swings++;
                hammer.swing = 0.0001;
                A.beep(150, 0.05, 'triangle', 0.05);
                resetCombo();
            }
        }
    }
    function drawMole(g, h) {
        const m = h.m;
        const up = upAmount(m);
        if (up <= 0.001) return;
        const x = h.x, y = h.y;
        g.save();
        g.beginPath();
        g.rect(x - 90, y - 200, 180, 200);
        g.ellipse(x, y, 62, 20, 0, 0, Math.PI);
        g.clip();
        g.translate(x, y + 8 + (1 - up) * 112);
        const bonked = m.state === 'bonked';
        const sq = bonked ? Math.max(0.72, 1 - Math.sin(Math.min(1, m.t / 0.12) * Math.PI) * 0.3) : 1;
        g.scale(bonked ? 2 - sq : 1, sq);
        if (m.type === 'bomb') {
            if (m.boom) { g.restore(); return; }
            g.fillStyle = '#2a2a33';
            g.beginPath();
            g.arc(0, -52, 40, 0, 7);
            g.fill();
            g.fillStyle = 'rgba(255,60,60,' + (0.2 + 0.2 * Math.sin(A.time * 16)) + ')';
            g.beginPath();
            g.arc(0, -52, 40, 0, 7);
            g.fill();
            g.fillStyle = 'rgba(255,255,255,.35)';
            g.beginPath();
            g.ellipse(-14, -70, 10, 6, -0.6, 0, 7);
            g.fill();
            g.fillStyle = '#555';
            g.fillRect(-8, -100, 16, 12);
            g.strokeStyle = '#c9a26b';
            g.lineWidth = 3;
            g.beginPath();
            g.moveTo(0, -100);
            g.quadraticCurveTo(10, -118, 4, -128);
            g.stroke();
            g.fillStyle = Math.random() < 0.5 ? '#ffd166' : '#ff8a3d';
            g.beginPath();
            g.arc(4, -130, 4 + Math.random() * 3, 0, 7);
            g.fill();
            g.fillStyle = '#ffffff';
            g.font = `900 30px ${FONT}`;
            g.textAlign = 'center';
            g.fillText('☠', 0, -42);
            g.restore();
            return;
        }
        const gold = m.type === 'gold', bunny = m.type === 'bunny', king = m.type === 'king';
        const fur = gold ? '#f2b705' : bunny ? '#f4f1ee' : king ? '#7a4fb8' : m.type === 'clock' ? '#7d6a5a' : '#8a5a3b';
        const furD = gold ? '#c98a00' : bunny ? '#d9cfc8' : king ? '#56348a' : '#6b4329';
        const belly = gold ? '#ffe680' : bunny ? '#ffffff' : king ? '#c9a8f0' : '#c79a72';
        if (bunny) {
            for (const s2 of [-1, 1]) {
                g.fillStyle = fur;
                g.beginPath(); g.ellipse(s2 * 16, -118, 11, 34, s2 * 0.15, 0, 7); g.fill();
                g.fillStyle = '#ffb3c7';
                g.beginPath(); g.ellipse(s2 * 16, -116, 5, 24, s2 * 0.15, 0, 7); g.fill();
            }
        }
        g.fillStyle = fur;
        g.beginPath();
        g.moveTo(-42, 10);
        g.lineTo(-42, -60);
        g.bezierCurveTo(-42, -112, 42, -112, 42, -60);
        g.lineTo(42, 10);
        g.closePath();
        g.fill();
        g.fillStyle = belly;
        g.beginPath();
        g.ellipse(0, -18, 26, 30, 0, 0, 7);
        g.fill();
        g.fillStyle = furD;
        g.beginPath();
        g.ellipse(-30, -88, 9, 8, 0, 0, 7);
        g.ellipse(30, -88, 9, 8, 0, 0, 7);
        g.fill();
        const lx = bonked ? 0 : Math.sin(A.time * 3 + h.x) * 3 * m.look;
        if (bonked) {
            g.strokeStyle = '#2a1a10';
            g.lineWidth = 3;
            for (const ex of [-15, 15]) {
                g.beginPath();
                g.moveTo(ex - 6, -72);
                g.lineTo(ex + 6, -62);
                g.moveTo(ex + 6, -72);
                g.lineTo(ex - 6, -62);
                g.stroke();
            }
        }
        else {
            for (const ex of [-15, 15]) {
                g.fillStyle = '#ffffff';
                g.beginPath();
                g.ellipse(ex, -67, 8, 9, 0, 0, 7);
                g.fill();
                g.fillStyle = '#1d1209';
                g.beginPath();
                g.arc(ex + lx, -66, 4.5, 0, 7);
                g.fill();
                g.fillStyle = '#ffffff';
                g.beginPath();
                g.arc(ex + lx + 1.5, -68, 1.5, 0, 7);
                g.fill();
            }
        }
        g.fillStyle = bunny ? '#ff8fb0' : '#ff7aa2';
        g.beginPath();
        g.ellipse(0, -50, bunny ? 6 : 10, bunny ? 5 : 7, 0, 0, 7);
        g.fill();
        g.fillStyle = '#ffffff';
        g.fillRect(-6, -42, 5, 8);
        g.fillRect(1, -42, 5, 8);
        g.strokeStyle = 'rgba(40,20,10,.6)';
        g.lineWidth = 1.5;
        for (const s of [-1, 1]) {
            g.beginPath();
            g.moveTo(s * 12, -50);
            g.lineTo(s * 34, -56);
            g.moveTo(s * 12, -47);
            g.lineTo(s * 34, -45);
            g.stroke();
        }
        if (king) {
            g.fillStyle = '#ffcc33';
            g.beginPath();
            g.moveTo(-30, -92); g.lineTo(-30, -122); g.lineTo(-16, -104); g.lineTo(0, -128); g.lineTo(16, -104); g.lineTo(30, -122); g.lineTo(30, -92); g.closePath();
            g.fill();
            g.fillStyle = '#ff4d6d';
            g.beginPath(); g.arc(0, -104, 4, 0, 7); g.fill();
            g.fillStyle = '#ffffff';
            g.font = `800 12px ${FONT}`;
            g.textAlign = 'center';
            g.fillText('♥'.repeat(m.hp), 0, -132);
        }
        if (m.type === 'clock') {
            g.fillStyle = '#ffffff';
            g.strokeStyle = '#2f80ed';
            g.lineWidth = 4;
            g.beginPath(); g.arc(0, -20, 20, 0, 7); g.fill(); g.stroke();
            g.strokeStyle = '#1d1209';
            g.lineWidth = 2.5;
            const a1 = A.time * 4;
            g.beginPath(); g.moveTo(0, -20); g.lineTo(Math.cos(a1) * 13, -20 + Math.sin(a1) * 13); g.moveTo(0, -20); g.lineTo(0, -31); g.stroke();
        }
        if (m.hat) {
            g.fillStyle = '#ffcc00';
            g.beginPath();
            g.ellipse(0, -88, 40, 26, 0, Math.PI, 0);
            g.fill();
            g.fillRect(-48, -90, 96, 8);
            g.fillStyle = '#e0a800';
            g.fillRect(-6, -112, 12, 22);
        }
        if (gold && !bonked) {
            g.fillStyle = '#ffffff';
            for (let k = 0; k < 3; k++) {
                const a = A.time * 3 + k * 2.1;
                const sx = Math.cos(a) * 46, sy = -60 + Math.sin(a) * 40;
                g.beginPath();
                g.moveTo(sx, sy - 6);
                g.lineTo(sx + 2, sy);
                g.lineTo(sx, sy + 6);
                g.lineTo(sx - 2, sy);
                g.closePath();
                g.fill();
            }
        }
        g.fillStyle = furD;
        g.beginPath();
        g.ellipse(-28, 2, 14, 8, 0, 0, 7);
        g.ellipse(28, 2, 14, 8, 0, 0, 7);
        g.fill();
        g.restore();
        if (bonked) {
            g.fillStyle = '#ffe14d';
            for (let k = 0; k < 3; k++) {
                const a = A.time * 7 + k * 2.1;
                const sx = x + Math.cos(a) * 34, sy = y - 105 + Math.sin(a) * 9;
                g.beginPath();
                for (let i = 0; i < 10; i++) {
                    const aa = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 2.6 : 6;
                    g.lineTo(sx + Math.cos(aa) * rr, sy + Math.sin(aa) * rr);
                }
                g.fill();
            }
        }
        if (m.hatFly) {
            const f = m.hatFly;
            g.save();
            g.translate(x + f.x, y + f.y);
            g.rotate(f.r);
            g.fillStyle = '#ffcc00';
            g.beginPath();
            g.ellipse(0, 0, 40, 26, 0, Math.PI, 0);
            g.fill();
            g.fillRect(-48, -2, 96, 8);
            g.restore();
        }
    }
    function drawHammer(g) {
        const sw = hammer.swing;
        let ang = -0.55;
        if (sw > 0) ang = sw < 0.06 ? -0.55 + (sw / 0.06) * 1.25 : 0.7 - ((sw - 0.06) / 0.18) * 1.25;
        g.save();
        g.translate(hammer.x + 70, hammer.y + 70);
        g.rotate(ang);
        g.translate(-70, -70);
        g.strokeStyle = '#7a4a22';
        g.lineCap = 'round';
        g.lineWidth = 10;
        g.beginPath();
        g.moveTo(8, 4);
        g.lineTo(84, 84);
        g.stroke();
        g.strokeStyle = '#a0662f';
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(10, 4);
        g.lineTo(82, 78);
        g.stroke();
        g.save();
        g.rotate(Math.PI / 4);
        const sk = skin();
        g.fillStyle = sk.head;
        rrect(g, -28, -16, 56, 32, 8);
        g.fill();
        g.fillStyle = sk.hi;
        rrect(g, -28, -16, 56, 10, 6);
        g.fill();
        g.fillStyle = sk.band;
        g.fillRect(-28, -16, 9, 32);
        g.fillRect(19, -16, 9, 32);
        g.restore();
        g.restore();
    }
    function draw(g) {
        g.save();
        if (shake > 0) g.translate((Math.random() - 0.5) * shake * 20, (Math.random() - 0.5) * shake * 20);
        const dark = A.dark;
        const sky = g.createLinearGradient(0, 0, 0, 150);
        sky.addColorStop(0, dark ? '#0f1b3d' : '#7fd3ff');
        sky.addColorStop(1, dark ? '#24396b' : '#c8f0ff');
        g.fillStyle = sky;
        g.fillRect(-20, -20, W + 40, 190);
        g.fillStyle = dark ? '#f4f1d0' : '#ffd84d';
        g.beginPath();
        g.arc(520, 55, 26, 0, 7);
        g.fill();
        g.fillStyle = dark ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.9)';
        for (const c of clouds) {
            g.beginPath();
            g.arc(c.x, c.y, 16 * c.s, 0, 7);
            g.arc(c.x + 18 * c.s, c.y - 8 * c.s, 20 * c.s, 0, 7);
            g.arc(c.x + 38 * c.s, c.y, 15 * c.s, 0, 7);
            g.fill();
        }
        for (let i = 0; i < 6; i++) {
            const tx = 40 + i * 110 + ((i * 37) % 30), ty = 128 - (i % 2) * 10;
            g.fillStyle = dark ? '#3a2a1e' : '#8a6040';
            g.fillRect(tx - 4, ty - 6, 8, 30);
            g.fillStyle = dark ? '#173d22' : i % 2 ? '#3f9a45' : '#4caf50';
            g.beginPath(); g.arc(tx, ty - 18, 24, 0, 7); g.arc(tx - 16, ty - 6, 16, 0, 7); g.arc(tx + 16, ty - 6, 16, 0, 7); g.fill();
        }
        g.fillStyle = dark ? '#1f4d2a' : '#5cbf4a';
        g.beginPath();
        g.moveTo(-20, 150);
        for (let x = -20; x <= W + 20; x += 40) g.quadraticCurveTo(x + 20, 120 + ((x * 7) % 25), x + 40, 150);
        g.lineTo(W + 20, H + 20);
        g.lineTo(-20, H + 20);
        g.fill();
        g.fillStyle = dark ? '#245a31' : '#68cc55';
        for (let i = 0; i < 7; i++) g.fillRect(i * 100 - 10, 150, 50, H);
        g.fillStyle = dark ? '#2f6b3b' : '#7bd965';
        for (let i = 0; i < 40; i++) {
            const gx = (i * 97) % W, gy = 170 + ((i * 53) % (H - 180));
            g.beginPath();
            g.moveTo(gx, gy);
            g.lineTo(gx + 3, gy - 9);
            g.lineTo(gx + 6, gy);
            g.fill();
        }
        g.fillStyle = dark ? '#6b5640' : '#f3e2c7';
        for (let x = 6; x < W; x += 34) { g.beginPath(); g.moveTo(x, 172); g.lineTo(x + 8, 160); g.lineTo(x + 16, 172); g.lineTo(x + 16, 196); g.lineTo(x, 196); g.fill(); }
        g.fillRect(0, 168, W, 6);
        g.fillRect(0, 184, W, 6);
        const fl = ['#ff6b9d', '#ffd23f', '#ffffff', '#b18cff'];
        for (let i = 0; i < 26; i++) {
            const fx = (i * 113) % W, fy = 205 + ((i * 71) % (H - 215));
            if (holes.some((h) => Math.abs(h.x - fx) < 90 && Math.abs(h.y - fy) < 45)) continue;
            g.fillStyle = fl[i % 4];
            for (let k = 0; k < 5; k++) { g.beginPath(); g.arc(fx + Math.cos(k * 1.26) * 4, fy + Math.sin(k * 1.26) * 4, 3, 0, 7); g.fill(); }
            g.fillStyle = '#ffcc33';
            g.beginPath(); g.arc(fx, fy, 2.2, 0, 7); g.fill();
        }
        for (const h of holes) {
            g.fillStyle = dark ? '#3e2a1a' : '#8a5a33';
            g.beginPath();
            g.ellipse(h.x, h.y + 6, 80, 30, 0, 0, 7);
            g.fill();
            g.fillStyle = '#1e120a';
            g.beginPath();
            g.ellipse(h.x, h.y, 62, 20, 0, 0, 7);
            g.fill();
            if (h.m) drawMole(g, h);
            g.fillStyle = dark ? '#4e3522' : '#a06a3c';
            g.beginPath();
            g.ellipse(h.x, h.y + 6, 80, 30, 0, 0, Math.PI);
            g.ellipse(h.x, h.y, 62, 20, 0, Math.PI, 0, true);
            g.fill();
            g.fillStyle = 'rgba(255,255,255,.1)';
            g.beginPath();
            g.ellipse(h.x, h.y + 22, 50, 5, 0, 0, 7);
            g.fill();
        }
        A.fx.draw(g);
        g.textAlign = 'center';
        for (const t of texts) {
            g.globalAlpha = Math.min(1, t.t * 2.5);
            g.font = `900 ${t.big ? 30 : 22}px ${FONT}`;
            g.lineWidth = 5;
            g.strokeStyle = 'rgba(30,20,10,.55)';
            g.strokeText(t.s, t.x, t.y);
            g.fillStyle = t.c;
            g.fillText(t.s, t.x, t.y);
        }
        g.globalAlpha = 1;
        if (A.state === 'play' || A.state === 'paused') {
            const frac = Math.max(0, timeLeft / ROUND);
            g.fillStyle = 'rgba(0,0,0,.25)';
            rrect(g, 20, 14, W - 40, 12, 6);
            g.fill();
            g.fillStyle = timeLeft <= 10 ? '#ff5a5a' : '#ffffff';
            rrect(g, 20, 14, Math.max(12, (W - 40) * Math.min(1, frac)), 12, 6);
            g.fill();
            if (ready > 0) {
                g.font = `900 52px ${FONT}`;
                g.lineWidth = 8;
                g.strokeStyle = 'rgba(30,20,10,.5)';
                const s = ready > 0.45 ? 'Ready?' : 'Whack!';
                g.strokeText(s, W / 2, 100);
                g.fillStyle = '#ffffff';
                g.fillText(s, W / 2, 100);
            }
            if (hammer.mouse || hammer.touchT > 0 || hammer.swing > 0) drawHammer(g);
        }
        else if (A.state === 'menu') drawHammer(g);
        g.restore();
        if (flash > 0) {
            g.fillStyle = `rgba(255,240,220,${flash})`;
            g.fillRect(0, 0, W, H);
        }
    }
    clouds = Array.from({ length: 4 }, (_, i) => ({ x: i * 170 + 20, y: 40 + (i % 2) * 40, s: 0.8 + (i % 3) * 0.25, v: 8 + i * 3 }));
    hammer = { x: 380, y: 300, swing: 0, mouse: false, touchT: 0 };
    A.debug = () => ({
        time: timeLeft, combo, mult, hits, swings, ready, hy: HY,
        holes: holes.map((h) => (h.m ? h.m.type + ':' + h.m.state : '')),
        pop(i, type) { const h = holes[i]; h.m = { type, t: 0.2, rise: 0.1, stay: 5, state: 'up', hp: type === 'helmet' ? 2 : 1, bonk: 0, hat: type === 'helmet', look: 1 }; },
        hold() { spawnT = 999; for (const h of holes) h.m = null; ready = 0; },
        end() { timeLeft = 0.01; }
    });
    function paintMenu() {
        document.querySelectorAll('[data-seg="mode"] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === S.mode)));
        const big = document.querySelector('[data-big]');
        if (big) big.checked = !!S.big;
        const sk = document.querySelector('[data-skins]');
        if (sk) sk.innerHTML = SKINS.map((k) => { const ok = (S.stats.best.classic || 0) >= k.need; return `<button type="button" class="wm-skin" data-skin="${k.id}" aria-pressed="${skin().id === k.id}" ${ok ? '' : 'disabled'} title="${ok ? k.name : `Score ${k.need} in Classic to unlock`}" aria-label="${k.name} hammer${ok ? '' : ', locked'}"><i style="background:linear-gradient(${k.hi},${k.head})"></i>${ok ? k.name : '🔒'}</button>`; }).join('');
        A.bestKey = S.mode === 'classic' ? 'score' : S.mode === 'daily' ? 'daily-' + today() : S.mode;
        A.showBest();
        const st = document.querySelector('[data-stats]');
        if (st) st.innerHTML = `<div class="c-stat"><b>${S.stats.games}</b><span>Games</span></div><div class="c-stat"><b>${S.stats.bonks}</b><span>Bonks</span></div><div class="c-stat"><b>${S.stats.golds}</b><span>Golden</span></div>`;
        const bd = document.querySelector('[data-badges]');
        if (bd) bd.innerHTML = ACH.map((a) => `<span class="wm-badge${S.ach[a.id] ? ' on' : ''}" title="${a.d}">${S.ach[a.id] ? '★' : '☆'} ${a.name}</span>`).join('');
        const bc = document.querySelector('[data-badge-count]');
        if (bc) bc.textContent = `(${ACH.filter((a) => S.ach[a.id]).length}/${ACH.length})`;
    }
    document.querySelector('[data-seg="mode"]').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.mode = b.dataset.v; save(); paintMenu(); Curio.beep(520, 0.04, 'triangle', 0.05); });
    document.querySelector('[data-big]').addEventListener('change', (e) => { S.big = e.target.checked; save(); });
    document.querySelector('[data-skins]').addEventListener('click', (e) => { const b = e.target.closest('[data-skin]'); if (!b || b.disabled) return; S.skin = b.dataset.skin; save(); paintMenu(); Curio.beep(660, 0.05, 'triangle', 0.06); });
    document.querySelector('[data-share]').addEventListener('click', () => {
        const r = lastRes || { hits: 0, acc: 0, bestCombo: 0 };
        const name = { classic: 'Classic', frenzy: 'Frenzy', survival: 'Survival', daily: `Daily ${today()}` }[S.mode];
        const txt = `Curio Whack-a-Mole · ${name}\n🔨 ${A.score} points, ${r.hits} bonks, ${r.acc}% accuracy, best combo ${r.bestCombo}`;
        (navigator.clipboard?.writeText(txt) || Promise.reject()).then(() => Curio.toast('Result copied'), () => Curio.toast('Copy failed, sorry'));
    });
    const baseMenu = A.menu;
    A.menu = () => { baseMenu(); paintMenu(); };
    reset();
    paintMenu();
    A.boot();
})();
