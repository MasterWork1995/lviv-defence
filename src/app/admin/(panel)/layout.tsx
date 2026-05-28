import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AdminSidebar from "./AdminSidebar";

export const metadata = { title: "Адмінпанель — Купол Львівщини" };

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session.isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-bg)" }}>
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-y-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
