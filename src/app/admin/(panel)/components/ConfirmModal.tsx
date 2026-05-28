"use client";

import { ModalWrapper } from "./ModalWrapper";

export function ConfirmModal({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ModalWrapper onClose={onCancel} title="Підтвердження">
      <p className="text-sm mb-6" style={{ color: "var(--color-text-dim)" }}>
        {message}
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 rounded-lg text-sm border"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-dim)" }}
        >
          Скасувати
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--color-error)", color: "#fff" }}
        >
          Видалити
        </button>
      </div>
    </ModalWrapper>
  );
}
