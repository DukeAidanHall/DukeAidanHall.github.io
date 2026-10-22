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

Ideas borrowed from the most-starred personal sites on GitHub, rebuilt by hand:

- Sticky identity column with an active-section nav whose lines grow, and rows that dim their siblings on hover with a whole-row link (Brittany Chiang, bchiang7/v4).
- A cursor glow across the page plus a dot grid that lights up under the pointer.
- Short and long bio toggle (Lee Robinson).
- Logo chips inline in the bio (Anthony Fu).
- Role line with a text scramble effect (Hamish Williams).
- Number keys `1` to `6` jump between sections (Onur Şuyalçınkaya), plus a command palette on `⌘K` / `Ctrl K` or `/` with fuzzy search over sections, projects, roles and links. The palette doubles as the mobile menu.
- Live status card: Marrow's App Store version and the `marrow-mcp` PyPI release are fetched from the public iTunes and PyPI APIs on load, cached for 20 minutes, with static fallbacks.
- Marrow architecture diagram: HTML boxes with SVG wires measured and drawn at runtime and animated with the Web Animations API. Hover or focus a box to trace its connections.
- Light and dark themes that follow the system, with a toggle (`t`) that reveals through a View Transition.
- Project filters animated with View Transitions.
- Contact form through EmailJS, loaded only when the form is first used, with a honeypot field.
- Respects `prefers-reduced-motion`. Content is fully readable without JavaScript, and the page prints cleanly.

## Editing

Open `index.html` and change the text. Experience entries and project cards are plain HTML blocks, copy one to add another.
Anything with `data-cmdk="..."` shows up in the command palette automatically.

To preview locally:

```sh
python3 -m http.server 8000
```

Pushing to `main` deploys through GitHub Pages.
