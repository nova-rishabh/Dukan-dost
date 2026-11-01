import { expect, test } from "@playwright/test";

// A fresh request context carries no owner cookie. These must refuse before parsing a write body.
test("every protected API refuses an anonymous caller on a real shop", async ({ request }) => {
  const protectedRoutes = [
    ["GET", "/api/customers"], ["POST", "/api/customers"], ["GET", "/api/customers/missing"],
    ["GET", "/api/summary"], ["GET", "/api/debug"], ["GET", "/api/wa/status"],
    ["POST", "/api/interpret"], ["POST", "/api/transcribe"], ["POST", "/api/speak"],
    ["POST", "/api/entries"], ["POST", "/api/entries/missing/void"],
    ["POST", "/api/stock"], ["POST", "/api/stock/missing/resolve"],
    ["POST", "/api/remind"], ["POST", "/api/remind/send"], ["POST", "/api/poster"],
    ["POST", "/api/shop/erase"], ["POST", "/api/demo/reset"],
    ["POST", "/api/auth/passcode"], ["POST", "/api/auth/logout-all"],
  ];
  for (const [method, path] of protectedRoutes) {
    const response = await request.fetch(`http://localhost:3102${path}`, { method, ...(method === "POST" ? { data: {} } : {}) });
    expect(response.status(), `${method} ${path}`).toBe(401);
    const body = await response.json();
    expect(["auth_required", "setup_required"]).toContain(body.error.code);
  }
});

test("malformed JSON and oversized interpretation fail without changing the khata", async ({ request }) => {
  const before = await (await request.get("/api/summary")).json();
  for (const path of ["interpret", "customers", "entries", "stock", "remind", "poster", "speak"]) {
    const response = await request.post(`/api/${path}`, { headers: { "content-type": "application/json" }, data: Buffer.from("{broken") });
    expect(response.status(), path).toBe(400);
    expect((await response.json()).error.code, path).toBe("bad_json");
  }
  const oversized = await request.post("/api/interpret", { data: { text: "x".repeat(20000) } });
  expect(oversized.status()).toBe(413);
  const after = await (await request.get("/api/summary")).json();
  expect(after.summary).toEqual(before.summary);
});

test("read-only query injection is harmless and local reads tolerate a small concurrent burst", async ({ request }) => {
  const injection = await request.get("/api/customers", { params: { q: "'; DROP TABLE customers; --" } });
  expect(injection.status()).toBe(200);
  const customers = await request.get("/api/customers");
  expect(customers.status()).toBe(200);
  const samples: number[] = [];
  for (let batch = 0; batch < 4; batch++) {
    const results = await Promise.all(Array.from({ length: 10 }, async () => {
      const start = performance.now();
      const response = await request.get("/api/summary");
      await response.body();
      return { status: response.status(), ms: performance.now() - start };
    }));
    expect(results.every((r) => r.status === 200)).toBe(true);
    samples.push(...results.map((r) => r.ms));
  }
  samples.sort((a, b) => a - b);
  console.log(`LOCAL_READ_BURST requests=${samples.length} concurrency=10 p95_ms=${samples[Math.ceil(samples.length * 0.95) - 1].toFixed(1)} max_ms=${samples.at(-1)!.toFixed(1)}`);
});
