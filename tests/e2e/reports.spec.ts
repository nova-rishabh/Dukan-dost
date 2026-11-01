import { expect, test } from "@playwright/test";
import { openMenu, setLanguage } from "./helpers";

test.use({ viewport: { width: 390, height: 844 } });
test.beforeEach(async ({ request, context }) => {
  await request.post("/api/demo/reset");
  await context.addCookies([{ name: "dukaan-locale", value: "en", domain: "localhost", path: "/" }]);
});

test("dashboard totals reconcile with statements and CSV is downloadable", async ({ page, request }) => {
  const dashboard = await (await request.get("/api/dashboard")).json();
  const customers = (await (await request.get("/api/customers")).json()).customers;
  let outstanding = 0;
  let advances = 0;
  for (const customer of customers) {
    const response = await request.get(`/api/customers/${customer.id}/statement`);
    expect(response.ok()).toBe(true);
    const statement = await response.json();
    expect(statement.closingPaise).toBe(customer.balancePaise);
    outstanding += Math.max(0, statement.currentPaise);
    advances += Math.max(0, -statement.currentPaise);
  }
  expect(dashboard.outstandingPaise).toBe(outstanding);
  expect(dashboard.advancesPaise).toBe(advances);
  await page.goto("/shop/dashboard");
  await setLanguage(page, "en");
  await expect(page.getByRole("heading", { name: "Shop dashboard" })).toBeVisible();
  await openMenu(page);
  const currentNav = page.getByRole("link", { name: "Dashboard", exact: true });
  await expect(currentNav).toHaveAttribute("aria-current", "page");
  await expect(currentNav).toHaveCSS("background-color", "rgb(22, 18, 58)");
  await expect(currentNav).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(page.getByText("Outstanding now", { exact: true })).toBeVisible();
  await page.screenshot({ path: ".goal/screenshots/dashboard-390.png", fullPage: true });
  await page.goto(`/shop/${customers[0].id}/statement`);
  await expect(page.getByRole("button", { name: "Print / Save PDF" })).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await page.screenshot({ path: ".goal/screenshots/statement-390.png", fullPage: true });
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download CSV" }).click();
  expect((await downloadEvent).suggestedFilename()).toBe("customer-statement.csv");
  await page.getByLabel("From recorded date").fill("2026-11-01");
  await page.getByLabel("To recorded date").fill("2026-11-01");
  await page.getByRole("button", { name: "Apply dates" }).click();
  await expect(page.getByText("Applied period: 2026-11-01 — 2026-11-01", { exact: true })).toBeVisible();
  expect((await request.get("/api/dashboard?from=2026-02-30")).status()).toBe(400);
  expect((await request.get("/api/customers/nonexistent/statement")).status()).toBe(404);
});
