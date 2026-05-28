"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { DonateApiResponse, PaymentProvider } from "./types";
import { formatArea } from "./utils";

interface UseDonateFormOptions {
  m2PerUah: number;
}

export const useDonateForm = ({ m2PerUah }: UseDonateFormOptions) => {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [preset, setPreset] = useState<number | null>(null);
  const [customStr, setCustomStr] = useState("");
  const [provider, setProvider] = useState<PaymentProvider>("monobank");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [nameExists, setNameExists] = useState<{ totalAmount: number } | null>(null);

  const liqpayFormRef = useRef<HTMLFormElement>(null);
  const liqpayDataRef = useRef<HTMLInputElement>(null);
  const liqpaySigRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameExists(null);
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/donations/check-name?name=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) setNameExists({ totalAmount: data.totalAmount });
        }
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [name]);

  const activeUah = preset ?? (customStr ? parseInt(customStr, 10) : 0);
  const areaPreview =
    activeUah > 0 && m2PerUah > 0
      ? formatArea(activeUah * m2PerUah, t)
      : "";

  const handleCustomChange = (val: string) => {
    setCustomStr(val.replace(/\D/g, ""));
    setPreset(null);
  };

  const selectPreset = (amount: number) => {
    setPreset(amount);
    setCustomStr("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError(t("donateModal.errorName"));
      return;
    }
    if (!activeUah || activeUah < 1) {
      setError(t("donateModal.errorMinAmount"));
      return;
    }

    setLoading(true);
    try {
      let res: Response;
      try {
        res = await fetch("/api/donate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            amountUah: activeUah,
            provider,
          }),
        });
      } catch {
        setError(t("errors.network"));
        return;
      }

      const data = (await res.json()) as DonateApiResponse;

      if (!res.ok) {
        if (res.status === 429) {
          const minutes = data.retryAfterSeconds
            ? Math.ceil(data.retryAfterSeconds / 60)
            : 10;
          setError(t("errors.tooManyRequests", { minutes }));
        } else if (res.status === 503) {
          setError(t("errors.paymentNotConfigured"));
        } else if (res.status === 422) {
          setError(t("errors.validation"));
        } else if (res.status >= 500) {
          setError(t("errors.server"));
        } else {
          setError(t("common.error"));
        }
        return;
      }

      if (provider === "monobank" && data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
        return;
      }

      if (provider === "liqpay" && data.liqpayData && data.liqpaySignature) {
        liqpayDataRef.current!.value = data.liqpayData;
        liqpaySigRef.current!.value = data.liqpaySignature;
        liqpayFormRef.current!.submit();
        return;
      }

      setError(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    preset,
    customStr,
    provider,
    setProvider,
    loading,
    error,
    clearError: () => setError(""),
    nameExists,
    activeUah,
    areaPreview,
    handleCustomChange,
    selectPreset,
    handleSubmit,
    liqpayFormRef,
    liqpayDataRef,
    liqpaySigRef,
  };
};
