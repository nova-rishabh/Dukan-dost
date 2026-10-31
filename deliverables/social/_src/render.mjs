import { chromium } from "../../../node_modules/@playwright/test/index.mjs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const here = path.dirname(fileURLToPath(import.meta.url));
const names = ["post-1-ne-ya-ko", "post-2-bahi-vs-bolo", "post-3-vasooli-politely"];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const n of names) {
  await page.goto(pathToFileURL(path.join(here, n + ".html")).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(here, "..", n + ".png") });
  console.log("rendered", n);
}
await browser.close();
