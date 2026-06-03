"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp,
  Heart,
  Eye,
  Wrench,
  Plus,
  EyeOff,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { adminFetch } from "@/lib/admin-fetch";
import AdminCharts from "./AdminCharts";
import { StatCard } from "./components/StatCard";
import { ConfirmModal } from "./components/ConfirmModal";
import { ManualDonationModal } from "./components/ManualDonationModal";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stats {
  totalDonations: number;
  paidDonations: number;
  pendingDonations: number;
  hiddenDonations: number;
  manualDonations: number;
  totalRaised: number;
  totalExpenses: number;
  expensesCount: number;
  goal: number;
  goalPercent: number;
}

interface Donation {
  id: string;
  name: string;
  amount: number;
  squareM2: number;
  sector: number | null;
  status: string;
  provider: string;
  isHidden: boolean;
  isManual: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUah(n: number) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtM2(m2: number) {
  if (m2 >= 1_000_000) return `${(m2 / 1_000_000).toFixed(2)} км²`;
  return `${m2.toFixed(2)} м²`;
}

const STATUS_COLORS: Record<string, string> = {
  paid: "var(--color-success)",
  pending: "var(--color-warning)",
  cancelled: "var(--color-error)",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [hiddenFilter, setHiddenFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [chartsKey, setChartsKey] = useState(0);
  const refreshCharts = useCallback(() => setChartsKey((k) => k + 1), []);

  const loadStats = useCallback(() => {
    adminFetch("/api/admin/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadDonations = useCallback(async () => {
    setLoadingDonations(true);
    const q = new URLSearchParams({ page: String(page) });
    if (search) q.set("q", search);
    if (statusFilter) q.set("status", statusFilter);
    if (hiddenFilter) q.set("hidden", hiddenFilter);
    const res = await adminFetch(`/api/admin/donations?${q}`);
    if (res.ok) {
      const data = await res.json();
      setDonations(data.donations);
      setPagination(data.pagination);
    }
    setLoadingDonations(false);
  }, [page, search, statusFilter, hiddenFilter]);

  useEffect(() => {
    loadDonations();
  }, [loadDonations]);

  async function toggleHidden(id: string, current: boolean) {
    await adminFetch(`/api/admin/donations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: !current }),
    });
    loadDonations();
    loadStats();
    refreshCharts();
  }

  async function changeStatus(id: string, status: string) {
    await adminFetch(`/api/admin/donations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadDonations();
    loadStats();
    refreshCharts();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await adminFetch(`/api/admin/donations/${deleteId}`, { method: "DELETE" });
    setDeleteId(null);
    loadDonations();
    loadStats();
    refreshCharts();
  }

  return (
    <div className="w-full">
      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Зібрано"
          value={stats ? fmtUah(stats.totalRaised) : "—"}
          sub={stats ? `${stats.goalPercent}% від цілі` : undefined}
          icon={TrendingUp}
          accent="var(--color-success)"
        />
        <StatCard
          label="Донати (paid)"
          value={stats ? String(stats.paidDonations) : "—"}
          sub={stats ? `${stats.pendingDonations} pending` : undefined}
          icon={Heart}
          accent="var(--color-primary)"
        />
        <StatCard
          label="Приховано"
          value={stats ? String(stats.hiddenDonations) : "—"}
          sub="потребують перевірки"
          icon={Eye}
          accent="var(--color-warning)"
        />
        <StatCard
          label="Витрати"
          value={stats ? fmtUah(stats.totalExpenses) : "—"}
          sub={stats ? `${stats.expensesCount} записів` : undefined}
          icon={Wrench}
          accent="var(--color-error)"
        />
      </div>

      {/* Charts */}
      <AdminCharts refreshKey={chartsKey} />

      {/* Header + filters */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-semibold font-display"
          style={{ color: "var(--color-text)" }}
        >
          Донати
          {pagination.total > 0 && (
            <span
              className="ml-2 text-sm font-normal"
              style={{ color: "var(--color-text-muted)" }}
            >
              ({pagination.total})
            </span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: "var(--color-primary)",
            color: "var(--color-bg)",
          }}
        >
          <Plus size={15} /> Додати вручну
        </button>
      </div>

      <div
        className="flex flex-wrap gap-3 mb-4 p-4 rounded-xl border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <input
          type="text"
          placeholder="Пошук за ім'ям..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[180px] rounded-lg px-3 py-2 text-sm border outline-none"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg px-3 py-2 text-sm border outline-none"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <option value="">Всі статуси</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={hiddenFilter}
          onChange={(e) => {
            setHiddenFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg px-3 py-2 text-sm border outline-none"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          <option value="">Видимість: всі</option>
          <option value="false">Видимі</option>
          <option value="true">Приховані</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border overflow-hidden relative"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        {loadingDonations && (
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                {[
                  "Донор",
                  "Сума",
                  "Площа",
                  "Статус",
                  "Провайдер",
                  "Видимість",
                  "Дата",
                  "Дії",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium tracking-wide uppercase whitespace-nowrap"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loadingDonations && donations.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Нічого не знайдено
                  </td>
                </tr>
              )}
              {donations.map((d) => (
                <tr
                  key={d.id}
                  className="border-b last:border-0 hover:bg-[var(--color-surface-2)] transition-colors"
                  style={{ borderColor: "var(--color-border-dim)" }}
                >
                  <td
                    className="px-4 py-3"
                    style={{ color: "var(--color-text)" }}
                  >
                    {d.name}
                    {d.isManual && (
                      <span
                        className="ml-1.5 text-xs px-1 py-0.5 rounded"
                        style={{
                          background: "var(--color-surface-3)",
                          color: "var(--color-text-dim)",
                        }}
                      >
                        manual
                      </span>
                    )}
                  </td>
                  <td
                    className="px-4 py-3 font-medium whitespace-nowrap"
                    style={{ color: "var(--color-success)" }}
                  >
                    {fmtUah(d.amount)}
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap"
                    style={{ color: "var(--color-text-dim)" }}
                  >
                    {fmtM2(d.squareM2)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={d.status}
                      onChange={(e) => changeStatus(d.id, e.target.value)}
                      className="rounded px-2 py-1 text-xs border outline-none"
                      style={{
                        background: "var(--color-surface-2)",
                        borderColor: "var(--color-border)",
                        color: STATUS_COLORS[d.status] ?? "var(--color-text)",
                      }}
                    >
                      <option value="paid">paid</option>
                      <option value="pending">pending</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {d.provider}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleHidden(d.id, d.isHidden)}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded transition-opacity hover:opacity-80"
                      style={{
                        background: d.isHidden
                          ? "var(--color-warning)20"
                          : "var(--color-success)20",
                        color: d.isHidden
                          ? "var(--color-warning)"
                          : "var(--color-success)",
                      }}
                    >
                      {d.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                      {d.isHidden ? "hidden" : "visible"}
                    </button>
                  </td>
                  <td
                    className="px-4 py-3 whitespace-nowrap text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {new Date(d.createdAt).toLocaleDateString("uk-UA")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setDeleteId(d.id)}
                      className="p-1.5 rounded transition-opacity hover:opacity-80"
                      style={{ color: "var(--color-error)" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div
            className="flex items-center justify-between px-4 py-3 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Всього: {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded disabled:opacity-30"
                style={{ color: "var(--color-text-dim)" }}
              >
                <ChevronLeft size={16} />
              </button>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-dim)" }}
              >
                {page} / {pagination.totalPages}
              </span>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded disabled:opacity-30"
                style={{ color: "var(--color-text-dim)" }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <ManualDonationModal
          onClose={() => setShowModal(false)}
          onSaved={() => {
            loadDonations();
            loadStats();
            refreshCharts();
          }}
        />
      )}
      {deleteId && (
        <ConfirmModal
          message="Видалити цей донат? Дію не можна скасувати."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
