# dukeaidanhall.github.io

Personal site of Aidan Hall. Live at https://dukeaidanhall.github.io/

Hand-written HTML, CSS and JavaScript. No framework, no build step, no dependencies.

## What's in it

- `index.html`: the whole site, one page.
- `assets/css/site.css`: design tokens, light and dark themes, layout.
- `assets/js/site.js`: everything interactive (below).
- `Aidan_Hall_Resume.pdf`: current resume, linked from the hero.
- `llms.txt`, `robots.txt`, `sitemap.xml`: plain-text summary for AI agents, crawler rules, sitemap.
- `404.html`: GitHub Pages serves this for missing paths.

## Features

- Command palette (`⌘K` / `Ctrl K` or `/`) with fuzzy search over sections, projects, roles and links. Doubles as the mobile menu.
- Live status card: Marrow's App Store version and the `marrow-mcp` PyPI release are fetched from the public iTunes and PyPI APIs on load, cached for 20 minutes, with static fallbacks.
- Marrow architecture diagram: HTML boxes, with SVG wires measured and drawn at runtime and animated with the Web Animations API. Hover or focus a box to trace its connections.
- Hero dot field on a canvas: batched draw calls, paused when off screen or in a background tab.
- Light and dark themes that follow the system, with a manual toggle (`t`) that reveals through a View Transition.
- Project filters animated with View Transitions.
- Contact form through EmailJS, loaded only when the form is first used, with a honeypot field.
- Respects `prefers-reduced-motion`. Content is fully visible without JavaScript.

## Editing

Open `index.html` and change the text. Experience entries and project cards are plain HTML blocks, copy one to add another.
Anything with `data-cmdk="..."` shows up in the command palette automatically.

To preview locally:

```sh
python3 -m http.server 8000
```

Pushing to `main` deploys through GitHub Pages.
