"use client";

import { useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { ModalWrapper } from "../components/ModalWrapper";
import { Field } from "../components/Field";

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  createdAt: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  equipment: "Обладнання",
  services: "Послуги",
  other: "Інше",
};

export function ExpenseModal({
  expense,
  onClose,
  onSaved,
}: {
  expense?: Expense;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!expense;
  const [description, setDescription] = useState(expense?.description ?? "");
  const [category, setCategory] = useState(expense?.category ?? "equipment");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = isEdit ? `/api/admin/expenses/${expense!.id}` : "/api/admin/expenses";
    const res = await adminFetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: description.trim(), category, amount: parseFloat(amount) }),
    });

    if (res.ok) {
      onSaved();
      onClose();
    } else {
      const data = await res.json();
      setError(data.error ?? "Помилка");
    }
    setLoading(false);
  }

  return (
    <ModalWrapper onClose={onClose} title={isEdit ? "Редагувати витрату" : "Нова витрата"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Опис" required>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="admin-input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Категорія" required>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="admin-input"
            >
              <option value="equipment">Обладнання</option>
              <option value="services">Послуги</option>
              <option value="other">Інше</option>
            </select>
          </Field>

          <Field label="Сума (грн)" required>
            <input
              type="number"
              step="1"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="admin-input"
            />
          </Field>
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--color-error)" }}>{error}</p>
        )}

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm border"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)" }}
          >
            Скасувати
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-medium disabled:opacity-60"
            style={{ background: "var(--color-primary)", color: "var(--color-bg)" }}
          >
            {loading ? "Збереження..." : isEdit ? "Зберегти" : "Додати"}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
}
