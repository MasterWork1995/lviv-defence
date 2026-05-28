"use client";

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--color-text-dim)" }}
      >
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}
