"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Wallet, Settings, LogOut } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/admin/expenses", label: "Витрати", icon: Wallet },
  { href: "/admin/settings", label: "Налаштування", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col border-r"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="px-5 py-5 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="text-base font-bold tracking-widest font-display" style={{ color: "var(--color-primary)" }}>
          КУПОЛ
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
          Адмін
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: active ? "var(--color-surface-2)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text-dim)",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors hover:opacity-80"
          style={{ color: "var(--color-text-muted)" }}
        >
          <LogOut size={16} />
          Вийти
        </button>
      </div>
    </aside>
  );
}
