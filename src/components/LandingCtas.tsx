"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Me } from "@/lib/client/api";

/** The open demo offers the sample shop; a real shop offers login or setup. */
export function LandingCtas() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);
  const real = !!me?.authRequired;
  return (
    <div className="mt-6 flex min-h-[48px] flex-wrap gap-3">
      {!real ? (
        <Link href="/try" className="btn btn-primary" data-testid="try-sample">
          Sample dukaan try karo
        </Link>
      ) : null}
      <Link href={real && !me?.loggedIn ? (me?.setupNeeded ? "/setup" : "/login") : "/shop"} className={real ? "btn btn-primary" : "btn"} data-testid="landing-shop">
        {real && !me?.loggedIn ? (me?.setupNeeded ? "Dukaan set karo" : "Login") : "Meri dukaan"}
      </Link>
    </div>
  );
}
