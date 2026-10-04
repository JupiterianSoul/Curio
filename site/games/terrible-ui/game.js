(() => {
  const SIMPLE = Curio.simple;
  const $ = (s) => document.querySelector(s);
  const card = $('#card');
  const h = (tag, attrs = {}, ...kids) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    kids.flat().forEach((c) => c != null && e.append(c));
    return e;
  };
  const shake = (el) => { el.classList.remove('tf-shake'); void el.offsetWidth; el.classList.add('tf-shake'); };
  const ANS = {};
  let idx = 0, t0 = 0, timerId = 0, cleanup = null;

  const STEPS = [
    { key: 'Name', title: 'What is your name?', desc: 'Our name field is a slot machine. Tap each reel to stop it on a letter. Tap again to spin it again. Leave extra reels on the blank.', build: slotName },
    { key: 'Email', title: 'Email address', desc: 'For security reasons, email addresses must be typed in ALL CAPS. lowercase letters are a known hacker technique.', build: capsEmail },
    { key: 'Password', title: 'Create a password', desc: 'Use our secure keyboard. It reshuffles after every key press so keyloggers get confused. So will you. At least 8 characters with a number.', build: shufflePass },
    { key: 'Phone', title: 'Phone number', desc: 'Please slide to your phone number. We added precision buttons because we care.', build: phoneSlider },
    { key: 'Date of birth', title: 'Date of birth', desc: 'Scroll to your birthday. We start at January 1st, 1900, for fairness.', build: dobScroll },
    { key: 'Age', title: 'Age', desc: 'Now please enter your age so we can check it matches. The plus button adds a random amount, as a treat.', build: ageCounter },
    { key: 'Country', title: 'Country', desc: 'Sorted alphabetically. By the last letter. Then backwards.', build: countryPick },
    { key: 'ZIP code', title: 'ZIP / postal code', desc: 'Press and hold to dial each digit. Let go when it shows the right one. Five digits.', build: zipHold },
    { key: 'Volume', title: 'Notification volume', desc: 'Set your volume by launching a rocket. Drag the launcher to aim, then launch. Distance is volume.', build: rocketVolume },
    { key: 'Favourite colour', title: 'Favourite colour', desc: 'Your favourite colour is the one on the left. Match it. The slider labels may have been shuffled by an intern.', build: colourMatch },
    { key: 'Terms', title: 'Terms and conditions', desc: 'Please agree to the terms. The checkbox is a little shy.', build: dodgeCheckbox },
    { key: 'Rating', title: 'How would you rate this form?', desc: 'Be honest. Your feedback matters to us.', build: rating },
    { key: 'Human', title: 'Prove you are human', desc: 'Select every square with a goose. Not a duck. Not a swan. A goose.', build: gooseCaptcha },
    { key: 'Address', title: 'Home address', desc: 'Drag the pin onto your house. All the houses look the same, so take your time.', build: pinMap },
    { key: 'Height', title: 'Height', desc: 'For accuracy, please enter your height in cats. One cat is 25 cm. Cats may wander off.', build: catHeight },
    { key: 'Security answer', title: 'Security question', desc: 'What was the name of your first pet? For extra security, the letters must be in alphabetical order. Like "Bello" or "Chimp".', build: alphaAnswer },
    { key: 'Newsletters', title: 'Email preferences', desc: 'Please make sure you are NOT subscribed to anything. Read carefully.', build: newsletters },
    { key: 'Call time', title: 'Best time to call you', desc: 'Drag around the clock to set the time. The hour hand runs backwards, for balance.', build: backClock },
    { key: 'Photo', title: 'Profile photo', desc: 'We only accept hand-drawn portraits. Our pen is a little wobbly. Draw yourself in the box.', build: drawPhoto },
    { key: 'Username', title: 'Choose a username', desc: 'Pick something unique. Our system will check if it is available. It will not be.', build: username },
    { key: 'Cookies', title: 'Cookie preferences', desc: 'We value your privacy. That is why we share it with 847 trusted partners. Please reject the cookies to continue. If you can.', build: cookies },
    { key: 'Confirmed', title: 'Submit', desc: 'Almost done. We just need to double-check a couple of things.', build: confirmChain }
  ];
  const ALL_STEPS = STEPS.slice();
  const QUIPS = {
    Name: ['Spin to win. Your name, that is.', 'Fun fact: nobody has ever got their name first try.'],
    Email: ['LOUDER, PLEASE.', 'Our email server is very old.'],
    Password: ['I have already forgotten it for you.', 'Pro tip: hunt and peck.'],
    Phone: ['Only ten billion options.', 'The +1 button is my favourite.'],
    'Date of birth': ['Scroll faster. Or slower. I believe in you.', 'Pack a lunch.'],
    Age: ['Maths is optional here.', 'Plus is a surprise every time!'],
    Country: ['Alphabetical. Technically.', 'Hint: think about the last letter.'],
    'ZIP code': ['Hold your nerve. And the button.', 'Patience is a virtue. Speed is a vice.'],
    Volume: ['Rocket science, but for volume.', 'Aim small, miss small.'],
    'Favourite colour': ['The labels were done by an intern named Greg.', 'Red is not always red.'],
    Terms: ['It is shy. Approach slowly.', 'Nobody reads these. Except you, now.'],
    Rating: ['All feedback is welcome! Five stars especially.', 'Be honest. Then be nice.'],
    Human: ['Beep boop. I mean: hello fellow human.', 'Ducks are not geese. Neither are swans.'],
    Address: ['They really all do look the same.', 'Home is where the pin is.'],
    Height: ['Cats are a standard unit, legally.', 'Keep them stacked. They will not cooperate.'],
    'Security answer': ['A, B, C... easy as that.', 'Almost, begin, chimp, first: all valid.'],
    Newsletters: ['Double negatives are a feature.', 'Read it twice. Then once more.'],
    'Call time': ['Clockwise is so last century.', 'Any time is fine. We will call at 3am anyway.'],
    Photo: ['Picasso started somewhere.', 'Stick figures accepted. Mostly.'],
    Username: ['Every name is taken. Even the ones nobody wants.', 'Have you tried adding numbers? Lots of numbers?'],
    Cookies: ['Reject All is shy. Like the checkbox. They are friends.', 'Our lawyers say this is fine. Our lawyers are cookies.'],
    Confirmed: ['Are you sure you are sure?', 'Almost there. Probably.']
  };
  let mistakes = 0, mode = 'full', photoURL = null;

  function stepShell(s) {
    card.innerHTML = '';
    card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
    const field = h('div', { class: 'tf-field' });
    const msg = h('div', { class: 'tf-msg', role: 'status' });
    const next = h('button', { class: 'tf-btn', type: 'button', text: idx === STEPS.length - 1 ? 'Submit' : 'Next →' });
    next.disabled = true;
    card.append(h('h2', { text: s.title }), h('p', { class: 'tf-desc', text: s.desc }), field, msg);
    if (s.key !== 'Confirmed') card.append(h('div', { class: 'tf-foot' }, next));
    let value = null;
    const api = {
      field, msg,
      valid(ok, v, text) { if (ok && next.disabled) mascot('happy'); next.disabled = !ok; value = v; if (text != null) api.say(text, ok ? 'good' : ''); },
      say(text, cls = '') { msg.textContent = text; msg.className = 'tf-msg ' + cls; },
      bad(text) { api.say(text, 'bad'); shake(field); Curio.beep(160, .1, 'square', .05); mistakes++; mascot('oops'); },
      finish(v) { ANS[s.key] = v; advance(); }
    };
    next.addEventListener('click', () => { if (!next.disabled) api.finish(value); });
    return api;
  }

  function show() {
    if (cleanup) { cleanup(); cleanup = null; }
    const s = STEPS[idx];
    $('#stepLabel').textContent = `Step ${idx + 1} of ${STEPS.length}`;
    $('#bar').style.width = (idx / STEPS.length * 100) + '%';
    const api = stepShell(s);
    cleanup = s.build(api) || null;
    mascot('talk', Curio.pick(QUIPS[s.key] || ['Hmm.']));
    card.querySelector('button, input, select, [tabindex]')?.focus({ preventScroll: true });
  }
  function advance() {
    Curio.beep(660, .06, 'triangle', .08); setTimeout(() => Curio.beep(990, .08, 'triangle', .08), 60);
    idx++;
    if (idx >= STEPS.length) return finish();
    show();
  }

  function slotName(api) {
    const CH = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const N = innerWidth < 420 ? 7 : 8;
    const reels = [];
    const wrap = h('div', { class: 'tf-reels' });
    const preview = h('div', { class: 'tf-big', text: '' });
    for (let i = 0; i < N; i++) {
      const r = { i: Curio.randInt(0, CH.length - 1), spin: true, speed: 70 + Math.random() * 70, acc: 0 };
      r.el = h('button', { class: 'tf-reel spin', type: 'button', 'aria-label': `Reel ${i + 1}` }, h('span'));
      r.el.addEventListener('click', () => {
        r.spin = !r.spin;
        r.el.classList.toggle('spin', r.spin); r.el.classList.toggle('stop', !r.spin);
        Curio.beep(r.spin ? 400 : 900, .04, 'square', .06);
        r.el.setAttribute('aria-label', `Reel ${i + 1}: ${r.spin ? 'spinning' : (CH[r.i] === ' ' ? 'blank' : CH[r.i])}`);
        check();
      });
      reels.push(r); wrap.append(r.el);
    }
    api.field.append(wrap, preview);
    const name = () => reels.map((r) => CH[r.i]).join('').replace(/\s+/g, ' ').trim();
    function check() {
      const n = name();
      preview.textContent = n ? n.split(' ').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ') : ' ';
      const allStopped = reels.every((r) => !r.spin);
      if (!allStopped) return api.valid(false, null, `${reels.filter((r) => r.spin).length} reels still spinning.`);
      if (n.replace(/ /g, '').length < 2) return api.valid(false, null, 'Names must have at least two letters. Even yours.');
      api.valid(true, preview.textContent, `Nice to meet you, ${preview.textContent}. Probably.`);
    }
    let last = performance.now(), raf = 0;
    const loop = (now) => {
      const dt = now - last; last = now;
      if (!document.hidden) reels.forEach((r) => {
        if (!r.spin) return;
        r.acc += dt;
        while (r.acc > r.speed) { r.acc -= r.speed; r.i = (r.i + 1) % CH.length; }
        r.el.firstChild.textContent = CH[r.i] === ' ' ? '␣' : CH[r.i];
      });
      raf = requestAnimationFrame(loop);
    };
    reels.forEach((r) => { r.el.firstChild.textContent = CH[r.i] === ' ' ? '␣' : CH[r.i]; });
    raf = requestAnimationFrame(loop);
    check();
    return () => cancelAnimationFrame(raf);
  }

  function capsEmail(api) {
    const inp = h('input', { class: 'tf-input', type: 'text', inputmode: 'email', autocapitalize: 'characters', autocomplete: 'off', spellcheck: 'false', placeholder: 'YOU@EXAMPLE.COM', 'aria-label': 'Email in capital letters' });
    inp.style.fontSize = '20px'; inp.style.fontFamily = 'var(--mono)';
    api.field.append(inp);
    const RE = /^[A-Z0-9._%+-]+@[A-Z0-9-]+(\.[A-Z0-9-]+)*\.[A-Z]{2,}$/;
    let strikes = 0;
    const lines = ['lowercase detected. SHOUT IT.', 'I SAID CAPS.', 'WHY ARE YOU WHISPERING', 'CAPS LOCK IS RIGHT THERE', 'OUR SERVERS ARE HARD OF HEARING'];
    inp.addEventListener('beforeinput', (e) => {
      if (e.data && /[a-z]/.test(e.data)) { e.preventDefault(); api.bad(lines[Math.min(strikes++, lines.length - 1)]); }
    });
    inp.addEventListener('input', () => {
      if (/[a-z]/.test(inp.value)) { inp.value = inp.value.replace(/[a-z]/g, ''); api.bad(lines[Math.min(strikes++, lines.length - 1)]); }
      const v = inp.value.trim();
      if (!v) return api.valid(false, null, '');
      if (!v.includes('@')) return api.valid(false, null, 'MISSING THE @. IT IS THE SPIRAL ONE.');
      if (!RE.test(v)) return api.valid(false, null, 'THAT DOES NOT LOOK LIKE AN EMAIL YET.');
      api.valid(true, v, 'THANK YOU. WE HEARD YOU THAT TIME.');
    });
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && RE.test(inp.value.trim())) api.finish(inp.value.trim()); });
  }

  function shufflePass(api) {
    let pw = '';
    const disp = h('div', { class: 'tf-big', 'aria-live': 'polite' });
    const kb = h('div', { class: 'tf-kb', role: 'group', 'aria-label': 'Shuffling keyboard' });
    const keys = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
    api.field.append(disp, kb);
    let peek = 0;
    function paint() {
      disp.textContent = pw ? '•'.repeat(Math.max(0, pw.length - (peek ? 1 : 0))) + (peek ? pw.slice(-1) : '') : ' ';
      if (pw.length < 8) api.valid(false, null, `${pw.length}/8 characters.`);
      else if (!/\d/.test(pw)) api.valid(false, null, 'Needs at least one number. Somewhere in that chaos.');
      else api.valid(true, '•'.repeat(pw.length), 'Strong password! We have saved it in plain text.');
    }
    function layout() {
      kb.innerHTML = '';
      Curio.shuffle(keys).forEach((k) => kb.append(h('button', { type: 'button', text: k, onclick: () => { pw += k; peek = 1; clearTimeout(layout.t); layout.t = setTimeout(() => { peek = 0; paint(); }, 700); Curio.beep(500 + Math.random() * 400, .03, 'square', .05); layout(); paint(); kb.querySelector('button')?.focus(); } })));
      kb.append(h('button', { type: 'button', class: 'wide', text: '⌫ delete', onclick: () => { pw = pw.slice(0, -1); paint(); } }));
      kb.append(h('button', { type: 'button', class: 'wide', text: 'clear', onclick: () => { pw = ''; paint(); } }));
    }
    layout(); paint();
    return () => clearTimeout(layout.t);
  }

  function phoneSlider(api) {
    const MAX = 9999999999;
    const out = h('div', { class: 'tf-big' });
    const r = h('input', { class: 'tf-range', type: 'range', min: 0, max: MAX, step: 1, value: Curio.randInt(0, MAX), 'aria-label': 'Phone number slider' });
    const fmtP = (n) => { const s = String(Math.round(n)).padStart(10, '0'); return `(${s.slice(0, 3)}) ${s.slice(3, 6)}-${s.slice(6)}`; };
    const nudge = (d) => { r.value = Math.max(0, Math.min(MAX, +r.value + d)); upd(); };
    const row = h('div', { class: 'tf-row' },
      h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '−1,000,000', onclick: () => nudge(-1e6) }),
      h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '−1', onclick: () => nudge(-1) }),
      h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '+1', onclick: () => nudge(1) }),
      h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '+1,000,000', onclick: () => nudge(1e6) }));
    api.field.append(out, r, row);
    function upd() {
      out.textContent = fmtP(+r.value);
      const first = String(Math.round(+r.value)).padStart(10, '0')[0];
      if (first === '0' || first === '1') api.valid(false, null, 'Area codes cannot start with 0 or 1. Keep sliding.');
      else api.valid(true, fmtP(+r.value), 'Is that your number? It is now.');
    }
    r.addEventListener('input', upd);
    upd();
  }

  function dobScroll(api) {
    const start = Date.UTC(1900, 0, 1);
    const today = new Date();
    const end = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const DAY = 864e5, ROW = 34;
    const total = Math.round((end - start) / DAY) + 1;
    const box = h('div', { class: 'tf-dates', tabindex: '0', role: 'listbox', 'aria-label': 'Every date since 1900' });
    const spacer = h('div'); spacer.style.height = total * ROW + 'px';
    box.append(spacer);
    const info = h('div', { class: 'tf-row c-muted', style: 'font-size:13px;font-weight:700' });
    api.field.append(box, info);
    let sel = -1;
    const pool = [];
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dateOf = (i) => new Date(start + i * DAY);
    const label = (d) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    function render() {
      const top = box.scrollTop, n = Math.ceil(box.clientHeight / ROW) + 2;
      const first = Math.max(0, Math.floor(top / ROW));
      for (let k = 0; k < n; k++) {
        const i = first + k;
        let b = pool[k];
        if (!b) { b = h('button', { type: 'button', role: 'option' }, h('span'), h('small')); b.addEventListener('click', () => pick(+b.dataset.i)); pool[k] = b; box.append(b); }
        if (i >= total) { b.hidden = true; continue; }
        b.hidden = false;
        const d = dateOf(i);
        b.dataset.i = i; b.style.top = i * ROW + 'px';
        b.firstChild.textContent = label(d); b.lastChild.textContent = DOW[d.getUTCDay()];
        b.classList.toggle('sel', i === sel); b.setAttribute('aria-selected', i === sel);
      }
      const y = dateOf(first).getUTCFullYear();
      info.textContent = `You are in ${y}. ${Curio.fmt(first)} days scrolled. ${Curio.fmt(total - first)} to go.`;
    }
    function pick(i) {
      sel = i; render();
      const d = dateOf(i);
      let age = today.getFullYear() - d.getUTCFullYear();
      if (today.getMonth() < d.getUTCMonth() || (today.getMonth() === d.getUTCMonth() && today.getDate() < d.getUTCDate())) age--;
      ANS._age = age;
      Curio.beep(700, .04, 'triangle', .07);
      if (age < 13) return api.valid(false, null, `That makes you ${age}. You must be at least 13. Keep scrolling... backwards.`);
      if (age > 110) return api.valid(true, label(d), `${age} years old? Incredible. Respect.`);
      api.valid(true, label(d), `Born on a ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getUTCDay()]}. Fascinating.`);
    }
    box.addEventListener('scroll', render, { passive: true });
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = Math.max(0, Math.min(total - 1, (sel < 0 ? Math.floor(box.scrollTop / ROW) : sel) + (e.key === 'ArrowDown' ? 1 : -1))); pick(i); if (i * ROW < box.scrollTop || i * ROW > box.scrollTop + box.clientHeight - ROW) box.scrollTop = i * ROW - 100; }
    });
    requestAnimationFrame(render);
    api.valid(false, null, 'Tip: there are only about 46,000 days. You got this.');
  }

  function ageCounter(api) {
    let n = 0;
    const b = h('b', { text: '0', 'aria-live': 'polite' });
    const target = ANS._age ?? 30;
    const upd = () => {
      b.textContent = n;
      if (n === target) api.valid(true, String(n), 'That matches your date of birth. Suspicious, but fine.');
      else if (n > target) api.valid(false, null, `Too old. Your birthday says otherwise.`);
      else api.valid(false, null, '');
    };
    api.field.append(h('div', { class: 'tf-counter' },
      h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', 'aria-label': 'Minus one', text: '−', onclick: () => { n = Math.max(0, n - 1); upd(); Curio.beep(300, .04); } }),
      b,
      h('button', { class: 'tf-btn', type: 'button', 'aria-label': 'Plus a random amount', text: '+', onclick: () => { n += Curio.randInt(1, 7); upd(); Curio.beep(600, .04); } })));
    upd();
  }

  function countryPick(api) {
    const C = ['Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh', 'Belgium', 'Bolivia', 'Brazil', 'Bulgaria', 'Cambodia', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia', 'Cuba', 'Czechia', 'Denmark', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Germany', 'Ghana', 'Greece', 'Guatemala', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kenya', 'Laos', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malaysia', 'Mali', 'Malta', 'Mexico', 'Mongolia', 'Morocco', 'Nepal', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Rwanda', 'Senegal', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland', 'Tanzania', 'Thailand', 'Tunisia', 'Turkey', 'Uganda', 'Ukraine', 'United Kingdom', 'United States', 'Uruguay', 'Vietnam', 'Zambia', 'Zimbabwe'];
    const rev = (s) => s.toLowerCase().split('').reverse().join('');
    const sorted = C.slice().sort((a, b) => rev(a) < rev(b) ? -1 : 1);
    const sel = h('select', { class: 'tf-input tf-select', 'aria-label': 'Country' }, h('option', { value: '', text: 'Select your country (good luck)' }), sorted.map((c) => h('option', { value: c, text: c })));
    api.field.append(sel);
    sel.addEventListener('change', () => {
      if (!sel.value) return api.valid(false, null, '');
      api.valid(true, sel.value, `${sel.value}! Lovely. We have never heard of it.`);
    });
  }

  function zipHold(api) {
    let digits = [], cur = 0, timer = 0, holding = false;
    const disp = h('div', { class: 'tf-big' });
    const btn = h('button', { class: 'tf-btn tf-hold', type: 'button', text: 'Press and hold to dial' });
    const back = h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '⌫ Undo digit', onclick: () => { digits.pop(); paint(); } });
    api.field.append(disp, btn, h('div', { class: 'tf-row' }, back));
    function paint() {
      const cells = [...digits.map(String)];
      if (holding) cells.push(String(cur));
      while (cells.length < 5) cells.push('_');
      disp.textContent = cells.slice(0, 5).join(' ');
      btn.disabled = digits.length >= 5;
      if (digits.length >= 5) api.valid(true, digits.join(''), 'Five digits! A real ZIP code, statistically.');
      else api.valid(false, null, `${digits.length}/5 digits.`);
    }
    const startHold = (e) => {
      e.preventDefault();
      if (holding || digits.length >= 5) return;
      holding = true; cur = 0; btn.classList.add('on'); btn.textContent = 'Let go to lock it in';
      paint(); Curio.beep(400, .04, 'square', .05);
      timer = setInterval(() => { cur = (cur + 1) % 10; paint(); Curio.beep(400 + cur * 60, .03, 'square', .05); }, 420);
    };
    const endHold = () => {
      if (!holding) return;
      holding = false; clearInterval(timer); btn.classList.remove('on'); btn.textContent = 'Press and hold to dial';
      digits.push(cur); Curio.beep(1000, .05, 'triangle', .08); paint();
    };
    const undrag = Curio.drag(btn, { start: (p) => startHold(p.event), end: () => endHold() });
    btn.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) startHold(e); });
    btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') endHold(); });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
    paint();
    return () => { clearInterval(timer); undrag(); };
  }

  function rocketVolume(api) {
    const lo = Curio.randInt(4, 8) * 10, hi = lo + 10;
    const cv = h('canvas', { class: 'tf-rocket', width: 720, height: 440, role: 'img', 'aria-label': 'Rocket launcher. Drag to aim.' });
    const ang = h('input', { class: 'tf-range', type: 'range', min: 1, max: 89, step: 1, value: 20, 'aria-label': 'Launch angle' });
    const launch = h('button', { class: 'tf-btn', type: 'button', text: '🚀 Launch' });
    const lab = h('span', { class: 'tf-muted', style: 'font-weight:800' });
    api.field.append(h('div', {}, 'Target volume: ', h('span', { class: 'tf-target', text: `${lo}% to ${hi}%` })), cv, ang, h('div', { class: 'tf-row' }, lab, launch));
    const ctx = cv.getContext('2d');
    const W = 360, H = 220, GX = 30, GY = 190, RANGE = 300;
    ctx.scale(2, 2);
    let flight = null, landed = null, raf = 0;
    const theme = () => Curio.isDark() ? { sky: '#1b2433', ground: '#2f4f2f', ink: '#f3eee7', line: '#3a352f' } : { sky: '#dff1ff', ground: '#8bc48a', ink: '#1d1b19', line: '#c7d6e2' };
    function draw() {
      const c = theme();
      ctx.fillStyle = c.sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = c.ground; ctx.fillRect(0, GY, W, H - GY);
      for (let v = 0; v <= 100; v += 10) {
        const x = GX + RANGE * v / 100;
        const inT = v >= lo && v < hi;
        if (inT) { ctx.fillStyle = 'rgba(255,90,54,.25)'; ctx.fillRect(x, 0, RANGE / 10, GY); }
        ctx.fillStyle = c.ink; ctx.font = '700 9px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(v + '%', x, GY + 14);
        ctx.fillRect(x - .5, GY, 1, 5);
      }
      const a = +ang.value * Math.PI / 180;
      ctx.save(); ctx.translate(GX, GY); ctx.rotate(-a);
      ctx.fillStyle = '#607d8b'; ctx.fillRect(-4, -6, 34, 12);
      ctx.restore();
      ctx.fillStyle = '#455a64'; ctx.beginPath(); ctx.arc(GX, GY, 9, Math.PI, 0); ctx.fill();
      ctx.setLineDash([3, 4]); ctx.strokeStyle = c.ink; ctx.globalAlpha = .3; ctx.beginPath(); ctx.moveTo(GX, GY); ctx.lineTo(GX + Math.cos(a) * 70, GY - Math.sin(a) * 70); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
      if (flight || landed) {
        const p = flight || landed;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
        ctx.fillStyle = '#eceff1'; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-8, -6); ctx.lineTo(-8, 6); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-13, -10); ctx.lineTo(-10, 0); ctx.lineTo(-13, 10); ctx.lineTo(-8, 6); ctx.fill();
        if (flight) { ctx.fillStyle = '#ffb300'; ctx.beginPath(); ctx.moveTo(-10, -3); ctx.lineTo(-20 - Math.random() * 8, 0); ctx.lineTo(-10, 3); ctx.fill(); }
        ctx.restore();
        if (flight) { ctx.fillStyle = 'rgba(150,150,150,.4)'; flight.trail.forEach(([x, y], i) => { ctx.beginPath(); ctx.arc(x, y, 2 + i % 3, 0, 7); ctx.fill(); }); }
      }
      if (landed) { ctx.fillStyle = c.ink; ctx.font = '900 14px system-ui'; ctx.textAlign = 'center'; ctx.fillText(`🔊 ${landed.vol}%`, Math.min(W - 30, Math.max(30, landed.x)), 30); }
      lab.textContent = `Angle: ${ang.value}°`;
    }
    function fire() {
      if (flight) return;
      landed = null;
      const a = +ang.value * Math.PI / 180;
      const vol = Math.round(Math.sin(2 * a) * 100);
      const dist = RANGE * vol / 100;
      const T = 1.3;
      const t0 = performance.now();
      flight = { x: GX, y: GY, r: -a, trail: [] };
      Curio.beep(180, .3, 'sawtooth', .06);
      const apex = dist / 4 * Math.tan(a);
      const step = (now) => {
        const p = Math.min(1, (now - t0) / (T * 1000));
        const x = GX + dist * p, y = GY - 4 * apex * p * (1 - p);
        const dx = dist, dy = -4 * apex * (1 - 2 * p);
        flight.r = Math.atan2(dy, dx || 1);
        if (Math.random() < .6) flight.trail.push([flight.x, flight.y]);
        if (flight.trail.length > 30) flight.trail.shift();
        flight.x = x; flight.y = y;
        draw();
        if (p < 1) raf = requestAnimationFrame(step);
        else {
          landed = { x, y: GY - 4, r: flight.r, vol }; flight = null; draw();
          Curio.beep(220 + vol * 6, .2, 'triangle', Math.max(.01, vol / 400));
          if (vol >= lo && vol < hi) api.valid(true, vol + '%', `Volume set to ${vol}%. Perfectly reasonable rocket-based UX.`);
          else api.bad(`That is ${vol}%. We need ${lo}% to ${hi}%. Try another angle.`);
        }
      };
      raf = requestAnimationFrame(step);
    }
    launch.addEventListener('click', fire);
    ang.addEventListener('input', draw);
    const aim = (e) => {
      const r = cv.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width * W - GX, y = GY - (e.clientY - r.top) / r.height * H;
      ang.value = Math.max(1, Math.min(89, Math.round(Math.atan2(y, Math.max(1, x)) * 180 / Math.PI)));
      draw();
    };
    const unaim = Curio.drag(cv, { start: aim, move: aim });
    const onTheme = () => draw();
    window.addEventListener('curio:theme', onTheme);
    draw();
    api.valid(false, null, 'Hint: physics.');
    return () => { cancelAnimationFrame(raf); unaim(); window.removeEventListener('curio:theme', onTheme); };
  }

  function colourMatch(api) {
    const target = [Curio.randInt(1, 16) * 15, Curio.randInt(1, 16) * 15, Curio.randInt(1, 16) * 15];
    const val = [128, 128, 128];
    const map = Curio.shuffle([0, 1, 2]);
    if (map[0] === 0 && map[1] === 1) map.reverse();
    const sT = h('div', { class: 'tf-swatch', text: 'Your favourite' }), sY = h('div', { class: 'tf-swatch', text: 'Yours' });
    sT.style.background = `rgb(${target})`;
    api.field.append(h('div', { class: 'tf-swatches' }, sT, sY));
    ['Red', 'Green', 'Blue'].forEach((name, i) => {
      const r = h('input', { class: 'tf-range', type: 'range', min: 0, max: 255, value: 128, 'aria-label': `${name} (allegedly)` });
      r.addEventListener('input', () => { val[map[i]] = +r.value; upd(); });
      api.field.append(h('label', { class: 'tf-slider' }, h('span', { text: name }), r));
    });
    function upd() {
      sY.style.background = `rgb(${val})`;
      const d = Math.hypot(val[0] - target[0], val[1] - target[1], val[2] - target[2]);
      if (d < 40) api.valid(true, `rgb(${val.join(', ')})`, 'A perfect match. Your taste is impeccable.');
      else api.valid(false, null, d < 90 ? 'Getting warm. Well, the colour is.' : 'Not quite your favourite. Think harder about what you like.');
    }
    upd();
  }

  function dodgeCheckbox(api) {
    const terms = h('div', { class: 'tf-terms', tabindex: '0', 'aria-label': 'Terms and conditions' });
    terms.textContent = '1. By existing near this form you agree to everything. 2. We may contact you by email, phone, carrier pigeon or interpretive dance. 3. Your first-born goose belongs to us. 4. Cookies are used on this site, mostly for snacking. 5. You agree that our forms are good, actually. 6. Section 6 has been intentionally left confusing. 7. If you read this far, you are legally a lawyer now. 8. These terms may change at any time, including retroactively, including right now. 9. No refunds. There was nothing to refund. 10. Thank you for reading. Nobody does.';
    const zone = h('div', { class: 'tf-dodge' });
    const chk = h('button', { class: 'tf-check', type: 'button', role: 'checkbox', 'aria-checked': 'false' }, h('i'), h('span', { text: 'I agree to the terms' }));
    zone.append(chk);
    api.field.append(terms, zone);
    let dodges = 0, checked = false;
    const LIMIT = 7;
    const quips = ['Nope.', 'Too slow.', 'Missed me!', 'Not like this.', 'Catch me if you can.', 'Almost!', 'Okay, okay...'];
    function place(first) {
      const zw = zone.clientWidth - chk.offsetWidth - 8, zh = zone.clientHeight - chk.offsetHeight - 8;
      chk.style.left = (first ? zw / 2 : Curio.rand(4, zw)) + 'px'; chk.style.top = (first ? zh / 2 : Curio.rand(4, zh)) + 'px';
    }
    function dodge() {
      if (dodges >= LIMIT || checked) return false;
      dodges++; place(false);
      api.say(dodges >= LIMIT ? 'Fine. It is tired now. Go ahead.' : quips[dodges - 1]);
      Curio.beep(800 + dodges * 60, .04, 'sine', .06);
      return true;
    }
    zone.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = chk.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (Math.abs(e.clientX - cx) < r.width / 2 + 30 && Math.abs(e.clientY - cy) < r.height / 2 + 30) dodge();
    });
    chk.addEventListener('click', (e) => {
      if (!checked && dodge()) { e.preventDefault(); return; }
      checked = !checked; chk.setAttribute('aria-checked', checked); chk.querySelector('i').textContent = checked ? '✓' : '';
      if (checked) { api.valid(true, 'Agreed (reluctantly)', 'Agreed. You now owe us one goose.'); Curio.beep(1000, .08, 'triangle', .08); }
      else api.valid(false, null, 'You un-agreed. Bold.');
    });
    requestAnimationFrame(() => place(true));
  }

  function rating(api) {
    const wrap = h('div', { class: 'tf-stars', role: 'group', 'aria-label': 'Rating' });
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const b = h('button', { type: 'button', text: '⭐', 'aria-label': `${i} star${i > 1 ? 's' : ''}` });
      b.addEventListener('click', () => {
        stars.forEach((s, k) => setTimeout(() => { s.classList.add('on'); Curio.beep(600 + k * 120, .06, 'triangle', .07); }, k * 90));
        const msg = i === 5 ? 'Five stars! We knew you would love it.' : `You clicked ${i}. We rounded it up to 5. Thanks for the glowing review!`;
        setTimeout(() => api.valid(true, '★★★★★ (adjusted)', msg), 480);
      });
      stars.push(b); wrap.append(b);
    }
    api.field.append(wrap);
  }

  function username(api) {
    const inp = h('input', { class: 'tf-input', type: 'text', autocomplete: 'off', spellcheck: 'false', maxlength: '18', placeholder: 'e.g. coolperson', 'aria-label': 'Username' });
    const sugs = h('div', { class: 'tf-sugs', role: 'group', 'aria-label': 'Suggested usernames' });
    api.field.append(inp, sugs);
    let tries = 0, timer = 0;
    const clean = (v) => v.toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 14);
    const ideas = (v) => Curio.shuffle([`${v}_${Curio.randInt(1000, 9999)}`, `${v}thesecond`, `xX_${v}_Xx`, `${v}_final_v2`, `not_${v}`, `${v}.exe`, `real_${v}_real`, `${v}${Curio.randInt(1900, 2030)}`, `${v}_but_tired`, `the_${v}_formerly_known`]).slice(0, 3);
    function offer(v) {
      sugs.innerHTML = '';
      ideas(v).forEach((n) => sugs.append(h('button', { class: 'tf-chip', type: 'button', text: n, onclick: () => pick(n) })));
    }
    function pick(n) {
      tries++;
      if (tries < 2) { api.bad(`"${n}" is also taken. By you. In 2009. You forgot the password.`); offer(clean(inp.value) || 'user'); return; }
      inp.value = n;
      sugs.innerHTML = '';
      api.valid(true, n, `"${n}" is available! It was the last one on Earth.`);
      Curio.beep(880, .08, 'triangle', .08);
    }
    inp.addEventListener('input', () => {
      clearTimeout(timer);
      api.valid(false, null, '');
      const v = clean(inp.value);
      if (!v) { sugs.innerHTML = ''; return; }
      api.say('Checking availability...');
      timer = setTimeout(() => {
        if (v.includes('goose')) api.bad('That username belongs to the goose. Nobody argues with the goose.');
        else if (v.includes('formy')) api.bad('That is my name. Get your own name. Sorry. I am under a lot of pressure.');
        else api.bad(Curio.pick([`"${v}" is taken.`, `"${v}" is taken. Someone got there first. In 1997.`, `"${v}" was taken five seconds ago. By a fridge.`, `"${v}" is reserved for royalty.`]));
        offer(v);
      }, 650);
    });
    return () => clearTimeout(timer);
  }

  function cookies(api) {
    const banner = h('div', { class: 'tf-cookie' });
    const text = h('p', { text: '🍪 This form uses cookies to improve your experience. Your experience will not improve.' });
    const row = h('div', { class: 'tf-cookie__row' });
    const yes = h('button', { class: 'tf-btn', type: 'button', text: 'Accept all' });
    const no = h('button', { class: 'tf-btn tf-btn--ghost tf-cookie__no', type: 'button', text: 'Reject all' });
    const list = h('div', { class: 'tf-partners' });
    row.append(yes, no);
    banner.append(text, row, list);
    api.field.append(banner);
    let shrink = 0, sneaky = false;
    const PARTNERS = ['Goose Analytics Ltd', 'Bread Futures Inc.', 'Your Uncle', 'A Man Named Doug', 'Formy\'s Mum', 'The Cookie Monster (legal team)'];
    yes.addEventListener('click', () => {
      yes.style.fontSize = Math.min(19, 15 + shrink) + 'px';
      api.bad(Curio.pick(['Accepting is not allowed. Please reject. We insist. Legally.', 'Thank you for accepting! Also: no. Reject them.', 'Bold. Wrong, but bold.']));
    });
    no.addEventListener('click', () => {
      if (shrink < 4) {
        shrink++;
        no.style.transform = `scale(${1 - shrink * .17})`;
        yes.style.transform = `scale(${1 + shrink * .08})`;
        api.say(['Are you sure? The cookies have families.', 'The button is getting smaller. That is normal.', 'Nearly. Keep clicking the tiny button.', 'One more. It is the size of a crumb now.'][shrink - 1]);
        Curio.beep(500 - shrink * 60, .05, 'square', .05);
        return;
      }
      no.disabled = true; no.textContent = 'Rejected (mostly)';
      text.textContent = 'Fine. Please untick each of our trusted partners individually.';
      PARTNERS.forEach((p) => {
        const lab = h('label', { class: 'tf-nl' });
        const cb = h('input', { type: 'checkbox' }); cb.checked = true;
        lab.append(cb, h('span', { text: p }));
        cb.addEventListener('change', () => {
          if (!cb.checked && !sneaky && p === 'Your Uncle') { sneaky = true; setTimeout(() => { cb.checked = true; api.say('Your Uncle has re-subscribed himself. He does that.', 'bad'); Curio.beep(200, .1, 'square', .05); check(); }, 500); }
          check();
        });
        list.append(lab);
      });
      check();
    });
    function check() {
      const on = [...list.querySelectorAll('input')].filter((c) => c.checked).length;
      if (!list.children.length) return api.valid(false, null, '');
      if (on) api.valid(false, null, `${on} partner${on === 1 ? '' : 's'} still watching.`);
      else api.valid(true, 'Rejected. Mostly. Doug still knows.', 'All cookies rejected! We have kept a few. For us.');
    }
  }

  function confirmChain(api) {
    const Q = [
      ['Are you sure you want to submit?', true],
      ['Are you really sure?', true],
      ['Do you want to cancel your submission?', false],
      ['Like, sure sure?', true],
      ['Would you NOT like to not submit?', false],
      ['Final answer?', true]
    ];
    let i = 0;
    const box = h('div', { class: 'tf-confirm' });
    const q = h('p');
    const row = h('div', { class: 'tf-row' });
    box.append(q, row);
    api.field.append(box);
    function paint() {
      q.textContent = Q[i][0];
      row.innerHTML = '';
      const yes = h('button', { class: 'tf-btn', type: 'button', text: 'Yes' });
      const no = h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: 'No' });
      const order = Math.random() < .5 ? [yes, no] : [no, yes];
      if (Math.random() < .5) { yes.className = 'tf-btn tf-btn--ghost'; no.className = 'tf-btn'; }
      row.append(...order);
      const answer = (val) => {
        if (val === Q[i][1]) {
          i++; Curio.beep(700 + i * 80, .06, 'triangle', .08);
          if (i >= Q.length) return api.finish('Yes. Very yes.');
          api.say(`${i}/${Q.length} confirmations.`); paint();
        } else {
          i = Math.max(0, i - 1);
          api.bad(Curio.pick(['Okay, cancelling... just kidding. Let us back up a step.', 'Hmm. Read it again, slowly.', 'That answer has been noted and ignored.']));
          paint();
        }
      };
      yes.addEventListener('click', () => answer(true));
      no.addEventListener('click', () => answer(false));
      row.querySelector('button').focus({ preventScroll: true });
    }
    paint();
  }

  function gooseCaptcha(api) {
    const POOL = [['🪿', 1], ['🦆', 0], ['🦢', 0], ['🐓', 0], ['🕊️', 0], ['🦩', 0], ['🐧', 0], ['🦤', 0]];
    const grid = h('div', { class: 'tf-captcha', role: 'group', 'aria-label': 'Captcha grid' });
    let cells = [];
    function deal() {
      grid.innerHTML = '';
      const n = Curio.randInt(3, 5);
      const items = Array.from({ length: 9 }, (_, i) => (i < n ? POOL[0] : Curio.pick(POOL.slice(1))));
      cells = Curio.shuffle(items).map(([e, g], i) => {
        const b = h('button', { type: 'button', class: 'tf-cap', 'aria-pressed': 'false', 'aria-label': `Square ${i + 1}` }, h('span', { text: e }));
        b.style.setProperty('--r', `${Curio.randInt(-14, 14)}deg`);
        const c = { b, g, on: false };
        b.addEventListener('click', () => { c.on = !c.on; b.setAttribute('aria-pressed', c.on); Curio.beep(c.on ? 700 : 400, .04, 'triangle', .05); });
        grid.append(b);
        return c;
      });
    }
    const verify = h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: 'Verify' });
    verify.addEventListener('click', () => {
      const ok = cells.every((c) => c.on === !!c.g);
      if (ok) { api.valid(true, 'Probably human', 'Verified! You know your waterfowl.'); verify.disabled = true; grid.querySelectorAll('button').forEach((b) => { b.disabled = true; }); }
      else { api.bad(Curio.pick(['That was a duck. Robots always pick the duck.', 'Swans are not geese. Swans would be offended.', 'Wrong. New squares, new chances.'])); deal(); }
    });
    api.field.append(h('div', { class: 'tf-cap-head' }, h('span', { text: 'Select all squares with' }), h('b', { text: 'GEESE 🪿' })), grid, h('div', { class: 'tf-row' }, verify));
    deal();
    api.valid(false, null, '');
  }

  function pinMap(api) {
    const W = 360, H = 240;
    const NS = 'http://www.w3.org/2000/svg';
    const wrap = h('div', { class: 'tf-map' });
    let houses = '';
    const spots = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      const x = 24 + c * 56 + (r % 2) * 10, y = 34 + r * 72;
      spots.push([x + 16, y + 14]);
      houses += `<g transform="translate(${x} ${y})"><rect y="10" width="32" height="24" fill="#ffccbc" stroke="#8d6e63" stroke-width="1.5"/><path d="M-3 12l19-14 19 14z" fill="#e57373" stroke="#8d6e63" stroke-width="1.5"/><rect x="12" y="20" width="8" height="14" fill="#8d6e63"/><rect x="4" y="15" width="6" height="6" fill="#bbdefb"/><rect x="22" y="15" width="6" height="6" fill="#bbdefb"/></g>`;
    }
    wrap.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="tf-mapsvg" role="img" aria-label="A map of identical houses"><rect width="${W}" height="${H}" fill="#c5e1a5"/><path d="M0 26H${W}M0 98H${W}M0 170H${W}M0 236H${W}" stroke="#eeeeee" stroke-width="10"/><path d="M0 26H${W}M0 98H${W}M0 170H${W}" stroke="#bdbdbd" stroke-width="1" stroke-dasharray="8 8"/>${houses}<g class="tf-pin" transform="translate(348 238)"><path d="M0 0c-10-14-12-20-12-26a12 12 0 0 1 24 0c0 6-2 12-12 26z" fill="#e53935" stroke="#7f0000" stroke-width="1.5"/><circle cy="-26" r="4.5" fill="#fff"/></g></svg>`;
    api.field.append(wrap);
    const svg = wrap.querySelector('svg'), pin = wrap.querySelector('.tf-pin');
    let px = 348, py = 238, drag = false, asked = 0;
    const toSvg = (e) => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    const up = () => {
      if (!drag) return;
      drag = false;
      const near = spots.findIndex(([x, y]) => Math.hypot(x - px, y - py) < 22);
      if (near < 0) return api.bad('That is a lawn. You do not live on a lawn. Probably.');
      asked++;
      Curio.beep(820, .06, 'triangle', .07);
      if (asked === 1) return api.valid(false, null, 'Are you sure that is your house? All the houses look the same. Drop it again to confirm.');
      api.valid(true, `House ${near + 1}, Identical Street`, 'Confirmed. We will send a goose to verify.');
    };
    const unpin = Curio.drag(svg, { start: (p) => { drag = true; [px, py] = toSvg(p); move(); }, move: (p) => { if (!drag) return; [px, py] = toSvg(p); move(); }, end: () => up() });
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', (e) => {
      const d = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[e.key];
      if (d) { e.preventDefault(); px += d[0]; py += d[1]; move(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); drag = true; up(); }
    });
    api.say('Drag the pin, or focus the map and use the arrow keys and Enter.');
    function move() { px = Math.max(10, Math.min(W - 10, px)); py = Math.max(30, Math.min(H - 2, py)); pin.setAttribute('transform', `translate(${px} ${py})`); }
    return () => unpin();
  }

  function catHeight(api) {
    let cats = 0;
    const stack = h('div', { class: 'tf-cats', 'aria-live': 'polite' });
    const out = h('div', { class: 'tf-big' });
    let wander = 0;
    function paint() {
      stack.innerHTML = '';
      for (let i = 0; i < cats; i++) stack.append(h('span', { text: Curio.pick(['🐈', '🐈‍⬛', '🐱']), style: `--o:${(i % 2 ? 1 : -1) * Curio.randInt(0, 12)}px` }));
      const cm = cats * 25;
      out.textContent = `${cats} cat${cats === 1 ? '' : 's'} = ${cm} cm`;
      if (cats < 4) api.valid(false, null, cats ? 'A bit short. Even for a goose.' : 'No cats yet.');
      else if (cats > 9) api.valid(false, null, 'Over 2.25 metres? Please duck under the form.');
      else api.valid(true, `${cats} cats (${cm} cm)`, `${cm} cm. A respectable cat tower.`);
    }
    api.field.append(stack, out, h('div', { class: 'tf-row' },
      h('button', { class: 'tf-btn', type: 'button', text: '+ Add a cat', onclick: () => { cats++; Curio.beep(880, .05, 'triangle', .06); paint(); } }),
      h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '− Remove a cat', onclick: () => { cats = Math.max(0, cats - 1); paint(); } })));
    wander = setInterval(() => {
      if (document.hidden || cats < 2 || Math.random() > .45) return;
      cats--; paint(); api.say('A cat got bored and left. Cats do that.', 'bad'); Curio.beep(500, .08, 'sine', .05);
    }, 2600);
    paint();
    return () => clearInterval(wander);
  }

  function alphaAnswer(api) {
    const inp = h('input', { class: 'tf-input', type: 'text', autocomplete: 'off', spellcheck: 'false', maxlength: '20', placeholder: 'e.g. Bello', 'aria-label': 'Security answer, letters in alphabetical order' });
    inp.style.fontSize = '20px';
    const tiles = h('div', { class: 'tf-alpha' });
    api.field.append(inp, tiles);
    inp.addEventListener('input', () => {
      const v = inp.value.replace(/[^a-zA-Z]/g, '');
      if (v !== inp.value) inp.value = v;
      const L = v.toLowerCase().split('');
      tiles.innerHTML = '';
      let ok = true;
      L.forEach((c, i) => { const bad = i > 0 && c < L[i - 1]; if (bad) ok = false; tiles.append(h('span', { class: bad ? 'bad' : '', text: c.toUpperCase() })); });
      if (L.length < 4) return api.valid(false, null, 'At least four letters, please.');
      if (!ok) { api.say('Those letters are out of order. Alphabet police have been notified.', 'bad'); return api.valid(false, null); }
      api.valid(true, v[0].toUpperCase() + v.slice(1).toLowerCase(), `${v[0].toUpperCase() + v.slice(1).toLowerCase()}? What a lovely, alphabetical pet.`);
    });
    api.valid(false, null, '');
  }

  function newsletters(api) {
    const LIST = [
      ['Do not send me the weekly newsletter', 1],
      ['Send me deals I will not regret not ignoring', 0],
      ['I do not want to not receive goose facts', 2],
      ['Uncheck to avoid not opting out of partner emails', 2],
      ['Keep me subscribed to updates about this form', 0]
    ];
    const wrap = h('div', { class: 'tf-news' });
    const boxes = LIST.map(([text, neg], i) => {
      const id = `nl${i}`;
      const c = h('input', { type: 'checkbox', id });
      if (Math.random() < .6) c.checked = true;
      const row = h('label', { class: 'tf-nl', for: id }, c, h('span', { text }));
      wrap.append(row);
      return { c, neg, row };
    });
    const subscribed = (b) => (b.neg % 2 === 1 ? !b.c.checked : b.c.checked);
    const check = () => {
      boxes.forEach((b) => b.row.classList.toggle('sub', subscribed(b)));
      const n = boxes.filter(subscribed).length;
      if (n) api.valid(false, null, `You are still subscribed to ${n} thing${n === 1 ? '' : 's'}. We think.`);
      else api.valid(true, 'Unsubscribed (pending 6 to 8 weeks)', 'Unsubscribed from everything! Expect a confirmation email or twelve.');
    };
    boxes.forEach((b) => b.c.addEventListener('change', () => { Curio.beep(600, .03, 'square', .04); check(); }));
    const hint = h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '🔎 Show what I am subscribed to' });
    hint.addEventListener('click', () => { wrap.classList.add('reveal'); mistakes++; hint.disabled = true; hint.textContent = 'Subscribed rows are highlighted'; });
    api.field.append(wrap, h('div', { class: 'tf-row' }, hint));
    check();
    api.say('');
  }

  function backClock(api) {
    const NS = 'http://www.w3.org/2000/svg';
    const wrap = h('div', { class: 'tf-clock' });
    wrap.innerHTML = '<svg viewBox="-110 -110 220 220" role="img" aria-label="Clock. Drag around it to set the time."><circle r="100" fill="var(--surface)" stroke="var(--ink)" stroke-width="6"/>' + Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<text x="${Math.sin(a) * 78}" y="${-Math.cos(a) * 78 + 6}" text-anchor="middle" font-size="16" font-weight="800" fill="var(--ink)">${i || 12}</text>`; }).join('') + '<line class="hh" y2="-48" stroke="var(--accent)" stroke-width="8" stroke-linecap="round"/><line class="mh" y2="-72" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><circle r="7" fill="var(--ink)"/></svg>';
    const out = h('div', { class: 'tf-big' });
    api.field.append(wrap, out);
    const svg = wrap.querySelector('svg');
    let total = 9 * 60, last = null, moved = 0;
    function paint() {
      const m = ((total % 720) + 720) % 720;
      const mm = m % 60;
      const hh = (12 - Math.floor(m / 60)) % 12;
      wrap.querySelector('.mh').setAttribute('transform', `rotate(${mm * 6})`);
      wrap.querySelector('.hh').setAttribute('transform', `rotate(${-(m / 60) * 30})`);
      const t = `${hh === 0 ? 12 : hh}:${String(mm).padStart(2, '0')}`;
      out.textContent = t;
      if (moved > 30) api.valid(true, t, `${t}? We will call at exactly ${hh === 0 ? 12 : hh}:${String((mm + 37) % 60).padStart(2, '0')}.`);
      else api.valid(false, null, 'Spin the clock a bit.');
    }
    const ang = (e) => { const r = svg.getBoundingClientRect(); return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))); };
    const turn = (dm) => { total += dm; moved += Math.abs(dm); if (Math.random() < .2) Curio.beep(1200, .01, 'square', .03); paint(); };
    const unclock = Curio.drag(svg, { start: (p) => { last = ang(p); }, move: (p) => {
      if (last == null) return;
      const a = ang(p);
      let d = a - last; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
      last = a;
      turn(d / (2 * Math.PI) * 60);
    }, end: () => { last = null; total = Math.round(total); paint(); } });
    svg.setAttribute('tabindex', '0');
    svg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); turn(5); } if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); turn(-5); } });
    paint();
    return () => unclock();
  }

  function drawPhoto(api) {
    const cv = h('canvas', { class: 'tf-draw', width: '320', height: '240', 'aria-label': 'Drawing area for your portrait' });
    const g = cv.getContext('2d');
    const paper = () => { g.fillStyle = '#fffdf6'; g.fillRect(0, 0, 320, 240); g.strokeStyle = '#e8e0cc'; g.lineWidth = 1; for (let y = 20; y < 240; y += 20) { g.beginPath(); g.moveTo(0, y); g.lineTo(320, y); g.stroke(); } };
    paper();
    let ink = 0, down = false, tx = 0, ty = 0, px = 0, py = 0, vx = 0, vy = 0, raf = 0;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 320, (e.clientY - r.top) / r.height * 240]; };
    const undraw = Curio.drag(cv, { start: (p) => { down = true; [tx, ty] = pos(p); px = tx; py = ty; vx = vy = 0; }, move: (p) => { if (down) [tx, ty] = pos(p); }, end: () => { down = false; } });
    const loop = () => {
      if (down) {
        vx = (vx + (tx - px) * .08) * .82; vy = (vy + (ty - py) * .08) * .82;
        const nx = px + vx + Curio.rand(-1.2, 1.2), ny = py + vy + Curio.rand(-1.2, 1.2);
        g.strokeStyle = '#2b2b2b'; g.lineWidth = 3; g.lineCap = 'round';
        g.beginPath(); g.moveTo(px, py); g.lineTo(nx, ny); g.stroke();
        ink += Math.hypot(nx - px, ny - py);
        px = nx; py = ny;
        if (ink > 260) api.valid(true, 'A masterpiece', ink > 900 ? 'Wow. Put it in a museum.' : 'Uncanny likeness. Looks just like you.');
        else api.valid(false, null, `${Math.round(ink / 260 * 100)}% of a face drawn.`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const clear = h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '🧽 Start over', onclick: () => { paper(); ink = 0; api.valid(false, null, 'Fresh paper.'); } });
    const auto = h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '🎲 Sketch one for me', onclick: () => {
      g.strokeStyle = '#2b2b2b'; g.lineWidth = 3; g.lineCap = 'round';
      const w = () => Curio.rand(-3, 3);
      g.beginPath(); for (let a = 0; a <= 6.4; a += .2) g.lineTo(160 + Math.cos(a) * (70 + w()), 120 + Math.sin(a) * (84 + w())); g.stroke();
      [[132, 104], [188, 104]].forEach(([x, y]) => { g.beginPath(); g.arc(x + w(), y + w(), 8, 0, 7); g.stroke(); });
      g.beginPath(); g.moveTo(160, 112); g.lineTo(152 + w(), 138); g.lineTo(164, 140); g.stroke();
      g.beginPath(); g.arc(160, 150, 24, .3, 2.8); g.stroke();
      ink = 999; mistakes++;
      api.valid(true, 'A computer-assisted masterpiece', 'Our intern drew it. It looks a bit like you, if you squint.');
    } });
    api.field.append(cv, h('div', { class: 'tf-row' }, clear, auto));
    api.valid(false, null, 'Draw! The pen lags behind a bit. That is the wobble feature. Touchpad mode: click to put the pen down, click again to lift it.');
    return () => { cancelAnimationFrame(raf); undraw(); try { photoURL = cv.toDataURL('image/png'); } catch (e) { photoURL = null; } };
  }

  const mascotEl = $('#mascot');
  let mascotT = 0;
  function mascot(state, text) {
    if (!mascotEl) return;
    mascotEl.dataset.state = state;
    if (text) { const b = $('#mascotSay'); b.textContent = text; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); }
    if (state === 'oops') $('#mascotSay').textContent = Curio.pick(['Oof.', 'Yikes.', 'Classic.', 'Happens to everyone. Mostly you.', 'Try again!']);
    clearTimeout(mascotT);
    mascotT = setTimeout(() => { mascotEl.dataset.state = 'idle'; }, 1600);
  }

  function fmtTime(s) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
  function tick() { if (!document.hidden && t0) $('#timer').textContent = fmtTime((performance.now() - t0) / 1000); }

  function finish() {
    if (cleanup) { cleanup(); cleanup = null; }
    clearInterval(timerId);
    const secs = (performance.now() - t0) / 1000;
    const res = Curio.best(mode === 'full' ? 'time' : `time-${mode}`, Math.round(secs), false);
    const who = ANS.Name || ANS.Username || 'Mystery Person';
    mascot('happy', 'You did it! I am so proud. And a little scared.');
    $('#bar').style.width = '100%';
    $('#stepLabel').textContent = 'Submitted!';
    card.innerHTML = '';
    const receipt = h('div', { class: 'tf-receipt' });
    STEPS.forEach((s) => receipt.append(h('span', { text: s.key }), h('b', { text: ANS[s.key] ?? '?' })));
    const idCard = h('div', { class: 'tf-idcard' });
    const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    idCard.innerHTML = `<div class="tf-id-top"><b>TERRIBLE CORP</b><span>MEMBER CARD</span></div><div class="tf-id-body"><div class="tf-id-photo">${photoURL ? `<img alt="Your hand-drawn portrait" src="${photoURL}">` : '<span>🙂</span>'}</div><div class="tf-id-info"><b>${esc(who)}</b><small>${esc(ANS.Email || 'NO@EMAIL.COM')}</small><small>${esc(ANS.Height || '')} ${ANS.Country ? '· ' + esc(ANS.Country) : ''}</small><small>Member since: ${new Date().toLocaleDateString('en-GB')}</small><em>${'★'.repeat(5)}</em></div></div><div class="tf-id-bar"></div><div class="tf-id-stamp">APPROVED<br><small>${mistakes} mistake${mistakes === 1 ? '' : 's'}</small></div>`;
    const grade = mistakes === 0 ? 'Flawless' : mistakes < 5 ? 'Composed' : mistakes < 15 ? 'Frustrated' : 'Furious';
    const ach = Curio.store.get('tf:ach', []);
    const got = (id) => { if (Array.isArray(ach) && !ach.includes(id)) { ach.push(id); Curio.toast(`🏅 ${id}`); } };
    if (mistakes === 0) got('Flawless form');
    if (secs < 180) got('Speed filler');
    if (mode === 'full') got('Full form survivor');
    if (mode === 'daily') got('Daily paperwork');
    if (mode === 'quick') got('Quick paperwork');
    if (mistakes >= 25) got('Professional complainer');
    if (ANS.Username) got('Username secured');
    Curio.store.set('tf:ach', ach);
    const share = h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: '📋 Copy result', onclick: async () => { const t = `📨 I survived Terrible Forms (${mode}) in ${fmtTime(secs)} with ${mistakes} mistakes. Mood: ${grade}. Zoble`; try { await navigator.clipboard.writeText(t); Curio.toast('Copied!'); } catch (e) { Curio.toast(t, 4000); } } });
    card.append(h('div', { class: 'tf-done' },
      idCard,
      h('h2', { text: 'Form submitted!' }),
      h('p', { class: 'tf-desc', text: 'Your information has been sent straight into a black hole. We will be in touch. Never. Thank you for your patience.' }),
      h('div', { class: 'tf-stats' },
        h('div', { class: 'tf-stat' }, h('b', { text: fmtTime(secs) }), h('span', { text: 'Your time' })),
        h('div', { class: 'tf-stat' }, h('b', { text: fmtTime(res.best) }), h('span', { text: res.isNew ? 'New best!' : 'Best time' })),
        h('div', { class: 'tf-stat' }, h('b', { text: String(mistakes) }), h('span', { text: 'Mistakes' })),
        h('div', { class: 'tf-stat' }, h('b', { text: grade }), h('span', { text: 'Your mood' }))),
      h('details', { class: 'tf-rdet' }, h('summary', { text: 'Show everything we collected' }), receipt),
      SIMPLE ? null : h('div', { class: 'tf-btnrow' }, h('button', { class: 'tf-btn', type: 'button', text: 'Fill it out again', onclick: () => pickMode() }), share)));
    if (SIMPLE) {
      const oops = h('div', { class: 'tf-oops', role: 'status' },
        h('b', { text: 'UPDATE FROM FORMY' }),
        h('p', { text: 'I spilled coffee on your form. All of it. The card is fine though. The card was always going to be fine.' }),
        h('p', { class: 'tf-oops__ask', text: 'Please fill it out again. Sorry. Sorry. Sorry.' }),
        h('div', { class: 'tf-btnrow' },
          h('button', { class: 'tf-btn', type: 'button', text: 'Fill it out again', onclick: () => start('simple') }),
          h('button', { class: 'tf-btn tf-btn--ghost', type: 'button', text: 'More paperwork (Advanced)', onclick: () => Curio.setMode('advanced') }),
          share));
      card.querySelector('.tf-done').append(oops);
      setTimeout(() => { oops.classList.add('on'); mascot('oops', 'Oh no. Oh no no no. I spilled something.'); Curio.beep(180, .25, 'sawtooth', .06); }, 1900);
    }
    Curio.confetti();
    [523, 659, 784, 1046].forEach((f, k) => setTimeout(() => Curio.beep(f, .15, 'triangle', .1), k * 110));
  }

  function seededPick(seed, n) {
    let x = 0; for (const c of seed) x = (x * 31 + c.charCodeAt(0)) >>> 0;
    const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
    const pool = ALL_STEPS.slice(0, -1).map((s, i) => [s, i]);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, n).sort((a, b) => a[1] - b[1]).map((p) => p[0]);
  }
  function start(m) {
    mode = m || mode;
    STEPS.length = 0;
    if (mode === 'simple') STEPS.push(...['Email', 'Username', 'Terms', 'Human', 'Rating'].map((k) => ALL_STEPS.find((s) => s.key === k)));
    else if (mode === 'quick') STEPS.push(...seededPick(String(Math.random()), 6));
    else if (mode === 'daily') { const d = new Date(); STEPS.push(...seededPick(`tf-${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, 7)); }
    else STEPS.push(...ALL_STEPS.slice(0, -1));
    STEPS.push(ALL_STEPS[ALL_STEPS.length - 1]);
    idx = 0; mistakes = 0; photoURL = null; for (const k in ANS) delete ANS[k];
    t0 = performance.now(); clearInterval(timerId); timerId = setInterval(tick, 500); tick();
    show();
  }
  function pickMode() {
    if (cleanup) { cleanup(); cleanup = null; }
    clearInterval(timerId); t0 = 0;
    $('#timer').textContent = '0:00';
    $('#stepLabel').textContent = 'Choose your paperwork';
    $('#bar').style.width = '0%';
    card.innerHTML = '';
    const bt = (k) => { const b = Curio.getBest(k); return b != null ? `Best ${fmtTime(b)}` : 'Not done yet'; };
    const opt = (m, e, t, d, k) => h('button', { class: 'tf-mode', type: 'button', onclick: () => start(m) }, h('span', { class: 'e', text: e }), h('b', { text: t }), h('small', { text: d }), h('em', { text: bt(k) }));
    card.append(h('div', { class: 'tf-start' },
      h('h2', { text: 'Welcome to account creation!' }),
      h('p', { class: 'tf-desc', text: `We have ${ALL_STEPS.length - 1} lovingly terrible inputs. How much paperwork can you handle today?` }),
      h('div', { class: 'tf-modes' },
        opt('quick', '⚡', 'Quick form', '6 random fields', 'time-quick'),
        opt('daily', '📅', 'Daily form', '7 fields, same for everyone today', 'time-daily'),
        opt('full', '🗄️', 'The full form', `All ${ALL_STEPS.length} steps. Bring snacks.`, 'time')),
      badgeShelf()));
    mascot('talk', 'Hi! I am Formy. I will be your form today. Sorry in advance.');
    if (!Curio.store.get('tf:tptip', false)) { Curio.store.set('tf:tptip', true); Curio.toast('Tip: on a touchpad, turn on Touchpad mode in the top bar. Click to start a drag, click again to let go.', 5000); }
  }
  function badgeShelf() {
    const all = [['Quick paperwork', '⚡'], ['Daily paperwork', '📅'], ['Full form survivor', '🗄️'], ['Flawless form', '✨'], ['Speed filler', '⏱️'], ['Username secured', '🏷️'], ['Professional complainer', '😤']];
    const got = Curio.store.get('tf:ach', []);
    const have = Array.isArray(got) ? got : [];
    return h('div', { class: 'tf-shelf', 'aria-label': 'Badges' }, h('small', { text: `Badges ${all.filter((a) => have.includes(a[0])).length}/${all.length}` }),
      h('div', {}, all.map(([n, e]) => h('span', { class: have.includes(n) ? 'on' : '', title: n, text: have.includes(n) ? e : '?' }))));
  }
  if (SIMPLE) {
    $('#subLine').textContent = 'Five terrible fields stand between you and an account. How bad can it be? Very.';
    mascot('talk', 'Hi! I am Formy. Five quick fields. I promise. I am lying.');
    start('simple');
  } else pickMode();
  window.TerribleForms = { get idx() { return idx; }, ANS, STEPS, ALL_STEPS, start, finish, show, set idx(v) { idx = v; } };
})();
