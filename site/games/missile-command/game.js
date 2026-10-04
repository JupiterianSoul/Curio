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
        A.shareText = share || `${document.title.split('·')[0].trim()} on Curio: ${Curio.fmt(A.score)} points`;
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
    const H = 600, GROUND = H - 44, CITY_FX = [0.2, 0.28, 0.36, 0.64, 0.72, 0.8], BASE_FX = [0.075, 0.5, 0.925];
    const AMMO = 10;
    let lastW = 800, quiet = false;
    const sb = (...a) => { if (!quiet) A.beep(...a); };
    const ss = (...a) => { if (!quiet) A.sweep(...a); };
    const sn = (...a) => { if (!quiet) A.noise(...a); };
    const DIFF = { rookie: { speed: 0.75, count: 0.8, name: 'Rookie' }, classic: { speed: 1, count: 1, name: 'Classic' }, commander: { speed: 1.25, count: 1.2, name: 'Commander' } };
    const CRATES = { mega: ['#ff6fb5', '💥', 'Mega blasts'], ammo: ['#8fe3ff', '🔋', 'Ammo drop'], shield: ['#7dffb0', '🛡️', 'City shield'], slow: ['#c39bff', '⏳', 'Slow-mo'] };
    const BADGES = [
        ['w3', '🌃', 'Night watch', 'Survive to wave 3'],
        ['w5', '🛰️', 'Sky guardian', 'Survive to wave 5'],
        ['w10', '🏙️', 'Legend of the skyline', 'Survive to wave 10'],
        ['boss', '💫', 'Satellite slayer', 'Destroy an attack satellite'],
        ['perfect', '✨', 'Not a scratch', 'Finish a wave with all six cities'],
        ['triple', '🎆', 'Chain reaction', 'Destroy 3 missiles with one blast'],
        ['bomber', '✈️', 'Grounded', 'Shoot down a bomber'],
        ['smart', '🧠', 'Outsmarted', 'Destroy a smart bomb'],
        ['crate', '📦', 'Special delivery', 'Collect a supply crate'],
        ['shield', '🛡️', 'Dome sweet dome', 'Block a hit with a city shield'],
        ['p10k', '⭐', 'Ten thousand', 'Score 10,000'],
        ['p50k', '🌟', 'Fifty thousand', 'Score 50,000'],
        ['cmd5', '🎖️', 'Commander', 'Reach wave 5 on Commander']
    ];
    let D = DIFF.classic, boss = null, crates = [], megaShots = 0, slowT = 0, kills = 0, citiesLostWave = 0, shooting = null;
    const ridge = Array.from({ length: 2 }, (_, l) => Array.from({ length: 40 }, (_, i) => Math.sin(i * (0.7 + l * 0.4) + l * 2) * 0.5 + Math.sin(i * 0.23 + l) * 0.5));
    let cities, bases, enemies, shots, booms, planes, wave, phase, phaseT, queue, spawnT, cross, mult, bonus, nextCity, flashT, overT, demoT, shake, texts;
    const stars = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random() * 0.8, r: Math.random() * 1.3 + 0.3, p: Math.random() * 7 }));
    const A = Arcade({
        width: 800, height: H, reset, update, draw, key, pointer, idle, resized, menu: freshWorld,
        capture: ['1', '2', '3', 'a', 's', 'd', 'Enter'],
        size: (w, h) => ({ w: Math.round(Math.max(330, Math.min(1000, H * w / h))), h: H }), badges: BADGES,
        bestKey: () => (A.opt('diff') === 'classic' ? 'score' : 'score-' + A.opt('diff')),
        menuStats: () => [[' games', Curio.fmt(A.profile.games || 0)], [' missiles stopped', Curio.fmt(A.stat('kills'))], [' satellites', Curio.fmt(A.stat('bosses'))], [' best wave', A.stat('wave') || '-']]
    });
    const W = () => A.W;
    function resized() {
        const k = A.W / lastW;
        if (k !== 1 && enemies) {
            for (const e of enemies) { e.x *= k; e.sx *= k; e.tx *= k; e.vx *= k; }
            for (const s of shots) { s.x *= k; s.x0 *= k; s.tx *= k; }
            for (const b of booms) b.x *= k;
            for (const p of planes) p.x *= k;
            cross.x *= k;
        }
        lastW = A.W;
    }
    function freshWorld() {
        cities = CITY_FX.map((fx) => ({ fx, alive: true, smoke: 0, seed: Math.random() }));
        bases = BASE_FX.map((fx, i) => ({ fx, ammo: AMMO, alive: true, center: i === 1 }));
        enemies = [];
        shots = [];
        booms = [];
        planes = [];
        texts = [];
        boss = null; crates = []; megaShots = 0; slowT = 0;
        cross = { x: A.W / 2, y: H * 0.45, shown: false };
        flashT = 0;
        shake = 0;
        A.hud('cities', 6);
        A.hud('mult', '1x');
    }
    function reset() {
        D = DIFF[A.opt('diff')] || DIFF.classic;
        kills = 0;
        freshWorld();
        wave = 0;
        nextCity = 10000;
        overT = 0;
        A.fx.clear();
        startWave();
    }
    function hud() {
        A.hud('wave', wave);
        A.hud('cities', cities.filter((c) => c.alive).length);
        A.hud('mult', mult + 'x');
    }
    function startWave() {
        wave++;
        mult = Math.min(6, 1 + Math.floor((wave - 1) / 2));
        for (const b of bases) { b.alive = true; b.ammo = AMMO; }
        citiesLostWave = 0;
        A.statMax('wave', wave);
        if (wave >= 3) A.unlock('w3');
        if (wave >= 5) A.unlock('w5');
        if (wave >= 10) A.unlock('w10');
        if (wave >= 5 && D === DIFF.commander) A.unlock('cmd5');
        const count = Math.round(Math.min(34, 8 + wave * 2) * D.count);
        queue = [];
        let t = 0.4;
        while (queue.length < count) {
            const salvo = Math.min(count - queue.length, Curio.randInt(1, Math.min(4, 1 + Math.ceil(wave / 2))));
            for (let i = 0; i < salvo; i++) queue.push({ at: t + i * 0.12, kind: 'm' });
            t += Math.max(0.7, 2.6 - wave * 0.16) * (0.6 + Math.random() * 0.8);
        }
        if (wave >= 3) {
            const n = wave >= 7 ? 2 : 1;
            for (let i = 0; i < n; i++) queue.push({ at: t * (0.3 + Math.random() * 0.5), kind: 'p' });
        }
        if (wave >= 2) queue.push({ at: t * (0.2 + Math.random() * 0.4), kind: 'c' });
        if (wave >= 6) queue.push({ at: t * (0.55 + Math.random() * 0.3), kind: 'c' });
        if (wave % 5 === 0) queue.push({ at: t * 0.15, kind: 'b' });
        if (wave >= 4) { const n = Math.min(4, Math.floor((wave - 2) / 2)); for (let i = 0; i < n; i++) queue.push({ at: t * (0.3 + Math.random() * 0.6), kind: 's' }); }
        queue.sort((a, b) => a.at - b.at);
        spawnT = 0;
        phase = 'intro';
        phaseT = 1.7;
        bonus = null;
        hud();
        [392, 523, 659].forEach((f, i) => setTimeout(() => sb(f, 0.12, 'square', 0.05), i * 110));
    }
    function speedFor() { return Math.min(150, 36 + wave * 8) * D.speed; }
    function pickTarget() {
        const opts = [];
        cities.forEach((c) => { if (c.alive) opts.push(c.fx, c.fx); });
        bases.forEach((b) => { if (b.alive) opts.push(b.fx); });
        if (!opts.length || Math.random() < 0.12) return Curio.rand(0.05, 0.95) * A.W;
        return Curio.pick(opts) * A.W + Curio.rand(-6, 6);
    }
    function spawnSmart() {
        const sx = Curio.rand(0.1, 0.9) * A.W, tx = pickTarget();
        const sp = speedFor() * 0.7, d = Math.hypot(tx - sx, GROUND + 6) || 1;
        enemies.push({ sx, sy: -6, x: sx, y: -6, tx, ty: GROUND, vx: (tx - sx) / d * sp, vy: (GROUND + 6) / d * sp, split: null, sp, smart: true, tail: [] });
    }
    function spawnBoss() {
        const left = Math.random() < 0.5;
        boss = { x: left ? -60 : A.W + 60, y: 74, vx: (left ? 1 : -1) * 60, hp: 3 + Math.floor(wave / 10), max: 3 + Math.floor(wave / 10), dropT: 1.2, hitCd: 0, t: 0, entered: false };
        ss(120, 60, 1.2, 'sawtooth', 0.06);
        texts.push({ x: A.W / 2, y: H * 0.3, s: '⚠ Attack satellite!', t: 1.8 });
    }
    function spawnCrate() {
        crates.push({ x: Curio.rand(0.15, 0.85) * A.W, y: -20, kind: Curio.pick(Object.keys(CRATES)), t: Math.random() * 6 });
    }
    function collectCrate(c) {
        const [col, em, name] = CRATES[c.kind];
        A.unlock('crate');
        if (c.kind === 'mega') megaShots = 5;
        else if (c.kind === 'ammo') for (const b of bases) if (b.alive) b.ammo = Math.min(AMMO + 5, b.ammo + 5);
        else if (c.kind === 'shield') { const alive = cities.filter((x) => x.alive && !x.shield); if (alive.length) Curio.pick(alive).shield = true; }
        else slowT = 6;
        texts.push({ x: c.x, y: c.y - 20, s: `${em} ${name}!`, t: 1.2 });
        A.fx.ring(c.x, c.y, col, 50, 0.5, 3);
        A.chord([660, 990, 1320], 60, 0.08, 'triangle', 0.08);
        A.buzz(25);
    }
    function spawnEnemy(sx, sy, speed, canSplit) {
        const tx = pickTarget(), ty = GROUND;
        const d = Math.hypot(tx - sx, ty - sy) || 1;
        const sp = speed * (0.85 + Math.random() * 0.3);
        const split = canSplit && wave >= 2 && Math.random() < Math.min(0.45, 0.08 + wave * 0.05) ? Curio.rand(H * 0.18, H * 0.48) : null;
        enemies.push({ sx, sy, x: sx, y: sy, tx, ty, vx: (tx - sx) / d * sp, vy: (ty - sy) / d * sp, split, sp });
    }
    function spawnPlane() {
        const left = Math.random() < 0.5;
        planes.push({ x: left ? -40 : A.W + 40, y: Curio.rand(90, 200), vx: (left ? 1 : -1) * Curio.rand(70, 95 + wave * 4), drops: Curio.randInt(2, 3), dropT: Curio.rand(1, 2.2) });
    }
    function fire(tx, ty, which) {
        if (overT > 0) return;
        ty = Math.min(ty, GROUND - 46);
        let base = null;
        if (which != null) {
            const b = bases[which];
            if (b.alive && b.ammo > 0) base = b;
        }
        else {
            let bestD = Infinity;
            for (const b of bases) {
                if (!b.alive || b.ammo <= 0) continue;
                const d = Math.abs(b.fx * A.W - tx) - (b.center ? 30 : 0);
                if (d < bestD) { bestD = d; base = b; }
            }
        }
        if (!base) {
            sb(140, 0.12, 'square', 0.05);
            return;
        }
        base.ammo--;
        const x0 = base.fx * A.W, y0 = GROUND - 24;
        const speed = base.center ? 820 : 560;
        const d = Math.hypot(tx - x0, ty - y0) || 1;
        const max = (megaShots > 0 ? 70 : 44) * (A.opt('assist') === 'on' ? 1.3 : 1);
        if (megaShots > 0) megaShots--;
        shots.push({ x0, y0, x: x0, y: y0, tx, ty, vx: (tx - x0) / d * speed, vy: (ty - y0) / d * speed, left: d / speed, max });
        ss(500, 1500, 0.1, 'square', 0.035);
        if (base.ammo === 3) Curio.toast('Low ammo!');
    }
    function boom(x, y, max, player) {
        booms.push({ x, y, t: 0, max, player, r: 0 });
        sn(player ? 0.45 : 0.35, player ? 0.14 : 0.1, player ? 1100 : 800);
    }
    function boomR(b) {
        if (b.t < 0.32) return b.max * (b.t / 0.32);
        if (b.t < 0.6) return b.max;
        return Math.max(0, b.max * (1 - (b.t - 0.6) / 0.45));
    }
    function addPts(n, x, y) {
        A.addScore(n);
        if (x != null) texts.push({ x, y, s: '+' + n, t: 0.9 });
        if (A.score >= 10000) A.unlock('p10k');
        if (A.score >= 50000) A.unlock('p50k');
        if (A.score >= nextCity) {
            nextCity += 10000;
            const dead = cities.find((c) => !c.alive);
            if (dead) {
                dead.alive = true;
                Curio.toast('Bonus city rebuilt!');
                [659, 784, 1047].forEach((f, i) => setTimeout(() => sb(f, 0.1, 'triangle', 0.08), i * 90));
                hud();
            }
        }
    }
    function impact(x, demo) {
        boom(x, GROUND - 4, 30, false);
        shake = Math.max(shake, 0.25);
        for (const c of cities) {
            if (c.alive && c.shield && Math.abs(c.fx * A.W - x) < 30) {
                c.shield = false;
                A.fx.ring(c.fx * A.W, GROUND - 10, '#7dffb0', 60, 0.6, 4);
                A.fx.burst(c.fx * A.W, GROUND - 30, 24, ['#7dffb0', '#ffffff'], { speed: 200, life: 0.6, size: 3, gravity: 200 });
                ss(900, 200, 0.3, 'triangle', 0.07);
                if (!demo) A.unlock('shield');
                continue;
            }
            if (c.alive && Math.abs(c.fx * A.W - x) < 22) {
                c.alive = false;
                citiesLostWave++;
                if (!demo) { A.shake(12); A.buzz([60, 40, 120]); }
                c.smoke = 1;
                flashT = 0.35;
                shake = 0.5;
                A.fx.burst(c.fx * A.W, GROUND - 10, 30, ['#6fd3ff', '#ffffff', '#ff8a3d', '#ffd166'], { speed: 220, life: 1, size: 3, gravity: 400 });
                ss(420, 50, 0.7, 'sawtooth', 0.07);
                if (!demo) hud();
            }
        }
        for (const b of bases) {
            if (b.alive && Math.abs(b.fx * A.W - x) < 26) {
                b.alive = false;
                b.ammo = 0;
                flashT = 0.25;
                A.fx.burst(b.fx * A.W, GROUND - 14, 24, ['#ffd166', '#ffffff', '#ff6b6b'], { speed: 200, life: 0.9, size: 3, gravity: 400 });
            }
        }
    }
    function sim(dt, demo) {
        for (let i = shots.length - 1; i >= 0; i--) {
            const s = shots[i];
            s.left -= dt;
            if (s.left <= 0) {
                boom(s.tx, s.ty, s.max || 44, true);
                shots.splice(i, 1);
                continue;
            }
            s.x += s.vx * dt;
            s.y += s.vy * dt;
        }
        for (let i = booms.length - 1; i >= 0; i--) {
            const b = booms[i];
            b.t += dt;
            b.r = boomR(b);
            if (b.t > 1.05) { booms.splice(i, 1); continue; }
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (Math.hypot(e.x - b.x, e.y - b.y) <= b.r + 2) {
                    enemies.splice(j, 1);
                    if (!demo) {
                        kills++;
                        A.stat('kills', 1);
                        if (e.smart) { A.unlock('smart'); addPts(100 * mult, e.x, e.y - 30); }
                        b.kills = (b.kills || 0) + 1;
                        if (b.kills >= 2) {
                            const lab = ['', '', 'Double!', 'Triple!', 'Quad!', 'Mega chain!'][Math.min(5, b.kills)];
                            texts.push({ x: b.x, y: b.y - 30, s: lab, t: 1 });
                            addPts(50 * mult * (b.kills - 1));
                            if (b.kills >= 3) A.unlock('triple');
                            A.shake(3);
                        }
                    }
                    A.fx.ring(e.x, e.y, '#ffd166', 30, 0.35, 2);
                    booms.push({ x: e.x, y: e.y, t: 0, max: 26, player: true, r: 0 });
                    A.fx.burst(e.x, e.y, 8, ['#ffd166', '#ffffff'], { speed: 120, life: 0.5, size: 2, gravity: 120 });
                    sb(1200 + Math.random() * 400, 0.05, 'square', 0.035);
                    if (!demo) addPts(25 * mult, e.x, e.y - 14);
                }
            }
            for (let j = planes.length - 1; j >= 0; j--) {
                const p = planes[j];
                if (Math.hypot(p.x - b.x, p.y - b.y) <= b.r + 12) {
                    planes.splice(j, 1);
                    booms.push({ x: p.x, y: p.y, t: 0, max: 40, player: true, r: 0 });
                    A.fx.burst(p.x, p.y, 30, ['#c0c8d8', '#ffd166', '#ff6b6b'], { speed: 200, life: 1, size: 3, gravity: 300 });
                    sn(0.8, 0.2, 700);
                    if (!demo) { addPts(100 * mult, p.x, p.y - 20); A.unlock('bomber'); A.shake(5); }
                }
            }
        }
        if (!demo) {
            for (const b of booms) {
                for (let j = crates.length - 1; j >= 0; j--) {
                    const c = crates[j];
                    if (Math.hypot(c.x - b.x, c.y - b.y) <= b.r + 12) { crates.splice(j, 1); collectCrate(c); }
                }
                if (boss && b.player && boss.hitCd <= 0 && Math.hypot(boss.x - b.x, boss.y - b.y) <= b.r + 28) {
                    boss.hp--;
                    boss.hitCd = 0.7;
                    A.shake(6);
                    A.fx.burst(boss.x, boss.y, 20, ['#ffd166', '#ffffff', '#c0c8d8'], { speed: 200, life: 0.6, size: 3, gravity: 200 });
                    sn(0.5, 0.18, 900);
                    if (boss.hp <= 0) {
                        const pts = 1000 * mult;
                        addPts(pts, boss.x, boss.y - 30);
                        booms.push({ x: boss.x, y: boss.y, t: 0, max: 80, player: true, r: 0 });
                        A.fx.burst(boss.x, boss.y, 60, ['#c0c8d8', '#ffd166', '#ff6b6b', '#8fe3ff'], { speed: 300, life: 1.2, size: 4, gravity: 200 });
                        A.fx.ring(boss.x, boss.y, '#ffffff', 120, 0.8, 5);
                        A.shake(16);
                        A.buzz([80, 40, 160]);
                        A.chord([523, 659, 784, 1047, 1319], 80, 0.12, 'triangle', 0.1);
                        A.stat('bosses', 1);
                        A.unlock('boss');
                        boss = null;
                    }
                }
            }
            if (boss) {
                boss.t += dt;
                boss.hitCd = Math.max(0, boss.hitCd - dt);
                boss.x += boss.vx * dt * (slowT > 0 ? 0.5 : 1);
                if (boss.x > 40 && boss.x < A.W - 40) boss.entered = true;
                if (boss.entered && (boss.x < 50 || boss.x > A.W - 50)) boss.vx = -boss.vx;
                boss.dropT -= dt;
                if (boss.dropT <= 0) { boss.dropT = Math.max(0.6, 1.4 - wave * 0.04); spawnEnemy(boss.x, boss.y + 16, speedFor(), wave >= 10); ss(400, 150, 0.15, 'square', 0.04); }
            }
            for (let j = crates.length - 1; j >= 0; j--) {
                const c = crates[j];
                c.t += dt;
                c.y += 30 * dt;
                c.x += Math.sin(c.t * 1.5) * 12 * dt;
                if (c.y > GROUND - 10) { crates.splice(j, 1); A.fx.burst(c.x, GROUND - 6, 8, ['#c99a35', '#ffffff'], { speed: 80, life: 0.4, size: 2, gravity: 200 }); }
            }
            slowT = Math.max(0, slowT - dt);
        }
        const edt = slowT > 0 ? dt * 0.5 : dt;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.smart) {
                let dodge = 0;
                for (const b of booms) { const dx = e.x - b.x, dd = Math.hypot(dx, e.y - b.y); if (dd < b.r + 60 && b.player) dodge += (dx >= 0 ? 1 : -1) * 140; }
                e.x += dodge * edt;
                const d = Math.hypot(e.tx - e.x, e.ty - e.y) || 1;
                e.vx = (e.tx - e.x) / d * e.sp; e.vy = (e.ty - e.y) / d * e.sp;
                e.tail.push([e.x, e.y]); if (e.tail.length > 18) e.tail.shift();
            }
            e.x += e.vx * edt;
            e.y += e.vy * edt;
            if (e.split != null && e.y >= e.split) {
                enemies.splice(i, 1);
                const n = Curio.randInt(2, 3);
                for (let k = 0; k < n; k++) spawnEnemy(e.x, e.y, e.sp, false);
                ss(900, 300, 0.15, 'triangle', 0.04);
                continue;
            }
            if (e.y >= e.ty) {
                enemies.splice(i, 1);
                impact(e.tx, demo);
            }
        }
        for (let i = planes.length - 1; i >= 0; i--) {
            const p = planes[i];
            p.x += p.vx * edt;
            p.dropT -= dt;
            if (p.dropT <= 0 && p.drops > 0 && p.x > 30 && p.x < A.W - 30) {
                p.drops--;
                p.dropT = Curio.rand(1.2, 2.4);
                spawnEnemy(p.x, p.y + 8, speedFor(), false);
            }
            if (p.x < -60 || p.x > A.W + 60) planes.splice(i, 1);
        }
        for (const c of cities) if (!c.alive && c.smoke > 0) c.smoke = Math.max(0.25, c.smoke - dt * 0.1);
        for (let i = texts.length - 1; i >= 0; i--) {
            texts[i].t -= dt;
            texts[i].y -= 24 * dt;
            if (texts[i].t <= 0) texts.splice(i, 1);
        }
        A.fx.update(dt);
        flashT = Math.max(0, flashT - dt);
        shake = Math.max(0, shake - dt);
    }
    function update(dt) {
        if (cross.keys) {
            const sp = 440 * dt;
            if (A.keys.has('ArrowLeft')) cross.x -= sp;
            if (A.keys.has('ArrowRight')) cross.x += sp;
            if (A.keys.has('ArrowUp')) cross.y -= sp;
            if (A.keys.has('ArrowDown')) cross.y += sp;
            cross.x = Math.max(8, Math.min(A.W - 8, cross.x));
            cross.y = Math.max(20, Math.min(GROUND - 46, cross.y));
        }
        sim(dt, false);
        if (overT > 0) {
            overT -= dt;
            if (overT <= 0) {
                A.over({
                    title: 'The lights went out', emoji: '🌆', msg: `You held out for ${wave} wave${wave === 1 ? '' : 's'}. ${wave >= 8 ? 'A true air-defence legend.' : wave >= 4 ? 'The skyline remembers you fondly.' : 'The missiles were, frankly, rude.'}`,
                    lines: [[' waves', wave], [' missiles stopped', kills], [' difficulty', D.name]],
                    share: `🚀 Curio Missile Defence (${D.name}): ${Curio.fmt(A.score)} pts\n🌆 Held out ${wave} wave${wave === 1 ? '' : 's'} · 💥 ${kills} missiles stopped`
                });
            }
            return;
        }
        if (!cities.some((c) => c.alive)) {
            overT = 2;
            return;
        }
        if (phase === 'intro') {
            phaseT -= dt;
            if (phaseT <= 0) phase = 'fight';
            return;
        }
        if (phase === 'fight') {
            spawnT += dt;
            while (queue.length && queue[0].at <= spawnT) {
                const q = queue.shift();
                if (q.kind === 'p') spawnPlane();
                else if (q.kind === 'c') spawnCrate();
                else if (q.kind === 'b') spawnBoss();
                else if (q.kind === 's') spawnSmart();
                else spawnEnemy(Curio.rand(0.03, 0.97) * A.W, -6, speedFor(), true);
            }
            if (!queue.length && !enemies.length && !planes.length && !booms.length && !shots.length && !boss) {
                phase = 'bonus';
                crates = [];
                if (citiesLostWave === 0 && cities.every((c) => c.alive)) A.unlock('perfect');
                bonus = { ammo: bases.reduce((s, b) => s + (b.alive ? b.ammo : 0), 0), counted: 0, cities: 0, t: 0.6, pts: 0, stage: 'ammo' };
            }
            return;
        }
        if (phase === 'bonus') {
            const b = bonus;
            b.t -= dt;
            if (b.t > 0) return;
            if (b.stage === 'ammo') {
                const base = bases.find((x) => x.alive && x.ammo > 0);
                if (base) {
                    base.ammo--;
                    b.counted++;
                    b.pts += 5 * mult;
                    addPts(5 * mult);
                    sb(700 + b.counted * 12, 0.04, 'square', 0.04);
                    b.t = 0.05;
                }
                else { b.stage = 'cities'; b.t = 0.4; }
            }
            else if (b.stage === 'cities') {
                const alive = cities.filter((c) => c.alive).length;
                if (b.cities < alive) {
                    b.cities++;
                    b.pts += 100 * mult;
                    addPts(100 * mult);
                    sb(440 + b.cities * 90, 0.12, 'triangle', 0.08);
                    b.t = 0.28;
                }
                else { b.stage = 'done'; b.t = 1.3; }
            }
            else startWave();
        }
    }
    function idle(dt) {
        if (A.state !== 'menu') return;
        demoT -= dt;
        if (demoT <= 0) {
            demoT = Curio.rand(0.6, 1.4);
            if (enemies.length < 6) spawnEnemy(Curio.rand(0.05, 0.95) * A.W, -6, 70, false);
        }
        for (const e of enemies) {
            if (!e.aimed && e.y > H * 0.25 && Math.random() < 0.02) {
                e.aimed = true;
                const base = bases.reduce((a, b) => (Math.abs(b.fx * A.W - e.x) < Math.abs(a.fx * A.W - e.x) ? b : a));
                const t = 0.5;
                const tx = e.x + e.vx * t, ty = e.y + e.vy * t;
                const x0 = base.fx * A.W, y0 = GROUND - 24, d = Math.hypot(tx - x0, ty - y0);
                shots.push({ x0, y0, x: x0, y: y0, tx, ty, vx: (tx - x0) / t, vy: (ty - y0) / t, left: t, demo: d });
            }
        }
        quiet = true;
        sim(dt, true);
        quiet = false;
        for (const c of cities) c.alive = true;
    }
    function key(k, down) {
        if (!down) return;
        if (k.startsWith('Arrow')) cross.keys = true;
        cross.shown = true;
        if (k === ' ' || k === 'Enter') fire(cross.x, cross.y, null);
        const map = { 1: 0, 2: 1, 3: 2, a: 0, s: 1, d: 2 };
        if (k in map) fire(cross.x, cross.y, map[k]);
    }
    function pointer(type, p, e) {
        if (type === 'move' && e.pointerType === 'mouse') {
            cross.x = p.x;
            cross.y = Math.min(p.y, GROUND - 46);
            cross.shown = true;
            cross.keys = false;
        }
        if (type === 'down') {
            cross.x = p.x;
            cross.y = Math.min(p.y, GROUND - 46);
            cross.shown = true;
            cross.keys = false;
            fire(p.x, p.y, null);
        }
    }
    function drawCity(g, x, c) {
        if (!c.alive) {
            g.fillStyle = '#4a3b48';
            g.beginPath();
            g.moveTo(x - 16, GROUND);
            for (let i = 0; i <= 8; i++) g.lineTo(x - 16 + i * 4, GROUND - 3 - ((i * 7 + c.seed * 10) % 6));
            g.lineTo(x + 16, GROUND);
            g.fill();
            g.fillStyle = `rgba(150,140,160,${0.25 * c.smoke})`;
            for (let i = 0; i < 3; i++) {
                const t = (A.time * 0.4 + i / 3 + c.seed) % 1;
                g.beginPath();
                g.arc(x + Math.sin(t * 6 + i) * 5, GROUND - 6 - t * 40, 4 + t * 9, 0, 7);
                g.fill();
            }
            return;
        }
        const blds = [[-15, 7, 14], [-8, 7, 24], [-1, 6, 17], [5, 6, 28], [11, 6, 12]];
        g.fillStyle = 'rgba(111,211,255,.12)';
        g.beginPath(); g.ellipse(x, GROUND - 10, 26, 22, 0, Math.PI, 0); g.fill();
        for (const [ox, w, h] of blds) {
            const bg = g.createLinearGradient(0, GROUND - h, 0, GROUND);
            bg.addColorStop(0, '#5fd0f5'); bg.addColorStop(1, '#2a8fbf');
            g.fillStyle = bg;
            g.fillRect(x + ox, GROUND - h, w, h);
            g.fillStyle = '#9ff0ff';
            for (let yy = GROUND - h + 3; yy < GROUND - 3; yy += 5)
                for (let xx = x + ox + 1.5; xx < x + ox + w - 2; xx += 3)
                    if (((xx * 13 + yy * 7) | 0) % 5 !== 0) g.fillRect(xx, yy, 1.4, 2);
        }
        g.fillStyle = '#1f6f9c';
        g.fillRect(x - 16, GROUND - 2, 32, 2);
        g.fillStyle = Math.sin(A.time * 3 + c.seed * 9) > 0 ? '#ff5d5d' : '#5a2020';
        g.fillRect(x + 7, GROUND - 31, 2, 2);
        if (c.shield) {
            g.strokeStyle = `rgba(125,255,176,${0.55 + 0.25 * Math.sin(A.time * 5)})`;
            g.lineWidth = 2;
            g.beginPath(); g.ellipse(x, GROUND, 26, 38, 0, Math.PI, 0); g.stroke();
            g.fillStyle = 'rgba(125,255,176,.08)'; g.fill();
        }
    }
    function drawBase(g, x, b, i) {
        g.fillStyle = '#d9a640';
        g.beginPath();
        g.moveTo(x - 38, GROUND + 1);
        g.quadraticCurveTo(x - 24, GROUND - 26, x, GROUND - 26);
        g.quadraticCurveTo(x + 24, GROUND - 26, x + 38, GROUND + 1);
        g.fill();
        if (!b.alive) {
            g.fillStyle = '#5a3d2a';
            g.beginPath();
            g.ellipse(x, GROUND - 22, 16, 5, 0, 0, 7);
            g.fill();
            return;
        }
        let n = 0;
        const rows = [1, 2, 3, 4];
        for (let r = 0; r < rows.length; r++) {
            for (let k = 0; k < rows[r]; k++) {
                if (n >= b.ammo) break;
                const mx = x + (k - (rows[r] - 1) / 2) * 7, my = GROUND - 30 + r * 6 + 2;
                g.fillStyle = '#e8f3ff';
                g.fillRect(mx - 1.5, my - 4, 3, 6);
                g.fillStyle = '#5ac8ff';
                g.fillRect(mx - 1.5, my - 4, 3, 2);
                n++;
            }
        }
        if (A.state === 'play') {
            g.fillStyle = b.ammo === 0 ? '#ff6b6b' : b.ammo <= 3 ? '#ffd166' : 'rgba(255,255,255,.7)';
            g.font = `800 11px ${FONT}`;
            g.textAlign = 'center';
            g.fillText(b.ammo === 0 ? 'OUT' : b.ammo <= 3 ? 'LOW' : '', x, GROUND + 16);
            g.fillStyle = 'rgba(0,0,0,.35)';
            g.fillText(['A', 'S', 'D'][i], x, GROUND + 30);
        }
    }
    function draw(g) {
        const Wd = A.W;
        g.save();
        if (shake > 0) g.translate((Math.random() - 0.5) * shake * 14, (Math.random() - 0.5) * shake * 14);
        const sky = g.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#070b24');
        sky.addColorStop(0.65, '#251651');
        sky.addColorStop(1, '#5b2a6e');
        g.fillStyle = sky;
        g.fillRect(-20, -20, Wd + 40, H + 40);
        for (const s of stars) {
            g.globalAlpha = 0.35 + 0.35 * Math.sin(A.time * 2 + s.p);
            g.fillStyle = '#ffffff';
            g.fillRect(s.x * Wd, s.y * H, s.r, s.r);
        }
        g.globalAlpha = 1;
        g.fillStyle = '#f2e6b8';
        g.beginPath();
        g.arc(Wd * 0.86, 70, 22, 0, 7);
        g.fill();
        g.fillStyle = '#251651';
        g.globalAlpha = 0.25;
        g.beginPath();
        g.arc(Wd * 0.86 + 8, 64, 6, 0, 7);
        g.arc(Wd * 0.86 - 7, 78, 4, 0, 7);
        g.fill();
        g.globalAlpha = 1;
        const mg = g.createRadialGradient(Wd * 0.86, 70, 10, Wd * 0.86, 70, 90);
        mg.addColorStop(0, 'rgba(242,230,184,.25)'); mg.addColorStop(1, 'rgba(242,230,184,0)');
        g.fillStyle = mg; g.fillRect(Wd * 0.86 - 90, -20, 180, 180);
        if (shooting) {
            shooting.t += 1 / 60;
            g.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.8 - shooting.t)})`;
            g.lineWidth = 1.5;
            g.beginPath(); g.moveTo(shooting.x + shooting.t * 500, shooting.y + shooting.t * 160); g.lineTo(shooting.x + shooting.t * 500 - 50, shooting.y + shooting.t * 160 - 16); g.stroke();
            if (shooting.t > 1) shooting = null;
        }
        else if (Math.random() < 0.003) shooting = { x: Math.random() * Wd * 0.6, y: Math.random() * 150, t: 0 };
        ridge.forEach((rg, l) => {
            g.fillStyle = l ? '#2a1d4f' : '#3a2560';
            g.beginPath();
            g.moveTo(-20, GROUND);
            const base = GROUND - (l ? 40 : 70), amp = l ? 22 : 34;
            for (let i = 0; i < rg.length; i++) g.lineTo(-20 + i * (Wd + 40) / (rg.length - 1), base - rg[i] * amp);
            g.lineTo(Wd + 20, GROUND);
            g.fill();
        });
        if (slowT > 0) { g.fillStyle = `rgba(195,155,255,${Math.min(0.15, slowT * 0.05)})`; g.fillRect(-20, -20, Wd + 40, H + 40); }
        const gg = g.createLinearGradient(0, GROUND, 0, H);
        gg.addColorStop(0, '#c99a35'); gg.addColorStop(1, '#7a5a1c');
        g.fillStyle = gg;
        g.fillRect(-20, GROUND, Wd + 40, H - GROUND + 20);
        g.fillStyle = '#c99a35';
        g.fillRect(-20, GROUND, Wd + 40, 6);
        const k = Math.max(0.8, Math.min(1, Wd / 600));
        cities.forEach((c) => { g.save(); g.translate(c.fx * Wd, GROUND); g.scale(k, k); g.translate(0, -GROUND); drawCity(g, 0, c); g.restore(); });
        bases.forEach((b, i) => { g.save(); g.translate(b.fx * Wd, GROUND); g.scale(k, k); g.translate(0, -GROUND); drawBase(g, 0, b, i); g.restore(); });
        g.lineCap = 'round';
        for (const e of enemies) {
            if (e.smart) {
                g.strokeStyle = 'rgba(195,155,255,.6)';
                g.lineWidth = 2;
                g.beginPath();
                e.tail.forEach((t, i) => (i ? g.lineTo(t[0], t[1]) : g.moveTo(t[0], t[1])));
                g.stroke();
                g.save(); g.translate(e.x, e.y); g.rotate(A.time * 6);
                g.fillStyle = '#c39bff'; g.shadowColor = '#c39bff'; g.shadowBlur = 10;
                g.fillRect(-5, -5, 10, 10);
                g.shadowBlur = 0; g.restore();
                continue;
            }
            const gr = g.createLinearGradient(e.sx, e.sy, e.x, e.y);
            gr.addColorStop(0, 'rgba(255,70,90,0)');
            gr.addColorStop(1, 'rgba(255,90,100,.95)');
            g.strokeStyle = gr;
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(e.sx, e.sy);
            g.lineTo(e.x, e.y);
            g.stroke();
            g.fillStyle = Math.floor(A.time * 12) % 2 ? '#ffffff' : '#ffd0d0';
            g.beginPath();
            g.arc(e.x, e.y, 2.6, 0, 7);
            g.fill();
        }
        for (const p of planes) {
            g.save();
            g.translate(p.x, p.y);
            g.scale(p.vx > 0 ? 1 : -1, 1);
            g.fillStyle = '#9aa7bf';
            g.beginPath();
            g.ellipse(0, 0, 22, 6, 0, 0, 7);
            g.fill();
            g.fillStyle = '#6c7890';
            g.beginPath();
            g.moveTo(-4, 0);
            g.lineTo(-12, -14);
            g.lineTo(-6, -14);
            g.lineTo(6, 0);
            g.moveTo(-4, 0);
            g.lineTo(-12, 12);
            g.lineTo(-6, 12);
            g.lineTo(6, 0);
            g.moveTo(-18, 0);
            g.lineTo(-24, -9);
            g.lineTo(-19, -9);
            g.lineTo(-12, 0);
            g.fill();
            g.fillStyle = Math.floor(A.time * 4) % 2 ? '#ff5d5d' : '#5dff9b';
            g.fillRect(14, -2, 3, 3);
            g.restore();
        }
        for (const c of crates) {
            const [col, em] = CRATES[c.kind];
            g.save(); g.translate(c.x, c.y); g.rotate(Math.sin(c.t * 1.5) * 0.15);
            g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1;
            g.beginPath(); g.moveTo(-9, -6); g.lineTo(-16, -26); g.moveTo(9, -6); g.lineTo(16, -26); g.stroke();
            g.fillStyle = '#f5f5f5'; g.beginPath(); g.ellipse(0, -28, 20, 9, 0, Math.PI, 0); g.fill();
            g.fillStyle = col; g.beginPath(); g.ellipse(0, -28, 20, 9, 0, Math.PI, Math.PI * 1.33); g.lineTo(0, -28); g.fill();
            g.shadowColor = col; g.shadowBlur = 10;
            g.fillStyle = '#8d6e63'; rrect(g, -10, -8, 20, 16, 3); g.fill();
            g.shadowBlur = 0;
            g.font = `900 11px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(em, 0, 0); g.textBaseline = 'alphabetic';
            g.restore();
        }
        if (boss) {
            g.save(); g.translate(boss.x, boss.y);
            g.fillStyle = '#3949ab'; g.fillRect(-46, -5, 20, 10); g.fillRect(26, -5, 20, 10);
            g.strokeStyle = '#7986cb'; g.lineWidth = 1;
            for (let i = -44; i < -26; i += 4) { g.beginPath(); g.moveTo(i, -5); g.lineTo(i, 5); g.stroke(); }
            for (let i = 28; i < 46; i += 4) { g.beginPath(); g.moveTo(i, -5); g.lineTo(i, 5); g.stroke(); }
            const bgr = g.createLinearGradient(0, -16, 0, 16);
            bgr.addColorStop(0, boss.hitCd > 0.5 ? '#ffffff' : '#d7dde8'); bgr.addColorStop(1, '#7d879c');
            g.fillStyle = bgr; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill();
            g.fillStyle = Math.floor(A.time * 6) % 2 ? '#ff5d5d' : '#ffd166'; g.beginPath(); g.arc(0, 4, 5, 0, 7); g.fill();
            g.strokeStyle = '#c0c8d8'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -18); g.lineTo(0, -28); g.stroke();
            g.fillStyle = '#ff5d5d'; g.beginPath(); g.arc(0, -29, 2.5, 0, 7); g.fill();
            for (let i = 0; i < boss.max; i++) { g.fillStyle = i < boss.hp ? '#ff6b6b' : 'rgba(255,255,255,.25)'; g.fillRect(-boss.max * 6 + i * 12, 24, 10, 4); }
            g.restore();
        }
        for (const s of shots) {
            g.strokeStyle = s.max > 44 ? 'rgba(255,111,181,.9)' : 'rgba(120,220,255,.85)';
            g.lineWidth = 2;
            g.beginPath();
            g.moveTo(s.x0, s.y0);
            g.lineTo(s.x, s.y);
            g.stroke();
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.arc(s.x, s.y, 2.4, 0, 7);
            g.fill();
            if (!s.demo) {
                g.strokeStyle = Math.floor(A.time * 10) % 2 ? '#ffffff' : '#6fd3ff';
                g.lineWidth = 2;
                g.beginPath();
                g.moveTo(s.tx - 5, s.ty - 5);
                g.lineTo(s.tx + 5, s.ty + 5);
                g.moveTo(s.tx + 5, s.ty - 5);
                g.lineTo(s.tx - 5, s.ty + 5);
                g.stroke();
            }
        }
        const pal = ['#ffffff', '#fff27a', '#ffb347', '#ff6fb5', '#8fe3ff'];
        for (const b of booms) {
            if (b.r <= 0.5) continue;
            const c = pal[Math.floor(A.time * 18 + b.x) % pal.length];
            const gr = g.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
            gr.addColorStop(0, '#ffffff');
            gr.addColorStop(0.45, c);
            gr.addColorStop(1, b.player ? 'rgba(255,120,80,.15)' : 'rgba(255,60,60,.2)');
            g.fillStyle = gr;
            g.beginPath();
            g.arc(b.x, b.y, b.r, 0, 7);
            g.fill();
        }
        A.fx.draw(g);
        g.textAlign = 'center';
        g.font = `800 14px ${FONT}`;
        for (const t of texts) {
            g.globalAlpha = Math.min(1, t.t * 2);
            g.fillStyle = '#fff27a';
            g.fillText(t.s, t.x, t.y);
        }
        g.globalAlpha = 1;
        if (A.state === 'play' && cross.shown) {
            g.strokeStyle = '#ffffff';
            g.lineWidth = 1.6;
            g.beginPath();
            g.arc(cross.x, cross.y, 9, 0, 7);
            g.moveTo(cross.x - 15, cross.y);
            g.lineTo(cross.x - 5, cross.y);
            g.moveTo(cross.x + 5, cross.y);
            g.lineTo(cross.x + 15, cross.y);
            g.moveTo(cross.x, cross.y - 15);
            g.lineTo(cross.x, cross.y - 5);
            g.moveTo(cross.x, cross.y + 5);
            g.lineTo(cross.x, cross.y + 15);
            g.stroke();
        }
        if (flashT > 0) {
            g.fillStyle = `rgba(255,80,60,${flashT * 0.8})`;
            g.fillRect(-20, -20, Wd + 40, H + 40);
        }
        g.restore();
        if (A.state !== 'play' && A.state !== 'paused') return;
        g.textAlign = 'left';
        g.font = `800 13px ${FONT}`;
        let hy = 22;
        if (megaShots > 0) { g.fillStyle = '#ff6fb5'; g.fillText(`💥 Mega x${megaShots}`, 12, hy); hy += 18; }
        if (slowT > 0) { g.fillStyle = '#c39bff'; g.fillText(`⏳ Slow ${Math.ceil(slowT)}s`, 12, hy); }
        g.textAlign = 'center';
        if (phase === 'intro') {
            g.fillStyle = '#ffffff';
            g.font = `900 40px ${FONT}`;
            g.fillText(`Wave ${wave}`, Wd / 2, H * 0.38);
            g.font = `700 18px ${FONT}`;
            g.fillStyle = '#ffd166';
            g.fillText(`${mult}x points · defend the cities`, Wd / 2, H * 0.38 + 34);
        }
        if (phase === 'bonus' && bonus) {
            g.fillStyle = 'rgba(7,11,36,.55)';
            rrect(g, Wd / 2 - 160, H * 0.27, 320, 150, 18);
            g.fill();
            g.fillStyle = '#ffffff';
            g.font = `900 24px ${FONT}`;
            g.fillText('Bonus points', Wd / 2, H * 0.27 + 36);
            g.font = `700 16px ${FONT}`;
            g.fillStyle = '#8fe3ff';
            g.fillText(`Missiles left: ${bonus.counted}  ×${5 * mult}`, Wd / 2, H * 0.27 + 66);
            g.fillStyle = '#9ff0ff';
            g.fillText(`Cities saved: ${bonus.cities}  ×${100 * mult}`, Wd / 2, H * 0.27 + 92);
            g.fillStyle = '#fff27a';
            g.font = `900 22px ${FONT}`;
            g.fillText(`+${Curio.fmt(bonus.pts)}`, Wd / 2, H * 0.27 + 128);
        }
        if (overT > 0) {
            g.fillStyle = '#ffffff';
            g.font = `900 34px ${FONT}`;
            g.fillText('The end', Wd / 2, H * 0.4);
        }
    }
    A.debug = () => ({
        wave, phase, enemies: enemies.length, shots: shots.length, booms: booms.length,
        ammo: bases.map((b) => b.ammo), cities: cities.filter((c) => c.alive).length,
        nuke() { for (const c of cities) c.alive = false; },
        skip() { phaseT = 0; spawnT = 999; },
        clear() { queue = []; enemies = []; planes = []; boss = null; crates = []; },
        boss() { spawnBoss(); },
        crate(k) { spawnCrate(); crates[crates.length - 1].kind = k || 'mega'; crates[crates.length - 1].y = 200; },
        smart() { spawnSmart(); },
        blast(x, y) { boom(x, y, 60, true); }
    });
    freshWorld();
    wave = 1;
    mult = 1;
    phase = 'menu';
    demoT = 0;
    A.boot();
})();
