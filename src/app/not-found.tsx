import { Copy } from "@/components/LocaleProvider";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md gap-4 px-4 py-10">
      <h1 className="text-[40px] leading-tight"><Copy en="Page not found" hi="Yeh page nahi mila" /></h1>
      <Link href="/" className="btn btn-primary w-fit">
        <Copy en="Back to home" hi="Shuru par jao" />
      </Link>
    </div>
  );
}
