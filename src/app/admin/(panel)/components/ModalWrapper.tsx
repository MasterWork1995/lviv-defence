"use client";

export function ModalWrapper({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--color-excadra-72)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 border"
        style={{
          background: "var(--color-surface)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--color-text)" }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: "var(--color-text-muted)" }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
