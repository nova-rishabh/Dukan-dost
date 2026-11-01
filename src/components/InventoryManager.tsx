"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";
import { Munshi } from "./Munshi";
import { operations, type MovementChange } from "@/lib/client/operations";
import { displayQuantity, parseQuantity, previewQuantity } from "@/lib/inventory";
import type { Product, StockMovement } from "@/lib/types";

type Review = { product: Product; change: MovementChange; after: number } | { name: string; unit: Product["unit"]; threshold: number; editing?: Product; archived?: boolean };
export function InventoryManager() {
  const { locale } = useLocale(); const c = (en: string, hi: string) => locale === "en" ? en : hi;
  const [products, setProducts] = useState<Product[]>([]); const [loaded, setLoaded] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [saved, setSaved] = useState(false);
  const [name, setName] = useState(""); const [unit, setUnit] = useState<Product["unit"]>("piece"); const [threshold, setThreshold] = useState("0");
  const [editing, setEditing] = useState<Product>();
  const [selected, setSelected] = useState(""); const [kind, setKind] = useState<"opening" | "in" | "out" | "adjustment">("opening"); const [quantity, setQuantity] = useState(""); const [reason, setReason] = useState("");
  const [review, setReview] = useState<Review>(); const [history, setHistory] = useState<StockMovement[]>([]); const [historyId, setHistoryId] = useState("");
  const load = useCallback(async () => { try { setProducts((await operations.products()).products); setLoaded(true); } catch { setError("load"); } }, []);
  useEffect(() => { void load(); }, [load]);
  const labels = { opening: c("Opening count", "Shuru ka stock"), in: c("Stock in", "Stock aaya"), out: c("Stock out", "Stock gaya"), adjustment: c("Correction (+ or -)", "Sudhaar (+ ya -)"), reversal: c("Reversal", "Wapas badlav") };
  const product = products.find((p) => p.id === selected);
  async function showHistory(id: string) { setError(""); try { setHistory((await operations.movements(id)).movements); setHistoryId(id); } catch { setError("load"); } }
  async function save() {
    if (!review) return; setBusy(true); setError(""); setSaved(false);
    try {
      if ("change" in review) { await operations.move(review.product.id, review.change); if (historyId === review.product.id) await showHistory(historyId); }
      else {
        if (review.editing) await operations.updateProduct(review.editing.id, { name: review.name, lowThresholdMinor: review.threshold, expectedVersion: review.editing.version, archived: review.archived, confirmed: true });
        else await operations.createProduct({ name: review.name, unit: review.unit, lowThresholdMinor: review.threshold, confirmed: true });
        setName(""); setEditing(undefined);
      }
      if ("change" in review) setKind("in");
      setReview(undefined); setQuantity(""); setReason(""); setSaved(true); await load();
    } catch { setError("save"); await load(); } finally { setBusy(false); }
  }
  function prepareMove() {
    setError(""); if (!product) return;
    try { const amount = parseQuantity(quantity, product.unit, kind === "adjustment"); const after = previewQuantity(product.onHandMinor, kind, amount); setReview({ product, after, change: { kind, quantityMinor: amount, reason: reason.trim(), expectedVersion: product.version, idempotencyKey: crypto.randomUUID(), confirmed: true } }); }
    catch { setError("quantity"); }
  }
  function reverse(p: Product, m: StockMovement) {
    if (p.onHandMinor === null || p.onHandMinor - m.deltaMinor < 0) { setError("quantity"); return; }
    setReview({ product: p, after: p.onHandMinor - m.deltaMinor, change: { kind: "reversal", quantityMinor: 0, reason: c(`Reverse movement: ${m.reason}`, `Badlav wapas: ${m.reason}`).slice(0, 140), expectedVersion: p.version, idempotencyKey: crypto.randomUUID(), reversalOf: m.id, confirmed: true } });
  }
  return <div className="mx-auto grid max-w-3xl gap-5 px-4 py-6">
    <Link className="btn w-fit" href="/shop">{c("Back to ledger", "Khata par wapas")}</Link>
    <header className="flex items-center gap-4"><Munshi /><div><h1 className="text-[40px]">{c("Stock register", "Stock ka register")}</h1><p>{c("Enter counted stock. Ledger entries do not change stock automatically.", "Gina hua stock likho. Khate ki entry se stock apne aap nahi badalta.")}</p></div></header>
    {error && <div role="alert" className="sticker p-4"><p>{c(error === "quantity" ? "Check quantity: whole pieces or up to three decimals for kg/litre. Record opening stock first; stock cannot go below zero." : error === "save" ? "Stock could not be saved. Reload and check history before trying again; another change may have been saved." : "Stock could not load. Try again.", "Quantity check karo: piece poore ank, kg/litre mein 3 decimal tak. Pehle shuru ka stock likho. Stock zero se neeche nahi ho sakta. Save na ho to history check karo.")}</p><button className="btn mt-2" onClick={() => { setError(""); setReview(undefined); void load(); }}>{c("Reload stock", "Stock dobara kholo")}</button></div>}
    {saved && <p role="status">{c("Stock register saved.", "Stock register save hua.")}</p>}
    {review ? <section className="sticker grid gap-3 p-5" aria-labelledby="stock-review"><h2 id="stock-review" className="text-2xl">{c("Review stock", "Stock check karo")}</h2>{"change" in review ? <><strong>{review.product.name} · {labels[review.change.kind]}</strong><p>{c("Before", "Pehle")}: {review.product.onHandMinor === null ? c("Not counted", "Gina nahi") : displayQuantity(review.product.onHandMinor, review.product.unit)}</p><p>{c("After", "Baad mein")}: {displayQuantity(review.after, review.product.unit)}</p><p>{c("Reason", "Wajah")}: {review.change.reason}</p><p>{c("This only changes measured stock. It does not change money owed.", "Sirf gina hua stock badlega. Udhaar nahi badlega.")}</p></> : <><strong>{review.name}</strong>{review.archived !== undefined && <p>{review.archived ? c("Archive item? Movement history remains available.", "Item archive karein? Purane badlav rahenge.") : c("Restore item?", "Item wapas laayein?")}</p>}<p>{c("Unit", "Unit")}: {review.unit}</p><p>{c("Low stock threshold", "Kam stock ki seema")}: {displayQuantity(review.threshold, review.unit)}</p>{!review.editing && <p>{c("Opening stock will remain uncounted until you enter a count.", "Ginti likhne tak shuru ka stock maloom nahi maana jayega.")}</p>}</>}<button className="btn btn-primary" disabled={busy} onClick={() => void save()}>{c("Confirm stock", "Stock confirm karo")}</button><button className="btn" disabled={busy} onClick={() => setReview(undefined)}>{c("Go back", "Wapas")}</button></section> : <>
      <section className="sticker grid gap-3 p-5"><h2 className="text-2xl">{editing ? c("Edit item", "Item badlo") : c("Add item", "Item jodo")}</h2><form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); setError(""); try { setReview({ name: name.trim(), unit, threshold: parseQuantity(threshold, unit), editing }); } catch { setError("quantity"); } }}>
        <label>{c("Item name", "Item ka naam")}<input className="input w-full" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label>{c("Unit (cannot change later)", "Unit (baad mein nahi badlegi)")}<select disabled={!!editing} className="input w-full" value={unit} onChange={(e) => setUnit(e.target.value as Product["unit"])}><option value="piece">{c("Piece", "Piece")}</option><option value="kg">kg</option><option value="litre">{c("Litre", "Litre")}</option></select></label>
        <label>{c("Low stock threshold", "Kam stock ki seema")}<input className="input w-full" required inputMode="decimal" value={threshold} onChange={(e) => setThreshold(e.target.value)} /></label><button className="btn btn-primary">{c("Review item", "Item check karo")}</button>{editing && <button type="button" className="btn" onClick={() => { setEditing(undefined); setName(""); }}>{c("Cancel edit", "Badlav chhodo")}</button>}
      </form></section>
      <section className="sticker grid gap-3 p-5"><h2 className="text-2xl">{c("Record stock movement", "Stock ka badlav likho")}</h2><form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); prepareMove(); }}>
        <label>{c("Item", "Item")}<select required className="input w-full" value={selected} onChange={(e) => { const p = products.find((x) => x.id === e.target.value); setSelected(e.target.value); setKind(p?.onHandMinor === null ? "opening" : "in"); setQuantity(""); }}><option value="">{c("Choose item", "Item chuno")}</option>{products.filter((p) => !p.archivedAt).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}</select></label>
        {product && <p>{c("Current stock", "Abhi ka stock")}: {product.onHandMinor === null ? c("Not counted", "Gina nahi") : displayQuantity(product.onHandMinor, product.unit)}</p>}
        <label>{c("Movement", "Badlav")}<select className="input w-full" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>{(["opening", "in", "out", "adjustment"] as const).map((k) => <option key={k} value={k} disabled={k === "opening" ? product?.onHandMinor !== null : !product || product.onHandMinor === null}>{labels[k]}</option>)}</select></label>
        <label>{c("Quantity", "Quantity")}{product ? ` (${product.unit})` : ""}<input required className="input w-full" inputMode="decimal" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label><label>{c("Reason", "Wajah")}<input required maxLength={140} className="input w-full" value={reason} onChange={(e) => setReason(e.target.value)} /></label><button className="btn btn-primary" disabled={!product}>{c("Review movement", "Badlav check karo")}</button>
      </form></section>
    </>}
    <section aria-label={c("Items", "Items")} className="grid gap-3">{!loaded ? <p role="status">{c("Loading stock…", "Stock khul raha hai…")}</p> : products.length === 0 ? <p className="sticker p-4">{c("No measured items yet. Add an item, then record its opening count.", "Abhi gina hua stock nahi hai. Item jodo, phir shuru ki ginti likho.")}</p> : products.map((p) => <article className="sticker grid gap-2 p-4" key={p.id}><h2 className="text-2xl">{p.name}</h2>{p.archivedAt && <strong>{c("Archived", "Archived")}</strong>}<p>{p.onHandMinor === null ? c("Opening count needed", "Shuru ki ginti chahiye") : displayQuantity(p.onHandMinor, p.unit)}</p>{p.onHandMinor !== null && p.onHandMinor <= p.lowThresholdMinor && <strong>{c("Low stock", "Stock kam hai")}</strong>}<p>{c("Low stock threshold", "Kam stock ki seema")}: {displayQuantity(p.lowThresholdMinor, p.unit)}</p><button className="btn w-fit" onClick={() => void showHistory(p.id)}>{c("View movements", "Badlav dekho")}</button><div className="btn-grid"><button className="btn" disabled={busy || !!review} onClick={() => { setEditing(p); setName(p.name); setUnit(p.unit); setThreshold(String(p.unit === "piece" ? p.lowThresholdMinor : p.lowThresholdMinor / 1000)); }}>{c("Edit item", "Item badlo")}</button><button className="btn" disabled={busy || !!review} onClick={() => setReview({ name: p.name, unit: p.unit, threshold: p.lowThresholdMinor, editing: p, archived: !p.archivedAt })}>{p.archivedAt ? c("Restore item", "Item wapas lao") : c("Archive item", "Item archive karo")}</button></div></article>)}</section>
    {historyId && <section className="sticker grid gap-3 p-5"><h2 className="text-2xl">{c("Movement history", "Stock ke badlav")}: {products.find((p) => p.id === historyId)?.name}</h2>{history.length === 0 ? <p>{c("No movements recorded.", "Koi badlav nahi likha.")}</p> : history.map((m) => { const p = products.find((x) => x.id === m.productId); return <article key={m.id} className="border-b-2 py-3"><strong>{labels[m.kind]}</strong><p>{p && displayQuantity(m.deltaMinor, p.unit)} · {m.reason}</p><time>{new Date(m.createdAt).toLocaleString(locale === "en" ? "en-IN" : "hi-IN")}</time>{m.kind !== "opening" && m.kind !== "reversal" && !history.some((x) => x.reversalOf === m.id) && p && <button className="btn mt-2 block" disabled={busy || !!review} onClick={() => reverse(p, m)}>{c("Review reversal", "Wapas badlav check karo")}</button>}{history.some((x) => x.reversalOf === m.id) && <p>{c("Reversed; original retained", "Wapas hua; purani entry rahegi")}</p>}</article>; })}</section>}
  </div>;
}
