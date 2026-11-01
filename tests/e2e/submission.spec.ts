import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("submission offers all five artifacts without customer records or admin links", async ({ page, request, context }) => {
  await context.addCookies([{ name: "dukaan-locale", value: "en", domain: "localhost", path: "/" }]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/submission");
  await expect(page.getByRole("heading", { name: "Dukaan Dost submission", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the fictional trial", exact: true })).toHaveAttribute("href", "/try");
  for (const [url, mime] of [["/submission/deck.pdf", "application/pdf"], ["/submission/dukaan-dost-ad.mp4", "video/mp4"], ["/submission/social/post-1-ne-ya-ko.png", "image/png"], ["/submission/social/post-2-bahi-vs-bolo.png", "image/png"], ["/submission/social/post-3-vasooli-politely.png", "image/png"]]) {
    const response = await request.head(url); expect(response.ok()).toBe(true); expect(response.headers()["content-type"]).toContain(mime);
  }
  expect(await page.locator('a[href*="/admin"]').count()).toBe(0);
  await page.getByRole("link", { name: "Three posts and bilingual captions", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Three social posts", exact: true })).toBeVisible();
  await expect(page.locator("article img")).toHaveCount(3);
  const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => v.id)).toEqual([]);
});
