import { cn } from "@/lib/utils";
import type { PaymentProviderButtonProps } from "./types";

export const PaymentProviderButton = ({
  provider,
  selected,
  label,
  ariaLabel,
  onSelect,
  selectedClassName,
  children,
}: PaymentProviderButtonProps) => {
  const isSelected = selected === provider;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      className={cn(
        "relative flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        isSelected
          ? selectedClassName
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]",
      )}
    >
      {children}
      <span
        className={cn(
          "flex-1 text-xs font-semibold tracking-wide",
          isSelected ? "" : "text-text",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "ml-auto flex-shrink-0 transition-transform duration-200",
          isSelected ? "scale-100" : "scale-0",
        )}
        aria-hidden="true"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6L9 17L4 12"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
};
