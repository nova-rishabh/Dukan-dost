import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.beforeEach(async ({ request }) => {
  const r = await request.post("/api/demo/reset");
  expect(r.ok()).toBeTruthy();
});

async function say(page: Page, text: string) {
  await page.locator("#typebox").fill(text);
  await page.getByRole("button", { name: "Likho" }).click();
}

async function customerId(page: Page, name: string): Promise<string> {
  const res = await page.request.get("/api/customers");
  const json = (await res.json()) as { customers: Array<{ id: string; name: string }> };
  return json.customers.find((c) => c.name === name)!.id;
}

test("1 happy path: type, parchi in digits and words, Likh do, stamp, total moves", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.locator('[data-paise="521000"]')).toBeVisible();
  await say(page, "Gupta ji ne 500 rupaye udhaar liye");
  const parchi = page.getByTestId("parchi");
  await expect(parchi.getByTestId("amount-digits")).toHaveText("₹500");
  await expect(parchi.getByTestId("amount-hi")).toHaveText("पाँच सौ रुपये");
  await expect(parchi.getByTestId("ribbon")).toHaveText("Udhaar diya");
  await parchi.getByTestId("likh-do").click();
  await expect(page.getByTestId("stamp")).toBeVisible();
  await expect(page.getByTestId("toast")).toContainText("Likh liya");
  await expect(page.locator('[data-paise="571000"]')).toBeVisible();
});

test("2 direction trap: ne and ko give opposite ribbons in words", async ({ page }) => {
  await page.goto("/shop");
  await say(page, "Sharma ji ne 500 diye");
  await expect(page.getByTestId("ribbon")).toHaveText("Paise mile");
  await say(page, "Sharma ji ko 500 diye");
  await expect(page.getByTestId("ribbon")).toHaveText("Udhaar diya");
});

test("3 which Sharma: chips block writing until one is picked", async ({ page }) => {
  await page.goto("/shop");
  await say(page, "Sharma ji ne 500 rupaye udhaar liye");
  const parchi = page.getByTestId("parchi");
  await expect(parchi.getByRole("button", { name: "Amit Sharma, Block A" })).toBeVisible();
  await expect(parchi.getByRole("button", { name: "R K Sharma, Block B" })).toBeVisible();
  await expect(parchi.getByTestId("likh-do")).toBeDisabled();
  await parchi.getByRole("button", { name: "R K Sharma, Block B" }).click();
  await expect(parchi.getByTestId("customer-chip")).toHaveText("R K Sharma");
  await expect(parchi.getByTestId("likh-do")).toBeEnabled();
  await parchi.getByTestId("likh-do").click();
  await expect(page.getByTestId("stamp")).toBeVisible();
  const id = await customerId(page, "R K Sharma");
  const r = await (await page.request.get(`/api/customers/${id}`)).json();
  expect(r.balancePaise).toBe((450 + 500) * 100);
});

test("4 undo: Pichli entry hata do voids it and history shows it struck through", async ({ page }) => {
  await page.goto("/shop");
  await say(page, "Gupta ji ne 500 rupaye udhaar liye");
  await page.getByTestId("likh-do").click();
  await expect(page.getByTestId("stamp")).toBeVisible();
  await say(page, "Pichli entry hata do");
  await expect(page.getByTestId("undo-line")).toContainText("Gupta ji ko udhaar diya, ₹500");
  await page.getByTestId("hata-do").click();
  await expect(page.getByTestId("toast")).toContainText("Hata diya");
  const id = await customerId(page, "Gupta ji");
  await page.goto(`/shop/${id}`);
  await expect(page.getByTestId("entry-voided")).toHaveCount(1);
  await expect(page.getByTestId("entry-voided")).toHaveCSS("text-decoration-line", "line-through");
});

test("5 double tap: two quick Likh do presses write one entry", async ({ page }) => {
  await page.goto("/shop");
  await say(page, "Gupta ji ne 500 rupaye udhaar liye");
  const btn = page.getByTestId("likh-do");
  await btn.dblclick();
  await expect(page.getByTestId("stamp")).toBeVisible();
  const id = await customerId(page, "Gupta ji");
  const r = await (await page.request.get(`/api/customers/${id}`)).json();
  expect(r.entries).toHaveLength(3);
});

test("6 reminder: exact name and amount, wa.me link carries the encoded text", async ({ page }) => {
  const id = await customerId(page, "Gupta ji");
  await page.goto(`/shop/${id}`);
  await page.getByRole("button", { name: "Yaad dilao" }).click();
  const box = page.getByTestId("remind-text");
  await expect(box).toHaveValue(/Namaste Gupta ji, Shree Ganesh Kirana se\. Aapka ₹1,200 baaki hai\./);
  const href = await page.getByTestId("wa-open").getAttribute("href");
  expect(href).toMatch(/^https:\/\/wa\.me\/\?text=/);
  const decoded = decodeURIComponent(href!.split("?text=")[1]);
  expect(decoded).toBe(await box.inputValue());
});

test("7 pay page: QR and amount for a good token, clear message for a bad one", async ({ page }) => {
  const id = await customerId(page, "Amit Sharma");
  const rem = await (await page.request.post("/api/remind", { data: { customerId: id } })).json();
  await page.goto(new URL(rem.payUrl).pathname);
  await expect(page.getByTestId("pay-amount")).toHaveText("₹1,200");
  await expect(page.getByTestId("pay-qr")).toBeVisible();
  await expect(page.getByTestId("demo-banner")).toContainText("Demo: yahan paise nahi kat te");
  await expect(page.getByTestId("pay-button")).toHaveAttribute("href", /^upi:\/\/pay\?pa=.*&am=1200\.00&cu=INR/);
  await expect(page.locator("body")).not.toContainText("Paid");
  await page.goto("/pay/this-token-does-not-exist-123");
  await expect(page.getByRole("heading", { name: "Yeh link sahi nahi hai" })).toBeVisible();
});

test("8a fallback: mic blocked, then typed input still works", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: () => Promise.reject(new DOMException("denied", "NotAllowedError")) },
      configurable: true,
    });
  });
  await page.goto("/try");
  await page.getByTestId("bolo").click();
  await expect(page.getByTestId("problem")).toContainText("Mic band hai");
  await say(page, "Gupta ji ne 500 rupaye udhaar liye");
  await expect(page.getByTestId("amount-digits")).toHaveText("₹500");
});

test("8b fallback: speech-to-text failure shows a typed-fallback message", async ({ page }) => {
  await page.addInitScript(() => {
    const stream = { getTracks: () => [{ stop() {} }] };
    Object.defineProperty(navigator, "mediaDevices", { value: { getUserMedia: () => Promise.resolve(stream) }, configurable: true });
    class FakeRecorder {
      state = "inactive";
      mimeType = "audio/webm";
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      static isTypeSupported() {
        return true;
      }
      start() {
        this.state = "recording";
      }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob([new Uint8Array(2000)], { type: "audio/webm" }) });
        this.onstop?.();
      }
    }
    // @ts-expect-error test double
    window.MediaRecorder = FakeRecorder;
    // @ts-expect-error test double
    window.AudioContext = undefined;
  });
  await page.goto("/try");
  const bolo = page.getByTestId("bolo");
  await bolo.focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("problem")).toContainText("Demo mode");
  await say(page, "Gupta ji ne 500 rupaye udhaar liye");
  await expect(page.getByTestId("amount-digits")).toHaveText("₹500");
});

test("8c fallback: sample clip works with no mic and no login", async ({ page }) => {
  await page.goto("/try");
  await page.getByTestId("clip-ne-ko").click();
  await expect(page.getByTestId("heard")).toContainText("Gupta ji ko 500 diye");
  await expect(page.getByTestId("ribbon")).toHaveText("Udhaar diya");
});

test("9 reduced motion: stamp lands without movement, same information", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/shop");
  await say(page, "Gupta ji ne 500 rupaye udhaar liye");
  await page.getByTestId("likh-do").click();
  const stamp = page.getByTestId("stamp");
  await expect(stamp).toBeVisible();
  await expect(stamp).toHaveCSS("animation-name", "none");
  await expect(page.getByTestId("toast")).toContainText("Likh liya");
});

test("10 Badlo: an edited amount is re-checked and written once", async ({ page }) => {
  await page.goto("/shop");
  await say(page, "Gupta ji ne 500 rupaye udhaar liye");
  await page.getByRole("button", { name: "Badlo" }).click();
  await page.getByLabel("Amount (rupaye)").fill("700");
  await expect(page.getByTestId("amount-digits")).toHaveText("₹700");
  await page.getByTestId("likh-do").click();
  await expect(page.getByTestId("stamp")).toBeVisible();
  const id = await customerId(page, "Gupta ji");
  const r = await (await page.request.get(`/api/customers/${id}`)).json();
  expect(r.balancePaise).toBe((2200 - 1000 + 700) * 100);
});

test("11 the API refuses a forged proposal and a cross-site POST", async ({ request }) => {
  const id = (await (await request.get("/api/customers")).json()).customers[0].id;
  const forged = await request.post("/api/entries", {
    data: { proposalToken: "forged.token.value", intentIndex: 0, confirmed: true, resolutions: [], customerId: id, type: "credit_given", amountPaise: 50000, source: "text", idempotencyKey: "forged-key-1" },
  });
  expect(forged.status()).toBe(400);
  expect((await forged.json()).error.code).toBe("bad_proposal");
  const cross = await request.post("/api/demo/reset", { headers: { origin: "https://evil.example" } });
  expect(cross.status()).toBe(403);
  const sameSiteJsonOnly = await request.post("/api/interpret", { headers: { "content-type": "text/plain" }, data: '{"text":"x"}' });
  expect(sameSiteJsonOnly.status()).toBe(415);
});

test("12 the CSP header is sent and no page breaks under it", async ({ page, request }) => {
  const head = (await request.get("/")).headers();
  expect(head["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(head["content-security-policy"]).toContain("object-src 'none'");
  expect(head["content-security-policy"]).toContain("'nonce-");
  expect(head["content-security-policy"].split(";").find((part) => part.trim().startsWith("script-src"))).not.toContain("'unsafe-inline'");
  const secondPolicy = (await request.get("/")).headers()["content-security-policy"];
  expect(secondPolicy).not.toBe(head["content-security-policy"]);
  expect(head["strict-transport-security"]).toContain("max-age=");

  const problems: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) problems.push(m.text());
  });
  page.on("pageerror", (e) => problems.push(String(e)));

  await page.goto("/");
  await page.goto("/shop");
  await say(page, "Gupta ji ne 500 rupaye udhaar liye");
  await page.getByTestId("likh-do").click();
  await expect(page.getByTestId("stamp")).toBeVisible();
  const id = await customerId(page, "Gupta ji");
  await page.goto(`/shop/${id}`);
  await page.getByRole("button", { name: "Yaad dilao" }).click();
  await expect(page.getByTestId("remind-text")).toHaveValue(/Namaste/);
  const rem = await (await page.request.post("/api/remind", { data: { customerId: id } })).json();
  await page.goto(new URL(rem.payUrl).pathname);
  await expect(page.getByTestId("pay-qr")).toBeVisible();
  await page.goto("/try");
  await page.getByTestId("clip-saaf").click();
  await expect(page.getByTestId("parchi")).toBeVisible();
  expect(problems).toEqual([]);
});

test("13 the demo shop shows the retention note and no erase button", async ({ page }) => {
  await page.goto("/shop");
  await page.getByTestId("menu-button").click();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(page.getByTestId("retention-note")).toContainText("Awaaz kabhi save nahi hoti");
  await expect(page.getByTestId("erase-open")).toHaveCount(0);
  await expect(page.getByTestId("data-panel")).toContainText("Dukaan reset karo");
});
