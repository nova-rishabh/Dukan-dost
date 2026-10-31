import type { Metadata } from "next";
import { ShopHome } from "@/components/ShopHome";

export const metadata: Metadata = { title: "Meri dukaan" };

export default function ShopPage() {
  return <ShopHome />;
}
