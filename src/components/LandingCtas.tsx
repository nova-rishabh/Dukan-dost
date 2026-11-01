"use client";

import { useCopy } from "./LocaleProvider";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Me } from "@/lib/client/api";

/** The open demo offers the sample shop; a real shop offers login or setup. */
export function LandingCtas() {
  const L = useCopy();
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);
  const real = !!me?.authRequired;
  return (
    <div className="btn-grid mt-6">
      {(
        <Link href="/try" className="btn btn-primary" data-testid="try-sample">
          {L("Try sample shop", "Sample dukaan try karo")}
        </Link>
      )}
      <Link href={real && !me?.loggedIn ? "/signup" : "/shop"} className={real ? "btn btn-primary" : "btn"} data-testid="landing-shop">
        {real && !me?.loggedIn ? L("Create account", "Naya account") : L("My shop", "Meri dukaan")}
      </Link>
    </div>
  );
}
