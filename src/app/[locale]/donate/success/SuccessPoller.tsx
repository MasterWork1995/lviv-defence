"use client";

import { useEffect } from "react";

interface Props {
  donationId: string;
  name: string;
}

export function SuccessPoller({ donationId, name }: Props) {
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/donation-status?id=${donationId}`);
        if (!res.ok) return;
        const { status } = await res.json() as { status: string };
        if (status === "paid" || status === "cancelled") {
          window.location.reload();
        }
      } catch {
        // мовчки
      }
    }, 3000);
    return () => clearInterval(id);
  }, [donationId]);

  return (
    <>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 mx-auto">
        <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <h1 className="mb-2 font-display text-xl font-bold uppercase text-text">
        Очікуємо підтвердження
      </h1>
      <p className="mb-1 text-sm text-text-muted">{name}</p>
      <p className="text-xs text-text-muted">Сторінка оновиться автоматично після підтвердження оплати.</p>
    </>
  );
}
