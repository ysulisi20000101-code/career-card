"use client";

import { useEffect, useCallback, useRef, type ReactNode } from "react";

interface OverlayShellProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function OverlayShell({ open, onClose, children }: OverlayShellProps) {
  const previousOverflowRef = useRef<string | null>(null);
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousOverflowRef.current !== null) {
        document.body.style.overflow = previousOverflowRef.current;
        previousOverflowRef.current = null;
      }
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="overlay-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(0, 0, 0, .55)",
        opacity: 1,
        pointerEvents: "auto",
      }}
    >
      <div
        className="ov-panel"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "min(92vw, 960px)",
          maxHeight: "88vh",
          overflowY: "auto",
          borderRadius: 16,
          padding: "28px 32px",
          background: "#fff",
          boxShadow: "0 8px 48px rgba(0, 0, 0, .18)",
        }}
      >
        <button
          className="ov-close"
          onClick={onClose}
          aria-label="关闭"
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            borderRadius: "50%",
            background: "rgba(0, 0, 0, .04)",
            color: "var(--t3, #5e6b7a)",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 16,
          }}
        >
          &times;
        </button>
        <div className="ov-content" style={{ color: "var(--t, #1a1d27)" }}>{children}</div>
      </div>
    </div>
  );
}
