import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page, context }) => {
  const request = page.request;
  await request.post("/api/demo/start", { data: {} });
  await request.post("/api/demo/reset");
  await context.addCookies([{ name: "dukaan-locale", value: "en", domain: "localhost", path: "/" }]);
});

test("customers require review, separate people deliberately, and retain archived ledgers", async ({ page }) => {
  const request = page.request;
  await page.goto("/shop/customers");
  await page.getByLabel("Language / Bhasha").selectOption("en");
  await page.getByLabel("Name", { exact: true }).fill("Counter customer");
  await page.getByLabel("Area or identifying note").fill("East lane");
  await page.getByRole("button", { name: "Review customer", exact: true }).click();
  expect((await (await request.get("/api/customers")).json()).customers.some((x: { name: string }) => x.name === "Counter customer")).toBe(false);
  await page.getByRole("button", { name: "Confirm customer", exact: true }).click();
  await expect(page.getByRole("link", { name: "Counter customer", exact: true })).toHaveCount(1);
  await page.getByLabel("Name", { exact: true }).fill("Counter customer");
  await page.getByLabel("Area or identifying note").fill("West lane");
  await page.getByLabel("These are different people. Keep separate ledgers.").check();
  await page.getByRole("button", { name: "Review customer", exact: true }).click();
  await page.getByRole("button", { name: "Confirm customer", exact: true }).click();
  await expect(page.getByRole("link", { name: "Counter customer", exact: true })).toHaveCount(2);
  const card = page.locator("article").filter({ hasText: "East lane" });
  const ledger = await card.getByRole("link").getAttribute("href");
  await card.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByRole("button", { name: "Confirm customer", exact: true }).click();
  await expect(card).toContainText("Archived");
  expect((await request.get(`/api/customers/${ledger!.split("/").pop()}`)).ok()).toBe(true);
});

test("inventory uses measured counts and reverses an out movement without erasing it", async ({ page }) => {
  const request = page.request;
  await page.goto("/shop/inventory");
  await page.getByLabel("Language / Bhasha").selectOption("en");
  await page.getByLabel("Item name", { exact: true }).fill("Measured rice");
  await page.getByRole("combobox", { name: "Unit (cannot change later)", exact: true }).selectOption("kg");
  await page.getByRole("button", { name: "Review item", exact: true }).click();
  await page.getByRole("button", { name: "Confirm stock", exact: true }).click();
  const item = (await (await request.get("/api/inventory")).json()).products[0];
  expect(item.onHandMinor).toBe(null);
  await page.getByRole("combobox", { name: "Item", exact: true }).selectOption(item.id);
  await page.getByLabel("Quantity (kg)", { exact: true }).fill("1.005");
  await page.getByLabel("Reason", { exact: true }).fill("Counted on shelf");
  await page.getByRole("button", { name: "Review movement", exact: true }).click();
  await expect(page.getByText("After: 1.005 kg", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Confirm stock", exact: true }).click();
  await page.getByRole("combobox", { name: "Movement", exact: true }).selectOption("out");
  await page.getByLabel("Quantity (kg)", { exact: true }).fill("0.005");
  await page.getByLabel("Reason", { exact: true }).fill("Sold at counter");
  await page.getByRole("button", { name: "Review movement", exact: true }).click();
  await page.getByRole("button", { name: "Confirm stock", exact: true }).click();
  await page.getByRole("button", { name: "View movements", exact: true }).click();
  await page.getByRole("button", { name: "Review reversal", exact: true }).click();
  await page.getByRole("button", { name: "Confirm stock", exact: true }).click();
  const products = (await (await request.get("/api/inventory")).json()).products;
  expect(products[0].onHandMinor).toBe(1005);
  expect((await (await request.get(`/api/inventory/${item.id}/movements`)).json()).movements).toHaveLength(3);
});
