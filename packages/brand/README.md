# @roughrefine/brand

Shared brand assets for the RoughRefine applications. The package ships the SVG concept artwork, a reusable sprite, and a Puppeteer export script that rasterises the mark for Electron and PWA entry points.

## Usage

```ts
import sprite from "@roughrefine/brand/logo-sprite.svg?raw";
```

Embed the sprite once near the root of the DOM and reference the symbols with `<use href="#rr-mark" />`.

The concept illustration can be imported as raw markup for marketing surfaces such as the About dialog.

## Icon exports

The `export-icons.mjs` script renders the concept SVG at multiple sizes and writes them into `packages/brand/dist/icons` for consumption by Electron and the web manifest.

```bash
node packages/brand/scripts/export-icons.mjs
```

The script requires `puppeteer` and `jszip` which are installed as dev dependencies in the workspace.
