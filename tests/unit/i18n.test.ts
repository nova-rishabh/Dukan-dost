import { describe, expect, it } from "vitest";
import { errorHint, readLocale, translate } from "@/lib/i18n";

describe("explicit account locale catalog", () => {
  it("accepts only supported locale cookie values", () => {
    expect(readLocale("en")).toBe("en");
    expect(readLocale("hi-Latn")).toBe("hi-Latn");
    expect(readLocale(undefined)).toBe("hi-Latn");
    expect(readLocale("untrusted-value")).toBe("hi-Latn");
  });
  it("selects explicit copy and localizes server codes without exposing raw server prose", () => {
    expect(translate("en", "password")).toBe("Password");
    expect(translate("hi-Latn", "password")).toBe("Passcode");
    const failure = { code: "bad_credentials", hint: "Mobile number aur passcode dobara check karo." };
    expect(errorHint("en", failure, "requestFailed")).toBe("Check your mobile number and password.");
    expect(errorHint("hi-Latn", failure, "requestFailed")).toBe(failure.hint);
    expect(errorHint("en", failure, "setupFailed")).toContain("setup code");
  });
  it("preserves the uncertain write warning across localization", () => {
    expect(errorHint("en", { code: "timeout", hint: "Jawab nahi mila. Kaam hua ho sakta hai." }, "requestFailed")).toContain("may have completed");
    expect(errorHint("en", { code: "unknown", hint: "untrusted server prose" }, "requestFailed")).toBe(translate("en", "requestFailed"));
  });
});

it("gives actionable English ledger and reminder safety errors instead of raw Hinglish", () => {
  expect(errorHint("en", { code: "proposal_mismatch", hint: "raw hint" }, "requestFailed")).toContain("fresh card");
  expect(errorHint("en", { code: "draft_stale", hint: "raw hint" }, "requestFailed")).toContain("balance changed");
  expect(errorHint("en", { code: "second_confirm_required", hint: "raw hint" }, "requestFailed")).toContain("second confirmation");
  expect(errorHint("en", { code: "consent_required", hint: "raw hint" }, "requestFailed")).toContain("agreed");
});
