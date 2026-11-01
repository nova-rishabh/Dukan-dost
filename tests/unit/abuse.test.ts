import { afterAll, expect, it } from "vitest";
import { trustedAddress } from "@/server/abuse";
const prior = process.env.TRUST_PROXY_HOPS;
afterAll(() => { if (prior === undefined) delete process.env.TRUST_PROXY_HOPS; else process.env.TRUST_PROXY_HOPS = prior; });
it("does not let arbitrary forwarded headers create new IP quota buckets", () => {
  process.env.TRUST_PROXY_HOPS = "0";
  expect(trustedAddress(new Request("http://localhost", { headers: { "x-forwarded-for": "203.0.113.5" } }))).toBe("shared-untrusted-proxy");
  process.env.TRUST_PROXY_HOPS = "1";
  expect(trustedAddress(new Request("http://localhost", { headers: { "x-forwarded-for": "spoofed, 203.0.113.5" } }))).toBe("203.0.113.5");
  expect(trustedAddress(new Request("http://localhost", { headers: { "x-forwarded-for": "nonsense" } }))).toBe("shared-untrusted-proxy");
});
