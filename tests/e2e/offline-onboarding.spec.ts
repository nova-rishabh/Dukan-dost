import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ page, context }) => {
  const request = page.request;
  await request.post("/api/demo/start", { data: {} });
  await request.post("/api/demo/reset");
  await context.addCookies([{ name: "dukaan-locale", value: "en", domain: "localhost", path: "/" }]);
});
test("opt-in tab draft survives reload, requires explicit restoration and never submits offline", async ({ page, context }) => {
  let writes = 0;
  page.on("request", (request) => { if (request.method() === "POST" && /\/api\/(entries|interpret|remind)/.test(request.url())) writes++; });
  await page.goto("/shop");
  await page.locator("#typebox").fill("Fictional draft customer 100 credit");
  await page.getByText("Keep a typed draft in this tab", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Save this draft on this device", exact: true }).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByText("Draft saved in this tab. No ledger entry was recorded.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator("#typebox")).toHaveValue("");
  await page.getByText("Keep a typed draft in this tab", { exact: true }).click();
  await page.getByRole("button", { name: "Restore draft for review", exact: true }).click();
  await expect(page.locator("#typebox")).toHaveValue("Fictional draft customer 100 credit");
  expect(writes).toBe(0);
  await context.setOffline(true);
  await expect(page.getByText(/You are offline\. No ledger entry/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Write", exact: true })).toBeDisabled();
  await context.setOffline(false);
  await expect(page.getByText(/Connection returned\. Reload records/)).toBeVisible();
  expect(writes).toBe(0);
  await page.getByRole("button", { name: "Delete saved draft", exact: true }).click();
  expect(await page.evaluate(() => sessionStorage.getItem("dukaan-dost:typed-draft:v1"))).toBe(null);
});

test("an account-change broadcast clears typed text and saved draft in another open tab", async ({ page, context }) => {
  await page.goto("/shop");
  await page.locator("#typebox").fill("Private draft for previous account");
  await page.getByText("Keep a typed draft in this tab", { exact: true }).click();
  await page.getByRole("checkbox", { name: "Save this draft on this device", exact: true }).check();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("button", { name: "Restore draft for review", exact: true })).toBeVisible();
  const anotherTab = await context.newPage();
  await anotherTab.goto("/shop/start");
  await anotherTab.evaluate(() => { const channel = new BroadcastChannel("dukaan-dost:auth-change"); channel.postMessage("clear-draft"); channel.close(); });
  await expect(page.locator("#typebox")).toHaveValue("");
  expect(await page.evaluate(() => sessionStorage.getItem("dukaan-dost:typed-draft:v1"))).toBe(null);
  await anotherTab.close();
});

test("install manifest has actual icons and worker caches only public static help", async ({ page, request, context }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.start_url).toBe("/shop");
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) expect((await request.get(icon.src)).ok()).toBe(true);
  await page.goto("/shop");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.request.get("/api/summary");
  await page.goto("/shop/start");
  await expect(page.getByRole("heading", { name: "Start with one real task" })).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const stores = await Promise.all(names.map((name) => caches.open(name)));
    return (await Promise.all(stores.map((cache) => cache.keys()))).flat().map((req) => new URL(req.url).pathname);
  });
  expect(cached.sort()).toEqual(["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-maskable-512.png", "/offline.html"].sort());
  await context.setOffline(true);
  await page.goto("/shop/customers");
  await expect(page.getByRole("heading", { name: "Your connection is unavailable", exact: true })).toBeVisible();
  await expect(page.getByText("Private ledger records are not saved in the offline cache.", { exact: false })).toBeVisible();
  await context.setOffline(false);
});
