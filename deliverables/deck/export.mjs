import { chromium } from "../../node_modules/@playwright/test/index.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const here = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(path.join(here, "index.html")).href);
await page.evaluate(() => document.fonts.ready);
// per-slide screenshots for visual checking (scratch folder, not a deliverable)
const n = await page.locator("section.slide").count();
console.log("slides", n);
if (process.argv[2]) {
  for (let i = 0; i < n; i++) {
    await page.screenshot({ path: path.join(process.argv[2], `slide-${i + 1}.png`) });
    await page.keyboard.press("ArrowRight");
  }
}
await page.emulateMedia({ media: "print" });
await page.pdf({ path: path.join(here, "deck.pdf"), printBackground: true, preferCSSPageSize: true });
await browser.close();
