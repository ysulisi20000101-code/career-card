"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { PresentationOverlay, PresentationTheme } from "@/lib/presentation/types";

interface OverlayPanelProps {
  overlay: PresentationOverlay | null;
  theme: PresentationTheme;
  onClose: () => void;
}

export function OverlayPanel({ overlay, theme, onClose }: OverlayPanelProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (overlay) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [overlay, handleKeyDown]);

  return (
    <AnimatePresence>
      {overlay && (
        <motion.div
          key={overlay.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(92vw, 960px)",
              maxHeight: "88vh",
              overflowY: "auto",
              background: theme.colors.surface,
              borderRadius: theme.radius.lg,
              border: `1px solid ${theme.colors.borderStrong}`,
              boxShadow: "0 8px 48px rgba(0,0,0,.18)",
              padding: "32px 28px",
            }}
          >
            <button
              onClick={onClose}
              aria-label="关闭"
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                border: "none",
                background: "transparent",
                color: theme.colors.text3,
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: theme.colors.gold, marginBottom: 10 }}>
              {overlay.kind.replace(/-/g, " ")}
            </div>
            <h3 style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 800, color: theme.colors.text, marginBottom: 16, lineHeight: 1.15 }}>
              {overlay.title}
            </h3>
            <div style={{ fontSize: 13, color: theme.colors.text2, lineHeight: 1.7, maxWidth: 720 }}>
              {overlay.body}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
