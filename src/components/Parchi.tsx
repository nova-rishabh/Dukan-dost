"use client";

import { useCopy, useLocale } from "./LocaleProvider";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type CustomerListItem } from "@/lib/client/api";
import { amountInWords, formatINR } from "@/lib/money";
import type { Candidate, Clarification, EntrySource, EntryType, ProposalIntent } from "@/lib/types";
import { Stamp } from "./Stamp";
import { WhichChips } from "./WhichChips";

export interface WrittenInfo {
  message: string;
  customerId?: string;
}

interface Props {
  intent: ProposalIntent;
  index: number;
  token: string;
  sourceText: string;
  source: EntrySource;
  /** landing hero: shows the real interpreter output and lands the stamp once, writes nothing */
  preview?: boolean;
  onWritten: (info: WrittenInfo) => void;
}

const HIGH_PAISE = 500000;
const CEILING_PAISE = 10000000;

/** Words, not only colour, say which way the money moves. */
export function directionLine(type: EntryType, name: string, locale: "en" | "hi-Latn" = "hi-Latn") {
  if (locale === "en") return type === "credit_given" ? `Credit given to ${name}` : `Payment received from ${name}`;
  return type === "credit_given" ? `${name} ko udhaar diya` : `${name} ne paise diye`;
}

export function Parchi({ intent, index, token, sourceText, source, preview, onWritten }: Props) {
  const L = useCopy();
  const { locale, hint } = useLocale();
  const [customerId, setCustomerId] = useState<string | undefined>(intent.resolvedCustomerId);
  const [customerName, setCustomerName] = useState<string | undefined>(intent.candidates?.find((c) => c.customerId === intent.resolvedCustomerId)?.name);
  const [type, setType] = useState<EntryType | undefined>(intent.clarifications.includes("direction") ? undefined : (intent.kind as EntryType));
  const [amount, setAmount] = useState<number | undefined>(intent.amountRupees);
  const [resolved, setResolved] = useState<Clarification[]>([]);
  const [phase, setPhase] = useState<"idle" | "second" | "writing" | "stamped">("idle");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [touched, setTouched] = useState(false);
  const [secondFor, setSecondFor] = useState<number | null>(null);
  const [all, setAll] = useState<CustomerListItem[] | null>(null);
  const [idem] = useState(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random()}`));

  const isEntry = intent.kind === "credit_given" || intent.kind === "payment_received";
  const need = (c: Clarification) => intent.clarifications.includes(c);
  const has = (c: Clarification) => resolved.includes(c);
  const resolve = (c: Clarification) => setResolved((r) => (r.includes(c) ? r : [...r, c]));

  useEffect(() => {
    if (!preview) return;
    const t = setTimeout(() => setPhase("stamped"), 1400);
    return () => clearTimeout(t);
  }, [preview]);

  const words = useMemo(() => (amount && amount > 0 && amount <= 100000 ? amountInWords(amount) : null), [amount]);
  const unresolved = intent.clarifications.filter((c) => !has(c));
  const amountOk = !!amount && Number.isInteger(amount) && amount > 0 && amount * 100 <= CEILING_PAISE;
  const ready = isEntry && !!customerId && !!type && amountOk && unresolved.length === 0;

  async function pickNew() {
    if (!intent.customer) return;
    try {
      const r = await api.createCustomer(intent.customer);
      setCustomerId(r.customer.id);
      setCustomerName(r.customer.name);
      resolve(need("new_customer") ? "new_customer" : "which_customer");
    } catch (e) {
      setError(locale === "en" ? hint(e, "customerFailed") : e instanceof ApiError ? e.hint : "Customer nahi ban paya. Dobara try karo.");
    }
  }

  function pick(c: Candidate) {
    setCustomerId(c.customerId);
    setCustomerName(c.name);
    resolve("which_customer");
  }

  async function startEdit() {
    setEditing(true);
    if (!all) {
      try {
        setAll((await api.customers()).customers.filter((customer) => !customer.archivedAt));
      } catch {
        setAll([]);
      }
    }
  }

  async function likhDo() {
    if (!isEntry || !ready || phase === "writing" || phase === "stamped") return;
    const paise = amount! * 100;
    if (paise >= HIGH_PAISE && secondFor !== amount) {
      setSecondFor(amount ?? null);
      setPhase("second");
      return;
    }
    setPhase("writing");
    setError(null);
    try {
      let useToken = token;
      let useIndex = index;
      let useResolutions: Clarification[] = resolved;
      let dup = !!intent.duplicateWarning;
      if (touched) {
        // An edited card is a new proposal: it goes through the same interpreter and the same checks.
        const sentence = type === "credit_given" ? L(`${name} ${amount} rupees credit`, `${name} ko ${amount} udhaar diye`) : L(`${name} paid ${amount} rupees`, `${name} ne ${amount} diye`);
        const r = await api.interpret(sentence, "text");
        const fresh = r.proposal.intents[0];
        if (!fresh || !fresh.writable || fresh.resolvedCustomerId !== customerId || fresh.kind !== type || fresh.amountRupees !== amount) {
          setPhase("idle");
          setError(L("The edited entry could not be matched. Choose the customer or correct the name and try again.", "Badli hui entry samajh nahi aayi. Customer chuno ya naam sahi karke dobara likho."));
          return;
        }
        useToken = r.proposal.token ?? "";
        useIndex = 0;
        useResolutions = [];
        dup = !!fresh.duplicateWarning;
      }
      const r = await api.createEntry({
        proposalToken: useToken,
        intentIndex: useIndex,
        confirmed: true,
        secondConfirmed: paise >= HIGH_PAISE,
        resolutions: useResolutions,
        customerId,
        type,
        amountPaise: paise,
        source,
        idempotencyKey: idem,
        allowDuplicate: dup,
      });
      setPhase("stamped");
      onWritten({ message: L(`Recorded: ${customerName ?? "Customer"}, ${formatINR(Math.abs(r.balancePaise))} ${r.balancePaise < 0 ? "advance" : "outstanding"}`, `Likh liya: ${customerName ?? "Customer"} ${formatINR(r.balancePaise)} baaki`), customerId });
    } catch (e) {
      setPhase("idle");
      setError(locale === "en" ? hint(e, "entryFailed") : e instanceof ApiError ? e.hint : "Entry nahi likhi ja saki. Dobara try karo.");
    }
  }

  async function likhStock() {
    if (phase === "writing" || phase === "stamped") return;
    setPhase("writing");
    setError(null);
    try {
      await api.createStock({ proposalToken: token, intentIndex: index, confirmed: true, resolutions: [] });
      setPhase("stamped");
      onWritten({ message: L(`Recorded: ${intent.item} is low`, `Likh liya: ${intent.item} kam hai`) });
    } catch (e) {
      setPhase("idle");
      setError(locale === "en" ? hint(e, "entryFailed") : e instanceof ApiError ? e.hint : "Note nahi likha ja saka. Dobara try karo.");
    }
  }

  async function hataDo() {
    if (!intent.undoTarget || phase === "writing" || phase === "stamped") return;
    setPhase("writing");
    setError(null);
    try {
      await api.voidEntry(intent.undoTarget.entryId, "voice undo", { token, index });
      setPhase("stamped");
      onWritten({ message: L("Voided the previous entry", "Hata diya: pichli entry void ho gayi") });
    } catch (e) {
      setPhase("idle");
      setError(locale === "en" ? hint(e, "entryFailed") : e instanceof ApiError ? e.hint : L("The entry could not be voided. Check the ledger before trying again.", "Entry nahi hati. Dobara try karo."));
    }
  }

  const ribbon = type ? (
    <span className={`ribbon ${type === "credit_given" ? "ribbon-owed" : "ribbon-received"}`} data-testid="ribbon">
      {type === "credit_given" ? L("Credit given", "Udhaar diya") : L("Payment received", "Paise mile")}
    </span>
  ) : null;

  const name = customerName ?? intent.customer ?? "Customer";

  return (
    <div className="parchi-wrap">
      <section className="parchi" aria-label={L("Review before recording", "Likhne se pehle dekho")} data-testid="parchi">
        <p className="hand" data-testid="echo">
          “{sourceText}”
        </p>

        {isEntry ? (
          <>
            <h3 className="mt-3 text-2xl">{L("Record this?", "Yeh likh doon?")}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="chip" style={{ cursor: "default" }} data-testid="customer-chip">
                {customerId ? name : intent.customer ? `${intent.customer} (${L("choose", "chuno")})` : L("Choose customer", "Customer chuno")}
              </span>
              {ribbon}
            </div>

            {type && customerId ? (
              <p className="mt-2 font-semibold" data-testid="direction-line">
                {directionLine(type, name, locale)}
              </p>
            ) : null}

            <div className="mt-3">
              <div className="money text-[44px] leading-none" data-testid="amount-digits">
                {amount ? formatINR(amount * 100) : L("Choose amount", "Amount chuno")}
              </div>
              {words ? (
                <p className="mt-1">
                  <span lang={locale === "en" ? "en" : "hi"} data-testid="amount-hi">
                    {L(words.en, words.hi)}
                  </span>
                  {locale !== "en" ? <span className="sr-only"> ({words.en})</span> : null}
                </p>
              ) : null}
            </div>

            {need("direction") && !preview ? (
              <div role="group" aria-label={L("Which way did the money move?", "Paise kis taraf gaye?")} className="mt-3">
                <p className="font-semibold">{L("Which way did the money move?", "Paise kis taraf gaye?")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="chip" aria-pressed={type === "credit_given"} onClick={() => { setType("credit_given"); resolve("direction"); }}>
                    {L("Credit given", "Udhaar diya")}
                  </button>
                  <button type="button" className="chip" aria-pressed={type === "payment_received"} onClick={() => { setType("payment_received"); resolve("direction"); }}>
                    {L("Payment received", "Paise mile")}
                  </button>
                </div>
              </div>
            ) : null}

            {need("which_customer") && !preview ? (
              <WhichChips
                question={L(`Which ${intent.customer?.split(" ")[0] ?? "customer"}?`, `Kaun ${intent.customer?.split(" ")[0] ?? "customer"}?`)}
                candidates={intent.candidates ?? []}
                selectedId={customerId}
                onPick={pick}
                extra={
                  intent.customer ? (
                    <button type="button" className="chip" onClick={pickNew}>
                      {L("New", "Naya")}: {intent.customer}
                    </button>
                  ) : null
                }
              />
            ) : null}

            {need("new_customer") && !has("new_customer") && !preview ? (
              <div className="mt-3">
                <button type="button" className="chip" onClick={pickNew} data-testid="new-customer">
                  {L("New customer", "Naya customer")}: {intent.customer}
                </button>
              </div>
            ) : null}

            {need("amount") && !preview ? (
              <div role="group" aria-label={L("Confirm the amount", "Amount pakka karo")} className="mt-3">
                <p className="font-semibold">{L("Confirm the amount", "Amount pakka karo")}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(intent.amountReadings ?? []).map((r) => (
                    <button key={r} type="button" className="chip" aria-pressed={amount === r} onClick={() => { setAmount(r); resolve("amount"); }}>
                      {formatINR(r * 100)}
                    </button>
                  ))}
                  <button type="button" className="chip" onClick={startEdit}>
                    {L("Enter it yourself", "Khud likho")}
                  </button>
                </div>
                {intent.reason ? <p className="mt-2">{L("Choose the intended amount, or enter it yourself. No entry is recorded until you confirm.", intent.reason)}</p> : null}
              </div>
            ) : null}

            {intent.duplicateWarning ? (
              <p className="mt-3 rounded-lg border-2 border-syahi bg-haldi p-3 font-semibold" role="alert" data-testid="duplicate-warning">
                {L("An identical entry was just recorded. Record it again?", "Abhi abhi yahi entry likhi thi. Phir se likhni hai?")}
              </p>
            ) : null}

            {editing && !preview ? (
              <div className="mt-3 grid gap-2">
                <label className="font-semibold" htmlFor={`amt-${index}`}>
                  {L("Amount (rupees)", "Amount (rupaye)")}
                </label>
                <input
                  id={`amt-${index}`}
                  className="input"
                  inputMode="numeric"
                  value={amount ?? ""}
                  onChange={(e) => {
                    const n = Number(e.target.value.replace(/\D/g, ""));
                    setAmount(Number.isFinite(n) && n > 0 ? n : undefined);
                    setTouched(true);
                    setSecondFor(null);
                    setPhase("idle");
                    resolve("amount");
                  }}
                />
                <label className="font-semibold" htmlFor={`cust-${index}`}>
                  Customer
                </label>
                <select
                  id={`cust-${index}`}
                  className="input"
                  value={customerId ?? ""}
                  onChange={(e) => {
                    const c = all?.find((x) => x.id === e.target.value);
                    if (c) {
                      setCustomerId(c.id);
                      setCustomerName(c.name);
                      setTouched(true);
                      resolve("which_customer");
                      resolve("new_customer");
                    }
                  }}
                >
                  <option value="">{L("Choose customer", "Customer chuno")}</option>
                  {(all ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button type="button" className="chip" aria-pressed={type === "credit_given"} onClick={() => { setType("credit_given"); setTouched(true); resolve("direction"); }}>
                    {L("Credit given", "Udhaar diya")}
                  </button>
                  <button type="button" className="chip" aria-pressed={type === "payment_received"} onClick={() => { setType("payment_received"); setTouched(true); resolve("direction"); }}>
                    {L("Payment received", "Paise mile")}
                  </button>
                </div>
              </div>
            ) : null}

            {!preview && phase !== "stamped" ? (
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary" onClick={likhDo} disabled={!ready || phase === "writing"} data-testid="likh-do">
                  {phase === "second" && secondFor === amount ? L(`Confirm ${formatINR((amount ?? 0) * 100)}?`, `Pakka ${formatINR((amount ?? 0) * 100)}?`) : L("Record entry", "Likh do")}
                </button>
                <button type="button" className="btn" onClick={() => (editing ? setEditing(false) : startEdit())} disabled={phase === "writing"}>
                  {editing ? L("Done editing", "Theek hai") : L("Edit", "Badlo")}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {intent.kind === "stock_low" ? (
          <>
            <h3 className="mt-3 text-2xl">{L("Record this?", "Yeh likh doon?")}</h3>
            <p className="mt-2 text-xl font-semibold" data-testid="stock-line">
              {L(`${intent.item} is low: save a note`, `${intent.item} kam hai, yaad rakha`)}
            </p>
            {phase !== "stamped" ? (
              <div className="mt-4">
                <button type="button" className="btn btn-primary" onClick={likhStock} disabled={phase === "writing"} data-testid="likh-do">
                  {L("Record entry", "Likh do")}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {intent.kind === "undo_last" ? (
          <>
            <h3 className="mt-3 text-2xl">{L("Void this entry?", "Yeh entry hata doon?")}</h3>
            {intent.undoTarget ? (
              <p className="mt-2 text-xl font-semibold" data-testid="undo-line">
                {directionLine(intent.undoTarget.type, intent.undoTarget.customerName, locale)}, {formatINR(intent.undoTarget.amountPaise)}
              </p>
            ) : (
              <p className="mt-2" data-testid="undo-none">
                {L("No entry available to void.", intent.reason ?? "Hatane ke liye koi entry nahi mili.")}
              </p>
            )}
            {intent.undoTarget && phase !== "stamped" ? (
              <div className="mt-4">
                <button type="button" className="btn btn-danger" onClick={hataDo} disabled={phase === "writing"} data-testid="hata-do">
                  {L("Void entry", "Hata do")}
                </button>
              </div>
            ) : null}
          </>
        ) : null}

        {intent.kind === "query_balance" ? (
          <>
            <h3 className="mt-3 text-2xl">{L("View balance", "Khata dekho")}</h3>
            {intent.balancePaise !== undefined ? (
              <p className="mt-2 text-xl font-semibold" data-testid="balance-answer">
                {intent.customer ? `${intent.candidates?.[0]?.name ?? intent.customer}: ` : ""}
                {intent.balancePaise > 0 ? L(`${formatINR(intent.balancePaise)} outstanding`, `${formatINR(intent.balancePaise)} baaki hai`) : intent.balancePaise < 0 ? L(`${formatINR(-intent.balancePaise)} advance`, `${formatINR(-intent.balancePaise)} advance hai`) : L("nothing outstanding", "kuch baaki nahi hai")}
              </p>
            ) : need("which_customer") ? (
              <WhichChips question={L(`Which ${intent.customer?.split(" ")[0] ?? "customer"}?`, `Kaun ${intent.customer?.split(" ")[0] ?? "customer"}?`)} candidates={intent.candidates ?? []} selectedId={customerId} onPick={(c) => { setCustomerId(c.customerId); setCustomerName(c.name); }} />
            ) : (
              <p className="mt-2">{L("Enter the customer name.", "Customer ka naam batao.")}</p>
            )}
            {customerId && intent.balancePaise === undefined ? (
              <p className="mt-2 text-sm">{L("Open the customer page to view their ledger.", "Khata kholne ke liye customer page par jao.")}</p>
            ) : null}
          </>
        ) : null}

        {intent.kind === "unknown" ? (
          <>
            <h3 className="mt-3 text-2xl">{L("Could not understand", "Samajh nahi aaya")}</h3>
            <p className="mt-2" data-testid="unknown-line">
              {L("Speak again or type a customer name, amount and whether you gave credit or received payment.", intent.reason ?? "Dobara bolo ya likho.")}
            </p>
          </>
        ) : null}

        {error ? (
          <p className="mt-3 border-2 border-syahi bg-haldi p-3 font-semibold" role="alert" data-testid="parchi-error">
            {error}
          </p>
        ) : null}

        {phase === "stamped" ? <Stamp /> : null}
      </section>
    </div>
  );
}
