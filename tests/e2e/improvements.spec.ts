import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("customer search recovers from no matches and balance filters agree with API", async ({ page }) => {
  const { customers } = await (await page.request.get("/api/customers")).json();
  await page.goto("/shop");
  await expect(page.getByTestId("summary")).toBeVisible();
  await page.getByLabel("Customer dhoondo").fill("no-such-customer-xyz");
  await expect(page.getByText("Is khoj mein koi customer nahi mila.")).toBeVisible();
  await page.getByRole("button", { name: "Sab dikhao", exact: true }).click();
  for (const [filter, count] of [
    ["owed", customers.filter((c: { balancePaise: number }) => c.balancePaise > 0).length],
    ["settled", customers.filter((c: { balancePaise: number }) => c.balancePaise === 0).length],
    ["advance", customers.filter((c: { balancePaise: number }) => c.balancePaise < 0).length],
  ] as const) {
    await page.getByLabel("Khata dikhao").selectOption(filter);
    await expect(page.getByText(`${count} customer mile`, { exact: true })).toBeVisible();
  }
  await page.getByLabel("Khata dikhao").selectOption("all");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/screenshots/khata-search-390.png", fullPage: true });
});

test("stock resolution failure keeps the note and permits retry", async ({ page }) => {
  await page.goto("/shop");
  await page.locator("#typebox").fill("Atta kam hai");
  await page.getByRole("button", { name: "Likho", exact: true }).click();
  await page.getByTestId("likh-do").click();
  const note = page.getByTestId("low-stock").getByRole("listitem").filter({ hasText: "Atta" }).first();
  await expect(note).toBeVisible();
  await page.route("**/api/stock/*/resolve", (route) => route.abort());
  await note.getByRole("button", { name: "Mangwa liya" }).click();
  await expect(page.getByText("Note nahi hata. Dobara Mangwa liya dabao.")).toBeVisible();
  await expect(note).toBeVisible();
  await page.unroute("**/api/stock/*/resolve");
  await note.getByRole("button", { name: "Mangwa liya" }).click();
  await expect(note).toHaveCount(0);
});

test("failed customer load offers retry and recovers", async ({ page }) => {
  const { customers } = await (await page.request.get("/api/customers")).json();
  const url = `**/api/customers/${customers[0].id}`;
  await page.route(url, (route) => route.abort());
  await page.goto(`/shop/${customers[0].id}`);
  await expect(page.getByRole("heading", { name: "Khata nahi khula" })).toBeVisible();
  await page.unroute(url);
  await page.getByRole("button", { name: "Dobara kholo" }).click();
  await expect(page.getByTestId("bahi")).toBeVisible();
});

test("failed shop load can recover without reload", async ({ page }) => {
  await page.route("**/api/summary", (route) => route.abort());
  await page.goto("/shop");
  await expect(page.getByRole("alert").filter({ hasText: "Hisaab nahi khula" })).toContainText("Hisaab nahi khula");
  await page.unroute("**/api/summary");
  await page.getByRole("button", { name: "Dobara kholo" }).click();
  await expect(page.getByTestId("summary")).toBeVisible();
});

for (const path of ["help", "settings"]) {
  test(`${path}: mobile accessibility and navigation`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/shop/${path}`);
    if (path === "settings") await expect(page.getByTestId("data-panel")).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `docs/screenshots/${path}-390.png`, fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: `docs/screenshots/${path}-1440.png`, fullPage: true });
    await page.getByRole("link", { name: "Khata par wapas", exact: true }).click();
    await expect(page.getByTestId("summary")).toBeVisible();
  });
}

test("mic permission requests are guarded and late permission is released after cancellation", async ({ page }) => {
  await page.goto("/shop");
  await page.evaluate(() => {
    const state = { calls: 0, stopped: 0, resolve: (() => {}) as () => void };
    Object.assign(window, { micTest: state });
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", { configurable: true, value: () => {
      state.calls++;
      return new Promise((resolve) => { state.resolve = () => resolve({ getTracks: () => [{ stop: () => { state.stopped++; } }] }); });
    } });
  });
  await page.getByTestId("bolo").click();
  await page.getByTestId("bolo").click();
  await page.getByTestId("bolo").dispatchEvent("pointercancel");
  const result = await page.evaluate(async () => {
    const state = (window as unknown as { micTest: { calls: number; stopped: number; resolve: () => void } }).micTest;
    state.resolve();
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { calls: state.calls, stopped: state.stopped };
  });
  expect(result).toEqual({ calls: 1, stopped: 1 });
});
