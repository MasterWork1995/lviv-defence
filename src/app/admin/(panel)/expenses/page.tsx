"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import { FinancialOverview } from "./FinancialOverview";
import { ExpenseModal, Expense, CATEGORY_LABELS } from "./ExpenseModal";
import { ConfirmModal } from "../components/ConfirmModal";

function fmtUah(n: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [firstLoad, setFirstLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRaised, setTotalRaised] = useState<number>(0);
  const [editItem, setEditItem] = useState<Expense | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    const [expRes, statsRes] = await Promise.all([
      adminFetch("/api/admin/expenses"),
      adminFetch("/api/admin/stats"),
    ]);
    if (expRes.ok) {
      const data = await expRes.json();
      setExpenses(data.expenses);
    }
    if (statsRes.ok) {
      const s = await statsRes.json();
      setTotalRaised(s.totalRaised ?? 0);
    }
    setRefreshing(false);
    setFirstLoad(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalRaised - totalSpent;

  async function confirmDelete() {
    if (!deleteId) return;
    await adminFetch(`/api/admin/expenses/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold font-display"
            style={{ color: "var(--color-text)" }}
          >
            Витрати
          </h1>
          {expenses.length > 0 && (
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Загалом:{" "}
              <span style={{ color: "var(--color-error)" }}>
                {fmtUah(totalSpent)}
              </span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-bg)",
          }}
        >
          <Plus size={15} /> Додати витрату
        </button>
      </div>

      {!firstLoad && (
        <FinancialOverview
          totalRaised={totalRaised}
          totalSpentUah={totalSpent}
          balance={balance}
        />
      )}

      <div
        className="rounded-xl border overflow-hidden relative"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {refreshing && !firstLoad && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center rounded-xl"
            style={{ background: "var(--color-excadra-55)" }}
          >
            <Loader2
              size={28}
              className="animate-spin"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {["Опис", "Категорія", "Сума", "Дата", "Дії"].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3 text-left text-xs font-medium tracking-wide uppercase"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {firstLoad ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Завантаження...
                </td>
              </tr>
            ) : expenses.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-8 text-center"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Витрат ще немає
                </td>
              </tr>
            ) : (
              expenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  style={{ borderColor: "var(--color-border-dim)" }}
                >
                  <td
                    className="px-5 py-3"
                    style={{ color: "var(--color-text)" }}
                  >
                    {e.description}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "var(--color-surface-3)",
                        color: "var(--color-text-dim)",
                      }}
                    >
                      {CATEGORY_LABELS[e.category] ?? e.category}
                    </span>
                  </td>
                  <td
                    className="px-5 py-3 font-medium whitespace-nowrap"
                    style={{ color: "var(--color-error)" }}
                  >
                    {fmtUah(e.amount)}
                  </td>
                  <td
                    className="px-5 py-3 text-xs whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {new Date(e.createdAt).toLocaleDateString("uk-UA")}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditItem(e)}
                        className="p-1.5 rounded transition-opacity hover:opacity-80"
                        style={{ color: "var(--color-primary)" }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteId(e.id)}
                        className="p-1.5 rounded transition-opacity hover:opacity-80"
                        style={{ color: "var(--color-error)" }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <ExpenseModal onClose={() => setShowAdd(false)} onSaved={load} />
      )}
      {editItem && (
        <ExpenseModal
          expense={editItem}
          onClose={() => setEditItem(null)}
          onSaved={load}
        />
      )}
      {deleteId && (
        <ConfirmModal
          message="Видалити цю витрату? Дію не можна скасувати."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
