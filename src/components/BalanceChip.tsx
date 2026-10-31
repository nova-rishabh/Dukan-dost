import { formatINR } from "@/lib/money";

/** Owed is Sindoor, advance is Pista. Colour never carries the meaning alone: there is always a word. */
export function BalanceChip({ paise }: { paise: number }) {
  if (paise === 0) return <span className="ribbon bg-safed money">Hisaab saaf</span>;
  if (paise > 0)
    return (
      <span className="ribbon ribbon-owed money" data-testid="balance-chip">
        Baaki {formatINR(paise)}
      </span>
    );
  return (
    <span className="ribbon ribbon-received money" data-testid="balance-chip">
      Advance {formatINR(-paise)}
    </span>
  );
}
