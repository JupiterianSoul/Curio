# Zoble polish pass

You are upgrading existing, working Zoble pages. Read `site/BRIEF.md` first (contract and
repo rules: no code comments, no em dash character anywhere). Then, for each of your slugs, read
the whole page, play it in a browser, take before screenshots, and make it substantially better.
The owner's feedback: "all games need more polish, better graphics, way more features and content".

## What "better" means

1. Graphics. Replace plain boxes, bare emoji and flat colours with real art: hand-built SVG or
   canvas illustrations, gradients and soft shadows, textures, depth, animated backgrounds,
   particles, smooth transitions between states, satisfying micro-animations on every action
   (press, hover, success, failure). A designed start screen and a designed result screen.
   Consistent with the Zoble look (shared tokens, rounded, warm) and good in light and dark mode.
2. Features. Add meaningful modes and options: difficulty levels, alternate modes or rule
   variants, daily challenge (seeded by date) where it fits, settings, stats and history,
   achievements/badges stored in `Curio.store`, a "share result" copy text, keyboard shortcuts,
   undo where it fits, tutorials or a "how to play" card.
3. Content. Roughly double or triple the data: more levels, puzzles, questions, items, words,
   creatures, presets, themes, skins. Keep all facts accurate.
4. Feel. Juice: screen shake, easing, combo pop-ups, sound design via WebAudio (respect
   `Curio.muted`), haptics with `navigator.vibrate` where supported, no input lag.
5. Robustness. Phones at 390px fully playable with touch, no sideways scroll, no console errors,
   loops paused when `document.hidden`, saved data versioned so old saves don't crash.

Keep what works. Don't rename slugs or move folders. Keep `data-game`, the shared scripts and the
top bar. Stay inside your own folders. Update `thumb.svg` if the game's look changed a lot. Split
big pages into `game.js`, `style.css`, `data.js` as needed. Don't commit.

## Verify

- `node tools/smoke.mjs <your slugs>` must pass.
- Your own Playwright script (launch with `executablePath: '/opt/pw-browsers/chromium'`, import
  from `/home/user/curio/node_modules/playwright/index.mjs`, keep it in your own scratch folder
  `/tmp/claude-0/polish-<name>/`) that plays each game through its main flows on desktop and
  phone, checks no errors, and takes after screenshots. Look at before and after side by side.
- `node tools/sweep.mjs` does not see game folders (they are git-excluded locally), so grep your
  folders yourself for the em dash character and for comments.

Final reply: per game, a short list of what you added (graphics / features / content), plus the
smoke result line.

## Touchpad first (owner request, applies to every game)

The owner mostly plays on a laptop touchpad, without a mouse. Every game must be comfortable that way:

- Never require holding the button while moving. Use `Curio.drag(el, { start, move, end })` from
  `shared.js` for every drag, draw, aim-and-release or slingshot interaction. Each callback gets
  `{ x, y }` relative to `el` (plus `clientX`, `clientY`, `pressure`, `pointerType`, `event`).
  Normally it behaves like pointerdown/move/up; when the player turns on Touchpad mode (top bar
  button, `Curio.touchpad`, `curio:touchpad` event), a click starts the drag, moving continues it,
  and the next click (or Esc) ends it.
- Never require right-click, middle-click, double-click or hover-only UI. Give every such action a
  visible button or mode toggle and a keyboard key.
- Offer keyboard play wherever it makes sense (arrows/WASD, Space, Enter, number keys for tools), so
  the touchpad is only needed for pointing.
- Aiming and fast clicking games: generous hit targets, optional aim assist or larger targets
  setting, no tiny moving targets that need precise flicks.
- Zoom and pan: support two-finger scroll (wheel deltaX/deltaY) to pan and pinch (wheel with
  `ctrlKey`) to zoom, with `preventDefault` only over the canvas.
- Show a short on-screen hint the first time ("Tip: turn on Touchpad mode in the top bar").
