import { ShopNav } from "@/components/ShopNav";
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <><div className="mx-auto max-w-5xl px-4 py-3 md:px-8"><ShopNav /></div>{children}</>;
}
