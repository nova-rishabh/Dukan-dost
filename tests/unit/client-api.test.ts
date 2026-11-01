import { afterEach, describe, expect, it, vi } from "vitest";
import { api, CLIENT_REQUEST_TIMEOUT_MS } from "@/lib/client/api";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("bounded client requests", () => {
  it("aborts a hung read at the deadline and offers a recovery action", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    const fetcher = vi.fn((_url: string, init: RequestInit) => {
      signal = init.signal as AbortSignal;
      return new Promise<Response>(() => {});
    });
    vi.stubGlobal("fetch", fetcher);
    const result = expect(api.me()).rejects.toMatchObject({ code: "timeout", hint: expect.stringContaining("Dobara kholo") });
    await vi.advanceTimersByTimeAsync(CLIENT_REQUEST_TIMEOUT_MS);
    await result;
    expect(signal?.aborted).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("includes stalled response bodies in the deadline", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream({ start() {} }))));
    const result = expect(api.customers()).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(CLIENT_REQUEST_TIMEOUT_MS);
    await result;
  });

  it("never retries a timed-out write or claims it failed before checking state", async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn(() => new Promise<Response>(() => {}));
    vi.stubGlobal("fetch", fetcher);
    const result = expect(api.createEntry({ idempotencyKey: "same-request-key" })).rejects.toMatchObject({
      code: "timeout", hint: expect.stringContaining("Kaam hua ho sakta hai"),
    });
    await vi.advanceTimersByTimeAsync(CLIENT_REQUEST_TIMEOUT_MS * 2);
    await result;
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps server hints and clears its deadline after a completed response", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ ok: false, error: { code: "locked", message: "Locked", hint: "Thodi der ruko." } }, { status: 429 })));
    await expect(api.login("fictional", "example-passcode")).rejects.toMatchObject({ code: "locked", status: 429, hint: "Thodi der ruko." });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds optional speech body loading too", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(new ReadableStream({ start() {} }), { headers: { "content-type": "audio/mpeg" } })));
    const result = expect(api.speak("Example")).rejects.toMatchObject({ code: "timeout" });
    await vi.advanceTimersByTimeAsync(CLIENT_REQUEST_TIMEOUT_MS);
    await result;
  });
});
