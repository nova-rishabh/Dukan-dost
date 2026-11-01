import { expect, test } from "@playwright/test";

const mobile = ["70000", "00001"].join("");

const loggedOut = {
  ok: true, authRequired: true, setupNeeded: false, loggedIn: false, owner: null,
  waLogin: true, isDemoShop: false, shopName: "Fictional shop",
};

test("initial login fetch failure is visible and retries without reloading", async ({ page }) => {
  await page.route("**/api/auth/me", (route) => route.abort());
  await page.goto("/login");
  await expect(page.getByTestId("login-load-error")).toBeVisible();
  await page.unroute("**/api/auth/me");
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: loggedOut }));
  await page.getByRole("button", { name: "Dobara kholo" }).click();
  await expect(page.getByLabel("Mobile number", { exact: true })).toBeVisible();
  await expect(page.getByTestId("login-load-error")).toHaveCount(0);
});

test("CAPTCHA failure stops fetching until explicit retry and preserves the mobile", async ({ page }) => {
  await page.route("**/api/auth/me", (route) => route.fulfill({ json: loggedOut }));
  let calls = 0;
  await page.route("**/api/auth/wa/captcha", (route) => {
    calls++;
    return route.fulfill({ status: 503, json: { ok: false, error: { code: "wa_unavailable", message: "Unavailable", hint: "Photo nahi aaya. Dobara try karo." } } });
  });
  await page.goto("/login");
  await page.getByLabel("Mobile number", { exact: true }).fill(mobile);
  await page.getByTestId("mode-whatsapp").click();
  await expect(page.getByTestId("captcha-error")).toBeVisible();
  await page.waitForTimeout(300);
  expect(calls).toBe(1);
  await expect(page.getByTestId("wa-send")).toBeDisabled();
  await expect(page.getByLabel("Mobile number (jis par WhatsApp hai)")).toHaveValue(mobile);
  await page.unroute("**/api/auth/wa/captcha");
  await page.route("**/api/auth/wa/captcha", (route) => route.fulfill({ json: { ok: true, captchaId: "fictional", svg: '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="60"><text x="10" y="30">DEMO</text></svg>' } }));
  await page.getByRole("button", { name: "Naya photo" }).click();
  await expect(page.getByTestId("wa-captcha")).toBeVisible();
  await expect(page.getByTestId("captcha-error")).toHaveCount(0);
  await page.getByRole("button", { name: "Passcode se", exact: true }).click();
  await expect(page.getByLabel("Mobile number", { exact: true })).toHaveValue(mobile);
});
