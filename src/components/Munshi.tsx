import Image from "next/image";

/** Decorative: the adjacent text always explains the state. Owner-supplied artwork. */
export function Munshi({ pose = "welcome" }: { pose?: "welcome" | "retry" | "empty" }) {
  return <Image src={`/munshi/${pose}.png`} alt="" width={96} height={144} className="h-36 w-24 shrink-0 object-contain" />;
}
