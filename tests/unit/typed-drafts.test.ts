import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { clearDraft, DRAFT_KEY, readDraft, saveDraft } from "@/lib/client/drafts";

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal("sessionStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
afterEach(() => { vi.unstubAllGlobals(); });

it("restores only the current shop/session namespace and clears a different owner's draft", () => {
  saveDraft("shop-a", "Fictional customer 100 credit");
  expect(readDraft("shop-a")?.text).toBe("Fictional customer 100 credit");
  expect(readDraft("shop-b")).toBe(null);
  expect(values.has(DRAFT_KEY)).toBe(false);
});
it("expires saved drafts after 24 hours and rejects future timestamps", () => {
  saveDraft("shop-a", "Draft");
  const draft = readDraft("shop-a")!;
  expect(readDraft("shop-a", draft.savedAt + 24 * 60 * 60_000 + 1)).toBe(null);
  values.set(DRAFT_KEY, JSON.stringify({ scope: "shop-a", text: "Draft", savedAt: Date.now() + 60_000 }));
  expect(readDraft("shop-a")).toBe(null);
});
it("bounds stored text and deletes saved text explicitly", () => {
  saveDraft("shop-a", "x".repeat(500));
  expect(readDraft("shop-a")?.text).toHaveLength(400);
  clearDraft(); expect(readDraft("shop-a")).toBe(null);
});
it("does not throw when storage is unavailable or malformed", () => {
  values.set(DRAFT_KEY, "not json"); expect(readDraft("shop-a")).toBe(null);
  vi.stubGlobal("sessionStorage", { getItem: () => { throw new Error("denied"); }, removeItem: () => { throw new Error("denied"); } });
  expect(readDraft("shop-a")).toBe(null); expect(() => clearDraft()).not.toThrow();
});
