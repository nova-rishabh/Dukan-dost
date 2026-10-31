import type { Metadata } from "next";
import { CustomerView } from "@/components/CustomerView";

export const metadata: Metadata = { title: "Khata" };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerView id={id} />;
}
