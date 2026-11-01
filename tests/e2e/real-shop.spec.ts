import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * A real (non-demo) shop on an in-memory SQLite database with the real WA-USERAUTH daemon code behind it.
 * The tests share one server, so they run in order: setup, write, send, logout, both logins, erase.
 */
const WA = "http://127.0.0.1:3201";
const TEN = ["70000", "00001"].join("");
const CUSTOMER = `+91${["70000", "00077"].join("")}`;
const PASS = "kirana-khata-2026";

test.use({ baseURL: "http://localhost:3102", viewport: { width: 390, height: 844 } });
test.describe.configure({ mode: "serial" });

/** each test gets a fresh browser context, so sign in again the way the login form does */
async function signIn(page: Page) {
  const r = await page.request.post("/api/auth/login", { data: { mobile: TEN, passcode: PASS } });
  expect(r.ok()).toBeTruthy();
}

async function audit(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
}

test("a real shop refuses everything until it is set up, and sends visitors to setup", async ({ page, request }) => {
  const r = await request.get("/api/summary");
  expect(r.status()).toBe(401);
  expect((await r.json()).error.code).toBe("setup_required");
  await page.goto("/shop");
  await expect(page).toHaveURL(/\/setup$/);
  await expect(page.getByRole("heading", { name: "Dukaan set karo" })).toBeVisible();
  await audit(page);
});

test("setup: a wrong code is refused, the right one creates the owner and signs them in", async ({ page }) => {
  await page.goto("/setup");
  await page.getByTestId("setup-shop").fill("Test Dukaan");
  await page.getByTestId("setup-name").fill("Ramesh");
  await page.getByTestId("setup-mobile").fill(TEN);
  await page.getByTestId("setup-passcode").fill(PASS);
  await page.getByTestId("setup-again").fill(PASS);
  await page.getByTestId("setup-code").fill("wrong-code");
  await page.getByTestId("setup-submit").click();
  await expect(page.getByTestId("setup-error")).toContainText("Setup code galat");
  await page.getByTestId("setup-code").fill("e2e-setup-code");
  await page.getByTestId("setup-submit").click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByRole("heading", { name: "Test Dukaan" })).toBeVisible();
  await expect(page.getByTestId("logout")).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByTestId("retention-note")).toContainText("30 din");
  await expect(page.getByTestId("wa-status")).toHaveText("WhatsApp jura hua hai");
});

test("the signed-in owner writes an entry and sends the reminder through WhatsApp after confirming", async ({ page, request }) => {
  await signIn(page);
  await page.goto("/shop");
  await page.request.post("/api/customers", { data: { name: "Raju" } });
  await page.locator("#typebox").fill("Raju ko 250 udhaar diye");
  await page.getByRole("button", { name: "Likho" }).click();
  await page.getByTestId("likh-do").click();
  await expect(page.getByTestId("stamp")).toBeVisible();

  const list = await (await page.request.get("/api/customers")).json();
  const raju = list.customers.find((c: { name: string }) => c.name === "Raju");
  await page.goto(`/shop/${raju.id}`);
  await page.getByRole("button", { name: "Yaad dilao" }).click();
  await expect(page.getByTestId("remind-text")).toHaveValue(/Namaste Raju ji/);
  await expect(page.getByTestId("remind-send")).toBeDisabled();
  await page.getByTestId("remind-phone").fill(CUSTOMER);
  await page.getByTestId("remind-send").click();
  // nothing has been sent yet: it waits for an explicit "Haan, bhejo"
  expect((await (await request.get(`${WA}/__test/sent`)).json()).sent).toHaveLength(0);
  await page.getByTestId("remind-send-confirm").click();
  await expect(page.getByTestId("remind-result")).toContainText("Bhej diya");
  const sent = (await (await request.get(`${WA}/__test/sent`)).json()).sent as Array<{ to: string; text: string }>;
  expect(sent).toHaveLength(1);
  expect(sent[0].to).toBe(CUSTOMER);
  expect(sent[0].text).toContain("Namaste Raju ji");
  expect(sent[0].text).toContain("₹250");
  expect(sent[0].text).toMatch(/\/pay\//);
});

test("logout, then the passcode login: wrong passcode is refused, the right one gets in", async ({ page }) => {
  await signIn(page);
  await page.goto("/shop");
  await page.getByTestId("logout").click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.request.get("/api/summary")).status()).toBe(401);
  await audit(page);
  await page.getByLabel("Mobile number").fill(TEN);
  await page.getByLabel("Passcode").fill("wrong-passcode-1");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("login-error")).toContainText("dobara check karo");
  await page.getByLabel("Passcode").fill(PASS);
  await page.getByTestId("login-submit").click();
  await expect(page).toHaveURL(/\/shop$/);
});

test("login with a WhatsApp code: CAPTCHA, code sent to the owner only, then in", async ({ page, request }) => {
  await page.goto("/login");
  await page.getByTestId("mode-whatsapp").click();
  const captchaResp = page.waitForResponse((r) => r.url().includes("/api/auth/wa/captcha") && r.ok());
  await page.getByLabel(/Mobile number/).fill(TEN);
  const cap = await (await captchaResp).json();
  await expect(page.getByTestId("wa-captcha")).toBeVisible();
  const answer = (await (await request.get(`${WA}/__test/captcha/${cap.captchaId}`)).json()).code as string;
  await page.getByTestId("wa-captcha-code").fill(answer);
  await page.getByTestId("wa-send").click();
  await expect(page.getByTestId("wa-code")).toBeVisible();
  const code = (await (await request.get(`${WA}/__test/last-code`)).json()).code as string;
  expect(code).toMatch(/^\d{6}$/);
  await page.getByTestId("wa-code").fill(code);
  await page.getByTestId("wa-verify").click();
  await expect(page).toHaveURL(/\/shop$/);
  await expect(page.getByTestId("logout")).toBeVisible();
});

test("a signed-in real shop keeps debug and demo reset closed, and /try goes to the shop", async ({ page }) => {
  await signIn(page);
  await page.goto("/shop");
  expect((await page.request.get("/api/debug")).status()).toBe(403);
  expect((await page.request.post("/api/demo/reset")).status()).toBe(403);
  await page.goto("/try");
  await expect(page).toHaveURL(/\/shop$/);
});

test("delete-my-data erases the business data after the typed phrase and keeps the login", async ({ page }) => {
  await signIn(page);
  await page.goto("/shop");
  await expect(page.locator('[data-paise="25000"]').first()).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByTestId("erase-open").click();
  const confirm = page.getByTestId("erase-confirm");
  await expect(confirm).toBeDisabled();
  await page.getByTestId("erase-phrase").fill("haan");
  await expect(confirm).toBeDisabled();
  await page.getByTestId("erase-phrase").fill("sab hata do");
  await confirm.click();
  await expect(page.getByText("Data hata diya.")).toBeVisible();
  await page.getByRole("link", { name: "Khata par wapas", exact: true }).click();
  await expect(page.locator('[data-paise="0"]').first()).toBeVisible();
  const list = await (await page.request.get("/api/customers")).json();
  expect(list.customers).toEqual([]);
  expect((await page.request.get("/api/summary")).status()).toBe(200);
});
