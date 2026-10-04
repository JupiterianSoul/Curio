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
    const COLS = 9, TS = 48, W = COLS * TS, HOP = 0.13, LOOP = COLS + 12, LO = -6;
    const CAR_COLORS = ['#ef5350', '#42a5f5', '#ffca28', '#ab47bc', '#26a69a', '#ff7043', '#ec407a', '#7e57c2'];
    let H = 720;
    const BIOMES = [
        { name: 'Meadow', grass: ['#9ccc65', '#8bc34a'], dgrass: ['#33502a', '#2e4a26'], tree: 'round', water: ['#4fc3f7', '#29b6f6'], dwater: ['#1e4f78', '#173f61'], fl: ['#fff176', '#f48fb1', '#ffffff'] },
        { name: 'Autumn Woods', grass: ['#d9a95e', '#cf9b4f'], dgrass: ['#4d3c24', '#45351f'], tree: 'autumn', water: ['#5fa8d3', '#4b97c4'], dwater: ['#1f4766', '#193b55'], fl: ['#e65100', '#bf360c', '#ffcc80'] },
        { name: 'Snowy Pass', grass: ['#f1f6f9', '#e3ecf2'], dgrass: ['#4a5560', '#424c56'], tree: 'pine', water: ['#81c4e8', '#6db6dd'], dwater: ['#24506d', '#1e455e'], fl: ['#b3e5fc', '#ffffff', '#cfd8dc'] },
        { name: 'Desert Dunes', grass: ['#f3d394', '#ebc57f'], dgrass: ['#5a4b33', '#52442e'], tree: 'cactus', water: ['#3fc1c9', '#2fb0b8'], dwater: ['#17545a', '#12474c'], fl: ['#ff7043', '#ffd54f', '#a1887f'] }
    ];
    const CHARS = [
        ['chicken', '🐔', 'Chicken', 0], ['duck', '🦆', 'Duck', 25], ['penguin', '🐧', 'Penguin', 60], ['frog', '🐸', 'Frog', 100], ['robot', '🤖', 'Robot', 150], ['unicorn', '🦄', 'Unicorn', 250]
    ];
    const BADGES = [
        ['r25', '🐣', 'Off we go', 'Reach row 25'],
        ['r50', '🍂', 'Into the woods', 'Reach the Autumn Woods (row 40)'],
        ['r100', '❄️', 'Cold feet', 'Reach the Snowy Pass (row 80)'],
        ['r150', '🌵', 'Desert crossing', 'Reach the Desert Dunes (row 120)'],
        ['r200', '🏁', 'Marathon hopper', 'Reach row 200'],
        ['coins10', '🪙', 'Pocket money', 'Grab 10 coins in one run'],
        ['bank', '🐷', 'Piggy bank', 'Save up 200 coins in total'],
        ['buy', '🛍️', 'New look', 'Unlock a new character'],
        ['all', '🦄', 'Full roster', 'Unlock every character'],
        ['logs', '🪵', 'Log roller', 'Ride 15 logs in one run'],
        ['rails', '🚂', 'Train dodger', 'Cross 8 railway tracks in one run'],
        ['shield', '🛡️', 'Saved by the bubble', 'Survive a hit with a shield'],
        ['slow', '⏳', 'Time bender', 'Use 3 slow-mo clocks in one run']
    ];
    let skin = 'chicken', slowT = 0, invT = 0, shieldOn = false, logsRidden = 0, railsCrossed = 0, slows = 0, biomeShown = 0, sign = null, clouds = [];
    const biomeOf = (r) => BIOMES[Math.floor(Math.max(0, r) / 40) % BIOMES.length];
    let lanes, safe, segType, segLeft, ch, camY, maxRow, coins, deathT, death, started, creepT, bump, dust, popups, queue, eagle;
    const A = Arcade({
        width: W, height: H, size, reset, update, draw, key, tap, swipe, idle, swipeDist: 24, badges: BADGES, touchTip: 'Tip: hop with the arrow keys. With Touchpad mode on (top bar), click to hop and glide to swipe.',
        menuStats: () => [[' games', Curio.fmt(A.profile.games || 0)], [' rows hopped', Curio.fmt(A.stat('rows'))], [' best row', A.stat('best') || '-']],
        menu: () => paintShop()
    });
    const owned = () => { const o = Curio.store.get('road:chars', ['chicken']); return Array.isArray(o) ? o : ['chicken']; };
    const bank = () => Number(Curio.store.get('road:coins', 0)) || 0;
    skin = Curio.store.get('road:skin', 'chicken');
    if (!owned().includes(skin)) skin = 'chicken';
    function paintShop() {
        const box = document.getElementById('shop');
        if (!box) return;
        box.innerHTML = '';
        const own = owned();
        document.getElementById('bank').textContent = Curio.fmt(bank());
        for (const [id, em, name, price] of CHARS) {
            const b = document.createElement('button');
            b.type = 'button';
            const has = own.includes(id);
            b.className = 'rc-char' + (id === skin ? ' on' : '') + (has ? '' : ' locked');
            b.setAttribute('aria-pressed', String(id === skin));
            b.innerHTML = '<span class="em"></span><small></small>';
            b.firstChild.textContent = em;
            b.lastChild.textContent = has ? name : `🪙 ${price}`;
            b.title = has ? `Play as ${name}` : `Unlock ${name} for ${price} coins`;
            b.addEventListener('click', () => {
                if (has) { skin = id; Curio.store.set('road:skin', id); Curio.beep(700, 0.05, 'triangle', 0.07); paintShop(); return; }
                if (bank() < price) { Curio.toast(`Need ${price - bank()} more coins for the ${name}`); Curio.beep(160, 0.1, 'sawtooth', 0.05); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); return; }
                Curio.store.set('road:coins', bank() - price);
                Curio.store.set('road:chars', [...own, id]);
                skin = id; Curio.store.set('road:skin', id);
                Curio.toast(`${em} ${name} unlocked!`);
                Curio.confetti(60);
                [660, 880, 1100, 1320].forEach((f, i) => setTimeout(() => Curio.beep(f, 0.08, 'triangle', 0.09), i * 70));
                A.unlock('buy');
                if (owned().length >= CHARS.length) A.unlock('all');
                paintShop();
            });
            box.append(b);
        }
    }
    function size(aw, ah) {
        H = Math.round(Math.max(560, Math.min(980, W * ah / aw)));
        return { w: W, h: H };
    }
    const rnd = (a, b) => a + Math.random() * (b - a);
    function reset() {
        lanes = new Map();
        safe = 4;
        segType = 'grass';
        segLeft = 0;
        ch = { x: 4, row: 0, fx: 4, frow: 0, hopT: 0, face: 1, onLog: null, squash: 0, gone: false };
        camY = -3;
        maxRow = 0;
        coins = 0;
        deathT = 0;
        death = null;
        started = false;
        creepT = 0;
        bump = 0;
        dust = [];
        popups = [];
        queue = [];
        eagle = null;
        slowT = 0; invT = 0; shieldOn = false; logsRidden = 0; railsCrossed = 0; slows = 0; biomeShown = 0; sign = null;
        clouds = Array.from({ length: 4 }, (_, i) => ({ x: Math.random() * W, y: i * 260 + Math.random() * 100, s: 0.7 + Math.random() * 0.6 }));
        A.fx.clear();
        for (let r = -6; r < 30; r++)
            lane(r);
        A.hud('coins', 0);
    }
    function lane(r) {
        let L = lanes.get(r);
        if (!L) {
            L = gen(r);
            lanes.set(r, L);
        }
        return L;
    }
    function fillMovers(len, gapMin, gapMax, minCount) {
        const items = [];
        let x = rnd(LO, LO + 3), guard = 0;
        while (guard++ < 20) {
            const l = len();
            if (x + l + gapMin > LO + LOOP && items.length >= minCount)
                break;
            items.push({ x, len: l, color: Curio.pick(CAR_COLORS), kind: l >= 2 ? 'truck' : 'car' });
            x += l + rnd(gapMin, gapMax);
        }
        return items;
    }
    function moveItems(L, dt) {
        for (const it of L.items) {
            it.x += L.dir * L.speed * dt;
            if (it.x >= LO + LOOP)
                it.x -= LOOP;
            if (it.x < LO)
                it.x += LOOP;
        }
    }
    function gen(r) {
        const d = Math.min(1, Math.max(0, r) / 160);
        if (r < 4)
            return { type: 'grass', trees: new Set(r < 0 ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : []), coins: new Set(), shade: r & 1 };
        if (segLeft <= 0) {
            if (segType !== 'grass' && Math.random() < 0.75) {
                segType = 'grass';
                segLeft = Math.random() < 0.6 ? 1 : 2;
            }
            else {
                const roll = Math.random();
                if (r > 14 && roll < 0.12) {
                    segType = 'rail';
                    segLeft = 1;
                }
                else if (r > 6 && roll < 0.38) {
                    segType = 'river';
                    segLeft = 1 + Math.floor(Math.random() * (2 + d * 2));
                }
                else if (roll < 0.82) {
                    segType = 'road';
                    segLeft = 1 + Math.floor(Math.random() * (2 + d * 3));
                }
                else {
                    segType = 'grass';
                    segLeft = 1 + Math.floor(Math.random() * 2);
                }
            }
        }
        segLeft--;
        const prevSafe = safe;
        safe = Math.max(1, Math.min(COLS - 2, safe + Math.floor(Math.random() * 3) - 1));
        const prev = lanes.get(r - 1);
        const dir = prev && prev.type === segType && prev.dir ? -prev.dir : Math.random() < 0.5 ? -1 : 1;
        if (segType === 'grass') {
            const trees = new Set(), c = new Set();
            const lo = Math.min(prevSafe, safe), hi = Math.max(prevSafe, safe);
            const n = Math.floor(Math.random() * 4);
            for (let i = 0; i < n; i++) {
                const t = Math.floor(Math.random() * COLS);
                if (t < lo || t > hi)
                    trees.add(t);
            }
            const free = [...Array(COLS).keys()].filter((k) => !trees.has(k));
            if (Math.random() < 0.22) c.add(Curio.pick(free));
            let pu = null;
            if (r > 8 && Math.random() < 0.06) {
                const f2 = free.filter((k) => !c.has(k));
                if (f2.length) pu = { x: Curio.pick(f2), kind: Math.random() < 0.5 ? 'shield' : 'slow' };
            }
            const fl = [];
            for (let k = 0; k < 3; k++) fl.push([Math.random() * W, 8 + Math.random() * (TS - 16), (Math.random() * 3) | 0]);
            return { type: 'grass', trees, coins: c, shade: r & 1, pu, fl };
        }
        if (segType === 'road') {
            const speed = rnd(1.3, 2.4) + d * 2.4;
            const truck = Math.random() < 0.35;
            const items = fillMovers(() => (truck && Math.random() < 0.7 ? 2 : 1), Math.max(1.8, 4.4 - d * 2.2), Math.max(3.2, 7 - d * 3), 2);
            const last = prev && prev.type === 'road';
            return { type: 'road', dir, speed, items, edge: !last };
        }
        if (segType === 'river') {
            if (Math.random() < 0.22 && !(prev && prev.type === 'river' && prev.pads)) {
                const pads = new Set([safe]);
                for (let k = 0; k < COLS; k++)
                    if (Math.random() < 0.35)
                        pads.add(k);
                return { type: 'river', pads, dir: 0, speed: 0, items: [] };
            }
            const speed = rnd(0.9, 1.7) + d * 1.4;
            const items = fillMovers(() => 2 + Math.floor(Math.random() * (3 - d * 1.2)), 1.2, Math.max(1.6, 3.2 - d), 3);
            return { type: 'river', dir, speed, items };
        }
        return { type: 'rail', dir, speed: 24, train: null, warnT: 0, waitT: rnd(2, 6) };
    }
    function hopTo(dx, dy) {
        if (A.state !== 'play' || death)
            return;
        if (ch.hopT > 0) {
            if (queue.length < 1)
                queue.push([dx, dy]);
            return;
        }
        const tr = ch.row + dy;
        const T = lane(tr);
        let tx = T.type === 'river' && !T.pads ? ch.x + dx : Math.round(ch.x + dx);
        if (T.type === 'river' && T.pads)
            tx = Math.round(ch.x + dx);
        if (dx !== 0)
            ch.face = dx;
        if (tx < -0.45 || tx > COLS - 0.55 || (T.type === 'grass' && T.trees.has(Math.round(tx)))) {
            bump = 0.15;
            A.beep(140, 0.05, 'square', 0.04);
            return;
        }
        if (tr < camY - 0.2) {
            bump = 0.15;
            return;
        }
        ch.fx = ch.x;
        ch.frow = ch.row;
        ch.x = tx;
        ch.row = tr;
        ch.hopT = HOP;
        ch.onLog = null;
        started = true;
        A.beep(dy > 0 ? 700 : 560, 0.04, 'triangle', 0.06);
    }
    const KEYS = { ArrowUp: [0, 1], w: [0, 1], ArrowDown: [0, -1], s: [0, -1], ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ' ': [0, 1] };
    function key(k, down) { if (down && KEYS[k]) hopTo(...KEYS[k]); }
    function tap() { hopTo(0, 1); }
    function swipe(dir) { hopTo(...({ up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] })[dir]); }
    function die(kind) {
        if (death)
            return;
        if (invT > 0 && (kind === 'car' || kind === 'train')) return;
        if (shieldOn && (kind === 'car' || kind === 'train')) {
            shieldOn = false;
            invT = 1.2;
            const sx = chXNow() * TS + TS / 2, sy = rowY(ch.row) + TS / 2;
            A.fx.ring(sx, sy, '#80deea', 50, 0.5, 4);
            A.fx.burst(sx, sy, 20, ['#80deea', '#ffffff'], { speed: 200, life: 0.5, size: 4, gravity: 0, round: true });
            A.sweep(900, 200, 0.3, 'triangle', 0.08);
            A.shake(6);
            A.unlock('shield');
            return;
        }
        A.shake(kind === 'eagle' ? 4 : 10);
        A.buzz(kind === 'water' ? 60 : [40, 30, 90]);
        death = kind;
        deathT = kind === 'eagle' ? 1.6 : 1.1;
        const sx = ch.x * TS + TS / 2, sy = rowY(ch.row) + TS / 2;
        if (kind === 'car' || kind === 'train') {
            ch.squash = 1;
            A.noise(0.35, 0.25, 2000);
            A.beep(110, 0.25, 'sawtooth', 0.08);
            A.fx.burst(sx, sy, 22, ['#ffffff', '#f5f5f5', '#ffcc80'], { speed: 200, life: 0.8, size: 5, gravity: 200 });
        }
        else if (kind === 'water') {
            ch.gone = true;
            A.noise(0.5, 0.2, 900);
            A.sweep(500, 120, 0.4, 'sine', 0.08);
            A.fx.burst(sx, sy, 26, ['#ffffff', '#b3e5fc', '#4fc3f7'], { speed: 180, life: 0.7, size: 5, gravity: 420, angle: -Math.PI / 2, spread: 2.4 });
        }
        else if (kind === 'eagle') {
            eagle = { y: -80, t: 0 };
            A.sweep(1400, 700, 0.6, 'sawtooth', 0.05);
        }
        else {
            ch.gone = true;
            A.sweep(500, 120, 0.4, 'sine', 0.08);
        }
    }
    function finish() {
        const total = (Curio.store.get('road:coins', 0) || 0) + coins;
        Curio.store.set('road:coins', total);
        if (total >= 200) A.unlock('bank');
        A.statMax('best', maxRow);
        const nextChar = CHARS.find((c) => !owned().includes(c[0]));
        const bz = biomeOf(maxRow).name;
        const msgs = {
            car: ['Flattened. The chicken is now a pancake.', 'Should have looked both ways. Twice.', 'The driver did not even slow down.'],
            train: ['The train had places to be.', 'That was the 4:15 express.'],
            water: ['Chickens, it turns out, cannot swim.', 'Splash! Logs only, please.'],
            swept: ['Swept off the edge on a log. Wheee. Then not wheee.'],
            eagle: ['Too slow. The eagle got lunch.', 'Dawdling is dangerous around here.']
        };
        const em = CHARS.find((c) => c[0] === skin)[1];
        A.over({
            title: maxRow >= 50 ? 'What a journey!' : 'Squawk!', emoji: death === 'water' || death === 'swept' ? '💦' : death === 'eagle' ? '🦅' : em,
            msg: `${Curio.pick(msgs[death] || msgs.car)} ${Curio.fmt(total)} coins in the piggy bank.${nextChar ? ` ${nextChar[1]} ${nextChar[2]} costs ${nextChar[3]}.` : ''}`,
            lines: [[' rows', maxRow], [' coins', coins], [' logs ridden', logsRidden], [' biome', bz]],
            share: `${em} Curio Road Crosser: ${maxRow} rows\n🗺️ Reached ${bz} · 🪙 ${coins} coins · 🪵 ${logsRidden} logs · 🚂 ${railsCrossed} tracks`
        });
    }
    function rowY(r) { return H - (r - camY + 1) * TS; }
    function chRowNow() { return ch.hopT > HOP / 2 ? ch.frow : ch.row; }
    function chXNow() { const p = 1 - ch.hopT / HOP; return ch.fx + (ch.x - ch.fx) * Math.min(1, p); }
    function update(dt) {
        A.fx.update(dt);
        bump = Math.max(0, bump - dt);
        slowT = Math.max(0, slowT - dt);
        invT = Math.max(0, invT - dt);
        for (const c of clouds) { c.x += 10 * dt; if (c.x > W + 120) c.x = -120; }
        if (sign) { sign.t += dt; if (sign.t > 2.4) sign = null; }
        for (let i = popups.length - 1; i >= 0; i--) {
            popups[i].t += dt;
            if (popups[i].t > 0.9)
                popups.splice(i, 1);
        }
        const top = Math.ceil(camY + H / TS) + 3;
        for (let r = Math.floor(camY) - 2; r <= top; r++)
            lane(r);
        for (const [r, L] of lanes) {
            if (r < camY - 6) {
                lanes.delete(r);
                continue;
            }
            if (r > top)
                continue;
            if (L.items && L.speed)
                moveItems(L, dt * (slowT > 0 ? 0.45 : 1));
            if (L.type === 'rail') {
                if (!L.train) {
                    L.waitT -= dt;
                    if (L.waitT <= 1.3 && !L.warnT) {
                        L.warnT = 1.3;
                        if (Math.abs(r - ch.row) < 8 && !death)
                            A.beep(880, 0.08, 'square', 0.04);
                    }
                    if (L.warnT) {
                        const before = L.warnT;
                        L.warnT = Math.max(0.0001, L.warnT - dt);
                        if (Math.floor(before * 4) !== Math.floor(L.warnT * 4) && Math.abs(r - ch.row) < 8 && !death)
                            A.beep(880, 0.06, 'square', 0.035);
                    }
                    if (L.waitT <= 0) {
                        L.train = { x: L.dir > 0 ? -14 : COLS + 1, len: 13 };
                        L.warnT = 0;
                        if (Math.abs(r - ch.row) < 8 && !death)
                            A.noise(1, 0.12, 600);
                    }
                }
                else {
                    L.train.x += L.dir * L.speed * dt * (slowT > 0 ? 0.45 : 1);
                    if (L.train.x > COLS + 2 || L.train.x + L.train.len < -2) {
                        L.train = null;
                        L.waitT = rnd(3, 7);
                    }
                }
            }
        }
        if (death) {
            deathT -= dt;
            if (eagle) {
                eagle.t += dt;
                eagle.y += 900 * dt;
                if (eagle.y > rowY(ch.row))
                    ch.gone = true;
            }
            if (deathT <= 0) {
                deathT = 0;
                finish();
            }
            return;
        }
        if (ch.hopT > 0) {
            ch.hopT -= dt;
            if (ch.hopT <= 0) {
                ch.hopT = 0;
                land();
                if (death)
                    return;
                if (queue.length)
                    hopTo(...queue.shift());
            }
        }
        const L = lane(chRowNow());
        if (ch.hopT === 0 && L.type === 'river' && !L.pads) {
            const log = ch.onLog;
            if (log) {
                ch.x += L.dir * L.speed * dt * (slowT > 0 ? 0.45 : 1);
                ch.fx = ch.x;
                if (ch.x < -0.45 || ch.x > COLS - 0.55) {
                    die('swept');
                    return;
                }
            }
        }
        if (L.type === 'road') {
            const cx = chXNow() + 0.5;
            for (const it of L.items)
                if (cx + 0.3 > it.x + 0.08 && cx - 0.3 < it.x + it.len - 0.08) {
                    die('car');
                    return;
                }
        }
        if (L.type === 'rail' && L.train) {
            const cx = chXNow() + 0.5;
            if (cx + 0.3 > L.train.x && cx - 0.3 < L.train.x + L.train.len) {
                die('train');
                return;
            }
        }
        const target = ch.row - 3.2;
        if (target > camY)
            camY += (target - camY) * Math.min(1, dt * 5);
        if (started) {
            const d = Math.min(1, maxRow / 160);
            camY += (0.22 + d * 0.3) * dt;
        }
        if (ch.row < camY - 0.35 && ch.hopT === 0)
            die('eagle');
    }
    function land() {
        const L = lane(ch.row);
        if (L.type === 'river') {
            if (L.pads) {
                if (!L.pads.has(Math.round(ch.x))) {
                    die('water');
                    return;
                }
                A.beep(380, 0.05, 'sine', 0.06);
            }
            else {
                const cx = ch.x + 0.5;
                const log = L.items.find((it) => cx > it.x - 0.15 && cx < it.x + it.len + 0.15);
                if (!log) {
                    die('water');
                    return;
                }
                ch.onLog = log;
                logsRidden++;
                if (logsRidden >= 15) A.unlock('logs');
                const c = Math.max(log.x + 0.5, Math.min(log.x + log.len - 0.5, cx));
                ch.x = c - 0.5;
                ch.fx = ch.x;
                A.beep(300, 0.05, 'triangle', 0.06);
            }
        }
        else {
            ch.x = Math.round(ch.x);
            ch.fx = ch.x;
            dust.push({ x: ch.x, row: ch.row, t: 0 });
        }
        if (L.type === 'rail') { railsCrossed++; if (railsCrossed >= 8) A.unlock('rails'); }
        if (L.type === 'grass' && L.pu && L.pu.x === ch.x) {
            const k = L.pu.kind;
            L.pu = null;
            const sx = ch.x * TS + TS / 2, sy = rowY(ch.row) + TS / 2;
            if (k === 'shield') { shieldOn = true; A.fx.text(sx, sy - 20, '🛡️ Shield!', '#80deea', 16, 1); }
            else { slowT = 5; slows++; if (slows >= 3) A.unlock('slow'); A.fx.text(sx, sy - 20, '⏳ Slow-mo!', '#ce93d8', 16, 1); A.sweep(800, 200, 0.5, 'sine', 0.07); }
            A.fx.ring(sx, sy, k === 'shield' ? '#80deea' : '#ce93d8', 44, 0.45, 3);
            [700, 1050, 1400].forEach((f, i) => setTimeout(() => A.beep(f, 0.07, 'triangle', 0.08), i * 60));
            A.buzz(20);
        }
        if (L.type === 'grass' && L.coins.has(ch.x)) {
            L.coins.delete(ch.x);
            coins++;
            if (coins >= 10) A.unlock('coins10');
            A.hud('coins', coins);
            popups.push({ x: ch.x, row: ch.row, text: '+1', t: 0 });
            A.fx.burst(ch.x * TS + TS / 2, rowY(ch.row) + TS / 2, 10, ['#ffeb3b', '#f9a825', '#ffffff'], { speed: 120, life: 0.45, size: 3, gravity: 200, round: true });
            A.beep(1320, 0.06, 'square', 0.06);
            setTimeout(() => A.beep(1760, 0.08, 'square', 0.06), 60);
        }
        if (ch.row > maxRow) {
            A.stat('rows', ch.row - maxRow);
            maxRow = ch.row;
            A.setScore(maxRow);
            const bi = Math.floor(maxRow / 40);
            if (bi > biomeShown) {
                biomeShown = bi;
                sign = { text: biomeOf(maxRow).name, t: 0 };
                [523, 659, 784].forEach((f, i) => setTimeout(() => A.beep(f, 0.1, 'triangle', 0.08), i * 90));
            }
            if (maxRow >= 25) A.unlock('r25');
            if (maxRow >= 40) A.unlock('r50');
            if (maxRow >= 80) A.unlock('r100');
            if (maxRow >= 120) A.unlock('r150');
            if (maxRow >= 200) A.unlock('r200');
            if (maxRow % 25 === 0) {
                Curio.toast(`${maxRow} rows! Keep clucking.`);
                [660, 880, 1100].forEach((f, i) => setTimeout(() => A.beep(f, 0.08, 'triangle', 0.08), i * 70));
            }
        }
    }
    function idle(dt) {
        A.fx.update(dt);
        if (A.state === 'menu' && lanes) {
            for (const [, L] of lanes)
                if (L.items && L.speed)
                    moveItems(L, dt);
        }
    }
    function drawTree(g, x, y, dark, kind) {
        g.fillStyle = 'rgba(0,0,0,.18)';
        g.beginPath();
        g.ellipse(x + 4, y + 10, 18, 9, 0, 0, 7);
        g.fill();
        if (kind === 'cactus') {
            g.fillStyle = dark ? '#2e6b3a' : '#43a047';
            rrect(g, x - 5, y - 22, 10, 34, 5); g.fill();
            rrect(g, x - 15, y - 12, 8, 14, 4); g.fill();
            rrect(g, x + 7, y - 16, 8, 12, 4); g.fill();
            g.fillRect(x - 11, y - 2, 8, 5); g.fillRect(x + 3, y - 6, 8, 5);
            g.fillStyle = 'rgba(255,255,255,.25)';
            g.fillRect(x - 2, y - 18, 2, 26);
            g.fillStyle = '#ff7043';
            g.beginPath(); g.arc(x, y - 23, 3, 0, 7); g.fill();
            return;
        }
        g.fillStyle = '#795548';
        g.fillRect(x - 4, y, 8, 12);
        if (kind === 'pine') {
            for (let i = 0; i < 3; i++) {
                const w = 18 - i * 4, ty = y - 4 - i * 9;
                g.fillStyle = dark ? '#1b4d2e' : '#2e7d4f';
                g.beginPath(); g.moveTo(x - w, ty + 6); g.lineTo(x, ty - 10); g.lineTo(x + w, ty + 6); g.fill();
                g.fillStyle = '#ffffff';
                g.beginPath(); g.moveTo(x - w * 0.55, ty - 2); g.lineTo(x, ty - 10); g.lineTo(x + w * 0.55, ty - 2); g.quadraticCurveTo(x, ty + 1, x - w * 0.55, ty - 2); g.fill();
            }
            return;
        }
        const c1 = kind === 'autumn' ? (dark ? '#8d3b12' : '#e65100') : (dark ? '#1b5e20' : '#2e7d32');
        const c2 = kind === 'autumn' ? (dark ? '#b5651d' : '#ff9800') : (dark ? '#2e7d32' : '#43a047');
        g.fillStyle = c1;
        g.beginPath();
        g.arc(x, y - 6, 17, 0, 7);
        g.fill();
        g.fillStyle = c2;
        g.beginPath();
        g.arc(x - 4, y - 10, 11, 0, 7);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,.18)';
        g.beginPath();
        g.arc(x - 7, y - 14, 4, 0, 7);
        g.fill();
    }
    function drawCar(g, it, y, dir) {
        const x = it.x * TS, w = it.len * TS, h = TS - 14, cy = y + 7;
        g.fillStyle = 'rgba(0,0,0,.22)';
        rrect(g, x + 4, cy + 6, w - 4, h, 9);
        g.fill();
        g.fillStyle = '#263238';
        for (const wx of it.kind === 'truck' ? [0.18, 0.5, 0.82] : [0.22, 0.78])
            for (const wy of [-2, h - 4]) {
                rrect(g, x + w * wx - 6, cy + wy, 12, 6, 2);
                g.fill();
            }
        if (A.dark) {
            const hx = dir > 0 ? x + w : x;
            const bg = g.createLinearGradient(hx, 0, hx + dir * 70, 0);
            bg.addColorStop(0, 'rgba(255,245,157,.35)');
            bg.addColorStop(1, 'rgba(255,245,157,0)');
            g.fillStyle = bg;
            g.beginPath(); g.moveTo(hx, cy + 4); g.lineTo(hx + dir * 70, cy - 6); g.lineTo(hx + dir * 70, cy + h + 6); g.lineTo(hx, cy + h - 4); g.fill();
        }
        if (it.kind === 'truck') {
            const cabW = TS * 0.62;
            const cabX = dir > 0 ? x + w - cabW - 2 : x + 2;
            const boxX = dir > 0 ? x + 2 : x + cabW + 4;
            const bgr = g.createLinearGradient(0, cy, 0, cy + h);
            bgr.addColorStop(0, '#ffffff'); bgr.addColorStop(1, '#cfd8dc');
            g.fillStyle = bgr;
            rrect(g, boxX, cy, w - cabW - 6, h, 5);
            g.fill();
            g.fillStyle = it.color;
            g.globalAlpha = 0.85;
            g.fillRect(boxX + 8, cy + h / 2 - 4, w - cabW - 22, 8);
            g.globalAlpha = 1;
            g.fillStyle = it.color;
            rrect(g, cabX, cy, cabW, h, 7);
            g.fill();
            g.fillStyle = 'rgba(255,255,255,.25)';
            rrect(g, cabX + 3, cy + 2, cabW - 6, 5, 3); g.fill();
            g.fillStyle = '#b3e5fc';
            g.fillRect(dir > 0 ? cabX + cabW - 12 : cabX + 4, cy + 5, 8, h - 10);
        }
        else {
            const gr = g.createLinearGradient(0, cy, 0, cy + h);
            gr.addColorStop(0, shade(it.color, 0.2)); gr.addColorStop(1, shade(it.color, -0.15));
            g.fillStyle = gr;
            rrect(g, x + 3, cy, w - 6, h, 10);
            g.fill();
            g.fillStyle = shade(it.color, -0.25);
            rrect(g, x + w * 0.3, cy + 5, w * 0.4, h - 10, 6);
            g.fill();
            g.fillStyle = 'rgba(255,255,255,.3)';
            rrect(g, x + w * 0.34, cy + 7, w * 0.32, 4, 2); g.fill();
            g.fillStyle = '#b3e5fc';
            const fx = dir > 0 ? x + w * 0.7 - 1 : x + w * 0.3 - 6;
            g.fillRect(fx, cy + 6, 7, h - 12);
            g.fillStyle = '#fff59d';
            const lx = dir > 0 ? x + w - 7 : x + 4;
            g.fillRect(lx, cy + 4, 3, 6);
            g.fillRect(lx, cy + h - 10, 3, 6);
            g.fillStyle = '#ff5252';
            const bx = dir > 0 ? x + 4 : x + w - 7;
            g.fillRect(bx, cy + 4, 3, 5);
            g.fillRect(bx, cy + h - 9, 3, 5);
        }
    }
    function drawLog(g, it, y) {
        const x = it.x * TS, w = it.len * TS;
        g.fillStyle = 'rgba(0,0,0,.18)';
        rrect(g, x + 4, y + 12, w - 4, TS - 18, 12);
        g.fill();
        g.fillStyle = '#8d5a3b';
        rrect(g, x + 2, y + 8, w - 4, TS - 18, 12);
        g.fill();
        g.fillStyle = '#a66d47';
        g.fillRect(x + 12, y + 12, w - 24, 4);
        g.fillStyle = '#6d4329';
        g.fillRect(x + 18, y + 22, w * 0.35, 3);
        g.fillStyle = '#d7a77a';
        g.beginPath();
        g.ellipse(x + w - 9, y + TS / 2 - 1, 6, (TS - 22) / 2, 0, 0, 7);
        g.fill();
        g.strokeStyle = '#a66d47';
        g.lineWidth = 1.5;
        g.beginPath();
        g.ellipse(x + w - 9, y + TS / 2 - 1, 3, (TS - 22) / 4, 0, 0, 7);
        g.stroke();
    }
    function drawChicken(g) {
        if (ch.gone)
            return;
        const p = ch.hopT > 0 ? 1 - ch.hopT / HOP : 1;
        const xr = ch.fx + (ch.x - ch.fx) * p, rr = ch.frow + (ch.row - ch.frow) * p;
        let x = xr * TS + TS / 2, y = rowY(rr) + TS / 2;
        const lift = Math.sin(p * Math.PI) * 14;
        if (bump)
            x += Math.sin(bump * 80) * 3;
        g.fillStyle = 'rgba(0,0,0,.22)';
        g.beginPath();
        g.ellipse(x + 3, y + 14, 15 - lift * 0.3, 6, 0, 0, 7);
        g.fill();
        g.save();
        g.translate(x, y + 6 - lift);
        if (ch.squash) {
            g.scale(1.7, 0.25);
        }
        else if (ch.hopT > 0)
            g.scale(0.92, 1.1);
        g.scale(ch.face, 1);
        drawSkin(g);
        g.restore();
        if (shieldOn || invT > 0) {
            g.strokeStyle = `rgba(128,222,234,${invT > 0 ? 0.3 + 0.3 * Math.sin(A.time * 30) : 0.55 + 0.25 * Math.sin(A.time * 6)})`;
            g.lineWidth = 2.5;
            g.beginPath(); g.arc(x, y - lift, 24, 0, 7); g.stroke();
            g.fillStyle = 'rgba(128,222,234,.1)'; g.fill();
        }
    }
    function drawSkin(g) {
        const t = A.time;
        if (skin === 'duck') {
            g.fillStyle = '#ff9800'; g.fillRect(-7, 8, 3, 6); g.fillRect(3, 8, 3, 6);
            g.fillStyle = '#ffd54f'; rrect(g, -14, -14, 28, 26, 11); g.fill();
            g.fillStyle = '#ffca28'; g.beginPath(); g.ellipse(-8, 2, 7, 6, 0.3, 0, 7); g.fill();
            g.fillStyle = '#ff8f00'; rrect(g, 10, -8, 12, 6, 3); g.fill();
            g.fillStyle = '#212121'; g.fillRect(5, -10, 3.5, 3.5);
            return;
        }
        if (skin === 'penguin') {
            g.fillStyle = '#ff9800'; g.fillRect(-8, 9, 6, 4); g.fillRect(2, 9, 6, 4);
            g.fillStyle = '#263238'; rrect(g, -14, -18, 28, 30, 12); g.fill();
            g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(3, 0, 9, 12, 0, 0, 7); g.fill();
            g.fillStyle = '#ffffff'; g.beginPath(); g.arc(6, -10, 4, 0, 7); g.fill();
            g.fillStyle = '#212121'; g.beginPath(); g.arc(7, -10, 2, 0, 7); g.fill();
            g.fillStyle = '#ffa000'; g.beginPath(); g.moveTo(12, -8); g.lineTo(19, -6); g.lineTo(12, -4); g.fill();
            g.fillStyle = '#37474f'; g.beginPath(); g.ellipse(-12, 0, 4, 9, 0.2, 0, 7); g.fill();
            return;
        }
        if (skin === 'frog') {
            g.fillStyle = '#2e7d32'; g.beginPath(); g.ellipse(-8, 10, 7, 3, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(8, 10, 7, 3, 0, 0, 7); g.fill();
            g.fillStyle = '#66bb6a'; g.beginPath(); g.ellipse(0, 0, 15, 12, 0, 0, 7); g.fill();
            g.fillStyle = '#a5d6a7'; g.beginPath(); g.ellipse(2, 4, 9, 6, 0, 0, 7); g.fill();
            g.fillStyle = '#66bb6a'; g.beginPath(); g.arc(-5, -11, 6, 0, 7); g.arc(7, -11, 6, 0, 7); g.fill();
            g.fillStyle = '#fff'; g.beginPath(); g.arc(-5, -11, 4, 0, 7); g.arc(7, -11, 4, 0, 7); g.fill();
            g.fillStyle = '#212121'; g.beginPath(); g.arc(-4, -11, 2, 0, 7); g.arc(8, -11, 2, 0, 7); g.fill();
            g.strokeStyle = '#1b5e20'; g.lineWidth = 1.5; g.beginPath(); g.arc(3, -1, 8, 0.3, 1.4); g.stroke();
            return;
        }
        if (skin === 'robot') {
            g.fillStyle = '#546e7a'; g.fillRect(-8, 8, 5, 6); g.fillRect(3, 8, 5, 6);
            g.fillStyle = '#b0bec5'; rrect(g, -14, -14, 28, 24, 5); g.fill();
            g.fillStyle = '#78909c'; g.fillRect(-14, 2, 28, 3);
            g.fillStyle = '#263238'; rrect(g, -6, -9, 18, 8, 3); g.fill();
            g.fillStyle = '#4dd0e1'; g.fillRect(2 + Math.sin(t * 4) * 4, -7, 5, 4);
            g.fillStyle = '#78909c'; g.fillRect(-1, -22, 2, 8);
            g.fillStyle = Math.sin(t * 6) > 0 ? '#ff1744' : '#ffcdd2'; g.beginPath(); g.arc(0, -23, 3, 0, 7); g.fill();
            return;
        }
        if (skin === 'unicorn') {
            g.fillStyle = '#f8bbd0'; g.fillRect(-9, 8, 4, 6); g.fillRect(5, 8, 4, 6);
            g.fillStyle = '#ffffff'; rrect(g, -14, -12, 28, 24, 11); g.fill();
            g.fillStyle = '#fce4ec'; g.beginPath(); g.ellipse(12, -2, 6, 5, 0, 0, 7); g.fill();
            const mane = ['#ef5350', '#ffb74d', '#fff176', '#81c784', '#64b5f6', '#ba68c8'];
            mane.forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(-10 + i * 2.5, -12 + Math.sin(t * 6 + i) * 1.5 + i * 1.5, 4, 0, 7); g.fill(); });
            g.fillStyle = '#ffd54f'; g.beginPath(); g.moveTo(4, -12); g.lineTo(9, -26); g.lineTo(10, -11); g.fill();
            g.fillStyle = '#212121'; g.fillRect(6, -6, 3, 3);
            return;
        }
        g.fillStyle = '#ff9800';
        g.fillRect(-7, 8, 3, 6);
        g.fillRect(3, 8, 3, 6);
        g.fillStyle = '#ffffff';
        rrect(g, -14, -16, 28, 28, 10);
        g.fill();
        g.fillStyle = '#eeeeee';
        rrect(g, -14, 2, 28, 10, 6);
        g.fill();
        g.fillStyle = '#f5f5f5';
        g.beginPath();
        g.ellipse(-12, 0, 5, 8, 0.3, 0, 7);
        g.fill();
        g.fillStyle = '#e53935';
        g.beginPath();
        g.arc(-2, -18, 4, 0, 7);
        g.arc(4, -17, 3.5, 0, 7);
        g.fill();
        g.fillRect(9, -2, 4, 7);
        g.fillStyle = '#ffa000';
        g.beginPath();
        g.moveTo(13, -8);
        g.lineTo(21, -5);
        g.lineTo(13, -2);
        g.fill();
        g.fillStyle = '#212121';
        g.fillRect(6, -10, 3.5, 3.5);
    }
    function draw(g) {
        const dark = A.dark;
        g.fillStyle = dark ? '#2b3d1f' : '#8bc34a';
        g.fillRect(0, 0, W, H);
        const r0 = Math.floor(camY) - 1, r1 = Math.ceil(camY + H / TS) + 1;
        for (let r = r0; r <= r1; r++) {
            const L = lanes.get(r);
            if (!L)
                continue;
            const y = rowY(r);
            const B = biomeOf(r);
            if (L.type === 'grass') {
                g.fillStyle = dark ? B.dgrass[L.shade] : B.grass[L.shade];
                g.fillRect(0, y, W, TS);
                g.fillStyle = dark ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.18)';
                for (let k = 0; k < 4; k++)
                    g.fillRect(((r * 97 + k * 131) % W + W) % W, y + 10 + k * 8, 3, 6);
                if (L.fl) for (const [fx, fy, fc] of L.fl) { g.fillStyle = B.fl[fc]; g.globalAlpha = dark ? 0.5 : 0.9; g.beginPath(); g.arc(fx, y + fy, 2.4, 0, 7); g.fill(); }
                g.globalAlpha = 1;
            }
            else if (L.type === 'road') {
                g.fillStyle = dark ? '#2f3238' : '#4a4f57';
                g.fillRect(0, y, W, TS);
                const above = lanes.get(r + 1);
                if (above && above.type === 'road') {
                    g.fillStyle = 'rgba(255,255,255,.55)';
                    for (let x = 6; x < W; x += 48)
                        g.fillRect(x, y - 2, 26, 4);
                }
                else {
                    g.fillStyle = dark ? '#555' : '#9e9e9e';
                    g.fillRect(0, y, W, 4);
                }
                if (L.edge) {
                    g.fillStyle = dark ? '#555' : '#9e9e9e';
                    g.fillRect(0, y + TS - 4, W, 4);
                }
            }
            else if (L.type === 'river') {
                const wg = g.createLinearGradient(0, y, 0, y + TS);
                const wc = dark ? B.dwater : B.water;
                wg.addColorStop(0, wc[0]); wg.addColorStop(1, wc[1]);
                g.fillStyle = wg;
                g.fillRect(0, y, W, TS);
                g.fillStyle = 'rgba(255,255,255,.35)';
                for (let k = 0; k < 4; k++) { const sx = ((k * 113 + r * 37 + A.time * 15 * (L.dir || 0.4)) % W + W) % W; if (Math.sin(A.time * 3 + k + r) > 0.6) g.fillRect(sx, y + 8 + k * 9, 2, 2); }
                g.strokeStyle = dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.4)';
                g.lineWidth = 2;
                for (let k = 0; k < 3; k++) {
                    const ox = ((A.time * 20 * (L.dir || 0.3) + k * 150 + r * 53) % (W + 60) + W + 60) % (W + 60) - 30;
                    g.beginPath();
                    g.moveTo(ox, y + 14 + k * 10);
                    g.quadraticCurveTo(ox + 8, y + 10 + k * 10, ox + 16, y + 14 + k * 10);
                    g.stroke();
                }
            }
            else {
                g.fillStyle = dark ? '#4e463b' : '#a1887f';
                g.fillRect(0, y, W, TS);
                g.fillStyle = dark ? '#3e342b' : '#6d4c41';
                for (let x = 4; x < W; x += 18)
                    g.fillRect(x, y + 6, 8, TS - 12);
                g.fillStyle = '#b0bec5';
                g.fillRect(0, y + 12, W, 4);
                g.fillRect(0, y + TS - 16, W, 4);
                const on = L.warnT > 0 && Math.floor(L.warnT * 8) % 2 === 0 || !!L.train;
                g.fillStyle = '#37474f';
                g.fillRect(W - 22, y - 10, 6, 18);
                g.fillStyle = on ? '#ff1744' : '#5d4037';
                g.beginPath();
                g.arc(W - 19, y - 12, 6, 0, 7);
                g.fill();
                if (on) {
                    g.fillStyle = 'rgba(255,23,68,.25)';
                    g.beginPath();
                    g.arc(W - 19, y - 12, 14, 0, 7);
                    g.fill();
                }
            }
        }
        for (const d of dust) {
            d.t += 1 / 60;
            g.globalAlpha = Math.max(0, 0.5 - d.t);
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.arc(d.x * TS + TS / 2 - 12 - d.t * 30, rowY(d.row) + TS - 6, 4 + d.t * 6, 0, 7);
            g.arc(d.x * TS + TS / 2 + 12 + d.t * 30, rowY(d.row) + TS - 6, 4 + d.t * 6, 0, 7);
            g.fill();
        }
        g.globalAlpha = 1;
        dust = dust.filter((d) => d.t < 0.5);
        for (let r = r0; r <= r1; r++) {
            const L = lanes.get(r);
            if (!L)
                continue;
            const y = rowY(r);
            if (L.type === 'river') {
                if (L.pads)
                    for (const k of L.pads) {
                        const px = k * TS + TS / 2, py = y + TS / 2;
                        g.fillStyle = '#2e7d32';
                        g.beginPath();
                        g.moveTo(px, py);
                        g.arc(px, py, 18, 0.5, Math.PI * 2 - 0.1);
                        g.fill();
                        g.fillStyle = '#66bb6a';
                        g.beginPath();
                        g.moveTo(px, py);
                        g.arc(px, py, 14, 0.6, Math.PI * 2 - 0.2);
                        g.fill();
                    }
                else
                    for (const it of L.items)
                        drawLog(g, it, y);
            }
        }
        const chr = chRowNow();
        for (let r = r1; r >= r0; r--) {
            const L = lanes.get(r);
            if (!L)
                continue;
            const y = rowY(r);
            if (L.type === 'grass') {
                if (L.pu) {
                    const px = L.pu.x * TS + TS / 2, py = y + TS / 2 + Math.sin(A.time * 4) * 3, col = L.pu.kind === 'shield' ? '#80deea' : '#ce93d8';
                    g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(px, y + TS - 8, 10, 4, 0, 0, 7); g.fill();
                    g.shadowColor = col; g.shadowBlur = 12;
                    g.fillStyle = col; g.beginPath(); g.arc(px, py, 12, 0, 7); g.fill();
                    g.shadowBlur = 0;
                    g.fillStyle = '#fff'; g.beginPath(); g.arc(px, py, 9, 0, 7); g.fill();
                    g.font = `900 13px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
                    g.fillText(L.pu.kind === 'shield' ? '🛡️' : '⏳', px, py + 1);
                    g.textBaseline = 'alphabetic';
                }
                for (const c of L.coins) {
                    const cx = c * TS + TS / 2, cy = y + TS / 2 + Math.sin(A.time * 4 + c) * 3;
                    g.fillStyle = '#f9a825';
                    g.beginPath();
                    g.ellipse(cx, cy, 10 * Math.abs(Math.cos(A.time * 3 + c)) + 2, 10, 0, 0, 7);
                    g.fill();
                    g.fillStyle = '#ffeb3b';
                    g.beginPath();
                    g.ellipse(cx, cy, 7 * Math.abs(Math.cos(A.time * 3 + c)) + 1, 7, 0, 0, 7);
                    g.fill();
                }
                for (const t of L.trees)
                    drawTree(g, t * TS + TS / 2, y + TS / 2, dark, biomeOf(r).tree);
            }
            else if (L.type === 'road')
                for (const it of L.items)
                    drawCar(g, it, y, L.dir);
            else if (L.type === 'rail' && L.train) {
                const tx = L.train.x * TS, tw = L.train.len * TS;
                g.fillStyle = 'rgba(0,0,0,.25)';
                g.fillRect(tx + 4, y + 10, tw, TS - 10);
                for (let k = 0; k < L.train.len; k += 3.25) {
                    const cx = tx + k * TS, cw = Math.min(3, L.train.len - k) * TS - 6;
                    g.fillStyle = k === 0 && L.dir < 0 || k + 3.25 >= L.train.len && L.dir > 0 ? '#d32f2f' : '#1976d2';
                    rrect(g, cx, y + 5, cw, TS - 12, 8);
                    g.fill();
                    g.fillStyle = '#e3f2fd';
                    for (let wx = cx + 12; wx < cx + cw - 16; wx += 26)
                        g.fillRect(wx, y + 12, 14, 10);
                    g.fillStyle = 'rgba(0,0,0,.15)';
                    g.fillRect(cx, y + TS - 15, cw, 4);
                }
            }
            if (r === chr)
                drawChicken(g);
        }
        if (!lanes.has(chr))
            drawChicken(g);
        for (const c of clouds) {
            g.fillStyle = dark ? 'rgba(0,0,0,.12)' : 'rgba(30,40,60,.07)';
            g.beginPath();
            g.ellipse(c.x, (c.y - camY * 14 % 1100 + 1100) % 1100 - 80, 70 * c.s, 26 * c.s, 0, 0, 7);
            g.fill();
            g.beginPath();
            g.ellipse(c.x + 40 * c.s, (c.y - camY * 14 % 1100 + 1100) % 1100 - 95, 46 * c.s, 22 * c.s, 0, 0, 7);
            g.fill();
        }
        if (slowT > 0) {
            g.fillStyle = `rgba(171,71,188,${Math.min(0.12, slowT * 0.05)})`;
            g.fillRect(0, 0, W, H);
        }
        A.fx.draw(g);
        g.font = `900 16px ${FONT}`;
        g.textAlign = 'center';
        for (const p of popups) {
            g.globalAlpha = 1 - p.t / 0.9;
            g.fillStyle = '#ffeb3b';
            g.strokeStyle = '#5d4037';
            g.lineWidth = 3;
            g.strokeText(p.text, p.x * TS + TS / 2, rowY(p.row) - p.t * 30);
            g.fillText(p.text, p.x * TS + TS / 2, rowY(p.row) - p.t * 30);
        }
        g.globalAlpha = 1;
        if (eagle) {
            const ex = ch.x * TS + TS / 2, ey = eagle.y;
            g.fillStyle = '#4e342e';
            g.beginPath();
            g.moveTo(ex - 60, ey - 10);
            g.quadraticCurveTo(ex - 20, ey - 30 + Math.sin(eagle.t * 20) * 10, ex, ey);
            g.quadraticCurveTo(ex + 20, ey - 30 + Math.sin(eagle.t * 20) * 10, ex + 60, ey - 10);
            g.quadraticCurveTo(ex + 20, ey + 5, ex, ey + 20);
            g.quadraticCurveTo(ex - 20, ey + 5, ex - 60, ey - 10);
            g.fill();
            g.fillStyle = '#ffffff';
            g.beginPath();
            g.arc(ex, ey + 18, 8, 0, 7);
            g.fill();
            g.fillStyle = '#ffb300';
            g.beginPath();
            g.moveTo(ex - 4, ey + 24);
            g.lineTo(ex + 4, ey + 24);
            g.lineTo(ex, ey + 32);
            g.fill();
        }
        if (A.state === 'play' && !started) {
            g.font = `900 20px ${FONT}`;
            g.fillStyle = '#ffffff';
            g.strokeStyle = 'rgba(0,0,0,.35)';
            g.lineWidth = 5;
            const ty = rowY(ch.row) - 40 + Math.sin(A.time * 4) * 4;
            g.strokeText('tap or press ↑ to hop', W / 2, ty);
            g.fillText('tap or press ↑ to hop', W / 2, ty);
        }
        if (A.state === 'play' && maxRow > 0) {
            g.font = `900 40px ${FONT}`;
            g.fillStyle = 'rgba(255,255,255,.85)';
            g.strokeStyle = 'rgba(0,0,0,.25)';
            g.lineWidth = 6;
            g.strokeText(String(maxRow), W / 2, 50);
            g.fillText(String(maxRow), W / 2, 50);
        }
        if (A.state === 'play' && slowT > 0) {
            g.font = `800 13px ${FONT}`;
            g.textAlign = 'left';
            g.fillStyle = '#fff';
            g.fillText(`⏳ ${Math.ceil(slowT)}s`, 10, 24);
            g.textAlign = 'center';
        }
        if (sign && A.state === 'play') {
            const a = Math.min(1, sign.t * 4, (2.4 - sign.t) * 3);
            g.globalAlpha = Math.max(0, a);
            const sy = 110 - Math.max(0, 0.25 - sign.t) * 120;
            g.fillStyle = '#6d4c41';
            g.fillRect(W / 2 - 4, sy, 8, 40);
            g.fillStyle = '#8d6e63';
            rrect(g, W / 2 - 110, sy - 26, 220, 40, 10); g.fill();
            g.strokeStyle = '#5d4037'; g.lineWidth = 3; g.stroke();
            g.font = `900 20px ${FONT}`;
            g.fillStyle = '#fff8e1';
            g.fillText(sign.text, W / 2, sy + 1);
            g.globalAlpha = 1;
        }
    }
    A.debug = () => ({
        row: ch.row, x: ch.x, maxRow, coins, camY, death, hopT: ch.hopT,
        lanes: [...lanes.entries()].filter(([r]) => r >= ch.row - 1 && r <= ch.row + 6).map(([r, L]) => [r, L.type]),
        safeHop() { const L = lane(ch.row + 1); if (L.type === 'road') L.items = []; if (L.type === 'river') { L.pads = new Set([Math.round(ch.x)]); } if (L.type === 'rail') L.waitT = 99; if (L.type === 'grass') L.trees.delete(Math.round(ch.x)); hopTo(0, 1); },
        jump(n) { ch.row = ch.frow = n; maxRow = n - 1; camY = n - 3.2; for (let r = n - 6; r < n + 30; r++) lane(r); lanes.set(n, { type: 'grass', trees: new Set(), coins: new Set(), shade: 0, fl: [] }); land(); },
        give(k) { if (k === 'shield') shieldOn = true; else slowT = 5; },
        carAt() { const L = lane(ch.row + 1); lanes.set(ch.row + 1, { type: 'road', dir: 1, speed: 0, items: [{ x: Math.round(ch.x) - 0.2, len: 1.4, color: '#ef5350', kind: 'car' }], edge: true }); hopTo(0, 1); }
    });
    reset();
    A.boot();
})();
