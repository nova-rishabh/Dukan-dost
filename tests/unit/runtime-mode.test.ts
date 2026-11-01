import { expect, it } from "vitest";
import { validateRuntimeMode } from "@/lib/runtime-mode";

it("fails closed when a production shop loses its database configuration", () => {
  expect(() => validateRuntimeMode({ NODE_ENV: "production" })).toThrow("durable");
  expect(() => validateRuntimeMode({ DUKAAN_MODE: "shop" })).toThrow("durable");
  expect(() => validateRuntimeMode({ DUKAAN_MODE: "shop", DUKAAN_DB_FILE: ":memory:" })).toThrow("durable");
  expect(() => validateRuntimeMode({ DUKAAN_MODE: "shop", DUKAAN_DB_FILE: "/var/data/shop.sqlite" })).not.toThrow();
});
it("keeps the fictional demo explicit and isolated from real storage", () => {
  expect(() => validateRuntimeMode({ NODE_ENV: "production", DUKAAN_MODE: "demo" })).not.toThrow();
  expect(() => validateRuntimeMode({ DUKAAN_MODE: "demo", DUKAAN_DB_FILE: "real.sqlite" })).toThrow();
  expect(() => validateRuntimeMode({ DUKAAN_MODE: "typo" })).toThrow();
});
