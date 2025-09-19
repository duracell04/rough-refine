# @roughrefine/brand

Shared brand assets for the RoughRefine web application. The package ships the SVG concept artwork, a reusable sprite, and an export script powered by `@resvg/resvg-js` that rasterises the refined mark for PWA icons.

## Usage

```ts
import sprite from "@roughrefine/brand/logo-sprite.svg?raw";
```

Embed the sprite once near the root of the DOM and reference the symbols with `<use href="#rr-mark" />`.

The concept illustration can be imported as raw markup for marketing surfaces such as the About dialog.

## Icon exports

The `export-icons.mjs` script renders the refined icon SVG at 192px and 512px and writes them into `apps/web/public/icons` for consumption by the web manifest.

```bash
pnpm --filter @roughrefine/brand exec node scripts/export-icons.mjs
```

The script requires `@resvg/resvg-js`, installed as a dev dependency of this package.
