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
    const W = 400, BH = 22, K = 1.18, CX = 0.866 * K, CY = 0.5 * K, SIZE = 100, RANGE = 150, TOL = 4.5;
    const NOTES = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];
    let H = 700;
    const THEMES = [
        ['pastel', '🎨', 'Pastel', 0], ['candy', '🍬', 'Candy', 15], ['neon', '💡', 'Neon', 30], ['glass', '🧊', 'Glass', 50], ['gold', '👑', 'Gold', 75]
    ];
    const MODES = {
        classic: { name: 'Classic', tol: 4.5, grow: true, speed: 150, acc: 3.2, max: 300, lives: 1 },
        zen: { name: 'Zen', tol: 4.5, grow: true, speed: 120, acc: 2.2, max: 240, lives: 3 },
        hardcore: { name: 'Hardcore', tol: 2.6, grow: false, speed: 190, acc: 4, max: 360, lives: 1 }
    };
    const BADGES = [
        ['h10', '🧱', 'Foundation', 'Stack 10 blocks'],
        ['h25', '🏠', 'Townhouse', 'Stack 25 blocks'],
        ['h50', '🏢', 'Office block', 'Stack 50 blocks'],
        ['h75', '🚀', 'Edge of space', 'Stack 75 blocks'],
        ['h100', '🌌', 'Space elevator', 'Stack 100 blocks'],
        ['c5', '🎯', 'Steady hands', '5 perfect drops in a row'],
        ['c10', '🤖', 'Surgical', '10 perfect drops in a row'],
        ['c20', '💎', 'Flawless', '20 perfect drops in a row'],
        ['hard20', '🔥', 'Hardcore', 'Stack 20 in Hardcore'],
        ['zen40', '🧘', 'Inner peace', 'Stack 40 in Zen'],
        ['perf100', '✨', 'Perfectionist', '100 perfect drops in total'],
        ['blocks1k', '🏗️', 'Builder', 'Place 1,000 blocks in total'],
        ['theme', '🎨', 'Makeover', 'Unlock a new block theme']
    ];
    const CLOUDS = Array.from({ length: 14 }, (_, i) => ({ lvl: 6 + i * 4.3 + (i * 37 % 5), x: (i * 151) % 400, s: 0.6 + (i * 7 % 5) / 6, v: 6 + (i % 3) * 4 }));
    const STARS = Array.from({ length: 70 }, (_, i) => ({ x: (i * 197) % 400, y: (i * 89) % 980, r: (i % 3) * 0.5 + 0.6, tw: i }));
    let mode = 'classic', M = MODES.classic, lives = 1, theme = 'pastel', runBestCombo = 0, perfects = 0, sign = null, signLvl = 0;
    let blocks, cur, debris, rings, view, combo, baseHue, missT, zoom, best0, popups, speed, dir;
    const A = Arcade({
        width: W, height: H, size, reset, update, draw, key, pointer, idle, capture: [' ', 'Enter'], badges: BADGES,
        bestKey: () => (A.opt('mode') === 'classic' ? 'score' : 'score-' + A.opt('mode')),
        menuStats: () => [[' games', Curio.fmt(A.profile.games || 0)], [' blocks placed', Curio.fmt(A.stat('blocks'))], [' perfect drops', Curio.fmt(A.stat('perfects'))], [' tallest', A.stat('tallest') || '-']],
        menu: () => paintThemes()
    });
    theme = Curio.simple ? 'pastel' : Curio.store.get('stack-theme', 'pastel');
    function paintThemes() {
        const box = document.getElementById('themes');
        if (!box) return;
        box.innerHTML = '';
        const tall = A.stat('tallest');
        if (!THEMES.some((t) => t[0] === theme && tall >= t[3])) theme = 'pastel';
        for (const [id, em, name, need] of THEMES) {
            const b = document.createElement('button');
            b.type = 'button';
            const locked = tall < need;
            b.className = 'st-theme' + (locked ? ' locked' : '');
            b.setAttribute('aria-pressed', String(id === theme));
            b.disabled = locked;
            b.innerHTML = '<span></span><small></small>';
            b.firstChild.textContent = locked ? '🔒' : em;
            b.lastChild.textContent = locked ? `${need} high` : name;
            b.title = locked ? `Stack ${need} blocks to unlock ${name}` : `${name} blocks`;
            b.addEventListener('click', () => { theme = id; Curio.store.set('stack-theme', id); Curio.beep(660, 0.05, 'triangle', 0.07); paintThemes(); });
            box.append(b);
        }
    }
    function size(aw, ah) {
        H = Math.round(Math.max(520, Math.min(980, W * ah / aw)));
        return { w: W, h: H };
    }
    function reset() {
        mode = A.opt('mode') || 'classic';
        M = MODES[mode] || MODES.classic;
        lives = M.lives;
        runBestCombo = 0; perfects = 0; sign = null; signLvl = 0;
        baseHue = Math.floor(Math.random() * 360);
        blocks = [{ x: -SIZE / 2, z: -SIZE / 2, w: SIZE, d: SIZE, lvl: 0, hue: baseHue }];
        debris = [];
        rings = [];
        popups = [];
        combo = 0;
        missT = 0;
        zoom = 1;
        view = 0;
        speed = 150;
        A.fx.clear();
        spawn();
        A.hud('combo', 0);
    }
    const top = () => blocks[blocks.length - 1];
    const hueAt = (lvl) => (baseHue + lvl * 7) % 360;
    function spawn() {
        const t = top(), lvl = t.lvl + 1;
        const axis = lvl % 2 ? 'x' : 'z';
        cur = { x: t.x, z: t.z, w: t.w, d: t.d, lvl, hue: hueAt(lvl), axis };
        cur[axis] = (axis === 'x' ? t.x : t.z) - RANGE;
        dir = 1;
        speed = Math.min(M.max, M.speed + lvl * M.acc);
    }
    function key(k, down, repeat) {
        if (down && !repeat && (k === ' ' || k === 'Enter' || k === 'ArrowDown' || k === 's'))
            drop();
    }
    function pointer(type, p, e) {
        if (type === 'down' && (e.button === 0 || e.pointerType !== 'mouse'))
            drop();
    }
    function drop() {
        if (A.state !== 'play' || missT || !cur)
            return;
        const t = top(), ax = cur.axis, sz = ax === 'x' ? 'w' : 'd';
        const delta = cur[ax] - t[ax];
        const size = t[sz];
        if (Math.abs(delta) >= size) {
            debris.push({ ...cur, vy: 0, vx: 0, y: cur.lvl * BH, fall: 0 });
            cur = null;
            combo = 0;
            A.hud('combo', 0);
            A.shake(10);
            A.buzz([40, 40, 100]);
            A.sweep(300, 60, 0.6, 'sawtooth', 0.08);
            A.noise(0.4, 0.15, 700);
            lives--;
            if (lives > 0) {
                popups = [{ text: `Oops! ${lives} ${lives === 1 ? 'life' : 'lives'} left`, t: 0 }];
                setTimeout(() => { if (A.state === 'play' && !cur && !missT) spawn(); }, 700);
                return;
            }
            missT = 1.6;
            return;
        }
        const placed = { x: cur.x, z: cur.z, w: cur.w, d: cur.d, lvl: cur.lvl, hue: cur.hue };
        A.stat('blocks', 1);
        if (A.stat('blocks') >= 1000) A.unlock('blocks1k');
        if (Math.abs(delta) <= M.tol) {
            placed[ax] = t[ax];
            combo++;
            perfects++;
            runBestCombo = Math.max(runBestCombo, combo);
            A.stat('perfects', 1);
            if (A.stat('perfects') >= 100) A.unlock('perf100');
            if (combo >= 5) A.unlock('c5');
            if (combo >= 10) A.unlock('c10');
            if (combo >= 20) A.unlock('c20');
            A.buzz(15);
            {
                const c = proj(placed.x + placed.w / 2, placed.z + placed.d / 2, placed.lvl * BH);
                A.fx.burst(c[0], c[1], combo >= 3 ? 22 : 12, ['#ffffff', `hsl(${placed.hue},90%,75%)`, '#fff59d'], { speed: 180, life: 0.6, size: 3, gravity: 120, round: true });
            }
            const grow = combo >= 3 && M.grow ? Math.min(8, SIZE - placed[sz]) : 0;
            if (grow > 0) {
                placed[sz] += grow;
                placed[ax] -= grow / 2;
            }
            rings.push({ b: { ...placed }, t: 0, big: combo >= 3 });
            const n = NOTES[Math.min(combo - 1, NOTES.length - 1)];
            A.beep(n, 0.16, 'triangle', 0.11);
            if (combo >= 3)
                setTimeout(() => A.beep(n * 1.5, 0.12, 'sine', 0.07), 70);
            popups = [{ text: combo >= 3 ? `Perfect x${combo}` : 'Perfect!', t: 0 }];
            if (combo === 5 || combo === 10 || combo === 20)
                Curio.toast(combo === 5 ? 'Five perfect in a row!' : combo === 10 ? 'Ten! Are you a robot?' : 'Twenty! Absolutely surgical.');
        }
        else {
            combo = 0;
            const keep = size - Math.abs(delta);
            const piece = { x: cur.x, z: cur.z, w: cur.w, d: cur.d, lvl: cur.lvl, hue: cur.hue, y: cur.lvl * BH, vy: 0, fall: 0 };
            if (delta > 0) {
                placed[ax] = cur[ax];
                placed[sz] = keep;
                piece[ax] = t[ax] + size;
                piece[sz] = delta;
                piece.v = 1;
            }
            else {
                placed[ax] = t[ax];
                placed[sz] = keep;
                piece[ax] = cur[ax];
                piece[sz] = -delta;
                piece.v = -1;
            }
            piece.ax = ax;
            debris.push(piece);
            A.shake(2);
            A.beep(220 + Math.min(cur.lvl, 40) * 6, 0.09, 'square', 0.07);
            A.noise(0.12, 0.08, 1800);
        }
        blocks.push(placed);
        A.setScore(placed.lvl);
        const L = placed.lvl;
        for (const [n, id] of [[10, 'h10'], [25, 'h25'], [50, 'h50'], [75, 'h75'], [100, 'h100']]) if (L >= n) A.unlock(id);
        if (mode === 'hardcore' && L >= 20) A.unlock('hard20');
        if (mode === 'zen' && L >= 40) A.unlock('zen40');
        const prevTall = A.stat('tallest');
        if (A.statMax('tallest', L)) {
            const th = THEMES.find((t) => t[3] === L && t[3] > prevTall && t[3] > 0);
            if (th) { Curio.toast(`${th[1]} ${th[2]} blocks unlocked!`); A.unlock('theme'); }
        }
        const zones = [[12, 'Above the rooftops'], [30, 'Into the clouds'], [50, 'Jet stream'], [75, 'Edge of space'], [100, 'Orbit!']];
        for (const [n, txt] of zones) if (L === n && signLvl < n) { signLvl = n; sign = { text: txt, t: 0 }; A.chord([523, 659, 784, 1047], 80, 0.1, 'triangle', 0.08); }
        A.hud('combo', combo);
        spawn();
    }
    function step(dt) {
        A.fx.update(dt);
        for (const c of CLOUDS) { c.x += c.v * dt; if (c.x > W + 80) c.x = -80; }
        if (sign) { sign.t += dt; if (sign.t > 2.2) sign = null; }
        for (let i = debris.length - 1; i >= 0; i--) {
            const p = debris[i];
            p.vy += 1400 * dt;
            p.y -= p.vy * dt;
            p.fall += dt;
            if (p.ax)
                p[p.ax] += p.v * 40 * dt;
            if (p.fall > 2.5)
                debris.splice(i, 1);
        }
        for (let i = rings.length - 1; i >= 0; i--) {
            rings[i].t += dt;
            if (rings[i].t > 0.6)
                rings.splice(i, 1);
        }
        for (let i = popups.length - 1; i >= 0; i--) {
            popups[i].t += dt;
            if (popups[i].t > 1)
                popups.splice(i, 1);
        }
        const target = top().lvl * BH;
        view += (target - view) * Math.min(1, dt * 6);
    }
    function moveCur(dt) {
        if (!cur)
            return;
        const ax = cur.axis, t = top(), base = t[ax];
        cur[ax] += dir * speed * dt;
        if (cur[ax] > base + RANGE) {
            cur[ax] = base + RANGE;
            dir = -1;
        }
        if (cur[ax] < base - RANGE) {
            cur[ax] = base - RANGE;
            dir = 1;
        }
    }
    const zoomWant = () => Math.min(1, (H * 0.62) / (top().lvl * BH + 240));
    function update(dt) {
        step(dt);
        if (missT) {
            missT -= dt;
            zoom += (zoomWant() - zoom) * Math.min(1, dt * 3);
            if (missT <= 0) {
                missT = 0;
                const n = top().lvl;
                const lines = [[' high', n], [' perfect', perfects], [' best streak', runBestCombo], [' mode', M.name]];
                const share = `🏗️ Zoble Stack (${M.name}): ${n} blocks high\n🎯 ${perfects} perfect drops · best streak ${runBestCombo}`;
                const msg = n >= 50 ? 'A genuine skyscraper. Architects are taking notes.' : n >= 25 ? 'A respectable tower. The pigeons approve.' : n >= 10 ? 'Not bad! The foundations are solid, the rest is vibes.' : 'More of a stack than a tower. Try tapping right as it lines up.';
                A.over({ title: n >= 25 ? 'What a tower!' : 'Timber!', emoji: n >= 25 ? '🏙️' : '🧱', msg: `${n} block${n === 1 ? '' : 's'} high. ${msg}`, lines, share });
            }
            return;
        }
        moveCur(dt);
    }
    function idle(dt) {
        if (A.state === 'menu') {
            step(dt);
            moveCur(dt);
        }
        else
            A.fx.update(dt);
    }
    function proj(x, z, y) {
        return [W / 2 + (x - z) * CX, H * 0.52 + (x + z) * CY - (y - view)];
    }
    function face(g, pts, color) {
        g.fillStyle = color;
        g.beginPath();
        g.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++)
            g.lineTo(pts[i][0], pts[i][1]);
        g.closePath();
        g.fill();
    }
    function edge(g, pts, color, w = 1.5) {
        g.strokeStyle = color;
        g.lineWidth = w;
        g.beginPath();
        g.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
        g.closePath();
        g.stroke();
    }
    function drawBlock(g, b, y, h, alpha = 1) {
        const x0 = b.x, x1 = b.x + b.w, z0 = b.z, z1 = b.z + b.d, yt = y, yb = y - h;
        const dark = A.dark;
        g.globalAlpha = alpha;
        const L = dark ? 0.85 : 1;
        const fl = [proj(x0, z1, yt), proj(x1, z1, yt), proj(x1, z1, yb), proj(x0, z1, yb)];
        const fr = [proj(x1, z0, yt), proj(x1, z1, yt), proj(x1, z1, yb), proj(x1, z0, yb)];
        const tp = [proj(x0, z0, yt), proj(x1, z0, yt), proj(x1, z1, yt), proj(x0, z1, yt)];
        let c1, c2, c3, ln = null;
        if (theme === 'candy') {
            const odd = b.lvl % 2;
            const hh = odd ? 340 : 190;
            c1 = odd ? `hsl(${hh},80%,${70 * L}%)` : `hsl(0,0%,${96 * L}%)`;
            c2 = odd ? `hsl(${hh},70%,${60 * L}%)` : `hsl(0,0%,${84 * L}%)`;
            c3 = odd ? `hsl(${hh},90%,${80 * L}%)` : `hsl(0,0%,${100 * L}%)`;
        }
        else if (theme === 'neon') {
            c1 = `hsl(${b.hue},60%,10%)`; c2 = `hsl(${b.hue},60%,7%)`; c3 = `hsl(${b.hue},60%,15%)`; ln = `hsl(${b.hue},100%,62%)`;
        }
        else if (theme === 'glass') {
            g.globalAlpha = alpha * 0.62;
            c1 = `hsl(${b.hue},70%,${72 * L}%)`; c2 = `hsl(${b.hue},65%,${62 * L}%)`; c3 = `hsl(${b.hue},80%,${86 * L}%)`; ln = 'rgba(255,255,255,.9)';
        }
        else if (theme === 'gold') {
            const k = (b.lvl % 3) * 3;
            c1 = `hsl(${42 + k},85%,${50 * L}%)`; c2 = `hsl(${36 + k},80%,${38 * L}%)`; c3 = `hsl(${48 + k},95%,${68 * L}%)`;
        }
        else {
            c1 = `hsl(${b.hue},58%,${50 * L}%)`; c2 = `hsl(${b.hue},55%,${40 * L}%)`; c3 = `hsl(${b.hue},68%,${66 * L}%)`;
        }
        face(g, fl, c1);
        face(g, fr, c2);
        face(g, tp, c3);
        if (theme === 'gold' || theme === 'pastel' || theme === 'candy') {
            g.globalAlpha = alpha * 0.22;
            face(g, [tp[0], tp[1], [(tp[1][0] + tp[2][0]) / 2, (tp[1][1] + tp[2][1]) / 2], [(tp[0][0] + tp[3][0]) / 2, (tp[0][1] + tp[3][1]) / 2]], '#ffffff');
            g.globalAlpha = alpha;
        }
        if (ln) {
            g.globalAlpha = alpha;
            if (theme === 'neon') { g.shadowColor = ln; g.shadowBlur = 8; }
            edge(g, fl, ln); edge(g, fr, ln); edge(g, tp, ln);
            g.shadowBlur = 0;
        }
        else if (h < 100) {
            g.globalAlpha = alpha * 0.25;
            g.strokeStyle = '#ffffff';
            g.lineWidth = 1;
            g.beginPath(); g.moveTo(tp[3][0], tp[3][1]); g.lineTo(tp[2][0], tp[2][1]); g.lineTo(tp[1][0], tp[1][1]); g.stroke();
        }
        g.globalAlpha = 1;
    }
    function draw(g) {
        const dark = A.dark;
        const h = hueAt(cur ? cur.lvl : top().lvl);
        const bg = g.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, `hsl(${(h + 40) % 360},${dark ? 30 : 55}%,${dark ? 16 : 86}%)`);
        bg.addColorStop(1, `hsl(${(h + 10) % 360},${dark ? 35 : 60}%,${dark ? 8 : 72}%)`);
        g.fillStyle = bg;
        g.fillRect(0, 0, W, H);
        const alt = view / BH;
        const space = Math.max(0, Math.min(1, (alt - 45) / 40));
        if (space > 0) {
            g.globalAlpha = space;
            const sg = g.createLinearGradient(0, 0, 0, H);
            sg.addColorStop(0, '#05061a'); sg.addColorStop(1, '#1b1446');
            g.fillStyle = sg;
            g.fillRect(0, 0, W, H);
            for (const st of STARS) { g.globalAlpha = space * (0.4 + 0.5 * Math.sin(A.time * 2 + st.tw)); g.fillStyle = '#fff'; g.fillRect(st.x, st.y % H, st.r, st.r); }
            g.globalAlpha = space;
            const py = H * 0.3 + (alt - 95) * 3;
            if (py > -80 && py < H + 80) {
                const pg = g.createRadialGradient(300, py - 10, 4, 310, py, 46);
                pg.addColorStop(0, '#ffcc80'); pg.addColorStop(1, '#d84315');
                g.fillStyle = pg; g.beginPath(); g.arc(310, py, 40, 0, 7); g.fill();
                g.strokeStyle = 'rgba(255,224,178,.6)'; g.lineWidth = 3; g.beginPath(); g.ellipse(310, py, 64, 12, -0.3, 0, 7); g.stroke();
            }
            g.globalAlpha = 1;
        }
        if (dark || space > 0.5) {
            for (const st of STARS.slice(0, 30)) { g.globalAlpha = (dark ? 0.35 : 0) * (1 - space); g.fillStyle = '#fff'; g.fillRect(st.x, st.y % H, st.r, st.r); }
            g.globalAlpha = 1;
        }
        for (const c of CLOUDS) {
            const cy = H * 0.52 - (c.lvl * BH - view) * 0.55;
            if (cy < -60 || cy > H + 60) continue;
            g.globalAlpha = (dark ? 0.14 : 0.75) * (1 - space * 0.8);
            g.fillStyle = '#ffffff';
            for (const [ox, oy, rx, ry] of [[0, 0, 46, 15], [22, -9, 26, 15], [-20, -5, 20, 11]]) { g.beginPath(); g.ellipse(c.x + ox * c.s, cy + oy * c.s, rx * c.s, ry * c.s, 0, 0, 7); g.fill(); }
            g.globalAlpha = 1;
        }
        const gy = H * 0.52 + view + 60;
        if (gy < H + 40) {
            g.fillStyle = dark ? 'rgba(40,60,40,.6)' : 'rgba(110,170,90,.55)';
            g.beginPath(); g.ellipse(W / 2, gy + 60, W * 0.9, 90, 0, 0, 7); g.fill();
            for (let i = 0; i < 7; i++) {
                const bx = 20 + i * 58, bh = 30 + (i * 23) % 50;
                g.fillStyle = dark ? 'rgba(20,24,40,.55)' : 'rgba(255,255,255,.35)';
                g.fillRect(bx, gy + 20 - bh, 30, bh + 40);
            }
        }
        g.save();
        if (zoom < 0.999) {
            const n = top().lvl, want = zoomWant();
            const c = H * 0.52 + (view - n * BH / 2) + 40;
            const f = want < 0.999 ? Math.min(1, (1 - zoom) / (1 - want)) : 0;
            g.translate(W / 2, c + f * (H * 0.5 - c));
            g.scale(zoom, zoom);
            g.translate(-W / 2, -c);
        }
        const t = top();
        const pivot = t.x + t.w / 2 + t.z + t.d / 2;
        const behind = [], front = [];
        for (const d of debris)
            (d.x + d.w / 2 + d.z + d.d / 2 < pivot ? behind : front).push(d);
        for (const d of behind)
            drawBlock(g, d, d.y, BH, Math.max(0, 1 - d.fall / 2.2));
        const vis = zoom < 0.999 ? 0 : Math.max(0, blocks.length - Math.ceil(H / BH) - 4);
        for (let i = vis; i < blocks.length; i++) {
            const b = blocks[i];
            if (b.lvl === 0)
                drawBlock(g, b, 0, H * 3);
            else
                drawBlock(g, b, b.lvl * BH, BH);
        }
        for (const r of rings) {
            const b = r.b, e = 4 + r.t * (r.big ? 40 : 24);
            const p = [proj(b.x - e, b.z - e, b.lvl * BH), proj(b.x + b.w + e, b.z - e, b.lvl * BH), proj(b.x + b.w + e, b.z + b.d + e, b.lvl * BH), proj(b.x - e, b.z + b.d + e, b.lvl * BH)];
            g.strokeStyle = `rgba(255,255,255,${(1 - r.t / 0.6) * 0.9})`;
            g.lineWidth = 3;
            g.beginPath();
            p.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
            g.closePath();
            g.stroke();
        }
        if (cur)
            drawBlock(g, cur, cur.lvl * BH, BH);
        for (const d of front)
            drawBlock(g, d, d.y, BH, Math.max(0, 1 - d.fall / 2.2));
        g.restore();
        A.fx.draw(g);
        g.textAlign = 'center';
        if (A.state !== 'menu') {
            g.font = `900 64px ${FONT}`;
            g.fillStyle = dark ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.95)';
            g.shadowColor = 'rgba(0,0,0,.18)';
            g.shadowBlur = 12;
            g.fillText(String(top().lvl), W / 2, 92);
            g.shadowBlur = 0;
        }
        for (const p of popups) {
            g.globalAlpha = Math.max(0, 1 - p.t);
            g.font = `900 22px ${FONT}`;
            g.fillStyle = '#ffffff';
            g.strokeStyle = 'rgba(0,0,0,.2)';
            g.lineWidth = 4;
            g.strokeText(p.text, W / 2, 132 - p.t * 20);
            g.fillText(p.text, W / 2, 132 - p.t * 20);
        }
        g.globalAlpha = 1;
        if (A.state === 'play' && M.lives > 1) {
            g.font = `800 16px ${FONT}`;
            g.textAlign = 'left';
            g.fillText('❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, M.lives - lives)), 12, 28);
            g.textAlign = 'center';
        }
        if (sign && A.state === 'play') {
            const a = Math.min(1, sign.t * 4, (2.2 - sign.t) * 3);
            g.globalAlpha = Math.max(0, a);
            g.font = `900 20px ${FONT}`;
            g.fillStyle = '#ffffff';
            g.strokeStyle = 'rgba(0,0,0,.25)';
            g.lineWidth = 5;
            g.strokeText(sign.text, W / 2, 168);
            g.fillText(sign.text, W / 2, 168);
            g.globalAlpha = 1;
        }
        if (A.state === 'play' && top().lvl === 0 && !missT) {
            g.font = `800 17px ${FONT}`;
            g.fillStyle = dark ? 'rgba(255,255,255,.8)' : 'rgba(40,30,20,.7)';
            g.fillText('tap, click or press space to drop', W / 2, H - 40 + Math.sin(A.time * 4) * 3);
        }
    }
    A.debug = () => ({
        level: top().lvl, combo, top: { ...top() }, cur: cur && { ...cur }, missT, debris: debris.length,
        perfect() { if (!cur) return; cur[cur.axis] = top()[cur.axis]; drop(); },
        to(n) { for (let i = 0; i < n; i++) { if (!cur) spawn(); cur[cur.axis] = top()[cur.axis]; drop(); } },
        off(d) { if (!cur) return; cur[cur.axis] = top()[cur.axis] + d; drop(); }
    });
    reset();
    A.boot();
})();
