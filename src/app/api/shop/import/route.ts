import { z } from "zod";
import { snapshotDigest, validateSnapshot } from "@/lib/shop-transfer";
import { getContext } from "@/server/context";
import { HttpError, rateLimit, readJson, route } from "@/server/http";
import { requireFreshOwner } from "@/server/owner-confirmation";
import { verifyTransferProof } from "@/server/transfer-proof";
export const runtime = "nodejs";
export const POST = route("shop.import", async (req, { session }) => {
  rateLimit(req, "import", 5); const ctx = getContext();
  const body = z.object({ snapshot: z.unknown(), proof: z.string().max(4000), confirmed: z.literal(true), phrase: z.literal("import records"), passcode: z.string().max(128).optional() }).parse(await readJson(req, 2000000));
  const owner = await requireFreshOwner(session, body.passcode);
  let snapshot; try { snapshot = validateSnapshot(body.snapshot); } catch { throw new HttpError(400, "invalid_import", "The file is invalid or unsupported", "Preview a valid business export. No records were changed."); }
  const preview = verifyTransferProof(body.proof, snapshotDigest(snapshot), owner.authVersion);
  try { const result = await ctx.store.importBusiness(ctx.shopId, snapshot, preview.fingerprint, owner.authVersion); await ctx.store.appendAudit(ctx.shopId, "business_imported", { created: result.created, customers: result.customers, entries: result.entries, products: result.products }, new Date().toISOString()); return result; }
  catch (e) { if (e instanceof Error && e.message === "import_conflict") throw new HttpError(409, "import_conflict", "Your shop changed since the preview", "Preview the file again and check for duplicate records."); throw e; }
});
