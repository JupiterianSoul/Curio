# Curio

A pile of small web games and toys. Things to poke, break, draw, guess and waste a good afternoon on.

Everything is plain HTML, CSS and JS. No build step, no frameworks, nothing loaded from the network. Each game lives in its own folder under `site/games/<slug>/` and shares a tiny runtime (`site/shared.js`, `site/shared.css`). The list of games is `site/games.js`.

## Running it

Any static server pointed at `site/` works:

```
npm run serve
```

## Checks

```
npm install
npx playwright install chromium
npm run check
```

`sweep` makes sure there are no code comments and no em dashes anywhere. `smoke` opens the hub and every game at desktop and phone size and fails on errors, missing files, sideways scrolling or a missing top bar. Pass slugs to only test some games: `node tools/smoke.mjs 2048 minesweeper`.

## Adding a game

Read `docs/BRIEF.md`. Short version: make `site/games/<slug>/index.html` and a `thumb.svg`, add an entry to `site/games.js`, run the checks.

## Hosting

Cloudflare Pages, connected to this repo. No build command, output directory `site`. Every push to `main` goes live.
