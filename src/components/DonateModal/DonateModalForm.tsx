"use client";

import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LiqPayMark, MonobankMark } from "./PaymentMarks";
import { PaymentProviderButton } from "./PaymentProviderButton";
import { formatUah } from "./utils";
import type { useDonateForm } from "./useDonateForm";

type DonateFormState = ReturnType<typeof useDonateForm>;

interface DonateModalFormProps {
  form: DonateFormState;
  presetAmountsUah: number[];
  settingsLoading: boolean;
}

export const DonateModalForm = ({
  form,
  presetAmountsUah,
  settingsLoading,
}: DonateModalFormProps) => {
  const t = useTranslations();
  const locale = useLocale();

  const {
    name,
    setName,
    preset,
    customStr,
    provider,
    setProvider,
    loading,
    error,
    clearError,
    nameExists,
    activeUah,
    areaPreview,
    handleCustomChange,
    selectPreset,
    handleSubmit,
  } = form;

  const presetCols =
    presetAmountsUah.length <= 2
      ? "grid-cols-2"
      : presetAmountsUah.length === 3
        ? "grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      aria-label={t("donateModal.dialogLabel")}
    >
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="donate-name"
          className="text-[10px] font-semibold uppercase tracking-wider text-text-muted"
        >
          {t("donateModal.nameLabel")}
        </label>
        <input
          id="donate-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={clearError}
          placeholder={t("donateModal.namePlaceholder")}
          autoComplete="name"
          className="rounded border border-border bg-white/5 px-3 py-2.5 text-sm text-text outline-none transition-colors duration-200 placeholder:text-text-muted focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
        />
        <p className="text-[9px] text-text-muted">{t("donateModal.nameHint")}</p>
      </div>

      {/* Presets */}
      {settingsLoading ? (
        <div className="flex flex-col gap-1.5" aria-hidden="true">
          <div className="h-2.5 w-24 animate-pulse rounded bg-surface-2" />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex h-10 animate-pulse items-center justify-center rounded border border-border bg-white/5"
              >
                <div className="h-2 w-10 rounded bg-border" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        presetAmountsUah.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              {t("donateModal.tiersTitle")}
            </span>
            <div className={cn("grid gap-2", presetCols)}>
              {presetAmountsUah.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  aria-pressed={preset === amt}
                  onClick={() => selectPreset(amt)}
                  className={cn(
                    "cursor-pointer rounded border py-2.5 text-xs font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                    preset === amt
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-white/10 bg-white/5 text-text-muted hover:border-primary/40 hover:text-text",
                  )}
                >
                  {t("donateModal.amountSummary", {
                    amount: formatUah(amt, locale),
                  })}
                </button>
              ))}
            </div>
          </div>
        )
      )}

      {/* Custom amount */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="donate-custom"
          className="text-[10px] font-semibold uppercase tracking-wider text-text-muted"
        >
          {t("donateModal.customLabel")}
        </label>
        <div className="flex items-center gap-2 rounded border border-border bg-white/5 px-3 py-2.5 transition-colors duration-200 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30">
          <input
            id="donate-custom"
            type="text"
            inputMode="numeric"
            value={customStr}
            onChange={(e) => handleCustomChange(e.target.value)}
            onBlur={clearError}
            placeholder={t("donateModal.customPlaceholder")}
            className="flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
          />
          <span className="flex-shrink-0 text-xs font-semibold text-text-muted">₴</span>
        </div>
      </div>

      {/* Area preview */}
      <AnimatePresence>
        {areaPreview && (
          <motion.div
            key="area-preview"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-lg border border-primary/20 bg-primary/8 px-4 py-3 text-center backdrop-blur-sm"
          >
            <p className="text-[10px] uppercase tracking-wider text-text-muted">
              {t("donateModal.areaLabel", { area: areaPreview })}
            </p>
            <p className="mt-1 font-display text-xl font-bold text-primary">
              {t("donateModal.amountSummary", {
                amount: formatUah(activeUah, locale),
              })}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment method */}
      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {t("donateModal.paymentMethod")}
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <PaymentProviderButton
            provider="monobank"
            selected={provider}
            label={t("donateModal.providers.monobank")}
            ariaLabel={t("donateModal.selectMonobank")}
            onSelect={() => setProvider("monobank")}
            selectedClassName="border-[#F7A600]/50 bg-[#F7A600]/10 text-[#F7A600]"
          >
            <MonobankMark />
          </PaymentProviderButton>
          <PaymentProviderButton
            provider="liqpay"
            selected={provider}
            label={t("donateModal.providers.liqpay")}
            ariaLabel={t("donateModal.selectLiqpay")}
            onSelect={() => setProvider("liqpay")}
            selectedClassName="border-[#39B54A]/50 bg-[#39B54A]/10 text-[#39B54A]"
          >
            <LiqPayMark />
          </PaymentProviderButton>
        </div>
      </fieldset>

      {/* Duplicate name warning */}
      <AnimatePresence>
        {nameExists && (
          <motion.p
            key="name-warning"
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-lg border border-yellow-400/30 bg-yellow-400/10 px-3 py-2 text-center text-[11px] text-yellow-300 backdrop-blur-sm"
          >
            {t("donateModal.nameDuplicateWarning", {
              name: name.trim(),
              amount: formatUah(nameExists.totalAmount, locale),
            })}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key={error}
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="rounded-lg border border-error/25 bg-error/8 px-3 py-2 text-center text-[11px] text-error backdrop-blur-sm"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <motion.button
        layout
        transition={{ duration: 0.18, ease: "easeOut" }}
        type="submit"
        disabled={loading || settingsLoading}
        className="glow-primary mt-1 w-full cursor-pointer rounded border border-primary bg-primary/15 py-3.5 text-xs font-bold uppercase tracking-wider text-primary transition-all duration-200 hover:bg-primary hover:text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("donateModal.submitting") : t("donateModal.submit")}
      </motion.button>
    </form>
  );
};
