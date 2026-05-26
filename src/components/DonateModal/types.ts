import type { ReactNode } from "react";

export interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type PaymentProvider = "monobank" | "liqpay";

export interface PaymentProviderButtonProps {
  provider: PaymentProvider;
  selected: PaymentProvider;
  label: string;
  ariaLabel: string;
  onSelect: () => void;
  /** Tailwind classes applied to the button when this provider is selected */
  selectedClassName: string;
  children: ReactNode;
}

export interface DonateApiResponse {
  invoiceUrl?: string;
  liqpayData?: string;
  liqpaySignature?: string;
  error?: string;
  retryAfterSeconds?: number;
}
