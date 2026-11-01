import { Reports } from "@/components/Reports";
export default async function StatementPage({ params }: { params: Promise<{ id: string }> }) { return <Reports customerId={(await params).id} />; }
