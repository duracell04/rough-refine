import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandRoot = resolve(__dirname, "..");
const iconSvgPath = resolve(brandRoot, "icon-refine.svg");
const outputDir = resolve(brandRoot, "../../apps/web/public/icons");

const SIZES = [192, 512];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function renderIcons() {
  const svgMarkup = await readFile(iconSvgPath, "utf-8");

  for (const size of SIZES) {
    const renderer = new Resvg(svgMarkup, {
      fitTo: {
        mode: "width",
        value: size,
      },
      background: "rgba(0,0,0,0)",
    });

    const pngData = renderer.render();
    const filename = `icon-${size}.png`;
    await writeFile(join(outputDir, filename), pngData.asPng());
  }
}

(async () => {
  await ensureDir(outputDir);
  await renderIcons();
  console.log(`Generated PWA icons in ${outputDir}`);
})();
