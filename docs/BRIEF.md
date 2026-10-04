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

`shared.js` injects a fixed Zoble 98 title bar and menubar (height `var(--bar-h)`, 52px, see
the Zoble 98 section below) and adds `padding-top` to body. Full-screen
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

## Zoble (new name, new repo)

The site is now called Zoble and lives in its own repo at /home/user/curio (GitHub JupiterianSoul/Zoble, live at zoble.pages.dev). Pages are in `site/`, checks in `tools/` (`node tools/smoke.mjs <slugs>`, `node tools/sweep.mjs`, run from /home/user/curio; sweep now sees game folders too). Every visible text says Zoble, never Curio, and page titles are `Game Title · Zoble`. Internal names stay: `window.Curio`, `curio:*` events, `.curio-*` classes, `CURIO_GAMES`, store keys.

## Simple and Advanced (required for every game)

Every game and toy has two versions, switched with the Simple / Advanced pill that `shared.js` puts in the top bar.

- Opt in with `<body data-game="<slug>" data-modes>`. Read `Curio.mode` (`'simple'` or `'advanced'`, also `Curio.simple`, `Curio.advanced`) when the game starts. Switching reloads the page by default. If the game can switch live, use `data-modes="live"` and listen for the `curio:mode` window event.
- Simple: fewer features and content, instant to understand and fast to play, one main loop, few or no menus, big clear controls. Someone bored for two minutes should have fun right away.
- Advanced: everything, more content, modes, progression, settings, stats, meant to be played longer.
- Keep separate saves and bests per mode where they differ (for example `Curio.best(\`score:${Curio.mode}\`, ...)`).
- `html[data-mode]` is set to the mode, for CSS.

## Identity

Each game must have its own identity: its own art direction, palette, typography treatment, sounds and copy voice that fit its theme, while still feeling part of Zoble (shared top bar, tokens for UI chrome, light and dark readable). No two games should look like the same template.

## Libraries (allowed, vendored)

You may use open-source libraries and tools (for example 98.css, physics engines, tone or audio helpers, drag and resize helpers, icon or font tooling). Rules:

- Vendor them into the repo: copy the built file(s) into `site/vendor/<name>/` (shared) or into your game folder, with the library's LICENSE file next to it. Only permissive licences (MIT, BSD, ISC, Apache-2.0, OFL for fonts, CC0).
- The live site must still load nothing from other servers: no CDN links, no runtime fetches outside the site.
- Prefer small, plain-script or ES-module builds that work without a build step. If a library needs bundling, bundle it once locally (npm, esbuild) and commit the bundled output, not node_modules.
- Dev-only tools (fontTools, image tools, test helpers) are fine in `tools/` or your scratch folder; they never ship to `site/`.
- The sweep check skips any `vendor/` folder and `*.min.js` / `*.min.css` files (third-party code keeps its licence comments). Everything you write yourself still follows the repo rules.

## Zoble 98

The site now looks like a late-90s desktop OS called Zoble 98. The full guide is `docs/DESIGN.md`; the short version for game builders:

- Your page gets a title bar and a menubar on top, still exactly `var(--bar-h)` (52px). Size canvases with `calc(100dvh - var(--bar-h))` as before. Inside a desktop window there is no bar and `--bar-h` is `0px`, so the same CSS fills the window.
- Tokens still work and every colour scheme defines them: `--bg` is the grey window face, `--surface` the white content area, `--accent` the selection colour, `--shadow` a raised 3D bevel, radius tokens are `0`. Use `Curio.isDark()` and `curio:theme` for canvas colours; High Contrast Black and Midnight are dark.
- Fonts: `--font` is the Zoble 98 pixel font (crisp at 12, 24, 36, 48px), `--c-hand` its bold display cut, `--mono` is Courier New.
- Use the kit for UI chrome: `.c-btn` (default push button), `.c-btn--ghost` (plain button), `.c-input` (sunken field), `.c-card` (raised panel), `.c-stat`, `.c-kbd`, `.c-title`. Wrap anything in `.z98` to get the full 98-style controls (checkboxes, radios, selects, sliders, group boxes with `fieldset`, tabs, tree view, progress bars); see DESIGN.md for markup.
- Keep your game's own art and identity inside the window. Do not add your own top bar, overlays or mascots.
- `Curio.modal` is now a dialog box (same API; add `icon: 'info' | 'warn' | 'question' | 'error'` if the emoji guess is wrong). `Curio.toast` is a small balloon that never blocks clicks.
- Optional: `Curio.howTo(fn or 'text')` makes Help, How to play open your instructions. Otherwise the menu clicks your own "How to play" or "Rules" button if it finds one.
- Simple and Advanced work as before; the switch lives in the menubar (direct page) or the window's View menu and menubar (desktop window).
- Games are drawn as pixel icons from `thumb.svg` (centre square, 32px), so keep the subject in the middle of the thumbnail.
- Never write the name of a real operating system or its maker in the UI, and never use their logos, fonts, sounds or icons.

