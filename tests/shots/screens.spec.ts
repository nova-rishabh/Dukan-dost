import { test, type Page } from "@playwright/test";

const SIZES = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];

async function shot(page: Page, name: string, size: string) {
  await page.screenshot({ path: `docs/screenshots/${name}-${size}.png`, fullPage: true });
}

for (const s of SIZES) {
  test(`screens at ${s.name}`, async ({ page, request }) => {
    await request.post("/api/demo/reset");
    await page.setViewportSize({ width: s.width, height: s.height });

    await page.goto("/");
    await page.waitForTimeout(2200);
    await shot(page, "landing", s.name);

    await page.goto("/shop");
    await page.getByTestId("summary").waitFor();
    await page.locator("#typebox").fill("Gupta ji ne 500 rupaye udhaar liye");
    await page.getByRole("button", { name: "Likho" }).click();
    await page.getByTestId("likh-do").click();
    await page.getByTestId("stamp").waitFor();
    await page.waitForTimeout(900);
    await shot(page, "shop-home", s.name);

    const list = (await (await request.get("/api/customers")).json()) as { customers: Array<{ id: string; name: string }> };
    const gupta = list.customers.find((c) => c.name === "Gupta ji")!;
    await page.goto(`/shop/${gupta.id}`);
    await page.getByTestId("bahi").waitFor();
    await page.waitForTimeout(800);
    await shot(page, "customer", s.name);

    const rem = (await (await request.post("/api/remind", { data: { customerId: gupta.id } })).json()) as { payUrl: string };
    await page.goto(new URL(rem.payUrl).pathname);
    await page.getByTestId("pay-qr").waitFor();
    await shot(page, "pay", s.name);

    await page.goto("/try");
    await page.getByTestId("clip-sharma").click();
    await page.getByTestId("parchi").waitFor();
    await page.waitForTimeout(500);
    await shot(page, "try", s.name);
  });
}
