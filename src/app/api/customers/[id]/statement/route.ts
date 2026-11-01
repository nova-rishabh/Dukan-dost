import { csvCell, statement } from "@/lib/reporting";
import { getContext } from "@/server/context";
import { HttpError, route } from "@/server/http";
import { requestPeriod } from "@/server/reporting";

export const runtime = "nodejs";
export const GET = route("statement", async (req, { params }) => {
  const ctx = getContext();
  const period = requestPeriod(req);
  const [shop, customers, entries] = await Promise.all([ctx.store.getShop(ctx.shopId), ctx.store.listCustomers(ctx.shopId), ctx.store.listEntries(ctx.shopId)]);
  const customer = customers.find((c) => c.id === params.id);
  if (!customer) throw new HttpError(404, "not_found", "Customer not found", "Customer chuno.");
  const data = statement(entries.filter((e) => e.customerId === customer.id), period);
  if (new URL(req.url).searchParams.get("format") === "csv") {
    const rows: (string | number)[][] = [
      ["Shop", shop?.name ?? ""], ["Customer", customer.name], ["Currency", "INR; amounts in paise"],
      ["Opening balance", data.openingPaise],
      ["Recorded at", "Type", "Amount paise", "Voided", "Void reason", "Note", "Running balance paise"],
      ...data.rows.map((e) => [e.confirmedAt, e.type, e.amountPaise, e.voidedAt ?? "", e.voidReason ?? "", e.note ?? e.sourceText, e.runningPaise]),
      ["Period closing balance", data.closingPaise], ["Current balance", data.currentPaise],
    ];
    return new Response("\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="customer-statement.csv"', "cache-control": "no-store" } });
  }
  return { shopName: shop?.name, customer: { id: customer.id, name: customer.name, area: customer.area }, ...data };
});
