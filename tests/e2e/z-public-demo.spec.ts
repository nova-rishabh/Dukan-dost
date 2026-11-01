import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://localhost:3102", viewport: { width: 390, height: 844 } });
test("public production trial isolates visitors, payment examples and real account APIs", async ({ page, context, browser }) => {
  const other = await browser.newContext({ baseURL: "http://localhost:3102", viewport: { width: 390, height: 844 } });
  try {
    await context.addCookies([{ name: "dukaan-locale", value: "en", domain: "localhost", path: "/" }]);
    await other.addCookies([{ name: "dukaan-locale", value: "en", domain: "localhost", path: "/" }]);
    await page.goto("/try");
    await page.getByRole("button", { name: "Start private sample shop", exact: true }).click();
    await expect(page.locator("#typebox")).toBeVisible();
    await page.getByTestId("menu-button").click();
    await expect(page.getByRole("button", { name: "Exit sample", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    expect((await context.cookies()).find((c) => c.name === "dd_demo")?.httpOnly).toBe(true);
    await page.request.post("/api/customers", { data: { name: "Fictional sample A only" } });
    const pageB = await other.newPage();
    await pageB.goto("/try");
    await pageB.getByRole("button", { name: "Start private sample shop", exact: true }).click();
    await expect(pageB.locator("#typebox")).toBeVisible();
    const customersA = (await (await page.request.get("/api/customers")).json()).customers;
    const customersB = (await (await pageB.request.get("/api/customers")).json()).customers;
    expect(customersA.some((c: { name: string }) => c.name === "Fictional sample A only")).toBe(true);
    expect(customersB.some((c: { name: string }) => c.name === "Fictional sample A only")).toBe(false);
    expect(await (await page.request.get("/api/auth/me")).json()).toMatchObject({ authRequired: false, visitorDemo: true, owner: null });
    const report = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(report.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
    await page.screenshot({ path: ".goal/screenshots/public-demo-390.png", fullPage: true });
    const debtor = customersA.find((c: { balancePaise: number }) => c.balancePaise > 0);
    const draft = await (await page.request.post("/api/remind", { data: { customerId: debtor.id } })).json();
    expect(new URL(draft.payUrl).origin).toBe("http://localhost:3102");
    await page.goto(draft.payUrl);
    await expect(page.getByTestId("demo-banner")).toBeVisible();
    await pageB.goto(draft.payUrl);
    await expect(pageB.getByRole("heading", { name: "This link is invalid", exact: true })).toBeVisible();
    await page.request.post("/api/demo/exit", { data: {} });
    expect((await page.request.get("/api/summary")).status()).toBe(401);
    expect((await pageB.request.get("/api/summary")).status()).toBe(200);
  } finally { await other.close(); }
});
