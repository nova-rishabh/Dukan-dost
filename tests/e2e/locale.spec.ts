import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("English account preview persists on reload and does not translate input", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: {
    ok: true, authRequired: true, setupNeeded: false, loggedIn: false, owner: null, waLogin: true, isDemoShop: false, shopName: null,
  } }));
  await page.goto("/login");
  await page.getByLabel("Language / Bhasha", { exact: true }).selectOption("en");
  await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
  await expect(page.getByTestId("language-scope")).toContainText("preview");
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
