import { createHmac, timingSafeEqual } from "node:crypto";
import { getContext } from "./context";
import { HttpError } from "./http";
interface Payload { shopId: string; digest: string; fingerprint: string; authVersion: number; expiresAt: number }
const mac = (value: string) => createHmac("sha256", `import:${getContext().secret}`).update(value).digest();
export function transferProof(payload: Payload) { const body = Buffer.from(JSON.stringify(payload)).toString("base64url"); return `${body}.${mac(body).toString("base64url")}`; }
export function verifyTransferProof(proof: string, digest: string, authVersion: number) {
  try {
    const [body, signature] = proof.split("."); const expected = mac(body); const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw new Error();
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (payload.shopId !== getContext().shopId || payload.digest !== digest || payload.authVersion !== authVersion || payload.expiresAt < Date.now()) throw new Error();
    return payload;
  } catch { throw new HttpError(409, "import_preview_expired", "Import preview expired or changed", "Preview the file again before confirming."); }
}
