import { expect, test } from "@playwright/test";
test.use({ deviceScaleFactor: 2 });

test("capture readable fictional ad proof from the current app", async ({ page, request }) => {
  await request.post("/api/demo/reset");
  await page.setViewportSize({ width: 390, height: 1100 });
  await page.goto("/shop");
  await page.locator("#typebox").fill("Amit Sharma ne 500 rupaye udhaar liye");
  await page.getByRole("button", { name: "Likho", exact: true }).click();
  const parchi = page.getByTestId("parchi");
  await expect(parchi).toBeVisible();
  await parchi.screenshot({ path: "deliverables/ad/assets/captures/parchi-before-fast.png" });
  await page.getByTestId("likh-do").click();
  await expect(page.getByTestId("stamp")).toBeVisible();
  const { customers } = await (await request.get("/api/customers")).json();
  const customer = customers.find((c: { name: string }) => c.name === "Amit Sharma");
  await page.setViewportSize({ width: 600, height: 1100 });
  // Fictional capture fixture: production-origin-shaped link, not a real payable token.
  await page.route("**/api/remind", async (route) => {
    const response = await route.fetch();
    const data = await response.json();
    const oldUrl = data.payUrl;
    data.payUrl = "https://dukaan-dost.onrender.com/pay/demo-example";
    data.text = data.text.replace(oldUrl, data.payUrl);
    await route.fulfill({ response, json: data });
  });
  await page.goto(`/shop/${customer.id}`);
  await page.getByRole("button", { name: "Yaad dilao", exact: true }).click();
  await expect(page.getByTestId("remind-text")).not.toHaveValue("");
  await page.getByTestId("remind-text").blur();
  // Capture layout only: fit the complete draft instead of clipping the actual textarea.
  // This changes no data or product behavior. Keep it documented as fitted for film.
  await page.addStyleTag({ content: "dialog { width:560px!important; color:#16123A!important; } #remind-text { height:240px!important; font-size:20px!important; border-radius:0!important; } dialog p { overflow-wrap:anywhere; }" });
  await page.getByRole("dialog").screenshot({ path: "deliverables/ad/assets/captures/reminder-fast.png" });
});
