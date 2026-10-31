import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ request }) => {
  await request.post("/api/demo/reset");
});

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}

test("axe: landing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("parchi")).toBeVisible();
  await page.waitForTimeout(1800);
  await audit(page);
});

test("axe: shop home", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByTestId("summary")).toBeVisible();
  await audit(page);
});

test("axe: customer page", async ({ page }) => {
  const list = await (await page.request.get("/api/customers")).json();
  await page.goto(`/shop/${list.customers[0].id}`);
  await expect(page.getByTestId("bahi")).toBeVisible();
  await audit(page);
});

test("axe: pay page", async ({ page }) => {
  const list = await (await page.request.get("/api/customers")).json();
  const rem = await (await page.request.post("/api/remind", { data: { customerId: list.customers[0].id } })).json();
  await page.goto(new URL(rem.payUrl).pathname);
  await expect(page.getByTestId("pay-qr")).toBeVisible();
  await audit(page);
});

test("axe: /try", async ({ page }) => {
  await page.goto("/try");
  await page.getByTestId("clip-sharma").click();
  await expect(page.getByTestId("parchi")).toBeVisible();
  await audit(page);
});
