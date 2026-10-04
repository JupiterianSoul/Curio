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
    A.showBest = () => {
        const b = Curio.getBest(A.bestKey) ?? 0;
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
        let v = Curio.store.get(`${slug}-opt-${name}`, seg.dataset.def || btns[0]?.dataset.val);
        if (!btns.some((b) => b.dataset.val === v)) v = btns[0]?.dataset.val;
        opts[name] = v;
        const paint = () => btns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.val === opts[name])));
        paint();
        btns.forEach((b) => b.addEventListener('click', () => {
            if (b.disabled) return;
            opts[name] = b.dataset.val;
            Curio.store.set(`${slug}-opt-${name}`, opts[name]);
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
    A.menu = () => { releaseAll(); A.state = 'menu'; o.menu?.(); show('menu'); if (o.bestKey) A.bestKey = o.bestKey(); A.showBest(); renderMenuStats(); renderBadges(); };
    A.over = ({ title = 'Game over', emoji = '💥', msg = '', lines = [], share = '', higherIsBetter = true, value } = {}) => {
        if (A.state === 'over') return;
        releaseAll();
        A.state = 'over';
        prof.games = (prof.games || 0) + 1;
        A.save();
        const val = value ?? A.score;
        const r = Curio.best(A.bestKey, val, higherIsBetter);
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
    $$('[data-act]').forEach((b) => b.addEventListener('click', (e) => {
        const a = b.dataset.act;
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
    const C = 10, ROWS = 56;
    const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
    const LEFT = { up: 'left', left: 'down', down: 'right', right: 'up' };
    const RIGHT = { up: 'right', right: 'down', down: 'left', left: 'up' };
    const COLORS = [
        { core: '#bff8ff', glow: '#22d8ff', name: 'You' },
        { core: '#ffe0b8', glow: '#ff9f1c', name: 'Amber' },
        { core: '#ffc9ec', glow: '#ff3cac', name: 'Rose' },
        { core: '#e2ffc4', glow: '#8cff3a', name: 'Lime' }
    ];
    const SKINS = [['cyan', '#bff8ff', '#22d8ff', 0, 'Cyan'], ['violet', '#ecdcff', '#a855f7', 3, 'Violet'], ['gold', '#fff3c4', '#ffc400', 10, 'Gold'], ['white', '#ffffff', '#9fb3c8', 25, 'Ghost']];
    const ARENAS = ['Open Grid', 'Pillars', 'The Cross', 'Four Boxes', 'Zigzag'];
    const BADGES = [
        ['win1', '🏁', 'First victory', 'Win a round'],
        ['win3', '🔥', 'Hat trick', 'Win 3 rounds in one game'],
        ['r5', '🌀', 'Survivor', 'Reach round 5'],
        ['r10', '🏆', 'Grid champion', 'Reach round 10'],
        ['three', '👑', 'Outnumbered', 'Win a round against 3 rivals'],
        ['cut', '✂️', 'Cut off', 'Make a rival crash into your trail'],
        ['double', '⚡', 'Double derez', 'Two rivals crash on the same tick'],
        ['flawless', '💎', 'Flawless', 'Win 3 rounds without losing a life'],
        ['orbs', '🔮', 'Energy collector', 'Collect 50 energy orbs in total'],
        ['boost', '🚀', 'Afterburner', 'Boost for 40 cells in one round'],
        ['arenas', '🗺️', 'World tour', 'Win on all five arenas'],
        ['skin', '🎨', 'Paint job', 'Unlock a new bike colour']
    ];
    const oldRivals = Curio.store.get('lc:rivals', null);
    if (oldRivals != null && Curio.store.get('light-cycles-opt-rivals', null) == null) Curio.store.set('light-cycles-opt-rivals', String(oldRivals));
    let skin = Curio.store.get('lc:skin', 'cyan'), boost = 100, boostCells = 0, orbs = [], arena = 0, livesLostRun = 0, winsNoLoss = 0, orbsRun = 0, cutoffs = 0, pulse = 0;
    let cols = 80, rivals = 2;
    let wins = 0, grid, bikes, round, lives, phase, phaseT, tickT, tickDur, queue, seen, stamp, msg, cellsMoved;
    const A = Arcade({
        width: 800, height: ROWS * C, reset, update, draw, key, swipe, idle, swipeDist: 20, menu: () => { newRound(true); paintSkins(); },
        capture: ['w', 'a', 's', 'd'],
        size: () => ({ w: cols * C, h: ROWS * C }), badges: BADGES, touchTip: 'Tip: on a laptop, turn with the arrow keys and boost with Space. Touchpad mode in the top bar lets you swipe by gliding.',
        bestKey: () => 'score-' + A.opt('rivals'),
        option: (n, v) => { if (n === 'rivals') rivals = +v; },
        menuStats: () => [[' games', Curio.fmt(A.profile.games || 0)], [' rounds won', Curio.fmt(A.stat('wins'))], [' orbs', Curio.fmt(A.stat('orbs'))], [' best round', A.stat('round') || '-']]
    });
    rivals = +A.opt('rivals') || 2;
    A.bestKey = 'score-' + rivals;
    function paintSkins() {
        const box = document.getElementById('skins');
        if (!box) return;
        box.innerHTML = '';
        const w = A.stat('wins');
        if (!SKINS.some((k) => k[0] === skin && w >= k[3])) skin = 'cyan';
        for (const [id, core, glow, need, name] of SKINS) {
            const b = document.createElement('button');
            b.type = 'button';
            const locked = w < need;
            b.className = 'lc-skin';
            b.disabled = locked;
            b.setAttribute('aria-pressed', String(id === skin));
            b.style.setProperty('--g', glow);
            b.innerHTML = '<i></i><small></small>';
            b.lastChild.textContent = locked ? `🔒 ${need} wins` : name;
            b.title = locked ? `Win ${need} rounds to unlock ${name}` : `${name} bike`;
            b.addEventListener('click', () => { skin = id; Curio.store.set('lc:skin', id); Curio.beep(700, 0.05, 'triangle', 0.07); paintSkins(); });
            box.append(b);
        }
    }
    const myCol = () => { const k = SKINS.find((x) => x[0] === skin) || SKINS[0]; return { core: k[1], glow: k[2], name: 'You' }; };
    function pickCols() {
        const r = A.stage.getBoundingClientRect();
        const asp = r.width > 50 && r.height > 50 ? r.width / r.height : 1.4;
        const n = Math.max(32, Math.min(100, Math.round(ROWS * asp)));
        if (n !== cols) {
            cols = n;
            dispatchEvent(new Event('resize'));
        }
    }
    const idx = (x, y) => y * cols + x;
    const free = (x, y) => x >= 0 && y >= 0 && x < cols && y < ROWS && !grid[idx(x, y)];
    function reset() {
        rivals = +A.opt('rivals') || 2;
        livesLostRun = 0; winsNoLoss = 0; orbsRun = 0; cutoffs = 0;
        round = 0;
        wins = 0;
        lives = 3;
        cellsMoved = 0;
        A.fx.clear();
        newRound();
    }
    function hud() {
        A.hud('round', round);
        A.hud('lives', lives > 0 ? '♥'.repeat(lives) : '0');
    }
    function spawnSpots() {
        const cx = Math.floor(cols / 2), cy = Math.floor(ROWS / 2);
        return [
            { x: cx - 4, y: ROWS - 6, dir: 'up' },
            { x: cx + 4, y: 5, dir: 'down' },
            { x: 5, y: cy, dir: 'right' },
            { x: cols - 6, y: cy, dir: 'left' }
        ];
    }
    function newRound(demo) {
        pickCols();
        round += demo ? 0 : 1;
        grid = new Int8Array(cols * ROWS);
        seen = new Int32Array(cols * ROWS);
        stamp = 1;
        const spots = spawnSpots();
        const n = demo ? 4 : rivals + 1;
        arena = demo ? 0 : A.opt('arena') === 'open' ? 0 : (round - 1) % ARENAS.length;
        buildArena(arena, spots);
        boost = 100; boostCells = 0;
        orbs = [];
        if (!demo) for (let i = 0; i < 3; i++) placeOrb();
        bikes = [];
        for (let i = 0; i < n; i++) {
            const s = spots[i];
            bikes.push({
                id: i, x: s.x, y: s.y, px: s.x, py: s.y, dir: s.dir, alive: true, ai: demo || i > 0,
                trail: [[s.x, s.y]], lastDir: s.dir, fade: 1, cool: 0, col: i === 0 && !demo ? myCol() : COLORS[i], cells: [idx(s.x, s.y)],
                aggr: Math.min(1, 0.35 + round * 0.08 + Math.random() * 0.2), mistake: Math.max(0.002, 0.03 - round * 0.004)
            });
            grid[idx(s.x, s.y)] = i + 1;
        }
        queue = [];
        tickDur = 1 / Math.min(22, 13 + round * 0.8);
        tickT = 0;
        phase = demo ? 'run' : 'count';
        phaseT = demo ? 0 : 2.4;
        msg = '';
        if (!demo) hud();
    }
    function buildArena(kind, spots) {
        const wall = (x, y) => { if (x > 0 && y > 0 && x < cols - 1 && y < ROWS - 1) grid[idx(x, y)] = 9; };
        const cx = Math.floor(cols / 2), cy = Math.floor(ROWS / 2);
        if (kind === 1) {
            for (let x = 10; x < cols - 8; x += 12) for (let y = 10; y < ROWS - 8; y += 12) for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) wall(x + a, y + b);
        }
        else if (kind === 2) {
            for (let x = cx - 16; x <= cx + 16; x++) if (Math.abs(x - cx) > 3) wall(x, cy);
            for (let y = cy - 14; y <= cy + 14; y++) if (Math.abs(y - cy) > 3) wall(cx, y);
        }
        else if (kind === 3) {
            const bw = Math.floor(cols * 0.18), bh = 9;
            for (const [qx, qy] of [[0.25, 0.27], [0.75, 0.27], [0.25, 0.73], [0.75, 0.73]]) {
                const x0 = Math.floor(cols * qx - bw / 2), y0 = Math.floor(ROWS * qy - bh / 2);
                for (let x = x0; x <= x0 + bw; x++) { if (Math.abs(x - (x0 + bw / 2)) > 2) { wall(x, y0); wall(x, y0 + bh); } }
                for (let y = y0; y <= y0 + bh; y++) { wall(x0, y); wall(x0 + bw, y); }
            }
        }
        else if (kind === 4) {
            for (let i = 0; i < 4; i++) {
                const y = 11 + i * 11, x0 = i % 2 ? 6 : Math.floor(cols * 0.3), x1 = i % 2 ? Math.floor(cols * 0.7) : cols - 6;
                for (let x = x0; x < x1; x++) wall(x, y);
            }
        }
        for (const s of spots) {
            const [dx, dy] = DIRS[s.dir];
            for (let k = -2; k <= 10; k++) for (let w = -2; w <= 2; w++) {
                const x = s.x + dx * k + (dy ? w : 0), y = s.y + dy * k + (dx ? w : 0);
                if (x >= 0 && y >= 0 && x < cols && y < ROWS && grid[idx(x, y)] === 9) grid[idx(x, y)] = 0;
            }
        }
    }
    function placeOrb() {
        for (let t = 0; t < 60; t++) {
            const x = 3 + Math.floor(Math.random() * (cols - 6)), y = 3 + Math.floor(Math.random() * (ROWS - 6));
            if (free(x, y) && !orbs.some((o) => o.x === x && o.y === y)) { orbs.push({ x, y, t: Math.random() * 6 }); return; }
        }
    }
    function stepMe(b) {
        const [dx, dy] = DIRS[b.dir];
        const nx = b.x + dx, ny = b.y + dy;
        if (!free(nx, ny)) { crash(b, false); return; }
        if (b.lastDir !== b.dir) b.trail.push([b.x, b.y]);
        b.lastDir = b.dir;
        b.px = b.x; b.py = b.y;
        b.x = nx; b.y = ny;
        const k = idx(nx, ny);
        grid[k] = 1;
        b.cells.push(k);
        cellsMoved++;
        if (cellsMoved % 10 === 0) A.addScore(1);
        eatOrb(b);
    }
    function eatOrb(b) {
        const i = orbs.findIndex((o) => o.x === b.x && o.y === b.y);
        if (i < 0) return;
        orbs.splice(i, 1);
        boost = Math.min(100, boost + 45);
        orbsRun++;
        A.stat('orbs', 1);
        if (A.stat('orbs') >= 50) A.unlock('orbs');
        A.addScore(25);
        A.fx.ring((b.x + 0.5) * C, (b.y + 0.5) * C, '#ffe066', 40, 0.45, 3);
        A.fx.text((b.x + 0.5) * C, (b.y + 0.5) * C - 14, '+25 ⚡', '#ffe066', 14, 0.8);
        A.chord([880, 1320], 50, 0.06, 'triangle', 0.06);
        placeOrb();
    }
    function key(k, down) {
        if (!down) return;
        if (k === ' ' || k === 'Shift') return;
        const m = { ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right' }[k];
        if (m) turn(m);
    }
    function swipe(dir) { turn(dir); }
    function turn(d) {
        const me = bikes[0];
        if (!me || !me.alive) return;
        const last = queue.length ? queue[queue.length - 1] : me.dir;
        if (d === last || d === OPP[last] || queue.length >= 3) return;
        queue.push(d);
        A.beep(660, 0.03, 'square', 0.03);
    }
    function space(x, y, cap) {
        if (!free(x, y)) return 0;
        stamp++;
        const q = [idx(x, y)];
        seen[q[0]] = stamp;
        let h = 0;
        while (h < q.length && q.length < cap) {
            const c = q[h++];
            const cx = c % cols, cy = (c - cx) / cols;
            const nb = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
            for (const [nx, ny] of nb) {
                if (nx < 0 || ny < 0 || nx >= cols || ny >= ROWS) continue;
                const j = idx(nx, ny);
                if (grid[j] || seen[j] === stamp) continue;
                seen[j] = stamp;
                q.push(j);
            }
        }
        return q.length;
    }
    function runLen(x, y, d, max) {
        const [dx, dy] = DIRS[d];
        let n = 0;
        while (n < max && free(x + dx * (n + 1), y + dy * (n + 1))) n++;
        return n;
    }
    function think(b) {
        const target = bikes.find((o) => o.alive && o !== b && (!o.ai || bikes[0].ai));
        const cands = [b.dir, LEFT[b.dir], RIGHT[b.dir]];
        const cap = 700;
        let best = null, bestS = -Infinity;
        const ahead = runLen(b.x, b.y, b.dir, 12);
        for (const d of cands) {
            const [dx, dy] = DIRS[d];
            const nx = b.x + dx, ny = b.y + dy;
            if (!free(nx, ny)) continue;
            const sp = space(nx, ny, cap);
            let s = Math.min(sp, cap) * 1.2;
            for (const o of bikes) {
                if (o === b || !o.alive) continue;
                const [ox, oy] = DIRS[o.dir];
                if (o.x + ox === nx && o.y + oy === ny) s -= 400;
            }
            if (d === b.dir) s += ahead < 3 ? -30 : 14;
            else if (b.cool > 0 && ahead >= 4) s -= 40;
            s += runLen(b.x, b.y, d, 10) * 3;
            if (target && sp > 140) {
                const [tx, ty] = DIRS[target.dir];
                const lead = 4 + Math.round(b.aggr * 8);
                const gx = target.x + tx * lead, gy = target.y + ty * lead;
                const dist = Math.abs(gx - nx) + Math.abs(gy - ny);
                s -= dist * b.aggr * 1.6;
            }
            s += Math.random() * 6;
            if (s > bestS) { bestS = s; best = d; }
        }
        if (best && Math.random() < b.mistake) {
            const alt = cands.filter((d) => free(b.x + DIRS[d][0], b.y + DIRS[d][1]));
            if (alt.length) best = Curio.pick(alt);
        }
        if (best && best !== b.dir) b.cool = 3;
        return best || b.dir;
    }
    function crash(b, demo) {
        b.alive = false;
        const x = (b.x + 0.5) * C, y = (b.y + 0.5) * C;
        if (!demo) {
            A.fx.ring(x, y, b.col.glow, 60, 0.6, 4);
            A.shake(b.id === 0 ? 12 : 5);
            if (b.id === 0) A.buzz([60, 40, 120]);
            else {
                const [dx, dy] = DIRS[b.dir];
                const hx = b.x + dx, hy = b.y + dy;
                if (hx >= 0 && hy >= 0 && hx < cols && hy < ROWS && grid[idx(hx, hy)] === 1 && bikes[0].alive) {
                    cutoffs++;
                    A.unlock('cut');
                    A.fx.text(x, y - 16, 'Cut off! +100', '#bff8ff', 15, 1);
                    A.addScore(100);
                }
            }
        }
        A.fx.burst(x, y, 34, [b.col.glow, b.col.core, '#ffffff'], { speed: 200, life: 0.9, size: 2.6, gravity: 0, drag: 2.5 });
        if (!demo) {
            A.noise(0.5, 0.18, 1400);
            A.sweep(700, 60, 0.5, 'sawtooth', 0.06);
        }
    }
    function tick(demo) {
        for (const b of bikes) {
            if (!b.alive) continue;
            if (!b.ai && queue.length) b.dir = queue.shift();
            else if (b.ai) b.dir = think(b);
            if (b.cool > 0) b.cool--;
        }
        const moves = new Map();
        for (const b of bikes) {
            if (!b.alive) continue;
            const [dx, dy] = DIRS[b.dir];
            const nx = b.x + dx, ny = b.y + dy;
            b.nx = nx;
            b.ny = ny;
            b.dead = !free(nx, ny);
            if (!b.dead) {
                const k = idx(nx, ny);
                if (moves.has(k)) { b.dead = true; moves.get(k).dead = true; }
                else moves.set(k, b);
            }
        }
        for (const b of bikes) {
            if (!b.alive) continue;
            b.px = b.x;
            b.py = b.y;
            if (b.dead) {
                crash(b, demo);
                continue;
            }
            if (b.lastDir !== b.dir) b.trail.push([b.x, b.y]);
            b.lastDir = b.dir;
            b.x = b.nx;
            b.y = b.ny;
            const k = idx(b.x, b.y);
            grid[k] = b.id + 1;
            b.cells.push(k);
            if (!demo && b.id === 0) {
                cellsMoved++;
                if (cellsMoved % 10 === 0) A.addScore(1);
                eatOrb(b);
            }
        }
        if (!demo) {
            const me = bikes[0];
            const want = A.keys.has(' ') || A.keys.has('Shift');
            if (me.alive && want && boost >= 4) {
                boost -= 4;
                boostCells++;
                if (boostCells >= 40) A.unlock('boost');
                if (queue.length) me.dir = queue.shift();
                stepMe(me);
                if (Math.random() < 0.6) A.fx.burst((me.x + 0.5) * C, (me.y + 0.5) * C, 2, [me.col.glow, '#ffffff'], { speed: 60, life: 0.3, size: 2, gravity: 0 });
            }
            else boost = Math.min(100, boost + 0.5);
        }
    }
    function simulate(dt, demo) {
        A.fx.update(dt);
        for (const b of bikes) {
            if (!b.alive && b.fade > 0) {
                b.fade -= dt * 0.9;
                if (b.fade <= 0) {
                    b.fade = 0;
                    for (const k of b.cells) if (grid[k] === b.id + 1) grid[k] = 0;
                    b.cells = [];
                }
            }
        }
        if (phase !== 'run') return;
        tickT += dt;
        while (tickT >= tickDur) {
            tickT -= tickDur;
            tick(demo);
        }
    }
    function update(dt) {
        if (phase === 'count') {
            const before = Math.ceil(phaseT);
            phaseT -= dt;
            const after = Math.ceil(phaseT);
            if (after !== before) A.beep(after > 0 ? 520 : 1040, after > 0 ? 0.1 : 0.25, 'square', 0.06);
            if (phaseT <= 0) { phase = 'run'; tickT = 0; }
            simulate(dt, false);
            return;
        }
        if (phase === 'end') {
            phaseT -= dt;
            simulate(dt, false);
            if (phaseT <= 0) {
                if (lives <= 0) {
                    A.over({
                        title: 'Derezzed', emoji: '🏍️', msg: `You won ${wins} of ${round} round${round === 1 ? '' : 's'} against ${rivals} rival${rivals > 1 ? 's' : ''}. ${wins >= 5 ? 'The Grid bows to you.' : wins >= 2 ? 'Respectable. Very glowy.' : 'The walls came at you fast.'}`,
                        lines: [[' rounds won', `${wins}/${round}`], [' rivals', rivals], [' orbs', orbsRun], [' cut-offs', cutoffs]],
                        share: `🏍️ Zoble Light Cycles: ${Curio.fmt(A.score)} pts\n🏁 Won ${wins} of ${round} rounds vs ${rivals} rival${rivals > 1 ? 's' : ''} · ✂️ ${cutoffs} cut-offs · 🔮 ${orbsRun} orbs`
                    });
                }
                else {
                    newRound(false);
                    A.statMax('round', round);
                    if (round >= 5) A.unlock('r5');
                    if (round >= 10) A.unlock('r10');
                }
            }
            return;
        }
        const aliveBefore = bikes.filter((b) => b.alive).length;
        const rivalsBefore = bikes.filter((b) => b.alive && b.ai).length;
        simulate(dt, false);
        if (rivalsBefore - bikes.filter((b) => b.alive && b.ai).length >= 2 && bikes[0].alive) A.unlock('double');
        const me = bikes[0];
        const rivalsAlive = bikes.filter((b) => b.alive && b.ai).length;
        const aliveNow = bikes.filter((b) => b.alive).length;
        if (aliveNow < aliveBefore && me.alive) {
            const killed = aliveBefore - aliveNow;
            A.addScore(50 * killed * Math.min(5, round));
        }
        if (!me.alive) {
            lives--;
            livesLostRun++;
            winsNoLoss = 0;
            hud();
            phase = 'end';
            phaseT = 2.2;
            msg = lives > 0 ? `Derezzed! ${lives} ${lives === 1 ? 'life' : 'lives'} left` : 'Out of lives';
            if (lives > 0) Curio.beep(220, 0.3, 'triangle', 0.08);
        }
        else if (rivalsAlive === 0) {
            wins++;
            winsNoLoss++;
            A.stat('wins', 1);
            A.unlock('win1');
            if (wins >= 3) A.unlock('win3');
            if (winsNoLoss >= 3) A.unlock('flawless');
            if (rivals >= 3) A.unlock('three');
            const mask = A.stat('arenamask') | (1 << arena);
            A.profile.stats.arenamask = mask; A.save();
            if (mask === 31) A.unlock('arenas');
            const w = A.stat('wins');
            const sk = SKINS.find((k) => k[3] === w);
            if (sk) { Curio.toast(`🎨 ${sk[4]} bike unlocked!`); A.unlock('skin'); }
            const bonus = 200 * rivals + round * 50;
            A.addScore(bonus);
            phase = 'end';
            phaseT = 2.2;
            msg = `Round ${round} won! +${bonus}`;
            [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => A.beep(f, 0.12, 'square', 0.06), i * 90));
            if (wins % 3 === 0) {
                lives = Math.min(5, lives + 1);
                hud();
                Curio.toast('Extra life!');
            }
        }
    }
    let demoWait = 0;
    function idle(dt) {
        if (A.state !== 'menu') return;
        if (!bikes.some((b) => b.alive)) {
            demoWait += dt;
            A.fx.update(dt);
            if (demoWait > 1.5) { demoWait = 0; newRound(true); }
            return;
        }
        if (bikes.filter((b) => b.alive).length <= 1) {
            demoWait += dt;
            if (demoWait > 2.5) { demoWait = 0; newRound(true); return; }
        }
        simulate(dt, true);
    }
    function drawTrail(g, b, frac) {
        const pts = b.trail;
        const hx = b.alive ? b.px + (b.x - b.px) * frac : b.x, hy = b.alive ? b.py + (b.y - b.py) * frac : b.y;
        const path = () => {
            g.beginPath();
            g.moveTo((pts[0][0] + 0.5) * C, (pts[0][1] + 0.5) * C);
            for (let i = 1; i < pts.length; i++) g.lineTo((pts[i][0] + 0.5) * C, (pts[i][1] + 0.5) * C);
            g.lineTo((b.px + 0.5) * C, (b.py + 0.5) * C);
            g.lineTo((hx + 0.5) * C, (hy + 0.5) * C);
        };
        const a = b.alive ? 1 : Math.max(0, b.fade);
        if (a <= 0) return;
        const flick = b.alive ? 1 : (Math.sin(A.time * 50) > 0 ? 1 : 0.5);
        g.globalAlpha = 0.18 * a * flick;
        g.strokeStyle = b.col.glow;
        g.lineWidth = C * 1.3;
        path();
        g.stroke();
        g.globalAlpha = 0.55 * a * flick;
        g.lineWidth = C * 0.6;
        path();
        g.stroke();
        g.globalAlpha = a * flick;
        g.strokeStyle = b.col.core;
        g.lineWidth = C * 0.24;
        path();
        g.stroke();
        g.globalAlpha = 1;
        if (b.alive) {
            const x = (hx + 0.5) * C, y = (hy + 0.5) * C;
            const ang = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 }[b.dir];
            g.save();
            g.translate(x, y);
            g.rotate(ang);
            g.shadowColor = b.col.glow;
            g.shadowBlur = 16;
            g.fillStyle = b.col.glow;
            rrect(g, -C * 1.1, -C * 0.5, C * 1.9, C, C * 0.45);
            g.fill();
            g.shadowBlur = 0;
            g.fillStyle = '#ffffff';
            rrect(g, -C * 0.2, -C * 0.28, C * 0.8, C * 0.56, C * 0.28);
            g.fill();
            g.restore();
        }
    }
    function draw(g, alpha) {
        const W = cols * C, H = ROWS * C;
        g.fillStyle = '#04060f';
        g.fillRect(0, 0, W, H);
        const vg = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.7);
        vg.addColorStop(0, 'rgba(30,60,120,.35)');
        vg.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = vg;
        g.fillRect(0, 0, W, H);
        g.strokeStyle = 'rgba(80,170,255,.09)';
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x <= cols; x += 2) { g.moveTo(x * C, 0); g.lineTo(x * C, H); }
        for (let y = 0; y <= ROWS; y += 2) { g.moveTo(0, y * C); g.lineTo(W, y * C); }
        g.stroke();
        g.strokeStyle = 'rgba(80,170,255,.22)';
        g.beginPath();
        for (let x = 0; x <= cols; x += 10) { g.moveTo(x * C, 0); g.lineTo(x * C, H); }
        for (let y = 0; y <= ROWS; y += 10) { g.moveTo(0, y * C); g.lineTo(W, y * C); }
        g.stroke();
        const py = ((A.time * 60) % (H + 200)) - 100;
        const pg = g.createLinearGradient(0, py - 60, 0, py + 60);
        pg.addColorStop(0, 'rgba(34,216,255,0)'); pg.addColorStop(0.5, 'rgba(34,216,255,.06)'); pg.addColorStop(1, 'rgba(34,216,255,0)');
        g.fillStyle = pg; g.fillRect(0, py - 60, W, 120);
        g.strokeStyle = '#22d8ff';
        g.lineWidth = 3;
        g.globalAlpha = 0.6 + 0.2 * Math.sin(A.time * 2);
        g.shadowColor = '#22d8ff';
        g.shadowBlur = 12;
        g.strokeRect(1.5, 1.5, W - 3, H - 3);
        g.shadowBlur = 0;
        g.globalAlpha = 1;
        if (grid) {
            g.fillStyle = 'rgba(160,120,255,.35)';
            g.strokeStyle = '#b388ff';
            g.lineWidth = 1;
            for (let y = 0; y < ROWS; y++) for (let x = 0; x < cols; x++) if (grid[idx(x, y)] === 9) { g.fillRect(x * C + 1, y * C + 1, C - 2, C - 2); g.strokeRect(x * C + 1.5, y * C + 1.5, C - 3, C - 3); }
        }
        for (const o of orbs) {
            const ox = (o.x + 0.5) * C, oy = (o.y + 0.5) * C, r = 4 + Math.sin(A.time * 6 + o.t) * 1.2;
            const og = g.createRadialGradient(ox, oy, 0, ox, oy, 14);
            og.addColorStop(0, 'rgba(255,224,102,.6)'); og.addColorStop(1, 'rgba(255,224,102,0)');
            g.fillStyle = og; g.fillRect(ox - 14, oy - 14, 28, 28);
            g.fillStyle = '#fff6c2'; g.beginPath(); g.arc(ox, oy, r, 0, 7); g.fill();
        }
        g.lineCap = 'round';
        g.lineJoin = 'round';
        const frac = phase === 'run' ? Math.min(1, tickT / tickDur) : 1;
        for (let i = bikes.length - 1; i >= 0; i--) drawTrail(g, bikes[i], frac);
        A.fx.draw(g);
        g.textAlign = 'center';
        if ((A.state === 'play' || A.state === 'paused') && phase === 'count') {
            const n = Math.ceil(phaseT);
            g.fillStyle = '#ffffff';
            g.shadowColor = '#22d8ff';
            g.shadowBlur = 20;
            g.font = `900 64px ${FONT}`;
            g.fillText(n > 0 ? String(n) : 'GO', W / 2, H / 2 + 10);
            g.shadowBlur = 0;
            g.font = `700 16px ${FONT}`;
            g.fillStyle = '#bff8ff';
            g.fillText(`Round ${round} · ${ARENAS[arena]} · you are the ${myCol().core === '#bff8ff' ? 'blue' : 'glowing'} bike`, W / 2, H / 2 + 44);
            const me = bikes[0];
            g.strokeStyle = '#bff8ff';
            g.lineWidth = 2;
            g.beginPath();
            g.arc((me.x + 0.5) * C, (me.y + 0.5) * C, 16 + Math.sin(A.time * 8) * 4, 0, 7);
            g.stroke();
        }
        if (A.state === 'play' || A.state === 'paused') {
            const bw = 120, bx = W - bw - 14, by = 12;
            g.fillStyle = 'rgba(4,6,15,.6)'; rrect(g, bx - 6, by - 4, bw + 12, 22, 8); g.fill();
            g.fillStyle = 'rgba(255,255,255,.15)'; rrect(g, bx, by + 6, bw, 6, 3); g.fill();
            const bg2 = g.createLinearGradient(bx, 0, bx + bw, 0);
            bg2.addColorStop(0, '#ffe066'); bg2.addColorStop(1, '#ff9f1c');
            g.fillStyle = bg2; rrect(g, bx, by + 6, bw * boost / 100, 6, 3); g.fill();
            g.font = `800 10px ${FONT}`; g.fillStyle = '#ffe066'; g.textAlign = 'left';
            g.fillText('BOOST', bx, by + 3);
            g.textAlign = 'center';
        }
        if ((A.state === 'play' || A.state === 'paused') && phase === 'end' && msg) {
            g.fillStyle = 'rgba(4,6,15,.6)';
            const w = Math.min(W - 20, 360);
            rrect(g, W / 2 - w / 2, H / 2 - 34, w, 60, 14);
            g.fill();
            g.fillStyle = msg.includes('won') ? '#8cff3a' : '#ff7ab8';
            g.font = `900 24px ${FONT}`;
            g.fillText(msg, W / 2, H / 2 + 4);
        }
    }
    A.debug = () => ({
        phase, round, lives, cols, bikes: bikes.map((b) => ({ x: b.x, y: b.y, dir: b.dir, alive: b.alive })),
        go() { phaseT = 0; },
        killRivals() { for (const b of bikes) if (b.ai && b.alive) crash(b, false); },
        killMe() { crash(bikes[0], false); },
        toRound(n) { round = n - 1; newRound(false); phaseT = 0; },
        orbHere() { const me = bikes[0]; const [dx, dy] = DIRS[me.dir]; orbs.push({ x: me.x + dx * 3, y: me.y + dy * 3, t: 0 }); }
    });
    newRound(true);
    paintSkins();
    A.hud('lives', '♥♥♥');
    A.boot();
    requestAnimationFrame(() => { pickCols(); newRound(true); A.showBest(); });
})();
