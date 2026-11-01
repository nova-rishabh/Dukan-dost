"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Me } from "@/lib/client/api";

/** Demo shop: the two sample links. Real shop: login, or the shop and logout. */
export function NavBar() {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    api
      .me()
      .then(setMe)
      .catch(() => setMe(null));
  }, []);

  async function logout() {
    try {
      await api.logout();
    } finally {
      window.location.assign("/login");
    }
  }

  return (
    <nav aria-label="Main" className="flex min-h-[48px] w-full flex-wrap items-center gap-2 md:w-auto">
      {!me || !me.authRequired ? (
        <>
          <Link href="/try" className="btn">
            Sample dukaan
          </Link>
          <Link href="/shop" className="btn btn-primary">
            Meri dukaan
          </Link>
        </>
      ) : me.loggedIn ? (
        <>
          <Link href="/shop" className="btn btn-primary">
            Meri dukaan
          </Link>
          <button type="button" className="btn" onClick={logout} data-testid="logout">
            Logout
          </button>
        </>
      ) : (
        <Link href={me.setupNeeded ? "/setup" : "/login"} className="btn btn-primary" data-testid="nav-login">
          {me.setupNeeded ? "Dukaan set karo" : "Login"}
        </Link>
      )}
    </nav>
  );
}
