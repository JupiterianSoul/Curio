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
    const MAPS = [
        ['###################', '#........#........#', '#o##.###.#.###.##o#', '#.................#', '#.##.#.#####.#.##.#', '#....#...#...#....#', '####.### # ###.####', '___#.#       #.#___', '####.# ##-## #.####', '    .  #GGG#  .    ', '####.# ##### #.####', '___#.#       #.#___', '####.# ##### #.####', '#........#........#', '#.##.###.#.###.##.#', '#o.#.....P.....#.o#', '##.#.#.#####.#.#.##', '#....#...#...#....#', '#.######.#.######.#', '#.................#', '###################'],
        ['###################', '#.................#', '#o##.#.#####.#.##o#', '#....#...#...#....#', '#.##.#.#.#.#.#.##.#', '#....#...#...#....#', '####.### # ###.####', '___#.#       #.#___', '####.# ##-## #.####', '    .  #GGG#  .    ', '####.# ##### #.####', '___#.#       #.#___', '####.# ##### #.####', '#.................#', '#.##.#.#####.#.##.#', '#o...#...P...#...o#', '###.###.#.#.###.###', '#.....#.....#.....#', '#.###.#.###.#.###.#', '#.................#', '###################'],
        ['###################', '#....#.......#....#', '#o##.#.##.##.#.##o#', '#.................#', '#.##.#.##.##.#.##.#', '#....#.......#....#', '####.### # ###.####', '___#.#       #.#___', '####.# ##-## #.####', '    .  #GGG#  .    ', '####.# ##### #.####', '___#.#       #.#___', '####.# ##### #.####', '#....#.......#....#', '#.##.#.##.##.#.##.#', '#o...#...P...#...o#', '##.#.#.#####.#.#.##', '#....#...#...#....#', '#.##.#.#.#.#.#.##.#', '#.................#', '###################'],
        ['###################', '#.................#', '#o#.###.###.###.#o#', '#.................#', '#.###.#.###.#.###.#', '#.....#.....#.....#', '####.### # ###.####', '___#.#       #.#___', '####.# ##-## #.####', '    .  #GGG#  .    ', '####.# ##### #.####', '___#.#       #.#___', '####.# ##### #.####', '#.................#', '#.###.#.#.#.#.###.#', '#o..#....P....#..o#', '#.#.#.###.###.#.#.#', '#.#...#.....#...#.#', '#.#####.#.#.#####.#', '#.................#', '###################']
    ];
    const MAZES = [
        { name: 'Classic', wall: '#3d5afe', bg: '#0d0d3b', dbg: '#05051a', dot: '#ffd9b3' },
        { name: 'Candy Lane', wall: '#ff4fa3', bg: '#2a0d2e', dbg: '#14051a', dot: '#fff0f8' },
        { name: 'Moss Garden', wall: '#2ecc71', bg: '#0b2a1a', dbg: '#04140c', dot: '#e8ffd9' },
        { name: 'Ember Works', wall: '#ff8f00', bg: '#2e140a', dbg: '#170804', dot: '#ffe8c2' }
    ];
    let MAP = MAPS[0], mazeI = 0;
    const COLS = 19, ROWS = 21, T = 24, W = COLS * T, H = ROWS * T, TUN = 9;
    const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };
    const ORDER = [[0, -1], [-1, 0], [0, 1], [1, 0]];
    const SCHEDULE = [7, 20, 7, 20, 5, 20, 5, Infinity];
    const FRUITS = [
        { name: 'cherries', pts: 100 }, { name: 'strawberry', pts: 300 }, { name: 'orange', pts: 500 },
        { name: 'apple', pts: 700 }, { name: 'grapes', pts: 1000 }, { name: 'melon', pts: 2000 }
    ];
    const GHOSTS = [
        { name: 'Pepper', color: '#ff4d4d', home: [9, 7], corner: [COLS - 2, -3], release: 0 },
        { name: 'Bubblegum', color: '#ff8ad8', home: [9, 9], corner: [1, -3], release: 0.6 },
        { name: 'Splash', color: '#35d6e8', home: [8, 9], corner: [COLS - 1, ROWS + 1], release: 4 },
        { name: 'Clementine', color: '#ffa53b', home: [10, 9], corner: [0, ROWS + 1], release: 8 }
    ];
    const MODES = {
        classic: { name: 'Classic', speed: 1, mult: 1 },
        lantern: { name: 'Lantern', speed: 1, mult: 1.5 },
        turbo: { name: 'Turbo', speed: 1.25, mult: 1.5 }
    };
    const FRUIT_NAMES = ['cherries', 'strawberry', 'orange', 'apple', 'grapes', 'melon'];
    const BADGES = [
        ['clear1', '🟡', 'First course', 'Clear level 1'],
        ['l3', '🍬', 'Sweet tooth', 'Reach level 3'],
        ['tour', '🗺️', 'Grand tour', 'Visit all four mazes'],
        ['l8', '🏆', 'Maze master', 'Reach level 8'],
        ['buffet', '👻', 'Ghost buffet', 'Eat all four ghosts on one pellet'],
        ['ghost50', '🍽️', 'Ghost gourmet', 'Eat 50 ghosts in total'],
        ['fruit', '🍉', 'Fruit basket', 'Eat all six kinds of fruit'],
        ['nodeath', '✨', 'Untouchable', 'Clear a level without losing a life'],
        ['lantern', '🔦', 'Night owl', 'Clear a level in Lantern mode'],
        ['turbo', '⚡', 'Speed demon', 'Clear a level in Turbo mode'],
        ['p10k', '⭐', 'Ten thousand', 'Score 10,000 points'],
        ['p30k', '🌟', 'High roller', 'Score 30,000 points'],
        ['dots5k', '🔵', 'Dot devourer', 'Eat 5,000 dots in total']
    ];
    let mode, mm, ghostsEaten, fruitsEaten, diedThisLevel, mazeCache = null, mazeCacheKey = '', trail = [];
    let grid, dots, totalDots, eaten, pl, ghosts, level, lives, phase, phaseT, modeIdx, modeT, scatter, frightT, frightLen, chain, fruit, fruitShown, freezeT, popups, mouth, waka, extra, flashT, banner, wallPath;
    const A = Arcade({
        width: W, height: H, reset, update, draw, key, swipe, idle, swipeDist: 22, badges: BADGES, touchTip: 'Tip: on a laptop, steer with the arrow keys. To swipe with a touchpad, turn on Touchpad mode in the top bar.',
        bestKey: () => (A.opt('mode') === 'classic' ? 'score' : 'score-' + A.opt('mode')),
        menuStats: () => [[' games', Curio.fmt(A.profile.games || 0)], [' dots', Curio.fmt(A.stat('dots'))], [' ghosts eaten', Curio.fmt(A.stat('ghosts'))], [' best level', A.stat('level') || '-']],
        theme: () => { mazeCache = null; }
    });
    function setMaze(i) {
        mazeI = i % MAPS.length;
        MAP = MAPS[mazeI];
        buildWalls();
        mazeCache = null;
    }
    function buildWalls() {
        wallPath = new Path2D();
        const isW = (x, y) => y >= 0 && y < ROWS && x >= 0 && x < COLS && MAP[y][x] === '#';
        for (let y = 0; y < ROWS; y++)
            for (let x = 0; x < COLS; x++) {
                if (!isW(x, y))
                    continue;
                const cx = x * T + T / 2, cy = y * T + T / 2;
                let n = 0;
                if (isW(x + 1, y)) {
                    wallPath.moveTo(cx, cy);
                    wallPath.lineTo(cx + T, cy);
                    n++;
                }
                if (isW(x, y + 1)) {
                    wallPath.moveTo(cx, cy);
                    wallPath.lineTo(cx, cy + T);
                    n++;
                }
                if (!n && !isW(x - 1, y) && !isW(x, y - 1)) {
                    wallPath.moveTo(cx, cy);
                    wallPath.lineTo(cx + 0.01, cy);
                }
            }
    }
    buildWalls();
    function resetDots() {
        grid = MAP.map((r) => [...r]);
        dots = 0;
        for (const r of grid)
            for (const c of r)
                if (c === '.' || c === 'o')
                    dots++;
        totalDots = dots;
        eaten = 0;
        fruitShown = 0;
        fruit = null;
    }
    function reset() {
        mode = A.opt('mode') || 'classic';
        mm = MODES[mode] || MODES.classic;
        ghostsEaten = 0; fruitsEaten = 0; diedThisLevel = false; trail = [];
        setMaze(0);
        level = 1;
        lives = 3;
        extra = false;
        popups = [];
        A.fx.clear();
        resetDots();
        startLife(true);
        hud();
    }
    function hud() {
        A.hud('lives', Math.max(0, lives));
        A.hud('level', level);
    }
    const speedBase = () => 7.4 * Math.min(1.3, 1 + (level - 1) * 0.06) * (mm ? mm.speed : 1);
    function startLife(fresh) {
        pl = { x: 9, y: 15, tx: 9, ty: 15, dx: 0, dy: 0, want: [-1, 0], face: [-1, 0], dist: 0, dying: 0 };
        ghosts = GHOSTS.map((d, i) => {
            const [hx, hy] = d.home;
            return { ...d, i, x: hx, y: hy, tx: hx, ty: hy, dx: i === 0 ? -1 : 0, dy: 0, state: i === 0 ? 'out' : 'house', wait: Math.max(0, d.release - (level - 1) * 0.6), fright: false, bob: Math.random() * 6 };
        });
        ghosts[0].tx = 8;
        phase = 'ready';
        phaseT = fresh ? 2.2 : 1.6;
        modeIdx = 0;
        modeT = SCHEDULE[0];
        scatter = true;
        frightT = 0;
        frightLen = Math.max(1.6, 7 - (level - 1) * 0.9);
        chain = 0;
        freezeT = 0;
        mouth = 0;
        flashT = 0;
        banner = null;
        if (fresh && A.state === 'play')
            [262, 330, 392, 523, 392, 523].forEach((f, i) => setTimeout(() => A.beep(f, 0.12, 'square', 0.05), i * 150));
    }
    function cell(x, y) {
        if (y < 0 || y >= ROWS)
            return '#';
        if (x < 0 || x >= COLS)
            return y === TUN ? ' ' : '#';
        return grid[y][x];
    }
    const open = (x, y) => { const c = cell(x, y); return c !== '#' && c !== '_' && c !== '-' && c !== 'G'; };
    function setWant(d) {
        if (A.state !== 'play')
            return;
        pl.want = d;
        if (pl.dx === -d[0] && pl.dy === -d[1] && (pl.dx || pl.dy)) {
            pl.dx = d[0];
            pl.dy = d[1];
            pl.tx += d[0];
            pl.ty += d[1];
            pl.face = d;
        }
    }
    const KEYMAP = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down' };
    function key(k, down) { if (down && KEYMAP[k]) setWant(DIRS[KEYMAP[k]]); }
    function swipe(dir) { setWant(DIRS[dir]); }
    function wrap(e) {
        if (e.x <= -1 && e.dx < 0) {
            e.x = e.tx = COLS;
        }
        else if (e.x >= COLS && e.dx > 0) {
            e.x = e.tx = -1;
        }
    }
    function advance(e, dist, decide) {
        let guard = 0;
        while (dist > 1e-9 && guard++ < 10) {
            const rx = e.tx - e.x, ry = e.ty - e.y, d = Math.abs(rx) + Math.abs(ry);
            if (d <= dist) {
                e.x = e.tx;
                e.y = e.ty;
                dist -= d;
                wrap(e);
                decide(e);
                if (e.tx === e.x && e.ty === e.y)
                    return dist;
            }
            else {
                e.x += Math.sign(rx) * dist;
                e.y += Math.sign(ry) * dist;
                return 0;
            }
        }
        return 0;
    }
    function decidePlayer(e) {
        if (e.want && open(e.x + e.want[0], e.y + e.want[1])) {
            e.dx = e.want[0];
            e.dy = e.want[1];
            e.face = e.want;
            e.want = null;
        }
        if ((e.dx || e.dy) && open(e.x + e.dx, e.y + e.dy)) {
            e.tx = e.x + e.dx;
            e.ty = e.y + e.dy;
        }
        else {
            e.dx = e.dy = 0;
        }
    }
    function target(g) {
        if (g.state === 'eyes')
            return [9, 7];
        if (scatter)
            return g.corner;
        const px = Math.round(pl.x), py = Math.round(pl.y), fd = pl.face;
        if (g.i === 0)
            return [px, py];
        if (g.i === 1)
            return [px + fd[0] * 4, py + fd[1] * 4];
        if (g.i === 2) {
            const r = ghosts[0];
            const vx = px + fd[0] * 2, vy = py + fd[1] * 2;
            return [vx * 2 - Math.round(r.x), vy * 2 - Math.round(r.y)];
        }
        const d = Math.hypot(px - g.x, py - g.y);
        return d > 8 ? [px, py] : g.corner;
    }
    function decideGhost(g) {
        if (g.state === 'eyes' && g.x === 9 && g.y === 7) {
            g.state = 'enter';
            return;
        }
        const opts = ORDER.filter(([dx, dy]) => !(dx === -g.dx && dy === -g.dy) && open(g.x + dx, g.y + dy));
        let pick;
        if (!opts.length)
            pick = [-g.dx, -g.dy];
        else if (g.fright && g.state === 'out')
            pick = Curio.pick(opts);
        else {
            const [tx, ty] = target(g);
            let best = Infinity;
            for (const o of opts) {
                const d = (g.x + o[0] - tx) ** 2 + (g.y + o[1] - ty) ** 2;
                if (d < best - 1e-9) {
                    best = d;
                    pick = o;
                }
            }
        }
        g.dx = pick[0];
        g.dy = pick[1];
        g.tx = g.x + g.dx;
        g.ty = g.y + g.dy;
    }
    function reverse(g) {
        if (g.state !== 'out' || (!g.dx && !g.dy))
            return;
        g.dx = -g.dx;
        g.dy = -g.dy;
        g.tx += g.dx;
        g.ty += g.dy;
    }
    function moveTo(g, tx, ty, dist) {
        const dx = tx - g.x, dy = ty - g.y;
        if (Math.abs(dx) > 1e-6) {
            const s = Math.min(Math.abs(dx), dist);
            g.x += Math.sign(dx) * s;
            g.dx = Math.sign(dx);
            g.dy = 0;
            return Math.abs(dx) - s > 1e-6 || Math.abs(dy) > 1e-6;
        }
        g.x = tx;
        const s = Math.min(Math.abs(dy), dist);
        g.y += Math.sign(dy) * s;
        g.dx = 0;
        g.dy = Math.sign(dy) || g.dy;
        return Math.abs(dy) - s > 1e-6;
    }
    function ghostSpeed(g) {
        const b = speedBase();
        if (g.state === 'eyes' || g.state === 'enter')
            return b * 2.2;
        if (g.state === 'house' || g.state === 'leave')
            return b * 0.5;
        if (g.y === TUN && (g.x < 4 || g.x > COLS - 5))
            return b * 0.5;
        if (g.fright)
            return b * 0.55;
        const elroy = g.i === 0 && dots < 20 ? 1.08 : 1;
        return b * 0.93 * elroy;
    }
    function updateGhost(g, dt) {
        const dist = ghostSpeed(g) * dt;
        g.bob += dt * 6;
        if (g.state === 'house') {
            g.wait -= dt;
            g.y = 9 + Math.sin(g.bob) * 0.18;
            if (g.wait <= 0 && phase === 'play') {
                g.state = 'leave';
                g.y = 9;
            }
            return;
        }
        if (g.state === 'leave') {
            if (!moveTo(g, 9, 7, dist)) {
                g.x = 9;
                g.y = 7;
                g.state = 'out';
                g.dx = Math.random() < 0.5 ? -1 : 1;
                g.dy = 0;
                g.tx = 9 + g.dx;
                g.ty = 7;
            }
            return;
        }
        if (g.state === 'enter') {
            if (!moveTo(g, 9, 9, dist)) {
                g.state = 'house';
                g.fright = false;
                g.wait = 0.4;
                g.x = 9;
                g.y = 9;
            }
            return;
        }
        advance(g, dist, decideGhost);
    }
    function addPopup(x, y, text, color = '#ffffff') { popups.push({ x, y, text, color, t: 0 }); }
    function score(n) {
        A.addScore(Math.round(n * mm.mult / 10) * 10);
        if (A.score >= 10000) A.unlock('p10k');
        if (A.score >= 30000) A.unlock('p30k');
        if (!extra && A.score >= 10000) {
            extra = true;
            lives++;
            hud();
            Curio.toast('Extra life at 10,000!');
            [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => A.beep(f, 0.08, 'triangle', 0.09), i * 70));
        }
    }
    function eat() {
        const cx = Math.round(pl.x), cy = Math.round(pl.y);
        if (Math.abs(pl.x - cx) + Math.abs(pl.y - cy) > 0.45)
            return;
        const c = cell(cx, cy);
        if (c === '.' || c === 'o') {
            grid[cy][cx] = ' ';
            dots--;
            eaten++;
            A.stat('dots', 1);
            if (A.stat('dots') >= 5000) A.unlock('dots5k');
            if (c === '.') {
                score(10);
                A.beep(waka ? 520 : 400, 0.05, 'triangle', 0.05);
                waka = !waka;
            }
            else {
                score(50);
                frightT = frightLen;
                chain = 0;
                for (const g of ghosts)
                    if (g.state === 'out') {
                        g.fright = true;
                        reverse(g);
                    }
                    else if (g.state === 'house' || g.state === 'leave')
                        g.fright = true;
                A.sweep(300, 900, 0.25, 'square', 0.06);
                A.fx.burst(cx * T + T / 2, cy * T + T / 2, 18, ['#ffe066', '#ffffff', MAZES[mazeI].wall], { speed: 160, life: 0.6, size: 3, gravity: 0, round: true });
                A.fx.ring(cx * T + T / 2, cy * T + T / 2, '#ffe066', 60, 0.5, 3);
                A.shake(3);
                A.buzz(25);
            }
            if ((eaten === 60 || eaten === 120) && !fruit) {
                const f = FRUITS[Math.min(level - 1, FRUITS.length - 1)];
                fruit = { ...f, t: 9.5 };
            }
        }
        if (fruit && cx === 9 && cy === 11) {
            score(fruit.pts);
            A.fx.text(9 * T + T / 2, 11 * T + T / 2, Curio.fmt(Math.round(fruit.pts * mm.mult / 10) * 10), '#ffd54f', 16, 1);
            A.fx.burst(9 * T + T / 2, 11 * T + T / 2, 16, ['#ffd54f', '#ff5252', '#69f0ae'], { speed: 150, life: 0.6, size: 3, gravity: 120, round: true });
            fruitsEaten++;
            const fi = FRUIT_NAMES.indexOf(fruit.name);
            const mask = A.stat('fruitmask') | (1 << fi);
            A.profile.stats.fruitmask = mask; A.save();
            if (mask === 63) A.unlock('fruit');
            [784, 988, 1175].forEach((f, i) => setTimeout(() => A.beep(f, 0.08, 'triangle', 0.09), i * 60));
            fruit = null;
        }
    }
    function levelClear() {
        phase = 'clear';
        phaseT = 2.4;
        flashT = 0;
        const bonus = 500 * level;
        score(bonus);
        banner = { text: `Level ${level} cleared!`, sub: `+${Curio.fmt(Math.round(bonus * mm.mult / 10) * 10)} bonus${diedThisLevel ? '' : ' · flawless'}` };
        A.unlock('clear1');
        if (!diedThisLevel) A.unlock('nodeath');
        if (mode === 'lantern') A.unlock('lantern');
        if (mode === 'turbo') A.unlock('turbo');
        Curio.confetti(80);
        [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => A.beep(f, 0.12, 'triangle', 0.1), i * 90));
    }
    function die() {
        phase = 'dying';
        phaseT = 2.2;
        pl.dying = 0;
        diedThisLevel = true;
        A.shake(10);
        A.buzz([50, 50, 150]);
        A.sweep(880, 120, 1.4, 'square', 0.06);
    }
    function update(dt) {
        A.fx.update(dt);
        for (let i = popups.length - 1; i >= 0; i--) {
            popups[i].t += dt;
            if (popups[i].t > 1)
                popups.splice(i, 1);
        }
        if (phase === 'ready') {
            phaseT -= dt;
            for (const g of ghosts)
                if (g.state === 'house')
                    g.y = 9 + Math.sin((g.bob += dt * 6)) * 0.18;
            if (phaseT <= 0)
                phase = 'play';
            return;
        }
        if (phase === 'dying') {
            phaseT -= dt;
            if (phaseT < 1.7)
                pl.dying = Math.min(1, (1.7 - phaseT) / 1.3);
            if (phaseT <= 0) {
                lives--;
                hud();
                if (lives <= 0) {
                    A.over({
                        title: 'Game over', emoji: '👻', msg: Curio.pick([`Level ${level} in ${MAZES[mazeI].name}, ${Curio.fmt(totalDots - dots)} dots in. The ghosts are throwing a party.`, `Caught on level ${level}. Pepper says thanks for the snack.`, `You munched your way to level ${level}. The dots will grow back.`]),
                        lines: [[' level', level], [' maze', MAZES[mazeI].name], [' ghosts eaten', ghostsEaten], [' fruit', fruitsEaten]],
                        share: `🟡 Zoble Maze Muncher (${mm.name}): ${Curio.fmt(A.score)} pts\n🗺️ Level ${level}, ${MAZES[mazeI].name} · 👻 ${ghostsEaten} ghosts · 🍒 ${fruitsEaten} fruit`
                    });
                    return;
                }
                startLife(false);
            }
            return;
        }
        if (phase === 'clear') {
            phaseT -= dt;
            flashT += dt;
            if (phaseT <= 0) {
                level++;
                hud();
                setMaze(level - 1);
                resetDots();
                startLife(false);
                diedThisLevel = false;
                A.statMax('level', level);
                if (level >= 3) A.unlock('l3');
                if (level >= 4) A.unlock('tour');
                if (level >= 8) A.unlock('l8');
                banner = { text: `Level ${level}`, sub: MAZES[mazeI].name };
            }
            return;
        }
        if (freezeT > 0) {
            freezeT -= dt;
            for (const g of ghosts)
                if (g.state === 'eyes' || g.state === 'enter')
                    updateGhost(g, dt);
            return;
        }
        if (fruit) {
            fruit.t -= dt;
            if (fruit.t <= 0)
                fruit = null;
        }
        if (frightT > 0) {
            frightT -= dt;
            if (frightT <= 0)
                for (const g of ghosts)
                    g.fright = false;
        }
        else {
            modeT -= dt;
            if (modeT <= 0 && modeIdx < SCHEDULE.length - 1) {
                modeIdx++;
                modeT = SCHEDULE[modeIdx];
                scatter = modeIdx % 2 === 0;
                for (const g of ghosts)
                    reverse(g);
            }
        }
        const ps = speedBase() * (frightT > 0 ? 1.08 : 1);
        const ox = pl.x, oy = pl.y;
        advance(pl, ps * dt, decidePlayer);
        if (frightT > 0) { trail.push([pl.x * T + T / 2, pl.y * T + T / 2]); if (trail.length > 10) trail.shift(); }
        else if (trail.length) trail.length = 0;
        if (Math.abs(pl.x - ox) < 2)
            pl.dist += Math.abs(pl.x - ox) + Math.abs(pl.y - oy);
        eat();
        if (dots === 0 && phase === 'play')
            levelClear();
        if (phase !== 'play')
            return;
        for (const g of ghosts) {
            updateGhost(g, dt);
            if (g.state !== 'out')
                continue;
            if (Math.abs(g.x - pl.x) + Math.abs(g.y - pl.y) < 0.7) {
                if (g.fright) {
                    g.fright = false;
                    g.state = 'eyes';
                    const pts = 200 * Math.pow(2, chain++);
                    score(pts);
                    ghostsEaten++;
                    A.stat('ghosts', 1);
                    if (A.stat('ghosts') >= 50) A.unlock('ghost50');
                    A.fx.text(g.x * T + T / 2, g.y * T + T / 2, Curio.fmt(Math.round(pts * mm.mult / 10) * 10), '#35d6e8', 15, 1);
                    A.fx.ring(g.x * T + T / 2, g.y * T + T / 2, g.color, 40, 0.45, 3);
                    A.shake(4);
                    A.buzz(30);
                    freezeT = 0.6;
                    A.sweep(200, 1600, 0.35, 'square', 0.07);
                    A.fx.burst(g.x * T + T / 2, g.y * T + T / 2, 18, ['#3a5bff', '#ffffff'], { speed: 180, life: 0.5, size: 4, gravity: 0 });
                    if (chain === 4) {
                        Curio.toast('All four! Ghost buffet.');
                        A.unlock('buffet');
                    }
                    return;
                }
                die();
                return;
            }
        }
    }
    function idle(dt) {
        A.fx.update(dt);
        if (ghosts)
            for (const g of ghosts)
                g.bob += dt * 6;
    }
    function drawFruit(g, name, x, y, s = 1) {
        g.save();
        g.translate(x, y);
        g.scale(s, s);
        const ball = (cx, cy, r, c) => { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); };
        const leaf = (cx, cy, c = '#43a047') => { g.fillStyle = c; g.beginPath(); g.ellipse(cx, cy, 4, 2, -0.6, 0, 7); g.fill(); };
        if (name === 'cherries') {
            g.strokeStyle = '#6d4c41';
            g.lineWidth = 1.6;
            g.beginPath();
            g.moveTo(-4, 3);
            g.quadraticCurveTo(-2, -6, 4, -8);
            g.moveTo(4, 4);
            g.quadraticCurveTo(4, -4, 4, -8);
            g.stroke();
            ball(-4, 4, 4.5, '#e53935');
            ball(4, 5, 4.5, '#e53935');
            ball(-5.5, 2.5, 1.3, '#ffcdd2');
        }
        else if (name === 'strawberry') {
            g.fillStyle = '#e53935';
            g.beginPath();
            g.moveTo(-7, -3);
            g.quadraticCurveTo(0, -7, 7, -3);
            g.quadraticCurveTo(5, 6, 0, 9);
            g.quadraticCurveTo(-5, 6, -7, -3);
            g.fill();
            g.fillStyle = '#ffeb3b';
            for (const [a, b] of [[-3, 0], [2, -1], [0, 4], [-2, 5], [3, 3]])
                g.fillRect(a, b, 1.3, 1.3);
            leaf(-2, -5);
            leaf(2, -5);
        }
        else if (name === 'orange') {
            ball(0, 1, 7, '#fb8c00');
            ball(-2.5, -1.5, 1.6, '#ffcc80');
            leaf(3, -6);
        }
        else if (name === 'apple') {
            ball(-2.5, 1, 6, '#d32f2f');
            ball(2.5, 1, 6, '#d32f2f');
            ball(-3, -1, 1.5, '#ffcdd2');
            g.fillStyle = '#6d4c41';
            g.fillRect(-0.7, -8, 1.4, 5);
            leaf(3, -6);
        }
        else if (name === 'grapes') {
            for (const [a, b] of [[-4, -2], [0, -2], [4, -2], [-2, 2], [2, 2], [0, 6]])
                ball(a, b, 3, '#8e24aa');
            leaf(1, -7);
        }
        else {
            ball(0, 1, 8, '#43a047');
            g.strokeStyle = '#a5d6a7';
            g.lineWidth = 1.3;
            for (const a of [-4, 0, 4]) {
                g.beginPath();
                g.ellipse(a * 0.8, 1, 1.5, 7, 0, 0, 7);
                g.stroke();
            }
        }
        g.restore();
    }
    function drawGhost(g, gh) {
        const x = gh.x * T + T / 2, y = gh.y * T + T / 2, r = T * 0.48;
        const eyesOnly = gh.state === 'eyes' || gh.state === 'enter';
        if (!eyesOnly) {
            let col = gh.color;
            if (gh.fright) col = frightT < 2 && Math.floor(frightT * 6) % 2 === 0 ? '#f5f5f5' : '#3a5bff';
            g.fillStyle = 'rgba(0,0,0,.28)';
            g.beginPath(); g.ellipse(x, y + r + 1, r * 0.8, 2.5, 0, 0, 7); g.fill();
            const gr = g.createLinearGradient(x - r, y - r, x + r, y + r);
            gr.addColorStop(0, shade(col, 0.35));
            gr.addColorStop(1, shade(col, -0.2));
            g.fillStyle = gr;
            g.shadowColor = col;
            g.shadowBlur = 8;
            g.beginPath();
            g.arc(x, y - 1, r, Math.PI, 0);
            const base = y + r - 1, n = 3, w = (r * 2) / n, ph = Math.floor(gh.bob * 1.5) % 2;
            g.lineTo(x + r, base);
            for (let i = n - 1; i >= 0; i--) {
                const sx = x - r + i * w;
                g.lineTo(sx + w * (ph ? 0.75 : 0.5), base - 4);
                g.lineTo(sx, base);
            }
            g.closePath();
            g.fill();
            g.shadowBlur = 0;
            g.fillStyle = 'rgba(255,255,255,.35)';
            g.beginPath(); g.ellipse(x - r * 0.45, y - r * 0.55, r * 0.22, r * 0.12, -0.6, 0, 7); g.fill();
            if (gh.fright) {
                g.fillStyle = col === '#3a5bff' ? '#ffd2a6' : '#e53935';
                g.fillRect(x - 5, y - 4, 3, 3);
                g.fillRect(x + 2, y - 4, 3, 3);
                g.strokeStyle = g.fillStyle;
                g.lineWidth = 1.5;
                g.beginPath();
                for (let i = 0; i <= 4; i++) g.lineTo(x - 7 + i * 3.5, y + 4 + (i % 2 ? -2 : 1));
                g.stroke();
                return;
            }
        }
        const lx = gh.dx * 2.2, ly = gh.dy * 2.2;
        for (const s of [-1, 1]) {
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.ellipse(x + s * 4.6 + lx * 0.5, y - 3 + ly * 0.5, 3.6, 4.6, 0, 0, 7);
            g.fill();
            g.fillStyle = '#1a237e';
            g.beginPath();
            g.arc(x + s * 4.6 + lx, y - 3 + ly, 2, 0, 7);
            g.fill();
        }
    }
    function drawPlayer(g) {
        const x = pl.x * T + T / 2, y = pl.y * T + T / 2, r = T * 0.47;
        let open = (Math.sin(pl.dist * Math.PI * 1.6) * 0.5 + 0.5) * 0.85 + 0.06;
        if (A.state === 'menu') open = (Math.sin(A.time * 8) * 0.5 + 0.5) * 0.85 + 0.06;
        const ang = Math.atan2(pl.face[1], pl.face[0]);
        const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, 1, x, y, r);
        gr.addColorStop(0, '#fff59d');
        gr.addColorStop(0.55, '#ffd400');
        gr.addColorStop(1, '#f9a825');
        g.fillStyle = gr;
        g.shadowColor = frightT > 0 ? '#ffffff' : '#ffd400';
        g.shadowBlur = frightT > 0 ? 16 : 8;
        g.beginPath();
        if (pl.dying > 0) {
            const a = Math.PI * Math.min(1, pl.dying);
            if (a >= Math.PI - 0.01) { g.shadowBlur = 0; return; }
            g.moveTo(x, y);
            g.arc(x, y, r, -Math.PI / 2 + a, -Math.PI / 2 - a + Math.PI * 2);
        }
        else {
            g.moveTo(x, y);
            g.arc(x, y, r, ang + open * 0.5, ang - open * 0.5 + Math.PI * 2);
        }
        g.closePath();
        g.fill();
        g.shadowBlur = 0;
        if (!pl.dying) {
            g.fillStyle = '#3d2b00';
            const [fx, fy] = pl.face;
            const px = fx < 0 ? -fy : fy, py = fx < 0 ? fx : -fx;
            g.beginPath();
            g.arc(x + fx * r * 0.12 + px * r * 0.5, y + fy * r * 0.12 + py * r * 0.5, 1.8, 0, 7);
            g.fill();
        }
    }
    function buildMaze() {
        const M = MAZES[mazeI], dark = A.dark, S = 2;
        const c = document.createElement('canvas');
        c.width = W * S; c.height = H * S;
        const g = c.getContext('2d');
        g.scale(S, S);
        const bg = dark ? M.dbg : M.bg;
        const rg = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.8);
        rg.addColorStop(0, shade(bg, 0.08));
        rg.addColorStop(1, shade(bg, -0.35));
        g.fillStyle = rg;
        g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,255,255,.035)';
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2 === 0) g.fillRect(x * T + T / 2 - 0.5, y * T + T / 2 - 0.5, 1, 1);
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.strokeStyle = M.wall;
        g.lineWidth = T * 0.66;
        g.shadowColor = M.wall;
        g.shadowBlur = 14;
        g.stroke(wallPath);
        g.shadowBlur = 0;
        g.strokeStyle = shade(bg, -0.2);
        g.lineWidth = T * 0.66 - 5;
        g.stroke(wallPath);
        g.strokeStyle = M.wall;
        g.globalAlpha = 0.18;
        g.lineWidth = T * 0.66 - 10;
        g.stroke(wallPath);
        g.globalAlpha = 0.5;
        g.lineWidth = 1.2;
        g.strokeStyle = shade(M.wall, 0.5);
        g.stroke(wallPath);
        g.globalAlpha = 1;
        g.fillStyle = '#ff9ccf';
        g.fillRect(9 * T + 1, 8 * T + T / 2 - 2, T - 2, 4);
        mazeCache = c;
        mazeCacheKey = mazeI + ':' + dark;
    }
    function draw(g) {
        const M = MAZES[mazeI];
        if (!mazeCache || mazeCacheKey !== mazeI + ':' + A.dark) buildMaze();
        const flashing = phase === 'clear' && Math.floor(flashT * 5) % 2 === 1;
        g.drawImage(mazeCache, 0, 0, W, H);
        if (flashing) {
            g.globalCompositeOperation = 'lighter';
            g.globalAlpha = 0.6;
            g.drawImage(mazeCache, 0, 0, W, H);
            g.globalAlpha = 1;
            g.globalCompositeOperation = 'source-over';
        }
        for (let y = 0; y < ROWS; y++)
            for (let x = 0; x < COLS; x++) {
                const c = grid[y][x];
                if (c === '.') {
                    g.fillStyle = M.dot;
                    g.beginPath();
                    g.arc(x * T + T / 2, y * T + T / 2, 2.4, 0, 7);
                    g.fill();
                }
                else if (c === 'o') {
                    const px = x * T + T / 2, py = y * T + T / 2, pulse = 0.5 + 0.5 * Math.sin(A.time * 6);
                    const hg = g.createRadialGradient(px, py, 2, px, py, 14);
                    hg.addColorStop(0, `rgba(255,236,179,${0.5 * pulse})`);
                    hg.addColorStop(1, 'rgba(255,236,179,0)');
                    g.fillStyle = hg;
                    g.fillRect(px - 14, py - 14, 28, 28);
                    g.fillStyle = M.dot;
                    g.beginPath();
                    g.arc(px, py, 5.5 + pulse * 1.5, 0, 7);
                    g.fill();
                }
            }
        if (fruit) {
            const fx = 9 * T + T / 2, fy = 11 * T + T / 2;
            g.fillStyle = `rgba(255,213,79,${0.2 + 0.1 * Math.sin(A.time * 5)})`;
            g.beginPath(); g.arc(fx, fy, 13, 0, 7); g.fill();
            drawFruit(g, fruit.name, fx, fy, 1.1 + Math.sin(A.time * 5) * 0.06);
        }
        if (frightT > 0 && A.state === 'play') {
            for (let i = 0; i < trail.length; i++) {
                const t = trail[i];
                g.fillStyle = `rgba(255,212,0,${(i / trail.length) * 0.25})`;
                g.beginPath(); g.arc(t[0], t[1], T * 0.3 * (i / trail.length), 0, 7); g.fill();
            }
        }
        if (phase !== 'clear')
            for (const gh of ghosts)
                if (!(phase === 'dying' && phaseT < 1.7)) drawGhost(g, gh);
        drawPlayer(g);
        A.fx.draw(g);
        if (mode === 'lantern' && A.state !== 'menu') {
            const px = pl.x * T + T / 2, py = pl.y * T + T / 2;
            const rr = (frightT > 0 ? 120 : 82) + Math.sin(A.time * 3) * 4;
            const lg = g.createRadialGradient(px, py, rr * 0.35, px, py, rr);
            lg.addColorStop(0, 'rgba(2,2,10,0)');
            lg.addColorStop(1, 'rgba(2,2,10,.9)');
            g.fillStyle = lg;
            g.fillRect(0, 0, W, H);
            for (const gh of ghosts) {
                if (gh.state === 'house') continue;
                const ex = gh.x * T + T / 2, ey = gh.y * T + T / 2;
                if (Math.hypot(ex - px, ey - py) < rr * 0.8) continue;
                for (const s of [-1, 1]) { g.fillStyle = gh.fright ? '#9fa8ff' : '#ffffff'; g.globalAlpha = 0.7; g.beginPath(); g.arc(ex + s * 4.6, ey - 3, 1.8, 0, 7); g.fill(); }
                g.globalAlpha = 1;
            }
        }
        g.textAlign = 'center';
        if (A.state === 'play' && phase === 'ready') {
            g.font = `900 18px ${FONT}`;
            g.lineWidth = 5;
            g.strokeStyle = 'rgba(0,0,0,.6)';
            g.fillStyle = '#ffd400';
            const sc = 1 + Math.sin(A.time * 8) * 0.05;
            g.save(); g.translate(W / 2, 11 * T + T / 2 + 6); g.scale(sc, sc);
            g.strokeText('READY!', 0, 0); g.fillText('READY!', 0, 0);
            g.font = `800 11px ${FONT}`;
            g.fillStyle = M.wall;
            g.strokeText(M.name.toUpperCase(), 0, -64); g.fillText(M.name.toUpperCase(), 0, -64);
            g.restore();
        }
        if (banner && phase === 'clear') {
            g.font = `900 30px ${FONT}`;
            g.lineWidth = 6;
            g.strokeStyle = '#0d0d3b';
            g.fillStyle = '#ffffff';
            g.strokeText(banner.text, W / 2, 11 * T + 10);
            g.fillText(banner.text, W / 2, 11 * T + 10);
            g.font = `800 16px ${FONT}`;
            g.fillStyle = '#ffd400';
            g.strokeText(banner.sub, W / 2, 11 * T + 34);
            g.fillText(banner.sub, W / 2, 11 * T + 34);
        }
        if (mm && mm.mult > 1 && A.state === 'play') {
            g.textAlign = 'right';
            g.font = `800 11px ${FONT}`;
            g.fillStyle = 'rgba(255,255,255,.6)';
            g.fillText(`${mm.name} x${mm.mult}`, W - 6, H - 6);
        }
    }
    A.debug = () => ({
        phase, dots, level, lives, scatter, frightT, pl: { x: pl.x, y: pl.y, dx: pl.dx, dy: pl.dy, want: pl.want },
        ghosts: ghosts.map((g) => ({ x: g.x, y: g.y, state: g.state, fright: g.fright })),
        eatAllBut(n) { let k = dots - n; for (let y = 0; y < ROWS && k > 0; y++) for (let x = 0; x < COLS && k > 0; x++) if (grid[y][x] === '.' || grid[y][x] === 'o') { grid[y][x] = ' '; dots--; eaten++; k--; } },
        power() { for (const g of ghosts) if (g.state === 'out') { g.fright = true; reverse(g); } frightT = frightLen; },
        ghostOnPlayer(i) { const g = ghosts[i]; g.state = 'out'; g.x = Math.round(pl.x); g.y = Math.round(pl.y); g.tx = g.x; g.ty = g.y; },
        skipReady() { phaseT = 0; },
        toLevel(n) { level = n; setMaze(n - 1); resetDots(); startLife(false); hud(); }
    });
    reset();
    A.boot();
})();
