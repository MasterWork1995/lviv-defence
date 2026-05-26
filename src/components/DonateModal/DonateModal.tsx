"use client";

import { useTranslations } from "next-intl";
import { DonateModalForm } from "./DonateModalForm";
import type { DonateModalProps } from "./types";
import { useDonateForm } from "./useDonateForm";
import { useDonateSettings } from "./useDonateSettings";

const LIQPAY_CHECKOUT_URL = "https://www.liqpay.ua/api/3/checkout";

export const DonateModal = ({ isOpen, onClose }: DonateModalProps) => {
  const t = useTranslations();
  const {
    m2PerUah,
    presetAmountsUah,
    loading: settingsLoading,
  } = useDonateSettings(isOpen);
  const form = useDonateForm({ m2PerUah });

  if (!isOpen) return null;

  return (
    <>
      <form
        ref={form.liqpayFormRef}
        method="POST"
        action={LIQPAY_CHECKOUT_URL}
        className="hidden"
      >
        <input ref={form.liqpayDataRef} type="hidden" name="data" />
        <input ref={form.liqpaySigRef} type="hidden" name="signature" />
      </form>

      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="absolute inset-0 bg-bg/85 backdrop-blur-md"
          aria-hidden="true"
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="donate-modal-title"
          aria-describedby="donate-modal-desc"
          className="relative max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-border bg-surface p-4 shadow-2xl sm:p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 cursor-pointer rounded p-1 text-text-muted transition-colors duration-200 hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t("common.close")}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-primary">
            {t("common.donate")}
          </p>
          <h2
            id="donate-modal-title"
            className="font-display text-xl font-bold uppercase tracking-wide text-text"
          >
            {t("donateModal.title")}
          </h2>
          <p
            id="donate-modal-desc"
            className="mb-6 mt-1 text-xs leading-relaxed text-text-muted"
          >
            {t("donateModal.subtitle")}
          </p>

          <DonateModalForm
            form={form}
            presetAmountsUah={presetAmountsUah}
            settingsLoading={settingsLoading}
          />
        </div>
      </div>
    </>
  );
};
