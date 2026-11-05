import { headers } from "next/headers";
import AdminApp from "../../AdminApp";

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
  await headers();
  const { id } = await params;
  return <AdminApp initialLead={/^[0-9a-f-]{36}$/i.test(id) ? id : undefined} />;
}
