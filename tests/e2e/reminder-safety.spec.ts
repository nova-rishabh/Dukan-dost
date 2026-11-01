import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.route("**/api/wa/status", (route) => route.fulfill({ json: { ok: true, configured: true, reachable: true, whatsapp: "CONNECTED", adminUrl: null } }));
  const { customers } = await (await request.get("/api/customers")).json();
  await page.goto(`/shop/${customers.find((c: { balancePaise: number }) => c.balancePaise > 0).id}`);
  await page.getByRole("button", { name: "Yaad dilao", exact: true }).click();
  await expect(page.getByTestId("remind-text")).not.toHaveValue("");
  await page.getByTestId("remind-phone").fill(`+91${["70000", "00077"].join("")}`);
});

test("changed balance requires a new draft and explicit confirmation", async ({ page }) => {
  await page.route("**/api/remind/send", (route) => route.fulfill({ status: 409, json: { ok: false, error: { code: "draft_stale", message: "Balance changed", hint: "Khata badal gaya. Naya message banao." } } }));
  const oldText = await page.getByTestId("remind-text").inputValue();
  await page.getByTestId("remind-send").click();
  await page.getByTestId("remind-send-confirm").click();
  await expect(page.getByTestId("remind-send")).toBeDisabled();
  await page.getByTestId("remind-refresh").click();
  await expect(page.getByTestId("remind-text")).not.toHaveValue(oldText);
  await expect(page.getByTestId("remind-send")).toBeEnabled();
  await expect(page.getByTestId("remind-send-confirm")).toHaveCount(0);
});

test("uncertain delivery blocks automatic resend and WhatsApp fallback", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/remind/send", (route) => { calls++; return route.abort(); });
  await page.getByTestId("remind-send").click();
  await page.getByTestId("remind-send-confirm").click();
  await expect(page.getByText(/Message gaya ya nahi, pakka nahi hai/)).toBeVisible();
  await expect(page.getByTestId("remind-send")).toBeDisabled();
  await expect(page.getByTestId("wa-open")).not.toHaveAttribute("href");
  await expect(page.getByTestId("remind-refresh")).toHaveCount(0);
  expect(calls).toBe(1);
});

for (const response of [
  { name: "server failure after send", status: 500, json: { ok: false, error: { code: "internal", message: "Persistence failed", hint: "Try later" } } },
  { name: "malformed delivery result", status: 200, json: { ok: true } },
]) {
  test(`${response.name} locks resend and manual fallback`, async ({ page }) => {
    await page.route("**/api/remind/send", (route) => route.fulfill({ status: response.status, json: response.json }));
    await page.getByTestId("remind-send").click();
    await page.getByTestId("remind-send-confirm").click();
    await expect(page.getByText(/Message gaya ya nahi, pakka nahi hai/)).toBeVisible();
    await expect(page.getByTestId("remind-send")).toBeDisabled();
    await expect(page.getByTestId("wa-open")).not.toHaveAttribute("href");
    await expect(page.getByTestId("remind-refresh")).toHaveCount(0);
  });
}
