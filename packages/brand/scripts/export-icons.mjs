import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { launch } from "puppeteer";
import JSZip from "jszip";
import pngToIco from "png-to-ico";

const __dirname = dirname(fileURLToPath(import.meta.url));
const brandRoot = resolve(__dirname, "..");
const distDir = resolve(brandRoot, "dist/icons");
const conceptSvgPath = resolve(brandRoot, "logo-concept.svg");

const SIZES = [64, 128, 192, 256, 512];

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function renderIcons() {
  const svgMarkup = await readFile(conceptSvgPath, "utf-8");
  const browser = await launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent;display:flex;align-items:center;justify-content:center;">${svgMarkup}</body></html>`, {
      waitUntil: "networkidle0",
    });

    const element = await page.$("svg");
    if (!element) {
      throw new Error("Unable to locate SVG element in concept artwork");
    }

    const zip = new JSZip();
    const pngBuffers = [];

    for (const size of SIZES) {
      await page.setViewport({ width: size, height: size, deviceScaleFactor: 2 });
      const buffer = await element.screenshot({ omitBackground: true });
      const filename = `icon-${size}.png`;
      pngBuffers.push(buffer);
      zip.file(filename, buffer);
      await writeFile(join(distDir, filename), buffer);
    }

    const icoBuffer = await pngToIco(pngBuffers.filter((_, index) => index >= 1));
    await writeFile(join(distDir, "app.ico"), icoBuffer);
    zip.file("app.ico", icoBuffer);

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    await writeFile(join(distDir, "icons.zip"), zipBuffer);
  } finally {
    await browser.close();
  }
}

(async () => {
  await ensureDir(distDir);
  await renderIcons();
  console.log(`Icons exported to ${distDir}`);
})();
