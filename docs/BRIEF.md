# Zoble - brief for building a game page

Zoble is a neal.fun-style hub of small, polished web toys and games at `site/`.
It is plain static HTML/CSS/JS: no build step, no npm packages, no CDNs, no network
requests of any kind (no fonts, no APIs, no images from the web). Everything a page needs
lives in its own folder.

## Files you may touch

Only your own folders: `site/games/<slug>/` for the slugs you were assigned.
Never edit `shared.css`, `shared.js`, `games.js`, `index.html` or another game's folder.
Do not commit or push; the lead does that.

Each folder must contain:

- `index.html` - the page (required)
- `thumb.svg` - a hand-made illustrative thumbnail, `viewBox="0 0 400 300"`, flat
  and colourful like neal.fun's thumbnails, showing the game's idea (not just an emoji
  or text). Keep it under ~6 KB. Fill the whole 400x300 with a background.
- optionally `game.js`, `style.css`, `data.js` if the page is big.

## Page skeleton (required)

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Game Title · Zoble</title>
  <meta name="description" content="One line.">
  <link rel="icon" href="thumb.svg">
  <link rel="stylesheet" href="../../shared.css">
  <style>/* page styles */</style>
</head>
<body data-game="<slug>">
  <main class="c-wrap"> ... </main>
  <script src="../../games.js"></script>
  <script src="../../shared.js"></script>
  <script> /* game code, can use window.Curio */ </script>
</body>
</html>
```

`shared.js` injects a fixed top bar (height `var(--bar-h)`, 52px) with a link home, the
title, mute, dark-mode and random-game buttons, and adds `padding-top` to body. Full-screen
canvas games should size to `innerHeight - 52` (or use `calc(100dvh - var(--bar-h))`).

## Shared kit

CSS tokens (always use them so light AND dark mode work): `--bg --surface --surface-2
--ink --ink-2 --ink-3 --line --accent --good --bad --warn --radius --shadow --font --mono`.
Classes: `.c-wrap` (centered 960px column), `.c-title`, `.c-sub`, `.c-card`, `.c-row`,
`.c-btn`, `.c-btn--ghost`, `.c-input`, `.c-stat` (`<div class="c-stat"><b>12</b><span>Score</span></div>`),
`.c-muted`, `.c-kbd`.
Canvas games that draw their own colours should read `Curio.isDark()` and listen for the
`curio:theme` window event to repaint, or pick a palette that works on both.

`window.Curio`:
- `store.get(key, fallback)`, `store.set(key, value)` - namespaced localStorage (safe)
- `best(key, score, higherIsBetter=true)` → `{ best, isNew }` personal best; `getBest(key)`
- `beep(freq, seconds, type, volume)` - tiny WebAudio blip, respects mute. `audioContext()`
  returns the shared AudioContext (or null) for richer sound; check `Curio.muted` first.
- `toast(text)`, `modal({emoji, title, body, buttons:[{label,value}]})` → Promise(value)
- `confetti()`, `rand(a,b)`, `randInt(a,b)`, `pick(arr)`, `shuffle(arr)`, `fmt(n, decimals)`

## Quality bar (this is the point)

- Polished and delightful like neal.fun: a clear title + one-line intro, satisfying
  feedback (animation, sound via `Curio.beep`, confetti on wins), a proper end/result
  screen with score, personal best and "play again", and fun copy with personality.
- Real content: if the page is about data (ocean creatures, elements, prices, countries...)
  include lots of accurate, hand-written data - dozens of entries, not three.
- Works with mouse, keyboard AND touch. Phones at 390px wide must be fully playable with no
  sideways scrolling (on-screen controls/swipes where a keyboard would be needed).
- Works in light and dark mode.
- No console errors. No `alert()`/`prompt()`. Pause loops when `document.hidden`.
- Accessible basics: buttons are `<button>`, images/canvas have labels, focus visible.

## Verify before you finish

From the repo root run: `node tools/smoke.mjs <slug> <slug> ...`
It loads each page at desktop and phone width and fails on errors, 404s, missing top bar,
sideways scroll. To look at the pages, run with `SHOTS=/tmp/claude-0/shots-<you>` and open
the PNGs with the Read tool. Actually look at them and fix what looks off. Also exercise
the game logic with a quick Playwright script of your own if it has non-trivial rules
(e.g. play a few moves, check win detection). Report back a one-paragraph summary per game.

## Repo rules (CI runs `node tools/sweep.mjs`)

No code comments in `.js`/`.css` files, no `<!-- -->` comments in HTML, and no em dash
character anywhere in any file (copy and data included). Use a hyphen, comma or colon.

## Notes

- Your entries already exist in `games.js` with `soon: true`; leave that file alone, the lead
  flips them on. The smoke test skips `soon` pages unless you name the slug, so always pass
  your slugs explicitly: `node tools/smoke.mjs <slug> ...`.
- In your own Playwright scripts, launch with
  `executablePath: '/opt/pw-browsers/chromium'` (the pinned build is not downloaded), and import
  Playwright from `/home/user/curio/node_modules/playwright/index.mjs`. Keep scratch scripts
  out of the repo (use your scratchpad).
- Look at the existing finished games in `site/games/` (e.g. `2048`, `minesweeper`,
  `drum-machine`) for the expected level of polish.

## Touchpad

Read the "Touchpad first" section of `POLISH.md` and follow it: use `Curio.drag` for every drag,
no right-click-only or hover-only controls, keyboard alternatives.
