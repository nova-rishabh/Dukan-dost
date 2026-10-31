// Records real captures of the running app (http://localhost:3200) for shots 3-6.
// Playwright's recordVideo ignores deviceScaleFactor (content lands at 1x in a grey frame), so frames come from a
// CDP screencast at 2x and are resampled to 20 fps image sequences with ffmpeg.
// Usage (project root, server already running): node deliverables/ad/capture/capture.mjs
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const BASE = "http://localhost:3200";
const OUT = path.resolve("deliverables/ad/assets/captures");
const RAW = path.join(OUT, "_frames");
rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

const events = {};
const browser = await chromium.launch();
await fetch(`${BASE}/api/demo/reset`, { method: "POST" });

async function flow(name, fn) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "light" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const frames = [];
  cdp.on("Page.screencastFrame", async (f) => {
    frames.push({ ts: f.metadata.timestamp, data: f.data });
    await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
  const marks = {};
  const mark = (k) => (marks[k] = Date.now() / 1000);
  await fn(page, mark);
  await page.waitForTimeout(600);
  await cdp.send("Page.stopScreencast");
  await ctx.close();
  const t0 = frames[0].ts;
  const dir = path.join(RAW, name);
  mkdirSync(dir, { recursive: true });
  frames.forEach((f, i) => writeFileSync(path.join(dir, `${String(i).padStart(5, "0")}.jpg`), Buffer.from(f.data, "base64")));
  writeFileSync(path.join(dir, "ts.json"), JSON.stringify(frames.map((f) => f.ts - t0)));
  for (const [k, v] of Object.entries(marks)) events[`${name}.${k}`] = +(v - t0).toFixed(3);
  events[`${name}.frames`] = frames.length;
  events[`${name}.lastFrame`] = +(frames.at(-1).ts - t0).toFixed(3);
  return { dir, ts: frames.map((f) => f.ts - t0) };
}

/** Resample the screencast to a constant fps sequence: window [t0, t0+dur], scaled to w x (w*1688/780), cropped to w x h at y. */
function sequence({ dir, ts }, outName, t0, dur, fps, w, h, y) {
  const out = path.join(OUT, outName);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const lines = ["ffconcat version 1.0"];
  const n = Math.round(dur * fps);
  for (let i = 0; i < n; i++) {
    const t = t0 + i / fps;
    let k = 0;
    while (k + 1 < ts.length && ts[k + 1] <= t) k++;
    lines.push(`file '${path.join(dir, String(k).padStart(5, "0") + ".jpg").replaceAll("\\", "/")}'`, `duration ${1 / fps}`);
  }
  const list = path.join(dir, `${outName}.ffconcat`);
  writeFileSync(list, lines.join("\n"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-safe", "0", "-f", "concat", "-i", list, "-vf", `fps=${fps},scale=${w}:${Math.round((w * 1688) / 780)}:flags=lanczos,unsharp=5:5:0.9,crop=${w}:${h}:0:${y}`, "-q:v", "3", path.join(out, "f%03d.jpg")]);
  console.log(outName, readdirSync(out).length, "frames");
}

const writeFlow = await flow("write", async (page, mark) => {
  await page.goto(`${BASE}/shop`);
  await page.getByTestId("summary").waitFor();
  await page.waitForTimeout(900);
  mark("typeStart");
  await page.locator("#typebox").click();
  await page.locator("#typebox").pressSequentially("Amit Sharma ne 500 rupaye udhaar liye", { delay: 55 });
  await page.waitForTimeout(500);
  mark("likhoClick");
  await page.getByRole("button", { name: "Likho" }).click();
  await page.getByTestId("parchi").waitFor();
  mark("parchiShown");
  await page.waitForTimeout(500);
  await page.getByTestId("result").evaluate((el) => el.scrollIntoView({ block: "start", behavior: "smooth" }));
  mark("scrolled");
  await page.waitForTimeout(2400);
  await page.getByTestId("parchi").screenshot({ path: path.join(OUT, "parchi-before.png") });
  await page.screenshot({ path: path.join(OUT, "parchi-before-page.png") });
  mark("likhDoClick");
  await page.getByTestId("likh-do").click();
  await page.getByTestId("stamp").waitFor();
  mark("stampVisible");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, "parchi-stamped.png") });
  await page.getByTestId("parchi").screenshot({ path: path.join(OUT, "parchi-after.png") });
  // Same real post-write parchi with the stamp hidden: the composition draws its own slam of the identical stamp.
  await page.addStyleTag({ content: '[data-testid="stamp"]{visibility:hidden}' });
  await page.getByTestId("parchi").screenshot({ path: path.join(OUT, "parchi-after-nostamp.png") });
});

const custFlow = await flow("customer", async (page, mark) => {
  const list = await (await fetch(`${BASE}/api/customers`)).json();
  const amit = list.customers.find((c) => c.name === "Amit Sharma");
  await page.goto(`${BASE}/shop/${amit.id}`);
  mark("loaded");
  await page.addStyleTag({ content: "dialog{color:#16123A}" }); // headless Chromium here resolves dialog CanvasText to grey; force the design token
  await page.getByTestId("bahi").waitFor();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(OUT, "customer.png") });
  mark("yaadClick");
  await page.getByRole("button", { name: "Yaad dilao" }).click();
  await page.getByTestId("remind-text").waitFor();
  mark("sheetShown");
  await page.waitForTimeout(3800);
  await page.screenshot({ path: path.join(OUT, "reminder.png") });
  writeFileSync(path.join(OUT, "reminder-text.txt"), await page.getByTestId("remind-text").inputValue());
});
await browser.close();

const t0w = events["write.typeStart"] - 0.13;
sequence(writeFlow, "seq3", t0w, 5.5, 20, 900, 880, 485);
const t0c = Math.max(0, events["customer.loaded"] - 0.05);
sequence(custFlow, "seq5", t0c, 5.6, 20, 720, 660, 420);
events["write.seqStart"] = +t0w.toFixed(3);
events["customer.seqStart"] = +t0c.toFixed(3);
writeFileSync(path.join(OUT, "events.json"), JSON.stringify(events, null, 2));
console.log(events);
