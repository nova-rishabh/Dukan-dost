import { amountInWords, HI_WORDS } from "@/lib/money";
import { z } from "zod";
import { snapshotDigest, validateSnapshot } from "@/lib/shop-transfer";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";
import { transferProof } from "@/server/transfer-proof";
export const runtime = "nodejs";
export const POST = route("shop.import.preview", async (req, { session }) => {
  rateLimit(req, "import-preview", 10); const ctx = getContext();
  const body = z.object({ snapshot: z.unknown() }).parse(await readJson(req, 2000000));
  let snapshot; try { snapshot = validateSnapshot(body.snapshot); } catch { throw new HttpError(400, "invalid_import", "The file is invalid or unsupported", "Use a version 1 Dukaan Dost business export. No records were changed."); }
  const current = await ctx.store.exportBusiness(ctx.shopId);
  const creditPaise = snapshot.entries.filter((e) => !e.voidedAt && e.type === "credit_given").reduce((n,e) => n + e.amountPaise,0);
  const paymentPaise = snapshot.entries.filter((e) => !e.voidedAt && e.type === "payment_received").reduce((n,e) => n + e.amountPaise,0);
  function words(amount: number) { const whole = Math.floor(amount/100); const fraction = amount%100; const rupees = whole ? amountInWords(whole) : { en: "zero rupees", hi: "शून्य रुपये" }; if (!fraction) return rupees; return { en: `${rupees.en} and ${amountInWords(fraction).en.replace(/ rupees?$/, "")} paise`, hi: `${rupees.hi} और ${HI_WORDS[fraction]} पैसे` }; }

  return { summary: { creditPaise, paymentPaise, creditWords: words(creditPaise), paymentWords: words(paymentPaise), shopName: snapshot.shopName, customers: snapshot.customers.length, entries: snapshot.entries.length, products: snapshot.products.length, movements: snapshot.movements.length }, proof: transferProof({ shopId: ctx.shopId, digest: snapshotDigest(snapshot), fingerprint: snapshotDigest(current), authVersion: session?.authVersion ?? 0, expiresAt: Date.now() + 10*60000 }) };
});
