"use client";

import { useEffect, useCallback, type ReactNode } from "react";

interface OverlayShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function OverlayShell({ open, onClose, children }: OverlayShellProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="overlay-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ opacity: 1, pointerEvents: "auto" }}
    >
      <div className="ov-panel">
        <button className="ov-close" onClick={onClose} aria-label="关闭">&times;</button>
        <div className="ov-content">{children}</div>
      </div>
    </div>
  );
}
