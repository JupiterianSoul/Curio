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
    const W = 400, G = 1500, JUMP = -760, SPRING = -1260, PW = 64, PHT = 14, HW = 15;
    let H = 700;
    const SKINS = [['frog', '🐸', 'Frog', 0, '#8bc34a', '#7cb342', '#2e7d32'], ['bunny', '🐰', 'Bunny', 1500, '#f5f5f5', '#e0e0e0', '#bdbdbd'], ['robot', '🤖', 'Robot', 3000, '#90a4ae', '#78909c', '#455a64'], ['cat', '🐱', 'Cat', 5000, '#ffb74d', '#ffa726', '#e65100'], ['astro', '🧑‍🚀', 'Astronaut', 8000, '#eceff1', '#cfd8dc', '#607d8b']];
    const ZONES = [[0, 'Blue Sky', ['#e3f2fd', '#f7fbff'], ['#101828', '#16233a']], [2000, 'Sunset Strip', ['#ffccbc', '#fff3e0'], ['#2a1530', '#3a1f2a']], [5000, 'Night Sky', ['#283593', '#5c6bc0'], ['#0b0f2a', '#151a40']], [10000, 'Outer Space', ['#070818', '#1a1440'], ['#03040c', '#0d0a24']]];
    const BADGES = [
        ['h1k', '🌤️', 'Lift off', 'Reach 1,000'],
        ['h3k', '🌇', 'Sunset rider', 'Reach the Sunset Strip (2,000)'],
        ['h5k', '🌙', 'Night owl', 'Reach the Night Sky (5,000)'],
        ['h10k', '🚀', 'Spacewalker', 'Reach Outer Space (10,000)'],
        ['h20k', '🪐', 'Interstellar', 'Reach 20,000'],
        ['stomp', '👾', 'Monster masher', 'Stomp 10 monsters in total'],
        ['ufo', '🛸', 'Close encounter', 'Stomp a UFO'],
        ['jet', '🎒', 'Jet set', 'Use a jetpack'],
        ['stars50', '⭐', 'Stargazer', 'Collect 50 stars in one run'],
        ['shield', '🫧', 'Bubble boy', 'Survive a monster with a shield'],
        ['springs', '🌀', 'Boing boing', 'Hit 5 springs in one run'],
        ['skin', '🎭', 'Dress up', 'Unlock a new hopper']
    ];
    let skin = 'frog', items = [], jetT = 0, propT = 0, shieldOn = false, stars = 0, stomps = 0, springs = 0, zoneShown = 0, sign = null, trail = [];
    const zoneAt = (h) => ZONES.reduce((a, z) => (h >= z[0] ? z : a), ZONES[0]);
    let hero, plats, mons, camTop, genY, startY, maxH, ptrs, deadT, clouds, popups, mile, broke;
    const A = Arcade({
        width: W, height: H, size, reset, update, draw, key, pointer, idle, badges: BADGES, touchTip: 'Tip: steer with the arrow keys, or just move the pointer left and right over the sky. No clicking needed.',
        menuStats: () => [[' games', Curio.fmt(A.profile.games || 0)], [' stars', Curio.fmt(A.stat('stars'))], [' monsters stomped', Curio.fmt(A.stat('stomps'))], [' best', Curio.fmt(A.stat('top'))]],
        menu: () => paintSkins()
    });
    skin = Curio.store.get('sky-skin', 'frog');
    function paintSkins() {
        const box = document.getElementById('skins');
        if (!box) return;
        box.innerHTML = '';
        const top = Math.max(A.stat('top'), Curio.getBest('score') || 0);
        if (!SKINS.some((k) => k[0] === skin && top >= k[3])) skin = 'frog';
        for (const [id, em, name, need] of SKINS) {
            const b = document.createElement('button');
            b.type = 'button';
            const locked = top < need;
            b.className = 'sh-skin';
            b.disabled = locked;
            b.setAttribute('aria-pressed', String(id === skin));
            b.innerHTML = '<span></span><small></small>';
            b.firstChild.textContent = locked ? '🔒' : em;
            b.lastChild.textContent = locked ? Curio.fmt(need) : name;
            b.title = locked ? `Reach ${Curio.fmt(need)} to unlock the ${name}` : `Play as the ${name}`;
            b.addEventListener('click', () => { skin = id; Curio.store.set('sky-skin', id); Curio.beep(700, 0.05, 'triangle', 0.07); paintSkins(); });
            box.append(b);
        }
    }
    function size(aw, ah) {
        H = Math.round(Math.max(560, Math.min(980, W * ah / aw)));
        return { w: W, h: H };
    }
    const rnd = (a, b) => a + Math.random() * (b - a);
    function reset() {
        startY = H - 60;
        hero = { x: W / 2, y: startY - 10, vx: 0, vy: JUMP, face: 1, squash: 0, dead: false, spin: 0 };
        plats = [{ x: W / 2 - PW / 2, y: startY, type: 'normal', vx: 0, spring: null, gone: 0 }];
        mons = [];
        popups = [];
        broke = [];
        camTop = 0;
        genY = startY;
        maxH = 0;
        mile = 1000;
        deadT = 0;
        ptrs = new Map();
        items = []; jetT = 0; propT = 0; shieldOn = false; stars = 0; stomps = 0; springs = 0; zoneShown = 0; sign = null; trail = [];
        clouds = Array.from({ length: 7 }, () => ({ x: Math.random() * W, y: Math.random() * H * 2, s: rnd(0.6, 1.3), p: rnd(0.15, 0.4) }));
        A.fx.clear();
        generate();
    }
    const heightOf = (y) => Math.max(0, Math.round((startY - y) / 10));
    function generate() {
        while (genY > camTop - 240) {
            const d = Math.min(1, (startY - genY) / 30000);
            const gap = rnd(46 + 64 * d, 80 + 96 * d);
            const prevY = genY;
            genY -= gap;
            const r = Math.random();
            let type = 'normal';
            if (r < 0.08 + 0.32 * d)
                type = 'moving';
            else if (r < 0.12 + 0.46 * d && startY - genY > 1500)
                type = 'vanish';
            const p = { x: rnd(4, W - PW - 4), y: genY, type, vx: type === 'moving' ? (Math.random() < 0.5 ? -1 : 1) * rnd(50, 90 + 90 * d) : 0, spring: null, gone: 0 };
            if (type === 'normal' && Math.random() < 0.07 && startY - genY > 300)
                p.spring = { off: rnd(8, PW - 24), t: 0 };
            plats.push(p);
            const hh = startY - genY;
            if (type === 'normal' && !p.spring && hh > 500) {
                const r2 = Math.random();
                const kind = r2 < 0.012 ? 'jet' : r2 < 0.03 ? 'prop' : r2 < 0.045 ? 'shield' : null;
                if (kind) items.push({ x: p.x + PW / 2, y: p.y - 22, kind, t: Math.random() * 6 });
            }
            if (Math.random() < 0.3) items.push({ x: rnd(20, W - 20), y: genY + gap * rnd(0.3, 0.7), kind: 'star', t: Math.random() * 6 });
            if (Math.random() < 0.12 + 0.22 * d && startY - genY > 400) {
                const by = prevY - gap * rnd(0.35, 0.65);
                plats.push({ x: rnd(4, W - PW - 4), y: by, type: 'break', vx: 0, spring: null, gone: 0 });
            }
            if (startY - genY > 2500 && Math.random() < 0.035 + 0.06 * d) {
                const my = genY - gap * 0.5;
                mons.push({ x: rnd(40, W - 40), y: my, bx: 0, t: Math.random() * 6, dead: false, vy: 0, kind: startY - genY > 80000 && Math.random() < 0.5 ? 2 : Math.random() < 0.5 ? 0 : 1, range: rnd(20, 80) });
                mons[mons.length - 1].bx = mons[mons.length - 1].x;
            }
        }
    }
    function key() { }
    const lift = (e) => ptrs && ptrs.delete(e.pointerId);
    addEventListener('pointerup', lift);
    addEventListener('pointercancel', lift);
    let hoverX = null, hoverT = 0;
    function pointer(type, p, e) {
        if (type === 'move' && e.pointerType === 'mouse' && !(e.buttons & 1)) {
            const r = A.canvas.getBoundingClientRect();
            if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { hoverX = p.x; hoverT = performance.now(); }
            return;
        }
        if (type === 'up') {
            ptrs.delete(e.pointerId);
            return;
        }
        if (e.pointerType === 'mouse' && !(e.buttons & 1))
            return;
        ptrs.set(e.pointerId, { side: p.x < W / 2 ? -1 : 1, t: performance.now() });
    }
    function steer() {
        const k = A.keys;
        let s = (k.has('ArrowRight') || k.has('d') ? 1 : 0) - (k.has('ArrowLeft') || k.has('a') ? 1 : 0);
        if (!s && ptrs.size) {
            let last = null;
            for (const v of ptrs.values())
                if (!last || v.t > last.t)
                    last = v;
            s = last.side;
        }
        if (!s && hoverX != null && performance.now() - hoverT < 2500 && hero) {
            let dx = hoverX - hero.x;
            if (Math.abs(dx) > W / 2) dx -= Math.sign(dx) * W;
            if (Math.abs(dx) > 16) s = Math.sign(dx);
        }
        return s;
    }
    function bounce(v, x, y) {
        hero.vy = v;
        hero.squash = 1;
        A.buzz(v === SPRING ? 30 : 8);
        if (v === SPRING) {
            springs++;
            if (springs >= 5) A.unlock('springs');
            A.fx.ring(x, y, '#ffd54f', 36, 0.4, 3);
            A.sweep(300, 1400, 0.35, 'square', 0.06);
            A.fx.burst(x, y, 12, ['#ffd54f', '#ffffff'], { speed: 160, life: 0.5, size: 4, gravity: 300, angle: -Math.PI / 2, spread: 2 });
        }
        else
            A.sweep(380, 760, 0.12, 'triangle', 0.08);
    }
    function die() {
        if (hero.dead)
            return;
        if (shieldOn) {
            shieldOn = false;
            hero.vy = JUMP;
            A.fx.ring(hero.x, hero.y, '#80deea', 50, 0.5, 4);
            A.fx.burst(hero.x, hero.y, 20, ['#80deea', '#ffffff'], { speed: 200, life: 0.5, size: 4, gravity: 0, round: true });
            A.sweep(900, 200, 0.3, 'triangle', 0.08);
            A.unlock('shield');
            for (const m of mons) if (!m.dead && Math.abs(m.x - hero.x) < 40 && Math.abs(m.y - hero.y) < 40) { m.dead = true; m.vy = -100; }
            return;
        }
        A.shake(10);
        A.buzz([40, 40, 120]);
        hero.dead = true;
        hero.vy = Math.min(hero.vy, -200);
        A.sweep(700, 90, 0.9, 'sawtooth', 0.07);
    }
    function update(dt) {
        A.fx.update(dt);
        for (let i = popups.length - 1; i >= 0; i--) {
            popups[i].t += dt;
            if (popups[i].t > 1.2)
                popups.splice(i, 1);
        }
        for (let i = broke.length - 1; i >= 0; i--) {
            const b = broke[i];
            b.vy += G * dt;
            b.y += b.vy * dt;
            b.r += b.vr * dt;
            if (b.y > camTop + H + 60)
                broke.splice(i, 1);
        }
        const s = hero.dead ? 0 : steer();
        if (s)
            hero.face = s;
        hero.vx += (s * 380 - hero.vx) * Math.min(1, dt * (s ? 9 : 6));
        const oy = hero.y;
        if (jetT > 0 && !hero.dead) {
            jetT -= dt;
            hero.vy = -1150;
            if (Math.random() < 0.7) A.fx.burst(hero.x - hero.face * 8, hero.y + 18, 2, ['#ffd54f', '#ff7043', '#ffffff'], { speed: 120, life: 0.35, size: 4, gravity: -100, angle: Math.PI / 2, spread: 0.8, round: true });
        }
        else if (propT > 0 && !hero.dead) {
            propT -= dt;
            hero.vy = -620;
        }
        hero.vy += G * dt;
        hero.x += hero.vx * dt;
        hero.y += hero.vy * dt;
        hero.squash = Math.max(0, hero.squash - dt * 5);
        if (hero.dead)
            hero.spin += dt * 9;
        if (hero.x < -HW)
            hero.x += W + HW * 2;
        if (hero.x > W + HW)
            hero.x -= W + HW * 2;
        for (const p of plats) {
            if (p.type === 'moving') {
                p.x += p.vx * dt;
                if (p.x < 2 || p.x > W - PW - 2) {
                    p.vx = -p.vx;
                    p.x = Math.max(2, Math.min(W - PW - 2, p.x));
                }
            }
            if (p.gone)
                p.gone += dt;
            if (p.spring && p.spring.t > 0)
                p.spring.t = Math.max(0, p.spring.t - dt);
        }
        if (!hero.dead && hero.vy > 0) {
            const feet = hero.y + 20, ofeet = oy + 20;
            for (const p of plats) {
                if (p.gone || feet < p.y || ofeet > p.y + 6)
                    continue;
                if (hero.x + HW * 0.9 < p.x || hero.x - HW * 0.9 > p.x + PW)
                    continue;
                if (p.type === 'break') {
                    p.gone = 0.001;
                    broke.push({ x: p.x, y: p.y, w: PW / 2, vy: 40, r: 0, vr: -2 }, { x: p.x + PW / 2, y: p.y, w: PW / 2, vy: 60, r: 0, vr: 2.4 });
                    A.noise(0.25, 0.14, 1400);
                    A.beep(160, 0.1, 'square', 0.05);
                    continue;
                }
                hero.y = p.y - 20;
                if (p.spring && hero.x > p.x + p.spring.off - 4 && hero.x < p.x + p.spring.off + 20) {
                    p.spring.t = 0.25;
                    bounce(SPRING, hero.x, p.y);
                }
                else
                    bounce(JUMP, hero.x, p.y);
                if (p.type === 'vanish') {
                    p.gone = 0.001;
                    A.fx.burst(p.x + PW / 2, p.y, 14, ['#ffffff', '#e1f5fe'], { speed: 120, life: 0.5, size: 5, gravity: 100 });
                }
                break;
            }
        }
        for (const it of items) {
            it.t += dt;
            if (it.taken || hero.dead) continue;
            if (Math.abs(it.x - hero.x) < 24 && Math.abs(it.y - (hero.y - 10)) < 28) {
                it.taken = true;
                if (it.kind === 'star') {
                    stars++;
                    A.stat('stars', 1);
                    if (stars >= 50) A.unlock('stars50');
                    A.beep(1320 + (stars % 5) * 120, 0.05, 'triangle', 0.06);
                    A.fx.burst(it.x, it.y, 6, ['#ffd54f', '#ffffff'], { speed: 90, life: 0.4, size: 3, gravity: 0, round: true });
                    continue;
                }
                if (it.kind === 'jet') { jetT = 2.4; propT = 0; A.unlock('jet'); A.fx.text(it.x, it.y - 20, 'Jetpack!', '#ff7043', 18, 1); A.sweep(200, 900, 0.6, 'sawtooth', 0.06); }
                else if (it.kind === 'prop') { propT = 1.6; A.fx.text(it.x, it.y - 20, 'Propeller!', '#29b6f6', 18, 1); A.sweep(400, 800, 0.4, 'square', 0.05); }
                else { shieldOn = true; A.fx.text(it.x, it.y - 20, 'Shield!', '#26c6da', 18, 1); A.chord([660, 990, 1320], 50, 0.07, 'triangle', 0.08); }
                A.fx.ring(it.x, it.y, '#ffffff', 40, 0.4, 3);
                A.buzz(25);
            }
        }
        for (const m of mons) {
            m.t += dt;
            if (m.dead) {
                m.vy += G * dt;
                m.y += m.vy * dt;
                continue;
            }
            m.x = m.bx + Math.sin(m.t * 1.6) * m.range;
            if (hero.dead)
                continue;
            const dx = hero.x - m.x, dy = hero.y - m.y;
            if (Math.abs(dx) < 30 && Math.abs(dy) < 32) {
                if (jetT > 0 || propT > 0) {
                    m.dead = true;
                    m.vy = -200;
                    A.fx.burst(m.x, m.y, 18, ['#7e57c2', '#b39ddb', '#ffffff'], { speed: 200, life: 0.6, size: 5, gravity: 300 });
                    A.beep(880, 0.07, 'square', 0.06);
                    continue;
                }
                if (hero.vy > 0 && hero.y < m.y - 6) {
                    stomps++;
                    A.stat('stomps', 1);
                    if (A.stat('stomps') >= 10) A.unlock('stomp');
                    if (m.kind === 2) A.unlock('ufo');
                    A.shake(4);
                    m.dead = true;
                    m.vy = -100;
                    bounce(JUMP * 1.05, hero.x, m.y);
                    A.fx.text(m.x, m.y - 30, m.kind === 2 ? 'UFO down!' : 'Stomp!', '#ff5a36', 20, 1);
                    A.fx.burst(m.x, m.y, 18, ['#7e57c2', '#b39ddb', '#ffffff'], { speed: 200, life: 0.6, size: 5, gravity: 300 });
                    [880, 1100].forEach((f, i) => setTimeout(() => A.beep(f, 0.07, 'square', 0.06), i * 60));
                }
                else
                    die();
            }
        }
        const want = hero.y - H * 0.42;
        if (!hero.dead && want < camTop)
            camTop = want;
        const h = heightOf(hero.y);
        if (h > maxH && !hero.dead) {
            maxH = h;
            A.setScore(maxH);
            for (const [n, id] of [[1000, 'h1k'], [2000, 'h3k'], [5000, 'h5k'], [10000, 'h10k'], [20000, 'h20k']]) if (maxH >= n) A.unlock(id);
            const zi = ZONES.indexOf(zoneAt(maxH));
            if (zi > zoneShown) { zoneShown = zi; sign = { text: ZONES[zi][1], t: 0 }; A.chord([523, 659, 784, 1047], 80, 0.1, 'triangle', 0.08); }
            const prevTop = A.stat('top');
            if (A.statMax('top', maxH)) { const sk = SKINS.find((k) => k[3] > prevTop && k[3] <= maxH && k[3] > 0); if (sk) { Curio.toast(`${sk[1]} ${sk[2]} unlocked!`); A.unlock('skin'); } }
            if (maxH >= mile) {
                popups.push({ x: W / 2, y: hero.y - 60, text: `${Curio.fmt(mile)}!`, t: 0 });
                [660, 880, 1320].forEach((f, i) => setTimeout(() => A.beep(f, 0.08, 'triangle', 0.08), i * 70));
                mile += 1000;
            }
        }
        generate();
        plats = plats.filter((p) => p.y < camTop + H + 40 && (!p.gone || p.gone < 0.3));
        mons = mons.filter((m) => m.y < camTop + H + 80);
        items = items.filter((it) => it.y < camTop + H + 40 && !it.taken);
        if (sign) { sign.t += dt; if (sign.t > 2.4) sign = null; }
        if (hero.y > camTop + H + 40) {
            if (!deadT) {
                deadT = 0.5;
                if (!hero.dead)
                    A.sweep(600, 120, 0.7, 'sine', 0.08);
            }
        }
        if (deadT) {
            deadT -= dt;
            if (deadT <= 0) {
                deadT = 0;
                const msgs = maxH > 5000 ? ['You touched the stratosphere. The birds are jealous.', 'That is higher than most kites ever get.'] : maxH > 1500 ? ['Solid altitude. Gravity always wins eventually.', 'Not bad! The clouds were starting to recognise you.'] : ['Gravity: 1, you: 0. Keep bouncing.', 'Down you go. Try steering toward the green ones.'];
                const zn = zoneAt(maxH)[1];
                A.over({
                    title: hero.dead ? 'Bonk!' : 'Splat!', emoji: hero.dead ? '👾' : SKINS.find((k) => k[0] === skin)[1], msg: `${Curio.fmt(maxH)} high. ${hero.dead ? 'A monster got you. Land on their heads, not their faces.' : Curio.pick(msgs)}`,
                    lines: [[' high', Curio.fmt(maxH)], [' stars', stars], [' stomps', stomps], [' zone', zn]],
                    share: `🦘 Zoble Sky Hopper: ${Curio.fmt(maxH)} high\n🌌 Reached ${zn} · ⭐ ${stars} stars · 👾 ${stomps} stomps`
                });
            }
        }
    }
    function idle(dt) {
        A.fx.update(dt);
        if (A.state === 'menu' && hero) {
            hero.vy += G * dt;
            hero.y += hero.vy * dt;
            if (hero.y > startY - 20) {
                hero.y = startY - 20;
                hero.vy = JUMP;
                hero.squash = 1;
            }
            hero.squash = Math.max(0, hero.squash - dt * 5);
            camTop = Math.min(0, hero.y - H * 0.42);
        }
    }
    function drawPlat(g, p) {
        const y = p.y - camTop;
        if (p.gone && p.type === 'vanish')
            g.globalAlpha = Math.max(0, 1 - p.gone * 4);
        if (p.type === 'break' && p.gone)
            return;
        const cols = { normal: ['#66bb6a', '#388e3c'], moving: ['#42a5f5', '#1565c0'], vanish: ['#ffffff', '#b0bec5'], break: ['#a1887f', '#6d4c41'] }[p.type];
        g.fillStyle = 'rgba(0,0,0,.12)';
        rrect(g, p.x + 3, y + 4, PW, PHT, 7);
        g.fill();
        g.fillStyle = cols[1];
        rrect(g, p.x, y + 2, PW, PHT, 7);
        g.fill();
        g.fillStyle = cols[0];
        rrect(g, p.x, y, PW, PHT - 3, 7);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.45)';
        g.fillRect(p.x + 8, y + 3, PW - 16, 2);
        if (p.type === 'break') {
            g.strokeStyle = '#4e342e';
            g.lineWidth = 1.5;
            g.beginPath();
            g.moveTo(p.x + PW / 2 - 2, y);
            g.lineTo(p.x + PW / 2 + 3, y + 6);
            g.lineTo(p.x + PW / 2 - 1, y + PHT);
            g.stroke();
        }
        if (p.spring) {
            const sx = p.x + p.spring.off, comp = p.spring.t > 0 ? 0.5 : 1;
            g.strokeStyle = '#90a4ae';
            g.lineWidth = 2.5;
            g.beginPath();
            for (let i = 0; i <= 4; i++)
                g.lineTo(sx + (i % 2 ? 14 : 2), y - i * 3.5 * comp);
            g.stroke();
            g.fillStyle = '#e53935';
            rrect(g, sx - 1, y - 16 * comp - 3, 18, 5, 2);
            g.fill();
        }
        g.globalAlpha = 1;
    }
    function drawMonster(g, m) {
        const x = m.x, y = m.y - camTop;
        g.save();
        g.translate(x, y);
        if (m.dead)
            g.rotate(m.t * 6);
        if (m.kind === 2) {
            g.fillStyle = 'rgba(178,255,89,.18)';
            g.beginPath(); g.moveTo(-10, 6); g.lineTo(10, 6); g.lineTo(26, 60); g.lineTo(-26, 60); g.fill();
            g.fillStyle = '#b2ebf2';
            g.beginPath(); g.ellipse(0, -8, 13, 12, 0, Math.PI, 0); g.fill();
            g.fillStyle = '#76ff03';
            g.beginPath(); g.arc(0, -10, 5, 0, 7); g.fill();
            g.fillStyle = '#212121'; g.beginPath(); g.arc(-2, -11, 1.4, 0, 7); g.arc(2, -11, 1.4, 0, 7); g.fill();
            const sg = g.createLinearGradient(0, -8, 0, 8);
            sg.addColorStop(0, '#cfd8dc'); sg.addColorStop(1, '#607d8b');
            g.fillStyle = sg;
            g.beginPath(); g.ellipse(0, 0, 28, 9, 0, 0, 7); g.fill();
            for (let i = -2; i <= 2; i++) { g.fillStyle = (Math.floor(m.t * 8) + i) % 2 ? '#ffeb3b' : '#ff5252'; g.beginPath(); g.arc(i * 10, 1, 2.2, 0, 7); g.fill(); }
            g.restore();
            return;
        }
        const flap = Math.sin(m.t * 18) * 6;
        g.fillStyle = m.kind ? '#ef5350' : '#7e57c2';
        g.beginPath();
        g.ellipse(-24, -4 + flap, 12, 6, -0.4, 0, 7);
        g.ellipse(24, -4 + flap, 12, 6, 0.4, 0, 7);
        g.fill();
        g.fillStyle = m.kind ? '#e53935' : '#673ab7';
        g.beginPath();
        g.arc(0, 0, 20, 0, 7);
        g.fill();
        g.fillStyle = m.kind ? '#ffcdd2' : '#d1c4e9';
        g.beginPath();
        g.moveTo(-12, -14);
        g.lineTo(-7, -26);
        g.lineTo(-3, -16);
        g.moveTo(12, -14);
        g.lineTo(7, -26);
        g.lineTo(3, -16);
        g.fill();
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(-7, -3, 6, 0, 7);
        g.arc(7, -3, 6, 0, 7);
        g.fill();
        g.fillStyle = '#212121';
        const lx = Math.max(-2, Math.min(2, (hero.x - x) / 40)), ly = Math.max(-2, Math.min(2, (hero.y - m.y) / 40));
        g.beginPath();
        g.arc(-7 + lx, -3 + ly, 2.6, 0, 7);
        g.arc(7 + lx, -3 + ly, 2.6, 0, 7);
        g.fill();
        g.fillStyle = '#ffffff';
        for (let i = -2; i <= 2; i++) {
            g.beginPath();
            g.moveTo(i * 4 - 2, 8);
            g.lineTo(i * 4 + 2, 8);
            g.lineTo(i * 4, 12);
            g.fill();
        }
        g.restore();
    }
    function drawHero(g, ox = 0) {
        const x = hero.x + ox, y = hero.y - camTop;
        const sq = hero.squash, sy = 1 - sq * 0.25 + (hero.vy < -300 ? 0.08 : 0), sx = 1 + sq * 0.22;
        g.save();
        g.translate(x, y + 20);
        if (hero.dead)
            g.rotate(hero.spin);
        g.scale(sx * hero.face, sy);
        const K = SKINS.find((k) => k[0] === skin) || SKINS[0];
        if (jetT > 0) {
            g.fillStyle = '#78909c';
            rrect(g, -24, -34, 10, 24, 4); g.fill();
            g.fillStyle = '#ff7043';
            g.beginPath(); g.moveTo(-23, -10); g.lineTo(-15, -10); g.lineTo(-19, -10 + 10 + Math.random() * 10); g.fill();
        }
        g.fillStyle = K[6];
        const leg = hero.vy < 0 ? 4 : 8;
        g.fillRect(-9, -8, 4, leg);
        g.fillRect(5, -8, 4, leg);
        g.fillRect(-12, -8 + leg - 2, 8, 3);
        g.fillRect(4, -8 + leg - 2, 8, 3);
        if (skin === 'bunny') {
            g.fillStyle = K[4];
            rrect(g, -10, -60, 8, 26, 4); g.fill(); rrect(g, 0, -62, 8, 28, 4); g.fill();
            g.fillStyle = '#f8bbd0';
            rrect(g, -8, -56, 4, 18, 2); g.fill(); rrect(g, 2, -58, 4, 20, 2); g.fill();
        }
        if (skin === 'cat') {
            g.fillStyle = K[5];
            g.beginPath(); g.moveTo(-14, -30); g.lineTo(-10, -46); g.lineTo(-2, -36); g.fill();
            g.beginPath(); g.moveTo(14, -30); g.lineTo(10, -46); g.lineTo(2, -36); g.fill();
        }
        const bg = g.createLinearGradient(0, -38, 0, -6);
        bg.addColorStop(0, shade(K[4], 0.15)); bg.addColorStop(1, K[5]);
        g.fillStyle = bg;
        rrect(g, -16, -38, 32, 32, 14);
        g.fill();
        g.fillStyle = K[5];
        rrect(g, -16, -18, 32, 12, 6);
        g.fill();
        if (skin === 'frog' || skin === 'cat' || skin === 'bunny') {
            g.fillStyle = skin === 'frog' ? '#9ccc65' : skin === 'cat' ? '#ffe0b2' : '#ffffff';
            rrect(g, 10, -28, 14, 9, 4);
            g.fill();
            g.fillStyle = skin === 'frog' ? '#558b2f' : '#f06292';
            g.fillRect(19, -26, 3, 2.5);
        }
        if (skin === 'cat') { g.strokeStyle = '#5d4037'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, -22); g.lineTo(26, -24); g.moveTo(14, -20); g.lineTo(26, -19); g.stroke(); g.fillStyle = 'rgba(230,81,0,.4)'; g.fillRect(-12, -36, 4, 10); g.fillRect(-4, -38, 4, 8); }
        if (skin === 'robot') {
            g.fillStyle = '#263238'; rrect(g, -6, -33, 26, 11, 4); g.fill();
            g.fillStyle = '#4dd0e1'; g.fillRect(4 + Math.sin(A.time * 5) * 4, -31, 7, 6);
            g.fillStyle = '#546e7a'; g.fillRect(-1, -46, 2, 9);
            g.fillStyle = Math.sin(A.time * 6) > 0 ? '#ff1744' : '#ffcdd2'; g.beginPath(); g.arc(0, -47, 3, 0, 7); g.fill();
        }
        else if (skin === 'astro') {
            g.fillStyle = 'rgba(179,229,252,.85)'; g.beginPath(); g.ellipse(6, -26, 13, 10, 0, 0, 7); g.fill();
            g.strokeStyle = '#90a4ae'; g.lineWidth = 2; g.stroke();
            g.fillStyle = '#ffcc80'; g.beginPath(); g.arc(7, -26, 6, 0, 7); g.fill();
            g.fillStyle = '#212121'; g.beginPath(); g.arc(9, -27, 1.6, 0, 7); g.fill();
            g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(-1, -32, 4, 3);
            g.fillStyle = '#ef5350'; g.fillRect(-14, -16, 6, 4);
        }
        else {
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.arc(4, -29, 6, 0, 7);
            g.fill();
            g.fillStyle = '#212121';
            g.beginPath();
            if (hero.dead) {
                g.moveTo(1, -32);
                g.lineTo(7, -26);
                g.moveTo(7, -32);
                g.lineTo(1, -26);
                g.strokeStyle = '#212121';
                g.lineWidth = 2;
                g.stroke();
            }
            else {
                g.arc(6, -29, 2.6, 0, 7);
                g.fill();
            }
        }
        if (propT > 0) {
            g.fillStyle = '#ffeb3b';
            rrect(g, -8, -46, 16, 6, 3); g.fill();
            const sp = Math.sin(A.time * 40) * 18;
            g.fillStyle = '#29b6f6';
            g.fillRect(-Math.abs(sp), -50, Math.abs(sp) * 2, 3);
            g.fillStyle = '#e53935'; g.fillRect(-1, -52, 2, 6);
        }
        else if (skin === 'frog') {
            g.fillStyle = '#ff7043';
            g.beginPath();
            g.moveTo(-4, -38);
            g.lineTo(0, -46);
            g.lineTo(4, -38);
            g.fill();
        }
        g.restore();
        if (shieldOn) {
            g.strokeStyle = `rgba(128,222,234,${0.55 + 0.25 * Math.sin(A.time * 6)})`;
            g.lineWidth = 2.5;
            g.beginPath(); g.arc(x, y, 30, 0, 7); g.stroke();
            g.fillStyle = 'rgba(128,222,234,.1)'; g.fill();
        }
    }
    function drawItem(g, it) {
        const x = it.x, y = it.y - camTop + Math.sin(it.t * 4) * 3;
        if (it.kind === 'star') {
            g.save();
            g.translate(x, y);
            g.rotate(Math.sin(it.t * 2) * 0.3);
            g.fillStyle = '#ffd54f';
            g.shadowColor = '#ffd54f'; g.shadowBlur = 8;
            g.beginPath();
            for (let i = 0; i < 10; i++) { const r = i % 2 ? 4 : 9, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
            g.closePath(); g.fill();
            g.shadowBlur = 0;
            g.restore();
            return;
        }
        const col = it.kind === 'jet' ? '#ff7043' : it.kind === 'prop' ? '#29b6f6' : '#26c6da';
        g.fillStyle = 'rgba(255,255,255,.85)';
        g.shadowColor = col; g.shadowBlur = 14;
        g.beginPath(); g.arc(x, y, 15, 0, 7); g.fill();
        g.shadowBlur = 0;
        g.strokeStyle = col; g.lineWidth = 2.5; g.stroke();
        g.font = `900 16px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(it.kind === 'jet' ? '🎒' : it.kind === 'prop' ? '🚁' : '🫧', x, y + 1);
        g.textBaseline = 'alphabetic';
    }
    function draw(g) {
        const dark = A.dark;
        const hh = Math.max(0, (startY - camTop - H) / 10);
        let zi = 0;
        for (let i = 0; i < ZONES.length; i++) if (hh >= ZONES[i][0]) zi = i;
        const z0 = ZONES[zi], z1 = ZONES[Math.min(ZONES.length - 1, zi + 1)];
        const f = z1 === z0 ? 0 : Math.max(0, Math.min(1, (hh - (z1[0] - 800)) / 800));
        const ca = dark ? z0[3] : z0[2], cb = dark ? z1[3] : z1[2];
        const bgr = g.createLinearGradient(0, 0, 0, H);
        bgr.addColorStop(0, mix(ca[0], cb[0], f));
        bgr.addColorStop(1, mix(ca[1], cb[1], f));
        g.fillStyle = bgr;
        g.fillRect(0, 0, W, H);
        const night = zi >= 2 ? 1 : zi === 1 ? f : 0;
        if (night > 0 || dark) {
            for (let i = 0; i < 60; i++) {
                const sx = (i * 197) % W, sy = (((i * 131) - camTop * 0.05) % H + H) % H;
                g.globalAlpha = Math.max(night, dark ? 0.4 : 0) * (0.4 + 0.5 * Math.sin(A.time * 2 + i));
                g.fillStyle = '#ffffff';
                g.fillRect(sx, sy, i % 3 ? 1.2 : 2, i % 3 ? 1.2 : 2);
            }
            g.globalAlpha = 1;
        }
        if (zi >= 3) {
            const py = ((140 - camTop * 0.02) % (H + 200) + H + 200) % (H + 200) - 100;
            const pg = g.createRadialGradient(80, py - 10, 4, 90, py, 50);
            pg.addColorStop(0, '#b39ddb'); pg.addColorStop(1, '#4527a0');
            g.fillStyle = pg; g.beginPath(); g.arc(90, py, 44, 0, 7); g.fill();
        }
        const grid = 24, off = ((-camTop * 0.5) % grid + grid) % grid;
        g.strokeStyle = dark || night > 0.5 ? 'rgba(120,160,255,.06)' : 'rgba(80,140,220,.12)';
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 0.5; x < W; x += grid) {
            g.moveTo(x, 0);
            g.lineTo(x, H);
        }
        for (let y = off; y < H; y += grid) {
            g.moveTo(0, y);
            g.lineTo(W, y);
        }
        g.stroke();

        for (const c of clouds) {
            const y = ((c.y - camTop * c.p) % (H + 120) + H + 120) % (H + 120) - 60;
            g.fillStyle = dark || night > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.75)';
            g.beginPath();
            g.arc(c.x, y, 22 * c.s, 0, 7);
            g.arc(c.x + 22 * c.s, y + 6, 18 * c.s, 0, 7);
            g.arc(c.x - 22 * c.s, y + 6, 16 * c.s, 0, 7);
            g.fill();
        }
        for (const p of plats)
            drawPlat(g, p);
        for (const b of broke) {
            g.save();
            g.translate(b.x + b.w / 2, b.y - camTop + PHT / 2);
            g.rotate(b.r);
            g.fillStyle = '#8d6e63';
            rrect(g, -b.w / 2, -PHT / 2, b.w, PHT, 6);
            g.fill();
            g.restore();
        }
        for (const it of items)
            drawItem(g, it);
        for (const m of mons)
            drawMonster(g, m);
        g.save();
        g.translate(0, -camTop);
        A.fx.draw(g);
        g.restore();
        drawHero(g);
        if (hero.x < HW + 2)
            drawHero(g, W);
        if (hero.x > W - HW - 2)
            drawHero(g, -W);
        g.textAlign = 'center';
        for (const p of popups) {
            g.globalAlpha = Math.max(0, 1 - p.t / 1.2);
            g.font = `900 20px ${FONT}`;
            g.fillStyle = dark ? '#ffd54f' : '#ff5a36';
            g.fillText(p.text, p.x, p.y - camTop - p.t * 30);
        }
        g.globalAlpha = 1;
        if (A.state === 'play') {
            g.textAlign = 'left';
            g.font = `900 30px ${FONT}`;
            g.fillStyle = dark || night > 0.5 ? 'rgba(255,255,255,.85)' : 'rgba(40,30,20,.75)';
            g.fillText(Curio.fmt(maxH), 14, 40);
            g.textAlign = 'center';
        }
        if (A.state === 'play') {
            g.textAlign = 'right';
            g.font = `800 14px ${FONT}`;
            g.fillStyle = dark || night > 0.5 ? 'rgba(255,255,255,.85)' : 'rgba(40,30,20,.7)';
            g.fillText(`⭐ ${stars}`, W - 14, 34);
            g.textAlign = 'center';
        }
        if (sign && A.state === 'play') {
            const a = Math.min(1, sign.t * 4, (2.4 - sign.t) * 3);
            g.globalAlpha = Math.max(0, a);
            g.font = `900 24px ${FONT}`;
            g.lineWidth = 6;
            g.strokeStyle = 'rgba(0,0,0,.35)';
            g.fillStyle = '#ffffff';
            g.strokeText(sign.text, W / 2, 120);
            g.fillText(sign.text, W / 2, 120);
            g.globalAlpha = 1;
        }
        if (A.state === 'play' && maxH < 30) {
            g.font = `800 15px ${FONT}`;
            g.fillStyle = dark ? 'rgba(255,255,255,.7)' : 'rgba(40,30,20,.6)';
            g.fillText('◀ hold left or right to steer ▶', W / 2, H - 16);
        }
    }
    A.debug = () => ({
        maxH, y: hero.y, x: hero.x, vx: hero.vx, vy: hero.vy, dead: hero.dead, plats: plats.length, mons: mons.length, camTop,
        types: plats.reduce((o, p) => ((o[p.type] = (o[p.type] || 0) + 1), o), {}),
        lift(n) { hero.y -= n; camTop = hero.y - H * 0.42; genY = Math.min(genY, hero.y + 100); plats = []; generate(); plats.push({ x: hero.x - PW / 2, y: hero.y + 40, type: 'normal', vx: 0, spring: null, gone: 0 }); },
        monsterHere() { mons.push({ x: hero.x, bx: hero.x, y: hero.y, t: 0, dead: false, vy: 0, kind: 0, range: 0 }); hero.vy = -300; },
        give(k) { if (k === 'jet') jetT = 2.4; else if (k === 'prop') propT = 1.6; else shieldOn = true; },
        drop() { plats = []; hero.vy = 400; }
    });
    reset();
    A.boot();
})();
