import { ShopNav } from "@/components/ShopNav";
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl gap-2 md:px-6">
    <aside className="hidden w-52 shrink-0 md:block print:hidden"><div className="sticky top-4 pt-4"><ShopNav /></div></aside>
    <div className="min-w-0 flex-1 pb-10">{children}</div>
  </div>;
}
