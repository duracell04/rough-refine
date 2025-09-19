# RoughRefine

**Sketch fast. Refine precisely. Export clean SVG.**

RoughRefine is a **local-first SVG editor** that runs as a **pure web app (Vite + React PWA)**. It focuses on a calm, reliable flow: **Draw → Align → Export SVG**. No cloud, no accounts — everything runs locally in your browser and can be installed as a PWA for offline use.

## Why RoughRefine?
- **Local-first & offline:** Works without internet after first load.
- **Clean SVG output:** Pipeline-safe SVG for dev/design handoffs.
- **Intentionally simple:** Core shapes, snapping, alignment, export — without heavyweight panels.

## Core features (v1)
- **Shapes:** rect, ellipse, line, polygon, path (Pen/Bezier), text, group.
- **Snapping:** bbox edges & centers; Shift locks to 0°/90°.
- **Layout:** Align & Distribute (H/V), z-order, group/ungroup.
- **Styling:** Solid fill, stroke width/dash/opacity, non-scaling strokes toggle.
- **Import/Export:** Import SVG (groups & transforms preserved). Export **SVG** (pretty or SVGO “Production”) and **PNG** (1×/2×).
- **Persistence:** Local autosave (IndexedDB), `.rrproj` (zip: `scene.json` + `/assets`).
- **PWA:** Installable, offline-capable.

> Not in v1: booleans, gradients, filters, rulers, PDF export, plugins, version graph UI.

## Getting started

```bash
git clone https://github.com/duracell04/rough-refine.git
cd rough-refine
pnpm install
pnpm dev      # open the printed localhost URL
pnpm build && pnpm preview
```

## Project structure

```
apps/
  web/                # Vite + React PWA (the app)

packages/
  core/               # canonical scene & command bus (reducers + undo/redo)
  svg-renderer/       # authoritative SVG renderer (selection overlays, hit-test)
  ui/                 # Toolbar, Inspector, ContextBar, Header, About
  persistence/        # IndexedDB autosave, .rrproj I/O
  brand/              # logo-concept.svg, icon-refine.svg, export-icons.mjs
```

## Tech stack

React + TypeScript, Vite, (Zustand or Redux Toolkit), SVGO, JSZip
Vitest (unit), Playwright (E2E)
VitePWA or custom Service Worker for offline

## License

MIT
