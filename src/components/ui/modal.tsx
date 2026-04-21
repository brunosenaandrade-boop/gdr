"use client";

import { cn } from "@/lib/utils";
import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Esconde o botão X e desativa fechamento via ESC/backdrop. Útil em fluxos obrigatórios (onboarding). */
  hideClose?: boolean;
};

const sizeStyles = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

function Modal({ open, onClose, title, description, children, className, size = "md", hideClose = false }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (hideClose) return;
      if (e.key === "Escape") onClose();
    },
    [onClose, hideClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={hideClose ? undefined : onClose}
      />
      <div
        className={cn(
          "relative w-full rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl animate-in",
          sizeStyles[size],
          className,
        )}
      >
        {(title || description) && (
          <div className="mb-4 pr-8">
            {title && <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
        )}
        {!hideClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}

export { Modal };
