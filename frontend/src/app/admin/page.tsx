import { headers } from "next/headers";
import AdminApp from "./AdminApp";

// CSP nonce uchun dinamik render
export default async function AdminPage() {
  await headers();
  return <AdminApp />;
}
