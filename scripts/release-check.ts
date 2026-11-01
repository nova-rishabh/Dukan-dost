/** Read-only post-deploy check. No owner login, pairing, OTP or external message is attempted. */
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const parsed = new URL(base);
if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error("Use a public HTTP(S) app URL without credentials.");
const checks = ["/api/health", "/try", "/signup", "/manifest.webmanifest", "/submission", "/submission/deck.pdf", "/submission/dukaan-dost-ad.mp4", "/submission/social"];
let failures = 0;
for (const path of checks) {
  try {
    const response = await fetch(`${base}${path}`, { method: "HEAD", signal: AbortSignal.timeout(15000), redirect: "manual" });
    const passed = response.status === 200;
    if (!passed) failures++;
    console.log(`${passed ? "PASS" : "FAIL"} ${path} HTTP ${response.status}`);
  } catch { failures++; console.log(`FAIL ${path} unavailable`); }
}
console.log(failures ? `RELEASE-CHECK-FAIL (${failures})` : "RELEASE-CHECK-PASS (HTTP availability only; real phone/delivery still need observation)");
process.exitCode = failures ? 1 : 0;
export {};
