import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SuccessPoller } from "./SuccessPoller";

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function DonateSuccessPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  if (!id) notFound();

  const t = await getTranslations();

  let donation: { status: string; name: string; squareM2: number; amount: number } | null = null;
  try {
    donation = await prisma.donation.findUnique({
      where: { id },
      select: { status: true, name: true, squareM2: true, amount: true },
    });
  } catch {
    // DB unavailable — show pending state
  }

  if (!donation) notFound();

  const amountUah = donation.amount / 100;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="w-full max-w-md rounded border border-border bg-surface p-8">
        {donation.status === "paid" ? (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10 mx-auto">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-primary">
              {t("success.title")}
            </p>
            <h1 className="mb-2 font-display text-2xl font-bold uppercase text-text">
              {donation.name}
            </h1>
            <p className="mb-4 text-sm text-text-muted">{t("success.subtitle")}</p>
            <div className="rounded border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs text-text-muted">{t("success.donorArea", { area: donation.squareM2.toFixed(2) })}</p>
              <p className="mt-1 text-xl font-bold text-primary">
                {amountUah.toLocaleString("uk-UA")} ₴
              </p>
            </div>
            <a
              href="/"
              className="mt-6 block rounded border border-primary bg-primary/15 py-3 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary hover:text-bg"
            >
              На головну
            </a>
          </>
        ) : donation.status === "cancelled" ? (
          <>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 mx-auto">
              <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mb-2 font-display text-xl font-bold uppercase text-text">Оплату скасовано</h1>
            <p className="mb-6 text-sm text-text-muted">Спробуйте ще раз або оберіть інший метод оплати.</p>
            <a
              href="/"
              className="block rounded border border-border py-3 text-xs font-bold uppercase tracking-wider text-text-muted transition-all hover:border-primary hover:text-primary"
            >
              Повернутись
            </a>
          </>
        ) : (
          // pending — показуємо спінер і polling
          <SuccessPoller donationId={id} name={donation.name} />
        )}
      </div>
    </div>
  );
}
