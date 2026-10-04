'use strict';
function Arcade(o) {
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => document.querySelectorAll(s);
    const slug = document.body.dataset.game || 'arcade';
    const stage = $('.arc-stage'), canvas = $('#arc-canvas'), ctx = canvas.getContext('2d');
    const ov = { menu: $('#ov-menu'), pause: $('#ov-pause'), over: $('#ov-over') };
    const STEP = 1 / 120;
    const A = {
        state: 'menu', score: 0, W: o.width || 400, H: o.height || 400, ctx, canvas, stage, slug,
        keys: new Set(), time: 0, bestKey: 'score', STEP, dpr: 1, scale: 1, colors: {}, shakeMag: 0, shareText: '', earned: []
    };
    const hud = {};
    $$('[data-hud]').forEach((el) => (hud[el.dataset.hud] ||= []).push(el));
    A.hud = (name, v) => { const s = String(v); for (const el of hud[name] || []) if (el.textContent !== s) el.textContent = s; };
    A.daily = false;
    A.tableKey = () => (Curio.simple ? 'simple' : A.daily ? `daily-${window.Cab ? Cab.today() : 'day'}` : A.bestKey);
    A.showBest = () => {
        const b = Curio.getBest(A.tableKey()) ?? 0;
        A.hud('best', Curio.fmt(Math.max(b, A.state === 'play' || A.state === 'paused' ? A.score : 0)));
    };
    A.setScore = (n) => { A.score = n; A.hud('score', Curio.fmt(n)); A.showBest(); };
    A.addScore = (n) => A.setScore(A.score + n);
    const PKEY = `${slug}-profile`;
    function freshProfile() { return { v: 1, games: 0, badges: {}, stats: {} }; }
    let prof = Curio.store.get(PKEY, null);
    if (!prof || typeof prof !== 'object' || prof.v !== 1) prof = freshProfile();
    prof = Object.assign(freshProfile(), prof);
    if (!prof.badges || typeof prof.badges !== 'object') prof.badges = {};
    if (!prof.stats || typeof prof.stats !== 'object') prof.stats = {};
    A.profile = prof;
    A.save = () => Curio.store.set(PKEY, prof);
    A.stat = (name, add = 0) => { const v = (Number(prof.stats[name]) || 0) + add; if (add) { prof.stats[name] = v; A.save(); } return v; };
    A.statMax = (name, v) => { const p = Number(prof.stats[name]) || 0; if (v > p) { prof.stats[name] = v; A.save(); return true; } return false; };
    A.badgeList = o.badges || [];
    A.has = (id) => !!prof.badges[id];
    A.unlock = (id) => {
        if (prof.badges[id]) return false;
        const b = A.badgeList.find((x) => x[0] === id);
        if (!b) return false;
        prof.badges[id] = Date.now();
        A.save();
        A.earned.push(b);
        Curio.toast(`${b[1]} Badge: ${b[2]}`);
        [784, 988, 1319].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.08, 'triangle', 0.07), i * 80));
        renderBadges();
        return true;
    };
    function renderBadges() {
        $$('[data-badges]').forEach((box) => {
            box.innerHTML = '';
            for (const [id, icon, name, desc] of A.badgeList) {
                const d = document.createElement('button');
                d.type = 'button';
                d.className = 'arc-badge' + (prof.badges[id] ? ' on' : '');
                d.textContent = icon;
                d.title = `${name}: ${desc}${prof.badges[id] ? ' (earned)' : ''}`;
                d.setAttribute('aria-label', d.title);
                d.addEventListener('click', () => Curio.toast(`${icon} ${name}: ${desc}${prof.badges[id] ? ' ✓' : ''}`, 2600));
                box.append(d);
            }
        });
        const n = Object.keys(prof.badges).filter((k) => A.badgeList.some((b) => b[0] === k)).length;
        A.hud('badgecount', `${n}/${A.badgeList.length}`);
    }
    function renderMenuStats() {
        const box = $('[data-o="mstats"]');
        if (!box || !o.menuStats) return;
        box.innerHTML = '';
        for (const [label, v] of o.menuStats()) {
            const d = document.createElement('span');
            d.className = 'arc-chip';
            d.innerHTML = '<b></b> ';
            d.firstChild.textContent = v;
            d.append(label);
            box.append(d);
        }
    }
    const opts = {};
    A.opt = (name) => opts[name];
    $$('.arc-seg[data-opt]').forEach((seg) => {
        const name = seg.dataset.opt;
        const btns = [...seg.querySelectorAll('[data-val]')];
        let v = Curio.simple ? (seg.dataset.simple || seg.dataset.def || btns[0]?.dataset.val) : Curio.store.get(`${slug}-opt-${name}`, seg.dataset.def || btns[0]?.dataset.val);
        if (!btns.some((b) => b.dataset.val === v)) v = btns[0]?.dataset.val;
        opts[name] = v;
        const paint = () => btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.val === opts[name])));
        paint();
        btns.forEach((b) => b.addEventListener('click', () => {
            if (b.disabled) return;
            opts[name] = b.dataset.val;
            if (!Curio.simple) Curio.store.set(`${slug}-opt-${name}`, opts[name]);
            paint();
            Curio.beep(560, 0.04, 'triangle', 0.06);
            o.option?.(name, opts[name]);
            if (o.bestKey) A.bestKey = o.bestKey();
            A.showBest();
            renderMenuStats();
        }));
    });
    A.paintOpts = () => $$('.arc-seg[data-opt]').forEach((seg) => seg.querySelectorAll('[data-val]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.val === opts[seg.dataset.opt]))));
    function readColors() {
        const cs = getComputedStyle(document.documentElement);
        for (const k of ['bg', 'surface', 'surface-2', 'ink', 'ink-2', 'ink-3', 'line', 'accent', 'good', 'bad', 'warn']) {
            A.colors[k.replace('-2', '2').replace('-3', '3')] = cs.getPropertyValue('--' + k).trim();
        }
        A.dark = Curio.isDark();
        o.theme?.();
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
    A.shake = (m) => { A.shakeMag = Math.max(A.shakeMag, m); };
    A.buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch { } };
    function render(alpha) {
        let sx = 0, sy = 0;
        if (A.shakeMag > 0.2) { sx = (Math.random() - 0.5) * A.shakeMag; sy = (Math.random() - 0.5) * A.shakeMag; }
        ctx.setTransform(canvas.width / A.W, 0, 0, canvas.height / A.H, sx * canvas.width / A.W, sy * canvas.height / A.H);
        o.draw(ctx, alpha);
    }
    let last = 0, acc = 0, raf = 0;
    function frame(t) {
        raf = requestAnimationFrame(frame);
        let dt = last ? (t - last) / 1000 : 0;
        last = t;
        if (dt > 0.1) dt = 0.1;
        A.time += dt;
        A.shakeMag = Math.max(0, A.shakeMag - dt * 40);
        if (A.state === 'play') {
            acc += dt;
            let n = 0;
            while (acc >= STEP && n++ < 16) {
                o.update(STEP);
                acc -= STEP;
                if (A.state !== 'play') { acc = 0; break; }
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
        for (const k in ov) if (ov[k]) ov[k].hidden = k !== name;
        if (name) ov[name].querySelector('.c-btn')?.focus({ preventScroll: true });
    }
    function releaseAll() { for (const k of [...A.keys]) { A.keys.delete(k); o.key?.(k, false, false); } }
    A.start = () => {
        releaseAll();
        A.score = 0;
        A.earned = [];
        if (o.bestKey) A.bestKey = o.bestKey();
        A.state = 'play';
        if (A.daily && window.Cab) Cab.seed(Cab.today());
        o.reset();
        A.setScore(A.score);
        show(null);
        last = 0;
        acc = 0;
        if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
        o.start?.();
    };
    A.pause = () => {
        if (A.state !== 'play') return;
        releaseAll();
        A.state = 'paused';
        show('pause');
        Curio.beep(392, 0.06, 'triangle', 0.08);
    };
    A.resume = () => {
        if (A.state !== 'paused') return;
        A.state = 'play';
        show(null);
        last = 0;
        acc = 0;
        if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    };
    A.menu = () => { releaseAll(); A.state = 'menu'; A.daily = false; if (A.savedOpts) { Object.assign(opts, A.savedOpts); A.savedOpts = null; A.paintOpts(); } o.menu?.(); show('menu'); if (o.bestKey) A.bestKey = o.bestKey(); A.showBest(); renderMenuStats(); renderBadges(); window.Cab?.menu(); };
    A.over = ({ title = 'Game over', emoji = '💥', msg = '', lines = [], share = '', higherIsBetter = true, value } = {}) => {
        if (A.state === 'over') return;
        releaseAll();
        A.state = 'over';
        prof.games = (prof.games || 0) + 1;
        A.save();
        const val = value ?? A.score;
        window.Cab?.unseed();
        const r = Curio.best(A.tableKey(), val, higherIsBetter);
        const box = ov.over;
        const set = (n, v) => { const el = box.querySelector(`[data-o="${n}"]`); if (el) el.textContent = v; };
        set('emoji', emoji);
        set('title', title);
        set('score', typeof val === 'number' ? Curio.fmt(val) : val);
        set('best', Curio.fmt(r.best));
        set('msg', msg);
        const lb = box.querySelector('[data-o="lines"]');
        if (lb) {
            lb.innerHTML = '';
            for (const [label, v] of lines) {
                const d = document.createElement('span');
                d.className = 'arc-chip';
                d.innerHTML = '<b></b> ';
                d.firstChild.textContent = v;
                d.append(label);
                lb.append(d);
            }
        }
        const eb = box.querySelector('[data-o="earned"]');
        if (eb) {
            eb.innerHTML = '';
            eb.hidden = !A.earned.length;
            for (const b of A.earned) {
                const d = document.createElement('span');
                d.className = 'arc-earned';
                d.textContent = `${b[1]} ${b[2]}`;
                d.title = b[3];
                eb.append(d);
            }
        }
        A.shareText = share || `${document.title.split('·')[0].trim()} on Zoble: ${Curio.fmt(A.score)} points`;
        const sb = box.querySelector('[data-act="share"]');
        if (sb) sb.hidden = !A.shareText;
        const isNew = r.isNew && val > 0;
        box.querySelector('[data-o="new"]').hidden = !isNew;
        if (isNew) {
            Curio.confetti();
            [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.14, 'triangle', 0.12), 120 + i * 90));
        }
        overAt = performance.now();
        show('over');
        A.showBest();
        renderBadges();
        if (typeof val === 'number') window.Cab?.over(val, { key: A.tableKey(), low: !higherIsBetter });
    };
    async function share() {
        try {
            await navigator.clipboard.writeText(A.shareText);
            Curio.toast('Result copied to clipboard');
        }
        catch {
            const p = document.createElement('pre');
            p.className = 'arc-share';
            p.textContent = A.shareText;
            Curio.modal({ emoji: '📋', title: 'Copy your result', body: p, buttons: [{ label: 'Done', value: 1 }] });
        }
    }
    const startBtn = ov.menu?.querySelector('[data-act="start"]');
    if (startBtn && o.daily !== false && !Curio.simple) {
        const d = document.createElement('button');
        d.type = 'button';
        d.className = 'c-btn c-btn--ghost arc-daily';
        d.dataset.act = 'daily';
        d.textContent = '📅 Daily challenge';
        startBtn.after(d);
    }
    $$('[data-act]').forEach((b) => b.addEventListener('click', (e) => {
        const a = b.dataset.act;
        if (a === 'daily') { if (!A.savedOpts) A.savedOpts = { ...opts }; Object.assign(opts, o.dailyOpts?.() || {}); A.daily = true; A.start(); return; }
        if (a === 'start' || a === 'restart') {
            if (performance.now() - overAt > 450) A.start();
        }
        else if (a === 'resume') A.resume();
        else if (a === 'menu') A.menu();
        else if (a === 'share') share();
        else if (a === 'pause') {
            if (A.state === 'play') A.pause();
            else if (A.state === 'paused') A.resume();
        }
        else if (a === 'random') return;
        else o.act?.(a, b, e);
    }));
    const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']);
    const norm = (k) => (k.length === 1 ? k.toLowerCase() : k === 'Spacebar' ? ' ' : k);
    function press(k, down, repeat) {
        if (down) A.keys.add(k);
        else A.keys.delete(k);
        o.key?.(k, down, repeat);
    }
    A.press = press;
    addEventListener('keydown', (e) => {
        if (e.target.closest?.('input, select, textarea')) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (document.querySelector('.curio-modal')) return;
        const k = norm(e.key);
        const onBtn = e.target.closest?.('button, a');
        if (k === 'p' || k === 'Escape') {
            if (A.state === 'play') { A.pause(); e.preventDefault(); }
            else if (A.state === 'paused') { A.resume(); e.preventDefault(); }
            return;
        }
        if (A.state !== 'play') {
            if ((k === ' ' || k === 'Enter') && !onBtn && !e.repeat) {
                e.preventDefault();
                if (A.state === 'paused') A.resume();
                else if (performance.now() - overAt > 450) A.start();
            }
            else if (A.state === 'menu') o.menuKey?.(k, e);
            return;
        }
        if (PREVENT.has(k) || (o.capture || []).includes(k)) e.preventDefault();
        if (e.repeat) { o.key?.(k, true, true); return; }
        press(k, true, false);
    });
    addEventListener('keyup', (e) => { const k = norm(e.key); if (A.keys.has(k)) press(k, false, false); });
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
            if (on) return;
            on = true;
            btn.classList.add('is-down');
            try { btn.setPointerCapture(e.pointerId); } catch { }
            if (A.state === 'play') press(k, true, false);
        };
        const up = () => {
            if (!on) return;
            on = false;
            btn.classList.remove('is-down');
            if (A.keys.has(k)) press(k, false, false);
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
        if (e.target.closest('.arc-ov')) return;
        if (e.pointerType === 'touch') document.body.classList.add('arc-touch');
        if (A.state !== 'play' || e.button > 0) return;
        e.preventDefault();
        o.pointer?.('down', toLogical(e), e);
    });
    addEventListener('pointermove', (e) => {
        if (A.state !== 'play') return;
        o.pointer?.('move', toLogical(e), e);
    });
    addEventListener('pointerup', (e) => { if (A.state === 'play') o.pointer?.('up', toLogical(e), e); });
    const padMouse = (p) => Curio.touchpad && p.pointerType === 'mouse';
    Curio.drag(canvas, {
        start(p) {
            if (p.event.target.closest?.('.arc-ov') || A.state !== 'play') { ptr = null; return; }
            ptr = { x: p.clientX, y: p.clientY, x0: p.clientX, y0: p.clientY, t: performance.now(), moved: false, tapped: false };
            if (padMouse(p) || !o.swipe) { ptr.tapped = true; o.tap?.(toLogical(p.event)); }
        },
        move(p) {
            if (!ptr || A.state !== 'play') return;
            const dx = p.clientX - ptr.x, dy = p.clientY - ptr.y;
            const d = o.swipeDist || 26;
            if (Math.hypot(dx, dy) >= d) {
                const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
                ptr.x = p.clientX;
                ptr.y = p.clientY;
                ptr.moved = true;
                o.swipe?.(dir);
            }
        },
        end(p) {
            if (!ptr) return;
            if (p && A.state === 'play' && !ptr.tapped && !ptr.moved && performance.now() - ptr.t < 320 && Math.hypot(p.clientX - ptr.x0, p.clientY - ptr.y0) < 14) o.tap?.(toLogical(p.event));
            ptr = null;
        }
    });
    if (o.touchTip) {
        const tk = `${slug}-tip-seen`;
        if (!Curio.store.get(tk, false)) {
            Curio.store.set(tk, true);
            setTimeout(() => Curio.toast(o.touchTip, 4200), 900);
        }
    }
    stage.addEventListener('contextmenu', (e) => e.preventDefault());
    A.beep = (f, d, type, vol) => Curio.beep(f, d, type, vol);
    A.sweep = (f1, f2, d = 0.15, type = 'square', vol = 0.07) => {
        if (Curio.muted) return;
        const ac = Curio.audioContext();
        if (!ac) return;
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
        if (Curio.muted) return;
        const ac = Curio.audioContext();
        if (!ac) return;
        if (!noiseBuf) {
            noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
            const ch = noiseBuf.getChannelData(0);
            for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
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
    A.chord = (notes, gap = 80, d = 0.1, type = 'triangle', vol = 0.09) => notes.forEach((f, i) => setTimeout(() => Curio.beep(f, d, type, vol), i * gap));
    A.fx = {
        list: [],
        rings: [],
        texts: [],
        clear() { this.list.length = 0; this.rings.length = 0; this.texts.length = 0; },
        burst(x, y, n, colors, { speed = 160, life = 0.6, size = 3, gravity = 300, spread = Math.PI * 2, angle = 0, drag = 1.5, round = false } = {}) {
            for (let i = 0; i < n; i++) {
                const a = angle + (Math.random() - 0.5) * spread, s = speed * (0.35 + Math.random() * 0.65);
                this.list.push({
                    x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: life * (0.6 + Math.random() * 0.4), max: life,
                    size: size * (0.6 + Math.random() * 0.7), c: Array.isArray(colors) ? colors[(Math.random() * colors.length) | 0] : colors, g: gravity, drag, round
                });
            }
        },
        ring(x, y, color, r = 40, life = 0.45, width = 3) { this.rings.push({ x, y, color, r, life, max: life, width }); },
        text(x, y, text, color = '#fff', size = 16, life = 0.9) { this.texts.push({ x, y, text, color, size, life, max: life }); },
        update(dt) {
            const L = this.list;
            for (let i = L.length - 1; i >= 0; i--) {
                const p = L[i];
                p.life -= dt;
                if (p.life <= 0) { L[i] = L[L.length - 1]; L.pop(); continue; }
                const k = Math.exp(-p.drag * dt);
                p.vx *= k;
                p.vy = p.vy * k + p.g * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }
            for (const arr of [this.rings, this.texts]) {
                for (let i = arr.length - 1; i >= 0; i--) { arr[i].life -= dt; if (arr[i].life <= 0) arr.splice(i, 1); }
            }
        },
        draw(g) {
            for (const p of this.list) {
                g.globalAlpha = Math.max(0, Math.min(1, p.life / p.max * 1.5));
                g.fillStyle = p.c;
                if (p.round) { g.beginPath(); g.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2); g.fill(); }
                else g.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            }
            for (const r of this.rings) {
                const k = 1 - r.life / r.max;
                g.globalAlpha = Math.max(0, 1 - k);
                g.strokeStyle = r.color;
                g.lineWidth = r.width * (1 - k * 0.6);
                g.beginPath();
                g.arc(r.x, r.y, 4 + r.r * (1 - Math.pow(1 - k, 3)), 0, Math.PI * 2);
                g.stroke();
            }
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            for (const t of this.texts) {
                const k = 1 - t.life / t.max;
                g.globalAlpha = Math.max(0, Math.min(1, t.life / t.max * 2));
                const s = t.size * (k < 0.15 ? 0.6 + k / 0.15 * 0.5 : 1.1 - Math.min(0.1, (k - 0.15)));
                g.font = `900 ${s.toFixed(1)}px ${FONT}`;
                g.lineWidth = 3;
                g.strokeStyle = 'rgba(0,0,0,.45)';
                g.strokeText(t.text, t.x, t.y - k * 30);
                g.fillStyle = t.color;
                g.fillText(t.text, t.x, t.y - k * 30);
            }
            g.textBaseline = 'alphabetic';
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
    const W = 480, H = 640, PXS = 2.6, COLS = 11, ROWS = 5, GX = 36, GY = 32;
    const PY = H - 62, SHY = H - 150, CELL = 3, SW = 22, SH = 16;
    const SPR = {
        squid: [['....##.....', '...####....', '..######...', '.##.##.##..', '.########..', '...#..#....', '..#.##.#...', '.#.#..#.#..'], ['....##.....', '...####....', '..######...', '.##.##.##..', '.########..', '..#.##.#...', '.#......#..', '..#....#...']],
        crab: [['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'], ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.']],
        jelly: [['...#####...', '.#########.', '###########', '##..###..##', '###########', '..##...##..', '.##.###.##.', '##.......##'], ['...#####...', '.#########.', '###########', '##..###..##', '###########', '...##.##...', '..##.#.##..', '...#...#...']],
        armor: [['..#######..', '.#########.', '##.##.##.##', '###########', '.#########.', '..#.#.#.#..', '.#.......#.', '#.........#'], ['..#######..', '.#########.', '##.##.##.##', '###########', '.#########.', '..#.#.#.#..', '..#.....#..', '.#.......#.']],
        ship: [['.....##.....', '...######...', '.##########.', '##.##.##.##.', '############', '..###..###..', '...#....#...']],
        cannon: [['......#......', '.....###.....', '.....###.....', '.###########.', '#############', '#############', '#############']],
        boom: [['#...#.#...#', '.#..#.#..#.', '..#.....#..', '##.......##', '..#.....#..', '.#..#.#..#.', '#...#.#...#']],
        boss: [['.........######.........', '......############......', '....################....', '...###.##.####.##.###...', '..####################..', '.######################.', '########################', '.##.##..##.##.##..##.##.', '##......##....##......##', '.#.......#....#.......#.'], ['.........######.........', '......############......', '....################....', '...###.##.####.##.###...', '..####################..', '.######################.', '########################', '.##.##..##.##.##..##.##.', '.##.....##....##.....##.', '#.........#..#.........#']]
    };
    const TYPES = [
        { spr: 'squid', pts: 30, color: '#b388ff' },
        { spr: 'crab', pts: 20, color: '#4dd0e1' },
        { spr: 'crab', pts: 20, color: '#4dd0e1' },
        { spr: 'jelly', pts: 10, color: '#ff5ca8' },
        { spr: 'jelly', pts: 10, color: '#ff5ca8' }
    ];
    const ARMOR = { spr: 'armor', pts: 40, color: '#ffb74d', hp: 2 };
    const POW = {
        rapid: { c: '#ffd54f', g: '⚡', name: 'Rapid fire' },
        spread: { c: '#4dd0e1', g: '✦', name: 'Spread shot' },
        bubble: { c: '#7ee081', g: '◎', name: 'Force field' },
        freeze: { c: '#b3e5fc', g: '❄', name: 'Freeze ray' },
        life: { c: '#ff5ca8', g: '♥', name: 'Extra cannon' }
    };
    const DIFF = {
        cadet: { lives: 5, bomb: 0.8, rate: 1.35, pace: 1.15, name: 'Cadet' },
        classic: { lives: 3, bomb: 1, rate: 1, pace: 1, name: 'Classic' },
        veteran: { lives: 2, bomb: 1.2, rate: 0.75, pace: 0.85, name: 'Veteran' }
    };
    const BADGES = [
        ['first', '👾', 'First contact', 'Destroy your first alien'],
        ['wave3', '🌊', 'Holding the line', 'Reach wave 3'],
        ['wave6', '🛡️', 'Defender', 'Reach wave 6'],
        ['wave10', '🌍', 'Planet saver', 'Reach wave 10'],
        ['boss', '👹', 'Mothership down', 'Defeat a mothership'],
        ['boss2', '💀', 'Double trouble', 'Defeat 2 motherships in one game'],
        ['ufo3', '🛸', 'UFO hunter', 'Shoot 3 mystery ships in one game'],
        ['combo', '🎯', 'Sharpshooter', 'Reach a x4 combo'],
        ['flawless', '✨', 'Untouchable', 'Clear a wave without losing a cannon'],
        ['power5', '🔋', 'Power hungry', 'Collect 5 power-ups in one game'],
        ['bombs', '💣', 'Flak gunner', 'Shoot down 10 bombs in one game'],
        ['bullseye', '🔫', 'Bullseye', 'Clear a wave with 80% accuracy'],
        ['p5k', '⭐', '5,000 club', 'Score 5,000 points'],
        ['p15k', '🌟', '15,000 club', 'Score 15,000 points'],
        ['veteran', '🎖️', 'Veteran', 'Reach wave 4 on Veteran']
    ];
    const cache = new Map();
    function sprite(name, frame, color) {
        const k = name + frame + color;
        if (cache.has(k)) return cache.get(k);
        const rows = SPR[name][frame];
        const s = 4, pad = 3;
        const c = document.createElement('canvas');
        c.width = (rows[0].length + pad * 2) * s;
        c.height = (rows.length + pad * 2) * s;
        const g = c.getContext('2d');
        g.shadowColor = color;
        g.shadowBlur = 10;
        const hi = shade(color, 0.35), lo = shade(color, -0.25);
        rows.forEach((r, y) => [...r].forEach((ch, x) => {
            if (ch !== '#') return;
            g.fillStyle = y < rows.length * 0.35 ? hi : y > rows.length * 0.75 ? lo : color;
            g.fillRect((x + pad) * s, (y + pad) * s, s, s);
        }));
        g.shadowBlur = 0;
        g.fillStyle = 'rgba(255,255,255,.35)';
        rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#' && (y === 0 || r[x] === '#' && rows[y - 1][x] !== '#')) g.fillRect((x + pad) * s, (y + pad) * s, s, 1.5); }));
        const out = { c, pad };
        cache.set(k, out);
        return out;
    }
    function blit(g, name, frame, color, cx, cy, px = PXS) {
        const rows = SPR[name][frame];
        const sp = sprite(name, frame, color);
        const w = (rows[0].length + sp.pad * 2) * px, h = (rows.length + sp.pad * 2) * px;
        g.drawImage(sp.c, cx - w / 2, cy - h / 2, w, h);
    }
    const stars = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.6 + 0.3, tw: Math.random() * 6, v: 4 + Math.random() * 22 }));
    let bgCache = null, bgDark = null;
    function buildBg() {
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const g = c.getContext('2d');
        const dark = A.dark;
        const bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, dark ? '#04050d' : '#121741');
        bg.addColorStop(0.6, dark ? '#0d1030' : '#262a6c');
        bg.addColorStop(1, dark ? '#1a1240' : '#3b2f7a');
        g.fillStyle = bg;
        g.fillRect(0, 0, W, H);
        const blob = (x, y, r, col) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, W, H); };
        blob(90, 160, 220, dark ? 'rgba(140,60,200,.22)' : 'rgba(200,90,220,.25)');
        blob(400, 330, 240, dark ? 'rgba(40,140,220,.18)' : 'rgba(60,170,255,.22)');
        blob(250, 40, 160, 'rgba(255,120,160,.12)');
        for (let i = 0; i < 160; i++) { g.globalAlpha = Math.random() * 0.5 + 0.1; g.fillStyle = '#fff'; g.fillRect(Math.random() * W, Math.random() * (H - 40), 1, 1); }
        g.globalAlpha = 1;
        g.save();
        g.translate(420, 455);
        g.globalAlpha = 0.75;
        g.scale(0.7, 0.7);
        const pl = g.createRadialGradient(-10, -10, 4, 0, 0, 34);
        pl.addColorStop(0, '#ffcc80'); pl.addColorStop(1, '#e65100');
        g.fillStyle = pl; g.beginPath(); g.arc(0, 0, 30, 0, Math.PI * 2); g.fill();
        g.strokeStyle = 'rgba(255,224,178,.55)'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, 0, 50, 11, -0.35, 0, Math.PI * 2); g.stroke();
        g.restore();
        g.globalAlpha = 1;
        const gr = g.createLinearGradient(0, H - 32, 0, H);
        gr.addColorStop(0, dark ? '#24493a' : '#2f6b4a');
        gr.addColorStop(1, dark ? '#0e1f18' : '#173826');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, H - 28);
        for (let x = 0; x <= W; x += 20) g.lineTo(x, H - 30 + Math.sin(x * 0.05) * 2);
        g.lineTo(W, H); g.lineTo(0, H); g.fill();
        g.fillStyle = 'rgba(0,0,0,.2)';
        for (let i = 0; i < 12; i++) { g.beginPath(); g.ellipse(Math.random() * W, H - 14 + Math.random() * 10, 6 + Math.random() * 10, 2 + Math.random() * 2, 0, 0, Math.PI * 2); g.fill(); }
        g.fillStyle = '#7ee081'; g.globalAlpha = 0.7; g.fillRect(0, H - 31, W, 2); g.globalAlpha = 1;
        bgCache = c; bgDark = dark;
    }
    let aliens, fx0, fy, dir, stepT, frame, alive, player, shots, bombs, shields, ufo, ufoT, wave, lives, deadT, clearT, banner, extra, shotT, marchI, invaded, flash;
    let boss, pows, rapidT, spreadT, freezeT, bubble, fireCd, combo, bestCombo, shotsN, hitsN, kills, ufos, bossKills, powN, bombsShot, lostThisWave, waveShots, waveHits, d;
    const A = Arcade({
        width: W, height: H, reset, update, draw, key, tap, idle, capture: [' '], badges: BADGES,
        bestKey: () => (A.opt('diff') === 'classic' ? 'score' : 'score-' + A.opt('diff')),
        menuStats: () => [[' games', Curio.fmt(A.profile.games || 0)], [' aliens zapped', Curio.fmt(A.stat('kills'))], [' motherships', Curio.fmt(A.stat('bosses'))], [' best wave', A.stat('wave') || '-']],
        theme: () => { bgCache = null; }
    });
    function reset() {
        d = DIFF[A.opt('diff')] || DIFF.classic;
        wave = 1;
        lives = d.lives;
        extra = false;
        A.fx.clear();
        player = { x: W / 2, tilt: 0 };
        combo = 0; bestCombo = 0; shotsN = 0; hitsN = 0; kills = 0; ufos = 0; bossKills = 0; powN = 0; bombsShot = 0;
        rapidT = 0; spreadT = 0; freezeT = 0; bubble = false; fireCd = 0; pows = [];
        newWave();
        hud();
    }
    function hud() {
        A.hud('lives', Math.max(0, lives));
        A.hud('wave', wave);
    }
    function makeShield(cx) {
        const cells = new Uint8Array(SW * SH);
        for (let y = 0; y < SH; y++)
            for (let x = 0; x < SW; x++) {
                let on = true;
                const cut = 4 - y;
                if (cut > 0 && (x < cut || x >= SW - cut)) on = false;
                const mid = Math.abs(x - (SW - 1) / 2);
                if (y >= SH - 5 && mid < 4.5) on = false;
                if (y === SH - 6 && mid < 2.5) on = false;
                cells[y * SW + x] = on ? 1 : 0;
            }
        return { x: cx - (SW * CELL) / 2, y: SHY, cells, dirty: true, canvas: null };
    }
    const isBossWave = () => wave % 4 === 0;
    function newWave() {
        aliens = [];
        boss = null;
        if (isBossWave()) {
            const hp = 16 + wave * 3;
            boss = { x: W / 2, y: 150, hp, max: hp, t: 0, fireT: 2, hurt: 0, pattern: 0 };
            alive = 1;
        }
        else {
            for (let r = 0; r < ROWS; r++)
                for (let c = 0; c < COLS; c++) {
                    const armored = (r === 0 && wave >= 3) || (r === 1 && wave >= 7);
                    const t = armored ? ARMOR : TYPES[r];
                    aliens.push({ r, c, alive: true, t, hp: t.hp || 1, hit: 0 });
                }
            alive = aliens.length;
        }
        fx0 = (W - (COLS - 1) * GX) / 2 - 20;
        fy = 112 + Math.min(wave - 1, 6) * 14;
        dir = 1;
        stepT = 0.6;
        frame = 0;
        marchI = 0;
        shots = [];
        bombs = [];
        shotT = 1.5;
        ufo = null;
        ufoT = 16 + Math.random() * 10;
        deadT = 0;
        clearT = 0;
        invaded = 0;
        flash = 0;
        lostThisWave = false; waveShots = 0; waveHits = 0;
        if (wave === 1 || wave % 3 === 1) shields = [0, 1, 2, 3].map((i) => makeShield(W * (i + 1) / 5));
        banner = boss ? { text: '⚠ Mothership ⚠', sub: 'Aim for the glowing core', t: 0, warn: true } : { text: `Wave ${wave}`, sub: wave === 1 ? 'Here they come' : wave === 3 ? 'Armoured aliens take two hits' : 'They are angrier now', t: 0 };
        if (boss) { A.sweep(200, 60, 1.2, 'sawtooth', 0.06); setTimeout(() => A.sweep(200, 60, 1.2, 'sawtooth', 0.06), 600); }
        A.statMax('wave', wave);
        if (wave >= 3) A.unlock('wave3');
        if (wave >= 6) A.unlock('wave6');
        if (wave >= 10) A.unlock('wave10');
        if (wave >= 4 && A.opt('diff') === 'veteran') A.unlock('veteran');
    }
    const ax = (a) => fx0 + a.c * GX;
    const ay = (a) => fy + a.r * GY;
    function stepInterval() { return Math.max(0.022, (0.04 + 0.62 * Math.pow(alive / 55, 1.15)) * Math.pow(0.93, wave - 1)) * d.pace; }
    function key(k, down) {
        if (down && (k === ' ' || k === 'ArrowUp' || k === 'w')) fire();
    }
    function tap(p) { if (p.y < PY - 30) fire(); }
    function fire() {
        if (deadT || clearT || A.state !== 'play' || fireCd > 0) return;
        const rapid = rapidT > 0;
        if (!rapid && shots.length) return;
        if (rapid && shots.length >= 5) return;
        fireCd = rapid ? 0.14 : 0;
        const vs = spreadT > 0 ? [-150, 0, 150] : [0];
        for (const vx of vs) shots.push({ x: player.x, y: PY - 14, vx, main: vx === 0 });
        shotsN++; waveShots++;
        A.sweep(rapid ? 1700 : 1400, 500, 0.1, 'square', 0.045);
        A.fx.burst(player.x, PY - 16, 4, ['#ffffff', '#9ad0ff'], { speed: 60, life: 0.18, size: 2, gravity: 0, angle: -Math.PI / 2, spread: 1.2 });
    }
    const mult = () => 1 + Math.min(3, Math.floor(combo / 6));
    function score(n) {
        A.addScore(n);
        if (!extra && A.score >= 1500) {
            extra = true;
            lives++;
            hud();
            Curio.toast('Extra life!');
            A.chord([660, 880, 1100, 1320], 70, 0.08, 'triangle', 0.09);
        }
        if (A.score >= 5000) A.unlock('p5k');
        if (A.score >= 15000) A.unlock('p15k');
    }
    function hitStreak() {
        combo++; hitsN++; waveHits++;
        bestCombo = Math.max(bestCombo, combo);
        if (combo > 0 && combo % 6 === 0 && mult() > 1) {
            A.fx.text(player.x, PY - 50, `x${mult()} combo!`, '#ffd54f', 18, 1);
            A.chord([880, 1175], 60, 0.07, 'square', 0.05);
            if (mult() >= 4) A.unlock('combo');
        }
    }
    function shieldAt(x, y) {
        for (const s of shields) {
            const cx = Math.floor((x - s.x) / CELL), cy = Math.floor((y - s.y) / CELL);
            if (cx >= 0 && cy >= 0 && cx < SW && cy < SH && s.cells[cy * SW + cx]) return { s, cx, cy };
        }
        return null;
    }
    function erode(hit, rad, down) {
        const { s, cx, cy } = hit;
        for (let y = -rad - 1; y <= rad + 1; y++)
            for (let x = -rad - 1; x <= rad + 1; x++) {
                const dd = Math.hypot(x, y + (down ? -0.6 : 0.6));
                if (dd <= rad + Math.random() * 1.2 - 0.3) {
                    const X = cx + x, Y = cy + y;
                    if (X >= 0 && Y >= 0 && X < SW && Y < SH) s.cells[Y * SW + X] = 0;
                }
            }
        s.dirty = true;
        A.fx.burst(s.x + cx * CELL, s.y + cy * CELL, 6, ['#7ee081', '#3bb54a'], { speed: 90, life: 0.35, size: 3, gravity: 200 });
    }
    function traceShield(x, y0, y1, down) {
        const n = Math.ceil(Math.abs(y1 - y0) / 2) + 1;
        for (let i = 0; i <= n; i++) {
            const y = y0 + (y1 - y0) * i / n;
            const h = shieldAt(x, y);
            if (h) {
                erode(h, down ? 2 : 1.6, down);
                A.beep(180, 0.03, 'square', 0.04);
                return true;
            }
        }
        return false;
    }
    function killPlayer() {
        if (deadT) return;
        if (bubble) {
            bubble = false;
            A.fx.ring(player.x, PY, '#7ee081', 46, 0.5, 4);
            A.fx.burst(player.x, PY, 20, ['#7ee081', '#ffffff'], { speed: 200, life: 0.5, size: 3, gravity: 0 });
            A.sweep(900, 200, 0.3, 'triangle', 0.08);
            A.shake(5);
            return;
        }
        lives--;
        lostThisWave = true;
        combo = 0;
        hud();
        deadT = 1.6;
        flash = 0.3;
        A.shake(14);
        A.buzz([60, 40, 120]);
        A.fx.burst(player.x, PY, 46, ['#7ee081', '#ffffff', '#ffd54f', '#ff5a36'], { speed: 280, life: 1, size: 4, gravity: 120 });
        A.fx.ring(player.x, PY, '#ffd54f', 70, 0.6, 5);
        A.noise(0.7, 0.22, 1600);
        A.sweep(600, 60, 0.8, 'sawtooth', 0.07);
        bombs = [];
        shots = [];
        rapidT = 0; spreadT = 0;
    }
    function dropPow(x, y, kind) {
        if (Curio.simple && kind !== 'life') return;
        const k = kind || Curio.pick(['rapid', 'rapid', 'spread', 'spread', 'bubble', 'freeze', lives < 3 ? 'life' : 'bubble']);
        pows.push({ x, y, k, t: 0 });
    }
    function collect(p) {
        powN++;
        const P = POW[p.k];
        if (p.k === 'rapid') rapidT = 9;
        else if (p.k === 'spread') spreadT = 9;
        else if (p.k === 'bubble') bubble = true;
        else if (p.k === 'freeze') freezeT = 4;
        else if (p.k === 'life') { lives++; hud(); }
        A.fx.text(player.x, PY - 40, `${P.g} ${P.name}`, P.c, 17, 1.1);
        A.fx.ring(player.x, PY, P.c, 40, 0.4, 3);
        A.chord([660, 990, 1320], 50, 0.07, 'triangle', 0.08);
        A.buzz(20);
        if (powN >= 5) A.unlock('power5');
    }
    function killAlien(a, x, y) {
        a.alive = false;
        alive--;
        kills++;
        A.stat('kills', 1);
        A.unlock('first');
        const pts = a.t.pts * mult();
        score(pts);
        A.fx.text(x, y, mult() > 1 ? `${pts} x${mult()}` : String(pts), a.t.color, 14, 0.8);
        A.fx.burst(x, y, 18, [a.t.color, '#ffffff', shade(a.t.color, -0.3)], { speed: 180, life: 0.55, size: 4, gravity: 160 });
        A.fx.ring(x, y, a.t.color, 22, 0.3, 2);
        A.noise(0.18, 0.12, 2400);
        A.beep(300 + a.t.pts * 12, 0.06, 'square', 0.06);
        if (Math.random() < 0.05 && !pows.length) dropPow(x, y);
    }
    function updateBoss(dt) {
        const b = boss;
        b.t += dt;
        b.hurt = Math.max(0, b.hurt - dt);
        const rage = b.hp < b.max / 2;
        b.x = W / 2 + Math.sin(b.t * (rage ? 0.95 : 0.7)) * (W / 2 - 70);
        b.y = 150 + Math.sin(b.t * 1.3) * 14;
        if (freezeT > 0) return;
        b.fireT -= dt;
        if (b.fireT <= 0) {
            b.fireT = Math.max(0.6, (rage ? 1.05 : 1.5) - wave * 0.03) / d.rate;
            b.pattern++;
            const v = (180 + wave * 8) * d.bomb;
            if (b.pattern % 3 === 0) {
                for (let i = -2; i <= 2; i++) bombs.push({ x: b.x + i * 14, y: b.y + 24, t: 0, kind: 1, v, vx: i * 45 });
            }
            else {
                const ang = Math.atan2(PY - b.y, player.x - b.x);
                bombs.push({ x: b.x, y: b.y + 24, t: 0, kind: 0, v: v * Math.sin(ang) * 1.1, vx: v * Math.cos(ang) * 1.1 });
                if (rage) { bombs.push({ x: b.x - 40, y: b.y + 18, t: 0, kind: 1, v, vx: 0 }); bombs.push({ x: b.x + 40, y: b.y + 18, t: 0, kind: 1, v, vx: 0 }); }
            }
            A.sweep(300, 120, 0.15, 'sawtooth', 0.04);
        }
    }
    function update(dt) {
        A.fx.update(dt);
        flash = Math.max(0, flash - dt);
        fireCd = Math.max(0, fireCd - dt);
        rapidT = Math.max(0, rapidT - dt);
        spreadT = Math.max(0, spreadT - dt);
        freezeT = Math.max(0, freezeT - dt);
        for (const s of stars) { s.y += s.v * dt; if (s.y > H - 30) { s.y = 0; s.x = Math.random() * W; } }
        if (banner) { banner.t += dt; if (banner.t > 2.2) banner = null; }
        if (invaded) {
            invaded -= dt;
            if (invaded <= 0) gameOver('Invaded!', '👾', `They landed on wave ${wave}. Earth is now a very well-organised alien parking lot.`);
            return;
        }
        if (clearT) {
            clearT -= dt;
            if (clearT <= 0) { wave++; hud(); newWave(); }
            return;
        }
        if (deadT) {
            deadT -= dt;
            if (deadT <= 0) {
                deadT = 0;
                if (lives <= 0) {
                    gameOver('Game over', '💥', Curio.pick([`You held them off until wave ${wave}. The aliens send their regards.`, `Wave ${wave}. Your cannon has been retired with full honours.`, `${Curio.fmt(A.score)} points of pure defence on wave ${wave}.`]));
                    return;
                }
                player.x = W / 2;
            }
            else return;
        }
        const l = A.keys.has('ArrowLeft') || A.keys.has('a'), r = A.keys.has('ArrowRight') || A.keys.has('d');
        const nx = Math.max(24, Math.min(W - 24, player.x + (r - l) * 250 * dt));
        player.tilt += ((nx - player.x) / dt / 250 - player.tilt) * Math.min(1, dt * 12);
        player.x = nx;
        if (A.keys.has(' ') || A.keys.has('ArrowUp') || A.keys.has('w')) fire();
        if (boss && !boss.dead) updateBoss(dt);
        stepT -= dt;
        if (!boss && stepT <= 0 && freezeT <= 0) {
            stepT = stepInterval();
            frame ^= 1;
            const notes = [98, 87, 78, 73];
            A.beep(notes[marchI++ % 4], 0.07, 'square', 0.06);
            let minX = Infinity, maxX = -Infinity;
            for (const a of aliens) if (a.alive) { minX = Math.min(minX, ax(a)); maxX = Math.max(maxX, ax(a)); }
            const step = alive <= 3 ? 10 : 7;
            if ((dir > 0 && maxX + step + 16 > W - 8) || (dir < 0 && minX - step - 16 < 8)) { fy += 16; dir = -dir; }
            else fx0 += dir * step;
            for (const a of aliens) {
                if (!a.alive) continue;
                const x = ax(a), y = ay(a);
                for (let yy = y - 11; yy <= y + 11; yy += CELL)
                    for (let xx = x - 15; xx <= x + 15; xx += CELL) {
                        const h = shieldAt(xx, yy);
                        if (h) { h.s.cells[h.cy * SW + h.cx] = 0; h.s.dirty = true; }
                    }
                if (y + 11 >= PY - 10) {
                    invaded = 1.4;
                    A.noise(1, 0.25, 900);
                    A.sweep(300, 40, 1.2, 'sawtooth', 0.08);
                    flash = 0.5;
                    A.shake(16);
                    return;
                }
            }
        }
        for (let si = shots.length - 1; si >= 0; si--) {
            const shot = shots[si];
            const oy = shot.y;
            shot.y -= 640 * dt;
            shot.x += shot.vx * dt;
            let gone = shot.y < 40 || shot.x < 0 || shot.x > W, hit = false;
            if (!gone && traceShield(shot.x, oy, shot.y, false)) gone = true;
            if (!gone)
                for (const a of aliens) {
                    if (!a.alive) continue;
                    const x = ax(a), y = ay(a);
                    if (Math.abs(shot.x - x) < 15 && shot.y < y + 11 && oy > y - 11) {
                        gone = true; hit = true;
                        a.hp--;
                        if (a.hp <= 0) killAlien(a, x, y);
                        else { a.hit = 0.15; A.fx.burst(x, y, 8, ['#ffffff', '#ffb74d'], { speed: 120, life: 0.3, size: 3, gravity: 0 }); A.beep(900, 0.04, 'square', 0.05); }
                        break;
                    }
                }
            if (!gone && boss && !boss.dead && Math.abs(shot.x - boss.x) < 52 && shot.y < boss.y + 22 && oy > boss.y - 22) {
                gone = true; hit = true;
                boss.hp--;
                boss.hurt = 0.1;
                score(10 * mult());
                A.fx.burst(shot.x, shot.y, 6, ['#ffffff', '#ff5a36', '#ffd54f'], { speed: 140, life: 0.3, size: 3, gravity: 60 });
                A.beep(220 + (boss.max - boss.hp) * 6, 0.04, 'square', 0.05);
                A.shake(2);
                if (boss.hp <= 0) killBoss();
            }
            if (!gone && ufo && Math.abs(shot.x - ufo.x) < 22 && Math.abs(shot.y - ufo.y) < 12) {
                const v = Curio.pick([50, 100, 150, 150, 300]) * mult();
                score(v);
                ufos++;
                if (ufos >= 3) A.unlock('ufo3');
                A.fx.text(ufo.x, ufo.y, String(v), '#ff5a36', 18, 1);
                A.fx.burst(ufo.x, ufo.y, 34, ['#ff5a36', '#ffd54f', '#ffffff'], { speed: 240, life: 0.8, size: 4, gravity: 100 });
                A.fx.ring(ufo.x, ufo.y, '#ffd54f', 50, 0.5, 4);
                A.chord([880, 1100, 1320, 1760], 60, 0.07, 'square', 0.07);
                dropPow(ufo.x, ufo.y);
                ufo = null;
                gone = true; hit = true;
            }
            if (!gone)
                for (let i = bombs.length - 1; i >= 0; i--) {
                    const b = bombs[i];
                    if (Math.abs(b.x - shot.x) < 7 && Math.abs(b.y - shot.y) < 14) {
                        bombs.splice(i, 1);
                        bombsShot++;
                        if (bombsShot >= 10) A.unlock('bombs');
                        A.fx.burst(shot.x, shot.y, 10, ['#ffffff', '#ffd54f'], { speed: 130, life: 0.3, size: 3, gravity: 0 });
                        A.fx.ring(shot.x, shot.y, '#ffffff', 14, 0.25, 2);
                        gone = true;
                        break;
                    }
                }
            if (gone) {
                if (hit) hitStreak();
                else if (shot.main) combo = 0;
                shots.splice(si, 1);
            }
        }
        shotT -= dt;
        const maxBombs = Math.min(6, 2 + Math.floor(wave / 2));
        if (!boss && freezeT <= 0 && shotT <= 0 && bombs.length < maxBombs) {
            shotT = Math.max(0.28, 1.25 - wave * 0.08) * (0.5 + Math.random()) / d.rate;
            const cols = {};
            for (const a of aliens) if (a.alive && (!cols[a.c] || a.r > cols[a.c].r)) cols[a.c] = a;
            const list = Object.values(cols);
            if (list.length) {
                const near = list.slice().sort((p, q) => Math.abs(ax(p) - player.x) - Math.abs(ax(q) - player.x));
                const a = Math.random() < 0.4 ? near[0] : Curio.pick(list);
                bombs.push({ x: ax(a), y: ay(a) + 12, t: 0, kind: Math.random() < 0.5 ? 0 : 1, v: (190 + wave * 12 + Math.random() * 40) * d.bomb, vx: 0 });
            }
        }
        for (let i = bombs.length - 1; i >= 0; i--) {
            const b = bombs[i];
            if (freezeT > 0) continue;
            const oy = b.y;
            b.y += b.v * dt;
            b.x += (b.vx || 0) * dt;
            b.t += dt;
            if (b.y > H - 30 || b.x < -10 || b.x > W + 10) {
                A.fx.burst(b.x, H - 30, 5, ['#7ee081', '#ffffff'], { speed: 80, life: 0.3, size: 3, gravity: 0, angle: -Math.PI / 2, spread: 2 });
                bombs.splice(i, 1);
                continue;
            }
            if (traceShield(b.x, oy, b.y + 6, true)) { bombs.splice(i, 1); continue; }
            if (Math.abs(b.x - player.x) < (bubble ? 24 : 17) && b.y + 6 > PY - (bubble ? 18 : 8) && b.y - 6 < PY + 10) {
                bombs.splice(i, 1);
                killPlayer();
                if (deadT) return;
            }
        }
        for (let i = pows.length - 1; i >= 0; i--) {
            const p = pows[i];
            p.t += dt;
            p.y += 95 * dt;
            if (Math.abs(p.x - player.x) < 24 && p.y > PY - 18 && p.y < PY + 14) { collect(p); pows.splice(i, 1); }
            else if (p.y > H - 30) pows.splice(i, 1);
        }
        ufoT -= dt;
        if (!ufo && !boss && ufoT <= 0 && alive >= 8) {
            const dd = Math.random() < 0.5 ? 1 : -1;
            ufo = { x: dd > 0 ? -30 : W + 30, y: 72, d: dd, t: 0 };
            ufoT = 18 + Math.random() * 12;
        }
        if (ufo) {
            ufo.x += ufo.d * 105 * dt;
            ufo.t += dt;
            if (Math.floor(ufo.t * 8) !== Math.floor((ufo.t - dt) * 8)) A.beep(ufo.t * 8 % 2 < 1 ? 740 : 620, 0.1, 'sine', 0.03);
            if (ufo.x < -40 || ufo.x > W + 40) ufo = null;
        }
        for (const a of aliens) if (a.hit) a.hit = Math.max(0, a.hit - dt);
        if (alive === 0 && !clearT) waveClear();
    }
    function killBoss() {
        alive = 0;
        bossKills++;
        A.stat('bosses', 1);
        A.unlock('boss');
        if (bossKills >= 2) A.unlock('boss2');
        const bonus = 250 * wave;
        score(bonus);
        A.fx.text(boss.x, boss.y, `+${bonus}`, '#ffd54f', 26, 1.4);
        for (let i = 0; i < 5; i++) setTimeout(() => {
            if (A.state !== 'play') return;
            const x = boss ? boss.x : W / 2;
            A.fx.burst(x + (Math.random() - 0.5) * 90, 150 + (Math.random() - 0.5) * 40, 30, ['#ff5a36', '#ffd54f', '#ffffff', '#b388ff'], { speed: 260, life: 0.9, size: 5, gravity: 80 });
            A.fx.ring(x, 150, '#ffd54f', 60 + i * 20, 0.6, 5);
            A.noise(0.5, 0.2, 1800);
        }, i * 150);
        A.shake(18);
        A.buzz([80, 40, 80, 40, 160]);
        dropPow(boss.x, boss.y, 'life');
        boss.dead = true;
    }
    function waveClear() {
        clearT = 2.4;
        const bonus = 100 * wave;
        score(bonus);
        const acc = waveShots ? waveHits / waveShots : 0;
        banner = { text: `Wave ${wave} cleared!`, sub: `+${bonus} bonus${!lostThisWave ? ' · flawless' : ''}`, t: 0 };
        if (!lostThisWave) A.unlock('flawless');
        if (waveShots >= 10 && acc >= 0.8) A.unlock('bullseye');
        bombs = [];
        shots = [];
        ufo = null;
        Curio.confetti(70);
        A.chord([523, 659, 784, 1047], 90, 0.12, 'triangle', 0.1);
    }
    function gameOver(title, emoji, msg) {
        const acc = shotsN ? Math.round(100 * hitsN / shotsN) : 0;
        const dn = d.name;
        A.over({
            title, emoji, msg,
            lines: [[' wave', wave], [' aliens', kills], [' accuracy', acc + '%'], [' best combo', 'x' + (1 + Math.min(3, Math.floor(bestCombo / 6)))]],
            share: `👾 Zoble Invaders (${dn}): ${Curio.fmt(A.score)} pts, wave ${wave}\n🎯 ${acc}% accuracy · ${kills} aliens${bossKills ? ` · ${bossKills} mothership${bossKills > 1 ? 's' : ''}` : ''}${ufos ? ` · ${ufos} UFO` : ''}`
        });
    }
    function idle(dt) {
        A.fx.update(dt);
        for (const s of stars) { s.y += s.v * dt; if (s.y > H - 30) { s.y = 0; s.x = Math.random() * W; } }
        if (A.state === 'menu') {
            stepT -= dt;
            if (stepT <= 0) { stepT = 0.5; frame ^= 1; }
        }
    }
    function drawShield(g, s) {
        if (s.dirty || !s.canvas) {
            s.canvas = s.canvas || document.createElement('canvas');
            s.canvas.width = SW * 4;
            s.canvas.height = SH * 4;
            const c = s.canvas.getContext('2d');
            c.clearRect(0, 0, SW * 4, SH * 4);
            for (let y = 0; y < SH; y++)
                for (let x = 0; x < SW; x++)
                    if (s.cells[y * SW + x]) {
                        const top = y === 0 || !s.cells[(y - 1) * SW + x];
                        c.fillStyle = top ? '#b9f6ca' : (x + y) % 5 === 0 ? '#5fd068' : y > SH / 2 ? '#2e9e3e' : '#3bb54a';
                        c.fillRect(x * 4, y * 4, 4, 4);
                    }
            s.dirty = false;
        }
        g.drawImage(s.canvas, s.x, s.y, SW * CELL, SH * CELL);
    }
    function drawPow(g, p) {
        const P = POW[p.k];
        const bob = Math.sin(p.t * 6) * 2;
        g.save();
        g.translate(p.x, p.y + bob);
        g.shadowColor = P.c;
        g.shadowBlur = 14;
        g.fillStyle = 'rgba(10,12,40,.85)';
        rrect(g, -13, -11, 26, 22, 8);
        g.fill();
        g.lineWidth = 2;
        g.strokeStyle = P.c;
        g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = P.c;
        g.font = `900 14px ${FONT}`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(P.g, 0, 1);
        g.textBaseline = 'alphabetic';
        g.restore();
    }
    function drawBoss(g) {
        const b = boss;
        if (b.dead) return;
        const rage = b.hp < b.max / 2;
        const col = b.hurt > 0 ? '#ffffff' : rage ? '#ff5252' : '#ff7043';
        g.save();
        g.globalAlpha = 0.35;
        const beam = g.createLinearGradient(0, b.y, 0, b.y + 80);
        beam.addColorStop(0, rage ? 'rgba(255,82,82,.6)' : 'rgba(255,200,120,.5)');
        beam.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = beam;
        g.beginPath(); g.moveTo(b.x - 20, b.y + 18); g.lineTo(b.x + 20, b.y + 18); g.lineTo(b.x + 50, b.y + 90); g.lineTo(b.x - 50, b.y + 90); g.fill();
        g.restore();
        blit(g, 'boss', Math.floor(A.time * 4) % 2, col, b.x, b.y, 4.4);
        const pulse = 0.6 + 0.4 * Math.sin(A.time * 8);
        g.fillStyle = `rgba(255,235,59,${pulse})`;
        g.shadowColor = '#ffeb3b';
        g.shadowBlur = 16;
        g.beginPath(); g.arc(b.x, b.y - 4, 5, 0, Math.PI * 2); g.fill();
        g.shadowBlur = 0;
        for (let i = -3; i <= 3; i++) {
            g.fillStyle = (Math.floor(A.time * 6) + i) % 2 ? '#ffd54f' : '#4dd0e1';
            g.fillRect(b.x + i * 13 - 2, b.y + 6, 4, 3);
        }
        const bw = 220, bx = W / 2 - bw / 2, by = 46;
        g.fillStyle = 'rgba(0,0,0,.45)';
        rrect(g, bx - 2, by - 2, bw + 4, 12, 6); g.fill();
        const hg = g.createLinearGradient(bx, 0, bx + bw, 0);
        hg.addColorStop(0, '#ff5252'); hg.addColorStop(1, '#ffb74d');
        g.fillStyle = hg;
        rrect(g, bx, by, bw * Math.max(0, b.hp / b.max), 8, 4); g.fill();
        g.font = `800 11px ${FONT}`;
        g.fillStyle = '#fff';
        g.textAlign = 'center';
        g.fillText('MOTHERSHIP', W / 2, by - 6);
    }
    function draw(g) {
        if (!bgCache || bgDark !== A.dark) buildBg();
        g.drawImage(bgCache, 0, 0);
        for (const s of stars) {
            g.globalAlpha = 0.35 + 0.45 * Math.sin(A.time * 2 + s.tw);
            g.fillStyle = s.v > 18 ? '#cfe8ff' : '#ffffff';
            g.fillRect(s.x, s.y, s.r, s.r * (s.v > 18 ? 2.2 : 1));
        }
        g.globalAlpha = 1;
        if (flash) { g.fillStyle = `rgba(255,80,60,${flash * 0.5})`; g.fillRect(0, 0, W, H); }
        if (freezeT > 0) { g.fillStyle = `rgba(179,229,252,${Math.min(0.18, freezeT * 0.1)})`; g.fillRect(0, 0, W, H); }
        for (const s of shields) drawShield(g, s);
        for (const a of aliens) if (a.alive) {
            const c = a.hit > 0 ? '#ffffff' : freezeT > 0 ? '#b3e5fc' : a.hp === 1 && a.t.hp ? '#ff8a65' : a.t.color;
            blit(g, a.t.spr, frame, c, ax(a), ay(a));
        }
        if (boss) drawBoss(g);
        if (ufo) {
            g.fillStyle = 'rgba(255,90,54,.25)';
            g.beginPath(); g.ellipse(ufo.x, ufo.y + 12, 18, 4, 0, 0, Math.PI * 2); g.fill();
            blit(g, 'ship', 0, '#ff5a36', ufo.x, ufo.y, 3.2);
            g.fillStyle = Math.sin(ufo.t * 20) > 0 ? '#ffd54f' : '#ffffff';
            for (let i = -1; i <= 1; i++) g.fillRect(ufo.x + i * 10 - 1.5, ufo.y + 1, 3, 3);
        }
        for (const shot of shots) {
            const lg = g.createLinearGradient(0, shot.y - 10, 0, shot.y + 10);
            lg.addColorStop(0, '#ffffff'); lg.addColorStop(1, rapidT > 0 ? 'rgba(255,213,79,0)' : 'rgba(154,208,255,0)');
            g.fillStyle = lg;
            g.shadowColor = rapidT > 0 ? '#ffd54f' : '#9ad0ff';
            g.shadowBlur = 12;
            g.fillRect(shot.x - 1.5, shot.y - 8, 3, 18);
            g.shadowBlur = 0;
        }
        for (const b of bombs) {
            g.strokeStyle = b.kind ? '#ffd54f' : '#ff8a80';
            g.shadowColor = g.strokeStyle;
            g.shadowBlur = 8;
            g.lineWidth = 2.5;
            g.beginPath();
            for (let i = 0; i <= 4; i++) {
                const zz = ((i + Math.floor(b.t * 14)) % 2 ? 1 : -1) * (b.kind ? 3 : 2);
                const yy = b.y - 8 + i * 4;
                if (i === 0) g.moveTo(b.x + zz, yy);
                else g.lineTo(b.x + zz, yy);
            }
            g.stroke();
            g.shadowBlur = 0;
        }
        for (const p of pows) drawPow(g, p);
        if (!deadT || Math.sin(A.time * 30) > 0.6) {
            if (!deadT) {
                g.save();
                g.translate(player.x, PY);
                g.rotate(Math.max(-0.12, Math.min(0.12, player.tilt * 0.12)));
                g.fillStyle = 'rgba(126,224,129,.25)';
                g.beginPath(); g.ellipse(0, 12, 22, 3, 0, 0, Math.PI * 2); g.fill();
                blit(g, 'cannon', 0, spreadT > 0 ? '#4dd0e1' : rapidT > 0 ? '#ffd54f' : '#7ee081', 0, 0, 2.6);
                g.restore();
                if (bubble) {
                    g.strokeStyle = `rgba(126,224,129,${0.5 + 0.3 * Math.sin(A.time * 6)})`;
                    g.lineWidth = 2;
                    g.beginPath(); g.ellipse(player.x, PY - 2, 26, 20, 0, 0, Math.PI * 2); g.stroke();
                    g.fillStyle = 'rgba(126,224,129,.08)'; g.fill();
                }
            }
            else if (deadT > 0.9) blit(g, 'boom', 0, Math.sin(A.time * 40) > 0 ? '#7ee081' : '#ffd54f', player.x, PY, 3);
        }
        A.fx.draw(g);
        for (let i = 0; i < Math.min(lives - (deadT ? 0 : 1), 6); i++) blit(g, 'cannon', 0, '#7ee081', 24 + i * 34, H - 14, 1.8);
        g.textAlign = 'right';
        g.font = `800 12px ${FONT}`;
        g.fillStyle = 'rgba(255,255,255,.7)';
        g.fillText(boss ? 'boss wave' : `${alive} left`, W - 12, H - 10);
        let px = 12;
        g.textAlign = 'left';
        for (const [k, t, max] of [['rapid', rapidT, 9], ['spread', spreadT, 9], ['freeze', freezeT, 4]]) {
            if (t <= 0) continue;
            const P = POW[k];
            g.fillStyle = 'rgba(0,0,0,.4)';
            rrect(g, px, 12, 62, 20, 8); g.fill();
            g.fillStyle = P.c;
            rrect(g, px, 28, 62 * (t / max), 4, 2); g.fill();
            g.font = `800 12px ${FONT}`;
            g.fillText(`${P.g} ${Math.ceil(t)}s`, px + 8, 26);
            px += 70;
        }
        if (combo >= 6 && A.state === 'play') {
            g.textAlign = 'right';
            g.font = `900 15px ${FONT}`;
            g.fillStyle = '#ffd54f';
            g.fillText(`x${mult()} combo`, W - 12, 28);
        }
        g.textAlign = 'center';
        if (banner && A.state !== 'menu') {
            const a = Math.min(1, banner.t * 5, (2.2 - banner.t) * 3);
            g.globalAlpha = Math.max(0, a);
            const sc = 1 + Math.max(0, 0.3 - banner.t) * 1.5;
            g.save();
            g.translate(W / 2, H / 2 + 40);
            g.scale(sc, sc);
            g.font = `900 36px ${FONT}`;
            g.lineWidth = 6;
            g.strokeStyle = 'rgba(0,0,0,.4)';
            g.strokeText(banner.text, 0, 0);
            g.fillStyle = banner.warn ? (Math.sin(A.time * 12) > 0 ? '#ff5252' : '#ffffff') : '#ffffff';
            g.fillText(banner.text, 0, 0);
            if (banner.sub) {
                g.font = `800 17px ${FONT}`;
                g.fillStyle = '#ffd54f';
                g.fillText(banner.sub, 0, 28);
            }
            g.restore();
            g.globalAlpha = 1;
        }
    }
    A.debug = () => ({
        alive, wave, lives, fy, shots: shots.length, bombs: bombs.length, playerX: player.x, ufo: !!ufo, boss: boss ? boss.hp : null, pows: pows.length,
        shieldCells: shields.map((s) => s.cells.reduce((a, b) => a + b, 0)),
        killAll() { for (const a of aliens) a.alive = false; alive = 0; if (boss) { boss.hp = 0; killBoss(); } },
        loseAll() { lives = 1; bubble = false; killPlayer(); },
        toWave(n) { wave = n; newWave(); hud(); },
        give(k) { collect({ k }); },
        bomb() { bombs.push({ x: shields[0].x + 30, y: SHY - 20, t: 0, kind: 0, v: 200, vx: 0 }); }
    });
    reset();
    A.boot();
})();
