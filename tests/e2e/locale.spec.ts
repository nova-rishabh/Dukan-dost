import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("English mode persists on reload and does not translate input", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: {
    ok: true, authRequired: true, setupNeeded: false, loggedIn: false, owner: null, waLogin: true, isDemoShop: false, shopName: null,
  } }));
  await page.goto("/login");
  await page.getByLabel("Language / Bhasha", { exact: true }).selectOption("en");
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByTestId("language-scope")).toContainText("Your original entries stay as entered");
  await page.getByLabel("Password", { exact: true }).fill("दुकान का पासवर्ड");
  await page.getByLabel("Language / Bhasha", { exact: true }).selectOption("hi-Latn");
  await expect(page.getByLabel("Passcode", { exact: true })).toHaveValue("दुकान का पासवर्ड");
  await page.getByLabel("Language / Bhasha", { exact: true }).selectOption("en");
  await expect(page.getByLabel("Password", { exact: true })).toHaveValue("दुकान का पासवर्ड");
  await page.reload();
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect((await page.context().cookies()).find((cookie) => cookie.name === "dukaan-locale")?.value).toBe("en");
  await expect(page.getByText("Only the shop owner can sign in.")).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "docs/screenshots/english-login-390.png", fullPage: true });
});

test("English ledger keeps Hindi evidence and confirms amounts, direction and stamp in English", async ({ page, request }) => {
  expect((await request.post("/api/demo/reset")).ok()).toBeTruthy();
  await page.goto("/shop");
  await page.getByLabel("Language / Bhasha", { exact: true }).selectOption("en");
  await expect(page.getByRole("heading", { name: "Total outstanding" })).toBeVisible();
  for (const name of ["Dashboard", "Customers", "Inventory"]) await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
  const evidence = "Gupta ji ne 500 rupaye udhaar liye";
  await page.getByLabel("Type here", { exact: true }).fill(evidence);
  await page.getByRole("button", { name: "Write", exact: true }).click();
  const card = page.getByTestId("parchi");
  await expect(card.getByTestId("echo")).toContainText(evidence);
  await expect(card.getByTestId("amount-hi")).toHaveText("five hundred rupees");
  await expect(card.getByTestId("amount-hi")).toHaveAttribute("lang", "en");
  await expect(card.getByTestId("direction-line")).toHaveText("Credit given to Gupta ji");
  await card.getByRole("button", { name: "Record entry", exact: true }).click();
  await expect(card.getByTestId("stamp")).toHaveAccessibleName("Recorded");
  await expect(page.getByTestId("toast")).toContainText("Recorded:");
  const list = await (await request.get("/api/customers")).json();
  const customer = list.customers.find((c: { name: string }) => c.name === "Gupta ji");
  const ledger = await (await request.get(`/api/customers/${customer.id}`)).json();
  expect(ledger.entries.some((e: { sourceText: string }) => e.sourceText === evidence)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("English reminder drafts and pay pages retain review and payment honesty", async ({ page, request }) => {
  expect((await request.post("/api/demo/reset")).ok()).toBeTruthy();
  const list = await (await request.get("/api/customers")).json();
  const customer = list.customers.find((c: { name: string }) => c.name === "Gupta ji");
  await page.goto(`/shop/${customer.id}`);
  await page.getByLabel("Language / Bhasha", { exact: true }).selectOption("en");
  await page.getByRole("button", { name: "Send reminder", exact: true }).click();
  await expect(page.getByTestId("remind-text")).toHaveValue(/Hello Gupta ji,.*outstanding balance is ₹1,200/);
  const edited = "नमस्ते Gupta ji, please check your balance.";
  await page.getByTestId("remind-text").fill(edited);
  await expect(page.getByTestId("wa-open")).toHaveAttribute("href", `https://wa.me/?text=${encodeURIComponent(edited)}`);
  await page.getByRole("button", { name: "Close", exact: true }).click();
  const draft = await (await request.post("/api/remind", { data: { customerId: customer.id, locale: "en" } })).json();
  await page.goto(new URL(draft.payUrl).pathname);
  await expect(page.getByTestId("pay-amount")).toHaveText("₹1,200");
  await expect(page.getByTestId("pay-button")).toHaveText("Pay with any UPI app");
  await expect(page.getByTestId("demo-banner")).toHaveText("Demo: no money is transferred here");
  await page.goto("/pay/this-token-does-not-exist-123");
  await expect(page.getByRole("heading", { name: "This link is invalid" })).toBeVisible();
});
