import Link from "next/link";
import type { CustomerListItem } from "@/lib/client/api";
import { BalanceChip } from "./BalanceChip";

export function CustomerRow({ c }: { c: CustomerListItem }) {
  return (
    <li>
      <Link href={`/shop/${c.id}`} className="sticker flex min-h-[56px] items-center justify-between gap-3 px-4 py-2 no-underline" data-testid="customer-row">
        <span>
          <span className="block font-semibold">{c.name}</span>
          {c.area ? <span className="block text-base">{c.area}</span> : null}
        </span>
        <BalanceChip paise={c.balancePaise} />
      </Link>
    </li>
  );
}
