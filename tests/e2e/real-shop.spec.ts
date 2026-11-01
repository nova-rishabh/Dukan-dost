import { expect, test } from "@playwright/test";

const REAL = "http://localhost:3102";
test.use({ baseURL: REAL, viewport: { width: 390, height: 844 } });

test("a real shop on SQLite: write an entry, then erase everything with the typed phrase", async ({ page, request }) => {
  const made = await request.post("/api/customers", { data: { name: "Raju" } });
  expect(made.ok()).toBeTruthy();

  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: "Test Dukaan" })).toBeVisible();
  await page.locator("#typebox").fill("Raju ko 100 udhaar diye");
  await page.getByRole("button", { name: "Likho" }).click();
  await page.getByTestId("likh-do").click();
  await expect(page.getByTestId("stamp")).toBeVisible();
  await expect(page.locator('[data-paise="10000"]').first()).toBeVisible();

  await expect(page.getByTestId("retention-note")).toContainText("30 din");
  await page.getByTestId("erase-open").click();
  const confirm = page.getByTestId("erase-confirm");
  await expect(confirm).toBeDisabled();
  await page.getByTestId("erase-phrase").fill("haan");
  await expect(confirm).toBeDisabled();
  await page.getByTestId("erase-phrase").fill("sab hata do");
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.getByText("Data hata diya.")).toBeVisible();
  await expect(page.locator('[data-paise="0"]').first()).toBeVisible();
  const list = await (await request.get("/api/customers")).json();
  expect(list.customers).toEqual([]);
});

test("the real shop keeps debug and demo reset closed", async ({ request }) => {
  expect((await request.get("/api/debug")).status()).toBe(403);
  expect((await request.post("/api/demo/reset")).status()).toBe(403);
});
