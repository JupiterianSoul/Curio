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
    const L = 800, S = 500, PX = 30, PT = 14, R = 8;
    const DIFF = {
        easy: { speed: 300, react: 0.24, err: 62, ball: 330, mult: 1, name: 'Easy' },
        normal: { speed: 440, react: 0.13, err: 34, ball: 370, mult: 2, name: 'Normal' },
        hard: { speed: 640, react: 0.05, err: 14, ball: 410, mult: 3, name: 'Hard' }
    };
    const OPPS = [
        { name: 'Rookie Rob', em: '🤖', color: '#7cb342', cfg: { speed: 280, react: 0.26, err: 70, ball: 320, mult: 1 }, twist: null, line: 'Just happy to be here.' },
        { name: 'Spin Doctor', em: '🌀', color: '#ab47bc', cfg: { speed: 380, react: 0.16, err: 40, ball: 350, mult: 2 }, twist: 'spin', line: 'Every return curves. Watch the bend.' },
        { name: 'The Wall', em: '🧱', color: '#a1887f', cfg: { speed: 230, react: 0.2, err: 24, ball: 340, mult: 2 }, twist: 'big', line: 'A paddle the size of a door.' },
        { name: 'Speedy Sue', em: '⚡', color: '#fdd835', cfg: { speed: 520, react: 0.1, err: 34, ball: 430, mult: 3 }, twist: 'fast', line: 'The ball never slows down.' },
        { name: 'Double Trouble', em: '👯', color: '#26c6da', cfg: { speed: 460, react: 0.12, err: 36, ball: 360, mult: 3 }, twist: 'multi', line: 'Two balls. One of you.' },
        { name: 'Glitch', em: '👾', color: '#ef5350', cfg: { speed: 520, react: 0.09, err: 26, ball: 390, mult: 4 }, twist: 'ghost', line: 'The ball flickers out of existence mid-court.' },
        { name: 'The Champion', em: '👑', color: '#ffb300', cfg: { speed: 700, react: 0.045, err: 12, ball: 420, mult: 5 }, twist: null, line: 'Undefeated. Until now?' }
    ];
    const POWS = { big: ['#7dffb0', '↕', 'Big paddle'], fast: ['#ff7043', '»', 'Fireball'], multi: ['#ffd54f', '⁂', 'Multiball'], shield: ['#80deea', '▮', 'Goal shield'] };
    const COURTS = {
        classic: { bg: ['#2b5a72', '#1f3b4d'], dbg: ['#1b2233', '#10131c'], line: 'rgba(255,255,255,.16)', c1: '#ff5a36', c2: '#3d8bfd' },
        neon: { bg: ['#1a0b2e', '#07020f'], dbg: ['#1a0b2e', '#07020f'], line: 'rgba(255,60,172,.35)', c1: '#ff3cac', c2: '#22d8ff' },
        grass: { bg: ['#4caf50', '#2e7d32'], dbg: ['#2e5d31', '#1b3a1e'], line: 'rgba(255,255,255,.7)', c1: '#ff7043', c2: '#5c6bc0' },
        clay: { bg: ['#d9774b', '#b65b33'], dbg: ['#6e3a24', '#4a2617'], line: 'rgba(255,255,255,.75)', c1: '#1e88e5', c2: '#43a047' }
    };
    const BADGES = [
        ['win', '🏓', 'First win', 'Beat the robot'],
        ['normal', '🙂', 'Getting good', 'Beat the Normal robot'],
        ['hard', '😤', 'Robot crusher', 'Beat the Hard robot'],
        ['shutout', '🥚', 'Shutout', 'Win without dropping a point'],
        ['comeback', '💪', 'Comeback kid', 'Win after trailing by 3'],
        ['rally20', '🔁', 'Long rally', 'Reach a 20 hit rally'],
        ['rally50', '♾️', 'Marathon rally', 'Reach a 50 hit rally'],
        ['g3', '🥉', 'Gauntlet runner', 'Reach stage 3 of the Gauntlet'],
        ['g5', '🥈', 'Gauntlet fighter', 'Reach stage 5 of the Gauntlet'],
        ['champ', '👑', 'Champion', 'Beat the whole Gauntlet'],
        ['power', '🎁', 'Power player', 'Collect 10 power-ups'],
        ['twop', '👥', 'Friendly match', 'Finish a two-player match']
    ];
    const oldMode = Curio.store.get('pong:mode', null), oldDiff = Curio.store.get('pong:diff', null);
    if (oldMode && Curio.store.get('pong-opt-mode', null) == null) Curio.store.set('pong-opt-mode', oldMode);
    if (oldDiff && Curio.store.get('pong-opt-diff', null) == null) Curio.store.set('pong-opt-diff', oldDiff);
    let mode = 'cpu', diff = 'normal', portrait = false, WIN = 7, stage = 0, court = COURTS.classic;
    let p1, p2, balls, pts, serveT, serveDir, rally, longest, endT, banner, flash, hitPts, ptrs, demo, items, itemT, powN, maxDeficit, shields, stageT, trailT;
    const A = Arcade({
        width: L, height: S, size, reset, update, draw, key, pointer, idle, capture: ['w', 's'], badges: BADGES,
        bestKey: () => (A.opt('mode') === '2p' ? '2p-rally' : A.opt('mode') === 'gauntlet' ? 'gauntlet' : 'cpu-' + A.opt('diff')),
        option: () => paintOpts(),
        menuStats: () => [[' matches', Curio.fmt(A.profile.games || 0)], [' wins', Curio.fmt(A.stat('wins'))], [' longest rally', A.stat('rally') || '-'], [' best gauntlet stage', A.stat('stage') ? `${A.stat('stage')}/7` : '-']],
        theme: () => { }
    });
    function paintOpts() {
        mode = A.opt('mode') || 'cpu';
        diff = A.opt('diff') || 'normal';
        court = COURTS[A.opt('court')] || COURTS.classic;
        const dl = document.getElementById('diffwrap');
        if (dl) dl.style.opacity = mode === 'cpu' ? '1' : '.45';
        const gl = document.getElementById('ladder');
        if (gl) {
            gl.innerHTML = '';
            const reached = A.stat('stage');
            OPPS.forEach((o, i) => {
                const s = document.createElement('span');
                s.className = 'pg-rung' + (i < reached ? ' done' : '') + (mode === 'gauntlet' ? '' : ' dim');
                s.textContent = i < reached + 1 ? o.em : '❔';
                s.title = i < reached + 1 ? `${i + 1}. ${o.name}: ${o.line}` : `${i + 1}. ???`;
                gl.append(s);
            });
        }
        A.hud('p1l', mode === '2p' ? 'P1' : 'You');
        A.hud('p2l', mode === '2p' ? 'P2' : mode === 'gauntlet' ? 'Rival' : 'CPU');
        A.hud('scl', mode === '2p' ? 'Rally' : 'Score');
    }
    function size(aw, ah) {
        portrait = ah > aw * 1.05;
        return portrait ? { w: S, h: L } : { w: L, h: S };
    }
    const opp = () => OPPS[stage];
    const cpuCfg = () => (mode === 'gauntlet' ? opp().cfg : DIFF[diff]);
    function paddle(x, color) { return { x, y: S / 2, vy: 0, ty: null, color, aiT: 0, aim: S / 2, err: 0, flash: 0, h: 50, bigT: 0 }; }
    function reset() {
        paintOpts();
        WIN = mode === 'gauntlet' ? 5 : 7;
        stage = 0;
        pts = [0, 0];
        longest = 0;
        hitPts = 0;
        powN = 0;
        demo = A.state !== 'play';
        setupMatch();
        A.fx.clear();
    }
    function setupMatch() {
        p1 = paddle(PX, court.c1);
        p2 = paddle(L - PX, mode === 'gauntlet' ? opp().color : court.c2);
        if (mode === 'gauntlet' && opp().twist === 'big') p2.h = 88;
        pts = [0, 0];
        rally = 0;
        endT = 0;
        stageT = 0;
        banner = mode === 'gauntlet' && !demo ? { text: `${opp().em} ${opp().name}`, sub: opp().line, t: -0.6 } : null;
        flash = 0;
        trailT = 0;
        maxDeficit = 0;
        items = [];
        itemT = 6 + Math.random() * 4;
        shields = [false, false];
        ptrs = new Map();
        serve(Math.random() < 0.5 ? -1 : 1, mode === 'gauntlet' && !demo ? 2.4 : 1.3);
        hud();
    }
    function hud() {
        A.hud('p1', pts[0]);
        A.hud('p2', pts[1]);
        if (mode === '2p') A.setScore(longest);
    }
    function newBall() { return { x: L / 2, y: S / 2, vx: 0, vy: 0, spin: 0, speed: 0, last: -1, ghost: 0 }; }
    function serve(dir, t) {
        balls = [newBall()];
        serveDir = dir;
        serveT = t;
        rally = 0;
    }
    function launch() {
        const ball = balls[0];
        const base = mode === '2p' ? 380 : cpuCfg().ball;
        const a = (Math.random() - 0.5) * 0.9;
        ball.speed = base;
        ball.vx = Math.cos(a) * base * serveDir;
        ball.vy = Math.sin(a) * base;
        A.beep(520, 0.06, 'square', 0.05);
        if (mode === 'gauntlet' && opp().twist === 'multi') setTimeout(() => { if (A.state === 'play' && balls.length === 1 && balls[0].speed) splitBall(balls[0]); }, 1500);
    }
    function splitBall(b) {
        const nb = { ...b, vy: -b.vy || 120, spin: -b.spin };
        balls.push(nb);
        A.fx.ring(b.x, b.y, '#ffd54f', 40, 0.4, 3);
        A.beep(990, 0.06, 'triangle', 0.07);
    }
    function key(k, down) {
        if (down && ['w', 's', 'a', 'd'].includes(k)) p1.ty = null;
        if (down && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(k)) (mode === '2p' ? p2 : p1).ty = null;
    }
    function toCourt(p) { return portrait ? { x: L - p.y, y: p.x } : { x: p.x, y: p.y }; }
    function pointer(type, p, e) {
        const c = toCourt(p);
        if (type === 'up') { ptrs.delete(e.pointerId); return; }
        if (e.pointerType === 'mouse' && type === 'down') return;
        let side = ptrs.get(e.pointerId);
        if (side == null) {
            side = mode === '2p' && c.x > L / 2 ? 2 : 1;
            if (e.pointerType !== 'mouse') ptrs.set(e.pointerId, side);
        }
        if (mode !== '2p') side = 1;
        (side === 2 ? p2 : p1).ty = c.y;
    }
    function predict(px, ball) {
        if (Math.abs(ball.vx) < 1) return S / 2;
        const t = (px - ball.x) / ball.vx;
        if (t < 0) return S / 2;
        let y = ball.y + ball.vy * t + 0.5 * ball.spin * t * t * 0.4;
        const lo = R, hi = S - R, span = hi - lo;
        y -= lo;
        y = ((y % (2 * span)) + 2 * span) % (2 * span);
        if (y > span) y = 2 * span - y;
        return y + lo;
    }
    function threat(p) {
        let best = null, bt = Infinity;
        for (const b of balls) {
            const toward = p.x > L / 2 ? b.vx > 0 : b.vx < 0;
            if (!toward) continue;
            const t = (p.x - b.x) / b.vx;
            if (t >= 0 && t < bt) { bt = t; best = b; }
        }
        return best;
    }
    function ai(p, dt, cfg) {
        p.aiT -= dt;
        if (p.aiT <= 0) {
            p.aiT = cfg.react;
            const b = threat(p);
            if (b) p.aim = predict(p.x, b) + p.err;
            else p.aim = balls[0] ? S / 2 + (balls[0].y - S / 2) * 0.3 : S / 2;
        }
        const d = p.aim - p.y;
        const move = Math.sign(d) * Math.min(Math.abs(d), cfg.speed * dt);
        if (Math.abs(d) > 3) p.y += move;
    }
    function movePaddle(p, dt, up, dn, cfg) {
        const py = p.y;
        if (cfg) ai(p, dt, cfg);
        else if (up || dn) {
            p.vy += ((dn - up) * 680 - p.vy) * Math.min(1, dt * 18);
            p.y += p.vy * dt;
        }
        else if (p.ty != null) p.y += (p.ty - p.y) * Math.min(1, dt * 26);
        if (p.bigT > 0) { p.bigT -= dt; if (p.bigT <= 0) p.h = p === p2 && mode === 'gauntlet' && opp().twist === 'big' ? 88 : 50; }
        p.y = Math.max(p.h, Math.min(S - p.h, p.y));
        const v = (p.y - py) / dt;
        if (!(up || dn) || cfg) p.vy = v;
        p.flash = Math.max(0, p.flash - dt);
    }
    function hit(p, dir, ball) {
        const h = p.h;
        const off = Math.max(-1, Math.min(1, (ball.y - p.y) / h));
        const fast = mode === 'gauntlet' && opp().twist === 'fast';
        const s = Math.min(fast ? 1150 : 1050, ball.speed * (fast ? 1.07 : 1.045) + 8);
        const a = off * 0.98;
        ball.speed = s;
        ball.vx = Math.cos(a) * s * dir;
        ball.vy = Math.sin(a) * s;
        ball.spin = Math.max(-900, Math.min(900, p.vy * 0.9));
        if (p === p2 && mode === 'gauntlet' && opp().twist === 'spin') ball.spin = (Math.random() < 0.5 ? -1 : 1) * (500 + Math.random() * 400);
        ball.x = p.x + dir * (PT / 2 + R + 0.5);
        ball.last = p === p1 ? 0 : 1;
        p.flash = 0.18;
        rally++;
        longest = Math.max(longest, rally);
        const edge = Math.abs(off) > 0.7;
        A.fx.burst(ball.x, ball.y, edge ? 16 : 9, [p.color, '#ffffff', shade(p.color, 0.4)], { speed: edge ? 260 : 170, life: 0.45, size: 4, gravity: 0, angle: dir > 0 ? 0 : Math.PI, spread: 2.2 });
        A.fx.ring(ball.x, ball.y, p.color, edge ? 34 : 20, 0.3, 2);
        A.beep(edge ? 620 : 440 + Math.min(rally, 20) * 12, 0.05, 'square', 0.07);
        if (edge) A.shake(3);
        if (!demo) A.buzz(8);
        const other = dir > 0 ? p2 : p1;
        const cfg = cpuCfg();
        other.err = (Math.random() - 0.5) * 2 * cfg.err + (cfg.react < 0.06 ? (Math.random() < 0.5 ? -1 : 1) * 22 : 0);
        other.aiT = 0;
        if (!demo && mode !== '2p' && p === p1) {
            hitPts++;
            A.addScore(5 * cfg.mult);
        }
        if (!demo) {
            if (mode === '2p') hud();
            A.statMax('rally', rally);
            if (rally >= 20) A.unlock('rally20');
            if (rally >= 50) A.unlock('rally50');
        }
        if (rally > 0 && rally % 10 === 0 && !demo) banner = { text: `${rally} hit rally!`, t: 0 };
    }
    function point(winner, ball) {
        const loser = 1 - winner;
        if (shields[loser]) {
            shields[loser] = false;
            ball.vx = -ball.vx;
            ball.x = loser === 0 ? R * 2 : L - R * 2;
            A.fx.ring(ball.x, ball.y, '#80deea', 60, 0.5, 4);
            A.sweep(900, 300, 0.25, 'triangle', 0.07);
            return false;
        }
        pts[winner]++;
        maxDeficit = Math.max(maxDeficit, pts[1] - pts[0]);
        const gx = winner === 0 ? L : 0;
        A.fx.burst(gx, ball.y, 34, [winner === 0 ? p1.color : p2.color, '#ffffff', '#ffd54f'], { speed: 360, life: 0.8, size: 5, gravity: 0, angle: winner === 0 ? Math.PI : 0, spread: 2.6 });
        A.shake(10);
        flash = 0.25;
        if (!demo) {
            if (winner === 0) {
                A.chord([523, 659, 784], 70, 0.09, 'triangle', 0.09);
                if (mode !== '2p') A.addScore(100 * cpuCfg().mult);
            }
            else {
                A.sweep(420, 110, 0.4, 'sawtooth', 0.07);
                if (mode !== '2p') A.buzz(60);
            }
            hud();
        }
        const done = pts[winner] >= WIN;
        if (done && !demo) {
            endT = 1.2;
            const who = mode === '2p' ? `Player ${winner + 1} wins!` : winner === 0 ? (mode === 'gauntlet' ? `${opp().name} defeated!` : 'Match point won!') : mode === 'gauntlet' ? `${opp().name} wins` : 'The robot wins';
            banner = { text: who, t: 0 };
            balls = [];
            return true;
        }
        if (done && demo) pts = [0, 0];
        else if (!demo) banner = { text: mode === '2p' ? `Point P${winner + 1}` : winner === 0 ? 'Point!' : mode === 'gauntlet' ? `${opp().em} scores` : 'Robot scores', t: 0.6 };
        serve(winner === 0 ? 1 : -1, 1);
        return true;
    }
    function finish() {
        const youWin = pts[0] > pts[1];
        if (mode === '2p') {
            A.setScore(longest);
            A.unlock('twop');
            Curio.confetti();
            A.over({ title: `Player ${youWin ? 1 : 2} wins`, emoji: '🏆', msg: `${pts[0]} to ${pts[1]}. Longest rally: ${longest} hits. Rematch?`, lines: [[' to ', `${pts[0]} : ${pts[1]}`], [' longest rally', longest]], share: `🏓 Curio Pong, two players: ${pts[0]} to ${pts[1]}\n🔁 Longest rally ${longest}` });
            return;
        }
        if (youWin) {
            A.stat('wins', 1);
            if (pts[1] === 0) A.unlock('shutout');
            if (maxDeficit >= 3) A.unlock('comeback');
        }
        if (mode === 'gauntlet') {
            if (youWin) {
                A.addScore(500 * opp().cfg.mult);
                A.chord([523, 659, 784, 1047], 90, 0.12, 'triangle', 0.1);
                A.statMax('stage', stage + 1);
                if (stage + 1 >= 3) A.unlock('g3');
                if (stage + 1 >= 5) A.unlock('g5');
                if (stage === OPPS.length - 1) {
                    A.unlock('champ');
                    Curio.confetti();
                    A.over({ title: 'Gauntlet champion!', emoji: '👑', msg: 'All seven rivals defeated. The paddles bow before you.', lines: [[' stages', `${OPPS.length}/${OPPS.length}`], [' longest rally', longest]], share: `🏓 Curio Pong Gauntlet: CHAMPION 👑\n${OPPS.map((o) => o.em).join('')} · ${Curio.fmt(A.score)} pts` });
                    return;
                }
                Curio.confetti(60);
                stage++;
                setupMatch();
                return;
            }
            A.over({
                title: `${opp().name} wins`, emoji: opp().em, msg: `Knocked out at stage ${stage + 1} of 7, ${pts[0]} to ${pts[1]}. ${opp().line}`,
                lines: [[' stage', `${stage + 1}/7`], [' longest rally', longest]],
                share: `🏓 Curio Pong Gauntlet: stage ${stage + 1}/7 (${opp().name})\n${OPPS.slice(0, stage + 1).map((o, i) => (i < stage ? '✅' : '❌')).join('')} · ${Curio.fmt(A.score)} pts`
            });
            return;
        }
        if (youWin) {
            A.unlock('win');
            if (diff !== 'easy') A.unlock('normal');
            if (diff === 'hard') A.unlock('hard');
            A.addScore(500 * DIFF[diff].mult);
            Curio.confetti();
            A.chord([523, 659, 784, 1047], 90, 0.12, 'triangle', 0.1);
        }
        const msgs = youWin
            ? [`You beat the ${DIFF[diff].name.toLowerCase()} robot ${pts[0]} to ${pts[1]}. It is updating its firmware out of spite.`, `${pts[0]} to ${pts[1]}. Humanity: 1, toaster with opinions: 0.`]
            : [`${pts[0]} to ${pts[1]}. The robot would like you to know it was not even trying. (It was.)`, `The robot takes it ${pts[1]} to ${pts[0]}. Try hitting with the edge of the paddle.`];
        A.over({
            title: youWin ? 'You win!' : 'Robot wins', emoji: youWin ? '🏆' : '🤖', msg: Curio.pick(msgs) + ` Longest rally: ${longest}.`,
            lines: [[' score', `${pts[0]} : ${pts[1]}`], [' longest rally', longest], [' robot', DIFF[diff].name]],
            share: `🏓 Curio Pong vs ${DIFF[diff].name} robot: ${youWin ? 'won' : 'lost'} ${pts[0]} to ${pts[1]}\n🔁 Longest rally ${longest} · ${Curio.fmt(A.score)} pts`
        });
    }
    function grab(ball, it) {
        const who = ball.last;
        if (who < 0) return;
        const p = who === 0 ? p1 : p2;
        if (!demo && who === 0) { powN++; A.stat('pows', 1); if (A.stat('pows') >= 10) A.unlock('power'); }
        if (it.kind === 'big') { p.h = 80; p.bigT = 9; }
        else if (it.kind === 'fast') { ball.speed = Math.min(1150, ball.speed * 1.3); const k = ball.speed / Math.hypot(ball.vx, ball.vy); ball.vx *= k; ball.vy *= k; ball.fire = 2; }
        else if (it.kind === 'multi') splitBall(ball);
        else shields[who] = true;
        const [col, , name] = POWS[it.kind];
        A.fx.text(it.x, it.y - 20, name, col, 16, 1);
        A.fx.ring(it.x, it.y, col, 40, 0.4, 3);
        A.chord([660, 990, 1320], 50, 0.07, 'triangle', 0.07);
    }
    function sim(dt) {
        A.fx.update(dt);
        flash = Math.max(0, flash - dt);
        if (banner) {
            banner.t += dt;
            if (banner.t > (banner.sub ? 2.2 : 1.6)) banner = null;
        }
        const k = A.keys;
        if (demo) {
            movePaddle(p1, dt, 0, 0, DIFF.normal);
            movePaddle(p2, dt, 0, 0, DIFF.normal);
        }
        else if (mode === '2p') {
            movePaddle(p1, dt, k.has('w') || k.has('a'), k.has('s') || k.has('d'), null);
            movePaddle(p2, dt, k.has('ArrowUp') || k.has('ArrowLeft'), k.has('ArrowDown') || k.has('ArrowRight'), null);
        }
        else {
            const up = k.has('w') || k.has('a') || k.has('ArrowUp') || k.has('ArrowLeft');
            const dn = k.has('s') || k.has('d') || k.has('ArrowDown') || k.has('ArrowRight');
            movePaddle(p1, dt, up, dn, null);
            movePaddle(p2, dt, 0, 0, cpuCfg());
        }
        if (endT) {
            endT -= dt;
            if (endT <= 0) { endT = 0; finish(); }
            return;
        }
        if (serveT > 0) {
            serveT -= dt;
            if (serveT <= 0) launch();
            return;
        }
        if (!demo && mode !== 'gauntlet' && A.opt('pw') === 'on') {
            itemT -= dt;
            if (itemT <= 0 && items.length < 2) {
                itemT = 7 + Math.random() * 6;
                items.push({ x: L * (0.38 + Math.random() * 0.24), y: 60 + Math.random() * (S - 120), kind: Curio.pick(Object.keys(POWS)), t: 0 });
            }
        }
        for (const it of items) it.t += dt;
        const ghostly = mode === 'gauntlet' && opp().twist === 'ghost';
        for (let bi = balls.length - 1; bi >= 0; bi--) {
            const ball = balls[bi];
            if (!ball.speed) continue;
            ball.spin *= Math.exp(-2.2 * dt);
            ball.vy += ball.spin * dt * 0.6;
            if (ball.fire) ball.fire = Math.max(0, ball.fire - dt);
            const ox = ball.x;
            ball.x += ball.vx * dt;
            ball.y += ball.vy * dt;
            if (ghostly) ball.ghost = ball.x > L * 0.3 && ball.x < L * 0.62 && ball.vx < 0 ? 1 : 0;
            if (ball.y < R) { ball.y = R; ball.vy = Math.abs(ball.vy); ball.spin *= 0.4; if (!demo) A.beep(260, 0.03, 'triangle', 0.05); }
            if (ball.y > S - R) { ball.y = S - R; ball.vy = -Math.abs(ball.vy); ball.spin *= 0.4; if (!demo) A.beep(260, 0.03, 'triangle', 0.05); }
            const minVx = ball.speed * 0.42;
            if (Math.abs(ball.vx) < minVx && ball.vx !== 0) {
                ball.vx = Math.sign(ball.vx) * minVx;
                const vyMag = Math.sqrt(Math.max(0, ball.speed * ball.speed - minVx * minVx));
                ball.vy = Math.sign(ball.vy || 1) * vyMag;
            }
            const face1 = p1.x + PT / 2 + R, face2 = p2.x - PT / 2 - R;
            if (ball.vx < 0 && ox >= face1 - 2 && ball.x <= face1 && Math.abs(ball.y - p1.y) <= p1.h + R) hit(p1, 1, ball);
            else if (ball.vx > 0 && ox <= face2 + 2 && ball.x >= face2 && Math.abs(ball.y - p2.y) <= p2.h + R) hit(p2, -1, ball);
            for (let i = items.length - 1; i >= 0; i--) if (Math.hypot(items[i].x - ball.x, items[i].y - ball.y) < R + 16) { const it = items.splice(i, 1)[0]; grab(ball, it); }
            if (bi === 0 || ball.fire) {
                trailT += dt;
                if (trailT > 1 / 70) {
                    trailT = 0;
                    const hot = ball.fire ? 1 : Math.min(1, (ball.speed - 330) / 520);
                    const cols = hot > 0.5 ? ['#ff5a36', '#ffb74d', '#ffd54f'] : hot > 0.2 ? ['#ffd54f', '#ffffff'] : ['#9ad0ff', '#ffffff'];
                    if (!ball.ghost) A.fx.burst(ball.x, ball.y, 1, cols, { speed: 30, life: 0.3 + hot * 0.25, size: 5 + hot * 3, gravity: 0, drag: 3 });
                }
            }
            if (ball.x < -R * 3 || ball.x > L + R * 3) {
                const winner = ball.x < 0 ? 1 : 0;
                if (balls.length > 1 && !shields[1 - winner]) {
                    balls.splice(bi, 1);
                    pts[winner]++;
                    maxDeficit = Math.max(maxDeficit, pts[1] - pts[0]);
                    if (!demo) { hud(); if (winner === 0 && mode !== '2p') A.addScore(100 * cpuCfg().mult); A.shake(6); }
                    A.fx.burst(winner === 0 ? L : 0, ball.y, 24, ['#ffffff', '#ffd54f'], { speed: 300, life: 0.6, size: 4, gravity: 0, angle: winner === 0 ? Math.PI : 0, spread: 2.6 });
                    if (pts[winner] >= WIN && !demo) { endT = 1.2; banner = { text: winner === 0 ? 'Match won!' : 'Match lost', t: 0 }; balls = []; return; }
                    continue;
                }
                point(winner, ball);
                return;
            }
        }
    }
    function update(dt) { sim(dt); }
    function idle(dt) {
        if (A.state === 'menu') {
            if (!demo) { demo = true; mode = 'cpu'; setupMatch(); paintOpts(); }
            demo = true;
            sim(dt);
        }
        else A.fx.update(dt);
    }
    A.start = ((orig) => () => { demo = false; orig(); demo = false; })(A.start);
    function drawPaddle(g, p) {
        const h = p.h;
        const gr = g.createLinearGradient(p.x - PT / 2, 0, p.x + PT / 2, 0);
        gr.addColorStop(0, shade(p.color, 0.25)); gr.addColorStop(1, shade(p.color, -0.15));
        g.fillStyle = p.flash > 0 ? '#ffffff' : gr;
        g.shadowColor = p.color;
        g.shadowBlur = 14 + p.flash * 60;
        rrect(g, p.x - PT / 2, p.y - h, PT, h * 2, 7);
        g.fill();
        g.shadowBlur = 0;
        g.fillStyle = 'rgba(255,255,255,.4)';
        g.fillRect(p.x - PT / 2 + 3, p.y - h + 8, 3, h * 2 - 16);
    }
    function drawItem(g, it) {
        const [col, glyph] = POWS[it.kind];
        const r = 14 + Math.sin(it.t * 5) * 1.5;
        g.save();
        g.translate(it.x, it.y);
        g.rotate(Math.sin(it.t * 2) * 0.2);
        g.shadowColor = col; g.shadowBlur = 16;
        g.fillStyle = 'rgba(10,14,30,.85)';
        g.beginPath(); g.arc(0, 0, r, 0, 7); g.fill();
        g.lineWidth = 2.5; g.strokeStyle = col; g.stroke();
        g.shadowBlur = 0;
        g.fillStyle = col;
        g.font = `900 16px ${FONT}`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(glyph, 0, 1);
        g.restore();
    }
    function draw(g) {
        const dark = A.dark;
        const sw = portrait ? S : L, sh = portrait ? L : S;
        const bgc = dark ? court.dbg : court.bg;
        g.save();
        g.fillStyle = bgc[1];
        g.fillRect(-20, -20, sw + 40, sh + 40);
        if (portrait) g.transform(0, -1, 1, 0, 0, L);
        const bg = g.createRadialGradient(L / 2, S / 2, 40, L / 2, S / 2, L * 0.6);
        bg.addColorStop(0, bgc[0]);
        bg.addColorStop(1, bgc[1]);
        g.fillStyle = bg;
        g.fillRect(0, 0, L, S);
        if (court === COURTS.grass) { g.fillStyle = 'rgba(255,255,255,.05)'; for (let x = 0; x < L; x += 80) g.fillRect(x, 0, 40, S); }
        if (court === COURTS.clay) { g.fillStyle = 'rgba(0,0,0,.04)'; for (let i = 0; i < 60; i++) g.fillRect((i * 137) % L, (i * 71) % S, 3, 2); }
        if (flash) { g.fillStyle = `rgba(255,255,255,${flash * 0.4})`; g.fillRect(0, 0, L, S); }
        g.strokeStyle = court.line;
        g.lineWidth = 4;
        if (court === COURTS.neon) { g.shadowColor = '#ff3cac'; g.shadowBlur = 12; }
        g.strokeRect(6, 6, L - 12, S - 12);
        g.setLineDash([14, 14]);
        g.beginPath(); g.moveTo(L / 2, 14); g.lineTo(L / 2, S - 14); g.stroke();
        g.setLineDash([]);
        g.beginPath(); g.arc(L / 2, S / 2, 60, 0, 7); g.stroke();
        g.shadowBlur = 0;
        for (const [i, x] of [[0, 3], [1, L - 3]]) if (shields[i]) { g.fillStyle = `rgba(128,222,234,${0.5 + 0.3 * Math.sin(A.time * 8)})`; g.fillRect(x - 3, 10, 6, S - 20); }
        for (const it of items) drawItem(g, it);
        A.fx.draw(g);
        drawPaddle(g, p1);
        drawPaddle(g, p2);
        for (const ball of balls) {
            if (ball.x < -900) continue;
            const blink = serveT > 0 ? (Math.sin(A.time * 18) > 0 ? 1 : 0.35) : ball.ghost ? (Math.sin(A.time * 40) > 0.85 ? 0.5 : 0.04) : 1;
            g.globalAlpha = blink;
            g.fillStyle = ball.fire ? '#ffb74d' : '#ffffff';
            g.shadowColor = ball.fire ? '#ff5a36' : '#ffffff';
            g.shadowBlur = 16;
            g.beginPath(); g.arc(ball.x, ball.y, R, 0, 7); g.fill();
            g.shadowBlur = 0;
            g.globalAlpha = 1;
            if (serveT > 0 && serveT < 1.2) {
                g.fillStyle = 'rgba(255,255,255,.55)';
                const ax = ball.x + serveDir * 30;
                g.beginPath(); g.moveTo(ax + serveDir * 12, ball.y); g.lineTo(ax, ball.y - 9); g.lineTo(ax, ball.y + 9); g.closePath(); g.fill();
            }
        }
        g.restore();
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = `900 72px ${FONT}`;
        const pos = portrait ? [[S / 2, L / 2 + 90], [S / 2, L / 2 - 90]] : [[L / 2 - 90, 80], [L / 2 + 90, 80]];
        [0, 1].forEach((i) => {
            g.globalAlpha = 0.55;
            g.fillStyle = i === 0 ? p1.color : p2.color;
            g.fillText(String(pts[i]), pos[i][0], pos[i][1]);
            g.globalAlpha = 1;
        });
        if (mode === 'gauntlet' && A.state !== 'menu') {
            g.font = `800 14px ${FONT}`;
            g.fillStyle = 'rgba(255,255,255,.75)';
            g.fillText(`Stage ${stage + 1}/7 · ${opp().em} ${opp().name}`, sw / 2, portrait ? 24 : 26);
        }
        if (A.state === 'play' && rally >= 3) {
            g.font = `800 15px ${FONT}`;
            g.fillStyle = 'rgba(255,255,255,.55)';
            g.fillText(`rally ${rally}`, sw / 2, portrait ? sh / 2 : sh - 26);
        }
        if (banner && A.state !== 'menu' && banner.t >= 0) {
            const life = banner.sub ? 2.2 : 1.6;
            const a = Math.min(1, banner.t * 5, (life - banner.t) * 3);
            g.globalAlpha = Math.max(0, a);
            g.font = `900 ${portrait ? 32 : 42}px ${FONT}`;
            g.lineWidth = 7;
            g.strokeStyle = '#10131c';
            g.fillStyle = '#ffffff';
            const by = portrait ? sh * 0.36 : sh * 0.5;
            g.strokeText(banner.text, sw / 2, by);
            g.fillText(banner.text, sw / 2, by);
            if (banner.sub) {
                g.font = `800 ${portrait ? 15 : 17}px ${FONT}`;
                g.lineWidth = 5;
                g.fillStyle = '#ffd54f';
                g.strokeText(banner.sub, sw / 2, by + 38);
                g.fillText(banner.sub, sw / 2, by + 38);
            }
            g.globalAlpha = 1;
        }
        g.textBaseline = 'alphabetic';
    }
    A.debug = () => ({
        pts: pts.slice(), rally, ball: balls[0] ? { ...balls[0] } : null, balls: balls.length, p1y: p1.y, p2y: p2.y, serveT, portrait, mode, diff, stage, items: items.length,
        win() { pts = [WIN - 1, 0]; serve(1, 0.01); const ball = balls[0]; ball.x = L - 60; ball.vx = 900; ball.vy = 0; ball.speed = 900; serveT = 0; p2.y = 30; p2.aim = 30; p2.aiT = 9; },
        lose() { pts = [0, WIN - 1]; serve(-1, 0.01); const ball = balls[0]; ball.x = 60; ball.vx = -900; ball.vy = 0; ball.speed = 900; serveT = 0; p1.y = 30; p1.ty = 30; },
        item(k) { items.push({ x: L / 2, y: S / 2, kind: k || 'multi', t: 0 }); }
    });
    paintOpts();
    reset();
    A.boot();
})();
